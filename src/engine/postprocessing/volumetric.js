/**
 * @description
 * VolumetricPass class for matrix-engine-wgpu
 * Matches BloomPass architecture — drop-in standalone pass.
 *
 * Sits between transPass and bloom in your frame loop:
 *   transPass.end()
 *   → volumetricPass.render(commandEncoder, sceneTextureView, depthTextureView, shadowArrayView, camera, light)
 *   → bloomPass.render(...)
 *
 * @public
 * @setDensity        - fog density (default 0.03)
 * @setSteps          - ray march steps (default 32)
 * @setLightColor     - RGB light scattering color
 * @setScatterStrength - how bright the scattering is
 * @setHeightFalloff  - how fast fog fades with height
 */

export class VolumetricPass {
  constructor(width, height, device, options = {}) {
    this.enabled = false;
    this.device = device;
    this.width = width;
    this.height = height;

    // Output texture — same format as your sceneTexture (rgba16float)
    this.volumetricTex = this._createTexture(width, height);

    this.sampler = device.createSampler({
      magFilter: 'linear',
      minFilter: 'linear',
      addressModeU: 'clamp-to-edge',
      addressModeV: 'clamp-to-edge',
    });

    this.depthSampler = device.createSampler({
      magFilter: 'nearest',
      minFilter: 'nearest',
      addressModeU: 'clamp-to-edge',
      addressModeV: 'clamp-to-edge',
    });

    // Params: density, steps, scatterStrength, heightFalloff
    this.params = {
      density:        options.density        ?? 0.03,
      steps:          options.steps          ?? 32,
      scatterStrength: options.scatterStrength ?? 1.0,
      heightFalloff:  options.heightFalloff  ?? 0.1,
    };

    // Light: color (rgb) + padding
    this.lightParams = {
      color: options.lightColor ?? [1.0, 0.85, 0.6],
      direction: [0.0, -1.0, 0.5],  // update each frame via setLightDirection
    };

    // --- Uniform buffers ---
    // vec4: density, steps(as float), scatterStrength, heightFalloff
    this.paramsBuffer = device.createBuffer({
      size: 16,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    // mat4 invViewProj (64 bytes)
    this.invViewProjBuffer = device.createBuffer({
      size: 64,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    // mat4 lightViewProj (64 bytes)
    this.lightViewProjBuffer = device.createBuffer({
      size: 64,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    // vec4: lightDir.xyz + padding
    this.lightDirBuffer = device.createBuffer({
      size: 16,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    // vec4: lightColor.rgb + padding
    this.lightColorBuffer = device.createBuffer({
      size: 16,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    this._updateParams();
    this._updateLightColor();

    // --- Pipelines ---
    this.marchPipeline   = this._createMarchPipeline();
    this.compositePipeline = this._createCompositePipeline();
  }

  // ─── Public setters ────────────────────────────────────────────────────────

  setDensity = (v) => {
    this.params.density = v;
    this._updateParams();
  }

  setSteps = (v) => {
    this.params.steps = v;
    this._updateParams();
  }

  setScatterStrength = (v) => {
    this.params.scatterStrength = v;
    this._updateParams();
  }

  setHeightFalloff = (v) => {
    this.params.heightFalloff = v;
    this._updateParams();
  }

  setLightColor = (r, g, b) => {
    this.lightParams.color = [r, g, b];
    this._updateLightColor();
  }

  setLightDirection = (x, y, z) => {
    this.lightParams.direction = [x, y, z];
    this.device.queue.writeBuffer(
      this.lightDirBuffer, 0,
      new Float32Array([x, y, z, 0.0])
    );
  }

  // ─── Internal updates ──────────────────────────────────────────────────────

  _updateParams() {
    this.device.queue.writeBuffer(
      this.paramsBuffer, 0,
      new Float32Array([
        this.params.density,
        this.params.steps,
        this.params.scatterStrength,
        this.params.heightFalloff,
      ])
    );
  }

  _updateLightColor() {
    this.device.queue.writeBuffer(
      this.lightColorBuffer, 0,
      new Float32Array([...this.lightParams.color, 0.0])
    );
  }

  // ─── Texture + Pipeline helpers ────────────────────────────────────────────

  _createTexture(w, h) {
    return this.device.createTexture({
      size: [w, h],
      format: 'rgba16float',
      usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
    });
  }

  _createMarchPipeline() {
    const bindGroupLayout = this.device.createBindGroupLayout({
      entries: [
        // 0: scene depth
        { binding: 0, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: 'depth' } },
        // 1: shadow map array
        { binding: 1, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: 'depth', viewDimension: '2d-array' } },
        // 2: depth sampler
        { binding: 2, visibility: GPUShaderStage.FRAGMENT, sampler: { type: 'non-filtering' } },
        // 3: invViewProj
        { binding: 3, visibility: GPUShaderStage.FRAGMENT, buffer: { type: 'uniform' } },
        // 4: lightViewProj
        { binding: 4, visibility: GPUShaderStage.FRAGMENT, buffer: { type: 'uniform' } },
        // 5: lightDir
        { binding: 5, visibility: GPUShaderStage.FRAGMENT, buffer: { type: 'uniform' } },
        // 6: lightColor
        { binding: 6, visibility: GPUShaderStage.FRAGMENT, buffer: { type: 'uniform' } },
        // 7: params
        { binding: 7, visibility: GPUShaderStage.FRAGMENT, buffer: { type: 'uniform' } },
      ]
    });

    return this.device.createRenderPipeline({
      layout: this.device.createPipelineLayout({ bindGroupLayouts: [bindGroupLayout] }),
      vertex: {
        module: this.device.createShaderModule({ code: volumetricFullscreenQuadWGSL() }),
        entryPoint: 'vert'
      },
      fragment: {
        module: this.device.createShaderModule({ code: volumetricMarchWGSL() }),
        entryPoint: 'main',
        targets: [{ format: 'rgba16float' }]
      },
      primitive: { topology: 'triangle-list' }
    });
  }

  _createCompositePipeline() {
    const bindGroupLayout = this.device.createBindGroupLayout({
      entries: [
        // 0: scene color
        { binding: 0, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: 'float' } },
        // 1: volumetric result
        { binding: 1, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: 'float' } },
        // 2: sampler
        { binding: 2, visibility: GPUShaderStage.FRAGMENT, sampler: { type: 'filtering' } },
        // 3: params (for scatterStrength)
        { binding: 3, visibility: GPUShaderStage.FRAGMENT, buffer: { type: 'uniform' } },
      ]
    });

    return this.device.createRenderPipeline({
      layout: this.device.createPipelineLayout({ bindGroupLayouts: [bindGroupLayout] }),
      vertex: {
        module: this.device.createShaderModule({ code: volumetricFullscreenQuadWGSL() }),
        entryPoint: 'vert'
      },
      fragment: {
        module: this.device.createShaderModule({ code: volumetricCompositeWGSL() }),
        entryPoint: 'main',
        targets: [{ format: 'rgba16float' }]
      },
      primitive: { topology: 'triangle-list' }
    });
  }

  _marchBindGroup(depthView, shadowArrayView) {
    return this.device.createBindGroup({
      layout: this.marchPipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: depthView },
        { binding: 1, resource: shadowArrayView },
        { binding: 2, resource: this.depthSampler },
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
      layout: this.compositePipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: sceneView },
        { binding: 1, resource: this.volumetricTex.createView() },
        { binding: 2, resource: this.sampler },
        { binding: 3, resource: { buffer: this.paramsBuffer } },
      ]
    });
  }

  _beginFullscreenPass(encoder, targetView) {
    return encoder.beginRenderPass({
      colorAttachments: [{
        view: targetView,
        loadOp: 'clear',
        storeOp: 'store',
        clearValue: { r: 0, g: 0, b: 0, a: 0 }
      }]
    });
  }

  // ─── Main render — call after transPass.end(), before bloom ───────────────
  /**
   * @param {GPUCommandEncoder} encoder
   * @param {GPUTextureView} sceneView       — your sceneTextureView
   * @param {GPUTextureView} depthView       — your mainDepthView
   * @param {GPUTextureView} shadowArrayView — your shadowArrayView
   * @param {object} camera  — needs .invViewProjectionMatrix (Float32Array 16)
   * @param {object} light   — needs .viewProjectionMatrix (Float32Array 16)
   *                           and .direction [x,y,z]
   */
  render(encoder, sceneView, depthView, shadowArrayView, camera, light) {

    // Upload matrices every frame
    this.device.queue.writeBuffer(
      this.invViewProjBuffer, 0,
      camera.invViewProjectionMatrix
    );
    this.device.queue.writeBuffer(
      this.lightViewProjBuffer, 0,
      light.viewProjectionMatrix
    );
    this.device.queue.writeBuffer(
      this.lightDirBuffer, 0,
      new Float32Array([...light.direction, 0.0])
    );

    // ── Pass 1: Ray march → volumetricTex ────────────────────────────────────
    {
      const pass = this._beginFullscreenPass(encoder, this.volumetricTex.createView());
      pass.setPipeline(this.marchPipeline);
      pass.setBindGroup(0, this._marchBindGroup(depthView, shadowArrayView));
      pass.draw(6);
      pass.end();
    }

    // ── Pass 2: Composite volumetric over scene → sceneView (in-place) ───────
    // We write back into the scene texture so bloom picks it up automatically.
    // Same pattern your bloom uses — it reads sceneView and writes to bloomOutputTex,
    // but here we want the result back in scene so the chain is transparent.
    // Use a temp composite tex and swap, OR write to a separate tex and
    // pass that to bloom instead of sceneTextureView. Both work.
    // Here we write to a compositeOutputTex and you pass THAT to bloomPass.render().
    {
      const pass = this._beginFullscreenPass(encoder, this.compositeOutputTex.createView());
      pass.setPipeline(this.compositePipeline);
      pass.setBindGroup(0, this._compositeBindGroup(sceneView));
      pass.draw(6);
      pass.end();
    }
  }

  /**
   * Call once after constructor — creates the composite output texture.
   * Separated so you can call it on resize too.
   */
  init() {
    this.compositeOutputTex = this._createTexture(this.width, this.height);
    return this; // chainable
  }

  /**
   * Call on canvas resize
   */
  resize(width, height) {
    this.width = width;
    this.height = height;
    this.volumetricTex = this._createTexture(width, height);
    this.compositeOutputTex = this._createTexture(width, height);
  }
}


// ─── WGSL Shaders ────────────────────────────────────────────────────────────

export function volumetricFullscreenQuadWGSL() {
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

function volumetricMarchWGSL() {
  return /* wgsl */`

  // ── Bindings ───────────────────────────────────────────────────────────────
  @group(0) @binding(0) var depthTex:      texture_depth_2d;
  @group(0) @binding(1) var shadowTex:     texture_depth_2d_array;
  @group(0) @binding(2) var depthSampler:  sampler_comparison;
  @group(0) @binding(3) var<uniform> invViewProj:   mat4x4<f32>;
  @group(0) @binding(4) var<uniform> lightViewProj: mat4x4<f32>;
  @group(0) @binding(5) var<uniform> lightDir:      vec4<f32>;
  @group(0) @binding(6) var<uniform> lightColor:    vec4<f32>;

  struct Params {
    density:        f32,
    steps:          f32,  // float so no layout issues
    scatterStrength: f32,
    heightFalloff:  f32,
  };
  @group(0) @binding(7) var<uniform> params: Params;

  // ── Reconstruct world position from NDC depth ──────────────────────────────
  fn worldFromDepth(uv: vec2<f32>, depth: f32) -> vec3<f32> {
    let ndc = vec4(uv * 2.0 - 1.0, depth, 1.0);
    // Flip Y — WebGPU NDC Y is inverted vs GL
    let ndc_wgpu = vec4(ndc.x, -ndc.y, ndc.z, ndc.w);
    let worldH = invViewProj * ndc_wgpu;
    return worldH.xyz / worldH.w;
  }

  // ── Shadow test against light's shadow map (layer 0 = first light) ─────────
  fn inShadow(worldPos: vec3<f32>) -> f32 {
    let lightSpace = lightViewProj * vec4(worldPos, 1.0);
    var proj = lightSpace.xyz / lightSpace.w;
    // NDC → UV
    let uv = proj.xy * 0.5 + 0.5;
    // clamp to valid range
    if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
      return 1.0; // outside shadow map = lit
    }
    // WebGPU shadow comparison: returns 1.0 if NOT in shadow
    return textureSampleCompare(shadowTex, depthSampler, uv, 0, proj.z - 0.002);
  }

  // ── Height-based fog density ───────────────────────────────────────────────
  fn fogDensity(worldPos: vec3<f32>) -> f32 {
    let heightFog = exp(-max(worldPos.y, 0.0) * params.heightFalloff);
    return params.density * heightFog;
  }

  // ── Main fragment ──────────────────────────────────────────────────────────
 // ── Main fragment ──────────────────────────────────────────────────────────
@fragment
fn main(@builtin(position) fragCoord: vec4<f32>) -> @location(0) vec4<f32> {

  let texSize   = vec2<f32>(textureDimensions(depthTex));
  let uv        = fragCoord.xy / texSize;
  let sceneDepth = textureLoad(depthTex, vec2<i32>(fragCoord.xy), 0);

  let rayOrigin = worldFromDepth(uv, 0.0);
  let rayTarget = worldFromDepth(uv, sceneDepth);
  let rayVec    = rayTarget - rayOrigin;
  let rayLen    = length(rayVec);
  let rayDir    = normalize(rayVec);

  let numSteps  = max(i32(params.steps), 8);
  let stepSize  = rayLen / f32(numSteps);

  var accumulated   = vec3<f32>(0.0);
  var transmittance = 1.0;

  for (var i = 0; i < numSteps; i++) {
    let t   = (f32(i) + 0.5) * stepSize;
    let pos = rayOrigin + rayDir * t;

    // ── shadow sample MUST be outside any branching ──────────────────────
    // Compute light space UVs unconditionally
    let lightSpace = lightViewProj * vec4(pos, 1.0);
    let proj       = lightSpace.xyz / lightSpace.w;
    let shadowUV   = proj.xy * 0.5 + 0.5;

    // Always sample — no if/continue before this
    let lit = textureSampleCompare(shadowTex, depthSampler, shadowUV, 0, proj.z - 0.002);

    // NOW we can gate the accumulation logic
    let density = fogDensity(pos) * stepSize;
    let inBounds = f32(shadowUV.x >= 0.0 && shadowUV.x <= 1.0 &&
                       shadowUV.y >= 0.0 && shadowUV.y <= 1.0);

    let extinction = exp(-density);
    let scatter    = transmittance * (1.0 - extinction) * lit * inBounds * params.scatterStrength;

    accumulated   += scatter * lightColor.rgb;
    transmittance *= select(1.0, extinction, density > 0.0001);
  }

  // Remove early-exit break too — breaks uniform flow as well
  return vec4<f32>(accumulated, 1.0 - transmittance);
}
  `;
}

function volumetricCompositeWGSL() {
  return /* wgsl */`

  struct Params {
    density:        f32,
    steps:          f32,
    scatterStrength: f32,
    heightFalloff:  f32,
  };

  @group(0) @binding(0) var sceneTex:      texture_2d<f32>;
  @group(0) @binding(1) var volumetricTex: texture_2d<f32>;
  @group(0) @binding(2) var samp:          sampler;
  @group(0) @binding(3) var<uniform> params: Params;

  @fragment
  fn main(@builtin(position) fragCoord: vec4<f32>) -> @location(0) vec4<f32> {
    let size = vec2<f32>(textureDimensions(sceneTex));
    let uv   = fragCoord.xy / size;

    let scene = textureSample(sceneTex, samp, uv);
    let vol   = textureSample(volumetricTex, samp, uv);

    // vol.rgb = scattered light color
    // vol.a   = fog opacity (how much it blocks scene)
    // Result: scene dimmed by fog + scattered light added
    let color = scene.rgb * (1.0 - vol.a) + vol.rgb;

    return vec4<f32>(color, scene.a);
  }
  `;
}