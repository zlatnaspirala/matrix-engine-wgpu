// import MEBvh from "bvh-loader";
import {mat4, quat} from "wgpu-matrix";
import {GLTFBuffer} from "./webgpu-gltf.js";
import MEMeshObjInstances from "../instanced/mesh-obj-instances.js";
import {alignTo256} from "../utils.js";

// export var animBVH = new MEBvh();
// export let loadBVH = (path) => {
//   return new Promise((resolve, reject) => {
//     animBVH.parse_file(path).then(() => {
//       console.info("plot_hierarchy no function")
//       animBVH.plot_hierarchy();
//       var r = animBVH.frame_pose(0);
//       // Not in use at the moment next feature - change skeletal or indipended new class.
//       // console.log("FINAL P => ", r[0].length)
//       // console.log("FINAL R => ", r[1].length)
//       var KEYS = animBVH.joint_names();
//       for(var x = 0;x < r[0].length;x++) {
//         // console.log("->" + KEYS[x] + "-> position: " + r[0][x] + " rotation: " + r[1][x]);
//       }
//       var all = animBVH.all_frame_poses();
//       // console.log("Final All -> ", all);
//       resolve(animBVH);
//     }).catch((err) => {reject(err)});
//   })
// }

/**
 * @description
 * Skinning basic done animation can be changed with animation index.
 * Holder for GLB model with skinning.
 * @param {GLBModel} glb - Your loaded GLB
 * @param {Object} bvhBones - Mapping of boneName → BVH bone data
 * @param {GPUDevice} device - WebGPU device
 * @credits Chatgpt assist here.
 */
export class BVHPlayerInstances extends MEMeshObjInstances {
  constructor(o, bvh, glb, primitiveIndex, skinnedNodeIndex, canvas, device, context, inputHandler, globalAmbient) {
    super(canvas, device, context, o, inputHandler, globalAmbient, glb, primitiveIndex, skinnedNodeIndex);
    // bvh arg not actual at the moment
    this.bvh = {};
    this.glb = glb;
    this.currentFrame = 0;
    this.fps = 30;
    this.timeAccumulator = 0;
    this.trailAnimation = {
      enabled: false,
      delay: 100
    };
    // debug
    this.scaleBoneTest = 1;
    this.primitiveIndex = primitiveIndex;
    if(!this.bvh.sharedState) {
      this.bvh.sharedState = {
        emitAnimationEvent: false,
        animationStarted: false,
        currentFrame: 0,
        timeAccumulator: 0,
        animationFinished: false
      };
    }

    this.MAX_BONES = 100; // predefined
    //cache
    this._boneMatrices = new Float32Array(this.MAX_BONES * 16);
    this._nodeChannels = new Map();
    this.sharedState = this.bvh.sharedState;
    this.animationIndex = this.glb.animationIndex;
    this.nodes = this.glb.nodes.map(n => ({
      ...n,
      translation: n.translation ? n.translation.slice() : new Float32Array([0, 0, 0]),
      rotation: n.rotation ? n.rotation.slice() : new Float32Array([0, 0, 0, 1]),
      scale: n.scale ? n.scale.slice() : new Float32Array([1, 1, 1]),
      transform: n.transform ? n.transform.slice() : mat4.identity(),
      worldMatrix: mat4.create()
    }));
    this._composeMat = mat4.create();
    // Reference to the skinned node containing all bones
    this.skinnedNode = this.glb.skinnedMeshNodes[skinnedNodeIndex];
    this.startTime = performance.now() / 1000; // seconds - anim speed control
    this.skeleton = []; // array of joint node indices
    this.animationSpeed = 1000;
    this.inverseBindMatrices = []; // Float32Array for each joint
    this.initInverseBindMatrices();
    this.makeSkeletal();
    this._numFrames = this.getNumberOfFramesCurAni();
    this._finalMat = new Float32Array(this.MAX_BONES * 16);
    this._tempMat = mat4.create();
    this.buildNodeChannelMap();
  }

  buildNodeChannelMap() {
  this._nodeChannels.clear();

  const anim = this.glb.glbJsonData.animations[this.animationIndex];

  for (const channel of anim.channels) {
    if (!this._nodeChannels.has(channel.target.node)) {
      this._nodeChannels.set(channel.target.node, []);
    }
    this._nodeChannels.get(channel.target.node).push(channel);
  }
}

  makeSkeletal() {
    let skin = this.glb.skins[0];
    const accessorIndex = skin.inverseBindMatrices;
    if(accessorIndex == null) {
      console.warn("No inverseBindMatrices, using identity matrices");
    }
    // 1. Load all inverse bind matrices once
    const invBindArray = this.inverseBindMatrices; // set earlier by initInverseBindMatrices()
    // 2. Build skeleton array from skin.joints only
    this.skeleton = skin.joints.slice(); // direct copy of indices
    // 3. Assign inverseBindMatrix to each joint node correctly
    for(let i = 0;i < skin.joints.length;i++) {
      const jointIndex = skin.joints[i];
      const jointNode = this.nodes[jointIndex];
      // assign only to bone nodes
      jointNode.inverseBindMatrix = invBindArray.slice(i * 16, (i + 1) * 16);
      // decompose node’s transform once (if not already)
      if(!jointNode.transform) {
        jointNode.transform = new Float32Array([
          1, 0, 0, 0,
          0, 1, 0, 0,
          0, 0, 1, 0,
          0, 0, 0, 1
        ]);
      }
      if(!jointNode.translation || !jointNode.rotation || !jointNode.scale) {
        const {translation, rotation, scale} = this.decomposeMatrix(jointNode.transform);
        jointNode.translation = translation;
        jointNode.rotation = rotation;
        jointNode.scale = scale;
      }
    }
    // 4. For mesh nodes or armature parent nodes, leave them alone
    // what is animation , check is it more - we look for Armature by defoult 
    // friendly blender
    this.animationIndex = 0;
    for(let j = 0;j < this.glb.glbJsonData.animations.length;j++) {
      if(this.glb.glbJsonData.animations[j].name.indexOf('Armature') !== -1) {
        this.animationIndex = j;
      }
    }
  }

  initInverseBindMatrices(skinIndex = 0) {
    const skin = this.glb.skins[skinIndex];
    const invBindAccessorIndex = skin.inverseBindMatrices; // number
    if(invBindAccessorIndex === undefined || invBindAccessorIndex === null) {
      console.warn('No inverseBindMatrices accessor for skin', skinIndex);
      return;
    }
    const invBindArray = this.getAccessorArray(this.glb, invBindAccessorIndex);
    this.inverseBindMatrices = invBindArray;
  }

  getNumberOfFramesCurAni() {
    const anim = this.glb.glbJsonData.animations[this.animationIndex];
    let maxFrames = 0;
    if(typeof anim == 'undefined') {
      console.log('[anim undefined]', this.name)
      return 1;
    }
    for(const sampler of anim.samplers) {
      const inputAccessor = this.glb.glbJsonData.accessors[sampler.input];
      if(inputAccessor.count > maxFrames) maxFrames = inputAccessor.count;
    }
    return maxFrames;
  }

  getAnimationLength(animation) {
    let maxTime = 0;
    for(const channel of animation.channels) {
      const sampler = animation.samplers[channel.sampler];
      const inputTimes = this.getAccessorArray(this.glb, sampler.input);
      const lastTime = inputTimes[inputTimes.length - 1];
      if(lastTime > maxTime) maxTime = lastTime;
    }
    return maxTime;
  }

  playAnimationByIndex = (animationIndex) => {
    this.animationIndex = animationIndex;
    this.buildNodeChannelMap();
  }

  playAnimationByName = (animationName) => {
    const animations = this.glb.glbJsonData.animations;
    const index = animations.findIndex(
      anim => anim.name === animationName
    );
    if(index === -1) {
      console.warn(`Animation '${animationName}' not found`);
      return;
    }
    this.animationIndex = index;
    this.buildNodeChannelMap();
  };

  update(deltaTime) {
    const frameTime = 1 / this.fps;
    this.sharedState.timeAccumulator += deltaTime;
    while(this.sharedState.timeAccumulator >= frameTime) {
      this.sharedState.currentFrame = (this.sharedState.currentFrame + 1) % this._numFrames;
      this.sharedState.timeAccumulator -= frameTime;
    }
    var inTime = this.getAnimationLength(this.glb.glbJsonData.animations[this.animationIndex])
    if(this.sharedState.animationStarted == false && this.sharedState.emitAnimationEvent == true) {
      this.sharedState.animationStarted = true;
      setTimeout(() => {
        this.sharedState.animationStarted = false;
        if(this.animationIndex == null) this.animationIndex = 0;
        dispatchEvent(new CustomEvent(`animationEnd-${this.name}`, {
          detail: {
            animationName: this.glb.glbJsonData.animations[this.animationIndex].name
          }
        }))
      }, inTime * 1000)
    }
    if(this.glb.glbJsonData.animations && this.glb.glbJsonData.animations.length > 0) {
      if(this.trailAnimation.enabled == true) {
        for(let i = 0;i < this.instanceCount;i++) {
          const timeOffsetMs = i * this.trailAnimation.delay;
          const currentTime = (performance.now() - timeOffsetMs) / this.animationSpeed - this.startTime;
          this.updateSingleBoneCubeAnimation(
            this.glb.glbJsonData.animations[this.animationIndex],
            this.nodes,   // ← same nodes, no clone
            currentTime,      // ← only this changes per instance
            this._boneMatrices,
            i                 // ← writes to correct buffer slot
          );
        }
      } else {
        const currentTime = performance.now() / this.animationSpeed - this.startTime;
        this.updateSingleBoneCubeAnimation(this.glb.glbJsonData.animations[this.animationIndex], this.nodes, currentTime, this._boneMatrices, 0)
        this.updateSingleBoneCubeAnimation(this.glb.glbJsonData.animations[this.animationIndex], this.nodes, currentTime, this._boneMatrices, 1)
      }
    }
  }

  getAccessorArray(glb, accessorIndex) {
    if(!glb._accessorCache) glb._accessorCache = new Map();
    const cached = glb._accessorCache.get(accessorIndex);
    if(cached) return cached;

    const accessor = glb.glbJsonData.accessors[accessorIndex];
    const bufferView = glb.glbJsonData.bufferViews[accessor.bufferView];
    const byteOffset = (bufferView.byteOffset || 0) + (accessor.byteOffset || 0);
    const byteLength = accessor.count * this.getNumComponents(accessor.type) * (accessor.componentType === 5126 ? 4 : 2);
    const slice = this.getBufferSlice(glb.glbBinaryBuffer, byteOffset, byteLength);

    let result;
    switch(accessor.componentType) {
      case 5126: result = new Float32Array(slice); break;
      case 5123: result = new Uint16Array(slice); break;
      case 5121: result = new Uint8Array(slice); break;
      default: throw new Error("Unsupported componentType: " + accessor.componentType);
    }

    glb._accessorCache.set(accessorIndex, result);  // ← AFTER result is created
    return result;
  }

  getAccessorTypeForChannel(path) {
    switch(path) {
      case "translation": return "VEC3";
      case "rotation": return "VEC4";
      case "scale": return "VEC3";
      case "weights": return "VECN";
      default: throw new Error("Unknown channel path: " + path);
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
   *  @description
   *  Get a typed slice of the raw binary buffer from glTF buffer definitions.
   * @param {Object} bufferDef - the glTF buffer definition (usually gltfJson.buffers[0])
   * @param {Number} byteOffset - byte offset into the buffer
   * @param {Number} byteLength - byte length to slice
   * @returns {ArrayBuffer} sliced array buffer
   **/
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

  // --- helpers
  lerpVec(a, b, t) {
    return a.map((v, i) => v * (1 - t) + b[i] * t);
  }

  // Example quaternion slerp (a,b = [x,y,z,w])
  quatSlerp(a, b, t) {
    // naive slerp for small demo, normalize result
    let dot = a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];
    if(dot < 0) {b = b.map(v => -v); dot = -dot;}
    if(dot > 0.9995) return lerpVec(a, b, t);
    const theta0 = Math.acos(dot);
    const theta = theta0 * t;
    const sinTheta = Math.sin(theta);
    const sinTheta0 = Math.sin(theta0);
    const s0 = Math.cos(theta) - dot * sinTheta / sinTheta0;
    const s1 = sinTheta / sinTheta0;
    return a.map((v, i) => s0 * v + s1 * b[i]);
  }

  // naive quaternion to 4x4 matrix
  quatToMat4(q) {
    const [x, y, z, w] = q;
    const xx = x * x, yy = y * y, zz = z * z;
    const xy = x * y, xz = x * z, yz = y * z, wx = w * x, wy = w * y, wz = w * z;
    return new Float32Array([
      1 - 2 * (yy + zz), 2 * (xy + wz), 2 * (xz - wy), 0,
      2 * (xy - wz), 1 - 2 * (xx + zz), 2 * (yz + wx), 0,
      2 * (xz + wy), 2 * (yz - wx), 1 - 2 * (xx + yy), 0,
      0, 0, 0, 1
    ]);
  }

  // Compose TRS to a 4×4
  composeMatrix(translation, rotationQuat, scale) {
    const m = mat4.identity();
    mat4.translate(m, translation, m);
    const rot = mat4.fromQuat(rotationQuat);
    mat4.multiply(m, rot, m);
    mat4.scale(m, scale, m);
    return m;
  }

  decomposeMatrix(m) {
    // m is column-major: indices:
    // [ m0 m4 m8  m12
    //   m1 m5 m9  m13
    //   m2 m6 m10 m14
    //   m3 m7 m11 m15 ]
    const t = new Float32Array([m[12], m[13], m[14]]);
    // Extract the 3 column vectors (upper-left 3x3)
    const cx = [m[0], m[1], m[2]];
    const cy = [m[4], m[5], m[6]];
    const cz = [m[8], m[9], m[10]];
    // Lengths = scales
    const len = v => Math.hypot(v[0], v[1], v[2]);
    let sx = len(cx), sy = len(cy), sz = len(cz);
    // If any scale nearly zero, avoid divide-by-zero
    if(sx === 0) sx = 1.0;
    if(sy === 0) sy = 1.0;
    if(sz === 0) sz = 1.0;
    // Normalize columns to produce a pure rotation matrix
    const r00 = m[0] / sx, r01 = m[4] / sy, r02 = m[8] / sz;
    const r10 = m[1] / sx, r11 = m[5] / sy, r12 = m[9] / sz;
    const r20 = m[2] / sx, r21 = m[6] / sy, r22 = m[10] / sz;
    // Fix negative-scale (reflection) case: if determinant < 0, flip sign of one scale and corresponding column
    const det3 = r00 * (r11 * r22 - r12 * r21) - r01 * (r10 * r22 - r12 * r20) + r02 * (r10 * r21 - r11 * r20);
    if(det3 < 0) {
      // flip Z
      sz = -sz;
      // flip third column sign
      // multiply cz by -1 => r02,r12,r22 *= -1
      // recompute normalized r* accordingly:
      // since we only need a valid rotation matrix for quaternion conversion,
      // just invert the third column
      // (alternatively flip sx or sy—this is a convention choice)
      // Here we flip the third column:
      // r02 = -r02; r12 = -r12; r22 = -r22;
    }
    // Build quaternion from rotation matrix (r00..r22)
    // Using standard conversion (column-major rotation)
    const trace = r00 + r11 + r22;
    let qx, qy, qz, qw;
    if(trace > 0.00001) {
      const s = Math.sqrt(trace + 1.0) * 2; // s=4*qw
      qw = 0.25 * s;
      qx = (r21 - r12) / s;
      qy = (r02 - r20) / s;
      qz = (r10 - r01) / s;
    } else if(r00 > r11 && r00 > r22) {
      const s = Math.sqrt(1.0 + r00 - r11 - r22) * 2; // s=4*qx
      qw = (r21 - r12) / s;
      qx = 0.25 * s;
      qy = (r01 + r10) / s;
      qz = (r02 + r20) / s;
    } else if(r11 > r22) {
      const s = Math.sqrt(1.0 + r11 - r00 - r22) * 2; // s=4*qy
      qw = (r02 - r20) / s;
      qx = (r01 + r10) / s;
      qy = 0.25 * s;
      qz = (r12 + r21) / s;
    } else {
      const s = Math.sqrt(1.0 + r22 - r00 - r11) * 2; // s=4*qz
      qw = (r10 - r01) / s;
      qx = (r02 + r20) / s;
      qy = (r12 + r21) / s;
      qz = 0.25 * s;
    }

    const rot = new Float32Array([qx, qy, qz, qw]);
    const scale = new Float32Array([sx, sy, sz]);
    return {translation: t, rotation: rot, scale: scale};
  }

  slerp(q0, q1, t, out) {
    let dot = q0[0] * q1[0] + q0[1] * q1[1] + q0[2] * q1[2] + q0[3] * q1[3];
    if(dot < 0) {dot = -dot; q1 = [-q1[0], -q1[1], -q1[2], -q1[3]];}
    if(dot > 0.9995) {
      // linear
      for(let i = 0;i < 4;i++) out[i] = q0[i] + t * (q1[i] - q0[i]);
      // normalize
      const len = Math.hypot(...out);
      for(let i = 0;i < 4;i++) out[i] /= len;
      return;
    }
    const theta0 = Math.acos(dot);
    const theta = theta0 * t;
    const sinTheta = Math.sin(theta);
    const sinTheta0 = Math.sin(theta0);
    const s0 = Math.cos(theta) - dot * sinTheta / sinTheta0;
    const s1 = sinTheta / sinTheta0;
    for(let i = 0;i < 4;i++) {
      out[i] = s0 * q0[i] + s1 * q1[i];
    }
  }

  updateSingleBoneCubeAnimation(glbAnimation, nodes, time, boneMatrices, instanceIndex = 1) {
    const channels = glbAnimation.channels;
    const samplers = glbAnimation.samplers;
    // --- Map channels per node for faster lookup
    // this._nodeChannels.clear();
    // const anim = this.glb.glbJsonData.animations[this.animationIndex];
    // for(const channel of anim.channels) {
    //   if(!this._nodeChannels.has(channel.target.node))
    //     this._nodeChannels.set(channel.target.node, []);
    //   this._nodeChannels.get(channel.target.node).push(channel);
    // }
    const nodeChannels = this._nodeChannels;
    for(let j = 0;j < this.skeleton.length;j++) {
      const nodeIndex = this.skeleton[j];
      const node = nodes[nodeIndex];
      // --- Initialize node TRS if needed
      if(!node.translation) node.translation = new Float32Array([0, 0, 0]);
      if(!node.rotation) node.rotation = quat.create();
      if(!node.scale) node.scale = new Float32Array([1, 1, 1]);
      // --- Keep original TRS for additive animation
      if(!node.originalTranslation) node.originalTranslation = node.translation.slice();
      if(!node.originalRotation) node.originalRotation = node.rotation.slice();
      if(!node.originalScale) node.originalScale = node.scale.slice();
      const channelsForNode = nodeChannels.get(nodeIndex) || [];
      for(const channel of channelsForNode) {
        const path = channel.target.path; // "translation" | "rotation" | "scale"
        const sampler = samplers[channel.sampler];
        // --- Get input/output arrays
        const inputTimes = this.getAccessorArray(this.glb, sampler.input);
        const outputArray = this.getAccessorArray(this.glb, sampler.output);
        const numComponents = path === "rotation" ? 4 : 3;
        // --- Find keyframe interval
        const animTime = time % inputTimes[inputTimes.length - 1];
        let i = 0;
        while(i < inputTimes.length - 1 && inputTimes[i + 1] <= animTime) i++;
        const t0 = inputTimes[i];
        const t1 = inputTimes[Math.min(i + 1, inputTimes.length - 1)];
        const factor = t1 !== t0 ? (animTime - t0) / (t1 - t0) : 0;
        // --- Interpolated keyframe values
        const base0 = i * numComponents;
        const base1 = Math.min(i + 1, inputTimes.length - 1) * numComponents;
        // --- Apply animation
        if(path === "translation") {
          for(let k = 0;k < 3;k++) {
            node.translation[k] =
              outputArray[base0 + k] * (1 - factor) +
              outputArray[base1 + k] * factor;
          }
        } else if(path === "scale") {
          for(let k = 0;k < 3;k++) {
            node.scale[k] =
              outputArray[base0 + k] * (1 - factor) +
              outputArray[base1 + k] * factor;
          }
        } else if(path === "rotation") {
          this.slerp(
            outputArray.subarray(base0, base0 + 4),
            outputArray.subarray(base1, base1 + 4),
            factor,
            node.rotation
          );
        }
        
      }
      // --- Recompose local transform
      node.transform = this.composeMatrix(node.translation, node.rotation, node.scale);
    }
    const computeWorld = (nodeIndex) => {
      const node = nodes[nodeIndex];
      if(!node.worldMatrix) node.worldMatrix = mat4.create();
      let parentWorld = node.parent !== null ? nodes[node.parent].worldMatrix : null;
      if(parentWorld) {
        // multiply parent * local
        mat4.multiply(parentWorld, node.transform, node.worldMatrix);
      } else {
        mat4.copy(node.transform, node.worldMatrix);
      }

      mat4.scale(node.worldMatrix, [this.scaleBoneTest, this.scaleBoneTest, this.scaleBoneTest], node.worldMatrix);
      if(node.children) {
        for(const childIndex of node.children) computeWorld(childIndex);
      }
    };
    for(let i = 0;i < nodes.length;i++) {
      if(nodes[i].parent === null || nodes[i].parent === undefined) {
        computeWorld(i);
      }
    }
    for(let j = 0;j < this.skeleton.length;j++) {
      const jointNode = nodes[this.skeleton[j]];
      mat4.multiply(jointNode.worldMatrix, jointNode.inverseBindMatrix, this._tempMat);
      boneMatrices.set(this._tempMat, j * 16);
    }

    const byteOffset = alignTo256(64 * this.MAX_BONES) * instanceIndex;
    this.device.queue.writeBuffer(this.bonesBuffer, byteOffset, boneMatrices);
    return boneMatrices;
  }
}