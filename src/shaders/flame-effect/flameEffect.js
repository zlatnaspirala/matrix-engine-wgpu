export const flameEffect = /* wgsl */`
struct Camera {
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
  @interpolate(flat) @location(3) instanceIdx : u32,
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
  output.instanceIdx = input.instanceIdx;
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
  // Add slight phase offset per instance
  let idOffset = f32(input.instanceIdx) * 0.37;
  let t = input.time * 2.0 + idOffset;

  var uv = input.uv;
  // Make flame “move upward”
  uv.y += t * 0.4;
  // Slight horizontal offset
  uv.x += sin(t * 0.7 + f32(input.instanceIdx)) * 0.1;

  var n = noise(uv * 6.0 + vec2<f32>(0.0, t * 0.8));
  n = pow(n, 3.0); // Sharpen flame noise

  // Flame color gradient
  let intensity = input.intensity;
  var color = vec3<f32>(
    n * 2.5,
    n * (1.2 + 0.4 * sin(idOffset)),
    n * 0.25
  );
  color *= intensity;

  // Glow and transparency
  let alpha = smoothstep(0.1, 0.6, n);
  return vec4<f32>(color, alpha);
}
`;
