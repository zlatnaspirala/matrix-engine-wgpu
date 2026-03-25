export let colorbWGSL = `
override shadowDepthTextureSize: f32;

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

// KEEP LAYOUT
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
    @location(1) fragPos   : vec3f,
    @location(2) fragNorm  : vec3f,
};

@fragment
fn main(input: FragmentInput) -> @location(0) vec4f {

    let N = normalize(input.fragNorm);
    let V = normalize(scene.cameraPos - input.fragPos);

    // ===== EDGE DETECTION =====
    let NdotV = abs(dot(N, V));

    // ===== HARD EDGE MASK (THIS FIXES YOUR PROBLEM) =====
    let edgeWidth = 0.2;     // tweak
    let edge = smoothstep(0.0, edgeWidth, 1.0 - NdotV);

    // ===== PURE COLORS =====
    let glowColor = vec3f(0.0, 1.0, 1.0);
    let baseColor = vec3f(0.0); // FULL BLACK CORE

    let color = mix(baseColor, glowColor, edge);

    return vec4f(color, material.baseColorFactor.a);
}`;

// export let colorbWGSL = `
// override shadowDepthTextureSize: f32;

// struct Scene {
//     lightViewProjMatrix  : mat4x4f,
//     cameraViewProjMatrix : mat4x4f,
//     cameraPos            : vec3f,
//     padding2             : f32,
//     lightPos             : vec3f,
//     padding              : f32,
//     globalAmbient        : vec3f,
//     padding3             : f32,
//     time                 : f32,
//     deltaTime            : f32,
//     padding4             : vec2f,
// };

// struct MaterialPBR {
//     baseColorFactor : vec4f,
//     metallicFactor  : f32,
//     roughnessFactor : f32,
//     _pad1           : f32,
//     _pad2           : f32,
// };

// struct SpotLight {
//     position      : vec3f,
//     _pad1         : f32,
//     direction     : vec3f,
//     _pad2         : f32,
//     innerCutoff   : f32,
//     outerCutoff   : f32,
//     intensity     : f32,
//     _pad3         : f32,
//     color         : vec3f,
//     _pad4         : f32,
//     range         : f32,
//     ambientFactor : f32,
//     shadowBias    : f32,
//     _pad5         : f32,
//     lightViewProj : mat4x4<f32>,
// };

// const MAX_SPOTLIGHTS = 20u;

// // ===== KEEP ORIGINAL BINDINGS =====
// @group(0) @binding(0) var<uniform> scene : Scene;
// @group(0) @binding(1) var shadowMapArray: texture_depth_2d_array;
// @group(0) @binding(2) var shadowSampler: sampler_comparison;
// @group(0) @binding(3) var meshTexture: texture_2d<f32>;
// @group(0) @binding(4) var meshSampler: sampler;
// @group(0) @binding(5) var<storage, read> spotlights: array<SpotLight, MAX_SPOTLIGHTS>;
// @group(0) @binding(6) var metallicRoughnessTex: texture_2d<f32>;
// @group(0) @binding(7) var metallicRoughnessSampler: sampler;
// @group(0) @binding(8) var<uniform> material: MaterialPBR;

// struct FragmentInput {
//     @location(1) fragPos   : vec3f,
//     @location(2) fragNorm  : vec3f,
// };

// @fragment
// fn main(input: FragmentInput) -> @location(0) vec4f {

//     let N = normalize(input.fragNorm);
//     let V = normalize(scene.cameraPos - input.fragPos);

//     let fresnel = pow(1.0 - max(dot(N, V), 0.0), 4.0);

//     let base = material.baseColorFactor.rgb * 0.1;
//     let glow = vec3f(0.0, 1.0, 1.0);

//     let color = base + glow * fresnel * 2.0;

//     return vec4f(color, material.baseColorFactor.a);
// }
// `;