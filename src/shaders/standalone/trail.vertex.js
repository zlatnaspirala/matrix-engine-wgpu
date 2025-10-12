export const trailVertex = `struct Camera {
  viewProjMatrix : mat4x4<f32>,
};
@group(0) @binding(0) var<uniform> camera : Camera;

struct Model {
  modelMatrix : mat4x4<f32>,
};
@group(0) @binding(1) var<uniform> model : Model;

struct TrailUniform {
  _pad0     : vec4<f32>,
  fadeLength: f32,
  now       : f32,
  startTime : f32,
  _pad1     : f32,
};
@group(0) @binding(2) var<uniform> trail : TrailUniform;

 
struct VertexInput {
  @location(0) position : vec3<f32>,
  @location(1) uv       : vec2<f32>,
};


struct VSOut {
  @builtin(position) Position : vec4<f32>,
  @location(0) v_uv : vec2<f32>,
  @location(1) v_age: f32,
};

@vertex
fn vsMain(input : VertexInput) -> VSOut {
  var out : VSOut;

  // multiply vertex by ghost model matrix
  let worldPos = model.modelMatrix * vec4<f32>(input.position, 1.0);

  out.Position = camera.viewProjMatrix * worldPos;
  out.v_uv = input.uv;
  out.v_age = trail.now - trail.startTime;

  return out;
}

@fragment
fn fsMain(input: VSOut) -> @location(0) vec4<f32> {
  // let age = input.v_age;
  // let fadeTime = clamp(1.0 - (age / trail.fadeLength), 0.0, 1.0);

  let age = input.v_age; // now - spawnTime
let fadeTime = clamp(1.0 - age / trail.fadeLength, 0.0, 1.0);

  let along = input.v_uv.x;
  let lengthFade = pow(1.0 - clamp(along, 0.0, 1.0), 1.4);

  let side = input.v_uv.y;
  let centerDist = abs(side - 0.5) * 2.0;
  let sideFade = smoothstep(1.0, 0.0, centerDist);

  let baseColor = vec3<f32>(0.2, 0.7, 1.0);
  // let fade = fadeTime * lengthFade * sideFade;
  // return vec4<f32>(baseColor * fade, fade);

  let fade = lengthFade * sideFade; // no fadeTime
  //  return vec4<f32>(baseColor * fade, fade);
    return vec4<f32>(0.2, 0.7, 1.0, 1.0); // solid color
}`;