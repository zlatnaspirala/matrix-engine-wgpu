import {mat4} from 'wgpu-matrix';
import {Position, Rotation} from "../matrix-class";
import {degToRad, genName, LOG_FUNNY_SMALL, MeshType} from '../utils';
import {fragmentVideoWGSL} from '../../shaders/fragment.video.wgsl';
import {PointerEffect} from '../effects/pointerEffect';
import MaterialsInstanced from './materials-instanced';
import {vertexWGSLInstanced} from '../../shaders/instanced/vertex.instanced.wgsl';
import {BVHPlayerInstances} from '../loaders/bvh-instaced';
import {GenGeo} from '../effects/gen';
import {HPBarEffect} from '../effects/energy-bar';
import {MANABarEffect} from '../effects/mana-bar';
import {FlameEffect} from '../effects/flame';
import {FlameEmitter} from '../effects/flame-emmiter';
import {GenGeoTexture} from '../effects/gen-tex';
import {GenGeoTexture2} from '../effects/gen-tex2';
import {VERTEX_ANIM_FLAGS} from '../literals';
import {MEConfig} from '../../me-config';
import {buildPipelineKey, PipelineManager} from '../pipelineManager';

export default class MEMeshObjInstances extends MaterialsInstanced {
  constructor(canvas, device, context, o, inputHandler, globalAmbient, _glbFile = null, primitiveIndex = null, skinnedNodeIndex = null) {
    super(device, o.material, _glbFile, o.textureCache);
    if(typeof o.name === 'undefined') o.name = genName(3);
    if(typeof o.raycast === 'undefined') {this.raycast = {enabled: false, radius: 2}} else {
      this.raycast = o.raycast;
    }
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
    this.useScale = o.useScale || false;
    this.mType = MeshType.INSTANCED;
    this.shadowsCast = o.shadowsCast ? o.shadowsCast : true;
    this.sceneBGL = o.sceneBGL;
    this.materialBGL = o.materialBGL;
    this.uniformBufferBindGroupLayoutInstanced = o.uniformBufferBindGroupLayoutInstanced;
    // cache
    this._posArray = new Float32Array(3);
    this._scaleArray = new Float32Array(3);
    this._modelMatrix = mat4.create();
    this._translateVec = new Float32Array(3);
    this._rotAxisVec = new Float32Array(3);
    this._scaleVec = new Float32Array(3);
    this._ghostScratch = new Float32Array(16);
    this._defaultColor = new Float32Array([1, 1, 1, 1]);
    this._camVP = mat4.create();
    this.buildPipelineBucketsEvent = new CustomEvent('update-pipeine-buckets', {});

    if(typeof o.material.useTextureFromGlb === 'undefined' || typeof o.material.useTextureFromGlb !== "boolean") {
      o.material.useTextureFromGlb = false;
    }

    if(typeof o.material.useBlend === 'undefined' || typeof o.material.useBlend !== "boolean") {
      o.material.useBlend = false;
    }

    if(o.envMapParams !== null) {this.envMapParams = o.envMapParams;}

    this.material = o.material;
    this.time = 0;
    this.deltaTimeAdapter = 10;
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
      const byteOffsetN = norView.byteOffset || 0;
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
      const count = accessor.count * 2;
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
        label: "weightsBuffer real",
        size: weightsArray.byteLength,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        mappedAtCreation: true,
      });
      new Float32Array(this.mesh.weightsBuffer.getMappedRange()).set(weightsArray);
      this.mesh.weightsBuffer.unmap();
      let jointsView = _glbFile.skinnedMeshNodes[skinnedNodeIndex].mesh.primitives[primitiveIndex].joints.view;
      this.mesh.jointsView = jointsView;
      let jointsArray16 = new Uint16Array(
        jointsView.buffer,
        jointsView.byteOffset || 0,
        jointsView.byteLength / 2
      );
      const jointsArray32 = new Uint32Array(jointsArray16.length);
      for(let i = 0;i < jointsArray16.length;i++) {
        jointsArray32[i] = jointsArray16[i];
      }
      this.mesh.jointsBuffer = this.device.createBuffer({
        label: "jointsBuffer[real]",
        size: jointsArray32.byteLength,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        mappedAtCreation: true,
      });
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
          label: "tangentsBuffer[real]",
          size: tangentArray.byteLength,
          usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
          mappedAtCreation: true,
        });
        new Float32Array(this.mesh.tangentsBuffer.getMappedRange()).set(tangentArray);
        this.mesh.tangentsBuffer.unmap();
      } else {
        const dummyTangents = new Float32Array(this.mesh.vertices.length / 3 * 4);
        for(let i = 0;i < dummyTangents.length;i += 4) {
          dummyTangents[i + 0] = 1.0;
          dummyTangents[i + 1] = 0.0;
          dummyTangents[i + 2] = 0.0;
          dummyTangents[i + 3] = 1.0;
        }
        this.mesh.tangentsBuffer = this.device.createBuffer({
          label: "tangentsBuffer dummy",
          size: dummyTangents.byteLength,
          usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
          mappedAtCreation: true,
        });
        new Float32Array(this.mesh.tangentsBuffer.getMappedRange()).set(dummyTangents);
        this.mesh.tangentsBuffer.unmap();
      }
    } else {
      this.mesh.uvs = this.mesh.textures;
    }
    // ObjSequence animation
    if(typeof o.objAnim !== 'undefined' && o.objAnim != null) {
      this.objAnim = o.objAnim;
      for(var key in this.objAnim.animations) {
        if(key != 'active') this.objAnim.animations[key].speedCounter = 0;
      }
      console.log(`%c Mesh objAnim exist: ${o.objAnim}`, LOG_FUNNY_SMALL);
      this.drawElements = this.drawElementsAnim;
    }
    // else if maybe
    if(typeof o.isVideo !== 'undefined') {
      this.loadVideoTexture(o.isVideo);
      this.drawElements = this.drawVideoElements;
    }
    this.inputHandler = inputHandler;
    this.cameras = o.cameras;
    this.mainCameraParams = {
      type: o.mainCameraParams.type,
      responseCoef: o.mainCameraParams.responseCoef
    };
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
    if(!this.mesh.jointsBuffer) {
      const jointsData = new Uint32Array((this.mesh.vertices.length / 3) * 4);
      const jointsBuffer = this.device.createBuffer({
        label: "jointsBuffer",
        size: jointsData.byteLength,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        mappedAtCreation: true,
      });
      new Uint32Array(jointsBuffer.getMappedRange()).set(jointsData);
      jointsBuffer.unmap();
      this.mesh.jointsBuffer = jointsBuffer;
      const numVerts = this.mesh.vertices.length / 3;
      const weightsData = new Float32Array(numVerts * 4);
      for(let i = 0;i < numVerts;i++) {
        weightsData[i * 4 + 0] = 1.0; // 100% influence of bone 0
        weightsData[i * 4 + 1] = 0.0;
        weightsData[i * 4 + 2] = 0.0;
        weightsData[i * 4 + 3] = 0.0;
      }
      const weightsBuffer = this.device.createBuffer({
        label: "weightsBuffer dummy",
        size: weightsData.byteLength,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        mappedAtCreation: true,
      });
      new Float32Array(weightsBuffer.getMappedRange()).set(weightsData);
      weightsBuffer.unmap();
      this.mesh.weightsBuffer = weightsBuffer;
    }

    this.runProgram = () => {
      return new Promise(async (resolve) => {
        this.shadowDepthTextureSize = 512;
        this.modelViewProjectionMatrix = mat4.create();
        this.loadTex0(this.texturesPaths).then(() => {resolve()})
      })
    }

    this.runProgram().then(() => {
      this.context.configure({
        device: this.device,
        format: this.presentationFormat,
        alphaMode: 'premultiplied'
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
        arrayStride: 4 * 4,
        attributes: [{format: 'float32x4', offset: 0, shaderLocation: 4}]
      }

      this.vertexBuffers = [
        {
          arrayStride: Float32Array.BYTES_PER_ELEMENT * 3,
          attributes: [
            {
              // position
              shaderLocation: 0,
              offset: 0,
              format: "float32x3",
            }
          ],
        },
        {
          arrayStride: Float32Array.BYTES_PER_ELEMENT * 3,
          attributes: [
            {
              // normal
              shaderLocation: 1,
              offset: 0,
              format: "float32x3",
            },
          ],
        },
        {
          arrayStride: Float32Array.BYTES_PER_ELEMENT * 2,
          attributes: [
            {
              // uvs
              shaderLocation: 2,
              offset: 0,
              format: "float32x2",
            },
          ],
        },
        // joint indices
        {
          arrayStride: 4 * 4,
          attributes: [{format: 'uint32x4', offset: 0, shaderLocation: 3}]
        },
        // weights
        glbInfo,
      ];

      if(this.mesh.tangentsBuffer) {
        this.vertexBuffers.push({
          arrayStride: 4 * 4,
          attributes: [
            {shaderLocation: 5, format: "float32x4", offset: 0}
          ]
        });
      }

      // Note: The frontFace and cullMode values have no effect on the 
      // "point-list", "line-list", or "line-strip" topologies.
      this.primitive = {
        topology: 'triangle-list',
        cullMode: 'back', // typical for shadow passes
        frontFace: 'ccw'
      }

      this.mirrorBindGroupLayout = this.device.createBindGroupLayout({
        label: 'mirrorBindGroupLayout',
        entries: [
          {binding: 0, visibility: GPUShaderStage.FRAGMENT, buffer: {type: 'uniform', minBindingSize: 80}},
          {binding: 1, visibility: GPUShaderStage.FRAGMENT, texture: {sampleType: 'float', viewDimension: '2d', multisampled: false}},
          {binding: 2, visibility: GPUShaderStage.FRAGMENT, sampler: {type: 'filtering'}}
        ]
      });

      // Create a bind group layout which holds the scene uniforms and
      // the texture+sampler for depth. We create it manually because the WebPU
      // implementation doesn't infer this from the shader (yet).
      this.materialVideoBGL = this.device.createBindGroupLayout({
        label: 'MaterialVideoBGL',
        entries: [
          {binding: 0, visibility: GPUShaderStage.FRAGMENT, externalTexture: {}},
          {binding: 1, visibility: GPUShaderStage.FRAGMENT, sampler: {type: 'filtering'}},
          {binding: 2, visibility: GPUShaderStage.FRAGMENT, buffer: {type: 'uniform'}}
        ]
      });

      // EDIT INSTANCED PART
      this.instanceTargets = [];
      this.lerpSpeed = 0.05;
      this.lerpSpeedAlpha = 0.05;
      this.maxInstances = 5;
      this.instanceCount = 2;
      this.floatsPerInstance = 16 + 4;

      for(let x = 0;x < this.maxInstances;x++) {
        this.instanceTargets.push({
          index: x,
          position: [0, 0, 0],
          currentPosition: [0, 0, 0],
          scale: [1, 1, 1],
          currentScale: [1, 1, 1],
          color: [0.6, 0.8, 1.0, 0.4],
          currentColor: [0.6, 0.8, 1.0, 0.4],
        });
      }

      this.instanceData = new Float32Array(this.instanceCount * this.floatsPerInstance);
      this.instanceBuffer = device.createBuffer({
        size: this.instanceData.byteLength,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
      });

      this.updateInstanceData = (modelMatrix) => {
        this.instanceData.set(modelMatrix, 0);
        this.instanceData.set(this._defaultColor, 16);

        for(let i = 1;i < this.instanceCount;i++) {
          const t = this.instanceTargets[i];
          this._ghostScratch.set(modelMatrix);
          const ghost = this._ghostScratch;

          for(let j = 0;j < 3;j++) {
            t.currentPosition[j] += (t.position[j] - t.currentPosition[j]) * this.lerpSpeed;
            t.currentScale[j] += (t.scale[j] - t.currentScale[j]) * this.lerpSpeed;
            t.currentColor[j] += (t.color[j] - t.currentColor[j]) * this.lerpSpeed;
            if(j === 2) {
              t.currentColor[j + 1] += (t.color[j + 1] - t.currentColor[j + 1]) * this.lerpSpeedAlpha;
            }
          }

          const sx = t.currentScale[0];
          const sy = t.currentScale[1];
          const sz = t.currentScale[2];

          ghost[0] *= sx; ghost[1] *= sx; ghost[2] *= sx;
          ghost[4] *= sy; ghost[5] *= sy; ghost[6] *= sy;
          ghost[8] *= sz; ghost[9] *= sz; ghost[10] *= sz;

          ghost[12] += t.currentPosition[0];
          ghost[13] += t.currentPosition[1];
          ghost[14] += t.currentPosition[2];

          const offset = 20 * i;
          this.instanceData.set(ghost, offset);
          this.instanceData.set(t.currentColor, offset + 16);
        }

        device.queue.writeBuffer(this.instanceBuffer, 0, this.instanceData);
      };

      this.updateInstances = (newCount) => {
        if(newCount > this.maxInstances) {
          console.error(`Instance count ${newCount} exceeds buffer max ${this.maxInstances}`);
          return;
        }
        this.instanceCount = newCount;
        this.instanceData = new Float32Array(this.instanceCount * this.floatsPerInstance);
        this.instanceBuffer = device.createBuffer({
          label: 'instanceBuffer in bvh mesh [instanced]',
          size: this.instanceData.byteLength,
          usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
        });
        let m = this.getModelMatrix(this.position, this.useScale);
        this.updateInstanceData(m);
      };

      this.updateMaxInstances = (newMax) => {
        let isBigger = false;
        this.instanceTargets = [];
        if(this.maxInstances < newMax) {
          isBigger = true;
        }
        this.maxInstances = newMax;
        for(let x = 0;x < this.maxInstances;x++) {
          this.instanceTargets.push({
            index: x,
            position: [0, 0, 0],
            currentPosition: [0, 0, 0],
            scale: [1, 1, 1],
            currentScale: [1, 1, 1],
            color: [0.6, 0.8, 1.0, 0.4],
            currentColor: [0.6, 0.8, 1.0, 0.4],
          });
        }
        if(isBigger == false) {
          console.log('new max values is smaller than current - auto correct updateInstances(newMax)')
          this.updateInstances(newMax);
        }
      }
      // end of instanced

      this.modelUniformBuffer = this.device.createBuffer({
        size: 4 * 16, // 4x4 matrix
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
      });


      this.uniformBufferBindGroupLayout = this.device.createBindGroupLayout({
        label: 'uniformBufferBindGroupLayout in mesh [regular]',
        entries: [
          {binding: 0, visibility: GPUShaderStage.VERTEX, buffer: {type: 'uniform'}},
          {binding: 1, visibility: GPUShaderStage.VERTEX, buffer: {type: 'uniform'}},
          {binding: 2, visibility: GPUShaderStage.VERTEX, buffer: {type: 'uniform'}}
        ],
      });

      // dummy for non skin mesh like this class
      function alignTo256(n) {
        return Math.ceil(n / 256) * 256;
      }
      this.MAX_BONES = MEConfig.MAX_BONES;
      // your total instance count
      const TRAIL_INSTANCES = 10;
      const BYTES_PER_INSTANCE = alignTo256(64 * this.MAX_BONES);
      this.bonesBuffer = device.createBuffer({
        label: "bonesBuffer",
        size: BYTES_PER_INSTANCE * TRAIL_INSTANCES,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
      });

      const bones = new Float32Array(this.MAX_BONES * 16 * TRAIL_INSTANCES);
      for(let i = 0;i < this.MAX_BONES * TRAIL_INSTANCES;i++) {
        bones.set([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1], i * 16);
      }
      this.device.queue.writeBuffer(this.bonesBuffer, 0, bones);
      // vertex Anim
      this.vertexAnimParams = new Float32Array([
        0.0, 0.0, 0.0, 0.0, 2.0, 0.1, 2.0, 0.0, 1.5, 0.3, 2.0, 0.5, 1.0, 0.1, 0.0, 0.0, 1.0, 0.5, 0.0, 0.0, 1.0, 0.05, 0.5, 0.0, 1.0, 0.05, 2.0, 0.0, 1.0, 0.1, 0.0, 0.0,
      ]);

      this.vertexAnimBuffer = this.device.createBuffer({
        label: "Vertex AnimationParams",
        size: Math.ceil(this.vertexAnimParams.byteLength / 256) * 256,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
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

      this.updateTime = (time) => {
        this.time += time * this.deltaTimeAdapter;
        this.vertexAnimParams[0] = time;
        this.device.queue.writeBuffer(this.vertexAnimBuffer, 0, this.vertexAnimParams);
      }

      this.uvScaleBuffer = this.device.createBuffer({
        size: 8,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
      });
      // Default = no scale
      this.device.queue.writeBuffer(this.uvScaleBuffer, 0, new Float32Array([1.0, 1.0]));

      this.modelBindGroup = this.device.createBindGroup({
        label: 'modelBindGroup[instanced]',
        layout: this.uniformBufferBindGroupLayoutInstanced,
        entries: [
          {binding: 0, resource: {buffer: this.instanceBuffer, }},
          {binding: 1, resource: {buffer: this.bonesBuffer}},
          {binding: 2, resource: {buffer: this.vertexAnimBuffer}},
          {binding: 3, resource: {buffer: this.uvScaleBuffer}}
        ],
      });

      this.mainPassBindGroupLayout = this.device.createBindGroupLayout({
        label: 'mainPassBindGroupLayout mesh [instaced]',
        entries: [
          {binding: 0, visibility: GPUShaderStage.FRAGMENT, texture: {sampleType: 'depth'}},
          {binding: 1, visibility: GPUShaderStage.FRAGMENT, sampler: {type: 'comparison'}},
        ],
      });

      this.effects = {};
      if(this.pointerEffect && this.pointerEffect.enabled === true) {
        let pf = navigator.gpu.getPreferredCanvasFormat();
        pf = 'rgba16float';
        if(typeof this.pointerEffect.pointer !== 'undefined' && this.pointerEffect.pointer == true) {
          this.effects.pointer = new PointerEffect(device, pf, this, true);
        }
        if(typeof this.pointerEffect.ballEffect !== 'undefined' && this.pointerEffect.ballEffect == true) {
          this.effects.ballEffect = new GenGeo(device, pf, 'sphere');
        }
        if(typeof this.pointerEffect.energyBar !== 'undefined' && this.pointerEffect.energyBar == true) {
          this.effects.energyBar = new HPBarEffect(device, pf);
          this.effects.manaBar = new MANABarEffect(device, pf);
        }
        if(typeof this.pointerEffect.flameEffect !== 'undefined' && this.pointerEffect.flameEffect == true) {
          this.effects.flameEffect = new FlameEffect(device, pf);
        }
        if(typeof this.pointerEffect.pointEffect !== 'undefined' && this.pointerEffect.pointEffect == true) {
          this.effects.pointEffect = new PointEffect(device, pf);
        }
        if(typeof this.pointerEffect.flameEmitter !== 'undefined' && this.pointerEffect.flameEmitter == true) {
          this.effects.flameEmitter = new FlameEmitter(device, pf);
        }
        if(typeof this.pointerEffect.circlePlane !== 'undefined' && this.pointerEffect.circlePlane == true) {
          this.effects.circlePlane = new GenGeo(device, pf, 'circlePlane');
        }
        if(typeof this.pointerEffect.circlePlaneTex !== 'undefined' && this.pointerEffect.circlePlaneTex == true) {
          this.effects.circlePlaneTex = new GenGeoTexture(device, pf, 'ring', this.pointerEffect.circlePlaneTexPath);
        }
        if(typeof this.pointerEffect.circle !== 'undefined' && this.pointerEffect.circlePlaneTexPath !== 'undefined') {
          this.effects.circle = new GenGeoTexture2(device, pf, 'circle2', this.pointerEffect.circlePlaneTexPath);
        }
      }

      this.getModelMatrix = (pos, useScale = false) => {
        let modelMatrix = mat4.identity(this._modelMatrix);
        this._translateVec[0] = pos.x;
        this._translateVec[1] = pos.y;
        this._translateVec[2] = pos.z;
        mat4.translate(modelMatrix, this._translateVec, modelMatrix);
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
        if(useScale == true) {
          this._scaleVec[0] = this.scale[0];
          this._scaleVec[1] = this.scale[1];
          this._scaleVec[2] = this.scale[2];
          mat4.scale(modelMatrix, this._scaleVec, modelMatrix);
        }
        this.modelMatrix = modelMatrix;
        return modelMatrix;
      };

      this.getModelMatrix(this.position, this.useScale);

      this.done = true;
      if(this.texturesPaths.length > 1 && this.material.type == "mirror") {
        this.loadEnvMap(this.texturesPaths, true).then((envTexture) => {
          this.envMapParams.envTexture = envTexture;
          this.mirrorBindGroup = this.createMirrorIlluminateBindGroup(this.mirrorBindGroupLayout, this.envMapParams).bindGroup;
          try {this.setupPipeline()} catch(err) {console.log('Err[create pipeline]:', err)}
        });
      } else {
        try {this.setupPipeline()} catch(err) {console.log('Err[create pipeline]:', err)}
      }
    }).then(() => {
      if(typeof this.objAnim !== 'undefined' && this.objAnim !== null) {
        // console.log('updateMeshListBuffers...');
        this.updateMeshListBuffers();
      }
    })
  }

  setUVScale(x, y = x) {
    this.device.queue.writeBuffer(this.uvScaleBuffer, 0, new Float32Array([x, y]));
  }

  setupPipeline = () => {
    const pm = PipelineManager.get();
    const isMirror = this.material.type === 'mirror';
    const isWater = this.material.type === 'water';
    const isVideo = this.isVideo === true;
    const vertexCode = vertexWGSLInstanced;
    const fragmentCode = isVideo ? fragmentVideoWGSL : this.getMaterial();
    const isNormalMap = this.material.type === 'normalmap';
    console.log('>>>>>>>>>>>>>INSTANCED >>>>>>>>>>>>')

    const baseKey = {
      vertexId: isNormalMap ? 'mesh_nm' : 'mesh_basic',
      fragmentId: isVideo ? 'video' : this.material.type,
      type: "instanced",
      topology: this.primitive.topology,
      cullMode: this.primitive.cullMode,
      frontFace: this.primitive.frontFace,
      format: 'rgba16float',
      mirror: isMirror ? 1 : 0,
      normalMap: isNormalMap ? 1 : 0,
      isWater: isWater ? 1 : 0
    };

    let MKEY = structuredClone(baseKey);
    MKEY.texturesPaths = this.texturesPaths.join();
    this.material.pipelineKey = baseKey;
    this.material.matKey = MKEY;
    // console.log("MKEY:", MKEY);
    this.createBindGroupForRender(MKEY);

    const layout = this.device.createPipelineLayout({
      label: 'PipelineLayout Instanced Mesh',
      bindGroupLayouts: [
        this.sceneBGL,
        isVideo ? this.materialVideoBGL : this.materialBGL,
        this.uniformBufferBindGroupLayoutInstanced,
        (isMirror ? this.mirrorBindGroupLayout : isWater ? this.waterBindGroupLayout : null),
      ],
    });
    const vertexState = {
      entryPoint: 'main',
      module: this.device.createShaderModule({code: vertexCode}),
      buffers: this.vertexBuffers,
    };
    const fragmentConstants = {shadowDepthTextureSize: this.shadowDepthTextureSize};

    // OPAQUE
    this.pipeline = pm.getPipeline({
      key: buildPipelineKey({
        ...baseKey,
        transparent: false,
        depthWrite: true,
      }),
      pipeline: {
        label: 'Instanced Pipeline Opaque Cached',
        layout,
        vertex: vertexState,
        fragment: {
          entryPoint: 'main',
          module: this.device.createShaderModule({code: fragmentCode}),
          constants: fragmentConstants,
          targets: [
            {
              format: 'rgba16float',
            },
          ],
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
        label: 'Instanced Pipeline Transparent Cached',
        layout,
        vertex: vertexState,
        fragment: {
          entryPoint: 'main',
          module: this.device.createShaderModule({code: fragmentCode}),
          constants: fragmentConstants,
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
        },
        depthStencil: {
          depthWriteEnabled: false,
          depthCompare: 'less',
          format: 'depth24plus',
        },
        primitive: this.primitive,
      }
    });
    dispatchEvent(this.buildPipelineBucketsEvent);
  };

  updateModelUniformBuffer = () => {}

  createGPUBuffer(dataArray, usage) {
    if(!dataArray || typeof dataArray.length !== 'number') {throw new Error('Invalid array passed to createGPUBuffer')}
    const size = dataArray.length * dataArray.BYTES_PER_ELEMENT;
    if(!Number.isFinite(size) || size <= 0) {throw new Error(`Invalid buffer size: ${size}`)}
    const buffer = this.device.createBuffer({size, usage, mappedAtCreation: true});
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

  drawElements = (pass) => {
    // IN
    pass.setVertexBuffer(0, this.vertexBuffer);
    pass.setVertexBuffer(1, this.vertexNormalsBuffer);
    pass.setVertexBuffer(2, this.vertexTexCoordsBuffer);
    pass.setVertexBuffer(3, this.mesh.jointsBuffer);
    pass.setVertexBuffer(4, this.mesh.weightsBuffer);
    if(this.mesh.tangentsBuffer) pass.setVertexBuffer(5, this.mesh.tangentsBuffer);
    pass.setIndexBuffer(this.indexBuffer, 'uint16');
    // instanceCount covers all instances including index 0
    pass.drawIndexed(this.indexCount, this.instanceCount, 0, 0, 0);
  }

  drawVideoElements = (pass) => {
    this.updateVideoTexture();
    pass.setVertexBuffer(0, this.vertexBuffer);
    pass.setVertexBuffer(1, this.vertexNormalsBuffer);
    pass.setVertexBuffer(2, this.vertexTexCoordsBuffer);
    pass.setVertexBuffer(3, this.mesh.jointsBuffer);
    pass.setVertexBuffer(4, this.mesh.weightsBuffer);
    if(this.mesh.tangentsBuffer) pass.setVertexBuffer(5, this.mesh.tangentsBuffer);
    pass.setIndexBuffer(this.indexBuffer, 'uint16');
    for(var ins = 1;ins < this.instanceCount;ins++) {
      if(ins == 0) pass.drawIndexed(this.indexCount, 0, 0, 0, ins);
      else pass.drawIndexed(this.indexCount, 1, 0, 0, ins);
    }
  }

  drawElementsAnim = (renderPass, lightContainer) => {
    if(!this.sceneBindGroupForRender || !this.modelBindGroup) {console.log(' NULL 1'); return;}
    if(!this.objAnim.meshList[this.objAnim.id + this.objAnim.currentAni]) {console.log(' NULL 2'); return;}

    const mesh = this.objAnim.meshList[this.objAnim.id + this.objAnim.currentAni];
    renderPass.setVertexBuffer(0, mesh.vertexBuffer);
    renderPass.setVertexBuffer(1, mesh.vertexNormalsBuffer);
    renderPass.setVertexBuffer(2, mesh.vertexTexCoordsBuffer);
    renderPass.setVertexBuffer(3, this.mesh.jointsBuffer);
    renderPass.setVertexBuffer(4, this.mesh.weightsBuffer);
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

    shadowPass.setVertexBuffer(3, this.mesh.jointsBuffer);
    shadowPass.setVertexBuffer(4, this.mesh.weightsBuffer);

    shadowPass.setIndexBuffer(this.indexBuffer, 'uint16');
    if(this instanceof BVHPlayerInstances) {
      shadowPass.drawIndexed(this.indexCount, this.instanceCount, 0, 0, 0);
    } else {
      shadowPass.drawIndexed(this.indexCount);
    }
  }
}