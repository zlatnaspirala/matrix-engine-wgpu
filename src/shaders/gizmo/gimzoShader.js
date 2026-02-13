export const gizmoEffect = `
struct Camera {
  viewProj : mat4x4<f32>
};
@group(0) @binding(0) var<uniform> camera : Camera;

struct ModelData {
  model : mat4x4<f32>,
};
@group(0) @binding(1) var<uniform> modelData : ModelData;

struct GizmoSettings {
  mode : u32,
  size : f32,
  selectedAxis : u32,
  lineThickness : f32,
};
@group(0) @binding(2) var<uniform> gizmoSettings : GizmoSettings;

struct VSIn {
  @location(0) position : vec3<f32>,
  @location(1) color : vec3<f32>,
};

struct VSOut {
  @builtin(position) position : vec4<f32>,
  @location(0) color : vec3<f32>,
  @location(1) worldPos : vec3<f32>,
  @location(2) axisId : f32,
};

@vertex
fn vsMain(input : VSIn) -> VSOut {
  var output : VSOut;
  
  let worldPos = modelData.model * vec4<f32>(input.position * gizmoSettings.size, 1.0);
  output.position = camera.viewProj * worldPos;
  output.worldPos = worldPos.xyz;
  
  // Determine which axis based on color
  var axisId = 0.0;
  if (input.color.r > 0.9) { axisId = 1.0; } // X axis
  else if (input.color.g > 0.9) { axisId = 2.0; } // Y axis
  else if (input.color.b > 0.9) { axisId = 3.0; } // Z axis
  
  output.axisId = axisId;
  
  // Highlight selected axis
  var finalColor = input.color;
  if (gizmoSettings.selectedAxis > 0u && u32(axisId) == gizmoSettings.selectedAxis) {
    finalColor = vec3<f32>(1.0, 1.0, 0.0); // Yellow when selected
  }
  
  output.color = finalColor;
  return output;
}

@fragment
fn fsMain(input : VSOut) -> @location(0) vec4<f32> {
  return vec4<f32>(input.color, 1.0);
}`;