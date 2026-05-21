export const kaleidoscopeEffectShader = `
struct Camera {
  viewProjMatrix : mat4x4<f32>,
};

@group(0) @binding(0) var<uniform> camera : Camera;

struct ModelData {
  model : mat4x4<f32>,
  time : f32,
  speed : f32,
  segments : f32,
  zoom : f32,
  intensity : f32,
  colorShift : f32,
  colorShiftSpeed : f32,
  pad : f32,
  tint : vec3<f32>,
  tintStrength : f32,
};
@group(0) @binding(1) var<uniform> modelData : ModelData;

struct VertexInput {
  @location(0) position : vec3<f32>,
  @location(1) uv : vec2<f32>,
};

struct VSOut {
  @builtin(position) Position : vec4<f32>,
  @location(0) v_uv : vec2<f32>,
};

@vertex
fn vsMain(input : VertexInput) -> VSOut {
  var out : VSOut;
  let worldPos = modelData.model * vec4<f32>(input.position, 1.0);
  out.Position = camera.viewProjMatrix * worldPos;
  out.v_uv = input.uv;
  return out;
}

struct FragOut {
  @location(0) color  : vec4f,
  @location(1) normal : vec4f,
  @location(2) worldPos : vec4f,
}

@fragment
fn fsMain(input : VSOut) -> FragOut {
  // Normalize UV to [-1, 1] centered
  var p = input.v_uv * 2.0 - 1.0;
  p *= modelData.zoom;

  // Convert to polar coordinates
  let angle = atan2(p.y, p.x);
  let radius = length(p);

  // Apply rotation based on time & speed
  let rotated = angle + modelData.time * modelData.speed;

  // Kaleidoscope segmentation: fold angle into segment space
  let PI = 3.14159265359;
  let segAngle = (PI * 2.0) / modelData.segments;
  let foldedAngle = abs(((rotated % segAngle) - segAngle * 0.5));

  // Radial patterns with intensity modulation
  let pattern1 = sin(radius * 3.0 * modelData.intensity + modelData.time * 0.5) * 0.5 + 0.5;
  let pattern2 = sin(foldedAngle * 4.0) * 0.5 + 0.5;
  let pattern3 = cos((rotated + modelData.time * 0.3) * 2.0) * 0.5 + 0.5;

  // Color cycling based on colorShift
  let hueShift = sin(modelData.colorShift) * 0.5 + 0.5;
  let col = mix(
    vec3<f32>(pattern1, pattern2, pattern3),
    vec3<f32>(pattern2, pattern3, pattern1),
    hueShift
  );

  let fade = smoothstep(1.2, 0.3, radius);
  let tinted = mix(col, modelData.tint, modelData.tintStrength);

  // return vec4<f32>(tinted * fade, fade);

  // ✅ New (use fade for alpha)
  let finalColor = vec4f(tinted * fade, fade);

  // ✅ Also cleaned up duplicates:
  let particleNormal = vec4f(normalize(vec3f(p, 0.0)), 1.0);
  let particleWorldPos = input.Position;

  return FragOut(
    finalColor,
    particleNormal,
    particleWorldPos
  );
}
`;

export const kaleidoscopeEffectInstance = `
struct Camera {
    viewProj : mat4x4<f32>
};
@group(0) @binding(0) var<uniform> camera : Camera;

struct ModelData {
    model     : mat4x4<f32>,
    timeSpeed : vec4<f32>,
    params    : vec4<f32>,
    tint      : vec4<f32>,
};
@group(0) @binding(1) var<storage, read> modelDataArray : array<ModelData>;

struct VSIn {
    @location(0) position : vec3<f32>,
    @location(1) uv : vec2<f32>,
    @builtin(instance_index) instanceIdx : u32,
};

struct VSOut {
    @builtin(position) position : vec4<f32>,
    @location(0) uv : vec2<f32>,
    @location(1) p0 : vec4<f32>,
    @location(2) p1 : vec4<f32>,
    @location(3) tintColor : vec3<f32>,
};

@vertex
fn vsMain(input : VSIn) -> VSOut {
    var output : VSOut;
    let modelData = modelDataArray[input.instanceIdx];

    let worldPos = modelData.model * vec4<f32>(input.position, 1.0);
    output.position = camera.viewProj * worldPos;
    output.uv = input.uv;

    // Pass data to fragment
    output.p0 = vec4<f32>(
        modelData.timeSpeed.x, // time
        modelData.timeSpeed.y, // speed
        modelData.params.x,    // intensity
        modelData.params.y     // segments
    );
    output.p1 = vec4<f32>(
        modelData.params.z,    // zoom
        modelData.params.w,    // colorShiftSpeed
        modelData.tint.w,      // tintStrength
        0.0
    );
    output.tintColor = modelData.tint.xyz;

    return output;
}

struct FragOut {
  @location(0) color  : vec4f,
  @location(1) normal : vec4f,
  @location(2) worldPos : vec4f,
}

@fragment
fn fsMain(input : VSOut) -> FragOut {
    let time            = input.p0.x;
    let speed           = input.p0.y;
    let intensity       = input.p0.z;
    let segments        = input.p0.w;
    let zoom            = input.p1.x;
    let colorShiftSpeed = input.p1.y;
    let tintStrength    = input.p1.z;
    let tintColor       = input.tintColor;

    // Use mesh UV for local kaleidoscope on each particle
    var p = input.uv * 2.0 - 1.0;
    p *= zoom;

    // Convert to polar coordinates
    let angle = atan2(p.y, p.x);
    let radius = length(p);

    // Apply rotation based on time & speed
    let rotated = angle + time * speed;

    // Kaleidoscope segmentation with proper folding
    let PI = 3.14159265359;
    let segAngle = (PI * 2.0) / segments;
    let halfSeg = segAngle * 0.5;
    
    // Fold the angle symmetrically
    var foldedAngle = rotated % segAngle;
    if (foldedAngle > halfSeg) {
      foldedAngle = segAngle - foldedAngle;
    }
    foldedAngle = abs(foldedAngle - halfSeg);

    // Enhanced radial patterns
    let r = radius + time * 0.3;
    let pattern1 = sin(r * 5.0 + foldedAngle * 8.0 + time) * 0.5 + 0.5;
    let pattern2 = sin(foldedAngle * 6.0 + r * 3.0) * 0.5 + 0.5;
    let pattern3 = cos(r * 4.0 - foldedAngle * 5.0 + time * 0.5) * 0.5 + 0.5;
    let pattern4 = sin((foldedAngle + r) * 7.0) * 0.5 + 0.5;

    // Combine patterns with symmetry
    let basePattern = mix(pattern1, pattern2, pattern3);
    let detail = mix(basePattern, pattern4, pattern3);

    // Color cycling
    let hueShift = sin(time * colorShiftSpeed + foldedAngle * 2.0) * 0.5 + 0.5;
    let col = mix(
      vec3<f32>(detail, pattern2, pattern1),
      vec3<f32>(pattern3, detail, pattern4),
      hueShift
    );

    // Radial fade with more definition
    let fade = smoothstep(1.5, 0.0, radius) * (1.0 - smoothstep(0.5, 0.0, abs(radius - 0.5)));

    // Apply tint
    let tinted = mix(col, col * tintColor * 2.0, tintStrength * fade);

    // return vec4<f32>(tinted * fade, fade * intensity);
    let finalColor = vec4f(tinted * fade, fade * intensity);
    let particleNormal = vec4f(normalize(vec3f(p, 0.0)), 1.0);
    let particleWorldPos = input.position;

    return FragOut(
      finalColor,
      particleNormal,
      particleWorldPos
    );
}
`;

// export const kaleidoscopeEffectInstance = `
// struct Camera {
//     viewProj : mat4x4<f32>
// };
// @group(0) @binding(0) var<uniform> camera : Camera;

// struct ModelData {
//     model     : mat4x4<f32>,
//     timeSpeed : vec4<f32>,
//     params    : vec4<f32>,
//     tint      : vec4<f32>,
// };
// @group(0) @binding(1) var<storage, read> modelDataArray : array<ModelData>;

// struct VSIn {
//     @location(0) position : vec3<f32>,
//     @location(1) uv : vec2<f32>,
//     @builtin(instance_index) instanceIdx : u32,
// };

// struct VSOut {
//     @builtin(position) position : vec4<f32>,
//     @location(0) uv : vec2<f32>,
//     @location(1) p0 : vec4<f32>,
//     @location(2) p1 : vec4<f32>,
//     @location(3) tintColor : vec3<f32>,
// };

// @vertex
// fn vsMain(input : VSIn) -> VSOut {
//     var output : VSOut;
//     let modelData = modelDataArray[input.instanceIdx];

//     let worldPos = modelData.model * vec4<f32>(input.position, 1.0);
//     output.position = camera.viewProj * worldPos;
//     output.uv = input.uv;

//     // Pass data to fragment
//     output.p0 = vec4<f32>(
//         modelData.timeSpeed.x, // time
//         modelData.timeSpeed.y, // speed
//         modelData.params.x,    // intensity
//         modelData.params.y     // segments
//     );
//     output.p1 = vec4<f32>(
//         modelData.params.z,    // zoom
//         modelData.params.w,    // colorShiftSpeed
//         modelData.tint.w,      // tintStrength
//         0.0
//     );
//     output.tintColor = modelData.tint.xyz;

//     return output;
// }

// @fragment
// fn fsMain(input : VSOut) -> @location(0) vec4<f32> {
//     let time            = input.p0.x;
//     let speed           = input.p0.y;
//     let intensity       = input.p0.z;
//     let segments        = input.p0.w;
//     let zoom            = input.p1.x;
//     let colorShiftSpeed = input.p1.y;
//     let tintStrength    = input.p1.z;
//     let tintColor       = input.tintColor;

//     // Normalize UV to [-1, 1] centered
//     var p = input.uv * 2.0 - 1.0;
//     p *= zoom;

//     // Convert to polar coordinates
//     let angle = atan2(p.y, p.x);
//     let radius = length(p);

//     // Apply rotation based on time & speed
//     let rotated = angle + time * speed;

//     // Kaleidoscope segmentation
//     let PI = 3.14159265359;
//     let segAngle = (PI * 2.0) / segments;
//     let foldedAngle = abs(((rotated % segAngle) - segAngle * 0.5));

//     // Radial patterns with intensity modulation
//     let pattern1 = sin(radius * 3.0 * intensity + time * 0.5) * 0.5 + 0.5;
//     let pattern2 = sin(foldedAngle * 4.0) * 0.5 + 0.5;
//     let pattern3 = cos((rotated + time * 0.3) * 2.0) * 0.5 + 0.5;

//     // Color cycling
//     let hueShift = sin(time * colorShiftSpeed) * 0.5 + 0.5;
//     let col = mix(
//       vec3<f32>(pattern1, pattern2, pattern3),
//       vec3<f32>(pattern2, pattern3, pattern1),
//       hueShift
//     );

//     // Fade edges
//     let fade = smoothstep(1.2, 0.3, radius);

//     // Apply tint
//     let tinted = mix(col, col * tintColor * 2.0, tintStrength * fade);

//     return vec4<f32>(tinted * fade, fade * intensity);
// }
// `;