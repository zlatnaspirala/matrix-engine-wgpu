export const cryptoGridShader = `
struct Camera { viewProj : mat4x4<f32> };
@group(0) @binding(0) var<uniform> camera : Camera;

struct GridParams {
  baseModel: mat4x4<f32>,
  timeSteps: u32,
  coinCount: u32,
  spacing: f32,
  cubeHeight: f32,
  time: f32,
};
@group(0) @binding(1) var<storage, read> instances: array<vec4<f32>>;
@group(0) @binding(2) var<uniform> grid: GridParams;

struct VSIn {
  @location(0) position : vec3<f32>,
  @location(1) normal   : vec3<f32>,
  @builtin(instance_index) idx : u32,
};
struct VSOut {
  @builtin(position) position : vec4<f32>,
  @location(0) color    : vec3<f32>,
  @location(1) fragNorm : vec3<f32>,
  @location(2) fragPos  : vec3<f32>,
  @location(3) localY   : f32,
};

@vertex
fn vsMain(input : VSIn) -> VSOut {
  var out : VSOut;
  let inst = instances[input.idx];
  let t = input.idx % grid.timeSteps;
  let c = input.idx / grid.timeSteps;

  let h = max(inst.a, 0.02) * grid.cubeHeight;
  let pulse = 1.0 + 0.06 * sin(grid.time * 2.5 + f32(input.idx) * 0.9);
  let local = vec3<f32>(input.position.x, input.position.y * h * pulse, input.position.z);
  let offset = vec3<f32>(
    f32(t) * grid.spacing - f32(grid.timeSteps) * grid.spacing * 0.5,
    0.0,
    f32(c) * grid.spacing - f32(grid.coinCount) * grid.spacing * 0.5,
  );

  let worldPos = grid.baseModel * vec4<f32>(local + offset, 1.0);
  out.position = camera.viewProj * worldPos;
  out.fragPos = worldPos.xyz;
  out.fragNorm = mat3x3f(grid.baseModel[0].xyz, grid.baseModel[1].xyz, grid.baseModel[2].xyz) * input.normal;
  out.color = inst.rgb;
  out.localY = input.position.y;
  return out;
}

struct FragOut {
  @location(0) color    : vec4f,
  @location(1) normal   : vec4f,
  @location(2) worldPos : vec4f,
}

@fragment
fn fsMain(input : VSOut) -> FragOut {
  let light = normalize(vec3<f32>(0.4, 1.0, 0.3));
  let ndotl = max(dot(normalize(input.fragNorm), light), 0.25);

  // flame-like gradient: darker base, glowing top, tinted by trend color
  let glow = mix(input.color * 0.35, input.color * 1.8, smoothstep(0.0, 1.0, input.localY));
  let shimmer = 1.0 + 0.15 * sin(grid.time * 4.0 + input.fragPos.x * 2.0);

  return FragOut(
    vec4f(glow * ndotl * shimmer, 1.0),
    vec4f(input.fragNorm, 0.0),
    vec4f(input.fragPos, 1.0)
  );
}`;