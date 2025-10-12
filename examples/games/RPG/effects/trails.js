import {mat4} from "wgpu-matrix";
import { trailVertex } from "../../../../src/shaders/standalone/trail.vertex.js"; 


export class TrailEffect {
  constructor(device, format) {
    this.device = device;
    this.format = format;
    this._initPipeline();
  }

  _initPipeline() {
    //------------------------
    // Vertex data: simple quad
    const vertexData = new Float32Array([
      -0.5, 0.5, 0.0,  // top-left
       0.5, 0.5, 0.0,  // top-right
      -0.5,-0.5, 0.0,  // bottom-left
       0.5,-0.5, 0.0,  // bottom-right
    ]);

    const uvData = new Float32Array([
      0,0, 1,0, 0,1, 1,1
    ]);

    const indexData = new Uint16Array([
      0,2,1,
      1,2,3
    ]);

    // GPU buffers
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

    // Uniforms: camera & model
    this.cameraBuffer = this.device.createBuffer({
      size: 64,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });
    this.modelBuffer = this.device.createBuffer({
      size: 64,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });

    // Bind group layout
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

    // Shader
    const shaderModule = this.device.createShaderModule({code: trailVertex});

    // Pipeline
    const pipelineLayout = this.device.createPipelineLayout({bindGroupLayouts: [bindGroupLayout]});
    this.pipeline = this.device.createRenderPipeline({
      layout: pipelineLayout,
      vertex: {
        module: shaderModule,
        entryPoint: 'vsMain',
        buffers: [
          {arrayStride: 3*4, attributes:[{shaderLocation:0,offset:0,format:'float32x3'}]},
          {arrayStride: 2*4, attributes:[{shaderLocation:1,offset:0,format:'float32x2'}]}
        ]
      },
      fragment: {
        module: shaderModule,
        entryPoint: 'fsMain',
        targets: [{format: this.format}]
      },
      primitive: {topology:'triangle-list'},
      depthStencil: {depthWriteEnabled:true, depthCompare:'always', format:'depth24plus'}
    });
  }

  draw(pass, cameraMatrix, modelMatrix) {
    // Write uniforms
    this.device.queue.writeBuffer(this.cameraBuffer, 0, cameraMatrix);
    this.device.queue.writeBuffer(this.modelBuffer, 0, modelMatrix);

    // Draw
    pass.setPipeline(this.pipeline);
    pass.setBindGroup(0, this.bindGroup);
    pass.setVertexBuffer(0, this.vertexBuffer);
    pass.setVertexBuffer(1, this.uvBuffer);
    pass.setIndexBuffer(this.indexBuffer, 'uint16');
    pass.drawIndexed(this.indexCount);
  }
}