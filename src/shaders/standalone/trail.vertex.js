export const trailVertex = `

struct Camera {
  viewProjMatrix : mat4x4<f32>,
};
@group(0) @binding(0) var<uniform> camera : Camera;

struct Model {
  modelMatrix : mat4x4<f32>,
};
@group(0) @binding(1) var<uniform> model : Model;

struct VertexInput {
  @location(0) position : vec3<f32>,
  @location(1) uv       : vec2<f32>,
};

struct VSOut {
  @builtin(position) Position : vec4<f32>,
  @location(0) v_uv : vec2<f32>,
};

@vertex
fn vsMain(input : VertexInput) -> VSOut {
  var out : VSOut;
  let worldPos = model.modelMatrix * vec4<f32>(input.position,1.0);
  out.Position = camera.viewProjMatrix * worldPos;
  out.v_uv = input.uv;
  return out;
}

@fragment
fn fsMain(input : VSOut) -> @location(0) vec4<f32> {
  return vec4<f32>(0.2,0.7,1.0,1.0);
}`;