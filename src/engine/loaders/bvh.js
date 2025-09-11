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

    if(!bvh.sharedState) {
      bvh.sharedState = {currentFrame: 0, timeAccumulator: 0};
    }
    this.sharedState = bvh.sharedState;

    // Reference to the skinned node containing all bones
    this.skinnedNode = this.glb.skinnedMeshNodes[skinnedNodeIndex];

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
    const numBones = this.glb.skins[this.skinnedNode.skin].joints.length;
    const bonesData = new Float32Array(16 * numBones);

    const scale = 0.01;
    let offsetInFrame = 0;

    // Iterate joints in BVH order
    for(const jointName of this.bvh.jointOrder) { // you need jointOrder array
      const boneIndex = this.bvh.jointIndices[jointName];
      const bvhJoint = this.bvh.joints[jointName];
      if(!bvhJoint) continue;

      const t = [0, 0, 0];
      const r = [0, 0, 0];

      // Extract channels in order
      for(const channel of bvhJoint.channels) {
        const value = keyframe[offsetInFrame++];
        if(channel === 'Xposition') t[0] = value;
        else if(channel === 'Yposition') t[1] = value;
        else if(channel === 'Zposition') t[2] = value;
        else if(channel === 'Xrotation') r[0] = value;
        else if(channel === 'Yrotation') r[1] = value;
        else if(channel === 'Zrotation') r[2] = value;
      }

      // Translation + offset
      const translation = [
        (t[0] + bvhJoint.offset[0]) * scale,
        (t[1] + bvhJoint.offset[1]) * scale,
        (t[2] + bvhJoint.offset[2]) * scale
      ];

      // Build mat4
      const mat = mat4.identity();
      mat4.translate(mat, translation, mat);
      mat4.rotateX(mat, degToRad(r[0]), mat);
      mat4.rotateY(mat, degToRad(r[1]), mat);
      mat4.rotateZ(mat, degToRad(r[2]), mat);

      bonesData.set(mat, boneIndex * 16);
    }

    this.device.queue.writeBuffer(this.bonesBuffer, 0, bonesData);
  }
}

