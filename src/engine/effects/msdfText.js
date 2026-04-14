import {mat4} from "wgpu-matrix";

export class MSDFTextEffect {
  constructor(device, format, msdfTexture, sampler) {
    this.device = device;
    this.format = format;

    this.msdfTexture = msdfTexture;
    this.sampler = sampler;

    this.glyphs = [];
    this._init();
  }

  _init() {

    // quad (same as your HP bar idea)
    const vertexData = new Float32Array([
      -0.5,  0.5,
       0.5,  0.5,
      -0.5, -0.5,
       0.5, -0.5,
    ]);

    const uvData = new Float32Array([
      0,1, 1,1, 0,0, 1,0
    ]);

    const indexData = new Uint16Array([
      0,2,1, 1,2,3
    ]);

    // buffers
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
      size: indexData.byteLength,
      usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST
    });
    this.device.queue.writeBuffer(this.indexBuffer, 0, indexData);

    this.indexCount = indexData.length;

    // glyph buffer (dynamic text)
    this.glyphBuffer = this.device.createBuffer({
      size: 1024 * 64,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
    });

    // camera
    this.cameraBuffer = this.device.createBuffer({
      size: 64,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });

    // bind group layout
    const bindGroupLayout = this.device.createBindGroupLayout({
      entries: [
        { binding: 0, visibility: GPUShaderStage.VERTEX, buffer: {} },
        { binding: 1, visibility: GPUShaderStage.VERTEX, buffer: { type: "read-only-storage" } },
        { binding: 2, visibility: GPUShaderStage.FRAGMENT, texture: {} },
        { binding: 3, visibility: GPUShaderStage.FRAGMENT, sampler: {} },
      ]
    });

    this.bindGroup = this.device.createBindGroup({
      layout: bindGroupLayout,
      entries: [
        { binding: 0, resource: { buffer: this.cameraBuffer } },
        { binding: 1, resource: { buffer: this.glyphBuffer } },
        { binding: 2, resource: this.msdfTexture.createView() },
        { binding: 3, resource: this.sampler },
      ]
    });

    // shader (we will plug MSDF shader here)
    const shaderModule = this.device.createShaderModule({
      code: MSDF_SHADER
    });

    const pipelineLayout = this.device.createPipelineLayout({
      bindGroupLayouts: [bindGroupLayout]
    });

    this.pipeline = this.device.createRenderPipeline({
      layout: pipelineLayout,
      vertex: {
        module: shaderModule,
        entryPoint: "vsMain",
        buffers: [
          {
            arrayStride: 2 * 4,
            attributes: [{ shaderLocation: 0, format: "float32x2" }]
          },
          {
            arrayStride: 2 * 4,
            attributes: [{ shaderLocation: 1, format: "float32x2" }]
          }
        ]
      },
      fragment: {
        module: shaderModule,
        entryPoint: "fsMain",
        targets: [{ format: this.format }]
      },
      primitive: {
        topology: "triangle-list"
      }
    });
  }

  setText(text) {
    this.text = text;
    this._updateGlyphs(text);
  }

  _updateGlyphs(text) {
    // convert string -> glyph instances
    // (you already do similar logic in engine systems)
  }

  render(pass, cameraMatrix) {
    this.device.queue.writeBuffer(this.cameraBuffer, 0, cameraMatrix);

    pass.setPipeline(this.pipeline);
    pass.setBindGroup(0, this.bindGroup);
    pass.setVertexBuffer(0, this.vertexBuffer);
    pass.setVertexBuffer(1, this.uvBuffer);
    pass.setIndexBuffer(this.indexBuffer, "uint16");

    pass.drawIndexed(this.indexCount, this.glyphs.length);
  }
}