import {mat4} from 'wgpu-matrix';
import {Position, Rotation} from "./matrix-class";
import {vertexMorphWGSL} from '../shaders/vertex.procedural.wgsl';
import {degToRad, genName, LOG_FUNNY_ARCADE, LOG_FUNNY_SMALL} from './utils';
import Materials from './materials';
import {GeometryFactory} from './geometry-factory';
// import {VERTEX_ANIM_FLAGS} from './literals';

/**
 * ProceduralMeshObj - WebGPU mesh entity with procedural geometry & morphing
 * 
 * KEY FEATURES:
 * - Loads geometry from GeometryFactory (no file I/O)
 * - GPU-accelerated morphing between two meshes
 * - Reuses Materials + shader pipeline from MEMeshObj
 * - NO GLB/OBJ parsing, skinning, or tangents
 * 
 * USAGE:
 * const mesh = new ProceduralMeshObj(canvas, device, context, {
 *   name: 'morphCube',
 *   geometryA: {type: 'cube', size: 1},
 *   geometryB: {type: 'sphere', size: 1, segments: 16},
 *   material: {...},
 *   position: {x:0, y:0, z:0},
 *   rotation: {x:0, y:0, z:0},
 *   cameras: [...],
 *   mainCameraParams: {...}
 * });
 * 
 * // Morph API
 * mesh.setMorphBlend(0.5); // 50% cube, 50% sphere
 * mesh.morphTo(1.0, 2000); // animate to sphere over 2 seconds
 */
export default class ProceduralMeshObj extends Materials {
  constructor(canvas, device, context, o, inputHandler, globalAmbient) {
    super(device, o.material, null, o.textureCache);
    // ============================================================================
    // SETUP - Name, Canvas, Device
    // ============================================================================
    this.name = o.name || genName(3);
    this.done = false;
    this.canvas = canvas;
    this.device = device;
    this.context = context;
    this.globalAmbient = [...globalAmbient];

    // ============================================================================
    // MATERIAL SETUP
    // ============================================================================
    this.material = o.material;
    if(typeof this.material.useBlend === 'undefined') {
      this.material.useBlend = false;
    }

    // ============================================================================
    // GEOMETRY LOADING - From GeometryFactory
    // ============================================================================
    this.meshA = null;
    this.meshB = null;
    this.morphBlend = 0.0; // 0 = full meshA, 1 = full meshB

    // Load initial geometries
    if(o.geometryA) {
      this.meshA = this._loadGeometry(o.geometryA);
    } else {
      throw new Error('ProceduralMeshObj requires geometryA parameter');
    }

    if(o.geometryB) {
      this.meshB = this._loadGeometry(o.geometryB);
      this._validateMorphCompatibility();
    } else {
      // If no meshB provided, duplicate meshA (no morph)
      this.meshB = this._loadGeometry(o.geometryA);
    }

    console.log(`%cProceduralMesh loaded: ${this.name}`, LOG_FUNNY_ARCADE);

    // ============================================================================
    // TRANSFORM & CAMERA
    // ============================================================================
    this.inputHandler = inputHandler;
    this.cameras = o.cameras;
    this.mainCameraParams = {
      type: o.mainCameraParams.type,
      responseCoef: o.mainCameraParams.responseCoef
    };
    this.lastFrameMS = 0;

    this.position = new Position(o.position.x, o.position.y, o.position.z);
    this.rotation = new Rotation(o.rotation.x, o.rotation.y, o.rotation.z);
    this.rotation.rotationSpeed.x = o.rotationSpeed?.x || 0;
    this.rotation.rotationSpeed.y = o.rotationSpeed?.y || 0;
    this.rotation.rotationSpeed.z = o.rotationSpeed?.z || 0;
    this.scale = o.scale || [1, 1, 1];
    this.useScale = o.useScale || false;

    this.time = 0;
    this.deltaTimeAdapter = 10;
    this.presentationFormat = navigator.gpu.getPreferredCanvasFormat();

    // ============================================================================
    // RAYCAST & EFFECTS (kept for compatibility)
    // ============================================================================
    this.raycast = o.raycast || {enabled: false, radius: 2};
    this.pointerEffect = o.pointerEffect || {enabled: false};

    // ============================================================================
    // MORPH ANIMATION STATE
    // ============================================================================
    this.morphAnimation = {
      active: false,
      startBlend: 0.0,
      targetBlend: 1.0,
      duration: 1000, // ms
      elapsed: 0,
      onComplete: null
    };

    // ============================================================================
    // INIT PIPELINE
    // ============================================================================
    this.runProgram = () => {
      return new Promise(async (resolve) => {
        this.shadowDepthTextureSize = 1024;
        this.modelViewProjectionMatrix = mat4.create();

        // Load textures if provided
        if(o.texturesPaths && o.texturesPaths.length > 0) {
          this.texturesPaths = [...o.texturesPaths];
          await this.loadTex0(this.texturesPaths);
        } else {
          // Create default white texture
          await this._createDefaultTexture();
        }

        resolve();
      });
    };

    this.runProgram().then(() => {
      this._setupBuffers();
      this._setupUniforms();
      this._setupPipeline();
      this.done = true;

      console.log(`%cProceduralMesh ready: ${this.name}`, LOG_FUNNY_SMALL);
    });
  }

  // ============================================================================
  // GEOMETRY LOADING
  // ============================================================================

  _loadGeometry(spec) {
    const {type, size, segments, options} = spec;
    const geo = GeometryFactory.create(type, size, segments, options);

    return {
      vertices: geo.positions,
      normals: this._generateNormals(geo.positions, geo.indices),
      uvs: geo.uvs,
      indices: geo.indices,
      vertexCount: geo.positions.length / 3
    };
  }

  _generateNormals(positions, indices) {
    const normals = new Float32Array(positions.length);

    // Calculate face normals
    for(let i = 0;i < indices.length;i += 3) {
      const i0 = indices[i] * 3;
      const i1 = indices[i + 1] * 3;
      const i2 = indices[i + 2] * 3;

      const v0 = [positions[i0], positions[i0 + 1], positions[i0 + 2]];
      const v1 = [positions[i1], positions[i1 + 1], positions[i1 + 2]];
      const v2 = [positions[i2], positions[i2 + 1], positions[i2 + 2]];

      const edge1 = [v1[0] - v0[0], v1[1] - v0[1], v1[2] - v0[2]];
      const edge2 = [v2[0] - v0[0], v2[1] - v0[1], v2[2] - v0[2]];

      const normal = [
        edge1[1] * edge2[2] - edge1[2] * edge2[1],
        edge1[2] * edge2[0] - edge1[0] * edge2[2],
        edge1[0] * edge2[1] - edge1[1] * edge2[0]
      ];

      // Accumulate normals for each vertex
      for(let j = 0;j < 3;j++) {
        const idx = indices[i + j] * 3;
        normals[idx] += normal[0];
        normals[idx + 1] += normal[1];
        normals[idx + 2] += normal[2];
      }
    }

    // Normalize
    for(let i = 0;i < normals.length;i += 3) {
      const len = Math.sqrt(
        normals[i] * normals[i] +
        normals[i + 1] * normals[i + 1] +
        normals[i + 2] * normals[i + 2]
      );
      if(len > 0) {
        normals[i] /= len;
        normals[i + 1] /= len;
        normals[i + 2] /= len;
      }
    }

    return normals;
  }

  _validateMorphCompatibility() {
    if(this.meshA.vertexCount !== this.meshB.vertexCount) {
      console.warn(
        `⚠️ Morph vertex count mismatch: A=${this.meshA.vertexCount}, B=${this.meshB.vertexCount}. ` +
        `Padding will be applied but results may be incorrect.`
      );
      this._padMeshesToMatch();
    }
  }

  _padMeshesToMatch() {
    const maxCount = Math.max(this.meshA.vertexCount, this.meshB.vertexCount);

    if(this.meshA.vertexCount < maxCount) {
      this.meshA = this._padMesh(this.meshA, maxCount);
    }
    if(this.meshB.vertexCount < maxCount) {
      this.meshB = this._padMesh(this.meshB, maxCount);
    }
  }

  _padMesh(mesh, targetCount) {
    const padCount = targetCount - mesh.vertexCount;
    const lastVertIdx = (mesh.vertexCount - 1) * 3;

    const paddedVertices = new Float32Array(targetCount * 3);
    paddedVertices.set(mesh.vertices);
    for(let i = 0;i < padCount;i++) {
      paddedVertices.set(
        mesh.vertices.slice(lastVertIdx, lastVertIdx + 3),
        (mesh.vertexCount + i) * 3
      );
    }

    const paddedNormals = new Float32Array(targetCount * 3);
    paddedNormals.set(mesh.normals);
    for(let i = 0;i < padCount;i++) {
      paddedNormals.set(
        mesh.normals.slice(lastVertIdx, lastVertIdx + 3),
        (mesh.vertexCount + i) * 3
      );
    }

    const paddedUVs = new Float32Array(targetCount * 2);
    paddedUVs.set(mesh.uvs);
    const lastUVIdx = (mesh.vertexCount - 1) * 2;
    for(let i = 0;i < padCount;i++) {
      paddedUVs.set(
        mesh.uvs.slice(lastUVIdx, lastUVIdx + 2),
        (mesh.vertexCount + i) * 2
      );
    }

    return {
      vertices: paddedVertices,
      normals: paddedNormals,
      uvs: paddedUVs,
      indices: mesh.indices,
      vertexCount: targetCount
    };
  }

  async _createDefaultTexture() {
    const textureData = new Uint8Array([255, 255, 255, 255]); // White pixel

    const texture = this.device.createTexture({
      size: [1, 1, 1],
      format: 'rgba8unorm',
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
    });

    this.device.queue.writeTexture(
      {texture},
      textureData,
      {bytesPerRow: 4},
      {width: 1, height: 1}
    );

    this.meshTexture = texture;
    this.meshTextureView = texture.createView();

    // Create default metallic/roughness texture
    this.metallicRoughnessTexture = this.device.createTexture({
      size: [1, 1, 1],
      format: 'rgba8unorm',
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
    });
    this.device.queue.writeTexture(
      {texture: this.metallicRoughnessTexture},
      new Uint8Array([0, 128, 0, 255]), // G=roughness=0.5, B=metallic=0
      {bytesPerRow: 4},
      {width: 1, height: 1}
    );
    this.metallicRoughnessTextureView = this.metallicRoughnessTexture.createView();
  }

  // ============================================================================
  // BUFFER SETUP
  // ============================================================================

  _setupBuffers() {
    this.context.configure({
      device: this.device,
      format: this.presentationFormat,
      alphaMode: 'premultiplied',
    });


    // vertex Anim
    this.vertexAnimParams = new Float32Array([
      0.0, 0.0, 0.0, 0.0, 2.0, 0.1, 2.0, 0.0, 1.5, 0.3, 2.0, 0.5, 1.0, 0.1, 0.0, 0.0, 1.0, 0.5, 0.0, 0.0, 1.0, 0.05, 0.5, 0.0, 1.0, 0.05, 2.0, 0.0, 1.0, 0.1, 0.0, 0.0,
    ]);

    this.vertexAnimBuffer = this.device.createBuffer({
      label: "Vertex Animation Params",
      size: this.vertexAnimParams.byteLength, // 128 bytes
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    this.vertexAnim = {
      enableWave: () => {
        this.vertexAnimParams[1] |= VERTEX_ANIM_FLAGS.WAVE;
        this.updateVertexAnimBuffer();
      },
      disableWave: () => {
        this.vertexAnimParams[1] &= ~VERTEX_ANIM_FLAGS.WAVE;
        this.updateVertexAnimBuffer();
      },
      enableWind: () => {
        this.vertexAnimParams[1] |= VERTEX_ANIM_FLAGS.WIND;
        this.updateVertexAnimBuffer();
      },
      disableWind: () => {
        this.vertexAnimParams[1] &= ~VERTEX_ANIM_FLAGS.WIND;
        this.updateVertexAnimBuffer();
      },
      enablePulse: () => {
        this.vertexAnimParams[1] |= VERTEX_ANIM_FLAGS.PULSE;
        this.updateVertexAnimBuffer();
      },
      disablePulse: () => {
        this.vertexAnimParams[1] &= ~VERTEX_ANIM_FLAGS.PULSE;
        this.updateVertexAnimBuffer();
      },
      enableTwist: () => {
        this.vertexAnimParams[1] |= VERTEX_ANIM_FLAGS.TWIST;
        this.updateVertexAnimBuffer();
      },
      disableTwist: () => {
        this.vertexAnimParams[1] &= ~VERTEX_ANIM_FLAGS.TWIST;
        this.updateVertexAnimBuffer();
      },
      enableNoise: () => {
        this.vertexAnimParams[1] |= VERTEX_ANIM_FLAGS.NOISE;
        this.updateVertexAnimBuffer();
      },
      disableNoise: () => {
        this.vertexAnimParams[1] &= ~VERTEX_ANIM_FLAGS.NOISE;
        this.updateVertexAnimBuffer();
      },
      enableOcean: () => {
        this.vertexAnimParams[1] |= VERTEX_ANIM_FLAGS.OCEAN;
        this.updateVertexAnimBuffer();
      },
      disableOcean: () => {
        this.vertexAnimParams[1] &= ~VERTEX_ANIM_FLAGS.OCEAN;
        this.updateVertexAnimBuffer();
      },
      enable: (...effects) => {
        effects.forEach(effect => {
          this.vertexAnimParams[1] |= VERTEX_ANIM_FLAGS[effect.toUpperCase()];
        });
        this.updateVertexAnimBuffer();
      },
      disable: (...effects) => {
        effects.forEach(effect => {
          this.vertexAnimParams[1] &= ~VERTEX_ANIM_FLAGS[effect.toUpperCase()];
        });
        this.updateVertexAnimBuffer();
      },
      disableAll: () => {
        this.vertexAnimParams[1] = 0;
        this.updateVertexAnimBuffer();
      },
      isEnabled: (effect) => {return (this.vertexAnimParams[1] & VERTEX_ANIM_FLAGS[effect.toUpperCase()]) !== 0;},
      setWaveParams: (speed, amplitude, frequency) => {
        this.vertexAnimParams[4] = speed;
        this.vertexAnimParams[5] = amplitude;
        this.vertexAnimParams[6] = frequency;
        this.updateVertexAnimBuffer();
      },
      setWindParams: (speed, strength, heightInfluence, turbulence) => {
        this.vertexAnimParams[8] = speed;
        this.vertexAnimParams[9] = strength;
        this.vertexAnimParams[10] = heightInfluence;
        this.vertexAnimParams[11] = turbulence;
        this.updateVertexAnimBuffer();
      },
      setPulseParams: (speed, amount, centerX = 0, centerY = 0) => {
        this.vertexAnimParams[12] = speed;
        this.vertexAnimParams[13] = amount;
        this.vertexAnimParams[14] = centerX;
        this.vertexAnimParams[15] = centerY;
        this.updateVertexAnimBuffer();
      },
      setTwistParams: (speed, amount) => {
        this.vertexAnimParams[16] = speed;
        this.vertexAnimParams[17] = amount;
        this.updateVertexAnimBuffer();
      },
      setNoiseParams: (scale, strength, speed) => {
        this.vertexAnimParams[20] = scale;
        this.vertexAnimParams[21] = strength;
        this.vertexAnimParams[22] = speed;
        this.updateVertexAnimBuffer();
      },
      setOceanParams: (scale, height, speed) => {
        this.vertexAnimParams[24] = scale;
        this.vertexAnimParams[25] = height;
        this.vertexAnimParams[26] = speed;
        this.updateVertexAnimBuffer();
      },
      setIntensity: (value) => {
        this.vertexAnimParams[2] = Math.max(0, Math.min(1, value));
        this.updateVertexAnimBuffer();
      },
      getIntensity: () => {return this.vertexAnimParams[2]}
    };

    this.updateVertexAnimBuffer = () => {
      this.device.queue.writeBuffer(this.vertexAnimBuffer, 0, this.vertexAnimParams);
    };

    // globalIntensity
    this.vertexAnimParams[2] = 1.0;
    this.updateVertexAnimBuffer();

    // Vertex buffer A (positions)
    this.vertexBufferA = this.device.createBuffer({
      size: this.meshA.vertices.byteLength,
      usage: GPUBufferUsage.VERTEX,
      mappedAtCreation: true,
    });
    new Float32Array(this.vertexBufferA.getMappedRange()).set(this.meshA.vertices);
    this.vertexBufferA.unmap();

    // Vertex buffer B (positions)
    this.vertexBufferB = this.device.createBuffer({
      size: this.meshB.vertices.byteLength,
      usage: GPUBufferUsage.VERTEX,
      mappedAtCreation: true,
    });
    new Float32Array(this.vertexBufferB.getMappedRange()).set(this.meshB.vertices);
    this.vertexBufferB.unmap();

    // Normal buffer A
    this.normalBufferA = this.device.createBuffer({
      size: this.meshA.normals.byteLength,
      usage: GPUBufferUsage.VERTEX,
      mappedAtCreation: true,
    });
    new Float32Array(this.normalBufferA.getMappedRange()).set(this.meshA.normals);
    this.normalBufferA.unmap();

    // Normal buffer B
    this.normalBufferB = this.device.createBuffer({
      size: this.meshB.normals.byteLength,
      usage: GPUBufferUsage.VERTEX,
      mappedAtCreation: true,
    });
    new Float32Array(this.normalBufferB.getMappedRange()).set(this.meshB.normals);
    this.normalBufferB.unmap();

    // UV buffer (shared)
    this.uvBuffer = this.device.createBuffer({
      size: this.meshA.uvs.byteLength,
      usage: GPUBufferUsage.VERTEX,
      mappedAtCreation: true,
    });
    new Float32Array(this.uvBuffer.getMappedRange()).set(this.meshA.uvs);
    this.uvBuffer.unmap();

    // Index buffer (shared - use meshA's indices)
    this.indexCount = this.meshA.indices.length;
    const indexSize = Math.ceil(this.indexCount * Uint16Array.BYTES_PER_ELEMENT / 4) * 4;

    this.indexBuffer = this.device.createBuffer({
      size: indexSize,
      usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
      mappedAtCreation: true,
    });
    new Uint16Array(this.indexBuffer.getMappedRange()).set(this.meshA.indices);
    this.indexBuffer.unmap();

    // Vertex buffer layout for morph shader
    this.vertexBuffers = [
      {
        arrayStride: Float32Array.BYTES_PER_ELEMENT * 3,
        attributes: [{shaderLocation: 0, offset: 0, format: "float32x3"}], // posA
      },
      {
        arrayStride: Float32Array.BYTES_PER_ELEMENT * 3,
        attributes: [{shaderLocation: 1, offset: 0, format: "float32x3"}], // normalA
      },
      {
        arrayStride: Float32Array.BYTES_PER_ELEMENT * 2,
        attributes: [{shaderLocation: 2, offset: 0, format: "float32x2"}], // uv
      },
      {
        arrayStride: Float32Array.BYTES_PER_ELEMENT * 3,
        attributes: [{shaderLocation: 6, offset: 0, format: "float32x3"}], // posB
      },
      {
        arrayStride: Float32Array.BYTES_PER_ELEMENT * 3,
        attributes: [{shaderLocation: 7, offset: 0, format: "float32x3"}], // normalB
      },
    ];

    this.primitive = {
      topology: 'triangle-list',
      cullMode: 'back',
      frontFace: 'ccw'
    };
  }

  // ============================================================================
  // UNIFORMS SETUP
  // ============================================================================

  _setupUniforms() {

    this.modelUniformBuffer = this.device.createBuffer({
      size: 64,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    // Scene uniform (camera + lights)
    this.sceneUniformBuffer = this.device.createBuffer({
      label: 'sceneUniformBuffer procedural',
      size: 192,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    // 2. Dummy Bone Buffer (Binding 1) - To satisfy Shadow Shader
    // Size must be at least 6400 bytes
    this.boneDummyBuffer = this.device.createBuffer({
      label: 'dummy bones for shadow shader',
      size: 6400,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    // // 3. Vertex Animation (Binding 2)
    // this.vertexAnimBuffer = this.device.createBuffer({
    //   size: 128,
    //   usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    // });

    // 4. Morph Blend (Binding 3 - Note: You'll need to update your Morph shader too)
    this.morphBlendBuffer = this.device.createBuffer({
      size: 4,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    this.uniformBufferBindGroupLayout = this.device.createBindGroupLayout({
      label: 'ProceduralMesh BindGroupLayout',
      entries: [
        {binding: 0, visibility: GPUShaderStage.VERTEX, buffer: {type: 'uniform'}}, // Model
        {binding: 1, visibility: GPUShaderStage.VERTEX, buffer: {type: 'uniform'}}, // Bones (Must be 6400+ bytes)
        {binding: 2, visibility: GPUShaderStage.VERTEX, buffer: {type: 'uniform'}}, // Anim
        {binding: 3, visibility: GPUShaderStage.VERTEX, buffer: {type: 'uniform'}}, // Morph
      ],
    });

    // 2. Create the Bind Group (The "Data")
    this.modelBindGroup = this.device.createBindGroup({
      label: 'ProceduralMesh BindGroup',
      layout: this.uniformBufferBindGroupLayout,
      entries: [
        {binding: 0, resource: {buffer: this.modelUniformBuffer}},
        {binding: 1, resource: {buffer: this.boneDummyBuffer}}, // The 6400 byte buffer
        {binding: 2, resource: {buffer: this.vertexAnimBuffer}},
        {binding: 3, resource: {buffer: this.morphBlendBuffer}},
      ],
    });




    this._sceneData = new Float32Array(48);
  }

  // ============================================================================
  // PIPELINE SETUP
  // ============================================================================

  _setupPipeline() {
    // Create render bind group layout (same as MEMeshObj)
    this.createLayoutForRender();
    this.createBindGroupForRender();

    this.pipeline = this.device.createRenderPipeline({
      label: 'Procedural Mesh Pipeline [OPAQUE]',
      layout: this.device.createPipelineLayout({
        bindGroupLayouts: [
          this.bglForRender,
          this.uniformBufferBindGroupLayout,
        ],
      }),
      vertex: {
        entryPoint: 'main',
        module: this.device.createShaderModule({
          code: vertexMorphWGSL,
        }),
        buffers: this.vertexBuffers,
      },
      fragment: {
        entryPoint: 'main',
        module: this.device.createShaderModule({
          code: this.getMaterial(), // Inherited from Materials
        }),
        targets: [{format: 'rgba16float', blend: undefined}],
        constants: {shadowDepthTextureSize: this.shadowDepthTextureSize},
      },
      depthStencil: {
        depthWriteEnabled: true,
        depthCompare: 'less',
        format: 'depth24plus',
      },
      primitive: this.primitive,
    });

    this.pipelineTransparent = this.device.createRenderPipeline({
      label: 'Procedural Mesh Pipeline [TRANSPARENT]',
      layout: this.device.createPipelineLayout({
        bindGroupLayouts: [
          this.bglForRender,
          this.uniformBufferBindGroupLayout,
        ],
      }),
      vertex: {
        entryPoint: 'main',
        module: this.device.createShaderModule({
          code: vertexMorphWGSL,
        }),
        buffers: this.vertexBuffers,
      },
      fragment: {
        entryPoint: 'main',
        module: this.device.createShaderModule({
          code: this.getMaterial(),
        }),
        targets: [{
          format: 'rgba16float',
          blend: {
            color: {srcFactor: 'src-alpha', dstFactor: 'one-minus-src-alpha', operation: 'add'},
            alpha: {srcFactor: 'one', dstFactor: 'one-minus-src-alpha', operation: 'add'},
          },
        }],
        constants: {shadowDepthTextureSize: this.shadowDepthTextureSize},
      },
      depthStencil: {
        depthWriteEnabled: false,
        depthCompare: 'less',
        format: 'depth24plus',
      },
      primitive: this.primitive,
    });
  }

  // ============================================================================
  // PUBLIC MORPH API
  // ============================================================================

  /**
   * Set instant morph blend factor
   * @param {number} t - Blend factor (0.0 = meshA, 1.0 = meshB)
   */
  setMorphBlend(t) {
    this.morphBlend = Math.max(0, Math.min(1, t));
    if(this.morphBlendBuffer) {
      this.device.queue.writeBuffer(
        this.morphBlendBuffer,
        0,
        new Float32Array([this.morphBlend])
      );
    }
  }

  /**
   * Animate morph from current blend to target
   * @param {number} targetBlend - Target blend factor (0.0-1.0)
   * @param {number} duration - Duration in milliseconds
   * @param {function} onComplete - Optional callback when animation finishes
   */
  morphTo(targetBlend, duration = 1000, onComplete = null) {
    this.morphAnimation.active = true;
    this.morphAnimation.startBlend = this.morphBlend;
    this.morphAnimation.targetBlend = Math.max(0, Math.min(1, targetBlend));
    this.morphAnimation.duration = duration;
    this.morphAnimation.elapsed = 0;
    this.morphAnimation.onComplete = onComplete;
  }

  /**
   * Switch to entirely new geometries
   * @param {object} specA - GeometryFactory spec for mesh A
   * @param {object} specB - GeometryFactory spec for mesh B
   */
  switchMesh(specA, specB) {
    // Load new geometries
    this.meshA = this._loadGeometry(specA);
    this.meshB = this._loadGeometry(specB);
    this._validateMorphCompatibility();

    // Recreate buffers
    this.vertexBufferA?.destroy();
    this.vertexBufferB?.destroy();
    this.normalBufferA?.destroy();
    this.normalBufferB?.destroy();
    this.uvBuffer?.destroy();
    this.indexBuffer?.destroy();

    this._setupBuffers();

    // Reset morph blend
    this.setMorphBlend(0.0);

    console.log(`%cMesh switched: ${this.name}`, LOG_FUNNY_SMALL);
  }

  /**
   * Update morph animation (call from render loop)
   * @param {number} deltaTime - Time since last frame in milliseconds
   */
  updateMorphAnimation(deltaTime) {
    if(!this.morphAnimation.active) return;

    this.morphAnimation.elapsed += deltaTime;
    const t = Math.min(1, this.morphAnimation.elapsed / this.morphAnimation.duration);

    // Smooth easing (ease-in-out)
    const eased = t < 0.5
      ? 2 * t * t
      : 1 - Math.pow(-2 * t + 2, 2) / 2;

    const blend = this.morphAnimation.startBlend +
      (this.morphAnimation.targetBlend - this.morphAnimation.startBlend) * eased;

    this.setMorphBlend(blend);

    if(t >= 1) {
      this.morphAnimation.active = false;
      if(this.morphAnimation.onComplete) {
        this.morphAnimation.onComplete();
      }
    }
  }

  // ============================================================================
  // TRANSFORM & UPDATE
  // ============================================================================

  getModelMatrix(pos, useScale = false) {
    let modelMatrix = mat4.identity();
    mat4.translate(modelMatrix, [pos.x, pos.y, pos.z], modelMatrix);

    mat4.rotateX(modelMatrix, this.rotation.getRotX(), modelMatrix);
    mat4.rotateY(modelMatrix, this.rotation.getRotY(), modelMatrix);
    mat4.rotateZ(modelMatrix, this.rotation.getRotZ(), modelMatrix);

    if(useScale) {
      mat4.scale(modelMatrix, [this.scale[0], this.scale[1], this.scale[2]], modelMatrix);
    }

    return modelMatrix;
  }

  updateModelUniformBuffer() {
    if(!this.done) return;

    const modelMatrix = this.getModelMatrix(this.position, this.useScale);
    this.device.queue.writeBuffer(
      this.modelUniformBuffer,
      0,
      modelMatrix.buffer,
      modelMatrix.byteOffset,
      modelMatrix.byteLength
    );
  }

  getTransformationMatrix(mainRenderBundle, spotLight, index) {
    const now = Date.now();
    const dt = (now - this.lastFrameMS) / this.mainCameraParams.responseCoef;
    this.lastFrameMS = now;

    const camera = this.cameras[this.mainCameraParams.type];
    if(index === 0) camera.update(dt, this.inputHandler());

    const camVP = mat4.multiply(camera.projectionMatrix, camera.view);

    this._sceneData.set(spotLight.viewProjMatrix, 0);
    this._sceneData.set(camVP, 16);
    this._sceneData[32] = camera.position[0];
    this._sceneData[33] = camera.position[1];
    this._sceneData[34] = camera.position[2];
    this._sceneData[35] = 0.0;
    this._sceneData[36] = spotLight.position[0];
    this._sceneData[37] = spotLight.position[1];
    this._sceneData[38] = spotLight.position[2];
    this._sceneData[39] = 0.0;
    this._sceneData[40] = this.globalAmbient[0];
    this._sceneData[41] = this.globalAmbient[1];
    this._sceneData[42] = this.globalAmbient[2];
    this._sceneData[43] = 0.0;
    this._sceneData[44] = this.time;
    this._sceneData[45] = dt;
    this._sceneData[46] = 0;
    this._sceneData[47] = 0;

    this.device.queue.writeBuffer(
      this.sceneUniformBuffer,
      0,
      this._sceneData.buffer,
      this._sceneData.byteOffset,
      this._sceneData.byteLength
    );
  }

  updateTime(time) {
    this.time += time * this.deltaTimeAdapter;
    this.vertexAnimParams[0] = this.time;
    this.device.queue.writeBuffer(this.vertexAnimBuffer, 0, this.vertexAnimParams);
  }

  // ============================================================================
  // RENDERING
  // ============================================================================

  drawElements(pass, lightContainer) {
    pass.setBindGroup(0, this.sceneBindGroupForRender);
    pass.setBindGroup(1, this.modelBindGroup);

    let bindIndex = 2;
    for(const light of lightContainer) {
      pass.setBindGroup(bindIndex++, light.getMainPassBindGroup(this));
    }

    // Bind morph buffers
    pass.setVertexBuffer(0, this.vertexBufferA);  // posA
    pass.setVertexBuffer(1, this.normalBufferA);  // normalA
    pass.setVertexBuffer(2, this.uvBuffer);       // uv
    pass.setVertexBuffer(3, this.vertexBufferB);  // posB
    pass.setVertexBuffer(4, this.normalBufferB);  // normalB

    pass.setIndexBuffer(this.indexBuffer, 'uint16');
    pass.drawIndexed(this.indexCount);
  }

  drawShadows(shadowPass) {
    // For shadows, just use meshA positions
    shadowPass.setVertexBuffer(0, this.vertexBufferA);
    shadowPass.setVertexBuffer(1, this.normalBufferA);
    shadowPass.setVertexBuffer(2, this.uvBuffer);
    shadowPass.setIndexBuffer(this.indexBuffer, 'uint16');
    shadowPass.drawIndexed(this.indexCount);
  }

  getMainPipeline() {
    return this.pipeline;
  }

  // ============================================================================
  // CLEANUP
  // ============================================================================

  destroy() {
    if(this._destroyed) return;
    this._destroyed = true;

    this.vertexBufferA?.destroy();
    this.vertexBufferB?.destroy();
    this.normalBufferA?.destroy();
    this.normalBufferB?.destroy();
    this.uvBuffer?.destroy();
    this.indexBuffer?.destroy();

    this.modelUniformBuffer?.destroy();
    this.sceneUniformBuffer?.destroy();
    this.morphBlendBuffer?.destroy();
    this.vertexAnimBuffer?.destroy();

    this.meshTexture?.destroy();
    this.metallicRoughnessTexture?.destroy();

    this.pipeline = null;
    this.pipelineTransparent = null;
    this.modelBindGroup = null;
    this.sceneBindGroupForRender = null;

    console.info(`🧹 Destroyed ProceduralMesh: ${this.name}`);
  }
}