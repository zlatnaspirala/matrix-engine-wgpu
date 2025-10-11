import {mat4} from "wgpu-matrix";
import {trailVertex} from "../../../../src/shaders/standalone/trail.vertex";
// import {trailFragment} from "../../../../src/shaders/standalone/trail.fragment";

export class TrailEffect {
  constructor(device, format, mesh, useBlending = true) {
    this.parentMesh = mesh;
    this.device = device;
    this.format = format;
    this.useBlending = useBlending;

    this.vertexBuffer = mesh.vertexBuffer;

    this._initPipeline(mesh.modelUniformBuffer);
    this._initBuffers();
    this._initTrailData();
  }

  async _initPipeline(modelUniformBuffer) {
    // BOTH FRAGMENT ALSO 
    const shaderModule = this.device.createShaderModule({code: trailVertex});

    // --- Camera + Trail uniforms ---
    this.cameraBuffer = this.device.createBuffer({
      size: 64,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    this.trailParamsBuffer = this.device.createBuffer({
      size: 32, // vec4 + 3 floats (padded)
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    this.indexBuffer = this.parentMesh.indexBuffer;
    this.indexCount = this.parentMesh.indexCount;

    const bindGroupLayout = this.device.createBindGroupLayout({
      label: "bindGroupLayout for trails",
      entries: [
        {binding: 0, visibility: GPUShaderStage.VERTEX, buffer: {}}, // camera
        {binding: 1, visibility: GPUShaderStage.VERTEX, buffer: {}},
        {binding: 2, visibility: GPUShaderStage.FRAGMENT | GPUShaderStage.VERTEX, buffer: {}}
      ],
    });

    this.modelBuffer = this.device.createBuffer({
      label: "modelBuffer for trails",
      size: 64,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    this.bindGroup = this.device.createBindGroup({
      label: "bindGroup for trails",
      layout: bindGroupLayout,
      entries: [
        {binding: 0, resource: {buffer: this.cameraBuffer}},
        {binding: 1, resource: {buffer: modelUniformBuffer}},
        {binding: 2, resource: {buffer: this.trailParamsBuffer}},
      ],
    });

    const blendConfig = undefined;
    // const blendConfig = {
    //   color: {srcFactor: 'one', dstFactor: 'one', operation: 'add'},
    //   alpha: {srcFactor: 'one', dstFactor: 'one', operation: 'add'},
    // };

    const pipelineLayout = this.device.createPipelineLayout({
      label: "pipelineLayout for trails",
      bindGroupLayouts: [bindGroupLayout],
    });

    this.pipeline = this.device.createRenderPipeline({
      label: "pipeline for trails",
      layout: pipelineLayout,
      vertex: {
        module: shaderModule,
        entryPoint: "vsMain",
        buffers: [
          {
            arrayStride: 5 * 4, // 5 floats per vertex
            attributes: [
              {shaderLocation: 0, offset: 0, format: "float32x3"}, // position
              {shaderLocation: 1, offset: 3 * 4, format: "float32x2"}, // uv
            ],
          },
        ],
      },
      fragment: {
        module: shaderModule,
        entryPoint: "fsMain",
        targets: [
          {
            format: this.format,
            blend: blendConfig,
          },
        ],
      },
      primitive: {
        topology: "triangle-list",// "triangle-strip",
      },
      depthStencil: {
        depthWriteEnabled: false,
        depthCompare: "always",
        format: "depth24plus",
      },
    });



  }

  _initBuffers() {
    // Simple trail geometry (quad strip)
    // const vertices = new Float32Array([
    //   // x, y, z,   u, v
    //   -0.1, 0, 0, 0, 0,
    //   0.1, 0, 0, 1, 0,
    //   -0.1, 0, 1, 0, 1,
    //   0.1, 0, 1, 1, 1,
    // ]);
    // const vertices = new Float32Array([
    //   -0.5, -0.5, 0, 0, 0,
    //   0.5, -0.5, 0, 1, 0,
    //   -0.5, 0.5, 0, 0, 1,
    //   0.5, 0.5, 0, 1, 1,
    // ]);

    // this.vertexBuffer = this.device.createBuffer({
    //   size: vertices.byteLength,
    //   usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    //   mappedAtCreation: true,
    // });
    // new Float32Array(this.vertexBuffer.getMappedRange()).set(vertices);
    // this.vertexBuffer.unmap();


  }

  // 🌀 store dynamic trail points
  _initTrailData() {
    this.maxPoints = 32;       // max trail points
    this.trailPoints = [];      // store positions
    this.lastPos = [0, 0, 0];
    this.minDist = 0.05;        // minimum movement to add new point
    this.segmentCount = 0;      // number of quads

    this.trailPoints.push([...this.lastPos]);
  }

  addPointIfMoved(pos) {
    const dx = pos[0] - this.lastPos[0];
    const dy = pos[1] - this.lastPos[1];
    const dz = pos[2] - this.lastPos[2];
    const distSq = dx * dx + dy * dy + dz * dz;

    if(distSq > this.minDist * this.minDist) {
      this.trailPoints.push([...pos]);
      if(this.trailPoints.length > this.maxPoints)
        this.trailPoints.shift();

      // this.lastPos = [...pos];
        this._updateBuffers();
    }
  }

  _updateBuffers() {
    if(this.trailPoints.length < 2) return;

    let verts = [];
    let indices = [];
    let idx = 0;

    for(let i = 0;i < this.trailPoints.length - 1;i++) {
      const p1 = this.trailPoints[i];
      const p2 = this.trailPoints[i + 1];

      // two vertices per point pair (quad strip)
      verts.push(
        p1[0] - 0.05, p1[1], p1[2], 0, 0,
        p1[0] + 0.05, p1[1], p1[2], 1, 0,
        p2[0] - 0.05, p2[1], p2[2], 0, 1,
        p2[0] + 0.05, p2[1], p2[2], 1, 1
      );

      // 6 indices per quad
      indices.push(
        idx, idx + 1, idx + 2,
        idx + 2, idx + 1, idx + 3
      );
      idx += 4;
    }

    const vertArray = new Float32Array(verts);
    const indexArray = new Uint16Array(indices);

    // --- recreate vertex buffer if needed
    if(!this.vertexBuffer || vertArray.byteLength > this.vertexBuffer.size) {
      this.vertexBuffer = this.device.createBuffer({
        size: vertArray.byteLength,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
      });
    }
    this.device.queue.writeBuffer(this.vertexBuffer, 0, vertArray);

    // --- recreate index buffer if needed
    if(!this.indexBuffer || indexArray.byteLength > this.indexBuffer.size) {
      this.indexBuffer = this.device.createBuffer({
        size: indexArray.byteLength,
        usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
      });
    }
    this.device.queue.writeBuffer(this.indexBuffer, 0, indexArray);

    this.segmentCount = indices.length / 6; // number of quads
  }

  update(camera, time, mesh, color = [0.2, 0.7, 1.0, 1.0], fadeLength = 11.2) {
    const viewProjMatrix = mat4.multiply(
      camera.projectionMatrix,
      camera.view,
      mat4.create(),
    );
    // this.device.queue.writeBuffer(this.modelUniformBuffer, 0, mesh.modelMatrix);
    this.device.queue.writeBuffer(this.cameraBuffer, 0, viewProjMatrix);
    // Update trail params
    const data = new Float32Array([...color, fadeLength, time, 0, 0]);
    this.device.queue.writeBuffer(this.trailParamsBuffer, 0, data.buffer);
  }

  // 🔄 Switch blend ON/OFF dynamically
  toggleBlend(useBlend) {
    if(this.useBlending !== useBlend) {
      this.useBlending = useBlend;
      this._initPipeline(); // rebuild pipeline with new blend config
    }
  }
}