import {mat4} from "wgpu-matrix";
import {GeometryFactory} from "../geometry-factory";

let spriteEffect = () => `struct CameraUniform {
    viewProjection : mat4x4<f32>,
}

struct SpriteInstanceData {
    // x: cols, y: rows, z: currentFrame, w: unused/padding
    schema : vec4<f32>,
    // x: pulseSpeed, y: pulseIntensity, z: floatSpeed, w: floatIntensity
    proceduralMove : vec4<f32>,
    // x: squashSpeed, y: squashIntensity, z: rotateSpeed, w: flashSpeed
    proceduralDeform : vec4<f32>,
    // xyz: flashColor, w: flashIntensity
    flashColor : vec4<f32>,
}

struct ModelUniform {
    transform : mat4x4<f32>,
    time : vec4<f32>, // x: globalTime, yzw: padding
    // An array containing standalone runtime setups for up to 4 sub-sprites on this mesh
    sprites : array<SpriteInstanceData, 4>,
}

@group(0) @binding(0) var<uniform> camera : CameraUniform;
@group(0) @binding(1) var<uniform> modelData : ModelUniform;
@group(0) @binding(2) var textureSampler : sampler;
@group(0) @binding(3) var textureMap : texture_2d<f32>;

struct VertexInput {
    @location(0) position : vec3<f32>,
    @location(1) uv : vec2<f32>,
}

struct VertexOutput {
    @builtin(position) position : vec4<f32>,
    @location(0) uv : vec2<f32>,
}

@vertex
fn vsMain(input : VertexInput) -> VertexOutput {
    var output : VertexOutput;
    let time = modelData.time.x;
    var localPos = input.position;

    // Use Sprite 0 parameters to drive the primary mesh geometry transformations
    let fx = modelData.sprites[0];

    // 1. Procedural Scale Pulsing
    if (fx.proceduralMove.x > 0.0) {
        let pulse = 1.0 + sin(time * fx.proceduralMove.x) * fx.proceduralMove.y;
        localPos.x *= pulse;
        localPos.y *= pulse;
    }

    // 2. Squash and Stretch
    if (fx.proceduralDeform.x > 0.0) {
        let squash = sin(time * fx.proceduralDeform.x) * fx.proceduralDeform.y;
        localPos.x *= (1.0 + squash);
        localPos.y *= (1.0 - squash);
    }

    // 3. Procedural Local Rotation
    if (fx.proceduralDeform.z != 0.0) {
        let angle = time * fx.proceduralDeform.z;
        let cosA = cos(angle);
        let sinA = sin(angle);
        let rx = localPos.x * cosA - localPos.y * sinA;
        let ry = localPos.x * sinA + localPos.y * cosA;
        localPos.x = rx;
        localPos.y = ry;
    }

    var worldPos = modelData.transform * vec4<f32>(localPos, 1.0);
    
    // 4. Floating Height Wave
    if (fx.proceduralMove.z > 0.0) {
        worldPos.y += sin(time * fx.proceduralMove.z) * fx.proceduralMove.w;
    }

    output.position = camera.viewProjection * worldPos;
    output.uv = input.uv;
    return output;
}

@fragment
fn fsMain(input : VertexOutput) -> @location(0) vec4<f32> {
    let time = modelData.time.x;
    
    // Default to sample using first configured sprite cell configuration 
    let sprite = modelData.sprites[0]; 
    let cols = sprite.schema.x;
    let rows = sprite.schema.y;
    let currentFrame = sprite.schema.z;

    let col = floor(currentFrame % cols);
    let row = floor(currentFrame / cols);

    let frameSize = vec2<f32>(1.0 / cols, 1.0 / rows);
    let offsetUv = vec2<f32>((input.uv.x + col) * frameSize.x, (input.uv.y + row) * frameSize.y);

    var finalColor = textureSample(textureMap, textureSampler, offsetUv);
    if (finalColor.a < 0.05) { discard; }

    // 5. Flash tinting color interpolation
    if (sprite.proceduralDeform.w > 0.0) {
        let flashWeight = (sin(time * sprite.proceduralDeform.w) * 0.5 + 0.5) * sprite.flashColor.w;
        finalColor = vec4<f32>(mix(finalColor.rgb, sprite.flashColor.rgb, flashWeight), finalColor.a);
    }

    return finalColor;
}`;

import {mat4} from "wgpu-matrix";
import {spriteEffectWGSL} from "../../shaders/sprite-effect/spriteEffect";
import {GeometryFactory} from "../geometry-factory";

export const SpritePresets = {
  default: {
    cols: 1, rows: 1, fps: 12, scale: 1.0,
    pulseSpeed: 0, pulseIntensity: 0,
    floatSpeed: 0, floatIntensity: 0,
    squashSpeed: 0, squashIntensity: 0,
    rotateSpeed: 0, flashSpeed: 0,
    flashColor: [1, 1, 1], flashIntensity: 0,
    localOffset: [0, 0, 0], localRotation: [0, 0, 0], activeRotate: [0, 0, 0]
  },
  coin: {
    cols: 4, rows: 4, fps: 16, scale: 2.0,
    pulseSpeed: 4.0, pulseIntensity: 0.1,
    floatSpeed: 2.5, floatIntensity: 0.3,
    squashSpeed: 0, squashIntensity: 0,
    rotateSpeed: 0, flashSpeed: 0,
    flashColor: [1, 1, 1], flashIntensity: 0,
    localOffset: [0, 0, 0], localRotation: [0, 0, 0], activeRotate: [0, 0, 0]
  },
  jelloMonster: {
    cols: 5, rows: 3, fps: 8, scale: 3.0,
    pulseSpeed: 0, pulseIntensity: 0,
    floatSpeed: 0, floatIntensity: 0,
    squashSpeed: 6.0, squashIntensity: 0.2,
    rotateSpeed: 0, flashSpeed: 4.0,
    flashColor: [1, 0, 0], flashIntensity: 0.5,
    localOffset: [0, 0, 0], localRotation: [0, 0, 0], activeRotate: [0, 0, 0]
  }
};

export class SpriteEffect {
  constructor(device, format, colorFormat, params = {}, cameraBuffer, materialTextures = {}) {
    this.device = device;
    this.format = format;
    this.cameraBuffer = cameraBuffer;
    this.colorFormat = colorFormat ?? format;

    // Handle texture inputs from the material block context
    this.sampler = materialTextures.sampler;
    this.textureView = materialTextures.textureView;

    const config = typeof params === 'string' ? SpritePresets[params] : params;
    const defaults = SpritePresets.default;

    // Sprite state storage for up to 4 internal layers inside this instance
    this.spriteLayers = Array.from({length: 4}, () => ({
      cols: defaults.cols, rows: defaults.rows, totalFrames: defaults.cols * defaults.rows,
      currentFrame: 0, fps: defaults.fps, frameTimeAccumulator: 0, isPlaying: true, loop: true,
      pulseSpeed: defaults.pulseSpeed, pulseIntensity: defaults.pulseIntensity,
      floatSpeed: defaults.floatSpeed, floatIntensity: defaults.floatIntensity,
      squashSpeed: defaults.squashSpeed, squashIntensity: defaults.squashIntensity,
      rotateSpeed: defaults.rotateSpeed, flashSpeed: defaults.flashSpeed,
      flashColor: [...defaults.flashColor], flashIntensity: defaults.flashIntensity
    }));

    // Prime layer 0 with our initial configuration params
    Object.assign(this.spriteLayers[0], {
      cols: config.cols ?? defaults.cols,
      rows: config.rows ?? defaults.rows,
      totalFrames: (config.cols ?? defaults.cols) * (config.rows ?? defaults.rows),
      fps: config.fps ?? defaults.fps,
      pulseSpeed: config.pulseSpeed ?? defaults.pulseSpeed,
      pulseIntensity: config.pulseIntensity ?? defaults.pulseIntensity,
      floatSpeed: config.floatSpeed ?? defaults.floatSpeed,
      floatIntensity: config.floatIntensity ?? defaults.floatIntensity,
      squashSpeed: config.squashSpeed ?? defaults.squashSpeed,
      squashIntensity: config.squashIntensity ?? defaults.squashIntensity,
      rotateSpeed: config.rotateSpeed ?? defaults.rotateSpeed,
      flashSpeed: config.flashSpeed ?? defaults.flashSpeed,
      flashColor: config.flashColor ? [...config.flashColor] : [...defaults.flashColor],
      flashIntensity: config.flashIntensity ?? defaults.flashIntensity
    });

    this.scale = config.scale ?? defaults.scale;
    this.time = 0;
    this.enabled = true;
    this.localOffset = config.localOffset ?? defaults.localOffset;
    this.localRotation = config.localRotation ?? defaults.localRotation;
    this.activeRotate = config.activeRotate ?? defaults.activeRotate;

    this._initPipeline();
    this.setGeometry("quad", this.scale);

    this._localMatrix = mat4.create();
    this._finalMatrix = mat4.create();

    // Packing mapping: 16 (mat4) + 4 (time vector) + 4 * 16 (4 SpriteInstanceData arrays of 4 vec4s) = 84 floats
    this._uniformData = new Float32Array(84);
  }

  // --- API Functions for driving sub-layer frames explicitly ---
  setSubLayerSchema(index, cols, rows, fps = 12) {
    if(index < 0 || index >= 4) return;
    const layer = this.spriteLayers[index];
    layer.cols = cols;
    layer.rows = rows;
    layer.totalFrames = cols * rows;
    layer.fps = fps;
    layer.currentFrame = 0;
  }

  setSubLayerFX(index, type, val1, val2, color = [1, 1, 1]) {
    if(index < 0 || index >= 4) return;
    const layer = this.spriteLayers[index];
    if(type === "pulse") {layer.pulseSpeed = val1; layer.pulseIntensity = val2;}
    if(type === "float") {layer.floatSpeed = val1; layer.floatIntensity = val2;}
    if(type === "squash") {layer.squashSpeed = val1; layer.squashIntensity = val2;}
    if(type === "rotate") {layer.rotateSpeed = val1;}
    if(type === "flash") {layer.flashSpeed = val1; layer.flashIntensity = val2; layer.flashColor = color;}
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
    this.modelBuffer = this.device.createBuffer({
      size: this._uniformData.byteLength,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });

    const bindGroupLayout = this.device.createBindGroupLayout({
      entries: [
        {binding: 0, visibility: GPUShaderStage.VERTEX, buffer: {type: "uniform"}},
        {binding: 1, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: {type: "uniform"}},
        {binding: 2, visibility: GPUShaderStage.FRAGMENT, sampler: {type: "filtering"}},
        {binding: 3, visibility: GPUShaderStage.FRAGMENT, texture: {sampleType: "float", viewDimension: "2d"}},
      ]
    });

    this.bindGroup = this.device.createBindGroup({
      layout: bindGroupLayout,
      entries: [
        {binding: 0, resource: {buffer: this.cameraBuffer}},
        {binding: 1, resource: {buffer: this.modelBuffer}},
        {binding: 2, resource: this.sampler},
        {binding: 3, resource: this.textureView},
      ]
    });

    const shaderModule = this.device.createShaderModule({code: spriteEffect()});
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
        targets: [
          {
            format: this.colorFormat,
            blend: {
              color: {srcFactor: "src-alpha", dstFactor: "one-minus-src-alpha", operation: "add"},
              alpha: {srcFactor: "one", dstFactor: "one-minus-src-alpha", operation: "add"},
            }
          },
          {format: 'rgba16float'},
          {format: 'rgba16float'}
        ]
      },
      primitive: {topology: "triangle-list"},
      depthStencil: {depthWriteEnabled: true, depthCompare: "less", format: "depth24plus"},
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

    // Pack Transform matrix & time definitions
    this._uniformData.set(finalMat, 0);
    this._uniformData[16] = this.time;
    this._uniformData[17] = 0;
    this._uniformData[18] = 0;
    this._uniformData[19] = 0;

    // Line up and structure the uniform configurations for all 4 sub-sprites
    for(let i = 0;i < 4;i++) {
      const layer = this.spriteLayers[i];
      let offset = 20 + (i * 16);

      // vec4 Schema parameters
      this._uniformData[offset + 0] = layer.cols;
      this._uniformData[offset + 1] = layer.rows;
      this._uniformData[offset + 2] = layer.currentFrame;
      this._uniformData[offset + 3] = 0.0; // padding

      // vec4 proceduralMove options
      this._uniformData[offset + 4] = layer.pulseSpeed;
      this._uniformData[offset + 5] = layer.pulseIntensity;
      this._uniformData[offset + 6] = layer.floatSpeed;
      this._uniformData[offset + 7] = layer.floatIntensity;

      // vec4 proceduralDeform options
      this._uniformData[offset + 8] = layer.squashSpeed;
      this._uniformData[offset + 9] = layer.squashIntensity;
      this._uniformData[offset + 10] = layer.rotateSpeed;
      this._uniformData[offset + 11] = layer.flashSpeed;

      // vec4 color parameters
      this._uniformData[offset + 12] = layer.flashColor[0];
      this._uniformData[offset + 13] = layer.flashColor[1];
      this._uniformData[offset + 14] = layer.flashColor[2];
      this._uniformData[offset + 15] = layer.flashIntensity;
    }

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
    const deltaTime = 0.016; // Match loop internal delta step calculation
    this.time += deltaTime;

    // Handle frame tick increments inside layers array loop execution
    for(let i = 0;i < 4;i++) {
      const layer = this.spriteLayers[i];
      if(layer.isPlaying) {
        layer.frameTimeAccumulator += deltaTime;
        const targetDuration = 1.0 / layer.fps;
        if(layer.frameTimeAccumulator >= targetDuration) {
          layer.currentFrame += Math.floor(layer.frameTimeAccumulator / targetDuration);
          layer.frameTimeAccumulator %= targetDuration;
          if(layer.currentFrame >= layer.totalFrames) {
            layer.currentFrame = layer.loop ? 0 : layer.totalFrames - 1;
            if(!layer.loop) layer.isPlaying = false;
          }
        }
      }
    }

    this.draw(pass, viewProjMatrix);
  }
}