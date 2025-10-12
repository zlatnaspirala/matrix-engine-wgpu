import {mat4} from "wgpu-matrix";
import {trailVertex} from "../../../../src/shaders/standalone/trail.vertex";
// bith vert and fragment

export class TrailEffect {
  constructor(device, format, mesh, useBlending = true) {
    this.device = device;
    this.format = format;
    this.mesh = mesh;
    this.useBlending = useBlending;
    this.maxGhosts = 1;
    this.ghosts = [];
    this.ghostSpawnInterval = 0.56;
    this.lastGhostTime = 0;
    this.fadeLength = 20.5;
    this._initPipeline();
  }

  async _initPipeline() {
    const shaderModule = this.device.createShaderModule({code: trailVertex});

    this.cameraBuffer = this.device.createBuffer({
      size: 64,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    this.modelBuffer = this.device.createBuffer({
      size: 64, // must be 256 bytes
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    this.trailParamsBuffer = this.device.createBuffer({
      size: 32,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    const bindGroupLayout = this.device.createBindGroupLayout({
      entries: [
        {binding: 0, visibility: GPUShaderStage.VERTEX, buffer: {}},
        {binding: 1, visibility: GPUShaderStage.VERTEX, buffer: {}},
        {binding: 2, visibility: GPUShaderStage.FRAGMENT | GPUShaderStage.VERTEX, buffer: {}},
      ]
    });

    this.bindGroup = this.device.createBindGroup({
      layout: bindGroupLayout,
      entries: [
        {binding: 0, resource: {buffer: this.cameraBuffer}},
        // {binding: 1, resource: {buffer: this.modelBuffer}},
        {binding: 1, resource: {buffer: this.mesh.modelUniformBuffer}},
        {binding: 2, resource: {buffer: this.trailParamsBuffer}},
      ]
    });

    const pipelineLayout = this.device.createPipelineLayout({bindGroupLayouts: [bindGroupLayout]});

    // const blend = {
    //   color: {srcFactor: 'one', dstFactor: 'one', operation: 'add'},
    //   alpha: {srcFactor: 'one', dstFactor: 'one', operation: 'add'},
    // };
    const blend = {
      color: {srcFactor: 'one', dstFactor: 'zero', operation: 'add'},
      alpha: {srcFactor: 'one', dstFactor: 'zero', operation: 'add'},
    };

    this.pipeline = this.device.createRenderPipeline({
      layout: pipelineLayout,
      vertex: {
        module: shaderModule,
        entryPoint: 'vsMain',
        buffers: [
          // vertex buffer 0 = positions
          {
            arrayStride: Float32Array.BYTES_PER_ELEMENT * 3,
            attributes: [
              {shaderLocation: 0, offset: 0, format: "float32x3"}, // position
            ]
          },
          // vertex buffer 1 = UVs
          {
            arrayStride: Float32Array.BYTES_PER_ELEMENT * 2,
            attributes: [
              {shaderLocation: 1, offset: 0, format: "float32x2"}, // uv
            ]
          }
        ]
      },
      fragment: {
        module: shaderModule,
        entryPoint: 'fsMain',
        targets: [{format: this.format, blend}]
      },
      primitive: {topology: 'triangle-list'},
      depthStencil: {depthWriteEnabled: true, depthCompare: 'always', format: 'depth24plus'},
    });
  }

  addGhost(modelMatrix, now) {
    if(this.ghosts.length > 0 && now - this.lastGhostTime < this.ghostSpawnInterval) return;
    this.lastGhostTime = now;
    if(this.ghosts.length >= this.maxGhosts) this.ghosts.shift();
    this.ghosts.push({modelMatrix: new Float32Array(modelMatrix), spawnTime: now});
  }

  draw(pass, cameraMatrix, now) {

    this.device.queue.writeBuffer(this.cameraBuffer, 0, cameraMatrix);

    pass.setPipeline(this.pipeline);

    pass.setVertexBuffer(0, this.mesh.vertexBuffer);
    pass.setVertexBuffer(1, this.mesh.vertexTexCoordsBuffer);

        pass.setBindGroup(0, this.bindGroup);
    pass.setIndexBuffer(this.mesh.indexBuffer, 'uint16');
    // for(const ghost of this.ghosts){
    // pad matrix to 256 bytes
    // const paddedMatrix = new Float32Array(64);
    // paddedMatrix.set(ghost.modelMatrix);
    //  mat4.transpose(paddedMatrix, paddedMatrix);
    // this.device.queue.writeBuffer(this.modelBuffer, 0, paddedMatrix);
    // update trail params
    // const trailData = new Float32Array([0, 0, 0, 0, this.fadeLength, performance.now() / 1000, performance.now() / 122, 0]);


    const trailData = new Float32Array([
      0, 0, 0, 0,      // padding
      110.0,         // fadeLength
      now,          // now
      now*2,
      0
    ]);

    this.device.queue.writeBuffer(this.trailParamsBuffer, 0, trailData);

    pass.drawIndexed(this.mesh.indexCount);
    // }

  }
}