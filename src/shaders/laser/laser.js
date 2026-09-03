export const laserShaderCode = `
struct Camera {
  mvp: mat4x4<f32>
};

struct LaserInstance {
  matrix:     mat4x4<f32>,   // offset 0,  16 floats
  colorA:     vec4<f32>,     // offset 16, 4 floats  — core color
  colorB:     vec4<f32>,     // offset 20, 4 floats  — glow color
  params:     vec4<f32>,     // offset 24, 4 floats  — time, length, width, mode
  extra:      vec4<f32>,     // offset 28, 4 floats  — intensity, pulseFreq, scroll, unused
};

@group(0) @binding(0) var<uniform>            camera:    Camera;
@group(0) @binding(1) var<storage, read>      instances: array<LaserInstance>;

struct VertOut {
  @builtin(position) clip:      vec4<f32>,
  @location(0)       uv:        vec2<f32>,
  @location(1)       colorA:    vec4<f32>,
  @location(2)       colorB:    vec4<f32>,
  @location(3)       params:    vec4<f32>,
  @location(4)       extra:     vec4<f32>,
};

@vertex
fn vsMain(
  @location(0) pos: vec3<f32>,
  @location(1) uv:  vec2<f32>,
  @builtin(instance_index) iIdx: u32
) -> VertOut {
  let inst = instances[iIdx];
  let world = inst.matrix * vec4<f32>(pos, 1.0);
  var out: VertOut;
  out.clip   = camera.mvp * world;
  out.uv     = uv;
  out.colorA = inst.colorA;
  out.colorB = inst.colorB;
  out.params = inst.params;
  out.extra  = inst.extra;
  return out;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

fn softGlow(dist: f32, width: f32) -> f32 {
  return exp(-dist * dist / (width * width));
}

fn hash(n: f32) -> f32 {
  return fract(sin(n) * 43758.5453);
}

fn noise(x: f32) -> f32 {
  let i = floor(x);
  let f = fract(x);
  let u = f * f * (3.0 - 2.0 * f);
  return mix(hash(i), hash(i + 1.0), u);
}

struct FragOut {
  @location(0) color:    vec4<f32>,
  @location(1) normal:   vec4<f32>,
  @location(2) worldPos: vec4<f32>,
};

@fragment
fn fsMain(in: VertOut) -> FragOut {
  let t       = in.params.x;   // time
  let length  = in.params.y;   // beam length (unused in UV, handled by matrix)
  let width   = in.params.z;   // beam width 0..1
  let mode    = in.params.w;   // 0=solid 1=pulse 2=helix 3=disintegrate 4=plasma

  let intensity  = in.extra.x;
  let pulseFreq  = in.extra.y;
  let scroll     = in.extra.z;

  let u = in.uv.x;  // 0..1 along beam length
  let v = in.uv.y;  // -1..1 across beam width (centered)

  // ── Core radial falloff — always present ─────────────────────────────────
  let dist      = abs(v);
  let coreFall  = softGlow(dist, 0.15);   // tight bright core
  let glowFall  = softGlow(dist, 0.55);   // wide soft glow

  var alpha = 0.0;
  var col   = vec3<f32>(0.0);

  // ── Mode 0: Solid beam ───────────────────────────────────────────────────
  if (mode < 0.5) {
    let scrollU = fract(u - t * scroll);
    let edge    = smoothstep(0.0, 0.05, u) * smoothstep(0.0, 0.05, 1.0 - u);
    alpha = (coreFall * 0.8 + glowFall * 0.4) * edge * intensity;
    col   = mix(in.colorB.rgb, in.colorA.rgb, coreFall) * alpha;
  }

  // ── Mode 1: Pulse ────────────────────────────────────────────────────────
  else if (mode < 1.5) {
    let scrollU  = fract(u - t * scroll);
    let pulse    = sin(scrollU * 3.14159 * pulseFreq - t * 4.0) * 0.5 + 0.5;
    let edge     = smoothstep(0.0, 0.06, u) * smoothstep(0.0, 0.06, 1.0 - u);
    alpha = (coreFall * pulse + glowFall * 0.3) * edge * intensity;
    col   = mix(in.colorB.rgb, in.colorA.rgb * pulse, coreFall);
  }

  // ── Mode 2: Helix ────────────────────────────────────────────────────────
  else if (mode < 2.5) {
    let scrollU = fract(u - t * scroll);
    // Two helical strands offset by pi
    let strand1 = sin(scrollU * 3.14159 * 6.0 - t * 5.0);
    let strand2 = sin(scrollU * 3.14159 * 6.0 - t * 5.0 + 3.14159);
    let helix   = max(
      softGlow(v - strand1 * 0.4, 0.12),
      softGlow(v - strand2 * 0.4, 0.12)
    );
    let edge  = smoothstep(0.0, 0.04, u) * smoothstep(0.0, 0.04, 1.0 - u);
    alpha = (helix * 0.9 + glowFall * 0.2) * edge * intensity;
    col   = mix(in.colorB.rgb, in.colorA.rgb, helix);
  }

  // ── Mode 3: Disintegrate ─────────────────────────────────────────────────
  else if (mode < 3.5) {
    let scrollU  = fract(u + t * scroll);
    // Noisy particle breakup toward tip
    let n1       = noise(scrollU * 20.0 + t * 2.0);
    let n2       = noise(scrollU * 40.0 - t * 3.0);
    let breakup  = n1 * n2;
    let tipFade  = smoothstep(0.0, 0.3, 1.0 - u); // fade toward tip
    let edge     = smoothstep(0.0, 0.05, u);
    alpha = coreFall * breakup * tipFade * edge * intensity;
    col   = mix(in.colorA.rgb, in.colorB.rgb, 1.0 - tipFade) * (breakup + 0.3);
  }

  // ── Mode 4: Plasma ───────────────────────────────────────────────────────
  else {
    let scrollU  = fract(u - t * scroll);
    let n1       = noise(scrollU * 8.0  + t * 1.5);
    let n2       = noise(v      * 6.0  + t * 2.0);
    let plasma   = n1 * n2;
    let warp     = softGlow(v + sin(scrollU * 12.0 - t * 6.0) * 0.3, 0.25);
    let edge     = smoothstep(0.0, 0.05, u) * smoothstep(0.0, 0.05, 1.0 - u);
    alpha = (warp * 0.7 + plasma * 0.5 + glowFall * 0.2) * edge * intensity;
    col   = mix(in.colorB.rgb, in.colorA.rgb, warp + plasma * 0.5);
  }

  alpha = clamp(alpha, 0.0, 1.0);

  var out: FragOut;
  out.color    = vec4<f32>(col * intensity, alpha);
  out.normal   = vec4<f32>(0.0, 0.0, 1.0, 1.0);
  out.worldPos = vec4<f32>(0.0);
  return out;
}
`;