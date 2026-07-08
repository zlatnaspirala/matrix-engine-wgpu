export const bloodBurstShader = `
struct Camera {
  viewProj : mat4x4<f32>
};

@group(0) @binding(0) var<uniform> camera : Camera;

struct ModelData {
  model : mat4x4<f32>,
  life  : vec4<f32>, // x=life, y=maxLife, z=pad, w=pad
  color : vec4<f32>
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
  @location(1) color : vec4<f32>,
  @location(2) fragNorm : vec3<f32>,
  @location(3) fragPos  : vec3<f32>,
};

fn hash2(n : vec2<f32>) -> f32 {
  return fract(sin(dot(n, vec2<f32>(12.9898, 78.233))) * 43758.5453);
}

fn noise(p : vec2<f32>) -> f32 {
  let i = floor(p); let f = fract(p);
  let u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash2(i + vec2<f32>(0.0,0.0)), hash2(i + vec2<f32>(1.0,0.0)), u.x),
    mix(hash2(i + vec2<f32>(0.0,1.0)), hash2(i + vec2<f32>(1.0,1.0)), u.x),
    u.y
  );
}

@vertex
fn vsMain(input : VSIn) -> VSOut {
  var output : VSOut;
  let modelData = modelDataArray[input.instanceIdx];

  let worldPos = modelData.model * vec4<f32>(input.position, 1.0);
  output.position = camera.viewProj * worldPos;
  output.uv = input.uv;
  output.color = modelData.color;

  output.fragPos = worldPos.xyz;
  let localNormal = vec3<f32>(0.0, 0.0, 1.0);
  output.fragNorm = mat3x3f(modelData.model[0].xyz, modelData.model[1].xyz, modelData.model[2].xyz) * localNormal;

  return output;
}

struct FragOut {
  @location(0) color    : vec4f,
  @location(1) normal   : vec4f,
  @location(2) worldPos : vec4f,
}
@fragment
fn fsMain(input : VSOut) -> FragOut {
  let centered = input.uv - vec2<f32>(0.5, 0.5);
  let d = length(centered);

  // irregular blob edge — warp the distance field with noise instead of a clean circle
  let angle = atan2(centered.y, centered.x);
  let wobble = noise(vec2<f32>(angle * 2.5, d * 4.0)) * 0.18;
  let edge = smoothstep(0.5, 0.28, d + wobble);

  // internal density variation so it doesn't read as a flat solid disc
  let density = 0.65 + 0.35 * noise(input.uv * 6.0);
  let alpha = input.color.a * edge * density;
  if (alpha < 0.02) { discard; }

  // slight dark core / lighter rim gives it volume instead of flat fill
  let rim = smoothstep(0.0, 0.5, d);
  let shaded = mix(input.color.rgb * 1.3, input.color.rgb * 0.6, rim);

  return FragOut(
    vec4f(shaded, alpha),
    vec4f(input.fragNorm, 0.0),
    vec4f(input.fragPos, 1.0)
  );
}`