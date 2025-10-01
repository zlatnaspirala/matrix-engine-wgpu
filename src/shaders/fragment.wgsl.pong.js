export let fragmentWGSLPong = `override shadowDepthTextureSize: f32 = 1024.0;
const PI: f32 = 3.141592653589793;

struct Scene {
    cameraPos : vec3f,
    globalAmbient : vec3f,
};

struct SpotLight {
    position : vec3f,
    direction : vec3f,
    intensity : f32,
    color : vec3f,
    range : f32,
    shadowBias : f32,
    lightViewProj : mat4x4<f32>,
};

struct MaterialPBR {
    baseColorFactor : vec4f,
    metallicFactor : f32,
    roughnessFactor : f32,
};

struct PBRMaterialData {
    baseColor : vec3f,
    metallic : f32,
    roughness : f32,
};

const MAX_SPOTLIGHTS = 20u;

@group(0) @binding(0) var<uniform> scene : Scene;
@group(0) @binding(1) var shadowMapArray: texture_depth_2d_array;
@group(0) @binding(2) var shadowSampler: sampler_comparison;
@group(0) @binding(3) var meshTexture: texture_2d<f32>;
@group(0) @binding(4) var meshSampler: sampler;
@group(0) @binding(5) var<uniform> spotlights: array<SpotLight, MAX_SPOTLIGHTS>;
@group(0) @binding(6) var<uniform> material: MaterialPBR;

struct FragmentInput {
    @location(0) fragPos : vec3f,
    @location(1) fragNorm : vec3f,
    @location(2) uv : vec2f,
};

fn getPBRMaterial(uv: vec2f) -> PBRMaterialData {
    let texColor = textureSample(meshTexture, meshSampler, uv);
    let baseColor = texColor.rgb * material.baseColorFactor.rgb;
    return PBRMaterialData(baseColor, material.metallicFactor, material.roughnessFactor);
}

fn sampleShadow(shadowUV: vec2f, layer: i32, depthRef: f32, normal: vec3f, lightDir: vec3f) -> f32 {
    var visibility: f32 = 0.0;
    let bias = 0.001 + max(0.002 * (1.0 - dot(normal, lightDir)), 0.0);
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
    let N = normalize(input.fragNorm);
    let V = normalize(scene.cameraPos - input.fragPos);
    let materialData = getPBRMaterial(input.uv);
    var lightContribution = vec3f(0.0);

    for(var i: u32 = 0u; i < MAX_SPOTLIGHTS; i = i + 1u) {
        let L = normalize(spotlights[i].position - input.fragPos);
        let NdotL = max(dot(N, L), 0.0);

        // Sample shadow
        let sc = spotlights[i].lightViewProj * vec4<f32>(input.fragPos, 1.0);
        let p = sc.xyz / sc.w;
        let uv = clamp(p.xy * 0.5 + vec2<f32>(0.5), vec2<f32>(0.0), vec2<f32>(1.0));
        let depthRef = p.z * 0.5 + 0.5;
        let visibility = sampleShadow(uv, i32(i), depthRef, N, L);

        // Force spotlight cone = 1
        let coneAtten = 1.0;

        // Simple diffuse * intensity * visibility
        lightContribution += materialData.baseColor * spotlights[i].color * spotlights[i].intensity * NdotL * visibility * coneAtten;
    }

    let texColor = textureSample(meshTexture, meshSampler, input.uv);
    let finalColor = texColor.rgb * (scene.globalAmbient + lightContribution);

    return vec4f(finalColor, 1.0);
}`;