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

export const SSR_PASS_WGSL = /* wgsl */`
 
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

@group(0) @binding(0) var<uniform> scene         : Scene;
@group(0) @binding(1) var<uniform> ssrCfg        : SSRConfig;
@group(0) @binding(2) var sceneColor            : texture_2d<f32>;
@group(0) @binding(3) var normalTex             : texture_2d<f32>;
@group(0) @binding(4) var hzbTex : texture_2d<f32>;
@group(0) @binding(5) var pointSampler          : sampler;
@group(0) @binding(6) var worldPosTex           : texture_2d<f32>;

fn edgeFade(uv: vec2f) -> f32 {
    let e = min(min(uv.x, 1.0 - uv.x), min(uv.y, 1.0 - uv.y));
    return smoothstep(0.0, 0.1, e);
}

struct VertOut {
  @builtin(position) pos : vec4f,
  @location(0) uv        : vec2f,
}

// @vertex
// fn vs(@builtin(vertex_index) vi: u32) -> VertOut {
//   var pos = array<vec2f, 3>(
//       vec2(-1.0, -1.0),
//       vec2( 3.0, -1.0),
//       vec2(-1.0,  3.0),
//   );
//   let p = pos[vi];
//   // return VertOut(vec4(p, 0.0, 1.0), p * vec2(0.5, -0.5) + 0.5);
//   return VertOut(vec4(p, 0.0, 1.0), p * 0.5 + 0.5);
// }


@vertex
fn vs(@builtin(vertex_index) vi: u32) -> VertOut {
    var pos = array<vec2f, 3>(
        vec2(-1.0,  1.0),
        vec2( 3.0,  1.0),
        vec2(-1.0, -3.0),
    );
    let p = pos[vi];
    let uv = vec2f(p.x * 0.5 + 0.5, -p.y * 0.5 + 0.5);
    return VertOut(vec4(p, 0.0, 1.0), uv);
}

fn worldPosFromDepth(uv: vec2f, depth: f32) -> vec3f {
    // Convert UV and Depth back to NDC space
    // WebGPU NDC: X is [-1, 1], Y is [-1, 1] (top is positive), Z is [0, 1]
    let ndc = vec4f(
        uv.x * 2.0 - 1.0,
        (1.0 - uv.y) * 2.0 - 1.0, // Reversing UV Y to match NDC Y
        depth,
        1.0
    );

    // Unproject using your configuration matrices
    // Note: If you have a direct Inverse View-Projection Matrix, use that instead.
    // Otherwise, we unproject from NDC to View Space, then View to World.
    let viewPos = ssrCfg.invProj * ndc;
    let viewPosSpace = viewPos / viewPos.w;
    
    // Convert from View Space to World Space
    // (Assuming scene.cameraViewProjMatrix inverse isn't fully available, 
    // we approximate or use your inverse view projection if you choose to pass it.
    // If you already have worldPosTex for G-Buffer, we can use this logic to find the ray intersections!)
    return viewPosSpace.xyz; 
}

@fragment
fn fs(in: VertOut) -> @location(0) vec4f {
    let tc = min(vec2u(in.uv * ssrCfg.resolution), vec2u(ssrCfg.resolution) - 1u);

    let worldPos4 = textureLoad(worldPosTex, tc, 0);
    if (worldPos4.w < 0.5) { return vec4f(0.0); }
    let worldPos = worldPos4.xyz;

    let rawNormal = textureLoad(normalTex, tc, 0).xyz;
    if (length(rawNormal) < 0.1) { return vec4f(0.0); }
    let normal = normalize(rawNormal);

    let viewDir = normalize(worldPos - scene.cameraPos);
    let reflDir = reflect(viewDir, normal);

    // Transform vectors into View Space to make linear depth matching bulletproof
    // This removes world-space scale dependencies
    let viewMatrix = scene.cameraViewProjMatrix; 
    
    var rayPos     = worldPos + normal * 0.05; // Small, safe bias
    var prevRayPos = rayPos;
    var stepSize   = 0.04; 
    var hit        = false;
    var hitUV      = vec2f(0.0);
    var minSteps   = 2u; 

    for (var i = 0u; i < 80u; i++) {
        prevRayPos = rayPos;
        rayPos    += reflDir * stepSize;

        let clip = scene.cameraViewProjMatrix * vec4f(rayPos, 1.0);
        if (clip.w <= 0.0) { break; }
        let ndc = clip.xyz / clip.w;
        
        // Convert to WebGPU standard UV
        let uv  = vec2f(ndc.x * 0.5 + 0.5, 1.0 - (ndc.y * 0.5 + 0.5));
        if (any(uv < vec2f(0.0)) || any(uv > vec2f(1.0))) { break; }

        if (i < minSteps) { continue; }

        // Get the real world position of whatever geometry is visible at this UV coordinate
        let sampleTC = vec2u(uv * ssrCfg.resolution);
        let sceneWorld4 = textureLoad(worldPosTex, sampleTC, 0);
        if (sceneWorld4.w < 0.5) { continue; }

        // Calculate linear depth relative to the camera plane (Z-depth)
        // This is much more stable than pure 3D distance() calculations
        let rayLinearDepth   = (scene.cameraViewProjMatrix * vec4f(rayPos, 1.0)).w;
        let sceneLinearDepth = (scene.cameraViewProjMatrix * vec4f(sceneWorld4.xyz, 1.0)).w;
        
        let depthDiff = rayLinearDepth - sceneLinearDepth;

        // If the ray has traveled behind the scene geometry, but is within the thickness threshold
        if (depthDiff > 0.0 && depthDiff < ssrCfg.thickness) {
            // Check if we are accidentally hitting the object we cast from
            let distFromOrigin = distance(worldPos, sceneWorld4.xyz);
            if (distFromOrigin < 0.2) { continue; } // Skip self-intersections completely

            hit   = true;
            hitUV = uv;
            break;
        }

        // Gradually increase step size to cover distance, but not too aggressively
        stepSize *= 1.015;
    }

    if (!hit) { return vec4f(0.0); }

    let color      = textureLoad(sceneColor, vec2u(hitUV * ssrCfg.resolution), 0).rgb;
    let confidence = edgeFade(hitUV);
    return vec4f(color, confidence * 0.8);
}

@fragment
fn fsOLD(in: VertOut) -> @location(0) vec4f {
    let tc = min(vec2u(in.uv * ssrCfg.resolution), vec2u(ssrCfg.resolution) - 1u);

    let worldPos4 = textureLoad(worldPosTex, tc, 0);
    if (worldPos4.w < 0.5) { return vec4f(0.0); }
    let worldPos = worldPos4.xyz;

    let rawNormal = textureLoad(normalTex, tc, 0).xyz;
    if (length(rawNormal) < 0.1) { return vec4f(0.0); }
    let normal = normalize(rawNormal);

    
    // let upDot = dot(normal, vec3f(0.0, 1.0, 0.0));
    // if (upDot < 0.7) { return vec4f(0.0); }

    let viewDir = normalize(worldPos - scene.cameraPos);
    let reflDir = reflect(viewDir, normal);

var rayPos     = worldPos + normal * 0.5;  // was 0.01 — much larger bias
var prevRayPos = rayPos;
var stepSize   = 0.05;  // was 0.02
var hit        = false;
var hitUV      = vec2f(0.0);
var minSteps   = 3u;  // skip first 3 steps to avoid self-intersection

for (var i = 0u; i < 128u; i++) {
    prevRayPos = rayPos;
    rayPos    += reflDir * stepSize;

    let clip = scene.cameraViewProjMatrix * vec4f(rayPos, 1.0);
    if (clip.w <= 0.0) { break; }
    let ndc = clip.xyz / clip.w;
    let uv  = vec2f(ndc.x * 0.5 + 0.5, ndc.y * 0.5 + 0.5);
    if (any(uv < vec2f(0.01)) || any(uv > vec2f(0.99))) { break; }

    if (i < minSteps) { stepSize *= 1.02; continue; }  // skip early steps

    let sceneDepth = textureLoad(hzbTex, vec2i(uv * ssrCfg.resolution), 0).r;
    let depthDiff  = ndc.z - sceneDepth;

    if (depthDiff > 0.0) {
            var refinePos  = prevRayPos;
            var refineStep = stepSize * 0.5;
            var rUV        = vec2f(0.0);

            for (var j = 0u; j < 16u; j++) {
                refinePos     += reflDir * refineStep;
                let rClip      = scene.cameraViewProjMatrix * vec4f(refinePos, 1.0);
                let rNDC       = rClip.xyz / rClip.w;
                rUV            = vec2f(rNDC.x * 0.5 + 0.5, rNDC.y * 0.5 + 0.5);
                let rDepth     = textureLoad(hzbTex, vec2i(rUV * ssrCfg.resolution), 0).r;
                let rDiff      = rNDC.z - rDepth;
                if (rDiff > 0.0) { refinePos -= reflDir * refineStep; }
                refineStep    *= 0.5;
            }

            let fClip  = scene.cameraViewProjMatrix * vec4f(refinePos, 1.0);
            let fNDC   = fClip.xyz / fClip.w;
            let fUV    = vec2f(fNDC.x * 0.5 + 0.5, fNDC.y * 0.5 + 0.5);
            let fDepth = textureLoad(hzbTex, vec2i(fUV * ssrCfg.resolution), 0).r;

            if (abs(fNDC.z - fDepth) < 0.02) {
                hit   = true;
                hitUV = fUV;
            }
            break;
        }

        stepSize *= 1.02;
    }

    if (!hit) { return vec4f(0.0); }

    let color      = textureLoad(sceneColor, vec2u(hitUV * ssrCfg.resolution), 0).rgb;
    let confidence = edgeFade(hitUV);
    return vec4f(color, confidence * 0.8);
}

`;