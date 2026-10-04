import {mat4} from 'wgpu-matrix';

const sacredGeometryShader = `
struct Camera {
  viewProj : mat4x4<f32>
};

@group(0) @binding(0) var<uniform> camera : Camera;

struct ModelData {
  model       : mat4x4<f32>,
  uniforms    : vec4<f32>,   // x: time, y: modeShape, z: pulseSpeed, w: glowIntensity
  customColor : vec4<f32>,   // xyz: color RGB (or RGBA), w: unused/extra
  lineWidth   : f32,
  pad1        : f32,
  pad2        : f32,
  pad3        : f32
};

@group(0) @binding(1) var<storage, read> modelDataArray : array<ModelData>;

struct VSIn {
  @location(0) position : vec3<f32>,
  @location(1) normal : vec3<f32>,
  @location(2) uv : vec2<f32>,
  @builtin(instance_index) instanceIdx : u32,
};

struct VSOut {
  @builtin(position) position : vec4<f32>,
  @location(0) uv : vec2<f32>,
  @location(1) normal : vec3<f32>,
  @location(2) fragPos : vec3<f32>,
  @location(3) data0 : vec4<f32>,
  @location(4) customColor : vec4<f32>,
  @location(5) lineWidth : f32,
};

@vertex
fn vsMain(input : VSIn) -> VSOut {
  var output : VSOut;
  let modelData = modelDataArray[input.instanceIdx];

  let worldPos = modelData.model * vec4<f32>(input.position, 1.0);
  output.position = camera.viewProj * worldPos;
  
  output.uv = input.uv;
  output.fragPos = worldPos.xyz;
  
  let normalMatrix = mat3x3f(
    modelData.model[0].xyz,
    modelData.model[1].xyz,
    modelData.model[2].xyz
  );
  output.normal = normalMatrix * input.normal;
  
  output.data0 = modelData.uniforms;
  output.customColor = modelData.customColor;
  output.lineWidth = modelData.lineWidth;

  return output;
}

fn distanceToPentagram(p : vec2<f32>) -> f32 {
  var minDist = 1e6;
  let tau = 6.28318530718;
  for (var i = 0u; i < 5u; i = i + 1u) {
    let angle = f32(i) * tau / 5.0;
    let p1 = vec2<f32>(cos(angle), sin(angle));
    let angle2 = angle + tau / 10.0;
    // let p2 = vec2<f32>(cos(angle2), sin(angle2)) * 0.4;
    let p2 = vec2<f32>(cos(angle2), sin(angle2)) * 0.4;
    let v = (p2 - p1) * 2;
    let w = p - p1;
    let c1 = dot(w, v);
    if (c1 <= 0.0) { minDist = min(minDist, length(w)); continue; }
    let c2 = dot(v, v);
    if (c1 >= c2) { minDist = min(minDist, length(p - p2)); continue; }
    let t = c1 / c2;
    let closest = p1 + v * t;
    minDist = min(minDist, length(p - closest));
  }
  
  return minDist;
}

fn distanceToTriangle(p : vec2<f32>) -> f32 {
  let p1 = vec2<f32>(0.0, 0.866);
  let p2 = vec2<f32>(-1.0, -0.5);
  let p3 = vec2<f32>(1.0, -0.5);
  
  var minDist = 1e6;
  
  let v = p2 - p1;
  let w = p - p1;
  let t = clamp(dot(w, v) / dot(v, v), 0.0, 1.0);
  minDist = min(minDist, length(p - (p1 + v * t)));
  
  let v2 = p3 - p2;
  let w2 = p - p2;
  let t2 = clamp(dot(w2, v2) / dot(v2, v2), 0.0, 1.0);
  minDist = min(minDist, length(p - (p2 + v2 * t2)));
  
  let v3 = p1 - p3;
  let w3 = p - p3;
  let t3 = clamp(dot(w3, v3) / dot(v3, v3), 0.0, 1.0);
  minDist = min(minDist, length(p - (p3 + v3 * t3)));
  
  return minDist;
}

fn distanceToHexagon(p : vec2<f32>) -> f32 {
  var minDist = 1e6;
  let tau = 6.28318530718;
  
  for (var i = 0u; i < 6u; i = i + 1u) {
    let angle = f32(i) * tau / 6.0;
    let p1 = vec2<f32>(cos(angle), sin(angle));
    let angle2 = angle + tau / 6.0;
    let p2 = vec2<f32>(cos(angle2), sin(angle2));
    
    let v = p2 - p1;
    let w = p - p1;
    let t = clamp(dot(w, v) / dot(v, v), 0.0, 1.0);
    minDist = min(minDist, length(p - (p1 + v * t)));
  }
  
  return minDist;
}

fn distanceToCircle(p : vec2<f32>) -> f32 {
  return abs(length(p) - 0.8);
}

fn distanceToSquare(p : vec2<f32>) -> f32 {
  let q = abs(p) - 0.7;
  return length(max(q, vec2<f32>(0.0))) + min(max(q.x, q.y), 0.0);
}

fn getDistanceField(p : vec2<f32>, mode : u32) -> f32 {
  switch(mode) {
    case 0u: { return distanceToPentagram(p); }
    case 1u: { return distanceToTriangle(p); }
    case 2u: { return distanceToHexagon(p); }
    case 3u: { return distanceToCircle(p); }
    case 4u: { return distanceToSquare(p); }
    default: { return distanceToPentagram(p); }
  }
}

struct FragOut {
  @location(0) color : vec4f,
  @location(1) normal : vec4f,
  @location(2) worldPos : vec4f,
};

@fragment
fn fsMain(input : VSOut) -> FragOut {
  let time = input.data0.x;
  let modeShapeF = input.data0.y;
  let pulseSpeed = input.data0.z;
  let glowIntensity = input.data0.w;
  let lineWidth = input.lineWidth;
  let modeShape = u32(modeShapeF);
  let uv = input.uv * 2.0 - 1.0;
  let dist = getDistanceField(uv, modeShape);
  let pulse = 0.5 + 0.5 * sin(time * pulseSpeed);
  let lineThickness = lineWidth * (0.8 + 0.2 * pulse);
  let line = smoothstep(lineThickness + 0.02, lineThickness, dist);
  
  // Use custom CPU color if non-zero, otherwise default to shape presets
  var neonColor = input.customColor.rgb;
  if (length(neonColor) == 0.0) {
    switch(modeShape) {
      case 0u: { neonColor = vec3<f32>(0.0, 1.0, 1.0); }
      case 1u: { neonColor = vec3<f32>(1.0, 0.0, 1.0); }
      case 2u: { neonColor = vec3<f32>(0.0, 1.0, 0.0); }
      case 3u: { neonColor = vec3<f32>(1.0, 1.0, 0.0); }
      case 4u: { neonColor = vec3<f32>(1.0, 0.0, 0.0); }
      default: { neonColor = vec3<f32>(0.0, 1.0, 1.0); }
    }
  }
  
  let finalIntensity = line * glowIntensity * pulse;
  let glowColor = neonColor * finalIntensity;
  
  let halo = exp(-dist * 5.0) * 0.3 * pulse;
  let finalColor = glowColor + neonColor * halo;
  
  return FragOut(
    vec4f(finalColor, line),
    vec4f(normalize(input.normal), 0.0),
    vec4f(input.fragPos, 1.0)
  );
}
`;

export class SacredGeometryEffect {
  static _pipelineCache = new WeakMap();
  constructor(device, format, cameraBuffer) {
    console.log('%c[SacredGeometryEffect] Initializing...', 'color: cyan; font-weight: bold;');

    this.device = device;
    this.format = format;
    this.cameraBuffer = cameraBuffer;

    this.time = 0;
    this.enabled = true;
    this.intensity = 1.0;

    this.SHAPE_MODES = {
      PENTAGRAM: 0,
      TRIANGLE: 1,
      HEXAGON: 2,
      CIRCLE: 3,
      SQUARE: 4,
    };

    this.currentMode = this.SHAPE_MODES.PENTAGRAM;
    this.pulseSpeed = 3.0;
    this.glowIntensity = 2.5;
    this.lineWidth = 0.08;
    
    // Default color set to [0, 0, 0] so it falls back to preset mode colors unless updated
    this.color = [0.0, 0.0, 0.0];

    this.pipeline = null;
    this.bindGroup = null;
    this.modelBuffer = null;
    this.vertexBuffer = null;
    this.indexBuffer = null;
    this.indexCount = 0;

    this.maxInstances = 1;
    // Updated float count to align with 28 floats (112 bytes) per instance struct
    this.floatsPerInstance = 28;
    this.instanceData = new Float32Array(this.maxInstances * this.floatsPerInstance);
    this._baseModelMatrix = mat4.create();

    this._initPipeline();

    this.renderCount = 0;
  }

  _initPipeline() {
    const device = this.device;
    if(SacredGeometryEffect._pipelineCache.has(device)) {
      const cached = SacredGeometryEffect._pipelineCache.get(device);
      this.bindGroupLayout = cached.bindGroupLayout;
      this.shaderModule = cached.shaderModule;
      this.pipelineLayout = cached.pipelineLayout;
      this.pipeline = cached.pipeline;
    } else {
      this.bindGroupLayout = device.createBindGroupLayout({
        label: 'sacred-geometry-layout',
        entries: [
          {
            binding: 0,
            visibility: GPUShaderStage.VERTEX,
            buffer: {type: 'uniform'},
          },
          {
            binding: 1,
            visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
            buffer: {type: 'read-only-storage'},
          },
        ],
      });

      this.shaderModule = device.createShaderModule({
        label: 'sacred-geometry-shader',
        code: sacredGeometryShader,
      });

      this.pipelineLayout = device.createPipelineLayout({
        bindGroupLayouts: [this.bindGroupLayout],
      });

      this.pipeline = device.createRenderPipeline({
        label: 'sacred-geometry-pipeline',
        layout: this.pipelineLayout,
        vertex: {
          module: this.shaderModule,
          entryPoint: 'vsMain',
          buffers: [
            {
              arrayStride: 32,
              attributes: [
                {shaderLocation: 0, offset: 0, format: 'float32x3'},
                {shaderLocation: 1, offset: 12, format: 'float32x3'},
                {shaderLocation: 2, offset: 24, format: 'float32x2'},
              ],
            },
          ],
        },
        fragment: {
          module: this.shaderModule,
          entryPoint: 'fsMain',
          targets: [
            {
              format: this.format,
              blend: {
                color: {srcFactor: 'src-alpha', dstFactor: 'one', operation: 'add'},
                alpha: {srcFactor: 'one', dstFactor: 'one-minus-src-alpha', operation: 'add'},
              },
            },
            {format: 'rgba16float'},
            {format: 'rgba16float'},
          ],
        },
        primitive: {
          topology: 'triangle-list',
          cullMode: 'none',
        },
        depthStencil: {
          format: 'depth24plus',
          depthWriteEnabled: false,
          depthCompare: 'less',
        },
      });

      SacredGeometryEffect._pipelineCache.set(device, {
        bindGroupLayout: this.bindGroupLayout,
        shaderModule: this.shaderModule,
        pipelineLayout: this.pipelineLayout,
        pipeline: this.pipeline
      });
    }

    const vertexData = new Float32Array([
      -2, -2, 0, 0, 0, 1, 0, 0,
      2, -2, 0, 0, 0, 1, 1, 0,
      2, 2, 0, 0, 0, 1, 1, 1,
      -2, 2, 0, 0, 0, 1, 0, 1,
    ]);

    const indexData = new Uint32Array([0, 1, 2, 0, 2, 3]);

    this.vertexBuffer = device.createBuffer({
      label: 'sacred-geometry-vertex',
      size: vertexData.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
      mappedAtCreation: true,
    });
    new Float32Array(this.vertexBuffer.getMappedRange()).set(vertexData);
    this.vertexBuffer.unmap();

    this.indexBuffer = device.createBuffer({
      label: 'sacred-geometry-index',
      size: indexData.byteLength,
      usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
      mappedAtCreation: true,
    });
    new Uint32Array(this.indexBuffer.getMappedRange()).set(indexData);
    this.indexBuffer.unmap();
    this.indexCount = indexData.length;

    this.modelBuffer = device.createBuffer({
      label: 'sacred-geometry-model-buffer',
      size: this.maxInstances * this.floatsPerInstance * 4,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
      mappedAtCreation: false,
    });

    this.bindGroup = device.createBindGroup({
      label: 'sacred-geometry-bindgroup',
      layout: this.bindGroupLayout,
      entries: [
        {binding: 0, resource: {buffer: this.cameraBuffer}},
        {binding: 1, resource: {buffer: this.modelBuffer}}
      ]
    });
    setTimeout(() => {dispatchEvent(new CustomEvent('update-effects', {}))}, 200);
  }

  updateInstanceData(baseModelMatrix) {
    mat4.copy(baseModelMatrix, this._baseModelMatrix);
  }

  render(pass, mesh, viewProjMatrix, dt = 0.016) {
    if(!this.enabled) return;
    this.time += dt;
    this.renderCount++;
    if(this.renderCount % 60 === 0) {
      console.log(`%c[render] Frame ${this.renderCount}, time: ${this.time.toFixed(2)}s`, 'color: orange;');
    }
    const offset = 0;
    const floatView = this.instanceData;
    
    // Mat4 (16 floats): 0..15
    floatView.set(this._baseModelMatrix, offset);
    
    // Uniforms vec4 (4 floats): 16..19
    floatView[offset + 16] = this.time;
    floatView[offset + 17] = this.currentMode;
    floatView[offset + 18] = this.pulseSpeed;
    floatView[offset + 19] = this.glowIntensity;
    
    // customColor vec4 (4 floats): 20..23
    floatView[offset + 20] = this.color[0];
    floatView[offset + 21] = this.color[1];
    floatView[offset + 22] = this.color[2];
    floatView[offset + 23] = 1.0; // Extra alpha / unused padding slot
    
    // lineWidth & padding (4 floats): 24..27
    floatView[offset + 24] = this.lineWidth;
    floatView[offset + 25] = 0.0;
    floatView[offset + 26] = 0.0;
    floatView[offset + 27] = 0.0;

    this.device.queue.writeBuffer(this.cameraBuffer, 0, viewProjMatrix);
    this.device.queue.writeBuffer(this.modelBuffer, 0, this.instanceData, 0, this.floatsPerInstance);
    pass.setBindGroup(0, this.bindGroup);
    pass.setVertexBuffer(0, this.vertexBuffer);
    pass.setIndexBuffer(this.indexBuffer, 'uint32');
    pass.drawIndexed(this.indexCount, 1);
  }

  setColor(r, g, b) {
    if (Array.isArray(r)) {
      this.color = [r[0], r[1], r[2]];
    } else {
      this.color = [r, g, b];
    }
  }

  resetColor() {
    this.color = [0.0, 0.0, 0.0];
  }

  setShape(mode) {
    if(typeof mode === 'string') {
      mode = this.SHAPE_MODES[mode.toUpperCase()] ?? this.SHAPE_MODES.PENTAGRAM;
    }
    this.currentMode = mode;
    console.log(`%c[SacredGeometryEffect] Shape: ${Object.keys(this.SHAPE_MODES).find(k => this.SHAPE_MODES[k] === mode)}`, 'color: yellow;');
  }

  setPulseSpeed(speed) {this.pulseSpeed = speed;}
  setGlowIntensity(intensity) {this.glowIntensity = intensity;}
  setLineWidth(width) {this.lineWidth = width;}
  setIntensity(v) {this.intensity = v;}

  destroy() {
    if(this.modelBuffer) this.modelBuffer.destroy();
    if(this.vertexBuffer) this.vertexBuffer.destroy();
    if(this.indexBuffer) this.indexBuffer.destroy();
  }
}