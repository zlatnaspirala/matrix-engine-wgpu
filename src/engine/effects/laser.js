import { mat4, vec3 } from 'wgpu-matrix';
import {laserShaderCode} from '../../shaders/laser/laser';
/**
 * LaserProjectile
 * Draws N simultaneous laser beams from pointA → pointB.
 * Follows FlameEmitter interface:
 *   updateInstanceData(baseModelMatrix)
 *   render(pass, mesh, viewProjMatrix, dt)
 *
 * Modes:
 *   0 = solid
 *   1 = pulse
 *   2 = helix
 *   3 = disintegrate
 *   4 = plasma
 */
export class LaserProjectile {
  /**
   * @param {GPUDevice} device
   * @param {string}    format
   * @param {GPUBuffer} cameraBuffer
   * @param {object}    opts
   * @param {number}    opts.maxBeams       max simultaneous beams (default 8)
   * @param {number}    opts.mode           visual mode 0-4 (default 0)
   * @param {number[]}  opts.colorA         core color rgba (default cyan)
   * @param {number[]}  opts.colorB         glow color rgba (default blue)
   * @param {number}    opts.width          beam width (default 0.05)
   * @param {number}    opts.intensity      brightness (default 2.0)
   * @param {number}    opts.pulseFreq      pulse frequency for mode 1 (default 4.0)
   * @param {number}    opts.scrollSpeed    UV scroll speed (default 1.0)
   * @param {GaussianSplatLayer} opts.splatLayer  optional splat enhancement
   */
  constructor(device, format, cameraBuffer, opts = {}) {
    this.device       = device;
    this.format       = format;
    this.cameraBuffer = cameraBuffer;
    this.enabled      = true;
    this.time         = 0;

    this.maxBeams    = opts.maxBeams   ?? 8;
    this.mode        = opts.mode       ?? 0;
    this.colorA      = opts.colorA     ?? [0.0, 1.0, 1.0, 1.0]; // cyan core
    this.colorB      = opts.colorB     ?? [0.0, 0.2, 1.0, 1.0]; // blue glow
    this.width       = opts.width      ?? 0.05;
    this.intensity   = opts.intensity  ?? 2.0;
    this.pulseFreq   = opts.pulseFreq  ?? 4.0;
    this.scrollSpeed = opts.scrollSpeed ?? 1.0;

    // Optional splat enhancement layer
    this.splatLayer  = opts.splatLayer ?? null;

    // floats per instance: 16 (matrix) + 4 + 4 + 4 + 4 = 32
    this.floatsPerInstance = 32;

    // Active beam registry
    // Each beam: { id, from[3], to[3], life, maxLife, active }
    this._beams = [];
    this._beamIdCounter = 0;

    this._instanceData = new Float32Array(this.maxBeams * this.floatsPerInstance);
    this._localMatrix  = mat4.create();
    this._finalMatrix  = mat4.create();
    this._scratchVec   = new Float32Array(3);

    this._initPipeline();

    // Optional splat impact effect
    if (this.splatLayer) {
      this._splatPosCPU   = new Float32Array(this.splatLayer.vertexCount * 3);
      this._splatColorCPU = new Float32Array(this.splatLayer.vertexCount * 4);
      this._splatPhase    = new Float32Array(this.splatLayer.vertexCount)
        .map(() => Math.random() * Math.PI * 2);
    }
  }

  // ── Pipeline ──────────────────────────────────────────────────────────────

  _initPipeline() {
    // Quad: two triangles forming a -1..1 plane along X (length) and Y (width)
    // UV: u along length (0..1), v across width (-1..1 remapped to 0..1)
    const verts = new Float32Array([
    //  x      y      z     u     v
      0.0,  -1.0,  0.0,   0.0,  -1.0,
      0.0,   1.0,  0.0,   0.0,   1.0,
      1.0,  -1.0,  0.0,   1.0,  -1.0,
      1.0,   1.0,  0.0,   1.0,   1.0,
    ]);
    const indices = new Uint16Array([0, 1, 2, 1, 3, 2]);

    this.vertexBuffer = this.device.createBuffer({
      label: 'laser-verts',
      size: verts.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    this.device.queue.writeBuffer(this.vertexBuffer, 0, verts);

    this.indexBuffer = this.device.createBuffer({
      label: 'laser-idx',
      size: Math.ceil(indices.byteLength / 4) * 4,
      usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
    });
    this.device.queue.writeBuffer(this.indexBuffer, 0, indices);
    this.indexCount = indices.length;

    this.instanceBuffer = this.device.createBuffer({
      label: 'laser-instances',
      size: this.maxBeams * this.floatsPerInstance * 4,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });

    const bgl = this.device.createBindGroupLayout({
      label: 'laser-bgl',
      entries: [
        { binding: 0, visibility: GPUShaderStage.VERTEX, buffer: {} },
        { binding: 1, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
          buffer: { type: 'read-only-storage' } },
      ]
    });

    this.bindGroup = this.device.createBindGroup({
      label: 'laser-bg',
      layout: bgl,
      entries: [
        { binding: 0, resource: { buffer: this.cameraBuffer } },
        { binding: 1, resource: { buffer: this.instanceBuffer } },
      ]
    });

    const shaderModule = this.device.createShaderModule({
      label: 'laser-shader',
      code: laserShaderCode
    });

    this.pipeline = this.device.createRenderPipeline({
      label: 'laser-pipeline',
      layout: this.device.createPipelineLayout({ bindGroupLayouts: [bgl] }),
      vertex: {
        module: shaderModule,
        entryPoint: 'vsMain',
        buffers: [
          {
            arrayStride: 20, // 5 floats * 4
            attributes: [
              { shaderLocation: 0, offset: 0,  format: 'float32x3' }, // pos
              { shaderLocation: 1, offset: 12, format: 'float32x2' }, // uv
            ]
          }
        ]
      },
      fragment: {
        module: shaderModule,
        entryPoint: 'fsMain',
        targets: [
          {
            format: this.format,
            blend: {
              color: { srcFactor: 'src-alpha', dstFactor: 'one', operation: 'add' },
              alpha: { srcFactor: 'one', dstFactor: 'one-minus-src-alpha', operation: 'add' }
            }
          },
          { format: 'rgba16float' },
          { format: 'rgba16float' }
        ]
      },
      primitive: { topology: 'triangle-list', cullMode: 'none' },
      depthStencil: {
        format: 'depth24plus',
        depthWriteEnabled: false,
        depthCompare: 'less'
      }
    });
  }

  // ── Public API ────────────────────────────────────────────────────────────

  /**
   * Fire a beam from pointA to pointB.
   * @param {number[]} from    [x,y,z] world position
   * @param {number[]} to      [x,y,z] world position
   * @param {number}   life    duration in seconds (0 = permanent until cancelBeam)
   * @param {object}   overrides  per-beam color/mode/width/intensity overrides
   * @returns {number}  beamId — use to cancel or update
   */
  fireBeam(from, to, life = 0, overrides = {}) {
    if (this._beams.length >= this.maxBeams) {
      // Evict oldest expired beam, or oldest overall
      const expired = this._beams.findIndex(b => !b.active);
      if (expired !== -1) this._beams.splice(expired, 1);
      else this._beams.shift();
    }

    const id = this._beamIdCounter++;
    this._beams.push({
      id,
      from:      [...from],
      to:        [...to],
      life,
      maxLife:   life,
      age:       0,
      active:    true,
      colorA:    overrides.colorA     ?? [...this.colorA],
      colorB:    overrides.colorB     ?? [...this.colorB],
      mode:      overrides.mode       ?? this.mode,
      width:     overrides.width      ?? this.width,
      intensity: overrides.intensity  ?? this.intensity,
      pulseFreq: overrides.pulseFreq  ?? this.pulseFreq,
      scroll:    overrides.scrollSpeed ?? this.scrollSpeed,
    });

    return id;
  }

  /**
   * Update a live beam's target (for tracking effects).
   */
  updateBeam(id, from, to) {
    const b = this._beams.find(b => b.id === id);
    if (!b) return;
    if (from) b.from = [...from];
    if (to)   b.to   = [...to];
  }

  cancelBeam(id) {
    const b = this._beams.find(b => b.id === id);
    if (b) b.active = false;
  }

  cancelAll() { this._beams = []; }

  setMode(mode)           { this.mode = mode; }
  setColorA(r, g, b, a)  { this.colorA = [r, g, b, a ?? 1]; }
  setColorB(r, g, b, a)  { this.colorB = [r, g, b, a ?? 1]; }
  setWidth(w)             { this.width = w; }
  setIntensity(v)         { this.intensity = v; }

  // ── Effect interface ──────────────────────────────────────────────────────

  updateInstanceData(baseModelMatrix) {
    if (!this.enabled) return;

    // Expire timed beams
    for (const b of this._beams) {
      if (b.life > 0 && b.age >= b.life) b.active = false;
    }
    // Keep only active
    const active = this._beams.filter(b => b.active);
    const count  = Math.min(active.length, this.maxBeams);
    if (count === 0) return;

    for (let i = 0; i < count; i++) {
      const b = active[i];

      // Build beam matrix: translate to `from`, orient toward `to`, scale by length/width
      const dx = b.to[0] - b.from[0];
      const dy = b.to[1] - b.from[1];
      const dz = b.to[2] - b.from[2];
      const len = Math.sqrt(dx * dx + dy * dy + dz * dz) || 0.001;

      // Build look-at rotation: beam points along +X axis of the quad
      const forward = [dx / len, dy / len, dz / len];
      const up      = Math.abs(forward[1]) < 0.99 ? [0, 1, 0] : [1, 0, 0];

      // Right = forward × up, then recompute up = right × forward
      const right = _cross(forward, up);
      _normalize(right);
      const realUp = _cross(right, forward);

      // Build rotation matrix (column-major for WebGPU)
      const m = this._localMatrix;
      mat4.identity(m);

      // Columns: right, realUp, -forward (OpenGL convention), then translate
      m[0]  = forward[0] * len;
      m[1]  = forward[1] * len;
      m[2]  = forward[2] * len;
      m[3]  = 0;

      m[4]  = realUp[0] * b.width;
      m[5]  = realUp[1] * b.width;
      m[6]  = realUp[2] * b.width;
      m[7]  = 0;

      m[8]  = right[0] * b.width;
      m[9]  = right[1] * b.width;
      m[10] = right[2] * b.width;
      m[11] = 0;

      m[12] = b.from[0];
      m[13] = b.from[1];
      m[14] = b.from[2];
      m[15] = 1;

      // Apply base model matrix
      mat4.multiply(baseModelMatrix, m, this._finalMatrix);

      const off = i * this.floatsPerInstance;
      this._instanceData.set(this._finalMatrix, off);

      // colorA
      this._instanceData[off + 16] = b.colorA[0];
      this._instanceData[off + 17] = b.colorA[1];
      this._instanceData[off + 18] = b.colorA[2];
      this._instanceData[off + 19] = b.colorA[3];

      // colorB
      this._instanceData[off + 20] = b.colorB[0];
      this._instanceData[off + 21] = b.colorB[1];
      this._instanceData[off + 22] = b.colorB[2];
      this._instanceData[off + 23] = b.colorB[3];

      // params: time, length, width, mode
      this._instanceData[off + 24] = this.time;
      this._instanceData[off + 25] = len;
      this._instanceData[off + 26] = b.width;
      this._instanceData[off + 27] = b.mode;

      // extra: intensity, pulseFreq, scroll, unused
      this._instanceData[off + 28] = b.intensity;
      this._instanceData[off + 29] = b.pulseFreq;
      this._instanceData[off + 30] = b.scroll;
      this._instanceData[off + 31] = 0;
    }

    this.device.queue.writeBuffer(
      this.instanceBuffer, 0,
      this._instanceData.subarray(0, count * this.floatsPerInstance)
    );

    // Optional splat impact effect at beam tips
    if (this.splatLayer && active.length > 0) {
      this._updateSplatImpact(active[0]);
    }
  }

  render(pass, mesh, viewProjMatrix, dt = 0.016) {
    this.time += dt;

    // Age timed beams
    for (const b of this._beams) {
      if (b.life > 0) b.age += dt;
    }

    const count = Math.min(this._beams.filter(b => b.active).length, this.maxBeams);
    if (count === 0) return;

    this.device.queue.writeBuffer(this.cameraBuffer, 0, viewProjMatrix);
    pass.setPipeline(this.pipeline);
    pass.setBindGroup(0, this.bindGroup);
    pass.setVertexBuffer(0, this.vertexBuffer);
    pass.setIndexBuffer(this.indexBuffer, 'uint16');
    pass.drawIndexed(this.indexCount, count);
  }

  // ── Splat impact enhancement (optional) ──────────────────────────────────

  _updateSplatImpact(beam) {
    const n   = this.splatLayer.vertexCount;
    const p   = this._splatPosCPU;
    const c   = this._splatColorCPU;
    const ph  = this._splatPhase;
    const t   = this.time;

    // Exploding ring around beam tip
    const tip = beam.to;
    const r   = 0.3 + Math.sin(t * 8.0) * 0.1;

    for (let i = 0; i < n; i++) {
      const angle = (i / n) * Math.PI * 2 + t * 3.0 + ph[i];
      const ri    = r * (0.7 + Math.sin(ph[i] + t * 5.0) * 0.3);
      p[i * 3]     = tip[0] + Math.cos(angle) * ri;
      p[i * 3 + 1] = tip[1] + Math.sin(ph[i] * 2.0 + t) * 0.1;
      p[i * 3 + 2] = tip[2] + Math.sin(angle) * ri;

      const pulse = Math.sin(t * 6.0 + ph[i]) * 0.5 + 0.5;
      c[i * 4]     = beam.colorA[0] * pulse;
      c[i * 4 + 1] = beam.colorA[1] * pulse;
      c[i * 4 + 2] = beam.colorA[2] * pulse;
      c[i * 4 + 3] = 1.0;
    }

    this.device.queue.writeBuffer(
      this.splatLayer.positionAnimator.posBuffer, 0, p
    );
    this.device.queue.writeBuffer(this.splatLayer.colorBuffer, 0, c);
  }

  destroy() {
    this.vertexBuffer?.destroy();
    this.indexBuffer?.destroy();
    this.instanceBuffer?.destroy();
  }
}

function _cross(a, b) {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}

function _normalize(v) {
  const len = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]) || 1;
  v[0] /= len; v[1] /= len; v[2] /= len;
  return v;
}