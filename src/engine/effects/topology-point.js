import {pointEffectShader} from "../../shaders/topology-point/pointEffect";

export class PointEffect {
  constructor(device, format) {
    this.device = device;
    this.format = format;
    this.pointSize = 8.0;
    this.enabled = true;
    this._initPipeline();
  }

  _initPipeline() {
    // Camera uniform buffer
    this.cameraBuffer = this.device.createBuffer({
      size: 64,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });

    // Model buffer
    this.modelBuffer = this.device.createBuffer({
      size: 64, // mat4x4
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });

    // Point settings buffer
    this.pointSettingsBuffer = this.device.createBuffer({
      size: 32,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });
    
    this.device.queue.writeBuffer(
      this.pointSettingsBuffer, 
      0, 
      new Float32Array([this.pointSize, 0, 0, 0])
    );

    const bindGroupLayout = this.device.createBindGroupLayout({
      entries: [
        { binding: 0, visibility: GPUShaderStage.VERTEX, buffer: {} },
        { binding: 1, visibility: GPUShaderStage.VERTEX, buffer: {} },
        { binding: 2, visibility: GPUShaderStage.VERTEX, buffer: {} },
      ]
    });

    this.bindGroup = this.device.createBindGroup({
      layout: bindGroupLayout,
      entries: [
        { binding: 0, resource: { buffer: this.cameraBuffer } },
        { binding: 1, resource: { buffer: this.modelBuffer } },
        { binding: 2, resource: { buffer: this.pointSettingsBuffer } },
      ]
    });

    const shaderModule = this.device.createShaderModule({ code: pointEffectShader });
    const pipelineLayout = this.device.createPipelineLayout({ 
      bindGroupLayouts: [bindGroupLayout] 
    });

    this.pipeline = this.device.createRenderPipeline({
      label: 'Topology Pipeline',
      layout: pipelineLayout,
      vertex: {
        module: shaderModule,
        entryPoint: "vsMain",
        buffers: [
          { 
            arrayStride: 3 * 4,
            stepMode: 'instance',
            attributes: [{ shaderLocation: 0, offset: 0, format: "float32x3" }] 
          },
          { 
            arrayStride: 3 * 4,
            stepMode: 'instance',
            attributes: [{ shaderLocation: 1, offset: 0, format: "float32x3" }] 
          }
        ]
      },
      fragment: {
        module: shaderModule,
        entryPoint: "fsMain",
        targets: [{ 
          format: this.format,
          blend: {
            color: { srcFactor: "src-alpha", dstFactor: "one-minus-src-alpha", operation: "add" },
            alpha: { srcFactor: "one", dstFactor: "one-minus-src-alpha", operation: "add" }
          }
        }]
      },
      primitive: { topology: "triangle-strip" },
      depthStencil: { 
        depthWriteEnabled: false, 
        depthCompare: "less-equal", 
        format: "depth24plus" 
      }
    });
  }

  // ✅ THIS MATCHES FlameEffect PATTERN
  updateInstanceData(baseModelMatrix) {
    // You can apply additional transforms here if needed
    // For now, just use the parent's model matrix directly
    this.device.queue.writeBuffer(this.modelBuffer, 0, baseModelMatrix);
  }

  draw(pass, cameraMatrix, vertexBuffer, colorBuffer, vertexCount) {
    if (!this.enabled) return;
    
    if (!vertexCount || typeof vertexCount !== 'number' || vertexCount <= 0) {
      console.warn('PointEffect: invalid vertexCount', vertexCount);
      return;
    }
    
    this.device.queue.writeBuffer(this.cameraBuffer, 0, cameraMatrix);

    pass.setPipeline(this.pipeline);
    pass.setBindGroup(0, this.bindGroup);
    pass.setVertexBuffer(0, vertexBuffer);
    pass.setVertexBuffer(1, colorBuffer);
    
    pass.draw(4, vertexCount, 0, 0);
  }

  render(pass, mesh, viewProjMatrix) {
    if (!mesh.vertexBuffer) {
      console.warn('PointEffect: mesh has no vertexBuffer');
      return;
    }
    
    let vertexCount = mesh.vertexCount;
    
    if (!vertexCount && mesh.vertexBuffer.size) {
      vertexCount = mesh.vertexBuffer.size / (3 * 4);
    }
    
    if (!vertexCount && mesh.geometry?.positions) {
      vertexCount = mesh.geometry.positions.length / 3;
    }
    
    if (!vertexCount || vertexCount <= 0) {
      console.warn('PointEffect: could not determine vertexCount', mesh);
      return;
    }
    
    const colorBuffer = mesh.vertexNormalsBuffer;
    
    if (!colorBuffer) {
      console.warn('PointEffect: mesh has no vertexNormalsBuffer');
      return;
    }
    
    this.draw(pass, viewProjMatrix, mesh.vertexBuffer, colorBuffer, vertexCount);
  }

  setPointSize(size) {
    this.pointSize = size;
    this.device.queue.writeBuffer(
      this.pointSettingsBuffer, 
      0, 
      new Float32Array([this.pointSize, 0, 0, 0])
    );
  }

  setEnabled(enabled) {
    this.enabled = enabled;
  }
}