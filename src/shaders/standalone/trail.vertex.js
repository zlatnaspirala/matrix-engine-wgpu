export const trailVertex = `
// trailEffect.wgsl

// Minimal, independent trail effect shader (additive glow + fade)

struct Camera {
  viewProjMatrix : mat4x4<f32>,
};

struct TrailUniform {
  color : vec3f,
  alpha : f32,
  time  : f32,
  length : f32,
};

@group(0) @binding(0) var<uniform> camera : Camera;
@group(0) @binding(1) var<uniform> trail : TrailUniform;

// -------------------- VERTEX SHADER --------------------
struct VertexInput {
  @location(0) position : vec3f,
  @location(1) uv       : vec2f,
};

struct VertexOutput {
  @builtin(position) Position : vec4f,
  @location(0) uv             : vec2f,
};

@vertex
fn vsMain(input : VertexInput) -> VertexOutput {
  var output : VertexOutput;
  output.Position = camera.viewProjMatrix * vec4f(input.position, 1.0);
  output.uv = input.uv;
  return output;
}

// -------------------- FRAGMENT SHADER --------------------
@fragment
fn fsMain(input : VertexOutput) -> @location(0) vec4f {
  let baseColor = trail.color;

  // simple fade along trail + subtle time-based pulsation
  let fade = 1.0 - input.uv.x;
  let pulse = 0.5 + 0.5 * sin(trail.time * 8.0);

  let color = baseColor * (fade * pulse + 0.3);
  let alpha = trail.alpha * fade;

  return vec4f(color, alpha);
}`;