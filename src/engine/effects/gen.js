import {GeometryFactory} from "../geometry-factory.js";
import {mat4} from "wgpu-matrix";
import {geoInstancedEffect} from "../../shaders/standalone/geo.instanced.js";

export class GenGeo {
  static _pipelineCache = new WeakMap();
  constructor(device, format, type = "sphere", scale = 1, cameraBuffer) {
    this.device = device;
    this.format = format;
    this.cameraBuffer = cameraBuffer;
    const geom = GeometryFactory.create(type, scale);
    this.vertexData = geom.positions;
    this.uvData = geom.uvs;
    this.indexData = geom.indices;
    this.enabled = true;
    this._initPipeline();
  }

  _initPipeline() {
    const device = this.device;
    const {vertexData, uvData, indexData} = this;

    // ========== CACHE CHECK ==========
    if(GenGeo._pipelineCache.has(device)) {
      const cached = GenGeo._pipelineCache.get(device);
      this.pipeline = cached.pipeline;
      this.bindGroupLayout = cached.bindGroupLayout;
      this.pipelineLayout = cached.pipelineLayout;
      this.shaderModule = cached.shaderModule;
    } else {
      // ========== BUILD PIPELINE ONCE ==========
      this.bindGroupLayout = device.createBindGroupLayout({
        entries: [
          {binding: 0, visibility: GPUShaderStage.VERTEX, buffer: {type: "uniform"}},
          {binding: 1, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: {type: "read-only-storage"}},
        ]
      });

      this.shaderModule = device.createShaderModule({code: geoInstancedEffect()});
      this.pipelineLayout = device.createPipelineLayout({bindGroupLayouts: [this.bindGroupLayout]});

      this.pipeline = device.createRenderPipeline({
        label: 'geo gen Pipeline',
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
          }, {format: 'rgba16float'},
          {format: 'rgba16float'}]
        },
        primitive: {topology: 'triangle-list'},
        depthStencil: {depthWriteEnabled: false, depthCompare: 'less-equal', format: 'depth24plus'}
      });

      
      GenGeo._pipelineCache.set(device, {
        pipeline: this.pipeline,
        bindGroupLayout: this.bindGroupLayout,
        pipelineLayout: this.pipelineLayout,
        shaderModule: this.shaderModule
      });
    }

    
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
    this.modelBuffer = device.createBuffer({
      size: this.instanceData.byteLength,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });

    this.bindGroup = device.createBindGroup({
      layout: this.bindGroupLayout,
      entries: [
        {binding: 0, resource: {buffer: this.cameraBuffer}},
        {binding: 1, resource: {buffer: this.modelBuffer}},
      ]
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
    // pass.setPipeline(this.pipeline);
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