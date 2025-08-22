export let fragmentWGSL = `override shadowDepthTextureSize: f32 = 1024.0;

struct Scene {
    lightViewProjMatrix : mat4x4f,
    cameraViewProjMatrix : mat4x4f,
    lightPos : vec3f,
    padding : f32, // alignment
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
    _pad5         : vec2f, // padding to align 16 bytes
};

const MAX_SPOTLIGHTS = 20u;

@group(0) @binding(0) var<uniform> scene : Scene;
@group(0) @binding(1) var shadowMap: texture_depth_2d;
@group(0) @binding(2) var shadowSampler: sampler_comparison;
@group(0) @binding(3) var meshTexture: texture_2d<f32>;
@group(0) @binding(4) var meshSampler: sampler;
@group(0) @binding(5) var<uniform> spotlights: array<SpotLight, MAX_SPOTLIGHTS>;

struct FragmentInput {
    @location(0) shadowPos : vec4f,
    @location(1) fragPos   : vec3f,
    @location(2) fragNorm  : vec3f,
    @location(3) uv        : vec2f,
}

const albedo = vec3f(0.9);

fn calculateSpotlightFactor(light: SpotLight, fragPos: vec3f) -> f32 {
    let L = normalize(light.position - fragPos);
    let theta = dot(L, normalize(-light.direction));
    let epsilon = light.innerCutoff - light.outerCutoff;
    return clamp((theta - light.outerCutoff) / epsilon, 0.0, 1.0);
}

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

@fragment
fn main(input : FragmentInput) -> @location(0) vec4f {
    // Shadow PCF
    var visibility = 0.0;
    let oneOverSize = 1.0 / shadowDepthTextureSize;

    for (var y = -1; y <= 1; y++) {
        for (var x = -1; x <= 1; x++) {
            let offset = vec2f(vec2(x, y)) * oneOverSize;
            visibility += textureSampleCompare(
                shadowMap, shadowSampler,
                input.shadowPos.xy + offset, // already 0..1 from vertex shader
                input.shadowPos.z - 0.007
            );
        }
    }
    visibility /= 9.0;

    let norm = normalize(input.fragNorm);
    let viewDir = normalize(scene.cameraViewProjMatrix[3].xyz - input.fragPos);

    var lightContribution = vec3f(0.0);
    var ambient = vec3f(0.0);

    for (var i = 0u; i < MAX_SPOTLIGHTS; i++) {
        lightContribution += computeSpotLight(spotlights[i], norm, input.fragPos, viewDir);
        ambient += spotlights[i].ambientFactor * spotlights[i].color;
    }

    let texColor = textureSample(meshTexture, meshSampler, input.uv);
    let finalColor = texColor.rgb * (ambient + lightContribution * visibility) * albedo;

    return vec4f(finalColor, 1.0);
}`
