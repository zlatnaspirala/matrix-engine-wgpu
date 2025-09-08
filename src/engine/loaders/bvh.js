import MEBvh from "bvh-loader";

console.log('Test BVH loader', MEBvh);

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
        console.log("->" + KEYS[x] + "-> position: " + r[0][x] + " rotation: " + r[1][x]);
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
export function applyBVHToGLB(glb, bvhBones, device) {
  // Iterate all GLB nodes that have a skin
  for(const node of glb.nodes) {
    if(node.mesh && node.skin !== undefined) {
      const skin = glb.skins[node.skin]; // e.g., index 0

      // Iterate all joints in the skin
      for(let i = 0;i < skin.joints.length;i++) {
        const jointIndex = skin.joints[i];
        const boneNode = glb.nodes[jointIndex];
        const bvhBone = bvhBones[boneNode.name];

        if(bvhBone) {
          // Apply BVH transform to GLB node
          // Choose worldMatrix or localMatrix depending on your shader setup
          boneNode.transform = bvhBone.worldMatrix;
          boneNode.upload(device); // update uniform buffer
        }
      }
    }
  }
}

export class BVHPlayer {
  constructor(bvh, glb) {
    this.bvh = bvh;
    this.glb = glb;
    this.currentFrame = 0;
    this.fps = bvh.fps || 30;
    this.timeAccumulator = 0;
  }

  update(deltaTime, device) {
    // Accumulate time
    this.timeAccumulator += deltaTime;

    // How many frames to advance
    const frameTime = 1 / this.fps;
    while(this.timeAccumulator >= frameTime) {
      this.currentFrame = (this.currentFrame + 1) % this.bvh.keyframes.length;
      this.timeAccumulator -= frameTime;
    }

    // Apply current frame to GLB
    this.applyFrame(this.currentFrame, device);
  }

  applyFrame(frameIndex, device) {
    const keyframe = this.bvh.keyframes[frameIndex];
    // keyframe[i] corresponds to joint i
    for(const nodeName in this.glb.bvhToGLBMap) {
      const glbNode = this.glb.bvhToGLBMap[nodeName];
      const bvhJoint = this.bvh.joints[nodeName];
      if(!glbNode || !bvhJoint) continue;

      // Convert BVH rotation & position to a matrix
      glbNode.transform = bvhJoint.matrixFromKeyframe(keyframe);
      glbNode.upload(device);
    }
  }
}


