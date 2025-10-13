import {mat4, vec3} from 'wgpu-matrix';
import {Position, Rotation} from "../matrix-class";
import {degToRad, genName, LOG_FUNNY_SMALL} from '../utils';
import {fragmentVideoWGSL} from '../../shaders/fragment.video.wgsl';
// import {vertexWGSL_NM} from '../../shaders/vertex.wgsl.normalmap';
import {PointerEffect} from '../effects/pointerEffect';
import MaterialsInstanced from './materials-instanced';
import {vertexWGSLInstanced} from '../../shaders/instanced/vertex.instanced.wgsl';
import {BVHPlayerInstances} from '../loaders/bvh-instaced';

export default class MEMeshObjInstances extends MaterialsInstanced {
  constructor(canvas, device, context, o, inputHandler, globalAmbient, _glbFile = null, primitiveIndex = null, skinnedNodeIndex = null) {
    super(device, o.material, _glbFile);
    if(typeof o.name === 'undefined') o.name = genName(3);
    if(typeof o.raycast === 'undefined') {
      this.raycast = {enabled: false, radius: 2};
    } else {
      this.raycast = o.raycast;
    }

    if(typeof o.pointerEffect === 'undefined') {
      this.pointerEffect = {enabled: false};
    } else {
      this.pointerEffect = {enabled: true};
    }

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
    // console.log('Material class arg:', o.material)
    this.material = o.material;

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
    } else {
      this.mesh.uvs = this.mesh.textures;
    }
    console.log(`%cMesh: ${o.name}`, LOG_FUNNY_SMALL);
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
          arrayStride: 4 * 4, // vec4<u32> = 4 * 4 bytes
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
      } else {
        // for non glb - non skinned use basic shaders
      }

      // Note: The frontFace and cullMode values have no effect on the 
      // "point-list", "line-list", or "line-strip" topologies.
      this.primitive = {
        topology: 'triangle-list',
        cullMode: 'back', // typical for shadow passes
        frontFace: 'ccw'
      }

      // Selected effect
      this.selectedBuffer = device.createBuffer({
        size: 4, // just one float
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
      });

      this.selectedBindGroupLayout = device.createBindGroupLayout({
        entries: [
          {binding: 0, visibility: GPUShaderStage.FRAGMENT, buffer: {}},
        ],
      });

      this.selectedBindGroup = device.createBindGroup({
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


      // EDIT INSTANCED PART

      this.instanceTargets = [];    // per-instance target transforms
      this.lerpSpeed = 0.05; // tweak for smoothness

      this.maxInstances = 5;
      this.instanceCount = 2;
      const floatsPerInstance = 16 + 4;


      for(let x = 0;x < this.maxInstances;x++) {
        this.instanceTargets.push({
          index: x,
          position: [0, 0, 0],
          currentPosition: [0, 0, 0],
          scale: [1, 1, 1],
          currentScale: [1, 1, 1],
          color: [0.6, 0.8, 1.0, 0.4],
        });
      }

      this.instanceData = new Float32Array(this.instanceCount * floatsPerInstance);
      this.instanceBuffer = device.createBuffer({
        size: this.instanceData.byteLength,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
      });


      this.updateInstanceData = (modelMatrix) => {
        // original (base instance)
        this.instanceData.set(modelMatrix, 0);
        this.instanceData.set([1, 1, 1, 1], 16);

        // instanced clones
        for(let i = 1;i < this.instanceCount;i++) {
          const t = this.instanceTargets[i];
          const ghost = new Float32Array(modelMatrix);

          // --- Smooth interpolate position
          for(let j = 0;j < 3;j++) {
            t.currentPosition[j] += (t.position[j] - t.currentPosition[j]) * this.lerpSpeed;
            t.currentScale[j] += (t.scale[j] - t.currentScale[j]) * this.lerpSpeed;
          }

          // Apply smoothed transforms
          ghost[0] *= t.currentScale[0];
          ghost[5] *= t.currentScale[1];
          ghost[10] *= t.currentScale[2];

          ghost[12] += t.currentPosition[0]; // X
          ghost[13] += t.currentPosition[1]; // Y
          ghost[14] += t.currentPosition[2]; // Z

          // Write instance matrix + color
          const offset = 20 * i;
          this.instanceData.set(ghost, offset);
          this.instanceData.set(t.color, offset + 16);
        }

        device.queue.writeBuffer(this.instanceBuffer, 0, this.instanceData);
      };

      //
      // end of instanced
      this.modelUniformBuffer = this.device.createBuffer({
        size: 4 * 16, // 4x4 matrix
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
      });

      this.sceneUniformBuffer = this.device.createBuffer({
        label: 'sceneUniformBuffer per mesh',
        size: 176,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
      });

      // test MUST BE IF
      this.uniformBufferBindGroupLayoutInstanced = this.device.createBindGroupLayout({
        label: 'uniformBufferBindGroupLayout in mesh [instanced]',
        entries: [
          {binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: {type: "read-only-storage"}},
          {binding: 1, visibility: GPUShaderStage.VERTEX, buffer: {type: 'uniform'}, },
        ],
      });

      this.uniformBufferBindGroupLayout = this.device.createBindGroupLayout({
        label: 'uniformBufferBindGroupLayout in mesh [regular]',
        entries: [
          {
            binding: 0,
            visibility: GPUShaderStage.VERTEX,
            buffer: {
              type: 'uniform',
            },
          },
          {
            binding: 1,
            visibility: GPUShaderStage.VERTEX,
            buffer: {
              type: 'uniform',
            },
          },
        ],
      });

      // dummy for non skin mesh like this class
      function alignTo256(n) {
        return Math.ceil(n / 256) * 256;
      }

      let MAX_BONES = 100;
      this.MAX_BONES = MAX_BONES;
      this.bonesBuffer = device.createBuffer({
        label: "bonesBuffer",
        size: alignTo256(64 * MAX_BONES),
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
      });

      const bones = new Float32Array(this.MAX_BONES * 16);
      for(let i = 0;i < this.MAX_BONES;i++) {
        // identity matrices
        bones.set([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1], i * 16);
      }
      this.device.queue.writeBuffer(this.bonesBuffer, 0, bones);

      this.modelBindGroup = this.device.createBindGroup({
        label: 'modelBindGroup in mesh',
        layout: this.uniformBufferBindGroupLayout,
        entries: [ //
          {binding: 0, resource: {buffer: this.modelUniformBuffer, }},
          {binding: 1, resource: {buffer: this.bonesBuffer}}
        ],
      });

      this.modelBindGroupInstanced = this.device.createBindGroup({
        label: 'modelBindGroup in mesh [instanced]',
        layout: this.uniformBufferBindGroupLayoutInstanced,
        entries: [ //
          {binding: 0, resource: {buffer: this.instanceBuffer, }},
          {binding: 1, resource: {buffer: this.bonesBuffer}}
        ],
      });

      this.mainPassBindGroupLayout = this.device.createBindGroupLayout({
        entries: [
          {binding: 0, visibility: GPUShaderStage.FRAGMENT, texture: {sampleType: 'depth'}},
          {binding: 1, visibility: GPUShaderStage.FRAGMENT, sampler: {type: 'comparison'}},
        ],
      });

      // pointerEffect bonus
      // TEST - OPTIONS ON BASE MESHOBJ LEVEL
      this.effects = {};
      if(this.pointerEffect.enabled === true) {
        let pf = navigator.gpu.getPreferredCanvasFormat();
        this.effects.pointer = new PointerEffect(device, pf, this, true);
      }
      // end

      // Rotates the camera around the origin based on time.
      this.getTransformationMatrix = (mainRenderBundle, spotLight, index) => {
        const now = Date.now();
        const dt = (now - this.lastFrameMS) / this.mainCameraParams.responseCoef;
        this.lastFrameMS = now;
        const camera = this.cameras[this.mainCameraParams.type];
        if(index == 0) camera.update(dt, inputHandler());
        const camVP = mat4.multiply(camera.projectionMatrix, camera.view);
        const sceneData = new Float32Array(44);
        // Light VP
        sceneData.set(spotLight.viewProjMatrix, 0);
        // Camera VP
        sceneData.set(camVP, 16);
        // Camera position + padding
        sceneData.set([camera.position.x, camera.position.y, camera.position.z, 0.0], 32);
        // Light position + padding
        sceneData.set([spotLight.position[0], spotLight.position[1], spotLight.position[2], 0.0], 36);
        sceneData.set([this.globalAmbient[0], this.globalAmbient[1], this.globalAmbient[2], 0.0], 40);
        device.queue.writeBuffer(
          this.sceneUniformBuffer,
          0,
          sceneData.buffer,
          sceneData.byteOffset,
          sceneData.byteLength
        );
      };

      this.getModelMatrix = (pos) => {
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
        // Apply scale if you have it, e.g.:
        // console.warn('what is csle comes from user level not glb ', this.scale)
        if(this.glb || this.objAnim) {
          mat4.scale(modelMatrix, [this.scale[0], this.scale[1], this.scale[2]], modelMatrix);
        }
        return modelMatrix;
      };

      // looks like affect on transformations for now const 0
      // const modelMatrix = mat4.translation([0, 0, 0]);
      // const modelData = modelMatrix;
      // this.device.queue.writeBuffer(
      //   this.modelUniformBuffer,
      //   0,
      //   modelData.buffer,
      //   modelData.byteOffset,
      //   modelData.byteLength
      // );
      this.done = true;
      try {
        this.setupPipeline();
      } catch(err) {console.log('err in create pipeline in init ', err)}
    }).then(() => {
      if(typeof this.objAnim !== 'undefined' && this.objAnim !== null) {
        console.log('after all updateMeshListBuffers...')
        this.updateMeshListBuffers();
      }
    })
  }

  setupPipeline = () => {
    this.createBindGroupForRender();
    this.pipeline = this.device.createRenderPipeline({
      label: 'Mesh Pipeline ✅',
      layout: this.device.createPipelineLayout({
        label: 'createPipelineLayout Mesh',
        bindGroupLayouts: [
          this.bglForRender,
          this.uniformBufferBindGroupLayoutInstanced,
          this.selectedBindGroupLayout],
      }),
      vertex: {
        entryPoint: 'main',
        module: this.device.createShaderModule({
          code: vertexWGSLInstanced,
        }),
        buffers: this.vertexBuffers,
      },
      fragment: {
        entryPoint: 'main',
        module: this.device.createShaderModule({
          code: (this.isVideo == true ? fragmentVideoWGSL : this.getMaterial()),
        }),
        targets: [
          {
            format: this.presentationFormat,
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
    console.log('✅Set Pipeline done');
  }

  updateModelUniformBuffer = () => {
    // if(this.done == false) return;
    // Per-object model matrix only
    // const modelMatrix = this.getModelMatrix(this.position);
    // this.device.queue.writeBuffer(
    //   this.modelUniformBuffer,
    //   0,
    //   modelMatrix.buffer,
    //   modelMatrix.byteOffset,
    //   modelMatrix.byteLength
    // );
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
    if(this.isVideo) {this.updateVideoTexture()}
    pass.setBindGroup(0, this.sceneBindGroupForRender);

    if(this instanceof BVHPlayerInstances) {
      pass.setBindGroup(1, this.modelBindGroupInstanced);
    } else {
      pass.setBindGroup(1, this.modelBindGroup);
    }

    // Bind each light’s shadow texture & sampler
    if(this.isVideo == false) {
      let bindIndex = 2;
      for(const light of lightContainer) {
        pass.setBindGroup(bindIndex++, light.getMainPassBindGroup(this));
      }
    }

    if(this.selectedBindGroup) {
      pass.setBindGroup(2, this.selectedBindGroup);
    }

    pass.setVertexBuffer(0, this.vertexBuffer);
    pass.setVertexBuffer(1, this.vertexNormalsBuffer);
    pass.setVertexBuffer(2, this.vertexTexCoordsBuffer);
    if(this.joints) {
      if(this.constructor.name === "BVHPlayer" || this.constructor.name === "BVHPlayerInstances") {
        pass.setVertexBuffer(3, this.mesh.jointsBuffer);  // real
        pass.setVertexBuffer(4, this.mesh.weightsBuffer); //real
      } else {
        pass.setVertexBuffer(3, this.joints.buffer);  // new dummy
        pass.setVertexBuffer(4, this.weights.buffer); // new dummy
      }
    }

    if(this.mesh.tangentsBuffer) {
      pass.setVertexBuffer(5, this.mesh.tangentsBuffer);
    }

    pass.setIndexBuffer(this.indexBuffer, 'uint16');
    pass.drawIndexed(this.indexCount, this.instanceCount, 0, 0, 0);
  }

  drawElementsAnim = (renderPass, lightContainer) => {
    if(!this.sceneBindGroupForRender || !this.modelBindGroup) {console.log(' NULL 1'); return;}
    if(!this.objAnim.meshList[this.objAnim.id + this.objAnim.currentAni]) {console.log(' NULL 2'); return;}

    renderPass.setBindGroup(0, this.sceneBindGroupForRender);
    renderPass.setBindGroup(1, this.modelBindGroup);
    const mesh = this.objAnim.meshList[this.objAnim.id + this.objAnim.currentAni];

    if(this.isVideo == false) {
      let bindIndex = 2; // start after UBO & model
      for(const light of lightContainer) {
        renderPass.setBindGroup(bindIndex++, light.getMainPassBindGroup(this));
      }
    }

    renderPass.setVertexBuffer(0, mesh.vertexBuffer);
    renderPass.setVertexBuffer(1, mesh.vertexNormalsBuffer);
    renderPass.setVertexBuffer(2, mesh.vertexTexCoordsBuffer);

    if(this.constructor.name === "BVHPlayer") {
      renderPass.setVertexBuffer(3, this.mesh.jointsBuffer); // real
      renderPass.setVertexBuffer(4, this.mesh.weightsBuffer);// real
    } else {
      // dummy
      renderPass.setVertexBuffer(3, this.joints.buffer);  // dummy
      renderPass.setVertexBuffer(4, this.weights.buffer); // dummy
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
    shadowPass.setIndexBuffer(this.indexBuffer, 'uint16');
    if(this instanceof BVHPlayerInstances) {
      shadowPass.drawIndexed(this.indexCount, this.instanceCount, 0, 0, 0);
    } else {
      shadowPass.drawIndexed(this.indexCount);
    }
  }
}