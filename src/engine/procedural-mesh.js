import {vertexMorphWGSL} from '../shaders/vertex.procedural.wgsl';
import {degToRad, genName, LOG_FUNNY_ARCADE, LOG_FUNNY_SMALL} from './utils';
import Materials from './materials';
import {GeometryFactory} from './geometry-factory';
import {mat4} from 'wgpu-matrix';
import {Position, Rotation} from "./matrix-class";
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


/**
 * ProceduralMeshObj - WebGPU mesh entity with procedural geometry & morphing
 * 
 * Extends Materials class - inherits all material/texture/shader functionality
 * 
 * KEY DIFFERENCES FROM MEMeshObj:
 * - NO GLB/OBJ file loading
 * - NO skinning (joints/weights)
 * - NO tangents (unless needed later)
 * - Geometry from GeometryFactory
 * - GPU-accelerated vertex morphing
 */
export default class ProceduralMeshObj extends Materials {
  constructor(canvas, device, context, o, inputHandler, globalAmbient) {
    // Pass all required params to Materials parent class
    super(device, o.material, null, o.textureCache);
    // BASIC SETUP
    this.name = o.name || genName(3);
    this.done = false;
    this.canvas = canvas;
    this.device = device;
    this.context = context;
    this.globalAmbient = [...globalAmbient];
    // GEOMETRY LOADING
    this.meshA = null;
    this.meshB = null;
    this.morphBlend = 0.0;

    if(o.meshA && o.meshB) {
      this.meshA = o.meshA;
      this.meshB = o.meshB;
      this._validateMorphCompatibility();
    } else if(o.geometryA) {
      // OLD: Generate from GeometryFactory (may not match!)
      this.meshA = this._loadGeometry(o.geometryA);
      this.meshB = o.geometryB
        ? this._loadGeometry(o.geometryB)
        : this._loadGeometry(o.geometryA);
      this._validateMorphCompatibility();
    }
    console.log(`%cProceduralMesh loaded: ${this.name}`, LOG_FUNNY_ARCADE);
    // TRANSFORM & CAMERA
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

    this.raycast = o.raycast || {enabled: false, radius: 2};
    this.pointerEffect = o.pointerEffect || {enabled: false};


    // MORPH ANIMATION STATE

    this.morphAnimation = {
      active: false,
      startBlend: 0.0,
      targetBlend: 1.0,
      duration: 1000,
      elapsed: 0,
      onComplete: null
    };


    // INIT

    this.runProgram = () => {
      return new Promise(async (resolve) => {
        this.shadowDepthTextureSize = 1024;
        this.modelViewProjectionMatrix = mat4.create();

        // Load textures if provided
        if(o.texturesPaths && o.texturesPaths.length > 0 && o.textureCache) {
          this.texturesPaths = [...o.texturesPaths];
          try {
            await this.loadTex0(this.texturesPaths);
          } catch(err) {
            console.warn(`Failed to load texture, using default: ${err.message}`);
            await this._createDefaultTexture();
          }
        } else {
          await this._createDefaultTexture();
        }

        resolve();
      });
    };

    this.runProgram().then(() => {
      this._setupShadowDepthTexture();
      this._setupBuffers();
      this._setupUniforms();
      this._setupPipeline();
      this.done = true;

      console.log(`%cProceduralMesh ready: ${this.name}`, LOG_FUNNY_SMALL);
    });
  }

  // GEOMETRY LOADING
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

  for (let i = 0; i < indices.length; i += 3) {
    const i0 = indices[i] * 3;
    const i1 = indices[i + 1] * 3;
    const i2 = indices[i + 2] * 3;

    const v0 = [positions[i0], positions[i0 + 1], positions[i0 + 2]];
    const v1 = [positions[i1], positions[i1 + 1], positions[i1 + 2]];
    const v2 = [positions[i2], positions[i2 + 1], positions[i2 + 2]];

    const edge1 = [v1[0] - v0[0], v1[1] - v0[1], v1[2] - v0[2]];
    const edge2 = [v2[0] - v0[0], v2[1] - v0[1], v2[2] - v0[2]];

    let normal = [
      edge1[1] * edge2[2] - edge1[2] * edge2[1],
      edge1[2] * edge2[0] - edge1[0] * edge2[2],
      edge1[0] * edge2[1] - edge1[1] * edge2[0]
    ];

    // Normalize
    const len = Math.sqrt(normal[0] ** 2 + normal[1] ** 2 + normal[2] ** 2);
    if (len > 0) {
      normal = normal.map(n => n / len);
    }

    normals[i0] = normal[0];
    normals[i0 + 1] = normal[1];
    normals[i0 + 2] = normal[2];

    normals[i1] = normal[0];
    normals[i1 + 1] = normal[1];
    normals[i1 + 2] = normal[2];

    normals[i2] = normal[0];
    normals[i2 + 1] = normal[1];
    normals[i2 + 2] = normal[2];
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
    const textureData = new Uint8Array([255, 255, 255, 255]);

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

    // Materials expects texture0
    this.texture0 = texture;
    this.meshTexture = texture;
    this.meshTextureView = texture.createView();
  }

  // SHADOW DEPTH TEXTURE (required by Materials.createBindGroupForRender)
  _setupShadowDepthTexture() {
    this.shadowDepthTexture = this.device.createTexture({
      size: [this.shadowDepthTextureSize, this.shadowDepthTextureSize, 20],
      format: 'depth32float',
      usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
    });
    this.shadowDepthTextureView = this.shadowDepthTexture.createView({
      dimension: '2d-array',
      arrayLayerCount: 20,
    });
  }


  // BUFFER SETUP


  _setupBuffers() {
    this.context.configure({
      device: this.device,
      format: this.presentationFormat,
      alphaMode: 'premultiplied',
    });

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

    // Index buffer (shared)
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


    const dummyJoints = new Uint32Array(this.meshA.vertexCount * 4).fill(0);
    this.dummyJointsBuffer = this.device.createBuffer({
      size: dummyJoints.byteLength,
      usage: GPUBufferUsage.VERTEX,
      mappedAtCreation: true,
    });
    new Uint32Array(this.dummyJointsBuffer.getMappedRange()).set(dummyJoints);
    this.dummyJointsBuffer.unmap();

    // Weights: [1,0,0,0] for each vertex (100% on first bone)
    const dummyWeights = new Float32Array(this.meshA.vertexCount * 4);
    for(let i = 0;i < this.meshA.vertexCount;i++) {
      dummyWeights[i * 4] = 1.0;  // 100% weight on bone 0
      dummyWeights[i * 4 + 1] = 0.0;
      dummyWeights[i * 4 + 2] = 0.0;
      dummyWeights[i * 4 + 3] = 0.0;
    }
    this.dummyWeightsBuffer = this.device.createBuffer({
      size: dummyWeights.byteLength,
      usage: GPUBufferUsage.VERTEX,
      mappedAtCreation: true,
    });
    new Float32Array(this.dummyWeightsBuffer.getMappedRange()).set(dummyWeights);
    this.dummyWeightsBuffer.unmap();

    this.primitive = {
      topology: 'triangle-list',
      cullMode: 'none',
      frontFace: 'ccw'
    };
  }


  // UNIFORMS SETUP


  _setupUniforms() {
    // Model matrix uniform
    this.modelUniformBuffer = this.device.createBuffer({
      size: 4 * 16,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    // Scene uniform (camera + lights)
    this.sceneUniformBuffer = this.device.createBuffer({
      label: 'sceneUniformBuffer procedural',
      size: 192,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    // Dummy bones buffer (binding 1 - required by shader even if not used)
    const dummyBonesData = new Float32Array(6400).fill(0);
    // dummyBonesData.set([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
    this.bonesBuffer = this.device.createBuffer({
      label: 'bonesBuffer dummy',
      size: dummyBonesData.byteLength,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
      mappedAtCreation: true,
    });
    new Float32Array(this.bonesBuffer.getMappedRange()).set(dummyBonesData);
    this.bonesBuffer.unmap();



    // Vertex animation params (binding 2)
    this.vertexAnimParams = new Float32Array(32).fill(0);
    this.vertexAnimBuffer = this.device.createBuffer({
      label: "Vertex Animation Params",
      size: this.vertexAnimParams.byteLength,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    this.device.queue.writeBuffer(this.vertexAnimBuffer, 0, this.vertexAnimParams);

    // Morph blend uniform (binding 3)
    this.morphBlendBuffer = this.device.createBuffer({
      label: 'morphBlendBuffer',
      size: 4,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    this.device.queue.writeBuffer(this.morphBlendBuffer, 0, new Float32Array([this.morphBlend]));


    // MAIN RENDER BIND GROUP (4 bindings - includes morphBlend)

    this.uniformBufferBindGroupLayout = this.device.createBindGroupLayout({
      label: 'uniformBufferBindGroupLayout procedural',
      entries: [
        {binding: 0, visibility: GPUShaderStage.VERTEX, buffer: {type: 'uniform'}}, // model
        {binding: 1, visibility: GPUShaderStage.VERTEX, buffer: {type: 'uniform'}}, // bones
        {binding: 2, visibility: GPUShaderStage.VERTEX, buffer: {type: 'uniform'}}, // vertexAnim
        {binding: 3, visibility: GPUShaderStage.VERTEX, buffer: {type: 'uniform'}}, // morphBlend
      ],
    });

    this.mainRenderBindGroup = this.device.createBindGroup({
      label: 'modelBindGroup procedural',
      layout: this.uniformBufferBindGroupLayout,
      entries: [
        {binding: 0, resource: {buffer: this.modelUniformBuffer}},
        {binding: 1, resource: {buffer: this.bonesBuffer}},
        {binding: 2, resource: {buffer: this.vertexAnimBuffer}},
        {binding: 3, resource: {buffer: this.morphBlendBuffer}}
      ],
    });

    this.mainPassBindGroupLayout = this.device.createBindGroupLayout({
      label: '[mainPass]BindGroupLayout pro mesh',
      entries: [
        {binding: 0, visibility: GPUShaderStage.FRAGMENT, texture: {sampleType: 'depth'}},
        {binding: 1, visibility: GPUShaderStage.FRAGMENT, sampler: {type: 'comparison'}},
      ],
    });

    // SHADOW BIND GROUP (3 bindings - NO morphBlend, for Light compatibility)

    this.shadowBindGroupLayout = this.device.createBindGroupLayout({
      label: 'shadowBindGroupLayout procedural',
      entries: [
        {binding: 0, visibility: GPUShaderStage.VERTEX, buffer: {type: 'uniform'}}, // model
        {binding: 1, visibility: GPUShaderStage.VERTEX, buffer: {type: 'uniform'}}, // bones
        {binding: 2, visibility: GPUShaderStage.VERTEX, buffer: {type: 'uniform'}}, // vertexAnim
        // NO binding 3 - morphBlend not needed for shadows
      ],
    });

    this.modelBindGroup = this.device.createBindGroup({
      label: 'shadowBindGroup procedural',
      layout: this.shadowBindGroupLayout,
      entries: [
        {binding: 0, resource: {buffer: this.modelUniformBuffer}},
        {binding: 1, resource: {buffer: this.bonesBuffer}},
        {binding: 2, resource: {buffer: this.vertexAnimBuffer}},
      ],
    });

    this._sceneData = new Float32Array(48);
  }


  // PIPELINE SETUP


  _setupPipeline() {
    // Call Materials methods to create bind group layout and bind group
    this.createLayoutForRender();
    this.createBindGroupForRender();

    this.pipeline = this.device.createRenderPipeline({
      label: 'Procedural Mesh Pipeline [OPAQUE]',
      layout: this.device.createPipelineLayout({
        bindGroupLayouts: [
          this.bglForRender,                    // From Materials
          this.uniformBufferBindGroupLayout,    // Model/morph uniforms
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


  // PUBLIC MORPH API


  setMorphBlend(t) {
    console.log('🎨 setMorphBlend called with t=', t);

    this.morphBlend = Math.max(0, Math.min(1, t));

    console.log('🎨 After clamp, morphBlend=', this.morphBlend, 'buffer?', !!this.morphBlendBuffer);

    if(this.morphBlendBuffer) {
      this.device.queue.writeBuffer(
        this.morphBlendBuffer,
        0,
        new Float32Array([this.morphBlend])
      );
      console.log('✅ GPU write complete');
    } else {
      console.error('❌ NO BUFFER!');
    }
  }

  morphTo(targetBlend, duration = 1000, onComplete = null) {
    console.log('🔥 morphTo ENTRY:', {
      targetBlend,
      duration,
      'this.morphAnimation': this.morphAnimation
    });


    const safeDuration = Math.max(duration, 100);

    console.log('🔥 BEFORE RESET:', this.morphAnimation.elapsed);

    // ✅ FORCE COMPLETE RESET
    this.morphAnimation = {
      active: true,
      startBlend: this.morphBlend,
      targetBlend: Math.max(0, Math.min(1, targetBlend)),
      duration: Math.max(duration, 100),
      elapsed: 0,
      onComplete: onComplete,
      debug: this.morphAnimation.debug
    };

    console.log('🔥 AFTER RESET:', this.morphAnimation.elapsed);

    this.morphAnimation.active = true;
    this.morphAnimation.startBlend = this.morphBlend;
    this.morphAnimation.targetBlend = Math.max(0, Math.min(1, targetBlend));
    this.morphAnimation.duration = safeDuration;
    this.morphAnimation.elapsed = 0; // ⚠️ CRITICAL: Reset elapsed time!
    this.morphAnimation.onComplete = onComplete;

    if(this.morphAnimation.debug || true) {
      console.log(`[Morph] Starting: ${this.morphBlend.toFixed(3)} → ${targetBlend.toFixed(3)} over ${safeDuration}ms`);
    }

  }

  switchMesh(specA, specB) {
    this.meshA = this._loadGeometry(specA);
    this.meshB = this._loadGeometry(specB);
    this._validateMorphCompatibility();

    this.vertexBufferA?.destroy();
    this.vertexBufferB?.destroy();
    this.normalBufferA?.destroy();
    this.normalBufferB?.destroy();
    this.uvBuffer?.destroy();
    this.indexBuffer?.destroy();

    this._setupBuffers();
    this.setMorphBlend(0.0);

    console.log(`%cMesh switched: ${this.name}`, LOG_FUNNY_SMALL);
  }

  updateMorphAnimation(deltaTime) {
    if(!this.morphAnimation.active) return;
    this.morphAnimation.elapsed += deltaTime;
    const t = Math.min(1, this.morphAnimation.elapsed / this.morphAnimation.duration);

    const eased = t < 0.5
      ? 2 * t * t
      : 1 - Math.pow(-2 * t + 2, 2) / 2;

    const blend = this.morphAnimation.startBlend +
      (this.morphAnimation.targetBlend - this.morphAnimation.startBlend) * eased;

    this.setMorphBlend(blend);

    console.log('⚡ UPDATE CALC:', {
      elapsed_after: this.morphAnimation.elapsed,
      t: t,
      will_complete: t >= 1
    });

    if(t >= 1) {
      this.morphAnimation.active = false;
      if(this.morphAnimation.onComplete) {
        this.morphAnimation.onComplete();

      }
      console.log('onComplete =', this.morphAnimation.active, 'deltaTime=', deltaTime);
    }
  }


  // TRANSFORM & UPDATE


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
    // if(!this.done) return;
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

  // RENDERING
  drawElements(pass, lightContainer) {
    pass.setBindGroup(0, this.sceneBindGroupForRender);
    pass.setBindGroup(1, this.mainRenderBindGroup);
    pass.setVertexBuffer(0, this.vertexBufferA);  // posA
    pass.setVertexBuffer(1, this.normalBufferA);  // normalA
    pass.setVertexBuffer(2, this.uvBuffer);       // uv
    pass.setVertexBuffer(3, this.vertexBufferB);  // posB
    pass.setVertexBuffer(4, this.normalBufferB);  // normalB
    pass.setIndexBuffer(this.indexBuffer, 'uint16');
    pass.drawIndexed(this.indexCount);
  }

  drawShadows(shadowPass) {
    shadowPass.setVertexBuffer(0, this.vertexBufferA);
    shadowPass.setVertexBuffer(1, this.normalBufferA);
    shadowPass.setVertexBuffer(2, this.uvBuffer);
    shadowPass.setVertexBuffer(3, this.dummyJointsBuffer);  // joints (dummy)
    shadowPass.setVertexBuffer(4, this.dummyWeightsBuffer); // weights (dummy)
    shadowPass.setIndexBuffer(this.indexBuffer, 'uint16');
    shadowPass.drawIndexed(this.indexCount);
  }

  getMainPipeline() {
    return this.pipeline;
  }

  // CLEANUP NOT WORKS PERFECT YET
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

    this.shadowDepthTexture?.destroy();

    this.pipeline = null;
    this.pipelineTransparent = null;
    this.modelBindGroup = null;
    this.sceneBindGroupForRender = null;

    console.info(`🧹 Destroyed ProceduralMesh: ${this.name}`);
  }
}




// TRUE MESH MORPHING - Automatic Vertex Correspondence


/**
 * Creates morphable geometry pairs that share identical topology.
 * This enables TRUE morphing (not deformation).
 * 
 * STRATEGY:
 * 1. Both meshes built from same parametric UV grid
 * 2. Each (u,v) coordinate maps to a vertex in both shapes
 * 3. Perfect 1:1 vertex correspondence
 */

export class MeshMorpher {

  /**
   * Create a matched pair of morphable geometries
   * Both will have identical vertex/index structure
   */
  static createMatchedPair(shapeA, shapeB, resolutionU = 32, resolutionV = 32) {
    const morphPair = {
      meshA: this._generateFromFunction(shapeA, resolutionU, resolutionV),
      meshB: this._generateFromFunction(shapeB, resolutionU, resolutionV),
      vertexCount: (resolutionU + 1) * (resolutionV + 1)
    };

    console.log(`✅ Created matched pair: ${morphPair.vertexCount} vertices each`);
    return morphPair;
  }

  /**
   * Generate mesh from parametric function: f(u, v) → [x, y, z]
   */
  static _generateFromFunction(shapeFunc, resU, resV) {
    const positions = [];
    const normals = [];
    const uvs = [];
    const indices = [];

    // Generate vertices
    for(let v = 0;v <= resV;v++) {
      for(let u = 0;u <= resU;u++) {
        const uNorm = u / resU;  // [0, 1]
        const vNorm = v / resV;  // [0, 1]

        // Get position from shape function
        const pos = shapeFunc(uNorm, vNorm);
        positions.push(pos[0], pos[1], pos[2]);

        // Calculate normal via finite differences
        const eps = 0.01;
        const posU = shapeFunc(Math.min(uNorm + eps, 1), vNorm);
        const posV = shapeFunc(uNorm, Math.min(vNorm + eps, 1));

        const tangentU = [posU[0] - pos[0], posU[1] - pos[1], posU[2] - pos[2]];
        const tangentV = [posV[0] - pos[0], posV[1] - pos[1], posV[2] - pos[2]];

        // Cross product for normal
        const normal = [
          tangentU[1] * tangentV[2] - tangentU[2] * tangentV[1],
          tangentU[2] * tangentV[0] - tangentU[0] * tangentV[2],
          tangentU[0] * tangentV[1] - tangentU[1] * tangentV[0]
        ];

        const len = Math.sqrt(normal[0] ** 2 + normal[1] ** 2 + normal[2] ** 2);
        if(len > 0) {
          normal[0] /= len;
          normal[1] /= len;
          normal[2] /= len;
        }

        normals.push(normal[0], normal[1], normal[2]);
        uvs.push(uNorm, vNorm);
      }
    }

    // Generate indices (quad grid)
    for(let v = 0;v < resV;v++) {
      for(let u = 0;u < resU;u++) {
        const i0 = v * (resU + 1) + u;
        const i1 = i0 + 1;
        const i2 = i0 + (resU + 1);
        const i3 = i2 + 1;

        // Two triangles per quad
        indices.push(i0, i2, i1);
        indices.push(i1, i2, i3);
      }
    }

    return {
      vertices: new Float32Array(positions),
      normals: new Float32Array(normals),
      uvs: new Float32Array(uvs),
      indices: new Uint16Array(indices),
      vertexCount: positions.length / 3
    };
  }

  /**
   * Sphere: Classic UV sphere
   */
  static sphere(radius = 1) {
    return (u, v) => {
      const theta = u * Math.PI * 2;  // Longitude
      const phi = v * Math.PI;         // Latitude

      return [
        radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.cos(phi),
        radius * Math.sin(phi) * Math.sin(theta)
      ];
    };
  }

  /**
   * Cube: Mapped to UV sphere topology
   */
  static cube(size = 1) {
    return (u, v) => {
      // Map UV to cube surface (normalized sphere approach)
      const theta = u * Math.PI * 2;
      const phi = v * Math.PI;

      let x = Math.sin(phi) * Math.cos(theta);
      let y = Math.cos(phi);
      let z = Math.sin(phi) * Math.sin(theta);

      // Project to cube surface (dominant axis)
      const absX = Math.abs(x);
      const absY = Math.abs(y);
      const absZ = Math.abs(z);
      const max = Math.max(absX, absY, absZ);

      return [
        (x / max) * size,
        (y / max) * size,
        (z / max) * size
      ];
    };
  }

  /**
   * Cylinder
   */
  static cylinder(radius = 1, height = 2) {
    return (u, v) => {
      const theta = u * Math.PI * 2;
      const h = (v - 0.5) * height;

      return [
        radius * Math.cos(theta),
        h,
        radius * Math.sin(theta)
      ];
    };
  }

  /**
   * Torus
   */
  static torus(majorRadius = 1, minorRadius = 0.3) {
    return (u, v) => {
      const theta = u * Math.PI * 2;
      const phi = v * Math.PI * 2;

      const r = majorRadius + minorRadius * Math.cos(phi);

      return [
        r * Math.cos(theta),
        minorRadius * Math.sin(phi),
        r * Math.sin(theta)
      ];
    };
  }

  /**
   * Cone
   */
  static cone(baseRadius = 1, height = 2) {
    return (u, v) => {
      const theta = u * Math.PI * 2;
      const h = v * height;
      const r = baseRadius * (1 - v); // Radius shrinks with height

      return [
        r * Math.cos(theta),
        h,
        r * Math.sin(theta)
      ];
    };
  }

  /**
   * Capsule (cylinder with hemisphere caps)
   */
  static capsule(radius = 0.5, height = 2) {
    return (u, v) => {
      const theta = u * Math.PI * 2;

      if(v < 0.25) {
        // Bottom hemisphere
        const phi = (v / 0.25) * Math.PI * 0.5 + Math.PI * 0.5;
        return [
          radius * Math.sin(phi) * Math.cos(theta),
          radius * Math.cos(phi) - height / 2,
          radius * Math.sin(phi) * Math.sin(theta)
        ];
      } else if(v > 0.75) {
        // Top hemisphere
        const phi = ((v - 0.75) / 0.25) * Math.PI * 0.5;
        return [
          radius * Math.sin(phi) * Math.cos(theta),
          radius * Math.cos(phi) + height / 2,
          radius * Math.sin(phi) * Math.sin(theta)
        ];
      } else {
        // Cylinder middle
        const h = ((v - 0.25) / 0.5) * height - height / 2;
        return [
          radius * Math.cos(theta),
          h,
          radius * Math.sin(theta)
        ];
      }
    };
  }

  /**
   * Plane (flat square)
   */
  static plane(size = 1) {
    return (u, v) => {
      return [
        (u - 0.5) * size,
        0,
        (v - 0.5) * size
      ];
    };
  }

  /**
   * Mobius strip
   */
  static mobius(radius = 1, width = 0.5) {
    return (u, v) => {
      const theta = u * Math.PI * 2;
      const t = (v - 0.5) * width;
      const halfTheta = theta / 2;

      return [
        (radius + t * Math.cos(halfTheta)) * Math.cos(theta),
        t * Math.sin(halfTheta),
        (radius + t * Math.cos(halfTheta)) * Math.sin(theta)
      ];
    };
  }
}