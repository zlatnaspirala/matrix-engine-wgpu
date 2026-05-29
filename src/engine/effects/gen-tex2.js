import {geoInstancedTexEffect} from "../../shaders/standalone/geo.tex.js";
import {GeometryFactory} from "../geometry-factory.js";
import {mat4} from "wgpu-matrix";

export class GenGeoTexture2 {
  constructor(device, format, type = "sphere", path, scale = 1, cameraBuffer) {
    this.device = device;
    this.format = format;
    this.cameraBuffer = cameraBuffer;
    const geom = GeometryFactory.create(type, scale);
    this.vertexData = geom.positions;
    this.uvData = geom.uvs;
    this.indexData = geom.indices;
    this.enabled = true;
    this.rotateEffect = true;
    this.rotateEffectSpeed = 10;
    this.rotateAngle = 0;
    this.isDirty = true;
    this.cameraMatrixDirty = false;
    this.lastCameraMatrix = new Float32Array(16);
    this.tempLocalMatrix = mat4.identity();
    this.isCameraInitialized = false;
    this.localMatrix = mat4.identity();
    this.finalMatrix = mat4.identity();

    this.loadTexture(path).then(() => {
      this._initPipeline();
    });
  }

  async loadTexture(url) {
    const img = await fetch(url).then(r => r.blob()).then(createImageBitmap);
    const texture = this.device.createTexture({
      size: [img.width, img.height, 1],
      format: 'rgba8unorm',
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
    });

    this.device.queue.copyExternalImageToTexture(
      {source: img},
      {texture},
      [img.width, img.height]
    );

    this.sampler = this.device.createSampler({
      magFilter: "linear",
      minFilter: "linear",
      addressModeU: "repeat",
      addressModeV: "repeat"
    });

    this.texture = texture;
  }

  _initPipeline() {
    const {vertexData, uvData, indexData} = this;

    this.vertexBuffer = this.device.createBuffer({
      size: Math.ceil(vertexData.byteLength / 4) * 4,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
    });
    this.device.queue.writeBuffer(this.vertexBuffer, 0, vertexData);

    this.uvBuffer = this.device.createBuffer({
      size: Math.ceil(uvData.byteLength / 4) * 4,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
    });
    this.device.queue.writeBuffer(this.uvBuffer, 0, uvData);

    const alignedIndexSize = Math.ceil(indexData.byteLength / 4) * 4;
    this.indexBuffer = this.device.createBuffer({
      size: alignedIndexSize,
      usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST
    });

    if(indexData.byteLength !== alignedIndexSize) {
      const paddedIndexData = new Uint8Array(alignedIndexSize);
      paddedIndexData.set(new Uint8Array(indexData.buffer));
      this.device.queue.writeBuffer(this.indexBuffer, 0, paddedIndexData);
    } else {
      this.device.queue.writeBuffer(this.indexBuffer, 0, indexData);
    }

    this.indexCount = indexData.length;
    this.instanceTargets = [];
    this.lerpSpeed = 0.05;
    this.maxInstances = 50;
    this.instanceCount = 2;
    this.floatsPerInstance = 20;
    this.lastFrameTime = performance.now();
    this.frameTimeMs = 16;

    for(let x = 0;x < this.maxInstances;x++) {
      this.instanceTargets.push({
        index: x,
        position: [0, 0, 0],
        currentPosition: [0, 0, 0],
        scale: [1, 1, 1],
        currentScale: [1, 1, 1],
        color: [0.6, 0.8, 1.0, 0.9],
        rotation: [0, 0, 0],
        isDirty: true,
      });
    }

    this.instanceData = new Float32Array(this.maxInstances * this.floatsPerInstance);
    this.modelBuffer = this.device.createBuffer({
      label: 'geo-texture modelBuffer',
      size: this.instanceData.byteLength * 4,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });

    this.bindGroupLayout = this.device.createBindGroupLayout({
      label: 'geo-texture bindGroupLayout',
      entries: [
        {binding: 0, visibility: GPUShaderStage.VERTEX, buffer: {}},
        {binding: 1, visibility: GPUShaderStage.VERTEX, buffer: {type: "read-only-storage"}},
        {binding: 2, visibility: GPUShaderStage.FRAGMENT, sampler: {}},
        {binding: 3, visibility: GPUShaderStage.FRAGMENT, texture: {}},
      ],
    });

    this.bindGroup = this.device.createBindGroup({
      label: 'geo-texture bindGroup',
      layout: this.bindGroupLayout,
      entries: [
        {binding: 0, resource: {buffer: this.cameraBuffer}},
        {binding: 1, resource: {buffer: this.modelBuffer}},
        {binding: 2, resource: this.sampler},
        {binding: 3, resource: this.texture.createView()},
      ]
    });

    const shaderModule = this.device.createShaderModule({code: geoInstancedTexEffect()});
    const pipelineLayout = this.device.createPipelineLayout({bindGroupLayouts: [this.bindGroupLayout]});

    this.pipeline = this.device.createRenderPipeline({
      label: 'geo tex 2 Pipeline',
      layout: pipelineLayout,
      vertex: {
        module: shaderModule,
        entryPoint: 'vsMain',
        buffers: [
          {arrayStride: 12, attributes: [{shaderLocation: 0, offset: 0, format: 'float32x3'}]},
          {arrayStride: 8, attributes: [{shaderLocation: 1, offset: 0, format: 'float32x2'}]}
        ]
      },
      fragment: {
        module: shaderModule,
        entryPoint: 'fsMain',
        targets: [
          {
            format: this.format,
            blend: {
              color: {srcFactor: 'src-alpha', dstFactor: 'one-minus-src-alpha', operation: 'add'},
              alpha: {srcFactor: 'one', dstFactor: 'one-minus-src-alpha', operation: 'add'},
            },
          },
          {format: 'rgba16float'},
          {format: 'rgba16float'}
        ]
      },
      primitive: {topology: 'triangle-list'},
      depthStencil: {depthWriteEnabled: false, depthCompare: 'less-equal', format: 'depth24plus'}
    });
  }

  updateInstanceCount(newCount) {
    if(newCount > this.maxInstances) {
      console.warn("Count exceeds maxInstances...");
      return false;
    }
    this.instanceCount = Math.max(0, newCount);
  }

  updateInstanceData = (baseModelMatrix) => {
    if(!this.instanceData) return;
    const now = performance.now();
    const deltaTime = (now - this.lastFrameTime) / 1000;
    this.lastFrameTime = now;
    const count = Math.min(this.instanceCount, this.maxInstances);
    let anyInstanceDirty = this.isDirty;

    for(let i = 0;i < count;i++) {
      const t = this.instanceTargets[i];
      if(this.rotateEffect) {
        t.rotation[1] += (this.rotateEffectSpeed * Math.PI / 180) * deltaTime;
        anyInstanceDirty = true;
      }

      // 2. Interpolate Position and Scale
      const frameAwareLerpSpeed = this.lerpSpeed * Math.min(deltaTime * 60, 1);
      for(let j = 0;j < 3;j++) {
        const prevPos = t.currentPosition[j];
        t.currentPosition[j] += (t.position[j] - t.currentPosition[j]) * frameAwareLerpSpeed;
        t.currentScale[j] += (t.scale[j] - t.currentScale[j]) * frameAwareLerpSpeed;
        if(Math.abs(t.currentPosition[j] - prevPos) > 0.0001) anyInstanceDirty = true;
      }

      if(anyInstanceDirty) {
        mat4.identity(this.tempLocalMatrix);
        mat4.translate(this.tempLocalMatrix, t.currentPosition, this.tempLocalMatrix);
        mat4.rotateX(this.tempLocalMatrix, t.rotation[0], this.tempLocalMatrix);
        mat4.rotateY(this.tempLocalMatrix, t.rotation[1], this.tempLocalMatrix);
        mat4.rotateZ(this.tempLocalMatrix, t.rotation[2], this.tempLocalMatrix);
        mat4.scale(this.tempLocalMatrix, t.currentScale, this.tempLocalMatrix);

        mat4.multiply(baseModelMatrix, this.tempLocalMatrix, this.finalMatrix);

        const offset = i * this.floatsPerInstance;
        this.instanceData.set(this.finalMatrix, offset);
        this.instanceData.set(t.color, offset + 16);
      }
    }

    if(anyInstanceDirty) {
      this.isDirty = false;
      this.device.queue.writeBuffer(this.modelBuffer, 0, this.instanceData.subarray(0, count * this.floatsPerInstance));
    }
  }

  render(transPass, mesh, viewProjMatrix) {
    if(!this.pipeline) return;

    // this.updateInstanceData(mesh.modelMatrix || mat4.identity(this.localMatrix));
     this.updateInstanceData(mesh.modelMatrix);

    // --- FIXED: Replaced "new Float32Array" allocation with an in-place typed array copy ---
    if(!this.isCameraInitialized || !this._matricesEqual(this.lastCameraMatrix, viewProjMatrix)) {
      this.device.queue.writeBuffer(this.cameraBuffer, 0, viewProjMatrix);
      this.lastCameraMatrix.set(viewProjMatrix); // Copies values directly without allocating memory
      this.isCameraInitialized = true;
    }

    transPass.setPipeline(this.pipeline);
    transPass.setBindGroup(0, this.bindGroup);
    transPass.setVertexBuffer(0, this.vertexBuffer);
    transPass.setVertexBuffer(1, this.uvBuffer);
    transPass.setIndexBuffer(this.indexBuffer, 'uint16');
    transPass.drawIndexed(this.indexCount, this.instanceCount);
  }

  _matricesEqual(m1, m2) {
    for(let i = 0;i < 16;i++) {
      if(Math.abs(m1[i] - m2[i]) > 0.0001) return false;
    }
    return true;
  }
}