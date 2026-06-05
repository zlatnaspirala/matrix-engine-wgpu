import {mat4} from "wgpu-matrix";
// import {kaleidoscopeEffectShader} from "../../shaders/kaleidoscope-effect/kaleidoscopeEffect";
import {GeometryFactory} from "../geometry-factory";
import {kaleidoscopeEffectShader} from "../../shaders/kale/kale.wgsl";

export const KaleidoscopePresets = {
  // Classic symmetric kaleidoscope
  classic: {
    intensity: 1.0,
    speed: 0.5,
    segments: 6,
    zoom: 1.0,
    colorShift: 0.0,
    colorShiftSpeed: 0.3,
    tint: [1.0, 1.0, 1.0],
    tintStrength: 0.0,
    scale: 2,
    localOffset: [0, 0, 0],
    localRotation: [0, 0, 0],
    activeRotate: [0, 0, 0]
  },
  // Fast rotating 8-segment
  fast: {
    intensity: 1.2,
    speed: 1.0,
    segments: 8,
    zoom: 1.2,
    colorShift: 0.0,
    colorShiftSpeed: 0.6,
    tint: [1.0, 1.0, 1.0],
    tintStrength: 0.0,
    scale: 2,
    localOffset: [0, 0, 0],
    localRotation: [0, 0, 0],
    activeRotate: [0, 0.5, 0]
  },
  // Slow, deep zoom
  deep: {
    intensity: 0.8,
    speed: 0.3,
    segments: 12,
    zoom: 2.5,
    colorShift: 0.0,
    colorShiftSpeed: 0.15,
    tint: [1.0, 1.0, 1.0],
    tintStrength: 0.0,
    scale: 2,
    localOffset: [0, 0, 0],
    localRotation: [0, 0, 0],
    activeRotate: [0, 0, 0]
  },
  // Psychedelic cyan/magenta
  psycho: {
    intensity: 1.5,
    speed: 1.4,
    segments: 7,
    zoom: 1.3,
    colorShift: 0.0,
    colorShiftSpeed: 1.2,
    tint: [0.0, 1.0, 1.0],
    tintStrength: 0.7,
    scale: 2,
    localOffset: [0, 0, 0],
    localRotation: [0, 0, 0],
    activeRotate: [0.3, 0.2, 0]
  },
  // Cool blues
  cool: {
    intensity: 1.0,
    speed: 0.7,
    segments: 10,
    zoom: 1.5,
    colorShift: 0.0,
    colorShiftSpeed: 0.4,
    tint: [0.2, 0.6, 1.0],
    tintStrength: 0.8,
    scale: 2,
    localOffset: [0, 0, 0],
    localRotation: [0, 0, 0],
    activeRotate: [0, 0.3, 0]
  },
  // Warm fire-like
  warm: {
    intensity: 1.3,
    speed: 0.6,
    segments: 5,
    zoom: 0.9,
    colorShift: 0.0,
    colorShiftSpeed: 0.25,
    tint: [1.0, 0.6, 0.2],
    tintStrength: 0.85,
    scale: 2,
    localOffset: [0, 0, 0],
    localRotation: [0, 0, 0],
    activeRotate: [0, 0.2, 0]
  }
};

export class KaleidoscopeEffect {
  constructor(device, format, shape = "quad", params = {}, cameraBuffer) {
    this.device = device;
    this.format = format;
    this.colorFormat = format;
    this.cameraBuffer = cameraBuffer;
    const config = typeof params === 'string' ? KaleidoscopePresets[params] : params;
    const defaults = KaleidoscopePresets.classic;
    this.intensity = config.intensity ?? defaults.intensity;
    this.speed = config.speed ?? defaults.speed;
    this.segments = config.segments ?? defaults.segments;
    this.zoom = config.zoom ?? defaults.zoom;
    this.colorShift = config.colorShift ?? defaults.colorShift;
    this.colorShiftSpeed = config.colorShiftSpeed ?? defaults.colorShiftSpeed;
    this.tint = config.tint ?? defaults.tint;
    this.tintStrength = config.tintStrength ?? defaults.tintStrength;
    this.scale = config.scale ?? defaults.scale;

    this.time = 0;
    this.enabled = true;
    this.localOffset = config.localOffset ?? defaults.localOffset;
    this.localRotation = config.localRotation ?? defaults.localRotation;
    this.activeRotate = config.activeRotate ?? defaults.activeRotate;

    this._initPipeline();
    this.setGeometry(shape, this.scale);

    this._localMatrix = mat4.create();
    this._finalMatrix = mat4.create();
    this._uniformData = new Float32Array(32);
  }

  setGeometry(type, size = 1, segments = 32) {
    const geo = GeometryFactory.create(type, size, segments);
    this.vertexBuffer = this._uploadVertex(geo.positions);
    this.uvBuffer = this._uploadVertex(geo.uvs);

    const byteLen = geo.indices.byteLength;
    const paddedByteLen = Math.ceil(byteLen / 4) * 4;
    this.indexBuffer = this.device.createBuffer({
      size: paddedByteLen,
      usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST
    });

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
    this.modelBuffer = this.device.createBuffer({
      size: 128,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });

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

    const shaderModule = this.device.createShaderModule({code: kaleidoscopeEffectShader});
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
            color: {srcFactor: "src-alpha", dstFactor: "one-minus-src-alpha", operation: "add"},
            alpha: {srcFactor: "one", dstFactor: "one-minus-src-alpha", operation: "add"},
          }
        },
        {format: this.colorFormat},{format: this.colorFormat}]
      },
      primitive: {topology: "triangle-list"},
      depthStencil: {depthWriteEnabled: false, depthCompare: "less", format: "depth24plus"},
    });
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
    const local = this._localMatrix;
    const finalMat = this._finalMatrix;

    mat4.identity(local);
    mat4.identity(finalMat);
    mat4.translate(local, this.localOffset, local);
    mat4.rotateX(local, this.localRotation[0], local);
    mat4.rotateY(local, this.localRotation[1], local);
    mat4.rotateZ(local, this.localRotation[2], local);

    if(this.activeRotate[0] !== 0) {mat4.rotateX(local, this.activeRotate[0] * this.time, local);}
    if(this.activeRotate[1] !== 0) {mat4.rotateY(local, this.activeRotate[1] * this.time, local);}
    if(this.activeRotate[2] !== 0) {mat4.rotateZ(local, this.activeRotate[2] * this.time, local);}

    mat4.multiply(baseModelMatrix, local, finalMat);

    // Pack uniforms: model matrix (16) + time/speed (2) + segments/zoom (2) + intensity/colorShift/colorShiftSpeed (3) + tint (3) + tintStrength (1) + padding
    this._uniformData.set(finalMat, 0); // 0-15: mat4
    this._uniformData[16] = this.time;
    this._uniformData[17] = this.speed;
    this._uniformData[18] = this.segments;
    this._uniformData[19] = this.zoom;
    this._uniformData[20] = this.intensity;
    this._uniformData[21] = this.colorShift;
    this._uniformData[22] = this.colorShiftSpeed;
    this._uniformData[23] = 0; // padding
    this._uniformData[24] = this.tint[0];
    this._uniformData[25] = this.tint[1];
    this._uniformData[26] = this.tint[2];
    this._uniformData[27] = this.tintStrength;

    this.device.queue.writeBuffer(this.modelBuffer, 0, this._uniformData);
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

  render(pass, mesh, viewProjMatrix) {
    this.time += 0.016;
    this.colorShift = (this.colorShift + 0.016 * this.colorShiftSpeed) % (Math.PI * 2);
    this.draw(pass, viewProjMatrix);
  }

  // Control setters
  setIntensity(intensity) {
    this.intensity = Math.max(0.1, intensity);
  }

  setSpeed(speed) {
    this.speed = Math.max(0.1, speed);
  }

  setSegments(segments) {
    this.segments = Math.max(3, Math.round(segments));
  }

  setZoom(zoom) {
    this.zoom = Math.max(0.1, zoom);
  }

  setColorShiftSpeed(speed) {
    this.colorShiftSpeed = Math.max(0, speed);
  }

  setTint(r, g, b) {
    this.tint = [r, g, b];
  }

  setTintStrength(strength) {
    this.tintStrength = Math.max(0, Math.min(1, strength));
  }
}