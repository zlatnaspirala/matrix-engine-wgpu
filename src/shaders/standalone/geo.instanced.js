export const geoInstancedEffect = `struct Camera {
  viewProjMatrix : mat4x4<f32>,
};
@group(0) @binding(0) var<uniform> camera : Camera;

// --- INSTANCE STORAGE BUFFER ----------------------------------------------
struct InstanceData {
  model : mat4x4<f32>,
  color : vec4<f32>,
};
@group(0) @binding(1) var<storage, read> instances : array<InstanceData>;

struct VertexInput {
  @location(0) position : vec3<f32>,
  @location(1) uv       : vec2<f32>,
};

struct VSOut {
  @builtin(position) Position : vec4<f32>,
  @location(0) v_uv : vec2<f32>,
  @location(1) v_color : vec4<f32>,
};

@vertex
fn vsMain(input : VertexInput, @builtin(instance_index) instanceIndex: u32) -> VSOut {
  var out : VSOut;

  // Use per-instance model matrix & color
  let modelMatrix = instances[instanceIndex].model;
  let color = instances[instanceIndex].color;

  let worldPos = modelMatrix * vec4<f32>(input.position,1.0);
  out.Position = camera.viewProjMatrix * worldPos;
  out.v_uv = input.uv;
  out.v_color = color;
  return out;
}

@fragment
fn fsMain(input : VSOut) -> @location(0) vec4<f32> {
  let uv = input.v_uv * 2.0 - vec2<f32>(1.0, 1.0);
  let dist = length(uv);
  let glow = exp(-dist * 1.0);
  let baseColor = vec3<f32>(0.2, 0.7, 1.0);
  let glowColor = vec3<f32>(0.7, 0.9, 1.0);
  let color = mix(baseColor, glowColor, glow) * glow * input.v_color.rgb;
  let alpha = input.v_color.a;
  return vec4<f32>(color, alpha);
}
`;