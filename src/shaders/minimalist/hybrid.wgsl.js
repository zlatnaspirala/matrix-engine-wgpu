import {MEConfig} from "../../me-config";

export let hybridWGSL = `
override shadowDepthTextureSize: f32 = ${MEConfig.SHADOW_RES};

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

struct MaterialPBR {
    baseColorFactor : vec4f,
    metallicFactor  : f32,
    roughnessFactor : f32,
    _pad1           : f32,
    _pad2           : f32,
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

const MAX_SPOTLIGHTS = 20u;

@group(0) @binding(0) var<uniform> scene : Scene;
@group(0) @binding(3) var meshTexture: texture_2d<f32>;
@group(0) @binding(4) var meshSampler: sampler;
@group(0) @binding(8) var<uniform> material: MaterialPBR;

struct FragmentInput {
    @location(1) fragPos   : vec3f,
    @location(2) fragNorm  : vec3f,
    @location(3) uv        : vec2f,
};

@fragment
fn main(input: FragmentInput) -> @location(0) vec4f {

    let texColor = textureSample(meshTexture, meshSampler, input.uv);
    let baseColor = texColor.rgb * material.baseColorFactor.rgb;

    let N = normalize(input.fragNorm);
    let V = normalize(scene.cameraPos - input.fragPos);
    let L = normalize(scene.lightPos - input.fragPos);

    // ===== DISTANCE BASED LOD =====
    let dist = distance(scene.cameraPos, input.fragPos);

    // tweak these!
    let nearDist = 50.0;
    let farDist  = 200.0;

    let lodFactor = clamp((dist - nearDist) / (farDist - nearDist), 0.0, 1.0);

    // ===== CHEAP =====
    let cheapLighting = scene.globalAmbient;

    // ===== MID QUALITY =====
    let NdotL = dot(N, L);
    let diffuse = NdotL * 0.5 + 0.5;

    let H = normalize(L + V);
    let specPower = mix(8.0, 64.0, 1.0 - material.roughnessFactor);
    let spec = pow(max(dot(N, H), 0.0), specPower);

    let fresnel = pow(1.0 - max(dot(N, V), 0.0), 3.0);

    var midLighting = scene.globalAmbient;
    midLighting += diffuse * 0.8;
    midLighting += spec * 0.3;
    midLighting += fresnel * 0.2;

    // ===== FINAL BLEND =====
    let lighting = mix(midLighting, cheapLighting, lodFactor);

    let finalColor = baseColor * lighting;

    // ===== DISTANCE FOG (BONUS 🔥) =====
    let fogStart = 150.0;
    let fogEnd   = 400.0;

    let fogFactor = clamp((dist - fogStart) / (fogEnd - fogStart), 0.0, 1.0);
    let fogColor = vec3f(0.6, 0.7, 0.8);

    let colorWithFog = mix(finalColor, fogColor, fogFactor);

    let alpha = texColor.a * material.baseColorFactor.a;
    if(alpha < 0.01) {
        discard;
    }

    return vec4f(colorWithFog, alpha);
}
`;