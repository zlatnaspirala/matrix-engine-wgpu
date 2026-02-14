export const flameEffect = /* wgsl */`

struct Camera {
  viewProj : mat4x4<f32>
};
@group(0) @binding(0) var<uniform> camera : Camera;

// Matches JS layout: mat4 (64 bytes) + time vec4 (16 bytes) + intensity vec4 (16 bytes)
struct ModelData {
  model     : mat4x4<f32>,
  time      : vec4<f32>,
  intensity : vec4<f32>,
};
@group(0) @binding(1) var<uniform> modelData : ModelData;

struct VSIn {
  @location(0) position : vec3<f32>,
  @location(1) uv       : vec2<f32>,
};

struct VSOut {
  @builtin(position) position : vec4<f32>,
  @location(0) uv        : vec2<f32>,
  @location(1) time      : f32,
  @location(2) intensity : f32,
};

@vertex
fn vsMain(input : VSIn) -> VSOut {
  var output : VSOut;

  let worldPos = modelData.model * vec4<f32>(input.position, 1.0);
  output.position = camera.viewProj * worldPos;
  output.uv        = input.uv;
  output.time      = modelData.time.x;
  output.intensity = modelData.intensity.x;
  return output;
}

// --- Simple procedural noise ---
fn hash(n : vec2<f32>) -> f32 {
  return fract(sin(dot(n, vec2<f32>(12.9898, 78.233))) * 43758.5453);
}

fn noise(p : vec2<f32>) -> f32 {
  let i = floor(p);
  let f = fract(p);
  let u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i + vec2<f32>(0.0, 0.0)), hash(i + vec2<f32>(1.0, 0.0)), u.x),
    mix(hash(i + vec2<f32>(0.0, 1.0)), hash(i + vec2<f32>(1.0, 1.0)), u.x),
    u.y
  );
}

@fragment
fn fsMain(input : VSOut) -> @location(0) vec4<f32> {
  var uv = input.uv;
  let t = input.time * 2.0;

  // Animate upward and sideways
  uv.y += t * 0.4;
  uv.x += sin(t * 0.7) * 0.1;

  var n = noise(uv * 6.0 + vec2<f32>(0.0, t * 0.8));
  n = pow(n, 3.0); // sharpen flame texture

  let intensity = input.intensity;

  // Flame palette: deep red core -> orange -> yellow tip
  let hotColor  = vec3<f32>(1.0, 0.9, 0.3);  // yellow-white
  let midColor  = vec3<f32>(1.0, 0.4, 0.05); // orange
  let coolColor = vec3<f32>(0.6, 0.05, 0.0); // deep red

  let t1 = smoothstep(0.0, 0.5, n);
  let t2 = smoothstep(0.5, 1.0, n);
  let baseColor = mix(mix(coolColor, midColor, t1), hotColor, t2);

  var finalColor = baseColor * n * intensity;

  // Fade out toward top (uv.y == 1) and edges (uv.x near 0 or 1)
  let edgeMask = smoothstep(0.0, 0.15, input.uv.x)
               * smoothstep(0.0, 0.15, 1.0 - input.uv.x);
  let topFade  = 1.0 - smoothstep(0.3, 1.0, input.uv.y);

  let alpha = smoothstep(0.1, 0.7, n) * edgeMask * topFade;

  // Premultiplied alpha for additive blending
  return vec4<f32>(finalColor * alpha, alpha);
}
`;