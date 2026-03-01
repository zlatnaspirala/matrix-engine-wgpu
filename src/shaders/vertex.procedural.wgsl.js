export const vertexMorphWGSL = /* wgsl */`
// Matches your existing vertex shader structure
struct Scene {
  lightViewProjMatrix: mat4x4f,
  cameraViewProjMatrix: mat4x4f,
  cameraPos: vec3f,
  padding2: f32,
  lightPos: vec3f,
  padding: f32,
  globalAmbient: vec3f,
  padding3: f32,
  time: f32,
  deltaTime: f32,
  padding4: vec2f,
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

struct Bones {
  boneMatrices : array<mat4x4f, 1>
}

// @group(0) @binding(0) var<uniform> scene : Scene;
// @group(1) @binding(0) var<uniform> model : Model;
@group(0) @binding(0) var<uniform> scene: Scene;
@group(1) @binding(0) var<uniform> model: Model;
@group(1) @binding(1) var<uniform> bones : Bones;
@group(1) @binding(2) var<uniform> vertexAnim: VertexAnimParams;
@group(1) @binding(3) var<uniform> u_morphBlend: f32;

struct VertexInput {
  @location(0) positionA: vec3<f32>,
  @location(1) normalA: vec3<f32>,
  @location(2) uv: vec2<f32>,
  @location(6) positionB: vec3<f32>,
  @location(7) normalB: vec3<f32>,
};

struct VertexOutput {
  @location(0) shadowPos: vec4f,
  @location(1) fragPos: vec3f,
  @location(2) fragNorm: vec3f,
  @location(3) uv: vec2f,
  @builtin(position) Position: vec4f,
}

@vertex
fn main(input: VertexInput) -> VertexOutput {
  var output: VertexOutput;
  
  // Morph blend between meshA and meshB
  let blendedPosition = mix(input.positionA, input.positionB, u_morphBlend);
  let blendedNormal = normalize(mix(input.normalA, input.normalB, u_morphBlend));
  
  // Transform to world space
  let worldPos = model.modelMatrix * vec4<f32>(blendedPosition, 1.0);
  
  // Normal transform
  let normalMatrix = mat3x3f(
    model.modelMatrix[0].xyz,
    model.modelMatrix[1].xyz,
    model.modelMatrix[2].xyz
  );
  
  output.Position = scene.cameraViewProjMatrix * worldPos;
  output.fragPos = worldPos.xyz;
  output.shadowPos = scene.lightViewProjMatrix * worldPos;
  output.fragNorm = normalize(normalMatrix * blendedNormal);
  output.uv = input.uv;
  
  return output;
}
`;