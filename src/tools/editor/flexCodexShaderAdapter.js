export function graphAdapter(compilerResult, nodes) {
  const {structs, uniforms, functions, locals, outputs, mainLines} = compilerResult;

  // console.log("what os node in adapter", nodes);

  const globals = new Set();
  globals.add("const PI: f32 = 3.141592653589793;");
  globals.add("override shadowDepthTextureSize: f32 = 1024.0;");

  // 3️⃣ Prepare final color outputs
  const baseColor = outputs.baseColor || "vec3f(1.0)";
  const alpha = outputs.alpha || "1.0";
  const normal = outputs.normal || "normalize(input.fragNorm)";
  const emissive = outputs.emissive || "vec3f(0.0)";

  /////////////////////////
  // --- Iterate nodes in topological order ---
  for(const node of nodes) {
    if(node.type === "LightShadowNode") {
      functions.push(`
fn computeSpotLight(light: SpotLight, N: vec3f, fragPos: vec3f, V: vec3f, material: PBRMaterialData) -> vec3f {
    let L = normalize(light.position - fragPos);
    let NdotL = max(dot(N, L), 0.0);

    let theta = dot(L, normalize(-light.direction));
    let epsilon = light.innerCutoff - light.outerCutoff;
    var coneAtten = clamp((theta - light.outerCutoff) / epsilon, 0.0, 1.0);

    // coneAtten = 1.0;
    if (coneAtten <= 0.0 || NdotL <= 0.0) {
        return vec3f(0.0);
    }

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

    let radiance = light.color * light.intensity;
    // return (diffuse + specular) * radiance * NdotL * coneAtten;
    return material.baseColor * light.color * light.intensity * NdotL * coneAtten;
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
      // Inject compute function (inline or multi-line)
      // mainLines.push(`finalColor *= vec4(scene.globalAmbient + lightContribution, 1);`);

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
    _pad1           : f32,
    _pad2           : f32,
};

// PREDEFINED
struct PBRMaterialData {
    baseColor : vec3f,
    metallic  : f32,
    roughness : f32,
    alpha     : f32
};

// PREDEFINED
const MAX_SPOTLIGHTS = 20u;

// PREDEFINED
@group(0) @binding(0) var<uniform> scene : Scene;
@group(0) @binding(1) var shadowMapArray: texture_depth_2d_array;
@group(0) @binding(2) var shadowSampler: sampler_comparison;
@group(0) @binding(3) var meshTexture: texture_2d<f32>;
@group(0) @binding(4) var meshSampler: sampler;
@group(0) @binding(5) var<uniform> spotlights: array<SpotLight, MAX_SPOTLIGHTS>;
@group(0) @binding(6) var metallicRoughnessTex: texture_2d<f32>;
@group(0) @binding(7) var metallicRoughnessSampler: sampler;
@group(0) @binding(8) var<uniform> material: MaterialPBR;

// ✅ Graph custom uniforms
${[...uniforms].join("\n")}

// ✅ Graph custom functions
${functions.join("\n\n")}

// PREDEFINED Fragment input
struct FragmentInput {
    @location(0) shadowPos : vec4f,
    @location(1) fragPos   : vec3f,
    @location(2) fragNorm  : vec3f,
    @location(3) uv        : vec2f,
};

// PREDEFINED PBR helpers
fn getPBRMaterial(uv: vec2f) -> PBRMaterialData {
    let texColor = textureSample(meshTexture, meshSampler, uv);
    let baseColor = texColor.rgb * material.baseColorFactor.rgb;
    let mrTex = textureSample(metallicRoughnessTex, metallicRoughnessSampler, uv);
    let metallic = mrTex.b * material.metallicFactor;
    let roughness = mrTex.g * material.roughnessFactor;
    
    // ✅ Get alpha from texture and material factor
    // let alpha = texColor.a * material.baseColorFactor.a;
    let alpha = material.baseColorFactor.a;
    
    return PBRMaterialData(baseColor, metallic, roughness, alpha);
}

@fragment
fn main(input: FragmentInput) -> @location(0) vec4f {
  // Locals
  ${locals.join("\n  ")}
  ${mainLines.join("\n  ")}
  return ${outputs.outColor};
}
`;
}
