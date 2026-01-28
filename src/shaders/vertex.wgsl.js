export let vertexWGSL = `const MAX_BONES = 100u;

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

@group(0) @binding(0) var<uniform> scene : Scene;
@group(1) @binding(0) var<uniform> model : Model;
@group(1) @binding(1) var<uniform> bones : Bones;

struct VertexOutput {
  @location(0) shadowPos: vec4f,
  @location(1) fragPos: vec3f,
  @location(2) fragNorm: vec3f,
  @location(3) uv: vec2f,
  @builtin(position) Position: vec4f,
}

fn skinVertex(pos: vec4f, nrm: vec3f, joints: vec4<u32>, weights: vec4f) -> SkinResult {
    var skinnedPos = vec4f(0.0);
    var skinnedNorm = vec3f(0.0);
    for (var i: u32 = 0u; i < 4u; i = i + 1u) {
        let jointIndex = joints[i];
        let w = weights[i];
        if (w > 0.0) {
          let boneMat = bones.boneMatrices[jointIndex];
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

// Add to your uniform structs at the top
struct VertexAnimParams {
  time: f32,
  enabled: f32,  // 0.0 = OFF, 1.0 = ON
  waveSpeed: f32,
  waveAmplitude: f32,
  waveFrequency: f32,
  noiseScale: f32,
  noiseStrength: f32,
  _padding: f32,
}

@group(1) @binding(2) var<uniform> vertexAnim : VertexAnimParams;

// Basic wave function - good starting point
fn applyWave(pos: vec3f, time: f32) -> vec3f {
  let wave = sin(pos.x * vertexAnim.waveFrequency + time * vertexAnim.waveSpeed) * 
             cos(pos.z * vertexAnim.waveFrequency + time * vertexAnim.waveSpeed);
  return vec3f(pos.x, pos.y + wave * vertexAnim.waveAmplitude, pos.z);
}

// Simple noise function (you can replace with texture sampling later)
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

// Apply noise-based displacement
fn applyNoiseDisplacement(pos: vec3f, time: f32) -> vec3f {
  let noiseVal = noise(vec2f(pos.x, pos.z) * vertexAnim.noiseScale + time * 0.5);
  let displacement = (noiseVal - 0.5) * vertexAnim.noiseStrength;
  return vec3f(pos.x, pos.y + displacement, pos.z);
}

// Combined vertex animation function
fn applyVertexAnimation(pos: vec3f, normal: vec3f, time: f32) -> SkinResult {
  var animatedPos = pos;
  var animatedNorm = normal;
  
  // Apply wave
  animatedPos = applyWave(animatedPos, time);
  
  // Apply noise on top
  animatedPos = applyNoiseDisplacement(animatedPos, time);
  
  // Recalculate normal for proper lighting (approximate)
  let offset = 0.01;
  let posX = applyWave(applyNoiseDisplacement(pos + vec3f(offset, 0.0, 0.0), time), time);
  let posZ = applyWave(applyNoiseDisplacement(pos + vec3f(0.0, 0.0, offset), time), time);
  
  let tangentX = normalize(posX - animatedPos);
  let tangentZ = normalize(posZ - animatedPos);
  animatedNorm = normalize(cross(tangentZ, tangentX));
  
  return SkinResult(vec4f(animatedPos, 1.0), animatedNorm);
}

@vertex
fn main(
  @location(0) position: vec3f,
  @location(1) normal: vec3f,
  @location(2) uv: vec2f,
  @location(3) joints: vec4<u32>,
  @location(4) weights: vec4<f32>
) -> VertexOutput {
  var output : VertexOutput;
  var pos = vec4(position, 1.0);
  var nrm = normal;
  
  // Apply skinning first
  let skinned = skinVertex(pos, nrm, joints, weights);
  
  var finalPos = skinned.position.xyz;
  var finalNorm = skinned.normal;
  
  // Only apply animation if enabled > 0.5 (simple check)
  if (vertexAnim.enabled > 0.5) {
    let animated = applyVertexAnimation(finalPos, finalNorm, vertexAnim.time);
    finalPos = animated.position.xyz;
    finalNorm = animated.normal;
  }
  
  let worldPos = model.modelMatrix * vec4f(finalPos, 1.0);
  let normalMatrix = mat3x3f(
    model.modelMatrix[0].xyz,
    model.modelMatrix[1].xyz,
    model.modelMatrix[2].xyz
  );
  
  output.Position = scene.cameraViewProjMatrix * worldPos;
  output.fragPos = worldPos.xyz;
  output.shadowPos = scene.lightViewProjMatrix * worldPos;
  output.fragNorm = normalize(normalMatrix * finalNorm);
  output.uv = uv;
  
  return output;
}`;