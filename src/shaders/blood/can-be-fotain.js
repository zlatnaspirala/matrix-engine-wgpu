export const bloodBurstShader = `
// struct Instance {
//   model: mat4x4<f32>,
//   life: f32,
//   maxLife: f32,
//   pad0: f32,
//   pad1: f32,
//   color: vec4<f32>,
// };

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
  let edge = smoothstep(0.5, 0.35, d); // soft round droplet falloff
  let alpha = input.color.a * edge;
  if (alpha < 0.01) { discard; }

  return FragOut(
    vec4f(input.color.rgb, alpha),
    vec4f(input.fragNorm, 0.0),
    vec4f(input.fragPos, 1.0)
  );
}`