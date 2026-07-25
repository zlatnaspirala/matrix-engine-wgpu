// Heightfield water simulation shaders.
// Ported from jeantimex/webgpu-water (github.com/jeantimex/webgpu-water),
// itself a WebGPU port of Evan Wallace's WebGL Water.
// Adapted for matrix-engine-wgpu's "effect" subsystem: no #include preprocessor
// here (engine ships raw WGSL as template strings), so the shared bindings
// struct/functions are inlined into every file that needs them, same as the
// vite-plugin-glsl #include used to produce in the original repo.

export const fullscreenVertShader = `
struct VertexOutput {
  @builtin(position) position : vec4f,
  @location(0) uv : vec2f,
}

@vertex
fn vs_main(@builtin(vertex_index) vertexIndex : u32) -> VertexOutput {
  var pos = array<vec2f, 6>(
    vec2f(-1.0, -1.0), vec2f(1.0, -1.0), vec2f(-1.0, 1.0),
    vec2f(-1.0, 1.0), vec2f(1.0, -1.0), vec2f(1.0, 1.0)
  );
  var output : VertexOutput;
  output.position = vec4f(pos[vertexIndex], 0.0, 1.0);
  output.uv = vec2f((pos[vertexIndex].x + 1.0) * 0.5, (1.0 - pos[vertexIndex].y) * 0.5);
  return output;
}
`;

export const dropFragShader = `
@group(0) @binding(0) var waterTexture : texture_2d<f32>;
@group(0) @binding(1) var waterSampler : sampler;

struct DropUniforms {
  center : vec2f,
  radius : f32,
  strength : f32,
}
@group(0) @binding(2) var<uniform> u : DropUniforms;

@fragment
fn fs_main(@location(0) uv : vec2f) -> @location(0) vec4f {
  var info = textureSample(waterTexture, waterSampler, uv);
  let drop = max(0.0, 1.0 - length(u.center * 0.5 + 0.5 - uv) / u.radius);
  let dropVal = 0.5 - cos(drop * 3.14159265) * 0.5;
  info.r += dropVal * u.strength;
  return info;
}
`;

export const updateFragShader = `
@group(0) @binding(0) var waterTexture : texture_2d<f32>;
@group(0) @binding(1) var waterSampler : sampler;

struct UpdateUniforms {
  delta : vec2f,
}
@group(0) @binding(2) var<uniform> u : UpdateUniforms;

@fragment
fn fs_main(@location(0) uv : vec2f) -> @location(0) vec4f {
  var info = textureSample(waterTexture, waterSampler, uv);

  let dx = vec2f(u.delta.x, 0.0);
  let dy = vec2f(0.0, u.delta.y);

  let average = (
    textureSample(waterTexture, waterSampler, uv - dx).r +
    textureSample(waterTexture, waterSampler, uv - dy).r +
    textureSample(waterTexture, waterSampler, uv + dx).r +
    textureSample(waterTexture, waterSampler, uv + dy).r
  ) * 0.25;

  info.g += (average - info.r) * 2.0;
  info.g *= 0.98;
  info.r += info.g;

if (abs(info.g) < 0.0001) {  info.g = 0.0;}
if (abs(info.r) < 0.0001) {  info.r = 0.0;}
  // let edgeDist = min(min(uv.x, 1.0 - uv.x), min(uv.y, 1.0 - uv.y));
  // let edgeFalloff = smoothstep(0.0, 0.04, edgeDist);
  // info.r *= edgeFalloff;
  // info.g *= edgeFalloff;
  return info;
}
`;

// Computes surface normals (stored in BA channels) from height differences.
export const normalFragShader = `
@group(0) @binding(0) var waterTexture : texture_2d<f32>;
@group(0) @binding(1) var waterSampler : sampler;

struct NormalUniforms {
  delta : vec2f,
}
@group(0) @binding(2) var<uniform> u : NormalUniforms;

@fragment
fn fs_main(@location(0) uv : vec2f) -> @location(0) vec4f {
  var info = textureSample(waterTexture, waterSampler, uv);

  let val_dx = textureSample(waterTexture, waterSampler, vec2f(uv.x + u.delta.x, uv.y)).r;
  let val_dy = textureSample(waterTexture, waterSampler, vec2f(uv.x, uv.y + u.delta.y)).r;

  let dx = vec3f(u.delta.x, val_dx - info.r, 0.0);
  let dy = vec3f(0.0, val_dy - info.r, u.delta.y);

  let normal = normalize(cross(dy, dx));
  info.b = normal.x;
  info.a = normal.z;

  return info;
}
`;

// Displaces the water where a sphere (or any bounding sphere) enters/leaves it.
export const sphereFragShader = `
@group(0) @binding(0) var waterTexture : texture_2d<f32>;
@group(0) @binding(1) var waterSampler : sampler;

struct SphereUniforms {
  oldCenter : vec3f,
  radius : f32,
  newCenter : vec3f,
  padding : f32,
}
@group(0) @binding(2) var<uniform> u : SphereUniforms;

fn volumeInSphere(center : vec3f, uv : vec2f, radius : f32) -> f32 {
  let p = vec3f(uv.x * 2.0 - 1.0, 0.0, uv.y * 2.0 - 1.0);
  let dist = length(p - center);
  let t = dist / radius;
  let dy = exp(-pow(t * 1.5, 6.0));
  let ymin = min(0.0, center.y - dy);
  let ymax = min(max(0.0, center.y + dy), ymin + 2.0 * dy);
  return (ymax - ymin) * 0.1;
}

@fragment
fn fs_main(@location(0) uv : vec2f) -> @location(0) vec4f {
  var info = textureSample(waterTexture, waterSampler, uv);
  info.r += volumeInSphere(u.oldCenter, uv, u.radius);
  info.r -= volumeInSphere(u.newCenter, uv, u.radius);
  return info;
}
`;

export const surfaceVertShader = `
struct Camera {
  viewProj : mat4x4<f32>
};

@group(0) @binding(0) var<uniform> camera : Camera;

struct ModelData {
  model : mat4x4<f32>,
  eyePosition : vec4<f32>
};

struct CommonUniforms {
  viewProjectionMatrix : mat4x4f,
  eyePosition : vec3f,
}

@binding(1) @group(0) var<uniform> modelData : ModelData;
@binding(4) @group(0) var waterSampler : sampler;
@binding(5) @group(0) var waterTexture : texture_2d<f32>;

struct VertexOutput {
  @builtin(position) position : vec4f,
  @location(0) localPos : vec3f,
  @location(1) worldPos : vec3f,
}

@vertex
fn vs_main(@location(0) position : vec3f) -> VertexOutput {
  var output : VertexOutput;
  let uv = position.xz * 0.5 + 0.5;
  let info = textureSampleLevel(waterTexture, waterSampler, uv, 0.0);
  var pos = position;
  pos.y = info.r;
  let worldPos = modelData.model * vec4f(pos, 1.0);
  output.worldPos = worldPos.xyz;
  output.position = camera.viewProj * worldPos;
  output.localPos = pos;
  return output;
}`;

export const surfaceFragShader = `
struct CommonUniforms {
  viewProjectionMatrix : mat4x4f,
  eyePosition : vec3f,
}
struct ModelData {
  model : mat4x4<f32>,
  eyePosition : vec4<f32>
}
struct LightUniforms {
  direction : vec3f,
}
struct WaterUniforms {
  ior : f32,
  fresnelMin : f32,
  causticIntensity : f32,
  poolHeight : f32,
  halfSize : f32,
  posX : f32,
  posY : f32,
  posZ : f32,
}

@binding(0) @group(0) var<uniform> commonUniforms : CommonUniforms;
@binding(1) @group(0) var<uniform> modelData : ModelData;
@binding(2) @group(0) var<uniform> light : LightUniforms;
@binding(3) @group(0) var<uniform> waterUniforms : WaterUniforms;
@binding(4) @group(0) var waterSampler : sampler;
@binding(5) @group(0) var waterTexture : texture_2d<f32>;
@binding(6) @group(0) var floorSampler : sampler;
@binding(7) @group(0) var floorTexture : texture_2d<f32>;
@binding(8) @group(0) var causticsTexture : texture_2d<f32>;

const IOR_AIR : f32 = 1.0;
const ABOVEwaterColor : vec3f = vec3f(0.25, 1.0, 1.25);
const UNDERwaterColor : vec3f = vec3f(0.4, 0.9, 1.0);

// Cheap analytic sky: horizon -> zenith gradient + sun disc, no cubemap needed.
fn skyColor(ray : vec3f) -> vec3f {
  let horizon = vec3f(0.60, 0.75, 0.85);
  let zenith = vec3f(0.10, 0.30, 0.65);
  var color = mix(horizon, zenith, clamp(ray.y, 0.0, 1.0));
  let sunDir = normalize(light.direction);
  let spec = pow(max(0.0, dot(sunDir, ray)), 2000.0);
  color += vec3f(spec) * vec3f(10.0, 8.0, 6.0);
  return color;
}

fn floorColor(origin : vec3f, ray : vec3f) -> vec3f {
  let t = (-waterUniforms.poolHeight - origin.y) / ray.y;
  let hit = origin + ray * t;
  
  // Subtract model position offset stored in water uniforms
  let modelTranslation = vec2f(waterUniforms.posX, waterUniforms.posZ);
  let localHitXZ = hit.xz - modelTranslation;
  
  let uv = (localHitXZ / waterUniforms.halfSize) * 0.5 + 0.5;  
  var color = textureSampleLevel(floorTexture, floorSampler, uv, 0.0).rgb;
  let caustic = textureSampleLevel(causticsTexture, waterSampler, uv, 0.0);
  color *= 1.0 + caustic.r * 2.0 * caustic.g;
  return color;
}

fn surfaceRayColor(origin : vec3f, ray : vec3f, tint : vec3f) -> vec3f {
  var color : vec3f;
  if (ray.y < 0.0) {
    color = floorColor(origin, ray) * tint;
  } else {
    color = skyColor(ray);
  }
  return color;
}

struct FragOut {
    @location(0) color    : vec4f,
    @location(1) normal   : vec4f,
    @location(2) worldPos : vec4f,
}

@fragment
fn fs_main(@location(0) localPos : vec3f, @location(1) worldPos : vec3f) -> FragOut {

var uv = localPos.xz * 0.5 + 0.5;
var info = textureSampleLevel(waterTexture, waterSampler, uv, 0.0);

for (var i = 0; i < 4; i++) {
    uv += info.ba * 0.005;
    info = textureSampleLevel(waterTexture, waterSampler, uv, 0.0);
}

let ba = vec2f(info.b, info.a);
let normal = vec3f(
    info.b,
    sqrt(max(0.0, 1.0 - dot(ba, ba))),
    info.a
);

let incomingRay  = normalize(worldPos - commonUniforms.eyePosition);
let reflectedRay = reflect(incomingRay, normal);
let refractedRay = refract(
  incomingRay,
  normal,
  IOR_AIR / waterUniforms.ior
);

let fresnel = mix(
  waterUniforms.fresnelMin,
  1.0,
  pow(1.0 - dot(normal, -incomingRay), 3.0)
);

let reflectedColor = surfaceRayColor(
  worldPos,
  reflectedRay,
  ABOVEwaterColor
);

let refractedColor = surfaceRayColor(
  worldPos,
  refractedRay,
  ABOVEwaterColor
);

let finalColor = mix(
  refractedColor,
  reflectedColor,
  fresnel
);

return FragOut(
  vec4f(finalColor, 1.0),
  vec4f(normalize(normal), 0.0),
  vec4f(worldPos, 1.0)
);
}`;

export const causticsVertShader = `
struct LightUniforms {
  direction : vec3f,
}

struct WaterUniforms {
  ior : f32,
  fresnelMin : f32,
  causticIntensity : f32,
  poolHeight : f32,
  halfSize : f32,
}

@binding(0) @group(0) var<uniform> light : LightUniforms;
@binding(1) @group(0) var<uniform> waterUniforms : WaterUniforms;
@binding(2) @group(0) var waterSampler : sampler;
@binding(3) @group(0) var waterTexture : texture_2d<f32>;

struct VertexOutput {
    @builtin(position) position : vec4f,
    @location(0) oldPos : vec3f,
    @location(1) newPos : vec3f,
    @location(2) ray : vec3f,
}

fn project(origin : vec3f, ray : vec3f, refractedLight : vec3f) -> vec3f {
    let tplane = (-waterUniforms.poolHeight - origin.y) / ray.y;
    return origin + ray * tplane;
}

@vertex
fn vs_main(@location(0) position : vec3f) -> VertexOutput {
    var output : VertexOutput;
    let uv = position.xz * 0.5 + 0.5;
    let info = textureSampleLevel(waterTexture, waterSampler, uv, 0.0);
    let ba = vec2f(info.b, info.a);
    var normal = vec3f(
        info.b,
        sqrt(max(0.0, 1.0 - dot(ba, ba))),
        info.a
    );
    normal = normalize(vec3f(normal.x / waterUniforms.halfSize, normal.y, normal.z / waterUniforms.halfSize));
    let IOR_AIR = 1.0;
    let lightDir = normalize(light.direction);
    let refractedLight = refract(-lightDir, vec3f(0.0, 1.0, 0.0), IOR_AIR / waterUniforms.ior);
    let ray = refract(-lightDir, normal, IOR_AIR / waterUniforms.ior);
    let localPos = vec3f(position.x, 0.0, position.z);
    let localPosDisplaced = vec3f(position.x, info.r, position.z);
    output.oldPos = project(localPos, refractedLight, refractedLight);
    output.newPos = project(localPosDisplaced, ray, refractedLight);
    output.ray = ray;
    let projectedPos = 0.75 * (output.newPos.xz - output.newPos.y * refractedLight.xz / refractedLight.y);
    output.position = vec4f(projectedPos.x, -projectedPos.y, 0.0, 1.0);
    return output;
}
`;

export const causticsFragShader = `
struct WaterUniforms {
    ior : f32,
    fresnelMin : f32,
    causticIntensity : f32,
    poolHeight : f32,
 
}
@binding(1) @group(0) var<uniform> waterUniforms : WaterUniforms;

@fragment
fn fs_main(@location(0) oldPos : vec3f, @location(1) newPos : vec3f, @location(2) ray : vec3f) -> @location(0) vec4f {
  let oldArea = length(dpdx(oldPos)) * length(dpdy(oldPos));
  let newArea = length(dpdx(newPos)) * length(dpdy(newPos));
  let safeNewArea = max(newArea, 0.00001);
  let intensity = (oldArea / safeNewArea) * waterUniforms.causticIntensity;
  return vec4f(intensity, 1.0, 0.0, 1.0);
}
`;