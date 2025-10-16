import {mat4} from "wgpu-matrix";
import {flameEffect} from "../../shaders/flame-effect/flameEffect";

export class FlameEffect {
  constructor(device, format) {
    this.device = device;
    this.format = format;
    this.time = 0;
    this.intensity = 12.0;
    this.enabled = true;
    this._initPipeline();
  }

  _initPipeline() {
    const S = 40;
    const vertexData = new Float32Array([
      -0.5 * S, 0.5 * S, 0,
      0.5 * S, 0.5 * S, 0,
      -0.5 * S, -0.5 * S, 0,
      0.5 * S, -0.5 * S, 0,
    ]);

    const uvData = new Float32Array([
      0, 1, 1, 1, 0, 0, 1, 0
    ]);

    const indexData = new Uint16Array([0, 2, 1, 1, 2, 3]);

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

    // --- Uniforms
    this.cameraBuffer = this.device.createBuffer({
      size: 64,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });

    this.modelBuffer = this.device.createBuffer({
      size: 64 + 16 + 16, // model + time/intensity padded
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });

    const bindGroupLayout = this.device.createBindGroupLayout({
      entries: [
        {binding: 0, visibility: GPUShaderStage.VERTEX, buffer: {}},
        {binding: 1, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: {}},
      ]
    });

    this.bindGroup = this.device.createBindGroup({
      layout: bindGroupLayout,
      entries: [
        {binding: 0, resource: {buffer: this.cameraBuffer}},
        {binding: 1, resource: {buffer: this.modelBuffer}},
      ]
    });

    const shaderModule = this.device.createShaderModule({code: flameEffect});
    const pipelineLayout = this.device.createPipelineLayout({bindGroupLayouts: [bindGroupLayout]});

    this.pipeline = this.device.createRenderPipeline({
      layout: pipelineLayout,
      vertex: {
        module: shaderModule,
        entryPoint: "vsMain",
        buffers: [
          {arrayStride: 3 * 4, attributes: [{shaderLocation: 0, offset: 0, format: "float32x3"}]},
          {arrayStride: 2 * 4, attributes: [{shaderLocation: 1, offset: 0, format: "float32x2"}]}
        ]
      },
      fragment: {
        module: shaderModule,
        entryPoint: "fsMain",
        targets: [{format: this.format}]
      },
      primitive: {topology: "triangle-list"},
      depthStencil: {depthWriteEnabled: false, depthCompare: "always", format: "depth24plus"},
      blend: {
        color: {srcFactor: "src-alpha", dstFactor: "one", operation: "add"},
        alpha: {srcFactor: "one", dstFactor: "one-minus-src-alpha", operation: "add"}
      }
    });
  }

  draw(pass, cameraMatrix) {
    // const timeBuffer = new Float32Array([this.time]);
    // const intensityBuffer = new Float32Array([this.intensity]);

    this.device.queue.writeBuffer(this.cameraBuffer, 0, cameraMatrix);

    pass.setPipeline(this.pipeline);
    pass.setBindGroup(0, this.bindGroup);
    pass.setVertexBuffer(0, this.vertexBuffer);
    pass.setVertexBuffer(1, this.uvBuffer);
    pass.setIndexBuffer(this.indexBuffer, "uint16");
    pass.drawIndexed(this.indexCount);
  }

  updateInstanceData = (baseModelMatrix) => {
    const local = mat4.identity();

    // flame offset or scale
    mat4.translate(local, [0, 20, 0], local);
    mat4.scale(local, [1.0, 1.0, 1.0], local);

    // multiply with baseModelMatrix to inherit world transform
    const finalMat = mat4.identity();
    mat4.multiply(baseModelMatrix, local, finalMat);

    // now update GPU buffer
    const timeBuffer = new Float32Array([this.time]);
    const intensityBuffer = new Float32Array([this.intensity]);

    this.device.queue.writeBuffer(this.modelBuffer, 0, finalMat);
    this.device.queue.writeBuffer(this.modelBuffer, 64, timeBuffer);
    this.device.queue.writeBuffer(this.modelBuffer, 80, intensityBuffer);
  };

  render(pass, mesh, viewProjMatrix, dt = 0.01, offsetY = 50) {
    this.time += dt;
    this.draw(pass, viewProjMatrix);
  }

  setIntensity(v) {
    this.intensity = v;
  }
}
