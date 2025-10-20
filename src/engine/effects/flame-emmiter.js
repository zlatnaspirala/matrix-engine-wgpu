import {mat4} from "wgpu-matrix";
import {flameEffectInstance} from "../../shaders/flame-effect/flame-instanced";
import {randomFloatFromTo, randomIntFromTo} from "../utils";

export class FlameEmitter {
  constructor(device, format, maxParticles = 20) {
    this.device = device;
    this.format = format;
    this.time = 0;
    this.intensity = 3.0;
    this.enabled = true;
    this.maxParticles = maxParticles;
    this.instanceTargets = [];
    this.floatsPerInstance = 24;
    this.instanceData = new Float32Array(maxParticles * this.floatsPerInstance);
    this.smoothFlickeringScale = 0.1;
    this.maxY = 1.9;
    this.minY = 0;
    this.swap0 = 0;
    this.swap1 = 1;
    this.swap2 = 2;
    for(let i = 0;i < maxParticles;i++) {
      this.instanceTargets.push({
        position: [0, 0, 0],
        currentPosition: [0, 0, 0],
        scale: [1, 1, 1],
        currentScale: [1, 1, 1],
        rotation: 0.1,
        color: [1, 0.3, 0, 0.1],
        time: 1,
        intensity: 1,
        riseSpeed: 1
      });
    }

    this._initPipeline();
  }

  recreateVertexData(S) {
    const vertexData = new Float32Array([
      -0.4 * S, 0.5 * S, 0.0 * S,
      0.4 * S, 0.5 * S, 0.0 * S,
      -0.2 * S, -0.5 * S, 0.0 * S,
      0.2 * S, -0.5 * S, 0.0 * S,
    ]);
    this.device.queue.writeBuffer(this.vertexBuffer, 0, vertexData);
  }

  recreateVertexDataRND(S) {
    const vertexData = new Float32Array([
      -randomFloatFromTo(0.1, 0.8) * S, randomFloatFromTo(0.4, 0.6) * S, 0.0 * S,
      randomFloatFromTo(0.1, 0.8) * S, randomFloatFromTo(0.4, 0.6) * S, 0.0 * S,
      -randomFloatFromTo(0.1, 0.4) * S, -randomFloatFromTo(0.4, 0.6) * S, 0.0 * S,
      randomFloatFromTo(0.1, 0.4) * S, -randomFloatFromTo(0.4, 0.6) * S, 0.0 * S,
    ]);
    this.device.queue.writeBuffer(this.vertexBuffer, 0, vertexData);
  }

  _initPipeline() {
    const S = 5;
    const vertexData = new Float32Array([
      -0.2 * S, -0.5 * S, 0.0 * S,
      0.2 * S, -0.5 * S, 0.0 * S,
      -0.4 * S, 0.5 * S, 0.0 * S,
      0.4 * S, 0.5 * S, 0.0 * S,
    ]);
    const uvData = new Float32Array([0, 1, 1, 1, 0, 0, 1, 0]);
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
    this.cameraBuffer = this.device.createBuffer({size: 64, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST});
    this.modelBuffer = this.device.createBuffer({
      size: this.maxParticles * this.floatsPerInstance * 4,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
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

    const shaderModule = this.device.createShaderModule({code: flameEffectInstance});
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
      depthStencil: {depthWriteEnabled: false, depthCompare: "less", format: "depth24plus"},
      blend: {
        // color: {srcFactor: "src-alpha", dstFactor: "one", operation: "add"},
        // alpha: {srcFactor: "one", dstFactor: "one-minus-src-alpha", operation: "add"}
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
      }
    });
  }

  updateInstanceData = (baseModelMatrix) => {
    const count = Math.min(this.instanceTargets.length, this.maxParticles);
    for(let i = 0;i < count;i++) {
      const t = this.instanceTargets[i];
      // Smooth interpolation
      for(let j = 0;j < 3;j++) {
        t.currentPosition[j] += (t.position[j] - t.currentPosition[j]) * 0.12;
        t.currentScale[j] += (t.scale[j] - t.currentScale[j]) * 0.12;
      }
      // Build local matrix: translate → rotate → scale
      const local = mat4.identity();
      mat4.translate(local, t.currentPosition, local);
      mat4.rotateY(local, t.rotation, local);
      mat4.scale(local, t.currentScale, local);
      const finalMat = mat4.identity();
      mat4.multiply(baseModelMatrix, local, finalMat);
      const offset = i * this.floatsPerInstance;
      this.instanceData.set(finalMat, offset);
      this.instanceData.set([t.time, 0, 0, 0], offset + 16);
      this.instanceData.set([t.intensity, 0, 0, 0], offset + 20);
    }

    this.device.queue.writeBuffer(
      this.modelBuffer,
      0,
      this.instanceData.subarray(0, count * this.floatsPerInstance)
    );
  }

  render(pass, mesh, viewProjMatrix, dt = 0.1) {
    // update global time
    this.time += dt;
    for(const p of this.instanceTargets) {
      p.position[this.swap1] += dt * p.riseSpeed;
      // Reset if too high
      if(p.position[this.swap1] > this.maxY) {
        p.position[this.swap1] = this.minY + Math.random() * 0.5;
        p.position[this.swap0] = (Math.random() - 0.5) * 0.2;
        p.position[this.swap2] = (Math.random() - 0.5) * 0.2 + 0.1;
        p.riseSpeed = 0.2 + Math.random() * 1.0;
      }
      p.scale[0] = p.scale[1] = this.smoothFlickeringScale + Math.sin(this.time * 2.0 + p.position[this.swap1]) * 0.1;
      p.rotation += dt * randomIntFromTo(3, 15);
    }
    this.device.queue.writeBuffer(this.cameraBuffer, 0, viewProjMatrix);
    pass.setPipeline(this.pipeline);
    pass.setBindGroup(0, this.bindGroup);
    pass.setVertexBuffer(0, this.vertexBuffer);
    pass.setVertexBuffer(1, this.uvBuffer);
    pass.setIndexBuffer(this.indexBuffer, "uint16");
    pass.drawIndexed(this.indexCount, this.instanceTargets.length);
  }

  setIntensity(v) {this.intensity = v;}
}