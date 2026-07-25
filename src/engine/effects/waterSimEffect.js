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

// const SIM_RES = 256;
const SIM_RES = 512;
export class WaterSimEffect {
  constructor(device, format, options = {}) {
    this.device = device;
    this.format = format;
    this.enabled = true;

    this.width = options.width ?? SIM_RES;
    this.height = options.height ?? SIM_RES;
    this.size = options.size ?? 10; // world-space plane size (edge length)
    this.detail = options.detail ?? 200; // grid subdivisions
    this.poolHeight = options.poolHeight ?? 0.10;

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
    this.data2 = new Float32Array(8);

    this._idleFrames = 0;
    this._idleThreshold = 90; // ~1.5s at 60fps before considering it "settled"

    this._createTextures();
    this._createSampler();
    this._createUniformBuffers(options);
    this._createSimPipelines();
    this._createSurfaceMesh();
    this._createSurfacePipelines();
    this._createCausticsPipeline();
  }

  useExternalGeometry(positionBuffer, indexBuffer, indexCount, indexFormat = 'uint32') {
    this.positionBuffer = positionBuffer;
    this.indexBuffer = indexBuffer;
    this.indexCount = indexCount;
    this._indexFormat = indexFormat;
  }

  // updateInstanceData(baseModelMatrix) {
  // mat4.identity(this._localMatrix);
  // // mat4.scale(this._localMatrix, [this.size, 1, this.size], this._localMatrix);
  // // mat4.scale(this._localMatrix, [1, 1, 1], this._localMatrix);
  // mat4.multiply(baseModelMatrix, this._localMatrix, this._finalMatrix);
  // this.device.queue.writeBuffer(this.modelBuffer, 0, this._finalMatrix);


  updateInstanceData(baseModelMatrix) {
    mat4.identity(this._localMatrix);
    mat4.multiply(baseModelMatrix, this._localMatrix, this._finalMatrix);
    this.device.queue.writeBuffer(this.modelBuffer, 0, this._finalMatrix);

    // Extract world translation from the 4x4 matrix (column 3: indices 12, 13, 14)
    const posX = this._finalMatrix[12];
    const posY = this._finalMatrix[13];
    const posZ = this._finalMatrix[14];

    // Update water uniforms with current parameters + world position
    this.data2.set([
      this.ior,
      this.fresnelMin,
      this.causticIntensity,
      this.poolHeight,
      this.size,
      posX,
      posY,
      posZ
    ]);
    this.device.queue.writeBuffer(this.waterUniformBuffer, 0, this.data2);
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
      size: [512, 512],
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
      size: 32,
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
    this.data2.set([this.ior, this.fresnelMin, this.causticIntensity, this.poolHeight, this.size, 0, 0, 0]);
    this.device.queue.writeBuffer(this.waterUniformBuffer, 0, this.data2);
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
    // const half = this.size * 0.5;
    const positions = [];
    const indices = [];
    for(let z = 0;z <= detail;z++) {
      const t = z / detail;
      for(let x = 0;x <= detail;x++) {
        const s = x / detail;
        positions.push(2 * s - 1, 0, 2 * t - 1);
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
      label: 'WaterSim Surface V',
      size: positions.length * 4,
      usage: GPUBufferUsage.VERTEX,
      mappedAtCreation: true
    });
    new Float32Array(this.positionBuffer.getMappedRange()).set(positions);
    this.positionBuffer.unmap();

    this.indexBuffer = this.device.createBuffer({
      label: 'WaterSim Surface Indice',
      size: indices.length * 4,
      usage: GPUBufferUsage.INDEX,
      mappedAtCreation: true
    });
    new Uint32Array(this.indexBuffer.getMappedRange()).set(indices);
    this.indexBuffer.unmap();
  }

  _createSurfacePipelines() {
    this.modelBuffer = this.device.createBuffer({
      label: "WaterSim Model Buff",
      size: 96,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });

    this.surfaceBindGroupLayout = this.device.createBindGroupLayout({
      label: 'WaterSim Surface BGL',
      entries: [
        {binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: {type: 'uniform'}},
        {binding: 1, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: {type: 'uniform'}},
        {binding: 2, visibility: GPUShaderStage.FRAGMENT, buffer: {type: 'uniform'}},
        {binding: 3, visibility: GPUShaderStage.FRAGMENT, buffer: {type: 'uniform'}},
        {binding: 4, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, sampler: {}},
        {binding: 5, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, texture: {}},
        {binding: 6, visibility: GPUShaderStage.FRAGMENT, sampler: {}},
        {binding: 7, visibility: GPUShaderStage.FRAGMENT, texture: {}},
        {binding: 8, visibility: GPUShaderStage.FRAGMENT, texture: {}}
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
          {
            format: this.format, blend: {
              color: {srcFactor: 'src-alpha', dstFactor: 'one-minus-src-alpha', operation: 'add'},
              alpha: {srcFactor: 'one', dstFactor: 'one-minus-src-alpha', operation: 'add'}
            }
          },
          {format: this.format},
          {format: this.format}
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
      // primitive: {topology: 'triangle-list', cullMode: 'front'},
      depthStencil: {depthWriteEnabled: false, depthCompare: 'less-equal', format: 'depth24plus'},
      primitive: {topology: 'triangle-list', cullMode: 'front'}
    });

    const makeBG = (waterView) => this.device.createBindGroup({
      layout: this.surfaceBindGroupLayout,
      entries: [
        {binding: 0, resource: {buffer: this.commonUniformBuffer}},
        {binding: 1, resource: {buffer: this.modelBuffer}},
        {binding: 2, resource: {buffer: this.lightUniformBuffer}},
        {binding: 3, resource: {buffer: this.waterUniformBuffer}},
        {binding: 4, resource: this.sampler},
        {binding: 5, resource: waterView},
        {binding: 6, resource: this.floorSampler},
        {binding: 7, resource: this.floorTexture.createView()},
        {binding: 8, resource: this.causticsTexture.createView()}
      ]
    });
    this._surfaceBindGroups = [makeBG(this._physViews[0]), makeBG(this._physViews[1])];
  }

  _createCausticsPipeline() {
    const vsModule = this.device.createShaderModule({label: 'WaterSim Caustics VS', code: causticsVertShader});
    const fsModule = this.device.createShaderModule({label: 'WaterSim Caustics FS', code: causticsFragShader});

    this.causticsPipeline = this.device.createRenderPipeline({
      label: 'WaterSim Caustics',
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
        {binding: 3, resource: waterView}
      ]
    });
    this._causticsBindGroups = [makeBG(this._physViews[0]), makeBG(this._physViews[1])];
  }

  addDrop(x, z, radius = 0.03, strength = 0.01) {
    this._dropQueue.push({x, z, radius, strength});
  }

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
    this._runSimPass(encoder, this.updatePipeline, delta);
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
    // pass.setIndexBuffer(this.indexBuffer, 'uint32');
    pass.setIndexBuffer(this.indexBuffer, this._indexFormat ?? 'uint32');
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
    pass.setIndexBuffer(this.indexBuffer, this._indexFormat ?? 'uint32');
    pass.drawIndexed(this.indexCount);
    pass.setPipeline(this.surfacePipelineUnder);
    pass.setBindGroup(0, this._surfaceBindGroups[this._parity]);
    // pass.setVertexBuffer(0, this.positionBuffer);   // <- was missing
    // pass.setIndexBuffer(this.indexBuffer, 'uint32'); // <- was missing
    pass.drawIndexed(this.indexCount);
  }
  setEyePosition(pos) {this._lastEye = pos}
}