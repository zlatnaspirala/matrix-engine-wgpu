import {fullscreenQuadWGSL} from "./bloom";

/**
 * FXAAPass for matrix-engine-wgpu
 * Replaces the present pass: SSR mix + Reinhard tonemap + FXAA in one fullscreen pass.
 * No extra textures, so no resize handling is needed.
 *
 * setEdgeThresholdMin / setEdgeThreshold / setSpanMax / setReduceMul / setReduceMin
 */
export class FXAAPass {
  constructor(device, targetFormat) {
    this.enabled = false;
    this.device = device;
    this.params = {
      edgeMin: 0.0312,    // skip very dark edges
      edgeRel: 0.125,     // relative contrast threshold (lower = more AA, softer)
      spanMax: 8.0,       // max search distance in texels
      reduceMul: 1 / 8,
      reduceMin: 1 / 128,
    };
    this._scratch = new Float32Array(8);
    this.paramBuffer = device.createBuffer({
      label: 'FXAA params',
      size: 32,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    this._updateParams();

    this.sampler = device.createSampler({magFilter: 'linear', minFilter: 'linear', addressModeU: 'clamp-to-edge', addressModeV: 'clamp-to-edge'});

    this.pipeline = device.createRenderPipeline({
      label: 'FXAA pipeline',
      layout: 'auto',
      vertex: {
        module: device.createShaderModule({code: fullscreenQuadWGSL()}),
        entryPoint: 'vert'
      },
      fragment: {
        module: device.createShaderModule({code: fxaaWGSL()}),
        entryPoint: 'main',
        targets: [{format: targetFormat}]
      },
      primitive: {topology: 'triangle-list'}
    });

    this._passDesc = {
      label: 'FXAA pass',
      colorAttachments: [{view: null, loadOp: 'clear', storeOp: 'store', clearValue: {r: 0, g: 0, b: 0, a: 1}}]
    };
    this._bg = null;
    this._lastHdr = null;
    this._lastSSR = null;
  }

  _updateParams() {
    const p = this.params, s = this._scratch;
    s[0] = p.edgeMin; s[1] = p.edgeRel; s[2] = p.spanMax; s[3] = p.reduceMul; s[4] = p.reduceMin;
    this.device.queue.writeBuffer(this.paramBuffer, 0, s);
  }

  setEdgeThresholdMin = (v) => {this.params.edgeMin = v; this._updateParams();}
  setEdgeThreshold = (v) => {this.params.edgeRel = v; this._updateParams();}
  setSpanMax = (v) => {this.params.spanMax = v; this._updateParams();}
  setReduceMul = (v) => {this.params.reduceMul = v; this._updateParams();}
  setReduceMin = (v) => {this.params.reduceMin = v; this._updateParams();}

  /**
   * @param {GPUCommandEncoder} encoder
   * @param {GPUTextureView} hdrView    bloomOutput view if bloom enabled, else sceneTextureView
   * @param {GPUTextureView} ssrView    ssrOutputView or the dummy 1x1 view
   * @param {GPUTextureView} targetView canvas view
   */
  render(encoder, hdrView, ssrView, targetView) {
    if(this._lastHdr !== hdrView || this._lastSSR !== ssrView || !this._bg) {
      this._bg = this.device.createBindGroup({
        label: 'FXAA bindgroup',
        layout: this.pipeline.getBindGroupLayout(0),
        entries: [
          {binding: 0, resource: hdrView},
          {binding: 1, resource: this.sampler},
          {binding: 2, resource: ssrView},
          {binding: 3, resource: {buffer: this.paramBuffer}},
        ]
      });
      this._lastHdr = hdrView;
      this._lastSSR = ssrView;
    }
    this._passDesc.colorAttachments[0].view = targetView;
    const pass = encoder.beginRenderPass(this._passDesc);
    pass.setPipeline(this.pipeline);
    pass.setBindGroup(0, this._bg);
    pass.draw(6);
    pass.end();
  }
}

function fxaaWGSL() {
  return `
  struct FXAAParams {
    edgeMin: f32,
    edgeRel: f32,
    spanMax: f32,
    reduceMul: f32,
    reduceMin: f32,
    _a: f32, _b: f32, _c: f32,
  };

  @group(0) @binding(0) var hdrTex : texture_2d<f32>;
  @group(0) @binding(1) var samp   : sampler;
  @group(0) @binding(2) var ssrTex : texture_2d<f32>;
  @group(0) @binding(3) var<uniform> fx : FXAAParams;

  // Same composite + tonemap as the present pass. textureSampleLevel is used
  // everywhere because FXAA branches non-uniformly (textureSample would be invalid).
  fn fetch(uv: vec2<f32>) -> vec3<f32> {
    let hdr = textureSampleLevel(hdrTex, samp, uv, 0.0).rgb;
    let ssr = textureSampleLevel(ssrTex, samp, uv, 0.0);
    let c = mix(hdr, ssr.rgb, ssr.a);
    return c / (c + vec3<f32>(1.0));
  }

  fn luma(c: vec3<f32>) -> f32 {
    return dot(c, vec3<f32>(0.299, 0.587, 0.114));
  }

  @fragment
  fn main(@builtin(position) p: vec4<f32>) -> @location(0) vec4<f32> {
    let texel = 1.0 / vec2<f32>(textureDimensions(hdrTex));
    let uv = p.xy * texel;

    let rgbM  = fetch(uv);
    let rgbNW = fetch(uv + vec2<f32>(-1.0, -1.0) * texel);
    let rgbNE = fetch(uv + vec2<f32>( 1.0, -1.0) * texel);
    let rgbSW = fetch(uv + vec2<f32>(-1.0,  1.0) * texel);
    let rgbSE = fetch(uv + vec2<f32>( 1.0,  1.0) * texel);

    let lM  = luma(rgbM);
    let lNW = luma(rgbNW);
    let lNE = luma(rgbNE);
    let lSW = luma(rgbSW);
    let lSE = luma(rgbSE);

    let lMin = min(lM, min(min(lNW, lNE), min(lSW, lSE)));
    let lMax = max(lM, max(max(lNW, lNE), max(lSW, lSE)));

    // Not an edge: leave pixel untouched
    if (lMax - lMin < max(fx.edgeMin, lMax * fx.edgeRel)) {
      return vec4<f32>(rgbM, 1.0);
    }

    var dir = vec2<f32>(
      -((lNW + lNE) - (lSW + lSE)),
       ((lNW + lSW) - (lNE + lSE))
    );
    let dirReduce = max((lNW + lNE + lSW + lSE) * 0.25 * fx.reduceMul, fx.reduceMin);
    let rcpDirMin = 1.0 / (min(abs(dir.x), abs(dir.y)) + dirReduce);
    dir = clamp(dir * rcpDirMin, vec2<f32>(-fx.spanMax), vec2<f32>(fx.spanMax)) * texel;

    let rgbA = 0.5 * (
      fetch(uv + dir * (1.0 / 3.0 - 0.5)) +
      fetch(uv + dir * (2.0 / 3.0 - 0.5))
    );
    let rgbB = rgbA * 0.5 + 0.25 * (
      fetch(uv + dir * -0.5) +
      fetch(uv + dir *  0.5)
    );
    let lB = luma(rgbB);
    let outRgb = select(rgbB, rgbA, lB < lMin || lB > lMax);
    return vec4<f32>(outRgb, 1.0);
  }
  `;
}