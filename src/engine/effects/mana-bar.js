import {mat4} from "wgpu-matrix";
import {hpBarEffectShaders} from "../../shaders/energy-bars/energy-bar-shader.js";

export class MANABarEffect {
  static _pipelineCache = new WeakMap();
  constructor(device, format, cameraBuffer) {
    this.device = device;
    this.format = format;
    this.cameraBuffer = cameraBuffer;
    this.progress = 1.0;
    this.color = [0.1, 0.1, 0.9, 1.0];
    this.offsetY = 45;
    this.enabled = true;
    this._modelMatrix = new Float32Array(16);
    this._colorScratch = new Float32Array(4);
    this._progressScratch = new Float32Array(1);
    this._translateVec = new Float32Array(3);
    this._initPipeline();
  }

  _initPipeline() {
    const device = this.device;

    // ========== CACHE CHECK ==========
    if(MANABarEffect._pipelineCache.has(device)) {
      const cached = MANABarEffect._pipelineCache.get(device);
      this.bindGroupLayout = cached.bindGroupLayout;
      this.shaderModule = cached.shaderModule;
      this.pipelineLayout = cached.pipelineLayout;
      this.pipeline = cached.pipeline;
    } else {
      // ========== BUILD PIPELINE ONCE ==========
      this.bindGroupLayout = device.createBindGroupLayout({
        entries: [
          {binding: 0, visibility: GPUShaderStage.VERTEX, buffer: {}},
          {binding: 1, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: {}}
        ]
      });

      this.shaderModule = device.createShaderModule({code: hpBarEffectShaders});

      this.pipelineLayout = device.createPipelineLayout({bindGroupLayouts: [this.bindGroupLayout]});

      this.pipeline = device.createRenderPipeline({
        label: 'mana Pipeline',
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
          targets: [{format: this.format}, {format: 'rgba16float'}, {format: 'rgba16float'}]
        },
        primitive: {topology: 'triangle-list'},
        depthStencil: {depthWriteEnabled: false, depthCompare: 'always', format: 'depth24plus'}
      });

      // ========== CACHE THEM ==========
      MANABarEffect._pipelineCache.set(device, {
        bindGroupLayout: this.bindGroupLayout,
        shaderModule: this.shaderModule,
        pipelineLayout: this.pipelineLayout,
        pipeline: this.pipeline
      });
    }

    // ========== PER-INSTANCE BUFFERS (NOT CACHED) ==========
    const W = 40;
    const H = 3;

    const vertexData = new Float32Array([
      -0.5 * W, 0.5 * H, 0.0,
      0.5 * W, 0.5 * H, 0.0,
      -0.5 * W, -0.5 * H, 0.0,
      0.5 * W, -0.5 * H, 0.0,
    ]);

    const uvData = new Float32Array([
      0, 1,
      1, 1,
      0, 0,
      1, 0
    ]);

    const indexData = new Uint16Array([0, 2, 1, 1, 2, 3]);

    this.vertexBuffer = device.createBuffer({
      size: vertexData.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
    });
    device.queue.writeBuffer(this.vertexBuffer, 0, vertexData);

    this.uvBuffer = device.createBuffer({
      size: uvData.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
    });
    device.queue.writeBuffer(this.uvBuffer, 0, uvData);

    this.indexBuffer = device.createBuffer({
      size: Math.ceil(indexData.byteLength / 4) * 4,
      usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST
    });
    device.queue.writeBuffer(this.indexBuffer, 0, indexData);
    this.indexCount = indexData.length;

    this.modelBuffer = device.createBuffer({
      size: 64 + 16 + 16,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });

    this.bindGroup = device.createBindGroup({
      layout: this.bindGroupLayout,
      entries: [
        {binding: 0, resource: {buffer: this.cameraBuffer}},
        {binding: 1, resource: {buffer: this.modelBuffer}}
      ]
    });

     setTimeout(() => {dispatchEvent(new CustomEvent('update-effects', {})) }, 200)
  }

  setProgress(value) {
    this.progress = Math.max(0.0, Math.min(1.0, value));
  }

  setColor(r, g, b, a = 1.0) {
    this.color = [r, g, b, a];
  }

  draw(pass, cameraMatrix, modelMatrix) {
    this._colorScratch[0] = this.color[0];
    this._colorScratch[1] = this.color[1];
    this._colorScratch[2] = this.color[2];
    this._colorScratch[3] = this.color[3];
    this._progressScratch[0] = this.progress;

    this.device.queue.writeBuffer(this.cameraBuffer, 0, cameraMatrix);
    this.device.queue.writeBuffer(this.modelBuffer, 0, modelMatrix);
    this.device.queue.writeBuffer(this.modelBuffer, 64, this._colorScratch);
    this.device.queue.writeBuffer(this.modelBuffer, 80, this._progressScratch);

    pass.setPipeline(this.pipeline);
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