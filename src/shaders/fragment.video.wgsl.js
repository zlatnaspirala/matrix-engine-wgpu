export let fragmentVideoWGSL = () => `override shadowDepthTextureSize: f32 = 1.0;

struct Scene {
  lightViewProjMatrix : mat4x4f,
  cameraViewProjMatrix : mat4x4f,
  lightPos : vec3f,
}

@group(0) @binding(0) var<uniform> scene : Scene;
@group(1) @binding(0) var meshTexture: texture_external;
@group(1) @binding(1) var meshSampler: sampler;
@group(1) @binding(2) var<uniform> postFXMode: u32;

struct FragmentInput {
  @location(0) shadowPos : vec4f,
  @location(1) fragPos : vec3f,
  @location(2) fragNorm : vec3f,
  @location(3) uv : vec2f,
}

const albedo = vec3f(0.9);
const ambientFactor = 1.2;

@fragment
fn main(input : FragmentInput) -> @location(0) vec4f {
  let lambertFactor = max(dot(normalize(scene.lightPos - input.fragPos), normalize(input.fragNorm)), 0.0);
  let lightingFactor = min(ambientFactor * lambertFactor, 1.0);
  let textureColor = textureSampleBaseClampToEdge(meshTexture, meshSampler, input.uv);
  let color: vec4f = vec4(textureColor.rgb * ambientFactor , textureColor.a);
  // let color: vec4f = vec4(textureColor.rgb * lightingFactor * albedo, textureColor.a);
   switch (postFXMode) {
    case 0: {
      return color;
    }
    case 1: {
      // Invert
      return vec4f(1.0 - color.rgb, color.a);
    }
    case 2: {
      // Grayscale
      let gray = dot(color.rgb, vec3f(0.299, 0.587, 0.114));
      return vec4f(vec3f(gray), color.a);
    }
    case 3: {
      // Chroma Key
      let keyColor = vec3f(0.0, 1.0, 0.0);
      let threshold = 0.3;
      let diff = distance(color.rgb, keyColor);
      if (diff < threshold) {
        return vec4f(0.0, 0.0, 0.0, 0.0);
      }
      return color;
    }
    default: {
      return color;
    }
  }
}
`;