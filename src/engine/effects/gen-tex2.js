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

    // Mobile optimization: track dirty state to avoid redundant GPU uploads
    this.isDirty = false;
    this.cameraMatrixDirty = false;
    this.lastCameraMatrix = null;

    // Reusable matrix buffers to reduce allocations
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
      // Mobile optimization: use rgba8unorm instead of rgba16float
      // Reduces memory bandwidth by 50% on mobile GPUs
      format: 'rgba8unorm',
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
  }

  _initPipeline() {
    const {vertexData, uvData, indexData} = this;

    // --- POSITION BUFFER (aligned)
    const alignedVertexSize = Math.ceil(vertexData.byteLength / 4) * 4;
    this.vertexBuffer = this.device.createBuffer({
      size: alignedVertexSize,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
    });
    this.device.queue.writeBuffer(this.vertexBuffer, 0, vertexData);

    // --- UV BUFFER (aligned)
    const alignedUVSize = Math.ceil(uvData.byteLength / 4) * 4;
    this.uvBuffer = this.device.createBuffer({
      size: alignedUVSize,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
    });
    this.device.queue.writeBuffer(this.uvBuffer, 0, uvData);

    // --- INDEX BUFFER (aligned, mobile optimization)
    const alignedIndexSize = Math.ceil(indexData.byteLength / 4) * 4;
    this.indexBuffer = this.device.createBuffer({
      size: alignedIndexSize,
      usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST
    });

    // Mobile optimization: create aligned buffer once, reuse for all writes
    if(indexData.byteLength !== alignedIndexSize) {
      const paddedIndexData = new Uint8Array(alignedIndexSize);
      paddedIndexData.set(new Uint8Array(indexData.buffer));
      this.device.queue.writeBuffer(this.indexBuffer, 0, paddedIndexData);
    } else {
      this.device.queue.writeBuffer(this.indexBuffer, 0, indexData);
    }

    this.indexCount = indexData.length;

    // --- CAMERA BUFFER
    this.cameraBuffer = this.device.createBuffer({
      size: 64,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });

    this.instanceTargets = [];
    this.lerpSpeed = 0.05;
    this.maxInstances = 5;
    this.instanceCount = 2;
    this.floatsPerInstance = 16 + 4;

    // Mobile optimization: track frame time for frame-rate independent animation
    this.lastFrameTime = performance.now();
    this.frameTimeMs = 16; // default 60fps

    for(let x = 0;x < this.maxInstances;x++) {
      this.instanceTargets.push({
        index: x,
        position: [0, 0, 0],
        currentPosition: [0, 0, 0],
        scale: [1, 1, 1],
        currentScale: [1, 1, 1],
        color: [0.6, 0.8, 1.0, 0.4],
        isDirty: false, // track which instances changed
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
  }

  updateInstanceData = (baseModelMatrix) => {
    if(!this.instanceData) return;

    // Mobile optimization: track frame time for frame-rate independent animation
    const now = performance.now();
    this.frameTimeMs = now - this.lastFrameTime;
    this.lastFrameTime = now;

    // Clamp frame time to prevent huge jumps (e.g., when tab is unfocused)
    const clampedFrameTime = Math.min(this.frameTimeMs, 50) / 1000; // ms to seconds

    if(this.rotateEffect) {
      // Frame-time aware rotation
      this.rotateAngle += this.rotateEffectSpeed * clampedFrameTime;
      if(this.rotateAngle >= 360) {
        this.rotateAngle -= 360;
      }
    }

    const count = Math.min(this.instanceCount, this.maxInstances);
    let anyInstanceDirty = false;

    for(let i = 0;i < count;i++) {
      const t = this.instanceTargets[i];
      let instanceUpdated = false;

      // Mobile optimization: smooth interpolation with frame-time awareness
      const frameAwareLerpSpeed = this.lerpSpeed * clampedFrameTime * 60; // normalize to 60fps

      for(let j = 0;j < 3;j++) {
        const oldPos = t.currentPosition[j];
        const oldScale = t.currentScale[j];

        t.currentPosition[j] += (t.position[j] - t.currentPosition[j]) * frameAwareLerpSpeed;
        t.currentScale[j] += (t.scale[j] - t.currentScale[j]) * frameAwareLerpSpeed;

        if(Math.abs(t.currentPosition[j] - oldPos) > 0.0001 ||
          Math.abs(t.currentScale[j] - oldScale) > 0.0001) {
          instanceUpdated = true;
        }
      }

      if(!instanceUpdated && t.isDirty === false) {
        continue; // Skip GPU upload for unchanged instances
      }

      anyInstanceDirty = true;
      t.isDirty = true;

      // Mobile optimization: reuse matrix buffer to reduce allocations
      mat4.identity(this.localMatrix);

      if(this.rotateEffect === true) {
        mat4.rotateY(this.localMatrix, this.rotateAngle, this.localMatrix);
      }

      mat4.translate(this.localMatrix, t.currentPosition, this.localMatrix);
      mat4.scale(this.localMatrix, t.currentScale, this.localMatrix);

      // Combine matrices in-place to reduce allocations
      mat4.multiply(baseModelMatrix, this.localMatrix, this.finalMatrix);

      const offset = i * this.floatsPerInstance;
      this.instanceData.set(this.finalMatrix, offset);
      this.instanceData.set(t.color, offset + 16);
    }

    // Mobile optimization: only upload changed data to GPU
    if(anyInstanceDirty) {
      const activeFloatCount = count * this.floatsPerInstance;
      this.device.queue.writeBuffer(
        this.modelBuffer,
        0,
        this.instanceData.subarray(0, activeFloatCount)
      );
    }
  };

  draw(pass, cameraMatrix) {
    // Mobile optimization: cache camera matrix to avoid redundant uploads
    if(!this.lastCameraMatrix || !this._matricesEqual(this.lastCameraMatrix, cameraMatrix)) {
      this.device.queue.writeBuffer(this.cameraBuffer, 0, cameraMatrix);
      this.lastCameraMatrix = new Float32Array(cameraMatrix);
    }

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

  // Mobile optimization: quick matrix comparison to avoid redundant GPU uploads
  _matricesEqual(m1, m2) {
    for(let i = 0;i < 16;i++) {
      if(Math.abs(m1[i] - m2[i]) > 0.0001) {
        return false;
      }
    }
    return true;
  }
}
