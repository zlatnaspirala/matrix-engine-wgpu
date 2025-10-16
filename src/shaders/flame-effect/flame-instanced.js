export const flameEffectInstance = `struct Camera {
  viewProj : mat4x4<f32>
};
@group(0) @binding(0) var<uniform> camera : Camera;

// Array of particle instances
struct ModelData {
  model : mat4x4<f32>,
  time : vec4<f32>,       // x = time
  intensity : vec4<f32>,  // x = intensity
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
  @location(3) @interpolate(flat) instanceIdx : u32,  // flat interpolation required
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
  output.instanceIdx = input.instanceIdx; // pass to fragment
  return output;
}

// Simple procedural flame noise
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

// Flame color gradient: black → red → orange → yellow → white
fn flameColor(n: f32) -> vec3<f32> {
  if (n < 0.3) {
    return vec3<f32>(n * 3.0, 0.0, 0.0);               // dark red
  } else if (n < 0.6) {
    return vec3<f32>(1.0, (n-0.3)*3.33, 0.0);          // red → orange
  } else {
    return vec3<f32>(1.0, 1.0, (n-0.6)*2.5);           // orange → yellow → white
  }
}

@fragment
fn fsMain(in : VSOut) -> @location(0) vec4<f32> {
  let t = in.time * 2.0 + f32(in.instanceIdx) * 0.13;

  var uv = in.uv;
  uv.y += t * 0.2;

  // procedural noise
  var n = noise(uv * 5.0 + vec2<f32>(0.0, t * 0.5));
  n = pow(n, 3.0); // sharpen

  // flame color mapping
  let r = n * 1.5 + n * 0.5 * sin(t * 3.0);       // red dominant
  let g = n * 0.8 * cos(t * 2.0);                 // green flicker
  let b = n * 0.2 + n * 0.1 * sin(t * 1.5);      // small blue component

  var color = vec3<f32>(r, g, b) * in.intensity;

  // soft alpha based on noise
  let alpha = smoothstep(0.0, 0.5, n);

  return vec4<f32>(color, alpha);
}
`;
