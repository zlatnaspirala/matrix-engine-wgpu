export const vertexMorphWGSL = /* wgsl */`
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

const ANIM_WAVE: u32 = 1u;
const ANIM_WIND: u32 = 2u;
const ANIM_PULSE: u32 = 4u;
const ANIM_TWIST: u32 = 8u;
const ANIM_NOISE: u32 = 16u;
const ANIM_OCEAN: u32 = 32u;

struct VertexInput {
  @location(0) position: vec3f,
  @location(1) normal: vec3f,
  @location(2) uv: vec2f,
};

struct VertexOutput {
  @location(0) shadowPos: vec4f,
  @location(1) fragPos: vec3f,
  @location(2) fragNorm: vec3f,
  @location(3) uv: vec2f,
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

// Vertex animation (position only, normals ignored)
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

    // 1. Take meshA position
    var pos = input.position;

    // 2. Apply vertex animation if needed
    if (u32(vertexAnim.flags) != 0u && vertexAnim.globalIntensity > 0.0) {
        pos = applyVertexAnimation(pos);
    }

    // 3. Transform to world space
    let worldPos = model.modelMatrix * vec4f(pos, 1.0);

    // 4. Transform normal
    let normalMatrix = mat3x3f(
        model.modelMatrix[0].xyz,
        model.modelMatrix[1].xyz,
        model.modelMatrix[2].xyz
    );

    //  let worldNormal = (model.modelMatrix * vec4f(-input.normal, 0.0)).xyz;
    //  output.fragNorm = normalize(worldNormal);

    // 5. Fill all outputs exactly like your working shader
    output.Position  = scene.cameraViewProjMatrix * worldPos;
    output.fragPos   = worldPos.xyz;
    output.shadowPos = scene.lightViewProjMatrix * worldPos;
    output.fragNorm  = normalize(normalMatrix * input.normal); // correct input
    output.uv        = input.uv;

    return output;
}
`;


export const vertexMorphShadowWGSL = /* wgsl */`
struct Scene {
  lightViewProjMatrix: mat4x4f,
  cameraViewProjMatrix: mat4x4f,
}

struct Model {
  modelMatrix: mat4x4f,
}

struct VertexAnimParams {
  time: f32,
  flags: f32,
  globalIntensity: f32,
  _pad0: f32,
  
  // Wave [4-7]
  waveSpeed: f32,
  waveAmplitude: f32,
  waveFrequency: f32,
  _pad1: f32,
  
  // Wind [8-11]
  windSpeed: f32,
  windStrength: f32,
  windHeightInfluence: f32,
  windTurbulence: f32,
  
  // Pulse [12-15]
  pulseSpeed: f32,
  pulseAmount: f32,
  pulseCenterX: f32,
  pulseCenterY: f32,
  
  // Twist [16-19]
  twistSpeed: f32,
  twistAmount: f32,
  _pad2: f32,
  _pad3: f32,
  
  // Noise [20-23]
  noiseScale: f32,
  noiseStrength: f32,
  noiseSpeed: f32,
  _pad4: f32,
  
  // Ocean [24-27]
  oceanWaveScale: f32,
  oceanWaveHeight: f32,
  oceanWaveSpeed: f32,
  _pad5: f32,
}

@group(0) @binding(0) var<uniform> scene: Scene;
@group(1) @binding(0) var<uniform> model: Model;
@group(1) @binding(2) var<uniform> vertexAnim: VertexAnimParams;
@group(1) @binding(3) var<uniform> u_morphBlend: f32;

const ANIM_WAVE: u32 = 1u;
const ANIM_WIND: u32 = 2u;
const ANIM_PULSE: u32 = 4u;
const ANIM_TWIST: u32 = 8u;
const ANIM_NOISE: u32 = 16u;
const ANIM_OCEAN: u32 = 32u;

struct VertexInput {
  @location(0) positionA: vec3f,
  @location(6) positionB: vec3f,
};

fn hash(p: vec2f) -> f32 {
  var p3 = fract(vec3f(p.x, p.y, p.x) * 0.13);
  p3 += dot(p3, vec3f(p3.y, p3.z, p3.x) + 3.333);
  return fract((p3.x + p3.y) * p3.z);
}

fn noise(p: vec2f) -> f32 {
  let i = floor(p);
  let f = fract(p);
  let u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i + vec2f(0.0, 0.0)), hash(i + vec2f(1.0, 0.0)), u.x),
    mix(hash(i + vec2f(0.0, 1.0)), hash(i + vec2f(1.0, 1.0)), u.x),
    u.y
  );
}

fn applyWave(pos: vec3f) -> vec3f {
  let wave = sin(pos.x * vertexAnim.waveFrequency + vertexAnim.time * vertexAnim.waveSpeed) *
             cos(pos.z * vertexAnim.waveFrequency + vertexAnim.time * vertexAnim.waveSpeed);
  return vec3f(pos.x, pos.y + wave * vertexAnim.waveAmplitude, pos.z);
}

fn applyWind(pos: vec3f) -> vec3f {
  let heightFactor = max(0.0, pos.y) * vertexAnim.windHeightInfluence;
  let windDir = vec2f(
    sin(vertexAnim.time * vertexAnim.windSpeed),
    cos(vertexAnim.time * vertexAnim.windSpeed * 0.7)
  ) * vertexAnim.windStrength;
  let turbulence = noise(vec2f(pos.x, pos.z) * 0.5 + vertexAnim.time * 0.3) * vertexAnim.windTurbulence;
  return vec3f(
    pos.x + windDir.x * heightFactor * (1.0 + turbulence),
    pos.y,
    pos.z + windDir.y * heightFactor * (1.0 + turbulence)
  );
}

fn applyPulse(pos: vec3f) -> vec3f {
  let pulse = sin(vertexAnim.time * vertexAnim.pulseSpeed) * vertexAnim.pulseAmount;
  let scale = 1.0 + pulse;
  let center = vec3f(vertexAnim.pulseCenterX, 0.0, vertexAnim.pulseCenterY);
  return center + (pos - center) * scale;
}

fn applyTwist(pos: vec3f) -> vec3f {
  let angle = pos.y * vertexAnim.twistAmount * sin(vertexAnim.time * vertexAnim.twistSpeed);
  let cosA = cos(angle);
  let sinA = sin(angle);
  return vec3f(
    pos.x * cosA - pos.z * sinA,
    pos.y,
    pos.x * sinA + pos.z * cosA
  );
}

fn applyNoiseDisplacement(pos: vec3f) -> vec3f {
  let noiseVal = noise(vec2f(pos.x, pos.z) * vertexAnim.noiseScale + vertexAnim.time * vertexAnim.noiseSpeed);
  let displacement = (noiseVal - 0.5) * vertexAnim.noiseStrength;
  return vec3f(pos.x, pos.y + displacement, pos.z);
}

fn applyOcean(pos: vec3f) -> vec3f {
  let t = vertexAnim.time * vertexAnim.oceanWaveSpeed;
  let scale = vertexAnim.oceanWaveScale;
  let wave1 = sin(dot(pos.xz, vec2f(1.0, 0.0)) * scale + t) * vertexAnim.oceanWaveHeight;
  let wave2 = sin(dot(pos.xz, vec2f(0.7, 0.7)) * scale * 1.2 + t * 1.3) * vertexAnim.oceanWaveHeight * 0.7;
  let wave3 = sin(dot(pos.xz, vec2f(0.0, 1.0)) * scale * 0.8 + t * 0.9) * vertexAnim.oceanWaveHeight * 0.5;
  return vec3f(pos.x, pos.y + wave1 + wave2 + wave3, pos.z);
}

fn applyVertexAnimation(pos: vec3f) -> vec3f {
  var p = pos;
  let flags = u32(vertexAnim.flags);
  
  if ((flags & ANIM_WAVE) != 0u) { p = applyWave(p); }
  if ((flags & ANIM_WIND) != 0u) { p = applyWind(p); }
  if ((flags & ANIM_NOISE) != 0u) { p = applyNoiseDisplacement(p); }
  if ((flags & ANIM_OCEAN) != 0u) { p = applyOcean(p); }
  if ((flags & ANIM_PULSE) != 0u) { p = applyPulse(p); }
  if ((flags & ANIM_TWIST) != 0u) { p = applyTwist(p); }

  return mix(pos, p, vertexAnim.globalIntensity);
}

@vertex
fn main(input: VertexInput) -> @builtin(position) vec4f {
  // 1. Morph positions
  // let blendedPosition = mix(input.positionA, input.positionB, u_morphBlend);
  let blendedPosition = input.positionA;
  
  // 2. Apply the same vertex animations
  var finalPos = blendedPosition;
  if (u32(vertexAnim.flags) != 0u && vertexAnim.globalIntensity > 0.0) {
    finalPos = applyVertexAnimation(finalPos);
  }

  // 3. Transform to world space and light clip space
  let worldPos = model.modelMatrix * vec4f(finalPos, 1.0);
  return scene.lightViewProjMatrix * worldPos;
}
`;