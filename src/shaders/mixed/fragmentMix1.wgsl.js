export let fragmentWGSLMix1 = `override shadowDepthTextureSize: f32 = 1024.0;
const PI: f32 = 3.141592653589793;

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

struct MaterialPBR {
    baseColorFactor : vec4f,
    metallicFactor  : f32,
    roughnessFactor : f32,
    effectMix       : f32,
    lightingEnabled : f32,
};

struct PBRMaterialData {
    baseColor : vec3f,
    metallic  : f32,
    roughness : f32,
};

const MAX_SPOTLIGHTS = 20u;

@group(0) @binding(0) var<uniform> scene : Scene;
@group(0) @binding(1) var shadowMapArray: texture_depth_2d_array;
@group(0) @binding(2) var shadowSampler: sampler_comparison;
@group(0) @binding(3) var meshTexture: texture_2d<f32>;
@group(0) @binding(4) var meshSampler: sampler;
@group(0) @binding(5) var<uniform> spotlights: array<SpotLight, MAX_SPOTLIGHTS>;
@group(0) @binding(6) var metallicRoughnessTex: texture_2d<f32>;
@group(0) @binding(7) var metallicRoughnessSampler: sampler;
@group(0) @binding(8) var<uniform> material: MaterialPBR;
@group(0) @binding(9) var normalTexture: texture_2d<f32>;
@group(0) @binding(10) var normalSampler: sampler;

struct FragmentInput {
    @location(0) shadowPos : vec4f,
    @location(1) fragPos   : vec3f,
    @location(2) fragNorm  : vec3f,
    @location(3) uv        : vec2f,
    @builtin(position) position : vec4f,
};

fn getPBRMaterial(uv: vec2f) -> PBRMaterialData {
    let texColor = textureSample(meshTexture, meshSampler, uv);
    let baseColor = texColor.rgb * material.baseColorFactor.rgb;
    let mrTex = textureSample(metallicRoughnessTex, metallicRoughnessSampler, uv);
    let metallic = mrTex.b * material.metallicFactor;
    let roughness = mrTex.g * material.roughnessFactor;
    return PBRMaterialData(baseColor, metallic, roughness);
}

fn fresnelSchlick(cosTheta: f32, F0: vec3f) -> vec3f {
    return F0 + (1.0 - F0) * pow(clamp(1.0 - cosTheta, 0.0, 1.0), 5.0);
}

fn distributionGGX(N: vec3f, H: vec3f, roughness: f32) -> f32 {
    let a = roughness * roughness;
    let a2 = a * a;
    let NdotH = max(dot(N, H), 0.0);
    let NdotH2 = NdotH * NdotH;
    let denom = (NdotH2 * (a2 - 1.0) + 1.0);
    return a2 / max(PI * denom * denom, 0.0001);
}

fn geometrySchlickGGX(NdotV: f32, roughness: f32) -> f32 {
    let r = (roughness + 1.0);
    let k = (r * r) / 8.0;
    return NdotV / max(NdotV * (1.0 - k) + k, 0.0001);
}

fn geometrySmith(N: vec3f, V: vec3f, L: vec3f, roughness: f32) -> f32 {
    let NdotV = max(dot(N, V), 0.0);
    let NdotL = max(dot(N, L), 0.0);
    return geometrySchlickGGX(NdotV, roughness) * geometrySchlickGGX(NdotL, roughness);
}

// ===== SIMPLIFIED WORKING EFFECT =====

fn calculateEffect(fragCoord: vec2f, resolution: vec2f, time: f32) -> vec3f {
    // Normalize coordinates
    let uv = fragCoord.xy / resolution;
    let aspect = resolution.x / resolution.y;
    let p = (uv * 2.0 - 1.0) * vec2f(aspect, 1.0);
    
    var color = vec3f(0.0);
    
    // Simplified version - 5 iterations instead of 9x7
    for(var i: f32 = 0.0; i < 5.0; i = i + 1.0) {
        // Rotating coordinates
        let angle = time * 0.1 + i * 0.5;
        let c = cos(angle);
        let s = sin(angle);
        var pos = vec2f(
            p.x * c - p.y * s,
            p.x * s + p.y * c
        );
        
        // Add some warping
        pos += sin(pos.yx * 3.0 + time * 0.5) * 0.1;
        
        // Distance field
        let dist = length(pos) - 0.5 - i * 0.15;
        let rings = sin(dist * 10.0 - time * 2.0) * 0.5 + 0.5;
        
        // Color based on iteration and distance
        let hue = i / 5.0 + time * 0.1;
        color += vec3f(
            0.5 + 0.5 * sin(hue * 6.28),
            0.5 + 0.5 * sin(hue * 6.28 + 2.09),
            0.5 + 0.5 * sin(hue * 6.28 + 4.18)
        ) * rings * 0.3;
    }
    
    // Add some glow
    let centerDist = length(p);
    color += vec3f(0.1) / (centerDist * centerDist + 0.1);
    
    return clamp(color, vec3f(0.0), vec3f(1.0));
}

// ===== STANDARD PBR LIGHTING =====

fn calculatePBRLighting(materialData: PBRMaterialData, N: vec3f, V: vec3f, fragPos: vec3f) -> vec3f {
    var Lo = vec3f(0.0);
    
    for(var i: u32 = 0u; i < MAX_SPOTLIGHTS; i = i + 1u) {
        let L = normalize(spotlights[i].position - fragPos);
        let H = normalize(V + L);
        let distance = length(spotlights[i].position - fragPos);
        let attenuation = clamp(1.0 - (distance / max(spotlights[i].range, 0.1)), 0.0, 1.0);
        let radiance = spotlights[i].color * spotlights[i].intensity * attenuation;
        
        let NDF = distributionGGX(N, H, materialData.roughness);
        let G   = geometrySmith(N, V, L, materialData.roughness);
        let F0 = mix(vec3f(0.04), materialData.baseColor, materialData.metallic);
        let F  = fresnelSchlick(max(dot(H, V), 0.0), F0);
        
        let kS = F;
        let kD = (vec3f(1.0) - kS) * (1.0 - materialData.metallic);
        let diffuse  = kD * materialData.baseColor / PI;
        let NdotL = max(dot(N, L), 0.0);
        let specular = (NDF * G * F) / max(4.0 * max(dot(N, V), 0.0) * NdotL + 0.001, 0.001);
        
        Lo += (diffuse + specular) * radiance * NdotL;
    }
    
    return Lo;
}

@fragment
fn main(input: FragmentInput) -> @location(0) vec4f {
    let materialData = getPBRMaterial(input.uv);
    let N = normalize(input.fragNorm);
    let V = normalize(scene.cameraPos - input.fragPos);
    
    let resolution = vec2f(1080.0, 687.0);
    
    var finalColor = vec3f(0.0);
    
    if (material.lightingEnabled > 0.5) {
        // Lighting enabled - calculate PBR
        let Lo = calculatePBRLighting(materialData, N, V, input.fragPos);
        let ambient = scene.globalAmbient * materialData.baseColor;
        let litColor = ambient + Lo;
        
        if (material.effectMix > 0.01) {
            // Blend with effect
            let effectColor = calculateEffect(input.position.xy, resolution, scene.time);
            finalColor = mix(litColor, effectColor, material.effectMix);
        } else {
            // Pure PBR
            finalColor = litColor;
        }
    } else {
        // Pure effect mode
        let effectColor = calculateEffect(input.position.xy, resolution, scene.time);
        // Modulate slightly by material color
        finalColor = effectColor * mix(vec3f(1.0), materialData.baseColor, 0.2);
    }
    
    return vec4f(finalColor, 1.0);
}
`;