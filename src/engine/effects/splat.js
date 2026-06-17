import {randomIntFromTo} from "../utils";

/**
 * @description
 * Gaussian Splat PLY Loader & Renderer
 * Integrated with engine effect system (cameraBuffer pattern)
 * Part of MEWGPU Effect system
 *
 * @filename
 * splat.js
 *
 * @Licence
 * This Source Code Form is subject to the terms of the
 * Mozilla Public License, v. 2.0.
 * If a copy of the MPL was not distributed with this file,
 * You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2026 Nikola Lukić zlatnaspirala@gmail.com
 */
export class GaussianSplatLayer {
  constructor(device, format, cameraBuffer, topology = "point-list") {
    this.device = device;
    this.format = format;
    this.cameraBuffer = cameraBuffer;
    this.queue = device.queue;
    this.topology = topology;
    this.splatData = null;
    this.vertexCount = 0;
    this.aabbMin = [Infinity, Infinity, Infinity];
    this.aabbMax = [-Infinity, -Infinity, -Infinity];
    this.vertexBuffer = null;
    this.indexBuffer = null;
    this.vertexBufferLayout = null;
    this.bindGroup = null;
    this.renderPipeline = null;
    this.indexCount = 0;
    this.splatScale = 2.0;
    this._scaleData = new Float32Array([this.splatScale, 0, 0, 0]);
    this.depthTest = true;
  }

  async loadPLY(source) {
    try {
      let arrayBuffer;
      if(typeof source === 'string') {
        const response = await fetch(source);
        if(!response.ok) throw new Error(`HTTP ${response.status}`);
        arrayBuffer = await response.arrayBuffer();
      } else if(source instanceof File) {
        arrayBuffer = await source.arrayBuffer();
      } else {
        throw new Error('Source must be URL string or File object');
      }
      this.splatData = this._parsePLY(arrayBuffer);
      this.vertexCount = this.splatData.positions.length / 3;
      console.log(`✓ Loaded splat: ${this.vertexCount} points, AABB: [${this.aabbMin}] → [${this.aabbMax}]`);
      await this._initializeGPU();
      return this;
    } catch(err) {
      console.error('Splat load error:', err);
      throw err;
    }
  }

  _parsePLY(arrayBuffer) {
    const view = new DataView(arrayBuffer);
    const uint8 = new Uint8Array(arrayBuffer);
    let headerEnd = 0;
    const headerStr = new TextDecoder().decode(uint8.slice(0, 2048));
    const lines = headerStr.split('\n');
    let vertexCount = 0;
    const properties = [];
    for(let i = 0;i < lines.length;i++) {
      const line = lines[i].trim();
      headerEnd += line.length + 1;
      if(line.startsWith('element vertex')) {
        vertexCount = parseInt(line.split(' ')[2]);
      } else if(line.startsWith('property')) {
        const parts = line.split(' ');
        properties.push({type: parts[1], name: parts[2]});
      } else if(line === 'end_header') {
        break;
      }
    }
    const stride = this._calculateStride(properties);
    const offsets = this._getPropertyOffsets(properties);
    const dataStart = headerEnd;
    const positions = new Float32Array(vertexCount * 3);
    const splatColors = new Float32Array(vertexCount * 4);
    const scales = new Float32Array(vertexCount * 3);
    const rotations = new Float32Array(vertexCount * 4);
    const opacities = new Uint8Array(vertexCount);
    for(let i = 0;i < vertexCount;i++) {
      const offset = dataStart + i * stride;
      const x = view.getFloat32(offset + offsets.x, true);
      const y = view.getFloat32(offset + offsets.y, true);
      const z = view.getFloat32(offset + offsets.z, true);
      positions[i * 3 + 0] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      this.aabbMin[0] = Math.min(this.aabbMin[0], x);
      this.aabbMin[1] = Math.min(this.aabbMin[1], y);
      this.aabbMin[2] = Math.min(this.aabbMin[2], z);
      this.aabbMax[0] = Math.max(this.aabbMax[0], x);
      this.aabbMax[1] = Math.max(this.aabbMax[1], y);
      this.aabbMax[2] = Math.max(this.aabbMax[2], z);

      // const r = this._sigmoid(view.getFloat32(offset + offsets.f_dc_0, true));
      // const g = this._sigmoid(view.getFloat32(offset + offsets.f_dc_1, true));
      // const b = this._sigmoid(view.getFloat32(offset + offsets.f_dc_2, true));
      const r = randomIntFromTo(0, 10);
      const g = randomIntFromTo(0, 10);
      const b = randomIntFromTo(0, 10);

      splatColors[i * 4 + 0] = r;
      splatColors[i * 4 + 1] = g;
      splatColors[i * 4 + 2] = b;
      splatColors[i * 4 + 3] = 1.0;

      const scale_0 = Math.exp(view.getFloat32(offset + offsets.scale_0, true));
      const scale_1 = Math.exp(view.getFloat32(offset + offsets.scale_1, true));
      const scale_2 = Math.exp(view.getFloat32(offset + offsets.scale_2, true));

      scales[i * 3 + 0] = scale_0;
      scales[i * 3 + 1] = scale_1;
      scales[i * 3 + 2] = scale_2;
      const rot_0 = view.getFloat32(offset + offsets.rot_0, true);
      const rot_1 = view.getFloat32(offset + offsets.rot_1, true);
      const rot_2 = view.getFloat32(offset + offsets.rot_2, true);
      const rot_3 = view.getFloat32(offset + offsets.rot_3, true);
      rotations[i * 4 + 0] = rot_0;
      rotations[i * 4 + 1] = rot_1;
      rotations[i * 4 + 2] = rot_2;
      rotations[i * 4 + 3] = rot_3;
      opacities[i] = view.getUint8(offset + offsets.opacity);
    }
    return {vertexCount, positions, splatColors, scales, rotations, opacities, properties};
  }

  _calculateStride(properties) {
    let stride = 0;
    for(const prop of properties) {
      if(prop.type === 'float') stride += 4;
      else if(prop.type === 'uchar') stride += 1;
      else if(prop.type === 'double') stride += 8;
    }
    return stride;
  }

  _getPropertyOffsets(properties) {
    const offsets = {};
    let current = 0;
    for(const prop of properties) {
      offsets[prop.name] = current;
      if(prop.type === 'float') current += 4;
      else if(prop.type === 'uchar') current += 1;
      else if(prop.type === 'double') current += 8;
    }
    return offsets;
  }

  _sigmoid(x) {return 1.0 / (1.0 + Math.exp(-x));}

  async _initializeGPU() {
    // Vertex buffer: interleaved position + color + scale + rotation
    const vertexData = new Float32Array(this.vertexCount * 14);
    for(let i = 0;i < this.vertexCount;i++) {
      let idx = i * 14;
      vertexData[idx++] = this.splatData.positions[i * 3 + 0];
      vertexData[idx++] = this.splatData.positions[i * 3 + 1];
      vertexData[idx++] = this.splatData.positions[i * 3 + 2];
      vertexData[idx++] = this.splatData.splatColors[i * 4 + 0];
      vertexData[idx++] = this.splatData.splatColors[i * 4 + 1];
      vertexData[idx++] = this.splatData.splatColors[i * 4 + 2];
      vertexData[idx++] = this.splatData.opacities[i] / 255.0;
      vertexData[idx++] = this.splatData.scales[i * 3 + 0];
      vertexData[idx++] = this.splatData.scales[i * 3 + 1];
      vertexData[idx++] = this.splatData.scales[i * 3 + 2];
      vertexData[idx++] = this.splatData.rotations[i * 4 + 0];
      vertexData[idx++] = this.splatData.rotations[i * 4 + 1];
      vertexData[idx++] = this.splatData.rotations[i * 4 + 2];
      vertexData[idx++] = this.splatData.rotations[i * 4 + 3];
    }

    this.vertexBuffer = this.device.createBuffer({
      label: 'Splat vertex buffer',
      size: vertexData.byteLength,
      mappedAtCreation: true,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    new Float32Array(this.vertexBuffer.getMappedRange()).set(vertexData);
    this.vertexBuffer.unmap();

    // Dummy/fallback position buffer (slot 2) — used when no positionAnimator
    // is attached, so render() never crashes on missing dynamic position data.
    const dummyPosData = new Float32Array(this.vertexCount * 3);
    dummyPosData.set(this.splatData.positions);
    this.dummyPosBuffer = this.device.createBuffer({
      label: 'splat-dummy-pos',
      size: dummyPosData.byteLength,
      mappedAtCreation: true,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    new Float32Array(this.dummyPosBuffer.getMappedRange()).set(dummyPosData);
    this.dummyPosBuffer.unmap();

    this.positionAnimator = null; // explicit until one is attached

    const initialColors = new Float32Array(this.vertexCount * 4);
    for(let i = 0;i < this.vertexCount;i++) {
      initialColors[i * 4 + 0] = this.splatData.splatColors[i * 4 + 0];
      initialColors[i * 4 + 1] = this.splatData.splatColors[i * 4 + 1];
      initialColors[i * 4 + 2] = this.splatData.splatColors[i * 4 + 2];
      initialColors[i * 4 + 3] = this.splatData.splatColors[i * 4 + 3];
    }

    this.colorBuffer = this.device.createBuffer({
      label: 'splat-color',
      size: initialColors.byteLength,
      mappedAtCreation: true,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    new Float32Array(this.colorBuffer.getMappedRange()).set(initialColors);
    this.colorBuffer.unmap()

    this.positions = this.splatData.positions;
    this.vertexCount = this.splatData.vertexCount;

    // this.vertexBufferLayout = [
    //   {
    //     // buffer 0: position + (ignored color slot) + scale + rotation
    //     arrayStride: 56,
    //     stepMode: 'vertex',
    //     attributes: [
    //       {shaderLocation: 0, offset: 0, format: 'float32x3'},
    //       {shaderLocation: 2, offset: 28, format: 'float32x3'},
    //       {shaderLocation: 3, offset: 40, format: 'float32x4'},
    //     ]
    //   },
    //   {
    //     // buffer 1: animated rgba color
    //     arrayStride: 16,
    //     stepMode: 'vertex',
    //     attributes: [
    //       {shaderLocation: 1, offset: 0, format: 'float32x4'},
    //     ]
    //   }
    // ];
    // In vertexBufferLayout, buffer 0 skips position (now dynamic):
    this.vertexBufferLayout = [
      {
        // slot 0: static — scale + rotation only (position slot skipped)
        arrayStride: 56,
        stepMode: 'vertex',
        attributes: [
          // shaderLocation 0 = position now comes from slot 2
          {shaderLocation: 2, offset: 28, format: 'float32x3'}, // scale
          {shaderLocation: 3, offset: 40, format: 'float32x4'}, // rotation
        ]
      },
      {
        // slot 1: animated rgba color (SplatColorAnimator)
        arrayStride: 16, stepMode: 'vertex',
        attributes: [{shaderLocation: 1, offset: 0, format: 'float32x4'}]
      },
      {
        // slot 2: dynamic position (SplatPositionAnimator)
        arrayStride: 12, stepMode: 'vertex',
        attributes: [{shaderLocation: 0, offset: 0, format: 'float32x3'}]
      }
    ];

    this.scaleBuffer = this.device.createBuffer({
      label: 'Splat scale buffer',
      size: 16,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
      mappedAtCreation: true,
    });
    new Float32Array(this.scaleBuffer.getMappedRange()).set([this.splatScale, 0, 0, 0]);
    this.scaleBuffer.unmap();

    this.modelBuffer = this.device.createBuffer({size: 112, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST});

    const bindGroupLayout = this.device.createBindGroupLayout({
      entries: [
        {binding: 0, visibility: GPUShaderStage.VERTEX, buffer: {type: 'uniform'}},
        {binding: 1, visibility: GPUShaderStage.VERTEX, buffer: {type: 'uniform'}},
        {binding: 2, visibility: GPUShaderStage.VERTEX, buffer: {type: 'uniform'}}
      ]
    });

    this.bindGroup = this.device.createBindGroup({
      layout: bindGroupLayout,
      entries: [
        {binding: 0, resource: {buffer: this.cameraBuffer}},
        {binding: 1, resource: {buffer: this.modelBuffer}},
        {binding: 2, resource: {buffer: this.scaleBuffer}}
      ]
    });

    const pipelineLayout = this.device.createPipelineLayout({
      bindGroupLayouts: [bindGroupLayout]
    });

    const shaderCode = this._getRenderShaderCode();
    const shaderModule = this.device.createShaderModule({
      label: 'Splat shader',
      code: shaderCode
    });

    this.renderPipeline = this.device.createRenderPipeline({
      label: 'Splat render pipeline',
      layout: pipelineLayout,
      vertex: {
        module: shaderModule,
        entryPoint: 'vs_main',
        buffers: this.vertexBufferLayout
      },
      fragment: {
        module: shaderModule,
        entryPoint: 'fs_main',
        targets: [
          {
            format: this.format,
            blend: {
              color: {
                srcFactor: 'src-alpha',
                dstFactor: 'one-minus-src-alpha',
                operation: 'add'
              },
              alpha: {
                srcFactor: 'one',
                dstFactor: 'one-minus-src-alpha',
                operation: 'add'
              }
            }
          },
          {format: 'rgba16float'},
          {format: 'rgba16float'}
        ]
      },
      primitive: {
        topology: this.topology,
        cullMode: 'none'
      },
      depthStencil: {
        format: 'depth24plus',
        depthWriteEnabled: false,
        depthCompare: 'less'
      }
    });
  }

  _getRenderShaderCode() {
    return `
struct Camera {
  mvp: mat4x4<f32>
};

struct Model {
  matrix: mat4x4<f32>,
};

struct Scale {
  factor: f32,
  pad0: f32,
  pad1: f32,
  pad2: f32,
};

@group(0) @binding(0) var<uniform> camera: Camera;
@group(0) @binding(1) var<uniform> model: Model;
@group(0) @binding(2) var<uniform> scale: Scale;

struct VertexInput {
  @location(0) position: vec3<f32>,
  @location(1) colorOpacity: vec4<f32>,
  @location(2) scale: vec3<f32>,
  @location(3) rotation: vec4<f32>,
};

struct VertexOutput {
  @builtin(position) clipPos: vec4<f32>,
  @location(0) color: vec3<f32>,
  @location(1) opacity: f32,
  @location(2) worldPos: vec3<f32>,
};

struct FragOut {
  @location(0) color: vec4<f32>,
  @location(1) normal: vec4<f32>,
  @location(2) worldPos: vec4<f32>,
};

@vertex
fn vs_main(in: VertexInput) -> VertexOutput {
  var out: VertexOutput;
  let scaledPos = in.position * scale.factor;
  let worldPos = model.matrix * vec4<f32>(scaledPos, 1.0);
  let clipPos = camera.mvp * worldPos;
  out.clipPos = clipPos;
  out.color = in.colorOpacity.rgb;
  out.opacity = in.colorOpacity.a;
  out.worldPos = worldPos.xyz;
  return out;
}

@fragment
fn fs_main(in: VertexOutput) -> FragOut {
  var out: FragOut;
  out.color = vec4<f32>(in.color, in.opacity);
  out.normal = vec4<f32>(0.0, 0.0, 1.0, 1.0);
  out.worldPos = vec4<f32>(in.worldPos, 1.0);
  return out;
}`;
  }

  attachPositionAnimator(animator) {
    this.positionAnimator = animator;
  }

  detachPositionAnimator() {
    this.positionAnimator = null;
  }

  /**
 * Builds a target array of exactly `sampleCount` points by directly
 * sampling the mesh's own vertex positions (no triangle interpolation).
 * If sampleCount > mesh vertex count, vertices repeat.
 */
  sampleMeshVertices(positions, sampleCount) {
    const meshVertCount = positions.length / 3;
    const out = new Float32Array(sampleCount * 3);
    for(let i = 0;i < sampleCount;i++) {
      const srcIdx = i % meshVertCount; // or Math.floor(Math.random() * meshVertCount) for shuffled
      out[i * 3] = positions[srcIdx * 3];
      out[i * 3 + 1] = positions[srcIdx * 3 + 1];
      out[i * 3 + 2] = positions[srcIdx * 3 + 2];
    }
    return out;
  }

  /**
   * Remaps a flat xyz array between axis conventions.
   * Default: identity (no change).
   *
   * @param {Float32Array} positions  flat xyz triplets
   * @param {object} [opts]
   * @param {'Y_UP'|'Z_UP'} [opts.from='Y_UP']  source convention
   * @param {'Y_UP'|'Z_UP'} [opts.to='Y_UP']    target convention
   * @param {boolean} [opts.flipZ=false]        negate Z (e.g. glTF +Z forward → engine -Z forward)
   * @returns {Float32Array}  new remapped array (does not mutate input)
   */
  remapAxes(positions, opts = {}) {
    const {from = 'Y_UP', to = 'Z_UP', flipZ = false} = opts;
    const n = positions.length / 3;
    const out = new Float32Array(positions.length);

    // Z_UP -> Y_UP: swap Y and Z, then negate new Z (standard Blender->engine fix)
    const needsSwap = from === 'Z_UP' && to === 'Y_UP';
    // Y_UP -> Z_UP: inverse swap
    const needsSwapInverse = from === 'Y_UP' && to === 'Z_UP';

    for(let i = 0;i < n;i++) {
      let x = positions[i * 3];
      let y = positions[i * 3 + 1];
      let z = positions[i * 3 + 2];

      if(needsSwap) {
        // Blender Z-up (x, y, z) -> Y-up (x, z, -y)
        const ty = z;
        const tz = -y;
        y = ty;
        z = tz;
      } else if(needsSwapInverse) {
        // Y-up -> Z-up (inverse of above)
        const ty = -z;
        const tz = y;
        y = ty;
        z = tz;
      }

      if(flipZ) z = -z;

      out[i * 3] = x;
      out[i * 3 + 1] = y;
      out[i * 3 + 2] = z;
    }

    return out;
  }

  render(pass, mesh, viewProjMatrix) {
    this.device.queue.writeBuffer(this.modelBuffer, 0, mesh.modelMatrix);
    this.device.queue.writeBuffer(this.cameraBuffer, 0, viewProjMatrix);
    this.device.queue.writeBuffer(this.scaleBuffer, 0, this._scaleData);
    pass.setPipeline(this.renderPipeline);
    pass.setBindGroup(0, this.bindGroup);
    pass.setVertexBuffer(0, this.vertexBuffer);
    pass.setVertexBuffer(1, this.colorBuffer);
    pass.setVertexBuffer(2, this.positionAnimator ? this.positionAnimator.posBuffer : this.dummyPosBuffer);
    pass.draw(this.vertexCount, 1, 0, 0);
  }

  setScale(scale) {
    this.splatScale = scale;
    this._scaleData[0] = scale;
  }

  getAABB() {return {min: this.aabbMin, max: this.aabbMax}}

  destroy() {
    this.vertexBuffer?.destroy();
    this.indexBuffer?.destroy();
  }
}

/**
 * Multi-splat scene manager
 */
export class GaussianSplatScene {
  constructor(device, format, cameraBuffer) {
    this.device = device;
    this.format = format;
    this.cameraBuffer = cameraBuffer;
    this.splatLayers = [];
  }

  updateInstanceData(baseModelMatrix) {}

  async initialize(plyPath, scale = 1, topology = 'point-list') {
    const splatLayer = new GaussianSplatLayer(this.device, this.format, this.cameraBuffer, topology);
    try {
      if(scale) splatLayer.setScale(scale);
      await splatLayer.loadPLY(plyPath);
      this.splatLayers.push(splatLayer);
    } catch(err) {
      console.error('Failed to load splat:', err);
      return false;
    }
    return splatLayer;
  }

  async addSplat(source, options = {}) {
    const splatLayer = new GaussianSplatLayer(this.device, this.format, this.cameraBuffer);
    await splatLayer.loadPLY(source);
    if(options.scale) splatLayer.setScale(options.scale);
    if(options.depthTest !== undefined) splatLayer.depthTest = options.depthTest;
    this.splatLayers.push(splatLayer);
    return splatLayer;
  }

  render(pass, mesh, viewProjMatrix) {
    for(const splat of this.splatLayers) {
      splat.render(pass, mesh, viewProjMatrix);
    }
  }

  destroy() {
    for(const splat of this.splatLayers) {
      splat.destroy();
    }
    this.splatLayers = [];
  }
}

export class SplatColorAnimator {
  /**
   * @param {GPUDevice} device
   * @param {Float32Array} positions  — flat xyz array from parsedPLY, length = vertexCount * 3
   * @param {number} vertexCount
   */
  constructor(device, positions, vertexCount, colorBuffer) {
    this.device = device;
    this.positions = positions;
    this.vertexCount = vertexCount;
    // Precompute per-splat data we'll reuse every frame
    this._precompute();
    this.colorBuffer = colorBuffer;
    this._colorCPU = new Float32Array(vertexCount * 4);
    // 'rings' | 'wave' | 'zones' | 'pulse'
    this.mode = 'rings';
    this.speed = 1.0;
    this.scale = 60.0;
    this._zoneCache = null;
    this._colorFrameSkip = 2;
    this._colorFrameCount = 0;
  }

  _precompute() {
    const p = this.positions;
    const n = this.vertexCount;
    let cx = 0, cy = 0, cz = 0;
    for(let i = 0;i < n;i++) {
      cx += p[i * 3]; cy += p[i * 3 + 1]; cz += p[i * 3 + 2];
    }
    cx /= n; cy /= n; cz /= n;
    this._centroid = [cx, cy, cz];
    this._radii = new Float32Array(n);
    let maxR = 0;
    for(let i = 0;i < n;i++) {
      const dx = p[i * 3] - cx, dy = p[i * 3 + 1] - cy, dz = p[i * 3 + 2] - cz;
      const r = Math.sqrt(dx * dx + dy * dy + dz * dz);
      this._radii[i] = r;
      if(r > maxR) maxR = r;
    }
    this._maxR = maxR || 1;
    this._normPos = new Float32Array(n * 3);
    for(let i = 0;i < n;i++) {
      this._normPos[i * 3] = (p[i * 3] - cx) / this._maxR;
      this._normPos[i * 3 + 1] = (p[i * 3 + 1] - cy) / this._maxR;
      this._normPos[i * 3 + 2] = (p[i * 3 + 2] - cz) / this._maxR;
    }
  }

  setMode(mode) {this.mode = mode; this._zoneCache = null;}
  setSpeed(s) {this.speed = s;}
  setScale(s) {this.scale = s;}  // 1–100

  update(t) {
    this._colorFrameCount++;
    if(this._colorFrameCount % this._colorFrameSkip !== 0) return;
    const tt = t * this.speed;
    switch(this.mode) {
      case 'rings': this._modeRings(tt); break;
      case 'wave': this._modeWave(tt); break;
      case 'zones': this._modeZones(tt); break;
      case 'pulse': this._modePulse(tt); break;
    }
    this.device.queue.writeBuffer(this.colorBuffer, 0, this._colorCPU);
  }

  _modeRings(t) {
    const c = this._colorCPU;
    const sc = this.scale;
    const n = this.vertexCount;
    for(let i = 0;i < n;i++) {
      // normalised radius 0..1, shift over time
      const rn = this._radii[i] / this._maxR;
      const hue = (rn * 6.0 + t * 0.4) % 1.0;   // 6 rings cycling
      const [r, g, b] = _hsl(hue, 0.9, 0.5);
      c[i * 4] = r * sc;
      c[i * 4 + 1] = g * sc;
      c[i * 4 + 2] = b * sc;
      c[i * 4 + 3] = 1.0;
    }
  }

  _modeWave(t) {
    const c = this._colorCPU;
    const sc = this.scale;
    const n = this.vertexCount;
    const np = this._normPos;

    // Sweep direction rotates over time
    const ax = Math.cos(t * 0.2);
    const az = Math.sin(t * 0.2);

    for(let i = 0;i < n;i++) {
      const proj = np[i * 3] * ax + np[i * 3 + 2] * az;   // dot with sweep axis
      const wave = Math.sin(proj * Math.PI * 4.0 - t * 2.0);  // 4 crests
      const v = wave * 0.5 + 0.5;                 // 0..1

      // Two-colour crossfade: cold blue → hot coral
      const r = 0.05 + v * 0.95;
      const g = 0.15 + v * 0.3;
      const b = 0.95 - v * 0.85;

      c[i * 4] = r * sc;
      c[i * 4 + 1] = g * sc;
      c[i * 4 + 2] = b * sc;
      c[i * 4 + 3] = 1.0;
    }
  }

  _modeZones(t) {
    const c = this._colorCPU;
    const sc = this.scale;
    const n = this.vertexCount;
    const np = this._normPos;
    const ZONES = 5;

    if(!this._zoneSeeds) {
      this._zoneSeeds = Array.from({length: ZONES}, (_, i) => ({
        phi: (i / ZONES) * Math.PI * 2,
        theta: (i % 3) * Math.PI / 3,
        hue: i / ZONES,
      }));
    }

    // Compute drifting centers fresh from seeds + t  ← fix: derive, don't mutate
    const centers = this._zoneSeeds.map((z, i) => {
      const phi = z.phi + t * (0.12 + i * 0.04);
      const theta = z.theta + t * (0.07 + i * 0.03);
      return {
        x: Math.sin(theta) * Math.cos(phi),
        y: Math.cos(theta),
        z: Math.sin(theta) * Math.sin(phi),
        hue: (z.hue + t * 0.05) % 1.0,
      };
    });

    for(let i = 0;i < n;i++) {
      const nx = np[i * 3], ny = np[i * 3 + 1], nz = np[i * 3 + 2];
      let wr = 0, wg = 0, wb = 0, ws = 0;
      for(const z of centers) {
        const dx = nx - z.x, dy = ny - z.y, dz = nz - z.z;
        const d2 = dx * dx + dy * dy + dz * dz + 0.001;
        const w = 1.0 / d2;
        const [r, g, b] = _hsl(z.hue, 0.85, 0.5);
        wr += r * w; wg += g * w; wb += b * w; ws += w;
      }
      c[i * 4] = (wr / ws) * sc;
      c[i * 4 + 1] = (wg / ws) * sc;
      c[i * 4 + 2] = (wb / ws) * sc;
      c[i * 4 + 3] = 1.0;
    }
  }

  _modePulse(t) {
    const c = this._colorCPU;
    const sc = this.scale;
    const n = this.vertexCount;

    const pulses = [
      {freq: 0.8, hue: 0.0},
      {freq: 0.55, hue: 0.33},
      {freq: 0.35, hue: 0.66},
    ];

    for(let i = 0;i < n;i++) {
      const rn = this._radii[i] / this._maxR;
      let r = 0, g = 0, b = 0;

      for(const p of pulses) {
        const front = _fract(rn - t * p.freq);
        // Wider band + soft falloff so splats aren't invisible between pulses
        const band = Math.pow(Math.max(0, 1.0 - front * 5.0), 2.0);
        // Ambient base so splats are always visible even outside the band
        const ambient = 0.15;
        const [pr, pg, pb] = _hsl(p.hue, 1.0, 0.55);
        r += pr * (band + ambient);
        g += pg * (band + ambient);
        b += pb * (band + ambient);
      }

      c[i * 4] = Math.min(r, 1.0) * sc;
      c[i * 4 + 1] = Math.min(g, 1.0) * sc;
      c[i * 4 + 2] = Math.min(b, 1.0) * sc;
      c[i * 4 + 3] = 1.0;
    }
  }

  destroy() {
    this.colorBuffer?.destroy();
  }
}

export class SplatPositionAnimator {
  /**
   * @param {GPUDevice} device
   * @param {Float32Array} basePositions  — flat xyz from parsedPLY (vertexCount * 3)
   * @param {number} vertexCount
   */
  constructor(device, basePositions, vertexCount) {
    this.device = device;
    this.vertexCount = vertexCount;

    this._upAxis = 1;

    // Immutable snapshot of original mesh (meshA)
    this._basePos = new Float32Array(basePositions);

    // CPU scratch written every frame
    this._posCPU = new Float32Array(vertexCount * 3);
    this._posCPU.set(basePositions);

    // Morph state
    this._morphTarget = null;   // Float32Array xyz, same length
    this._morphFrom = null;   // snapshot at morph start
    this._morphT = 1.0;    // 0..1, 1 = done
    this._morphDur = 1.0;    // seconds

    // Per-splat random phases/seeds (computed once)
    this._phase = new Float32Array(vertexCount);
    this._seedX = new Float32Array(vertexCount);
    this._seedZ = new Float32Array(vertexCount);
    this._dustY0 = new Float32Array(vertexCount); // each splat's starting Y for dust fall
    for(let i = 0;i < vertexCount;i++) {
      this._phase[i] = Math.random() * Math.PI * 2;
      this._seedX[i] = (Math.random() - 0.5) * 2;
      this._seedZ[i] = (Math.random() - 0.5) * 2;
      this._dustY0[i] = basePositions[i * 3 + 1];
    }

    // Effect state
    this.mode = 'none';   // 'none'|'tornado'|'pulse'|'changeShape'|'dust'|'liquid'
    this.speed = 1.0;
    this.scale = 1.0;      // effect magnitude multiplier

    // Dust state
    this._dustProgress = 0;  // 0..1
    this._dustActive = false;

    // Frame skip (cheaper CPU budget)
    this._frameSkip = 1;
    this._frameCount = 0;

    // GPU buffer: xyz per splat, dynamic
    this.posBuffer = device.createBuffer({
      label: 'splat-dynamic-pos',
      size: vertexCount * 3 * 4,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });

    // Upload initial positions
    device.queue.writeBuffer(this.posBuffer, 0, this._posCPU);
  }

  // ─── Public API ────────────────────────────────────────────────────────────

  setMode(mode) {this.mode = mode; this._dustActive = false;}
  setSpeed(s) {this.speed = s;}
  setScale(s) {this.scale = s;}
  setFrameSkip(n) {this._frameSkip = Math.max(1, n | 0);}

  /**
   * Smoothly interpolate from current positions to a new Float32Array of xyz.
   * @param {Float32Array} targetPositions  length = vertexCount * 3
   * @param {number} duration              seconds
   */
  morphTo(targetPositions, duration = 1.5) {
    if(targetPositions.length !== this.vertexCount * 3)
      throw new Error('morphTo: target length mismatch');
    this._morphFrom = new Float32Array(this._posCPU);
    this._morphTarget = targetPositions;
    this._morphT = 0;
    this._morphDur = Math.max(0.001, duration);
  }

  /** Reset to original meshA positions */
  resetToBase(duration = 1.5) {
    this.morphTo(this._basePos, duration);
  }

  /**
   * Trigger the "dust" effect: splats fall and scatter horizontally toward Y=0.
   * @param {number} duration  seconds for full collapse
   */
  triggerDust(duration = 2.0) {
    // Snapshot current positions as the fall origins
    this._dustY0.set(this._posCPU.filter((_, i) => i % 3 === 1)
      // faster: direct loop
    );
    for(let i = 0;i < this.vertexCount;i++)
      this._dustY0[i] = this._posCPU[i * 3 + 1];

    this._dustProgress = 0;
    this._dustDur = Math.max(0.001, duration);
    this._dustActive = true;
    this.mode = 'dust';
  }

  // ─── Per-frame update ──────────────────────────────────────────────────────

  update(t, dt = 0.016) {
    this._frameCount++;
    if(this._frameCount % this._frameSkip !== 0) return;

    const dt_ = dt * this._frameSkip;

    // Advance morph
    if(this._morphT < 1.0) {
      this._morphT = Math.min(1.0, this._morphT + dt_ / this._morphDur);
      this._applyMorph(this._morphT);
    } else {
      // Apply procedural effect on top of current base positions
      const tt = t * this.speed;
      switch(this.mode) {
        case 'tornado': this._modeTornado(tt); break;
        case 'pulse': this._modePulse(tt); break;
        case 'changeShape': this._modeChangeShape(tt); break;
        case 'dust': this._modeDust(dt_); break;
        case 'liquid': this._modeLiquid(tt); break;
        case 'hold':
          // nothing
          break;
        case 'none': default:
          this._posCPU.set(this._basePos);
          break;
      }
    }

    this.device.queue.writeBuffer(this.posBuffer, 0, this._posCPU);
  }

  // ─── Morph ─────────────────────────────────────────────────────────────────

  _applyMorph(rawT) {
    // Smooth-step easing
    const t = rawT * rawT * (3 - 2 * rawT);
    const from = this._morphFrom;
    const target = this._morphTarget;
    const out = this._posCPU;
    const n3 = this.vertexCount * 3;
    for(let i = 0;i < n3;i++) {
      out[i] = from[i] + (target[i] - from[i]) * t;
    }
  }

  // ─── Procedural effects ────────────────────────────────────────────────────

  /**
   * Tornado: splats orbit the Y-axis with radius and angular speed
   * proportional to height; tip contracts, base fans out.
   */
  _modeTornado(t) {
    const p = this._posCPU;
    const b = this._basePos;
    const ph = this._phase;
    const sc = this.scale;
    const n = this.vertexCount;
    const up = this._upAxis;
    const side = up === 1 ? 2 : 1; // the "other horizontal" axis when up changes

    let cUp = 0;
    for(let i = 0;i < n;i++) cUp += b[i * 3 + up];
    cUp /= n;

    for(let i = 0;i < n;i++) {
      const bx = b[i * 3], bu = b[i * 3 + up], bs = b[i * 3 + side];
      const hn = Math.max(0, Math.min(1, (bu - cUp) / (sc * 5 + 0.001)));
      const radius = (1 - hn) * sc * 0.8 + 0.05;
      const omega = t * (1 + hn * 2) + ph[i];

      p[i * 3] = bx + Math.cos(omega) * radius;
      p[i * 3 + up] = bu;
      p[i * 3 + side] = bs + Math.sin(omega) * radius;
    }
  }

  /**
   * Pulse: radial breathing — splats oscillate outward from centroid.
   * Different frequencies per concentric shell give a ripple feel.
   */
  _modePulse(t) {
    const p = this._posCPU;
    const b = this._basePos;
    const ph = this._phase;
    const sc = this.scale;
    const n = this.vertexCount;

    // Centroid
    let cx = 0, cy = 0, cz = 0;
    for(let i = 0;i < n;i++) {
      cx += b[i * 3]; cy += b[i * 3 + 1]; cz += b[i * 3 + 2];
    }
    cx /= n; cy /= n; cz /= n;

    for(let i = 0;i < n;i++) {
      const bx = b[i * 3], by = b[i * 3 + 1], bz = b[i * 3 + 2];
      const dx = bx - cx, dy = by - cy, dz = bz - cz;
      const r = Math.sqrt(dx * dx + dy * dy + dz * dz) + 0.0001;
      // Phase offset = distance-based shell → ripple effect
      const wave = Math.sin(t * 2.5 - r * 3.0 + ph[i] * 0.3);
      const disp = wave * sc * 0.15;
      const nx = dx / r, ny = dy / r, nz = dz / r;
      p[i * 3] = bx + nx * disp;
      p[i * 3 + 1] = by + ny * disp;
      p[i * 3 + 2] = bz + nz * disp;
    }
  }

  /**
   * changeShape: sinusoidal warp that drifts over time, morphing the mesh
   * into abstract bulging/twisted configurations.
   */
  _modeChangeShape(t) {
    const p = this._posCPU;
    const b = this._basePos;
    const ph = this._phase;
    const sx = this._seedX;
    const sz = this._seedZ;
    const sc = this.scale * 0.4;
    const n = this.vertexCount;

    for(let i = 0;i < n;i++) {
      const bx = b[i * 3], by = b[i * 3 + 1], bz = b[i * 3 + 2];
      // Three overlapping sine fields with different frequencies + drift
      const f1 = Math.sin(bx * 1.2 + t * 0.7 + ph[i]);
      const f2 = Math.cos(by * 1.5 - t * 0.5 + sx[i]);
      const f3 = Math.sin(bz * 0.9 + t * 0.9 + sz[i]);
      p[i * 3] = bx + f1 * sc;
      p[i * 3 + 1] = by + f2 * sc;
      p[i * 3 + 2] = bz + f3 * sc;
    }
  }

  setUpAxis(axis) {
    // accepts 'Y' | 'Z' | 1 | 2
    if(axis === 'Y' || axis === 1) this._upAxis = 1;
    else if(axis === 'Z' || axis === 2) this._upAxis = 2;
    else throw new Error(`setUpAxis: invalid axis "${axis}"`);
  }

  /**
   * Dust: splats collapse toward Y=0 with lateral drift and individual
   * fall delays (earlier splats start falling sooner based on _phase).
   */
  _modeDust(dt) {
    if(!this._dustActive) return;

    this._dustProgress = Math.min(1.0, this._dustProgress + dt / this._dustDur);

    const p = this._posCPU;
    const b = this._basePos;
    const ph = this._phase;
    const sx = this._seedX;
    const sz = this._seedZ;
    const n = this.vertexCount;
    const pr = this._dustProgress;
    const up = this._upAxis;
    const h1 = up === 1 ? 0 : 0; // horizontal axis 1 (always x)
    const h2 = up === 1 ? 2 : 1; // horizontal axis 2 (whichever isn't up)

    for(let i = 0;i < n;i++) {
      const delay = ph[i] / (Math.PI * 2) * 0.4;
      const lp = Math.max(0, Math.min(1, (pr - delay) / (1 - delay)));
      const ease = lp * lp;

      const bu = b[i * 3 + up];
      const bh1 = b[i * 3 + h1];
      const bh2 = b[i * 3 + h2];

      p[i * 3 + up] = bu * (1 - ease);  // collapse toward 0 on the up axis

      const spread = ease * 2.0;
      p[i * 3 + h1] = bh1 + sx[i] * spread;
      p[i * 3 + h2] = bh2 + sz[i] * spread;
    }

    if(this._dustProgress >= 1.0) this._dustActive = false;
  }

  /**
   * Liquid: per-splat sinusoidal displacement with normal-direction bias
   * and slow global sloshing, giving a fluid surface feel.
   */
  _modeLiquid(t) {
    const p = this._posCPU;
    const b = this._basePos;
    const ph = this._phase;
    const sx = this._seedX;
    const sz = this._seedZ;
    const sc = this.scale * 0.12;
    const n = this.vertexCount;

    // Slow global slosh direction (rotates over time)
    const sloshX = Math.cos(t * 0.3) * 0.5;
    const sloshZ = Math.sin(t * 0.2) * 0.5;

    for(let i = 0;i < n;i++) {
      const bx = b[i * 3], by = b[i * 3 + 1], bz = b[i * 3 + 2];

      // High-freq surface ripple (local)
      const ripple = Math.sin(bx * 4.0 + t * 3.0 + ph[i])
        * Math.cos(bz * 3.5 - t * 2.5 + sx[i]);

      // Low-freq slosh (global bias)
      const slosh = Math.sin(t * 1.2 + sz[i] * 0.5) * 0.3;

      // Mostly vertical displacement (Y) with tiny horizontal jitter
      p[i * 3] = bx + sloshX * sc + (Math.random() - 0.5) * sc * 0.05;
      p[i * 3 + 1] = by + (ripple + slosh) * sc;
      p[i * 3 + 2] = bz + sloshZ * sc + (Math.random() - 0.5) * sc * 0.05;
    }
  }

  destroy() {
    this.posBuffer?.destroy();
  }
}

// Helpers
function _hsl(h, s, l) {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs((h * 6) % 2 - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;
  const hi = (h * 6) | 0;
  if(hi === 0) {r = c; g = x; b = 0;}
  else if(hi === 1) {r = x; g = c; b = 0;}
  else if(hi === 2) {r = 0; g = c; b = x;}
  else if(hi === 3) {r = 0; g = x; b = c;}
  else if(hi === 4) {r = x; g = 0; b = c;}
  else {r = c; g = 0; b = x;}
  return [r + m, g + m, b + m];
}

function _fract(x) {return x - Math.floor(x);}