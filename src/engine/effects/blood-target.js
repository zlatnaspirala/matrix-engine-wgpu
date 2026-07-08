import {mat4} from "wgpu-matrix";
import {randomFloatFromTo} from "../utils";
import {bloodBurstShader} from "../../shaders/blood/blood-target";

/**
 * @description
 * BloodBurst
 * one-shot particle pool, gravity+drag integration, alpha fade lifetime
 */
export class BloodBurst {
  constructor(device, format, maxParticles = 64, cameraBuffer) {
    this.device = device;
    this.format = format;
    this.maxParticles = maxParticles;
    this.floatsPerInstance = 24; // mat4(16) + life/maxLife/pad/pad(4) + color(4)
    this.instanceData = new Float32Array(maxParticles * this.floatsPerInstance);
    this.gravity = -9.8;
    this.drag = 0.98;
    this.cameraBuffer = cameraBuffer;

    this.pool = [];
    for(let i = 0;i < maxParticles;i++) {
      this.pool.push({
        active: false,
        position: [0, 0, 0],
        velocity: [0, 0, 0],
        scale: 0.1,
        rotation: 0,
        life: 0,
        maxLife: 1,
        color: [0.5, 0.02, 0.02, 1]
      });
    }
    this._localMatrix = mat4.create();
    this._finalMatrix = mat4.create();
    this._initPipeline();
  }

  // one-shot burst spawn — hook this at your hitscan/animationEnd impact point
  spawn(origin, baseModelMatrix, count = 20, speed = 6.0) {
    let spawned = 0;
    for(const p of this.pool) {
      if(spawned >= count) break;
      if(p.active) continue;
      p.active = true;
      p.position[0] = origin[0]; p.position[1] = origin[1]; p.position[2] = origin[2];

      const u = randomFloatFromTo(-1, 1);
      const theta = randomFloatFromTo(0, Math.PI * 2);
      const r = Math.sqrt(1 - u * u);
      let dirX = r * Math.cos(theta);
      let dirY = u;
      let dirZ = r * Math.sin(theta);

      // rare strong upward spurt — small chance, must be visually reachable
      const isSpurt = Math.random() < 0.12;
      let s = speed * randomFloatFromTo(0.4, 1.0);
      if(isSpurt) {
        dirY = Math.abs(dirY) * randomFloatFromTo(1.4, 2.0); // force upward bias
        s *= randomFloatFromTo(1.3, 1.8);                    // extra punch
      }

      p.velocity[0] = dirX * s;
      p.velocity[1] = dirY * s;
      p.velocity[2] = dirZ * s;

      // per-particle physics variance — breaks the "all share one parabola" look
      p.gravityMul = randomFloatFromTo(0.7, 1.4);
      p.dragMul = randomFloatFromTo(0.94, 0.99);
      p.driftPhase = randomFloatFromTo(0, Math.PI * 2);
      p.driftAmp = randomFloatFromTo(0.3, 1.2);

      p.scale = randomFloatFromTo(0.25, 0.6);
      p.rotation = randomFloatFromTo(0, Math.PI * 2);
      p.life = 0;
      p.maxLife = randomFloatFromTo(1.0, 2.2);
      p.color = [1.0, 0.02, 0.02, 1.0];
      spawned++;
    }
  }

  updateInstanceData = (baseModelMatrix) => {
    // decal meshes bake near-zero scale on one axis to look flat — strip that out,
    // blood burst only wants the decal's world position, not its plane-squash scale
    const basePos = mat4.getTranslation(baseModelMatrix);
    const cleanBase = mat4.translation(basePos);

    let count = 0;
    const floatsPerInstance = this.floatsPerInstance;
    for(const p of this.pool) {
      if(!p.active) continue;
      const local = this._localMatrix;
      mat4.identity(local);
      mat4.translate(local, p.position, local);
      mat4.rotateY(local, p.rotation, local);
      const shrink = 1.0 - (p.life / p.maxLife) * 0.3;
      mat4.scale(local, [p.scale * shrink, p.scale * shrink, p.scale * shrink], local);
      mat4.identity(this._finalMatrix);
      mat4.multiply(cleanBase, local, this._finalMatrix);

      const offset = count * floatsPerInstance;
      this.instanceData.set(this._finalMatrix, offset);
      const alpha = 1.0 - (p.life / p.maxLife);
      this.instanceData[offset + 16] = p.life;
      this.instanceData[offset + 17] = p.maxLife;
      this.instanceData[offset + 18] = 0;
      this.instanceData[offset + 19] = 0;
      this.instanceData[offset + 20] = p.color[0];
      this.instanceData[offset + 21] = p.color[1];
      this.instanceData[offset + 22] = p.color[2];
      this.instanceData[offset + 23] = p.color[3] * alpha;
      count++;
    }
    this.activeCount = count;
    if(count > 0) {
      this.device.queue.writeBuffer(this.modelBuffer, 0, this.instanceData.subarray(0, count * floatsPerInstance));
    }
  }

  render(pass, mesh, viewProjMatrix, dt = 0.1) {
    for(const p of this.pool) {
      if(!p.active) continue;
      p.life += dt;
      if(p.life >= p.maxLife) {p.active = false; continue;}

      p.velocity[1] += this.gravity * p.gravityMul * dt;
      p.velocity[0] *= p.dragMul;
      p.velocity[1] *= p.dragMul;
      p.velocity[2] *= p.dragMul;

      // turbulent drift — small per-particle wobble so paths don't read as identical arcs
      const wobble = Math.sin(p.life * 6.0 + p.driftPhase) * p.driftAmp * dt;
      p.position[0] += p.velocity[0] * dt + wobble * 0.3;
      p.position[1] += p.velocity[1] * dt;
      p.position[2] += p.velocity[2] * dt + wobble * 0.2;

      p.rotation += dt * 4.0;
    }

    if(!this.activeCount) return;
    this.device.queue.writeBuffer(this.cameraBuffer, 0, viewProjMatrix);
    pass.setPipeline(this.pipeline);
    pass.setBindGroup(0, this.bindGroup);
    pass.setVertexBuffer(0, this.vertexBuffer);
    pass.setVertexBuffer(1, this.uvBuffer);
    pass.setIndexBuffer(this.indexBuffer, "uint16");
    pass.drawIndexed(this.indexCount, this.activeCount);
  }

  _initPipeline() {
    const vertexData = new Float32Array([
      -0.5, 0.5, 0.0, 0.5, 0.5, 0.0,
      -0.5, -0.5, 0.0, 0.5, -0.5, 0.0,
    ]);
    const uvData = new Float32Array([0, 1, 1, 1, 0, 0, 1, 0]);
    const indexData = new Uint16Array([0, 2, 1, 1, 2, 3]);
    this.vertexBuffer = this.device.createBuffer({size: vertexData.byteLength, usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST});
    this.device.queue.writeBuffer(this.vertexBuffer, 0, vertexData);
    this.uvBuffer = this.device.createBuffer({size: uvData.byteLength, usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST});
    this.device.queue.writeBuffer(this.uvBuffer, 0, uvData);
    this.indexBuffer = this.device.createBuffer({size: Math.ceil(indexData.byteLength / 4) * 4, usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST});
    this.device.queue.writeBuffer(this.indexBuffer, 0, indexData);
    this.indexCount = indexData.length;
    this.modelBuffer = this.device.createBuffer({label: 'blood-burst modelBuffer', size: this.maxParticles * this.floatsPerInstance * 4, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST});
    const bindGroupLayout = this.device.createBindGroupLayout({
      label: 'blood-burst bindGroupLayout',
      entries: [
        {binding: 0, visibility: GPUShaderStage.VERTEX, buffer: {}},
        {binding: 1, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: {type: "read-only-storage"}},
      ]
    });
    this.bindGroup = this.device.createBindGroup({
      label: 'blood-burst bindGroup',
      layout: bindGroupLayout,
      entries: [
        {binding: 0, resource: {buffer: this.cameraBuffer}},
        {binding: 1, resource: {buffer: this.modelBuffer}},
      ]
    });
    const shaderModule = this.device.createShaderModule({code: bloodBurstShader});
    const pipelineLayout = this.device.createPipelineLayout({bindGroupLayouts: [bindGroupLayout]});
    this.pipeline = this.device.createRenderPipeline({
      label: 'blood-burst pipeline',
      layout: pipelineLayout,
      vertex: {
        module: shaderModule,
        entryPoint: "vsMain",
        buffers: [
          {arrayStride: 12, attributes: [{shaderLocation: 0, offset: 0, format: "float32x3"}]},
          {arrayStride: 8, attributes: [{shaderLocation: 1, offset: 0, format: "float32x2"}]}
        ]
      },
      fragment: {
        module: shaderModule,
        entryPoint: "fsMain",
        targets: [{
          format: this.format,
          blend: {
            color: {srcFactor: 'src-alpha', dstFactor: 'one-minus-src-alpha', operation: 'add'},
            alpha: {srcFactor: 'one', dstFactor: 'one-minus-src-alpha', operation: 'add'},
          }
        },
        {format: 'rgba16float'},
        {format: 'rgba16float'}]
      },
      primitive: {topology: "triangle-list"},
      depthStencil: {depthWriteEnabled: false, depthCompare: "less", format: "depth24plus"}
    });
  }
}