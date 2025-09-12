import MEBvh from "bvh-loader";
import MEMeshObj from "../mesh-obj";
import {mat4} from "wgpu-matrix";
import {degToRad} from "../utils.js";
import {GLTFBuffer} from "./webgpu-gltf.js";

export var animBVH = new MEBvh();

export let loadBVH = (path) => {
  return new Promise((resolve, reject) => {
    animBVH.parse_file(path).then(() => {
      console.info("plot_hierarchy no function")
      animBVH.plot_hierarchy();
      var r = animBVH.frame_pose(0);
      console.log("FINAL P => ", r[0].length)
      console.log("FINAL R => ", r[1].length)

      var KEYS = animBVH.joint_names();
      for(var x = 0;x < r[0].length;x++) {
        // console.log("->" + KEYS[x] + "-> position: " + r[0][x] + " rotation: " + r[1][x]);
      }

      var all = animBVH.all_frame_poses();
      console.log("Final All -> ", all);
      resolve(animBVH);

    }).catch((err) => {reject(err)});
  })

}

/**
 * Applies BVH animation to a GLB model with skinning
 * @param {GLBModel} glb - Your loaded GLB
 * @param {Object} bvhBones - Mapping of boneName → BVH bone data
 * @param {GPUDevice} device - WebGPU device
 */
export class BVHPlayer extends MEMeshObj {
  constructor(o, bvh, glb, primitiveIndex, skinnedNodeIndex, canvas, device, context, inputHandler, globalAmbient) {
    super(canvas, device, context, o, inputHandler, globalAmbient, glb, primitiveIndex, skinnedNodeIndex);

    this.bvh = bvh;
    this.glb = glb;
    this.currentFrame = 0;
    this.fps = bvh.fps || 30;
    this.timeAccumulator = 0;

    this.primitiveIndex = primitiveIndex;

    if(!bvh.sharedState) {
      bvh.sharedState = {currentFrame: 0, timeAccumulator: 0};
    }
    this.sharedState = bvh.sharedState;

    // Reference to the skinned node containing all bones
    this.skinnedNode = this.glb.skinnedMeshNodes[skinnedNodeIndex];

    console.log('this.skinnedNode', this.skinnedNode)
    // Prepare joint index map (BVH joint name -> bone index)
    // this.setupBVHJointIndices();

    this.nodeWorldMatrices = Array.from(
      {length: this.glb.nodes.length},
      () => mat4.identity()
    );

    // Optionally store inverseBindMatrices if needed
    this.initInverseBindMatrices();

    this.computeNodeWorldMatrices();

  }

  initInverseBindMatrices(skinIndex = 0) {
    const skin = this.glb.skins[skinIndex];
    const invBindAccessorIndex = skin.inverseBindMatrices; // usually a number
    if(invBindAccessorIndex === undefined || invBindAccessorIndex === null) {
      console.warn('No inverseBindMatrices accessor for skin', skinIndex);
      return;
    }

    const invBindArray = this.getAccessorArray(this.glb, invBindAccessorIndex);

    this.inverseBindMatrices = [];
    const numBones = skin.joints.length;

    for(let i = 0;i < numBones;i++) {
      const mat = mat4.create();
      // Copy 16 floats from invBindArray
      for(let j = 0;j < 16;j++) {
        mat[j] = invBindArray[i * 16 + j];
      }
      this.inverseBindMatrices.push(mat);
    }

    console.log('Inverse bind matrices loaded:', this.inverseBindMatrices.length, 'bones');
  }

  setupBVHJointIndices() {
    this.bvh.jointIndices = {};

    const skin = this.glb.skins[this.skinnedNode.skin]; // get skin for this node
    const bones = skin.joints; // indices of joints in GLB

    const jointNames = Object.keys(this.bvh.joints);

    jointNames.forEach((name, i) => {
      if(i < bones.length) {
        this.bvh.jointIndices[name] = i;
      }
    });

  }



  update(deltaTime) {
    const frameTime = 1 / this.fps;
    this.sharedState.timeAccumulator += deltaTime;

    while(this.sharedState.timeAccumulator >= frameTime) {
      this.sharedState.currentFrame = (this.sharedState.currentFrame + 1) % this.bvh.keyframes.length;
      this.sharedState.timeAccumulator -= frameTime;
    }

    const frame = this.sharedState.currentFrame;
    // console.log('frame : ', frame)
    // this.applyBVHToGLB(frame);
    this.updateBonesFromGLTF_wgpuMatrix();


  }

  applyBVHToGLB(frameIndex) {
    const keyframe = this.bvh.keyframes[frameIndex]; // flat array
    const skin = this.glb.skins[this.skinnedNode.skin];
    const numBones = skin.joints.length;
    const bonesData = new Float32Array(16 * numBones); // final matrices per bone

    const scale = 0.01; // adjust if mesh too small/large
    let offsetInFrame = 0;

    const traverseJoint = (joint, parentMat) => {
      const t = [0, 0, 0];
      const r = [0, 0, 0];

      // Extract channels from BVH keyframe
      for(const channel of joint.channels) {
        const value = keyframe[offsetInFrame++];
        if(channel === 'Xposition') t[0] = value;
        else if(channel === 'Yposition') t[1] = value;
        else if(channel === 'Zposition') t[2] = value;
        else if(channel === 'Xrotation') r[0] = value;
        else if(channel === 'Yrotation') r[1] = value;
        else if(channel === 'Zrotation') r[2] = value;
      }

      // Local translation (apply before rotation)
      const translation = [
        (t[0] + joint.offset[0]) * scale,
        (t[1] + joint.offset[1]) * scale,
        (t[2] + joint.offset[2]) * scale
      ];

      // Build local matrix
      let localMat = mat4.identity();
      mat4.translate(localMat, translation, localMat); // translation first
      mat4.rotateX(localMat, degToRad(r[0]), localMat);
      mat4.rotateY(localMat, degToRad(r[1]), localMat);
      mat4.rotateZ(localMat, degToRad(r[2]), localMat);

      // Combine with parent matrix
      const finalMat = mat4.create();
      mat4.identity(finalMat); // must initialize to identity!
      mat4.multiply(parentMat, localMat, finalMat); // ✅ correct

      // Apply inverse bind matrix if exists
      const boneIndex = this.bvh.jointIndices[joint.name];
      if(boneIndex !== undefined) {
        const invBind = this.inverseBindMatrices[boneIndex]; // Float32Array[16]
        if(invBind) {
          const finalBoneMat = mat4.create();
          mat4.multiply(finalBoneMat, finalMat, invBind); // finalBoneMat = finalMat * invBind
          bonesData.set(finalBoneMat, boneIndex * 16);
        } else {
          bonesData.set(finalMat, boneIndex * 16); // fallback if invBind missing
        }
      }

      // Recurse children
      for(const child of joint.children) {
        traverseJoint(child, finalMat);
      }

      // Upload to GPU
      this.device.queue.writeBuffer(this.bonesBuffer, 0, bonesData);

    };

    // Start recursion from BVH root
    traverseJoint(this.bvh.root, mat4.identity());


  }

  updateBonesFromGLTF_wgpuMatrix() {
    const skin = this.glb.skins[this.skinnedNode.skin];
    const numBones = skin.joints.length;
    const bonesData = new Float32Array(16 * numBones);

    // Ensure world matrices storage exists
    if(!this.nodeWorldMatrices) this.nodeWorldMatrices = [];

    for(let i = 0;i < numBones;i++) {
      const nodeIndex = skin.joints[i];
      const node = this.glb.nodes[nodeIndex];

      // 1️⃣ Local matrix (from transform or TRS)
      let localMat = mat4.identity();
      if(node.transform) {
        // node.transform is already 16 elements
        mat4.copy(node.transform, localMat);
      } else {
        mat4.identity(localMat);
        if(node.translation) mat4.translate(localMat, node.translation, localMat);
        if(node.rotation) {
          const rotMat = quat.toMat4(node.rotation);
          mat4.multiply(localMat, rotMat, localMat);
        }
        if(node.scale) mat4.scale(localMat, node.scale, localMat);
      }

      // 2️⃣ World matrix
      let worldMat = mat4.identity();
      if(node.parent !== undefined) {
        const parentWorld = this.nodeWorldMatrices[node.parent];
        mat4.multiply(parentWorld, localMat, worldMat);
      } else {
        mat4.copy(localMat, worldMat);
      }

      this.nodeWorldMatrices[nodeIndex] = worldMat;

      // 3️⃣ Apply inverse bind matrix
      const invBindMat = this.inverseBindMatrices[i]; // Float32Array[16]
      let finalBoneMat = mat4.identity();
      if(invBindMat) {
        // mat4.multiply(worldMat, invBindMat, finalBoneMat);
        mat4.multiply(invBindMat, worldMat, finalBoneMat);
      } else {
        mat4.copy(worldMat, finalBoneMat);
      }

      // 4️⃣ Store into GPU buffer array
      bonesData.set(finalBoneMat, i * 16);
    }

    // 5️⃣ Upload to GPU
    this.device.queue.writeBuffer(this.bonesBuffer, 0, bonesData);
  }

  computeNodeWorldMatrices() {
    // pre-allocate world matrices array if not done
    if(!this.nodeWorldMatrices) {
      this.nodeWorldMatrices = new Array(this.glb.nodes.length);
    }

    for(let i = 0;i < this.glb.nodes.length;i++) {
      const node = this.glb.nodes[i];

      // Local matrix from node.transform (Float32Array[16])
      let localMat = mat4.identity(); // start with identity
      if(node.transform) {
        // Copy values into mat4
        localMat = mat4.create();
        for(let j = 0;j < 16;j++) {
          localMat[j] = node.transform[j];
        }
      }

      // World matrix: parent * local
      if(node.parent !== undefined) {
        const parentWorld = this.nodeWorldMatrices[node.parent];
        const worldMat = mat4.create();
        mat4.multiply(parentWorld, localMat, worldMat);
        this.nodeWorldMatrices[i] = worldMat;
      } else {
        // Root node
        this.nodeWorldMatrices[i] = localMat;
      }
    }
  }


  getAccessorArray(glb, accessorIndex) {
    const accessor = glb.glbJsonData.accessors[accessorIndex];
    const bufferView = glb.glbJsonData.bufferViews[accessor.bufferView];
    // const bufferDef = glb.glbJsonData.buffers[bufferView.buffer]; // usually buffers[0]

    // Compute offsets
    // const byteOffset = (bufferView.byteOffset || 0) + (accessor.byteOffset || 0);
    const numComponents = this.getNumComponents(accessor.type);
    const componentSize = this.getComponentSize(accessor.componentType);
    // const byteLength = accessor.count * numComponents * componentSize;
    const byteOffset = (bufferView.byteOffset || 0) + (accessor.byteOffset || 0);
    const byteLength =
      accessor.count *
      this.getNumComponents(accessor.type) *
      (accessor.componentType === 5126 ? 4 : 2); // adjust per type


    console.log(glb.glbJsonData); // to see the structure
    console.log(Object.keys(glb.glbJsonData)); // forced list of keys

    // Get the actual ArrayBuffer from GLB binary chunk
    // const bufferDef = this.glb.glbJsonData.buffers[0]; // usually just one buffer
    const bufferDef = this.glb.glbBinaryBuffer;
 

    // ✅ now just slice:
    const slice = this.getBufferSlice(bufferDef, byteOffset, byteLength);
    // const slice = arrayBuffer.slice(byteOffset, byteOffset + byteLength);

    switch(accessor.componentType) {
      case 5126: // FLOAT
        return new Float32Array(slice);
      case 5123: // UNSIGNED_SHORT
        return new Uint16Array(slice);
      case 5121: // UNSIGNED_BYTE
        return new Uint8Array(slice);
      default:
        throw new Error("Unsupported componentType: " + accessor.componentType);
    }
  }

  getNumComponents(type) {
    switch(type) {
      case "SCALAR": return 1;
      case "VEC2": return 2;
      case "VEC3": return 3;
      case "VEC4": return 4;
      case "MAT4": return 16;
      default: throw new Error("Unknown type: " + type);
    }
  }

  getComponentSize(componentType) {
    switch(componentType) {
      case 5126: return 4; // float32
      case 5123: return 2; // uint16
      case 5121: return 1; // uint8
      default: throw new Error("Unknown componentType: " + componentType);
    }
  }

  /**
 * Get a typed slice of the raw binary buffer from glTF buffer definitions.
 *
 * @param {Object} bufferDef - the glTF buffer definition (usually gltfJson.buffers[0])
 * @param {Number} byteOffset - byte offset into the buffer
 * @param {Number} byteLength - byte length to slice
 * @returns {ArrayBuffer} sliced array buffer
 */
  getBufferSlice(bufferDef, byteOffset, byteLength) {
    // GLTFBuffer instance:
    if(bufferDef instanceof GLTFBuffer) {
      // Use .arrayBuffer + .byteOffset:
      return bufferDef.arrayBuffer.slice(
        bufferDef.byteOffset + (byteOffset || 0),
        bufferDef.byteOffset + (byteOffset || 0) + byteLength
      );
    }

    // Already have a raw ArrayBuffer:
    if(bufferDef instanceof ArrayBuffer) {
      return bufferDef.slice(byteOffset, byteOffset + byteLength);
    }

    // Some loaders store it as .data or ._data:
    if(bufferDef && bufferDef.data instanceof ArrayBuffer) {
      return bufferDef.data.slice(byteOffset, byteOffset + byteLength);
    }
    if(bufferDef && bufferDef._data instanceof ArrayBuffer) {
      return bufferDef._data.slice(byteOffset, byteOffset + byteLength);
    }

    throw new Error("No binary data found in GLB buffer[0]");
  }

}

