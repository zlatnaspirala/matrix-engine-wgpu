import MEBvh from "bvh-loader";
import MEMeshObj from "../mesh-obj";

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
    // Advance time and frame
    this.timeAccumulator += deltaTime;
    const frameTime = 1 / this.fps;
    while(this.timeAccumulator >= frameTime) {
      this.currentFrame = (this.currentFrame + 1) % this.bvh.keyframes.length;
      this.timeAccumulator -= frameTime;
    }

    // Apply BVH frame to GLB
    this.applyBVHToGLB(this.currentFrame);
  }

  applyBVHToGLB(frameIndex) {
    const keyframe = this.bvh.keyframes[frameIndex];
    const numBones =this.glb.skins[this.skinnedNode.skin].joints.length;
    // const numBones = this.skinnedNode.mesh.skin.joints.length;
    const bonesData = new Float32Array(16 * numBones); // flat mat4 array

    for(const jointName in this.bvh.jointIndices) {
      const boneIndex = this.bvh.jointIndices[jointName];
      const bvhJoint = this.bvh.joints[jointName];
      if(!bvhJoint) continue;

      // Convert BVH joint keyframe to mat4
      const mat = bvhJoint.matrixFromKeyframe(keyframe);
      bonesData.set(mat, boneIndex * 16);
    }

    // Upload to GPU
    this.device.queue.writeBuffer(this.bonesBuffer, 0, bonesData);
  }
}

