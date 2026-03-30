import {MEConfig} from "../../me-config";

export let miniWGSL = `

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

// minimal dummy spotlight (kept for layout compatibility)
struct SpotLight {
    position : vec3f,
    _pad1    : f32,
};

// minimal material (layout compatibility)
struct MaterialPBR {
    baseColorFactor : vec4f,
    metallicFactor  : f32,
    roughnessFactor : f32,
    effectMix       : f32,
    lightingEnabled : f32,
    ambientColor    : vec3f,  // add this
    _pad            : f32,    // alignment padding
};

const MAX_SPOTLIGHTS = 20u;

@group(0) @binding(0) var<uniform> scene : Scene;

// kept only to keep bind group layout valid
@group(0) @binding(1) var shadowMapArray: texture_depth_2d_array;
@group(0) @binding(2) var shadowSampler: sampler_comparison;

@group(0) @binding(3) var meshTexture: texture_2d<f32>;
@group(0) @binding(4) var meshSampler: sampler;

// dummy storage binding (not used)
@group(0) @binding(5) var<storage, read> spotlights: array<SpotLight, MAX_SPOTLIGHTS>;

// dummy PBR bindings
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
    var finalColor = texColor.rgb * ( material.ambientColor + scene.globalAmbient);
    // alpha from material factor
    let alpha = texColor.a * material.baseColorFactor.a;
    if(alpha < 0.01){
        discard;
    }
    return vec4f(finalColor, alpha);
}
`;