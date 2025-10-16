export const hpBarEffectShaders = `
struct Camera {
  viewProj : mat4x4f
};
struct Model {
  model : mat4x4f,
  color : vec4f,
  progress : f32,
};

@group(0) @binding(0) var<uniform> camera : Camera;
@group(0) @binding(1) var<uniform> model : Model;

struct VertexOutput {
  @builtin(position) position : vec4f,
  @location(0) uv : vec2f,
};

@vertex
fn vsMain(
  @location(0) position : vec3f,
  @location(1) uv : vec2f
) -> VertexOutput {
  var output : VertexOutput;
  output.position = camera.viewProj * model.model * vec4f(position, 1.0);
  output.uv = uv;
  return output;
}

@fragment
fn fsMain(in : VertexOutput) -> @location(0) vec4f {
  // simple left-to-right fill based on progress
  if (in.uv.x > model.progress) {
    return vec4f(0.1, 0.1, 0.1, 0.3); // empty (transparent gray)
  }
  return model.color; // filled
}
`;