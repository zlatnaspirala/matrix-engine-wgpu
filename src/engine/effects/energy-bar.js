import {mat4} from "wgpu-matrix";
import {hpBarEffectShaders} from "../../shaders/energy-bars/energy-bar-shader.js";

export class HPBarEffect {
  static _pipelineCache = new WeakMap();
  constructor(device, format, cameraBuffer, barWidth = 20, barHeight = 1.5) {
    this.device = device;
    this.format = format;
    this.cameraBuffer = cameraBuffer;
    this.progress = 1.0;
    this.color = [0.1, 0.9, 0.1, 1.0];
    this.offsetY = 48;
    this.enabled = true;
    this._colorDirty = true;
    this._progressDirty = true;
    this._modelMatrix = new Float32Array(16);
    this._colorScratch = new Float32Array(4);
    this._progressScratch = new Float32Array(1);
    this._translateVec = new Float32Array(3);
    this._initPipeline(barWidth, barHeight);
  }

  _initPipeline(barWidth, barHeight) {
    const device = this.device;
    const W = barWidth;
    const H = barHeight;

    // ========== CACHE CHECK ==========
    if(HPBarEffect._pipelineCache.has(device)) {
      const cached = HPBarEffect._pipelineCache.get(device);
      this.pipeline = cached.pipeline;
      this.bindGroupLayout = cached.bindGroupLayout;
      this.pipelineLayout = cached.pipelineLayout;
      this.shaderModule = cached.shaderModule;
    } else {
      // ========== BUILD PIPELINE ONCE ==========
      this.bindGroupLayout = device.createBindGroupLayout({
        label: 'energy-bar bindGroupLayout',
        entries: [
          {binding: 0, visibility: GPUShaderStage.VERTEX, buffer: {type: 'uniform'}},
          {binding: 1, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: {type: 'uniform'}}
        ]
      });

      this.shaderModule = device.createShaderModule({code: hpBarEffectShaders});
      this.pipelineLayout = device.createPipelineLayout({bindGroupLayouts: [this.bindGroupLayout]});

      this.pipeline = device.createRenderPipeline({
        label: 'energy-bar pipeline',
        layout: this.pipelineLayout,
        vertex: {
          module: this.shaderModule,
          entryPoint: 'vsMain',
          buffers: [
            {arrayStride: 12, attributes: [{shaderLocation: 0, offset: 0, format: 'float32x3'}]},
            {arrayStride: 8, attributes: [{shaderLocation: 1, offset: 0, format: 'float32x2'}]}
          ]
        },
        fragment: {
          module: this.shaderModule,
          entryPoint: 'fsMain',
          targets: [{format: 'rgba16float'}, {format: 'rgba16float'}, {format: 'rgba16float'}]
        },
        primitive: {topology: 'triangle-list'},
        depthStencil: {depthWriteEnabled: false, depthCompare: 'always', format: 'depth24plus'}
      });

      HPBarEffect._pipelineCache.set(device, {
        pipeline: this.pipeline,
        bindGroupLayout: this.bindGroupLayout,
        pipelineLayout: this.pipelineLayout,
        shaderModule: this.shaderModule
      });
    }

    const vertexData = new Float32Array([
      -W, H, 0.0,
      W, H, 0.0,
      -W, -H, 0.0,
      W, -H, 0.0,
    ]);
    const uvData = new Float32Array([0, 1, 1, 1, 0, 0, 1, 0]);
    const indexData = new Uint16Array([0, 2, 1, 1, 2, 3]);

    this.vertexBuffer = device.createBuffer({
      size: vertexData.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
      mappedAtCreation: true,
    });
    new Float32Array(this.vertexBuffer.getMappedRange()).set(vertexData);
    this.vertexBuffer.unmap();

    this.uvBuffer = device.createBuffer({
      size: uvData.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
      mappedAtCreation: true,
    });
    new Float32Array(this.uvBuffer.getMappedRange()).set(uvData);
    this.uvBuffer.unmap();

    this.indexBuffer = device.createBuffer({
      size: 12,
      usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
      mappedAtCreation: true,
    });
    new Uint16Array(this.indexBuffer.getMappedRange()).set(indexData);
    this.indexBuffer.unmap();

    this.indexCount = 6;

    this.modelBuffer = device.createBuffer({
      size: 96,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });

    this.bindGroup = device.createBindGroup({
      label: 'energy-bar bindGroup',
      layout: this.bindGroupLayout,
      entries: [
        {binding: 0, resource: {buffer: this.cameraBuffer}},
        {binding: 1, resource: {buffer: this.modelBuffer}}
      ]
    });
  }

  setProgress(value) {
    // Clamp without Math calls - micro-optimization
    const clamped = value < 0.0 ? 0.0 : (value > 1.0 ? 1.0 : value);
    if(this.progress !== clamped) {
      this.progress = clamped;
      this._progressDirty = true;
    }
  }

  setColor(r, g, b, a = 1.0) {
    if(this.color[0] !== r || this.color[1] !== g || this.color[2] !== b || this.color[3] !== a) {
      this.color[0] = r;
      this.color[1] = g;
      this.color[2] = b;
      this.color[3] = a;
      this._colorDirty = true;
    }
  }

  draw(pass, cameraMatrix, modelMatrix) {
    this.device.queue.writeBuffer(this.cameraBuffer, 0, cameraMatrix);
    this.device.queue.writeBuffer(this.modelBuffer, 0, modelMatrix);
    if(this._colorDirty) {
      this._colorScratch[0] = this.color[0];
      this._colorScratch[1] = this.color[1];
      this._colorScratch[2] = this.color[2];
      this._colorScratch[3] = this.color[3];
      this.device.queue.writeBuffer(this.modelBuffer, 64, this._colorScratch);
      this._colorDirty = false;
    }
    if(this._progressDirty) {
      this._progressScratch[0] = this.progress;
      this.device.queue.writeBuffer(this.modelBuffer, 80, this._progressScratch);
      this._progressDirty = false;
    }
    pass.setBindGroup(0, this.bindGroup);
    pass.setVertexBuffer(0, this.vertexBuffer);
    pass.setVertexBuffer(1, this.uvBuffer);
    pass.setIndexBuffer(this.indexBuffer, 'uint16');
    pass.drawIndexed(this.indexCount);
  }

  render(pass, mesh, viewProjMatrix) {
    const pos = mesh.position;
    this._translateVec[0] = pos.x;
    this._translateVec[1] = pos.y + this.offsetY;
    this._translateVec[2] = pos.z;
    mat4.identity(this._modelMatrix);
    mat4.translate(this._modelMatrix, this._translateVec, this._modelMatrix);
    this.draw(pass, viewProjMatrix, this._modelMatrix);
  }
}