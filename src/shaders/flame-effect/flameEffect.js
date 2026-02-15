export const flameEffect = /* wgsl */`

struct Camera {
  viewProj : mat4x4<f32>
};
@group(0) @binding(0) var<uniform> camera : Camera;

// Uniform buffer layout (112 bytes, all vec4-aligned):
//   offset   0 : model        mat4x4<f32>   (64 bytes)
//   offset  64 : timeSpeed    vec4<f32>     (.x = time, .y = speed)
//   offset  80 : params       vec4<f32>     (.x = intensity, .y = turbulence, .z = stretch)
//   offset  96 : tint         vec4<f32>     (.xyz = rgb tint colour, .w = tint strength 0..1)
struct ModelData {
  model     : mat4x4<f32>,
  timeSpeed : vec4<f32>,
  params    : vec4<f32>,
  tint      : vec4<f32>,
};
@group(0) @binding(1) var<uniform> modelData : ModelData;

struct VSIn {
  @location(0) position : vec3<f32>,
  @location(1) uv       : vec2<f32>,
};

struct VSOut {
  @builtin(position) position  : vec4<f32>,
  @location(0)       uv        : vec2<f32>,
  // Pack all scalar params into two interpolants to stay within limits
  @location(1)       p0        : vec4<f32>, // .x=time .y=speed .z=intensity .w=turbulence
  @location(2)       p1        : vec4<f32>, // .x=stretch .y=tintStrength
  @location(3)       tintColor : vec3<f32>,
};

@vertex
fn vsMain(input : VSIn) -> VSOut {
  var output : VSOut;

  let worldPos     = modelData.model * vec4<f32>(input.position, 1.0);
  output.position  = camera.viewProj * worldPos;
  output.uv        = input.uv;

  output.p0 = vec4<f32>(
    modelData.timeSpeed.x,  // time
    modelData.timeSpeed.y,  // speed
    modelData.params.x,     // intensity
    modelData.params.y      // turbulence
  );
  output.p1 = vec4<f32>(
    modelData.params.z,     // stretch
    modelData.tint.w,       // tintStrength
    0.0, 0.0
  );
  output.tintColor = modelData.tint.xyz;

  return output;
}

// ---------------------------------------------------------------------------
// Noise helpers
// ---------------------------------------------------------------------------
fn hash2(n : vec2<f32>) -> f32 {
  return fract(sin(dot(n, vec2<f32>(12.9898, 78.233))) * 43758.5453);
}

fn noise(p : vec2<f32>) -> f32 {
  let i = floor(p);
  let f = fract(p);
  let u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash2(i + vec2<f32>(0.0, 0.0)), hash2(i + vec2<f32>(1.0, 0.0)), u.x),
    mix(hash2(i + vec2<f32>(0.0, 1.0)), hash2(i + vec2<f32>(1.0, 1.0)), u.x),
    u.y
  );
}

// Two-octave fBm for richer turbulence shape
fn fbm(p : vec2<f32>) -> f32 {
  var v   = 0.0;
  var a   = 0.5;
  var pos = p;
  for (var i = 0; i < 2; i++) {
    v   += a * noise(pos);
    pos  = pos * 2.1 + vec2<f32>(1.7, 9.2);
    a   *= 0.5;
  }
  return v;
}

// ---------------------------------------------------------------------------
// Fragment
// ---------------------------------------------------------------------------
@fragment
fn fsMain(input : VSOut) -> @location(0) vec4<f32> {
  // Unpack
  let time       = input.p0.x;
  let speed      = input.p0.y;
  let intensity  = input.p0.z;
  let turbulence = input.p0.w;   // 0 = calm, 1 = chaotic
  let stretch    = input.p1.x;   // 1 = normal, >1 = tall/thin, <1 = short/wide
  let tintStr    = input.p1.y;   // 0 = natural fire colours, 1 = full tint
  let tintColor  = input.tintColor;

  let t = time * speed * 2.0;

  // --- UV: apply stretch then turbulence warp ---
  var uv = input.uv;
  // Compress v-range so flame occupies more of the quad when stretch > 1
  uv.y = uv.y / max(stretch, 0.01);

  let warpAmt = turbulence * 0.18;
  let warpX   = noise(uv * 3.0 + vec2<f32>(0.0, t * 0.6)) - 0.5;
  let warpY   = noise(uv * 3.0 + vec2<f32>(5.2, t * 0.4)) - 0.5;
  var warpedUV = uv + vec2<f32>(warpX, warpY) * warpAmt;

  // Upward scroll + sideways sway scaled by turbulence
  warpedUV.y += t * 0.4;
  warpedUV.x += sin(t * 0.7) * 0.08 * turbulence;

  // --- Flame density ---
  var n = fbm(warpedUV * 6.0 + vec2<f32>(0.0, t * 0.8));
  // Higher turbulence softens the exponent → wilder, fluffier edges
  n = pow(n, 3.0 - turbulence * 1.2);

  // --- Base flame palette (dark core → orange → hot yellow) ---
  let hotColor  = vec3<f32>(1.0,  0.92, 0.35);
  let midColor  = vec3<f32>(1.0,  0.38, 0.04);
  let coolColor = vec3<f32>(0.55, 0.04, 0.0 );

  let g1 = smoothstep(0.0, 0.5, n);
  let g2 = smoothstep(0.5, 1.0, n);
  var baseColor = mix(mix(coolColor, midColor, g1), hotColor, g2);

  // --- Tint: blend base palette toward tintColor in the bright parts only ---
  // tintStr = 0 → pure natural fire;  tintStr = 1 → fully tinted flame
  let tintMask  = smoothstep(0.0, 0.5, n);
  baseColor = mix(baseColor, baseColor * tintColor * 2.0, tintStr * tintMask);

  let finalColor = baseColor * n * intensity;

  // --- Alpha mask: soft edges + top fade that respects stretch ---
  let edgeMask  = smoothstep(0.0, 0.15, input.uv.x)
                * smoothstep(0.0, 0.15, 1.0 - input.uv.x);
  let fadeStart = clamp(0.25 / max(stretch, 0.1), 0.1, 0.6);
  let topFade   = 1.0 - smoothstep(fadeStart, 1.0, input.uv.y);

  let alpha = smoothstep(0.08, 0.65, n) * edgeMask * topFade;

  // Premultiplied alpha for additive blending
  return vec4<f32>(finalColor * alpha, alpha);
}
`;