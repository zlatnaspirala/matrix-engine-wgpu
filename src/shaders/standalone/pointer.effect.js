export const pointerEffect = `
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
  // Center the UVs (0.0–1.0 → -1.0–1.0)
  let uv = input.v_uv * 2.0 - vec2<f32>(1.0, 1.0);

  // Distance from center
  let dist = length(uv);

  // Glow falloff
  let glow = exp(-dist * 1.0); // try values 3.0–6.0 for tighter glow

  // Gradient color (inner bright → outer dim)
  let baseColor = vec3<f32>(0.2, 0.7, 1.0);
  let glowColor = vec3<f32>(0.7, 0.9, 1.0);

  // Blend based on glow strength
  let color = mix(baseColor, glowColor, glow) * glow;

  return vec4<f32>(color, 1.0);
}`;