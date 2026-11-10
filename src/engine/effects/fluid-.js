/**
 * FluidEffect for matrix-engine-wgpu
 * WebGPU compute port of PavelDoGreat/WebGL-Fluid-Simulation (Stable Fluids, Jos Stam).
 *
 * Pipeline per frame (all in simulate(), before the main render pass):
 *   splats -> curl -> vorticity -> divergence -> pressure decay -> jacobi x N
 *          -> gradient subtract -> advect velocity -> advect dye
 * Display quad is drawn inside the main pass in render().
 *
 * Usage:
 *   mesh.effects.fluid = new FluidEffect(app.device, {simRes: 128, dyeRes: 512});
 *   mesh.effects.fluid.splat(0.5, 0.5, 0.3, 0.2, [1, 0.2, 0.1]);   // x,y in 0..1 (y up)
 *   mesh.effects.fluid.attachPointer(app.canvas);                   // optional mouse/touch
 *   dispatchEvent(new CustomEvent('update-effects'));
 *
 * Mesh should be a plane facing the camera (local quad is -1..1 in X/Y).
 */
import {mat4} from "wgpu-matrix";

const MAX_SPLATS = 8;
const WG = 8;

const COMMON_WGSL = /* wgsl */`
fn ci(c: vec2<i32>, d: vec2<i32>) -> vec2<i32> {
  return clamp(c, vec2<i32>(0, 0), d - vec2<i32>(1, 1));
}
`;

const ADVECT_WGSL = COMMON_WGSL + /* wgsl */`
@group(0) @binding(0) var<uniform> u: vec4<f32>; // x: dt, y: dissipation
@group(0) @binding(1) var velTex: texture_2d<f32>;
@group(0) @binding(2) var srcTex: texture_2d<f32>;
@group(0) @binding(3) var dst: texture_storage_2d<rgba16float, write>;
@group(0) @binding(4) var samp: sampler;

@compute @workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) id: vec3<u32>) {
  let dd = textureDimensions(dst);
  if (id.x >= dd.x || id.y >= dd.y) { return; }
  let uv = (vec2<f32>(id.xy) + 0.5) / vec2<f32>(dd);
  let velTexel = 1.0 / vec2<f32>(textureDimensions(velTex));
  let v = textureSampleLevel(velTex, samp, uv, 0.0).xy;
  let coord = uv - u.x * v * velTexel;
  let r = textureSampleLevel(srcTex, samp, coord, 0.0) / (1.0 + u.y * u.x);
  textureStore(dst, vec2<i32>(id.xy), r);
}`;

const CURL_WGSL = COMMON_WGSL + /* wgsl */`
@group(0) @binding(0) var vel: texture_2d<f32>;
@group(0) @binding(1) var dst: texture_storage_2d<rgba16float, write>;

@compute @workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) id: vec3<u32>) {
  let d = vec2<i32>(textureDimensions(vel));
  let c = vec2<i32>(id.xy);
  if (c.x >= d.x || c.y >= d.y) { return; }
  let L = textureLoad(vel, ci(c + vec2<i32>(-1, 0), d), 0).y;
  let R = textureLoad(vel, ci(c + vec2<i32>(1, 0), d), 0).y;
  let T = textureLoad(vel, ci(c + vec2<i32>(0, 1), d), 0).x;
  let B = textureLoad(vel, ci(c + vec2<i32>(0, -1), d), 0).x;
  textureStore(dst, c, vec4<f32>(0.5 * (R - L - T + B), 0.0, 0.0, 1.0));
}`;

const VORTICITY_WGSL = COMMON_WGSL + /* wgsl */`
@group(0) @binding(0) var<uniform> u: vec4<f32>; // x: curl strength, y: dt
@group(0) @binding(1) var vel: texture_2d<f32>;
@group(0) @binding(2) var curlTex: texture_2d<f32>;
@group(0) @binding(3) var dst: texture_storage_2d<rgba16float, write>;

@compute @workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) id: vec3<u32>) {
  let d = vec2<i32>(textureDimensions(vel));
  let c = vec2<i32>(id.xy);
  if (c.x >= d.x || c.y >= d.y) { return; }
  let L = textureLoad(curlTex, ci(c + vec2<i32>(-1, 0), d), 0).x;
  let R = textureLoad(curlTex, ci(c + vec2<i32>(1, 0), d), 0).x;
  let T = textureLoad(curlTex, ci(c + vec2<i32>(0, 1), d), 0).x;
  let B = textureLoad(curlTex, ci(c + vec2<i32>(0, -1), d), 0).x;
  let C = textureLoad(curlTex, c, 0).x;
  var force = 0.5 * vec2<f32>(abs(T) - abs(B), abs(R) - abs(L));
  force = force / (length(force) + 0.0001);
  force = force * u.x * C;
  force.y = -force.y;
  var v = textureLoad(vel, c, 0).xy + force * u.y;
  v = clamp(v, vec2<f32>(-1000.0), vec2<f32>(1000.0));
  textureStore(dst, c, vec4<f32>(v, 0.0, 1.0));
}`;

const DIVERGENCE_WGSL = COMMON_WGSL + /* wgsl */`
@group(0) @binding(0) var vel: texture_2d<f32>;
@group(0) @binding(1) var dst: texture_storage_2d<rgba16float, write>;

@compute @workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) id: vec3<u32>) {
  let d = vec2<i32>(textureDimensions(vel));
  let c = vec2<i32>(id.xy);
  if (c.x >= d.x || c.y >= d.y) { return; }
  let C = textureLoad(vel, c, 0).xy;
  var L = textureLoad(vel, ci(c + vec2<i32>(-1, 0), d), 0).x;
  var R = textureLoad(vel, ci(c + vec2<i32>(1, 0), d), 0).x;
  var T = textureLoad(vel, ci(c + vec2<i32>(0, 1), d), 0).y;
  var B = textureLoad(vel, ci(c + vec2<i32>(0, -1), d), 0).y;
  // reflective walls
  if (c.x - 1 < 0)   { L = -C.x; }
  if (c.x + 1 >= d.x) { R = -C.x; }
  if (c.y + 1 >= d.y) { T = -C.y; }
  if (c.y - 1 < 0)   { B = -C.y; }
  textureStore(dst, c, vec4<f32>(0.5 * (R - L + T - B), 0.0, 0.0, 1.0));
}`;

const SCALE_WGSL = /* wgsl */`
@group(0) @binding(0) var<uniform> u: vec4<f32>; // x: factor
@group(0) @binding(1) var src: texture_2d<f32>;
@group(0) @binding(2) var dst: texture_storage_2d<rgba16float, write>;

@compute @workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) id: vec3<u32>) {
  let d = textureDimensions(src);
  if (id.x >= d.x || id.y >= d.y) { return; }
  let c = vec2<i32>(id.xy);
  textureStore(dst, c, textureLoad(src, c, 0) * u.x);
}`;

const PRESSURE_WGSL = COMMON_WGSL + /* wgsl */`
@group(0) @binding(0) var pres: texture_2d<f32>;
@group(0) @binding(1) var divTex: texture_2d<f32>;
@group(0) @binding(2) var dst: texture_storage_2d<rgba16float, write>;

@compute @workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) id: vec3<u32>) {
  let d = vec2<i32>(textureDimensions(pres));
  let c = vec2<i32>(id.xy);
  if (c.x >= d.x || c.y >= d.y) { return; }
  let L = textureLoad(pres, ci(c + vec2<i32>(-1, 0), d), 0).x;
  let R = textureLoad(pres, ci(c + vec2<i32>(1, 0), d), 0).x;
  let T = textureLoad(pres, ci(c + vec2<i32>(0, 1), d), 0).x;
  let B = textureLoad(pres, ci(c + vec2<i32>(0, -1), d), 0).x;
  let div = textureLoad(divTex, c, 0).x;
  textureStore(dst, c, vec4<f32>((L + R + B + T - div) * 0.25, 0.0, 0.0, 1.0));
}`;

const GRADIENT_WGSL = COMMON_WGSL + /* wgsl */`
@group(0) @binding(0) var pres: texture_2d<f32>;
@group(0) @binding(1) var vel: texture_2d<f32>;
@group(0) @binding(2) var dst: texture_storage_2d<rgba16float, write>;

@compute @workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) id: vec3<u32>) {
  let d = vec2<i32>(textureDimensions(vel));
  let c = vec2<i32>(id.xy);
  if (c.x >= d.x || c.y >= d.y) { return; }
  let L = textureLoad(pres, ci(c + vec2<i32>(-1, 0), d), 0).x;
  let R = textureLoad(pres, ci(c + vec2<i32>(1, 0), d), 0).x;
  let T = textureLoad(pres, ci(c + vec2<i32>(0, 1), d), 0).x;
  let B = textureLoad(pres, ci(c + vec2<i32>(0, -1), d), 0).x;
  let v = textureLoad(vel, c, 0).xy - vec2<f32>(R - L, T - B);
  textureStore(dst, c, vec4<f32>(v, 0.0, 1.0));
}`;

const SPLAT_WGSL = /* wgsl */`
struct Splat {
  point: vec2<f32>,
  aspect: f32,
  radius: f32,
  color: vec4<f32>,
};
@group(0) @binding(0) var<uniform> s: Splat;
@group(0) @binding(1) var src: texture_2d<f32>;
@group(0) @binding(2) var dst: texture_storage_2d<rgba16float, write>;

@compute @workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) id: vec3<u32>) {
  let d = textureDimensions(dst);
  if (id.x >= d.x || id.y >= d.y) { return; }
  let c = vec2<i32>(id.xy);
  let uv = (vec2<f32>(id.xy) + 0.5) / vec2<f32>(d);
  var p = uv - s.point;
  p.x = p.x * s.aspect;
  let g = exp(-dot(p, p) / s.radius) * s.color.rgb;
  let base = textureLoad(src, c, 0).rgb;
  textureStore(dst, c, vec4<f32>(base + g, 1.0));
}`;

const DISPLAY_WGSL = /* wgsl */`
@group(0) @binding(0) var<uniform> mvp: mat4x4<f32>;
@group(0) @binding(1) var dye: texture_2d<f32>;
@group(0) @binding(2) var samp: sampler;

struct VOut {
  @builtin(position) pos: vec4<f32>,
  @location(0) uv: vec2<f32>,
};

@vertex
fn vs(@builtin(vertex_index) i: u32) -> VOut {
  var q = array<vec2<f32>, 6>(
    vec2(-1.0, -1.0), vec2(1.0, -1.0), vec2(-1.0, 1.0),
    vec2(-1.0, 1.0), vec2(1.0, -1.0), vec2(1.0, 1.0));
  var o: VOut;
  o.pos = mvp * vec4<f32>(q[i], 0.0, 1.0);
  o.uv = q[i] * 0.5 + 0.5;   // texture row 0 == bottom, no flip needed
  return o;
}

struct FOut {
  @location(0) color: vec4<f32>,
  @location(1) normal: vec4<f32>,
  @location(2) wpos: vec4<f32>,
};

@fragment
fn fs(in: VOut) -> FOut {
  let c = max(textureSample(dye, samp, in.uv).rgb, vec3<f32>(0.0));
  let a = clamp(max(c.r, max(c.g, c.b)), 0.0, 1.0);
  var o: FOut;
  o.color = vec4<f32>(c, a);          // premultiplied-style
  o.normal = vec4<f32>(0.0);
  o.wpos = vec4<f32>(0.0);
  return o;
}`;

export class FluidEffect {
  // world.js checks this on the constructor: we draw with our own pipeline.
  static managesRenderPipeline = true;

  constructor(device, options = {}) {
    this.device = device;
    this.enabled = true;
    const mobile = typeof navigator !== 'undefined' && /android|iphone|ipad|ipod/i.test(navigator.userAgent);
    this.opt = {
      simRes: options.simRes ?? (mobile ? 96 : 128),
      dyeRes: options.dyeRes ?? (mobile ? 384 : 512),
      aspect: options.aspect ?? 1,
      densityDissipation: options.densityDissipation ?? 1.0,
      velocityDissipation: options.velocityDissipation ?? 0.2,
      pressure: options.pressure ?? 0.8,
      pressureIterations: options.pressureIterations ?? (mobile ? 12 : 20),
      curl: options.curl ?? 30,
      splatRadius: options.splatRadius ?? 0.25,
      splatForce: options.splatForce ?? 6000,
      colorFormatDepth: options.depthFormat ?? 'depth24plus',
      colorTargets: options.colorTargets ?? 3, // main pass has 3 color attachments
    };
    this.simW = this.opt.simRes;
    this.simH = this.opt.simRes;
    this.dyeW = this.opt.dyeRes;
    this.dyeH = this.opt.dyeRes;

    this._vi = 0; // velocity read index
    this._di = 0; // dye read index
    this._pi = 0; // pressure read index
    this._last = performance.now();
    this._pending = [];
    this._mvpScratch = mat4.create();
    this._model = mat4.identity();
    this._localMatrix = mat4.create();
    this._finalMatrix = mat4.identity();
    this.localOffset = options.localOffset ?? [0, 0, 0];
    this.localRotation = options.localRotation ?? [0, 0, 0];
    this.activeRotate = options.activeRotate ?? [0, 0, 0];
    const sc = options.scale ?? 1;
    this.scale = Array.isArray(sc) ? sc : [sc, sc, sc];
    this._f4 = new Float32Array(4);
    this._splatScratch = new Float32Array(8);
    this._time = 0;

    this._createResources();
    this._createPipelines();
    this._createBindGroups();
  }

  /** x,y in 0..1 (y up). dx,dy = movement delta (roughly -1..1). color = [r,g,b] */
  splat(x, y, dx, dy, color) {
    if (this._pending.length >= MAX_SPLATS) return;
    this._pending.push({x, y, dx, dy, color});
  }

  randomSplats(n = 5) {
    for (let i = 0; i < n; i++) {
      const c = FluidEffect.generateColor();
      c[0] *= 10; c[1] *= 10; c[2] *= 10;
      this.splat(Math.random(), Math.random(),
        1000 * (Math.random() - 0.5) / this.opt.splatForce * 6,
        1000 * (Math.random() - 0.5) / this.opt.splatForce * 6, c);
    }
  }

  /** Mouse / touch over a canvas that fully covers the fluid plane (fullscreen use). */
  attachPointer(canvas) {
    let lx = 0, ly = 0, down = false;
    const pos = (e) => {
      const r = canvas.getBoundingClientRect();
      return [(e.clientX - r.left) / r.width, 1 - (e.clientY - r.top) / r.height];
    };
    canvas.addEventListener('pointerdown', (e) => {down = true; [lx, ly] = pos(e);});
    addEventListener('pointerup', () => {down = false;});
    canvas.addEventListener('pointermove', (e) => {
      if (!down) return;
      const [x, y] = pos(e);
      const c = FluidEffect.generateColor();
      this.splat(x, y, (x - lx) * this.opt.splatForce, (y - ly) * this.opt.splatForce, c);
      lx = x; ly = y;
    });
  }

  static generateColor() {
    const h = Math.random(), s = 1.0, v = 1.0;
    const i = Math.floor(h * 6), f = h * 6 - i;
    const p = v * (1 - s), q = v * (1 - f * s), t = v * (1 - (1 - f) * s);
    let r, g, b;
    switch (i % 6) {
      case 0: r = v; g = t; b = p; break;
      case 1: r = q; g = v; b = p; break;
      case 2: r = p; g = v; b = t; break;
      case 3: r = p; g = q; b = v; break;
      case 4: r = t; g = p; b = v; break;
      default: r = v; g = p; b = q;
    }
    return [r * 0.15, g * 0.15, b * 0.15];
  }

  // ---------------------------------------------------------------- engine hooks
  updateInstanceData(baseModelMatrix) {
    const local = this._localMatrix;
    const finalMat = this._finalMatrix;
    mat4.identity(local);
    mat4.identity(finalMat);
    mat4.translate(local, this.localOffset, local);
    mat4.rotateX(local, this.localRotation[0], local);
    mat4.rotateY(local, this.localRotation[1], local);
    mat4.rotateZ(local, this.localRotation[2], local);
    if (this.activeRotate[0] !== 0) mat4.rotateX(local, this.activeRotate[0] * this._time, local);
    if (this.activeRotate[1] !== 0) mat4.rotateY(local, this.activeRotate[1] * this._time, local);
    if (this.activeRotate[2] !== 0) mat4.rotateZ(local, this.activeRotate[2] * this._time, local);
    mat4.scale(local, this.scale, local);
    mat4.multiply(baseModelMatrix, local, finalMat);
  }

  setScale(s) {this.scale = Array.isArray(s) ? s : [s, s, s];}

  /** Called by world.js frame loop on the command encoder before the main pass. */
  simulate(encoder) {
    if (!this.enabled) return;
    const now = performance.now();
    const dt = Math.min((now - this._last) / 1000, 0.016666);
    this._last = now;
    this._time += dt;
    const o = this.opt;
    const q = this.device.queue;

    this._f4.set([dt, o.velocityDissipation, 0, 0]); q.writeBuffer(this.uAdvVel, 0, this._f4);
    this._f4.set([dt, o.densityDissipation, 0, 0]); q.writeBuffer(this.uAdvDye, 0, this._f4);
    this._f4.set([o.curl, dt, 0, 0]); q.writeBuffer(this.uVort, 0, this._f4);
    this._f4.set([o.pressure, 0, 0, 0]); q.writeBuffer(this.uScale, 0, this._f4);

    const pass = encoder.beginComputePass({label: 'fluid'});

    // 1. splats (each splat has own uniform slot, so writes don't collide)
    for (let s = 0; s < this._pending.length; s++) {
      const sp = this._pending[s];
      const a = this._splatScratch;
      a[0] = sp.x; a[1] = sp.y;
      a[2] = o.aspect;
      a[3] = (o.aspect > 1 ? o.splatRadius * o.aspect : o.splatRadius) / 100;
      // velocity splat
      a[4] = sp.dx; a[5] = sp.dy; a[6] = 0; a[7] = 1;
      q.writeBuffer(this.splatVelU[s], 0, a);
      // dye splat
      a[4] = sp.color[0]; a[5] = sp.color[1]; a[6] = sp.color[2];
      q.writeBuffer(this.splatDyeU[s], 0, a);

      this._dispatch(pass, this.pSplat, this.bgSplatVel[s][this._vi], this.simW, this.simH);
      this._vi ^= 1;
      this._dispatch(pass, this.pSplat, this.bgSplatDye[s][this._di], this.dyeW, this.dyeH);
      this._di ^= 1;
    }
    this._pending.length = 0;

    // 2. curl + vorticity confinement
    this._dispatch(pass, this.pCurl, this.bgCurl[this._vi], this.simW, this.simH);
    this._dispatch(pass, this.pVort, this.bgVort[this._vi], this.simW, this.simH);
    this._vi ^= 1;

    // 3. divergence
    this._dispatch(pass, this.pDiv, this.bgDiv[this._vi], this.simW, this.simH);

    // 4. pressure decay + jacobi
    this._dispatch(pass, this.pScale, this.bgScale[this._pi], this.simW, this.simH);
    this._pi ^= 1;
    for (let i = 0; i < o.pressureIterations; i++) {
      this._dispatch(pass, this.pPressure, this.bgPressure[this._pi], this.simW, this.simH);
      this._pi ^= 1;
    }

    // 5. gradient subtract
    this._dispatch(pass, this.pGrad, this.bgGrad[this._pi * 2 + this._vi], this.simW, this.simH);
    this._vi ^= 1;

    // 6. advect velocity, then dye
    this._dispatch(pass, this.pAdvect, this.bgAdvVel[this._vi], this.simW, this.simH);
    this._vi ^= 1;
    this._dispatch(pass, this.pAdvect, this.bgAdvDye[this._vi * 2 + this._di], this.dyeW, this.dyeH);
    this._di ^= 1;

    pass.end();
  }

  /** Called inside the main render pass. */
  render(pass, mesh, VP) {
    if (!this.enabled) return;
    mat4.multiply(VP, this._finalMatrix, this._mvpScratch);
    this.device.queue.writeBuffer(this.mvpBuffer, 0, this._mvpScratch);
    pass.setPipeline(this.displayPipeline);
    pass.setBindGroup(0, this.bgDisplay[this._di]);
    pass.draw(6);
  }

  destroy() {
    for (const t of [...this.vel, ...this.dye, ...this.pres, this.divT, this.curlT]) t.destroy();
    this.enabled = false;
  }

  // ---------------------------------------------------------------- internals
  _tex(w, h, label) {
    return this.device.createTexture({
      label, size: [w, h], format: 'rgba16float',
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.STORAGE_BINDING,
    });
  }

  _ubuf(size, label) {
    return this.device.createBuffer({label, size, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST});
  }

  _createResources() {
    const d = this.device;
    this.vel = [this._tex(this.simW, this.simH, 'fluid vel0'), this._tex(this.simW, this.simH, 'fluid vel1')];
    this.pres = [this._tex(this.simW, this.simH, 'fluid p0'), this._tex(this.simW, this.simH, 'fluid p1')];
    this.divT = this._tex(this.simW, this.simH, 'fluid div');
    this.curlT = this._tex(this.simW, this.simH, 'fluid curl');
    this.dye = [this._tex(this.dyeW, this.dyeH, 'fluid dye0'), this._tex(this.dyeW, this.dyeH, 'fluid dye1')];
    this.velV = this.vel.map(t => t.createView());
    this.presV = this.pres.map(t => t.createView());
    this.dyeV = this.dye.map(t => t.createView());
    this.divV = this.divT.createView();
    this.curlV = this.curlT.createView();

    this.linear = d.createSampler({magFilter: 'linear', minFilter: 'linear', addressModeU: 'clamp-to-edge', addressModeV: 'clamp-to-edge'});

    this.uAdvVel = this._ubuf(16, 'fluid advVel');
    this.uAdvDye = this._ubuf(16, 'fluid advDye');
    this.uVort = this._ubuf(16, 'fluid vort');
    this.uScale = this._ubuf(16, 'fluid scale');
    this.mvpBuffer = this._ubuf(64, 'fluid mvp');
    this.splatVelU = Array.from({length: MAX_SPLATS}, (_, i) => this._ubuf(32, 'fluid splatVel' + i));
    this.splatDyeU = Array.from({length: MAX_SPLATS}, (_, i) => this._ubuf(32, 'fluid splatDye' + i));
  }

  _compute(code, label) {
    return this.device.createComputePipeline({
      label, layout: 'auto',
      compute: {module: this.device.createShaderModule({label, code}), entryPoint: 'main'},
    });
  }

  _createPipelines() {
    this.pAdvect = this._compute(ADVECT_WGSL, 'fluid advect');
    this.pCurl = this._compute(CURL_WGSL, 'fluid curl');
    this.pVort = this._compute(VORTICITY_WGSL, 'fluid vorticity');
    this.pDiv = this._compute(DIVERGENCE_WGSL, 'fluid divergence');
    this.pScale = this._compute(SCALE_WGSL, 'fluid scale');
    this.pPressure = this._compute(PRESSURE_WGSL, 'fluid pressure');
    this.pGrad = this._compute(GRADIENT_WGSL, 'fluid gradient');
    this.pSplat = this._compute(SPLAT_WGSL, 'fluid splat');

    const module = this.device.createShaderModule({label: 'fluid display', code: DISPLAY_WGSL});
    const blend = {
      color: {srcFactor: 'one', dstFactor: 'one-minus-src-alpha', operation: 'add'},
      alpha: {srcFactor: 'one', dstFactor: 'one-minus-src-alpha', operation: 'add'},
    };
    const targets = [{format: 'rgba16float', blend}];
    for (let i = 1; i < this.opt.colorTargets; i++) targets.push({format: 'rgba16float', writeMask: 0});
    this.displayPipeline = this.device.createRenderPipeline({
      label: 'fluid display',
      layout: 'auto',
      vertex: {module, entryPoint: 'vs'},
      fragment: {module, entryPoint: 'fs', targets},
      primitive: {topology: 'triangle-list', cullMode: 'none'},
      depthStencil: {format: this.opt.colorFormatDepth, depthWriteEnabled: false, depthCompare: 'less'},
    });
  }

  _bg(pipeline, entries, label) {
    return this.device.createBindGroup({
      label, layout: pipeline.getBindGroupLayout(0),
      entries: entries.map((resource, binding) => ({binding, resource})),
    });
  }

  _createBindGroups() {
    const V = this.velV, D = this.dyeV, P = this.presV, buf = (b) => ({buffer: b});
    const two = (fn) => [fn(0), fn(1)];

    this.bgCurl = two(v => this._bg(this.pCurl, [V[v], this.curlV]));
    this.bgVort = two(v => this._bg(this.pVort, [buf(this.uVort), V[v], this.curlV, V[1 - v]]));
    this.bgDiv = two(v => this._bg(this.pDiv, [V[v], this.divV]));
    this.bgScale = two(p => this._bg(this.pScale, [buf(this.uScale), P[p], P[1 - p]]));
    this.bgPressure = two(p => this._bg(this.pPressure, [P[p], this.divV, P[1 - p]]));
    // index: p * 2 + v
    this.bgGrad = [0, 1, 2, 3].map(i => {
      const p = i >> 1, v = i & 1;
      return this._bg(this.pGrad, [P[p], V[v], V[1 - v]]);
    });
    this.bgAdvVel = two(v => this._bg(this.pAdvect, [buf(this.uAdvVel), V[v], V[v], V[1 - v], this.linear]));
    // index: v * 2 + d
    this.bgAdvDye = [0, 1, 2, 3].map(i => {
      const v = i >> 1, d = i & 1;
      return this._bg(this.pAdvect, [buf(this.uAdvDye), V[v], D[d], D[1 - d], this.linear]);
    });
    this.bgSplatVel = this.splatVelU.map(u => two(v => this._bg(this.pSplat, [buf(u), V[v], V[1 - v]])));
    this.bgSplatDye = this.splatDyeU.map(u => two(d => this._bg(this.pSplat, [buf(u), D[d], D[1 - d]])));
    this.bgDisplay = two(d => this._bg(this.displayPipeline, [buf(this.mvpBuffer), D[d], this.linear]));
  }

  _dispatch(pass, pipeline, bindGroup, w, h) {
    pass.setPipeline(pipeline);
    pass.setBindGroup(0, bindGroup);
    pass.dispatchWorkgroups(Math.ceil(w / WG), Math.ceil(h / WG));
  }
}