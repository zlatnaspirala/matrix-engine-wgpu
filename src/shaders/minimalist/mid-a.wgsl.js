import {MEConfig} from "../../me-config";

export let midaWGSL = `
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
@group(0) @binding(1) var shadowMapArray: texture_depth_2d_array;
@group(0) @binding(2) var shadowSampler: sampler_comparison;
@group(0) @binding(3) var meshTexture: texture_2d<f32>;
@group(0) @binding(4) var meshSampler: sampler;
@group(0) @binding(5) var<storage, read> spotlights: array<SpotLight, MAX_SPOTLIGHTS>;
@group(0) @binding(6) var metallicRoughnessTex: texture_2d<f32>;
@group(0) @binding(7) var metallicRoughnessSampler: sampler;
@group(0) @binding(8) var<uniform> material: MaterialPBR;

struct FragmentInput {
    @location(0) shadowPos : vec4f,
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

    // ===== FAKE LIGHT (single directional from lightPos) =====
    let L = normalize(scene.lightPos - input.fragPos);

    // ===== HALF-LAMBERT (softer shading) =====
    let NdotL = dot(N, L);
    let diffuse = NdotL * 0.5 + 0.5; // smoother than max(dot,0)

    // ===== CHEAP SPECULAR (Blinn-Phong lite) =====
    let H = normalize(L + V);
    let specPower = mix(8.0, 64.0, 1.0 - material.roughnessFactor);
    let spec = pow(max(dot(N, H), 0.0), specPower);

    // ===== CHEAP FRESNEL =====
    let fresnel = pow(1.0 - max(dot(N, V), 0.0), 3.0);

    // ===== COMBINE =====
    var lighting = scene.globalAmbient;

    lighting += diffuse * 0.8;      // diffuse light
    lighting += spec * 0.3;         // highlight
    lighting += fresnel * 0.2;      // edge glow

    let finalColor = baseColor * lighting;

    let alpha = texColor.a * material.baseColorFactor.a;
    if(alpha < 0.01) {
        discard;
    }

    return vec4f(finalColor, alpha);
}
`;