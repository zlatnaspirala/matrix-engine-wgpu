import {GeometryFactory} from "../geometry-factory.js";
import {mat4} from "wgpu-matrix";
import {geoInstancedEffect} from "../../shaders/standalone/geo.instanced.js";

export class GenGeo {
  constructor(device, format, type = "sphere", scale=1) {
    this.device = device;
    this.format = format;
    const geom = GeometryFactory.create(type, scale);
    this.vertexData = geom.positions;
    this.uvData = geom.uvs;
    this.indexData = geom.indices;
    this._initPipeline();
  }

  _initPipeline() {
    const {vertexData, uvData, indexData} = this;
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

    this.cameraBuffer = this.device.createBuffer({
      size: 64,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });

    this.instanceTargets = [];
    this.lerpSpeed = 0.05;
    this.maxInstances = 5;
    this.instanceCount = 2;
    this.floatsPerInstance = 16 + 4;

    for(let x = 0;x < this.maxInstances;x++) {
      this.instanceTargets.push({
        index: x,
        position: [0, 0, 0],
        currentPosition: [0, 0, 0],
        scale: [1, 1, 1],
        currentScale: [1, 1, 1],
        color: [0.6, 0.8, 1.0, 0.4],
      });
    }
    this.instanceData = new Float32Array(this.instanceCount * this.floatsPerInstance);

    this.modelBuffer = this.device.createBuffer({
      size: this.instanceData.byteLength,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });

    const bindGroupLayout = this.device.createBindGroupLayout({
      entries: [
        {binding: 0, visibility: GPUShaderStage.VERTEX, buffer: {}},
        {binding: 1, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: {type: "read-only-storage"}},
      ]
    });

    this.bindGroup = this.device.createBindGroup({
      layout: bindGroupLayout,
      entries: [
        {binding: 0, resource: {buffer: this.cameraBuffer}},
        {binding: 1, resource: {buffer: this.modelBuffer}},
      ]
    });

    const shaderModule = this.device.createShaderModule({code: geoInstancedEffect});
    const pipelineLayout = this.device.createPipelineLayout({bindGroupLayouts: [bindGroupLayout]});
    this.pipeline = this.device.createRenderPipeline({
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
        targets: [{
          format: this.format,
          blend: {
            color: {
              srcFactor: 'src-alpha',
              dstFactor: 'one-minus-src-alpha',
              operation: 'add',
            },
            alpha: {
              srcFactor: 'one',
              dstFactor: 'one-minus-src-alpha',
              operation: 'add',
            },
          },
        }]
      },
      primitive: {topology: 'triangle-list'},
      depthStencil: {depthWriteEnabled: false, depthCompare: 'less-equal', format: 'depth24plus'}
    });
  }

  updateInstanceData = (baseModelMatrix) => {
    const count = Math.min(this.instanceCount, this.maxInstances);
    for(let i = 0;i < count;i++) {
      const t = this.instanceTargets[i];
      // smooth interpolation of position & scale
      for(let j = 0;j < 3;j++) {
        t.currentPosition[j] += (t.position[j] - t.currentPosition[j]) * this.lerpSpeed;
        t.currentScale[j] += (t.scale[j] - t.currentScale[j]) * this.lerpSpeed;
      }
      const local = mat4.identity();
      mat4.translate(local, t.currentPosition, local);
      mat4.scale(local, t.currentScale, local);
      const finalMat = mat4.identity();
      mat4.multiply(baseModelMatrix, local, finalMat);
      const offset = i * this.floatsPerInstance;
      this.instanceData.set(finalMat, offset);
      this.instanceData.set(t.color, offset + 16);
    }
    // IMPORTANT: upload ONLY the active range of floats to GPU to avoid leftover instances
    const activeFloatCount = count * this.floatsPerInstance;
    const activeBytes = activeFloatCount * 4;
    // .subarray(0, activeFloatCount) ensures we don't upload garbage beyond instanceCount
    this.device.queue.writeBuffer(this.modelBuffer, 0, this.instanceData.subarray(0, activeFloatCount));
  };

  draw(pass, cameraMatrix) {
    this.device.queue.writeBuffer(this.cameraBuffer, 0, cameraMatrix);
    pass.setPipeline(this.pipeline);
    pass.setBindGroup(0, this.bindGroup);
    pass.setVertexBuffer(0, this.vertexBuffer);
    pass.setVertexBuffer(1, this.uvBuffer);
    pass.setIndexBuffer(this.indexBuffer, 'uint16');
    pass.drawIndexed(this.indexCount, this.instanceCount);
  }

  render(transPass, mesh, viewProjMatrix) {
    this.draw(transPass, viewProjMatrix);
  }
}