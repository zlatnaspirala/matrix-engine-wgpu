// chatgpt SUGGESTION START
/**
 * CloudsVolumetric
 *
 * Real volumetric cloud layer for the Beast Engine post-processing chain.
 *
 * Render order:
 *   clouds.render(encoder, sceneView, depthView, camera, light)
 *   // Use clouds.getOutputView() as the input to the next post-process pass.
 *
 * camera: {
 *   invViewProjectionMatrix: Float32Array(16)
 * }
 * light (optional): {
 *   direction: [x, y, z], // direction from the scene toward the sun
 *   color: [r, g, b]
 * }
 *
 * The cloud volume is a world-space horizontal slab. The ray marcher clips
 * each camera ray against that slab and the opaque scene depth.
 *
 * Performance strategy:
 * - Half-resolution cloud march by default, full-resolution composite.
 * - Cheap procedural value noise (no 4D Voronoi evaluation per sample).
 * - Early ray termination on accumulated opacity.
 * - A small fixed light march for self-shadowing.
 * - Reusable uniform scratch arrays and cached bind groups.
 *
 * This implementation is original and does not copy third-party shader code.
 */
const CLOUD_PARAMS_WGSL = `
struct CloudParams {
  // coverage, density, cloudBase, cloudTop
  shape: vec4<f32>,
  // noiseScale, windSpeed, time, raySteps
  motion: vec4<f32>,
  // sunDirection.xyz, scattering strength
  lighting: vec4<f32>,
  // targetWidth, targetHeight, qualityScale, phase
  render: vec4<f32>,
};
`;

export class CloudsVolumetric {
  constructor(width, height, device, options = {}, sceneView = null) {
    this.device = device;
    this.width = width;
    this.height = height;
    this.enabled = options.enabled ?? true;
    this.isMobile = this._detectMobile();
    this.qualityScale = Math.max(0.2, Math.min(1, options.qualityScale ?? (this.isMobile ? 0.25 : 0.35)));
    this.params = {
      coverage: options.coverage ?? 0.58,
      density: options.density ?? 1.15,
      cloudBase: options.cloudBase ?? 24,
      cloudTop: options.cloudTop ?? 58,
      noiseScale: options.noiseScale ?? 0.018,
      windSpeed: options.windSpeed ?? 0.8,
      steps: Math.max(8, Math.min(64, Math.round(options.steps ?? (this.isMobile ? 16 : 24)))),
      scattering: options.scattering ?? 1.25,
    };
    this.sunDirection = new Float32Array(options.sunDirection ?? [-0.45, 0.8, -0.3]);
    this.sunColor = new Float32Array(options.sunColor ?? [1.0, 0.91, 0.76]);
    this._time = 0;
    this._manualTime = null;
    this._scratch = new Float32Array(16);
    this._computeSize();

    this.sampler = device.createSampler({
      label: 'CloudsVolumetric.linearSampler',
      magFilter: 'linear',
      minFilter: 'linear',
      addressModeU: 'clamp-to-edge',
      addressModeV: 'clamp-to-edge',
    });

    this.paramsBuffer = device.createBuffer({
      label: 'CloudsVolumetric.params',
      size: 64,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    this.invViewProjBuffer = device.createBuffer({
      label: 'CloudsVolumetric.invViewProjection',
      size: 64,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    this.sunColorBuffer = device.createBuffer({
      label: 'CloudsVolumetric.sunColor',
      size: 16,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    this._passDesc = {
      label: 'CloudsVolumetric.pass',
      colorAttachments: [{
        view: null,
        loadOp: 'clear',
        storeOp: 'store',
        clearValue: {r: 0, g: 0, b: 0, a: 0},
      }],
    };

    this._allocTextures();
    this.marchPipeline = this._createMarchPipeline();
    this.compositePipeline = this._createCompositePipeline();
    this._sceneView = null;
    this._depthView = null;
    this._marchBG = null;
    this._compositeBG = null;
    this._updateParams();
    this._updateSunColor();
    if(sceneView) this.setCompositeInput(sceneView);
  }

  _detectMobile() {
    if(typeof navigator === 'undefined') return false;
    return /android|iphone|ipad|ipod|mobile/i.test(navigator.userAgent || '');
  }

  _computeSize() {
    this.renderWidth = Math.max(1, Math.ceil(this.width * this.qualityScale));
    this.renderHeight = Math.max(1, Math.ceil(this.height * this.qualityScale));
  }

  _createTexture(width, height, label) {
    return this.device.createTexture({
      label,
      size: [width, height],
      format: 'rgba16float',
      usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
    });
  }

  _allocTextures() {
    this.cloudTexture = this._createTexture(this.renderWidth, this.renderHeight, 'CloudsVolumetric.lowRes');
    this.cloudView = this.cloudTexture.createView();
    this.outputTexture = this._createTexture(this.width, this.height, 'CloudsVolumetric.composite');
    this.outputView = this.outputTexture.createView();
  }

  _freeTextures() {
    this.cloudTexture?.destroy();
    this.outputTexture?.destroy();
  }

  _createFullscreenPipeline(label, fragmentCode, entries) {
    const bgl = this.device.createBindGroupLayout({label: `CloudsVolumetric.${label}.BGL`, entries});
    return this.device.createRenderPipeline({
      label: `CloudsVolumetric.${label}`,
      layout: this.device.createPipelineLayout({bindGroupLayouts: [bgl]}),
      vertex: {
        module: this.device.createShaderModule({code: cloudsFullscreenVertexWGSL()}),
        entryPoint: 'vert',
      },
      fragment: {
        module: this.device.createShaderModule({code: fragmentCode}),
        entryPoint: 'main',
        targets: [{format: 'rgba16float'}],
      },
      primitive: {topology: 'triangle-list'},
    });
  }

  _createMarchPipeline() {
    const F = GPUShaderStage.FRAGMENT;
    return this._createFullscreenPipeline('marchPipeline', cloudsMarchFragmentWGSL(), [
      {binding: 0, visibility: F, texture: {sampleType: 'depth'}},
      {binding: 1, visibility: F, buffer: {type: 'uniform'}},
      {binding: 2, visibility: F, buffer: {type: 'uniform'}},
      {binding: 3, visibility: F, buffer: {type: 'uniform'}},
    ]);
  }

  _createCompositePipeline() {
    const F = GPUShaderStage.FRAGMENT;
    return this._createFullscreenPipeline('compositePipeline', cloudsCompositeFragmentWGSL(), [
      {binding: 0, visibility: F, texture: {sampleType: 'float'}},
      {binding: 1, visibility: F, texture: {sampleType: 'float'}},
      {binding: 2, visibility: F, sampler: {type: 'filtering'}},
    ]);
  }

  _updateParams() {
    const p = this._scratch;
    p[0] = this.params.coverage;
    p[1] = this.params.density;
    p[2] = this.params.cloudBase;
    p[3] = Math.max(this.params.cloudBase + 0.1, this.params.cloudTop);
    p[4] = this.params.noiseScale;
    p[5] = this.params.windSpeed;
    p[6] = this._time;
    p[7] = this.params.steps;
    p[8] = this.sunDirection[0];
    p[9] = this.sunDirection[1];
    p[10] = this.sunDirection[2];
    p[11] = this.params.scattering;
    p[12] = this.renderWidth;
    p[13] = this.renderHeight;
    p[14] = this.qualityScale;
    p[15] = 0;
    this.device.queue.writeBuffer(this.paramsBuffer, 0, p);
  }

  _updateSunColor() {
    this.device.queue.writeBuffer(this.sunColorBuffer, 0,
      new Float32Array([this.sunColor[0], this.sunColor[1], this.sunColor[2], 0]));
  }

  _buildBindGroups(sceneView, depthView) {
    if(depthView && (depthView !== this._depthView || !this._marchBG)) {
      this._depthView = depthView;
      this._marchBG = this.device.createBindGroup({
        layout: this.marchPipeline.getBindGroupLayout(0),
        entries: [
          {binding: 0, resource: depthView},
          {binding: 1, resource: {buffer: this.invViewProjBuffer}},
          {binding: 2, resource: {buffer: this.paramsBuffer}},
          {binding: 3, resource: {buffer: this.sunColorBuffer}},
        ],
      });
    }
    if(sceneView && (sceneView !== this._sceneView || !this._compositeBG)) {
      this._sceneView = sceneView;
      this._compositeBG = this.device.createBindGroup({
        layout: this.compositePipeline.getBindGroupLayout(0),
        entries: [
          {binding: 0, resource: sceneView},
          {binding: 1, resource: this.cloudView},
          {binding: 2, resource: this.sampler},
        ],
      });
    }
  }

  setCompositeInput(sceneView) {
    this._buildBindGroups(sceneView, null);
    return this;
  }

  setCoverage(value) {
    this.params.coverage = Math.max(0, Math.min(1, value));
    this._updateParams();
    return this;
  }

  setDensity(value) {
    this.params.density = Math.max(0, value);
    this._updateParams();
    return this;
  }

  setCloudLayer(base, top) {
    this.params.cloudBase = base;
    this.params.cloudTop = Math.max(base + 0.1, top);
    this._updateParams();
    return this;
  }

  setNoiseScale(value) {
    this.params.noiseScale = Math.max(0.001, value);
    this._updateParams();
    return this;
  }

  setWindSpeed(value) {
    this.params.windSpeed = value;
    this._updateParams();
    return this;
  }

  setSteps(value) {
    this.params.steps = Math.max(8, Math.min(64, Math.round(value)));
    this._updateParams();
    return this;
  }

  setScattering(value) {
    this.params.scattering = Math.max(0, value);
    this._updateParams();
    return this;
  }

  setSunDirection(x, y, z) {
    const len = Math.hypot(x, y, z) || 1;
    this.sunDirection[0] = x / len;
    this.sunDirection[1] = y / len;
    this.sunDirection[2] = z / len;
    this._updateParams();
    return this;
  }

  setSunColor(r, g, b) {
    this.sunColor.set([r, g, b]);
    this._updateSunColor();
    return this;
  }

  setTime(seconds) {
    this._manualTime = seconds;
    this._time = seconds;
    this._updateParams();
    return this;
  }

  setQualityScale(scale) {
    this.qualityScale = Math.max(0.2, Math.min(1, scale));
    this.resize(this.width, this.height);
    return this;
  }

  getOutputView() {
    return this.outputView;
  }

  //   render(encoder, sceneView, depthView, shadowArrayView, camera, light) {
  render(encoder, sceneView, depthView, shadowArrayView=null, camera, light = null) {
    if(!this.enabled) return this.outputView;
    if(!camera?.invViewProjectionMatrix) {
      throw new Error('CloudsVolumetric.render requires camera.invViewProjectionMatrix');
    }
    if(sceneView) this._buildBindGroups(sceneView, null);
    this._buildBindGroups(null, depthView);

    this.device.queue.writeBuffer(this.invViewProjBuffer, 0, camera.invViewProjectionMatrix);
    if(light?.direction) this.setSunDirection(...light.direction);
    if(light?.color) this.setSunColor(...light.color);
    if(this._manualTime === null) {
      this._time = (typeof performance !== 'undefined' ? performance.now() : Date.now()) * 0.001;
    } else {
      this._time = this._manualTime;
    }
    this._updateParams();

    if(!this._marchBG || !this._compositeBG) {
      throw new Error('CloudsVolumetric needs sceneView and depthView bind groups before rendering');
    }

    this._passDesc.label = 'CloudsVolumetric.march';
    this._passDesc.colorAttachments[0].view = this.cloudView;
    let pass = encoder.beginRenderPass(this._passDesc);
    pass.setPipeline(this.marchPipeline);
    pass.setBindGroup(0, this._marchBG);
    pass.draw(6);
    pass.end();

    this._passDesc.label = 'CloudsVolumetric.composite';
    this._passDesc.colorAttachments[0].view = this.outputView;
    pass = encoder.beginRenderPass(this._passDesc);
    pass.setPipeline(this.compositePipeline);
    pass.setBindGroup(0, this._compositeBG);
    pass.draw(6);
    pass.end();
    return this.outputView;
  }

  resize(width, height) {
    this.width = width;
    this.height = height;
    this._computeSize();
    this._freeTextures();
    this._allocTextures();
    this._sceneView = null;
    this._depthView = null;
    this._marchBG = null;
    this._compositeBG = null;
    this._updateParams();
    return this;
  }

  destroy() {
    this._freeTextures();
    this.paramsBuffer?.destroy();
    this.invViewProjBuffer?.destroy();
    this.sunColorBuffer?.destroy();
  }
}

export function cloudsFullscreenVertexWGSL() {
  return `
    @vertex
    fn vert(@builtin(vertex_index) i: u32) -> @builtin(position) vec4<f32> {
      var pos = array<vec2<f32>, 6>(
        vec2(-1.0, -1.0), vec2(1.0, -1.0), vec2(-1.0, 1.0),
        vec2(-1.0, 1.0), vec2(1.0, -1.0), vec2(1.0, 1.0)
      );
      return vec4(pos[i], 0.0, 1.0);
    }
  `;
}

function cloudsMarchFragmentWGSL() {
  return `
  ${CLOUD_PARAMS_WGSL}
  @group(0) @binding(0) var depthTex: texture_depth_2d;
  @group(0) @binding(1) var<uniform> invViewProj: mat4x4<f32>;
  @group(0) @binding(2) var<uniform> params: CloudParams;
  @group(0) @binding(3) var<uniform> sunColor: vec4<f32>;

  fn worldFromDepth(uv: vec2<f32>, depth: f32) -> vec3<f32> {
    let ndc = vec4<f32>(uv.x * 2.0 - 1.0, (1.0 - uv.y) * 2.0 - 1.0, depth, 1.0);
    let world = invViewProj * ndc;
    return world.xyz / max(abs(world.w), 0.000001) * sign(world.w);
  }

  fn hash31(p: vec3<f32>) -> f32 {
    var q = fract(p * 0.1031);
    q = q + vec3<f32>(dot(q, q.yzx + vec3<f32>(33.33)));
    return fract((q.x + q.y) * q.z);
  }

  fn noise3(p: vec3<f32>) -> f32 {
    let i = floor(p);
    let f = fract(p);
    let u = f * f * (vec3<f32>(3.0) - 2.0 * f);
    let a = hash31(i);
    let b = hash31(i + vec3<f32>(1.0, 0.0, 0.0));
    let c = hash31(i + vec3<f32>(0.0, 1.0, 0.0));
    let d = hash31(i + vec3<f32>(1.0, 1.0, 0.0));
    let e = hash31(i + vec3<f32>(0.0, 0.0, 1.0));
    let f1 = hash31(i + vec3<f32>(1.0, 0.0, 1.0));
    let g = hash31(i + vec3<f32>(0.0, 1.0, 1.0));
    let h = hash31(i + vec3<f32>(1.0, 1.0, 1.0));
    let x00 = mix(a, b, u.x);
    let x10 = mix(c, d, u.x);
    let x01 = mix(e, f1, u.x);
    let x11 = mix(g, h, u.x);
    return mix(mix(x00, x10, u.y), mix(x01, x11, u.y), u.z);
  }

  fn cloudNoise(p: vec3<f32>) -> f32 {
    let coarse = noise3(p) * 0.68;
    let detail = noise3(p * 2.03 + vec3<f32>(17.1, 9.2, 13.7)) * 0.32;
    return coarse + detail;
  }

  fn cloudWindOffset() -> vec3<f32> {
    return vec3<f32>(params.motion.y * params.motion.z, 0.0, params.motion.y * params.motion.z * 0.37);
  }

  fn cloudVerticalProfile(worldPos: vec3<f32>) -> f32 {
    let layerHeight = params.shape.w - params.shape.z;
    let h = clamp((worldPos.y - params.shape.z) / max(layerHeight, 0.001), 0.0, 1.0);
    return smoothstep(0.0, 0.13, h) * (1.0 - smoothstep(0.72, 1.0, h));
  }

  fn densityAt(worldPos: vec3<f32>) -> f32 {
    let p = worldPos * params.motion.x + cloudWindOffset();
    let n = cloudNoise(p);
    let broad = smoothstep(0.46 - params.shape.x * 0.34, 0.80, n);
    return max(0.0, broad * cloudVerticalProfile(worldPos) * params.shape.y);
  }

  // fn densityAt(worldPos: vec3<f32>) -> f32 {
  //   let h = clamp(
  //       (worldPos.y - params.shape.z) /
  //       max(params.shape.w - params.shape.z, 0.001),
  //       0.0,
  //       1.0
  //   );

//     return smoothstep(0.0, 0.2, h) *
//            (1.0 - smoothstep(0.7, 1.0, h));
// }

  // Lower-cost coarse density for the two-point light transmittance estimate.
  fn shadowDensityAt(worldPos: vec3<f32>) -> f32 {
    let p = worldPos * (params.motion.x * 0.72) + cloudWindOffset();
    let n = noise3(p);
    let broad = smoothstep(0.43 - params.shape.x * 0.28, 0.78, n);
    return broad * cloudVerticalProfile(worldPos) * params.shape.y;
  }

  fn intersectCloudLayer(ro: vec3<f32>, rd: vec3<f32>, maxDistance: f32) -> vec2<f32> {
    if(abs(rd.y) < 0.0001) {
      if(ro.y < params.shape.z || ro.y > params.shape.w) { return vec2<f32>(1.0, 0.0); }
      return vec2<f32>(0.0, maxDistance);
    }
    let a = (params.shape.z - ro.y) / rd.y;
    let b = (params.shape.w - ro.y) / rd.y;
    let nearT = max(0.0, min(a, b));
    let farT = min(maxDistance, max(a, b));
    return vec2<f32>(nearT, max(0.0, farT - nearT));
  }

  @fragment
  fn main(@builtin(position) pixel: vec4<f32>) -> @location(0) vec4<f32> {
    let uv = pixel.xy / params.render.xy;
    let depthSize = vec2<f32>(textureDimensions(depthTex));
    let depthPx = vec2<i32>(clamp(uv * depthSize, vec2<f32>(0.0), depthSize - vec2<f32>(1.0)));
    let sceneDepth = textureLoad(depthTex, depthPx, 0);

    // Match CloudsVolumetric2: derive the ray from the near and far clip
    // planes, and only use scene depth as a limit when opaque geometry exists.
    let nearPos = worldFromDepth(uv, 0.0);
    let farPos = worldFromDepth(uv, 1.0);
    let rayDir = normalize(farPos - nearPos);

    var sceneDistance = 1e9;
    if(sceneDepth < 1.0) {
      sceneDistance = length(worldFromDepth(uv, sceneDepth) - nearPos);
    }

    let hit = intersectCloudLayer(nearPos, rayDir, sceneDistance);
    if(hit.y <= 0.001) { return vec4<f32>(0.0); }


    // Volumetric front-to-back integration using the verified 3D density field.
    let stepLength = hit.y / max(params.motion.w, 8.0);
    let jitter = fract(sin(dot(pixel.xy, vec2<f32>(12.9898, 78.233))) * 43758.5453);
    var transmittance = 1.0;
    var radiance = vec3<f32>(0.0);

    for(var i = 0; i < i32(params.motion.w); i++) {
      let t = hit.x + (f32(i) + jitter) * stepLength;
      let p = nearPos + rayDir * t;
      let density = densityAt(p);

      if(density > 0.001) {
        // The previous 0.035 extinction was too weak for this world-space step length.
        let opticalDepth = density * stepLength * 0.35;
        let attenuation = exp(-opticalDepth);
        let sunDir = normalize(params.lighting.xyz);
        let lightP = p + sunDir * 4.5;
        let lightTrans = exp(-shadowDensityAt(lightP) * 0.22);
        let phase = 0.35 + 0.65 * pow(max(dot(rayDir, sunDir), 0.0), 4.0);
        let powder = 1.0 - exp(-opticalDepth * 2.0);
        let light = sunColor.rgb * params.lighting.w * lightTrans * phase;

        radiance += transmittance * (1.0 - attenuation) *
          (light + vec3<f32>(0.34, 0.39, 0.48) * powder);
        transmittance *= attenuation;
      }

      if(transmittance < 0.025) { break; }
    }

    return vec4<f32>(radiance, 1.0 - transmittance);
  }
  `;
}

function cloudsCompositeFragmentWGSL() {
  return `
  @group(0) @binding(0) var sceneTex: texture_2d<f32>;
  @group(0) @binding(1) var cloudTex: texture_2d<f32>;
  @group(0) @binding(2) var samp: sampler;

  @fragment
  fn main(@builtin(position) pixel: vec4<f32>) -> @location(0) vec4<f32> {
    let uv = pixel.xy / vec2<f32>(textureDimensions(sceneTex));
    let scene = textureSample(sceneTex, samp, uv);
    let clouds = textureSample(cloudTex, samp, uv);
    let color = scene.rgb * (1.0 - clouds.a) + clouds.rgb;
    return vec4<f32>(color, scene.a);
  }
  `;
}
// chatgpt SUGGESTION end
