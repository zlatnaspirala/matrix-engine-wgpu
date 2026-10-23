import {mat4} from "wgpu-matrix";
import {GLTFBuffer} from "./webgpu-gltf.js";
import MEMeshObjInstances from "../instanced/mesh-obj-instances.js";
import {MEConfig} from "../../me-config.js";

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
  constructor(o, bvh, glb, primitiveIndex, skinnedNodeIndex, canvas, device, context, inputHandler, globalAmbient, cameraBuffer) {
    super(canvas, device, context, o, inputHandler, globalAmbient, glb, primitiveIndex, skinnedNodeIndex, cameraBuffer);
    this.bvh = {};
    this.glb = glb;
    this.currentFrame = 0;
    this.fps = 30;
    this.timeAccumulator = 0;
    this.sharedBones = false;
    this.trailAnimation = {
      enabled: false, // deplaced
      delay: 0
    };
    this.scaleBoneTest = 1;
    this.primitiveIndex = primitiveIndex;
    this.sharedState = {
      emitAnimationEvent: false,
      animationStarted: false,
      currentFrame: 0,
      timeAccumulator: 0,
      animationFinished: false
    };
    this.animationIndex = 0;
    this.glbAnimEvents = {};
    this.glb.glbJsonData.animations.forEach((anim, index) => {
      this.glbAnimEvents['animEndEvent' + index] = new CustomEvent(`animationEnd-${this.name}`, {
        detail: {
          animationName: this.glb.glbJsonData.animations[index].name,
          targetName: this.name
        }
      });
    });
    this._emptyChannels = [];
    this.MAX_BONES = MEConfig.MAX_BONES;
    // cache
    this._boneMatrices = new Float32Array(this.MAX_BONES * 16);
    this._nodeChannels = new Map();
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
    this.skeleton = [];                        // array of joint node indices
    this.animationSpeed = 1000;
    this.inverseBindMatrices = [];             // Float32Array for each joint
    this.initInverseBindMatrices();
    this.makeSkeletal();
    this.rebuildInstanceSkeletons();
    this._numFrames = this.getNumberOfFramesCurAni();
    this._finalMat = new Float32Array(this.MAX_BONES * 16);
    this._tempMat = mat4.create();
    this.buildNodeChannelMap();
    this.buildSortedNodes();
    this.initNodeOriginals();
  }

  rebuildInstanceSkeletons() {
    this.instanceNodes = [];
    this.instanceBoneMatrices = [];
    for(let i = 0;i < this.instanceCount;i++) {
      const clonedNodes = this.nodes.map(n => ({
        ...n,
        translation: n.translation ? new Float32Array(n.translation) : new Float32Array([0, 0, 0]),
        rotation: n.rotation ? new Float32Array(n.rotation) : new Float32Array([0, 0, 0, 1]),
        scale: n.scale ? new Float32Array(n.scale) : new Float32Array([1, 1, 1]),
        transform: n.transform ? new Float32Array(n.transform) : mat4.identity(),
        worldMatrix: mat4.create(),
        inverseBindMatrix: n.inverseBindMatrix ? new Float32Array(n.inverseBindMatrix) : null
      }));
      this.instanceNodes.push(clonedNodes);
      this.instanceBoneMatrices.push(new Float32Array(this.MAX_BONES * 16));
    }
  }

  initNodeOriginals() {
    for(let j = 0;j < this.skeleton.length;j++) {
      const node = this.nodes[this.skeleton[j]];
      if(!node.originalTranslation) node.originalTranslation = node.translation.slice();
      if(!node.originalRotation) node.originalRotation = node.rotation.slice();
      if(!node.originalScale) node.originalScale = node.scale.slice();
    }
  }

  buildSortedNodes() {
    const sorted = [];
    const queue = [];
    for(let i = 0;i < this.nodes.length;i++) {
      if(this.nodes[i].parent == null) queue.push(i);
    }
    while(queue.length) {
      const idx = queue.shift();
      sorted.push(idx);
      const children = this.nodes[idx].children;
      if(children) for(const c of children) queue.push(c);
    }
    this._sortedNodes = sorted;
  }

  buildNodeChannelMap() {
    const anim = this.glb.glbJsonData.animations[this.animationIndex];
    const nodeCount = this.glb.glbJsonData.nodes.length;
    this._nodeChannelsArray = new Array(nodeCount);
    for(let i = 0;i < nodeCount;i++) {
      this._nodeChannelsArray[i] = [];
    }
    this._translationChannels = new Array(nodeCount);
    this._rotationChannels = new Array(nodeCount);
    this._scaleChannels = new Array(nodeCount);
    for(let i = 0;i < nodeCount;i++) {
      this._translationChannels[i] = [];
      this._rotationChannels[i] = [];
      this._scaleChannels[i] = [];
    }
    for(let i = 0;i < anim.channels.length;i++) {
      const channel = anim.channels[i];
      const nodeIndex = channel.target.node;
      if(!this._nodeChannelsArray[nodeIndex]) {
        this._nodeChannelsArray[nodeIndex] = [];
      }
      this._nodeChannelsArray[nodeIndex].push(channel);
      if(channel.target.path === "translation") {
        this._translationChannels[nodeIndex].push(channel);
      }
      else if(channel.target.path === "rotation") {
        this._rotationChannels[nodeIndex].push(channel);
      }
      else {
        this._scaleChannels[nodeIndex].push(channel);
      }
    }
    // metadata cache
    for(let i = 0;i < anim.channels.length;i++) {
      const channel = anim.channels[i];
      const sampler = anim.samplers[channel.sampler];
      channel._inputTimes = this.getAccessorArray(this.glb, sampler.input);
      channel._outputArray = this.getAccessorArray(this.glb, sampler.output);
      channel._numComponents = channel.target.path === 'rotation' ? 4 : 3;
      channel._animLength = channel._inputTimes[channel._inputTimes.length - 1];
      channel._isStep = sampler.interpolation === 'STEP';
      channel._lastKeyIndex = 0;
      channel._pathType = channel.target.path === 'rotation' ? 2 : channel.target.path === 'translation' ? 0 : 1;
      channel._lastFrame = channel._inputTimes.length - 1;
    }
    this._animationLength = this.getAnimationLength(anim);
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

  initInstanceSkeletons() {
    this.instanceNodes = [];
    this.instanceBoneMatrices = [];
    for(let i = 0;i < this.instanceCount;i++) {
      const clonedNodes = this.nodes.map(n => ({
        ...n,
        translation: n.translation ? new Float32Array(n.translation) : new Float32Array([0, 0, 0]),
        rotation: n.rotation ? new Float32Array(n.rotation) : new Float32Array([0, 0, 0, 1]),
        scale: n.scale ? new Float32Array(n.scale) : new Float32Array([1, 1, 1]),
        transform: n.transform ? new Float32Array(n.transform) : mat4.identity(),
        worldMatrix: mat4.create(),
        inverseBindMatrix: n.inverseBindMatrix ? new Float32Array(n.inverseBindMatrix) : null
      }));
      this.instanceNodes.push(clonedNodes);
      this.instanceBoneMatrices.push(new Float32Array(this.MAX_BONES * 16));
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
    const index = animations.findIndex(anim => anim.name === animationName);
    if(index === -1) {
      console.warn(`Animation '${animationName}' not found`);
      return;
    }
    this.animationIndex = index;
    this.buildNodeChannelMap();
  };

  composeTRS(t, q, s, out) {
    const x = q[0], y = q[1], z = q[2], w = q[3];
    const x2 = x + x, y2 = y + y, z2 = z + z;
    const xx = x * x2, xy = x * y2, xz = x * z2;
    const yy = y * y2, yz = y * z2, zz = z * z2;
    const wx = w * x2, wy = w * y2, wz = w * z2;
    out[0] = (1 - (yy + zz)) * s[0]; out[1] = (xy + wz) * s[0]; out[2] = (xz - wy) * s[0]; out[3] = 0;
    out[4] = (xy - wz) * s[1]; out[5] = (1 - (xx + zz)) * s[1]; out[6] = (yz + wx) * s[1]; out[7] = 0;
    out[8] = (xz + wy) * s[2]; out[9] = (yz - wx) * s[2]; out[10] = (1 - (xx + yy)) * s[2]; out[11] = 0;
    out[12] = t[0]; out[13] = t[1]; out[14] = t[2]; out[15] = 1;
  }

  update(now) {
    if(this._poseOn) this._solvePose();
    var inTime = this._animationLength;
    if(this.sharedState.animationStarted == false &&
      this.sharedState.emitAnimationEvent == true) {
      this.sharedState.animationStarted = true;
      const capturedIndex = this.animationIndex ?? 0;
      setTimeout(() => {
        this.sharedState.animationStarted = false;
        if(this.animationIndex == null) {this.animationIndex = 0}
        window.dispatchEvent(this.glbAnimEvents['animEndEvent' + capturedIndex]);
      }, inTime * 1000);
    }
    if(this.glb.glbJsonData.animations &&
      this.glb.glbJsonData.animations.length > 0) {
      if(this.sharedBones === true) {
        const currentTime = now / this.animationSpeed - this.startTime;
        this.updateSingleBoneCubeAnimation(
          this.glb.glbJsonData.animations[this.animationIndex],
          this.instanceNodes[0],
          currentTime,
          this.instanceBoneMatrices[0],
          0
        );
      } else {
        for(let i = 0;i < this.instanceCount;i++) {
          const timeOffsetMs = i * this.trailAnimation.delay;
          const currentTime = (now - timeOffsetMs) / this.animationSpeed - this.startTime;
          this.updateSingleBoneCubeAnimation(
            this.glb.glbJsonData.animations[this.animationIndex],
            this.instanceNodes[i],
            currentTime,
            this.instanceBoneMatrices[i],
            i
          );
        }
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
      default: throw new Error("Unsupported componentType:" + accessor.componentType);
    }
    glb._accessorCache.set(accessorIndex, result);
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
    if(bufferDef instanceof GLTFBuffer) {
      return bufferDef.arrayBuffer.slice(
        bufferDef.byteOffset + (byteOffset || 0),
        bufferDef.byteOffset + (byteOffset || 0) + byteLength
      );
    }
    if(bufferDef instanceof ArrayBuffer) {
      return bufferDef.slice(byteOffset, byteOffset + byteLength);
    }
    if(bufferDef && bufferDef.data instanceof ArrayBuffer) {
      return bufferDef.data.slice(byteOffset, byteOffset + byteLength);
    }
    if(bufferDef && bufferDef._data instanceof ArrayBuffer) {
      return bufferDef._data.slice(byteOffset, byteOffset + byteLength);
    }
    throw new Error("No binary data found in GLB buffer[0]");
  }

  lerpVec(a, b, t) {return a.map((v, i) => v * (1 - t) + b[i] * t)}
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
    const t = new Float32Array([m[12], m[13], m[14]]);
    const cx = [m[0], m[1], m[2]];
    const cy = [m[4], m[5], m[6]];
    const cz = [m[8], m[9], m[10]];
    const len = v => Math.hypot(v[0], v[1], v[2]);
    let sx = len(cx), sy = len(cy), sz = len(cz);
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
      const s = Math.sqrt(trace + 1.0) * 2;
      qw = 0.25 * s;
      qx = (r21 - r12) / s;
      qy = (r02 - r20) / s;
      qz = (r10 - r01) / s;
    } else if(r00 > r11 && r00 > r22) {
      const s = Math.sqrt(1.0 + r00 - r11 - r22) * 2;
      qw = (r21 - r12) / s;
      qx = 0.25 * s;
      qy = (r01 + r10) / s;
      qz = (r02 + r20) / s;
    } else if(r11 > r22) {
      const s = Math.sqrt(1.0 + r11 - r00 - r22) * 2;
      qw = (r02 - r20) / s;
      qx = (r01 + r10) / s;
      qy = 0.25 * s;
      qz = (r12 + r21) / s;
    } else {
      const s = Math.sqrt(1.0 + r22 - r00 - r11) * 2;
      qw = (r10 - r01) / s;
      qx = (r02 + r20) / s;
      qy = (r12 + r21) / s;
      qz = 0.25 * s;
    }
    const rot = new Float32Array([qx, qy, qz, qw]);
    const scale = new Float32Array([sx, sy, sz]);
    return {translation: t, rotation: rot, scale: scale};
  }

  slerp(arr0, off0, arr1, off1, t, out) {
    let ax = arr0[off0], ay = arr0[off0 + 1], az = arr0[off0 + 2], aw = arr0[off0 + 3];
    let bx = arr1[off1], by = arr1[off1 + 1], bz = arr1[off1 + 2], bw = arr1[off1 + 3];
    let dot = ax * bx + ay * by + az * bz + aw * bw;
    const flip = dot < 0 ? (dot = -dot, -1) : 1;
    bx *= flip; by *= flip; bz *= flip; bw *= flip;
    if(dot > 0.9995) {
      out[0] = ax + t * (bx - ax);
      out[1] = ay + t * (by - ay);
      out[2] = az + t * (bz - az);
      out[3] = aw + t * (bw - aw);
      const len = Math.sqrt(out[0] ** 2 + out[1] ** 2 + out[2] ** 2 + out[3] ** 2);
      out[0] /= len; out[1] /= len; out[2] /= len; out[3] /= len;
      return;
    }
    const theta0 = Math.acos(dot);
    const sinTheta0 = Math.sin(theta0);
    const s0 = Math.cos(theta0 * t) - dot * Math.sin(theta0 * t) / sinTheta0;
    const s1 = Math.sin(theta0 * t) / sinTheta0;
    out[0] = s0 * ax + s1 * bx;
    out[1] = s0 * ay + s1 * by;
    out[2] = s0 * az + s1 * bz;
    out[3] = s0 * aw + s1 * bw;
  }

  updateSingleBoneCubeAnimation(glbAnimation, nodes, time, boneMatrices, instanceIndex = 0) {
    const animTime = time % this._animationLength;
    const skeleton = this.skeleton;
    for(let j = 0;j < skeleton.length;j++) {
      const nodeIndex = skeleton[j];
      const node = nodes[nodeIndex];
      const tr = node.translation;
      const sc = node.scale;
      const rot = node.rotation;

      if(this._poseOn) {
        const o = nodeIndex * 4, pl = this._poseLocal;
        rot[0] = pl[o]; rot[1] = pl[o + 1]; rot[2] = pl[o + 2]; rot[3] = pl[o + 3];
        this.composeTRS(tr, rot, sc, node.transform);
        // skip the animation channels
        continue;
      }

      const tChannels = this._translationChannels[nodeIndex] || [];
      const sChannels = this._scaleChannels[nodeIndex] || [];
      const rChannels = this._rotationChannels[nodeIndex] || [];
      // TRANSLATION
      for(let k = 0;k < tChannels.length;k++) {
        const channel = tChannels[k];
        const inputTimes = channel._inputTimes;
        const outputArray = channel._outputArray;
        const lastFrame = channel._lastFrame;
        let i = 0;
        while(i < lastFrame && inputTimes[i + 1] <= animTime) {i++;}
        const next = i < lastFrame ? i + 1 : lastFrame;
        const t0 = inputTimes[i];
        const t1 = inputTimes[next];
        const factor = t1 !== t0 ? (animTime - t0) / (t1 - t0) : 0;
        const inv = 1.0 - factor;
        const base0 = i * 3;
        const base1 = next * 3;
        tr[0] = outputArray[base0] * inv + outputArray[base1] * factor;
        tr[1] = outputArray[base0 + 1] * inv + outputArray[base1 + 1] * factor;
        tr[2] = outputArray[base0 + 2] * inv + outputArray[base1 + 2] * factor;
      }
      // SCALE
      for(let k = 0;k < sChannels.length;k++) {
        const channel = sChannels[k];
        const inputTimes = channel._inputTimes;
        const outputArray = channel._outputArray;
        const lastFrame = channel._lastFrame;
        let i = 0;
        while(i < lastFrame && inputTimes[i + 1] <= animTime) {i++;}
        const next = i < lastFrame ? i + 1 : lastFrame;
        const t0 = inputTimes[i];
        const t1 = inputTimes[next];
        const factor = t1 !== t0 ? (animTime - t0) / (t1 - t0) : 0;
        const inv = 1.0 - factor;
        const base0 = i * 3;
        const base1 = next * 3;
        sc[0] = outputArray[base0] * inv + outputArray[base1] * factor;
        sc[1] = outputArray[base0 + 1] * inv + outputArray[base1 + 1] * factor;
        sc[2] = outputArray[base0 + 2] * inv + outputArray[base1 + 2] * factor;
      }

      for(let k = 0;k < rChannels.length;k++) {
        const channel = rChannels[k];
        const inputTimes = channel._inputTimes;
        const outputArray = channel._outputArray;
        const lastFrame = channel._lastFrame;
        let i = 0;
        while(i < lastFrame && inputTimes[i + 1] <= animTime) {i++;}
        const next = i < lastFrame ? i + 1 : lastFrame;
        const t0 = inputTimes[i];
        const t1 = inputTimes[next];
        const factor = t1 !== t0 ? (animTime - t0) / (t1 - t0) : 0;
        const base0 = i * 4;
        const base1 = next * 4;
        this.slerp(outputArray, base0, outputArray, base1, factor, rot);
      }
      this.composeTRS(tr, rot, sc, node.transform);
    }

    const sorted = this._sortedNodes;

    for(let i = 0;i < sorted.length;i++) {
      const nodeIndex = sorted[i];
      const node = nodes[nodeIndex];
      const parentWorld = node.parent != null ? nodes[node.parent].worldMatrix : null;
      if(parentWorld) {
        mat4.multiply(parentWorld, node.transform, node.worldMatrix);
      } else {
        mat4.copy(node.transform, node.worldMatrix);
      }
    }

    for(let j = 0;j < skeleton.length;j++) {
      const jointNode = nodes[skeleton[j]];
      mat4.multiply(jointNode.worldMatrix, jointNode.inverseBindMatrix, this._tempMat);
      boneMatrices.set(this._tempMat, j * 16);
    }
    const byteOffset = instanceIndex * this.MAX_BONES * 64;
    this.device.queue.writeBuffer(this.bonesBuffer, byteOffset, boneMatrices.buffer, boneMatrices.byteOffset, boneMatrices.byteLength);
    return boneMatrices;
  }

  enablePoseDrive(opts = {}) {
    this._restFromBindPose();
    const jn = this.glb.glbJsonData.nodes;
    const n = this.nodes.length;
    this._poseSmooth = opts.smooth ?? 0.4;              // 0 = raw
    this._poseMirror = opts.mirror ?? false;            // false: puppet (your left = its left), true: mirror
    this._poseZSign = opts.zSign ?? -1;
    this._poseMinVis = opts.minVisibility ?? 0.5;
    this._poseWL = null; this._poseLM = null;
    this._poseRestLocal = new Float32Array(n * 4);
    this._poseRestWorld = new Float32Array(n * 4);
    this._poseNewWorld = new Float32Array(n * 4);
    this._poseLocal = new Float32Array(n * 4);
    this._poseFrom = new Int8Array(n).fill(-1);
    this._poseTo = new Int8Array(n).fill(-1);
    this._poseRestDir = new Float32Array(n * 3);
    this._qTmp = new Float32Array(8);
    // rest world matrices / quaternions (one time, allocation is fine here)
    const world = new Array(n), L = mat4.create();
    const isJoint = new Set(this.skeleton);
    for(const i of this._sortedNodes) {
      const nd = this.nodes[i], p = nd.parent;
      if(isJoint.has(i)) this.composeTRS(nd.translation, nd.rotation, nd.scale, L);
      else mat4.copy(nd.transform, L);                  // Armature etc: matrix only
      world[i] = p != null ? mat4.multiply(world[p], L) : mat4.copy(L);
      const dl = this.decomposeMatrix(L).rotation;      // local rotation, scale removed
      const dw = this.decomposeMatrix(world[i]).rotation;  // world rotation incl. Armature
      this._poseRestLocal.set(dl, i * 4);
      this._poseLocal.set(dl, i * 4);
      this._poseRestWorld.set(dw, i * 4);
    }
    // resolve bones by name
    const jointSet = new Set(this.skeleton);
    const found = {};
    for(const i of this.skeleton) {
      const t = _poseTokens(jn[i].name);
      const side = t.includes('left') || t.includes('l') ? 'L' : (t.includes('right') || t.includes('r') ? 'R' : null);
      if(!side) continue;
      const part = t.filter(x => x !== 'left' && x !== 'right' && x !== 'l' && x !== 'r').join('');
      for(const key in _POSE_SLOTS) {
        if(_POSE_SLOTS[key].names.includes(part) && !((key + side) in found)) found[key + side] = i;
      }
    }
    if(opts.override) for(const id in opts.override) {       // {upperArmL: 'NodeName', ...}
      const i = jn.findIndex(x => x.name === opts.override[id]);
      if(i >= 0) found[id] = i;
    }
    const missing = [];
    for(const key in _POSE_SLOTS) for(const side of ['L', 'R']) {
      const i = found[key + side];
      if(i === undefined) {missing.push(key + side); continue;}
      const nextId = _POSE_SLOTS[key].next ? _POSE_SLOTS[key].next + side : null;
      let c = nextId && found[nextId] !== undefined ? found[nextId] : -1;
      if(c < 0) for(const ch of(this.nodes[i].children || [])) if(jointSet.has(ch)) {c = ch; break;}
      if(c < 0) {missing.push(key + side + '(no child)'); continue;}
      let dx = world[c][12] - world[i][12], dy = world[c][13] - world[i][13], dz = world[c][14] - world[i][14];
      const l = Math.hypot(dx, dy, dz) || 1;
      this._poseRestDir.set([dx / l, dy / l, dz / l], i * 3);
      this._poseFrom[i] = _POSE_SLOTS[key][side][0];
      this._poseTo[i] = _POSE_SLOTS[key][side][1];
    }
    if(missing.length) console.warn(`[${this.name}] pose drive: unmapped`, missing, '-> use opts.override');

    //
    // torso / head
    this._poseKind = new Int8Array(n);          // 2 = torso, 3 = head
    this._poseT = new Float32Array(n);
    this._rv = new Float32Array(15); this._tv = new Float32Array(15);
    this._dq = new Float32Array(12); this._lmS = new Float32Array(18); this._fdS = new Float32Array(12);
    this._poseTorso = false;

    let hips = -1, head = -1; const spine = [], neck = [];
    for(const i of this._sortedNodes) {
      if(!jointSet.has(i)) continue;
      const t = _poseTokens(jn[i].name);
      if(t.includes('left') || t.includes('right')) continue;
      const k = t.join('');
      if(hips < 0 && (k === 'hips' || k === 'pelvis')) hips = i;
      else if(/^(spine|chest|upperchest)/.test(k)) spine.push(i);
      else if(/^neck/.test(k)) neck.push(i);
      else if(head < 0 && k === 'head') head = i;
    }
    const F = found;
    if(hips >= 0 && head >= 0 && F.thighL !== undefined && F.thighR !== undefined &&
      F.upperArmL !== undefined && F.upperArmR !== undefined) {
      const P = (i, a) => world[i][12 + a], rv = this._rv;
      const hm = [0, 1, 2].map(a => (P(F.thighL, a) + P(F.thighR, a)) / 2);
      const am = [0, 1, 2].map(a => (P(F.upperArmL, a) + P(F.upperArmR, a)) / 2);
      const nrm = (v) => {const l = Math.hypot(...v) || 1; return v.map(x => x / l);};
      rv.set(nrm(am.map((x, a) => x - hm[a])), 0);                                   // torso up
      rv.set([0, 1, 2].map(a => P(F.thighL, a) - P(F.thighR, a)), 3);                 // hips side
      const cs = [0, 1, 2].map(a => P(F.upperArmL, a) - P(F.upperArmR, a));
      rv.set(cs, 6); rv.set(cs, 12);                                                   // chest + head side
      rv.set(nrm([0, 1, 2].map(a => P(head, a) - am[a])), 9);                          // head up
      this._poseKind[hips] = 2; this._poseT[hips] = 0;
      spine.forEach((i, k) => {this._poseKind[i] = 2; this._poseT[i] = (k + 1) / spine.length;});
      neck.forEach((i, k) => {this._poseKind[i] = 3; this._poseT[i] = (k + 1) / (neck.length + 1);});
      this._poseKind[head] = 3; this._poseT[head] = 1;
      this._poseTorso = true;
    } else console.warn(`[${this.name}] pose drive: torso/head not resolved (hips/head/thigh/arm missing)`);
    //

    // start from rest, so no old animation values stay in the nodes
    for(const inst of this.instanceNodes) {
      for(let i = 0;i < n;i++) {
        inst[i].translation.set(this.nodes[i].translation);
        inst[i].rotation.set(this.nodes[i].rotation);
        inst[i].scale.set(this.nodes[i].scale);
      }
    }
    this._poseOn = true;
  }

  disablePoseDrive() {this._poseOn = false;}

  // call from pipe.onResults
  setPoseResults(results) {
    this._poseWL = results?.worldLandmarks?.[0] ?? null;
    this._poseLM = results?.landmarks?.[0] ?? null;
  }

  _solvePose() {
    const wl = this._poseWL;
    if(!wl) return;
    const lm = this._poseLM, sorted = this._sortedNodes, nodes = this.nodes;
    const rw = this._poseRestWorld, nw = this._poseNewWorld, pl = this._poseLocal, q = this._qTmp;
    const from = this._poseFrom, to = this._poseTo, rd = this._poseRestDir;
    const kinds = this._poseKind, T = this._poseT, dq = this._dq;
    const mx = this._poseMirror ? -1 : 1, zs = this._poseZSign, minVis = this._poseMinVis;
    const k = 1 - this._poseSmooth;

    // torso / head target frames (once per frame)
    let torsoOK = false, headOK = false;
    if(this._poseTorso && _vis(lm, 11, minVis) && _vis(lm, 12, minVis) && _vis(lm, 23, minVis) && _vis(lm, 24, minVis)) {
      torsoOK = true;
      const L = this._lmS, tv = this._tv, S = this._fdS, idx = [11, 12, 23, 24, 7, 8];
      for(let n = 0;n < 6;n++) {
        const p = wl[idx[n]];
        L[n * 3] = mx * p.x; L[n * 3 + 1] = -p.y; L[n * 3 + 2] = zs * p.z;
      }
      // up = hip mid -> shoulder mid
      let ux = (L[0] + L[3]) / 2 - (L[6] + L[9]) / 2, uy = (L[1] + L[4]) / 2 - (L[7] + L[10]) / 2, uz = (L[2] + L[5]) / 2 - (L[8] + L[11]) / 2;
      let l = Math.hypot(ux, uy, uz) || 1; tv[0] = ux / l; tv[1] = uy / l; tv[2] = uz / l;
      tv[3] = L[6] - L[9]; tv[4] = L[7] - L[10]; tv[5] = L[8] - L[11];      // hips side (23 - 24)
      tv[6] = L[0] - L[3]; tv[7] = L[1] - L[4]; tv[8] = L[2] - L[5];        // chest side (11 - 12)
      _frameDelta(this._rv, 0, 3, tv, 0, 3, dq, 0, S);                      // hips
      _frameDelta(this._rv, 0, 6, tv, 0, 6, dq, 4, S);                      // chest
      if(_vis(lm, 7, minVis) && _vis(lm, 8, minVis)) {
        headOK = true;
        ux = (L[12] + L[15]) / 2 - (L[0] + L[3]) / 2; uy = (L[13] + L[16]) / 2 - (L[1] + L[4]) / 2; uz = (L[14] + L[17]) / 2 - (L[2] + L[5]) / 2;
        l = Math.hypot(ux, uy, uz) || 1; tv[9] = ux / l; tv[10] = uy / l; tv[11] = uz / l;   // neck up
        tv[12] = L[12] - L[15]; tv[13] = L[13] - L[16]; tv[14] = L[14] - L[17];              // ears side (7 - 8)
        _frameDelta(this._rv, 9, 12, tv, 9, 12, dq, 8, S);                                   // head
      }
    }

    for(let s = 0;s < sorted.length;s++) {
      const i = sorted[s], p = nodes[i].parent, f = from[i], kind = kinds[i];
      let have = false;
      if(f >= 0) {
        const t = to[i];
        if(_vis(lm, f, minVis) && _vis(lm, t, minVis)) {
          const a = wl[f], b = wl[t];
          let dx = mx * (b.x - a.x), dy = -(b.y - a.y), dz = zs * (b.z - a.z);
          const l = Math.hypot(dx, dy, dz);
          if(l > 1e-5) {
            dx /= l; dy /= l; dz /= l;
            _qFromTo(rd[i * 3], rd[i * 3 + 1], rd[i * 3 + 2], dx, dy, dz, q, 0);
            have = true;
          }
        }
      } else if(kind === 2 && torsoOK) {
        q[0] = dq[0]; q[1] = dq[1]; q[2] = dq[2]; q[3] = dq[3];
        _nlerp(q, 0, dq, 4, T[i]);                          // hips -> chest blend
        have = true;
      } else if(kind === 3 && headOK) {
        q[0] = dq[4]; q[1] = dq[5]; q[2] = dq[6]; q[3] = dq[7];
        _nlerp(q, 0, dq, 8, T[i]);                          // chest -> head blend
        have = true;
      }
      if(have) {
        _qmul(q, 0, rw, i * 4, q, 4);                        // target world
        if(p != null) _qmulConjA(nw, p * 4, q, 4, q, 0);     // target local
        else {q[0] = q[4]; q[1] = q[5]; q[2] = q[6]; q[3] = q[7];}
        _nlerp(pl, i * 4, q, 0, k);
      }
      if(p != null) _qmul(nw, p * 4, pl, i * 4, nw, i * 4);
      else {nw[i * 4] = pl[i * 4]; nw[i * 4 + 1] = pl[i * 4 + 1]; nw[i * 4 + 2] = pl[i * 4 + 2]; nw[i * 4 + 3] = pl[i * 4 + 3];}
    }
  }

  _restFromBindPose() {
    const n = this.nodes.length, W = new Array(n), tmp = mat4.create(), L = mat4.create();
    const isJoint = new Set(this.skeleton);
    for(const i of this._sortedNodes) {
      const nd = this.nodes[i], p = nd.parent;
      if(isJoint.has(i)) {
        const k = this.skeleton.indexOf(i);
        W[i] = mat4.inverse(this.inverseBindMatrices.subarray(k * 16, k * 16 + 16));
        if(p != null) mat4.multiply(mat4.inverse(W[p]), W[i], L); else mat4.copy(W[i], L);
        const d = this.decomposeMatrix(L);
        nd.translation.set(d.translation); nd.rotation.set(d.rotation); nd.scale.set(d.scale);
      } else {
        W[i] = p != null ? mat4.multiply(W[p], nd.transform) : mat4.copy(nd.transform);
        // this.composeTRS(nd.translation, nd.rotation, nd.scale, tmp);
        // W[i] = p != null ? mat4.multiply(W[p], tmp) : mat4.copy(tmp);
      }
    }
  }

  debugPoseRest() {
    const nodes = this.instanceNodes[0];
    let worst = 0, name = '';
    for(const j of this.skeleton) {
      const m = mat4.multiply(nodes[j].worldMatrix, nodes[j].inverseBindMatrix);
      let d = 0;
      for(let k = 0;k < 16;k++) d = Math.max(d, Math.abs(m[k] - (k % 5 === 0 ? 1 : 0)));
      if(d > worst) {worst = d; name = this.glb.glbJsonData.nodes[j].name;}
    }
    console.log('pose rest error', worst, name);   // ~0 is good, > 0.01 means rest != bind pose
  }

  debugPoseRest2() {
    const nodes = this.instanceNodes[0], jn = this.glb.glbJsonData.nodes;
    const I = mat4.create(), m = mat4.create(), L = mat4.create();
    let shown = 0;
    for(const i of this._sortedNodes) {
      const k = this.skeleton.indexOf(i);
      if(k < 0) continue;
      mat4.multiply(nodes[i].worldMatrix, nodes[i].inverseBindMatrix, m);
      let err = 0;
      for(let e = 0;e < 16;e++) err = Math.max(err, Math.abs(m[e] - I[e]));
      if(err > 0.01 && shown++ < 5) {
        const n = nodes[i];
        this.composeTRS(n.translation, n.rotation, n.scale, L);
        const det = L[0] * (L[5] * L[10] - L[6] * L[9]) - L[4] * (L[1] * L[10] - L[2] * L[9]) + L[8] * (L[1] * L[6] - L[2] * L[5]);
        console.log(jn[i].name, 'err', err.toFixed(4),
          'scale', Array.from(n.scale).map(v => +v.toFixed(3)),
          'rotLen', Math.hypot(...n.rotation).toFixed(4),
          'localDet', det.toFixed(3),
          'parent', n.parent != null ? jn[n.parent].name : null);
      }
    }
  }
}

// Control glb animation from exsternal src - helpers fns
const _POSE_NOISE = new Set(['mixamorig', 'j', 'bip', 'bip01', 'def', 'mch', 'cc', 'base', 'rig', 'armature', 'c']);
const _POSE_SLOTS = {
  upperArm: {L: [11, 13], R: [12, 14], names: ['arm', 'upperarm'], next: 'foreArm'},
  foreArm: {L: [13, 15], R: [14, 16], names: ['forearm', 'lowerarm'], next: null},
  thigh: {L: [23, 25], R: [24, 26], names: ['upleg', 'upperleg', 'thigh'], next: 'shin'},
  shin: {L: [25, 27], R: [26, 28], names: ['leg', 'lowerleg', 'calf', 'shin'], next: null},
};

function _poseTokens(name) {
  return (name || '').replace(/^.*[:|]/, '').replace(/([a-z])([A-Z])/g, '$1 $2')
    .toLowerCase().split(/[^a-z0-9]+/).filter(t => t && !_POSE_NOISE.has(t));
}

// allocation-free quaternion helpers (arrays + offsets, unit quaternions)
function _qmul(a, ao, b, bo, o, oo) {
  const ax = a[ao], ay = a[ao + 1], az = a[ao + 2], aw = a[ao + 3];
  const bx = b[bo], by = b[bo + 1], bz = b[bo + 2], bw = b[bo + 3];
  o[oo] = aw * bx + ax * bw + ay * bz - az * by;
  o[oo + 1] = aw * by - ax * bz + ay * bw + az * bx;
  o[oo + 2] = aw * bz + ax * by - ay * bx + az * bw;
  o[oo + 3] = aw * bw - ax * bx - ay * by - az * bz;
}
function _qmulConjA(a, ao, b, bo, o, oo) {            // conj(a) * b
  const ax = -a[ao], ay = -a[ao + 1], az = -a[ao + 2], aw = a[ao + 3];
  const bx = b[bo], by = b[bo + 1], bz = b[bo + 2], bw = b[bo + 3];
  o[oo] = aw * bx + ax * bw + ay * bz - az * by;
  o[oo + 1] = aw * by - ax * bz + ay * bw + az * bx;
  o[oo + 2] = aw * bz + ax * by - ay * bx + az * bw;
  o[oo + 3] = aw * bw - ax * bx - ay * by - az * bz;
}
function _qFromTo(ux, uy, uz, vx, vy, vz, o, oo) {    // shortest rotation u -> v (unit vectors)
  const d = ux * vx + uy * vy + uz * vz;
  if(d > 0.999999) {o[oo] = 0; o[oo + 1] = 0; o[oo + 2] = 0; o[oo + 3] = 1; return;}
  if(d < -0.999999) {
    let ax, ay, az;
    if(Math.abs(ux) < 0.9) {ax = 0; ay = uz; az = -uy;} else {ax = -uz; ay = 0; az = ux;}
    const l = Math.hypot(ax, ay, az) || 1;
    o[oo] = ax / l; o[oo + 1] = ay / l; o[oo + 2] = az / l; o[oo + 3] = 0; return;
  }
  const cx = uy * vz - uz * vy, cy = uz * vx - ux * vz, cz = ux * vy - uy * vx, w = 1 + d;
  const l = Math.hypot(cx, cy, cz, w) || 1;
  o[oo] = cx / l; o[oo + 1] = cy / l; o[oo + 2] = cz / l; o[oo + 3] = w / l;
}
function _nlerp(c, co, t, to, k) {                    // c = c + (t - c) * k, normalized
  let tx = t[to], ty = t[to + 1], tz = t[to + 2], tw = t[to + 3];
  if(c[co] * tx + c[co + 1] * ty + c[co + 2] * tz + c[co + 3] * tw < 0) {tx = -tx; ty = -ty; tz = -tz; tw = -tw;}
  const x = c[co] + (tx - c[co]) * k, y = c[co + 1] + (ty - c[co + 1]) * k;
  const z = c[co + 2] + (tz - c[co + 2]) * k, w = c[co + 3] + (tw - c[co + 3]) * k;
  const l = Math.hypot(x, y, z, w) || 1;
  c[co] = x / l; c[co + 1] = y / l; c[co + 2] = z / l; c[co + 3] = w / l;
}
function _vrot(q, qo, x, y, z, o, oo) {            // rotate vector by quaternion
  const qx = q[qo], qy = q[qo + 1], qz = q[qo + 2], qw = q[qo + 3];
  const tx = 2 * (qy * z - qz * y), ty = 2 * (qz * x - qx * z), tz = 2 * (qx * y - qy * x);
  o[oo] = x + qw * tx + (qy * tz - qz * ty);
  o[oo + 1] = y + qw * ty + (qz * tx - qx * tz);
  o[oo + 2] = z + qw * tz + (qx * ty - qy * tx);
}
function _vis(lm, i, m) {return !lm || ((lm[i].visibility ?? 1) >= m);}
// rotation that maps rest (up, side) onto target (up, side). S = scratch(12)
function _frameDelta(A, au, as, B, bu, bs, O, oo, S) {
  const tx = B[bu], ty = B[bu + 1], tz = B[bu + 2];
  _qFromTo(A[au], A[au + 1], A[au + 2], tx, ty, tz, S, 0);        // align up
  _vrot(S, 0, A[as], A[as + 1], A[as + 2], S, 4);                  // rest side after step 1
  let sx = S[4], sy = S[5], sz = S[6], d = sx * tx + sy * ty + sz * tz;
  sx -= d * tx; sy -= d * ty; sz -= d * tz;
  let px = B[bs], py = B[bs + 1], pz = B[bs + 2]; d = px * tx + py * ty + pz * tz;
  px -= d * tx; py -= d * ty; pz -= d * tz;
  const ls = Math.hypot(sx, sy, sz), lp = Math.hypot(px, py, pz);
  if(ls < 1e-6 || lp < 1e-6) {O[oo] = S[0]; O[oo + 1] = S[1]; O[oo + 2] = S[2]; O[oo + 3] = S[3]; return;}
  sx /= ls; sy /= ls; sz /= ls; px /= lp; py /= lp; pz /= lp;
  const cx = sy * pz - sz * py, cy = sz * px - sx * pz, cz = sx * py - sy * px;
  const ang = Math.atan2(cx * tx + cy * ty + cz * tz, sx * px + sy * py + sz * pz) * 0.5;
  const sn = Math.sin(ang);
  S[8] = tx * sn; S[9] = ty * sn; S[10] = tz * sn; S[11] = Math.cos(ang);   // twist around target up
  _qmul(S, 8, S, 0, O, oo);                                                // twist * align
}