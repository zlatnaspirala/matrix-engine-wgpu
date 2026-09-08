export const MSDFFRAG = `

struct Camera {
  viewProj: mat4x4f,
};

struct Glyph {
  transform: mat4x4f,
  uvOffset: vec2f,
  uvScale: vec2f,
};

@group(0) @binding(0) var<uniform> camera: Camera;
@group(0) @binding(1) var<storage> glyphs: array<Glyph>;
@group(0) @binding(2) var msdfTexture: texture_2d<f32>;
@group(0) @binding(3) var msdfSampler: sampler;

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
  
  // Use the precomputed transform matrix
  let worldPos = (glyph.transform * vec4f(input.position, 0.0, 1.0)).xyz;
  let clipPos = camera.viewProj * vec4f(worldPos, 1.0);
  let atlasUv = glyph.uvOffset + input.uv * glyph.uvScale;
  
  var output: VertexOutput;
  output.clipPos = clipPos;
  output.uv = atlasUv;
  output.worldPos = worldPos;
  output.color = vec4f(1.0);
  
  return output;
}

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

fn sampleMSDF(uv: vec2f) -> f32 {
  let sample = textureSample(msdfTexture, msdfSampler, uv);
  let r = sample.r;
  let g = sample.g;
  let b = sample.b;
  let median = max(min(r, g), min(max(r, g), b));
  return (median - 0.5) * 2.0;
}

fn msdfAlpha(signedDist: f32, pxSize: f32) -> f32 {
  return smoothstep(-pxSize, pxSize, signedDist);
}

@fragment
fn fsMain(input: VertexOutput) -> FragmentOutput {

  let sample = textureSample(msdfTexture, msdfSampler, input.uv);
  
  // // Just output the raw sample
  // let debugColor = vec4f(sample.rgb, 1.0);
  
  // return FragOut(
  //   debugColor,
  //   vec4f(0.0, 0.0, 1.0, 0.0),
  //   vec4f(input.worldPos, 1.0)
  // );


  let signedDist = sampleMSDF(input.uv);
  let pxSize = 0.001;
  let alpha = msdfAlpha(signedDist, pxSize);
  
  if (alpha < 0.01) {
    discard;
  }
  
  let finalColor = input.color.rgb * alpha * input.color.a;
  let surfaceNormal = vec3f(0.0, 0.0, 1.0);
  
  return FragOut(
    vec4f(finalColor, alpha),
    vec4f(surfaceNormal, 0.0),
    vec4f(input.worldPos, 1.0)
  );
}
`;