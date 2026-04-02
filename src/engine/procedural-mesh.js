import {vertexMorphWGSL} from '../shaders/vertex.procedural.wgsl';
import {degToRad, genName, LOG_FUNNY_ARCADE, LOG_FUNNY_SMALL, LOG_WARN, MeshType} from './utils';
import Materials from './materials';
import {GeometryFactory} from './geometry-factory';
import {mat4} from 'wgpu-matrix';
import {Position, Rotation} from "./matrix-class";
import {VERTEX_ANIM_FLAGS} from './literals';
import {FlameEmitter} from './effects/flame-emmiter';
import {GizmoEffect} from './effects/gizmo';
import {FlameEffect} from './effects/flame';
import {buildPipelineKey, PipelineManager} from './pipelineManager';

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
    super(device, o.material, null, o.textureCache);
    this.name = o.name || genName(3);
    this.done = false;
    this.canvas = canvas;
    this.device = device;
    this.context = context;
    this.globalAmbient = [...globalAmbient];

    if(typeof o.material.useBlend === 'undefined' ||
      typeof o.material.useBlend !== "boolean") {
      o.material.useBlend = false;
    }

    this.mType = MeshType.PROCEDURAL;
    //cache
    this._camVP = mat4.create();
    this.meshA = null;
    this.meshB = null;
    this.morphBlend = 0.0;

    this.shadowsCast = true;
    if(typeof o.sharedSU !== null) {
      this.sharedSU = o.sharedSU;
    }

    if(o.meshA && o.meshB) {
      // Use your existing mesh objects directly
      const pair = MeshMorpher.createMatchedPair(o.meshA, o.meshB, o.resolutionU || 32, o.resolutionV || 32);
      this.meshA = pair.meshA;
      this.meshB = pair.meshB;
      this.vertexCount = pair.vertexCount;
      this._validateMorphCompatibility();
    } else if(o.geometryA) {
      // OLD: Generate from GeometryFactory (may not match!)
      console.warn(`%cPlease use meshA, meshB not geometryA.`, LOG_WARN);
      this.meshA = this._loadGeometry(o.geometryA);
      this.meshB = o.geometryB
        ? this._loadGeometry(o.geometryB)
        : this._loadGeometry(o.geometryA);
      this._validateMorphCompatibility();
    }

    this.morphBlend = o.morphBlend ?? 0.0;
    this.morphAnimation = {
      active: false,
      startBlend: this.morphBlend,
      targetBlend: 1.0,
      duration: 1000,
      elapsed: 0,
      onComplete: null
    };

    this.pointerEffect = o.pointerEffect;
    this._modelMatrix = mat4.create();
    this._posArray = new Float32Array(3);
    this._scaleArray = new Float32Array(3);
    this._rotAxisVec = new Float32Array(3);
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
    this.deltaTimeAdapter = 1;
    this.presentationFormat = navigator.gpu.getPreferredCanvasFormat();
    this.raycast = o.raycast || {enabled: false, radius: 2};
    this.pointerEffect = o.pointerEffect || {enabled: false};

    if(typeof o.vertexWGSL !== 'undefined') {
      this.vertexWGSL = o.vertexWGSL;
    }

    if(typeof o.fragmentWGSL !== 'undefined') {
      this.fragmentWGSL = o.fragmentWGSL;
    }

    this.runProgram = () => {
      return new Promise(async (resolve) => {
        this.shadowDepthTextureSize = 512;
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
      // console.log(`%cProceduralMesh ready: ${this.name}`, LOG_FUNNY_SMALL);
    });
  }

  // GEOMETRY LOADING old
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
    for(let i = 0;i < indices.length;i += 3) {
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
      if(len > 0) {
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

  _setupBuffers() {
    this.context.configure({device: this.device, format: this.presentationFormat, alphaMode: 'premultiplied'});
    const createBuffer = (data, usage = GPUBufferUsage.VERTEX) => {
      const buf = this.device.createBuffer({size: data.byteLength, usage, mappedAtCreation: true});
      new (data.constructor)(buf.getMappedRange()).set(data);
      buf.unmap();
      return buf;
    };

    this.vertexBufferA = createBuffer(this.meshA.vertices);
    this.vertexBufferB = createBuffer(this.meshB.vertices);
    this.normalBufferA = createBuffer(this.meshA.normals);
    this.normalBufferB = createBuffer(this.meshB.normals);
    this.uvBuffer = createBuffer(this.meshA.uvs);

    this.indexCount = this.meshA.indices.length;
    this.indexBuffer = createBuffer(this.meshA.indices, GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST);

    // Dummy joints & weights for shader
    const dummyJoints = new Uint32Array(this.vertexCount * 4).fill(0);
    this.dummyJointsBuffer = createBuffer(dummyJoints);
    const dummyWeights = new Float32Array(this.vertexCount * 4);
    for(let i = 0;i < this.vertexCount;i++) dummyWeights.set([1, 0, 0, 0], i * 4);
    this.dummyWeightsBuffer = createBuffer(dummyWeights);

    this.vertexBuffers = [
      {arrayStride: 3 * 4, attributes: [{shaderLocation: 0, offset: 0, format: 'float32x3'}]}, // posA
      {arrayStride: 3 * 4, attributes: [{shaderLocation: 1, offset: 0, format: 'float32x3'}]}, // normalA
      {arrayStride: 2 * 4, attributes: [{shaderLocation: 2, offset: 0, format: 'float32x2'}]}, // uv
      {arrayStride: 3 * 4, attributes: [{shaderLocation: 6, offset: 0, format: 'float32x3'}]}, // posB
      {arrayStride: 3 * 4, attributes: [{shaderLocation: 7, offset: 0, format: 'float32x3'}]}, // normalB
    ];

    this.primitive = {topology: 'triangle-list', cullMode: 'none', frontFace: 'ccw'}; //ccw
  }

  _setupUniforms() {
    // console.log('EEEEEEEEEEEEEEEEEEEEEEEEEEEE', this.pointerEffect)
    this.effects = {};
    if(this.pointerEffect && this.pointerEffect.enabled === true) {
      let pf = navigator.gpu.getPreferredCanvasFormat();
      if(typeof this.pointerEffect.flameEmitter !== 'undefined' && this.pointerEffect.flameEmitter == true) {
        this.effects.flameEmitter = new FlameEmitter(this.device, 'rgba16float');
      }
      if(typeof this.pointerEffect.gizmoEffect !== 'undefined' && this.pointerEffect.gizmoEffect == true) {
        this.effects.gizmoEffect = new GizmoEffect(this.device, 'rgba16float');
      }
      if(typeof this.pointerEffect.flameEffect !== 'undefined' && this.pointerEffect.flameEffect == true) {
        this.effects.flameEffect = new FlameEffect(this.device, pf, "rgba16float", 'torch');
      }
    }
    this.modelUniformBuffer = this.device.createBuffer({size: 16 * 4, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST});
    if(this.sharedSU) {
      this.sceneUniformBuffer = this.sharedSU;
    } else {
      this.sceneUniformBuffer = this.device.createBuffer({
        label: 'sceneUniformBuffer per mesh',
        size: 192,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
      });
    }

    this.bonesBuffer = this.device.createBuffer({size: 6400 * 4, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST});
    this.morphBlendBuffer = this.device.createBuffer({size: 4, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST});
    this.device.queue.writeBuffer(this.morphBlendBuffer, 0, new Float32Array([this.morphBlend]));

    // vertex Anim
    this.vertexAnimParams = new Float32Array([
      0.0, 0.0, 0.0, 0.0, 2.0, 0.1, 2.0, 0.0, 1.5, 0.3, 2.0, 0.5, 1.0, 0.1, 0.0, 0.0, 1.0, 0.5, 0.0, 0.0, 1.0, 0.05, 0.5, 0.0, 1.0, 0.05, 2.0, 0.0, 1.0, 0.1, 0.0, 0.0,
    ]);

    this.vertexAnimBuffer = this.device.createBuffer({
      label: "Vertex Animation Params",
      size: this.vertexAnimParams.byteLength,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    // Bind group layout for model + morph
    this.uniformBufferBindGroupLayout = this.device.createBindGroupLayout({
      entries: [
        {binding: 0, visibility: GPUShaderStage.VERTEX, buffer: {type: 'uniform'}}, // model
        {binding: 1, visibility: GPUShaderStage.VERTEX, buffer: {type: 'uniform'}}, // bones
        {binding: 2, visibility: GPUShaderStage.VERTEX, buffer: {type: 'uniform'}}, // vertexAnim
        {binding: 3, visibility: GPUShaderStage.VERTEX, buffer: {type: 'uniform'}}, // morphBlend
      ]
    });

    this.mainRenderBindGroup = this.device.createBindGroup({
      layout: this.uniformBufferBindGroupLayout,
      entries: [
        {binding: 0, resource: {buffer: this.modelUniformBuffer}},
        {binding: 1, resource: {buffer: this.bonesBuffer}},
        {binding: 2, resource: {buffer: this.vertexAnimBuffer}},
        {binding: 3, resource: {buffer: this.morphBlendBuffer}},
      ]
    });

    // Shadow bind group now includes morphBlend for correct lighting
    this.shadowBindGroupLayout = this.device.createBindGroupLayout({
      entries: [
        {binding: 0, visibility: GPUShaderStage.VERTEX, buffer: {type: 'uniform'}}, // model
        {binding: 1, visibility: GPUShaderStage.VERTEX, buffer: {type: 'uniform'}}, // bones
        {binding: 2, visibility: GPUShaderStage.VERTEX, buffer: {type: 'uniform'}}, // vertexAnim
        {binding: 3, visibility: GPUShaderStage.VERTEX, buffer: {type: 'uniform'}}, // morphBlend
      ]
    });

    this.modelBindGroup = this.device.createBindGroup({
      layout: this.shadowBindGroupLayout,
      entries: [
        {binding: 0, resource: {buffer: this.modelUniformBuffer}},
        {binding: 1, resource: {buffer: this.bonesBuffer}},
        {binding: 2, resource: {buffer: this.vertexAnimBuffer}},
        {binding: 3, resource: {buffer: this.morphBlendBuffer}},
      ]
    });

    this.vertexAnim = {
      active: false,
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

  }

  _setupPipeline() {
    this.createLayoutForRender();
    this.createBindGroupForRender();
    const pm = PipelineManager.get();
    const vertexCode = this.vertexWGSL ? this.vertexWGSL : vertexMorphWGSL;
    const fragmentCode = this.fragmentWGSL ? this.fragmentWGSL : this.getMaterial();
    const vertexId = this.vertexWGSL ? 'custom_proc' : 'proc_morph';
    const fragmentId = this.fragmentWGSL ? 'custom_frag' : this.material.type;
    const layout = this.device.createPipelineLayout({
      bindGroupLayouts: [
        this.bglForRender,
        this.uniformBufferBindGroupLayout,
      ],
    });
    const vertexState = {
      entryPoint: 'main',
      module: this.device.createShaderModule({code: vertexCode}),
      buffers: this.vertexBuffers,
    };
    const fragmentConstants = {shadowDepthTextureSize: this.shadowDepthTextureSize};
    const baseKey = {
      vertexId,
      fragmentId,
      type: "procedural",
      topology: this.primitive.topology,
      cullMode: this.primitive.cullMode,
      frontFace: this.primitive.frontFace,
      format: 'rgba16float',
      morph: !this.vertexWGSL ? 1 : 0,
    };
    // OPAQUE
    this.pipeline = pm.getPipeline({
      key: buildPipelineKey({
        ...baseKey,
        transparent: false,
        depthWrite: true,
      }),
      pipeline: {
        label: 'Procedural Opaque Cached',
        layout,
        vertex: vertexState,
        fragment: {
          entryPoint: 'main',
          module: this.device.createShaderModule({code: fragmentCode}),
          targets: [{format: 'rgba16float'}],
          constants: fragmentConstants,
        },
        depthStencil: {
          depthWriteEnabled: true,
          depthCompare: 'less',
          format: 'depth24plus',
        },
        primitive: this.primitive,
      }
    });
    // TRANSPARENT
    this.pipelineTransparent = pm.getPipeline({
      key: buildPipelineKey({
        ...baseKey,
        transparent: true,
        depthWrite: false,
      }),
      pipeline: {
        label: 'Procedural Transparent Cached',
        layout,
        vertex: vertexState,
        fragment: {
          entryPoint: 'main',
          module: this.device.createShaderModule({code: fragmentCode}),
          targets: [{
            format: 'rgba16float',
            blend: {
              color: {
                srcFactor: 'src-alpha',
                dstFactor: 'one-minus-src-alpha',
                operation: 'add'
              },
              alpha: {
                srcFactor: 'one',
                dstFactor: 'one-minus-src-alpha',
                operation: 'add'
              },
            },
          }],
          constants: fragmentConstants,
        },
        depthStencil: {
          depthWriteEnabled: false,
          depthCompare: 'less',
          format: 'depth24plus',
        },
        primitive: this.primitive,
      }
    });
  }

  setMorphBlend(t) {
    this.morphBlend = Math.max(0, Math.min(1, t));
    if(this.morphBlendBuffer) {
      this.device.queue.writeBuffer(this.morphBlendBuffer, 0, new Float32Array([this.morphBlend]));
    } else {
      console.error('❌ NO BUFFER in setMorphBlend.');
    }
  }

  morphTo(targetBlend, duration = 1000, onComplete) {
    const safeDuration = Math.max(duration, 100);
    this.morphAnimation.active = true;
    this.morphAnimation.startBlend = this.morphBlend;
    this.morphAnimation.targetBlend = Math.max(0, Math.min(1, targetBlend))
    this.morphAnimation.duration = Math.max(duration, 100)
    this.morphAnimation.elapsed = 0;
    if(onComplete) this.morphAnimation.onComplete = onComplete;
    this.morphAnimation.active = true;
    this.morphAnimation.startBlend = this.morphBlend;
    this.morphAnimation.targetBlend = Math.max(0, Math.min(1, targetBlend));
    this.morphAnimation.duration = safeDuration;
    this.morphAnimation.elapsed = 0;
    if(this.morphAnimation.debug) {
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
    // console.log(`%cMesh switched: ${this.name}`, LOG_FUNNY_SMALL);
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
    if(t >= 1) {
      this.morphAnimation.active = false;
      if(this.morphAnimation.onComplete) {
        this.morphAnimation.onComplete(blend);
      }
    }
  }

  getModelMatrix(pos, useScale = false) {
    let modelMatrix = mat4.identity(this._modelMatrix);
    this._posArray[0] = pos.x; this._posArray[1] = pos.y; this._posArray[2] = pos.z;
    mat4.translate(modelMatrix, this._posArray, modelMatrix);
    if(this.itIsPhysicsBody) {
      this._rotAxisVec[0] = this.rotation.axis.x;
      this._rotAxisVec[1] = this.rotation.axis.y;
      this._rotAxisVec[2] = this.rotation.axis.z;
      mat4.rotate(modelMatrix, this._rotAxisVec, degToRad(this.rotation.angle), modelMatrix);
    } else {
      mat4.rotateX(modelMatrix, this.rotation.getRotX(), modelMatrix);
      mat4.rotateY(modelMatrix, this.rotation.getRotY(), modelMatrix);
      mat4.rotateZ(modelMatrix, this.rotation.getRotZ(), modelMatrix);
    }
    if(useScale == true) mat4.scale(modelMatrix, [this.scale[0], this.scale[1], this.scale[2]], modelMatrix)
    this.modelMatrix = modelMatrix;
    return modelMatrix;
  }

  updateModelUniformBuffer() {
    const modelMatrix = this.getModelMatrix(this.position, this.useScale);
    this.device.queue.writeBuffer(
      this.modelUniformBuffer,
      0,
      modelMatrix.buffer,
      modelMatrix.byteOffset,
      modelMatrix.byteLength
    );
    // this.modelMatrix = modelMatrix;
  }

  updateTime(time) {
    this.time += time * this.deltaTimeAdapter;
    this.vertexAnimParams[0] = this.time;
    this.device.queue.writeBuffer(this.vertexAnimBuffer, 0, this.vertexAnimParams);
  }

  drawElements(pass, lightContainer) {
    pass.setBindGroup(0, this.sceneBindGroupForRender);
    pass.setBindGroup(1, this.mainRenderBindGroup);

    if(this.material.type === "mirror" && this.mirrorBindGroup) {
      pass.setBindGroup(2, this.mirrorBindGroup);
    }
    pass.setVertexBuffer(0, this.vertexBufferA);
    pass.setVertexBuffer(1, this.normalBufferA);
    pass.setVertexBuffer(2, this.uvBuffer);
    pass.setVertexBuffer(3, this.vertexBufferB);
    pass.setVertexBuffer(4, this.normalBufferB);
    pass.setIndexBuffer(this.indexBuffer, 'uint16');
    pass.drawIndexed(this.indexCount);
  }

  drawShadows(shadowPass) {
    shadowPass.setVertexBuffer(0, this.vertexBufferA);
    shadowPass.setVertexBuffer(1, this.normalBufferA);
    shadowPass.setVertexBuffer(2, this.uvBuffer);
    shadowPass.setVertexBuffer(3, this.vertexBufferB);
    shadowPass.setVertexBuffer(4, this.normalBufferB);
    shadowPass.setIndexBuffer(this.indexBuffer, 'uint16');
    shadowPass.drawIndexed(this.indexCount);
  }

  getMainPipeline() {return this.pipeline}

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

export class MeshMorpher {
  static createMatchedPair(shapeA, shapeB, resolutionU = 32, resolutionV = 32) {
    const shapeAObj = (typeof shapeA === "function") ? {func: shapeA} : shapeA;
    const shapeBObj = (typeof shapeB === "function") ? {func: shapeB} : shapeB;
    const meshA = this._generateFromFunction(shapeAObj.func, resolutionU, resolutionV);
    const meshB = this._generateFromFunction(shapeBObj.func, resolutionU, resolutionV);
    if(!shapeAObj.flat)
      meshA.normals = this.computeSmoothNormals(meshA.vertices, meshA.indices);
    if(!shapeBObj.flat)
      meshB.normals = this.computeSmoothNormals(meshB.vertices, meshB.indices);
    return {
      meshA,
      meshB,
      vertexCount: (resolutionU + 1) * (resolutionV + 1)
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // MULTI-PART GEOMETRY
  // Combines N shape functions into a single UV-partitioned mesh.
  // Each part gets an equal slice of V-space. Bridge rows between parts
  // are collapsed to a hidden point so no connecting triangles are visible.
  //
  // Usage:
  //   MeshMorpher.compose(
  //     { shape: MeshMorpher.cube(1),   offset: [-2, 0, 0] },
  //     { shape: MeshMorpher.cube(1),   offset: [ 2, 0, 0] },
  //   )
  //
  //   // With rotation too:
  //   MeshMorpher.compose(
  //     { shape: MeshMorpher.sphere(1), offset: [0, 0, 0], rotation: [0, 0, 0] },
  //     { shape: MeshMorpher.torus(),   offset: [3, 0, 0], rotation: [Math.PI/2, 0, 0] },
  //   )
  //
  // Returns a shape descriptor { func, flat } — works everywhere createMatchedPair does.
  // ─────────────────────────────────────────────────────────────────────────────
  static compose(...parts) {
    const n = parts.length;

    const normalised = parts.map(p => {
      const raw = p.shape ?? p.func ?? p;
      const func = (typeof raw === "function") ? raw : raw.func;
      const flat = p.flat ?? (typeof raw === "object" ? raw.flat : false) ?? false;
      const offset = p.offset ?? [0, 0, 0];
      const rotation = p.rotation ?? [0, 0, 0];
      const scale = p.scale ?? [1, 1, 1];
      return {func, flat, offset, rotation, scale};
    });

    const applyTransform = (pos, part) => {
      let [x, y, z] = pos;

      x *= part.scale[0];
      y *= part.scale[1];
      z *= part.scale[2];

      const [rx, ry, rz] = part.rotation;
      if(rx !== 0) {
        const cy = Math.cos(rx), sy = Math.sin(rx);
        const ny = cy * y - sy * z, nz = sy * y + cy * z;
        y = ny; z = nz;
      }
      if(ry !== 0) {
        const cx = Math.cos(ry), sx = Math.sin(ry);
        const nx = cx * x + sx * z, nz = -sx * x + cx * z;
        x = nx; z = nz;
      }
      if(rz !== 0) {
        const cz = Math.cos(rz), sz = Math.sin(rz);
        const nx = cz * x - sz * y, ny = sz * x + cz * y;
        x = nx; y = ny;
      }

      x += part.offset[0];
      y += part.offset[1];
      z += part.offset[2];

      return [x, y, z];
    };

    const composed = (u, vGlobal) => {
      const sliceSize = 1 / n;
      const partIndex = Math.min(Math.floor(vGlobal / sliceSize), n - 1);
      const part = normalised[partIndex];
      const vLocal = (vGlobal - partIndex * sliceSize) / sliceSize;

      const DEAD = 0.1; // wide enough to cover 2-3 vertex rows at resV=32

      if(vLocal < DEAD) {
        // Entire dead band collapses to a single point: part's v=0 center
        return applyTransform(part.func(0, 0), part); // same u=0 → same point for ALL u
      }
      if(vLocal > 1 - DEAD) {
        return applyTransform(part.func(0, 0), part); // same trick at the top
      }

      const vMapped = (vLocal - DEAD) / (1 - DEAD * 2);
      return applyTransform(part.func(u, vMapped), part);
    };

    const allFlat = normalised.every(p => p.flat);
    return allFlat ? {func: composed, flat: true} : composed;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // All original methods below — completely unchanged
  // ─────────────────────────────────────────────────────────────────────────────

  static computeSmoothNormals(positions, indices) {
    const normals = new Float32Array(positions.length);
    const counts = new Uint16Array(positions.length / 3);

    for(let i = 0;i < indices.length;i += 3) {
      const ia = indices[i], ib = indices[i + 1], ic = indices[i + 2];

      const ax = positions[ia * 3], ay = positions[ia * 3 + 1], az = positions[ia * 3 + 2];
      const bx = positions[ib * 3], by = positions[ib * 3 + 1], bz = positions[ib * 3 + 2];
      const cx = positions[ic * 3], cy = positions[ic * 3 + 1], cz = positions[ic * 3 + 2];

      const ux = bx - ax, uy = by - ay, uz = bz - az;
      const vx = cx - ax, vy = cy - ay, vz = cz - az;

      let nx = uy * vz - uz * vy;
      let ny = uz * vx - ux * vz;
      let nz = ux * vy - uy * vx;

      const len = Math.hypot(nx, ny, nz) || 1;
      nx /= len; ny /= len; nz /= len;

      for(const idx of [ia, ib, ic]) {
        normals[idx * 3] += nx;
        normals[idx * 3 + 1] += ny;
        normals[idx * 3 + 2] += nz;
        counts[idx]++;
      }
    }

    for(let i = 0;i < counts.length;i++) {
      const len = Math.hypot(normals[i * 3], normals[i * 3 + 1], normals[i * 3 + 2]) || 1;
      normals[i * 3] /= len;
      normals[i * 3 + 1] /= len;
      normals[i * 3 + 2] /= len;
    }

    return normals;
  }

  static _generateFromFunction(shapeFunc, resU, resV) {
    const positions = [];
    const normals = [];
    const uvs = [];
    const indices = [];

    for(let v = 0;v <= resV;v++) {
      for(let u = 0;u <= resU;u++) {
        const uNorm = u / resU;
        const vNorm = v / resV;

        const pos = shapeFunc(uNorm, vNorm);
        positions.push(pos[0], pos[1], pos[2]);

        const eps = 0.01;
        const posU = shapeFunc(Math.min(uNorm + eps, 1), vNorm);
        const posV = shapeFunc(uNorm, Math.min(vNorm + eps, 1));

        const tangentU = [posU[0] - pos[0], posU[1] - pos[1], posU[2] - pos[2]];
        const tangentV = [posV[0] - pos[0], posV[1] - pos[1], posV[2] - pos[2]];

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

        if(Math.abs(pos[1]) < 0.01 &&
          Math.abs(posU[1]) < 0.01 &&
          Math.abs(posV[1]) < 0.01) {
          normal[0] = 0;
          normal[1] = 1;
          normal[2] = 0;
        }

        normals.push(normal[0], normal[1], normal[2]);
        uvs.push(uNorm, vNorm);
      }
    }

    for(let v = 0;v < resV;v++) {
      for(let u = 0;u < resU;u++) {
        const i0 = v * (resU + 1) + u;
        const i1 = i0 + 1;
        const i2 = i0 + (resU + 1);
        const i3 = i2 + 1;

        indices.push(i0, i2, i1);
        indices.push(i1, i2, i3);
      }
    }

    return {
      vertices: new Float32Array(positions),
      normals: new Float32Array(normals),
      uvs: new Float32Array(uvs),
      indices: new Uint16Array(indices),
      vertexCount: positions.length / 3,
      flat: this.flat === true
    };
  }

  static sphere(radius = 1) {
    return (u, v) => {
      const theta = -u * Math.PI * 2;
      const phi = -v * Math.PI;
      return [
        radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.cos(phi),
        radius * Math.sin(phi) * Math.sin(theta)
      ];
    };
  }

  static cube(size = 1) {
    const s = size * 0.5;
    return (u, v) => {
      let x, y, z;
      const unitU = (u * 4) % 1;
      const side = Math.floor(u * 4) % 4;

      let sx, sz;
      if(side === 0) {sx = s; sz = (unitU - 0.5) * size;}
      else if(side === 1) {sx = (0.5 - unitU) * size; sz = s;}
      else if(side === 2) {sx = -s; sz = (0.5 - unitU) * size;}
      else {sx = (unitU - 0.5) * size; sz = -s;}

      if(v < 0.2) {
        const lerp = v / 0.2;
        x = sx * lerp; y = -s; z = sz * lerp;
      } else if(v > 0.8) {
        const lerp = (1.0 - v) / 0.2;
        x = sx * lerp; y = s; z = sz * lerp;
      } else {
        const lerpY = (v - 0.2) / 0.6;
        x = sx; y = (lerpY - 0.5) * size; z = sz;
      }

      return [x, y, z];
    };
  }

  static cylinder(radius = 1, height = 2) {
    return (u, v) => {
      const theta = u * Math.PI * 2;
      const h = (v - 0.5) * height;
      return [radius * Math.cos(theta), h, radius * Math.sin(theta)];
    };
  }

  static torus(majorRadius = 1, minorRadius = 0.3) {
    return (u, v) => {
      const theta = u * Math.PI * 2;
      const phi = v * Math.PI * 2;
      const r = majorRadius + minorRadius * Math.cos(phi);
      return [r * Math.cos(theta), minorRadius * Math.sin(phi), r * Math.sin(theta)];
    };
  }

  static cone(baseRadius = 1, height = 1, fromZeroY = true) {
    if(fromZeroY == true) return (u, v) => {
      const theta = u * Math.PI * 2;
      const h = v * height;
      const r = baseRadius * (1 - v);
      return [r * Math.cos(theta), h, r * Math.sin(theta)];
    };

    return (u, v) => {
      const theta = u * Math.PI * 2;
      const h = v * height - height / 2;  // <-- centre at y=0
      const r = baseRadius * (1 - v);
      return [r * Math.cos(theta), h, r * Math.sin(theta)];
    };
  }

  static coneX(baseRadius = 1, height = 1, fromZeroX = true) {
    if(fromZeroX == true) return (u, v) => {
      const theta = u * Math.PI * 2;
      const h = v * height;
      const r = baseRadius * (1 - v);
      return [h, r * Math.cos(theta), r * Math.sin(theta)];
    };

    return (u, v) => {
      const theta = u * Math.PI * 2;
      const h = v * height - height / 2;
      const r = baseRadius * (1 - v);
      return [h, r * Math.cos(theta), r * Math.sin(theta)];
    };
  }

  static capsule(radius = 0.5, height = 1) {
    const halfH = height / 2;
    return (u, v) => {
      if(v < 0.25) {
        const theta = -u * Math.PI * 2;
        const phi = (v / 0.25) * (Math.PI / 2) + (Math.PI / 2);
        return [
          radius * Math.sin(phi) * Math.cos(theta),
          radius * Math.cos(phi) - halfH,
          radius * Math.sin(phi) * Math.sin(theta)
        ];
      } else if(v > 0.75) {
        const theta = -u * Math.PI * 2;
        const phi = ((v - 0.75) / 0.25) * (Math.PI / 2);
        return [
          radius * Math.sin(phi) * Math.cos(theta),
          radius * Math.cos(phi) + halfH,
          radius * Math.sin(phi) * Math.sin(theta)
        ];
      } else {
        const theta = u * Math.PI * 2;
        const y = ((v - 0.25) / 0.5) * height - halfH;
        return [radius * Math.cos(theta), y, radius * Math.sin(theta)];
      }
    };
  }

  static plane(size = 1) {
    return (u, v) => [(u - 0.5) * size, 0, (v - 0.5) * size];
  }

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

  static pyramid(size = 1) {
    return (u, v) => {
      const angle = u * Math.PI * 2;
      const r = (1 - v) * size;
      return [r * Math.cos(angle), v * size, r * Math.sin(angle)];
    };
  }

  static supershape(size = 1) {
    return (u, v) => {
      const theta = -u * Math.PI * 2;
      const phi = v * Math.PI;
      const r = size * (0.5 + 0.5 * Math.sin(5 * theta) * Math.sin(3 * phi));
      return [
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.cos(phi),
        r * Math.sin(phi) * Math.sin(theta)
      ];
    };
  }

  static star(radius = 1, innerRadius = 0.4, depth = 0.3) {
    return (u, v) => {
      const theta = -u * Math.PI * 2;
      const r = radius * (0.7 + 0.3 * Math.cos(5 * theta));
      let x, y, z;
      if(v < 0.5) {
        const lerp = v / 0.5;
        x = r * Math.cos(theta) * lerp;
        z = r * Math.sin(theta) * lerp;
        y = depth * (1 - lerp);
      } else {
        const lerp = (1.0 - v) / 0.5;
        x = r * Math.cos(theta) * lerp;
        z = r * Math.sin(theta) * lerp;
        y = -depth * (1 - lerp);
      }
      return [x, y, z];
    };
  }

  static wavePlane(size = 2) {
    return (u, v) => {
      const x = (u - 0.5) * size;
      const z = (v - 0.5) * size;
      const y = Math.sin(x * 3) * Math.cos(z * 3) * 0.3;
      return [x, y, z];
    };
  }

  static circlePlane(radius = 1) {
    return (u, v) => {
      const angle = -u * Math.PI * 2;
      const r = -v * radius;
      return [r * Math.cos(angle), 0, r * Math.sin(angle)];
    };
  }

  static icosahedron(radius = 1) {
    return (u, v) => {
      const theta = -u * Math.PI * 2;
      const phi = -v * Math.PI;
      let x = Math.sin(phi) * Math.cos(theta);
      let y = Math.cos(phi);
      let z = Math.sin(phi) * Math.sin(theta);
      const f = Math.abs(x) + Math.abs(y) + Math.abs(z);
      x /= f; y /= f; z /= f;
      return [x * radius, y * radius, z * radius];
    };
  }

  static diamond(size = 1) {
    return (u, v) => {
      const theta = u * Math.PI * 2;
      const y = (v - 0.5) * 2 * size;
      const r = size * (1 - Math.abs(v - 0.5) * 2);
      return [r * Math.cos(theta), y, r * Math.sin(theta)];
    };
  }

  static rock(radius = 1) {
    return (u, v) => {
      const theta = -u * Math.PI * 2;
      const phi = -v * Math.PI;
      let x = Math.sin(phi) * Math.cos(theta);
      let y = Math.cos(phi);
      let z = Math.sin(phi) * Math.sin(theta);
      const noise = 0.2 * Math.sin(theta * 7) * Math.cos(phi * 5);
      const r = radius + noise;
      return [x * r, y * r, z * r];
    };
  }

  static star3d(radius = 1) {
    return (u, v) => {
      const theta = -u * Math.PI * 2;
      const phi = v * Math.PI;
      const spike = 1 + 0.3 * Math.sin(theta * 5);
      const r = radius * spike;
      return [
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.cos(phi),
        r * Math.sin(phi) * Math.sin(theta)
      ];
    };
  }

  static galaxySpiral(scale = 10, arms = 3, twist = 2) {
    return (u, v) => {
      const theta = -u * Math.PI * 2;
      const radius = v;
      const armOffset = (theta * arms) % (Math.PI * 2);
      const r = radius * (1 + 0.2 * Math.sin(armOffset * twist));
      const x = r * Math.cos(theta);
      const y = 0.1 * radius * Math.sin(5 * theta);
      const z = r * Math.sin(theta);
      return [x * scale, y * scale, z * scale];
    };
  }

  static littleStar(radius = 1, innerRadius = 0.4, depth = 0.2) {
    return (u, v) => {
      const theta = -u * Math.PI * 2;
      const sector = (u * 10) % 2;
      const lerp = sector > 1 ? 2 - sector : sector;
      const r = innerRadius + (radius - innerRadius) * lerp;
      const posX = r * Math.cos(theta);
      const posZ = r * Math.sin(theta);
      let x, y, z;
      if(v < 0.5) {
        const f = v / 0.5;
        x = posX * f; z = posZ * f; y = depth * (1 - f);
      } else {
        const f = (1.0 - v) / 0.5;
        x = posX * f; z = posZ * f; y = -depth * (1 - f);
      }
      return [x, y, z];
    };
  }

  static flatStar(radius = 1, innerRadius = 0.2, thickness = 0.1) {
    const func = (u, v) => {
      const spikes = 5;
      const theta = -u * Math.PI * 2;
      const star = Math.cos(spikes * theta);
      const r = innerRadius + (radius - innerRadius) * (star * 0.5 + 0.5);
      const finalR = r * v;
      return [finalR * Math.cos(theta), 0, finalR * Math.sin(theta)];
    };
    return {func, flat: true};
  }

  static klein(radius = 1) {
    return (u, v) => {
      const theta = -u * Math.PI * 2;
      const phi = v * Math.PI * 2;
      let x, y, z;
      if(theta < Math.PI) {
        x = 3 * Math.cos(theta) * (1 + Math.sin(theta)) +
          (2 * (1 - Math.cos(theta) / 2)) * Math.cos(theta) * Math.cos(phi);
        z = -8 * Math.sin(theta) -
          (2 * (1 - Math.cos(theta) / 2)) * Math.sin(theta) * Math.cos(phi);
      } else {
        x = 3 * Math.cos(theta) * (1 + Math.sin(theta)) +
          (2 * (1 - Math.cos(theta) / 2)) * Math.cos(phi + Math.PI);
        z = -8 * Math.sin(theta);
      }
      y = (2 * (1 - Math.cos(theta) / 2)) * Math.sin(phi);
      return [x * 0.1 * radius, y * 0.1 * radius, z * 0.1 * radius];
    };
  }

  static shell(scale = 1) {
    scale = scale / 4;
    return (u, v) => {
      const theta = -u * Math.PI * 4;
      const phi = -v * Math.PI * 2;
      const r = 0.4 + Math.exp(-theta * 0.12);
      const x = r * Math.cos(theta) * (1 + 0.3 * Math.cos(phi));
      const y = r * Math.sin(theta) * (1 + 0.3 * Math.cos(phi));
      const z = 0.3 * r * Math.sin(phi);
      return [x * scale, z * scale, y * scale];
    };
  }

  static rippleSphere(radius = 1) {
    return (u, v) => {
      const theta = -u * Math.PI * 2;
      const phi = -v * Math.PI;
      const ripple = 1 + 0.2 * Math.sin(10 * theta) * Math.sin(6 * phi);
      const r = radius * ripple;
      return [
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.cos(phi),
        r * Math.sin(phi) * Math.sin(theta)
      ];
    };
  }

  static twistedTorus(R = 1, r = 0.3, twists = 3) {
    return (u, v) => {
      const theta = u * Math.PI * 2;
      const phi = v * Math.PI * 2;
      const twist = phi + theta * twists;
      return [
        (R + r * Math.cos(twist)) * Math.cos(theta),
        r * Math.sin(twist),
        (R + r * Math.cos(twist)) * Math.sin(theta)
      ];
    };
  }

  static tornado(height = 2, radius = 1) {
    return (u, v) => {
      const theta = -u * Math.PI * 4;
      const y = (v - 0.5) * height;
      const r = Math.pow(v, 1.5) * radius;
      return [r * Math.cos(theta), y, r * Math.sin(theta)];
    };
  }

  static brain(radius = 1) {
    return (u, v) => {
      const theta = -u * Math.PI * 2;
      const phi = -v * Math.PI;
      let x = Math.sin(phi) * Math.cos(theta);
      let y = Math.cos(phi);
      let z = Math.sin(phi) * Math.sin(theta);
      const wrinkle = 0.25 * Math.sin(theta * 6) * Math.sin(phi * 4);
      const r = radius + wrinkle;
      return [x * r, y * r, z * r];
    };
  }

  static galaxyComposite(numStars = 500, arms = 4, twist = 2, scale = 20) {
    return (u, v) => {
      const theta = -u * Math.PI * 2;
      const radial = v;
      const arm = Math.floor(radial * arms);
      const armOffset = (arm / arms) * Math.PI * 2;
      const r = radial * (1 + 0.2 * Math.sin(theta * 5 + armOffset));
      const y = 0.1 * radial * Math.sin(theta * 8);
      const clusterOffsetX = 0.05 * Math.sin(armOffset + v * 12);
      const clusterOffsetZ = 0.05 * Math.cos(armOffset + u * 12);
      const x = (r * Math.cos(theta) + clusterOffsetX) * scale;
      const z = (r * Math.sin(theta) + clusterOffsetZ) * scale;
      return [x, y * scale, z];
    };
  }
}