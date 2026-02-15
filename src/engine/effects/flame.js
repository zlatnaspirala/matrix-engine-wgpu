import {mat4} from "wgpu-matrix";
import {flameEffect} from "../../shaders/flame-effect/flameEffect";

// ---------------------------------------------------------------------------
// Ready-made presets — pass to FlameEffect.fromPreset() or use as defaults
// ---------------------------------------------------------------------------
export const FlamePresets = {
  // Natural campfire / torch
  natural: {
    intensity:   12.0,
    speed:        1.0,
    turbulence:   0.5,
    stretch:      1.0,
    tint:        [1.0, 1.0, 1.0],  // neutral → pure fire palette
    tintStrength: 0.0,
  },
  // Tall torch / pillar of fire
  torch: {
    intensity:   14.0,
    speed:        1.2,
    turbulence:   0.35,
    stretch:      2.0,             // double height
    tint:        [1.0, 1.0, 1.0],
    tintStrength: 0.0,
  },
  // Wide, low bonfire
  bonfire: {
    intensity:   10.0,
    speed:        0.8,
    turbulence:   0.9,
    stretch:      0.5,             // short & wide
    tint:        [1.0, 1.0, 1.0],
    tintStrength: 0.0,
  },
  // Magical blue flame
  magic: {
    intensity:    8.0,
    speed:        1.4,
    turbulence:   0.6,
    stretch:      1.3,
    tint:        [0.1, 0.4, 1.0],  // blue
    tintStrength: 0.85,
  },
  // Hellfire — dark purple/red
  hell: {
    intensity:   16.0,
    speed:        0.9,
    turbulence:   0.8,
    stretch:      1.6,
    tint:        [0.6, 0.0, 0.8],  // purple
    tintStrength: 0.7,
  },
  // Poison green
  poison: {
    intensity:    9.0,
    speed:        1.1,
    turbulence:   0.7,
    stretch:      1.1,
    tint:        [0.1, 1.0, 0.15], // green
    tintStrength: 0.9,
  },
};

// ---------------------------------------------------------------------------
// FlameEffect
// ---------------------------------------------------------------------------
export class FlameEffect {
  /**
   * @param {GPUDevice}  device
   * @param {string}     format       - swap-chain / canvas format (e.g. "bgra8unorm")
   * @param {string}     colorFormat  - render-pass color attachment format (e.g. "rgba16float")
   * @param {object}     params       - initial flame parameters (see defaults below)
   */
  constructor(device, format, colorFormat, params = {}) {
    this.device      = device;
    this.format      = format;
    this.colorFormat = colorFormat ?? format;

    // --- All tuneable params with defaults ---
    const defaults = FlamePresets.natural;
    this.intensity   = params.intensity   ?? defaults.intensity;
    this.speed       = params.speed       ?? defaults.speed;
    this.turbulence  = params.turbulence  ?? defaults.turbulence;  // 0 = calm, 1 = chaotic
    this.stretch     = params.stretch     ?? defaults.stretch;     // >1 = tall, <1 = wide
    this.tint        = params.tint        ?? defaults.tint;        // [r, g, b]  0..1 each
    this.tintStrength= params.tintStrength?? defaults.tintStrength;// 0 = natural, 1 = full tint

    this.time    = 0;
    this.enabled = true;

    this._initPipeline();
  }

  /** Convenience factory: new FlameEffect.fromPreset(device, fmt, hdrFmt, 'magic') */
  static fromPreset(device, format, colorFormat, presetName) {
    const preset = FlamePresets[presetName];
    if (!preset) throw new Error(`Unknown FlamePreset: "${presetName}". Available: ${Object.keys(FlamePresets).join(", ")}`);
    return new FlameEffect(device, format, colorFormat, preset);
  }

  // -------------------------------------------------------------------------
  // Public setters  (call any time — written to GPU on next updateInstanceData)
  // -------------------------------------------------------------------------
  setIntensity(v)    { this.intensity    = v; }
  setSpeed(v)        { this.speed        = v; }
  setTurbulence(v)   { this.turbulence   = Math.max(0, Math.min(1, v)); }
  setStretch(v)      { this.stretch      = Math.max(0.05, v); }
  /** @param {[number,number,number]} rgb  e.g. [0.1, 0.4, 1.0] for blue */
  setTint(rgb)       { this.tint         = rgb; }
  /** @param {number} v  0 = natural fire colours, 1 = fully tinted */
  setTintStrength(v) { this.tintStrength = Math.max(0, Math.min(1, v)); }

  /** Apply a named preset instantly */
  applyPreset(name) {
    const p = FlamePresets[name];
    if (!p) throw new Error(`Unknown FlamePreset: "${name}"`);
    Object.assign(this, {
      intensity:    p.intensity,
      speed:        p.speed,
      turbulence:   p.turbulence,
      stretch:      p.stretch,
      tint:         p.tint,
      tintStrength: p.tintStrength,
    });
  }

  // -------------------------------------------------------------------------
  _initPipeline() {
    const S = 40;
    const vertexData = new Float32Array([
      -0.5 * S,  0.5 * S, 0,
       0.5 * S,  0.5 * S, 0,
      -0.5 * S, -0.5 * S, 0,
       0.5 * S, -0.5 * S, 0,
    ]);
    const uvData    = new Float32Array([0, 1,  1, 1,  0, 0,  1, 0]);
    const indexData = new Uint16Array([0, 2, 1, 1, 2, 3]);

    this.vertexBuffer = this._uploadVertex(vertexData);
    this.uvBuffer     = this._uploadVertex(uvData);

    this.indexBuffer = this.device.createBuffer({
      size: Math.ceil(indexData.byteLength / 4) * 4,
      usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST
    });
    this.device.queue.writeBuffer(this.indexBuffer, 0, indexData);
    this.indexCount = indexData.length;

    // Camera uniform: mat4 = 64 bytes
    this.cameraBuffer = this.device.createBuffer({
      size: 64,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });

    // ModelData uniform layout:
    //   offset   0 : model        64 bytes  (mat4)
    //   offset  64 : timeSpeed    16 bytes  (vec4)
    //   offset  80 : params       16 bytes  (vec4)
    //   offset  96 : tint         16 bytes  (vec4)
    //   total = 112 bytes
    this.modelBuffer = this.device.createBuffer({
      size: 112,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });

    const bindGroupLayout = this.device.createBindGroupLayout({
      entries: [
        { binding: 0, visibility: GPUShaderStage.VERTEX,                         buffer: { type: "uniform" } },
        { binding: 1, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: { type: "uniform" } },
      ]
    });

    this.bindGroup = this.device.createBindGroup({
      layout: bindGroupLayout,
      entries: [
        { binding: 0, resource: { buffer: this.cameraBuffer } },
        { binding: 1, resource: { buffer: this.modelBuffer  } },
      ]
    });

    const shaderModule  = this.device.createShaderModule({ code: flameEffect });
    const pipelineLayout = this.device.createPipelineLayout({ bindGroupLayouts: [bindGroupLayout] });

    this.pipeline = this.device.createRenderPipeline({
      layout: pipelineLayout,
      vertex: {
        module: shaderModule,
        entryPoint: "vsMain",
        buffers: [
          { arrayStride: 3 * 4, attributes: [{ shaderLocation: 0, offset: 0, format: "float32x3" }] },
          { arrayStride: 2 * 4, attributes: [{ shaderLocation: 1, offset: 0, format: "float32x2" }] },
        ]
      },
      fragment: {
        module: shaderModule,
        entryPoint: "fsMain",
        targets: [{
          format: this.colorFormat,
          blend: {
            color: { srcFactor: "src-alpha", dstFactor: "one",                 operation: "add" },
            alpha: { srcFactor: "one",       dstFactor: "one-minus-src-alpha", operation: "add" },
          }
        }]
      },
      primitive:    { topology: "triangle-list" },
      depthStencil: { depthWriteEnabled: false, depthCompare: "always", format: "depth24plus" },
    });
  }

  _uploadVertex(data) {
    const buf = this.device.createBuffer({
      size: data.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
    });
    this.device.queue.writeBuffer(buf, 0, data);
    return buf;
  }

  // -------------------------------------------------------------------------
  updateInstanceData(baseModelMatrix) {
    const local = mat4.identity();
    mat4.translate(local, [0, 20, 0], local);

    const finalMat = mat4.identity();
    mat4.multiply(baseModelMatrix, local, finalMat);

    // timeSpeed: [time, speed, 0, 0]
    const timeSpeed = new Float32Array([this.time, this.speed, 0, 0]);

    // params: [intensity, turbulence, stretch, 0]
    const params = new Float32Array([this.intensity, this.turbulence, this.stretch, 0]);

    // tint: [r, g, b, tintStrength]
    const tint = new Float32Array([...this.tint, this.tintStrength]);

    this.device.queue.writeBuffer(this.modelBuffer,  0, finalMat);
    this.device.queue.writeBuffer(this.modelBuffer, 64, timeSpeed);
    this.device.queue.writeBuffer(this.modelBuffer, 80, params);
    this.device.queue.writeBuffer(this.modelBuffer, 96, tint);
  }

  draw(pass, cameraMatrix) {
    this.device.queue.writeBuffer(this.cameraBuffer, 0, cameraMatrix);

    pass.setPipeline(this.pipeline);
    pass.setBindGroup(0, this.bindGroup);
    pass.setVertexBuffer(0, this.vertexBuffer);
    pass.setVertexBuffer(1, this.uvBuffer);
    pass.setIndexBuffer(this.indexBuffer, "uint16");
    pass.drawIndexed(this.indexCount);
  }

  render(pass, mesh, viewProjMatrix, dt = 0.01) {
    if (!this.enabled) return;
    this.time += dt;
    this.draw(pass, viewProjMatrix);
  }
}