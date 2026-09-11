import {byId} from "../utils";

/**
 * SplatFaceEffect
 * Maps MediaPipe FaceLandmarker 478 landmarks into a splat point cloud.
 * Follows FlameEmitter interface:
 *   updateInstanceData(baseModelMatrix) — called automatically by main loop
 *   render(pass, mesh, viewProjMatrix, dt) — no-op, splat renders itself
 */
export class SplatFaceEffect {
  /**
   * @param {GPUDevice} device
   * @param {string} format
   * @param {GPUBuffer} cameraBuffer
   * @param {GaussianSplatLayer} splatLayer
   * @param {object} opts
   * @param {number} opts.scale          world-space scale (default 2.5)
   * @param {number} opts.clusterRadius  global radius multiplier (default 1.0)
   * @param {number[]} opts.origin       world offset [x,y,z] (default [0,1.6,0])
   * @param {boolean} opts.mirrorX      flip X for webcam (default true)
   */
  constructor(device, format, cameraBuffer, splatLayer, opts = {}) {

    this.device = device;
    this.format = format;
    this.cameraBuffer = cameraBuffer;
    this.splatLayer = splatLayer;
    this.enabled = true;
    this.time = 0;

    this.scale = opts.scale ?? 2.5;
    this.clusterRadius = opts.clusterRadius ?? 1.0;
    this.origin = opts.origin ?? [0, 1.6, 0];
    this.mirrorX = opts.mirrorX ?? true;

    this._videoElement = byId('auto-video');
    this._videoCanvas = document.createElement('canvas');
    this._videoCanvas.width = this._videoElement.videoWidth || 640;
    this._videoCanvas.height = this._videoElement.videoHeight || 480;

    this._landmarks = null;

    const n = splatLayer.vertexCount;
    this._posCPU = new Float32Array(n * 3);
    this._colorCPU = new Float32Array(n * 4);

    this._clusterIdx = new Uint16Array(n); // 478 landmarks, needs Uint16
    this._offsetX = new Float32Array(n);
    this._offsetY = new Float32Array(n);
    this._offsetZ = new Float32Array(n);

    // Per-landmark radius (tight on flat areas, wider on key features)
    this._jointRadius = this._buildRadiusMap();

    // Per-landmark color (478 entries, grouped by facial region)
    this._landmarkColors = this._buildColorMap();

    this._precompute(n);

    this._posCPU.fill(0);
    device.queue.writeBuffer(splatLayer.positionAnimator.posBuffer, 0, this._posCPU);
  }

  // ── Radius map — key facial landmarks get wider clusters ──────────────────

  _buildRadiusMap() {
    // Default tight radius for all 478 landmarks
    const r = new Float32Array(478).fill(0.005);

    // Jaw outline (0-16) — wider, structural
    for(let i = 0;i <= 16;i++) r[i] = 0.010;

    // Eyebrows (17-26) — medium
    for(let i = 17;i <= 26;i++) r[i] = 0.007;

    // Nose bridge + tip (27-35) — medium
    for(let i = 27;i <= 35;i++) r[i] = 0.007;

    // Eyes (36-47 right, 42-47 left) — tighter, detailed
    for(let i = 36;i <= 47;i++) r[i] = 0.005;

    // Lips outer (48-59) — wider, expressive
    for(let i = 48;i <= 59;i++) r[i] = 0.008;

    // Lips inner (60-67) — medium
    for(let i = 60;i <= 67;i++) r[i] = 0.006;

    // Key anchor points — extra wide for visibility
    // Nose tip
    r[1] = 0.010;
    r[4] = 0.010;
    // Chin
    r[152] = 0.012;
    // Cheekbones
    r[234] = 0.012;
    r[454] = 0.012;
    // Eye corners
    r[33] = 0.008;
    r[133] = 0.008;
    r[362] = 0.008;
    r[263] = 0.008;
    // Lip corners
    r[61] = 0.009;
    r[291] = 0.009;
    // Forehead center
    r[10] = 0.012;
    return r;
  }

  _buildColorMap() {
    // [r, g, b] per landmark, flat array: index * 3
    const colors = new Float32Array(478 * 3);
    // Helper to set a range
    const setRange = (from, to, r, g, b) => {
      for(let i = from;i <= to;i++) {
        colors[i * 3] = r;
        colors[i * 3 + 1] = g;
        colors[i * 3 + 2] = b;
      }
    };
    // Default — skin tone base for face mesh
    setRange(0, 477, 0.9, 0.7, 0.5);

    // Jaw outline — warm gold
    setRange(0, 16, 1.0, 0.8, 0.2);

    // Right eyebrow — cyan
    setRange(17, 21, 0.2, 1.0, 1.0);
    // Left eyebrow — cyan
    setRange(22, 26, 0.2, 1.0, 1.0);

    // Nose bridge — soft blue
    setRange(27, 30, 0.4, 0.6, 1.0);
    // Nose bottom — blue
    setRange(31, 35, 0.3, 0.5, 1.0);
    // Right eye — bright green
    setRange(36, 41, 0.2, 1.0, 0.3);
    // Left eye — bright green
    setRange(42, 47, 0.2, 1.0, 0.3);
    // Lips outer — hot pink/red
    setRange(48, 59, 1.0, 0.2, 0.4);
    // Lips inner — bright red
    setRange(60, 67, 1.0, 0.1, 0.2);
    // Key landmarks — white highlights
    [1, 4, 10, 33, 61, 133, 152, 234, 263, 291, 362, 454].forEach(i => {
      colors[i * 3] = 1.0;
      colors[i * 3 + 1] = 1.0;
      colors[i * 3 + 2] = 1.0;
    });

    return colors;
  }

  _buildWeights() {
    const w = new Float32Array(478).fill(0.8); // base weight for all face mesh
    // Jaw — structural, more points
    for(let i = 0;i <= 16;i++) w[i] = 1.5;
    // Eyebrows
    for(let i = 17;i <= 26;i++) w[i] = 1.2;
    // Nose
    for(let i = 27;i <= 35;i++) w[i] = 1.2;

    // Eyes — very important perceptually
    for(let i = 36;i <= 47;i++) w[i] = 1.8;

    // Lips — most expressive, heaviest weight
    for(let i = 48;i <= 67;i++) w[i] = 2.0;

    // Key anchor landmarks — extra heavy
    [1, 4, 10, 33, 61, 133, 152, 234, 263, 291, 362, 454].forEach(i => {
      w[i] = 2.5;
    });

    return w;
  }

  _precompute(n) {
    const weights = this._buildWeights();
    const TOTAL_LM = 478;

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
      // Binary search CDF — faster than linear for 478 entries
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

  // ── Public API ────────────────────────────────────────────────────────────

  /**
   * Feed raw FaceLandmarker results directly.
   * Call from PipeCommander.onResults()
   */
  setFaceData(results) {
    if(!results?.faceLandmarks?.length) {
      this._landmarks = null;
      return;
    }
    this._landmarks = results.faceLandmarks[0];
  }

  setScale(s) {this.scale = s;}
  setClusterRadius(r) {this.clusterRadius = r;}
  setOrigin(x, y, z) {this.origin = [x, y, z];}

  // ── Effect interface ──────────────────────────────────────────────────────
  updateInstanceData(baseModelMatrix) {
    if(!this.enabled) return;

    if(!this._landmarks) {
      this._posCPU.fill(0);
      this.device.queue.writeBuffer(
        this.splatLayer.positionAnimator.posBuffer, 0, this._posCPU
      );
      return;
    }

    const lm = this._landmarks;
    const sc = this.scale;
    const ox = this.origin[0];
    const oy = this.origin[1];
    const oz = this.origin[2];
    const mx = this.mirrorX ? -1 : 1;
    const n = this.splatLayer.vertexCount;
    const p = this._posCPU;

    // Subtle breathing pulse
    const breathe = Math.sin(this.time * 2.0) * 0.003;

    for(let i = 0;i < n;i++) {
      const ci = this._clusterIdx[i];
      const joint = lm[ci];

      // FaceLandmarker normalized coords (0..1):
      // x: 0=left edge, 1=right edge of image
      // y: 0=top, 1=bottom
      // z: depth, negative = closer to camera
      // → Engine: Y up, -Z forward
      const jx = (joint.x - 0.5) * mx * sc + ox;
      const jy = -(joint.y - 0.5) * sc + oy;
      const jz = -joint.z * sc + oz;

      const r = this._jointRadius[ci] * sc * this.clusterRadius + breathe;
      p[i * 3] = jx + this._offsetX[i] * r;
      p[i * 3 + 1] = jy + this._offsetY[i] * r;
      p[i * 3 + 2] = jz + this._offsetZ[i] * r;
    }

    this.device.queue.writeBuffer(
      this.splatLayer.positionAnimator.posBuffer, 0, p
    );

    this._updateColors();
  }

  render(pass, mesh, viewProjMatrix, dt = 0.016) {
    // No-op — GaussianSplatScene renders itself
    this.time += dt;
  }

  /**
   * Sample pixel color from video at each landmark position
   * and apply to splat colors
   */
  _updateColors() {
    if(!this._videoCanvas || !this._landmarks) return;

    const ctx = this._videoCanvas.getContext('2d', {willReadFrequently: true});
    const c = this._colorCPU;
    const n = this.splatLayer.vertexCount;
    const lm = this._landmarks;

    // Draw current video frame to canvas
    const video = this._videoElement;
    ctx.drawImage(video, 0, 0, this._videoCanvas.width, this._videoCanvas.height);

    const imageData = ctx.getImageData(0, 0, this._videoCanvas.width, this._videoCanvas.height);
    const data = imageData.data;
    const w = this._videoCanvas.width;
    const h = this._videoCanvas.height;

    for(let i = 0;i < n;i++) {
      const ci = this._clusterIdx[i];
      const joint = lm[ci];

      // Normalized coords → pixel coords
      const px = Math.floor(joint.x * w);
      const py = Math.floor(joint.y * h);
      const idx = (py * w + px) * 4;

      // Sample actual pixel
      const r = data[idx] / 255;
      const g = data[idx + 1] / 255;
      const b = data[idx + 2] / 255;

      // Optional: mix with original landmark color for stability
      const orig = this._landmarkColors;
      const blend = 0.7; // 70% video, 30% base color
      c[i * 4] = r * blend + orig[ci * 3] * (1 - blend);
      c[i * 4 + 1] = g * blend + orig[ci * 3 + 1] * (1 - blend);
      c[i * 4 + 2] = b * blend + orig[ci * 3 + 2] * (1 - blend);
      c[i * 4 + 3] = 1.0;
    }

    this.device.queue.writeBuffer(this.splatLayer.colorBuffer, 0, c);
  }

  destroy() {
    // buffers owned by splatLayer — don't destroy here
  }
}