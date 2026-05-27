export const hpBarEffectShaders = `
struct Model {
    model    : mat4x4f,       // 64 bytes (Offsets 0 - 63)
    color    : vec4f,         // 16 bytes (Offsets 64 - 79)
    progress : f32,           // 4 bytes  (Offsets 80 - 83)
    pad1     : f32,           // 4 bytes  (Offsets 84 - 87)
    pad2     : f32,           // 4 bytes  (Offsets 88 - 91)
    pad3     : f32,           // 4 bytes  (Offsets 92 - 95) -> Total: Exactly 96 bytes!
};

@group(0) @binding(0) var<uniform> cameraViewProjMatrix : mat4x4f;
@group(0) @binding(1) var<uniform> model : Model;

struct VertexOutput {
    @builtin(position) position : vec4f,
    @location(0) uv             : vec2f,
    @location(1) fragPos        : vec3f,
};

@vertex
fn vsMain(
    @location(0) position : vec3f,
    @location(1) uv       : vec2f
) -> VertexOutput {
    var output : VertexOutput;
    let worldPos = model.model * vec4f(position, 1.0);
    
    output.position = cameraViewProjMatrix * worldPos;
    output.uv = uv;
    output.fragPos = worldPos.xyz;
    
    return output;
}

struct FragOut {
    @location(0) color    : vec4f,
    @location(1) normal   : vec4f,
    @location(2) worldPos : vec4f,
}

@fragment
fn fsMain(in : VertexOutput) -> FragOut {
    let N = vec3f(0.0, 0.0, 1.0); 
    var finalColor : vec4f;

    if (in.uv.x > model.progress) {
        finalColor = vec4f(0.1, 0.1, 0.1, 0.3); 
    } else {
        finalColor = model.color; 
    }

    return FragOut(
        finalColor,
        vec4f(N, 0.0),
        vec4f(in.fragPos, 1.0)
    );
}
`;