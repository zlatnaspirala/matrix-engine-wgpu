export const trailFragment = `// trailEffect.wgsl
// Simple GPU trail effect shader (additive + fade along trail)

struct Camera {
  viewProjMatrix : mat4x4<f32>,
};

struct TrailParams {
  color : vec4f,        // RGBA color of trail
  fadeLength : f32,     // fade intensity along trail
  time : f32,           // can be used for animation
  padding : vec2f,
};

@group(0) @binding(0) var<uniform> camera : Camera;
@group(0) @binding(1) var<uniform> trail : TrailParams;

struct VSIn {
  @location(0) position : vec3f,
  @location(1) uv : vec2f,
};

struct VSOut {
  @builtin(position) Position : vec4f,
  @location(0) uv : vec2f,
};

@vertex
fn vsMain(input : VSIn) -> VSOut {
  var output : VSOut;
  output.Position = camera.viewProjMatrix * vec4f(input.position, 1.0);
  output.uv = input.uv;
  return output;
}

@fragment
fn fsMain(input : VSOut) -> @location(0) vec4f {
  // fade along trail direction using uv.x
  let fadeFactor = clamp(1.0 - input.uv.x * trail.fadeLength, 0.0, 1.0);

  // pulsating or time-based variation
  let pulse = 0.5 + 0.5 * sin(trail.time * 4.0);

  // final color
  let finalColor = trail.color.rgb * fadeFactor * pulse;
  let finalAlpha = trail.color.a * fadeFactor;

  return vec4f(finalColor, finalAlpha);
}`;