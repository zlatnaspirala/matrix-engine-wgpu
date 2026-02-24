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
    this.MAX_BONES = 100; // predefined
    this.bvh = {};
    this.glb = glb;
    this.glb.animationIndex = 0;
    this.currentFrame = 0;
    this.fps = 30;
    this.frameTime = 1 / this.fps;
    this._maxDelta = this.frameTime * 4;
    this.timeAccumulator = 0;
    this.trailAnimation = {
      enabled: false,
      delay: 100
    };
    // cache
    this._scaleVec = new Float32Array([this.scaleBoneTest, this.scaleBoneTest, this.scaleBoneTest]);
    this._animationLength = 0;
    this._boneMatrices = new Float32Array(this.MAX_BONES * 16);
    this._numFrames = null;
    this.initAnimationCache();
    this.finalMat = new Float32Array(this.MAX_BONES * 16);
    this.nodeChannels = new Map();
    const anim = this.glb.glbJsonData.animations[this.glb.animationIndex];
    this.initNodeChannelMap(anim);
    this._animationEvents = {};
    this._animationEndDispatched = {};
    this.glb.glbJsonData.animations.forEach(anim => {
      this._animationEvents[anim.name] = new CustomEvent(`animationEnd-${this.name}`, {
        detail: {animationName: anim.name}
      });
      this._animationEndDispatched[anim.name] = false;
    });

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
    this.sharedState = this.bvh.sharedState;
    this.skinnedNode = this.glb.skinnedMeshNodes[skinnedNodeIndex];
    this.nodeWorldMatrices = Array.from({length: this.glb.nodes.length}, () => mat4.identity());
    this.startTime = performance.now() / 1000;
    this.skeleton = [];
    this.animationSpeed = 1000;
    this.inverseBindMatrices = [];
    this.initInverseBindMatrices();
    this.makeSkeletal();
    this.initNodes(this.glb.nodes);
  }

  set scaleBoneTest(val) {
    this._scaleBoneTest = val;
    this._scaleVec[0] = this._scaleVec[1] = this._scaleVec[2] = val;
  }

  initNodes(nodes) {
    for(const node of nodes) {
      if(!node.translation) node.translation = new Float32Array([0, 0, 0]);
      if(!node.rotation) node.rotation = quat.create();
      if(!node.scale) node.scale = new Float32Array([1, 1, 1]);
      // snapshot originals once
      node.originalTranslation = node.translation.slice();
      node.originalRotation = node.rotation.slice();
      node.originalScale = node.scale.slice();
      node.worldMatrix = mat4.create(); // ← add this
    }
  }

  initNodeChannelMap(glbAnimation) {
    this.nodeChannels = new Map();
    for(const channel of glbAnimation.channels) {
      if(!this.nodeChannels.has(channel.target.node))
        this.nodeChannels.set(channel.target.node, []);
      this.nodeChannels.get(channel.target.node).push(channel);
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
      const jointNode = this.glb.nodes[jointIndex];
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
    for(let j = 0;j < this.glb.glbJsonData.animations.length;j++) {
      if(this.glb.glbJsonData.animations[j].name.indexOf('Armature') !== -1) {
        this.glb.animationIndex = j;
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

  initAnimationCache() {
    this.initAnimationLenghtCache();
    const anim = this.glb.glbJsonData.animations[this.glb.animationIndex];
    this.initNodeChannelMap(anim);
    if(typeof anim == 'undefined') return 1;
    let maxFrames = 0;
    for(const sampler of anim.samplers) {
      const inputAccessor = this.glb.glbJsonData.accessors[sampler.input];
      if(inputAccessor.count > maxFrames) maxFrames = inputAccessor.count;
    }
    this._numFrames = maxFrames;
    return maxFrames;
  }


  playAnimationByIndex = (animationIndex) => {
    this.initAnimationCache();
    this.glb.animationIndex = animationIndex;
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
    this.initAnimationCache();
    this.glb.animationIndex = index;
  }

  _getAnimationLength(animation) {
    let maxTime = 0;
    for(const channel of animation.channels) {
      const sampler = animation.samplers[channel.sampler];
      const inputTimes = this.getAccessorArray(this.glb, sampler.input);
      const lastTime = inputTimes[inputTimes.length - 1];
      if(lastTime > maxTime) maxTime = lastTime;
    }
    return maxTime;
  }

  initAnimationLenghtCache() {
    this._animationLength = this._getAnimationLength(this.glb.glbJsonData.animations[this.glb.animationIndex])
  }

  update(deltaTime) {
    this.sharedState.timeAccumulator += Math.min(deltaTime, this._maxDelta);
    while(this.sharedState.timeAccumulator >= this.frameTime) {
      this.sharedState.currentFrame = (this.sharedState.currentFrame + 1) % this._numFrames;
      this.sharedState.timeAccumulator -= this.frameTime;
    }
    if(this.sharedState.animationStarted == false && this.sharedState.emitAnimationEvent == true) {
      this.sharedState.animationStarted = true;
      setTimeout(() => {
        const animName = this.glb.glbJsonData.animations[this.glb.animationIndex].name;
        this.dispatchEvent(this._animationEvents[animName]);
        this.sharedState.animationStarted = false;
      }, this._animationLength * 1000)
    }
    if(this.glb.glbJsonData.animations && this.glb.glbJsonData.animations.length > 0) {
      if(this.trailAnimation.enabled == true) {
        for(let i = 0;i < this.instanceCount;i++) {
          const timeOffsetMs = i * this.trailAnimation.delay;
          const currentTime = (performance.now() - timeOffsetMs) / this.animationSpeed - this.startTime;
          this.updateSingleBoneCubeAnimation(this.glb.glbJsonData.animations[this.glb.animationIndex], this.glb.nodes, currentTime, this._boneMatrices, i);
        }
      } else {
        const currentTime = performance.now() / this.animationSpeed - this.startTime;
        this.updateSingleBoneCubeAnimation(this.glb.glbJsonData.animations[this.glb.animationIndex], this.glb.nodes, currentTime, this._boneMatrices, 0)
        this.updateSingleBoneCubeAnimation(this.glb.glbJsonData.animations[this.glb.animationIndex], this.glb.nodes, currentTime, this._boneMatrices, 1)
      }
    }
  }

  getAccessorArray(glb, accessorIndex) {
    const cached = this._accessorCache.get(accessorIndex);
    if(cached !== undefined) return cached;
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
    this._accessorCache.set(accessorIndex, result);
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

  composeMatrix(translation, rotationQuat, scale) {
    const m = mat4.identity();
    mat4.translate(m, translation, m);
    const rot = mat4.fromQuat(rotationQuat);
    mat4.multiply(m, rot, m);
    mat4.scale(m, scale, m);
    return m;
  }

  decomposeMatrix(m) {
    const t = new Float32Array([m[12], m[13], m[14]]);
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
    }
    const trace = r00 + r11 + r22;
    let qx, qy, qz, qw;
    if(trace > 0.00001) {
      const s = Math.sqrt(trace + 1.0) * 2;
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
    let flip = false;
    if(dot < 0) {dot = -dot; flip = true;}
    if(dot > 0.9995) {
      for(let i = 0;i < 4;i++) out[i] = q0[i] + t * (q1[i] - q0[i]);
      const len = Math.sqrt(out[0] * out[0] + out[1] * out[1] + out[2] * out[2] + out[3] * out[3]);
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
      out[i] = flip
        ? s0 * q0[i] - s1 * q1[i]
        : s0 * q0[i] + s1 * q1[i];
    }
  }

  findKeyframe(inputTimes, animTime) {
    let lo = 0;
    let hi = inputTimes.length - 2;
    while(lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if(inputTimes[mid] <= animTime) lo = mid;
      else hi = mid - 1;
    }
    return lo;
  }

  updateSingleBoneCubeAnimation(glbAnimation, nodes, time, boneMatrices, instanceIndex = 1) {
    // const channels = glbAnimation.channels;
    const samplers = glbAnimation.samplers;
    for(let j = 0;j < this.skeleton.length;j++) {
      const nodeIndex = this.skeleton[j];
      const node = nodes[nodeIndex];
      const channelsForNode = this.nodeChannels.get(nodeIndex) || [];
      for(const channel of channelsForNode) {
        const path = channel.target.path; // "translation" | "rotation" | "scale"
        const sampler = samplers[channel.sampler];
        // --- Get input/output arrays
        const inputTimes = this.getAccessorArray(this.glb, sampler.input);
        const outputArray = this.getAccessorArray(this.glb, sampler.output);
        const numComponents = path === "rotation" ? 4 : 3;
        // --- Find keyframe interval
        const animTime = time % inputTimes[inputTimes.length - 1];
        const i = this.findKeyframe(inputTimes, animTime);
        const t0 = inputTimes[i];
        const t1 = inputTimes[Math.min(i + 1, inputTimes.length - 1)];
        const factor = t1 !== t0 ? (animTime - t0) / (t1 - t0) : 0;
        // --- Interpolated keyframe values
        // const v0 = outputArray.subarray(i * numComponents, (i + 1) * numComponents);
        // const v1 = outputArray.subarray(
        //   Math.min(i + 1, inputTimes.length - 1) * numComponents,
        //   Math.min(i + 2, inputTimes.length) * numComponents
        // );
        const lastIndex = inputTimes.length - 1;
        const nextIndex = i < lastIndex ? i + 1 : i;
        const inv = 1 - factor;
        const base0 = i * numComponents;
        const base1 = nextIndex * numComponents;
        // --- Apply animation
        if(path === "translation") {
          // for(let k = 0;k < 3;k++) node.translation[k] = v0[k] * (1 - factor) + v1[k] * factor;
          node.translation[0] = outputArray[base0] * inv + outputArray[base1] * factor;
          node.translation[1] = outputArray[base0 + 1] * inv + outputArray[base1 + 1] * factor;
          node.translation[2] = outputArray[base0 + 2] * inv + outputArray[base1 + 2] * factor;
        } else if(path === "scale") {
          node.scale[0] = outputArray[base0] * inv + outputArray[base1] * factor;
          node.scale[1] = outputArray[base0 + 1] * inv + outputArray[base1 + 1] * factor;
          node.scale[2] = outputArray[base0 + 2] * inv + outputArray[base1 + 2] * factor;
        } else if(path === "rotation") {
          // this.slerp(v0, v1, factor, node.rotation);
          this.slerpFromArray(outputArray, base0, base1, factor, node.rotation);
        }
      }
      // --- Recompose local transform
      node.transform = this.composeMatrix(node.translation, node.rotation, node.scale);
    }

    this.computeWorld(nodes);
    for(let j = 0;j < this.skeleton.length;j++) {
      const jointNode = nodes[this.skeleton[j]];
      const offset = j * 16;
      mat4.multiply(
        jointNode.worldMatrix,
        jointNode.inverseBindMatrix,
        this.finalMat.subarray(offset, offset + 16)
      );
    }

    const byteOffset = alignTo256(64 * this.MAX_BONES) * instanceIndex;
    this.device.queue.writeBuffer(this.bonesBuffer, byteOffset, this.finalMat);
    return this.finalMat;
  }

  computeWorld = (nodes) => {
    const stack = [];
    for(let i = 0;i < nodes.length;i++) {
      if(nodes[i].parent === null || nodes[i].parent === undefined) {
        stack.push(i);
      }
    }
    while(stack.length > 0) {
      const nodeIndex = stack.pop();
      const node = nodes[nodeIndex];
      const parentWorld = node.parent != null ? nodes[node.parent].worldMatrix : null;
      if(parentWorld) {
        mat4.multiply(parentWorld, node.transform, node.worldMatrix);
      } else {
        mat4.copy(node.transform, node.worldMatrix);
      }
      mat4.scale(node.worldMatrix, this._scaleVec, node.worldMatrix);
      if(node.children) {
        for(const childIndex of node.children) stack.push(childIndex);
      }
    }
  }

  slerpFromArray(array, base0, base1, t, out) {
    let x0 = array[base0];
    let y0 = array[base0 + 1];
    let z0 = array[base0 + 2];
    let w0 = array[base0 + 3];

    let x1 = array[base1];
    let y1 = array[base1 + 1];
    let z1 = array[base1 + 2];
    let w1 = array[base1 + 3];

    let dot = x0 * x1 + y0 * y1 + z0 * z1 + w0 * w1;

    if(dot < 0) {
      dot = -dot;
      x1 = -x1; y1 = -y1; z1 = -z1; w1 = -w1;
    }

    if(dot > 0.9995) {
      const inv = 1 - t;
      out[0] = x0 * inv + x1 * t;
      out[1] = y0 * inv + y1 * t;
      out[2] = z0 * inv + z1 * t;
      out[3] = w0 * inv + w1 * t;

      // fast normalize
      const len = Math.sqrt(
        out[0] * out[0] +
        out[1] * out[1] +
        out[2] * out[2] +
        out[3] * out[3]
      );
      const invLen = 1 / len;

      out[0] *= invLen;
      out[1] *= invLen;
      out[2] *= invLen;
      out[3] *= invLen;
      return;
    }

    const theta0 = Math.acos(dot);
    const theta = theta0 * t;
    const sinTheta = Math.sin(theta);
    const sinTheta0 = Math.sin(theta0);

    const s0 = Math.cos(theta) - dot * sinTheta / sinTheta0;
    const s1 = sinTheta / sinTheta0;

    out[0] = s0 * x0 + s1 * x1;
    out[1] = s0 * y0 + s1 * y1;
    out[2] = s0 * z0 + s1 * z1;
    out[3] = s0 * w0 + s1 * w1;
  }
}