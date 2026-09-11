import {MEConfig} from "../../me-config";
/**
 * @description
 * Dont remove link of origin source.
 * Original source:
 * https://www.shadertoy.com/view/4ttGWM
 */
export let fragmentHellWGSL = () => `
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
  effectMix       : f32,
  lightingEnabled : f32,
  ambientColor    : vec3f,  // add this
  _pad            : f32,    // alignment padding
};

struct PBRMaterialData {
  baseColor : vec3f,
  metallic  : f32,
  roughness : f32,
  alpha     : f32,
};

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

struct FragmentInput {
  @builtin(position) position : vec4f,
  @location(0) shadowPos : vec4f,
  @location(1) fragPos   : vec3f,
  @location(2) fragNorm  : vec3f,
  @location(3) uv        : vec2f,
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

fn fresnelSchlick(cosTheta: f32, F0: vec3f) -> vec3f {
  return F0 + (1.0 - F0) * pow(1.0 - cosTheta, 5.0);
}

fn distributionGGX(N: vec3f, H: vec3f, roughness: f32) -> f32 {
  let a = roughness * roughness;
  let a2 = a * a;
  let NdotH = max(dot(N, H), 0.0);
  let NdotH2 = NdotH * NdotH;
  let denom = (NdotH2 * (a2 - 1.0) + 1.0);
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
  let L = normalize(light.position - fragPos);
  let theta = dot(L, normalize(-light.direction));
  let epsilon = light.innerCutoff - light.outerCutoff;
  return clamp((theta - light.outerCutoff) / epsilon, 0.0, 1.0);
}

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
  var weight: f32 = 0.0;
  for(var i: u32 = 0u; i < 9u; i = i + 1u) {
      let sampleUV = shadowUV + offsets[i] * oneOverSize;
      let inBounds = sampleUV.x >= 0.0 && sampleUV.x <= 1.0 &&
                      sampleUV.y >= 0.0 && sampleUV.y <= 1.0;
      let s = textureSampleCompare(
          shadowMapArray, shadowSampler,
          sampleUV, layer, depthRef - bias
      );
      // only accumulate in-bounds samples, out-of-bounds count as lit (1.0)
      visibility += select(1.0, s, inBounds);
      weight += 1.0;
  }
  return visibility / weight;
}

struct FragOut {
  @location(0) color  : vec4f,
  @location(1) normal : vec4f,
  @location(2) worldPos : vec4f,
}

fn rand(n: vec2f) -> f32 {
  return fract(
    sin(cos(dot(n, vec2f(12.9898, 12.1414)))) *
    83758.5453
  );
}

fn noise(n: vec2f) -> f32 {
  let d = vec2f(0.0, 1.0);
  let b = floor(n);
  let f = smoothstep(vec2f(0.0), vec2f(1.0), fract(n));
  return mix(mix(rand(b), rand(b + d.yx), f.x),
      mix(rand(b + d.xy), rand(b + d.yy), f.x),
      f.y);
}

fn fbm(n: vec2f, aspect: f32) -> f32 {
  var total = 0.0;
  var amplitude = aspect * 0.5;
  var vn = n;
  for (var i: i32 = 0; i < 5; i++) {
    total += noise(vn) * amplitude;
    vn += vn * 1.7;
    amplitude *= 0.47;
  }
  return total;
}

fn fireEffect(fragCoord: vec2f, resolution: vec2f, time: f32) -> vec3f {
  let c1 = vec3f(0.5, 0.0, 0.1);
  let c2 = vec3f(0.9, 0.1, 0.0);
  let c3 = vec3f(0.2, 0.1, 0.7);
  let c4 = vec3f(1.0, 0.9, 0.1);
  let c5 = vec3f(0.1);
  let c6 = vec3f(0.9);
  let speed = vec2f(0.1, 0.9);
  let shift = 1.327 + sin(time * 2.0) / 2.4;
  let dist = 3.5 - sin(time * 0.4) / 1.89;
  var p = fragCoord * dist / resolution.xx;
  p += sin(p.yx * 4.0 + vec2f(0.2, -0.3) * time) * 0.04;
  p += sin(p.yx * 8.0 + vec2f(0.6, 0.1) * time) * 0.01;
  p.x -= time / 1.1;
  var q = fbm(p - time * 0.3 + 1.0 * sin(time + 0.5) / 2.0, resolution.x / resolution.y);
  let qb = fbm(
      p - time * 0.4 +
      0.1 * cos(time) / 2.0,
      resolution.x / resolution.y
  );
  let q2 = fbm(
      p - time * 0.44 -
      5.0 * cos(time) / 2.0,
      resolution.x / resolution.y
  ) - 6.0;
  let q3 = fbm(p - time * 0.9 -
      10.0 * cos(time) / 15.0,
      resolution.x / resolution.y
  ) - 4.0;
  let q4 = fbm(p - time * 1.4 -
      20.0 * sin(time) / 14.0,
      resolution.x / resolution.y
  ) + 2.0;
  q = (q + qb - 0.4 * q2 - 2.0 * q3 + 0.6 * q4) / 3.8;
  let r = vec2f(fbm(p + q / 2.0 + time * speed.x - p.x - p.y, resolution.x / resolution.y),
      fbm(p + q - time * speed.y, resolution.x / resolution.y));
  let c = mix(c1, c2, fbm(p + r, resolution.x / resolution.y)) + mix(c3, c4, r.x) - mix(c5, c6, r.y);
  var color = vec3f(1.0) / pow(c + 1.61, vec3f(4.0)) * cos(shift * fragCoord.y / resolution.y);
  color = vec3f(1.0, 0.2, 0.05) / pow((r.y + r.y) * max(0.0, p.y) + 0.1, 4.0);
  color = color / (vec3f(1.0) + max(vec3f(0.0), color));
  return color;
}

@fragment
fn main(input: FragmentInput) -> FragOut {
// let resolution = vec2f(1024.0, 1024.0);
let resolution = vec2f(514.0, 514.0);
let fragCoord = vec2f(
    input.position.x,
    resolution.y - input.position.y
);
let norm = normalize(input.fragNorm);
let viewDir = normalize(scene.cameraPos - input.fragPos);
let materialData = getPBRMaterial(input.uv);
var lightContribution = vec3f(0.0);
for (var i: u32 = 0u; i < MAX_SPOTLIGHTS; i = i + 1u) {
    let sc = spotlights[i].lightViewProj * vec4f(input.fragPos, 1.0);
    let p = sc.xyz / sc.w;
    let shadowUV = vec2f(p.x * 0.5 + 0.5, -p.y * 0.5 + 0.5);
    let depthRef = p.z;
    let lightDir = normalize(spotlights[i].position - input.fragPos);
    let inDepth =
        p.z >= 0.0 &&
        p.z <= 1.0;
    let visibility = sampleShadow(
        shadowUV,
        i32(i),
        depthRef,
        norm,
        lightDir
    );
    let shadowFactor = select(1.0, visibility, inDepth);
    let contrib = computeSpotLight(spotlights[i], norm, input.fragPos, viewDir, materialData);
    lightContribution += contrib * shadowFactor;
}
let texColor = textureSample(meshTexture, meshSampler, input.uv);
let fireColor = fireEffect(fragCoord, resolution, scene.time);
var finalColor = fireColor;
let alpha = texColor.a * material.baseColorFactor.a;
return FragOut(
  vec4f(finalColor, alpha),
  vec4f(norm, 0.0),
  vec4f(input.fragPos, 1.0));
}`;