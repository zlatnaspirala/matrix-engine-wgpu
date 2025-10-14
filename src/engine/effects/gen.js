import {GeometryFactory} from "../geometry-factory.js";
import {mat4} from "wgpu-matrix";
import {pointerEffect} from "../../shaders/standalone/pointer.effect.js";
import {geoInstancedEffect} from "../../shaders/standalone/geo.instanced.js";

export class GenGeo {
  constructor(device, format, type = "quad") {
    this.device = device;
    this.format = format;

    // Get geometry
    const geom = GeometryFactory.create(type, 10);

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

    // Uniforms: camera & model
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

    // for instanced
    this.modelBuffer = this.device.createBuffer({
      size: this.instanceData.byteLength,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });

    // Bind group layout
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

    // Shader
    const shaderModule = this.device.createShaderModule({code: geoInstancedEffect});

    // Pipeline
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
        targets: [{format: this.format}]
      },
      primitive: {topology: 'triangle-list'},
      depthStencil: {depthWriteEnabled: true, depthCompare: 'always', format: 'depth24plus'}
    });
  }

  updateInstanceData = (modelMatrix) => {
    for(let i = 0;i < this.instanceCount;i++) {
      const t = this.instanceTargets[i];
      const ghost = new Float32Array(modelMatrix);
      // --- Smooth interpolate position
      for(let j = 0;j < 3;j++) {
        t.currentPosition[j] += (t.position[j] - t.currentPosition[j]) * this.lerpSpeed;
        t.currentScale[j] += (t.scale[j] - t.currentScale[j]) * this.lerpSpeed;
      }
      // Apply smoothed transforms
      ghost[0] *= t.currentScale[0];
      ghost[5] *= t.currentScale[1];
      ghost[10] *= t.currentScale[2];
      // pos
      ghost[12] += t.currentPosition[0]; // X
      ghost[13] += t.currentPosition[1]; // Y
      ghost[14] += t.currentPosition[2]; // Z

      // Write instance matrix + color
      const offset = 20 * i;
      this.instanceData.set(ghost, offset);
      this.instanceData.set(t.color, offset + 16);
    }

    this.device.queue.writeBuffer(this.modelBuffer, 0, this.instanceData);
  };

  draw(pass, cameraMatrix) {
    this.device.queue.writeBuffer(this.cameraBuffer, 0, cameraMatrix);
    // Draw
    pass.setPipeline(this.pipeline);
    pass.setBindGroup(0, this.bindGroup);
    pass.setVertexBuffer(0, this.vertexBuffer);
    pass.setVertexBuffer(1, this.uvBuffer);
    pass.setIndexBuffer(this.indexBuffer, 'uint16');
    // pass.drawIndexed(this.indexCount);
    pass.drawIndexed(this.indexCount, this.instanceCount);

    // for(var ins = 0;ins < this.instanceCount;ins++) {
    //   pass.drawIndexed(this.indexCount, 1, 0, 0, ins);
    // }
 
  }

  render(transPass, mesh, viewProjMatrix) {
    const pointer = mesh.effects.pointer;
    pointer.draw(transPass, viewProjMatrix);
  }
}