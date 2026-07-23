import {mat4} from "wgpu-matrix";
import {
  fullscreenVertShader,
  dropFragShader,
  updateFragShader,
  normalFragShader,
  sphereFragShader,
  surfaceVertShader,
  surfaceFragShader,
  causticsVertShader,
  causticsFragShader
} from "../../shaders/water-simulation/water-simulation.wgsl";


// WaterSimEffect
// --------------
// GPU heightfield water simulation + raytraced-style surface render, ported
// from jeantimex/webgpu-water (itself a WGSL port of Evan Wallace's WebGL
// Water) onto the beast's standalone effect interface.
//
// Unlike KaleidoscopeEffect (single draw call per frame), this effect needs
// several off-screen render passes (drop / update / normal / sphere-stamp /
// caustics) BEFORE the main scene pass begins, because you can't nest or
// retarget render passes once world.js's main pass is open. So the effect
// exposes two entry points instead of one:
//
//   waterEffect.simulate(commandEncoder)   // call once per frame, BEFORE
//                                          // world.js begins its main pass
//   waterEffect.render(pass, mesh, vp)     // call inside mesh.effects loop,
//                                          // like any other effect
//
// All sim passes share ONE commandEncoder/submit per frame (the original
// demo submits 5x per frame - drop/update x2/normal/caustics - which is
// exactly the kind of multi-submit stall pattern that shows up as spikes
// in a Chrome trace). Pass your own frame encoder in if you already have
// one open for other GPU work, otherwise the effect creates+submits its own.
//
// Usage:
//   const water = new WaterSimEffect(device, format, {
//     size: 20,            // world-space width/height of the water plane
//     poolHeight: 1,        // depth of the floor plane below the surface
//     floorTexture, floorSampler   // optional; defaults to a flat gray 1x1
//   });
//   someMesh.effects = { water };
//   // per frame, before world's main render pass:
//   water.simulate(commandEncoder);
//   // click/drag handlers:
//   water.addDrop(x, z, 0.03, 0.02);
//   water.stampSphere(oldCenter, newCenter, radius);

const SIM_RES = 256;

export class WaterSimEffect {
  constructor(device, format, options = {}) {
    this.device = device;
    this.format = format;
    this.enabled = true;

    this.width = options.width ?? SIM_RES;
    this.height = options.height ?? SIM_RES;
    this.size = options.size ?? 2; // world-space plane size (edge length)
    this.detail = options.detail ?? 200; // grid subdivisions
    this.poolHeight = options.poolHeight ?? 1.0;

    this.ior = options.ior ?? 1.333;
    this.fresnelMin = options.fresnelMin ?? 0.25;
    this.causticIntensity = options.causticIntensity ?? 0.3;
    this.lightDirection = options.lightDirection ?? [2.0, 2.0, -1.0];

    this._dropQueue = [];
    this._sphereStamp = null;

    this._simFormat = device.features.has('float32-filterable') ? 'rgba32float' : 'rgba16float';

    this._localMatrix = mat4.create();
    this._finalMatrix = mat4.create();
    this.data = new Float32Array(20);

    this._createTextures();
    this._createSampler();
    this._createUniformBuffers(options);
    this._createSimPipelines();
    this._createSurfaceMesh();
    this._createSurfacePipelines();
    this._createCausticsPipeline();
  }

  // -- setup ------------------------------------------------------------

  updateInstanceData(baseModelMatrix) {

    mat4.identity(this._localMatrix);

    // later:
    // mat4.translate(...)
    // mat4.rotateY(...)
    // mat4.scale(...)

    mat4.multiply(
      baseModelMatrix,
      this._localMatrix,
      this._finalMatrix
    );

    this.device.queue.writeBuffer(
      this.modelBuffer,
      0,
      this._finalMatrix
    );
  }

  _createTextures() {
    const texDesc = {
      size: [this.width, this.height],
      format: this._simFormat,
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.RENDER_ATTACHMENT
    };
    this.textureA = this.device.createTexture({...texDesc, label: 'WaterSim A'});
    this.textureB = this.device.createTexture({...texDesc, label: 'WaterSim B'});
    // Fixed for the lifetime of the effect - views are cheap to cache once
    // and index by parity instead of recreating them on every sim pass.
    this._physViews = [this.textureA.createView(), this.textureB.createView()];
    this._parity = 0; // 0 = textureA is "current" (readable) state

    this.causticsTexture = this.device.createTexture({
      label: 'WaterSim Caustics',
      size: [1024, 1024],
      format: 'rgba8unorm',
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.RENDER_ATTACHMENT
    });

    // Default flat floor texture (1x1 gray) so the surface pipeline always
    // has a valid binding even if the caller doesn't supply one.
    this.floorTexture = this.device.createTexture({
      label: 'WaterSim Default Floor',
      size: [1, 1],
      format: 'rgba8unorm',
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST
    });
    this.device.queue.writeTexture(
      {texture: this.floorTexture},
      new Uint8Array([90, 95, 100, 255]),
      {bytesPerRow: 4},
      {width: 1, height: 1}
    );
  }

  _createSampler() {
    this.sampler = this.device.createSampler({
      magFilter: 'linear',
      minFilter: 'linear',
      addressModeU: 'clamp-to-edge',
      addressModeV: 'clamp-to-edge'
    });
  }

  _createUniformBuffers(options) {
    // commonUniforms: viewProjectionMatrix (mat4) + eyePosition (vec3) + pad
    this.commonUniformBuffer = this.device.createBuffer({
      label: 'WaterSim Common Uniforms',
      size: 80,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });
    this.lightUniformBuffer = this.device.createBuffer({
      label: 'WaterSim Light Uniforms',
      size: 16,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });
    this.waterUniformBuffer = this.device.createBuffer({
      label: 'WaterSim Water Uniforms',
      size: 16,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });

    this._writeLightUniforms();
    this._writeWaterUniforms();

    this.floorSampler = options.floorSampler ?? this.device.createSampler({
      magFilter: 'linear', minFilter: 'linear',
      addressModeU: 'repeat', addressModeV: 'repeat'
    });
    if(options.floorTexture) this.floorTexture = options.floorTexture;
  }

  _writeLightUniforms() {
    const [x, y, z] = this.lightDirection;
    const len = Math.hypot(x, y, z) || 1;
    this.device.queue.writeBuffer(this.lightUniformBuffer, 0,
      new Float32Array([x / len, y / len, z / len, 0]));
  }

  _writeWaterUniforms() {
    this.device.queue.writeBuffer(this.waterUniformBuffer, 0,
      new Float32Array([this.ior, this.fresnelMin, this.causticIntensity, this.poolHeight]));
  }

  _createSimPipelines() {
    this.dropPipeline = this._buildSimPipeline('Drop', dropFragShader, 32);
    this.updatePipeline = this._buildSimPipeline('Update', updateFragShader, 16);
    this.normalPipeline = this._buildSimPipeline('Normal', normalFragShader, 16);
    this.spherePipeline = this._buildSimPipeline('Sphere', sphereFragShader, 32);
  }

  _buildSimPipeline(label, fragCode, uniformSize) {
    const module = this.device.createShaderModule({
      label: label + ' Sim Module',
      code: fullscreenVertShader + fragCode
    });
    const pipeline = this.device.createRenderPipeline({
      label: label + ' Sim Pipeline',
      layout: 'auto',
      vertex: {module, entryPoint: 'vs_main'},
      fragment: {module, entryPoint: 'fs_main', targets: [{format: this._simFormat}]},
      primitive: {topology: 'triangle-list'}
    });
    const uniformBuffer = this.device.createBuffer({
      size: uniformSize,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });
    // Two variants (read A / read B) built once - only the uniform buffer's
    // contents change per call, never the bind group itself.
    const makeBG = (readView) => this.device.createBindGroup({
      layout: pipeline.getBindGroupLayout(0),
      entries: [
        {binding: 0, resource: readView},
        {binding: 1, resource: this.sampler},
        {binding: 2, resource: {buffer: uniformBuffer}}
      ]
    });
    return {
      pipeline,
      uniformBuffer,
      bindGroups: [makeBG(this._physViews[0]), makeBG(this._physViews[1])]
    };
  }

  _createSurfaceMesh() {
    const detail = this.detail;
    const half = this.size * 0.5;
    const positions = [];
    const indices = [];

    for(let z = 0;z <= detail;z++) {
      const t = z / detail;
      for(let x = 0;x <= detail;x++) {
        const s = x / detail;
        positions.push((2 * s - 1) * half, 0, (2 * t - 1) * half);
      }
    }
    for(let z = 0;z < detail;z++) {
      for(let x = 0;x < detail;x++) {
        const i = x + z * (detail + 1);
        indices.push(i, i + 1, i + detail + 1);
        indices.push(i + detail + 1, i + 1, i + detail + 2);
      }
    }

    this.indexCount = indices.length;

    this.positionBuffer = this.device.createBuffer({
      label: 'WaterSim Surface Vertices',
      size: positions.length * 4,
      usage: GPUBufferUsage.VERTEX,
      mappedAtCreation: true
    });
    new Float32Array(this.positionBuffer.getMappedRange()).set(positions);
    this.positionBuffer.unmap();

    this.indexBuffer = this.device.createBuffer({
      label: 'WaterSim Surface Indices',
      size: indices.length * 4,
      usage: GPUBufferUsage.INDEX,
      mappedAtCreation: true
    });
    new Uint32Array(this.indexBuffer.getMappedRange()).set(indices);
    this.indexBuffer.unmap();
  }

  _createSurfacePipelines() {
    this.modelBuffer = this.device.createBuffer({
      label: "WaterSim Model Buffer",
      size: 96,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });

    this.surfaceBindGroupLayout = this.device.createBindGroupLayout({
      label: 'WaterSim Surface BGL',
      entries: [
        {binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: {type: 'uniform'}},
        {binding: 1, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: {type: 'uniform'}},
        {binding: 2, visibility: GPUShaderStage.FRAGMENT, buffer: {type: 'uniform'}},
        {binding: 3, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, sampler: {}},
        {binding: 4, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, texture: {}},
        {binding: 5, visibility: GPUShaderStage.FRAGMENT, sampler: {}},
        {binding: 6, visibility: GPUShaderStage.FRAGMENT, texture: {}},
        {binding: 7, visibility: GPUShaderStage.FRAGMENT, texture: {}}
      ]
    });

    const layout = this.device.createPipelineLayout({bindGroupLayouts: [this.surfaceBindGroupLayout]});
    const vsModule = this.device.createShaderModule({label: 'WaterSim S VS', code: surfaceVertShader});
    const fsModule = this.device.createShaderModule({label: 'WaterSim S FS', code: surfaceFragShader});

    const baseDesc = {
      layout,
      vertex: {
        module: vsModule,
        entryPoint: 'vs_main',
        buffers: [{arrayStride: 12, attributes: [{shaderLocation: 0, offset: 0, format: 'float32x3'}]}]
      },
      fragment: {
        module: fsModule, entryPoint: 'fs_main', targets: [
          {format: this.format}, {format: this.format}, {format: this.format}
        ]
      },
      primitive: {topology: 'triangle-list'},
      depthStencil: {depthWriteEnabled: true, depthCompare: 'less', format: 'depth24plus'}
    };

    this.surfacePipelineAbove = this.device.createRenderPipeline({
      ...baseDesc, label: 'WaterSim S Above',
      primitive: {topology: 'triangle-list', cullMode: 'back'}
    });
    this.surfacePipelineUnder = this.device.createRenderPipeline({
      ...baseDesc, label: 'WaterSim S Under',
      primitive: {topology: 'triangle-list', cullMode: 'front'}
    });

    // Ping-pong swaps textureA/textureB references each sim pass, but the
    // underlying GPUTexture objects never change - so both possible bind
    // groups can be built once up front and selected by parity, instead of
    // allocating a fresh bind group after every pass (4-6x per frame).
    const makeBG = (waterView) => this.device.createBindGroup({
      layout: this.surfaceBindGroupLayout,
      entries: [
        {binding: 0, resource: {buffer: this.commonUniformBuffer}},
        {binding: 1, resource: {buffer: this.modelBuffer}},
        {binding: 2, resource: {buffer: this.lightUniformBuffer}},
        {binding: 3, resource: this.sampler},
        {binding: 4, resource: waterView},
        {binding: 5, resource: this.floorSampler},
        {binding: 6, resource: this.floorTexture.createView()},
        {binding: 7, resource: this.causticsTexture.createView()}
      ]
    });
    this._surfaceBindGroups = [makeBG(this._physViews[0]), makeBG(this._physViews[1])];
  }

  _createCausticsPipeline() {
    const vsModule = this.device.createShaderModule({label: 'WaterSim Caustics VS', code: causticsVertShader});
    const fsModule = this.device.createShaderModule({label: 'WaterSim Caustics FS', code: causticsFragShader});

    this.causticsPipeline = this.device.createRenderPipeline({
      label: 'WaterSim Caustics Pipeline',
      layout: 'auto',
      vertex: {
        module: vsModule,
        entryPoint: 'vs_main',
        buffers: [{arrayStride: 12, attributes: [{shaderLocation: 0, offset: 0, format: 'float32x3'}]}]
      },
      fragment: {
        module: fsModule,
        entryPoint: 'fs_main',
        targets: [{
          format: 'rgba8unorm',
          blend: {
            color: {operation: 'add', srcFactor: 'one', dstFactor: 'one'},
            alpha: {operation: 'add', srcFactor: 'one', dstFactor: 'one'}
          }
        }]
      },
      primitive: {topology: 'triangle-list'}
    });

    const makeBG = (waterView) => this.device.createBindGroup({
      layout: this.causticsPipeline.getBindGroupLayout(0),
      entries: [
        {binding: 0, resource: {buffer: this.lightUniformBuffer}},
        {binding: 1, resource: {buffer: this.waterUniformBuffer}},
        {binding: 2, resource: this.sampler},
        {binding: 3, resource: waterView},
        {binding: 4, resource: this.modelBuffer}
      ]
    });
    this._causticsBindGroups = [makeBG(this._physViews[0]), makeBG(this._physViews[1])];
  }

  // -- public API ---------------------------------------------------------

  /** Queue a ripple; consumed on the next simulate() call. x/z in [-1, 1]. */
  addDrop(x, z, radius = 0.03, strength = 0.01) {
    this._dropQueue.push({x, z, radius, strength});
  }

  /** Stamp water displacement from a moving sphere; consumed on next simulate(). */
  stampSphere(oldCenter, newCenter, radius) {
    this._sphereStamp = {oldCenter, newCenter, radius};
  }

  setLightDirection(x, y, z) {
    this.lightDirection = [x, y, z];
    this._writeLightUniforms();
  }

  updateWaterParameters({ior, fresnelMin, causticIntensity, poolHeight} = {}) {
    if(ior !== undefined) this.ior = ior;
    if(fresnelMin !== undefined) this.fresnelMin = fresnelMin;
    if(causticIntensity !== undefined) this.causticIntensity = causticIntensity;
    if(poolHeight !== undefined) this.poolHeight = poolHeight;
    this._writeWaterUniforms();
  }

  /**
   * Runs all simulation + caustics passes for this frame. Call once per
   * frame BEFORE world.js opens its main render pass. Pass your own
   * commandEncoder to fold this into an existing frame submission, or omit
   * it and the effect will create+submit its own single encoder.
   */
  simulate(commandEncoder) {
    const encoder = commandEncoder ?? this.device.createCommandEncoder({label: 'WaterSim Frame'});

    for(const drop of this._dropQueue) {
      this._runSimPass(encoder, this.dropPipeline,
        new Float32Array([drop.x, drop.z, drop.radius, drop.strength]));
    }
    this._dropQueue.length = 0;

    if(this._sphereStamp) {
      const {oldCenter, newCenter, radius} = this._sphereStamp;
      this._runSimPass(encoder, this.spherePipeline, new Float32Array([
        oldCenter[0], oldCenter[1], oldCenter[2], radius,
        newCenter[0], newCenter[1], newCenter[2], 0
      ]));
      this._sphereStamp = null;
    }

    const delta = new Float32Array([1 / this.width, 1 / this.height]);
    this._runSimPass(encoder, this.updatePipeline, delta);
    this._runSimPass(encoder, this.updatePipeline, delta); // 2x per frame, smoother waves
    this._runSimPass(encoder, this.normalPipeline, delta);

    this._runCausticsPass(encoder);

    if(!commandEncoder) this.device.queue.submit([encoder.finish()]);
  }

  _runSimPass(encoder, pipelineObj, uniformData) {
    this.device.queue.writeBuffer(pipelineObj.uniformBuffer, 0, uniformData);

    const writeView = this._physViews[1 - this._parity];
    const pass = encoder.beginRenderPass({
      colorAttachments: [{
        view: writeView,
        loadOp: 'clear', storeOp: 'store',
        clearValue: {r: 0, g: 0, b: 0, a: 0}
      }]
    });
    pass.setPipeline(pipelineObj.pipeline);
    pass.setBindGroup(0, pipelineObj.bindGroups[this._parity]);
    pass.draw(6);
    pass.end();

    // Flip which physical texture is "current" - no reference swapping, no
    // bind group rebuilding, just an index flip.
    this._parity = 1 - this._parity;
  }

  _runCausticsPass(encoder) {
    const pass = encoder.beginRenderPass({
      colorAttachments: [{
        view: this.causticsTexture.createView(),
        loadOp: 'clear', storeOp: 'store',
        clearValue: {r: 0, g: 0, b: 0, a: 0}
      }]
    });
    pass.setPipeline(this.causticsPipeline);
    pass.setBindGroup(0, this._causticsBindGroups[this._parity]);
    pass.setVertexBuffer(0, this.positionBuffer);
    pass.setIndexBuffer(this.indexBuffer, 'uint32');
    pass.drawIndexed(this.indexCount);
    pass.end();
  }

  render(pass, mesh, viewProjMatrix) {
    const eye = this._lastEye ?? [0, 5, 5];
    this.data.set(viewProjMatrix, 0);
    this.data.set(eye, 16);
    this.device.queue.writeBuffer(this.commonUniformBuffer, 0, this.data);
    pass.setPipeline(this.surfacePipelineAbove);
    pass.setBindGroup(0, this._surfaceBindGroups[this._parity]);
    pass.setVertexBuffer(0, this.positionBuffer);
    pass.setIndexBuffer(this.indexBuffer, 'uint32');
    pass.drawIndexed(this.indexCount);
    pass.setPipeline(this.surfacePipelineUnder);
    pass.setBindGroup(0, this._surfaceBindGroups[this._parity]);
    pass.drawIndexed(this.indexCount);
  }
  setEyePosition(pos) {this._lastEye = pos}
}