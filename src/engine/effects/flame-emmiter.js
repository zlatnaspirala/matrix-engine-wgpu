import {mat4} from "wgpu-matrix";
import {flameEffectInstance} from "../../shaders/flame-effect/flame-instanced";
import {LOG_FUNNY_ARCADE, randomFloatFromTo, randomIntFromTo} from "../utils";

/**
 * @description
 * FlameEmitter
 * transformed vertex particle, posible to choose dir also...
 */
export class FlameEmitter {
  constructor(device, format, maxParticles = 20) {
    this.device = device;
    this.format = format;
    this.time = 0;
    this.intensity = 1.0;
    this.enabled = true;
    this.maxParticles = maxParticles;
    this.instanceTargets = [];
    this.floatsPerInstance = 28;
    this.instanceData = new Float32Array(maxParticles * this.floatsPerInstance);
    this.smoothFlickeringScale = 0.1;
    this.minBound = 0;
    this.maxBound = 1.9;
    this.swap0 = 0;
    this.swap1 = 1;
    this.swap2 = 2;
    this.riseDirection = 1;
    this.baseRotation = [0, 0, 0];
    this.scaleCoeficient = 0.12;
    this.rotSpeed = 0.1;
    // cache
    this._localMatrix = mat4.create();
    this._finalMatrix = mat4.create();
    this._scratch4 = new Float32Array(4);

    for(let i = 0;i < maxParticles;i++) {
      this.instanceTargets.push({
        position: [0, 0, 0],
        currentPosition: [0, 0, 0],
        scale: [1, 1, 1],
        currentScale: [1, 1, 1],
        rotation: randomFloatFromTo(10 , 20),
        color: [1, 0.3, 0, 0.1],
        time: 1,
        intensity: 1,
        riseSpeed: 1,
        tintStrength: 1
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
    if(this.vertexBuffer) this.device.queue.writeBuffer(this.vertexBuffer, 0, vertexData);
    return vertexData;
  }

  recreateVertexDataCrazzy(S) {
    const memory1 = -randomFloatFromTo(0.1, 0.1 + S);
    const memory11 = randomFloatFromTo(0.1, 0.1 + S);
    const memory12 = randomFloatFromTo(0.1, 0.1 + S);
    const memory13 = randomFloatFromTo(0.1, 0.1 + S);
    const memory2 = randomFloatFromTo(0.4, 0.4 + S);
    const memory21 = randomFloatFromTo(0.4, 0.4 + S);
    const memory22 = -randomFloatFromTo(0.4, 0.4 + S);
    const memory23 = -randomFloatFromTo(0.4, 0.4 + S)
    this.memoryCrazzyCase = [memory1, memory11, memory12, memory13, memory2, memory21, memory22, memory23];
    console.info(`Crazzy flame emitter case data [use random input and choose best configuration for your effect]: ${this.memoryCrazzyCase}`, LOG_FUNNY_ARCADE);
    const vertexData = new Float32Array([
      memory1, memory2, 0.0,
      memory11, memory21, 0.0,
      memory12, memory22, 0.0,
      memory13, memory23, 0.0,
    ]);
    if(this.vertexBuffer) this.device.queue.writeBuffer(this.vertexBuffer, 0, vertexData);
    return vertexData;
  }

  _initPipeline() {
    const S = 2;
    const vertexData = this.recreateVertexDataRND(1);
    const uvData = new Float32Array([0, 1, 1, 1, 0, 0, 1, 0]);
    const indexData = new Uint16Array([0, 2, 1, 1, 2, 3]);
    this.vertexBuffer = this.device.createBuffer({size: vertexData.byteLength, usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST});
    this.device.queue.writeBuffer(this.vertexBuffer, 0, vertexData);
    this.uvBuffer = this.device.createBuffer({size: uvData.byteLength, usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST});
    this.device.queue.writeBuffer(this.uvBuffer, 0, uvData);
    this.indexBuffer = this.device.createBuffer({size: Math.ceil(indexData.byteLength / 4) * 4, usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST});
    this.device.queue.writeBuffer(this.indexBuffer, 0, indexData);
    this.indexCount = indexData.length;
    this.cameraBuffer = this.device.createBuffer({size: 64, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST});
    this.modelBuffer = this.device.createBuffer({label: 'flame-emmiter modeBuffer', size: this.maxParticles * this.floatsPerInstance * 4, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST});
    const bindGroupLayout = this.device.createBindGroupLayout({
      label: 'flame-emmiter bindGroupLayout',
      entries: [
        {binding: 0, visibility: GPUShaderStage.VERTEX, buffer: {}},
        {binding: 1, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: {type: "read-only-storage"}},
      ]
    });
    this.bindGroup = this.device.createBindGroup({
      label: 'flame-emmiter bindGroup',
      layout: bindGroupLayout,
      entries: [
        {binding: 0, resource: {buffer: this.cameraBuffer}},
        {binding: 1, resource: {buffer: this.modelBuffer}},
      ]
    });
    const shaderModule = this.device.createShaderModule({code: flameEffectInstance});
    const pipelineLayout = this.device.createPipelineLayout({bindGroupLayouts: [bindGroupLayout]});
    this.pipeline = this.device.createRenderPipeline({
      label: 'flame-emmiter pipeline',
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
        targets: [{
          format: this.format,
          blend: {
            color: {
              srcFactor: 'src-alpha',
              dstFactor: 'one',
              operation: 'add',
            },
            alpha: {
              srcFactor: 'one',
              dstFactor: 'one-minus-src-alpha',
              operation: 'add',
            },

          }
        }]
      },
      primitive: {topology: "triangle-list"},
      depthStencil: {depthWriteEnabled: false, depthCompare: "less", format: "depth24plus"}
    });
  }

  updateInstanceData = (baseModelMatrix) => {
    const count = Math.min(this.instanceTargets.length, this.maxParticles);
    const floatsPerInstance = 28;
    for(let i = 0;i < count;i++) {
      const t = this.instanceTargets[i];
      for(let j = 0;j < 3;j++) {
        t.currentPosition[j] += (t.position[j] - t.currentPosition[j]) * this.scaleCoeficient;
      }
      const local = this._localMatrix;
      mat4.identity(local);
      mat4.translate(local, t.currentPosition, local);
      mat4.rotateY(local, t.rotation, local);
      mat4.scale(local, t.currentScale, local);
      mat4.identity(this._finalMatrix);
      mat4.multiply(baseModelMatrix, local, this._finalMatrix);
      const offset = i * floatsPerInstance;
      this.instanceData.set(this._finalMatrix, offset);

      this.instanceData[offset + 16] = t.time;
      this.instanceData[offset + 17] = t.speed ?? 1.0;
      this.instanceData[offset + 18] = 0;
      this.instanceData[offset + 19] = 0;

      this.instanceData[offset + 20] = (t.intensity ?? 1.0) * this.intensity;
      this.instanceData[offset + 21] = t.turbulence ?? 0.5;
      this.instanceData[offset + 22] = t.stretch ?? 1.0;
      this.instanceData[offset + 23] = 0;

      this.instanceData[offset + 24] = t.color[0];
      this.instanceData[offset + 25] = t.color[1];
      this.instanceData[offset + 26] = t.color[2];
      this.instanceData[offset + 27] = t.tintStrength ?? 0.0;
    }
    this.device.queue.writeBuffer(this.modelBuffer, 0, this.instanceData.subarray(0, count * floatsPerInstance));
  }

  render(pass, mesh, viewProjMatrix, dt = 0.1) {
    this.time += dt;
    for(const p of this.instanceTargets) {
      p.position[this.swap1] += dt * p.riseSpeed * this.riseDirection;
      const resetCondition = this.riseDirection > 0
        ? p.position[this.swap1] > this.maxBound
        : p.position[this.swap1] < this.minBound;
      if(resetCondition) {
        p.position[this.swap1] = this.riseDirection > 0
          ? this.minBound + Math.random() * 0.5
          : this.maxBound - Math.random() * 0.5;
        p.position[this.swap0] = (Math.random() - 0.5) * 0.2;
        p.position[this.swap2] = (Math.random() - 0.5) * 0.2;
        p.riseSpeed = 0.2 + Math.random() * 1.0;
      }
      p.scale[0] = p.scale[1] = this.smoothFlickeringScale + Math.sin(this.time * 2.0 + p.position[this.swap1]) * 0.1;
      p.rotation += dt * this.rotSpeed;
    }

    this.device.queue.writeBuffer(this.cameraBuffer, 0, viewProjMatrix);
    pass.setPipeline(this.pipeline);
    pass.setBindGroup(0, this.bindGroup);
    pass.setVertexBuffer(0, this.vertexBuffer);
    pass.setVertexBuffer(1, this.uvBuffer);
    pass.setIndexBuffer(this.indexBuffer, "uint16");
    pass.drawIndexed(this.indexCount, this.instanceTargets.length);
  }

  setIntensity(v) {this.intensity = v}

  setDirection(direction) {
    this.riseDirection = 1;
    this.baseRotation = [0, 0, 0]; // Reset
    switch(direction) {
      case 'up':
        this.swap0 = 0; this.swap1 = 1; this.swap2 = 2;
        break;
      case 'down':
        this.swap0 = 0; this.swap1 = 1; this.swap2 = 2;
        this.riseDirection = -1;
        break;
      case 'forward':
        this.swap0 = 0; this.swap1 = 2; this.swap2 = 1;
        this.baseRotation = [Math.PI / 2, 0, 0];
        break;
      case 'back':
        this.swap0 = 0; this.swap1 = 2; this.swap2 = 1;
        this.riseDirection = -1;
        this.baseRotation = [-Math.PI / 2, 0, 0]; // Tilt -90 on X
        break;
      case 'right':
        this.swap0 = 1; this.swap1 = 0; this.swap2 = 2;
        this.baseRotation = [0, 0, -Math.PI / 2]; // Tilt -90 on Z
        break;
      case 'left':
        this.swap0 = 1; this.swap1 = 0; this.swap2 = 2;
        this.riseDirection = -1;
        this.baseRotation = [0, 0, Math.PI / 2]; // Tilt 90 on Z
        break;
    }
  }
}