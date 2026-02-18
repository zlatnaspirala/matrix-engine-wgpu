import {mat4} from "wgpu-matrix";
import {hpBarEffectShaders} from "../../shaders/energy-bars/energy-bar-shader.js";

export class MANABarEffect {
  constructor(device, format) {
    this.device = device;
    this.format = format;

    this.progress = 1.0;
    this.color = [0.1, 0.1, 0.9, 1.0];
    this.offsetY = 45;
    this.enabled = true;

    this._initPipeline();
  }

  _initPipeline() {
    // Simple flat bar (width 100, height 10)
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

    // Buffers
    this.vertexBuffer = this.device.createBuffer({
      size: vertexData.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
    });
    this.device.queue.writeBuffer(this.vertexBuffer, 0, vertexData);

    this.uvBuffer = this.device.createBuffer({
      size: uvData.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
    });
    this.device.queue.writeBuffer(this.uvBuffer, 0, uvData);

    this.indexBuffer = this.device.createBuffer({
      size: Math.ceil(indexData.byteLength / 4) * 4,
      usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST
    });
    this.device.queue.writeBuffer(this.indexBuffer, 0, indexData);
    this.indexCount = indexData.length;

    // Uniforms
    this.cameraBuffer = this.device.createBuffer({
      size: 64,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });

    // model + color + progress (64 + 16 + 4)
    this.modelBuffer = this.device.createBuffer({
      size: 64 + 16 + 16,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });

    // BindGroup
    const bindGroupLayout = this.device.createBindGroupLayout({
      entries: [
        {binding: 0, visibility: GPUShaderStage.VERTEX, buffer: {}},
        {binding: 1, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: {}}
      ]
    });

    this.bindGroup = this.device.createBindGroup({
      layout: bindGroupLayout,
      entries: [
        {binding: 0, resource: {buffer: this.cameraBuffer}},
        {binding: 1, resource: {buffer: this.modelBuffer}}
      ]
    });

    // Pipeline
    const shaderModule = this.device.createShaderModule({code: hpBarEffectShaders});
    const pipelineLayout = this.device.createPipelineLayout({bindGroupLayouts: [bindGroupLayout]});

    this.pipeline = this.device.createRenderPipeline({
      label: 'mana Pipeline',
      layout: pipelineLayout,
      vertex: {
        module: shaderModule,
        entryPoint: 'vsMain',
        buffers: [
          {arrayStride: 3 * 4, attributes: [{shaderLocation: 0, offset: 0, format: 'float32x3'}]},
          {arrayStride: 2 * 4, attributes: [{shaderLocation: 1, offset: 0, format: 'float32x2'}]}
        ]
      },
      fragment: {
        module: shaderModule,
        entryPoint: 'fsMain',
        targets: [{format: this.format}]
      },
      primitive: {topology: 'triangle-list'},
      depthStencil: {depthWriteEnabled: false, depthCompare: 'always', format: 'depth24plus'}
    });
  }

  setProgress(value) {
    this.progress = Math.max(0.0, Math.min(1.0, value));
  }

  setColor(r, g, b, a = 1.0) {
    this.color = [r, g, b, a];
  }

  draw(pass, cameraMatrix, modelMatrix) {
    const color = new Float32Array(this.color);
    const progressData = new Float32Array([this.progress]);

    // Pack uniforms manually
    const buffer = new ArrayBuffer(64 + 16 + 4);
    const f32 = new Float32Array(buffer);
    f32.set(cameraMatrix, 0); // not needed here
    this.device.queue.writeBuffer(this.cameraBuffer, 0, cameraMatrix);
    this.device.queue.writeBuffer(this.modelBuffer, 0, modelMatrix);
    this.device.queue.writeBuffer(this.modelBuffer, 64, color);
    this.device.queue.writeBuffer(this.modelBuffer, 64 + 16, progressData);

    pass.setPipeline(this.pipeline);
    pass.setBindGroup(0, this.bindGroup);
    pass.setVertexBuffer(0, this.vertexBuffer);
    pass.setVertexBuffer(1, this.uvBuffer);
    pass.setIndexBuffer(this.indexBuffer, 'uint16');
    pass.drawIndexed(this.indexCount);
  }

  render(pass, mesh, viewProjMatrix, ) {
    const pos = mesh.position;
    const modelMatrix = mat4.identity();
    mat4.translate(modelMatrix, [pos.x, pos.y + this.offsetY, pos.z], modelMatrix);
    this.draw(pass, viewProjMatrix, modelMatrix);
  }
}