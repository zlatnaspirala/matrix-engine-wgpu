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

    // Fixed: Track dirty state, but force the first frame initialization pass
    this.isDirty = true; 
    this.cameraMatrixDirty = false;
    this.lastCameraMatrix = null;

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
      format: 'rgba8unorm', // Matched for structural stability across setups
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
    this.maxInstances = 5;
    this.instanceCount = 2;
    
    // Fixed: Standardized to 32-float padding block boundaries (128 bytes) 
    // to cleanly isolate custom fields from the matrix transformation variables.
    this.floatsPerInstance = 32; 
    
    this.lastFrameTime = performance.now();
    this.frameTimeMs = 16; 
    
    for(let x = 0; x < this.maxInstances; x++) {
      this.instanceTargets.push({
        index: x,
        position: [x * 1.5, 0, 0], // Give distinct starting offsets so objects do not overlap
        currentPosition: [x * 1.5, 0, 0],
        scale: [1, 1, 1],
        currentScale: [1, 1, 1],
        color: [0.6, 0.8, 1.0, 0.4],
        isDirty: true, // Force write execution on startup loop pass
      });
    }

    this.instanceData = new Float32Array(this.maxInstances * this.floatsPerInstance);
    this.modelBuffer = this.device.createBuffer({
      label: 'geo-texture modelBuffer',
      size: this.instanceData.byteLength * 4,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });

    const bindGroupLayout = this.device.createBindGroupLayout({
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
      layout: bindGroupLayout,
      entries: [
        {binding: 0, resource: {buffer: this.cameraBuffer}},
        {binding: 1, resource: {buffer: this.modelBuffer}},
        {binding: 2, resource: this.sampler},
        {binding: 3, resource: this.texture.createView()},
      ]
    });

    const shaderModule = this.device.createShaderModule({code: geoInstancedTexEffect()});
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
        targets: [
          {
            format: this.format,
            blend: {
              color: { srcFactor: 'src-alpha', dstFactor: 'one-minus-src-alpha', operation: 'add' },
              alpha: { srcFactor: 'one', dstFactor: 'one-minus-src-alpha', operation: 'add' },
            },
          }, 
          { format: 'rgba16float' },
          { format: 'rgba16float' }
        ]
      },
      primitive: {topology: 'triangle-list'},
      depthStencil: {depthWriteEnabled: false, depthCompare: 'less-equal', format: 'depth24plus'}
    });
  }

  updateInstanceData = (baseModelMatrix) => {
    if(!this.instanceData) return;

    const now = performance.now();
    this.frameTimeMs = now - this.lastFrameTime;
    this.lastFrameTime = now;

    const clampedFrameTime = Math.min(this.frameTimeMs, 50) / 1000; 

    if(this.rotateEffect) {
      this.rotateAngle += this.rotateEffectSpeed * clampedFrameTime;
      if(this.rotateAngle >= 360) this.rotateAngle -= 360;
    }

    const count = Math.min(this.instanceCount, this.maxInstances);
    let anyInstanceDirty = false;

    for(let i = 0; i < count; i++) {
      const t = this.instanceTargets[i];
      let instanceUpdated = false;
      const frameAwareLerpSpeed = this.lerpSpeed * clampedFrameTime * 60; 

      for(let j = 0; j < 3; j++) {
        const oldPos = t.currentPosition[j];
        const oldScale = t.currentScale[j];

        t.currentPosition[j] += (t.position[j] - t.currentPosition[j]) * frameAwareLerpSpeed;
        t.currentScale[j] += (t.scale[j] - t.currentScale[j]) * frameAwareLerpSpeed;

        if(Math.abs(t.currentPosition[j] - oldPos) > 0.0001 ||
          Math.abs(t.currentScale[j] - oldScale) > 0.0001) {
          instanceUpdated = true;
        }
      }

      // Fixed: Enforce full buffer verification layout generation pass on the initial frame
      if(!instanceUpdated && t.isDirty === false && !this.isDirty) {
        continue; 
      }

      anyInstanceDirty = true;
      t.isDirty = false;

      mat4.identity(this.localMatrix);
      if(this.rotateEffect === true) {
        mat4.rotateY(this.localMatrix, this.rotateAngle, this.localMatrix);
      }

      mat4.translate(this.localMatrix, t.currentPosition, this.localMatrix);
      mat4.scale(this.localMatrix, t.currentScale, this.localMatrix);
      mat4.multiply(baseModelMatrix, this.localMatrix, this.finalMatrix);

      const offset = i * this.floatsPerInstance;
      this.instanceData.set(this.finalMatrix, offset);
      this.instanceData.set(t.color, offset + 16); 
    }

    if(anyInstanceDirty || this.isDirty) {
      this.isDirty = false;
      this.device.queue.writeBuffer(
        this.modelBuffer,
        0,
        this.instanceData.subarray(0, count * this.floatsPerInstance)
      );
    }
  };

  render(transPass, mesh, viewProjMatrix) {
    if (!this.pipeline) return; // Prevent calls before texture asynchronous load completes
    
    this.updateInstanceData(mesh.modelMatrix || mat4.identity(this.localMatrix));

    if(!this.lastCameraMatrix || !this._matricesEqual(this.lastCameraMatrix, viewProjMatrix)) {
      this.device.queue.writeBuffer(this.cameraBuffer, 0, viewProjMatrix);
      this.lastCameraMatrix = new Float32Array(viewProjMatrix);
    }

    transPass.setPipeline(this.pipeline);
    transPass.setBindGroup(0, this.bindGroup);
    transPass.setVertexBuffer(0, this.vertexBuffer);
    transPass.setVertexBuffer(1, this.uvBuffer);
    transPass.setIndexBuffer(this.indexBuffer, 'uint16');
    transPass.drawIndexed(this.indexCount, this.instanceCount);
  }

  _matricesEqual(m1, m2) {
    for(let i = 0; i < 16; i++) {
      if(Math.abs(m1[i] - m2[i]) > 0.0001) return false;
    }
    return true;
  }
}