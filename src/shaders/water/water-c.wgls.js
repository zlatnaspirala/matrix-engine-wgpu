export let fragmentWaterWGSL = `
/* === Engine uniforms === */

// DINAMIC GLOBALS
const PI: f32 = 3.141592653589793;
override shadowDepthTextureSize: f32 = 1024.0;

// DINAMIC STRUCTS


// PREDEFINED
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

// PREDEFINED
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

// PREDEFINED
struct MaterialPBR {
    baseColorFactor : vec4f,
    metallicFactor  : f32,
    roughnessFactor : f32,
    _pad1           : f32,
    _pad2           : f32,
};

// PREDEFINED
struct PBRMaterialData {
    baseColor : vec3f,
    metallic  : f32,
    roughness : f32,
};

// PREDEFINED
const MAX_SPOTLIGHTS = 20u;

// PREDEFINED
@group(0) @binding(0) var<uniform> scene : Scene;
@group(0) @binding(1) var shadowMapArray: texture_depth_2d_array;
@group(0) @binding(2) var shadowSampler: sampler_comparison;
@group(0) @binding(3) var meshTexture: texture_2d<f32>;
@group(0) @binding(4) var meshSampler: sampler;
@group(0) @binding(5) var<uniform> spotlights: array<SpotLight, MAX_SPOTLIGHTS>;
@group(0) @binding(6) var metallicRoughnessTex: texture_2d<f32>;
@group(0) @binding(7) var metallicRoughnessSampler: sampler;
@group(0) @binding(8) var<uniform> material: MaterialPBR;

// ✅ Graph custom uniforms
struct WaterParams {
    deepColor     : vec3f,
    waveSpeed     : f32,
    shallowColor  : vec3f,
    waveScale     : f32,
    waveHeight    : f32,
    fresnelPower  : f32,
    specularPower : f32,
    _pad1         : f32,
};

@group(3) @binding(0) var<uniform> waterParams: WaterParams;

// ✅ Graph custom functions

// Gerstner wave function for realistic water waves
fn gerstnerWave(pos: vec2f, direction: vec2f, steepness: f32, wavelength: f32, time: f32) -> vec3f {
    let k = 2.0 * PI / wavelength;
    let c = sqrt(9.8 / k);
    let d = normalize(direction);
    let f = k * (dot(d, pos) - c * time);
    let a = steepness / k;
    
    return vec3f(
        d.x * a * cos(f),
        a * sin(f),
        d.y * a * cos(f)
    );
}

// Calculate water normal from multiple waves
fn calculateWaterNormal(worldPos: vec3f, time: f32) -> vec3f {
    let pos = worldPos.xz * waterParams.waveScale;
    let t = time * waterParams.waveSpeed;
    
    // Multiple wave directions for complex motion
    let wave1 = gerstnerWave(pos, vec2f(1.0, 0.0), 0.25, 2.0, t);
    let wave2 = gerstnerWave(pos, vec2f(0.0, 1.0), 0.2, 1.5, t * 1.1);
    let wave3 = gerstnerWave(pos, vec2f(0.7, 0.7), 0.15, 1.0, t * 0.9);
    let wave4 = gerstnerWave(pos, vec2f(-0.5, 0.8), 0.1, 0.8, t * 1.3);
    
    // Sum waves and calculate tangent vectors
    let offset = (wave1 + wave2 + wave3 + wave4) * waterParams.waveHeight;
    
    // Numerical derivative for normal
    let eps = 0.01;
    let posX = worldPos + vec3f(eps, 0.0, 0.0);
    let posZ = worldPos + vec3f(0.0, 0.0, eps);
    
    let offsetX = (
        gerstnerWave(posX.xz * waterParams.waveScale, vec2f(1.0, 0.0), 0.25, 2.0, t) +
        gerstnerWave(posX.xz * waterParams.waveScale, vec2f(0.0, 1.0), 0.2, 1.5, t * 1.1) +
        gerstnerWave(posX.xz * waterParams.waveScale, vec2f(0.7, 0.7), 0.15, 1.0, t * 0.9) +
        gerstnerWave(posX.xz * waterParams.waveScale, vec2f(-0.5, 0.8), 0.1, 0.8, t * 1.3)
    ) * waterParams.waveHeight;
    
    let offsetZ = (
        gerstnerWave(posZ.xz * waterParams.waveScale, vec2f(1.0, 0.0), 0.25, 2.0, t) +
        gerstnerWave(posZ.xz * waterParams.waveScale, vec2f(0.0, 1.0), 0.2, 1.5, t * 1.1) +
        gerstnerWave(posZ.xz * waterParams.waveScale, vec2f(0.7, 0.7), 0.15, 1.0, t * 0.9) +
        gerstnerWave(posZ.xz * waterParams.waveScale, vec2f(-0.5, 0.8), 0.1, 0.8, t * 1.3)
    ) * waterParams.waveHeight;
    
    let tangentX = normalize(vec3f(eps, offsetX.y - offset.y, 0.0));
    let tangentZ = normalize(vec3f(0.0, offsetZ.y - offset.y, eps));
    
    return normalize(cross(tangentZ, tangentX));
}

// Fresnel effect for water reflections
fn fresnelSchlick(cosTheta: f32, F0: f32) -> f32 {
    return F0 + (1.0 - F0) * pow(1.0 - cosTheta, waterParams.fresnelPower);
}

// PREDEFINED Fragment input
struct FragmentInput {
    @location(0) shadowPos : vec4f,
    @location(1) fragPos   : vec3f,
    @location(2) fragNorm  : vec3f,
    @location(3) uv        : vec2f,
};

// PREDEFINED PBR helpers
fn getPBRMaterial(uv: vec2f) -> PBRMaterialData {
    let texColor = textureSample(meshTexture, meshSampler, uv);
    let baseColor = texColor.rgb * material.baseColorFactor.rgb;
    let mrTex = textureSample(metallicRoughnessTex, metallicRoughnessSampler, uv);
    let metallic = mrTex.b * material.metallicFactor;
    let roughness = mrTex.g * material.roughnessFactor;
    return PBRMaterialData(baseColor, metallic, roughness);
}

@fragment
fn main(input: FragmentInput) -> @location(0) vec4f {
    // Calculate animated water normal
    let waterNormal = calculateWaterNormal(input.fragPos, scene.time);
    
    // View direction
    let viewDir = normalize(scene.cameraPos - input.fragPos);
    
    // Fresnel effect (0 = looking straight down, 1 = grazing angle)
    let fresnel = fresnelSchlick(max(dot(waterNormal, viewDir), 0.0), 0.02);
    
    // Light direction
    let lightDir = normalize(scene.lightPos - input.fragPos);
    
    // Diffuse lighting
    let diff = max(dot(waterNormal, lightDir), 0.0);
    
    // Specular (sun reflection on water)
    let halfDir = normalize(lightDir + viewDir);
    let spec = pow(max(dot(waterNormal, halfDir), 0.0), waterParams.specularPower);
    
    // Mix deep and shallow water colors based on fresnel
    let waterColor = mix(waterParams.deepColor, waterParams.shallowColor, fresnel * 0.5 + 0.5);
    
    // Enhanced lighting for more visible effect
    let ambient = scene.globalAmbient * waterColor * 0.3;
    let diffuse = diff * waterColor * 1.2;
    let specular = spec * vec3f(1.0, 1.0, 1.0) * fresnel * 2.0;
    
    // Enhanced foam on wave peaks
    let foamAmount = pow(max(waterNormal.y - 0.6, 0.0), 2.0) * 0.8;
    let foam = vec3f(1.0, 1.0, 1.0) * foamAmount;
    
    // Add some caustics-like effect based on waves
    let caustics = sin(input.fragPos.x * 10.0 + scene.time * 2.0) * 
                   sin(input.fragPos.z * 10.0 + scene.time * 2.0) * 0.15 + 0.15;
    let causticsColor = waterColor * caustics;
    
    // Final color with enhanced effects
    let finalColor = ambient + diffuse + specular + foam + causticsColor;
    
    // MUCH more transparent - alpha between 0.2 and 0.5
    // let alpha = mix(0.2, 0.5, fresnel);
    let alpha = mix(0.1, 0.3, fresnel); // Super transparent

    // Make the color more vibrant so it's visible even when transparent
    let vibrantColor = finalColor * 1.5;
    
    return vec4f(vibrantColor, alpha);
}`;