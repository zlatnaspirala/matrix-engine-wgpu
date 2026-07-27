export const shredderEffectInstance = `
struct Camera {
  viewProj : mat4x4<f32>
};
@group(0) @binding(0) var<uniform> camera : Camera;

struct ModelData {
  model     : mat4x4<f32>,
  timeSpeed : vec4<f32>,
  params    : vec4<f32>, // x: alpha, y: lifeFraction, z/w unused
  tint      : vec4<f32>  // xyz: color, w: unused
};
@group(0) @binding(1) var<storage, read> modelDataArray : array<ModelData>;

struct VSIn {
  @location(0) position : vec3<f32>,
  @location(1) normal   : vec3<f32>,
  @builtin(instance_index) instanceIdx : u32,
};

struct VSOut {
  @builtin(position) position : vec4<f32>,
  @location(0) color   : vec3<f32>,
  @location(1) alpha   : f32,
  @location(2) fragNorm: vec3<f32>,
  @location(3) fragPos : vec3<f32>,
};

@vertex
fn vsMain(input : VSIn) -> VSOut {
  var output : VSOut;
  let modelData = modelDataArray[input.instanceIdx];
  let worldPos = modelData.model * vec4<f32>(input.position, 1.0);
  output.position = camera.viewProj * worldPos;
  output.fragPos = worldPos.xyz;

  let normalMat = mat3x3f(modelData.model[0].xyz, modelData.model[1].xyz, modelData.model[2].xyz);
  output.fragNorm = normalize(normalMat * input.normal);

  output.color = modelData.tint.xyz;
  output.alpha = modelData.params.x;
  return output;
}

struct FragOut {
  @location(0) color    : vec4f,
  @location(1) normal   : vec4f,
  @location(2) worldPos : vec4f,
}

@fragment
fn fsMain(input : VSOut) -> FragOut {
  // simple facing-light shade so shards read as solid tumbling geometry
  let lightDir = normalize(vec3<f32>(0.4, 0.8, 0.3));
  let ndotl = max(dot(input.fragNorm, lightDir), 0.15);
  let shaded = input.color * ndotl * (0.6 + input.alpha * 0.8);

  return FragOut(
    vec4f(shaded, 1.0),
    vec4f(input.fragNorm, 0.0),
    vec4f(input.fragPos, 1.0)
  );
}
`;