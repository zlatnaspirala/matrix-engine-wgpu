import {mat4} from "wgpu-matrix";
import {pointerEffect} from "../../shaders/standalone/pointer.effect.js";

export class PointerEffect {
  constructor(device, format) {
    this.device = device;
    this.format = format;

    // fiktive 
    this.enabled = true;
    this._initPipeline();
  }

  _initPipeline() {
    // Vertex data: simple quad
    let S = 10;
    const vertexData = new Float32Array([
      -0.5 * S, 0.5 * S, 0.0 * S,  // top-left
      0.5 * S, 0.5 * S, 0.0 * S,  // top-right
      -0.1 * S, -0.1 * S, 0.0 * S,  // bottom-left
      0.1 * S, -0.1 * S, 0.0 * S,  // bottom-right
    ]);

    const uvData = new Float32Array([
      0, 0, 1, 0, 0, 1, 1, 1
    ]);

    const indexData = new Uint16Array([
      0, 2, 1,
      1, 2, 3
    ]);

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

    this.cameraBuffer = this.device.createBuffer({
      size: 64,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });
    this.modelBuffer = this.device.createBuffer({
      size: 64,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });

    const bindGroupLayout = this.device.createBindGroupLayout({
      entries: [
        {binding: 0, visibility: GPUShaderStage.VERTEX, buffer: {}},
        {binding: 1, visibility: GPUShaderStage.VERTEX, buffer: {}},
      ]
    });

    this.bindGroup = this.device.createBindGroup({
      layout: bindGroupLayout,
      entries: [
        {binding: 0, resource: {buffer: this.cameraBuffer}},
        {binding: 1, resource: {buffer: this.modelBuffer}},
      ]
    });

    const shaderModule = this.device.createShaderModule({code: pointerEffect});

    const pipelineLayout = this.device.createPipelineLayout({bindGroupLayouts: [bindGroupLayout]});
    this.pipeline = this.device.createRenderPipeline({
      label: 'pointEffect Pipeline',
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
      depthStencil: {depthWriteEnabled: true, depthCompare: 'always', format: 'depth24plus'}
    });
  }

  draw(pass, cameraMatrix, modelMatrix) {
    this.device.queue.writeBuffer(this.cameraBuffer, 0, cameraMatrix);
    this.device.queue.writeBuffer(this.modelBuffer, 0, modelMatrix);
    pass.setPipeline(this.pipeline);
    pass.setBindGroup(0, this.bindGroup);
    pass.setVertexBuffer(0, this.vertexBuffer);
    pass.setVertexBuffer(1, this.uvBuffer);
    pass.setIndexBuffer(this.indexBuffer, 'uint16');
    pass.drawIndexed(this.indexCount);
  }

  render(transPass, mesh, viewProjMatrix) {
      const objPos = mesh.position;
      const modelMatrix = mat4.identity();
      mat4.translate(modelMatrix, [objPos.x, objPos.y + 60, objPos.z], modelMatrix);
      this.draw(transPass, viewProjMatrix, modelMatrix);
  }
}