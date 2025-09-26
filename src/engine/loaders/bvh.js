import MEBvh from "bvh-loader";
import MEMeshObj from "../mesh-obj";
import {mat4, vec3, quat} from "wgpu-matrix";
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

    this.scaleBoneTest = 1;

    this.primitiveIndex = primitiveIndex;

    if(!bvh.sharedState) {
      bvh.sharedState = {currentFrame: 0, timeAccumulator: 0};
    }
    this.sharedState = bvh.sharedState;

    // Reference to the skinned node containing all bones
    this.skinnedNode = this.glb.skinnedMeshNodes[skinnedNodeIndex];

    // // === APPLY Y-FLIP HERE ===
    // const flipYMat = mat4.identity();
    // mat4.scale(flipYMat, [1, -1, -1], flipYMat);

    // // Apply to root node of skinned mesh
    // mat4.multiply(flipYMat, this.skinnedNode.transform, this.skinnedNode.transform);

    console.log('this.skinnedNode', this.skinnedNode)
    // Prepare joint index map (BVH joint name -> bone index)
    // this.setupBVHJointIndices();

    this.nodeWorldMatrices = Array.from(
      {length: this.glb.nodes.length},
      () => mat4.identity()
    );


    this.startTime = performance.now() / 1000; // seconds
    this.MAX_BONES = 100;

    this.skeleton = []; // array of joint node indices
    this.inverseBindMatrices = []; // Float32Array for each joint

    this.initInverseBindMatrices();
    // this.computeNodeWorldMatrices();
    this.makeSkeletal();

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
    // frendly blender
    this.glb.animationIndex = 0;
    for (let j = 0 ; j < this.glb.glbJsonData.animations.length; j++) {
      if (this.glb.glbJsonData.animations[j].name.indexOf('Armature') !== -1) {
        this.glb.animationIndex = j;
      }
    }
  }

  initInverseBindMatrices(skinIndex = 0) {
    const skin = this.glb.skins[skinIndex];
    const invBindAccessorIndex = skin.inverseBindMatrices; // usually a number
    if(invBindAccessorIndex === undefined || invBindAccessorIndex === null) {
      console.warn('No inverseBindMatrices accessor for skin', skinIndex);
      return;
    }
    const invBindArray = this.getAccessorArray(this.glb, invBindAccessorIndex);
    // ✅ store directly as typed array (one big contiguous Float32Array)
    this.inverseBindMatrices = invBindArray;
    console.log('Inverse bind matrices loaded:', this.inverseBindMatrices.length, 'bones');
  }

  setupBVHJointIndices() {
    // this.bvh.jointIndices = {};
    // const skin = this.glb.skins[this.skinnedNode.skin]; // get skin for this node
    // const bones = skin.joints; // indices of joints in GLB
    // const jointNames = Object.keys(this.bvh.joints);
    // jointNames.forEach((name, i) => {
    //   if(i < bones.length) {
    //     this.bvh.jointIndices[name] = i;
    //   }
    // });
  }

  update(deltaTime) {
    const frameTime = 1 / this.fps;
    this.sharedState.timeAccumulator += deltaTime;
    while(this.sharedState.timeAccumulator >= frameTime) {
      this.sharedState.currentFrame = (this.sharedState.currentFrame + 1) % this.bvh.keyframes.length;
      this.sharedState.timeAccumulator -= frameTime;
    }
    // const frame = this.sharedState.currentFrame;
    const currentTime = performance.now() / 5000 - this.startTime;
    const boneMatrices = new Float32Array(this.MAX_BONES * 16);
    if(this.glb.glbJsonData.animations && this.glb.glbJsonData.animations.length > 0) {
      this.updateSingleBoneCubeAnimation(this.glb.glbJsonData.animations[this.glb.animationIndex], this.glb.nodes, currentTime, boneMatrices)
    }
  }

  applyBVHToGLB(frameIndex) {
    const keyframe = this.bvh.keyframes[frameIndex]; // flat array
    const skin = this.glb.skins[this.skinnedNode.skin];
    const numBones = skin.joints.length;
    const bonesData = new Float32Array(16 * numBones); // final matrices per bone

    const scale = -0.1; // adjust if mesh too small/large
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

          // mat4.multiply(finalBoneMat, finalMat, invBind); // finalBoneMat = finalMat * invBind
          mat4.multiply(finalMat, invBind, finalBoneMat); // finalBoneMat = finalMat * invBind

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
    const byteOffset = (bufferView.byteOffset || 0) + (accessor.byteOffset || 0);
    const byteLength =
      accessor.count *
      this.getNumComponents(accessor.type) *
      (accessor.componentType === 5126 ? 4 : 2); // adjust per type
    const bufferDef =  glb.glbBinaryBuffer;
    // ✅ now just slice:
    const slice = this.getBufferSlice(bufferDef, byteOffset, byteLength);
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

  getAccessorTypeForChannel(path) {
    switch(path) {
      case "translation": return "VEC3";
      case "rotation": return "VEC4";
      case "scale": return "VEC3";
      case "weights": return "VECN"; // if needed
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

  // --- helpers ---
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

  // compose translation/rotation/scale into 4x4
  composeTRS(t, r, s) {
    // assumes r is quaternion [x,y,z,w], s,t are vec3
    const mat = quatToMat4(r);
    mat[0] *= s[0]; mat[1] *= s[0]; mat[2] *= s[0];
    mat[4] *= s[1]; mat[5] *= s[1]; mat[6] *= s[1];
    mat[8] *= s[2]; mat[9] *= s[2]; mat[10] *= s[2];
    mat[12] = t[0]; mat[13] = t[1]; mat[14] = t[2]; mat[15] = 1;
    return mat;
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

  base64ToArrayBuffer(base64) {
    const binary = atob(base64.split(',')[1]);
    const len = binary.length;
    const buffer = new ArrayBuffer(len);
    const view = new Uint8Array(buffer);
    for(let i = 0;i < len;i++) view[i] = binary.charCodeAt(i);
    return buffer;
  }

  // Compose TRS to a 4×4
  composeMatrix(translation, rotationQuat, scale) {
    const m = mat4.identity();
    mat4.translate(m, translation, m);
    const rot = mat4.fromQuat(rotationQuat);
    mat4.multiply(m, rot, m);
    mat4.scale(m, scale, m);
    return m;

    // const m = mat4.identity();
    // mat4.translate(m, translation, m);
    // const rot = mat4.fromQuat(rotationQuat);
    // mat4.multiply(m, rot, m);
    // mat4.scale(m, scale, m);

    // // Flip Y globally
    // const flipY = mat4.identity();
    // mat4.scale(flipY, [1, 1, -1], flipY);
    // mat4.multiply(m, flipY, m);

    // return m;

  }

  // Decompose a 4×4 to TRS (if you need on load)
  decomposeMatrix2(m) {
    const t = vec3.fromValues(m[12], m[13], m[14]);
    // get scale
    const sx = vec3.length([m[0], m[1], m[2]]);
    const sy = vec3.length([m[4], m[5], m[6]]);
    const sz = vec3.length([m[8], m[9], m[10]]);
    const s = [sx, sy, sz];
    // normalize rotation part
    const rotMat = [
      m[0] / sx, m[1] / sx, m[2] / sx, 0,
      m[4] / sy, m[5] / sy, m[6] / sy, 0,
      m[8] / sz, m[9] / sz, m[10] / sz, 0,
      0, 0, 0, 1
    ];
    const rQuat = quat.fromMat(rotMat);
    return {translation: t, rotation: rQuat, scale: s};
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

  quatToEuler(q) {
    const [x, y, z, w] = q;
    const ysqr = y * y;

    // roll (X-axis rotation)
    const t0 = +2.0 * (w * x + y * z);
    const t1 = +1.0 - 2.0 * (x * x + ysqr);
    const roll = Math.atan2(t0, t1);

    // pitch (Y-axis rotation)
    let t2 = +2.0 * (w * y - z * x);
    t2 = t2 > 1 ? 1 : t2;
    t2 = t2 < -1 ? -1 : t2;
    const pitch = Math.asin(t2);

    // yaw (Z-axis rotation)
    const t3 = +2.0 * (w * z + x * y);
    const t4 = +1.0 - 2.0 * (ysqr + z * z);
    const yaw = Math.atan2(t3, t4);

    return [roll, pitch, yaw]; // in radians
  }

  updateSingleBoneCubeAnimation(glbAnimation, nodes, time, boneMatrices) {
    const channels = glbAnimation.channels;
    const samplers = glbAnimation.samplers;

    // --- Map channels per node for faster lookup
    const nodeChannels = new Map();
    for(const channel of channels) {
      if(!nodeChannels.has(channel.target.node)) nodeChannels.set(channel.target.node, []);
      nodeChannels.get(channel.target.node).push(channel);
    }

    // --- Loop only over skeleton bones
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
        const v0 = outputArray.subarray(i * numComponents, (i + 1) * numComponents);
        const v1 = outputArray.subarray(
          Math.min(i + 1, inputTimes.length - 1) * numComponents,
          Math.min(i + 2, inputTimes.length) * numComponents
        );

        // --- Apply animation
        if(path === "translation") {
          for(let k = 0;k < 3;k++)
            node.translation[k] = v0[k] * (1 - factor) + v1[k] * factor;
        } else if(path === "scale") {
          for(let k = 0;k < 3;k++)
            node.scale[k] = v0[k] * (1 - factor) + v1[k] * factor;
        } else if(path === "rotation") {
          this.slerp(v0, v1, factor, node.rotation);
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
        // mat4.copy(node.transform, node.worldMatrix);
      } else {
        // root node — copy local, but reset scale if needed
        mat4.copy(node.transform, node.worldMatrix);
        // optional: remove Blender scale

      }

      mat4.scale(node.worldMatrix, [this.scaleBoneTest, this.scaleBoneTest, this.scaleBoneTest], node.worldMatrix);

      if(node.children) {
        for(const childIndex of node.children) computeWorld(childIndex);
      }
    };

    // start from roots (no parent)
    for(let i = 0;i < nodes.length;i++) {
      if(nodes[i].parent === null || nodes[i].parent === undefined) {
        computeWorld(i);
      }
    }




    for(let j = 0;j < this.skeleton.length;j++) {
      const jointNode = nodes[this.skeleton[j]];
      const finalMat = mat4.create();
      mat4.multiply(jointNode.worldMatrix, jointNode.inverseBindMatrix, finalMat);
      boneMatrices.set(finalMat, j * 16);
    }

    // --- Upload to GPU
    this.device.queue.writeBuffer(this.bonesBuffer, 0, boneMatrices);
    return boneMatrices;
  }

}

