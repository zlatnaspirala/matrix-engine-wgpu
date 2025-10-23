export const flameEffectInstance = `struct Camera {
  viewProj : mat4x4<f32>
};
@group(0) @binding(0) var<uniform> camera : Camera;

// Array of particle instances
struct ModelData {
  model : mat4x4<f32>,
  time : vec4<f32>,       // x = time
  intensity : vec4<f32>,  // x = intensity
  color : vec4<f32>,      // rgba color
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
  @location(3) @interpolate(flat) instanceIdx : u32,
};

@vertex
fn vsMain(input : VSIn) -> VSOut {
  var output : VSOut;
  let modelData = modelDataArray[input.instanceIdx];
  let worldPos = modelData.model * vec4<f32>(input.position, 1.0);
  output.position = camera.viewProj * worldPos;
  output.uv = input.uv;
  output.time = modelData.time.x;
  output.intensity = modelData.intensity.x;
  output.instanceIdx = input.instanceIdx;
  return output;
}

// Simple procedural flame noise (value in 0..1)
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

// Flame color gradient: black -> red -> orange -> yellow -> white
fn flameColor(n: f32) -> vec3<f32> {
  if (n < 0.3) {
    return vec3<f32>(n * 3.0, 0.0, 0.0);               // dark red
  } else if (n < 0.6) {
    return vec3<f32>(1.0, (n - 0.3) * 3.33, 0.0);      // red -> orange
  } else {
    return vec3<f32>(1.0, 1.0, (n - 0.6) * 2.5);       // orange -> yellow -> white
  }
}

@fragment
fn fsMain(in : VSOut) -> @location(0) vec4<f32> {
  // Read per-instance data
  let modelData = modelDataArray[in.instanceIdx];
  let baseColor = modelData.color.xyz;
  let instanceAlpha = modelData.color.w;
  let instIntensity = max(0.0, modelData.intensity.x);

  // time with small instance offset
  let t = in.time * 2.0 + f32(in.instanceIdx) * 0.13;

  var uv = in.uv;
  uv.y += t * 0.2;

  // procedural noise
  var n = noise(uv * 5.0 + vec2<f32>(0.0, t * 0.5));
  // keep some brightness: milder sharpening than pow(n,3)
  n = pow(n, 1.5);

  // base flame color from gradient
  let grad = flameColor(n);

  let userColor = modelData.color.xyz;

  // mix ratio (0.0 = pure red, 1.0 = user color)
  let mixFactor = 0.5;
  let mixedColor = mix(grad, userColor, mixFactor);

  // flicker multipliers (shifted into positive range)
  let flickR = 0.7 + 0.3 * sin(t * 3.0); // 0.4 .. 1.0
  let flickG = 0.6 + 0.4 * cos(t * 2.0); // 0.2 .. 1.0
  let flickB = 0.8 + 0.2 * sin(t * 1.5); // 0.6 .. 1.0

  // combine gradient with per-instance baseColor and flicker
  // var color = grad * baseColor * vec3<f32>(flickR, flickG, flickB);
  var color = mixedColor * vec3<f32>(flickR, flickG, flickB);

  // apply instance/global intensity
  color = color * instIntensity;

  // soft alpha based on noise and instance alpha
  var alpha = smoothstep(0.0, 0.6, n) * instanceAlpha * instIntensity;

  // final clamp to avoid negative or NaN values
  color = clamp(color, vec3<f32>(0.0), vec3<f32>(10.0)); // allow HDR-like values for additive blending
  alpha = clamp(alpha, 0.0, 1.0);

  return vec4<f32>(color, alpha);
}
`;
