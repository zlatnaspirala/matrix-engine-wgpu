import {mat4} from "wgpu-matrix";
import {LOG_FUNNY_ARCADE} from "../utils";
import {cryptoGridShader} from "../../shaders/diagrams/crypto-grid";

export class ChartsEffect {
  constructor(device, format, maxInstances = 64, cameraBuffer) {
    this.device = device;
    this.format = format;
    this.enabled = true;
    this.maxInstances = maxInstances;
    // r,g,b,height
    this.floatsPerInstance = 4;
    this.instanceData = new Float32Array(maxInstances * this.floatsPerInstance);
    this.timeSteps = 0;
    this.coinCount = 0;
    this.spacing = 1.2;
    this.cubeHeight = 4.0;
    this.smoothedHeights = new Float32Array(this.maxInstances).fill(0);
    this.time = 0;
    this.cameraBuffer = cameraBuffer;
    this.camera = app.getCamera()
    this._finalModel = mat4.create();
    this._initPipeline();
    this.labelContainer = this._createLabelContainer();
    this.titleContainer = this._createLabelContainer();
    this.labelMaxDistance = 30; 
  }

  _createLabelContainer() {
    const el = document.createElement('div');
    el.style.cssText = 'position:fixed;top:0;left:0;pointer-events:none;z-index:10;';
    document.body.appendChild(el);
    return el;
  }

updateLabels(coins, baseModelMatrix, viewProjMatrix, canvasWidth, canvasHeight) {
  const timeSteps = this.timeSteps;
  const total = coins.length * timeSteps;
  while (this.labelContainer.children.length < total) {
    const d = document.createElement('div');
    d.style.cssText = 'position:absolute;color:#fff;font:10px monospace;transform:translate(-50%,-100%);white-space:nowrap;';
    this.labelContainer.appendChild(d);
  }
  for (let i = total; i < this.labelContainer.children.length; i++) {
    this.labelContainer.children[i].style.display = 'none';
  }

  const newest = timeSteps - 1;
  const results = []; // NEW: collect all label placements first, sort after

  coins.forEach((coin, c) => {
    const range = Math.max(coin.max - coin.min, 1e-6);
    const z = c * this.spacing - (coins.length - 1) * this.spacing * 0.5;

    for (let t = 0; t < timeSteps; t++) {
      const labelIdx = c * timeSteps + t;
      const label = this.labelContainer.children[labelIdx];
      const value = coin.samples[t];
      const h = Math.max((value - coin.min) / range, 0.02) * this.cubeHeight;
      const x = (t - newest) * this.spacing;

      const local = [x, h, z, 1];
      const world = this._mulVec4(baseModelMatrix, local);
      const clip = this._mulVec4(viewProjMatrix, world);

      if (clip[3] <= 0) { label.style.display = 'none'; continue; }

      const dist = Math.hypot(world[0] - this.camera.position[0], world[1] - this.camera.position[1], world[2] - this.camera.position[2]);
      if (dist > this.labelMaxDistance) { label.style.display = 'none'; continue; }

      const ndcX = clip[0] / clip[3];
      const ndcY = clip[1] / clip[3];
      const screenX = (ndcX * 0.5 + 0.5) * canvasWidth;
      const screenY = (1 - (ndcY * 0.5 + 0.5)) * canvasHeight;
      const scale = Math.max(0.3, Math.min(1.0, 8 / dist));

      label.style.display = 'block';
      label.style.left = `${screenX}px`;
      label.style.top = `${screenY - 6 * scale}px`;
      label.style.fontSize = `${10 * scale}px`;
      label.textContent = value.toFixed(coin.id === 'ripple' ? 4 : 2);

      results.push({label, dist}); // NEW
    }
  });

  // NEW: farthest first (low z-index), nearest last (high z-index) — nearest always wins overlap
  results.sort((a, b) => b.dist - a.dist);
  results.forEach((r, i) => { r.label.style.zIndex = i + 1; });
}

  _mulVec4(m, v) {
    return [
      m[0] * v[0] + m[4] * v[1] + m[8] * v[2] + m[12] * v[3],
      m[1] * v[0] + m[5] * v[1] + m[9] * v[2] + m[13] * v[3],
      m[2] * v[0] + m[6] * v[1] + m[10] * v[2] + m[14] * v[3],
      m[3] * v[0] + m[7] * v[1] + m[11] * v[2] + m[15] * v[3],
    ];
  }

  _buildCubeGeometry() {
    const p = [
      -0.5, 1, -0.5, 0, 1, 0, 0.5, 1, -0.5, 0, 1, 0, 0.5, 1, 0.5, 0, 1, 0, -0.5, 1, 0.5, 0, 1, 0,
      -0.5, 0, -0.5, 0, -1, 0, 0.5, 0, -0.5, 0, -1, 0, 0.5, 0, 0.5, 0, -1, 0, -0.5, 0, 0.5, 0, -1, 0,
      0.5, 0, -0.5, 1, 0, 0, 0.5, 1, -0.5, 1, 0, 0, 0.5, 1, 0.5, 1, 0, 0, 0.5, 0, 0.5, 1, 0, 0,
      -0.5, 0, -0.5, -1, 0, 0, -0.5, 1, -0.5, -1, 0, 0, -0.5, 1, 0.5, -1, 0, 0, -0.5, 0, 0.5, -1, 0, 0,
      -0.5, 0, 0.5, 0, 0, 1, 0.5, 0, 0.5, 0, 0, 1, 0.5, 1, 0.5, 0, 0, 1, -0.5, 1, 0.5, 0, 0, 1,
      -0.5, 0, -0.5, 0, 0, -1, 0.5, 0, -0.5, 0, 0, -1, 0.5, 1, -0.5, 0, 0, -1, -0.5, 1, -0.5, 0, 0, -1,
    ];
    const idx = [];
    for(let f = 0;f < 6;f++) {const o = f * 4; idx.push(o, o + 1, o + 2, o, o + 2, o + 3);}
    return {vertices: new Float32Array(p), indices: new Uint16Array(idx)};
  }

  _initPipeline() {
    const cube = this._buildCubeGeometry();
    const posData = new Float32Array(cube.vertices.length / 2);
    const normData = new Float32Array(cube.vertices.length / 2);
    for(let i = 0, v = 0;i < cube.vertices.length;i += 6, v += 3) {
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
    this.coins = coins;
    const total = coinCount * timeSteps;
    if(total > this.maxInstances) {
      console.warn(`%cCryptoGridEffect: ${total} exceeds maxInstances`, LOG_FUNNY_ARCADE);
    }
    coins.forEach((coin, c) => {
      const range = Math.max(coin.max - coin.min, 1e-6);
      for(let t = 0;t < timeSteps;t++) {
        const i = c * timeSteps + t;
        if(i >= this.maxInstances) continue;
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

  dispose() {
    this.labelContainer.remove();
  }
  // updateInstanceData — normalize scale out of baseModelMatrix, keep position+rotation inherited
  updateInstanceData(baseModelMatrix) {
    this.time += 0.016;
    this.device.queue.writeBuffer(this.gridUniformBuffer, 0, baseModelMatrix);
    this.device.queue.writeBuffer(this.gridUniformBuffer, 64, new Uint32Array([this.timeSteps, this.coinCount]));
    this.device.queue.writeBuffer(this.gridUniformBuffer, 72, new Float32Array([this.spacing, this.cubeHeight]));
    this.device.queue.writeBuffer(this.gridUniformBuffer, 80, new Float32Array([this.time]));

    this.updateLabels(this.coins, baseModelMatrix, this.camera.VP, app.canvas.width, app.canvas.height);
  }
  render(pass, mesh, viewProjMatrix) {
    if(this.timeSteps === 0) return;
    this.device.queue.writeBuffer(this.cameraBuffer, 0, viewProjMatrix);
    pass.setPipeline(this.pipeline);
    pass.setBindGroup(0, this.bindGroup);
    pass.setVertexBuffer(0, this.vertexBuffer);
    pass.setVertexBuffer(1, this.normalBuffer);
    pass.setIndexBuffer(this.indexBuffer, "uint16");
    pass.drawIndexed(this.indexCount, Math.min(this.timeSteps * this.coinCount, this.maxInstances));
  }
}
