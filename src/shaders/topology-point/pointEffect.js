export const pointEffectShader = `struct Camera {
  viewProj : mat4x4<f32>
};
@group(0) @binding(0) var<uniform> camera : Camera;

struct ModelData {
  model : mat4x4<f32>,  // ✅ ADD MODEL MATRIX
};
@group(0) @binding(1) var<uniform> modelData : ModelData;

struct PointSettings {
  pointSize : f32,
  _padding : vec3<f32>,
};
@group(0) @binding(2) var<uniform> pointSettings : PointSettings;  // ✅ Move to binding 2

struct VSIn {
  @location(0) centerPos : vec3<f32>,
  @location(1) color : vec3<f32>,
  @builtin(vertex_index) vertexIdx : u32,
  @builtin(instance_index) instanceIdx : u32,
};

struct VSOut {
  @builtin(position) position : vec4<f32>,
  @location(0) color : vec3<f32>,
  @location(1) uv : vec2<f32>
};

@vertex
fn vsMain(input : VSIn) -> VSOut {
  var output : VSOut;
  
  let worldPos = modelData.model * vec4<f32>(input.centerPos, 1.0);
  let clipPos = camera.viewProj * worldPos;
  
  let corners = array<vec2<f32>, 4>(
    vec2(-1.0, -1.0),
    vec2( 1.0, -1.0),
    vec2(-1.0,  1.0),
    vec2( 1.0,  1.0)
  );
  
  // ✅ Generate UV coordinates (0-1 range)
  let uvs = array<vec2<f32>, 4>(
    vec2(0.0, 0.0),
    vec2(1.0, 0.0),
    vec2(0.0, 1.0),
    vec2(1.0, 1.0)
  );
  
  let offset = corners[input.vertexIdx] * pointSettings.pointSize;
  
  let viewportSize = vec2<f32>(1920.0, 1080.0);
  let ndcOffset = offset / viewportSize * 2.0;
  
  output.position = vec4<f32>(
    clipPos.xy + ndcOffset * clipPos.w,
    clipPos.z,
    clipPos.w
  );
  
  output.color = input.color;
  output.uv = uvs[input.vertexIdx];  // ✅ Pass UV
  return output;
}

@fragment
fn fsMain(input : VSOut) -> @location(0) vec4<f32> {
  let color = input.color * 0.5 + 0.5;
  
  // ✅ Circular point using UV
  let center = vec2<f32>(0.5, 0.5);
  let dist = length(input.uv - center);
  let alpha = 1.0 - smoothstep(0.4, 0.5, dist);
  
  // Discard pixels outside circle
  if (alpha < 0.01) {
    discard;
  }
  
  return vec4<f32>(color * alpha, alpha);
}`;