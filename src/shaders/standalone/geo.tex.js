export let geoInstancedTexEffect = () => `
override shadowDepthTextureSize: f32;

struct MaterialPBR {
    baseColorFactor : vec4f,
    metallicFactor  : f32,
    roughnessFactor : f32,
    effectMix       : f32,
    lightingEnabled : f32,
    ambientColor    : vec3f,  
    _pad            : f32,    
};

struct InstanceData {
    model : mat4x4f,
    color : vec4f,
};

// === CHANGED TO DIRECT 64-BYTE MATRIX TO MATCH YOUR FRAMEWORK BUFFER ===
@group(0) @binding(0) var<uniform> cameraViewProjMatrix : mat4x4f;
@group(0) @binding(1) var<storage, read> instances : array<InstanceData>;
@group(0) @binding(2) var mySampler : sampler;
@group(0) @binding(3) var myTexture : texture_2d<f32>;

struct VertexInput {
    @location(0) position : vec3f,
    @location(1) uv       : vec2f,
};

struct VertexOutput {
    @builtin(position) position : vec4f,
    @location(1) fragPos        : vec3f,
    @location(2) fragNorm       : vec3f,
    @location(3) uv             : vec2f,
    @location(4) instanceColor  : vec4f,
};

@vertex
fn vsMain(input : VertexInput, @builtin(instance_index) instanceIndex : u32) -> VertexOutput {
    var out : VertexOutput;
    let inst = instances[instanceIndex];

    let worldPos = inst.model * vec4f(input.position, 1.0);
    out.fragPos = worldPos.xyz;
    
    // Multiplied by raw camera matrix uniform directly
    out.position = cameraViewProjMatrix * worldPos; 
    
    // Auto-calculate surface normal directions
    out.fragNorm = normalize(input.position);
    
    out.uv = input.uv;
    out.instanceColor = inst.color;
    return out;
}

struct FragOut {
    @location(0) color    : vec4f,
    @location(1) normal   : vec4f,
    @location(2) worldPos : vec4f,
}

@fragment
fn fsMain(input : VertexOutput) -> FragOut {
    let N = normalize(input.fragNorm);

    let adjustedUV = input.uv; 
    let texColor = textureSample(myTexture, mySampler, adjustedUV);

    let centeredUV = input.uv * 2.0 - vec2f(1.0, 1.0);
    let dist = length(centeredUV);
    let glow = exp(-dist * 1.2);
    let glowColor = mix(vec3f(0.2, 0.7, 1.0), vec3f(0.8, 0.95, 1.0), glow);

    let baseRGB = texColor.rgb * glowColor;
    let tintedRGB = mix(baseRGB, input.instanceColor.rgb, 0.8);
    let finalAlpha = texColor.a * input.instanceColor.a * glow;

    return FragOut(
        vec4f(tintedRGB, finalAlpha), 
        vec4f(N, 0.0),                
        vec4f(input.fragPos, 1.0)     
    );
}
`;