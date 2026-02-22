export let fragmentMirrorWGSLInstanced = `
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

// ── Illuminate params (subset of MirrorIlluminateParams) ──────────────────────
struct IlluminateParams {
    illuminateColor    : vec3f,
    illuminateStrength : f32,
    illuminatePulse    : f32,
    fresnelPower       : f32,
    // _pad1              : vec2f,
    time               : f32,   // ← pass time here instead
    _pad1              : f32,
};

const MAX_SPOTLIGHTS = 20u;

@group(0) @binding(0) var<uniform> scene      : Scene;
@group(0) @binding(1) var shadowMapArray      : texture_depth_2d_array;
@group(0) @binding(2) var shadowSampler       : sampler_comparison;
@group(0) @binding(3) var meshTexture         : texture_2d<f32>;
@group(0) @binding(4) var meshSampler         : sampler;
@group(0) @binding(5) var<uniform> spotlights : array<SpotLight, MAX_SPOTLIGHTS>;
@group(0) @binding(6) var metallicRoughnessTex      : texture_2d<f32>;
@group(0) @binding(7) var metallicRoughnessSampler  : sampler;
@group(0) @binding(8) var<uniform> material         : MaterialPBR;

@group(2) @binding(0) var<uniform> illuminateParams : IlluminateParams;

struct FragmentInput {
    @location(0) shadowPos : vec4f,
    @location(1) fragPos   : vec3f,
    @location(2) fragNorm  : vec3f,
    @location(3) uv        : vec2f,
    @location(4) colorMult : vec4f,
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

fn computeSpotLight(light: SpotLight, N: vec3f, fragPos: vec3f, V: vec3f, mat: PBRMaterialData) -> vec3f {
    let L     = normalize(light.position - fragPos);
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
    let slopeBias   = max(0.002 * (1.0 - dot(normal, lightDir)), 0.0);
    let bias        = biasConstant + slopeBias;
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

// ── Animate illuminate rim — identical logic to mirror shader ─────────────────
fn computeIlluminate(N: vec3f, V: vec3f, fragPos: vec3f) -> vec3f {
    let NdotV = max(dot(N, V), 0.0);
    let rim   = pow(1.0 - NdotV, illuminateParams.fresnelPower);

    // Pulse: smoothly oscillate between [0.3, 1.0]
    let pulse = mix(0.3, 1.0,
        (sin(illuminateParams.time * illuminateParams.illuminatePulse * 2.0 * PI) * 0.5 + 0.5)
    );

    // Spatial shimmer along Y
    let shimmer = sin(fragPos.y * 3.0 +illuminateParams.time * 2.0) * 0.15 + 0.85;

    return illuminateParams.illuminateColor
         * illuminateParams.illuminateStrength
         * rim * pulse * shimmer;
}

@fragment
fn main(input: FragmentInput) -> @location(0) vec4f {
    let N = normalize(input.fragNorm);
    let V = normalize(scene.cameraPos - input.fragPos);

    let materialData = getPBRMaterial(input.uv);
    if (materialData.alpha < 0.01) { discard; }

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
    }

    let texColor   = textureSample(meshTexture, meshSampler, input.uv);
    var finalColor = texColor.rgb * (scene.globalAmbient + lightContribution);

    // Per-instance tint
    finalColor *= input.colorMult.rgb;

    // ── Illuminate rim glow ───────────────────────────────────────────────────
    let illuminate = computeIlluminate(N, V, input.fragPos);
    finalColor += illuminate;

    return vec4f(finalColor, materialData.alpha);
}
`;