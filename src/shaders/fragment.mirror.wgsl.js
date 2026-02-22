export const mirrorIlluminateFragmentWGSL = `
override shadowDepthTextureSize: f32 = 1024.0;
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
    _pad1           : f32,
    _pad2           : f32,
};

struct PBRMaterialData {
    baseColor : vec3f,
    metallic  : f32,
    roughness : f32,
    alpha     : f32,
};

struct MirrorIlluminateParams {
    mirrorTint        : vec3f,   // tint applied to the specular/env reflection  (default: 1,1,1)
    reflectivity      : f32,     // 0 = no mirror effect, 1 = full mirror        (default: 0.9)
    illuminateColor   : vec3f,   // colour of the rim/illuminate glow             (default: 0.4, 0.8, 1.0)
    illuminateStrength: f32,     // 0..1 master intensity of illuminate           (default: 1.0)
    illuminatePulse   : f32,     // pulse speed (Hz). 0 = static                  (default: 1.2)
    fresnelPower      : f32,     // Fresnel exponent for rim sharpness            (default: 4.0)
    envLodBias        : f32,     // mip bias for env sample (blur ≈ roughness)    (default: 0.0)
    usePlanarReflection: f32,  // ✅ NEW: 0 = env map, 1 = planar/screen-space
    baseColorMix       : f32,  // ✅ NEW: 0=pure env, 1=normal material mix
    _pad2              : vec3f, // ✅ Padding to maintain alignment
};

const MAX_SPOTLIGHTS = 20u;

@group(0) @binding(0) var<uniform> scene                  : Scene;
@group(0) @binding(1) var          shadowMapArray         : texture_depth_2d_array;
@group(0) @binding(2) var          shadowSampler          : sampler_comparison;
@group(0) @binding(3) var          meshTexture            : texture_2d<f32>;
@group(0) @binding(4) var          meshSampler            : sampler;
@group(0) @binding(5) var<uniform> spotlights             : array<SpotLight, MAX_SPOTLIGHTS>;
@group(0) @binding(6) var          metallicRoughnessTex   : texture_2d<f32>;
@group(0) @binding(7) var          metallicRoughnessSampler : sampler;
@group(0) @binding(8) var<uniform> material               : MaterialPBR;

@group(2) @binding(0) var<uniform> mirrorParams    : MirrorIlluminateParams;
@group(2) @binding(1) var          mirrorEnvTex    : texture_2d<f32>;
@group(2) @binding(2) var          mirrorEnvSampler: sampler;

struct FragmentInput {
    @location(0) shadowPos : vec4f,
    @location(1) fragPos   : vec3f,
    @location(2) fragNorm  : vec3f,
    @location(3) uv        : vec2f,
};

fn getPBRMaterial(uv: vec2f) -> PBRMaterialData {
    let texColor  = textureSample(meshTexture, meshSampler, uv);
    let baseColor = texColor.rgb * material.baseColorFactor.rgb;
    let mrTex     = textureSample(metallicRoughnessTex, metallicRoughnessSampler, uv);
    let metallic  = mrTex.b * material.metallicFactor;
    let roughness = mrTex.g * material.roughnessFactor;
    let alpha     = material.baseColorFactor.a;
    return PBRMaterialData(baseColor, metallic, roughness, alpha);
}

fn fresnelSchlick(cosTheta: f32, F0: vec3f) -> vec3f {
    return F0 + (1.0 - F0) * pow(1.0 - cosTheta, 5.0);
}

fn distributionGGX(N: vec3f, H: vec3f, roughness: f32) -> f32 {
    let a      = roughness * roughness;
    let a2     = a * a;
    let NdotH  = max(dot(N, H), 0.0);
    let NdotH2 = NdotH * NdotH;
    let denom  = (NdotH2 * (a2 - 1.0) + 1.0);
    return a2 / (PI * denom * denom);
}

fn geometrySchlickGGX(NdotV: f32, roughness: f32) -> f32 {
    let r = (roughness + 1.0);
    let k = (r * r) / 8.0;
    return NdotV / (NdotV * (1.0 - k) + k);
}

fn geometrySmith(N: vec3f, V: vec3f, L: vec3f, roughness: f32) -> f32 {
    let NdotV = max(dot(N, V), 0.0);
    let NdotL = max(dot(N, L), 0.0);
    return geometrySchlickGGX(NdotV, roughness) * geometrySchlickGGX(NdotL, roughness);
}

fn calculateSpotlightFactor(light: SpotLight, fragPos: vec3f) -> f32 {
    let L     = normalize(light.position - fragPos);
    let theta = dot(L, normalize(-light.direction));
    let eps   = light.innerCutoff - light.outerCutoff;
    return clamp((theta - light.outerCutoff) / eps, 0.0, 1.0);
}

fn computeSpotLight(light: SpotLight, N: vec3f, fragPos: vec3f, V: vec3f, mat: PBRMaterialData) -> vec3f {
    let L    = normalize(light.position - fragPos);
    let NdotL = max(dot(N, L), 0.0);
    let theta = dot(L, normalize(-light.direction));
    let eps   = light.innerCutoff - light.outerCutoff;
    var coneAtten = clamp((theta - light.outerCutoff) / eps, 0.0, 1.0);
    if (coneAtten <= 0.0 || NdotL <= 0.0) { return vec3f(0.0); }

    let F0    = mix(vec3f(0.04), mat.baseColor.rgb, vec3f(mat.metallic));
    let H     = normalize(L + V);
    let alpha  = mat.roughness * mat.roughness;
    let alpha2 = alpha * alpha;
    let NdotH  = max(dot(N, H), 0.0);
    let denom  = (NdotH * NdotH * (alpha2 - 1.0) + 1.0);
    let D      = alpha2 / (PI * denom * denom + 1e-5);
    let k      = (alpha + 1.0) * (alpha + 1.0) / 8.0;
    let NdotV  = max(dot(N, V), 0.0);
    let Gv     = NdotV / (NdotV * (1.0 - k) + k);
    let Gl     = NdotL / (NdotL * (1.0 - k) + k);
    let G      = Gv * Gl;
    let F      = F0 + (1.0 - F0) * pow(1.0 - max(dot(H, V), 0.0), 5.0);
    return mat.baseColor * light.color * light.intensity * NdotL * coneAtten;
}

fn sampleShadow(shadowUV: vec2f, layer: i32, depthRef: f32, normal: vec3f, lightDir: vec3f) -> f32 {
    var visibility: f32 = 0.0;
    let biasConstant: f32 = 0.001;
    let slopeBias = max(0.002 * (1.0 - dot(normal, lightDir)), 0.0);
    let bias      = biasConstant + slopeBias;
    let oneOverSize = 1.0 / (shadowDepthTextureSize * 0.5);
    let offsets: array<vec2f, 9> = array<vec2f, 9>(
        vec2(-1.0, -1.0), vec2(0.0, -1.0), vec2(1.0, -1.0),
        vec2(-1.0,  0.0), vec2(0.0,  0.0), vec2(1.0,  0.0),
        vec2(-1.0,  1.0), vec2(0.0,  1.0), vec2(1.0,  1.0)
    );
    for (var i: u32 = 0u; i < 9u; i++) {
        visibility += textureSampleCompare(
            shadowMapArray, shadowSampler,
            shadowUV + offsets[i] * oneOverSize,
            layer, depthRef - bias
        );
    }
    return visibility / 9.0;
}

// ─── NEW: Mirror Illuminate helpers ──────────────────────────────────────────
fn reflectToEnvUV(R: vec3f, fragPos: vec3f) -> vec2f {
    let dir = normalize(R);
    let phi = atan2(dir.x, dir.z);     // Horizontal angle
    let theta = acos(clamp(dir.y, -1.0, 1.0));  // Vertical angle
    let u = phi / (2.0 * PI) + 0.5;
    let v = theta / PI;
    return vec2f(u, v);
    // let dir = normalize(R);
    // let phi = atan2(-dir.z, dir.x);  // Note the negative
    // let theta = acos(clamp(dir.y, -1.0, 1.0));
    // let u = phi / (2.0 * PI) + 0.5;
    // let v = theta / PI;
    // return vec2f(u, 1.0 - v);  // Try flipping V
}

// Planar mirror UV (screen-space)
fn reflectToPlanarUV(fragPos: vec3f, N: vec3f, V: vec3f) -> vec2f {
    // Project to clip space using camera view-proj
    let clipPos = scene.cameraViewProjMatrix * vec4f(fragPos, 1.0);
    let ndc = clipPos.xy / clipPos.w;
    // Flip Y for texture coordinates
    return vec2f(ndc.x * 0.5 + 0.5, -ndc.y * 0.5 + 0.5);
}

// ✅ UNIFIED: Sample mirror texture (auto-detects mode)
fn sampleMirrorEnv(R: vec3f, fragPos: vec3f, N: vec3f, V: vec3f, roughness: f32) -> vec3f {
    var uv: vec2f;
    if (mirrorParams.usePlanarReflection > 0.5) {
        uv = reflectToPlanarUV(fragPos, N, V);
    } else {
        uv = reflectToEnvUV(R , fragPos);
    }
    return textureSample(mirrorEnvTex, mirrorEnvSampler, uv).rgb;
}

// Animated illuminate rim — pulsing Fresnel edge glow
fn computeMirrorIlluminate(N: vec3f, V: vec3f, fragPos: vec3f) -> vec3f {
    // Fresnel rim
    let NdotV = max(dot(N, V), 0.0);
    let rim   = pow(1.0 - NdotV, mirrorParams.fresnelPower);

    // Pulse: smoothly oscillate between [0.3, 1.0] so it never fully dies
    let pulse = mix(0.3, 1.0,
        (sin(scene.time * mirrorParams.illuminatePulse * 2.0 * PI) * 0.5 + 0.5)
    );

    // Spatial shimmer along Y: gives a "light sweep" feel on the surface
    let shimmer = sin(fragPos.y * 3.0 + scene.time * 2.0) * 0.15 + 0.85;

    return mirrorParams.illuminateColor
        * mirrorParams.illuminateStrength
        * rim * pulse * shimmer;
}

// Mirror specular: sharp GGX lobe biased toward near-zero roughness
fn computeMirrorSpecular(N: vec3f, V: vec3f, lightDir: vec3f, lightColor: vec3f) -> vec3f {
    let H       = normalize(lightDir + V);
    // clamp roughness to a low value so mirrors stay crisp
    let mirrorR = max(0.02, material.roughnessFactor * 0.15);
    let D       = distributionGGX(N, H, mirrorR);
    let G       = geometrySmith(N, V, lightDir, mirrorR);
    let F0      = mix(vec3f(0.9), mirrorParams.mirrorTint, vec3f(material.metallicFactor));
    let F       = fresnelSchlick(max(dot(H, V), 0.0), F0);
    let NdotL   = max(dot(N, lightDir), 0.0);
    let NdotV   = max(dot(N, V),        0.0);
    let spec    = (D * G * F) / (4.0 * NdotV * NdotL + 1e-5);
    return spec * lightColor * NdotL * mirrorParams.reflectivity;
}

fn worldPosToEquirectUV(worldPos: vec3f) -> vec2f {
    // Normalize position relative to object center
    let dir = normalize(worldPos);
    
    // Convert to spherical coordinates
    let u = atan2(dir.z, dir.x) / (2.0 * PI) + 0.5;
    let v = asin(clamp(dir.y, -1.0, 1.0)) / PI + 0.5;
    
    return vec2f(u, v);
}

// ─── Main ────────────────────────────────────────────────────────────────────
@fragment
fn main(input: FragmentInput) -> @location(0) vec4f {

    let N = normalize(input.fragNorm);
    let V = normalize(scene.cameraPos - input.fragPos);

    let materialData = getPBRMaterial(input.uv);
    if (materialData.alpha < 0.01) { discard; }

    // ── Shadow + existing spotlight loop (unchanged logic) ────────────────
    var lightContribution = vec3f(0.0);

    for (var i: u32 = 0u; i < MAX_SPOTLIGHTS; i++) {
        let sc       = spotlights[i].lightViewProj * vec4<f32>(input.fragPos, 1.0);
        let p        = sc.xyz / sc.w;
        let shadowUV = clamp(p.xy * 0.5 + vec2<f32>(0.5), vec2<f32>(0.0), vec2<f32>(1.0));
        let depthRef = p.z * 0.5 + 0.5;
        let lightDir = normalize(spotlights[i].position - input.fragPos);
        let vis      = sampleShadow(shadowUV, i32(i), depthRef - spotlights[i].shadowBias, N, lightDir);
        let contrib  = computeSpotLight(spotlights[i], N, input.fragPos, V, materialData);
        lightContribution += contrib * vis;

        // ── Mirror: sharp specular from each spotlight ────────────────────
        let mirrorSpec = computeMirrorSpecular(N, V, lightDir, spotlights[i].color * spotlights[i].intensity);
        let coneFactor = calculateSpotlightFactor(spotlights[i], input.fragPos);
        lightContribution += mirrorSpec * coneFactor * vis;
    }

    // ── Env reflection ───────────────────────────────────────────────────
    let R = reflect(-V, N);
    var envColor: vec3f;
    if (mirrorParams.baseColorMix < 0.01) {
        // Sky/background objects: use mesh UV (requires proper UV unwrap)
        envColor = textureSample(mirrorEnvTex, mirrorEnvSampler, input.uv).rgb;
    } else {
        // Reflective objects: use reflection vector
        //  let worldUV = worldPosToEquirectUV(normalize(input.fragPos));
        //  envColor = textureSample(mirrorEnvTex, mirrorEnvSampler, worldUV).rgb * mirrorParams.mirrorTint;

        envColor = sampleMirrorEnv(R, input.fragPos, N, V, materialData.roughness) * mirrorParams.mirrorTint;
    }
    let envFresn = fresnelSchlick(max(dot(N, V), 0.0), 
                   mix(vec3f(0.04), vec3f(1.0), vec3f(materialData.metallic)));

    let texColor = textureSample(meshTexture, meshSampler, input.uv);
    var finalColor = texColor.rgb * (scene.globalAmbient + lightContribution);
    finalColor = mix(
        envColor,                    // Pure env (for sky objects)
        finalColor,                  // Normal lit material
        mirrorParams.baseColorMix    // 0=pure env, 1=normal material
    );

    // Add Fresnel reflection on top
    finalColor = mix(finalColor, envColor, envFresn * mirrorParams.reflectivity);
    let illuminate = computeMirrorIlluminate(N, V, input.fragPos);
    finalColor += illuminate;
    let alpha = mix(materialData.alpha, 1.0, 0.5);
    return vec4f(finalColor, alpha);
}
`;