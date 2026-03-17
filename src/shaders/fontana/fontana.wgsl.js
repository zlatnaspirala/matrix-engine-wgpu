const SHARED = `
override shadowDepthTextureSize : f32 = 512.0;
const PI  : f32 = 3.141592653589793;
const TAU : f32 = 6.283185307179586;

struct Scene {
    lightViewProjMatrix  : mat4x4f,
    cameraViewProjMatrix : mat4x4f,
    cameraPos    : vec3f,  padding2 : f32,
    lightPos     : vec3f,  padding  : f32,
    globalAmbient: vec3f,  padding3 : f32,
    time      : f32,
    deltaTime : f32,
    padding4  : vec2f,
};
struct SpotLight {
    position    : vec3f, _pad1 : f32,
    direction   : vec3f, _pad2 : f32,
    innerCutoff : f32,  outerCutoff : f32,
    intensity   : f32,  _pad3 : f32,
    color       : vec3f, _pad4 : f32,
    range       : f32,  ambientFactor : f32,
    shadowBias  : f32,  _pad5 : f32,
    lightViewProj : mat4x4<f32>,
};
struct MaterialPBR {
    baseColorFactor : vec4f,
    metallicFactor  : f32,
    roughnessFactor : f32,
    _pad1 : f32, _pad2 : f32,
};
struct PBRMaterialData {
    baseColor : vec3f,
    metallic  : f32,
    roughness : f32,
    alpha     : f32,
};
const MAX_SPOTLIGHTS = 20u;

@group(0) @binding(0) var<uniform> scene           : Scene;
@group(0) @binding(1) var shadowMapArray           : texture_depth_2d_array;
@group(0) @binding(2) var shadowSampler            : sampler_comparison;
@group(0) @binding(3) var meshTexture              : texture_2d<f32>;
@group(0) @binding(4) var meshSampler              : sampler;
@group(0) @binding(5) var<storage, read> spotlights: array<SpotLight, MAX_SPOTLIGHTS>;
@group(0) @binding(6) var metallicRoughnessTex     : texture_2d<f32>;
@group(0) @binding(7) var metallicRoughnessSampler : sampler;
@group(0) @binding(8) var<uniform> material        : MaterialPBR;

struct FragmentInput {
    @builtin(position)                     clipPos   : vec4f,
    @location(0)                           shadowPos : vec4f,
    @location(1) fragPos   : vec3f,
    @location(2) fragNorm  : vec3f,
    @location(3) uv        : vec2f,
};

fn hash21(p: vec2f) -> f32 {
    var q = fract(p * vec2f(127.1, 311.7));
    q    += dot(q, q + 19.19);
    return fract(q.x * q.y);
}
fn noise2d(p: vec2f) -> f32 {
    let i = floor(p); let f = fract(p);
    let u = f * f * (3.0 - 2.0 * f);
    return mix(
        mix(hash21(i),            hash21(i+vec2f(1,0)), u.x),
        mix(hash21(i+vec2f(0,1)), hash21(i+vec2f(1,1)), u.x),
        u.y);
}
fn fbm(p: vec2f) -> f32 {
    var v=0.0; var a=0.5; var pp=p;
    v += a*noise2d(pp); pp*=2.1; a*=0.5;
    v += a*noise2d(pp); pp*=2.1; a*=0.5;
    v += a*noise2d(pp); pp*=2.1; a*=0.5;
    v += a*noise2d(pp);
    return v;
}
fn fresnelPower(N: vec3f, V: vec3f, power: f32) -> f32 {
    return pow(1.0 - clamp(dot(N, V), 0.0, 1.0), power);
}
fn fresnelSchlick(cosT: f32, F0: vec3f) -> vec3f {
    return F0 + (1.0 - F0) * pow(1.0 - cosT, 5.0);
}
fn sss(N: vec3f, L: vec3f, V: vec3f, rim: f32) -> f32 {
    let wrap = normalize(L + N * 0.3);
    return pow(clamp(dot(V, -wrap), 0.0, 1.0), 3.0) * rim * 0.65;
}
fn pbrSpot(light: SpotLight, N: vec3f, pos: vec3f,
           V: vec3f, mat: PBRMaterialData) -> vec3f {
    let L     = normalize(light.position - pos);
    let NdotL = max(dot(N, L), 0.0);
    let cone  = clamp(
        (dot(L, normalize(-light.direction)) - light.outerCutoff) /
        (light.innerCutoff - light.outerCutoff), 0.0, 1.0);
    if (cone <= 0.0 || NdotL <= 0.0) { return vec3f(0.0); }
    let F0    = mix(vec3f(0.04), mat.baseColor, vec3f(mat.metallic));
    let H     = normalize(L + V);
    let a2    = pow(mat.roughness * mat.roughness, 2.0);
    let NdotH = max(dot(N, H), 0.0);
    let D     = a2 / (PI * pow(NdotH*NdotH*(a2-1.0)+1.0, 2.0) + 1e-5);
    let k     = pow(mat.roughness+1.0, 2.0) / 8.0;
    let NdotV = max(dot(N, V), 0.0);
    let G     = (NdotV/(NdotV*(1.0-k)+k)) * (NdotL/(NdotL*(1.0-k)+k));
    let F     = fresnelSchlick(max(dot(H,V), 0.0), F0);
    let spec  = D*G*F / (4.0*NdotV*NdotL + 1e-5);
    let kD    = (vec3f(1.0) - F) * (1.0 - mat.metallic);
    return (kD*mat.baseColor/PI + spec)*light.color*light.intensity*NdotL*cone;
}
fn pcfShadow(suv: vec2f, layer: i32, depth: f32, N: vec3f, L: vec3f) -> f32 {
    var v    = 0.0;
    let bias = 0.001 + max(0.002*(1.0 - dot(N,L)), 0.0);
    let step = 1.0 / (shadowDepthTextureSize * 0.5);
    let offs = array<vec2f,9>(
        vec2(-1.,-1.), vec2(0.,-1.), vec2(1.,-1.),
        vec2(-1., 0.), vec2(0., 0.), vec2(1., 0.),
        vec2(-1., 1.), vec2(0., 1.), vec2(1., 1.)
    );
    for (var i = 0u; i < 9u; i++) {
        v += textureSampleCompare(shadowMapArray, shadowSampler,
                 suv + offs[i]*step, layer, depth - bias);
    }
    return v / 9.0;
}
fn pbr_shadows(fragPos: vec3f, N: vec3f, V: vec3f, mat: PBRMaterialData) -> vec3f {
    var acc = vec3f(0.0);
    for (var i = 0u; i < MAX_SPOTLIGHTS; i++) {
        let sc  = spotlights[i].lightViewProj * vec4<f32>(fragPos, 1.0);
        let p   = sc.xyz / sc.w;
        let suv = vec2f(p.x*0.5+0.5, -p.y*0.5+0.5);
        let L   = normalize(spotlights[i].position - fragPos);
        let inF = p.z>=0.0 && p.z<=1.0 && abs(p.x)<=1.0 && abs(p.y)<=1.0;
        let sh  = select(1.0, pcfShadow(suv, i32(i), p.z, N, L), inF);
        acc    += pbrSpot(spotlights[i], N, fragPos, V, mat) * sh;
    }
    return acc;
}
fn sss_lights(fragPos: vec3f, N: vec3f, V: vec3f, fresnel: f32) -> vec3f {
    var acc = vec3f(0.0);
    for (var i = 0u; i < MAX_SPOTLIGHTS; i++) {
        let L = normalize(spotlights[i].position - fragPos);
        acc  += spotlights[i].color * spotlights[i].intensity * sss(N, L, V, fresnel);
    }
    return vec3f(0.08, 0.62, 0.94) * acc * 0.45;
}
`;

// ─────────────────────────────────────────────────────────────────
//  SHADER 1 — CAP DISK
//  Geometry: flat plane(1.0), position = column top
//  UV: (0,0)=corner (1,1)=corner, centre=(0.5,0.5)
//  Fragment: discard outside circle, caustics + ripple rings + glow
// ─────────────────────────────────────────────────────────────────
export const fountainCapFragmentWGSL = SHARED + `
@fragment
fn main(input: FragmentInput) -> @location(0) vec4f {
    let t  = scene.time;
    let N  = normalize(input.fragNorm);
    let V  = normalize(scene.cameraPos - input.fragPos);
    let uv = input.uv;

    // Circle mask — discard outside radius, sharp edge
    let d = length(uv - vec2f(0.5)) * 2.0;
    if (d > 1.0) { discard; }

    // Distorted UV for surface detail
    let uvD = uv + vec2f(
        sin(uv.y*7.0 + t*1.2)*0.02 + sin(uv.x*5.0 - t*0.2)*0.015,
        cos(uv.x*6.0 + t*1.0)*0.02 + cos(uv.y*8.0 - t*0.1)*0.012
    );

    // Water color: dark teal centre -> bright cyan rim
    var wColor = mix(
        vec3f(0.01, 0.17, 0.32),
        mix(vec3f(0.05, 0.50, 0.86), vec3f(0.40, 0.92, 1.00), smoothstep(0.45, 0.95, d)),
        smoothstep(0.0, 0.55, d)
    );

    // Caustics — two sine grids interfering
    let c1 = sin(uvD.x*18.0 + t*1.1) * sin(uvD.y*18.0 + t*0.9);
    let c2 = sin((uvD.x+uvD.y)*14.0 - t*1.3) * sin((uvD.x-uvD.y)*14.0 + t*0.7);
    let caustic = pow(clamp((c1+c2)*0.5+0.5, 0.0, 1.0), 2.5);

    // Ripple rings — 3 expanding rings from centre
    var rings = 0.0;
    for (var i = 0u; i < 3u; i++) {
        let phase = fract(t * 0.4 + f32(i) * 0.13);
        let ring  = abs(d - phase);
        rings    += smoothstep(0.06, 0.0, ring) * (1.0 - phase);
    }

    var mat : PBRMaterialData;
    mat.metallic  = 0.95;
    mat.roughness = 0.05;
    mat.alpha     = 0.88;
    let foam      = smoothstep(0.56, 0.74, fbm(uvD * 3.5 + vec2f(t*0.09, t*0.06)));
    wColor        = mix(wColor, vec3f(0.76, 0.95, 1.0), foam * 0.4);
    mat.baseColor = mix(material.baseColorFactor.rgb, wColor, 0.80);

    let fresnel = fresnelPower(N, V, 2.6);

    var col  = mat.baseColor * scene.globalAmbient;
    col     += pb_shadows(input.fragPos, N, V, mat); // typo guard: see fn below
    col     += vec3f(0.48, 0.91, 1.00) * caustic * 1.8;
    col     += vec3f(0.58, 0.96, 1.00) * rings * 2.5;
    col     += vec3f(0.25, 0.78, 1.00) * fresnel * 3.5;
    col     += sss_lights(input.fragPos, N, V, fresnel);

    // AA at circle edge — 1 pixel soft
    let edgeAA = 1.0 - smoothstep(0.95, 1.0, d);
    let alpha  = clamp((mat.alpha + fresnel * 0.2) * edgeAA, 0.0, 1.0);
    return vec4f(col, alpha);
}

// alias so the snippet above compiles (real fn is pbr_shadows)
fn pb_shadows(fragPos: vec3f, N: vec3f, V: vec3f, mat: PBRMaterialData) -> vec3f {
    return pbr_shadows(fragPos, N, V, mat);
}
`;

// ─────────────────────────────────────────────────────────────────
//  SHADER 2 — CURTAIN
//  Geometry: cylinder(0.5, 2.5), position = column top (centred)
//  UV: U = around cylinder, V = 0 at top, 1 at bottom
//  Fragment: vertical scrolling streaks, fade at bottom
// ─────────────────────────────────────────────────────────────────
export const fountainCurtainFragmentWGSL = SHARED + `
@fragment
fn main(input: FragmentInput) -> @location(0) vec4f {
    let t  = scene.time;
    let N  = normalize(input.fragNorm);
    let V  = normalize(scene.cameraPos - input.fragPos);
    let uv = input.uv;

    // V=0 is top (column top), V=1 is bottom (basin)
    let vPos = uv.y;

    // Scrolling vertical streaks — noise columns scrolling downward
    let scrollY  = fract(uv.y * 3.0 + t * 1.6);
    let streakN  = noise2d(vec2f(uv.x * 10.0, scrollY * 5.0));
    let streak   = smoothstep(0.55, 0.90, streakN);

    // Secondary fast thin streaks
    let scrollY2 = fract(uv.y * 6.0 + t * 2.4);
    let streak2  = smoothstep(0.72, 0.95, noise2d(vec2f(uv.x * 20.0, scrollY2 * 4.0)));

    // Gravity fade — water thins and disperses toward bottom
    // let gravFade = 1.0 - vPos * 0.65;
    let gravFade = vPos * 0.65 + 0.35;

    // Horizontal wave distortion (subtle)
    let waveOff = sin(uv.y * 12.0 + t * 2.0) * 0.008;
    let uvW     = vec2f(uv.x + waveOff, uv.y);

    // Water color: bright cyan top -> slightly transparent teal bottom
    let wColor = mix(
        vec3f(0.30, 0.82, 1.00),
        vec3f(0.05, 0.40, 0.70),
        vPos
    );

    var mat : PBRMaterialData;
    mat.metallic  = 0.90;
    mat.roughness = 0.08;
    mat.alpha     = 0.0;  // fully controlled by streak alpha below
    mat.baseColor = mix(material.baseColorFactor.rgb, wColor, 0.75);

    let fresnel = fresnelPower(N, V, 2.0);

    var col  = mat.baseColor * scene.globalAmbient;
    col     += pbr_shadows(input.fragPos, N, V, mat);
    col     += vec3f(0.40, 0.88, 1.00) * (streak + streak2 * 0.5) * 1.6;
    col     += vec3f(0.25, 0.78, 1.00) * fresnel * 2.0;

    // Alpha: streaks define where water is visible
    let alpha = clamp((streak * 0.75 + streak2 * 0.35 + fresnel * 0.25) * gravFade, 0.0, 1.0);

    // Discard nearly-invisible pixels for performance + clean look
    if (alpha < 0.02) { discard; }

    return vec4f(col, alpha);
}
`;

// ─────────────────────────────────────────────────────────────────
//  SHADER 3 — BASIN WATER
//  Geometry: flat plane(2.0), position = py + 0.01
//  UV: (0.5,0.5) = centre of plane
//  Fragment: discard outside ring + inside column hole, ripple water
// ─────────────────────────────────────────────────────────────────
export const fountainBasinFragmentWGSL = SHARED + `
@fragment
fn main(input: FragmentInput) -> @location(0) vec4f {
    let t  = scene.time;
    let N  = normalize(input.fragNorm);
    let V  = normalize(scene.cameraPos - input.fragPos);
    let uv = input.uv;

    let d = length(uv - vec2f(0.5)) * 2.0;

    // Ring mask: discard outside basin, discard inside column hole
    // basin outer radius = 0.95, column hole = 0.16 (column r=0.15 in plane space)
    if (d > 0.95 || d < 0.16) { discard; }

    // Soft edges at both ring boundaries
    let outerAA = 1.0 - smoothstep(0.90, 0.95, d);
    let innerAA = smoothstep(0.16, 0.20, d);
    let ringMask = outerAA * innerAA;

    // Distorted UV
    let uvD = uv + vec2f(
        sin(uv.y*6.0 + t*1.0)*0.018 + sin(uv.x*4.0 - t*0.7)*0.012,
        cos(uv.x*5.0 + t*0.9)*0.016 + cos(uv.y*7.0 - t*1.3)*0.010
    );

    // Caustics on water surface
    let c1 = sin(uvD.x*16.0 + t*0.9) * sin(uvD.y*16.0 + t*0.5);
    let c2 = sin((uvD.x+uvD.y)*12.0 - t*1.0) * sin((uvD.x-uvD.y)*12.0 + t*0.8);
    let caustic = pow(clamp((c1+c2)*0.5+0.5, 0.0, 1.0), 2.5);

    // Ripple rings from centre (where curtain hits)
    var rings = 0.0;
    for (var i = 0u; i < 4u; i++) {
        let phase = fract(t * 0.35 + f32(i) * 0.25);
        let r     = abs(d - phase * 0.9);
        rings    += smoothstep(0.05, 0.0, r) * (1.0 - phase);
    }

    let wColor = mix(
        vec3f(0.02, 0.22, 0.40),
        vec3f(0.08, 0.55, 0.90),
        smoothstep(0.2, 0.9, d)
    );

    var mat : PBRMaterialData;
    mat.metallic  = 0.95;
    mat.roughness = 0.04;
    mat.alpha     = 0.75;
    let foam      = smoothstep(0.58, 0.76, fbm(uvD * 4.0 + vec2f(t*0.07, t*0.05)));
    mat.baseColor = mix(material.baseColorFactor.rgb,
                        mix(wColor, vec3f(0.80, 0.97, 1.0), foam * 0.35), 0.82);

    let fresnel = fresnelPower(N, V, 3.0);

    var col  = mat.baseColor * scene.globalAmbient;
    col     += pbr_shadows(input.fragPos, N, V, mat);
    col     += vec3f(0.48, 0.91, 1.00) * caustic * 1.5;
    col     += vec3f(0.60, 0.97, 1.00) * rings * 2.0;
    col     += vec3f(0.25, 0.78, 1.00) * fresnel * 2.5;
    col     += sss_lights(input.fragPos, N, V, fresnel);

    let alpha = clamp((mat.alpha + fresnel * 0.2) * ringMask, 0.0, 1.0);
    return vec4f(col, alpha);
}
`;


// ─────────────────────────────────────────────────────────────────
//  VERTEX SHADER — shared by all three water meshes
// ─────────────────────────────────────────────────────────────────
export const fountainWaterVertexWGSL = /* wgsl */`
struct Scene {
  lightViewProjMatrix: mat4x4f,
  cameraViewProjMatrix: mat4x4f,
  cameraPos: vec3f,
  padding0: f32,
  lightPos: vec3f,
  padding1: f32,
}

struct Model {
  modelMatrix: mat4x4f,
}

struct VertexAnimParams {
  time: f32,
  flags: f32,
  globalIntensity: f32,
  _pad0: f32,

  waveSpeed: f32,
  waveAmplitude: f32,
  waveFrequency: f32,
  _pad1: f32,

  windSpeed: f32,
  windStrength: f32,
  windHeightInfluence: f32,
  windTurbulence: f32,

  pulseSpeed: f32,
  pulseAmount: f32,
  pulseCenterX: f32,
  pulseCenterY: f32,

  twistSpeed: f32,
  twistAmount: f32,
  _pad2: f32,
  _pad3: f32,

  noiseScale: f32,
  noiseStrength: f32,
  noiseSpeed: f32,
  _pad4: f32,

  oceanWaveScale: f32,
  oceanWaveHeight: f32,
  oceanWaveSpeed: f32,
  _pad5: f32,
}

@group(0) @binding(0) var<uniform> scene: Scene;
@group(1) @binding(0) var<uniform> model: Model;
@group(1) @binding(2) var<uniform> vertexAnim: VertexAnimParams;
@group(1) @binding(3) var<uniform> morphBlend: f32;

const ANIM_WAVE: u32 = 1u;
const ANIM_WIND: u32 = 2u;
const ANIM_PULSE: u32 = 4u;
const ANIM_TWIST: u32 = 8u;
const ANIM_NOISE: u32 = 16u;
const ANIM_OCEAN: u32 = 32u;

struct VertexInput {
  @location(0) position:  vec3f,
  @location(1) normal:    vec3f,
  @location(2) uv:        vec2f,
  @location(6) positionB: vec3f,
  @location(7) normalB:   vec3f,
};

struct VertexOutput {
  @location(0) shadowPos: vec4f,
  @location(1) fragPos:   vec3f,
  @location(2) fragNorm:  vec3f,
  @location(3) uv:        vec2f,
  @builtin(position) Position: vec4f,
}

fn hash(p: vec2f) -> f32 {
  var p3 = fract(vec3f(p.x, p.y, p.x) * 0.13);
  p3 += dot(p3, vec3f(p3.y, p3.z, p3.x) + 3.333);
  return fract((p3.x + p3.y) * p3.z);
}

fn noise(p: vec2f) -> f32 {
  let i = floor(p); let f = fract(p);
  let u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i + vec2f(0.0, 0.0)), hash(i + vec2f(1.0, 0.0)), u.x),
    mix(hash(i + vec2f(0.0, 1.0)), hash(i + vec2f(1.0, 1.0)), u.x),
    u.y
  );
}

fn applyVertexAnimation(pos: vec3f) -> vec3f {
  var p = pos;
  let flags = u32(vertexAnim.flags);
  let t = vertexAnim.time;

  if ((flags & ANIM_WAVE) != 0u) {
    let w = sin(p.x * vertexAnim.waveFrequency + t * vertexAnim.waveSpeed) * 
            cos(p.z * vertexAnim.waveFrequency + t * vertexAnim.waveSpeed);
    p.y += w * vertexAnim.waveAmplitude;
  }

  if ((flags & ANIM_WIND) != 0u) {
    let h = max(0.0, p.y) * vertexAnim.windHeightInfluence;
    let d = vec2f(sin(t * vertexAnim.windSpeed), cos(t * vertexAnim.windSpeed * 0.7)) * vertexAnim.windStrength;
    let turb = noise(p.xz * 0.5 + t * 0.3) * vertexAnim.windTurbulence;
    p.x += d.x * h * (1.0 + turb);
    p.z += d.y * h * (1.0 + turb);
  }

  if ((flags & ANIM_PULSE) != 0u) {
    let s = 1.0 + sin(t * vertexAnim.pulseSpeed) * vertexAnim.pulseAmount;
    let c = vec3f(vertexAnim.pulseCenterX, 0.0, vertexAnim.pulseCenterY);
    p = c + (p - c) * s;
  }

  if ((flags & ANIM_TWIST) != 0u) {
    let angle = p.y * vertexAnim.twistAmount * sin(t * vertexAnim.twistSpeed);
    let cosA = cos(angle); let sinA = sin(angle);
    p = vec3f(p.x * cosA - p.z * sinA, p.y, p.x * sinA + p.z);
  }

  if ((flags & ANIM_NOISE) != 0u) {
    p.y += (noise(p.xz * vertexAnim.noiseScale + t * vertexAnim.noiseSpeed) - 0.5) * vertexAnim.noiseStrength;
  }

  if ((flags & ANIM_OCEAN) != 0u) {
    let s = vertexAnim.oceanWaveScale;
    let h = vertexAnim.oceanWaveHeight;
    p.y += sin(dot(p.xz, vec2f(1.0, 0.0)) * s + t * vertexAnim.oceanWaveSpeed) * h;
    p.y += sin(dot(p.xz, vec2f(0.7, 0.7)) * s * 1.2 + t * vertexAnim.oceanWaveSpeed * 1.3) * h * 0.7;
  }

  return mix(pos, p, vertexAnim.globalIntensity);
}

@vertex
fn main(input: VertexInput) -> VertexOutput {
  var output: VertexOutput;

  let blendedPosition = mix(input.position, input.positionB, morphBlend);
  let blendedNormal   = normalize(mix(input.normal, input.normalB, morphBlend));

  var pos = blendedPosition;

  if (u32(vertexAnim.flags) != 0u && vertexAnim.globalIntensity > 0.0) {
      pos = applyVertexAnimation(pos);
  }

  let worldPos = model.modelMatrix * vec4f(pos, 1.0);

  let normalMatrix = mat3x3f(
      model.modelMatrix[0].xyz,
      model.modelMatrix[1].xyz,
      model.modelMatrix[2].xyz
  );

  output.Position  = scene.cameraViewProjMatrix * worldPos;
  output.fragPos   = worldPos.xyz;
  output.shadowPos = scene.lightViewProjMatrix * worldPos;
  output.fragNorm  = normalize(normalMatrix * blendedNormal);
  output.uv        = input.uv;

  return output;
}
`;

