import {mat4} from "wgpu-matrix";

/**
 * Gaussian Splat PLY Loader & Renderer
 * Integrated with engine effect system (cameraBuffer pattern)
 */

export class GaussianSplatLayer {
  constructor(device, format, cameraBuffer) {
    this.device = device;
    this.format = format;
    this.cameraBuffer = cameraBuffer;  // Use engine's camera buffer
    this.queue = device.queue;

    // Splat data
    this.splatData = null;
    this.vertexCount = 0;
    this.aabbMin = [Infinity, Infinity, Infinity];
    this.aabbMax = [-Infinity, -Infinity, -Infinity];

    // GPU resources
    this.vertexBuffer = null;
    this.indexBuffer = null;
    this.vertexBufferLayout = null;
    this.bindGroup = null;
    this.renderPipeline = null;
    this.indexCount = 0;

    // Settings
    this.splatScale = 2.0;
    this.depthTest = true;
  }

  async loadPLY(source) {
    try {
      let arrayBuffer;
      if(typeof source === 'string') {
        const response = await fetch(source);
        if(!response.ok) throw new Error(`HTTP ${response.status}`);
        arrayBuffer = await response.arrayBuffer();
      } else if(source instanceof File) {
        arrayBuffer = await source.arrayBuffer();
      } else {
        throw new Error('Source must be URL string or File object');
      }

      this.splatData = this._parsePLY(arrayBuffer);
      this.vertexCount = this.splatData.positions.length / 3;
      console.log(`✓ Loaded splat: ${this.vertexCount} points, AABB: [${this.aabbMin}] → [${this.aabbMax}]`);
      await this._initializeGPU();
      return this;
    } catch(err) {
      console.error('Splat load error:', err);
      throw err;
    }
  }

  _parsePLY(arrayBuffer) {
    const view = new DataView(arrayBuffer);
    const uint8 = new Uint8Array(arrayBuffer);

    let headerEnd = 0;
    const headerStr = new TextDecoder().decode(uint8.slice(0, 2048));
    const lines = headerStr.split('\n');

    let vertexCount = 0;
    const properties = [];

    for(let i = 0;i < lines.length;i++) {
      const line = lines[i].trim();
      headerEnd += line.length + 1;

      if(line.startsWith('element vertex')) {
        vertexCount = parseInt(line.split(' ')[2]);
      } else if(line.startsWith('property')) {
        const parts = line.split(' ');
        properties.push({type: parts[1], name: parts[2]});
      } else if(line === 'end_header') {
        break;
      }
    }

    const stride = this._calculateStride(properties);
    const offsets = this._getPropertyOffsets(properties);
    const dataStart = headerEnd;

    const positions = new Float32Array(vertexCount * 3);
    const splatColors = new Float32Array(vertexCount * 4);
    const scales = new Float32Array(vertexCount * 3);
    const rotations = new Float32Array(vertexCount * 4);
    const opacities = new Uint8Array(vertexCount);

    for(let i = 0;i < vertexCount;i++) {
      const offset = dataStart + i * stride;

      const x = view.getFloat32(offset + offsets.x, true);
      const y = view.getFloat32(offset + offsets.y, true);
      const z = view.getFloat32(offset + offsets.z, true);

      positions[i * 3 + 0] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      this.aabbMin[0] = Math.min(this.aabbMin[0], x);
      this.aabbMin[1] = Math.min(this.aabbMin[1], y);
      this.aabbMin[2] = Math.min(this.aabbMin[2], z);
      this.aabbMax[0] = Math.max(this.aabbMax[0], x);
      this.aabbMax[1] = Math.max(this.aabbMax[1], y);
      this.aabbMax[2] = Math.max(this.aabbMax[2], z);

      const r = this._sigmoid(view.getFloat32(offset + offsets.f_dc_0, true));
      const g = this._sigmoid(view.getFloat32(offset + offsets.f_dc_1, true));
      const b = this._sigmoid(view.getFloat32(offset + offsets.f_dc_2, true));

      splatColors[i * 4 + 0] = r;
      splatColors[i * 4 + 1] = g;
      splatColors[i * 4 + 2] = b;
      splatColors[i * 4 + 3] = 1.0;

      const scale_0 = Math.exp(view.getFloat32(offset + offsets.scale_0, true));
      const scale_1 = Math.exp(view.getFloat32(offset + offsets.scale_1, true));
      const scale_2 = Math.exp(view.getFloat32(offset + offsets.scale_2, true));

      scales[i * 3 + 0] = scale_0;
      scales[i * 3 + 1] = scale_1;
      scales[i * 3 + 2] = scale_2;

      const rot_0 = view.getFloat32(offset + offsets.rot_0, true);
      const rot_1 = view.getFloat32(offset + offsets.rot_1, true);
      const rot_2 = view.getFloat32(offset + offsets.rot_2, true);
      const rot_3 = view.getFloat32(offset + offsets.rot_3, true);

      rotations[i * 4 + 0] = rot_0;
      rotations[i * 4 + 1] = rot_1;
      rotations[i * 4 + 2] = rot_2;
      rotations[i * 4 + 3] = rot_3;

      opacities[i] = view.getUint8(offset + offsets.opacity);
    }

    return {
      vertexCount,
      positions,
      splatColors,
      scales,
      rotations,
      opacities,
      properties
    };
  }

  _calculateStride(properties) {
    let stride = 0;
    for(const prop of properties) {
      if(prop.type === 'float') stride += 4;
      else if(prop.type === 'uchar') stride += 1;
      else if(prop.type === 'double') stride += 8;
    }
    return stride;
  }

  _getPropertyOffsets(properties) {
    const offsets = {};
    let current = 0;

    for(const prop of properties) {
      offsets[prop.name] = current;
      if(prop.type === 'float') current += 4;
      else if(prop.type === 'uchar') current += 1;
      else if(prop.type === 'double') current += 8;
    }

    return offsets;
  }

  _sigmoid(x) {
    return 1.0 / (1.0 + Math.exp(-x));
  }

  async _initializeGPU() {
    // Vertex buffer: interleaved position + color + scale + rotation
    const vertexData = new Float32Array(this.vertexCount * 14);

    for(let i = 0;i < this.vertexCount;i++) {
      let idx = i * 14;
      vertexData[idx++] = this.splatData.positions[i * 3 + 0];
      vertexData[idx++] = this.splatData.positions[i * 3 + 1];
      vertexData[idx++] = this.splatData.positions[i * 3 + 2];
      vertexData[idx++] = this.splatData.splatColors[i * 4 + 0];
      vertexData[idx++] = this.splatData.splatColors[i * 4 + 1];
      vertexData[idx++] = this.splatData.splatColors[i * 4 + 2];
      vertexData[idx++] = this.splatData.opacities[i] / 255.0;
      vertexData[idx++] = this.splatData.scales[i * 3 + 0];
      vertexData[idx++] = this.splatData.scales[i * 3 + 1];
      vertexData[idx++] = this.splatData.scales[i * 3 + 2];
      vertexData[idx++] = this.splatData.rotations[i * 4 + 0];
      vertexData[idx++] = this.splatData.rotations[i * 4 + 1];
      vertexData[idx++] = this.splatData.rotations[i * 4 + 2];
      vertexData[idx++] = this.splatData.rotations[i * 4 + 3];
    }

    this.vertexBuffer = this.device.createBuffer({
      label: 'Splat vertex buffer',
      size: vertexData.byteLength,
      mappedAtCreation: true,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    new Float32Array(this.vertexBuffer.getMappedRange()).set(vertexData);
    this.vertexBuffer.unmap();

    // Index buffer: quads (2 triangles per splat)
    const quadIndices = new Uint16Array(this.vertexCount * 6);
    let idx = 0;
    for(let i = 0;i < this.vertexCount;i++) {
      const base = i * 4;
      quadIndices[idx++] = base;
      quadIndices[idx++] = base + 1;
      quadIndices[idx++] = base + 2;
      quadIndices[idx++] = base + 1;
      quadIndices[idx++] = base + 3;
      quadIndices[idx++] = base + 2;
    }

    this.indexBuffer = this.device.createBuffer({
      label: 'Splat index buffer',
      size: quadIndices.byteLength,
      mappedAtCreation: true,
      usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
    });
    new Uint16Array(this.indexBuffer.getMappedRange()).set(quadIndices);
    this.indexBuffer.unmap();
    this.indexCount = quadIndices.length;

    // Vertex buffer layout
    this.vertexBufferLayout = [
      {
        arrayStride: 56,
        attributes: [
          {shaderLocation: 0, offset: 0, format: 'float32x3'},    // position
          {shaderLocation: 1, offset: 12, format: 'float32x4'},   // color + opacity
          {shaderLocation: 2, offset: 28, format: 'float32x3'},   // scale
          {shaderLocation: 3, offset: 40, format: 'float32x4'}    // rotation
        ]
      }
    ];

    console.log("splatScale =", this.splatScale);

    this.scaleBuffer = this.device.createBuffer({
      label: 'Splat scale buffer',
      size: 16,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
      mappedAtCreation: true,
    });
    new Float32Array(this.scaleBuffer.getMappedRange()).set([this.splatScale, 0, 0, 0]);
    this.scaleBuffer.unmap();

    this.modelBuffer = this.device.createBuffer({size: 112, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST});

    const bindGroupLayout = this.device.createBindGroupLayout({
      entries: [
        {binding: 0, visibility: GPUShaderStage.VERTEX, buffer: {type: 'uniform'}},  // camera
        {binding: 1, visibility: GPUShaderStage.VERTEX, buffer: {type: 'uniform'}},  // model
        {binding: 2, visibility: GPUShaderStage.VERTEX, buffer: {type: 'uniform'}}   // scale
      ]
    });

    this.bindGroup = this.device.createBindGroup({
      layout: bindGroupLayout,
      entries: [
        {binding: 0, resource: {buffer: this.cameraBuffer}},
        {binding: 1, resource: {buffer: this.modelBuffer}},
        {binding: 2, resource: {buffer: this.scaleBuffer}}
      ]
    });

    const pipelineLayout = this.device.createPipelineLayout({
      bindGroupLayouts: [bindGroupLayout]
    });

    const shaderCode = this._getRenderShaderCode();
    const shaderModule = this.device.createShaderModule({
      label: 'Splat shader',
      code: shaderCode
    });

    this.renderPipeline = this.device.createRenderPipeline({
      label: 'Splat render pipeline',
      layout: pipelineLayout,
      vertex: {
        module: shaderModule,
        entryPoint: 'vs_main',
        buffers: this.vertexBufferLayout
      },
      fragment: {
        module: shaderModule,
        entryPoint: 'fs_main',
        targets: [
          {
            format: this.format,
            blend: {
              color: {
                srcFactor: 'src-alpha',
                dstFactor: 'one-minus-src-alpha',
                operation: 'add'
              },
              alpha: {
                srcFactor: 'one',
                dstFactor: 'one-minus-src-alpha',
                operation: 'add'
              }
            }
          },
          {format: 'rgba16float'},
          {format: 'rgba16float'}
        ]
      },
      primitive: {
        // topology: 'triangle-list',
        topology: 'point-list',
        cullMode: 'none'
      },
      depthStencil: {
        format: 'depth24plus',
        depthWriteEnabled: false,
        depthCompare: 'less'
      }
    });
  }

  _getRenderShaderCode() {
    return `
struct Camera {
  mvp: mat4x4<f32>
};

struct Model {
  matrix: mat4x4<f32>,
};

struct Scale {
  factor: f32,
  pad0: f32,
  pad1: f32,
  pad2: f32,
};

@group(0) @binding(0) var<uniform> camera: Camera;
@group(0) @binding(1) var<uniform> model: Model;
@group(0) @binding(2) var<uniform> scale: Scale;

struct VertexInput {
  @location(0) position: vec3<f32>,
  @location(1) colorOpacity: vec4<f32>,
  @location(2) scale: vec3<f32>,
  @location(3) rotation: vec4<f32>,
};

struct VertexOutput {
  @builtin(position) clipPos: vec4<f32>,
  @location(0) color: vec3<f32>,
  @location(1) opacity: f32,
  @location(2) worldPos: vec3<f32>,
};

struct FragOut {
  @location(0) color: vec4<f32>,
  @location(1) normal: vec4<f32>,
  @location(2) worldPos: vec4<f32>,
};

@vertex
fn vs_main(in: VertexInput) -> VertexOutput {
  var out: VertexOutput;
  let scaledPos = in.position * scale.factor;
  let worldPos = model.matrix * vec4<f32>(scaledPos, 1.0);
  let clipPos = camera.mvp * worldPos;
  out.clipPos = clipPos;
  out.color = in.colorOpacity.rgb;
  out.opacity = in.colorOpacity.a;
  out.worldPos = worldPos.xyz;
  return out;
}

@fragment
fn fs_main(in: VertexOutput) -> FragOut {
  var out: FragOut;
  out.color = vec4<f32>(in.color, in.opacity);
  out.normal = vec4<f32>(0.0, 0.0, 1.0, 1.0);
  out.worldPos = vec4<f32>(in.worldPos, 1.0);
  return out;
}`;
  }

  render(pass, mesh, viewProjMatrix) {
    this.device.queue.writeBuffer(this.modelBuffer, 0, mesh.modelMatrix);
    this.device.queue.writeBuffer(this.cameraBuffer, 0, viewProjMatrix);
    const scaleData = new Float32Array([this.splatScale, 0, 0, 0]);
    this.device.queue.writeBuffer(this.scaleBuffer, 0, scaleData);
    pass.setPipeline(this.renderPipeline);
    pass.setBindGroup(0, this.bindGroup);
    pass.setVertexBuffer(0, this.vertexBuffer);
    pass.draw(this.vertexCount, 1, 0, 0);
  }

  setScale(scale) {this.splatScale = scale}
  getAABB() {return {min: this.aabbMin, max: this.aabbMax}}

  destroy() {
    this.vertexBuffer?.destroy();
    this.indexBuffer?.destroy();
  }
}

/**
 * Multi-splat scene manager
 */
export class GaussianSplatScene {
  constructor(device, format, cameraBuffer) {
    this.device = device;
    this.format = format;
    this.cameraBuffer = cameraBuffer;
    this.splatLayers = [];
  }

  updateInstanceData(baseModelMatrix) {

  }

  async initialize(plyPath, scale = 1) {
    const splatLayer = new GaussianSplatLayer(this.device, this.format, this.cameraBuffer);
    try {
      if(scale) splatLayer.setScale(scale);
      await splatLayer.loadPLY(plyPath);

      this.splatLayers.push(splatLayer);
      console.log('✓ Splat scene initialized');
    } catch(err) {
      console.error('Failed to load splat:', err);
    }
  }

  async addSplat(source, options = {}) {
    const splatLayer = new GaussianSplatLayer(this.device, this.format, this.cameraBuffer);
    await splatLayer.loadPLY(source);
    if(options.scale) splatLayer.setScale(options.scale);
    if(options.depthTest !== undefined) splatLayer.depthTest = options.depthTest;
    this.splatLayers.push(splatLayer);
    return splatLayer;
  }

  render(pass, mesh, viewProjMatrix) {
    for(const splat of this.splatLayers) {
      splat.render(pass, mesh, viewProjMatrix);
    }
  }

  destroy() {
    for(const splat of this.splatLayers) {
      splat.destroy();
    }
    this.splatLayers = [];
  }
}