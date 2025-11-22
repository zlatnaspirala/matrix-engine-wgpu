import {geoInstancedTexEffect} from "../../shaders/standalone/geo.tex.js";
import {GeometryFactory} from "../geometry-factory.js";
import {mat4} from "wgpu-matrix";

export class GenGeoTexture2 {
  constructor(device, format, type = "sphere", path, scale = 1) {
    this.device = device;
    this.format = format;
    const geom = GeometryFactory.create(type, scale);
    this.vertexData = geom.positions;
    this.uvData = geom.uvs;
    this.indexData = geom.indices;
    this.enabled = true;

    this.rotateEffect = true;
    this.rotateEffectSpeed = 10;
    this.rotateAngle = 0;
    this.loadTexture(path).then(() => {
      this._initPipeline();
    })
  }

  async loadTexture(url) {
    return new Promise(async (resolve, reject) => {
      const img = await fetch(url).then(r => r.blob()).then(createImageBitmap);
      const texture = this.device.createTexture({
        size: [img.width, img.height, 1],
        format: "rgba8unorm",
        usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
      });

      this.device.queue.copyExternalImageToTexture(
        {source: img},
        {texture},
        [img.width, img.height]
      );

      const sampler = this.device.createSampler({
        magFilter: "linear",
        minFilter: "linear",
        addressModeU: "repeat",
        addressModeV: "repeat"
      });

      this.texture = texture;
      this.sampler = sampler;
      resolve()
    })
  }

  _initPipeline() {
    const {vertexData, uvData, indexData} = this;

  // --- POSITION BUFFER (aligned)
  this.vertexBuffer = this.device.createBuffer({
    size: Math.ceil(vertexData.byteLength / 4) * 4,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
  });
  this.device.queue.writeBuffer(this.vertexBuffer, 0, vertexData);

  // --- UV BUFFER (aligned)
  this.uvBuffer = this.device.createBuffer({
    size: Math.ceil(uvData.byteLength / 4) * 4,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
  });
  this.device.queue.writeBuffer(this.uvBuffer, 0, uvData);

  // --- INDEX BUFFER (aligned)
  const alignedIndexSize = Math.ceil(indexData.byteLength / 4) * 4;
  this.indexBuffer = this.device.createBuffer({
    size: alignedIndexSize,
    usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST
  });

  // Create a temporary padded buffer if necessary
  if (indexData.byteLength !== alignedIndexSize) {
    const tmp = new Uint8Array(alignedIndexSize);
    tmp.set(new Uint8Array(indexData.buffer));
    this.device.queue.writeBuffer(this.indexBuffer, 0, tmp);
  } else {
    this.device.queue.writeBuffer(this.indexBuffer, 0, indexData);
  }

  this.indexCount = indexData.length;

  // --- rest of your setup (no change)
  this.cameraBuffer = this.device.createBuffer({
    size: 64,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
  });

  this.instanceTargets = [];
  this.lerpSpeed = 0.05;
  this.maxInstances = 5;
  this.instanceCount = 2;
  this.floatsPerInstance = 16 + 4;

  for (let x = 0; x < this.maxInstances; x++) {
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
    size: Math.ceil(this.instanceData.byteLength / 4) * 4,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
  });


    const bindGroupLayout = this.device.createBindGroupLayout({
      entries: [
        {binding: 0, visibility: GPUShaderStage.VERTEX, buffer: {}},
        {binding: 1, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: {type: "read-only-storage"}},
        {binding: 2, visibility: GPUShaderStage.FRAGMENT, sampler: {}},
        {binding: 3, visibility: GPUShaderStage.FRAGMENT, texture: {}},
      ],
    });

    this.bindGroup = this.device.createBindGroup({
      layout: bindGroupLayout,
      entries: [
        {binding: 0, resource: {buffer: this.cameraBuffer}},
        {binding: 1, resource: {buffer: this.modelBuffer}},
        {binding: 2, resource: this.sampler},
        {binding: 3, resource: this.texture.createView()},
      ]
    });

    const shaderModule = this.device.createShaderModule({code: geoInstancedTexEffect});
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
    if(this.rotateEffect) {
      this.rotateAngle = (this.rotateAngle ?? 0) + this.rotateEffectSpeed; // accumulate rotation
      if (this.rotateAngle >= 360) {
        this.rotateAngle = 0;
      }
    }
    const count = Math.min(this.instanceCount, this.maxInstances);
    for(let i = 0;i < count;i++) {
      const t = this.instanceTargets[i];
      // smooth interpolation of position & scale
      for(let j = 0;j < 3;j++) {
        t.currentPosition[j] += (t.position[j] - t.currentPosition[j]) * this.lerpSpeed;
        t.currentScale[j] += (t.scale[j] - t.currentScale[j]) * this.lerpSpeed;
      }
      const local = mat4.identity();
      if(this.rotateEffect == true) {
        mat4.rotateY(local, this.rotateAngle, local);
      }
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