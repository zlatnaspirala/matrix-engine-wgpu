export let fragmentWGSL = `override shadowDepthTextureSize: f32 = 1024.0;

struct Scene {
    lightViewProjMatrix : mat4x4f,
    cameraViewProjMatrix : mat4x4f,
    lightPos : vec3f,
    padding : f32,
}

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
    _pad5         : vec2f,
};

const MAX_SPOTLIGHTS = 20u;

@group(0) @binding(0) var<uniform> scene : Scene;
@group(0) @binding(1) var shadowMapArray: texture_depth_2d_array; // depth array
@group(0) @binding(2) var shadowSampler: sampler_comparison;
@group(0) @binding(3) var meshTexture: texture_2d<f32>;
@group(0) @binding(4) var meshSampler: sampler;
@group(0) @binding(5) var<uniform> spotlights: array<SpotLight, MAX_SPOTLIGHTS>;

struct FragmentInput {
    @location(0) shadowPos : vec4f,  // xy = shadow UV, z = depth, w unused
    @location(1) fragPos   : vec3f,
    @location(2) fragNorm  : vec3f,
    @location(3) uv        : vec2f,
}

const albedo = vec3f(0.9);

// Calculate spotlight factor based on cone angles
fn calculateSpotlightFactor(light: SpotLight, fragPos: vec3f) -> f32 {
    let L = normalize(light.position - fragPos);
    let theta = dot(L, normalize(-light.direction));
    let epsilon = light.innerCutoff - light.outerCutoff;
    return clamp((theta - light.outerCutoff) / epsilon, 0.0, 1.0);
}

// Compute diffuse + specular contribution
fn computeSpotLight(light: SpotLight, normal: vec3f, fragPos: vec3f, viewDir: vec3f) -> vec3f {
    let L = light.position - fragPos;
    let distance = length(L);
    let lightDir = normalize(L);

    let spotFactor = calculateSpotlightFactor(light, fragPos);
    let atten = clamp(1.0 - (distance / light.range), 0.0, 1.0);

    let diff = max(dot(normal, lightDir), 0.0);
    let halfwayDir = normalize(lightDir + viewDir);
    let spec = pow(max(dot(normal, halfwayDir), 0.0), 32.0);

    let diffuse  = diff * light.color * light.intensity * atten;
    let specular = spec * light.color * light.intensity * atten;

    return (diffuse + specular) * spotFactor;
}

// Sample shadow with PCF from texture_depth_2d_array
fn sampleShadow(shadowUV: vec2f, layer: u32, depthRef: f32) -> f32 {
    var visibility: f32 = 0.0;
    let oneOverSize = 1.0 / shadowDepthTextureSize;

    // 3x3 PCF kernel
    let offsets: array<vec2f, 9> = array<vec2f, 9>(
        vec2(-1.0, -1.0), vec2(0.0, -1.0), vec2(1.0, -1.0),
        vec2(-1.0,  0.0), vec2(0.0,  0.0), vec2(1.0,  0.0),
        vec2(-1.0,  1.0), vec2(0.0,  1.0), vec2(1.0,  1.0)
    );

    for (var i: u32 = 0u; i < 9u; i = i + 1u) {
        visibility += textureSampleCompare(
            shadowMapArray,
            shadowSampler,
            shadowUV + offsets[i] * oneOverSize, // vec2 coords
            layer,                               // array layer
            depthRef                              // depth
        );
    }

    return visibility / 9.0;
}

@fragment
fn main(input : FragmentInput) -> @location(0) vec4f {
    let norm = normalize(input.fragNorm);
    let viewDir = normalize(scene.cameraViewProjMatrix[3].xyz - input.fragPos);

    var lightContribution = vec3f(0.0);
    var ambient = vec3f(0.0);

    for (var i = 0u; i < MAX_SPOTLIGHTS; i++) {
        // Sample shadow for this light
        let visibility = sampleShadow(input.shadowPos.xy, i, input.shadowPos.z - 0.007);

        // Add light contribution modulated by shadow
        lightContribution += computeSpotLight(spotlights[i], norm, input.fragPos, viewDir) * visibility;

        // Ambient contribution
        ambient += spotlights[i].ambientFactor * spotlights[i].color;
    }

    let texColor = textureSample(meshTexture, meshSampler, input.uv);
    let finalColor = texColor.rgb * (ambient + lightContribution) * albedo;

    return vec4f(finalColor, 1.0);
}`
