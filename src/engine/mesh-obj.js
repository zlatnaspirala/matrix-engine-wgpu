import {mat4, vec3} from 'wgpu-matrix';
import {Position, Rotation} from "./matrix-class";
import {vertexWGSL} from '../shaders/vertex.wgsl';
import {degToRad, genName, LOG_FUNNY_ARCADE, LOG_FUNNY_SMALL} from './utils';
import Materials from './materials';
import {fragmentVideoWGSL} from '../shaders/fragment.video.wgsl';
import {vertexWGSL_NM} from '../shaders/vertex.wgsl.normalmap';
// import {PointerEffect} from './effects/pointerEffect';
import {PointEffect} from './effects/topology-point';
import {GizmoEffect} from './effects/gizmo';
import {DestructionEffect} from './effects/destruction';
import {FlameEffect} from './effects/flame';
import {FlameEmitter} from './effects/flame-emmiter';

export default class MEMeshObj extends Materials {
  constructor(canvas, device, context, o, inputHandler, globalAmbient, _glbFile = null, primitiveIndex = null, skinnedNodeIndex = null) {
    super(device, o.material, _glbFile, o.textureCache);
    if(typeof o.name === 'undefined') o.name = genName(3);
    if(typeof o.raycast === 'undefined') {
      this.raycast = {enabled: false, radius: 2};
    } else {
      this.raycast = o.raycast;
    }

    if(typeof o.pointerEffect === 'undefined') {this.pointerEffect = {enabled: false};}
    this.pointerEffect = o.pointerEffect;

    this.name = o.name;
    this.done = false;
    this.canvas = canvas;
    this.device = device;
    this.context = context;
    this.entityArgPass = o.entityArgPass;
    this.clearColor = "red";
    this.video = null;
    this.FINISH_VIDIO_INIT = false;
    this.globalAmbient = [...globalAmbient];
    if(typeof o.material.useTextureFromGlb === 'undefined' ||
      typeof o.material.useTextureFromGlb !== "boolean") {
      o.material.useTextureFromGlb = false;
    }

    if(typeof o.material.useBlend === 'undefined' ||
      typeof o.material.useBlend !== "boolean") {
      o.material.useBlend = false;
    }

    this.useScale = o.useScale || false;
    this.material = o.material;

    this.time = 0;
    this.deltaTimeAdapter = 10;

    addEventListener('update-pipeine', () => {this.setupPipeline()})
    // Mesh stuff - for single mesh or t-posed (fiktive-first in loading order)        
    this.mesh = o.mesh;
    if(_glbFile != null) {
      if(typeof this.mesh == 'undefined') {
        this.mesh = {};
        this.mesh.feedFromRealGlb = true;
      }
      // V
      const verView = _glbFile.skinnedMeshNodes[skinnedNodeIndex].mesh.primitives[primitiveIndex].positions.view;
      const byteOffsetV = verView.byteOffset || 0;
      const byteLengthV = verView.buffer.byteLength;
      const vertices = new Float32Array(
        verView.buffer.buffer,
        byteOffsetV,
        byteLengthV / 4
      );
      this.mesh.vertices = vertices;
      //N
      const norView = _glbFile.skinnedMeshNodes[skinnedNodeIndex].mesh.primitives[primitiveIndex].normals.view;
      const normalsUint8 = norView.buffer;
      const byteOffsetN = norView.byteOffset || 0; // if your loader provides it
      const byteLengthN = normalsUint8.byteLength;
      const normals = new Float32Array(
        normalsUint8.buffer,
        byteOffsetN,
        byteLengthN / 4
      );
      this.mesh.vertexNormals = normals;
      //UV
      let accessor = _glbFile.skinnedMeshNodes[skinnedNodeIndex].mesh.primitives[primitiveIndex].texcoords[0];
      const bufferView = accessor.view;
      const byteOffset = (bufferView.byteOffset || 0) + (accessor.byteOffset || 0);
      const count = accessor.count * 2; // VEC2 = 2 floats per vertex
      const uvFloatArray = new Float32Array(bufferView.buffer.buffer, byteOffset, count);
      this.mesh.uvs = uvFloatArray;
      this.mesh.textures = uvFloatArray;
      // I
      let binaryI = _glbFile.skinnedMeshNodes[skinnedNodeIndex].mesh.primitives[primitiveIndex].indices;
      const indicesView = binaryI.view;
      const indicesUint8 = indicesView.buffer;
      const byteOffsetI = indicesView.byteOffset || 0;
      const byteLengthI = indicesUint8.byteLength;
      // Decide on type from accessor.componentType
      // (5121 = UNSIGNED_BYTE, 5123 = UNSIGNED_SHORT, 5125 = UNSIGNED_INT)
      let indicesArray;
      switch(binaryI.componentType) {
        case 5121: // UNSIGNED_BYTE
          indicesArray = new Uint8Array(indicesUint8.buffer, byteOffsetI, byteLengthI);
          break;
        case 5123: // UNSIGNED_SHORT
          indicesArray = new Uint16Array(indicesUint8.buffer, byteOffsetI, byteLengthI / 2);
          break;
        case 5125: // UNSIGNED_INT
          indicesArray = new Uint32Array(indicesUint8.buffer, byteOffsetI, byteLengthI / 4);
          break;
        default:
          throw new Error("Unknown index componentType");
      }
      this.mesh.indices = indicesArray;
      // W
      let weightsView = _glbFile.skinnedMeshNodes[skinnedNodeIndex].mesh.primitives[primitiveIndex].weights.view;
      this.mesh.weightsView = weightsView;
      let primitive = _glbFile.skinnedMeshNodes[skinnedNodeIndex].mesh.primitives[primitiveIndex];
      let finalRoundedWeights = this.getAccessorArray(_glbFile, primitive.weights.weightsAccessIndex);
      const weightsArray = finalRoundedWeights;
      // Normalize each group of 4
      for(let i = 0;i < weightsArray.length;i += 4) {
        const sum = weightsArray[i] + weightsArray[i + 1] + weightsArray[i + 2] + weightsArray[i + 3];
        if(sum > 0) {
          const inv = 1 / sum;
          weightsArray[i] *= inv;
          weightsArray[i + 1] *= inv;
          weightsArray[i + 2] *= inv;
          weightsArray[i + 3] *= inv;
        } else {
          weightsArray[i] = 1; weightsArray[i + 1] = 0;
          weightsArray[i + 2] = 0; weightsArray[i + 3] = 0;
        }
      }
      for(let i = 0;i < weightsArray.length;i += 4) {
        const s = weightsArray[i] + weightsArray[i + 1] + weightsArray[i + 2] + weightsArray[i + 3];
        if(Math.abs(s - 1.0) > 0.001) console.warn("Weight not normalized!", i, s);
      }
      this.mesh.weightsBuffer = this.device.createBuffer({
        label: "weightsBuffer real data",
        size: weightsArray.byteLength,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        mappedAtCreation: true,
      });
      new Float32Array(this.mesh.weightsBuffer.getMappedRange()).set(weightsArray);
      this.mesh.weightsBuffer.unmap();
      let jointsView = _glbFile.skinnedMeshNodes[skinnedNodeIndex].mesh.primitives[primitiveIndex].joints.view;
      this.mesh.jointsView = jointsView;
      // Create typed array from the buffer (Uint16Array or Uint8Array depending on GLB)
      let jointsArray16 = new Uint16Array(
        jointsView.buffer,
        jointsView.byteOffset || 0,
        jointsView.byteLength / 2 // in Uint16 elements
      );
      const jointsArray32 = new Uint32Array(jointsArray16.length);
      for(let i = 0;i < jointsArray16.length;i++) {
        jointsArray32[i] = jointsArray16[i];
      }
      // Create GPU buffer for joints
      this.mesh.jointsBuffer = this.device.createBuffer({
        label: "jointsBuffer[real-data]",
        size: jointsArray32.byteLength,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        mappedAtCreation: true,
      });
      // Upload the data to GPU
      new Uint32Array(this.mesh.jointsBuffer.getMappedRange()).set(jointsArray32);
      this.mesh.jointsBuffer.unmap();

      // TANGENTS
      let tangentArray = null;
      if(_glbFile.skinnedMeshNodes[skinnedNodeIndex].mesh.primitives[primitiveIndex].tangents) {
        const tangentView = _glbFile.skinnedMeshNodes[skinnedNodeIndex].mesh.primitives[primitiveIndex].tangents.view;
        const byteOffsetT = tangentView.byteOffset || 0;
        const byteLengthT = tangentView.buffer.byteLength;
        tangentArray = new Float32Array(
          tangentView.buffer,
          byteOffsetT,
          byteLengthT / 4
        );
        this.mesh.tangents = tangentArray;

        this.mesh.tangentsBuffer = this.device.createBuffer({
          label: "tangentsBuffer[real-data]",
          size: tangentArray.byteLength,
          usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
          mappedAtCreation: true,
        });
        new Float32Array(this.mesh.tangentsBuffer.getMappedRange()).set(tangentArray);
        this.mesh.tangentsBuffer.unmap();
      } else {
        // 🟢 dummy fallback
        const dummyTangents = new Float32Array(this.mesh.vertices.length / 3 * 4);
        for(let i = 0;i < dummyTangents.length;i += 4) {
          dummyTangents[i + 0] = 1.0; // T = (1,0,0)
          dummyTangents[i + 1] = 0.0;
          dummyTangents[i + 2] = 0.0;
          dummyTangents[i + 3] = 1.0; // handedness
        }
        this.mesh.tangentsBuffer = this.device.createBuffer({
          label: "tangentsBuffer dummy",
          size: dummyTangents.byteLength,
          usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
          mappedAtCreation: true,
        });
        new Float32Array(this.mesh.tangentsBuffer.getMappedRange()).set(dummyTangents);
        this.mesh.tangentsBuffer.unmap();
        console.warn("GLTF primitive has no TANGENT attribute (normal map won’t work properly).");
      }

      // if(this.material.useTextureFromGlb == true) {
      //   console.log('get glb images ', _glbFile.glbJsonData.materials);
      //   _glbFile.glbJsonData.materials.forEach(material => {
      //     console.log('get material :', material);
      //   });

      //   _glbFile.glbJsonData.images.forEach(imgGpuTexture => {
      //     console.log('get images :', imgGpuTexture);
      //   });


      //   _glbFile.glbJsonData.glbTextures.forEach(glbTexture => {
      //     console.log('get glbTextures :', glbTexture);
      //   });
      // }
    } else {
      // obj files flow
      this.mesh.uvs = this.mesh.textures;
    }
    console.log(`%cMesh loaded: ${o.name}`, LOG_FUNNY_ARCADE);
    // ObjSequence animation
    if(typeof o.objAnim !== 'undefined' && o.objAnim != null) {
      this.objAnim = o.objAnim;
      for(var key in this.objAnim.animations) {
        if(key != 'active') this.objAnim.animations[key].speedCounter = 0;
      }
      console.log(`%c Mesh objAnim exist: ${o.objAnim}`, LOG_FUNNY_SMALL);
      this.drawElements = this.drawElementsAnim;
    }
    this.inputHandler = inputHandler;
    this.cameras = o.cameras;
    this.mainCameraParams = {
      type: o.mainCameraParams.type,
      responseCoef: o.mainCameraParams.responseCoef
    };
    this.lastFrameMS = 0;
    this.texturesPaths = [];
    o.texturesPaths.forEach((t) => {this.texturesPaths.push(t)})
    this.presentationFormat = navigator.gpu.getPreferredCanvasFormat();
    this.position = new Position(o.position.x, o.position.y, o.position.z);
    this.rotation = new Rotation(o.rotation.x, o.rotation.y, o.rotation.z);
    this.rotation.rotationSpeed.x = o.rotationSpeed.x;
    this.rotation.rotationSpeed.y = o.rotationSpeed.y;
    this.rotation.rotationSpeed.z = o.rotationSpeed.z;
    this.scale = o.scale;
    // new dummy for skin mesh
    if(!this.joints) {
      const jointsData = new Uint32Array((this.mesh.vertices.length / 3) * 4);
      const jointsBuffer = this.device.createBuffer({
        label: "jointsBuffer",
        size: jointsData.byteLength,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        mappedAtCreation: true,
      });
      new Uint32Array(jointsBuffer.getMappedRange()).set(jointsData);
      jointsBuffer.unmap();
      this.joints = {
        data: jointsData,
        buffer: jointsBuffer,
        stride: 16, // vec4<u32>
      };
      const numVerts = this.mesh.vertices.length / 3;
      // Weights data (vec4<f32>) – default all weight to bone 0
      const weightsData = new Float32Array(numVerts * 4);
      for(let i = 0;i < numVerts;i++) {
        weightsData[i * 4 + 0] = 1.0; // 100% influence of bone 0
        weightsData[i * 4 + 1] = 0.0;
        weightsData[i * 4 + 2] = 0.0;
        weightsData[i * 4 + 3] = 0.0;
      }
      // GPU buffer
      const weightsBuffer = this.device.createBuffer({
        label: "weightsBuffer dummy",
        size: weightsData.byteLength,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        mappedAtCreation: true,
      });
      new Float32Array(weightsBuffer.getMappedRange()).set(weightsData);
      weightsBuffer.unmap();
      this.weights = {
        data: weightsData,
        buffer: weightsBuffer,
        stride: 16, // vec4<f32>
      };
    }

    this.runProgram = () => {
      return new Promise(async (resolve) => {
        this.shadowDepthTextureSize = 1024;
        this.modelViewProjectionMatrix = mat4.create();
        this.loadTex0(this.texturesPaths).then(() => {
          resolve()
        })
      })
    }

    this.runProgram().then(() => {
      this.context.configure({
        device: this.device,
        format: this.presentationFormat,
        alphaMode: 'premultiplied',
      });

      // Create the model vertex buffer.
      this.vertexBuffer = this.device.createBuffer({
        size: this.mesh.vertices.length * Float32Array.BYTES_PER_ELEMENT,
        usage: GPUBufferUsage.VERTEX,
        mappedAtCreation: true,
      });
      {
        new Float32Array(this.vertexBuffer.getMappedRange()).set(this.mesh.vertices);
        this.vertexBuffer.unmap();
      }

      // Create the model vertex buffer.
      this.vertexNormalsBuffer = this.device.createBuffer({
        size: this.mesh.vertexNormals.length * Float32Array.BYTES_PER_ELEMENT,
        usage: GPUBufferUsage.VERTEX,
        mappedAtCreation: true,
      });
      {
        new Float32Array(this.vertexNormalsBuffer.getMappedRange()).set(this.mesh.vertexNormals);
        this.vertexNormalsBuffer.unmap();
      }

      this.vertexTexCoordsBuffer = this.device.createBuffer({
        size: this.mesh.textures.length * Float32Array.BYTES_PER_ELEMENT,
        usage: GPUBufferUsage.VERTEX,
        mappedAtCreation: true,
      });
      {
        new Float32Array(this.vertexTexCoordsBuffer.getMappedRange()).set(this.mesh.textures);
        this.vertexTexCoordsBuffer.unmap();
      }

      // Create the model index buffer.
      this.indexCount = this.mesh.indices.length;
      const indexCount = this.mesh.indices.length;
      const size = Math.ceil(indexCount * Uint16Array.BYTES_PER_ELEMENT / 4) * 4;

      this.indexBuffer = this.device.createBuffer({
        size,
        usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
        mappedAtCreation: true
      });

      new Uint16Array(this.indexBuffer.getMappedRange()).set(this.mesh.indices);
      this.indexBuffer.unmap();
      this.indexCount = indexCount;
      let glbInfo = {
        arrayStride: 4 * 4, // vec4<f32> = 4 * 4 bytes
        attributes: [{format: 'float32x4', offset: 0, shaderLocation: 4}]
      }

      this.vertexBuffers = [
        {
          arrayStride: Float32Array.BYTES_PER_ELEMENT * 3,
          attributes: [{shaderLocation: 0, offset: 0, format: "float32x3", }],
        },
        {
          arrayStride: Float32Array.BYTES_PER_ELEMENT * 3,
          attributes: [{shaderLocation: 1, offset: 0, format: "float32x3", },],
        },
        {
          arrayStride: Float32Array.BYTES_PER_ELEMENT * 2,
          attributes: [{shaderLocation: 2, offset: 0, format: "float32x2", },],
        },
        // joint indices
        {
          arrayStride: 4 * 4, // vec4<u32> = 4 * 4 bytes
          attributes: [{format: 'uint32x4', offset: 0, shaderLocation: 3}]
        },
        // weights
        glbInfo,
      ];

      if(this.mesh.tangentsBuffer) {
        this.vertexBuffers.push({
          arrayStride: 4 * 4, // vec4<f32> = 16 bytes
          attributes: [
            {shaderLocation: 5, format: "float32x4", offset: 0}
          ]
        });
      }
      // Note: The frontFace and cullMode values have no effect on the 
      // 'triangle-list'   // standard meshes
      // 'triangle-strip' // terrain, strips
      // 'line-list'      // wireframe (manual index gen)
      // 'line-strip'     // outlines
      // 'point-list'     // particles
      this.topology = 'triangle-list';
      this.setTopology = (t) => {
        const isStrip =
          t === 'triangle-strip' ||
          t === 'line-strip';
        if(isStrip) {
          this.primitive = {
            topology: t,
            stripIndexFormat: 'uint16',
            cullMode: 'none',
            frontFace: 'ccw'
          };
        } else {
          this.primitive = {
            topology: t,
            cullMode: 'none',
            frontFace: 'ccw'
          };
        }
        this.setupPipeline();
      };

      // 'back' typical for shadow passes
      this.primitive = {
        topology: this.topology,
        cullMode: 'none',
        frontFace: 'ccw'
      }

      // Selected effect
      this.selectedBuffer = device.createBuffer({size: 4, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST});
      this.selectedBindGroupLayout = device.createBindGroupLayout({
        label: 'selectedBindGroupLayout mesh',
        entries: [
          {binding: 0, visibility: GPUShaderStage.FRAGMENT, buffer: {}},
        ],
      });

      this.selectedBindGroup = device.createBindGroup({
        label: 'selectedBindGroup mesh',
        layout: this.selectedBindGroupLayout,
        entries: [{binding: 0, resource: {buffer: this.selectedBuffer}}],
      });

      this.setSelectedEffect = (selected = false) => {
        this.device.queue.writeBuffer(this.selectedBuffer, 0, new Float32Array([selected ? 1.0 : 0.0]));
      };
      // 0 default
      this.setSelectedEffect();

      // Create a bind group layout which holds the scene uniforms and
      // the texture+sampler for depth. We create it manually because the WebPU
      // implementation doesn't infer this from the shader (yet).
      this.createLayoutForRender();

      this.modelUniformBuffer = this.device.createBuffer({
        size: 4 * 16, // 4x4 matrix
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
      });

      this.sceneUniformBuffer = this.device.createBuffer({
        label: 'sceneUniformBuffer per mesh',
        size: 192,//192, // ⬅️ was 176
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
      });

      this.uniformBufferBindGroupLayout = this.device.createBindGroupLayout({
        label: 'uniformBufferBindGroupLayout in mesh regular',
        entries: [
          {binding: 0, visibility: GPUShaderStage.VERTEX, buffer: {type: 'uniform'}},
          {binding: 1, visibility: GPUShaderStage.VERTEX, buffer: {type: 'uniform'}},
          {binding: 2, visibility: GPUShaderStage.VERTEX, buffer: {type: 'uniform'}}
        ],
      });

      function alignTo256(n) {return Math.ceil(n / 256) * 256;}

      let MAX_BONES = 100;
      this.MAX_BONES = MAX_BONES;
      this.bonesBuffer = device.createBuffer({
        label: "bonesBuffer",
        size: alignTo256(64 * MAX_BONES),
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
      });

      const bones = new Float32Array(this.MAX_BONES * 16);
      for(let i = 0;i < this.MAX_BONES;i++) {
        bones.set([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1], i * 16);
      }
      this.device.queue.writeBuffer(this.bonesBuffer, 0, bones);
      const VERTEX_ANIM_FLAGS = {
        NONE: 0,
        WAVE: 1 << 0,      // 1
        WIND: 1 << 1,      // 2
        PULSE: 1 << 2,     // 4
        TWIST: 1 << 3,     // 8
        NOISE: 1 << 4,     // 16
        OCEAN: 1 << 5,     // 32
        DISPLACEMENT: 1 << 6 // 64
      };

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

      this.updateTime = (time) => {
        this.time += time * this.deltaTimeAdapter;
        this.vertexAnimParams[0] = this.time;
        this.device.queue.writeBuffer(this.vertexAnimBuffer, 0, this.vertexAnimParams);
        const effectMix = 0.5 + 0.5 * Math.sin(this.time * 0.5);
        this.setupMaterialPBR(false, false, false, effectMix, 1.0);
      }

      this.modelBindGroup = this.device.createBindGroup({
        label: 'modelBindGroup in mesh',
        layout: this.uniformBufferBindGroupLayout,
        entries: [
          {binding: 0, resource: {buffer: this.modelUniformBuffer}},
          {binding: 1, resource: {buffer: this.bonesBuffer}},
          {binding: 2, resource: {buffer: this.vertexAnimBuffer}}
        ],
      });

      this.mainPassBindGroupLayout = this.device.createBindGroupLayout({
        label: '[mainPass]BindGroupLayout mesh',
        entries: [
          {binding: 0, visibility: GPUShaderStage.FRAGMENT, texture: {sampleType: 'depth'}},
          {binding: 1, visibility: GPUShaderStage.FRAGMENT, sampler: {type: 'comparison'}},
        ],
      });

      this.effects = {};
      if(this.pointerEffect && this.pointerEffect.enabled === true) {
        let pf = navigator.gpu.getPreferredCanvasFormat();
        if(typeof this.pointerEffect.pointEffect !== 'undefined' && this.pointerEffect.pointEffect == true) {
          this.effects.pointEffect = new PointEffect(device, 'rgba16float');
        }
        if(typeof this.pointerEffect.gizmoEffect !== 'undefined' && this.pointerEffect.gizmoEffect == true) {
          this.effects.gizmoEffect = new GizmoEffect(device, 'rgba16float');
        }
        if(typeof this.pointerEffect.flameEffect !== 'undefined' && this.pointerEffect.flameEffect == true) {
           this.effects.flameEffect = FlameEffect.fromPreset(device, pf, "rgba16float", "torch");
        }
        if(typeof this.pointerEffect.flameEmitter !== 'undefined' && this.pointerEffect.flameEmitter == true) {
           this.effects.flameEmitter = new FlameEmitter(device, "rgba16float");
        }

        if(typeof this.pointerEffect.destructionEffect !== 'undefined' && this.pointerEffect.destructionEffect == true) {
          this.effects.destructionEffect = new DestructionEffect(device, 'rgba16float', {
            particleCount: 100,
            duration: 2.5,
            color: [0.6, 0.5, 0.4, 1.0]
          });
        }
      }

      this.getTransformationMatrix = (mainRenderBundle, spotLight, index) => {
        const now = Date.now();
        const dt = (now - this.lastFrameMS) / this.mainCameraParams.responseCoef;
        this.lastFrameMS = now;
        const camera = this.cameras[this.mainCameraParams.type];
        if(index == 0) camera.update(dt, inputHandler());
        const camVP = mat4.multiply(camera.projectionMatrix, camera.view);
        const sceneData = new Float32Array(48);
        sceneData.set(spotLight.viewProjMatrix, 0);
        sceneData.set(camVP, 16);
        sceneData.set([camera.position.x, camera.position.y, camera.position.z, 0.0], 32);
        sceneData.set([spotLight.position[0], spotLight.position[1], spotLight.position[2], 0.0], 36);
        sceneData.set([this.globalAmbient[0], this.globalAmbient[1], this.globalAmbient[2], 0.0], 40);
        sceneData.set([this.time, dt, 0, 0], 44);
        device.queue.writeBuffer(this.sceneUniformBuffer, 0, sceneData.buffer, sceneData.byteOffset, sceneData.byteLength)
      };

      this.getModelMatrix = (pos, useScale = false) => {
        let modelMatrix = mat4.identity();
        mat4.translate(modelMatrix, [pos.x, pos.y, pos.z], modelMatrix);
        if(this.itIsPhysicsBody) {
          mat4.rotate(modelMatrix,
            [this.rotation.axis.x, this.rotation.axis.y, this.rotation.axis.z],
            degToRad(this.rotation.angle),
            modelMatrix
          );
        } else {
          mat4.rotateX(modelMatrix, this.rotation.getRotX(), modelMatrix);
          mat4.rotateY(modelMatrix, this.rotation.getRotY(), modelMatrix);
          mat4.rotateZ(modelMatrix, this.rotation.getRotZ(), modelMatrix);
        }
        // if(this.glb || this.objAnim) {
        //   // mat4.scale(modelMatrix, [this.scale[0], this.scale[1], this.scale[2]], modelMatrix);
        // }
        if(useScale == true) {
          mat4.scale(modelMatrix, [this.scale[0], this.scale[1], this.scale[2]], modelMatrix);
        }
        return modelMatrix;
      };

      // looks like affect on transformations for now const 0
      const modelMatrix = mat4.translation([0, 0, 0]);
      const modelData = modelMatrix;
      this.device.queue.writeBuffer(
        this.modelUniformBuffer,
        0,
        modelData.buffer,
        modelData.byteOffset,
        modelData.byteLength
      );
      this.done = true;
      try {
        this.setupPipeline();
      } catch(err) {console.log('Err[create pipeline]:', err)}
    }).then(() => {
      if(typeof this.objAnim !== 'undefined' && this.objAnim !== null) {
        console.log('After all updateMeshListBuffers...');
        this.updateMeshListBuffers();
      }
    })
  }

  setupPipeline = () => {
    this.createBindGroupForRender();
    this.pipeline = this.device.createRenderPipeline({
      label: 'Main [Mesh] Pipeline ✅[OPAQUE]',
      layout: this.device.createPipelineLayout({
        label: 'PipelineLayout Opaque',
        bindGroupLayouts: [
          this.bglForRender,
          this.uniformBufferBindGroupLayout,
          this.selectedBindGroupLayout,
          this.waterBindGroupLayout,
        ],
      }),
      vertex: {
        entryPoint: 'main',
        module: this.device.createShaderModule({
          code: (this.material.type === 'normalmap') ? vertexWGSL_NM : vertexWGSL,
        }),
        buffers: this.vertexBuffers,
      },
      fragment: {
        entryPoint: 'main',
        module: this.device.createShaderModule({
          code: (this.isVideo === true ? fragmentVideoWGSL : this.getMaterial()),
        }),
        targets: [
          {
            format: 'rgba16float',
            blend: undefined
          },
        ],
        constants: {
          shadowDepthTextureSize: this.shadowDepthTextureSize,
        },
      },
      depthStencil: {
        depthWriteEnabled: true,
        depthCompare: 'less',
        format: 'depth24plus',
      },
      primitive: this.primitive,
    });
    // TRANSPARENT
    this.pipelineTransparent = this.device.createRenderPipeline({
      label: 'Main [Mesh] Pipeline ✅[Transparent]',
      layout: this.device.createPipelineLayout({
        label: 'Main PipelineLayout Transparent',
        bindGroupLayouts: [
          this.bglForRender,
          this.uniformBufferBindGroupLayout,
          this.selectedBindGroupLayout,
          this.waterBindGroupLayout,
        ],
      }),
      vertex: {
        entryPoint: 'main',
        module: this.device.createShaderModule({
          code: (this.material.type === 'normalmap') ? vertexWGSL_NM : vertexWGSL,
        }),
        buffers: this.vertexBuffers,
      },
      fragment: {
        entryPoint: 'main',
        module: this.device.createShaderModule({
          code: (this.isVideo === true ? fragmentVideoWGSL : this.getMaterial()),
        }),
        targets: [
          {
            format: 'rgba16float',
            blend: {
              color: {
                srcFactor: 'src-alpha',
                dstFactor: 'one-minus-src-alpha',
                operation: 'add',
              },
              alpha: {
                srcFactor: 'one',
                dstFactor: 'one-minus-src-alpha',
                operation: 'add',
              },
            },
          },
        ],
        constants: {
          shadowDepthTextureSize: this.shadowDepthTextureSize,
        },
      },
      depthStencil: {
        depthWriteEnabled: false,
        depthCompare: 'less',
        format: 'depth24plus',
      },
      primitive: this.primitive,
    });
    // console.log('✅Set Pipelines done');
  }

  getMainPipeline = () => {
    return this.pipeline;
  }

  updateModelUniformBuffer = () => {
    if(this.done == false) return;
    // Per-object model matrix only
    const modelMatrix = this.getModelMatrix(this.position, this.useScale);
    this.device.queue.writeBuffer(
      this.modelUniformBuffer,
      0,
      modelMatrix.buffer,
      modelMatrix.byteOffset,
      modelMatrix.byteLength
    );
  }

  createGPUBuffer(dataArray, usage) {
    if(!dataArray || typeof dataArray.length !== 'number') {
      throw new Error('Invalid data array passed to createGPUBuffer');
    }

    const size = dataArray.length * dataArray.BYTES_PER_ELEMENT;
    if(!Number.isFinite(size) || size <= 0) {
      throw new Error(`Invalid buffer size: ${size}`);
    }

    const buffer = this.device.createBuffer({
      size,
      usage,
      mappedAtCreation: true,
    });

    const writeArray = dataArray.constructor === Float32Array
      ? new Float32Array(buffer.getMappedRange())
      : new Uint16Array(buffer.getMappedRange());
    writeArray.set(dataArray);
    buffer.unmap();
    return buffer;
  }

  updateMeshListBuffers() {
    for(const key in this.objAnim.meshList) {
      const mesh = this.objAnim.meshList[key];
      mesh.vertexBuffer = this.device.createBuffer({
        size: mesh.vertices.length * Float32Array.BYTES_PER_ELEMENT,
        usage: GPUBufferUsage.VERTEX,
        mappedAtCreation: true,
      });
      new Float32Array(mesh.vertexBuffer.getMappedRange()).set(mesh.vertices);
      mesh.vertexBuffer.unmap();
      // Normals
      mesh.vertexNormalsBuffer = this.device.createBuffer({
        size: mesh.vertexNormals.length * Float32Array.BYTES_PER_ELEMENT,
        usage: GPUBufferUsage.VERTEX,
        mappedAtCreation: true,
      });
      new Float32Array(mesh.vertexNormalsBuffer.getMappedRange()).set(mesh.vertexNormals);
      mesh.vertexNormalsBuffer.unmap();
      // UVs
      mesh.vertexTexCoordsBuffer = this.device.createBuffer({
        size: mesh.textures.length * Float32Array.BYTES_PER_ELEMENT,
        usage: GPUBufferUsage.VERTEX,
        mappedAtCreation: true,
      });
      new Float32Array(mesh.vertexTexCoordsBuffer.getMappedRange()).set(mesh.textures);
      mesh.vertexTexCoordsBuffer.unmap();
      // Indices
      const indexCount = mesh.indices.length;
      const indexSize = Math.ceil(indexCount * Uint16Array.BYTES_PER_ELEMENT / 4) * 4;
      mesh.indexBuffer = this.device.createBuffer({
        size: indexSize,
        usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
        mappedAtCreation: true,
      });
      new Uint16Array(mesh.indexBuffer.getMappedRange()).set(mesh.indices);
      mesh.indexBuffer.unmap();
      mesh.indexCount = indexCount;
    }
  }

  drawElements = (pass, lightContainer) => {
    if(this.isVideo) {
      this.updateVideoTexture();
    }
    // Bind per-mesh uniforms
    pass.setBindGroup(0, this.sceneBindGroupForRender);
    pass.setBindGroup(1, this.modelBindGroup);
    if(this.isVideo == false) {
      let bindIndex = 2;
      for(const light of lightContainer) {
        pass.setBindGroup(bindIndex++, light.getMainPassBindGroup(this));
      }
    }
    if(this.selectedBindGroup) {pass.setBindGroup(2, this.selectedBindGroup)}
    pass.setBindGroup(3, this.waterBindGroup);

    pass.setVertexBuffer(0, this.vertexBuffer);
    pass.setVertexBuffer(1, this.vertexNormalsBuffer);
    pass.setVertexBuffer(2, this.vertexTexCoordsBuffer);
    if(this.joints) {
      if(this.constructor.name === "BVHPlayer") {
        pass.setVertexBuffer(3, this.mesh.jointsBuffer);  // real
        pass.setVertexBuffer(4, this.mesh.weightsBuffer); //real
      } else {
        // dummy
        pass.setVertexBuffer(3, this.joints.buffer);  // new dummy
        pass.setVertexBuffer(4, this.weights.buffer); // new dummy
      }
    }

    if(this.mesh.tangentsBuffer) {
      pass.setVertexBuffer(5, this.mesh.tangentsBuffer);
    }

    pass.setIndexBuffer(this.indexBuffer, 'uint16');
    pass.drawIndexed(this.indexCount);
  }

  drawElementsAnim = (renderPass, lightContainer) => {
    if(!this.sceneBindGroupForRender || !this.modelBindGroup) {console.log('NULL1'); return;}
    if(!this.objAnim.meshList[this.objAnim.id + this.objAnim.currentAni]) {console.log('NULL2'); return;}

    renderPass.setBindGroup(0, this.sceneBindGroupForRender);
    renderPass.setBindGroup(1, this.modelBindGroup);
    const mesh = this.objAnim.meshList[this.objAnim.id + this.objAnim.currentAni];

    if(this.isVideo == false) {
      let bindIndex = 2;
      for(const light of lightContainer) {
        renderPass.setBindGroup(bindIndex++, light.getMainPassBindGroup(this));
      }
    }

    if(this.selectedBindGroup) {
      renderPass.setBindGroup(2, this.selectedBindGroup);
    }

    renderPass.setBindGroup(3, this.waterBindGroup);

    renderPass.setVertexBuffer(0, mesh.vertexBuffer);
    renderPass.setVertexBuffer(1, mesh.vertexNormalsBuffer);
    renderPass.setVertexBuffer(2, mesh.vertexTexCoordsBuffer);

    if(this.constructor.name === "BVHPlayer") {
      // real
      renderPass.setVertexBuffer(3, this.mesh.jointsBuffer);
      renderPass.setVertexBuffer(4, this.mesh.weightsBuffer);
    } else {
      // dummy
      renderPass.setVertexBuffer(3, this.joints.buffer);
      renderPass.setVertexBuffer(4, this.weights.buffer);
    }

    if(this.mesh.tangentsBuffer) {
      renderPass.setVertexBuffer(5, this.mesh.tangentsBuffer);
    }

    renderPass.setIndexBuffer(mesh.indexBuffer, 'uint16');
    renderPass.drawIndexed(mesh.indexCount);

    if(this.objAnim.playing == true) {
      if(this.objAnim.animations[this.objAnim.animations.active].speedCounter >= this.objAnim.animations[this.objAnim.animations.active].speed) {
        this.objAnim.currentAni++;
        this.objAnim.animations[this.objAnim.animations.active].speedCounter = 0;
      } else {
        this.objAnim.animations[this.objAnim.animations.active].speedCounter++;
      }
      if(this.objAnim.currentAni >= this.objAnim.animations[this.objAnim.animations.active].to) {
        this.objAnim.currentAni = this.objAnim.animations[this.objAnim.animations.active].from;
      }
    }
  }

  drawShadows = (shadowPass) => {
    shadowPass.setVertexBuffer(0, this.vertexBuffer);
    shadowPass.setVertexBuffer(1, this.vertexNormalsBuffer);
    shadowPass.setVertexBuffer(2, this.vertexTexCoordsBuffer);
    shadowPass.setVertexBuffer(3, this.joints.buffer);
    shadowPass.setVertexBuffer(4, this.weights.buffer);
    shadowPass.setIndexBuffer(this.indexBuffer, 'uint16');
    shadowPass.drawIndexed(this.indexCount);
  }

  destroy = () => {
    if(this._destroyed) return;
    this._destroyed = true;
    // --- GPU Buffers ---
    this.vertexBuffer?.destroy();
    this.vertexNormalsBuffer?.destroy();
    this.vertexTexCoordsBuffer?.destroy();
    this.indexBuffer?.destroy();

    this.modelUniformBuffer?.destroy();
    this.sceneUniformBuffer?.destroy();
    this.bonesBuffer?.destroy();
    this.selectedBuffer?.destroy();
    // Skinning
    this.mesh?.weightsBuffer?.destroy();
    this.mesh?.jointsBuffer?.destroy();
    this.mesh?.tangentsBuffer?.destroy();
    // Dummy skin buffers
    this.joints?.buffer?.destroy();
    this.weights?.buffer?.destroy();
    // Obj sequence animation buffers
    if(this.objAnim?.meshList) {
      for(const k in this.objAnim.meshList) {
        const m = this.objAnim.meshList[k];
        m.vertexBuffer?.destroy();
        m.vertexNormalsBuffer?.destroy();
        m.vertexTexCoordsBuffer?.destroy();
        m.indexBuffer?.destroy();
      }
    }

    if(this.effects?.pointer?.destroy) {
      this.effects.pointer.destroy();
    }

    this.pipeline = null;
    this.modelBindGroup = null;
    this.sceneBindGroupForRender = null;
    this.selectedBindGroup = null;

    this.material = null;
    this.mesh = null;
    this.objAnim = null;

    this.drawElements = () => {};
    this.drawElementsAnim = () => {};
    this.drawShadows = () => {};

    let testPB = app.matrixAmmo.getBodyByName(this.name);
    if(testPB !== null) {
      try {
        app.matrixAmmo.dynamicsWorld.removeRigidBody(testPB);
      } catch(e) {
        console.warn("Physics cleanup err:", e);
      }
    }
    console.info(`🧹Destroyed: ${this.name}`);
  }

}