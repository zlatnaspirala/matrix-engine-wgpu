import {mat4} from "wgpu-matrix";
import {flameEffect} from "../../shaders/flame-effect/flameEffect";

export class FlameEffect {
  constructor(device, format, colorFormat) {
    this.device = device;
    this.format = format;
    // colorFormat is the actual render pass attachment format (e.g. "rgba16float" for HDR).
    // Falls back to format if not provided.
    this.colorFormat = colorFormat ?? format;
    this.time = 0;
    this.intensity = 12.0;
    this.enabled = true;
    this._initPipeline();
  }

  _initPipeline() {
    const S = 40;
    const vertexData = new Float32Array([
      -0.5 * S,  0.5 * S, 0,
       0.5 * S,  0.5 * S, 0,
      -0.5 * S, -0.5 * S, 0,
       0.5 * S, -0.5 * S, 0,
    ]);

    const uvData = new Float32Array([
      0, 1,  1, 1,  0, 0,  1, 0
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

    // --- Uniforms ---
    // Camera: mat4 = 64 bytes
    this.cameraBuffer = this.device.createBuffer({
      size: 64,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });

    // ModelData: mat4 (64) + time vec4 (16) + intensity vec4 (16) = 96 bytes
    this.modelBuffer = this.device.createBuffer({
      size: 96,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });

    const bindGroupLayout = this.device.createBindGroupLayout({
      entries: [
        { binding: 0, visibility: GPUShaderStage.VERTEX,                    buffer: { type: "uniform" } },
        { binding: 1, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: { type: "uniform" } },
      ]
    });

    this.bindGroup = this.device.createBindGroup({
      layout: bindGroupLayout,
      entries: [
        { binding: 0, resource: { buffer: this.cameraBuffer } },
        { binding: 1, resource: { buffer: this.modelBuffer  } },
      ]
    });

    const shaderModule = this.device.createShaderModule({ code: flameEffect });
    const pipelineLayout = this.device.createPipelineLayout({ bindGroupLayouts: [bindGroupLayout] });

    this.pipeline = this.device.createRenderPipeline({
      layout: pipelineLayout,
      vertex: {
        module: shaderModule,
        entryPoint: "vsMain",
        buffers: [
          { arrayStride: 3 * 4, attributes: [{ shaderLocation: 0, offset: 0, format: "float32x3" }] },
          { arrayStride: 2 * 4, attributes: [{ shaderLocation: 1, offset: 0, format: "float32x2" }] }
        ]
      },
      fragment: {
        module: shaderModule,
        entryPoint: "fsMain",
        targets: [{
          format: this.colorFormat,  // must match the render pass attachment
          // ✅ blend belongs here, inside targets[], not at pipeline root
          blend: {
            color: { srcFactor: "src-alpha", dstFactor: "one",                 operation: "add" },
            alpha: { srcFactor: "one",       dstFactor: "one-minus-src-alpha", operation: "add" }
          }
        }]
      },
      primitive: { topology: "triangle-list" },
      depthStencil: {
        depthWriteEnabled: false,
        depthCompare: "always",
        format: "depth24plus"
      },
    });
  }

  draw(pass, cameraMatrix) {
    this.device.queue.writeBuffer(this.cameraBuffer, 0, cameraMatrix);

    pass.setPipeline(this.pipeline);
    pass.setBindGroup(0, this.bindGroup);
    pass.setVertexBuffer(0, this.vertexBuffer);
    pass.setVertexBuffer(1, this.uvBuffer);
    pass.setIndexBuffer(this.indexBuffer, "uint16");
    pass.drawIndexed(this.indexCount);
  }

  updateInstanceData(baseModelMatrix) {
    const local = mat4.identity();
    mat4.translate(local, [0, 20, 0], local);
    mat4.scale(local, [1.0, 1.0, 1.0], local);

    const finalMat = mat4.identity();
    mat4.multiply(baseModelMatrix, local, finalMat);

    const timeBuffer      = new Float32Array([this.time,      0, 0, 0]);
    const intensityBuffer = new Float32Array([this.intensity, 0, 0, 0]);

    this.device.queue.writeBuffer(this.modelBuffer,  0, finalMat);
    this.device.queue.writeBuffer(this.modelBuffer, 64, timeBuffer);
    this.device.queue.writeBuffer(this.modelBuffer, 80, intensityBuffer);
  }

  render(pass, mesh, viewProjMatrix, dt = 0.01) {
    this.time += dt;
    this.draw(pass, viewProjMatrix);
  }

  setIntensity(v) {
    this.intensity = v;
  }
}