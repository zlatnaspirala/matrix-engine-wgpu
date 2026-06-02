import {MEConfig} from "../me-config";

export let fragmentProjectedWGSL = () => `
override shadowDepthTextureSize: f32 = ${MEConfig.SHADOW_RES};
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
  time                 : f32,
  deltaTime            : f32,
  padding4             : vec2f,
};

// ── Gobo rect added at the end ─────────────────────────────────────────────
// All other fields identical to base SpotLight struct.
// goboRect = [u_min, v_min, u_max, v_max] in atlas UV space.
// Lights with no gobo use rect [0, 0, 1/maxSlots, 1] → white pixel → no effect.
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
  goboRect      : vec4f,        // u_min, v_min, u_max, v_max
  _pad6         : vec4f,        // padding to keep struct 176 bytes (44 floats)
};

struct MaterialPBR {
  baseColorFactor : vec4f,
  metallicFactor  : f32,
  roughnessFactor : f32,
  effectMix       : f32,
  lightingEnabled : f32,
  ambientColor    : vec3f,
  _pad            : f32,
};

struct PBRMaterialData {
  baseColor : vec3f,
  metallic  : f32,
  roughness : f32,
  alpha     : f32,
};

const MAX_SPOTLIGHTS = ${MEConfig.MAX_SPOTLIGHTS}u;

@group(0) @binding(0) var<uniform> scene        : Scene;
@group(0) @binding(1) var shadowMapArray         : texture_depth_2d_array;
@group(0) @binding(2) var shadowSampler          : sampler_comparison;
@group(0) @binding(3) var<storage, read> spotlights : array<SpotLight, MAX_SPOTLIGHTS>;

@group(1) @binding(0) var meshTexture            : texture_2d<f32>;
@group(1) @binding(1) var meshSampler            : sampler;
@group(1) @binding(2) var metallicRoughnessTex   : texture_2d<f32>;
@group(1) @binding(3) var metallicRoughnessSampler : sampler;
@group(1) @binding(4) var<uniform> material      : MaterialPBR;
@group(1) @binding(5) var normalTexture          : texture_2d<f32>;
@group(1) @binding(6) var normalSampler          : sampler;

// ── Gobo atlas — bound per mesh via mainPassBindGroup ─────────────────────
// group(2) binding(0) and (1) are shadow tex/sampler (existing).
// binding(2) and (3) are the new gobo atlas.
@group(2) @binding(0) var shadowTex              : texture_depth_2d_array;
@group(2) @binding(1) var shadowSamp             : sampler_comparison;
@group(2) @binding(2) var goboAtlas              : texture_2d<f32>;
@group(2) @binding(3) var goboSampler            : sampler;

struct FragmentInput {
  @location(0) shadowPos : vec4f,
  @location(1) fragPos   : vec3f,
  @location(2) fragNorm  : vec3f,
  @location(3) uv        : vec2f,
};

fn getPBRMaterial(uv: vec2f) -> PBRMaterialData {
  let texColor  = textureSample(meshTexture, meshSampler, uv);
  let baseColor = texColor.rgb * material.baseColorFactor.rgb;
  let mrTex     = textureSample(metallicRoughnessTex, metallicRoughnessSampler, uv);
  let metallic  = mrTex.b * material.metallicFactor;
  let roughness = mrTex.g * material.roughnessFactor;
  let alpha     = material.baseColorFactor.a;
  return PBRMaterialData(baseColor, metallic, roughness, alpha);
}

fn fresnelSchlick(cosTheta: f32, F0: vec3f) -> vec3f {
  return F0 + (1.0 - F0) * pow(1.0 - cosTheta, 5.0);
}

fn distributionGGX(N: vec3f, H: vec3f, roughness: f32) -> f32 {
  let a      = roughness * roughness;
  let a2     = a * a;
  let NdotH  = max(dot(N, H), 0.0);
  let NdotH2 = NdotH * NdotH;
  let denom  = (NdotH2 * (a2 - 1.0) + 1.0);
  return a2 / (PI * denom * denom);
}

fn geometrySchlickGGX(NdotV: f32, roughness: f32) -> f32 {
  let r = (roughness + 1.0);
  let k = (r * r) / 8.0;
  return NdotV / (NdotV * (1.0 - k) + k);
}

fn geometrySmith(N: vec3f, V: vec3f, L: vec3f, roughness: f32) -> f32 {
  let NdotV = max(dot(N, V), 0.0);
  let NdotL = max(dot(N, L), 0.0);
  return geometrySchlickGGX(NdotV, roughness) * geometrySchlickGGX(NdotL, roughness);
}

fn calculateSpotlightFactor(light: SpotLight, fragPos: vec3f) -> f32 {
  let L     = normalize(light.position - fragPos);
  let theta = dot(L, normalize(-light.direction));
  let epsilon = light.innerCutoff - light.outerCutoff;
  return clamp((theta - light.outerCutoff) / epsilon, 0.0, 1.0);
}

// ── Gobo sampling ─────────────────────────────────────────────────────────
// Projects fragPos through the light's view-projection matrix,
// remaps NDC to the light's assigned rect inside the atlas,
// and returns the RGB gobo color.
// Outside the light frustum → returns vec3(1.0) so it has zero effect
// on the multiplication (same result as no gobo / white pixel).
fn sampleGobo(light: SpotLight, fragPos: vec3f) -> vec3f {
  let clipPos = light.lightViewProj * vec4f(fragPos, 1.0);
  let ndc     = clipPos.xyz / clipPos.w;

  // Outside light frustum — no modulation
  if (ndc.x < -1.0 || ndc.x > 1.0 ||
      ndc.y < -1.0 || ndc.y > 1.0 ||
      ndc.z <  0.0 || ndc.z > 1.0) {
    return vec3f(1.0);
  }

  // NDC [-1,1] → normalised [0,1], flip Y (WebGPU NDC Y-up, UV Y-down)
  let uvNorm = vec2f(ndc.x * 0.5 + 0.5, -ndc.y * 0.5 + 0.5);

  // Remap into this light's atlas rect
  let atlasUV = light.goboRect.xy + uvNorm * (light.goboRect.zw - light.goboRect.xy);

  return textureSample(goboAtlas, goboSampler, atlasUV).rgb;
}

// ── computeSpotLight — identical to base, one multiply added at the end ───
fn computeSpotLight(light: SpotLight, N: vec3f, fragPos: vec3f, V: vec3f, mat: PBRMaterialData) -> vec3f {
  let toLight = light.position - fragPos;
  let dist    = length(toLight);
  let L       = normalize(toLight);
  let NdotL   = max(dot(N, L), 0.0);

  let theta   = dot(L, normalize(-light.direction));
  let epsilon = light.innerCutoff - light.outerCutoff;
  var coneAtten = clamp((theta - light.outerCutoff) / epsilon, 0.0, 1.0);

  if (coneAtten <= 0.0 || NdotL <= 0.0) {
    return vec3f(0.0);
  }

  let attenuation  = clamp(1.0 - (dist / light.range), 0.0, 1.0);
  let attenuation2 = attenuation * attenuation;

  let F0    = mix(vec3f(0.04), mat.baseColor.rgb, vec3f(mat.metallic));
  let H     = normalize(L + V);
  let F     = F0 + (1.0 - F0) * pow(1.0 - max(dot(H, V), 0.0), 5.0);

  let alpha  = mat.roughness * mat.roughness;
  let NdotH  = max(dot(N, H), 0.0);
  let alpha2 = alpha * alpha;
  let denom  = (NdotH * NdotH * (alpha2 - 1.0) + 1.0);
  let D      = alpha2 / (PI * denom * denom + 1e-5);

  let k    = (alpha + 1.0) * (alpha + 1.0) / 8.0;
  let NdotV = max(dot(N, V), 0.0);
  let Gv   = NdotV / (NdotV * (1.0 - k) + k);
  let Gl   = NdotL / (NdotL * (1.0 - k) + k);
  let G    = Gv * Gl;

  let numerator   = D * G * F;
  let denominator = 4.0 * NdotV * NdotL + 1e-5;
  let specular    = numerator / denominator;

  let kS      = F;
  let kD      = (vec3f(1.0) - kS) * (1.0 - mat.metallic);
  let diffuse = kD * mat.baseColor.rgb / PI;

  let radiance = light.color * light.intensity * attenuation2;

  // ── Gobo: sample atlas rect and modulate radiance ─────────────────────
  let gobo = sampleGobo(light, fragPos);

  return (diffuse + specular) * radiance * gobo * NdotL * coneAtten;
}

fn sampleShadow(shadowUV: vec2f, layer: i32, depthRef: f32, normal: vec3f, lightDir: vec3f) -> f32 {
  var visibility    : f32 = 0.0;
  let biasConstant  : f32 = 0.001;
  let slopeBias = max(0.002 * (1.0 - dot(normal, lightDir)), 0.0);
  let bias      = biasConstant + slopeBias;
  let oneOverSize = 1.0 / (shadowDepthTextureSize * 0.5);
  let offsets: array<vec2f, 9> = array<vec2f, 9>(
      vec2(-1.0, -1.0), vec2(0.0, -1.0), vec2(1.0, -1.0),
      vec2(-1.0,  0.0), vec2(0.0,  0.0), vec2(1.0,  0.0),
      vec2(-1.0,  1.0), vec2(0.0,  1.0), vec2(1.0,  1.0)
  );
  var weight: f32 = 0.0;
  for (var i: u32 = 0u; i < 9u; i = i + 1u) {
    let sampleUV = shadowUV + offsets[i] * oneOverSize;
    let inBounds = sampleUV.x >= 0.0 && sampleUV.x <= 1.0 &&
                   sampleUV.y >= 0.0 && sampleUV.y <= 1.0;
    let s = textureSampleCompare(
      shadowMapArray, shadowSampler,
      sampleUV, layer, depthRef - bias
    );
    visibility += select(1.0, s, inBounds);
    weight += 1.0;
  }
  return visibility / weight;
}

struct FragOut {
  @location(0) color    : vec4f,
  @location(1) normal   : vec4f,
  @location(2) worldPos : vec4f,
}

@fragment
fn main(input: FragmentInput) -> FragOut {
  let norm         = normalize(input.fragNorm);
  let viewDir      = normalize(scene.cameraPos - input.fragPos);
  let materialData = getPBRMaterial(input.uv);

  var lightContribution = vec3f(0.0);
  for (var i: u32 = 0u; i < MAX_SPOTLIGHTS; i = i + 1u) {
    let sc       = spotlights[i].lightViewProj * vec4<f32>(input.fragPos, 1.0);
    let p        = sc.xyz / sc.w;
    let uv       = vec2f(p.x * 0.5 + 0.5, -p.y * 0.5 + 0.5);
    let depthRef = p.z;
    let lightDir = normalize(spotlights[i].position - input.fragPos);
    let inDepth  = p.z >= 0.0 && p.z <= 1.0;
    let visibility   = sampleShadow(uv, i32(i), depthRef, norm, lightDir);
    let shadowFactor = select(1.0, visibility, inDepth);
    let contrib = computeSpotLight(
      spotlights[i],
      norm,
      input.fragPos,
      viewDir,
      materialData
    );
    lightContribution += contrib * shadowFactor;
  }

  let texColor  = textureSample(meshTexture, meshSampler, input.uv);
  var finalColor = texColor.rgb * (material.ambientColor + scene.globalAmbient + lightContribution);
  let alpha = texColor.a * material.baseColorFactor.a;

  return FragOut(
    vec4f(finalColor, alpha),
    vec4f(norm, 0.0),
    vec4f(input.fragPos, 1.0)
  );
}`;