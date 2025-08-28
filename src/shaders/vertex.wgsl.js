export let vertexWGSL = `struct Scene {
  lightViewProjMatrix: mat4x4f,
  cameraViewProjMatrix: mat4x4f,
  lightPos: vec3f,
}

struct Model {
  modelMatrix: mat4x4f,
}

@group(0) @binding(0) var<uniform> scene : Scene;
@group(1) @binding(0) var<uniform> model : Model;

struct VertexOutput {
  @location(0) shadowPos: vec4f,  // now vec4
  @location(1) fragPos: vec3f,
  @location(2) fragNorm: vec3f,
  @location(3) uv: vec2f,
  @builtin(position) Position: vec4f,
}

@vertex
fn main(
  @location(0) position: vec3f,
  @location(1) normal: vec3f,
  @location(2) uv: vec2f
) -> VertexOutput {
  var output : VertexOutput;

  let posFromLight = scene.lightViewProjMatrix * model.modelMatrix * vec4(position, 1.0);
  output.shadowPos = posFromLight; // pass full vec4 for perspective divide

  let worldPos = model.modelMatrix * vec4(position, 1.0);
  output.Position = scene.cameraViewProjMatrix * worldPos;
  output.fragPos = worldPos.xyz;

  output.fragNorm = normalize((model.modelMatrix * vec4(normal, 0.0)).xyz);
  output.uv = uv;
  return output;
}`;