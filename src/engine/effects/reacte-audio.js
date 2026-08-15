/**
 * @description
 * AudioSplatFieldEffect
 * Standalone audio-reactive point-cloud driver. 1000-point topology by default.
 * Does NOT touch EarthquakeEffect, AudioSplatEffect, or any other effect class.
 *
 * Consumes the same [low, mid, high, energy, beat] tuple your
 * "Audio Reactive Node" already produces via n._returnCache.
 *
 * Two ways to use it:
 *  1. Standalone: call `render(pass, viewProjMatrix)` — it owns its own
 *     minimal point-list pipeline, so it draws on its own with zero
 *     dependency on GaussianSplatLayer.
 *  2. Attached: pass `attachTo(splatLayer)` an existing GaussianSplatLayer —
 *     it will write into that layer's slot-2 dynamic position buffer and
 *     slot-1 color buffer each frame instead of drawing itself. Nothing in
 *     GaussianSplatLayer is modified; it just uses the public
 *     attachPositionAnimator-compatible surface (posBuffer/colorBuffer).
 *
 * Part of MEWGPU Effect system
 *
 * @filename
 * AudioSplatFieldEffect.js
 *
 * @Licence
 * This Source Code Form is subject to the terms of the
 * Mozilla Public License, v. 2.0.
 * If a copy of the MPL was not distributed with this file,
 * You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2026 Nikola Lukić zlatnaspirala@gmail.com
 */

import {isMobile} from "../utils";

export class AudioSplatFieldEffect {
  /**
   * @param {GPUDevice} device
   * @param {object} [opts]
   * @param {number} [opts.pointCount=1000]
   * @param {Float32Array} [opts.basePositions]  optional external xyz array (pointCount*3).
   *        If omitted, a procedural point set is generated (sphere shells for
   *        spectrumShell/beatScatter, resampled into a ribbon for waveformRibbon).
   * @param {'spectrumShell'|'beatScatter'|'waveformRibbon'} [opts.mode='spectrumShell']
   * @param {string} [opts.format]  color target format, required only for standalone render()
   * @param {GPUBuffer} [opts.cameraBuffer]  required only for standalone render()
   */
  constructor(device, opts = {}) {
    this.device = device;
    this.pointCount = opts.pointCount ?? isMobile() ? 1200 : 3500;
    this.mode = opts.mode ?? 'spectrumShell';
    this.format = opts.format ?? null;
    this.cameraBuffer = opts.cameraBuffer ?? null;
    // set via attachTo()
    this._attachedLayer = null;
    this._basePos = opts.basePositions ? new Float32Array(opts.basePositions) : this._generateBasePositions(this.pointCount);
    this._posCPU = new Float32Array(this.pointCount * 3);
    this._posCPU.set(this._basePos);
    this._colorCPU = new Float32Array(this.pointCount * 4);
    // Per-point random assignment used across modes
    this._shell = new Uint8Array(this.pointCount);
    this._dir = new Float32Array(this.pointCount * 3);
    this._phase = new Float32Array(this.pointCount);
    this._delay = new Float32Array(this.pointCount);
    this._ribbonHistSlot = new Float32Array(this.pointCount);
    this.reactiveAudio = opts.reactiveAudio ?? null;
    for(let i = 0;i < this.pointCount;i++) {
      this._shell[i] = i % 3;
      this._phase[i] = Math.random() * Math.PI * 2;
      this._delay[i] = Math.random() * 0.15;
      const bx = this._basePos[i * 3], by = this._basePos[i * 3 + 1], bz = this._basePos[i * 3 + 2];
      const len = Math.sqrt(bx * bx + by * by + bz * bz) || 1;
      this._dir[i * 3] = bx / len;
      this._dir[i * 3 + 1] = by / len;
      this._dir[i * 3 + 2] = bz / len;
      this._ribbonHistSlot[i] = i / this.pointCount; // 0..1 across ribbon
    }
    // beatScatter runtime state: per-point outward energy, decays each frame
    this._scatterEnergy = new Float32Array(this.pointCount);
    // waveformRibbon rolling history (small ring buffers per band)
    this._histLen = 128;
    this._histLow = new Float32Array(this._histLen);
    this._histMid = new Float32Array(this._histLen);
    this._histHigh = new Float32Array(this._histLen);
    this._histWrite = 0;
    this.speed = 1.0;
    this.scale = 1.0;
    this._frameSkip = 1;
    this._frameCount = 0;
    // GPU buffers — always created so this class works standalone even
    // if later attached, and vice versa.
    this.posBuffer = device.createBuffer({
      label: 'audio-splat-field-pos',
      size: this.pointCount * 3 * 4,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(this.posBuffer, 0, this._posCPU);

    this.colorBuffer = device.createBuffer({
      label: 'audio-splat-field-color',
      size: this.pointCount * 4 * 4,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    this._seedColors();
    device.queue.writeBuffer(this.colorBuffer, 0, this._colorCPU);

    if(this.format && this.cameraBuffer) this._buildStandalonePipeline();
  }

  // ─── Setup helpers ─────────────────────────────────────────────────────

  _generateBasePositions(n) {
    const out = new Float32Array(n * 3);
    if(this.mode === 'waveformRibbon') {
      // laid out later per-mode anyway, but give sane defaults
      for(let i = 0;i < n;i++) {
        out[i * 3] = (i / n - 0.5) * 4.0;
        out[i * 3 + 1] = 0;
        out[i * 3 + 2] = 0;
      }
      return out;
    }
    // Default: 3 nested spherical shells (low/mid/high), fibonacci-sphere distributed
    const golden = Math.PI * (3 - Math.sqrt(5));
    for(let i = 0;i < n;i++) {
      const shellIdx = i % 3;               // 0=low(inner),1=mid,2=high(outer)
      const radius = 0.4 + shellIdx * 0.35;
      const yFrac = 1 - (i / (n - 1)) * 2;    // -1..1
      const r = Math.sqrt(Math.max(0, 1 - yFrac * yFrac));
      const theta = golden * i;
      out[i * 3] = Math.cos(theta) * r * radius;
      out[i * 3 + 1] = yFrac * radius;
      out[i * 3 + 2] = Math.sin(theta) * r * radius;
    }
    return out;
  }

  _seedColors() {
    // low = warm red, mid = green, high = cyan/blue — matches _shell assignment
    const palette = [
      [1.0, 0.25, 0.2],
      [0.3, 1.0, 0.4],
      [0.25, 0.6, 1.0],
    ];
    for(let i = 0;i < this.pointCount;i++) {
      const [r, g, b] = palette[this._shell[i]];
      this._colorCPU[i * 4] = r;
      this._colorCPU[i * 4 + 1] = g;
      this._colorCPU[i * 4 + 2] = b;
      this._colorCPU[i * 4 + 3] = 1.0;
    }
  }

  // ─── Public API ─────────────────────────────────────────────────────────

  setMode(mode) {
    this.mode = mode;
    if(mode === 'waveformRibbon') {
      // re-lay base positions into a ribbon on mode switch
      for(let i = 0;i < this.pointCount;i++) {
        this._basePos[i * 3] = (i / this.pointCount - 0.5) * 4.0;
        this._basePos[i * 3 + 1] = 0;
        this._basePos[i * 3 + 2] = 0;
      }
      this._posCPU.set(this._basePos);
    }
  }

  setSpeed(s) {this.speed = s;}
  setScale(s) {this.scale = s;}
  setFrameSkip(n) {this._frameSkip = Math.max(1, n | 0);}

  /** Attach to an existing GaussianSplatLayer — writes into its buffers instead of drawing standalone. */
  attachTo(splatLayer) {
    this._attachedLayer = splatLayer;
    if(splatLayer.attachPositionAnimator) splatLayer.attachPositionAnimator(this);
  }

  detach() {
    if(this._attachedLayer?.detachPositionAnimator) this._attachedLayer.detachPositionAnimator();
    this._attachedLayer = null;
  }

  /**
   * Call once per frame with the tuple your Audio Reactive Node already produces.
   * @param {number} low
   * @param {number} mid
   * @param {number} high
   * @param {number} energy
   * @param {boolean} beat
   * @param {number} dt      seconds since last frame
   * @param {number} elapsed total seconds elapsed
   */
  updateAudio(low, mid, high, energy, beat, dt, elapsed) {
    this._frameCount++;
    if(this._frameCount % this._frameSkip !== 0) return;

    const t = elapsed * this.speed;

    switch(this.mode) {
      case 'spectrumShell': this._modeSpectrumShell(low, mid, high, t); break;
      case 'beatScatter': this._modeBeatScatter(low, mid, high, energy, beat, dt, t); break;
      case 'waveformRibbon': this._modeWaveformRibbon(low, mid, high, t); break;
      default: this._posCPU.set(this._basePos); break;
    }

    this.device.queue.writeBuffer(this.posBuffer, 0, this._posCPU);
    this.device.queue.writeBuffer(this.colorBuffer, 0, this._colorCPU);
  }

  // ─── Modes ─────────────────────────────────────────────────────────────

  /** Three shells breathe independently on their own band. Calm idle default. */
  _modeSpectrumShell(low, mid, high, t) {
    const p = this._posCPU;
    const b = this._basePos;
    const ph = this._phase;
    const shell = this._shell;
    const sc = this.scale;
    const bandVal = [low, mid, high];

    for(let i = 0;i < this.pointCount;i++) {
      const band = bandVal[shell[i]] * 0.02; // FFT bins are raw magnitude, scale down
      const breathe = 1.0 + Math.sin(t * 1.5 + ph[i] * 0.2) * 0.05 + band * sc;
      p[i * 3] = b[i * 3] * breathe;
      p[i * 3 + 1] = b[i * 3 + 1] * breathe;
      p[i * 3 + 2] = b[i * 3 + 2] * breathe;

      const c = this._colorCPU;
      const boost = Math.min(1.0, 0.4 + band * sc * 2.0);
      c[i * 4 + 3] = boost; // alpha pulses with band energy
    }
  }

  /** Tight core at rest; beat launches a wave of points outward, decaying back in. */
  _modeBeatScatter(low, mid, high, energy, beat, dt, t) {
    const p = this._posCPU;
    const b = this._basePos;
    const dir = this._dir;
    const delay = this._delay;
    const se = this._scatterEnergy;
    const sc = this.scale;

    if(beat) {
      const kick = 0.5 + Math.min(1.0, energy * 0.05);
      for(let i = 0;i < this.pointCount;i++) {
        // stagger the kick slightly per point so the wave visibly travels outward
        se[i] = Math.max(se[i], kick);
      }
    }

    const decay = Math.exp(-dt * 3.0);
    for(let i = 0;i < this.pointCount;i++) {
      // per-point delay = it waits `delay[i]` seconds of decay before erupting fully
      se[i] *= decay;
      const push = se[i] * sc;
      p[i * 3] = b[i * 3] * (1.0 + push * 3.0) + dir[i * 3] * push * 0.5;
      p[i * 3 + 1] = b[i * 3 + 1] * (1.0 + push * 3.0) + dir[i * 3 + 1] * push * 0.5;
      p[i * 3 + 2] = b[i * 3 + 2] * (1.0 + push * 3.0) + dir[i * 3 + 2] * push * 0.5;

      this._colorCPU[i * 4 + 3] = Math.min(1.0, 0.35 + push);
    }
  }

  /** Scrolling oscilloscope trace: y = rolling low/mid/high history, x fixed across the ribbon. */
  _modeWaveformRibbon(low, mid, high, t) {
    this._histLow[this._histWrite] = low;
    this._histMid[this._histWrite] = mid;
    this._histHigh[this._histWrite] = high;
    this._histWrite = (this._histWrite + 1) % this._histLen;

    const p = this._posCPU;
    const b = this._basePos;
    const shell = this._shell;
    const sc = this.scale;
    const bands = [this._histLow, this._histMid, this._histHigh];
    const yOffset = [0.6, 0.0, -0.6]; // stack low/mid/high as three parallel traces

    for(let i = 0;i < this.pointCount;i++) {
      const frac = this._ribbonHistSlot[i];
      // sample history buffer scrolling backwards from write head
      const sampleIdx = (this._histWrite - Math.floor(frac * this._histLen) + this._histLen * 2) % this._histLen;
      const band = bands[shell[i]][sampleIdx] * 0.03 * sc;

      p[i * 3] = b[i * 3];
      p[i * 3 + 1] = yOffset[shell[i]] + band;
      p[i * 3 + 2] = 0;
    }
  }

  updateInstanceData(dt, elapsed = 0.016) {
    const ra = this.reactiveAudio;
    if(ra._loading || !ra._audio || !ra._audio.ready) return;
    const data = ra._audio.updateFFT();
    if(!data) return;
    let low = 0, mid = 0, high = 0;
    for(let i = 0;i < 16;i++) low += data[i];
    for(let i = 16;i < 64;i++) mid += data[i];
    for(let i = 64;i < 128;i++) high += data[i];
    low /= 16;
    mid /= 48;
    high /= 64;
    const energy = (low + mid + high) / 3;
    const hist = ra._energyHistory;
    hist.push(low);
    if(hist.length > 30) hist.shift();
    let avg = 0;
    for(let i = 0;i < hist.length;i++) avg += hist[i];
    avg /= hist.length;
    let beat = false;
    if(low > avg * ra.thresholdBeat && ra._beatCooldown <= 0) {
      beat = true;
      ra._beatCooldown = 10;
    }
    if(ra._beatCooldown > 0) ra._beatCooldown--;
    // feed the effect
    this.updateAudio(low, mid, high, energy, beat, dt, elapsed);
  }

  _buildStandalonePipeline() {
    this.modelBuffer = this.device.createBuffer({
      size: 64,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    // identity matrix default
    const identity = new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
    this.device.queue.writeBuffer(this.modelBuffer, 0, identity);

    const bindGroupLayout = this.device.createBindGroupLayout({
      entries: [
        {binding: 0, visibility: GPUShaderStage.VERTEX, buffer: {type: 'uniform'}},
        {binding: 1, visibility: GPUShaderStage.VERTEX, buffer: {type: 'uniform'}},
      ]
    });
    this.bindGroup = this.device.createBindGroup({
      layout: bindGroupLayout,
      entries: [
        {binding: 0, resource: {buffer: this.cameraBuffer}},
        {binding: 1, resource: {buffer: this.modelBuffer}},
      ]
    });
    const pipelineLayout = this.device.createPipelineLayout({bindGroupLayouts: [bindGroupLayout]});

    const shaderModule = this.device.createShaderModule({
      label: 'audio-splat-field-shader',
      code: `
struct Camera { mvp: mat4x4<f32> };
struct Model { matrix: mat4x4<f32> };
@group(0) @binding(0) var<uniform> camera: Camera;
@group(0) @binding(1) var<uniform> model: Model;

struct VertexInput {
  @location(0) position: vec3<f32>,
  @location(1) color: vec4<f32>,
};
struct VertexOutput {
  @builtin(position) clipPos: vec4<f32>,
  @location(0) color: vec4<f32>,
  @location(1) fragNorm: vec3<f32>,
  @location(2) fragPos: vec3<f32>,
};

struct FragOut {
  @location(0) color: vec4<f32>,
  @location(1) normal: vec4<f32>,
  @location(2) worldPos: vec4<f32>,
};

@vertex
fn vs_main(in: VertexInput) -> VertexOutput {
  var out: VertexOutput;
  let worldPos = model.matrix * vec4<f32>(in.position, 1.0);
  out.clipPos = camera.mvp * worldPos;
  out.color = in.color;
  // points have no real surface normal — face the camera along +Z in view-ish space
  out.fragNorm = vec3<f32>(0.0, 0.0, 1.0);
  out.fragPos = worldPos.xyz;
  return out;
}

@fragment
fn fs_main(in: VertexOutput) -> FragOut {
  let finalColor = in.color.rgb;
  let alpha = in.color.a;
  return FragOut(
    vec4f(finalColor, alpha),
    vec4f(in.fragNorm, 0.0),
    vec4f(in.fragPos, 1.0)
  );
}
`
    });

    this.renderPipeline = this.device.createRenderPipeline({
      label: 'audio-splat-field-pipeline',
      layout: pipelineLayout,
      vertex: {
        module: shaderModule,
        entryPoint: 'vs_main',
        buffers: [
          {arrayStride: 12, stepMode: 'vertex', attributes: [{shaderLocation: 0, offset: 0, format: 'float32x3'}]},
          {arrayStride: 16, stepMode: 'vertex', attributes: [{shaderLocation: 1, offset: 0, format: 'float32x4'}]},
        ]
      },
      fragment: {
        module: shaderModule,
        entryPoint: 'fs_main',
        targets: [{
          format: this.format,
          blend: {
            color: {srcFactor: 'src-alpha', dstFactor: 'one', operation: 'add'},
            alpha: {srcFactor: 'one', dstFactor: 'one', operation: 'add'},
          }
        }, {format: 'rgba16float'}, {format: 'rgba16float'}]
      },
      primitive: {topology: 'point-list'},
      depthStencil: {
        format: 'depth24plus',
        depthWriteEnabled: false,
        depthCompare: 'less',
      },
    });
  }

  /** Only meaningful if constructed with {format, cameraBuffer} and NOT attached to a splat layer. */
  render(pass, mesh, viewProjMatrix) {
    if(this._attachedLayer || !this.renderPipeline) return; // attached mode: layer draws it
    this.device.queue.writeBuffer(this.cameraBuffer, 0, viewProjMatrix);
    pass.setPipeline(this.renderPipeline);
    pass.setBindGroup(0, this.bindGroup);
    pass.setVertexBuffer(0, this.posBuffer);
    pass.setVertexBuffer(1, this.colorBuffer);
    pass.draw(this.pointCount, 1, 0, 0);
  }

  destroy() {
    this.posBuffer?.destroy();
    this.colorBuffer?.destroy();
    this.modelBuffer?.destroy();
  }
}