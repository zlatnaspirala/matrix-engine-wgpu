import {mat4, vec3} from "wgpu-matrix";
import {flameEffect} from "../../shaders/flame-effect/flameEffect";
import {randomIntFromTo} from "../utils";
import {flameEffectInstance} from "../../shaders/flame-effect/flame-instanced";

export class FlameEmitter {
  constructor(device, format, maxParticles = 20) {
    this.device = device;
    this.format = format;
    this.time = 0;
    this.intensity = 3.0;
    this.enabled = true;

    this.maxParticles = maxParticles;
    this.instanceTargets = [];
    // this.floatsPerInstance = 16 + 4; // 16 for mat4 + 4 for color/intensity
    this.floatsPerInstance = 24;
    this.instanceData = new Float32Array(maxParticles * this.floatsPerInstance);

    // initialize particles
    for(let i = 0;i < maxParticles;i++) {
      this.instanceTargets.push({
        position: [
          (Math.random() - 0.5) * 12.0,   // X spread
          Math.random() * 2.0,            // small Y offset
          (Math.random() - 0.5) * 12.0    // Z spread
        ],
        currentPosition: [0, 0, 0],
        scale: [
          0.6 + Math.random() * 1.2,      // small width
          1.5 + Math.random() * 3.0,      // taller height
          1
        ],
        currentScale: [0, 0, 0],
        color: [1, 0.1 + Math.random() * 0.3, 0, 1],
        time: Math.random() * 5.0,
        intensity: 1.0 + Math.random() * 2.0,
        riseSpeed: 0.2 + Math.random() * 0.8
      });
    }

    this._initPipeline();
  }

  _initPipeline() {
    const S = 1;
    const vertexData = new Float32Array([
      -0.5 * S, 0.5 * S, 0,
      0.5 * S, 0.5 * S, 0,
      -0.5 * S, -0.5 * S, 0,
      0.5 * S, -0.5 * S, 0,
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
      depthStencil: {depthWriteEnabled: false, depthCompare: "always", format: "depth24plus"},
      blend: {
        color: {srcFactor: "src-alpha", dstFactor: "one", operation: "add"},
        alpha: {srcFactor: "one", dstFactor: "one-minus-src-alpha", operation: "add"}
      }
    });
  }

  // updateInstanceData = (baseModelMatrix) => {

  //   if(typeof baseModelMatrix !== 'undefined') {
  //     //  console.log('baseModelMatrix, local, finalMat', baseModelMatrix, local, finalMat)
  //     this.baseModelMatrix = baseModelMatrix;
  //   }

  //   const count = Math.min(this.instanceTargets.length, this.maxParticles);
  //   for(let i = 0;i < count;i++) {
  //     const t = this.instanceTargets[i];

  //     // interpolate smoothly
  //     for(let j = 0;j < 3;j++) {
  //       t.currentPosition[j] += (t.position[j] - t.currentPosition[j]) * 0.1;
  //       t.currentScale[j] += (t.scale[j] - t.currentScale[j]) * 0.1;
  //     }

  //     const local = mat4.identity();
  //     mat4.translate(local, t.currentPosition, local);
  //     mat4.scale(local, t.currentScale, local);

  //     const finalMat = mat4.identity();
  //     if(typeof baseModelMatrix === 'undefined' || typeof local === 'undefined') {
  //       // console.log('baseModelMatrix, local, finalMat', baseModelMatrix, local, finalMat)
  //       // HOT FIX
  //       baseModelMatrix = this.baseModelMatrix;
  //     }
  //     mat4.multiply(baseModelMatrix, local, finalMat);

  //     const offset = i * this.floatsPerInstance;
  //     this.instanceData.set(finalMat, offset);
  //     this.instanceData.set(t.color, offset + 16);
  //   }

  //   // upload active particles
  //   this.device.queue.writeBuffer(this.modelBuffer, 0, this.instanceData.subarray(0, count * this.floatsPerInstance));
  // }

  updateInstanceData = (baseModelMatrix) => {
    const count = Math.min(this.instanceTargets.length, this.maxParticles);

    for(let i = 0;i < count;i++) {
      const t = this.instanceTargets[i];

      // smooth interpolation if you want (optional)
      for(let j = 0;j < 3;j++) {
        t.currentPosition[j] += (t.position[j] - t.currentPosition[j]) * 0.12;
        t.currentScale[j] += (t.scale[j] - t.currentScale[j]) * 0.12;
      }

      const local = mat4.identity();
      mat4.translate(local, t.currentPosition, local);
      mat4.scale(local, t.currentScale, local);

      const finalMat = mat4.identity();
      mat4.multiply(baseModelMatrix, local, finalMat);

      const offset = i * this.floatsPerInstance;

      // Write mat4 (16 floats)
      this.instanceData.set(finalMat, offset);

      // Write time vec4 at offsets offset+16..offset+19
      const timeOffset = offset + 16;
      this.instanceData[timeOffset + 0] = t.time;
      this.instanceData[timeOffset + 1] = 0.0;
      this.instanceData[timeOffset + 2] = 0.0;
      this.instanceData[timeOffset + 3] = 0.0;

      // Write intensity vec4 at offsets offset+20..offset+23
      const intenOffset = offset + 20;
      this.instanceData[intenOffset + 0] = t.intensity;
      this.instanceData[intenOffset + 1] = 0.0;
      this.instanceData[intenOffset + 2] = 0.0;
      this.instanceData[intenOffset + 3] = 0.0;
    }

    // Upload only the active floats
    const activeFloatCount = count * this.floatsPerInstance;
    this.device.queue.writeBuffer(this.modelBuffer, 0, this.instanceData.subarray(0, activeFloatCount));
  }

  render(pass, mesh, viewProjMatrix, dt = 0.00016) {
    this.time += dt;

    // spawn/move particles
    for(const p of this.instanceTargets) {
      p.position[1] += dt;
      p.scale[0] = p.scale[1] = 12.5 + Math.random() * 0.5; // flicker
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