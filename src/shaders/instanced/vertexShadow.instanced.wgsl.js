export let vertexShadowWGSLInstanced =  `struct Scene {
  lightViewProjMatrix: mat4x4f,
  cameraViewProjMatrix: mat4x4f,
  lightPos: vec3f,
}

// keep it for switch on end
struct Model {
  modelMatrix: mat4x4f,
}

struct InstanceData {
  model : mat4x4<f32>,
};

@group(0) @binding(0) var<uniform> scene : Scene;
// @group(1) @binding(0) var<uniform> model : Model;
@group(1) @binding(0) var<storage, read> instances : array<InstanceData>;

@vertex
fn main(
  @location(0) position: vec3f,
  @builtin(instance_index) instId: u32
) -> @builtin(position) vec4f {
   let worldPos = instances[instId].model * vec4(position, 1.0);
  return scene.lightViewProjMatrix * worldPos;
  // return scene.lightViewProjMatrix * model.modelMatrix * vec4(position, 1);
}
`;