export function graphAdapter(compilerResult) {
  const { functions, locals, outputs, flags } = compilerResult;

  // 1️⃣ Inject user functions first
  const userFunctions = functions.join("\n\n");

  // 2️⃣ Prepare locals
  const userLocals = locals.join("\n");

  // 3️⃣ Prepare final color outputs
  const baseColor = outputs.baseColor || "vec3f(1.0)";
  const alpha = outputs.alpha || "1.0";
  const normal = outputs.normal || "normalize(input.fragNorm)";
  const emissive = outputs.emissive || "vec3f(0.0)";

  // 4️⃣ Build full WGSL shader with all uniforms, PBR functions, and graph injection
  return `
/* === Engine uniforms === */
override shadowDepthTextureSize: f32 = 1024.0;
const PI: f32 = 3.141592653589793;

struct Scene {
    lightViewProjMatrix  : mat4x4f,
    cameraViewProjMatrix : mat4x4f,
    cameraPos            : vec3f,
    padding2             : f32,
    lightPos             : vec3f,
    padding              : f32,
    globalAmbient        : vec3f,
    padding3             : f32,
};

struct SpotLight {
    position      : vec3f,
    _pad1         : f32,
    direction     : vec3f,
    _pad2         : f32,
    innerCutoff   : f32,
    outerCutoff   : f32,
    intensity     : f32,
    _pad3         : f32,
    color         : vec3f,
    _pad4         : f32,
    range         : f32,
    ambientFactor : f32,
    shadowBias    : f32,
    _pad5         : f32,
    lightViewProj : mat4x4<f32>,
};

struct MaterialPBR {
    baseColorFactor : vec4f,
    metallicFactor  : f32,
    roughnessFactor : f32,
    _pad1           : f32,
    _pad2           : f32,
};

struct PBRMaterialData {
    baseColor : vec3f,
    metallic  : f32,
    roughness : f32,
};

const MAX_SPOTLIGHTS = 20u;

@group(0) @binding(0) var<uniform> scene : Scene;
@group(0) @binding(1) var shadowMapArray: texture_depth_2d_array;
@group(0) @binding(2) var shadowSampler: sampler_comparison;
@group(0) @binding(3) var meshTexture: texture_2d<f32>;
@group(0) @binding(4) var meshSampler: sampler;
@group(0) @binding(5) var<uniform> spotlights: array<SpotLight, MAX_SPOTLIGHTS>;
@group(0) @binding(6) var metallicRoughnessTex: texture_2d<f32>;
@group(0) @binding(7) var metallicRoughnessSampler: sampler;
@group(0) @binding(8) var<uniform> material: MaterialPBR;

// ✅ Graph custom functions
${userFunctions}

// Fragment input
struct FragmentInput {
    @location(0) shadowPos : vec4f,
    @location(1) fragPos   : vec3f,
    @location(2) fragNorm  : vec3f,
    @location(3) uv        : vec2f,
};

// PBR helpers
fn getPBRMaterial(uv: vec2f) -> PBRMaterialData {
    let texColor = textureSample(meshTexture, meshSampler, uv);
    let baseColor = texColor.rgb * material.baseColorFactor.rgb;
    let mrTex = textureSample(metallicRoughnessTex, metallicRoughnessSampler, uv);
    let metallic = mrTex.b * material.metallicFactor;
    let roughness = mrTex.g * material.roughnessFactor;
    return PBRMaterialData(baseColor, metallic, roughness);
}

// computeLighting / computeShadow expected to exist in engine
@fragment
fn fs_main(input: FragmentInput) -> @location(0) vec4f {
  // Locals from nodes
  ${userLocals}

  // Material and engine data
  let materialData = getPBRMaterial(input.uv);
  let baseColor: vec3f = ${baseColor};
  let finalAlpha: f32 = ${alpha};
  let normal: vec3f = ${normal};
  let emissive: vec3f = ${emissive};

  // Lighting / Shadows
  var lighting: vec3f = vec3f(1.0);
  if (${flags.usesLighting}) {
    lighting = computeLighting(input);
  }

  var shadow: f32 = 1.0;
  if (${flags.usesShadows}) {
    shadow = computeShadow(input);
  }

  // Compute final color
  let graphColor: vec4f = vec4f(baseColor + emissive, finalAlpha);
  return vec4f(graphColor.rgb * lighting * shadow, graphColor.a);
}
`;
}
