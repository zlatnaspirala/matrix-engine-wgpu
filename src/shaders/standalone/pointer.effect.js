export let pointerEffect = () => `
struct Model {
    modelMatrix : mat4x4f,
};

// Changed from "scene : Scene" to a direct 64-byte mat4x4f!
@group(0) @binding(0) var<uniform> cameraViewProjMatrix : mat4x4f;
@group(0) @binding(1) var<uniform> model : Model;

struct VertexInput {
    @location(0) position : vec3f,
    @location(1) uv       : vec2f,
};

struct VertexOutput {
    @builtin(position) position : vec4f,
    @location(1) fragPos        : vec3f,
    @location(2) fragNorm       : vec3f,
    @location(3) uv             : vec2f,
};

@vertex
fn vsMain(input : VertexInput) -> VertexOutput {
    var out : VertexOutput;
    
    let worldPos = model.modelMatrix * vec4f(input.position, 1.0);
    out.fragPos = worldPos.xyz;
    out.position = cameraViewProjMatrix * worldPos; // Uses direct matrix bind
    
    out.fragNorm = vec3f(0.0, 1.0, 0.0); 
    out.uv = input.uv;
    
    return out;
}

struct FragOut {
    @location(0) color    : vec4f,
    @location(1) normal   : vec4f,
    @location(2) worldPos : vec4f,
}

@fragment
fn fsMain(input: VertexOutput) -> FragOut {
    let N = normalize(input.fragNorm);

    let centeredUV = input.uv * 2.0 - vec2f(1.0, 1.0);
    let dist = length(centeredUV);
    let glow = exp(-dist * 1.0);

    let baseColor = vec3f(0.2, 0.7, 1.0);
    let glowColor = vec3f(0.7, 0.9, 1.0);
    let finalColor = mix(baseColor, glowColor, glow) * glow;

    return FragOut(
        vec4f(finalColor, 1.0),
        vec4f(N, 0.0),
        vec4f(input.fragPos, 1.0)
    );
}
`;