export const flameEffect = /* wgsl */`struct Camera {
  viewProj : mat4x4<f32>
};
@group(0) @binding(0) var<uniform> camera : Camera;

struct ModelData {
  model : mat4x4<f32>,
  time : vec4<f32>,
  intensity : vec4<f32>,
};
@group(0) @binding(1) var<storage, read> modelDataArray : array<ModelData>;

struct VSIn {
  @location(0) position : vec3<f32>,
  @location(1) uv : vec2<f32>,
  @builtin(instance_index) instanceIdx : u32,
};

struct VSOut {
  @builtin(position) position : vec4<f32>,
  @location(0) uv : vec2<f32>,
  @location(1) time : f32,
  @location(2) intensity : f32,
};

@vertex
fn vsMain(input : VSIn) -> VSOut {
  var output : VSOut;
  let data = modelDataArray[input.instanceIdx];

  let worldPos = data.model * vec4<f32>(input.position, 1.0);
  output.position = camera.viewProj * worldPos;
  output.uv = input.uv;
  output.time = data.time.x;
  output.intensity = data.intensity.x;
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
    mix(hash(i + vec2<f32>(0.0,0.0)), hash(i + vec2<f32>(1.0,0.0)), u.x),
    mix(hash(i + vec2<f32>(0.0,1.0)), hash(i + vec2<f32>(1.0,1.0)), u.x),
    u.y
  );
}

@fragment
fn fsMain(input : VSOut) -> @location(0) vec4<f32> {
  var uv = input.uv;
  let t = input.time * 2.0;

  // Animate upward
  uv.y += t * 0.4;
  uv.x += sin(t * 0.7) * 0.1;

  var n = noise(uv * 6.0 + vec2<f32>(0.0, t * 0.8));
  n = pow(n, 3.0); // sharper flame texture

  let baseColor = input.color.rgb;
  let intensity = input.intensity;
  let alphaBase = input.color.a;

  // color and intensity modulation
  var finalColor = baseColor * n * intensity;

  // smooth alpha mask
  let alpha = smoothstep(0.1, 0.7, n) * alphaBase;

  // output with premultiplied color (for additive/soft blending)
  return vec4<f32>(finalColor * alpha, alpha);
}
`;
