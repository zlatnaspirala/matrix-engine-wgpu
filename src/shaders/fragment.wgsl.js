export let fragmentWGSL = `override shadowDepthTextureSize: f32 = 1024.0;

struct Scene {
  lightViewProjMatrix : mat4x4f,
  cameraViewProjMatrix : mat4x4f,
  lightPos : vec3f,
  padding : f32, // Required for alignment
}

struct SpotLight {
    position    : vec3f,
    _pad1       : f32,

    direction   : vec3f,
    _pad2       : f32,

    innerCutoff : f32,
    outerCutoff : f32,
    intensity   : f32,    // new
    _pad3       : f32,    // keep alignment

    color       : vec3f,  // new
    _pad4       : f32,    // keep alignment
}

 

@group(0) @binding(0) var<uniform> scene : Scene;
@group(0) @binding(1) var shadowMap: texture_depth_2d;
@group(0) @binding(2) var shadowSampler: sampler_comparison;
@group(0) @binding(3) var meshTexture: texture_2d<f32>;
@group(0) @binding(4) var meshSampler: sampler;
@group(0) @binding(5) var<uniform> spotlight: SpotLight;

struct FragmentInput {
  @location(0) shadowPos : vec3f,
  @location(1) fragPos : vec3f,
  @location(2) fragNorm : vec3f,
  @location(3) uv : vec2f,
}

const albedo = vec3f(0.9);
const ambientFactor = 0.7;

fn computeSpotLight(light: SpotLight, normal: vec3f, fragPos: vec3f, viewDir: vec3f) -> vec3f {
    let L = normalize(light.position - fragPos);

    // get spotlight cone factor
    let spotFactor = calculateSpotlightFactor(light, fragPos);

    // diffuse
    let diff = max(dot(normal, L), 0.0);

    // specular (Blinn-Phong)
    let halfwayDir = normalize(L + viewDir);
    let spec = pow(max(dot(normal, halfwayDir), 0.0), 32.0);

    // apply color & intensity
    let diffuse  = diff * light.color * light.intensity;
    let specular = spec * light.color * light.intensity;

    return (diffuse + specular) * spotFactor;
}

fn calculateSpotlightFactor(light: SpotLight, fragPos: vec3f) -> f32 {
  let L = normalize(light.position - fragPos);
  let theta = dot(L, normalize(-light.direction));
  let epsilon = light.innerCutoff - light.outerCutoff;
  let intensity = clamp((theta - light.outerCutoff) / epsilon, 0.0, 1.0);
  return intensity;
}

@fragment
fn main(input : FragmentInput) -> @location(0) vec4f {
  // Shadow PFC
  var visibility = 0.0;
  let oneOverSize = 1.0 / shadowDepthTextureSize;
  for (var y = -1; y <= 1; y++) {
    for (var x = -1; x <= 1; x++) {
      let offset = vec2f(vec2(x, y)) * oneOverSize;
      visibility += textureSampleCompare(
        shadowMap, shadowSampler,
        input.shadowPos.xy + offset, input.shadowPos.z - 0.007
      );
    }
  }
  visibility /= 9.0;

  // Lambert
  let norm = normalize(input.fragNorm);
  let lightDir = normalize(scene.lightPos - input.fragPos);
  let lambert = max(dot(norm, lightDir), 0.0);

  // Spotlight effect
  // let spotlightFactor = calculateSpotlightFactor(spotlight, input.fragPos);
   let lightContribution = computeSpotLight(spotlight, norm,  input.fragPos, lightDir);

  // Combine
  let lightIntensity = ambientFactor + lambert * visibility;
  let texColor = textureSample(meshTexture, meshSampler, input.uv);

  return vec4f(texColor.rgb * (lightIntensity + lightContribution) * albedo, 1.0);
}
`
