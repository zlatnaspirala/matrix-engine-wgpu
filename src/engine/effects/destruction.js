/**
 * @class DestructionEffect
 * @description Complete destruction effect with particle smoke/dust for MOBA
 * Matches Matrix-Engine-WGPU effect interface (like FlameEffect)
 * 
 * Features:
 * - Particle-based smoke/dust system
 * - GPU instancing for performance
 * - Inherits parent transform via baseModelMatrix
 * - Own pipeline, shares draw pass
 * 
 * @note Based on Matrix-Engine-WGPU architecture
 * but can be isolatted.Effects are standalone sub
 * system in matrix-engine-wgpu.
 */

import {mat4} from "wgpu-matrix";
import {dustShader} from "../../shaders/desctruction/dust-shader.wgsl.js";

export class DestructionEffect {
  constructor(device, format, config = {}) {
    this.device = device;
    this.format = format;

    // Configuration
    this.particleCount = config.particleCount || 100;
    this.duration = config.duration || 2.5;
    this.spread = config.spread || 5.0;

    // State
    this.time = 0;
    this.enabled = false;
    this.particles = [];

    // Visual properties
    this.color = config.color || [0.6, 0.5, 0.4, 1.0]; // Brownish dust
    this.intensity = 1.0;

    this._initPipeline();
    this._initParticles();
  }

  _initPipeline() {
    // Single quad for billboarded particles
    const S = 1.0; // Base particle size
    const vertexData = new Float32Array([
      -0.5 * S, 0.5 * S, 0,  // Top-left
      0.5 * S, 0.5 * S, 0,   // Top-right
      -0.5 * S, -0.5 * S, 0, // Bottom-left
      0.5 * S, -0.5 * S, 0,  // Bottom-right
    ]);

    const uvData = new Float32Array([
      0, 0,  // Top-left
      1, 0,  // Top-right
      0, 1,  // Bottom-left
      1, 1   // Bottom-right
    ]);

    const indexData = new Uint16Array([0, 2, 1, 1, 2, 3]);

    // Vertex buffer (shared quad geometry)
    this.vertexBuffer = this.device.createBuffer({
      size: vertexData.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
    });
    this.device.queue.writeBuffer(this.vertexBuffer, 0, vertexData);

    // UV buffer
    this.uvBuffer = this.device.createBuffer({
      size: uvData.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
    });
    this.device.queue.writeBuffer(this.uvBuffer, 0, uvData);

    // Index buffer
    this.indexBuffer = this.device.createBuffer({
      size: Math.ceil(indexData.byteLength / 4) * 4,
      usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST
    });
    this.device.queue.writeBuffer(this.indexBuffer, 0, indexData);
    this.indexCount = indexData.length;

    // Instance buffer (per-particle data: position, velocity, life, size)
    // Format: vec4(pos.xyz, size) + vec4(vel.xyz, life) + vec4(color.rgba)
    const maxParticles = this.particleCount;
    const instanceDataSize = maxParticles * (4 + 4 + 4) * 4; // 3 vec4s per particle

    this.instanceBuffer = this.device.createBuffer({
      size: instanceDataSize,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
    });

    // Uniform buffers
    this.cameraBuffer = this.device.createBuffer({
      size: 64, // mat4x4
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });

    this.modelBuffer = this.device.createBuffer({
      size: 64 + 16 + 16, // model matrix + time + intensity (padded)
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });

    // Bind group layout
    const bindGroupLayout = this.device.createBindGroupLayout({
      entries: [
        {binding: 0, visibility: GPUShaderStage.VERTEX, buffer: {}}, // camera
        {binding: 1, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: {}}, // model + time
      ]
    });

    this.bindGroup = this.device.createBindGroup({
      layout: bindGroupLayout,
      entries: [
        {binding: 0, resource: {buffer: this.cameraBuffer}},
        {binding: 1, resource: {buffer: this.modelBuffer}},
      ]
    });

    // Shader module
    const shaderModule = this.device.createShaderModule({code: dustShader});
    const pipelineLayout = this.device.createPipelineLayout({bindGroupLayouts: [bindGroupLayout]});

    // Render pipeline with alpha blending
    this.pipeline = this.device.createRenderPipeline({
      label: 'destruction Pipeline',
      layout: pipelineLayout,
      vertex: {
        module: shaderModule,
        entryPoint: "vsMain",
        buffers: [
          // Vertex positions (per-vertex, shared quad)
          {
            arrayStride: 3 * 4,
            stepMode: "vertex",
            attributes: [{shaderLocation: 0, offset: 0, format: "float32x3"}]
          },
          // UVs (per-vertex, shared quad)
          {
            arrayStride: 2 * 4,
            stepMode: "vertex",
            attributes: [{shaderLocation: 1, offset: 0, format: "float32x2"}]
          },
          // Instance data (per-particle)
          {
            arrayStride: 12 * 4, // 3 vec4s = 12 floats
            stepMode: "instance",
            attributes: [
              {shaderLocation: 2, offset: 0, format: "float32x4"},      // position + size
              {shaderLocation: 3, offset: 16, format: "float32x4"},     // velocity + life
              {shaderLocation: 4, offset: 32, format: "float32x4"}      // color
            ]
          }
        ]
      },
      fragment: {
        module: shaderModule,
        entryPoint: "fsMain",
        targets: [{
          format: this.format,
          blend: {
            color: {srcFactor: "src-alpha", dstFactor: "one-minus-src-alpha", operation: "add"},
            alpha: {srcFactor: "one", dstFactor: "one-minus-src-alpha", operation: "add"}
          }
        }]
      },
      primitive: {topology: "triangle-list", cullMode: "none"},
      depthStencil: {
        depthWriteEnabled: false, // Particles don't write depth
        depthCompare: "less",
        format: "depth24plus"
      }
    });
  }

  _initParticles() {
    // Initialize particle data
    for(let i = 0;i < this.particleCount;i++) {
      this.particles.push({
        // Local position offset from parent
        position: [0, 0, 0],
        velocity: [0, 0, 0],
        life: 0,
        maxLife: 0,
        size: 0,
        color: [...this.color]
      });
    }
  }

  /**
   * Trigger the destruction effect
   * Spawns all particles with random velocities
   */
  trigger() {
    this.enabled = true;
    this.time = 0;

    // Spawn particles
    for(let i = 0;i < this.particleCount;i++) {
      const particle = this.particles[i];

      // Random position in small sphere
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = Math.random() * 0.5;

      particle.position = [
        r * Math.sin(phi) * Math.cos(theta),
        Math.random() * 1.0, // Slightly upward bias
        r * Math.sin(phi) * Math.sin(theta)
      ];

      // Random velocity (explosion pattern)
      const speed = 2.0 + Math.random() * 3.0;
      const vTheta = Math.random() * Math.PI * 2;
      const vPhi = Math.acos(2 * Math.random() - 1);

      particle.velocity = [
        speed * Math.sin(vPhi) * Math.cos(vTheta),
        speed * Math.abs(Math.sin(vPhi)) * 2.0, // Upward bias
        speed * Math.sin(vPhi) * Math.sin(vTheta)
      ];

      // Random lifetime
      particle.maxLife = 1.0 + Math.random() * 1.5;
      particle.life = particle.maxLife;

      // Random size
      particle.size = 0.5 + Math.random() * 1.5;

      // Color with slight variation
      particle.color = [
        this.color[0] + (Math.random() - 0.5) * 0.2,
        this.color[1] + (Math.random() - 0.5) * 0.2,
        this.color[2] + (Math.random() - 0.5) * 0.2,
        1.0
      ];
    }
  }

  /**
   * Update particle simulation
   */
  update(dt) {
    if(!this.enabled) return;

    this.time += dt;

    let aliveCount = 0;

    // Update each particle
    for(let i = 0;i < this.particleCount;i++) {
      const p = this.particles[i];

      if(p.life <= 0) continue;

      // Physics update
      p.velocity[1] -= 2.0 * dt; // Gravity

      // Damping (air resistance)
      p.velocity[0] *= 0.98;
      p.velocity[1] *= 0.98;
      p.velocity[2] *= 0.98;

      // Position update
      p.position[0] += p.velocity[0] * dt;
      p.position[1] += p.velocity[1] * dt;
      p.position[2] += p.velocity[2] * dt;

      // Life update
      p.life -= dt;

      // Fade out
      const lifeRatio = p.life / p.maxLife;
      p.color[3] = lifeRatio * this.intensity;

      // Size grows over time (smoke expansion)
      p.size = (0.5 + Math.random() * 1.5) * (1.0 + (1.0 - lifeRatio) * 2.0);

      aliveCount++;
    }

    // Disable if all particles dead
    if(aliveCount === 0 && this.time > this.duration) {
      this.enabled = false;
    }

    // Update instance buffer
    this._updateInstanceBuffer();
  }

  _updateInstanceBuffer() {
    // Pack particle data into instance buffer
    const instanceData = new Float32Array(this.particleCount * 12);

    for(let i = 0;i < this.particleCount;i++) {
      const p = this.particles[i];
      const offset = i * 12;

      // vec4: position + size
      instanceData[offset + 0] = p.position[0];
      instanceData[offset + 1] = p.position[1];
      instanceData[offset + 2] = p.position[2];
      instanceData[offset + 3] = p.size;

      // vec4: velocity + life
      instanceData[offset + 4] = p.velocity[0];
      instanceData[offset + 5] = p.velocity[1];
      instanceData[offset + 6] = p.velocity[2];
      instanceData[offset + 7] = p.life;

      // vec4: color
      instanceData[offset + 8] = p.color[0];
      instanceData[offset + 9] = p.color[1];
      instanceData[offset + 10] = p.color[2];
      instanceData[offset + 11] = p.color[3];
    }

    this.device.queue.writeBuffer(this.instanceBuffer, 0, instanceData);
  }

  /**
   * Update instance data with parent transform
   * Called by parent object before rendering
   */
  updateInstanceData(baseModelMatrix) {
    const local = mat4.identity();

    // Local offset (if needed)
    // mat4.translate(local, [0, 2, 0], local); // Offset upward slightly

    // Multiply with baseModelMatrix to inherit world transform
    const finalMat = mat4.identity();
    mat4.multiply(baseModelMatrix, local, finalMat);

    // Update GPU buffer
    const timeBuffer = new Float32Array([this.time]);
    const intensityBuffer = new Float32Array([this.intensity]);

    this.device.queue.writeBuffer(this.modelBuffer, 0, finalMat);
    this.device.queue.writeBuffer(this.modelBuffer, 64, timeBuffer);
    this.device.queue.writeBuffer(this.modelBuffer, 80, intensityBuffer);
  }

  /**
   * Draw particles
   */
  draw(pass, cameraMatrix) {
    if(!this.enabled) return;

    this.device.queue.writeBuffer(this.cameraBuffer, 0, cameraMatrix);

    pass.setPipeline(this.pipeline);
    pass.setBindGroup(0, this.bindGroup);
    pass.setVertexBuffer(0, this.vertexBuffer);
    pass.setVertexBuffer(1, this.uvBuffer);
    pass.setVertexBuffer(2, this.instanceBuffer);
    pass.setIndexBuffer(this.indexBuffer, "uint16");

    // Draw instanced (one quad per particle)
    pass.drawIndexed(this.indexCount, this.particleCount);
  }

  /**
   * Main render method (called by parent)
   */
  render(pass, mesh, viewProjMatrix, dt = 0.016) {
    if(!this.enabled) return;

    this.update(dt);
    this.draw(pass, viewProjMatrix);
  }

  /**
   * Set effect intensity
   */
  setIntensity(v) {
    this.intensity = v;
  }

  /**
   * Check if effect is still active
   */
  isActive() {
    return this.enabled;
  }

  /**
   * Reset effect
   */
  reset() {
    this.enabled = false;
    this.time = 0;
    for(let p of this.particles) {
      p.life = 0;
    }
  }
}
