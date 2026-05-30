import {MEConfig} from "../../me-config";

/**
 * Attachment metadata: defines what each output attachment expects
 */
const ATTACHMENT_SPEC = {
  color: {
    location: 0,
    type: "vec4f",
    usage: "Final composited color + alpha",
    format: "rgba8unorm"
  },
  normal: {
    location: 1,
    type: "vec4f",
    usage: "World-space normal for deferred/SSR",
    format: "rgba16float"
  },
  worldPos: {
    location: 2,
    type: "vec4f",
    usage: "World position for depth/position reconstruction",
    format: "rgba16float"
  }
};

export function graphAdapter(compilerResult, nodes) {
  const {structs, uniforms, functions, locals, outputs, mainLines} = compilerResult;
  const globals = new Set();
  globals.add("const PI: f32 = 3.141592653589793;");
  globals.add(`override shadowDepthTextureSize: f32 = ${MEConfig.SHADOW_RES};`);

  // ✅ Build attachment outputs with explicit fallbacks
  const attachmentOutputs = {
    color: outputs.outColor || buildColorOutput(outputs),
    normal: outputs.normal || `vec4f(normalize(input.fragNorm), 1.0)`,
    worldPos: outputs.worldPos || `vec4f(input.fragPos, 1.0)`
  };
  
  // Validate all attachments are present
  validateAttachments(attachmentOutputs);

  // ✅ Track which node-generated functions have been added (avoid duplicates)
  const addedNodeFunctions = new Set();

  // --- Iterate nodes in topological order ---
  for(const node of nodes) {
    if(node.type === "LightShadowNode") {
      // Only add once, even if multiple LightShadowNodes exist
      if (!addedNodeFunctions.has("LightShadowNode")) {
        functions.push(`
fn computeSpotLight(light: SpotLight, N: vec3f, fragPos: vec3f, V: vec3f, material: PBRMaterialData) -> vec3f {
  let toLight = light.position - fragPos;
  let dist = length(toLight);
  let L = normalize(toLight);
  let NdotL = max(dot(N, L), 0.0);

  let theta = dot(L, normalize(-light.direction));
  let epsilon = light.innerCutoff - light.outerCutoff;
  var coneAtten = clamp((theta - light.outerCutoff) / epsilon, 0.0, 1.0);

  if (coneAtten <= 0.0 || NdotL <= 0.0) {
    return vec3f(0.0);
  }

  // Distance attenuation
  let attenuation = clamp(1.0 - (dist / light.range), 0.0, 1.0);
  let attenuation2 = attenuation * attenuation; // quadratic falloff curve

  let F0 = mix(vec3f(0.04), material.baseColor.rgb, vec3f(material.metallic));
  let H = normalize(L + V);
  let F = F0 + (1.0 - F0) * pow(1.0 - max(dot(H, V), 0.0), 5.0);

  let alpha = material.roughness * material.roughness;
  let NdotH = max(dot(N, H), 0.0);
  let alpha2 = alpha * alpha;
  let denom = (NdotH * NdotH * (alpha2 - 1.0) + 1.0);
  let D = alpha2 / (PI * denom * denom + 1e-5);

  let k = (alpha + 1.0) * (alpha + 1.0) / 8.0;
  let NdotV = max(dot(N, V), 0.0);
  let Gv = NdotV / (NdotV * (1.0 - k) + k);
  let Gl = NdotL / (NdotL * (1.0 - k) + k);
  let G = Gv * Gl;

  let numerator = D * G * F;
  let denominator = 4.0 * NdotV * NdotL + 1e-5;
  let specular = numerator / denominator;

  let kS = F;
  let kD = (vec3f(1.0) - kS) * (1.0 - material.metallic);
  let diffuse = kD * material.baseColor.rgb / PI;

  let radiance = light.color * light.intensity * attenuation2;

  return (diffuse + specular) * radiance * NdotL * coneAtten;
}

fn sampleShadow(shadowUV: vec2f, layer: i32, depthRef: f32, normal: vec3f, lightDir: vec3f) -> f32 {
    var visibility: f32 = 0.0;
    let biasConstant: f32 = 0.001;
    let slopeBias = max(0.002 * (1.0 - dot(normal, lightDir)), 0.0);
    let bias = biasConstant + slopeBias;
    let oneOverSize = 1.0 / (shadowDepthTextureSize * 0.5);
    let offsets: array<vec2f, 9> = array<vec2f, 9>(
        vec2(-1.0, -1.0), vec2(0.0, -1.0), vec2(1.0, -1.0),
        vec2(-1.0,  0.0), vec2(0.0,  0.0), vec2(1.0,  0.0),
        vec2(-1.0,  1.0), vec2(0.0,  1.0), vec2(1.0,  1.0)
    );
    for(var i: u32 = 0u; i < 9u; i = i + 1u) {
        visibility += textureSampleCompare(
            shadowMapArray, shadowSampler,
            shadowUV + offsets[i] * oneOverSize,
            layer, depthRef - bias
        );
    }
    return visibility / 9.0;
}
`);
        addedNodeFunctions.add("LightShadowNode");
      }
    }
  }

  return `
/* === Engine uniforms === */

// DINAMIC GLOBALS
${[...globals].join("\n")}

// DINAMIC STRUCTS
${[...structs].join("\n")}

// PREDEFINED
struct Scene {
    lightViewProjMatrix  : mat4x4f,
    cameraViewProjMatrix : mat4x4f,
    cameraPos            : vec3f,
    padding2             : f32,
    lightPos             : vec3f,
    padding              : f32,
    globalAmbient        : vec3f,
    padding3             : f32,
    time                 : f32,
    deltaTime            : f32,
    padding4             : vec2f,
};

// PREDEFINED
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

// PREDEFINED
struct MaterialPBR {
    baseColorFactor : vec4f,
    metallicFactor  : f32,
    roughnessFactor : f32,
    effectMix       : f32,
    lightingEnabled : f32,
    ambientColor    : vec3f,
    _pad            : f32,
};

// PREDEFINED
struct PBRMaterialData {
    baseColor : vec3f,
    metallic  : f32,
    roughness : f32,
    alpha     : f32
};

// PREDEFINED
const MAX_SPOTLIGHTS = ${MEConfig.MAX_SPOTLIGHTS}u;

@group(0) @binding(0) var<uniform> scene : Scene;
@group(0) @binding(1) var shadowMapArray: texture_depth_2d_array;
@group(0) @binding(2) var shadowSampler: sampler_comparison;
@group(0) @binding(3) var<storage, read> spotlights: array<SpotLight, MAX_SPOTLIGHTS>;
@group(1) @binding(0) var meshTexture: texture_2d<f32>;
@group(1) @binding(1) var meshSampler: sampler;
@group(1) @binding(2) var metallicRoughnessTex: texture_2d<f32>;
@group(1) @binding(3) var metallicRoughnessSampler: sampler;
@group(1) @binding(4) var<uniform> material: MaterialPBR;
@group(1) @binding(5) var normalTexture: texture_2d<f32>;
@group(1) @binding(6) var normalSampler: sampler;

// ✅ Graph custom uniforms
${[...uniforms].join("\n")}

// ✅ Graph custom functions
${functions.join("\n\n")}

// PREDEFINED Fragment input
struct FragmentInput {
  @location(0) shadowPos : vec4f,
  @location(1) fragPos   : vec3f,
  @location(2) fragNorm  : vec3f,
  @location(3) uv        : vec2f
};

fn getPBRMaterial(uv: vec2f) -> PBRMaterialData {
  let texColor = textureSample(meshTexture, meshSampler, uv);
  let baseColor = texColor.rgb * material.baseColorFactor.rgb;
  let mrTex = textureSample(metallicRoughnessTex, metallicRoughnessSampler, uv);
  let metallic = mrTex.b * material.metallicFactor;
  let roughness = mrTex.g * material.roughnessFactor;
  let alpha = material.baseColorFactor.a;
  return PBRMaterialData(baseColor, metallic, roughness, alpha);
}

// ✅ 3-Attachment output struct (explicit format metadata for deferred/SSR)
struct FragOut {
  @location(0) color  : vec4f,     // rgba8unorm — final color + alpha
  @location(1) normal : vec4f,     // rgba16float — world-space normal
  @location(2) worldPos : vec4f,   // rgba16float — world position for reconstruction
}

@fragment
fn main(input: FragmentInput) -> FragOut {
  // Locals
  ${locals.join("\n  ")}
  ${mainLines.join("\n  ")}
  
  return FragOut(
    ${attachmentOutputs.color},
    ${attachmentOutputs.normal},
    ${attachmentOutputs.worldPos}
  );
}
`;
}

/**
 * Helper: build color output from component pieces
 */
function buildColorOutput(outputs) {
  const baseColor = outputs.baseColor || "vec3f(1.0)";
  const alpha = outputs.alpha || "1.0";
  return `vec4f(${baseColor}, ${alpha})`;
}

/**
 * Helper: validate all required attachments are defined
 */
function validateAttachments(attachmentOutputs) {
  const missing = Object.entries(attachmentOutputs)
    .filter(([_, val]) => !val || val.trim() === "")
    .map(([key]) => key);
  
  if (missing.length > 0) {
    console.warn(
      `⚠️ graphAdapter: Missing attachment outputs: ${missing.join(", ")}. ` +
      `Falling back to defaults.`
    );
  }
}