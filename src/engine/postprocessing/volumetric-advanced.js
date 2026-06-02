/**
 * @description
 * AdvancedVolumetricPass - High-performance volumetric lighting for mobile & desktop
 * Mobile-first optimization: Adaptive quality, texture projection, compute-friendly shader
 *
 * Features:
 *  - Adaptive ray march steps based on device capability
 *  - Half-resolution rendering option for mobile
 *  - Texture projection mapping for volumetric light effects
 *  - Temporal reprojection for frame coherence
 *  - Optimized shadow sampling with comparison samplers
 *  - Early-exit ray marching with density thresholding
 *
 * Usage:
 *   const volPass = new AdvancedVolumetricPass(width, height, device, options);
 *   volPass.setProjectionTexture(textureView, projectionMatrix);
 *   volPass.render(encoder, sceneView, depthView, shadowView, camera, light);
 *   bloomPass.render(encoder, volPass.getOutputView());
 */

export class AdvancedVolumetricPass {
  constructor(width, height, device, options = {}, sceneView) {
    this.enabled = false;
    this.device = device;
    this.width = width;
    this.height = height;
    
    // ─ Detect device capability ─
    this.isMobile = this._detectMobileDevice();
    this.qualityScale = options.qualityScale ?? (this.isMobile ? 0.5 : 1.0);
    this.effectiveWidth = Math.ceil(width * this.qualityScale);
    this.effectiveHeight = Math.ceil(height * this.qualityScale);

    // ─ Allocate textures ─
    this.volumetricTex = this._createTexture(this.effectiveWidth, this.effectiveHeight, 'rgba16float');
    this.volumetricTexView = this.volumetricTex.createView();
    
    // Temporal history for coherence
    this.historyTex = this._createTexture(this.effectiveWidth, this.effectiveHeight, 'rgba16float');
    this.historyTexView = this.historyTex.createView();
    
    // Upsampled output for composition
    this.compositeOutputTex = this._createTexture(width, height, 'rgba16float');
    this.compositeOutputTexView = this.compositeOutputTex.createView();

    // ─ Samplers ─
    this.linearSampler = device.createSampler({
      label: 'AdvancedVolumetricPass.linearSampler',
      magFilter: 'linear',
      minFilter: 'linear',
      addressModeU: 'clamp-to-edge',
      addressModeV: 'clamp-to-edge',
    });

    this.depthSampler = device.createSampler({
      label: 'AdvancedVolumetricPass.depthSampler',
      compare: 'less-equal',
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
      steps: this.isMobile ? (options.steps ?? 16) : (options.steps ?? 32),
      scatterStrength: options.scatterStrength ?? 1.0,
      heightFalloff: options.heightFalloff ?? 0.08,
      range: options.range ?? 50,
      temporalBlend: options.temporalBlend ?? 0.8,
      useTemporalReprojection: options.useTemporalReprojection ?? true,
      mobileOptimizations: options.mobileOptimizations ?? this.isMobile,
      useTextureProjection: options.useTextureProjection ?? false,
      textureProjectionIntensity: options.textureProjectionIntensity ?? 1.0,
    };

    this.lightParams = {
      color: options.lightColor ?? [1.0, 0.85, 0.6],
      direction: [0.0, -1.0, 0.5],
    };

    // Texture projection
    this._projectionTexView = null;
    this._projectionMatrix = new Float32Array(16);

    // ─ Uniform buffers ─
    this.paramsBuffer = device.createBuffer({
      label: 'AdvancedVolumetricPass.paramsBuffer',
      size: 64,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    
    this.invViewProjBuffer = device.createBuffer({
      label: 'AdvancedVolumetricPass.invViewProjBuffer',
      size: 64,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    
    this.lightViewProjBuffer = device.createBuffer({
      label: 'AdvancedVolumetricPass.lightViewProjBuffer',
      size: 64,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    this.projectionMatrixBuffer = device.createBuffer({
      label: 'AdvancedVolumetricPass.projectionMatrixBuffer',
      size: 64,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    
    this.lightDirBuffer = device.createBuffer({
      label: 'AdvancedVolumetricPass.lightDirBuffer',
      size: 16,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    
    this.lightColorBuffer = device.createBuffer({
      label: 'AdvancedVolumetricPass.lightColorBuffer',
      size: 16,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    this._lightDir = new Float32Array(4);
    this._marchBG = null;
    this._compositeBG = null;
    this._temporalBG = null;
    
    this._updateParams();
    this._updateLightColor();
    
    this.marchPipeline = this._createMarchPipeline();
    this.temporalPipeline = this._createTemporalPipeline();
    this.compositePipeline = this._createCompositePipeline();
    
    this.setCompositeInput(sceneView);
  }

  _detectMobileDevice() {
    if (typeof navigator === 'undefined') return false;
    const ua = navigator.userAgent || '';
    return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(ua.toLowerCase());
  }

  _createTexture(w, h, format) {
    return this.device.createTexture({
      label: `AdvancedVolumetricPass.texture[${w}x${h}]`,
      size: [w, h],
      format: format,
      usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
    });
  }

  // Texture Projection API
  setProjectionTexture(textureView, projectionMatrix) {
    this._projectionTexView = textureView;
    if (projectionMatrix) {
      this._projectionMatrix.set(projectionMatrix);
      this.device.queue.writeBuffer(this.projectionMatrixBuffer, 0, this._projectionMatrix);
    }
    this.params.useTextureProjection = true;
    this._updateParams();
    this._marchBG = null; // Invalidate bind group
  }

  disableTextureProjection() {
    this.params.useTextureProjection = false;
    this._updateParams();
    this._marchBG = null;
  }

  setTextureProjectionIntensity(intensity) {
    this.params.textureProjectionIntensity = Math.max(0, Math.min(2, intensity));
    this._updateParams();
  }

  setDensity = (v) => { this.params.density = v; this._updateParams(); }
  setSteps = (v) => { this.params.steps = Math.max(v, 8); this._updateParams(); }
  setScatterStrength = (v) => { this.params.scatterStrength = v; this._updateParams(); }
  setHeightFalloff = (v) => { this.params.heightFalloff = v; this._updateParams(); }
  setRange = (v) => { this.params.range = v; this._updateParams(); }
  setTemporalBlend = (v) => { this.params.temporalBlend = Math.max(0, Math.min(1, v)); this._updateParams(); }
  
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

  _updateParams() {
    this.device.queue.writeBuffer(this.paramsBuffer, 0, new Float32Array([
      this.params.density,
      this.params.steps,
      this.params.scatterStrength,
      this.params.heightFalloff,
      this.params.range,
      this.params.temporalBlend,
      this.params.useTemporalReprojection ? 1.0 : 0.0,
      this.params.mobileOptimizations ? 1.0 : 0.0,
      this.qualityScale,
      this.params.useTextureProjection ? 1.0 : 0.0,
      this.params.textureProjectionIntensity,
      0.0,
      0.0, 0.0, 0.0, 0.0,
    ]));
  }

  _updateLightColor() {
    this.device.queue.writeBuffer(this.lightColorBuffer, 0,
      new Float32Array([...this.lightParams.color, 0.0]));
  }

  setCompositeInput(sceneView) {
    this._compositeBG = this.device.createBindGroup({
      layout: this.compositePipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: sceneView },
        { binding: 1, resource: this.compositeOutputTexView },
        { binding: 2, resource: this.linearSampler },
        { binding: 3, resource: { buffer: this.paramsBuffer } },
      ]
    });
  }

  setMarchInputs(depthView, shadowArrayView) {
    if (
      this._depthView !== depthView ||
      this._shadowView !== shadowArrayView ||
      this._lastProjTexView !== this._projectionTexView ||
      !this._marchBG
    ) {
      this._depthView = depthView;
      this._shadowView = shadowArrayView;
      this._lastProjTexView = this._projectionTexView;

      const entries = [
        { binding: 0, resource: depthView },
        { binding: 1, resource: shadowArrayView },
        { binding: 2, resource: this.device.createSampler({ compare: 'less-equal' }) },
        { binding: 3, resource: { buffer: this.invViewProjBuffer } },
        { binding: 4, resource: { buffer: this.lightViewProjBuffer } },
        { binding: 5, resource: { buffer: this.lightDirBuffer } },
        { binding: 6, resource: { buffer: this.lightColorBuffer } },
        { binding: 7, resource: { buffer: this.paramsBuffer } },
      ];

      // Add projection texture if available
      if (this._projectionTexView) {
        entries.push(
          { binding: 8, resource: this._projectionTexView },
          { binding: 9, resource: this.projectionSampler },
          { binding: 10, resource: { buffer: this.projectionMatrixBuffer } }
        );
      }

      this._marchBG = this.device.createBindGroup({
        layout: this.marchPipeline.getBindGroupLayout(0),
        entries: entries
      });
    }

    if (!this._temporalBG) {
      this._temporalBG = this.device.createBindGroup({
        layout: this.temporalPipeline.getBindGroupLayout(0),
        entries: [
          { binding: 0, resource: this.volumetricTexView },
          { binding: 1, resource: this.historyTexView },
          { binding: 2, resource: this.linearSampler },
          { binding: 3, resource: { buffer: this.paramsBuffer } },
        ]
      });
    }
  }

  _beginPass(encoder, targetView, label) {
    return encoder.beginRenderPass({
      label,
      colorAttachments: [{
        view: targetView,
        loadOp: 'clear',
        storeOp: 'store',
        clearValue: { r: 0, g: 0, b: 0, a: 0 }
      }]
    });
  }

  _createMarchPipeline() {
    const entries = [
      { binding: 0, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: 'depth' } },
      { binding: 1, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: 'depth', viewDimension: '2d-array' } },
      { binding: 2, visibility: GPUShaderStage.FRAGMENT, sampler: { type: 'comparison' } },
      { binding: 3, visibility: GPUShaderStage.FRAGMENT, buffer: { type: 'uniform' } },
      { binding: 4, visibility: GPUShaderStage.FRAGMENT, buffer: { type: 'uniform' } },
      { binding: 5, visibility: GPUShaderStage.FRAGMENT, buffer: { type: 'uniform' } },
      { binding: 6, visibility: GPUShaderStage.FRAGMENT, buffer: { type: 'uniform' } },
      { binding: 7, visibility: GPUShaderStage.FRAGMENT, buffer: { type: 'uniform' } },
      { binding: 8, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: 'float' } },
      { binding: 9, visibility: GPUShaderStage.FRAGMENT, sampler: { type: 'filtering' } },
      { binding: 10, visibility: GPUShaderStage.FRAGMENT, buffer: { type: 'uniform' } },
    ];

    const bgl = this.device.createBindGroupLayout({
      label: 'AdvancedVolumetricPass.marchBGL',
      entries: entries
    });

    return this.device.createRenderPipeline({
      label: 'AdvancedVolumetricPass.marchPipeline',
      layout: this.device.createPipelineLayout({
        label: 'AdvancedVolumetricPass.marchPipelineLayout',
        bindGroupLayouts: [bgl]
      }),
      vertex: {
        module: this.device.createShaderModule({
          label: 'AdvancedVolumetricPass.marchVert',
          code: fullscreenVertWGSL()
        }),
        entryPoint: 'vert'
      },
      fragment: {
        module: this.device.createShaderModule({
          label: 'AdvancedVolumetricPass.marchFrag',
          code: advancedMarchFragWGSL()
        }),
        entryPoint: 'main',
        targets: [{ format: 'rgba16float' }]
      },
      primitive: { topology: 'triangle-list' }
    });
  }

  _createTemporalPipeline() {
    const bgl = this.device.createBindGroupLayout({
      label: 'AdvancedVolumetricPass.temporalBGL',
      entries: [
        { binding: 0, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: 'float' } },
        { binding: 1, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: 'float' } },
        { binding: 2, visibility: GPUShaderStage.FRAGMENT, sampler: { type: 'filtering' } },
        { binding: 3, visibility: GPUShaderStage.FRAGMENT, buffer: { type: 'uniform' } },
      ]
    });

    return this.device.createRenderPipeline({
      label: 'AdvancedVolumetricPass.temporalPipeline',
      layout: this.device.createPipelineLayout({
        label: 'AdvancedVolumetricPass.temporalPipelineLayout',
        bindGroupLayouts: [bgl]
      }),
      vertex: {
        module: this.device.createShaderModule({
          label: 'AdvancedVolumetricPass.temporalVert',
          code: fullscreenVertWGSL()
        }),
        entryPoint: 'vert'
      },
      fragment: {
        module: this.device.createShaderModule({
          label: 'AdvancedVolumetricPass.temporalFrag',
          code: temporalBlendFragWGSL()
        }),
        entryPoint: 'main',
        targets: [{ format: 'rgba16float' }]
      },
      primitive: { topology: 'triangle-list' }
    });
  }

  _createCompositePipeline() {
    const bgl = this.device.createBindGroupLayout({
      label: 'AdvancedVolumetricPass.compositeBGL',
      entries: [
        { binding: 0, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: 'float' } },
        { binding: 1, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: 'float' } },
        { binding: 2, visibility: GPUShaderStage.FRAGMENT, sampler: { type: 'filtering' } },
        { binding: 3, visibility: GPUShaderStage.FRAGMENT, buffer: { type: 'uniform' } },
      ]
    });

    return this.device.createRenderPipeline({
      label: 'AdvancedVolumetricPass.compositePipeline',
      layout: this.device.createPipelineLayout({
        label: 'AdvancedVolumetricPass.compositePipelineLayout',
        bindGroupLayouts: [bgl]
      }),
      vertex: {
        module: this.device.createShaderModule({
          label: 'AdvancedVolumetricPass.compositeVert',
          code: fullscreenVertWGSL()
        }),
        entryPoint: 'vert'
      },
      fragment: {
        module: this.device.createShaderModule({
          label: 'AdvancedVolumetricPass.compositeFrag',
          code: advancedCompositeFragWGSL()
        }),
        entryPoint: 'main',
        targets: [{ format: 'rgba16float' }]
      },
      primitive: { topology: 'triangle-list' }
    });
  }

  render(encoder, sceneView, depthView, shadowArrayView, camera, light) {
    // Upload uniforms
    this.device.queue.writeBuffer(this.invViewProjBuffer, 0, camera.invViewProjectionMatrix);
    this.device.queue.writeBuffer(this.lightViewProjBuffer, 0, light.viewProjectionMatrix);
    this._lightDir[0] = light.direction[0];
    this._lightDir[1] = light.direction[1];
    this._lightDir[2] = light.direction[2];
    this._lightDir[3] = 0.0;
    this.device.queue.writeBuffer(this.lightDirBuffer, 0, this._lightDir);

    // Set march inputs
    this.setMarchInputs(depthView, shadowArrayView);

    // ─ Phase 1: Ray march volumetric scattering ─
    {
      const pass = this._beginPass(encoder, this.volumetricTexView, 'volumetric-march');
      pass.setPipeline(this.marchPipeline);
      pass.setBindGroup(0, this._marchBG);
      pass.draw(6);
      pass.end();
    }

    // ─ Phase 2: Temporal reprojection (optional) ─
    if (this.params.useTemporalReprojection) {
      const pass = this._beginPass(encoder, this.historyTexView, 'temporal-blend');
      pass.setPipeline(this.temporalPipeline);
      pass.setBindGroup(0, this._temporalBG);
      pass.draw(6);
      pass.end();

      // Swap history for next frame
      [this.volumetricTex, this.historyTex] = [this.historyTex, this.volumetricTex];
      this.volumetricTexView = this.volumetricTex.createView();
      this.historyTexView = this.historyTex.createView();
    }

    // ─ Phase 3: Composite with upsampling ─
    {
      const pass = this._beginPass(encoder, this.compositeOutputTexView, 'volumetric-composite');
      pass.setPipeline(this.compositePipeline);
      pass.setBindGroup(0, this._compositeBG);
      pass.draw(6);
      pass.end();
    }
  }

  init() {
    return this;
  }

  resize(width, height) {
    this.width = width;
    this.height = height;
    this.effectiveWidth = Math.ceil(width * this.qualityScale);
    this.effectiveHeight = Math.ceil(height * this.qualityScale);
    
    this.volumetricTex = this._createTexture(this.effectiveWidth, this.effectiveHeight, 'rgba16float');
    this.volumetricTexView = this.volumetricTex.createView();
    this.historyTex = this._createTexture(this.effectiveWidth, this.effectiveHeight, 'rgba16float');
    this.historyTexView = this.historyTex.createView();
    this.compositeOutputTex = this._createTexture(width, height, 'rgba16float');
    this.compositeOutputTexView = this.compositeOutputTex.createView();
  }

  getOutputView() {
    return this.compositeOutputTexView;
  }

  setQualityScale(scale) {
    this.qualityScale = Math.max(0.25, Math.min(1.0, scale));
    this._updateParams();
    this.resize(this.width, this.height);
  }
}

export function fullscreenVertWGSL() {
  return /* wgsl */`
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
  return /* wgsl */`
  @group(0) @binding(0) var depthTex:   texture_depth_2d;
  @group(0) @binding(1) var shadowTex:  texture_depth_2d_array;
  @group(0) @binding(2) var cmpSamp:    sampler_comparison;
  @group(0) @binding(3) var<uniform> invViewProj:   mat4x4<f32>;
  @group(0) @binding(4) var<uniform> lightViewProj: mat4x4<f32>;
  @group(0) @binding(5) var<uniform> lightDir:      vec4<f32>;
  @group(0) @binding(6) var<uniform> lightColor:    vec4<f32>;
  @group(0) @binding(7) var<uniform> params:        Params;
  @group(0) @binding(8) var projTex:                texture_2d<f32>;
  @group(0) @binding(9) var projSamp:               sampler;
  @group(0) @binding(10) var<uniform> projMatrix:   mat4x4<f32>;

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
    _pad: f32,
    _pad2: f32, _pad3: f32, _pad4: f32, _pad5: f32,
  }

  fn worldPos(uv: vec2<f32>, depth: f32) -> vec3<f32> {
    let ndc = vec4(uv.x * 2.0 - 1.0, (1.0 - uv.y) * 2.0 - 1.0, depth, 1.0);
    let world = invViewProj * ndc;
    return world.xyz / world.w;
  }

  fn fogDensity(p: vec3<f32>) -> f32 {
    let height = max(p.y, 0.0);
    return params.density * exp(-height * params.heightFalloff);
  }

  fn sampleProjectionTexture(worldPos: vec3<f32>) -> vec3<f32> {
    if (params.useTextureProjection < 0.5) { return vec3(1.0); }
    
    let projPos = projMatrix * vec4(worldPos, 1.0);
    let projUv = (projPos.xy / projPos.w) * 0.5 + 0.5;
    
    // Clamp to valid range with fade-out
    let bounds = step(0.0, projUv) * step(projUv, vec2(1.0));
    let fade = bounds.x * bounds.y;
    
    let projColor = textureSample(projTex, projSamp, projUv).rgb;
    return mix(vec3(1.0), projColor, fade * params.textureProjectionIntensity);
  }

  fn sampleShadow(worldPos: vec3<f32>) -> f32 {
    let ls = lightViewProj * vec4(worldPos, 1.0);
    let lp = ls.xyz / ls.w;
    let suv = lp.xy * 0.5 + 0.5;

    let inBounds = f32(suv.x >= 0.0 && suv.x <= 1.0 && suv.y >= 0.0 && suv.y <= 1.0);
    if (inBounds < 0.5) { return 0.0; }

    let shadow = textureSampleCompare(shadowTex, cmpSamp, suv, 0, lp.z - 0.002);
    return shadow * inBounds;
  }

  @fragment
  fn main(@builtin(position) fc: vec4<f32>) -> @location(0) vec4<f32> {
    let sz = vec2<f32>(textureDimensions(depthTex));
    let uv = fc.xy / sz;
    let depth = textureLoad(depthTex, vec2<i32>(fc.xy), 0);

    let ro = worldPos(uv, 0.0);
    let rt = worldPos(uv, depth);
    let rlen = length(rt - ro);
    let rdir = normalize(rt - ro);
    
    let steps = max(i32(params.steps), 4);
    let step = rlen / f32(steps);

    var accum = vec3<f32>(0.0);
    var trans = 1.0;

    let densityThreshold = select(0.00001, 0.0001, params.mobileOptimizations > 0.5);

    for (var i = 0; i < steps; i++) {
      let p = ro + rdir * ((f32(i) + 0.5) * step);

      let d = fogDensity(p) * step;
      if (d < densityThreshold) { continue; }

      let ext = exp(-d);
      let lit = sampleShadow(p);
      let projTex = sampleProjectionTexture(p);

      let distToLight = length(p);
      let rangeAtten = clamp(1.0 - (distToLight / params.range), 0.0, 1.0);
      let rangeAtten2 = rangeAtten * rangeAtten;

      let scatter = trans * (1.0 - ext) * lit * params.scatterStrength * rangeAtten2 * projTex;
      accum += scatter * lightColor.rgb;
      trans *= ext;

      if (trans < 0.01) { break; }
    }

    return vec4<f32>(accum, 1.0 - trans);
  }
  `;
}

function temporalBlendFragWGSL() {
  return /* wgsl */`
  @group(0) @binding(0) var currentTex: texture_2d<f32>;
  @group(0) @binding(1) var historyTex: texture_2d<f32>;
  @group(0) @binding(2) var samp: sampler;
  
  struct Params {
    density: f32, steps: f32, scatterStrength: f32, heightFalloff: f32,
    range: f32, temporalBlend: f32, useTemporalReprojection: f32, mobileOptimizations: f32,
    qualityScale: f32, useTextureProjection: f32, textureProjectionIntensity: f32,
    _pad: f32, _pad2: f32, _pad3: f32, _pad4: f32, _pad5: f32,
  }
  
  @group(0) @binding(3) var<uniform> params: Params;

  @fragment
  fn main(@builtin(position) fc: vec4<f32>) -> @location(0) vec4<f32> {
    let sz = vec2<f32>(textureDimensions(currentTex));
    let uv = fc.xy / sz;
    
    let current = textureSample(currentTex, samp, uv);
    let history = textureSample(historyTex, samp, uv);
    
    let blended = mix(current, history, params.temporalBlend);
    let clamped = clamp(blended, vec4(0.0), vec4(2.0));
    
    return clamped;
  }
  `;
}

function advancedCompositeFragWGSL() {
  return /* wgsl */`
  @group(0) @binding(0) var sceneTex: texture_2d<f32>;
  @group(0) @binding(1) var volTex: texture_2d<f32>;
  @group(0) @binding(2) var samp: sampler;
  
  struct Params {
    density: f32, steps: f32, scatterStrength: f32, heightFalloff: f32,
    range: f32, temporalBlend: f32, useTemporalReprojection: f32, mobileOptimizations: f32,
    qualityScale: f32, useTextureProjection: f32, textureProjectionIntensity: f32,
    _pad: f32, _pad2: f32, _pad3: f32, _pad4: f32, _pad5: f32,
  }
  
  @group(0) @binding(3) var<uniform> params: Params;

  fn upsampleBilinear(uv: vec2<f32>) -> vec4<f32> {
    let texSize = vec2<f32>(textureDimensions(volTex));
    let scaledUv = uv * params.qualityScale;
    
    let texelUv = scaledUv * texSize;
    let frac = fract(texelUv);
    let base = floor(texelUv);
    
    let c00 = textureSampleLevel(volTex, samp, base / texSize, 0.0);
    let c10 = textureSampleLevel(volTex, samp, (base + vec2(1.0, 0.0)) / texSize, 0.0);
    let c01 = textureSampleLevel(volTex, samp, (base + vec2(0.0, 1.0)) / texSize, 0.0);
    let c11 = textureSampleLevel(volTex, samp, (base + vec2(1.0, 1.0)) / texSize, 0.0);
    
    let c0 = mix(c00, c10, frac.x);
    let c1 = mix(c01, c11, frac.x);
    return mix(c0, c1, frac.y);
  }

  @fragment
  fn main(@builtin(position) fc: vec4<f32>) -> @location(0) vec4<f32> {
    let sceneSz = vec2<f32>(textureDimensions(sceneTex));
    let sceneUv = fc.xy / sceneSz;
    
    let scene = textureSample(sceneTex, samp, sceneUv);
    let vol = upsampleBilinear(sceneUv);
    
    let composite = scene.rgb * (1.0 - vol.a) + vol.rgb;
    
    return vec4<f32>(composite, scene.a);
  }
  `;
}
