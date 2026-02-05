/**
 * @description
 * Dust/Smoke Particle Shader (WGSL)
 * For Matrix-Engine-WGPU DestructionEffect
 * 
 * Features:
 * - Billboarded quads (always face camera)
 * - Soft particles with smooth fade
 * - GPU instancing for performance
 * - Procedural noise for organic look
 */
export const dustShader = `

// Uniforms
struct Camera {
  viewProj: mat4x4<f32>,
};

struct Model {
  world: mat4x4<f32>,
  time: f32,
  intensity: f32,
  _padding1: f32,
  _padding2: f32,
};

@group(0) @binding(0) var<uniform> camera: Camera;
@group(0) @binding(1) var<uniform> model: Model;

// Vertex input (shared quad)
struct VertexInput {
  @location(0) position: vec3<f32>,      // Quad corner position
  @location(1) uv: vec2<f32>,            // UV coordinates
};

// Instance input (per-particle data)
struct InstanceInput {
  @location(2) posSize: vec4<f32>,       // xyz = position, w = size
  @location(3) velLife: vec4<f32>,       // xyz = velocity, w = life
  @location(4) color: vec4<f32>,         // rgba = color
};

// Vertex output
struct VertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) uv: vec2<f32>,
  @location(1) color: vec4<f32>,
  @location(2) life: f32,
  @location(3) worldPos: vec3<f32>,
};

// Vertex shader - Billboard particles to face camera
@vertex
fn vsMain(
  input: VertexInput,
  instance: InstanceInput,
  @builtin(instance_index) instanceIdx: u32
) -> VertexOutput {
  var output: VertexOutput;
  
  // Get particle world position
  let particleWorldPos = (model.world * vec4<f32>(instance.posSize.xyz, 1.0)).xyz;
  
  // Extract camera right and up vectors from view matrix
  // Since viewProj = projection * view, we need to extract view
  // For billboarding, we'll use a simplified approach:
  // Right = (1, 0, 0) in view space
  // Up = (0, 1, 0) in view space
  
  // Simple billboarding: offset quad corners in screen space
  let size = instance.posSize.w;
  let quadOffset = input.position.xy * size;
  
  // Billboard quad (face camera)
  // Extract camera right and up from inverse view
  let right = normalize(vec3<f32>(camera.viewProj[0][0], camera.viewProj[1][0], camera.viewProj[2][0]));
  let up = normalize(vec3<f32>(camera.viewProj[0][1], camera.viewProj[1][1], camera.viewProj[2][1]));
  
  // Compute final world position
  let worldPos = particleWorldPos + right * quadOffset.x + up * quadOffset.y;
  
  // Project to clip space
  output.position = camera.viewProj * vec4<f32>(worldPos, 1.0);
  output.uv = input.uv;
  output.color = instance.color;
  output.life = instance.velLife.w;
  output.worldPos = worldPos;
  
  return output;
}

// Procedural noise function (for organic particle appearance)
fn hash(p: vec2<f32>) -> f32 {
  var p2 = fract(p * vec2<f32>(123.34, 456.21));
  p2 += dot(p2, p2 + 45.32);
  return fract(p2.x * p2.y);
}

fn noise(p: vec2<f32>) -> f32 {
  let i = floor(p);
  let f = fract(p);
  
  let a = hash(i);
  let b = hash(i + vec2<f32>(1.0, 0.0));
  let c = hash(i + vec2<f32>(0.0, 1.0));
  let d = hash(i + vec2<f32>(1.0, 1.0));
  
  let u = f * f * (3.0 - 2.0 * f);
  
  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

// Fractal Brownian Motion (multi-octave noise)
fn fbm(p: vec2<f32>) -> f32 {
  var value = 0.0;
  var amplitude = 0.5;
  var frequency = 1.0;
  var p2 = p;
  
  for (var i = 0; i < 4; i++) {
    value += amplitude * noise(p2 * frequency);
    frequency *= 2.0;
    amplitude *= 0.5;
  }
  
  return value;
}

// Fragment shader - Soft particle with noise
@fragment
fn fsMain(input: VertexOutput) -> @location(0) vec4<f32> {
  // Distance from center (for radial fade)
  let center = vec2<f32>(0.5, 0.5);
  let dist = length(input.uv - center);
  
  // Radial gradient (soft circular particle)
  var alpha = 1.0 - smoothstep(0.0, 0.5, dist);
  
  // Apply noise for organic look
  let noiseScale = 3.0;
  let noiseUV = input.uv * noiseScale + vec2<f32>(model.time * 0.1);
  let noiseValue = fbm(noiseUV);
  
  // Modulate alpha with noise
  alpha *= noiseValue * 1.5;
  
  // Fade based on particle life
  let lifeFade = clamp(input.life / 0.5, 0.0, 1.0); // Fade in last 0.5s
  alpha *= lifeFade;
  
  // Apply instance color
  var finalColor = input.color;
  finalColor.a *= alpha * model.intensity;
  
  // Discard fully transparent fragments
  if (finalColor.a < 0.01) {
    discard;
  }
  
  return finalColor;
}
`;