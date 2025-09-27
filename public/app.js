(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";

var _world = _interopRequireDefault(require("../src/world.js"));
var _loaderObj = require("../src/engine/loader-obj.js");
var _utils = require("../src/engine/utils.js");
var _bvh = require("../src/engine/loaders/bvh.js");
var _webgpuGltf = require("../src/engine/loaders/webgpu-gltf.js");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
let TEST_ANIM = new _world.default({
  useSingleRenderPass: true,
  canvasSize: 'fullscreen',
  mainCameraParams: {
    type: 'WASD',
    responseCoef: 1000
  },
  clearColor: {
    r: 0,
    b: 0.122,
    g: 0.122,
    a: 1
  }
}, () => {
  addEventListener('AmmoReady', async () => {
    setTimeout(() => {
      app.cameras.WASD.yaw = -0.03;
      app.cameras.WASD.pitch = -0.49;
      app.cameras.WASD.position[2] = 0;
      app.cameras.WASD.position[1] = 3.76;
    }, 500);
    (0, _loaderObj.downloadMeshes)({
      cube: "./res/meshes/blender/cube.obj"
    }, onGround, {
      scale: [20, 1, 20]
    });
    // const path = 'https://raw.githubusercontent.com/zlatnaspirala/Matrix-Engine-BVH-test/main/javascript-bvh/example.bvh';
    const path = 'res/meshes/glb/glb-test1.bvh';
    var glbFile = await fetch("res/meshes/glb/test.glb").then(res => res.arrayBuffer().then(buf => (0, _webgpuGltf.uploadGLBModel)(buf, TEST_ANIM.device)));
    TEST_ANIM.addGlbObj({
      // scale: [1,1,1],
      position: {
        x: 0,
        y: -4,
        z: -20
      },
      scale: [10, 10, 10],
      name: 'firstGlb',
      texturesPaths: ['./res/meshes/glb/textures/mutant.png']
    }, null, glbFile);

    // loadBVH(path).then(async (BVHANIM) => {
    //   var glbFile = await fetch(
    //     "res/meshes/glb/test.glb")
    //     .then(res => res.arrayBuffer().then(buf => uploadGLBModel(buf, TEST_ANIM.device)));
    //   TEST_ANIM.addGlbObj({
    //     // scale: [1,1,1],
    //     scale: [10, 10, 10],
    //     name: 'firstGlb',
    //     texturesPaths: ['./res/textures/rust.jpg'],
    //   }, BVHANIM, glbFile);
    // });
  });
  function onGround(m) {
    TEST_ANIM.addLight();
    TEST_ANIM.addMeshObj({
      position: {
        x: 0,
        y: -5,
        z: -10
      },
      rotation: {
        x: 0,
        y: 0,
        z: 0
      },
      rotationSpeed: {
        x: 0,
        y: 0,
        z: 0
      },
      texturesPaths: ['./res/meshes/blender/cube.png'],
      name: 'ground',
      mesh: m.cube,
      physics: {
        enabled: false,
        mass: 0,
        geometry: "Cube"
      }
    });
  }
});
// just for dev
window.app = TEST_ANIM;

},{"../src/engine/loader-obj.js":22,"../src/engine/loaders/bvh.js":23,"../src/engine/loaders/webgpu-gltf.js":24,"../src/engine/utils.js":28,"../src/world.js":37}],2:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _bvhLoader = require("./module/bvh-loader");
var _default = exports.default = _bvhLoader.MEBvh;

},{"./module/bvh-loader":3}],3:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.MEBvhJoint = exports.MEBvh = void 0;
exports.degToRad = degToRad;
exports.dot3vs1 = dot3vs1;
exports.euler2mat = euler2mat;
exports.mat2euler = mat2euler;
exports.multiply = multiply;
var _webgpuMatrix = require("webgpu-matrix");
/**
 * @description Manual convert python script BVH
 * from https://github.com/dabeschte/npybvh to the JS.
 * @author Nikola Lukic
 * @license GPL-V3
 */

function degToRad(degrees) {
  return degrees * Math.PI / 180;
}
;
function arraySum3(a, b) {
  var rez1 = a[0] + b[0];
  var rez2 = a[1] + b[1];
  var rez3 = a[2] + b[2];
  return [rez1, rez2, rez3];
}
function deg2rad(degrees) {
  return degrees * (Math.PI / 180);
}
function npdeg2rad(degrees) {
  return [degrees[0] * (Math.PI / 180), degrees[1] * (Math.PI / 180), degrees[2] * (Math.PI / 180)];
}
function rad2deg(radians) {
  return radians * (180 / Math.PI);
}
function byId(id) {
  return document.getElementById(id);
}

// fix for .dot N-dim vs 1D-dim Array
function dot3vs1(a, b) {
  var aNumRows = a.length,
    aNumCols = a[0].length,
    bNumRows = b.length;
  var REZ1 = 0,
    REZ2 = 0,
    REZ3 = 0;
  if (aNumRows == 3 && aNumCols == 3 && bNumRows == 3) {
    for (var j = 0; j < a.length; j++) {
      // First root of 3x3 a.
      REZ1 += a[0][j] * b[j];
      REZ2 += a[1][j] * b[j];
      REZ3 += a[2][j] * b[j];
    }
    var finalRez = [REZ1, REZ2, REZ3];
    return finalRez;
  } else {
    console.error("Bad arguments for dot3vs1");
  }
}
function multiply(a, b) {
  var aNumRows = a.length,
    aNumCols = a[0].length,
    bNumRows = b.length,
    bNumCols = b[0].length,
    m = new Array(aNumRows);
  for (var r = 0; r < aNumRows; ++r) {
    m[r] = new Array(bNumCols);
    for (var c = 0; c < bNumCols; ++c) {
      m[r][c] = 0;
      for (var i = 0; i < aNumCols; ++i) {
        m[r][c] += a[r][i] * b[i][c];
      }
    }
  }
  return m;
}

/**
 * @description
 * Euler's rotation theorem tells us that any rotation in 3D can be described by 3
 * angles.  Let's call the 3 angles the *Euler angle vector* and call the angles
 * in the vector :Math:`alpha`, :Math:`beta` and :Math:`gamma`.  The vector is [
 * :Math:`alpha`, :Math:`beta`. :Math:`gamma` ] and, in this description, the
 * order of the parameters specifies the order in which the rotations occur (so
 * the rotation corresponding to :Math:`alpha` is applied first).
 * @source https://github.com/matthew-brett/transforms3d/blob/master/transforms3d/euler.py
 */

// map axes strings to/from tuples of inner axis, parity, repetition, frame
var _AXES2TUPLE = {
  'sxyz': [0, 0, 0, 0],
  'sxyx': [0, 0, 1, 0],
  'sxzy': [0, 1, 0, 0],
  'sxzx': [0, 1, 1, 0],
  'syzx': [1, 0, 0, 0],
  'syzy': [1, 0, 1, 0],
  'syxz': [1, 1, 0, 0],
  'syxy': [1, 1, 1, 0],
  'szxy': [2, 0, 0, 0],
  'szxz': [2, 0, 1, 0],
  'szyx': [2, 1, 0, 0],
  'szyz': [2, 1, 1, 0],
  'rzyx': [0, 0, 0, 1],
  'rxyx': [0, 0, 1, 1],
  'ryzx': [0, 1, 0, 1],
  'rxzx': [0, 1, 1, 1],
  'rxzy': [1, 0, 0, 1],
  'ryzy': [1, 0, 1, 1],
  'rzxy': [1, 1, 0, 1],
  'ryxy': [1, 1, 1, 1],
  'ryxz': [2, 0, 0, 1],
  'rzxz': [2, 0, 1, 1],
  'rxyz': [2, 1, 0, 1],
  'rzyz': [2, 1, 1, 1]
};

// axis sequences for Euler angles
var _NEXT_AXIS = [1, 2, 0, 1];
function euler2mat(ai, aj, ak, axes) {
  if (typeof axes === 'undefined') var axes = 'sxyz';
  // Return rotation matrix from Euler angles and axis sequence.
  // Parameters
  /*
  ai : float
      First rotation angle (according to `axes`).
  aj : float
      Second rotation angle (according to `axes`).
  ak : float
      Third rotation angle (according to `axes`).
  axes : str, optional
      Axis specification; one of 24 axis sequences as string or encoded
      tuple - e.g. ``sxyz`` (the default).
  Returns
  -------
  mat : array (3, 3)
      Rotation matrix or affine.
  Examples
  --------
  >>> R = euler2mat(1, 2, 3, 'syxz')
  >>> np.allclose(np.sum(R[0]), -1.34786452)
  True
  >>> R = euler2mat(1, 2, 3, (0, 1, 0, 1))
  >>> np.allclose(np.sum(R[0]), -0.383436184)
  True */
  try {
    var firstaxis = _AXES2TUPLE[axes][0],
      parity = _AXES2TUPLE[axes][1],
      repetition = _AXES2TUPLE[axes][2],
      frame = _AXES2TUPLE[axes][3];
  } catch (AttributeError) {
    // _TUPLE2AXES[axes]  # validation
    // firstaxis, parity, repetition, frame = axes
    console.error("AttributeError: ", AttributeError);
  }
  var i = firstaxis;
  var j = _NEXT_AXIS[i + parity];
  var k = _NEXT_AXIS[i - parity + 1];
  if (frame) {
    ai = ak;
    ak = ai;
  }
  if (parity) {
    ai = -ai;
    aj = -aj;
    ak = -ak;
  }
  var si = Math.sin(ai);
  var sj = Math.sin(aj);
  var sk = Math.sin(ak);
  var ci = Math.cos(ai);
  var cj = Math.cos(aj);
  var ck = Math.cos(ak);
  var cc = ci * ck;
  var cs = ci * sk;
  var sc = si * ck;
  var ss = si * sk;

  // M = np.eye(3)
  var M = [[1., 0., 0], [0., 1., 0], [0., 0., 1]];
  if (repetition) {
    M[i][i] = cj;
    M[i][j] = sj * si;
    M[i][k] = sj * ci;
    M[j][i] = sj * sk;
    M[j][j] = -cj * ss + cc;
    M[j][k] = -cj * cs - sc;
    M[k][i] = -sj * ck;
    M[k][j] = cj * sc + cs;
    M[k][k] = cj * cc - ss;
  } else {
    M[i][i] = cj * ck;
    M[i][j] = sj * sc - cs;
    M[i][k] = sj * cc + ss;
    M[j][i] = cj * sk;
    M[j][j] = sj * ss + cc;
    M[j][k] = sj * cs - sc;
    M[k][i] = -sj;
    M[k][j] = cj * si;
    M[k][k] = cj * ci;
  }
  return M;
}

/**
 * @description
 * How to calculate the angle from rotation matrix.
 */
function mat2euler(M, rad2deg_flag) {
  var pitch_1, pitch_2, roll_1, roll_2, yaw_1, yaw_2, pitch, roll, yaw;
  if (M[2][0] != 1 & M[2][0] != -1) {
    pitch_1 = -1 * Math.asin(M[2][0]);
    pitch_2 = Math.PI - pitch_1;
    roll_1 = Math.atan2(M[2][1] / Math.cos(pitch_1), M[2][2] / Math.cos(pitch_1));
    roll_2 = Math.atan2(M[2][1] / Math.cos(pitch_2), M[2][2] / Math.cos(pitch_2));
    yaw_1 = Math.atan2(M[1][0] / Math.cos(pitch_1), M[0][0] / Math.cos(pitch_1));
    yaw_2 = Math.atan2(M[1][0] / Math.cos(pitch_2), M[0][0] / Math.cos(pitch_2));
    pitch = pitch_1;
    roll = roll_1;
    yaw = yaw_1;
  } else {
    yaw = 0;
    if (M[2][0] == -1) {
      pitch = Math.PI / 2;
      roll = yaw + Math.atan2(M[0][1], M[0][2]);
    } else {
      pitch = -Math.PI / 2;
      roll = -1 * yaw + Math.atan2(-1 * M[0][1], -1 * M[0][2]);
    }
  }
  if (typeof rad2deg_flag !== "undefined") {
    // convert from radians to degrees
    roll = roll * 180 / Math.PI;
    pitch = pitch * 180 / Math.PI;
    yaw = yaw * 180 / Math.PI;
  }
  return [roll, pitch, yaw];
}
class MEBvhJoint {
  constructor(name, parent) {
    this.name = name;
    this.parent = parent;
    this.offset = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
    this.channels = [];
    this.children = [];

    // New: where in the frame array this joint’s channels start ???
    this.channelOffset = 0;
  }
  add_child(child) {
    this.children.push(child);
  }
  __repr__() {
    return this.name;
  }
  position_animated() {
    var detFlag = false;
    for (const item in this.channels) {
      if (this.channels[item].endsWith("position") == true) {
        detFlag = true;
      }
    }
    return detFlag;
  }
  rotation_animated() {
    var detFlag = false;
    for (const item in this.channels) {
      if (this.channels[item].endsWith("rotation") == true) {
        detFlag = true;
      }
    }
    return detFlag;
  }
  createIdentityMatrix() {
    // Returns a flat Float32Array of length 16 (column-major)
    return new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
  }
  matrixFromKeyframe(frameData) {
    const m = this.createIdentityMatrix();
    let t = [0, 0, 0];
    let r = [0, 0, 0];
    for (let i = 0; i < this.channels.length; i++) {
      const channel = this.channels[i];
      const value = frameData[this.channelOffset + i];
      // channelOffset = index into frameData where this joint’s values start

      switch (channel) {
        case 'Xposition':
          t[0] = value;
          break;
        case 'Yposition':
          t[1] = value;
          break;
        case 'Zposition':
          t[2] = value;
          break;
        case 'Xrotation':
          r[0] = degToRad(value);
          break;
        case 'Yrotation':
          r[1] = degToRad(value);
          break;
        case 'Zrotation':
          r[2] = degToRad(value);
          break;
      }
    }

    // Apply translation
    _webgpuMatrix.mat4.translate(m, t, m);
    // Apply rotations in BVH order (important!)
    _webgpuMatrix.mat4.rotateX(m, r[0], m);
    _webgpuMatrix.mat4.rotateY(m, r[1], m);
    _webgpuMatrix.mat4.rotateZ(m, r[2], m);
    return m;
  }
}
exports.MEBvhJoint = MEBvhJoint;
class MEBvh {
  constructor() {
    this.joints = {};
    this.root = null;
    this.keyframes = null;
    this.frames = 0;
    this.fps = 0;
    this.myName = "MATRIX-ENGINE-BVH";
    // new
    this.jointOrder = []; // array to store joints in order
  }
  computeJointOrder() {
    this.jointOrder = [];
    const traverse = joint => {
      this.jointOrder.push(joint.name);
      for (const child of joint.children) {
        traverse(child);
      }
    };
    traverse(this.root); // root is your MEBvhJoint
  }
  computeChannelOffsets() {
    let offset = 0;
    const walk = joint => {
      joint.channelOffset = offset; // assign
      offset += joint.channels.length; // advance
      for (const child of joint.children) {
        walk(child);
      }
    };
    if (this.root) walk(this.root);
    this.totalChannels = offset; // store total for frame allocation
  }
  async parse_file(link) {
    return new Promise((resolve, reject) => {
      fetch(link).then(event => {
        event.text().then(text => {
          var hierarchy = text.split("MOTION")[0];
          var motion = text.split("MOTION")[1];
          var newLog = document.createElement("div");
          newLog.innerHTML += '<h2>Hierarchy</h2>';
          newLog.innerHTML += '<p>' + hierarchy + '</p>';
          var newLog2 = document.createElement("span");
          newLog2.innerHTML += '<h2>Motion</h2>';
          newLog2.innerHTML += '<p class="paragraf fixHeight" >' + motion + '</p>';
          if (byId && byId('log') !== null) {
            byId('log').appendChild(newLog2);
            byId('log').appendChild(newLog);
          }
          this._parse_hierarchy(hierarchy);
          this.computeJointOrder();
          this.computeChannelOffsets(); // <— must do this here NEW
          this.parse_motion(motion);
          resolve();
        });
      });
    });
  }
  _parse_hierarchy(text) {
    var lines = text.split(/\s*\n+\s*/);
    var joint_stack = [];
    for (var key in lines) {
      var line = lines[key];
      var words = line.split(/\s+/);
      var instruction = words[0];
      var parent = null;
      if (instruction == "JOINT" || instruction == "ROOT") {
        if (instruction == "JOINT") {
          // -1 py -> last item
          parent = joint_stack[joint_stack.length - 1];
        } else {
          parent = null;
        }
        var joint = new MEBvhJoint(words[1], parent);
        this.joints[joint.name] = joint;
        if (parent != null) {
          parent.add_child(joint);
        }
        joint_stack.push(joint);
        if (instruction == "ROOT") {
          this.root = joint;
        }
      } else if (instruction == "CHANNELS") {
        for (var j = 2; j < words.length; j++) {
          joint_stack[joint_stack.length - 1].channels.push(words[j]);
        }
      } else if (instruction == "OFFSET") {
        for (var j = 1; j < words.length; j++) {
          joint_stack[joint_stack.length - 1].offset[j - 1] = parseFloat(words[j]);
        }
      } else if (instruction == "End") {
        var joint = new MEBvhJoint(joint_stack[joint_stack.length - 1].name + "_end", joint_stack[joint_stack.length - 1]);
        joint_stack[joint_stack.length - 1].add_child(joint);
        joint_stack.push(joint);
        this.joints[joint.name] = joint;
      } else if (instruction == "}") {
        joint_stack.pop();
      }
    }
  }
  _add_pose_recursive(joint, offset, poses) {
    var newLog1 = document.createElement("span");
    newLog1.innerHTML += '<h2>add_pose_recursive</h2>';
    newLog1.innerHTML += '<p class="paragraf" >Joint Name: ' + joint.name + '</p>';
    newLog1.innerHTML += '<p>joint.parent    : ' + (joint.parent != null ? joint.parent.name : 'null') + '</p>';
    newLog1.innerHTML += '<p>joint.offset    : ' + joint.offset + '</p>';
    newLog1.innerHTML += '<p>joint.children.length  : ' + joint.children.length + '</p>';
    joint.children.length != 0 ? newLog1.innerHTML += '<p> Childrens: ' : newLog1.innerHTML += 'No Childrens ';
    joint.children.forEach(iJoint => {
      newLog1.innerHTML += ' ' + iJoint['name'] + ' , ';
    });
    newLog1.innerHTML += '</p>';
    newLog1.innerHTML += '<p>Argument offset : ' + offset + '</p>';
    byId('log').appendChild(newLog1);
    var pose = arraySum3(joint.offset, offset);
    poses.push(pose);
    for (var c in joint.children) {
      this._add_pose_recursive(joint.children[c], pose, poses);
    }
  }
  plot_hierarchy() {
    // import matplotlib.pyplot as plt
    // from mpl_toolkits.mplot3d import axes3d, Axes3D

    var poses = [];
    this._add_pose_recursive(this.root, [0, 0, 0], poses);

    // pos = np.array(poses);

    /* Draw staff DISABLED
        fig = plt.figure()
        ax = fig.add_subplot(111, projection='3d')
        ax.scatter(pos[:, 0], pos[:, 2], pos[:, 1])
        ax.set_xlim(-30, 30)
        ax.set_ylim(-30, 30)
        ax.set_zlim(-30, 30)
        plt.show() */
  }
  parse_motion(text) {
    var lines = text.split(/\s*\n+\s*/);
    var frame = 0;
    for (var key in lines) {
      var line = lines[key];
      if (line == "") {
        continue;
      }
      var words = line.split(/\s+/);
      if (line.startsWith("Frame Time:")) {
        this.fps = Math.round(1 / parseFloat(words[2]));
        continue;
      }
      if (line.startsWith("Frames:")) {
        this.frames = parseInt(words[1]);
        continue;
      }
      if (this.keyframes == null) {
        // OK this is just costruction (define) with random values.
        var localArr = Array.from(Array(this.frames), () => new Array(words.length));
        this.keyframes = localArr;
      }
      for (var angle_index = 0; angle_index < words.length; angle_index++) {
        this.keyframes[frame][angle_index] = parseFloat(words[angle_index]);
      }
      frame += 1;
    }
  }
  _extract_rotation(frame_pose, index_offset, joint) {
    var local_rotation = [0, 0, 0],
      M_rotation;
    for (var key in joint.channels) {
      var channel = joint.channels[key];
      if (channel.endsWith("position")) {
        continue;
      }
      if (channel == "Xrotation") {
        local_rotation[0] = frame_pose[index_offset];
      } else if (channel == "Yrotation") {
        local_rotation[1] = frame_pose[index_offset];
      } else if (channel == "Zrotation") {
        local_rotation[2] = frame_pose[index_offset];
      } else {
        console.warn("Unknown channel {channel}");
        // raise Exception(f"Unknown channel {channel}");
      }
      index_offset += 1;
    }
    local_rotation = npdeg2rad(local_rotation);
    M_rotation = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
    for (key in joint.channels) {
      var channel = joint.channels[key];
      if (channel.endsWith("position")) {
        continue;
      }
      var euler_rot;
      if (channel == "Xrotation") {
        // console.warn("local_rotation " + local_rotation);
        euler_rot = [local_rotation[0], 0., 0.];
      } else if (channel == "Yrotation") {
        euler_rot = [0., local_rotation[1], 0.];
      } else if (channel == "Zrotation") {
        euler_rot = [0., 0., local_rotation[2]];
      } else {
        console.warn("Unknown channel {channel}");
      }
      var M_channel = euler2mat(euler_rot[0], euler_rot[1], euler_rot[2], euler_rot[3]);
      var M_rotation = multiply(M_rotation, M_channel);
    }
    return [M_rotation, index_offset];
  }
  _extract_position(joint, frame_pose, index_offset) {
    var offset_position = [0, 0, 0];
    for (var key in joint.channels) {
      var channel = joint.channels[key];
      if (channel.endsWith("rotation")) {
        continue;
      }
      if (channel == "Xposition") {
        offset_position[0] = frame_pose[index_offset];
      } else if (channel == "Yposition") {
        offset_position[1] = frame_pose[index_offset];
      } else if (channel == "Zposition") {
        offset_position[2] = frame_pose[index_offset];
      } else {
        console.warn("Unknown channel {channel}");
        // raise Exception(f"Unknown channel {channel}")
      }
      index_offset += 1;
    }
    return [offset_position, index_offset];
  }
  _recursive_apply_frame(joint, frame_pose, index_offset, p, r, M_parent, p_parent) {
    var joint_index;
    if (joint.position_animated()) {
      var local = this._extract_position(joint, frame_pose, index_offset);
      var offset_position = local[0],
        index_offset = local[1];
    } else {
      var offset_position = [0, 0, 0];
    }
    if (joint.channels.length == 0) {
      var local2 = 0;
      for (var item in this.joints) {
        if (joint.name == item) {
          joint_index = local2;
        }
        local2++;
      }
      p[joint_index] = arraySum3(p_parent, dot3vs1(M_parent, joint.offset));
      r[joint_index] = mat2euler(M_parent);
      return index_offset;
    }
    if (joint.rotation_animated()) {
      var local2 = this._extract_rotation(frame_pose, index_offset, joint);
      var M_rotation = local2[0];
      index_offset = local2[1];
    } else {
      var M_rotation = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
    }
    var M = multiply(M_parent, M_rotation);
    // https://www.khanacademy.org/math/precalculus/x9e81a4f98389efdf:matrices/x9e81a4f98389efdf:adding-and-subtracting-matrices/e/matrix_addition_and_subtraction

    var position = arraySum3(p_parent, dot3vs1(M_parent, joint.offset));
    position = arraySum3(position, offset_position);
    var rotation = mat2euler(M, "rad2deg");

    // just find by id
    var local = 0;
    for (const item in this.joints) {
      if (joint.name == item) {
        joint_index = local;
      }
      local++;
    }
    p[joint_index] = position;
    r[joint_index] = rotation;
    for (var c in joint.children) {
      index_offset = this._recursive_apply_frame(joint.children[c], frame_pose, index_offset, p, r, M, position);
    }
    return index_offset;
  }
  frame_pose(frame) {
    var jointLength = 0;
    for (var x in this.joints) {
      jointLength++;
    }
    var p = Array.from(Array(jointLength), () => [0, 0, 0]);
    var r = Array.from(Array(jointLength), () => [0, 0, 0]);
    var frame_pose = this.keyframes[frame];
    var M_parent = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
    M_parent[0][0] = 1;
    M_parent[1][1] = 1;
    M_parent[2][2] = 1;
    this._recursive_apply_frame(this.root, frame_pose, 0, p, r, M_parent, [0, 0, 0]);
    return [p, r];
  }
  all_frame_poses() {
    var jointLength = 0;
    for (var x in this.joints) {
      jointLength++;
    }
    var p = Array.from({
      length: this.frames
    }, () => Array.from({
      length: jointLength
    }, () => [0, 0, 0]));
    var r = Array.from({
      length: this.frames
    }, () => Array.from({
      length: jointLength
    }, () => [0, 0, 0]));
    for (var frame = 0; frame < this.keyframes.length; frame++) {
      var local3 = this.frame_pose(frame);
      p[frame] = local3[0];
      r[frame] = local3[1];
    }
    return [p, r];
  }
  _plot_pose(p, r, fig, ax) {
    /* 
      _plot_pose(p, r, fig=None, ax=None) {
        import matplotlib.pyplot as plt
        from mpl_toolkits.mplot3d import axes3d, Axes3D
      if fig is None:
          fig = plt.figure()
      if ax is None:
          ax = fig.add_subplot(111, projection='3d')
      ax.cla()
      ax.scatter(p[:, 0], p[:, 2], p[:, 1])
      ax.set_xlim(-30, 30)
      ax.set_ylim(-30, 30)
      ax.set_zlim(-1, 59)
      plt.draw()
      plt.pause(0.001)
    */
  }

  // Meybe helps for draw
  // plot_frame(frame, fig=None, ax=None) {
  plot_frame(frame, fig, ax) {
    // ????
    // p, (r = this.frame_pose(frame));
    // this._plot_pose(p, r, fig, ax);
  }
  joint_names() {
    var keys = [];
    for (var key in this.joints) {
      keys.push(key);
    }
    return keys;
  }
  plot_all_frames() {
    /*
      import matplotlib.pyplot as plt
      from mpl_toolkits.mplot3d import axes3d, Axes3D
      fig = plt.figure()
      ax = fig.add_subplot(111, projection='3d')
      for i in range(self.frames) {
          self.plot_frame(i, fig, ax);
      } 
    */
  }
  __repr__() {
    return `BVH.JS ${this.joints.keys().length} joints, ${this.frames} frames`;
  }
}
exports.MEBvh = MEBvh;

},{"webgpu-matrix":15}],4:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.RANDOM = exports.EPSILON = exports.ARRAY_TYPE = exports.ANGLE_ORDER = void 0;
exports.equals = equals;
exports.round = round;
exports.setMatrixArrayType = setMatrixArrayType;
exports.toDegree = toDegree;
exports.toRadian = toRadian;
/**
 * Common utilities
 * @module glMatrix
 */

// Configuration Constants
var EPSILON = exports.EPSILON = 0.000001;
var ARRAY_TYPE = exports.ARRAY_TYPE = typeof Float32Array !== "undefined" ? Float32Array : Array;
var RANDOM = exports.RANDOM = Math.random;
var ANGLE_ORDER = exports.ANGLE_ORDER = "zyx";

/**
 * Symmetric round
 * see https://www.npmjs.com/package/round-half-up-symmetric#user-content-detailed-background
 *
 * @param {Number} a value to round
 */
function round(a) {
  if (a >= 0) return Math.round(a);
  return a % 0.5 === 0 ? Math.floor(a) : Math.round(a);
}

/**
 * Sets the type of array used when creating new vectors and matrices
 *
 * @param {Float32ArrayConstructor | ArrayConstructor} type Array type, such as Float32Array or Array
 */
function setMatrixArrayType(type) {
  exports.ARRAY_TYPE = ARRAY_TYPE = type;
}
var degree = Math.PI / 180;
var radian = 180 / Math.PI;

/**
 * Convert Degree To Radian
 *
 * @param {Number} a Angle in Degrees
 */
function toRadian(a) {
  return a * degree;
}

/**
 * Convert Radian To Degree
 *
 * @param {Number} a Angle in Radians
 */
function toDegree(a) {
  return a * radian;
}

/**
 * Tests whether or not the arguments have approximately the same value, within an absolute
 * or relative tolerance of glMatrix.EPSILON (an absolute tolerance is used for values less
 * than or equal to 1.0, and a relative tolerance is used for larger values)
 *
 * @param {Number} a          The first number to test.
 * @param {Number} b          The second number to test.
 * @param {Number} tolerance  Absolute or relative tolerance (default glMatrix.EPSILON)
 * @returns {Boolean} True if the numbers are approximately equal, false otherwise.
 */
function equals(a, b) {
  var tolerance = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : EPSILON;
  return Math.abs(a - b) <= tolerance * Math.max(1, Math.abs(a), Math.abs(b));
}

},{}],5:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.vec4 = exports.vec3 = exports.vec2 = exports.quat2 = exports.quat = exports.mat4 = exports.mat3 = exports.mat2d = exports.mat2 = exports.glMatrix = void 0;
var glMatrix = _interopRequireWildcard(require("./common.js"));
exports.glMatrix = glMatrix;
var mat2 = _interopRequireWildcard(require("./mat2.js"));
exports.mat2 = mat2;
var mat2d = _interopRequireWildcard(require("./mat2d.js"));
exports.mat2d = mat2d;
var mat3 = _interopRequireWildcard(require("./mat3.js"));
exports.mat3 = mat3;
var mat4 = _interopRequireWildcard(require("./mat4.js"));
exports.mat4 = mat4;
var quat = _interopRequireWildcard(require("./quat.js"));
exports.quat = quat;
var quat2 = _interopRequireWildcard(require("./quat2.js"));
exports.quat2 = quat2;
var vec2 = _interopRequireWildcard(require("./vec2.js"));
exports.vec2 = vec2;
var vec3 = _interopRequireWildcard(require("./vec3.js"));
exports.vec3 = vec3;
var vec4 = _interopRequireWildcard(require("./vec4.js"));
exports.vec4 = vec4;
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }

},{"./common.js":4,"./mat2.js":6,"./mat2d.js":7,"./mat3.js":8,"./mat4.js":9,"./quat.js":10,"./quat2.js":11,"./vec2.js":12,"./vec3.js":13,"./vec4.js":14}],6:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.LDU = LDU;
exports.add = add;
exports.adjoint = adjoint;
exports.clone = clone;
exports.copy = copy;
exports.create = create;
exports.determinant = determinant;
exports.equals = equals;
exports.exactEquals = exactEquals;
exports.frob = frob;
exports.fromRotation = fromRotation;
exports.fromScaling = fromScaling;
exports.fromValues = fromValues;
exports.identity = identity;
exports.invert = invert;
exports.mul = void 0;
exports.multiply = multiply;
exports.multiplyScalar = multiplyScalar;
exports.multiplyScalarAndAdd = multiplyScalarAndAdd;
exports.rotate = rotate;
exports.scale = scale;
exports.set = set;
exports.str = str;
exports.sub = void 0;
exports.subtract = subtract;
exports.transpose = transpose;
var glMatrix = _interopRequireWildcard(require("./common.js"));
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
/**
 * 2x2 Matrix
 * @module mat2
 */

/**
 * Creates a new identity mat2
 *
 * @returns {mat2} a new 2x2 matrix
 */
function create() {
  var out = new glMatrix.ARRAY_TYPE(4);
  if (glMatrix.ARRAY_TYPE != Float32Array) {
    out[1] = 0;
    out[2] = 0;
  }
  out[0] = 1;
  out[3] = 1;
  return out;
}

/**
 * Creates a new mat2 initialized with values from an existing matrix
 *
 * @param {ReadonlyMat2} a matrix to clone
 * @returns {mat2} a new 2x2 matrix
 */
function clone(a) {
  var out = new glMatrix.ARRAY_TYPE(4);
  out[0] = a[0];
  out[1] = a[1];
  out[2] = a[2];
  out[3] = a[3];
  return out;
}

/**
 * Copy the values from one mat2 to another
 *
 * @param {mat2} out the receiving matrix
 * @param {ReadonlyMat2} a the source matrix
 * @returns {mat2} out
 */
function copy(out, a) {
  out[0] = a[0];
  out[1] = a[1];
  out[2] = a[2];
  out[3] = a[3];
  return out;
}

/**
 * Set a mat2 to the identity matrix
 *
 * @param {mat2} out the receiving matrix
 * @returns {mat2} out
 */
function identity(out) {
  out[0] = 1;
  out[1] = 0;
  out[2] = 0;
  out[3] = 1;
  return out;
}

/**
 * Create a new mat2 with the given values
 *
 * @param {Number} m00 Component in column 0, row 0 position (index 0)
 * @param {Number} m01 Component in column 0, row 1 position (index 1)
 * @param {Number} m10 Component in column 1, row 0 position (index 2)
 * @param {Number} m11 Component in column 1, row 1 position (index 3)
 * @returns {mat2} out A new 2x2 matrix
 */
function fromValues(m00, m01, m10, m11) {
  var out = new glMatrix.ARRAY_TYPE(4);
  out[0] = m00;
  out[1] = m01;
  out[2] = m10;
  out[3] = m11;
  return out;
}

/**
 * Set the components of a mat2 to the given values
 *
 * @param {mat2} out the receiving matrix
 * @param {Number} m00 Component in column 0, row 0 position (index 0)
 * @param {Number} m01 Component in column 0, row 1 position (index 1)
 * @param {Number} m10 Component in column 1, row 0 position (index 2)
 * @param {Number} m11 Component in column 1, row 1 position (index 3)
 * @returns {mat2} out
 */
function set(out, m00, m01, m10, m11) {
  out[0] = m00;
  out[1] = m01;
  out[2] = m10;
  out[3] = m11;
  return out;
}

/**
 * Transpose the values of a mat2
 *
 * @param {mat2} out the receiving matrix
 * @param {ReadonlyMat2} a the source matrix
 * @returns {mat2} out
 */
function transpose(out, a) {
  // If we are transposing ourselves we can skip a few steps but have to cache
  // some values
  if (out === a) {
    var a1 = a[1];
    out[1] = a[2];
    out[2] = a1;
  } else {
    out[0] = a[0];
    out[1] = a[2];
    out[2] = a[1];
    out[3] = a[3];
  }
  return out;
}

/**
 * Inverts a mat2
 *
 * @param {mat2} out the receiving matrix
 * @param {ReadonlyMat2} a the source matrix
 * @returns {mat2 | null} out, or null if source matrix is not invertible
 */
function invert(out, a) {
  var a0 = a[0],
    a1 = a[1],
    a2 = a[2],
    a3 = a[3];

  // Calculate the determinant
  var det = a0 * a3 - a2 * a1;
  if (!det) {
    return null;
  }
  det = 1.0 / det;
  out[0] = a3 * det;
  out[1] = -a1 * det;
  out[2] = -a2 * det;
  out[3] = a0 * det;
  return out;
}

/**
 * Calculates the adjugate of a mat2
 *
 * @param {mat2} out the receiving matrix
 * @param {ReadonlyMat2} a the source matrix
 * @returns {mat2} out
 */
function adjoint(out, a) {
  // Caching this value is necessary if out == a
  var a0 = a[0];
  out[0] = a[3];
  out[1] = -a[1];
  out[2] = -a[2];
  out[3] = a0;
  return out;
}

/**
 * Calculates the determinant of a mat2
 *
 * @param {ReadonlyMat2} a the source matrix
 * @returns {Number} determinant of a
 */
function determinant(a) {
  return a[0] * a[3] - a[2] * a[1];
}

/**
 * Multiplies two mat2's
 *
 * @param {mat2} out the receiving matrix
 * @param {ReadonlyMat2} a the first operand
 * @param {ReadonlyMat2} b the second operand
 * @returns {mat2} out
 */
function multiply(out, a, b) {
  var a0 = a[0],
    a1 = a[1],
    a2 = a[2],
    a3 = a[3];
  var b0 = b[0],
    b1 = b[1],
    b2 = b[2],
    b3 = b[3];
  out[0] = a0 * b0 + a2 * b1;
  out[1] = a1 * b0 + a3 * b1;
  out[2] = a0 * b2 + a2 * b3;
  out[3] = a1 * b2 + a3 * b3;
  return out;
}

/**
 * Rotates a mat2 by the given angle
 *
 * @param {mat2} out the receiving matrix
 * @param {ReadonlyMat2} a the matrix to rotate
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat2} out
 */
function rotate(out, a, rad) {
  var a0 = a[0],
    a1 = a[1],
    a2 = a[2],
    a3 = a[3];
  var s = Math.sin(rad);
  var c = Math.cos(rad);
  out[0] = a0 * c + a2 * s;
  out[1] = a1 * c + a3 * s;
  out[2] = a0 * -s + a2 * c;
  out[3] = a1 * -s + a3 * c;
  return out;
}

/**
 * Scales the mat2 by the dimensions in the given vec2
 *
 * @param {mat2} out the receiving matrix
 * @param {ReadonlyMat2} a the matrix to rotate
 * @param {ReadonlyVec2} v the vec2 to scale the matrix by
 * @returns {mat2} out
 **/
function scale(out, a, v) {
  var a0 = a[0],
    a1 = a[1],
    a2 = a[2],
    a3 = a[3];
  var v0 = v[0],
    v1 = v[1];
  out[0] = a0 * v0;
  out[1] = a1 * v0;
  out[2] = a2 * v1;
  out[3] = a3 * v1;
  return out;
}

/**
 * Creates a matrix from a given angle
 * This is equivalent to (but much faster than):
 *
 *     mat2.identity(dest);
 *     mat2.rotate(dest, dest, rad);
 *
 * @param {mat2} out mat2 receiving operation result
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat2} out
 */
function fromRotation(out, rad) {
  var s = Math.sin(rad);
  var c = Math.cos(rad);
  out[0] = c;
  out[1] = s;
  out[2] = -s;
  out[3] = c;
  return out;
}

/**
 * Creates a matrix from a vector scaling
 * This is equivalent to (but much faster than):
 *
 *     mat2.identity(dest);
 *     mat2.scale(dest, dest, vec);
 *
 * @param {mat2} out mat2 receiving operation result
 * @param {ReadonlyVec2} v Scaling vector
 * @returns {mat2} out
 */
function fromScaling(out, v) {
  out[0] = v[0];
  out[1] = 0;
  out[2] = 0;
  out[3] = v[1];
  return out;
}

/**
 * Returns a string representation of a mat2
 *
 * @param {ReadonlyMat2} a matrix to represent as a string
 * @returns {String} string representation of the matrix
 */
function str(a) {
  return "mat2(" + a[0] + ", " + a[1] + ", " + a[2] + ", " + a[3] + ")";
}

/**
 * Returns Frobenius norm of a mat2
 *
 * @param {ReadonlyMat2} a the matrix to calculate Frobenius norm of
 * @returns {Number} Frobenius norm
 */
function frob(a) {
  return Math.sqrt(a[0] * a[0] + a[1] * a[1] + a[2] * a[2] + a[3] * a[3]);
}

/**
 * Returns L, D and U matrices (Lower triangular, Diagonal and Upper triangular) by factorizing the input matrix
 * @param {ReadonlyMat2} L the lower triangular matrix
 * @param {ReadonlyMat2} D the diagonal matrix
 * @param {ReadonlyMat2} U the upper triangular matrix
 * @param {ReadonlyMat2} a the input matrix to factorize
 */

function LDU(L, D, U, a) {
  L[2] = a[2] / a[0];
  U[0] = a[0];
  U[1] = a[1];
  U[3] = a[3] - L[2] * U[1];
  return [L, D, U];
}

/**
 * Adds two mat2's
 *
 * @param {mat2} out the receiving matrix
 * @param {ReadonlyMat2} a the first operand
 * @param {ReadonlyMat2} b the second operand
 * @returns {mat2} out
 */
function add(out, a, b) {
  out[0] = a[0] + b[0];
  out[1] = a[1] + b[1];
  out[2] = a[2] + b[2];
  out[3] = a[3] + b[3];
  return out;
}

/**
 * Subtracts matrix b from matrix a
 *
 * @param {mat2} out the receiving matrix
 * @param {ReadonlyMat2} a the first operand
 * @param {ReadonlyMat2} b the second operand
 * @returns {mat2} out
 */
function subtract(out, a, b) {
  out[0] = a[0] - b[0];
  out[1] = a[1] - b[1];
  out[2] = a[2] - b[2];
  out[3] = a[3] - b[3];
  return out;
}

/**
 * Returns whether or not the matrices have exactly the same elements in the same position (when compared with ===)
 *
 * @param {ReadonlyMat2} a The first matrix.
 * @param {ReadonlyMat2} b The second matrix.
 * @returns {Boolean} True if the matrices are equal, false otherwise.
 */
function exactEquals(a, b) {
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3];
}

/**
 * Returns whether or not the matrices have approximately the same elements in the same position.
 *
 * @param {ReadonlyMat2} a The first matrix.
 * @param {ReadonlyMat2} b The second matrix.
 * @returns {Boolean} True if the matrices are equal, false otherwise.
 */
function equals(a, b) {
  var a0 = a[0],
    a1 = a[1],
    a2 = a[2],
    a3 = a[3];
  var b0 = b[0],
    b1 = b[1],
    b2 = b[2],
    b3 = b[3];
  return Math.abs(a0 - b0) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a0), Math.abs(b0)) && Math.abs(a1 - b1) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a1), Math.abs(b1)) && Math.abs(a2 - b2) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a2), Math.abs(b2)) && Math.abs(a3 - b3) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a3), Math.abs(b3));
}

/**
 * Multiply each element of the matrix by a scalar.
 *
 * @param {mat2} out the receiving matrix
 * @param {ReadonlyMat2} a the matrix to scale
 * @param {Number} b amount to scale the matrix's elements by
 * @returns {mat2} out
 */
function multiplyScalar(out, a, b) {
  out[0] = a[0] * b;
  out[1] = a[1] * b;
  out[2] = a[2] * b;
  out[3] = a[3] * b;
  return out;
}

/**
 * Adds two mat2's after multiplying each element of the second operand by a scalar value.
 *
 * @param {mat2} out the receiving vector
 * @param {ReadonlyMat2} a the first operand
 * @param {ReadonlyMat2} b the second operand
 * @param {Number} scale the amount to scale b's elements by before adding
 * @returns {mat2} out
 */
function multiplyScalarAndAdd(out, a, b, scale) {
  out[0] = a[0] + b[0] * scale;
  out[1] = a[1] + b[1] * scale;
  out[2] = a[2] + b[2] * scale;
  out[3] = a[3] + b[3] * scale;
  return out;
}

/**
 * Alias for {@link mat2.multiply}
 * @function
 */
var mul = exports.mul = multiply;

/**
 * Alias for {@link mat2.subtract}
 * @function
 */
var sub = exports.sub = subtract;

},{"./common.js":4}],7:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.add = add;
exports.clone = clone;
exports.copy = copy;
exports.create = create;
exports.determinant = determinant;
exports.equals = equals;
exports.exactEquals = exactEquals;
exports.frob = frob;
exports.fromRotation = fromRotation;
exports.fromScaling = fromScaling;
exports.fromTranslation = fromTranslation;
exports.fromValues = fromValues;
exports.identity = identity;
exports.invert = invert;
exports.mul = void 0;
exports.multiply = multiply;
exports.multiplyScalar = multiplyScalar;
exports.multiplyScalarAndAdd = multiplyScalarAndAdd;
exports.rotate = rotate;
exports.scale = scale;
exports.set = set;
exports.str = str;
exports.sub = void 0;
exports.subtract = subtract;
exports.translate = translate;
var glMatrix = _interopRequireWildcard(require("./common.js"));
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
/**
 * 2x3 Matrix
 * @module mat2d
 * @description
 * A mat2d contains six elements defined as:
 * <pre>
 * [a, b,
 *  c, d,
 *  tx, ty]
 * </pre>
 * This is a short form for the 3x3 matrix:
 * <pre>
 * [a, b, 0,
 *  c, d, 0,
 *  tx, ty, 1]
 * </pre>
 * The last column is ignored so the array is shorter and operations are faster.
 */

/**
 * Creates a new identity mat2d
 *
 * @returns {mat2d} a new 2x3 matrix
 */
function create() {
  var out = new glMatrix.ARRAY_TYPE(6);
  if (glMatrix.ARRAY_TYPE != Float32Array) {
    out[1] = 0;
    out[2] = 0;
    out[4] = 0;
    out[5] = 0;
  }
  out[0] = 1;
  out[3] = 1;
  return out;
}

/**
 * Creates a new mat2d initialized with values from an existing matrix
 *
 * @param {ReadonlyMat2d} a matrix to clone
 * @returns {mat2d} a new 2x3 matrix
 */
function clone(a) {
  var out = new glMatrix.ARRAY_TYPE(6);
  out[0] = a[0];
  out[1] = a[1];
  out[2] = a[2];
  out[3] = a[3];
  out[4] = a[4];
  out[5] = a[5];
  return out;
}

/**
 * Copy the values from one mat2d to another
 *
 * @param {mat2d} out the receiving matrix
 * @param {ReadonlyMat2d} a the source matrix
 * @returns {mat2d} out
 */
function copy(out, a) {
  out[0] = a[0];
  out[1] = a[1];
  out[2] = a[2];
  out[3] = a[3];
  out[4] = a[4];
  out[5] = a[5];
  return out;
}

/**
 * Set a mat2d to the identity matrix
 *
 * @param {mat2d} out the receiving matrix
 * @returns {mat2d} out
 */
function identity(out) {
  out[0] = 1;
  out[1] = 0;
  out[2] = 0;
  out[3] = 1;
  out[4] = 0;
  out[5] = 0;
  return out;
}

/**
 * Create a new mat2d with the given values
 *
 * @param {Number} a Component A (index 0)
 * @param {Number} b Component B (index 1)
 * @param {Number} c Component C (index 2)
 * @param {Number} d Component D (index 3)
 * @param {Number} tx Component TX (index 4)
 * @param {Number} ty Component TY (index 5)
 * @returns {mat2d} A new mat2d
 */
function fromValues(a, b, c, d, tx, ty) {
  var out = new glMatrix.ARRAY_TYPE(6);
  out[0] = a;
  out[1] = b;
  out[2] = c;
  out[3] = d;
  out[4] = tx;
  out[5] = ty;
  return out;
}

/**
 * Set the components of a mat2d to the given values
 *
 * @param {mat2d} out the receiving matrix
 * @param {Number} a Component A (index 0)
 * @param {Number} b Component B (index 1)
 * @param {Number} c Component C (index 2)
 * @param {Number} d Component D (index 3)
 * @param {Number} tx Component TX (index 4)
 * @param {Number} ty Component TY (index 5)
 * @returns {mat2d} out
 */
function set(out, a, b, c, d, tx, ty) {
  out[0] = a;
  out[1] = b;
  out[2] = c;
  out[3] = d;
  out[4] = tx;
  out[5] = ty;
  return out;
}

/**
 * Inverts a mat2d
 *
 * @param {mat2d} out the receiving matrix
 * @param {ReadonlyMat2d} a the source matrix
 * @returns {mat2d | null} out, or null if source matrix is not invertible
 */
function invert(out, a) {
  var aa = a[0],
    ab = a[1],
    ac = a[2],
    ad = a[3];
  var atx = a[4],
    aty = a[5];
  var det = aa * ad - ab * ac;
  if (!det) {
    return null;
  }
  det = 1.0 / det;
  out[0] = ad * det;
  out[1] = -ab * det;
  out[2] = -ac * det;
  out[3] = aa * det;
  out[4] = (ac * aty - ad * atx) * det;
  out[5] = (ab * atx - aa * aty) * det;
  return out;
}

/**
 * Calculates the determinant of a mat2d
 *
 * @param {ReadonlyMat2d} a the source matrix
 * @returns {Number} determinant of a
 */
function determinant(a) {
  return a[0] * a[3] - a[1] * a[2];
}

/**
 * Multiplies two mat2d's
 *
 * @param {mat2d} out the receiving matrix
 * @param {ReadonlyMat2d} a the first operand
 * @param {ReadonlyMat2d} b the second operand
 * @returns {mat2d} out
 */
function multiply(out, a, b) {
  var a0 = a[0],
    a1 = a[1],
    a2 = a[2],
    a3 = a[3],
    a4 = a[4],
    a5 = a[5];
  var b0 = b[0],
    b1 = b[1],
    b2 = b[2],
    b3 = b[3],
    b4 = b[4],
    b5 = b[5];
  out[0] = a0 * b0 + a2 * b1;
  out[1] = a1 * b0 + a3 * b1;
  out[2] = a0 * b2 + a2 * b3;
  out[3] = a1 * b2 + a3 * b3;
  out[4] = a0 * b4 + a2 * b5 + a4;
  out[5] = a1 * b4 + a3 * b5 + a5;
  return out;
}

/**
 * Rotates a mat2d by the given angle
 *
 * @param {mat2d} out the receiving matrix
 * @param {ReadonlyMat2d} a the matrix to rotate
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat2d} out
 */
function rotate(out, a, rad) {
  var a0 = a[0],
    a1 = a[1],
    a2 = a[2],
    a3 = a[3],
    a4 = a[4],
    a5 = a[5];
  var s = Math.sin(rad);
  var c = Math.cos(rad);
  out[0] = a0 * c + a2 * s;
  out[1] = a1 * c + a3 * s;
  out[2] = a0 * -s + a2 * c;
  out[3] = a1 * -s + a3 * c;
  out[4] = a4;
  out[5] = a5;
  return out;
}

/**
 * Scales the mat2d by the dimensions in the given vec2
 *
 * @param {mat2d} out the receiving matrix
 * @param {ReadonlyMat2d} a the matrix to translate
 * @param {ReadonlyVec2} v the vec2 to scale the matrix by
 * @returns {mat2d} out
 **/
function scale(out, a, v) {
  var a0 = a[0],
    a1 = a[1],
    a2 = a[2],
    a3 = a[3],
    a4 = a[4],
    a5 = a[5];
  var v0 = v[0],
    v1 = v[1];
  out[0] = a0 * v0;
  out[1] = a1 * v0;
  out[2] = a2 * v1;
  out[3] = a3 * v1;
  out[4] = a4;
  out[5] = a5;
  return out;
}

/**
 * Translates the mat2d by the dimensions in the given vec2
 *
 * @param {mat2d} out the receiving matrix
 * @param {ReadonlyMat2d} a the matrix to translate
 * @param {ReadonlyVec2} v the vec2 to translate the matrix by
 * @returns {mat2d} out
 **/
function translate(out, a, v) {
  var a0 = a[0],
    a1 = a[1],
    a2 = a[2],
    a3 = a[3],
    a4 = a[4],
    a5 = a[5];
  var v0 = v[0],
    v1 = v[1];
  out[0] = a0;
  out[1] = a1;
  out[2] = a2;
  out[3] = a3;
  out[4] = a0 * v0 + a2 * v1 + a4;
  out[5] = a1 * v0 + a3 * v1 + a5;
  return out;
}

/**
 * Creates a matrix from a given angle
 * This is equivalent to (but much faster than):
 *
 *     mat2d.identity(dest);
 *     mat2d.rotate(dest, dest, rad);
 *
 * @param {mat2d} out mat2d receiving operation result
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat2d} out
 */
function fromRotation(out, rad) {
  var s = Math.sin(rad),
    c = Math.cos(rad);
  out[0] = c;
  out[1] = s;
  out[2] = -s;
  out[3] = c;
  out[4] = 0;
  out[5] = 0;
  return out;
}

/**
 * Creates a matrix from a vector scaling
 * This is equivalent to (but much faster than):
 *
 *     mat2d.identity(dest);
 *     mat2d.scale(dest, dest, vec);
 *
 * @param {mat2d} out mat2d receiving operation result
 * @param {ReadonlyVec2} v Scaling vector
 * @returns {mat2d} out
 */
function fromScaling(out, v) {
  out[0] = v[0];
  out[1] = 0;
  out[2] = 0;
  out[3] = v[1];
  out[4] = 0;
  out[5] = 0;
  return out;
}

/**
 * Creates a matrix from a vector translation
 * This is equivalent to (but much faster than):
 *
 *     mat2d.identity(dest);
 *     mat2d.translate(dest, dest, vec);
 *
 * @param {mat2d} out mat2d receiving operation result
 * @param {ReadonlyVec2} v Translation vector
 * @returns {mat2d} out
 */
function fromTranslation(out, v) {
  out[0] = 1;
  out[1] = 0;
  out[2] = 0;
  out[3] = 1;
  out[4] = v[0];
  out[5] = v[1];
  return out;
}

/**
 * Returns a string representation of a mat2d
 *
 * @param {ReadonlyMat2d} a matrix to represent as a string
 * @returns {String} string representation of the matrix
 */
function str(a) {
  return "mat2d(" + a[0] + ", " + a[1] + ", " + a[2] + ", " + a[3] + ", " + a[4] + ", " + a[5] + ")";
}

/**
 * Returns Frobenius norm of a mat2d
 *
 * @param {ReadonlyMat2d} a the matrix to calculate Frobenius norm of
 * @returns {Number} Frobenius norm
 */
function frob(a) {
  return Math.sqrt(a[0] * a[0] + a[1] * a[1] + a[2] * a[2] + a[3] * a[3] + a[4] * a[4] + a[5] * a[5] + 1);
}

/**
 * Adds two mat2d's
 *
 * @param {mat2d} out the receiving matrix
 * @param {ReadonlyMat2d} a the first operand
 * @param {ReadonlyMat2d} b the second operand
 * @returns {mat2d} out
 */
function add(out, a, b) {
  out[0] = a[0] + b[0];
  out[1] = a[1] + b[1];
  out[2] = a[2] + b[2];
  out[3] = a[3] + b[3];
  out[4] = a[4] + b[4];
  out[5] = a[5] + b[5];
  return out;
}

/**
 * Subtracts matrix b from matrix a
 *
 * @param {mat2d} out the receiving matrix
 * @param {ReadonlyMat2d} a the first operand
 * @param {ReadonlyMat2d} b the second operand
 * @returns {mat2d} out
 */
function subtract(out, a, b) {
  out[0] = a[0] - b[0];
  out[1] = a[1] - b[1];
  out[2] = a[2] - b[2];
  out[3] = a[3] - b[3];
  out[4] = a[4] - b[4];
  out[5] = a[5] - b[5];
  return out;
}

/**
 * Multiply each element of the matrix by a scalar.
 *
 * @param {mat2d} out the receiving matrix
 * @param {ReadonlyMat2d} a the matrix to scale
 * @param {Number} b amount to scale the matrix's elements by
 * @returns {mat2d} out
 */
function multiplyScalar(out, a, b) {
  out[0] = a[0] * b;
  out[1] = a[1] * b;
  out[2] = a[2] * b;
  out[3] = a[3] * b;
  out[4] = a[4] * b;
  out[5] = a[5] * b;
  return out;
}

/**
 * Adds two mat2d's after multiplying each element of the second operand by a scalar value.
 *
 * @param {mat2d} out the receiving vector
 * @param {ReadonlyMat2d} a the first operand
 * @param {ReadonlyMat2d} b the second operand
 * @param {Number} scale the amount to scale b's elements by before adding
 * @returns {mat2d} out
 */
function multiplyScalarAndAdd(out, a, b, scale) {
  out[0] = a[0] + b[0] * scale;
  out[1] = a[1] + b[1] * scale;
  out[2] = a[2] + b[2] * scale;
  out[3] = a[3] + b[3] * scale;
  out[4] = a[4] + b[4] * scale;
  out[5] = a[5] + b[5] * scale;
  return out;
}

/**
 * Returns whether or not the matrices have exactly the same elements in the same position (when compared with ===)
 *
 * @param {ReadonlyMat2d} a The first matrix.
 * @param {ReadonlyMat2d} b The second matrix.
 * @returns {Boolean} True if the matrices are equal, false otherwise.
 */
function exactEquals(a, b) {
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3] && a[4] === b[4] && a[5] === b[5];
}

/**
 * Returns whether or not the matrices have approximately the same elements in the same position.
 *
 * @param {ReadonlyMat2d} a The first matrix.
 * @param {ReadonlyMat2d} b The second matrix.
 * @returns {Boolean} True if the matrices are equal, false otherwise.
 */
function equals(a, b) {
  var a0 = a[0],
    a1 = a[1],
    a2 = a[2],
    a3 = a[3],
    a4 = a[4],
    a5 = a[5];
  var b0 = b[0],
    b1 = b[1],
    b2 = b[2],
    b3 = b[3],
    b4 = b[4],
    b5 = b[5];
  return Math.abs(a0 - b0) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a0), Math.abs(b0)) && Math.abs(a1 - b1) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a1), Math.abs(b1)) && Math.abs(a2 - b2) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a2), Math.abs(b2)) && Math.abs(a3 - b3) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a3), Math.abs(b3)) && Math.abs(a4 - b4) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a4), Math.abs(b4)) && Math.abs(a5 - b5) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a5), Math.abs(b5));
}

/**
 * Alias for {@link mat2d.multiply}
 * @function
 */
var mul = exports.mul = multiply;

/**
 * Alias for {@link mat2d.subtract}
 * @function
 */
var sub = exports.sub = subtract;

},{"./common.js":4}],8:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.add = add;
exports.adjoint = adjoint;
exports.clone = clone;
exports.copy = copy;
exports.create = create;
exports.determinant = determinant;
exports.equals = equals;
exports.exactEquals = exactEquals;
exports.frob = frob;
exports.fromMat2d = fromMat2d;
exports.fromMat4 = fromMat4;
exports.fromQuat = fromQuat;
exports.fromRotation = fromRotation;
exports.fromScaling = fromScaling;
exports.fromTranslation = fromTranslation;
exports.fromValues = fromValues;
exports.identity = identity;
exports.invert = invert;
exports.mul = void 0;
exports.multiply = multiply;
exports.multiplyScalar = multiplyScalar;
exports.multiplyScalarAndAdd = multiplyScalarAndAdd;
exports.normalFromMat4 = normalFromMat4;
exports.projection = projection;
exports.rotate = rotate;
exports.scale = scale;
exports.set = set;
exports.str = str;
exports.sub = void 0;
exports.subtract = subtract;
exports.translate = translate;
exports.transpose = transpose;
var glMatrix = _interopRequireWildcard(require("./common.js"));
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
/**
 * 3x3 Matrix
 * @module mat3
 */

/**
 * Creates a new identity mat3
 *
 * @returns {mat3} a new 3x3 matrix
 */
function create() {
  var out = new glMatrix.ARRAY_TYPE(9);
  if (glMatrix.ARRAY_TYPE != Float32Array) {
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[5] = 0;
    out[6] = 0;
    out[7] = 0;
  }
  out[0] = 1;
  out[4] = 1;
  out[8] = 1;
  return out;
}

/**
 * Copies the upper-left 3x3 values into the given mat3.
 *
 * @param {mat3} out the receiving 3x3 matrix
 * @param {ReadonlyMat4} a   the source 4x4 matrix
 * @returns {mat3} out
 */
function fromMat4(out, a) {
  out[0] = a[0];
  out[1] = a[1];
  out[2] = a[2];
  out[3] = a[4];
  out[4] = a[5];
  out[5] = a[6];
  out[6] = a[8];
  out[7] = a[9];
  out[8] = a[10];
  return out;
}

/**
 * Creates a new mat3 initialized with values from an existing matrix
 *
 * @param {ReadonlyMat3} a matrix to clone
 * @returns {mat3} a new 3x3 matrix
 */
function clone(a) {
  var out = new glMatrix.ARRAY_TYPE(9);
  out[0] = a[0];
  out[1] = a[1];
  out[2] = a[2];
  out[3] = a[3];
  out[4] = a[4];
  out[5] = a[5];
  out[6] = a[6];
  out[7] = a[7];
  out[8] = a[8];
  return out;
}

/**
 * Copy the values from one mat3 to another
 *
 * @param {mat3} out the receiving matrix
 * @param {ReadonlyMat3} a the source matrix
 * @returns {mat3} out
 */
function copy(out, a) {
  out[0] = a[0];
  out[1] = a[1];
  out[2] = a[2];
  out[3] = a[3];
  out[4] = a[4];
  out[5] = a[5];
  out[6] = a[6];
  out[7] = a[7];
  out[8] = a[8];
  return out;
}

/**
 * Create a new mat3 with the given values
 *
 * @param {Number} m00 Component in column 0, row 0 position (index 0)
 * @param {Number} m01 Component in column 0, row 1 position (index 1)
 * @param {Number} m02 Component in column 0, row 2 position (index 2)
 * @param {Number} m10 Component in column 1, row 0 position (index 3)
 * @param {Number} m11 Component in column 1, row 1 position (index 4)
 * @param {Number} m12 Component in column 1, row 2 position (index 5)
 * @param {Number} m20 Component in column 2, row 0 position (index 6)
 * @param {Number} m21 Component in column 2, row 1 position (index 7)
 * @param {Number} m22 Component in column 2, row 2 position (index 8)
 * @returns {mat3} A new mat3
 */
function fromValues(m00, m01, m02, m10, m11, m12, m20, m21, m22) {
  var out = new glMatrix.ARRAY_TYPE(9);
  out[0] = m00;
  out[1] = m01;
  out[2] = m02;
  out[3] = m10;
  out[4] = m11;
  out[5] = m12;
  out[6] = m20;
  out[7] = m21;
  out[8] = m22;
  return out;
}

/**
 * Set the components of a mat3 to the given values
 *
 * @param {mat3} out the receiving matrix
 * @param {Number} m00 Component in column 0, row 0 position (index 0)
 * @param {Number} m01 Component in column 0, row 1 position (index 1)
 * @param {Number} m02 Component in column 0, row 2 position (index 2)
 * @param {Number} m10 Component in column 1, row 0 position (index 3)
 * @param {Number} m11 Component in column 1, row 1 position (index 4)
 * @param {Number} m12 Component in column 1, row 2 position (index 5)
 * @param {Number} m20 Component in column 2, row 0 position (index 6)
 * @param {Number} m21 Component in column 2, row 1 position (index 7)
 * @param {Number} m22 Component in column 2, row 2 position (index 8)
 * @returns {mat3} out
 */
function set(out, m00, m01, m02, m10, m11, m12, m20, m21, m22) {
  out[0] = m00;
  out[1] = m01;
  out[2] = m02;
  out[3] = m10;
  out[4] = m11;
  out[5] = m12;
  out[6] = m20;
  out[7] = m21;
  out[8] = m22;
  return out;
}

/**
 * Set a mat3 to the identity matrix
 *
 * @param {mat3} out the receiving matrix
 * @returns {mat3} out
 */
function identity(out) {
  out[0] = 1;
  out[1] = 0;
  out[2] = 0;
  out[3] = 0;
  out[4] = 1;
  out[5] = 0;
  out[6] = 0;
  out[7] = 0;
  out[8] = 1;
  return out;
}

/**
 * Transpose the values of a mat3
 *
 * @param {mat3} out the receiving matrix
 * @param {ReadonlyMat3} a the source matrix
 * @returns {mat3} out
 */
function transpose(out, a) {
  // If we are transposing ourselves we can skip a few steps but have to cache some values
  if (out === a) {
    var a01 = a[1],
      a02 = a[2],
      a12 = a[5];
    out[1] = a[3];
    out[2] = a[6];
    out[3] = a01;
    out[5] = a[7];
    out[6] = a02;
    out[7] = a12;
  } else {
    out[0] = a[0];
    out[1] = a[3];
    out[2] = a[6];
    out[3] = a[1];
    out[4] = a[4];
    out[5] = a[7];
    out[6] = a[2];
    out[7] = a[5];
    out[8] = a[8];
  }
  return out;
}

/**
 * Inverts a mat3
 *
 * @param {mat3} out the receiving matrix
 * @param {ReadonlyMat3} a the source matrix
 * @returns {mat3 | null} out, or null if source matrix is not invertible
 */
function invert(out, a) {
  var a00 = a[0],
    a01 = a[1],
    a02 = a[2];
  var a10 = a[3],
    a11 = a[4],
    a12 = a[5];
  var a20 = a[6],
    a21 = a[7],
    a22 = a[8];
  var b01 = a22 * a11 - a12 * a21;
  var b11 = -a22 * a10 + a12 * a20;
  var b21 = a21 * a10 - a11 * a20;

  // Calculate the determinant
  var det = a00 * b01 + a01 * b11 + a02 * b21;
  if (!det) {
    return null;
  }
  det = 1.0 / det;
  out[0] = b01 * det;
  out[1] = (-a22 * a01 + a02 * a21) * det;
  out[2] = (a12 * a01 - a02 * a11) * det;
  out[3] = b11 * det;
  out[4] = (a22 * a00 - a02 * a20) * det;
  out[5] = (-a12 * a00 + a02 * a10) * det;
  out[6] = b21 * det;
  out[7] = (-a21 * a00 + a01 * a20) * det;
  out[8] = (a11 * a00 - a01 * a10) * det;
  return out;
}

/**
 * Calculates the adjugate of a mat3
 *
 * @param {mat3} out the receiving matrix
 * @param {ReadonlyMat3} a the source matrix
 * @returns {mat3} out
 */
function adjoint(out, a) {
  var a00 = a[0],
    a01 = a[1],
    a02 = a[2];
  var a10 = a[3],
    a11 = a[4],
    a12 = a[5];
  var a20 = a[6],
    a21 = a[7],
    a22 = a[8];
  out[0] = a11 * a22 - a12 * a21;
  out[1] = a02 * a21 - a01 * a22;
  out[2] = a01 * a12 - a02 * a11;
  out[3] = a12 * a20 - a10 * a22;
  out[4] = a00 * a22 - a02 * a20;
  out[5] = a02 * a10 - a00 * a12;
  out[6] = a10 * a21 - a11 * a20;
  out[7] = a01 * a20 - a00 * a21;
  out[8] = a00 * a11 - a01 * a10;
  return out;
}

/**
 * Calculates the determinant of a mat3
 *
 * @param {ReadonlyMat3} a the source matrix
 * @returns {Number} determinant of a
 */
function determinant(a) {
  var a00 = a[0],
    a01 = a[1],
    a02 = a[2];
  var a10 = a[3],
    a11 = a[4],
    a12 = a[5];
  var a20 = a[6],
    a21 = a[7],
    a22 = a[8];
  return a00 * (a22 * a11 - a12 * a21) + a01 * (-a22 * a10 + a12 * a20) + a02 * (a21 * a10 - a11 * a20);
}

/**
 * Multiplies two mat3's
 *
 * @param {mat3} out the receiving matrix
 * @param {ReadonlyMat3} a the first operand
 * @param {ReadonlyMat3} b the second operand
 * @returns {mat3} out
 */
function multiply(out, a, b) {
  var a00 = a[0],
    a01 = a[1],
    a02 = a[2];
  var a10 = a[3],
    a11 = a[4],
    a12 = a[5];
  var a20 = a[6],
    a21 = a[7],
    a22 = a[8];
  var b00 = b[0],
    b01 = b[1],
    b02 = b[2];
  var b10 = b[3],
    b11 = b[4],
    b12 = b[5];
  var b20 = b[6],
    b21 = b[7],
    b22 = b[8];
  out[0] = b00 * a00 + b01 * a10 + b02 * a20;
  out[1] = b00 * a01 + b01 * a11 + b02 * a21;
  out[2] = b00 * a02 + b01 * a12 + b02 * a22;
  out[3] = b10 * a00 + b11 * a10 + b12 * a20;
  out[4] = b10 * a01 + b11 * a11 + b12 * a21;
  out[5] = b10 * a02 + b11 * a12 + b12 * a22;
  out[6] = b20 * a00 + b21 * a10 + b22 * a20;
  out[7] = b20 * a01 + b21 * a11 + b22 * a21;
  out[8] = b20 * a02 + b21 * a12 + b22 * a22;
  return out;
}

/**
 * Translate a mat3 by the given vector
 *
 * @param {mat3} out the receiving matrix
 * @param {ReadonlyMat3} a the matrix to translate
 * @param {ReadonlyVec2} v vector to translate by
 * @returns {mat3} out
 */
function translate(out, a, v) {
  var a00 = a[0],
    a01 = a[1],
    a02 = a[2],
    a10 = a[3],
    a11 = a[4],
    a12 = a[5],
    a20 = a[6],
    a21 = a[7],
    a22 = a[8],
    x = v[0],
    y = v[1];
  out[0] = a00;
  out[1] = a01;
  out[2] = a02;
  out[3] = a10;
  out[4] = a11;
  out[5] = a12;
  out[6] = x * a00 + y * a10 + a20;
  out[7] = x * a01 + y * a11 + a21;
  out[8] = x * a02 + y * a12 + a22;
  return out;
}

/**
 * Rotates a mat3 by the given angle
 *
 * @param {mat3} out the receiving matrix
 * @param {ReadonlyMat3} a the matrix to rotate
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat3} out
 */
function rotate(out, a, rad) {
  var a00 = a[0],
    a01 = a[1],
    a02 = a[2],
    a10 = a[3],
    a11 = a[4],
    a12 = a[5],
    a20 = a[6],
    a21 = a[7],
    a22 = a[8],
    s = Math.sin(rad),
    c = Math.cos(rad);
  out[0] = c * a00 + s * a10;
  out[1] = c * a01 + s * a11;
  out[2] = c * a02 + s * a12;
  out[3] = c * a10 - s * a00;
  out[4] = c * a11 - s * a01;
  out[5] = c * a12 - s * a02;
  out[6] = a20;
  out[7] = a21;
  out[8] = a22;
  return out;
}

/**
 * Scales the mat3 by the dimensions in the given vec2
 *
 * @param {mat3} out the receiving matrix
 * @param {ReadonlyMat3} a the matrix to scale
 * @param {ReadonlyVec2} v the vec2 to scale the matrix by
 * @returns {mat3} out
 **/
function scale(out, a, v) {
  var x = v[0],
    y = v[1];
  out[0] = x * a[0];
  out[1] = x * a[1];
  out[2] = x * a[2];
  out[3] = y * a[3];
  out[4] = y * a[4];
  out[5] = y * a[5];
  out[6] = a[6];
  out[7] = a[7];
  out[8] = a[8];
  return out;
}

/**
 * Creates a matrix from a vector translation
 * This is equivalent to (but much faster than):
 *
 *     mat3.identity(dest);
 *     mat3.translate(dest, dest, vec);
 *
 * @param {mat3} out mat3 receiving operation result
 * @param {ReadonlyVec2} v Translation vector
 * @returns {mat3} out
 */
function fromTranslation(out, v) {
  out[0] = 1;
  out[1] = 0;
  out[2] = 0;
  out[3] = 0;
  out[4] = 1;
  out[5] = 0;
  out[6] = v[0];
  out[7] = v[1];
  out[8] = 1;
  return out;
}

/**
 * Creates a matrix from a given angle
 * This is equivalent to (but much faster than):
 *
 *     mat3.identity(dest);
 *     mat3.rotate(dest, dest, rad);
 *
 * @param {mat3} out mat3 receiving operation result
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat3} out
 */
function fromRotation(out, rad) {
  var s = Math.sin(rad),
    c = Math.cos(rad);
  out[0] = c;
  out[1] = s;
  out[2] = 0;
  out[3] = -s;
  out[4] = c;
  out[5] = 0;
  out[6] = 0;
  out[7] = 0;
  out[8] = 1;
  return out;
}

/**
 * Creates a matrix from a vector scaling
 * This is equivalent to (but much faster than):
 *
 *     mat3.identity(dest);
 *     mat3.scale(dest, dest, vec);
 *
 * @param {mat3} out mat3 receiving operation result
 * @param {ReadonlyVec2} v Scaling vector
 * @returns {mat3} out
 */
function fromScaling(out, v) {
  out[0] = v[0];
  out[1] = 0;
  out[2] = 0;
  out[3] = 0;
  out[4] = v[1];
  out[5] = 0;
  out[6] = 0;
  out[7] = 0;
  out[8] = 1;
  return out;
}

/**
 * Copies the values from a mat2d into a mat3
 *
 * @param {mat3} out the receiving matrix
 * @param {ReadonlyMat2d} a the matrix to copy
 * @returns {mat3} out
 **/
function fromMat2d(out, a) {
  out[0] = a[0];
  out[1] = a[1];
  out[2] = 0;
  out[3] = a[2];
  out[4] = a[3];
  out[5] = 0;
  out[6] = a[4];
  out[7] = a[5];
  out[8] = 1;
  return out;
}

/**
 * Calculates a 3x3 matrix from the given quaternion
 *
 * @param {mat3} out mat3 receiving operation result
 * @param {ReadonlyQuat} q Quaternion to create matrix from
 *
 * @returns {mat3} out
 */
function fromQuat(out, q) {
  var x = q[0],
    y = q[1],
    z = q[2],
    w = q[3];
  var x2 = x + x;
  var y2 = y + y;
  var z2 = z + z;
  var xx = x * x2;
  var yx = y * x2;
  var yy = y * y2;
  var zx = z * x2;
  var zy = z * y2;
  var zz = z * z2;
  var wx = w * x2;
  var wy = w * y2;
  var wz = w * z2;
  out[0] = 1 - yy - zz;
  out[3] = yx - wz;
  out[6] = zx + wy;
  out[1] = yx + wz;
  out[4] = 1 - xx - zz;
  out[7] = zy - wx;
  out[2] = zx - wy;
  out[5] = zy + wx;
  out[8] = 1 - xx - yy;
  return out;
}

/**
 * Calculates a 3x3 normal matrix (transpose inverse) from the 4x4 matrix
 *
 * @param {mat3} out mat3 receiving operation result
 * @param {ReadonlyMat4} a Mat4 to derive the normal matrix from
 *
 * @returns {mat3} out
 */
function normalFromMat4(out, a) {
  var a00 = a[0],
    a01 = a[1],
    a02 = a[2],
    a03 = a[3];
  var a10 = a[4],
    a11 = a[5],
    a12 = a[6],
    a13 = a[7];
  var a20 = a[8],
    a21 = a[9],
    a22 = a[10],
    a23 = a[11];
  var a30 = a[12],
    a31 = a[13],
    a32 = a[14],
    a33 = a[15];
  var b00 = a00 * a11 - a01 * a10;
  var b01 = a00 * a12 - a02 * a10;
  var b02 = a00 * a13 - a03 * a10;
  var b03 = a01 * a12 - a02 * a11;
  var b04 = a01 * a13 - a03 * a11;
  var b05 = a02 * a13 - a03 * a12;
  var b06 = a20 * a31 - a21 * a30;
  var b07 = a20 * a32 - a22 * a30;
  var b08 = a20 * a33 - a23 * a30;
  var b09 = a21 * a32 - a22 * a31;
  var b10 = a21 * a33 - a23 * a31;
  var b11 = a22 * a33 - a23 * a32;

  // Calculate the determinant
  var det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
  if (!det) {
    return null;
  }
  det = 1.0 / det;
  out[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det;
  out[1] = (a12 * b08 - a10 * b11 - a13 * b07) * det;
  out[2] = (a10 * b10 - a11 * b08 + a13 * b06) * det;
  out[3] = (a02 * b10 - a01 * b11 - a03 * b09) * det;
  out[4] = (a00 * b11 - a02 * b08 + a03 * b07) * det;
  out[5] = (a01 * b08 - a00 * b10 - a03 * b06) * det;
  out[6] = (a31 * b05 - a32 * b04 + a33 * b03) * det;
  out[7] = (a32 * b02 - a30 * b05 - a33 * b01) * det;
  out[8] = (a30 * b04 - a31 * b02 + a33 * b00) * det;
  return out;
}

/**
 * Generates a 2D projection matrix with the given bounds
 *
 * @param {mat3} out mat3 frustum matrix will be written into
 * @param {number} width Width of your gl context
 * @param {number} height Height of gl context
 * @returns {mat3} out
 */
function projection(out, width, height) {
  out[0] = 2 / width;
  out[1] = 0;
  out[2] = 0;
  out[3] = 0;
  out[4] = -2 / height;
  out[5] = 0;
  out[6] = -1;
  out[7] = 1;
  out[8] = 1;
  return out;
}

/**
 * Returns a string representation of a mat3
 *
 * @param {ReadonlyMat3} a matrix to represent as a string
 * @returns {String} string representation of the matrix
 */
function str(a) {
  return "mat3(" + a[0] + ", " + a[1] + ", " + a[2] + ", " + a[3] + ", " + a[4] + ", " + a[5] + ", " + a[6] + ", " + a[7] + ", " + a[8] + ")";
}

/**
 * Returns Frobenius norm of a mat3
 *
 * @param {ReadonlyMat3} a the matrix to calculate Frobenius norm of
 * @returns {Number} Frobenius norm
 */
function frob(a) {
  return Math.sqrt(a[0] * a[0] + a[1] * a[1] + a[2] * a[2] + a[3] * a[3] + a[4] * a[4] + a[5] * a[5] + a[6] * a[6] + a[7] * a[7] + a[8] * a[8]);
}

/**
 * Adds two mat3's
 *
 * @param {mat3} out the receiving matrix
 * @param {ReadonlyMat3} a the first operand
 * @param {ReadonlyMat3} b the second operand
 * @returns {mat3} out
 */
function add(out, a, b) {
  out[0] = a[0] + b[0];
  out[1] = a[1] + b[1];
  out[2] = a[2] + b[2];
  out[3] = a[3] + b[3];
  out[4] = a[4] + b[4];
  out[5] = a[5] + b[5];
  out[6] = a[6] + b[6];
  out[7] = a[7] + b[7];
  out[8] = a[8] + b[8];
  return out;
}

/**
 * Subtracts matrix b from matrix a
 *
 * @param {mat3} out the receiving matrix
 * @param {ReadonlyMat3} a the first operand
 * @param {ReadonlyMat3} b the second operand
 * @returns {mat3} out
 */
function subtract(out, a, b) {
  out[0] = a[0] - b[0];
  out[1] = a[1] - b[1];
  out[2] = a[2] - b[2];
  out[3] = a[3] - b[3];
  out[4] = a[4] - b[4];
  out[5] = a[5] - b[5];
  out[6] = a[6] - b[6];
  out[7] = a[7] - b[7];
  out[8] = a[8] - b[8];
  return out;
}

/**
 * Multiply each element of the matrix by a scalar.
 *
 * @param {mat3} out the receiving matrix
 * @param {ReadonlyMat3} a the matrix to scale
 * @param {Number} b amount to scale the matrix's elements by
 * @returns {mat3} out
 */
function multiplyScalar(out, a, b) {
  out[0] = a[0] * b;
  out[1] = a[1] * b;
  out[2] = a[2] * b;
  out[3] = a[3] * b;
  out[4] = a[4] * b;
  out[5] = a[5] * b;
  out[6] = a[6] * b;
  out[7] = a[7] * b;
  out[8] = a[8] * b;
  return out;
}

/**
 * Adds two mat3's after multiplying each element of the second operand by a scalar value.
 *
 * @param {mat3} out the receiving vector
 * @param {ReadonlyMat3} a the first operand
 * @param {ReadonlyMat3} b the second operand
 * @param {Number} scale the amount to scale b's elements by before adding
 * @returns {mat3} out
 */
function multiplyScalarAndAdd(out, a, b, scale) {
  out[0] = a[0] + b[0] * scale;
  out[1] = a[1] + b[1] * scale;
  out[2] = a[2] + b[2] * scale;
  out[3] = a[3] + b[3] * scale;
  out[4] = a[4] + b[4] * scale;
  out[5] = a[5] + b[5] * scale;
  out[6] = a[6] + b[6] * scale;
  out[7] = a[7] + b[7] * scale;
  out[8] = a[8] + b[8] * scale;
  return out;
}

/**
 * Returns whether or not the matrices have exactly the same elements in the same position (when compared with ===)
 *
 * @param {ReadonlyMat3} a The first matrix.
 * @param {ReadonlyMat3} b The second matrix.
 * @returns {Boolean} True if the matrices are equal, false otherwise.
 */
function exactEquals(a, b) {
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3] && a[4] === b[4] && a[5] === b[5] && a[6] === b[6] && a[7] === b[7] && a[8] === b[8];
}

/**
 * Returns whether or not the matrices have approximately the same elements in the same position.
 *
 * @param {ReadonlyMat3} a The first matrix.
 * @param {ReadonlyMat3} b The second matrix.
 * @returns {Boolean} True if the matrices are equal, false otherwise.
 */
function equals(a, b) {
  var a0 = a[0],
    a1 = a[1],
    a2 = a[2],
    a3 = a[3],
    a4 = a[4],
    a5 = a[5],
    a6 = a[6],
    a7 = a[7],
    a8 = a[8];
  var b0 = b[0],
    b1 = b[1],
    b2 = b[2],
    b3 = b[3],
    b4 = b[4],
    b5 = b[5],
    b6 = b[6],
    b7 = b[7],
    b8 = b[8];
  return Math.abs(a0 - b0) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a0), Math.abs(b0)) && Math.abs(a1 - b1) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a1), Math.abs(b1)) && Math.abs(a2 - b2) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a2), Math.abs(b2)) && Math.abs(a3 - b3) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a3), Math.abs(b3)) && Math.abs(a4 - b4) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a4), Math.abs(b4)) && Math.abs(a5 - b5) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a5), Math.abs(b5)) && Math.abs(a6 - b6) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a6), Math.abs(b6)) && Math.abs(a7 - b7) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a7), Math.abs(b7)) && Math.abs(a8 - b8) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a8), Math.abs(b8));
}

/**
 * Alias for {@link mat3.multiply}
 * @function
 */
var mul = exports.mul = multiply;

/**
 * Alias for {@link mat3.subtract}
 * @function
 */
var sub = exports.sub = subtract;

},{"./common.js":4}],9:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.add = add;
exports.adjoint = adjoint;
exports.clone = clone;
exports.copy = copy;
exports.create = create;
exports.decompose = decompose;
exports.determinant = determinant;
exports.equals = equals;
exports.exactEquals = exactEquals;
exports.frob = frob;
exports.fromQuat = fromQuat;
exports.fromQuat2 = fromQuat2;
exports.fromRotation = fromRotation;
exports.fromRotationTranslation = fromRotationTranslation;
exports.fromRotationTranslationScale = fromRotationTranslationScale;
exports.fromRotationTranslationScaleOrigin = fromRotationTranslationScaleOrigin;
exports.fromScaling = fromScaling;
exports.fromTranslation = fromTranslation;
exports.fromValues = fromValues;
exports.fromXRotation = fromXRotation;
exports.fromYRotation = fromYRotation;
exports.fromZRotation = fromZRotation;
exports.frustum = frustum;
exports.getRotation = getRotation;
exports.getScaling = getScaling;
exports.getTranslation = getTranslation;
exports.identity = identity;
exports.invert = invert;
exports.lookAt = lookAt;
exports.mul = void 0;
exports.multiply = multiply;
exports.multiplyScalar = multiplyScalar;
exports.multiplyScalarAndAdd = multiplyScalarAndAdd;
exports.ortho = void 0;
exports.orthoNO = orthoNO;
exports.orthoZO = orthoZO;
exports.perspective = void 0;
exports.perspectiveFromFieldOfView = perspectiveFromFieldOfView;
exports.perspectiveNO = perspectiveNO;
exports.perspectiveZO = perspectiveZO;
exports.rotate = rotate;
exports.rotateX = rotateX;
exports.rotateY = rotateY;
exports.rotateZ = rotateZ;
exports.scale = scale;
exports.set = set;
exports.str = str;
exports.sub = void 0;
exports.subtract = subtract;
exports.targetTo = targetTo;
exports.translate = translate;
exports.transpose = transpose;
var glMatrix = _interopRequireWildcard(require("./common.js"));
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
/**
 * 4x4 Matrix<br>Format: column-major, when typed out it looks like row-major<br>The matrices are being post multiplied.
 * @module mat4
 */

/**
 * Creates a new identity mat4
 *
 * @returns {mat4} a new 4x4 matrix
 */
function create() {
  var out = new glMatrix.ARRAY_TYPE(16);
  if (glMatrix.ARRAY_TYPE != Float32Array) {
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[6] = 0;
    out[7] = 0;
    out[8] = 0;
    out[9] = 0;
    out[11] = 0;
    out[12] = 0;
    out[13] = 0;
    out[14] = 0;
  }
  out[0] = 1;
  out[5] = 1;
  out[10] = 1;
  out[15] = 1;
  return out;
}

/**
 * Creates a new mat4 initialized with values from an existing matrix
 *
 * @param {ReadonlyMat4} a matrix to clone
 * @returns {mat4} a new 4x4 matrix
 */
function clone(a) {
  var out = new glMatrix.ARRAY_TYPE(16);
  out[0] = a[0];
  out[1] = a[1];
  out[2] = a[2];
  out[3] = a[3];
  out[4] = a[4];
  out[5] = a[5];
  out[6] = a[6];
  out[7] = a[7];
  out[8] = a[8];
  out[9] = a[9];
  out[10] = a[10];
  out[11] = a[11];
  out[12] = a[12];
  out[13] = a[13];
  out[14] = a[14];
  out[15] = a[15];
  return out;
}

/**
 * Copy the values from one mat4 to another
 *
 * @param {mat4} out the receiving matrix
 * @param {ReadonlyMat4} a the source matrix
 * @returns {mat4} out
 */
function copy(out, a) {
  out[0] = a[0];
  out[1] = a[1];
  out[2] = a[2];
  out[3] = a[3];
  out[4] = a[4];
  out[5] = a[5];
  out[6] = a[6];
  out[7] = a[7];
  out[8] = a[8];
  out[9] = a[9];
  out[10] = a[10];
  out[11] = a[11];
  out[12] = a[12];
  out[13] = a[13];
  out[14] = a[14];
  out[15] = a[15];
  return out;
}

/**
 * Create a new mat4 with the given values
 *
 * @param {Number} m00 Component in column 0, row 0 position (index 0)
 * @param {Number} m01 Component in column 0, row 1 position (index 1)
 * @param {Number} m02 Component in column 0, row 2 position (index 2)
 * @param {Number} m03 Component in column 0, row 3 position (index 3)
 * @param {Number} m10 Component in column 1, row 0 position (index 4)
 * @param {Number} m11 Component in column 1, row 1 position (index 5)
 * @param {Number} m12 Component in column 1, row 2 position (index 6)
 * @param {Number} m13 Component in column 1, row 3 position (index 7)
 * @param {Number} m20 Component in column 2, row 0 position (index 8)
 * @param {Number} m21 Component in column 2, row 1 position (index 9)
 * @param {Number} m22 Component in column 2, row 2 position (index 10)
 * @param {Number} m23 Component in column 2, row 3 position (index 11)
 * @param {Number} m30 Component in column 3, row 0 position (index 12)
 * @param {Number} m31 Component in column 3, row 1 position (index 13)
 * @param {Number} m32 Component in column 3, row 2 position (index 14)
 * @param {Number} m33 Component in column 3, row 3 position (index 15)
 * @returns {mat4} A new mat4
 */
function fromValues(m00, m01, m02, m03, m10, m11, m12, m13, m20, m21, m22, m23, m30, m31, m32, m33) {
  var out = new glMatrix.ARRAY_TYPE(16);
  out[0] = m00;
  out[1] = m01;
  out[2] = m02;
  out[3] = m03;
  out[4] = m10;
  out[5] = m11;
  out[6] = m12;
  out[7] = m13;
  out[8] = m20;
  out[9] = m21;
  out[10] = m22;
  out[11] = m23;
  out[12] = m30;
  out[13] = m31;
  out[14] = m32;
  out[15] = m33;
  return out;
}

/**
 * Set the components of a mat4 to the given values
 *
 * @param {mat4} out the receiving matrix
 * @param {Number} m00 Component in column 0, row 0 position (index 0)
 * @param {Number} m01 Component in column 0, row 1 position (index 1)
 * @param {Number} m02 Component in column 0, row 2 position (index 2)
 * @param {Number} m03 Component in column 0, row 3 position (index 3)
 * @param {Number} m10 Component in column 1, row 0 position (index 4)
 * @param {Number} m11 Component in column 1, row 1 position (index 5)
 * @param {Number} m12 Component in column 1, row 2 position (index 6)
 * @param {Number} m13 Component in column 1, row 3 position (index 7)
 * @param {Number} m20 Component in column 2, row 0 position (index 8)
 * @param {Number} m21 Component in column 2, row 1 position (index 9)
 * @param {Number} m22 Component in column 2, row 2 position (index 10)
 * @param {Number} m23 Component in column 2, row 3 position (index 11)
 * @param {Number} m30 Component in column 3, row 0 position (index 12)
 * @param {Number} m31 Component in column 3, row 1 position (index 13)
 * @param {Number} m32 Component in column 3, row 2 position (index 14)
 * @param {Number} m33 Component in column 3, row 3 position (index 15)
 * @returns {mat4} out
 */
function set(out, m00, m01, m02, m03, m10, m11, m12, m13, m20, m21, m22, m23, m30, m31, m32, m33) {
  out[0] = m00;
  out[1] = m01;
  out[2] = m02;
  out[3] = m03;
  out[4] = m10;
  out[5] = m11;
  out[6] = m12;
  out[7] = m13;
  out[8] = m20;
  out[9] = m21;
  out[10] = m22;
  out[11] = m23;
  out[12] = m30;
  out[13] = m31;
  out[14] = m32;
  out[15] = m33;
  return out;
}

/**
 * Set a mat4 to the identity matrix
 *
 * @param {mat4} out the receiving matrix
 * @returns {mat4} out
 */
function identity(out) {
  out[0] = 1;
  out[1] = 0;
  out[2] = 0;
  out[3] = 0;
  out[4] = 0;
  out[5] = 1;
  out[6] = 0;
  out[7] = 0;
  out[8] = 0;
  out[9] = 0;
  out[10] = 1;
  out[11] = 0;
  out[12] = 0;
  out[13] = 0;
  out[14] = 0;
  out[15] = 1;
  return out;
}

/**
 * Transpose the values of a mat4
 *
 * @param {mat4} out the receiving matrix
 * @param {ReadonlyMat4} a the source matrix
 * @returns {mat4} out
 */
function transpose(out, a) {
  // If we are transposing ourselves we can skip a few steps but have to cache some values
  if (out === a) {
    var a01 = a[1],
      a02 = a[2],
      a03 = a[3];
    var a12 = a[6],
      a13 = a[7];
    var a23 = a[11];
    out[1] = a[4];
    out[2] = a[8];
    out[3] = a[12];
    out[4] = a01;
    out[6] = a[9];
    out[7] = a[13];
    out[8] = a02;
    out[9] = a12;
    out[11] = a[14];
    out[12] = a03;
    out[13] = a13;
    out[14] = a23;
  } else {
    out[0] = a[0];
    out[1] = a[4];
    out[2] = a[8];
    out[3] = a[12];
    out[4] = a[1];
    out[5] = a[5];
    out[6] = a[9];
    out[7] = a[13];
    out[8] = a[2];
    out[9] = a[6];
    out[10] = a[10];
    out[11] = a[14];
    out[12] = a[3];
    out[13] = a[7];
    out[14] = a[11];
    out[15] = a[15];
  }
  return out;
}

/**
 * Inverts a mat4
 *
 * @param {mat4} out the receiving matrix
 * @param {ReadonlyMat4} a the source matrix
 * @returns {mat4 | null} out, or null if source matrix is not invertible
 */
function invert(out, a) {
  var a00 = a[0],
    a01 = a[1],
    a02 = a[2],
    a03 = a[3];
  var a10 = a[4],
    a11 = a[5],
    a12 = a[6],
    a13 = a[7];
  var a20 = a[8],
    a21 = a[9],
    a22 = a[10],
    a23 = a[11];
  var a30 = a[12],
    a31 = a[13],
    a32 = a[14],
    a33 = a[15];
  var b00 = a00 * a11 - a01 * a10;
  var b01 = a00 * a12 - a02 * a10;
  var b02 = a00 * a13 - a03 * a10;
  var b03 = a01 * a12 - a02 * a11;
  var b04 = a01 * a13 - a03 * a11;
  var b05 = a02 * a13 - a03 * a12;
  var b06 = a20 * a31 - a21 * a30;
  var b07 = a20 * a32 - a22 * a30;
  var b08 = a20 * a33 - a23 * a30;
  var b09 = a21 * a32 - a22 * a31;
  var b10 = a21 * a33 - a23 * a31;
  var b11 = a22 * a33 - a23 * a32;

  // Calculate the determinant
  var det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
  if (!det) {
    return null;
  }
  det = 1.0 / det;
  out[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det;
  out[1] = (a02 * b10 - a01 * b11 - a03 * b09) * det;
  out[2] = (a31 * b05 - a32 * b04 + a33 * b03) * det;
  out[3] = (a22 * b04 - a21 * b05 - a23 * b03) * det;
  out[4] = (a12 * b08 - a10 * b11 - a13 * b07) * det;
  out[5] = (a00 * b11 - a02 * b08 + a03 * b07) * det;
  out[6] = (a32 * b02 - a30 * b05 - a33 * b01) * det;
  out[7] = (a20 * b05 - a22 * b02 + a23 * b01) * det;
  out[8] = (a10 * b10 - a11 * b08 + a13 * b06) * det;
  out[9] = (a01 * b08 - a00 * b10 - a03 * b06) * det;
  out[10] = (a30 * b04 - a31 * b02 + a33 * b00) * det;
  out[11] = (a21 * b02 - a20 * b04 - a23 * b00) * det;
  out[12] = (a11 * b07 - a10 * b09 - a12 * b06) * det;
  out[13] = (a00 * b09 - a01 * b07 + a02 * b06) * det;
  out[14] = (a31 * b01 - a30 * b03 - a32 * b00) * det;
  out[15] = (a20 * b03 - a21 * b01 + a22 * b00) * det;
  return out;
}

/**
 * Calculates the adjugate of a mat4
 *
 * @param {mat4} out the receiving matrix
 * @param {ReadonlyMat4} a the source matrix
 * @returns {mat4} out
 */
function adjoint(out, a) {
  var a00 = a[0],
    a01 = a[1],
    a02 = a[2],
    a03 = a[3];
  var a10 = a[4],
    a11 = a[5],
    a12 = a[6],
    a13 = a[7];
  var a20 = a[8],
    a21 = a[9],
    a22 = a[10],
    a23 = a[11];
  var a30 = a[12],
    a31 = a[13],
    a32 = a[14],
    a33 = a[15];
  var b00 = a00 * a11 - a01 * a10;
  var b01 = a00 * a12 - a02 * a10;
  var b02 = a00 * a13 - a03 * a10;
  var b03 = a01 * a12 - a02 * a11;
  var b04 = a01 * a13 - a03 * a11;
  var b05 = a02 * a13 - a03 * a12;
  var b06 = a20 * a31 - a21 * a30;
  var b07 = a20 * a32 - a22 * a30;
  var b08 = a20 * a33 - a23 * a30;
  var b09 = a21 * a32 - a22 * a31;
  var b10 = a21 * a33 - a23 * a31;
  var b11 = a22 * a33 - a23 * a32;
  out[0] = a11 * b11 - a12 * b10 + a13 * b09;
  out[1] = a02 * b10 - a01 * b11 - a03 * b09;
  out[2] = a31 * b05 - a32 * b04 + a33 * b03;
  out[3] = a22 * b04 - a21 * b05 - a23 * b03;
  out[4] = a12 * b08 - a10 * b11 - a13 * b07;
  out[5] = a00 * b11 - a02 * b08 + a03 * b07;
  out[6] = a32 * b02 - a30 * b05 - a33 * b01;
  out[7] = a20 * b05 - a22 * b02 + a23 * b01;
  out[8] = a10 * b10 - a11 * b08 + a13 * b06;
  out[9] = a01 * b08 - a00 * b10 - a03 * b06;
  out[10] = a30 * b04 - a31 * b02 + a33 * b00;
  out[11] = a21 * b02 - a20 * b04 - a23 * b00;
  out[12] = a11 * b07 - a10 * b09 - a12 * b06;
  out[13] = a00 * b09 - a01 * b07 + a02 * b06;
  out[14] = a31 * b01 - a30 * b03 - a32 * b00;
  out[15] = a20 * b03 - a21 * b01 + a22 * b00;
  return out;
}

/**
 * Calculates the determinant of a mat4
 *
 * @param {ReadonlyMat4} a the source matrix
 * @returns {Number} determinant of a
 */
function determinant(a) {
  var a00 = a[0],
    a01 = a[1],
    a02 = a[2],
    a03 = a[3];
  var a10 = a[4],
    a11 = a[5],
    a12 = a[6],
    a13 = a[7];
  var a20 = a[8],
    a21 = a[9],
    a22 = a[10],
    a23 = a[11];
  var a30 = a[12],
    a31 = a[13],
    a32 = a[14],
    a33 = a[15];
  var b0 = a00 * a11 - a01 * a10;
  var b1 = a00 * a12 - a02 * a10;
  var b2 = a01 * a12 - a02 * a11;
  var b3 = a20 * a31 - a21 * a30;
  var b4 = a20 * a32 - a22 * a30;
  var b5 = a21 * a32 - a22 * a31;
  var b6 = a00 * b5 - a01 * b4 + a02 * b3;
  var b7 = a10 * b5 - a11 * b4 + a12 * b3;
  var b8 = a20 * b2 - a21 * b1 + a22 * b0;
  var b9 = a30 * b2 - a31 * b1 + a32 * b0;

  // Calculate the determinant
  return a13 * b6 - a03 * b7 + a33 * b8 - a23 * b9;
}

/**
 * Multiplies two mat4s
 *
 * @param {mat4} out the receiving matrix
 * @param {ReadonlyMat4} a the first operand
 * @param {ReadonlyMat4} b the second operand
 * @returns {mat4} out
 */
function multiply(out, a, b) {
  var a00 = a[0],
    a01 = a[1],
    a02 = a[2],
    a03 = a[3];
  var a10 = a[4],
    a11 = a[5],
    a12 = a[6],
    a13 = a[7];
  var a20 = a[8],
    a21 = a[9],
    a22 = a[10],
    a23 = a[11];
  var a30 = a[12],
    a31 = a[13],
    a32 = a[14],
    a33 = a[15];

  // Cache only the current line of the second matrix
  var b0 = b[0],
    b1 = b[1],
    b2 = b[2],
    b3 = b[3];
  out[0] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
  out[1] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
  out[2] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
  out[3] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
  b0 = b[4];
  b1 = b[5];
  b2 = b[6];
  b3 = b[7];
  out[4] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
  out[5] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
  out[6] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
  out[7] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
  b0 = b[8];
  b1 = b[9];
  b2 = b[10];
  b3 = b[11];
  out[8] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
  out[9] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
  out[10] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
  out[11] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
  b0 = b[12];
  b1 = b[13];
  b2 = b[14];
  b3 = b[15];
  out[12] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
  out[13] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
  out[14] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
  out[15] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
  return out;
}

/**
 * Translate a mat4 by the given vector
 *
 * @param {mat4} out the receiving matrix
 * @param {ReadonlyMat4} a the matrix to translate
 * @param {ReadonlyVec3} v vector to translate by
 * @returns {mat4} out
 */
function translate(out, a, v) {
  var x = v[0],
    y = v[1],
    z = v[2];
  var a00, a01, a02, a03;
  var a10, a11, a12, a13;
  var a20, a21, a22, a23;
  if (a === out) {
    out[12] = a[0] * x + a[4] * y + a[8] * z + a[12];
    out[13] = a[1] * x + a[5] * y + a[9] * z + a[13];
    out[14] = a[2] * x + a[6] * y + a[10] * z + a[14];
    out[15] = a[3] * x + a[7] * y + a[11] * z + a[15];
  } else {
    a00 = a[0];
    a01 = a[1];
    a02 = a[2];
    a03 = a[3];
    a10 = a[4];
    a11 = a[5];
    a12 = a[6];
    a13 = a[7];
    a20 = a[8];
    a21 = a[9];
    a22 = a[10];
    a23 = a[11];
    out[0] = a00;
    out[1] = a01;
    out[2] = a02;
    out[3] = a03;
    out[4] = a10;
    out[5] = a11;
    out[6] = a12;
    out[7] = a13;
    out[8] = a20;
    out[9] = a21;
    out[10] = a22;
    out[11] = a23;
    out[12] = a00 * x + a10 * y + a20 * z + a[12];
    out[13] = a01 * x + a11 * y + a21 * z + a[13];
    out[14] = a02 * x + a12 * y + a22 * z + a[14];
    out[15] = a03 * x + a13 * y + a23 * z + a[15];
  }
  return out;
}

/**
 * Scales the mat4 by the dimensions in the given vec3 not using vectorization
 *
 * @param {mat4} out the receiving matrix
 * @param {ReadonlyMat4} a the matrix to scale
 * @param {ReadonlyVec3} v the vec3 to scale the matrix by
 * @returns {mat4} out
 **/
function scale(out, a, v) {
  var x = v[0],
    y = v[1],
    z = v[2];
  out[0] = a[0] * x;
  out[1] = a[1] * x;
  out[2] = a[2] * x;
  out[3] = a[3] * x;
  out[4] = a[4] * y;
  out[5] = a[5] * y;
  out[6] = a[6] * y;
  out[7] = a[7] * y;
  out[8] = a[8] * z;
  out[9] = a[9] * z;
  out[10] = a[10] * z;
  out[11] = a[11] * z;
  out[12] = a[12];
  out[13] = a[13];
  out[14] = a[14];
  out[15] = a[15];
  return out;
}

/**
 * Rotates a mat4 by the given angle around the given axis
 *
 * @param {mat4} out the receiving matrix
 * @param {ReadonlyMat4} a the matrix to rotate
 * @param {Number} rad the angle to rotate the matrix by
 * @param {ReadonlyVec3} axis the axis to rotate around
 * @returns {mat4} out
 */
function rotate(out, a, rad, axis) {
  var x = axis[0],
    y = axis[1],
    z = axis[2];
  var len = Math.sqrt(x * x + y * y + z * z);
  var s, c, t;
  var a00, a01, a02, a03;
  var a10, a11, a12, a13;
  var a20, a21, a22, a23;
  var b00, b01, b02;
  var b10, b11, b12;
  var b20, b21, b22;
  if (len < glMatrix.EPSILON) {
    return null;
  }
  len = 1 / len;
  x *= len;
  y *= len;
  z *= len;
  s = Math.sin(rad);
  c = Math.cos(rad);
  t = 1 - c;
  a00 = a[0];
  a01 = a[1];
  a02 = a[2];
  a03 = a[3];
  a10 = a[4];
  a11 = a[5];
  a12 = a[6];
  a13 = a[7];
  a20 = a[8];
  a21 = a[9];
  a22 = a[10];
  a23 = a[11];

  // Construct the elements of the rotation matrix
  b00 = x * x * t + c;
  b01 = y * x * t + z * s;
  b02 = z * x * t - y * s;
  b10 = x * y * t - z * s;
  b11 = y * y * t + c;
  b12 = z * y * t + x * s;
  b20 = x * z * t + y * s;
  b21 = y * z * t - x * s;
  b22 = z * z * t + c;

  // Perform rotation-specific matrix multiplication
  out[0] = a00 * b00 + a10 * b01 + a20 * b02;
  out[1] = a01 * b00 + a11 * b01 + a21 * b02;
  out[2] = a02 * b00 + a12 * b01 + a22 * b02;
  out[3] = a03 * b00 + a13 * b01 + a23 * b02;
  out[4] = a00 * b10 + a10 * b11 + a20 * b12;
  out[5] = a01 * b10 + a11 * b11 + a21 * b12;
  out[6] = a02 * b10 + a12 * b11 + a22 * b12;
  out[7] = a03 * b10 + a13 * b11 + a23 * b12;
  out[8] = a00 * b20 + a10 * b21 + a20 * b22;
  out[9] = a01 * b20 + a11 * b21 + a21 * b22;
  out[10] = a02 * b20 + a12 * b21 + a22 * b22;
  out[11] = a03 * b20 + a13 * b21 + a23 * b22;
  if (a !== out) {
    // If the source and destination differ, copy the unchanged last row
    out[12] = a[12];
    out[13] = a[13];
    out[14] = a[14];
    out[15] = a[15];
  }
  return out;
}

/**
 * Rotates a matrix by the given angle around the X axis
 *
 * @param {mat4} out the receiving matrix
 * @param {ReadonlyMat4} a the matrix to rotate
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat4} out
 */
function rotateX(out, a, rad) {
  var s = Math.sin(rad);
  var c = Math.cos(rad);
  var a10 = a[4];
  var a11 = a[5];
  var a12 = a[6];
  var a13 = a[7];
  var a20 = a[8];
  var a21 = a[9];
  var a22 = a[10];
  var a23 = a[11];
  if (a !== out) {
    // If the source and destination differ, copy the unchanged rows
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];
    out[12] = a[12];
    out[13] = a[13];
    out[14] = a[14];
    out[15] = a[15];
  }

  // Perform axis-specific matrix multiplication
  out[4] = a10 * c + a20 * s;
  out[5] = a11 * c + a21 * s;
  out[6] = a12 * c + a22 * s;
  out[7] = a13 * c + a23 * s;
  out[8] = a20 * c - a10 * s;
  out[9] = a21 * c - a11 * s;
  out[10] = a22 * c - a12 * s;
  out[11] = a23 * c - a13 * s;
  return out;
}

/**
 * Rotates a matrix by the given angle around the Y axis
 *
 * @param {mat4} out the receiving matrix
 * @param {ReadonlyMat4} a the matrix to rotate
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat4} out
 */
function rotateY(out, a, rad) {
  var s = Math.sin(rad);
  var c = Math.cos(rad);
  var a00 = a[0];
  var a01 = a[1];
  var a02 = a[2];
  var a03 = a[3];
  var a20 = a[8];
  var a21 = a[9];
  var a22 = a[10];
  var a23 = a[11];
  if (a !== out) {
    // If the source and destination differ, copy the unchanged rows
    out[4] = a[4];
    out[5] = a[5];
    out[6] = a[6];
    out[7] = a[7];
    out[12] = a[12];
    out[13] = a[13];
    out[14] = a[14];
    out[15] = a[15];
  }

  // Perform axis-specific matrix multiplication
  out[0] = a00 * c - a20 * s;
  out[1] = a01 * c - a21 * s;
  out[2] = a02 * c - a22 * s;
  out[3] = a03 * c - a23 * s;
  out[8] = a00 * s + a20 * c;
  out[9] = a01 * s + a21 * c;
  out[10] = a02 * s + a22 * c;
  out[11] = a03 * s + a23 * c;
  return out;
}

/**
 * Rotates a matrix by the given angle around the Z axis
 *
 * @param {mat4} out the receiving matrix
 * @param {ReadonlyMat4} a the matrix to rotate
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat4} out
 */
function rotateZ(out, a, rad) {
  var s = Math.sin(rad);
  var c = Math.cos(rad);
  var a00 = a[0];
  var a01 = a[1];
  var a02 = a[2];
  var a03 = a[3];
  var a10 = a[4];
  var a11 = a[5];
  var a12 = a[6];
  var a13 = a[7];
  if (a !== out) {
    // If the source and destination differ, copy the unchanged last row
    out[8] = a[8];
    out[9] = a[9];
    out[10] = a[10];
    out[11] = a[11];
    out[12] = a[12];
    out[13] = a[13];
    out[14] = a[14];
    out[15] = a[15];
  }

  // Perform axis-specific matrix multiplication
  out[0] = a00 * c + a10 * s;
  out[1] = a01 * c + a11 * s;
  out[2] = a02 * c + a12 * s;
  out[3] = a03 * c + a13 * s;
  out[4] = a10 * c - a00 * s;
  out[5] = a11 * c - a01 * s;
  out[6] = a12 * c - a02 * s;
  out[7] = a13 * c - a03 * s;
  return out;
}

/**
 * Creates a matrix from a vector translation
 * This is equivalent to (but much faster than):
 *
 *     mat4.identity(dest);
 *     mat4.translate(dest, dest, vec);
 *
 * @param {mat4} out mat4 receiving operation result
 * @param {ReadonlyVec3} v Translation vector
 * @returns {mat4} out
 */
function fromTranslation(out, v) {
  out[0] = 1;
  out[1] = 0;
  out[2] = 0;
  out[3] = 0;
  out[4] = 0;
  out[5] = 1;
  out[6] = 0;
  out[7] = 0;
  out[8] = 0;
  out[9] = 0;
  out[10] = 1;
  out[11] = 0;
  out[12] = v[0];
  out[13] = v[1];
  out[14] = v[2];
  out[15] = 1;
  return out;
}

/**
 * Creates a matrix from a vector scaling
 * This is equivalent to (but much faster than):
 *
 *     mat4.identity(dest);
 *     mat4.scale(dest, dest, vec);
 *
 * @param {mat4} out mat4 receiving operation result
 * @param {ReadonlyVec3} v Scaling vector
 * @returns {mat4} out
 */
function fromScaling(out, v) {
  out[0] = v[0];
  out[1] = 0;
  out[2] = 0;
  out[3] = 0;
  out[4] = 0;
  out[5] = v[1];
  out[6] = 0;
  out[7] = 0;
  out[8] = 0;
  out[9] = 0;
  out[10] = v[2];
  out[11] = 0;
  out[12] = 0;
  out[13] = 0;
  out[14] = 0;
  out[15] = 1;
  return out;
}

/**
 * Creates a matrix from a given angle around a given axis
 * This is equivalent to (but much faster than):
 *
 *     mat4.identity(dest);
 *     mat4.rotate(dest, dest, rad, axis);
 *
 * @param {mat4} out mat4 receiving operation result
 * @param {Number} rad the angle to rotate the matrix by
 * @param {ReadonlyVec3} axis the axis to rotate around
 * @returns {mat4} out
 */
function fromRotation(out, rad, axis) {
  var x = axis[0],
    y = axis[1],
    z = axis[2];
  var len = Math.sqrt(x * x + y * y + z * z);
  var s, c, t;
  if (len < glMatrix.EPSILON) {
    return null;
  }
  len = 1 / len;
  x *= len;
  y *= len;
  z *= len;
  s = Math.sin(rad);
  c = Math.cos(rad);
  t = 1 - c;

  // Perform rotation-specific matrix multiplication
  out[0] = x * x * t + c;
  out[1] = y * x * t + z * s;
  out[2] = z * x * t - y * s;
  out[3] = 0;
  out[4] = x * y * t - z * s;
  out[5] = y * y * t + c;
  out[6] = z * y * t + x * s;
  out[7] = 0;
  out[8] = x * z * t + y * s;
  out[9] = y * z * t - x * s;
  out[10] = z * z * t + c;
  out[11] = 0;
  out[12] = 0;
  out[13] = 0;
  out[14] = 0;
  out[15] = 1;
  return out;
}

/**
 * Creates a matrix from the given angle around the X axis
 * This is equivalent to (but much faster than):
 *
 *     mat4.identity(dest);
 *     mat4.rotateX(dest, dest, rad);
 *
 * @param {mat4} out mat4 receiving operation result
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat4} out
 */
function fromXRotation(out, rad) {
  var s = Math.sin(rad);
  var c = Math.cos(rad);

  // Perform axis-specific matrix multiplication
  out[0] = 1;
  out[1] = 0;
  out[2] = 0;
  out[3] = 0;
  out[4] = 0;
  out[5] = c;
  out[6] = s;
  out[7] = 0;
  out[8] = 0;
  out[9] = -s;
  out[10] = c;
  out[11] = 0;
  out[12] = 0;
  out[13] = 0;
  out[14] = 0;
  out[15] = 1;
  return out;
}

/**
 * Creates a matrix from the given angle around the Y axis
 * This is equivalent to (but much faster than):
 *
 *     mat4.identity(dest);
 *     mat4.rotateY(dest, dest, rad);
 *
 * @param {mat4} out mat4 receiving operation result
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat4} out
 */
function fromYRotation(out, rad) {
  var s = Math.sin(rad);
  var c = Math.cos(rad);

  // Perform axis-specific matrix multiplication
  out[0] = c;
  out[1] = 0;
  out[2] = -s;
  out[3] = 0;
  out[4] = 0;
  out[5] = 1;
  out[6] = 0;
  out[7] = 0;
  out[8] = s;
  out[9] = 0;
  out[10] = c;
  out[11] = 0;
  out[12] = 0;
  out[13] = 0;
  out[14] = 0;
  out[15] = 1;
  return out;
}

/**
 * Creates a matrix from the given angle around the Z axis
 * This is equivalent to (but much faster than):
 *
 *     mat4.identity(dest);
 *     mat4.rotateZ(dest, dest, rad);
 *
 * @param {mat4} out mat4 receiving operation result
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat4} out
 */
function fromZRotation(out, rad) {
  var s = Math.sin(rad);
  var c = Math.cos(rad);

  // Perform axis-specific matrix multiplication
  out[0] = c;
  out[1] = s;
  out[2] = 0;
  out[3] = 0;
  out[4] = -s;
  out[5] = c;
  out[6] = 0;
  out[7] = 0;
  out[8] = 0;
  out[9] = 0;
  out[10] = 1;
  out[11] = 0;
  out[12] = 0;
  out[13] = 0;
  out[14] = 0;
  out[15] = 1;
  return out;
}

/**
 * Creates a matrix from a quaternion rotation and vector translation
 * This is equivalent to (but much faster than):
 *
 *     mat4.identity(dest);
 *     mat4.translate(dest, dest, vec);
 *     let quatMat = mat4.create();
 *     mat4.fromQuat(quatMat, quat);
 *     mat4.multiply(dest, dest, quatMat);
 *
 * @param {mat4} out mat4 receiving operation result
 * @param {quat} q Rotation quaternion
 * @param {ReadonlyVec3} v Translation vector
 * @returns {mat4} out
 */
function fromRotationTranslation(out, q, v) {
  // Quaternion math
  var x = q[0],
    y = q[1],
    z = q[2],
    w = q[3];
  var x2 = x + x;
  var y2 = y + y;
  var z2 = z + z;
  var xx = x * x2;
  var xy = x * y2;
  var xz = x * z2;
  var yy = y * y2;
  var yz = y * z2;
  var zz = z * z2;
  var wx = w * x2;
  var wy = w * y2;
  var wz = w * z2;
  out[0] = 1 - (yy + zz);
  out[1] = xy + wz;
  out[2] = xz - wy;
  out[3] = 0;
  out[4] = xy - wz;
  out[5] = 1 - (xx + zz);
  out[6] = yz + wx;
  out[7] = 0;
  out[8] = xz + wy;
  out[9] = yz - wx;
  out[10] = 1 - (xx + yy);
  out[11] = 0;
  out[12] = v[0];
  out[13] = v[1];
  out[14] = v[2];
  out[15] = 1;
  return out;
}

/**
 * Creates a new mat4 from a dual quat.
 *
 * @param {mat4} out Matrix
 * @param {ReadonlyQuat2} a Dual Quaternion
 * @returns {mat4} mat4 receiving operation result
 */
function fromQuat2(out, a) {
  var translation = new glMatrix.ARRAY_TYPE(3);
  var bx = -a[0],
    by = -a[1],
    bz = -a[2],
    bw = a[3],
    ax = a[4],
    ay = a[5],
    az = a[6],
    aw = a[7];
  var magnitude = bx * bx + by * by + bz * bz + bw * bw;
  //Only scale if it makes sense
  if (magnitude > 0) {
    translation[0] = (ax * bw + aw * bx + ay * bz - az * by) * 2 / magnitude;
    translation[1] = (ay * bw + aw * by + az * bx - ax * bz) * 2 / magnitude;
    translation[2] = (az * bw + aw * bz + ax * by - ay * bx) * 2 / magnitude;
  } else {
    translation[0] = (ax * bw + aw * bx + ay * bz - az * by) * 2;
    translation[1] = (ay * bw + aw * by + az * bx - ax * bz) * 2;
    translation[2] = (az * bw + aw * bz + ax * by - ay * bx) * 2;
  }
  fromRotationTranslation(out, a, translation);
  return out;
}

/**
 * Returns the translation vector component of a transformation
 *  matrix. If a matrix is built with fromRotationTranslation,
 *  the returned vector will be the same as the translation vector
 *  originally supplied.
 * @param  {vec3} out Vector to receive translation component
 * @param  {ReadonlyMat4} mat Matrix to be decomposed (input)
 * @return {vec3} out
 */
function getTranslation(out, mat) {
  out[0] = mat[12];
  out[1] = mat[13];
  out[2] = mat[14];
  return out;
}

/**
 * Returns the scaling factor component of a transformation
 *  matrix. If a matrix is built with fromRotationTranslationScale
 *  with a normalized Quaternion parameter, the returned vector will be
 *  the same as the scaling vector
 *  originally supplied.
 * @param  {vec3} out Vector to receive scaling factor component
 * @param  {ReadonlyMat4} mat Matrix to be decomposed (input)
 * @return {vec3} out
 */
function getScaling(out, mat) {
  var m11 = mat[0];
  var m12 = mat[1];
  var m13 = mat[2];
  var m21 = mat[4];
  var m22 = mat[5];
  var m23 = mat[6];
  var m31 = mat[8];
  var m32 = mat[9];
  var m33 = mat[10];
  out[0] = Math.sqrt(m11 * m11 + m12 * m12 + m13 * m13);
  out[1] = Math.sqrt(m21 * m21 + m22 * m22 + m23 * m23);
  out[2] = Math.sqrt(m31 * m31 + m32 * m32 + m33 * m33);
  return out;
}

/**
 * Returns a quaternion representing the rotational component
 *  of a transformation matrix. If a matrix is built with
 *  fromRotationTranslation, the returned quaternion will be the
 *  same as the quaternion originally supplied.
 * @param {quat} out Quaternion to receive the rotation component
 * @param {ReadonlyMat4} mat Matrix to be decomposed (input)
 * @return {quat} out
 */
function getRotation(out, mat) {
  var scaling = new glMatrix.ARRAY_TYPE(3);
  getScaling(scaling, mat);
  var is1 = 1 / scaling[0];
  var is2 = 1 / scaling[1];
  var is3 = 1 / scaling[2];
  var sm11 = mat[0] * is1;
  var sm12 = mat[1] * is2;
  var sm13 = mat[2] * is3;
  var sm21 = mat[4] * is1;
  var sm22 = mat[5] * is2;
  var sm23 = mat[6] * is3;
  var sm31 = mat[8] * is1;
  var sm32 = mat[9] * is2;
  var sm33 = mat[10] * is3;
  var trace = sm11 + sm22 + sm33;
  var S = 0;
  if (trace > 0) {
    S = Math.sqrt(trace + 1.0) * 2;
    out[3] = 0.25 * S;
    out[0] = (sm23 - sm32) / S;
    out[1] = (sm31 - sm13) / S;
    out[2] = (sm12 - sm21) / S;
  } else if (sm11 > sm22 && sm11 > sm33) {
    S = Math.sqrt(1.0 + sm11 - sm22 - sm33) * 2;
    out[3] = (sm23 - sm32) / S;
    out[0] = 0.25 * S;
    out[1] = (sm12 + sm21) / S;
    out[2] = (sm31 + sm13) / S;
  } else if (sm22 > sm33) {
    S = Math.sqrt(1.0 + sm22 - sm11 - sm33) * 2;
    out[3] = (sm31 - sm13) / S;
    out[0] = (sm12 + sm21) / S;
    out[1] = 0.25 * S;
    out[2] = (sm23 + sm32) / S;
  } else {
    S = Math.sqrt(1.0 + sm33 - sm11 - sm22) * 2;
    out[3] = (sm12 - sm21) / S;
    out[0] = (sm31 + sm13) / S;
    out[1] = (sm23 + sm32) / S;
    out[2] = 0.25 * S;
  }
  return out;
}

/**
 * Decomposes a transformation matrix into its rotation, translation
 * and scale components. Returns only the rotation component
 * @param  {quat} out_r Quaternion to receive the rotation component
 * @param  {vec3} out_t Vector to receive the translation vector
 * @param  {vec3} out_s Vector to receive the scaling factor
 * @param  {ReadonlyMat4} mat Matrix to be decomposed (input)
 * @returns {quat} out_r
 */
function decompose(out_r, out_t, out_s, mat) {
  out_t[0] = mat[12];
  out_t[1] = mat[13];
  out_t[2] = mat[14];
  var m11 = mat[0];
  var m12 = mat[1];
  var m13 = mat[2];
  var m21 = mat[4];
  var m22 = mat[5];
  var m23 = mat[6];
  var m31 = mat[8];
  var m32 = mat[9];
  var m33 = mat[10];
  out_s[0] = Math.sqrt(m11 * m11 + m12 * m12 + m13 * m13);
  out_s[1] = Math.sqrt(m21 * m21 + m22 * m22 + m23 * m23);
  out_s[2] = Math.sqrt(m31 * m31 + m32 * m32 + m33 * m33);
  var is1 = 1 / out_s[0];
  var is2 = 1 / out_s[1];
  var is3 = 1 / out_s[2];
  var sm11 = m11 * is1;
  var sm12 = m12 * is2;
  var sm13 = m13 * is3;
  var sm21 = m21 * is1;
  var sm22 = m22 * is2;
  var sm23 = m23 * is3;
  var sm31 = m31 * is1;
  var sm32 = m32 * is2;
  var sm33 = m33 * is3;
  var trace = sm11 + sm22 + sm33;
  var S = 0;
  if (trace > 0) {
    S = Math.sqrt(trace + 1.0) * 2;
    out_r[3] = 0.25 * S;
    out_r[0] = (sm23 - sm32) / S;
    out_r[1] = (sm31 - sm13) / S;
    out_r[2] = (sm12 - sm21) / S;
  } else if (sm11 > sm22 && sm11 > sm33) {
    S = Math.sqrt(1.0 + sm11 - sm22 - sm33) * 2;
    out_r[3] = (sm23 - sm32) / S;
    out_r[0] = 0.25 * S;
    out_r[1] = (sm12 + sm21) / S;
    out_r[2] = (sm31 + sm13) / S;
  } else if (sm22 > sm33) {
    S = Math.sqrt(1.0 + sm22 - sm11 - sm33) * 2;
    out_r[3] = (sm31 - sm13) / S;
    out_r[0] = (sm12 + sm21) / S;
    out_r[1] = 0.25 * S;
    out_r[2] = (sm23 + sm32) / S;
  } else {
    S = Math.sqrt(1.0 + sm33 - sm11 - sm22) * 2;
    out_r[3] = (sm12 - sm21) / S;
    out_r[0] = (sm31 + sm13) / S;
    out_r[1] = (sm23 + sm32) / S;
    out_r[2] = 0.25 * S;
  }
  return out_r;
}

/**
 * Creates a matrix from a quaternion rotation, vector translation and vector scale
 * This is equivalent to (but much faster than):
 *
 *     mat4.identity(dest);
 *     mat4.translate(dest, dest, vec);
 *     let quatMat = mat4.create();
 *     mat4.fromQuat(quatMat, quat);
 *     mat4.multiply(dest, dest, quatMat);
 *     mat4.scale(dest, dest, scale)
 *
 * @param {mat4} out mat4 receiving operation result
 * @param {quat} q Rotation quaternion
 * @param {ReadonlyVec3} v Translation vector
 * @param {ReadonlyVec3} s Scaling vector
 * @returns {mat4} out
 */
function fromRotationTranslationScale(out, q, v, s) {
  // Quaternion math
  var x = q[0],
    y = q[1],
    z = q[2],
    w = q[3];
  var x2 = x + x;
  var y2 = y + y;
  var z2 = z + z;
  var xx = x * x2;
  var xy = x * y2;
  var xz = x * z2;
  var yy = y * y2;
  var yz = y * z2;
  var zz = z * z2;
  var wx = w * x2;
  var wy = w * y2;
  var wz = w * z2;
  var sx = s[0];
  var sy = s[1];
  var sz = s[2];
  out[0] = (1 - (yy + zz)) * sx;
  out[1] = (xy + wz) * sx;
  out[2] = (xz - wy) * sx;
  out[3] = 0;
  out[4] = (xy - wz) * sy;
  out[5] = (1 - (xx + zz)) * sy;
  out[6] = (yz + wx) * sy;
  out[7] = 0;
  out[8] = (xz + wy) * sz;
  out[9] = (yz - wx) * sz;
  out[10] = (1 - (xx + yy)) * sz;
  out[11] = 0;
  out[12] = v[0];
  out[13] = v[1];
  out[14] = v[2];
  out[15] = 1;
  return out;
}

/**
 * Creates a matrix from a quaternion rotation, vector translation and vector scale, rotating and scaling around the given origin
 * This is equivalent to (but much faster than):
 *
 *     mat4.identity(dest);
 *     mat4.translate(dest, dest, vec);
 *     mat4.translate(dest, dest, origin);
 *     let quatMat = mat4.create();
 *     mat4.fromQuat(quatMat, quat);
 *     mat4.multiply(dest, dest, quatMat);
 *     mat4.scale(dest, dest, scale)
 *     mat4.translate(dest, dest, negativeOrigin);
 *
 * @param {mat4} out mat4 receiving operation result
 * @param {quat} q Rotation quaternion
 * @param {ReadonlyVec3} v Translation vector
 * @param {ReadonlyVec3} s Scaling vector
 * @param {ReadonlyVec3} o The origin vector around which to scale and rotate
 * @returns {mat4} out
 */
function fromRotationTranslationScaleOrigin(out, q, v, s, o) {
  // Quaternion math
  var x = q[0],
    y = q[1],
    z = q[2],
    w = q[3];
  var x2 = x + x;
  var y2 = y + y;
  var z2 = z + z;
  var xx = x * x2;
  var xy = x * y2;
  var xz = x * z2;
  var yy = y * y2;
  var yz = y * z2;
  var zz = z * z2;
  var wx = w * x2;
  var wy = w * y2;
  var wz = w * z2;
  var sx = s[0];
  var sy = s[1];
  var sz = s[2];
  var ox = o[0];
  var oy = o[1];
  var oz = o[2];
  var out0 = (1 - (yy + zz)) * sx;
  var out1 = (xy + wz) * sx;
  var out2 = (xz - wy) * sx;
  var out4 = (xy - wz) * sy;
  var out5 = (1 - (xx + zz)) * sy;
  var out6 = (yz + wx) * sy;
  var out8 = (xz + wy) * sz;
  var out9 = (yz - wx) * sz;
  var out10 = (1 - (xx + yy)) * sz;
  out[0] = out0;
  out[1] = out1;
  out[2] = out2;
  out[3] = 0;
  out[4] = out4;
  out[5] = out5;
  out[6] = out6;
  out[7] = 0;
  out[8] = out8;
  out[9] = out9;
  out[10] = out10;
  out[11] = 0;
  out[12] = v[0] + ox - (out0 * ox + out4 * oy + out8 * oz);
  out[13] = v[1] + oy - (out1 * ox + out5 * oy + out9 * oz);
  out[14] = v[2] + oz - (out2 * ox + out6 * oy + out10 * oz);
  out[15] = 1;
  return out;
}

/**
 * Calculates a 4x4 matrix from the given quaternion
 *
 * @param {mat4} out mat4 receiving operation result
 * @param {ReadonlyQuat} q Quaternion to create matrix from
 *
 * @returns {mat4} out
 */
function fromQuat(out, q) {
  var x = q[0],
    y = q[1],
    z = q[2],
    w = q[3];
  var x2 = x + x;
  var y2 = y + y;
  var z2 = z + z;
  var xx = x * x2;
  var yx = y * x2;
  var yy = y * y2;
  var zx = z * x2;
  var zy = z * y2;
  var zz = z * z2;
  var wx = w * x2;
  var wy = w * y2;
  var wz = w * z2;
  out[0] = 1 - yy - zz;
  out[1] = yx + wz;
  out[2] = zx - wy;
  out[3] = 0;
  out[4] = yx - wz;
  out[5] = 1 - xx - zz;
  out[6] = zy + wx;
  out[7] = 0;
  out[8] = zx + wy;
  out[9] = zy - wx;
  out[10] = 1 - xx - yy;
  out[11] = 0;
  out[12] = 0;
  out[13] = 0;
  out[14] = 0;
  out[15] = 1;
  return out;
}

/**
 * Generates a frustum matrix with the given bounds
 *
 * @param {mat4} out mat4 frustum matrix will be written into
 * @param {Number} left Left bound of the frustum
 * @param {Number} right Right bound of the frustum
 * @param {Number} bottom Bottom bound of the frustum
 * @param {Number} top Top bound of the frustum
 * @param {Number} near Near bound of the frustum
 * @param {Number} far Far bound of the frustum
 * @returns {mat4} out
 */
function frustum(out, left, right, bottom, top, near, far) {
  var rl = 1 / (right - left);
  var tb = 1 / (top - bottom);
  var nf = 1 / (near - far);
  out[0] = near * 2 * rl;
  out[1] = 0;
  out[2] = 0;
  out[3] = 0;
  out[4] = 0;
  out[5] = near * 2 * tb;
  out[6] = 0;
  out[7] = 0;
  out[8] = (right + left) * rl;
  out[9] = (top + bottom) * tb;
  out[10] = (far + near) * nf;
  out[11] = -1;
  out[12] = 0;
  out[13] = 0;
  out[14] = far * near * 2 * nf;
  out[15] = 0;
  return out;
}

/**
 * Generates a perspective projection matrix with the given bounds.
 * The near/far clip planes correspond to a normalized device coordinate Z range of [-1, 1],
 * which matches WebGL/OpenGL's clip volume.
 * Passing null/undefined/no value for far will generate infinite projection matrix.
 *
 * @param {mat4} out mat4 frustum matrix will be written into
 * @param {number} fovy Vertical field of view in radians
 * @param {number} aspect Aspect ratio. typically viewport width/height
 * @param {number} near Near bound of the frustum
 * @param {number} far Far bound of the frustum, can be null or Infinity
 * @returns {mat4} out
 */
function perspectiveNO(out, fovy, aspect, near, far) {
  var f = 1.0 / Math.tan(fovy / 2);
  out[0] = f / aspect;
  out[1] = 0;
  out[2] = 0;
  out[3] = 0;
  out[4] = 0;
  out[5] = f;
  out[6] = 0;
  out[7] = 0;
  out[8] = 0;
  out[9] = 0;
  out[11] = -1;
  out[12] = 0;
  out[13] = 0;
  out[15] = 0;
  if (far != null && far !== Infinity) {
    var nf = 1 / (near - far);
    out[10] = (far + near) * nf;
    out[14] = 2 * far * near * nf;
  } else {
    out[10] = -1;
    out[14] = -2 * near;
  }
  return out;
}

/**
 * Alias for {@link mat4.perspectiveNO}
 * @function
 */
var perspective = exports.perspective = perspectiveNO;

/**
 * Generates a perspective projection matrix suitable for WebGPU with the given bounds.
 * The near/far clip planes correspond to a normalized device coordinate Z range of [0, 1],
 * which matches WebGPU/Vulkan/DirectX/Metal's clip volume.
 * Passing null/undefined/no value for far will generate infinite projection matrix.
 *
 * @param {mat4} out mat4 frustum matrix will be written into
 * @param {number} fovy Vertical field of view in radians
 * @param {number} aspect Aspect ratio. typically viewport width/height
 * @param {number} near Near bound of the frustum
 * @param {number} far Far bound of the frustum, can be null or Infinity
 * @returns {mat4} out
 */
function perspectiveZO(out, fovy, aspect, near, far) {
  var f = 1.0 / Math.tan(fovy / 2);
  out[0] = f / aspect;
  out[1] = 0;
  out[2] = 0;
  out[3] = 0;
  out[4] = 0;
  out[5] = f;
  out[6] = 0;
  out[7] = 0;
  out[8] = 0;
  out[9] = 0;
  out[11] = -1;
  out[12] = 0;
  out[13] = 0;
  out[15] = 0;
  if (far != null && far !== Infinity) {
    var nf = 1 / (near - far);
    out[10] = far * nf;
    out[14] = far * near * nf;
  } else {
    out[10] = -1;
    out[14] = -near;
  }
  return out;
}

/**
 * Generates a perspective projection matrix with the given field of view.
 * This is primarily useful for generating projection matrices to be used
 * with the still experiemental WebVR API.
 *
 * @param {mat4} out mat4 frustum matrix will be written into
 * @param {Object} fov Object containing the following values: upDegrees, downDegrees, leftDegrees, rightDegrees
 * @param {number} near Near bound of the frustum
 * @param {number} far Far bound of the frustum
 * @returns {mat4} out
 */
function perspectiveFromFieldOfView(out, fov, near, far) {
  var upTan = Math.tan(fov.upDegrees * Math.PI / 180.0);
  var downTan = Math.tan(fov.downDegrees * Math.PI / 180.0);
  var leftTan = Math.tan(fov.leftDegrees * Math.PI / 180.0);
  var rightTan = Math.tan(fov.rightDegrees * Math.PI / 180.0);
  var xScale = 2.0 / (leftTan + rightTan);
  var yScale = 2.0 / (upTan + downTan);
  out[0] = xScale;
  out[1] = 0.0;
  out[2] = 0.0;
  out[3] = 0.0;
  out[4] = 0.0;
  out[5] = yScale;
  out[6] = 0.0;
  out[7] = 0.0;
  out[8] = -((leftTan - rightTan) * xScale * 0.5);
  out[9] = (upTan - downTan) * yScale * 0.5;
  out[10] = far / (near - far);
  out[11] = -1.0;
  out[12] = 0.0;
  out[13] = 0.0;
  out[14] = far * near / (near - far);
  out[15] = 0.0;
  return out;
}

/**
 * Generates a orthogonal projection matrix with the given bounds.
 * The near/far clip planes correspond to a normalized device coordinate Z range of [-1, 1],
 * which matches WebGL/OpenGL's clip volume.
 *
 * @param {mat4} out mat4 frustum matrix will be written into
 * @param {number} left Left bound of the frustum
 * @param {number} right Right bound of the frustum
 * @param {number} bottom Bottom bound of the frustum
 * @param {number} top Top bound of the frustum
 * @param {number} near Near bound of the frustum
 * @param {number} far Far bound of the frustum
 * @returns {mat4} out
 */
function orthoNO(out, left, right, bottom, top, near, far) {
  var lr = 1 / (left - right);
  var bt = 1 / (bottom - top);
  var nf = 1 / (near - far);
  out[0] = -2 * lr;
  out[1] = 0;
  out[2] = 0;
  out[3] = 0;
  out[4] = 0;
  out[5] = -2 * bt;
  out[6] = 0;
  out[7] = 0;
  out[8] = 0;
  out[9] = 0;
  out[10] = 2 * nf;
  out[11] = 0;
  out[12] = (left + right) * lr;
  out[13] = (top + bottom) * bt;
  out[14] = (far + near) * nf;
  out[15] = 1;
  return out;
}

/**
 * Alias for {@link mat4.orthoNO}
 * @function
 */
var ortho = exports.ortho = orthoNO;

/**
 * Generates a orthogonal projection matrix with the given bounds.
 * The near/far clip planes correspond to a normalized device coordinate Z range of [0, 1],
 * which matches WebGPU/Vulkan/DirectX/Metal's clip volume.
 *
 * @param {mat4} out mat4 frustum matrix will be written into
 * @param {number} left Left bound of the frustum
 * @param {number} right Right bound of the frustum
 * @param {number} bottom Bottom bound of the frustum
 * @param {number} top Top bound of the frustum
 * @param {number} near Near bound of the frustum
 * @param {number} far Far bound of the frustum
 * @returns {mat4} out
 */
function orthoZO(out, left, right, bottom, top, near, far) {
  var lr = 1 / (left - right);
  var bt = 1 / (bottom - top);
  var nf = 1 / (near - far);
  out[0] = -2 * lr;
  out[1] = 0;
  out[2] = 0;
  out[3] = 0;
  out[4] = 0;
  out[5] = -2 * bt;
  out[6] = 0;
  out[7] = 0;
  out[8] = 0;
  out[9] = 0;
  out[10] = nf;
  out[11] = 0;
  out[12] = (left + right) * lr;
  out[13] = (top + bottom) * bt;
  out[14] = near * nf;
  out[15] = 1;
  return out;
}

/**
 * Generates a look-at matrix with the given eye position, focal point, and up axis.
 * If you want a matrix that actually makes an object look at another object, you should use targetTo instead.
 *
 * @param {mat4} out mat4 frustum matrix will be written into
 * @param {ReadonlyVec3} eye Position of the viewer
 * @param {ReadonlyVec3} center Point the viewer is looking at
 * @param {ReadonlyVec3} up vec3 pointing up
 * @returns {mat4} out
 */
function lookAt(out, eye, center, up) {
  var x0, x1, x2, y0, y1, y2, z0, z1, z2, len;
  var eyex = eye[0];
  var eyey = eye[1];
  var eyez = eye[2];
  var upx = up[0];
  var upy = up[1];
  var upz = up[2];
  var centerx = center[0];
  var centery = center[1];
  var centerz = center[2];
  if (Math.abs(eyex - centerx) < glMatrix.EPSILON && Math.abs(eyey - centery) < glMatrix.EPSILON && Math.abs(eyez - centerz) < glMatrix.EPSILON) {
    return identity(out);
  }
  z0 = eyex - centerx;
  z1 = eyey - centery;
  z2 = eyez - centerz;
  len = 1 / Math.sqrt(z0 * z0 + z1 * z1 + z2 * z2);
  z0 *= len;
  z1 *= len;
  z2 *= len;
  x0 = upy * z2 - upz * z1;
  x1 = upz * z0 - upx * z2;
  x2 = upx * z1 - upy * z0;
  len = Math.sqrt(x0 * x0 + x1 * x1 + x2 * x2);
  if (!len) {
    x0 = 0;
    x1 = 0;
    x2 = 0;
  } else {
    len = 1 / len;
    x0 *= len;
    x1 *= len;
    x2 *= len;
  }
  y0 = z1 * x2 - z2 * x1;
  y1 = z2 * x0 - z0 * x2;
  y2 = z0 * x1 - z1 * x0;
  len = Math.sqrt(y0 * y0 + y1 * y1 + y2 * y2);
  if (!len) {
    y0 = 0;
    y1 = 0;
    y2 = 0;
  } else {
    len = 1 / len;
    y0 *= len;
    y1 *= len;
    y2 *= len;
  }
  out[0] = x0;
  out[1] = y0;
  out[2] = z0;
  out[3] = 0;
  out[4] = x1;
  out[5] = y1;
  out[6] = z1;
  out[7] = 0;
  out[8] = x2;
  out[9] = y2;
  out[10] = z2;
  out[11] = 0;
  out[12] = -(x0 * eyex + x1 * eyey + x2 * eyez);
  out[13] = -(y0 * eyex + y1 * eyey + y2 * eyez);
  out[14] = -(z0 * eyex + z1 * eyey + z2 * eyez);
  out[15] = 1;
  return out;
}

/**
 * Generates a matrix that makes something look at something else.
 *
 * @param {mat4} out mat4 frustum matrix will be written into
 * @param {ReadonlyVec3} eye Position of the viewer
 * @param {ReadonlyVec3} target Point the viewer is looking at
 * @param {ReadonlyVec3} up vec3 pointing up
 * @returns {mat4} out
 */
function targetTo(out, eye, target, up) {
  var eyex = eye[0],
    eyey = eye[1],
    eyez = eye[2],
    upx = up[0],
    upy = up[1],
    upz = up[2];
  var z0 = eyex - target[0],
    z1 = eyey - target[1],
    z2 = eyez - target[2];
  var len = z0 * z0 + z1 * z1 + z2 * z2;
  if (len > 0) {
    len = 1 / Math.sqrt(len);
    z0 *= len;
    z1 *= len;
    z2 *= len;
  }
  var x0 = upy * z2 - upz * z1,
    x1 = upz * z0 - upx * z2,
    x2 = upx * z1 - upy * z0;
  len = x0 * x0 + x1 * x1 + x2 * x2;
  if (len > 0) {
    len = 1 / Math.sqrt(len);
    x0 *= len;
    x1 *= len;
    x2 *= len;
  }
  out[0] = x0;
  out[1] = x1;
  out[2] = x2;
  out[3] = 0;
  out[4] = z1 * x2 - z2 * x1;
  out[5] = z2 * x0 - z0 * x2;
  out[6] = z0 * x1 - z1 * x0;
  out[7] = 0;
  out[8] = z0;
  out[9] = z1;
  out[10] = z2;
  out[11] = 0;
  out[12] = eyex;
  out[13] = eyey;
  out[14] = eyez;
  out[15] = 1;
  return out;
}

/**
 * Returns a string representation of a mat4
 *
 * @param {ReadonlyMat4} a matrix to represent as a string
 * @returns {String} string representation of the matrix
 */
function str(a) {
  return "mat4(" + a[0] + ", " + a[1] + ", " + a[2] + ", " + a[3] + ", " + a[4] + ", " + a[5] + ", " + a[6] + ", " + a[7] + ", " + a[8] + ", " + a[9] + ", " + a[10] + ", " + a[11] + ", " + a[12] + ", " + a[13] + ", " + a[14] + ", " + a[15] + ")";
}

/**
 * Returns Frobenius norm of a mat4
 *
 * @param {ReadonlyMat4} a the matrix to calculate Frobenius norm of
 * @returns {Number} Frobenius norm
 */
function frob(a) {
  return Math.sqrt(a[0] * a[0] + a[1] * a[1] + a[2] * a[2] + a[3] * a[3] + a[4] * a[4] + a[5] * a[5] + a[6] * a[6] + a[7] * a[7] + a[8] * a[8] + a[9] * a[9] + a[10] * a[10] + a[11] * a[11] + a[12] * a[12] + a[13] * a[13] + a[14] * a[14] + a[15] * a[15]);
}

/**
 * Adds two mat4's
 *
 * @param {mat4} out the receiving matrix
 * @param {ReadonlyMat4} a the first operand
 * @param {ReadonlyMat4} b the second operand
 * @returns {mat4} out
 */
function add(out, a, b) {
  out[0] = a[0] + b[0];
  out[1] = a[1] + b[1];
  out[2] = a[2] + b[2];
  out[3] = a[3] + b[3];
  out[4] = a[4] + b[4];
  out[5] = a[5] + b[5];
  out[6] = a[6] + b[6];
  out[7] = a[7] + b[7];
  out[8] = a[8] + b[8];
  out[9] = a[9] + b[9];
  out[10] = a[10] + b[10];
  out[11] = a[11] + b[11];
  out[12] = a[12] + b[12];
  out[13] = a[13] + b[13];
  out[14] = a[14] + b[14];
  out[15] = a[15] + b[15];
  return out;
}

/**
 * Subtracts matrix b from matrix a
 *
 * @param {mat4} out the receiving matrix
 * @param {ReadonlyMat4} a the first operand
 * @param {ReadonlyMat4} b the second operand
 * @returns {mat4} out
 */
function subtract(out, a, b) {
  out[0] = a[0] - b[0];
  out[1] = a[1] - b[1];
  out[2] = a[2] - b[2];
  out[3] = a[3] - b[3];
  out[4] = a[4] - b[4];
  out[5] = a[5] - b[5];
  out[6] = a[6] - b[6];
  out[7] = a[7] - b[7];
  out[8] = a[8] - b[8];
  out[9] = a[9] - b[9];
  out[10] = a[10] - b[10];
  out[11] = a[11] - b[11];
  out[12] = a[12] - b[12];
  out[13] = a[13] - b[13];
  out[14] = a[14] - b[14];
  out[15] = a[15] - b[15];
  return out;
}

/**
 * Multiply each element of the matrix by a scalar.
 *
 * @param {mat4} out the receiving matrix
 * @param {ReadonlyMat4} a the matrix to scale
 * @param {Number} b amount to scale the matrix's elements by
 * @returns {mat4} out
 */
function multiplyScalar(out, a, b) {
  out[0] = a[0] * b;
  out[1] = a[1] * b;
  out[2] = a[2] * b;
  out[3] = a[3] * b;
  out[4] = a[4] * b;
  out[5] = a[5] * b;
  out[6] = a[6] * b;
  out[7] = a[7] * b;
  out[8] = a[8] * b;
  out[9] = a[9] * b;
  out[10] = a[10] * b;
  out[11] = a[11] * b;
  out[12] = a[12] * b;
  out[13] = a[13] * b;
  out[14] = a[14] * b;
  out[15] = a[15] * b;
  return out;
}

/**
 * Adds two mat4's after multiplying each element of the second operand by a scalar value.
 *
 * @param {mat4} out the receiving vector
 * @param {ReadonlyMat4} a the first operand
 * @param {ReadonlyMat4} b the second operand
 * @param {Number} scale the amount to scale b's elements by before adding
 * @returns {mat4} out
 */
function multiplyScalarAndAdd(out, a, b, scale) {
  out[0] = a[0] + b[0] * scale;
  out[1] = a[1] + b[1] * scale;
  out[2] = a[2] + b[2] * scale;
  out[3] = a[3] + b[3] * scale;
  out[4] = a[4] + b[4] * scale;
  out[5] = a[5] + b[5] * scale;
  out[6] = a[6] + b[6] * scale;
  out[7] = a[7] + b[7] * scale;
  out[8] = a[8] + b[8] * scale;
  out[9] = a[9] + b[9] * scale;
  out[10] = a[10] + b[10] * scale;
  out[11] = a[11] + b[11] * scale;
  out[12] = a[12] + b[12] * scale;
  out[13] = a[13] + b[13] * scale;
  out[14] = a[14] + b[14] * scale;
  out[15] = a[15] + b[15] * scale;
  return out;
}

/**
 * Returns whether or not the matrices have exactly the same elements in the same position (when compared with ===)
 *
 * @param {ReadonlyMat4} a The first matrix.
 * @param {ReadonlyMat4} b The second matrix.
 * @returns {Boolean} True if the matrices are equal, false otherwise.
 */
function exactEquals(a, b) {
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3] && a[4] === b[4] && a[5] === b[5] && a[6] === b[6] && a[7] === b[7] && a[8] === b[8] && a[9] === b[9] && a[10] === b[10] && a[11] === b[11] && a[12] === b[12] && a[13] === b[13] && a[14] === b[14] && a[15] === b[15];
}

/**
 * Returns whether or not the matrices have approximately the same elements in the same position.
 *
 * @param {ReadonlyMat4} a The first matrix.
 * @param {ReadonlyMat4} b The second matrix.
 * @returns {Boolean} True if the matrices are equal, false otherwise.
 */
function equals(a, b) {
  var a0 = a[0],
    a1 = a[1],
    a2 = a[2],
    a3 = a[3];
  var a4 = a[4],
    a5 = a[5],
    a6 = a[6],
    a7 = a[7];
  var a8 = a[8],
    a9 = a[9],
    a10 = a[10],
    a11 = a[11];
  var a12 = a[12],
    a13 = a[13],
    a14 = a[14],
    a15 = a[15];
  var b0 = b[0],
    b1 = b[1],
    b2 = b[2],
    b3 = b[3];
  var b4 = b[4],
    b5 = b[5],
    b6 = b[6],
    b7 = b[7];
  var b8 = b[8],
    b9 = b[9],
    b10 = b[10],
    b11 = b[11];
  var b12 = b[12],
    b13 = b[13],
    b14 = b[14],
    b15 = b[15];
  return Math.abs(a0 - b0) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a0), Math.abs(b0)) && Math.abs(a1 - b1) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a1), Math.abs(b1)) && Math.abs(a2 - b2) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a2), Math.abs(b2)) && Math.abs(a3 - b3) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a3), Math.abs(b3)) && Math.abs(a4 - b4) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a4), Math.abs(b4)) && Math.abs(a5 - b5) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a5), Math.abs(b5)) && Math.abs(a6 - b6) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a6), Math.abs(b6)) && Math.abs(a7 - b7) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a7), Math.abs(b7)) && Math.abs(a8 - b8) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a8), Math.abs(b8)) && Math.abs(a9 - b9) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a9), Math.abs(b9)) && Math.abs(a10 - b10) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a10), Math.abs(b10)) && Math.abs(a11 - b11) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a11), Math.abs(b11)) && Math.abs(a12 - b12) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a12), Math.abs(b12)) && Math.abs(a13 - b13) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a13), Math.abs(b13)) && Math.abs(a14 - b14) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a14), Math.abs(b14)) && Math.abs(a15 - b15) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a15), Math.abs(b15));
}

/**
 * Alias for {@link mat4.multiply}
 * @function
 */
var mul = exports.mul = multiply;

/**
 * Alias for {@link mat4.subtract}
 * @function
 */
var sub = exports.sub = subtract;

},{"./common.js":4}],10:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.add = void 0;
exports.calculateW = calculateW;
exports.clone = void 0;
exports.conjugate = conjugate;
exports.copy = void 0;
exports.create = create;
exports.dot = void 0;
exports.equals = equals;
exports.exactEquals = void 0;
exports.exp = exp;
exports.fromEuler = fromEuler;
exports.fromMat3 = fromMat3;
exports.fromValues = void 0;
exports.getAngle = getAngle;
exports.getAxisAngle = getAxisAngle;
exports.identity = identity;
exports.invert = invert;
exports.lerp = exports.length = exports.len = void 0;
exports.ln = ln;
exports.mul = void 0;
exports.multiply = multiply;
exports.normalize = void 0;
exports.pow = pow;
exports.random = random;
exports.rotateX = rotateX;
exports.rotateY = rotateY;
exports.rotateZ = rotateZ;
exports.setAxes = exports.set = exports.scale = exports.rotationTo = void 0;
exports.setAxisAngle = setAxisAngle;
exports.slerp = slerp;
exports.squaredLength = exports.sqrLen = exports.sqlerp = void 0;
exports.str = str;
var glMatrix = _interopRequireWildcard(require("./common.js"));
var mat3 = _interopRequireWildcard(require("./mat3.js"));
var vec3 = _interopRequireWildcard(require("./vec3.js"));
var vec4 = _interopRequireWildcard(require("./vec4.js"));
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
/**
 * Quaternion in the format XYZW
 * @module quat
 */

/**
 * Creates a new identity quat
 *
 * @returns {quat} a new quaternion
 */
function create() {
  var out = new glMatrix.ARRAY_TYPE(4);
  if (glMatrix.ARRAY_TYPE != Float32Array) {
    out[0] = 0;
    out[1] = 0;
    out[2] = 0;
  }
  out[3] = 1;
  return out;
}

/**
 * Set a quat to the identity quaternion
 *
 * @param {quat} out the receiving quaternion
 * @returns {quat} out
 */
function identity(out) {
  out[0] = 0;
  out[1] = 0;
  out[2] = 0;
  out[3] = 1;
  return out;
}

/**
 * Sets a quat from the given angle and rotation axis,
 * then returns it.
 *
 * @param {quat} out the receiving quaternion
 * @param {ReadonlyVec3} axis the axis around which to rotate
 * @param {Number} rad the angle in radians
 * @returns {quat} out
 **/
function setAxisAngle(out, axis, rad) {
  rad = rad * 0.5;
  var s = Math.sin(rad);
  out[0] = s * axis[0];
  out[1] = s * axis[1];
  out[2] = s * axis[2];
  out[3] = Math.cos(rad);
  return out;
}

/**
 * Gets the rotation axis and angle for a given
 *  quaternion. If a quaternion is created with
 *  setAxisAngle, this method will return the same
 *  values as providied in the original parameter list
 *  OR functionally equivalent values.
 * Example: The quaternion formed by axis [0, 0, 1] and
 *  angle -90 is the same as the quaternion formed by
 *  [0, 0, 1] and 270. This method favors the latter.
 * @param  {vec3} out_axis  Vector receiving the axis of rotation
 * @param  {ReadonlyQuat} q     Quaternion to be decomposed
 * @return {Number}     Angle, in radians, of the rotation
 */
function getAxisAngle(out_axis, q) {
  var rad = Math.acos(q[3]) * 2.0;
  var s = Math.sin(rad / 2.0);
  if (s > glMatrix.EPSILON) {
    out_axis[0] = q[0] / s;
    out_axis[1] = q[1] / s;
    out_axis[2] = q[2] / s;
  } else {
    // If s is zero, return any axis (no rotation - axis does not matter)
    out_axis[0] = 1;
    out_axis[1] = 0;
    out_axis[2] = 0;
  }
  return rad;
}

/**
 * Gets the angular distance between two unit quaternions
 *
 * @param  {ReadonlyQuat} a     Origin unit quaternion
 * @param  {ReadonlyQuat} b     Destination unit quaternion
 * @return {Number}     Angle, in radians, between the two quaternions
 */
function getAngle(a, b) {
  var dotproduct = dot(a, b);
  return Math.acos(2 * dotproduct * dotproduct - 1);
}

/**
 * Multiplies two quat's
 *
 * @param {quat} out the receiving quaternion
 * @param {ReadonlyQuat} a the first operand
 * @param {ReadonlyQuat} b the second operand
 * @returns {quat} out
 */
function multiply(out, a, b) {
  var ax = a[0],
    ay = a[1],
    az = a[2],
    aw = a[3];
  var bx = b[0],
    by = b[1],
    bz = b[2],
    bw = b[3];
  out[0] = ax * bw + aw * bx + ay * bz - az * by;
  out[1] = ay * bw + aw * by + az * bx - ax * bz;
  out[2] = az * bw + aw * bz + ax * by - ay * bx;
  out[3] = aw * bw - ax * bx - ay * by - az * bz;
  return out;
}

/**
 * Rotates a quaternion by the given angle about the X axis
 *
 * @param {quat} out quat receiving operation result
 * @param {ReadonlyQuat} a quat to rotate
 * @param {number} rad angle (in radians) to rotate
 * @returns {quat} out
 */
function rotateX(out, a, rad) {
  rad *= 0.5;
  var ax = a[0],
    ay = a[1],
    az = a[2],
    aw = a[3];
  var bx = Math.sin(rad),
    bw = Math.cos(rad);
  out[0] = ax * bw + aw * bx;
  out[1] = ay * bw + az * bx;
  out[2] = az * bw - ay * bx;
  out[3] = aw * bw - ax * bx;
  return out;
}

/**
 * Rotates a quaternion by the given angle about the Y axis
 *
 * @param {quat} out quat receiving operation result
 * @param {ReadonlyQuat} a quat to rotate
 * @param {number} rad angle (in radians) to rotate
 * @returns {quat} out
 */
function rotateY(out, a, rad) {
  rad *= 0.5;
  var ax = a[0],
    ay = a[1],
    az = a[2],
    aw = a[3];
  var by = Math.sin(rad),
    bw = Math.cos(rad);
  out[0] = ax * bw - az * by;
  out[1] = ay * bw + aw * by;
  out[2] = az * bw + ax * by;
  out[3] = aw * bw - ay * by;
  return out;
}

/**
 * Rotates a quaternion by the given angle about the Z axis
 *
 * @param {quat} out quat receiving operation result
 * @param {ReadonlyQuat} a quat to rotate
 * @param {number} rad angle (in radians) to rotate
 * @returns {quat} out
 */
function rotateZ(out, a, rad) {
  rad *= 0.5;
  var ax = a[0],
    ay = a[1],
    az = a[2],
    aw = a[3];
  var bz = Math.sin(rad),
    bw = Math.cos(rad);
  out[0] = ax * bw + ay * bz;
  out[1] = ay * bw - ax * bz;
  out[2] = az * bw + aw * bz;
  out[3] = aw * bw - az * bz;
  return out;
}

/**
 * Calculates the W component of a quat from the X, Y, and Z components.
 * Assumes that quaternion is 1 unit in length.
 * Any existing W component will be ignored.
 *
 * @param {quat} out the receiving quaternion
 * @param {ReadonlyQuat} a quat to calculate W component of
 * @returns {quat} out
 */
function calculateW(out, a) {
  var x = a[0],
    y = a[1],
    z = a[2];
  out[0] = x;
  out[1] = y;
  out[2] = z;
  out[3] = Math.sqrt(Math.abs(1.0 - x * x - y * y - z * z));
  return out;
}

/**
 * Calculate the exponential of a unit quaternion.
 *
 * @param {quat} out the receiving quaternion
 * @param {ReadonlyQuat} a quat to calculate the exponential of
 * @returns {quat} out
 */
function exp(out, a) {
  var x = a[0],
    y = a[1],
    z = a[2],
    w = a[3];
  var r = Math.sqrt(x * x + y * y + z * z);
  var et = Math.exp(w);
  var s = r > 0 ? et * Math.sin(r) / r : 0;
  out[0] = x * s;
  out[1] = y * s;
  out[2] = z * s;
  out[3] = et * Math.cos(r);
  return out;
}

/**
 * Calculate the natural logarithm of a unit quaternion.
 *
 * @param {quat} out the receiving quaternion
 * @param {ReadonlyQuat} a quat to calculate the exponential of
 * @returns {quat} out
 */
function ln(out, a) {
  var x = a[0],
    y = a[1],
    z = a[2],
    w = a[3];
  var r = Math.sqrt(x * x + y * y + z * z);
  var t = r > 0 ? Math.atan2(r, w) / r : 0;
  out[0] = x * t;
  out[1] = y * t;
  out[2] = z * t;
  out[3] = 0.5 * Math.log(x * x + y * y + z * z + w * w);
  return out;
}

/**
 * Calculate the scalar power of a unit quaternion.
 *
 * @param {quat} out the receiving quaternion
 * @param {ReadonlyQuat} a quat to calculate the exponential of
 * @param {Number} b amount to scale the quaternion by
 * @returns {quat} out
 */
function pow(out, a, b) {
  ln(out, a);
  scale(out, out, b);
  exp(out, out);
  return out;
}

/**
 * Performs a spherical linear interpolation between two quat
 *
 * @param {quat} out the receiving quaternion
 * @param {ReadonlyQuat} a the first operand
 * @param {ReadonlyQuat} b the second operand
 * @param {Number} t interpolation amount, in the range [0-1], between the two inputs
 * @returns {quat} out
 */
function slerp(out, a, b, t) {
  // benchmarks:
  //    http://jsperf.com/quaternion-slerp-implementations
  var ax = a[0],
    ay = a[1],
    az = a[2],
    aw = a[3];
  var bx = b[0],
    by = b[1],
    bz = b[2],
    bw = b[3];
  var omega, cosom, sinom, scale0, scale1;

  // calc cosine
  cosom = ax * bx + ay * by + az * bz + aw * bw;
  // adjust signs (if necessary)
  if (cosom < 0.0) {
    cosom = -cosom;
    bx = -bx;
    by = -by;
    bz = -bz;
    bw = -bw;
  }
  // calculate coefficients
  if (1.0 - cosom > glMatrix.EPSILON) {
    // standard case (slerp)
    omega = Math.acos(cosom);
    sinom = Math.sin(omega);
    scale0 = Math.sin((1.0 - t) * omega) / sinom;
    scale1 = Math.sin(t * omega) / sinom;
  } else {
    // "from" and "to" quaternions are very close
    //  ... so we can do a linear interpolation
    scale0 = 1.0 - t;
    scale1 = t;
  }
  // calculate final values
  out[0] = scale0 * ax + scale1 * bx;
  out[1] = scale0 * ay + scale1 * by;
  out[2] = scale0 * az + scale1 * bz;
  out[3] = scale0 * aw + scale1 * bw;
  return out;
}

/**
 * Generates a random unit quaternion
 *
 * @param {quat} out the receiving quaternion
 * @returns {quat} out
 */
function random(out) {
  // Implementation of http://planning.cs.uiuc.edu/node198.html
  // TODO: Calling random 3 times is probably not the fastest solution
  var u1 = glMatrix.RANDOM();
  var u2 = glMatrix.RANDOM();
  var u3 = glMatrix.RANDOM();
  var sqrt1MinusU1 = Math.sqrt(1 - u1);
  var sqrtU1 = Math.sqrt(u1);
  out[0] = sqrt1MinusU1 * Math.sin(2.0 * Math.PI * u2);
  out[1] = sqrt1MinusU1 * Math.cos(2.0 * Math.PI * u2);
  out[2] = sqrtU1 * Math.sin(2.0 * Math.PI * u3);
  out[3] = sqrtU1 * Math.cos(2.0 * Math.PI * u3);
  return out;
}

/**
 * Calculates the inverse of a quat
 *
 * @param {quat} out the receiving quaternion
 * @param {ReadonlyQuat} a quat to calculate inverse of
 * @returns {quat} out
 */
function invert(out, a) {
  var a0 = a[0],
    a1 = a[1],
    a2 = a[2],
    a3 = a[3];
  var dot = a0 * a0 + a1 * a1 + a2 * a2 + a3 * a3;
  var invDot = dot ? 1.0 / dot : 0;

  // TODO: Would be faster to return [0,0,0,0] immediately if dot == 0

  out[0] = -a0 * invDot;
  out[1] = -a1 * invDot;
  out[2] = -a2 * invDot;
  out[3] = a3 * invDot;
  return out;
}

/**
 * Calculates the conjugate of a quat
 * If the quaternion is normalized, this function is faster than quat.inverse and produces the same result.
 *
 * @param {quat} out the receiving quaternion
 * @param {ReadonlyQuat} a quat to calculate conjugate of
 * @returns {quat} out
 */
function conjugate(out, a) {
  out[0] = -a[0];
  out[1] = -a[1];
  out[2] = -a[2];
  out[3] = a[3];
  return out;
}

/**
 * Creates a quaternion from the given 3x3 rotation matrix.
 *
 * NOTE: The resultant quaternion is not normalized, so you should be sure
 * to renormalize the quaternion yourself where necessary.
 *
 * @param {quat} out the receiving quaternion
 * @param {ReadonlyMat3} m rotation matrix
 * @returns {quat} out
 * @function
 */
function fromMat3(out, m) {
  // Algorithm in Ken Shoemake's article in 1987 SIGGRAPH course notes
  // article "Quaternion Calculus and Fast Animation".
  var fTrace = m[0] + m[4] + m[8];
  var fRoot;
  if (fTrace > 0.0) {
    // |w| > 1/2, may as well choose w > 1/2
    fRoot = Math.sqrt(fTrace + 1.0); // 2w
    out[3] = 0.5 * fRoot;
    fRoot = 0.5 / fRoot; // 1/(4w)
    out[0] = (m[5] - m[7]) * fRoot;
    out[1] = (m[6] - m[2]) * fRoot;
    out[2] = (m[1] - m[3]) * fRoot;
  } else {
    // |w| <= 1/2
    var i = 0;
    if (m[4] > m[0]) i = 1;
    if (m[8] > m[i * 3 + i]) i = 2;
    var j = (i + 1) % 3;
    var k = (i + 2) % 3;
    fRoot = Math.sqrt(m[i * 3 + i] - m[j * 3 + j] - m[k * 3 + k] + 1.0);
    out[i] = 0.5 * fRoot;
    fRoot = 0.5 / fRoot;
    out[3] = (m[j * 3 + k] - m[k * 3 + j]) * fRoot;
    out[j] = (m[j * 3 + i] + m[i * 3 + j]) * fRoot;
    out[k] = (m[k * 3 + i] + m[i * 3 + k]) * fRoot;
  }
  return out;
}

/**
 * Creates a quaternion from the given euler angle x, y, z using the provided intrinsic order for the conversion.
 *
 * @param {quat} out the receiving quaternion
 * @param {Number} x Angle to rotate around X axis in degrees.
 * @param {Number} y Angle to rotate around Y axis in degrees.
 * @param {Number} z Angle to rotate around Z axis in degrees.
 * @param {'xyz'|'xzy'|'yxz'|'yzx'|'zxy'|'zyx'} order Intrinsic order for conversion, default is zyx.
 * @returns {quat} out
 * @function
 */
function fromEuler(out, x, y, z) {
  var order = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : glMatrix.ANGLE_ORDER;
  var halfToRad = Math.PI / 360;
  x *= halfToRad;
  z *= halfToRad;
  y *= halfToRad;
  var sx = Math.sin(x);
  var cx = Math.cos(x);
  var sy = Math.sin(y);
  var cy = Math.cos(y);
  var sz = Math.sin(z);
  var cz = Math.cos(z);
  switch (order) {
    case "xyz":
      out[0] = sx * cy * cz + cx * sy * sz;
      out[1] = cx * sy * cz - sx * cy * sz;
      out[2] = cx * cy * sz + sx * sy * cz;
      out[3] = cx * cy * cz - sx * sy * sz;
      break;
    case "xzy":
      out[0] = sx * cy * cz - cx * sy * sz;
      out[1] = cx * sy * cz - sx * cy * sz;
      out[2] = cx * cy * sz + sx * sy * cz;
      out[3] = cx * cy * cz + sx * sy * sz;
      break;
    case "yxz":
      out[0] = sx * cy * cz + cx * sy * sz;
      out[1] = cx * sy * cz - sx * cy * sz;
      out[2] = cx * cy * sz - sx * sy * cz;
      out[3] = cx * cy * cz + sx * sy * sz;
      break;
    case "yzx":
      out[0] = sx * cy * cz + cx * sy * sz;
      out[1] = cx * sy * cz + sx * cy * sz;
      out[2] = cx * cy * sz - sx * sy * cz;
      out[3] = cx * cy * cz - sx * sy * sz;
      break;
    case "zxy":
      out[0] = sx * cy * cz - cx * sy * sz;
      out[1] = cx * sy * cz + sx * cy * sz;
      out[2] = cx * cy * sz + sx * sy * cz;
      out[3] = cx * cy * cz - sx * sy * sz;
      break;
    case "zyx":
      out[0] = sx * cy * cz - cx * sy * sz;
      out[1] = cx * sy * cz + sx * cy * sz;
      out[2] = cx * cy * sz - sx * sy * cz;
      out[3] = cx * cy * cz + sx * sy * sz;
      break;
    default:
      throw new Error('Unknown angle order ' + order);
  }
  return out;
}

/**
 * Returns a string representation of a quaternion
 *
 * @param {ReadonlyQuat} a vector to represent as a string
 * @returns {String} string representation of the vector
 */
function str(a) {
  return "quat(" + a[0] + ", " + a[1] + ", " + a[2] + ", " + a[3] + ")";
}

/**
 * Creates a new quat initialized with values from an existing quaternion
 *
 * @param {ReadonlyQuat} a quaternion to clone
 * @returns {quat} a new quaternion
 * @function
 */
var clone = exports.clone = vec4.clone;

/**
 * Creates a new quat initialized with the given values
 *
 * @param {Number} x X component
 * @param {Number} y Y component
 * @param {Number} z Z component
 * @param {Number} w W component
 * @returns {quat} a new quaternion
 * @function
 */
var fromValues = exports.fromValues = vec4.fromValues;

/**
 * Copy the values from one quat to another
 *
 * @param {quat} out the receiving quaternion
 * @param {ReadonlyQuat} a the source quaternion
 * @returns {quat} out
 * @function
 */
var copy = exports.copy = vec4.copy;

/**
 * Set the components of a quat to the given values
 *
 * @param {quat} out the receiving quaternion
 * @param {Number} x X component
 * @param {Number} y Y component
 * @param {Number} z Z component
 * @param {Number} w W component
 * @returns {quat} out
 * @function
 */
var set = exports.set = vec4.set;

/**
 * Adds two quat's
 *
 * @param {quat} out the receiving quaternion
 * @param {ReadonlyQuat} a the first operand
 * @param {ReadonlyQuat} b the second operand
 * @returns {quat} out
 * @function
 */
var add = exports.add = vec4.add;

/**
 * Alias for {@link quat.multiply}
 * @function
 */
var mul = exports.mul = multiply;

/**
 * Scales a quat by a scalar number
 *
 * @param {quat} out the receiving vector
 * @param {ReadonlyQuat} a the vector to scale
 * @param {Number} b amount to scale the vector by
 * @returns {quat} out
 * @function
 */
var scale = exports.scale = vec4.scale;

/**
 * Calculates the dot product of two quat's
 *
 * @param {ReadonlyQuat} a the first operand
 * @param {ReadonlyQuat} b the second operand
 * @returns {Number} dot product of a and b
 * @function
 */
var dot = exports.dot = vec4.dot;

/**
 * Performs a linear interpolation between two quat's
 *
 * @param {quat} out the receiving quaternion
 * @param {ReadonlyQuat} a the first operand
 * @param {ReadonlyQuat} b the second operand
 * @param {Number} t interpolation amount, in the range [0-1], between the two inputs
 * @returns {quat} out
 * @function
 */
var lerp = exports.lerp = vec4.lerp;

/**
 * Calculates the length of a quat
 *
 * @param {ReadonlyQuat} a vector to calculate length of
 * @returns {Number} length of a
 */
var length = exports.length = vec4.length;

/**
 * Alias for {@link quat.length}
 * @function
 */
var len = exports.len = length;

/**
 * Calculates the squared length of a quat
 *
 * @param {ReadonlyQuat} a vector to calculate squared length of
 * @returns {Number} squared length of a
 * @function
 */
var squaredLength = exports.squaredLength = vec4.squaredLength;

/**
 * Alias for {@link quat.squaredLength}
 * @function
 */
var sqrLen = exports.sqrLen = squaredLength;

/**
 * Normalize a quat
 *
 * @param {quat} out the receiving quaternion
 * @param {ReadonlyQuat} a quaternion to normalize
 * @returns {quat} out
 * @function
 */
var normalize = exports.normalize = vec4.normalize;

/**
 * Returns whether or not the quaternions have exactly the same elements in the same position (when compared with ===)
 *
 * @param {ReadonlyQuat} a The first quaternion.
 * @param {ReadonlyQuat} b The second quaternion.
 * @returns {Boolean} True if the vectors are equal, false otherwise.
 */
var exactEquals = exports.exactEquals = vec4.exactEquals;

/**
 * Returns whether or not the quaternions point approximately to the same direction.
 *
 * Both quaternions are assumed to be unit length.
 *
 * @param {ReadonlyQuat} a The first unit quaternion.
 * @param {ReadonlyQuat} b The second unit quaternion.
 * @returns {Boolean} True if the quaternions are equal, false otherwise.
 */
function equals(a, b) {
  return Math.abs(vec4.dot(a, b)) >= 1 - glMatrix.EPSILON;
}

/**
 * Sets a quaternion to represent the shortest rotation from one
 * vector to another.
 *
 * Both vectors are assumed to be unit length.
 *
 * @param {quat} out the receiving quaternion.
 * @param {ReadonlyVec3} a the initial vector
 * @param {ReadonlyVec3} b the destination vector
 * @returns {quat} out
 */
var rotationTo = exports.rotationTo = function () {
  var tmpvec3 = vec3.create();
  var xUnitVec3 = vec3.fromValues(1, 0, 0);
  var yUnitVec3 = vec3.fromValues(0, 1, 0);
  return function (out, a, b) {
    var dot = vec3.dot(a, b);
    if (dot < -0.999999) {
      vec3.cross(tmpvec3, xUnitVec3, a);
      if (vec3.len(tmpvec3) < 0.000001) vec3.cross(tmpvec3, yUnitVec3, a);
      vec3.normalize(tmpvec3, tmpvec3);
      setAxisAngle(out, tmpvec3, Math.PI);
      return out;
    } else if (dot > 0.999999) {
      out[0] = 0;
      out[1] = 0;
      out[2] = 0;
      out[3] = 1;
      return out;
    } else {
      vec3.cross(tmpvec3, a, b);
      out[0] = tmpvec3[0];
      out[1] = tmpvec3[1];
      out[2] = tmpvec3[2];
      out[3] = 1 + dot;
      return normalize(out, out);
    }
  };
}();

/**
 * Performs a spherical linear interpolation with two control points
 *
 * @param {quat} out the receiving quaternion
 * @param {ReadonlyQuat} a the first operand
 * @param {ReadonlyQuat} b the second operand
 * @param {ReadonlyQuat} c the third operand
 * @param {ReadonlyQuat} d the fourth operand
 * @param {Number} t interpolation amount, in the range [0-1], between the two inputs
 * @returns {quat} out
 */
var sqlerp = exports.sqlerp = function () {
  var temp1 = create();
  var temp2 = create();
  return function (out, a, b, c, d, t) {
    slerp(temp1, a, d, t);
    slerp(temp2, b, c, t);
    slerp(out, temp1, temp2, 2 * t * (1 - t));
    return out;
  };
}();

/**
 * Sets the specified quaternion with values corresponding to the given
 * axes. Each axis is a vec3 and is expected to be unit length and
 * perpendicular to all other specified axes.
 *
 * @param {ReadonlyVec3} view  the vector representing the viewing direction
 * @param {ReadonlyVec3} right the vector representing the local "right" direction
 * @param {ReadonlyVec3} up    the vector representing the local "up" direction
 * @returns {quat} out
 */
var setAxes = exports.setAxes = function () {
  var matr = mat3.create();
  return function (out, view, right, up) {
    matr[0] = right[0];
    matr[3] = right[1];
    matr[6] = right[2];
    matr[1] = up[0];
    matr[4] = up[1];
    matr[7] = up[2];
    matr[2] = -view[0];
    matr[5] = -view[1];
    matr[8] = -view[2];
    return normalize(out, fromMat3(out, matr));
  };
}();

},{"./common.js":4,"./mat3.js":8,"./vec3.js":13,"./vec4.js":14}],11:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.add = add;
exports.clone = clone;
exports.conjugate = conjugate;
exports.copy = copy;
exports.create = create;
exports.dot = void 0;
exports.equals = equals;
exports.exactEquals = exactEquals;
exports.fromMat4 = fromMat4;
exports.fromRotation = fromRotation;
exports.fromRotationTranslation = fromRotationTranslation;
exports.fromRotationTranslationValues = fromRotationTranslationValues;
exports.fromTranslation = fromTranslation;
exports.fromValues = fromValues;
exports.getDual = getDual;
exports.getReal = void 0;
exports.getTranslation = getTranslation;
exports.identity = identity;
exports.invert = invert;
exports.length = exports.len = void 0;
exports.lerp = lerp;
exports.mul = void 0;
exports.multiply = multiply;
exports.normalize = normalize;
exports.rotateAroundAxis = rotateAroundAxis;
exports.rotateByQuatAppend = rotateByQuatAppend;
exports.rotateByQuatPrepend = rotateByQuatPrepend;
exports.rotateX = rotateX;
exports.rotateY = rotateY;
exports.rotateZ = rotateZ;
exports.scale = scale;
exports.set = set;
exports.setDual = setDual;
exports.squaredLength = exports.sqrLen = exports.setReal = void 0;
exports.str = str;
exports.translate = translate;
var glMatrix = _interopRequireWildcard(require("./common.js"));
var quat = _interopRequireWildcard(require("./quat.js"));
var mat4 = _interopRequireWildcard(require("./mat4.js"));
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
/**
 * Dual Quaternion<br>
 * Format: [real, dual]<br>
 * Quaternion format: XYZW<br>
 * Make sure to have normalized dual quaternions, otherwise the functions may not work as intended.<br>
 * @module quat2
 */

/**
 * Creates a new identity dual quat
 *
 * @returns {quat2} a new dual quaternion [real -> rotation, dual -> translation]
 */
function create() {
  var dq = new glMatrix.ARRAY_TYPE(8);
  if (glMatrix.ARRAY_TYPE != Float32Array) {
    dq[0] = 0;
    dq[1] = 0;
    dq[2] = 0;
    dq[4] = 0;
    dq[5] = 0;
    dq[6] = 0;
    dq[7] = 0;
  }
  dq[3] = 1;
  return dq;
}

/**
 * Creates a new quat initialized with values from an existing quaternion
 *
 * @param {ReadonlyQuat2} a dual quaternion to clone
 * @returns {quat2} new dual quaternion
 * @function
 */
function clone(a) {
  var dq = new glMatrix.ARRAY_TYPE(8);
  dq[0] = a[0];
  dq[1] = a[1];
  dq[2] = a[2];
  dq[3] = a[3];
  dq[4] = a[4];
  dq[5] = a[5];
  dq[6] = a[6];
  dq[7] = a[7];
  return dq;
}

/**
 * Creates a new dual quat initialized with the given values
 *
 * @param {Number} x1 X component
 * @param {Number} y1 Y component
 * @param {Number} z1 Z component
 * @param {Number} w1 W component
 * @param {Number} x2 X component
 * @param {Number} y2 Y component
 * @param {Number} z2 Z component
 * @param {Number} w2 W component
 * @returns {quat2} new dual quaternion
 * @function
 */
function fromValues(x1, y1, z1, w1, x2, y2, z2, w2) {
  var dq = new glMatrix.ARRAY_TYPE(8);
  dq[0] = x1;
  dq[1] = y1;
  dq[2] = z1;
  dq[3] = w1;
  dq[4] = x2;
  dq[5] = y2;
  dq[6] = z2;
  dq[7] = w2;
  return dq;
}

/**
 * Creates a new dual quat from the given values (quat and translation)
 *
 * @param {Number} x1 X component
 * @param {Number} y1 Y component
 * @param {Number} z1 Z component
 * @param {Number} w1 W component
 * @param {Number} x2 X component (translation)
 * @param {Number} y2 Y component (translation)
 * @param {Number} z2 Z component (translation)
 * @returns {quat2} new dual quaternion
 * @function
 */
function fromRotationTranslationValues(x1, y1, z1, w1, x2, y2, z2) {
  var dq = new glMatrix.ARRAY_TYPE(8);
  dq[0] = x1;
  dq[1] = y1;
  dq[2] = z1;
  dq[3] = w1;
  var ax = x2 * 0.5,
    ay = y2 * 0.5,
    az = z2 * 0.5;
  dq[4] = ax * w1 + ay * z1 - az * y1;
  dq[5] = ay * w1 + az * x1 - ax * z1;
  dq[6] = az * w1 + ax * y1 - ay * x1;
  dq[7] = -ax * x1 - ay * y1 - az * z1;
  return dq;
}

/**
 * Creates a dual quat from a quaternion and a translation
 *
 * @param {ReadonlyQuat2} dual quaternion receiving operation result
 * @param {ReadonlyQuat} q a normalized quaternion
 * @param {ReadonlyVec3} t translation vector
 * @returns {quat2} dual quaternion receiving operation result
 * @function
 */
function fromRotationTranslation(out, q, t) {
  var ax = t[0] * 0.5,
    ay = t[1] * 0.5,
    az = t[2] * 0.5,
    bx = q[0],
    by = q[1],
    bz = q[2],
    bw = q[3];
  out[0] = bx;
  out[1] = by;
  out[2] = bz;
  out[3] = bw;
  out[4] = ax * bw + ay * bz - az * by;
  out[5] = ay * bw + az * bx - ax * bz;
  out[6] = az * bw + ax * by - ay * bx;
  out[7] = -ax * bx - ay * by - az * bz;
  return out;
}

/**
 * Creates a dual quat from a translation
 *
 * @param {ReadonlyQuat2} dual quaternion receiving operation result
 * @param {ReadonlyVec3} t translation vector
 * @returns {quat2} dual quaternion receiving operation result
 * @function
 */
function fromTranslation(out, t) {
  out[0] = 0;
  out[1] = 0;
  out[2] = 0;
  out[3] = 1;
  out[4] = t[0] * 0.5;
  out[5] = t[1] * 0.5;
  out[6] = t[2] * 0.5;
  out[7] = 0;
  return out;
}

/**
 * Creates a dual quat from a quaternion
 *
 * @param {ReadonlyQuat2} dual quaternion receiving operation result
 * @param {ReadonlyQuat} q the quaternion
 * @returns {quat2} dual quaternion receiving operation result
 * @function
 */
function fromRotation(out, q) {
  out[0] = q[0];
  out[1] = q[1];
  out[2] = q[2];
  out[3] = q[3];
  out[4] = 0;
  out[5] = 0;
  out[6] = 0;
  out[7] = 0;
  return out;
}

/**
 * Creates a new dual quat from a matrix (4x4)
 *
 * @param {quat2} out the dual quaternion
 * @param {ReadonlyMat4} a the matrix
 * @returns {quat2} dual quat receiving operation result
 * @function
 */
function fromMat4(out, a) {
  //TODO Optimize this
  var outer = quat.create();
  mat4.getRotation(outer, a);
  var t = new glMatrix.ARRAY_TYPE(3);
  mat4.getTranslation(t, a);
  fromRotationTranslation(out, outer, t);
  return out;
}

/**
 * Copy the values from one dual quat to another
 *
 * @param {quat2} out the receiving dual quaternion
 * @param {ReadonlyQuat2} a the source dual quaternion
 * @returns {quat2} out
 * @function
 */
function copy(out, a) {
  out[0] = a[0];
  out[1] = a[1];
  out[2] = a[2];
  out[3] = a[3];
  out[4] = a[4];
  out[5] = a[5];
  out[6] = a[6];
  out[7] = a[7];
  return out;
}

/**
 * Set a dual quat to the identity dual quaternion
 *
 * @param {quat2} out the receiving quaternion
 * @returns {quat2} out
 */
function identity(out) {
  out[0] = 0;
  out[1] = 0;
  out[2] = 0;
  out[3] = 1;
  out[4] = 0;
  out[5] = 0;
  out[6] = 0;
  out[7] = 0;
  return out;
}

/**
 * Set the components of a dual quat to the given values
 *
 * @param {quat2} out the receiving quaternion
 * @param {Number} x1 X component
 * @param {Number} y1 Y component
 * @param {Number} z1 Z component
 * @param {Number} w1 W component
 * @param {Number} x2 X component
 * @param {Number} y2 Y component
 * @param {Number} z2 Z component
 * @param {Number} w2 W component
 * @returns {quat2} out
 * @function
 */
function set(out, x1, y1, z1, w1, x2, y2, z2, w2) {
  out[0] = x1;
  out[1] = y1;
  out[2] = z1;
  out[3] = w1;
  out[4] = x2;
  out[5] = y2;
  out[6] = z2;
  out[7] = w2;
  return out;
}

/**
 * Gets the real part of a dual quat
 * @param  {quat} out real part
 * @param  {ReadonlyQuat2} a Dual Quaternion
 * @return {quat} real part
 */
var getReal = exports.getReal = quat.copy;

/**
 * Gets the dual part of a dual quat
 * @param  {quat} out dual part
 * @param  {ReadonlyQuat2} a Dual Quaternion
 * @return {quat} dual part
 */
function getDual(out, a) {
  out[0] = a[4];
  out[1] = a[5];
  out[2] = a[6];
  out[3] = a[7];
  return out;
}

/**
 * Set the real component of a dual quat to the given quaternion
 *
 * @param {quat2} out the receiving quaternion
 * @param {ReadonlyQuat} q a quaternion representing the real part
 * @returns {quat2} out
 * @function
 */
var setReal = exports.setReal = quat.copy;

/**
 * Set the dual component of a dual quat to the given quaternion
 *
 * @param {quat2} out the receiving quaternion
 * @param {ReadonlyQuat} q a quaternion representing the dual part
 * @returns {quat2} out
 * @function
 */
function setDual(out, q) {
  out[4] = q[0];
  out[5] = q[1];
  out[6] = q[2];
  out[7] = q[3];
  return out;
}

/**
 * Gets the translation of a normalized dual quat
 * @param  {vec3} out translation
 * @param  {ReadonlyQuat2} a Dual Quaternion to be decomposed
 * @return {vec3} translation
 */
function getTranslation(out, a) {
  var ax = a[4],
    ay = a[5],
    az = a[6],
    aw = a[7],
    bx = -a[0],
    by = -a[1],
    bz = -a[2],
    bw = a[3];
  out[0] = (ax * bw + aw * bx + ay * bz - az * by) * 2;
  out[1] = (ay * bw + aw * by + az * bx - ax * bz) * 2;
  out[2] = (az * bw + aw * bz + ax * by - ay * bx) * 2;
  return out;
}

/**
 * Translates a dual quat by the given vector
 *
 * @param {quat2} out the receiving dual quaternion
 * @param {ReadonlyQuat2} a the dual quaternion to translate
 * @param {ReadonlyVec3} v vector to translate by
 * @returns {quat2} out
 */
function translate(out, a, v) {
  var ax1 = a[0],
    ay1 = a[1],
    az1 = a[2],
    aw1 = a[3],
    bx1 = v[0] * 0.5,
    by1 = v[1] * 0.5,
    bz1 = v[2] * 0.5,
    ax2 = a[4],
    ay2 = a[5],
    az2 = a[6],
    aw2 = a[7];
  out[0] = ax1;
  out[1] = ay1;
  out[2] = az1;
  out[3] = aw1;
  out[4] = aw1 * bx1 + ay1 * bz1 - az1 * by1 + ax2;
  out[5] = aw1 * by1 + az1 * bx1 - ax1 * bz1 + ay2;
  out[6] = aw1 * bz1 + ax1 * by1 - ay1 * bx1 + az2;
  out[7] = -ax1 * bx1 - ay1 * by1 - az1 * bz1 + aw2;
  return out;
}

/**
 * Rotates a dual quat around the X axis
 *
 * @param {quat2} out the receiving dual quaternion
 * @param {ReadonlyQuat2} a the dual quaternion to rotate
 * @param {number} rad how far should the rotation be
 * @returns {quat2} out
 */
function rotateX(out, a, rad) {
  var bx = -a[0],
    by = -a[1],
    bz = -a[2],
    bw = a[3],
    ax = a[4],
    ay = a[5],
    az = a[6],
    aw = a[7],
    ax1 = ax * bw + aw * bx + ay * bz - az * by,
    ay1 = ay * bw + aw * by + az * bx - ax * bz,
    az1 = az * bw + aw * bz + ax * by - ay * bx,
    aw1 = aw * bw - ax * bx - ay * by - az * bz;
  quat.rotateX(out, a, rad);
  bx = out[0];
  by = out[1];
  bz = out[2];
  bw = out[3];
  out[4] = ax1 * bw + aw1 * bx + ay1 * bz - az1 * by;
  out[5] = ay1 * bw + aw1 * by + az1 * bx - ax1 * bz;
  out[6] = az1 * bw + aw1 * bz + ax1 * by - ay1 * bx;
  out[7] = aw1 * bw - ax1 * bx - ay1 * by - az1 * bz;
  return out;
}

/**
 * Rotates a dual quat around the Y axis
 *
 * @param {quat2} out the receiving dual quaternion
 * @param {ReadonlyQuat2} a the dual quaternion to rotate
 * @param {number} rad how far should the rotation be
 * @returns {quat2} out
 */
function rotateY(out, a, rad) {
  var bx = -a[0],
    by = -a[1],
    bz = -a[2],
    bw = a[3],
    ax = a[4],
    ay = a[5],
    az = a[6],
    aw = a[7],
    ax1 = ax * bw + aw * bx + ay * bz - az * by,
    ay1 = ay * bw + aw * by + az * bx - ax * bz,
    az1 = az * bw + aw * bz + ax * by - ay * bx,
    aw1 = aw * bw - ax * bx - ay * by - az * bz;
  quat.rotateY(out, a, rad);
  bx = out[0];
  by = out[1];
  bz = out[2];
  bw = out[3];
  out[4] = ax1 * bw + aw1 * bx + ay1 * bz - az1 * by;
  out[5] = ay1 * bw + aw1 * by + az1 * bx - ax1 * bz;
  out[6] = az1 * bw + aw1 * bz + ax1 * by - ay1 * bx;
  out[7] = aw1 * bw - ax1 * bx - ay1 * by - az1 * bz;
  return out;
}

/**
 * Rotates a dual quat around the Z axis
 *
 * @param {quat2} out the receiving dual quaternion
 * @param {ReadonlyQuat2} a the dual quaternion to rotate
 * @param {number} rad how far should the rotation be
 * @returns {quat2} out
 */
function rotateZ(out, a, rad) {
  var bx = -a[0],
    by = -a[1],
    bz = -a[2],
    bw = a[3],
    ax = a[4],
    ay = a[5],
    az = a[6],
    aw = a[7],
    ax1 = ax * bw + aw * bx + ay * bz - az * by,
    ay1 = ay * bw + aw * by + az * bx - ax * bz,
    az1 = az * bw + aw * bz + ax * by - ay * bx,
    aw1 = aw * bw - ax * bx - ay * by - az * bz;
  quat.rotateZ(out, a, rad);
  bx = out[0];
  by = out[1];
  bz = out[2];
  bw = out[3];
  out[4] = ax1 * bw + aw1 * bx + ay1 * bz - az1 * by;
  out[5] = ay1 * bw + aw1 * by + az1 * bx - ax1 * bz;
  out[6] = az1 * bw + aw1 * bz + ax1 * by - ay1 * bx;
  out[7] = aw1 * bw - ax1 * bx - ay1 * by - az1 * bz;
  return out;
}

/**
 * Rotates a dual quat by a given quaternion (a * q)
 *
 * @param {quat2} out the receiving dual quaternion
 * @param {ReadonlyQuat2} a the dual quaternion to rotate
 * @param {ReadonlyQuat} q quaternion to rotate by
 * @returns {quat2} out
 */
function rotateByQuatAppend(out, a, q) {
  var qx = q[0],
    qy = q[1],
    qz = q[2],
    qw = q[3],
    ax = a[0],
    ay = a[1],
    az = a[2],
    aw = a[3];
  out[0] = ax * qw + aw * qx + ay * qz - az * qy;
  out[1] = ay * qw + aw * qy + az * qx - ax * qz;
  out[2] = az * qw + aw * qz + ax * qy - ay * qx;
  out[3] = aw * qw - ax * qx - ay * qy - az * qz;
  ax = a[4];
  ay = a[5];
  az = a[6];
  aw = a[7];
  out[4] = ax * qw + aw * qx + ay * qz - az * qy;
  out[5] = ay * qw + aw * qy + az * qx - ax * qz;
  out[6] = az * qw + aw * qz + ax * qy - ay * qx;
  out[7] = aw * qw - ax * qx - ay * qy - az * qz;
  return out;
}

/**
 * Rotates a dual quat by a given quaternion (q * a)
 *
 * @param {quat2} out the receiving dual quaternion
 * @param {ReadonlyQuat} q quaternion to rotate by
 * @param {ReadonlyQuat2} a the dual quaternion to rotate
 * @returns {quat2} out
 */
function rotateByQuatPrepend(out, q, a) {
  var qx = q[0],
    qy = q[1],
    qz = q[2],
    qw = q[3],
    bx = a[0],
    by = a[1],
    bz = a[2],
    bw = a[3];
  out[0] = qx * bw + qw * bx + qy * bz - qz * by;
  out[1] = qy * bw + qw * by + qz * bx - qx * bz;
  out[2] = qz * bw + qw * bz + qx * by - qy * bx;
  out[3] = qw * bw - qx * bx - qy * by - qz * bz;
  bx = a[4];
  by = a[5];
  bz = a[6];
  bw = a[7];
  out[4] = qx * bw + qw * bx + qy * bz - qz * by;
  out[5] = qy * bw + qw * by + qz * bx - qx * bz;
  out[6] = qz * bw + qw * bz + qx * by - qy * bx;
  out[7] = qw * bw - qx * bx - qy * by - qz * bz;
  return out;
}

/**
 * Rotates a dual quat around a given axis. Does the normalisation automatically
 *
 * @param {quat2} out the receiving dual quaternion
 * @param {ReadonlyQuat2} a the dual quaternion to rotate
 * @param {ReadonlyVec3} axis the axis to rotate around
 * @param {Number} rad how far the rotation should be
 * @returns {quat2} out
 */
function rotateAroundAxis(out, a, axis, rad) {
  //Special case for rad = 0
  if (Math.abs(rad) < glMatrix.EPSILON) {
    return copy(out, a);
  }
  var axisLength = Math.sqrt(axis[0] * axis[0] + axis[1] * axis[1] + axis[2] * axis[2]);
  rad = rad * 0.5;
  var s = Math.sin(rad);
  var bx = s * axis[0] / axisLength;
  var by = s * axis[1] / axisLength;
  var bz = s * axis[2] / axisLength;
  var bw = Math.cos(rad);
  var ax1 = a[0],
    ay1 = a[1],
    az1 = a[2],
    aw1 = a[3];
  out[0] = ax1 * bw + aw1 * bx + ay1 * bz - az1 * by;
  out[1] = ay1 * bw + aw1 * by + az1 * bx - ax1 * bz;
  out[2] = az1 * bw + aw1 * bz + ax1 * by - ay1 * bx;
  out[3] = aw1 * bw - ax1 * bx - ay1 * by - az1 * bz;
  var ax = a[4],
    ay = a[5],
    az = a[6],
    aw = a[7];
  out[4] = ax * bw + aw * bx + ay * bz - az * by;
  out[5] = ay * bw + aw * by + az * bx - ax * bz;
  out[6] = az * bw + aw * bz + ax * by - ay * bx;
  out[7] = aw * bw - ax * bx - ay * by - az * bz;
  return out;
}

/**
 * Adds two dual quat's
 *
 * @param {quat2} out the receiving dual quaternion
 * @param {ReadonlyQuat2} a the first operand
 * @param {ReadonlyQuat2} b the second operand
 * @returns {quat2} out
 * @function
 */
function add(out, a, b) {
  out[0] = a[0] + b[0];
  out[1] = a[1] + b[1];
  out[2] = a[2] + b[2];
  out[3] = a[3] + b[3];
  out[4] = a[4] + b[4];
  out[5] = a[5] + b[5];
  out[6] = a[6] + b[6];
  out[7] = a[7] + b[7];
  return out;
}

/**
 * Multiplies two dual quat's
 *
 * @param {quat2} out the receiving dual quaternion
 * @param {ReadonlyQuat2} a the first operand
 * @param {ReadonlyQuat2} b the second operand
 * @returns {quat2} out
 */
function multiply(out, a, b) {
  var ax0 = a[0],
    ay0 = a[1],
    az0 = a[2],
    aw0 = a[3],
    bx1 = b[4],
    by1 = b[5],
    bz1 = b[6],
    bw1 = b[7],
    ax1 = a[4],
    ay1 = a[5],
    az1 = a[6],
    aw1 = a[7],
    bx0 = b[0],
    by0 = b[1],
    bz0 = b[2],
    bw0 = b[3];
  out[0] = ax0 * bw0 + aw0 * bx0 + ay0 * bz0 - az0 * by0;
  out[1] = ay0 * bw0 + aw0 * by0 + az0 * bx0 - ax0 * bz0;
  out[2] = az0 * bw0 + aw0 * bz0 + ax0 * by0 - ay0 * bx0;
  out[3] = aw0 * bw0 - ax0 * bx0 - ay0 * by0 - az0 * bz0;
  out[4] = ax0 * bw1 + aw0 * bx1 + ay0 * bz1 - az0 * by1 + ax1 * bw0 + aw1 * bx0 + ay1 * bz0 - az1 * by0;
  out[5] = ay0 * bw1 + aw0 * by1 + az0 * bx1 - ax0 * bz1 + ay1 * bw0 + aw1 * by0 + az1 * bx0 - ax1 * bz0;
  out[6] = az0 * bw1 + aw0 * bz1 + ax0 * by1 - ay0 * bx1 + az1 * bw0 + aw1 * bz0 + ax1 * by0 - ay1 * bx0;
  out[7] = aw0 * bw1 - ax0 * bx1 - ay0 * by1 - az0 * bz1 + aw1 * bw0 - ax1 * bx0 - ay1 * by0 - az1 * bz0;
  return out;
}

/**
 * Alias for {@link quat2.multiply}
 * @function
 */
var mul = exports.mul = multiply;

/**
 * Scales a dual quat by a scalar number
 *
 * @param {quat2} out the receiving dual quat
 * @param {ReadonlyQuat2} a the dual quat to scale
 * @param {Number} b amount to scale the dual quat by
 * @returns {quat2} out
 * @function
 */
function scale(out, a, b) {
  out[0] = a[0] * b;
  out[1] = a[1] * b;
  out[2] = a[2] * b;
  out[3] = a[3] * b;
  out[4] = a[4] * b;
  out[5] = a[5] * b;
  out[6] = a[6] * b;
  out[7] = a[7] * b;
  return out;
}

/**
 * Calculates the dot product of two dual quat's (The dot product of the real parts)
 *
 * @param {ReadonlyQuat2} a the first operand
 * @param {ReadonlyQuat2} b the second operand
 * @returns {Number} dot product of a and b
 * @function
 */
var dot = exports.dot = quat.dot;

/**
 * Performs a linear interpolation between two dual quats's
 * NOTE: The resulting dual quaternions won't always be normalized (The error is most noticeable when t = 0.5)
 *
 * @param {quat2} out the receiving dual quat
 * @param {ReadonlyQuat2} a the first operand
 * @param {ReadonlyQuat2} b the second operand
 * @param {Number} t interpolation amount, in the range [0-1], between the two inputs
 * @returns {quat2} out
 */
function lerp(out, a, b, t) {
  var mt = 1 - t;
  if (dot(a, b) < 0) t = -t;
  out[0] = a[0] * mt + b[0] * t;
  out[1] = a[1] * mt + b[1] * t;
  out[2] = a[2] * mt + b[2] * t;
  out[3] = a[3] * mt + b[3] * t;
  out[4] = a[4] * mt + b[4] * t;
  out[5] = a[5] * mt + b[5] * t;
  out[6] = a[6] * mt + b[6] * t;
  out[7] = a[7] * mt + b[7] * t;
  return out;
}

/**
 * Calculates the inverse of a dual quat. If they are normalized, conjugate is cheaper
 *
 * @param {quat2} out the receiving dual quaternion
 * @param {ReadonlyQuat2} a dual quat to calculate inverse of
 * @returns {quat2} out
 */
function invert(out, a) {
  var sqlen = squaredLength(a);
  out[0] = -a[0] / sqlen;
  out[1] = -a[1] / sqlen;
  out[2] = -a[2] / sqlen;
  out[3] = a[3] / sqlen;
  out[4] = -a[4] / sqlen;
  out[5] = -a[5] / sqlen;
  out[6] = -a[6] / sqlen;
  out[7] = a[7] / sqlen;
  return out;
}

/**
 * Calculates the conjugate of a dual quat
 * If the dual quaternion is normalized, this function is faster than quat2.inverse and produces the same result.
 *
 * @param {quat2} out the receiving quaternion
 * @param {ReadonlyQuat2} a quat to calculate conjugate of
 * @returns {quat2} out
 */
function conjugate(out, a) {
  out[0] = -a[0];
  out[1] = -a[1];
  out[2] = -a[2];
  out[3] = a[3];
  out[4] = -a[4];
  out[5] = -a[5];
  out[6] = -a[6];
  out[7] = a[7];
  return out;
}

/**
 * Calculates the length of a dual quat
 *
 * @param {ReadonlyQuat2} a dual quat to calculate length of
 * @returns {Number} length of a
 * @function
 */
var length = exports.length = quat.length;

/**
 * Alias for {@link quat2.length}
 * @function
 */
var len = exports.len = length;

/**
 * Calculates the squared length of a dual quat
 *
 * @param {ReadonlyQuat2} a dual quat to calculate squared length of
 * @returns {Number} squared length of a
 * @function
 */
var squaredLength = exports.squaredLength = quat.squaredLength;

/**
 * Alias for {@link quat2.squaredLength}
 * @function
 */
var sqrLen = exports.sqrLen = squaredLength;

/**
 * Normalize a dual quat
 *
 * @param {quat2} out the receiving dual quaternion
 * @param {ReadonlyQuat2} a dual quaternion to normalize
 * @returns {quat2} out
 * @function
 */
function normalize(out, a) {
  var magnitude = squaredLength(a);
  if (magnitude > 0) {
    magnitude = Math.sqrt(magnitude);
    var a0 = a[0] / magnitude;
    var a1 = a[1] / magnitude;
    var a2 = a[2] / magnitude;
    var a3 = a[3] / magnitude;
    var b0 = a[4];
    var b1 = a[5];
    var b2 = a[6];
    var b3 = a[7];
    var a_dot_b = a0 * b0 + a1 * b1 + a2 * b2 + a3 * b3;
    out[0] = a0;
    out[1] = a1;
    out[2] = a2;
    out[3] = a3;
    out[4] = (b0 - a0 * a_dot_b) / magnitude;
    out[5] = (b1 - a1 * a_dot_b) / magnitude;
    out[6] = (b2 - a2 * a_dot_b) / magnitude;
    out[7] = (b3 - a3 * a_dot_b) / magnitude;
  }
  return out;
}

/**
 * Returns a string representation of a dual quaternion
 *
 * @param {ReadonlyQuat2} a dual quaternion to represent as a string
 * @returns {String} string representation of the dual quat
 */
function str(a) {
  return "quat2(" + a[0] + ", " + a[1] + ", " + a[2] + ", " + a[3] + ", " + a[4] + ", " + a[5] + ", " + a[6] + ", " + a[7] + ")";
}

/**
 * Returns whether or not the dual quaternions have exactly the same elements in the same position (when compared with ===)
 *
 * @param {ReadonlyQuat2} a the first dual quaternion.
 * @param {ReadonlyQuat2} b the second dual quaternion.
 * @returns {Boolean} true if the dual quaternions are equal, false otherwise.
 */
function exactEquals(a, b) {
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3] && a[4] === b[4] && a[5] === b[5] && a[6] === b[6] && a[7] === b[7];
}

/**
 * Returns whether or not the dual quaternions have approximately the same elements in the same position.
 *
 * @param {ReadonlyQuat2} a the first dual quat.
 * @param {ReadonlyQuat2} b the second dual quat.
 * @returns {Boolean} true if the dual quats are equal, false otherwise.
 */
function equals(a, b) {
  var a0 = a[0],
    a1 = a[1],
    a2 = a[2],
    a3 = a[3],
    a4 = a[4],
    a5 = a[5],
    a6 = a[6],
    a7 = a[7];
  var b0 = b[0],
    b1 = b[1],
    b2 = b[2],
    b3 = b[3],
    b4 = b[4],
    b5 = b[5],
    b6 = b[6],
    b7 = b[7];
  return Math.abs(a0 - b0) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a0), Math.abs(b0)) && Math.abs(a1 - b1) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a1), Math.abs(b1)) && Math.abs(a2 - b2) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a2), Math.abs(b2)) && Math.abs(a3 - b3) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a3), Math.abs(b3)) && Math.abs(a4 - b4) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a4), Math.abs(b4)) && Math.abs(a5 - b5) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a5), Math.abs(b5)) && Math.abs(a6 - b6) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a6), Math.abs(b6)) && Math.abs(a7 - b7) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a7), Math.abs(b7));
}

},{"./common.js":4,"./mat4.js":9,"./quat.js":10}],12:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.add = add;
exports.angle = angle;
exports.ceil = ceil;
exports.clone = clone;
exports.copy = copy;
exports.create = create;
exports.cross = cross;
exports.dist = void 0;
exports.distance = distance;
exports.div = void 0;
exports.divide = divide;
exports.dot = dot;
exports.equals = equals;
exports.exactEquals = exactEquals;
exports.floor = floor;
exports.forEach = void 0;
exports.fromValues = fromValues;
exports.inverse = inverse;
exports.len = void 0;
exports.length = length;
exports.lerp = lerp;
exports.max = max;
exports.min = min;
exports.mul = void 0;
exports.multiply = multiply;
exports.negate = negate;
exports.normalize = normalize;
exports.random = random;
exports.rotate = rotate;
exports.round = round;
exports.scale = scale;
exports.scaleAndAdd = scaleAndAdd;
exports.set = set;
exports.signedAngle = signedAngle;
exports.sqrLen = exports.sqrDist = void 0;
exports.squaredDistance = squaredDistance;
exports.squaredLength = squaredLength;
exports.str = str;
exports.sub = void 0;
exports.subtract = subtract;
exports.transformMat2 = transformMat2;
exports.transformMat2d = transformMat2d;
exports.transformMat3 = transformMat3;
exports.transformMat4 = transformMat4;
exports.zero = zero;
var glMatrix = _interopRequireWildcard(require("./common.js"));
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
/**
 * 2 Dimensional Vector
 * @module vec2
 */

/**
 * Creates a new, empty vec2
 *
 * @returns {vec2} a new 2D vector
 */
function create() {
  var out = new glMatrix.ARRAY_TYPE(2);
  if (glMatrix.ARRAY_TYPE != Float32Array) {
    out[0] = 0;
    out[1] = 0;
  }
  return out;
}

/**
 * Creates a new vec2 initialized with values from an existing vector
 *
 * @param {ReadonlyVec2} a vector to clone
 * @returns {vec2} a new 2D vector
 */
function clone(a) {
  var out = new glMatrix.ARRAY_TYPE(2);
  out[0] = a[0];
  out[1] = a[1];
  return out;
}

/**
 * Creates a new vec2 initialized with the given values
 *
 * @param {Number} x X component
 * @param {Number} y Y component
 * @returns {vec2} a new 2D vector
 */
function fromValues(x, y) {
  var out = new glMatrix.ARRAY_TYPE(2);
  out[0] = x;
  out[1] = y;
  return out;
}

/**
 * Copy the values from one vec2 to another
 *
 * @param {vec2} out the receiving vector
 * @param {ReadonlyVec2} a the source vector
 * @returns {vec2} out
 */
function copy(out, a) {
  out[0] = a[0];
  out[1] = a[1];
  return out;
}

/**
 * Set the components of a vec2 to the given values
 *
 * @param {vec2} out the receiving vector
 * @param {Number} x X component
 * @param {Number} y Y component
 * @returns {vec2} out
 */
function set(out, x, y) {
  out[0] = x;
  out[1] = y;
  return out;
}

/**
 * Adds two vec2's
 *
 * @param {vec2} out the receiving vector
 * @param {ReadonlyVec2} a the first operand
 * @param {ReadonlyVec2} b the second operand
 * @returns {vec2} out
 */
function add(out, a, b) {
  out[0] = a[0] + b[0];
  out[1] = a[1] + b[1];
  return out;
}

/**
 * Subtracts vector b from vector a
 *
 * @param {vec2} out the receiving vector
 * @param {ReadonlyVec2} a the first operand
 * @param {ReadonlyVec2} b the second operand
 * @returns {vec2} out
 */
function subtract(out, a, b) {
  out[0] = a[0] - b[0];
  out[1] = a[1] - b[1];
  return out;
}

/**
 * Multiplies two vec2's
 *
 * @param {vec2} out the receiving vector
 * @param {ReadonlyVec2} a the first operand
 * @param {ReadonlyVec2} b the second operand
 * @returns {vec2} out
 */
function multiply(out, a, b) {
  out[0] = a[0] * b[0];
  out[1] = a[1] * b[1];
  return out;
}

/**
 * Divides two vec2's
 *
 * @param {vec2} out the receiving vector
 * @param {ReadonlyVec2} a the first operand
 * @param {ReadonlyVec2} b the second operand
 * @returns {vec2} out
 */
function divide(out, a, b) {
  out[0] = a[0] / b[0];
  out[1] = a[1] / b[1];
  return out;
}

/**
 * Math.ceil the components of a vec2
 *
 * @param {vec2} out the receiving vector
 * @param {ReadonlyVec2} a vector to ceil
 * @returns {vec2} out
 */
function ceil(out, a) {
  out[0] = Math.ceil(a[0]);
  out[1] = Math.ceil(a[1]);
  return out;
}

/**
 * Math.floor the components of a vec2
 *
 * @param {vec2} out the receiving vector
 * @param {ReadonlyVec2} a vector to floor
 * @returns {vec2} out
 */
function floor(out, a) {
  out[0] = Math.floor(a[0]);
  out[1] = Math.floor(a[1]);
  return out;
}

/**
 * Returns the minimum of two vec2's
 *
 * @param {vec2} out the receiving vector
 * @param {ReadonlyVec2} a the first operand
 * @param {ReadonlyVec2} b the second operand
 * @returns {vec2} out
 */
function min(out, a, b) {
  out[0] = Math.min(a[0], b[0]);
  out[1] = Math.min(a[1], b[1]);
  return out;
}

/**
 * Returns the maximum of two vec2's
 *
 * @param {vec2} out the receiving vector
 * @param {ReadonlyVec2} a the first operand
 * @param {ReadonlyVec2} b the second operand
 * @returns {vec2} out
 */
function max(out, a, b) {
  out[0] = Math.max(a[0], b[0]);
  out[1] = Math.max(a[1], b[1]);
  return out;
}

/**
 * symmetric round the components of a vec2
 *
 * @param {vec2} out the receiving vector
 * @param {ReadonlyVec2} a vector to round
 * @returns {vec2} out
 */
function round(out, a) {
  out[0] = glMatrix.round(a[0]);
  out[1] = glMatrix.round(a[1]);
  return out;
}

/**
 * Scales a vec2 by a scalar number
 *
 * @param {vec2} out the receiving vector
 * @param {ReadonlyVec2} a the vector to scale
 * @param {Number} b amount to scale the vector by
 * @returns {vec2} out
 */
function scale(out, a, b) {
  out[0] = a[0] * b;
  out[1] = a[1] * b;
  return out;
}

/**
 * Adds two vec2's after scaling the second operand by a scalar value
 *
 * @param {vec2} out the receiving vector
 * @param {ReadonlyVec2} a the first operand
 * @param {ReadonlyVec2} b the second operand
 * @param {Number} scale the amount to scale b by before adding
 * @returns {vec2} out
 */
function scaleAndAdd(out, a, b, scale) {
  out[0] = a[0] + b[0] * scale;
  out[1] = a[1] + b[1] * scale;
  return out;
}

/**
 * Calculates the euclidian distance between two vec2's
 *
 * @param {ReadonlyVec2} a the first operand
 * @param {ReadonlyVec2} b the second operand
 * @returns {Number} distance between a and b
 */
function distance(a, b) {
  var x = b[0] - a[0],
    y = b[1] - a[1];
  return Math.sqrt(x * x + y * y);
}

/**
 * Calculates the squared euclidian distance between two vec2's
 *
 * @param {ReadonlyVec2} a the first operand
 * @param {ReadonlyVec2} b the second operand
 * @returns {Number} squared distance between a and b
 */
function squaredDistance(a, b) {
  var x = b[0] - a[0],
    y = b[1] - a[1];
  return x * x + y * y;
}

/**
 * Calculates the length of a vec2
 *
 * @param {ReadonlyVec2} a vector to calculate length of
 * @returns {Number} length of a
 */
function length(a) {
  var x = a[0],
    y = a[1];
  return Math.sqrt(x * x + y * y);
}

/**
 * Calculates the squared length of a vec2
 *
 * @param {ReadonlyVec2} a vector to calculate squared length of
 * @returns {Number} squared length of a
 */
function squaredLength(a) {
  var x = a[0],
    y = a[1];
  return x * x + y * y;
}

/**
 * Negates the components of a vec2
 *
 * @param {vec2} out the receiving vector
 * @param {ReadonlyVec2} a vector to negate
 * @returns {vec2} out
 */
function negate(out, a) {
  out[0] = -a[0];
  out[1] = -a[1];
  return out;
}

/**
 * Returns the inverse of the components of a vec2
 *
 * @param {vec2} out the receiving vector
 * @param {ReadonlyVec2} a vector to invert
 * @returns {vec2} out
 */
function inverse(out, a) {
  out[0] = 1.0 / a[0];
  out[1] = 1.0 / a[1];
  return out;
}

/**
 * Normalize a vec2
 *
 * @param {vec2} out the receiving vector
 * @param {ReadonlyVec2} a vector to normalize
 * @returns {vec2} out
 */
function normalize(out, a) {
  var x = a[0],
    y = a[1];
  var len = x * x + y * y;
  if (len > 0) {
    //TODO: evaluate use of glm_invsqrt here?
    len = 1 / Math.sqrt(len);
  }
  out[0] = a[0] * len;
  out[1] = a[1] * len;
  return out;
}

/**
 * Calculates the dot product of two vec2's
 *
 * @param {ReadonlyVec2} a the first operand
 * @param {ReadonlyVec2} b the second operand
 * @returns {Number} dot product of a and b
 */
function dot(a, b) {
  return a[0] * b[0] + a[1] * b[1];
}

/**
 * Computes the cross product of two vec2's
 * Note that the cross product must by definition produce a 3D vector
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec2} a the first operand
 * @param {ReadonlyVec2} b the second operand
 * @returns {vec3} out
 */
function cross(out, a, b) {
  var z = a[0] * b[1] - a[1] * b[0];
  out[0] = out[1] = 0;
  out[2] = z;
  return out;
}

/**
 * Performs a linear interpolation between two vec2's
 *
 * @param {vec2} out the receiving vector
 * @param {ReadonlyVec2} a the first operand
 * @param {ReadonlyVec2} b the second operand
 * @param {Number} t interpolation amount, in the range [0-1], between the two inputs
 * @returns {vec2} out
 */
function lerp(out, a, b, t) {
  var ax = a[0],
    ay = a[1];
  out[0] = ax + t * (b[0] - ax);
  out[1] = ay + t * (b[1] - ay);
  return out;
}

/**
 * Generates a random vector with the given scale
 *
 * @param {vec2} out the receiving vector
 * @param {Number} [scale] Length of the resulting vector. If omitted, a unit vector will be returned
 * @returns {vec2} out
 */
function random(out, scale) {
  scale = scale === undefined ? 1.0 : scale;
  var r = glMatrix.RANDOM() * 2.0 * Math.PI;
  out[0] = Math.cos(r) * scale;
  out[1] = Math.sin(r) * scale;
  return out;
}

/**
 * Transforms the vec2 with a mat2
 *
 * @param {vec2} out the receiving vector
 * @param {ReadonlyVec2} a the vector to transform
 * @param {ReadonlyMat2} m matrix to transform with
 * @returns {vec2} out
 */
function transformMat2(out, a, m) {
  var x = a[0],
    y = a[1];
  out[0] = m[0] * x + m[2] * y;
  out[1] = m[1] * x + m[3] * y;
  return out;
}

/**
 * Transforms the vec2 with a mat2d
 *
 * @param {vec2} out the receiving vector
 * @param {ReadonlyVec2} a the vector to transform
 * @param {ReadonlyMat2d} m matrix to transform with
 * @returns {vec2} out
 */
function transformMat2d(out, a, m) {
  var x = a[0],
    y = a[1];
  out[0] = m[0] * x + m[2] * y + m[4];
  out[1] = m[1] * x + m[3] * y + m[5];
  return out;
}

/**
 * Transforms the vec2 with a mat3
 * 3rd vector component is implicitly '1'
 *
 * @param {vec2} out the receiving vector
 * @param {ReadonlyVec2} a the vector to transform
 * @param {ReadonlyMat3} m matrix to transform with
 * @returns {vec2} out
 */
function transformMat3(out, a, m) {
  var x = a[0],
    y = a[1];
  out[0] = m[0] * x + m[3] * y + m[6];
  out[1] = m[1] * x + m[4] * y + m[7];
  return out;
}

/**
 * Transforms the vec2 with a mat4
 * 3rd vector component is implicitly '0'
 * 4th vector component is implicitly '1'
 *
 * @param {vec2} out the receiving vector
 * @param {ReadonlyVec2} a the vector to transform
 * @param {ReadonlyMat4} m matrix to transform with
 * @returns {vec2} out
 */
function transformMat4(out, a, m) {
  var x = a[0];
  var y = a[1];
  out[0] = m[0] * x + m[4] * y + m[12];
  out[1] = m[1] * x + m[5] * y + m[13];
  return out;
}

/**
 * Rotate a 2D vector
 * @param {vec2} out The receiving vec2
 * @param {ReadonlyVec2} a The vec2 point to rotate
 * @param {ReadonlyVec2} b The origin of the rotation
 * @param {Number} rad The angle of rotation in radians
 * @returns {vec2} out
 */
function rotate(out, a, b, rad) {
  //Translate point to the origin
  var p0 = a[0] - b[0],
    p1 = a[1] - b[1],
    sinC = Math.sin(rad),
    cosC = Math.cos(rad);

  //perform rotation and translate to correct position
  out[0] = p0 * cosC - p1 * sinC + b[0];
  out[1] = p0 * sinC + p1 * cosC + b[1];
  return out;
}

/**
 * Get the smallest angle between two 2D vectors
 * @param {ReadonlyVec2} a The first operand
 * @param {ReadonlyVec2} b The second operand
 * @returns {Number} The angle in radians
 */
function angle(a, b) {
  var ax = a[0],
    ay = a[1],
    bx = b[0],
    by = b[1];
  return Math.abs(Math.atan2(ay * bx - ax * by, ax * bx + ay * by));
}

/**
 * Get the signed angle in the interval [-pi,pi] between two 2D vectors (positive if `a` is to the right of `b`)
 * 
 * @param {ReadonlyVec2} a The first vector
 * @param {ReadonlyVec2} b The second vector
 * @returns {number} The signed angle in radians
 */
function signedAngle(a, b) {
  var ax = a[0],
    ay = a[1],
    bx = b[0],
    by = b[1];
  return Math.atan2(ax * by - ay * bx, ax * bx + ay * by);
}

/**
 * Set the components of a vec2 to zero
 *
 * @param {vec2} out the receiving vector
 * @returns {vec2} out
 */
function zero(out) {
  out[0] = 0.0;
  out[1] = 0.0;
  return out;
}

/**
 * Returns a string representation of a vector
 *
 * @param {ReadonlyVec2} a vector to represent as a string
 * @returns {String} string representation of the vector
 */
function str(a) {
  return "vec2(" + a[0] + ", " + a[1] + ")";
}

/**
 * Returns whether or not the vectors exactly have the same elements in the same position (when compared with ===)
 *
 * @param {ReadonlyVec2} a The first vector.
 * @param {ReadonlyVec2} b The second vector.
 * @returns {Boolean} True if the vectors are equal, false otherwise.
 */
function exactEquals(a, b) {
  return a[0] === b[0] && a[1] === b[1];
}

/**
 * Returns whether or not the vectors have approximately the same elements in the same position.
 *
 * @param {ReadonlyVec2} a The first vector.
 * @param {ReadonlyVec2} b The second vector.
 * @returns {Boolean} True if the vectors are equal, false otherwise.
 */
function equals(a, b) {
  var a0 = a[0],
    a1 = a[1];
  var b0 = b[0],
    b1 = b[1];
  return Math.abs(a0 - b0) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a0), Math.abs(b0)) && Math.abs(a1 - b1) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a1), Math.abs(b1));
}

/**
 * Alias for {@link vec2.length}
 * @function
 */
var len = exports.len = length;

/**
 * Alias for {@link vec2.subtract}
 * @function
 */
var sub = exports.sub = subtract;

/**
 * Alias for {@link vec2.multiply}
 * @function
 */
var mul = exports.mul = multiply;

/**
 * Alias for {@link vec2.divide}
 * @function
 */
var div = exports.div = divide;

/**
 * Alias for {@link vec2.distance}
 * @function
 */
var dist = exports.dist = distance;

/**
 * Alias for {@link vec2.squaredDistance}
 * @function
 */
var sqrDist = exports.sqrDist = squaredDistance;

/**
 * Alias for {@link vec2.squaredLength}
 * @function
 */
var sqrLen = exports.sqrLen = squaredLength;

/**
 * Perform some operation over an array of vec2s.
 *
 * @param {Array} a the array of vectors to iterate over
 * @param {Number} stride Number of elements between the start of each vec2. If 0 assumes tightly packed
 * @param {Number} offset Number of elements to skip at the beginning of the array
 * @param {Number} count Number of vec2s to iterate over. If 0 iterates over entire array
 * @param {Function} fn Function to call for each vector in the array
 * @param {Object} [arg] additional argument to pass to fn
 * @returns {Array} a
 * @function
 */
var forEach = exports.forEach = function () {
  var vec = create();
  return function (a, stride, offset, count, fn, arg) {
    var i, l;
    if (!stride) {
      stride = 2;
    }
    if (!offset) {
      offset = 0;
    }
    if (count) {
      l = Math.min(count * stride + offset, a.length);
    } else {
      l = a.length;
    }
    for (i = offset; i < l; i += stride) {
      vec[0] = a[i];
      vec[1] = a[i + 1];
      fn(vec, vec, arg);
      a[i] = vec[0];
      a[i + 1] = vec[1];
    }
    return a;
  };
}();

},{"./common.js":4}],13:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.add = add;
exports.angle = angle;
exports.bezier = bezier;
exports.ceil = ceil;
exports.clone = clone;
exports.copy = copy;
exports.create = create;
exports.cross = cross;
exports.dist = void 0;
exports.distance = distance;
exports.div = void 0;
exports.divide = divide;
exports.dot = dot;
exports.equals = equals;
exports.exactEquals = exactEquals;
exports.floor = floor;
exports.forEach = void 0;
exports.fromValues = fromValues;
exports.hermite = hermite;
exports.inverse = inverse;
exports.len = void 0;
exports.length = length;
exports.lerp = lerp;
exports.max = max;
exports.min = min;
exports.mul = void 0;
exports.multiply = multiply;
exports.negate = negate;
exports.normalize = normalize;
exports.random = random;
exports.rotateX = rotateX;
exports.rotateY = rotateY;
exports.rotateZ = rotateZ;
exports.round = round;
exports.scale = scale;
exports.scaleAndAdd = scaleAndAdd;
exports.set = set;
exports.slerp = slerp;
exports.sqrLen = exports.sqrDist = void 0;
exports.squaredDistance = squaredDistance;
exports.squaredLength = squaredLength;
exports.str = str;
exports.sub = void 0;
exports.subtract = subtract;
exports.transformMat3 = transformMat3;
exports.transformMat4 = transformMat4;
exports.transformQuat = transformQuat;
exports.zero = zero;
var glMatrix = _interopRequireWildcard(require("./common.js"));
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
/**
 * 3 Dimensional Vector
 * @module vec3
 */

/**
 * Creates a new, empty vec3
 *
 * @returns {vec3} a new 3D vector
 */
function create() {
  var out = new glMatrix.ARRAY_TYPE(3);
  if (glMatrix.ARRAY_TYPE != Float32Array) {
    out[0] = 0;
    out[1] = 0;
    out[2] = 0;
  }
  return out;
}

/**
 * Creates a new vec3 initialized with values from an existing vector
 *
 * @param {ReadonlyVec3} a vector to clone
 * @returns {vec3} a new 3D vector
 */
function clone(a) {
  var out = new glMatrix.ARRAY_TYPE(3);
  out[0] = a[0];
  out[1] = a[1];
  out[2] = a[2];
  return out;
}

/**
 * Calculates the length of a vec3
 *
 * @param {ReadonlyVec3} a vector to calculate length of
 * @returns {Number} length of a
 */
function length(a) {
  var x = a[0];
  var y = a[1];
  var z = a[2];
  return Math.sqrt(x * x + y * y + z * z);
}

/**
 * Creates a new vec3 initialized with the given values
 *
 * @param {Number} x X component
 * @param {Number} y Y component
 * @param {Number} z Z component
 * @returns {vec3} a new 3D vector
 */
function fromValues(x, y, z) {
  var out = new glMatrix.ARRAY_TYPE(3);
  out[0] = x;
  out[1] = y;
  out[2] = z;
  return out;
}

/**
 * Copy the values from one vec3 to another
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a the source vector
 * @returns {vec3} out
 */
function copy(out, a) {
  out[0] = a[0];
  out[1] = a[1];
  out[2] = a[2];
  return out;
}

/**
 * Set the components of a vec3 to the given values
 *
 * @param {vec3} out the receiving vector
 * @param {Number} x X component
 * @param {Number} y Y component
 * @param {Number} z Z component
 * @returns {vec3} out
 */
function set(out, x, y, z) {
  out[0] = x;
  out[1] = y;
  out[2] = z;
  return out;
}

/**
 * Adds two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a the first operand
 * @param {ReadonlyVec3} b the second operand
 * @returns {vec3} out
 */
function add(out, a, b) {
  out[0] = a[0] + b[0];
  out[1] = a[1] + b[1];
  out[2] = a[2] + b[2];
  return out;
}

/**
 * Subtracts vector b from vector a
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a the first operand
 * @param {ReadonlyVec3} b the second operand
 * @returns {vec3} out
 */
function subtract(out, a, b) {
  out[0] = a[0] - b[0];
  out[1] = a[1] - b[1];
  out[2] = a[2] - b[2];
  return out;
}

/**
 * Multiplies two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a the first operand
 * @param {ReadonlyVec3} b the second operand
 * @returns {vec3} out
 */
function multiply(out, a, b) {
  out[0] = a[0] * b[0];
  out[1] = a[1] * b[1];
  out[2] = a[2] * b[2];
  return out;
}

/**
 * Divides two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a the first operand
 * @param {ReadonlyVec3} b the second operand
 * @returns {vec3} out
 */
function divide(out, a, b) {
  out[0] = a[0] / b[0];
  out[1] = a[1] / b[1];
  out[2] = a[2] / b[2];
  return out;
}

/**
 * Math.ceil the components of a vec3
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a vector to ceil
 * @returns {vec3} out
 */
function ceil(out, a) {
  out[0] = Math.ceil(a[0]);
  out[1] = Math.ceil(a[1]);
  out[2] = Math.ceil(a[2]);
  return out;
}

/**
 * Math.floor the components of a vec3
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a vector to floor
 * @returns {vec3} out
 */
function floor(out, a) {
  out[0] = Math.floor(a[0]);
  out[1] = Math.floor(a[1]);
  out[2] = Math.floor(a[2]);
  return out;
}

/**
 * Returns the minimum of two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a the first operand
 * @param {ReadonlyVec3} b the second operand
 * @returns {vec3} out
 */
function min(out, a, b) {
  out[0] = Math.min(a[0], b[0]);
  out[1] = Math.min(a[1], b[1]);
  out[2] = Math.min(a[2], b[2]);
  return out;
}

/**
 * Returns the maximum of two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a the first operand
 * @param {ReadonlyVec3} b the second operand
 * @returns {vec3} out
 */
function max(out, a, b) {
  out[0] = Math.max(a[0], b[0]);
  out[1] = Math.max(a[1], b[1]);
  out[2] = Math.max(a[2], b[2]);
  return out;
}

/**
 * symmetric round the components of a vec3
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a vector to round
 * @returns {vec3} out
 */
function round(out, a) {
  out[0] = glMatrix.round(a[0]);
  out[1] = glMatrix.round(a[1]);
  out[2] = glMatrix.round(a[2]);
  return out;
}

/**
 * Scales a vec3 by a scalar number
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a the vector to scale
 * @param {Number} b amount to scale the vector by
 * @returns {vec3} out
 */
function scale(out, a, b) {
  out[0] = a[0] * b;
  out[1] = a[1] * b;
  out[2] = a[2] * b;
  return out;
}

/**
 * Adds two vec3's after scaling the second operand by a scalar value
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a the first operand
 * @param {ReadonlyVec3} b the second operand
 * @param {Number} scale the amount to scale b by before adding
 * @returns {vec3} out
 */
function scaleAndAdd(out, a, b, scale) {
  out[0] = a[0] + b[0] * scale;
  out[1] = a[1] + b[1] * scale;
  out[2] = a[2] + b[2] * scale;
  return out;
}

/**
 * Calculates the euclidian distance between two vec3's
 *
 * @param {ReadonlyVec3} a the first operand
 * @param {ReadonlyVec3} b the second operand
 * @returns {Number} distance between a and b
 */
function distance(a, b) {
  var x = b[0] - a[0];
  var y = b[1] - a[1];
  var z = b[2] - a[2];
  return Math.sqrt(x * x + y * y + z * z);
}

/**
 * Calculates the squared euclidian distance between two vec3's
 *
 * @param {ReadonlyVec3} a the first operand
 * @param {ReadonlyVec3} b the second operand
 * @returns {Number} squared distance between a and b
 */
function squaredDistance(a, b) {
  var x = b[0] - a[0];
  var y = b[1] - a[1];
  var z = b[2] - a[2];
  return x * x + y * y + z * z;
}

/**
 * Calculates the squared length of a vec3
 *
 * @param {ReadonlyVec3} a vector to calculate squared length of
 * @returns {Number} squared length of a
 */
function squaredLength(a) {
  var x = a[0];
  var y = a[1];
  var z = a[2];
  return x * x + y * y + z * z;
}

/**
 * Negates the components of a vec3
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a vector to negate
 * @returns {vec3} out
 */
function negate(out, a) {
  out[0] = -a[0];
  out[1] = -a[1];
  out[2] = -a[2];
  return out;
}

/**
 * Returns the inverse of the components of a vec3
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a vector to invert
 * @returns {vec3} out
 */
function inverse(out, a) {
  out[0] = 1.0 / a[0];
  out[1] = 1.0 / a[1];
  out[2] = 1.0 / a[2];
  return out;
}

/**
 * Normalize a vec3
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a vector to normalize
 * @returns {vec3} out
 */
function normalize(out, a) {
  var x = a[0];
  var y = a[1];
  var z = a[2];
  var len = x * x + y * y + z * z;
  if (len > 0) {
    //TODO: evaluate use of glm_invsqrt here?
    len = 1 / Math.sqrt(len);
  }
  out[0] = a[0] * len;
  out[1] = a[1] * len;
  out[2] = a[2] * len;
  return out;
}

/**
 * Calculates the dot product of two vec3's
 *
 * @param {ReadonlyVec3} a the first operand
 * @param {ReadonlyVec3} b the second operand
 * @returns {Number} dot product of a and b
 */
function dot(a, b) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

/**
 * Computes the cross product of two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a the first operand
 * @param {ReadonlyVec3} b the second operand
 * @returns {vec3} out
 */
function cross(out, a, b) {
  var ax = a[0],
    ay = a[1],
    az = a[2];
  var bx = b[0],
    by = b[1],
    bz = b[2];
  out[0] = ay * bz - az * by;
  out[1] = az * bx - ax * bz;
  out[2] = ax * by - ay * bx;
  return out;
}

/**
 * Performs a linear interpolation between two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a the first operand
 * @param {ReadonlyVec3} b the second operand
 * @param {Number} t interpolation amount, in the range [0-1], between the two inputs
 * @returns {vec3} out
 */
function lerp(out, a, b, t) {
  var ax = a[0];
  var ay = a[1];
  var az = a[2];
  out[0] = ax + t * (b[0] - ax);
  out[1] = ay + t * (b[1] - ay);
  out[2] = az + t * (b[2] - az);
  return out;
}

/**
 * Performs a spherical linear interpolation between two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a the first operand
 * @param {ReadonlyVec3} b the second operand
 * @param {Number} t interpolation amount, in the range [0-1], between the two inputs
 * @returns {vec3} out
 */
function slerp(out, a, b, t) {
  var angle = Math.acos(Math.min(Math.max(dot(a, b), -1), 1));
  var sinTotal = Math.sin(angle);
  var ratioA = Math.sin((1 - t) * angle) / sinTotal;
  var ratioB = Math.sin(t * angle) / sinTotal;
  out[0] = ratioA * a[0] + ratioB * b[0];
  out[1] = ratioA * a[1] + ratioB * b[1];
  out[2] = ratioA * a[2] + ratioB * b[2];
  return out;
}

/**
 * Performs a hermite interpolation with two control points
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a the first operand
 * @param {ReadonlyVec3} b the second operand
 * @param {ReadonlyVec3} c the third operand
 * @param {ReadonlyVec3} d the fourth operand
 * @param {Number} t interpolation amount, in the range [0-1], between the two inputs
 * @returns {vec3} out
 */
function hermite(out, a, b, c, d, t) {
  var factorTimes2 = t * t;
  var factor1 = factorTimes2 * (2 * t - 3) + 1;
  var factor2 = factorTimes2 * (t - 2) + t;
  var factor3 = factorTimes2 * (t - 1);
  var factor4 = factorTimes2 * (3 - 2 * t);
  out[0] = a[0] * factor1 + b[0] * factor2 + c[0] * factor3 + d[0] * factor4;
  out[1] = a[1] * factor1 + b[1] * factor2 + c[1] * factor3 + d[1] * factor4;
  out[2] = a[2] * factor1 + b[2] * factor2 + c[2] * factor3 + d[2] * factor4;
  return out;
}

/**
 * Performs a bezier interpolation with two control points
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a the first operand
 * @param {ReadonlyVec3} b the second operand
 * @param {ReadonlyVec3} c the third operand
 * @param {ReadonlyVec3} d the fourth operand
 * @param {Number} t interpolation amount, in the range [0-1], between the two inputs
 * @returns {vec3} out
 */
function bezier(out, a, b, c, d, t) {
  var inverseFactor = 1 - t;
  var inverseFactorTimesTwo = inverseFactor * inverseFactor;
  var factorTimes2 = t * t;
  var factor1 = inverseFactorTimesTwo * inverseFactor;
  var factor2 = 3 * t * inverseFactorTimesTwo;
  var factor3 = 3 * factorTimes2 * inverseFactor;
  var factor4 = factorTimes2 * t;
  out[0] = a[0] * factor1 + b[0] * factor2 + c[0] * factor3 + d[0] * factor4;
  out[1] = a[1] * factor1 + b[1] * factor2 + c[1] * factor3 + d[1] * factor4;
  out[2] = a[2] * factor1 + b[2] * factor2 + c[2] * factor3 + d[2] * factor4;
  return out;
}

/**
 * Generates a random vector with the given scale
 *
 * @param {vec3} out the receiving vector
 * @param {Number} [scale] Length of the resulting vector. If omitted, a unit vector will be returned
 * @returns {vec3} out
 */
function random(out, scale) {
  scale = scale === undefined ? 1.0 : scale;
  var r = glMatrix.RANDOM() * 2.0 * Math.PI;
  var z = glMatrix.RANDOM() * 2.0 - 1.0;
  var zScale = Math.sqrt(1.0 - z * z) * scale;
  out[0] = Math.cos(r) * zScale;
  out[1] = Math.sin(r) * zScale;
  out[2] = z * scale;
  return out;
}

/**
 * Transforms the vec3 with a mat4.
 * 4th vector component is implicitly '1'
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a the vector to transform
 * @param {ReadonlyMat4} m matrix to transform with
 * @returns {vec3} out
 */
function transformMat4(out, a, m) {
  var x = a[0],
    y = a[1],
    z = a[2];
  var w = m[3] * x + m[7] * y + m[11] * z + m[15];
  w = w || 1.0;
  out[0] = (m[0] * x + m[4] * y + m[8] * z + m[12]) / w;
  out[1] = (m[1] * x + m[5] * y + m[9] * z + m[13]) / w;
  out[2] = (m[2] * x + m[6] * y + m[10] * z + m[14]) / w;
  return out;
}

/**
 * Transforms the vec3 with a mat3.
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a the vector to transform
 * @param {ReadonlyMat3} m the 3x3 matrix to transform with
 * @returns {vec3} out
 */
function transformMat3(out, a, m) {
  var x = a[0],
    y = a[1],
    z = a[2];
  out[0] = x * m[0] + y * m[3] + z * m[6];
  out[1] = x * m[1] + y * m[4] + z * m[7];
  out[2] = x * m[2] + y * m[5] + z * m[8];
  return out;
}

/**
 * Transforms the vec3 with a quat
 * Can also be used for dual quaternions. (Multiply it with the real part)
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a the vector to transform
 * @param {ReadonlyQuat} q normalized quaternion to transform with
 * @returns {vec3} out
 */
function transformQuat(out, a, q) {
  // Fast Vector Rotation using Quaternions by Robert Eisele
  // https://raw.org/proof/vector-rotation-using-quaternions/

  var qx = q[0],
    qy = q[1],
    qz = q[2],
    qw = q[3];
  var vx = a[0],
    vy = a[1],
    vz = a[2];

  // t = q x v
  var tx = qy * vz - qz * vy;
  var ty = qz * vx - qx * vz;
  var tz = qx * vy - qy * vx;

  // t = 2t
  tx = tx + tx;
  ty = ty + ty;
  tz = tz + tz;

  // v + w t + q x t
  out[0] = vx + qw * tx + qy * tz - qz * ty;
  out[1] = vy + qw * ty + qz * tx - qx * tz;
  out[2] = vz + qw * tz + qx * ty - qy * tx;
  return out;
}

/**
 * Rotate a 3D vector around the x-axis
 * @param {vec3} out The receiving vec3
 * @param {ReadonlyVec3} a The vec3 point to rotate
 * @param {ReadonlyVec3} b The origin of the rotation
 * @param {Number} rad The angle of rotation in radians
 * @returns {vec3} out
 */
function rotateX(out, a, b, rad) {
  var p = [],
    r = [];
  //Translate point to the origin
  p[0] = a[0] - b[0];
  p[1] = a[1] - b[1];
  p[2] = a[2] - b[2];

  //perform rotation
  r[0] = p[0];
  r[1] = p[1] * Math.cos(rad) - p[2] * Math.sin(rad);
  r[2] = p[1] * Math.sin(rad) + p[2] * Math.cos(rad);

  //translate to correct position
  out[0] = r[0] + b[0];
  out[1] = r[1] + b[1];
  out[2] = r[2] + b[2];
  return out;
}

/**
 * Rotate a 3D vector around the y-axis
 * @param {vec3} out The receiving vec3
 * @param {ReadonlyVec3} a The vec3 point to rotate
 * @param {ReadonlyVec3} b The origin of the rotation
 * @param {Number} rad The angle of rotation in radians
 * @returns {vec3} out
 */
function rotateY(out, a, b, rad) {
  var p = [],
    r = [];
  //Translate point to the origin
  p[0] = a[0] - b[0];
  p[1] = a[1] - b[1];
  p[2] = a[2] - b[2];

  //perform rotation
  r[0] = p[2] * Math.sin(rad) + p[0] * Math.cos(rad);
  r[1] = p[1];
  r[2] = p[2] * Math.cos(rad) - p[0] * Math.sin(rad);

  //translate to correct position
  out[0] = r[0] + b[0];
  out[1] = r[1] + b[1];
  out[2] = r[2] + b[2];
  return out;
}

/**
 * Rotate a 3D vector around the z-axis
 * @param {vec3} out The receiving vec3
 * @param {ReadonlyVec3} a The vec3 point to rotate
 * @param {ReadonlyVec3} b The origin of the rotation
 * @param {Number} rad The angle of rotation in radians
 * @returns {vec3} out
 */
function rotateZ(out, a, b, rad) {
  var p = [],
    r = [];
  //Translate point to the origin
  p[0] = a[0] - b[0];
  p[1] = a[1] - b[1];
  p[2] = a[2] - b[2];

  //perform rotation
  r[0] = p[0] * Math.cos(rad) - p[1] * Math.sin(rad);
  r[1] = p[0] * Math.sin(rad) + p[1] * Math.cos(rad);
  r[2] = p[2];

  //translate to correct position
  out[0] = r[0] + b[0];
  out[1] = r[1] + b[1];
  out[2] = r[2] + b[2];
  return out;
}

/**
 * Get the angle between two 3D vectors
 * @param {ReadonlyVec3} a The first operand
 * @param {ReadonlyVec3} b The second operand
 * @returns {Number} The angle in radians
 */
function angle(a, b) {
  var ax = a[0],
    ay = a[1],
    az = a[2],
    bx = b[0],
    by = b[1],
    bz = b[2],
    mag = Math.sqrt((ax * ax + ay * ay + az * az) * (bx * bx + by * by + bz * bz)),
    cosine = mag && dot(a, b) / mag;
  return Math.acos(Math.min(Math.max(cosine, -1), 1));
}

/**
 * Set the components of a vec3 to zero
 *
 * @param {vec3} out the receiving vector
 * @returns {vec3} out
 */
function zero(out) {
  out[0] = 0.0;
  out[1] = 0.0;
  out[2] = 0.0;
  return out;
}

/**
 * Returns a string representation of a vector
 *
 * @param {ReadonlyVec3} a vector to represent as a string
 * @returns {String} string representation of the vector
 */
function str(a) {
  return "vec3(" + a[0] + ", " + a[1] + ", " + a[2] + ")";
}

/**
 * Returns whether or not the vectors have exactly the same elements in the same position (when compared with ===)
 *
 * @param {ReadonlyVec3} a The first vector.
 * @param {ReadonlyVec3} b The second vector.
 * @returns {Boolean} True if the vectors are equal, false otherwise.
 */
function exactEquals(a, b) {
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
}

/**
 * Returns whether or not the vectors have approximately the same elements in the same position.
 *
 * @param {ReadonlyVec3} a The first vector.
 * @param {ReadonlyVec3} b The second vector.
 * @returns {Boolean} True if the vectors are equal, false otherwise.
 */
function equals(a, b) {
  var a0 = a[0],
    a1 = a[1],
    a2 = a[2];
  var b0 = b[0],
    b1 = b[1],
    b2 = b[2];
  return Math.abs(a0 - b0) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a0), Math.abs(b0)) && Math.abs(a1 - b1) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a1), Math.abs(b1)) && Math.abs(a2 - b2) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a2), Math.abs(b2));
}

/**
 * Alias for {@link vec3.subtract}
 * @function
 */
var sub = exports.sub = subtract;

/**
 * Alias for {@link vec3.multiply}
 * @function
 */
var mul = exports.mul = multiply;

/**
 * Alias for {@link vec3.divide}
 * @function
 */
var div = exports.div = divide;

/**
 * Alias for {@link vec3.distance}
 * @function
 */
var dist = exports.dist = distance;

/**
 * Alias for {@link vec3.squaredDistance}
 * @function
 */
var sqrDist = exports.sqrDist = squaredDistance;

/**
 * Alias for {@link vec3.length}
 * @function
 */
var len = exports.len = length;

/**
 * Alias for {@link vec3.squaredLength}
 * @function
 */
var sqrLen = exports.sqrLen = squaredLength;

/**
 * Perform some operation over an array of vec3s.
 *
 * @param {Array} a the array of vectors to iterate over
 * @param {Number} stride Number of elements between the start of each vec3. If 0 assumes tightly packed
 * @param {Number} offset Number of elements to skip at the beginning of the array
 * @param {Number} count Number of vec3s to iterate over. If 0 iterates over entire array
 * @param {Function} fn Function to call for each vector in the array
 * @param {Object} [arg] additional argument to pass to fn
 * @returns {Array} a
 * @function
 */
var forEach = exports.forEach = function () {
  var vec = create();
  return function (a, stride, offset, count, fn, arg) {
    var i, l;
    if (!stride) {
      stride = 3;
    }
    if (!offset) {
      offset = 0;
    }
    if (count) {
      l = Math.min(count * stride + offset, a.length);
    } else {
      l = a.length;
    }
    for (i = offset; i < l; i += stride) {
      vec[0] = a[i];
      vec[1] = a[i + 1];
      vec[2] = a[i + 2];
      fn(vec, vec, arg);
      a[i] = vec[0];
      a[i + 1] = vec[1];
      a[i + 2] = vec[2];
    }
    return a;
  };
}();

},{"./common.js":4}],14:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.add = add;
exports.ceil = ceil;
exports.clone = clone;
exports.copy = copy;
exports.create = create;
exports.cross = cross;
exports.dist = void 0;
exports.distance = distance;
exports.div = void 0;
exports.divide = divide;
exports.dot = dot;
exports.equals = equals;
exports.exactEquals = exactEquals;
exports.floor = floor;
exports.forEach = void 0;
exports.fromValues = fromValues;
exports.inverse = inverse;
exports.len = void 0;
exports.length = length;
exports.lerp = lerp;
exports.max = max;
exports.min = min;
exports.mul = void 0;
exports.multiply = multiply;
exports.negate = negate;
exports.normalize = normalize;
exports.random = random;
exports.round = round;
exports.scale = scale;
exports.scaleAndAdd = scaleAndAdd;
exports.set = set;
exports.sqrLen = exports.sqrDist = void 0;
exports.squaredDistance = squaredDistance;
exports.squaredLength = squaredLength;
exports.str = str;
exports.sub = void 0;
exports.subtract = subtract;
exports.transformMat4 = transformMat4;
exports.transformQuat = transformQuat;
exports.zero = zero;
var glMatrix = _interopRequireWildcard(require("./common.js"));
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
/**
 * 4 Dimensional Vector
 * @module vec4
 */

/**
 * Creates a new, empty vec4
 *
 * @returns {vec4} a new 4D vector
 */
function create() {
  var out = new glMatrix.ARRAY_TYPE(4);
  if (glMatrix.ARRAY_TYPE != Float32Array) {
    out[0] = 0;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
  }
  return out;
}

/**
 * Creates a new vec4 initialized with values from an existing vector
 *
 * @param {ReadonlyVec4} a vector to clone
 * @returns {vec4} a new 4D vector
 */
function clone(a) {
  var out = new glMatrix.ARRAY_TYPE(4);
  out[0] = a[0];
  out[1] = a[1];
  out[2] = a[2];
  out[3] = a[3];
  return out;
}

/**
 * Creates a new vec4 initialized with the given values
 *
 * @param {Number} x X component
 * @param {Number} y Y component
 * @param {Number} z Z component
 * @param {Number} w W component
 * @returns {vec4} a new 4D vector
 */
function fromValues(x, y, z, w) {
  var out = new glMatrix.ARRAY_TYPE(4);
  out[0] = x;
  out[1] = y;
  out[2] = z;
  out[3] = w;
  return out;
}

/**
 * Copy the values from one vec4 to another
 *
 * @param {vec4} out the receiving vector
 * @param {ReadonlyVec4} a the source vector
 * @returns {vec4} out
 */
function copy(out, a) {
  out[0] = a[0];
  out[1] = a[1];
  out[2] = a[2];
  out[3] = a[3];
  return out;
}

/**
 * Set the components of a vec4 to the given values
 *
 * @param {vec4} out the receiving vector
 * @param {Number} x X component
 * @param {Number} y Y component
 * @param {Number} z Z component
 * @param {Number} w W component
 * @returns {vec4} out
 */
function set(out, x, y, z, w) {
  out[0] = x;
  out[1] = y;
  out[2] = z;
  out[3] = w;
  return out;
}

/**
 * Adds two vec4's
 *
 * @param {vec4} out the receiving vector
 * @param {ReadonlyVec4} a the first operand
 * @param {ReadonlyVec4} b the second operand
 * @returns {vec4} out
 */
function add(out, a, b) {
  out[0] = a[0] + b[0];
  out[1] = a[1] + b[1];
  out[2] = a[2] + b[2];
  out[3] = a[3] + b[3];
  return out;
}

/**
 * Subtracts vector b from vector a
 *
 * @param {vec4} out the receiving vector
 * @param {ReadonlyVec4} a the first operand
 * @param {ReadonlyVec4} b the second operand
 * @returns {vec4} out
 */
function subtract(out, a, b) {
  out[0] = a[0] - b[0];
  out[1] = a[1] - b[1];
  out[2] = a[2] - b[2];
  out[3] = a[3] - b[3];
  return out;
}

/**
 * Multiplies two vec4's
 *
 * @param {vec4} out the receiving vector
 * @param {ReadonlyVec4} a the first operand
 * @param {ReadonlyVec4} b the second operand
 * @returns {vec4} out
 */
function multiply(out, a, b) {
  out[0] = a[0] * b[0];
  out[1] = a[1] * b[1];
  out[2] = a[2] * b[2];
  out[3] = a[3] * b[3];
  return out;
}

/**
 * Divides two vec4's
 *
 * @param {vec4} out the receiving vector
 * @param {ReadonlyVec4} a the first operand
 * @param {ReadonlyVec4} b the second operand
 * @returns {vec4} out
 */
function divide(out, a, b) {
  out[0] = a[0] / b[0];
  out[1] = a[1] / b[1];
  out[2] = a[2] / b[2];
  out[3] = a[3] / b[3];
  return out;
}

/**
 * Math.ceil the components of a vec4
 *
 * @param {vec4} out the receiving vector
 * @param {ReadonlyVec4} a vector to ceil
 * @returns {vec4} out
 */
function ceil(out, a) {
  out[0] = Math.ceil(a[0]);
  out[1] = Math.ceil(a[1]);
  out[2] = Math.ceil(a[2]);
  out[3] = Math.ceil(a[3]);
  return out;
}

/**
 * Math.floor the components of a vec4
 *
 * @param {vec4} out the receiving vector
 * @param {ReadonlyVec4} a vector to floor
 * @returns {vec4} out
 */
function floor(out, a) {
  out[0] = Math.floor(a[0]);
  out[1] = Math.floor(a[1]);
  out[2] = Math.floor(a[2]);
  out[3] = Math.floor(a[3]);
  return out;
}

/**
 * Returns the minimum of two vec4's
 *
 * @param {vec4} out the receiving vector
 * @param {ReadonlyVec4} a the first operand
 * @param {ReadonlyVec4} b the second operand
 * @returns {vec4} out
 */
function min(out, a, b) {
  out[0] = Math.min(a[0], b[0]);
  out[1] = Math.min(a[1], b[1]);
  out[2] = Math.min(a[2], b[2]);
  out[3] = Math.min(a[3], b[3]);
  return out;
}

/**
 * Returns the maximum of two vec4's
 *
 * @param {vec4} out the receiving vector
 * @param {ReadonlyVec4} a the first operand
 * @param {ReadonlyVec4} b the second operand
 * @returns {vec4} out
 */
function max(out, a, b) {
  out[0] = Math.max(a[0], b[0]);
  out[1] = Math.max(a[1], b[1]);
  out[2] = Math.max(a[2], b[2]);
  out[3] = Math.max(a[3], b[3]);
  return out;
}

/**
 * symmetric round the components of a vec4
 *
 * @param {vec4} out the receiving vector
 * @param {ReadonlyVec4} a vector to round
 * @returns {vec4} out
 */
function round(out, a) {
  out[0] = glMatrix.round(a[0]);
  out[1] = glMatrix.round(a[1]);
  out[2] = glMatrix.round(a[2]);
  out[3] = glMatrix.round(a[3]);
  return out;
}

/**
 * Scales a vec4 by a scalar number
 *
 * @param {vec4} out the receiving vector
 * @param {ReadonlyVec4} a the vector to scale
 * @param {Number} b amount to scale the vector by
 * @returns {vec4} out
 */
function scale(out, a, b) {
  out[0] = a[0] * b;
  out[1] = a[1] * b;
  out[2] = a[2] * b;
  out[3] = a[3] * b;
  return out;
}

/**
 * Adds two vec4's after scaling the second operand by a scalar value
 *
 * @param {vec4} out the receiving vector
 * @param {ReadonlyVec4} a the first operand
 * @param {ReadonlyVec4} b the second operand
 * @param {Number} scale the amount to scale b by before adding
 * @returns {vec4} out
 */
function scaleAndAdd(out, a, b, scale) {
  out[0] = a[0] + b[0] * scale;
  out[1] = a[1] + b[1] * scale;
  out[2] = a[2] + b[2] * scale;
  out[3] = a[3] + b[3] * scale;
  return out;
}

/**
 * Calculates the euclidian distance between two vec4's
 *
 * @param {ReadonlyVec4} a the first operand
 * @param {ReadonlyVec4} b the second operand
 * @returns {Number} distance between a and b
 */
function distance(a, b) {
  var x = b[0] - a[0];
  var y = b[1] - a[1];
  var z = b[2] - a[2];
  var w = b[3] - a[3];
  return Math.sqrt(x * x + y * y + z * z + w * w);
}

/**
 * Calculates the squared euclidian distance between two vec4's
 *
 * @param {ReadonlyVec4} a the first operand
 * @param {ReadonlyVec4} b the second operand
 * @returns {Number} squared distance between a and b
 */
function squaredDistance(a, b) {
  var x = b[0] - a[0];
  var y = b[1] - a[1];
  var z = b[2] - a[2];
  var w = b[3] - a[3];
  return x * x + y * y + z * z + w * w;
}

/**
 * Calculates the length of a vec4
 *
 * @param {ReadonlyVec4} a vector to calculate length of
 * @returns {Number} length of a
 */
function length(a) {
  var x = a[0];
  var y = a[1];
  var z = a[2];
  var w = a[3];
  return Math.sqrt(x * x + y * y + z * z + w * w);
}

/**
 * Calculates the squared length of a vec4
 *
 * @param {ReadonlyVec4} a vector to calculate squared length of
 * @returns {Number} squared length of a
 */
function squaredLength(a) {
  var x = a[0];
  var y = a[1];
  var z = a[2];
  var w = a[3];
  return x * x + y * y + z * z + w * w;
}

/**
 * Negates the components of a vec4
 *
 * @param {vec4} out the receiving vector
 * @param {ReadonlyVec4} a vector to negate
 * @returns {vec4} out
 */
function negate(out, a) {
  out[0] = -a[0];
  out[1] = -a[1];
  out[2] = -a[2];
  out[3] = -a[3];
  return out;
}

/**
 * Returns the inverse of the components of a vec4
 *
 * @param {vec4} out the receiving vector
 * @param {ReadonlyVec4} a vector to invert
 * @returns {vec4} out
 */
function inverse(out, a) {
  out[0] = 1.0 / a[0];
  out[1] = 1.0 / a[1];
  out[2] = 1.0 / a[2];
  out[3] = 1.0 / a[3];
  return out;
}

/**
 * Normalize a vec4
 *
 * @param {vec4} out the receiving vector
 * @param {ReadonlyVec4} a vector to normalize
 * @returns {vec4} out
 */
function normalize(out, a) {
  var x = a[0];
  var y = a[1];
  var z = a[2];
  var w = a[3];
  var len = x * x + y * y + z * z + w * w;
  if (len > 0) {
    len = 1 / Math.sqrt(len);
  }
  out[0] = x * len;
  out[1] = y * len;
  out[2] = z * len;
  out[3] = w * len;
  return out;
}

/**
 * Calculates the dot product of two vec4's
 *
 * @param {ReadonlyVec4} a the first operand
 * @param {ReadonlyVec4} b the second operand
 * @returns {Number} dot product of a and b
 */
function dot(a, b) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];
}

/**
 * Returns the cross-product of three vectors in a 4-dimensional space
 *
 * @param {ReadonlyVec4} out the receiving vector
 * @param {ReadonlyVec4} u the first vector
 * @param {ReadonlyVec4} v the second vector
 * @param {ReadonlyVec4} w the third vector
 * @returns {vec4} result
 */
function cross(out, u, v, w) {
  var A = v[0] * w[1] - v[1] * w[0],
    B = v[0] * w[2] - v[2] * w[0],
    C = v[0] * w[3] - v[3] * w[0],
    D = v[1] * w[2] - v[2] * w[1],
    E = v[1] * w[3] - v[3] * w[1],
    F = v[2] * w[3] - v[3] * w[2];
  var G = u[0];
  var H = u[1];
  var I = u[2];
  var J = u[3];
  out[0] = H * F - I * E + J * D;
  out[1] = -(G * F) + I * C - J * B;
  out[2] = G * E - H * C + J * A;
  out[3] = -(G * D) + H * B - I * A;
  return out;
}

/**
 * Performs a linear interpolation between two vec4's
 *
 * @param {vec4} out the receiving vector
 * @param {ReadonlyVec4} a the first operand
 * @param {ReadonlyVec4} b the second operand
 * @param {Number} t interpolation amount, in the range [0-1], between the two inputs
 * @returns {vec4} out
 */
function lerp(out, a, b, t) {
  var ax = a[0];
  var ay = a[1];
  var az = a[2];
  var aw = a[3];
  out[0] = ax + t * (b[0] - ax);
  out[1] = ay + t * (b[1] - ay);
  out[2] = az + t * (b[2] - az);
  out[3] = aw + t * (b[3] - aw);
  return out;
}

/**
 * Generates a random vector with the given scale
 *
 * @param {vec4} out the receiving vector
 * @param {Number} [scale] Length of the resulting vector. If omitted, a unit vector will be returned
 * @returns {vec4} out
 */
function random(out, scale) {
  scale = scale === undefined ? 1.0 : scale;

  // Marsaglia, George. Choosing a Point from the Surface of a
  // Sphere. Ann. Math. Statist. 43 (1972), no. 2, 645--646.
  // http://projecteuclid.org/euclid.aoms/1177692644;
  var v1, v2, v3, v4;
  var s1, s2;
  var rand;
  rand = glMatrix.RANDOM();
  v1 = rand * 2 - 1;
  v2 = (4 * glMatrix.RANDOM() - 2) * Math.sqrt(rand * -rand + rand);
  s1 = v1 * v1 + v2 * v2;
  rand = glMatrix.RANDOM();
  v3 = rand * 2 - 1;
  v4 = (4 * glMatrix.RANDOM() - 2) * Math.sqrt(rand * -rand + rand);
  s2 = v3 * v3 + v4 * v4;
  var d = Math.sqrt((1 - s1) / s2);
  out[0] = scale * v1;
  out[1] = scale * v2;
  out[2] = scale * v3 * d;
  out[3] = scale * v4 * d;
  return out;
}

/**
 * Transforms the vec4 with a mat4.
 *
 * @param {vec4} out the receiving vector
 * @param {ReadonlyVec4} a the vector to transform
 * @param {ReadonlyMat4} m matrix to transform with
 * @returns {vec4} out
 */
function transformMat4(out, a, m) {
  var x = a[0],
    y = a[1],
    z = a[2],
    w = a[3];
  out[0] = m[0] * x + m[4] * y + m[8] * z + m[12] * w;
  out[1] = m[1] * x + m[5] * y + m[9] * z + m[13] * w;
  out[2] = m[2] * x + m[6] * y + m[10] * z + m[14] * w;
  out[3] = m[3] * x + m[7] * y + m[11] * z + m[15] * w;
  return out;
}

/**
 * Transforms the vec4 with a quat
 *
 * @param {vec4} out the receiving vector
 * @param {ReadonlyVec4} a the vector to transform
 * @param {ReadonlyQuat} q normalized quaternion to transform with
 * @returns {vec4} out
 */
function transformQuat(out, a, q) {
  // Fast Vector Rotation using Quaternions by Robert Eisele
  // https://raw.org/proof/vector-rotation-using-quaternions/

  var qx = q[0],
    qy = q[1],
    qz = q[2],
    qw = q[3];
  var vx = a[0],
    vy = a[1],
    vz = a[2];

  // t = q x v
  var tx = qy * vz - qz * vy;
  var ty = qz * vx - qx * vz;
  var tz = qx * vy - qy * vx;

  // t = 2t
  tx = tx + tx;
  ty = ty + ty;
  tz = tz + tz;

  // v + w t + q x t
  out[0] = vx + qw * tx + qy * tz - qz * ty;
  out[1] = vy + qw * ty + qz * tx - qx * tz;
  out[2] = vz + qw * tz + qx * ty - qy * tx;
  out[3] = a[3];
  return out;
}

/**
 * Set the components of a vec4 to zero
 *
 * @param {vec4} out the receiving vector
 * @returns {vec4} out
 */
function zero(out) {
  out[0] = 0.0;
  out[1] = 0.0;
  out[2] = 0.0;
  out[3] = 0.0;
  return out;
}

/**
 * Returns a string representation of a vector
 *
 * @param {ReadonlyVec4} a vector to represent as a string
 * @returns {String} string representation of the vector
 */
function str(a) {
  return "vec4(" + a[0] + ", " + a[1] + ", " + a[2] + ", " + a[3] + ")";
}

/**
 * Returns whether or not the vectors have exactly the same elements in the same position (when compared with ===)
 *
 * @param {ReadonlyVec4} a The first vector.
 * @param {ReadonlyVec4} b The second vector.
 * @returns {Boolean} True if the vectors are equal, false otherwise.
 */
function exactEquals(a, b) {
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3];
}

/**
 * Returns whether or not the vectors have approximately the same elements in the same position.
 *
 * @param {ReadonlyVec4} a The first vector.
 * @param {ReadonlyVec4} b The second vector.
 * @returns {Boolean} True if the vectors are equal, false otherwise.
 */
function equals(a, b) {
  var a0 = a[0],
    a1 = a[1],
    a2 = a[2],
    a3 = a[3];
  var b0 = b[0],
    b1 = b[1],
    b2 = b[2],
    b3 = b[3];
  return Math.abs(a0 - b0) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a0), Math.abs(b0)) && Math.abs(a1 - b1) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a1), Math.abs(b1)) && Math.abs(a2 - b2) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a2), Math.abs(b2)) && Math.abs(a3 - b3) <= glMatrix.EPSILON * Math.max(1.0, Math.abs(a3), Math.abs(b3));
}

/**
 * Alias for {@link vec4.subtract}
 * @function
 */
var sub = exports.sub = subtract;

/**
 * Alias for {@link vec4.multiply}
 * @function
 */
var mul = exports.mul = multiply;

/**
 * Alias for {@link vec4.divide}
 * @function
 */
var div = exports.div = divide;

/**
 * Alias for {@link vec4.distance}
 * @function
 */
var dist = exports.dist = distance;

/**
 * Alias for {@link vec4.squaredDistance}
 * @function
 */
var sqrDist = exports.sqrDist = squaredDistance;

/**
 * Alias for {@link vec4.length}
 * @function
 */
var len = exports.len = length;

/**
 * Alias for {@link vec4.squaredLength}
 * @function
 */
var sqrLen = exports.sqrLen = squaredLength;

/**
 * Perform some operation over an array of vec4s.
 *
 * @param {Array} a the array of vectors to iterate over
 * @param {Number} stride Number of elements between the start of each vec4. If 0 assumes tightly packed
 * @param {Number} offset Number of elements to skip at the beginning of the array
 * @param {Number} count Number of vec4s to iterate over. If 0 iterates over entire array
 * @param {Function} fn Function to call for each vector in the array
 * @param {Object} [arg] additional argument to pass to fn
 * @returns {Array} a
 * @function
 */
var forEach = exports.forEach = function () {
  var vec = create();
  return function (a, stride, offset, count, fn, arg) {
    var i, l;
    if (!stride) {
      stride = 4;
    }
    if (!offset) {
      offset = 0;
    }
    if (count) {
      l = Math.min(count * stride + offset, a.length);
    } else {
      l = a.length;
    }
    for (i = offset; i < l; i += stride) {
      vec[0] = a[i];
      vec[1] = a[i + 1];
      vec[2] = a[i + 2];
      vec[3] = a[i + 3];
      fn(vec, vec, arg);
      a[i] = vec[0];
      a[i + 1] = vec[1];
      a[i + 2] = vec[2];
      a[i + 3] = vec[3];
    }
    return a;
  };
}();

},{"./common.js":4}],15:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.mat4 = exports.mat3 = void 0;
exports.setDefaultType = setDefaultType;
exports.vec4 = exports.vec3 = exports.vec2 = exports.utils = exports.types = void 0;
/* wgpu-matrix@1.0.0, license MIT */
var arrayLike = exports.types = /*#__PURE__*/Object.freeze({
  __proto__: null
});

/*
 * Copyright 2022 Gregg Tavares
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.  IN NO EVENT SHALL
 * THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 */
let EPSILON = 0.000001;
/**
 * Set the value for EPSILON for various checks
 * @param v - Value to use for EPSILON.
 * @returns previous value of EPSILON;
 */
function setEpsilon(v) {
  const old = EPSILON;
  EPSILON = v;
  return old;
}
/**
 * Convert degrees to radians
 * @param degrees - Angle in degrees
 * @returns angle converted to radians
 */
function degToRad(degrees) {
  return degrees * Math.PI / 180;
}
/**
 * Convert radians to degrees
 * @param radians - Angle in radians
 * @returns angle converted to degrees
 */
function radToDeg(radians) {
  return radians * 180 / Math.PI;
}
/**
 * Lerps between a and b via t
 * @param a - starting value
 * @param b - ending value
 * @param t - value where 0 = a and 1 = b
 * @returns a + (b - a) * t
 */
function lerp$3(a, b, t) {
  return a + (b - a) * t;
}
/**
 * Compute the opposite of lerp. Given a and b and a value between
 * a and b returns a value between 0 and 1. 0 if a, 1 if b.
 * Note: no clamping is done.
 * @param a - start value
 * @param b - end value
 * @param v - value between a and b
 * @returns (v - a) / (b - a)
 */
function inverseLerp(a, b, v) {
  const d = b - a;
  return Math.abs(b - a) < EPSILON ? a : (v - a) / d;
}
/**
 * Compute the euclidean modulo
 *
 * ```
 * // table for n / 3
 * -5, -4, -3, -2, -1,  0,  1,  2,  3,  4,  5   <- n
 * ------------------------------------
 * -2  -1  -0  -2  -1   0,  1,  2,  0,  1,  2   <- n % 3
 *  1   2   0   1   2   0,  1,  2,  0,  1,  2   <- euclideanModule(n, 3)
 * ```
 *
 * @param n - dividend
 * @param m - divisor
 * @returns the euclidean modulo of n / m
 */
function euclideanModulo(n, m) {
  return (n % m + m) % m;
}
var utils = exports.utils = /*#__PURE__*/Object.freeze({
  __proto__: null,
  get EPSILON() {
    return EPSILON;
  },
  setEpsilon: setEpsilon,
  degToRad: degToRad,
  radToDeg: radToDeg,
  lerp: lerp$3,
  inverseLerp: inverseLerp,
  euclideanModulo: euclideanModulo
});

/**
 *
 * Vec2 math functions.
 *
 * Almost all functions take an optional `dst` argument. If it is not passed in the
 * functions will create a new Vec2. In other words you can do this
 *
 *     const v = vec2.cross(v1, v2);  // Creates a new Vec2 with the cross product of v1 x v2.
 *
 * or
 *
 *     const v = vec2.create();
 *     vec2.cross(v1, v2, v);  // Puts the cross product of v1 x v2 in v
 *
 * The first style is often easier but depending on where it's used it generates garbage where
 * as there is almost never allocation with the second style.
 *
 * It is always safe to pass any vector as the destination. So for example
 *
 *     vec2.cross(v1, v2, v1);  // Puts the cross product of v1 x v2 in v1
 *
 */
let VecType$2 = Float32Array;
/**
 * Sets the type this library creates for a Vec2
 * @param ctor - the constructor for the type. Either `Float32Array`, 'Float64Array', or `Array`
 * @returns previous constructor for Vec2
 */
function setDefaultType$5(ctor) {
  const oldType = VecType$2;
  VecType$2 = ctor;
  return oldType;
}
/**
 * Creates a Vec2; may be called with x, y, z to set initial values.
 *
 * Note: Since passing in a raw JavaScript array
 * is valid in all circumstances, if you want to
 * force a JavaScript array into a Vec2's specified type
 * it would be faster to use
 *
 * ```
 * const v = vec2.clone(someJSArray);
 * ```
 *
 * Note: a consequence of the implementation is if your Vec2Type = `Array`
 * instead of `Float32Array` or `Float64Array` then any values you
 * don't pass in will be undefined. Usually this is not an issue since
 * (a) using `Array` is rare and (b) using `vec2.create` is usually used
 * to create a Vec2 to be filled out as in
 *
 * ```
 * const sum = vec2.create();
 * vec2.add(v1, v2, sum);
 * ```
 *
 * @param x - Initial x value.
 * @param y - Initial y value.
 * @returns the created vector
 */
function create$4(x = 0, y = 0) {
  const dst = new VecType$2(2);
  if (x !== undefined) {
    dst[0] = x;
    if (y !== undefined) {
      dst[1] = y;
    }
  }
  return dst;
}

/*
 * Copyright 2022 Gregg Tavares
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.  IN NO EVENT SHALL
 * THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 */
/**
 * Creates a Vec2; may be called with x, y, z to set initial values. (same as create)
 * @param x - Initial x value.
 * @param y - Initial y value.
 * @returns the created vector
 */
const fromValues$2 = create$4;
/**
 * Applies Math.ceil to each element of vector
 * @param v - Operand vector.
 * @param dst - vector to hold result. If not new one is created.
 * @returns A vector that is the ceil of each element of v.
 */
function ceil$2(v, dst) {
  dst = dst || new VecType$2(2);
  dst[0] = Math.ceil(v[0]);
  dst[1] = Math.ceil(v[1]);
  return dst;
}
/**
 * Applies Math.floor to each element of vector
 * @param v - Operand vector.
 * @param dst - vector to hold result. If not new one is created.
 * @returns A vector that is the floor of each element of v.
 */
function floor$2(v, dst) {
  dst = dst || new VecType$2(2);
  dst[0] = Math.floor(v[0]);
  dst[1] = Math.floor(v[1]);
  return dst;
}
/**
 * Applies Math.round to each element of vector
 * @param v - Operand vector.
 * @param dst - vector to hold result. If not new one is created.
 * @returns A vector that is the round of each element of v.
 */
function round$2(v, dst) {
  dst = dst || new VecType$2(2);
  dst[0] = Math.round(v[0]);
  dst[1] = Math.round(v[1]);
  return dst;
}
/**
 * Clamp each element of vector between min and max
 * @param v - Operand vector.
 * @param max - Min value, default 0
 * @param min - Max value, default 1
 * @param dst - vector to hold result. If not new one is created.
 * @returns A vector that the clamped value of each element of v.
 */
function clamp$2(v, min = 0, max = 1, dst) {
  dst = dst || new VecType$2(2);
  dst[0] = Math.min(max, Math.max(min, v[0]));
  dst[1] = Math.min(max, Math.max(min, v[1]));
  return dst;
}
/**
 * Adds two vectors; assumes a and b have the same dimension.
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @param dst - vector to hold result. If not new one is created.
 * @returns A vector that is the sum of a and b.
 */
function add$2(a, b, dst) {
  dst = dst || new VecType$2(2);
  dst[0] = a[0] + b[0];
  dst[1] = a[1] + b[1];
  return dst;
}
/**
 * Adds two vectors, scaling the 2nd; assumes a and b have the same dimension.
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @param scale - Amount to scale b
 * @param dst - vector to hold result. If not new one is created.
 * @returns A vector that is the sum of a + b * scale.
 */
function addScaled$2(a, b, scale, dst) {
  dst = dst || new VecType$2(2);
  dst[0] = a[0] + b[0] * scale;
  dst[1] = a[1] + b[1] * scale;
  return dst;
}
/**
 * Returns the angle in radians between two vectors.
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @returns The angle in radians between the 2 vectors.
 */
function angle$1(a, b) {
  const ax = a[0];
  const ay = a[1];
  const bx = a[0];
  const by = a[1];
  const mag1 = Math.sqrt(ax * ax + ay * ay);
  const mag2 = Math.sqrt(bx * bx + by * by);
  const mag = mag1 * mag2;
  const cosine = mag && dot$2(a, b) / mag;
  return Math.acos(cosine);
}
/**
 * Subtracts two vectors.
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @param dst - vector to hold result. If not new one is created.
 * @returns A vector that is the difference of a and b.
 */
function subtract$2(a, b, dst) {
  dst = dst || new VecType$2(2);
  dst[0] = a[0] - b[0];
  dst[1] = a[1] - b[1];
  return dst;
}
/**
 * Subtracts two vectors.
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @param dst - vector to hold result. If not new one is created.
 * @returns A vector that is the difference of a and b.
 */
const sub$2 = subtract$2;
/**
 * Check if 2 vectors are approximately equal
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @returns true if vectors are approximately equal
 */
function equalsApproximately$4(a, b) {
  return Math.abs(a[0] - b[0]) < EPSILON && Math.abs(a[1] - b[1]) < EPSILON;
}
/**
 * Check if 2 vectors are exactly equal
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @returns true if vectors are exactly equal
 */
function equals$4(a, b) {
  return a[0] === b[0] && a[1] === b[1];
}
/**
 * Performs linear interpolation on two vectors.
 * Given vectors a and b and interpolation coefficient t, returns
 * a + t * (b - a).
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @param t - Interpolation coefficient.
 * @param dst - vector to hold result. If not new one is created.
 * @returns The linear interpolated result.
 */
function lerp$2(a, b, t, dst) {
  dst = dst || new VecType$2(2);
  dst[0] = a[0] + t * (b[0] - a[0]);
  dst[1] = a[1] + t * (b[1] - a[1]);
  return dst;
}
/**
 * Performs linear interpolation on two vectors.
 * Given vectors a and b and interpolation coefficient vector t, returns
 * a + t * (b - a).
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @param t - Interpolation coefficients vector.
 * @param dst - vector to hold result. If not new one is created.
 * @returns the linear interpolated result.
 */
function lerpV$2(a, b, t, dst) {
  dst = dst || new VecType$2(2);
  dst[0] = a[0] + t[0] * (b[0] - a[0]);
  dst[1] = a[1] + t[1] * (b[1] - a[1]);
  return dst;
}
/**
 * Return max values of two vectors.
 * Given vectors a and b returns
 * [max(a[0], b[0]), max(a[1], b[1]), max(a[2], b[2])].
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @param dst - vector to hold result. If not new one is created.
 * @returns The max components vector.
 */
function max$2(a, b, dst) {
  dst = dst || new VecType$2(2);
  dst[0] = Math.max(a[0], b[0]);
  dst[1] = Math.max(a[1], b[1]);
  return dst;
}
/**
 * Return min values of two vectors.
 * Given vectors a and b returns
 * [min(a[0], b[0]), min(a[1], b[1]), min(a[2], b[2])].
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @param dst - vector to hold result. If not new one is created.
 * @returns The min components vector.
 */
function min$2(a, b, dst) {
  dst = dst || new VecType$2(2);
  dst[0] = Math.min(a[0], b[0]);
  dst[1] = Math.min(a[1], b[1]);
  return dst;
}
/**
 * Multiplies a vector by a scalar.
 * @param v - The vector.
 * @param k - The scalar.
 * @param dst - vector to hold result. If not new one is created.
 * @returns The scaled vector.
 */
function mulScalar$2(v, k, dst) {
  dst = dst || new VecType$2(2);
  dst[0] = v[0] * k;
  dst[1] = v[1] * k;
  return dst;
}
/**
 * Multiplies a vector by a scalar. (same as mulScalar)
 * @param v - The vector.
 * @param k - The scalar.
 * @param dst - vector to hold result. If not new one is created.
 * @returns The scaled vector.
 */
const scale$4 = mulScalar$2;
/**
 * Divides a vector by a scalar.
 * @param v - The vector.
 * @param k - The scalar.
 * @param dst - vector to hold result. If not new one is created.
 * @returns The scaled vector.
 */
function divScalar$2(v, k, dst) {
  dst = dst || new VecType$2(2);
  dst[0] = v[0] / k;
  dst[1] = v[1] / k;
  return dst;
}
/**
 * Inverse a vector.
 * @param v - The vector.
 * @param dst - vector to hold result. If not new one is created.
 * @returns The inverted vector.
 */
function inverse$4(v, dst) {
  dst = dst || new VecType$2(2);
  dst[0] = 1 / v[0];
  dst[1] = 1 / v[1];
  return dst;
}
/**
 * Invert a vector. (same as inverse)
 * @param v - The vector.
 * @param dst - vector to hold result. If not new one is created.
 * @returns The inverted vector.
 */
const invert$4 = inverse$4;
/**
 * Computes the cross product of two vectors; assumes both vectors have
 * three entries.
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @param dst - vector to hold result. If not new one is created.
 * @returns The vector of a cross b.
 */
function cross$1(a, b, dst) {
  dst = dst || new VecType$2(3);
  const z = a[0] * b[1] - a[1] * b[0];
  dst[0] = 0;
  dst[1] = 0;
  dst[2] = z;
  return dst;
}
/**
 * Computes the dot product of two vectors; assumes both vectors have
 * three entries.
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @returns dot product
 */
function dot$2(a, b) {
  return a[0] * b[0] + a[1] * b[1];
}
/**
 * Computes the length of vector
 * @param v - vector.
 * @returns length of vector.
 */
function length$2(v) {
  const v0 = v[0];
  const v1 = v[1];
  return Math.sqrt(v0 * v0 + v1 * v1);
}
/**
 * Computes the length of vector (same as length)
 * @param v - vector.
 * @returns length of vector.
 */
const len$2 = length$2;
/**
 * Computes the square of the length of vector
 * @param v - vector.
 * @returns square of the length of vector.
 */
function lengthSq$2(v) {
  const v0 = v[0];
  const v1 = v[1];
  return v0 * v0 + v1 * v1;
}
/**
 * Computes the square of the length of vector (same as lengthSq)
 * @param v - vector.
 * @returns square of the length of vector.
 */
const lenSq$2 = lengthSq$2;
/**
 * Computes the distance between 2 points
 * @param a - vector.
 * @param b - vector.
 * @returns distance between a and b
 */
function distance$2(a, b) {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  return Math.sqrt(dx * dx + dy * dy);
}
/**
 * Computes the distance between 2 points (same as distance)
 * @param a - vector.
 * @param b - vector.
 * @returns distance between a and b
 */
const dist$2 = distance$2;
/**
 * Computes the square of the distance between 2 points
 * @param a - vector.
 * @param b - vector.
 * @returns square of the distance between a and b
 */
function distanceSq$2(a, b) {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  return dx * dx + dy * dy;
}
/**
 * Computes the square of the distance between 2 points (same as distanceSq)
 * @param a - vector.
 * @param b - vector.
 * @returns square of the distance between a and b
 */
const distSq$2 = distanceSq$2;
/**
 * Divides a vector by its Euclidean length and returns the quotient.
 * @param v - The vector.
 * @param dst - vector to hold result. If not new one is created.
 * @returns The normalized vector.
 */
function normalize$2(v, dst) {
  dst = dst || new VecType$2(2);
  const v0 = v[0];
  const v1 = v[1];
  const len = Math.sqrt(v0 * v0 + v1 * v1);
  if (len > 0.00001) {
    dst[0] = v0 / len;
    dst[1] = v1 / len;
  } else {
    dst[0] = 0;
    dst[1] = 0;
  }
  return dst;
}
/**
 * Negates a vector.
 * @param v - The vector.
 * @param dst - vector to hold result. If not new one is created.
 * @returns -v.
 */
function negate$4(v, dst) {
  dst = dst || new VecType$2(2);
  dst[0] = -v[0];
  dst[1] = -v[1];
  return dst;
}
/**
 * Copies a vector. (same as clone)
 * @param v - The vector.
 * @param dst - vector to hold result. If not new one is created.
 * @returns A copy of v.
 */
function copy$4(v, dst) {
  dst = dst || new VecType$2(2);
  dst[0] = v[0];
  dst[1] = v[1];
  return dst;
}
/**
 * Clones a vector. (same as copy)
 * @param v - The vector.
 * @param dst - vector to hold result. If not new one is created.
 * @returns A copy of v.
 */
const clone$4 = copy$4;
/**
 * Multiplies a vector by another vector (component-wise); assumes a and
 * b have the same length.
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @param dst - vector to hold result. If not new one is created.
 * @returns The vector of products of entries of a and b.
 */
function multiply$4(a, b, dst) {
  dst = dst || new VecType$2(2);
  dst[0] = a[0] * b[0];
  dst[1] = a[1] * b[1];
  return dst;
}
/**
 * Multiplies a vector by another vector (component-wise); assumes a and
 * b have the same length. (same as mul)
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @param dst - vector to hold result. If not new one is created.
 * @returns The vector of products of entries of a and b.
 */
const mul$4 = multiply$4;
/**
 * Divides a vector by another vector (component-wise); assumes a and
 * b have the same length.
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @param dst - vector to hold result. If not new one is created.
 * @returns The vector of quotients of entries of a and b.
 */
function divide$2(a, b, dst) {
  dst = dst || new VecType$2(2);
  dst[0] = a[0] / b[0];
  dst[1] = a[1] / b[1];
  return dst;
}
/**
 * Divides a vector by another vector (component-wise); assumes a and
 * b have the same length. (same as divide)
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @param dst - vector to hold result. If not new one is created.
 * @returns The vector of quotients of entries of a and b.
 */
const div$2 = divide$2;
/**
 * Creates a random unit vector * scale
 * @param scale - Default 1
 * @param dst - vector to hold result. If not new one is created.
 * @returns The random vector.
 */
function random$1(scale = 1, dst) {
  dst = dst || new VecType$2(2);
  const angle = Math.random() * 2 * Math.PI;
  dst[0] = Math.cos(angle) * scale;
  dst[1] = Math.sin(angle) * scale;
  return dst;
}
/**
 * Zero's a vector
 * @param dst - vector to hold result. If not new one is created.
 * @returns The zeroed vector.
 */
function zero$2(dst) {
  dst = dst || new VecType$2(2);
  dst[0] = 0;
  dst[1] = 0;
  return dst;
}
/**
 * transform Vec2 by 4x4 matrix
 * @param v - the vector
 * @param m - The matrix.
 * @param dst - optional Vec2 to store result. If not passed a new one is created.
 * @returns the transformed vector
 */
function transformMat4$2(v, m, dst) {
  dst = dst || new VecType$2(2);
  const x = v[0];
  const y = v[1];
  dst[0] = x * m[0] + y * m[4] + m[12];
  dst[1] = x * m[1] + y * m[5] + m[13];
  return dst;
}
/**
 * Transforms vec4 by 3x3 matrix
 *
 * @param v - the vector
 * @param m - The matrix.
 * @param dst - optional Vec2 to store result. If not passed a new one is created.
 * @returns the transformed vector
 */
function transformMat3$1(v, m, dst) {
  dst = dst || new VecType$2(2);
  const x = v[0];
  const y = v[1];
  dst[0] = m[0] * x + m[4] * y + m[8];
  dst[1] = m[1] * x + m[5] * y + m[9];
  return dst;
}
var vec2Impl = exports.vec2 = /*#__PURE__*/Object.freeze({
  __proto__: null,
  create: create$4,
  setDefaultType: setDefaultType$5,
  fromValues: fromValues$2,
  ceil: ceil$2,
  floor: floor$2,
  round: round$2,
  clamp: clamp$2,
  add: add$2,
  addScaled: addScaled$2,
  angle: angle$1,
  subtract: subtract$2,
  sub: sub$2,
  equalsApproximately: equalsApproximately$4,
  equals: equals$4,
  lerp: lerp$2,
  lerpV: lerpV$2,
  max: max$2,
  min: min$2,
  mulScalar: mulScalar$2,
  scale: scale$4,
  divScalar: divScalar$2,
  inverse: inverse$4,
  invert: invert$4,
  cross: cross$1,
  dot: dot$2,
  length: length$2,
  len: len$2,
  lengthSq: lengthSq$2,
  lenSq: lenSq$2,
  distance: distance$2,
  dist: dist$2,
  distanceSq: distanceSq$2,
  distSq: distSq$2,
  normalize: normalize$2,
  negate: negate$4,
  copy: copy$4,
  clone: clone$4,
  multiply: multiply$4,
  mul: mul$4,
  divide: divide$2,
  div: div$2,
  random: random$1,
  zero: zero$2,
  transformMat4: transformMat4$2,
  transformMat3: transformMat3$1
});

/*
 * Copyright 2022 Gregg Tavares
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.  IN NO EVENT SHALL
 * THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 */
/**
 * 3x3 Matrix math math functions.
 *
 * Almost all functions take an optional `dst` argument. If it is not passed in the
 * functions will create a new matrix. In other words you can do this
 *
 *     const mat = mat3.translation([1, 2, 3]);  // Creates a new translation matrix
 *
 * or
 *
 *     const mat = mat3.create();
 *     mat3.translation([1, 2, 3], mat);  // Puts translation matrix in mat.
 *
 * The first style is often easier but depending on where it's used it generates garbage where
 * as there is almost never allocation with the second style.
 *
 * It is always save to pass any matrix as the destination. So for example
 *
 *     const mat = mat3.identity();
 *     const trans = mat3.translation([1, 2, 3]);
 *     mat3.multiply(mat, trans, mat);  // Multiplies mat * trans and puts result in mat.
 *
 */
let MatType$1 = Float32Array;
// This mess is because with Mat3 we have 3 unused elements.
// For Float32Array and Float64Array that's not an issue
// but for Array it's troublesome
const ctorMap = new Map([[Float32Array, () => new Float32Array(12)], [Float64Array, () => new Float64Array(12)], [Array, () => new Array(12).fill(0)]]);
let newMat3 = ctorMap.get(Float32Array);
/**
 * Sets the type this library creates for a Mat3
 * @param ctor - the constructor for the type. Either `Float32Array`, 'Float64Array', or `Array`
 * @returns previous constructor for Mat3
 */
function setDefaultType$4(ctor) {
  const oldType = MatType$1;
  MatType$1 = ctor;
  newMat3 = ctorMap.get(ctor);
  return oldType;
}
/**
 * Create a Mat3 from values
 *
 * Note: Since passing in a raw JavaScript array
 * is valid in all circumstances, if you want to
 * force a JavaScript array into a Mat3's specified type
 * it would be faster to use
 *
 * ```
 * const m = mat3.clone(someJSArray);
 * ```
 *
 * Note: a consequence of the implementation is if your Mat3Type = `Array`
 * instead of `Float32Array` or `Float64Array` then any values you
 * don't pass in will be undefined. Usually this is not an issue since
 * (a) using `Array` is rare and (b) using `mat3.create` is usually used
 * to create a Mat3 to be filled out as in
 *
 * ```
 * const m = mat3.create();
 * mat3.perspective(fov, aspect, near, far, m);
 * ```
 *
 * @param v0 - value for element 0
 * @param v1 - value for element 1
 * @param v2 - value for element 2
 * @param v3 - value for element 3
 * @param v4 - value for element 4
 * @param v5 - value for element 5
 * @param v6 - value for element 6
 * @param v7 - value for element 7
 * @param v8 - value for element 8
 * @returns matrix created from values.
 */
function create$3(v0, v1, v2, v3, v4, v5, v6, v7, v8) {
  const dst = newMat3();
  // to make the array homogenous
  dst[3] = 0;
  dst[7] = 0;
  dst[11] = 0;
  if (v0 !== undefined) {
    dst[0] = v0;
    if (v1 !== undefined) {
      dst[1] = v1;
      if (v2 !== undefined) {
        dst[2] = v2;
        if (v3 !== undefined) {
          dst[4] = v3;
          if (v4 !== undefined) {
            dst[5] = v4;
            if (v5 !== undefined) {
              dst[6] = v5;
              if (v6 !== undefined) {
                dst[8] = v6;
                if (v7 !== undefined) {
                  dst[9] = v7;
                  if (v8 !== undefined) {
                    dst[10] = v8;
                  }
                }
              }
            }
          }
        }
      }
    }
  }
  return dst;
}
/**
 * Negates a matrix.
 * @param m - The matrix.
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns -m.
 */
function negate$3(m, dst) {
  dst = dst || newMat3();
  dst[0] = -m[0];
  dst[1] = -m[1];
  dst[2] = -m[2];
  dst[4] = -m[4];
  dst[5] = -m[5];
  dst[6] = -m[6];
  dst[8] = -m[8];
  dst[9] = -m[9];
  dst[10] = -m[10];
  return dst;
}
/**
 * Copies a matrix.
 * @param m - The matrix.
 * @param dst - The matrix. If not passed a new one is created.
 * @returns A copy of m.
 */
function copy$3(m, dst) {
  dst = dst || newMat3();
  dst[0] = m[0];
  dst[1] = m[1];
  dst[2] = m[2];
  dst[4] = m[4];
  dst[5] = m[5];
  dst[6] = m[6];
  dst[8] = m[8];
  dst[9] = m[9];
  dst[10] = m[10];
  return dst;
}
/**
 * Copies a matrix (same as copy)
 * @param m - The matrix.
 * @param dst - The matrix. If not passed a new one is created.
 * @returns A copy of m.
 */
const clone$3 = copy$3;
/**
 * Check if 2 matrices are approximately equal
 * @param a Operand matrix.
 * @param b Operand matrix.
 * @returns true if matrices are approximately equal
 */
function equalsApproximately$3(a, b) {
  return Math.abs(a[0] - b[0]) < EPSILON && Math.abs(a[1] - b[1]) < EPSILON && Math.abs(a[2] - b[2]) < EPSILON && Math.abs(a[4] - b[4]) < EPSILON && Math.abs(a[5] - b[5]) < EPSILON && Math.abs(a[6] - b[6]) < EPSILON && Math.abs(a[8] - b[8]) < EPSILON && Math.abs(a[9] - b[9]) < EPSILON && Math.abs(a[10] - b[10]) < EPSILON;
}
/**
 * Check if 2 matrices are exactly equal
 * @param a Operand matrix.
 * @param b Operand matrix.
 * @returns true if matrices are exactly equal
 */
function equals$3(a, b) {
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[4] === b[4] && a[5] === b[5] && a[6] === b[6] && a[8] === b[8] && a[9] === b[9] && a[10] === b[10];
}
/**
 * Creates a 3-by-3 identity matrix.
 *
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns A 3-by-3 identity matrix.
 */
function identity$1(dst) {
  dst = dst || newMat3();
  dst[0] = 1;
  dst[1] = 0;
  dst[2] = 0;
  dst[4] = 0;
  dst[5] = 1;
  dst[6] = 0;
  dst[8] = 0;
  dst[9] = 0;
  dst[10] = 1;
  return dst;
}
/**
 * Takes the transpose of a matrix.
 * @param m - The matrix.
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns The transpose of m.
 */
function transpose$1(m, dst) {
  dst = dst || newMat3();
  if (dst === m) {
    let t;
    // 0 1 2
    // 4 5 6
    // 8 9 10
    t = m[1];
    m[1] = m[4];
    m[4] = t;
    t = m[2];
    m[2] = m[8];
    m[8] = t;
    t = m[6];
    m[6] = m[9];
    m[9] = t;
    return dst;
  }
  const m00 = m[0 * 4 + 0];
  const m01 = m[0 * 4 + 1];
  const m02 = m[0 * 4 + 2];
  const m10 = m[1 * 4 + 0];
  const m11 = m[1 * 4 + 1];
  const m12 = m[1 * 4 + 2];
  const m20 = m[2 * 4 + 0];
  const m21 = m[2 * 4 + 1];
  const m22 = m[2 * 4 + 2];
  dst[0] = m00;
  dst[1] = m10;
  dst[2] = m20;
  dst[4] = m01;
  dst[5] = m11;
  dst[6] = m21;
  dst[8] = m02;
  dst[9] = m12;
  dst[10] = m22;
  return dst;
}
/**
 * Computes the inverse of a 3-by-3 matrix.
 * @param m - The matrix.
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns The inverse of m.
 */
function inverse$3(m, dst) {
  dst = dst || newMat3();
  const m00 = m[0 * 4 + 0];
  const m01 = m[0 * 4 + 1];
  const m02 = m[0 * 4 + 2];
  const m10 = m[1 * 4 + 0];
  const m11 = m[1 * 4 + 1];
  const m12 = m[1 * 4 + 2];
  const m20 = m[2 * 4 + 0];
  const m21 = m[2 * 4 + 1];
  const m22 = m[2 * 4 + 2];
  const m11_x_m22 = m11 * m22;
  const m21_x_m12 = m21 * m12;
  const m01_x_m22 = m01 * m22;
  const m21_x_m02 = m21 * m02;
  const m01_x_m12 = m01 * m12;
  const m11_x_m02 = m11 * m02;
  const invDet = 1 / (m00 * (m11_x_m22 - m21_x_m12) - m10 * (m01_x_m22 - m21_x_m02) + m20 * (m01_x_m12 - m11_x_m02));
  dst[0] = +(m11_x_m22 - m21_x_m12) * invDet;
  dst[1] = -(m10 * m22 - m20 * m12) * invDet;
  dst[2] = +(m10 * m21 - m20 * m11) * invDet;
  dst[4] = -(m01_x_m22 - m21_x_m02) * invDet;
  dst[5] = +(m00 * m22 - m20 * m02) * invDet;
  dst[6] = -(m00 * m21 - m20 * m01) * invDet;
  dst[8] = +(m01_x_m12 - m11_x_m02) * invDet;
  dst[9] = -(m00 * m12 - m10 * m02) * invDet;
  dst[10] = +(m00 * m11 - m10 * m01) * invDet;
  return dst;
}
/**
 * Compute the determinant of a matrix
 * @param m - the matrix
 * @returns the determinant
 */
function determinant$1(m) {
  const m00 = m[0 * 4 + 0];
  const m01 = m[0 * 4 + 1];
  const m02 = m[0 * 4 + 2];
  const m10 = m[1 * 4 + 0];
  const m11 = m[1 * 4 + 1];
  const m12 = m[1 * 4 + 2];
  const m20 = m[2 * 4 + 0];
  const m21 = m[2 * 4 + 1];
  const m22 = m[2 * 4 + 2];
  return m00 * (m11 * m22 - m21 * m12) - m10 * (m01 * m22 - m21 * m02) + m20 * (m01 * m12 - m11 * m02);
}
/**
 * Computes the inverse of a 3-by-3 matrix. (same as inverse)
 * @param m - The matrix.
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns The inverse of m.
 */
const invert$3 = inverse$3;
/**
 * Multiplies two 3-by-3 matrices with a on the left and b on the right
 * @param a - The matrix on the left.
 * @param b - The matrix on the right.
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns The matrix product of a and b.
 */
function multiply$3(a, b, dst) {
  dst = dst || newMat3();
  const a00 = a[0];
  const a01 = a[1];
  const a02 = a[2];
  const a10 = a[4 + 0];
  const a11 = a[4 + 1];
  const a12 = a[4 + 2];
  const a20 = a[8 + 0];
  const a21 = a[8 + 1];
  const a22 = a[8 + 2];
  const b00 = b[0];
  const b01 = b[1];
  const b02 = b[2];
  const b10 = b[4 + 0];
  const b11 = b[4 + 1];
  const b12 = b[4 + 2];
  const b20 = b[8 + 0];
  const b21 = b[8 + 1];
  const b22 = b[8 + 2];
  dst[0] = a00 * b00 + a10 * b01 + a20 * b02;
  dst[1] = a01 * b00 + a11 * b01 + a21 * b02;
  dst[2] = a02 * b00 + a12 * b01 + a22 * b02;
  dst[4] = a00 * b10 + a10 * b11 + a20 * b12;
  dst[5] = a01 * b10 + a11 * b11 + a21 * b12;
  dst[6] = a02 * b10 + a12 * b11 + a22 * b12;
  dst[8] = a00 * b20 + a10 * b21 + a20 * b22;
  dst[9] = a01 * b20 + a11 * b21 + a21 * b22;
  dst[10] = a02 * b20 + a12 * b21 + a22 * b22;
  return dst;
}
/**
 * Multiplies two 3-by-3 matrices with a on the left and b on the right (same as multiply)
 * @param a - The matrix on the left.
 * @param b - The matrix on the right.
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns The matrix product of a and b.
 */
const mul$3 = multiply$3;
/**
 * Sets the translation component of a 3-by-3 matrix to the given
 * vector.
 * @param a - The matrix.
 * @param v - The vector.
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns The matrix with translation set.
 */
function setTranslation$1(a, v, dst) {
  dst = dst || identity$1();
  if (a !== dst) {
    dst[0] = a[0];
    dst[1] = a[1];
    dst[2] = a[2];
    dst[4] = a[4];
    dst[5] = a[5];
    dst[6] = a[6];
  }
  dst[8] = v[0];
  dst[9] = v[1];
  dst[10] = 1;
  return dst;
}
/**
 * Returns the translation component of a 3-by-3 matrix as a vector with 3
 * entries.
 * @param m - The matrix.
 * @param dst - vector to hold result. If not passed a new one is created.
 * @returns The translation component of m.
 */
function getTranslation$1(m, dst) {
  dst = dst || create$4();
  dst[0] = m[8];
  dst[1] = m[9];
  return dst;
}
/**
 * Returns an axis of a 3x3 matrix as a vector with 2 entries
 * @param m - The matrix.
 * @param axis - The axis 0 = x, 1 = y,
 * @returns The axis component of m.
 */
function getAxis$1(m, axis, dst) {
  dst = dst || create$4();
  const off = axis * 4;
  dst[0] = m[off + 0];
  dst[1] = m[off + 1];
  return dst;
}
/**
 * Sets an axis of a 3x3 matrix as a vector with 2 entries
 * @param m - The matrix.
 * @param v - the axis vector
 * @param axis - The axis  0 = x, 1 = y;
 * @param dst - The matrix to set. If not passed a new one is created.
 * @returns The matrix with axis set.
 */
function setAxis$1(m, v, axis, dst) {
  if (dst !== m) {
    dst = copy$3(m, dst);
  }
  const off = axis * 4;
  dst[off + 0] = v[0];
  dst[off + 1] = v[1];
  return dst;
}
/**
 * Returns the scaling component of the matrix
 * @param m - The Matrix
 * @param dst - The vector to set. If not passed a new one is created.
 */
function getScaling$1(m, dst) {
  dst = dst || create$4();
  const xx = m[0];
  const xy = m[1];
  const yx = m[4];
  const yy = m[5];
  dst[0] = Math.sqrt(xx * xx + xy * xy);
  dst[1] = Math.sqrt(yx * yx + yy * yy);
  return dst;
}
/**
 * Creates a 3-by-3 matrix which translates by the given vector v.
 * @param v - The vector by which to translate.
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns The translation matrix.
 */
function translation$1(v, dst) {
  dst = dst || newMat3();
  dst[0] = 1;
  dst[1] = 0;
  dst[2] = 0;
  dst[4] = 0;
  dst[5] = 1;
  dst[6] = 0;
  dst[8] = v[0];
  dst[9] = v[1];
  dst[10] = 1;
  return dst;
}
/**
 * Translates the given 3-by-3 matrix by the given vector v.
 * @param m - The matrix.
 * @param v - The vector by which to translate.
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns The translated matrix.
 */
function translate$1(m, v, dst) {
  dst = dst || newMat3();
  const v0 = v[0];
  const v1 = v[1];
  const m00 = m[0];
  const m01 = m[1];
  const m02 = m[2];
  const m10 = m[1 * 4 + 0];
  const m11 = m[1 * 4 + 1];
  const m12 = m[1 * 4 + 2];
  const m20 = m[2 * 4 + 0];
  const m21 = m[2 * 4 + 1];
  const m22 = m[2 * 4 + 2];
  if (m !== dst) {
    dst[0] = m00;
    dst[1] = m01;
    dst[2] = m02;
    dst[4] = m10;
    dst[5] = m11;
    dst[6] = m12;
  }
  dst[8] = m00 * v0 + m10 * v1 + m20;
  dst[9] = m01 * v0 + m11 * v1 + m21;
  dst[10] = m02 * v0 + m12 * v1 + m22;
  return dst;
}
/**
 * Creates a 3-by-3 matrix which rotates  by the given angle.
 * @param angleInRadians - The angle by which to rotate (in radians).
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns The rotation matrix.
 */
function rotation$1(angleInRadians, dst) {
  dst = dst || newMat3();
  const c = Math.cos(angleInRadians);
  const s = Math.sin(angleInRadians);
  dst[0] = c;
  dst[1] = s;
  dst[2] = 0;
  dst[4] = -s;
  dst[5] = c;
  dst[6] = 0;
  dst[8] = 0;
  dst[9] = 0;
  dst[10] = 1;
  return dst;
}
/**
 * Rotates the given 3-by-3 matrix  by the given angle.
 * @param m - The matrix.
 * @param angleInRadians - The angle by which to rotate (in radians).
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns The rotated matrix.
 */
function rotate$1(m, angleInRadians, dst) {
  dst = dst || newMat3();
  const m00 = m[0 * 4 + 0];
  const m01 = m[0 * 4 + 1];
  const m02 = m[0 * 4 + 2];
  const m10 = m[1 * 4 + 0];
  const m11 = m[1 * 4 + 1];
  const m12 = m[1 * 4 + 2];
  const c = Math.cos(angleInRadians);
  const s = Math.sin(angleInRadians);
  dst[0] = c * m00 + s * m10;
  dst[1] = c * m01 + s * m11;
  dst[2] = c * m02 + s * m12;
  dst[4] = c * m10 - s * m00;
  dst[5] = c * m11 - s * m01;
  dst[6] = c * m12 - s * m02;
  if (m !== dst) {
    dst[8] = m[8];
    dst[9] = m[9];
    dst[10] = m[10];
  }
  return dst;
}
/**
 * Creates a 3-by-3 matrix which scales in each dimension by an amount given by
 * the corresponding entry in the given vector; assumes the vector has three
 * entries.
 * @param v - A vector of
 *     2 entries specifying the factor by which to scale in each dimension.
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns The scaling matrix.
 */
function scaling$1(v, dst) {
  dst = dst || newMat3();
  dst[0] = v[0];
  dst[1] = 0;
  dst[2] = 0;
  dst[4] = 0;
  dst[5] = v[1];
  dst[6] = 0;
  dst[8] = 0;
  dst[9] = 0;
  dst[10] = 1;
  return dst;
}
/**
 * Scales the given 3-by-3 matrix in each dimension by an amount
 * given by the corresponding entry in the given vector; assumes the vector has
 * three entries.
 * @param m - The matrix to be modified.
 * @param v - A vector of 2 entries specifying the
 *     factor by which to scale in each dimension.
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns The scaled matrix.
 */
function scale$3(m, v, dst) {
  dst = dst || newMat3();
  const v0 = v[0];
  const v1 = v[1];
  dst[0] = v0 * m[0 * 4 + 0];
  dst[1] = v0 * m[0 * 4 + 1];
  dst[2] = v0 * m[0 * 4 + 2];
  dst[4] = v1 * m[1 * 4 + 0];
  dst[5] = v1 * m[1 * 4 + 1];
  dst[6] = v1 * m[1 * 4 + 2];
  if (m !== dst) {
    dst[8] = m[8];
    dst[9] = m[9];
    dst[10] = m[10];
  }
  return dst;
}
var mat3Impl = exports.mat3 = /*#__PURE__*/Object.freeze({
  __proto__: null,
  setDefaultType: setDefaultType$4,
  create: create$3,
  negate: negate$3,
  copy: copy$3,
  clone: clone$3,
  equalsApproximately: equalsApproximately$3,
  equals: equals$3,
  identity: identity$1,
  transpose: transpose$1,
  inverse: inverse$3,
  determinant: determinant$1,
  invert: invert$3,
  multiply: multiply$3,
  mul: mul$3,
  setTranslation: setTranslation$1,
  getTranslation: getTranslation$1,
  getAxis: getAxis$1,
  setAxis: setAxis$1,
  getScaling: getScaling$1,
  translation: translation$1,
  translate: translate$1,
  rotation: rotation$1,
  rotate: rotate$1,
  scaling: scaling$1,
  scale: scale$3
});

/**
 *
 * Vec3 math functions.
 *
 * Almost all functions take an optional `dst` argument. If it is not passed in the
 * functions will create a new `Vec3`. In other words you can do this
 *
 *     const v = vec3.cross(v1, v2);  // Creates a new Vec3 with the cross product of v1 x v2.
 *
 * or
 *
 *     const v = vec3.create();
 *     vec3.cross(v1, v2, v);  // Puts the cross product of v1 x v2 in v
 *
 * The first style is often easier but depending on where it's used it generates garbage where
 * as there is almost never allocation with the second style.
 *
 * It is always safe to pass any vector as the destination. So for example
 *
 *     vec3.cross(v1, v2, v1);  // Puts the cross product of v1 x v2 in v1
 *
 */
let VecType$1 = Float32Array;
/**
 * Sets the type this library creates for a Vec3
 * @param ctor - the constructor for the type. Either `Float32Array`, 'Float64Array', or `Array`
 * @returns previous constructor for Vec3
 */
function setDefaultType$3(ctor) {
  const oldType = VecType$1;
  VecType$1 = ctor;
  return oldType;
}
/**
 * Creates a vec3; may be called with x, y, z to set initial values.
 * @param x - Initial x value.
 * @param y - Initial y value.
 * @param z - Initial z value.
 * @returns the created vector
 */
function create$2(x, y, z) {
  const dst = new VecType$1(3);
  if (x !== undefined) {
    dst[0] = x;
    if (y !== undefined) {
      dst[1] = y;
      if (z !== undefined) {
        dst[2] = z;
      }
    }
  }
  return dst;
}

/*
 * Copyright 2022 Gregg Tavares
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.  IN NO EVENT SHALL
 * THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 */
/**
 * Creates a vec3; may be called with x, y, z to set initial values. (same as create)
 * @param x - Initial x value.
 * @param y - Initial y value.
 * @param z - Initial z value.
 * @returns the created vector
 */
const fromValues$1 = create$2;
/**
 * Applies Math.ceil to each element of vector
 * @param v - Operand vector.
 * @param dst - vector to hold result. If not new one is created.
 * @returns A vector that is the ceil of each element of v.
 */
function ceil$1(v, dst) {
  dst = dst || new VecType$1(3);
  dst[0] = Math.ceil(v[0]);
  dst[1] = Math.ceil(v[1]);
  dst[2] = Math.ceil(v[2]);
  return dst;
}
/**
 * Applies Math.floor to each element of vector
 * @param v - Operand vector.
 * @param dst - vector to hold result. If not new one is created.
 * @returns A vector that is the floor of each element of v.
 */
function floor$1(v, dst) {
  dst = dst || new VecType$1(3);
  dst[0] = Math.floor(v[0]);
  dst[1] = Math.floor(v[1]);
  dst[2] = Math.floor(v[2]);
  return dst;
}
/**
 * Applies Math.round to each element of vector
 * @param v - Operand vector.
 * @param dst - vector to hold result. If not new one is created.
 * @returns A vector that is the round of each element of v.
 */
function round$1(v, dst) {
  dst = dst || new VecType$1(3);
  dst[0] = Math.round(v[0]);
  dst[1] = Math.round(v[1]);
  dst[2] = Math.round(v[2]);
  return dst;
}
/**
 * Clamp each element of vector between min and max
 * @param v - Operand vector.
 * @param max - Min value, default 0
 * @param min - Max value, default 1
 * @param dst - vector to hold result. If not new one is created.
 * @returns A vector that the clamped value of each element of v.
 */
function clamp$1(v, min = 0, max = 1, dst) {
  dst = dst || new VecType$1(3);
  dst[0] = Math.min(max, Math.max(min, v[0]));
  dst[1] = Math.min(max, Math.max(min, v[1]));
  dst[2] = Math.min(max, Math.max(min, v[2]));
  return dst;
}
/**
 * Adds two vectors; assumes a and b have the same dimension.
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @param dst - vector to hold result. If not new one is created.
 * @returns A vector that is the sum of a and b.
 */
function add$1(a, b, dst) {
  dst = dst || new VecType$1(3);
  dst[0] = a[0] + b[0];
  dst[1] = a[1] + b[1];
  dst[2] = a[2] + b[2];
  return dst;
}
/**
 * Adds two vectors, scaling the 2nd; assumes a and b have the same dimension.
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @param scale - Amount to scale b
 * @param dst - vector to hold result. If not new one is created.
 * @returns A vector that is the sum of a + b * scale.
 */
function addScaled$1(a, b, scale, dst) {
  dst = dst || new VecType$1(3);
  dst[0] = a[0] + b[0] * scale;
  dst[1] = a[1] + b[1] * scale;
  dst[2] = a[2] + b[2] * scale;
  return dst;
}
/**
 * Returns the angle in radians between two vectors.
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @returns The angle in radians between the 2 vectors.
 */
function angle(a, b) {
  const ax = a[0];
  const ay = a[1];
  const az = a[2];
  const bx = a[0];
  const by = a[1];
  const bz = a[2];
  const mag1 = Math.sqrt(ax * ax + ay * ay + az * az);
  const mag2 = Math.sqrt(bx * bx + by * by + bz * bz);
  const mag = mag1 * mag2;
  const cosine = mag && dot$1(a, b) / mag;
  return Math.acos(cosine);
}
/**
 * Subtracts two vectors.
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @param dst - vector to hold result. If not new one is created.
 * @returns A vector that is the difference of a and b.
 */
function subtract$1(a, b, dst) {
  dst = dst || new VecType$1(3);
  dst[0] = a[0] - b[0];
  dst[1] = a[1] - b[1];
  dst[2] = a[2] - b[2];
  return dst;
}
/**
 * Subtracts two vectors.
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @param dst - vector to hold result. If not new one is created.
 * @returns A vector that is the difference of a and b.
 */
const sub$1 = subtract$1;
/**
 * Check if 2 vectors are approximately equal
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @returns true if vectors are approximately equal
 */
function equalsApproximately$2(a, b) {
  return Math.abs(a[0] - b[0]) < EPSILON && Math.abs(a[1] - b[1]) < EPSILON && Math.abs(a[2] - b[2]) < EPSILON;
}
/**
 * Check if 2 vectors are exactly equal
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @returns true if vectors are exactly equal
 */
function equals$2(a, b) {
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
}
/**
 * Performs linear interpolation on two vectors.
 * Given vectors a and b and interpolation coefficient t, returns
 * a + t * (b - a).
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @param t - Interpolation coefficient.
 * @param dst - vector to hold result. If not new one is created.
 * @returns The linear interpolated result.
 */
function lerp$1(a, b, t, dst) {
  dst = dst || new VecType$1(3);
  dst[0] = a[0] + t * (b[0] - a[0]);
  dst[1] = a[1] + t * (b[1] - a[1]);
  dst[2] = a[2] + t * (b[2] - a[2]);
  return dst;
}
/**
 * Performs linear interpolation on two vectors.
 * Given vectors a and b and interpolation coefficient vector t, returns
 * a + t * (b - a).
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @param t - Interpolation coefficients vector.
 * @param dst - vector to hold result. If not new one is created.
 * @returns the linear interpolated result.
 */
function lerpV$1(a, b, t, dst) {
  dst = dst || new VecType$1(3);
  dst[0] = a[0] + t[0] * (b[0] - a[0]);
  dst[1] = a[1] + t[1] * (b[1] - a[1]);
  dst[2] = a[2] + t[2] * (b[2] - a[2]);
  return dst;
}
/**
 * Return max values of two vectors.
 * Given vectors a and b returns
 * [max(a[0], b[0]), max(a[1], b[1]), max(a[2], b[2])].
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @param dst - vector to hold result. If not new one is created.
 * @returns The max components vector.
 */
function max$1(a, b, dst) {
  dst = dst || new VecType$1(3);
  dst[0] = Math.max(a[0], b[0]);
  dst[1] = Math.max(a[1], b[1]);
  dst[2] = Math.max(a[2], b[2]);
  return dst;
}
/**
 * Return min values of two vectors.
 * Given vectors a and b returns
 * [min(a[0], b[0]), min(a[1], b[1]), min(a[2], b[2])].
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @param dst - vector to hold result. If not new one is created.
 * @returns The min components vector.
 */
function min$1(a, b, dst) {
  dst = dst || new VecType$1(3);
  dst[0] = Math.min(a[0], b[0]);
  dst[1] = Math.min(a[1], b[1]);
  dst[2] = Math.min(a[2], b[2]);
  return dst;
}
/**
 * Multiplies a vector by a scalar.
 * @param v - The vector.
 * @param k - The scalar.
 * @param dst - vector to hold result. If not new one is created.
 * @returns The scaled vector.
 */
function mulScalar$1(v, k, dst) {
  dst = dst || new VecType$1(3);
  dst[0] = v[0] * k;
  dst[1] = v[1] * k;
  dst[2] = v[2] * k;
  return dst;
}
/**
 * Multiplies a vector by a scalar. (same as mulScalar)
 * @param v - The vector.
 * @param k - The scalar.
 * @param dst - vector to hold result. If not new one is created.
 * @returns The scaled vector.
 */
const scale$2 = mulScalar$1;
/**
 * Divides a vector by a scalar.
 * @param v - The vector.
 * @param k - The scalar.
 * @param dst - vector to hold result. If not new one is created.
 * @returns The scaled vector.
 */
function divScalar$1(v, k, dst) {
  dst = dst || new VecType$1(3);
  dst[0] = v[0] / k;
  dst[1] = v[1] / k;
  dst[2] = v[2] / k;
  return dst;
}
/**
 * Inverse a vector.
 * @param v - The vector.
 * @param dst - vector to hold result. If not new one is created.
 * @returns The inverted vector.
 */
function inverse$2(v, dst) {
  dst = dst || new VecType$1(3);
  dst[0] = 1 / v[0];
  dst[1] = 1 / v[1];
  dst[2] = 1 / v[2];
  return dst;
}
/**
 * Invert a vector. (same as inverse)
 * @param v - The vector.
 * @param dst - vector to hold result. If not new one is created.
 * @returns The inverted vector.
 */
const invert$2 = inverse$2;
/**
 * Computes the cross product of two vectors; assumes both vectors have
 * three entries.
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @param dst - vector to hold result. If not new one is created.
 * @returns The vector of a cross b.
 */
function cross(a, b, dst) {
  dst = dst || new VecType$1(3);
  const t1 = a[2] * b[0] - a[0] * b[2];
  const t2 = a[0] * b[1] - a[1] * b[0];
  dst[0] = a[1] * b[2] - a[2] * b[1];
  dst[1] = t1;
  dst[2] = t2;
  return dst;
}
/**
 * Computes the dot product of two vectors; assumes both vectors have
 * three entries.
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @returns dot product
 */
function dot$1(a, b) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}
/**
 * Computes the length of vector
 * @param v - vector.
 * @returns length of vector.
 */
function length$1(v) {
  const v0 = v[0];
  const v1 = v[1];
  const v2 = v[2];
  return Math.sqrt(v0 * v0 + v1 * v1 + v2 * v2);
}
/**
 * Computes the length of vector (same as length)
 * @param v - vector.
 * @returns length of vector.
 */
const len$1 = length$1;
/**
 * Computes the square of the length of vector
 * @param v - vector.
 * @returns square of the length of vector.
 */
function lengthSq$1(v) {
  const v0 = v[0];
  const v1 = v[1];
  const v2 = v[2];
  return v0 * v0 + v1 * v1 + v2 * v2;
}
/**
 * Computes the square of the length of vector (same as lengthSq)
 * @param v - vector.
 * @returns square of the length of vector.
 */
const lenSq$1 = lengthSq$1;
/**
 * Computes the distance between 2 points
 * @param a - vector.
 * @param b - vector.
 * @returns distance between a and b
 */
function distance$1(a, b) {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  const dz = a[2] - b[2];
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}
/**
 * Computes the distance between 2 points (same as distance)
 * @param a - vector.
 * @param b - vector.
 * @returns distance between a and b
 */
const dist$1 = distance$1;
/**
 * Computes the square of the distance between 2 points
 * @param a - vector.
 * @param b - vector.
 * @returns square of the distance between a and b
 */
function distanceSq$1(a, b) {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  const dz = a[2] - b[2];
  return dx * dx + dy * dy + dz * dz;
}
/**
 * Computes the square of the distance between 2 points (same as distanceSq)
 * @param a - vector.
 * @param b - vector.
 * @returns square of the distance between a and b
 */
const distSq$1 = distanceSq$1;
/**
 * Divides a vector by its Euclidean length and returns the quotient.
 * @param v - The vector.
 * @param dst - vector to hold result. If not new one is created.
 * @returns The normalized vector.
 */
function normalize$1(v, dst) {
  dst = dst || new VecType$1(3);
  const v0 = v[0];
  const v1 = v[1];
  const v2 = v[2];
  const len = Math.sqrt(v0 * v0 + v1 * v1 + v2 * v2);
  if (len > 0.00001) {
    dst[0] = v0 / len;
    dst[1] = v1 / len;
    dst[2] = v2 / len;
  } else {
    dst[0] = 0;
    dst[1] = 0;
    dst[2] = 0;
  }
  return dst;
}
/**
 * Negates a vector.
 * @param v - The vector.
 * @param dst - vector to hold result. If not new one is created.
 * @returns -v.
 */
function negate$2(v, dst) {
  dst = dst || new VecType$1(3);
  dst[0] = -v[0];
  dst[1] = -v[1];
  dst[2] = -v[2];
  return dst;
}
/**
 * Copies a vector. (same as clone)
 * @param v - The vector.
 * @param dst - vector to hold result. If not new one is created.
 * @returns A copy of v.
 */
function copy$2(v, dst) {
  dst = dst || new VecType$1(3);
  dst[0] = v[0];
  dst[1] = v[1];
  dst[2] = v[2];
  return dst;
}
/**
 * Clones a vector. (same as copy)
 * @param v - The vector.
 * @param dst - vector to hold result. If not new one is created.
 * @returns A copy of v.
 */
const clone$2 = copy$2;
/**
 * Multiplies a vector by another vector (component-wise); assumes a and
 * b have the same length.
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @param dst - vector to hold result. If not new one is created.
 * @returns The vector of products of entries of a and b.
 */
function multiply$2(a, b, dst) {
  dst = dst || new VecType$1(3);
  dst[0] = a[0] * b[0];
  dst[1] = a[1] * b[1];
  dst[2] = a[2] * b[2];
  return dst;
}
/**
 * Multiplies a vector by another vector (component-wise); assumes a and
 * b have the same length. (same as mul)
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @param dst - vector to hold result. If not new one is created.
 * @returns The vector of products of entries of a and b.
 */
const mul$2 = multiply$2;
/**
 * Divides a vector by another vector (component-wise); assumes a and
 * b have the same length.
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @param dst - vector to hold result. If not new one is created.
 * @returns The vector of quotients of entries of a and b.
 */
function divide$1(a, b, dst) {
  dst = dst || new VecType$1(3);
  dst[0] = a[0] / b[0];
  dst[1] = a[1] / b[1];
  dst[2] = a[2] / b[2];
  return dst;
}
/**
 * Divides a vector by another vector (component-wise); assumes a and
 * b have the same length. (same as divide)
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @param dst - vector to hold result. If not new one is created.
 * @returns The vector of quotients of entries of a and b.
 */
const div$1 = divide$1;
/**
 * Creates a random vector
 * @param scale - Default 1
 * @param dst - vector to hold result. If not new one is created.
 * @returns The random vector.
 */
function random(scale = 1, dst) {
  dst = dst || new VecType$1(3);
  const angle = Math.random() * 2 * Math.PI;
  const z = Math.random() * 2 - 1;
  const zScale = Math.sqrt(1 - z * z) * scale;
  dst[0] = Math.cos(angle) * zScale;
  dst[1] = Math.sin(angle) * zScale;
  dst[2] = z * scale;
  return dst;
}
/**
 * Zero's a vector
 * @param dst - vector to hold result. If not new one is created.
 * @returns The zeroed vector.
 */
function zero$1(dst) {
  dst = dst || new VecType$1(3);
  dst[0] = 0;
  dst[1] = 0;
  dst[2] = 0;
  return dst;
}
/**
 * transform vec3 by 4x4 matrix
 * @param v - the vector
 * @param m - The matrix.
 * @param dst - optional vec3 to store result. If not passed a new one is created.
 * @returns the transformed vector
 */
function transformMat4$1(v, m, dst) {
  dst = dst || new VecType$1(3);
  const x = v[0];
  const y = v[1];
  const z = v[2];
  const w = m[3] * x + m[7] * y + m[11] * z + m[15] || 1;
  dst[0] = (m[0] * x + m[4] * y + m[8] * z + m[12]) / w;
  dst[1] = (m[1] * x + m[5] * y + m[9] * z + m[13]) / w;
  dst[2] = (m[2] * x + m[6] * y + m[10] * z + m[14]) / w;
  return dst;
}
/**
 * Transform vec4 by upper 3x3 matrix inside 4x4 matrix.
 * @param v - The direction.
 * @param m - The matrix.
 * @param dst - optional Vec3 to store result. If not passed a new one is created.
 * @returns The transformed vector.
 */
function transformMat4Upper3x3(v, m, dst) {
  dst = dst || new VecType$1(3);
  const v0 = v[0];
  const v1 = v[1];
  const v2 = v[2];
  dst[0] = v0 * m[0 * 4 + 0] + v1 * m[1 * 4 + 0] + v2 * m[2 * 4 + 0];
  dst[1] = v0 * m[0 * 4 + 1] + v1 * m[1 * 4 + 1] + v2 * m[2 * 4 + 1];
  dst[2] = v0 * m[0 * 4 + 2] + v1 * m[1 * 4 + 2] + v2 * m[2 * 4 + 2];
  return dst;
}
/**
 * Transforms vec4 by 3x3 matrix
 *
 * @param v - the vector
 * @param m - The matrix.
 * @param dst - optional vec3 to store result. If not passed a new one is created.
 * @returns the transformed vector
 */
function transformMat3(v, m, dst) {
  dst = dst || new VecType$1(3);
  const x = v[0];
  const y = v[1];
  const z = v[2];
  dst[0] = x * m[0] + y * m[4] + z * m[8];
  dst[1] = x * m[1] + y * m[5] + z * m[9];
  dst[2] = x * m[2] + y * m[6] + z * m[10];
  return dst;
}
var vec3Impl = exports.vec3 = /*#__PURE__*/Object.freeze({
  __proto__: null,
  create: create$2,
  setDefaultType: setDefaultType$3,
  fromValues: fromValues$1,
  ceil: ceil$1,
  floor: floor$1,
  round: round$1,
  clamp: clamp$1,
  add: add$1,
  addScaled: addScaled$1,
  angle: angle,
  subtract: subtract$1,
  sub: sub$1,
  equalsApproximately: equalsApproximately$2,
  equals: equals$2,
  lerp: lerp$1,
  lerpV: lerpV$1,
  max: max$1,
  min: min$1,
  mulScalar: mulScalar$1,
  scale: scale$2,
  divScalar: divScalar$1,
  inverse: inverse$2,
  invert: invert$2,
  cross: cross,
  dot: dot$1,
  length: length$1,
  len: len$1,
  lengthSq: lengthSq$1,
  lenSq: lenSq$1,
  distance: distance$1,
  dist: dist$1,
  distanceSq: distanceSq$1,
  distSq: distSq$1,
  normalize: normalize$1,
  negate: negate$2,
  copy: copy$2,
  clone: clone$2,
  multiply: multiply$2,
  mul: mul$2,
  divide: divide$1,
  div: div$1,
  random: random,
  zero: zero$1,
  transformMat4: transformMat4$1,
  transformMat4Upper3x3: transformMat4Upper3x3,
  transformMat3: transformMat3
});

/**
 * 4x4 Matrix math math functions.
 *
 * Almost all functions take an optional `dst` argument. If it is not passed in the
 * functions will create a new matrix. In other words you can do this
 *
 *     const mat = mat4.translation([1, 2, 3]);  // Creates a new translation matrix
 *
 * or
 *
 *     const mat = mat4.create();
 *     mat4.translation([1, 2, 3], mat);  // Puts translation matrix in mat.
 *
 * The first style is often easier but depending on where it's used it generates garbage where
 * as there is almost never allocation with the second style.
 *
 * It is always save to pass any matrix as the destination. So for example
 *
 *     const mat = mat4.identity();
 *     const trans = mat4.translation([1, 2, 3]);
 *     mat4.multiply(mat, trans, mat);  // Multiplies mat * trans and puts result in mat.
 *
 */
let MatType = Float32Array;
/**
 * Sets the type this library creates for a Mat4
 * @param ctor - the constructor for the type. Either `Float32Array`, 'Float64Array', or `Array`
 * @returns previous constructor for Mat4
 */
function setDefaultType$2(ctor) {
  const oldType = MatType;
  MatType = ctor;
  return oldType;
}
/**
 * Create a Mat4 from values
 *
 * Note: Since passing in a raw JavaScript array
 * is valid in all circumstances, if you want to
 * force a JavaScript array into a Mat4's specified type
 * it would be faster to use
 *
 * ```
 * const m = mat4.clone(someJSArray);
 * ```
 *
 * Note: a consequence of the implementation is if your Mat4Type = `Array`
 * instead of `Float32Array` or `Float64Array` then any values you
 * don't pass in will be undefined. Usually this is not an issue since
 * (a) using `Array` is rare and (b) using `mat4.create` is usually used
 * to create a Mat4 to be filled out as in
 *
 * ```
 * const m = mat4.create();
 * mat4.perspective(fov, aspect, near, far, m);
 * ```
 *
 * @param v0 - value for element 0
 * @param v1 - value for element 1
 * @param v2 - value for element 2
 * @param v3 - value for element 3
 * @param v4 - value for element 4
 * @param v5 - value for element 5
 * @param v6 - value for element 6
 * @param v7 - value for element 7
 * @param v8 - value for element 8
 * @param v9 - value for element 9
 * @param v10 - value for element 10
 * @param v11 - value for element 11
 * @param v12 - value for element 12
 * @param v13 - value for element 13
 * @param v14 - value for element 14
 * @param v15 - value for element 15
 * @returns created from values.
 */
function create$1(v0, v1, v2, v3, v4, v5, v6, v7, v8, v9, v10, v11, v12, v13, v14, v15) {
  const dst = new MatType(16);
  if (v0 !== undefined) {
    dst[0] = v0;
    if (v1 !== undefined) {
      dst[1] = v1;
      if (v2 !== undefined) {
        dst[2] = v2;
        if (v3 !== undefined) {
          dst[3] = v3;
          if (v4 !== undefined) {
            dst[4] = v4;
            if (v5 !== undefined) {
              dst[5] = v5;
              if (v6 !== undefined) {
                dst[6] = v6;
                if (v7 !== undefined) {
                  dst[7] = v7;
                  if (v8 !== undefined) {
                    dst[8] = v8;
                    if (v9 !== undefined) {
                      dst[9] = v9;
                      if (v10 !== undefined) {
                        dst[10] = v10;
                        if (v11 !== undefined) {
                          dst[11] = v11;
                          if (v12 !== undefined) {
                            dst[12] = v12;
                            if (v13 !== undefined) {
                              dst[13] = v13;
                              if (v14 !== undefined) {
                                dst[14] = v14;
                                if (v15 !== undefined) {
                                  dst[15] = v15;
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
  return dst;
}
/**
 * Negates a matrix.
 * @param m - The matrix.
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns -m.
 */
function negate$1(m, dst) {
  dst = dst || new MatType(16);
  dst[0] = -m[0];
  dst[1] = -m[1];
  dst[2] = -m[2];
  dst[3] = -m[3];
  dst[4] = -m[4];
  dst[5] = -m[5];
  dst[6] = -m[6];
  dst[7] = -m[7];
  dst[8] = -m[8];
  dst[9] = -m[9];
  dst[10] = -m[10];
  dst[11] = -m[11];
  dst[12] = -m[12];
  dst[13] = -m[13];
  dst[14] = -m[14];
  dst[15] = -m[15];
  return dst;
}
/**
 * Copies a matrix.
 * @param m - The matrix.
 * @param dst - The matrix. If not passed a new one is created.
 * @returns A copy of m.
 */
function copy$1(m, dst) {
  dst = dst || new MatType(16);
  dst[0] = m[0];
  dst[1] = m[1];
  dst[2] = m[2];
  dst[3] = m[3];
  dst[4] = m[4];
  dst[5] = m[5];
  dst[6] = m[6];
  dst[7] = m[7];
  dst[8] = m[8];
  dst[9] = m[9];
  dst[10] = m[10];
  dst[11] = m[11];
  dst[12] = m[12];
  dst[13] = m[13];
  dst[14] = m[14];
  dst[15] = m[15];
  return dst;
}
/**
 * Copies a matrix (same as copy)
 * @param m - The matrix.
 * @param dst - The matrix. If not passed a new one is created.
 * @returns A copy of m.
 */
const clone$1 = copy$1;
/**
 * Check if 2 matrices are approximately equal
 * @param a - Operand matrix.
 * @param b - Operand matrix.
 * @returns true if matrices are approximately equal
 */
function equalsApproximately$1(a, b) {
  return Math.abs(a[0] - b[0]) < EPSILON && Math.abs(a[1] - b[1]) < EPSILON && Math.abs(a[2] - b[2]) < EPSILON && Math.abs(a[3] - b[3]) < EPSILON && Math.abs(a[4] - b[4]) < EPSILON && Math.abs(a[5] - b[5]) < EPSILON && Math.abs(a[6] - b[6]) < EPSILON && Math.abs(a[7] - b[7]) < EPSILON && Math.abs(a[8] - b[8]) < EPSILON && Math.abs(a[9] - b[9]) < EPSILON && Math.abs(a[10] - b[10]) < EPSILON && Math.abs(a[11] - b[11]) < EPSILON && Math.abs(a[12] - b[12]) < EPSILON && Math.abs(a[13] - b[13]) < EPSILON && Math.abs(a[14] - b[14]) < EPSILON && Math.abs(a[15] - b[15]) < EPSILON;
}
/**
 * Check if 2 matrices are exactly equal
 * @param a - Operand matrix.
 * @param b - Operand matrix.
 * @returns true if matrices are exactly equal
 */
function equals$1(a, b) {
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3] && a[4] === b[4] && a[5] === b[5] && a[6] === b[6] && a[7] === b[7] && a[8] === b[8] && a[9] === b[9] && a[10] === b[10] && a[11] === b[11] && a[12] === b[12] && a[13] === b[13] && a[14] === b[14] && a[15] === b[15];
}
/**
 * Creates a 4-by-4 identity matrix.
 *
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns A 4-by-4 identity matrix.
 */
function identity(dst) {
  dst = dst || new MatType(16);
  dst[0] = 1;
  dst[1] = 0;
  dst[2] = 0;
  dst[3] = 0;
  dst[4] = 0;
  dst[5] = 1;
  dst[6] = 0;
  dst[7] = 0;
  dst[8] = 0;
  dst[9] = 0;
  dst[10] = 1;
  dst[11] = 0;
  dst[12] = 0;
  dst[13] = 0;
  dst[14] = 0;
  dst[15] = 1;
  return dst;
}
/**
 * Takes the transpose of a matrix.
 * @param m - The matrix.
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns The transpose of m.
 */
function transpose(m, dst) {
  dst = dst || new MatType(16);
  if (dst === m) {
    let t;
    t = m[1];
    m[1] = m[4];
    m[4] = t;
    t = m[2];
    m[2] = m[8];
    m[8] = t;
    t = m[3];
    m[3] = m[12];
    m[12] = t;
    t = m[6];
    m[6] = m[9];
    m[9] = t;
    t = m[7];
    m[7] = m[13];
    m[13] = t;
    t = m[11];
    m[11] = m[14];
    m[14] = t;
    return dst;
  }
  const m00 = m[0 * 4 + 0];
  const m01 = m[0 * 4 + 1];
  const m02 = m[0 * 4 + 2];
  const m03 = m[0 * 4 + 3];
  const m10 = m[1 * 4 + 0];
  const m11 = m[1 * 4 + 1];
  const m12 = m[1 * 4 + 2];
  const m13 = m[1 * 4 + 3];
  const m20 = m[2 * 4 + 0];
  const m21 = m[2 * 4 + 1];
  const m22 = m[2 * 4 + 2];
  const m23 = m[2 * 4 + 3];
  const m30 = m[3 * 4 + 0];
  const m31 = m[3 * 4 + 1];
  const m32 = m[3 * 4 + 2];
  const m33 = m[3 * 4 + 3];
  dst[0] = m00;
  dst[1] = m10;
  dst[2] = m20;
  dst[3] = m30;
  dst[4] = m01;
  dst[5] = m11;
  dst[6] = m21;
  dst[7] = m31;
  dst[8] = m02;
  dst[9] = m12;
  dst[10] = m22;
  dst[11] = m32;
  dst[12] = m03;
  dst[13] = m13;
  dst[14] = m23;
  dst[15] = m33;
  return dst;
}
/**
 * Computes the inverse of a 4-by-4 matrix.
 * @param m - The matrix.
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns The inverse of m.
 */
function inverse$1(m, dst) {
  dst = dst || new MatType(16);
  const m00 = m[0 * 4 + 0];
  const m01 = m[0 * 4 + 1];
  const m02 = m[0 * 4 + 2];
  const m03 = m[0 * 4 + 3];
  const m10 = m[1 * 4 + 0];
  const m11 = m[1 * 4 + 1];
  const m12 = m[1 * 4 + 2];
  const m13 = m[1 * 4 + 3];
  const m20 = m[2 * 4 + 0];
  const m21 = m[2 * 4 + 1];
  const m22 = m[2 * 4 + 2];
  const m23 = m[2 * 4 + 3];
  const m30 = m[3 * 4 + 0];
  const m31 = m[3 * 4 + 1];
  const m32 = m[3 * 4 + 2];
  const m33 = m[3 * 4 + 3];
  const tmp0 = m22 * m33;
  const tmp1 = m32 * m23;
  const tmp2 = m12 * m33;
  const tmp3 = m32 * m13;
  const tmp4 = m12 * m23;
  const tmp5 = m22 * m13;
  const tmp6 = m02 * m33;
  const tmp7 = m32 * m03;
  const tmp8 = m02 * m23;
  const tmp9 = m22 * m03;
  const tmp10 = m02 * m13;
  const tmp11 = m12 * m03;
  const tmp12 = m20 * m31;
  const tmp13 = m30 * m21;
  const tmp14 = m10 * m31;
  const tmp15 = m30 * m11;
  const tmp16 = m10 * m21;
  const tmp17 = m20 * m11;
  const tmp18 = m00 * m31;
  const tmp19 = m30 * m01;
  const tmp20 = m00 * m21;
  const tmp21 = m20 * m01;
  const tmp22 = m00 * m11;
  const tmp23 = m10 * m01;
  const t0 = tmp0 * m11 + tmp3 * m21 + tmp4 * m31 - (tmp1 * m11 + tmp2 * m21 + tmp5 * m31);
  const t1 = tmp1 * m01 + tmp6 * m21 + tmp9 * m31 - (tmp0 * m01 + tmp7 * m21 + tmp8 * m31);
  const t2 = tmp2 * m01 + tmp7 * m11 + tmp10 * m31 - (tmp3 * m01 + tmp6 * m11 + tmp11 * m31);
  const t3 = tmp5 * m01 + tmp8 * m11 + tmp11 * m21 - (tmp4 * m01 + tmp9 * m11 + tmp10 * m21);
  const d = 1 / (m00 * t0 + m10 * t1 + m20 * t2 + m30 * t3);
  dst[0] = d * t0;
  dst[1] = d * t1;
  dst[2] = d * t2;
  dst[3] = d * t3;
  dst[4] = d * (tmp1 * m10 + tmp2 * m20 + tmp5 * m30 - (tmp0 * m10 + tmp3 * m20 + tmp4 * m30));
  dst[5] = d * (tmp0 * m00 + tmp7 * m20 + tmp8 * m30 - (tmp1 * m00 + tmp6 * m20 + tmp9 * m30));
  dst[6] = d * (tmp3 * m00 + tmp6 * m10 + tmp11 * m30 - (tmp2 * m00 + tmp7 * m10 + tmp10 * m30));
  dst[7] = d * (tmp4 * m00 + tmp9 * m10 + tmp10 * m20 - (tmp5 * m00 + tmp8 * m10 + tmp11 * m20));
  dst[8] = d * (tmp12 * m13 + tmp15 * m23 + tmp16 * m33 - (tmp13 * m13 + tmp14 * m23 + tmp17 * m33));
  dst[9] = d * (tmp13 * m03 + tmp18 * m23 + tmp21 * m33 - (tmp12 * m03 + tmp19 * m23 + tmp20 * m33));
  dst[10] = d * (tmp14 * m03 + tmp19 * m13 + tmp22 * m33 - (tmp15 * m03 + tmp18 * m13 + tmp23 * m33));
  dst[11] = d * (tmp17 * m03 + tmp20 * m13 + tmp23 * m23 - (tmp16 * m03 + tmp21 * m13 + tmp22 * m23));
  dst[12] = d * (tmp14 * m22 + tmp17 * m32 + tmp13 * m12 - (tmp16 * m32 + tmp12 * m12 + tmp15 * m22));
  dst[13] = d * (tmp20 * m32 + tmp12 * m02 + tmp19 * m22 - (tmp18 * m22 + tmp21 * m32 + tmp13 * m02));
  dst[14] = d * (tmp18 * m12 + tmp23 * m32 + tmp15 * m02 - (tmp22 * m32 + tmp14 * m02 + tmp19 * m12));
  dst[15] = d * (tmp22 * m22 + tmp16 * m02 + tmp21 * m12 - (tmp20 * m12 + tmp23 * m22 + tmp17 * m02));
  return dst;
}
/**
 * Compute the determinant of a matrix
 * @param m - the matrix
 * @returns the determinant
 */
function determinant(m) {
  const m00 = m[0 * 4 + 0];
  const m01 = m[0 * 4 + 1];
  const m02 = m[0 * 4 + 2];
  const m03 = m[0 * 4 + 3];
  const m10 = m[1 * 4 + 0];
  const m11 = m[1 * 4 + 1];
  const m12 = m[1 * 4 + 2];
  const m13 = m[1 * 4 + 3];
  const m20 = m[2 * 4 + 0];
  const m21 = m[2 * 4 + 1];
  const m22 = m[2 * 4 + 2];
  const m23 = m[2 * 4 + 3];
  const m30 = m[3 * 4 + 0];
  const m31 = m[3 * 4 + 1];
  const m32 = m[3 * 4 + 2];
  const m33 = m[3 * 4 + 3];
  const tmp0 = m22 * m33;
  const tmp1 = m32 * m23;
  const tmp2 = m12 * m33;
  const tmp3 = m32 * m13;
  const tmp4 = m12 * m23;
  const tmp5 = m22 * m13;
  const tmp6 = m02 * m33;
  const tmp7 = m32 * m03;
  const tmp8 = m02 * m23;
  const tmp9 = m22 * m03;
  const tmp10 = m02 * m13;
  const tmp11 = m12 * m03;
  const t0 = tmp0 * m11 + tmp3 * m21 + tmp4 * m31 - (tmp1 * m11 + tmp2 * m21 + tmp5 * m31);
  const t1 = tmp1 * m01 + tmp6 * m21 + tmp9 * m31 - (tmp0 * m01 + tmp7 * m21 + tmp8 * m31);
  const t2 = tmp2 * m01 + tmp7 * m11 + tmp10 * m31 - (tmp3 * m01 + tmp6 * m11 + tmp11 * m31);
  const t3 = tmp5 * m01 + tmp8 * m11 + tmp11 * m21 - (tmp4 * m01 + tmp9 * m11 + tmp10 * m21);
  return m00 * t0 + m10 * t1 + m20 * t2 + m30 * t3;
}
/**
 * Computes the inverse of a 4-by-4 matrix. (same as inverse)
 * @param m - The matrix.
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns The inverse of m.
 */
const invert$1 = inverse$1;
/**
 * Multiplies two 4-by-4 matrices with a on the left and b on the right
 * @param a - The matrix on the left.
 * @param b - The matrix on the right.
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns The matrix product of a and b.
 */
function multiply$1(a, b, dst) {
  dst = dst || new MatType(16);
  const a00 = a[0];
  const a01 = a[1];
  const a02 = a[2];
  const a03 = a[3];
  const a10 = a[4 + 0];
  const a11 = a[4 + 1];
  const a12 = a[4 + 2];
  const a13 = a[4 + 3];
  const a20 = a[8 + 0];
  const a21 = a[8 + 1];
  const a22 = a[8 + 2];
  const a23 = a[8 + 3];
  const a30 = a[12 + 0];
  const a31 = a[12 + 1];
  const a32 = a[12 + 2];
  const a33 = a[12 + 3];
  const b00 = b[0];
  const b01 = b[1];
  const b02 = b[2];
  const b03 = b[3];
  const b10 = b[4 + 0];
  const b11 = b[4 + 1];
  const b12 = b[4 + 2];
  const b13 = b[4 + 3];
  const b20 = b[8 + 0];
  const b21 = b[8 + 1];
  const b22 = b[8 + 2];
  const b23 = b[8 + 3];
  const b30 = b[12 + 0];
  const b31 = b[12 + 1];
  const b32 = b[12 + 2];
  const b33 = b[12 + 3];
  dst[0] = a00 * b00 + a10 * b01 + a20 * b02 + a30 * b03;
  dst[1] = a01 * b00 + a11 * b01 + a21 * b02 + a31 * b03;
  dst[2] = a02 * b00 + a12 * b01 + a22 * b02 + a32 * b03;
  dst[3] = a03 * b00 + a13 * b01 + a23 * b02 + a33 * b03;
  dst[4] = a00 * b10 + a10 * b11 + a20 * b12 + a30 * b13;
  dst[5] = a01 * b10 + a11 * b11 + a21 * b12 + a31 * b13;
  dst[6] = a02 * b10 + a12 * b11 + a22 * b12 + a32 * b13;
  dst[7] = a03 * b10 + a13 * b11 + a23 * b12 + a33 * b13;
  dst[8] = a00 * b20 + a10 * b21 + a20 * b22 + a30 * b23;
  dst[9] = a01 * b20 + a11 * b21 + a21 * b22 + a31 * b23;
  dst[10] = a02 * b20 + a12 * b21 + a22 * b22 + a32 * b23;
  dst[11] = a03 * b20 + a13 * b21 + a23 * b22 + a33 * b23;
  dst[12] = a00 * b30 + a10 * b31 + a20 * b32 + a30 * b33;
  dst[13] = a01 * b30 + a11 * b31 + a21 * b32 + a31 * b33;
  dst[14] = a02 * b30 + a12 * b31 + a22 * b32 + a32 * b33;
  dst[15] = a03 * b30 + a13 * b31 + a23 * b32 + a33 * b33;
  return dst;
}
/**
 * Multiplies two 4-by-4 matrices with a on the left and b on the right (same as multiply)
 * @param a - The matrix on the left.
 * @param b - The matrix on the right.
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns The matrix product of a and b.
 */
const mul$1 = multiply$1;
/**
 * Sets the translation component of a 4-by-4 matrix to the given
 * vector.
 * @param a - The matrix.
 * @param v - The vector.
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns The matrix with translation set.
 */
function setTranslation(a, v, dst) {
  dst = dst || identity();
  if (a !== dst) {
    dst[0] = a[0];
    dst[1] = a[1];
    dst[2] = a[2];
    dst[3] = a[3];
    dst[4] = a[4];
    dst[5] = a[5];
    dst[6] = a[6];
    dst[7] = a[7];
    dst[8] = a[8];
    dst[9] = a[9];
    dst[10] = a[10];
    dst[11] = a[11];
  }
  dst[12] = v[0];
  dst[13] = v[1];
  dst[14] = v[2];
  dst[15] = 1;
  return dst;
}
/**
 * Returns the translation component of a 4-by-4 matrix as a vector with 3
 * entries.
 * @param m - The matrix.
 * @param dst - vector to hold result. If not passed a new one is created.
 * @returns The translation component of m.
 */
function getTranslation(m, dst) {
  dst = dst || create$2();
  dst[0] = m[12];
  dst[1] = m[13];
  dst[2] = m[14];
  return dst;
}
/**
 * Returns an axis of a 4x4 matrix as a vector with 3 entries
 * @param m - The matrix.
 * @param axis - The axis 0 = x, 1 = y, 2 = z;
 * @returns The axis component of m.
 */
function getAxis(m, axis, dst) {
  dst = dst || create$2();
  const off = axis * 4;
  dst[0] = m[off + 0];
  dst[1] = m[off + 1];
  dst[2] = m[off + 2];
  return dst;
}
/**
 * Sets an axis of a 4x4 matrix as a vector with 3 entries
 * @param m - The matrix.
 * @param v - the axis vector
 * @param axis - The axis  0 = x, 1 = y, 2 = z;
 * @param dst - The matrix to set. If not passed a new one is created.
 * @returns The matrix with axis set.
 */
function setAxis(a, v, axis, dst) {
  if (dst !== a) {
    dst = copy$1(a, dst);
  }
  const off = axis * 4;
  dst[off + 0] = v[0];
  dst[off + 1] = v[1];
  dst[off + 2] = v[2];
  return dst;
}
/**
 * Returns the scaling component of the matrix
 * @param m - The Matrix
 * @param dst - The vector to set. If not passed a new one is created.
 */
function getScaling(m, dst) {
  dst = dst || create$2();
  const xx = m[0];
  const xy = m[1];
  const xz = m[2];
  const yx = m[4];
  const yy = m[5];
  const yz = m[6];
  const zx = m[8];
  const zy = m[9];
  const zz = m[10];
  dst[0] = Math.sqrt(xx * xx + xy * xy + xz * xz);
  dst[1] = Math.sqrt(yx * yx + yy * yy + yz * yz);
  dst[2] = Math.sqrt(zx * zx + zy * zy + zz * zz);
  return dst;
}
/**
 * Computes a 4-by-4 perspective transformation matrix given the angular height
 * of the frustum, the aspect ratio, and the near and far clipping planes.  The
 * arguments define a frustum extending in the negative z direction.  The given
 * angle is the vertical angle of the frustum, and the horizontal angle is
 * determined to produce the given aspect ratio.  The arguments near and far are
 * the distances to the near and far clipping planes.  Note that near and far
 * are not z coordinates, but rather they are distances along the negative
 * z-axis.  The matrix generated sends the viewing frustum to the unit box.
 * We assume a unit box extending from -1 to 1 in the x and y dimensions and
 * from 0 to 1 in the z dimension.
 * @param fieldOfViewYInRadians - The camera angle from top to bottom (in radians).
 * @param aspect - The aspect ratio width / height.
 * @param zNear - The depth (negative z coordinate)
 *     of the near clipping plane.
 * @param zFar - The depth (negative z coordinate)
 *     of the far clipping plane.
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns The perspective matrix.
 */
function perspective(fieldOfViewYInRadians, aspect, zNear, zFar, dst) {
  dst = dst || new MatType(16);
  const f = Math.tan(Math.PI * 0.5 - 0.5 * fieldOfViewYInRadians);
  const rangeInv = 1 / (zNear - zFar);
  dst[0] = f / aspect;
  dst[1] = 0;
  dst[2] = 0;
  dst[3] = 0;
  dst[4] = 0;
  dst[5] = f;
  dst[6] = 0;
  dst[7] = 0;
  dst[8] = 0;
  dst[9] = 0;
  dst[10] = zFar * rangeInv;
  dst[11] = -1;
  dst[12] = 0;
  dst[13] = 0;
  dst[14] = zNear * zFar * rangeInv;
  dst[15] = 0;
  return dst;
}
/**
 * Computes a 4-by-4 orthogonal transformation matrix that transforms from
 * the given the left, right, bottom, and top dimensions to -1 +1 in x, and y
 * and 0 to +1 in z.
 * @param left - Left side of the near clipping plane viewport.
 * @param right - Right side of the near clipping plane viewport.
 * @param bottom - Bottom of the near clipping plane viewport.
 * @param top - Top of the near clipping plane viewport.
 * @param near - The depth (negative z coordinate)
 *     of the near clipping plane.
 * @param far - The depth (negative z coordinate)
 *     of the far clipping plane.
 * @param dst - Output matrix. If not passed a new one is created.
 * @returns The perspective matrix.
 */
function ortho(left, right, bottom, top, near, far, dst) {
  dst = dst || new MatType(16);
  dst[0] = 2 / (right - left);
  dst[1] = 0;
  dst[2] = 0;
  dst[3] = 0;
  dst[4] = 0;
  dst[5] = 2 / (top - bottom);
  dst[6] = 0;
  dst[7] = 0;
  dst[8] = 0;
  dst[9] = 0;
  dst[10] = 1 / (near - far);
  dst[11] = 0;
  dst[12] = (right + left) / (left - right);
  dst[13] = (top + bottom) / (bottom - top);
  dst[14] = near / (near - far);
  dst[15] = 1;
  return dst;
}
/**
 * Computes a 4-by-4 perspective transformation matrix given the left, right,
 * top, bottom, near and far clipping planes. The arguments define a frustum
 * extending in the negative z direction. The arguments near and far are the
 * distances to the near and far clipping planes. Note that near and far are not
 * z coordinates, but rather they are distances along the negative z-axis. The
 * matrix generated sends the viewing frustum to the unit box. We assume a unit
 * box extending from -1 to 1 in the x and y dimensions and from 0 to 1 in the z
 * dimension.
 * @param left - The x coordinate of the left plane of the box.
 * @param right - The x coordinate of the right plane of the box.
 * @param bottom - The y coordinate of the bottom plane of the box.
 * @param top - The y coordinate of the right plane of the box.
 * @param near - The negative z coordinate of the near plane of the box.
 * @param far - The negative z coordinate of the far plane of the box.
 * @param dst - Output matrix. If not passed a new one is created.
 * @returns The perspective projection matrix.
 */
function frustum(left, right, bottom, top, near, far, dst) {
  dst = dst || new MatType(16);
  const dx = right - left;
  const dy = top - bottom;
  const dz = near - far;
  dst[0] = 2 * near / dx;
  dst[1] = 0;
  dst[2] = 0;
  dst[3] = 0;
  dst[4] = 0;
  dst[5] = 2 * near / dy;
  dst[6] = 0;
  dst[7] = 0;
  dst[8] = (left + right) / dx;
  dst[9] = (top + bottom) / dy;
  dst[10] = far / dz;
  dst[11] = -1;
  dst[12] = 0;
  dst[13] = 0;
  dst[14] = near * far / dz;
  dst[15] = 0;
  return dst;
}
let xAxis;
let yAxis;
let zAxis;
/**
 * Computes a 4-by-4 look-at transformation.
 *
 * This is a matrix which positions the camera itself. If you want
 * a view matrix (a matrix which moves things in front of the camera)
 * take the inverse of this.
 *
 * @param eye - The position of the eye.
 * @param target - The position meant to be viewed.
 * @param up - A vector pointing up.
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns The look-at matrix.
 */
function lookAt(eye, target, up, dst) {
  dst = dst || new MatType(16);
  xAxis = xAxis || create$2();
  yAxis = yAxis || create$2();
  zAxis = zAxis || create$2();
  normalize$1(subtract$1(eye, target, zAxis), zAxis);
  normalize$1(cross(up, zAxis, xAxis), xAxis);
  normalize$1(cross(zAxis, xAxis, yAxis), yAxis);
  dst[0] = xAxis[0];
  dst[1] = xAxis[1];
  dst[2] = xAxis[2];
  dst[3] = 0;
  dst[4] = yAxis[0];
  dst[5] = yAxis[1];
  dst[6] = yAxis[2];
  dst[7] = 0;
  dst[8] = zAxis[0];
  dst[9] = zAxis[1];
  dst[10] = zAxis[2];
  dst[11] = 0;
  dst[12] = eye[0];
  dst[13] = eye[1];
  dst[14] = eye[2];
  dst[15] = 1;
  return dst;
}
/**
 * Creates a 4-by-4 matrix which translates by the given vector v.
 * @param v - The vector by
 *     which to translate.
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns The translation matrix.
 */
function translation(v, dst) {
  dst = dst || new MatType(16);
  dst[0] = 1;
  dst[1] = 0;
  dst[2] = 0;
  dst[3] = 0;
  dst[4] = 0;
  dst[5] = 1;
  dst[6] = 0;
  dst[7] = 0;
  dst[8] = 0;
  dst[9] = 0;
  dst[10] = 1;
  dst[11] = 0;
  dst[12] = v[0];
  dst[13] = v[1];
  dst[14] = v[2];
  dst[15] = 1;
  return dst;
}
/**
 * Translates the given 4-by-4 matrix by the given vector v.
 * @param m - The matrix.
 * @param v - The vector by
 *     which to translate.
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns The translated matrix.
 */
function translate(m, v, dst) {
  dst = dst || new MatType(16);
  const v0 = v[0];
  const v1 = v[1];
  const v2 = v[2];
  const m00 = m[0];
  const m01 = m[1];
  const m02 = m[2];
  const m03 = m[3];
  const m10 = m[1 * 4 + 0];
  const m11 = m[1 * 4 + 1];
  const m12 = m[1 * 4 + 2];
  const m13 = m[1 * 4 + 3];
  const m20 = m[2 * 4 + 0];
  const m21 = m[2 * 4 + 1];
  const m22 = m[2 * 4 + 2];
  const m23 = m[2 * 4 + 3];
  const m30 = m[3 * 4 + 0];
  const m31 = m[3 * 4 + 1];
  const m32 = m[3 * 4 + 2];
  const m33 = m[3 * 4 + 3];
  if (m !== dst) {
    dst[0] = m00;
    dst[1] = m01;
    dst[2] = m02;
    dst[3] = m03;
    dst[4] = m10;
    dst[5] = m11;
    dst[6] = m12;
    dst[7] = m13;
    dst[8] = m20;
    dst[9] = m21;
    dst[10] = m22;
    dst[11] = m23;
  }
  dst[12] = m00 * v0 + m10 * v1 + m20 * v2 + m30;
  dst[13] = m01 * v0 + m11 * v1 + m21 * v2 + m31;
  dst[14] = m02 * v0 + m12 * v1 + m22 * v2 + m32;
  dst[15] = m03 * v0 + m13 * v1 + m23 * v2 + m33;
  return dst;
}
/**
 * Creates a 4-by-4 matrix which rotates around the x-axis by the given angle.
 * @param angleInRadians - The angle by which to rotate (in radians).
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns The rotation matrix.
 */
function rotationX(angleInRadians, dst) {
  dst = dst || new MatType(16);
  const c = Math.cos(angleInRadians);
  const s = Math.sin(angleInRadians);
  dst[0] = 1;
  dst[1] = 0;
  dst[2] = 0;
  dst[3] = 0;
  dst[4] = 0;
  dst[5] = c;
  dst[6] = s;
  dst[7] = 0;
  dst[8] = 0;
  dst[9] = -s;
  dst[10] = c;
  dst[11] = 0;
  dst[12] = 0;
  dst[13] = 0;
  dst[14] = 0;
  dst[15] = 1;
  return dst;
}
/**
 * Rotates the given 4-by-4 matrix around the x-axis by the given
 * angle.
 * @param m - The matrix.
 * @param angleInRadians - The angle by which to rotate (in radians).
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns The rotated matrix.
 */
function rotateX(m, angleInRadians, dst) {
  dst = dst || new MatType(16);
  const m10 = m[4];
  const m11 = m[5];
  const m12 = m[6];
  const m13 = m[7];
  const m20 = m[8];
  const m21 = m[9];
  const m22 = m[10];
  const m23 = m[11];
  const c = Math.cos(angleInRadians);
  const s = Math.sin(angleInRadians);
  dst[4] = c * m10 + s * m20;
  dst[5] = c * m11 + s * m21;
  dst[6] = c * m12 + s * m22;
  dst[7] = c * m13 + s * m23;
  dst[8] = c * m20 - s * m10;
  dst[9] = c * m21 - s * m11;
  dst[10] = c * m22 - s * m12;
  dst[11] = c * m23 - s * m13;
  if (m !== dst) {
    dst[0] = m[0];
    dst[1] = m[1];
    dst[2] = m[2];
    dst[3] = m[3];
    dst[12] = m[12];
    dst[13] = m[13];
    dst[14] = m[14];
    dst[15] = m[15];
  }
  return dst;
}
/**
 * Creates a 4-by-4 matrix which rotates around the y-axis by the given angle.
 * @param angleInRadians - The angle by which to rotate (in radians).
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns The rotation matrix.
 */
function rotationY(angleInRadians, dst) {
  dst = dst || new MatType(16);
  const c = Math.cos(angleInRadians);
  const s = Math.sin(angleInRadians);
  dst[0] = c;
  dst[1] = 0;
  dst[2] = -s;
  dst[3] = 0;
  dst[4] = 0;
  dst[5] = 1;
  dst[6] = 0;
  dst[7] = 0;
  dst[8] = s;
  dst[9] = 0;
  dst[10] = c;
  dst[11] = 0;
  dst[12] = 0;
  dst[13] = 0;
  dst[14] = 0;
  dst[15] = 1;
  return dst;
}
/**
 * Rotates the given 4-by-4 matrix around the y-axis by the given
 * angle.
 * @param m - The matrix.
 * @param angleInRadians - The angle by which to rotate (in radians).
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns The rotated matrix.
 */
function rotateY(m, angleInRadians, dst) {
  dst = dst || new MatType(16);
  const m00 = m[0 * 4 + 0];
  const m01 = m[0 * 4 + 1];
  const m02 = m[0 * 4 + 2];
  const m03 = m[0 * 4 + 3];
  const m20 = m[2 * 4 + 0];
  const m21 = m[2 * 4 + 1];
  const m22 = m[2 * 4 + 2];
  const m23 = m[2 * 4 + 3];
  const c = Math.cos(angleInRadians);
  const s = Math.sin(angleInRadians);
  dst[0] = c * m00 - s * m20;
  dst[1] = c * m01 - s * m21;
  dst[2] = c * m02 - s * m22;
  dst[3] = c * m03 - s * m23;
  dst[8] = c * m20 + s * m00;
  dst[9] = c * m21 + s * m01;
  dst[10] = c * m22 + s * m02;
  dst[11] = c * m23 + s * m03;
  if (m !== dst) {
    dst[4] = m[4];
    dst[5] = m[5];
    dst[6] = m[6];
    dst[7] = m[7];
    dst[12] = m[12];
    dst[13] = m[13];
    dst[14] = m[14];
    dst[15] = m[15];
  }
  return dst;
}
/**
 * Creates a 4-by-4 matrix which rotates around the z-axis by the given angle.
 * @param angleInRadians - The angle by which to rotate (in radians).
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns The rotation matrix.
 */
function rotationZ(angleInRadians, dst) {
  dst = dst || new MatType(16);
  const c = Math.cos(angleInRadians);
  const s = Math.sin(angleInRadians);
  dst[0] = c;
  dst[1] = s;
  dst[2] = 0;
  dst[3] = 0;
  dst[4] = -s;
  dst[5] = c;
  dst[6] = 0;
  dst[7] = 0;
  dst[8] = 0;
  dst[9] = 0;
  dst[10] = 1;
  dst[11] = 0;
  dst[12] = 0;
  dst[13] = 0;
  dst[14] = 0;
  dst[15] = 1;
  return dst;
}
/**
 * Rotates the given 4-by-4 matrix around the z-axis by the given
 * angle.
 * @param m - The matrix.
 * @param angleInRadians - The angle by which to rotate (in radians).
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns The rotated matrix.
 */
function rotateZ(m, angleInRadians, dst) {
  dst = dst || new MatType(16);
  const m00 = m[0 * 4 + 0];
  const m01 = m[0 * 4 + 1];
  const m02 = m[0 * 4 + 2];
  const m03 = m[0 * 4 + 3];
  const m10 = m[1 * 4 + 0];
  const m11 = m[1 * 4 + 1];
  const m12 = m[1 * 4 + 2];
  const m13 = m[1 * 4 + 3];
  const c = Math.cos(angleInRadians);
  const s = Math.sin(angleInRadians);
  dst[0] = c * m00 + s * m10;
  dst[1] = c * m01 + s * m11;
  dst[2] = c * m02 + s * m12;
  dst[3] = c * m03 + s * m13;
  dst[4] = c * m10 - s * m00;
  dst[5] = c * m11 - s * m01;
  dst[6] = c * m12 - s * m02;
  dst[7] = c * m13 - s * m03;
  if (m !== dst) {
    dst[8] = m[8];
    dst[9] = m[9];
    dst[10] = m[10];
    dst[11] = m[11];
    dst[12] = m[12];
    dst[13] = m[13];
    dst[14] = m[14];
    dst[15] = m[15];
  }
  return dst;
}
/**
 * Creates a 4-by-4 matrix which rotates around the given axis by the given
 * angle.
 * @param axis - The axis
 *     about which to rotate.
 * @param angleInRadians - The angle by which to rotate (in radians).
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns A matrix which rotates angle radians
 *     around the axis.
 */
function axisRotation(axis, angleInRadians, dst) {
  dst = dst || new MatType(16);
  let x = axis[0];
  let y = axis[1];
  let z = axis[2];
  const n = Math.sqrt(x * x + y * y + z * z);
  x /= n;
  y /= n;
  z /= n;
  const xx = x * x;
  const yy = y * y;
  const zz = z * z;
  const c = Math.cos(angleInRadians);
  const s = Math.sin(angleInRadians);
  const oneMinusCosine = 1 - c;
  dst[0] = xx + (1 - xx) * c;
  dst[1] = x * y * oneMinusCosine + z * s;
  dst[2] = x * z * oneMinusCosine - y * s;
  dst[3] = 0;
  dst[4] = x * y * oneMinusCosine - z * s;
  dst[5] = yy + (1 - yy) * c;
  dst[6] = y * z * oneMinusCosine + x * s;
  dst[7] = 0;
  dst[8] = x * z * oneMinusCosine + y * s;
  dst[9] = y * z * oneMinusCosine - x * s;
  dst[10] = zz + (1 - zz) * c;
  dst[11] = 0;
  dst[12] = 0;
  dst[13] = 0;
  dst[14] = 0;
  dst[15] = 1;
  return dst;
}
/**
 * Creates a 4-by-4 matrix which rotates around the given axis by the given
 * angle. (same as axisRotation)
 * @param axis - The axis
 *     about which to rotate.
 * @param angleInRadians - The angle by which to rotate (in radians).
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns A matrix which rotates angle radians
 *     around the axis.
 */
const rotation = axisRotation;
/**
 * Rotates the given 4-by-4 matrix around the given axis by the
 * given angle.
 * @param m - The matrix.
 * @param axis - The axis
 *     about which to rotate.
 * @param angleInRadians - The angle by which to rotate (in radians).
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns The rotated matrix.
 */
function axisRotate(m, axis, angleInRadians, dst) {
  dst = dst || new MatType(16);
  let x = axis[0];
  let y = axis[1];
  let z = axis[2];
  const n = Math.sqrt(x * x + y * y + z * z);
  x /= n;
  y /= n;
  z /= n;
  const xx = x * x;
  const yy = y * y;
  const zz = z * z;
  const c = Math.cos(angleInRadians);
  const s = Math.sin(angleInRadians);
  const oneMinusCosine = 1 - c;
  const r00 = xx + (1 - xx) * c;
  const r01 = x * y * oneMinusCosine + z * s;
  const r02 = x * z * oneMinusCosine - y * s;
  const r10 = x * y * oneMinusCosine - z * s;
  const r11 = yy + (1 - yy) * c;
  const r12 = y * z * oneMinusCosine + x * s;
  const r20 = x * z * oneMinusCosine + y * s;
  const r21 = y * z * oneMinusCosine - x * s;
  const r22 = zz + (1 - zz) * c;
  const m00 = m[0];
  const m01 = m[1];
  const m02 = m[2];
  const m03 = m[3];
  const m10 = m[4];
  const m11 = m[5];
  const m12 = m[6];
  const m13 = m[7];
  const m20 = m[8];
  const m21 = m[9];
  const m22 = m[10];
  const m23 = m[11];
  dst[0] = r00 * m00 + r01 * m10 + r02 * m20;
  dst[1] = r00 * m01 + r01 * m11 + r02 * m21;
  dst[2] = r00 * m02 + r01 * m12 + r02 * m22;
  dst[3] = r00 * m03 + r01 * m13 + r02 * m23;
  dst[4] = r10 * m00 + r11 * m10 + r12 * m20;
  dst[5] = r10 * m01 + r11 * m11 + r12 * m21;
  dst[6] = r10 * m02 + r11 * m12 + r12 * m22;
  dst[7] = r10 * m03 + r11 * m13 + r12 * m23;
  dst[8] = r20 * m00 + r21 * m10 + r22 * m20;
  dst[9] = r20 * m01 + r21 * m11 + r22 * m21;
  dst[10] = r20 * m02 + r21 * m12 + r22 * m22;
  dst[11] = r20 * m03 + r21 * m13 + r22 * m23;
  if (m !== dst) {
    dst[12] = m[12];
    dst[13] = m[13];
    dst[14] = m[14];
    dst[15] = m[15];
  }
  return dst;
}
/**
 * Rotates the given 4-by-4 matrix around the given axis by the
 * given angle. (same as rotate)
 * @param m - The matrix.
 * @param axis - The axis
 *     about which to rotate.
 * @param angleInRadians - The angle by which to rotate (in radians).
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns The rotated matrix.
 */
const rotate = axisRotate;
/**
 * Creates a 4-by-4 matrix which scales in each dimension by an amount given by
 * the corresponding entry in the given vector; assumes the vector has three
 * entries.
 * @param v - A vector of
 *     three entries specifying the factor by which to scale in each dimension.
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns The scaling matrix.
 */
function scaling(v, dst) {
  dst = dst || new MatType(16);
  dst[0] = v[0];
  dst[1] = 0;
  dst[2] = 0;
  dst[3] = 0;
  dst[4] = 0;
  dst[5] = v[1];
  dst[6] = 0;
  dst[7] = 0;
  dst[8] = 0;
  dst[9] = 0;
  dst[10] = v[2];
  dst[11] = 0;
  dst[12] = 0;
  dst[13] = 0;
  dst[14] = 0;
  dst[15] = 1;
  return dst;
}
/**
 * Scales the given 4-by-4 matrix in each dimension by an amount
 * given by the corresponding entry in the given vector; assumes the vector has
 * three entries.
 * @param m - The matrix to be modified.
 * @param v - A vector of three entries specifying the
 *     factor by which to scale in each dimension.
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns The scaled matrix.
 */
function scale$1(m, v, dst) {
  dst = dst || new MatType(16);
  const v0 = v[0];
  const v1 = v[1];
  const v2 = v[2];
  dst[0] = v0 * m[0 * 4 + 0];
  dst[1] = v0 * m[0 * 4 + 1];
  dst[2] = v0 * m[0 * 4 + 2];
  dst[3] = v0 * m[0 * 4 + 3];
  dst[4] = v1 * m[1 * 4 + 0];
  dst[5] = v1 * m[1 * 4 + 1];
  dst[6] = v1 * m[1 * 4 + 2];
  dst[7] = v1 * m[1 * 4 + 3];
  dst[8] = v2 * m[2 * 4 + 0];
  dst[9] = v2 * m[2 * 4 + 1];
  dst[10] = v2 * m[2 * 4 + 2];
  dst[11] = v2 * m[2 * 4 + 3];
  if (m !== dst) {
    dst[12] = m[12];
    dst[13] = m[13];
    dst[14] = m[14];
    dst[15] = m[15];
  }
  return dst;
}
var mat4Impl = exports.mat4 = /*#__PURE__*/Object.freeze({
  __proto__: null,
  setDefaultType: setDefaultType$2,
  create: create$1,
  negate: negate$1,
  copy: copy$1,
  clone: clone$1,
  equalsApproximately: equalsApproximately$1,
  equals: equals$1,
  identity: identity,
  transpose: transpose,
  inverse: inverse$1,
  determinant: determinant,
  invert: invert$1,
  multiply: multiply$1,
  mul: mul$1,
  setTranslation: setTranslation,
  getTranslation: getTranslation,
  getAxis: getAxis,
  setAxis: setAxis,
  getScaling: getScaling,
  perspective: perspective,
  ortho: ortho,
  frustum: frustum,
  lookAt: lookAt,
  translation: translation,
  translate: translate,
  rotationX: rotationX,
  rotateX: rotateX,
  rotationY: rotationY,
  rotateY: rotateY,
  rotationZ: rotationZ,
  rotateZ: rotateZ,
  axisRotation: axisRotation,
  rotation: rotation,
  axisRotate: axisRotate,
  rotate: rotate,
  scaling: scaling,
  scale: scale$1
});

/**
 *
 * Vec4 math functions.
 *
 * Almost all functions take an optional `dst` argument. If it is not passed in the
 * functions will create a new `Vec4`. In other words you can do this
 *
 *     const v = vec4.cross(v1, v2);  // Creates a new Vec4 with the cross product of v1 x v2.
 *
 * or
 *
 *     const v = vec4.create();
 *     vec4.cross(v1, v2, v);  // Puts the cross product of v1 x v2 in v
 *
 * The first style is often easier but depending on where it's used it generates garbage where
 * as there is almost never allocation with the second style.
 *
 * It is always safe to pass any vector as the destination. So for example
 *
 *     vec4.cross(v1, v2, v1);  // Puts the cross product of v1 x v2 in v1
 *
 */
let VecType = Float32Array;
/**
 * Sets the type this library creates for a Vec4
 * @param ctor - the constructor for the type. Either `Float32Array`, 'Float64Array', or `Array`
 * @returns previous constructor for Vec4
 */
function setDefaultType$1(ctor) {
  const oldType = VecType;
  VecType = ctor;
  return oldType;
}
/**
 * Creates a vec4; may be called with x, y, z to set initial values.
 * @param x - Initial x value.
 * @param y - Initial y value.
 * @param z - Initial z value.
 * @param w - Initial w value.
 * @returns the created vector
 */
function create(x, y, z, w) {
  const dst = new VecType(4);
  if (x !== undefined) {
    dst[0] = x;
    if (y !== undefined) {
      dst[1] = y;
      if (z !== undefined) {
        dst[2] = z;
        if (w !== undefined) {
          dst[3] = w;
        }
      }
    }
  }
  return dst;
}
/**
 * Creates a vec4; may be called with x, y, z to set initial values. (same as create)
 * @param x - Initial x value.
 * @param y - Initial y value.
 * @param z - Initial z value.
 * @param z - Initial w value.
 * @returns the created vector
 */
const fromValues = create;
/**
 * Applies Math.ceil to each element of vector
 * @param v - Operand vector.
 * @param dst - vector to hold result. If not new one is created.
 * @returns A vector that is the ceil of each element of v.
 */
function ceil(v, dst) {
  dst = dst || new VecType(4);
  dst[0] = Math.ceil(v[0]);
  dst[1] = Math.ceil(v[1]);
  dst[2] = Math.ceil(v[2]);
  dst[3] = Math.ceil(v[3]);
  return dst;
}
/**
 * Applies Math.floor to each element of vector
 * @param v - Operand vector.
 * @param dst - vector to hold result. If not new one is created.
 * @returns A vector that is the floor of each element of v.
 */
function floor(v, dst) {
  dst = dst || new VecType(4);
  dst[0] = Math.floor(v[0]);
  dst[1] = Math.floor(v[1]);
  dst[2] = Math.floor(v[2]);
  dst[3] = Math.floor(v[3]);
  return dst;
}
/**
 * Applies Math.round to each element of vector
 * @param v - Operand vector.
 * @param dst - vector to hold result. If not new one is created.
 * @returns A vector that is the round of each element of v.
 */
function round(v, dst) {
  dst = dst || new VecType(4);
  dst[0] = Math.round(v[0]);
  dst[1] = Math.round(v[1]);
  dst[2] = Math.round(v[2]);
  dst[3] = Math.round(v[3]);
  return dst;
}
/**
 * Clamp each element of vector between min and max
 * @param v - Operand vector.
 * @param max - Min value, default 0
 * @param min - Max value, default 1
 * @param dst - vector to hold result. If not new one is created.
 * @returns A vector that the clamped value of each element of v.
 */
function clamp(v, min = 0, max = 1, dst) {
  dst = dst || new VecType(4);
  dst[0] = Math.min(max, Math.max(min, v[0]));
  dst[1] = Math.min(max, Math.max(min, v[1]));
  dst[2] = Math.min(max, Math.max(min, v[2]));
  dst[3] = Math.min(max, Math.max(min, v[3]));
  return dst;
}
/**
 * Adds two vectors; assumes a and b have the same dimension.
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @param dst - vector to hold result. If not new one is created.
 * @returns A vector that is the sum of a and b.
 */
function add(a, b, dst) {
  dst = dst || new VecType(4);
  dst[0] = a[0] + b[0];
  dst[1] = a[1] + b[1];
  dst[2] = a[2] + b[2];
  dst[3] = a[3] + b[3];
  return dst;
}
/**
 * Adds two vectors, scaling the 2nd; assumes a and b have the same dimension.
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @param scale - Amount to scale b
 * @param dst - vector to hold result. If not new one is created.
 * @returns A vector that is the sum of a + b * scale.
 */
function addScaled(a, b, scale, dst) {
  dst = dst || new VecType(4);
  dst[0] = a[0] + b[0] * scale;
  dst[1] = a[1] + b[1] * scale;
  dst[2] = a[2] + b[2] * scale;
  dst[3] = a[3] + b[3] * scale;
  return dst;
}
/**
 * Subtracts two vectors.
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @param dst - vector to hold result. If not new one is created.
 * @returns A vector that is the difference of a and b.
 */
function subtract(a, b, dst) {
  dst = dst || new VecType(4);
  dst[0] = a[0] - b[0];
  dst[1] = a[1] - b[1];
  dst[2] = a[2] - b[2];
  dst[3] = a[3] - b[3];
  return dst;
}
/**
 * Subtracts two vectors.
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @param dst - vector to hold result. If not new one is created.
 * @returns A vector that is the difference of a and b.
 */
const sub = subtract;
/**
 * Check if 2 vectors are approximately equal
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @returns true if vectors are approximately equal
 */
function equalsApproximately(a, b) {
  return Math.abs(a[0] - b[0]) < EPSILON && Math.abs(a[1] - b[1]) < EPSILON && Math.abs(a[2] - b[2]) < EPSILON && Math.abs(a[3] - b[3]) < EPSILON;
}
/**
 * Check if 2 vectors are exactly equal
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @returns true if vectors are exactly equal
 */
function equals(a, b) {
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3];
}
/**
 * Performs linear interpolation on two vectors.
 * Given vectors a and b and interpolation coefficient t, returns
 * a + t * (b - a).
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @param t - Interpolation coefficient.
 * @param dst - vector to hold result. If not new one is created.
 * @returns The linear interpolated result.
 */
function lerp(a, b, t, dst) {
  dst = dst || new VecType(4);
  dst[0] = a[0] + t * (b[0] - a[0]);
  dst[1] = a[1] + t * (b[1] - a[1]);
  dst[2] = a[2] + t * (b[2] - a[2]);
  dst[3] = a[3] + t * (b[3] - a[3]);
  return dst;
}
/**
 * Performs linear interpolation on two vectors.
 * Given vectors a and b and interpolation coefficient vector t, returns
 * a + t * (b - a).
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @param t - Interpolation coefficients vector.
 * @param dst - vector to hold result. If not new one is created.
 * @returns the linear interpolated result.
 */
function lerpV(a, b, t, dst) {
  dst = dst || new VecType(4);
  dst[0] = a[0] + t[0] * (b[0] - a[0]);
  dst[1] = a[1] + t[1] * (b[1] - a[1]);
  dst[2] = a[2] + t[2] * (b[2] - a[2]);
  dst[3] = a[3] + t[3] * (b[3] - a[3]);
  return dst;
}
/**
 * Return max values of two vectors.
 * Given vectors a and b returns
 * [max(a[0], b[0]), max(a[1], b[1]), max(a[2], b[2])].
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @param dst - vector to hold result. If not new one is created.
 * @returns The max components vector.
 */
function max(a, b, dst) {
  dst = dst || new VecType(4);
  dst[0] = Math.max(a[0], b[0]);
  dst[1] = Math.max(a[1], b[1]);
  dst[2] = Math.max(a[2], b[2]);
  dst[3] = Math.max(a[3], b[3]);
  return dst;
}
/**
 * Return min values of two vectors.
 * Given vectors a and b returns
 * [min(a[0], b[0]), min(a[1], b[1]), min(a[2], b[2])].
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @param dst - vector to hold result. If not new one is created.
 * @returns The min components vector.
 */
function min(a, b, dst) {
  dst = dst || new VecType(4);
  dst[0] = Math.min(a[0], b[0]);
  dst[1] = Math.min(a[1], b[1]);
  dst[2] = Math.min(a[2], b[2]);
  dst[3] = Math.min(a[3], b[3]);
  return dst;
}
/**
 * Multiplies a vector by a scalar.
 * @param v - The vector.
 * @param k - The scalar.
 * @param dst - vector to hold result. If not new one is created.
 * @returns The scaled vector.
 */
function mulScalar(v, k, dst) {
  dst = dst || new VecType(4);
  dst[0] = v[0] * k;
  dst[1] = v[1] * k;
  dst[2] = v[2] * k;
  dst[3] = v[3] * k;
  return dst;
}
/**
 * Multiplies a vector by a scalar. (same as mulScalar)
 * @param v - The vector.
 * @param k - The scalar.
 * @param dst - vector to hold result. If not new one is created.
 * @returns The scaled vector.
 */
const scale = mulScalar;
/**
 * Divides a vector by a scalar.
 * @param v - The vector.
 * @param k - The scalar.
 * @param dst - vector to hold result. If not new one is created.
 * @returns The scaled vector.
 */
function divScalar(v, k, dst) {
  dst = dst || new VecType(4);
  dst[0] = v[0] / k;
  dst[1] = v[1] / k;
  dst[2] = v[2] / k;
  dst[3] = v[3] / k;
  return dst;
}
/**
 * Inverse a vector.
 * @param v - The vector.
 * @param dst - vector to hold result. If not new one is created.
 * @returns The inverted vector.
 */
function inverse(v, dst) {
  dst = dst || new VecType(4);
  dst[0] = 1 / v[0];
  dst[1] = 1 / v[1];
  dst[2] = 1 / v[2];
  dst[3] = 1 / v[3];
  return dst;
}
/**
 * Invert a vector. (same as inverse)
 * @param v - The vector.
 * @param dst - vector to hold result. If not new one is created.
 * @returns The inverted vector.
 */
const invert = inverse;
/**
 * Computes the dot product of two vectors; assumes both vectors have
 * three entries.
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @returns dot product
 */
function dot(a, b) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];
}
/**
 * Computes the length of vector
 * @param v - vector.
 * @returns length of vector.
 */
function length(v) {
  const v0 = v[0];
  const v1 = v[1];
  const v2 = v[2];
  const v3 = v[3];
  return Math.sqrt(v0 * v0 + v1 * v1 + v2 * v2 + v3 * v3);
}
/**
 * Computes the length of vector (same as length)
 * @param v - vector.
 * @returns length of vector.
 */
const len = length;
/**
 * Computes the square of the length of vector
 * @param v - vector.
 * @returns square of the length of vector.
 */
function lengthSq(v) {
  const v0 = v[0];
  const v1 = v[1];
  const v2 = v[2];
  const v3 = v[3];
  return v0 * v0 + v1 * v1 + v2 * v2 + v3 * v3;
}
/**
 * Computes the square of the length of vector (same as lengthSq)
 * @param v - vector.
 * @returns square of the length of vector.
 */
const lenSq = lengthSq;
/**
 * Computes the distance between 2 points
 * @param a - vector.
 * @param b - vector.
 * @returns distance between a and b
 */
function distance(a, b) {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  const dz = a[2] - b[2];
  const dw = a[3] - b[3];
  return Math.sqrt(dx * dx + dy * dy + dz * dz + dw * dw);
}
/**
 * Computes the distance between 2 points (same as distance)
 * @param a - vector.
 * @param b - vector.
 * @returns distance between a and b
 */
const dist = distance;
/**
 * Computes the square of the distance between 2 points
 * @param a - vector.
 * @param b - vector.
 * @returns square of the distance between a and b
 */
function distanceSq(a, b) {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  const dz = a[2] - b[2];
  const dw = a[3] - b[3];
  return dx * dx + dy * dy + dz * dz + dw * dw;
}
/**
 * Computes the square of the distance between 2 points (same as distanceSq)
 * @param a - vector.
 * @param b - vector.
 * @returns square of the distance between a and b
 */
const distSq = distanceSq;
/**
 * Divides a vector by its Euclidean length and returns the quotient.
 * @param v - The vector.
 * @param dst - vector to hold result. If not new one is created.
 * @returns The normalized vector.
 */
function normalize(v, dst) {
  dst = dst || new VecType(4);
  const v0 = v[0];
  const v1 = v[1];
  const v2 = v[2];
  const v3 = v[3];
  const len = Math.sqrt(v0 * v0 + v1 * v1 + v2 * v2 + v3 * v3);
  if (len > 0.00001) {
    dst[0] = v0 / len;
    dst[1] = v1 / len;
    dst[2] = v2 / len;
    dst[3] = v3 / len;
  } else {
    dst[0] = 0;
    dst[1] = 0;
    dst[2] = 0;
    dst[3] = 0;
  }
  return dst;
}
/**
 * Negates a vector.
 * @param v - The vector.
 * @param dst - vector to hold result. If not new one is created.
 * @returns -v.
 */
function negate(v, dst) {
  dst = dst || new VecType(4);
  dst[0] = -v[0];
  dst[1] = -v[1];
  dst[2] = -v[2];
  dst[3] = -v[3];
  return dst;
}
/**
 * Copies a vector. (same as clone)
 * @param v - The vector.
 * @param dst - vector to hold result. If not new one is created.
 * @returns A copy of v.
 */
function copy(v, dst) {
  dst = dst || new VecType(4);
  dst[0] = v[0];
  dst[1] = v[1];
  dst[2] = v[2];
  dst[3] = v[3];
  return dst;
}
/**
 * Clones a vector. (same as copy)
 * @param v - The vector.
 * @param dst - vector to hold result. If not new one is created.
 * @returns A copy of v.
 */
const clone = copy;
/**
 * Multiplies a vector by another vector (component-wise); assumes a and
 * b have the same length.
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @param dst - vector to hold result. If not new one is created.
 * @returns The vector of products of entries of a and b.
 */
function multiply(a, b, dst) {
  dst = dst || new VecType(4);
  dst[0] = a[0] * b[0];
  dst[1] = a[1] * b[1];
  dst[2] = a[2] * b[2];
  dst[3] = a[3] * b[3];
  return dst;
}
/**
 * Multiplies a vector by another vector (component-wise); assumes a and
 * b have the same length. (same as mul)
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @param dst - vector to hold result. If not new one is created.
 * @returns The vector of products of entries of a and b.
 */
const mul = multiply;
/**
 * Divides a vector by another vector (component-wise); assumes a and
 * b have the same length.
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @param dst - vector to hold result. If not new one is created.
 * @returns The vector of quotients of entries of a and b.
 */
function divide(a, b, dst) {
  dst = dst || new VecType(4);
  dst[0] = a[0] / b[0];
  dst[1] = a[1] / b[1];
  dst[2] = a[2] / b[2];
  dst[3] = a[3] / b[3];
  return dst;
}
/**
 * Divides a vector by another vector (component-wise); assumes a and
 * b have the same length. (same as divide)
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @param dst - vector to hold result. If not new one is created.
 * @returns The vector of quotients of entries of a and b.
 */
const div = divide;
/**
 * Zero's a vector
 * @param dst - vector to hold result. If not new one is created.
 * @returns The zeroed vector.
 */
function zero(dst) {
  dst = dst || new VecType(4);
  dst[0] = 0;
  dst[1] = 0;
  dst[2] = 0;
  dst[3] = 0;
  return dst;
}
/**
 * transform vec4 by 4x4 matrix
 * @param v - the vector
 * @param m - The matrix.
 * @param dst - optional vec4 to store result. If not passed a new one is created.
 * @returns the transformed vector
 */
function transformMat4(v, m, dst) {
  dst = dst || new VecType(4);
  const x = v[0];
  const y = v[1];
  const z = v[2];
  const w = v[3];
  dst[0] = m[0] * x + m[4] * y + m[8] * z + m[12] * w;
  dst[1] = m[1] * x + m[5] * y + m[9] * z + m[13] * w;
  dst[2] = m[2] * x + m[6] * y + m[10] * z + m[14] * w;
  dst[3] = m[3] * x + m[7] * y + m[11] * z + m[15] * w;
  return dst;
}
var vec4Impl = exports.vec4 = /*#__PURE__*/Object.freeze({
  __proto__: null,
  setDefaultType: setDefaultType$1,
  create: create,
  fromValues: fromValues,
  ceil: ceil,
  floor: floor,
  round: round,
  clamp: clamp,
  add: add,
  addScaled: addScaled,
  subtract: subtract,
  sub: sub,
  equalsApproximately: equalsApproximately,
  equals: equals,
  lerp: lerp,
  lerpV: lerpV,
  max: max,
  min: min,
  mulScalar: mulScalar,
  scale: scale,
  divScalar: divScalar,
  inverse: inverse,
  invert: invert,
  dot: dot,
  length: length,
  len: len,
  lengthSq: lengthSq,
  lenSq: lenSq,
  distance: distance,
  dist: dist,
  distanceSq: distanceSq,
  distSq: distSq,
  normalize: normalize,
  negate: negate,
  copy: copy,
  clone: clone,
  multiply: multiply,
  mul: mul,
  divide: divide,
  div: div,
  zero: zero,
  transformMat4: transformMat4
});

/**
 * Sets the type this library creates for all types
 * @remarks
 *
 * example:
 *
 * ```
 * setDefaultType(Float64Array);
 * ```
 *
 * @param ctor - the constructor for the type. Either `Float32Array`, `Float64Array`, or `Array`
 */
function setDefaultType(ctor) {
  setDefaultType$4(ctor);
  setDefaultType$2(ctor);
  setDefaultType$5(ctor);
  setDefaultType$3(ctor);
  setDefaultType$1(ctor);
}

},{}],16:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.quat = exports.mat4 = exports.mat3 = void 0;
exports.setDefaultType = setDefaultType;
exports.vec4 = exports.vec3 = exports.vec2 = exports.utils = void 0;
/* wgpu-matrix@2.5.1, license MIT */
/*
 * Copyright 2022 Gregg Tavares
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.  IN NO EVENT SHALL
 * THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 */
let EPSILON = 0.000001;
/**
 * Set the value for EPSILON for various checks
 * @param v - Value to use for EPSILON.
 * @returns previous value of EPSILON;
 */
function setEpsilon(v) {
  const old = EPSILON;
  EPSILON = v;
  return old;
}
/**
 * Convert degrees to radians
 * @param degrees - Angle in degrees
 * @returns angle converted to radians
 */
function degToRad(degrees) {
  return degrees * Math.PI / 180;
}
/**
 * Convert radians to degrees
 * @param radians - Angle in radians
 * @returns angle converted to degrees
 */
function radToDeg(radians) {
  return radians * 180 / Math.PI;
}
/**
 * Lerps between a and b via t
 * @param a - starting value
 * @param b - ending value
 * @param t - value where 0 = a and 1 = b
 * @returns a + (b - a) * t
 */
function lerp$4(a, b, t) {
  return a + (b - a) * t;
}
/**
 * Compute the opposite of lerp. Given a and b and a value between
 * a and b returns a value between 0 and 1. 0 if a, 1 if b.
 * Note: no clamping is done.
 * @param a - start value
 * @param b - end value
 * @param v - value between a and b
 * @returns (v - a) / (b - a)
 */
function inverseLerp(a, b, v) {
  const d = b - a;
  return Math.abs(b - a) < EPSILON ? a : (v - a) / d;
}
/**
 * Compute the euclidean modulo
 *
 * ```
 * // table for n / 3
 * -5, -4, -3, -2, -1,  0,  1,  2,  3,  4,  5   <- n
 * ------------------------------------
 * -2  -1  -0  -2  -1   0,  1,  2,  0,  1,  2   <- n % 3
 *  1   2   0   1   2   0,  1,  2,  0,  1,  2   <- euclideanModule(n, 3)
 * ```
 *
 * @param n - dividend
 * @param m - divisor
 * @returns the euclidean modulo of n / m
 */
function euclideanModulo(n, m) {
  return (n % m + m) % m;
}
var utils = exports.utils = /*#__PURE__*/Object.freeze({
  __proto__: null,
  get EPSILON() {
    return EPSILON;
  },
  setEpsilon: setEpsilon,
  degToRad: degToRad,
  radToDeg: radToDeg,
  lerp: lerp$4,
  inverseLerp: inverseLerp,
  euclideanModulo: euclideanModulo
});

/*
 * Copyright 2022 Gregg Tavares
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.  IN NO EVENT SHALL
 * THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 */
/**
 *
 * Vec2 math functions.
 *
 * Almost all functions take an optional `dst` argument. If it is not passed in the
 * functions will create a new Vec2. In other words you can do this
 *
 *     const v = vec2.cross(v1, v2);  // Creates a new Vec2 with the cross product of v1 x v2.
 *
 * or
 *
 *     const v = vec2.create();
 *     vec2.cross(v1, v2, v);  // Puts the cross product of v1 x v2 in v
 *
 * The first style is often easier but depending on where it's used it generates garbage where
 * as there is almost never allocation with the second style.
 *
 * It is always safe to pass any vector as the destination. So for example
 *
 *     vec2.cross(v1, v2, v1);  // Puts the cross product of v1 x v2 in v1
 *
 */
let VecType$2 = Float32Array;
/**
 * Sets the type this library creates for a Vec2
 * @param ctor - the constructor for the type. Either `Float32Array`, `Float64Array`, or `Array`
 * @returns previous constructor for Vec2
 */
function setDefaultType$6(ctor) {
  const oldType = VecType$2;
  VecType$2 = ctor;
  return oldType;
}
/**
 * Creates a Vec2; may be called with x, y, z to set initial values.
 *
 * Note: Since passing in a raw JavaScript array
 * is valid in all circumstances, if you want to
 * force a JavaScript array into a Vec2's specified type
 * it would be faster to use
 *
 * ```
 * const v = vec2.clone(someJSArray);
 * ```
 *
 * Note: a consequence of the implementation is if your Vec2Type = `Array`
 * instead of `Float32Array` or `Float64Array` then any values you
 * don't pass in will be undefined. Usually this is not an issue since
 * (a) using `Array` is rare and (b) using `vec2.create` is usually used
 * to create a Vec2 to be filled out as in
 *
 * ```
 * const sum = vec2.create();
 * vec2.add(v1, v2, sum);
 * ```
 *
 * @param x - Initial x value.
 * @param y - Initial y value.
 * @returns the created vector
 */
function create$5(x = 0, y = 0) {
  const dst = new VecType$2(2);
  if (x !== undefined) {
    dst[0] = x;
    if (y !== undefined) {
      dst[1] = y;
    }
  }
  return dst;
}

/*
 * Copyright 2022 Gregg Tavares
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.  IN NO EVENT SHALL
 * THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 */
/**
 *
 * Vec3 math functions.
 *
 * Almost all functions take an optional `dst` argument. If it is not passed in the
 * functions will create a new `Vec3`. In other words you can do this
 *
 *     const v = vec3.cross(v1, v2);  // Creates a new Vec3 with the cross product of v1 x v2.
 *
 * or
 *
 *     const v = vec3.create();
 *     vec3.cross(v1, v2, v);  // Puts the cross product of v1 x v2 in v
 *
 * The first style is often easier but depending on where it's used it generates garbage where
 * as there is almost never allocation with the second style.
 *
 * It is always safe to pass any vector as the destination. So for example
 *
 *     vec3.cross(v1, v2, v1);  // Puts the cross product of v1 x v2 in v1
 *
 */
let VecType$1 = Float32Array;
/**
 * Sets the type this library creates for a Vec3
 * @param ctor - the constructor for the type. Either `Float32Array`, `Float64Array`, or `Array`
 * @returns previous constructor for Vec3
 */
function setDefaultType$5(ctor) {
  const oldType = VecType$1;
  VecType$1 = ctor;
  return oldType;
}
/**
 * Creates a vec3; may be called with x, y, z to set initial values.
 * @param x - Initial x value.
 * @param y - Initial y value.
 * @param z - Initial z value.
 * @returns the created vector
 */
function create$4(x, y, z) {
  const dst = new VecType$1(3);
  if (x !== undefined) {
    dst[0] = x;
    if (y !== undefined) {
      dst[1] = y;
      if (z !== undefined) {
        dst[2] = z;
      }
    }
  }
  return dst;
}

/*
 * Copyright 2022 Gregg Tavares
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.  IN NO EVENT SHALL
 * THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 */
/**
 * Creates a Vec2; may be called with x, y, z to set initial values. (same as create)
 * @param x - Initial x value.
 * @param y - Initial y value.
 * @returns the created vector
 */
const fromValues$3 = create$5;
/**
 * Sets the values of a Vec2
 * Also see {@link vec2.create} and {@link vec2.copy}
 *
 * @param x first value
 * @param y second value
 * @param dst - vector to hold result. If not passed in a new one is created.
 * @returns A vector with its elements set.
 */
function set$5(x, y, dst) {
  dst = dst || new VecType$2(2);
  dst[0] = x;
  dst[1] = y;
  return dst;
}
/**
 * Applies Math.ceil to each element of vector
 * @param v - Operand vector.
 * @param dst - vector to hold result. If not passed in a new one is created.
 * @returns A vector that is the ceil of each element of v.
 */
function ceil$2(v, dst) {
  dst = dst || new VecType$2(2);
  dst[0] = Math.ceil(v[0]);
  dst[1] = Math.ceil(v[1]);
  return dst;
}
/**
 * Applies Math.floor to each element of vector
 * @param v - Operand vector.
 * @param dst - vector to hold result. If not passed in a new one is created.
 * @returns A vector that is the floor of each element of v.
 */
function floor$2(v, dst) {
  dst = dst || new VecType$2(2);
  dst[0] = Math.floor(v[0]);
  dst[1] = Math.floor(v[1]);
  return dst;
}
/**
 * Applies Math.round to each element of vector
 * @param v - Operand vector.
 * @param dst - vector to hold result. If not passed in a new one is created.
 * @returns A vector that is the round of each element of v.
 */
function round$2(v, dst) {
  dst = dst || new VecType$2(2);
  dst[0] = Math.round(v[0]);
  dst[1] = Math.round(v[1]);
  return dst;
}
/**
 * Clamp each element of vector between min and max
 * @param v - Operand vector.
 * @param max - Min value, default 0
 * @param min - Max value, default 1
 * @param dst - vector to hold result. If not passed in a new one is created.
 * @returns A vector that the clamped value of each element of v.
 */
function clamp$2(v, min = 0, max = 1, dst) {
  dst = dst || new VecType$2(2);
  dst[0] = Math.min(max, Math.max(min, v[0]));
  dst[1] = Math.min(max, Math.max(min, v[1]));
  return dst;
}
/**
 * Adds two vectors; assumes a and b have the same dimension.
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @param dst - vector to hold result. If not passed in a new one is created.
 * @returns A vector that is the sum of a and b.
 */
function add$3(a, b, dst) {
  dst = dst || new VecType$2(2);
  dst[0] = a[0] + b[0];
  dst[1] = a[1] + b[1];
  return dst;
}
/**
 * Adds two vectors, scaling the 2nd; assumes a and b have the same dimension.
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @param scale - Amount to scale b
 * @param dst - vector to hold result. If not passed in a new one is created.
 * @returns A vector that is the sum of a + b * scale.
 */
function addScaled$2(a, b, scale, dst) {
  dst = dst || new VecType$2(2);
  dst[0] = a[0] + b[0] * scale;
  dst[1] = a[1] + b[1] * scale;
  return dst;
}
/**
 * Returns the angle in radians between two vectors.
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @returns The angle in radians between the 2 vectors.
 */
function angle$2(a, b) {
  const ax = a[0];
  const ay = a[1];
  const bx = a[0];
  const by = a[1];
  const mag1 = Math.sqrt(ax * ax + ay * ay);
  const mag2 = Math.sqrt(bx * bx + by * by);
  const mag = mag1 * mag2;
  const cosine = mag && dot$3(a, b) / mag;
  return Math.acos(cosine);
}
/**
 * Subtracts two vectors.
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @param dst - vector to hold result. If not passed in a new one is created.
 * @returns A vector that is the difference of a and b.
 */
function subtract$3(a, b, dst) {
  dst = dst || new VecType$2(2);
  dst[0] = a[0] - b[0];
  dst[1] = a[1] - b[1];
  return dst;
}
/**
 * Subtracts two vectors.
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @param dst - vector to hold result. If not passed in a new one is created.
 * @returns A vector that is the difference of a and b.
 */
const sub$3 = subtract$3;
/**
 * Check if 2 vectors are approximately equal
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @returns true if vectors are approximately equal
 */
function equalsApproximately$5(a, b) {
  return Math.abs(a[0] - b[0]) < EPSILON && Math.abs(a[1] - b[1]) < EPSILON;
}
/**
 * Check if 2 vectors are exactly equal
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @returns true if vectors are exactly equal
 */
function equals$5(a, b) {
  return a[0] === b[0] && a[1] === b[1];
}
/**
 * Performs linear interpolation on two vectors.
 * Given vectors a and b and interpolation coefficient t, returns
 * a + t * (b - a).
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @param t - Interpolation coefficient.
 * @param dst - vector to hold result. If not passed in a new one is created.
 * @returns The linear interpolated result.
 */
function lerp$3(a, b, t, dst) {
  dst = dst || new VecType$2(2);
  dst[0] = a[0] + t * (b[0] - a[0]);
  dst[1] = a[1] + t * (b[1] - a[1]);
  return dst;
}
/**
 * Performs linear interpolation on two vectors.
 * Given vectors a and b and interpolation coefficient vector t, returns
 * a + t * (b - a).
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @param t - Interpolation coefficients vector.
 * @param dst - vector to hold result. If not passed in a new one is created.
 * @returns the linear interpolated result.
 */
function lerpV$2(a, b, t, dst) {
  dst = dst || new VecType$2(2);
  dst[0] = a[0] + t[0] * (b[0] - a[0]);
  dst[1] = a[1] + t[1] * (b[1] - a[1]);
  return dst;
}
/**
 * Return max values of two vectors.
 * Given vectors a and b returns
 * [max(a[0], b[0]), max(a[1], b[1]), max(a[2], b[2])].
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @param dst - vector to hold result. If not passed in a new one is created.
 * @returns The max components vector.
 */
function max$2(a, b, dst) {
  dst = dst || new VecType$2(2);
  dst[0] = Math.max(a[0], b[0]);
  dst[1] = Math.max(a[1], b[1]);
  return dst;
}
/**
 * Return min values of two vectors.
 * Given vectors a and b returns
 * [min(a[0], b[0]), min(a[1], b[1]), min(a[2], b[2])].
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @param dst - vector to hold result. If not passed in a new one is created.
 * @returns The min components vector.
 */
function min$2(a, b, dst) {
  dst = dst || new VecType$2(2);
  dst[0] = Math.min(a[0], b[0]);
  dst[1] = Math.min(a[1], b[1]);
  return dst;
}
/**
 * Multiplies a vector by a scalar.
 * @param v - The vector.
 * @param k - The scalar.
 * @param dst - vector to hold result. If not passed in a new one is created.
 * @returns The scaled vector.
 */
function mulScalar$3(v, k, dst) {
  dst = dst || new VecType$2(2);
  dst[0] = v[0] * k;
  dst[1] = v[1] * k;
  return dst;
}
/**
 * Multiplies a vector by a scalar. (same as mulScalar)
 * @param v - The vector.
 * @param k - The scalar.
 * @param dst - vector to hold result. If not passed in a new one is created.
 * @returns The scaled vector.
 */
const scale$5 = mulScalar$3;
/**
 * Divides a vector by a scalar.
 * @param v - The vector.
 * @param k - The scalar.
 * @param dst - vector to hold result. If not passed in a new one is created.
 * @returns The scaled vector.
 */
function divScalar$3(v, k, dst) {
  dst = dst || new VecType$2(2);
  dst[0] = v[0] / k;
  dst[1] = v[1] / k;
  return dst;
}
/**
 * Inverse a vector.
 * @param v - The vector.
 * @param dst - vector to hold result. If not passed in a new one is created.
 * @returns The inverted vector.
 */
function inverse$5(v, dst) {
  dst = dst || new VecType$2(2);
  dst[0] = 1 / v[0];
  dst[1] = 1 / v[1];
  return dst;
}
/**
 * Invert a vector. (same as inverse)
 * @param v - The vector.
 * @param dst - vector to hold result. If not passed in a new one is created.
 * @returns The inverted vector.
 */
const invert$4 = inverse$5;
/**
 * Computes the cross product of two vectors; assumes both vectors have
 * three entries.
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @param dst - vector to hold result. If not passed in a new one is created.
 * @returns The vector of a cross b.
 */
function cross$1(a, b, dst) {
  dst = dst || new VecType$1(3);
  const z = a[0] * b[1] - a[1] * b[0];
  dst[0] = 0;
  dst[1] = 0;
  dst[2] = z;
  return dst;
}
/**
 * Computes the dot product of two vectors; assumes both vectors have
 * three entries.
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @returns dot product
 */
function dot$3(a, b) {
  return a[0] * b[0] + a[1] * b[1];
}
/**
 * Computes the length of vector
 * @param v - vector.
 * @returns length of vector.
 */
function length$3(v) {
  const v0 = v[0];
  const v1 = v[1];
  return Math.sqrt(v0 * v0 + v1 * v1);
}
/**
 * Computes the length of vector (same as length)
 * @param v - vector.
 * @returns length of vector.
 */
const len$3 = length$3;
/**
 * Computes the square of the length of vector
 * @param v - vector.
 * @returns square of the length of vector.
 */
function lengthSq$3(v) {
  const v0 = v[0];
  const v1 = v[1];
  return v0 * v0 + v1 * v1;
}
/**
 * Computes the square of the length of vector (same as lengthSq)
 * @param v - vector.
 * @returns square of the length of vector.
 */
const lenSq$3 = lengthSq$3;
/**
 * Computes the distance between 2 points
 * @param a - vector.
 * @param b - vector.
 * @returns distance between a and b
 */
function distance$2(a, b) {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  return Math.sqrt(dx * dx + dy * dy);
}
/**
 * Computes the distance between 2 points (same as distance)
 * @param a - vector.
 * @param b - vector.
 * @returns distance between a and b
 */
const dist$2 = distance$2;
/**
 * Computes the square of the distance between 2 points
 * @param a - vector.
 * @param b - vector.
 * @returns square of the distance between a and b
 */
function distanceSq$2(a, b) {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  return dx * dx + dy * dy;
}
/**
 * Computes the square of the distance between 2 points (same as distanceSq)
 * @param a - vector.
 * @param b - vector.
 * @returns square of the distance between a and b
 */
const distSq$2 = distanceSq$2;
/**
 * Divides a vector by its Euclidean length and returns the quotient.
 * @param v - The vector.
 * @param dst - vector to hold result. If not passed in a new one is created.
 * @returns The normalized vector.
 */
function normalize$3(v, dst) {
  dst = dst || new VecType$2(2);
  const v0 = v[0];
  const v1 = v[1];
  const len = Math.sqrt(v0 * v0 + v1 * v1);
  if (len > 0.00001) {
    dst[0] = v0 / len;
    dst[1] = v1 / len;
  } else {
    dst[0] = 0;
    dst[1] = 0;
  }
  return dst;
}
/**
 * Negates a vector.
 * @param v - The vector.
 * @param dst - vector to hold result. If not passed in a new one is created.
 * @returns -v.
 */
function negate$4(v, dst) {
  dst = dst || new VecType$2(2);
  dst[0] = -v[0];
  dst[1] = -v[1];
  return dst;
}
/**
 * Copies a vector. (same as {@link vec2.clone})
 * Also see {@link vec2.create} and {@link vec2.set}
 * @param v - The vector.
 * @param dst - vector to hold result. If not passed in a new one is created.
 * @returns A copy of v.
 */
function copy$5(v, dst) {
  dst = dst || new VecType$2(2);
  dst[0] = v[0];
  dst[1] = v[1];
  return dst;
}
/**
 * Clones a vector. (same as {@link vec2.copy})
 * Also see {@link vec2.create} and {@link vec2.set}
 * @param v - The vector.
 * @param dst - vector to hold result. If not passed in a new one is created.
 * @returns A copy of v.
 */
const clone$5 = copy$5;
/**
 * Multiplies a vector by another vector (component-wise); assumes a and
 * b have the same length.
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @param dst - vector to hold result. If not passed in a new one is created.
 * @returns The vector of products of entries of a and b.
 */
function multiply$5(a, b, dst) {
  dst = dst || new VecType$2(2);
  dst[0] = a[0] * b[0];
  dst[1] = a[1] * b[1];
  return dst;
}
/**
 * Multiplies a vector by another vector (component-wise); assumes a and
 * b have the same length. (same as mul)
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @param dst - vector to hold result. If not passed in a new one is created.
 * @returns The vector of products of entries of a and b.
 */
const mul$5 = multiply$5;
/**
 * Divides a vector by another vector (component-wise); assumes a and
 * b have the same length.
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @param dst - vector to hold result. If not passed in a new one is created.
 * @returns The vector of quotients of entries of a and b.
 */
function divide$2(a, b, dst) {
  dst = dst || new VecType$2(2);
  dst[0] = a[0] / b[0];
  dst[1] = a[1] / b[1];
  return dst;
}
/**
 * Divides a vector by another vector (component-wise); assumes a and
 * b have the same length. (same as divide)
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @param dst - vector to hold result. If not passed in a new one is created.
 * @returns The vector of quotients of entries of a and b.
 */
const div$2 = divide$2;
/**
 * Creates a random unit vector * scale
 * @param scale - Default 1
 * @param dst - vector to hold result. If not passed in a new one is created.
 * @returns The random vector.
 */
function random$1(scale = 1, dst) {
  dst = dst || new VecType$2(2);
  const angle = Math.random() * 2 * Math.PI;
  dst[0] = Math.cos(angle) * scale;
  dst[1] = Math.sin(angle) * scale;
  return dst;
}
/**
 * Zero's a vector
 * @param dst - vector to hold result. If not passed in a new one is created.
 * @returns The zeroed vector.
 */
function zero$2(dst) {
  dst = dst || new VecType$2(2);
  dst[0] = 0;
  dst[1] = 0;
  return dst;
}
/**
 * transform Vec2 by 4x4 matrix
 * @param v - the vector
 * @param m - The matrix.
 * @param dst - optional Vec2 to store result. If not passed a new one is created.
 * @returns the transformed vector
 */
function transformMat4$2(v, m, dst) {
  dst = dst || new VecType$2(2);
  const x = v[0];
  const y = v[1];
  dst[0] = x * m[0] + y * m[4] + m[12];
  dst[1] = x * m[1] + y * m[5] + m[13];
  return dst;
}
/**
 * Transforms vec4 by 3x3 matrix
 *
 * @param v - the vector
 * @param m - The matrix.
 * @param dst - optional Vec2 to store result. If not passed a new one is created.
 * @returns the transformed vector
 */
function transformMat3$1(v, m, dst) {
  dst = dst || new VecType$2(2);
  const x = v[0];
  const y = v[1];
  dst[0] = m[0] * x + m[4] * y + m[8];
  dst[1] = m[1] * x + m[5] * y + m[9];
  return dst;
}
var vec2Impl = exports.vec2 = /*#__PURE__*/Object.freeze({
  __proto__: null,
  create: create$5,
  setDefaultType: setDefaultType$6,
  fromValues: fromValues$3,
  set: set$5,
  ceil: ceil$2,
  floor: floor$2,
  round: round$2,
  clamp: clamp$2,
  add: add$3,
  addScaled: addScaled$2,
  angle: angle$2,
  subtract: subtract$3,
  sub: sub$3,
  equalsApproximately: equalsApproximately$5,
  equals: equals$5,
  lerp: lerp$3,
  lerpV: lerpV$2,
  max: max$2,
  min: min$2,
  mulScalar: mulScalar$3,
  scale: scale$5,
  divScalar: divScalar$3,
  inverse: inverse$5,
  invert: invert$4,
  cross: cross$1,
  dot: dot$3,
  length: length$3,
  len: len$3,
  lengthSq: lengthSq$3,
  lenSq: lenSq$3,
  distance: distance$2,
  dist: dist$2,
  distanceSq: distanceSq$2,
  distSq: distSq$2,
  normalize: normalize$3,
  negate: negate$4,
  copy: copy$5,
  clone: clone$5,
  multiply: multiply$5,
  mul: mul$5,
  divide: divide$2,
  div: div$2,
  random: random$1,
  zero: zero$2,
  transformMat4: transformMat4$2,
  transformMat3: transformMat3$1
});

/*
 * Copyright 2022 Gregg Tavares
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.  IN NO EVENT SHALL
 * THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 */
/**
 * 3x3 Matrix math math functions.
 *
 * Almost all functions take an optional `dst` argument. If it is not passed in the
 * functions will create a new matrix. In other words you can do this
 *
 *     const mat = mat3.translation([1, 2, 3]);  // Creates a new translation matrix
 *
 * or
 *
 *     const mat = mat3.create();
 *     mat3.translation([1, 2, 3], mat);  // Puts translation matrix in mat.
 *
 * The first style is often easier but depending on where it's used it generates garbage where
 * as there is almost never allocation with the second style.
 *
 * It is always save to pass any matrix as the destination. So for example
 *
 *     const mat = mat3.identity();
 *     const trans = mat3.translation([1, 2, 3]);
 *     mat3.multiply(mat, trans, mat);  // Multiplies mat * trans and puts result in mat.
 *
 */
let MatType$1 = Float32Array;
// This mess is because with Mat3 we have 3 unused elements.
// For Float32Array and Float64Array that's not an issue
// but for Array it's troublesome
const ctorMap = new Map([[Float32Array, () => new Float32Array(12)], [Float64Array, () => new Float64Array(12)], [Array, () => new Array(12).fill(0)]]);
let newMat3 = ctorMap.get(Float32Array);
/**
 * Sets the type this library creates for a Mat3
 * @param ctor - the constructor for the type. Either `Float32Array`, `Float64Array`, or `Array`
 * @returns previous constructor for Mat3
 */
function setDefaultType$4(ctor) {
  const oldType = MatType$1;
  MatType$1 = ctor;
  newMat3 = ctorMap.get(ctor);
  return oldType;
}
/**
 * Create a Mat3 from values
 *
 * Note: Since passing in a raw JavaScript array
 * is valid in all circumstances, if you want to
 * force a JavaScript array into a Mat3's specified type
 * it would be faster to use
 *
 * ```
 * const m = mat3.clone(someJSArray);
 * ```
 *
 * Note: a consequence of the implementation is if your Mat3Type = `Array`
 * instead of `Float32Array` or `Float64Array` then any values you
 * don't pass in will be undefined. Usually this is not an issue since
 * (a) using `Array` is rare and (b) using `mat3.create` is usually used
 * to create a Mat3 to be filled out as in
 *
 * ```
 * const m = mat3.create();
 * mat3.perspective(fov, aspect, near, far, m);
 * ```
 *
 * @param v0 - value for element 0
 * @param v1 - value for element 1
 * @param v2 - value for element 2
 * @param v3 - value for element 3
 * @param v4 - value for element 4
 * @param v5 - value for element 5
 * @param v6 - value for element 6
 * @param v7 - value for element 7
 * @param v8 - value for element 8
 * @returns matrix created from values.
 */
function create$3(v0, v1, v2, v3, v4, v5, v6, v7, v8) {
  const dst = newMat3();
  // to make the array homogenous
  dst[3] = 0;
  dst[7] = 0;
  dst[11] = 0;
  if (v0 !== undefined) {
    dst[0] = v0;
    if (v1 !== undefined) {
      dst[1] = v1;
      if (v2 !== undefined) {
        dst[2] = v2;
        if (v3 !== undefined) {
          dst[4] = v3;
          if (v4 !== undefined) {
            dst[5] = v4;
            if (v5 !== undefined) {
              dst[6] = v5;
              if (v6 !== undefined) {
                dst[8] = v6;
                if (v7 !== undefined) {
                  dst[9] = v7;
                  if (v8 !== undefined) {
                    dst[10] = v8;
                  }
                }
              }
            }
          }
        }
      }
    }
  }
  return dst;
}
/**
 * Sets the values of a Mat3
 * Also see {@link mat3.create} and {@link mat3.copy}
 *
 * @param v0 - value for element 0
 * @param v1 - value for element 1
 * @param v2 - value for element 2
 * @param v3 - value for element 3
 * @param v4 - value for element 4
 * @param v5 - value for element 5
 * @param v6 - value for element 6
 * @param v7 - value for element 7
 * @param v8 - value for element 8
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns Mat3 set from values.
 */
function set$4(v0, v1, v2, v3, v4, v5, v6, v7, v8, dst) {
  dst = dst || newMat3();
  dst[0] = v0;
  dst[1] = v1;
  dst[2] = v2;
  dst[3] = 0;
  dst[4] = v3;
  dst[5] = v4;
  dst[6] = v5;
  dst[7] = 0;
  dst[8] = v6;
  dst[9] = v7;
  dst[10] = v8;
  dst[11] = 0;
  return dst;
}
/**
 * Creates a Mat3 from the upper left 3x3 part of a Mat4
 * @param m4 - source matrix
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns Mat3 made from m4
 */
function fromMat4(m4, dst) {
  dst = dst || newMat3();
  dst[0] = m4[0];
  dst[1] = m4[1];
  dst[2] = m4[2];
  dst[3] = 0;
  dst[4] = m4[4];
  dst[5] = m4[5];
  dst[6] = m4[6];
  dst[7] = 0;
  dst[8] = m4[8];
  dst[9] = m4[9];
  dst[10] = m4[10];
  dst[11] = 0;
  return dst;
}
/**
 * Creates a Mat3 rotation matrix from a quaternion
 * @param q - quaternion to create matrix from
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns Mat3 made from q
 */
function fromQuat$1(q, dst) {
  dst = dst || newMat3();
  const x = q[0];
  const y = q[1];
  const z = q[2];
  const w = q[3];
  const x2 = x + x;
  const y2 = y + y;
  const z2 = z + z;
  const xx = x * x2;
  const yx = y * x2;
  const yy = y * y2;
  const zx = z * x2;
  const zy = z * y2;
  const zz = z * z2;
  const wx = w * x2;
  const wy = w * y2;
  const wz = w * z2;
  dst[0] = 1 - yy - zz;
  dst[1] = yx + wz;
  dst[2] = zx - wy;
  dst[3] = 0;
  dst[4] = yx - wz;
  dst[5] = 1 - xx - zz;
  dst[6] = zy + wx;
  dst[7] = 0;
  dst[8] = zx + wy;
  dst[9] = zy - wx;
  dst[10] = 1 - xx - yy;
  dst[11] = 0;
  return dst;
}
/**
 * Negates a matrix.
 * @param m - The matrix.
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns -m.
 */
function negate$3(m, dst) {
  dst = dst || newMat3();
  dst[0] = -m[0];
  dst[1] = -m[1];
  dst[2] = -m[2];
  dst[4] = -m[4];
  dst[5] = -m[5];
  dst[6] = -m[6];
  dst[8] = -m[8];
  dst[9] = -m[9];
  dst[10] = -m[10];
  return dst;
}
/**
 * Copies a matrix. (same as {@link mat3.clone})
 * Also see {@link mat3.create} and {@link mat3.set}
 * @param m - The matrix.
 * @param dst - The matrix. If not passed a new one is created.
 * @returns A copy of m.
 */
function copy$4(m, dst) {
  dst = dst || newMat3();
  dst[0] = m[0];
  dst[1] = m[1];
  dst[2] = m[2];
  dst[4] = m[4];
  dst[5] = m[5];
  dst[6] = m[6];
  dst[8] = m[8];
  dst[9] = m[9];
  dst[10] = m[10];
  return dst;
}
/**
 * Copies a matrix (same as {@link mat3.copy})
 * Also see {@link mat3.create} and {@link mat3.set}
 * @param m - The matrix.
 * @param dst - The matrix. If not passed a new one is created.
 * @returns A copy of m.
 */
const clone$4 = copy$4;
/**
 * Check if 2 matrices are approximately equal
 * @param a Operand matrix.
 * @param b Operand matrix.
 * @returns true if matrices are approximately equal
 */
function equalsApproximately$4(a, b) {
  return Math.abs(a[0] - b[0]) < EPSILON && Math.abs(a[1] - b[1]) < EPSILON && Math.abs(a[2] - b[2]) < EPSILON && Math.abs(a[4] - b[4]) < EPSILON && Math.abs(a[5] - b[5]) < EPSILON && Math.abs(a[6] - b[6]) < EPSILON && Math.abs(a[8] - b[8]) < EPSILON && Math.abs(a[9] - b[9]) < EPSILON && Math.abs(a[10] - b[10]) < EPSILON;
}
/**
 * Check if 2 matrices are exactly equal
 * @param a Operand matrix.
 * @param b Operand matrix.
 * @returns true if matrices are exactly equal
 */
function equals$4(a, b) {
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[4] === b[4] && a[5] === b[5] && a[6] === b[6] && a[8] === b[8] && a[9] === b[9] && a[10] === b[10];
}
/**
 * Creates a 3-by-3 identity matrix.
 *
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns A 3-by-3 identity matrix.
 */
function identity$2(dst) {
  dst = dst || newMat3();
  dst[0] = 1;
  dst[1] = 0;
  dst[2] = 0;
  dst[4] = 0;
  dst[5] = 1;
  dst[6] = 0;
  dst[8] = 0;
  dst[9] = 0;
  dst[10] = 1;
  return dst;
}
/**
 * Takes the transpose of a matrix.
 * @param m - The matrix.
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns The transpose of m.
 */
function transpose$1(m, dst) {
  dst = dst || newMat3();
  if (dst === m) {
    let t;
    // 0 1 2
    // 4 5 6
    // 8 9 10
    t = m[1];
    m[1] = m[4];
    m[4] = t;
    t = m[2];
    m[2] = m[8];
    m[8] = t;
    t = m[6];
    m[6] = m[9];
    m[9] = t;
    return dst;
  }
  const m00 = m[0 * 4 + 0];
  const m01 = m[0 * 4 + 1];
  const m02 = m[0 * 4 + 2];
  const m10 = m[1 * 4 + 0];
  const m11 = m[1 * 4 + 1];
  const m12 = m[1 * 4 + 2];
  const m20 = m[2 * 4 + 0];
  const m21 = m[2 * 4 + 1];
  const m22 = m[2 * 4 + 2];
  dst[0] = m00;
  dst[1] = m10;
  dst[2] = m20;
  dst[4] = m01;
  dst[5] = m11;
  dst[6] = m21;
  dst[8] = m02;
  dst[9] = m12;
  dst[10] = m22;
  return dst;
}
/**
 * Computes the inverse of a 3-by-3 matrix.
 * @param m - The matrix.
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns The inverse of m.
 */
function inverse$4(m, dst) {
  dst = dst || newMat3();
  const m00 = m[0 * 4 + 0];
  const m01 = m[0 * 4 + 1];
  const m02 = m[0 * 4 + 2];
  const m10 = m[1 * 4 + 0];
  const m11 = m[1 * 4 + 1];
  const m12 = m[1 * 4 + 2];
  const m20 = m[2 * 4 + 0];
  const m21 = m[2 * 4 + 1];
  const m22 = m[2 * 4 + 2];
  const b01 = m22 * m11 - m12 * m21;
  const b11 = -m22 * m10 + m12 * m20;
  const b21 = m21 * m10 - m11 * m20;
  const invDet = 1 / (m00 * b01 + m01 * b11 + m02 * b21);
  dst[0] = b01 * invDet;
  dst[1] = (-m22 * m01 + m02 * m21) * invDet;
  dst[2] = (m12 * m01 - m02 * m11) * invDet;
  dst[4] = b11 * invDet;
  dst[5] = (m22 * m00 - m02 * m20) * invDet;
  dst[6] = (-m12 * m00 + m02 * m10) * invDet;
  dst[8] = b21 * invDet;
  dst[9] = (-m21 * m00 + m01 * m20) * invDet;
  dst[10] = (m11 * m00 - m01 * m10) * invDet;
  return dst;
}
/**
 * Compute the determinant of a matrix
 * @param m - the matrix
 * @returns the determinant
 */
function determinant$1(m) {
  const m00 = m[0 * 4 + 0];
  const m01 = m[0 * 4 + 1];
  const m02 = m[0 * 4 + 2];
  const m10 = m[1 * 4 + 0];
  const m11 = m[1 * 4 + 1];
  const m12 = m[1 * 4 + 2];
  const m20 = m[2 * 4 + 0];
  const m21 = m[2 * 4 + 1];
  const m22 = m[2 * 4 + 2];
  return m00 * (m11 * m22 - m21 * m12) - m10 * (m01 * m22 - m21 * m02) + m20 * (m01 * m12 - m11 * m02);
}
/**
 * Computes the inverse of a 3-by-3 matrix. (same as inverse)
 * @param m - The matrix.
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns The inverse of m.
 */
const invert$3 = inverse$4;
/**
 * Multiplies two 3-by-3 matrices with a on the left and b on the right
 * @param a - The matrix on the left.
 * @param b - The matrix on the right.
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns The matrix product of a and b.
 */
function multiply$4(a, b, dst) {
  dst = dst || newMat3();
  const a00 = a[0];
  const a01 = a[1];
  const a02 = a[2];
  const a10 = a[4 + 0];
  const a11 = a[4 + 1];
  const a12 = a[4 + 2];
  const a20 = a[8 + 0];
  const a21 = a[8 + 1];
  const a22 = a[8 + 2];
  const b00 = b[0];
  const b01 = b[1];
  const b02 = b[2];
  const b10 = b[4 + 0];
  const b11 = b[4 + 1];
  const b12 = b[4 + 2];
  const b20 = b[8 + 0];
  const b21 = b[8 + 1];
  const b22 = b[8 + 2];
  dst[0] = a00 * b00 + a10 * b01 + a20 * b02;
  dst[1] = a01 * b00 + a11 * b01 + a21 * b02;
  dst[2] = a02 * b00 + a12 * b01 + a22 * b02;
  dst[4] = a00 * b10 + a10 * b11 + a20 * b12;
  dst[5] = a01 * b10 + a11 * b11 + a21 * b12;
  dst[6] = a02 * b10 + a12 * b11 + a22 * b12;
  dst[8] = a00 * b20 + a10 * b21 + a20 * b22;
  dst[9] = a01 * b20 + a11 * b21 + a21 * b22;
  dst[10] = a02 * b20 + a12 * b21 + a22 * b22;
  return dst;
}
/**
 * Multiplies two 3-by-3 matrices with a on the left and b on the right (same as multiply)
 * @param a - The matrix on the left.
 * @param b - The matrix on the right.
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns The matrix product of a and b.
 */
const mul$4 = multiply$4;
/**
 * Sets the translation component of a 3-by-3 matrix to the given
 * vector.
 * @param a - The matrix.
 * @param v - The vector.
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns The matrix with translation set.
 */
function setTranslation$1(a, v, dst) {
  dst = dst || identity$2();
  if (a !== dst) {
    dst[0] = a[0];
    dst[1] = a[1];
    dst[2] = a[2];
    dst[4] = a[4];
    dst[5] = a[5];
    dst[6] = a[6];
  }
  dst[8] = v[0];
  dst[9] = v[1];
  dst[10] = 1;
  return dst;
}
/**
 * Returns the translation component of a 3-by-3 matrix as a vector with 3
 * entries.
 * @param m - The matrix.
 * @param dst - vector to hold result. If not passed a new one is created.
 * @returns The translation component of m.
 */
function getTranslation$2(m, dst) {
  dst = dst || create$5();
  dst[0] = m[8];
  dst[1] = m[9];
  return dst;
}
/**
 * Returns an axis of a 3x3 matrix as a vector with 2 entries
 * @param m - The matrix.
 * @param axis - The axis 0 = x, 1 = y,
 * @returns The axis component of m.
 */
function getAxis$2(m, axis, dst) {
  dst = dst || create$5();
  const off = axis * 4;
  dst[0] = m[off + 0];
  dst[1] = m[off + 1];
  return dst;
}
/**
 * Sets an axis of a 3x3 matrix as a vector with 2 entries
 * @param m - The matrix.
 * @param v - the axis vector
 * @param axis - The axis  0 = x, 1 = y;
 * @param dst - The matrix to set. If not passed a new one is created.
 * @returns The matrix with axis set.
 */
function setAxis$1(m, v, axis, dst) {
  if (dst !== m) {
    dst = copy$4(m, dst);
  }
  const off = axis * 4;
  dst[off + 0] = v[0];
  dst[off + 1] = v[1];
  return dst;
}
/**
 * Returns the scaling component of the matrix
 * @param m - The Matrix
 * @param dst - The vector to set. If not passed a new one is created.
 */
function getScaling$2(m, dst) {
  dst = dst || create$5();
  const xx = m[0];
  const xy = m[1];
  const yx = m[4];
  const yy = m[5];
  dst[0] = Math.sqrt(xx * xx + xy * xy);
  dst[1] = Math.sqrt(yx * yx + yy * yy);
  return dst;
}
/**
 * Creates a 3-by-3 matrix which translates by the given vector v.
 * @param v - The vector by which to translate.
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns The translation matrix.
 */
function translation$1(v, dst) {
  dst = dst || newMat3();
  dst[0] = 1;
  dst[1] = 0;
  dst[2] = 0;
  dst[4] = 0;
  dst[5] = 1;
  dst[6] = 0;
  dst[8] = v[0];
  dst[9] = v[1];
  dst[10] = 1;
  return dst;
}
/**
 * Translates the given 3-by-3 matrix by the given vector v.
 * @param m - The matrix.
 * @param v - The vector by which to translate.
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns The translated matrix.
 */
function translate$1(m, v, dst) {
  dst = dst || newMat3();
  const v0 = v[0];
  const v1 = v[1];
  const m00 = m[0];
  const m01 = m[1];
  const m02 = m[2];
  const m10 = m[1 * 4 + 0];
  const m11 = m[1 * 4 + 1];
  const m12 = m[1 * 4 + 2];
  const m20 = m[2 * 4 + 0];
  const m21 = m[2 * 4 + 1];
  const m22 = m[2 * 4 + 2];
  if (m !== dst) {
    dst[0] = m00;
    dst[1] = m01;
    dst[2] = m02;
    dst[4] = m10;
    dst[5] = m11;
    dst[6] = m12;
  }
  dst[8] = m00 * v0 + m10 * v1 + m20;
  dst[9] = m01 * v0 + m11 * v1 + m21;
  dst[10] = m02 * v0 + m12 * v1 + m22;
  return dst;
}
/**
 * Creates a 3-by-3 matrix which rotates  by the given angle.
 * @param angleInRadians - The angle by which to rotate (in radians).
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns The rotation matrix.
 */
function rotation$1(angleInRadians, dst) {
  dst = dst || newMat3();
  const c = Math.cos(angleInRadians);
  const s = Math.sin(angleInRadians);
  dst[0] = c;
  dst[1] = s;
  dst[2] = 0;
  dst[4] = -s;
  dst[5] = c;
  dst[6] = 0;
  dst[8] = 0;
  dst[9] = 0;
  dst[10] = 1;
  return dst;
}
/**
 * Rotates the given 3-by-3 matrix  by the given angle.
 * @param m - The matrix.
 * @param angleInRadians - The angle by which to rotate (in radians).
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns The rotated matrix.
 */
function rotate$1(m, angleInRadians, dst) {
  dst = dst || newMat3();
  const m00 = m[0 * 4 + 0];
  const m01 = m[0 * 4 + 1];
  const m02 = m[0 * 4 + 2];
  const m10 = m[1 * 4 + 0];
  const m11 = m[1 * 4 + 1];
  const m12 = m[1 * 4 + 2];
  const c = Math.cos(angleInRadians);
  const s = Math.sin(angleInRadians);
  dst[0] = c * m00 + s * m10;
  dst[1] = c * m01 + s * m11;
  dst[2] = c * m02 + s * m12;
  dst[4] = c * m10 - s * m00;
  dst[5] = c * m11 - s * m01;
  dst[6] = c * m12 - s * m02;
  if (m !== dst) {
    dst[8] = m[8];
    dst[9] = m[9];
    dst[10] = m[10];
  }
  return dst;
}
/**
 * Creates a 3-by-3 matrix which scales in each dimension by an amount given by
 * the corresponding entry in the given vector; assumes the vector has three
 * entries.
 * @param v - A vector of
 *     2 entries specifying the factor by which to scale in each dimension.
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns The scaling matrix.
 */
function scaling$1(v, dst) {
  dst = dst || newMat3();
  dst[0] = v[0];
  dst[1] = 0;
  dst[2] = 0;
  dst[4] = 0;
  dst[5] = v[1];
  dst[6] = 0;
  dst[8] = 0;
  dst[9] = 0;
  dst[10] = 1;
  return dst;
}
/**
 * Scales the given 3-by-3 matrix in each dimension by an amount
 * given by the corresponding entry in the given vector; assumes the vector has
 * three entries.
 * @param m - The matrix to be modified.
 * @param v - A vector of 2 entries specifying the
 *     factor by which to scale in each dimension.
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns The scaled matrix.
 */
function scale$4(m, v, dst) {
  dst = dst || newMat3();
  const v0 = v[0];
  const v1 = v[1];
  dst[0] = v0 * m[0 * 4 + 0];
  dst[1] = v0 * m[0 * 4 + 1];
  dst[2] = v0 * m[0 * 4 + 2];
  dst[4] = v1 * m[1 * 4 + 0];
  dst[5] = v1 * m[1 * 4 + 1];
  dst[6] = v1 * m[1 * 4 + 2];
  if (m !== dst) {
    dst[8] = m[8];
    dst[9] = m[9];
    dst[10] = m[10];
  }
  return dst;
}
/**
 * Creates a 3-by-3 matrix which scales uniformly in each dimension
 * @param s - Amount to scale
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns The scaling matrix.
 */
function uniformScaling$1(s, dst) {
  dst = dst || newMat3();
  dst[0] = s;
  dst[1] = 0;
  dst[2] = 0;
  dst[4] = 0;
  dst[5] = s;
  dst[6] = 0;
  dst[8] = 0;
  dst[9] = 0;
  dst[10] = 1;
  return dst;
}
/**
 * Scales the given 3-by-3 matrix in each dimension by an amount
 * given.
 * @param m - The matrix to be modified.
 * @param s - Amount to scale.
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns The scaled matrix.
 */
function uniformScale$1(m, s, dst) {
  dst = dst || newMat3();
  dst[0] = s * m[0 * 4 + 0];
  dst[1] = s * m[0 * 4 + 1];
  dst[2] = s * m[0 * 4 + 2];
  dst[4] = s * m[1 * 4 + 0];
  dst[5] = s * m[1 * 4 + 1];
  dst[6] = s * m[1 * 4 + 2];
  if (m !== dst) {
    dst[8] = m[8];
    dst[9] = m[9];
    dst[10] = m[10];
  }
  return dst;
}
var mat3Impl = exports.mat3 = /*#__PURE__*/Object.freeze({
  __proto__: null,
  setDefaultType: setDefaultType$4,
  create: create$3,
  set: set$4,
  fromMat4: fromMat4,
  fromQuat: fromQuat$1,
  negate: negate$3,
  copy: copy$4,
  clone: clone$4,
  equalsApproximately: equalsApproximately$4,
  equals: equals$4,
  identity: identity$2,
  transpose: transpose$1,
  inverse: inverse$4,
  determinant: determinant$1,
  invert: invert$3,
  multiply: multiply$4,
  mul: mul$4,
  setTranslation: setTranslation$1,
  getTranslation: getTranslation$2,
  getAxis: getAxis$2,
  setAxis: setAxis$1,
  getScaling: getScaling$2,
  translation: translation$1,
  translate: translate$1,
  rotation: rotation$1,
  rotate: rotate$1,
  scaling: scaling$1,
  scale: scale$4,
  uniformScaling: uniformScaling$1,
  uniformScale: uniformScale$1
});

/*
 * Copyright 2022 Gregg Tavares
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.  IN NO EVENT SHALL
 * THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 */
/**
 * Creates a vec3; may be called with x, y, z to set initial values. (same as create)
 * @param x - Initial x value.
 * @param y - Initial y value.
 * @param z - Initial z value.
 * @returns the created vector
 */
const fromValues$2 = create$4;
/**
 * Sets the values of a Vec3
 * Also see {@link vec3.create} and {@link vec3.copy}
 *
 * @param x first value
 * @param y second value
 * @param z third value
 * @param dst - vector to hold result. If not passed in a new one is created.
 * @returns A vector with its elements set.
 */
function set$3(x, y, z, dst) {
  dst = dst || new VecType$1(3);
  dst[0] = x;
  dst[1] = y;
  dst[2] = z;
  return dst;
}
/**
 * Applies Math.ceil to each element of vector
 * @param v - Operand vector.
 * @param dst - vector to hold result. If not passed in a new one is created.
 * @returns A vector that is the ceil of each element of v.
 */
function ceil$1(v, dst) {
  dst = dst || new VecType$1(3);
  dst[0] = Math.ceil(v[0]);
  dst[1] = Math.ceil(v[1]);
  dst[2] = Math.ceil(v[2]);
  return dst;
}
/**
 * Applies Math.floor to each element of vector
 * @param v - Operand vector.
 * @param dst - vector to hold result. If not passed in a new one is created.
 * @returns A vector that is the floor of each element of v.
 */
function floor$1(v, dst) {
  dst = dst || new VecType$1(3);
  dst[0] = Math.floor(v[0]);
  dst[1] = Math.floor(v[1]);
  dst[2] = Math.floor(v[2]);
  return dst;
}
/**
 * Applies Math.round to each element of vector
 * @param v - Operand vector.
 * @param dst - vector to hold result. If not passed in a new one is created.
 * @returns A vector that is the round of each element of v.
 */
function round$1(v, dst) {
  dst = dst || new VecType$1(3);
  dst[0] = Math.round(v[0]);
  dst[1] = Math.round(v[1]);
  dst[2] = Math.round(v[2]);
  return dst;
}
/**
 * Clamp each element of vector between min and max
 * @param v - Operand vector.
 * @param max - Min value, default 0
 * @param min - Max value, default 1
 * @param dst - vector to hold result. If not passed in a new one is created.
 * @returns A vector that the clamped value of each element of v.
 */
function clamp$1(v, min = 0, max = 1, dst) {
  dst = dst || new VecType$1(3);
  dst[0] = Math.min(max, Math.max(min, v[0]));
  dst[1] = Math.min(max, Math.max(min, v[1]));
  dst[2] = Math.min(max, Math.max(min, v[2]));
  return dst;
}
/**
 * Adds two vectors; assumes a and b have the same dimension.
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @param dst - vector to hold result. If not passed in a new one is created.
 * @returns A vector that is the sum of a and b.
 */
function add$2(a, b, dst) {
  dst = dst || new VecType$1(3);
  dst[0] = a[0] + b[0];
  dst[1] = a[1] + b[1];
  dst[2] = a[2] + b[2];
  return dst;
}
/**
 * Adds two vectors, scaling the 2nd; assumes a and b have the same dimension.
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @param scale - Amount to scale b
 * @param dst - vector to hold result. If not passed in a new one is created.
 * @returns A vector that is the sum of a + b * scale.
 */
function addScaled$1(a, b, scale, dst) {
  dst = dst || new VecType$1(3);
  dst[0] = a[0] + b[0] * scale;
  dst[1] = a[1] + b[1] * scale;
  dst[2] = a[2] + b[2] * scale;
  return dst;
}
/**
 * Returns the angle in radians between two vectors.
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @returns The angle in radians between the 2 vectors.
 */
function angle$1(a, b) {
  const ax = a[0];
  const ay = a[1];
  const az = a[2];
  const bx = a[0];
  const by = a[1];
  const bz = a[2];
  const mag1 = Math.sqrt(ax * ax + ay * ay + az * az);
  const mag2 = Math.sqrt(bx * bx + by * by + bz * bz);
  const mag = mag1 * mag2;
  const cosine = mag && dot$2(a, b) / mag;
  return Math.acos(cosine);
}
/**
 * Subtracts two vectors.
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @param dst - vector to hold result. If not passed in a new one is created.
 * @returns A vector that is the difference of a and b.
 */
function subtract$2(a, b, dst) {
  dst = dst || new VecType$1(3);
  dst[0] = a[0] - b[0];
  dst[1] = a[1] - b[1];
  dst[2] = a[2] - b[2];
  return dst;
}
/**
 * Subtracts two vectors.
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @param dst - vector to hold result. If not passed in a new one is created.
 * @returns A vector that is the difference of a and b.
 */
const sub$2 = subtract$2;
/**
 * Check if 2 vectors are approximately equal
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @returns true if vectors are approximately equal
 */
function equalsApproximately$3(a, b) {
  return Math.abs(a[0] - b[0]) < EPSILON && Math.abs(a[1] - b[1]) < EPSILON && Math.abs(a[2] - b[2]) < EPSILON;
}
/**
 * Check if 2 vectors are exactly equal
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @returns true if vectors are exactly equal
 */
function equals$3(a, b) {
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
}
/**
 * Performs linear interpolation on two vectors.
 * Given vectors a and b and interpolation coefficient t, returns
 * a + t * (b - a).
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @param t - Interpolation coefficient.
 * @param dst - vector to hold result. If not passed in a new one is created.
 * @returns The linear interpolated result.
 */
function lerp$2(a, b, t, dst) {
  dst = dst || new VecType$1(3);
  dst[0] = a[0] + t * (b[0] - a[0]);
  dst[1] = a[1] + t * (b[1] - a[1]);
  dst[2] = a[2] + t * (b[2] - a[2]);
  return dst;
}
/**
 * Performs linear interpolation on two vectors.
 * Given vectors a and b and interpolation coefficient vector t, returns
 * a + t * (b - a).
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @param t - Interpolation coefficients vector.
 * @param dst - vector to hold result. If not passed in a new one is created.
 * @returns the linear interpolated result.
 */
function lerpV$1(a, b, t, dst) {
  dst = dst || new VecType$1(3);
  dst[0] = a[0] + t[0] * (b[0] - a[0]);
  dst[1] = a[1] + t[1] * (b[1] - a[1]);
  dst[2] = a[2] + t[2] * (b[2] - a[2]);
  return dst;
}
/**
 * Return max values of two vectors.
 * Given vectors a and b returns
 * [max(a[0], b[0]), max(a[1], b[1]), max(a[2], b[2])].
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @param dst - vector to hold result. If not passed in a new one is created.
 * @returns The max components vector.
 */
function max$1(a, b, dst) {
  dst = dst || new VecType$1(3);
  dst[0] = Math.max(a[0], b[0]);
  dst[1] = Math.max(a[1], b[1]);
  dst[2] = Math.max(a[2], b[2]);
  return dst;
}
/**
 * Return min values of two vectors.
 * Given vectors a and b returns
 * [min(a[0], b[0]), min(a[1], b[1]), min(a[2], b[2])].
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @param dst - vector to hold result. If not passed in a new one is created.
 * @returns The min components vector.
 */
function min$1(a, b, dst) {
  dst = dst || new VecType$1(3);
  dst[0] = Math.min(a[0], b[0]);
  dst[1] = Math.min(a[1], b[1]);
  dst[2] = Math.min(a[2], b[2]);
  return dst;
}
/**
 * Multiplies a vector by a scalar.
 * @param v - The vector.
 * @param k - The scalar.
 * @param dst - vector to hold result. If not passed in a new one is created.
 * @returns The scaled vector.
 */
function mulScalar$2(v, k, dst) {
  dst = dst || new VecType$1(3);
  dst[0] = v[0] * k;
  dst[1] = v[1] * k;
  dst[2] = v[2] * k;
  return dst;
}
/**
 * Multiplies a vector by a scalar. (same as mulScalar)
 * @param v - The vector.
 * @param k - The scalar.
 * @param dst - vector to hold result. If not passed in a new one is created.
 * @returns The scaled vector.
 */
const scale$3 = mulScalar$2;
/**
 * Divides a vector by a scalar.
 * @param v - The vector.
 * @param k - The scalar.
 * @param dst - vector to hold result. If not passed in a new one is created.
 * @returns The scaled vector.
 */
function divScalar$2(v, k, dst) {
  dst = dst || new VecType$1(3);
  dst[0] = v[0] / k;
  dst[1] = v[1] / k;
  dst[2] = v[2] / k;
  return dst;
}
/**
 * Inverse a vector.
 * @param v - The vector.
 * @param dst - vector to hold result. If not passed in a new one is created.
 * @returns The inverted vector.
 */
function inverse$3(v, dst) {
  dst = dst || new VecType$1(3);
  dst[0] = 1 / v[0];
  dst[1] = 1 / v[1];
  dst[2] = 1 / v[2];
  return dst;
}
/**
 * Invert a vector. (same as inverse)
 * @param v - The vector.
 * @param dst - vector to hold result. If not passed in a new one is created.
 * @returns The inverted vector.
 */
const invert$2 = inverse$3;
/**
 * Computes the cross product of two vectors; assumes both vectors have
 * three entries.
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @param dst - vector to hold result. If not passed in a new one is created.
 * @returns The vector of a cross b.
 */
function cross(a, b, dst) {
  dst = dst || new VecType$1(3);
  const t1 = a[2] * b[0] - a[0] * b[2];
  const t2 = a[0] * b[1] - a[1] * b[0];
  dst[0] = a[1] * b[2] - a[2] * b[1];
  dst[1] = t1;
  dst[2] = t2;
  return dst;
}
/**
 * Computes the dot product of two vectors; assumes both vectors have
 * three entries.
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @returns dot product
 */
function dot$2(a, b) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}
/**
 * Computes the length of vector
 * @param v - vector.
 * @returns length of vector.
 */
function length$2(v) {
  const v0 = v[0];
  const v1 = v[1];
  const v2 = v[2];
  return Math.sqrt(v0 * v0 + v1 * v1 + v2 * v2);
}
/**
 * Computes the length of vector (same as length)
 * @param v - vector.
 * @returns length of vector.
 */
const len$2 = length$2;
/**
 * Computes the square of the length of vector
 * @param v - vector.
 * @returns square of the length of vector.
 */
function lengthSq$2(v) {
  const v0 = v[0];
  const v1 = v[1];
  const v2 = v[2];
  return v0 * v0 + v1 * v1 + v2 * v2;
}
/**
 * Computes the square of the length of vector (same as lengthSq)
 * @param v - vector.
 * @returns square of the length of vector.
 */
const lenSq$2 = lengthSq$2;
/**
 * Computes the distance between 2 points
 * @param a - vector.
 * @param b - vector.
 * @returns distance between a and b
 */
function distance$1(a, b) {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  const dz = a[2] - b[2];
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}
/**
 * Computes the distance between 2 points (same as distance)
 * @param a - vector.
 * @param b - vector.
 * @returns distance between a and b
 */
const dist$1 = distance$1;
/**
 * Computes the square of the distance between 2 points
 * @param a - vector.
 * @param b - vector.
 * @returns square of the distance between a and b
 */
function distanceSq$1(a, b) {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  const dz = a[2] - b[2];
  return dx * dx + dy * dy + dz * dz;
}
/**
 * Computes the square of the distance between 2 points (same as distanceSq)
 * @param a - vector.
 * @param b - vector.
 * @returns square of the distance between a and b
 */
const distSq$1 = distanceSq$1;
/**
 * Divides a vector by its Euclidean length and returns the quotient.
 * @param v - The vector.
 * @param dst - vector to hold result. If not passed in a new one is created.
 * @returns The normalized vector.
 */
function normalize$2(v, dst) {
  dst = dst || new VecType$1(3);
  const v0 = v[0];
  const v1 = v[1];
  const v2 = v[2];
  const len = Math.sqrt(v0 * v0 + v1 * v1 + v2 * v2);
  if (len > 0.00001) {
    dst[0] = v0 / len;
    dst[1] = v1 / len;
    dst[2] = v2 / len;
  } else {
    dst[0] = 0;
    dst[1] = 0;
    dst[2] = 0;
  }
  return dst;
}
/**
 * Negates a vector.
 * @param v - The vector.
 * @param dst - vector to hold result. If not passed in a new one is created.
 * @returns -v.
 */
function negate$2(v, dst) {
  dst = dst || new VecType$1(3);
  dst[0] = -v[0];
  dst[1] = -v[1];
  dst[2] = -v[2];
  return dst;
}
/**
 * Copies a vector. (same as {@link vec3.clone})
 * Also see {@link vec3.create} and {@link vec3.set}
 * @param v - The vector.
 * @param dst - vector to hold result. If not passed in a new one is created.
 * @returns A copy of v.
 */
function copy$3(v, dst) {
  dst = dst || new VecType$1(3);
  dst[0] = v[0];
  dst[1] = v[1];
  dst[2] = v[2];
  return dst;
}
/**
 * Clones a vector. (same as {@link vec3.copy})
 * Also see {@link vec3.create} and {@link vec3.set}
 * @param v - The vector.
 * @param dst - vector to hold result. If not passed in a new one is created.
 * @returns A copy of v.
 */
const clone$3 = copy$3;
/**
 * Multiplies a vector by another vector (component-wise); assumes a and
 * b have the same length.
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @param dst - vector to hold result. If not passed in a new one is created.
 * @returns The vector of products of entries of a and b.
 */
function multiply$3(a, b, dst) {
  dst = dst || new VecType$1(3);
  dst[0] = a[0] * b[0];
  dst[1] = a[1] * b[1];
  dst[2] = a[2] * b[2];
  return dst;
}
/**
 * Multiplies a vector by another vector (component-wise); assumes a and
 * b have the same length. (same as mul)
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @param dst - vector to hold result. If not passed in a new one is created.
 * @returns The vector of products of entries of a and b.
 */
const mul$3 = multiply$3;
/**
 * Divides a vector by another vector (component-wise); assumes a and
 * b have the same length.
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @param dst - vector to hold result. If not passed in a new one is created.
 * @returns The vector of quotients of entries of a and b.
 */
function divide$1(a, b, dst) {
  dst = dst || new VecType$1(3);
  dst[0] = a[0] / b[0];
  dst[1] = a[1] / b[1];
  dst[2] = a[2] / b[2];
  return dst;
}
/**
 * Divides a vector by another vector (component-wise); assumes a and
 * b have the same length. (same as divide)
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @param dst - vector to hold result. If not passed in a new one is created.
 * @returns The vector of quotients of entries of a and b.
 */
const div$1 = divide$1;
/**
 * Creates a random vector
 * @param scale - Default 1
 * @param dst - vector to hold result. If not passed in a new one is created.
 * @returns The random vector.
 */
function random(scale = 1, dst) {
  dst = dst || new VecType$1(3);
  const angle = Math.random() * 2 * Math.PI;
  const z = Math.random() * 2 - 1;
  const zScale = Math.sqrt(1 - z * z) * scale;
  dst[0] = Math.cos(angle) * zScale;
  dst[1] = Math.sin(angle) * zScale;
  dst[2] = z * scale;
  return dst;
}
/**
 * Zero's a vector
 * @param dst - vector to hold result. If not passed in a new one is created.
 * @returns The zeroed vector.
 */
function zero$1(dst) {
  dst = dst || new VecType$1(3);
  dst[0] = 0;
  dst[1] = 0;
  dst[2] = 0;
  return dst;
}
/**
 * transform vec3 by 4x4 matrix
 * @param v - the vector
 * @param m - The matrix.
 * @param dst - optional vec3 to store result. If not passed a new one is created.
 * @returns the transformed vector
 */
function transformMat4$1(v, m, dst) {
  dst = dst || new VecType$1(3);
  const x = v[0];
  const y = v[1];
  const z = v[2];
  const w = m[3] * x + m[7] * y + m[11] * z + m[15] || 1;
  dst[0] = (m[0] * x + m[4] * y + m[8] * z + m[12]) / w;
  dst[1] = (m[1] * x + m[5] * y + m[9] * z + m[13]) / w;
  dst[2] = (m[2] * x + m[6] * y + m[10] * z + m[14]) / w;
  return dst;
}
/**
 * Transform vec4 by upper 3x3 matrix inside 4x4 matrix.
 * @param v - The direction.
 * @param m - The matrix.
 * @param dst - optional Vec3 to store result. If not passed a new one is created.
 * @returns The transformed vector.
 */
function transformMat4Upper3x3(v, m, dst) {
  dst = dst || new VecType$1(3);
  const v0 = v[0];
  const v1 = v[1];
  const v2 = v[2];
  dst[0] = v0 * m[0 * 4 + 0] + v1 * m[1 * 4 + 0] + v2 * m[2 * 4 + 0];
  dst[1] = v0 * m[0 * 4 + 1] + v1 * m[1 * 4 + 1] + v2 * m[2 * 4 + 1];
  dst[2] = v0 * m[0 * 4 + 2] + v1 * m[1 * 4 + 2] + v2 * m[2 * 4 + 2];
  return dst;
}
/**
 * Transforms vec3 by 3x3 matrix
 *
 * @param v - the vector
 * @param m - The matrix.
 * @param dst - optional vec3 to store result. If not passed a new one is created.
 * @returns the transformed vector
 */
function transformMat3(v, m, dst) {
  dst = dst || new VecType$1(3);
  const x = v[0];
  const y = v[1];
  const z = v[2];
  dst[0] = x * m[0] + y * m[4] + z * m[8];
  dst[1] = x * m[1] + y * m[5] + z * m[9];
  dst[2] = x * m[2] + y * m[6] + z * m[10];
  return dst;
}
/**
 * Transforms vec3 by Quaternion
 * @param v - the vector to transform
 * @param q - the quaternion to transform by
 * @param dst - optional vec3 to store result. If not passed a new one is created.
 * @returns the transformed
 */
function transformQuat(v, q, dst) {
  dst = dst || new VecType$1(3);
  const qx = q[0];
  const qy = q[1];
  const qz = q[2];
  const w2 = q[3] * 2;
  const x = v[0];
  const y = v[1];
  const z = v[2];
  const uvX = qy * z - qz * y;
  const uvY = qz * x - qx * z;
  const uvZ = qx * y - qy * x;
  dst[0] = x + uvX * w2 + (qy * uvZ - qz * uvY) * 2;
  dst[1] = y + uvY * w2 + (qz * uvX - qx * uvZ) * 2;
  dst[2] = z + uvZ * w2 + (qx * uvY - qy * uvX) * 2;
  return dst;
}
/**
 * Returns the translation component of a 4-by-4 matrix as a vector with 3
 * entries.
 * @param m - The matrix.
 * @param dst - vector to hold result. If not passed a new one is created.
 * @returns The translation component of m.
 */
function getTranslation$1(m, dst) {
  dst = dst || new VecType$1(3);
  dst[0] = m[12];
  dst[1] = m[13];
  dst[2] = m[14];
  return dst;
}
/**
 * Returns an axis of a 4x4 matrix as a vector with 3 entries
 * @param m - The matrix.
 * @param axis - The axis 0 = x, 1 = y, 2 = z;
 * @returns The axis component of m.
 */
function getAxis$1(m, axis, dst) {
  dst = dst || new VecType$1(3);
  const off = axis * 4;
  dst[0] = m[off + 0];
  dst[1] = m[off + 1];
  dst[2] = m[off + 2];
  return dst;
}
/**
 * Returns the scaling component of the matrix
 * @param m - The Matrix
 * @param dst - The vector to set. If not passed a new one is created.
 */
function getScaling$1(m, dst) {
  dst = dst || new VecType$1(3);
  const xx = m[0];
  const xy = m[1];
  const xz = m[2];
  const yx = m[4];
  const yy = m[5];
  const yz = m[6];
  const zx = m[8];
  const zy = m[9];
  const zz = m[10];
  dst[0] = Math.sqrt(xx * xx + xy * xy + xz * xz);
  dst[1] = Math.sqrt(yx * yx + yy * yy + yz * yz);
  dst[2] = Math.sqrt(zx * zx + zy * zy + zz * zz);
  return dst;
}
var vec3Impl = exports.vec3 = /*#__PURE__*/Object.freeze({
  __proto__: null,
  create: create$4,
  setDefaultType: setDefaultType$5,
  fromValues: fromValues$2,
  set: set$3,
  ceil: ceil$1,
  floor: floor$1,
  round: round$1,
  clamp: clamp$1,
  add: add$2,
  addScaled: addScaled$1,
  angle: angle$1,
  subtract: subtract$2,
  sub: sub$2,
  equalsApproximately: equalsApproximately$3,
  equals: equals$3,
  lerp: lerp$2,
  lerpV: lerpV$1,
  max: max$1,
  min: min$1,
  mulScalar: mulScalar$2,
  scale: scale$3,
  divScalar: divScalar$2,
  inverse: inverse$3,
  invert: invert$2,
  cross: cross,
  dot: dot$2,
  length: length$2,
  len: len$2,
  lengthSq: lengthSq$2,
  lenSq: lenSq$2,
  distance: distance$1,
  dist: dist$1,
  distanceSq: distanceSq$1,
  distSq: distSq$1,
  normalize: normalize$2,
  negate: negate$2,
  copy: copy$3,
  clone: clone$3,
  multiply: multiply$3,
  mul: mul$3,
  divide: divide$1,
  div: div$1,
  random: random,
  zero: zero$1,
  transformMat4: transformMat4$1,
  transformMat4Upper3x3: transformMat4Upper3x3,
  transformMat3: transformMat3,
  transformQuat: transformQuat,
  getTranslation: getTranslation$1,
  getAxis: getAxis$1,
  getScaling: getScaling$1
});

/**
 * 4x4 Matrix math math functions.
 *
 * Almost all functions take an optional `dst` argument. If it is not passed in the
 * functions will create a new matrix. In other words you can do this
 *
 *     const mat = mat4.translation([1, 2, 3]);  // Creates a new translation matrix
 *
 * or
 *
 *     const mat = mat4.create();
 *     mat4.translation([1, 2, 3], mat);  // Puts translation matrix in mat.
 *
 * The first style is often easier but depending on where it's used it generates garbage where
 * as there is almost never allocation with the second style.
 *
 * It is always save to pass any matrix as the destination. So for example
 *
 *     const mat = mat4.identity();
 *     const trans = mat4.translation([1, 2, 3]);
 *     mat4.multiply(mat, trans, mat);  // Multiplies mat * trans and puts result in mat.
 *
 */
let MatType = Float32Array;
/**
 * Sets the type this library creates for a Mat4
 * @param ctor - the constructor for the type. Either `Float32Array`, `Float64Array`, or `Array`
 * @returns previous constructor for Mat4
 */
function setDefaultType$3(ctor) {
  const oldType = MatType;
  MatType = ctor;
  return oldType;
}
/**
 * Create a Mat4 from values
 *
 * Note: Since passing in a raw JavaScript array
 * is valid in all circumstances, if you want to
 * force a JavaScript array into a Mat4's specified type
 * it would be faster to use
 *
 * ```
 * const m = mat4.clone(someJSArray);
 * ```
 *
 * Note: a consequence of the implementation is if your Mat4Type = `Array`
 * instead of `Float32Array` or `Float64Array` then any values you
 * don't pass in will be undefined. Usually this is not an issue since
 * (a) using `Array` is rare and (b) using `mat4.create` is usually used
 * to create a Mat4 to be filled out as in
 *
 * ```
 * const m = mat4.create();
 * mat4.perspective(fov, aspect, near, far, m);
 * ```
 *
 * @param v0 - value for element 0
 * @param v1 - value for element 1
 * @param v2 - value for element 2
 * @param v3 - value for element 3
 * @param v4 - value for element 4
 * @param v5 - value for element 5
 * @param v6 - value for element 6
 * @param v7 - value for element 7
 * @param v8 - value for element 8
 * @param v9 - value for element 9
 * @param v10 - value for element 10
 * @param v11 - value for element 11
 * @param v12 - value for element 12
 * @param v13 - value for element 13
 * @param v14 - value for element 14
 * @param v15 - value for element 15
 * @returns created from values.
 */
function create$2(v0, v1, v2, v3, v4, v5, v6, v7, v8, v9, v10, v11, v12, v13, v14, v15) {
  const dst = new MatType(16);
  if (v0 !== undefined) {
    dst[0] = v0;
    if (v1 !== undefined) {
      dst[1] = v1;
      if (v2 !== undefined) {
        dst[2] = v2;
        if (v3 !== undefined) {
          dst[3] = v3;
          if (v4 !== undefined) {
            dst[4] = v4;
            if (v5 !== undefined) {
              dst[5] = v5;
              if (v6 !== undefined) {
                dst[6] = v6;
                if (v7 !== undefined) {
                  dst[7] = v7;
                  if (v8 !== undefined) {
                    dst[8] = v8;
                    if (v9 !== undefined) {
                      dst[9] = v9;
                      if (v10 !== undefined) {
                        dst[10] = v10;
                        if (v11 !== undefined) {
                          dst[11] = v11;
                          if (v12 !== undefined) {
                            dst[12] = v12;
                            if (v13 !== undefined) {
                              dst[13] = v13;
                              if (v14 !== undefined) {
                                dst[14] = v14;
                                if (v15 !== undefined) {
                                  dst[15] = v15;
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
  return dst;
}
/**
 * Sets the values of a Mat4
 * Also see {@link mat4.create} and {@link mat4.copy}
 *
 * @param v0 - value for element 0
 * @param v1 - value for element 1
 * @param v2 - value for element 2
 * @param v3 - value for element 3
 * @param v4 - value for element 4
 * @param v5 - value for element 5
 * @param v6 - value for element 6
 * @param v7 - value for element 7
 * @param v8 - value for element 8
 * @param v9 - value for element 9
 * @param v10 - value for element 10
 * @param v11 - value for element 11
 * @param v12 - value for element 12
 * @param v13 - value for element 13
 * @param v14 - value for element 14
 * @param v15 - value for element 15
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns Mat4 created from values.
 */
function set$2(v0, v1, v2, v3, v4, v5, v6, v7, v8, v9, v10, v11, v12, v13, v14, v15, dst) {
  dst = dst || new MatType(16);
  dst[0] = v0;
  dst[1] = v1;
  dst[2] = v2;
  dst[3] = v3;
  dst[4] = v4;
  dst[5] = v5;
  dst[6] = v6;
  dst[7] = v7;
  dst[8] = v8;
  dst[9] = v9;
  dst[10] = v10;
  dst[11] = v11;
  dst[12] = v12;
  dst[13] = v13;
  dst[14] = v14;
  dst[15] = v15;
  return dst;
}
/**
 * Creates a Mat4 from a Mat3
 * @param m3 - source matrix
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns Mat4 made from m3
 */
function fromMat3(m3, dst) {
  dst = dst || new MatType(16);
  dst[0] = m3[0];
  dst[1] = m3[1];
  dst[2] = m3[2];
  dst[3] = 0;
  dst[4] = m3[4];
  dst[5] = m3[5];
  dst[6] = m3[6];
  dst[7] = 0;
  dst[8] = m3[8];
  dst[9] = m3[9];
  dst[10] = m3[10];
  dst[11] = 0;
  dst[12] = 0;
  dst[13] = 0;
  dst[14] = 0;
  dst[15] = 1;
  return dst;
}
/**
 * Creates a Mat4 rotation matrix from a quaternion
 * @param q - quaternion to create matrix from
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns Mat4 made from q
 */
function fromQuat(q, dst) {
  dst = dst || new MatType(16);
  const x = q[0];
  const y = q[1];
  const z = q[2];
  const w = q[3];
  const x2 = x + x;
  const y2 = y + y;
  const z2 = z + z;
  const xx = x * x2;
  const yx = y * x2;
  const yy = y * y2;
  const zx = z * x2;
  const zy = z * y2;
  const zz = z * z2;
  const wx = w * x2;
  const wy = w * y2;
  const wz = w * z2;
  dst[0] = 1 - yy - zz;
  dst[1] = yx + wz;
  dst[2] = zx - wy;
  dst[3] = 0;
  dst[4] = yx - wz;
  dst[5] = 1 - xx - zz;
  dst[6] = zy + wx;
  dst[7] = 0;
  dst[8] = zx + wy;
  dst[9] = zy - wx;
  dst[10] = 1 - xx - yy;
  dst[11] = 0;
  dst[12] = 0;
  dst[13] = 0;
  dst[14] = 0;
  dst[15] = 1;
  return dst;
}
/**
 * Negates a matrix.
 * @param m - The matrix.
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns -m.
 */
function negate$1(m, dst) {
  dst = dst || new MatType(16);
  dst[0] = -m[0];
  dst[1] = -m[1];
  dst[2] = -m[2];
  dst[3] = -m[3];
  dst[4] = -m[4];
  dst[5] = -m[5];
  dst[6] = -m[6];
  dst[7] = -m[7];
  dst[8] = -m[8];
  dst[9] = -m[9];
  dst[10] = -m[10];
  dst[11] = -m[11];
  dst[12] = -m[12];
  dst[13] = -m[13];
  dst[14] = -m[14];
  dst[15] = -m[15];
  return dst;
}
/**
 * Copies a matrix. (same as {@link mat4.clone})
 * Also see {@link mat4.create} and {@link mat4.set}
 * @param m - The matrix.
 * @param dst - The matrix. If not passed a new one is created.
 * @returns A copy of m.
 */
function copy$2(m, dst) {
  dst = dst || new MatType(16);
  dst[0] = m[0];
  dst[1] = m[1];
  dst[2] = m[2];
  dst[3] = m[3];
  dst[4] = m[4];
  dst[5] = m[5];
  dst[6] = m[6];
  dst[7] = m[7];
  dst[8] = m[8];
  dst[9] = m[9];
  dst[10] = m[10];
  dst[11] = m[11];
  dst[12] = m[12];
  dst[13] = m[13];
  dst[14] = m[14];
  dst[15] = m[15];
  return dst;
}
/**
 * Copies a matrix (same as {@link mat4.copy})
 * Also see {@link mat4.create} and {@link mat4.set}
 * @param m - The matrix.
 * @param dst - The matrix. If not passed a new one is created.
 * @returns A copy of m.
 */
const clone$2 = copy$2;
/**
 * Check if 2 matrices are approximately equal
 * @param a - Operand matrix.
 * @param b - Operand matrix.
 * @returns true if matrices are approximately equal
 */
function equalsApproximately$2(a, b) {
  return Math.abs(a[0] - b[0]) < EPSILON && Math.abs(a[1] - b[1]) < EPSILON && Math.abs(a[2] - b[2]) < EPSILON && Math.abs(a[3] - b[3]) < EPSILON && Math.abs(a[4] - b[4]) < EPSILON && Math.abs(a[5] - b[5]) < EPSILON && Math.abs(a[6] - b[6]) < EPSILON && Math.abs(a[7] - b[7]) < EPSILON && Math.abs(a[8] - b[8]) < EPSILON && Math.abs(a[9] - b[9]) < EPSILON && Math.abs(a[10] - b[10]) < EPSILON && Math.abs(a[11] - b[11]) < EPSILON && Math.abs(a[12] - b[12]) < EPSILON && Math.abs(a[13] - b[13]) < EPSILON && Math.abs(a[14] - b[14]) < EPSILON && Math.abs(a[15] - b[15]) < EPSILON;
}
/**
 * Check if 2 matrices are exactly equal
 * @param a - Operand matrix.
 * @param b - Operand matrix.
 * @returns true if matrices are exactly equal
 */
function equals$2(a, b) {
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3] && a[4] === b[4] && a[5] === b[5] && a[6] === b[6] && a[7] === b[7] && a[8] === b[8] && a[9] === b[9] && a[10] === b[10] && a[11] === b[11] && a[12] === b[12] && a[13] === b[13] && a[14] === b[14] && a[15] === b[15];
}
/**
 * Creates a 4-by-4 identity matrix.
 *
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns A 4-by-4 identity matrix.
 */
function identity$1(dst) {
  dst = dst || new MatType(16);
  dst[0] = 1;
  dst[1] = 0;
  dst[2] = 0;
  dst[3] = 0;
  dst[4] = 0;
  dst[5] = 1;
  dst[6] = 0;
  dst[7] = 0;
  dst[8] = 0;
  dst[9] = 0;
  dst[10] = 1;
  dst[11] = 0;
  dst[12] = 0;
  dst[13] = 0;
  dst[14] = 0;
  dst[15] = 1;
  return dst;
}
/**
 * Takes the transpose of a matrix.
 * @param m - The matrix.
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns The transpose of m.
 */
function transpose(m, dst) {
  dst = dst || new MatType(16);
  if (dst === m) {
    let t;
    t = m[1];
    m[1] = m[4];
    m[4] = t;
    t = m[2];
    m[2] = m[8];
    m[8] = t;
    t = m[3];
    m[3] = m[12];
    m[12] = t;
    t = m[6];
    m[6] = m[9];
    m[9] = t;
    t = m[7];
    m[7] = m[13];
    m[13] = t;
    t = m[11];
    m[11] = m[14];
    m[14] = t;
    return dst;
  }
  const m00 = m[0 * 4 + 0];
  const m01 = m[0 * 4 + 1];
  const m02 = m[0 * 4 + 2];
  const m03 = m[0 * 4 + 3];
  const m10 = m[1 * 4 + 0];
  const m11 = m[1 * 4 + 1];
  const m12 = m[1 * 4 + 2];
  const m13 = m[1 * 4 + 3];
  const m20 = m[2 * 4 + 0];
  const m21 = m[2 * 4 + 1];
  const m22 = m[2 * 4 + 2];
  const m23 = m[2 * 4 + 3];
  const m30 = m[3 * 4 + 0];
  const m31 = m[3 * 4 + 1];
  const m32 = m[3 * 4 + 2];
  const m33 = m[3 * 4 + 3];
  dst[0] = m00;
  dst[1] = m10;
  dst[2] = m20;
  dst[3] = m30;
  dst[4] = m01;
  dst[5] = m11;
  dst[6] = m21;
  dst[7] = m31;
  dst[8] = m02;
  dst[9] = m12;
  dst[10] = m22;
  dst[11] = m32;
  dst[12] = m03;
  dst[13] = m13;
  dst[14] = m23;
  dst[15] = m33;
  return dst;
}
/**
 * Computes the inverse of a 4-by-4 matrix.
 * @param m - The matrix.
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns The inverse of m.
 */
function inverse$2(m, dst) {
  dst = dst || new MatType(16);
  const m00 = m[0 * 4 + 0];
  const m01 = m[0 * 4 + 1];
  const m02 = m[0 * 4 + 2];
  const m03 = m[0 * 4 + 3];
  const m10 = m[1 * 4 + 0];
  const m11 = m[1 * 4 + 1];
  const m12 = m[1 * 4 + 2];
  const m13 = m[1 * 4 + 3];
  const m20 = m[2 * 4 + 0];
  const m21 = m[2 * 4 + 1];
  const m22 = m[2 * 4 + 2];
  const m23 = m[2 * 4 + 3];
  const m30 = m[3 * 4 + 0];
  const m31 = m[3 * 4 + 1];
  const m32 = m[3 * 4 + 2];
  const m33 = m[3 * 4 + 3];
  const tmp0 = m22 * m33;
  const tmp1 = m32 * m23;
  const tmp2 = m12 * m33;
  const tmp3 = m32 * m13;
  const tmp4 = m12 * m23;
  const tmp5 = m22 * m13;
  const tmp6 = m02 * m33;
  const tmp7 = m32 * m03;
  const tmp8 = m02 * m23;
  const tmp9 = m22 * m03;
  const tmp10 = m02 * m13;
  const tmp11 = m12 * m03;
  const tmp12 = m20 * m31;
  const tmp13 = m30 * m21;
  const tmp14 = m10 * m31;
  const tmp15 = m30 * m11;
  const tmp16 = m10 * m21;
  const tmp17 = m20 * m11;
  const tmp18 = m00 * m31;
  const tmp19 = m30 * m01;
  const tmp20 = m00 * m21;
  const tmp21 = m20 * m01;
  const tmp22 = m00 * m11;
  const tmp23 = m10 * m01;
  const t0 = tmp0 * m11 + tmp3 * m21 + tmp4 * m31 - (tmp1 * m11 + tmp2 * m21 + tmp5 * m31);
  const t1 = tmp1 * m01 + tmp6 * m21 + tmp9 * m31 - (tmp0 * m01 + tmp7 * m21 + tmp8 * m31);
  const t2 = tmp2 * m01 + tmp7 * m11 + tmp10 * m31 - (tmp3 * m01 + tmp6 * m11 + tmp11 * m31);
  const t3 = tmp5 * m01 + tmp8 * m11 + tmp11 * m21 - (tmp4 * m01 + tmp9 * m11 + tmp10 * m21);
  const d = 1 / (m00 * t0 + m10 * t1 + m20 * t2 + m30 * t3);
  dst[0] = d * t0;
  dst[1] = d * t1;
  dst[2] = d * t2;
  dst[3] = d * t3;
  dst[4] = d * (tmp1 * m10 + tmp2 * m20 + tmp5 * m30 - (tmp0 * m10 + tmp3 * m20 + tmp4 * m30));
  dst[5] = d * (tmp0 * m00 + tmp7 * m20 + tmp8 * m30 - (tmp1 * m00 + tmp6 * m20 + tmp9 * m30));
  dst[6] = d * (tmp3 * m00 + tmp6 * m10 + tmp11 * m30 - (tmp2 * m00 + tmp7 * m10 + tmp10 * m30));
  dst[7] = d * (tmp4 * m00 + tmp9 * m10 + tmp10 * m20 - (tmp5 * m00 + tmp8 * m10 + tmp11 * m20));
  dst[8] = d * (tmp12 * m13 + tmp15 * m23 + tmp16 * m33 - (tmp13 * m13 + tmp14 * m23 + tmp17 * m33));
  dst[9] = d * (tmp13 * m03 + tmp18 * m23 + tmp21 * m33 - (tmp12 * m03 + tmp19 * m23 + tmp20 * m33));
  dst[10] = d * (tmp14 * m03 + tmp19 * m13 + tmp22 * m33 - (tmp15 * m03 + tmp18 * m13 + tmp23 * m33));
  dst[11] = d * (tmp17 * m03 + tmp20 * m13 + tmp23 * m23 - (tmp16 * m03 + tmp21 * m13 + tmp22 * m23));
  dst[12] = d * (tmp14 * m22 + tmp17 * m32 + tmp13 * m12 - (tmp16 * m32 + tmp12 * m12 + tmp15 * m22));
  dst[13] = d * (tmp20 * m32 + tmp12 * m02 + tmp19 * m22 - (tmp18 * m22 + tmp21 * m32 + tmp13 * m02));
  dst[14] = d * (tmp18 * m12 + tmp23 * m32 + tmp15 * m02 - (tmp22 * m32 + tmp14 * m02 + tmp19 * m12));
  dst[15] = d * (tmp22 * m22 + tmp16 * m02 + tmp21 * m12 - (tmp20 * m12 + tmp23 * m22 + tmp17 * m02));
  return dst;
}
/**
 * Compute the determinant of a matrix
 * @param m - the matrix
 * @returns the determinant
 */
function determinant(m) {
  const m00 = m[0 * 4 + 0];
  const m01 = m[0 * 4 + 1];
  const m02 = m[0 * 4 + 2];
  const m03 = m[0 * 4 + 3];
  const m10 = m[1 * 4 + 0];
  const m11 = m[1 * 4 + 1];
  const m12 = m[1 * 4 + 2];
  const m13 = m[1 * 4 + 3];
  const m20 = m[2 * 4 + 0];
  const m21 = m[2 * 4 + 1];
  const m22 = m[2 * 4 + 2];
  const m23 = m[2 * 4 + 3];
  const m30 = m[3 * 4 + 0];
  const m31 = m[3 * 4 + 1];
  const m32 = m[3 * 4 + 2];
  const m33 = m[3 * 4 + 3];
  const tmp0 = m22 * m33;
  const tmp1 = m32 * m23;
  const tmp2 = m12 * m33;
  const tmp3 = m32 * m13;
  const tmp4 = m12 * m23;
  const tmp5 = m22 * m13;
  const tmp6 = m02 * m33;
  const tmp7 = m32 * m03;
  const tmp8 = m02 * m23;
  const tmp9 = m22 * m03;
  const tmp10 = m02 * m13;
  const tmp11 = m12 * m03;
  const t0 = tmp0 * m11 + tmp3 * m21 + tmp4 * m31 - (tmp1 * m11 + tmp2 * m21 + tmp5 * m31);
  const t1 = tmp1 * m01 + tmp6 * m21 + tmp9 * m31 - (tmp0 * m01 + tmp7 * m21 + tmp8 * m31);
  const t2 = tmp2 * m01 + tmp7 * m11 + tmp10 * m31 - (tmp3 * m01 + tmp6 * m11 + tmp11 * m31);
  const t3 = tmp5 * m01 + tmp8 * m11 + tmp11 * m21 - (tmp4 * m01 + tmp9 * m11 + tmp10 * m21);
  return m00 * t0 + m10 * t1 + m20 * t2 + m30 * t3;
}
/**
 * Computes the inverse of a 4-by-4 matrix. (same as inverse)
 * @param m - The matrix.
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns The inverse of m.
 */
const invert$1 = inverse$2;
/**
 * Multiplies two 4-by-4 matrices with a on the left and b on the right
 * @param a - The matrix on the left.
 * @param b - The matrix on the right.
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns The matrix product of a and b.
 */
function multiply$2(a, b, dst) {
  dst = dst || new MatType(16);
  const a00 = a[0];
  const a01 = a[1];
  const a02 = a[2];
  const a03 = a[3];
  const a10 = a[4 + 0];
  const a11 = a[4 + 1];
  const a12 = a[4 + 2];
  const a13 = a[4 + 3];
  const a20 = a[8 + 0];
  const a21 = a[8 + 1];
  const a22 = a[8 + 2];
  const a23 = a[8 + 3];
  const a30 = a[12 + 0];
  const a31 = a[12 + 1];
  const a32 = a[12 + 2];
  const a33 = a[12 + 3];
  const b00 = b[0];
  const b01 = b[1];
  const b02 = b[2];
  const b03 = b[3];
  const b10 = b[4 + 0];
  const b11 = b[4 + 1];
  const b12 = b[4 + 2];
  const b13 = b[4 + 3];
  const b20 = b[8 + 0];
  const b21 = b[8 + 1];
  const b22 = b[8 + 2];
  const b23 = b[8 + 3];
  const b30 = b[12 + 0];
  const b31 = b[12 + 1];
  const b32 = b[12 + 2];
  const b33 = b[12 + 3];
  dst[0] = a00 * b00 + a10 * b01 + a20 * b02 + a30 * b03;
  dst[1] = a01 * b00 + a11 * b01 + a21 * b02 + a31 * b03;
  dst[2] = a02 * b00 + a12 * b01 + a22 * b02 + a32 * b03;
  dst[3] = a03 * b00 + a13 * b01 + a23 * b02 + a33 * b03;
  dst[4] = a00 * b10 + a10 * b11 + a20 * b12 + a30 * b13;
  dst[5] = a01 * b10 + a11 * b11 + a21 * b12 + a31 * b13;
  dst[6] = a02 * b10 + a12 * b11 + a22 * b12 + a32 * b13;
  dst[7] = a03 * b10 + a13 * b11 + a23 * b12 + a33 * b13;
  dst[8] = a00 * b20 + a10 * b21 + a20 * b22 + a30 * b23;
  dst[9] = a01 * b20 + a11 * b21 + a21 * b22 + a31 * b23;
  dst[10] = a02 * b20 + a12 * b21 + a22 * b22 + a32 * b23;
  dst[11] = a03 * b20 + a13 * b21 + a23 * b22 + a33 * b23;
  dst[12] = a00 * b30 + a10 * b31 + a20 * b32 + a30 * b33;
  dst[13] = a01 * b30 + a11 * b31 + a21 * b32 + a31 * b33;
  dst[14] = a02 * b30 + a12 * b31 + a22 * b32 + a32 * b33;
  dst[15] = a03 * b30 + a13 * b31 + a23 * b32 + a33 * b33;
  return dst;
}
/**
 * Multiplies two 4-by-4 matrices with a on the left and b on the right (same as multiply)
 * @param a - The matrix on the left.
 * @param b - The matrix on the right.
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns The matrix product of a and b.
 */
const mul$2 = multiply$2;
/**
 * Sets the translation component of a 4-by-4 matrix to the given
 * vector.
 * @param a - The matrix.
 * @param v - The vector.
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns The matrix with translation set.
 */
function setTranslation(a, v, dst) {
  dst = dst || identity$1();
  if (a !== dst) {
    dst[0] = a[0];
    dst[1] = a[1];
    dst[2] = a[2];
    dst[3] = a[3];
    dst[4] = a[4];
    dst[5] = a[5];
    dst[6] = a[6];
    dst[7] = a[7];
    dst[8] = a[8];
    dst[9] = a[9];
    dst[10] = a[10];
    dst[11] = a[11];
  }
  dst[12] = v[0];
  dst[13] = v[1];
  dst[14] = v[2];
  dst[15] = 1;
  return dst;
}
/**
 * Returns the translation component of a 4-by-4 matrix as a vector with 3
 * entries.
 * @param m - The matrix.
 * @param dst - vector to hold result. If not passed a new one is created.
 * @returns The translation component of m.
 */
function getTranslation(m, dst) {
  dst = dst || create$4();
  dst[0] = m[12];
  dst[1] = m[13];
  dst[2] = m[14];
  return dst;
}
/**
 * Returns an axis of a 4x4 matrix as a vector with 3 entries
 * @param m - The matrix.
 * @param axis - The axis 0 = x, 1 = y, 2 = z;
 * @returns The axis component of m.
 */
function getAxis(m, axis, dst) {
  dst = dst || create$4();
  const off = axis * 4;
  dst[0] = m[off + 0];
  dst[1] = m[off + 1];
  dst[2] = m[off + 2];
  return dst;
}
/**
 * Sets an axis of a 4x4 matrix as a vector with 3 entries
 * @param m - The matrix.
 * @param v - the axis vector
 * @param axis - The axis  0 = x, 1 = y, 2 = z;
 * @param dst - The matrix to set. If not passed a new one is created.
 * @returns The matrix with axis set.
 */
function setAxis(a, v, axis, dst) {
  if (dst !== a) {
    dst = copy$2(a, dst);
  }
  const off = axis * 4;
  dst[off + 0] = v[0];
  dst[off + 1] = v[1];
  dst[off + 2] = v[2];
  return dst;
}
/**
 * Returns the scaling component of the matrix
 * @param m - The Matrix
 * @param dst - The vector to set. If not passed a new one is created.
 */
function getScaling(m, dst) {
  dst = dst || create$4();
  const xx = m[0];
  const xy = m[1];
  const xz = m[2];
  const yx = m[4];
  const yy = m[5];
  const yz = m[6];
  const zx = m[8];
  const zy = m[9];
  const zz = m[10];
  dst[0] = Math.sqrt(xx * xx + xy * xy + xz * xz);
  dst[1] = Math.sqrt(yx * yx + yy * yy + yz * yz);
  dst[2] = Math.sqrt(zx * zx + zy * zy + zz * zz);
  return dst;
}
/**
 * Computes a 4-by-4 perspective transformation matrix given the angular height
 * of the frustum, the aspect ratio, and the near and far clipping planes.  The
 * arguments define a frustum extending in the negative z direction.  The given
 * angle is the vertical angle of the frustum, and the horizontal angle is
 * determined to produce the given aspect ratio.  The arguments near and far are
 * the distances to the near and far clipping planes.  Note that near and far
 * are not z coordinates, but rather they are distances along the negative
 * z-axis.  The matrix generated sends the viewing frustum to the unit box.
 * We assume a unit box extending from -1 to 1 in the x and y dimensions and
 * from 0 to 1 in the z dimension.
 *
 * Note: If you pass `Infinity` for zFar then it will produce a projection matrix
 * returns -Infinity for Z when transforming coordinates with Z <= 0 and +Infinity for Z
 * otherwise.
 *
 * @param fieldOfViewYInRadians - The camera angle from top to bottom (in radians).
 * @param aspect - The aspect ratio width / height.
 * @param zNear - The depth (negative z coordinate)
 *     of the near clipping plane.
 * @param zFar - The depth (negative z coordinate)
 *     of the far clipping plane.
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns The perspective matrix.
 */
function perspective(fieldOfViewYInRadians, aspect, zNear, zFar, dst) {
  dst = dst || new MatType(16);
  const f = Math.tan(Math.PI * 0.5 - 0.5 * fieldOfViewYInRadians);
  dst[0] = f / aspect;
  dst[1] = 0;
  dst[2] = 0;
  dst[3] = 0;
  dst[4] = 0;
  dst[5] = f;
  dst[6] = 0;
  dst[7] = 0;
  dst[8] = 0;
  dst[9] = 0;
  dst[11] = -1;
  dst[12] = 0;
  dst[13] = 0;
  dst[15] = 0;
  if (zFar === Infinity) {
    dst[10] = -1;
    dst[14] = -zNear;
  } else {
    const rangeInv = 1 / (zNear - zFar);
    dst[10] = zFar * rangeInv;
    dst[14] = zFar * zNear * rangeInv;
  }
  return dst;
}
/**
 * Computes a 4-by-4 orthogonal transformation matrix that transforms from
 * the given the left, right, bottom, and top dimensions to -1 +1 in x, and y
 * and 0 to +1 in z.
 * @param left - Left side of the near clipping plane viewport.
 * @param right - Right side of the near clipping plane viewport.
 * @param bottom - Bottom of the near clipping plane viewport.
 * @param top - Top of the near clipping plane viewport.
 * @param near - The depth (negative z coordinate)
 *     of the near clipping plane.
 * @param far - The depth (negative z coordinate)
 *     of the far clipping plane.
 * @param dst - Output matrix. If not passed a new one is created.
 * @returns The orthographic projection matrix.
 */
function ortho(left, right, bottom, top, near, far, dst) {
  dst = dst || new MatType(16);
  dst[0] = 2 / (right - left);
  dst[1] = 0;
  dst[2] = 0;
  dst[3] = 0;
  dst[4] = 0;
  dst[5] = 2 / (top - bottom);
  dst[6] = 0;
  dst[7] = 0;
  dst[8] = 0;
  dst[9] = 0;
  dst[10] = 1 / (near - far);
  dst[11] = 0;
  dst[12] = (right + left) / (left - right);
  dst[13] = (top + bottom) / (bottom - top);
  dst[14] = near / (near - far);
  dst[15] = 1;
  return dst;
}
/**
 * Computes a 4-by-4 perspective transformation matrix given the left, right,
 * top, bottom, near and far clipping planes. The arguments define a frustum
 * extending in the negative z direction. The arguments near and far are the
 * distances to the near and far clipping planes. Note that near and far are not
 * z coordinates, but rather they are distances along the negative z-axis. The
 * matrix generated sends the viewing frustum to the unit box. We assume a unit
 * box extending from -1 to 1 in the x and y dimensions and from 0 to 1 in the z
 * dimension.
 * @param left - The x coordinate of the left plane of the box.
 * @param right - The x coordinate of the right plane of the box.
 * @param bottom - The y coordinate of the bottom plane of the box.
 * @param top - The y coordinate of the right plane of the box.
 * @param near - The negative z coordinate of the near plane of the box.
 * @param far - The negative z coordinate of the far plane of the box.
 * @param dst - Output matrix. If not passed a new one is created.
 * @returns The perspective projection matrix.
 */
function frustum(left, right, bottom, top, near, far, dst) {
  dst = dst || new MatType(16);
  const dx = right - left;
  const dy = top - bottom;
  const dz = near - far;
  dst[0] = 2 * near / dx;
  dst[1] = 0;
  dst[2] = 0;
  dst[3] = 0;
  dst[4] = 0;
  dst[5] = 2 * near / dy;
  dst[6] = 0;
  dst[7] = 0;
  dst[8] = (left + right) / dx;
  dst[9] = (top + bottom) / dy;
  dst[10] = far / dz;
  dst[11] = -1;
  dst[12] = 0;
  dst[13] = 0;
  dst[14] = near * far / dz;
  dst[15] = 0;
  return dst;
}
let xAxis;
let yAxis;
let zAxis;
/**
 * Computes a 4-by-4 aim transformation.
 *
 * This is a matrix which positions an object aiming down positive Z.
 * toward the target.
 *
 * Note: this is **NOT** the inverse of lookAt as lookAt looks at negative Z.
 *
 * @param position - The position of the object.
 * @param target - The position meant to be aimed at.
 * @param up - A vector pointing up.
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns The aim matrix.
 */
function aim(position, target, up, dst) {
  dst = dst || new MatType(16);
  xAxis = xAxis || create$4();
  yAxis = yAxis || create$4();
  zAxis = zAxis || create$4();
  normalize$2(subtract$2(target, position, zAxis), zAxis);
  normalize$2(cross(up, zAxis, xAxis), xAxis);
  normalize$2(cross(zAxis, xAxis, yAxis), yAxis);
  dst[0] = xAxis[0];
  dst[1] = xAxis[1];
  dst[2] = xAxis[2];
  dst[3] = 0;
  dst[4] = yAxis[0];
  dst[5] = yAxis[1];
  dst[6] = yAxis[2];
  dst[7] = 0;
  dst[8] = zAxis[0];
  dst[9] = zAxis[1];
  dst[10] = zAxis[2];
  dst[11] = 0;
  dst[12] = position[0];
  dst[13] = position[1];
  dst[14] = position[2];
  dst[15] = 1;
  return dst;
}
/**
 * Computes a 4-by-4 camera aim transformation.
 *
 * This is a matrix which positions an object aiming down negative Z.
 * toward the target.
 *
 * Note: this is the inverse of `lookAt`
 *
 * @param eye - The position of the object.
 * @param target - The position meant to be aimed at.
 * @param up - A vector pointing up.
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns The aim matrix.
 */
function cameraAim(eye, target, up, dst) {
  dst = dst || new MatType(16);
  xAxis = xAxis || create$4();
  yAxis = yAxis || create$4();
  zAxis = zAxis || create$4();
  normalize$2(subtract$2(eye, target, zAxis), zAxis);
  normalize$2(cross(up, zAxis, xAxis), xAxis);
  normalize$2(cross(zAxis, xAxis, yAxis), yAxis);
  dst[0] = xAxis[0];
  dst[1] = xAxis[1];
  dst[2] = xAxis[2];
  dst[3] = 0;
  dst[4] = yAxis[0];
  dst[5] = yAxis[1];
  dst[6] = yAxis[2];
  dst[7] = 0;
  dst[8] = zAxis[0];
  dst[9] = zAxis[1];
  dst[10] = zAxis[2];
  dst[11] = 0;
  dst[12] = eye[0];
  dst[13] = eye[1];
  dst[14] = eye[2];
  dst[15] = 1;
  return dst;
}
/**
 * Computes a 4-by-4 view transformation.
 *
 * This is a view matrix which transforms all other objects
 * to be in the space of the view defined by the parameters.
 *
 * @param eye - The position of the object.
 * @param target - The position meant to be aimed at.
 * @param up - A vector pointing up.
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns The look-at matrix.
 */
function lookAt(eye, target, up, dst) {
  dst = dst || new MatType(16);
  xAxis = xAxis || create$4();
  yAxis = yAxis || create$4();
  zAxis = zAxis || create$4();
  normalize$2(subtract$2(eye, target, zAxis), zAxis);
  normalize$2(cross(up, zAxis, xAxis), xAxis);
  normalize$2(cross(zAxis, xAxis, yAxis), yAxis);
  dst[0] = xAxis[0];
  dst[1] = yAxis[0];
  dst[2] = zAxis[0];
  dst[3] = 0;
  dst[4] = xAxis[1];
  dst[5] = yAxis[1];
  dst[6] = zAxis[1];
  dst[7] = 0;
  dst[8] = xAxis[2];
  dst[9] = yAxis[2];
  dst[10] = zAxis[2];
  dst[11] = 0;
  dst[12] = -(xAxis[0] * eye[0] + xAxis[1] * eye[1] + xAxis[2] * eye[2]);
  dst[13] = -(yAxis[0] * eye[0] + yAxis[1] * eye[1] + yAxis[2] * eye[2]);
  dst[14] = -(zAxis[0] * eye[0] + zAxis[1] * eye[1] + zAxis[2] * eye[2]);
  dst[15] = 1;
  return dst;
}
/**
 * Creates a 4-by-4 matrix which translates by the given vector v.
 * @param v - The vector by
 *     which to translate.
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns The translation matrix.
 */
function translation(v, dst) {
  dst = dst || new MatType(16);
  dst[0] = 1;
  dst[1] = 0;
  dst[2] = 0;
  dst[3] = 0;
  dst[4] = 0;
  dst[5] = 1;
  dst[6] = 0;
  dst[7] = 0;
  dst[8] = 0;
  dst[9] = 0;
  dst[10] = 1;
  dst[11] = 0;
  dst[12] = v[0];
  dst[13] = v[1];
  dst[14] = v[2];
  dst[15] = 1;
  return dst;
}
/**
 * Translates the given 4-by-4 matrix by the given vector v.
 * @param m - The matrix.
 * @param v - The vector by
 *     which to translate.
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns The translated matrix.
 */
function translate(m, v, dst) {
  dst = dst || new MatType(16);
  const v0 = v[0];
  const v1 = v[1];
  const v2 = v[2];
  const m00 = m[0];
  const m01 = m[1];
  const m02 = m[2];
  const m03 = m[3];
  const m10 = m[1 * 4 + 0];
  const m11 = m[1 * 4 + 1];
  const m12 = m[1 * 4 + 2];
  const m13 = m[1 * 4 + 3];
  const m20 = m[2 * 4 + 0];
  const m21 = m[2 * 4 + 1];
  const m22 = m[2 * 4 + 2];
  const m23 = m[2 * 4 + 3];
  const m30 = m[3 * 4 + 0];
  const m31 = m[3 * 4 + 1];
  const m32 = m[3 * 4 + 2];
  const m33 = m[3 * 4 + 3];
  if (m !== dst) {
    dst[0] = m00;
    dst[1] = m01;
    dst[2] = m02;
    dst[3] = m03;
    dst[4] = m10;
    dst[5] = m11;
    dst[6] = m12;
    dst[7] = m13;
    dst[8] = m20;
    dst[9] = m21;
    dst[10] = m22;
    dst[11] = m23;
  }
  dst[12] = m00 * v0 + m10 * v1 + m20 * v2 + m30;
  dst[13] = m01 * v0 + m11 * v1 + m21 * v2 + m31;
  dst[14] = m02 * v0 + m12 * v1 + m22 * v2 + m32;
  dst[15] = m03 * v0 + m13 * v1 + m23 * v2 + m33;
  return dst;
}
/**
 * Creates a 4-by-4 matrix which rotates around the x-axis by the given angle.
 * @param angleInRadians - The angle by which to rotate (in radians).
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns The rotation matrix.
 */
function rotationX(angleInRadians, dst) {
  dst = dst || new MatType(16);
  const c = Math.cos(angleInRadians);
  const s = Math.sin(angleInRadians);
  dst[0] = 1;
  dst[1] = 0;
  dst[2] = 0;
  dst[3] = 0;
  dst[4] = 0;
  dst[5] = c;
  dst[6] = s;
  dst[7] = 0;
  dst[8] = 0;
  dst[9] = -s;
  dst[10] = c;
  dst[11] = 0;
  dst[12] = 0;
  dst[13] = 0;
  dst[14] = 0;
  dst[15] = 1;
  return dst;
}
/**
 * Rotates the given 4-by-4 matrix around the x-axis by the given
 * angle.
 * @param m - The matrix.
 * @param angleInRadians - The angle by which to rotate (in radians).
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns The rotated matrix.
 */
function rotateX$1(m, angleInRadians, dst) {
  dst = dst || new MatType(16);
  const m10 = m[4];
  const m11 = m[5];
  const m12 = m[6];
  const m13 = m[7];
  const m20 = m[8];
  const m21 = m[9];
  const m22 = m[10];
  const m23 = m[11];
  const c = Math.cos(angleInRadians);
  const s = Math.sin(angleInRadians);
  dst[4] = c * m10 + s * m20;
  dst[5] = c * m11 + s * m21;
  dst[6] = c * m12 + s * m22;
  dst[7] = c * m13 + s * m23;
  dst[8] = c * m20 - s * m10;
  dst[9] = c * m21 - s * m11;
  dst[10] = c * m22 - s * m12;
  dst[11] = c * m23 - s * m13;
  if (m !== dst) {
    dst[0] = m[0];
    dst[1] = m[1];
    dst[2] = m[2];
    dst[3] = m[3];
    dst[12] = m[12];
    dst[13] = m[13];
    dst[14] = m[14];
    dst[15] = m[15];
  }
  return dst;
}
/**
 * Creates a 4-by-4 matrix which rotates around the y-axis by the given angle.
 * @param angleInRadians - The angle by which to rotate (in radians).
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns The rotation matrix.
 */
function rotationY(angleInRadians, dst) {
  dst = dst || new MatType(16);
  const c = Math.cos(angleInRadians);
  const s = Math.sin(angleInRadians);
  dst[0] = c;
  dst[1] = 0;
  dst[2] = -s;
  dst[3] = 0;
  dst[4] = 0;
  dst[5] = 1;
  dst[6] = 0;
  dst[7] = 0;
  dst[8] = s;
  dst[9] = 0;
  dst[10] = c;
  dst[11] = 0;
  dst[12] = 0;
  dst[13] = 0;
  dst[14] = 0;
  dst[15] = 1;
  return dst;
}
/**
 * Rotates the given 4-by-4 matrix around the y-axis by the given
 * angle.
 * @param m - The matrix.
 * @param angleInRadians - The angle by which to rotate (in radians).
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns The rotated matrix.
 */
function rotateY$1(m, angleInRadians, dst) {
  dst = dst || new MatType(16);
  const m00 = m[0 * 4 + 0];
  const m01 = m[0 * 4 + 1];
  const m02 = m[0 * 4 + 2];
  const m03 = m[0 * 4 + 3];
  const m20 = m[2 * 4 + 0];
  const m21 = m[2 * 4 + 1];
  const m22 = m[2 * 4 + 2];
  const m23 = m[2 * 4 + 3];
  const c = Math.cos(angleInRadians);
  const s = Math.sin(angleInRadians);
  dst[0] = c * m00 - s * m20;
  dst[1] = c * m01 - s * m21;
  dst[2] = c * m02 - s * m22;
  dst[3] = c * m03 - s * m23;
  dst[8] = c * m20 + s * m00;
  dst[9] = c * m21 + s * m01;
  dst[10] = c * m22 + s * m02;
  dst[11] = c * m23 + s * m03;
  if (m !== dst) {
    dst[4] = m[4];
    dst[5] = m[5];
    dst[6] = m[6];
    dst[7] = m[7];
    dst[12] = m[12];
    dst[13] = m[13];
    dst[14] = m[14];
    dst[15] = m[15];
  }
  return dst;
}
/**
 * Creates a 4-by-4 matrix which rotates around the z-axis by the given angle.
 * @param angleInRadians - The angle by which to rotate (in radians).
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns The rotation matrix.
 */
function rotationZ(angleInRadians, dst) {
  dst = dst || new MatType(16);
  const c = Math.cos(angleInRadians);
  const s = Math.sin(angleInRadians);
  dst[0] = c;
  dst[1] = s;
  dst[2] = 0;
  dst[3] = 0;
  dst[4] = -s;
  dst[5] = c;
  dst[6] = 0;
  dst[7] = 0;
  dst[8] = 0;
  dst[9] = 0;
  dst[10] = 1;
  dst[11] = 0;
  dst[12] = 0;
  dst[13] = 0;
  dst[14] = 0;
  dst[15] = 1;
  return dst;
}
/**
 * Rotates the given 4-by-4 matrix around the z-axis by the given
 * angle.
 * @param m - The matrix.
 * @param angleInRadians - The angle by which to rotate (in radians).
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns The rotated matrix.
 */
function rotateZ$1(m, angleInRadians, dst) {
  dst = dst || new MatType(16);
  const m00 = m[0 * 4 + 0];
  const m01 = m[0 * 4 + 1];
  const m02 = m[0 * 4 + 2];
  const m03 = m[0 * 4 + 3];
  const m10 = m[1 * 4 + 0];
  const m11 = m[1 * 4 + 1];
  const m12 = m[1 * 4 + 2];
  const m13 = m[1 * 4 + 3];
  const c = Math.cos(angleInRadians);
  const s = Math.sin(angleInRadians);
  dst[0] = c * m00 + s * m10;
  dst[1] = c * m01 + s * m11;
  dst[2] = c * m02 + s * m12;
  dst[3] = c * m03 + s * m13;
  dst[4] = c * m10 - s * m00;
  dst[5] = c * m11 - s * m01;
  dst[6] = c * m12 - s * m02;
  dst[7] = c * m13 - s * m03;
  if (m !== dst) {
    dst[8] = m[8];
    dst[9] = m[9];
    dst[10] = m[10];
    dst[11] = m[11];
    dst[12] = m[12];
    dst[13] = m[13];
    dst[14] = m[14];
    dst[15] = m[15];
  }
  return dst;
}
/**
 * Creates a 4-by-4 matrix which rotates around the given axis by the given
 * angle.
 * @param axis - The axis
 *     about which to rotate.
 * @param angleInRadians - The angle by which to rotate (in radians).
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns A matrix which rotates angle radians
 *     around the axis.
 */
function axisRotation(axis, angleInRadians, dst) {
  dst = dst || new MatType(16);
  let x = axis[0];
  let y = axis[1];
  let z = axis[2];
  const n = Math.sqrt(x * x + y * y + z * z);
  x /= n;
  y /= n;
  z /= n;
  const xx = x * x;
  const yy = y * y;
  const zz = z * z;
  const c = Math.cos(angleInRadians);
  const s = Math.sin(angleInRadians);
  const oneMinusCosine = 1 - c;
  dst[0] = xx + (1 - xx) * c;
  dst[1] = x * y * oneMinusCosine + z * s;
  dst[2] = x * z * oneMinusCosine - y * s;
  dst[3] = 0;
  dst[4] = x * y * oneMinusCosine - z * s;
  dst[5] = yy + (1 - yy) * c;
  dst[6] = y * z * oneMinusCosine + x * s;
  dst[7] = 0;
  dst[8] = x * z * oneMinusCosine + y * s;
  dst[9] = y * z * oneMinusCosine - x * s;
  dst[10] = zz + (1 - zz) * c;
  dst[11] = 0;
  dst[12] = 0;
  dst[13] = 0;
  dst[14] = 0;
  dst[15] = 1;
  return dst;
}
/**
 * Creates a 4-by-4 matrix which rotates around the given axis by the given
 * angle. (same as axisRotation)
 * @param axis - The axis
 *     about which to rotate.
 * @param angleInRadians - The angle by which to rotate (in radians).
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns A matrix which rotates angle radians
 *     around the axis.
 */
const rotation = axisRotation;
/**
 * Rotates the given 4-by-4 matrix around the given axis by the
 * given angle.
 * @param m - The matrix.
 * @param axis - The axis
 *     about which to rotate.
 * @param angleInRadians - The angle by which to rotate (in radians).
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns The rotated matrix.
 */
function axisRotate(m, axis, angleInRadians, dst) {
  dst = dst || new MatType(16);
  let x = axis[0];
  let y = axis[1];
  let z = axis[2];
  const n = Math.sqrt(x * x + y * y + z * z);
  x /= n;
  y /= n;
  z /= n;
  const xx = x * x;
  const yy = y * y;
  const zz = z * z;
  const c = Math.cos(angleInRadians);
  const s = Math.sin(angleInRadians);
  const oneMinusCosine = 1 - c;
  const r00 = xx + (1 - xx) * c;
  const r01 = x * y * oneMinusCosine + z * s;
  const r02 = x * z * oneMinusCosine - y * s;
  const r10 = x * y * oneMinusCosine - z * s;
  const r11 = yy + (1 - yy) * c;
  const r12 = y * z * oneMinusCosine + x * s;
  const r20 = x * z * oneMinusCosine + y * s;
  const r21 = y * z * oneMinusCosine - x * s;
  const r22 = zz + (1 - zz) * c;
  const m00 = m[0];
  const m01 = m[1];
  const m02 = m[2];
  const m03 = m[3];
  const m10 = m[4];
  const m11 = m[5];
  const m12 = m[6];
  const m13 = m[7];
  const m20 = m[8];
  const m21 = m[9];
  const m22 = m[10];
  const m23 = m[11];
  dst[0] = r00 * m00 + r01 * m10 + r02 * m20;
  dst[1] = r00 * m01 + r01 * m11 + r02 * m21;
  dst[2] = r00 * m02 + r01 * m12 + r02 * m22;
  dst[3] = r00 * m03 + r01 * m13 + r02 * m23;
  dst[4] = r10 * m00 + r11 * m10 + r12 * m20;
  dst[5] = r10 * m01 + r11 * m11 + r12 * m21;
  dst[6] = r10 * m02 + r11 * m12 + r12 * m22;
  dst[7] = r10 * m03 + r11 * m13 + r12 * m23;
  dst[8] = r20 * m00 + r21 * m10 + r22 * m20;
  dst[9] = r20 * m01 + r21 * m11 + r22 * m21;
  dst[10] = r20 * m02 + r21 * m12 + r22 * m22;
  dst[11] = r20 * m03 + r21 * m13 + r22 * m23;
  if (m !== dst) {
    dst[12] = m[12];
    dst[13] = m[13];
    dst[14] = m[14];
    dst[15] = m[15];
  }
  return dst;
}
/**
 * Rotates the given 4-by-4 matrix around the given axis by the
 * given angle. (same as rotate)
 * @param m - The matrix.
 * @param axis - The axis
 *     about which to rotate.
 * @param angleInRadians - The angle by which to rotate (in radians).
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns The rotated matrix.
 */
const rotate = axisRotate;
/**
 * Creates a 4-by-4 matrix which scales in each dimension by an amount given by
 * the corresponding entry in the given vector; assumes the vector has three
 * entries.
 * @param v - A vector of
 *     three entries specifying the factor by which to scale in each dimension.
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns The scaling matrix.
 */
function scaling(v, dst) {
  dst = dst || new MatType(16);
  dst[0] = v[0];
  dst[1] = 0;
  dst[2] = 0;
  dst[3] = 0;
  dst[4] = 0;
  dst[5] = v[1];
  dst[6] = 0;
  dst[7] = 0;
  dst[8] = 0;
  dst[9] = 0;
  dst[10] = v[2];
  dst[11] = 0;
  dst[12] = 0;
  dst[13] = 0;
  dst[14] = 0;
  dst[15] = 1;
  return dst;
}
/**
 * Scales the given 4-by-4 matrix in each dimension by an amount
 * given by the corresponding entry in the given vector; assumes the vector has
 * three entries.
 * @param m - The matrix to be modified.
 * @param v - A vector of three entries specifying the
 *     factor by which to scale in each dimension.
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns The scaled matrix.
 */
function scale$2(m, v, dst) {
  dst = dst || new MatType(16);
  const v0 = v[0];
  const v1 = v[1];
  const v2 = v[2];
  dst[0] = v0 * m[0 * 4 + 0];
  dst[1] = v0 * m[0 * 4 + 1];
  dst[2] = v0 * m[0 * 4 + 2];
  dst[3] = v0 * m[0 * 4 + 3];
  dst[4] = v1 * m[1 * 4 + 0];
  dst[5] = v1 * m[1 * 4 + 1];
  dst[6] = v1 * m[1 * 4 + 2];
  dst[7] = v1 * m[1 * 4 + 3];
  dst[8] = v2 * m[2 * 4 + 0];
  dst[9] = v2 * m[2 * 4 + 1];
  dst[10] = v2 * m[2 * 4 + 2];
  dst[11] = v2 * m[2 * 4 + 3];
  if (m !== dst) {
    dst[12] = m[12];
    dst[13] = m[13];
    dst[14] = m[14];
    dst[15] = m[15];
  }
  return dst;
}
/**
 * Creates a 4-by-4 matrix which scales a uniform amount in each dimension.
 * @param s - the amount to scale
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns The scaling matrix.
 */
function uniformScaling(s, dst) {
  dst = dst || new MatType(16);
  dst[0] = s;
  dst[1] = 0;
  dst[2] = 0;
  dst[3] = 0;
  dst[4] = 0;
  dst[5] = s;
  dst[6] = 0;
  dst[7] = 0;
  dst[8] = 0;
  dst[9] = 0;
  dst[10] = s;
  dst[11] = 0;
  dst[12] = 0;
  dst[13] = 0;
  dst[14] = 0;
  dst[15] = 1;
  return dst;
}
/**
 * Scales the given 4-by-4 matrix in each dimension by a uniform scale.
 * @param m - The matrix to be modified.
 * @param s - The amount to scale.
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns The scaled matrix.
 */
function uniformScale(m, s, dst) {
  dst = dst || new MatType(16);
  dst[0] = s * m[0 * 4 + 0];
  dst[1] = s * m[0 * 4 + 1];
  dst[2] = s * m[0 * 4 + 2];
  dst[3] = s * m[0 * 4 + 3];
  dst[4] = s * m[1 * 4 + 0];
  dst[5] = s * m[1 * 4 + 1];
  dst[6] = s * m[1 * 4 + 2];
  dst[7] = s * m[1 * 4 + 3];
  dst[8] = s * m[2 * 4 + 0];
  dst[9] = s * m[2 * 4 + 1];
  dst[10] = s * m[2 * 4 + 2];
  dst[11] = s * m[2 * 4 + 3];
  if (m !== dst) {
    dst[12] = m[12];
    dst[13] = m[13];
    dst[14] = m[14];
    dst[15] = m[15];
  }
  return dst;
}
var mat4Impl = exports.mat4 = /*#__PURE__*/Object.freeze({
  __proto__: null,
  setDefaultType: setDefaultType$3,
  create: create$2,
  set: set$2,
  fromMat3: fromMat3,
  fromQuat: fromQuat,
  negate: negate$1,
  copy: copy$2,
  clone: clone$2,
  equalsApproximately: equalsApproximately$2,
  equals: equals$2,
  identity: identity$1,
  transpose: transpose,
  inverse: inverse$2,
  determinant: determinant,
  invert: invert$1,
  multiply: multiply$2,
  mul: mul$2,
  setTranslation: setTranslation,
  getTranslation: getTranslation,
  getAxis: getAxis,
  setAxis: setAxis,
  getScaling: getScaling,
  perspective: perspective,
  ortho: ortho,
  frustum: frustum,
  aim: aim,
  cameraAim: cameraAim,
  lookAt: lookAt,
  translation: translation,
  translate: translate,
  rotationX: rotationX,
  rotateX: rotateX$1,
  rotationY: rotationY,
  rotateY: rotateY$1,
  rotationZ: rotationZ,
  rotateZ: rotateZ$1,
  axisRotation: axisRotation,
  rotation: rotation,
  axisRotate: axisRotate,
  rotate: rotate,
  scaling: scaling,
  scale: scale$2,
  uniformScaling: uniformScaling,
  uniformScale: uniformScale
});

/*
 * Copyright 2022 Gregg Tavares
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.  IN NO EVENT SHALL
 * THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 */
/**
 *
 * Quat4 math functions.
 *
 * Almost all functions take an optional `dst` argument. If it is not passed in the
 * functions will create a new `Quat4`. In other words you can do this
 *
 *     const v = quat4.cross(v1, v2);  // Creates a new Quat4 with the cross product of v1 x v2.
 *
 * or
 *
 *     const v = quat4.create();
 *     quat4.cross(v1, v2, v);  // Puts the cross product of v1 x v2 in v
 *
 * The first style is often easier but depending on where it's used it generates garbage where
 * as there is almost never allocation with the second style.
 *
 * It is always safe to pass any vector as the destination. So for example
 *
 *     quat4.cross(v1, v2, v1);  // Puts the cross product of v1 x v2 in v1
 *
 */
let QuatType = Float32Array;
/**
 * Sets the type this library creates for a Quat4
 * @param ctor - the constructor for the type. Either `Float32Array`, `Float64Array`, or `Array`
 * @returns previous constructor for Quat4
 */
function setDefaultType$2(ctor) {
  const oldType = QuatType;
  QuatType = ctor;
  return oldType;
}
/**
 * Creates a quat4; may be called with x, y, z to set initial values.
 * @param x - Initial x value.
 * @param y - Initial y value.
 * @param z - Initial z value.
 * @param w - Initial w value.
 * @returns the created vector
 */
function create$1(x, y, z, w) {
  const dst = new QuatType(4);
  if (x !== undefined) {
    dst[0] = x;
    if (y !== undefined) {
      dst[1] = y;
      if (z !== undefined) {
        dst[2] = z;
        if (w !== undefined) {
          dst[3] = w;
        }
      }
    }
  }
  return dst;
}

/*
 * Copyright 2022 Gregg Tavares
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.  IN NO EVENT SHALL
 * THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 */
/**
 * Creates a Quat; may be called with x, y, z to set initial values. (same as create)
 * @param x - Initial x value.
 * @param y - Initial y value.
 * @param z - Initial z value.
 * @param z - Initial w value.
 * @returns the created vector
 */
const fromValues$1 = create$1;
/**
 * Sets the values of a Quat
 * Also see {@link quat.create} and {@link quat.copy}
 *
 * @param x first value
 * @param y second value
 * @param z third value
 * @param w fourth value
 * @param dst - vector to hold result. If not passed in a new one is created.
 * @returns A vector with its elements set.
 */
function set$1(x, y, z, w, dst) {
  dst = dst || new QuatType(4);
  dst[0] = x;
  dst[1] = y;
  dst[2] = z;
  dst[3] = w;
  return dst;
}
/**
 * Sets a quaternion from the given angle and  axis,
 * then returns it.
 *
 * @param axis - the axis to rotate around
 * @param angleInRadians - the angle
 * @param dst - quaternion to hold result. If not passed in a new one is created.
 * @returns The quaternion that represents the given axis and angle
 **/
function fromAxisAngle(axis, angleInRadians, dst) {
  dst = dst || new QuatType(4);
  const halfAngle = angleInRadians * 0.5;
  const s = Math.sin(halfAngle);
  dst[0] = s * axis[0];
  dst[1] = s * axis[1];
  dst[2] = s * axis[2];
  dst[3] = Math.cos(halfAngle);
  return dst;
}
/**
 * Gets the rotation axis and angle
 * @param q - quaternion to compute from
 * @param dst - Vec3 to hold result. If not passed in a new one is created.
 * @return angle and axis
 */
function toAxisAngle(q, dst) {
  dst = dst || create$4(4);
  const angle = Math.acos(q[3]) * 2;
  const s = Math.sin(angle * 0.5);
  if (s > EPSILON) {
    dst[0] = q[0] / s;
    dst[1] = q[1] / s;
    dst[2] = q[2] / s;
  } else {
    dst[0] = 1;
    dst[1] = 0;
    dst[2] = 0;
  }
  return {
    angle,
    axis: dst
  };
}
/**
 * Returns the angle in degrees between two rotations a and b.
 * @param a - quaternion a
 * @param b - quaternion b
 * @return angle in radians between the two quaternions
 */
function angle(a, b) {
  const d = dot$1(a, b);
  return Math.acos(2 * d * d - 1);
}
/**
 * Multiplies two quaternions
 *
 * @param a - the first quaternion
 * @param b - the second quaternion
 * @param dst - quaternion to hold result. If not passed in a new one is created.
 * @returns A quaternion that is the result of a * b
 */
function multiply$1(a, b, dst) {
  dst = dst || new QuatType(4);
  const ax = a[0];
  const ay = a[1];
  const az = a[2];
  const aw = a[3];
  const bx = b[0];
  const by = b[1];
  const bz = b[2];
  const bw = b[3];
  dst[0] = ax * bw + aw * bx + ay * bz - az * by;
  dst[1] = ay * bw + aw * by + az * bx - ax * bz;
  dst[2] = az * bw + aw * bz + ax * by - ay * bx;
  dst[3] = aw * bw - ax * bx - ay * by - az * bz;
  return dst;
}
/**
 * Multiplies two quaternions
 *
 * @param a - the first quaternion
 * @param b - the second quaternion
 * @param dst - quaternion to hold result. If not passed in a new one is created.
 * @returns A quaternion that is the result of a * b
 */
const mul$1 = multiply$1;
/**
 * Rotates the given quaternion around the X axis by the given angle.
 * @param q - quaternion to rotate
 * @param angleInRadians - The angle by which to rotate
 * @param dst - quaternion to hold result. If not passed in a new one is created.
 * @returns A quaternion that is the result of a * b
 */
function rotateX(q, angleInRadians, dst) {
  dst = dst || new QuatType(4);
  const halfAngle = angleInRadians * 0.5;
  const qx = q[0];
  const qy = q[1];
  const qz = q[2];
  const qw = q[3];
  const bx = Math.sin(halfAngle);
  const bw = Math.cos(halfAngle);
  dst[0] = qx * bw + qw * bx;
  dst[1] = qy * bw + qz * bx;
  dst[2] = qz * bw - qy * bx;
  dst[3] = qw * bw - qx * bx;
  return dst;
}
/**
 * Rotates the given quaternion around the Y axis by the given angle.
 * @param q - quaternion to rotate
 * @param angleInRadians - The angle by which to rotate
 * @param dst - quaternion to hold result. If not passed in a new one is created.
 * @returns A quaternion that is the result of a * b
 */
function rotateY(q, angleInRadians, dst) {
  dst = dst || new QuatType(4);
  const halfAngle = angleInRadians * 0.5;
  const qx = q[0];
  const qy = q[1];
  const qz = q[2];
  const qw = q[3];
  const by = Math.sin(halfAngle);
  const bw = Math.cos(halfAngle);
  dst[0] = qx * bw - qz * by;
  dst[1] = qy * bw + qw * by;
  dst[2] = qz * bw + qx * by;
  dst[3] = qw * bw - qy * by;
  return dst;
}
/**
 * Rotates the given quaternion around the Z axis by the given angle.
 * @param q - quaternion to rotate
 * @param angleInRadians - The angle by which to rotate
 * @param dst - quaternion to hold result. If not passed in a new one is created.
 * @returns A quaternion that is the result of a * b
 */
function rotateZ(q, angleInRadians, dst) {
  dst = dst || new QuatType(4);
  const halfAngle = angleInRadians * 0.5;
  const qx = q[0];
  const qy = q[1];
  const qz = q[2];
  const qw = q[3];
  const bz = Math.sin(halfAngle);
  const bw = Math.cos(halfAngle);
  dst[0] = qx * bw + qy * bz;
  dst[1] = qy * bw - qx * bz;
  dst[2] = qz * bw + qw * bz;
  dst[3] = qw * bw - qz * bz;
  return dst;
}
/**
 * Spherically linear interpolate between two quaternions
 *
 * @param a - starting value
 * @param b - ending value
 * @param t - value where 0 = a and 1 = b
 * @param dst - quaternion to hold result. If not passed in a new one is created.
 * @returns A quaternion that is the result of a * b
 */
function slerp(a, b, t, dst) {
  dst = dst || new QuatType(4);
  const ax = a[0];
  const ay = a[1];
  const az = a[2];
  const aw = a[3];
  let bx = b[0];
  let by = b[1];
  let bz = b[2];
  let bw = b[3];
  let cosOmega = ax * bx + ay * by + az * bz + aw * bw;
  if (cosOmega < 0) {
    cosOmega = -cosOmega;
    bx = -bx;
    by = -by;
    bz = -bz;
    bw = -bw;
  }
  let scale0;
  let scale1;
  if (1.0 - cosOmega > EPSILON) {
    const omega = Math.acos(cosOmega);
    const sinOmega = Math.sin(omega);
    scale0 = Math.sin((1 - t) * omega) / sinOmega;
    scale1 = Math.sin(t * omega) / sinOmega;
  } else {
    scale0 = 1.0 - t;
    scale1 = t;
  }
  dst[0] = scale0 * ax + scale1 * bx;
  dst[1] = scale0 * ay + scale1 * by;
  dst[2] = scale0 * az + scale1 * bz;
  dst[3] = scale0 * aw + scale1 * bw;
  return dst;
}
/**
 * Compute the inverse of a quaternion
 *
 * @param q - quaternion to compute the inverse of
 * @returns A quaternion that is the result of a * b
 */
function inverse$1(q, dst) {
  dst = dst || new QuatType(4);
  const a0 = q[0];
  const a1 = q[1];
  const a2 = q[2];
  const a3 = q[3];
  const dot = a0 * a0 + a1 * a1 + a2 * a2 + a3 * a3;
  const invDot = dot ? 1 / dot : 0;
  dst[0] = -a0 * invDot;
  dst[1] = -a1 * invDot;
  dst[2] = -a2 * invDot;
  dst[3] = a3 * invDot;
  return dst;
}
/**
 * Compute the conjugate of a quaternion
 * For quaternions with a magnitude of 1 (a unit quaternion)
 * this returns the same as the inverse but is faster to calculate.
 *
 * @param q - quaternion to compute the conjugate of.
 * @param dst - quaternion to hold result. If not passed in a new one is created.
 * @returns The conjugate of q
 */
function conjugate(q, dst) {
  dst = dst || new QuatType(4);
  dst[0] = -q[0];
  dst[1] = -q[1];
  dst[2] = -q[2];
  dst[3] = q[3];
  return dst;
}
/**
 * Creates a quaternion from the given rotation matrix.
 *
 * The created quaternion is not normalized.
 *
 * @param m - rotation matrix
 * @param dst - quaternion to hold result. If not passed in a new one is created.
 * @returns the result
 */
function fromMat(m, dst) {
  dst = dst || new QuatType(4);
  /*
  0 1 2
  3 4 5
  6 7 8
     0 1 2
  4 5 6
  8 9 10
   */
  // Algorithm in Ken Shoemake's article in 1987 SIGGRAPH course notes
  // article "Quaternion Calculus and Fast Animation".
  const trace = m[0] + m[5] + m[10];
  if (trace > 0.0) {
    // |w| > 1/2, may as well choose w > 1/2
    const root = Math.sqrt(trace + 1); // 2w
    dst[3] = 0.5 * root;
    const invRoot = 0.5 / root; // 1/(4w)
    dst[0] = (m[6] - m[9]) * invRoot;
    dst[1] = (m[8] - m[2]) * invRoot;
    dst[2] = (m[1] - m[4]) * invRoot;
  } else {
    // |w| <= 1/2
    let i = 0;
    if (m[5] > m[0]) {
      i = 1;
    }
    if (m[10] > m[i * 4 + i]) {
      i = 2;
    }
    const j = (i + 1) % 3;
    const k = (i + 2) % 3;
    const root = Math.sqrt(m[i * 4 + i] - m[j * 4 + j] - m[k * 4 + k] + 1.0);
    dst[i] = 0.5 * root;
    const invRoot = 0.5 / root;
    dst[3] = (m[j * 4 + k] - m[k * 4 + j]) * invRoot;
    dst[j] = (m[j * 4 + i] + m[i * 4 + j]) * invRoot;
    dst[k] = (m[k * 4 + i] + m[i * 4 + k]) * invRoot;
  }
  return dst;
}
/**
 * Creates a quaternion from the given euler angle x, y, z using the provided intrinsic order for the conversion.
 *
 * @param xAngleInRadians - angle to rotate around X axis in radians.
 * @param yAngleInRadians - angle to rotate around Y axis in radians.
 * @param zAngleInRadians - angle to rotate around Z axis in radians.
 * @param order - order to apply euler angles
 * @param dst - quaternion to hold result. If not passed in a new one is created.
 * @returns A quaternion representing the same rotation as the euler angles applied in the given order
 */
function fromEuler(xAngleInRadians, yAngleInRadians, zAngleInRadians, order, dst) {
  dst = dst || new QuatType(4);
  const xHalfAngle = xAngleInRadians * 0.5;
  const yHalfAngle = yAngleInRadians * 0.5;
  const zHalfAngle = zAngleInRadians * 0.5;
  const sx = Math.sin(xHalfAngle);
  const cx = Math.cos(xHalfAngle);
  const sy = Math.sin(yHalfAngle);
  const cy = Math.cos(yHalfAngle);
  const sz = Math.sin(zHalfAngle);
  const cz = Math.cos(zHalfAngle);
  switch (order) {
    case 'xyz':
      dst[0] = sx * cy * cz + cx * sy * sz;
      dst[1] = cx * sy * cz - sx * cy * sz;
      dst[2] = cx * cy * sz + sx * sy * cz;
      dst[3] = cx * cy * cz - sx * sy * sz;
      break;
    case 'xzy':
      dst[0] = sx * cy * cz - cx * sy * sz;
      dst[1] = cx * sy * cz - sx * cy * sz;
      dst[2] = cx * cy * sz + sx * sy * cz;
      dst[3] = cx * cy * cz + sx * sy * sz;
      break;
    case 'yxz':
      dst[0] = sx * cy * cz + cx * sy * sz;
      dst[1] = cx * sy * cz - sx * cy * sz;
      dst[2] = cx * cy * sz - sx * sy * cz;
      dst[3] = cx * cy * cz + sx * sy * sz;
      break;
    case 'yzx':
      dst[0] = sx * cy * cz + cx * sy * sz;
      dst[1] = cx * sy * cz + sx * cy * sz;
      dst[2] = cx * cy * sz - sx * sy * cz;
      dst[3] = cx * cy * cz - sx * sy * sz;
      break;
    case 'zxy':
      dst[0] = sx * cy * cz - cx * sy * sz;
      dst[1] = cx * sy * cz + sx * cy * sz;
      dst[2] = cx * cy * sz + sx * sy * cz;
      dst[3] = cx * cy * cz - sx * sy * sz;
      break;
    case 'zyx':
      dst[0] = sx * cy * cz - cx * sy * sz;
      dst[1] = cx * sy * cz + sx * cy * sz;
      dst[2] = cx * cy * sz - sx * sy * cz;
      dst[3] = cx * cy * cz + sx * sy * sz;
      break;
    default:
      throw new Error(`Unknown rotation order: ${order}`);
  }
  return dst;
}
/**
 * Copies a quaternion. (same as {@link quat.clone})
 * Also see {@link quat.create} and {@link quat.set}
 * @param q - The quaternion.
 * @param dst - quaternion to hold result. If not passed in a new one is created.
 * @returns A quaternion that is a copy of q
 */
function copy$1(q, dst) {
  dst = dst || new QuatType(4);
  dst[0] = q[0];
  dst[1] = q[1];
  dst[2] = q[2];
  dst[3] = q[3];
  return dst;
}
/**
 * Clones a quaternion. (same as {@link quat.copy})
 * Also see {@link quat.create} and {@link quat.set}
 * @param q - The quaternion.
 * @param dst - quaternion to hold result. If not passed in a new one is created.
 * @returns A copy of q.
 */
const clone$1 = copy$1;
/**
 * Adds two quaternions; assumes a and b have the same dimension.
 * @param a - Operand quaternion.
 * @param b - Operand quaternion.
 * @param dst - quaternion to hold result. If not passed in a new one is created.
 * @returns A quaternion that is the sum of a and b.
 */
function add$1(a, b, dst) {
  dst = dst || new QuatType(4);
  dst[0] = a[0] + b[0];
  dst[1] = a[1] + b[1];
  dst[2] = a[2] + b[2];
  dst[3] = a[3] + b[3];
  return dst;
}
/**
 * Subtracts two quaternions.
 * @param a - Operand quaternion.
 * @param b - Operand quaternion.
 * @param dst - quaternion to hold result. If not passed in a new one is created.
 * @returns A quaternion that is the difference of a and b.
 */
function subtract$1(a, b, dst) {
  dst = dst || new QuatType(4);
  dst[0] = a[0] - b[0];
  dst[1] = a[1] - b[1];
  dst[2] = a[2] - b[2];
  dst[3] = a[3] - b[3];
  return dst;
}
/**
 * Subtracts two quaternions.
 * @param a - Operand quaternion.
 * @param b - Operand quaternion.
 * @param dst - quaternion to hold result. If not passed in a new one is created.
 * @returns A quaternion that is the difference of a and b.
 */
const sub$1 = subtract$1;
/**
 * Multiplies a quaternion by a scalar.
 * @param v - The quaternion.
 * @param k - The scalar.
 * @param dst - quaternion to hold result. If not passed in a new one is created.
 * @returns The scaled quaternion.
 */
function mulScalar$1(v, k, dst) {
  dst = dst || new QuatType(4);
  dst[0] = v[0] * k;
  dst[1] = v[1] * k;
  dst[2] = v[2] * k;
  dst[3] = v[3] * k;
  return dst;
}
/**
 * Multiplies a quaternion by a scalar. (same as mulScalar)
 * @param v - The quaternion.
 * @param k - The scalar.
 * @param dst - quaternion to hold result. If not passed in a new one is created.
 * @returns The scaled quaternion.
 */
const scale$1 = mulScalar$1;
/**
 * Divides a vector by a scalar.
 * @param v - The vector.
 * @param k - The scalar.
 * @param dst - quaternion to hold result. If not passed in a new one is created.
 * @returns The scaled quaternion.
 */
function divScalar$1(v, k, dst) {
  dst = dst || new QuatType(4);
  dst[0] = v[0] / k;
  dst[1] = v[1] / k;
  dst[2] = v[2] / k;
  dst[3] = v[3] / k;
  return dst;
}
/**
 * Computes the dot product of two quaternions
 * @param a - Operand quaternion.
 * @param b - Operand quaternion.
 * @returns dot product
 */
function dot$1(a, b) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];
}
/**
 * Performs linear interpolation on two quaternions.
 * Given quaternions a and b and interpolation coefficient t, returns
 * a + t * (b - a).
 * @param a - Operand quaternion.
 * @param b - Operand quaternion.
 * @param t - Interpolation coefficient.
 * @param dst - quaternion to hold result. If not passed in a new one is created.
 * @returns The linear interpolated result.
 */
function lerp$1(a, b, t, dst) {
  dst = dst || new QuatType(4);
  dst[0] = a[0] + t * (b[0] - a[0]);
  dst[1] = a[1] + t * (b[1] - a[1]);
  dst[2] = a[2] + t * (b[2] - a[2]);
  dst[3] = a[3] + t * (b[3] - a[3]);
  return dst;
}
/**
 * Computes the length of quaternion
 * @param v - quaternion.
 * @returns length of quaternion.
 */
function length$1(v) {
  const v0 = v[0];
  const v1 = v[1];
  const v2 = v[2];
  const v3 = v[3];
  return Math.sqrt(v0 * v0 + v1 * v1 + v2 * v2 + v3 * v3);
}
/**
 * Computes the length of quaternion (same as length)
 * @param v - quaternion.
 * @returns length of quaternion.
 */
const len$1 = length$1;
/**
 * Computes the square of the length of quaternion
 * @param v - quaternion.
 * @returns square of the length of quaternion.
 */
function lengthSq$1(v) {
  const v0 = v[0];
  const v1 = v[1];
  const v2 = v[2];
  const v3 = v[3];
  return v0 * v0 + v1 * v1 + v2 * v2 + v3 * v3;
}
/**
 * Computes the square of the length of quaternion (same as lengthSq)
 * @param v - quaternion.
 * @returns square of the length of quaternion.
 */
const lenSq$1 = lengthSq$1;
/**
 * Divides a quaternion by its Euclidean length and returns the quotient.
 * @param v - The quaternion.
 * @param dst - quaternion to hold result. If not passed in a new one is created.
 * @returns The normalized quaternion.
 */
function normalize$1(v, dst) {
  dst = dst || new QuatType(4);
  const v0 = v[0];
  const v1 = v[1];
  const v2 = v[2];
  const v3 = v[3];
  const len = Math.sqrt(v0 * v0 + v1 * v1 + v2 * v2 + v3 * v3);
  if (len > 0.00001) {
    dst[0] = v0 / len;
    dst[1] = v1 / len;
    dst[2] = v2 / len;
    dst[3] = v3 / len;
  } else {
    dst[0] = 0;
    dst[1] = 0;
    dst[2] = 0;
    dst[3] = 0;
  }
  return dst;
}
/**
 * Check if 2 quaternions are approximately equal
 * @param a - Operand quaternion.
 * @param b - Operand quaternion.
 * @returns true if quaternions are approximately equal
 */
function equalsApproximately$1(a, b) {
  return Math.abs(a[0] - b[0]) < EPSILON && Math.abs(a[1] - b[1]) < EPSILON && Math.abs(a[2] - b[2]) < EPSILON && Math.abs(a[3] - b[3]) < EPSILON;
}
/**
 * Check if 2 quaternions are exactly equal
 * @param a - Operand quaternion.
 * @param b - Operand quaternion.
 * @returns true if quaternions are exactly equal
 */
function equals$1(a, b) {
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3];
}
/**
 * Creates an identity quaternion
 * @param dst - quaternion to hold result. If not passed in a new one is created.
 * @returns an identity quaternion
 */
function identity(dst) {
  dst = dst || new QuatType(4);
  dst[0] = 0;
  dst[1] = 0;
  dst[2] = 0;
  dst[3] = 1;
  return dst;
}
let tempVec3;
let xUnitVec3;
let yUnitVec3;
/**
 * Computes a quaternion to represent the shortest rotation from one vector to another.
 *
 * @param aUnit - the start vector
 * @param bUnit - the end vector
 * @param dst - quaternion to hold result. If not passed in a new one is created.
 * @returns the result
 */
function rotationTo(aUnit, bUnit, dst) {
  dst = dst || new QuatType(4);
  tempVec3 = tempVec3 || create$4();
  xUnitVec3 = xUnitVec3 || create$4(1, 0, 0);
  yUnitVec3 = yUnitVec3 || create$4(0, 1, 0);
  const dot = dot$2(aUnit, bUnit);
  if (dot < -0.999999) {
    cross(xUnitVec3, aUnit, tempVec3);
    if (len$2(tempVec3) < 0.000001) {
      cross(yUnitVec3, aUnit, tempVec3);
    }
    normalize$2(tempVec3, tempVec3);
    fromAxisAngle(tempVec3, Math.PI, dst);
    return dst;
  } else if (dot > 0.999999) {
    dst[0] = 0;
    dst[1] = 0;
    dst[2] = 0;
    dst[3] = 1;
    return dst;
  } else {
    cross(aUnit, bUnit, tempVec3);
    dst[0] = tempVec3[0];
    dst[1] = tempVec3[1];
    dst[2] = tempVec3[2];
    dst[3] = 1 + dot;
    return normalize$1(dst, dst);
  }
}
let tempQuat1;
let tempQuat2;
/**
 * Performs a spherical linear interpolation with two control points
 *
 * @param a - the first quaternion
 * @param b - the second quaternion
 * @param c - the third quaternion
 * @param d - the fourth quaternion
 * @param t - Interpolation coefficient 0 to 1
 * @returns result
 */
function sqlerp(a, b, c, d, t, dst) {
  dst = dst || new QuatType(4);
  tempQuat1 = tempQuat1 || new QuatType(4);
  tempQuat2 = tempQuat2 || new QuatType(4);
  slerp(a, d, t, tempQuat1);
  slerp(b, c, t, tempQuat2);
  slerp(tempQuat1, tempQuat2, 2 * t * (1 - t), dst);
  return dst;
}
var quatImpl = exports.quat = /*#__PURE__*/Object.freeze({
  __proto__: null,
  create: create$1,
  setDefaultType: setDefaultType$2,
  fromValues: fromValues$1,
  set: set$1,
  fromAxisAngle: fromAxisAngle,
  toAxisAngle: toAxisAngle,
  angle: angle,
  multiply: multiply$1,
  mul: mul$1,
  rotateX: rotateX,
  rotateY: rotateY,
  rotateZ: rotateZ,
  slerp: slerp,
  inverse: inverse$1,
  conjugate: conjugate,
  fromMat: fromMat,
  fromEuler: fromEuler,
  copy: copy$1,
  clone: clone$1,
  add: add$1,
  subtract: subtract$1,
  sub: sub$1,
  mulScalar: mulScalar$1,
  scale: scale$1,
  divScalar: divScalar$1,
  dot: dot$1,
  lerp: lerp$1,
  length: length$1,
  len: len$1,
  lengthSq: lengthSq$1,
  lenSq: lenSq$1,
  normalize: normalize$1,
  equalsApproximately: equalsApproximately$1,
  equals: equals$1,
  identity: identity,
  rotationTo: rotationTo,
  sqlerp: sqlerp
});

/*
 * Copyright 2022 Gregg Tavares
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.  IN NO EVENT SHALL
 * THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 */
/**
 *
 * Vec4 math functions.
 *
 * Almost all functions take an optional `dst` argument. If it is not passed in the
 * functions will create a new `Vec4`. In other words you can do this
 *
 *     const v = vec4.cross(v1, v2);  // Creates a new Vec4 with the cross product of v1 x v2.
 *
 * or
 *
 *     const v = vec4.create();
 *     vec4.cross(v1, v2, v);  // Puts the cross product of v1 x v2 in v
 *
 * The first style is often easier but depending on where it's used it generates garbage where
 * as there is almost never allocation with the second style.
 *
 * It is always safe to pass any vector as the destination. So for example
 *
 *     vec4.cross(v1, v2, v1);  // Puts the cross product of v1 x v2 in v1
 *
 */
let VecType = Float32Array;
/**
 * Sets the type this library creates for a Vec4
 * @param ctor - the constructor for the type. Either `Float32Array`, `Float64Array`, or `Array`
 * @returns previous constructor for Vec4
 */
function setDefaultType$1(ctor) {
  const oldType = VecType;
  VecType = ctor;
  return oldType;
}
/**
 * Creates a vec4; may be called with x, y, z to set initial values.
 * @param x - Initial x value.
 * @param y - Initial y value.
 * @param z - Initial z value.
 * @param w - Initial w value.
 * @returns the created vector
 */
function create(x, y, z, w) {
  const dst = new VecType(4);
  if (x !== undefined) {
    dst[0] = x;
    if (y !== undefined) {
      dst[1] = y;
      if (z !== undefined) {
        dst[2] = z;
        if (w !== undefined) {
          dst[3] = w;
        }
      }
    }
  }
  return dst;
}

/*
 * Copyright 2022 Gregg Tavares
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.  IN NO EVENT SHALL
 * THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 */
/**
 * Creates a vec4; may be called with x, y, z to set initial values. (same as create)
 * @param x - Initial x value.
 * @param y - Initial y value.
 * @param z - Initial z value.
 * @param z - Initial w value.
 * @returns the created vector
 */
const fromValues = create;
/**
 * Sets the values of a Vec4
 * Also see {@link vec4.create} and {@link vec4.copy}
 *
 * @param x first value
 * @param y second value
 * @param z third value
 * @param w fourth value
 * @param dst - vector to hold result. If not passed in a new one is created.
 * @returns A vector with its elements set.
 */
function set(x, y, z, w, dst) {
  dst = dst || new VecType(4);
  dst[0] = x;
  dst[1] = y;
  dst[2] = z;
  dst[3] = w;
  return dst;
}
/**
 * Applies Math.ceil to each element of vector
 * @param v - Operand vector.
 * @param dst - vector to hold result. If not passed in a new one is created.
 * @returns A vector that is the ceil of each element of v.
 */
function ceil(v, dst) {
  dst = dst || new VecType(4);
  dst[0] = Math.ceil(v[0]);
  dst[1] = Math.ceil(v[1]);
  dst[2] = Math.ceil(v[2]);
  dst[3] = Math.ceil(v[3]);
  return dst;
}
/**
 * Applies Math.floor to each element of vector
 * @param v - Operand vector.
 * @param dst - vector to hold result. If not passed in a new one is created.
 * @returns A vector that is the floor of each element of v.
 */
function floor(v, dst) {
  dst = dst || new VecType(4);
  dst[0] = Math.floor(v[0]);
  dst[1] = Math.floor(v[1]);
  dst[2] = Math.floor(v[2]);
  dst[3] = Math.floor(v[3]);
  return dst;
}
/**
 * Applies Math.round to each element of vector
 * @param v - Operand vector.
 * @param dst - vector to hold result. If not passed in a new one is created.
 * @returns A vector that is the round of each element of v.
 */
function round(v, dst) {
  dst = dst || new VecType(4);
  dst[0] = Math.round(v[0]);
  dst[1] = Math.round(v[1]);
  dst[2] = Math.round(v[2]);
  dst[3] = Math.round(v[3]);
  return dst;
}
/**
 * Clamp each element of vector between min and max
 * @param v - Operand vector.
 * @param max - Min value, default 0
 * @param min - Max value, default 1
 * @param dst - vector to hold result. If not passed in a new one is created.
 * @returns A vector that the clamped value of each element of v.
 */
function clamp(v, min = 0, max = 1, dst) {
  dst = dst || new VecType(4);
  dst[0] = Math.min(max, Math.max(min, v[0]));
  dst[1] = Math.min(max, Math.max(min, v[1]));
  dst[2] = Math.min(max, Math.max(min, v[2]));
  dst[3] = Math.min(max, Math.max(min, v[3]));
  return dst;
}
/**
 * Adds two vectors; assumes a and b have the same dimension.
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @param dst - vector to hold result. If not passed in a new one is created.
 * @returns A vector that is the sum of a and b.
 */
function add(a, b, dst) {
  dst = dst || new VecType(4);
  dst[0] = a[0] + b[0];
  dst[1] = a[1] + b[1];
  dst[2] = a[2] + b[2];
  dst[3] = a[3] + b[3];
  return dst;
}
/**
 * Adds two vectors, scaling the 2nd; assumes a and b have the same dimension.
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @param scale - Amount to scale b
 * @param dst - vector to hold result. If not passed in a new one is created.
 * @returns A vector that is the sum of a + b * scale.
 */
function addScaled(a, b, scale, dst) {
  dst = dst || new VecType(4);
  dst[0] = a[0] + b[0] * scale;
  dst[1] = a[1] + b[1] * scale;
  dst[2] = a[2] + b[2] * scale;
  dst[3] = a[3] + b[3] * scale;
  return dst;
}
/**
 * Subtracts two vectors.
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @param dst - vector to hold result. If not passed in a new one is created.
 * @returns A vector that is the difference of a and b.
 */
function subtract(a, b, dst) {
  dst = dst || new VecType(4);
  dst[0] = a[0] - b[0];
  dst[1] = a[1] - b[1];
  dst[2] = a[2] - b[2];
  dst[3] = a[3] - b[3];
  return dst;
}
/**
 * Subtracts two vectors.
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @param dst - vector to hold result. If not passed in a new one is created.
 * @returns A vector that is the difference of a and b.
 */
const sub = subtract;
/**
 * Check if 2 vectors are approximately equal
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @returns true if vectors are approximately equal
 */
function equalsApproximately(a, b) {
  return Math.abs(a[0] - b[0]) < EPSILON && Math.abs(a[1] - b[1]) < EPSILON && Math.abs(a[2] - b[2]) < EPSILON && Math.abs(a[3] - b[3]) < EPSILON;
}
/**
 * Check if 2 vectors are exactly equal
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @returns true if vectors are exactly equal
 */
function equals(a, b) {
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3];
}
/**
 * Performs linear interpolation on two vectors.
 * Given vectors a and b and interpolation coefficient t, returns
 * a + t * (b - a).
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @param t - Interpolation coefficient.
 * @param dst - vector to hold result. If not passed in a new one is created.
 * @returns The linear interpolated result.
 */
function lerp(a, b, t, dst) {
  dst = dst || new VecType(4);
  dst[0] = a[0] + t * (b[0] - a[0]);
  dst[1] = a[1] + t * (b[1] - a[1]);
  dst[2] = a[2] + t * (b[2] - a[2]);
  dst[3] = a[3] + t * (b[3] - a[3]);
  return dst;
}
/**
 * Performs linear interpolation on two vectors.
 * Given vectors a and b and interpolation coefficient vector t, returns
 * a + t * (b - a).
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @param t - Interpolation coefficients vector.
 * @param dst - vector to hold result. If not passed in a new one is created.
 * @returns the linear interpolated result.
 */
function lerpV(a, b, t, dst) {
  dst = dst || new VecType(4);
  dst[0] = a[0] + t[0] * (b[0] - a[0]);
  dst[1] = a[1] + t[1] * (b[1] - a[1]);
  dst[2] = a[2] + t[2] * (b[2] - a[2]);
  dst[3] = a[3] + t[3] * (b[3] - a[3]);
  return dst;
}
/**
 * Return max values of two vectors.
 * Given vectors a and b returns
 * [max(a[0], b[0]), max(a[1], b[1]), max(a[2], b[2])].
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @param dst - vector to hold result. If not passed in a new one is created.
 * @returns The max components vector.
 */
function max(a, b, dst) {
  dst = dst || new VecType(4);
  dst[0] = Math.max(a[0], b[0]);
  dst[1] = Math.max(a[1], b[1]);
  dst[2] = Math.max(a[2], b[2]);
  dst[3] = Math.max(a[3], b[3]);
  return dst;
}
/**
 * Return min values of two vectors.
 * Given vectors a and b returns
 * [min(a[0], b[0]), min(a[1], b[1]), min(a[2], b[2])].
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @param dst - vector to hold result. If not passed in a new one is created.
 * @returns The min components vector.
 */
function min(a, b, dst) {
  dst = dst || new VecType(4);
  dst[0] = Math.min(a[0], b[0]);
  dst[1] = Math.min(a[1], b[1]);
  dst[2] = Math.min(a[2], b[2]);
  dst[3] = Math.min(a[3], b[3]);
  return dst;
}
/**
 * Multiplies a vector by a scalar.
 * @param v - The vector.
 * @param k - The scalar.
 * @param dst - vector to hold result. If not passed in a new one is created.
 * @returns The scaled vector.
 */
function mulScalar(v, k, dst) {
  dst = dst || new VecType(4);
  dst[0] = v[0] * k;
  dst[1] = v[1] * k;
  dst[2] = v[2] * k;
  dst[3] = v[3] * k;
  return dst;
}
/**
 * Multiplies a vector by a scalar. (same as mulScalar)
 * @param v - The vector.
 * @param k - The scalar.
 * @param dst - vector to hold result. If not passed in a new one is created.
 * @returns The scaled vector.
 */
const scale = mulScalar;
/**
 * Divides a vector by a scalar.
 * @param v - The vector.
 * @param k - The scalar.
 * @param dst - vector to hold result. If not passed in a new one is created.
 * @returns The scaled vector.
 */
function divScalar(v, k, dst) {
  dst = dst || new VecType(4);
  dst[0] = v[0] / k;
  dst[1] = v[1] / k;
  dst[2] = v[2] / k;
  dst[3] = v[3] / k;
  return dst;
}
/**
 * Inverse a vector.
 * @param v - The vector.
 * @param dst - vector to hold result. If not passed in a new one is created.
 * @returns The inverted vector.
 */
function inverse(v, dst) {
  dst = dst || new VecType(4);
  dst[0] = 1 / v[0];
  dst[1] = 1 / v[1];
  dst[2] = 1 / v[2];
  dst[3] = 1 / v[3];
  return dst;
}
/**
 * Invert a vector. (same as inverse)
 * @param v - The vector.
 * @param dst - vector to hold result. If not passed in a new one is created.
 * @returns The inverted vector.
 */
const invert = inverse;
/**
 * Computes the dot product of two vectors
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @returns dot product
 */
function dot(a, b) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];
}
/**
 * Computes the length of vector
 * @param v - vector.
 * @returns length of vector.
 */
function length(v) {
  const v0 = v[0];
  const v1 = v[1];
  const v2 = v[2];
  const v3 = v[3];
  return Math.sqrt(v0 * v0 + v1 * v1 + v2 * v2 + v3 * v3);
}
/**
 * Computes the length of vector (same as length)
 * @param v - vector.
 * @returns length of vector.
 */
const len = length;
/**
 * Computes the square of the length of vector
 * @param v - vector.
 * @returns square of the length of vector.
 */
function lengthSq(v) {
  const v0 = v[0];
  const v1 = v[1];
  const v2 = v[2];
  const v3 = v[3];
  return v0 * v0 + v1 * v1 + v2 * v2 + v3 * v3;
}
/**
 * Computes the square of the length of vector (same as lengthSq)
 * @param v - vector.
 * @returns square of the length of vector.
 */
const lenSq = lengthSq;
/**
 * Computes the distance between 2 points
 * @param a - vector.
 * @param b - vector.
 * @returns distance between a and b
 */
function distance(a, b) {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  const dz = a[2] - b[2];
  const dw = a[3] - b[3];
  return Math.sqrt(dx * dx + dy * dy + dz * dz + dw * dw);
}
/**
 * Computes the distance between 2 points (same as distance)
 * @param a - vector.
 * @param b - vector.
 * @returns distance between a and b
 */
const dist = distance;
/**
 * Computes the square of the distance between 2 points
 * @param a - vector.
 * @param b - vector.
 * @returns square of the distance between a and b
 */
function distanceSq(a, b) {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  const dz = a[2] - b[2];
  const dw = a[3] - b[3];
  return dx * dx + dy * dy + dz * dz + dw * dw;
}
/**
 * Computes the square of the distance between 2 points (same as distanceSq)
 * @param a - vector.
 * @param b - vector.
 * @returns square of the distance between a and b
 */
const distSq = distanceSq;
/**
 * Divides a vector by its Euclidean length and returns the quotient.
 * @param v - The vector.
 * @param dst - vector to hold result. If not passed in a new one is created.
 * @returns The normalized vector.
 */
function normalize(v, dst) {
  dst = dst || new VecType(4);
  const v0 = v[0];
  const v1 = v[1];
  const v2 = v[2];
  const v3 = v[3];
  const len = Math.sqrt(v0 * v0 + v1 * v1 + v2 * v2 + v3 * v3);
  if (len > 0.00001) {
    dst[0] = v0 / len;
    dst[1] = v1 / len;
    dst[2] = v2 / len;
    dst[3] = v3 / len;
  } else {
    dst[0] = 0;
    dst[1] = 0;
    dst[2] = 0;
    dst[3] = 0;
  }
  return dst;
}
/**
 * Negates a vector.
 * @param v - The vector.
 * @param dst - vector to hold result. If not passed in a new one is created.
 * @returns -v.
 */
function negate(v, dst) {
  dst = dst || new VecType(4);
  dst[0] = -v[0];
  dst[1] = -v[1];
  dst[2] = -v[2];
  dst[3] = -v[3];
  return dst;
}
/**
 * Copies a vector. (same as {@link vec4.clone})
 * Also see {@link vec4.create} and {@link vec4.set}
 * @param v - The vector.
 * @param dst - vector to hold result. If not passed in a new one is created.
 * @returns A copy of v.
 */
function copy(v, dst) {
  dst = dst || new VecType(4);
  dst[0] = v[0];
  dst[1] = v[1];
  dst[2] = v[2];
  dst[3] = v[3];
  return dst;
}
/**
 * Clones a vector. (same as {@link vec4.copy})
 * Also see {@link vec4.create} and {@link vec4.set}
 * @param v - The vector.
 * @param dst - vector to hold result. If not passed in a new one is created.
 * @returns A copy of v.
 */
const clone = copy;
/**
 * Multiplies a vector by another vector (component-wise); assumes a and
 * b have the same length.
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @param dst - vector to hold result. If not passed in a new one is created.
 * @returns The vector of products of entries of a and b.
 */
function multiply(a, b, dst) {
  dst = dst || new VecType(4);
  dst[0] = a[0] * b[0];
  dst[1] = a[1] * b[1];
  dst[2] = a[2] * b[2];
  dst[3] = a[3] * b[3];
  return dst;
}
/**
 * Multiplies a vector by another vector (component-wise); assumes a and
 * b have the same length. (same as mul)
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @param dst - vector to hold result. If not passed in a new one is created.
 * @returns The vector of products of entries of a and b.
 */
const mul = multiply;
/**
 * Divides a vector by another vector (component-wise); assumes a and
 * b have the same length.
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @param dst - vector to hold result. If not passed in a new one is created.
 * @returns The vector of quotients of entries of a and b.
 */
function divide(a, b, dst) {
  dst = dst || new VecType(4);
  dst[0] = a[0] / b[0];
  dst[1] = a[1] / b[1];
  dst[2] = a[2] / b[2];
  dst[3] = a[3] / b[3];
  return dst;
}
/**
 * Divides a vector by another vector (component-wise); assumes a and
 * b have the same length. (same as divide)
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @param dst - vector to hold result. If not passed in a new one is created.
 * @returns The vector of quotients of entries of a and b.
 */
const div = divide;
/**
 * Zero's a vector
 * @param dst - vector to hold result. If not passed in a new one is created.
 * @returns The zeroed vector.
 */
function zero(dst) {
  dst = dst || new VecType(4);
  dst[0] = 0;
  dst[1] = 0;
  dst[2] = 0;
  dst[3] = 0;
  return dst;
}
/**
 * transform vec4 by 4x4 matrix
 * @param v - the vector
 * @param m - The matrix.
 * @param dst - optional vec4 to store result. If not passed a new one is created.
 * @returns the transformed vector
 */
function transformMat4(v, m, dst) {
  dst = dst || new VecType(4);
  const x = v[0];
  const y = v[1];
  const z = v[2];
  const w = v[3];
  dst[0] = m[0] * x + m[4] * y + m[8] * z + m[12] * w;
  dst[1] = m[1] * x + m[5] * y + m[9] * z + m[13] * w;
  dst[2] = m[2] * x + m[6] * y + m[10] * z + m[14] * w;
  dst[3] = m[3] * x + m[7] * y + m[11] * z + m[15] * w;
  return dst;
}
var vec4Impl = exports.vec4 = /*#__PURE__*/Object.freeze({
  __proto__: null,
  create: create,
  setDefaultType: setDefaultType$1,
  fromValues: fromValues,
  set: set,
  ceil: ceil,
  floor: floor,
  round: round,
  clamp: clamp,
  add: add,
  addScaled: addScaled,
  subtract: subtract,
  sub: sub,
  equalsApproximately: equalsApproximately,
  equals: equals,
  lerp: lerp,
  lerpV: lerpV,
  max: max,
  min: min,
  mulScalar: mulScalar,
  scale: scale,
  divScalar: divScalar,
  inverse: inverse,
  invert: invert,
  dot: dot,
  length: length,
  len: len,
  lengthSq: lengthSq,
  lenSq: lenSq,
  distance: distance,
  dist: dist,
  distanceSq: distanceSq,
  distSq: distSq,
  normalize: normalize,
  negate: negate,
  copy: copy,
  clone: clone,
  multiply: multiply,
  mul: mul,
  divide: divide,
  div: div,
  zero: zero,
  transformMat4: transformMat4
});

/**
 * Sets the type this library creates for all types
 *
 * example:
 *
 * ```
 * setDefaultType(Float64Array);
 * ```
 *
 * @param ctor - the constructor for the type. Either `Float32Array`, `Float64Array`, or `Array`
 */
function setDefaultType(ctor) {
  setDefaultType$4(ctor);
  setDefaultType$3(ctor);
  setDefaultType$2(ctor);
  setDefaultType$6(ctor);
  setDefaultType$5(ctor);
  setDefaultType$1(ctor);
}

},{}],17:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _shaders = require("../shaders/shaders");
var _wgpuMatrix = require("wgpu-matrix");
var _matrixClass = require("./matrix-class");
var _engine = require("./engine");
class MEBall {
  constructor(canvas, device, context, o) {
    this.context = context;
    this.device = device;

    // The input handler
    this.inputHandler = (0, _engine.createInputHandler)(window, canvas);
    this.cameras = o.cameras;
    this.scale = o.scale;
    console.log('passed : o.mainCameraParams.responseCoef ', o.mainCameraParams.responseCoef);
    this.mainCameraParams = {
      type: o.mainCameraParams.type,
      responseCoef: o.mainCameraParams.responseCoef
    }; // |  WASD 'arcball' };

    this.lastFrameMS = 0;
    this.entityArgPass = o.entityArgPass;
    this.SphereLayout = {
      vertexStride: 8 * 4,
      positionsOffset: 0,
      normalOffset: 3 * 4,
      uvOffset: 6 * 4
    };
    if (typeof o.raycast === 'undefined') {
      this.raycast = {
        enabled: false,
        radius: 2
      };
    } else {
      this.raycast = o.raycast;
    }
    this.texturesPaths = [];
    o.texturesPaths.forEach(t => {
      this.texturesPaths.push(t);
    });
    this.position = new _matrixClass.Position(o.position.x, o.position.y, o.position.z);
    this.rotation = new _matrixClass.Rotation(o.rotation.x, o.rotation.y, o.rotation.z);
    this.rotation.rotationSpeed.x = o.rotationSpeed.x;
    this.rotation.rotationSpeed.y = o.rotationSpeed.y;
    this.rotation.rotationSpeed.z = o.rotationSpeed.z;
    this.shaderModule = device.createShaderModule({
      code: _shaders.UNLIT_SHADER
    });
    this.presentationFormat = navigator.gpu.getPreferredCanvasFormat();
    this.pipeline = device.createRenderPipeline({
      layout: 'auto',
      vertex: {
        module: this.shaderModule,
        entryPoint: 'vertexMain',
        buffers: [{
          arrayStride: this.SphereLayout.vertexStride,
          attributes: [{
            // position
            shaderLocation: 0,
            offset: this.SphereLayout.positionsOffset,
            format: 'float32x3'
          }, {
            // normal
            shaderLocation: 1,
            offset: this.SphereLayout.normalOffset,
            format: 'float32x3'
          }, {
            // uv
            shaderLocation: 2,
            offset: this.SphereLayout.uvOffset,
            format: 'float32x2'
          }]
        }]
      },
      fragment: {
        module: this.shaderModule,
        entryPoint: 'fragmentMain',
        targets: [{
          format: this.presentationFormat
        }]
      },
      primitive: {
        topology: 'triangle-list',
        // Backface culling since the sphere is solid piece of geometry.
        // Faces pointing away from the camera will be occluded by faces
        // pointing toward the camera.
        cullMode: 'back'
      },
      // Enable depth testing so that the fragment closest to the camera
      // is rendered in front.
      depthStencil: {
        depthWriteEnabled: true,
        depthCompare: 'less',
        format: 'depth24plus'
      }
    });
    this.depthTexture = device.createTexture({
      size: [canvas.width, canvas.height],
      format: 'depth24plus',
      usage: GPUTextureUsage.RENDER_ATTACHMENT
    });
    this.uniformBufferSize = 4 * 16; // 4x4 matrix
    this.uniformBuffer = device.createBuffer({
      size: this.uniformBufferSize,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });

    // Fetch the images and upload them into a GPUTexture.
    this.texture0 = null;
    this.moonTexture = null;
    this.settings = {
      useRenderBundles: true,
      asteroidCount: 15
    };
    this.loadTex0(this.texturesPaths, device).then(() => {
      this.loadTex1(this.texturesPaths, device).then(() => {
        this.sampler = device.createSampler({
          magFilter: 'linear',
          minFilter: 'linear'
        });
        this.transform = _wgpuMatrix.mat4.create();
        _wgpuMatrix.mat4.identity(this.transform);

        // Create one large central planet surrounded by a large ring of asteroids
        this.planet = this.createGeometry(this.scale);
        this.planet.bindGroup = this.createSphereBindGroup(this.texture0, this.transform);
        var asteroids = [this.createGeometry(12, 8, 6, 0.15)];
        this.renderables = [this.planet];

        // this.ensureEnoughAsteroids(asteroids, this.transform);
        this.renderPassDescriptor = {
          colorAttachments: [{
            view: undefined,
            clearValue: {
              r: 0.0,
              g: 0.0,
              b: 0.0,
              a: 1.0
            },
            loadOp: this.entityArgPass.loadOp,
            storeOp: this.entityArgPass.storeOp
          }],
          depthStencilAttachment: {
            view: this.depthTexture.createView(),
            depthClearValue: 1.0,
            depthLoadOp: this.entityArgPass.depthLoadOp,
            depthStoreOp: this.entityArgPass.depthStoreOp
          }
        };
        const aspect = canvas.width / canvas.height;
        this.projectionMatrix = _wgpuMatrix.mat4.perspective(2 * Math.PI / 5, aspect, 1, 100.0);
        this.modelViewProjectionMatrix = _wgpuMatrix.mat4.create();
        this.frameBindGroup = device.createBindGroup({
          layout: this.pipeline.getBindGroupLayout(0),
          entries: [{
            binding: 0,
            resource: {
              buffer: this.uniformBuffer
            }
          }]
        });

        // The render bundle can be encoded once and re-used as many times as needed.
        // Because it encodes all of the commands needed to render at the GPU level,
        // those commands will not need to execute the associated JavaScript code upon
        // execution or be re-validated, which can represent a significant time savings.
        //
        // However, because render bundles are immutable once created, they are only
        // appropriate for rendering content where the same commands will be executed
        // every time, with the only changes being the contents of the buffers and
        // textures used. Cases where the executed commands differ from frame-to-frame,
        // such as when using frustrum or occlusion culling, will not benefit from
        // using render bundles as much.
        this.renderBundle;
        this.updateRenderBundle();
      });
    });
  }
  ensureEnoughAsteroids(asteroids, transform) {
    for (let i = this.renderables.length; i <= this.settings.asteroidCount; ++i) {
      // Place copies of the asteroid in a ring.
      const radius = Math.random() * 1.7 + 1.25;
      const angle = Math.random() * Math.PI * 2;
      const x = Math.sin(angle) * radius;
      const y = (Math.random() - 0.5) * 0.015;
      const z = Math.cos(angle) * radius;
      _wgpuMatrix.mat4.identity(transform);
      _wgpuMatrix.mat4.translate(transform, [x, y, z], transform);
      _wgpuMatrix.mat4.rotateX(transform, Math.random() * Math.PI, transform);
      _wgpuMatrix.mat4.rotateY(transform, Math.random() * Math.PI, transform);
      this.renderables.push({
        ...asteroids[i % asteroids.length],
        bindGroup: this.createSphereBindGroup(this.moonTexture, transform)
      });
    }
  }
  updateRenderBundle() {
    console.log('updateRenderBundle');
    const renderBundleEncoder = this.device.createRenderBundleEncoder({
      colorFormats: [this.presentationFormat],
      depthStencilFormat: 'depth24plus'
    });
    this.renderScene(renderBundleEncoder);
    this.renderBundle = renderBundleEncoder.finish();
  }
  createGeometry(radius, widthSegments = 8, heightSegments = 4, randomness = 0) {
    const sphereMesh = this.createSphereMesh(radius, widthSegments, heightSegments, randomness);
    // Create a vertex buffer from the sphere data.
    const vertices = this.device.createBuffer({
      size: sphereMesh.vertices.byteLength,
      usage: GPUBufferUsage.VERTEX,
      mappedAtCreation: true
    });
    new Float32Array(vertices.getMappedRange()).set(sphereMesh.vertices);
    vertices.unmap();
    const indices = this.device.createBuffer({
      size: sphereMesh.indices.byteLength,
      usage: GPUBufferUsage.INDEX,
      mappedAtCreation: true
    });
    new Uint16Array(indices.getMappedRange()).set(sphereMesh.indices);
    indices.unmap();
    return {
      vertices,
      indices,
      indexCount: sphereMesh.indices.length
    };
  }
  createSphereBindGroup(texture, transform) {
    const uniformBufferSize = 4 * 16; // 4x4 matrix
    const uniformBuffer = this.device.createBuffer({
      size: uniformBufferSize,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
      mappedAtCreation: true
    });
    new Float32Array(uniformBuffer.getMappedRange()).set(transform);
    uniformBuffer.unmap();
    const bindGroup = this.device.createBindGroup({
      layout: this.pipeline.getBindGroupLayout(1),
      entries: [{
        binding: 0,
        resource: {
          buffer: uniformBuffer
        }
      }, {
        binding: 1,
        resource: this.sampler
      }, {
        binding: 2,
        resource: texture.createView()
      }]
    });
    return bindGroup;
  }
  getTransformationMatrix(pos) {
    // const viewMatrix = mat4.identity();
    const now = Date.now();
    const deltaTime = (now - this.lastFrameMS) / this.mainCameraParams.responseCoef;
    this.lastFrameMS = now;

    // const viewMatrix = mat4.identity(); ORI
    const camera = this.cameras[this.mainCameraParams.type];
    const viewMatrix = camera.update(deltaTime, this.inputHandler());
    _wgpuMatrix.mat4.translate(viewMatrix, _wgpuMatrix.vec3.fromValues(pos.x, pos.y, pos.z), viewMatrix);
    _wgpuMatrix.mat4.rotateX(viewMatrix, Math.PI * this.rotation.getRotX(), viewMatrix);
    _wgpuMatrix.mat4.rotateY(viewMatrix, Math.PI * this.rotation.getRotY(), viewMatrix);
    _wgpuMatrix.mat4.rotateZ(viewMatrix, Math.PI * this.rotation.getRotZ(), viewMatrix);
    _wgpuMatrix.mat4.multiply(this.projectionMatrix, viewMatrix, this.modelViewProjectionMatrix);
    return this.modelViewProjectionMatrix;
  }
  async loadTex1(texPaths, device) {
    return new Promise(async resolve => {
      const response = await fetch(texPaths[0]);
      const imageBitmap = await createImageBitmap(await response.blob());
      this.moonTexture = device.createTexture({
        size: [imageBitmap.width, imageBitmap.height, 1],
        format: 'rgba8unorm',
        usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT
      });
      var moonTexture = this.moonTexture;
      device.queue.copyExternalImageToTexture({
        source: imageBitmap
      }, {
        texture: moonTexture
      }, [imageBitmap.width, imageBitmap.height]);
      resolve();
    });
  }
  async loadTex0(paths, device) {
    return new Promise(async resolve => {
      const response = await fetch(paths[0]);
      const imageBitmap = await createImageBitmap(await response.blob());
      console.log('loadTex0 WHAT IS THIS -> ', this);
      this.texture0 = device.createTexture({
        size: [imageBitmap.width, imageBitmap.height, 1],
        format: 'rgba8unorm',
        usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT
      });
      var texture0 = this.texture0;
      device.queue.copyExternalImageToTexture({
        source: imageBitmap
      }, {
        texture: texture0
      }, [imageBitmap.width, imageBitmap.height]);
      resolve();
    });
  }
  createSphereMesh(radius, widthSegments = 3, heightSegments = 3, randomness = 0) {
    const vertices = [];
    const indices = [];
    widthSegments = Math.max(3, Math.floor(widthSegments));
    heightSegments = Math.max(2, Math.floor(heightSegments));
    const firstVertex = _wgpuMatrix.vec3.create();
    const vertex = _wgpuMatrix.vec3.create();
    const normal = _wgpuMatrix.vec3.create();
    let index = 0;
    const grid = [];

    // generate vertices, normals and uvs
    for (let iy = 0; iy <= heightSegments; iy++) {
      const verticesRow = [];
      const v = iy / heightSegments;
      // special case for the poles
      let uOffset = 0;
      if (iy === 0) {
        uOffset = 0.5 / widthSegments;
      } else if (iy === heightSegments) {
        uOffset = -0.5 / widthSegments;
      }
      for (let ix = 0; ix <= widthSegments; ix++) {
        const u = ix / widthSegments;
        // Poles should just use the same position all the way around.
        if (ix == widthSegments) {
          _wgpuMatrix.vec3.copy(firstVertex, vertex);
        } else if (ix == 0 || iy != 0 && iy !== heightSegments) {
          const rr = radius + (Math.random() - 0.5) * 2 * randomness * radius;
          // vertex
          vertex[0] = -rr * Math.cos(u * Math.PI * 2) * Math.sin(v * Math.PI);
          vertex[1] = rr * Math.cos(v * Math.PI);
          vertex[2] = rr * Math.sin(u * Math.PI * 2) * Math.sin(v * Math.PI);
          if (ix == 0) {
            _wgpuMatrix.vec3.copy(vertex, firstVertex);
          }
        }
        vertices.push(...vertex);

        // normal
        _wgpuMatrix.vec3.copy(vertex, normal);
        _wgpuMatrix.vec3.normalize(normal, normal);
        vertices.push(...normal);
        // uv
        vertices.push(u + uOffset, 1 - v);
        verticesRow.push(index++);
      }
      grid.push(verticesRow);
    }
    // indices
    for (let iy = 0; iy < heightSegments; iy++) {
      for (let ix = 0; ix < widthSegments; ix++) {
        const a = grid[iy][ix + 1];
        const b = grid[iy][ix];
        const c = grid[iy + 1][ix];
        const d = grid[iy + 1][ix + 1];
        if (iy !== 0) indices.push(a, b, d);
        if (iy !== heightSegments - 1) indices.push(b, c, d);
      }
    }
    return {
      vertices: new Float32Array(vertices),
      indices: new Uint16Array(indices)
    };
  }

  // Render bundles function as partial, limited render passes, so we can use the
  // same code both to render the scene normally and to build the render bundle.
  renderScene(passEncoder) {
    if (typeof this.renderables === 'undefined') return;
    passEncoder.setPipeline(this.pipeline);
    passEncoder.setBindGroup(0, this.frameBindGroup);
    // Loop through every renderable object and draw them individually.
    // (Because many of these meshes are repeated, with only the transforms
    // differing, instancing would be highly effective here. This sample
    // intentionally avoids using instancing in order to emulate a more complex
    // scene, which helps demonstrate the potential time savings a render bundle
    // can provide.)
    let count = 0;
    for (const renderable of this.renderables) {
      passEncoder.setBindGroup(1, renderable.bindGroup);
      passEncoder.setVertexBuffer(0, renderable.vertices);
      passEncoder.setIndexBuffer(renderable.indices, 'uint16');
      passEncoder.drawIndexed(renderable.indexCount);
      if (++count > this.settings.asteroidCount) {
        break;
      }
    }
  }
  draw = () => {
    if (this.moonTexture == null) {
      // console.log('not ready')
      return;
    }
    const transformationMatrix = this.getTransformationMatrix(this.position);
    this.device.queue.writeBuffer(this.uniformBuffer, 0, transformationMatrix.buffer, transformationMatrix.byteOffset, transformationMatrix.byteLength);
    this.renderPassDescriptor.colorAttachments[0].view = this.context.getCurrentTexture().createView();
  };
}
exports.default = MEBall;

},{"../shaders/shaders":33,"./engine":20,"./matrix-class":26,"wgpu-matrix":16}],18:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _utils = require("./utils");
/**
 * @description
 * Can be reuse for any other tasks.
 * @author Nikola Lukic
 */

class Behavior {
  status = "Only oscillator";
  constructor() {
    this.osc0 = new _utils.OSCILLATOR(0, 5, 0.01);
  }
  setOsc0(min, max, step) {
    this.osc0.min = min;
    this.osc0.max = max;
    this.osc0.step = step;
  }

  // apend - keep init origin
  addPath(NUMBER) {
    let inc = this.osc0.UPDATE();
    console.log('test inc', inc);
    console.log('test inc + number', NUMBER + inc);
    return inc + NUMBER;
  }
  setPath0() {
    return this.osc0.UPDATE();
  }
}
exports.default = Behavior;

},{"./utils":28}],19:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _shaders = require("../shaders/shaders");
var _wgpuMatrix = require("wgpu-matrix");
var _matrixClass = require("./matrix-class");
var _engine = require("./engine");
var SphereLayout = {
  vertexStride: 8 * 4,
  positionsOffset: 0,
  normalOffset: 3 * 4,
  uvOffset: 6 * 4
};
class MECube {
  constructor(canvas, device, context, o) {
    this.device = device;
    this.context = context;
    this.entityArgPass = o.entityArgPass;
    this.inputHandler = (0, _engine.createInputHandler)(window, canvas);
    this.cameras = o.cameras;
    console.log('passed : o.mainCameraParams.responseCoef ', o.mainCameraParams.responseCoef);
    this.mainCameraParams = {
      type: o.mainCameraParams.type,
      responseCoef: o.mainCameraParams.responseCoef
    }; // |  WASD 'arcball' };

    this.lastFrameMS = 0;
    this.shaderModule = device.createShaderModule({
      code: _shaders.UNLIT_SHADER
    });
    this.texturesPaths = [];
    if (typeof o.raycast === 'undefined') {
      this.raycast = {
        enabled: false,
        radius: 2
      };
    } else {
      this.raycast = o.raycast;
    }

    // useUVShema4x2 pass this from top !

    o.texturesPaths.forEach(t => {
      this.texturesPaths.push(t);
    });
    this.presentationFormat = navigator.gpu.getPreferredCanvasFormat();
    this.position = new _matrixClass.Position(o.position.x, o.position.y, o.position.z);
    console.log('cube added on pos : ', this.position);
    this.rotation = new _matrixClass.Rotation(o.rotation.x, o.rotation.y, o.rotation.z);
    this.rotation.rotationSpeed.x = o.rotationSpeed.x;
    this.rotation.rotationSpeed.y = o.rotationSpeed.y;
    this.rotation.rotationSpeed.z = o.rotationSpeed.z;
    this.scale = o.scale;
    this.pipeline = device.createRenderPipeline({
      layout: 'auto',
      vertex: {
        module: this.shaderModule,
        entryPoint: 'vertexMain',
        buffers: [{
          arrayStride: SphereLayout.vertexStride,
          attributes: [
          // position
          {
            shaderLocation: 0,
            offset: SphereLayout.positionsOffset,
            format: 'float32x3'
          },
          // normal
          {
            shaderLocation: 1,
            offset: SphereLayout.normalOffset,
            format: 'float32x3'
          },
          // uv
          {
            shaderLocation: 2,
            offset: SphereLayout.uvOffset,
            format: 'float32x2'
          }]
        }]
      },
      fragment: {
        module: this.shaderModule,
        entryPoint: 'fragmentMain',
        targets: [{
          format: this.presentationFormat
        }]
      },
      primitive: {
        topology: 'triangle-list',
        // Backface culling since the sphere is solid piece of geometry.
        // Faces pointing away from the camera will be occluded by faces
        // pointing toward the camera.
        cullMode: 'back'
      },
      // Enable depth testing so that the fragment closest to the camera
      // is rendered in front.
      depthStencil: {
        depthWriteEnabled: true,
        depthCompare: 'less',
        format: 'depth24plus'
      }
    });
    this.depthTexture = device.createTexture({
      size: [canvas.width, canvas.height],
      format: 'depth24plus',
      usage: GPUTextureUsage.RENDER_ATTACHMENT
    });
    this.uniformBufferSize = 4 * 16; // 4x4 matrix
    this.uniformBuffer = device.createBuffer({
      size: this.uniformBufferSize,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });

    // Fetch the images and upload them into a GPUTexture.
    this.texture0 = null;
    this.moonTexture = null;
    this.settings = {
      useRenderBundles: true,
      asteroidCount: 15
    };
    this.loadTex0(this.texturesPaths, device).then(() => {
      this.loadTex1(this.texturesPaths, device).then(() => {
        this.sampler = device.createSampler({
          magFilter: 'linear',
          minFilter: 'linear'
        });
        this.transform = _wgpuMatrix.mat4.create();
        _wgpuMatrix.mat4.identity(this.transform);
        this.planet = this.createGeometry({
          scale: this.scale,
          useUVShema4x2: false
        });
        this.planet.bindGroup = this.createSphereBindGroup(this.texture0, this.transform);

        // can be used like instance draws
        var asteroids = [
          // this.createGeometry(0.2, 8, 6, 0.15),
        ];
        this.renderables = [this.planet];
        // this.ensureEnoughAsteroids(asteroids, this.transform);
        this.renderPassDescriptor = {
          colorAttachments: [{
            view: undefined,
            clearValue: {
              r: 0.0,
              g: 0.0,
              b: 0.0,
              a: 1.0
            },
            loadOp: this.entityArgPass.loadOp,
            storeOp: this.entityArgPass.storeOp
          }],
          depthStencilAttachment: {
            view: this.depthTexture.createView(),
            depthClearValue: 1.0,
            depthLoadOp: this.entityArgPass.depthLoadOp,
            depthStoreOp: this.entityArgPass.depthStoreOp
          }
        };
        const aspect = canvas.width / canvas.height;
        this.projectionMatrix = _wgpuMatrix.mat4.perspective(2 * Math.PI / 5, aspect, 1, 1000.0);
        this.modelViewProjectionMatrix = _wgpuMatrix.mat4.create();
        this.frameBindGroup = device.createBindGroup({
          layout: this.pipeline.getBindGroupLayout(0),
          entries: [{
            binding: 0,
            resource: {
              buffer: this.uniformBuffer
            }
          }]
        });

        // The render bundle can be encoded once and re-used as many times as needed.
        // Because it encodes all of the commands needed to render at the GPU level,
        // those commands will not need to execute the associated JavaScript code upon
        // execution or be re-validated, which can represent a significant time savings.
        //
        // However, because render bundles are immutable once created, they are only
        // appropriate for rendering content where the same commands will be executed
        // every time, with the only changes being the contents of the buffers and
        // textures used. Cases where the executed commands differ from frame-to-frame,
        // such as when using frustrum or occlusion culling, will not benefit from
        // using render bundles as much.
        this.renderBundle;
        this.updateRenderBundle();
      });
    });
  }
  ensureEnoughAsteroids(asteroids, transform) {
    for (let i = this.renderables.length; i <= this.settings.asteroidCount; ++i) {
      // Place copies of the asteroid in a ring.
      const radius = Math.random() * 1.7 + 1.25;
      const angle = Math.random() * Math.PI * 2;
      const x = Math.sin(angle) * radius;
      const y = (Math.random() - 0.5) * 0.015;
      const z = Math.cos(angle) * radius;
      _wgpuMatrix.mat4.identity(transform);
      _wgpuMatrix.mat4.translate(transform, [x, y, z], transform);
      _wgpuMatrix.mat4.rotateX(transform, Math.random() * Math.PI, transform);
      _wgpuMatrix.mat4.rotateY(transform, Math.random() * Math.PI, transform);
      this.renderables.push({
        ...asteroids[i % asteroids.length],
        bindGroup: this.createSphereBindGroup(this.moonTexture, transform)
      });
    }
  }
  updateRenderBundle() {
    console.log('[CUBE] updateRenderBundle');
    const renderBundleEncoder = this.device.createRenderBundleEncoder({
      colorFormats: [this.presentationFormat],
      depthStencilFormat: 'depth24plus'
    });
    this.renderScene(renderBundleEncoder);
    this.renderBundle = renderBundleEncoder.finish();
  }
  createGeometry(options) {
    const mesh = this.createCubeVertices(options);
    // Create a vertex buffer from the sphere data.
    const vertices = this.device.createBuffer({
      size: mesh.vertices.byteLength,
      usage: GPUBufferUsage.VERTEX,
      mappedAtCreation: true
    });
    new Float32Array(vertices.getMappedRange()).set(mesh.vertices);
    vertices.unmap();
    const indices = this.device.createBuffer({
      size: mesh.indices.byteLength,
      usage: GPUBufferUsage.INDEX,
      mappedAtCreation: true
    });
    new Uint16Array(indices.getMappedRange()).set(mesh.indices);
    indices.unmap();
    return {
      vertices,
      indices,
      indexCount: mesh.indices.length
    };
  }
  createSphereBindGroup(texture, transform) {
    const uniformBufferSize = 4 * 16; // 4x4 matrix
    const uniformBuffer = this.device.createBuffer({
      size: uniformBufferSize,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
      mappedAtCreation: true
    });
    new Float32Array(uniformBuffer.getMappedRange()).set(transform);
    uniformBuffer.unmap();
    const bindGroup = this.device.createBindGroup({
      layout: this.pipeline.getBindGroupLayout(1),
      entries: [{
        binding: 0,
        resource: {
          buffer: uniformBuffer
        }
      }, {
        binding: 1,
        resource: this.sampler
      }, {
        binding: 2,
        resource: texture.createView()
      }]
    });
    return bindGroup;
  }

  // TEST 
  getViewMatrix() {
    const camera = this.cameras[this.mainCameraParams.type];
    const viewMatrix = camera.update(deltaTime, this.inputHandler());
    return viewMatrix;
  }
  getTransformationMatrix(pos) {
    const now = Date.now();
    const deltaTime = (now - this.lastFrameMS) / this.mainCameraParams.responseCoef;
    this.lastFrameMS = now;

    // const viewMatrix = mat4.identity(); ORI
    const camera = this.cameras[this.mainCameraParams.type];
    const viewMatrix = camera.update(deltaTime, this.inputHandler());
    _wgpuMatrix.mat4.translate(viewMatrix, _wgpuMatrix.vec3.fromValues(pos.x, pos.y, pos.z), viewMatrix);
    _wgpuMatrix.mat4.rotateX(viewMatrix, Math.PI * this.rotation.getRotX(), viewMatrix);
    _wgpuMatrix.mat4.rotateY(viewMatrix, Math.PI * this.rotation.getRotY(), viewMatrix);
    _wgpuMatrix.mat4.rotateZ(viewMatrix, Math.PI * this.rotation.getRotZ(), viewMatrix);
    _wgpuMatrix.mat4.multiply(this.projectionMatrix, viewMatrix, this.modelViewProjectionMatrix);
    return this.modelViewProjectionMatrix;
  }
  async loadTex1(textPath, device) {
    return new Promise(async resolve => {
      const response = await fetch(textPath[0]);
      const imageBitmap = await createImageBitmap(await response.blob());
      this.moonTexture = device.createTexture({
        size: [imageBitmap.width, imageBitmap.height, 1],
        format: 'rgba8unorm',
        usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT
      });
      var moonTexture = this.moonTexture;
      device.queue.copyExternalImageToTexture({
        source: imageBitmap
      }, {
        texture: moonTexture
      }, [imageBitmap.width, imageBitmap.height]);
      resolve();
    });
  }
  async loadTex0(texturesPaths, device) {
    return new Promise(async resolve => {
      const response = await fetch(texturesPaths[0]);
      const imageBitmap = await createImageBitmap(await response.blob());
      console.log('WHAT IS THIS ', this);
      this.texture0 = device.createTexture({
        size: [imageBitmap.width, imageBitmap.height, 1],
        format: 'rgba8unorm',
        usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT
      });
      var texture0 = this.texture0;
      device.queue.copyExternalImageToTexture({
        source: imageBitmap
      }, {
        texture: texture0
      }, [imageBitmap.width, imageBitmap.height]);
      resolve();
    });
  }

  // Render bundles function as partial, limited render passes, so we can use the
  // same code both to render the scene normally and to build the render bundle.
  renderScene(passEncoder) {
    if (typeof this.renderables === 'undefined') return;
    passEncoder.setPipeline(this.pipeline);
    passEncoder.setBindGroup(0, this.frameBindGroup);

    // Loop through every renderable object and draw them individually.
    // (Because many of these meshes are repeated, with only the transforms
    // differing, instancing would be highly effective here. This sample
    // intentionally avoids using instancing in order to emulate a more complex
    // scene, which helps demonstrate the potential time savings a render bundle
    // can provide.)
    let count = 0;
    for (const renderable of this.renderables) {
      passEncoder.setBindGroup(1, renderable.bindGroup);
      passEncoder.setVertexBuffer(0, renderable.vertices);
      passEncoder.setIndexBuffer(renderable.indices, 'uint16');
      passEncoder.drawIndexed(renderable.indexCount);
      if (++count > this.settings.asteroidCount) {
        break;
      }
    }
  }
  createCubeVertices(options) {
    if (typeof options === 'undefined') {
      var options = {
        scale: 1,
        useUVShema4x2: false
      };
    }
    if (typeof options.scale === 'undefined') options.scale = 1;
    let vertices;
    if (options.useUVShema4x2 == true) {
      vertices = new Float32Array([
      //  position   |  texture coordinate
      //-------------+----------------------
      // front face     select the top left image  1, 0.5,   
      -1, 1, 1, 1, 0, 0, 0, 0, -1, -1, 1, 1, 0, 0, 0, 0.5, 1, 1, 1, 1, 0, 0, 0.25, 0, 1, -1, 1, 1, 0, 0, 0.25, 0.5,
      // right face     select the top middle image
      1, 1, -1, 1, 0, 0, 0.25, 0, 1, 1, 1, 1, 0, 0, 0.5, 0, 1, -1, -1, 1, 0, 0, 0.25, 0.5, 1, -1, 1, 1, 0, 0, 0.5, 0.5,
      // back face      select to top right image
      1, 1, -1, 1, 0, 0, 0.5, 0, 1, -1, -1, 1, 0, 0, 0.5, 0.5, -1, 1, -1, 1, 0, 0, 0.75, 0, -1, -1, -1, 1, 0, 0, 0.75, 0.5,
      // left face       select the bottom left image
      -1, 1, 1, 1, 0, 0, 0, 0.5, -1, 1, -1, 1, 0, 0, 0.25, 0.5, -1, -1, 1, 1, 0, 0, 0, 1, -1, -1, -1, 1, 0, 0, 0.25, 1,
      // bottom face     select the bottom middle image
      1, -1, 1, 1, 0, 0, 0.25, 0.5, -1, -1, 1, 1, 0, 0, 0.5, 0.5, 1, -1, -1, 1, 0, 0, 0.25, 1, -1, -1, -1, 1, 0, 0, 0.5, 1,
      // top face        select the bottom right image
      -1, 1, 1, 1, 0, 0, 0.5, 0.5, 1, 1, 1, 1, 0, 0, 0.75, 0.5, -1, 1, -1, 1, 0, 0, 0.5, 1, 1, 1, -1, 1, 0, 0, 0.75, 1]);
    } else {
      vertices = new Float32Array([
      //  position                                                   |  texture coordinate
      //-------------                                              +----------------------
      // front face     select the top left image  1, 0.5,   
      -1 * options.scale, 1 * options.scale, 1 * options.scale, 1, 0, 0, 0, 0, -1 * options.scale, -1 * options.scale, 1 * options.scale, 1, 0, 0, 0, 1, 1 * options.scale, 1 * options.scale, 1 * options.scale, 1, 0, 0, 1, 0, 1 * options.scale, -1 * options.scale, 1 * options.scale, 1, 0, 0, 1, 1,
      // right face     select the top middle image
      1 * options.scale, 1 * options.scale, -1 * options.scale, 1, 0, 0, 0, 0, 1 * options.scale, 1 * options.scale, 1 * options.scale, 1, 0, 0, 0, 1, 1 * options.scale, -1 * options.scale, -1 * options.scale, 1, 0, 0, 1, 0, 1 * options.scale, -1 * options.scale, 1 * options.scale, 1, 0, 0, 1, 1,
      // back face      select to top right image
      1 * options.scale, 1 * options.scale, -1 * options.scale, 1, 0, 0, 0, 0, 1 * options.scale, -1 * options.scale, -1 * options.scale, 1, 0, 0, 0, 1, -1 * options.scale, 1 * options.scale, -1 * options.scale, 1, 0, 0, 1, 0, -1 * options.scale, -1 * options.scale, -1 * options.scale, 1, 0, 0, 1, 1,
      // left face       select the bottom left image
      -1 * options.scale, 1 * options.scale, 1 * options.scale, 1, 0, 0, 0, 0, -1 * options.scale, 1 * options.scale, -1 * options.scale, 1, 0, 0, 0, 1, -1 * options.scale, -1 * options.scale, 1 * options.scale, 1, 0, 0, 1, 0, -1 * options.scale, -1 * options.scale, -1 * options.scale, 1, 0, 0, 1, 1,
      // bottom face     select the bottom middle image
      1 * options.scale, -1 * options.scale, 1 * options.scale, 1, 0, 0, 0, 0, -1 * options.scale, -1 * options.scale, 1 * options.scale, 1, 0, 0, 0, 1, 1 * options.scale, -1 * options.scale, -1 * options.scale, 1, 0, 0, 1, 0, -1 * options.scale, -1 * options.scale, -1 * options.scale, 1, 0, 0, 1, 1,
      // top face        select the bottom right image
      -1 * options.scale, 1 * options.scale, 1 * options.scale, 1, 0, 0, 0, 0, 1 * options.scale, 1 * options.scale, 1 * options.scale, 1, 0, 0, 0, 1, -1 * options.scale, 1 * options.scale, -1 * options.scale, 1, 0, 0, 1, 0, 1 * options.scale, 1 * options.scale, -1 * options.scale, 1, 0, 0, 1, 1]);
    }
    const indices = new Uint16Array([0, 1, 2, 2, 1, 3,
    // front
    4, 5, 6, 6, 5, 7,
    // right
    8, 9, 10, 10, 9, 11,
    // back
    12, 13, 14, 14, 13, 15,
    // left
    16, 17, 18, 18, 17, 19,
    // bottom
    20, 21, 22, 22, 21, 23 // top
    ]);
    return {
      vertices,
      indices,
      numVertices: indices.length
    };
  }
  draw = () => {
    if (this.moonTexture == null) {
      // console.log('not ready')
      return;
    }
    const transformationMatrix = this.getTransformationMatrix(this.position);
    this.device.queue.writeBuffer(this.uniformBuffer, 0, transformationMatrix.buffer, transformationMatrix.byteOffset, transformationMatrix.byteLength);
    this.renderPassDescriptor.colorAttachments[0].view = this.context.getCurrentTexture().createView();
  };
}
exports.default = MECube;

},{"../shaders/shaders":33,"./engine":20,"./matrix-class":26,"wgpu-matrix":16}],20:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.WASDCamera = exports.ArcballCamera = void 0;
exports.createInputHandler = createInputHandler;
var _wgpuMatrix = require("wgpu-matrix");
var _utils = require("./utils");
// Note: The code in this file does not use the 'dst' output parameter of functions in the
// 'wgpu-matrix' library, so produces many temporary vectors and matrices.
// This is intentional, as this sample prefers readability over performance.

// The common functionality between camera implementations
class CameraBase {
  // The camera matrix
  matrix_ = new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);

  // The calculated view matrix readonly
  view_ = _wgpuMatrix.mat4.create();

  // Aliases to column vectors of the matrix
  right_ = new Float32Array(this.matrix_.buffer, 4 * 0, 4);
  up_ = new Float32Array(this.matrix_.buffer, 4 * 4, 4);
  back_ = new Float32Array(this.matrix_.buffer, 4 * 8, 4);
  position_ = new Float32Array(this.matrix_.buffer, 4 * 12, 4);

  // Returns the camera matrix
  get matrix() {
    return this.matrix_;
  }
  // Assigns `mat` to the camera matrix
  set matrix(mat) {
    _wgpuMatrix.mat4.copy(mat, this.matrix_);
  }

  // setProjection(fov = (2*Math.PI) / 5 , aspect = 1, near = 0.5, far = 1000) {
  //   this.projectionMatrix = mat4.perspective(fov, aspect, near, far);
  // }

  // Returns the camera view matrix
  get view() {
    return this.view_;
  }
  // Assigns `mat` to the camera view
  set view(mat) {
    _wgpuMatrix.mat4.copy(mat, this.view_);
  }

  // Returns column vector 0 of the camera matrix
  get right() {
    return this.right_;
  }

  // Assigns `vec` to the first 3 elements of column vector 0 of the camera matrix
  set right(vec) {
    _wgpuMatrix.vec3.copy(vec, this.right_);
  }

  // Returns column vector 1 of the camera matrix
  get up() {
    return this.up_;
  }

  // Assigns `vec` to the first 3 elements of column vector 1 of the camera matrix \ Vec3
  set up(vec) {
    _wgpuMatrix.vec3.copy(vec, this.up_);
  }

  // Returns column vector 2 of the camera matrix
  get back() {
    return this.back_;
  }

  // Assigns `vec` to the first 3 elements of column vector 2 of the camera matrix
  set back(vec) {
    _wgpuMatrix.vec3.copy(vec, this.back_);
  }

  // Returns column vector 3 of the camera matrix
  get position() {
    return this.position_;
  }

  // Assigns `vec` to the first 3 elements of column vector 3 of the camera matrix
  set position(vec) {
    _wgpuMatrix.vec3.copy(vec, this.position_);
  }
}

// WASDCamera is a camera implementation that behaves similar to first-person-shooter PC games.
class WASDCamera extends CameraBase {
  // The camera absolute pitch angle
  pitch = 0;
  // The camera absolute yaw angle
  yaw = 0;

  // The movement veloicty readonly
  velocity_ = _wgpuMatrix.vec3.create();

  // Speed multiplier for camera movement
  movementSpeed = 10;

  // Speed multiplier for camera rotation
  rotationSpeed = 1;

  // Movement velocity drag coeffient [0 .. 1]
  // 0: Continues forever
  // 1: Instantly stops moving
  frictionCoefficient = 0.99;

  // Returns velocity vector
  get velocity() {
    return this.velocity_;
  }
  // Assigns `vec` to the velocity vector
  set velocity(vec) {
    _wgpuMatrix.vec3.copy(vec, this.velocity_);
  }
  setProjection(fov = 2 * Math.PI / 5, aspect = 1, near = 1, far = 1000) {
    this.projectionMatrix = _wgpuMatrix.mat4.perspective(fov, aspect, near, far);
  }
  constructor(options) {
    super();
    if (options && (options.position || options.target)) {
      const position = options.position ?? _wgpuMatrix.vec3.create(0, 0, 0);
      const target = options.target ?? _wgpuMatrix.vec3.create(0, 0, 0);
      const forward = _wgpuMatrix.vec3.normalize(_wgpuMatrix.vec3.sub(target, position));
      this.recalculateAngles(forward);
      this.position = position;
      this.canvas = options.canvas;
      this.aspect = options.canvas.width / options.canvas.height;
      this.setProjection(2 * Math.PI / 5, this.aspect, 1, 1000);
      // console.log(`%cCamera constructor : ${position}`, LOG_INFO);
    }
  }

  // Returns the camera matrix
  get matrix() {
    return super.matrix;
  }

  // Assigns `mat` to the camera matrix, and recalcuates the camera angles
  set matrix(mat) {
    super.matrix = mat;
    this.recalculateAngles(this.back);
  }
  update(deltaTime, input) {
    const sign = (positive, negative) => (positive ? 1 : 0) - (negative ? 1 : 0);

    // Apply the delta rotation to the pitch and yaw angles
    this.yaw -= input.analog.x * deltaTime * this.rotationSpeed;
    this.pitch -= input.analog.y * deltaTime * this.rotationSpeed;

    // Wrap yaw between [0° .. 360°], just to prevent large accumulation.
    this.yaw = mod(this.yaw, Math.PI * 2);
    // Clamp pitch between [-90° .. +90°] to prevent somersaults.
    this.pitch = clamp(this.pitch, -Math.PI / 2, Math.PI / 2);

    // Save the current position, as we're about to rebuild the camera matrix.
    const position = _wgpuMatrix.vec3.copy(this.position);

    // Reconstruct the camera's rotation, and store into the camera matrix.
    super.matrix = _wgpuMatrix.mat4.rotateX(_wgpuMatrix.mat4.rotationY(this.yaw), this.pitch);
    // super.matrix = mat4.rotateX(mat4.rotationY(this.yaw), -this.pitch);
    // super.matrix = mat4.rotateY(mat4.rotateX(this.pitch), this.yaw);

    // Calculate the new target velocity
    const digital = input.digital;
    const deltaRight = sign(digital.right, digital.left);
    const deltaUp = sign(digital.up, digital.down);
    const targetVelocity = _wgpuMatrix.vec3.create();
    const deltaBack = sign(digital.backward, digital.forward);
    _wgpuMatrix.vec3.addScaled(targetVelocity, this.right, deltaRight, targetVelocity);
    _wgpuMatrix.vec3.addScaled(targetVelocity, this.up, deltaUp, targetVelocity);
    _wgpuMatrix.vec3.addScaled(targetVelocity, this.back, deltaBack, targetVelocity);
    _wgpuMatrix.vec3.normalize(targetVelocity, targetVelocity);
    _wgpuMatrix.vec3.mulScalar(targetVelocity, this.movementSpeed, targetVelocity);

    // Mix new target velocity
    this.velocity = lerp(targetVelocity, this.velocity, Math.pow(1 - this.frictionCoefficient, deltaTime));

    // Integrate velocity to calculate new position
    this.position = _wgpuMatrix.vec3.addScaled(position, this.velocity, deltaTime);

    // Invert the camera matrix to build the view matrix
    this.view = _wgpuMatrix.mat4.invert(this.matrix);
    return this.view;
  }

  // Recalculates the yaw and pitch values from a directional vector
  recalculateAngles(dir) {
    this.yaw = Math.atan2(dir[0], dir[2]);
    this.pitch = -Math.asin(dir[1]);
  }
}

// ArcballCamera implements a basic orbiting camera around the world origin
exports.WASDCamera = WASDCamera;
class ArcballCamera extends CameraBase {
  // The camera distance from the target
  distance = 0;

  // The current angular velocity
  angularVelocity = 0;

  // The current rotation axis
  axis_ = _wgpuMatrix.vec3.create();

  // Returns the rotation axis
  get axis() {
    return this.axis_;
  }
  // Assigns `vec` to the rotation axis
  set axis(vec) {
    _wgpuMatrix.vec3.copy(vec, this.axis_);
  }

  // Speed multiplier for camera rotation
  rotationSpeed = 1;

  // Speed multiplier for camera zoom
  zoomSpeed = 0.1;

  // Rotation velocity drag coeffient [0 .. 1]
  // 0: Spins forever
  // 1: Instantly stops spinning
  frictionCoefficient = 0.999;

  // Construtor
  constructor(options) {
    super();
    if (options && options.position) {
      this.position = options.position;
      this.distance = _wgpuMatrix.vec3.len(this.position);
      this.back = _wgpuMatrix.vec3.normalize(this.position);
      this.recalcuateRight();
      this.recalcuateUp();
    }
  }

  // Returns the camera matrix
  get matrix() {
    return super.matrix;
  }

  // Assigns `mat` to the camera matrix, and recalcuates the distance
  set matrix(mat) {
    super.matrix = mat;
    this.distance = _wgpuMatrix.vec3.len(this.position);
  }
  update(deltaTime, input) {
    const epsilon = 0.0000001;
    if (input.analog.touching) {
      // Currently being dragged.
      this.angularVelocity = 0;
    } else {
      // Dampen any existing angular velocity
      this.angularVelocity *= Math.pow(1 - this.frictionCoefficient, deltaTime);
    }

    // Calculate the movement vector
    const movement = _wgpuMatrix.vec3.create();
    _wgpuMatrix.vec3.addScaled(movement, this.right, input.analog.x, movement);
    _wgpuMatrix.vec3.addScaled(movement, this.up, -input.analog.y, movement);

    // Cross the movement vector with the view direction to calculate the rotation axis x magnitude
    const crossProduct = _wgpuMatrix.vec3.cross(movement, this.back);

    // Calculate the magnitude of the drag
    const magnitude = _wgpuMatrix.vec3.len(crossProduct);
    if (magnitude > epsilon) {
      // Normalize the crossProduct to get the rotation axis
      this.axis = _wgpuMatrix.vec3.scale(crossProduct, 1 / magnitude);

      // Remember the current angular velocity. This is used when the touch is released for a fling.
      this.angularVelocity = magnitude * this.rotationSpeed;
    }

    // The rotation around this.axis to apply to the camera matrix this update
    const rotationAngle = this.angularVelocity * deltaTime;
    if (rotationAngle > epsilon) {
      // Rotate the matrix around axis
      // Note: The rotation is not done as a matrix-matrix multiply as the repeated multiplications
      // will quickly introduce substantial error into the matrix.
      this.back = _wgpuMatrix.vec3.normalize(rotate(this.back, this.axis, rotationAngle));
      this.recalcuateRight();
      this.recalcuateUp();
    }

    // recalculate `this.position` from `this.back` considering zoom
    if (input.analog.zoom !== 0) {
      this.distance *= 1 + input.analog.zoom * this.zoomSpeed;
    }
    this.position = _wgpuMatrix.vec3.scale(this.back, this.distance);

    // Invert the camera matrix to build the view matrix
    this.view = _wgpuMatrix.mat4.invert(this.matrix);
    return this.view;
  }

  // Assigns `this.right` with the cross product of `this.up` and `this.back`
  recalcuateRight() {
    this.right = _wgpuMatrix.vec3.normalize(_wgpuMatrix.vec3.cross(this.up, this.back));
  }

  // Assigns `this.up` with the cross product of `this.back` and `this.right`
  recalcuateUp() {
    this.up = _wgpuMatrix.vec3.normalize(_wgpuMatrix.vec3.cross(this.back, this.right));
  }
}

// Returns `x` clamped between [`min` .. `max`]
exports.ArcballCamera = ArcballCamera;
function clamp(x, min, max) {
  return Math.min(Math.max(x, min), max);
}

// Returns `x` float-modulo `div`
function mod(x, div) {
  return x - Math.floor(Math.abs(x) / div) * div * Math.sign(x);
}

// Returns `vec` rotated `angle` radians around `axis`
function rotate(vec, axis, angle) {
  return _wgpuMatrix.vec3.transformMat4Upper3x3(vec, _wgpuMatrix.mat4.rotation(axis, angle));
}

// Returns the linear interpolation between 'a' and 'b' using 's'
function lerp(a, b, s) {
  return _wgpuMatrix.vec3.addScaled(a, _wgpuMatrix.vec3.sub(b, a), s);
}
function createInputHandler(window, canvas) {
  let digital = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    up: false,
    down: false
  };
  let analog = {
    x: 0,
    y: 0,
    zoom: 0
  };
  let mouseDown = false;
  const setDigital = (e, value) => {
    switch (e.code) {
      case 'KeyW':
        digital.forward = value;
        break;
      case 'KeyS':
        digital.backward = value;
        break;
      case 'KeyA':
        digital.left = value;
        break;
      case 'KeyD':
        digital.right = value;
        break;
      case 'Space':
        digital.up = value;
        break;
      case 'ShiftLeft':
      case 'ControlLeft':
      case 'KeyC':
        digital.down = value;
        break;
    }
    // if you wanna dosavle all keyboard input for some reason...
    // add later like new option feature...
    // e.preventDefault();
    e.stopPropagation();
  };
  window.addEventListener('keydown', e => setDigital(e, true));
  window.addEventListener('keyup', e => setDigital(e, false));
  canvas.style.touchAction = 'pinch-zoom';
  canvas.addEventListener('pointerdown', () => {
    mouseDown = true;
  });
  canvas.addEventListener('pointerup', () => {
    mouseDown = false;
  });
  canvas.addEventListener('pointermove', e => {
    mouseDown = e.pointerType === 'mouse' ? (e.buttons & 1) !== 0 : true;
    if (mouseDown) {
      analog.x += e.movementX / 10;
      analog.y += e.movementY / 10;
    }
  });
  canvas.addEventListener('wheel', e => {
    if ((e.buttons & 1) !== 0) {
      analog.zoom += Math.sign(e.deltaY);
      e.preventDefault();
      e.stopPropagation();
    }
  }, {
    passive: false
  });
  return () => {
    // Guard: prevent zero deltas from breaking camera math
    const safeX = analog.x || 0.0001;
    const safeY = analog.y || 0.0001;
    const out = {
      digital,
      analog: {
        x: safeX,
        y: safeY,
        zoom: analog.zoom,
        touching: mouseDown
      }
    };
    // Reset only the deltas for next frame
    analog.x = 0;
    analog.y = 0;
    analog.zoom = 0;
    return out;
  };
}

},{"./utils":28,"wgpu-matrix":16}],21:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.SpotLight = void 0;
var _wgpuMatrix = require("wgpu-matrix");
var _vertexShadow = require("../shaders/vertexShadow.wgsl");
var _behavior = _interopRequireDefault(require("./behavior"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
/**
 * @description
 * Spot light with shodow cast.
 * @author Nikola Lukic
 * @email zlatnaspirala@gmail.com
 */
class SpotLight {
  camera;
  inputHandler;
  position;
  target;
  up;
  direction;
  viewMatrix;
  projectionMatrix;
  viewProjMatrix;
  fov;
  aspect;
  near;
  far;
  innerCutoff;
  outerCutoff;
  spotlightUniformBuffer;
  constructor(camera, inputHandler, device, position = _wgpuMatrix.vec3.create(0, 10, -20), target = _wgpuMatrix.vec3.create(0, 0, -20), fov = 45, aspect = 1.0, near = 0.1, far = 200) {
    this.fov = fov;
    this.aspect = aspect;
    this.near = near;
    this.far = far;
    this.camera = camera;
    this.inputHandler = inputHandler;
    this.position = position;
    this.target = target;
    this.up = _wgpuMatrix.vec3.create(0, 0, -1);
    this.direction = _wgpuMatrix.vec3.normalize(_wgpuMatrix.vec3.subtract(target, position));
    this.intensity = 1.0;
    this.color = _wgpuMatrix.vec3.create(1.0, 1.0, 1.0); // white

    this.viewMatrix = _wgpuMatrix.mat4.lookAt(position, target, this.up);
    this.projectionMatrix = _wgpuMatrix.mat4.perspective(this.fov * Math.PI / 180, this.aspect, this.near, this.far);
    this.setProjection = function (fov = 2 * Math.PI / 5, aspect = 1.0, near = 0.1, far = 200) {
      this.projectionMatrix = _wgpuMatrix.mat4.perspective(fov, aspect, near, far);
    };
    this.updateProjection = function () {
      this.projectionMatrix = _wgpuMatrix.mat4.perspective(this.fov, this.aspect, this.near, this.far);
    };
    this.device = device;
    this.viewProjMatrix = _wgpuMatrix.mat4.multiply(this.projectionMatrix, this.viewMatrix);
    this.fov = fov;
    this.aspect = aspect;
    this.near = near;
    this.far = far;
    this.innerCutoff = Math.cos(Math.PI / 180 * 12.5);
    this.outerCutoff = Math.cos(Math.PI / 180 * 17.5);
    this.ambientFactor = 0.5;
    this.range = 20.0;
    this.shadowBias = 0.01;
    this.SHADOW_RES = 1024;
    this.primitive = {
      topology: 'triangle-list',
      cullMode: 'back',
      // for front interest border drawen shadows !
      frontFace: 'ccw'
    };
    this.shadowTexture = this.device.createTexture({
      label: 'shadowTexture[light]',
      size: [this.SHADOW_RES, this.SHADOW_RES, 1],
      format: "depth32float",
      usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING
    });
    this.shadowSampler = device.createSampler({
      label: 'shadowSampler[light]',
      compare: 'less',
      magFilter: 'linear',
      minFilter: 'linear'
    });
    this.renderPassDescriptor = {
      label: "renderPassDescriptor shadowPass [per SpotLigth]",
      colorAttachments: [],
      depthStencilAttachment: {
        view: this.shadowTexture.createView(),
        depthClearValue: 1.0,
        depthLoadOp: "clear",
        depthStoreOp: "store"
      }
    };
    this.uniformBufferBindGroupLayout = this.device.createBindGroupLayout({
      label: 'uniformBufferBindGroupLayout in light',
      entries: [{
        binding: 0,
        visibility: GPUShaderStage.VERTEX,
        buffer: {
          type: 'uniform'
        }
      }]
    });
    this.shadowBindGroupContainer = [];
    this.shadowBindGroup = [];
    this.getShadowBindGroup = (mesh, index) => {
      if (this.shadowBindGroupContainer[index]) {
        return this.shadowBindGroupContainer[index];
      }
      this.shadowBindGroupContainer[index] = this.device.createBindGroup({
        label: 'sceneBindGroupForShadow in light',
        layout: this.uniformBufferBindGroupLayout,
        entries: [{
          binding: 0,
          resource: {
            buffer: mesh.sceneUniformBuffer
          }
        }]
      });
      return this.shadowBindGroupContainer[index];
    };

    // test
    this.getShadowBindGroup_bones = index => {
      if (this.shadowBindGroup[index]) {
        return this.shadowBindGroup[index];
      }
      this.modelUniformBuffer = this.device.createBuffer({
        size: 4 * 16,
        // 4x4 matrix
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
      });
      this.shadowBindGroup[index] = this.device.createBindGroup({
        label: 'model BindGroupForShadow in light',
        layout: this.uniformBufferBindGroupLayout,
        entries: [{
          binding: 0,
          resource: {
            buffer: this.modelUniformBuffer
          }
        }]
      });
      return this.shadowBindGroupContainer[index];
    };
    this.modelBindGroupLayout = this.device.createBindGroupLayout({
      label: 'modelBindGroupLayout in light [one bindings]',
      entries: [{
        binding: 0,
        visibility: GPUShaderStage.VERTEX,
        buffer: {
          type: 'uniform'
        }
      }]
    });
    this.shadowPipeline = this.device.createRenderPipeline({
      label: 'shadowPipeline per light',
      layout: this.device.createPipelineLayout({
        label: 'createPipelineLayout - uniformBufferBindGroupLayout light',
        bindGroupLayouts: [this.uniformBufferBindGroupLayout, this.modelBindGroupLayout]
      }),
      vertex: {
        module: this.device.createShaderModule({
          code: _vertexShadow.vertexShadowWGSL
        }),
        buffers: [{
          arrayStride: 12,
          // 3 * 4 bytes (vec3f)
          attributes: [{
            shaderLocation: 0,
            // must match @location(0) in vertex shader
            offset: 0,
            format: "float32x3"
          }]
        }]
      },
      depthStencil: {
        depthWriteEnabled: true,
        depthCompare: 'less',
        format: 'depth32float'
      },
      primitive: this.primitive
    });
    this.getMainPassBindGroup = function (mesh) {
      // You can cache it per mesh to avoid recreating each frame
      if (!this.mainPassBindGroupContainer) this.mainPassBindGroupContainer = [];
      const index = mesh._lightBindGroupIndex || 0; // assign unique per mesh if needed
      if (this.mainPassBindGroupContainer[index]) {
        return this.mainPassBindGroupContainer[index];
      }
      this.mainPassBindGroupContainer[index] = this.device.createBindGroup({
        label: `mainPassBindGroup for mesh`,
        layout: mesh.mainPassBindGroupLayout,
        // this should match the pipeline
        entries: [{
          binding: 0,
          // must match @binding in shader for shadow texture
          resource: this.shadowTexture.createView()
        }, {
          binding: 1,
          // must match @binding in shader for shadow sampler
          resource: this.shadowSampler
        }]
      });
      return this.mainPassBindGroupContainer[index];
    };

    // Only osc values +-
    this.behavior = new _behavior.default();

    // put here only func
    this.updater = [];
  }
  update() {
    this.updater.forEach(update => {
      update(this);
    });
    this.direction = _wgpuMatrix.vec3.normalize(_wgpuMatrix.vec3.subtract(this.target, this.position));
    const target = _wgpuMatrix.vec3.add(this.position, this.direction);
    this.viewMatrix = _wgpuMatrix.mat4.lookAt(this.position, target, this.up);
    this.viewProjMatrix = _wgpuMatrix.mat4.multiply(this.projectionMatrix, this.viewMatrix);
  }
  getLightDataBuffer() {
    const m = this.viewProjMatrix;
    return new Float32Array([...this.position, 0.0, ...this.direction, 0.0, this.innerCutoff, this.outerCutoff, this.intensity, 0.0, ...this.color, 0.0, this.range, this.ambientFactor, this.shadowBias,
    // <<--- use shadowBias
    0.0,
    // keep padding
    ...m]);
  }
}
exports.SpotLight = SpotLight;

},{"../shaders/vertexShadow.wgsl":35,"./behavior":18,"wgpu-matrix":16}],22:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.makeObjSeqArg = exports.initMeshBuffers = exports.downloadMeshes = exports.constructMesh = void 0;
exports.play = play;
/**
 * The main Mesh class. The constructor will parse through the OBJ file data
 * and collect the vertex, vertex normal, texture, and face information. This
 * information can then be used later on when creating your VBOs. See
 * OBJ.initMeshBuffers for an example of how to use the newly created Mesh
 *
 * Nidza Note:
 * There is difference from me source obj loader and me-wgpu obj loader
 * Here we need scele in comp x,y,z because we use also primitive [cube, sphere etc...]
 * @class Mesh
 * @constructor
 *
 * @param {String} objectData a string representation of an OBJ file with newlines preserved.
 */

class constructMesh {
  constructor(objectData, inputArg) {
    this.inputArg = inputArg;
    this.objectData = objectData;
    this.create(objectData, inputArg);
    this.setScale = s => {
      this.inputArg.scale = s;
      this.create(this.objectData, this.inputArg);
    };
    this.updateBuffers = () => {
      this.inputArg.scale = [0.1, 0.1, 0.1];
      this.create(this.objectData, this.inputArg);
    };
  }
  create = (objectData, inputArg, callback) => {
    if (typeof callback === 'undefined') callback = function () {};
    let initOrientation = [0, 1, 2];
    /*
      The OBJ file format does a sort of compression when saving a model in a
      program like Blender. There are at least 3 sections (4 including textures)
      within the file. Each line in a section begins with the same string:
        * 'v': indicates vertex section
        * 'vn': indicates vertex normal section
        * 'f': indicates the faces section
        * 'vt': indicates vertex texture section (if textures were used on the model)
      Each of the above sections (except for the faces section) is a list/set of
      unique vertices.
      Each line of the faces section contains a list of
      (vertex, [texture], normal) groups
      Some examples:
          // the texture index is optional, both formats are possible for models
          // without a texture applied
          f 1/25 18/46 12/31
          f 1//25 18//46 12//31
          // A 3 vertex face with texture indices
          f 16/92/11 14/101/22 1/69/1
          // A 4 vertex face
          f 16/92/11 40/109/40 38/114/38 14/101/22
      The first two lines are examples of a 3 vertex face without a texture applied.
      The second is an example of a 3 vertex face with a texture applied.
      The third is an example of a 4 vertex face. Note: a face can contain N
      number of vertices.
      Each number that appears in one of the groups is a 1-based index
      corresponding to an item from the other sections (meaning that indexing
      starts at one and *not* zero).
      For example:
          `f 16/92/11` is saying to
            - take the 16th element from the [v] vertex array
            - take the 92nd element from the [vt] texture array
            - take the 11th element from the [vn] normal array
          and together they make a unique vertex.
      Using all 3+ unique Vertices from the face line will produce a polygon.
      Now, you could just go through the OBJ file and create a new vertex for
      each face line and WebGL will draw what appears to be the same model.
      However, vertices will be overlapped and duplicated all over the place.
      Consider a cube in 3D space centered about the origin and each side is
      2 units long. The front face (with the positive Z-axis pointing towards
      you) would have a Top Right vertex (looking orthogonal to its normal)
      mapped at (1,1,1) The right face would have a Top Left vertex (looking
      orthogonal to its normal) at (1,1,1) and the top face would have a Bottom
      Right vertex (looking orthogonal to its normal) at (1,1,1). Each face
      has a vertex at the same coordinates, however, three distinct vertices
      will be drawn at the same spot.
      To solve the issue of duplicate Vertices (the `(vertex, [texture], normal)`
      groups), while iterating through the face lines, when a group is encountered
      the whole group string ('16/92/11') is checked to see if it exists in the
      packed.hashindices object, and if it doesn't, the indices it specifies
      are used to look up each attribute in the corresponding attribute arrays
      already created. The values are then copied to the corresponding unpacked
      array (flattened to play nice with WebGL's ELEMENT_ARRAY_BUFFER indexing),
      the group string is added to the hashindices set and the current unpacked
      index is used as this hashindices value so that the group of elements can
      be reused. The unpacked index is incremented. If the group string already
      exists in the hashindices object, its corresponding value is the index of
      that group and is appended to the unpacked indices array.
      */
    var verts = [],
      vertNormals = [],
      textures = [],
      unpacked = {};
    // unpacking stuff
    unpacked.verts = [];
    unpacked.norms = [];
    unpacked.textures = [];
    unpacked.hashindices = {};
    unpacked.indices = [];
    unpacked.index = 0;
    // array of lines separated by the newline
    var lines = objectData.split('\n');

    // update swap orientation
    if (inputArg.swap[0] !== null) {
      swap(inputArg.swap[0], inputArg.swap[1], initOrientation);
    }
    var VERTEX_RE = /^v\s/;
    var NORMAL_RE = /^vn\s/;
    var TEXTURE_RE = /^vt\s/;
    var FACE_RE = /^f\s/;
    var WHITESPACE_RE = /\s+/;
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i].trim();
      var elements = line.split(WHITESPACE_RE);
      elements.shift();
      if (VERTEX_RE.test(line)) {
        // if this is a vertex
        verts.push.apply(verts, elements);
      } else if (NORMAL_RE.test(line)) {
        // if this is a vertex normal
        vertNormals.push.apply(vertNormals, elements);
      } else if (TEXTURE_RE.test(line)) {
        // if this is a texture
        textures.push.apply(textures, elements);
      } else if (FACE_RE.test(line)) {
        // if this is a face
        /*
          split this face into an array of vertex groups
          for example:
            f 16/92/11 14/101/22 1/69/1
          becomes:
            ['16/92/11', '14/101/22', '1/69/1'];
          */
        var quad = false;
        for (var j = 0, eleLen = elements.length; j < eleLen; j++) {
          // Triangulating quads
          // quad: 'f v0/t0/vn0 v1/t1/vn1 v2/t2/vn2 v3/t3/vn3/'
          // corresponding triangles:
          //      'f v0/t0/vn0 v1/t1/vn1 v2/t2/vn2'
          //      'f v2/t2/vn2 v3/t3/vn3 v0/t0/vn0'
          if (j === 3 && !quad) {
            // add v2/t2/vn2 in again before continuing to 3
            j = 2;
            quad = true;
          }
          if (elements[j] in unpacked.hashindices) {
            unpacked.indices.push(unpacked.hashindices[elements[j]]);
          } else {
            /*
                  Each element of the face line array is a vertex which has its
                  attributes delimited by a forward slash. This will separate
                  each attribute into another array:
                      '19/92/11'
                  becomes:
                      vertex = ['19', '92', '11'];
                  where
                      vertex[0] is the vertex index
                      vertex[1] is the texture index
                      vertex[2] is the normal index
                  Think of faces having Vertices which are comprised of the
                  attributes location (v), texture (vt), and normal (vn).
                  */
            var vertex = elements[j].split('/');
            /*
                  The verts, textures, and vertNormals arrays each contain a
                  flattend array of coordinates.
                  Because it gets confusing by referring to vertex and then
                  vertex (both are different in my descriptions) I will explain
                  what's going on using the vertexNormals array:
                  vertex[2] will contain the one-based index of the vertexNormals
                  section (vn). One is subtracted from this index number to play
                  nice with javascript's zero-based array indexing.
                  Because vertexNormal is a flattened array of x, y, z values,
                  simple pointer arithmetic is used to skip to the start of the
                  vertexNormal, then the offset is added to get the correct
                  component: +0 is x, +1 is y, +2 is z.
                  This same process is repeated for verts and textures.
                  */
            // vertex position
            unpacked.verts.push(+verts[(vertex[0] - 1) * 3 + initOrientation[0]] * inputArg.scale[0]);
            unpacked.verts.push(+verts[(vertex[0] - 1) * 3 + initOrientation[1]] * inputArg.scale[1]);
            unpacked.verts.push(+verts[(vertex[0] - 1) * 3 + initOrientation[2]] * inputArg.scale[2]);

            // vertex textures
            if (textures.length) {
              unpacked.textures.push(+textures[(vertex[1] - 1) * 2 + 0]);
              unpacked.textures.push(+textures[(vertex[1] - 1) * 2 + 1]);
            }
            // vertex normals
            unpacked.norms.push(+vertNormals[(vertex[2] - 1) * 3 + 0]);
            unpacked.norms.push(+vertNormals[(vertex[2] - 1) * 3 + 1]);
            unpacked.norms.push(+vertNormals[(vertex[2] - 1) * 3 + 2]);
            // add the newly created vertex to the list of indices
            unpacked.hashindices[elements[j]] = unpacked.index;
            unpacked.indices.push(unpacked.index);
            // increment the counter
            unpacked.index += 1;
          }
          if (j === 3 && quad) {
            // add v0/t0/vn0 onto the second triangle
            unpacked.indices.push(unpacked.hashindices[elements[0]]);
          }
        }
      }
    }
    this.vertices = unpacked.verts;
    this.vertexNormals = unpacked.norms;
    this.textures = unpacked.textures;
    this.indices = unpacked.indices;
    callback();
    return this;
  };
}
exports.constructMesh = constructMesh;
var Ajax = function () {
  // this is just a helper class to ease ajax calls
  var _this = this;
  this.xmlhttp = new XMLHttpRequest();
  this.get = function (url, callback) {
    _this.xmlhttp.onreadystatechange = function () {
      if (_this.xmlhttp.readyState === 4) {
        callback(_this.xmlhttp.responseText, _this.xmlhttp.status);
      }
    };
    _this.xmlhttp.open('GET', url, true);
    _this.xmlhttp.send();
  };
};

/**
 * Takes in an object of `mesh_name`, `'/url/to/OBJ/file'` pairs and a callback
 * function. Each OBJ file will be ajaxed in and automatically converted to
 * an OBJ.Mesh. When all files have successfully downloaded the callback
 * function provided will be called and passed in an object containing
 * the newly created meshes.
 *
 * **Note:** In order to use this function as a way to download meshes, a
 * webserver of some sort must be used.
 *
 * @param {Object} nameAndURLs an object where the key is the name of the mesh and the value is the url to that mesh's OBJ file
 *
 * @param {Function} completionCallback should contain a function that will take one parameter: an object array where the keys will be the unique object name and the value will be a Mesh object
 *
 * @param {Object} meshes In case other meshes are loaded separately or if a previously declared variable is desired to be used, pass in a (possibly empty) json object of the pattern: { '<mesh_name>': OBJ.Mesh }
 *
 */
var downloadMeshes = function (nameAndURLs, completionCallback, inputArg) {
  // the total number of meshes. this is used to implement "blocking"
  var semaphore = Object.keys(nameAndURLs).length;
  // if error is true, an alert will given
  var error = false;
  // this is used to check if all meshes have been downloaded
  // if meshes is supplied, then it will be populated, otherwise
  // a new object is created. this will be passed into the completionCallback
  if (typeof inputArg === 'undefined') {
    var inputArg = {
      scale: [0.1, 0.1, 0.1],
      swap: [null]
    };
  }
  if (typeof inputArg.scale === 'undefined') inputArg.scale = [0.1, 0.1, 0.1];
  if (typeof inputArg.swap === 'undefined') inputArg.swap = [null];
  var meshes = {};

  // loop over the mesh_name,url key,value pairs
  for (var mesh_name in nameAndURLs) {
    if (nameAndURLs.hasOwnProperty(mesh_name)) {
      new Ajax().get(nameAndURLs[mesh_name], function (name) {
        return function (data, status) {
          if (status === 200) {
            meshes[name] = new constructMesh(data, inputArg);
          } else {
            error = true;
            console.error('An error has occurred and the mesh "' + name + '" could not be downloaded.');
          }
          // the request has finished, decrement the counter
          semaphore--;
          if (semaphore === 0) {
            if (error) {
              // if an error has occurred, the user is notified here and the
              // callback is not called
              console.error('An error has occurred and one or meshes has not been ' + 'downloaded. The execution of the script has terminated.');
              throw '';
            }
            // there haven't been any errors in retrieving the meshes
            // call the callback
            completionCallback(meshes);
          }
        };
      }(mesh_name));
    }
  }
};

/**
 * Takes in the WebGL context and a Mesh, then creates and appends the buffers
 * to the mesh object as attributes.
 *
 * @param {WebGLRenderingContext} gl the `canvas.getContext('webgl')` context instance
 * @param {Mesh} mesh a single `OBJ.Mesh` instance
 *
 * The newly created mesh attributes are:
 *
 * Attrbute | Description
 * :--- | ---
 * **normalBuffer**       |contains the model&#39;s Vertex Normals
 * normalBuffer.itemSize  |set to 3 items
 * normalBuffer.numItems  |the total number of vertex normals
 * |
 * **textureBuffer**      |contains the model&#39;s Texture Coordinates
 * textureBuffer.itemSize |set to 2 items
 * textureBuffer.numItems |the number of texture coordinates
 * |
 * **vertexBuffer**       |contains the model&#39;s Vertex Position Coordinates (does not include w)
 * vertexBuffer.itemSize  |set to 3 items
 * vertexBuffer.numItems  |the total number of vertices
 * |
 * **indexBuffer**        |contains the indices of the faces
 * indexBuffer.itemSize   |is set to 1
 * indexBuffer.numItems   |the total number of indices
 *
 * A simple example (a lot of steps are missing, so don't copy and paste):
 *
 *     var gl   = canvas.getContext('webgl'),
 *         mesh = OBJ.Mesh(obj_file_data);
 *     // compile the shaders and create a shader program
 *     var shaderProgram = gl.createProgram();
 *     // compilation stuff here
 *     ...
 *     // make sure you have vertex, vertex normal, and texture coordinate
 *     // attributes located in your shaders and attach them to the shader program
 *     shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
 *     gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);
 *
 *     shaderProgram.vertexNormalAttribute = gl.getAttribLocation(shaderProgram, "aVertexNormal");
 *     gl.enableVertexAttribArray(shaderProgram.vertexNormalAttribute);
 *
 *     shaderProgram.textureCoordAttribute = gl.getAttribLocation(shaderProgram, "aTextureCoord");
 *     gl.enableVertexAttribArray(shaderProgram.textureCoordAttribute);
 *
 *     // create and initialize the vertex, vertex normal, and texture coordinate buffers
 *     // and save on to the mesh object
 *     OBJ.initMeshBuffers(gl, mesh);
 *
 *     // now to render the mesh
 *     gl.bindBuffer(gl.ARRAY_BUFFER, mesh.vertexBuffer);
 *     gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, mesh.vertexBuffer.itemSize, gl.FLOAT, false, 0, 0);
 *     // it's possible that the mesh doesn't contain
 *     // any texture coordinates (e.g. suzanne.obj in the development branch).
 *     // in this case, the texture vertexAttribArray will need to be disabled
 *     // before the call to drawElements
 *     if(!mesh.textures.length){
 *       gl.disableVertexAttribArray(shaderProgram.textureCoordAttribute);
 *     }
 *     else{
 *       // if the texture vertexAttribArray has been previously
 *       // disabled, then it needs to be re-enabled
 *       gl.enableVertexAttribArray(shaderProgram.textureCoordAttribute);
 *       gl.bindBuffer(gl.ARRAY_BUFFER, mesh.textureBuffer);
 *       gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, mesh.textureBuffer.itemSize, gl.FLOAT, false, 0, 0);
 *     }
 *
 *     gl.bindBuffer(gl.ARRAY_BUFFER, mesh.normalBuffer);
 *     gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, mesh.normalBuffer.itemSize, gl.FLOAT, false, 0, 0);
 *
 *     gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.mesh.indexBuffer);
 *     gl.drawElements(gl.TRIANGLES, model.mesh.indexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
 */
exports.downloadMeshes = downloadMeshes;
var initMeshBuffers = function (gl, mesh) {
  // mesh.vertexNormals
  // mesh.textures
  // mesh.vertices
  // mesh.indices
};

/**
 * @description
 * Construct sequence list argument for downloadMeshes.
 * This is adaptation for blender obj animation export.
 * For example:
 *    matrixEngine.objLoader.downloadMeshes(
      matrixEngine.objLoader.makeObjSeqArg(
        {
          id: objName,
          joinMultiPahts: [
            {
              path: "res/bvh-skeletal-base/swat-guy/seq-walk/low/swat",
              id: objName,
              from: 1, to: 34
            },
            {
              path: "res/bvh-skeletal-base/swat-guy/seq-walk-pistol/low/swat-walk-pistol",
              id: objName,
              from: 35, to: 54
            }
          ]
        }),
      onLoadObj
    );
 */
exports.initMeshBuffers = initMeshBuffers;
const makeObjSeqArg = arg => {
  // Adaptation for blender (animation) obj exporter.
  var local = {};
  function localCalc(arg, noInitial = false) {
    var zeros = '00000';
    var l = {};
    var helper = arg.from;
    for (let j = arg.from, z = 1; j <= arg.to; j++) {
      if (z > 9 && z < 99) {
        zeros = '0000';
      } else if (z > 99 && z < 999) {
        zeros = '000';
      } // no need more then 999

      if (helper == arg.from && noInitial === false) {
        l[arg.id] = arg.path + '_' + zeros + z + '.obj';
      } else {
        l[arg.id + (helper - 1)] = arg.path + '_' + zeros + z + '.obj';
      }
      helper++;
      z++;
    }
    return l;
  }
  if (typeof arg.path === 'string') {
    local = localCalc(arg);
  } else if (typeof arg.path === 'undefined') {
    if (typeof arg.joinMultiPahts !== 'undefined') {
      console.log("ITS joinMultiPahts!");
      var localFinal = {};
      arg.joinMultiPahts.forEach((arg, index) => {
        if (index === 0) {
          localFinal = Object.assign(local, localCalc(arg));
        } else {
          localFinal = Object.assign(local, localCalc(arg, true));
        }
      });
      console.log("joinMultiPahts LOCAL => ", localFinal);
      return localFinal;
    }
  }
  return local;
};

/**
 * @description
 * Switching obj seq animations frames range.
 */
exports.makeObjSeqArg = makeObjSeqArg;
function play(nameAni) {
  this.animations.active = nameAni;
  this.currentAni = this.animations[this.animations.active].from;
  this.playing = true;
}

},{}],23:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.loadBVH = exports.animBVH = exports.BVHPlayer = void 0;
var _bvhLoader = _interopRequireDefault(require("bvh-loader"));
var _meshObj = _interopRequireDefault(require("../mesh-obj"));
var _wgpuMatrix = require("wgpu-matrix");
var _webgpuGltf = require("./webgpu-gltf.js");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
// import {degToRad} from "../utils.js";

var animBVH = exports.animBVH = new _bvhLoader.default();
let loadBVH = path => {
  return new Promise((resolve, reject) => {
    animBVH.parse_file(path).then(() => {
      console.info("plot_hierarchy no function");
      animBVH.plot_hierarchy();
      var r = animBVH.frame_pose(0);
      // Not in use at the moment next feature - change skeletal or indipended new class.
      // console.log("FINAL P => ", r[0].length)
      // console.log("FINAL R => ", r[1].length)
      var KEYS = animBVH.joint_names();
      for (var x = 0; x < r[0].length; x++) {
        // console.log("->" + KEYS[x] + "-> position: " + r[0][x] + " rotation: " + r[1][x]);
      }
      var all = animBVH.all_frame_poses();
      // console.log("Final All -> ", all);
      resolve(animBVH);
    }).catch(err => {
      reject(err);
    });
  });
};

/**
 * @description
 * Skinning basic done animation can be changed with animation index.
 * Holder for GLB model with skinning.
 * @param {GLBModel} glb - Your loaded GLB
 * @param {Object} bvhBones - Mapping of boneName → BVH bone data
 * @param {GPUDevice} device - WebGPU device
 * @credits Chatgpt assist here.
 */
exports.loadBVH = loadBVH;
class BVHPlayer extends _meshObj.default {
  constructor(o, bvh, glb, primitiveIndex, skinnedNodeIndex, canvas, device, context, inputHandler, globalAmbient) {
    super(canvas, device, context, o, inputHandler, globalAmbient, glb, primitiveIndex, skinnedNodeIndex);
    // bvh arg not actula at the moment
    this.bvh = {};
    this.glb = glb;
    this.currentFrame = 0;
    this.fps = 30;
    this.timeAccumulator = 0;
    // debug
    this.scaleBoneTest = 1;
    this.primitiveIndex = primitiveIndex;
    if (!this.bvh.sharedState) {
      this.bvh.sharedState = {
        currentFrame: 0,
        timeAccumulator: 0
      };
    }
    this.sharedState = this.bvh.sharedState;
    // Reference to the skinned node containing all bones
    this.skinnedNode = this.glb.skinnedMeshNodes[skinnedNodeIndex];
    // console.log('this.skinnedNode', this.skinnedNode)
    this.nodeWorldMatrices = Array.from({
      length: this.glb.nodes.length
    }, () => _wgpuMatrix.mat4.identity());
    this.startTime = performance.now() / 1000; // seconds - anim speed control
    this.MAX_BONES = 100; // predefined
    this.skeleton = []; // array of joint node indices
    this.animationSpeed = 1000;
    this.inverseBindMatrices = []; // Float32Array for each joint
    this.initInverseBindMatrices();
    this.makeSkeletal();
  }
  makeSkeletal() {
    let skin = this.glb.skins[0];
    const accessorIndex = skin.inverseBindMatrices;
    if (accessorIndex == null) {
      console.warn("No inverseBindMatrices, using identity matrices");
    }
    // 1. Load all inverse bind matrices once
    const invBindArray = this.inverseBindMatrices; // set earlier by initInverseBindMatrices()
    // 2. Build skeleton array from skin.joints only
    this.skeleton = skin.joints.slice(); // direct copy of indices
    // 3. Assign inverseBindMatrix to each joint node correctly
    for (let i = 0; i < skin.joints.length; i++) {
      const jointIndex = skin.joints[i];
      const jointNode = this.glb.nodes[jointIndex];
      // assign only to bone nodes
      jointNode.inverseBindMatrix = invBindArray.slice(i * 16, (i + 1) * 16);
      // decompose node’s transform once (if not already)
      if (!jointNode.transform) {
        jointNode.transform = new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
      }
      if (!jointNode.translation || !jointNode.rotation || !jointNode.scale) {
        const {
          translation,
          rotation,
          scale
        } = this.decomposeMatrix(jointNode.transform);
        jointNode.translation = translation;
        jointNode.rotation = rotation;
        jointNode.scale = scale;
      }
    }
    // 4. For mesh nodes or armature parent nodes, leave them alone
    // what is animation , check is it more - we look for Armature by defoult 
    // frendly blender
    this.glb.animationIndex = 0;
    for (let j = 0; j < this.glb.glbJsonData.animations.length; j++) {
      if (this.glb.glbJsonData.animations[j].name.indexOf('Armature') !== -1) {
        this.glb.animationIndex = j;
      }
    }
  }
  initInverseBindMatrices(skinIndex = 0) {
    const skin = this.glb.skins[skinIndex];
    const invBindAccessorIndex = skin.inverseBindMatrices; // usually a number
    if (invBindAccessorIndex === undefined || invBindAccessorIndex === null) {
      console.warn('No inverseBindMatrices accessor for skin', skinIndex);
      return;
    }
    const invBindArray = this.getAccessorArray(this.glb, invBindAccessorIndex);
    // ✅ store directly as typed array (one big contiguous Float32Array)
    this.inverseBindMatrices = invBindArray;
    console.log('Inverse bind matrices loaded:', this.inverseBindMatrices.length, 'bones');
  }
  getNumberOfAnimation() {
    let anim = this.glb.glbJsonData.animations[this.glb.animationIndex];
    const sampler = anim.samplers[0];
    const inputAccessor = this.glb.glbJsonData.accessors[sampler.input];
    const numFrames = inputAccessor.count;
    return numFrames;
  }
  update(deltaTime) {
    const frameTime = 1 / this.fps;
    this.sharedState.timeAccumulator += deltaTime;
    while (this.sharedState.timeAccumulator >= frameTime) {
      this.sharedState.currentFrame = (this.sharedState.currentFrame + 1) % this.getNumberOfAnimation();
      this.sharedState.timeAccumulator -= frameTime;
    }
    // const frame = this.sharedState.currentFrame;
    const currentTime = performance.now() / this.animationSpeed - this.startTime;
    const boneMatrices = new Float32Array(this.MAX_BONES * 16);
    if (this.glb.glbJsonData.animations && this.glb.glbJsonData.animations.length > 0) {
      this.updateSingleBoneCubeAnimation(this.glb.glbJsonData.animations[this.glb.animationIndex], this.glb.nodes, currentTime, boneMatrices);
    }
  }
  getAccessorArray(glb, accessorIndex) {
    const accessor = glb.glbJsonData.accessors[accessorIndex];
    const bufferView = glb.glbJsonData.bufferViews[accessor.bufferView];
    const byteOffset = (bufferView.byteOffset || 0) + (accessor.byteOffset || 0);
    const byteLength = accessor.count * this.getNumComponents(accessor.type) * (accessor.componentType === 5126 ? 4 : 2); // adjust per type
    const bufferDef = glb.glbBinaryBuffer;
    // ✅ now just slice:
    const slice = this.getBufferSlice(bufferDef, byteOffset, byteLength);
    switch (accessor.componentType) {
      case 5126:
        // FLOAT
        return new Float32Array(slice);
      case 5123:
        // UNSIGNED_SHORT
        return new Uint16Array(slice);
      case 5121:
        // UNSIGNED_BYTE
        return new Uint8Array(slice);
      default:
        throw new Error("Unsupported componentType: " + accessor.componentType);
    }
  }
  getAccessorTypeForChannel(path) {
    switch (path) {
      case "translation":
        return "VEC3";
      case "rotation":
        return "VEC4";
      case "scale":
        return "VEC3";
      case "weights":
        return "VECN";
      // if needed
      default:
        throw new Error("Unknown channel path: " + path);
    }
  }
  getNumComponents(type) {
    switch (type) {
      case "SCALAR":
        return 1;
      case "VEC2":
        return 2;
      case "VEC3":
        return 3;
      case "VEC4":
        return 4;
      case "MAT4":
        return 16;
      default:
        throw new Error("Unknown type: " + type);
    }
  }
  getComponentSize(componentType) {
    switch (componentType) {
      case 5126:
        return 4;
      // float32
      case 5123:
        return 2;
      // uint16
      case 5121:
        return 1;
      // uint8
      default:
        throw new Error("Unknown componentType: " + componentType);
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
    if (bufferDef instanceof _webgpuGltf.GLTFBuffer) {
      // Use .arrayBuffer + .byteOffset:
      return bufferDef.arrayBuffer.slice(bufferDef.byteOffset + (byteOffset || 0), bufferDef.byteOffset + (byteOffset || 0) + byteLength);
    }

    // Already have a raw ArrayBuffer:
    if (bufferDef instanceof ArrayBuffer) {
      return bufferDef.slice(byteOffset, byteOffset + byteLength);
    }

    // Some loaders store it as .data or ._data:
    if (bufferDef && bufferDef.data instanceof ArrayBuffer) {
      return bufferDef.data.slice(byteOffset, byteOffset + byteLength);
    }
    if (bufferDef && bufferDef._data instanceof ArrayBuffer) {
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
    if (dot < 0) {
      b = b.map(v => -v);
      dot = -dot;
    }
    if (dot > 0.9995) return lerpVec(a, b, t);
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
    const xx = x * x,
      yy = y * y,
      zz = z * z;
    const xy = x * y,
      xz = x * z,
      yz = y * z,
      wx = w * x,
      wy = w * y,
      wz = w * z;
    return new Float32Array([1 - 2 * (yy + zz), 2 * (xy + wz), 2 * (xz - wy), 0, 2 * (xy - wz), 1 - 2 * (xx + zz), 2 * (yz + wx), 0, 2 * (xz + wy), 2 * (yz - wx), 1 - 2 * (xx + yy), 0, 0, 0, 0, 1]);
  }

  // Compose TRS to a 4×4
  composeMatrix(translation, rotationQuat, scale) {
    const m = _wgpuMatrix.mat4.identity();
    _wgpuMatrix.mat4.translate(m, translation, m);
    const rot = _wgpuMatrix.mat4.fromQuat(rotationQuat);
    _wgpuMatrix.mat4.multiply(m, rot, m);
    _wgpuMatrix.mat4.scale(m, scale, m);
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
    let sx = len(cx),
      sy = len(cy),
      sz = len(cz);

    // If any scale nearly zero, avoid divide-by-zero
    if (sx === 0) sx = 1.0;
    if (sy === 0) sy = 1.0;
    if (sz === 0) sz = 1.0;

    // Normalize columns to produce a pure rotation matrix
    const r00 = m[0] / sx,
      r01 = m[4] / sy,
      r02 = m[8] / sz;
    const r10 = m[1] / sx,
      r11 = m[5] / sy,
      r12 = m[9] / sz;
    const r20 = m[2] / sx,
      r21 = m[6] / sy,
      r22 = m[10] / sz;

    // Fix negative-scale (reflection) case: if determinant < 0, flip sign of one scale and corresponding column
    const det3 = r00 * (r11 * r22 - r12 * r21) - r01 * (r10 * r22 - r12 * r20) + r02 * (r10 * r21 - r11 * r20);
    if (det3 < 0) {
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
    if (trace > 0.00001) {
      const s = Math.sqrt(trace + 1.0) * 2; // s=4*qw
      qw = 0.25 * s;
      qx = (r21 - r12) / s;
      qy = (r02 - r20) / s;
      qz = (r10 - r01) / s;
    } else if (r00 > r11 && r00 > r22) {
      const s = Math.sqrt(1.0 + r00 - r11 - r22) * 2; // s=4*qx
      qw = (r21 - r12) / s;
      qx = 0.25 * s;
      qy = (r01 + r10) / s;
      qz = (r02 + r20) / s;
    } else if (r11 > r22) {
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
    return {
      translation: t,
      rotation: rot,
      scale: scale
    };
  }
  slerp(q0, q1, t, out) {
    let dot = q0[0] * q1[0] + q0[1] * q1[1] + q0[2] * q1[2] + q0[3] * q1[3];
    if (dot < 0) {
      dot = -dot;
      q1 = [-q1[0], -q1[1], -q1[2], -q1[3]];
    }
    if (dot > 0.9995) {
      // linear
      for (let i = 0; i < 4; i++) out[i] = q0[i] + t * (q1[i] - q0[i]);
      // normalize
      const len = Math.hypot(...out);
      for (let i = 0; i < 4; i++) out[i] /= len;
      return;
    }
    const theta0 = Math.acos(dot);
    const theta = theta0 * t;
    const sinTheta = Math.sin(theta);
    const sinTheta0 = Math.sin(theta0);
    const s0 = Math.cos(theta) - dot * sinTheta / sinTheta0;
    const s1 = sinTheta / sinTheta0;
    for (let i = 0; i < 4; i++) {
      out[i] = s0 * q0[i] + s1 * q1[i];
    }
  }
  updateSingleBoneCubeAnimation(glbAnimation, nodes, time, boneMatrices) {
    const channels = glbAnimation.channels;
    const samplers = glbAnimation.samplers;
    // --- Map channels per node for faster lookup
    const nodeChannels = new Map();
    for (const channel of channels) {
      if (!nodeChannels.has(channel.target.node)) nodeChannels.set(channel.target.node, []);
      nodeChannels.get(channel.target.node).push(channel);
    }
    for (let j = 0; j < this.skeleton.length; j++) {
      const nodeIndex = this.skeleton[j];
      const node = nodes[nodeIndex];

      // --- Initialize node TRS if needed
      if (!node.translation) node.translation = new Float32Array([0, 0, 0]);
      if (!node.rotation) node.rotation = _wgpuMatrix.quat.create();
      if (!node.scale) node.scale = new Float32Array([1, 1, 1]);

      // --- Keep original TRS for additive animation
      if (!node.originalTranslation) node.originalTranslation = node.translation.slice();
      if (!node.originalRotation) node.originalRotation = node.rotation.slice();
      if (!node.originalScale) node.originalScale = node.scale.slice();
      const channelsForNode = nodeChannels.get(nodeIndex) || [];
      for (const channel of channelsForNode) {
        const path = channel.target.path; // "translation" | "rotation" | "scale"
        const sampler = samplers[channel.sampler];
        // --- Get input/output arrays
        const inputTimes = this.getAccessorArray(this.glb, sampler.input);
        const outputArray = this.getAccessorArray(this.glb, sampler.output);
        const numComponents = path === "rotation" ? 4 : 3;
        // --- Find keyframe interval
        const animTime = time % inputTimes[inputTimes.length - 1];
        let i = 0;
        while (i < inputTimes.length - 1 && inputTimes[i + 1] <= animTime) i++;
        const t0 = inputTimes[i];
        const t1 = inputTimes[Math.min(i + 1, inputTimes.length - 1)];
        const factor = t1 !== t0 ? (animTime - t0) / (t1 - t0) : 0;
        // --- Interpolated keyframe values
        const v0 = outputArray.subarray(i * numComponents, (i + 1) * numComponents);
        const v1 = outputArray.subarray(Math.min(i + 1, inputTimes.length - 1) * numComponents, Math.min(i + 2, inputTimes.length) * numComponents);
        // --- Apply animation
        if (path === "translation") {
          for (let k = 0; k < 3; k++) node.translation[k] = v0[k] * (1 - factor) + v1[k] * factor;
        } else if (path === "scale") {
          for (let k = 0; k < 3; k++) node.scale[k] = v0[k] * (1 - factor) + v1[k] * factor;
        } else if (path === "rotation") {
          this.slerp(v0, v1, factor, node.rotation);
        }
      }
      // --- Recompose local transform
      node.transform = this.composeMatrix(node.translation, node.rotation, node.scale);
    }
    const computeWorld = nodeIndex => {
      const node = nodes[nodeIndex];
      if (!node.worldMatrix) node.worldMatrix = _wgpuMatrix.mat4.create();
      let parentWorld = node.parent !== null ? nodes[node.parent].worldMatrix : null;
      if (parentWorld) {
        // multiply parent * local
        _wgpuMatrix.mat4.multiply(parentWorld, node.transform, node.worldMatrix);
      } else {
        _wgpuMatrix.mat4.copy(node.transform, node.worldMatrix);
      }

      // maybe no need to exist...
      _wgpuMatrix.mat4.scale(node.worldMatrix, [this.scaleBoneTest, this.scaleBoneTest, this.scaleBoneTest], node.worldMatrix);
      if (node.children) {
        for (const childIndex of node.children) computeWorld(childIndex);
      }
    };
    for (let i = 0; i < nodes.length; i++) {
      if (nodes[i].parent === null || nodes[i].parent === undefined) {
        computeWorld(i);
      }
    }
    for (let j = 0; j < this.skeleton.length; j++) {
      const jointNode = nodes[this.skeleton[j]];
      const finalMat = _wgpuMatrix.mat4.create();
      _wgpuMatrix.mat4.multiply(jointNode.worldMatrix, jointNode.inverseBindMatrix, finalMat);
      boneMatrices.set(finalMat, j * 16);
    }
    // --- Upload to GPU
    this.device.queue.writeBuffer(this.bonesBuffer, 0, boneMatrices);
    return boneMatrices;
  }
}
exports.BVHPlayer = BVHPlayer;

},{"../mesh-obj":27,"./webgpu-gltf.js":24,"bvh-loader":2,"wgpu-matrix":16}],24:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.GLTFTexture = exports.GLTFSampler = exports.GLTFPrimitive = exports.GLTFNode = exports.GLTFMesh = exports.GLTFMaterial = exports.GLTFBufferView = exports.GLTFBuffer = exports.GLTFAccessor = exports.GLBModel = void 0;
exports.uploadGLBModel = uploadGLBModel;
var _glMatrix = require("gl-matrix");
/**
 * @author Nikola Lukic zlatnaspirala
 * @description
 * Importer is adapted for matrix-engine-wgpu.
 * Improved - Fix children empty array.
 * Access to json raw data.
 * @source
 * https://github.com/Twinklebear/webgpu-gltf/blob/main/src/glb_import.js
 */

const GLTFRenderMode = {
  POINTS: 0,
  LINE: 1,
  LINE_LOOP: 2,
  LINE_STRIP: 3,
  TRIANGLES: 4,
  TRIANGLE_STRIP: 5,
  // Note: fans are not supported in WebGPU, use should be
  // an error or converted into a list/strip
  TRIANGLE_FAN: 6
};
const GLTFComponentType = {
  BYTE: 5120,
  UNSIGNED_BYTE: 5121,
  SHORT: 5122,
  UNSIGNED_SHORT: 5123,
  INT: 5124,
  UNSIGNED_INT: 5125,
  FLOAT: 5126,
  DOUBLE: 5130
};
const GLTFTextureFilter = {
  NEAREST: 9728,
  LINEAR: 9729,
  NEAREST_MIPMAP_NEAREST: 9984,
  LINEAR_MIPMAP_NEAREST: 9985,
  NEAREST_MIPMAP_LINEAR: 9986,
  LINEAR_MIPMAP_LINEAR: 9987
};
const GLTFTextureWrap = {
  REPEAT: 10497,
  CLAMP_TO_EDGE: 33071,
  MIRRORED_REPEAT: 33648
};
function alignTo(val, align) {
  return Math.floor((val + align - 1) / align) * align;
}
function gltfTypeNumComponents(type) {
  switch (type) {
    case 'SCALAR':
      return 1;
    case 'VEC2':
      return 2;
    case 'VEC3':
      return 3;
    case 'VEC4':
      return 4;
    default:
      alert('Unhandled glTF Type ' + type);
      return null;
  }
}
function gltfTypeSize(componentType, type) {
  var typeSize = 0;
  switch (componentType) {
    case GLTFComponentType.BYTE:
      typeSize = 1;
      break;
    case GLTFComponentType.UNSIGNED_BYTE:
      typeSize = 1;
      break;
    case GLTFComponentType.SHORT:
      typeSize = 2;
      break;
    case GLTFComponentType.UNSIGNED_SHORT:
      typeSize = 2;
      break;
    case GLTFComponentType.INT:
      typeSize = 4;
      break;
    case GLTFComponentType.UNSIGNED_INT:
      typeSize = 4;
      break;
    case GLTFComponentType.FLOAT:
      typeSize = 4;
      break;
    case GLTFComponentType.DOUBLE:
      typeSize = 4;
      break;
    default:
      alert('Unrecognized GLTF Component Type?');
  }
  return gltfTypeNumComponents(type) * typeSize;
}
class GLTFBuffer {
  constructor(buffer, size, offset) {
    this.arrayBuffer = buffer;
    this.size = size;
    this.byteOffset = offset;
  }
}
exports.GLTFBuffer = GLTFBuffer;
class GLTFBufferView {
  constructor(buffer, view) {
    this.length = view['byteLength'];
    this.byteOffset = buffer.byteOffset;
    if (view['byteOffset'] !== undefined) {
      this.byteOffset += view['byteOffset'];
    }
    this.byteStride = 0;
    if (view['byteStride'] !== undefined) {
      this.byteStride = view['byteStride'];
    }
    this.buffer = new Uint8Array(buffer.arrayBuffer, this.byteOffset, this.length);
    this.needsUpload = false;
    this.gpuBuffer = null;
    this.usage = 0;
  }
  addUsage(usage) {
    this.usage = this.usage | usage;
  }
  upload(device) {
    // Note: must align to 4 byte size when mapped at creation is true
    var buf = device.createBuffer({
      size: alignTo(this.buffer.byteLength, 4),
      usage: this.usage,
      mappedAtCreation: true
    });
    new this.buffer.constructor(buf.getMappedRange()).set(this.buffer);
    buf.unmap();
    this.gpuBuffer = buf;
    this.needsUpload = false;
  }
}
exports.GLTFBufferView = GLTFBufferView;
class GLTFAccessor {
  constructor(view, accessor) {
    this.count = accessor['count'];
    this.componentType = accessor['componentType'];
    this.gltfType = accessor['type'];
    this.numComponents = gltfTypeNumComponents(accessor['type']);
    this.numScalars = this.count * this.numComponents;
    this.view = view;
    this.byteOffset = 0;
    if (accessor['byteOffset'] !== undefined) {
      this.byteOffset = accessor['byteOffset'];
    }
  }
  get byteStride() {
    var elementSize = gltfTypeSize(this.componentType, this.gltfType);
    return Math.max(elementSize, this.view.byteStride);
  }
}
exports.GLTFAccessor = GLTFAccessor;
class GLTFPrimitive {
  constructor(indices, positions, normals, texcoords, material, topology, weights, joints) {
    this.indices = indices;
    this.positions = positions;
    this.normals = normals;
    this.texcoords = texcoords;
    this.material = material;
    this.topology = topology;
    this.weights = weights;
    this.joints = joints;
  }
}
exports.GLTFPrimitive = GLTFPrimitive;
class GLTFMesh {
  constructor(name, primitives) {
    this.name = name;
    this.primitives = primitives;
  }
}
exports.GLTFMesh = GLTFMesh;
class GLTFNode {
  constructor(name, mesh, transform, n) {
    this.name = name;
    this.mesh = mesh;
    this.transform = transform;
    this.gpuUniforms = null;
    this.bindGroup = null;
    this.children = n.children || [];
  }
  upload(device) {
    var buf = device.createBuffer({
      size: 4 * 4 * 4,
      usage: GPUBufferUsage.UNIFORM,
      mappedAtCreation: true
    });
    new Float32Array(buf.getMappedRange()).set(this.transform);
    buf.unmap();
    this.gpuUniforms = buf;
  }
}
exports.GLTFNode = GLTFNode;
function readNodeTransform(node) {
  if (node['matrix']) {
    var m = node['matrix'];
    // Both glTF and gl matrix are column major
    return _glMatrix.mat4.fromValues(m[0], m[1], m[2], m[3], m[4], m[5], m[6], m[7], m[8], m[9], m[10], m[11], m[12], m[13], m[14], m[15]);
  } else {
    var scale = [1, 1, 1];
    var rotation = [0, 0, 0, 1];
    var translation = [0, 0, 0];
    if (node['scale']) {
      scale = node['scale'];
    }
    if (node['rotation']) {
      rotation = node['rotation'];
    }
    if (node['translation']) {
      translation = node['translation'];
    }
    var m = _glMatrix.mat4.create();
    return _glMatrix.mat4.fromRotationTranslationScale(m, rotation, translation, scale);
  }
}

// function flattenGLTFChildren(nodes, node, parent_transform) {
//   var tfm = readNodeTransform(node);
//   var tfm = mat4.mul(tfm, parent_transform, tfm);
//   node['matrix'] = tfm;
//   node['scale'] = undefined;
//   node['rotation'] = undefined;
//   node['translation'] = undefined;
//   if(node['children']) {
//     for(var i = 0;i < node['children'].length;++i) {
//       flattenGLTFChildren(nodes, nodes[node['children'][i]], tfm);
//     }
//     node['children'] = [];
//   }
// }

function flattenGLTFChildren(nodes, node, parent_transform) {
  var tfm = readNodeTransform(node);
  var tfm = _glMatrix.mat4.mul(tfm, parent_transform, tfm);
  node['matrix'] = tfm;
  node['scale'] = undefined;
  node['rotation'] = undefined;
  node['translation'] = undefined;
  if (node['children']) {
    for (var i = 0; i < node['children'].length; ++i) {
      flattenGLTFChildren(nodes, nodes[node['children'][i]], tfm);
    }
    // node['children'] = []; // REMOVE THIS LINE
  }
}
function makeGLTFSingleLevel(nodes) {
  var rootTfm = _glMatrix.mat4.create();
  for (var i = 0; i < nodes.length; ++i) {
    flattenGLTFChildren(nodes, nodes[i], rootTfm);
  }
  return nodes;
}
class GLTFMaterial {
  constructor(material, textures) {
    this.baseColorFactor = [1, 1, 1, 1];
    this.baseColorTexture = null;
    // padded to float4
    this.emissiveFactor = [0, 0, 0, 1];
    this.metallicFactor = 1.0;
    this.roughnessFactor = 1.0;
    if (material['pbrMetallicRoughness'] !== undefined) {
      var pbr = material['pbrMetallicRoughness'];
      if (pbr['baseColorFactor'] !== undefined) {
        this.baseColorFactor = pbr['baseColorFactor'];
      }
      if (pbr['baseColorTexture'] !== undefined) {
        // TODO multiple texcoords
        this.baseColorTexture = textures[pbr['baseColorTexture']['index']];
      }
      if (pbr['metallicFactor'] !== undefined) {
        this.metallicFactor = pbr['metallicFactor'];
      }
      if (pbr['roughnessFactor'] !== undefined) {
        this.roughnessFactor = pbr['roughnessFactor'];
      }
    }
    if (material['emissiveFactor'] !== undefined) {
      this.emissiveFactor[0] = material['emissiveFactor'][0];
      this.emissiveFactor[1] = material['emissiveFactor'][1];
      this.emissiveFactor[2] = material['emissiveFactor'][2];
    }
    this.gpuBuffer = null;
    this.bindGroupLayout = null;
    this.bindGroup = null;
  }
  upload(device) {
    var buf = device.createBuffer({
      size: 3 * 4 * 4,
      usage: GPUBufferUsage.UNIFORM,
      mappedAtCreation: true
    });
    var mappingView = new Float32Array(buf.getMappedRange());
    mappingView.set(this.baseColorFactor);
    mappingView.set(this.emissiveFactor, 4);
    mappingView.set([this.metallicFactor, this.roughnessFactor], 8);
    buf.unmap();
    this.gpuBuffer = buf;
    var layoutEntries = [{
      binding: 0,
      visibility: GPUShaderStage.FRAGMENT,
      buffer: {
        type: 'uniform'
      }
    }];
    var bindGroupEntries = [{
      binding: 0,
      resource: {
        buffer: this.gpuBuffer
      }
    }];
    if (this.baseColorTexture) {
      // Defaults for sampler and texture are fine, just make the objects
      // exist to pick them up
      layoutEntries.push({
        binding: 1,
        visibility: GPUShaderStage.FRAGMENT,
        sampler: {}
      });
      layoutEntries.push({
        binding: 2,
        visibility: GPUShaderStage.FRAGMENT,
        texture: {}
      });
      bindGroupEntries.push({
        binding: 1,
        resource: this.baseColorTexture.sampler
      });
      bindGroupEntries.push({
        binding: 2,
        resource: this.baseColorTexture.imageView
      });
    }
    this.bindGroupLayout = device.createBindGroupLayout({
      entries: layoutEntries
    });
    this.bindGroup = device.createBindGroup({
      layout: this.bindGroupLayout,
      entries: bindGroupEntries
    });
  }
}
exports.GLTFMaterial = GLTFMaterial;
class GLTFSampler {
  constructor(sampler, device) {
    var magFilter = sampler['magFilter'] === undefined || sampler['magFilter'] == GLTFTextureFilter.LINEAR ? 'linear' : 'nearest';
    var minFilter = sampler['minFilter'] === undefined || sampler['minFilter'] == GLTFTextureFilter.LINEAR ? 'linear' : 'nearest';
    var wrapS = 'repeat';
    if (sampler['wrapS'] !== undefined) {
      if (sampler['wrapS'] == GLTFTextureFilter.REPEAT) {
        wrapS = 'repeat';
      } else if (sampler['wrapS'] == GLTFTextureFilter.CLAMP_TO_EDGE) {
        wrapS = 'clamp-to-edge';
      } else {
        wrapS = 'mirror-repeat';
      }
    }
    var wrapT = 'repeat';
    if (sampler['wrapT'] !== undefined) {
      if (sampler['wrapT'] == GLTFTextureFilter.REPEAT) {
        wrapT = 'repeat';
      } else if (sampler['wrapT'] == GLTFTextureFilter.CLAMP_TO_EDGE) {
        wrapT = 'clamp-to-edge';
      } else {
        wrapT = 'mirror-repeat';
      }
    }
    this.sampler = device.createSampler({
      magFilter: magFilter,
      minFilter: minFilter,
      addressModeU: wrapS,
      addressModeV: wrapT
    });
  }
}
exports.GLTFSampler = GLTFSampler;
class GLTFTexture {
  constructor(sampler, image) {
    this.gltfsampler = sampler;
    this.sampler = sampler.sampler;
    this.image = image;
    this.imageView = image.createView();
  }
}
exports.GLTFTexture = GLTFTexture;
class GLBModel {
  constructor(nodes, skins, skinnedMeshNodes, glbJsonData, glbBinaryBuffer) {
    this.nodes = nodes;
    this.skins = skins;
    this.skinnedMeshNodes = skinnedMeshNodes;
    this.bvhToGLBMap = null;
    this.glbJsonData = glbJsonData;
    this.glbBinaryBuffer = glbBinaryBuffer;
  }
}
exports.GLBModel = GLBModel;
;

// function getComponentSize(componentType) {
//   switch(componentType) {
//     case 5126: return 4; // float32
//     case 5123: return 2; // uint16
//     case 5121: return 1; // uint8
//     default: throw new Error("Unknown componentType: " + componentType);
//   }
// }

// Upload a GLB model and return it
async function uploadGLBModel(buffer, device) {
  // 1️⃣ Validate header
  const header = new Uint32Array(buffer, 0, 5);
  if (header[0] !== 0x46546C67) {
    alert('This does not appear to be a glb file?');
    return;
  }

  // 2️⃣ JSON chunk
  const glbJsonData = JSON.parse(new TextDecoder('utf-8').decode(new Uint8Array(buffer, 20, header[3])));

  // 3️⃣ Binary chunk header + buffer
  const binaryHeader = new Uint32Array(buffer, 20 + header[3], 2);
  const glbBuffer = new GLTFBuffer(buffer, binaryHeader[0], 28 + header[3]);

  // 4️⃣ BufferViews
  const bufferViews = glbJsonData.bufferViews.map(v => new GLTFBufferView(glbBuffer, v));
  const binaryOffset = 28 + header[3];
  const binaryLength = binaryHeader[0];

  // ✅ raw ArrayBuffer slice of the binary chunk:
  const glbBinaryBuffer = buffer.slice(binaryOffset, binaryOffset + binaryLength);

  // 5️⃣ Load images
  const images = [];
  if (glbJsonData.images) {
    for (const imgJson of glbJsonData.images) {
      const view = new GLTFBufferView(glbBuffer, glbJsonData.bufferViews[imgJson.bufferView]);
      const blob = new Blob([view.buffer], {
        type: imgJson['mime/type']
      });
      const img = await createImageBitmap(blob);
      const gpuImg = device.createTexture({
        size: [img.width, img.height, 1],
        format: 'rgba8unorm-srgb',
        usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT
      });
      device.queue.copyExternalImageToTexture({
        source: img
      }, {
        texture: gpuImg
      }, [img.width, img.height, 1]);
      images.push(gpuImg);
    }
  }

  // 6️⃣ Samplers, Textures, Materials
  const defaultSampler = new GLTFSampler({}, device);
  const samplers = (glbJsonData.samplers || []).map(s => new GLTFSampler(s, device));
  const textures = (glbJsonData.textures || []).map(tex => {
    const sampler = tex.sampler !== undefined ? samplers[tex.sampler] : defaultSampler;
    return new GLTFTexture(sampler, images[tex.source]);
  });
  const defaultMaterial = new GLTFMaterial({});
  const materials = (glbJsonData.materials || []).map(m => new GLTFMaterial(m, textures));

  // 7️⃣ Meshes
  const meshes = (glbJsonData.meshes || []).map(mesh => {
    const primitives = mesh.primitives.map(prim => {
      const topology = prim.mode ?? GLTFRenderMode.TRIANGLES;

      // Indices
      let indices = null;
      if (prim.indices !== undefined) {
        const accessor = glbJsonData.accessors[prim.indices];
        const viewID = accessor.bufferView;
        bufferViews[viewID].needsUpload = true;
        bufferViews[viewID].addUsage(GPUBufferUsage.INDEX);
        indices = new GLTFAccessor(bufferViews[viewID], accessor);
      }
      // Vertex attributes
      let positions = null,
        normals = null,
        texcoords = [];
      let weights = null;
      let joints = null;
      for (const attr in prim.attributes) {
        const accessor = glbJsonData.accessors[prim.attributes[attr]];
        const viewID = accessor.bufferView;
        bufferViews[viewID].needsUpload = true;
        bufferViews[viewID].addUsage(GPUBufferUsage.VERTEX);
        if (attr === 'POSITION') {
          positions = new GLTFAccessor(bufferViews[viewID], accessor);
        } else if (attr === 'NORMAL') {
          normals = new GLTFAccessor(bufferViews[viewID], accessor);
        } else if (attr.startsWith('TEXCOORD')) {
          texcoords.push(new GLTFAccessor(bufferViews[viewID], accessor));
        } else if (attr === 'WEIGHTS_0') {
          weights = new GLTFAccessor(bufferViews[viewID], accessor);
        } else if (attr.startsWith('JOINTS')) {
          joints = new GLTFAccessor(bufferViews[viewID], accessor);
        } else {
          console.log('inknow ', attr);
        }
      }
      const material = prim.material !== undefined ? materials[prim.material] : defaultMaterial;
      return new GLTFPrimitive(indices, positions, normals, texcoords, material, topology, weights, joints);
    });
    return new GLTFMesh(mesh.name, primitives);
  });

  // Upload buffers & materials
  for (const bv of bufferViews) if (bv.needsUpload) bv.upload(device);
  defaultMaterial.upload(device);
  for (const m of materials) m.upload(device);
  // 8️⃣ Skins (we only store the index of inverseBindMatrices here)
  const skins = (glbJsonData.skins || []).map(skin => ({
    name: skin.name,
    joints: skin.joints,
    inverseBindMatrices: skin.inverseBindMatrices // accessor index
  }));
  // 9️⃣ Nodes
  const nodes = [];
  const gltfNodes = makeGLTFSingleLevel(glbJsonData.nodes);
  for (let i = 0; i < gltfNodes.length; i++) {
    const n = gltfNodes[i];
    const meshObj = n.mesh !== undefined ? meshes[n.mesh] : null;
    const node = new GLTFNode(n.name, meshObj, readNodeTransform(n), n);
    if (n.skin !== undefined) node.skin = n.skin; // skin index
    node.upload(device);
    nodes.push(node);
  }

  // 🟩 Build parent references:
  for (let i = 0; i < gltfNodes.length; i++) {
    const srcNode = gltfNodes[i];
    // srcNode.children is an array of indices
    if (srcNode.children) {
      for (const childIndex of srcNode.children) {
        nodes[childIndex].parent = i; // add .parent to the child node
      }
    }
  }
  // Ensure nodes without parent are root nodes
  for (const node of nodes) {
    if (node.parent === undefined) node.parent = null;
  }
  const skinnedMeshNodes = nodes.filter(n => n.mesh && n.skin !== undefined);
  if (skinnedMeshNodes.length === 0) {
    console.warn('No skins found — mesh not bound to skeleton');
  } else {
    skinnedMeshNodes.forEach(n => {
      console.log('Mesh', n.mesh.name, 'uses skin index', n.skin);
      // Per-mesh uniform buffer (example)
      n.sceneUniformBuffer = device.createBuffer({
        size: 44 * 4,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
      });
    });
  }
  let R = new GLBModel(nodes, skins, skinnedMeshNodes, glbJsonData, glbBinaryBuffer);
  return R;
}

},{"gl-matrix":5}],25:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
/**
 * @description
 * Created for matrix-engine-wgpu project.
 * MeshObj class estends Materials.
 * @author Nikola Lukic
 * @email zlatnaspirala@gmail.com
 */

class Materials {
  constructor(device) {
    this.device = device;
    this.isVideo = false;
    this.videoIsReady = 'NONE';
    this.compareSampler = this.device.createSampler({
      compare: 'less-equal',
      // safer for shadow comparison
      addressModeU: 'clamp-to-edge',
      // prevents UV leaking outside
      addressModeV: 'clamp-to-edge',
      magFilter: 'linear',
      // smooth PCF
      minFilter: 'linear'
    });
    // For image textures (standard sampler)
    this.imageSampler = this.device.createSampler({
      magFilter: 'linear',
      minFilter: 'linear'
    });
    // For external video textures (needs to be filtering sampler too!)
    this.videoSampler = this.device.createSampler({
      magFilter: 'linear',
      minFilter: 'linear'
    });
    // FX effect
    this.postFXModeBuffer = this.device.createBuffer({
      size: 4,
      // u32 = 4 bytes
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });
    // Dymmy buffer
    this.dummySpotlightUniformBuffer = this.device.createBuffer({
      size: 80,
      // Must match size in shader
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });
    this.device.queue.writeBuffer(this.dummySpotlightUniformBuffer, 0, new Float32Array(16));
  }
  updatePostFXMode(mode) {
    const arrayBuffer = new Uint32Array([mode]);
    this.device.queue.writeBuffer(this.postFXModeBuffer, 0, arrayBuffer);
  }
  async loadTex0(texturesPaths) {
    this.sampler = this.device.createSampler({
      magFilter: 'linear',
      minFilter: 'linear'
    });
    return new Promise(async resolve => {
      const response = await fetch(texturesPaths[0]);
      const imageBitmap = await createImageBitmap(await response.blob());
      this.texture0 = this.device.createTexture({
        size: [imageBitmap.width, imageBitmap.height, 1],
        // REMOVED 1
        format: 'rgba8unorm',
        usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT
      });
      this.device.queue.copyExternalImageToTexture({
        source: imageBitmap
      }, {
        texture: this.texture0
      }, [imageBitmap.width, imageBitmap.height]);
      resolve();
    });
  }
  async loadVideoTexture(arg) {
    this.videoIsReady = 'MAYBE';
    if (arg.type === 'video') {
      this.video = document.createElement('video');
      this.video.src = arg.src || 'res/videos/tunel.mp4';
      this.video.crossOrigin = 'anonymous';
      this.video.autoplay = true;
      this.video.loop = true;
      document.body.append(this.video);
      this.video.style.display = 'none';
      this.video.style.position = 'absolute';
      this.video.style.top = '750px';
      this.video.style.left = '50px';
      await this.video.play();
      this.isVideo = true;
    } else if (arg.type === 'videoElement') {
      this.video = arg.el;
      await this.video.play();
    } else if (arg.type === 'camera') {
      this.video = document.createElement('video');
      this.video.autoplay = true;
      this.video.muted = true;
      this.video.playsInline = true;
      this.video.style.display = 'none';
      document.body.append(this.video);
      try {
        const stream = await navigator.mediaDevices?.getUserMedia?.({
          video: {
            width: {
              ideal: 1280
            },
            height: {
              ideal: 720
            }
          },
          audio: false
        });
        this.video.srcObject = stream;
        await this.video.play();
        this.isVideo = true;
      } catch (err) {
        console.error("❌ Failed to access camera:", err);
        return;
      }
    } else if (arg.type === 'canvas2d') {
      // Existing canvas (arg.el) — assume it's actively drawing
      this.video = document.createElement('video');
      this.video.autoplay = true;
      this.video.muted = true;
      this.video.playsInline = true;
      this.video.style.display = 'none';
      document.body.append(this.video);
      const stream = arg.el.captureStream?.() || arg.el.mozCaptureStream?.();
      if (!stream) {
        console.error('❌ Cannot capture stream from canvas2d');
        return;
      }
      this.video.srcObject = stream;
      await this.video.play();
      this.isVideo = true;
    } else if (arg.type === 'canvas2d-inline') {
      // Miniature inline-drawn canvas created dynamically
      const canvas = document.createElement('canvas');
      canvas.width = arg.width || 256;
      canvas.height = arg.height || 256;
      const ctx = canvas.getContext('2d');
      if (typeof arg.canvaInlineProgram === 'function') {
        // Start drawing loop
        const drawLoop = () => {
          arg.canvaInlineProgram(ctx, canvas);
          requestAnimationFrame(drawLoop);
        };
        drawLoop();
      }
      this.video = document.createElement('video');
      this.video.autoplay = true;
      this.video.muted = true;
      this.video.playsInline = true;
      this.video.style.display = 'none';
      document.body.append(this.video);
      this.isVideo = true;
      const stream = canvas.captureStream?.() || canvas.mozCaptureStream?.();
      if (!stream) {
        console.error('❌ Cannot capture stream from inline canvas');
        return;
      }
      this.video.srcObject = stream;
      await this.video.play();
    }
    this.sampler = this.device.createSampler({
      magFilter: 'linear',
      minFilter: 'linear'
    });
    // ✅ Now - maybe noT
    this.createLayoutForRender();
  }
  updateVideoTexture() {
    if (!this.video || this.video.readyState < 2) return;
    if (!this.externalTexture) {
      // create it once
      this.externalTexture = this.device.importExternalTexture({
        source: this.video
      });
      this.createBindGroupForRender();
      this.videoIsReady = 'YES';
      console.log("✅video bind group");
    } else {
      this.externalTexture = this.device.importExternalTexture({
        source: this.video
      });
      this.createBindGroupForRender();
    }
  }
  createBindGroupForRender() {
    const textureResource = this.isVideo ? this.externalTexture : this.texture0.createView();
    if (!textureResource || !this.sceneUniformBuffer || !this.shadowDepthTextureView) {
      if (!textureResource) console.warn("❗Missing res texture: ", textureResource);
      if (!this.sceneUniformBuffer) console.warn("❗Missing res: this.sceneUniformBuffer: ", this.sceneUniformBuffer);
      if (!this.shadowDepthTextureView) console.warn("❗Missing res: this.shadowDepthTextureView: ", this.shadowDepthTextureView);
      if (typeof textureResource === 'undefined') {
        this.updateVideoTexture();
      }
      return;
    }
    if (this.isVideo == true) {
      // console.info("✅ video sceneBindGroupForRender");
      this.sceneBindGroupForRender = this.device.createBindGroup({
        layout: this.bglForRender,
        entries: [{
          binding: 0,
          resource: {
            buffer: this.sceneUniformBuffer
          }
        }, {
          binding: 1,
          resource: this.shadowDepthTextureView
        }, {
          binding: 2,
          resource: this.compareSampler
        }, {
          binding: 3,
          resource: textureResource
        }, {
          binding: 4,
          resource: this.videoSampler
        }, {
          binding: 5,
          resource: {
            buffer: this.postFXModeBuffer
          }
        }]
      });
      // Special case for video maybe better solution exist
      if (this.video.paused == true) this.video.play();
    } else {
      this.sceneBindGroupForRender = this.device.createBindGroup({
        layout: this.bglForRender,
        entries: [{
          binding: 0,
          resource: {
            buffer: this.sceneUniformBuffer
          }
        }, {
          binding: 1,
          resource: this.shadowDepthTextureView
        }, {
          binding: 2,
          resource: this.compareSampler
        }, {
          binding: 3,
          resource: textureResource
        }, {
          binding: 4,
          resource: this.imageSampler
        }, {
          binding: 5,
          resource: {
            buffer: !this.spotlightUniformBuffer ? this.dummySpotlightUniformBuffer : this.spotlightUniformBuffer
          }
        }]
      });
    }
  }
  createLayoutForRender() {
    // if(this.isVideo == true) {
    //   console.info("✅ createLayoutForRender video [bglForRender]");
    // } else {
    //   console.info("✅ normal createLayoutForRender [bglForRender]");
    // }
    let e = [{
      binding: 0,
      visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
      buffer: {
        type: 'uniform'
      }
    }, ...(this.isVideo == false ? [{
      binding: 1,
      visibility: GPUShaderStage.FRAGMENT,
      texture: {
        sampleType: "depth",
        viewDimension: "2d-array",
        // <- must match shadowMapArray
        multisampled: false
      }
    }] : [{
      binding: 1,
      visibility: GPUShaderStage.FRAGMENT,
      texture: {
        sampleType: "depth",
        viewDimension: "2d"
      }
    }]), {
      binding: 2,
      visibility: GPUShaderStage.FRAGMENT,
      sampler: {
        type: 'comparison'
      }
    }, ...(this.isVideo ? [
    // VIDEO
    {
      binding: 3,
      visibility: GPUShaderStage.FRAGMENT,
      externalTexture: {}
    }, {
      binding: 4,
      visibility: GPUShaderStage.FRAGMENT,
      sampler: {
        type: 'filtering'
      } // for video sampling
    }, {
      binding: 5,
      visibility: GPUShaderStage.FRAGMENT,
      buffer: {
        type: 'uniform'
      }
    }] : [
    // IMAGE
    {
      binding: 3,
      visibility: GPUShaderStage.FRAGMENT,
      texture: {
        sampleType: 'float',
        viewDimension: '2d'
      }
    }, {
      binding: 4,
      visibility: GPUShaderStage.FRAGMENT,
      sampler: {
        type: 'filtering'
      }
    }, {
      binding: 5,
      visibility: GPUShaderStage.FRAGMENT,
      buffer: {
        type: 'uniform'
      }
    }])];
    // console.log("BG E : ", e)
    this.bglForRender = this.device.createBindGroupLayout({
      label: 'bglForRender',
      entries: e
    });
  }
}
exports.default = Materials;

},{}],26:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Rotation = exports.Position = void 0;
var _utils = require("./utils");
/**
 * @description 
 * Sub classes for matrix-wgpu
 * Base class
 * Position { x, y, z }
 */

class Position {
  constructor(x, y, z) {
    // console.log('TEST TYTPOF ', x)
    // Not in use for nwo this is from matrix-engine project [nameUniq]
    this.nameUniq = null;
    if (typeof x == 'undefined') x = 0;
    if (typeof y == 'undefined') y = 0;
    if (typeof z == 'undefined') z = 0;
    this.x = parseFloat(x);
    this.y = parseFloat(y);
    this.z = parseFloat(z);
    this.velY = 0;
    this.velX = 0;
    this.velZ = 0;
    this.inMove = false;
    this.targetX = parseFloat(x);
    this.targetY = parseFloat(y);
    this.targetZ = parseFloat(z);
    this.thrust = 0.01;
    return this;
  }
  setSpeed(n) {
    if (typeof n === 'number') {
      this.thrust = n;
    } else {
      console.log('Description: arguments (w, h) must be type of number.');
    }
  }
  translateByX(x) {
    this.inMove = true;
    this.targetX = parseFloat(x);
  }
  translateByY(y) {
    this.inMove = true;
    this.targetY = parseFloat(y);
  }
  translateByZ(z) {
    this.inMove = true;
    this.targetZ = parseFloat(z);
  }
  translateByXY(x, y) {
    this.inMove = true;
    this.targetX = parseFloat(x);
    this.targetY = parseFloat(y);
  }
  translateByXZ(x, z) {
    this.inMove = true;
    this.targetX = parseFloat(x);
    this.targetZ = parseFloat(z);
  }
  translateByYZ(y, z) {
    this.inMove = true;
    this.targetY = parseFloat(y);
    this.targetZ = parseFloat(z);
  }
  onTargetPositionReach() {}
  update() {
    var tx = parseFloat(this.targetX) - parseFloat(this.x),
      ty = parseFloat(this.targetY) - parseFloat(this.y),
      tz = parseFloat(this.targetZ) - parseFloat(this.z),
      dist = Math.sqrt(tx * tx + ty * ty + tz * tz);
    this.velX = tx / dist * this.thrust;
    this.velY = ty / dist * this.thrust;
    this.velZ = tz / dist * this.thrust;
    if (this.inMove == true) {
      if (dist > this.thrust) {
        this.x += this.velX;
        this.y += this.velY;
        this.z += this.velZ;

        // // from me
        // if(net && net.connection && typeof em === 'undefined' && App.scene[this.nameUniq].net.enable == true) net.connection.send({
        //   netPos: {x: this.x, y: this.y, z: this.z},
        //   netObjId: this.nameUniq,
        // });
      } else {
        this.x = this.targetX;
        this.y = this.targetY;
        this.z = this.targetZ;
        this.inMove = false;
        this.onTargetPositionReach();

        // // from me
        // if(net && net.connection && typeof em === 'undefined' && App.scene[this.nameUniq].net.enable == true) net.connection.send({
        //   netPos: {x: this.x, y: this.y, z: this.z},
        //   netObjId: this.nameUniq,
        // });
      }
    }
  }
  get worldLocation() {
    return [parseFloat(this.x), parseFloat(this.y), parseFloat(this.z)];
  }
  SetX(newx, em) {
    this.x = newx;
    this.targetX = newx;
    this.inMove = false;

    // if(net && net.connection && typeof em === 'undefined' &&
    //   App.scene[this.nameUniq].net && App.scene[this.nameUniq].net.enable == true) {
    //   net.connection.send({
    //     netPos: {x: this.x, y: this.y, z: this.z},
    //     netObjId: this.nameUniq,
    //   });
    // }
  }
  SetY(newy, em) {
    this.y = newy;
    this.targetY = newy;
    this.inMove = false;
    // if(net && net.connection && typeof em === 'undefined' &&
    //   App.scene[this.nameUniq].net && App.scene[this.nameUniq].net.enable == true) net.connection.send({
    //     netPos: {x: this.x, y: this.y, z: this.z},
    //     netObjId: this.nameUniq,
    //   });
  }
  SetZ(newz, em) {
    this.z = newz;
    this.targetZ = newz;
    this.inMove = false;
    // if(net && net.connection && typeof em === 'undefined' &&
    //   App.scene[this.nameUniq].net && App.scene[this.nameUniq].net.enable == true) net.connection.send({
    //     netPos: {x: this.x, y: this.y, z: this.z},
    //     netObjId: this.nameUniq,
    //   });
  }
  get X() {
    return parseFloat(this.x);
  }
  get Y() {
    return parseFloat(this.y);
  }
  get Z() {
    return parseFloat(this.z);
  }
  setPosition(newx, newy, newz) {
    this.x = newx;
    this.y = newy;
    this.z = newz;
    this.targetX = newx;
    this.targetY = newy;
    this.targetZ = newz;
    this.inMove = false;

    // from me
    // if(App.scene[this.nameUniq] && net && net.connection && typeof em === 'undefined' &&
    //   App.scene[this.nameUniq].net && App.scene[this.nameUniq].net.enable == true) net.connection.send({
    //     netPos: {x: this.x, y: this.y, z: this.z},
    //     netObjId: this.nameUniq,
    //   });
  }
}
exports.Position = Position;
class Rotation {
  constructor(x, y, z) {
    // Not in use for nwo this is from matrix-engine project [nameUniq]
    this.nameUniq = null;
    if (typeof x == 'undefined') x = 0;
    if (typeof y == 'undefined') y = 0;
    if (typeof z == 'undefined') z = 0;
    this.x = x;
    this.y = y;
    this.z = z;
    this.rotationSpeed = {
      x: 0,
      y: 0,
      z: 0
    };
    this.angle = 0;
    this.axis = {
      x: 0,
      y: 0,
      z: 0
    };
    // not in use good for exstend logic
    this.matrixRotation = null;
  }
  toDegree() {
    /*
    heading = atan2(y * sin(angle)- x * z * (1 - cos(angle)) , 1 - (y2 + z2 ) * (1 - cos(angle)))
    attitude = asin(x * y * (1 - cos(angle)) + z * sin(angle))
    bank = atan2(x * sin(angle)-y * z * (1 - cos(angle)) , 1 - (x2 + z2) * (1 - cos(angle)))
    */
    return [(0, _utils.radToDeg)(this.axis.x), (0, _utils.radToDeg)(this.axis.y), (0, _utils.radToDeg)(this.axis.z)];
  }
  toDegreeX() {
    return Math.cos((0, _utils.radToDeg)(this.axis.x) / 2);
  }
  toDegreeY() {
    return Math.cos((0, _utils.radToDeg)(this.axis.z) / 2);
  }
  toDegreeZ() {
    return Math.cos((0, _utils.radToDeg)(this.axis.y) / 2);
  }
  getRotX() {
    if (this.rotationSpeed.x == 0) {
      return (0, _utils.degToRad)(this.x);
    } else {
      this.x = this.x + this.rotationSpeed.x * 0.001;
      return (0, _utils.degToRad)(this.x);
    }
  }
  getRotY() {
    if (this.rotationSpeed.y == 0) {
      return (0, _utils.degToRad)(this.y);
    } else {
      this.y = this.y + this.rotationSpeed.y * 0.001;
      return (0, _utils.degToRad)(this.y);
    }
  }
  getRotZ() {
    if (this.rotationSpeed.z == 0) {
      return (0, _utils.degToRad)(this.z);
    } else {
      this.z = this.z + this.rotationSpeed.z * 0.001;
      return (0, _utils.degToRad)(this.z);
    }
  }
}
exports.Rotation = Rotation;

},{"./utils":28}],27:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _wgpuMatrix = require("wgpu-matrix");
var _matrixClass = require("./matrix-class");
var _fragment = require("../shaders/fragment.wgsl");
var _vertex = require("../shaders/vertex.wgsl");
var _utils = require("./utils");
var _materials = _interopRequireDefault(require("./materials"));
var _fragmentVideo = require("../shaders/fragment.video.wgsl");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
// import {vertexShadowWGSL} from '../shaders/vertexShadow.wgsl';

class MEMeshObj extends _materials.default {
  constructor(canvas, device, context, o, inputHandler, globalAmbient, _glbFile = null, primitiveIndex = null, skinnedNodeIndex = null) {
    super(device);
    if (typeof o.name === 'undefined') o.name = (0, _utils.genName)(3);
    if (typeof o.raycast === 'undefined') {
      this.raycast = {
        enabled: false,
        radius: 2
      };
    } else {
      this.raycast = o.raycast;
    }
    this.name = o.name;
    this.done = false;
    this.device = device;
    this.context = context;
    this.entityArgPass = o.entityArgPass;
    this.clearColor = "red";
    this.video = null;
    this.FINISH_VIDIO_INIT = false;
    this.globalAmbient = globalAmbient;

    // Mesh stuff - for single mesh or t-posed (fiktive-first in loading order)
    this.mesh = o.mesh;
    if (_glbFile != null) {
      if (typeof this.mesh == 'undefined') {
        // console.log('glb detected..create mesh obj.')
        this.mesh = {};
        this.mesh.feedFromRealGlb = true;
      }
      // console.log('glb detected - name: ' + this.name + ' - skinnedNodeIndex:' + skinnedNodeIndex + " primitiveIndex:" + primitiveIndex)
      // V
      const verView = _glbFile.skinnedMeshNodes[skinnedNodeIndex].mesh.primitives[primitiveIndex].positions.view;
      const byteOffsetV = verView.byteOffset || 0;
      const byteLengthV = verView.buffer.byteLength;
      const vertices = new Float32Array(verView.buffer.buffer, byteOffsetV, byteLengthV / 4);
      this.mesh.vertices = vertices;
      //N
      const norView = _glbFile.skinnedMeshNodes[skinnedNodeIndex].mesh.primitives[primitiveIndex].normals.view;
      const normalsUint8 = norView.buffer;
      const byteOffsetN = norView.byteOffset || 0; // if your loader provides it
      const byteLengthN = normalsUint8.byteLength;
      const normals = new Float32Array(normalsUint8.buffer, byteOffsetN, byteLengthN / 4);
      this.mesh.vertexNormals = normals;
      //UV
      let binary = _glbFile.skinnedMeshNodes[skinnedNodeIndex].mesh.primitives[primitiveIndex].texcoords[0].view.buffer;
      const byteOffset = 0; // or from accessor
      const byteLength = binary.byteLength;
      const uvFloatArray = new Float32Array(binary.buffer, byteOffset, byteLength / 4);
      this.mesh.uvs = uvFloatArray;
      this.mesh.textures = this.mesh.uvs;
      // indices
      let binaryI = _glbFile.skinnedMeshNodes[skinnedNodeIndex].mesh.primitives[primitiveIndex].indices;
      const indicesView = binaryI.view;
      const indicesUint8 = indicesView.buffer;
      const byteOffsetI = indicesView.byteOffset || 0;
      const byteLengthI = indicesUint8.byteLength;
      // Decide on type from accessor.componentType
      // (5121 = UNSIGNED_BYTE, 5123 = UNSIGNED_SHORT, 5125 = UNSIGNED_INT)
      let indicesArray;
      switch (binaryI.componentType) {
        case 5121:
          // UNSIGNED_BYTE
          indicesArray = new Uint8Array(indicesUint8.buffer, byteOffsetI, byteLengthI);
          break;
        case 5123:
          // UNSIGNED_SHORT
          indicesArray = new Uint16Array(indicesUint8.buffer, byteOffsetI, byteLengthI / 2);
          break;
        case 5125:
          // UNSIGNED_INT
          indicesArray = new Uint32Array(indicesUint8.buffer, byteOffsetI, byteLengthI / 4);
          break;
        default:
          throw new Error("Unknown index componentType");
      }
      this.mesh.indices = indicesArray;
      // W
      let weightsView = _glbFile.skinnedMeshNodes[skinnedNodeIndex].mesh.primitives[primitiveIndex].weights.view;
      console.warn('weightsView', weightsView);
      this.mesh.weightsView = weightsView;
      let primitive = _glbFile.skinnedMeshNodes[skinnedNodeIndex].mesh.primitives[primitiveIndex];
      let finalRoundedWeights = this.getAccessorArray(_glbFile, primitive.weights.numComponents);
      const weightsArray = finalRoundedWeights;
      // Normalize each group of 4
      for (let i = 0; i < weightsArray.length; i += 4) {
        const sum = weightsArray[i] + weightsArray[i + 1] + weightsArray[i + 2] + weightsArray[i + 3];
        if (sum > 0) {
          const inv = 1 / sum;
          weightsArray[i] *= inv;
          weightsArray[i + 1] *= inv;
          weightsArray[i + 2] *= inv;
          weightsArray[i + 3] *= inv;
        } else {
          weightsArray[i] = 1;
          weightsArray[i + 1] = 0;
          weightsArray[i + 2] = 0;
          weightsArray[i + 3] = 0;
        }
      }
      for (let i = 0; i < weightsArray.length; i += 4) {
        const s = weightsArray[i] + weightsArray[i + 1] + weightsArray[i + 2] + weightsArray[i + 3];
        if (Math.abs(s - 1.0) > 0.001) console.warn("Weight not normalized!", i, s);
      }
      // console.log('Normalized weightsArray', weightsArray);
      this.mesh.weightsBuffer = this.device.createBuffer({
        label: "weightsBuffer real data",
        size: weightsArray.byteLength,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        mappedAtCreation: true
      });
      new Float32Array(this.mesh.weightsBuffer.getMappedRange()).set(weightsArray);
      this.mesh.weightsBuffer.unmap();

      // Get JOINTS_0 accessor view from the GLB mesh
      let jointsView = _glbFile.skinnedMeshNodes[skinnedNodeIndex].mesh.primitives[primitiveIndex].joints.view;
      console.warn('jointsView', jointsView);
      this.mesh.jointsView = jointsView;
      // Create typed array from the buffer (Uint16Array or Uint8Array depending on GLB)
      let jointsArray16 = new Uint16Array(jointsView.buffer, jointsView.byteOffset || 0, jointsView.byteLength / 2 // in Uint16 elements
      );
      const jointsArray32 = new Uint32Array(jointsArray16.length);
      for (let i = 0; i < jointsArray16.length; i++) {
        jointsArray32[i] = jointsArray16[i];
      }
      // const DUMMY = new Uint32Array((this.mesh.vertices.length / 3) * 4);
      // Create GPU buffer for joints
      this.mesh.jointsBuffer = this.device.createBuffer({
        label: "jointsBuffer real data",
        size: jointsArray32.byteLength,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        mappedAtCreation: true
      });
      // Upload the data to GPU
      new Uint32Array(this.mesh.jointsBuffer.getMappedRange()).set(jointsArray32);
      this.mesh.jointsBuffer.unmap();
    } else {
      // obj files flow
      this.mesh.uvs = this.mesh.textures;
    }
    console.log(`%c Mesh loaded: ${o.name}`, _utils.LOG_FUNNY_SMALL);
    // ObjSequence animation
    if (typeof o.objAnim !== 'undefined' && o.objAnim != null) {
      this.objAnim = o.objAnim;
      for (var key in this.objAnim.animations) {
        if (key != 'active') this.objAnim.animations[key].speedCounter = 0;
      }
      console.log(`%c Mesh objAnim exist: ${o.objAnim}`, _utils.LOG_FUNNY_SMALL);
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
    o.texturesPaths.forEach(t => {
      this.texturesPaths.push(t);
    });
    this.presentationFormat = navigator.gpu.getPreferredCanvasFormat();
    this.position = new _matrixClass.Position(o.position.x, o.position.y, o.position.z);
    this.rotation = new _matrixClass.Rotation(o.rotation.x, o.rotation.y, o.rotation.z);
    this.rotation.rotationSpeed.x = o.rotationSpeed.x;
    this.rotation.rotationSpeed.y = o.rotationSpeed.y;
    this.rotation.rotationSpeed.z = o.rotationSpeed.z;
    this.scale = o.scale;
    // new dummy for skin mesh
    // in MeshObj constructor or setup
    if (!this.joints) {
      const jointsData = new Uint32Array(this.mesh.vertices.length / 3 * 4);
      const jointsBuffer = this.device.createBuffer({
        label: "jointsBuffer",
        size: jointsData.byteLength,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        mappedAtCreation: true
      });
      new Uint32Array(jointsBuffer.getMappedRange()).set(jointsData);
      jointsBuffer.unmap();
      this.joints = {
        data: jointsData,
        buffer: jointsBuffer,
        stride: 16 // vec4<u32>
      };
      const numVerts = this.mesh.vertices.length / 3;
      // Weights data (vec4<f32>) – default all weight to bone 0
      const weightsData = new Float32Array(numVerts * 4);
      for (let i = 0; i < numVerts; i++) {
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
        mappedAtCreation: true
      });
      new Float32Array(weightsBuffer.getMappedRange()).set(weightsData);
      weightsBuffer.unmap();
      this.weights = {
        data: weightsData,
        buffer: weightsBuffer,
        stride: 16 // vec4<f32>
      };
    }
    this.runProgram = () => {
      return new Promise(async resolve => {
        this.shadowDepthTextureSize = 1024;
        this.modelViewProjectionMatrix = _wgpuMatrix.mat4.create();
        this.loadTex0(this.texturesPaths).then(() => {
          resolve();
        });
      });
    };
    this.runProgram().then(() => {
      this.context.configure({
        device: this.device,
        format: this.presentationFormat,
        alphaMode: 'premultiplied'
      });

      // Create the model vertex buffer.
      this.vertexBuffer = this.device.createBuffer({
        size: this.mesh.vertices.length * Float32Array.BYTES_PER_ELEMENT,
        usage: GPUBufferUsage.VERTEX,
        mappedAtCreation: true
      });
      {
        new Float32Array(this.vertexBuffer.getMappedRange()).set(this.mesh.vertices);
        this.vertexBuffer.unmap();
      }

      // Create the model vertex buffer.
      this.vertexNormalsBuffer = this.device.createBuffer({
        size: this.mesh.vertexNormals.length * Float32Array.BYTES_PER_ELEMENT,
        usage: GPUBufferUsage.VERTEX,
        mappedAtCreation: true
      });
      {
        new Float32Array(this.vertexNormalsBuffer.getMappedRange()).set(this.mesh.vertexNormals);
        this.vertexNormalsBuffer.unmap();
      }
      this.vertexTexCoordsBuffer = this.device.createBuffer({
        size: this.mesh.textures.length * Float32Array.BYTES_PER_ELEMENT,
        usage: GPUBufferUsage.VERTEX,
        mappedAtCreation: true
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
        arrayStride: 4 * 4,
        // vec4<f32> = 4 * 4 bytes
        attributes: [{
          format: 'float32x4',
          offset: 0,
          shaderLocation: 4
        }]
      };
      // if(this.mesh.feedFromRealGlb && this.mesh.feedFromRealGlb == true) {
      //   // console.log('it is GLB ')
      //   glbInfo = {
      //     arrayStride: 4 * 4, // vec4<f32> = 4 * 4 bytes
      //     attributes: [{format: 'float32x4', offset: 0, shaderLocation: 4}]
      //   }
      // } else {
      //   // console.log('it is not  GLB ')
      //   glbInfo = {
      //     arrayStride: 4 * 4, // vec4<f32> = 4 * 4 bytes
      //     attributes: [{format: 'float32x4', offset: 0, shaderLocation: 4}]
      //   }
      // }
      // Create some common descriptors used for both the shadow pipeline
      // and the color rendering pipeline.
      this.vertexBuffers = [{
        arrayStride: Float32Array.BYTES_PER_ELEMENT * 3,
        attributes: [{
          // position
          shaderLocation: 0,
          offset: 0,
          format: "float32x3"
        }]
      }, {
        arrayStride: Float32Array.BYTES_PER_ELEMENT * 3,
        attributes: [{
          // normal
          shaderLocation: 1,
          offset: 0,
          format: "float32x3"
        }]
      }, {
        arrayStride: Float32Array.BYTES_PER_ELEMENT * 2,
        attributes: [{
          // uvs
          shaderLocation: 2,
          offset: 0,
          format: "float32x2"
        }]
      },
      // joint indices
      {
        arrayStride: 4 * 4,
        // vec4<u32> = 4 * 4 bytes
        attributes: [{
          format: 'uint32x4',
          offset: 0,
          shaderLocation: 3
        }]
      },
      // weights
      glbInfo];
      this.primitive = {
        topology: 'triangle-list',
        cullMode: 'back',
        // typical for shadow passes
        frontFace: 'ccw'
      };

      // Create a bind group layout which holds the scene uniforms and
      // the texture+sampler for depth. We create it manually because the WebPU
      // implementation doesn't infer this from the shader (yet).
      this.createLayoutForRender();
      this.modelUniformBuffer = this.device.createBuffer({
        size: 4 * 16,
        // 4x4 matrix
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
      });
      this.sceneUniformBuffer = this.device.createBuffer({
        label: 'sceneUniformBuffer per mesh',
        size: 176,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
      });
      this.uniformBufferBindGroupLayout = this.device.createBindGroupLayout({
        label: 'uniformBufferBindGroupLayout in mesh',
        entries: [{
          binding: 0,
          visibility: GPUShaderStage.VERTEX,
          buffer: {
            type: 'uniform'
          }
        }, {
          binding: 1,
          visibility: GPUShaderStage.VERTEX,
          buffer: {
            type: 'uniform'
          }
        }]
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
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
      });
      const bones = new Float32Array(this.MAX_BONES * 16);
      for (let i = 0; i < this.MAX_BONES; i++) {
        // identity matrices
        bones.set([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1], i * 16);
      }
      this.device.queue.writeBuffer(this.bonesBuffer, 0, bones);
      this.modelBindGroup = this.device.createBindGroup({
        label: 'modelBindGroup in mesh',
        layout: this.uniformBufferBindGroupLayout,
        entries: [{
          binding: 0,
          resource: {
            buffer: this.modelUniformBuffer
          }
        }, {
          binding: 1,
          resource: {
            buffer: this.bonesBuffer
          }
        }]
      });
      this.mainPassBindGroupLayout = this.device.createBindGroupLayout({
        entries: [{
          binding: 0,
          visibility: GPUShaderStage.FRAGMENT,
          texture: {
            sampleType: 'depth'
          }
        }, {
          binding: 1,
          visibility: GPUShaderStage.FRAGMENT,
          sampler: {
            type: 'comparison'
          }
        }]
      });
      // Rotates the camera around the origin based on time.
      this.getTransformationMatrix = (mainRenderBundle, spotLight) => {
        const now = Date.now();
        const dt = (now - this.lastFrameMS) / this.mainCameraParams.responseCoef;
        this.lastFrameMS = now;
        const camera = this.cameras[this.mainCameraParams.type];
        camera.update(dt, inputHandler());
        const camVP = _wgpuMatrix.mat4.multiply(camera.projectionMatrix, camera.view);
        for (const mesh of mainRenderBundle) {
          const sceneData = new Float32Array(44);
          // Light VP
          sceneData.set(spotLight.viewProjMatrix, 0);
          // Camera VP
          sceneData.set(camVP, 16);
          // Camera position + padding
          sceneData.set([camera.position.x, camera.position.y, camera.position.z, 0.0], 32);
          // Light position + padding
          sceneData.set([spotLight.position[0], spotLight.position[1], spotLight.position[2], 0.0], 36);
          // Global ambient + padding
          sceneData.set([this.globalAmbient[0], this.globalAmbient[1], this.globalAmbient[2], 0.0], 40);
          if (mesh.glb && mesh.glb.skinnedMeshNodes) {
            mesh.glb.skinnedMeshNodes.forEach(skinnedMeshNode => {
              device.queue.writeBuffer(
              // skinnedMeshNode.sceneUniformBuffer,
              mesh.sceneUniformBuffer, 0, sceneData.buffer, sceneData.byteOffset, sceneData.byteLength);
            });
          } else {
            device.queue.writeBuffer(mesh.sceneUniformBuffer, 0, sceneData.buffer, sceneData.byteOffset, sceneData.byteLength);
          }
        }
      };
      this.getModelMatrix = pos => {
        let modelMatrix = _wgpuMatrix.mat4.identity();
        _wgpuMatrix.mat4.translate(modelMatrix, [pos.x, pos.y, pos.z], modelMatrix);
        if (this.itIsPhysicsBody) {
          _wgpuMatrix.mat4.rotate(modelMatrix, [this.rotation.axis.x, this.rotation.axis.y, this.rotation.axis.z], (0, _utils.degToRad)(this.rotation.angle), modelMatrix);
        } else {
          _wgpuMatrix.mat4.rotateX(modelMatrix, this.rotation.getRotX(), modelMatrix);
          _wgpuMatrix.mat4.rotateY(modelMatrix, this.rotation.getRotY(), modelMatrix);
          _wgpuMatrix.mat4.rotateZ(modelMatrix, this.rotation.getRotZ(), modelMatrix);
        }
        // Apply scale if you have it, e.g.:
        // console.warn('what is csle comes from user level not glb ', this.scale)
        _wgpuMatrix.mat4.scale(modelMatrix, [this.scale[0], this.scale[1], this.scale[2]], modelMatrix);
        return modelMatrix;
      };

      // looks like affect on transformations for now const 0
      const modelMatrix = _wgpuMatrix.mat4.translation([0, 0, 0]);
      const modelData = modelMatrix;
      this.device.queue.writeBuffer(this.modelUniformBuffer, 0, modelData.buffer, modelData.byteOffset, modelData.byteLength);
      this.done = true;
      try {
        this.setupPipeline();
      } catch (err) {
        console.log('err in create pipeline in init ', err);
      }
    }).then(() => {
      if (typeof this.objAnim !== 'undefined' && this.objAnim !== null) {
        console.log('after all updateMeshListBuffers...');
        this.updateMeshListBuffers();
      }
    });
  }
  setupPipeline = () => {
    this.createBindGroupForRender();
    this.pipeline = this.device.createRenderPipeline({
      label: 'Mesh Pipeline ✅',
      layout: this.device.createPipelineLayout({
        label: 'createPipelineLayout Mesh',
        bindGroupLayouts: [this.bglForRender, this.uniformBufferBindGroupLayout]
      }),
      vertex: {
        entryPoint: 'main',
        module: this.device.createShaderModule({
          code: _vertex.vertexWGSL
        }),
        buffers: this.vertexBuffers
      },
      fragment: {
        entryPoint: 'main',
        module: this.device.createShaderModule({
          code: this.isVideo == true ? _fragmentVideo.fragmentVideoWGSL : _fragment.fragmentWGSL
        }),
        targets: [{
          format: this.presentationFormat
        }],
        constants: {
          shadowDepthTextureSize: this.shadowDepthTextureSize
        }
      },
      depthStencil: {
        depthWriteEnabled: true,
        depthCompare: 'less',
        format: 'depth24plus'
      },
      primitive: this.primitive
    });
    console.log('✅Set Pipeline done');
  };
  updateModelUniformBuffer = () => {
    if (this.done == false) return;
    // Per-object model matrix only
    const modelMatrix = this.getModelMatrix(this.position);
    this.device.queue.writeBuffer(this.modelUniformBuffer, 0, modelMatrix.buffer, modelMatrix.byteOffset, modelMatrix.byteLength);
  };
  createGPUBuffer(dataArray, usage) {
    if (!dataArray || typeof dataArray.length !== 'number') {
      throw new Error('Invalid data array passed to createGPUBuffer');
    }
    const size = dataArray.length * dataArray.BYTES_PER_ELEMENT;
    if (!Number.isFinite(size) || size <= 0) {
      throw new Error(`Invalid buffer size: ${size}`);
    }
    const buffer = this.device.createBuffer({
      size,
      usage,
      mappedAtCreation: true
    });
    const writeArray = dataArray.constructor === Float32Array ? new Float32Array(buffer.getMappedRange()) : new Uint16Array(buffer.getMappedRange());
    writeArray.set(dataArray);
    buffer.unmap();
    return buffer;
  }
  updateMeshListBuffers() {
    for (const key in this.objAnim.meshList) {
      const mesh = this.objAnim.meshList[key];
      mesh.vertexBuffer = this.device.createBuffer({
        size: mesh.vertices.length * Float32Array.BYTES_PER_ELEMENT,
        usage: GPUBufferUsage.VERTEX,
        mappedAtCreation: true
      });
      new Float32Array(mesh.vertexBuffer.getMappedRange()).set(mesh.vertices);
      mesh.vertexBuffer.unmap();
      // Normals
      mesh.vertexNormalsBuffer = this.device.createBuffer({
        size: mesh.vertexNormals.length * Float32Array.BYTES_PER_ELEMENT,
        usage: GPUBufferUsage.VERTEX,
        mappedAtCreation: true
      });
      new Float32Array(mesh.vertexNormalsBuffer.getMappedRange()).set(mesh.vertexNormals);
      mesh.vertexNormalsBuffer.unmap();
      // UVs
      mesh.vertexTexCoordsBuffer = this.device.createBuffer({
        size: mesh.textures.length * Float32Array.BYTES_PER_ELEMENT,
        usage: GPUBufferUsage.VERTEX,
        mappedAtCreation: true
      });
      new Float32Array(mesh.vertexTexCoordsBuffer.getMappedRange()).set(mesh.textures);
      mesh.vertexTexCoordsBuffer.unmap();
      // Indices
      const indexCount = mesh.indices.length;
      const indexSize = Math.ceil(indexCount * Uint16Array.BYTES_PER_ELEMENT / 4) * 4;
      mesh.indexBuffer = this.device.createBuffer({
        size: indexSize,
        usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
        mappedAtCreation: true
      });
      new Uint16Array(mesh.indexBuffer.getMappedRange()).set(mesh.indices);
      mesh.indexBuffer.unmap();
      mesh.indexCount = indexCount;
    }
  }
  drawElements = (pass, lightContainer) => {
    if (this.isVideo) {
      this.updateVideoTexture();
    }
    // Bind per-mesh uniforms
    pass.setBindGroup(0, this.sceneBindGroupForRender); // camera/light UBOs
    pass.setBindGroup(1, this.modelBindGroup); // mesh transforms/textures
    // Bind each light’s shadow texture & sampler
    if (this.isVideo == false) {
      let bindIndex = 2; // start after UBO & model
      for (const light of lightContainer) {
        pass.setBindGroup(bindIndex++, light.getMainPassBindGroup(this));
      }
    }
    pass.setVertexBuffer(0, this.vertexBuffer);
    pass.setVertexBuffer(1, this.vertexNormalsBuffer);
    pass.setVertexBuffer(2, this.vertexTexCoordsBuffer);
    if (this.joints) {
      if (this.constructor.name === "BVHPlayer") {
        pass.setVertexBuffer(3, this.mesh.jointsBuffer); // real
        pass.setVertexBuffer(4, this.mesh.weightsBuffer); //real
      } else {
        // dummy
        pass.setVertexBuffer(3, this.joints.buffer); // new dummy
        pass.setVertexBuffer(4, this.weights.buffer); // new dummy
      }
    }
    pass.setIndexBuffer(this.indexBuffer, 'uint16');
    pass.drawIndexed(this.indexCount);
  };
  drawElementsAnim = renderPass => {
    if (!this.sceneBindGroupForRender || !this.modelBindGroup) {
      console.log(' NULL 1');
      return;
    }
    if (!this.objAnim.meshList[this.objAnim.id + this.objAnim.currentAni]) {
      console.log(' NULL 2');
      return;
    }
    renderPass.setBindGroup(0, this.sceneBindGroupForRender);
    renderPass.setBindGroup(1, this.modelBindGroup);
    const mesh = this.objAnim.meshList[this.objAnim.id + this.objAnim.currentAni];
    renderPass.setVertexBuffer(0, mesh.vertexBuffer);
    renderPass.setVertexBuffer(1, mesh.vertexNormalsBuffer);
    renderPass.setVertexBuffer(2, mesh.vertexTexCoordsBuffer);
    if (this.constructor.name === "BVHPlayer") {
      renderPass.setVertexBuffer(3, this.mesh.jointsBuffer); // real
      renderPass.setVertexBuffer(4, this.mesh.weightsBuffer); //real
    } else {
      // dummy
      renderPass.setVertexBuffer(3, this.joints.buffer); // new dummy
      renderPass.setVertexBuffer(4, this.weights.buffer); // new dummy
    }
    renderPass.setIndexBuffer(mesh.indexBuffer, 'uint16');
    renderPass.drawIndexed(mesh.indexCount);
    if (this.objAnim.playing == true) {
      if (this.objAnim.animations[this.objAnim.animations.active].speedCounter >= this.objAnim.animations[this.objAnim.animations.active].speed) {
        this.objAnim.currentAni++;
        this.objAnim.animations[this.objAnim.animations.active].speedCounter = 0;
      } else {
        this.objAnim.animations[this.objAnim.animations.active].speedCounter++;
      }
      if (this.objAnim.currentAni >= this.objAnim.animations[this.objAnim.animations.active].to) {
        this.objAnim.currentAni = this.objAnim.animations[this.objAnim.animations.active].from;
      }
    }
  };
  drawShadows = (shadowPass, light) => {
    shadowPass.setVertexBuffer(0, this.vertexBuffer);
    shadowPass.setVertexBuffer(1, this.vertexNormalsBuffer);
    shadowPass.setVertexBuffer(2, this.vertexTexCoordsBuffer);
    shadowPass.setIndexBuffer(this.indexBuffer, 'uint16');
    shadowPass.drawIndexed(this.indexCount);
  };
}
exports.default = MEMeshObj;

},{"../shaders/fragment.video.wgsl":31,"../shaders/fragment.wgsl":32,"../shaders/vertex.wgsl":34,"./materials":25,"./matrix-class":26,"./utils":28,"wgpu-matrix":16}],28:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.LOG_WARN = exports.LOG_MATRIX = exports.LOG_INFO = exports.LOG_FUNNY_SMALL = exports.LOG_FUNNY = void 0;
exports.ORBIT = ORBIT;
exports.ORBIT_FROM_ARRAY = ORBIT_FROM_ARRAY;
exports.OSCILLATOR = OSCILLATOR;
exports.SWITCHER = SWITCHER;
exports.byId = void 0;
exports.createAppEvent = createAppEvent;
exports.degToRad = degToRad;
exports.genName = genName;
exports.getAxisRot = getAxisRot;
exports.getAxisRot2 = getAxisRot2;
exports.getAxisRot3 = getAxisRot3;
exports.mb = exports.mat4 = void 0;
exports.quaternion_rotation_matrix = quaternion_rotation_matrix;
exports.radToDeg = radToDeg;
exports.randomFloatFromTo = randomFloatFromTo;
exports.randomIntFromTo = randomIntFromTo;
exports.scriptManager = void 0;
exports.setupCanvasFilters = setupCanvasFilters;
exports.typeText = typeText;
exports.vec3 = exports.urlQuery = void 0;
const vec3 = exports.vec3 = {
  cross(a, b, dst) {
    dst = dst || new Float32Array(3);
    const t0 = a[1] * b[2] - a[2] * b[1];
    const t1 = a[2] * b[0] - a[0] * b[2];
    const t2 = a[0] * b[1] - a[1] * b[0];
    dst[0] = t0;
    dst[1] = t1;
    dst[2] = t2;
    return dst;
  },
  subtract(a, b, dst) {
    dst = dst || new Float32Array(3);
    dst[0] = a[0] - b[0];
    dst[1] = a[1] - b[1];
    dst[2] = a[2] - b[2];
    return dst;
  },
  normalize(v, dst) {
    dst = dst || new Float32Array(3);
    const length = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
    // make sure we don't divide by 0.
    if (length > 0.00001) {
      dst[0] = v[0] / length;
      dst[1] = v[1] / length;
      dst[2] = v[2] / length;
    } else {
      dst[0] = 0;
      dst[1] = 0;
      dst[2] = 0;
    }
    return dst;
  }
};
const mat4 = exports.mat4 = {
  projection(width, height, depth, dst) {
    // Note: This matrix flips the Y axis so that 0 is at the top.
    return mat4.ortho(0, width, height, 0, depth, -depth, dst);
  },
  perspective(fieldOfViewYInRadians, aspect, zNear, zFar, dst) {
    dst = dst || new Float32Array(16);
    const f = Math.tan(Math.PI * 0.5 - 0.5 * fieldOfViewYInRadians);
    const rangeInv = 1 / (zNear - zFar);
    dst[0] = f / aspect;
    dst[1] = 0;
    dst[2] = 0;
    dst[3] = 0;
    dst[4] = 0;
    dst[5] = f;
    dst[6] = 0;
    dst[7] = 0;
    dst[8] = 0;
    dst[9] = 0;
    dst[10] = zFar * rangeInv;
    dst[11] = -1;
    dst[12] = 0;
    dst[13] = 0;
    dst[14] = zNear * zFar * rangeInv;
    dst[15] = 0;
    return dst;
  },
  ortho(left, right, bottom, top, near, far, dst) {
    dst = dst || new Float32Array(16);
    dst[0] = 2 / (right - left);
    dst[1] = 0;
    dst[2] = 0;
    dst[3] = 0;
    dst[4] = 0;
    dst[5] = 2 / (top - bottom);
    dst[6] = 0;
    dst[7] = 0;
    dst[8] = 0;
    dst[9] = 0;
    dst[10] = 1 / (near - far);
    dst[11] = 0;
    dst[12] = (right + left) / (left - right);
    dst[13] = (top + bottom) / (bottom - top);
    dst[14] = near / (near - far);
    dst[15] = 1;
    return dst;
  },
  identity(dst) {
    dst = dst || new Float32Array(16);
    dst[0] = 1;
    dst[1] = 0;
    dst[2] = 0;
    dst[3] = 0;
    dst[4] = 0;
    dst[5] = 1;
    dst[6] = 0;
    dst[7] = 0;
    dst[8] = 0;
    dst[9] = 0;
    dst[10] = 1;
    dst[11] = 0;
    dst[12] = 0;
    dst[13] = 0;
    dst[14] = 0;
    dst[15] = 1;
    return dst;
  },
  multiply(a, b, dst) {
    dst = dst || new Float32Array(16);
    const b00 = b[0 * 4 + 0];
    const b01 = b[0 * 4 + 1];
    const b02 = b[0 * 4 + 2];
    const b03 = b[0 * 4 + 3];
    const b10 = b[1 * 4 + 0];
    const b11 = b[1 * 4 + 1];
    const b12 = b[1 * 4 + 2];
    const b13 = b[1 * 4 + 3];
    const b20 = b[2 * 4 + 0];
    const b21 = b[2 * 4 + 1];
    const b22 = b[2 * 4 + 2];
    const b23 = b[2 * 4 + 3];
    const b30 = b[3 * 4 + 0];
    const b31 = b[3 * 4 + 1];
    const b32 = b[3 * 4 + 2];
    const b33 = b[3 * 4 + 3];
    const a00 = a[0 * 4 + 0];
    const a01 = a[0 * 4 + 1];
    const a02 = a[0 * 4 + 2];
    const a03 = a[0 * 4 + 3];
    const a10 = a[1 * 4 + 0];
    const a11 = a[1 * 4 + 1];
    const a12 = a[1 * 4 + 2];
    const a13 = a[1 * 4 + 3];
    const a20 = a[2 * 4 + 0];
    const a21 = a[2 * 4 + 1];
    const a22 = a[2 * 4 + 2];
    const a23 = a[2 * 4 + 3];
    const a30 = a[3 * 4 + 0];
    const a31 = a[3 * 4 + 1];
    const a32 = a[3 * 4 + 2];
    const a33 = a[3 * 4 + 3];
    dst[0] = b00 * a00 + b01 * a10 + b02 * a20 + b03 * a30;
    dst[1] = b00 * a01 + b01 * a11 + b02 * a21 + b03 * a31;
    dst[2] = b00 * a02 + b01 * a12 + b02 * a22 + b03 * a32;
    dst[3] = b00 * a03 + b01 * a13 + b02 * a23 + b03 * a33;
    dst[4] = b10 * a00 + b11 * a10 + b12 * a20 + b13 * a30;
    dst[5] = b10 * a01 + b11 * a11 + b12 * a21 + b13 * a31;
    dst[6] = b10 * a02 + b11 * a12 + b12 * a22 + b13 * a32;
    dst[7] = b10 * a03 + b11 * a13 + b12 * a23 + b13 * a33;
    dst[8] = b20 * a00 + b21 * a10 + b22 * a20 + b23 * a30;
    dst[9] = b20 * a01 + b21 * a11 + b22 * a21 + b23 * a31;
    dst[10] = b20 * a02 + b21 * a12 + b22 * a22 + b23 * a32;
    dst[11] = b20 * a03 + b21 * a13 + b22 * a23 + b23 * a33;
    dst[12] = b30 * a00 + b31 * a10 + b32 * a20 + b33 * a30;
    dst[13] = b30 * a01 + b31 * a11 + b32 * a21 + b33 * a31;
    dst[14] = b30 * a02 + b31 * a12 + b32 * a22 + b33 * a32;
    dst[15] = b30 * a03 + b31 * a13 + b32 * a23 + b33 * a33;
    return dst;
  },
  cameraAim(eye, target, up, dst) {
    dst = dst || new Float32Array(16);
    const zAxis = vec3.normalize(vec3.subtract(eye, target));
    const xAxis = vec3.normalize(vec3.cross(up, zAxis));
    const yAxis = vec3.normalize(vec3.cross(zAxis, xAxis));
    dst[0] = xAxis[0];
    dst[1] = xAxis[1];
    dst[2] = xAxis[2];
    dst[3] = 0;
    dst[4] = yAxis[0];
    dst[5] = yAxis[1];
    dst[6] = yAxis[2];
    dst[7] = 0;
    dst[8] = zAxis[0];
    dst[9] = zAxis[1];
    dst[10] = zAxis[2];
    dst[11] = 0;
    dst[12] = eye[0];
    dst[13] = eye[1];
    dst[14] = eye[2];
    dst[15] = 1;
    return dst;
  },
  inverse(m, dst) {
    dst = dst || new Float32Array(16);
    const m00 = m[0 * 4 + 0];
    const m01 = m[0 * 4 + 1];
    const m02 = m[0 * 4 + 2];
    const m03 = m[0 * 4 + 3];
    const m10 = m[1 * 4 + 0];
    const m11 = m[1 * 4 + 1];
    const m12 = m[1 * 4 + 2];
    const m13 = m[1 * 4 + 3];
    const m20 = m[2 * 4 + 0];
    const m21 = m[2 * 4 + 1];
    const m22 = m[2 * 4 + 2];
    const m23 = m[2 * 4 + 3];
    const m30 = m[3 * 4 + 0];
    const m31 = m[3 * 4 + 1];
    const m32 = m[3 * 4 + 2];
    const m33 = m[3 * 4 + 3];
    const tmp0 = m22 * m33;
    const tmp1 = m32 * m23;
    const tmp2 = m12 * m33;
    const tmp3 = m32 * m13;
    const tmp4 = m12 * m23;
    const tmp5 = m22 * m13;
    const tmp6 = m02 * m33;
    const tmp7 = m32 * m03;
    const tmp8 = m02 * m23;
    const tmp9 = m22 * m03;
    const tmp10 = m02 * m13;
    const tmp11 = m12 * m03;
    const tmp12 = m20 * m31;
    const tmp13 = m30 * m21;
    const tmp14 = m10 * m31;
    const tmp15 = m30 * m11;
    const tmp16 = m10 * m21;
    const tmp17 = m20 * m11;
    const tmp18 = m00 * m31;
    const tmp19 = m30 * m01;
    const tmp20 = m00 * m21;
    const tmp21 = m20 * m01;
    const tmp22 = m00 * m11;
    const tmp23 = m10 * m01;
    const t0 = tmp0 * m11 + tmp3 * m21 + tmp4 * m31 - (tmp1 * m11 + tmp2 * m21 + tmp5 * m31);
    const t1 = tmp1 * m01 + tmp6 * m21 + tmp9 * m31 - (tmp0 * m01 + tmp7 * m21 + tmp8 * m31);
    const t2 = tmp2 * m01 + tmp7 * m11 + tmp10 * m31 - (tmp3 * m01 + tmp6 * m11 + tmp11 * m31);
    const t3 = tmp5 * m01 + tmp8 * m11 + tmp11 * m21 - (tmp4 * m01 + tmp9 * m11 + tmp10 * m21);
    const d = 1 / (m00 * t0 + m10 * t1 + m20 * t2 + m30 * t3);
    dst[0] = d * t0;
    dst[1] = d * t1;
    dst[2] = d * t2;
    dst[3] = d * t3;
    dst[4] = d * (tmp1 * m10 + tmp2 * m20 + tmp5 * m30 - (tmp0 * m10 + tmp3 * m20 + tmp4 * m30));
    dst[5] = d * (tmp0 * m00 + tmp7 * m20 + tmp8 * m30 - (tmp1 * m00 + tmp6 * m20 + tmp9 * m30));
    dst[6] = d * (tmp3 * m00 + tmp6 * m10 + tmp11 * m30 - (tmp2 * m00 + tmp7 * m10 + tmp10 * m30));
    dst[7] = d * (tmp4 * m00 + tmp9 * m10 + tmp10 * m20 - (tmp5 * m00 + tmp8 * m10 + tmp11 * m20));
    dst[8] = d * (tmp12 * m13 + tmp15 * m23 + tmp16 * m33 - (tmp13 * m13 + tmp14 * m23 + tmp17 * m33));
    dst[9] = d * (tmp13 * m03 + tmp18 * m23 + tmp21 * m33 - (tmp12 * m03 + tmp19 * m23 + tmp20 * m33));
    dst[10] = d * (tmp14 * m03 + tmp19 * m13 + tmp22 * m33 - (tmp15 * m03 + tmp18 * m13 + tmp23 * m33));
    dst[11] = d * (tmp17 * m03 + tmp20 * m13 + tmp23 * m23 - (tmp16 * m03 + tmp21 * m13 + tmp22 * m23));
    dst[12] = d * (tmp14 * m22 + tmp17 * m32 + tmp13 * m12 - (tmp16 * m32 + tmp12 * m12 + tmp15 * m22));
    dst[13] = d * (tmp20 * m32 + tmp12 * m02 + tmp19 * m22 - (tmp18 * m22 + tmp21 * m32 + tmp13 * m02));
    dst[14] = d * (tmp18 * m12 + tmp23 * m32 + tmp15 * m02 - (tmp22 * m32 + tmp14 * m02 + tmp19 * m12));
    dst[15] = d * (tmp22 * m22 + tmp16 * m02 + tmp21 * m12 - (tmp20 * m12 + tmp23 * m22 + tmp17 * m02));
    return dst;
  },
  lookAt(eye, target, up, dst) {
    return mat4.inverse(mat4.cameraAim(eye, target, up, dst), dst);
  },
  translation([tx, ty, tz], dst) {
    dst = dst || new Float32Array(16);
    dst[0] = 1;
    dst[1] = 0;
    dst[2] = 0;
    dst[3] = 0;
    dst[4] = 0;
    dst[5] = 1;
    dst[6] = 0;
    dst[7] = 0;
    dst[8] = 0;
    dst[9] = 0;
    dst[10] = 1;
    dst[11] = 0;
    dst[12] = tx;
    dst[13] = ty;
    dst[14] = tz;
    dst[15] = 1;
    return dst;
  },
  rotationX(angleInRadians, dst) {
    const c = Math.cos(angleInRadians);
    const s = Math.sin(angleInRadians);
    dst = dst || new Float32Array(16);
    dst[0] = 1;
    dst[1] = 0;
    dst[2] = 0;
    dst[3] = 0;
    dst[4] = 0;
    dst[5] = c;
    dst[6] = s;
    dst[7] = 0;
    dst[8] = 0;
    dst[9] = -s;
    dst[10] = c;
    dst[11] = 0;
    dst[12] = 0;
    dst[13] = 0;
    dst[14] = 0;
    dst[15] = 1;
    return dst;
  },
  rotationY(angleInRadians, dst) {
    const c = Math.cos(angleInRadians);
    const s = Math.sin(angleInRadians);
    dst = dst || new Float32Array(16);
    dst[0] = c;
    dst[1] = 0;
    dst[2] = -s;
    dst[3] = 0;
    dst[4] = 0;
    dst[5] = 1;
    dst[6] = 0;
    dst[7] = 0;
    dst[8] = s;
    dst[9] = 0;
    dst[10] = c;
    dst[11] = 0;
    dst[12] = 0;
    dst[13] = 0;
    dst[14] = 0;
    dst[15] = 1;
    return dst;
  },
  rotationZ(angleInRadians, dst) {
    const c = Math.cos(angleInRadians);
    const s = Math.sin(angleInRadians);
    dst = dst || new Float32Array(16);
    dst[0] = c;
    dst[1] = s;
    dst[2] = 0;
    dst[3] = 0;
    dst[4] = -s;
    dst[5] = c;
    dst[6] = 0;
    dst[7] = 0;
    dst[8] = 0;
    dst[9] = 0;
    dst[10] = 1;
    dst[11] = 0;
    dst[12] = 0;
    dst[13] = 0;
    dst[14] = 0;
    dst[15] = 1;
    return dst;
  },
  scaling([sx, sy, sz], dst) {
    dst = dst || new Float32Array(16);
    dst[0] = sx;
    dst[1] = 0;
    dst[2] = 0;
    dst[3] = 0;
    dst[4] = 0;
    dst[5] = sy;
    dst[6] = 0;
    dst[7] = 0;
    dst[8] = 0;
    dst[9] = 0;
    dst[10] = sz;
    dst[11] = 0;
    dst[12] = 0;
    dst[13] = 0;
    dst[14] = 0;
    dst[15] = 1;
    return dst;
  },
  translate(m, translation, dst) {
    return mat4.multiply(m, mat4.translation(translation), dst);
  },
  rotateX(m, angleInRadians, dst) {
    return mat4.multiply(m, mat4.rotationX(angleInRadians), dst);
  },
  rotateY(m, angleInRadians, dst) {
    return mat4.multiply(m, mat4.rotationY(angleInRadians), dst);
  },
  rotateZ(m, angleInRadians, dst) {
    return mat4.multiply(m, mat4.rotationZ(angleInRadians), dst);
  },
  scale(m, scale, dst) {
    return mat4.multiply(m, mat4.scaling(scale), dst);
  }
};
function degToRad(degrees) {
  return degrees * Math.PI / 180;
}
;
function radToDeg(r) {
  var pi = Math.PI;
  return r * (180 / pi);
}
;
function createAppEvent(name, myDetails) {
  return new CustomEvent(name, {
    detail: {
      eventName: name,
      data: myDetails
    },
    bubbles: true
  });
}

/**
 * @description
 * Load script in runtime.
 */
var scriptManager = exports.scriptManager = {
  SCRIPT_ID: 0,
  LOAD: function addScript(src, id, type, parent, callback) {
    var s = document.createElement('script');
    s.onload = function () {
      // console.log('Script id loaded [src]: ' + this.src);
      if (typeof callback != 'undefined') callback();
    };
    if (typeof type !== 'undefined') {
      s.setAttribute('type', type);
      s.innerHTML = src;
    } else {
      s.setAttribute('src', src);
    }
    if (typeof id !== 'undefined') {
      s.setAttribute('id', id);
    }
    if (typeof parent !== 'undefined') {
      document.getElementById(parent).appendChild(s);
      if (typeof callback != 'undefined') callback();
    } else {
      document.body.appendChild(s);
    }
  },
  loadModule: function addScript(src, id, type, parent) {
    console.log('Script id load called ');
    var s = document.createElement('script');
    s.onload = function () {
      scriptManager.SCRIPT_ID++;
    };
    if (typeof type === 'undefined') {
      s.setAttribute('type', 'module');
      s.setAttribute('src', src);
    } else {
      s.setAttribute('type', type);
      s.innerHTML = src;
    }
    s.setAttribute('src', src);
    if (typeof id !== 'undefined') {
      s.setAttribute('id', id);
    }
    if (typeof parent !== 'undefined') {
      document.getElementById(parent).appendChild(s);
    } else {
      document.body.appendChild(s);
    }
  },
  loadGLSL: function (src) {
    return new Promise(resolve => {
      fetch(src).then(data => {
        resolve(data.text());
      });
    });
  }
};

// GET PULSE VALUES IN REAL TIME
function OSCILLATOR(min, max, step) {
  if ((typeof min === 'string' || typeof min === 'number') && (typeof max === 'string' || typeof max === 'number') && (typeof step === 'string' || typeof step === 'number')) {
    var ROOT = this;
    this.min = parseFloat(min);
    this.max = parseFloat(max);
    this.step = parseFloat(step);
    this.value_ = parseFloat(min);
    this.status = 0;
    this.on_maximum_value = function () {};
    this.on_minimum_value = function () {};
    this.UPDATE = function (STATUS_) {
      if (STATUS_ === undefined) {
        if (this.status == 0 && this.value_ < this.max) {
          this.value_ = this.value_ + this.step;
          if (this.value_ >= this.max) {
            this.value_ = this.max;
            this.status = 1;
            ROOT.on_maximum_value();
          }
          return this.value_;
        } else if (this.status == 1 && this.value_ > this.min) {
          this.value_ = this.value_ - this.step;
          if (this.value_ <= this.min) {
            this.value_ = this.min;
            this.status = 0;
            ROOT.on_minimum_value();
          }
          return this.value_;
        }
      } else {
        return this.value_;
      }
    };
  } else {
    console.log("OSCILLATOR ERROR");
  }
}

// this is class not func ecma5
function SWITCHER() {
  var ROOT = this;
  ROOT.VALUE = 1;
  ROOT.GET = function () {
    ROOT.VALUE = ROOT.VALUE * -1;
    return ROOT.VALUE;
  };
}
function ORBIT(cx, cy, angle, p) {
  var s = Math.sin(angle);
  var c = Math.cos(angle);
  p.x -= cx;
  p.y -= cy;
  var xnew = p.x * c - p.y * s;
  var ynew = p.x * s + p.y * c;
  p.x = xnew + cx;
  p.y = ynew + cy;
  return p;
}
function ORBIT_FROM_ARRAY(cx, cy, angle, p, byIndexs) {
  var s = Math.sin(angle);
  var c = Math.cos(angle);
  p[byIndexs[0]] -= cx;
  p[byIndexs[1]] -= cy;
  var xnew = p[byIndexs[0]] * c - p[byIndexs[1]] * s;
  var ynew = p[byIndexs[0]] * s + p[byIndexs[1]] * c;
  p[byIndexs[0]] = xnew + cx;
  p[byIndexs[1]] = ynew + cy;
  return p;
}
var byId = function (id) {
  return document.getElementById(id);
};
exports.byId = byId;
function randomFloatFromTo(min, max) {
  return Math.random() * (max - min) + min;
}
function randomIntFromTo(min, max) {
  if (typeof min === 'object' || typeof max === 'object') {
    console.log("SYS : warning Desciption : Replace object with string , this >> " + typeof min + ' and ' + typeof min + ' << must be string or number.');
  } else if (typeof min === 'undefined' || typeof max === 'undefined') {
    console.log("SYS : warning Desciption : arguments (min, max) cant be undefined , this >> " + typeof min + ' and ' + typeof min + ' << must be string or number.');
  } else {
    return Math.floor(Math.random() * (max - min + 1) + min);
  }
}
var urlQuery = exports.urlQuery = function () {
  var query_string = {};
  var query = window.location.search.substring(1);
  var vars = query.split('&');
  for (var i = 0; i < vars.length; i++) {
    var pair = vars[i].split('=');
    if (typeof query_string[pair[0]] === 'undefined') {
      query_string[pair[0]] = decodeURIComponent(pair[1]);
    } else if (typeof query_string[pair[0]] === 'string') {
      var arr = [query_string[pair[0]], decodeURIComponent(pair[1])];
      query_string[pair[0]] = arr;
    } else {
      query_string[pair[0]].push(decodeURIComponent(pair[1]));
    }
  }
  return query_string;
}();
function getAxisRot(q1) {
  var x, y, z;

  // if w>1 acos and sqrt will produce errors, this cant happen if quaternion is normalised
  if (q1.w > 1) q1.normalise();
  var angle = 2 * Math.acos(q1.w);
  // assuming quaternion normalised then w is less than 1, so term always positive.
  var s = Math.sqrt(1 - q1.w * q1.w);
  // test to avoid divide by zero, s is always positive due to sqrt
  if (s < 0.001) {
    // if s close to zero then direction of axis not important
    // if it is important that axis is normalised then replace with x=1; y=z=0;

    x = q1.x;
    y = q1.y;
    z = q1.z;
  } else {
    x = q1.x / s; // normalise axis
    y = q1.y / s;
    z = q1.z / s;
  }
  return [radToDeg(x), radToDeg(y), radToDeg(z)];
}
function getAxisRot2(targetAxis, Q) {
  Q.normalize(); // if w>1 acos and sqrt will produce errors, this cant happen if quaternion is normalised
  var angle = 2 * Math.acos(Q.w());
  var s = Math.sqrt(1 - Q.w() * Q.w()); // assuming quaternion normalised then w is less than 1, so term always positive.
  if (s < 0.001) {
    // test to avoid divide by zero, s is always positive due to sqrt
    // if s close to zero then direction of axis not important
    // if it is important that axis is normalised then replace with x=1; y=z=0;
    // targetAxis.x = 1;
    // targetAxis.y = 0;
    // targetAxis.z = 0;
    targetAxis.x = Q.x();
    targetAxis.y = Q.y();
    targetAxis.z = Q.z();
  } else {
    targetAxis.x = Q.x() / s; // normalise axis
    targetAxis.y = Q.y() / s;
    targetAxis.z = Q.z() / s;
  }
  return [targetAxis, angle];
}
function getAxisRot3(Q) {
  var angle = Math.acos(Q.w) * 2;
  var axis = {};
  if (Math.sin(Math.acos(angle)) > 0) {
    axis.x = Q.x / Math.sin(Math.acos(angle / 2));
    axis.y = Q.y / Math.sin(Math.acos(angle / 2));
    axis.z = Q.z / Math.sin(Math.acos(angle / 2));
  } else {
    axis.x = 0;
    axis.y = 0;
    axis.z = 0;
  }
  return axis;
}

// NTO TESTED
function quaternion_rotation_matrix(Q) {
  // Covert a quaternion into a full three-dimensional rotation matrix.

  // Input
  // :param Q: A 4 element array representing the quaternion (q0,q1,q2,q3) 

  // Output
  // :return: A 3x3 element matrix representing the full 3D rotation matrix. 
  //          This rotation matrix converts a point in the local reference 
  //          frame to a point in the global reference frame.
  // """
  // # Extract the values from Q
  var q0 = Q[0];
  var q1 = Q[1];
  var q2 = Q[2];
  var q3 = Q[3];

  // # First row of the rotation matrix
  var r00 = 2 * (q0 * q0 + q1 * q1) - 1;
  var r01 = 2 * (q1 * q2 - q0 * q3);
  var r02 = 2 * (q1 * q3 + q0 * q2);

  // # Second row of the rotation matrix
  var r10 = 2 * (q1 * q2 + q0 * q3);
  var r11 = 2 * (q0 * q0 + q2 * q2) - 1;
  var r12 = 2 * (q2 * q3 - q0 * q1);

  // # Third row of the rotation matrix
  var r20 = 2 * (q1 * q3 - q0 * q2);
  var r21 = 2 * (q2 * q3 + q0 * q1);
  var r22 = 2 * (q0 * q0 + q3 * q3) - 1;

  // # 3x3 rotation matrix
  var rot_matrix = [[r00, r01, r02], [r10, r11, r12], [r20, r21, r22]];
  return rot_matrix;
}

// copnsole log graphics
const LOG_WARN = exports.LOG_WARN = 'background: gray; color: yellow; font-size:10px';
const LOG_INFO = exports.LOG_INFO = 'background: green; color: white; font-size:11px';
const LOG_MATRIX = exports.LOG_MATRIX = "font-family: stormfaze;color: #lime; font-size:11px;text-shadow: 2px 2px 4px orangered;background: black;";
const LOG_FUNNY = exports.LOG_FUNNY = "font-family: stormfaze;color: #f1f033; font-size:14px;text-shadow: 2px 2px 4px #f335f4, 4px 4px 4px #d64444, 2px 2px 4px #c160a6, 6px 2px 0px #123de3;background: black;";
const LOG_FUNNY_SMALL = exports.LOG_FUNNY_SMALL = "font-family: stormfaze;color: #f1f033; font-size:10px;text-shadow: 2px 2px 4px #f335f4, 4px 4px 4px #d64444, 1px 1px 2px #c160a6, 3px 1px 0px #123de3;background: black;";
function genName(length) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
let mb = exports.mb = {
  root: () => byId('msgBox'),
  pContent: () => byId('not-content'),
  copy: function () {
    navigator.clipboard.writeText(mb.root().children[0].innerText);
  },
  c: 0,
  ic: 0,
  t: {},
  setContent: function (content, t) {
    var iMsg = document.createElement('div');
    iMsg.innerHTML = content;
    iMsg.id = `msgbox-loc-${mb.c}`;
    mb.root().appendChild(iMsg);
    iMsg.classList.add('animate1');
    if (t == 'ok') {
      iMsg.style = 'font-family: stormfaze;color:white;padding:7px;margin:2px';
    } else {
      iMsg.style = 'font-family: stormfaze;color:white;padding:7px;margin:2px';
    }
  },
  kill: function () {
    mb.root().remove();
  },
  show: function (content, t) {
    mb.setContent(content, t);
    mb.root().style.display = "block";
    var loc2 = mb.c;
    setTimeout(function () {
      byId(`msgbox-loc-${loc2}`).classList.remove("fadeInDown");
      byId(`msgbox-loc-${loc2}`).classList.add("fadeOut");
      setTimeout(function () {
        byId(`msgbox-loc-${loc2}`).style.display = "none";
        byId(`msgbox-loc-${loc2}`).classList.remove("fadeOut");
        byId(`msgbox-loc-${loc2}`).remove();
        mb.ic++;
        if (mb.c == mb.ic) {
          mb.root().style.display = 'none';
        }
      }, 1000);
    }, 3000);
    mb.c++;
  },
  error: function (content) {
    if (mb.root() == null) return;
    mb.root().classList.remove("success");
    mb.root().classList.add("error");
    mb.root().classList.add("fadeInDown");
    mb.show(content, 'err');
  },
  success: function (content) {
    if (mb.root() == null) return;
    mb.root().classList.remove("error");
    mb.root().classList.add("success");
    mb.root().classList.add("fadeInDown");
    mb.show(content, 'ok');
  }
};

// Registry to track running animations per element
const typingStates = new Map();
function typeText(elementId, htmlString, delay = 50) {
  const el = document.getElementById(elementId);
  if (!el) return;

  // If an existing typing is running for this element, cancel it
  if (typingStates.has(elementId)) {
    clearTimeout(typingStates.get(elementId).timeoutId);
    typingStates.delete(elementId);
  }
  el.innerHTML = ''; // Clear previous content

  const tempEl = document.createElement('div');
  tempEl.innerHTML = htmlString;
  const queue = [];
  function flatten(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      queue.push({
        type: 'text',
        text: node.textContent
      });
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      if (node.tagName.toLowerCase() === 'img') {
        queue.push({
          type: 'img',
          src: node.getAttribute('src'),
          alt: node.getAttribute('alt') || ''
        });
      } else {
        queue.push({
          type: 'element',
          tag: node.tagName.toLowerCase(),
          attributes: Object.fromEntries([...node.attributes].map(attr => [attr.name, attr.value]))
        });
        for (const child of node.childNodes) flatten(child);
        queue.push({
          type: 'end'
        });
      }
    }
  }
  for (const node of tempEl.childNodes) flatten(node);
  let stack = [];
  let currentElement = el;
  function typeNextChar() {
    if (queue.length === 0) {
      typingStates.delete(elementId); // Cleanup after finish
      return;
    }
    const item = queue[0];
    if (item.type === 'text') {
      if (!item.index) item.index = 0;
      const ch = item.text[item.index];
      if (ch === '\n') {
        currentElement.appendChild(document.createElement('br'));
      } else {
        currentElement.appendChild(document.createTextNode(ch));
      }
      item.index++;
      if (item.index >= item.text.length) queue.shift();
    } else if (item.type === 'element') {
      const newEl = document.createElement(item.tag);
      if (item.attributes) {
        for (let [key, val] of Object.entries(item.attributes)) {
          newEl.setAttribute(key, val);
        }
      }
      currentElement.appendChild(newEl);
      stack.push(currentElement);
      currentElement = newEl;
      queue.shift();
    } else if (item.type === 'end') {
      currentElement = stack.pop();
      queue.shift();
    } else if (item.type === 'img') {
      const img = document.createElement('img');
      img.src = item.src;
      img.alt = item.alt;
      img.style.maxWidth = '100px';
      img.style.verticalAlign = 'middle';
      currentElement.appendChild(img);
      queue.shift();
    }

    // Schedule next step and store timeoutId for control
    const timeoutId = setTimeout(typeNextChar, delay);
    typingStates.set(elementId, {
      timeoutId
    });
  }
  typeNextChar();
}
function setupCanvasFilters(canvasId) {
  let canvas = document.getElementById(canvasId);
  if (canvas == null) {
    canvas = document.getElementsByTagName('canvas')[0];
  }
  const filterState = {
    blur: "0px",
    grayscale: "0%",
    brightness: "100%",
    contrast: "100%",
    saturate: "100%",
    sepia: "0%",
    invert: "0%",
    hueRotate: "0deg"
  };
  function updateFilter() {
    const filterString = `
      blur(${filterState.blur}) 
      grayscale(${filterState.grayscale}) 
      brightness(${filterState.brightness}) 
      contrast(${filterState.contrast}) 
      saturate(${filterState.saturate}) 
      sepia(${filterState.sepia}) 
      invert(${filterState.invert}) 
      hue-rotate(${filterState.hueRotate})
    `.trim();
    canvas.style.filter = filterString;
  }
  const bindings = {
    blurControl: "blur",
    grayscaleControl: "grayscale",
    brightnessControl: "brightness",
    contrastControl: "contrast",
    saturateControl: "saturate",
    sepiaControl: "sepia",
    invertControl: "invert",
    hueControl: "hueRotate"
  };
  Object.entries(bindings).forEach(([selectId, key]) => {
    const el = document.getElementById(selectId);
    el.addEventListener("change", e => {
      filterState[key] = e.target.value;
      updateFilter();
    });
  });
  updateFilter(); // Initial
}

},{}],29:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.MultiLang = void 0;
var _utils = require("../engine/utils");
class MultiLang {
  constructor() {
    addEventListener('updateLang', () => {
      console.log('Multilang updated.');
      this.update();
    });
  }
  update = function () {
    var allTranDoms = document.querySelectorAll('[data-label]');
    allTranDoms.forEach(i => {
      i.innerHTML = this.get[i.getAttribute('data-label')];
    });
  };
  loadMultilang = async function (lang = 'en') {
    lang = 'res/multilang/' + lang + '.json';
    console.info(`%cMultilang: ${lang}`, _utils.LOG_MATRIX);
    try {
      const r = await fetch(lang, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      return await r.json();
    } catch (err) {
      console.warn('Not possible to access multilang json asset! Err => ', err);
      return {};
    }
  };
}
exports.MultiLang = MultiLang;

},{"../engine/utils":28}],30:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _utils = require("../engine/utils");
class MatrixAmmo {
  constructor() {
    // THIS PATH IS PATH FROM PUBLIC FINAL FOLDER
    _utils.scriptManager.LOAD("https://maximumroulette.com/apps/megpu/ammo.js", "ammojs", undefined, undefined, this.init);
    this.lastRoll = '';
    this.presentScore = '';
    this.speedUpSimulation = 1;
  }
  init = () => {
    Ammo().then(Ammo => {
      // Physics variables
      this.dynamicsWorld = null;
      this.rigidBodies = [];
      this.Ammo = Ammo;
      this.lastUpdate = 0;
      console.log("%c Ammo core loaded.", _utils.LOG_FUNNY);
      this.initPhysics();
      // simulate async
      setTimeout(() => {
        dispatchEvent(new CustomEvent('AmmoReady', {}));
      }, 200);
    });
  };
  initPhysics() {
    let Ammo = this.Ammo;
    // Physics configuration
    var collisionConfiguration = new Ammo.btDefaultCollisionConfiguration(),
      dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration),
      overlappingPairCache = new Ammo.btDbvtBroadphase(),
      solver = new Ammo.btSequentialImpulseConstraintSolver();
    this.dynamicsWorld = new Ammo.btDiscreteDynamicsWorld(dispatcher, overlappingPairCache, solver, collisionConfiguration);
    this.dynamicsWorld.setGravity(new Ammo.btVector3(0, -10, 0));
    var groundShape = new Ammo.btBoxShape(new Ammo.btVector3(70, 1, 70)),
      groundTransform = new Ammo.btTransform();
    groundTransform.setIdentity();
    groundTransform.setOrigin(new Ammo.btVector3(0, -4.45, 0));
    var mass = 0,
      isDynamic = mass !== 0,
      localInertia = new Ammo.btVector3(0, 0, 0);
    if (isDynamic) groundShape.calculateLocalInertia(mass, localInertia);
    var myMotionState = new Ammo.btDefaultMotionState(groundTransform),
      rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, myMotionState, groundShape, localInertia),
      body = new Ammo.btRigidBody(rbInfo);
    body.name = 'ground';
    this.ground = body;
    this.dynamicsWorld.addRigidBody(body);
    this.detectCollision();
  }
  addPhysics(MEObject, pOptions) {
    if (pOptions.geometry == "Sphere") {
      this.addPhysicsSphere(MEObject, pOptions);
    } else if (pOptions.geometry == "Cube") {
      this.addPhysicsBox(MEObject, pOptions);
    }
  }
  addPhysicsSphere(MEObject, pOptions) {
    const FLAGS = {
      TEST_NIDZA: 3,
      CF_KINEMATIC_OBJECT: 2
    };
    let Ammo = this.Ammo;
    var colShape = new Ammo.btSphereShape(Array.isArray(pOptions.radius) ? pOptions.radius[0] : pOptions.radius),
      startTransform = new Ammo.btTransform();
    startTransform.setIdentity();
    var mass = 1;
    var localInertia = new Ammo.btVector3(0, 0, 0);
    colShape.calculateLocalInertia(mass, localInertia);
    startTransform.setOrigin(new Ammo.btVector3(pOptions.position.x, pOptions.position.y, pOptions.position.z));
    var myMotionState = new Ammo.btDefaultMotionState(startTransform),
      rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, myMotionState, colShape, localInertia),
      body = new Ammo.btRigidBody(rbInfo);
    if (pOptions.mass == 0 && typeof pOptions.state == 'undefined' && typeof pOptions.collide == 'undefined') {
      body.setActivationState(2);
      body.setCollisionFlags(FLAGS.CF_KINEMATIC_OBJECT);
      // console.log('what is pOptions.mass and state is 2 ....', pOptions.mass)
    } else if (typeof pOptions.collide != 'undefined' && pOptions.collide == false) {
      // idea not work for now - eliminate collide effect
      body.setActivationState(4);
      body.setCollisionFlags(FLAGS.TEST_NIDZA);
    } else {
      body.setActivationState(4);
    }
    body.name = pOptions.name;
    MEObject.itIsPhysicsBody = true;
    body.MEObject = MEObject;
    this.dynamicsWorld.addRigidBody(body);
    this.rigidBodies.push(body);
    return body;
  }
  addPhysicsBox(MEObject, pOptions) {
    const FLAGS = {
      TEST_NIDZA: 3,
      CF_KINEMATIC_OBJECT: 2
    };
    let Ammo = this.Ammo;
    // improve this - scale by comp
    var colShape = new Ammo.btBoxShape(new Ammo.btVector3(pOptions.scale[0], pOptions.scale[1], pOptions.scale[2])),
      startTransform = new Ammo.btTransform();
    startTransform.setIdentity();
    var mass = pOptions.mass;
    var localInertia = new Ammo.btVector3(0, 0, 0);
    colShape.calculateLocalInertia(mass, localInertia);
    startTransform.setOrigin(new Ammo.btVector3(pOptions.position.x, pOptions.position.y, pOptions.position.z));
    // console.log('startTransform.setRotation', startTransform.setRotation)
    var t = startTransform.getRotation();
    t.setX((0, _utils.degToRad)(pOptions.rotation.x));
    t.setY((0, _utils.degToRad)(pOptions.rotation.y));
    t.setZ((0, _utils.degToRad)(pOptions.rotation.z));
    startTransform.setRotation(t);
    var myMotionState = new Ammo.btDefaultMotionState(startTransform),
      rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, myMotionState, colShape, localInertia),
      body = new Ammo.btRigidBody(rbInfo);
    if (pOptions.mass == 0 && typeof pOptions.state == 'undefined' && typeof pOptions.collide == 'undefined') {
      body.setActivationState(2);
      body.setCollisionFlags(FLAGS.CF_KINEMATIC_OBJECT);
      // console.log('what is pOptions.mass and state is 2 ....', pOptions.mass)
    } else if (typeof pOptions.collide != 'undefined' && pOptions.collide == false) {
      // idea not work for now - eliminate collide effect
      body.setActivationState(4);
      body.setCollisionFlags(FLAGS.TEST_NIDZA);
    } else {
      body.setActivationState(4);
    }
    body.name = pOptions.name;
    MEObject.itIsPhysicsBody = true;
    body.MEObject = MEObject;
    this.dynamicsWorld.addRigidBody(body);
    this.rigidBodies.push(body);
    return body;
  }
  setBodyVelocity(body, x, y, z) {
    var tbv30 = new Ammo.btVector3();
    tbv30.setValue(x, y, z);
    body.setLinearVelocity(tbv30);
  }
  setKinematicTransform(body, x, y, z, rx, ry, rz) {
    if (typeof rx == 'undefined') {
      var rx = 0;
    }
    if (typeof ry == 'undefined') {
      var ry = 0;
    }
    if (typeof rz == 'undefined') {
      var rz = 0;
    }
    let pos = new Ammo.btVector3();
    // let quat = new Ammo.btQuaternion();
    pos = body.getWorldTransform().getOrigin();
    let localRot = body.getWorldTransform().getRotation();
    // console.log('pre pos x:', pos.x(), " y : ", pos.y(), " z:", pos.z())
    pos.setX(pos.x() + x);
    pos.setY(pos.y() + y);
    pos.setZ(pos.z() + z);
    localRot.setX(rx);
    localRot.setY(ry);
    localRot.setZ(rz);
    let physicsBody = body;
    let ms = physicsBody.getMotionState();
    if (ms) {
      var tmpTrans = new Ammo.btTransform();
      tmpTrans.setIdentity();
      tmpTrans.setOrigin(pos);
      tmpTrans.setRotation(localRot);
      ms.setWorldTransform(tmpTrans);
    }
  }
  getBodyByName(name) {
    var b = null;
    this.rigidBodies.forEach((item, index, array) => {
      if (item.name == name) {
        b = array[index];
      }
    });
    return b;
  }
  getNameByBody(body) {
    var b = null;
    this.rigidBodies.forEach((item, index, array) => {
      if (item.kB == body.kB) {
        b = array[index].name;
      }
    });
    return b;
  }
  deactivatePhysics(body) {
    const CF_KINEMATIC_OBJECT = 2;
    const DISABLE_DEACTIVATION = 4;
    // 1. Remove from world
    this.dynamicsWorld.removeRigidBody(body);
    // 2. Set body to kinematic
    const flags = body.getCollisionFlags();
    body.setCollisionFlags(flags | CF_KINEMATIC_OBJECT);
    body.setActivationState(DISABLE_DEACTIVATION); // no auto-wakeup
    // 3. Clear motion
    const zero = new Ammo.btVector3(0, 0, 0);
    body.setLinearVelocity(zero);
    body.setAngularVelocity(zero);
    // 4. Reset transform to current position (optional — preserves pose)
    const currentTransform = body.getWorldTransform();
    body.setWorldTransform(currentTransform);
    body.getMotionState().setWorldTransform(currentTransform);
    // 5. Add back to physics world
    this.matrixAmmo.dynamicsWorld.addRigidBody(body);
    // 6. Mark it manually (logic flag)
    body.isKinematic = true;
  }
  detectCollision() {
    // console.log('override this')
    return;
    this.lastRoll = '';
    this.presentScore = '';
    let dispatcher = this.dynamicsWorld.getDispatcher();
    let numManifolds = dispatcher.getNumManifolds();
    for (let i = 0; i < numManifolds; i++) {
      let contactManifold = dispatcher.getManifoldByIndexInternal(i);
      // let numContacts = contactManifold.getNumContacts();
      // this.rigidBodies.forEach((item) => {
      //   if(item.kB == contactManifold.getBody0().kB) {
      //     // console.log('Detected body0 =', item.name)
      //   }
      if (this.ground.kB == contactManifold.getBody0().kB && this.getNameByBody(contactManifold.getBody1()) == 'CubePhysics1') {
        // console.log(this.ground ,'GROUND IS IN CONTACT WHO IS BODY1 ', contactManifold.getBody1())
        // console.log('GROUND IS IN CONTACT WHO IS BODY1 getNameByBody  ', this.getNameByBody(contactManifold.getBody1()))
        // CHECK ROTATION
        var testR = contactManifold.getBody1().getWorldTransform().getRotation();
        console.log('this.lastRoll = ', this.lastRoll, ' presentScore = ', this.presentScore);
      }
    }
  }
  updatePhysics() {
    if (typeof Ammo === 'undefined') return;
    const trans = new Ammo.btTransform();
    const transform = new Ammo.btTransform();
    this.rigidBodies.forEach(function (body) {
      if (body.isKinematic) {
        transform.setIdentity();
        transform.setOrigin(new Ammo.btVector3(body.MEObject.position.x, body.MEObject.position.y, body.MEObject.position.z));
        const quat = new Ammo.btQuaternion();
        quat.setRotation(new Ammo.btVector3(body.MEObject.rotation.axis.x, body.MEObject.rotation.axis.y, body.MEObject.rotation.axis.z), (0, _utils.degToRad)(body.MEObject.rotation.angle));
        transform.setRotation(quat);
        body.setWorldTransform(transform);
        const ms = body.getMotionState();
        if (ms) ms.setWorldTransform(transform);
      }
    });
    Ammo.destroy(transform);

    // Step simulation AFTER setting kinematic transforms
    const timeStep = 1 / 60;
    const maxSubSteps = 10;
    for (let i = 0; i < this.speedUpSimulation; i++) {
      this.dynamicsWorld.stepSimulation(timeStep, maxSubSteps);
    }
    this.rigidBodies.forEach(function (body) {
      if (!body.isKinematic && body.getMotionState()) {
        body.getMotionState().getWorldTransform(trans);
        const _x = +trans.getOrigin().x().toFixed(2);
        const _y = +trans.getOrigin().y().toFixed(2);
        const _z = +trans.getOrigin().z().toFixed(2);
        body.MEObject.position.setPosition(_x, _y, _z);
        const rot = trans.getRotation();
        const rotAxis = rot.getAxis();
        rot.normalize();
        body.MEObject.rotation.axis.x = rotAxis.x();
        body.MEObject.rotation.axis.y = rotAxis.y();
        body.MEObject.rotation.axis.z = rotAxis.z();
        body.MEObject.rotation.matrixRotation = (0, _utils.quaternion_rotation_matrix)(rot);
        body.MEObject.rotation.angle = (0, _utils.radToDeg)(parseFloat(rot.getAngle().toFixed(2)));
      }
    });
    Ammo.destroy(trans);
    this.detectCollision();
  }
}
exports.default = MatrixAmmo;

},{"../engine/utils":28}],31:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.fragmentVideoWGSL = void 0;
let fragmentVideoWGSL = exports.fragmentVideoWGSL = `override shadowDepthTextureSize: f32 = 1024.0;

struct Scene {
  lightViewProjMatrix : mat4x4f,
  cameraViewProjMatrix : mat4x4f,
  lightPos : vec3f,
}

@group(0) @binding(0) var<uniform> scene : Scene;
@group(0) @binding(1) var shadowMap: texture_depth_2d;
@group(0) @binding(2) var shadowSampler: sampler_comparison;
@group(0) @binding(3) var meshTexture: texture_external;
@group(0) @binding(4) var meshSampler: sampler;
@group(0) @binding(5) var<uniform> postFXMode: u32;

// ❌ No binding(4) here!

struct FragmentInput {
  @location(0) shadowPos : vec4f,
  @location(1) fragPos : vec3f,
  @location(2) fragNorm : vec3f,
  @location(3) uv : vec2f,
}

const albedo = vec3f(0.9);
const ambientFactor = 0.7;

@fragment
fn main(input : FragmentInput) -> @location(0) vec4f {
  // Shadow filtering
  var visibility = 0.0;
  let oneOverShadowDepthTextureSize = 1.0 / shadowDepthTextureSize;
  for (var y = -1; y <= 1; y++) {
    for (var x = -1; x <= 1; x++) {
      let offset = vec2f(vec2(x, y)) * oneOverShadowDepthTextureSize;
      visibility += textureSampleCompare(
        shadowMap, shadowSampler,
        input.shadowPos.xy + offset, input.shadowPos.z - 0.007
      );
    }
  }
  visibility /= 9.0;

  let lambertFactor = max(dot(normalize(scene.lightPos - input.fragPos), normalize(input.fragNorm)), 0.0);
  let lightingFactor = min(ambientFactor + visibility * lambertFactor, 1.0);

  // ✅ Correct way to sample video texture
  let textureColor = textureSampleBaseClampToEdge(meshTexture, meshSampler, input.uv);
  let color: vec4f = vec4(textureColor.rgb * lightingFactor * albedo, 1.0);

   switch (postFXMode) {
    case 0: {
      // Default
      return color;
    }
    case 1: {
      // Invert
      return vec4f(1.0 - color.rgb, color.a);
    }
    case 2: {
      // Grayscale
      let gray = dot(color.rgb, vec3f(0.299, 0.587, 0.114));
      return vec4f(vec3f(gray), color.a);
    }
    case 3: {
      // Chroma Key
      let keyColor = vec3f(0.0, 1.0, 0.0);
      let threshold = 0.3;
      let diff = distance(color.rgb, keyColor);
      if (diff < threshold) {
        return vec4f(0.0, 0.0, 0.0, 0.0);
      }
      return color;
    }
    default: {
      return color;
    }
  }

  // return color;
}
`;

},{}],32:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.fragmentWGSL = void 0;
let fragmentWGSL = exports.fragmentWGSL = `override shadowDepthTextureSize: f32 = 1024.0;

// Created by Nikola Lukic with chatgtp assist.

struct Scene {
    lightViewProjMatrix  : mat4x4f,
    cameraViewProjMatrix : mat4x4f,
    cameraPos            : vec3f,
    padding2             : f32,   // align to 16 bytes
    lightPos             : vec3f,
    padding              : f32,   // align to 16 bytes
    globalAmbient        : vec3f,  // <--- new
    padding3             : f32,    // keep alignment (16 bytes)
};

struct SpotLight {
    position      : vec3f,
    _pad1         : f32,

    direction     : vec3f,
    _pad2         : f32,

    innerCutoff   : f32,
    outerCutoff   : f32,
    intensity     : f32,
    _pad3         : f32,

    color         : vec3f,
    _pad4         : f32,

    range         : f32,
    ambientFactor : f32,
    shadowBias    : f32,
    _pad5         : f32,

    lightViewProj : mat4x4<f32>,
};

const MAX_SPOTLIGHTS = 20u;

@group(0) @binding(0) var<uniform> scene : Scene;
@group(0) @binding(1) var shadowMapArray: texture_depth_2d_array;
@group(0) @binding(2) var shadowSampler: sampler_comparison;
@group(0) @binding(3) var meshTexture: texture_2d<f32>;
@group(0) @binding(4) var meshSampler: sampler;
@group(0) @binding(5) var<uniform> spotlights: array<SpotLight, MAX_SPOTLIGHTS>;

struct FragmentInput {
    @location(0) shadowPos : vec4f,
    @location(1) fragPos   : vec3f,
    @location(2) fragNorm  : vec3f,
    @location(3) uv        : vec2f,
}

const albedo = vec3f(0.9);

fn calculateSpotlightFactor(light: SpotLight, fragPos: vec3f) -> f32 {
    let L = normalize(light.position - fragPos);
    let theta = dot(L, normalize(-light.direction));
    let epsilon = light.innerCutoff - light.outerCutoff;
    return clamp((theta - light.outerCutoff) / epsilon, 0.0, 1.0);
}

fn computeSpotLight(light: SpotLight, normal: vec3f, fragPos: vec3f, viewDir: vec3f) -> vec3f {
    let L = light.position - fragPos;
    let distance = length(L);
    let lightDir = normalize(L);

    let spotFactor = calculateSpotlightFactor(light, fragPos);
    let atten = clamp(1.0 - (distance / light.range), 0.0, 1.0);

    let diff = max(dot(normal, lightDir), 0.0);
    let halfwayDir = normalize(lightDir + viewDir);
    let spec = pow(max(dot(normal, halfwayDir), 0.0), 32.0);

    let diffuse  = diff * light.color * light.intensity * atten;
    let specular = spec * light.color * light.intensity * atten;

    return (diffuse + specular) * spotFactor;
}

// Corrected PCF for texture_depth_2d_array
fn sampleShadow(shadowUV: vec2f, layer: i32, depthRef: f32, normal: vec3f, lightDir: vec3f) -> f32 {
    var visibility: f32 = 0.0;
    let biasConstant: f32 = 0.001;
    // Slope bias: avoid self-shadowing on steep angles
    // let slopeBias: f32 = max(0.002 * (1.0 - dot(normal, lightDir)), 0.0);
    let bias = biasConstant;//  + slopeBias;

    let oneOverSize = 1.0 / (shadowDepthTextureSize  * 0.5);

    // 3x3 PCF kernel
    let offsets: array<vec2f, 9> = array<vec2f, 9>(
        vec2(-1.0, -1.0), vec2(0.0, -1.0), vec2(1.0, -1.0),
        vec2(-1.0,  0.0), vec2(0.0,  0.0), vec2(1.0,  0.0),
        vec2(-1.0,  1.0), vec2(0.0,  1.0), vec2(1.0,  1.0)
    );

    for(var i: u32 = 0u; i < 9u; i = i + 1u) {
        visibility += textureSampleCompare(
            shadowMapArray,
            shadowSampler,
            shadowUV + offsets[i] * oneOverSize,
            layer,
            depthRef //+ bias
        );
    }
    return visibility / 9.0;
}

@fragment
fn main(input: FragmentInput) -> @location(0) vec4f {
    let norm = normalize(input.fragNorm);

    let viewDir = normalize(scene.cameraPos - input.fragPos);
    // let viewDir = normalize(scene.cameraViewProjMatrix[3].xyz - input.fragPos);

    var lightContribution = vec3f(0.0);
    var ambient = vec3f(0.5);

    for (var i: u32 = 0u; i < MAX_SPOTLIGHTS; i = i + 1u) {
        let sc = spotlights[i].lightViewProj * vec4<f32>(input.fragPos, 1.0);
        let p  = sc.xyz / sc.w;
        let uv = clamp(p.xy * 0.5 + vec2<f32>(0.5), vec2<f32>(0.0), vec2<f32>(1.0));
        let depthRef = p.z * 0.5 + 0.5;
        let lightDir = normalize(spotlights[i].position - input.fragPos);
        let angleFactor = 1.0 - dot(norm, lightDir);
        let slopeBias = 0.01 * (1.0 - dot(norm, lightDir));
        let bias = spotlights[i].shadowBias + slopeBias;
        let visibility = sampleShadow(uv, i32(i), depthRef - bias, norm, lightDir);
        let contrib = computeSpotLight(spotlights[i], norm, input.fragPos, viewDir);
        lightContribution += contrib * visibility;
        // ambient += spotlights[i].ambientFactor * spotlights[i].color;
    }
    // ambient /= f32(MAX_SPOTLIGHTS); PREVENT OVER NEXT FEATURE ON SWICHER
    let texColor = textureSample(meshTexture, meshSampler, input.uv);
    let finalColor = texColor.rgb * (scene.globalAmbient + lightContribution); // * albedo;
    return vec4f(finalColor, 1.0);
}`;

},{}],33:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.UNLIT_SHADER = void 0;
/**
 * @description
 * UNIT Texures -
 * Good for performance
 */
const UNLIT_SHADER = exports.UNLIT_SHADER = `struct Uniforms {
  viewProjectionMatrix : mat4x4f
}
@group(0) @binding(0) var<uniform> uniforms : Uniforms;

@group(1) @binding(0) var<uniform> modelMatrix : mat4x4f;

struct VertexInput {
  @location(0) position : vec4f,
  @location(1) normal : vec3f,
  @location(2) uv : vec2f
}

struct VertexOutput {
  @builtin(position) position : vec4f,
  @location(0) normal: vec3f,
  @location(1) uv : vec2f,
}

@vertex
fn vertexMain(input: VertexInput) -> VertexOutput {
  var output : VertexOutput;
  output.position = uniforms.viewProjectionMatrix * modelMatrix * input.position;
  output.normal = normalize((modelMatrix * vec4(input.normal, 0)).xyz);
  output.uv = input.uv;
  return output;
}

@group(1) @binding(1) var meshSampler: sampler;
@group(1) @binding(2) var meshTexture: texture_2d<f32>;

// Static directional lighting
const lightDir = vec3f(0, 1, 0);
const dirColor = vec3(1);
const ambientColor = vec3f(0.05);

@fragment
fn fragmentMain(input: VertexOutput) -> @location(0) vec4f {
  let textureColor = textureSample(meshTexture, meshSampler, input.uv);

  // Very simplified lighting algorithm.
  let lightColor = saturate(ambientColor + max(dot(input.normal, lightDir), 0.0) * dirColor);

  return vec4f(textureColor.rgb * lightColor, textureColor.a);
}`;

},{}],34:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.vertexWGSL = void 0;
let vertexWGSL = exports.vertexWGSL = `const MAX_BONES = 100u;

struct Scene {
  lightViewProjMatrix: mat4x4f,
  cameraViewProjMatrix: mat4x4f,
  lightPos: vec3f,
}

struct Model {
  modelMatrix: mat4x4f,
}

struct Bones {
  boneMatrices : array<mat4x4f, MAX_BONES>
}

struct SkinResult {
  position : vec4f,
  normal   : vec3f,
};

@group(0) @binding(0) var<uniform> scene : Scene;
@group(1) @binding(0) var<uniform> model : Model;
@group(1) @binding(1) var<uniform> bones : Bones;

struct VertexOutput {
  @location(0) shadowPos: vec4f,
  @location(1) fragPos: vec3f,
  @location(2) fragNorm: vec3f,
  @location(3) uv: vec2f,
  @builtin(position) Position: vec4f,
}

// skinning helper
fn skinVertex(pos: vec4f, nrm: vec3f, joints: vec4<u32>, weights: vec4f) -> SkinResult {
    var skinnedPos = vec4f(0.0);
    var skinnedNorm = vec3f(0.0);

    for (var i: u32 = 0u; i < 4u; i = i + 1u) {
        let jointIndex = joints[i];
        let w = weights[i];
        if (w > 0.0) {
          let boneMat = bones.boneMatrices[jointIndex];
          skinnedPos  += (boneMat * pos) * w;
          let boneMat3 = mat3x3f(
            boneMat[0].xyz,
            boneMat[1].xyz,
            boneMat[2].xyz
          );
          skinnedNorm += (boneMat3 * nrm) * w;
        }
    }

    // return SkinResult(skinnedPos, normalize(skinnedNorm));
    return SkinResult(skinnedPos, skinnedNorm);
}

@vertex
fn main(
  @location(0) position: vec3f,
  @location(1) normal: vec3f,
  @location(2) uv: vec2f,
  @location(3) joints: vec4<u32>,
  @location(4) weights: vec4<f32>
) -> VertexOutput {
  var output : VertexOutput;

  var pos = vec4(position, 1.0);
  var nrm = normal;

  // apply skinning
  let skinned = skinVertex(pos, nrm, joints, weights);

  // transform to world
  let worldPos = model.modelMatrix * skinned.position;
  // let worldPos =  skinned.position;
  let normalMatrix = mat3x3f(
    model.modelMatrix[0].xyz,
    model.modelMatrix[1].xyz,
    model.modelMatrix[2].xyz
  );

  output.Position = scene.cameraViewProjMatrix * worldPos;
  output.fragPos = worldPos.xyz;

  output.shadowPos = scene.lightViewProjMatrix * worldPos;
  output.fragNorm = normalize(normalMatrix * skinned.normal);
  // output.fragNorm = skinned.normal;
  output.uv = uv;

  return output;
}`;

},{}],35:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.vertexShadowWGSL = void 0;
let vertexShadowWGSL = exports.vertexShadowWGSL = `struct Scene {
  lightViewProjMatrix: mat4x4f,
  cameraViewProjMatrix: mat4x4f,
  lightPos: vec3f,
}

struct Model {
  modelMatrix: mat4x4f,
}

@group(0) @binding(0) var<uniform> scene : Scene;
@group(1) @binding(0) var<uniform> model : Model;

@vertex
fn main(
  @location(0) position: vec3f
) -> @builtin(position) vec4f {
  return scene.lightViewProjMatrix * model.modelMatrix * vec4(position, 1);
}
`;

},{}],36:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.MatrixSounds = void 0;
class MatrixSounds {
  constructor() {
    this.volume = 0.5;
    this.audios = {};
    this.enabled = true; // 🔇 global flag to mute/allow audio
  }
  muteAll() {
    this.enabled = false;
    Object.values(this.audios).forEach(audio => audio.pause());
  }
  unmuteAll() {
    this.enabled = true;
  }
  createClones(c, name, path) {
    for (let x = 1; x < c; x++) {
      const a = new Audio(path);
      a.id = name + x;
      a.volume = this.volume;
      this.audios[name + x] = a;
      document.body.append(a);
    }
  }
  createAudio(name, path, useClones) {
    const a = new Audio(path);
    a.id = name;
    a.volume = this.volume;
    this.audios[name] = a;
    document.body.append(a);
    if (typeof useClones !== 'undefined') {
      this.createClones(useClones, name, path);
    }
  }
  play(name) {
    if (!this.enabled) return; // 🔇 prevent playing if muted

    const audio = this.audios[name];
    if (!audio) return;
    if (audio.paused) {
      audio.play().catch(e => {
        if (e.name !== 'NotAllowedError') console.warn("sounds error:", e);
      });
    } else {
      this.tryClone(name);
    }
  }
  tryClone(name) {
    if (!this.enabled) return; // 🔇 prevent playing clones

    let cc = 1;
    try {
      while (this.audios[name + cc] && this.audios[name + cc].paused === false) {
        cc++;
      }
      if (this.audios[name + cc]) {
        this.audios[name + cc].play();
      }
    } catch (err) {
      console.warn("Clone play failed:", err);
    }
  }
}
exports.MatrixSounds = MatrixSounds;

},{}],37:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _wgpuMatrix = require("wgpu-matrix");
var _ball = _interopRequireDefault(require("./engine/ball.js"));
var _cube = _interopRequireDefault(require("./engine/cube.js"));
var _engine = require("./engine/engine.js");
var _meshObj = _interopRequireDefault(require("./engine/mesh-obj.js"));
var _matrixAmmo = _interopRequireDefault(require("./physics/matrix-ammo.js"));
var _utils = require("./engine/utils.js");
var _lang = require("./multilang/lang.js");
var _sounds = require("./sounds/sounds.js");
var _loaderObj = require("./engine/loader-obj.js");
var _lights = require("./engine/lights.js");
var _bvh = require("./engine/loaders/bvh.js");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
/**
 * @description
 * Main engine root class.
 * @author Nikola Lukic 2025
 * @email zlatnaspirala@gmail.com
 * @web https://maximumroulette.com
 * @github zlatnaspirala
 */
class MatrixEngineWGPU {
  mainRenderBundle = [];
  lightContainer = [];
  frame = () => {};
  entityHolder = [];
  lastTime = 0;
  entityArgPass = {
    loadOp: 'clear',
    storeOp: 'store',
    depthLoadOp: 'clear',
    depthStoreOp: 'store'
  };
  matrixAmmo = new _matrixAmmo.default();
  matrixSounds = new _sounds.MatrixSounds();
  constructor(options, callback) {
    if (typeof options == 'undefined' || typeof options == "function") {
      this.options = {
        useSingleRenderPass: true,
        canvasSize: 'fullscreen',
        canvasId: 'canvas1',
        mainCameraParams: {
          type: 'WASD',
          responseCoef: 2000
        },
        clearColor: {
          r: 0.584,
          g: 0,
          b: 0.239,
          a: 1.0
        }
      };
      callback = options;
    }
    if (typeof options.clearColor === 'undefined') {
      options.clearColor = {
        r: 0.584,
        g: 0,
        b: 0.239,
        a: 1.0
      };
    }
    if (typeof options.canvasId === 'undefined') {
      options.canvasId = 'canvas1';
    }
    if (typeof options.mainCameraParams === 'undefined') {
      options.mainCameraParams = {
        type: 'WASD',
        responseCoef: 2000
      };
    }
    this.options = options;
    this.mainCameraParams = options.mainCameraParams;
    const target = this.options.appendTo || document.body;
    var canvas = document.createElement('canvas');
    canvas.id = this.options.canvasId;
    if (this.options.canvasSize == 'fullscreen') {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    } else {
      canvas.width = this.options.canvasSize.w;
      canvas.height = this.options.canvasSize.h;
    }
    target.append(canvas);

    // The camera types
    const initialCameraPosition = _wgpuMatrix.vec3.create(0, 0, 0);
    this.mainCameraParams = {
      type: this.options.mainCameraParams.type,
      responseCoef: this.options.mainCameraParams.responseCoef
    };
    this.cameras = {
      arcball: new _engine.ArcballCamera({
        position: initialCameraPosition
      }),
      WASD: new _engine.WASDCamera({
        position: initialCameraPosition,
        canvas: canvas
      })
    };
    this.label = new _lang.MultiLang();
    if (_utils.urlQuery.lang != null) {
      this.label.loadMultilang(_utils.urlQuery.lang).then(r => {
        this.label.get = r;
      });
    } else {
      this.label.loadMultilang().then(r => {
        this.label.get = r;
      });
    }
    this.init({
      canvas,
      callback
    });
  }
  init = async ({
    canvas,
    callback
  }) => {
    this.canvas = canvas;
    this.adapter = await navigator.gpu.requestAdapter();
    this.device = await this.adapter.requestDevice({
      extensions: ["ray_tracing"]
    });
    this.context = canvas.getContext('webgpu');
    const devicePixelRatio = window.devicePixelRatio;
    canvas.width = canvas.clientWidth * devicePixelRatio;
    canvas.height = canvas.clientHeight * devicePixelRatio;
    const presentationFormat = navigator.gpu.getPreferredCanvasFormat();
    this.context.configure({
      device: this.device,
      format: presentationFormat,
      alphaMode: 'premultiplied'
    });
    if (this.options.useSingleRenderPass == true) {
      this.frame = this.frameSinglePass;
    } else {
      this.frame = this.framePassPerObject;
    }
    this.globalAmbient = _wgpuMatrix.vec3.create(0.5, 0.5, 0.5);
    this.MAX_SPOTLIGHTS = 20;
    this.inputHandler = (0, _engine.createInputHandler)(window, canvas);
    this.createGlobalStuff();
    this.run(callback);
  };
  createGlobalStuff() {
    this.spotlightUniformBuffer = this.device.createBuffer({
      label: 'spotlightUniformBufferGLOBAL',
      size: this.MAX_SPOTLIGHTS * 144,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });
    this.SHADOW_RES = 1024;
    this.createTexArrayForShadows();
    this.mainDepthTexture = this.device.createTexture({
      size: [this.canvas.width, this.canvas.height],
      format: 'depth24plus',
      usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING
    });
    this.mainDepthView = this.mainDepthTexture.createView();
    this.mainRenderPassDesc = {
      label: 'mainRenderPassDesc',
      colorAttachments: [{
        view: undefined,
        // set each frame
        loadOp: 'clear',
        storeOp: 'store',
        clearValue: [0.02, 0.02, 0.02, 1]
      }],
      depthStencilAttachment: {
        view: this.mainDepthView,
        // fixed
        depthLoadOp: 'clear',
        depthStoreOp: 'store',
        depthClearValue: 1.0
      }
    };
  }
  createTexArrayForShadows() {
    let numberOfLights = this.lightContainer.length;
    if (this.lightContainer.length == 0) {
      setTimeout(() => {
        // console.info('Test light again...')
        this.createMe();
      }, 800);
    }
    this.createMe = () => {
      Math.max(1, this.lightContainer.length);
      if (this.lightContainer.length == 0) {
        setTimeout(() => {
          console.warn('Create now test...');
          this.createMe();
        }, 800);
        return;
      }
      console.warn('Create this.shadowTextureArray...');
      this.shadowTextureArray = this.device.createTexture({
        label: `shadowTextureArray[GLOBAL] num of light ${numberOfLights}`,
        size: {
          width: 1024,
          height: 1024,
          depthOrArrayLayers: numberOfLights // at least 1
        },
        dimension: '2d',
        format: 'depth32float',
        usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING
      });
      this.shadowArrayView = this.shadowTextureArray.createView({
        dimension: '2d-array'
      });
      this.shadowVideoTexture = this.device.createTexture({
        size: [1024, 1024],
        format: "depth32float",
        usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING
      });
      this.shadowVideoView = this.shadowVideoTexture.createView({
        dimension: "2d"
      });
    };
    this.createMe();
  }
  getSceneObjectByName(name) {
    return this.mainRenderBundle.find(sceneObject => sceneObject.name === name);
  }

  // Not in use for now
  addCube = o => {
    if (typeof o === 'undefined') {
      var o = {
        scale: 1,
        position: {
          x: 0,
          y: 0,
          z: -4
        },
        texturesPaths: ['./res/textures/default.png'],
        rotation: {
          x: 0,
          y: 0,
          z: 0
        },
        rotationSpeed: {
          x: 0,
          y: 0,
          z: 0
        },
        entityArgPass: this.entityArgPass,
        cameras: this.cameras,
        mainCameraParams: this.mainCameraParams
      };
    } else {
      if (typeof o.position === 'undefined') {
        o.position = {
          x: 0,
          y: 0,
          z: -4
        };
      }
      if (typeof o.rotation === 'undefined') {
        o.rotation = {
          x: 0,
          y: 0,
          z: 0
        };
      }
      if (typeof o.rotationSpeed === 'undefined') {
        o.rotationSpeed = {
          x: 0,
          y: 0,
          z: 0
        };
      }
      if (typeof o.texturesPaths === 'undefined') {
        o.texturesPaths = ['./res/textures/default.png'];
      }
      if (typeof o.scale === 'undefined') {
        o.scale = 1;
      }
      if (typeof o.mainCameraParams === 'undefined') {
        o.mainCameraParams = this.mainCameraParams;
      }
      o.entityArgPass = this.entityArgPass;
      o.cameras = this.cameras;
    }
    if (typeof o.physics === 'undefined') {
      o.physics = {
        scale: [1, 1, 1],
        enabled: true,
        geometry: "Sphere",
        radius: o.scale,
        name: o.name,
        rotation: o.rotation
      };
    }
    if (typeof o.position !== 'undefined') {
      o.physics.position = o.position;
    }
    if (typeof o.physics.enabled === 'undefined') {
      o.physics.enabled = true;
    }
    if (typeof o.physics.geometry === 'undefined') {
      o.physics.geometry = "Sphere";
    }
    if (typeof o.physics.radius === 'undefined') {
      o.physics.radius = o.scale;
    }
    if (typeof o.physics.mass === 'undefined') {
      o.physics.mass = 1;
    }
    if (typeof o.physics.name === 'undefined') {
      o.physics.name = o.name;
    }
    if (typeof o.physics.scale === 'undefined') {
      o.physics.scale = o.scale;
    }
    if (typeof o.physics.rotation === 'undefined') {
      o.physics.rotation = o.rotation;
    }
    let myCube1 = new _cube.default(this.canvas, this.device, this.context, o);
    if (o.physics.enabled == true) {
      this.matrixAmmo.addPhysics(myCube1, o.physics);
    }
    this.mainRenderBundle.push(myCube1);
  };

  // Not in use for now
  addBall = o => {
    if (typeof o === 'undefined') {
      var o = {
        scale: 1,
        position: {
          x: 0,
          y: 0,
          z: -4
        },
        texturesPaths: ['./res/textures/default.png'],
        rotation: {
          x: 0,
          y: 0,
          z: 0
        },
        rotationSpeed: {
          x: 0,
          y: 0,
          z: 0
        },
        entityArgPass: this.entityArgPass,
        cameras: this.cameras,
        mainCameraParams: this.mainCameraParams
      };
    } else {
      if (typeof o.position === 'undefined') {
        o.position = {
          x: 0,
          y: 0,
          z: -4
        };
      }
      if (typeof o.rotation === 'undefined') {
        o.rotation = {
          x: 0,
          y: 0,
          z: 0
        };
      }
      if (typeof o.rotationSpeed === 'undefined') {
        o.rotationSpeed = {
          x: 0,
          y: 0,
          z: 0
        };
      }
      if (typeof o.texturesPaths === 'undefined') {
        o.texturesPaths = ['./res/textures/default.png'];
      }
      if (typeof o.mainCameraParams === 'undefined') {
        o.mainCameraParams = this.mainCameraParams;
      }
      if (typeof o.scale === 'undefined') {
        o.scale = 1;
      }
      o.entityArgPass = this.entityArgPass;
      o.cameras = this.cameras;
    }
    if (typeof o.physics === 'undefined') {
      o.physics = {
        scale: [1, 1, 1],
        enabled: true,
        geometry: "Sphere",
        radius: o.scale,
        name: o.name,
        rotation: o.rotation
      };
    }
    if (typeof o.position !== 'undefined') {
      o.physics.position = o.position;
    }
    if (typeof o.physics.enabled === 'undefined') {
      o.physics.enabled = true;
    }
    if (typeof o.physics.geometry === 'undefined') {
      o.physics.geometry = "Sphere";
    }
    if (typeof o.physics.radius === 'undefined') {
      o.physics.radius = o.scale;
    }
    if (typeof o.physics.mass === 'undefined') {
      o.physics.mass = 1;
    }
    if (typeof o.physics.name === 'undefined') {
      o.physics.name = o.name;
    }
    if (typeof o.physics.scale === 'undefined') {
      o.physics.scale = o.scale;
    }
    if (typeof o.physics.rotation === 'undefined') {
      o.physics.rotation = o.rotation;
    }
    let myBall1 = new _ball.default(this.canvas, this.device, this.context, o);
    if (o.physics.enabled == true) {
      this.matrixAmmo.addPhysics(myBall1, o.physics);
    }
    this.mainRenderBundle.push(myBall1);
  };
  addLight(o) {
    const camera = this.cameras[this.mainCameraParams.type];
    let newLight = new _lights.SpotLight(camera, this.inputHandler, this.device);
    this.lightContainer.push(newLight);
    this.createTexArrayForShadows();
    console.log(`%cAdd light: ${newLight}`, _utils.LOG_FUNNY_SMALL);
  }
  addMeshObj = (o, clearColor = this.options.clearColor) => {
    if (typeof o.name === 'undefined') {
      o.name = (0, _utils.genName)(9);
    }
    if (typeof o.position === 'undefined') {
      o.position = {
        x: 0,
        y: 0,
        z: -4
      };
    }
    if (typeof o.rotation === 'undefined') {
      o.rotation = {
        x: 0,
        y: 0,
        z: 0
      };
    }
    if (typeof o.rotationSpeed === 'undefined') {
      o.rotationSpeed = {
        x: 0,
        y: 0,
        z: 0
      };
    }
    if (typeof o.texturesPaths === 'undefined') {
      o.texturesPaths = ['./res/textures/default.png'];
    }
    if (typeof o.mainCameraParams === 'undefined') {
      o.mainCameraParams = this.mainCameraParams;
    }
    if (typeof o.scale === 'undefined') {
      o.scale = [1, 1, 1];
    }
    if (typeof o.raycast === 'undefined') {
      o.raycast = {
        enabled: false,
        radius: 2
      };
    }
    o.entityArgPass = this.entityArgPass;
    o.cameras = this.cameras;
    if (typeof o.physics === 'undefined') {
      o.physics = {
        scale: [1, 1, 1],
        enabled: true,
        geometry: "Sphere",
        //                   must be fixed<<
        radius: typeof o.scale == Number ? o.scale : o.scale[0],
        name: o.name,
        rotation: o.rotation
      };
    }
    if (typeof o.physics.enabled === 'undefined') {
      o.physics.enabled = true;
    }
    if (typeof o.physics.geometry === 'undefined') {
      o.physics.geometry = "Cube";
    }
    if (typeof o.physics.radius === 'undefined') {
      o.physics.radius = o.scale;
    }
    if (typeof o.physics.mass === 'undefined') {
      o.physics.mass = 1;
    }
    if (typeof o.physics.name === 'undefined') {
      o.physics.name = o.name;
    }
    if (typeof o.physics.scale === 'undefined') {
      o.physics.scale = o.scale;
    }
    if (typeof o.physics.rotation === 'undefined') {
      o.physics.rotation = o.rotation;
    }
    o.physics.position = o.position;
    if (typeof o.objAnim == 'undefined' || typeof o.objAnim == null) {
      o.objAnim = null;
    } else {
      if (typeof o.objAnim.animations !== 'undefined') {
        o.objAnim.play = _loaderObj.play;
      }
      // no need for single test it in future
      o.objAnim.meshList = o.objAnim.meshList;
      if (typeof o.mesh === 'undefined') {
        o.mesh = o.objAnim.meshList[0];
        console.info('objSeq animation is active.');
      }
      // scale for all second option!
      o.objAnim.scaleAll = function (s) {
        for (var k in this.meshList) {
          // console.log('SCALE meshList');
          this.meshList[k].setScale(s);
        }
      };
    }
    let myMesh1 = new _meshObj.default(this.canvas, this.device, this.context, o, this.inputHandler, this.globalAmbient);
    myMesh1.spotlightUniformBuffer = this.spotlightUniformBuffer;
    myMesh1.clearColor = clearColor;
    if (o.physics.enabled == true) {
      this.matrixAmmo.addPhysics(myMesh1, o.physics);
    }
    this.mainRenderBundle.push(myMesh1);
  };
  run(callback) {
    setTimeout(() => {
      requestAnimationFrame(this.frame);
    }, 500);
    setTimeout(() => {
      callback(this);
    }, 20);
  }
  destroyProgram = () => {
    this.mainRenderBundle = [];
    this.canvas.remove();
  };
  updateLights() {
    const floatsPerLight = 36; // not 20 anymore
    const data = new Float32Array(this.MAX_SPOTLIGHTS * floatsPerLight);
    for (let i = 0; i < this.MAX_SPOTLIGHTS; i++) {
      if (i < this.lightContainer.length) {
        const buf = this.lightContainer[i].getLightDataBuffer();
        data.set(buf, i * floatsPerLight);
      } else {
        data.set(new Float32Array(floatsPerLight), i * floatsPerLight);
      }
    }
    this.device.queue.writeBuffer(this.spotlightUniformBuffer, 0, data.buffer);
  }
  frameSinglePass = () => {
    if (typeof this.mainRenderBundle == 'undefined' || this.mainRenderBundle.length == 0) {
      setTimeout(() => {
        requestAnimationFrame(this.frame);
      }, 100);
      return;
    }
    this.mainRenderBundle.forEach((meItem, index) => {
      if (meItem.isVideo == true) {
        if (!meItem.externalTexture) {
          // || meItem.video.readyState < 2) {
          // console.log('no rendere for video not ready')
          // this.externalTexture = this.device.importExternalTexture({source: this.video});
          meItem.createBindGroupForRender();
          setTimeout(() => {
            requestAnimationFrame(this.frame);
          }, 1000);
          return;
        }
      }
    });
    try {
      let commandEncoder = this.device.createCommandEncoder();
      this.updateLights();
      // 1️⃣ Update light data (position, direction, uniforms)
      for (const light of this.lightContainer) {
        light.update();
        this.mainRenderBundle.forEach((meItem, index) => {
          meItem.position.update();
          meItem.updateModelUniformBuffer();
          meItem.getTransformationMatrix(this.mainRenderBundle, light); // >check optisation
        });
      }
      if (this.matrixAmmo) this.matrixAmmo.updatePhysics();
      for (let i = 0; i < this.lightContainer.length; i++) {
        const light = this.lightContainer[i];
        let ViewPerLightRenderShadowPass = this.shadowTextureArray.createView({
          dimension: '2d',
          baseArrayLayer: i,
          arrayLayerCount: 1,
          // must be > 0
          baseMipLevel: 0,
          mipLevelCount: 1
        });
        const shadowPass = commandEncoder.beginRenderPass({
          label: "shadowPass",
          colorAttachments: [],
          depthStencilAttachment: {
            view: ViewPerLightRenderShadowPass,
            depthLoadOp: 'clear',
            depthStoreOp: 'store',
            depthClearValue: 1.0
          }
        });
        shadowPass.setPipeline(light.shadowPipeline);
        for (const [meshIndex, mesh] of this.mainRenderBundle.entries()) {
          if (mesh.videoIsReady == 'NONE') {
            shadowPass.setBindGroup(0, light.getShadowBindGroup(mesh, meshIndex));
            // shadowPass.setBindGroup(1, mesh.modelBindGroup); // ORI 
            shadowPass.setBindGroup(1, light.getShadowBindGroup_bones(meshIndex)); // ORI 
            mesh.drawShadows(shadowPass, light);
          }
        }
        shadowPass.end();
      }
      const currentTextureView = this.context.getCurrentTexture().createView();
      this.mainRenderPassDesc.colorAttachments[0].view = currentTextureView;
      let pass = commandEncoder.beginRenderPass(this.mainRenderPassDesc);
      // Loop over each mesh
      for (const mesh of this.mainRenderBundle) {
        if (mesh.update) {
          const now = performance.now() / 1000; // seconds
          const deltaTime = now - (this.lastTime || now);
          this.lastTime = now;
          mesh.update(deltaTime); // glb
          // mesh.updateBones()
        }
        pass.setPipeline(mesh.pipeline);
        if (!mesh.sceneBindGroupForRender || mesh.FINISH_VIDIO_INIT == false && mesh.isVideo == true) {
          for (const m of this.mainRenderBundle) {
            if (m.isVideo == true) {
              console.log('✅shadowVideoView', this.shadowVideoView);
              m.shadowDepthTextureView = this.shadowVideoView;
              m.FINISH_VIDIO_INIT = true;
              m.setupPipeline();
            } else {
              m.shadowDepthTextureView = this.shadowArrayView;
              m.setupPipeline();
            }
          }
        }
        mesh.drawElements(pass, this.lightContainer);
      }
      pass.end();
      this.device.queue.submit([commandEncoder.finish()]);
      requestAnimationFrame(this.frame);
    } catch (err) {
      console.log('%cLoop(err):' + err + " info : " + err.stack, _utils.LOG_WARN);
      requestAnimationFrame(this.frame);
    }
  };
  framePassPerObject = () => {
    let commandEncoder = this.device.createCommandEncoder();
    if (this.matrixAmmo.rigidBodies && this.matrixAmmo.rigidBodies.length > 0) this.matrixAmmo.updatePhysics();
    this.mainRenderBundle.forEach((meItem, index) => {
      if (index === 0) {
        if (meItem.renderPassDescriptor) meItem.renderPassDescriptor.colorAttachments[0].loadOp = 'clear';
      } else {
        if (meItem.renderPassDescriptor) meItem.renderPassDescriptor.colorAttachments[0].loadOp = 'load';
      }
      // Update transforms, physics, etc. (optional)
      meItem.draw(commandEncoder);
      if (meItem.renderBundle) {
        // Set up view per object
        meItem.renderPassDescriptor.colorAttachments[0].view = this.context.getCurrentTexture().createView();
        const passEncoder = commandEncoder.beginRenderPass(meItem.renderPassDescriptor);
        passEncoder.executeBundles([meItem.renderBundle]); // ✅ Use only this bundle
        passEncoder.end();
      } else {
        meItem.draw(commandEncoder);
      }
    });
    this.device.queue.submit([commandEncoder.finish()]);
    requestAnimationFrame(this.frame);
  };

  // ---------------------------------------
  addGlbObj = (o, BVHANIM, glbFile, clearColor = this.options.clearColor) => {
    if (typeof o.name === 'undefined') {
      o.name = (0, _utils.genName)(9);
    }
    if (typeof o.position === 'undefined') {
      o.position = {
        x: 0,
        y: 0,
        z: -4
      };
    }
    if (typeof o.rotation === 'undefined') {
      o.rotation = {
        x: 0,
        y: 0,
        z: 0
      };
    }
    if (typeof o.rotationSpeed === 'undefined') {
      o.rotationSpeed = {
        x: 0,
        y: 0,
        z: 0
      };
    }
    if (typeof o.texturesPaths === 'undefined') {
      o.texturesPaths = ['./res/textures/default.png'];
    }
    if (typeof o.mainCameraParams === 'undefined') {
      o.mainCameraParams = this.mainCameraParams;
    }
    if (typeof o.scale === 'undefined') {
      o.scale = [1, 1, 1];
    }
    if (typeof o.raycast === 'undefined') {
      o.raycast = {
        enabled: false,
        radius: 2
      };
    }
    o.entityArgPass = this.entityArgPass;
    o.cameras = this.cameras;
    if (typeof o.physics === 'undefined') {
      o.physics = {
        scale: [1, 1, 1],
        enabled: true,
        geometry: "Sphere",
        //                   must be fixed<<
        radius: typeof o.scale == Number ? o.scale : o.scale[0],
        name: o.name,
        rotation: o.rotation
      };
    }
    if (typeof o.physics.enabled === 'undefined') {
      o.physics.enabled = true;
    }
    if (typeof o.physics.geometry === 'undefined') {
      o.physics.geometry = "Cube";
    }
    if (typeof o.physics.radius === 'undefined') {
      o.physics.radius = o.scale;
    }
    if (typeof o.physics.mass === 'undefined') {
      o.physics.mass = 1;
    }
    if (typeof o.physics.name === 'undefined') {
      o.physics.name = o.name;
    }
    if (typeof o.physics.scale === 'undefined') {
      o.physics.scale = o.scale;
    }
    if (typeof o.physics.rotation === 'undefined') {
      o.physics.rotation = o.rotation;
    }
    o.physics.position = o.position;
    if (typeof o.objAnim == 'undefined' || typeof o.objAnim == null) {
      o.objAnim = null;
    } else {
      alert('GLB not use objAnim (it is only for obj sequence). GLB use BVH skeletal for animation');
    }
    // let myMesh1 = new MEMeshObj(this.canvas, this.device, this.context, o, this.inputHandler, this.globalAmbient);

    let skinnedNodeIndex = 0;
    for (const skinnedNode of glbFile.skinnedMeshNodes) {
      let c = 0;
      for (const primitive of skinnedNode.mesh.primitives) {
        console.log(`count: ${c} primitive-glb: ${primitive}`);
        // primitive is mesh - probably with own material . material/texture per primitive
        // create scene object for each
        // --
        // 
        o.name = o.name + "-GLBGroup-" + c;
        const bvhPlayer = new _bvh.BVHPlayer(o, BVHANIM, glbFile, c, skinnedNodeIndex, this.canvas, this.device, this.context, this.inputHandler, this.globalAmbient);
        console.log(`bvhPlayer!!!!!: ${bvhPlayer}`);
        bvhPlayer.spotlightUniformBuffer = this.spotlightUniformBuffer;
        bvhPlayer.clearColor = clearColor;
        // if(o.physics.enabled == true) {
        //   this.matrixAmmo.addPhysics(myMesh1, o.physics)
        // }
        this.mainRenderBundle.push(bvhPlayer);
        c++;
      }
    }
  };
}
exports.default = MatrixEngineWGPU;

},{"./engine/ball.js":17,"./engine/cube.js":19,"./engine/engine.js":20,"./engine/lights.js":21,"./engine/loader-obj.js":22,"./engine/loaders/bvh.js":23,"./engine/mesh-obj.js":27,"./engine/utils.js":28,"./multilang/lang.js":29,"./physics/matrix-ammo.js":30,"./sounds/sounds.js":36,"wgpu-matrix":16}]},{},[1]);
