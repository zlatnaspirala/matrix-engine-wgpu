/**
 * GradePass for matrix-engine-wgpu
 * Final pass (replaces present): lens distortion + chromatic aberration -> SSR mix ->
 * exposure -> tonemap -> saturation/contrast -> 3D LUT -> vignette -> grain.
 *
 * Tonemap modes: 'reinhard' (legacy look, no gamma - identical to the old present pass),
 *                'aces', 'agx' (compact approximation), 'neutral' (Khronos PBR Neutral).
 * All defaults are no-ops, so activating the pass alone reproduces the current image.
 *
 * setExposure / setTonemap / setSaturation / setContrast / setDistortion (0..0.3, barrel)
 * setChromatic (0..0.02) / setVignette(strength, radius, soft) / setGrain / setLUT(view, strength)
 */
import {fullscreenQuadWGSL} from "./bloom.js";

export const TONEMAP = {reinhard: 0, aces: 1, agx: 2, neutral: 3};

export class GradePass {
  constructor(device, targetFormat, options = {}) {
    this.enabled = false;
    this.device = device;
    this.params = {
      exposure: 1.0,
      tonemap: 0,
      saturation: 1.0,
      contrast: 1.0,
      distortion: 0.0,
      chromatic: 0.0,
      vignette: 0.0,
      vignetteRadius: 1.0,
      vignetteSoft: 0.5,
      grain: 0.0,
      lutStrength: 0.0,
    };
    const {tonemap, ...rest} = options;
    Object.assign(this.params, rest);
    if(tonemap !== undefined) this.params.tonemap = typeof tonemap === 'string' ? (TONEMAP[tonemap] ?? 0) : tonemap;

    this._scratch = new Float32Array(16);
    this._timeScratch = new Float32Array(1);
    this.paramBuffer = device.createBuffer({
      label: 'Grade params',
      size: 64,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    this.sampler = device.createSampler({magFilter: 'linear', minFilter: 'linear', addressModeU: 'clamp-to-edge', addressModeV: 'clamp-to-edge', addressModeW: 'clamp-to-edge'});
    this._lutView = createIdentityLUT(device, 2);
    this._updateParams();

    this.pipeline = device.createRenderPipeline({
      label: 'Grade pipeline',
      layout: 'auto',
      vertex: {module: device.createShaderModule({code: fullscreenQuadWGSL()}), entryPoint: 'vert'},
      fragment: {
        module: device.createShaderModule({code: gradeWGSL()}),
        entryPoint: 'main',
        targets: [{format: targetFormat}]
      },
      primitive: {topology: 'triangle-list'}
    });

    this._passDesc = {
      label: 'Grade pass',
      colorAttachments: [{view: null, loadOp: 'clear', storeOp: 'store', clearValue: {r: 0, g: 0, b: 0, a: 1}}]
    };
    this._bg = null;
    this._lastHdr = null;
    this._lastSSR = null;
  }

  _updateParams() {
    const p = this.params, s = this._scratch;
    s[0] = p.exposure; s[1] = p.tonemap; s[2] = p.saturation; s[3] = p.contrast;
    s[4] = p.distortion; s[5] = p.chromatic; s[6] = p.vignette; s[7] = p.vignetteRadius;
    s[8] = p.vignetteSoft; s[9] = p.grain; /* s[10] = time, written per frame */ s[11] = p.lutStrength;
    this.device.queue.writeBuffer(this.paramBuffer, 0, s);
  }

  setExposure = (v) => {this.params.exposure = v; this._updateParams();}
  setTonemap = (v) => {this.params.tonemap = typeof v === 'string' ? (TONEMAP[v] ?? 0) : v; this._updateParams();}
  setSaturation = (v) => {this.params.saturation = v; this._updateParams();}
  setContrast = (v) => {this.params.contrast = v; this._updateParams();}
  setDistortion = (v) => {this.params.distortion = Math.max(0, v); this._updateParams();}
  setChromatic = (v) => {this.params.chromatic = v; this._updateParams();}
  setGrain = (v) => {this.params.grain = v; this._updateParams();}
  setVignette = (strength, radius = this.params.vignetteRadius, soft = this.params.vignetteSoft) => {
    this.params.vignette = strength;
    this.params.vignetteRadius = radius;
    this.params.vignetteSoft = soft;
    this._updateParams();
  }

  /** @param {GPUTextureView|null} view 3D view from createLUTFromCube / loadLUT, null = identity */
  setLUT = (view, strength = 1.0) => {
    this._lutView = view ?? createIdentityLUT(this.device, 2);
    this.params.lutStrength = view ? strength : 0.0;
    this._bg = null;
    this._updateParams();
  }

  render(encoder, hdrView, ssrView, targetView) {
    if(this.params.grain > 0) {
      this._timeScratch[0] = (performance.now() * 0.001) % 1000;
      this.device.queue.writeBuffer(this.paramBuffer, 40, this._timeScratch);
    }
    if(!this._bg || this._lastHdr !== hdrView || this._lastSSR !== ssrView) {
      this._bg = this.device.createBindGroup({
        label: 'Grade bindgroup',
        layout: this.pipeline.getBindGroupLayout(0),
        entries: [
          {binding: 0, resource: hdrView},
          {binding: 1, resource: this.sampler},
          {binding: 2, resource: ssrView},
          {binding: 3, resource: {buffer: this.paramBuffer}},
          {binding: 4, resource: this._lutView},
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

// ───────────────────────── 3D LUT helpers ─────────────────────────

function upload3D(device, data, n) {
  const tex = device.createTexture({
    label: `LUT ${n}^3`,
    size: [n, n, n],
    dimension: '3d',
    format: 'rgba8unorm',
    usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
  });
  device.queue.writeTexture({texture: tex}, data, {bytesPerRow: n * 4, rowsPerImage: n}, [n, n, n]);
  return tex.createView({dimension: '3d'});
}

/** Identity LUT. Size 2 is enough as a dummy (trilinear + half-texel remap is exact). */
export function createIdentityLUT(device, size = 2) {
  const n = size;
  const data = new Uint8Array(n * n * n * 4);
  let j = 0;
  for(let b = 0;b < n;b++) for(let g = 0;g < n;g++) for(let r = 0;r < n;r++) {
    data[j++] = Math.round(r / (n - 1) * 255);
    data[j++] = Math.round(g / (n - 1) * 255);
    data[j++] = Math.round(b / (n - 1) * 255);
    data[j++] = 255;
  }
  return upload3D(device, data, n);
}

/** Parse an Adobe/Resolve .cube 3D LUT (red varies fastest). Returns a 3D texture view. */
export function createLUTFromCube(device, text) {
  let n = 0;
  const vals = [];
  for(const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if(!line || line[0] === '#') continue;
    if(line.startsWith('LUT_3D_SIZE')) {n = parseInt(line.split(/\s+/)[1], 10); continue;}
    const p = line.split(/\s+/);
    if(p.length === 3 && !isNaN(p[0])) vals.push(+p[0], +p[1], +p[2]);
  }
  if(!n || vals.length !== n * n * n * 3) throw new Error(`Invalid .cube LUT (size ${n}, values ${vals.length})`);
  const data = new Uint8Array(n * n * n * 4);
  const q = (v) => Math.max(0, Math.min(255, Math.round(v * 255)));
  for(let i = 0, j = 0;i < n * n * n;i++) {
    data[j++] = q(vals[i * 3]);
    data[j++] = q(vals[i * 3 + 1]);
    data[j++] = q(vals[i * 3 + 2]);
    data[j++] = 255;
  }
  return upload3D(device, data, n);
}

export async function loadLUT(device, url) {
  const res = await fetch(url);
  if(!res.ok) throw new Error(`LUT fetch failed: ${url}`);
  return createLUTFromCube(device, await res.text());
}

// ───────────────────────── shader ─────────────────────────

function gradeWGSL() {
  return /* wgsl */`
  struct Grade {
    exposure: f32, tonemap: f32, saturation: f32, contrast: f32,
    distortion: f32, chromatic: f32, vigStrength: f32, vigRadius: f32,
    vigSoft: f32, grain: f32, time: f32, lutStrength: f32,
    _p0: f32, _p1: f32, _p2: f32, _p3: f32,
  };

  @group(0) @binding(0) var hdrTex : texture_2d<f32>;
  @group(0) @binding(1) var samp   : sampler;
  @group(0) @binding(2) var ssrTex : texture_2d<f32>;
  @group(0) @binding(3) var<uniform> g : Grade;
  @group(0) @binding(4) var lutTex : texture_3d<f32>;

  fn composite(uv: vec2<f32>) -> vec3<f32> {
    let hdr = textureSampleLevel(hdrTex, samp, uv, 0.0).rgb;
    let ssr = textureSampleLevel(ssrTex, samp, uv, 0.0);
    return mix(hdr, ssr.rgb, ssr.a);
  }

  // Barrel distortion, zoom-compensated so corners stay on the frame edge (use k >= 0).
  fn distort(uv: vec2<f32>, k: f32) -> vec2<f32> {
    let c = uv - vec2<f32>(0.5);
    let r2 = dot(c, c);
    return vec2<f32>(0.5) + c * (1.0 + k * r2) / (1.0 + k * 0.5);
  }

  fn aces(x: vec3<f32>) -> vec3<f32> {
    let a = 2.51; let b = 0.03; let c = 2.43; let d = 0.59; let e = 0.14;
    return clamp((x * (a * x + b)) / (x * (c * x + d) + e), vec3<f32>(0.0), vec3<f32>(1.0));
  }

  fn agxContrast(x: vec3<f32>) -> vec3<f32> {
    let x2 = x * x;
    let x4 = x2 * x2;
    return 15.5 * x4 * x2 - 40.14 * x4 * x + 31.96 * x4 - 6.868 * x2 * x
         + 0.4298 * x2 + 0.1191 * x - vec3<f32>(0.00232);
  }

  // Compact AgX approximation. Output is already display-encoded (no extra gamma).
  fn agx(v0: vec3<f32>) -> vec3<f32> {
    let m = mat3x3<f32>(
      vec3<f32>(0.842479062253094, 0.0423282422610123, 0.0423756549057051),
      vec3<f32>(0.0784335999999992, 0.878468636469772, 0.0784336),
      vec3<f32>(0.0792237451477643, 0.0791661274605434, 0.879142973793104)
    );
    let minEv = -12.47393;
    let maxEv = 4.026069;
    var v = max(m * v0, vec3<f32>(1e-10));
    v = clamp(log2(v), vec3<f32>(minEv), vec3<f32>(maxEv));
    v = (v - vec3<f32>(minEv)) / (maxEv - minEv);
    return clamp(agxContrast(v), vec3<f32>(0.0), vec3<f32>(1.0));
  }

  // Khronos PBR Neutral
  fn neutral(c0: vec3<f32>) -> vec3<f32> {
    let startCompression = 0.76;
    let desaturation = 0.15;
    var c = c0;
    let x = min(c.r, min(c.g, c.b));
    var offset = 0.04;
    if (x < 0.08) { offset = x - 6.25 * x * x; }
    c = c - vec3<f32>(offset);
    let peak = max(c.r, max(c.g, c.b));
    if (peak < startCompression) { return c; }
    let d = 1.0 - startCompression;
    let newPeak = 1.0 - d * d / (peak + d - startCompression);
    c = c * (newPeak / peak);
    let gg = 1.0 - 1.0 / (desaturation * (peak - newPeak) + 1.0);
    return mix(c, vec3<f32>(newPeak), gg);
  }

  fn tonemap(c: vec3<f32>, mode: i32) -> vec3<f32> {
    let inv = vec3<f32>(1.0 / 2.2);
    if (mode == 1) { return pow(aces(c), inv); }
    if (mode == 2) { return agx(c); }
    if (mode == 3) { return pow(max(neutral(c), vec3<f32>(0.0)), inv); }
    return c / (c + vec3<f32>(1.0));   // legacy Reinhard, same as the old present pass
  }

  fn hash21(p: vec2<f32>) -> f32 {
    var q = fract(p * vec2<f32>(123.34, 456.21));
    q += dot(q, q + 45.32);
    return fract(q.x * q.y);
  }

  @fragment
  fn main(@builtin(position) p: vec4<f32>) -> @location(0) vec4<f32> {
    let size = vec2<f32>(textureDimensions(hdrTex));
    let uv0 = p.xy / size;
    let uv = distort(uv0, g.distortion);

    var hdr: vec3<f32>;
    if (g.chromatic > 0.0) {
      let off = (uv - vec2<f32>(0.5)) * g.chromatic;
      hdr = vec3<f32>(composite(uv + off).r, composite(uv).g, composite(uv - off).b);
    } else {
      hdr = composite(uv);
    }

    var c = tonemap(hdr * g.exposure, i32(g.tonemap + 0.5));

    // Everything below works on display-encoded LDR values
    c = clamp(c, vec3<f32>(0.0), vec3<f32>(1.0));
    let l = dot(c, vec3<f32>(0.2126, 0.7152, 0.0722));
    c = mix(vec3<f32>(l), c, g.saturation);
    c = (c - vec3<f32>(0.5)) * g.contrast + vec3<f32>(0.5);
    c = clamp(c, vec3<f32>(0.0), vec3<f32>(1.0));

    if (g.lutStrength > 0.0) {
      let n = f32(textureDimensions(lutTex).x);
      let lc = c * ((n - 1.0) / n) + vec3<f32>(0.5 / n);
      let graded = textureSampleLevel(lutTex, samp, lc, 0.0).rgb;
      c = mix(c, graded, g.lutStrength);
    }

    if (g.vigStrength > 0.0) {
      let d = distance(uv0, vec2<f32>(0.5)) * 1.41421356;
      let v = 1.0 - smoothstep(g.vigRadius - g.vigSoft, g.vigRadius, d);
      c = c * mix(1.0, v, g.vigStrength);
    }

    if (g.grain > 0.0) {
      let n = hash21(p.xy + vec2<f32>(g.time * 91.7, g.time * 47.3));
      c = c + vec3<f32>((n - 0.5) * g.grain);
    }

    return vec4<f32>(clamp(c, vec3<f32>(0.0), vec3<f32>(1.0)), 1.0);
  }
  `;
}