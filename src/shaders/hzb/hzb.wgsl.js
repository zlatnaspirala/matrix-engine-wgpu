//  hzb_build.wgsl
//  Compute shader — builds Hi-Z mip pyramid from linear depth
export const HZB_BUILD_WGSL = /* wgsl */`
struct Uniforms {
    dstSize : vec2<u32>,
}
 
@group(0) @binding(0) var<uniform> u   : Uniforms;
@group(0) @binding(1) var srcTex       : texture_2d<f32>;
@group(0) @binding(2) var dstTex       : texture_storage_2d<r32float, write>;
 
@compute @workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) gid: vec3<u32>) {
    if (gid.x >= u.dstSize.x || gid.y >= u.dstSize.y) { return; }
 
    let s  = vec2<u32>(gid.x * 2u, gid.y * 2u);
    let d0 = textureLoad(srcTex, s + vec2(0u, 0u), 0).r;
    let d1 = textureLoad(srcTex, s + vec2(1u, 0u), 0).r;
    let d2 = textureLoad(srcTex, s + vec2(0u, 1u), 0).r;
    let d3 = textureLoad(srcTex, s + vec2(1u, 1u), 0).r;
 
    textureStore(dstTex, vec2<i32>(gid.xy), vec4(max(max(d0, d1), max(d2, d3))));
}
`;
 
//  Copies depth attachment → r32float linear depth texture
//  One full-screen triangle dispatch before HZB build
export const DEPTH_BLIT_WGSL = /* wgsl */`
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
 
// @group(0) @binding(0) var<uniform> scene : Scene;
@group(0) @binding(0) var depthTex       : texture_depth_2d;
@group(0) @binding(1) var texSampler     : sampler;
 
struct VertOut {
    @builtin(position) pos : vec4f,
    @location(0) uv        : vec2f,
}
 
@vertex
fn vs(@builtin(vertex_index) vi: u32) -> VertOut {
    // Fullscreen triangle
    var pos = array<vec2f, 3>(
        vec2(-1.0, -1.0),
        vec2( 3.0, -1.0),
        vec2(-1.0,  3.0),
    );
    let p = pos[vi];
    return VertOut(vec4(p, 0.0, 1.0), p * 0.5 + 0.5);
}
 
@fragment
fn fs(in: VertOut) -> @location(0) vec4f {
    // Sample raw depth and store as r32float linear
    let d = textureSample(depthTex, texSampler, in.uv);
    return vec4f(d, 0.0, 0.0, 1.0);
}
`;

//  ssr_pass.wgsl
//  Full Hi-Z SSR pass 
export const SSR_PASS_WGSL = /* wgsl */`
// Exact Scene struct — copy from fragmentWGSL
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
 
struct SSRConfig {
    invProj     : mat4x4f,
    proj        : mat4x4f,
    resolution  : vec2f,
    maxMip      : f32,
    thickness   : f32,
}
 
@group(0) @binding(0) var<uniform> scene    : Scene;   // your existing globalSceneUniformBuffer
@group(0) @binding(1) var<uniform> ssrCfg   : SSRConfig;
@group(0) @binding(2) var sceneColor        : texture_2d<f32>;   // sceneTextureView
@group(0) @binding(3) var normalTex         : texture_2d<f32>;   // normalTextureView (new)
@group(0) @binding(4) var hzbTex            : texture_2d<f32>;   // hzb pyramid
@group(0) @binding(5) var linearSampler     : sampler;
 
// ── helpers ──────────────────────────────────────────────────
 
fn worldToView(worldPos: vec3f) -> vec3f {
    // Extract view matrix from cameraViewProjMatrix
    // We only have VP in your Scene — so we work in clip space instead
    let clip = scene.cameraViewProjMatrix * vec4f(worldPos, 1.0);
    return clip.xyz / clip.w;
}
 
fn projectPoint(worldPos: vec3f) -> vec3f {
    let clip = scene.cameraViewProjMatrix * vec4f(worldPos, 1.0);
    let ndc  = clip.xyz / clip.w;
    return vec3f(ndc.xy * 0.5 + 0.5, ndc.z);
}
 
fn sampleHZB(uv: vec2f, mip: f32) -> f32 {
    // return textureSampleLevel(hzbTex, linearSampler, uv, mip).r;
        let size = vec2f(textureDimensions(hzbTex, 0));
    let mipLevel = i32(mip);
    let mipSize = vec2f(textureDimensions(hzbTex, mipLevel));
    let coord = vec2i(uv * mipSize);
    return textureLoad(hzbTex, coord, mipLevel).r;
}
 
fn edgeFade(uv: vec2f) -> f32 {
    let e = min(
        min(uv.x, 1.0 - uv.x),
        min(uv.y, 1.0 - uv.y)
    );
    return smoothstep(0.0, 0.12, e);
}
 
// ── Hi-Z ray march ───────────────────────────────────────────
 
fn hizMarch(worldPos: vec3f, worldNorm: vec3f) -> vec4f {
    let viewDir    = normalize(worldPos - scene.cameraPos);
    let reflDir    = reflect(viewDir, worldNorm);
 
    // Project start + end into screen space
    let startUVD   = projectPoint(worldPos + worldNorm * 0.05);
    let endUVD     = projectPoint(worldPos + reflDir * 100.0);
    let rayDelta   = endUVD - startUVD;
 
    var mip  = ssrCfg.maxMip;
    var t    = 0.002;
    var hit  = false;
    var hitUV = vec2f(0.0);
 
    for (var i = 0u; i < 48u; i++) {
        if (mip < 0.0 || t > 1.0) { break; }
 
        let p  = startUVD + rayDelta * t;
        let uv = p.xy;
 
        if (any(uv < vec2f(0.01)) || any(uv > vec2f(0.99))) { break; }
 
        let hzbDepth = sampleHZB(uv, mip);
 
        if (p.z > hzbDepth + ssrCfg.thickness) {
            // Intersection at this mip
            if (mip <= 0.0) {
                hit   = true;
                hitUV = uv;
                break;
            }
            mip -= 1.0;  // refine — don't advance t
        } else {
            // Empty — skip forward by one cell at current mip
            let cellSize = pow(2.0, mip) / ssrCfg.resolution;
            let tStep = max(
                abs(cellSize.x / (abs(rayDelta.x) + 1e-5)),
                abs(cellSize.y / (abs(rayDelta.y) + 1e-5))
            ) * 0.5;
            t   += max(tStep, 0.001);
            mip  = min(mip + 2.0, ssrCfg.maxMip);  // jump back coarse aggressively
        }
    }
 
    if (!hit) { return vec4f(0.0); }
 
    let color      = textureSampleLevel(sceneColor, linearSampler, hitUV, 0.0).rgb;
    let confidence = edgeFade(hitUV);
 
    return vec4f(color, confidence);
}
 
// ── vertex — fullscreen triangle ─────────────────────────────
 
struct VertOut {
    @builtin(position) pos : vec4f,
    @location(0) uv        : vec2f,
}
 
@vertex
fn vs(@builtin(vertex_index) vi: u32) -> VertOut {
    var pos = array<vec2f, 3>(
        vec2(-1.0, -1.0),
        vec2( 3.0, -1.0),
        vec2(-1.0,  3.0),
    );
    let p = pos[vi];
    return VertOut(vec4(p, 0.0, 1.0), p * vec2(0.5, -0.5) + 0.5);
}
 
// ── fragment ─────────────────────────────────────────────────
 
@fragment
fn fs(in: VertOut) -> @location(0) vec4f {
    let tc      = vec2u(in.uv * ssrCfg.resolution);
    let normal  = textureLoad(normalTex, tc, 0).xyz;
 
    // Skip sky / no-geometry pixels
    if (length(normal) < 0.1) {
        return vec4f(0.0);
    }
 
    // Reconstruct world position from depth
    let depth    = textureLoad(hzbTex, tc, 0).r;  // mip 0 = full res depth
    let ndc      = vec4f(in.uv * 2.0 - 1.0, depth, 1.0);
    let viewPos  = ssrCfg.invProj * ndc;
    let vp       = viewPos.xyz / viewPos.w;
    // Approximate world pos — good enough for march start point
    // (exact only if you store view matrix separately; VP matrix is what you have)
    let worldPos = scene.cameraPos + normalize(vp) * length(vp);
 
    let result     = hizMarch(worldPos, normalize(normal));
    let confidence = result.a;
 
    // Blend SSR over existing scene color (additive reflection layer)
    // The final present pass composites this onto sceneTexture
    return vec4f(result.rgb * confidence, confidence);
}
`;