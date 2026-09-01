export const MSDFFRAG = `
// ============================================================================
// MSDF Text Rendering Shader
// Multi-channel Signed Distance Field with 3 render targets
// ============================================================================

struct Camera {
  view: mat4x4f,
  projection: mat4x4f,
  viewProj: mat4x4f,
};

struct Glyph {
  position: vec2f,      // world/screen position
  scale: vec2f,         // glyph width/height scale
  uvOffset: vec2f,      // atlas UV base
  uvScale: vec2f,       // atlas UV dimensions
  color: vec4f,         // RGBA color
};

@group(0) @binding(0) var<uniform> camera: Camera;
@group(0) @binding(1) var<storage> glyphs: array<Glyph>;
@group(0) @binding(2) var msdfTexture: texture_2d<f32>;
@group(0) @binding(3) var msdfSampler: sampler;

// ============================================================================
// VERTEX SHADER
// ============================================================================

struct VertexInput {
  @location(0) position: vec2f,
  @location(1) uv: vec2f,
  @builtin(instance_index) instanceIdx: u32,
};

struct VertexOutput {
  @builtin(position) clipPos: vec4f,
  @location(0) uv: vec2f,
  @location(1) worldPos: vec3f,
  @location(2) color: vec4f,
};

@vertex
fn vsMain(input: VertexInput) -> VertexOutput {
  let glyph = glyphs[input.instanceIdx];
  
  // Transform quad vertex by glyph position and scale
  let scaledPos = input.position * glyph.scale;
  let worldPos = vec3f(glyph.position + scaledPos, 0.0);
  
  // Project to clip space
  let clipPos = camera.viewProj * vec4f(worldPos, 1.0);
  
  // Apply glyph's atlas UV region
  let atlasUv = glyph.uvOffset + input.uv * glyph.uvScale;
  
  var output: VertexOutput;
  output.clipPos = clipPos;
  output.uv = atlasUv;
  output.worldPos = worldPos;
  output.color = glyph.color;
  
  return output;
}

// ============================================================================
// FRAGMENT SHADER
// ============================================================================

struct FragmentOutput {
  @location(0) color: vec4f,
  @location(1) normal: vec4f,
  @location(2) position: vec4f,
};

fn FragOut(
  color: vec4f,
  normal: vec4f,
  position: vec4f
) -> FragmentOutput {
  var output: FragmentOutput;
  output.color = color;
  output.normal = normal;
  output.position = position;
  return output;
}

// Sample MSDF and return signed distance
fn sampleMSDF(uv: vec2f) -> f32 {
  let sample = textureSample(msdfTexture, msdfSampler, uv);
  
  // MSDF stores distance in RGB, take median for better results
  // Red, Green, Blue channels are evaluated separately, then median is taken
  let r = sample.r;
  let g = sample.g;
  let b = sample.b;
  
  // Median of 3 values
  let median = max(min(r, g), min(max(r, g), b));
  
  // Convert from [0, 1] to signed distance [-1, 1]
  // 0.5 is the edge (MSDF convention)
  return (median - 0.5) * 2.0;
}

// Compute anti-aliased alpha
fn msdfAlpha(signedDist: f32, pxSize: f32) -> f32 {
  // Smoothstep anti-aliasing: smooth transition across the edge
  return smoothstep(-pxSize, pxSize, signedDist);
}

@fragment
fn fsMain(input: VertexOutput) -> FragmentOutput {
  // Sample MSDF at this UV coordinate
  let signedDist = sampleMSDF(input.uv);
  
  // Pixel size for AA (adjust based on atlas resolution; 1024 is common)
  let pxSize = 0.001; // Tweak this value for edge softness
  
  // Compute anti-aliased alpha
  let alpha = msdfAlpha(signedDist, pxSize);
  
  // Early discard for efficiency
  if (alpha < 0.01) {
    discard;
  }
  
  // Apply glyph color with computed alpha
  let finalColor = input.color.rgb * alpha * input.color.a;
  
  // Surface normal (Z-facing for billboard text)
  let surfaceNormal = vec3f(0.0, 0.0, 1.0);
  
  // Pack output for 3 render targets
  return FragOut(
    vec4f(finalColor, alpha),
    vec4f(surfaceNormal, 0.0),
    vec4f(input.worldPos, 1.0)
  );
}

`;