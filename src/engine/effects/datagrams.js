import {mat4} from "wgpu-matrix";
import {LOG_FUNNY_ARCADE} from "../utils";
import {cryptoGridShader} from "../../shaders/diagrams/crypto-grid";

export class ChartsEffect {
  constructor(device, format, maxInstances = 512, cameraBuffer) {
    this.device = device;
    this.format = format;
    this.enabled = true;
    this.maxInstances = maxInstances;
    this.floatsPerInstance = 4; // r,g,b,height
    this.instanceData = new Float32Array(maxInstances * this.floatsPerInstance);
    this.timeSteps = 0;
    this.coinCount = 0;
    this.spacing = 1.2;
    this.cubeHeight = 4.0;
    this.time = 0;
    this.cameraBuffer = cameraBuffer;
    this._finalModel = mat4.create();
    this._initPipeline();
  }

  _buildCubeGeometry() {
    const p = [
      0,1,0,0,1,0, 1,1,0,0,1,0, 1,1,1,0,1,0, 0,1,1,0,1,0,
      0,0,0,0,-1,0, 1,0,0,0,-1,0, 1,0,1,0,-1,0, 0,0,1,0,-1,0,
      1,0,0,1,0,0, 1,1,0,1,0,0, 1,1,1,1,0,0, 1,0,1,1,0,0,
      0,0,0,-1,0,0, 0,1,0,-1,0,0, 0,1,1,-1,0,0, 0,0,1,-1,0,0,
      0,0,1,0,0,1, 1,0,1,0,0,1, 1,1,1,0,0,1, 0,1,1,0,0,1,
      0,0,0,0,0,-1, 1,0,0,0,0,-1, 1,1,0,0,0,-1, 0,1,0,0,0,-1,
    ];
    const idx = [];
    for (let f = 0; f < 6; f++) { const o = f * 4; idx.push(o, o+1, o+2, o, o+2, o+3); }
    return {vertices: new Float32Array(p), indices: new Uint16Array(idx)};
  }

  _initPipeline() {
    const cube = this._buildCubeGeometry();
    const posData = new Float32Array(cube.vertices.length / 2);
    const normData = new Float32Array(cube.vertices.length / 2);
    for (let i = 0, v = 0; i < cube.vertices.length; i += 6, v += 3) {
      posData.set(cube.vertices.subarray(i, i + 3), v);
      normData.set(cube.vertices.subarray(i + 3, i + 6), v);
    }
    this.vertexBuffer = this._upload(posData, GPUBufferUsage.VERTEX);
    this.normalBuffer = this._upload(normData, GPUBufferUsage.VERTEX);
    const padded = Math.ceil(cube.indices.byteLength / 4) * 4;
    this.indexBuffer = this.device.createBuffer({size: padded, usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST});
    this.device.queue.writeBuffer(this.indexBuffer, 0, cube.indices);
    this.indexCount = cube.indices.length;

    this.instanceBuffer = this.device.createBuffer({
      label: 'crypto-grid instanceBuffer',
      size: this.maxInstances * this.floatsPerInstance * 4,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
    });
    // baseModel(64) + timeSteps,coinCount,spacing,cubeHeight(16) + time,pad,pad,pad(16)
    this.gridUniformBuffer = this.device.createBuffer({
      label: 'crypto-grid gridUniformBuffer',
      size: 96,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });

    const bindGroupLayout = this.device.createBindGroupLayout({
      entries: [
        {binding: 0, visibility: GPUShaderStage.VERTEX, buffer: {}},
        {binding: 1, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: {type: "read-only-storage"}},
        {binding: 2, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: {}},
      ]
    });
    this.bindGroup = this.device.createBindGroup({
      layout: bindGroupLayout,
      entries: [
        {binding: 0, resource: {buffer: this.cameraBuffer}},
        {binding: 1, resource: {buffer: this.instanceBuffer}},
        {binding: 2, resource: {buffer: this.gridUniformBuffer}},
      ]
    });

    const shaderModule = this.device.createShaderModule({code: cryptoGridShader});
    this.pipeline = this.device.createRenderPipeline({
      layout: this.device.createPipelineLayout({bindGroupLayouts: [bindGroupLayout]}),
      vertex: {
        module: shaderModule, entryPoint: "vsMain",
        buffers: [
          {arrayStride: 12, attributes: [{shaderLocation: 0, offset: 0, format: "float32x3"}]},
          {arrayStride: 12, attributes: [{shaderLocation: 1, offset: 0, format: "float32x3"}]}
        ]
      },
      fragment: {
        module: shaderModule, entryPoint: "fsMain",
        targets: [{format: this.format}, {format: 'rgba16float'}, {format: 'rgba16float'}]
      },
      primitive: {topology: "triangle-list", cullMode: "none"},
      depthStencil: {depthWriteEnabled: true, depthCompare: "less", format: "depth24plus"}
    });
  }

  _upload(data, usage) {
    const buf = this.device.createBuffer({size: data.byteLength, usage: usage | GPUBufferUsage.COPY_DST});
    this.device.queue.writeBuffer(buf, 0, data);
    return buf;
  }

  updateData(grid) {
    const {coinCount, timeSteps, coins} = grid;
    const total = coinCount * timeSteps;
    if (total > this.maxInstances) {
      console.warn(`%cCryptoGridEffect: ${total} exceeds maxInstances`, LOG_FUNNY_ARCADE);
    }
    coins.forEach((coin, c) => {
      const range = Math.max(coin.max - coin.min, 1e-6);
      for (let t = 0; t < timeSteps; t++) {
        const i = c * timeSteps + t;
        if (i >= this.maxInstances) continue;
        const v = coin.samples[t];
        const prev = t > 0 ? coin.samples[t - 1] : v;
        const h = (v - coin.min) / range;
        // green when price rose vs previous sample, red when it fell — instant visual read of trend
        const rising = v >= prev;
        const col = rising ? [0.2, 0.9, 0.4] : [0.95, 0.25, 0.2];
        const o = i * this.floatsPerInstance;
        this.instanceData[o] = col[0];
        this.instanceData[o + 1] = col[1];
        this.instanceData[o + 2] = col[2];
        this.instanceData[o + 3] = h;
      }
    });
    this.coinCount = coinCount;
    this.timeSteps = timeSteps;
    this.device.queue.writeBuffer(this.instanceBuffer, 0, this.instanceData.subarray(0, Math.min(total, this.maxInstances) * this.floatsPerInstance));
  }

  // standard per-frame hook, called automatically by engine loop
  updateInstanceData(baseModelMatrix) {
    this.time += 0.016;
    this.device.queue.writeBuffer(this.gridUniformBuffer, 0, baseModelMatrix);
    this.device.queue.writeBuffer(this.gridUniformBuffer, 64, new Uint32Array([this.timeSteps, this.coinCount]));
    this.device.queue.writeBuffer(this.gridUniformBuffer, 72, new Float32Array([this.spacing, this.cubeHeight]));
    this.device.queue.writeBuffer(this.gridUniformBuffer, 80, new Float32Array([this.time]));
  }

  render(pass, mesh, viewProjMatrix) {
    if (this.timeSteps === 0) return;
    this.device.queue.writeBuffer(this.cameraBuffer, 0, viewProjMatrix);
    pass.setPipeline(this.pipeline);
    pass.setBindGroup(0, this.bindGroup);
    pass.setVertexBuffer(0, this.vertexBuffer);
    pass.setVertexBuffer(1, this.normalBuffer);
    pass.setIndexBuffer(this.indexBuffer, "uint16");
    pass.drawIndexed(this.indexCount, Math.min(this.timeSteps * this.coinCount, this.maxInstances));
  }
}