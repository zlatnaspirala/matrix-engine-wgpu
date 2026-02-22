export let fragmentWGSL = `
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
    _pad1           : f32,
    _pad2           : f32,
};

struct PBRMaterialData {
    baseColor : vec3f,
    metallic  : f32,
    roughness : f32,
    alpha     : f32,
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

// @group(2) @binding(0) var<uniform> mirrorParams    : MirrorIlluminateParams;
// @group(2) @binding(1) var          mirrorEnvTex    : texture_2d<f32>;
// @group(2) @binding(2) var          mirrorEnvSampler: sampler;

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
    
    // ✅ Get alpha from texture and material factor
    // let alpha = texColor.a * material.baseColorFactor.a;
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

fn computeSpotLight2(light: SpotLight, N: vec3f, fragPos: vec3f, V: vec3f, material: PBRMaterialData) -> vec3f {
    let L = normalize(light.position - fragPos);
    let NdotL = max(dot(N, L), 0.0);
    if (NdotL <= 0.0) {
        return vec3f(0.0);
    }
    return material.baseColor * light.color * light.intensity * NdotL;
}

fn computeSpotLight(light: SpotLight, N: vec3f, fragPos: vec3f, V: vec3f, material: PBRMaterialData) -> vec3f {
    let L = normalize(light.position - fragPos);
    let NdotL = max(dot(N, L), 0.0);

    let theta = dot(L, normalize(-light.direction));
    let epsilon = light.innerCutoff - light.outerCutoff;
    var coneAtten = clamp((theta - light.outerCutoff) / epsilon, 0.0, 1.0);

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

@fragment
fn main(input: FragmentInput) -> @location(0) vec4f {
    let norm = normalize(input.fragNorm);
    let viewDir = normalize(scene.cameraPos - input.fragPos);

    // ✅ Get material with alpha
    let materialData = getPBRMaterial(input.uv);
    
    // ✅ Early discard for fully transparent pixels (alpha cutoff)
    if (materialData.alpha < 0.01) {
        discard;
    }

    var lightContribution = vec3f(0.0);

    for (var i: u32 = 0u; i < MAX_SPOTLIGHTS; i = i + 1u) {
        let sc = spotlights[i].lightViewProj * vec4<f32>(input.fragPos, 1.0);
        let p  = sc.xyz / sc.w;
        let uv = clamp(p.xy * 0.5 + vec2<f32>(0.5), vec2<f32>(0.0), vec2<f32>(1.0));
        let depthRef = p.z * 0.5 + 0.5;

        let lightDir = normalize(spotlights[i].position - input.fragPos);
        let bias = spotlights[i].shadowBias;
        let visibility = sampleShadow(uv, i32(i), depthRef - bias, norm, lightDir);
        let contrib = computeSpotLight(spotlights[i], norm, input.fragPos, viewDir, materialData);
        lightContribution += contrib * visibility;
    }

    let texColor = textureSample(meshTexture, meshSampler, input.uv);
    var finalColor = texColor.rgb * (scene.globalAmbient + lightContribution);

    let N = normalize(input.fragNorm);
    let V = normalize(scene.cameraPos - input.fragPos);
    let fresnel = pow(1.0 - max(dot(N, V), 0.0), 3.0);

    // if (uSelected > 0.5) {
    //     let glowColor = vec3f(0.2, 0.8, 1.0);
    //     finalColor += glowColor * fresnel * 0.1;
    // }

    let alpha = mix(materialData.alpha, 1.0 , 0.5); 
    // ✅ Return color with alpha from material
    return vec4f(finalColor, alpha);
}`;