2/**
 * CloudsVolumetric - ray-marched volumetric cloud layer for matrix-engine-wgpu.
 * Drop-in standalone pass, same contract as VolumetricPass / BloomPass.
 *
 * LICENSE / PROVENANCE
 *   Original implementation written for this engine. No third-party source code
 *   is copied. It implements publicly documented techniques only:
 *    - Schneider, "The Real-Time Volumetric Cloudscapes of Horizon: Zero Dawn"
 *      (SIGGRAPH 2015 / GPU Pro 7): shape+detail noise, height gradient, coverage remap.
 *    - Henyey-Greenstein phase function, dual lobe.
 *    - Wrenninge, "Art-directable multiple volumetric scattering" (multi-octave
 *      scattering approximation).
 *    - PCG hash (O'Neill; Jarzynski & Olano, "Hash Functions for GPU Rendering", JCGT 2020).
 *    - Interleaved gradient noise (Jimenez, SIGGRAPH 2014) for ray jitter.
 *   Reviewed candidates (not used as code sources):
 *    - jeantimex/procedural-clouds (MIT) - per-frame 3D cache compute, too heavy.
 *    - Spark (sparkjs.dev, MIT) - splat renderer for three.js/WebGL2, different feature.
 *
 * PERFORMANCE DESIGN (the reason it is cheap)
 *   1. Noise volumes are generated ONCE at construction (64^3 shape, 32^3 detail,
 *      rgba8unorm). The per-frame cost is texture fetches only, no noise math.
 *   2. Marching runs at qualityScale (default 0.5 desktop / 0.4 mobile) resolution.
 *   3. Rays are jittered per frame; a reprojected temporal accumulation pass
 *      (rotation-only reprojection, 3x3 neighbourhood clamp) removes the noise,
 *      so few steps are enough.
 *   4. Light march uses detail-free density and few steps; early exit on opacity.
 *   5. Zero per-frame allocation: pass descriptors, bind groups and the uniform
 *      scratch array are all prebuilt/reused (ping-pong history uses 2 bind groups).
 *
 * Frame loop (after the main + transparent pass, after volumetricPass if any, before bloom):
 *   cloudsPass.render(encoder, mainDepthView, {invViewProjectionMatrix, viewProjectionMatrix});
 *   bloomPass input must be cloudsPass.compositeOutputTexView
 *   (world.activateCloudsEffect() does this wiring).
 *
 * Units: all distances are world units. Tune cloudBase / cloudThickness / noise scales
 * for your scene scale.
 *
 * Public setters:
 *   setCoverage, setDensity, setCloudLayer(base, thickness), setSunDirection,
 *   setSunColor(r,g,b,intensity), setAmbientColor, setWind(speed,dx,dz),
 *   setSteps(view, light), setMaxDistance, setNoiseScale(shape, detail),
 *   setDetailAmount, setPhaseG, setTemporal(enabled), setTemporalBlend, setQualityScale
 */

export class CloudsVolumetric2 {
  constructor(width, height, device, options = {}, sceneView) {
    this.enabled = false;
    this.device = device;
    this.width = width;
    this.height = height;
    this.isMobile = this._detectMobileDevice();
    this.qualityScale = options.qualityScale ?? (this.isMobile ? 0.4 : 0.5);

    this.params = {
      cloudBase: options.cloudBase ?? 120,
      cloudThickness: options.cloudThickness ?? 60,
      coverage: options.coverage ?? 0.55,
      density: options.density ?? 0.04,
      shapeScale: options.shapeScale ?? 1 / 900,
      detailScale: options.detailScale ?? 1 / 180,
      detailAmount: options.detailAmount ?? 0.35,
      viewSteps: options.viewSteps ?? (this.isMobile ? 16 : 32),
      lightSteps: options.lightSteps ?? (this.isMobile ? 3 : 4),
      maxDistance: options.maxDistance ?? 2000,
      phaseG: options.phaseG ?? 0.55,
      temporal: options.temporal ?? true,
      temporalBlend: options.temporalBlend ?? 0.9,
      windSpeed: options.windSpeed ?? 8,
      windDir: options.windDir ?? [1.0, 0.3],
    };
    const sd = options.sunDirection ?? [0.4, 0.6, 0.3];
    const sdl = Math.hypot(sd[0], sd[1], sd[2]) || 1;
    this.sunDirection = [sd[0] / sdl, sd[1] / sdl, sd[2] / sdl]; // points TOWARD the sun
    this.sunColor = options.sunColor ?? [1.0, 0.95, 0.85];
    this.sunIntensity = options.sunIntensity ?? 2.2;
    this.ambientColor = options.ambientColor ?? [0.45, 0.55, 0.75];
    this.ambientIntensity = options.ambientIntensity ?? 0.6;

    // CPU state
    this._u = new Float32Array(68); // 272 bytes
    this._prevVP = new Float32Array(16);
    this._hasPrev = false;
    this._wind = [0, 0];
    this._frame = 0;
    this._lastTime = performance.now();
    this._historyIdx = 0; // which accum tex is the READ side this frame
    this._depthView = null;
    this._marchBG = null;

    this.sampler = device.createSampler({
      label: 'CloudsVolumetric.sampler',
      magFilter: 'linear', minFilter: 'linear',
      addressModeU: 'repeat', addressModeV: 'repeat', addressModeW: 'repeat',
    });
    this.uniformBuffer = device.createBuffer({
      label: 'CloudsVolumetric.uniform',
      size: 272,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    this._marchPassDesc = {
      label: 'clouds-march',
      colorAttachments: [{view: null, loadOp: 'clear', storeOp: 'store', clearValue: {r: 0, g: 0, b: 0, a: 0}}]
    };
    this._temporalPassDesc = {
      label: 'clouds-temporal',
      colorAttachments: [{view: null, loadOp: 'clear', storeOp: 'store', clearValue: {r: 0, g: 0, b: 0, a: 0}}]
    };
    this._compositePassDesc = {
      label: 'clouds-composite',
      colorAttachments: [{view: null, loadOp: 'clear', storeOp: 'store', clearValue: {r: 0, g: 0, b: 0, a: 0}}]
    };

    this._createNoiseTextures();
    this._createTargets();
    this._createPipelines();
    this._buildStaticBindGroups();
    this.setCompositeInput(sceneView);
  }

  init() {return this;}

  // ───────────────────────── setters ─────────────────────────
  setCoverage = (v) => {this.params.coverage = Math.max(0, Math.min(0.98, v));}
  setDensity = (v) => {this.params.density = v;}
  setCloudLayer = (base, thickness) => {this.params.cloudBase = base; this.params.cloudThickness = Math.max(1, thickness);}
  setSunDirection = (x, y, z) => {
    const l = Math.hypot(x, y, z) || 1;
    this.sunDirection = [x / l, y / l, z / l];
  }
  setSunColor = (r, g, b, intensity) => {
    this.sunColor = [r, g, b];
    if(intensity !== undefined) this.sunIntensity = intensity;
  }
  setAmbientColor = (r, g, b, intensity) => {
    this.ambientColor = [r, g, b];
    if(intensity !== undefined) this.ambientIntensity = intensity;
  }
  setWind = (speed, dx, dz) => {
    this.params.windSpeed = speed;
    if(dx !== undefined) this.params.windDir = [dx, dz ?? 0];
  }
  setSteps = (view, light) => {
    this.params.viewSteps = Math.max(4, view | 0);
    if(light !== undefined) this.params.lightSteps = Math.max(1, light | 0);
  }
  setMaxDistance = (v) => {this.params.maxDistance = Math.max(10, v);}
  setNoiseScale = (shape, detail) => {
    this.params.shapeScale = shape;
    if(detail !== undefined) this.params.detailScale = detail;
  }
  setDetailAmount = (v) => {this.params.detailAmount = Math.max(0, Math.min(1, v));}
  setPhaseG = (v) => {this.params.phaseG = Math.max(0, Math.min(0.95, v));}
  setTemporal = (v) => {this.params.temporal = !!v; this._hasPrev = false;}
  setTemporalBlend = (v) => {this.params.temporalBlend = Math.max(0, Math.min(0.98, v));}
  setQualityScale(scale) {
    this.qualityScale = Math.max(0.25, Math.min(1.0, scale));
    this.resize(this.width, this.height);
  }

  getOutputView() {return this.compositeOutputTexView;}

  _detectMobileDevice() {
    if(typeof navigator === 'undefined') return false;
    return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test((navigator.userAgent || '').toLowerCase());
  }

  // ───────────────────────── resources ─────────────────────────
  _createNoiseTextures() {
    const d = this.device;
    this.shapeTex = d.createTexture({
      label: 'CloudsVolumetric.shape64', dimension: '3d', size: [64, 64, 64], format: 'rgba8unorm',
      usage: GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.TEXTURE_BINDING,
    });
    this.detailTex = d.createTexture({
      label: 'CloudsVolumetric.detail32', dimension: '3d', size: [32, 32, 32], format: 'rgba8unorm',
      usage: GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.TEXTURE_BINDING,
    });
    this.shapeView = this.shapeTex.createView({dimension: '3d'});
    this.detailView = this.detailTex.createView({dimension: '3d'});

    const module = d.createShaderModule({label: 'CloudsVolumetric.noiseGen', code: noiseGenWGSL()});
    const mk = (entryPoint) => d.createComputePipeline({
      label: 'CloudsVolumetric.' + entryPoint, layout: 'auto', compute: {module, entryPoint}
    });
    const shapePipe = mk('shape');
    const detailPipe = mk('detail');
    const shapeBG = d.createBindGroup({layout: shapePipe.getBindGroupLayout(0), entries: [{binding: 0, resource: this.shapeView}]});
    const detailBG = d.createBindGroup({layout: detailPipe.getBindGroupLayout(0), entries: [{binding: 0, resource: this.detailView}]});

    const enc = d.createCommandEncoder({label: 'CloudsVolumetric.noiseGenEncoder'});
    const pass = enc.beginComputePass({label: 'clouds-noise-gen'});
    pass.setPipeline(shapePipe);
    pass.setBindGroup(0, shapeBG);
    pass.dispatchWorkgroups(16, 16, 16); // 64 / 4
    pass.setPipeline(detailPipe);
    pass.setBindGroup(0, detailBG);
    pass.dispatchWorkgroups(8, 8, 8);    // 32 / 4
    pass.end();
    d.queue.submit([enc.finish()]);
  }

  _tex(w, h, label) {
    return this.device.createTexture({
      label, size: [w, h], format: 'rgba16float',
      usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
    });
  }

  _createTargets() {
    this.lowW = Math.max(1, Math.ceil(this.width * this.qualityScale));
    this.lowH = Math.max(1, Math.ceil(this.height * this.qualityScale));
    this.marchTex = this._tex(this.lowW, this.lowH, 'CloudsVolumetric.march');
    this.marchView = this.marchTex.createView();
    this.accumTex = [
      this._tex(this.lowW, this.lowH, 'CloudsVolumetric.accumA'),
      this._tex(this.lowW, this.lowH, 'CloudsVolumetric.accumB'),
    ];
    this.accumView = [this.accumTex[0].createView(), this.accumTex[1].createView()];
    this.compositeOutputTex = this._tex(this.width, this.height, 'CloudsVolumetric.compositeOut');
    this.compositeOutputTexView = this.compositeOutputTex.createView();
    this._hasPrev = false;
  }

  _createPipelines() {
    const d = this.device;
    const F = GPUShaderStage.FRAGMENT;
    const marchBGL = d.createBindGroupLayout({
      label: 'CloudsVolumetric.marchBGL',
      entries: [
        {binding: 0, visibility: F, buffer: {type: 'uniform'}},
        {binding: 1, visibility: F, texture: {sampleType: 'depth'}},
        {binding: 2, visibility: F, texture: {sampleType: 'float', viewDimension: '3d'}},
        {binding: 3, visibility: F, texture: {sampleType: 'float', viewDimension: '3d'}},
        {binding: 4, visibility: F, sampler: {type: 'filtering'}},
      ]
    });
    // shared by temporal + composite: uniform, texA, texB, sampler
    const postBGL = d.createBindGroupLayout({
      label: 'CloudsVolumetric.postBGL',
      entries: [
        {binding: 0, visibility: F, buffer: {type: 'uniform'}},
        {binding: 1, visibility: F, texture: {sampleType: 'float'}},
        {binding: 2, visibility: F, texture: {sampleType: 'float'}},
        {binding: 3, visibility: F, sampler: {type: 'filtering'}},
      ]
    });
    this._marchBGL = marchBGL;
    this._postBGL = postBGL;
    const vertModule = d.createShaderModule({label: 'CloudsVolumetric.vert', code: fullscreenVertWGSL()});
    const make = (label, bgl, code) => d.createRenderPipeline({
      label,
      layout: d.createPipelineLayout({bindGroupLayouts: [bgl]}),
      vertex: {module: vertModule, entryPoint: 'vert'},
      fragment: {
        module: d.createShaderModule({label: label + '.frag', code}),
        entryPoint: 'main',
        targets: [{format: 'rgba16float'}]
      },
      primitive: {topology: 'triangle-list'}
    });
    this.marchPipeline = make('CloudsVolumetric.march', marchBGL, marchFragWGSL());
    this.temporalPipeline = make('CloudsVolumetric.temporal', postBGL, temporalFragWGSL());
    this.compositePipeline = make('CloudsVolumetric.composite', postBGL, compositeFragWGSL());
  }

  _buildStaticBindGroups() {
    const d = this.device;
    const ub = {buffer: this.uniformBuffer};
    // temporal: reads (march, accum[i]) writes accum[1-i]
    this._temporalBG = [0, 1].map(i => d.createBindGroup({
      label: 'CloudsVolumetric.temporalBG' + i,
      layout: this._postBGL,
      entries: [
        {binding: 0, resource: ub},
        {binding: 1, resource: this.marchView},
        {binding: 2, resource: this.accumView[i]},
        {binding: 3, resource: this.sampler},
      ]
    }));
    this._marchBG = null; // depth view dependent, built lazily
  }

  /** Scene color that the clouds are composited over (sceneTextureView or volumetric output). */
  setCompositeInput(sceneView) {
    this._sceneView = sceneView;
    const d = this.device;
    const ub = {buffer: this.uniformBuffer};
    // composite reads (scene, cloud result). Cloud result is accum[w] (temporal) or march tex (no temporal).
    this._compositeBG = [
      d.createBindGroup({layout: this._postBGL, entries: [
        {binding: 0, resource: ub}, {binding: 1, resource: sceneView},
        {binding: 2, resource: this.accumView[0]}, {binding: 3, resource: this.sampler}]}),
      d.createBindGroup({layout: this._postBGL, entries: [
        {binding: 0, resource: ub}, {binding: 1, resource: sceneView},
        {binding: 2, resource: this.accumView[1]}, {binding: 3, resource: this.sampler}]}),
      d.createBindGroup({layout: this._postBGL, entries: [
        {binding: 0, resource: ub}, {binding: 1, resource: sceneView},
        {binding: 2, resource: this.marchView}, {binding: 3, resource: this.sampler}]}),
    ];
  }

  _setMarchInputs(depthView) {
    if(this._depthView === depthView && this._marchBG) return;
    this._depthView = depthView;
    this._marchBG = this.device.createBindGroup({
      label: 'CloudsVolumetric.marchBG',
      layout: this._marchBGL,
      entries: [
        {binding: 0, resource: {buffer: this.uniformBuffer}},
        {binding: 1, resource: depthView},
        {binding: 2, resource: this.shapeView},
        {binding: 3, resource: this.detailView},
        {binding: 4, resource: this.sampler},
      ]
    });
  }

  _writeUniforms(light , camera) {
    const u = this._u, p = this.params;
    const now = performance.now();
    const dt = Math.min(0.1, (now - this._lastTime) * 0.001);
    this._lastTime = now;
    const wl = Math.hypot(p.windDir[0], p.windDir[1]) || 1;
    this._wind[0] += (p.windDir[0] / wl) * p.windSpeed * dt;
    this._wind[1] += (p.windDir[1] / wl) * p.windSpeed * dt;

    u.set(camera.invViewProjectionMatrix, 0);
    u.set(this._hasPrev ? this._prevVP : light.viewProjectionMatrix, 16);
    u[32] = this.sunDirection[0]; u[33] = this.sunDirection[1]; u[34] = this.sunDirection[2]; u[35] = 0;
    u[36] = this.sunColor[0] * this.sunIntensity;
    u[37] = this.sunColor[1] * this.sunIntensity;
    u[38] = this.sunColor[2] * this.sunIntensity;
    u[39] = p.phaseG;
    u[40] = this.ambientColor[0] * this.ambientIntensity;
    u[41] = this.ambientColor[1] * this.ambientIntensity;
    u[42] = this.ambientColor[2] * this.ambientIntensity;
    u[43] = 0;
    u[44] = p.cloudBase; u[45] = p.cloudThickness; u[46] = p.coverage; u[47] = p.density;
    u[48] = p.shapeScale; u[49] = p.detailScale; u[50] = p.detailAmount; u[51] = now * 0.001;
    u[52] = this._wind[0]; u[53] = 0; u[54] = this._wind[1]; u[55] = 0;
    u[56] = p.viewSteps; u[57] = p.lightSteps; u[58] = p.maxDistance; u[59] = this._frame % 64;
    u[60] = p.temporalBlend;
    u[61] = p.temporal ? 1 : 0;
    u[62] = this._hasPrev ? 1 : 0;
    u[63] = 0;
    u[64] = this.width; u[65] = this.height; u[66] = this.lowW; u[67] = this.lowH;
    this.device.queue.writeBuffer(this.uniformBuffer, 0, u);
    this._prevVP.set(light.viewProjectionMatrix);
  }

  /**
   * @param {GPUCommandEncoder} encoder
   * @param {GPUTextureView} depthView  main depth view (depth24plus)
   * @param {{invViewProjectionMatrix: Float32Array, viewProjectionMatrix: Float32Array}} camera
   */
  render(encoder, sceneView = null,  depthView, shadowArrayView = null,  camera, light) {
    //  render(encoder, sceneView, depthView, shadowArrayView, camera, light) {
    this._setMarchInputs(depthView);
    this._writeUniforms(light, camera);
    {
      this._marchPassDesc.colorAttachments[0].view = this.marchView;
      const pass = encoder.beginRenderPass(this._marchPassDesc);
      pass.setPipeline(this.marchPipeline);
      pass.setBindGroup(0, this._marchBG);
      pass.draw(6);
      pass.end();
    }

    let compositeBG;
    if(this.params.temporal) {
      const r = this._historyIdx, w = 1 - r;
      this._temporalPassDesc.colorAttachments[0].view = this.accumView[w];
      const pass = encoder.beginRenderPass(this._temporalPassDesc);
      pass.setPipeline(this.temporalPipeline);
      pass.setBindGroup(0, this._temporalBG[r]);
      pass.draw(6);
      pass.end();
      compositeBG = this._compositeBG[w];
      this._historyIdx = w;
    } else {
      compositeBG = this._compositeBG[2];
    }

    {
      this._compositePassDesc.colorAttachments[0].view = this.compositeOutputTexView;
      const pass = encoder.beginRenderPass(this._compositePassDesc);
      pass.setPipeline(this.compositePipeline);
      pass.setBindGroup(0, compositeBG);
      pass.draw(6);
      pass.end();
    }
    this._hasPrev = true;
    this._frame++;
  }

  resize(width, height) {
    this.width = width;
    this.height = height;
    this._createTargets();
    this._buildStaticBindGroups();
    this.setCompositeInput(this._sceneView);
    this._historyIdx = 0;
  }
}

// ═══════════════════════════ WGSL ═══════════════════════════

export function fullscreenVertWGSL() {
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

const PARAMS_WGSL = `
struct P {
  invViewProj: mat4x4<f32>,
  prevViewProj: mat4x4<f32>,
  sunDir: vec4<f32>,     // xyz toward sun
  sunColor: vec4<f32>,   // rgb * intensity, w = phase g
  ambient: vec4<f32>,    // rgb * intensity
  cloud: vec4<f32>,      // base, thickness, coverage, density
  noise: vec4<f32>,      // shapeScale, detailScale, detailAmount, time(s)
  wind: vec4<f32>,       // offset x, 0, offset z, _
  march: vec4<f32>,      // viewSteps, lightSteps, maxDist, frame
  misc: vec4<f32>,       // temporalBlend, useTemporal, hasHistory, _
  res: vec4<f32>,        // fullW, fullH, lowW, lowH
};
@group(0) @binding(0) var<uniform> u: P;

fn worldPos(uv: vec2<f32>, depth: f32) -> vec3<f32> {
  let ndc = vec4(uv.x * 2.0 - 1.0, (1.0 - uv.y) * 2.0 - 1.0, depth, 1.0);
  let w = u.invViewProj * ndc;
  return w.xyz / w.w;
}
`;

function noiseGenWGSL() {
  return `
@group(0) @binding(0) var outTex: texture_storage_3d<rgba8unorm, write>;

fn pcg3d(vin: vec3<u32>) -> vec3<u32> {
  var v = vin * 1664525u + vec3<u32>(1013904223u);
  v.x += v.y * v.z; v.y += v.z * v.x; v.z += v.x * v.y;
  v = v ^ (v >> vec3<u32>(16u));
  v.x += v.y * v.z; v.y += v.z * v.x; v.z += v.x * v.y;
  return v;
}

fn hash3(c: vec3<i32>, seed: u32) -> vec3<f32> {
  let h = pcg3d(vec3<u32>(c) + vec3<u32>(seed * 977u, seed * 7919u, seed * 104729u));
  return vec3<f32>(h) * (1.0 / 4294967295.0);
}

fn wrapi(c: vec3<i32>, f: i32) -> vec3<i32> {
  let ff = vec3<i32>(f);
  return ((c % ff) + ff) % ff;
}

// tileable Worley, returns 1 - nearestDistance (billowy cells)
fn worley(p: vec3<f32>, freq: i32, seed: u32) -> f32 {
  let q = p * f32(freq);
  let ic = vec3<i32>(floor(q));
  let fc = fract(q);
  var d = 1e9;
  for (var z = -1; z <= 1; z++) {
    for (var y = -1; y <= 1; y++) {
      for (var x = -1; x <= 1; x++) {
        let n = vec3<i32>(x, y, z);
        let feat = hash3(wrapi(ic + n, freq), seed);
        let diff = vec3<f32>(n) + feat - fc;
        d = min(d, dot(diff, diff));
      }
    }
  }
  return 1.0 - clamp(sqrt(d), 0.0, 1.0);
}

fn corner(i: vec3<i32>, o: vec3<i32>, freq: i32, seed: u32) -> f32 {
  return hash3(wrapi(i + o, freq), seed).x;
}

// tileable value noise
fn vnoise(p: vec3<f32>, freq: i32, seed: u32) -> f32 {
  let q = p * f32(freq);
  let i = vec3<i32>(floor(q));
  let f = fract(q);
  let s = f * f * (3.0 - 2.0 * f);
  let c000 = corner(i, vec3<i32>(0, 0, 0), freq, seed);
  let c100 = corner(i, vec3<i32>(1, 0, 0), freq, seed);
  let c010 = corner(i, vec3<i32>(0, 1, 0), freq, seed);
  let c110 = corner(i, vec3<i32>(1, 1, 0), freq, seed);
  let c001 = corner(i, vec3<i32>(0, 0, 1), freq, seed);
  let c101 = corner(i, vec3<i32>(1, 0, 1), freq, seed);
  let c011 = corner(i, vec3<i32>(0, 1, 1), freq, seed);
  let c111 = corner(i, vec3<i32>(1, 1, 1), freq, seed);
  let x00 = mix(c000, c100, s.x);
  let x10 = mix(c010, c110, s.x);
  let x01 = mix(c001, c101, s.x);
  let x11 = mix(c011, c111, s.x);
  return mix(mix(x00, x10, s.y), mix(x01, x11, s.y), s.z);
}

// R: value-noise dilated by Worley fbm ("Perlin-Worley" style), GBA: Worley fbm octaves
@compute @workgroup_size(4, 4, 4)
fn shape(@builtin(global_invocation_id) id: vec3<u32>) {
  let dim = textureDimensions(outTex);
  if (any(id >= dim)) { return; }
  let p = (vec3<f32>(id) + 0.5) / vec3<f32>(dim);
  let g = worley(p, 4, 1u);
  let b = worley(p, 8, 2u);
  let a = worley(p, 16, 3u);
  let wf = g * 0.625 + b * 0.25 + a * 0.125;
  let vn = vnoise(p, 4, 11u) * 0.65 + vnoise(p, 8, 12u) * 0.35;
  let r = wf + vn * (1.0 - wf);
  textureStore(outTex, id, vec4<f32>(r, g, b, a));
}

// RGB: Worley octaves used to erode the base shape
@compute @workgroup_size(4, 4, 4)
fn detail(@builtin(global_invocation_id) id: vec3<u32>) {
  let dim = textureDimensions(outTex);
  if (any(id >= dim)) { return; }
  let p = (vec3<f32>(id) + 0.5) / vec3<f32>(dim);
  let r = worley(p, 4, 21u);
  let g = worley(p, 8, 22u);
  let b = worley(p, 16, 23u);
  textureStore(outTex, id, vec4<f32>(r, g, b, 1.0));
}
`;
}

function marchFragWGSL() {
  return `
${PARAMS_WGSL}
@group(0) @binding(1) var depthTex: texture_depth_2d;
@group(0) @binding(2) var shapeTex: texture_3d<f32>;
@group(0) @binding(3) var detailTex: texture_3d<f32>;
@group(0) @binding(4) var samp: sampler;

const PI = 3.14159265;

fn remap(v: f32, a: f32, b: f32, c: f32, d: f32) -> f32 {
  return c + (v - a) / (b - a) * (d - c);
}

fn hg(c: f32, g: f32) -> f32 {
  let g2 = g * g;
  return (1.0 - g2) / (4.0 * PI * pow(max(1.0 + g2 - 2.0 * g * c, 1e-3), 1.5));
}

fn cloudDensity(p: vec3<f32>, h: f32, withDetail: bool) -> f32 {
  let pos = p + u.wind.xyz;
  let sh = textureSampleLevel(shapeTex, samp, pos * u.noise.x, 0.0);
  let lowFbm = sh.g * 0.625 + sh.b * 0.25 + sh.a * 0.125;
  var d = remap(sh.r, -(1.0 - lowFbm), 1.0, 0.0, 1.0);
  // rounded bottom, tapering top
  let grad = clamp(remap(h, 0.0, 0.12, 0.0, 1.0), 0.0, 1.0) * clamp(remap(h, 0.55, 1.0, 1.0, 0.0), 0.0, 1.0);
  d = d * grad;
  let cov = clamp(u.cloud.z, 0.0, 0.98);
  d = clamp(remap(d, 1.0 - cov, 1.0, 0.0, 1.0), 0.0, 1.0) * cov;
  if (withDetail && d > 0.0) {
    let dt = textureSampleLevel(detailTex, samp, pos * u.noise.y, 0.0);
    let dfbm = dt.r * 0.625 + dt.g * 0.25 + dt.b * 0.125;
    let erode = mix(dfbm, 1.0 - dfbm, clamp(h * 10.0, 0.0, 1.0));
    d = clamp(remap(d, erode * u.noise.z, 1.0, 0.0, 1.0), 0.0, 1.0);
  }
  return d * u.cloud.w;
}

fn lightOpticalDepth(p: vec3<f32>) -> f32 {
  let n = max(i32(u.march.y), 1);
  let sd = u.sunDir.xyz;
  let top = u.cloud.x + u.cloud.y;
  var len = u.cloud.y * 1.5;
  if (sd.y > 0.05) { len = min(len, (top - p.y) / sd.y); }
  let stepL = len / f32(n);
  var tau = 0.0;
  for (var i = 0; i < n; i++) {
    let q = p + sd * ((f32(i) + 0.5) * stepL);
    let h = (q.y - u.cloud.x) / u.cloud.y;
    if (h < 0.0 || h > 1.0) { continue; }
    tau += cloudDensity(q, h, false) * stepL;
  }
  return tau;
}

fn ign(px: vec2<f32>, frame: f32) -> f32 {
  let q = px + frame * 5.588238;
  return fract(52.9829189 * fract(dot(q, vec2<f32>(0.06711056, 0.00583715))));
}

@fragment
fn main(@builtin(position) fc: vec4<f32>) -> @location(0) vec4<f32> {
  let uv = fc.xy / u.res.zw;
  let fullDim = vec2<i32>(u.res.xy);
  let dpx = clamp(vec2<i32>(uv * u.res.xy), vec2<i32>(0), fullDim - vec2<i32>(1));
  let depth = textureLoad(depthTex, dpx, 0);

  let ro = worldPos(uv, 0.0);
  let dir = normalize(worldPos(uv, 1.0) - ro);

  var sceneDist = 1e9;
  if (depth < 1.0) { sceneDist = length(worldPos(uv, depth) - ro); }

  let base = u.cloud.x;
  let top = u.cloud.x + u.cloud.y;
  if (abs(dir.y) < 1e-4) { return vec4<f32>(0.0); }
  let t0 = (base - ro.y) / dir.y;
  let t1 = (top - ro.y) / dir.y;
  let tmin = max(min(t0, t1), 0.0);
  let tmax = min(min(max(t0, t1), sceneDist), u.march.z);
  if (tmax <= tmin) { return vec4<f32>(0.0); }

  let steps = max(i32(u.march.x), 4);
  let stepLen = (tmax - tmin) / f32(steps);
  let jitter = ign(fc.xy, u.march.w);

  let cosA = dot(dir, u.sunDir.xyz);
  // three scattering octaves (Wrenninge): extinction a^i, contribution b^i, anisotropy g*c^i
  let g0 = u.sunColor.w;
  let ph0 = 4.0 * PI * hg(cosA, g0);
  let ph1 = 4.0 * PI * hg(cosA, g0 * 0.5);
  let ph2 = 4.0 * PI * hg(cosA, g0 * 0.25);

  var T = 1.0;
  var L = vec3<f32>(0.0);
  for (var i = 0; i < steps; i++) {
    let t = tmin + (f32(i) + jitter) * stepLen;
    let p = ro + dir * t;
    let h = (p.y - base) / u.cloud.y;
    let dens = cloudDensity(p, h, true);
    if (dens > 0.0005) {
      let tau = lightOpticalDepth(p);
      let e = (exp(-tau) * ph0 + 0.5 * exp(-tau * 0.5) * ph1 + 0.25 * exp(-tau * 0.25) * ph2) * 0.5714;
      let lighting = u.sunColor.rgb * e + u.ambient.rgb * mix(0.4, 1.0, clamp(h, 0.0, 1.0));
      let ext = exp(-dens * stepLen);
      L += T * lighting * (1.0 - ext);
      T *= ext;
      if (T < 0.02) { break; }
    }
  }

  let fade = 1.0 - smoothstep(0.5 * u.march.z, u.march.z, tmin);
  return vec4<f32>(L * fade, (1.0 - T) * fade);
}
`;
}

function temporalFragWGSL() {
  return `
${PARAMS_WGSL}
@group(0) @binding(1) var curTex: texture_2d<f32>;
@group(0) @binding(2) var histTex: texture_2d<f32>;
@group(0) @binding(3) var samp: sampler;

@fragment
fn main(@builtin(position) fc: vec4<f32>) -> @location(0) vec4<f32> {
  let ip = vec2<i32>(fc.xy);
  let dim = vec2<i32>(textureDimensions(curTex));
  let cur = textureLoad(curTex, ip, 0);
  if (u.misc.y < 0.5 || u.misc.z < 0.5) { return cur; }

  var mn = cur;
  var mx = cur;
  for (var dy = -1; dy <= 1; dy++) {
    for (var dx = -1; dx <= 1; dx++) {
      let c = textureLoad(curTex, clamp(ip + vec2<i32>(dx, dy), vec2<i32>(0), dim - vec2<i32>(1)), 0);
      mn = min(mn, c);
      mx = max(mx, c);
    }
  }

  let uv = fc.xy / vec2<f32>(dim);
  let dir = normalize(worldPos(uv, 1.0) - worldPos(uv, 0.0));
  // clouds are far away: reproject by rotation only (w = 0), ignore camera translation
  let pc = u.prevViewProj * vec4<f32>(dir, 0.0);
  if (pc.w <= 0.0) { return cur; }
  let nd = pc.xy / pc.w;
  let puv = vec2<f32>(nd.x * 0.5 + 0.5, 0.5 - nd.y * 0.5);
  if (puv.x < 0.0 || puv.y < 0.0 || puv.x > 1.0 || puv.y > 1.0) { return cur; }

  let hist = clamp(textureSampleLevel(histTex, samp, puv, 0.0), mn, mx);
  return mix(cur, hist, u.misc.x);
}
`;
}

function compositeFragWGSL() {
  return `
${PARAMS_WGSL}
@group(0) @binding(1) var sceneTex: texture_2d<f32>;
@group(0) @binding(2) var cloudTex: texture_2d<f32>;
@group(0) @binding(3) var samp: sampler;

@fragment
fn main(@builtin(position) fc: vec4<f32>) -> @location(0) vec4<f32> {
  let uv = fc.xy / vec2<f32>(textureDimensions(sceneTex));
  let scene = textureSampleLevel(sceneTex, samp, uv, 0.0);
  let cl = textureSampleLevel(cloudTex, samp, uv, 0.0);
  // cl.rgb = in-scattered light (already weighted by transmittance), cl.a = opacity
  return vec4<f32>(scene.rgb * (1.0 - cl.a) + cl.rgb, scene.a);
}
`;
}