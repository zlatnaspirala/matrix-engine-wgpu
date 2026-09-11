export const MSDFFRAG = `
struct Camera {
  viewProj: mat4x4f,
};

struct Glyph {
  position: vec2f,
  size: vec2f,
  uvOffset: vec2f,
  uvScale: vec2f,
};

struct TextColor {
  color: vec4f,
};

@group(0) @binding(0) var<uniform> camera: Camera;
@group(0) @binding(1) var<storage, read> glyphs: array<Glyph>;
@group(0) @binding(2) var msdfTexture: texture_2d<f32>;
@group(0) @binding(3) var msdfSampler: sampler;
@group(0) @binding(4) var<uniform> parent: mat4x4f;
@group(0) @binding(5) var<uniform> textColor: TextColor;

struct VertexInput {
  @location(0)
  position: vec2f,
  @location(1)
  uv: vec2f,
  @builtin(instance_index)
  instanceIdx: u32,
};

struct VertexOutput {
  @builtin(position)
  clipPos: vec4f,
  @location(0)
  uv: vec2f,
  @location(1)
  worldPos: vec3f,
};

@vertex
fn vsMain(input: VertexInput) -> VertexOutput {
  let glyph = glyphs[input.instanceIdx];
  let localPos = glyph.position + vec2f(input.position.x, -input.position.y) * glyph.size;
  let worldPos = (parent * vec4f(localPos.x, localPos.y, 0.0, 1.0)).xyz;
  let clipPos = camera.viewProj * vec4f(worldPos, 1.0);
  // ATLAS UV
  let atlasUv = glyph.uvOffset + input.uv * glyph.uvScale;
  var output: VertexOutput;
  output.clipPos = clipPos;
  output.uv = atlasUv;
  output.worldPos = worldPos;
  return output;
}

struct FragmentOutput {
  @location(0)
  color: vec4f,
  @location(1)
  normal: vec4f,
  @location(2)
  position: vec4f,
};

fn median(r: f32, g: f32, b: f32) -> f32 {
  return max(min(r, g), min( max(r, g), b));
}

fn sampleMSDF(uv: vec2f) -> f32 {
  let sample = textureSample(msdfTexture, msdfSampler, uv);
  let sd = median(
          sample.r,
          sample.g,
          sample.b
      );
  return sd - 0.5;
}

@fragment
fn fsMain(input: VertexOutput) -> FragmentOutput {
  // MSDF
  let signedDistance = sampleMSDF(input.uv);
  let screenPxRange = max(fwidth(signedDistance), 0.00001);
  let alpha = clamp(signedDistance / screenPxRange + 0.5, 0.0, 1.0);
  if (alpha < 0.01) { discard;}
  let finalColor = vec4f(textColor.color.rgb, textColor.color.a * alpha);
  // FLAT TEXT NORMAL
  let surfaceNormal = vec3f(0.0, 0.0, 1.0);
  var output: FragmentOutput;
  output.color = finalColor;
  output.normal = vec4f(surfaceNormal, 0.0);
  output.position = vec4f(input.worldPos, 1.0);
  return output;
}
`;