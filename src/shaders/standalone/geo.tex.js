export const geoInstancedTexEffect = `
// === CAMERA & INSTANCE BUFFERS ============================================
struct Camera {
  viewProjMatrix : mat4x4<f32>,
};
@group(0) @binding(0) var<uniform> camera : Camera;

struct InstanceData {
  model : mat4x4<f32>,
  color : vec4<f32>,
};
@group(0) @binding(1) var<storage, read> instances : array<InstanceData>;

// === TEXTURE & SAMPLER ====================================================
@group(0) @binding(2) var mySampler : sampler;
@group(0) @binding(3) var myTexture : texture_2d<f32>;

// === VERTEX STAGE =========================================================
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
fn vsMain(input : VertexInput, @builtin(instance_index) instanceIndex : u32) -> VSOut {
  var out : VSOut;
  let inst = instances[instanceIndex];

  let worldPos = inst.model * vec4<f32>(input.position, 1.0);
  out.Position = camera.viewProjMatrix * worldPos;
  out.v_uv = input.uv;
  out.v_color = inst.color;
  return out;
}

// === FRAGMENT STAGE =======================================================
@fragment
fn fsMain(input : VSOut) -> @location(0) vec4<f32> {
  let texColor = textureSample(myTexture, mySampler, input.v_uv);

  let uv = input.v_uv * 2.0 - vec2<f32>(1.0, 1.0);
  let dist = length(uv);
  let glow = exp(-dist * 1.2);
  let glowColor = mix(vec3<f32>(0.2, 0.7, 1.0), vec3<f32>(0.8, 0.95, 1.0), glow);

  // More balanced color blending:
  let baseRGB = texColor.rgb * glowColor;
  let tintedRGB = mix(baseRGB, input.v_color.rgb, 0.8); // 0.8 gives strong tint influence
  let finalAlpha = texColor.a * input.v_color.a * glow;

  return vec4<f32>(tintedRGB, finalAlpha);
}
`;
