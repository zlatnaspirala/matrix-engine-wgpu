export const flameEffectInstance = `
struct Camera {
    viewProj : mat4x4<f32>
};
@group(0) @binding(0) var<uniform> camera : Camera;

// Exact same layout as the working shader, but in a storage array
struct ModelData {
    model     : mat4x4<f32>,
    timeSpeed : vec4<f32>,
    params    : vec4<f32>,
    tint      : vec4<f32>,
};
@group(0) @binding(1) var<storage, read> modelDataArray : array<ModelData>;

struct VSIn {
    @location(0) position : vec3<f32>,
    @location(1) uv : vec2<f32>,
    @builtin(instance_index) instanceIdx : u32,
};

struct VSOut {
    @builtin(position) position : vec4<f32>,
    @location(0) uv : vec2<f32>,
    @location(1) p0 : vec4<f32>,
    @location(2) p1 : vec4<f32>,
    @location(3) tintColor : vec3<f32>,
};

@vertex
fn vsMain(input : VSIn) -> VSOut {
    var output : VSOut;
    let modelData = modelDataArray[input.instanceIdx];

    let worldPos = modelData.model * vec4<f32>(input.position, 1.0);
    output.position = camera.viewProj * worldPos;
    output.uv = input.uv;

    // Pass data to fragment exactly like the working shader
    output.p0 = vec4<f32>(
        modelData.timeSpeed.x, // time
        modelData.timeSpeed.y, // speed
        modelData.params.x,    // intensity
        modelData.params.y     // turbulence
    );
    output.p1 = vec4<f32>(
        modelData.params.z,    // stretch
        modelData.tint.w,      // tintStrength
        0.0, 0.0
    );
    output.tintColor = modelData.tint.xyz;

    return output;
}

fn hash2(n : vec2<f32>) -> f32 {
    return fract(sin(dot(n, vec2<f32>(12.9898, 78.233))) * 43758.5453);
}

fn noise(p : vec2<f32>) -> f32 {
    let i = floor(p); let f = fract(p);
    let u = f * f * (3.0 - 2.0 * f);
    return mix(
        mix(hash2(i + vec2<f32>(0.0, 0.0)), hash2(i + vec2<f32>(1.0, 0.0)), u.x),
        mix(hash2(i + vec2<f32>(0.0, 1.0)), hash2(i + vec2<f32>(1.0, 1.0)), u.x),
        u.y
    );
}

fn fbm(p : vec2<f32>) -> f32 {
    var v = 0.0; var a = 0.5; var pos = p;
    for (var i = 0; i < 2; i = i + 1) {
        v += a * noise(pos);
        pos = pos * 2.1 + vec2<f32>(1.7, 9.2);
        a *= 0.5;
    }
    return v;
}

@fragment
fn fsMain(input : VSOut) -> @location(0) vec4<f32> {
    let time       = input.p0.x;
    let speed      = input.p0.y;
    let intensity  = input.p0.z;
    let turbulence = input.p0.w;
    let stretch    = input.p1.x;
    let tintStr    = input.p1.y;
    let tintColor  = input.tintColor;

    let t = time * speed * 2.0;
    var uv = input.uv;
    uv.y = uv.y / max(stretch, 0.01);

    let warpAmt = turbulence * 0.18;
    let warpX   = noise(uv * 3.0 + vec2<f32>(0.0, t * 0.6)) - 0.5;
    let warpY   = noise(uv * 3.0 + vec2<f32>(5.2, t * 0.4)) - 0.5;
    var warpedUV = uv + vec2<f32>(warpX, warpY) * warpAmt;

    warpedUV.y += t * 0.4;
    warpedUV.x += sin(t * 0.7) * 0.08 * turbulence;

    var n = fbm(warpedUV * 6.0 + vec2<f32>(0.0, t * 0.8));
    n = pow(n, 3.0 - turbulence * 1.2);

    let hotColor  = vec3<f32>(1.0, 0.92, 0.35);
    let midColor  = vec3<f32>(1.0, 0.38, 0.04);
    let coolColor = vec3<f32>(0.55, 0.04, 0.0 );

    let g1 = smoothstep(0.0, 0.5, n);
    let g2 = smoothstep(0.5, 1.0, n);
    var baseColor = mix(mix(coolColor, midColor, g1), hotColor, g2);

    let tintMask = smoothstep(0.0, 0.5, n);
    baseColor = mix(baseColor, baseColor * tintColor * 2.0, tintStr * tintMask);

    let finalColor = baseColor * n * intensity;
    let edgeMask = smoothstep(0.0, 0.15, input.uv.x) * smoothstep(0.0, 0.15, 1.0 - input.uv.x);
    let fadeStart = clamp(0.25 / max(stretch, 0.1), 0.1, 0.6);
    let topFade = 1.0 - smoothstep(fadeStart, 1.0, input.uv.y);

    // let alpha = smoothstep(0.25, 0.9, n) * edgeMask * topFade;
    let alpha = smoothstep(0.01, 0.4, n) * edgeMask * topFade;

    return vec4<f32>(finalColor * alpha, alpha);
}
`;