export let vertexWGSLInstanced = `const MAX_BONES = 100u;

struct Scene {
  lightViewProjMatrix: mat4x4f,
  cameraViewProjMatrix: mat4x4f,
  lightPos: vec3f,
}

struct Model {
  modelMatrix: mat4x4f,
}

struct Bones {
  boneMatrices : array<mat4x4f, MAX_BONES>
}

struct SkinResult {
  position : vec4f,
  normal   : vec3f,
};

struct InstanceData {
    model     : mat4x4<f32>,
    colorMult : vec4<f32>,
};

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
  displacementStrength: f32,
  displacementSpeed: f32,
  _pad6: f32,
  _pad7: f32,
}

@group(0) @binding(0) var<uniform> scene : Scene;
@group(1) @binding(0) var<storage, read> instances : array<InstanceData>;
@group(1) @binding(1) var<uniform> bones : Bones;
@group(1) @binding(2) var<uniform> vertexAnim : VertexAnimParams;

const ANIM_WAVE: u32  = 1u;
const ANIM_WIND: u32  = 2u;
const ANIM_PULSE: u32 = 4u;
const ANIM_TWIST: u32 = 8u;
const ANIM_NOISE: u32 = 16u;
const ANIM_OCEAN: u32 = 32u;

struct VertexOutput {
  @location(0) shadowPos: vec4f,
  @location(1) fragPos: vec3f,
  @location(2) fragNorm: vec3f,
  @location(3) uv: vec2f,
  @location(4) colorMult: vec4f,
  @builtin(position) Position: vec4f,
}

fn skinVertex(pos: vec4f, nrm: vec3f, joints: vec4<u32>, weights: vec4f) -> SkinResult {
    var skinnedPos  = vec4f(0.0);
    var skinnedNorm = vec3f(0.0);
    for (var i: u32 = 0u; i < 4u; i = i + 1u) {
        let jointIndex = joints[i];
        let w = weights[i];
        if (w > 0.0) {
          let boneMat  = bones.boneMatrices[jointIndex];
          skinnedPos  += (boneMat * pos) * w;
          let boneMat3 = mat3x3f(
            boneMat[0].xyz,
            boneMat[1].xyz,
            boneMat[2].xyz
          );
          skinnedNorm += (boneMat3 * nrm) * w;
        }
    }
    return SkinResult(skinnedPos, skinnedNorm);
}

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

fn applyWind(pos: vec3f, normal: vec3f) -> vec3f {
  let heightFactor = max(0.0, pos.y) * vertexAnim.windHeightInfluence;
  let windDir = vec2f(
    sin(vertexAnim.time * vertexAnim.windSpeed),
    cos(vertexAnim.time * vertexAnim.windSpeed * 0.7)
  ) * vertexAnim.windStrength;
  let turbulence = noise(vec2f(pos.x, pos.z) * 0.5 + vertexAnim.time * 0.3)
                   * vertexAnim.windTurbulence;
  return vec3f(
    pos.x + windDir.x * heightFactor * (1.0 + turbulence),
    pos.y,
    pos.z + windDir.y * heightFactor * (1.0 + turbulence)
  );
}

fn applyPulse(pos: vec3f) -> vec3f {
  let pulse = sin(vertexAnim.time * vertexAnim.pulseSpeed) * vertexAnim.pulseAmount;
  let scale  = 1.0 + pulse;
  let center = vec3f(vertexAnim.pulseCenterX, 0.0, vertexAnim.pulseCenterY);
  return center + (pos - center) * scale;
}

fn applyTwist(pos: vec3f) -> vec3f {
  let angle = pos.y * vertexAnim.twistAmount * sin(vertexAnim.time * vertexAnim.twistSpeed);
  let cosA  = cos(angle);
  let sinA  = sin(angle);
  return vec3f(
    pos.x * cosA - pos.z * sinA,
    pos.y,
    pos.x * sinA + pos.z * cosA
  );
}

fn applyNoiseDisplacement(pos: vec3f) -> vec3f {
  let noiseVal    = noise(vec2f(pos.x, pos.z) * vertexAnim.noiseScale
                         + vertexAnim.time * vertexAnim.noiseSpeed);
  let displacement = (noiseVal - 0.5) * vertexAnim.noiseStrength;
  return vec3f(pos.x, pos.y + displacement, pos.z);
}

fn applyOcean(pos: vec3f) -> vec3f {
  let t     = vertexAnim.time * vertexAnim.oceanWaveSpeed;
  let scale = vertexAnim.oceanWaveScale;
  let wave1 = sin(dot(pos.xz, vec2f(1.0, 0.0)) * scale + t)             * vertexAnim.oceanWaveHeight;
  let wave2 = sin(dot(pos.xz, vec2f(0.7, 0.7)) * scale * 1.2 + t * 1.3) * vertexAnim.oceanWaveHeight * 0.7;
  let wave3 = sin(dot(pos.xz, vec2f(0.0, 1.0)) * scale * 0.8 + t * 0.9) * vertexAnim.oceanWaveHeight * 0.5;
  return vec3f(pos.x, pos.y + wave1 + wave2 + wave3, pos.z);
}

fn applyVertexAnimation(pos: vec3f, normal: vec3f) -> SkinResult {
  var animatedPos  = pos;
  var animatedNorm = normal;
  let flags = u32(vertexAnim.flags);

  if ((flags & ANIM_WAVE)  != 0u) { animatedPos = applyWave(animatedPos); }
  if ((flags & ANIM_WIND)  != 0u) { animatedPos = applyWind(animatedPos, animatedNorm); }
  if ((flags & ANIM_NOISE) != 0u) { animatedPos = applyNoiseDisplacement(animatedPos); }
  if ((flags & ANIM_OCEAN) != 0u) { animatedPos = applyOcean(animatedPos); }
  if ((flags & ANIM_PULSE) != 0u) { animatedPos = applyPulse(animatedPos); }
  if ((flags & ANIM_TWIST) != 0u) { animatedPos = applyTwist(animatedPos); }

  animatedPos = mix(pos, animatedPos, vertexAnim.globalIntensity);

  if (flags != 0u) {
    let offset  = 0.01;
    let posX    = applyWave(applyNoiseDisplacement(pos + vec3f(offset, 0.0, 0.0)));
    let posZ    = applyWave(applyNoiseDisplacement(pos + vec3f(0.0, 0.0, offset)));
    let tangentX = normalize(posX - animatedPos);
    let tangentZ = normalize(posZ - animatedPos);
    animatedNorm = normalize(cross(tangentZ, tangentX));
  }

  return SkinResult(vec4f(animatedPos, 1.0), animatedNorm);
}

@vertex
fn main(
  @location(0) position : vec3f,
  @location(1) normal   : vec3f,
  @location(2) uv       : vec2f,
  @location(3) joints   : vec4<u32>,
  @location(4) weights  : vec4<f32>,
  @builtin(instance_index) instId: u32
) -> VertexOutput {

  let inst = instances[instId];

  var output : VertexOutput;
  let skinned  = skinVertex(vec4(position, 1.0), normal, joints, weights);
  let animated = applyVertexAnimation(skinned.position.xyz, skinned.normal);

  let worldPos = inst.model * animated.position;

  let normalMatrix = mat3x3f(
    inst.model[0].xyz,
    inst.model[1].xyz,
    inst.model[2].xyz
  );

  output.Position  = scene.cameraViewProjMatrix * worldPos;
  output.fragPos   = worldPos.xyz;
  output.shadowPos = scene.lightViewProjMatrix * worldPos;
  output.fragNorm  = normalize(normalMatrix * animated.normal);
  output.uv        = uv;
  output.colorMult = inst.colorMult;
  return output;
}`;