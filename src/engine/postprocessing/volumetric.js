/**
 * @description
 * VolumetricPass class for matrix-engine-wgpu
 * Matches BloomPass architecture — drop-in standalone pass.
 *
 * Insert in frame loop after transPass.end(), before bloom:
 *   volumetricPass.render(encoder, sceneTextureView, mainDepthView, shadowArrayView, camera, light)
 *   bloomPass.render(encoder, volumetricPass.compositeOutputTex.createView(), bloomOutputTex)
 *
 * @setDensity         - fog density (default 0.03)
 * @setSteps           - ray march steps (default 32)
 * @setLightColor      - RGB light scattering color
 * @setScatterStrength - how bright the scattering is
 * @setHeightFalloff   - how fast fog fades with height
 */

export class VolumetricPass {
  constructor(width, height, device, options = {}) {
    this.enabled = false;
    this.device = device;
    this.width = width;
    this.height = height;

    this.volumetricTex = this._createTexture(width, height);

    // Linear sampler — composite pass
    this.sampler = device.createSampler({
      label: 'VolumetricPass.linearSampler',
      magFilter: 'linear',
      minFilter: 'linear',
      addressModeU: 'clamp-to-edge',
      addressModeV: 'clamp-to-edge',
    });

    // Comparison sampler — ALL THREE must agree:
    //   device sampler:  { compare: 'less-equal' }
    //   layout entry:    { type: 'comparison' }
    //   WGSL type:       sampler_comparison
    this.depthSampler = device.createSampler({
      label: 'VolumetricPass.comparisonSampler',
      compare: 'less-equal',
    });

    this.params = {
      density:         options.density         ?? 0.03,
      steps:           options.steps           ?? 32,
      scatterStrength: options.scatterStrength  ?? 1.0,
      heightFalloff:   options.heightFalloff   ?? 0.1,
    };

    this.lightParams = {
      color:     options.lightColor ?? [1.0, 0.85, 0.6],
      direction: [0.0, -1.0, 0.5],
    };

    this.paramsBuffer = device.createBuffer({
      label: 'VolumetricPass.paramsBuffer',
      size: 16,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    this.invViewProjBuffer = device.createBuffer({
      label: 'VolumetricPass.invViewProjBuffer',
      size: 64,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    this.lightViewProjBuffer = device.createBuffer({
      label: 'VolumetricPass.lightViewProjBuffer',
      size: 64,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    this.lightDirBuffer = device.createBuffer({
      label: 'VolumetricPass.lightDirBuffer',
      size: 16,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    this.lightColorBuffer = device.createBuffer({
      label: 'VolumetricPass.lightColorBuffer',
      size: 16,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    this._updateParams();
    this._updateLightColor();

    this.marchPipeline     = this._createMarchPipeline();
    this.compositePipeline = this._createCompositePipeline();
  }

  // ─── Public setters ────────────────────────────────────────────────────────

  setDensity         = (v) => { this.params.density = v;         this._updateParams(); }
  setSteps           = (v) => { this.params.steps = v;           this._updateParams(); }
  setScatterStrength = (v) => { this.params.scatterStrength = v; this._updateParams(); }
  setHeightFalloff   = (v) => { this.params.heightFalloff = v;   this._updateParams(); }

  setLightColor = (r, g, b) => {
    this.lightParams.color = [r, g, b];
    this._updateLightColor();
  }

  setLightDirection = (x, y, z) => {
    this.lightParams.direction = [x, y, z];
    this.device.queue.writeBuffer(this.lightDirBuffer, 0, new Float32Array([x, y, z, 0.0]));
  }

  // ─── Internal ─────────────────────────────────────────────────────────────

  _updateParams() {
    this.device.queue.writeBuffer(this.paramsBuffer, 0, new Float32Array([
      this.params.density,
      this.params.steps,
      this.params.scatterStrength,
      this.params.heightFalloff,
    ]));
  }

  _updateLightColor() {
    this.device.queue.writeBuffer(this.lightColorBuffer, 0,
      new Float32Array([...this.lightParams.color, 0.0]));
  }

  _createTexture(w, h) {
    return this.device.createTexture({
      label: 'VolumetricPass.texture',
      size: [w, h],
      format: 'rgba16float',
      usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
    });
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

  // ─── Pipelines ─────────────────────────────────────────────────────────────

  _createMarchPipeline() {
    const bgl = this.device.createBindGroupLayout({
      label: 'VolumetricPass.marchBGL',
      entries: [
        { binding: 0, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: 'depth' } },
        { binding: 1, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: 'depth', viewDimension: '2d-array' } },
        { binding: 2, visibility: GPUShaderStage.FRAGMENT, sampler: { type: 'comparison' } },  // ← must be 'comparison'
        { binding: 3, visibility: GPUShaderStage.FRAGMENT, buffer: { type: 'uniform' } },
        { binding: 4, visibility: GPUShaderStage.FRAGMENT, buffer: { type: 'uniform' } },
        { binding: 5, visibility: GPUShaderStage.FRAGMENT, buffer: { type: 'uniform' } },
        { binding: 6, visibility: GPUShaderStage.FRAGMENT, buffer: { type: 'uniform' } },
        { binding: 7, visibility: GPUShaderStage.FRAGMENT, buffer: { type: 'uniform' } },
      ]
    });
    return this.device.createRenderPipeline({
      label: 'Volumetric Pipeline',
      layout: this.device.createPipelineLayout({
        label: 'VolumetricPass.marchPipelineLayout',
        bindGroupLayouts: [bgl]
      }),
      vertex: {
        module: this.device.createShaderModule({ label: 'VolumetricPass.vert', code: fullscreenVertWGSL() }),
        entryPoint: 'vert'
      },
      fragment: {
        module: this.device.createShaderModule({ label: 'VolumetricPass.marchFrag', code: marchFragWGSL() }),
        entryPoint: 'main',
        targets: [{ format: 'rgba16float' }]
      },
      primitive: { topology: 'triangle-list' }
    });
  }

  _createCompositePipeline() {
    const bgl = this.device.createBindGroupLayout({
      label: 'VolumetricPass.compositeBGL',
      entries: [
        { binding: 0, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: 'float' } },
        { binding: 1, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: 'float' } },
        { binding: 2, visibility: GPUShaderStage.FRAGMENT, sampler: { type: 'filtering' } },
        { binding: 3, visibility: GPUShaderStage.FRAGMENT, buffer: { type: 'uniform' } },
      ]
    });
    return this.device.createRenderPipeline({
      label: 'VolumetricCompose Pipeline',
      layout: this.device.createPipelineLayout({
        label: 'VolumetricPass.compositePipelineLayout',
        bindGroupLayouts: [bgl]
      }),
      vertex: {
        module: this.device.createShaderModule({ label: 'VolumetricPass.compositeVert', code: fullscreenVertWGSL() }),
        entryPoint: 'vert'
      },
      fragment: {
        module: this.device.createShaderModule({ label: 'VolumetricPass.compositeFrag', code: compositeFragWGSL() }),
        entryPoint: 'main',
        targets: [{ format: 'rgba16float' }]
      },
      primitive: { topology: 'triangle-list' }
    });
  }

  // ─── Bind Groups ───────────────────────────────────────────────────────────

  _marchBindGroup(depthView, shadowArrayView) {
    return this.device.createBindGroup({
      label: 'VolumetricPass.marchBindGroup',
      layout: this.marchPipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: depthView },
        { binding: 1, resource: shadowArrayView },
        { binding: 2, resource: this.depthSampler },        // comparison sampler
        { binding: 3, resource: { buffer: this.invViewProjBuffer } },
        { binding: 4, resource: { buffer: this.lightViewProjBuffer } },
        { binding: 5, resource: { buffer: this.lightDirBuffer } },
        { binding: 6, resource: { buffer: this.lightColorBuffer } },
        { binding: 7, resource: { buffer: this.paramsBuffer } },
      ]
    });
  }

  _compositeBindGroup(sceneView) {
    return this.device.createBindGroup({
      label: 'VolumetricPass.compositeBindGroup',
      layout: this.compositePipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: sceneView },
        { binding: 1, resource: this.volumetricTex.createView() },
        { binding: 2, resource: this.sampler },
        { binding: 3, resource: { buffer: this.paramsBuffer } },
      ]
    });
  }

  // ─── Render ────────────────────────────────────────────────────────────────
  /**
   * @param {GPUCommandEncoder} encoder
   * @param {GPUTextureView} sceneView        — your sceneTextureView
   * @param {GPUTextureView} depthView        — your mainDepthView
   * @param {GPUTextureView} shadowArrayView  — your shadowArrayView
   * @param {object} camera  — { invViewProjectionMatrix: Float32Array(16) }
   * @param {object} light   — { viewProjectionMatrix: Float32Array(16), direction: [x,y,z] }
   */
  render(encoder, sceneView, depthView, shadowArrayView, camera, light) {
    this.device.queue.writeBuffer(this.invViewProjBuffer,   0, camera.invViewProjectionMatrix);
    this.device.queue.writeBuffer(this.lightViewProjBuffer, 0, light.viewProjectionMatrix);
    this.device.queue.writeBuffer(this.lightDirBuffer,      0, new Float32Array([...light.direction, 0.0]));

    // Pass 1 — ray march → volumetricTex
    {
      const pass = this._beginPass(encoder, this.volumetricTex.createView(), 'VolumetricPass.marchPass');
      pass.setPipeline(this.marchPipeline);
      pass.setBindGroup(0, this._marchBindGroup(depthView, shadowArrayView));
      pass.draw(6);
      pass.end();
    }

    // Pass 2 — composite → compositeOutputTex (feed this to bloomPass instead of sceneTextureView)
    {
      const pass = this._beginPass(encoder, this.compositeOutputTex.createView(), 'VolumetricPass.compositePass');
      pass.setPipeline(this.compositePipeline);
      pass.setBindGroup(0, this._compositeBindGroup(sceneView));
      pass.draw(6);
      pass.end();
    }
  }

  /** Call once after constructor. Chainable: new VolumetricPass(...).init() */
  init() {
    this.compositeOutputTex = this._createTexture(this.width, this.height);
    return this;
  }

  /** Call on canvas resize */
  resize(width, height) {
    this.width = width;
    this.height = height;
    this.volumetricTex      = this._createTexture(width, height);
    this.compositeOutputTex = this._createTexture(width, height);
  }
}


// ─── WGSL Shaders ─────────────────────────────────────────────────────────────

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

function marchFragWGSL() {
  return /* wgsl */`

  @group(0) @binding(0) var depthTex:   texture_depth_2d;
  @group(0) @binding(1) var shadowTex:  texture_depth_2d_array;
  @group(0) @binding(2) var cmpSamp:    sampler_comparison;
  @group(0) @binding(3) var<uniform> invViewProj:   mat4x4<f32>;
  @group(0) @binding(4) var<uniform> lightViewProj: mat4x4<f32>;
  @group(0) @binding(5) var<uniform> lightDir:      vec4<f32>;
  @group(0) @binding(6) var<uniform> lightColor:    vec4<f32>;

  struct Params { density: f32, steps: f32, scatterStrength: f32, heightFalloff: f32 }
  @group(0) @binding(7) var<uniform> params: Params;

  fn worldPos(uv: vec2<f32>, depth: f32) -> vec3<f32> {
    let ndc   = vec4(uv.x * 2.0 - 1.0, (1.0 - uv.y) * 2.0 - 1.0, depth, 1.0);
    let world = invViewProj * ndc;
    return world.xyz / world.w;
  }

  fn fogDensity(p: vec3<f32>) -> f32 {
    return params.density * exp(-max(p.y, 0.0) * params.heightFalloff);
  }

  @fragment
  fn main(@builtin(position) fc: vec4<f32>) -> @location(0) vec4<f32> {
    let sz    = vec2<f32>(textureDimensions(depthTex));
    let uv    = fc.xy / sz;
    let depth = textureLoad(depthTex, vec2<i32>(fc.xy), 0);

    let ro    = worldPos(uv, 0.0);
    let rt    = worldPos(uv, depth);
    let rlen  = length(rt - ro);
    let rdir  = normalize(rt - ro);
    let steps = max(i32(params.steps), 8);
    let step  = rlen / f32(steps);

    var accum = vec3<f32>(0.0);
    var trans = 1.0;

    for (var i = 0; i < steps; i++) {
      let p = ro + rdir * ((f32(i) + 0.5) * step);

      // ── textureSampleCompare MUST be in uniform control flow ─────────────
      // Compute shadow coords for every sample unconditionally.
      // Gate the contribution with branchless math — never use if/continue/break above this call.
      let ls  = lightViewProj * vec4(p, 1.0);
      let lp  = ls.xyz / ls.w;
      let suv = lp.xy * 0.5 + 0.5;

      let shadow   = textureSampleCompare(shadowTex, cmpSamp, suv, 0, lp.z - 0.002);
      let inBounds = f32(suv.x >= 0.0 && suv.x <= 1.0 && suv.y >= 0.0 && suv.y <= 1.0);
      let lit      = shadow * inBounds;

      let d   = fogDensity(p) * step;
      let ext = exp(-d);
      let s   = trans * (1.0 - ext) * lit * params.scatterStrength * f32(d > 0.0001);

      accum += s * lightColor.rgb;
      trans *= select(1.0, ext, d > 0.0001);
    }

    return vec4<f32>(accum, 1.0 - trans);
  }
  `;
}

function compositeFragWGSL() {
  return /* wgsl */`

  @group(0) @binding(0) var sceneTex: texture_2d<f32>;
  @group(0) @binding(1) var volTex:   texture_2d<f32>;
  @group(0) @binding(2) var samp:     sampler;
  struct Params { density: f32, steps: f32, scatterStrength: f32, heightFalloff: f32 }
  @group(0) @binding(3) var<uniform> params: Params;

  @fragment
  fn main(@builtin(position) fc: vec4<f32>) -> @location(0) vec4<f32> {
    let uv    = fc.xy / vec2<f32>(textureDimensions(sceneTex));
    let scene = textureSample(sceneTex, samp, uv);
    let vol   = textureSample(volTex, samp, uv);
    // vol.rgb = scattered light | vol.a = fog opacity
    return vec4<f32>(scene.rgb * (1.0 - vol.a) + vol.rgb, scene.a);
  }
  `;
}