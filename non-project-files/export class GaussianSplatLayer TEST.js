export class GaussianSplatLayer {
  static _pipelineCache = new WeakMap();
  constructor(device, format, cameraBuffer, topology = "point-list") {
    this.device = device;
    this.format = format;
    this.cameraBuffer = cameraBuffer;
    this.queue = device.queue;
    this.topology = topology;
    this.splatData = null;
    this.vertexCount = 0;
    this.aabbMin = [Infinity, Infinity, Infinity];
    this.aabbMax = [-Infinity, -Infinity, -Infinity];
    this.vertexBuffer = null;
    this.indexBuffer = null;
    this.vertexBufferLayout = null;
    this.bindGroup = null;
    this.pipeline = null;
    this.indexCount = 0;
    this.splatScale = 2.0;
    this._scaleData = new Float32Array([this.splatScale, 0, 0, 0]);
    this.depthTest = true;

    this.renderMode = 'points'; // Options: 'points' | 'quads' | 'mesh'
    this.meshIndexBuffer = null;
    this.meshIndexCount = 0;
    this.splatSize = 0.015; // Size of quads in 'quads' mode
  }

  setRenderMode(mode, meshTriangles = null) {
    this.renderMode = mode;

    // Swap the main `this.pipeline` reference without re-creating pipelines
    if(mode === 'quads') {
      this.pipeline = this.pipelineInstance;
    } else {
      this.pipeline = this.pipelineVertex;
    }

    if(mode === 'mesh' && meshTriangles) {
      this.meshIndexCount = meshTriangles.length;
      this.meshIndexBuffer = this.device.createBuffer({
        label: 'splat-mesh-index-buffer',
        size: meshTriangles.byteLength,
        usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
        mappedAtCreation: true,
      });
      new Uint16Array(this.meshIndexBuffer.getMappedRange()).set(meshTriangles);
      this.meshIndexBuffer.unmap();
    }
  }

  async loadPLY(source) {
    try {
      let arrayBuffer;
      if(typeof source === 'string') {
        const response = await fetch(source);
        if(!response.ok) throw new Error(`HTTP ${response.status}`);
        arrayBuffer = await response.arrayBuffer();
      } else if(source instanceof File) {
        arrayBuffer = await source.arrayBuffer();
      } else {
        throw new Error('Source must be URL string or File object');
      }
      this.splatData = this._parsePLY(arrayBuffer);
      this.vertexCount = this.splatData.positions.length / 3;

      // 1. Array Creation (RGBA: 4 float32 values per vertex)
      const initialColors = new Float32Array(this.vertexCount * 4);

      for(let i = 0;i < this.vertexCount;i++) {
        // Transfer unpacked SH degree 0 RGB colors from parsed PLY data
        initialColors[i * 4 + 0] = this.splatData.splatColors[i * 4 + 0]; // Red
        initialColors[i * 4 + 1] = this.splatData.splatColors[i * 4 + 1]; // Green
        initialColors[i * 4 + 2] = this.splatData.splatColors[i * 4 + 2]; // Blue
        initialColors[i * 4 + 3] = 1.0;                                   // Alpha / Opacity
      }


      this.colorBuffer = this.device.createBuffer({
        label: 'splat-color',
        size: initialColors.byteLength,
        mappedAtCreation: true,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
      });

      // 3. Population & Unmapping
      new Float32Array(this.colorBuffer.getMappedRange()).set(initialColors);
      this.colorBuffer.unmap();

      // 4. Property Assignments (Required by SplatColorAnimator)
      this.positions = this.splatData.positions; // Float32Array [x, y, z, ...]
      this.vertexCount = this.splatData.vertexCount;

      console.info(`✓ Loaded splat: ${this.vertexCount} points, AABB: [${this.aabbMin}] → [${this.aabbMax}]`);
      await this.initPipeline(this.device);
      return this;
    } catch(err) {
      console.error('Splat load error:', err);
      throw err;
    }
  }

  _parsePLY(arrayBuffer) {
    const view = new DataView(arrayBuffer);
    const uint8 = new Uint8Array(arrayBuffer);
    let headerEnd = 0;
    const headerStr = new TextDecoder().decode(uint8.slice(0, 2048));
    const lines = headerStr.split('\n');
    let vertexCount = 0;
    const properties = [];
    for(let i = 0;i < lines.length;i++) {
      const line = lines[i].trim();
      headerEnd += line.length + 1;
      if(line.startsWith('element vertex')) {
        vertexCount = parseInt(line.split(' ')[2]);
      } else if(line.startsWith('property')) {
        const parts = line.split(' ');
        properties.push({type: parts[1], name: parts[2]});
      } else if(line === 'end_header') {
        break;
      }
    }
    const stride = this._calculateStride(properties);
    const offsets = this._getPropertyOffsets(properties);
    const dataStart = headerEnd;
    const positions = new Float32Array(vertexCount * 3);
    const splatColors = new Float32Array(vertexCount * 4);
    const scales = new Float32Array(vertexCount * 3);
    const rotations = new Float32Array(vertexCount * 4);
    const opacities = new Uint8Array(vertexCount);
    for(let i = 0;i < vertexCount;i++) {
      const offset = dataStart + i * stride;
      const x = view.getFloat32(offset + offsets.x, true);
      const y = view.getFloat32(offset + offsets.y, true);
      const z = view.getFloat32(offset + offsets.z, true);
      positions[i * 3 + 0] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      this.aabbMin[0] = Math.min(this.aabbMin[0], x);
      this.aabbMin[1] = Math.min(this.aabbMin[1], y);
      this.aabbMin[2] = Math.min(this.aabbMin[2], z);
      this.aabbMax[0] = Math.max(this.aabbMax[0], x);
      this.aabbMax[1] = Math.max(this.aabbMax[1], y);
      this.aabbMax[2] = Math.max(this.aabbMax[2], z);

      // const r = this._sigmoid(view.getFloat32(offset + offsets.f_dc_0, true));
      // const g = this._sigmoid(view.getFloat32(offset + offsets.f_dc_1, true));
      // const b = this._sigmoid(view.getFloat32(offset + offsets.f_dc_2, true));
      const SH_C0 = 0.28209479177387814; // Constant factor for SH degree 0
      const r = Math.max(0, Math.min(1, 0.5 + SH_C0 * view.getFloat32(offset + offsets.f_dc_0, true)));
      const g = Math.max(0, Math.min(1, 0.5 + SH_C0 * view.getFloat32(offset + offsets.f_dc_1, true)));
      const b = Math.max(0, Math.min(1, 0.5 + SH_C0 * view.getFloat32(offset + offsets.f_dc_2, true)));

      splatColors[i * 4 + 0] = r;
      splatColors[i * 4 + 1] = g;
      splatColors[i * 4 + 2] = b;
      splatColors[i * 4 + 3] = 1.0;

      const scale_0 = Math.exp(view.getFloat32(offset + offsets.scale_0, true));
      const scale_1 = Math.exp(view.getFloat32(offset + offsets.scale_1, true));
      const scale_2 = Math.exp(view.getFloat32(offset + offsets.scale_2, true));

      scales[i * 3 + 0] = scale_0;
      scales[i * 3 + 1] = scale_1;
      scales[i * 3 + 2] = scale_2;
      const rot_0 = view.getFloat32(offset + offsets.rot_0, true);
      const rot_1 = view.getFloat32(offset + offsets.rot_1, true);
      const rot_2 = view.getFloat32(offset + offsets.rot_2, true);
      const rot_3 = view.getFloat32(offset + offsets.rot_3, true);
      rotations[i * 4 + 0] = rot_0;
      rotations[i * 4 + 1] = rot_1;
      rotations[i * 4 + 2] = rot_2;
      rotations[i * 4 + 3] = rot_3;
      opacities[i] = view.getUint8(offset + offsets.opacity);
    }
    return {vertexCount, positions, splatColors, scales, rotations, opacities, properties};
  }

  _calculateStride(properties) {
    let stride = 0;
    for(const prop of properties) {
      if(prop.type === 'float') stride += 4;
      else if(prop.type === 'uchar') stride += 1;
      else if(prop.type === 'double') stride += 8;
    }
    return stride;
  }

  _getPropertyOffsets(properties) {
    const offsets = {};
    let current = 0;
    for(const prop of properties) {
      offsets[prop.name] = current;
      if(prop.type === 'float') current += 4;
      else if(prop.type === 'uchar') current += 1;
      else if(prop.type === 'double') current += 8;
    }
    return offsets;
  }

  _sigmoid(x) {return 1.0 / (1.0 + Math.exp(-x));}

  initPipeline(device, format = 'rgba16float') {
    if(GaussianSplatLayer._pipelineCache.has(device)) {
      // 1. Retrieve cached layouts and pre-compiled pipelines
      const cached = GaussianSplatLayer._pipelineCache.get(device);
      this.bindGroupLayout = cached.bindGroupLayout;
      this.shaderModule = cached.shaderModule;
      this.pipelineLayout = cached.pipelineLayout;

      this.pipelineVertex = cached.pipelineVertex;
      this.pipelineInstance = cached.pipelineInstance;
    } else {
      // 2. Create shared BindGroupLayout & ShaderModule
      this.bindGroupLayout = device.createBindGroupLayout({
        entries: [
          {binding: 0, visibility: GPUShaderStage.VERTEX, buffer: {type: 'uniform'}},
          {binding: 1, visibility: GPUShaderStage.VERTEX, buffer: {type: 'uniform'}},
          {binding: 2, visibility: GPUShaderStage.VERTEX, buffer: {type: 'uniform'}},
          {binding: 3, visibility: GPUShaderStage.FRAGMENT, externalTexture: {}},
          {binding: 4, visibility: GPUShaderStage.FRAGMENT, sampler: {type: 'filtering'}}
        ]
      });

      this.shaderModule = device.createShaderModule({
        label: 'Splat shader',
        code: this._getRenderShaderCode()
      });

      this.pipelineLayout = device.createPipelineLayout({
        bindGroupLayouts: [this.bindGroupLayout]
      });

      const commonFragment = {
        module: this.shaderModule,
        entryPoint: 'fs_main',
        targets: [
          {
            format: format,
            blend: {
              color: {srcFactor: 'src-alpha', dstFactor: 'one-minus-src-alpha', operation: 'add'},
              alpha: {srcFactor: 'one', dstFactor: 'one-minus-src-alpha', operation: 'add'}
            }
          },
          {format: 'rgba16float'},
          {format: 'rgba16float'}
        ]
      };

      const commonDepthStencil = {
        format: 'depth24plus',
        depthWriteEnabled: false,
        depthCompare: 'less'
      };

      // Variant 1: Points / Mesh (stepMode: 'vertex')
      this.pipelineVertex = device.createRenderPipeline({
        label: 'Splat render pipeline (vertex mode)',
        layout: this.pipelineLayout,
        vertex: {
          module: this.shaderModule,
          entryPoint: 'vs_main',
          buffers: [
            {arrayStride: 56, stepMode: 'vertex', attributes: [{shaderLocation: 2, offset: 28, format: 'float32x3'}, {shaderLocation: 3, offset: 40, format: 'float32x4'}]},
            {arrayStride: 16, stepMode: 'vertex', attributes: [{shaderLocation: 1, offset: 0, format: 'float32x4'}]},
            {arrayStride: 12, stepMode: 'vertex', attributes: [{shaderLocation: 0, offset: 0, format: 'float32x3'}]},
            {arrayStride: 8, stepMode: 'vertex', attributes: [{shaderLocation: 4, offset: 0, format: 'float32x2'}]}
          ]
        },
        fragment: commonFragment,
        primitive: {topology: 'triangle-list', cullMode: 'none'},
        depthStencil: commonDepthStencil
      });

      // Variant 2: Quads (stepMode: 'instance')
      this.pipelineInstance = device.createRenderPipeline({
        label: 'Splat render pipeline (instance mode)',
        layout: this.pipelineLayout,
        vertex: {
          module: this.shaderModule,
          entryPoint: 'vs_main',
          buffers: [
            {arrayStride: 56, stepMode: 'instance', attributes: [{shaderLocation: 2, offset: 28, format: 'float32x3'}, {shaderLocation: 3, offset: 40, format: 'float32x4'}]},
            {arrayStride: 16, stepMode: 'instance', attributes: [{shaderLocation: 1, offset: 0, format: 'float32x4'}]},
            {arrayStride: 12, stepMode: 'instance', attributes: [{shaderLocation: 0, offset: 0, format: 'float32x3'}]},
            {arrayStride: 8, stepMode: 'instance', attributes: [{shaderLocation: 4, offset: 0, format: 'float32x2'}]}
          ]
        },
        fragment: commonFragment,
        primitive: {topology: 'triangle-list', cullMode: 'none'},
        depthStencil: commonDepthStencil
      });

      // 3. Cache both variants in the global map
      GaussianSplatLayer._pipelineCache.set(device, {
        bindGroupLayout: this.bindGroupLayout,
        shaderModule: this.shaderModule,
        pipelineLayout: this.pipelineLayout,
        pipelineVertex: this.pipelineVertex,
        pipelineInstance: this.pipelineInstance
      });
    }

    // Default main handle for engine loop
    this.pipeline = this.pipelineVertex;
  }

  _getRenderShaderCode() {
    return `struct Camera {
  mvp: mat4x4<f32>,
};

struct Model {
  matrix: mat4x4<f32>,
};

struct Scale {
  factor: f32,
  splatSize: f32,
  renderMode: f32, // 0.0 = points/mesh, 1.0 = quads
  pad0: f32,
};

@group(0) @binding(0) var<uniform> camera: Camera;
@group(0) @binding(1) var<uniform> model: Model;
@group(0) @binding(2) var<uniform> scale: Scale;
@group(0) @binding(3) var videoTexture: texture_external;
@group(0) @binding(4) var videoSampler: sampler;

struct VertexInput {
  @location(0) position: vec3<f32>,
  @location(1) colorOpacity: vec4<f32>,
  @location(2) scale: vec3<f32>,
  @location(3) rotation: vec4<f32>,
  @location(4) uv: vec2<f32>,
};

struct VertexOutput {
  @builtin(position) clipPos: vec4<f32>,
  @location(0) color: vec3<f32>,
  @location(1) opacity: f32,
  @location(2) worldPos: vec3<f32>,
  @location(3) uv: vec2<f32>,
};

struct FragOut {
  @location(0) color: vec4<f32>,
  @location(1) normal: vec4<f32>,
  @location(2) worldPos: vec4<f32>,
};

@vertex
fn vs_main(
  @builtin(vertex_index) vertexIdx: u32,
  in: VertexInput
) -> VertexOutput {
  var out: VertexOutput;

  var pos = in.position * scale.factor;

  // Quads / Billboard expansion logic
  if (scale.renderMode > 0.5) {
    var quadCorners = array<vec2<f32>, 6>(
      vec2<f32>(-0.5, -0.5),
      vec2<f32>( 0.5, -0.5),
      vec2<f32>(-0.5,  0.5),
      vec2<f32>(-0.5,  0.5),
      vec2<f32>( 0.5, -0.5),
      vec2<f32>( 0.5,  0.5)
    );
    let corner = quadCorners[vertexIdx];
    pos += vec3<f32>(corner * scale.splatSize, 0.0);
  }

  let worldPos = model.matrix * vec4<f32>(pos, 1.0);
  out.clipPos = camera.mvp * worldPos;
  out.color = in.colorOpacity.rgb;
  out.opacity = in.colorOpacity.a;
  out.worldPos = worldPos.xyz;
  out.uv = in.uv;
  return out;
}

@fragment
fn fs_main(in: VertexOutput) -> FragOut {
  var out: FragOut;
  let videoColor = textureSampleBaseClampToEdge(videoTexture, videoSampler, in.uv);
  let finalColor = mix(in.color, videoColor.rgb, 0.85);

  out.color = vec4<f32>(finalColor, in.opacity);
  out.normal = vec4<f32>(0.0, 0.0, 1.0, 1.0);
  out.worldPos = vec4<f32>(in.worldPos, 1.0);
  return out;
}`;
  }

  attachPositionAnimator(animator) {
    this.positionAnimator = animator;
  }

  detachPositionAnimator() {
    this.positionAnimator = null;
  }

  /**
 * Builds a target array of exactly `sampleCount` points by directly
 * sampling the mesh's own vertex positions (no triangle interpolation).
 * If sampleCount > mesh vertex count, vertices repeat.
 */
  sampleMeshVertices(positions, sampleCount) {
    const meshVertCount = positions.length / 3;
    const out = new Float32Array(sampleCount * 3);
    for(let i = 0;i < sampleCount;i++) {
      const srcIdx = i % meshVertCount; // or Math.floor(Math.random() * meshVertCount) for shuffled
      out[i * 3] = positions[srcIdx * 3];
      out[i * 3 + 1] = positions[srcIdx * 3 + 1];
      out[i * 3 + 2] = positions[srcIdx * 3 + 2];
    }
    return out;
  }

  /**
   * Remaps a flat xyz array between axis conventions.
   * Default: identity (no change).
   *
   * @param {Float32Array} positions  flat xyz triplets
   * @param {object} [opts]
   * @param {'Y_UP'|'Z_UP'} [opts.from='Y_UP']  source convention
   * @param {'Y_UP'|'Z_UP'} [opts.to='Y_UP']    target convention
   * @param {boolean} [opts.flipZ=false]        negate Z (e.g. glTF +Z forward → engine -Z forward)
   * @returns {Float32Array}  new remapped array (does not mutate input)
   */
  remapAxes(positions, opts = {}) {
    const {from = 'Y_UP', to = 'Z_UP', flipZ = false} = opts;
    const n = positions.length / 3;
    const out = new Float32Array(positions.length);

    // Z_UP -> Y_UP: swap Y and Z, then negate new Z (standard Blender->engine fix)
    const needsSwap = from === 'Z_UP' && to === 'Y_UP';
    // Y_UP -> Z_UP: inverse swap
    const needsSwapInverse = from === 'Y_UP' && to === 'Z_UP';

    for(let i = 0;i < n;i++) {
      let x = positions[i * 3];
      let y = positions[i * 3 + 1];
      let z = positions[i * 3 + 2];

      if(needsSwap) {
        // Blender Z-up (x, y, z) -> Y-up (x, z, -y)
        const ty = z;
        const tz = -y;
        y = ty;
        z = tz;
      } else if(needsSwapInverse) {
        // Y-up -> Z-up (inverse of above)
        const ty = -z;
        const tz = y;
        y = ty;
        z = tz;
      }

      if(flipZ) z = -z;

      out[i * 3] = x;
      out[i * 3 + 1] = y;
      out[i * 3 + 2] = z;
    }

    return out;
  }

  // render(pass, mesh, viewProjMatrix) {
  //   this.device.queue.writeBuffer(this.modelBuffer, 0, mesh.modelMatrix);
  //   this.device.queue.writeBuffer(this.cameraBuffer, 0, viewProjMatrix);
  //   this.device.queue.writeBuffer(this.scaleBuffer, 0, this._scaleData);
  //   pass.setBindGroup(0, this.bindGroup);
  //   pass.setVertexBuffer(0, this.vertexBuffer);
  //   pass.setVertexBuffer(1, this.colorBuffer);
  //   pass.setVertexBuffer(2, this.positionAnimator ? this.positionAnimator.posBuffer : this.dummyPosBuffer);

  //   pass.setVertexBuffer(3, this.dummyUVBuffer);

  //   pass.draw(this.vertexCount, 1, 0, 0);
  // }

  render(pass, mesh, viewProjMatrix) {
    // Pack mode uniform: [scaleFactor, splatSize, renderMode, padding]
    const modeFlag = this.renderMode === 'quads' ? 1.0 : 0.0;
    this._scaleData[0] = this.splatScale;
    this._scaleData[1] = this.splatSize;
    this._scaleData[2] = modeFlag;

    this.device.queue.writeBuffer(this.modelBuffer, 0, mesh.modelMatrix);
    this.device.queue.writeBuffer(this.cameraBuffer, 0, viewProjMatrix);
    this.device.queue.writeBuffer(this.scaleBuffer, 0, this._scaleData);

    pass.setBindGroup(0, this.bindGroup);
    pass.setVertexBuffer(0, this.vertexBuffer);
    pass.setVertexBuffer(1, this.colorBuffer);
    pass.setVertexBuffer(2, this.positionAnimator ? this.positionAnimator.posBuffer : this.dummyPosBuffer);
    pass.setVertexBuffer(3, this.dummyUVBuffer);

    if(this.renderMode === 'mesh' && this.meshIndexBuffer) {
      // MODE 1: Solid Face Mesh Surface
      pass.setIndexBuffer(this.meshIndexBuffer, 'uint16');
      pass.drawIndexed(this.meshIndexCount, 1, 0, 0, 0);
    } else if(this.renderMode === 'quads') {
      // MODE 2: Instanced Quad Splats (6 vertices per point)
      pass.draw(6, this.vertexCount, 0, 0);
    } else {
      // MODE 3: Original Points
      pass.draw(this.vertexCount, 1, 0, 0);
    }
  }

  setScale(scale) {
    this.splatScale = scale;
    this._scaleData[0] = scale;
  }

  getAABB() {return {min: this.aabbMin, max: this.aabbMax}}

  destroy() {
    this.vertexBuffer?.destroy();
    this.indexBuffer?.destroy();
  }
}