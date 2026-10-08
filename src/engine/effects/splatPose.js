import {byId} from "../utils";
import * as faceMeshModule from '@mediapipe/face_mesh';
/**
 * @description
 * SplatFaceEffect
 * Maps MediaPipe FaceLandmarker 478 landmarks into a splat point cloud.
 * Follows FlameEmitter interface:
 *   updateInstanceData(baseModelMatrix) — called automatically by main loop
 *   render(pass, mesh, viewProjMatrix, dt) — no-op, splat renders itself
 * 
 * @filename
 * splatFace.js
 *
 * @Licence
 * This Source Code Form is subject to the terms of the
 * Mozilla Public License, v. 2.0.
 * If a copy of the MPL was not distributed with this file,
 * You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2026 Nikola Lukić zlatnaspirala@gmail.com
 */
export class SplatPoseEffect {
  static _pipelineCache = new WeakMap();
  constructor(device, format, cameraBuffer, splatLayer, opts = {}) {
    this.device = device;
    this.splatLayer = splatLayer;
    this.enabled = true;
    this.time = 0;
    this.scale = opts.scale ?? 3.0;
    this.clusterRadius = opts.clusterRadius ?? 1.0;
    this.origin = opts.origin ?? [0, 1.6, 0];
    this.mirrorX = opts.mirrorX ?? true;
    this._videoElement = byId('auto-video');
    this._landmarks = null;

    const POSE_EDGES =
      faceMeshModule.POSE_CONNECTIONS ||
      faceMeshModule.PoseLandmarker?.POSE_CONNECTIONS ||
      faceMeshModule.default?.POSE_CONNECTIONS ||
      faceMeshModule.default?.PoseLandmarker?.POSE_CONNECTIONS;

    // POSE_CONNECTIONS is a skeleton, so it has few closed triangles.
    // Extra edges close the torso (and anything else you pass through opts.fillEdges).
    const FILL_EDGES = opts.fillEdges ?? [[11, 24], [12, 23]];
    this.POSE_TRIANGLES = this.extractTrianglesFromTessellation([...(POSE_EDGES || []), ...FILL_EDGES]);

    this.pipeline = splatLayer.pipeline;
    const n = splatLayer.vertexCount;
    this._posCPU = new Float32Array(n * 3);
    this._uvCPU = new Float32Array(n * 6 * 2);
    this._clusterIdx = new Uint16Array(n);
    this._offsetX = new Float32Array(n);
    this._offsetY = new Float32Array(n);
    this._offsetZ = new Float32Array(n);
    this._jointRadius = this._buildRadiusMap();
    this._precompute(n);
    this.uvBuffer = device.createBuffer({
      label: 'splat-pose-uv',
      size: n * 6 * 2 * 4,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    this.sampler = device.createSampler({magFilter: 'linear', minFilter: 'linear', });
    this.updateInstanceData = this.updateInstanceDataPoints;
    this.render = this.renderPoint;

    this.anchors = {
      rightHand: [0, 0, 0], leftHand: [0, 0, 0],   // world positions (wrists 16 / 15)
      head: [0, 0, 0],                              // nose (0)
      chest: [0, 0, 0],                             // shoulders midpoint
      hips: [0, 0, 0],                              // hips midpoint
      forward: [0, 0, 1],                           // where the body points (unit)
      up: [0, 1, 0],
      right: [1, 0, 0],
      valid: false,
    };
    this.anchorSmoothing = opts.anchorSmoothing ?? 0.5; // 0 = raw, 0.9 = very smooth
  }

  _toWorld(j, out = [0, 0, 0]) {
    const mx = this.mirrorX ? -1 : 1;
    const v = this._videoElement;
    const aspect = (v.videoWidth / v.videoHeight) || 1;
    out[0] = (j.x - 0.5) * mx * this.scale * aspect + this.origin[0];
    out[1] = -(j.y - 0.5) * this.scale + this.origin[1];
    out[2] = -j.z * this.scale * aspect + this.origin[2];
    return out;
  }

  _updateAnchors(lm) {
    const A = this.anchors;
    const mx = this.mirrorX ? -1 : 1;
    const P = i => this._toWorld(lm[i]);
    const mid = (a, b) => a.map((v, k) => (v + b[k]) * 0.5);

    const rHand = P(16);
    const lHand = P(15);
    const head = P(0);
    const chest = mid(P(11), P(12));
    const hips = mid(P(23), P(24));

    const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
    const norm = v => {const l = Math.hypot(...v) || 1; return v.map(x => x / l);};
    const cross = (a, b) => [
      a[1] * b[2] - a[2] * b[1],
      a[2] * b[0] - a[0] * b[2],
      a[0] * b[1] - a[1] * b[0],
    ];

    // body orientation from shoulders (11 -> 12) and hips -> chest
    const right = norm(sub(P(12), P(11)));
    const up = norm(sub(chest, hips));
    // mirroring flips handedness, so multiply by mx to keep "forward" correct
    const forward = norm(cross(right, up).map(x => x * mx));

    const s = this.anchorSmoothing, k = 1 - s;
    const lerp = (dst, src) => {for(let i = 0;i < dst.length;i++) dst[i] = dst[i] * s + src[i] * k;};

    if(!A.valid) { // first frame: snap
      A.rightHand = rHand; A.leftHand = lHand; A.head = head;
      A.chest = chest; A.hips = hips;
      A.forward = forward; A.up = up; A.right = right;
    } else {
      lerp(A.rightHand, rHand); lerp(A.leftHand, lHand); lerp(A.head, head);
      lerp(A.chest, chest); lerp(A.hips, hips);
      lerp(A.forward, forward); lerp(A.up, up); lerp(A.right, right);
    }
    A.forward = norm(A.forward);
    A.valid = true;
  }

  // public API
  getHandRay(side = 'right', length = 10) {
    const A = this.anchors;
    const o = side === 'right' ? A.rightHand : A.leftHand;
    return {
      origin: o.slice(), dir: A.forward.slice(),
      end: [o[0] + A.forward[0] * length, o[1] + A.forward[1] * length, o[2] + A.forward[2] * length]
    };
  }

  extractTrianglesFromTessellation(edges) {
    if(!edges?.length) return new Uint16Array(0);
    const adj = new Map();
    const add = (a, b) => {
      if(!adj.has(a)) adj.set(a, new Set());
      adj.get(a).add(b);
    };
    for(const e of edges) {
      const a = Array.isArray(e) ? e[0] : e.start;
      const b = Array.isArray(e) ? e[1] : e.end;
      add(a, b); add(b, a);
    }
    const tris = [];
    for(const [a, na] of adj) {
      for(const b of na) {
        if(b <= a) continue;
        for(const c of adj.get(b)) {
          if(c <= b) continue;
          if(na.has(c)) tris.push(a, b, c);
        }
      }
    }
    return new Uint16Array(tris);
  }

  setMode(mode, meshTriangles = null) {
    if(mode === 'mesh') {
      this.updateInstanceData = this.updateInstanceDataMesh;
      this.render = this.renderMesh;
    } else {
      this.updateInstanceData = this.updateInstanceDataPoints;
      this.render = this.renderPoint;
    }
    this.splatLayer.setRenderMode(mode,
      meshTriangles === null ? this.POSE_TRIANGLES : meshTriangles
    );
    this.pipeline = this.splatLayer.pipeline;
  }

  _buildRadiusMap() {
    // Default radius for all 33 landmarks
    const r = new Float32Array(33).fill(0.02);
    // Face points (0-10)
    for(let i = 0;i <= 10;i++) r[i] = 0.015;
    // Nose
    r[0] = 0.030;
    // Shoulders
    r[11] = 0.045; r[12] = 0.045;
    // Elbows
    r[13] = 0.030; r[14] = 0.030;
    // Wrists
    r[15] = 0.025; r[16] = 0.025;
    // Hand points (17-22)
    for(let i = 17;i <= 22;i++) r[i] = 0.012;
    // Hips
    r[23] = 0.050; r[24] = 0.050;
    // Knees
    r[25] = 0.035; r[26] = 0.035;
    // Ankles
    r[27] = 0.030; r[28] = 0.030;
    // Feet (29-32)
    for(let i = 29;i <= 32;i++) r[i] = 0.015;
    return r;
  }

  _buildColorMap() {
    // [r, g, b] per landmark, flat array: index * 3
    const colors = new Float32Array(33 * 3);
    const setRange = (from, to, r, g, b) => {
      for(let i = from;i <= to;i++) {
        colors[i * 3] = r;
        colors[i * 3 + 1] = g;
        colors[i * 3 + 2] = b;
      }
    };
    // Default — skin tone base
    setRange(0, 32, 0.9, 0.7, 0.5);
    // Face points — warm gold
    setRange(0, 10, 1.0, 0.8, 0.2);
    // Shoulders — cyan
    setRange(11, 12, 0.2, 1.0, 1.0);
    // Arms — soft blue
    setRange(13, 16, 0.4, 0.6, 1.0);
    // Hands — bright green
    setRange(17, 22, 0.2, 1.0, 0.3);
    // Hips — hot pink/red
    setRange(23, 24, 1.0, 0.2, 0.4);
    // Legs — blue
    setRange(25, 28, 0.3, 0.5, 1.0);
    // Feet — bright red
    setRange(29, 32, 1.0, 0.1, 0.2);
    // Key landmarks — white highlights
    [0, 11, 12, 15, 16, 23, 24, 27, 28].forEach(i => {
      colors[i * 3] = 1.0;
      colors[i * 3 + 1] = 1.0;
      colors[i * 3 + 2] = 1.0;
    });
    return colors;
  }

  _buildWeights() {
    const w = new Float32Array(33).fill(1.0); // base weight
    // Face points
    for(let i = 0;i <= 10;i++) w[i] = 0.6;
    w[0] = 1.5;
    // Torso corners — structural, most points
    w[11] = 3.0; w[12] = 3.0; w[23] = 3.0; w[24] = 3.0;
    // Elbows + knees
    w[13] = 2.0; w[14] = 2.0; w[25] = 2.0; w[26] = 2.0;
    // Wrists + ankles
    w[15] = 1.8; w[16] = 1.8; w[27] = 1.8; w[28] = 1.8;
    // Hand points
    for(let i = 17;i <= 22;i++) w[i] = 0.5;
    // Feet
    for(let i = 29;i <= 32;i++) w[i] = 0.5;
    return w;
  }

  _precompute(n) {
    const weights = this._buildWeights();
    const TOTAL_LM = 33;
    let total = 0;
    for(let i = 0;i < TOTAL_LM;i++) total += weights[i];
    const cdf = new Float32Array(TOTAL_LM);
    let run = 0;
    for(let i = 0;i < TOTAL_LM;i++) {
      run += weights[i] / total;
      cdf[i] = run;
    }
    cdf[TOTAL_LM - 1] = 1.0;
    for(let p = 0;p < n;p++) {
      const r = Math.random();
      // Binary search CDF
      let lo = 0, hi = TOTAL_LM - 1;
      while(lo < hi) {
        const mid = (lo + hi) >>> 1;
        if(cdf[mid] < r) lo = mid + 1;
        else hi = mid;
      }
      this._clusterIdx[p] = lo;
      // Uniform point inside unit sphere
      let ox, oy, oz;
      do {
        ox = (Math.random() - 0.5) * 2;
        oy = (Math.random() - 0.5) * 2;
        oz = (Math.random() - 0.5) * 2;
      } while(ox * ox + oy * oy + oz * oz > 1.0);
      this._offsetX[p] = ox;
      this._offsetY[p] = oy;
      this._offsetZ[p] = oz;
    }
  }

  // PipeCommander in 'pose' mode returns results.landmarks
  setPoseData(results) {
    if(!results?.landmarks?.length) {
      this._landmarks = null;
      this.anchors.valid = false;
      return;
    }
    this._landmarks = results.landmarks[0];
    this._updateAnchors(this._landmarks);
  }

  setScale(s) {this.scale = s;}
  setClusterRadius(r) {this.clusterRadius = r;}
  setOrigin(x, y, z) {this.origin = [x, y, z];}

  updateInstanceDataPoints(baseModelMatrix) {
    if(!this.enabled || !this._landmarks) return;
    const lm = this._landmarks;
    const sc = this.scale;
    const ox = this.origin[0], oy = this.origin[1], oz = this.origin[2];
    const mx = this.mirrorX ? -1 : 1;
    const n = this.splatLayer.vertexCount;
    const p = this._posCPU;
    const uv = this._uvCPU;
    for(let i = 0;i < n;i++) {
      const ci = this._clusterIdx[i];
      const joint = lm[ci];
      // 3D position offset
      const jx = (joint.x - 0.5) * mx * sc + ox;
      const jy = -(joint.y - 0.5) * sc + oy;
      const jz = -joint.z * sc + oz;
      const r = this._jointRadius[ci] * sc * this.clusterRadius;
      p[i * 3] = jx + this._offsetX[i] * r;
      p[i * 3 + 1] = jy + this._offsetY[i] * r;
      p[i * 3 + 2] = jz + this._offsetZ[i] * r;
      // Direct UV mapping from MediaPipe 0..1 coordinates
      const ux = this.mirrorX ? (1.0 - joint.x) : joint.x;
      const uy = joint.y;
      const uvi = i * 12;
      for(let v = 0;v < 6;v++) {
        this._uvCPU[uvi + v * 2] = ux;
        this._uvCPU[uvi + v * 2 + 1] = uy;
      }
    }
    this.device.queue.writeBuffer(this.splatLayer.positionAnimator.posBuffer, 0, p);
    this.device.queue.writeBuffer(this.uvBuffer, 0, uv);
  }

  updateInstanceDataMesh(baseModelMatrix) {
    if(!this.enabled || !this._landmarks) return;
    const lm = this._landmarks;
    const sc = this.scale;
    const ox = this.origin[0], oy = this.origin[1], oz = this.origin[2];
    const mx = this.mirrorX ? -1 : 1;
    // Pose mesh only has 33 vertices!
    const landmarkCount = Math.min(lm.length, 33);
    const posData = new Float32Array(landmarkCount * 3);
    const uvData = new Float32Array(landmarkCount * 2);
    for(let i = 0;i < landmarkCount;i++) {
      const joint = lm[i];
      posData[i * 3 + 0] = (joint.x - 0.5) * mx * sc + ox;
      posData[i * 3 + 1] = -(joint.y - 0.5) * sc + oy;
      posData[i * 3 + 2] = -joint.z * sc + oz;
      uvData[i * 2 + 0] = joint.x;
      uvData[i * 2 + 1] = joint.y;
    }
    this.device.queue.writeBuffer(this.splatLayer.positionAnimator.posBuffer, 0, posData);
    this.device.queue.writeBuffer(this.uvBuffer, 0, uvData);
  }

  renderPoint(pass, mesh, viewProjMatrix, dt = 0.016) {
    this.time += dt;
    if(this._videoElement.readyState < 2) {return;}
    this.splatLayer.device.queue.writeBuffer(this.splatLayer.modelBuffer, 0, mesh.modelMatrix);
    this.splatLayer.device.queue.writeBuffer(this.splatLayer.cameraBuffer, 0, viewProjMatrix);
    const externalTexture = this.device.importExternalTexture({source: this._videoElement});
    const bindGroup = this.device.createBindGroup({
      layout: this.splatLayer.bindGroupLayout,
      entries: [
        {binding: 0, resource: {buffer: this.splatLayer.cameraBuffer}},
        {binding: 1, resource: {buffer: this.splatLayer.modelBuffer}},
        {binding: 2, resource: {buffer: this.splatLayer.scaleBuffer}},
        {binding: 3, resource: externalTexture}, {binding: 4, resource: this.sampler}
      ]
    });
    pass.setBindGroup(0, bindGroup);
    pass.setVertexBuffer(0, this.splatLayer.vertexBuffer);
    pass.setVertexBuffer(1, this.splatLayer.colorBuffer);
    pass.setVertexBuffer(2, this.splatLayer.positionAnimator ? this.splatLayer.positionAnimator.posBuffer : this.splatLayer.dummyPosBuffer);
    pass.setVertexBuffer(3, this.uvBuffer);
    pass.draw(6, this.splatLayer.vertexCount, 0, 0);
  }

  renderMesh(pass, mesh, viewProjMatrix, dt = 0.016) {
    if(this._videoElement.readyState < 2) return;
    const externalTexture = this.device.importExternalTexture({source: this._videoElement});
    const bindGroup = this.device.createBindGroup({
      layout: this.splatLayer.bindGroupLayout,
      entries: [
        {binding: 0, resource: {buffer: this.splatLayer.cameraBuffer}},
        {binding: 1, resource: {buffer: this.splatLayer.modelBuffer}},
        {binding: 2, resource: {buffer: this.splatLayer.scaleBuffer}},
        {binding: 3, resource: externalTexture},
        {binding: 4, resource: this.sampler}
      ]
    });
    pass.setBindGroup(0, bindGroup);
    pass.setVertexBuffer(0, this.splatLayer.vertexBuffer);
    pass.setVertexBuffer(1, this.splatLayer.colorBuffer);
    pass.setVertexBuffer(2, this.splatLayer.positionAnimator.posBuffer);
    // UVs PER-LANDMARK
    pass.setVertexBuffer(3, this.uvBuffer);
    pass.setIndexBuffer(this.splatLayer.meshIndexBuffer, 'uint16');
    pass.drawIndexed(this.POSE_TRIANGLES.length, 1, 0, 0, 0);
  }
}