import {MEConfig} from "../../me-config";

export let miniaWGSL = `
override shadowDepthTextureSize: f32 = ${MEConfig.SHADOW_RES};

struct Scene {
    lightViewProjMatrix  : mat4x4f,   // unused (kept for layout)
    cameraViewProjMatrix : mat4x4f,   // unused
    cameraPos            : vec3f,     // unused
    padding2             : f32,
    lightPos             : vec3f,     // unused
    padding              : f32,
    globalAmbient        : vec3f,
    padding3             : f32,
    time                 : f32,
    deltaTime            : f32,
    padding4             : vec2f,
};

// MINIMAL MATERIAL (keep layout compatibility)
struct MaterialPBR {
    baseColorFactor : vec4f,
    metallicFactor  : f32,  // unused
    roughnessFactor : f32,  // unused
    _pad1           : f32,
    _pad2           : f32,
};

// Dummy spotlight struct (not used but keeps binding valid)
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
@group(0) @binding(3) var<storage, read> spotlights: array<SpotLight, MAX_SPOTLIGHTS>;

@group(1) @binding(0) var meshTexture: texture_2d<f32>;
@group(1) @binding(1) var meshSampler: sampler;

@group(1) @binding(2) var metallicRoughnessTex: texture_2d<f32>;
@group(1) @binding(3) var metallicRoughnessSampler: sampler;

@group(1) @binding(4) var<uniform> material: MaterialPBR;

@group(1) @binding(5) var normalTexture: texture_2d<f32>;
@group(1) @binding(6) var normalSampler: sampler;

struct FragmentInput {
    @location(0) shadowPos : vec4f, // unused
    @location(1) fragPos   : vec3f, // unused
    @location(2) fragNorm  : vec3f, // unused
    @location(3) uv        : vec2f,
};

@fragment
fn main(input: FragmentInput) -> @location(0) vec4f {

    // ===== TEXTURE =====
    let texColor = textureSample(meshTexture, meshSampler, input.uv);

    // ===== BASIC COLOR CONTROL =====
    let baseColor = texColor.rgb * material.baseColorFactor.rgb;

    // ===== AMBIENT ONLY =====
    let finalColor = baseColor * scene.globalAmbient;

    // ===== ALPHA =====
    let alpha = texColor.a * material.baseColorFactor.a;

    // optional discard (keep if you use alpha cutout)
    if(alpha < 0.01) {
        discard;
    }

    return vec4f(finalColor, alpha);
}
`;