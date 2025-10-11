import { mat4 } from "wgpu-matrix";

export class TrailEffect {
  constructor(device, format, useBlending = true) {
    this.device = device;
    this.format = format;
    this.useBlending = useBlending;

    this._initPipeline();
    this._initBuffers();
  }

  async _initPipeline() {
    const shaderCode = await (await fetch("./trailEffect.wgsl")).text();
    const shaderModule = this.device.createShaderModule({ code: shaderCode });

    // --- Camera + Trail uniforms ---
    this.cameraBuffer = this.device.createBuffer({
      size: 64,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    this.trailParamsBuffer = this.device.createBuffer({
      size: 32, // vec4 + 3 floats (padded)
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    const bindGroupLayout = this.device.createBindGroupLayout({
      entries: [
        { binding: 0, visibility: GPUShaderStage.VERTEX, buffer: {} },
        { binding: 1, visibility: GPUShaderStage.FRAGMENT, buffer: {} },
      ],
    });

    this.bindGroup = this.device.createBindGroup({
      layout: bindGroupLayout,
      entries: [
        { binding: 0, resource: { buffer: this.cameraBuffer } },
        { binding: 1, resource: { buffer: this.trailParamsBuffer } },
      ],
    });

    // --- Create pipeline with optional blending ---
    const blendConfig = this.useBlending
      ? {
          color: { srcFactor: "one", dstFactor: "one", operation: "add" },
          alpha: { srcFactor: "one", dstFactor: "one", operation: "add" },
        }
      : undefined;

    const pipelineLayout = this.device.createPipelineLayout({
      bindGroupLayouts: [bindGroupLayout],
    });

    this.pipeline = this.device.createRenderPipeline({
      layout: pipelineLayout,
      vertex: {
        module: shaderModule,
        entryPoint: "vsMain",
        buffers: [
          {
            arrayStride: 20,
            attributes: [
              { shaderLocation: 0, offset: 0, format: "float32x3" },
              { shaderLocation: 1, offset: 12, format: "float32x2" },
            ],
          },
        ],
      },
      fragment: {
        module: shaderModule,
        entryPoint: "fsMain",
        targets: [
          {
            format: this.format,
            blend: blendConfig,
          },
        ],
      },
      primitive: {
        topology: "triangle-strip",
      },
      depthStencil: {
        depthWriteEnabled: true,
        depthCompare: "less",
        format: "depth24plus",
      },
    });
  }

  _initBuffers() {
    // Simple trail geometry (quad strip)
    const vertices = new Float32Array([
      // x, y, z,   u, v
      -0.1, 0, 0,  0, 0,
       0.1, 0, 0,  1, 0,
      -0.1, 0, 1,  0, 1,
       0.1, 0, 1,  1, 1,
    ]);

    this.vertexBuffer = this.device.createBuffer({
      size: vertices.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
      mappedAtCreation: true,
    });
    new Float32Array(this.vertexBuffer.getMappedRange()).set(vertices);
    this.vertexBuffer.unmap();
  }

  update(cameraViewProj, time, color = [0.2, 0.7, 1.0, 1.0], fadeLength = 1.2) {
    // Update camera matrix
    this.device.queue.writeBuffer(this.cameraBuffer, 0, cameraViewProj.buffer, cameraViewProj.byteOffset, 64);

    // Update trail params
    const data = new Float32Array([...color, fadeLength, time, 0, 0]);
    this.device.queue.writeBuffer(this.trailParamsBuffer, 0, data.buffer);
  }

  draw(encoder, pass) {
    pass.setPipeline(this.pipeline);
    pass.setBindGroup(0, this.bindGroup);
    pass.setVertexBuffer(0, this.vertexBuffer);
    pass.draw(4, 1, 0, 0);
  }

  // 🔄 Switch blend ON/OFF dynamically
  toggleBlend(useBlend) {
    if (this.useBlending !== useBlend) {
      this.useBlending = useBlend;
      this._initPipeline(); // rebuild pipeline with new blend config
    }
  }
}