import {isMobile} from "../utils";
/**
 *
 * AdvancedVolumetricPass - volumetric lighting for mobile & desktop
 * Drop-in replacement for VolumetricPass (same render() signature).
 *
 * Features:
 *  - Adaptive ray march steps based on device capability
 *  - Half-resolution march for mobile (qualityScale), bilinear upsample in composite
 *  - Texture projection (cookie / gobo) for the volumetric light
 *  - Temporal accumulation (ping-pong history, no read/write hazards)
 *  - Early-exit ray marching with density threshold
 *
 * Frame loop:
 *   volPass.render(encoder, sceneView, depthView, shadowArrayView, camera, light)
 *   bloomPass.render(encoder, bloomOutputTex)   // bloom input = volPass.getOutputView()
 *
 * camera = { invViewProjectionMatrix: Float32Array(16) }
 * light  = { viewProjectionMatrix: Float32Array(16), direction: [x,y,z], position?: [x,y,z] }
 *   If light.position is missing, range attenuation is disabled.
 *
 * NOTE: resize()/setQualityScale() recreate compositeOutputTex. Anything that holds
 * getOutputView() (e.g. BloomPass._invalidateSceneBindGroups) must be refreshed after.
 * Shared uniform layout (16 floats = 64 bytes). Keep in sync with _updateParams().
 */

const PARAMS_WGSL = `
struct Params {
  density: f32,
  steps: f32,
  scatterStrength: f32,
  heightFalloff: f32,
  range: f32,
  temporalBlend: f32,
  useTemporalReprojection: f32,
  mobileOptimizations: f32,
  qualityScale: f32,
  useTextureProjection: f32,
  textureProjectionIntensity: f32,
  targetW: f32,
  targetH: f32,
  time: f32,
  projectionMode: f32,
  pad2: f32,
}
`;

export class AdvancedVolumetricPass {
  constructor(width, height, device, options = {}, sceneView) {
    this.enabled = false;
    this.device = device;
    this.width = width;
    this.height = height;
    this.qualityScale = Math.max(0.25, Math.min(1.0, options.qualityScale ?? (isMobile() ? 0.5 : 1.0)));
    this._computeEffectiveSize();
    this._time = 0;
    this._timeScratch = new Float32Array(1);

    this.linearSampler = device.createSampler({
      label: 'AdvancedVolumetricPass.linearSampler',
      magFilter: 'linear',
      minFilter: 'linear',
      addressModeU: 'clamp-to-edge',
      addressModeV: 'clamp-to-edge',
    });
    this.depthSampler = device.createSampler({
      label: 'AdvancedVolumetricPass.shadowCompareSampler',
      compare: 'less-equal',
      magFilter: 'linear',
      minFilter: 'linear',
    });
    this.projectionSampler = device.createSampler({
      label: 'AdvancedVolumetricPass.projectionSampler',
      magFilter: 'linear',
      minFilter: 'linear',
      addressModeU: 'clamp-to-edge',
      addressModeV: 'clamp-to-edge',
    });

    // ─ Parameters ─
    this.params = {
      density: options.density ?? 0.02,
      steps: isMobile() ? (options.steps ?? 16) : (options.steps ?? 32),
      scatterStrength: options.scatterStrength ?? 1.0,
      heightFalloff: options.heightFalloff ?? 0.08,
      range: options.range ?? 50,
      temporalBlend: options.temporalBlend ?? 0.8,
      useTemporalReprojection: options.useTemporalReprojection ?? true,
      mobileOptimizations: options.mobileOptimizations ?? isMobile(),
      useTextureProjection: options.useTextureProjection ?? false,
      textureProjectionIntensity: options.textureProjectionIntensity ?? 1.0,
    };
    this.params.projectionMode = options.projectionMode ?? 0;

    this.lightParams = {
      color: options.lightColor ?? [1.0, 0.85, 0.6],
      direction: [0.0, -1.0, 0.5],
    };

    this._paramScratch = new Float32Array(16);
    this._lightDir = new Float32Array(4);
    this._lightPos = new Float32Array(4);
    this._lightColor = new Float32Array(4);
    this._projectionMatrix = new Float32Array(16);
    this._passDesc = {
      label: '',
      colorAttachments: [{
        view: null,
        loadOp: 'clear',
        storeOp: 'store',
        clearValue: {r: 0, g: 0, b: 0, a: 0}
      }]
    };

    const ub = (label, size) => device.createBuffer({
      label: `AdvancedVolumetricPass.${label}`,
      size,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    this.paramsBuffer = ub('paramsBuffer', 64);
    this.invViewProjBuffer = ub('invViewProjBuffer', 64);
    this.lightViewProjBuffer = ub('lightViewProjBuffer', 64);
    this.projectionMatrixBuffer = ub('projectionMatrixBuffer', 64);
    this.lightDirBuffer = ub('lightDirBuffer', 16);
    this.lightColorBuffer = ub('lightColorBuffer', 16);
    this.lightPosBuffer = ub('lightPosBuffer', 16);
    this._projectionMatrix.set([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
    device.queue.writeBuffer(this.projectionMatrixBuffer, 0, this._projectionMatrix);
    // Dummy projection texture: the march layout always declares bindings 8-10.
    this._dummyProjTex = device.createTexture({
      label: 'AdvancedVolumetricPass.dummyProjTex',
      size: [1, 1],
      format: 'rgba8unorm',
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
    });
    device.queue.writeTexture(
      {texture: this._dummyProjTex},
      new Uint8Array([255, 255, 255, 255]),
      {bytesPerRow: 4},
      [1, 1]
    );
    this._dummyProjView = this._dummyProjTex.createView();
    this._projectionTexView = null;

    this._allocTextures();
    this.marchPipeline = this._createMarchPipeline();
    this.temporalPipeline = this._createTemporalPipeline();
    this.compositePipeline = this._createCompositePipeline();

    this._marchBG = null;
    this._depthView = null;
    this._shadowView = null;
    this._lastProjTexView = null;
    this._sceneView = null;

    this._updateParams();
    this._updateLightColor();
    this._buildBindGroups(sceneView);
  }

  _computeEffectiveSize() {
    this.effectiveWidth = Math.max(1, Math.ceil(this.width * this.qualityScale));
    this.effectiveHeight = Math.max(1, Math.ceil(this.height * this.qualityScale));
  }

  _createTexture(w, h, format = 'rgba16float') {
    return this.device.createTexture({
      label: `AdvancedVolumetricPass.texture[${w}x${h}]`,
      size: [w, h],
      format,
      usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
    });
  }

  _allocTextures() {
    this.volumetricTex = this._createTexture(this.effectiveWidth, this.effectiveHeight);
    this.volumetricTexView = this.volumetricTex.createView();
    // Temporal history, ping-pong (effective resolution)
    this._histTex = [
      this._createTexture(this.effectiveWidth, this.effectiveHeight),
      this._createTexture(this.effectiveWidth, this.effectiveHeight),
    ];
    this._histViews = this._histTex.map(t => t.createView());
    // index of the history that holds the most recent result
    this._hi = 0;
    // Composite output (full resolution)
    this.compositeOutputTex = this._createTexture(this.width, this.height);
    this.compositeOutputTexView = this.compositeOutputTex.createView();
  }

  _freeTextures() {
    this.volumetricTex?.destroy();
    this._histTex?.forEach(t => t.destroy());
    this.compositeOutputTex?.destroy();
  }

  /**
   * Temporal + composite bind groups. Rebuilt on construct, resize and when the scene view changes.
   *   temporal[i]  : current march + history[i]  (renders into history[1 - i])
   *   composite[i] : scene + history[i]
   *   composite[2] : scene + raw march (temporal disabled)
   */
  _buildBindGroups(sceneView) {
    this._sceneView = sceneView;
    const mk = (layout, a, b) => this.device.createBindGroup({
      layout,
      entries: [
        {binding: 0, resource: a},
        {binding: 1, resource: b},
        {binding: 2, resource: this.linearSampler},
        {binding: 3, resource: {buffer: this.paramsBuffer}},
      ]
    });
    const tl = this.temporalPipeline.getBindGroupLayout(0);
    const cl = this.compositePipeline.getBindGroupLayout(0);
    this._temporalBGs = [0, 1].map(i => mk(tl, this.volumetricTexView, this._histViews[i]));
    this._compositeBGs = [
      mk(cl, sceneView, this._histViews[0]),
      mk(cl, sceneView, this._histViews[1]),
      mk(cl, sceneView, this.volumetricTexView),
    ];
  }

  init() {return this;}
  getOutputView() {return this.compositeOutputTexView;}
  setCompositeInput(sceneView) {this._buildBindGroups(sceneView);}

  setProjectionTexture(textureView, projectionMatrix) {
    this._projectionTexView = textureView;
    if(projectionMatrix) {
      this._projectionMatrix.set(projectionMatrix);
      this.device.queue.writeBuffer(this.projectionMatrixBuffer, 0, this._projectionMatrix);
    }
    this.params.useTextureProjection = true;
    this._updateParams();
    this._marchBG = null;
  }

  disableTextureProjection() {
    this._projectionTexView = null;
    this.params.useTextureProjection = false;
    this._updateParams();
    this._marchBG = null;
  }

  setTextureProjectionIntensity = (v) => {
    this.params.textureProjectionIntensity = Math.max(0, Math.min(2, v));
    this._updateParams();
  }

  setDensity = (v) => {this.params.density = v; this._updateParams();}
  setSteps = (v) => {this.params.steps = Math.max(v, 4); this._updateParams();}
  setScatterStrength = (v) => {this.params.scatterStrength = v; this._updateParams();}
  setHeightFalloff = (v) => {this.params.heightFalloff = v; this._updateParams();}
  setRange = (v) => {this.params.range = v; this._updateParams();}
  setTemporalBlend = (v) => {this.params.temporalBlend = Math.max(0, Math.min(1, v)); this._updateParams();}
  setTemporal = (on) => {this.params.useTemporalReprojection = !!on; this._updateParams();}

  setLightColor = (r, g, b) => {
    this.lightParams.color = [r, g, b];
    this._updateLightColor();
  }

  setLightDirection = (x, y, z) => {
    this.lightParams.direction = [x, y, z];
    this._lightDir[0] = x;
    this._lightDir[1] = y;
    this._lightDir[2] = z;
    this._lightDir[3] = 0.0;
    this.device.queue.writeBuffer(this.lightDirBuffer, 0, this._lightDir);
  }

  setQualityScale(scale) {
    this.qualityScale = Math.max(0.25, Math.min(1.0, scale));
    this.resize(this.width, this.height);
  }

  resize(width, height) {
    this.width = width;
    this.height = height;
    this._computeEffectiveSize();
    this._freeTextures();
    this._allocTextures();
    this._updateParams();
    this._buildBindGroups(this._sceneView);
    this._marchBG = null;
  }

  destroy() {
    this._freeTextures();
    this._dummyProjTex?.destroy();
    for(const b of [
      this.paramsBuffer, this.invViewProjBuffer, this.lightViewProjBuffer,
      this.projectionMatrixBuffer, this.lightDirBuffer, this.lightColorBuffer, this.lightPosBuffer
    ]) b?.destroy();
  }

  _updateParams() {
    const a = this._paramScratch;
    a[0] = this.params.density;
    a[1] = this.params.steps;
    a[2] = this.params.scatterStrength;
    a[3] = this.params.heightFalloff;
    a[4] = this.params.range;
    a[5] = this.params.temporalBlend;
    a[6] = this.params.useTemporalReprojection ? 1.0 : 0.0;
    a[7] = this.params.mobileOptimizations ? 1.0 : 0.0;
    a[8] = this.qualityScale;
    a[9] = this.params.useTextureProjection ? 1.0 : 0.0;
    a[10] = this.params.textureProjectionIntensity;
    a[11] = this.effectiveWidth;
    a[12] = this.effectiveHeight;
    a[13] = this._time;
    a[14] = this.params.projectionMode;
    a[15] = 0.0;
    this.device.queue.writeBuffer(this.paramsBuffer, 0, a);
  }

  _updateLightColor() {
    const c = this.lightParams.color;
    this._lightColor[0] = c[0];
    this._lightColor[1] = c[1];
    this._lightColor[2] = c[2];
    this._lightColor[3] = 0.0;
    this.device.queue.writeBuffer(this.lightColorBuffer, 0, this._lightColor);
  }

  setMarchInputs(depthView, shadowArrayView) {
    if(!this._marchBG ||
      this._depthView !== depthView ||
      this._shadowView !== shadowArrayView ||
      this._lastProjTexView !== this._projectionTexView) {
      this._depthView = depthView;
      this._shadowView = shadowArrayView;
      this._lastProjTexView = this._projectionTexView;

      this._marchBG = this.device.createBindGroup({
        label: 'AdvancedVolumetricPass.marchBindGroup',
        layout: this.marchPipeline.getBindGroupLayout(0),
        entries: [
          {binding: 0, resource: depthView},
          {binding: 1, resource: shadowArrayView},
          {binding: 2, resource: this.depthSampler},
          {binding: 3, resource: {buffer: this.invViewProjBuffer}},
          {binding: 4, resource: {buffer: this.lightViewProjBuffer}},
          {binding: 5, resource: {buffer: this.lightDirBuffer}},
          {binding: 6, resource: {buffer: this.lightColorBuffer}},
          {binding: 7, resource: {buffer: this.paramsBuffer}},
          {binding: 8, resource: this._projectionTexView ?? this._dummyProjView},
          {binding: 9, resource: this.projectionSampler},
          {binding: 10, resource: {buffer: this.projectionMatrixBuffer}},
          {binding: 11, resource: {buffer: this.lightPosBuffer}},
        ]
      });
    }
  }

  setProjectionEffect = (mode) => {this.params.projectionMode = mode; this._updateParams();}

  _createFullscreenPipeline(label, bgl, fragCode) {
    return this.device.createRenderPipeline({
      label: `AdvancedVolumetricPass.${label}Pipeline`,
      layout: this.device.createPipelineLayout({
        label: `AdvancedVolumetricPass.${label}PipelineLayout`,
        bindGroupLayouts: [bgl]
      }),
      vertex: {
        module: this.device.createShaderModule({label: `AdvancedVolumetricPass.${label}Vert`, code: fullscreenVertWGSL()}),
        entryPoint: 'vert'
      },
      fragment: {
        module: this.device.createShaderModule({label: `AdvancedVolumetricPass.${label}Frag`, code: fragCode}),
        entryPoint: 'main',
        targets: [{format: 'rgba16float'}]
      },
      primitive: {topology: 'triangle-list'}
    });
  }

  _createMarchPipeline() {
    const F = GPUShaderStage.FRAGMENT;
    const bgl = this.device.createBindGroupLayout({
      label: 'AdvancedVolumetricPass.marchBGL',
      entries: [
        {binding: 0, visibility: F, texture: {sampleType: 'depth'}},
        {binding: 1, visibility: F, texture: {sampleType: 'depth', viewDimension: '2d-array'}},
        {binding: 2, visibility: F, sampler: {type: 'comparison'}},
        {binding: 3, visibility: F, buffer: {type: 'uniform'}},
        {binding: 4, visibility: F, buffer: {type: 'uniform'}},
        {binding: 5, visibility: F, buffer: {type: 'uniform'}},
        {binding: 6, visibility: F, buffer: {type: 'uniform'}},
        {binding: 7, visibility: F, buffer: {type: 'uniform'}},
        {binding: 8, visibility: F, texture: {sampleType: 'float'}},
        {binding: 9, visibility: F, sampler: {type: 'filtering'}},
        {binding: 10, visibility: F, buffer: {type: 'uniform'}},
        {binding: 11, visibility: F, buffer: {type: 'uniform'}},
      ]
    });
    return this._createFullscreenPipeline('march', bgl, advancedMarchFragWGSL());
  }

  _createTemporalPipeline() {
    const F = GPUShaderStage.FRAGMENT;
    const bgl = this.device.createBindGroupLayout({
      label: 'AdvancedVolumetricPass.temporalBGL',
      entries: [
        {binding: 0, visibility: F, texture: {sampleType: 'float'}},
        {binding: 1, visibility: F, texture: {sampleType: 'float'}},
        {binding: 2, visibility: F, sampler: {type: 'filtering'}},
        {binding: 3, visibility: F, buffer: {type: 'uniform'}},
      ]
    });
    return this._createFullscreenPipeline('temporal', bgl, temporalBlendFragWGSL());
  }

  _createCompositePipeline() {
    const F = GPUShaderStage.FRAGMENT;
    const bgl = this.device.createBindGroupLayout({
      label: 'AdvancedVolumetricPass.compositeBGL',
      entries: [
        {binding: 0, visibility: F, texture: {sampleType: 'float'}},
        {binding: 1, visibility: F, texture: {sampleType: 'float'}},
        {binding: 2, visibility: F, sampler: {type: 'filtering'}},
        {binding: 3, visibility: F, buffer: {type: 'uniform'}},
      ]
    });
    return this._createFullscreenPipeline('composite', bgl, advancedCompositeFragWGSL());
  }

  setProjectionMatrix(m) {
    this._projectionMatrix.set(m);
    this.device.queue.writeBuffer(this.projectionMatrixBuffer, 0, this._projectionMatrix);
  }

  _beginPass(encoder, targetView, label) {
    const d = this._passDesc;
    d.label = label;
    d.colorAttachments[0].view = targetView;
    return encoder.beginRenderPass(d);
  }

  render(encoder, sceneView, depthView, shadowArrayView, camera, light) {
    if(sceneView && sceneView !== this._sceneView) this._buildBindGroups(sceneView);
    const q = this.device.queue;
    q.writeBuffer(this.invViewProjBuffer, 0, camera.invViewProjectionMatrix);
    q.writeBuffer(this.lightViewProjBuffer, 0, light.viewProjectionMatrix);

    this._lightDir[0] = light.direction[0];
    this._lightDir[1] = light.direction[1];
    this._lightDir[2] = light.direction[2];
    this._lightDir[3] = 0.0;
    q.writeBuffer(this.lightDirBuffer, 0, this._lightDir);

    this._time = performance.now() * 0.001;
    this._timeScratch[0] = this._time;
    this.device.queue.writeBuffer(this.paramsBuffer, 13 * 4, this._timeScratch);

    const lp = light.position;
    if(lp) {
      this._lightPos[0] = lp[0];
      this._lightPos[1] = lp[1];
      this._lightPos[2] = lp[2];
      this._lightPos[3] = 1.0;
    } else {
      this._lightPos[3] = 0.0;
    }
    q.writeBuffer(this.lightPosBuffer, 0, this._lightPos);
    this.setMarchInputs(depthView, shadowArrayView);
    // Phase 1: ray march (effective resolution)
    {
      const pass = this._beginPass(encoder, this.volumetricTexView, 'volumetric-march');
      pass.setPipeline(this.marchPipeline);
      pass.setBindGroup(0, this._marchBG);
      pass.draw(6);
      pass.end();
    }
    // Phase 2: temporal accumulation. Read history[read], write history[write].
    let compositeBG = this._compositeBGs[2];
    if(this.params.useTemporalReprojection) {
      const read = this._hi;
      const write = 1 - read;
      const pass = this._beginPass(encoder, this._histViews[write], 'volumetric-temporal');
      pass.setPipeline(this.temporalPipeline);
      pass.setBindGroup(0, this._temporalBGs[read]);
      pass.draw(6);
      pass.end();
      compositeBG = this._compositeBGs[write];
      this._hi = write;
    }
    // Phase 3: composite + upsample (full resolution)
    {
      const pass = this._beginPass(encoder, this.compositeOutputTexView, 'volumetric-composite');
      pass.setPipeline(this.compositePipeline);
      pass.setBindGroup(0, compositeBG);
      pass.draw(6);
      pass.end();
    }
  }
}

export function fullscreenVertWGSL() {
  return `
    @vertex
    fn vert(@builtin(vertex_index) i: u32) -> @builtin(position) vec4<f32> {
      var pos = array<vec2<f32>, 6>(
        vec2(-1.0, -1.0), vec2(1.0, -1.0), vec2(-1.0,  1.0),
        vec2(-1.0,  1.0), vec2(1.0, -1.0), vec2(1.0,  1.0)
      );
      return vec4(pos[i], 0.0, 1.0);
    }
  `;
}

function advancedMarchFragWGSL() {
  return `
  ${PARAMS_WGSL}

  @group(0) @binding(0)  var depthTex:   texture_depth_2d;
  @group(0) @binding(1)  var shadowTex:  texture_depth_2d_array;
  @group(0) @binding(2)  var cmpSamp:    sampler_comparison;
  @group(0) @binding(3)  var<uniform> invViewProj:   mat4x4<f32>;
  @group(0) @binding(4)  var<uniform> lightViewProj: mat4x4<f32>;
  @group(0) @binding(5)  var<uniform> lightDir:      vec4<f32>;
  @group(0) @binding(6)  var<uniform> lightColor:    vec4<f32>;
  @group(0) @binding(7)  var<uniform> params:        Params;
  @group(0) @binding(8)  var projTex:                texture_2d<f32>;
  @group(0) @binding(9)  var projSamp:               sampler;
  @group(0) @binding(10) var<uniform> projMatrix:    mat4x4<f32>;
  @group(0) @binding(11) var<uniform> lightPos:      vec4<f32>; // w = 1 -> valid

  fn worldFromDepth(uv: vec2<f32>, depth: f32) -> vec3<f32> {
    let ndc = vec4(uv.x * 2.0 - 1.0, (1.0 - uv.y) * 2.0 - 1.0, depth, 1.0);
    let w = invViewProj * ndc;
    return w.xyz / w.w;
  }

  fn fogDensity(p: vec3<f32>) -> f32 {
    return params.density * exp(-max(p.y, 0.0) * params.heightFalloff);
  }

 fn rot2(a: f32) -> mat2x2<f32> {
  let c = cos(a); let s = sin(a);
  return mat2x2<f32>(c, s, -s, c);
}

fn sampleProjection(wp: vec3<f32>) -> vec3<f32> {
  if (params.useTextureProjection < 0.5) { return vec3(1.0); }
  let pp = projMatrix * vec4(wp, 1.0);
  let uv0 = (pp.xy / pp.w) * vec2(0.5, -0.5) + 0.5;
  let inside = step(vec2(0.0), uv0) * step(uv0, vec2(1.0));
  let fade = inside.x * inside.y * f32(pp.w > 0.0);   // mask uses the unmodified UV

  let t = params.time;
  let mode = i32(params.projectionMode);
  var uv = uv0;
  if (mode == 1) { uv = rot2(t * 0.5) * (uv0 - 0.5) + 0.5; }   // spinning gobo
  if (mode == 2) { uv = fract(uv0 + vec2(t * 0.05, 0.0)); }    // scrolling clouds

  var c = textureSampleLevel(projTex, projSamp, uv, 0.0).rgb;
  if (mode == 3) { c *= 0.75 + 0.25 * sin(t * 6.0); }          // pulse / flicker
  if (mode == 4) {                                              // chromatic split
    let o = vec2(0.01, 0.0);
    c = vec3(textureSampleLevel(projTex, projSamp, uv + o, 0.0).r, c.g,
             textureSampleLevel(projTex, projSamp, uv - o, 0.0).b);
  }
  // 1.0 outside the frustum = plain fog. Use vec3(0.0) there for a hard spotlight cutout.
  // return mix(vec3(1.0), c, fade * params.textureProjectionIntensity);
  let k = clamp(fade * params.textureProjectionIntensity, 0.0, 1.0);
  let boost = max(params.textureProjectionIntensity, 1.0);
  return mix(vec3(1.0), c * boost, k);
}

  // 1 = lit, 0 = shadowed or outside the light frustum.
  fn sampleShadow(wp: vec3<f32>) -> f32 {
    let ls = lightViewProj * vec4(wp, 1.0);
    let lp = ls.xyz / ls.w;
    let suv = lp.xy * 0.5 + 0.5;
    let inBounds = f32(
      suv.x >= 0.0 && suv.x <= 1.0 &&
      suv.y >= 0.0 && suv.y <= 1.0 &&
      lp.z >= 0.0 && lp.z <= 1.0
    );
    let s = textureSampleCompareLevel(shadowTex, cmpSamp, suv, 0, lp.z - 0.002);
    return s * inBounds;
  }

  @fragment
  fn main(@builtin(position) fc: vec4<f32>) -> @location(0) vec4<f32> {
    // The pass renders at effective (possibly half) resolution; depth is full resolution.
    let tgtSize = vec2<f32>(params.targetW, params.targetH);
    let depthSize = vec2<f32>(textureDimensions(depthTex));
    let uv = fc.xy / tgtSize;
    let px = vec2<i32>(clamp(uv * depthSize, vec2(0.0), depthSize - vec2(1.0)));
    let depth = textureLoad(depthTex, px, 0);

    let ro = worldFromDepth(uv, 0.0);
    let rt = worldFromDepth(uv, depth);
    let rlen = length(rt - ro);
    let rdir = normalize(rt - ro);

    let steps = max(i32(params.steps), 4);
    let stepLen = rlen / f32(steps);

    var accum = vec3<f32>(0.0);
    var trans = 1.0;
    let densityThreshold = select(0.00001, 0.0001, params.mobileOptimizations > 0.5);

    for (var i = 0; i < steps; i++) {
      let p = ro + rdir * ((f32(i) + 0.5) * stepLen);

      let d = fogDensity(p) * stepLen;
      if (d < densityThreshold) { continue; }

      let ext = exp(-d);
      let lit = sampleShadow(p);
      let proj = sampleProjection(p);

      // Range falloff from the light position (disabled when no position was supplied).
      let distToLight = length(p - lightPos.xyz);
      let rangeAtten = select(1.0, clamp(1.0 - distToLight / params.range, 0.0, 1.0), lightPos.w > 0.5);

      let scatter = trans * (1.0 - ext) * lit * params.scatterStrength * rangeAtten * rangeAtten * proj;
      accum += scatter * lightColor.rgb;
      trans *= ext;

      if (trans < 0.01) { break; }
    }

    return vec4<f32>(accum, 1.0 - trans);
  }
  `;
}

function temporalBlendFragWGSL() {
  return `
  ${PARAMS_WGSL}

  @group(0) @binding(0) var currentTex: texture_2d<f32>;
  @group(0) @binding(1) var historyTex: texture_2d<f32>;
  @group(0) @binding(2) var samp: sampler;
  @group(0) @binding(3) var<uniform> params: Params;

  @fragment
  fn main(@builtin(position) fc: vec4<f32>) -> @location(0) vec4<f32> {
    let uv = fc.xy / vec2<f32>(textureDimensions(currentTex));
    let current = textureSample(currentTex, samp, uv);
    let history = textureSample(historyTex, samp, uv);
    return max(mix(current, history, params.temporalBlend), vec4(0.0));
  }
  `;
}

function advancedCompositeFragWGSL() {
  return `
  ${PARAMS_WGSL}

  @group(0) @binding(0) var sceneTex: texture_2d<f32>;
  @group(0) @binding(1) var volTex: texture_2d<f32>;
  @group(0) @binding(2) var samp: sampler;
  @group(0) @binding(3) var<uniform> params: Params;

  @fragment
  fn main(@builtin(position) fc: vec4<f32>) -> @location(0) vec4<f32> {
    // UVs are normalized, so the linear sampler upsamples the half-res volume for free.
    let uv = fc.xy / vec2<f32>(textureDimensions(sceneTex));
    let scene = textureSample(sceneTex, samp, uv);
    let vol = textureSample(volTex, samp, uv);
    // vol.rgb = scattered light | vol.a = fog opacity
    return vec4<f32>(scene.rgb * (1.0 - vol.a) + vol.rgb, scene.a);
  }
  `;
}