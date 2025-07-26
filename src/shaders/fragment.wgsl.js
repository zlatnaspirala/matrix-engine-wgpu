export let fragmentWGSL = `override shadowDepthTextureSize: f32 = 1024.0;

struct Scene {
  lightViewProjMatrix : mat4x4f,
  cameraViewProjMatrix : mat4x4f,
  lightPos : vec3f,
}

@group(0) @binding(0) var<uniform> scene : Scene;
@group(0) @binding(1) var shadowMap: texture_depth_2d;
@group(0) @binding(2) var shadowSampler: sampler_comparison;
@group(0) @binding(3) var meshTexture: texture_2d<f32>;
@group(0) @binding(4) var meshSampler: sampler;

struct FragmentInput {
  @location(0) shadowPos : vec3f,
  @location(1) fragPos : vec3f,
  @location(2) fragNorm : vec3f,
  @location(3) uv : vec2f,
}

const albedo = vec3f(0.9);
const ambientFactor = 0.7;

@fragment
fn main(input : FragmentInput) -> @location(0) vec4f {
  // Percentage-closer filtering. Sample texels in the region
  // to smooth the result.
  var visibility = 0.0;
  let oneOverShadowDepthTextureSize = 1.0 / shadowDepthTextureSize;
  for (var y = -1; y <= 1; y++) {
    for (var x = -1; x <= 1; x++) {
      let offset = vec2f(vec2(x, y)) * oneOverShadowDepthTextureSize;

      visibility += textureSampleCompare(
        shadowMap, shadowSampler,
        input.shadowPos.xy + offset, input.shadowPos.z - 0.007
      );
    }
  }
  visibility /= 9.0;
  let lambertFactor = max(dot(normalize(scene.lightPos - input.fragPos), normalize(input.fragNorm)), 0.0);
  let lightingFactor = min(ambientFactor + visibility * lambertFactor, 1.0);
  let textureColor = textureSample(meshTexture, meshSampler, input.uv);

  return vec4(textureColor.rgb * lightingFactor * albedo, 1.0);
  // return vec4f(input.fragNorm * 0.5 + 0.5, 1)
  // return vec4f(input.uv, 0, 1)
  // return vec4(textureColor.rgb , 0.5);
}`
