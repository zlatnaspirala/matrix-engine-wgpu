/**
 * MotionBlurPass for matrix-engine-wgpu
 * Camera motion blur: velocity is reconstructed from depth + previous view-projection,
 * then the HDR scene is gathered along the velocity vector (depth-weighted).
 * Skips all work (no pass, no copy) when the camera did not move.
 *
 * Blurs the result back into sceneTexture via copyTextureToTexture, so every downstream
 * consumer (SSR, volumetric, bloom, present) keeps its existing bind groups.
 * sceneTexture must have COPY_DST usage.
 *
 * setStrength   - shutter fraction (1.0 = full frame displacement)
 * setSamples    - gather taps (8-16)
 * setMaxBlur    - max blur length in UV units (0.03 = 3% of screen)
 * setDepthTol   - raw-depth tolerance for foreground-bleed rejection
 */
import {mat4} from "wgpu-matrix";
import {fullscreenQuadWGSL} from "./bloom.js";

export class MotionBlurPass {
  constructor(width, height, device, options = {}) {
    this.enabled = false;
    this.device = device;
    this.width = width;
    this.height = height;
    this.params = {
      strength: options.strength ?? 0.6,
      samples: options.samples ?? 12,
      maxBlur: options.maxBlur ?? 0.03,
      depthTol: options.depthTol ?? 0.0003,
    };

    this._u = new Float32Array(24); // mat4 reproj + 4 params + debug(4)
    this.debug = 0;       // 0 off, 1 velocity view, 2 split compare (left blurred / right original)
    this.ranFrames = 0;   // proof counter: increments only when the blur pass really executed
    this.uniformBuffer = device.createBuffer({
      label: 'MotionBlur uniforms',
      size: 96,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    this._reproj = mat4.create();
    this._prevVP = new Float32Array(16);
    this._hasPrev = false;

    this.sampler = device.createSampler({magFilter: 'linear', minFilter: 'linear', addressModeU: 'clamp-to-edge', addressModeV: 'clamp-to-edge'});
    this.tex = this._createTex();
    this.texView = this.tex.createView();

    this.pipeline = device.createRenderPipeline({
      label: 'MotionBlur pipeline',
      layout: 'auto',
      vertex: {module: device.createShaderModule({code: fullscreenQuadWGSL()}), entryPoint: 'vert'},
      fragment: {
        module: device.createShaderModule({code: motionBlurWGSL()}),
        entryPoint: 'main',
        targets: [{format: 'rgba16float'}]
      },
      primitive: {topology: 'triangle-list'}
    });

    this._passDesc = {
      label: 'MotionBlur pass',
      colorAttachments: [{view: this.texView, loadOp: 'clear', storeOp: 'store', clearValue: {r: 0, g: 0, b: 0, a: 1}}]
    };
    this._bg = null;
    this._lastScene = null;
    this._lastDepth = null;
  }

  _createTex() {
    return this.device.createTexture({
      label: 'MotionBlur out',
      size: [this.width, this.height],
      format: 'rgba16float',
      usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_SRC,
    });
  }

  setStrength = (v) => {this.params.strength = v;}
  setSamples = (v) => {this.params.samples = Math.max(2, Math.min(32, v | 0));}
  setMaxBlur = (v) => {this.params.maxBlur = v;}
  setDepthTol = (v) => {this.params.depthTol = v;}
  setDebug = (m) => {this.debug = m;}

  resize(width, height) {
    this.width = width;
    this.height = height;
    this.tex.destroy();
    this.tex = this._createTex();
    this.texView = this.tex.createView();
    this._passDesc.colorAttachments[0].view = this.texView;
    this._bg = null;
  }

  _same(a, b) {
    for(let i = 0;i < 16;i++) if(a[i] !== b[i]) return false;
    return true;
  }

  /**
   * @param {GPUCommandEncoder} encoder
   * @param {GPUTexture}     sceneTexture   needs COPY_DST
   * @param {GPUTextureView} sceneView
   * @param {GPUTextureView} depthView      mainDepthView
   * @param {Float32Array}   invViewProj    inverse of current VP
   * @param {Float32Array}   viewProj       current VP
   */
  render(encoder, sceneTexture, sceneView, depthView, invViewProj, viewProj) {
    if(!this._hasPrev) {
      this._prevVP.set(viewProj);
      this._hasPrev = true;
      return;
    }
    if(this._same(viewProj, this._prevVP)) return;

    // cur NDC -> prev clip in one matrix
    mat4.multiply(this._prevVP, invViewProj, this._reproj);
    const u = this._u;
    u.set(this._reproj, 0);
    u[16] = this.params.strength;
    u[17] = this.params.samples;
    u[18] = this.params.maxBlur;
    u[19] = this.params.depthTol;
    u[20] = this.debug;
    this.device.queue.writeBuffer(this.uniformBuffer, 0, u);

    if(!this._bg || this._lastScene !== sceneView || this._lastDepth !== depthView) {
      this._bg = this.device.createBindGroup({
        label: 'MotionBlur bindgroup',
        layout: this.pipeline.getBindGroupLayout(0),
        entries: [
          {binding: 0, resource: sceneView},
          {binding: 1, resource: depthView},
          {binding: 2, resource: this.sampler},
          {binding: 3, resource: {buffer: this.uniformBuffer}},
        ]
      });
      this._lastScene = sceneView;
      this._lastDepth = depthView;
    }

    const pass = encoder.beginRenderPass(this._passDesc);
    pass.setPipeline(this.pipeline);
    pass.setBindGroup(0, this._bg);
    pass.draw(6);
    pass.end();

    encoder.copyTextureToTexture({texture: this.tex}, {texture: sceneTexture}, [this.width, this.height]);
    this.ranFrames++;
    this._prevVP.set(viewProj);
  }
}

function motionBlurWGSL() {
  return /* wgsl */`
  struct MB {
    reproj: mat4x4<f32>,
    strength: f32,
    samples: f32,
    maxBlur: f32,
    depthTol: f32,
    debug: f32,
    _p0: f32,
    _p1: f32,
    _p2: f32,
  };

  @group(0) @binding(0) var sceneTex : texture_2d<f32>;
  @group(0) @binding(1) var depthTex : texture_depth_2d;
  @group(0) @binding(2) var samp     : sampler;
  @group(0) @binding(3) var<uniform> mb : MB;

  fn depthAt(uv: vec2<f32>, dims: vec2<f32>) -> f32 {
    let px = vec2<i32>(clamp(uv * dims, vec2<f32>(0.0), dims - vec2<f32>(1.0)));
    return textureLoad(depthTex, px, 0);
  }

  @fragment
  fn main(@builtin(position) p: vec4<f32>) -> @location(0) vec4<f32> {
    let dims = vec2<f32>(textureDimensions(sceneTex));
    let uv = p.xy / dims;
    let center = textureSampleLevel(sceneTex, samp, uv, 0.0);
    let d0 = depthAt(uv, dims);

    let ndc = vec4<f32>(uv.x * 2.0 - 1.0, (1.0 - uv.y) * 2.0 - 1.0, d0, 1.0);
    let pc = mb.reproj * ndc;
    let prevNdc = pc.xy / pc.w;

    // NDC delta -> UV delta (y flipped)
    let raw = (ndc.xy - prevNdc) * vec2<f32>(0.5, -0.5);
    if (mb.debug > 0.5 && mb.debug < 1.5) {
      // velocity view: red = horizontal, green = vertical (60 = ~1% of screen per frame -> full color)
      return vec4<f32>(center.rgb * 0.3 + vec3<f32>(abs(raw) * 60.0, 0.0), 1.0);
    }
    if (mb.debug > 1.5 && uv.x > 0.5) { return center; }   // right half untouched for comparison
    var v = raw * mb.strength;
    let len = length(v);
    if (len * max(dims.x, dims.y) < 0.75) { return center; }   // sub-pixel: skip
    if (len > mb.maxBlur) { v = v * (mb.maxBlur / len); }

    let n = i32(mb.samples);
    var acc = center.rgb;
    var wsum = 1.0;
    for (var i = 0; i < n; i++) {
      let t = (f32(i) + 0.5) / f32(n) - 0.5;
      let suv = uv + v * t;
      let sd = depthAt(suv, dims);
      // Reject taps that are nearer than the center pixel (foreground bleeding onto background)
      let w = select(0.0, 1.0, sd >= d0 - mb.depthTol);
      acc += textureSampleLevel(sceneTex, samp, suv, 0.0).rgb * w;
      wsum += w;
    }
    return vec4<f32>(acc / wsum, center.a);
  }
  `;
}