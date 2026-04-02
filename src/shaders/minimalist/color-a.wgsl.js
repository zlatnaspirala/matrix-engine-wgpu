export let coloraWGSL = `
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
    effectMix       : f32,
    lightingEnabled : f32,
    ambientColor    : vec3f,  // add this
    _pad            : f32,    // alignment padding
};

@group(0) @binding(0) var<uniform> scene : Scene;
@group(0) @binding(8) var<uniform> material: MaterialPBR;

struct FragmentInput {
    @location(1) fragPos   : vec3f,
    @location(2) fragNorm  : vec3f,
    @location(3) uv        : vec2f,
};

@fragment
fn main(input: FragmentInput) -> @location(0) vec4f {

    let N = normalize(input.fragNorm);
    let V = normalize(scene.cameraPos - input.fragPos);
    let L = normalize(scene.lightPos - input.fragPos);

    // ===== BASE COLOR =====
    var baseColor = material.baseColorFactor.rgb;

    // ===== HEIGHT GRADIENT =====
    let heightFactor = input.fragPos.y * 0.02;
    let gradientColor = mix(
        baseColor * 0.5,
        baseColor * 1.5,
        clamp(heightFactor, 0.0, 1.0)
    );

    // ===== FAKE LIGHT =====
    let NdotL = dot(N, L);
    let diffuse = NdotL * 0.5 + 0.5;

    // ===== FRESNEL EDGE GLOW 🔥 =====
    let fresnel = pow(1.0 - max(dot(N, V), 0.0), 3.0);

    // ===== PULSE (time based) =====
    let pulse = 0.5 + 0.5 * sin(scene.time * 2.0);

    // ===== COLOR COMBINE =====
    var color = gradientColor;

    color *= (scene.globalAmbient + diffuse * 0.8);

    // edge glow tint (stylized)
    let glowColor = vec3f(0.2, 0.6, 1.0);
    color += glowColor * fresnel * (0.5 + pulse * 0.5);

    // ===== OPTIONAL: subtle spec =====
    let H = normalize(L + V);
    let spec = pow(max(dot(N, H), 0.0), 16.0);
    color += spec * 0.2;

    let alpha = material.baseColorFactor.a;

    return vec4f(color, alpha);
}
`;