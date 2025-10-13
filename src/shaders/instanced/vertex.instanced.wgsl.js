export let vertexWGSLInstanced = `const MAX_BONES = 100u;

struct Scene {
  lightViewProjMatrix: mat4x4f,
  cameraViewProjMatrix: mat4x4f,
  lightPos: vec3f,
}

// not in use
struct Model {
  modelMatrix: mat4x4f,
}

struct Bones {
  boneMatrices : array<mat4x4f, MAX_BONES>
}

struct SkinResult {
  position : vec4f,
  normal   : vec3f,
};

struct InstanceData {
    model     : mat4x4<f32>,
    colorMult : vec4<f32>,
};

@group(0) @binding(0) var<uniform> scene : Scene;
@group(1) @binding(0) var<storage, read> instances : array<InstanceData>;
@group(1) @binding(1) var<uniform> bones : Bones;

struct VertexOutput {
  @location(0) shadowPos: vec4f,
  @location(1) fragPos: vec3f,
  @location(2) fragNorm: vec3f,
  @location(3) uv: vec2f,
  @builtin(position) Position: vec4f,
}

fn skinVertex(pos: vec4f, nrm: vec3f, joints: vec4<u32>, weights: vec4f) -> SkinResult {
    var skinnedPos = vec4f(0.0);
    var skinnedNorm = vec3f(0.0);
    for (var i: u32 = 0u; i < 4u; i = i + 1u) {
        let jointIndex = joints[i];
        let w = weights[i];
        if (w > 0.0) {
          let boneMat = bones.boneMatrices[jointIndex];
          skinnedPos  += (boneMat * pos) * w;
          let boneMat3 = mat3x3f(
            boneMat[0].xyz,
            boneMat[1].xyz,
            boneMat[2].xyz
          );
          skinnedNorm += (boneMat3 * nrm) * w;
        }
    }
    return SkinResult(skinnedPos, skinnedNorm);
}

@vertex
fn main(
  @location(0) position: vec3f,
  @location(1) normal: vec3f,
  @location(2) uv: vec2f,
  @location(3) joints: vec4<u32>,
  @location(4) weights: vec4<f32>,
  @builtin(instance_index) instId: u32
) -> VertexOutput {

  let inst = instances[instId];

  var output : VertexOutput;
  var pos = vec4(position, 1.0);
  var nrm = normal;
  let skinned = skinVertex(pos, nrm, joints, weights);


  // let worldPos = model.modelMatrix * skinned.position;
  let worldPos = inst.model * skinned.position;

  // build normal matrix from instance transform
  let normalMatrix = mat3x3f(
    inst.model[0].xyz,
    inst.model[1].xyz,
    inst.model[2].xyz
  );

  output.Position = scene.cameraViewProjMatrix * worldPos;
  output.fragPos = worldPos.xyz;
  output.shadowPos = scene.lightViewProjMatrix * worldPos;
  output.fragNorm = normalize(normalMatrix * skinned.normal);
  output.uv = uv;
  return output;
}`;