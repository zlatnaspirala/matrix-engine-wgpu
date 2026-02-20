import {mat4} from "wgpu-matrix";
import {flameEffect} from "../../shaders/flame-effect/flameEffect";
import {GeometryFactory} from "../geometry-factory";

export const FlamePresets = {
  // Natural campfire / torch
  natural: {
    intensity: 12.0,
    speed: 1.0,
    turbulence: 0.5,
    stretch: 1.0,
    tint: [1.0, 1.0, 1.0],
    tintStrength: 0.0,
    scale: 2,
    localOffset: [0, 0, 0],
    localRotation: [0, 0, 0],
    activeRotate: [0, 0, 0]
  },
  // Tall torch / pillar of fire
  torch: {
    intensity: 14.0,
    speed: 1.2,
    turbulence: 0.35,
    stretch: 2.0,
    tint: [1.0, 1.0, 1.0],
    tintStrength: 0.0,
    scale: 2,
    localOffset: [0, 0, 0],
    localRotation: [0, 0, 0],
    activeRotate: [0, 0, 0]
  },
  // Wide, low bonfire
  bonfire: {
    intensity: 10.0,
    speed: 0.8,
    turbulence: 0.9,
    stretch: 0.5,
    tint: [1.0, 1.0, 1.0],
    tintStrength: 0.0,
    scale: 2,
    localOffset: [0, 0, 0],
    localRotation: [0, 0, 0],
    activeRotate: [0, 0, 0]
  },
  // Magical blue flame
  magic: {
    intensity: 8.0,
    speed: 1.4,
    turbulence: 0.6,
    stretch: 1.3,
    tint: [0.1, 0.4, 1.0],
    tintStrength: 0.85,
    scale: 2,
    localOffset: [0, 0, 0],
    localRotation: [0, 0, 0],
    activeRotate: [0, 0, 0]
  },
  // Hellfire — dark purple/red
  hell: {
    intensity: 16.0,
    speed: 0.9,
    turbulence: 0.8,
    stretch: 1.6,
    tint: [0.6, 0.0, 0.8],
    tintStrength: 0.7,
    scale: 2,
    localOffset: [0, 0, 0],
    localRotation: [0, 0, 0],
    activeRotate: [0, 0, 0]
  },
  // Poison green
  poison: {
    intensity: 9.0,
    speed: 1.1,
    turbulence: 0.7,
    stretch: 1.1,
    tint: [0.1, 1.0, 0.15],
    tintStrength: 0.9,
    scale: 2,
    localOffset: [0, 0, 0],
    localRotation: [0, 0, 0],
    activeRotate: [0, 0, 0]
  }
};

// FlameEffect
export class FlameEffect {
  constructor(device, format, colorFormat, params = {}) {
    this.device = device;
    this.format = format;
    this.colorFormat = colorFormat ?? format;
    const config = typeof params === 'string' ? FlamePresets[params] : params;
    const defaults = FlamePresets.natural;
    this.intensity = config.intensity ?? defaults.intensity;
    this.speed = config.speed ?? defaults.speed;
    this.turbulence = config.turbulence ?? defaults.turbulence;
    this.stretch = config.stretch ?? defaults.stretch;
    this.tint = config.tint ?? defaults.tint;
    this.tintStrength = config.tintStrength ?? defaults.tintStrength;
    this.scale = config.scale ?? defaults.scale;
    this.time = 0;
    this.enabled = true;
    this.localOffset = config.localOffset ?? defaults.localOffset;
    this.localRotation = config.localRotation ?? defaults.localRotation;
    this.activeRotate = config.activeRotate ?? defaults.activeRotate;
    this._initPipeline();
    this.setGeometry("quad", this.scale);
  }

  setGeometry(type, size = 1, segments = 32) {
    const geo = GeometryFactory.create(type, size, segments);
    this.vertexBuffer = this._uploadVertex(geo.positions);
    this.uvBuffer = this._uploadVertex(geo.uvs);
    const byteLen = geo.indices.byteLength;
    const paddedByteLen = Math.ceil(byteLen / 4) * 4;
    this.indexBuffer = this.device.createBuffer({size: paddedByteLen, usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST});
    if(byteLen % 4 !== 0) {
      const paddedData = new Uint8Array(paddedByteLen);
      paddedData.set(new Uint8Array(geo.indices.buffer, geo.indices.byteOffset, byteLen));
      this.device.queue.writeBuffer(this.indexBuffer, 0, paddedData);
    } else {
      this.device.queue.writeBuffer(this.indexBuffer, 0, geo.indices);
    }
    this.indexCount = geo.indices.length;
    this.indexFormat = geo.indices instanceof Uint16Array ? "uint16" : "uint32";
  }

  _initPipeline() {
    this.cameraBuffer = this.device.createBuffer({size: 64, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST});
    this.modelBuffer = this.device.createBuffer({size: 112, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST});
    const bindGroupLayout = this.device.createBindGroupLayout({
      entries: [
        {binding: 0, visibility: GPUShaderStage.VERTEX, buffer: {type: "uniform"}},
        {binding: 1, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: {type: "uniform"}},
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
    this.pipeline = this.device.createRenderPipeline({
      layout: this.device.createPipelineLayout({bindGroupLayouts: [bindGroupLayout]}),
      vertex: {
        module: shaderModule,
        entryPoint: "vsMain",
        buffers: [
          {arrayStride: 12, attributes: [{shaderLocation: 0, offset: 0, format: "float32x3"}]},
          {arrayStride: 8, attributes: [{shaderLocation: 1, offset: 0, format: "float32x2"}]},
        ]
      },
      fragment: {
        module: shaderModule,
        entryPoint: "fsMain",
        targets: [{
          format: this.colorFormat,
          blend: {
            color: {srcFactor: "src-alpha", dstFactor: "one", operation: "add"},
            alpha: {srcFactor: "one", dstFactor: "one-minus-src-alpha", operation: "add"},
          }
        }]
      },
      primitive: {topology: "triangle-list"},
      depthStencil: {depthWriteEnabled: false, depthCompare: "less", format: "depth24plus"},
    });
  }
  async morphTo(type, size = 40, duration = 200) {
    const originalIntensity = this.intensity;
    const steps = 10;
    const stepTime = duration / (steps * 2);
    for(let i = 0;i < steps;i++) {
      this.intensity *= 0.5;
      await new Promise(r => setTimeout(r, stepTime));
    }
    this.setGeometry(type, size);
    for(let i = 0;i < steps;i++) {
      this.intensity = originalIntensity * (i / steps);
      await new Promise(r => setTimeout(r, stepTime));
    }
    this.intensity = originalIntensity;
  }

  _uploadVertex(data) {
    const buf = this.device.createBuffer({
      size: data.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
    });
    this.device.queue.writeBuffer(buf, 0, data);
    return buf;
  }

  updateInstanceData(baseModelMatrix) {
    const local = mat4.identity();
    mat4.translate(local, this.localOffset, local);
    mat4.rotateX(local, this.localRotation[0], local);
    mat4.rotateY(local, this.localRotation[1], local);
    mat4.rotateZ(local, this.localRotation[2], local);

    if(this.activeRotate[0] !== 0) {mat4.rotateX(local, this.activeRotate[0] * this.time, local);}
    if(this.activeRotate[1] !== 0) {mat4.rotateY(local, this.activeRotate[1] * this.time, local);}
    if(this.activeRotate[2] !== 0) {mat4.rotateZ(local, this.activeRotate[2] * this.time, local);}

    const finalMat = mat4.identity();
    mat4.multiply(baseModelMatrix, local, finalMat);
    const timeSpeed = new Float32Array([this.time, this.speed, 0, 0]);
    const params = new Float32Array([this.intensity, this.turbulence, this.stretch, 0]);
    const tint = new Float32Array([...this.tint, this.tintStrength]);
    this.device.queue.writeBuffer(this.modelBuffer, 0, finalMat);
    this.device.queue.writeBuffer(this.modelBuffer, 64, timeSpeed);
    this.device.queue.writeBuffer(this.modelBuffer, 80, params);
    this.device.queue.writeBuffer(this.modelBuffer, 96, tint);
  }

  draw(pass, cameraMatrix) {
    this.device.queue.writeBuffer(this.cameraBuffer, 0, cameraMatrix);
    pass.setPipeline(this.pipeline);
    pass.setBindGroup(0, this.bindGroup);
    pass.setVertexBuffer(0, this.vertexBuffer);
    pass.setVertexBuffer(1, this.uvBuffer);
    pass.setIndexBuffer(this.indexBuffer, this.indexFormat);
    pass.drawIndexed(this.indexCount);
  }
  // Interface for effect -> (pass, mesh, viewProj)
  render(pass, mesh, viewProjMatrix) {
    this.time += 0.016;
    this.draw(pass, viewProjMatrix);
  }
}