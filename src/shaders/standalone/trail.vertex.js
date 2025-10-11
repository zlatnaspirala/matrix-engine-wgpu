export const trailVertex = `struct Camera {
  viewProjMatrix : mat4x4<f32>,
};
@group(0) @binding(0) var<uniform> camera : Camera;

struct Model {
  modelMatrix : mat4x4<f32>,
};
@group(0) @binding(1) var<uniform> model : Model;

// layout: vec3 color, float alpha, float time, float length, padding (packed to 32 bytes)
struct TrailUniform {
  color : vec3<f32>,
  alpha : f32,
  time  : f32,
  length: f32,
  _pad  : f32, // pad to 32 bytes (optional)
};
@group(0) @binding(2) var<uniform> trail : TrailUniform;

// vertex input
struct VertexInput {
  @location(0) position : vec3<f32>, // local-space vertex (already placed in world-space or local)
  @location(1) uv       : vec2<f32>, // uv.x = along (0..1), uv.y = side/taper (0..1)
};

// vertex -> fragment
struct VSOut {
  @builtin(position) Position : vec4<f32>,
  @location(0) v_uv          : vec2<f32>,
  @location(1) v_worldPos    : vec3<f32>,
};

@vertex
fn vsMain(input : VertexInput) -> VSOut {
  var out : VSOut;

  // apply model -> world
  // let worldPos4 = model.modelMatrix * vec4<f32>(input.position, 1.0);
  let worldPos4 = vec4<f32>(input.position, 1.0);
  let worldPos3 = worldPos4.xyz;

  // final clip-space position
  out.Position = camera.viewProjMatrix * worldPos4;

  out.v_uv = input.uv;
  out.v_worldPos = worldPos3;

  return out;
}

@fragment
fn fsMain(in: VSOut) -> @location(0) vec4<f32> {
  // basic along-segment fade (uv.x = 0 head -> 1 tail)
  let along = in.v_uv.x;
  let side  = in.v_uv.y; // 0..1 across ribbon

  // fade exponent - tweak to taste
  let lengthFade = pow(1.0 - clamp(along, 0.0, 1.0), 1.6);

  // radial/taper across ribbon (center brighter, edges softer)
  // assume uv.y 0..1 where 0.5 is center; adapt if your uv mapping differs
  let centerDist = abs(side - 0.5) * 2.0; // 0 at center, 1 at edge
  let sideFade = smoothstep(1.0, 0.0, centerDist); // soft falloff to edges

  // optional time-based pulse
  let pulse = 0.5 + 0.5 * sin(trail.time * 6.0);

  // final color and alpha
  let col = trail.color * (lengthFade * sideFade * (pulse * 0.7 + 0.3));
  let a = trail.alpha * lengthFade * sideFade;

  // return emissive RGBA (for additive blending pipeline)
  return vec4<f32>(col, a);
}`;