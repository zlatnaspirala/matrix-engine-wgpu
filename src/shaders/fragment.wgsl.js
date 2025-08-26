export let fragmentWGSL = `override shadowDepthTextureSize: f32 = 1024.0;

struct Scene {
    lightViewProjMatrix  : mat4x4f,
    cameraViewProjMatrix : mat4x4f,
    cameraPos            : vec3f,
    padding2             : f32,   // align to 16 bytes
    lightPos             : vec3f,
    padding              : f32,   // align to 16 bytes
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
    _pad5         : vec2f,

    lightViewProj : mat4x4<f32>,
};

const MAX_SPOTLIGHTS = 20u;
override LIGHT_CLIP_Z_IS_ZERO_TO_ONE: bool = true;

@group(0) @binding(0) var<uniform> scene : Scene;
@group(0) @binding(1) var shadowMapArray: texture_depth_2d_array;
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

// Corrected PCF for texture_depth_2d_array
fn sampleShadow(shadowUV: vec2f, layer: i32, depthRef: f32) -> f32 {
    var visibility: f32 = 0.0;
    let oneOverSize = 1.0 / shadowDepthTextureSize;

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
            layer,                               // array layer (i32)
            depthRef                             // depth comparison
        );
    }

    return visibility / 9.0;
}

@fragment
fn main(input: FragmentInput) -> @location(0) vec4f {
    let norm = normalize(input.fragNorm);

    let viewDir = normalize(scene.cameraPos - input.fragPos);
    // let viewDir = normalize(scene.cameraViewProjMatrix[3].xyz - input.fragPos);

    var lightContribution = vec3f(0.0);
    var ambient = vec3f(0.0);

    for (var i: u32 = 0u; i < MAX_SPOTLIGHTS; i = i + 1u) {
        let sc = spotlights[i].lightViewProj * vec4<f32>(input.fragPos, 1.0);
        let p  = sc.xyz / sc.w;

        let uv = clamp(p.xy * 0.5 + vec2<f32>(0.5), vec2<f32>(0.0), vec2<f32>(1.0));
        // let depthRef = select(p.z * 0.5 + 0.5, p.z, LIGHT_CLIP_Z_IS_ZERO_TO_ONE);
        let depthRef = p.z * 0.5 + 0.5;  // from [-1,1] → [0,1]

       //let visibility = sampleShadow(uv, i32(i), depthRef - 0.01);
       let bias = 0.002; // adjust smaller for large-scale scenes, larger for tiny meshes
       let visibility = sampleShadow(uv, i32(i), depthRef - bias);

        let contrib = computeSpotLight(spotlights[i], norm, input.fragPos, viewDir);
        lightContribution += contrib * visibility;
        ambient += spotlights[i].ambientFactor * spotlights[i].color;
    }

    let texColor = textureSample(meshTexture, meshSampler, input.uv);
    let finalColor = texColor.rgb * (ambient + lightContribution); // * albedo;
    return vec4f(finalColor, 1.0);
}`