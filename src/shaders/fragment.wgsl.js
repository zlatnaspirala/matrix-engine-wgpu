export let fragmentWGSL = `override shadowDepthTextureSize: f32 = 1024.0;
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

// PBR textures
@group(0) @binding(6) var metallicRoughnessTex: texture_2d<f32>;
@group(0) @binding(7) var metallicRoughnessSampler: sampler;
@group(0) @binding(8) var<uniform> material: MaterialPBR;

struct FragmentInput {
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
    return PBRMaterialData(baseColor, metallic, roughness);
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

// PCF shadow sampling
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
        visibility += textureSampleCompare(shadowMapArray, shadowSampler, shadowUV + offsets[i] * oneOverSize, layer, depthRef - bias);
    }
    return visibility / 9.0;
}

@fragment
fn main(input: FragmentInput) -> @location(0) vec4f {

let materialData = getPBRMaterial(input.uv);
let N = normalize(input.fragNorm);
let V = normalize(scene.cameraPos - input.fragPos);

var Lo = vec3f(0.0);

for (var i: u32 = 0u; i < MAX_SPOTLIGHTS; i = i + 1u) {
    let L = normalize(spotlights[i].position - input.fragPos);
    let NdotL = max(dot(N, L), 0.0);

    // Shadow calculation
    let sc       = spotlights[i].lightViewProj * vec4<f32>(input.fragPos, 1.0);
    let p        = sc.xyz / sc.w;
    let uv       = clamp(p.xy * 0.5 + vec2<f32>(0.5), vec2<f32>(0.0), vec2<f32>(1.0));
    let depthRef = p.z * 0.5 + 0.5;
    let bias     = spotlights[i].shadowBias;

    let visibility = sampleShadow(uv, i32(i), depthRef - bias, N, L);

    // Apply simple diffuse with shadow
    Lo += NdotL * materialData.baseColor * spotlights[i].color * spotlights[i].intensity * visibility;
}

// Add ambient
let color = scene.globalAmbient * materialData.baseColor + Lo;

return vec4f(color, 1.0);
    // let materialData = getPBRMaterial(input.uv);
    // let N = normalize(input.fragNorm);
    // let V = normalize(scene.cameraPos - input.fragPos);
    // var Lo = vec3f(0.0);

    // for(var i: u32 = 0u; i < MAX_SPOTLIGHTS; i = i + 1u) {
    //     let L = normalize(spotlights[i].position - input.fragPos);
    //     let H = normalize(V + L);
    //     let distance = length(spotlights[i].position - input.fragPos);
    //     let attenuation = clamp(1.0 - (distance / spotlights[i].range), 0.0, 1.0);
    //     let radiance = spotlights[i].color * spotlights[i].intensity * attenuation;

    //     let NDF = distributionGGX(N, H, materialData.roughness);
    //     let G   = geometrySmith(N, V, L, materialData.roughness);
    //     let F0 = mix(vec3f(0.04), materialData.baseColor, materialData.metallic);
    //     let F  = fresnelSchlick(max(dot(H, V), 0.0), F0);
    //     let kS = F;
    //     let kD = (vec3f(1.0) - kS) * (1.0 - materialData.metallic);
    //     let NdotL = max(dot(N, L), 0.0);
    //     let specular = (NDF * G * F) / (4.0 * max(dot(N, V), 0.0) * NdotL + 0.001);

    //     // shadow
    //     let sc = spotlights[i].lightViewProj * vec4<f32>(input.fragPos, 1.0);
    //     let p = sc.xyz / sc.w;
    //     let uv = clamp(p.xy * 0.5 + vec2<f32>(0.5), vec2<f32>(0.0), vec2<f32>(1.0));
    //     let depthRef = p.z * 0.5 + 0.5;
    //     let visibility = 1.0; //sampleShadow(uv, i32(i), depthRef, N, L);

    //     // Lo += visibility * (kD * materialData.baseColor / PI + specular) * radiance * NdotL;
    //     Lo += NdotL * spotlights[i].color * spotlights[i].intensity;
    // }

    // let ambient = scene.globalAmbient * materialData.baseColor;
    // let color = ambient + Lo;
    // return vec4f(color, 1.0);
}
`;


// let N = normalize(input.fragNorm);
// let L = normalize(spotlights[0].position - input.fragPos);
// let NdotL = max(dot(N,L),0.0);
// let radiance = spotlights[0].color * 10.0; // test high intensity
// Lo += materialData.baseColor * radiance * NdotL;