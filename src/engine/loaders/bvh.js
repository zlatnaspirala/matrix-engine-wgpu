import MEBvh from "bvh-loader";
import MEMeshObj from "../mesh-obj";
import {mat4} from "wgpu-matrix";
import {degToRad} from "../utils.js";

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
    this.setupBVHJointIndices();
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

    // Optionally store inverseBindMatrices if needed
    this.inverseBindMatrices = skin.inverseBindMatrices;
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
    this.applyBVHToGLB(frame);


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

}

