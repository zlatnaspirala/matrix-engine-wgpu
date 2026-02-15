var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name2 in all)
    __defProp(target, name2, { get: all[name2], enumerable: true });
};

// ../../../../node_modules/wgpu-matrix/dist/2.x/wgpu-matrix.module.js
var EPSILON = 1e-6;
var VecType$1 = Float32Array;
function setDefaultType$5(ctor) {
  const oldType = VecType$1;
  VecType$1 = ctor;
  return oldType;
}
function create$4(x2, y2, z) {
  const dst = new VecType$1(3);
  if (x2 !== void 0) {
    dst[0] = x2;
    if (y2 !== void 0) {
      dst[1] = y2;
      if (z !== void 0) {
        dst[2] = z;
      }
    }
  }
  return dst;
}
var ctorMap = /* @__PURE__ */ new Map([
  [Float32Array, () => new Float32Array(12)],
  [Float64Array, () => new Float64Array(12)],
  [Array, () => new Array(12).fill(0)]
]);
var newMat3 = ctorMap.get(Float32Array);
var fromValues$2 = create$4;
function set$3(x2, y2, z, dst) {
  dst = dst || new VecType$1(3);
  dst[0] = x2;
  dst[1] = y2;
  dst[2] = z;
  return dst;
}
function ceil$1(v, dst) {
  dst = dst || new VecType$1(3);
  dst[0] = Math.ceil(v[0]);
  dst[1] = Math.ceil(v[1]);
  dst[2] = Math.ceil(v[2]);
  return dst;
}
function floor$1(v, dst) {
  dst = dst || new VecType$1(3);
  dst[0] = Math.floor(v[0]);
  dst[1] = Math.floor(v[1]);
  dst[2] = Math.floor(v[2]);
  return dst;
}
function round$1(v, dst) {
  dst = dst || new VecType$1(3);
  dst[0] = Math.round(v[0]);
  dst[1] = Math.round(v[1]);
  dst[2] = Math.round(v[2]);
  return dst;
}
function clamp$1(v, min2 = 0, max2 = 1, dst) {
  dst = dst || new VecType$1(3);
  dst[0] = Math.min(max2, Math.max(min2, v[0]));
  dst[1] = Math.min(max2, Math.max(min2, v[1]));
  dst[2] = Math.min(max2, Math.max(min2, v[2]));
  return dst;
}
function add$2(a, b, dst) {
  dst = dst || new VecType$1(3);
  dst[0] = a[0] + b[0];
  dst[1] = a[1] + b[1];
  dst[2] = a[2] + b[2];
  return dst;
}
function addScaled$1(a, b, scale4, dst) {
  dst = dst || new VecType$1(3);
  dst[0] = a[0] + b[0] * scale4;
  dst[1] = a[1] + b[1] * scale4;
  dst[2] = a[2] + b[2] * scale4;
  return dst;
}
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
function subtract$2(a, b, dst) {
  dst = dst || new VecType$1(3);
  dst[0] = a[0] - b[0];
  dst[1] = a[1] - b[1];
  dst[2] = a[2] - b[2];
  return dst;
}
var sub$2 = subtract$2;
function equalsApproximately$3(a, b) {
  return Math.abs(a[0] - b[0]) < EPSILON && Math.abs(a[1] - b[1]) < EPSILON && Math.abs(a[2] - b[2]) < EPSILON;
}
function equals$3(a, b) {
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
}
function lerp$2(a, b, t, dst) {
  dst = dst || new VecType$1(3);
  dst[0] = a[0] + t * (b[0] - a[0]);
  dst[1] = a[1] + t * (b[1] - a[1]);
  dst[2] = a[2] + t * (b[2] - a[2]);
  return dst;
}
function lerpV$1(a, b, t, dst) {
  dst = dst || new VecType$1(3);
  dst[0] = a[0] + t[0] * (b[0] - a[0]);
  dst[1] = a[1] + t[1] * (b[1] - a[1]);
  dst[2] = a[2] + t[2] * (b[2] - a[2]);
  return dst;
}
function max$1(a, b, dst) {
  dst = dst || new VecType$1(3);
  dst[0] = Math.max(a[0], b[0]);
  dst[1] = Math.max(a[1], b[1]);
  dst[2] = Math.max(a[2], b[2]);
  return dst;
}
function min$1(a, b, dst) {
  dst = dst || new VecType$1(3);
  dst[0] = Math.min(a[0], b[0]);
  dst[1] = Math.min(a[1], b[1]);
  dst[2] = Math.min(a[2], b[2]);
  return dst;
}
function mulScalar$2(v, k, dst) {
  dst = dst || new VecType$1(3);
  dst[0] = v[0] * k;
  dst[1] = v[1] * k;
  dst[2] = v[2] * k;
  return dst;
}
var scale$3 = mulScalar$2;
function divScalar$2(v, k, dst) {
  dst = dst || new VecType$1(3);
  dst[0] = v[0] / k;
  dst[1] = v[1] / k;
  dst[2] = v[2] / k;
  return dst;
}
function inverse$3(v, dst) {
  dst = dst || new VecType$1(3);
  dst[0] = 1 / v[0];
  dst[1] = 1 / v[1];
  dst[2] = 1 / v[2];
  return dst;
}
var invert$2 = inverse$3;
function cross(a, b, dst) {
  dst = dst || new VecType$1(3);
  const t1 = a[2] * b[0] - a[0] * b[2];
  const t2 = a[0] * b[1] - a[1] * b[0];
  dst[0] = a[1] * b[2] - a[2] * b[1];
  dst[1] = t1;
  dst[2] = t2;
  return dst;
}
function dot$2(a, b) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}
function length$2(v) {
  const v0 = v[0];
  const v1 = v[1];
  const v2 = v[2];
  return Math.sqrt(v0 * v0 + v1 * v1 + v2 * v2);
}
var len$2 = length$2;
function lengthSq$2(v) {
  const v0 = v[0];
  const v1 = v[1];
  const v2 = v[2];
  return v0 * v0 + v1 * v1 + v2 * v2;
}
var lenSq$2 = lengthSq$2;
function distance$1(a, b) {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  const dz = a[2] - b[2];
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}
var dist$1 = distance$1;
function distanceSq$1(a, b) {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  const dz = a[2] - b[2];
  return dx * dx + dy * dy + dz * dz;
}
var distSq$1 = distanceSq$1;
function normalize$2(v, dst) {
  dst = dst || new VecType$1(3);
  const v0 = v[0];
  const v1 = v[1];
  const v2 = v[2];
  const len2 = Math.sqrt(v0 * v0 + v1 * v1 + v2 * v2);
  if (len2 > 1e-5) {
    dst[0] = v0 / len2;
    dst[1] = v1 / len2;
    dst[2] = v2 / len2;
  } else {
    dst[0] = 0;
    dst[1] = 0;
    dst[2] = 0;
  }
  return dst;
}
function negate$2(v, dst) {
  dst = dst || new VecType$1(3);
  dst[0] = -v[0];
  dst[1] = -v[1];
  dst[2] = -v[2];
  return dst;
}
function copy$3(v, dst) {
  dst = dst || new VecType$1(3);
  dst[0] = v[0];
  dst[1] = v[1];
  dst[2] = v[2];
  return dst;
}
var clone$3 = copy$3;
function multiply$3(a, b, dst) {
  dst = dst || new VecType$1(3);
  dst[0] = a[0] * b[0];
  dst[1] = a[1] * b[1];
  dst[2] = a[2] * b[2];
  return dst;
}
var mul$3 = multiply$3;
function divide$1(a, b, dst) {
  dst = dst || new VecType$1(3);
  dst[0] = a[0] / b[0];
  dst[1] = a[1] / b[1];
  dst[2] = a[2] / b[2];
  return dst;
}
var div$1 = divide$1;
function random(scale4 = 1, dst) {
  dst = dst || new VecType$1(3);
  const angle2 = Math.random() * 2 * Math.PI;
  const z = Math.random() * 2 - 1;
  const zScale = Math.sqrt(1 - z * z) * scale4;
  dst[0] = Math.cos(angle2) * zScale;
  dst[1] = Math.sin(angle2) * zScale;
  dst[2] = z * scale4;
  return dst;
}
function zero$1(dst) {
  dst = dst || new VecType$1(3);
  dst[0] = 0;
  dst[1] = 0;
  dst[2] = 0;
  return dst;
}
function transformMat4$1(v, m, dst) {
  dst = dst || new VecType$1(3);
  const x2 = v[0];
  const y2 = v[1];
  const z = v[2];
  const w = m[3] * x2 + m[7] * y2 + m[11] * z + m[15] || 1;
  dst[0] = (m[0] * x2 + m[4] * y2 + m[8] * z + m[12]) / w;
  dst[1] = (m[1] * x2 + m[5] * y2 + m[9] * z + m[13]) / w;
  dst[2] = (m[2] * x2 + m[6] * y2 + m[10] * z + m[14]) / w;
  return dst;
}
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
function transformMat3(v, m, dst) {
  dst = dst || new VecType$1(3);
  const x2 = v[0];
  const y2 = v[1];
  const z = v[2];
  dst[0] = x2 * m[0] + y2 * m[4] + z * m[8];
  dst[1] = x2 * m[1] + y2 * m[5] + z * m[9];
  dst[2] = x2 * m[2] + y2 * m[6] + z * m[10];
  return dst;
}
function transformQuat(v, q, dst) {
  dst = dst || new VecType$1(3);
  const qx = q[0];
  const qy = q[1];
  const qz = q[2];
  const w2 = q[3] * 2;
  const x2 = v[0];
  const y2 = v[1];
  const z = v[2];
  const uvX = qy * z - qz * y2;
  const uvY = qz * x2 - qx * z;
  const uvZ = qx * y2 - qy * x2;
  dst[0] = x2 + uvX * w2 + (qy * uvZ - qz * uvY) * 2;
  dst[1] = y2 + uvY * w2 + (qz * uvX - qx * uvZ) * 2;
  dst[2] = z + uvZ * w2 + (qx * uvY - qy * uvX) * 2;
  return dst;
}
function getTranslation$1(m, dst) {
  dst = dst || new VecType$1(3);
  dst[0] = m[12];
  dst[1] = m[13];
  dst[2] = m[14];
  return dst;
}
function getAxis$1(m, axis, dst) {
  dst = dst || new VecType$1(3);
  const off = axis * 4;
  dst[0] = m[off + 0];
  dst[1] = m[off + 1];
  dst[2] = m[off + 2];
  return dst;
}
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
var vec3Impl = /* @__PURE__ */ Object.freeze({
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
  cross,
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
  random,
  zero: zero$1,
  transformMat4: transformMat4$1,
  transformMat4Upper3x3,
  transformMat3,
  transformQuat,
  getTranslation: getTranslation$1,
  getAxis: getAxis$1,
  getScaling: getScaling$1
});
var MatType = Float32Array;
function setDefaultType$3(ctor) {
  const oldType = MatType;
  MatType = ctor;
  return oldType;
}
function create$2(v0, v1, v2, v3, v4, v5, v6, v7, v8, v9, v10, v11, v12, v13, v14, v15) {
  const dst = new MatType(16);
  if (v0 !== void 0) {
    dst[0] = v0;
    if (v1 !== void 0) {
      dst[1] = v1;
      if (v2 !== void 0) {
        dst[2] = v2;
        if (v3 !== void 0) {
          dst[3] = v3;
          if (v4 !== void 0) {
            dst[4] = v4;
            if (v5 !== void 0) {
              dst[5] = v5;
              if (v6 !== void 0) {
                dst[6] = v6;
                if (v7 !== void 0) {
                  dst[7] = v7;
                  if (v8 !== void 0) {
                    dst[8] = v8;
                    if (v9 !== void 0) {
                      dst[9] = v9;
                      if (v10 !== void 0) {
                        dst[10] = v10;
                        if (v11 !== void 0) {
                          dst[11] = v11;
                          if (v12 !== void 0) {
                            dst[12] = v12;
                            if (v13 !== void 0) {
                              dst[13] = v13;
                              if (v14 !== void 0) {
                                dst[14] = v14;
                                if (v15 !== void 0) {
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
function fromQuat(q, dst) {
  dst = dst || new MatType(16);
  const x2 = q[0];
  const y2 = q[1];
  const z = q[2];
  const w = q[3];
  const x22 = x2 + x2;
  const y22 = y2 + y2;
  const z2 = z + z;
  const xx = x2 * x22;
  const yx = y2 * x22;
  const yy = y2 * y22;
  const zx = z * x22;
  const zy = z * y22;
  const zz = z * z2;
  const wx = w * x22;
  const wy = w * y22;
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
var clone$2 = copy$2;
function equalsApproximately$2(a, b) {
  return Math.abs(a[0] - b[0]) < EPSILON && Math.abs(a[1] - b[1]) < EPSILON && Math.abs(a[2] - b[2]) < EPSILON && Math.abs(a[3] - b[3]) < EPSILON && Math.abs(a[4] - b[4]) < EPSILON && Math.abs(a[5] - b[5]) < EPSILON && Math.abs(a[6] - b[6]) < EPSILON && Math.abs(a[7] - b[7]) < EPSILON && Math.abs(a[8] - b[8]) < EPSILON && Math.abs(a[9] - b[9]) < EPSILON && Math.abs(a[10] - b[10]) < EPSILON && Math.abs(a[11] - b[11]) < EPSILON && Math.abs(a[12] - b[12]) < EPSILON && Math.abs(a[13] - b[13]) < EPSILON && Math.abs(a[14] - b[14]) < EPSILON && Math.abs(a[15] - b[15]) < EPSILON;
}
function equals$2(a, b) {
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3] && a[4] === b[4] && a[5] === b[5] && a[6] === b[6] && a[7] === b[7] && a[8] === b[8] && a[9] === b[9] && a[10] === b[10] && a[11] === b[11] && a[12] === b[12] && a[13] === b[13] && a[14] === b[14] && a[15] === b[15];
}
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
var invert$1 = inverse$2;
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
var mul$2 = multiply$2;
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
function getTranslation(m, dst) {
  dst = dst || create$4();
  dst[0] = m[12];
  dst[1] = m[13];
  dst[2] = m[14];
  return dst;
}
function getAxis(m, axis, dst) {
  dst = dst || create$4();
  const off = axis * 4;
  dst[0] = m[off + 0];
  dst[1] = m[off + 1];
  dst[2] = m[off + 2];
  return dst;
}
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
function ortho(left2, right2, bottom, top, near, far, dst) {
  dst = dst || new MatType(16);
  dst[0] = 2 / (right2 - left2);
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
  dst[12] = (right2 + left2) / (left2 - right2);
  dst[13] = (top + bottom) / (bottom - top);
  dst[14] = near / (near - far);
  dst[15] = 1;
  return dst;
}
function frustum(left2, right2, bottom, top, near, far, dst) {
  dst = dst || new MatType(16);
  const dx = right2 - left2;
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
  dst[8] = (left2 + right2) / dx;
  dst[9] = (top + bottom) / dy;
  dst[10] = far / dz;
  dst[11] = -1;
  dst[12] = 0;
  dst[13] = 0;
  dst[14] = near * far / dz;
  dst[15] = 0;
  return dst;
}
var xAxis;
var yAxis;
var zAxis;
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
function axisRotation(axis, angleInRadians, dst) {
  dst = dst || new MatType(16);
  let x2 = axis[0];
  let y2 = axis[1];
  let z = axis[2];
  const n2 = Math.sqrt(x2 * x2 + y2 * y2 + z * z);
  x2 /= n2;
  y2 /= n2;
  z /= n2;
  const xx = x2 * x2;
  const yy = y2 * y2;
  const zz = z * z;
  const c = Math.cos(angleInRadians);
  const s = Math.sin(angleInRadians);
  const oneMinusCosine = 1 - c;
  dst[0] = xx + (1 - xx) * c;
  dst[1] = x2 * y2 * oneMinusCosine + z * s;
  dst[2] = x2 * z * oneMinusCosine - y2 * s;
  dst[3] = 0;
  dst[4] = x2 * y2 * oneMinusCosine - z * s;
  dst[5] = yy + (1 - yy) * c;
  dst[6] = y2 * z * oneMinusCosine + x2 * s;
  dst[7] = 0;
  dst[8] = x2 * z * oneMinusCosine + y2 * s;
  dst[9] = y2 * z * oneMinusCosine - x2 * s;
  dst[10] = zz + (1 - zz) * c;
  dst[11] = 0;
  dst[12] = 0;
  dst[13] = 0;
  dst[14] = 0;
  dst[15] = 1;
  return dst;
}
var rotation = axisRotation;
function axisRotate(m, axis, angleInRadians, dst) {
  dst = dst || new MatType(16);
  let x2 = axis[0];
  let y2 = axis[1];
  let z = axis[2];
  const n2 = Math.sqrt(x2 * x2 + y2 * y2 + z * z);
  x2 /= n2;
  y2 /= n2;
  z /= n2;
  const xx = x2 * x2;
  const yy = y2 * y2;
  const zz = z * z;
  const c = Math.cos(angleInRadians);
  const s = Math.sin(angleInRadians);
  const oneMinusCosine = 1 - c;
  const r00 = xx + (1 - xx) * c;
  const r01 = x2 * y2 * oneMinusCosine + z * s;
  const r02 = x2 * z * oneMinusCosine - y2 * s;
  const r10 = x2 * y2 * oneMinusCosine - z * s;
  const r11 = yy + (1 - yy) * c;
  const r12 = y2 * z * oneMinusCosine + x2 * s;
  const r20 = x2 * z * oneMinusCosine + y2 * s;
  const r21 = y2 * z * oneMinusCosine - x2 * s;
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
var rotate = axisRotate;
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
var mat4Impl = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  setDefaultType: setDefaultType$3,
  create: create$2,
  set: set$2,
  fromMat3,
  fromQuat,
  negate: negate$1,
  copy: copy$2,
  clone: clone$2,
  equalsApproximately: equalsApproximately$2,
  equals: equals$2,
  identity: identity$1,
  transpose,
  inverse: inverse$2,
  determinant,
  invert: invert$1,
  multiply: multiply$2,
  mul: mul$2,
  setTranslation,
  getTranslation,
  getAxis,
  setAxis,
  getScaling,
  perspective,
  ortho,
  frustum,
  aim,
  cameraAim,
  lookAt,
  translation,
  translate,
  rotationX,
  rotateX: rotateX$1,
  rotationY,
  rotateY: rotateY$1,
  rotationZ,
  rotateZ: rotateZ$1,
  axisRotation,
  rotation,
  axisRotate,
  rotate,
  scaling,
  scale: scale$2,
  uniformScaling,
  uniformScale
});
var QuatType = Float32Array;
function setDefaultType$2(ctor) {
  const oldType = QuatType;
  QuatType = ctor;
  return oldType;
}
function create$1(x2, y2, z, w) {
  const dst = new QuatType(4);
  if (x2 !== void 0) {
    dst[0] = x2;
    if (y2 !== void 0) {
      dst[1] = y2;
      if (z !== void 0) {
        dst[2] = z;
        if (w !== void 0) {
          dst[3] = w;
        }
      }
    }
  }
  return dst;
}
var fromValues$1 = create$1;
function set$1(x2, y2, z, w, dst) {
  dst = dst || new QuatType(4);
  dst[0] = x2;
  dst[1] = y2;
  dst[2] = z;
  dst[3] = w;
  return dst;
}
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
function toAxisAngle(q, dst) {
  dst = dst || create$4(4);
  const angle2 = Math.acos(q[3]) * 2;
  const s = Math.sin(angle2 * 0.5);
  if (s > EPSILON) {
    dst[0] = q[0] / s;
    dst[1] = q[1] / s;
    dst[2] = q[2] / s;
  } else {
    dst[0] = 1;
    dst[1] = 0;
    dst[2] = 0;
  }
  return { angle: angle2, axis: dst };
}
function angle(a, b) {
  const d = dot$1(a, b);
  return Math.acos(2 * d * d - 1);
}
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
var mul$1 = multiply$1;
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
  if (1 - cosOmega > EPSILON) {
    const omega = Math.acos(cosOmega);
    const sinOmega = Math.sin(omega);
    scale0 = Math.sin((1 - t) * omega) / sinOmega;
    scale1 = Math.sin(t * omega) / sinOmega;
  } else {
    scale0 = 1 - t;
    scale1 = t;
  }
  dst[0] = scale0 * ax + scale1 * bx;
  dst[1] = scale0 * ay + scale1 * by;
  dst[2] = scale0 * az + scale1 * bz;
  dst[3] = scale0 * aw + scale1 * bw;
  return dst;
}
function inverse$1(q, dst) {
  dst = dst || new QuatType(4);
  const a0 = q[0];
  const a1 = q[1];
  const a2 = q[2];
  const a3 = q[3];
  const dot2 = a0 * a0 + a1 * a1 + a2 * a2 + a3 * a3;
  const invDot = dot2 ? 1 / dot2 : 0;
  dst[0] = -a0 * invDot;
  dst[1] = -a1 * invDot;
  dst[2] = -a2 * invDot;
  dst[3] = a3 * invDot;
  return dst;
}
function conjugate(q, dst) {
  dst = dst || new QuatType(4);
  dst[0] = -q[0];
  dst[1] = -q[1];
  dst[2] = -q[2];
  dst[3] = q[3];
  return dst;
}
function fromMat(m, dst) {
  dst = dst || new QuatType(4);
  const trace = m[0] + m[5] + m[10];
  if (trace > 0) {
    const root = Math.sqrt(trace + 1);
    dst[3] = 0.5 * root;
    const invRoot = 0.5 / root;
    dst[0] = (m[6] - m[9]) * invRoot;
    dst[1] = (m[8] - m[2]) * invRoot;
    dst[2] = (m[1] - m[4]) * invRoot;
  } else {
    let i = 0;
    if (m[5] > m[0]) {
      i = 1;
    }
    if (m[10] > m[i * 4 + i]) {
      i = 2;
    }
    const j = (i + 1) % 3;
    const k = (i + 2) % 3;
    const root = Math.sqrt(m[i * 4 + i] - m[j * 4 + j] - m[k * 4 + k] + 1);
    dst[i] = 0.5 * root;
    const invRoot = 0.5 / root;
    dst[3] = (m[j * 4 + k] - m[k * 4 + j]) * invRoot;
    dst[j] = (m[j * 4 + i] + m[i * 4 + j]) * invRoot;
    dst[k] = (m[k * 4 + i] + m[i * 4 + k]) * invRoot;
  }
  return dst;
}
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
    case "xyz":
      dst[0] = sx * cy * cz + cx * sy * sz;
      dst[1] = cx * sy * cz - sx * cy * sz;
      dst[2] = cx * cy * sz + sx * sy * cz;
      dst[3] = cx * cy * cz - sx * sy * sz;
      break;
    case "xzy":
      dst[0] = sx * cy * cz - cx * sy * sz;
      dst[1] = cx * sy * cz - sx * cy * sz;
      dst[2] = cx * cy * sz + sx * sy * cz;
      dst[3] = cx * cy * cz + sx * sy * sz;
      break;
    case "yxz":
      dst[0] = sx * cy * cz + cx * sy * sz;
      dst[1] = cx * sy * cz - sx * cy * sz;
      dst[2] = cx * cy * sz - sx * sy * cz;
      dst[3] = cx * cy * cz + sx * sy * sz;
      break;
    case "yzx":
      dst[0] = sx * cy * cz + cx * sy * sz;
      dst[1] = cx * sy * cz + sx * cy * sz;
      dst[2] = cx * cy * sz - sx * sy * cz;
      dst[3] = cx * cy * cz - sx * sy * sz;
      break;
    case "zxy":
      dst[0] = sx * cy * cz - cx * sy * sz;
      dst[1] = cx * sy * cz + sx * cy * sz;
      dst[2] = cx * cy * sz + sx * sy * cz;
      dst[3] = cx * cy * cz - sx * sy * sz;
      break;
    case "zyx":
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
function copy$1(q, dst) {
  dst = dst || new QuatType(4);
  dst[0] = q[0];
  dst[1] = q[1];
  dst[2] = q[2];
  dst[3] = q[3];
  return dst;
}
var clone$1 = copy$1;
function add$1(a, b, dst) {
  dst = dst || new QuatType(4);
  dst[0] = a[0] + b[0];
  dst[1] = a[1] + b[1];
  dst[2] = a[2] + b[2];
  dst[3] = a[3] + b[3];
  return dst;
}
function subtract$1(a, b, dst) {
  dst = dst || new QuatType(4);
  dst[0] = a[0] - b[0];
  dst[1] = a[1] - b[1];
  dst[2] = a[2] - b[2];
  dst[3] = a[3] - b[3];
  return dst;
}
var sub$1 = subtract$1;
function mulScalar$1(v, k, dst) {
  dst = dst || new QuatType(4);
  dst[0] = v[0] * k;
  dst[1] = v[1] * k;
  dst[2] = v[2] * k;
  dst[3] = v[3] * k;
  return dst;
}
var scale$1 = mulScalar$1;
function divScalar$1(v, k, dst) {
  dst = dst || new QuatType(4);
  dst[0] = v[0] / k;
  dst[1] = v[1] / k;
  dst[2] = v[2] / k;
  dst[3] = v[3] / k;
  return dst;
}
function dot$1(a, b) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];
}
function lerp$1(a, b, t, dst) {
  dst = dst || new QuatType(4);
  dst[0] = a[0] + t * (b[0] - a[0]);
  dst[1] = a[1] + t * (b[1] - a[1]);
  dst[2] = a[2] + t * (b[2] - a[2]);
  dst[3] = a[3] + t * (b[3] - a[3]);
  return dst;
}
function length$1(v) {
  const v0 = v[0];
  const v1 = v[1];
  const v2 = v[2];
  const v3 = v[3];
  return Math.sqrt(v0 * v0 + v1 * v1 + v2 * v2 + v3 * v3);
}
var len$1 = length$1;
function lengthSq$1(v) {
  const v0 = v[0];
  const v1 = v[1];
  const v2 = v[2];
  const v3 = v[3];
  return v0 * v0 + v1 * v1 + v2 * v2 + v3 * v3;
}
var lenSq$1 = lengthSq$1;
function normalize$1(v, dst) {
  dst = dst || new QuatType(4);
  const v0 = v[0];
  const v1 = v[1];
  const v2 = v[2];
  const v3 = v[3];
  const len2 = Math.sqrt(v0 * v0 + v1 * v1 + v2 * v2 + v3 * v3);
  if (len2 > 1e-5) {
    dst[0] = v0 / len2;
    dst[1] = v1 / len2;
    dst[2] = v2 / len2;
    dst[3] = v3 / len2;
  } else {
    dst[0] = 0;
    dst[1] = 0;
    dst[2] = 0;
    dst[3] = 0;
  }
  return dst;
}
function equalsApproximately$1(a, b) {
  return Math.abs(a[0] - b[0]) < EPSILON && Math.abs(a[1] - b[1]) < EPSILON && Math.abs(a[2] - b[2]) < EPSILON && Math.abs(a[3] - b[3]) < EPSILON;
}
function equals$1(a, b) {
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3];
}
function identity(dst) {
  dst = dst || new QuatType(4);
  dst[0] = 0;
  dst[1] = 0;
  dst[2] = 0;
  dst[3] = 1;
  return dst;
}
var tempVec3;
var xUnitVec3;
var yUnitVec3;
function rotationTo(aUnit, bUnit, dst) {
  dst = dst || new QuatType(4);
  tempVec3 = tempVec3 || create$4();
  xUnitVec3 = xUnitVec3 || create$4(1, 0, 0);
  yUnitVec3 = yUnitVec3 || create$4(0, 1, 0);
  const dot2 = dot$2(aUnit, bUnit);
  if (dot2 < -0.999999) {
    cross(xUnitVec3, aUnit, tempVec3);
    if (len$2(tempVec3) < 1e-6) {
      cross(yUnitVec3, aUnit, tempVec3);
    }
    normalize$2(tempVec3, tempVec3);
    fromAxisAngle(tempVec3, Math.PI, dst);
    return dst;
  } else if (dot2 > 0.999999) {
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
    dst[3] = 1 + dot2;
    return normalize$1(dst, dst);
  }
}
var tempQuat1;
var tempQuat2;
function sqlerp(a, b, c, d, t, dst) {
  dst = dst || new QuatType(4);
  tempQuat1 = tempQuat1 || new QuatType(4);
  tempQuat2 = tempQuat2 || new QuatType(4);
  slerp(a, d, t, tempQuat1);
  slerp(b, c, t, tempQuat2);
  slerp(tempQuat1, tempQuat2, 2 * t * (1 - t), dst);
  return dst;
}
var quatImpl = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  create: create$1,
  setDefaultType: setDefaultType$2,
  fromValues: fromValues$1,
  set: set$1,
  fromAxisAngle,
  toAxisAngle,
  angle,
  multiply: multiply$1,
  mul: mul$1,
  rotateX,
  rotateY,
  rotateZ,
  slerp,
  inverse: inverse$1,
  conjugate,
  fromMat,
  fromEuler,
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
  identity,
  rotationTo,
  sqlerp
});
var VecType = Float32Array;
function setDefaultType$1(ctor) {
  const oldType = VecType;
  VecType = ctor;
  return oldType;
}
function create(x2, y2, z, w) {
  const dst = new VecType(4);
  if (x2 !== void 0) {
    dst[0] = x2;
    if (y2 !== void 0) {
      dst[1] = y2;
      if (z !== void 0) {
        dst[2] = z;
        if (w !== void 0) {
          dst[3] = w;
        }
      }
    }
  }
  return dst;
}
var fromValues = create;
function set(x2, y2, z, w, dst) {
  dst = dst || new VecType(4);
  dst[0] = x2;
  dst[1] = y2;
  dst[2] = z;
  dst[3] = w;
  return dst;
}
function ceil(v, dst) {
  dst = dst || new VecType(4);
  dst[0] = Math.ceil(v[0]);
  dst[1] = Math.ceil(v[1]);
  dst[2] = Math.ceil(v[2]);
  dst[3] = Math.ceil(v[3]);
  return dst;
}
function floor(v, dst) {
  dst = dst || new VecType(4);
  dst[0] = Math.floor(v[0]);
  dst[1] = Math.floor(v[1]);
  dst[2] = Math.floor(v[2]);
  dst[3] = Math.floor(v[3]);
  return dst;
}
function round(v, dst) {
  dst = dst || new VecType(4);
  dst[0] = Math.round(v[0]);
  dst[1] = Math.round(v[1]);
  dst[2] = Math.round(v[2]);
  dst[3] = Math.round(v[3]);
  return dst;
}
function clamp(v, min2 = 0, max2 = 1, dst) {
  dst = dst || new VecType(4);
  dst[0] = Math.min(max2, Math.max(min2, v[0]));
  dst[1] = Math.min(max2, Math.max(min2, v[1]));
  dst[2] = Math.min(max2, Math.max(min2, v[2]));
  dst[3] = Math.min(max2, Math.max(min2, v[3]));
  return dst;
}
function add(a, b, dst) {
  dst = dst || new VecType(4);
  dst[0] = a[0] + b[0];
  dst[1] = a[1] + b[1];
  dst[2] = a[2] + b[2];
  dst[3] = a[3] + b[3];
  return dst;
}
function addScaled(a, b, scale4, dst) {
  dst = dst || new VecType(4);
  dst[0] = a[0] + b[0] * scale4;
  dst[1] = a[1] + b[1] * scale4;
  dst[2] = a[2] + b[2] * scale4;
  dst[3] = a[3] + b[3] * scale4;
  return dst;
}
function subtract(a, b, dst) {
  dst = dst || new VecType(4);
  dst[0] = a[0] - b[0];
  dst[1] = a[1] - b[1];
  dst[2] = a[2] - b[2];
  dst[3] = a[3] - b[3];
  return dst;
}
var sub = subtract;
function equalsApproximately(a, b) {
  return Math.abs(a[0] - b[0]) < EPSILON && Math.abs(a[1] - b[1]) < EPSILON && Math.abs(a[2] - b[2]) < EPSILON && Math.abs(a[3] - b[3]) < EPSILON;
}
function equals(a, b) {
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3];
}
function lerp(a, b, t, dst) {
  dst = dst || new VecType(4);
  dst[0] = a[0] + t * (b[0] - a[0]);
  dst[1] = a[1] + t * (b[1] - a[1]);
  dst[2] = a[2] + t * (b[2] - a[2]);
  dst[3] = a[3] + t * (b[3] - a[3]);
  return dst;
}
function lerpV(a, b, t, dst) {
  dst = dst || new VecType(4);
  dst[0] = a[0] + t[0] * (b[0] - a[0]);
  dst[1] = a[1] + t[1] * (b[1] - a[1]);
  dst[2] = a[2] + t[2] * (b[2] - a[2]);
  dst[3] = a[3] + t[3] * (b[3] - a[3]);
  return dst;
}
function max(a, b, dst) {
  dst = dst || new VecType(4);
  dst[0] = Math.max(a[0], b[0]);
  dst[1] = Math.max(a[1], b[1]);
  dst[2] = Math.max(a[2], b[2]);
  dst[3] = Math.max(a[3], b[3]);
  return dst;
}
function min(a, b, dst) {
  dst = dst || new VecType(4);
  dst[0] = Math.min(a[0], b[0]);
  dst[1] = Math.min(a[1], b[1]);
  dst[2] = Math.min(a[2], b[2]);
  dst[3] = Math.min(a[3], b[3]);
  return dst;
}
function mulScalar(v, k, dst) {
  dst = dst || new VecType(4);
  dst[0] = v[0] * k;
  dst[1] = v[1] * k;
  dst[2] = v[2] * k;
  dst[3] = v[3] * k;
  return dst;
}
var scale2 = mulScalar;
function divScalar(v, k, dst) {
  dst = dst || new VecType(4);
  dst[0] = v[0] / k;
  dst[1] = v[1] / k;
  dst[2] = v[2] / k;
  dst[3] = v[3] / k;
  return dst;
}
function inverse(v, dst) {
  dst = dst || new VecType(4);
  dst[0] = 1 / v[0];
  dst[1] = 1 / v[1];
  dst[2] = 1 / v[2];
  dst[3] = 1 / v[3];
  return dst;
}
var invert = inverse;
function dot(a, b) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];
}
function length(v) {
  const v0 = v[0];
  const v1 = v[1];
  const v2 = v[2];
  const v3 = v[3];
  return Math.sqrt(v0 * v0 + v1 * v1 + v2 * v2 + v3 * v3);
}
var len = length;
function lengthSq(v) {
  const v0 = v[0];
  const v1 = v[1];
  const v2 = v[2];
  const v3 = v[3];
  return v0 * v0 + v1 * v1 + v2 * v2 + v3 * v3;
}
var lenSq = lengthSq;
function distance(a, b) {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  const dz = a[2] - b[2];
  const dw = a[3] - b[3];
  return Math.sqrt(dx * dx + dy * dy + dz * dz + dw * dw);
}
var dist = distance;
function distanceSq(a, b) {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  const dz = a[2] - b[2];
  const dw = a[3] - b[3];
  return dx * dx + dy * dy + dz * dz + dw * dw;
}
var distSq = distanceSq;
function normalize(v, dst) {
  dst = dst || new VecType(4);
  const v0 = v[0];
  const v1 = v[1];
  const v2 = v[2];
  const v3 = v[3];
  const len2 = Math.sqrt(v0 * v0 + v1 * v1 + v2 * v2 + v3 * v3);
  if (len2 > 1e-5) {
    dst[0] = v0 / len2;
    dst[1] = v1 / len2;
    dst[2] = v2 / len2;
    dst[3] = v3 / len2;
  } else {
    dst[0] = 0;
    dst[1] = 0;
    dst[2] = 0;
    dst[3] = 0;
  }
  return dst;
}
function negate(v, dst) {
  dst = dst || new VecType(4);
  dst[0] = -v[0];
  dst[1] = -v[1];
  dst[2] = -v[2];
  dst[3] = -v[3];
  return dst;
}
function copy(v, dst) {
  dst = dst || new VecType(4);
  dst[0] = v[0];
  dst[1] = v[1];
  dst[2] = v[2];
  dst[3] = v[3];
  return dst;
}
var clone = copy;
function multiply(a, b, dst) {
  dst = dst || new VecType(4);
  dst[0] = a[0] * b[0];
  dst[1] = a[1] * b[1];
  dst[2] = a[2] * b[2];
  dst[3] = a[3] * b[3];
  return dst;
}
var mul = multiply;
function divide(a, b, dst) {
  dst = dst || new VecType(4);
  dst[0] = a[0] / b[0];
  dst[1] = a[1] / b[1];
  dst[2] = a[2] / b[2];
  dst[3] = a[3] / b[3];
  return dst;
}
var div = divide;
function zero(dst) {
  dst = dst || new VecType(4);
  dst[0] = 0;
  dst[1] = 0;
  dst[2] = 0;
  dst[3] = 0;
  return dst;
}
function transformMat4(v, m, dst) {
  dst = dst || new VecType(4);
  const x2 = v[0];
  const y2 = v[1];
  const z = v[2];
  const w = v[3];
  dst[0] = m[0] * x2 + m[4] * y2 + m[8] * z + m[12] * w;
  dst[1] = m[1] * x2 + m[5] * y2 + m[9] * z + m[13] * w;
  dst[2] = m[2] * x2 + m[6] * y2 + m[10] * z + m[14] * w;
  dst[3] = m[3] * x2 + m[7] * y2 + m[11] * z + m[15] * w;
  return dst;
}
var vec4Impl = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  create,
  setDefaultType: setDefaultType$1,
  fromValues,
  set,
  ceil,
  floor,
  round,
  clamp,
  add,
  addScaled,
  subtract,
  sub,
  equalsApproximately,
  equals,
  lerp,
  lerpV,
  max,
  min,
  mulScalar,
  scale: scale2,
  divScalar,
  inverse,
  invert,
  dot,
  length,
  len,
  lengthSq,
  lenSq,
  distance,
  dist,
  distanceSq,
  distSq,
  normalize,
  negate,
  copy,
  clone,
  multiply,
  mul,
  divide,
  div,
  zero,
  transformMat4
});

// ../../../engine/utils.js
var supportsTouch = "ontouchstart" in window || navigator.msMaxTouchPoints;
function isMobile() {
  if (supportsTouch == true) return true;
  const toMatch = [/Android/i, /webOS/i, /iPhone/i, /iPad/i, /iPod/i, /BlackBerry/i, /Windows Phone/i];
  return toMatch.some((toMatchItem) => {
    return navigator.userAgent.match(toMatchItem);
  });
}
function degToRad(degrees) {
  return degrees * Math.PI / 180;
}
function radToDeg(r2) {
  var pi = Math.PI;
  return r2 * (180 / pi);
}
var scriptManager = {
  SCRIPT_ID: 0,
  LOAD: function addScript(src, id2, type2, parent, callback) {
    var s = document.createElement("script");
    s.onload = function() {
      if (typeof callback != "undefined") callback();
    };
    if (typeof type2 !== "undefined") {
      s.setAttribute("type", type2);
      s.innerHTML = src;
    } else {
      s.setAttribute("src", src);
    }
    if (typeof id2 !== "undefined") {
      s.setAttribute("id", id2);
    }
    if (typeof parent !== "undefined") {
      document.getElementById(parent).appendChild(s);
      if (typeof callback != "undefined") callback();
    } else {
      document.body.appendChild(s);
    }
  },
  loadModule: function addScript2(src, id2, type2, parent) {
    console.log("Script id load called ");
    var s = document.createElement("script");
    s.onload = function() {
      scriptManager.SCRIPT_ID++;
    };
    if (typeof type2 === "undefined") {
      s.setAttribute("type", "module");
      s.setAttribute("src", src);
    } else {
      s.setAttribute("type", type2);
      s.innerHTML = src;
    }
    s.setAttribute("src", src);
    if (typeof id2 !== "undefined") {
      s.setAttribute("id", id2);
    }
    if (typeof parent !== "undefined") {
      document.getElementById(parent).appendChild(s);
    } else {
      document.body.appendChild(s);
    }
  },
  loadGLSL: function(src) {
    return new Promise((resolve) => {
      fetch(src).then((data) => {
        resolve(data.text());
      });
    });
  }
};
function OSCILLATOR(min2, max2, step, options2) {
  if (min2 == null || max2 == null || step == null) {
    console.log("OSCILLATOR ERROR");
    return;
  }
  var ROOT = this;
  this.min0 = parseFloat(min2);
  this.max0 = parseFloat(max2);
  this.min = this.min0;
  this.max = this.max0;
  this.step = parseFloat(step);
  this.value_ = this.min;
  this.status = 0;
  options2 = options2 || {};
  this.regime = options2.regime || "pingpong";
  this.resist = parseFloat(options2.resist) || 0;
  this.resistMode = options2.resistMode || "linear";
  this.stopEpsilon = options2.stopEpsilon || 0;
  this.useDelta = options2.useDelta || false;
  this.on_maximum_value = function() {
  };
  this.on_minimum_value = function() {
  };
  this.on_stop = function() {
  };
  this._applyResist = function() {
    if (this.resist <= 0) return;
    var range = this.max - this.min;
    if (range <= 0) return;
    var shrink;
    if (this.resistMode === "exp") {
      shrink = range * this.resist;
    } else {
      shrink = (this.max0 - this.min0) * this.resist;
    }
    this.min += shrink;
    this.max -= shrink;
    if (this.min > this.max) {
      var c = (this.min + this.max) * 0.5;
      this.min = this.max = c;
    }
  };
  this.UPDATE = function(delta) {
    var s = this.step;
    if (this.useDelta && delta !== void 0) {
      s = s * delta;
    }
    switch (this.regime) {
      // ===== PING-PONG =====
      case "pingpong":
        if (this.status === 0) {
          this.value_ += s;
          if (this.value_ >= this.max) {
            this.value_ = this.max;
            this.status = 1;
            ROOT.on_maximum_value();
          }
        } else {
          this.value_ -= s;
          if (this.value_ <= this.min) {
            this.value_ = this.min;
            this.status = 0;
            this._applyResist();
            ROOT.on_minimum_value();
          }
        }
        break;
      // ===== ONLY MIN → MAX =====
      case "onlyFromMinToMax":
        this.value_ += s;
        if (this.value_ >= this.max) {
          this.value_ = this.min;
          this._applyResist();
          ROOT.on_maximum_value();
        }
        break;
      // ===== MAX → MIN =====
      case "fromMaxToMin":
        this.value_ -= s;
        if (this.value_ <= this.min) {
          this.value_ = this.max;
          this._applyResist();
          ROOT.on_minimum_value();
        }
        break;
      // ===== ONE SHOT =====
      case "oneShot":
        this.value_ += s;
        if (this.value_ >= this.max) {
          this.value_ = this.max;
          ROOT.on_stop();
        }
        break;
      // ===== SPRING TO CENTER =====
      case "springCenter":
        var center = (this.min + this.max) * 0.5;
        var force = (center - this.value_) * this.resist;
        this.value_ += force + s;
        if (Math.abs(center - this.value_) < this.stopEpsilon) {
          this.value_ = center;
          ROOT.on_stop();
        }
        break;
    }
    if (this.stopEpsilon > 0) {
      if (this.max - this.min < this.stopEpsilon) {
        ROOT.on_stop();
      }
    }
    return this.value_;
  };
}
var byId = function(id2) {
  return document.getElementById(id2);
};
function randomFloatFromTo(min2, max2) {
  return Math.random() * (max2 - min2) + min2;
}
function randomIntFromTo(min2, max2) {
  if (typeof min2 === "object" || typeof max2 === "object") {
    console.log(
      "SYS : warning Desciption : Replace object with string , this >> " + typeof min2 + " and " + typeof min2 + " << must be string or number."
    );
  } else if (typeof min2 === "undefined" || typeof max2 === "undefined") {
    console.log(
      "SYS : warning Desciption : arguments (min, max) cant be undefined , this >> " + typeof min2 + " and " + typeof min2 + " << must be string or number."
    );
  } else {
    return Math.floor(Math.random() * (max2 - min2 + 1) + min2);
  }
}
var urlQuery = (function() {
  var query_string = {};
  var query = window.location.search.substring(1);
  var vars = query.split("&");
  for (var i = 0; i < vars.length; i++) {
    var pair = vars[i].split("=");
    if (typeof query_string[pair[0]] === "undefined") {
      query_string[pair[0]] = decodeURIComponent(pair[1]);
    } else if (typeof query_string[pair[0]] === "string") {
      var arr = [query_string[pair[0]], decodeURIComponent(pair[1])];
      query_string[pair[0]] = arr;
    } else {
      query_string[pair[0]].push(decodeURIComponent(pair[1]));
    }
  }
  return query_string;
})();
function quaternion_rotation_matrix(Q) {
  var q0 = Q[0];
  var q1 = Q[1];
  var q2 = Q[2];
  var q3 = Q[3];
  var r00 = 2 * (q0 * q0 + q1 * q1) - 1;
  var r01 = 2 * (q1 * q2 - q0 * q3);
  var r02 = 2 * (q1 * q3 + q0 * q2);
  var r10 = 2 * (q1 * q2 + q0 * q3);
  var r11 = 2 * (q0 * q0 + q2 * q2) - 1;
  var r12 = 2 * (q2 * q3 - q0 * q1);
  var r20 = 2 * (q1 * q3 - q0 * q2);
  var r21 = 2 * (q2 * q3 + q0 * q1);
  var r22 = 2 * (q0 * q0 + q3 * q3) - 1;
  var rot_matrix = [
    [r00, r01, r02],
    [r10, r11, r12],
    [r20, r21, r22]
  ];
  return rot_matrix;
}
var LOG_WARN = "background: gray; color: yellow; font-size:10px";
var LOG_FUNNY = "font-family: stormfaze;color: #f1f033; font-size:18px;text-shadow: 2px 2px 4px #f335f4, 4px 4px 4px #d64444, 2px 2px 4px #c160a6, 6px 2px 0px #123de3;background: black;";
var LOG_FUNNY_SMALL = "font-family: stormfaze;color: #f1f033; font-size:10px;text-shadow: 2px 2px 4px #f335f4, 4px 4px 4px #d64444, 1px 1px 2px #c160a6, 3px 1px 0px #123de3;background: black;";
var LOG_FUNNY_ARCADE2 = "font-family: system-ui; font-size:16px; font-weight:400;color:#ffffff;text-shadow: 2px 2px 6px #000;background:linear-gradient(90deg,#111,#222); padding:12px 18px;";
var LOG_FUNNY_BIG_ARCADE = "font-family: system-ui; font-size:24px; font-weight:600;color:#ffffff;text-shadow: 2px 2px 6px #000;background:linear-gradient(90deg,#111,#222); padding:12px 18px;";
var LOG_FUNNY_BIG_NEON = "font-family: stormfaze; font-size:30px; font-weight:900;color:#00ffff;text-shadow: 0 0 5px #01d6d6ff, 0 0 10px #00ffff, 4px 4px 0 #ff00ff;background:black; padding:14px 18px;";
var LOG_FUNNY_EXTRABIG = "font-family: stormfaze; font-size:230px; font-weight:900;color:#00ffff;text-shadow: 0 0 5px #01d6d6ff, 0 0 10px #00ffff, 4px 4px 0 #ff00ff;background:black; padding:14px 18px;";
function genName(length2) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result2 = "";
  for (let i = 0; i < length2; i++) {
    result2 += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result2;
}
var mb = {
  root: () => byId("msgBox"),
  pContent: () => byId("not-content"),
  copy: function() {
    navigator.clipboard.writeText(mb.root().children[0].innerText);
  },
  c: 0,
  ic: 0,
  t: {},
  setContent: function(content, t) {
    var iMsg = document.createElement("div");
    iMsg.innerHTML = content;
    iMsg.id = `msgbox-loc-${mb.c}`;
    mb.root().appendChild(iMsg);
    iMsg.classList.add("animate1");
    if (t == "ok") {
      iMsg.style = "font-family: stormfaze;color:white;padding:7px;margin:2px";
    } else {
      iMsg.style = "font-family: stormfaze;color:white;padding:7px;margin:2px";
    }
  },
  kill: function() {
    mb.root().remove();
  },
  show: function(content, t) {
    mb.setContent(content, t);
    mb.root().style.display = "block";
    var loc2 = mb.c;
    setTimeout(function() {
      byId(`msgbox-loc-${loc2}`).classList.remove("fadeInDown");
      byId(`msgbox-loc-${loc2}`).classList.add("fadeOut");
      setTimeout(function() {
        byId(`msgbox-loc-${loc2}`).style.display = "none";
        byId(`msgbox-loc-${loc2}`).classList.remove("fadeOut");
        byId(`msgbox-loc-${loc2}`).remove();
        mb.ic++;
        if (mb.c == mb.ic) {
          mb.root().style.display = "none";
        }
      }, 1e3);
    }, 3e3);
    mb.c++;
  },
  error: function(content) {
    if (mb.root() == null) return;
    mb.root().classList.remove("success");
    mb.root().classList.add("error");
    mb.root().classList.add("fadeInDown");
    mb.show(content, "err");
  },
  success: function(content) {
    if (mb.root() == null) return;
    mb.root().classList.remove("error");
    mb.root().classList.add("success");
    mb.root().classList.add("fadeInDown");
    mb.show(content, "ok");
  }
};
var jsonHeaders = new Headers({
  "Content-Type": "application/json",
  "Accept": "application/json"
});
var htmlHeader = new Headers({
  "Content-Type": "text/html",
  "Accept": "text/plain"
});
var FullscreenManager = class {
  constructor() {
    this.target = document.documentElement;
  }
  isFullscreen() {
    return !!(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement);
  }
  request() {
    const el2 = this.target;
    return el2.requestFullscreen?.() || el2.webkitRequestFullscreen?.() || el2.mozRequestFullScreen?.() || el2.msRequestFullscreen?.();
  }
  exit() {
    return document.exitFullscreen?.() || document.webkitExitFullscreen?.() || document.mozCancelFullScreen?.() || document.msExitFullscreen?.();
  }
  toggle() {
    return this.isFullscreen() ? this.exit() : this.request();
  }
  onChange(callback) {
    [
      "fullscreenchange",
      "webkitfullscreenchange",
      "mozfullscreenchange",
      "MSFullscreenChange"
    ].forEach(
      (evt) => document.addEventListener(evt, () => {
        callback(this.isFullscreen());
      })
    );
  }
};

// ../../../engine/engine.js
var CameraBase = class {
  // The camera matrix
  matrix_ = new Float32Array([
    1,
    0,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    0,
    1
  ]);
  // The calculated view matrix readonly
  view_ = mat4Impl.create();
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
  set matrix(mat2) {
    mat4Impl.copy(mat2, this.matrix_);
  }
  // setProjection(fov = (2*Math.PI) / 5 , aspect = 1, near = 0.5, far = 1000) {
  //   this.projectionMatrix = mat4.perspective(fov, aspect, near, far);
  // }
  // Returns the camera view matrix
  get view() {
    return this.view_;
  }
  // Assigns `mat` to the camera view
  set view(mat2) {
    mat4Impl.copy(mat2, this.view_);
  }
  // Returns column vector 0 of the camera matrix
  get right() {
    return this.right_;
  }
  // Assigns `vec` to the first 3 elements of column vector 0 of the camera matrix
  set right(vec) {
    vec3Impl.copy(vec, this.right_);
  }
  // Returns column vector 1 of the camera matrix
  get up() {
    return this.up_;
  }
  // Assigns `vec` to the first 3 elements of column vector 1 of the camera matrix \ Vec3
  set up(vec) {
    vec3Impl.copy(vec, this.up_);
  }
  // Returns column vector 2 of the camera matrix
  get back() {
    return this.back_;
  }
  // Assigns `vec` to the first 3 elements of column vector 2 of the camera matrix
  set back(vec) {
    vec3Impl.copy(vec, this.back_);
  }
  // Returns column vector 3 of the camera matrix
  get position() {
    return this.position_;
  }
  // Assigns `vec` to the first 3 elements of column vector 3 of the camera matrix
  set position(vec) {
    vec3Impl.copy(vec, this.position_);
  }
};
var WASDCamera = class extends CameraBase {
  // The camera absolute pitch angle
  pitch = 0;
  // The camera absolute yaw angle
  yaw = 0;
  setPitch = (pitch) => {
    this.pitch = pitch;
  };
  setYaw = (yaw) => {
    this.yaw = yaw;
  };
  setX = (x2) => {
    this.position[0] = x2;
  };
  setY = (y2) => {
    this.position[1] = y2;
  };
  setZ = (z) => {
    this.position[2] = z;
  };
  // The movement veloicty readonly
  velocity_ = vec3Impl.create();
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
    vec3Impl.copy(vec, this.velocity_);
  }
  setProjection(fov = 2 * Math.PI / 5, aspect = 1, near = 1, far = 1e3) {
    this.projectionMatrix = mat4Impl.perspective(fov, aspect, near, far);
  }
  constructor(options2) {
    super();
    if (options2 && (options2.position || options2.target)) {
      const position = options2.position ?? vec3Impl.create(0, 0, 0);
      const target = options2.target ?? vec3Impl.create(0, 0, 0);
      const forward = vec3Impl.normalize(vec3Impl.sub(target, position));
      this.recalculateAngles(forward);
      this.position = position;
      this.canvas = options2.canvas;
      this.aspect = options2.canvas.width / options2.canvas.height;
      this.setProjection(2 * Math.PI / 5, this.aspect, 1, 2e3);
      this.suspendDrag = false;
      if (options2.pitch) this.setPitch(options2.pitch);
      if (options2.yaw) this.setYaw(options2.yaw);
    }
  }
  // Returns the camera matrix
  get matrix() {
    return super.matrix;
  }
  // Assigns `mat` to the camera matrix, and recalcuates the camera angles
  set matrix(mat2) {
    super.matrix = mat2;
    this.recalculateAngles(this.back);
  }
  update(deltaTime, input) {
    const sign = (positive, negative) => (positive ? 1 : 0) - (negative ? 1 : 0);
    if (this.suspendDrag == false) {
      this.yaw -= input.analog.x * deltaTime * this.rotationSpeed;
      this.pitch -= input.analog.y * deltaTime * this.rotationSpeed;
    }
    this.yaw = mod(this.yaw, Math.PI * 2);
    this.pitch = clamp2(this.pitch, -Math.PI / 2, Math.PI / 2);
    const position = vec3Impl.copy(this.position);
    super.matrix = mat4Impl.rotateX(mat4Impl.rotationY(this.yaw), this.pitch);
    const digital = input.digital;
    const deltaRight = sign(digital.right, digital.left);
    const deltaUp = sign(digital.up, digital.down);
    const targetVelocity = vec3Impl.create();
    const deltaBack = sign(digital.backward, digital.forward);
    vec3Impl.addScaled(targetVelocity, this.right, deltaRight, targetVelocity);
    vec3Impl.addScaled(targetVelocity, this.up, deltaUp, targetVelocity);
    vec3Impl.addScaled(targetVelocity, this.back, deltaBack, targetVelocity);
    vec3Impl.normalize(targetVelocity, targetVelocity);
    vec3Impl.mulScalar(targetVelocity, this.movementSpeed, targetVelocity);
    this.velocity = lerp2(
      targetVelocity,
      this.velocity,
      Math.pow(1 - this.frictionCoefficient, deltaTime)
    );
    this.position = vec3Impl.addScaled(position, this.velocity, deltaTime);
    this.view = mat4Impl.invert(this.matrix);
    return this.view;
  }
  // Recalculates the yaw and pitch values from a directional vector
  recalculateAngles(dir) {
    this.yaw = Math.atan2(dir[0], dir[2]);
    this.pitch = -Math.asin(dir[1]);
  }
};
var ArcballCamera = class extends CameraBase {
  // The camera distance from the target
  distance = 0;
  // The current angular velocity
  angularVelocity = 0;
  // The current rotation axis
  axis_ = vec3Impl.create();
  // Returns the rotation axis
  get axis() {
    return this.axis_;
  }
  // Assigns `vec` to the rotation axis
  set axis(vec) {
    vec3Impl.copy(vec, this.axis_);
  }
  // Speed multiplier for camera rotation
  rotationSpeed = 1;
  // Speed multiplier for camera zoom
  zoomSpeed = 0.1;
  // Rotation velocity drag coeffient [0 .. 1]
  // 0: Spins forever
  // 1: Instantly stops spinning
  frictionCoefficient = 0.999;
  setProjection(fov = 2 * Math.PI / 5, aspect = 1, near = 1, far = 1e3) {
    this.projectionMatrix = mat4Impl.perspective(fov, aspect, near, far);
  }
  // Construtor
  constructor(options2) {
    super();
    if (options2 && options2.position) {
      this.position = options2.position;
      this.distance = vec3Impl.len(this.position);
      this.back = vec3Impl.normalize(this.position);
      this.setProjection(2 * Math.PI / 5, this.aspect, 1, 2e3);
      this.recalcuateRight();
      this.recalcuateUp();
    }
  }
  // Returns the camera matrix
  get matrix() {
    return super.matrix;
  }
  // Assigns `mat` to the camera matrix, and recalcuates the distance
  set matrix(mat2) {
    super.matrix = mat2;
    this.distance = vec3Impl.len(this.position);
  }
  update(deltaTime, input) {
    const epsilon = 1e-7;
    if (input.analog.touching) {
      this.angularVelocity = 0;
    } else {
      this.angularVelocity *= Math.pow(1 - this.frictionCoefficient, deltaTime);
    }
    const movement = vec3Impl.create();
    vec3Impl.addScaled(movement, this.right, input.analog.x, movement);
    vec3Impl.addScaled(movement, this.up, -input.analog.y, movement);
    const crossProduct = vec3Impl.cross(movement, this.back);
    const magnitude = vec3Impl.len(crossProduct);
    if (magnitude > epsilon) {
      this.axis = vec3Impl.scale(crossProduct, 1 / magnitude);
      this.angularVelocity = magnitude * this.rotationSpeed;
    }
    const rotationAngle = this.angularVelocity * deltaTime;
    if (rotationAngle > epsilon) {
      this.back = vec3Impl.normalize(rotate2(this.back, this.axis, rotationAngle));
      this.recalcuateRight();
      this.recalcuateUp();
    }
    if (input.analog.zoom !== 0) {
      this.distance *= 1 + input.analog.zoom * this.zoomSpeed;
    }
    this.position = vec3Impl.scale(this.back, this.distance);
    this.view = mat4Impl.invert(this.matrix);
    return this.view;
  }
  // Assigns `this.right` with the cross product of `this.up` and `this.back`
  recalcuateRight() {
    this.right = vec3Impl.normalize(vec3Impl.cross(this.up, this.back));
  }
  // Assigns `this.up` with the cross product of `this.back` and `this.right`
  recalcuateUp() {
    this.up = vec3Impl.normalize(vec3Impl.cross(this.back, this.right));
  }
};
function clamp2(x2, min2, max2) {
  return Math.min(Math.max(x2, min2), max2);
}
function mod(x2, div2) {
  return x2 - Math.floor(Math.abs(x2) / div2) * div2 * Math.sign(x2);
}
function rotate2(vec, axis, angle2) {
  return vec3Impl.transformMat4Upper3x3(vec, mat4Impl.rotation(axis, angle2));
}
function lerp2(a, b, s) {
  return vec3Impl.addScaled(a, vec3Impl.sub(b, a), s);
}
function createInputHandler(window2, canvas) {
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
      case "KeyW":
        digital.forward = value;
        break;
      case "KeyS":
        digital.backward = value;
        break;
      case "KeyA":
        digital.left = value;
        break;
      case "KeyD":
        digital.right = value;
        break;
      case "KeyV":
        digital.up = value;
        break;
      case "KeyC":
        digital.down = value;
        break;
    }
    e.stopPropagation();
  };
  window2.addEventListener("keydown", (e) => setDigital(e, true));
  window2.addEventListener("keyup", (e) => setDigital(e, false));
  canvas.style.touchAction = "pinch-zoom";
  canvas.addEventListener("pointerdown", () => {
    mouseDown = true;
  });
  canvas.addEventListener("pointerup", () => {
    mouseDown = false;
  });
  canvas.addEventListener("pointermove", (e) => {
    mouseDown = e.pointerType === "mouse" ? (e.buttons & 1) !== 0 : true;
    if (mouseDown) {
      analog.x += e.movementX / 10;
      analog.y += e.movementY / 10;
    }
  });
  canvas.addEventListener("wheel", (e) => {
  }, { passive: false });
  return () => {
    const safeX = analog.x || 1e-4;
    const safeY = analog.y || 1e-4;
    const out = {
      digital,
      analog: {
        x: safeX,
        y: safeY,
        zoom: analog.zoom,
        touching: mouseDown
      }
    };
    analog.x = 0;
    analog.y = 0;
    analog.zoom = 0;
    return out;
  };
}
var RPGCamera = class extends CameraBase {
  followMe = null;
  pitch = 0;
  yaw = 0;
  velocity_ = vec3Impl.create();
  movementSpeed = 10;
  rotationSpeed = 1;
  followMeOffset = 150;
  // << mobile adaptation needed after all...
  // Movement velocity drag coeffient [0 .. 1]
  // 0: Continues forever
  // 1: Instantly stops moving
  frictionCoefficient = 0.99;
  // Inside your camera control init
  scrollY = 50;
  minY = 50.5;
  // minimum camera height
  maxY = 135;
  // maximum camera height
  scrollSpeed = 1;
  get velocity() {
    return this.velocity_;
  }
  set velocity(vec) {
    vec3Impl.copy(vec, this.velocity_);
  }
  setProjection(fov = 2 * Math.PI / 5, aspect = 1, near = 1, far = 1e3) {
    this.projectionMatrix = mat4Impl.perspective(fov, aspect, near, far);
  }
  constructor(options2) {
    super();
    if (options2 && (options2.position || options2.target)) {
      const position = options2.position ?? vec3Impl.create(0, 0, 0);
      const target = options2.target ?? vec3Impl.create(0, 0, 0);
      const forward = vec3Impl.normalize(vec3Impl.sub(target, position));
      this.recalculateAngles(forward);
      this.position = position;
      this.canvas = options2.canvas;
      this.aspect = options2.canvas.width / options2.canvas.height;
      this.setProjection(2 * Math.PI / 5, this.aspect, 1, 2e3);
      this.mousRollInAction = false;
      addEventListener("wheel", (e) => {
        this.mousRollInAction = true;
        this.scrollY -= e.deltaY * this.scrollSpeed * 0.01;
        this.scrollY = Math.max(this.minY, Math.min(this.maxY, this.scrollY));
      });
    }
  }
  get matrix() {
    return super.matrix;
  }
  // Assigns `mat` to the camera matrix, and recalcuates the camera angles
  set matrix(mat2) {
    super.matrix = mat2;
    this.recalculateAngles(this.back);
  }
  update(deltaTime, input) {
    const sign = (positive, negative) => (positive ? 1 : 0) - (negative ? 1 : 0);
    this.yaw = 0;
    this.pitch = -0.88;
    this.yaw = mod(this.yaw, Math.PI * 2);
    this.pitch = clamp2(this.pitch, -Math.PI / 2, Math.PI / 2);
    if (this.followMe != null && this.followMe.inMove === true || this.mousRollInAction == true) {
      this.followMeOffset = this.scrollY;
      this.position[0] = this.followMe.x;
      this.position[2] = this.followMe.z + this.followMeOffset;
      app.lightContainer[0].position[0] = this.followMe.x;
      app.lightContainer[0].position[2] = this.followMe.z;
      app.lightContainer[0].target[0] = this.followMe.x;
      app.lightContainer[0].target[2] = this.followMe.z;
      this.mousRollInAction = false;
    }
    const smoothFactor = 0.1;
    this.position[1] += (this.scrollY - this.position[1]) * smoothFactor;
    let position = vec3Impl.copy(this.position);
    super.matrix = mat4Impl.rotateX(mat4Impl.rotationY(this.yaw), this.pitch);
    const digital = input.digital;
    const deltaRight = sign(digital.right, digital.left);
    const deltaUp = sign(digital.up, digital.down);
    const targetVelocity = vec3Impl.create();
    const deltaBack = sign(digital.backward, digital.forward);
    if (deltaBack == -1) {
      position[2] += -10;
    } else if (deltaBack == 1) {
      position[2] += 10;
    }
    position[0] += deltaRight * 10;
    vec3Impl.addScaled(targetVelocity, this.right, deltaRight, targetVelocity);
    vec3Impl.addScaled(targetVelocity, this.up, deltaUp, targetVelocity);
    vec3Impl.normalize(targetVelocity, targetVelocity);
    vec3Impl.mulScalar(targetVelocity, this.movementSpeed, targetVelocity);
    this.velocity = lerp2(
      targetVelocity,
      this.velocity,
      Math.pow(1 - this.frictionCoefficient, deltaTime)
    );
    this.position = vec3Impl.addScaled(position, this.velocity, deltaTime);
    this.view = mat4Impl.invert(this.matrix);
    return this.view;
  }
  recalculateAngles(dir) {
    this.yaw = Math.atan2(dir[0], dir[2]);
    this.pitch = -Math.asin(dir[1]);
  }
};

// ../../../engine/matrix-class.js
var Position = class {
  constructor(x2, y2, z) {
    this.remoteName = null;
    this.netObject = null;
    this.toRemote = [];
    this.teams = [];
    this.netTolerance = 3;
    this.netTolerance__ = 0;
    if (typeof x2 == "undefined") x2 = 0;
    if (typeof y2 == "undefined") y2 = 0;
    if (typeof z == "undefined") z = 0;
    this.x = parseFloat(x2);
    this.y = parseFloat(y2);
    this.z = parseFloat(z);
    this.velY = 0;
    this.velX = 0;
    this.velZ = 0;
    this.inMove = false;
    this.targetX = parseFloat(x2);
    this.targetY = parseFloat(y2);
    this.targetZ = parseFloat(z);
    this.thrust = 0.01;
    return this;
  }
  getSpeed = () => {
    return this.thrust;
  };
  setSpeed = (n2) => {
    if (typeof n2 === "number") {
      this.thrust = n2;
    } else {
      console.log("Description: arguments (w, h) must be type of number.");
    }
  };
  translateByX(x2) {
    if (parseFloat(x2) == this.targetX) return;
    this.inMove = true;
    this.targetX = parseFloat(x2);
  }
  translateByY(y2) {
    if (parseFloat(y2) == this.targetY) return;
    this.inMove = true;
    this.targetY = parseFloat(y2);
  }
  translateByZ(z) {
    if (parseFloat(z) == this.targetZ) return;
    this.inMove = true;
    this.targetZ = parseFloat(z);
  }
  translateByXY(x2, y2) {
    if (parseFloat(y2) == this.targetY && parseFloat(x2) == this.targetX) return;
    this.inMove = true;
    this.targetX = parseFloat(x2);
    this.targetY = parseFloat(y2);
  }
  translateByXZ(x2, z) {
    if (parseFloat(z) == this.targetZ && parseFloat(x2) == this.targetX) return;
    this.inMove = true;
    this.targetX = parseFloat(x2);
    this.targetZ = parseFloat(z);
  }
  translateByYZ(y2, z) {
    if (parseFloat(y2) == this.targetY && parseFloat(z) == this.targetZ) return;
    this.inMove = true;
    this.targetY = parseFloat(y2);
    this.targetZ = parseFloat(z);
  }
  onTargetPositionReach() {
  }
  update() {
    var tx = parseFloat(this.targetX) - parseFloat(this.x), ty = parseFloat(this.targetY) - parseFloat(this.y), tz = parseFloat(this.targetZ) - parseFloat(this.z), dist2 = Math.sqrt(tx * tx + ty * ty + tz * tz);
    this.velX = tx / dist2 * this.thrust;
    this.velY = ty / dist2 * this.thrust;
    this.velZ = tz / dist2 * this.thrust;
    if (this.inMove == true) {
      if (dist2 > this.thrust) {
        this.x += this.velX;
        this.y += this.velY;
        this.z += this.velZ;
        if (this.netObject != null) {
          if (this.netTolerance__ > this.netTolerance) {
            if (this.teams.length == 0) {
              app.net.send({
                toRemote: this.toRemote,
                // default null
                remoteName: this.remoteName,
                // default null
                sceneName: this.netObject,
                netPos: { x: this.x, y: this.y, z: this.z }
              });
            } else {
              if (this.teams.length > 0) {
                if (this.teams[0].length > 0) app.net.send({
                  toRemote: this.teams[0],
                  // default null remote conns
                  sceneName: this.netObject,
                  // origin scene name to receive
                  netPos: { x: this.x, y: this.y, z: this.z }
                });
              }
              if (this.teams.length > 0) {
                if (this.teams[1].length > 0) app.net.send({
                  toRemote: this.teams[1],
                  // default null remote conns
                  remoteName: this.remoteName,
                  // to enemy players
                  sceneName: this.netObject,
                  // now not important
                  netPos: { x: this.x, y: this.y, z: this.z }
                });
              }
            }
            this.netTolerance__ = 0;
          } else {
            this.netTolerance__++;
          }
        }
      } else {
        this.x = this.targetX;
        this.y = this.targetY;
        this.z = this.targetZ;
        this.inMove = false;
        this.onTargetPositionReach();
        if (this.netObject != null) {
          if (this.netTolerance__ > this.netTolerance) {
            if (this.teams.length == 0) {
              app.net.send({
                toRemote: this.toRemote,
                // default null
                remoteName: this.remoteName,
                // default null
                sceneName: this.netObject,
                netPos: { x: this.x, y: this.y, z: this.z }
              });
            } else {
              if (this.teams[0].length > 0) app.net.send({
                toRemote: this.teams[0],
                sceneName: this.netObject,
                netPos: { x: this.x, y: this.y, z: this.z }
              });
              if (this.teams[1].length > 0) app.net.send({
                // team: this.teams[1],
                toRemote: this.teams[1],
                // default null remote conns
                remoteName: this.remoteName,
                // to enemy players
                sceneName: this.netObject,
                // now not important
                netPos: { x: this.x, y: this.y, z: this.z }
              });
            }
            this.netTolerance__ = 0;
          } else {
            this.netTolerance__++;
          }
        }
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
  }
  SetY(newy, em) {
    this.y = newy;
    this.targetY = newy;
    this.inMove = false;
  }
  SetZ(newz, em) {
    this.z = newz;
    this.targetZ = newz;
    this.inMove = false;
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
  }
};
var Rotation = class {
  constructor(x2, y2, z) {
    this.toRemote = [];
    this.teams = [];
    this.remoteName = null;
    this.emitX = null;
    this.emitY = null;
    this.emitZ = null;
    if (typeof x2 == "undefined") x2 = 0;
    if (typeof y2 == "undefined") y2 = 0;
    if (typeof z == "undefined") z = 0;
    this.x = x2;
    this.y = y2;
    this.z = z;
    this.netx = x2;
    this.nety = y2;
    this.netz = z;
    this.rotationSpeed = { x: 0, y: 0, z: 0 };
    this.angle = 0;
    this.axis = { x: 0, y: 0, z: 0 };
    this.matrixRotation = null;
  }
  setRotate = (x2, y2, z) => {
    this.rotationSpeed = { x: x2, y: y2, z };
  };
  setRotateX = (x2) => {
    this.rotationSpeed.x = x2;
  };
  setRotateY = (y2) => {
    this.rotationSpeed.y = y2;
  };
  setRotateZ = (z) => {
    this.rotationSpeed.z = z;
  };
  setRotation = (x2, y2, z) => {
    this.x = x2;
    this.y = y2;
    this.z = z;
  };
  setRotationX = (x2) => {
    this.x = x2;
  };
  setRotationY = (y2) => {
    this.y = y2;
  };
  setRotationZ = (z) => {
    this.z = z;
  };
  toDegree = () => {
    return [radToDeg(this.axis.x), radToDeg(this.axis.y), radToDeg(this.axis.z)];
  };
  toDegreeX = () => {
    return Math.cos(radToDeg(this.axis.x) / 2);
  };
  toDegreeY = () => {
    return Math.cos(radToDeg(this.axis.z) / 2);
  };
  toDegreeZ = () => {
    return Math.cos(radToDeg(this.axis.y) / 2);
  };
  getRotX = () => {
    if (this.rotationSpeed.x == 0) {
      if (this.netx != this.x && this.emitX) {
        app.net.send({
          remoteName: this.remoteName,
          sceneName: this.emitX,
          netRotX: this.x
        });
      }
      this.netx = this.x;
      return degToRad(this.x);
    } else {
      this.x = this.x + this.rotationSpeed.x * 1e-3;
      return degToRad(this.x);
    }
  };
  getRotY = () => {
    if (this.rotationSpeed.y == 0) {
      if (this.nety != this.y && this.emitY) {
        if (this.teams.length == 0) {
          app.net.send({
            toRemote: this.toRemote,
            remoteName: this.remoteName,
            sceneName: this.emitY,
            netRotY: this.y
          });
          this.nety = this.y;
        } else {
          if (this.teams[0].length > 0) app.net.send({
            toRemote: this.teams[0],
            sceneName: this.emitY,
            netRotY: this.y
          });
          if (this.teams[1].length > 0) app.net.send({
            toRemote: this.teams[1],
            remoteName: this.remoteName,
            sceneName: this.emitY,
            netRotY: this.y
          });
          this.nety = this.y;
        }
      }
      return degToRad(this.y);
    } else {
      this.y = this.y + this.rotationSpeed.y * 1e-3;
      return degToRad(this.y);
    }
  };
  getRotZ = () => {
    if (this.rotationSpeed.z == 0) {
      if (this.netz != this.z && this.emitZ) {
        app.net.send({
          remoteName: this.remoteName,
          sceneName: this.emitZ,
          netRotZ: this.z
        });
      }
      this.netz = this.z;
      return degToRad(this.z);
    } else {
      this.z = this.z + this.rotationSpeed.z * 1e-3;
      return degToRad(this.z);
    }
  };
};

// ../../../shaders/vertex.wgsl.js
var vertexWGSL = `const MAX_BONES = 100u;

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
    return SkinResult(skinnedPos, skinnedNorm);
}

// Add to your uniform structs at the top
struct VertexAnimParams {
  time: f32,
  flags: f32,
  globalIntensity: f32,
  _pad0: f32,
  
  // Wave [4-7]
  waveSpeed: f32,
  waveAmplitude: f32,
  waveFrequency: f32,
  _pad1: f32,
  
  // Wind [8-11]
  windSpeed: f32,
  windStrength: f32,
  windHeightInfluence: f32,
  windTurbulence: f32,
  
  // Pulse [12-15]
  pulseSpeed: f32,
  pulseAmount: f32,
  pulseCenterX: f32,
  pulseCenterY: f32,
  
  // Twist [16-19]
  twistSpeed: f32,
  twistAmount: f32,
  _pad2: f32,
  _pad3: f32,
  
  // Noise [20-23]
  noiseScale: f32,
  noiseStrength: f32,
  noiseSpeed: f32,
  _pad4: f32,
  
  // Ocean [24-27]
  oceanWaveScale: f32,
  oceanWaveHeight: f32,
  oceanWaveSpeed: f32,
  _pad5: f32,
  
  // Displacement [28-31]
  displacementStrength: f32,
  displacementSpeed: f32,
  _pad6: f32,
  _pad7: f32,
}

@group(1) @binding(2) var<uniform> vertexAnim : VertexAnimParams;

const ANIM_WAVE: u32 = 1u;
const ANIM_WIND: u32 = 2u;
const ANIM_PULSE: u32 = 4u;
const ANIM_TWIST: u32 = 8u;
const ANIM_NOISE: u32 = 16u;
const ANIM_OCEAN: u32 = 32u;

// Basic wave function - good starting point
fn applyWave(pos: vec3f) -> vec3f {
  let wave = sin(pos.x * vertexAnim.waveFrequency + vertexAnim.time * vertexAnim.waveSpeed) * 
             cos(pos.z * vertexAnim.waveFrequency + vertexAnim.time * vertexAnim.waveSpeed);
  return vec3f(pos.x, pos.y + wave * vertexAnim.waveAmplitude, pos.z);
}

fn applyWind(pos: vec3f, normal: vec3f) -> vec3f {
  let heightFactor = max(0.0, pos.y) * vertexAnim.windHeightInfluence;
  
  let windDir = vec2f(
    sin(vertexAnim.time * vertexAnim.windSpeed),
    cos(vertexAnim.time * vertexAnim.windSpeed * 0.7)
  ) * vertexAnim.windStrength;
  
  let turbulence = noise(vec2f(pos.x, pos.z) * 0.5 + vertexAnim.time * 0.3) 
                   * vertexAnim.windTurbulence;
  
  return vec3f(
    pos.x + windDir.x * heightFactor * (1.0 + turbulence),
    pos.y,
    pos.z + windDir.y * heightFactor * (1.0 + turbulence)
  );
}

fn applyPulse(pos: vec3f) -> vec3f {
  let pulse = sin(vertexAnim.time * vertexAnim.pulseSpeed) * vertexAnim.pulseAmount;
  let scale = 1.0 + pulse;
  
  let center = vec3f(vertexAnim.pulseCenterX, 0.0, vertexAnim.pulseCenterY);
  return center + (pos - center) * scale;
}

fn applyTwist(pos: vec3f) -> vec3f {
  let angle = pos.y * vertexAnim.twistAmount * sin(vertexAnim.time * vertexAnim.twistSpeed);
  
  let cosA = cos(angle);
  let sinA = sin(angle);
  
  return vec3f(
    pos.x * cosA - pos.z * sinA,
    pos.y,
    pos.x * sinA + pos.z * cosA
  );
}

// Simple noise function (you can replace with texture sampling later)
fn hash(p: vec2f) -> f32 {
  var p3 = fract(vec3f(p.x, p.y, p.x) * 0.13);
  p3 += dot(p3, vec3f(p3.y, p3.z, p3.x) + 3.333);
  return fract((p3.x + p3.y) * p3.z);
}

fn noise(p: vec2f) -> f32 {
  let i = floor(p);
  let f = fract(p);
  let u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i + vec2f(0.0, 0.0)), hash(i + vec2f(1.0, 0.0)), u.x),
    mix(hash(i + vec2f(0.0, 1.0)), hash(i + vec2f(1.0, 1.0)), u.x),
    u.y
  );
}

fn applyNoiseDisplacement(pos: vec3f) -> vec3f {
  let noiseVal = noise(vec2f(pos.x, pos.z) * vertexAnim.noiseScale 
                      + vertexAnim.time * vertexAnim.noiseSpeed);
  let displacement = (noiseVal - 0.5) * vertexAnim.noiseStrength;
  return vec3f(pos.x, pos.y + displacement, pos.z);
}

fn applyOcean(pos: vec3f) -> vec3f {
  let t = vertexAnim.time * vertexAnim.oceanWaveSpeed;
  let scale = vertexAnim.oceanWaveScale;
  
  let wave1 = sin(dot(pos.xz, vec2f(1.0, 0.0)) * scale + t) * vertexAnim.oceanWaveHeight;
  let wave2 = sin(dot(pos.xz, vec2f(0.7, 0.7)) * scale * 1.2 + t * 1.3) * vertexAnim.oceanWaveHeight * 0.7;
  let wave3 = sin(dot(pos.xz, vec2f(0.0, 1.0)) * scale * 0.8 + t * 0.9) * vertexAnim.oceanWaveHeight * 0.5;
  
  return vec3f(pos.x, pos.y + wave1 + wave2 + wave3, pos.z);
}

fn applyVertexAnimation(pos: vec3f, normal: vec3f) -> SkinResult {
  var animatedPos = pos;
  var animatedNorm = normal;
  let flags = u32(vertexAnim.flags);
  // Apply effects in order
  if ((flags & ANIM_WAVE) != 0u) {
    animatedPos = applyWave(animatedPos);
  }
  if ((flags & ANIM_WIND) != 0u) {
    animatedPos = applyWind(animatedPos, animatedNorm);
  }
  if ((flags & ANIM_NOISE) != 0u) {
    animatedPos = applyNoiseDisplacement(animatedPos);
  }
  if ((flags & ANIM_OCEAN) != 0u) {
    animatedPos = applyOcean(animatedPos);
  }
  if ((flags & ANIM_PULSE) != 0u) {
    animatedPos = applyPulse(animatedPos);
  }
  if ((flags & ANIM_TWIST) != 0u) {
    animatedPos = applyTwist(animatedPos);
  }
  // Apply global intensity (master volume control)
  animatedPos = mix(pos, animatedPos, vertexAnim.globalIntensity);
  // Recalculate normal
  if (flags != 0u) {
    let offset = 0.01;
    let posX = applyWave(applyNoiseDisplacement(pos + vec3f(offset, 0.0, 0.0)));
    let posZ = applyWave(applyNoiseDisplacement(pos + vec3f(0.0, 0.0, offset)));
    let tangentX = normalize(posX - animatedPos);
    let tangentZ = normalize(posZ - animatedPos);
    animatedNorm = normalize(cross(tangentZ, tangentX));
  }
  return SkinResult(vec4f(animatedPos, 1.0), animatedNorm);
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

  // 1. Skin first
  let skinned = skinVertex(vec4(position, 1.0), normal, joints, weights);

  // 2. Animate once, conditionally
  var finalPos  = skinned.position.xyz;
  var finalNorm = skinned.normal;

  if (u32(vertexAnim.flags) != 0u && vertexAnim.globalIntensity > 0.0) {
    let animated = applyVertexAnimation(finalPos, finalNorm);
    finalPos  = animated.position.xyz;
    finalNorm = animated.normal;
  }

  // 3. World-space transform
  let worldPos = model.modelMatrix * vec4f(finalPos, 1.0);
  let normalMatrix = mat3x3f(
    model.modelMatrix[0].xyz,
    model.modelMatrix[1].xyz,
    model.modelMatrix[2].xyz
  );

  output.Position  = scene.cameraViewProjMatrix * worldPos;
  output.fragPos   = worldPos.xyz;
  output.shadowPos = scene.lightViewProjMatrix * worldPos;
  output.fragNorm  = normalize(normalMatrix * finalNorm);
  output.uv        = uv;
  return output;
}`;

// ../../../shaders/fragment.wgsl.js
var fragmentWGSL = `
override shadowDepthTextureSize: f32 = 1024.0;
const PI: f32 = 3.141592653589793;

struct Scene {
    lightViewProjMatrix  : mat4x4f,
    cameraViewProjMatrix : mat4x4f,
    cameraPos            : vec3f,
    padding2             : f32,
    lightPos             : vec3f,
    padding              : f32,
    globalAmbient        : vec3f,
    padding3             : f32,
    time                 : f32,
    deltaTime            : f32,
    padding4             : vec2f,
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

struct MaterialPBR {
    baseColorFactor : vec4f,
    metallicFactor  : f32,
    roughnessFactor : f32,
    _pad1           : f32,
    _pad2           : f32,
};

struct PBRMaterialData {
    baseColor : vec3f,
    metallic  : f32,
    roughness : f32,
    alpha     : f32,
};

const MAX_SPOTLIGHTS = 20u;

@group(0) @binding(0) var<uniform> scene : Scene;
@group(0) @binding(1) var shadowMapArray: texture_depth_2d_array;
@group(0) @binding(2) var shadowSampler: sampler_comparison;
@group(0) @binding(3) var meshTexture: texture_2d<f32>;
@group(0) @binding(4) var meshSampler: sampler;
@group(0) @binding(5) var<uniform> spotlights: array<SpotLight, MAX_SPOTLIGHTS>;

// PBR textures
@group(0) @binding(6) var metallicRoughnessTex: texture_2d<f32>;
@group(0) @binding(7) var metallicRoughnessSampler: sampler;
@group(0) @binding(8) var<uniform> material: MaterialPBR;

// RPG or any other usage [selected obj effect]
@group(2) @binding(0) var<uniform> uSelected : f32;

struct FragmentInput {
    @location(0) shadowPos : vec4f,
    @location(1) fragPos   : vec3f,
    @location(2) fragNorm  : vec3f,
    @location(3) uv        : vec2f,
};

fn getPBRMaterial(uv: vec2f) -> PBRMaterialData {
    let texColor = textureSample(meshTexture, meshSampler, uv);
    let baseColor = texColor.rgb * material.baseColorFactor.rgb;
    let mrTex = textureSample(metallicRoughnessTex, metallicRoughnessSampler, uv);
    let metallic = mrTex.b * material.metallicFactor;
    let roughness = mrTex.g * material.roughnessFactor;
    
    // \u2705 Get alpha from texture and material factor
    // let alpha = texColor.a * material.baseColorFactor.a;
    let alpha = material.baseColorFactor.a;
    
    return PBRMaterialData(baseColor, metallic, roughness, alpha);
}

fn fresnelSchlick(cosTheta: f32, F0: vec3f) -> vec3f {
    return F0 + (1.0 - F0) * pow(1.0 - cosTheta, 5.0);
}

fn distributionGGX(N: vec3f, H: vec3f, roughness: f32) -> f32 {
    let a = roughness * roughness;
    let a2 = a * a;
    let NdotH = max(dot(N, H), 0.0);
    let NdotH2 = NdotH * NdotH;
    let denom = (NdotH2 * (a2 - 1.0) + 1.0);
    return a2 / (PI * denom * denom);
}

fn geometrySchlickGGX(NdotV: f32, roughness: f32) -> f32 {
    let r = (roughness + 1.0);
    let k = (r * r) / 8.0;
    return NdotV / (NdotV * (1.0 - k) + k);
}

fn geometrySmith(N: vec3f, V: vec3f, L: vec3f, roughness: f32) -> f32 {
    let NdotV = max(dot(N, V), 0.0);
    let NdotL = max(dot(N, L), 0.0);
    return geometrySchlickGGX(NdotV, roughness) * geometrySchlickGGX(NdotL, roughness);
}

fn calculateSpotlightFactor(light: SpotLight, fragPos: vec3f) -> f32 {
    let L = normalize(light.position - fragPos);
    let theta = dot(L, normalize(-light.direction));
    let epsilon = light.innerCutoff - light.outerCutoff;
    return clamp((theta - light.outerCutoff) / epsilon, 0.0, 1.0);
}

fn computeSpotLight2(light: SpotLight, N: vec3f, fragPos: vec3f, V: vec3f, material: PBRMaterialData) -> vec3f {
    let L = normalize(light.position - fragPos);
    let NdotL = max(dot(N, L), 0.0);
    if (NdotL <= 0.0) {
        return vec3f(0.0);
    }
    return material.baseColor * light.color * light.intensity * NdotL;
}

fn computeSpotLight(light: SpotLight, N: vec3f, fragPos: vec3f, V: vec3f, material: PBRMaterialData) -> vec3f {
    let L = normalize(light.position - fragPos);
    let NdotL = max(dot(N, L), 0.0);

    let theta = dot(L, normalize(-light.direction));
    let epsilon = light.innerCutoff - light.outerCutoff;
    var coneAtten = clamp((theta - light.outerCutoff) / epsilon, 0.0, 1.0);

    if (coneAtten <= 0.0 || NdotL <= 0.0) {
        return vec3f(0.0);
    }

    let F0 = mix(vec3f(0.04), material.baseColor.rgb, vec3f(material.metallic));
    let H = normalize(L + V);
    let F = F0 + (1.0 - F0) * pow(1.0 - max(dot(H, V), 0.0), 5.0);

    let alpha = material.roughness * material.roughness;
    let NdotH = max(dot(N, H), 0.0);
    let alpha2 = alpha * alpha;
    let denom = (NdotH * NdotH * (alpha2 - 1.0) + 1.0);
    let D = alpha2 / (PI * denom * denom + 1e-5);

    let k = (alpha + 1.0) * (alpha + 1.0) / 8.0;
    let NdotV = max(dot(N, V), 0.0);
    let Gv = NdotV / (NdotV * (1.0 - k) + k);
    let Gl = NdotL / (NdotL * (1.0 - k) + k);
    let G = Gv * Gl;

    let numerator = D * G * F;
    let denominator = 4.0 * NdotV * NdotL + 1e-5;
    let specular = numerator / denominator;

    let kS = F;
    let kD = (vec3f(1.0) - kS) * (1.0 - material.metallic);
    let diffuse = kD * material.baseColor.rgb / PI;

    let radiance = light.color * light.intensity;
    return material.baseColor * light.color * light.intensity * NdotL * coneAtten;
}

fn sampleShadow(shadowUV: vec2f, layer: i32, depthRef: f32, normal: vec3f, lightDir: vec3f) -> f32 {
    var visibility: f32 = 0.0;
    let biasConstant: f32 = 0.001;
    let slopeBias = max(0.002 * (1.0 - dot(normal, lightDir)), 0.0);
    let bias = biasConstant + slopeBias;
    let oneOverSize = 1.0 / (shadowDepthTextureSize * 0.5);
    let offsets: array<vec2f, 9> = array<vec2f, 9>(
        vec2(-1.0, -1.0), vec2(0.0, -1.0), vec2(1.0, -1.0),
        vec2(-1.0,  0.0), vec2(0.0,  0.0), vec2(1.0,  0.0),
        vec2(-1.0,  1.0), vec2(0.0,  1.0), vec2(1.0,  1.0)
    );
    for(var i: u32 = 0u; i < 9u; i = i + 1u) {
        visibility += textureSampleCompare(
            shadowMapArray, shadowSampler,
            shadowUV + offsets[i] * oneOverSize,
            layer, depthRef - bias
        );
    }
    return visibility / 9.0;
}

@fragment
fn main(input: FragmentInput) -> @location(0) vec4f {
    let norm = normalize(input.fragNorm);
    let viewDir = normalize(scene.cameraPos - input.fragPos);

    // \u2705 Get material with alpha
    let materialData = getPBRMaterial(input.uv);
    
    // \u2705 Early discard for fully transparent pixels (alpha cutoff)
    if (materialData.alpha < 0.01) {
        discard;
    }

    var lightContribution = vec3f(0.0);

    for (var i: u32 = 0u; i < MAX_SPOTLIGHTS; i = i + 1u) {
        let sc = spotlights[i].lightViewProj * vec4<f32>(input.fragPos, 1.0);
        let p  = sc.xyz / sc.w;
        let uv = clamp(p.xy * 0.5 + vec2<f32>(0.5), vec2<f32>(0.0), vec2<f32>(1.0));
        let depthRef = p.z * 0.5 + 0.5;

        let lightDir = normalize(spotlights[i].position - input.fragPos);
        let bias = spotlights[i].shadowBias;
        let visibility = sampleShadow(uv, i32(i), depthRef - bias, norm, lightDir);
        let contrib = computeSpotLight(spotlights[i], norm, input.fragPos, viewDir, materialData);
        lightContribution += contrib * visibility;
    }

    let texColor = textureSample(meshTexture, meshSampler, input.uv);
    var finalColor = texColor.rgb * (scene.globalAmbient + lightContribution);

    let N = normalize(input.fragNorm);
    let V = normalize(scene.cameraPos - input.fragPos);
    let fresnel = pow(1.0 - max(dot(N, V), 0.0), 3.0);

    if (uSelected > 0.5) {
        let glowColor = vec3f(0.2, 0.8, 1.0);
        finalColor += glowColor * fresnel * 0.1;
    }

    let alpha = mix(materialData.alpha, 1.0 , 0.5); 
    // \u2705 Return color with alpha from material
    return vec4f(finalColor, alpha);
}`;

// ../../../shaders/fragment.wgsl.metal.js
var fragmentWGSLMetal = `override shadowDepthTextureSize: f32 = 1024.0;
const PI: f32 = 3.141592653589793;

struct Scene {
    lightViewProjMatrix  : mat4x4f,
    cameraViewProjMatrix : mat4x4f,
    cameraPos            : vec3f,
    padding2             : f32,
    lightPos             : vec3f,
    padding              : f32,
    globalAmbient        : vec3f,
    padding3             : f32,
    time                 : f32,
    deltaTime            : f32,
    padding4             : vec2f,
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

struct MaterialPBR {
    baseColorFactor : vec4f,
    metallicFactor  : f32,
    roughnessFactor : f32,
    _pad1           : f32,
    _pad2           : f32,
};

struct PBRMaterialData {
    baseColor : vec3f,
    metallic  : f32,
    roughness : f32,
    alpha     : f32,  // \u2705 Added alpha
};

const MAX_SPOTLIGHTS = 20u;

@group(0) @binding(0) var<uniform> scene : Scene;
@group(0) @binding(1) var shadowMapArray: texture_depth_2d_array;
@group(0) @binding(2) var shadowSampler: sampler_comparison;
@group(0) @binding(3) var meshTexture: texture_2d<f32>;
@group(0) @binding(4) var meshSampler: sampler;
@group(0) @binding(5) var<uniform> spotlights: array<SpotLight, MAX_SPOTLIGHTS>;

// PBR textures
@group(0) @binding(6) var metallicRoughnessTex: texture_2d<f32>;
@group(0) @binding(7) var metallicRoughnessSampler: sampler;
@group(0) @binding(8) var<uniform> material: MaterialPBR;

struct FragmentInput {
    @location(0) shadowPos : vec4f,
    @location(1) fragPos   : vec3f,
    @location(2) fragNorm  : vec3f,
    @location(3) uv        : vec2f,
};

fn getPBRMaterial(uv: vec2f) -> PBRMaterialData {
    let texColor = textureSample(meshTexture, meshSampler, uv);
    let baseColor = texColor.rgb * material.baseColorFactor.rgb;
    let mrTex = textureSample(metallicRoughnessTex, metallicRoughnessSampler, uv);
    let metallic = material.metallicFactor;
    let roughness = material.roughnessFactor;
    // \u2705 Get alpha from texture and material factor
    let alpha = texColor.a * material.baseColorFactor.a;
    return PBRMaterialData(baseColor, metallic, roughness, alpha);
}

fn fresnelSchlick(cosTheta: f32, F0: vec3f) -> vec3f {
    return F0 + (1.0 - F0) * pow(1.0 - cosTheta, 5.0);
}

fn distributionGGX(N: vec3f, H: vec3f, roughness: f32) -> f32 {
    let a = roughness * roughness;
    let a2 = a * a;
    let NdotH = max(dot(N, H), 0.0);
    let NdotH2 = NdotH * NdotH;
    let denom = (NdotH2 * (a2 - 1.0) + 1.0);
    return a2 / (PI * denom * denom);
}

fn geometrySchlickGGX(NdotV: f32, roughness: f32) -> f32 {
    let r = (roughness + 1.0);
    let k = (r * r) / 8.0;
    return NdotV / (NdotV * (1.0 - k) + k);
}

fn geometrySmith(N: vec3f, V: vec3f, L: vec3f, roughness: f32) -> f32 {
    let NdotV = max(dot(N, V), 0.0);
    let NdotL = max(dot(N, L), 0.0);
    return geometrySchlickGGX(NdotV, roughness) * geometrySchlickGGX(NdotL, roughness);
}

fn calculateSpotlightFactor(light: SpotLight, fragPos: vec3f) -> f32 {
    let L = normalize(light.position - fragPos);
    let theta = dot(L, normalize(-light.direction));
    let epsilon = light.innerCutoff - light.outerCutoff;
    return clamp((theta - light.outerCutoff) / epsilon, 0.0, 1.0);
}

// PCF shadow sampling
fn sampleShadow(shadowUV: vec2f, layer: i32, depthRef: f32, normal: vec3f, lightDir: vec3f) -> f32 {
    var visibility: f32 = 0.0;
    let biasConstant: f32 = 0.001;
    let slopeBias = max(0.002 * (1.0 - dot(normal, lightDir)), 0.0);
    let bias = biasConstant + slopeBias;
    let oneOverSize = 1.0 / (shadowDepthTextureSize * 0.5);
    let offsets: array<vec2f, 9> = array<vec2f, 9>(
        vec2(-1.0, -1.0), vec2(0.0, -1.0), vec2(1.0, -1.0),
        vec2(-1.0,  0.0), vec2(0.0,  0.0), vec2(1.0,  0.0),
        vec2(-1.0,  1.0), vec2(0.0,  1.0), vec2(1.0,  1.0)
    );
    for(var i: u32 = 0u; i < 9u; i = i + 1u) {
        visibility += textureSampleCompare(shadowMapArray, shadowSampler, shadowUV + offsets[i] * oneOverSize, layer, depthRef - bias);
    }
    return visibility / 9.0;
}

@fragment
fn main(input: FragmentInput) -> @location(0) vec4f {
    let materialData = getPBRMaterial(input.uv);
    
    // \u2705 Early discard for fully transparent pixels
    if (materialData.alpha < 0.01) {
        discard;
    }
    
    let N = normalize(input.fragNorm);
    let V = normalize(scene.cameraPos - input.fragPos);
    var Lo = vec3f(0.0);
    
    for(var i: u32 = 0u; i < MAX_SPOTLIGHTS; i = i + 1u) {
        let L = normalize(spotlights[i].position - input.fragPos);
        let H = normalize(V + L);
        let distance = length(spotlights[i].position - input.fragPos);
        let attenuation = clamp(1.0 - (distance / spotlights[i].range), 0.0, 1.0);

        let NdotL = max(dot(N, L), 0.0);

        let radiance = spotlights[i].color * spotlights[i].intensity * attenuation;

        let NDF = distributionGGX(N, H, materialData.roughness);
        let G   = geometrySmith(N, V, L, materialData.roughness);
        let F0 = mix(vec3f(0.04), materialData.baseColor, materialData.metallic);
        let F  = fresnelSchlick(max(dot(H, V), 0.0), F0);

        let kS = F;
        let kD = (vec3f(1.0) - kS) * (1.0 - materialData.metallic);

        let diffuse  = kD * materialData.baseColor / PI;
        let specular = (NDF * G * F) / (4.0 * max(dot(N, V), 0.0) * NdotL + 0.001);

        // Combine diffuse + specular and multiply by NdotL and radiance
        Lo += (diffuse + specular) * radiance * NdotL;
    }

    let ambient = scene.globalAmbient * materialData.baseColor;
    var color = ambient + Lo;
    
    // \u2705 Return color with alpha from material
    return vec4f(color, materialData.alpha);
}
`;

// ../../../shaders/fragment.wgsl.normalmap.js
var fragmentWGSLNormalMap = `
override shadowDepthTextureSize: f32 = 1024.0;
const PI: f32 = 3.141592653589793;

struct Scene {
    lightViewProjMatrix  : mat4x4f,
    cameraViewProjMatrix : mat4x4f,
    cameraPos            : vec3f,
    padding2             : f32,
    lightPos             : vec3f,
    padding              : f32,
    globalAmbient        : vec3f,
    padding3             : f32,
    time                 : f32,
    deltaTime            : f32,
    padding4             : vec2f,
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

struct MaterialPBR {
    baseColorFactor : vec4f,
    metallicFactor  : f32,
    roughnessFactor : f32,
    _pad1           : f32,
    _pad2           : f32,
};

struct PBRMaterialData {
    baseColor : vec3f,
    metallic  : f32,
    roughness : f32,
};

const MAX_SPOTLIGHTS = 20u;

@group(0) @binding(0) var<uniform> scene : Scene;
@group(0) @binding(1) var shadowMapArray: texture_depth_2d_array;
@group(0) @binding(2) var shadowSampler: sampler_comparison;
@group(0) @binding(3) var meshTexture: texture_2d<f32>;
@group(0) @binding(4) var meshSampler: sampler;
@group(0) @binding(5) var<uniform> spotlights: array<SpotLight, MAX_SPOTLIGHTS>;

// PBR textures
@group(0) @binding(6) var metallicRoughnessTex: texture_2d<f32>;
@group(0) @binding(7) var metallicRoughnessSampler: sampler;
@group(0) @binding(8) var<uniform> material: MaterialPBR;
// PBR normalmap
@group(0) @binding(9) var normalTex: texture_2d<f32>;
@group(0) @binding(10) var normalSampler: sampler;

struct FragmentInput {
  @location(0) shadowPos : vec4f,
  @location(1) fragPos   : vec3f,
  @location(2) fragNorm  : vec3f,
  @location(3) uv        : vec2f,
  @location(4) tangent   : vec4f, // new
};

fn getNormalMap(uv: vec2f, N: vec3f) -> vec3f {
    // Sample normal map
    let nSample = textureSample(normalTex, normalSampler, uv).rgb;
    // Convert from [0,1] \u2192 [-1,1]
    let nTangent = nSample * 2.0 - vec3f(1.0);
    
    // TODO: if you have TBN matrix, convert tangent-space \u2192 world-space
    // For now, assume fragNorm is already aligned (simple approx)
    return normalize(nTangent);
}

fn getNormalMap2(uv: vec2f, N: vec3f, T: vec3f, B: vec3f) -> vec3f {
    let nSample = textureSample(normalTex, normalSampler, uv).rgb;
    let nTangent = nSample * 2.0 - vec3f(1.0);
    let worldNormal = normalize(T * nTangent.x + B * nTangent.y + N * nTangent.z);
    return worldNormal;
}
    
fn getPBRMaterial(uv: vec2f) -> PBRMaterialData {
    let texColor = textureSample(meshTexture, meshSampler, uv);
    let baseColor = texColor.rgb * material.baseColorFactor.rgb;
    let mrTex = textureSample(metallicRoughnessTex, metallicRoughnessSampler, uv);
    let metallic = mrTex.b * material.metallicFactor;
    let roughness = mrTex.g * material.roughnessFactor;
    return PBRMaterialData(baseColor, metallic, roughness);
}

fn fresnelSchlick(cosTheta: f32, F0: vec3f) -> vec3f {
    return F0 + (1.0 - F0) * pow(1.0 - cosTheta, 5.0);
}

fn distributionGGX(N: vec3f, H: vec3f, roughness: f32) -> f32 {
    let a = roughness * roughness;
    let a2 = a * a;
    let NdotH = max(dot(N, H), 0.0);
    let NdotH2 = NdotH * NdotH;
    let denom = (NdotH2 * (a2 - 1.0) + 1.0);
    return a2 / (PI * denom * denom);
}

fn geometrySchlickGGX(NdotV: f32, roughness: f32) -> f32 {
    let r = (roughness + 1.0);
    let k = (r * r) / 8.0;
    return NdotV / (NdotV * (1.0 - k) + k);
}

fn geometrySmith(N: vec3f, V: vec3f, L: vec3f, roughness: f32) -> f32 {
    let NdotV = max(dot(N, V), 0.0);
    let NdotL = max(dot(N, L), 0.0);
    return geometrySchlickGGX(NdotV, roughness) * geometrySchlickGGX(NdotL, roughness);
}

fn calculateSpotlightFactor(light: SpotLight, fragPos: vec3f) -> f32 {
    let L = normalize(light.position - fragPos);
    let theta = dot(L, normalize(-light.direction));
    let epsilon = light.innerCutoff - light.outerCutoff;
    return clamp((theta - light.outerCutoff) / epsilon, 0.0, 1.0);
}

fn computeSpotLight2(light: SpotLight, N: vec3f, fragPos: vec3f, V: vec3f, material: PBRMaterialData) -> vec3f {
    let L = normalize(light.position - fragPos);
    let NdotL = max(dot(N, L), 0.0);
    if (NdotL <= 0.0) {
        return vec3f(0.0);
    }
    return material.baseColor * light.color * light.intensity * NdotL;
    // return material.baseColor * light.color * light.intensity * NdotL;
}

fn computeSpotLight(light: SpotLight, N: vec3f, fragPos: vec3f, V: vec3f, material: PBRMaterialData) -> vec3f {
    let L = normalize(light.position - fragPos);
    let NdotL = max(dot(N, L), 0.0);

    let theta = dot(L, normalize(-light.direction));
    let epsilon = light.innerCutoff - light.outerCutoff;
    var coneAtten = clamp((theta - light.outerCutoff) / epsilon, 0.0, 1.0);

    // coneAtten = 1.0;
    if (coneAtten <= 0.0 || NdotL <= 0.0) {
        return vec3f(0.0);
    }

    let F0 = mix(vec3f(0.04), material.baseColor.rgb, vec3f(material.metallic));
    let H = normalize(L + V);
    let F = F0 + (1.0 - F0) * pow(1.0 - max(dot(H, V), 0.0), 5.0);

    let alpha = material.roughness * material.roughness;
    let NdotH = max(dot(N, H), 0.0);
    let alpha2 = alpha * alpha;
    let denom = (NdotH * NdotH * (alpha2 - 1.0) + 1.0);
    let D = alpha2 / (PI * denom * denom + 1e-5);

    let k = (alpha + 1.0) * (alpha + 1.0) / 8.0;
    let NdotV = max(dot(N, V), 0.0);
    let Gv = NdotV / (NdotV * (1.0 - k) + k);
    let Gl = NdotL / (NdotL * (1.0 - k) + k);
    let G = Gv * Gl;

    let numerator = D * G * F;
    let denominator = 4.0 * NdotV * NdotL + 1e-5;
    let specular = numerator / denominator;

    let kS = F;
    let kD = (vec3f(1.0) - kS) * (1.0 - material.metallic);
    let diffuse = kD * material.baseColor.rgb / PI;

    let radiance = light.color * light.intensity;
    // return (diffuse + specular) * radiance * NdotL * coneAtten;
    return material.baseColor * light.color * light.intensity * NdotL * coneAtten;
}

fn sampleShadow(shadowUV: vec2f, layer: i32, depthRef: f32, normal: vec3f, lightDir: vec3f) -> f32 {
    var visibility: f32 = 0.0;
    let biasConstant: f32 = 0.001;
    let slopeBias = max(0.002 * (1.0 - dot(normal, lightDir)), 0.0);
    let bias = biasConstant + slopeBias;
    let oneOverSize = 1.0 / (shadowDepthTextureSize * 0.5);
    let offsets: array<vec2f, 9> = array<vec2f, 9>(
        vec2(-1.0, -1.0), vec2(0.0, -1.0), vec2(1.0, -1.0),
        vec2(-1.0,  0.0), vec2(0.0,  0.0), vec2(1.0,  0.0),
        vec2(-1.0,  1.0), vec2(0.0,  1.0), vec2(1.0,  1.0)
    );
    for(var i: u32 = 0u; i < 9u; i = i + 1u) {
        visibility += textureSampleCompare(
            shadowMapArray, shadowSampler,
            shadowUV + offsets[i] * oneOverSize,
            layer, depthRef - bias
        );
    }
    return visibility / 9.0;
}

@fragment
fn main(input: FragmentInput) -> @location(0) vec4f {
    // let norm = normalize(input.fragNorm);
    let N = normalize(input.fragNorm);
    let T = normalize(input.tangent.xyz);
    let B = cross(N, T) * input.tangent.w; // handedness
    let norm = getNormalMap2(input.uv, N, T, B);

    let viewDir = normalize(scene.cameraPos - input.fragPos);

    // \u2705 now we declare materialData
    let materialData = getPBRMaterial(input.uv);

    var lightContribution = vec3f(0.0);

    for (var i: u32 = 0u; i < MAX_SPOTLIGHTS; i = i + 1u) {
        let sc = spotlights[i].lightViewProj * vec4<f32>(input.fragPos, 1.0);
        let p  = sc.xyz / sc.w;
        let uv = clamp(p.xy * 0.5 + vec2<f32>(0.5), vec2<f32>(0.0), vec2<f32>(1.0));
        let depthRef = p.z * 0.5 + 0.5;

        let lightDir = normalize(spotlights[i].position - input.fragPos);
        let bias = spotlights[i].shadowBias;
        let visibility = sampleShadow(uv, i32(i), depthRef - bias, norm, lightDir);
        // let visibility = 1.0;
        let contrib = computeSpotLight(spotlights[i], norm, input.fragPos, viewDir, materialData);
        lightContribution += contrib * visibility;
    }

    let texColor = textureSample(meshTexture, meshSampler, input.uv);
    let finalColor = texColor.rgb * (scene.globalAmbient + lightContribution);
    return vec4f(finalColor, 1.0);
}`;

// ../../../shaders/fragment.wgsl.pong.js
var fragmentWGSLPong = `
override shadowDepthTextureSize: f32 = 1024.0;
const PI: f32 = 3.141592653589793;

struct Scene {
    lightViewProjMatrix  : mat4x4f,
    cameraViewProjMatrix : mat4x4f,
    cameraPos            : vec3f,
    padding2             : f32,
    lightPos             : vec3f,
    padding              : f32,
    globalAmbient        : vec3f,
    padding3             : f32,
    time                 : f32,
    deltaTime            : f32,
    padding4             : vec2f,
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

struct MaterialPBR {
    baseColorFactor : vec4f,
    metallicFactor  : f32,
    roughnessFactor : f32,
    _pad1           : f32,
    _pad2           : f32,
};

struct PBRMaterialData {
    baseColor : vec3f,
    metallic  : f32,
    roughness : f32,
};

const MAX_SPOTLIGHTS = 20u;

@group(0) @binding(0) var<uniform> scene : Scene;
@group(0) @binding(1) var shadowMapArray: texture_depth_2d_array;
@group(0) @binding(2) var shadowSampler: sampler_comparison;
@group(0) @binding(3) var meshTexture: texture_2d<f32>;
@group(0) @binding(4) var meshSampler: sampler;
@group(0) @binding(5) var<uniform> spotlights: array<SpotLight, MAX_SPOTLIGHTS>;

// PBR textures
@group(0) @binding(6) var metallicRoughnessTex: texture_2d<f32>;
@group(0) @binding(7) var metallicRoughnessSampler: sampler;
@group(0) @binding(8) var<uniform> material: MaterialPBR;

struct FragmentInput {
    @location(0) shadowPos : vec4f,
    @location(1) fragPos   : vec3f,
    @location(2) fragNorm  : vec3f,
    @location(3) uv        : vec2f,
};

fn getPBRMaterial(uv: vec2f) -> PBRMaterialData {
    let texColor = textureSample(meshTexture, meshSampler, uv);
    let baseColor = texColor.rgb * material.baseColorFactor.rgb;
    let mrTex = textureSample(metallicRoughnessTex, metallicRoughnessSampler, uv);
    let metallic = mrTex.b * material.metallicFactor;
    let roughness = mrTex.g * material.roughnessFactor;
    return PBRMaterialData(baseColor, metallic, roughness);
}

fn fresnelSchlick(cosTheta: f32, F0: vec3f) -> vec3f {
    return F0 + (1.0 - F0) * pow(1.0 - cosTheta, 5.0);
}

fn distributionGGX(N: vec3f, H: vec3f, roughness: f32) -> f32 {
    let a = roughness * roughness;
    let a2 = a * a;
    let NdotH = max(dot(N, H), 0.0);
    let NdotH2 = NdotH * NdotH;
    let denom = (NdotH2 * (a2 - 1.0) + 1.0);
    return a2 / (PI * denom * denom);
}

fn geometrySchlickGGX(NdotV: f32, roughness: f32) -> f32 {
    let r = (roughness + 1.0);
    let k = (r * r) / 8.0;
    return NdotV / (NdotV * (1.0 - k) + k);
}

fn geometrySmith(N: vec3f, V: vec3f, L: vec3f, roughness: f32) -> f32 {
    let NdotV = max(dot(N, V), 0.0);
    let NdotL = max(dot(N, L), 0.0);
    return geometrySchlickGGX(NdotV, roughness) * geometrySchlickGGX(NdotL, roughness);
}

fn calculateSpotlightFactor(light: SpotLight, fragPos: vec3f) -> f32 {
    let L = normalize(light.position - fragPos);
    let theta = dot(L, normalize(-light.direction));
    let epsilon = light.innerCutoff - light.outerCutoff;
    return clamp((theta - light.outerCutoff) / epsilon, 0.0, 1.0);
}

fn computeSpotLight2(light: SpotLight, N: vec3f, fragPos: vec3f, V: vec3f, material: PBRMaterialData) -> vec3f {
    let L = normalize(light.position - fragPos);
    let NdotL = max(dot(N, L), 0.0);
    if (NdotL <= 0.0) {
        return vec3f(0.0);
    }

    let theta = dot(L, normalize(-light.direction));
    let epsilon = light.innerCutoff - light.outerCutoff;
    let coneAtten = clamp((theta - light.outerCutoff) / epsilon, 0.0, 1.0);
    if (coneAtten <= 0.0) {
        return vec3f(0.0);
    }

    // --- diffuse controlled by metallic ---
    let kD = 1.0 - material.metallic;  // 1.0 \u2192 full diffuse, 0.0 \u2192 fully metallic
    let lambert = kD * material.baseColor * light.color * light.intensity * NdotL;

    // --- simple specular controlled by roughness ---
    let H = normalize(L + V);
    let shininess = mix(2.0, 128.0, 1.0 - material.roughness); // map roughness \u2192 exponent
    let spec = pow(max(dot(N, H), 0.0), shininess);
    let specular = light.color * spec * material.metallic; // only strong if metallic > 0

    return (lambert + specular) * coneAtten;
}
// Debug hybrid spotlight
fn computeSpotLight3(light: SpotLight, N: vec3f, fragPos: vec3f, V: vec3f, material: PBRMaterialData) -> vec3f {
    let L = normalize(light.position - fragPos);
    let NdotL = max(dot(N, L), 0.0);
    if (NdotL <= 0.0) {
        return vec3f(0.0);
    }

    let theta = dot(L, normalize(-light.direction));
    let epsilon = light.innerCutoff - light.outerCutoff;
    let coneAtten = clamp((theta - light.outerCutoff) / epsilon, 0.0, 1.0);

    if (coneAtten <= 0.0) {
        return vec3f(0.0);
    }

    // ---- baseline lambert ----
    let lambert = material.baseColor * light.color * light.intensity * NdotL;

    // ---- add a bit of specular safely ----
    let H = normalize(L + V);
    let spec = pow(max(dot(N, H), 0.0), 32.0); // simple Blinn-Phong
    let specular = light.color * spec * 0.2;   // scaled so it doesn\u2019t kill diffuse

    // final mix
    return (lambert + specular) * coneAtten;
}

fn sampleShadow(shadowUV: vec2f, layer: i32, depthRef: f32, normal: vec3f, lightDir: vec3f) -> f32 {
    var visibility: f32 = 0.0;
    let biasConstant: f32 = 0.001;
    let slopeBias = max(0.002 * (1.0 - dot(normal, lightDir)), 0.0);
    let bias = biasConstant + slopeBias;
    let oneOverSize = 1.0 / (shadowDepthTextureSize * 0.5);
    let offsets: array<vec2f, 9> = array<vec2f, 9>(
        vec2(-1.0, -1.0), vec2(0.0, -1.0), vec2(1.0, -1.0),
        vec2(-1.0,  0.0), vec2(0.0,  0.0), vec2(1.0,  0.0),
        vec2(-1.0,  1.0), vec2(0.0,  1.0), vec2(1.0,  1.0)
    );
    for(var i: u32 = 0u; i < 9u; i = i + 1u) {
        visibility += textureSampleCompare(
            shadowMapArray, shadowSampler,
            shadowUV + offsets[i] * oneOverSize,
            layer, depthRef - bias
        );
    }
    return visibility / 9.0;
}

@fragment
fn main(input: FragmentInput) -> @location(0) vec4f {
    let norm = normalize(input.fragNorm);
    let viewDir = normalize(scene.cameraPos - input.fragPos);

    // \u2705 now we declare materialData
    let materialData = getPBRMaterial(input.uv);

    var lightContribution = vec3f(0.0);

    for (var i: u32 = 0u; i < MAX_SPOTLIGHTS; i = i + 1u) {
        let sc = spotlights[i].lightViewProj * vec4<f32>(input.fragPos, 1.0);
        let p  = sc.xyz / sc.w;
        let uv = clamp(p.xy * 0.5 + vec2<f32>(0.5), vec2<f32>(0.0), vec2<f32>(1.0));
        let depthRef = p.z * 0.5 + 0.5;

        let lightDir = normalize(spotlights[i].position - input.fragPos);
        let bias = spotlights[i].shadowBias;
        let visibility = sampleShadow(uv, i32(i), depthRef - bias, norm, lightDir);
        // let visibility = 1.0;
        let contrib = computeSpotLight2(spotlights[i], norm, input.fragPos, viewDir, materialData);
        lightContribution += contrib * visibility;
    }

    let texColor = textureSample(meshTexture, meshSampler, input.uv);
    let finalColor = texColor.rgb * (scene.globalAmbient + lightContribution);
    return vec4f(finalColor, 1.0);
}`;

// ../../../shaders/fragment.wgsl.power.js
var fragmentWGSLPower = `override shadowDepthTextureSize: f32 = 1024.0;
const PI: f32 = 3.141592653589793;

struct Scene {
    lightViewProjMatrix  : mat4x4f,
    cameraViewProjMatrix : mat4x4f,
    cameraPos            : vec3f,
    padding2             : f32,
    lightPos             : vec3f,
    padding              : f32,
    globalAmbient        : vec3f,
    padding3             : f32,
    time                 : f32,
    deltaTime            : f32,
    padding4             : vec2f,
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

struct MaterialPBR {
    baseColorFactor : vec4f,
    metallicFactor  : f32,
    roughnessFactor : f32,
    _pad1           : f32,
    _pad2           : f32,
};

struct PBRMaterialData {
    baseColor : vec3f,
    metallic  : f32,
    roughness : f32,
};

const MAX_SPOTLIGHTS = 20u;

@group(0) @binding(0) var<uniform> scene : Scene;
@group(0) @binding(1) var shadowMapArray: texture_depth_2d_array;
@group(0) @binding(2) var shadowSampler: sampler_comparison;
@group(0) @binding(3) var meshTexture: texture_2d<f32>;
@group(0) @binding(4) var meshSampler: sampler;
@group(0) @binding(5) var<uniform> spotlights: array<SpotLight, MAX_SPOTLIGHTS>;

// PBR textures
@group(0) @binding(6) var metallicRoughnessTex: texture_2d<f32>;
@group(0) @binding(7) var metallicRoughnessSampler: sampler;
@group(0) @binding(8) var<uniform> material: MaterialPBR;

struct FragmentInput {
    @location(0) shadowPos : vec4f,
    @location(1) fragPos   : vec3f,
    @location(2) fragNorm  : vec3f,
    @location(3) uv        : vec2f,
};

fn getPBRMaterial(uv: vec2f) -> PBRMaterialData {
    let texColor = textureSample(meshTexture, meshSampler, uv);
    let baseColor = texColor.rgb * material.baseColorFactor.rgb;
    let mrTex = textureSample(metallicRoughnessTex, metallicRoughnessSampler, uv);
    let metallic = mrTex.b * material.metallicFactor;
    let roughness = mrTex.g * material.roughnessFactor;
    return PBRMaterialData(baseColor, metallic, roughness);
}

fn fresnelSchlick(cosTheta: f32, F0: vec3f) -> vec3f {
    return F0 + (1.0 - F0) * pow(1.0 - cosTheta, 5.0);
}

fn distributionGGX(N: vec3f, H: vec3f, roughness: f32) -> f32 {
    let a = roughness * roughness;
    let a2 = a * a;
    let NdotH = max(dot(N, H), 0.0);
    let NdotH2 = NdotH * NdotH;
    let denom = (NdotH2 * (a2 - 1.0) + 1.0);
    return a2 / (PI * denom * denom);
}

fn geometrySchlickGGX(NdotV: f32, roughness: f32) -> f32 {
    let r = (roughness + 1.0);
    let k = (r * r) / 8.0;
    return NdotV / (NdotV * (1.0 - k) + k);
}

fn geometrySmith(N: vec3f, V: vec3f, L: vec3f, roughness: f32) -> f32 {
    let NdotV = max(dot(N, V), 0.0);
    let NdotL = max(dot(N, L), 0.0);
    return geometrySchlickGGX(NdotV, roughness) * geometrySchlickGGX(NdotL, roughness);
}

fn calculateSpotlightFactor(light: SpotLight, fragPos: vec3f) -> f32 {
    let L = normalize(light.position - fragPos);
    let theta = dot(L, normalize(-light.direction));
    let epsilon = light.innerCutoff - light.outerCutoff;
    return clamp((theta - light.outerCutoff) / epsilon, 0.0, 1.0);
}

// PCF shadow sampling
fn sampleShadow(shadowUV: vec2f, layer: i32, depthRef: f32, normal: vec3f, lightDir: vec3f) -> f32 {
    var visibility: f32 = 0.0;
    let biasConstant: f32 = 0.001;
    let slopeBias = max(0.002 * (1.0 - dot(normal, lightDir)), 0.0);
    let bias = biasConstant + slopeBias;
    let oneOverSize = 1.0 / (shadowDepthTextureSize * 0.5);
    let offsets: array<vec2f, 9> = array<vec2f, 9>(
        vec2(-1.0, -1.0), vec2(0.0, -1.0), vec2(1.0, -1.0),
        vec2(-1.0,  0.0), vec2(0.0,  0.0), vec2(1.0,  0.0),
        vec2(-1.0,  1.0), vec2(0.0,  1.0), vec2(1.0,  1.0)
    );
    for(var i: u32 = 0u; i < 9u; i = i + 1u) {
        visibility += textureSampleCompare(shadowMapArray, shadowSampler, shadowUV + offsets[i] * oneOverSize, layer, depthRef - bias);
    }
    return visibility / 9.0;
}

@fragment
fn main(input: FragmentInput) -> @location(0) vec4f {
    let materialData = getPBRMaterial(input.uv);
    let N = normalize(input.fragNorm);
    let V = normalize(scene.cameraPos - input.fragPos);
    var Lo = vec3f(0.0);
    for(var i: u32 = 0u; i < MAX_SPOTLIGHTS; i = i + 1u) {
        let L = normalize(spotlights[i].position - input.fragPos);
        let H = normalize(V + L);
        let distance = length(spotlights[i].position - input.fragPos);
        let attenuation = clamp(1.0 - (distance / spotlights[i].range), 0.0, 1.0);
        let radiance = spotlights[i].color * spotlights[i].intensity * attenuation;
        let NDF = distributionGGX(N, H, materialData.roughness);
        let G   = geometrySmith(N, V, L, materialData.roughness);
        let F0 = mix(vec3f(0.04), materialData.baseColor, materialData.metallic);
        let F  = fresnelSchlick(max(dot(H, V), 0.0), F0);
        let kS = F;
        let kD = (vec3f(1.0) - kS) * (1.0 - materialData.metallic);
        let diffuse  = kD * materialData.baseColor / PI; // Lambertian diffuse // ??
        let NdotL = max(dot(N, L), 0.0);
        let specular = (NDF * G * F) / (4.0 * max(dot(N, V), 0.0) * NdotL + 0.001);
        Lo += NdotL * spotlights[i].color * spotlights[i].intensity;
    }
    let ambient = scene.globalAmbient * materialData.baseColor;
    var color = ambient + Lo;
    return vec4f(color, 1.0);
}
`;

// ../../../shaders/mixed/fragmentMix1.wgsl.js
var fragmentWGSLMix1 = `override shadowDepthTextureSize: f32 = 1024.0;
const PI: f32 = 3.141592653589793;

struct Scene {
    lightViewProjMatrix  : mat4x4f,
    cameraViewProjMatrix : mat4x4f,
    cameraPos            : vec3f,
    padding2             : f32,
    lightPos             : vec3f,
    padding              : f32,
    globalAmbient        : vec3f,
    padding3             : f32,
    time                 : f32,
    deltaTime            : f32,
    padding4             : vec2f,
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

struct MaterialPBR {
    baseColorFactor : vec4f,
    metallicFactor  : f32,
    roughnessFactor : f32,
    effectMix       : f32,
    lightingEnabled : f32,
};

struct PBRMaterialData {
    baseColor : vec3f,
    metallic  : f32,
    roughness : f32,
};

const MAX_SPOTLIGHTS = 20u;

@group(0) @binding(0) var<uniform> scene : Scene;
@group(0) @binding(1) var shadowMapArray: texture_depth_2d_array;
@group(0) @binding(2) var shadowSampler: sampler_comparison;
@group(0) @binding(3) var meshTexture: texture_2d<f32>;
@group(0) @binding(4) var meshSampler: sampler;
@group(0) @binding(5) var<uniform> spotlights: array<SpotLight, MAX_SPOTLIGHTS>;
@group(0) @binding(6) var metallicRoughnessTex: texture_2d<f32>;
@group(0) @binding(7) var metallicRoughnessSampler: sampler;
@group(0) @binding(8) var<uniform> material: MaterialPBR;
@group(0) @binding(9) var normalTexture: texture_2d<f32>;
@group(0) @binding(10) var normalSampler: sampler;

struct FragmentInput {
    @location(0) shadowPos : vec4f,
    @location(1) fragPos   : vec3f,
    @location(2) fragNorm  : vec3f,
    @location(3) uv        : vec2f,
    @builtin(position) position : vec4f,
};

fn getPBRMaterial(uv: vec2f) -> PBRMaterialData {
    let texColor = textureSample(meshTexture, meshSampler, uv);
    let baseColor = texColor.rgb * material.baseColorFactor.rgb;
    let mrTex = textureSample(metallicRoughnessTex, metallicRoughnessSampler, uv);
    let metallic = mrTex.b * material.metallicFactor;
    let roughness = mrTex.g * material.roughnessFactor;
    return PBRMaterialData(baseColor, metallic, roughness);
}

fn fresnelSchlick(cosTheta: f32, F0: vec3f) -> vec3f {
    return F0 + (1.0 - F0) * pow(clamp(1.0 - cosTheta, 0.0, 1.0), 5.0);
}

fn distributionGGX(N: vec3f, H: vec3f, roughness: f32) -> f32 {
    let a = roughness * roughness;
    let a2 = a * a;
    let NdotH = max(dot(N, H), 0.0);
    let NdotH2 = NdotH * NdotH;
    let denom = (NdotH2 * (a2 - 1.0) + 1.0);
    return a2 / max(PI * denom * denom, 0.0001);
}

fn geometrySchlickGGX(NdotV: f32, roughness: f32) -> f32 {
    let r = (roughness + 1.0);
    let k = (r * r) / 8.0;
    return NdotV / max(NdotV * (1.0 - k) + k, 0.0001);
}

fn geometrySmith(N: vec3f, V: vec3f, L: vec3f, roughness: f32) -> f32 {
    let NdotV = max(dot(N, V), 0.0);
    let NdotL = max(dot(N, L), 0.0);
    return geometrySchlickGGX(NdotV, roughness) * geometrySchlickGGX(NdotL, roughness);
}

// ===== SIMPLIFIED WORKING EFFECT =====

fn calculateEffect(fragCoord: vec2f, resolution: vec2f, time: f32) -> vec3f {
    // Normalize coordinates
    let uv = fragCoord.xy / resolution;
    let aspect = resolution.x / resolution.y;
    let p = (uv * 2.0 - 1.0) * vec2f(aspect, 1.0);
    
    var color = vec3f(0.0);
    
    // Simplified version - 5 iterations instead of 9x7
    for(var i: f32 = 0.0; i < 5.0; i = i + 1.0) {
        // Rotating coordinates
        let angle = time * 0.1 + i * 0.5;
        let c = cos(angle);
        let s = sin(angle);
        var pos = vec2f(
            p.x * c - p.y * s,
            p.x * s + p.y * c
        );
        
        // Add some warping
        pos += sin(pos.yx * 3.0 + time * 0.5) * 0.1;
        
        // Distance field
        let dist = length(pos) - 0.5 - i * 0.15;
        let rings = sin(dist * 10.0 - time * 2.0) * 0.5 + 0.5;
        
        // Color based on iteration and distance
        let hue = i / 5.0 + time * 0.1;
        color += vec3f(
            0.5 + 0.5 * sin(hue * 6.28),
            0.5 + 0.5 * sin(hue * 6.28 + 2.09),
            0.5 + 0.5 * sin(hue * 6.28 + 4.18)
        ) * rings * 0.3;
    }
    
    // Add some glow
    let centerDist = length(p);
    color += vec3f(0.1) / (centerDist * centerDist + 0.1);
    
    return clamp(color, vec3f(0.0), vec3f(1.0));
}

// ===== STANDARD PBR LIGHTING =====

fn calculatePBRLighting(materialData: PBRMaterialData, N: vec3f, V: vec3f, fragPos: vec3f) -> vec3f {
    var Lo = vec3f(0.0);
    
    for(var i: u32 = 0u; i < MAX_SPOTLIGHTS; i = i + 1u) {
        let L = normalize(spotlights[i].position - fragPos);
        let H = normalize(V + L);
        let distance = length(spotlights[i].position - fragPos);
        let attenuation = clamp(1.0 - (distance / max(spotlights[i].range, 0.1)), 0.0, 1.0);
        let radiance = spotlights[i].color * spotlights[i].intensity * attenuation;
        
        let NDF = distributionGGX(N, H, materialData.roughness);
        let G   = geometrySmith(N, V, L, materialData.roughness);
        let F0 = mix(vec3f(0.04), materialData.baseColor, materialData.metallic);
        let F  = fresnelSchlick(max(dot(H, V), 0.0), F0);
        
        let kS = F;
        let kD = (vec3f(1.0) - kS) * (1.0 - materialData.metallic);
        let diffuse  = kD * materialData.baseColor / PI;
        let NdotL = max(dot(N, L), 0.0);
        let specular = (NDF * G * F) / max(4.0 * max(dot(N, V), 0.0) * NdotL + 0.001, 0.001);
        
        Lo += (diffuse + specular) * radiance * NdotL;
    }
    
    return Lo;
}

@fragment
fn main(input: FragmentInput) -> @location(0) vec4f {
    let materialData = getPBRMaterial(input.uv);
    let N = normalize(input.fragNorm);
    let V = normalize(scene.cameraPos - input.fragPos);
    
    let resolution = vec2f(1080.0, 687.0);
    
    var finalColor = vec3f(0.0);
    
    if (material.lightingEnabled > 0.5) {
        // Lighting enabled - calculate PBR
        let Lo = calculatePBRLighting(materialData, N, V, input.fragPos);
        let ambient = scene.globalAmbient * materialData.baseColor;
        let litColor = ambient + Lo;
        
        if (material.effectMix > 0.01) {
            // Blend with effect
            let effectColor = calculateEffect(input.position.xy, resolution, scene.time);
            finalColor = mix(litColor, effectColor, material.effectMix);
        } else {
            // Pure PBR
            finalColor = litColor;
        }
    } else {
        // Pure effect mode
        let effectColor = calculateEffect(input.position.xy, resolution, scene.time);
        // Modulate slightly by material color
        finalColor = effectColor * mix(vec3f(1.0), materialData.baseColor, 0.2);
    }
    
    return vec4f(finalColor, 1.0);
}
`;

// ../../../shaders/water/water-c.wgls.js
var fragmentWaterWGSL = `
/* === Engine uniforms === */

// DINAMIC GLOBALS
const PI: f32 = 3.141592653589793;
override shadowDepthTextureSize: f32 = 1024.0;

// DINAMIC STRUCTS


// PREDEFINED
struct Scene {
    lightViewProjMatrix  : mat4x4f,
    cameraViewProjMatrix : mat4x4f,
    cameraPos            : vec3f,
    padding2             : f32,
    lightPos             : vec3f,
    padding              : f32,
    globalAmbient        : vec3f,
    padding3             : f32,
    time                 : f32,
    deltaTime            : f32,
    padding4             : vec2f,
};

// PREDEFINED
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

// PREDEFINED
struct MaterialPBR {
    baseColorFactor : vec4f,
    metallicFactor  : f32,
    roughnessFactor : f32,
    _pad1           : f32,
    _pad2           : f32,
};

// PREDEFINED
struct PBRMaterialData {
    baseColor : vec3f,
    metallic  : f32,
    roughness : f32,
};

// PREDEFINED
const MAX_SPOTLIGHTS = 20u;

// PREDEFINED
@group(0) @binding(0) var<uniform> scene : Scene;
@group(0) @binding(1) var shadowMapArray: texture_depth_2d_array;
@group(0) @binding(2) var shadowSampler: sampler_comparison;
@group(0) @binding(3) var meshTexture: texture_2d<f32>;
@group(0) @binding(4) var meshSampler: sampler;
@group(0) @binding(5) var<uniform> spotlights: array<SpotLight, MAX_SPOTLIGHTS>;
@group(0) @binding(6) var metallicRoughnessTex: texture_2d<f32>;
@group(0) @binding(7) var metallicRoughnessSampler: sampler;
@group(0) @binding(8) var<uniform> material: MaterialPBR;

// \u2705 Graph custom uniforms
struct WaterParams {
    deepColor     : vec3f,
    waveSpeed     : f32,
    shallowColor  : vec3f,
    waveScale     : f32,
    waveHeight    : f32,
    fresnelPower  : f32,
    specularPower : f32,
    _pad1         : f32,
};

@group(3) @binding(0) var<uniform> waterParams: WaterParams;

// \u2705 Graph custom functions

// Gerstner wave function for realistic water waves
fn gerstnerWave(pos: vec2f, direction: vec2f, steepness: f32, wavelength: f32, time: f32) -> vec3f {
    let k = 2.0 * PI / wavelength;
    let c = sqrt(9.8 / k);
    let d = normalize(direction);
    let f = k * (dot(d, pos) - c * time);
    let a = steepness / k;
    
    return vec3f(
        d.x * a * cos(f),
        a * sin(f),
        d.y * a * cos(f)
    );
}

// Simpler sine wave for smoother animation
fn sineWave(pos: vec2f, direction: vec2f, amplitude: f32, frequency: f32, time: f32) -> vec3f {
    let d = normalize(direction);
    let phase = dot(d, pos) * frequency - time;
    
    return vec3f(
        d.x * amplitude * cos(phase),
        amplitude * sin(phase),
        d.y * amplitude * cos(phase)
    );
}

// Calculate water normal from multiple waves
fn calculateWaterNormal(worldPos: vec3f, time: f32) -> vec3f {
    let pos = worldPos.xz * waterParams.waveScale;
    let t = time * waterParams.waveSpeed;
    
    // Use smoother sine waves instead of Gerstner for better animation
    let wave1 = sineWave(pos, vec2f(1.0, 0.0), 0.3, 2.0, t);
    let wave2 = sineWave(pos, vec2f(0.0, 1.0), 0.25, 1.8, t * 1.13);
    let wave3 = sineWave(pos, vec2f(0.707, 0.707), 0.2, 1.5, t * 0.87);
    let wave4 = sineWave(pos, vec2f(-0.5, 0.866), 0.15, 1.2, t * 1.27);
    
    // Sum waves
    let offset = (wave1 + wave2 + wave3 + wave4) * waterParams.waveHeight;
    
    // Calculate tangent vectors using small step size
    let eps = 0.1;
    let posX = worldPos + vec3f(eps, 0.0, 0.0);
    let posZ = worldPos + vec3f(0.0, 0.0, eps);
    
    let offsetX = (
        sineWave(posX.xz * waterParams.waveScale, vec2f(1.0, 0.0), 0.3, 2.0, t) +
        sineWave(posX.xz * waterParams.waveScale, vec2f(0.0, 1.0), 0.25, 1.8, t * 1.13) +
        sineWave(posX.xz * waterParams.waveScale, vec2f(0.707, 0.707), 0.2, 1.5, t * 0.87) +
        sineWave(posX.xz * waterParams.waveScale, vec2f(-0.5, 0.866), 0.15, 1.2, t * 1.27)
    ) * waterParams.waveHeight;
    
    let offsetZ = (
        sineWave(posZ.xz * waterParams.waveScale, vec2f(1.0, 0.0), 0.3, 2.0, t) +
        sineWave(posZ.xz * waterParams.waveScale, vec2f(0.0, 1.0), 0.25, 1.8, t * 1.13) +
        sineWave(posZ.xz * waterParams.waveScale, vec2f(0.707, 0.707), 0.2, 1.5, t * 0.87) +
        sineWave(posZ.xz * waterParams.waveScale, vec2f(-0.5, 0.866), 0.15, 1.2, t * 1.27)
    ) * waterParams.waveHeight;
    
    let tangentX = normalize(vec3f(eps, offsetX.y - offset.y, 0.0));
    let tangentZ = normalize(vec3f(0.0, offsetZ.y - offset.y, eps));
    
    return normalize(cross(tangentZ, tangentX));
}

// Fresnel effect for water reflections
fn fresnelSchlick(cosTheta: f32, F0: f32) -> f32 {
    return F0 + (1.0 - F0) * pow(1.0 - cosTheta, waterParams.fresnelPower);
}

// PREDEFINED Fragment input
struct FragmentInput {
    @location(0) shadowPos : vec4f,
    @location(1) fragPos   : vec3f,
    @location(2) fragNorm  : vec3f,
    @location(3) uv        : vec2f,
};

// PREDEFINED PBR helpers
fn getPBRMaterial(uv: vec2f) -> PBRMaterialData {
    let texColor = textureSample(meshTexture, meshSampler, uv);
    let baseColor = texColor.rgb * material.baseColorFactor.rgb;
    let mrTex = textureSample(metallicRoughnessTex, metallicRoughnessSampler, uv);
    let metallic = mrTex.b * material.metallicFactor;
    let roughness = mrTex.g * material.roughnessFactor;
    return PBRMaterialData(baseColor, metallic, roughness);
}

@fragment
fn main(input: FragmentInput) -> @location(0) vec4f {
    // Calculate animated water normal
    let waterNormal = calculateWaterNormal(input.fragPos, scene.time);
    
    // View direction
    let viewDir = normalize(scene.cameraPos - input.fragPos);
    
    // Fresnel effect (0 = looking straight down, 1 = grazing angle)
    let fresnel = fresnelSchlick(max(dot(waterNormal, viewDir), 0.0), 0.02);
    
    // Light direction
    let lightDir = normalize(scene.lightPos - input.fragPos);
    
    // Diffuse lighting
    let diff = max(dot(waterNormal, lightDir), 0.0);
    
    // Specular (sun reflection on water)
    let halfDir = normalize(lightDir + viewDir);
    let spec = pow(max(dot(waterNormal, halfDir), 0.0), waterParams.specularPower);
    
    // Mix deep and shallow water colors based on fresnel
    let waterColor = mix(waterParams.deepColor, waterParams.shallowColor, fresnel * 0.5 + 0.5);
    
    // Enhanced lighting for more visible effect
    let ambient = scene.globalAmbient * waterColor * 0.3;
    let diffuse = diff * waterColor * 1.2;
    let specular = spec * vec3f(1.0, 1.0, 1.0) * fresnel * 2.0;
    
    // Enhanced foam on wave peaks
    // let foamAmount = pow(max(waterNormal.y - 0.6, 0.0), 2.0) * 0.8;
    // let foam = vec3f(1.0, 1.0, 1.0) * foamAmount;

    // WITH this \u2014 mode flag based on waveSpeed (fast = fire, slow = water):
    let isFireMode = f32(waterParams.waveSpeed > 1.5);

    // Water foam \u2014 white peaks
    let foamAmount = pow(max(waterNormal.y - 0.6, 0.0), 2.0) * 0.8 * (1.0 - isFireMode);
    let foam = vec3f(1.0, 1.0, 1.0) * foamAmount;

    // Fire embers \u2014 bright yellow-white tips
    let emberAmount = pow(max(waterNormal.y - 0.5, 0.0), 1.5) * 2.0 * isFireMode;
    let ember = vec3f(1.0, 0.95, 0.5) * emberAmount;

    
    // Add some caustics-like effect based on waves
    let caustics = sin(input.fragPos.x * 10.0 + scene.time * 2.0) * 
                   sin(input.fragPos.z * 10.0 + scene.time * 2.0) * 0.15 + 0.15;
    let causticsColor = waterColor * caustics;
    
    // Final color with enhanced effects
    let finalColor = ambient + diffuse + specular + foam +  ember +  causticsColor;
    
    // MUCH more transparent - alpha between 0.2 and 0.5
    let alpha = mix(0.2, 0.5, fresnel);
    
    // Make the color more vibrant so it's visible even when transparent
    let vibrantColor = finalColor * 1.5;
    
    return vec4f(vibrantColor, alpha);
}`;

// ../../../engine/materials.js
var Materials = class {
  constructor(device2, material, glb, textureCache) {
    this.device = device2;
    this.textureCache = textureCache;
    this.glb = glb;
    this.material = material;
    this.isVideo = false;
    this.videoIsReady = "NONE";
    this.compareSampler = this.device.createSampler({
      compare: "less-equal",
      // safer for shadow comparison
      addressModeU: "clamp-to-edge",
      // prevents UV leaking outside
      addressModeV: "clamp-to-edge",
      magFilter: "linear",
      // smooth PCF
      minFilter: "linear"
    });
    this.imageSampler = this.device.createSampler({
      magFilter: "linear",
      minFilter: "linear",
      addressModeU: "repeat",
      addressModeV: "repeat",
      addressModeW: "repeat"
    });
    this.videoSampler = this.device.createSampler({
      magFilter: "linear",
      minFilter: "linear"
    });
    this.postFXModeBuffer = this.device.createBuffer({
      size: 4,
      // u32 = 4 bytes
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });
    this.dummySpotlightUniformBuffer = this.device.createBuffer({
      size: 80,
      // Must match size in shader
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });
    this.device.queue.writeBuffer(this.dummySpotlightUniformBuffer, 0, new Float32Array(20));
    const mrDummyTex = this.device.createTexture({
      size: [1, 1, 1],
      format: this.getFormat(),
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST
    });
    const pixel = new Uint8Array([255, 255, 255, 255]);
    this.device.queue.writeTexture(
      { texture: mrDummyTex },
      pixel,
      { bytesPerRow: 4 },
      [1, 1, 1]
    );
    this.metallicRoughnessTextureView = mrDummyTex.createView();
    this.metallicRoughnessSampler = this.device.createSampler({
      magFilter: "linear",
      minFilter: "linear"
    });
    const materialPBRSize = 8 * 4;
    this.materialPBRBuffer = this.device.createBuffer({
      size: materialPBRSize,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });
    const baseColorFactor = [1, 1, 1, 1];
    const metallicFactor = 0.1;
    const roughnessFactor = 0.5;
    const effectMix = 0;
    const lightingEnabled = 1;
    const materialArray = new Float32Array([
      ...baseColorFactor,
      metallicFactor,
      roughnessFactor,
      effectMix,
      lightingEnabled
    ]);
    this.device.queue.writeBuffer(this.materialPBRBuffer, 0, materialArray.buffer);
    if (this.material.type == "normalmap") {
      const normalTexInfo = this.glb.glbJsonData.materials[0].normalTexture;
      if (normalTexInfo) {
        const tex = this.glb.glbJsonData.glbTextures[normalTexInfo.index];
        this.normalTextureView = tex.createView();
        this.normalSampler = this.device.createSampler({
          magFilter: "linear",
          minFilter: "linear"
        });
      }
    } else {
      this.normalDummyTex = device2.createTexture({
        size: [1, 1, 1],
        format: "rgba8unorm",
        usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST
      });
      const neutralNormal = new Uint8Array([128, 128, 255, 255]);
      this.device.queue.writeTexture(
        { texture: this.normalDummyTex },
        neutralNormal,
        { bytesPerRow: 4 },
        [1, 1, 1]
      );
      this.normalTextureView = this.normalDummyTex.createView();
      this.normalSampler = this.device.createSampler({
        magFilter: "linear",
        minFilter: "linear"
      });
    }
    this.createBufferForWater();
  }
  createBufferForWater = () => {
    this.waterBindGroupLayout = this.device.createBindGroupLayout({
      label: "[Water]BindGroupLayout",
      entries: [{
        binding: 0,
        visibility: GPUShaderStage.FRAGMENT,
        buffer: {
          type: "uniform"
        }
      }]
    });
    this.waterParamsBuffer = this.device.createBuffer({
      label: "[WaterParams]Buffer",
      size: 48,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });
    this.waterParamsData = new Float32Array([
      0,
      0.2,
      0.4,
      // deepColor (vec3f)
      0.5,
      // waveSpeed
      0,
      0.5,
      0.7,
      // shallowColor (vec3f)
      4,
      // waveScale
      0.15,
      // waveHeight
      3,
      // fresnelPower
      128,
      // specularPower
      0
      // padding
    ]);
    this.device.queue.writeBuffer(this.waterParamsBuffer, 0, this.waterParamsData);
    this.waterBindGroup = this.device.createBindGroup({
      layout: this.waterBindGroupLayout,
      entries: [{
        binding: 0,
        resource: { buffer: this.waterParamsBuffer }
      }]
    });
    this.updateWaterParams = (deepColor, shallowColor, waveSpeed, waveScale, waveHeight, fresnelPower, specularPower) => {
      const data = new Float32Array([
        deepColor[0],
        deepColor[1],
        deepColor[2],
        waveSpeed,
        shallowColor[0],
        shallowColor[1],
        shallowColor[2],
        waveScale,
        waveHeight,
        fresnelPower,
        specularPower,
        0
        // padding
      ]);
      this.device.queue.writeBuffer(this.waterParamsBuffer, 0, data);
    };
  };
  createDummyTexture(device2, size2 = 256) {
    const data = new Uint8Array(size2 * size2 * 4);
    for (let i = 0; i < data.length; i += 4) {
      data[i + 0] = 0;
      data[i + 1] = 255;
      data[i + 2] = 255;
      data[i + 3] = 255;
    }
    const texture = device2.createTexture({
      size: [size2, size2],
      format: "rgba8unorm",
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST
    });
    device2.queue.writeTexture(
      { texture },
      data,
      { bytesPerRow: size2 * 4 },
      { width: size2, height: size2 }
    );
    return texture;
  }
  /**
   * @description 
   * Change ONLY base color texture (binding = 3)
   * Does NOT rebuild pipeline or layout
   **/
  changeTexture(newTexture) {
    if (newTexture instanceof GPUTexture) {
      this.texture0 = newTexture;
    } else {
      this.texture0 = { createView: () => newTexture };
    }
    this.isVideo = false;
    this.createBindGroupForRender();
  }
  changeMaterial(newType = "graph", graphShader) {
    this.material.fromGraph = graphShader;
    this.material.type = newType;
    this.setupPipeline();
  }
  setBlend = (alpha) => {
    this.material.useBlend = true;
    this.setupMaterialPBR([1, 1, 1, alpha]);
  };
  getMaterial() {
    if (this.material.type == "standard") {
      return fragmentWGSL;
    } else if (this.material.type == "pong") {
      return fragmentWGSLPong;
    } else if (this.material.type == "power") {
      return fragmentWGSLPower;
    } else if (this.material.type == "metal") {
      return fragmentWGSLMetal;
    } else if (this.material.type == "normalmap") {
      return fragmentWGSLNormalMap;
    } else if (this.material.type == "water") {
      return fragmentWaterWGSL;
    } else if (this.material.type == "graph") {
      return this.material.fromGraph;
    } else if (this.material.type == "mix1") {
      return fragmentWGSLMix1;
    }
    console.warn("Unknown material type:", this.material?.type);
    return fragmentWGSL;
  }
  getFormat() {
    if (this.material?.format == "darker") {
      return "rgba8unorm-srgb";
    } else if (this.material?.format == "normal") {
      return "rgba8unorm";
    } else {
      return "rgba8unorm";
    }
  }
  setupMaterialPBR(baseColorFactor, metallicFactor, roughnessFactor, effectMix = 0, lightingEnabled = 1) {
    if (!metallicFactor) metallicFactor = 0.5;
    if (!baseColorFactor) baseColorFactor = [1, 1, 1, 0.5];
    if (!roughnessFactor) roughnessFactor = 0.5;
    const materialArray = new Float32Array([
      ...baseColorFactor,
      metallicFactor,
      roughnessFactor,
      effectMix,
      lightingEnabled
    ]);
    this.device.queue.writeBuffer(this.materialPBRBuffer, 0, materialArray.buffer);
  }
  setMixEffectMode(mode = "normal") {
    let effectMix = 0;
    let lightingEnabled = 1;
    switch (mode) {
      case "normal":
        effectMix = 0;
        lightingEnabled = 1;
        break;
      case "subtle":
        effectMix = 0.3;
        lightingEnabled = 1;
        break;
      case "blend":
        effectMix = 0.5;
        lightingEnabled = 1;
        break;
      case "full":
        effectMix = 1;
        lightingEnabled = 1;
        break;
      case "pure":
        effectMix = 1;
        lightingEnabled = 0;
        break;
    }
    const baseColorFactor = this.currentBaseColor || [1, 1, 1, 1];
    const metallicFactor = this.currentMetallic || 0.1;
    const roughnessFactor = this.currentRoughness || 0.5;
    this.setupMaterialPBR(baseColorFactor, metallicFactor, roughnessFactor, effectMix, lightingEnabled);
  }
  updatePostFXMode(mode) {
    const arrayBuffer = new Uint32Array([mode]);
    this.device.queue.writeBuffer(this.postFXModeBuffer, 0, arrayBuffer);
  }
  async loadTex0(texturesPaths2) {
    const path2 = texturesPaths2[0];
    const { texture, sampler } = await this.textureCache.get(path2, this.getFormat());
    this.texture0 = texture;
    this.sampler = sampler;
  }
  async loadVideoTexture(arg) {
    this.videoIsReady = "MAYBE";
    if (arg.type === "video") {
      this.video = document.createElement("video");
      this.video.src = arg.src || "res/videos/tunel.mp4";
      this.video.crossOrigin = "anonymous";
      this.video.autoplay = true;
      this.video.loop = true;
      document.body.append(this.video);
      this.video.style.display = "none";
      this.video.style.position = "absolute";
      this.video.style.top = "750px";
      this.video.style.left = "50px";
      await this.video.play();
      this.isVideo = true;
    } else if (arg.type === "videoElement") {
      this.video = arg.el;
      await this.video.play();
    } else if (arg.type === "camera") {
      if (!byId(`core-${this.name}`)) {
        this.video = document.createElement("video");
        this.video.id = `core-${this.name}`;
        this.video.autoplay = true;
        this.video.muted = true;
        this.video.playsInline = true;
        this.video.style.display = "none";
        document.body.append(this.video);
        try {
          const stream = await navigator.mediaDevices?.getUserMedia?.({
            video: {
              width: { ideal: 1280 },
              height: { ideal: 720 }
            },
            audio: false
          });
          this.video.srcObject = stream;
          await this.video.play();
          this.isVideo = true;
        } catch (err) {
          console.info("\u274C Failed to access camera:", err);
        }
      }
    } else if (arg.type === "canvas2d") {
      this.video = document.createElement("video");
      this.video.autoplay = true;
      this.video.muted = true;
      this.video.crossOrigin = "anonymous";
      this.video.style.display = "none";
      document.body.append(this.video);
      const stream = arg.el.captureStream?.() || arg.el.mozCaptureStream?.();
      if (!stream) {
        console.error("\u274C Cannot capture stream from canvas2d");
        return;
      }
      this.video.srcObject = stream;
      await this.video.play();
      this.isVideo = true;
    } else if (arg.type === "canvas2d-inline") {
      const canvas = document.createElement("canvas");
      canvas.width = arg.width || 256;
      canvas.height = arg.height || 256;
      canvas.style.position = "absolute";
      canvas.style.left = "-1000px";
      canvas.style.top = "0";
      document.body.appendChild(canvas);
      const ctx = canvas.getContext("2d");
      if (typeof arg.canvaInlineProgram === "function") {
        const drawLoop = () => {
          ctx.save();
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
          arg.canvaInlineProgram(ctx, canvas, arg.specialCanvas2dArg);
          ctx.restore();
          requestAnimationFrame(drawLoop);
        };
        drawLoop();
      } else {
        ctx.fillStyle = "#0ce325ff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      this.video = document.createElement("video");
      this.video.style.position = "absolute";
      this.video.style.left = "0px";
      this.video.style.top = "0";
      this.video.autoplay = true;
      this.video.muted = true;
      this.video.playsInline = true;
      this.video.srcObject = canvas.captureStream(60);
      document.body.append(this.video);
      await this.video.play();
      await new Promise((resolve) => {
        const check = () => {
          if (this.video.readyState >= 2) resolve();
          else requestAnimationFrame(check);
        };
        check();
      });
      this.isVideo = true;
    }
    this.sampler = this.device.createSampler({
      magFilter: "linear",
      minFilter: "linear"
    });
    this.createLayoutForRender();
    this.createBindGroupForRender();
  }
  updateVideoTexture() {
    if (!this.video || this.video.readyState < 2) {
      return;
    }
    if (!this.externalTexture) {
      this.externalTexture = this.device.importExternalTexture({ source: this.video });
      this.createBindGroupForRender();
      this.videoIsReady = "YES";
      console.log("%c\u2705video bind.", LOG_FUNNY_ARCADE2);
    } else {
      this.externalTexture = this.device.importExternalTexture({ source: this.video });
      this.createBindGroupForRender();
    }
  }
  getMaterialTexture(glb, materialIndex) {
    const matDef = glb.glbJsonData.materials[materialIndex];
    if (!matDef) {
      console.warn("[engine] no material in glb...");
      return null;
    }
    if (matDef.pbrMetallicRoughness?.baseColorTexture) {
      const texIndex = matDef.pbrMetallicRoughness.baseColorTexture.index;
      return glb.glbJsonData.glbTextures[texIndex].createView();
    }
    return null;
  }
  getMaterialTextureFromMaterial(material) {
    if (!material || !material.pbrMetallicRoughness) return this.fallbackTextureView;
    const texInfo = material.pbrMetallicRoughness.baseColorTexture;
    if (!texInfo) return this.fallbackTextureView;
    const texIndex = texInfo.index;
    return this.glb.glbTextures[texIndex].createView();
  }
  createBindGroupForRender() {
    let textureResource = this.isVideo ? this.externalTexture : this.texture0.createView();
    if (this.material.useTextureFromGlb === true) {
      const material = this.skinnedNode.mesh.primitives[0].material;
      const textureView = material.baseColorTexture.imageView;
      textureResource = textureView;
    }
    if (!textureResource || !this.sceneUniformBuffer || !this.shadowDepthTextureView) {
      if (!textureResource) console.log("%c\u2757Missing res texture ", LOG_FUNNY_ARCADE2);
      if (!this.sceneUniformBuffer) console.warn("\u2757Missing res: this.sceneUniformBuffer: ", this.sceneUniformBuffer);
      if (typeof textureResource === "undefined") {
        this.updateVideoTexture();
      }
      return;
    }
    if (this.isVideo == true) {
      this.sceneBindGroupForRender = this.device.createBindGroup({
        label: "sceneBindGroupForRender [video]",
        layout: this.bglForRender,
        entries: [
          { binding: 0, resource: { buffer: this.sceneUniformBuffer } },
          { binding: 1, resource: this.shadowDepthTextureView },
          { binding: 2, resource: this.compareSampler },
          { binding: 3, resource: textureResource },
          { binding: 4, resource: this.videoSampler },
          { binding: 5, resource: { buffer: this.postFXModeBuffer } }
        ]
      });
      if (this.video.paused == true) this.video.play();
    } else {
      this.sceneBindGroupForRender = this.device.createBindGroup({
        label: "sceneBindGroupForRender [mesh][materials]",
        layout: this.bglForRender,
        entries: [
          { binding: 0, resource: { buffer: this.sceneUniformBuffer } },
          { binding: 1, resource: this.shadowDepthTextureView },
          { binding: 2, resource: this.compareSampler },
          { binding: 3, resource: textureResource },
          { binding: 4, resource: this.imageSampler },
          { binding: 5, resource: { buffer: !this.spotlightUniformBuffer ? this.dummySpotlightUniformBuffer : this.spotlightUniformBuffer } },
          { binding: 6, resource: this.metallicRoughnessTextureView },
          { binding: 7, resource: this.metallicRoughnessSampler },
          { binding: 8, resource: { buffer: this.materialPBRBuffer } },
          // NEW: dummy normal map
          { binding: 9, resource: this.normalTextureView },
          { binding: 10, resource: this.normalSampler }
        ]
      });
    }
  }
  createLayoutForRender() {
    let e = [
      {
        binding: 0,
        visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
        buffer: { type: "uniform" }
      },
      ...this.isVideo == false ? [
        {
          binding: 1,
          visibility: GPUShaderStage.FRAGMENT,
          texture: {
            sampleType: "depth",
            viewDimension: "2d-array",
            // <- must match shadowMapArray
            multisampled: false
          }
        }
      ] : [{
        binding: 1,
        visibility: GPUShaderStage.FRAGMENT,
        texture: {
          sampleType: "depth",
          viewDimension: "2d"
        }
      }],
      {
        binding: 2,
        visibility: GPUShaderStage.FRAGMENT,
        sampler: { type: "comparison" }
      },
      ...this.isVideo ? [
        // VIDEO
        {
          binding: 3,
          visibility: GPUShaderStage.FRAGMENT,
          externalTexture: {}
        },
        {
          binding: 4,
          visibility: GPUShaderStage.FRAGMENT,
          sampler: { type: "filtering" }
          // for video sampling
        },
        {
          binding: 5,
          visibility: GPUShaderStage.FRAGMENT,
          buffer: { type: "uniform" }
        }
      ] : [
        // IMAGE
        {
          binding: 3,
          visibility: GPUShaderStage.FRAGMENT,
          texture: {
            sampleType: "float",
            viewDimension: "2d"
          }
        },
        {
          binding: 4,
          visibility: GPUShaderStage.FRAGMENT,
          sampler: { type: "filtering" }
        },
        {
          binding: 5,
          visibility: GPUShaderStage.FRAGMENT,
          buffer: { type: "uniform" }
        },
        {
          binding: 6,
          visibility: GPUShaderStage.FRAGMENT,
          texture: {
            sampleType: "float",
            viewDimension: "2d"
          }
        },
        {
          binding: 7,
          visibility: GPUShaderStage.FRAGMENT,
          sampler: { type: "filtering" }
        },
        {
          binding: 8,
          visibility: GPUShaderStage.FRAGMENT,
          buffer: { type: "uniform" }
        },
        {
          binding: 9,
          visibility: GPUShaderStage.FRAGMENT,
          texture: { sampleType: "float", viewDimension: "2d" }
        },
        {
          binding: 10,
          visibility: GPUShaderStage.FRAGMENT,
          sampler: { type: "filtering" }
        }
      ]
    ];
    this.bglForRender = this.device.createBindGroupLayout({ label: "bglForRender", entries: e });
  }
};

// ../../../shaders/fragment.video.wgsl.js
var fragmentVideoWGSL = `override shadowDepthTextureSize: f32 = 1024.0;

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

  // \u2705 Sample video texture
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

// ../../../shaders/vertex.wgsl.normalmap.js
var vertexWGSL_NM = `const MAX_BONES = 100u;

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
  @location(4) tangent: vec4f,      // NEW
  @builtin(position) Position: vec4f,
}

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
    return SkinResult(skinnedPos, skinnedNorm);
}

@vertex
fn main(
  @location(0) position: vec3f,
  @location(1) normal: vec3f,
  @location(2) uv: vec2f,
  @location(3) joints: vec4<u32>,
  @location(4) weights: vec4<f32>,
  @location(5) tangent: vec4f               // NEW
) -> VertexOutput {
  var output : VertexOutput;
  
  // Skin positions & normals
  var pos = vec4(position, 1.0);
  var nrm = normal;
  let skinned = skinVertex(pos, nrm, joints, weights);

  // Skin tangent
  var skinnedTangent = vec3f(tangent.xyz);
  for (var i: u32 = 0u; i < 4u; i = i + 1u) {
      let jointIndex = joints[i];
      let w = weights[i];
      if (w > 0.0) {
          let boneMat = bones.boneMatrices[jointIndex];
          let boneMat3 = mat3x3f(
              boneMat[0].xyz,
              boneMat[1].xyz,
              boneMat[2].xyz
          );
          skinnedTangent += (boneMat3 * tangent.xyz) * w;
      }
  }

  // Transform to world space
  let worldPos = model.modelMatrix * skinned.position;
  let normalMatrix = mat3x3f(
      model.modelMatrix[0].xyz,
      model.modelMatrix[1].xyz,
      model.modelMatrix[2].xyz
  );

  output.Position = scene.cameraViewProjMatrix * worldPos;
  output.fragPos = worldPos.xyz;
  output.shadowPos = scene.lightViewProjMatrix * worldPos;
  output.fragNorm = normalize(normalMatrix * skinned.normal);
  output.uv = uv;
  output.tangent = vec4(normalize(skinnedTangent), tangent.w);  // OUTPUT tangent

  return output;
}`;

// ../../../shaders/topology-point/pointEffect.js
var pointEffectShader = `struct Camera {
  viewProj : mat4x4<f32>
};
@group(0) @binding(0) var<uniform> camera : Camera;

struct ModelData {
  model : mat4x4<f32>,  // \u2705 ADD MODEL MATRIX
};
@group(0) @binding(1) var<uniform> modelData : ModelData;

struct PointSettings {
  pointSize : f32,
  _padding : vec3<f32>,
};
@group(0) @binding(2) var<uniform> pointSettings : PointSettings;  // \u2705 Move to binding 2

struct VSIn {
  @location(0) centerPos : vec3<f32>,
  @location(1) color : vec3<f32>,
  @builtin(vertex_index) vertexIdx : u32,
  @builtin(instance_index) instanceIdx : u32,
};

struct VSOut {
  @builtin(position) position : vec4<f32>,
  @location(0) color : vec3<f32>,
  @location(1) uv : vec2<f32>
};

@vertex
fn vsMain(input : VSIn) -> VSOut {
  var output : VSOut;
  
  let worldPos = modelData.model * vec4<f32>(input.centerPos, 1.0);
  let clipPos = camera.viewProj * worldPos;
  
  let corners = array<vec2<f32>, 4>(
    vec2(-1.0, -1.0),
    vec2( 1.0, -1.0),
    vec2(-1.0,  1.0),
    vec2( 1.0,  1.0)
  );
  
  // \u2705 Generate UV coordinates (0-1 range)
  let uvs = array<vec2<f32>, 4>(
    vec2(0.0, 0.0),
    vec2(1.0, 0.0),
    vec2(0.0, 1.0),
    vec2(1.0, 1.0)
  );
  
  let offset = corners[input.vertexIdx] * pointSettings.pointSize;
  
  let viewportSize = vec2<f32>(1920.0, 1080.0);
  let ndcOffset = offset / viewportSize * 2.0;
  
  output.position = vec4<f32>(
    clipPos.xy + ndcOffset * clipPos.w,
    clipPos.z,
    clipPos.w
  );
  
  output.color = input.color;
  output.uv = uvs[input.vertexIdx];  // \u2705 Pass UV
  return output;
}

@fragment
fn fsMain(input : VSOut) -> @location(0) vec4<f32> {
  let color = input.color * 0.5 + 0.5;
  
  // \u2705 Circular point using UV
  let center = vec2<f32>(0.5, 0.5);
  let dist = length(input.uv - center);
  let alpha = 1.0 - smoothstep(0.4, 0.5, dist);
  
  // Discard pixels outside circle
  if (alpha < 0.01) {
    discard;
  }
  
  return vec4<f32>(color * alpha, alpha);
}`;

// ../../../engine/effects/topology-point.js
var PointEffect2 = class {
  constructor(device2, format) {
    this.device = device2;
    this.format = format;
    this.pointSize = 8;
    this.enabled = true;
    this._initPipeline();
  }
  _initPipeline() {
    this.cameraBuffer = this.device.createBuffer({
      size: 64,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });
    this.modelBuffer = this.device.createBuffer({
      size: 64,
      // mat4x4
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });
    this.pointSettingsBuffer = this.device.createBuffer({
      size: 32,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });
    this.device.queue.writeBuffer(
      this.pointSettingsBuffer,
      0,
      new Float32Array([this.pointSize, 0, 0, 0])
    );
    const bindGroupLayout = this.device.createBindGroupLayout({
      entries: [
        { binding: 0, visibility: GPUShaderStage.VERTEX, buffer: {} },
        { binding: 1, visibility: GPUShaderStage.VERTEX, buffer: {} },
        { binding: 2, visibility: GPUShaderStage.VERTEX, buffer: {} }
      ]
    });
    this.bindGroup = this.device.createBindGroup({
      layout: bindGroupLayout,
      entries: [
        { binding: 0, resource: { buffer: this.cameraBuffer } },
        { binding: 1, resource: { buffer: this.modelBuffer } },
        { binding: 2, resource: { buffer: this.pointSettingsBuffer } }
      ]
    });
    const shaderModule = this.device.createShaderModule({ code: pointEffectShader });
    const pipelineLayout = this.device.createPipelineLayout({
      bindGroupLayouts: [bindGroupLayout]
    });
    this.pipeline = this.device.createRenderPipeline({
      layout: pipelineLayout,
      vertex: {
        module: shaderModule,
        entryPoint: "vsMain",
        buffers: [
          {
            arrayStride: 3 * 4,
            stepMode: "instance",
            attributes: [{ shaderLocation: 0, offset: 0, format: "float32x3" }]
          },
          {
            arrayStride: 3 * 4,
            stepMode: "instance",
            attributes: [{ shaderLocation: 1, offset: 0, format: "float32x3" }]
          }
        ]
      },
      fragment: {
        module: shaderModule,
        entryPoint: "fsMain",
        targets: [{
          format: this.format,
          blend: {
            color: { srcFactor: "src-alpha", dstFactor: "one-minus-src-alpha", operation: "add" },
            alpha: { srcFactor: "one", dstFactor: "one-minus-src-alpha", operation: "add" }
          }
        }]
      },
      primitive: { topology: "triangle-strip" },
      depthStencil: {
        depthWriteEnabled: false,
        depthCompare: "less-equal",
        format: "depth24plus"
      }
    });
  }
  // ✅ THIS MATCHES FlameEffect PATTERN
  updateInstanceData(baseModelMatrix) {
    this.device.queue.writeBuffer(this.modelBuffer, 0, baseModelMatrix);
  }
  draw(pass2, cameraMatrix, vertexBuffer, colorBuffer, vertexCount) {
    if (!this.enabled) return;
    if (!vertexCount || typeof vertexCount !== "number" || vertexCount <= 0) {
      console.warn("PointEffect: invalid vertexCount", vertexCount);
      return;
    }
    this.device.queue.writeBuffer(this.cameraBuffer, 0, cameraMatrix);
    pass2.setPipeline(this.pipeline);
    pass2.setBindGroup(0, this.bindGroup);
    pass2.setVertexBuffer(0, vertexBuffer);
    pass2.setVertexBuffer(1, colorBuffer);
    pass2.draw(4, vertexCount, 0, 0);
  }
  render(pass2, mesh, viewProjMatrix) {
    if (!mesh.vertexBuffer) {
      console.warn("PointEffect: mesh has no vertexBuffer");
      return;
    }
    let vertexCount = mesh.vertexCount;
    if (!vertexCount && mesh.vertexBuffer.size) {
      vertexCount = mesh.vertexBuffer.size / (3 * 4);
    }
    if (!vertexCount && mesh.geometry?.positions) {
      vertexCount = mesh.geometry.positions.length / 3;
    }
    if (!vertexCount || vertexCount <= 0) {
      console.warn("PointEffect: could not determine vertexCount", mesh);
      return;
    }
    const colorBuffer = mesh.vertexNormalsBuffer;
    if (!colorBuffer) {
      console.warn("PointEffect: mesh has no vertexNormalsBuffer");
      return;
    }
    this.draw(pass2, viewProjMatrix, mesh.vertexBuffer, colorBuffer, vertexCount);
  }
  setPointSize(size2) {
    this.pointSize = size2;
    this.device.queue.writeBuffer(
      this.pointSettingsBuffer,
      0,
      new Float32Array([this.pointSize, 0, 0, 0])
    );
  }
  setEnabled(enabled) {
    this.enabled = enabled;
  }
};

// ../../../shaders/gizmo/gimzoShader.js
var gizmoEffect = `
struct Camera {
  viewProj : mat4x4<f32>
};
@group(0) @binding(0) var<uniform> camera : Camera;

struct ModelData {
  model : mat4x4<f32>,
};
@group(0) @binding(1) var<uniform> modelData : ModelData;

struct GizmoSettings {
  mode : u32,
  size : f32,
  selectedAxis : u32,
  lineThickness : f32,
};
@group(0) @binding(2) var<uniform> gizmoSettings : GizmoSettings;

struct VSIn {
  @location(0) position : vec3<f32>,
  @location(1) color : vec3<f32>,
};

struct VSOut {
  @builtin(position) position : vec4<f32>,
  @location(0) color : vec3<f32>,
  @location(1) worldPos : vec3<f32>,
  @location(2) axisId : f32,
};

@vertex
fn vsMain(input : VSIn) -> VSOut {
  var output : VSOut;
  
  let worldPos = modelData.model * vec4<f32>(input.position * gizmoSettings.size, 1.0);
  output.position = camera.viewProj * worldPos;
  output.worldPos = worldPos.xyz;
  
  // Determine which axis based on color
  var axisId = 0.0;
  if (input.color.r > 0.9) { axisId = 1.0; } // X axis
  else if (input.color.g > 0.9) { axisId = 2.0; } // Y axis
  else if (input.color.b > 0.9) { axisId = 3.0; } // Z axis
  
  output.axisId = axisId;
  
  // Highlight selected axis
  var finalColor = input.color;
  if (gizmoSettings.selectedAxis > 0u && u32(axisId) == gizmoSettings.selectedAxis) {
    finalColor = vec3<f32>(1.0, 1.0, 0.0); // Yellow when selected
  }
  
  output.color = finalColor;
  return output;
}

@fragment
fn fsMain(input : VSOut) -> @location(0) vec4<f32> {
  return vec4<f32>(input.color, 1.0);
}`;

// ../../../engine/effects/gizmo.js
var GizmoEffect = class {
  constructor(device2, format) {
    this.device = device2;
    this.format = format;
    this.enabled = true;
    this.mode = 0;
    this.size = 3;
    this.selectedAxis = 0;
    this.movementScale = 0.01;
    this.isDragging = false;
    this.dragStartPoint = null;
    this.dragAxis = 0;
    this.parentMesh = null;
    this.initialPosition = null;
    this._initPipeline();
    this._setupEventListeners();
    addEventListener("editor-set-gizmo-mode", (e) => {
      console.log("MODE:", e.detail.mode);
      this.setMode(e.detail.mode);
    });
  }
  _initPipeline() {
    this._createTranslateGizmo();
    this.cameraBuffer = this.device.createBuffer({ size: 64, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });
    this.modelBuffer = this.device.createBuffer({ size: 64, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });
    this.gizmoSettingsBuffer = this.device.createBuffer({ size: 32, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });
    this._updateGizmoSettings();
    const bindGroupLayout = this.device.createBindGroupLayout({
      entries: [
        { binding: 0, visibility: GPUShaderStage.VERTEX, buffer: {} },
        { binding: 1, visibility: GPUShaderStage.VERTEX, buffer: {} },
        { binding: 2, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: {} }
      ]
    });
    this.bindGroup = this.device.createBindGroup({
      layout: bindGroupLayout,
      entries: [
        { binding: 0, resource: { buffer: this.cameraBuffer } },
        { binding: 1, resource: { buffer: this.modelBuffer } },
        { binding: 2, resource: { buffer: this.gizmoSettingsBuffer } }
      ]
    });
    const shaderModule = this.device.createShaderModule({ code: gizmoEffect });
    const pipelineLayout = this.device.createPipelineLayout({
      bindGroupLayouts: [bindGroupLayout]
    });
    this.pipeline = this.device.createRenderPipeline({
      layout: pipelineLayout,
      vertex: {
        module: shaderModule,
        entryPoint: "vsMain",
        buffers: [
          {
            arrayStride: 3 * 4,
            attributes: [{ shaderLocation: 0, offset: 0, format: "float32x3" }]
          },
          {
            arrayStride: 3 * 4,
            attributes: [{ shaderLocation: 1, offset: 0, format: "float32x3" }]
          }
        ]
      },
      fragment: {
        module: shaderModule,
        entryPoint: "fsMain",
        targets: [{
          format: this.format,
          blend: {
            color: { srcFactor: "src-alpha", dstFactor: "one-minus-src-alpha", operation: "add" },
            alpha: { srcFactor: "one", dstFactor: "one-minus-src-alpha", operation: "add" }
          }
        }]
      },
      primitive: { topology: "line-list" },
      depthStencil: {
        depthWriteEnabled: false,
        depthCompare: "always",
        format: "depth24plus"
      }
    });
  }
  _createTranslateGizmo() {
    const axisLength = 2;
    const arrowSize = 0.15;
    const positions = new Float32Array([
      0,
      0,
      0,
      axisLength,
      0,
      0,
      axisLength,
      0,
      0,
      axisLength - arrowSize,
      arrowSize,
      0,
      axisLength,
      0,
      0,
      axisLength - arrowSize,
      -arrowSize,
      0,
      axisLength,
      0,
      0,
      axisLength - arrowSize,
      0,
      arrowSize,
      axisLength,
      0,
      0,
      axisLength - arrowSize,
      0,
      -arrowSize,
      0,
      0,
      0,
      0,
      axisLength,
      0,
      0,
      axisLength,
      0,
      arrowSize,
      axisLength - arrowSize,
      0,
      0,
      axisLength,
      0,
      -arrowSize,
      axisLength - arrowSize,
      0,
      0,
      axisLength,
      0,
      0,
      axisLength - arrowSize,
      arrowSize,
      0,
      axisLength,
      0,
      0,
      axisLength - arrowSize,
      -arrowSize,
      0,
      0,
      0,
      0,
      0,
      axisLength,
      0,
      0,
      axisLength,
      arrowSize,
      0,
      axisLength - arrowSize,
      0,
      0,
      axisLength,
      -arrowSize,
      0,
      axisLength - arrowSize,
      0,
      0,
      axisLength,
      0,
      arrowSize,
      axisLength - arrowSize,
      0,
      0,
      axisLength,
      0,
      -arrowSize,
      axisLength - arrowSize
    ]);
    const colors = new Float32Array([
      1,
      0,
      0,
      1,
      0,
      0,
      1,
      0,
      0,
      1,
      0,
      0,
      1,
      0,
      0,
      1,
      0,
      0,
      1,
      0,
      0,
      1,
      0,
      0,
      1,
      0,
      0,
      1,
      0,
      0,
      // Y axis (green)
      0,
      1,
      0,
      0,
      1,
      0,
      0,
      1,
      0,
      0,
      1,
      0,
      0,
      1,
      0,
      0,
      1,
      0,
      0,
      1,
      0,
      0,
      1,
      0,
      0,
      1,
      0,
      0,
      1,
      0,
      // Z axis (blue)
      0,
      0,
      1,
      0,
      0,
      1,
      0,
      0,
      1,
      0,
      0,
      1,
      0,
      0,
      1,
      0,
      0,
      1,
      0,
      0,
      1,
      0,
      0,
      1,
      0,
      0,
      1,
      0,
      0,
      1
    ]);
    this.vertexBuffer = this.device.createBuffer({ size: positions.byteLength, usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST });
    this.device.queue.writeBuffer(this.vertexBuffer, 0, positions);
    this.colorBuffer = this.device.createBuffer({ size: colors.byteLength, usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST });
    this.device.queue.writeBuffer(this.colorBuffer, 0, colors);
    this.vertexCount = positions.length / 3;
  }
  _setupEventListeners() {
    app.canvas.addEventListener("ray.hit.mousedown", (e) => {
      const detail = e.detail;
      if (detail.hitObject === this.parentMesh && detail.hitObject.name === this.parentMesh.name) {
        this._handleRayHit(detail);
      } else {
        e.detail.hitObject.effects.gizmoEffect = this;
        this.parentMesh.effects.gizmoEffect = null;
        this.parentMesh = e.detail.hitObject;
        app.editor.editorHud.updateSceneObjPropertiesFromGizmo(this.parentMesh.name);
      }
    });
    app.canvas.addEventListener("mousemove", (e) => {
      if (this.isDragging && e.buttons === 1) {
        this._handleDrag(e);
        if (app.cameras.WASD) app.cameras.WASD.suspendDrag = true;
      } else if (this.isDragging && e.buttons === 0) {
        this.isDragging = false;
        this.selectedAxis = 0;
        this._updateGizmoSettings();
      } else {
        if (app.cameras.WASD) app.cameras.WASD.suspendDrag = false;
      }
    });
    app.canvas.addEventListener("mouseup", () => {
      if (this.isDragging) {
        if (this.parentMesh._GRAPH_CACHE) return;
        if (this.mode == 0) {
          document.dispatchEvent(new CustomEvent("web.editor.update.pos", {
            detail: {
              inputFor: this.parentMesh.name,
              propertyId: "position",
              property: this.selectedAxis == 1 ? "x" : this.selectedAxis == 2 ? "y" : "z",
              value: this.selectedAxis == 1 ? this.parentMesh.position.x : this.selectedAxis == 2 ? this.parentMesh.position.y : this.parentMesh.position.z
            }
          }));
        } else if (this.mode == 1) {
          document.dispatchEvent(new CustomEvent("web.editor.update.rot", {
            detail: {
              inputFor: this.parentMesh.name,
              propertyId: "rotation",
              property: this.selectedAxis == 1 ? "x" : this.selectedAxis == 2 ? "y" : "z",
              value: this.selectedAxis == 1 ? this.parentMesh.rotation.x : this.selectedAxis == 2 ? this.parentMesh.rotation.y : this.parentMesh.rotation.z
            }
          }));
        } else if (this.mode == 2) {
          document.dispatchEvent(new CustomEvent("web.editor.update.scale", {
            detail: {
              inputFor: this.parentMesh.name,
              propertyId: "scale",
              property: this.selectedAxis == 1 ? "0" : this.selectedAxis == 2 ? "1" : "2",
              value: this.selectedAxis == 1 ? this.parentMesh.rotation.x : this.selectedAxis == 2 ? this.parentMesh.rotation.y : this.parentMesh.rotation.z
            }
          }));
        }
        this.isDragging = false;
        this.selectedAxis = 0;
        this._updateGizmoSettings();
      }
    });
  }
  _handleRayHit(detail) {
    const { rayOrigin, rayDirection, hitPoint } = detail;
    const axis = this._raycastAxis(rayOrigin, rayDirection, detail.hitObject);
    if (axis > 0) {
      this.selectedAxis = axis;
      this.dragStartPoint = [...hitPoint];
      this.initialPosition = {
        x: this.parentMesh.position.x,
        y: this.parentMesh.position.y,
        z: this.parentMesh.position.z
      };
      this.dragAxis = axis;
      this._updateGizmoSettings();
      this.isDragging = true;
    }
  }
  /**
  * Get the screen-space direction of a world axis
  * @param {number} axisIndex - 0=X, 1=Y, 2=Z
  * @returns {{x: number, y: number}} - Normalized 2D screen direction
  */
  _getAxisScreenDirection(axisIndex) {
    const worldAxis = [
      [1, 0, 0],
      // X
      [0, 1, 0],
      // Y
      [0, 0, 1]
      // Z
    ][axisIndex];
    const viewMatrix = app.cameras.WASD.matrix_;
    const projMatrix = app.cameras.WASD.projectionMatrix;
    const p1 = this.parentMesh.position;
    const p2 = {
      x: p1.x + worldAxis[0],
      y: p1.y + worldAxis[1],
      z: p1.z + worldAxis[2]
    };
    const screen1 = this._worldToScreen(p1, viewMatrix, projMatrix);
    const screen2 = this._worldToScreen(p2, viewMatrix, projMatrix);
    const dx = screen2.x - screen1.x;
    const dy = screen2.y - screen1.y;
    const length2 = Math.sqrt(dx * dx + dy * dy);
    return {
      x: length2 > 1e-3 ? dx / length2 : 0,
      y: length2 > 1e-3 ? dy / length2 : 0
    };
  }
  _worldToScreen(worldPos, viewMatrix, projMatrix) {
    const clipPos = this._transformPoint(worldPos, viewMatrix, projMatrix);
    const ndcX = clipPos.x / clipPos.w;
    const ndcY = clipPos.y / clipPos.w;
    const screenX = (ndcX + 1) * 0.5 * app.canvas.width;
    const screenY = (1 - ndcY) * 0.5 * app.canvas.height;
    return { x: screenX, y: screenY };
  }
  _transformPoint(point, viewMatrix, projMatrix) {
    const vp = this._multiplyMatrices(projMatrix, viewMatrix);
    const x2 = vp[0] * point.x + vp[4] * point.y + vp[8] * point.z + vp[12];
    const y2 = vp[1] * point.x + vp[5] * point.y + vp[9] * point.z + vp[13];
    const z = vp[2] * point.x + vp[6] * point.y + vp[10] * point.z + vp[14];
    const w = vp[3] * point.x + vp[7] * point.y + vp[11] * point.z + vp[15];
    return { x: x2, y: y2, z, w };
  }
  _multiplyMatrices(a, b) {
    const result2 = new Array(16);
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        result2[i * 4 + j] = a[i * 4 + 0] * b[0 * 4 + j] + a[i * 4 + 1] * b[1 * 4 + j] + a[i * 4 + 2] * b[2 * 4 + j] + a[i * 4 + 3] * b[3 * 4 + j];
      }
    }
    return result2;
  }
  _handleDrag(mouseEvent) {
    if (!this.parentMesh || !this.dragStartPoint || !this.isDragging) return;
    const deltaX = mouseEvent.movementX;
    const deltaY = mouseEvent.movementY;
    const direction = deltaX > Math.abs(deltaY) ? deltaX : -deltaY;
    switch (this.mode) {
      case 0:
        switch (this.dragAxis) {
          case 1:
            this.parentMesh.position.x += deltaX * this.movementScale;
            break;
          case 2:
            this.parentMesh.position.y -= deltaY * this.movementScale;
            break;
          // case 3: this.parentMesh.position.z -= direction * this.movementScale; break;
          case 3:
            const zAxisScreenDir = this._getAxisScreenDirection(2);
            const mouseDelta = { x: deltaX, y: -deltaY };
            const movement = mouseDelta.x * zAxisScreenDir.x + mouseDelta.y * zAxisScreenDir.y;
            this.parentMesh.position.z += movement * this.movementScale;
        }
        break;
      case 1:
        const rotSpeed = 0.1;
        switch (this.dragAxis) {
          case 1:
            this.parentMesh.rotation.x += deltaY * rotSpeed;
            break;
          case 2:
            this.parentMesh.rotation.y += deltaX * rotSpeed;
            break;
          case 3:
            this.parentMesh.rotation.z += direction * rotSpeed;
            break;
        }
        break;
      case 2:
        const scaleSpeed = 0.01;
        switch (this.dragAxis) {
          case 1:
            this.parentMesh.scale[0] += deltaX * scaleSpeed;
            break;
          case 2:
            this.parentMesh.scale[1] += -deltaY * scaleSpeed;
            break;
          case 3:
            this.parentMesh.scale[2] += -direction * scaleSpeed;
            break;
        }
        break;
    }
  }
  _raycastAxis(rayOrigin, rayDirection, mesh) {
    const gizmoPos = [
      mesh.position.x,
      mesh.position.y,
      mesh.position.z
    ];
    const threshold = 0.1 * this.size;
    const xEnd = [gizmoPos[0] + 2 * this.size, gizmoPos[1], gizmoPos[2]];
    const xHit = this._rayIntersectsLine(rayOrigin, rayDirection, gizmoPos, xEnd, threshold);
    if (xHit) return 1;
    const yEnd = [gizmoPos[0], gizmoPos[1] + 2 * this.size, gizmoPos[2]];
    const yHit = this._rayIntersectsLine(rayOrigin, rayDirection, gizmoPos, yEnd, threshold);
    if (yHit) return 2;
    const zEnd = [gizmoPos[0], gizmoPos[1], gizmoPos[2] + 2 * this.size];
    const zHit = this._rayIntersectsLine(rayOrigin, rayDirection, gizmoPos, zEnd, threshold);
    if (zHit) return 3;
    return 0;
  }
  _rayIntersectsLine(rayOrigin, rayDir, lineStart, lineEnd, threshold) {
    const ro = Array.isArray(rayOrigin) ? rayOrigin : [rayOrigin[0], rayOrigin[1], rayOrigin[2]];
    const rd = [rayDir[0], rayDir[1], rayDir[2]];
    const rdLen = Math.sqrt(rd[0] ** 2 + rd[1] ** 2 + rd[2] ** 2);
    const ray = [rd[0] / rdLen, rd[1] / rdLen, rd[2] / rdLen];
    const line = [
      lineEnd[0] - lineStart[0],
      lineEnd[1] - lineStart[1],
      lineEnd[2] - lineStart[2]
    ];
    const w = [
      ro[0] - lineStart[0],
      ro[1] - lineStart[1],
      ro[2] - lineStart[2]
    ];
    const a = ray[0] ** 2 + ray[1] ** 2 + ray[2] ** 2;
    const b = ray[0] * line[0] + ray[1] * line[1] + ray[2] * line[2];
    const c = line[0] ** 2 + line[1] ** 2 + line[2] ** 2;
    const d = ray[0] * w[0] + ray[1] * w[1] + ray[2] * w[2];
    const e = line[0] * w[0] + line[1] * w[1] + line[2] * w[2];
    const denom = a * c - b * b;
    if (Math.abs(denom) < 1e-4) return false;
    const sc = (b * e - c * d) / denom;
    const tc = (a * e - b * d) / denom;
    if (tc < 0 || tc > 1) return false;
    const closestOnRay = [
      ro[0] + sc * ray[0],
      ro[1] + sc * ray[1],
      ro[2] + sc * ray[2]
    ];
    const closestOnLine = [
      lineStart[0] + tc * line[0],
      lineStart[1] + tc * line[1],
      lineStart[2] + tc * line[2]
    ];
    const dist2 = Math.sqrt((closestOnRay[0] - closestOnLine[0]) ** 2 + (closestOnRay[1] - closestOnLine[1]) ** 2 + (closestOnRay[2] - closestOnLine[2]) ** 2);
    return dist2 < threshold;
  }
  _updateGizmoSettings() {
    const data = new Float32Array([this.mode, this.size, this.selectedAxis, 1]);
    this.device.queue.writeBuffer(this.gizmoSettingsBuffer, 0, data);
  }
  updateInstanceData(baseModelMatrix) {
    this.device.queue.writeBuffer(this.modelBuffer, 0, baseModelMatrix);
  }
  draw(pass2, cameraMatrix) {
    if (!this.enabled) return;
    this.device.queue.writeBuffer(this.cameraBuffer, 0, cameraMatrix);
    pass2.setPipeline(this.pipeline);
    pass2.setBindGroup(0, this.bindGroup);
    pass2.setVertexBuffer(0, this.vertexBuffer);
    pass2.setVertexBuffer(1, this.colorBuffer);
    pass2.draw(this.vertexCount);
  }
  render(pass2, mesh, viewProjMatrix) {
    this.parentMesh = mesh;
    this.draw(pass2, viewProjMatrix);
  }
  setMode(mode) {
    this.mode = mode;
    this._updateGizmoSettings();
  }
  setSize(size2) {
    this.size = size2;
    this._updateGizmoSettings();
  }
  setSelectedAxis(axis) {
    this.selectedAxis = axis;
    this._updateGizmoSettings();
  }
  setEnabled(enabled) {
    this.enabled = enabled;
  }
};

// ../../../shaders/desctruction/dust-shader.wgsl.js
var dustShader = `

// Uniforms
struct Camera {
  viewProj: mat4x4<f32>,
};

struct Model {
  world: mat4x4<f32>,
  time: f32,
  intensity: f32,
  _padding1: f32,
  _padding2: f32,
};

@group(0) @binding(0) var<uniform> camera: Camera;
@group(0) @binding(1) var<uniform> model: Model;

// Vertex input (shared quad)
struct VertexInput {
  @location(0) position: vec3<f32>,      // Quad corner position
  @location(1) uv: vec2<f32>,            // UV coordinates
};

// Instance input (per-particle data)
struct InstanceInput {
  @location(2) posSize: vec4<f32>,       // xyz = position, w = size
  @location(3) velLife: vec4<f32>,       // xyz = velocity, w = life
  @location(4) color: vec4<f32>,         // rgba = color
};

// Vertex output
struct VertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) uv: vec2<f32>,
  @location(1) color: vec4<f32>,
  @location(2) life: f32,
  @location(3) worldPos: vec3<f32>,
};

// Vertex shader - Billboard particles to face camera
@vertex
fn vsMain(
  input: VertexInput,
  instance: InstanceInput,
  @builtin(instance_index) instanceIdx: u32
) -> VertexOutput {
  var output: VertexOutput;
  
  // Get particle world position
  let particleWorldPos = (model.world * vec4<f32>(instance.posSize.xyz, 1.0)).xyz;
  
  // Extract camera right and up vectors from view matrix
  // Since viewProj = projection * view, we need to extract view
  // For billboarding, we'll use a simplified approach:
  // Right = (1, 0, 0) in view space
  // Up = (0, 1, 0) in view space
  
  // Simple billboarding: offset quad corners in screen space
  let size = instance.posSize.w;
  let quadOffset = input.position.xy * size;
  
  // Billboard quad (face camera)
  // Extract camera right and up from inverse view
  let right = normalize(vec3<f32>(camera.viewProj[0][0], camera.viewProj[1][0], camera.viewProj[2][0]));
  let up = normalize(vec3<f32>(camera.viewProj[0][1], camera.viewProj[1][1], camera.viewProj[2][1]));
  
  // Compute final world position
  let worldPos = particleWorldPos + right * quadOffset.x + up * quadOffset.y;
  
  // Project to clip space
  output.position = camera.viewProj * vec4<f32>(worldPos, 1.0);
  output.uv = input.uv;
  output.color = instance.color;
  output.life = instance.velLife.w;
  output.worldPos = worldPos;
  
  return output;
}

// Procedural noise function (for organic particle appearance)
fn hash(p: vec2<f32>) -> f32 {
  var p2 = fract(p * vec2<f32>(123.34, 456.21));
  p2 += dot(p2, p2 + 45.32);
  return fract(p2.x * p2.y);
}

fn noise(p: vec2<f32>) -> f32 {
  let i = floor(p);
  let f = fract(p);
  
  let a = hash(i);
  let b = hash(i + vec2<f32>(1.0, 0.0));
  let c = hash(i + vec2<f32>(0.0, 1.0));
  let d = hash(i + vec2<f32>(1.0, 1.0));
  
  let u = f * f * (3.0 - 2.0 * f);
  
  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

// Fractal Brownian Motion (multi-octave noise)
fn fbm(p: vec2<f32>) -> f32 {
  var value = 0.0;
  var amplitude = 0.5;
  var frequency = 1.0;
  var p2 = p;
  
  for (var i = 0; i < 4; i++) {
    value += amplitude * noise(p2 * frequency);
    frequency *= 2.0;
    amplitude *= 0.5;
  }
  
  return value;
}

// Fragment shader - Soft particle with noise
@fragment
fn fsMain(input: VertexOutput) -> @location(0) vec4<f32> {
  // Distance from center (for radial fade)
  let center = vec2<f32>(0.5, 0.5);
  let dist = length(input.uv - center);
  
  // Radial gradient (soft circular particle)
  var alpha = 1.0 - smoothstep(0.0, 0.5, dist);
  
  // Apply noise for organic look
  let noiseScale = 3.0;
  let noiseUV = input.uv * noiseScale + vec2<f32>(model.time * 0.1);
  let noiseValue = fbm(noiseUV);
  
  // Modulate alpha with noise
  alpha *= noiseValue * 1.5;
  
  // Fade based on particle life
  let lifeFade = clamp(input.life / 0.5, 0.0, 1.0); // Fade in last 0.5s
  alpha *= lifeFade;
  
  // Apply instance color
  var finalColor = input.color;
  finalColor.a *= alpha * model.intensity;
  
  // Discard fully transparent fragments
  if (finalColor.a < 0.01) {
    discard;
  }
  
  return finalColor;
}
`;

// ../../../engine/effects/destruction.js
var DestructionEffect = class {
  constructor(device2, format, config = {}) {
    this.device = device2;
    this.format = format;
    this.particleCount = config.particleCount || 100;
    this.duration = config.duration || 2.5;
    this.spread = config.spread || 5;
    this.time = 0;
    this.enabled = false;
    this.particles = [];
    this.color = config.color || [0.6, 0.5, 0.4, 1];
    this.intensity = 1;
    this._initPipeline();
    this._initParticles();
  }
  _initPipeline() {
    const S = 1;
    const vertexData = new Float32Array([
      -0.5 * S,
      0.5 * S,
      0,
      // Top-left
      0.5 * S,
      0.5 * S,
      0,
      // Top-right
      -0.5 * S,
      -0.5 * S,
      0,
      // Bottom-left
      0.5 * S,
      -0.5 * S,
      0
      // Bottom-right
    ]);
    const uvData = new Float32Array([
      0,
      0,
      // Top-left
      1,
      0,
      // Top-right
      0,
      1,
      // Bottom-left
      1,
      1
      // Bottom-right
    ]);
    const indexData = new Uint16Array([0, 2, 1, 1, 2, 3]);
    this.vertexBuffer = this.device.createBuffer({
      size: vertexData.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
    });
    this.device.queue.writeBuffer(this.vertexBuffer, 0, vertexData);
    this.uvBuffer = this.device.createBuffer({
      size: uvData.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
    });
    this.device.queue.writeBuffer(this.uvBuffer, 0, uvData);
    this.indexBuffer = this.device.createBuffer({
      size: Math.ceil(indexData.byteLength / 4) * 4,
      usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST
    });
    this.device.queue.writeBuffer(this.indexBuffer, 0, indexData);
    this.indexCount = indexData.length;
    const maxParticles = this.particleCount;
    const instanceDataSize = maxParticles * (4 + 4 + 4) * 4;
    this.instanceBuffer = this.device.createBuffer({
      size: instanceDataSize,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
    });
    this.cameraBuffer = this.device.createBuffer({
      size: 64,
      // mat4x4
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });
    this.modelBuffer = this.device.createBuffer({
      size: 64 + 16 + 16,
      // model matrix + time + intensity (padded)
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });
    const bindGroupLayout = this.device.createBindGroupLayout({
      entries: [
        { binding: 0, visibility: GPUShaderStage.VERTEX, buffer: {} },
        // camera
        { binding: 1, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: {} }
        // model + time
      ]
    });
    this.bindGroup = this.device.createBindGroup({
      layout: bindGroupLayout,
      entries: [
        { binding: 0, resource: { buffer: this.cameraBuffer } },
        { binding: 1, resource: { buffer: this.modelBuffer } }
      ]
    });
    const shaderModule = this.device.createShaderModule({ code: dustShader });
    const pipelineLayout = this.device.createPipelineLayout({ bindGroupLayouts: [bindGroupLayout] });
    this.pipeline = this.device.createRenderPipeline({
      layout: pipelineLayout,
      vertex: {
        module: shaderModule,
        entryPoint: "vsMain",
        buffers: [
          // Vertex positions (per-vertex, shared quad)
          {
            arrayStride: 3 * 4,
            stepMode: "vertex",
            attributes: [{ shaderLocation: 0, offset: 0, format: "float32x3" }]
          },
          // UVs (per-vertex, shared quad)
          {
            arrayStride: 2 * 4,
            stepMode: "vertex",
            attributes: [{ shaderLocation: 1, offset: 0, format: "float32x2" }]
          },
          // Instance data (per-particle)
          {
            arrayStride: 12 * 4,
            // 3 vec4s = 12 floats
            stepMode: "instance",
            attributes: [
              { shaderLocation: 2, offset: 0, format: "float32x4" },
              // position + size
              { shaderLocation: 3, offset: 16, format: "float32x4" },
              // velocity + life
              { shaderLocation: 4, offset: 32, format: "float32x4" }
              // color
            ]
          }
        ]
      },
      fragment: {
        module: shaderModule,
        entryPoint: "fsMain",
        targets: [{
          format: this.format,
          blend: {
            color: { srcFactor: "src-alpha", dstFactor: "one-minus-src-alpha", operation: "add" },
            alpha: { srcFactor: "one", dstFactor: "one-minus-src-alpha", operation: "add" }
          }
        }]
      },
      primitive: { topology: "triangle-list", cullMode: "none" },
      depthStencil: {
        depthWriteEnabled: false,
        // Particles don't write depth
        depthCompare: "less",
        format: "depth24plus"
      }
    });
  }
  _initParticles() {
    for (let i = 0; i < this.particleCount; i++) {
      this.particles.push({
        // Local position offset from parent
        position: [0, 0, 0],
        velocity: [0, 0, 0],
        life: 0,
        maxLife: 0,
        size: 0,
        color: [...this.color]
      });
    }
  }
  /**
   * Trigger the destruction effect
   * Spawns all particles with random velocities
   */
  trigger() {
    this.enabled = true;
    this.time = 0;
    for (let i = 0; i < this.particleCount; i++) {
      const particle = this.particles[i];
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r2 = Math.random() * 0.5;
      particle.position = [
        r2 * Math.sin(phi) * Math.cos(theta),
        Math.random() * 1,
        // Slightly upward bias
        r2 * Math.sin(phi) * Math.sin(theta)
      ];
      const speed = 2 + Math.random() * 3;
      const vTheta = Math.random() * Math.PI * 2;
      const vPhi = Math.acos(2 * Math.random() - 1);
      particle.velocity = [
        speed * Math.sin(vPhi) * Math.cos(vTheta),
        speed * Math.abs(Math.sin(vPhi)) * 2,
        // Upward bias
        speed * Math.sin(vPhi) * Math.sin(vTheta)
      ];
      particle.maxLife = 1 + Math.random() * 1.5;
      particle.life = particle.maxLife;
      particle.size = 0.5 + Math.random() * 1.5;
      particle.color = [
        this.color[0] + (Math.random() - 0.5) * 0.2,
        this.color[1] + (Math.random() - 0.5) * 0.2,
        this.color[2] + (Math.random() - 0.5) * 0.2,
        1
      ];
    }
  }
  /**
   * Update particle simulation
   */
  update(dt) {
    if (!this.enabled) return;
    this.time += dt;
    let aliveCount = 0;
    for (let i = 0; i < this.particleCount; i++) {
      const p = this.particles[i];
      if (p.life <= 0) continue;
      p.velocity[1] -= 2 * dt;
      p.velocity[0] *= 0.98;
      p.velocity[1] *= 0.98;
      p.velocity[2] *= 0.98;
      p.position[0] += p.velocity[0] * dt;
      p.position[1] += p.velocity[1] * dt;
      p.position[2] += p.velocity[2] * dt;
      p.life -= dt;
      const lifeRatio = p.life / p.maxLife;
      p.color[3] = lifeRatio * this.intensity;
      p.size = (0.5 + Math.random() * 1.5) * (1 + (1 - lifeRatio) * 2);
      aliveCount++;
    }
    if (aliveCount === 0 && this.time > this.duration) {
      this.enabled = false;
    }
    this._updateInstanceBuffer();
  }
  _updateInstanceBuffer() {
    const instanceData = new Float32Array(this.particleCount * 12);
    for (let i = 0; i < this.particleCount; i++) {
      const p = this.particles[i];
      const offset = i * 12;
      instanceData[offset + 0] = p.position[0];
      instanceData[offset + 1] = p.position[1];
      instanceData[offset + 2] = p.position[2];
      instanceData[offset + 3] = p.size;
      instanceData[offset + 4] = p.velocity[0];
      instanceData[offset + 5] = p.velocity[1];
      instanceData[offset + 6] = p.velocity[2];
      instanceData[offset + 7] = p.life;
      instanceData[offset + 8] = p.color[0];
      instanceData[offset + 9] = p.color[1];
      instanceData[offset + 10] = p.color[2];
      instanceData[offset + 11] = p.color[3];
    }
    this.device.queue.writeBuffer(this.instanceBuffer, 0, instanceData);
  }
  /**
   * Update instance data with parent transform
   * Called by parent object before rendering
   */
  updateInstanceData(baseModelMatrix) {
    const local = mat4Impl.identity();
    const finalMat = mat4Impl.identity();
    mat4Impl.multiply(baseModelMatrix, local, finalMat);
    const timeBuffer = new Float32Array([this.time]);
    const intensityBuffer = new Float32Array([this.intensity]);
    this.device.queue.writeBuffer(this.modelBuffer, 0, finalMat);
    this.device.queue.writeBuffer(this.modelBuffer, 64, timeBuffer);
    this.device.queue.writeBuffer(this.modelBuffer, 80, intensityBuffer);
  }
  /**
   * Draw particles
   */
  draw(pass2, cameraMatrix) {
    if (!this.enabled) return;
    this.device.queue.writeBuffer(this.cameraBuffer, 0, cameraMatrix);
    pass2.setPipeline(this.pipeline);
    pass2.setBindGroup(0, this.bindGroup);
    pass2.setVertexBuffer(0, this.vertexBuffer);
    pass2.setVertexBuffer(1, this.uvBuffer);
    pass2.setVertexBuffer(2, this.instanceBuffer);
    pass2.setIndexBuffer(this.indexBuffer, "uint16");
    pass2.drawIndexed(this.indexCount, this.particleCount);
  }
  /**
   * Main render method (called by parent)
   */
  render(pass2, mesh, viewProjMatrix, dt = 0.016) {
    if (!this.enabled) return;
    this.update(dt);
    this.draw(pass2, viewProjMatrix);
  }
  /**
   * Set effect intensity
   */
  setIntensity(v) {
    this.intensity = v;
  }
  /**
   * Check if effect is still active
   */
  isActive() {
    return this.enabled;
  }
  /**
   * Reset effect
   */
  reset() {
    this.enabled = false;
    this.time = 0;
    for (let p of this.particles) {
      p.life = 0;
    }
  }
};

// ../../../shaders/flame-effect/flameEffect.js
var flameEffect = (
  /* wgsl */
  `

struct Camera {
  viewProj : mat4x4<f32>
};
@group(0) @binding(0) var<uniform> camera : Camera;

// Uniform buffer layout (112 bytes, all vec4-aligned):
//   offset   0 : model        mat4x4<f32>   (64 bytes)
//   offset  64 : timeSpeed    vec4<f32>     (.x = time, .y = speed)
//   offset  80 : params       vec4<f32>     (.x = intensity, .y = turbulence, .z = stretch)
//   offset  96 : tint         vec4<f32>     (.xyz = rgb tint colour, .w = tint strength 0..1)
struct ModelData {
  model     : mat4x4<f32>,
  timeSpeed : vec4<f32>,
  params    : vec4<f32>,
  tint      : vec4<f32>,
};
@group(0) @binding(1) var<uniform> modelData : ModelData;

struct VSIn {
  @location(0) position : vec3<f32>,
  @location(1) uv       : vec2<f32>,
};

struct VSOut {
  @builtin(position) position  : vec4<f32>,
  @location(0)       uv        : vec2<f32>,
  // Pack all scalar params into two interpolants to stay within limits
  @location(1)       p0        : vec4<f32>, // .x=time .y=speed .z=intensity .w=turbulence
  @location(2)       p1        : vec4<f32>, // .x=stretch .y=tintStrength
  @location(3)       tintColor : vec3<f32>,
};

@vertex
fn vsMain(input : VSIn) -> VSOut {
  var output : VSOut;

  let worldPos     = modelData.model * vec4<f32>(input.position, 1.0);
  output.position  = camera.viewProj * worldPos;
  output.uv        = input.uv;

  output.p0 = vec4<f32>(
    modelData.timeSpeed.x,  // time
    modelData.timeSpeed.y,  // speed
    modelData.params.x,     // intensity
    modelData.params.y      // turbulence
  );
  output.p1 = vec4<f32>(
    modelData.params.z,     // stretch
    modelData.tint.w,       // tintStrength
    0.0, 0.0
  );
  output.tintColor = modelData.tint.xyz;

  return output;
}

// ---------------------------------------------------------------------------
// Noise helpers
// ---------------------------------------------------------------------------
fn hash2(n : vec2<f32>) -> f32 {
  return fract(sin(dot(n, vec2<f32>(12.9898, 78.233))) * 43758.5453);
}

fn noise(p : vec2<f32>) -> f32 {
  let i = floor(p);
  let f = fract(p);
  let u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash2(i + vec2<f32>(0.0, 0.0)), hash2(i + vec2<f32>(1.0, 0.0)), u.x),
    mix(hash2(i + vec2<f32>(0.0, 1.0)), hash2(i + vec2<f32>(1.0, 1.0)), u.x),
    u.y
  );
}

// Two-octave fBm for richer turbulence shape
fn fbm(p : vec2<f32>) -> f32 {
  var v   = 0.0;
  var a   = 0.5;
  var pos = p;
  for (var i = 0; i < 2; i++) {
    v   += a * noise(pos);
    pos  = pos * 2.1 + vec2<f32>(1.7, 9.2);
    a   *= 0.5;
  }
  return v;
}

// ---------------------------------------------------------------------------
// Fragment
// ---------------------------------------------------------------------------
@fragment
fn fsMain(input : VSOut) -> @location(0) vec4<f32> {
  // Unpack
  let time       = input.p0.x;
  let speed      = input.p0.y;
  let intensity  = input.p0.z;
  let turbulence = input.p0.w;   // 0 = calm, 1 = chaotic
  let stretch    = input.p1.x;   // 1 = normal, >1 = tall/thin, <1 = short/wide
  let tintStr    = input.p1.y;   // 0 = natural fire colours, 1 = full tint
  let tintColor  = input.tintColor;

  let t = time * speed * 2.0;

  // --- UV: apply stretch then turbulence warp ---
  var uv = input.uv;
  // Compress v-range so flame occupies more of the quad when stretch > 1
  uv.y = uv.y / max(stretch, 0.01);

  let warpAmt = turbulence * 0.18;
  let warpX   = noise(uv * 3.0 + vec2<f32>(0.0, t * 0.6)) - 0.5;
  let warpY   = noise(uv * 3.0 + vec2<f32>(5.2, t * 0.4)) - 0.5;
  var warpedUV = uv + vec2<f32>(warpX, warpY) * warpAmt;

  // Upward scroll + sideways sway scaled by turbulence
  warpedUV.y += t * 0.4;
  warpedUV.x += sin(t * 0.7) * 0.08 * turbulence;

  // --- Flame density ---
  var n = fbm(warpedUV * 6.0 + vec2<f32>(0.0, t * 0.8));
  // Higher turbulence softens the exponent \u2192 wilder, fluffier edges
  n = pow(n, 3.0 - turbulence * 1.2);

  // --- Base flame palette (dark core \u2192 orange \u2192 hot yellow) ---
  let hotColor  = vec3<f32>(1.0,  0.92, 0.35);
  let midColor  = vec3<f32>(1.0,  0.38, 0.04);
  let coolColor = vec3<f32>(0.55, 0.04, 0.0 );

  let g1 = smoothstep(0.0, 0.5, n);
  let g2 = smoothstep(0.5, 1.0, n);
  var baseColor = mix(mix(coolColor, midColor, g1), hotColor, g2);

  // --- Tint: blend base palette toward tintColor in the bright parts only ---
  // tintStr = 0 \u2192 pure natural fire;  tintStr = 1 \u2192 fully tinted flame
  let tintMask  = smoothstep(0.0, 0.5, n);
  baseColor = mix(baseColor, baseColor * tintColor * 2.0, tintStr * tintMask);

  let finalColor = baseColor * n * intensity;

  // --- Alpha mask: soft edges + top fade that respects stretch ---
  let edgeMask  = smoothstep(0.0, 0.15, input.uv.x)
                * smoothstep(0.0, 0.15, 1.0 - input.uv.x);
  let fadeStart = clamp(0.25 / max(stretch, 0.1), 0.1, 0.6);
  let topFade   = 1.0 - smoothstep(fadeStart, 1.0, input.uv.y);

  let alpha = smoothstep(0.08, 0.65, n) * edgeMask * topFade;

  // Premultiplied alpha for additive blending
  return vec4<f32>(finalColor * alpha, alpha);
}
`
);

// ../../../engine/effects/flame.js
var FlamePresets = {
  // Natural campfire / torch
  natural: {
    intensity: 12,
    speed: 1,
    turbulence: 0.5,
    stretch: 1,
    tint: [1, 1, 1],
    // neutral → pure fire palette
    tintStrength: 0
  },
  // Tall torch / pillar of fire
  torch: {
    intensity: 14,
    speed: 1.2,
    turbulence: 0.35,
    stretch: 2,
    // double height
    tint: [1, 1, 1],
    tintStrength: 0
  },
  // Wide, low bonfire
  bonfire: {
    intensity: 10,
    speed: 0.8,
    turbulence: 0.9,
    stretch: 0.5,
    // short & wide
    tint: [1, 1, 1],
    tintStrength: 0
  },
  // Magical blue flame
  magic: {
    intensity: 8,
    speed: 1.4,
    turbulence: 0.6,
    stretch: 1.3,
    tint: [0.1, 0.4, 1],
    // blue
    tintStrength: 0.85
  },
  // Hellfire — dark purple/red
  hell: {
    intensity: 16,
    speed: 0.9,
    turbulence: 0.8,
    stretch: 1.6,
    tint: [0.6, 0, 0.8],
    // purple
    tintStrength: 0.7
  },
  // Poison green
  poison: {
    intensity: 9,
    speed: 1.1,
    turbulence: 0.7,
    stretch: 1.1,
    tint: [0.1, 1, 0.15],
    // green
    tintStrength: 0.9
  }
};
var FlameEffect = class _FlameEffect {
  /**
   * @param {GPUDevice}  device
   * @param {string}     format       - swap-chain / canvas format (e.g. "bgra8unorm")
   * @param {string}     colorFormat  - render-pass color attachment format (e.g. "rgba16float")
   * @param {object}     params       - initial flame parameters (see defaults below)
   */
  constructor(device2, format, colorFormat, params = {}) {
    this.device = device2;
    this.format = format;
    this.colorFormat = colorFormat ?? format;
    const defaults = FlamePresets.natural;
    this.intensity = params.intensity ?? defaults.intensity;
    this.speed = params.speed ?? defaults.speed;
    this.turbulence = params.turbulence ?? defaults.turbulence;
    this.stretch = params.stretch ?? defaults.stretch;
    this.tint = params.tint ?? defaults.tint;
    this.tintStrength = params.tintStrength ?? defaults.tintStrength;
    this.time = 0;
    this.enabled = true;
    this._initPipeline();
  }
  /** Convenience factory: new FlameEffect.fromPreset(device, fmt, hdrFmt, 'magic') */
  static fromPreset(device2, format, colorFormat, presetName) {
    const preset = FlamePresets[presetName];
    if (!preset) throw new Error(`Unknown FlamePreset: "${presetName}". Available: ${Object.keys(FlamePresets).join(", ")}`);
    return new _FlameEffect(device2, format, colorFormat, preset);
  }
  // -------------------------------------------------------------------------
  // Public setters  (call any time — written to GPU on next updateInstanceData)
  // -------------------------------------------------------------------------
  setIntensity(v) {
    this.intensity = v;
  }
  setSpeed(v) {
    this.speed = v;
  }
  setTurbulence(v) {
    this.turbulence = Math.max(0, Math.min(1, v));
  }
  setStretch(v) {
    this.stretch = Math.max(0.05, v);
  }
  /** @param {[number,number,number]} rgb  e.g. [0.1, 0.4, 1.0] for blue */
  setTint(rgb) {
    this.tint = rgb;
  }
  /** @param {number} v  0 = natural fire colours, 1 = fully tinted */
  setTintStrength(v) {
    this.tintStrength = Math.max(0, Math.min(1, v));
  }
  /** Apply a named preset instantly */
  applyPreset(name2) {
    const p = FlamePresets[name2];
    if (!p) throw new Error(`Unknown FlamePreset: "${name2}"`);
    Object.assign(this, {
      intensity: p.intensity,
      speed: p.speed,
      turbulence: p.turbulence,
      stretch: p.stretch,
      tint: p.tint,
      tintStrength: p.tintStrength
    });
  }
  // -------------------------------------------------------------------------
  _initPipeline() {
    const S = 40;
    const vertexData = new Float32Array([
      -0.5 * S,
      0.5 * S,
      0,
      0.5 * S,
      0.5 * S,
      0,
      -0.5 * S,
      -0.5 * S,
      0,
      0.5 * S,
      -0.5 * S,
      0
    ]);
    const uvData = new Float32Array([0, 1, 1, 1, 0, 0, 1, 0]);
    const indexData = new Uint16Array([0, 2, 1, 1, 2, 3]);
    this.vertexBuffer = this._uploadVertex(vertexData);
    this.uvBuffer = this._uploadVertex(uvData);
    this.indexBuffer = this.device.createBuffer({
      size: Math.ceil(indexData.byteLength / 4) * 4,
      usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST
    });
    this.device.queue.writeBuffer(this.indexBuffer, 0, indexData);
    this.indexCount = indexData.length;
    this.cameraBuffer = this.device.createBuffer({
      size: 64,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });
    this.modelBuffer = this.device.createBuffer({
      size: 112,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });
    const bindGroupLayout = this.device.createBindGroupLayout({
      entries: [
        { binding: 0, visibility: GPUShaderStage.VERTEX, buffer: { type: "uniform" } },
        { binding: 1, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: { type: "uniform" } }
      ]
    });
    this.bindGroup = this.device.createBindGroup({
      layout: bindGroupLayout,
      entries: [
        { binding: 0, resource: { buffer: this.cameraBuffer } },
        { binding: 1, resource: { buffer: this.modelBuffer } }
      ]
    });
    const shaderModule = this.device.createShaderModule({ code: flameEffect });
    const pipelineLayout = this.device.createPipelineLayout({ bindGroupLayouts: [bindGroupLayout] });
    this.pipeline = this.device.createRenderPipeline({
      layout: pipelineLayout,
      vertex: {
        module: shaderModule,
        entryPoint: "vsMain",
        buffers: [
          { arrayStride: 3 * 4, attributes: [{ shaderLocation: 0, offset: 0, format: "float32x3" }] },
          { arrayStride: 2 * 4, attributes: [{ shaderLocation: 1, offset: 0, format: "float32x2" }] }
        ]
      },
      fragment: {
        module: shaderModule,
        entryPoint: "fsMain",
        targets: [{
          format: this.colorFormat,
          blend: {
            color: { srcFactor: "src-alpha", dstFactor: "one", operation: "add" },
            alpha: { srcFactor: "one", dstFactor: "one-minus-src-alpha", operation: "add" }
          }
        }]
      },
      primitive: { topology: "triangle-list" },
      depthStencil: { depthWriteEnabled: false, depthCompare: "always", format: "depth24plus" }
    });
  }
  _uploadVertex(data) {
    const buf = this.device.createBuffer({
      size: data.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
    });
    this.device.queue.writeBuffer(buf, 0, data);
    return buf;
  }
  // -------------------------------------------------------------------------
  updateInstanceData(baseModelMatrix) {
    const local = mat4Impl.identity();
    mat4Impl.translate(local, [0, 20, 0], local);
    const finalMat = mat4Impl.identity();
    mat4Impl.multiply(baseModelMatrix, local, finalMat);
    const timeSpeed = new Float32Array([this.time, this.speed, 0, 0]);
    const params = new Float32Array([this.intensity, this.turbulence, this.stretch, 0]);
    const tint = new Float32Array([...this.tint, this.tintStrength]);
    this.device.queue.writeBuffer(this.modelBuffer, 0, finalMat);
    this.device.queue.writeBuffer(this.modelBuffer, 64, timeSpeed);
    this.device.queue.writeBuffer(this.modelBuffer, 80, params);
    this.device.queue.writeBuffer(this.modelBuffer, 96, tint);
  }
  draw(pass2, cameraMatrix) {
    this.device.queue.writeBuffer(this.cameraBuffer, 0, cameraMatrix);
    pass2.setPipeline(this.pipeline);
    pass2.setBindGroup(0, this.bindGroup);
    pass2.setVertexBuffer(0, this.vertexBuffer);
    pass2.setVertexBuffer(1, this.uvBuffer);
    pass2.setIndexBuffer(this.indexBuffer, "uint16");
    pass2.drawIndexed(this.indexCount);
  }
  render(pass2, mesh, viewProjMatrix, dt = 0.01) {
    if (!this.enabled) return;
    this.time += dt;
    this.draw(pass2, viewProjMatrix);
  }
};

// ../../../shaders/flame-effect/flame-instanced.js
var flameEffectInstance = `struct Camera {
  viewProj : mat4x4<f32>
};
@group(0) @binding(0) var<uniform> camera : Camera;

// Array of particle instances
struct ModelData {
  model : mat4x4<f32>,
  time : vec4<f32>,       // x = time
  intensity : vec4<f32>,  // x = intensity
  color : vec4<f32>,      // rgba color
};
@group(0) @binding(1) var<storage, read> modelDataArray : array<ModelData>;

struct VSIn {
  @location(0) position : vec3<f32>,
  @location(1) uv : vec2<f32>,
  @builtin(instance_index) instanceIdx : u32,
};

struct VSOut {
  @builtin(position) position : vec4<f32>,
  @location(0) uv : vec2<f32>,
  @location(1) time : f32,
  @location(2) intensity : f32,
  @location(3) @interpolate(flat) instanceIdx : u32,
};

@vertex
fn vsMain(input : VSIn) -> VSOut {
  var output : VSOut;
  let modelData = modelDataArray[input.instanceIdx];
  let worldPos = modelData.model * vec4<f32>(input.position, 1.0);
  output.position = camera.viewProj * worldPos;
  output.uv = input.uv;
  output.time = modelData.time.x;
  output.intensity = modelData.intensity.x;
  output.instanceIdx = input.instanceIdx;
  return output;
}

// Simple procedural flame noise (value in 0..1)
fn hash(n : vec2<f32>) -> f32 {
  return fract(sin(dot(n, vec2<f32>(12.9898, 78.233))) * 43758.5453);
}

fn noise(p : vec2<f32>) -> f32 {
  let i = floor(p);
  let f = fract(p);
  let u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i + vec2<f32>(0.0,0.0)), hash(i + vec2<f32>(1.0,0.0)), u.x),
    mix(hash(i + vec2<f32>(0.0,1.0)), hash(i + vec2<f32>(1.0,1.0)), u.x),
    u.y
  );
}

// Flame color gradient: black -> red -> orange -> yellow -> white
fn flameColor(n: f32) -> vec3<f32> {
  if (n < 0.3) {
    return vec3<f32>(n * 3.0, 0.0, 0.0);               // dark red
  } else if (n < 0.6) {
    return vec3<f32>(1.0, (n - 0.3) * 3.33, 0.0);      // red -> orange
  } else {
    return vec3<f32>(1.0, 1.0, (n - 0.6) * 2.5);       // orange -> yellow -> white
  }
}

@fragment
fn fsMain(in : VSOut) -> @location(0) vec4<f32> {
  // Read per-instance data
  let modelData = modelDataArray[in.instanceIdx];
  let baseColor = modelData.color.xyz;
  let instanceAlpha = modelData.color.w;
  let instIntensity = max(0.0, modelData.intensity.x);

  // time with small instance offset
  let t = in.time * 2.0 + f32(in.instanceIdx) * 0.13;

  var uv = in.uv;
  uv.y += t * 0.2;

  // procedural noise
  var n = noise(uv * 5.0 + vec2<f32>(0.0, t * 0.5));
  // keep some brightness: milder sharpening than pow(n,3)
  n = pow(n, 1.5);

  // base flame color from gradient
  let grad = flameColor(n);

  let userColor = modelData.color.xyz;

  // mix ratio (0.0 = pure red, 1.0 = user color)
  let mixFactor = 0.5;
  let mixedColor = mix(grad, userColor, mixFactor);

  // flicker multipliers (shifted into positive range)
  let flickR = 0.7 + 0.3 * sin(t * 3.0); // 0.4 .. 1.0
  let flickG = 0.6 + 0.4 * cos(t * 2.0); // 0.2 .. 1.0
  let flickB = 0.8 + 0.2 * sin(t * 1.5); // 0.6 .. 1.0

  // combine gradient with per-instance baseColor and flicker
  // var color = grad * baseColor * vec3<f32>(flickR, flickG, flickB);
  var color = mixedColor * vec3<f32>(flickR, flickG, flickB);

  // apply instance/global intensity
  color = color * instIntensity;

  // soft alpha based on noise and instance alpha
  var alpha = smoothstep(0.0, 0.6, n) * instanceAlpha * instIntensity;

  // final clamp to avoid negative or NaN values
  color = clamp(color, vec3<f32>(0.0), vec3<f32>(10.0)); // allow HDR-like values for additive blending
  alpha = clamp(alpha, 0.0, 1.0);

  return vec4<f32>(color, alpha);
}
`;

// ../../../engine/effects/flame-emmiter.js
var FlameEmitter = class {
  constructor(device2, format, maxParticles = 20) {
    this.device = device2;
    this.format = format;
    this.time = 0;
    this.intensity = 3;
    this.enabled = true;
    this.maxParticles = maxParticles;
    this.instanceTargets = [];
    this.floatsPerInstance = 28;
    this.instanceData = new Float32Array(maxParticles * this.floatsPerInstance);
    this.smoothFlickeringScale = 0.1;
    this.maxY = 1.9;
    this.minY = 0;
    this.swap0 = 0;
    this.swap1 = 1;
    this.swap2 = 2;
    for (let i = 0; i < maxParticles; i++) {
      this.instanceTargets.push({
        position: [0, 0, 0],
        currentPosition: [0, 0, 0],
        scale: [1, 1, 1],
        currentScale: [1, 1, 1],
        rotation: 0.1,
        color: [1, 0.3, 0, 0.1],
        time: 1,
        intensity: 1,
        riseSpeed: 1
      });
    }
    this._initPipeline();
  }
  recreateVertexData(S) {
    const vertexData = new Float32Array([
      -0.4 * S,
      0.5 * S,
      0 * S,
      0.4 * S,
      0.5 * S,
      0 * S,
      -0.2 * S,
      -0.5 * S,
      0 * S,
      0.2 * S,
      -0.5 * S,
      0 * S
    ]);
    this.device.queue.writeBuffer(this.vertexBuffer, 0, vertexData);
  }
  recreateVertexDataRND(S) {
    const vertexData = new Float32Array([
      -randomFloatFromTo(0.1, 0.8) * S,
      randomFloatFromTo(0.4, 0.6) * S,
      0 * S,
      randomFloatFromTo(0.1, 0.8) * S,
      randomFloatFromTo(0.4, 0.6) * S,
      0 * S,
      -randomFloatFromTo(0.1, 0.4) * S,
      -randomFloatFromTo(0.4, 0.6) * S,
      0 * S,
      randomFloatFromTo(0.1, 0.4) * S,
      -randomFloatFromTo(0.4, 0.6) * S,
      0 * S
    ]);
    this.device.queue.writeBuffer(this.vertexBuffer, 0, vertexData);
  }
  _initPipeline() {
    const S = 5;
    const vertexData = new Float32Array([
      -0.2 * S,
      -0.5 * S,
      0 * S,
      0.2 * S,
      -0.5 * S,
      0 * S,
      -0.4 * S,
      0.5 * S,
      0 * S,
      0.4 * S,
      0.5 * S,
      0 * S
    ]);
    const uvData = new Float32Array([0, 1, 1, 1, 0, 0, 1, 0]);
    const indexData = new Uint16Array([0, 2, 1, 1, 2, 3]);
    this.vertexBuffer = this.device.createBuffer({
      size: vertexData.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
    });
    this.device.queue.writeBuffer(this.vertexBuffer, 0, vertexData);
    this.uvBuffer = this.device.createBuffer({
      size: uvData.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
    });
    this.device.queue.writeBuffer(this.uvBuffer, 0, uvData);
    this.indexBuffer = this.device.createBuffer({
      size: Math.ceil(indexData.byteLength / 4) * 4,
      usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST
    });
    this.device.queue.writeBuffer(this.indexBuffer, 0, indexData);
    this.indexCount = indexData.length;
    this.cameraBuffer = this.device.createBuffer({ size: 64, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });
    this.modelBuffer = this.device.createBuffer({
      size: this.maxParticles * this.floatsPerInstance * 4,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
    });
    const bindGroupLayout = this.device.createBindGroupLayout({
      entries: [
        { binding: 0, visibility: GPUShaderStage.VERTEX, buffer: {} },
        { binding: 1, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: { type: "read-only-storage" } }
      ]
    });
    this.bindGroup = this.device.createBindGroup({
      layout: bindGroupLayout,
      entries: [
        { binding: 0, resource: { buffer: this.cameraBuffer } },
        { binding: 1, resource: { buffer: this.modelBuffer } }
      ]
    });
    const shaderModule = this.device.createShaderModule({ code: flameEffectInstance });
    const pipelineLayout = this.device.createPipelineLayout({ bindGroupLayouts: [bindGroupLayout] });
    this.pipeline = this.device.createRenderPipeline({
      layout: pipelineLayout,
      vertex: {
        module: shaderModule,
        entryPoint: "vsMain",
        buffers: [
          { arrayStride: 3 * 4, attributes: [{ shaderLocation: 0, offset: 0, format: "float32x3" }] },
          { arrayStride: 2 * 4, attributes: [{ shaderLocation: 1, offset: 0, format: "float32x2" }] }
        ]
      },
      fragment: {
        module: shaderModule,
        entryPoint: "fsMain",
        targets: [{ format: this.format }]
      },
      primitive: { topology: "triangle-list" },
      depthStencil: { depthWriteEnabled: false, depthCompare: "less", format: "depth24plus" },
      blend: {
        // color: {srcFactor: "src-alpha", dstFactor: "one", operation: "add"},
        // alpha: {srcFactor: "one", dstFactor: "one-minus-src-alpha", operation: "add"}
        color: {
          srcFactor: "src-alpha",
          dstFactor: "one-minus-src-alpha",
          operation: "add"
        },
        alpha: {
          srcFactor: "one",
          dstFactor: "one-minus-src-alpha",
          operation: "add"
        }
      }
    });
  }
  updateInstanceData = (baseModelMatrix) => {
    const count = Math.min(this.instanceTargets.length, this.maxParticles);
    for (let i = 0; i < count; i++) {
      const t = this.instanceTargets[i];
      for (let j = 0; j < 3; j++) {
        t.currentPosition[j] += (t.position[j] - t.currentPosition[j]) * 0.12;
        t.currentScale[j] += (t.scale[j] - t.currentScale[j]) * 0.12;
      }
      const local = mat4Impl.identity();
      mat4Impl.translate(local, t.currentPosition, local);
      mat4Impl.rotateY(local, t.rotation, local);
      mat4Impl.scale(local, t.currentScale, local);
      const finalMat = mat4Impl.identity();
      mat4Impl.multiply(baseModelMatrix, local, finalMat);
      const offset = i * this.floatsPerInstance;
      this.instanceData.set(finalMat, offset);
      this.instanceData.set([t.time, 0, 0, 0], offset + 16);
      this.instanceData.set([t.intensity, 0, 0, 0], offset + 20);
      this.instanceData.set([t.color[0], t.color[1], t.color[2], t.color[3] ?? 1], offset + 24);
    }
    this.device.queue.writeBuffer(
      this.modelBuffer,
      0,
      this.instanceData.subarray(0, count * this.floatsPerInstance)
    );
  };
  render(pass2, mesh, viewProjMatrix, dt = 0.1) {
    this.time += dt;
    for (const p of this.instanceTargets) {
      p.position[this.swap1] += dt * p.riseSpeed;
      if (p.position[this.swap1] > this.maxY) {
        p.position[this.swap1] = this.minY + Math.random() * 0.5;
        p.position[this.swap0] = (Math.random() - 0.5) * 0.2;
        p.position[this.swap2] = (Math.random() - 0.5) * 0.2 + 0.1;
        p.riseSpeed = 0.2 + Math.random() * 1;
      }
      p.scale[0] = p.scale[1] = this.smoothFlickeringScale + Math.sin(this.time * 2 + p.position[this.swap1]) * 0.1;
      p.rotation += dt * randomIntFromTo(3, 15);
    }
    this.device.queue.writeBuffer(this.cameraBuffer, 0, viewProjMatrix);
    pass2.setPipeline(this.pipeline);
    pass2.setBindGroup(0, this.bindGroup);
    pass2.setVertexBuffer(0, this.vertexBuffer);
    pass2.setVertexBuffer(1, this.uvBuffer);
    pass2.setIndexBuffer(this.indexBuffer, "uint16");
    pass2.drawIndexed(this.indexCount, this.instanceTargets.length);
  }
  setIntensity(v) {
    this.intensity = v;
  }
};

// ../../../engine/literals.js
var VERTEX_ANIM_FLAGS = {
  NONE: 0,
  WAVE: 1 << 0,
  // 1
  WIND: 1 << 1,
  // 2
  PULSE: 1 << 2,
  // 4
  TWIST: 1 << 3,
  // 8
  NOISE: 1 << 4,
  // 16
  OCEAN: 1 << 5,
  // 32
  DISPLACEMENT: 1 << 6
  // 64
};

// ../../../engine/mesh-obj.js
var MEMeshObj = class extends Materials {
  constructor(canvas, device2, context, o2, inputHandler, globalAmbient, _glbFile = null, primitiveIndex = null, skinnedNodeIndex = null) {
    super(device2, o2.material, _glbFile, o2.textureCache);
    if (typeof o2.name === "undefined") o2.name = genName(3);
    if (typeof o2.raycast === "undefined") {
      this.raycast = { enabled: false, radius: 2 };
    } else {
      this.raycast = o2.raycast;
    }
    if (typeof o2.pointerEffect === "undefined") {
      this.pointerEffect = { enabled: false };
    }
    this.pointerEffect = o2.pointerEffect;
    this.name = o2.name;
    this.done = false;
    this.canvas = canvas;
    this.device = device2;
    this.context = context;
    this.entityArgPass = o2.entityArgPass;
    this.clearColor = "red";
    this.video = null;
    this.FINISH_VIDIO_INIT = false;
    this.globalAmbient = [...globalAmbient];
    if (typeof o2.material.useTextureFromGlb === "undefined" || typeof o2.material.useTextureFromGlb !== "boolean") {
      o2.material.useTextureFromGlb = false;
    }
    if (typeof o2.material.useBlend === "undefined" || typeof o2.material.useBlend !== "boolean") {
      o2.material.useBlend = false;
    }
    this.useScale = o2.useScale || false;
    this.material = o2.material;
    this.time = 0;
    this.deltaTimeAdapter = 10;
    addEventListener("update-pipeine", () => {
      this.setupPipeline();
    });
    this.mesh = o2.mesh;
    if (_glbFile != null) {
      if (typeof this.mesh == "undefined") {
        this.mesh = {};
        this.mesh.feedFromRealGlb = true;
      }
      const verView = _glbFile.skinnedMeshNodes[skinnedNodeIndex].mesh.primitives[primitiveIndex].positions.view;
      const byteOffsetV = verView.byteOffset || 0;
      const byteLengthV = verView.buffer.byteLength;
      const vertices = new Float32Array(
        verView.buffer.buffer,
        byteOffsetV,
        byteLengthV / 4
      );
      this.mesh.vertices = vertices;
      const norView = _glbFile.skinnedMeshNodes[skinnedNodeIndex].mesh.primitives[primitiveIndex].normals.view;
      const normalsUint8 = norView.buffer;
      const byteOffsetN = norView.byteOffset || 0;
      const byteLengthN = normalsUint8.byteLength;
      const normals = new Float32Array(
        normalsUint8.buffer,
        byteOffsetN,
        byteLengthN / 4
      );
      this.mesh.vertexNormals = normals;
      let accessor = _glbFile.skinnedMeshNodes[skinnedNodeIndex].mesh.primitives[primitiveIndex].texcoords[0];
      const bufferView = accessor.view;
      const byteOffset = (bufferView.byteOffset || 0) + (accessor.byteOffset || 0);
      const count = accessor.count * 2;
      const uvFloatArray = new Float32Array(bufferView.buffer.buffer, byteOffset, count);
      this.mesh.uvs = uvFloatArray;
      this.mesh.textures = uvFloatArray;
      let binaryI = _glbFile.skinnedMeshNodes[skinnedNodeIndex].mesh.primitives[primitiveIndex].indices;
      const indicesView = binaryI.view;
      const indicesUint8 = indicesView.buffer;
      const byteOffsetI = indicesView.byteOffset || 0;
      const byteLengthI = indicesUint8.byteLength;
      let indicesArray;
      switch (binaryI.componentType) {
        case 5121:
          indicesArray = new Uint8Array(indicesUint8.buffer, byteOffsetI, byteLengthI);
          break;
        case 5123:
          indicesArray = new Uint16Array(indicesUint8.buffer, byteOffsetI, byteLengthI / 2);
          break;
        case 5125:
          indicesArray = new Uint32Array(indicesUint8.buffer, byteOffsetI, byteLengthI / 4);
          break;
        default:
          throw new Error("Unknown index componentType");
      }
      this.mesh.indices = indicesArray;
      let weightsView = _glbFile.skinnedMeshNodes[skinnedNodeIndex].mesh.primitives[primitiveIndex].weights.view;
      this.mesh.weightsView = weightsView;
      let primitive = _glbFile.skinnedMeshNodes[skinnedNodeIndex].mesh.primitives[primitiveIndex];
      let finalRoundedWeights = this.getAccessorArray(_glbFile, primitive.weights.weightsAccessIndex);
      const weightsArray = finalRoundedWeights;
      for (let i = 0; i < weightsArray.length; i += 4) {
        const sum2 = weightsArray[i] + weightsArray[i + 1] + weightsArray[i + 2] + weightsArray[i + 3];
        if (sum2 > 0) {
          const inv = 1 / sum2;
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
        if (Math.abs(s - 1) > 1e-3) console.warn("Weight not normalized!", i, s);
      }
      this.mesh.weightsBuffer = this.device.createBuffer({
        label: "weightsBuffer real data",
        size: weightsArray.byteLength,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        mappedAtCreation: true
      });
      new Float32Array(this.mesh.weightsBuffer.getMappedRange()).set(weightsArray);
      this.mesh.weightsBuffer.unmap();
      let jointsView = _glbFile.skinnedMeshNodes[skinnedNodeIndex].mesh.primitives[primitiveIndex].joints.view;
      this.mesh.jointsView = jointsView;
      let jointsArray16 = new Uint16Array(
        jointsView.buffer,
        jointsView.byteOffset || 0,
        jointsView.byteLength / 2
        // in Uint16 elements
      );
      const jointsArray32 = new Uint32Array(jointsArray16.length);
      for (let i = 0; i < jointsArray16.length; i++) {
        jointsArray32[i] = jointsArray16[i];
      }
      this.mesh.jointsBuffer = this.device.createBuffer({
        label: "jointsBuffer[real-data]",
        size: jointsArray32.byteLength,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        mappedAtCreation: true
      });
      new Uint32Array(this.mesh.jointsBuffer.getMappedRange()).set(jointsArray32);
      this.mesh.jointsBuffer.unmap();
      let tangentArray = null;
      if (_glbFile.skinnedMeshNodes[skinnedNodeIndex].mesh.primitives[primitiveIndex].tangents) {
        const tangentView = _glbFile.skinnedMeshNodes[skinnedNodeIndex].mesh.primitives[primitiveIndex].tangents.view;
        const byteOffsetT = tangentView.byteOffset || 0;
        const byteLengthT = tangentView.buffer.byteLength;
        tangentArray = new Float32Array(
          tangentView.buffer,
          byteOffsetT,
          byteLengthT / 4
        );
        this.mesh.tangents = tangentArray;
        this.mesh.tangentsBuffer = this.device.createBuffer({
          label: "tangentsBuffer[real-data]",
          size: tangentArray.byteLength,
          usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
          mappedAtCreation: true
        });
        new Float32Array(this.mesh.tangentsBuffer.getMappedRange()).set(tangentArray);
        this.mesh.tangentsBuffer.unmap();
      } else {
        const dummyTangents = new Float32Array(this.mesh.vertices.length / 3 * 4);
        for (let i = 0; i < dummyTangents.length; i += 4) {
          dummyTangents[i + 0] = 1;
          dummyTangents[i + 1] = 0;
          dummyTangents[i + 2] = 0;
          dummyTangents[i + 3] = 1;
        }
        this.mesh.tangentsBuffer = this.device.createBuffer({
          label: "tangentsBuffer dummy",
          size: dummyTangents.byteLength,
          usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
          mappedAtCreation: true
        });
        new Float32Array(this.mesh.tangentsBuffer.getMappedRange()).set(dummyTangents);
        this.mesh.tangentsBuffer.unmap();
        console.warn("GLTF primitive has no TANGENT attribute (normal map won\u2019t work properly).");
      }
    } else {
      this.mesh.uvs = this.mesh.textures;
    }
    console.log(`%cMesh loaded: ${o2.name}`, LOG_FUNNY_ARCADE2);
    if (typeof o2.objAnim !== "undefined" && o2.objAnim != null) {
      this.objAnim = o2.objAnim;
      for (var key in this.objAnim.animations) {
        if (key != "active") this.objAnim.animations[key].speedCounter = 0;
      }
      console.log(`%c Mesh objAnim exist: ${o2.objAnim}`, LOG_FUNNY_SMALL);
      this.drawElements = this.drawElementsAnim;
    }
    this.inputHandler = inputHandler;
    this.cameras = o2.cameras;
    this.mainCameraParams = {
      type: o2.mainCameraParams.type,
      responseCoef: o2.mainCameraParams.responseCoef
    };
    this.lastFrameMS = 0;
    this.texturesPaths = [];
    o2.texturesPaths.forEach((t) => {
      this.texturesPaths.push(t);
    });
    this.presentationFormat = navigator.gpu.getPreferredCanvasFormat();
    this.position = new Position(o2.position.x, o2.position.y, o2.position.z);
    this.rotation = new Rotation(o2.rotation.x, o2.rotation.y, o2.rotation.z);
    this.rotation.rotationSpeed.x = o2.rotationSpeed.x;
    this.rotation.rotationSpeed.y = o2.rotationSpeed.y;
    this.rotation.rotationSpeed.z = o2.rotationSpeed.z;
    this.scale = o2.scale;
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
        stride: 16
        // vec4<u32>
      };
      const numVerts = this.mesh.vertices.length / 3;
      const weightsData = new Float32Array(numVerts * 4);
      for (let i = 0; i < numVerts; i++) {
        weightsData[i * 4 + 0] = 1;
        weightsData[i * 4 + 1] = 0;
        weightsData[i * 4 + 2] = 0;
        weightsData[i * 4 + 3] = 0;
      }
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
        stride: 16
        // vec4<f32>
      };
    }
    this.runProgram = () => {
      return new Promise(async (resolve) => {
        this.shadowDepthTextureSize = 1024;
        this.modelViewProjectionMatrix = mat4Impl.create();
        this.loadTex0(this.texturesPaths).then(() => {
          resolve();
        });
      });
    };
    this.runProgram().then(() => {
      this.context.configure({
        device: this.device,
        format: this.presentationFormat,
        alphaMode: "premultiplied"
      });
      this.vertexBuffer = this.device.createBuffer({
        size: this.mesh.vertices.length * Float32Array.BYTES_PER_ELEMENT,
        usage: GPUBufferUsage.VERTEX,
        mappedAtCreation: true
      });
      {
        new Float32Array(this.vertexBuffer.getMappedRange()).set(this.mesh.vertices);
        this.vertexBuffer.unmap();
      }
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
      this.indexCount = this.mesh.indices.length;
      const indexCount = this.mesh.indices.length;
      const size2 = Math.ceil(indexCount * Uint16Array.BYTES_PER_ELEMENT / 4) * 4;
      this.indexBuffer = this.device.createBuffer({
        size: size2,
        usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
        mappedAtCreation: true
      });
      new Uint16Array(this.indexBuffer.getMappedRange()).set(this.mesh.indices);
      this.indexBuffer.unmap();
      this.indexCount = indexCount;
      let glbInfo = {
        arrayStride: 4 * 4,
        // vec4<f32> = 4 * 4 bytes
        attributes: [{ format: "float32x4", offset: 0, shaderLocation: 4 }]
      };
      this.vertexBuffers = [
        {
          arrayStride: Float32Array.BYTES_PER_ELEMENT * 3,
          attributes: [{ shaderLocation: 0, offset: 0, format: "float32x3" }]
        },
        {
          arrayStride: Float32Array.BYTES_PER_ELEMENT * 3,
          attributes: [{ shaderLocation: 1, offset: 0, format: "float32x3" }]
        },
        {
          arrayStride: Float32Array.BYTES_PER_ELEMENT * 2,
          attributes: [{ shaderLocation: 2, offset: 0, format: "float32x2" }]
        },
        // joint indices
        {
          arrayStride: 4 * 4,
          // vec4<u32> = 4 * 4 bytes
          attributes: [{ format: "uint32x4", offset: 0, shaderLocation: 3 }]
        },
        // weights
        glbInfo
      ];
      if (this.mesh.tangentsBuffer) {
        this.vertexBuffers.push({
          arrayStride: 4 * 4,
          // vec4<f32> = 16 bytes
          attributes: [
            { shaderLocation: 5, format: "float32x4", offset: 0 }
          ]
        });
      }
      this.topology = "triangle-list";
      this.setTopology = (t) => {
        const isStrip = t === "triangle-strip" || t === "line-strip";
        if (isStrip) {
          this.primitive = {
            topology: t,
            stripIndexFormat: "uint16",
            cullMode: "none",
            frontFace: "ccw"
          };
        } else {
          this.primitive = {
            topology: t,
            cullMode: "none",
            frontFace: "ccw"
          };
        }
        this.setupPipeline();
      };
      this.primitive = {
        topology: this.topology,
        cullMode: "none",
        frontFace: "ccw"
      };
      this.selectedBuffer = device2.createBuffer({ size: 4, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });
      this.selectedBindGroupLayout = device2.createBindGroupLayout({
        label: "selectedBindGroupLayout mesh",
        entries: [
          { binding: 0, visibility: GPUShaderStage.FRAGMENT, buffer: {} }
        ]
      });
      this.selectedBindGroup = device2.createBindGroup({
        label: "selectedBindGroup mesh",
        layout: this.selectedBindGroupLayout,
        entries: [{ binding: 0, resource: { buffer: this.selectedBuffer } }]
      });
      this.setSelectedEffect = (selected = false) => {
        this.device.queue.writeBuffer(this.selectedBuffer, 0, new Float32Array([selected ? 1 : 0]));
      };
      this.setSelectedEffect();
      this.createLayoutForRender();
      this.modelUniformBuffer = this.device.createBuffer({
        size: 4 * 16,
        // 4x4 matrix
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
      });
      this.sceneUniformBuffer = this.device.createBuffer({
        label: "sceneUniformBuffer per mesh",
        size: 192,
        //192, // ⬅️ was 176
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
      });
      this.uniformBufferBindGroupLayout = this.device.createBindGroupLayout({
        label: "uniformBufferBindGroupLayout in mesh regular",
        entries: [
          { binding: 0, visibility: GPUShaderStage.VERTEX, buffer: { type: "uniform" } },
          { binding: 1, visibility: GPUShaderStage.VERTEX, buffer: { type: "uniform" } },
          { binding: 2, visibility: GPUShaderStage.VERTEX, buffer: { type: "uniform" } }
        ]
      });
      function alignTo256(n2) {
        return Math.ceil(n2 / 256) * 256;
      }
      let MAX_BONES = 100;
      this.MAX_BONES = MAX_BONES;
      this.bonesBuffer = device2.createBuffer({
        label: "bonesBuffer",
        size: alignTo256(64 * MAX_BONES),
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
      });
      const bones = new Float32Array(this.MAX_BONES * 16);
      for (let i = 0; i < this.MAX_BONES; i++) {
        bones.set([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1], i * 16);
      }
      this.device.queue.writeBuffer(this.bonesBuffer, 0, bones);
      this.vertexAnimParams = new Float32Array([
        0,
        0,
        0,
        0,
        2,
        0.1,
        2,
        0,
        1.5,
        0.3,
        2,
        0.5,
        1,
        0.1,
        0,
        0,
        1,
        0.5,
        0,
        0,
        1,
        0.05,
        0.5,
        0,
        1,
        0.05,
        2,
        0,
        1,
        0.1,
        0,
        0
      ]);
      this.vertexAnimBuffer = this.device.createBuffer({
        label: "Vertex Animation Params",
        size: this.vertexAnimParams.byteLength,
        // 128 bytes
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
      });
      this.vertexAnim = {
        enableWave: () => {
          this.vertexAnimParams[1] |= VERTEX_ANIM_FLAGS.WAVE;
          this.updateVertexAnimBuffer();
        },
        disableWave: () => {
          this.vertexAnimParams[1] &= ~VERTEX_ANIM_FLAGS.WAVE;
          this.updateVertexAnimBuffer();
        },
        enableWind: () => {
          this.vertexAnimParams[1] |= VERTEX_ANIM_FLAGS.WIND;
          this.updateVertexAnimBuffer();
        },
        disableWind: () => {
          this.vertexAnimParams[1] &= ~VERTEX_ANIM_FLAGS.WIND;
          this.updateVertexAnimBuffer();
        },
        enablePulse: () => {
          this.vertexAnimParams[1] |= VERTEX_ANIM_FLAGS.PULSE;
          this.updateVertexAnimBuffer();
        },
        disablePulse: () => {
          this.vertexAnimParams[1] &= ~VERTEX_ANIM_FLAGS.PULSE;
          this.updateVertexAnimBuffer();
        },
        enableTwist: () => {
          this.vertexAnimParams[1] |= VERTEX_ANIM_FLAGS.TWIST;
          this.updateVertexAnimBuffer();
        },
        disableTwist: () => {
          this.vertexAnimParams[1] &= ~VERTEX_ANIM_FLAGS.TWIST;
          this.updateVertexAnimBuffer();
        },
        enableNoise: () => {
          this.vertexAnimParams[1] |= VERTEX_ANIM_FLAGS.NOISE;
          this.updateVertexAnimBuffer();
        },
        disableNoise: () => {
          this.vertexAnimParams[1] &= ~VERTEX_ANIM_FLAGS.NOISE;
          this.updateVertexAnimBuffer();
        },
        enableOcean: () => {
          this.vertexAnimParams[1] |= VERTEX_ANIM_FLAGS.OCEAN;
          this.updateVertexAnimBuffer();
        },
        disableOcean: () => {
          this.vertexAnimParams[1] &= ~VERTEX_ANIM_FLAGS.OCEAN;
          this.updateVertexAnimBuffer();
        },
        enable: (...effects) => {
          effects.forEach((effect) => {
            this.vertexAnimParams[1] |= VERTEX_ANIM_FLAGS[effect.toUpperCase()];
          });
          this.updateVertexAnimBuffer();
        },
        disable: (...effects) => {
          effects.forEach((effect) => {
            this.vertexAnimParams[1] &= ~VERTEX_ANIM_FLAGS[effect.toUpperCase()];
          });
          this.updateVertexAnimBuffer();
        },
        disableAll: () => {
          this.vertexAnimParams[1] = 0;
          this.updateVertexAnimBuffer();
        },
        isEnabled: (effect) => {
          return (this.vertexAnimParams[1] & VERTEX_ANIM_FLAGS[effect.toUpperCase()]) !== 0;
        },
        setWaveParams: (speed, amplitude, frequency) => {
          this.vertexAnimParams[4] = speed;
          this.vertexAnimParams[5] = amplitude;
          this.vertexAnimParams[6] = frequency;
          this.updateVertexAnimBuffer();
        },
        setWindParams: (speed, strength, heightInfluence, turbulence) => {
          this.vertexAnimParams[8] = speed;
          this.vertexAnimParams[9] = strength;
          this.vertexAnimParams[10] = heightInfluence;
          this.vertexAnimParams[11] = turbulence;
          this.updateVertexAnimBuffer();
        },
        setPulseParams: (speed, amount, centerX = 0, centerY = 0) => {
          this.vertexAnimParams[12] = speed;
          this.vertexAnimParams[13] = amount;
          this.vertexAnimParams[14] = centerX;
          this.vertexAnimParams[15] = centerY;
          this.updateVertexAnimBuffer();
        },
        setTwistParams: (speed, amount) => {
          this.vertexAnimParams[16] = speed;
          this.vertexAnimParams[17] = amount;
          this.updateVertexAnimBuffer();
        },
        setNoiseParams: (scale4, strength, speed) => {
          this.vertexAnimParams[20] = scale4;
          this.vertexAnimParams[21] = strength;
          this.vertexAnimParams[22] = speed;
          this.updateVertexAnimBuffer();
        },
        setOceanParams: (scale4, height, speed) => {
          this.vertexAnimParams[24] = scale4;
          this.vertexAnimParams[25] = height;
          this.vertexAnimParams[26] = speed;
          this.updateVertexAnimBuffer();
        },
        setIntensity: (value) => {
          this.vertexAnimParams[2] = Math.max(0, Math.min(1, value));
          this.updateVertexAnimBuffer();
        },
        getIntensity: () => {
          return this.vertexAnimParams[2];
        }
      };
      this.updateVertexAnimBuffer = () => {
        this.device.queue.writeBuffer(this.vertexAnimBuffer, 0, this.vertexAnimParams);
      };
      this.vertexAnimParams[2] = 1;
      this.updateVertexAnimBuffer();
      this.updateTime = (time) => {
        this.time += time * this.deltaTimeAdapter;
        this.vertexAnimParams[0] = this.time;
        this.device.queue.writeBuffer(this.vertexAnimBuffer, 0, this.vertexAnimParams);
      };
      this.modelBindGroup = this.device.createBindGroup({
        label: "modelBindGroup in mesh",
        layout: this.uniformBufferBindGroupLayout,
        entries: [
          { binding: 0, resource: { buffer: this.modelUniformBuffer } },
          { binding: 1, resource: { buffer: this.bonesBuffer } },
          { binding: 2, resource: { buffer: this.vertexAnimBuffer } }
        ]
      });
      this.mainPassBindGroupLayout = this.device.createBindGroupLayout({
        label: "[mainPass]BindGroupLayout mesh",
        entries: [
          { binding: 0, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: "depth" } },
          { binding: 1, visibility: GPUShaderStage.FRAGMENT, sampler: { type: "comparison" } }
        ]
      });
      this.effects = {};
      if (this.pointerEffect && this.pointerEffect.enabled === true) {
        let pf = navigator.gpu.getPreferredCanvasFormat();
        if (typeof this.pointerEffect.pointEffect !== "undefined" && this.pointerEffect.pointEffect == true) {
          this.effects.pointEffect = new PointEffect2(device2, "rgba16float");
        }
        if (typeof this.pointerEffect.gizmoEffect !== "undefined" && this.pointerEffect.gizmoEffect == true) {
          this.effects.gizmoEffect = new GizmoEffect(device2, "rgba16float");
        }
        if (typeof this.pointerEffect.flameEffect !== "undefined" && this.pointerEffect.flameEffect == true) {
          this.effects.flameEffect = FlameEffect.fromPreset(device2, pf, "rgba16float", "torch");
        }
        if (typeof this.pointerEffect.flameEmitter !== "undefined" && this.pointerEffect.flameEmitter == true) {
          this.effects.flameEmitter = new FlameEmitter(device2, "rgba16float");
        }
        if (typeof this.pointerEffect.destructionEffect !== "undefined" && this.pointerEffect.destructionEffect == true) {
          this.effects.destructionEffect = new DestructionEffect(device2, "rgba16float", {
            particleCount: 100,
            duration: 2.5,
            color: [0.6, 0.5, 0.4, 1]
          });
        }
      }
      this.getTransformationMatrix = (mainRenderBundle, spotLight, index) => {
        const now = Date.now();
        const dt = (now - this.lastFrameMS) / this.mainCameraParams.responseCoef;
        this.lastFrameMS = now;
        const camera = this.cameras[this.mainCameraParams.type];
        if (index == 0) camera.update(dt, inputHandler());
        const camVP = mat4Impl.multiply(camera.projectionMatrix, camera.view);
        const sceneData = new Float32Array(48);
        sceneData.set(spotLight.viewProjMatrix, 0);
        sceneData.set(camVP, 16);
        sceneData.set([camera.position.x, camera.position.y, camera.position.z, 0], 32);
        sceneData.set([spotLight.position[0], spotLight.position[1], spotLight.position[2], 0], 36);
        sceneData.set([this.globalAmbient[0], this.globalAmbient[1], this.globalAmbient[2], 0], 40);
        sceneData.set([this.time, dt, 0, 0], 44);
        device2.queue.writeBuffer(this.sceneUniformBuffer, 0, sceneData.buffer, sceneData.byteOffset, sceneData.byteLength);
      };
      this.getModelMatrix = (pos2, useScale = false) => {
        let modelMatrix2 = mat4Impl.identity();
        mat4Impl.translate(modelMatrix2, [pos2.x, pos2.y, pos2.z], modelMatrix2);
        if (this.itIsPhysicsBody) {
          mat4Impl.rotate(
            modelMatrix2,
            [this.rotation.axis.x, this.rotation.axis.y, this.rotation.axis.z],
            degToRad(this.rotation.angle),
            modelMatrix2
          );
        } else {
          mat4Impl.rotateX(modelMatrix2, this.rotation.getRotX(), modelMatrix2);
          mat4Impl.rotateY(modelMatrix2, this.rotation.getRotY(), modelMatrix2);
          mat4Impl.rotateZ(modelMatrix2, this.rotation.getRotZ(), modelMatrix2);
        }
        if (useScale == true) mat4Impl.scale(modelMatrix2, [this.scale[0], this.scale[1], this.scale[2]], modelMatrix2);
        return modelMatrix2;
      };
      const modelMatrix = mat4Impl.translation([0, 0, 0]);
      const modelData = modelMatrix;
      this.device.queue.writeBuffer(
        this.modelUniformBuffer,
        0,
        modelData.buffer,
        modelData.byteOffset,
        modelData.byteLength
      );
      this.done = true;
      try {
        this.setupPipeline();
      } catch (err) {
        console.log("Err[create pipeline]:", err);
      }
    }).then(() => {
      if (typeof this.objAnim !== "undefined" && this.objAnim !== null) {
        console.log("After all updateMeshListBuffers...");
        this.updateMeshListBuffers();
      }
    });
  }
  setupPipeline = () => {
    this.createBindGroupForRender();
    this.pipeline = this.device.createRenderPipeline({
      label: "Main [Mesh] Pipeline \u2705[OPAQUE]",
      layout: this.device.createPipelineLayout({
        label: "PipelineLayout Opaque",
        bindGroupLayouts: [
          this.bglForRender,
          this.uniformBufferBindGroupLayout,
          this.selectedBindGroupLayout,
          this.waterBindGroupLayout
        ]
      }),
      vertex: {
        entryPoint: "main",
        module: this.device.createShaderModule({
          code: this.material.type === "normalmap" ? vertexWGSL_NM : vertexWGSL
        }),
        buffers: this.vertexBuffers
      },
      fragment: {
        entryPoint: "main",
        module: this.device.createShaderModule({
          code: this.isVideo === true ? fragmentVideoWGSL : this.getMaterial()
        }),
        targets: [
          {
            format: "rgba16float",
            blend: void 0
          }
        ],
        constants: {
          shadowDepthTextureSize: this.shadowDepthTextureSize
        }
      },
      depthStencil: {
        depthWriteEnabled: true,
        depthCompare: "less",
        format: "depth24plus"
      },
      primitive: this.primitive
    });
    this.pipelineTransparent = this.device.createRenderPipeline({
      label: "Main [Mesh] Pipeline \u2705[Transparent]",
      layout: this.device.createPipelineLayout({
        label: "Main PipelineLayout Transparent",
        bindGroupLayouts: [
          this.bglForRender,
          this.uniformBufferBindGroupLayout,
          this.selectedBindGroupLayout,
          this.waterBindGroupLayout
        ]
      }),
      vertex: {
        entryPoint: "main",
        module: this.device.createShaderModule({
          code: this.material.type === "normalmap" ? vertexWGSL_NM : vertexWGSL
        }),
        buffers: this.vertexBuffers
      },
      fragment: {
        entryPoint: "main",
        module: this.device.createShaderModule({
          code: this.isVideo === true ? fragmentVideoWGSL : this.getMaterial()
        }),
        targets: [
          {
            format: "rgba16float",
            blend: {
              color: {
                srcFactor: "src-alpha",
                dstFactor: "one-minus-src-alpha",
                operation: "add"
              },
              alpha: {
                srcFactor: "one",
                dstFactor: "one-minus-src-alpha",
                operation: "add"
              }
            }
          }
        ],
        constants: {
          shadowDepthTextureSize: this.shadowDepthTextureSize
        }
      },
      depthStencil: {
        depthWriteEnabled: false,
        depthCompare: "less",
        format: "depth24plus"
      },
      primitive: this.primitive
    });
  };
  getMainPipeline = () => {
    return this.pipeline;
  };
  updateModelUniformBuffer = () => {
    if (this.done == false) return;
    const modelMatrix = this.getModelMatrix(this.position, this.useScale);
    this.device.queue.writeBuffer(
      this.modelUniformBuffer,
      0,
      modelMatrix.buffer,
      modelMatrix.byteOffset,
      modelMatrix.byteLength
    );
  };
  createGPUBuffer(dataArray, usage) {
    if (!dataArray || typeof dataArray.length !== "number") {
      throw new Error("Invalid data array passed to createGPUBuffer");
    }
    const size2 = dataArray.length * dataArray.BYTES_PER_ELEMENT;
    if (!Number.isFinite(size2) || size2 <= 0) {
      throw new Error(`Invalid buffer size: ${size2}`);
    }
    const buffer = this.device.createBuffer({
      size: size2,
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
      mesh.vertexNormalsBuffer = this.device.createBuffer({
        size: mesh.vertexNormals.length * Float32Array.BYTES_PER_ELEMENT,
        usage: GPUBufferUsage.VERTEX,
        mappedAtCreation: true
      });
      new Float32Array(mesh.vertexNormalsBuffer.getMappedRange()).set(mesh.vertexNormals);
      mesh.vertexNormalsBuffer.unmap();
      mesh.vertexTexCoordsBuffer = this.device.createBuffer({
        size: mesh.textures.length * Float32Array.BYTES_PER_ELEMENT,
        usage: GPUBufferUsage.VERTEX,
        mappedAtCreation: true
      });
      new Float32Array(mesh.vertexTexCoordsBuffer.getMappedRange()).set(mesh.textures);
      mesh.vertexTexCoordsBuffer.unmap();
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
  drawElements = (pass2, lightContainer) => {
    if (this.isVideo) {
      this.updateVideoTexture();
    }
    pass2.setBindGroup(0, this.sceneBindGroupForRender);
    pass2.setBindGroup(1, this.modelBindGroup);
    if (this.isVideo == false) {
      let bindIndex = 2;
      for (const light of lightContainer) {
        pass2.setBindGroup(bindIndex++, light.getMainPassBindGroup(this));
      }
    }
    if (this.selectedBindGroup) {
      pass2.setBindGroup(2, this.selectedBindGroup);
    }
    pass2.setBindGroup(3, this.waterBindGroup);
    pass2.setVertexBuffer(0, this.vertexBuffer);
    pass2.setVertexBuffer(1, this.vertexNormalsBuffer);
    pass2.setVertexBuffer(2, this.vertexTexCoordsBuffer);
    if (this.joints) {
      if (this.constructor.name === "BVHPlayer") {
        pass2.setVertexBuffer(3, this.mesh.jointsBuffer);
        pass2.setVertexBuffer(4, this.mesh.weightsBuffer);
      } else {
        pass2.setVertexBuffer(3, this.joints.buffer);
        pass2.setVertexBuffer(4, this.weights.buffer);
      }
    }
    if (this.mesh.tangentsBuffer) {
      pass2.setVertexBuffer(5, this.mesh.tangentsBuffer);
    }
    pass2.setIndexBuffer(this.indexBuffer, "uint16");
    pass2.drawIndexed(this.indexCount);
  };
  drawElementsAnim = (renderPass, lightContainer) => {
    if (!this.sceneBindGroupForRender || !this.modelBindGroup) {
      console.log("NULL1");
      return;
    }
    if (!this.objAnim.meshList[this.objAnim.id + this.objAnim.currentAni]) {
      console.log("NULL2");
      return;
    }
    renderPass.setBindGroup(0, this.sceneBindGroupForRender);
    renderPass.setBindGroup(1, this.modelBindGroup);
    const mesh = this.objAnim.meshList[this.objAnim.id + this.objAnim.currentAni];
    if (this.isVideo == false) {
      let bindIndex = 2;
      for (const light of lightContainer) {
        renderPass.setBindGroup(bindIndex++, light.getMainPassBindGroup(this));
      }
    }
    if (this.selectedBindGroup) {
      renderPass.setBindGroup(2, this.selectedBindGroup);
    }
    renderPass.setBindGroup(3, this.waterBindGroup);
    renderPass.setVertexBuffer(0, mesh.vertexBuffer);
    renderPass.setVertexBuffer(1, mesh.vertexNormalsBuffer);
    renderPass.setVertexBuffer(2, mesh.vertexTexCoordsBuffer);
    if (this.constructor.name === "BVHPlayer") {
      renderPass.setVertexBuffer(3, this.mesh.jointsBuffer);
      renderPass.setVertexBuffer(4, this.mesh.weightsBuffer);
    } else {
      renderPass.setVertexBuffer(3, this.joints.buffer);
      renderPass.setVertexBuffer(4, this.weights.buffer);
    }
    if (this.mesh.tangentsBuffer) {
      renderPass.setVertexBuffer(5, this.mesh.tangentsBuffer);
    }
    renderPass.setIndexBuffer(mesh.indexBuffer, "uint16");
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
  drawShadows = (shadowPass) => {
    shadowPass.setVertexBuffer(0, this.vertexBuffer);
    shadowPass.setVertexBuffer(1, this.vertexNormalsBuffer);
    shadowPass.setVertexBuffer(2, this.vertexTexCoordsBuffer);
    shadowPass.setVertexBuffer(3, this.joints.buffer);
    shadowPass.setVertexBuffer(4, this.weights.buffer);
    shadowPass.setIndexBuffer(this.indexBuffer, "uint16");
    shadowPass.drawIndexed(this.indexCount);
  };
  destroy = () => {
    if (this._destroyed) return;
    this._destroyed = true;
    this.vertexBuffer?.destroy();
    this.vertexNormalsBuffer?.destroy();
    this.vertexTexCoordsBuffer?.destroy();
    this.indexBuffer?.destroy();
    this.modelUniformBuffer?.destroy();
    this.sceneUniformBuffer?.destroy();
    this.bonesBuffer?.destroy();
    this.selectedBuffer?.destroy();
    this.mesh?.weightsBuffer?.destroy();
    this.mesh?.jointsBuffer?.destroy();
    this.mesh?.tangentsBuffer?.destroy();
    this.joints?.buffer?.destroy();
    this.weights?.buffer?.destroy();
    if (this.objAnim?.meshList) {
      for (const k in this.objAnim.meshList) {
        const m = this.objAnim.meshList[k];
        m.vertexBuffer?.destroy();
        m.vertexNormalsBuffer?.destroy();
        m.vertexTexCoordsBuffer?.destroy();
        m.indexBuffer?.destroy();
      }
    }
    if (this.effects?.pointer?.destroy) {
      this.effects.pointer.destroy();
    }
    this.pipeline = null;
    this.modelBindGroup = null;
    this.sceneBindGroupForRender = null;
    this.selectedBindGroup = null;
    this.material = null;
    this.mesh = null;
    this.objAnim = null;
    this.drawElements = () => {
    };
    this.drawElementsAnim = () => {
    };
    this.drawShadows = () => {
    };
    let testPB = app.matrixAmmo.getBodyByName(this.name);
    if (testPB !== null) {
      try {
        app.matrixAmmo.dynamicsWorld.removeRigidBody(testPB);
      } catch (e) {
        console.warn("Physics cleanup err:", e);
      }
    }
    console.info(`\u{1F9F9}Destroyed: ${this.name}`);
  };
};

// ../../../physics/matrix-ammo.js
var MatrixAmmo = class {
  constructor() {
    scriptManager.LOAD(
      "ammojs/ammo.js",
      "ammojs",
      void 0,
      void 0,
      this.init
    );
    this.lastRoll = "";
    this.presentScore = "";
    this.speedUpSimulation = 1;
  }
  init = () => {
    Ammo().then((Ammo2) => {
      this.dynamicsWorld = null;
      this.rigidBodies = [];
      this.Ammo = Ammo2;
      this.lastUpdate = 0;
      console.log("%c Ammo core loaded.", LOG_FUNNY_ARCADE2);
      this.initPhysics();
      setTimeout(() => {
        dispatchEvent(new CustomEvent("AmmoReady", {}));
      }, 200);
    });
  };
  initPhysics() {
    let Ammo2 = this.Ammo;
    var collisionConfiguration = new Ammo2.btDefaultCollisionConfiguration(), dispatcher = new Ammo2.btCollisionDispatcher(collisionConfiguration), overlappingPairCache = new Ammo2.btDbvtBroadphase(), solver = new Ammo2.btSequentialImpulseConstraintSolver();
    this.dynamicsWorld = new Ammo2.btDiscreteDynamicsWorld(dispatcher, overlappingPairCache, solver, collisionConfiguration);
    this.dynamicsWorld.setGravity(new Ammo2.btVector3(0, -10, 0));
    var groundShape = new Ammo2.btBoxShape(new Ammo2.btVector3(70, 1, 70)), groundTransform = new Ammo2.btTransform();
    groundTransform.setIdentity();
    groundTransform.setOrigin(new Ammo2.btVector3(0, -4.45, 0));
    var mass = 0, isDynamic = mass !== 0, localInertia = new Ammo2.btVector3(0, 0, 0);
    if (isDynamic) groundShape.calculateLocalInertia(mass, localInertia);
    var myMotionState = new Ammo2.btDefaultMotionState(groundTransform), rbInfo = new Ammo2.btRigidBodyConstructionInfo(mass, myMotionState, groundShape, localInertia), body2 = new Ammo2.btRigidBody(rbInfo);
    body2.name = "ground";
    this.ground = body2;
    this.dynamicsWorld.addRigidBody(body2);
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
    let Ammo2 = this.Ammo;
    var colShape = new Ammo2.btSphereShape(Array.isArray(pOptions.radius) ? pOptions.radius[0] : pOptions.radius), startTransform = new Ammo2.btTransform();
    startTransform.setIdentity();
    var mass = 1;
    var localInertia = new Ammo2.btVector3(0, 0, 0);
    colShape.calculateLocalInertia(mass, localInertia);
    startTransform.setOrigin(new Ammo2.btVector3(pOptions.position.x, pOptions.position.y, pOptions.position.z));
    var myMotionState = new Ammo2.btDefaultMotionState(startTransform), rbInfo = new Ammo2.btRigidBodyConstructionInfo(mass, myMotionState, colShape, localInertia), body2 = new Ammo2.btRigidBody(rbInfo);
    if (pOptions.mass == 0 && typeof pOptions.state == "undefined" && typeof pOptions.collide == "undefined") {
      body2.setActivationState(2);
      body2.setCollisionFlags(FLAGS.CF_KINEMATIC_OBJECT);
    } else if (typeof pOptions.collide != "undefined" && pOptions.collide == false) {
      body2.setActivationState(4);
      body2.setCollisionFlags(FLAGS.TEST_NIDZA);
    } else {
      body2.setActivationState(4);
    }
    body2.name = pOptions.name;
    MEObject.itIsPhysicsBody = true;
    body2.MEObject = MEObject;
    this.dynamicsWorld.addRigidBody(body2);
    this.rigidBodies.push(body2);
    return body2;
  }
  addPhysicsBox(MEObject, pOptions) {
    const FLAGS = {
      TEST_NIDZA: 3,
      CF_KINEMATIC_OBJECT: 2
    };
    let Ammo2 = this.Ammo;
    var colShape = new Ammo2.btBoxShape(new Ammo2.btVector3(pOptions.scale[0], pOptions.scale[1], pOptions.scale[2])), startTransform = new Ammo2.btTransform();
    startTransform.setIdentity();
    var mass = pOptions.mass;
    var localInertia = new Ammo2.btVector3(0, 0, 0);
    colShape.calculateLocalInertia(mass, localInertia);
    startTransform.setOrigin(new Ammo2.btVector3(pOptions.position.x, pOptions.position.y, pOptions.position.z));
    var t = startTransform.getRotation();
    t.setX(degToRad(pOptions.rotation.x));
    t.setY(degToRad(pOptions.rotation.y));
    t.setZ(degToRad(pOptions.rotation.z));
    startTransform.setRotation(t);
    var myMotionState = new Ammo2.btDefaultMotionState(startTransform), rbInfo = new Ammo2.btRigidBodyConstructionInfo(mass, myMotionState, colShape, localInertia), body2 = new Ammo2.btRigidBody(rbInfo);
    if (pOptions.mass == 0 && typeof pOptions.state == "undefined" && typeof pOptions.collide == "undefined") {
      body2.setActivationState(2);
      body2.setCollisionFlags(FLAGS.CF_KINEMATIC_OBJECT);
    } else if (typeof pOptions.collide != "undefined" && pOptions.collide == false) {
      body2.setActivationState(4);
      body2.setCollisionFlags(FLAGS.TEST_NIDZA);
    } else {
      body2.setActivationState(4);
    }
    body2.name = pOptions.name;
    MEObject.itIsPhysicsBody = true;
    body2.MEObject = MEObject;
    this.dynamicsWorld.addRigidBody(body2);
    this.rigidBodies.push(body2);
    return body2;
  }
  setBodyVelocity = (body2, x2, y2, z) => {
    var tbv30 = new Ammo.btVector3();
    tbv30.setValue(x2, y2, z);
    body2.setLinearVelocity(tbv30);
  };
  setKinematicTransform = (body2, x2, y2, z, rx, ry, rz) => {
    if (typeof rx == "undefined") {
      var rx = 0;
    }
    if (typeof ry == "undefined") {
      var ry = 0;
    }
    if (typeof rz == "undefined") {
      var rz = 0;
    }
    let pos2 = new Ammo.btVector3();
    pos2 = body2.getWorldTransform().getOrigin();
    let localRot = body2.getWorldTransform().getRotation();
    pos2.setX(pos2.x() + x2);
    pos2.setY(pos2.y() + y2);
    pos2.setZ(pos2.z() + z);
    localRot.setX(rx);
    localRot.setY(ry);
    localRot.setZ(rz);
    let physicsBody = body2;
    let ms = physicsBody.getMotionState();
    if (ms) {
      var tmpTrans = new Ammo.btTransform();
      tmpTrans.setIdentity();
      tmpTrans.setOrigin(pos2);
      tmpTrans.setRotation(localRot);
      ms.setWorldTransform(tmpTrans);
    }
  };
  getBodyByName = (name2) => {
    var b = null;
    this.rigidBodies.forEach((item, index, array) => {
      if (item.name == name2) {
        b = array[index];
      }
    });
    return b;
  };
  getNameByBody = (body2) => {
    var b = null;
    this.rigidBodies.forEach((item, index, array) => {
      if (item.kB == body2.kB) {
        b = array[index].name;
      }
    });
    return b;
  };
  deactivatePhysics = (body2) => {
    const CF_KINEMATIC_OBJECT = 2;
    const DISABLE_DEACTIVATION = 4;
    this.dynamicsWorld.removeRigidBody(body2);
    const flags = body2.getCollisionFlags();
    body2.setCollisionFlags(flags | CF_KINEMATIC_OBJECT);
    body2.setActivationState(DISABLE_DEACTIVATION);
    const zero2 = new Ammo.btVector3(0, 0, 0);
    body2.setLinearVelocity(zero2);
    body2.setAngularVelocity(zero2);
    const currentTransform = body2.getWorldTransform();
    body2.setWorldTransform(currentTransform);
    body2.getMotionState().setWorldTransform(currentTransform);
    this.matrixAmmo.dynamicsWorld.addRigidBody(body2);
    body2.isKinematic = true;
  };
  detectCollision() {
    return;
    this.lastRoll = "";
    this.presentScore = "";
    let dispatcher = this.dynamicsWorld.getDispatcher();
    let numManifolds = dispatcher.getNumManifolds();
    for (let i = 0; i < numManifolds; i++) {
      let contactManifold = dispatcher.getManifoldByIndexInternal(i);
      if (this.ground.kB == contactManifold.getBody0().kB && this.getNameByBody(contactManifold.getBody1()) == "CubePhysics1") {
        var testR = contactManifold.getBody1().getWorldTransform().getRotation();
        console.log("this.lastRoll = ", this.lastRoll, " presentScore = ", this.presentScore);
      }
    }
  }
  updatePhysics() {
    if (typeof Ammo === "undefined") return;
    const trans = new Ammo.btTransform();
    const transform = new Ammo.btTransform();
    this.rigidBodies.forEach(function(body2) {
      if (body2.isKinematic) {
        transform.setIdentity();
        transform.setOrigin(new Ammo.btVector3(
          body2.MEObject.position.x,
          body2.MEObject.position.y,
          body2.MEObject.position.z
        ));
        const quat = new Ammo.btQuaternion();
        quat.setRotation(
          new Ammo.btVector3(
            body2.MEObject.rotation.axis.x,
            body2.MEObject.rotation.axis.y,
            body2.MEObject.rotation.axis.z
          ),
          degToRad(body2.MEObject.rotation.angle)
        );
        transform.setRotation(quat);
        body2.setWorldTransform(transform);
        const ms = body2.getMotionState();
        if (ms) ms.setWorldTransform(transform);
      }
    });
    Ammo.destroy(transform);
    const timeStep = 1 / 60;
    const maxSubSteps = 10;
    for (let i = 0; i < this.speedUpSimulation; i++) {
      this.dynamicsWorld.stepSimulation(timeStep, maxSubSteps);
    }
    this.rigidBodies.forEach(function(body2) {
      if (!body2.isKinematic && body2.getMotionState()) {
        body2.getMotionState().getWorldTransform(trans);
        const _x = +trans.getOrigin().x().toFixed(2);
        const _y = +trans.getOrigin().y().toFixed(2);
        const _z = +trans.getOrigin().z().toFixed(2);
        body2.MEObject.position.setPosition(_x, _y, _z);
        const rot2 = trans.getRotation();
        const rotAxis = rot2.getAxis();
        rot2.normalize();
        body2.MEObject.rotation.axis.x = rotAxis.x();
        body2.MEObject.rotation.axis.y = rotAxis.y();
        body2.MEObject.rotation.axis.z = rotAxis.z();
        body2.MEObject.rotation.matrixRotation = quaternion_rotation_matrix(rot2);
        body2.MEObject.rotation.angle = radToDeg(parseFloat(rot2.getAngle().toFixed(2)));
      }
    });
    Ammo.destroy(trans);
    this.detectCollision();
  }
};

// ../../../../public/res/multilang/en-backup.js
var en = {
  "play": "Play",
  "sendmsg": "Send message",
  "changeTheme": "Theme dark/light",
  "yes": "Yes",
  "no": "No",
  "on": "On",
  "off": "Off",
  "startGame": "\u{1F3B2}Start Game",
  "changeLang": "Change Lang",
  "english": "English",
  "serbian": "Serbian",
  "MAX": "MAX",
  "MIN": "MIN",
  "straight": "Straight",
  "threeOf": "ThreeOf",
  "fullhouse": "FULLH",
  "help": "HELP",
  "roll": "ROLL DICES",
  "settings": "Settings",
  "hand": "Hand",
  "up": "Up |",
  "down": "Down",
  "free": "Free",
  "cornerText": "\u{1F3B2}",
  "poker": "Poker",
  "jamb": "Jamb",
  "final": "Final \u03A3",
  "hide": "HIDE",
  "sounds": "Sounds",
  "welcomeMsg": "Welcome here, <br> open source project \u{1F3B2} Jamb 3d deluxe game <br> download from ",
  "ready": "Ready for play \u{1F3B2}!",
  "freetoroll": "Free for roll \u{1F3B2}!",
  "pick5": "Pick best 5 \u{1F3B2} and choose table field!",
  "hand1": "First hand in play - please wait...",
  "hand2": "Secound hand in play - please wait...",
  "graphics": "Graphics options",
  "choosename": "Choose nickname:",
  "table": "Table",
  "aboutword": "About",
  "about": "<i>Jamb 3d deluxe</i> is a modern 3D dice game built entirely with MatrixEngineWGPU, a high-performance WebGPU-based rendering engine developed for creating interactive graphics directly in the browser. The game delivers smooth visuals, realistic dice physics, and an engaging user experience \u2014 all without requiring any plugins or installations. \n This project is powered by open technologies and is designed to be lightweight, fast, and highly customizable. It\u2019s a great example of how WebGPU can be used for real-time interactive content. \n \u{1F517} Download / Try it: \n github.com/zlatnaspirala/matrix-engine-wgpu \n \u{1F6E0} License: \n The core engine and the Jamb 3d deluxe project are released under the GPL v3 license, making them free and open-source for both personal and commercial use \u2014 as long as you respect the terms of the license. \n Whether you're a developer, gamer, or enthusiast, Jamb 3d deluxe is a fun way to experience the potential of modern browser-based 3D technology. <img width='320' height='320' src='https://github.com/zlatnaspirala/matrix-engine-wgpu/blob/main/public/res/icons/512.png?raw=true' />",
  "letthegame": "Let the game begin!",
  "leaderboard": "Leaderboard",
  "about_": "About",
  "next": "Next",
  "back": "Back",
  "used": "used",
  "gameplaychannel": "gameplay channel",
  "alreadyingame": "Already in game:",
  "waiting_for_others": "Waiting for others...",
  "titleBan": "\u272DBan \u{1F7E2}\u{1F7E2}\u{1F7E2}",
  "aboutRPG": "Forest Of Hollow Blood Made in MatrixEngineWGPU webGPU engine. Open source part can be found in engine repo <a href='https://github.com/zlatnaspirala/matrix-engine-wgpu'> @zlatnaspirala Github.com </a>. Music by <a href='https://pixabay.com/users/mfcc-28627740/?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=274290'>Mykola Sosin</a> from <a href='https://pixabay.com//?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=274290'>Pixabay</a> Characters used from great mixamo.com -\u2705What you can do You can use Mixamo characters and animations royalty-free in commercial, personal, or non\u2011profit projects (games, films, prints, etc.).You own your creations / how you use them.No requirement to credit Adobe / Mixamo (though allowed). -\u{1F6AB}What you cannot do You cannot redistribute or sell the raw Mixamo character or animation files \u201Cas is\u201D (i.e. as standalone assets) to others.You can\u2019t use Mixamo content to create a competing library of characters / animations (i.e. you can\u2019t just package them and sell them to others). You can\u2019t use Mixamo\u2019s content (or outputs) to train AI / machine learning models. Used free assets from great https://craftpix.net Magic icons : https://craftpix.net/freebies/free-rpg-splash-game-512x512-icons/ For background music in rpg template used: Music by Dvir Silverstone from Pixabay Sound Effect by Crunchpix Studio from Pixabay Music by Emmraan from Pixabay . Logo includes the official WebGPU logo. WebGPU logo by W3C Licensed under Creative Commons Attribution 4.0 .   'Ruined rock fence' (https://skfb.ly/6RLwN) by VladNeko is licensed under Creative Commons Attribution (http://creativecommons.org/licenses/by/4.0/).",
  "mariasword": "Maria Sword, the silver blade of the East, strikes with speed and elegance. Her courage burns quietly but never falters.",
  "slayzer": "Slayzer \u2014 a dark creation with blades for arms. Silent, swift, and born from shadow.",
  "steelborn": "Steelborn \u2014 a small yet fearless warrior clad in shining iron armor, wielding his sword with unshakable resolve.",
  "warrok": "Warrok \u2014 a fierce brute forged in battle, wielding raw strength and unbreakable will.",
  "skeletonz": "Skeletonz \u2014 a restless warrior of bone and shadow, risen again to fight without fear.",
  "erika": "Erika moves like a shadow: quiet, precise and watchful. She carries one dark arrow \u2014 simple, deadly and personal.",
  "arissa": "Arissa hides her power behind calm eyes and empty hands. No blade or staff\u2014only the swirling dark orbs she conjures when the fight begins.",
  "gameplayused": "Forest Of Hollow Blood for now have only one channel for gameplay. Please wait for current party end...",
  "nogold": "Not enough gold!",
  "invertorysecret": "Corona Ignifera magic secret Sol Corona,Flamma Crystal\n  Aqua Sanctum magic secret Mare Pearl,Luna Gemma\n Umbra Silens magic secret Umbra Vellum,Noctis Band\n Terra Fortis magic secret Terra Clavis,Ardent Vine,Silva Heart\n Ventus Aegis magic secret Ventus Pluma,Ignifur Cape\n Ferrum Lux magic secret Ferrum Anulus,Lux Feather\n Sanguis Vita magic secret Sanguis Orb,Vita Flos \n Tenebris Vox magic secret Tenebris Fang,Vox Chime \n Aether Gladius magic secret Gladius Ignis,Aether Scale \n Fulgur Mortis magic secret Fulgur Stone,Mortis Bone \n Corona Umbra magic secret Umbra Silens,Corona Ignifera,Tenebris Vox \n Terra Sanctum magic secret Terra Fortis,Aqua Sanctum \n Aether Fortis magic secret Aether Gladius,Ferrum Lux \n  Vita Mindza magic secret Sanguis Vita,Ventus Aegis \n Mortis Ultima magic secret Fulgur Mortis,Corona Umbra,Aether Fortis"
};

// ../../../multilang/lang.js
var MultiLang = class {
  constructor() {
    addEventListener("updateLang", () => {
      console.log("Multilang updated.");
      this.update();
    });
  }
  update = function() {
    var allTranDoms = document.querySelectorAll("[data-label]");
    allTranDoms.forEach((i) => {
      i.innerHTML = this.get[i.getAttribute("data-label")];
    });
  };
  loadMultilang = async function(lang = "en") {
    if (lang == "rs") lang = "sr";
    lang = "res/multilang/" + lang + ".json";
    console.info(`%cMultilang: ${lang}`, LOG_FUNNY_ARCADE2);
    try {
      const r2 = await fetch(lang, {
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json"
        }
      });
      return await r2.json();
    } catch (err) {
      console.warn("Not possible to access multilang json asset! Err => ", err, ". Use backup lang predefinited object. Only english avaible.");
      return en;
    }
  };
};

// ../../../sounds/sounds.js
var MatrixSounds = class {
  constructor() {
    this.volume = 0.5;
    this.audios = {};
    this.enabled = true;
  }
  muteAll() {
    this.enabled = false;
    Object.values(this.audios).forEach((audio) => audio.pause());
  }
  unmuteAll() {
    this.enabled = true;
  }
  createClones(c, name2, path2) {
    for (let x2 = 1; x2 < c; x2++) {
      const a = new Audio(path2);
      a.id = name2 + x2;
      a.volume = this.volume;
      this.audios[name2 + x2] = a;
      document.body.append(a);
    }
  }
  createAudio(name2, path2, useClones) {
    const a = new Audio(path2);
    a.id = name2;
    a.volume = this.volume;
    this.audios[name2] = a;
    document.body.append(a);
    if (typeof useClones !== "undefined") {
      this.createClones(useClones, name2, path2);
    }
  }
  play(name2) {
    if (!this.enabled) return;
    const audio = this.audios[name2];
    if (!audio) return;
    if (audio.paused) {
      audio.play().catch((e) => {
        if (e.name !== "NotAllowedError") console.warn("sounds error:", e);
      });
    } else {
      this.tryClone(name2);
    }
  }
  tryClone(name2) {
    if (!this.enabled) return;
    let cc = 1;
    try {
      while (this.audios[name2 + cc] && this.audios[name2 + cc].paused === false) {
        cc++;
      }
      if (this.audios[name2 + cc]) {
        this.audios[name2 + cc].play();
      }
    } catch (err) {
      console.warn("Clone play failed:", err);
    }
  }
};

// ../../../engine/loader-obj.js
var constructMesh = class {
  constructor(objectData, inputArg) {
    this.inputArg = inputArg;
    this.objectData = objectData;
    this.create(objectData, inputArg);
    this.setScale = (s) => {
      this.inputArg.scale = s;
      this.create(this.objectData, this.inputArg);
    };
    this.updateBuffers = () => {
      this.inputArg.scale = [0.1, 0.1, 0.1];
      this.create(this.objectData, this.inputArg);
    };
  }
  create = (objectData, inputArg, callback) => {
    if (typeof callback === "undefined") callback = function() {
    };
    let initOrientation = [0, 1, 2];
    var verts = [], vertNormals = [], textures = [], unpacked = {};
    unpacked.verts = [];
    unpacked.norms = [];
    unpacked.textures = [];
    unpacked.hashindices = {};
    unpacked.indices = [];
    unpacked.index = 0;
    var lines = objectData.split("\n");
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
        verts.push.apply(verts, elements);
      } else if (NORMAL_RE.test(line)) {
        vertNormals.push.apply(vertNormals, elements);
      } else if (TEXTURE_RE.test(line)) {
        textures.push.apply(textures, elements);
      } else if (FACE_RE.test(line)) {
        var quad = false;
        for (var j = 0, eleLen = elements.length; j < eleLen; j++) {
          if (j === 3 && !quad) {
            j = 2;
            quad = true;
          }
          if (elements[j] in unpacked.hashindices) {
            unpacked.indices.push(unpacked.hashindices[elements[j]]);
          } else {
            var vertex = elements[j].split("/");
            unpacked.verts.push(+verts[(vertex[0] - 1) * 3 + initOrientation[0]] * inputArg.scale[0]);
            unpacked.verts.push(+verts[(vertex[0] - 1) * 3 + initOrientation[1]] * inputArg.scale[1]);
            unpacked.verts.push(+verts[(vertex[0] - 1) * 3 + initOrientation[2]] * inputArg.scale[2]);
            if (textures.length) {
              unpacked.textures.push(+textures[(vertex[1] - 1) * 2 + 0]);
              unpacked.textures.push(+textures[(vertex[1] - 1) * 2 + 1]);
            }
            unpacked.norms.push(+vertNormals[(vertex[2] - 1) * 3 + 0]);
            unpacked.norms.push(+vertNormals[(vertex[2] - 1) * 3 + 1]);
            unpacked.norms.push(+vertNormals[(vertex[2] - 1) * 3 + 2]);
            unpacked.hashindices[elements[j]] = unpacked.index;
            unpacked.indices.push(unpacked.index);
            unpacked.index += 1;
          }
          if (j === 3 && quad) {
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
};
var Ajax = function() {
  var _this = this;
  this.xmlhttp = new XMLHttpRequest();
  this.get = function(url, callback) {
    _this.xmlhttp.onreadystatechange = function() {
      if (_this.xmlhttp.readyState === 4) {
        callback(_this.xmlhttp.responseText, _this.xmlhttp.status);
      }
    };
    _this.xmlhttp.open("GET", url, true);
    _this.xmlhttp.send();
  };
};
var downloadMeshes = function(nameAndURLs, completionCallback, inputArg) {
  var semaphore = Object.keys(nameAndURLs).length;
  var error = false;
  if (typeof inputArg === "undefined") {
    var inputArg = {
      scale: [1, 1, 1],
      swap: [null]
    };
  }
  if (typeof inputArg.scale === "undefined") inputArg.scale = [1, 1, 1];
  if (typeof inputArg.swap === "undefined") inputArg.swap = [null];
  var meshes = {};
  for (var mesh_name in nameAndURLs) {
    if (nameAndURLs.hasOwnProperty(mesh_name)) {
      new Ajax().get(
        nameAndURLs[mesh_name],
        /* @__PURE__ */ (function(name2) {
          return function(data, status) {
            if (status === 200) {
              meshes[name2] = new constructMesh(data, inputArg);
            } else {
              error = true;
              console.error('An error has occurred and the mesh "' + name2 + '" could not be downloaded.');
            }
            semaphore--;
            if (semaphore === 0) {
              if (error) {
                console.error("An error has occurred and one or meshes has not been downloaded. The execution of the script has terminated.");
                throw "";
              }
              completionCallback(meshes, inputArg.scale);
            }
          };
        })(mesh_name)
      );
    }
  }
};
function play(nameAni) {
  this.animations.active = nameAni;
  this.currentAni = this.animations[this.animations.active].from;
  this.playing = true;
}

// ../../../shaders/vertexShadow.wgsl.js
var vertexShadowWGSL = `
const MAX_BONES = 100u;

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

struct VertexAnimParams {
  time: f32,
  flags: f32,
  globalIntensity: f32,
  _pad0: f32,
  
  // Wave [4-7]
  waveSpeed: f32,
  waveAmplitude: f32,
  waveFrequency: f32,
  _pad1: f32,
  
  // Wind [8-11]
  windSpeed: f32,
  windStrength: f32,
  windHeightInfluence: f32,
  windTurbulence: f32,
  
  // Pulse [12-15]
  pulseSpeed: f32,
  pulseAmount: f32,
  pulseCenterX: f32,
  pulseCenterY: f32,
  
  // Twist [16-19]
  twistSpeed: f32,
  twistAmount: f32,
  _pad2: f32,
  _pad3: f32,
  
  // Noise [20-23]
  noiseScale: f32,
  noiseStrength: f32,
  noiseSpeed: f32,
  _pad4: f32,
  
  // Ocean [24-27]
  oceanWaveScale: f32,
  oceanWaveHeight: f32,
  oceanWaveSpeed: f32,
  _pad5: f32,
  
  // Displacement [28-31]
  displacementStrength: f32,
  displacementSpeed: f32,
  _pad6: f32,
  _pad7: f32,
}

@group(0) @binding(0) var<uniform> scene : Scene;
@group(1) @binding(0) var<uniform> model : Model;
@group(1) @binding(1) var<uniform> bones : Bones;
@group(1) @binding(2) var<uniform> vertexAnim : VertexAnimParams;

const ANIM_WAVE: u32 = 1u;
const ANIM_WIND: u32 = 2u;
const ANIM_PULSE: u32 = 4u;
const ANIM_TWIST: u32 = 8u;
const ANIM_NOISE: u32 = 16u;
const ANIM_OCEAN: u32 = 32u;

struct SkinResult {
  position : vec4f,
  normal   : vec3f,
};

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
    
    return SkinResult(skinnedPos, skinnedNorm);
}

// Hash function for noise
fn hash(p: vec2f) -> f32 {
  var p3 = fract(vec3f(p.x, p.y, p.x) * 0.13);
  p3 += dot(p3, vec3f(p3.y, p3.z, p3.x) + 3.333);
  return fract((p3.x + p3.y) * p3.z);
}

// Noise function
fn noise(p: vec2f) -> f32 {
  let i = floor(p);
  let f = fract(p);
  let u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i + vec2f(0.0, 0.0)), hash(i + vec2f(1.0, 0.0)), u.x),
    mix(hash(i + vec2f(0.0, 1.0)), hash(i + vec2f(1.0, 1.0)), u.x),
    u.y
  );
}

// Wave animation
fn applyWave(pos: vec3f) -> vec3f {
  let wave = sin(pos.x * vertexAnim.waveFrequency + vertexAnim.time * vertexAnim.waveSpeed) * 
             cos(pos.z * vertexAnim.waveFrequency + vertexAnim.time * vertexAnim.waveSpeed);
  return vec3f(pos.x, pos.y + wave * vertexAnim.waveAmplitude, pos.z);
}

// Wind animation
fn applyWind(pos: vec3f, normal: vec3f) -> vec3f {
  let heightFactor = max(0.0, pos.y) * vertexAnim.windHeightInfluence;
  
  let windDir = vec2f(
    sin(vertexAnim.time * vertexAnim.windSpeed),
    cos(vertexAnim.time * vertexAnim.windSpeed * 0.7)
  ) * vertexAnim.windStrength;
  
  let turbulence = noise(vec2f(pos.x, pos.z) * 0.5 + vertexAnim.time * 0.3) 
                   * vertexAnim.windTurbulence;
  
  return vec3f(
    pos.x + windDir.x * heightFactor * (1.0 + turbulence),
    pos.y,
    pos.z + windDir.y * heightFactor * (1.0 + turbulence)
  );
}

// Pulse animation
fn applyPulse(pos: vec3f) -> vec3f {
  let pulse = sin(vertexAnim.time * vertexAnim.pulseSpeed) * vertexAnim.pulseAmount;
  let scale = 1.0 + pulse;
  
  let center = vec3f(vertexAnim.pulseCenterX, 0.0, vertexAnim.pulseCenterY);
  return center + (pos - center) * scale;
}

// Twist animation
fn applyTwist(pos: vec3f) -> vec3f {
  let angle = pos.y * vertexAnim.twistAmount * sin(vertexAnim.time * vertexAnim.twistSpeed);
  
  let cosA = cos(angle);
  let sinA = sin(angle);
  
  return vec3f(
    pos.x * cosA - pos.z * sinA,
    pos.y,
    pos.x * sinA + pos.z * cosA
  );
}

// Noise displacement
fn applyNoiseDisplacement(pos: vec3f) -> vec3f {
  let noiseVal = noise(vec2f(pos.x, pos.z) * vertexAnim.noiseScale 
                      + vertexAnim.time * vertexAnim.noiseSpeed);
  let displacement = (noiseVal - 0.5) * vertexAnim.noiseStrength;
  return vec3f(pos.x, pos.y + displacement, pos.z);
}

// Ocean waves
fn applyOcean(pos: vec3f) -> vec3f {
  let t = vertexAnim.time * vertexAnim.oceanWaveSpeed;
  let scale = vertexAnim.oceanWaveScale;
  
  let wave1 = sin(dot(pos.xz, vec2f(1.0, 0.0)) * scale + t) * vertexAnim.oceanWaveHeight;
  let wave2 = sin(dot(pos.xz, vec2f(0.7, 0.7)) * scale * 1.2 + t * 1.3) * vertexAnim.oceanWaveHeight * 0.7;
  let wave3 = sin(dot(pos.xz, vec2f(0.0, 1.0)) * scale * 0.8 + t * 0.9) * vertexAnim.oceanWaveHeight * 0.5;
  
  return vec3f(pos.x, pos.y + wave1 + wave2 + wave3, pos.z);
}

// Combined vertex animation
fn applyVertexAnimation(pos: vec3f, normal: vec3f) -> SkinResult {
  var animatedPos = pos;
  var animatedNorm = normal;
  
  let flags = u32(vertexAnim.flags);
  
  // Apply effects in order
  if ((flags & ANIM_WAVE) != 0u) {
    animatedPos = applyWave(animatedPos);
  }
  
  if ((flags & ANIM_WIND) != 0u) {
    animatedPos = applyWind(animatedPos, animatedNorm);
  }
  
  if ((flags & ANIM_NOISE) != 0u) {
    animatedPos = applyNoiseDisplacement(animatedPos);
  }
  
  if ((flags & ANIM_OCEAN) != 0u) {
    animatedPos = applyOcean(animatedPos);
  }
  
  if ((flags & ANIM_PULSE) != 0u) {
    animatedPos = applyPulse(animatedPos);
  }
  
  if ((flags & ANIM_TWIST) != 0u) {
    animatedPos = applyTwist(animatedPos);
  }
  
  // Apply global intensity
  animatedPos = mix(pos, animatedPos, vertexAnim.globalIntensity);
  
  // For shadows, we can skip expensive normal recalculation
  // Shadows don't need perfect normals
  
  return SkinResult(vec4f(animatedPos, 1.0), animatedNorm);
}

@vertex
fn main(
  @location(0) position: vec3f,
  @location(1) normal: vec3f,
  @location(2) uv: vec2f,
  @location(3) joints: vec4<u32>,
  @location(4) weights: vec4<f32>
) -> @builtin(position) vec4f {
  var pos = vec4(position, 1.0);
  var nrm = normal;
  
  // Apply skinning
  let skinned = skinVertex(pos, nrm, joints, weights);
  var finalPos = skinned.position.xyz;
  
  // Apply vertex animation if any flags are set
  if (u32(vertexAnim.flags) != 0u && vertexAnim.globalIntensity > 0.0) {
    let animated = applyVertexAnimation(finalPos, skinned.normal);
    finalPos = animated.position.xyz;
  }
  
  let worldPos = model.modelMatrix * vec4f(finalPos, 1.0);
  return scene.lightViewProjMatrix * worldPos;
}
`;

// ../../../engine/behavior.js
var Behavior = class {
  status = "Only oscillator";
  constructor() {
    this.osc0 = new OSCILLATOR(0, 5, 0.01);
  }
  setOsc0(min2, max2, step) {
    this.osc0.min = min2;
    this.osc0.max = max2;
    this.osc0.step = step;
  }
  // apend - keep init origin
  addPath(NUMBER) {
    let inc = this.osc0.UPDATE();
    console.log("test inc", inc);
    console.log("test inc + number", NUMBER + inc);
    return inc + NUMBER;
  }
  setPath0() {
    return this.osc0.UPDATE();
  }
};

// ../../../shaders/instanced/vertexShadow.instanced.wgsl.js
var vertexShadowWGSLInstanced = `
const MAX_BONES = 100u;

struct Scene {
  lightViewProjMatrix:  mat4x4f,
  cameraViewProjMatrix: mat4x4f,
  lightPos:             vec3f,
}

struct InstanceData {
  model: mat4x4<f32>,
};

struct Bones {
  boneMatrices: array<mat4x4f, MAX_BONES>
}

struct VertexAnimParams {
  time:                f32,
  flags:               f32,
  globalIntensity:     f32,
  _pad0:               f32,
  waveSpeed:           f32,
  waveAmplitude:       f32,
  waveFrequency:       f32,
  _pad1:               f32,
  windSpeed:           f32,
  windStrength:        f32,
  windHeightInfluence: f32,
  windTurbulence:      f32,
  pulseSpeed:          f32,
  pulseAmount:         f32,
  pulseCenterX:        f32,
  pulseCenterY:        f32,
  twistSpeed:          f32,
  twistAmount:         f32,
  _pad2:               f32,
  _pad3:               f32,
  noiseScale:          f32,
  noiseStrength:       f32,
  noiseSpeed:          f32,
  _pad4:               f32,
  oceanWaveScale:      f32,
  oceanWaveHeight:     f32,
  oceanWaveSpeed:      f32,
  _pad5:               f32,
  displacementStrength: f32,
  displacementSpeed:   f32,
  _pad6:               f32,
  _pad7:               f32,
}

@group(0) @binding(0) var<uniform>      scene      : Scene;
@group(1) @binding(0) var<storage,read> instances  : array<InstanceData>;
@group(1) @binding(1) var<uniform>      bones      : Bones;
@group(1) @binding(2) var<uniform>      vertexAnim : VertexAnimParams;

const ANIM_WAVE:  u32 = 1u;
const ANIM_WIND:  u32 = 2u;
const ANIM_PULSE: u32 = 4u;
const ANIM_TWIST: u32 = 8u;
const ANIM_NOISE: u32 = 16u;
const ANIM_OCEAN: u32 = 32u;

struct SkinResult {
  position: vec4f,
  normal:   vec3f,
};

fn hash(p: vec2f) -> f32 {
  var p3 = fract(vec3f(p.x, p.y, p.x) * 0.13);
  p3 += dot(p3, vec3f(p3.y, p3.z, p3.x) + 3.333);
  return fract((p3.x + p3.y) * p3.z);
}

fn noise(p: vec2f) -> f32 {
  let i = floor(p);
  let f = fract(p);
  let u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i + vec2f(0.0,0.0)), hash(i + vec2f(1.0,0.0)), u.x),
    mix(hash(i + vec2f(0.0,1.0)), hash(i + vec2f(1.0,1.0)), u.x),
    u.y
  );
}

fn skinVertex(pos: vec4f, nrm: vec3f, joints: vec4<u32>, weights: vec4f) -> SkinResult {
  var skinnedPos  = vec4f(0.0);
  var skinnedNorm = vec3f(0.0);
  for (var i: u32 = 0u; i < 4u; i++) {
    let w = weights[i];
    if (w > 0.0) {
      let boneMat  = bones.boneMatrices[joints[i]];
      skinnedPos  += (boneMat * pos) * w;
      skinnedNorm += (mat3x3f(boneMat[0].xyz, boneMat[1].xyz, boneMat[2].xyz) * nrm) * w;
    }
  }
  return SkinResult(skinnedPos, skinnedNorm);
}

fn applyWave(pos: vec3f) -> vec3f {
  let wave = sin(pos.x * vertexAnim.waveFrequency + vertexAnim.time * vertexAnim.waveSpeed) *
             cos(pos.z * vertexAnim.waveFrequency + vertexAnim.time * vertexAnim.waveSpeed);
  return vec3f(pos.x, pos.y + wave * vertexAnim.waveAmplitude, pos.z);
}

fn applyWind(pos: vec3f, normal: vec3f) -> vec3f {
  let heightFactor = max(0.0, pos.y) * vertexAnim.windHeightInfluence;
  let windDir = vec2f(
    sin(vertexAnim.time * vertexAnim.windSpeed),
    cos(vertexAnim.time * vertexAnim.windSpeed * 0.7)
  ) * vertexAnim.windStrength;
  let turbulence = noise(vec2f(pos.x, pos.z) * 0.5 + vertexAnim.time * 0.3) * vertexAnim.windTurbulence;
  return vec3f(
    pos.x + windDir.x * heightFactor * (1.0 + turbulence),
    pos.y,
    pos.z + windDir.y * heightFactor * (1.0 + turbulence)
  );
}

fn applyPulse(pos: vec3f) -> vec3f {
  let pulse = sin(vertexAnim.time * vertexAnim.pulseSpeed) * vertexAnim.pulseAmount;
  let center = vec3f(vertexAnim.pulseCenterX, 0.0, vertexAnim.pulseCenterY);
  return center + (pos - center) * (1.0 + pulse);
}

fn applyTwist(pos: vec3f) -> vec3f {
  let angle = pos.y * vertexAnim.twistAmount * sin(vertexAnim.time * vertexAnim.twistSpeed);
  let cosA = cos(angle); let sinA = sin(angle);
  return vec3f(pos.x * cosA - pos.z * sinA, pos.y, pos.x * sinA + pos.z * cosA);
}

fn applyNoiseDisplacement(pos: vec3f) -> vec3f {
  let noiseVal = noise(vec2f(pos.x, pos.z) * vertexAnim.noiseScale + vertexAnim.time * vertexAnim.noiseSpeed);
  return vec3f(pos.x, pos.y + (noiseVal - 0.5) * vertexAnim.noiseStrength, pos.z);
}

fn applyOcean(pos: vec3f) -> vec3f {
  let t = vertexAnim.time * vertexAnim.oceanWaveSpeed;
  let s = vertexAnim.oceanWaveScale;
  let w1 = sin(dot(pos.xz, vec2f(1.0, 0.0)) * s + t)           * vertexAnim.oceanWaveHeight;
  let w2 = sin(dot(pos.xz, vec2f(0.7, 0.7)) * s * 1.2 + t*1.3) * vertexAnim.oceanWaveHeight * 0.7;
  let w3 = sin(dot(pos.xz, vec2f(0.0, 1.0)) * s * 0.8 + t*0.9) * vertexAnim.oceanWaveHeight * 0.5;
  return vec3f(pos.x, pos.y + w1 + w2 + w3, pos.z);
}

fn applyVertexAnimation(pos: vec3f, normal: vec3f) -> SkinResult {
  var p = pos;
  let flags = u32(vertexAnim.flags);
  if ((flags & ANIM_WAVE)  != 0u) { p = applyWave(p); }
  if ((flags & ANIM_WIND)  != 0u) { p = applyWind(p, normal); }
  if ((flags & ANIM_NOISE) != 0u) { p = applyNoiseDisplacement(p); }
  if ((flags & ANIM_OCEAN) != 0u) { p = applyOcean(p); }
  if ((flags & ANIM_PULSE) != 0u) { p = applyPulse(p); }
  if ((flags & ANIM_TWIST) != 0u) { p = applyTwist(p); }
  p = mix(pos, p, vertexAnim.globalIntensity);
  return SkinResult(vec4f(p, 1.0), normal);
}

@vertex
fn main(
  @location(0) position: vec3f,
  @location(1) normal:   vec3f,
  @location(2) uv:       vec2f,
  @location(3) joints:   vec4<u32>,
  @location(4) weights:  vec4<f32>,
  @builtin(instance_index) instId: u32
) -> @builtin(position) vec4f {

  // Skinning
  let skinned  = skinVertex(vec4f(position, 1.0), normal, joints, weights);
  var finalPos = skinned.position.xyz;

  // Vertex animation
  if (u32(vertexAnim.flags) != 0u && vertexAnim.globalIntensity > 0.0) {
    let animated = applyVertexAnimation(finalPos, skinned.normal);
    finalPos = animated.position.xyz;
  }

  // Per-instance model matrix from storage buffer
  let worldPos = instances[instId].model * vec4f(finalPos, 1.0);
  return scene.lightViewProjMatrix * worldPos;
}
`;

// ../../../engine/lights.js
var SpotLight = class {
  name;
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
  constructor(camera, inputHandler, device2, indexx, position = vec3Impl.create(0, 10, -20), target = vec3Impl.create(0, 0, -20), fov = 45, aspect = 1, near = 0.1, far = 200) {
    aspect = 1;
    this.name = "light" + indexx;
    this.getName = () => {
      return "light" + indexx;
    };
    this.fov = fov;
    this.aspect = 1;
    this.near = near;
    this.far = far;
    this.camera = camera;
    this.inputHandler = inputHandler;
    this.position = position;
    this.target = target;
    this.up = vec3Impl.create(0, 0, -1);
    this.direction = vec3Impl.normalize(vec3Impl.subtract(target, position));
    this.intensity = 1;
    this.color = vec3Impl.create(1, 1, 1);
    this.viewMatrix = mat4Impl.lookAt(position, target, this.up);
    this.projectionMatrix = mat4Impl.perspective(
      this.fov * Math.PI / 180,
      this.aspect,
      this.near,
      this.far
    );
    this.setProjection = function(fov2 = 2 * Math.PI / 5, aspect2 = 1, near2 = 0.1, far2 = 200) {
      this.projectionMatrix = mat4Impl.perspective(fov2, aspect2, near2, far2);
    };
    this.updateProjection = function() {
      this.projectionMatrix = mat4Impl.perspective(this.fov, this.aspect, this.near, this.far);
    };
    this.device = device2;
    this.viewProjMatrix = mat4Impl.multiply(this.projectionMatrix, this.viewMatrix);
    this.fov = fov;
    this.aspect = aspect;
    this.near = near;
    this.far = far;
    this.innerCutoff = Math.cos(Math.PI / 180 * 20);
    this.outerCutoff = Math.cos(Math.PI / 180 * 30);
    this.ambientFactor = 0.5;
    this.range = 20;
    this.shadowBias = 0.01;
    this.SHADOW_RES = 1024;
    this.primitive = {
      topology: "triangle-list",
      cullMode: "back",
      // for front interest border drawen shadows !
      frontFace: "ccw"
    };
    this.shadowTexture = this.device.createTexture({
      label: "shadowTexture[light]",
      size: [this.SHADOW_RES, this.SHADOW_RES, 1],
      format: "depth32float",
      usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING
    });
    this.shadowSampler = device2.createSampler({
      label: "shadowSampler[light]",
      compare: "less",
      magFilter: "linear",
      minFilter: "linear"
    });
    this.renderPassDescriptor = {
      label: "descriptor shadowPass[SpotLigth]",
      colorAttachments: [],
      depthStencilAttachment: {
        view: this.shadowTexture.createView(),
        depthClearValue: 1,
        depthLoadOp: "clear",
        depthStoreOp: "store"
      }
    };
    this.uniformBufferBindGroupLayout = this.device.createBindGroupLayout({
      label: "uniformBufferBindGroupLayout light",
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.VERTEX,
          buffer: {
            type: "uniform"
          }
        }
      ]
    });
    this.shadowBindGroupContainer = [];
    this.shadowBindGroup = [];
    this.getShadowBindGroup = (mesh, index) => {
      if (this.shadowBindGroupContainer[index]) {
        return this.shadowBindGroupContainer[index];
      }
      this.shadowBindGroupContainer[index] = this.device.createBindGroup({
        label: "sceneBindGroupForShadow light",
        layout: this.uniformBufferBindGroupLayout,
        entries: [
          {
            binding: 0,
            resource: {
              buffer: mesh.sceneUniformBuffer
            }
          }
        ]
      });
      return this.shadowBindGroupContainer[index];
    };
    this.getShadowBindGroup_bones = (index) => {
      if (this.shadowBindGroup[index]) return this.shadowBindGroup[index];
      this.modelUniformBuffer = this.device.createBuffer({
        size: 4 * 16,
        // 4x4 matrix
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
      });
      this.shadowBindGroup[index] = this.device.createBindGroup({
        label: "model BindGroupForShadow in light",
        layout: this.uniformBufferBindGroupLayout,
        entries: [
          {
            binding: 0,
            resource: {
              buffer: this.modelUniformBuffer
            }
          }
        ]
      });
      return this.shadowBindGroup[index];
    };
    this.modelBindGroupLayout = this.device.createBindGroupLayout({
      label: "modelBindGroupLayout light [one bindings]",
      entries: [
        { binding: 0, visibility: GPUShaderStage.VERTEX, buffer: { type: "uniform" } },
        { binding: 1, visibility: GPUShaderStage.VERTEX, buffer: { type: "uniform" } },
        { binding: 2, visibility: GPUShaderStage.VERTEX, buffer: { type: "uniform" } }
      ]
    });
    this.modelBindGroupLayoutInstanced = this.device.createBindGroupLayout({
      label: "modelBindGroupLayout light [skinned][instanced]",
      entries: [
        { binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: { type: "read-only-storage" } },
        { binding: 1, visibility: GPUShaderStage.VERTEX, buffer: { type: "uniform" } },
        { binding: 2, visibility: GPUShaderStage.VERTEX, buffer: { type: "uniform" } }
      ]
    });
    this.shadowPipeline = this.device.createRenderPipeline({
      label: "shadowPipeline light",
      layout: this.device.createPipelineLayout({
        label: "uniformBufferBindGroupLayout light[regular]",
        bindGroupLayouts: [
          this.uniformBufferBindGroupLayout,
          this.modelBindGroupLayout
        ]
      }),
      vertex: {
        module: this.device.createShaderModule({
          code: vertexShadowWGSL
        }),
        buffers: [
          {
            arrayStride: 12,
            attributes: [
              {
                shaderLocation: 0,
                offset: 0,
                format: "float32x3"
              }
            ]
          },
          // ✅ ADD @location(1) - normal
          {
            arrayStride: 12,
            attributes: [
              {
                shaderLocation: 1,
                offset: 0,
                format: "float32x3"
              }
            ]
          },
          // ✅ ADD @location(2) - uv
          {
            arrayStride: 8,
            attributes: [
              {
                shaderLocation: 2,
                offset: 0,
                format: "float32x2"
              }
            ]
          },
          // ✅ ADD @location(3) - joints
          {
            arrayStride: 16,
            attributes: [
              {
                shaderLocation: 3,
                offset: 0,
                format: "uint32x4"
              }
            ]
          },
          // ✅ ADD @location(4) - weights
          {
            arrayStride: 16,
            attributes: [
              {
                shaderLocation: 4,
                offset: 0,
                format: "float32x4"
              }
            ]
          }
        ]
      },
      depthStencil: {
        depthWriteEnabled: true,
        depthCompare: "less",
        format: "depth32float"
      },
      primitive: this.primitive
    });
    this.shadowPipelineInstanced = this.device.createRenderPipeline({
      label: "shadowPipeline [instanced]light",
      layout: this.device.createPipelineLayout({
        label: "uniformBufferBindGroupLayout light[instanced]",
        bindGroupLayouts: [
          this.uniformBufferBindGroupLayout,
          this.modelBindGroupLayoutInstanced
        ]
      }),
      vertex: {
        module: this.device.createShaderModule({
          code: vertexShadowWGSLInstanced
        }),
        buffers: [
          {
            arrayStride: 12,
            // 3 * 4 bytes (vec3f)
            attributes: [
              {
                shaderLocation: 0,
                // must match @location(0) in vertex shader
                offset: 0,
                format: "float32x3"
              }
            ]
          },
          // ✅ ADD @location(1) - normal
          {
            arrayStride: 12,
            attributes: [
              {
                shaderLocation: 1,
                offset: 0,
                format: "float32x3"
              }
            ]
          },
          // ✅ ADD @location(2) - uv
          {
            arrayStride: 8,
            attributes: [
              {
                shaderLocation: 2,
                offset: 0,
                format: "float32x2"
              }
            ]
          },
          // ✅ ADD @location(3) - joints
          {
            arrayStride: 16,
            attributes: [
              {
                shaderLocation: 3,
                offset: 0,
                format: "uint32x4"
              }
            ]
          },
          // ✅ ADD @location(4) - weights
          {
            arrayStride: 16,
            attributes: [
              {
                shaderLocation: 4,
                offset: 0,
                format: "float32x4"
              }
            ]
          }
        ]
      },
      depthStencil: {
        depthWriteEnabled: true,
        depthCompare: "less",
        depthBias: 2,
        // Constant bias (try 1-4)
        depthBiasSlopeScale: 2,
        format: "depth32float"
      },
      primitive: this.primitive
    });
    this.getMainPassBindGroup = function(mesh) {
      if (!this.mainPassBindGroupContainer) this.mainPassBindGroupContainer = [];
      const index = mesh._lightBindGroupIndex || 0;
      if (this.mainPassBindGroupContainer[index]) {
        return this.mainPassBindGroupContainer[index];
      }
      this.mainPassBindGroupContainer[index] = this.device.createBindGroup({
        label: `mainPassBindGroup for mesh`,
        layout: mesh.mainPassBindGroupLayout,
        entries: [
          {
            binding: 0,
            resource: this.shadowTexture.createView()
          },
          {
            binding: 1,
            resource: this.shadowSampler
          }
        ]
      });
      return this.mainPassBindGroupContainer[index];
    };
    this.behavior = new Behavior();
    this.updater = [];
  }
  update() {
    this.updater.forEach((update) => {
      update(this);
    });
    this.direction = vec3Impl.normalize(vec3Impl.subtract(this.target, this.position));
    const target = vec3Impl.add(this.position, this.direction);
    this.viewMatrix = mat4Impl.lookAt(this.position, target, this.up);
    this.viewProjMatrix = mat4Impl.multiply(this.projectionMatrix, this.viewMatrix);
  }
  getLightDataBuffer() {
    const m = this.viewProjMatrix;
    return new Float32Array([
      ...this.position,
      0,
      ...this.direction,
      0,
      this.innerCutoff,
      this.outerCutoff,
      this.intensity,
      0,
      ...this.color,
      0,
      this.range,
      this.ambientFactor,
      this.shadowBias,
      0,
      ...m
    ]);
  }
  // Setters
  setPosX = (x2) => {
    this.position[0] = x2;
  };
  setPosY = (y2) => {
    this.position[1] = y2;
  };
  setPosZ = (z) => {
    this.position[2] = z;
  };
  setInnerCutoff = (innerCutoff) => {
    this.innerCutoff = innerCutoff;
  };
  setOuterCutoff = (outerCutoff) => {
    this.outerCutoff = outerCutoff;
  };
  setIntensity = (intensity) => {
    this.intensity = intensity;
  };
  setColor = (color) => {
    this.color = color;
  };
  setColorR = (colorR) => {
    this.color[0] = colorR;
  };
  setColorB = (colorB) => {
    this.color[1] = colorB;
  };
  setColorG = (colorG) => {
    this.color[2] = colorG;
  };
  setRange = (range) => {
    this.range = range;
  };
  setAmbientFactor = (ambientFactor) => {
    this.ambientFactor = ambientFactor;
  };
  setShadowBias = (shadowBias) => {
    this.shadowBias = shadowBias;
  };
};

// ../../../../node_modules/webgpu-matrix/dist/1.x/wgpu-matrix.module.js
var EPSILON2 = 1e-6;
var ctorMap2 = /* @__PURE__ */ new Map([
  [Float32Array, () => new Float32Array(12)],
  [Float64Array, () => new Float64Array(12)],
  [Array, () => new Array(12).fill(0)]
]);
var newMat32 = ctorMap2.get(Float32Array);
var VecType$12 = Float32Array;
function create$22(x2, y2, z) {
  const dst = new VecType$12(3);
  if (x2 !== void 0) {
    dst[0] = x2;
    if (y2 !== void 0) {
      dst[1] = y2;
      if (z !== void 0) {
        dst[2] = z;
      }
    }
  }
  return dst;
}
function subtract$12(a, b, dst) {
  dst = dst || new VecType$12(3);
  dst[0] = a[0] - b[0];
  dst[1] = a[1] - b[1];
  dst[2] = a[2] - b[2];
  return dst;
}
function cross2(a, b, dst) {
  dst = dst || new VecType$12(3);
  const t1 = a[2] * b[0] - a[0] * b[2];
  const t2 = a[0] * b[1] - a[1] * b[0];
  dst[0] = a[1] * b[2] - a[2] * b[1];
  dst[1] = t1;
  dst[2] = t2;
  return dst;
}
function normalize$12(v, dst) {
  dst = dst || new VecType$12(3);
  const v0 = v[0];
  const v1 = v[1];
  const v2 = v[2];
  const len2 = Math.sqrt(v0 * v0 + v1 * v1 + v2 * v2);
  if (len2 > 1e-5) {
    dst[0] = v0 / len2;
    dst[1] = v1 / len2;
    dst[2] = v2 / len2;
  } else {
    dst[0] = 0;
    dst[1] = 0;
    dst[2] = 0;
  }
  return dst;
}
var MatType2 = Float32Array;
function setDefaultType$22(ctor) {
  const oldType = MatType2;
  MatType2 = ctor;
  return oldType;
}
function create$12(v0, v1, v2, v3, v4, v5, v6, v7, v8, v9, v10, v11, v12, v13, v14, v15) {
  const dst = new MatType2(16);
  if (v0 !== void 0) {
    dst[0] = v0;
    if (v1 !== void 0) {
      dst[1] = v1;
      if (v2 !== void 0) {
        dst[2] = v2;
        if (v3 !== void 0) {
          dst[3] = v3;
          if (v4 !== void 0) {
            dst[4] = v4;
            if (v5 !== void 0) {
              dst[5] = v5;
              if (v6 !== void 0) {
                dst[6] = v6;
                if (v7 !== void 0) {
                  dst[7] = v7;
                  if (v8 !== void 0) {
                    dst[8] = v8;
                    if (v9 !== void 0) {
                      dst[9] = v9;
                      if (v10 !== void 0) {
                        dst[10] = v10;
                        if (v11 !== void 0) {
                          dst[11] = v11;
                          if (v12 !== void 0) {
                            dst[12] = v12;
                            if (v13 !== void 0) {
                              dst[13] = v13;
                              if (v14 !== void 0) {
                                dst[14] = v14;
                                if (v15 !== void 0) {
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
function negate$12(m, dst) {
  dst = dst || new MatType2(16);
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
function copy$12(m, dst) {
  dst = dst || new MatType2(16);
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
var clone$12 = copy$12;
function equalsApproximately$12(a, b) {
  return Math.abs(a[0] - b[0]) < EPSILON2 && Math.abs(a[1] - b[1]) < EPSILON2 && Math.abs(a[2] - b[2]) < EPSILON2 && Math.abs(a[3] - b[3]) < EPSILON2 && Math.abs(a[4] - b[4]) < EPSILON2 && Math.abs(a[5] - b[5]) < EPSILON2 && Math.abs(a[6] - b[6]) < EPSILON2 && Math.abs(a[7] - b[7]) < EPSILON2 && Math.abs(a[8] - b[8]) < EPSILON2 && Math.abs(a[9] - b[9]) < EPSILON2 && Math.abs(a[10] - b[10]) < EPSILON2 && Math.abs(a[11] - b[11]) < EPSILON2 && Math.abs(a[12] - b[12]) < EPSILON2 && Math.abs(a[13] - b[13]) < EPSILON2 && Math.abs(a[14] - b[14]) < EPSILON2 && Math.abs(a[15] - b[15]) < EPSILON2;
}
function equals$12(a, b) {
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3] && a[4] === b[4] && a[5] === b[5] && a[6] === b[6] && a[7] === b[7] && a[8] === b[8] && a[9] === b[9] && a[10] === b[10] && a[11] === b[11] && a[12] === b[12] && a[13] === b[13] && a[14] === b[14] && a[15] === b[15];
}
function identity2(dst) {
  dst = dst || new MatType2(16);
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
function transpose2(m, dst) {
  dst = dst || new MatType2(16);
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
function inverse$12(m, dst) {
  dst = dst || new MatType2(16);
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
function determinant2(m) {
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
var invert$12 = inverse$12;
function multiply$12(a, b, dst) {
  dst = dst || new MatType2(16);
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
var mul$12 = multiply$12;
function setTranslation2(a, v, dst) {
  dst = dst || identity2();
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
function getTranslation2(m, dst) {
  dst = dst || create$22();
  dst[0] = m[12];
  dst[1] = m[13];
  dst[2] = m[14];
  return dst;
}
function getAxis2(m, axis, dst) {
  dst = dst || create$22();
  const off = axis * 4;
  dst[0] = m[off + 0];
  dst[1] = m[off + 1];
  dst[2] = m[off + 2];
  return dst;
}
function setAxis2(a, v, axis, dst) {
  if (dst !== a) {
    dst = copy$12(a, dst);
  }
  const off = axis * 4;
  dst[off + 0] = v[0];
  dst[off + 1] = v[1];
  dst[off + 2] = v[2];
  return dst;
}
function getScaling2(m, dst) {
  dst = dst || create$22();
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
function perspective2(fieldOfViewYInRadians, aspect, zNear, zFar, dst) {
  dst = dst || new MatType2(16);
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
function ortho2(left2, right2, bottom, top, near, far, dst) {
  dst = dst || new MatType2(16);
  dst[0] = 2 / (right2 - left2);
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
  dst[12] = (right2 + left2) / (left2 - right2);
  dst[13] = (top + bottom) / (bottom - top);
  dst[14] = near / (near - far);
  dst[15] = 1;
  return dst;
}
function frustum2(left2, right2, bottom, top, near, far, dst) {
  dst = dst || new MatType2(16);
  const dx = right2 - left2;
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
  dst[8] = (left2 + right2) / dx;
  dst[9] = (top + bottom) / dy;
  dst[10] = far / dz;
  dst[11] = -1;
  dst[12] = 0;
  dst[13] = 0;
  dst[14] = near * far / dz;
  dst[15] = 0;
  return dst;
}
var xAxis2;
var yAxis2;
var zAxis2;
function lookAt2(eye, target, up, dst) {
  dst = dst || new MatType2(16);
  xAxis2 = xAxis2 || create$22();
  yAxis2 = yAxis2 || create$22();
  zAxis2 = zAxis2 || create$22();
  normalize$12(subtract$12(eye, target, zAxis2), zAxis2);
  normalize$12(cross2(up, zAxis2, xAxis2), xAxis2);
  normalize$12(cross2(zAxis2, xAxis2, yAxis2), yAxis2);
  dst[0] = xAxis2[0];
  dst[1] = xAxis2[1];
  dst[2] = xAxis2[2];
  dst[3] = 0;
  dst[4] = yAxis2[0];
  dst[5] = yAxis2[1];
  dst[6] = yAxis2[2];
  dst[7] = 0;
  dst[8] = zAxis2[0];
  dst[9] = zAxis2[1];
  dst[10] = zAxis2[2];
  dst[11] = 0;
  dst[12] = eye[0];
  dst[13] = eye[1];
  dst[14] = eye[2];
  dst[15] = 1;
  return dst;
}
function translation2(v, dst) {
  dst = dst || new MatType2(16);
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
function translate2(m, v, dst) {
  dst = dst || new MatType2(16);
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
function rotationX2(angleInRadians, dst) {
  dst = dst || new MatType2(16);
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
function rotateX2(m, angleInRadians, dst) {
  dst = dst || new MatType2(16);
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
function rotationY2(angleInRadians, dst) {
  dst = dst || new MatType2(16);
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
function rotateY2(m, angleInRadians, dst) {
  dst = dst || new MatType2(16);
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
function rotationZ2(angleInRadians, dst) {
  dst = dst || new MatType2(16);
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
function rotateZ2(m, angleInRadians, dst) {
  dst = dst || new MatType2(16);
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
function axisRotation2(axis, angleInRadians, dst) {
  dst = dst || new MatType2(16);
  let x2 = axis[0];
  let y2 = axis[1];
  let z = axis[2];
  const n2 = Math.sqrt(x2 * x2 + y2 * y2 + z * z);
  x2 /= n2;
  y2 /= n2;
  z /= n2;
  const xx = x2 * x2;
  const yy = y2 * y2;
  const zz = z * z;
  const c = Math.cos(angleInRadians);
  const s = Math.sin(angleInRadians);
  const oneMinusCosine = 1 - c;
  dst[0] = xx + (1 - xx) * c;
  dst[1] = x2 * y2 * oneMinusCosine + z * s;
  dst[2] = x2 * z * oneMinusCosine - y2 * s;
  dst[3] = 0;
  dst[4] = x2 * y2 * oneMinusCosine - z * s;
  dst[5] = yy + (1 - yy) * c;
  dst[6] = y2 * z * oneMinusCosine + x2 * s;
  dst[7] = 0;
  dst[8] = x2 * z * oneMinusCosine + y2 * s;
  dst[9] = y2 * z * oneMinusCosine - x2 * s;
  dst[10] = zz + (1 - zz) * c;
  dst[11] = 0;
  dst[12] = 0;
  dst[13] = 0;
  dst[14] = 0;
  dst[15] = 1;
  return dst;
}
var rotation2 = axisRotation2;
function axisRotate2(m, axis, angleInRadians, dst) {
  dst = dst || new MatType2(16);
  let x2 = axis[0];
  let y2 = axis[1];
  let z = axis[2];
  const n2 = Math.sqrt(x2 * x2 + y2 * y2 + z * z);
  x2 /= n2;
  y2 /= n2;
  z /= n2;
  const xx = x2 * x2;
  const yy = y2 * y2;
  const zz = z * z;
  const c = Math.cos(angleInRadians);
  const s = Math.sin(angleInRadians);
  const oneMinusCosine = 1 - c;
  const r00 = xx + (1 - xx) * c;
  const r01 = x2 * y2 * oneMinusCosine + z * s;
  const r02 = x2 * z * oneMinusCosine - y2 * s;
  const r10 = x2 * y2 * oneMinusCosine - z * s;
  const r11 = yy + (1 - yy) * c;
  const r12 = y2 * z * oneMinusCosine + x2 * s;
  const r20 = x2 * z * oneMinusCosine + y2 * s;
  const r21 = y2 * z * oneMinusCosine - x2 * s;
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
var rotate3 = axisRotate2;
function scaling2(v, dst) {
  dst = dst || new MatType2(16);
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
function scale$12(m, v, dst) {
  dst = dst || new MatType2(16);
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
var mat4Impl2 = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  setDefaultType: setDefaultType$22,
  create: create$12,
  negate: negate$12,
  copy: copy$12,
  clone: clone$12,
  equalsApproximately: equalsApproximately$12,
  equals: equals$12,
  identity: identity2,
  transpose: transpose2,
  inverse: inverse$12,
  determinant: determinant2,
  invert: invert$12,
  multiply: multiply$12,
  mul: mul$12,
  setTranslation: setTranslation2,
  getTranslation: getTranslation2,
  getAxis: getAxis2,
  setAxis: setAxis2,
  getScaling: getScaling2,
  perspective: perspective2,
  ortho: ortho2,
  frustum: frustum2,
  lookAt: lookAt2,
  translation: translation2,
  translate: translate2,
  rotationX: rotationX2,
  rotateX: rotateX2,
  rotationY: rotationY2,
  rotateY: rotateY2,
  rotationZ: rotationZ2,
  rotateZ: rotateZ2,
  axisRotation: axisRotation2,
  rotation: rotation2,
  axisRotate: axisRotate2,
  rotate: rotate3,
  scaling: scaling2,
  scale: scale$12
});

// ../../../../node_modules/bvh-loader/module/bvh-loader.js
function degToRad2(degrees) {
  return degrees * Math.PI / 180;
}
function arraySum3(a, b) {
  var rez1 = a[0] + b[0];
  var rez2 = a[1] + b[1];
  var rez3 = a[2] + b[2];
  return [rez1, rez2, rez3];
}
function npdeg2rad(degrees) {
  return [
    degrees[0] * (Math.PI / 180),
    degrees[1] * (Math.PI / 180),
    degrees[2] * (Math.PI / 180)
  ];
}
function byId2(id2) {
  return document.getElementById(id2);
}
function dot3vs1(a, b) {
  var aNumRows = a.length, aNumCols = a[0].length, bNumRows = b.length;
  var REZ1 = 0, REZ2 = 0, REZ3 = 0;
  if (aNumRows == 3 && aNumCols == 3 && bNumRows == 3) {
    for (var j = 0; j < a.length; j++) {
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
function multiply2(a, b) {
  var aNumRows = a.length, aNumCols = a[0].length, bNumRows = b.length, bNumCols = b[0].length, m = new Array(aNumRows);
  for (var r2 = 0; r2 < aNumRows; ++r2) {
    m[r2] = new Array(bNumCols);
    for (var c = 0; c < bNumCols; ++c) {
      m[r2][c] = 0;
      for (var i = 0; i < aNumCols; ++i) {
        m[r2][c] += a[r2][i] * b[i][c];
      }
    }
  }
  return m;
}
var _AXES2TUPLE = {
  "sxyz": [0, 0, 0, 0],
  "sxyx": [0, 0, 1, 0],
  "sxzy": [0, 1, 0, 0],
  "sxzx": [0, 1, 1, 0],
  "syzx": [1, 0, 0, 0],
  "syzy": [1, 0, 1, 0],
  "syxz": [1, 1, 0, 0],
  "syxy": [1, 1, 1, 0],
  "szxy": [2, 0, 0, 0],
  "szxz": [2, 0, 1, 0],
  "szyx": [2, 1, 0, 0],
  "szyz": [2, 1, 1, 0],
  "rzyx": [0, 0, 0, 1],
  "rxyx": [0, 0, 1, 1],
  "ryzx": [0, 1, 0, 1],
  "rxzx": [0, 1, 1, 1],
  "rxzy": [1, 0, 0, 1],
  "ryzy": [1, 0, 1, 1],
  "rzxy": [1, 1, 0, 1],
  "ryxy": [1, 1, 1, 1],
  "ryxz": [2, 0, 0, 1],
  "rzxz": [2, 0, 1, 1],
  "rxyz": [2, 1, 0, 1],
  "rzyz": [2, 1, 1, 1]
};
var _NEXT_AXIS = [1, 2, 0, 1];
function euler2mat(ai, aj, ak, axes) {
  if (typeof axes === "undefined") var axes = "sxyz";
  try {
    var firstaxis = _AXES2TUPLE[axes][0], parity = _AXES2TUPLE[axes][1], repetition = _AXES2TUPLE[axes][2], frame = _AXES2TUPLE[axes][3];
  } catch (AttributeError) {
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
  var M = [
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1]
  ];
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
    roll = roll * 180 / Math.PI;
    pitch = pitch * 180 / Math.PI;
    yaw = yaw * 180 / Math.PI;
  }
  return [roll, pitch, yaw];
}
var MEBvhJoint = class {
  constructor(name2, parent) {
    this.name = name2;
    this.parent = parent;
    this.offset = [
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0]
    ];
    this.channels = [];
    this.children = [];
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
    return new Float32Array([
      1,
      0,
      0,
      0,
      0,
      1,
      0,
      0,
      0,
      0,
      1,
      0,
      0,
      0,
      0,
      1
    ]);
  }
  matrixFromKeyframe(frameData) {
    const m = this.createIdentityMatrix();
    let t = [0, 0, 0];
    let r2 = [0, 0, 0];
    for (let i = 0; i < this.channels.length; i++) {
      const channel = this.channels[i];
      const value = frameData[this.channelOffset + i];
      switch (channel) {
        case "Xposition":
          t[0] = value;
          break;
        case "Yposition":
          t[1] = value;
          break;
        case "Zposition":
          t[2] = value;
          break;
        case "Xrotation":
          r2[0] = degToRad2(value);
          break;
        case "Yrotation":
          r2[1] = degToRad2(value);
          break;
        case "Zrotation":
          r2[2] = degToRad2(value);
          break;
      }
    }
    mat4Impl2.translate(m, t, m);
    mat4Impl2.rotateX(m, r2[0], m);
    mat4Impl2.rotateY(m, r2[1], m);
    mat4Impl2.rotateZ(m, r2[2], m);
    return m;
  }
};
var MEBvh = class {
  constructor() {
    this.joints = {};
    this.root = null;
    this.keyframes = null;
    this.frames = 0;
    this.fps = 0;
    this.myName = "MATRIX-ENGINE-BVH";
    this.jointOrder = [];
  }
  computeJointOrder() {
    this.jointOrder = [];
    const traverse = (joint) => {
      this.jointOrder.push(joint.name);
      for (const child of joint.children) {
        traverse(child);
      }
    };
    traverse(this.root);
  }
  computeChannelOffsets() {
    let offset = 0;
    const walk = (joint) => {
      joint.channelOffset = offset;
      offset += joint.channels.length;
      for (const child of joint.children) {
        walk(child);
      }
    };
    if (this.root) walk(this.root);
    this.totalChannels = offset;
  }
  async parse_file(link) {
    return new Promise((resolve, reject) => {
      fetch(link).then((event) => {
        event.text().then((text) => {
          var hierarchy = text.split("MOTION")[0];
          var motion = text.split("MOTION")[1];
          var newLog = document.createElement("div");
          newLog.innerHTML += "<h2>Hierarchy</h2>";
          newLog.innerHTML += "<p>" + hierarchy + "</p>";
          var newLog2 = document.createElement("span");
          newLog2.innerHTML += "<h2>Motion</h2>";
          newLog2.innerHTML += '<p class="paragraf fixHeight" >' + motion + "</p>";
          if (byId2 && byId2("log") !== null) {
            byId2("log").appendChild(newLog2);
            byId2("log").appendChild(newLog);
          }
          this._parse_hierarchy(hierarchy);
          this.computeJointOrder();
          this.computeChannelOffsets();
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
          joint_stack[joint_stack.length - 1].offset[j - 1] = parseFloat(
            words[j]
          );
        }
      } else if (instruction == "End") {
        var joint = new MEBvhJoint(
          joint_stack[joint_stack.length - 1].name + "_end",
          joint_stack[joint_stack.length - 1]
        );
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
    newLog1.innerHTML += "<h2>add_pose_recursive</h2>";
    newLog1.innerHTML += '<p class="paragraf" >Joint Name: ' + joint.name + "</p>";
    newLog1.innerHTML += "<p>joint.parent    : " + (joint.parent != null ? joint.parent.name : "null") + "</p>";
    newLog1.innerHTML += "<p>joint.offset    : " + joint.offset + "</p>";
    newLog1.innerHTML += "<p>joint.children.length  : " + joint.children.length + "</p>";
    joint.children.length != 0 ? newLog1.innerHTML += "<p> Childrens: " : newLog1.innerHTML += "No Childrens ";
    joint.children.forEach((iJoint) => {
      newLog1.innerHTML += " " + iJoint["name"] + " , ";
    });
    newLog1.innerHTML += "</p>";
    newLog1.innerHTML += "<p>Argument offset : " + offset + "</p>";
    byId2("log").appendChild(newLog1);
    var pose = arraySum3(joint.offset, offset);
    poses.push(pose);
    for (var c in joint.children) {
      this._add_pose_recursive(joint.children[c], pose, poses);
    }
  }
  plot_hierarchy() {
    var poses = [];
    this._add_pose_recursive(this.root, [0, 0, 0], poses);
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
    var local_rotation = [0, 0, 0], M_rotation;
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
      }
      index_offset += 1;
    }
    local_rotation = npdeg2rad(local_rotation);
    M_rotation = [
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1]
    ];
    for (key in joint.channels) {
      var channel = joint.channels[key];
      if (channel.endsWith("position")) {
        continue;
      }
      var euler_rot;
      if (channel == "Xrotation") {
        euler_rot = [local_rotation[0], 0, 0];
      } else if (channel == "Yrotation") {
        euler_rot = [0, local_rotation[1], 0];
      } else if (channel == "Zrotation") {
        euler_rot = [0, 0, local_rotation[2]];
      } else {
        console.warn("Unknown channel {channel}");
      }
      var M_channel = euler2mat(euler_rot[0], euler_rot[1], euler_rot[2], euler_rot[3]);
      var M_rotation = multiply2(M_rotation, M_channel);
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
      }
      index_offset += 1;
    }
    return [offset_position, index_offset];
  }
  _recursive_apply_frame(joint, frame_pose, index_offset, p, r2, M_parent, p_parent) {
    var joint_index;
    if (joint.position_animated()) {
      var local = this._extract_position(joint, frame_pose, index_offset);
      var offset_position = local[0], index_offset = local[1];
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
      r2[joint_index] = mat2euler(M_parent);
      return index_offset;
    }
    if (joint.rotation_animated()) {
      var local2 = this._extract_rotation(frame_pose, index_offset, joint);
      var M_rotation = local2[0];
      index_offset = local2[1];
    } else {
      var M_rotation = [
        [1, 0, 0],
        [0, 1, 0],
        [0, 0, 1]
      ];
    }
    var M = multiply2(M_parent, M_rotation);
    var position = arraySum3(p_parent, dot3vs1(M_parent, joint.offset));
    position = arraySum3(position, offset_position);
    var rotation3 = mat2euler(M, "rad2deg");
    var local = 0;
    for (const item2 in this.joints) {
      if (joint.name == item2) {
        joint_index = local;
      }
      local++;
    }
    p[joint_index] = position;
    r2[joint_index] = rotation3;
    for (var c in joint.children) {
      index_offset = this._recursive_apply_frame(
        joint.children[c],
        frame_pose,
        index_offset,
        p,
        r2,
        M,
        position
      );
    }
    return index_offset;
  }
  frame_pose(frame) {
    var jointLength = 0;
    for (var x2 in this.joints) {
      jointLength++;
    }
    var p = Array.from(Array(jointLength), () => [0, 0, 0]);
    var r2 = Array.from(Array(jointLength), () => [0, 0, 0]);
    var frame_pose = this.keyframes[frame];
    var M_parent = [
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0]
    ];
    M_parent[0][0] = 1;
    M_parent[1][1] = 1;
    M_parent[2][2] = 1;
    this._recursive_apply_frame(
      this.root,
      frame_pose,
      0,
      p,
      r2,
      M_parent,
      [0, 0, 0]
    );
    return [p, r2];
  }
  all_frame_poses() {
    var jointLength = 0;
    for (var x2 in this.joints) {
      jointLength++;
    }
    var p = Array.from({ length: this.frames }, () => Array.from({ length: jointLength }, () => [0, 0, 0]));
    var r2 = Array.from({ length: this.frames }, () => Array.from({ length: jointLength }, () => [0, 0, 0]));
    for (var frame = 0; frame < this.keyframes.length; frame++) {
      var local3 = this.frame_pose(frame);
      p[frame] = local3[0];
      r2[frame] = local3[1];
    }
    return [p, r2];
  }
  _plot_pose(p, r2, fig, ax) {
  }
  // Meybe helps for draw
  // plot_frame(frame, fig=None, ax=None) {
  plot_frame(frame, fig, ax) {
  }
  joint_names() {
    var keys = [];
    for (var key in this.joints) {
      keys.push(key);
    }
    return keys;
  }
  plot_all_frames() {
  }
  __repr__() {
    return `BVH.JS ${this.joints.keys().length} joints, ${this.frames} frames`;
  }
};

// ../../../../node_modules/bvh-loader/index.js
var bvh_loader_default = MEBvh;

// ../../../../node_modules/gl-matrix/esm/common.js
var EPSILON3 = 1e-6;
var ARRAY_TYPE = typeof Float32Array !== "undefined" ? Float32Array : Array;
var degree = Math.PI / 180;
var radian = 180 / Math.PI;

// ../../../../node_modules/gl-matrix/esm/mat4.js
var mat4_exports = {};
__export(mat4_exports, {
  add: () => add2,
  adjoint: () => adjoint,
  clone: () => clone2,
  copy: () => copy2,
  create: () => create2,
  decompose: () => decompose,
  determinant: () => determinant3,
  equals: () => equals2,
  exactEquals: () => exactEquals,
  frob: () => frob,
  fromQuat: () => fromQuat3,
  fromQuat2: () => fromQuat2,
  fromRotation: () => fromRotation,
  fromRotationTranslation: () => fromRotationTranslation,
  fromRotationTranslationScale: () => fromRotationTranslationScale,
  fromRotationTranslationScaleOrigin: () => fromRotationTranslationScaleOrigin,
  fromScaling: () => fromScaling,
  fromTranslation: () => fromTranslation,
  fromValues: () => fromValues2,
  fromXRotation: () => fromXRotation,
  fromYRotation: () => fromYRotation,
  fromZRotation: () => fromZRotation,
  frustum: () => frustum3,
  getRotation: () => getRotation,
  getScaling: () => getScaling3,
  getTranslation: () => getTranslation3,
  identity: () => identity3,
  invert: () => invert2,
  lookAt: () => lookAt3,
  mul: () => mul2,
  multiply: () => multiply3,
  multiplyScalar: () => multiplyScalar,
  multiplyScalarAndAdd: () => multiplyScalarAndAdd,
  ortho: () => ortho3,
  orthoNO: () => orthoNO,
  orthoZO: () => orthoZO,
  perspective: () => perspective3,
  perspectiveFromFieldOfView: () => perspectiveFromFieldOfView,
  perspectiveNO: () => perspectiveNO,
  perspectiveZO: () => perspectiveZO,
  rotate: () => rotate4,
  rotateX: () => rotateX3,
  rotateY: () => rotateY3,
  rotateZ: () => rotateZ3,
  scale: () => scale3,
  set: () => set2,
  str: () => str,
  sub: () => sub2,
  subtract: () => subtract2,
  targetTo: () => targetTo,
  translate: () => translate3,
  transpose: () => transpose3
});
function create2() {
  var out = new ARRAY_TYPE(16);
  if (ARRAY_TYPE != Float32Array) {
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
function clone2(a) {
  var out = new ARRAY_TYPE(16);
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
function copy2(out, a) {
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
function fromValues2(m00, m01, m02, m03, m10, m11, m12, m13, m20, m21, m22, m23, m30, m31, m32, m33) {
  var out = new ARRAY_TYPE(16);
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
function set2(out, m00, m01, m02, m03, m10, m11, m12, m13, m20, m21, m22, m23, m30, m31, m32, m33) {
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
function identity3(out) {
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
function transpose3(out, a) {
  if (out === a) {
    var a01 = a[1], a02 = a[2], a03 = a[3];
    var a12 = a[6], a13 = a[7];
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
function invert2(out, a) {
  var a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3];
  var a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];
  var a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];
  var a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];
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
  var det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
  if (!det) {
    return null;
  }
  det = 1 / det;
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
function adjoint(out, a) {
  var a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3];
  var a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];
  var a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];
  var a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];
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
function determinant3(a) {
  var a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3];
  var a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];
  var a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];
  var a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];
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
  return a13 * b6 - a03 * b7 + a33 * b8 - a23 * b9;
}
function multiply3(out, a, b) {
  var a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3];
  var a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];
  var a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];
  var a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];
  var b0 = b[0], b1 = b[1], b2 = b[2], b3 = b[3];
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
function translate3(out, a, v) {
  var x2 = v[0], y2 = v[1], z = v[2];
  var a00, a01, a02, a03;
  var a10, a11, a12, a13;
  var a20, a21, a22, a23;
  if (a === out) {
    out[12] = a[0] * x2 + a[4] * y2 + a[8] * z + a[12];
    out[13] = a[1] * x2 + a[5] * y2 + a[9] * z + a[13];
    out[14] = a[2] * x2 + a[6] * y2 + a[10] * z + a[14];
    out[15] = a[3] * x2 + a[7] * y2 + a[11] * z + a[15];
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
    out[12] = a00 * x2 + a10 * y2 + a20 * z + a[12];
    out[13] = a01 * x2 + a11 * y2 + a21 * z + a[13];
    out[14] = a02 * x2 + a12 * y2 + a22 * z + a[14];
    out[15] = a03 * x2 + a13 * y2 + a23 * z + a[15];
  }
  return out;
}
function scale3(out, a, v) {
  var x2 = v[0], y2 = v[1], z = v[2];
  out[0] = a[0] * x2;
  out[1] = a[1] * x2;
  out[2] = a[2] * x2;
  out[3] = a[3] * x2;
  out[4] = a[4] * y2;
  out[5] = a[5] * y2;
  out[6] = a[6] * y2;
  out[7] = a[7] * y2;
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
function rotate4(out, a, rad, axis) {
  var x2 = axis[0], y2 = axis[1], z = axis[2];
  var len2 = Math.sqrt(x2 * x2 + y2 * y2 + z * z);
  var s, c, t;
  var a00, a01, a02, a03;
  var a10, a11, a12, a13;
  var a20, a21, a22, a23;
  var b00, b01, b02;
  var b10, b11, b12;
  var b20, b21, b22;
  if (len2 < EPSILON3) {
    return null;
  }
  len2 = 1 / len2;
  x2 *= len2;
  y2 *= len2;
  z *= len2;
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
  b00 = x2 * x2 * t + c;
  b01 = y2 * x2 * t + z * s;
  b02 = z * x2 * t - y2 * s;
  b10 = x2 * y2 * t - z * s;
  b11 = y2 * y2 * t + c;
  b12 = z * y2 * t + x2 * s;
  b20 = x2 * z * t + y2 * s;
  b21 = y2 * z * t - x2 * s;
  b22 = z * z * t + c;
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
    out[12] = a[12];
    out[13] = a[13];
    out[14] = a[14];
    out[15] = a[15];
  }
  return out;
}
function rotateX3(out, a, rad) {
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
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];
    out[12] = a[12];
    out[13] = a[13];
    out[14] = a[14];
    out[15] = a[15];
  }
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
function rotateY3(out, a, rad) {
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
    out[4] = a[4];
    out[5] = a[5];
    out[6] = a[6];
    out[7] = a[7];
    out[12] = a[12];
    out[13] = a[13];
    out[14] = a[14];
    out[15] = a[15];
  }
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
function rotateZ3(out, a, rad) {
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
    out[8] = a[8];
    out[9] = a[9];
    out[10] = a[10];
    out[11] = a[11];
    out[12] = a[12];
    out[13] = a[13];
    out[14] = a[14];
    out[15] = a[15];
  }
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
function fromRotation(out, rad, axis) {
  var x2 = axis[0], y2 = axis[1], z = axis[2];
  var len2 = Math.sqrt(x2 * x2 + y2 * y2 + z * z);
  var s, c, t;
  if (len2 < EPSILON3) {
    return null;
  }
  len2 = 1 / len2;
  x2 *= len2;
  y2 *= len2;
  z *= len2;
  s = Math.sin(rad);
  c = Math.cos(rad);
  t = 1 - c;
  out[0] = x2 * x2 * t + c;
  out[1] = y2 * x2 * t + z * s;
  out[2] = z * x2 * t - y2 * s;
  out[3] = 0;
  out[4] = x2 * y2 * t - z * s;
  out[5] = y2 * y2 * t + c;
  out[6] = z * y2 * t + x2 * s;
  out[7] = 0;
  out[8] = x2 * z * t + y2 * s;
  out[9] = y2 * z * t - x2 * s;
  out[10] = z * z * t + c;
  out[11] = 0;
  out[12] = 0;
  out[13] = 0;
  out[14] = 0;
  out[15] = 1;
  return out;
}
function fromXRotation(out, rad) {
  var s = Math.sin(rad);
  var c = Math.cos(rad);
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
function fromYRotation(out, rad) {
  var s = Math.sin(rad);
  var c = Math.cos(rad);
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
function fromZRotation(out, rad) {
  var s = Math.sin(rad);
  var c = Math.cos(rad);
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
function fromRotationTranslation(out, q, v) {
  var x2 = q[0], y2 = q[1], z = q[2], w = q[3];
  var x22 = x2 + x2;
  var y22 = y2 + y2;
  var z2 = z + z;
  var xx = x2 * x22;
  var xy = x2 * y22;
  var xz = x2 * z2;
  var yy = y2 * y22;
  var yz = y2 * z2;
  var zz = z * z2;
  var wx = w * x22;
  var wy = w * y22;
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
function fromQuat2(out, a) {
  var translation3 = new ARRAY_TYPE(3);
  var bx = -a[0], by = -a[1], bz = -a[2], bw = a[3], ax = a[4], ay = a[5], az = a[6], aw = a[7];
  var magnitude = bx * bx + by * by + bz * bz + bw * bw;
  if (magnitude > 0) {
    translation3[0] = (ax * bw + aw * bx + ay * bz - az * by) * 2 / magnitude;
    translation3[1] = (ay * bw + aw * by + az * bx - ax * bz) * 2 / magnitude;
    translation3[2] = (az * bw + aw * bz + ax * by - ay * bx) * 2 / magnitude;
  } else {
    translation3[0] = (ax * bw + aw * bx + ay * bz - az * by) * 2;
    translation3[1] = (ay * bw + aw * by + az * bx - ax * bz) * 2;
    translation3[2] = (az * bw + aw * bz + ax * by - ay * bx) * 2;
  }
  fromRotationTranslation(out, a, translation3);
  return out;
}
function getTranslation3(out, mat2) {
  out[0] = mat2[12];
  out[1] = mat2[13];
  out[2] = mat2[14];
  return out;
}
function getScaling3(out, mat2) {
  var m11 = mat2[0];
  var m12 = mat2[1];
  var m13 = mat2[2];
  var m21 = mat2[4];
  var m22 = mat2[5];
  var m23 = mat2[6];
  var m31 = mat2[8];
  var m32 = mat2[9];
  var m33 = mat2[10];
  out[0] = Math.sqrt(m11 * m11 + m12 * m12 + m13 * m13);
  out[1] = Math.sqrt(m21 * m21 + m22 * m22 + m23 * m23);
  out[2] = Math.sqrt(m31 * m31 + m32 * m32 + m33 * m33);
  return out;
}
function getRotation(out, mat2) {
  var scaling3 = new ARRAY_TYPE(3);
  getScaling3(scaling3, mat2);
  var is1 = 1 / scaling3[0];
  var is2 = 1 / scaling3[1];
  var is3 = 1 / scaling3[2];
  var sm11 = mat2[0] * is1;
  var sm12 = mat2[1] * is2;
  var sm13 = mat2[2] * is3;
  var sm21 = mat2[4] * is1;
  var sm22 = mat2[5] * is2;
  var sm23 = mat2[6] * is3;
  var sm31 = mat2[8] * is1;
  var sm32 = mat2[9] * is2;
  var sm33 = mat2[10] * is3;
  var trace = sm11 + sm22 + sm33;
  var S = 0;
  if (trace > 0) {
    S = Math.sqrt(trace + 1) * 2;
    out[3] = 0.25 * S;
    out[0] = (sm23 - sm32) / S;
    out[1] = (sm31 - sm13) / S;
    out[2] = (sm12 - sm21) / S;
  } else if (sm11 > sm22 && sm11 > sm33) {
    S = Math.sqrt(1 + sm11 - sm22 - sm33) * 2;
    out[3] = (sm23 - sm32) / S;
    out[0] = 0.25 * S;
    out[1] = (sm12 + sm21) / S;
    out[2] = (sm31 + sm13) / S;
  } else if (sm22 > sm33) {
    S = Math.sqrt(1 + sm22 - sm11 - sm33) * 2;
    out[3] = (sm31 - sm13) / S;
    out[0] = (sm12 + sm21) / S;
    out[1] = 0.25 * S;
    out[2] = (sm23 + sm32) / S;
  } else {
    S = Math.sqrt(1 + sm33 - sm11 - sm22) * 2;
    out[3] = (sm12 - sm21) / S;
    out[0] = (sm31 + sm13) / S;
    out[1] = (sm23 + sm32) / S;
    out[2] = 0.25 * S;
  }
  return out;
}
function decompose(out_r, out_t, out_s, mat2) {
  out_t[0] = mat2[12];
  out_t[1] = mat2[13];
  out_t[2] = mat2[14];
  var m11 = mat2[0];
  var m12 = mat2[1];
  var m13 = mat2[2];
  var m21 = mat2[4];
  var m22 = mat2[5];
  var m23 = mat2[6];
  var m31 = mat2[8];
  var m32 = mat2[9];
  var m33 = mat2[10];
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
    S = Math.sqrt(trace + 1) * 2;
    out_r[3] = 0.25 * S;
    out_r[0] = (sm23 - sm32) / S;
    out_r[1] = (sm31 - sm13) / S;
    out_r[2] = (sm12 - sm21) / S;
  } else if (sm11 > sm22 && sm11 > sm33) {
    S = Math.sqrt(1 + sm11 - sm22 - sm33) * 2;
    out_r[3] = (sm23 - sm32) / S;
    out_r[0] = 0.25 * S;
    out_r[1] = (sm12 + sm21) / S;
    out_r[2] = (sm31 + sm13) / S;
  } else if (sm22 > sm33) {
    S = Math.sqrt(1 + sm22 - sm11 - sm33) * 2;
    out_r[3] = (sm31 - sm13) / S;
    out_r[0] = (sm12 + sm21) / S;
    out_r[1] = 0.25 * S;
    out_r[2] = (sm23 + sm32) / S;
  } else {
    S = Math.sqrt(1 + sm33 - sm11 - sm22) * 2;
    out_r[3] = (sm12 - sm21) / S;
    out_r[0] = (sm31 + sm13) / S;
    out_r[1] = (sm23 + sm32) / S;
    out_r[2] = 0.25 * S;
  }
  return out_r;
}
function fromRotationTranslationScale(out, q, v, s) {
  var x2 = q[0], y2 = q[1], z = q[2], w = q[3];
  var x22 = x2 + x2;
  var y22 = y2 + y2;
  var z2 = z + z;
  var xx = x2 * x22;
  var xy = x2 * y22;
  var xz = x2 * z2;
  var yy = y2 * y22;
  var yz = y2 * z2;
  var zz = z * z2;
  var wx = w * x22;
  var wy = w * y22;
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
function fromRotationTranslationScaleOrigin(out, q, v, s, o2) {
  var x2 = q[0], y2 = q[1], z = q[2], w = q[3];
  var x22 = x2 + x2;
  var y22 = y2 + y2;
  var z2 = z + z;
  var xx = x2 * x22;
  var xy = x2 * y22;
  var xz = x2 * z2;
  var yy = y2 * y22;
  var yz = y2 * z2;
  var zz = z * z2;
  var wx = w * x22;
  var wy = w * y22;
  var wz = w * z2;
  var sx = s[0];
  var sy = s[1];
  var sz = s[2];
  var ox = o2[0];
  var oy = o2[1];
  var oz = o2[2];
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
function fromQuat3(out, q) {
  var x2 = q[0], y2 = q[1], z = q[2], w = q[3];
  var x22 = x2 + x2;
  var y22 = y2 + y2;
  var z2 = z + z;
  var xx = x2 * x22;
  var yx = y2 * x22;
  var yy = y2 * y22;
  var zx = z * x22;
  var zy = z * y22;
  var zz = z * z2;
  var wx = w * x22;
  var wy = w * y22;
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
function frustum3(out, left2, right2, bottom, top, near, far) {
  var rl = 1 / (right2 - left2);
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
  out[8] = (right2 + left2) * rl;
  out[9] = (top + bottom) * tb;
  out[10] = (far + near) * nf;
  out[11] = -1;
  out[12] = 0;
  out[13] = 0;
  out[14] = far * near * 2 * nf;
  out[15] = 0;
  return out;
}
function perspectiveNO(out, fovy, aspect, near, far) {
  var f = 1 / Math.tan(fovy / 2);
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
var perspective3 = perspectiveNO;
function perspectiveZO(out, fovy, aspect, near, far) {
  var f = 1 / Math.tan(fovy / 2);
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
function perspectiveFromFieldOfView(out, fov, near, far) {
  var upTan = Math.tan(fov.upDegrees * Math.PI / 180);
  var downTan = Math.tan(fov.downDegrees * Math.PI / 180);
  var leftTan = Math.tan(fov.leftDegrees * Math.PI / 180);
  var rightTan = Math.tan(fov.rightDegrees * Math.PI / 180);
  var xScale = 2 / (leftTan + rightTan);
  var yScale = 2 / (upTan + downTan);
  out[0] = xScale;
  out[1] = 0;
  out[2] = 0;
  out[3] = 0;
  out[4] = 0;
  out[5] = yScale;
  out[6] = 0;
  out[7] = 0;
  out[8] = -((leftTan - rightTan) * xScale * 0.5);
  out[9] = (upTan - downTan) * yScale * 0.5;
  out[10] = far / (near - far);
  out[11] = -1;
  out[12] = 0;
  out[13] = 0;
  out[14] = far * near / (near - far);
  out[15] = 0;
  return out;
}
function orthoNO(out, left2, right2, bottom, top, near, far) {
  var lr = 1 / (left2 - right2);
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
  out[12] = (left2 + right2) * lr;
  out[13] = (top + bottom) * bt;
  out[14] = (far + near) * nf;
  out[15] = 1;
  return out;
}
var ortho3 = orthoNO;
function orthoZO(out, left2, right2, bottom, top, near, far) {
  var lr = 1 / (left2 - right2);
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
  out[12] = (left2 + right2) * lr;
  out[13] = (top + bottom) * bt;
  out[14] = near * nf;
  out[15] = 1;
  return out;
}
function lookAt3(out, eye, center, up) {
  var x0, x1, x2, y0, y1, y2, z0, z1, z2, len2;
  var eyex = eye[0];
  var eyey = eye[1];
  var eyez = eye[2];
  var upx = up[0];
  var upy = up[1];
  var upz = up[2];
  var centerx = center[0];
  var centery = center[1];
  var centerz = center[2];
  if (Math.abs(eyex - centerx) < EPSILON3 && Math.abs(eyey - centery) < EPSILON3 && Math.abs(eyez - centerz) < EPSILON3) {
    return identity3(out);
  }
  z0 = eyex - centerx;
  z1 = eyey - centery;
  z2 = eyez - centerz;
  len2 = 1 / Math.sqrt(z0 * z0 + z1 * z1 + z2 * z2);
  z0 *= len2;
  z1 *= len2;
  z2 *= len2;
  x0 = upy * z2 - upz * z1;
  x1 = upz * z0 - upx * z2;
  x2 = upx * z1 - upy * z0;
  len2 = Math.sqrt(x0 * x0 + x1 * x1 + x2 * x2);
  if (!len2) {
    x0 = 0;
    x1 = 0;
    x2 = 0;
  } else {
    len2 = 1 / len2;
    x0 *= len2;
    x1 *= len2;
    x2 *= len2;
  }
  y0 = z1 * x2 - z2 * x1;
  y1 = z2 * x0 - z0 * x2;
  y2 = z0 * x1 - z1 * x0;
  len2 = Math.sqrt(y0 * y0 + y1 * y1 + y2 * y2);
  if (!len2) {
    y0 = 0;
    y1 = 0;
    y2 = 0;
  } else {
    len2 = 1 / len2;
    y0 *= len2;
    y1 *= len2;
    y2 *= len2;
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
function targetTo(out, eye, target, up) {
  var eyex = eye[0], eyey = eye[1], eyez = eye[2], upx = up[0], upy = up[1], upz = up[2];
  var z0 = eyex - target[0], z1 = eyey - target[1], z2 = eyez - target[2];
  var len2 = z0 * z0 + z1 * z1 + z2 * z2;
  if (len2 > 0) {
    len2 = 1 / Math.sqrt(len2);
    z0 *= len2;
    z1 *= len2;
    z2 *= len2;
  }
  var x0 = upy * z2 - upz * z1, x1 = upz * z0 - upx * z2, x2 = upx * z1 - upy * z0;
  len2 = x0 * x0 + x1 * x1 + x2 * x2;
  if (len2 > 0) {
    len2 = 1 / Math.sqrt(len2);
    x0 *= len2;
    x1 *= len2;
    x2 *= len2;
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
function str(a) {
  return "mat4(" + a[0] + ", " + a[1] + ", " + a[2] + ", " + a[3] + ", " + a[4] + ", " + a[5] + ", " + a[6] + ", " + a[7] + ", " + a[8] + ", " + a[9] + ", " + a[10] + ", " + a[11] + ", " + a[12] + ", " + a[13] + ", " + a[14] + ", " + a[15] + ")";
}
function frob(a) {
  return Math.sqrt(a[0] * a[0] + a[1] * a[1] + a[2] * a[2] + a[3] * a[3] + a[4] * a[4] + a[5] * a[5] + a[6] * a[6] + a[7] * a[7] + a[8] * a[8] + a[9] * a[9] + a[10] * a[10] + a[11] * a[11] + a[12] * a[12] + a[13] * a[13] + a[14] * a[14] + a[15] * a[15]);
}
function add2(out, a, b) {
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
function subtract2(out, a, b) {
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
function multiplyScalarAndAdd(out, a, b, scale4) {
  out[0] = a[0] + b[0] * scale4;
  out[1] = a[1] + b[1] * scale4;
  out[2] = a[2] + b[2] * scale4;
  out[3] = a[3] + b[3] * scale4;
  out[4] = a[4] + b[4] * scale4;
  out[5] = a[5] + b[5] * scale4;
  out[6] = a[6] + b[6] * scale4;
  out[7] = a[7] + b[7] * scale4;
  out[8] = a[8] + b[8] * scale4;
  out[9] = a[9] + b[9] * scale4;
  out[10] = a[10] + b[10] * scale4;
  out[11] = a[11] + b[11] * scale4;
  out[12] = a[12] + b[12] * scale4;
  out[13] = a[13] + b[13] * scale4;
  out[14] = a[14] + b[14] * scale4;
  out[15] = a[15] + b[15] * scale4;
  return out;
}
function exactEquals(a, b) {
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3] && a[4] === b[4] && a[5] === b[5] && a[6] === b[6] && a[7] === b[7] && a[8] === b[8] && a[9] === b[9] && a[10] === b[10] && a[11] === b[11] && a[12] === b[12] && a[13] === b[13] && a[14] === b[14] && a[15] === b[15];
}
function equals2(a, b) {
  var a0 = a[0], a1 = a[1], a2 = a[2], a3 = a[3];
  var a4 = a[4], a5 = a[5], a6 = a[6], a7 = a[7];
  var a8 = a[8], a9 = a[9], a10 = a[10], a11 = a[11];
  var a12 = a[12], a13 = a[13], a14 = a[14], a15 = a[15];
  var b0 = b[0], b1 = b[1], b2 = b[2], b3 = b[3];
  var b4 = b[4], b5 = b[5], b6 = b[6], b7 = b[7];
  var b8 = b[8], b9 = b[9], b10 = b[10], b11 = b[11];
  var b12 = b[12], b13 = b[13], b14 = b[14], b15 = b[15];
  return Math.abs(a0 - b0) <= EPSILON3 * Math.max(1, Math.abs(a0), Math.abs(b0)) && Math.abs(a1 - b1) <= EPSILON3 * Math.max(1, Math.abs(a1), Math.abs(b1)) && Math.abs(a2 - b2) <= EPSILON3 * Math.max(1, Math.abs(a2), Math.abs(b2)) && Math.abs(a3 - b3) <= EPSILON3 * Math.max(1, Math.abs(a3), Math.abs(b3)) && Math.abs(a4 - b4) <= EPSILON3 * Math.max(1, Math.abs(a4), Math.abs(b4)) && Math.abs(a5 - b5) <= EPSILON3 * Math.max(1, Math.abs(a5), Math.abs(b5)) && Math.abs(a6 - b6) <= EPSILON3 * Math.max(1, Math.abs(a6), Math.abs(b6)) && Math.abs(a7 - b7) <= EPSILON3 * Math.max(1, Math.abs(a7), Math.abs(b7)) && Math.abs(a8 - b8) <= EPSILON3 * Math.max(1, Math.abs(a8), Math.abs(b8)) && Math.abs(a9 - b9) <= EPSILON3 * Math.max(1, Math.abs(a9), Math.abs(b9)) && Math.abs(a10 - b10) <= EPSILON3 * Math.max(1, Math.abs(a10), Math.abs(b10)) && Math.abs(a11 - b11) <= EPSILON3 * Math.max(1, Math.abs(a11), Math.abs(b11)) && Math.abs(a12 - b12) <= EPSILON3 * Math.max(1, Math.abs(a12), Math.abs(b12)) && Math.abs(a13 - b13) <= EPSILON3 * Math.max(1, Math.abs(a13), Math.abs(b13)) && Math.abs(a14 - b14) <= EPSILON3 * Math.max(1, Math.abs(a14), Math.abs(b14)) && Math.abs(a15 - b15) <= EPSILON3 * Math.max(1, Math.abs(a15), Math.abs(b15));
}
var mul2 = multiply3;
var sub2 = subtract2;

// ../../../engine/loaders/webgpu-gltf.js
var GLTFRenderMode = {
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
var GLTFComponentType = {
  BYTE: 5120,
  UNSIGNED_BYTE: 5121,
  SHORT: 5122,
  UNSIGNED_SHORT: 5123,
  INT: 5124,
  UNSIGNED_INT: 5125,
  FLOAT: 5126,
  DOUBLE: 5130
};
var GLTFTextureFilter = {
  NEAREST: 9728,
  LINEAR: 9729,
  NEAREST_MIPMAP_NEAREST: 9984,
  LINEAR_MIPMAP_NEAREST: 9985,
  NEAREST_MIPMAP_LINEAR: 9986,
  LINEAR_MIPMAP_LINEAR: 9987
};
function alignTo(val, align) {
  return Math.floor((val + align - 1) / align) * align;
}
function gltfTypeNumComponents(type2) {
  switch (type2) {
    case "SCALAR":
      return 1;
    case "VEC2":
      return 2;
    case "VEC3":
      return 3;
    case "VEC4":
      return 4;
    default:
      alert("Unhandled glTF Type " + type2);
      return null;
  }
}
function gltfTypeSize(componentType, type2) {
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
      alert("Unrecognized GLTF Component Type?");
  }
  return gltfTypeNumComponents(type2) * typeSize;
}
var GLTFBuffer = class {
  constructor(buffer, size2, offset) {
    this.arrayBuffer = buffer;
    this.size = size2;
    this.byteOffset = offset;
  }
};
var GLTFBufferView = class {
  constructor(buffer, view) {
    this.length = view["byteLength"];
    this.byteOffset = buffer.byteOffset;
    if (view["byteOffset"] !== void 0) {
      this.byteOffset += view["byteOffset"];
    }
    this.byteStride = 0;
    if (view["byteStride"] !== void 0) {
      this.byteStride = view["byteStride"];
    }
    this.buffer = new Uint8Array(buffer.arrayBuffer, this.byteOffset, this.length);
    this.needsUpload = false;
    this.gpuBuffer = null;
    this.usage = 0;
  }
  addUsage(usage) {
    this.usage = this.usage | usage;
  }
  upload(device2) {
    var buf = device2.createBuffer({
      size: alignTo(this.buffer.byteLength, 4),
      usage: this.usage,
      mappedAtCreation: true
    });
    new this.buffer.constructor(buf.getMappedRange()).set(this.buffer);
    buf.unmap();
    this.gpuBuffer = buf;
    this.needsUpload = false;
  }
};
var GLTFAccessor = class {
  constructor(view, accessor, weightsAccessIndex) {
    this.count = accessor["count"];
    this.componentType = accessor["componentType"];
    this.gltfType = accessor["type"];
    this.numComponents = gltfTypeNumComponents(accessor["type"]);
    this.numScalars = this.count * this.numComponents;
    this.view = view;
    this.byteOffset = 0;
    if (accessor["byteOffset"] !== void 0) {
      this.byteOffset = accessor["byteOffset"];
    }
    if (weightsAccessIndex) this.weightsAccessIndex = weightsAccessIndex;
  }
  get byteStride() {
    var elementSize = gltfTypeSize(this.componentType, this.gltfType);
    return Math.max(elementSize, this.view.byteStride);
  }
};
var GLTFPrimitive = class {
  constructor(indices, positions, normals, texcoords, material, topology, weights, joints, tangents) {
    this.indices = indices;
    this.positions = positions;
    this.normals = normals;
    this.texcoords = texcoords;
    this.material = material;
    this.topology = topology;
    this.weights = weights;
    this.joints = joints;
    this.tangents = tangents;
  }
};
var GLTFMesh = class {
  constructor(name2, primitives) {
    this.name = name2;
    this.primitives = primitives;
  }
};
var GLTFNode = class {
  constructor(name2, mesh, transform, n2) {
    this.name = name2;
    this.mesh = mesh;
    this.transform = transform;
    this.gpuUniforms = null;
    this.bindGroup = null;
    this.children = n2.children || [];
  }
  upload(device2) {
    var buf = device2.createBuffer(
      { size: 4 * 4 * 4, usage: GPUBufferUsage.UNIFORM, mappedAtCreation: true }
    );
    new Float32Array(buf.getMappedRange()).set(this.transform);
    buf.unmap();
    this.gpuUniforms = buf;
  }
};
function readNodeTransform(node2) {
  if (node2["matrix"]) {
    var m = node2["matrix"];
    return mat4_exports.fromValues(
      m[0],
      m[1],
      m[2],
      m[3],
      m[4],
      m[5],
      m[6],
      m[7],
      m[8],
      m[9],
      m[10],
      m[11],
      m[12],
      m[13],
      m[14],
      m[15]
    );
  } else {
    var scale4 = [1, 1, 1];
    var rotation3 = [0, 0, 0, 1];
    var translation3 = [0, 0, 0];
    if (node2["scale"]) {
      scale4 = node2["scale"];
    }
    if (node2["rotation"]) {
      rotation3 = node2["rotation"];
    }
    if (node2["translation"]) {
      translation3 = node2["translation"];
    }
    var m = mat4_exports.create();
    return mat4_exports.fromRotationTranslationScale(m, rotation3, translation3, scale4);
  }
}
function flattenGLTFChildren(nodes, node2, parent_transform) {
  var tfm = readNodeTransform(node2);
  var tfm = mat4_exports.mul(tfm, parent_transform, tfm);
  node2["matrix"] = tfm;
  node2["scale"] = void 0;
  node2["rotation"] = void 0;
  node2["translation"] = void 0;
  if (node2["children"]) {
    for (var i = 0; i < node2["children"].length; ++i) {
      flattenGLTFChildren(nodes, nodes[node2["children"][i]], tfm);
    }
  }
}
function makeGLTFSingleLevel(nodes) {
  var rootTfm = mat4_exports.create();
  for (var i = 0; i < nodes.length; ++i) {
    flattenGLTFChildren(nodes, nodes[i], rootTfm);
  }
  return nodes;
}
var GLTFMaterial = class {
  constructor(material, textures) {
    this.baseColorFactor = [1, 1, 1, 1];
    this.baseColorTexture = null;
    this.emissiveFactor = [0, 0, 0, 1];
    this.metallicFactor = 1;
    this.roughnessFactor = 1;
    if (material["pbrMetallicRoughness"] !== void 0) {
      var pbr = material["pbrMetallicRoughness"];
      if (pbr["baseColorFactor"] !== void 0) {
        this.baseColorFactor = pbr["baseColorFactor"];
      }
      if (pbr["baseColorTexture"] !== void 0) {
        this.baseColorTexture = textures[pbr["baseColorTexture"]["index"]];
      }
      if (pbr["metallicFactor"] !== void 0) {
        this.metallicFactor = pbr["metallicFactor"];
      }
      if (pbr["roughnessFactor"] !== void 0) {
        this.roughnessFactor = pbr["roughnessFactor"];
      }
    }
    if (material["emissiveFactor"] !== void 0) {
      this.emissiveFactor[0] = material["emissiveFactor"][0];
      this.emissiveFactor[1] = material["emissiveFactor"][1];
      this.emissiveFactor[2] = material["emissiveFactor"][2];
    }
    this.gpuBuffer = null;
    this.bindGroupLayout = null;
    this.bindGroup = null;
  }
  upload(device2) {
    var buf = device2.createBuffer(
      { size: 3 * 4 * 4, usage: GPUBufferUsage.UNIFORM, mappedAtCreation: true }
    );
    var mappingView = new Float32Array(buf.getMappedRange());
    mappingView.set(this.baseColorFactor);
    mappingView.set(this.emissiveFactor, 4);
    mappingView.set([this.metallicFactor, this.roughnessFactor], 8);
    buf.unmap();
    this.gpuBuffer = buf;
    var layoutEntries = [{ binding: 0, visibility: GPUShaderStage.FRAGMENT, buffer: { type: "uniform" } }];
    var bindGroupEntries = [{
      binding: 0,
      resource: {
        buffer: this.gpuBuffer
      }
    }];
    if (this.baseColorTexture) {
      layoutEntries.push({ binding: 1, visibility: GPUShaderStage.FRAGMENT, sampler: {} });
      layoutEntries.push({ binding: 2, visibility: GPUShaderStage.FRAGMENT, texture: {} });
      bindGroupEntries.push({
        binding: 1,
        resource: this.baseColorTexture.sampler
      });
      bindGroupEntries.push({
        binding: 2,
        resource: this.baseColorTexture.imageView
      });
    }
    this.bindGroupLayout = device2.createBindGroupLayout({ entries: layoutEntries });
    this.bindGroup = device2.createBindGroup({
      layout: this.bindGroupLayout,
      entries: bindGroupEntries
    });
  }
};
var GLTFSampler = class {
  constructor(sampler, device2) {
    var magFilter = sampler["magFilter"] === void 0 || sampler["magFilter"] == GLTFTextureFilter.LINEAR ? "linear" : "nearest";
    var minFilter = sampler["minFilter"] === void 0 || sampler["minFilter"] == GLTFTextureFilter.LINEAR ? "linear" : "nearest";
    var wrapS = "repeat";
    if (sampler["wrapS"] !== void 0) {
      if (sampler["wrapS"] == GLTFTextureFilter.REPEAT) {
        wrapS = "repeat";
      } else if (sampler["wrapS"] == GLTFTextureFilter.CLAMP_TO_EDGE) {
        wrapS = "clamp-to-edge";
      } else {
        wrapS = "mirror-repeat";
      }
    }
    var wrapT = "repeat";
    if (sampler["wrapT"] !== void 0) {
      if (sampler["wrapT"] == GLTFTextureFilter.REPEAT) {
        wrapT = "repeat";
      } else if (sampler["wrapT"] == GLTFTextureFilter.CLAMP_TO_EDGE) {
        wrapT = "clamp-to-edge";
      } else {
        wrapT = "mirror-repeat";
      }
    }
    this.sampler = device2.createSampler({
      magFilter,
      minFilter,
      addressModeU: wrapS,
      addressModeV: wrapT
    });
  }
};
var GLTFTexture = class {
  constructor(sampler, image) {
    this.gltfsampler = sampler;
    this.sampler = sampler.sampler;
    this.image = image;
    this.imageView = image.createView();
  }
};
var GLBModel = class {
  constructor(nodes, skins, skinnedMeshNodes, glbJsonData, glbBinaryBuffer, noSkinMeshNodes) {
    this.noSkinMeshNodes = noSkinMeshNodes;
    this.nodes = nodes;
    this.skins = skins;
    this.skinnedMeshNodes = skinnedMeshNodes;
    this.bvhToGLBMap = null;
    this.glbJsonData = glbJsonData;
    this.glbBinaryBuffer = glbBinaryBuffer;
  }
};
async function uploadGLBModel(buffer, device2) {
  const header2 = new Uint32Array(buffer, 0, 5);
  if (header2[0] !== 1179937895) {
    alert("This does not appear to be a glb file?");
    return;
  }
  const glbJsonData = JSON.parse(
    new TextDecoder("utf-8").decode(new Uint8Array(buffer, 20, header2[3]))
  );
  const binaryHeader = new Uint32Array(buffer, 20 + header2[3], 2);
  const glbBuffer = new GLTFBuffer(buffer, binaryHeader[0], 28 + header2[3]);
  const bufferViews = glbJsonData.bufferViews.map(
    (v) => new GLTFBufferView(glbBuffer, v)
  );
  const binaryOffset = 28 + header2[3];
  const binaryLength = binaryHeader[0];
  const glbBinaryBuffer = buffer.slice(binaryOffset, binaryOffset + binaryLength);
  const images = [];
  if (glbJsonData.images) {
    for (const imgJson of glbJsonData.images) {
      const view = new GLTFBufferView(
        glbBuffer,
        glbJsonData.bufferViews[imgJson.bufferView]
      );
      const blob = new Blob([view.buffer], { type: imgJson["mime/type"] });
      const img = await createImageBitmap(blob);
      const gpuImg = device2.createTexture({
        size: [img.width, img.height, 1],
        format: "rgba8unorm-srgb",
        usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT
      });
      device2.queue.copyExternalImageToTexture(
        { source: img },
        { texture: gpuImg },
        [img.width, img.height, 1]
      );
      images.push(gpuImg);
    }
  }
  glbJsonData.glbTextures = images;
  const defaultSampler = new GLTFSampler({}, device2);
  const samplers = (glbJsonData.samplers || []).map(
    (s) => new GLTFSampler(s, device2)
  );
  const textures = (glbJsonData.textures || []).map((tex) => {
    const sampler = tex.sampler !== void 0 ? samplers[tex.sampler] : defaultSampler;
    return new GLTFTexture(sampler, images[tex.source]);
  });
  const defaultMaterial = new GLTFMaterial({});
  const materials = (glbJsonData.materials || []).map(
    (m) => new GLTFMaterial(m, textures)
  );
  const meshes = (glbJsonData.meshes || []).map((mesh) => {
    const primitives = mesh.primitives.map((prim) => {
      const topology = prim.mode ?? GLTFRenderMode.TRIANGLES;
      let indices = null;
      if (prim.indices !== void 0) {
        const accessor = glbJsonData.accessors[prim.indices];
        const viewID = accessor.bufferView;
        bufferViews[viewID].needsUpload = true;
        bufferViews[viewID].addUsage(GPUBufferUsage.INDEX);
        indices = new GLTFAccessor(bufferViews[viewID], accessor);
      }
      let positions = null, normals = null, tangents = null, texcoords = [];
      let weights = null;
      let joints = null;
      for (const attr in prim.attributes) {
        const accessor = glbJsonData.accessors[prim.attributes[attr]];
        const viewID = accessor.bufferView;
        bufferViews[viewID].needsUpload = true;
        bufferViews[viewID].addUsage(GPUBufferUsage.VERTEX);
        if (attr === "POSITION") {
          positions = new GLTFAccessor(bufferViews[viewID], accessor);
        } else if (attr === "NORMAL") {
          normals = new GLTFAccessor(bufferViews[viewID], accessor);
        } else if (attr.startsWith("TEXCOORD")) {
          texcoords.push(new GLTFAccessor(bufferViews[viewID], accessor));
        } else if (attr === "WEIGHTS_0") {
          weights = new GLTFAccessor(bufferViews[viewID], accessor, prim.attributes["WEIGHTS_0"]);
        } else if (attr.startsWith("JOINTS")) {
          joints = new GLTFAccessor(bufferViews[viewID], accessor);
        } else if (attr === "TANGENT") {
          tangents = new GLTFAccessor(bufferViews[viewID], accessor);
        } else {
          console.log("unknow-attr:", attr);
        }
      }
      const material = prim.material !== void 0 ? materials[prim.material] : defaultMaterial;
      return new GLTFPrimitive(
        indices,
        positions,
        normals,
        texcoords,
        material,
        topology,
        weights,
        joints,
        tangents
      );
    });
    return new GLTFMesh(mesh.name, primitives);
  });
  for (const bv of bufferViews) if (bv.needsUpload) bv.upload(device2);
  defaultMaterial.upload(device2);
  for (const m of materials) m.upload(device2);
  const skins = (glbJsonData.skins || []).map((skin) => ({
    name: skin.name,
    joints: skin.joints,
    inverseBindMatrices: skin.inverseBindMatrices
    // accessor index
  }));
  const nodes = [];
  const gltfNodes = makeGLTFSingleLevel(glbJsonData.nodes);
  for (let i = 0; i < gltfNodes.length; i++) {
    const n2 = gltfNodes[i];
    const meshObj = n2.mesh !== void 0 ? meshes[n2.mesh] : null;
    const node2 = new GLTFNode(n2.name, meshObj, readNodeTransform(n2), n2);
    if (n2.skin !== void 0) node2.skin = n2.skin;
    node2.upload(device2);
    nodes.push(node2);
  }
  for (let i = 0; i < gltfNodes.length; i++) {
    const srcNode = gltfNodes[i];
    if (srcNode.children) {
      for (const childIndex of srcNode.children) {
        nodes[childIndex].parent = i;
      }
    }
  }
  for (const node2 of nodes) {
    if (node2.parent === void 0) node2.parent = null;
  }
  const skinnedMeshNodes = nodes.filter(
    (n2) => n2.mesh && n2.skin !== void 0
  );
  let noSkinMeshNodes = null;
  if (skinnedMeshNodes.length === 0) {
    console.warn("No skins found \u2014 mesh not bound to skeleton");
    noSkinMeshNodes = nodes.filter((n2) => n2.mesh);
  } else {
    skinnedMeshNodes.forEach((n2) => {
      n2.sceneUniformBuffer = device2.createBuffer({
        size: 44 * 4,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
      });
    });
  }
  let R = new GLBModel(nodes, skins, skinnedMeshNodes, glbJsonData, glbBinaryBuffer, noSkinMeshNodes);
  return R;
}

// ../../../engine/loaders/bvh.js
var animBVH = new bvh_loader_default();
var BVHPlayer = class extends MEMeshObj {
  constructor(o2, bvh, glb, primitiveIndex, skinnedNodeIndex, canvas, device2, context, inputHandler, globalAmbient) {
    super(canvas, device2, context, o2, inputHandler, globalAmbient, glb, primitiveIndex, skinnedNodeIndex);
    this.bvh = {};
    this.glb = glb;
    this.currentFrame = 0;
    this.fps = 30;
    this.timeAccumulator = 0;
    this.scaleBoneTest = 1;
    this.primitiveIndex = primitiveIndex;
    if (!this.bvh.sharedState) {
      this.bvh.sharedState = { currentFrame: 0, timeAccumulator: 0 };
    }
    this.sharedState = this.bvh.sharedState;
    this.skinnedNode = this.glb.skinnedMeshNodes[skinnedNodeIndex];
    this.nodeWorldMatrices = Array.from(
      { length: this.glb.nodes.length },
      () => mat4Impl.identity()
    );
    this.startTime = performance.now() / 1e3;
    this.MAX_BONES = 100;
    this.skeleton = [];
    this.animationSpeed = 1e3;
    this.inverseBindMatrices = [];
    this.initInverseBindMatrices();
    this.makeSkeletal();
  }
  makeSkeletal() {
    let skin = this.glb.skins[0];
    const accessorIndex = skin.inverseBindMatrices;
    if (accessorIndex == null) {
      console.warn("No inverseBindMatrices, using identity matrices");
    }
    const invBindArray = this.inverseBindMatrices;
    this.skeleton = skin.joints.slice();
    for (let i = 0; i < skin.joints.length; i++) {
      const jointIndex = skin.joints[i];
      const jointNode = this.glb.nodes[jointIndex];
      jointNode.inverseBindMatrix = invBindArray.slice(i * 16, (i + 1) * 16);
      if (!jointNode.transform) {
        jointNode.transform = new Float32Array([
          1,
          0,
          0,
          0,
          0,
          1,
          0,
          0,
          0,
          0,
          1,
          0,
          0,
          0,
          0,
          1
        ]);
      }
      if (!jointNode.translation || !jointNode.rotation || !jointNode.scale) {
        const { translation: translation3, rotation: rotation3, scale: scale4 } = this.decomposeMatrix(jointNode.transform);
        jointNode.translation = translation3;
        jointNode.rotation = rotation3;
        jointNode.scale = scale4;
      }
    }
    this.glb.animationIndex = 0;
    for (let j = 0; j < this.glb.glbJsonData.animations.length; j++) {
      if (this.glb.glbJsonData.animations[j].name.indexOf("Armature") !== -1) {
        this.glb.animationIndex = j;
      }
    }
  }
  initInverseBindMatrices(skinIndex = 0) {
    const skin = this.glb.skins[skinIndex];
    const invBindAccessorIndex = skin.inverseBindMatrices;
    if (invBindAccessorIndex === void 0 || invBindAccessorIndex === null) {
      console.warn("No inverseBindMatrices accessor for skin", skinIndex);
      return;
    }
    const invBindArray = this.getAccessorArray(this.glb, invBindAccessorIndex);
    this.inverseBindMatrices = invBindArray;
  }
  playAnimationByIndex = (animationIndex) => {
    this.glb.animationIndex = animationIndex;
  };
  playAnimationByName = (animationName) => {
    const animations = this.glb.glbJsonData.animations;
    const index = animations.findIndex(
      (anim) => anim.name === animationName
    );
    if (index === -1) {
      console.warn(`Animation '${animationName}' not found`);
      return;
    }
    this.glb.animationIndex = index;
  };
  getNumberOfFramesCurAni() {
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
      this.sharedState.currentFrame = (this.sharedState.currentFrame + 1) % this.getNumberOfFramesCurAni();
      this.sharedState.timeAccumulator -= frameTime;
    }
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
    const byteLength = accessor.count * this.getNumComponents(accessor.type) * (accessor.componentType === 5126 ? 4 : 2);
    const bufferDef = glb.glbBinaryBuffer;
    const slice = this.getBufferSlice(bufferDef, byteOffset, byteLength);
    switch (accessor.componentType) {
      case 5126:
        return new Float32Array(slice);
      case 5123:
        return new Uint16Array(slice);
      case 5121:
        return new Uint8Array(slice);
      default:
        throw new Error("Unsupported componentType: " + accessor.componentType);
    }
  }
  getAccessorTypeForChannel(path2) {
    switch (path2) {
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
        throw new Error("Unknown channel path: " + path2);
    }
  }
  getNumComponents(type2) {
    switch (type2) {
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
        throw new Error("Unknown type: " + type2);
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
    if (bufferDef instanceof GLTFBuffer) {
      return bufferDef.arrayBuffer.slice(
        bufferDef.byteOffset + (byteOffset || 0),
        bufferDef.byteOffset + (byteOffset || 0) + byteLength
      );
    }
    if (bufferDef instanceof ArrayBuffer) {
      return bufferDef.slice(byteOffset, byteOffset + byteLength);
    }
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
    let dot2 = a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];
    if (dot2 < 0) {
      b = b.map((v) => -v);
      dot2 = -dot2;
    }
    if (dot2 > 0.9995) return lerpVec(a, b, t);
    const theta0 = Math.acos(dot2);
    const theta = theta0 * t;
    const sinTheta = Math.sin(theta);
    const sinTheta0 = Math.sin(theta0);
    const s0 = Math.cos(theta) - dot2 * sinTheta / sinTheta0;
    const s1 = sinTheta / sinTheta0;
    return a.map((v, i) => s0 * v + s1 * b[i]);
  }
  // naive quaternion to 4x4 matrix
  quatToMat4(q) {
    const [x2, y2, z, w] = q;
    const xx = x2 * x2, yy = y2 * y2, zz = z * z;
    const xy = x2 * y2, xz = x2 * z, yz = y2 * z, wx = w * x2, wy = w * y2, wz = w * z;
    return new Float32Array([
      1 - 2 * (yy + zz),
      2 * (xy + wz),
      2 * (xz - wy),
      0,
      2 * (xy - wz),
      1 - 2 * (xx + zz),
      2 * (yz + wx),
      0,
      2 * (xz + wy),
      2 * (yz - wx),
      1 - 2 * (xx + yy),
      0,
      0,
      0,
      0,
      1
    ]);
  }
  // Compose TRS to a 4×4
  composeMatrix(translation3, rotationQuat, scale4) {
    const m = mat4Impl.identity();
    mat4Impl.translate(m, translation3, m);
    const rot2 = mat4Impl.fromQuat(rotationQuat);
    mat4Impl.multiply(m, rot2, m);
    mat4Impl.scale(m, scale4, m);
    return m;
  }
  decomposeMatrix(m) {
    const t = new Float32Array([m[12], m[13], m[14]]);
    const cx = [m[0], m[1], m[2]];
    const cy = [m[4], m[5], m[6]];
    const cz = [m[8], m[9], m[10]];
    const len2 = (v) => Math.hypot(v[0], v[1], v[2]);
    let sx = len2(cx), sy = len2(cy), sz = len2(cz);
    if (sx === 0) sx = 1;
    if (sy === 0) sy = 1;
    if (sz === 0) sz = 1;
    const r00 = m[0] / sx, r01 = m[4] / sy, r02 = m[8] / sz;
    const r10 = m[1] / sx, r11 = m[5] / sy, r12 = m[9] / sz;
    const r20 = m[2] / sx, r21 = m[6] / sy, r22 = m[10] / sz;
    const det3 = r00 * (r11 * r22 - r12 * r21) - r01 * (r10 * r22 - r12 * r20) + r02 * (r10 * r21 - r11 * r20);
    if (det3 < 0) {
      sz = -sz;
    }
    const trace = r00 + r11 + r22;
    let qx, qy, qz, qw;
    if (trace > 1e-5) {
      const s = Math.sqrt(trace + 1) * 2;
      qw = 0.25 * s;
      qx = (r21 - r12) / s;
      qy = (r02 - r20) / s;
      qz = (r10 - r01) / s;
    } else if (r00 > r11 && r00 > r22) {
      const s = Math.sqrt(1 + r00 - r11 - r22) * 2;
      qw = (r21 - r12) / s;
      qx = 0.25 * s;
      qy = (r01 + r10) / s;
      qz = (r02 + r20) / s;
    } else if (r11 > r22) {
      const s = Math.sqrt(1 + r11 - r00 - r22) * 2;
      qw = (r02 - r20) / s;
      qx = (r01 + r10) / s;
      qy = 0.25 * s;
      qz = (r12 + r21) / s;
    } else {
      const s = Math.sqrt(1 + r22 - r00 - r11) * 2;
      qw = (r10 - r01) / s;
      qx = (r02 + r20) / s;
      qy = (r12 + r21) / s;
      qz = 0.25 * s;
    }
    const rot2 = new Float32Array([qx, qy, qz, qw]);
    const scale4 = new Float32Array([sx, sy, sz]);
    return { translation: t, rotation: rot2, scale: scale4 };
  }
  slerp(q0, q1, t, out) {
    let dot2 = q0[0] * q1[0] + q0[1] * q1[1] + q0[2] * q1[2] + q0[3] * q1[3];
    if (dot2 < 0) {
      dot2 = -dot2;
      q1 = [-q1[0], -q1[1], -q1[2], -q1[3]];
    }
    if (dot2 > 0.9995) {
      for (let i = 0; i < 4; i++) out[i] = q0[i] + t * (q1[i] - q0[i]);
      const len2 = Math.hypot(...out);
      for (let i = 0; i < 4; i++) out[i] /= len2;
      return;
    }
    const theta0 = Math.acos(dot2);
    const theta = theta0 * t;
    const sinTheta = Math.sin(theta);
    const sinTheta0 = Math.sin(theta0);
    const s0 = Math.cos(theta) - dot2 * sinTheta / sinTheta0;
    const s1 = sinTheta / sinTheta0;
    for (let i = 0; i < 4; i++) {
      out[i] = s0 * q0[i] + s1 * q1[i];
    }
  }
  updateSingleBoneCubeAnimation(glbAnimation, nodes, time, boneMatrices) {
    const channels = glbAnimation.channels;
    const samplers = glbAnimation.samplers;
    const nodeChannels = /* @__PURE__ */ new Map();
    for (const channel of channels) {
      if (!nodeChannels.has(channel.target.node)) nodeChannels.set(channel.target.node, []);
      nodeChannels.get(channel.target.node).push(channel);
    }
    for (let j = 0; j < this.skeleton.length; j++) {
      const nodeIndex = this.skeleton[j];
      const node2 = nodes[nodeIndex];
      if (!node2.translation) node2.translation = new Float32Array([0, 0, 0]);
      if (!node2.rotation) node2.rotation = quatImpl.create();
      if (!node2.scale) node2.scale = new Float32Array([1, 1, 1]);
      if (!node2.originalTranslation) node2.originalTranslation = node2.translation.slice();
      if (!node2.originalRotation) node2.originalRotation = node2.rotation.slice();
      if (!node2.originalScale) node2.originalScale = node2.scale.slice();
      const channelsForNode = nodeChannels.get(nodeIndex) || [];
      for (const channel of channelsForNode) {
        const path2 = channel.target.path;
        const sampler = samplers[channel.sampler];
        const inputTimes = this.getAccessorArray(this.glb, sampler.input);
        const outputArray = this.getAccessorArray(this.glb, sampler.output);
        const numComponents = path2 === "rotation" ? 4 : 3;
        const animTime = time % inputTimes[inputTimes.length - 1];
        let i = 0;
        while (i < inputTimes.length - 1 && inputTimes[i + 1] <= animTime) i++;
        const t0 = inputTimes[i];
        const t1 = inputTimes[Math.min(i + 1, inputTimes.length - 1)];
        const factor = t1 !== t0 ? (animTime - t0) / (t1 - t0) : 0;
        const v0 = outputArray.subarray(i * numComponents, (i + 1) * numComponents);
        const v1 = outputArray.subarray(
          Math.min(i + 1, inputTimes.length - 1) * numComponents,
          Math.min(i + 2, inputTimes.length) * numComponents
        );
        if (path2 === "translation") {
          for (let k = 0; k < 3; k++)
            node2.translation[k] = v0[k] * (1 - factor) + v1[k] * factor;
        } else if (path2 === "scale") {
          for (let k = 0; k < 3; k++)
            node2.scale[k] = v0[k] * (1 - factor) + v1[k] * factor;
        } else if (path2 === "rotation") {
          this.slerp(v0, v1, factor, node2.rotation);
        }
      }
      node2.transform = this.composeMatrix(node2.translation, node2.rotation, node2.scale);
    }
    const computeWorld = (nodeIndex) => {
      const node2 = nodes[nodeIndex];
      if (!node2.worldMatrix) node2.worldMatrix = mat4Impl.create();
      let parentWorld = node2.parent !== null ? nodes[node2.parent].worldMatrix : null;
      if (parentWorld) {
        mat4Impl.multiply(parentWorld, node2.transform, node2.worldMatrix);
      } else {
        mat4Impl.copy(node2.transform, node2.worldMatrix);
      }
      mat4Impl.scale(node2.worldMatrix, [this.scaleBoneTest, this.scaleBoneTest, this.scaleBoneTest], node2.worldMatrix);
      if (node2.children) {
        for (const childIndex of node2.children) computeWorld(childIndex);
      }
    };
    for (let i = 0; i < nodes.length; i++) {
      if (nodes[i].parent === null || nodes[i].parent === void 0) {
        computeWorld(i);
      }
    }
    for (let j = 0; j < this.skeleton.length; j++) {
      const jointNode = nodes[this.skeleton[j]];
      const finalMat = mat4Impl.create();
      mat4Impl.multiply(jointNode.worldMatrix, jointNode.inverseBindMatrix, finalMat);
      boneMatrices.set(finalMat, j * 16);
    }
    this.device.queue.writeBuffer(this.bonesBuffer, 0, boneMatrices);
    return boneMatrices;
  }
};

// ../../../shaders/standalone/pointer.effect.js
var pointerEffect = `
struct Camera {
  viewProjMatrix : mat4x4<f32>,
};
@group(0) @binding(0) var<uniform> camera : Camera;

struct Model {
  modelMatrix : mat4x4<f32>,
};
@group(0) @binding(1) var<uniform> model : Model;

struct VertexInput {
  @location(0) position : vec3<f32>,
  @location(1) uv       : vec2<f32>,
};

struct VSOut {
  @builtin(position) Position : vec4<f32>,
  @location(0) v_uv : vec2<f32>,
};

@vertex
fn vsMain(input : VertexInput) -> VSOut {
  var out : VSOut;
  let worldPos = model.modelMatrix * vec4<f32>(input.position,1.0);
  out.Position = camera.viewProjMatrix * worldPos;
  out.v_uv = input.uv;
  return out;
}

@fragment
fn fsMain(input : VSOut) -> @location(0) vec4<f32> {
  // Center the UVs (0.0\u20131.0 \u2192 -1.0\u20131.0)
  let uv = input.v_uv * 2.0 - vec2<f32>(1.0, 1.0);

  // Distance from center
  let dist = length(uv);

  // Glow falloff
  let glow = exp(-dist * 1.0); // try values 3.0\u20136.0 for tighter glow

  // Gradient color (inner bright \u2192 outer dim)
  let baseColor = vec3<f32>(0.2, 0.7, 1.0);
  let glowColor = vec3<f32>(0.7, 0.9, 1.0);

  // Blend based on glow strength
  let color = mix(baseColor, glowColor, glow) * glow;

  return vec4<f32>(color, 1.0);
}`;

// ../../../engine/effects/pointerEffect.js
var PointerEffect = class {
  constructor(device2, format) {
    this.device = device2;
    this.format = format;
    this.enabled = true;
    this._initPipeline();
  }
  _initPipeline() {
    let S = 10;
    const vertexData = new Float32Array([
      -0.5 * S,
      0.5 * S,
      0 * S,
      // top-left
      0.5 * S,
      0.5 * S,
      0 * S,
      // top-right
      -0.1 * S,
      -0.1 * S,
      0 * S,
      // bottom-left
      0.1 * S,
      -0.1 * S,
      0 * S
      // bottom-right
    ]);
    const uvData = new Float32Array([
      0,
      0,
      1,
      0,
      0,
      1,
      1,
      1
    ]);
    const indexData = new Uint16Array([
      0,
      2,
      1,
      1,
      2,
      3
    ]);
    this.vertexBuffer = this.device.createBuffer({
      size: vertexData.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
    });
    this.device.queue.writeBuffer(this.vertexBuffer, 0, vertexData);
    this.uvBuffer = this.device.createBuffer({
      size: uvData.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
    });
    this.device.queue.writeBuffer(this.uvBuffer, 0, uvData);
    this.indexBuffer = this.device.createBuffer({
      size: Math.ceil(indexData.byteLength / 4) * 4,
      usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST
    });
    this.device.queue.writeBuffer(this.indexBuffer, 0, indexData);
    this.indexCount = indexData.length;
    this.cameraBuffer = this.device.createBuffer({
      size: 64,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });
    this.modelBuffer = this.device.createBuffer({
      size: 64,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });
    const bindGroupLayout = this.device.createBindGroupLayout({
      entries: [
        { binding: 0, visibility: GPUShaderStage.VERTEX, buffer: {} },
        { binding: 1, visibility: GPUShaderStage.VERTEX, buffer: {} }
      ]
    });
    this.bindGroup = this.device.createBindGroup({
      layout: bindGroupLayout,
      entries: [
        { binding: 0, resource: { buffer: this.cameraBuffer } },
        { binding: 1, resource: { buffer: this.modelBuffer } }
      ]
    });
    const shaderModule = this.device.createShaderModule({ code: pointerEffect });
    const pipelineLayout = this.device.createPipelineLayout({ bindGroupLayouts: [bindGroupLayout] });
    this.pipeline = this.device.createRenderPipeline({
      layout: pipelineLayout,
      vertex: {
        module: shaderModule,
        entryPoint: "vsMain",
        buffers: [
          { arrayStride: 3 * 4, attributes: [{ shaderLocation: 0, offset: 0, format: "float32x3" }] },
          { arrayStride: 2 * 4, attributes: [{ shaderLocation: 1, offset: 0, format: "float32x2" }] }
        ]
      },
      fragment: {
        module: shaderModule,
        entryPoint: "fsMain",
        targets: [{ format: this.format }]
      },
      primitive: { topology: "triangle-list" },
      depthStencil: { depthWriteEnabled: true, depthCompare: "always", format: "depth24plus" }
    });
  }
  draw(pass2, cameraMatrix, modelMatrix) {
    this.device.queue.writeBuffer(this.cameraBuffer, 0, cameraMatrix);
    this.device.queue.writeBuffer(this.modelBuffer, 0, modelMatrix);
    pass2.setPipeline(this.pipeline);
    pass2.setBindGroup(0, this.bindGroup);
    pass2.setVertexBuffer(0, this.vertexBuffer);
    pass2.setVertexBuffer(1, this.uvBuffer);
    pass2.setIndexBuffer(this.indexBuffer, "uint16");
    pass2.drawIndexed(this.indexCount);
  }
  render(transPass, mesh, viewProjMatrix) {
    const objPos = mesh.position;
    const modelMatrix = mat4Impl.identity();
    mat4Impl.translate(modelMatrix, [objPos.x, objPos.y + 60, objPos.z], modelMatrix);
    this.draw(transPass, viewProjMatrix, modelMatrix);
  }
};

// ../../../shaders/instanced/fragment.instanced.wgsl.js
var fragmentWGSLInstanced = `
override shadowDepthTextureSize: f32 = 1024.0;
const PI: f32 = 3.141592653589793;

struct Scene {
    lightViewProjMatrix  : mat4x4f,
    cameraViewProjMatrix : mat4x4f,
    cameraPos            : vec3f,
    padding2             : f32,
    lightPos             : vec3f,
    padding              : f32,
    globalAmbient        : vec3f,
    padding3             : f32,
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

struct MaterialPBR {
    baseColorFactor : vec4f,
    metallicFactor  : f32,
    roughnessFactor : f32,
    _pad1           : f32,
    _pad2           : f32,
};

struct PBRMaterialData {
    baseColor : vec3f,
    metallic  : f32,
    roughness : f32,
    alpha     : f32,
};

const MAX_SPOTLIGHTS = 20u;

@group(0) @binding(0) var<uniform> scene : Scene;
@group(0) @binding(1) var shadowMapArray: texture_depth_2d_array;
@group(0) @binding(2) var shadowSampler: sampler_comparison;
@group(0) @binding(3) var meshTexture: texture_2d<f32>;
@group(0) @binding(4) var meshSampler: sampler;
@group(0) @binding(5) var<uniform> spotlights: array<SpotLight, MAX_SPOTLIGHTS>;

// PBR textures
@group(0) @binding(6) var metallicRoughnessTex: texture_2d<f32>;
@group(0) @binding(7) var metallicRoughnessSampler: sampler;
@group(0) @binding(8) var<uniform> material: MaterialPBR;

// RPG or any other usage [selected obj effect]
@group(2) @binding(0) var<uniform> uSelected : f32;

struct FragmentInput {
    @location(0) shadowPos : vec4f,
    @location(1) fragPos   : vec3f,
    @location(2) fragNorm  : vec3f,
    @location(3) uv        : vec2f,
    @location(4) colorMult : vec4f,
};

fn getPBRMaterial(uv: vec2f) -> PBRMaterialData {
    let texColor = textureSample(meshTexture, meshSampler, uv);
    let baseColor = texColor.rgb * material.baseColorFactor.rgb;
    let mrTex = textureSample(metallicRoughnessTex, metallicRoughnessSampler, uv);
    let metallic = mrTex.b * material.metallicFactor;
    let roughness = mrTex.g * material.roughnessFactor;
    
    // \u2705 Get alpha from texture and material factor
    // let alpha = texColor.a * material.baseColorFactor.a;
    let alpha = material.baseColorFactor.a;
    
    return PBRMaterialData(baseColor, metallic, roughness, alpha);
}

fn fresnelSchlick(cosTheta: f32, F0: vec3f) -> vec3f {
    return F0 + (1.0 - F0) * pow(1.0 - cosTheta, 5.0);
}

fn distributionGGX(N: vec3f, H: vec3f, roughness: f32) -> f32 {
    let a = roughness * roughness;
    let a2 = a * a;
    let NdotH = max(dot(N, H), 0.0);
    let NdotH2 = NdotH * NdotH;
    let denom = (NdotH2 * (a2 - 1.0) + 1.0);
    return a2 / (PI * denom * denom);
}

fn geometrySchlickGGX(NdotV: f32, roughness: f32) -> f32 {
    let r = (roughness + 1.0);
    let k = (r * r) / 8.0;
    return NdotV / (NdotV * (1.0 - k) + k);
}

fn geometrySmith(N: vec3f, V: vec3f, L: vec3f, roughness: f32) -> f32 {
    let NdotV = max(dot(N, V), 0.0);
    let NdotL = max(dot(N, L), 0.0);
    return geometrySchlickGGX(NdotV, roughness) * geometrySchlickGGX(NdotL, roughness);
}

fn calculateSpotlightFactor(light: SpotLight, fragPos: vec3f) -> f32 {
    let L = normalize(light.position - fragPos);
    let theta = dot(L, normalize(-light.direction));
    let epsilon = light.innerCutoff - light.outerCutoff;
    return clamp((theta - light.outerCutoff) / epsilon, 0.0, 1.0);
}

fn computeSpotLight2(light: SpotLight, N: vec3f, fragPos: vec3f, V: vec3f, material: PBRMaterialData) -> vec3f {
    let L = normalize(light.position - fragPos);
    let NdotL = max(dot(N, L), 0.0);
    if (NdotL <= 0.0) {
        return vec3f(0.0);
    }
    return material.baseColor * light.color * light.intensity * NdotL;
    // return material.baseColor * light.color * light.intensity * NdotL;
}

fn computeSpotLight(light: SpotLight, N: vec3f, fragPos: vec3f, V: vec3f, material: PBRMaterialData) -> vec3f {
    let L = normalize(light.position - fragPos);
    let NdotL = max(dot(N, L), 0.0);

    let theta = dot(L, normalize(-light.direction));
    let epsilon = light.innerCutoff - light.outerCutoff;
    var coneAtten = clamp((theta - light.outerCutoff) / epsilon, 0.0, 1.0);

    // coneAtten = 1.0;
    if (coneAtten <= 0.0 || NdotL <= 0.0) {
        return vec3f(0.0);
    }

    let F0 = mix(vec3f(0.04), material.baseColor.rgb, vec3f(material.metallic));
    let H = normalize(L + V);
    let F = F0 + (1.0 - F0) * pow(1.0 - max(dot(H, V), 0.0), 5.0);

    let alpha = material.roughness * material.roughness;
    let NdotH = max(dot(N, H), 0.0);
    let alpha2 = alpha * alpha;
    let denom = (NdotH * NdotH * (alpha2 - 1.0) + 1.0);
    let D = alpha2 / (PI * denom * denom + 1e-5);

    let k = (alpha + 1.0) * (alpha + 1.0) / 8.0;
    let NdotV = max(dot(N, V), 0.0);
    let Gv = NdotV / (NdotV * (1.0 - k) + k);
    let Gl = NdotL / (NdotL * (1.0 - k) + k);
    let G = Gv * Gl;

    let numerator = D * G * F;
    let denominator = 4.0 * NdotV * NdotL + 1e-5;
    let specular = numerator / denominator;

    let kS = F;
    let kD = (vec3f(1.0) - kS) * (1.0 - material.metallic);
    let diffuse = kD * material.baseColor.rgb / PI;

    let radiance = light.color * light.intensity;
    // return (diffuse + specular) * radiance * NdotL * coneAtten;
    return material.baseColor * light.color * light.intensity * NdotL * coneAtten;
}

fn sampleShadow(shadowUV: vec2f, layer: i32, depthRef: f32, normal: vec3f, lightDir: vec3f) -> f32 {
    var visibility: f32 = 0.0;
    let biasConstant: f32 = 0.001;
    let slopeBias = max(0.002 * (1.0 - dot(normal, lightDir)), 0.0);
    let bias = biasConstant + slopeBias;
    let oneOverSize = 1.0 / (shadowDepthTextureSize * 0.5);
    let offsets: array<vec2f, 9> = array<vec2f, 9>(
        vec2(-1.0, -1.0), vec2(0.0, -1.0), vec2(1.0, -1.0),
        vec2(-1.0,  0.0), vec2(0.0,  0.0), vec2(1.0,  0.0),
        vec2(-1.0,  1.0), vec2(0.0,  1.0), vec2(1.0,  1.0)
    );
    for(var i: u32 = 0u; i < 9u; i = i + 1u) {
        visibility += textureSampleCompare(
            shadowMapArray, shadowSampler,
            shadowUV + offsets[i] * oneOverSize,
            layer, depthRef - bias
        );
    }
    return visibility / 9.0;
}

@fragment
fn main(input: FragmentInput) -> @location(0) vec4f {
    let norm = normalize(input.fragNorm);
    let viewDir = normalize(scene.cameraPos - input.fragPos);

    // \u2705 now we declare materialData
    let materialData = getPBRMaterial(input.uv);

    // \u2705 Early discard for fully transparent pixels (alpha cutoff)
    if (materialData.alpha < 0.01) {
        discard;
    }

    var lightContribution = vec3f(0.0);

    for (var i: u32 = 0u; i < MAX_SPOTLIGHTS; i = i + 1u) {
        let sc = spotlights[i].lightViewProj * vec4<f32>(input.fragPos, 1.0);
        let p  = sc.xyz / sc.w;
        let uv = clamp(p.xy * 0.5 + vec2<f32>(0.5), vec2<f32>(0.0), vec2<f32>(1.0));
        let depthRef = p.z * 0.5 + 0.5;

        let lightDir = normalize(spotlights[i].position - input.fragPos);
        let bias = spotlights[i].shadowBias;
        let visibility = sampleShadow(uv, i32(i), depthRef - bias, norm, lightDir);
        // let visibility = 1.0;
        let contrib = computeSpotLight(spotlights[i], norm, input.fragPos, viewDir, materialData);
        lightContribution += contrib * visibility;
    }

    let texColor = textureSample(meshTexture, meshSampler, input.uv);
    var finalColor = texColor.rgb * (scene.globalAmbient + lightContribution);

    // Apply per-instance tint
    finalColor *= input.colorMult.rgb;

    let N = normalize(input.fragNorm);
    let V = normalize(scene.cameraPos - input.fragPos);
    let fresnel = pow(1.0 - max(dot(N, V), 0.0), 3.0);

    if (uSelected > 0.5) {
        let glowColor = vec3f(0.2, 0.8, 1.0);
        finalColor += glowColor * fresnel * 0.1;
    }

    // let alpha = input.colorMult.a; // use alpha for blending
    // return vec4f(finalColor, alpha);

    let alpha = materialData.alpha;
    return vec4f(finalColor, alpha);
    // return vec4f(1.0, 0.0, 0.0, 0.1);
}`;

// ../../../engine/instanced/materials-instanced.js
var MaterialsInstanced = class {
  constructor(device2, material, glb) {
    this.device = device2;
    this.glb = glb;
    this.material = material;
    this.isVideo = false;
    this.videoIsReady = "NONE";
    this.compareSampler = this.device.createSampler({
      compare: "less-equal",
      // safer for shadow comparison
      addressModeU: "clamp-to-edge",
      // prevents UV leaking outside
      addressModeV: "clamp-to-edge",
      magFilter: "linear",
      // smooth PCF
      minFilter: "linear"
    });
    this.imageSampler = this.device.createSampler({
      magFilter: "linear",
      minFilter: "linear"
    });
    this.videoSampler = this.device.createSampler({
      magFilter: "linear",
      minFilter: "linear"
    });
    this.postFXModeBuffer = this.device.createBuffer({
      size: 4,
      // u32 = 4 bytes
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });
    this.dummySpotlightUniformBuffer = this.device.createBuffer({
      size: 80,
      // Must match size in shader
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });
    this.device.queue.writeBuffer(this.dummySpotlightUniformBuffer, 0, new Float32Array(20));
    const mrDummyTex = this.device.createTexture({
      size: [1, 1, 1],
      format: this.getFormat(),
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST
    });
    const pixel = new Uint8Array([255, 255, 255, 255]);
    this.device.queue.writeTexture(
      { texture: mrDummyTex },
      pixel,
      { bytesPerRow: 4 },
      [1, 1, 1]
    );
    this.metallicRoughnessTextureView = mrDummyTex.createView();
    this.metallicRoughnessSampler = this.device.createSampler({
      magFilter: "linear",
      minFilter: "linear"
    });
    const materialPBRSize = 8 * 4;
    this.materialPBRBuffer = this.device.createBuffer({
      size: materialPBRSize,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });
    const baseColorFactor = [1, 1, 1, 1];
    const metallicFactor = 0.1;
    const roughnessFactor = 0.5;
    const pad = [0, 0];
    const materialArray = new Float32Array([
      ...baseColorFactor,
      metallicFactor,
      roughnessFactor,
      ...pad
    ]);
    this.device.queue.writeBuffer(this.materialPBRBuffer, 0, materialArray.buffer);
    if (this.material.type == "normalmap") {
      const normalTexInfo = this.glb.glbJsonData.materials[0].normalTexture;
      if (normalTexInfo) {
        const tex = this.glb.glbJsonData.glbTextures[normalTexInfo.index];
        this.normalTextureView = tex.createView();
        this.normalSampler = this.device.createSampler({
          magFilter: "linear",
          minFilter: "linear"
        });
      } else {
      }
    } else {
      this.normalDummyTex = device2.createTexture({
        size: [1, 1, 1],
        format: "rgba8unorm",
        usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST
      });
      const neutralNormal = new Uint8Array([128, 128, 255, 255]);
      this.device.queue.writeTexture(
        { texture: this.normalDummyTex },
        neutralNormal,
        { bytesPerRow: 4 },
        [1, 1, 1]
      );
      this.normalTextureView = this.normalDummyTex.createView();
      this.normalSampler = this.device.createSampler({
        magFilter: "linear",
        minFilter: "linear"
      });
    }
    this.createBufferForWater();
  }
  createBufferForWater = () => {
    this.waterBindGroupLayout = this.device.createBindGroupLayout({
      label: "Water MAT Bind Group Layout for main pass",
      entries: [{
        binding: 0,
        visibility: GPUShaderStage.FRAGMENT,
        buffer: {
          type: "uniform"
        }
      }]
    });
    this.waterParamsBuffer = this.device.createBuffer({
      size: 48,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });
    this.waterParamsData = new Float32Array([
      0,
      0.2,
      0.4,
      // deepColor (vec3f)
      0.5,
      // waveSpeed
      0,
      0.5,
      0.7,
      // shallowColor (vec3f)
      4,
      // waveScale
      0.15,
      // waveHeight
      3,
      // fresnelPower
      128,
      // specularPower
      0
      // padding
    ]);
    this.device.queue.writeBuffer(this.waterParamsBuffer, 0, this.waterParamsData);
    this.waterBindGroup = this.device.createBindGroup({
      layout: this.waterBindGroupLayout,
      entries: [{
        binding: 0,
        resource: { buffer: this.waterParamsBuffer }
      }]
    });
    this.updateWaterParams = (deepColor, shallowColor, waveSpeed, waveScale, waveHeight, fresnelPower, specularPower) => {
      const data = new Float32Array([
        deepColor[0],
        deepColor[1],
        deepColor[2],
        waveSpeed,
        shallowColor[0],
        shallowColor[1],
        shallowColor[2],
        waveScale,
        waveHeight,
        fresnelPower,
        specularPower,
        0
        // padding
      ]);
      device.queue.writeBuffer(waterParamsBuffer, 0, data);
    };
  };
  changeTexture(newTexture) {
    if (newTexture instanceof GPUTexture) {
      this.texture0 = newTexture;
    } else {
      this.texture0 = { createView: () => newTexture };
    }
    this.isVideo = false;
    this.createBindGroupForRender();
  }
  changeMaterial(newType = "graph", graphShader) {
    this.material.fromGraph = graphShader;
    this.material.type = newType;
    this.setupPipeline();
  }
  setBlend = (alpha) => {
    this.material.useBlend = true;
    this.setupMaterialPBR([1, 1, 1, alpha]);
  };
  getMaterial() {
    if (this.material.type == "standard") {
      return fragmentWGSLInstanced;
    } else if (this.material.type == "pong") {
      return fragmentWGSLPong;
    } else if (this.material.type == "power") {
      return fragmentWGSLPower;
    } else if (this.material.type == "metal") {
      return fragmentWGSLMetal;
    } else if (this.material.type == "normalmap") {
      return fragmentWGSLNormalMap;
    } else if (this.material.type == "water") {
      return fragmentWaterWGSL;
    } else if (this.material.type == "graph") {
      return this.material.fromGraph;
    }
    console.warn("Unknown material type use standard:", this.material?.type);
    return fragmentWGSL;
  }
  getFormat() {
    if (this.material?.format == "darker") {
      return "rgba8unorm-srgb";
    } else if (this.material?.format == "normal") {
      return "rgba8unorm";
    } else {
      return "rgba8unorm";
    }
  }
  setupMaterialPBR(baseColorFactor, metallicFactor, roughnessFactor) {
    if (!metallicFactor) metallicFactor = [0.5, 0.5, 0.5];
    if (!baseColorFactor) baseColorFactor = [1, 1, 1, 0.5];
    if (!roughnessFactor) roughnessFactor = 0.5;
    const pad = [0];
    const materialArray = new Float32Array([
      ...baseColorFactor,
      metallicFactor,
      roughnessFactor,
      0.5,
      ...pad
    ]);
    this.device.queue.writeBuffer(this.materialPBRBuffer, 0, materialArray.buffer);
  }
  updatePostFXMode(mode) {
    const arrayBuffer = new Uint32Array([mode]);
    this.device.queue.writeBuffer(this.postFXModeBuffer, 0, arrayBuffer);
  }
  async loadTex0(texturesPaths2) {
    this.sampler = this.device.createSampler({
      magFilter: "linear",
      minFilter: "linear"
    });
    return new Promise(async (resolve) => {
      const response = await fetch(texturesPaths2[0]);
      const imageBitmap = await createImageBitmap(await response.blob());
      this.texture0 = this.device.createTexture({
        size: [imageBitmap.width, imageBitmap.height, 1],
        // REMOVED 1
        format: this.getFormat(),
        usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT
      });
      this.device.queue.copyExternalImageToTexture(
        { source: imageBitmap },
        { texture: this.texture0 },
        [imageBitmap.width, imageBitmap.height]
      );
      resolve();
    });
  }
  async loadVideoTexture(arg) {
    this.videoIsReady = "MAYBE";
    if (arg.type === "video") {
      this.video = document.createElement("video");
      this.video.src = arg.src || "res/videos/tunel.mp4";
      this.video.crossOrigin = "anonymous";
      this.video.autoplay = true;
      this.video.loop = true;
      document.body.append(this.video);
      this.video.style.display = "none";
      this.video.style.position = "absolute";
      this.video.style.top = "750px";
      this.video.style.left = "50px";
      await this.video.play();
      this.isVideo = true;
    } else if (arg.type === "videoElement") {
      this.video = arg.el;
      await this.video.play();
    } else if (arg.type === "camera") {
      this.video = document.createElement("video");
      this.video.autoplay = true;
      this.video.muted = true;
      this.video.playsInline = true;
      this.video.style.display = "none";
      document.body.append(this.video);
      try {
        const stream = await navigator.mediaDevices?.getUserMedia?.({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: false
        });
        this.video.srcObject = stream;
        await this.video.play();
        this.isVideo = true;
      } catch (err) {
        console.error("\u274C Failed to access camera:", err);
        return;
      }
    } else if (arg.type === "canvas2d") {
      this.video = document.createElement("video");
      this.video.autoplay = true;
      this.video.muted = true;
      this.video.playsInline = true;
      this.video.style.display = "none";
      document.body.append(this.video);
      const stream = arg.el.captureStream?.() || arg.el.mozCaptureStream?.();
      if (!stream) {
        console.error("\u274C Cannot capture stream from canvas2d");
        return;
      }
      this.video.srcObject = stream;
      await this.video.play();
      this.isVideo = true;
    } else if (arg.type === "canvas2d-inline") {
      const canvas = document.createElement("canvas");
      canvas.width = arg.width || 256;
      canvas.height = arg.height || 256;
      const ctx = canvas.getContext("2d");
      if (typeof arg.canvaInlineProgram === "function") {
        const drawLoop = () => {
          arg.canvaInlineProgram(ctx, canvas);
          requestAnimationFrame(drawLoop);
        };
        drawLoop();
      }
      this.video = document.createElement("video");
      this.video.autoplay = true;
      this.video.muted = true;
      this.video.playsInline = true;
      this.video.style.display = "none";
      document.body.append(this.video);
      this.isVideo = true;
      const stream = canvas.captureStream?.() || canvas.mozCaptureStream?.();
      if (!stream) {
        console.error("\u274C Cannot capture stream from inline canvas");
        return;
      }
      this.video.srcObject = stream;
      await this.video.play();
    }
    this.sampler = this.device.createSampler({
      magFilter: "linear",
      minFilter: "linear"
    });
    this.createLayoutForRender();
  }
  updateVideoTexture() {
    if (!this.video || this.video.readyState < 2) return;
    if (!this.externalTexture) {
      this.externalTexture = this.device.importExternalTexture({ source: this.video });
      this.createBindGroupForRender();
      this.videoIsReady = "YES";
      console.log("%c\u2705video bind.", LOG_FUNNY_ARCADE);
    } else {
      this.externalTexture = this.device.importExternalTexture({ source: this.video });
      this.createBindGroupForRender();
    }
  }
  getMaterialTexture(glb, materialIndex) {
    const matDef = glb.glbJsonData.materials[materialIndex];
    if (!matDef) {
      console.warn("[engine] no material in glb...");
      return null;
    }
    if (matDef.pbrMetallicRoughness?.baseColorTexture) {
      const texIndex = matDef.pbrMetallicRoughness.baseColorTexture.index;
      return glb.glbJsonData.glbTextures[texIndex].createView();
    }
    return null;
  }
  getMaterialTextureFromMaterial(material) {
    if (!material || !material.pbrMetallicRoughness) return this.fallbackTextureView;
    const texInfo = material.pbrMetallicRoughness.baseColorTexture;
    if (!texInfo) return this.fallbackTextureView;
    const texIndex = texInfo.index;
    return this.glb.glbTextures[texIndex].createView();
  }
  createBindGroupForRender() {
    let textureResource = this.isVideo ? this.externalTexture : this.texture0.createView();
    if (this.material.useTextureFromGlb === true) {
      const material = this.skinnedNode.mesh.primitives[0].material;
      const textureView = material.baseColorTexture.imageView;
      textureResource = textureView;
    }
    if (!textureResource || !this.sceneUniformBuffer || !this.shadowDepthTextureView) {
      if (!textureResource) console.warn("\u2757Missing res texture: ", textureResource);
      if (!this.sceneUniformBuffer) console.warn("\u2757Missing res: this.sceneUniformBuffer: ", this.sceneUniformBuffer);
      if (!this.shadowDepthTextureView) console.warn("\u2757Missing res: this.shadowDepthTextureView: ", this.shadowDepthTextureView);
      if (typeof textureResource === "undefined") {
        this.updateVideoTexture();
      }
      return;
    }
    if (this.isVideo == true) {
      this.sceneBindGroupForRender = this.device.createBindGroup({
        layout: this.bglForRender,
        entries: [
          { binding: 0, resource: { buffer: this.sceneUniformBuffer } },
          { binding: 1, resource: this.shadowDepthTextureView },
          { binding: 2, resource: this.compareSampler },
          { binding: 3, resource: textureResource },
          { binding: 4, resource: this.videoSampler },
          { binding: 5, resource: { buffer: this.postFXModeBuffer } }
        ]
      });
      if (this.video.paused == true) this.video.play();
    } else {
      this.sceneBindGroupForRender = this.device.createBindGroup({
        layout: this.bglForRender,
        entries: [
          { binding: 0, resource: { buffer: this.sceneUniformBuffer } },
          { binding: 1, resource: this.shadowDepthTextureView },
          { binding: 2, resource: this.compareSampler },
          { binding: 3, resource: textureResource },
          { binding: 4, resource: this.imageSampler },
          { binding: 5, resource: { buffer: !this.spotlightUniformBuffer ? this.dummySpotlightUniformBuffer : this.spotlightUniformBuffer } },
          { binding: 6, resource: this.metallicRoughnessTextureView },
          { binding: 7, resource: this.metallicRoughnessSampler },
          { binding: 8, resource: { buffer: this.materialPBRBuffer } },
          // NEW: dummy normal map
          { binding: 9, resource: this.normalTextureView },
          { binding: 10, resource: this.normalSampler }
        ]
      });
    }
  }
  createLayoutForRender() {
    let e = [
      {
        binding: 0,
        visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
        buffer: { type: "uniform" }
      },
      ...this.isVideo == false ? [
        {
          binding: 1,
          visibility: GPUShaderStage.FRAGMENT,
          texture: {
            sampleType: "depth",
            viewDimension: "2d-array",
            // <- must match shadowMapArray
            multisampled: false
          }
        }
      ] : [{
        binding: 1,
        visibility: GPUShaderStage.FRAGMENT,
        texture: {
          sampleType: "depth",
          viewDimension: "2d"
        }
      }],
      {
        binding: 2,
        visibility: GPUShaderStage.FRAGMENT,
        sampler: { type: "comparison" }
      },
      ...this.isVideo ? [
        // VIDEO
        {
          binding: 3,
          visibility: GPUShaderStage.FRAGMENT,
          externalTexture: {}
        },
        {
          binding: 4,
          visibility: GPUShaderStage.FRAGMENT,
          sampler: { type: "filtering" }
          // for video sampling
        },
        {
          binding: 5,
          visibility: GPUShaderStage.FRAGMENT,
          buffer: { type: "uniform" }
        }
      ] : [
        // IMAGE
        {
          binding: 3,
          visibility: GPUShaderStage.FRAGMENT,
          texture: {
            sampleType: "float",
            viewDimension: "2d"
          }
        },
        {
          binding: 4,
          visibility: GPUShaderStage.FRAGMENT,
          sampler: { type: "filtering" }
        },
        {
          binding: 5,
          visibility: GPUShaderStage.FRAGMENT,
          buffer: { type: "uniform" }
        },
        {
          binding: 6,
          visibility: GPUShaderStage.FRAGMENT,
          texture: {
            sampleType: "float",
            viewDimension: "2d"
          }
        },
        {
          binding: 7,
          visibility: GPUShaderStage.FRAGMENT,
          sampler: { type: "filtering" }
        },
        {
          binding: 8,
          visibility: GPUShaderStage.FRAGMENT,
          buffer: { type: "uniform" }
        },
        {
          binding: 9,
          visibility: GPUShaderStage.FRAGMENT,
          texture: { sampleType: "float", viewDimension: "2d" }
        },
        {
          binding: 10,
          visibility: GPUShaderStage.FRAGMENT,
          sampler: { type: "filtering" }
        }
      ]
    ];
    this.bglForRender = this.device.createBindGroupLayout({ label: "bglForRender", entries: e });
  }
};

// ../../../shaders/instanced/vertex.instanced.wgsl.js
var vertexWGSLInstanced = `const MAX_BONES = 100u;

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

struct InstanceData {
    model     : mat4x4<f32>,
    colorMult : vec4<f32>,
};

struct VertexAnimParams {
  time: f32,
  flags: f32,
  globalIntensity: f32,
  _pad0: f32,
  waveSpeed: f32,
  waveAmplitude: f32,
  waveFrequency: f32,
  _pad1: f32,
  windSpeed: f32,
  windStrength: f32,
  windHeightInfluence: f32,
  windTurbulence: f32,
  pulseSpeed: f32,
  pulseAmount: f32,
  pulseCenterX: f32,
  pulseCenterY: f32,
  twistSpeed: f32,
  twistAmount: f32,
  _pad2: f32,
  _pad3: f32,
  noiseScale: f32,
  noiseStrength: f32,
  noiseSpeed: f32,
  _pad4: f32,
  oceanWaveScale: f32,
  oceanWaveHeight: f32,
  oceanWaveSpeed: f32,
  _pad5: f32,
  displacementStrength: f32,
  displacementSpeed: f32,
  _pad6: f32,
  _pad7: f32,
}

@group(0) @binding(0) var<uniform> scene : Scene;
@group(1) @binding(0) var<storage, read> instances : array<InstanceData>;
@group(1) @binding(1) var<uniform> bones : Bones;
@group(1) @binding(2) var<uniform> vertexAnim : VertexAnimParams;

const ANIM_WAVE: u32  = 1u;
const ANIM_WIND: u32  = 2u;
const ANIM_PULSE: u32 = 4u;
const ANIM_TWIST: u32 = 8u;
const ANIM_NOISE: u32 = 16u;
const ANIM_OCEAN: u32 = 32u;

struct VertexOutput {
  @location(0) shadowPos: vec4f,
  @location(1) fragPos: vec3f,
  @location(2) fragNorm: vec3f,
  @location(3) uv: vec2f,
  @location(4) colorMult: vec4f,
  @builtin(position) Position: vec4f,
}

fn skinVertex(pos: vec4f, nrm: vec3f, joints: vec4<u32>, weights: vec4f) -> SkinResult {
    var skinnedPos  = vec4f(0.0);
    var skinnedNorm = vec3f(0.0);
    for (var i: u32 = 0u; i < 4u; i = i + 1u) {
        let jointIndex = joints[i];
        let w = weights[i];
        if (w > 0.0) {
          let boneMat  = bones.boneMatrices[jointIndex];
          skinnedPos  += (boneMat * pos) * w;
          let boneMat3 = mat3x3f(
            boneMat[0].xyz,
            boneMat[1].xyz,
            boneMat[2].xyz
          );
          skinnedNorm += (boneMat3 * nrm) * w;
        }
    }
    return SkinResult(skinnedPos, skinnedNorm);
}

fn hash(p: vec2f) -> f32 {
  var p3 = fract(vec3f(p.x, p.y, p.x) * 0.13);
  p3 += dot(p3, vec3f(p3.y, p3.z, p3.x) + 3.333);
  return fract((p3.x + p3.y) * p3.z);
}

fn noise(p: vec2f) -> f32 {
  let i = floor(p);
  let f = fract(p);
  let u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i + vec2f(0.0, 0.0)), hash(i + vec2f(1.0, 0.0)), u.x),
    mix(hash(i + vec2f(0.0, 1.0)), hash(i + vec2f(1.0, 1.0)), u.x),
    u.y
  );
}

fn applyWave(pos: vec3f) -> vec3f {
  let wave = sin(pos.x * vertexAnim.waveFrequency + vertexAnim.time * vertexAnim.waveSpeed) *
             cos(pos.z * vertexAnim.waveFrequency + vertexAnim.time * vertexAnim.waveSpeed);
  return vec3f(pos.x, pos.y + wave * vertexAnim.waveAmplitude, pos.z);
}

fn applyWind(pos: vec3f, normal: vec3f) -> vec3f {
  let heightFactor = max(0.0, pos.y) * vertexAnim.windHeightInfluence;
  let windDir = vec2f(
    sin(vertexAnim.time * vertexAnim.windSpeed),
    cos(vertexAnim.time * vertexAnim.windSpeed * 0.7)
  ) * vertexAnim.windStrength;
  let turbulence = noise(vec2f(pos.x, pos.z) * 0.5 + vertexAnim.time * 0.3)
                   * vertexAnim.windTurbulence;
  return vec3f(
    pos.x + windDir.x * heightFactor * (1.0 + turbulence),
    pos.y,
    pos.z + windDir.y * heightFactor * (1.0 + turbulence)
  );
}

fn applyPulse(pos: vec3f) -> vec3f {
  let pulse = sin(vertexAnim.time * vertexAnim.pulseSpeed) * vertexAnim.pulseAmount;
  let scale  = 1.0 + pulse;
  let center = vec3f(vertexAnim.pulseCenterX, 0.0, vertexAnim.pulseCenterY);
  return center + (pos - center) * scale;
}

fn applyTwist(pos: vec3f) -> vec3f {
  let angle = pos.y * vertexAnim.twistAmount * sin(vertexAnim.time * vertexAnim.twistSpeed);
  let cosA  = cos(angle);
  let sinA  = sin(angle);
  return vec3f(
    pos.x * cosA - pos.z * sinA,
    pos.y,
    pos.x * sinA + pos.z * cosA
  );
}

fn applyNoiseDisplacement(pos: vec3f) -> vec3f {
  let noiseVal    = noise(vec2f(pos.x, pos.z) * vertexAnim.noiseScale
                         + vertexAnim.time * vertexAnim.noiseSpeed);
  let displacement = (noiseVal - 0.5) * vertexAnim.noiseStrength;
  return vec3f(pos.x, pos.y + displacement, pos.z);
}

fn applyOcean(pos: vec3f) -> vec3f {
  let t     = vertexAnim.time * vertexAnim.oceanWaveSpeed;
  let scale = vertexAnim.oceanWaveScale;
  let wave1 = sin(dot(pos.xz, vec2f(1.0, 0.0)) * scale + t)             * vertexAnim.oceanWaveHeight;
  let wave2 = sin(dot(pos.xz, vec2f(0.7, 0.7)) * scale * 1.2 + t * 1.3) * vertexAnim.oceanWaveHeight * 0.7;
  let wave3 = sin(dot(pos.xz, vec2f(0.0, 1.0)) * scale * 0.8 + t * 0.9) * vertexAnim.oceanWaveHeight * 0.5;
  return vec3f(pos.x, pos.y + wave1 + wave2 + wave3, pos.z);
}

fn applyVertexAnimation(pos: vec3f, normal: vec3f) -> SkinResult {
  var animatedPos  = pos;
  var animatedNorm = normal;
  let flags = u32(vertexAnim.flags);

  if ((flags & ANIM_WAVE)  != 0u) { animatedPos = applyWave(animatedPos); }
  if ((flags & ANIM_WIND)  != 0u) { animatedPos = applyWind(animatedPos, animatedNorm); }
  if ((flags & ANIM_NOISE) != 0u) { animatedPos = applyNoiseDisplacement(animatedPos); }
  if ((flags & ANIM_OCEAN) != 0u) { animatedPos = applyOcean(animatedPos); }
  if ((flags & ANIM_PULSE) != 0u) { animatedPos = applyPulse(animatedPos); }
  if ((flags & ANIM_TWIST) != 0u) { animatedPos = applyTwist(animatedPos); }

  animatedPos = mix(pos, animatedPos, vertexAnim.globalIntensity);

  if (flags != 0u) {
    let offset  = 0.01;
    let posX    = applyWave(applyNoiseDisplacement(pos + vec3f(offset, 0.0, 0.0)));
    let posZ    = applyWave(applyNoiseDisplacement(pos + vec3f(0.0, 0.0, offset)));
    let tangentX = normalize(posX - animatedPos);
    let tangentZ = normalize(posZ - animatedPos);
    animatedNorm = normalize(cross(tangentZ, tangentX));
  }

  return SkinResult(vec4f(animatedPos, 1.0), animatedNorm);
}

@vertex
fn main(
  @location(0) position : vec3f,
  @location(1) normal   : vec3f,
  @location(2) uv       : vec2f,
  @location(3) joints   : vec4<u32>,
  @location(4) weights  : vec4<f32>,
  @builtin(instance_index) instId: u32
) -> VertexOutput {

  let inst = instances[instId];

  var output : VertexOutput;
  let skinned  = skinVertex(vec4(position, 1.0), normal, joints, weights);
  let animated = applyVertexAnimation(skinned.position.xyz, skinned.normal);

  let worldPos = inst.model * animated.position;

  let normalMatrix = mat3x3f(
    inst.model[0].xyz,
    inst.model[1].xyz,
    inst.model[2].xyz
  );

  output.Position  = scene.cameraViewProjMatrix * worldPos;
  output.fragPos   = worldPos.xyz;
  output.shadowPos = scene.lightViewProjMatrix * worldPos;
  output.fragNorm  = normalize(normalMatrix * animated.normal);
  output.uv        = uv;
  output.colorMult = inst.colorMult;
  return output;
}`;

// ../../../engine/geometry-factory.js
var GeometryFactory = class _GeometryFactory {
  static create(type2, size2 = 1, segments = 16, options2 = {}) {
    switch (type2) {
      case "quad":
        return _GeometryFactory.quad(size2);
      case "cube":
        return _GeometryFactory.cube(size2);
      case "sphere":
        return _GeometryFactory.sphere(size2, segments);
      case "pyramid":
        return _GeometryFactory.pyramid(size2);
      case "star":
        return _GeometryFactory.star(size2);
      case "circle":
        return _GeometryFactory.circle(size2, segments);
      case "circle2":
        return _GeometryFactory.circle2(size2, segments);
      case "diamond":
        return _GeometryFactory.diamond(size2);
      case "rock":
        return _GeometryFactory.rock(size2, options2.detail || 3);
      case "meteor":
        return _GeometryFactory.meteor(size2, options2.detail || 6);
      case "thunder":
        return _GeometryFactory.thunder(size2);
      case "shard":
        return _GeometryFactory.shard(size2);
      case "circlePlane":
        return _GeometryFactory.circlePlane(size2, segments);
      case "ring":
        return _GeometryFactory.ring(size2, options2.innerRatio || 0.7, segments, options2.height || 0.05);
      default:
        throw new Error(`Unknown geometry: ${type2}`);
    }
  }
  // --- BASIC SHAPES ---------------------------------------------------------
  static quad(S = 1) {
    const positions = new Float32Array([
      -S,
      S,
      0,
      S,
      S,
      0,
      -S,
      -S,
      0,
      S,
      -S,
      0
    ]);
    const uvs = new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]);
    const indices = new Uint16Array([0, 2, 1, 1, 2, 3]);
    return { positions, uvs, indices };
  }
  static cube(S = 1) {
    const p = S / 2;
    const positions = new Float32Array([
      -p,
      -p,
      p,
      p,
      -p,
      p,
      p,
      p,
      p,
      -p,
      p,
      p,
      -p,
      -p,
      -p,
      -p,
      p,
      -p,
      p,
      p,
      -p,
      p,
      -p,
      -p,
      -p,
      p,
      -p,
      -p,
      p,
      p,
      p,
      p,
      p,
      p,
      p,
      -p,
      -p,
      -p,
      -p,
      p,
      -p,
      -p,
      p,
      -p,
      p,
      -p,
      -p,
      p,
      p,
      -p,
      -p,
      p,
      p,
      -p,
      p,
      p,
      p,
      p,
      -p,
      p,
      -p,
      -p,
      -p,
      -p,
      -p,
      p,
      -p,
      p,
      p,
      -p,
      p,
      -p
    ]);
    const uvs = new Float32Array(6 * 8).fill(0);
    const indices = [];
    for (let i2 = 0; i2 < 6; i2++) {
      const o2 = i2 * 4;
      indices.push(o2, o2 + 1, o2 + 2, o2, o2 + 2, o2 + 3);
    }
    let i = new Uint16Array(i);
    return { positions, uvs, i };
  }
  static sphere(R = 0.1, seg = 16) {
    const p = [], uv = [], ind = [];
    for (let y2 = 0; y2 <= seg; y2++) {
      const v = y2 / seg, \u03B8 = v * Math.PI;
      for (let x2 = 0; x2 <= seg; x2++) {
        const u = x2 / seg, \u03C6 = u * Math.PI * 2;
        p.push(R * Math.sin(\u03B8) * Math.cos(\u03C6), R * Math.cos(\u03B8), R * Math.sin(\u03B8) * Math.sin(\u03C6));
        uv.push(u, v);
      }
    }
    for (let y2 = 0; y2 < seg; y2++) {
      for (let x2 = 0; x2 < seg; x2++) {
        const i = y2 * (seg + 1) + x2;
        ind.push(i, i + seg + 1, i + 1, i + 1, i + seg + 1, i + seg + 2);
      }
    }
    return { positions: new Float32Array(p), uvs: new Float32Array(uv), indices: new Uint16Array(ind) };
  }
  static pyramid(S = 1) {
    const h = S, p = S / 2;
    const pos2 = new Float32Array([
      -p,
      0,
      -p,
      p,
      0,
      -p,
      p,
      0,
      p,
      -p,
      0,
      p,
      0,
      h,
      0
    ]);
    const uv = new Float32Array([0, 0, 1, 0, 1, 1, 0, 1, 0.5, 0]);
    const idx = new Uint16Array([0, 1, 2, 0, 2, 3, 0, 1, 4, 1, 2, 4, 2, 3, 4, 3, 0, 4]);
    return { positions: pos2, uvs: uv, indices: idx };
  }
  static star(S = 1) {
    const R = S, r2 = S * 0.4, v = [], uv = [], ind = [];
    for (let i = 0; i < 10; i++) {
      const a = i / 10 * Math.PI * 2;
      const rr = i % 2 ? r2 : R;
      v.push(Math.cos(a) * rr, Math.sin(a) * rr, 0);
      uv.push((Math.cos(a) + 1) / 2, (Math.sin(a) + 1) / 2);
    }
    for (let i = 1; i < 9; i++) ind.push(0, i, i + 1);
    ind.push(0, 9, 1);
    return { positions: new Float32Array(v), uvs: new Float32Array(uv), indices: new Uint16Array(ind) };
  }
  static circle(R = 1, seg = 32) {
    const p = [0, 0, 0], uv = [0.5, 0.5], ind = [];
    for (let i = 0; i <= seg; i++) {
      const a = i / seg * Math.PI * 2;
      p.push(Math.cos(a) * R, Math.sin(a) * R, 0);
      uv.push((Math.cos(a) + 1) / 2, (Math.sin(a) + 1) / 2);
      if (i > 1) ind.push(0, i - 1, i);
    }
    return { positions: new Float32Array(p), uvs: new Float32Array(uv), indices: new Uint16Array(ind) };
  }
  static circle2(radius = 1, segments = 64) {
    const positions = [0, 0, 0];
    const uvs = [0.5, 0.5];
    const indices = [];
    for (let i = 0; i <= segments; i++) {
      const angle2 = i / segments * Math.PI * 2;
      const x2 = Math.cos(angle2) * radius;
      const y2 = Math.sin(angle2) * radius;
      positions.push(x2, y2, 0);
      uvs.push((x2 / radius + 1) / 2, (y2 / radius + 1) / 2);
      if (i > 0) {
        indices.push(0, i, i + 1);
      }
    }
    indices.push(0, segments + 1, 1);
    return {
      positions: new Float32Array(positions),
      uvs: new Float32Array(uvs),
      indices: new Uint16Array(indices)
    };
  }
  static diamond(S = 1) {
    const h = S, p = S / 2;
    const pos2 = new Float32Array([
      0,
      h,
      0,
      -p,
      0,
      -p,
      p,
      0,
      -p,
      p,
      0,
      p,
      -p,
      0,
      p,
      0,
      -h,
      0
    ]);
    const uv = new Float32Array(6 * 2).fill(0);
    const idx = new Uint16Array([
      0,
      1,
      2,
      0,
      2,
      3,
      0,
      3,
      4,
      0,
      4,
      1,
      5,
      2,
      1,
      5,
      3,
      2,
      5,
      4,
      3,
      5,
      1,
      4
    ]);
    return { positions: pos2, uvs: uv, indices: idx };
  }
  // --- FANTASY & EFFECT GEOMETRIES -----------------------------------------
  static thunder(S = 1) {
    const pts = [0, 0, 0];
    for (let i = 1; i < 8; i++) {
      const x2 = (Math.random() - 0.5) * 0.2 * S;
      const y2 = i * (S / 7);
      const z = (Math.random() - 0.5) * 0.1 * S;
      pts.push(x2, y2, z);
    }
    const p = [], uv = [], ind = [];
    for (let i = 0; i < pts.length / 3 - 1; i++) {
      const x1 = pts[i * 3], y1 = pts[i * 3 + 1], z1 = pts[i * 3 + 2];
      const x2 = pts[(i + 1) * 3], y2 = pts[(i + 1) * 3 + 1], z2 = pts[(i + 1) * 3 + 2];
      const w = 0.03 * S;
      p.push(x1 - w, y1, z1, x1 + w, y1, z1, x2 - w, y2, z2, x2 + w, y2, z2);
      uv.push(0, 0, 1, 0, 0, 1, 1, 1);
      const o2 = i * 4;
      ind.push(o2, o2 + 1, o2 + 2, o2 + 1, o2 + 3, o2 + 2);
    }
    return { positions: new Float32Array(p), uvs: new Float32Array(uv), indices: new Uint16Array(ind) };
  }
  static rock(S = 1, detail = 4) {
    const base = _GeometryFactory.sphere(S, detail);
    const p = base.positions;
    for (let i = 0; i < p.length; i += 3) {
      const n2 = Math.random() * 0.3 + 0.85;
      p[i] *= n2;
      p[i + 1] *= n2;
      p[i + 2] *= n2;
    }
    return base;
  }
  static meteor(S = 1, detail = 6) {
    const base = _GeometryFactory.rock(S, detail);
    const p = base.positions;
    for (let i = 0; i < p.length; i += 3) {
      p[i + 1] *= 1.4 + Math.random() * 0.5;
      p[i] *= 0.8 + Math.random() * 0.3;
    }
    return base;
  }
  static shard(S = 1) {
    const positions = new Float32Array([
      0,
      0,
      0,
      S * 0.3,
      0,
      S * 0.2,
      -S * 0.2,
      0,
      S * 0.3,
      0,
      S * 1.2,
      0
    ]);
    const uvs = new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]);
    const indices = new Uint16Array([0, 1, 2, 1, 2, 3, 0, 2, 3, 0, 1, 3]);
    return { positions, uvs, indices };
  }
  static circlePlane(radius = 1, segments = 32) {
    const positions = [];
    const uvs = [];
    const indices = [];
    positions.push(0, 0, 0);
    uvs.push(0.5, 0.5);
    for (let i = 0; i <= segments; i++) {
      const angle2 = i / segments * Math.PI * 2;
      const x2 = Math.cos(angle2) * radius;
      const y2 = 0;
      const z = Math.sin(angle2) * radius;
      positions.push(x2, y2, z);
      uvs.push((x2 / radius + 1) / 2, (z / radius + 1) / 2);
    }
    for (let i = 1; i <= segments; i++) {
      indices.push(0, i, i + 1);
    }
    return {
      positions: new Float32Array(positions),
      uvs: new Float32Array(uvs),
      indices: new Uint16Array(indices)
    };
  }
  static ring(outerRadius = 4, innerRadiusRatio = 0.7, segments = 48, height = 0.05) {
    const innerRadius = outerRadius * innerRadiusRatio;
    const positions = [];
    const uvs = [];
    const indices = [];
    for (let i = 0; i <= segments; i++) {
      const angle2 = i / segments * Math.PI * 2;
      const cos = Math.cos(angle2);
      const sin = Math.sin(angle2);
      positions.push(cos * outerRadius, 0, sin * outerRadius);
      uvs.push((cos + 1) / 2, (sin + 1) / 2);
      positions.push(cos * innerRadius, height, sin * innerRadius);
      uvs.push((cos * innerRadius / outerRadius + 1) / 2, (sin * innerRadius / outerRadius + 1) / 2);
    }
    for (let i = 0; i < segments * 2; i += 2) {
      indices.push(i, i + 1, i + 2);
      indices.push(i + 1, i + 3, i + 2);
    }
    return {
      positions: new Float32Array(positions),
      uvs: new Float32Array(uvs),
      indices: new Uint16Array(indices)
    };
  }
};

// ../../../shaders/standalone/geo.instanced.js
var geoInstancedEffect = `struct Camera {
  viewProjMatrix : mat4x4<f32>,
};
@group(0) @binding(0) var<uniform> camera : Camera;

// --- INSTANCE STORAGE BUFFER ----------------------------------------------
struct InstanceData {
  model : mat4x4<f32>,
  color : vec4<f32>,
};
@group(0) @binding(1) var<storage, read> instances : array<InstanceData>;

struct VertexInput {
  @location(0) position : vec3<f32>,
  @location(1) uv       : vec2<f32>,
};

struct VSOut {
  @builtin(position) Position : vec4<f32>,
  @location(0) v_uv : vec2<f32>,
  @location(1) v_color : vec4<f32>,
};

@vertex
fn vsMain(input : VertexInput, @builtin(instance_index) instanceIndex: u32) -> VSOut {
  var out : VSOut;

  // Use per-instance model matrix & color
  let modelMatrix = instances[instanceIndex].model;
  let color = instances[instanceIndex].color;

  let worldPos = modelMatrix * vec4<f32>(input.position,1.0);
  out.Position = camera.viewProjMatrix * worldPos;
  out.v_uv = input.uv;
  out.v_color = color;
  return out;
}

@fragment
fn fsMain(input : VSOut) -> @location(0) vec4<f32> {
  let uv = input.v_uv * 2.0 - vec2<f32>(1.0, 1.0);
  let dist = length(uv);
  let glow = exp(-dist * 1.0);
  let baseColor = vec3<f32>(0.2, 0.7, 1.0);
  let glowColor = vec3<f32>(0.7, 0.9, 1.0);
  let color = mix(baseColor, glowColor, glow) * glow * input.v_color.rgb;
  let alpha = input.v_color.a;
  return vec4<f32>(color, alpha);
}
`;

// ../../../engine/effects/gen.js
var GenGeo = class {
  constructor(device2, format, type2 = "sphere", scale4 = 1) {
    this.device = device2;
    this.format = format;
    const geom = GeometryFactory.create(type2, scale4);
    this.vertexData = geom.positions;
    this.uvData = geom.uvs;
    this.indexData = geom.indices;
    this.enabled = true;
    this._initPipeline();
  }
  _initPipeline() {
    const { vertexData, uvData, indexData } = this;
    this.vertexBuffer = this.device.createBuffer({
      size: vertexData.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
    });
    this.device.queue.writeBuffer(this.vertexBuffer, 0, vertexData);
    this.uvBuffer = this.device.createBuffer({
      size: uvData.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
    });
    this.device.queue.writeBuffer(this.uvBuffer, 0, uvData);
    this.indexBuffer = this.device.createBuffer({
      size: Math.ceil(indexData.byteLength / 4) * 4,
      usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST
    });
    this.device.queue.writeBuffer(this.indexBuffer, 0, indexData);
    this.indexCount = indexData.length;
    this.cameraBuffer = this.device.createBuffer({
      size: 64,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });
    this.instanceTargets = [];
    this.lerpSpeed = 0.05;
    this.maxInstances = 5;
    this.instanceCount = 2;
    this.floatsPerInstance = 16 + 4;
    for (let x2 = 0; x2 < this.maxInstances; x2++) {
      this.instanceTargets.push({
        index: x2,
        position: [0, 0, 0],
        currentPosition: [0, 0, 0],
        scale: [1, 1, 1],
        currentScale: [1, 1, 1],
        color: [0.6, 0.8, 1, 0.4]
      });
    }
    this.instanceData = new Float32Array(this.instanceCount * this.floatsPerInstance);
    this.modelBuffer = this.device.createBuffer({
      size: this.instanceData.byteLength,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
    });
    const bindGroupLayout = this.device.createBindGroupLayout({
      entries: [
        { binding: 0, visibility: GPUShaderStage.VERTEX, buffer: {} },
        { binding: 1, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: { type: "read-only-storage" } }
      ]
    });
    this.bindGroup = this.device.createBindGroup({
      layout: bindGroupLayout,
      entries: [
        { binding: 0, resource: { buffer: this.cameraBuffer } },
        { binding: 1, resource: { buffer: this.modelBuffer } }
      ]
    });
    const shaderModule = this.device.createShaderModule({ code: geoInstancedEffect });
    const pipelineLayout = this.device.createPipelineLayout({ bindGroupLayouts: [bindGroupLayout] });
    this.pipeline = this.device.createRenderPipeline({
      layout: pipelineLayout,
      vertex: {
        module: shaderModule,
        entryPoint: "vsMain",
        buffers: [
          { arrayStride: 3 * 4, attributes: [{ shaderLocation: 0, offset: 0, format: "float32x3" }] },
          { arrayStride: 2 * 4, attributes: [{ shaderLocation: 1, offset: 0, format: "float32x2" }] }
        ]
      },
      fragment: {
        module: shaderModule,
        entryPoint: "fsMain",
        targets: [{
          format: this.format,
          blend: {
            color: {
              srcFactor: "src-alpha",
              dstFactor: "one-minus-src-alpha",
              operation: "add"
            },
            alpha: {
              srcFactor: "one",
              dstFactor: "one-minus-src-alpha",
              operation: "add"
            }
          }
        }]
      },
      primitive: { topology: "triangle-list" },
      depthStencil: { depthWriteEnabled: false, depthCompare: "less-equal", format: "depth24plus" }
    });
  }
  updateInstanceData = (baseModelMatrix) => {
    const count = Math.min(this.instanceCount, this.maxInstances);
    for (let i = 0; i < count; i++) {
      const t = this.instanceTargets[i];
      for (let j = 0; j < 3; j++) {
        t.currentPosition[j] += (t.position[j] - t.currentPosition[j]) * this.lerpSpeed;
        t.currentScale[j] += (t.scale[j] - t.currentScale[j]) * this.lerpSpeed;
      }
      const local = mat4Impl.identity();
      mat4Impl.translate(local, t.currentPosition, local);
      mat4Impl.scale(local, t.currentScale, local);
      const finalMat = mat4Impl.identity();
      mat4Impl.multiply(baseModelMatrix, local, finalMat);
      const offset = i * this.floatsPerInstance;
      this.instanceData.set(finalMat, offset);
      this.instanceData.set(t.color, offset + 16);
    }
    const activeFloatCount = count * this.floatsPerInstance;
    const activeBytes = activeFloatCount * 4;
    this.device.queue.writeBuffer(this.modelBuffer, 0, this.instanceData.subarray(0, activeFloatCount));
  };
  draw(pass2, cameraMatrix) {
    this.device.queue.writeBuffer(this.cameraBuffer, 0, cameraMatrix);
    pass2.setPipeline(this.pipeline);
    pass2.setBindGroup(0, this.bindGroup);
    pass2.setVertexBuffer(0, this.vertexBuffer);
    pass2.setVertexBuffer(1, this.uvBuffer);
    pass2.setIndexBuffer(this.indexBuffer, "uint16");
    pass2.drawIndexed(this.indexCount, this.instanceCount);
  }
  render(transPass, mesh, viewProjMatrix) {
    this.draw(transPass, viewProjMatrix);
  }
};

// ../../../shaders/energy-bars/energy-bar-shader.js
var hpBarEffectShaders = `
struct Camera {
  viewProj : mat4x4f
};
struct Model {
  model : mat4x4f,
  color : vec4f,
  progress : f32,
};

@group(0) @binding(0) var<uniform> camera : Camera;
@group(0) @binding(1) var<uniform> model : Model;

struct VertexOutput {
  @builtin(position) position : vec4f,
  @location(0) uv : vec2f,
};

@vertex
fn vsMain(
  @location(0) position : vec3f,
  @location(1) uv : vec2f
) -> VertexOutput {
  var output : VertexOutput;
  output.position = camera.viewProj * model.model * vec4f(position, 1.0);
  output.uv = uv;
  return output;
}

@fragment
fn fsMain(in : VertexOutput) -> @location(0) vec4f {
  // simple left-to-right fill based on progress
  if (in.uv.x > model.progress) {
    return vec4f(0.1, 0.1, 0.1, 0.3); // empty (transparent gray)
  }
  return model.color; // filled
}
`;

// ../../../engine/effects/energy-bar.js
var HPBarEffect = class {
  constructor(device2, format) {
    this.device = device2;
    this.format = format;
    this.progress = 1;
    this.color = [0.1, 0.9, 0.1, 1];
    this.offsetY = 48;
    this.enabled = true;
    this._initPipeline();
  }
  _initPipeline() {
    const W = 40;
    const H = 3;
    const vertexData = new Float32Array([
      -0.5 * W,
      0.5 * H,
      0,
      0.5 * W,
      0.5 * H,
      0,
      -0.5 * W,
      -0.5 * H,
      0,
      0.5 * W,
      -0.5 * H,
      0
    ]);
    const uvData = new Float32Array([
      0,
      1,
      1,
      1,
      0,
      0,
      1,
      0
    ]);
    const indexData = new Uint16Array([0, 2, 1, 1, 2, 3]);
    this.vertexBuffer = this.device.createBuffer({
      size: vertexData.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
    });
    this.device.queue.writeBuffer(this.vertexBuffer, 0, vertexData);
    this.uvBuffer = this.device.createBuffer({
      size: uvData.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
    });
    this.device.queue.writeBuffer(this.uvBuffer, 0, uvData);
    this.indexBuffer = this.device.createBuffer({
      size: Math.ceil(indexData.byteLength / 4) * 4,
      usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST
    });
    this.device.queue.writeBuffer(this.indexBuffer, 0, indexData);
    this.indexCount = indexData.length;
    this.cameraBuffer = this.device.createBuffer({
      size: 64,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });
    this.modelBuffer = this.device.createBuffer({
      size: 64 + 16 + 16,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });
    const bindGroupLayout = this.device.createBindGroupLayout({
      entries: [
        { binding: 0, visibility: GPUShaderStage.VERTEX, buffer: {} },
        { binding: 1, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: {} }
      ]
    });
    this.bindGroup = this.device.createBindGroup({
      layout: bindGroupLayout,
      entries: [
        { binding: 0, resource: { buffer: this.cameraBuffer } },
        { binding: 1, resource: { buffer: this.modelBuffer } }
      ]
    });
    const shaderModule = this.device.createShaderModule({ code: hpBarEffectShaders });
    const pipelineLayout = this.device.createPipelineLayout({ bindGroupLayouts: [bindGroupLayout] });
    this.pipeline = this.device.createRenderPipeline({
      layout: pipelineLayout,
      vertex: {
        module: shaderModule,
        entryPoint: "vsMain",
        buffers: [
          { arrayStride: 3 * 4, attributes: [{ shaderLocation: 0, offset: 0, format: "float32x3" }] },
          { arrayStride: 2 * 4, attributes: [{ shaderLocation: 1, offset: 0, format: "float32x2" }] }
        ]
      },
      fragment: {
        module: shaderModule,
        entryPoint: "fsMain",
        targets: [{ format: this.format }]
      },
      primitive: { topology: "triangle-list" },
      depthStencil: { depthWriteEnabled: false, depthCompare: "always", format: "depth24plus" }
    });
  }
  setProgress(value) {
    this.progress = Math.max(0, Math.min(1, value));
  }
  setColor(r2, g, b, a = 1) {
    this.color = [r2, g, b, a];
  }
  draw(pass2, cameraMatrix, modelMatrix) {
    const color = new Float32Array(this.color);
    const progressData = new Float32Array([this.progress]);
    const buffer = new ArrayBuffer(64 + 16 + 4);
    const f32 = new Float32Array(buffer);
    f32.set(cameraMatrix, 0);
    this.device.queue.writeBuffer(this.cameraBuffer, 0, cameraMatrix);
    this.device.queue.writeBuffer(this.modelBuffer, 0, modelMatrix);
    this.device.queue.writeBuffer(this.modelBuffer, 64, color);
    this.device.queue.writeBuffer(this.modelBuffer, 64 + 16, progressData);
    pass2.setPipeline(this.pipeline);
    pass2.setBindGroup(0, this.bindGroup);
    pass2.setVertexBuffer(0, this.vertexBuffer);
    pass2.setVertexBuffer(1, this.uvBuffer);
    pass2.setIndexBuffer(this.indexBuffer, "uint16");
    pass2.drawIndexed(this.indexCount);
  }
  render(pass2, mesh, viewProjMatrix) {
    const pos2 = mesh.position;
    const modelMatrix = mat4Impl.identity();
    mat4Impl.translate(modelMatrix, [pos2.x, pos2.y + this.offsetY, pos2.z], modelMatrix);
    this.draw(pass2, viewProjMatrix, modelMatrix);
  }
};

// ../../../engine/effects/mana-bar.js
var MANABarEffect = class {
  constructor(device2, format) {
    this.device = device2;
    this.format = format;
    this.progress = 1;
    this.color = [0.1, 0.1, 0.9, 1];
    this.offsetY = 45;
    this.enabled = true;
    this._initPipeline();
  }
  _initPipeline() {
    const W = 40;
    const H = 3;
    const vertexData = new Float32Array([
      -0.5 * W,
      0.5 * H,
      0,
      0.5 * W,
      0.5 * H,
      0,
      -0.5 * W,
      -0.5 * H,
      0,
      0.5 * W,
      -0.5 * H,
      0
    ]);
    const uvData = new Float32Array([
      0,
      1,
      1,
      1,
      0,
      0,
      1,
      0
    ]);
    const indexData = new Uint16Array([0, 2, 1, 1, 2, 3]);
    this.vertexBuffer = this.device.createBuffer({
      size: vertexData.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
    });
    this.device.queue.writeBuffer(this.vertexBuffer, 0, vertexData);
    this.uvBuffer = this.device.createBuffer({
      size: uvData.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
    });
    this.device.queue.writeBuffer(this.uvBuffer, 0, uvData);
    this.indexBuffer = this.device.createBuffer({
      size: Math.ceil(indexData.byteLength / 4) * 4,
      usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST
    });
    this.device.queue.writeBuffer(this.indexBuffer, 0, indexData);
    this.indexCount = indexData.length;
    this.cameraBuffer = this.device.createBuffer({
      size: 64,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });
    this.modelBuffer = this.device.createBuffer({
      size: 64 + 16 + 16,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });
    const bindGroupLayout = this.device.createBindGroupLayout({
      entries: [
        { binding: 0, visibility: GPUShaderStage.VERTEX, buffer: {} },
        { binding: 1, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: {} }
      ]
    });
    this.bindGroup = this.device.createBindGroup({
      layout: bindGroupLayout,
      entries: [
        { binding: 0, resource: { buffer: this.cameraBuffer } },
        { binding: 1, resource: { buffer: this.modelBuffer } }
      ]
    });
    const shaderModule = this.device.createShaderModule({ code: hpBarEffectShaders });
    const pipelineLayout = this.device.createPipelineLayout({ bindGroupLayouts: [bindGroupLayout] });
    this.pipeline = this.device.createRenderPipeline({
      layout: pipelineLayout,
      vertex: {
        module: shaderModule,
        entryPoint: "vsMain",
        buffers: [
          { arrayStride: 3 * 4, attributes: [{ shaderLocation: 0, offset: 0, format: "float32x3" }] },
          { arrayStride: 2 * 4, attributes: [{ shaderLocation: 1, offset: 0, format: "float32x2" }] }
        ]
      },
      fragment: {
        module: shaderModule,
        entryPoint: "fsMain",
        targets: [{ format: this.format }]
      },
      primitive: { topology: "triangle-list" },
      depthStencil: { depthWriteEnabled: false, depthCompare: "always", format: "depth24plus" }
    });
  }
  setProgress(value) {
    this.progress = Math.max(0, Math.min(1, value));
  }
  setColor(r2, g, b, a = 1) {
    this.color = [r2, g, b, a];
  }
  draw(pass2, cameraMatrix, modelMatrix) {
    const color = new Float32Array(this.color);
    const progressData = new Float32Array([this.progress]);
    const buffer = new ArrayBuffer(64 + 16 + 4);
    const f32 = new Float32Array(buffer);
    f32.set(cameraMatrix, 0);
    this.device.queue.writeBuffer(this.cameraBuffer, 0, cameraMatrix);
    this.device.queue.writeBuffer(this.modelBuffer, 0, modelMatrix);
    this.device.queue.writeBuffer(this.modelBuffer, 64, color);
    this.device.queue.writeBuffer(this.modelBuffer, 64 + 16, progressData);
    pass2.setPipeline(this.pipeline);
    pass2.setBindGroup(0, this.bindGroup);
    pass2.setVertexBuffer(0, this.vertexBuffer);
    pass2.setVertexBuffer(1, this.uvBuffer);
    pass2.setIndexBuffer(this.indexBuffer, "uint16");
    pass2.drawIndexed(this.indexCount);
  }
  render(pass2, mesh, viewProjMatrix) {
    const pos2 = mesh.position;
    const modelMatrix = mat4Impl.identity();
    mat4Impl.translate(modelMatrix, [pos2.x, pos2.y + this.offsetY, pos2.z], modelMatrix);
    this.draw(pass2, viewProjMatrix, modelMatrix);
  }
};

// ../../../shaders/standalone/geo.tex.js
var geoInstancedTexEffect = `
// === CAMERA & INSTANCE BUFFERS ============================================
struct Camera {
  viewProjMatrix : mat4x4<f32>,
};
@group(0) @binding(0) var<uniform> camera : Camera;

struct InstanceData {
  model : mat4x4<f32>,
  color : vec4<f32>,
};
@group(0) @binding(1) var<storage, read> instances : array<InstanceData>;

// === TEXTURE & SAMPLER ====================================================
@group(0) @binding(2) var mySampler : sampler;
@group(0) @binding(3) var myTexture : texture_2d<f32>;

// === VERTEX STAGE =========================================================
struct VertexInput {
  @location(0) position : vec3<f32>,
  @location(1) uv       : vec2<f32>,
};

struct VSOut {
  @builtin(position) Position : vec4<f32>,
  @location(0) v_uv : vec2<f32>,
  @location(1) v_color : vec4<f32>,
};

@vertex
fn vsMain(input : VertexInput, @builtin(instance_index) instanceIndex : u32) -> VSOut {
  var out : VSOut;
  let inst = instances[instanceIndex];

  let worldPos = inst.model * vec4<f32>(input.position, 1.0);
  out.Position = camera.viewProjMatrix * worldPos;
  out.v_uv = input.uv;
  out.v_color = inst.color;
  return out;
}

// === FRAGMENT STAGE =======================================================
@fragment
fn fsMain(input : VSOut) -> @location(0) vec4<f32> {

 // Adjust UV scaling and offset here
  let uvScale = vec2<f32>(1.3, 1.3);   // < 1.0 = zoom out (more texture visible)
  let uvOffset = vec2<f32>(0.01, 0.01); // move the texture slightly
  
  let adjustedUV = input.v_uv; // * uvScale + uvOffset; // make it like ring !

  let texColor = textureSample(myTexture, mySampler, adjustedUV);

  let uv = input.v_uv * 2.0 - vec2<f32>(1.0, 1.0);
  let dist = length(uv);
  let glow = exp(-dist * 1.2);
  let glowColor = mix(vec3<f32>(0.2, 0.7, 1.0), vec3<f32>(0.8, 0.95, 1.0), glow);

  let baseRGB = texColor.rgb * glowColor;
  let tintedRGB = mix(baseRGB, input.v_color.rgb, 0.8);
  let finalAlpha = texColor.a * input.v_color.a * glow;

  return vec4<f32>(tintedRGB, finalAlpha);

  // let texColor = textureSample(myTexture, mySampler, input.v_uv);

  // let uv = input.v_uv * 2.0 - vec2<f32>(1.0, 1.0);
  // let dist = length(uv);
  // let glow = exp(-dist * 1.2);
  // let glowColor = mix(vec3<f32>(0.2, 0.7, 1.0), vec3<f32>(0.8, 0.95, 1.0), glow);

  // // More balanced color blending:
  // let baseRGB = texColor.rgb * glowColor;
  // let tintedRGB = mix(baseRGB, input.v_color.rgb, 0.8); // 0.8 gives strong tint influence
  // let finalAlpha = texColor.a * input.v_color.a * glow;

  // return vec4<f32>(tintedRGB, finalAlpha);
}
`;

// ../../../engine/effects/gen-tex.js
var GenGeoTexture = class {
  constructor(device2, format, type2 = "sphere", path2, scale4 = 1) {
    this.device = device2;
    this.format = format;
    const geom = GeometryFactory.create(type2, scale4);
    this.vertexData = geom.positions;
    this.uvData = geom.uvs;
    this.indexData = geom.indices;
    this.enabled = true;
    this.rotateEffect = true;
    this.rotateEffectSpeed = 10;
    this.rotateAngle = 0;
    this.loadTexture(path2).then(() => {
      this._initPipeline();
    });
  }
  async loadTexture(url) {
    return new Promise(async (resolve, reject) => {
      const img = await fetch(url).then((r2) => r2.blob()).then(createImageBitmap);
      const texture = this.device.createTexture({
        size: [img.width, img.height, 1],
        format: "rgba8unorm",
        usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT
      });
      this.device.queue.copyExternalImageToTexture(
        { source: img },
        { texture },
        [img.width, img.height]
      );
      const sampler = this.device.createSampler({
        magFilter: "linear",
        minFilter: "linear",
        addressModeU: "repeat",
        addressModeV: "repeat"
      });
      this.texture = texture;
      this.sampler = sampler;
      resolve();
    });
  }
  _initPipeline() {
    const { vertexData, uvData, indexData } = this;
    this.vertexBuffer = this.device.createBuffer({
      size: vertexData.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
    });
    this.device.queue.writeBuffer(this.vertexBuffer, 0, vertexData);
    this.uvBuffer = this.device.createBuffer({
      size: uvData.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
    });
    this.device.queue.writeBuffer(this.uvBuffer, 0, uvData);
    this.indexBuffer = this.device.createBuffer({
      size: Math.ceil(indexData.byteLength / 4) * 4,
      usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST
    });
    this.device.queue.writeBuffer(this.indexBuffer, 0, indexData);
    this.indexCount = indexData.length;
    this.cameraBuffer = this.device.createBuffer({
      size: 64,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });
    this.instanceTargets = [];
    this.lerpSpeed = 0.05;
    this.maxInstances = 5;
    this.instanceCount = 2;
    this.floatsPerInstance = 16 + 4;
    for (let x2 = 0; x2 < this.maxInstances; x2++) {
      this.instanceTargets.push({
        index: x2,
        position: [0, 0, 0],
        currentPosition: [0, 0, 0],
        scale: [1, 1, 1],
        currentScale: [1, 1, 1],
        color: [0.6, 0.8, 1, 0.4]
      });
    }
    this.instanceData = new Float32Array(this.instanceCount * this.floatsPerInstance);
    this.modelBuffer = this.device.createBuffer({
      size: this.instanceData.byteLength,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
    });
    const bindGroupLayout = this.device.createBindGroupLayout({
      entries: [
        { binding: 0, visibility: GPUShaderStage.VERTEX, buffer: {} },
        { binding: 1, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: { type: "read-only-storage" } },
        { binding: 2, visibility: GPUShaderStage.FRAGMENT, sampler: {} },
        { binding: 3, visibility: GPUShaderStage.FRAGMENT, texture: {} }
      ]
    });
    this.bindGroup = this.device.createBindGroup({
      layout: bindGroupLayout,
      entries: [
        { binding: 0, resource: { buffer: this.cameraBuffer } },
        { binding: 1, resource: { buffer: this.modelBuffer } },
        { binding: 2, resource: this.sampler },
        { binding: 3, resource: this.texture.createView() }
      ]
    });
    const shaderModule = this.device.createShaderModule({ code: geoInstancedTexEffect });
    const pipelineLayout = this.device.createPipelineLayout({ bindGroupLayouts: [bindGroupLayout] });
    this.pipeline = this.device.createRenderPipeline({
      layout: pipelineLayout,
      vertex: {
        module: shaderModule,
        entryPoint: "vsMain",
        buffers: [
          { arrayStride: 3 * 4, attributes: [{ shaderLocation: 0, offset: 0, format: "float32x3" }] },
          { arrayStride: 2 * 4, attributes: [{ shaderLocation: 1, offset: 0, format: "float32x2" }] }
        ]
      },
      fragment: {
        module: shaderModule,
        entryPoint: "fsMain",
        targets: [{
          format: this.format,
          blend: {
            color: {
              srcFactor: "src-alpha",
              dstFactor: "one-minus-src-alpha",
              operation: "add"
            },
            alpha: {
              srcFactor: "one",
              dstFactor: "one-minus-src-alpha",
              operation: "add"
            }
          }
        }]
      },
      primitive: { topology: "triangle-list" },
      depthStencil: { depthWriteEnabled: false, depthCompare: "less-equal", format: "depth24plus" }
    });
  }
  updateInstanceData = (baseModelMatrix) => {
    if (this.rotateEffect) {
      this.rotateAngle = (this.rotateAngle ?? 0) + this.rotateEffectSpeed;
      if (this.rotateAngle >= 360) {
        this.rotateAngle = 0;
      }
    }
    const count = Math.min(this.instanceCount, this.maxInstances);
    for (let i = 0; i < count; i++) {
      const t = this.instanceTargets[i];
      for (let j = 0; j < 3; j++) {
        t.currentPosition[j] += (t.position[j] - t.currentPosition[j]) * this.lerpSpeed;
        t.currentScale[j] += (t.scale[j] - t.currentScale[j]) * this.lerpSpeed;
      }
      const local = mat4Impl.identity();
      if (this.rotateEffect == true) {
        mat4Impl.rotateY(local, this.rotateAngle, local);
      }
      mat4Impl.translate(local, t.currentPosition, local);
      mat4Impl.scale(local, t.currentScale, local);
      const finalMat = mat4Impl.identity();
      mat4Impl.multiply(baseModelMatrix, local, finalMat);
      const offset = i * this.floatsPerInstance;
      this.instanceData.set(finalMat, offset);
      this.instanceData.set(t.color, offset + 16);
    }
    const activeFloatCount = count * this.floatsPerInstance;
    const activeBytes = activeFloatCount * 4;
    this.device.queue.writeBuffer(this.modelBuffer, 0, this.instanceData.subarray(0, activeFloatCount));
  };
  draw(pass2, cameraMatrix) {
    this.device.queue.writeBuffer(this.cameraBuffer, 0, cameraMatrix);
    pass2.setPipeline(this.pipeline);
    pass2.setBindGroup(0, this.bindGroup);
    pass2.setVertexBuffer(0, this.vertexBuffer);
    pass2.setVertexBuffer(1, this.uvBuffer);
    pass2.setIndexBuffer(this.indexBuffer, "uint16");
    pass2.drawIndexed(this.indexCount, this.instanceCount);
  }
  render(transPass, mesh, viewProjMatrix) {
    this.draw(transPass, viewProjMatrix);
  }
};

// ../../../engine/effects/gen-tex2.js
var GenGeoTexture2 = class {
  constructor(device2, format, type2 = "sphere", path2, scale4 = 1) {
    this.device = device2;
    this.format = format;
    const geom = GeometryFactory.create(type2, scale4);
    this.vertexData = geom.positions;
    this.uvData = geom.uvs;
    this.indexData = geom.indices;
    this.enabled = true;
    this.rotateEffect = true;
    this.rotateEffectSpeed = 10;
    this.rotateAngle = 0;
    this.loadTexture(path2).then(() => {
      this._initPipeline();
    });
  }
  async loadTexture(url) {
    return new Promise(async (resolve, reject) => {
      const img = await fetch(url).then((r2) => r2.blob()).then(createImageBitmap);
      const texture = this.device.createTexture({
        size: [img.width, img.height, 1],
        format: "rgba8unorm",
        usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT
      });
      this.device.queue.copyExternalImageToTexture(
        { source: img },
        { texture },
        [img.width, img.height]
      );
      const sampler = this.device.createSampler({
        magFilter: "linear",
        minFilter: "linear",
        addressModeU: "repeat",
        addressModeV: "repeat"
      });
      this.texture = texture;
      this.sampler = sampler;
      resolve();
    });
  }
  _initPipeline() {
    const { vertexData, uvData, indexData } = this;
    this.vertexBuffer = this.device.createBuffer({
      size: Math.ceil(vertexData.byteLength / 4) * 4,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
    });
    this.device.queue.writeBuffer(this.vertexBuffer, 0, vertexData);
    this.uvBuffer = this.device.createBuffer({
      size: Math.ceil(uvData.byteLength / 4) * 4,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
    });
    this.device.queue.writeBuffer(this.uvBuffer, 0, uvData);
    const alignedIndexSize = Math.ceil(indexData.byteLength / 4) * 4;
    this.indexBuffer = this.device.createBuffer({
      size: alignedIndexSize,
      usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST
    });
    if (indexData.byteLength !== alignedIndexSize) {
      const tmp = new Uint8Array(alignedIndexSize);
      tmp.set(new Uint8Array(indexData.buffer));
      this.device.queue.writeBuffer(this.indexBuffer, 0, tmp);
    } else {
      this.device.queue.writeBuffer(this.indexBuffer, 0, indexData);
    }
    this.indexCount = indexData.length;
    this.cameraBuffer = this.device.createBuffer({
      size: 64,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });
    this.instanceTargets = [];
    this.lerpSpeed = 0.05;
    this.maxInstances = 5;
    this.instanceCount = 2;
    this.floatsPerInstance = 16 + 4;
    for (let x2 = 0; x2 < this.maxInstances; x2++) {
      this.instanceTargets.push({
        index: x2,
        position: [0, 0, 0],
        currentPosition: [0, 0, 0],
        scale: [1, 1, 1],
        currentScale: [1, 1, 1],
        color: [0.6, 0.8, 1, 0.4]
      });
    }
    this.instanceData = new Float32Array(this.instanceCount * this.floatsPerInstance);
    this.modelBuffer = this.device.createBuffer({
      size: Math.ceil(this.instanceData.byteLength / 4) * 4,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
    });
    const bindGroupLayout = this.device.createBindGroupLayout({
      entries: [
        { binding: 0, visibility: GPUShaderStage.VERTEX, buffer: {} },
        { binding: 1, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: { type: "read-only-storage" } },
        { binding: 2, visibility: GPUShaderStage.FRAGMENT, sampler: {} },
        { binding: 3, visibility: GPUShaderStage.FRAGMENT, texture: {} }
      ]
    });
    this.bindGroup = this.device.createBindGroup({
      layout: bindGroupLayout,
      entries: [
        { binding: 0, resource: { buffer: this.cameraBuffer } },
        { binding: 1, resource: { buffer: this.modelBuffer } },
        { binding: 2, resource: this.sampler },
        { binding: 3, resource: this.texture.createView() }
      ]
    });
    const shaderModule = this.device.createShaderModule({ code: geoInstancedTexEffect });
    const pipelineLayout = this.device.createPipelineLayout({ bindGroupLayouts: [bindGroupLayout] });
    this.pipeline = this.device.createRenderPipeline({
      layout: pipelineLayout,
      vertex: {
        module: shaderModule,
        entryPoint: "vsMain",
        buffers: [
          { arrayStride: 3 * 4, attributes: [{ shaderLocation: 0, offset: 0, format: "float32x3" }] },
          { arrayStride: 2 * 4, attributes: [{ shaderLocation: 1, offset: 0, format: "float32x2" }] }
        ]
      },
      fragment: {
        module: shaderModule,
        entryPoint: "fsMain",
        targets: [{
          format: this.format,
          blend: {
            color: {
              srcFactor: "src-alpha",
              dstFactor: "one-minus-src-alpha",
              operation: "add"
            },
            alpha: {
              srcFactor: "one",
              dstFactor: "one-minus-src-alpha",
              operation: "add"
            }
          }
        }]
      },
      primitive: { topology: "triangle-list" },
      depthStencil: { depthWriteEnabled: false, depthCompare: "less-equal", format: "depth24plus" }
    });
  }
  updateInstanceData = (baseModelMatrix) => {
    if (this.rotateEffect) {
      this.rotateAngle = (this.rotateAngle ?? 0) + this.rotateEffectSpeed;
      if (this.rotateAngle >= 360) {
        this.rotateAngle = 0;
      }
    }
    const count = Math.min(this.instanceCount, this.maxInstances);
    for (let i = 0; i < count; i++) {
      const t = this.instanceTargets[i];
      for (let j = 0; j < 3; j++) {
        t.currentPosition[j] += (t.position[j] - t.currentPosition[j]) * this.lerpSpeed;
        t.currentScale[j] += (t.scale[j] - t.currentScale[j]) * this.lerpSpeed;
      }
      const local = mat4Impl.identity();
      if (this.rotateEffect == true) {
        mat4Impl.rotateY(local, this.rotateAngle, local);
      }
      mat4Impl.translate(local, t.currentPosition, local);
      mat4Impl.scale(local, t.currentScale, local);
      const finalMat = mat4Impl.identity();
      mat4Impl.multiply(baseModelMatrix, local, finalMat);
      const offset = i * this.floatsPerInstance;
      this.instanceData.set(finalMat, offset);
      this.instanceData.set(t.color, offset + 16);
    }
    const activeFloatCount = count * this.floatsPerInstance;
    const activeBytes = activeFloatCount * 4;
    this.device.queue.writeBuffer(this.modelBuffer, 0, this.instanceData.subarray(0, activeFloatCount));
  };
  draw(pass2, cameraMatrix) {
    this.device.queue.writeBuffer(this.cameraBuffer, 0, cameraMatrix);
    pass2.setPipeline(this.pipeline);
    pass2.setBindGroup(0, this.bindGroup);
    pass2.setVertexBuffer(0, this.vertexBuffer);
    pass2.setVertexBuffer(1, this.uvBuffer);
    pass2.setIndexBuffer(this.indexBuffer, "uint16");
    pass2.drawIndexed(this.indexCount, this.instanceCount);
  }
  render(transPass, mesh, viewProjMatrix) {
    this.draw(transPass, viewProjMatrix);
  }
};

// ../../../engine/instanced/mesh-obj-instances.js
var MEMeshObjInstances = class extends MaterialsInstanced {
  constructor(canvas, device2, context, o2, inputHandler, globalAmbient, _glbFile = null, primitiveIndex = null, skinnedNodeIndex = null) {
    super(device2, o2.material, _glbFile);
    if (typeof o2.name === "undefined") o2.name = genName(3);
    if (typeof o2.raycast === "undefined") {
      this.raycast = { enabled: false, radius: 2 };
    } else {
      this.raycast = o2.raycast;
    }
    this.pointerEffect = o2.pointerEffect;
    this.name = o2.name;
    this.done = false;
    this.canvas = canvas;
    this.device = device2;
    this.context = context;
    this.entityArgPass = o2.entityArgPass;
    this.clearColor = "red";
    this.video = null;
    this.FINISH_VIDIO_INIT = false;
    this.globalAmbient = [...globalAmbient];
    this.useScale = o2.useScale || false;
    if (typeof o2.material.useTextureFromGlb === "undefined" || typeof o2.material.useTextureFromGlb !== "boolean") {
      o2.material.useTextureFromGlb = false;
    }
    if (typeof o2.material.useBlend === "undefined" || typeof o2.material.useBlend !== "boolean") {
      o2.material.useBlend = false;
    }
    this.material = o2.material;
    this.mesh = o2.mesh;
    if (_glbFile != null) {
      if (typeof this.mesh == "undefined") {
        this.mesh = {};
        this.mesh.feedFromRealGlb = true;
      }
      const verView = _glbFile.skinnedMeshNodes[skinnedNodeIndex].mesh.primitives[primitiveIndex].positions.view;
      const byteOffsetV = verView.byteOffset || 0;
      const byteLengthV = verView.buffer.byteLength;
      const vertices = new Float32Array(
        verView.buffer.buffer,
        byteOffsetV,
        byteLengthV / 4
      );
      this.mesh.vertices = vertices;
      const norView = _glbFile.skinnedMeshNodes[skinnedNodeIndex].mesh.primitives[primitiveIndex].normals.view;
      const normalsUint8 = norView.buffer;
      const byteOffsetN = norView.byteOffset || 0;
      const byteLengthN = normalsUint8.byteLength;
      const normals = new Float32Array(
        normalsUint8.buffer,
        byteOffsetN,
        byteLengthN / 4
      );
      this.mesh.vertexNormals = normals;
      let accessor = _glbFile.skinnedMeshNodes[skinnedNodeIndex].mesh.primitives[primitiveIndex].texcoords[0];
      const bufferView = accessor.view;
      const byteOffset = (bufferView.byteOffset || 0) + (accessor.byteOffset || 0);
      const count = accessor.count * 2;
      const uvFloatArray = new Float32Array(bufferView.buffer.buffer, byteOffset, count);
      this.mesh.uvs = uvFloatArray;
      this.mesh.textures = uvFloatArray;
      let binaryI = _glbFile.skinnedMeshNodes[skinnedNodeIndex].mesh.primitives[primitiveIndex].indices;
      const indicesView = binaryI.view;
      const indicesUint8 = indicesView.buffer;
      const byteOffsetI = indicesView.byteOffset || 0;
      const byteLengthI = indicesUint8.byteLength;
      let indicesArray;
      switch (binaryI.componentType) {
        case 5121:
          indicesArray = new Uint8Array(indicesUint8.buffer, byteOffsetI, byteLengthI);
          break;
        case 5123:
          indicesArray = new Uint16Array(indicesUint8.buffer, byteOffsetI, byteLengthI / 2);
          break;
        case 5125:
          indicesArray = new Uint32Array(indicesUint8.buffer, byteOffsetI, byteLengthI / 4);
          break;
        default:
          throw new Error("Unknown index componentType");
      }
      this.mesh.indices = indicesArray;
      let weightsView = _glbFile.skinnedMeshNodes[skinnedNodeIndex].mesh.primitives[primitiveIndex].weights.view;
      this.mesh.weightsView = weightsView;
      let primitive = _glbFile.skinnedMeshNodes[skinnedNodeIndex].mesh.primitives[primitiveIndex];
      let finalRoundedWeights = this.getAccessorArray(_glbFile, primitive.weights.weightsAccessIndex);
      const weightsArray = finalRoundedWeights;
      for (let i = 0; i < weightsArray.length; i += 4) {
        const sum2 = weightsArray[i] + weightsArray[i + 1] + weightsArray[i + 2] + weightsArray[i + 3];
        if (sum2 > 0) {
          const inv = 1 / sum2;
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
        if (Math.abs(s - 1) > 1e-3) console.warn("Weight not normalized!", i, s);
      }
      this.mesh.weightsBuffer = this.device.createBuffer({
        label: "weightsBuffer real data",
        size: weightsArray.byteLength,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        mappedAtCreation: true
      });
      new Float32Array(this.mesh.weightsBuffer.getMappedRange()).set(weightsArray);
      this.mesh.weightsBuffer.unmap();
      let jointsView = _glbFile.skinnedMeshNodes[skinnedNodeIndex].mesh.primitives[primitiveIndex].joints.view;
      this.mesh.jointsView = jointsView;
      let jointsArray16 = new Uint16Array(
        jointsView.buffer,
        jointsView.byteOffset || 0,
        jointsView.byteLength / 2
        // in Uint16 elements
      );
      const jointsArray32 = new Uint32Array(jointsArray16.length);
      for (let i = 0; i < jointsArray16.length; i++) {
        jointsArray32[i] = jointsArray16[i];
      }
      this.mesh.jointsBuffer = this.device.createBuffer({
        label: "jointsBuffer[real-data]",
        size: jointsArray32.byteLength,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        mappedAtCreation: true
      });
      new Uint32Array(this.mesh.jointsBuffer.getMappedRange()).set(jointsArray32);
      this.mesh.jointsBuffer.unmap();
      let tangentArray = null;
      if (_glbFile.skinnedMeshNodes[skinnedNodeIndex].mesh.primitives[primitiveIndex].tangents) {
        const tangentView = _glbFile.skinnedMeshNodes[skinnedNodeIndex].mesh.primitives[primitiveIndex].tangents.view;
        const byteOffsetT = tangentView.byteOffset || 0;
        const byteLengthT = tangentView.buffer.byteLength;
        tangentArray = new Float32Array(
          tangentView.buffer,
          byteOffsetT,
          byteLengthT / 4
        );
        this.mesh.tangents = tangentArray;
        this.mesh.tangentsBuffer = this.device.createBuffer({
          label: "tangentsBuffer[real-data]",
          size: tangentArray.byteLength,
          usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
          mappedAtCreation: true
        });
        new Float32Array(this.mesh.tangentsBuffer.getMappedRange()).set(tangentArray);
        this.mesh.tangentsBuffer.unmap();
      } else {
        const dummyTangents = new Float32Array(this.mesh.vertices.length / 3 * 4);
        for (let i = 0; i < dummyTangents.length; i += 4) {
          dummyTangents[i + 0] = 1;
          dummyTangents[i + 1] = 0;
          dummyTangents[i + 2] = 0;
          dummyTangents[i + 3] = 1;
        }
        this.mesh.tangentsBuffer = this.device.createBuffer({
          label: "tangentsBuffer dummy",
          size: dummyTangents.byteLength,
          usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
          mappedAtCreation: true
        });
        new Float32Array(this.mesh.tangentsBuffer.getMappedRange()).set(dummyTangents);
        this.mesh.tangentsBuffer.unmap();
        console.warn("GLTF primitive has no TANGENT attribute (normal map won\u2019t work properly).");
      }
    } else {
      this.mesh.uvs = this.mesh.textures;
    }
    if (typeof o2.objAnim !== "undefined" && o2.objAnim != null) {
      this.objAnim = o2.objAnim;
      for (var key in this.objAnim.animations) {
        if (key != "active") this.objAnim.animations[key].speedCounter = 0;
      }
      console.log(`%c Mesh objAnim exist: ${o2.objAnim}`, LOG_FUNNY_SMALL);
      this.drawElements = this.drawElementsAnim;
    }
    this.inputHandler = inputHandler;
    this.cameras = o2.cameras;
    this.mainCameraParams = {
      type: o2.mainCameraParams.type,
      responseCoef: o2.mainCameraParams.responseCoef
    };
    this.lastFrameMS = 0;
    this.texturesPaths = [];
    o2.texturesPaths.forEach((t) => {
      this.texturesPaths.push(t);
    });
    this.presentationFormat = navigator.gpu.getPreferredCanvasFormat();
    this.position = new Position(o2.position.x, o2.position.y, o2.position.z);
    this.rotation = new Rotation(o2.rotation.x, o2.rotation.y, o2.rotation.z);
    this.rotation.rotationSpeed.x = o2.rotationSpeed.x;
    this.rotation.rotationSpeed.y = o2.rotationSpeed.y;
    this.rotation.rotationSpeed.z = o2.rotationSpeed.z;
    this.scale = o2.scale;
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
        stride: 16
        // vec4<u32>
      };
      const numVerts = this.mesh.vertices.length / 3;
      const weightsData = new Float32Array(numVerts * 4);
      for (let i = 0; i < numVerts; i++) {
        weightsData[i * 4 + 0] = 1;
        weightsData[i * 4 + 1] = 0;
        weightsData[i * 4 + 2] = 0;
        weightsData[i * 4 + 3] = 0;
      }
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
        stride: 16
        // vec4<f32>
      };
    }
    this.runProgram = () => {
      return new Promise(async (resolve) => {
        this.shadowDepthTextureSize = 1024;
        this.modelViewProjectionMatrix = mat4Impl.create();
        this.loadTex0(this.texturesPaths).then(() => {
          resolve();
        });
      });
    };
    this.runProgram().then(() => {
      this.context.configure({
        device: this.device,
        format: this.presentationFormat,
        alphaMode: "premultiplied"
      });
      this.vertexBuffer = this.device.createBuffer({
        size: this.mesh.vertices.length * Float32Array.BYTES_PER_ELEMENT,
        usage: GPUBufferUsage.VERTEX,
        mappedAtCreation: true
      });
      {
        new Float32Array(this.vertexBuffer.getMappedRange()).set(this.mesh.vertices);
        this.vertexBuffer.unmap();
      }
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
      this.indexCount = this.mesh.indices.length;
      const indexCount = this.mesh.indices.length;
      const size2 = Math.ceil(indexCount * Uint16Array.BYTES_PER_ELEMENT / 4) * 4;
      this.indexBuffer = this.device.createBuffer({
        size: size2,
        usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
        mappedAtCreation: true
      });
      new Uint16Array(this.indexBuffer.getMappedRange()).set(this.mesh.indices);
      this.indexBuffer.unmap();
      this.indexCount = indexCount;
      let glbInfo = {
        arrayStride: 4 * 4,
        // vec4<f32> = 4 * 4 bytes
        attributes: [{ format: "float32x4", offset: 0, shaderLocation: 4 }]
      };
      this.vertexBuffers = [
        {
          arrayStride: Float32Array.BYTES_PER_ELEMENT * 3,
          attributes: [
            {
              // position
              shaderLocation: 0,
              offset: 0,
              format: "float32x3"
            }
          ]
        },
        {
          arrayStride: Float32Array.BYTES_PER_ELEMENT * 3,
          attributes: [
            {
              // normal
              shaderLocation: 1,
              offset: 0,
              format: "float32x3"
            }
          ]
        },
        {
          arrayStride: Float32Array.BYTES_PER_ELEMENT * 2,
          attributes: [
            {
              // uvs
              shaderLocation: 2,
              offset: 0,
              format: "float32x2"
            }
          ]
        },
        // joint indices
        {
          arrayStride: 4 * 4,
          attributes: [{ format: "uint32x4", offset: 0, shaderLocation: 3 }]
        },
        // weights
        glbInfo
      ];
      if (this.mesh.tangentsBuffer) {
        this.vertexBuffers.push({
          arrayStride: 4 * 4,
          attributes: [
            { shaderLocation: 5, format: "float32x4", offset: 0 }
          ]
        });
      }
      this.primitive = {
        topology: "triangle-list",
        cullMode: "back",
        // typical for shadow passes
        frontFace: "ccw"
      };
      this.selectedBuffer = device2.createBuffer({
        size: 4,
        // just one float
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
      });
      this.selectedBindGroupLayout = device2.createBindGroupLayout({
        entries: [
          { binding: 0, visibility: GPUShaderStage.FRAGMENT, buffer: {} }
        ]
      });
      this.selectedBindGroup = device2.createBindGroup({
        layout: this.selectedBindGroupLayout,
        entries: [{ binding: 0, resource: { buffer: this.selectedBuffer } }]
      });
      this.setSelectedEffect = (selected = false) => {
        this.device.queue.writeBuffer(this.selectedBuffer, 0, new Float32Array([selected ? 1 : 0]));
      };
      this.setSelectedEffect();
      this.createLayoutForRender();
      this.instanceTargets = [];
      this.lerpSpeed = 0.05;
      this.lerpSpeedAlpha = 0.05;
      this.maxInstances = 5;
      this.instanceCount = 2;
      this.floatsPerInstance = 16 + 4;
      for (let x2 = 0; x2 < this.maxInstances; x2++) {
        this.instanceTargets.push({
          index: x2,
          position: [0, 0, 0],
          currentPosition: [0, 0, 0],
          scale: [1, 1, 1],
          currentScale: [1, 1, 1],
          color: [0.6, 0.8, 1, 0.4],
          currentColor: [0.6, 0.8, 1, 0.4]
        });
      }
      this.instanceData = new Float32Array(this.instanceCount * this.floatsPerInstance);
      this.instanceBuffer = device2.createBuffer({
        size: this.instanceData.byteLength,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
      });
      this.updateInstanceData = (modelMatrix) => {
        this.instanceData.set(modelMatrix, 0);
        this.instanceData.set([1, 1, 1, 1], 16);
        for (let i = 1; i < this.instanceCount; i++) {
          const t = this.instanceTargets[i];
          const ghost = new Float32Array(modelMatrix);
          for (let j = 0; j < 3; j++) {
            t.currentPosition[j] += (t.position[j] - t.currentPosition[j]) * this.lerpSpeed;
            t.currentScale[j] += (t.scale[j] - t.currentScale[j]) * this.lerpSpeed;
            t.currentColor[j] += (t.color[j] - t.currentColor[j]) * this.lerpSpeed;
            if (j == 2) {
              t.currentColor[j + 1] += (t.color[j + 1] - t.currentColor[j + 1]) * this.lerpSpeedAlpha;
            }
          }
          ghost[0] *= t.currentScale[0];
          ghost[5] *= t.currentScale[1];
          ghost[10] *= t.currentScale[2];
          ghost[12] += t.currentPosition[0];
          ghost[13] += t.currentPosition[1];
          ghost[14] += t.currentPosition[2];
          const offset = 20 * i;
          this.instanceData.set(ghost, offset);
          this.instanceData.set(t.currentColor, offset + 16);
        }
        device2.queue.writeBuffer(this.instanceBuffer, 0, this.instanceData);
      };
      this.updateInstances = (newCount) => {
        if (newCount > this.maxInstances) {
          console.error(`Instance count ${newCount} exceeds buffer max ${this.maxInstances}`);
          return;
        }
        this.instanceCount = newCount;
        this.instanceData = new Float32Array(this.instanceCount * this.floatsPerInstance);
        this.instanceBuffer = device2.createBuffer({
          size: this.instanceData.byteLength,
          usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
        });
        let m = this.getModelMatrix(this.position, this.useScale);
        this.updateInstanceData(m);
        this.modelBindGroupInstanced = this.device.createBindGroup({
          label: "modelBindGroup in mesh [instanced]",
          layout: this.uniformBufferBindGroupLayoutInstanced,
          entries: [
            //
            { binding: 0, resource: { buffer: this.instanceBuffer } },
            { binding: 1, resource: { buffer: this.bonesBuffer } },
            { binding: 2, resource: { buffer: this.vertexAnimBuffer } }
          ]
        });
      };
      this.updateMaxInstances = (newMax) => {
        this.maxInstances = newMax;
        for (let x2 = 0; x2 < this.maxInstances; x2++) {
          this.instanceTargets.push({
            index: x2,
            position: [0, 0, 0],
            currentPosition: [0, 0, 0],
            scale: [1, 1, 1],
            currentScale: [1, 1, 1],
            color: [0.6, 0.8, 1, 0.4],
            currentColor: [0.6, 0.8, 1, 0.4]
          });
        }
      };
      this.modelUniformBuffer = this.device.createBuffer({
        size: 4 * 16,
        // 4x4 matrix
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
      });
      this.sceneUniformBuffer = this.device.createBuffer({
        label: "sceneUniformBuffer per mesh",
        size: 192,
        //176,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
      });
      this.uniformBufferBindGroupLayoutInstanced = this.device.createBindGroupLayout({
        label: "uniformBufferBindGroupLayout in mesh [instanced]",
        entries: [
          { binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: { type: "read-only-storage" } },
          { binding: 1, visibility: GPUShaderStage.VERTEX, buffer: { type: "uniform" } },
          { binding: 2, visibility: GPUShaderStage.VERTEX, buffer: { type: "uniform" } }
        ]
      });
      this.uniformBufferBindGroupLayout = this.device.createBindGroupLayout({
        label: "uniformBufferBindGroupLayout in mesh [regular]",
        entries: [
          { binding: 0, visibility: GPUShaderStage.VERTEX, buffer: { type: "uniform" } },
          { binding: 1, visibility: GPUShaderStage.VERTEX, buffer: { type: "uniform" } },
          { binding: 2, visibility: GPUShaderStage.VERTEX, buffer: { type: "uniform" } }
        ]
      });
      function alignTo256(n2) {
        return Math.ceil(n2 / 256) * 256;
      }
      let MAX_BONES = 100;
      this.MAX_BONES = MAX_BONES;
      this.bonesBuffer = device2.createBuffer({
        label: "bonesBuffer",
        size: alignTo256(64 * MAX_BONES),
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
      });
      const bones = new Float32Array(this.MAX_BONES * 16);
      for (let i = 0; i < this.MAX_BONES; i++) {
        bones.set([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1], i * 16);
      }
      this.device.queue.writeBuffer(this.bonesBuffer, 0, bones);
      this.vertexAnimParams = new Float32Array([
        0,
        0,
        0,
        0,
        2,
        0.1,
        2,
        0,
        1.5,
        0.3,
        2,
        0.5,
        1,
        0.1,
        0,
        0,
        1,
        0.5,
        0,
        0,
        1,
        0.05,
        0.5,
        0,
        1,
        0.05,
        2,
        0,
        1,
        0.1,
        0,
        0
      ]);
      this.vertexAnimBuffer = this.device.createBuffer({
        label: "Vertex Animation Params",
        size: Math.ceil(this.vertexAnimParams.byteLength / 256) * 256,
        // 256, //this.vertexAnimParams.byteLength, // 128 bytes
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
      });
      this.vertexAnim = {
        enableWave: () => {
          this.vertexAnimParams[1] |= VERTEX_ANIM_FLAGS.WAVE;
          this.updateVertexAnimBuffer();
        },
        disableWave: () => {
          this.vertexAnimParams[1] &= ~VERTEX_ANIM_FLAGS.WAVE;
          this.updateVertexAnimBuffer();
        },
        enableWind: () => {
          this.vertexAnimParams[1] |= VERTEX_ANIM_FLAGS.WIND;
          this.updateVertexAnimBuffer();
        },
        disableWind: () => {
          this.vertexAnimParams[1] &= ~VERTEX_ANIM_FLAGS.WIND;
          this.updateVertexAnimBuffer();
        },
        enablePulse: () => {
          this.vertexAnimParams[1] |= VERTEX_ANIM_FLAGS.PULSE;
          this.updateVertexAnimBuffer();
        },
        disablePulse: () => {
          this.vertexAnimParams[1] &= ~VERTEX_ANIM_FLAGS.PULSE;
          this.updateVertexAnimBuffer();
        },
        enableTwist: () => {
          this.vertexAnimParams[1] |= VERTEX_ANIM_FLAGS.TWIST;
          this.updateVertexAnimBuffer();
        },
        disableTwist: () => {
          this.vertexAnimParams[1] &= ~VERTEX_ANIM_FLAGS.TWIST;
          this.updateVertexAnimBuffer();
        },
        enableNoise: () => {
          this.vertexAnimParams[1] |= VERTEX_ANIM_FLAGS.NOISE;
          this.updateVertexAnimBuffer();
        },
        disableNoise: () => {
          this.vertexAnimParams[1] &= ~VERTEX_ANIM_FLAGS.NOISE;
          this.updateVertexAnimBuffer();
        },
        enableOcean: () => {
          this.vertexAnimParams[1] |= VERTEX_ANIM_FLAGS.OCEAN;
          this.updateVertexAnimBuffer();
        },
        disableOcean: () => {
          this.vertexAnimParams[1] &= ~VERTEX_ANIM_FLAGS.OCEAN;
          this.updateVertexAnimBuffer();
        },
        enable: (...effects) => {
          effects.forEach((effect) => {
            this.vertexAnimParams[1] |= VERTEX_ANIM_FLAGS[effect.toUpperCase()];
          });
          this.updateVertexAnimBuffer();
        },
        disable: (...effects) => {
          effects.forEach((effect) => {
            this.vertexAnimParams[1] &= ~VERTEX_ANIM_FLAGS[effect.toUpperCase()];
          });
          this.updateVertexAnimBuffer();
        },
        disableAll: () => {
          this.vertexAnimParams[1] = 0;
          this.updateVertexAnimBuffer();
        },
        isEnabled: (effect) => {
          return (this.vertexAnimParams[1] & VERTEX_ANIM_FLAGS[effect.toUpperCase()]) !== 0;
        },
        setWaveParams: (speed, amplitude, frequency) => {
          this.vertexAnimParams[4] = speed;
          this.vertexAnimParams[5] = amplitude;
          this.vertexAnimParams[6] = frequency;
          this.updateVertexAnimBuffer();
        },
        setWindParams: (speed, strength, heightInfluence, turbulence) => {
          this.vertexAnimParams[8] = speed;
          this.vertexAnimParams[9] = strength;
          this.vertexAnimParams[10] = heightInfluence;
          this.vertexAnimParams[11] = turbulence;
          this.updateVertexAnimBuffer();
        },
        setPulseParams: (speed, amount, centerX = 0, centerY = 0) => {
          this.vertexAnimParams[12] = speed;
          this.vertexAnimParams[13] = amount;
          this.vertexAnimParams[14] = centerX;
          this.vertexAnimParams[15] = centerY;
          this.updateVertexAnimBuffer();
        },
        setTwistParams: (speed, amount) => {
          this.vertexAnimParams[16] = speed;
          this.vertexAnimParams[17] = amount;
          this.updateVertexAnimBuffer();
        },
        setNoiseParams: (scale4, strength, speed) => {
          this.vertexAnimParams[20] = scale4;
          this.vertexAnimParams[21] = strength;
          this.vertexAnimParams[22] = speed;
          this.updateVertexAnimBuffer();
        },
        setOceanParams: (scale4, height, speed) => {
          this.vertexAnimParams[24] = scale4;
          this.vertexAnimParams[25] = height;
          this.vertexAnimParams[26] = speed;
          this.updateVertexAnimBuffer();
        },
        setIntensity: (value) => {
          this.vertexAnimParams[2] = Math.max(0, Math.min(1, value));
          this.updateVertexAnimBuffer();
        },
        getIntensity: () => {
          return this.vertexAnimParams[2];
        }
      };
      this.updateVertexAnimBuffer = () => {
        this.device.queue.writeBuffer(this.vertexAnimBuffer, 0, this.vertexAnimParams);
      };
      this.vertexAnimParams[2] = 1;
      this.updateVertexAnimBuffer();
      this.updateTime = (time) => {
        this.time += time * this.deltaTimeAdapter;
        this.vertexAnimParams[0] = time;
        this.device.queue.writeBuffer(this.vertexAnimBuffer, 0, this.vertexAnimParams);
      };
      this.modelBindGroup = this.device.createBindGroup({
        label: "modelBindGroup in mesh",
        layout: this.uniformBufferBindGroupLayout,
        entries: [
          { binding: 0, resource: { buffer: this.modelUniformBuffer } },
          { binding: 1, resource: { buffer: this.bonesBuffer } },
          { binding: 2, resource: { buffer: this.vertexAnimBuffer } }
        ]
      });
      this.modelBindGroupInstanced = this.device.createBindGroup({
        label: "modelBindGroup in mesh [instanced]",
        layout: this.uniformBufferBindGroupLayoutInstanced,
        entries: [
          //
          { binding: 0, resource: { buffer: this.instanceBuffer } },
          { binding: 1, resource: { buffer: this.bonesBuffer } },
          { binding: 2, resource: { buffer: this.vertexAnimBuffer } }
        ]
      });
      this.mainPassBindGroupLayout = this.device.createBindGroupLayout({
        label: "mainPassBindGroupLayout mesh [instaced]",
        entries: [
          { binding: 0, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: "depth" } },
          { binding: 1, visibility: GPUShaderStage.FRAGMENT, sampler: { type: "comparison" } }
        ]
      });
      this.effects = {};
      console.log(">>>>>>>>>>>>>EFFECTS>>>>>>>>>>>>>>>>>>>>>>>");
      if (this.pointerEffect && this.pointerEffect.enabled === true) {
        let pf = navigator.gpu.getPreferredCanvasFormat();
        pf = "rgba16float";
        if (typeof this.pointerEffect.pointer !== "undefined" && this.pointerEffect.pointer == true) {
          this.effects.pointer = new PointerEffect(device2, pf, this, true);
        }
        if (typeof this.pointerEffect.ballEffect !== "undefined" && this.pointerEffect.ballEffect == true) {
          this.effects.ballEffect = new GenGeo(device2, pf, "sphere");
        }
        if (typeof this.pointerEffect.energyBar !== "undefined" && this.pointerEffect.energyBar == true) {
          this.effects.energyBar = new HPBarEffect(device2, pf);
          this.effects.manaBar = new MANABarEffect(device2, pf);
        }
        if (typeof this.pointerEffect.flameEffect !== "undefined" && this.pointerEffect.flameEffect == true) {
          this.effects.flameEffect = new FlameEffect(device2, pf);
        }
        if (typeof this.pointerEffect.pointEffect !== "undefined" && this.pointerEffect.pointEffect == true) {
          this.effects.pointEffect = new PointEffect(device2, pf);
        }
        if (typeof this.pointerEffect.flameEmitter !== "undefined" && this.pointerEffect.flameEmitter == true) {
          this.effects.flameEmitter = new FlameEmitter(device2, pf);
        }
        if (typeof this.pointerEffect.circlePlane !== "undefined" && this.pointerEffect.circlePlane == true) {
          this.effects.circlePlane = new GenGeo(device2, pf, "circlePlane");
        }
        if (typeof this.pointerEffect.circlePlaneTex !== "undefined" && this.pointerEffect.circlePlaneTex == true) {
          this.effects.circlePlaneTex = new GenGeoTexture(device2, pf, "ring", this.pointerEffect.circlePlaneTexPath);
        }
        if (typeof this.pointerEffect.circle !== "undefined" && this.pointerEffect.circlePlaneTexPath !== "undefined") {
          this.effects.circle = new GenGeoTexture2(device2, pf, "circle2", this.pointerEffect.circlePlaneTexPath);
        }
      }
      this.getTransformationMatrix = (mainRenderBundle, spotLight, index) => {
        const now = Date.now();
        const dt = (now - this.lastFrameMS) / this.mainCameraParams.responseCoef;
        this.lastFrameMS = now;
        const camera = this.cameras[this.mainCameraParams.type];
        if (index == 0) camera.update(dt, inputHandler());
        const camVP = mat4Impl.multiply(camera.projectionMatrix, camera.view);
        const sceneData = new Float32Array(48);
        sceneData.set(spotLight.viewProjMatrix, 0);
        sceneData.set(camVP, 16);
        sceneData.set([camera.position.x, camera.position.y, camera.position.z, 0], 32);
        sceneData.set([spotLight.position[0], spotLight.position[1], spotLight.position[2], 0], 36);
        sceneData.set([this.globalAmbient[0], this.globalAmbient[1], this.globalAmbient[2], 0], 40);
        sceneData.set([this.time, dt, 0, 0], 44);
        device2.queue.writeBuffer(
          this.sceneUniformBuffer,
          0,
          sceneData.buffer,
          sceneData.byteOffset,
          sceneData.byteLength
        );
      };
      this.getModelMatrix = (pos2, useScale = false) => {
        let modelMatrix = mat4Impl.identity();
        mat4Impl.translate(modelMatrix, [pos2.x, pos2.y, pos2.z], modelMatrix);
        if (this.itIsPhysicsBody) {
          mat4Impl.rotate(
            modelMatrix,
            [this.rotation.axis.x, this.rotation.axis.y, this.rotation.axis.z],
            degToRad(this.rotation.angle),
            modelMatrix
          );
        } else {
          mat4Impl.rotateX(modelMatrix, this.rotation.getRotX(), modelMatrix);
          mat4Impl.rotateY(modelMatrix, this.rotation.getRotY(), modelMatrix);
          mat4Impl.rotateZ(modelMatrix, this.rotation.getRotZ(), modelMatrix);
        }
        if (useScale == true) mat4Impl.scale(modelMatrix, [this.scale[0], this.scale[1], this.scale[2]], modelMatrix);
        return modelMatrix;
      };
      this.done = true;
      try {
        this.setupPipeline();
      } catch (err) {
        console.log(`Err in create pipeline ${err}`, LOG_WARN);
      }
    }).then(() => {
      if (typeof this.objAnim !== "undefined" && this.objAnim !== null) {
        console.log("updateMeshListBuffers...");
        this.updateMeshListBuffers();
      }
    });
  }
  setupPipeline = () => {
    this.createBindGroupForRender();
    const pipelineLayout = this.device.createPipelineLayout({
      label: "PipelineLayout Mesh",
      bindGroupLayouts: [
        this.bglForRender,
        this.uniformBufferBindGroupLayoutInstanced,
        this.selectedBindGroupLayout
      ]
    });
    const vertexModule = this.device.createShaderModule({
      label: "VertexShader Mesh",
      code: vertexWGSLInstanced
    });
    const fragmentModule = this.device.createShaderModule({
      label: "FragmentShader Mesh",
      code: this.isVideo == true ? fragmentVideoWGSL : this.getMaterial()
    });
    const vertexState = {
      entryPoint: "main",
      module: vertexModule,
      buffers: this.vertexBuffers
    };
    const fragmentConstants = {
      shadowDepthTextureSize: this.shadowDepthTextureSize
    };
    this.pipeline = this.device.createRenderPipeline({
      label: "Pipeline Opaque \u2705",
      layout: pipelineLayout,
      vertex: vertexState,
      fragment: {
        entryPoint: "main",
        module: fragmentModule,
        constants: fragmentConstants,
        targets: [{
          format: "rgba16float"
        }]
      },
      depthStencil: {
        depthWriteEnabled: true,
        depthCompare: "less",
        format: "depth24plus"
      },
      primitive: this.primitive
    });
    this.pipelineTransparent = this.device.createRenderPipeline({
      label: "Pipeline Transparent \u2705",
      layout: pipelineLayout,
      vertex: vertexState,
      fragment: {
        entryPoint: "main",
        module: fragmentModule,
        constants: fragmentConstants,
        targets: [{
          format: "rgba16float",
          blend: {
            color: {
              srcFactor: "src-alpha",
              dstFactor: "one-minus-src-alpha",
              operation: "add"
            },
            alpha: {
              srcFactor: "one",
              dstFactor: "one-minus-src-alpha",
              operation: "add"
            }
          }
        }]
      },
      depthStencil: {
        depthWriteEnabled: false,
        // transparent never writes depth
        depthCompare: "less",
        format: "depth24plus"
      },
      primitive: this.primitive
    });
  };
  updateModelUniformBuffer = () => {
  };
  createGPUBuffer(dataArray, usage) {
    if (!dataArray || typeof dataArray.length !== "number") {
      throw new Error("Invalid array passed to createGPUBuffer");
    }
    const size2 = dataArray.length * dataArray.BYTES_PER_ELEMENT;
    if (!Number.isFinite(size2) || size2 <= 0) {
      throw new Error(`Invalid buffer size: ${size2}`);
    }
    const buffer = this.device.createBuffer({ size: size2, usage, mappedAtCreation: true });
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
      mesh.vertexNormalsBuffer = this.device.createBuffer({
        size: mesh.vertexNormals.length * Float32Array.BYTES_PER_ELEMENT,
        usage: GPUBufferUsage.VERTEX,
        mappedAtCreation: true
      });
      new Float32Array(mesh.vertexNormalsBuffer.getMappedRange()).set(mesh.vertexNormals);
      mesh.vertexNormalsBuffer.unmap();
      mesh.vertexTexCoordsBuffer = this.device.createBuffer({
        size: mesh.textures.length * Float32Array.BYTES_PER_ELEMENT,
        usage: GPUBufferUsage.VERTEX,
        mappedAtCreation: true
      });
      new Float32Array(mesh.vertexTexCoordsBuffer.getMappedRange()).set(mesh.textures);
      mesh.vertexTexCoordsBuffer.unmap();
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
  drawElements = (pass2, lightContainer) => {
    if (this.isVideo) {
      this.updateVideoTexture();
    }
    pass2.setBindGroup(0, this.sceneBindGroupForRender);
    if (this instanceof BVHPlayerInstances) {
      pass2.setBindGroup(1, this.modelBindGroupInstanced);
    } else {
      pass2.setBindGroup(1, this.modelBindGroup);
    }
    if (this.isVideo == false) {
      let bindIndex = 2;
      for (const light of lightContainer) {
        pass2.setBindGroup(bindIndex++, light.getMainPassBindGroup(this));
      }
    }
    if (this.selectedBindGroup) {
      pass2.setBindGroup(2, this.selectedBindGroup);
    }
    pass2.setBindGroup(3, this.waterBindGroup);
    pass2.setVertexBuffer(0, this.vertexBuffer);
    pass2.setVertexBuffer(1, this.vertexNormalsBuffer);
    pass2.setVertexBuffer(2, this.vertexTexCoordsBuffer);
    if (this.joints) {
      if (this.constructor.name === "BVHPlayer" || this.constructor.name === "BVHPlayerInstances") {
        pass2.setVertexBuffer(3, this.mesh.jointsBuffer);
        pass2.setVertexBuffer(4, this.mesh.weightsBuffer);
      } else {
        pass2.setVertexBuffer(3, this.joints.buffer);
        pass2.setVertexBuffer(4, this.weights.buffer);
      }
    }
    if (this.mesh.tangentsBuffer) {
      pass2.setVertexBuffer(5, this.mesh.tangentsBuffer);
    }
    pass2.setIndexBuffer(this.indexBuffer, "uint16");
    if (this.material.useBlend == true) pass2.setPipeline(this.pipelineTransparent);
    else pass2.setPipeline(this.pipeline);
    for (var ins = 1; ins < this.instanceCount; ins++) {
      pass2.drawIndexed(this.indexCount, 1, 0, 0, ins);
    }
  };
  drawElementsAnim = (renderPass, lightContainer) => {
    if (!this.sceneBindGroupForRender || !this.modelBindGroup) {
      console.log(" NULL 1");
      return;
    }
    if (!this.objAnim.meshList[this.objAnim.id + this.objAnim.currentAni]) {
      console.log(" NULL 2");
      return;
    }
    renderPass.setBindGroup(0, this.sceneBindGroupForRender);
    renderPass.setBindGroup(1, this.modelBindGroup);
    const mesh = this.objAnim.meshList[this.objAnim.id + this.objAnim.currentAni];
    if (this.isVideo == false) {
      let bindIndex = 2;
      for (const light of lightContainer) {
        renderPass.setBindGroup(bindIndex++, light.getMainPassBindGroup(this));
      }
    }
    pass.setBindGroup(3, this.waterBindGroup);
    renderPass.setVertexBuffer(0, mesh.vertexBuffer);
    renderPass.setVertexBuffer(1, mesh.vertexNormalsBuffer);
    renderPass.setVertexBuffer(2, mesh.vertexTexCoordsBuffer);
    if (this.constructor.name === "BVHPlayer") {
      renderPass.setVertexBuffer(3, this.mesh.jointsBuffer);
      renderPass.setVertexBuffer(4, this.mesh.weightsBuffer);
    } else {
      renderPass.setVertexBuffer(3, this.joints.buffer);
      renderPass.setVertexBuffer(4, this.weights.buffer);
    }
    renderPass.setIndexBuffer(mesh.indexBuffer, "uint16");
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
  drawShadows = (shadowPass) => {
    shadowPass.setVertexBuffer(0, this.vertexBuffer);
    shadowPass.setVertexBuffer(1, this.vertexNormalsBuffer);
    shadowPass.setVertexBuffer(2, this.vertexTexCoordsBuffer);
    if (this.joints) {
      if (this.constructor.name === "BVHPlayer" || this.constructor.name === "BVHPlayerInstances") {
        shadowPass.setVertexBuffer(3, this.mesh.jointsBuffer);
        shadowPass.setVertexBuffer(4, this.mesh.weightsBuffer);
      } else {
        shadowPass.setVertexBuffer(3, this.joints.buffer);
        shadowPass.setVertexBuffer(4, this.weights.buffer);
      }
    }
    shadowPass.setIndexBuffer(this.indexBuffer, "uint16");
    if (this instanceof BVHPlayerInstances) {
      shadowPass.drawIndexed(this.indexCount, this.instanceCount, 0, 0, 0);
    } else {
      shadowPass.drawIndexed(this.indexCount);
    }
  };
};

// ../../../engine/loaders/bvh-instaced.js
var BVHPlayerInstances = class extends MEMeshObjInstances {
  constructor(o2, bvh, glb, primitiveIndex, skinnedNodeIndex, canvas, device2, context, inputHandler, globalAmbient) {
    super(canvas, device2, context, o2, inputHandler, globalAmbient, glb, primitiveIndex, skinnedNodeIndex);
    this.bvh = {};
    this.glb = glb;
    this.currentFrame = 0;
    this.fps = 30;
    this.timeAccumulator = 0;
    this.scaleBoneTest = 1;
    this.primitiveIndex = primitiveIndex;
    if (!this.bvh.sharedState) {
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
    this.nodeWorldMatrices = Array.from(
      { length: this.glb.nodes.length },
      () => mat4Impl.identity()
    );
    this.startTime = performance.now() / 1e3;
    this.MAX_BONES = 100;
    this.skeleton = [];
    this.animationSpeed = 1e3;
    this.inverseBindMatrices = [];
    this.initInverseBindMatrices();
    this.makeSkeletal();
  }
  makeSkeletal() {
    let skin = this.glb.skins[0];
    const accessorIndex = skin.inverseBindMatrices;
    if (accessorIndex == null) {
      console.warn("No inverseBindMatrices, using identity matrices");
    }
    const invBindArray = this.inverseBindMatrices;
    this.skeleton = skin.joints.slice();
    for (let i = 0; i < skin.joints.length; i++) {
      const jointIndex = skin.joints[i];
      const jointNode = this.glb.nodes[jointIndex];
      jointNode.inverseBindMatrix = invBindArray.slice(i * 16, (i + 1) * 16);
      if (!jointNode.transform) {
        jointNode.transform = new Float32Array([
          1,
          0,
          0,
          0,
          0,
          1,
          0,
          0,
          0,
          0,
          1,
          0,
          0,
          0,
          0,
          1
        ]);
      }
      if (!jointNode.translation || !jointNode.rotation || !jointNode.scale) {
        const { translation: translation3, rotation: rotation3, scale: scale4 } = this.decomposeMatrix(jointNode.transform);
        jointNode.translation = translation3;
        jointNode.rotation = rotation3;
        jointNode.scale = scale4;
      }
    }
    this.glb.animationIndex = 0;
    for (let j = 0; j < this.glb.glbJsonData.animations.length; j++) {
      if (this.glb.glbJsonData.animations[j].name.indexOf("Armature") !== -1) {
        this.glb.animationIndex = j;
      }
    }
  }
  initInverseBindMatrices(skinIndex = 0) {
    const skin = this.glb.skins[skinIndex];
    const invBindAccessorIndex = skin.inverseBindMatrices;
    if (invBindAccessorIndex === void 0 || invBindAccessorIndex === null) {
      console.warn("No inverseBindMatrices accessor for skin", skinIndex);
      return;
    }
    const invBindArray = this.getAccessorArray(this.glb, invBindAccessorIndex);
    this.inverseBindMatrices = invBindArray;
  }
  getNumberOfFramesCurAni() {
    const anim = this.glb.glbJsonData.animations[this.glb.animationIndex];
    let maxFrames = 0;
    if (typeof anim == "undefined") {
      console.log("[anim undefined]", this.name);
      return 1;
    }
    for (const sampler of anim.samplers) {
      const inputAccessor = this.glb.glbJsonData.accessors[sampler.input];
      if (inputAccessor.count > maxFrames) maxFrames = inputAccessor.count;
    }
    return maxFrames;
  }
  getAnimationLength(animation) {
    let maxTime = 0;
    for (const channel of animation.channels) {
      const sampler = animation.samplers[channel.sampler];
      const inputTimes = this.getAccessorArray(this.glb, sampler.input);
      const lastTime = inputTimes[inputTimes.length - 1];
      if (lastTime > maxTime) maxTime = lastTime;
    }
    return maxTime;
  }
  update(deltaTime) {
    const frameTime = 1 / this.fps;
    this.sharedState.timeAccumulator += deltaTime;
    while (this.sharedState.timeAccumulator >= frameTime) {
      this.sharedState.currentFrame = (this.sharedState.currentFrame + 1) % this.getNumberOfFramesCurAni();
      this.sharedState.timeAccumulator -= frameTime;
    }
    var inTime = this.getAnimationLength(this.glb.glbJsonData.animations[this.glb.animationIndex]);
    if (this.sharedState.animationStarted == false && this.sharedState.emitAnimationEvent == true) {
      this.sharedState.animationStarted = true;
      setTimeout(() => {
        this.sharedState.animationStarted = false;
        dispatchEvent(new CustomEvent(`animationEnd-${this.name}`, {
          detail: {
            animationName: this.glb.glbJsonData.animations[this.glb.animationIndex].name
          }
        }));
      }, inTime * 1e3);
    }
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
    const byteLength = accessor.count * this.getNumComponents(accessor.type) * (accessor.componentType === 5126 ? 4 : 2);
    const bufferDef = glb.glbBinaryBuffer;
    const slice = this.getBufferSlice(bufferDef, byteOffset, byteLength);
    switch (accessor.componentType) {
      case 5126:
        return new Float32Array(slice);
      case 5123:
        return new Uint16Array(slice);
      case 5121:
        return new Uint8Array(slice);
      default:
        throw new Error("Unsupported componentType: " + accessor.componentType);
    }
  }
  getAccessorTypeForChannel(path2) {
    switch (path2) {
      case "translation":
        return "VEC3";
      case "rotation":
        return "VEC4";
      case "scale":
        return "VEC3";
      case "weights":
        return "VECN";
      default:
        throw new Error("Unknown channel path: " + path2);
    }
  }
  getNumComponents(type2) {
    switch (type2) {
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
        throw new Error("Unknown type: " + type2);
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
    if (bufferDef instanceof GLTFBuffer) {
      return bufferDef.arrayBuffer.slice(
        bufferDef.byteOffset + (byteOffset || 0),
        bufferDef.byteOffset + (byteOffset || 0) + byteLength
      );
    }
    if (bufferDef instanceof ArrayBuffer) {
      return bufferDef.slice(byteOffset, byteOffset + byteLength);
    }
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
    let dot2 = a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];
    if (dot2 < 0) {
      b = b.map((v) => -v);
      dot2 = -dot2;
    }
    if (dot2 > 0.9995) return lerpVec(a, b, t);
    const theta0 = Math.acos(dot2);
    const theta = theta0 * t;
    const sinTheta = Math.sin(theta);
    const sinTheta0 = Math.sin(theta0);
    const s0 = Math.cos(theta) - dot2 * sinTheta / sinTheta0;
    const s1 = sinTheta / sinTheta0;
    return a.map((v, i) => s0 * v + s1 * b[i]);
  }
  // naive quaternion to 4x4 matrix
  quatToMat4(q) {
    const [x2, y2, z, w] = q;
    const xx = x2 * x2, yy = y2 * y2, zz = z * z;
    const xy = x2 * y2, xz = x2 * z, yz = y2 * z, wx = w * x2, wy = w * y2, wz = w * z;
    return new Float32Array([
      1 - 2 * (yy + zz),
      2 * (xy + wz),
      2 * (xz - wy),
      0,
      2 * (xy - wz),
      1 - 2 * (xx + zz),
      2 * (yz + wx),
      0,
      2 * (xz + wy),
      2 * (yz - wx),
      1 - 2 * (xx + yy),
      0,
      0,
      0,
      0,
      1
    ]);
  }
  // Compose TRS to a 4×4
  composeMatrix(translation3, rotationQuat, scale4) {
    const m = mat4Impl.identity();
    mat4Impl.translate(m, translation3, m);
    const rot2 = mat4Impl.fromQuat(rotationQuat);
    mat4Impl.multiply(m, rot2, m);
    mat4Impl.scale(m, scale4, m);
    return m;
  }
  decomposeMatrix(m) {
    const t = new Float32Array([m[12], m[13], m[14]]);
    const cx = [m[0], m[1], m[2]];
    const cy = [m[4], m[5], m[6]];
    const cz = [m[8], m[9], m[10]];
    const len2 = (v) => Math.hypot(v[0], v[1], v[2]);
    let sx = len2(cx), sy = len2(cy), sz = len2(cz);
    if (sx === 0) sx = 1;
    if (sy === 0) sy = 1;
    if (sz === 0) sz = 1;
    const r00 = m[0] / sx, r01 = m[4] / sy, r02 = m[8] / sz;
    const r10 = m[1] / sx, r11 = m[5] / sy, r12 = m[9] / sz;
    const r20 = m[2] / sx, r21 = m[6] / sy, r22 = m[10] / sz;
    const det3 = r00 * (r11 * r22 - r12 * r21) - r01 * (r10 * r22 - r12 * r20) + r02 * (r10 * r21 - r11 * r20);
    if (det3 < 0) {
      sz = -sz;
    }
    const trace = r00 + r11 + r22;
    let qx, qy, qz, qw;
    if (trace > 1e-5) {
      const s = Math.sqrt(trace + 1) * 2;
      qw = 0.25 * s;
      qx = (r21 - r12) / s;
      qy = (r02 - r20) / s;
      qz = (r10 - r01) / s;
    } else if (r00 > r11 && r00 > r22) {
      const s = Math.sqrt(1 + r00 - r11 - r22) * 2;
      qw = (r21 - r12) / s;
      qx = 0.25 * s;
      qy = (r01 + r10) / s;
      qz = (r02 + r20) / s;
    } else if (r11 > r22) {
      const s = Math.sqrt(1 + r11 - r00 - r22) * 2;
      qw = (r02 - r20) / s;
      qx = (r01 + r10) / s;
      qy = 0.25 * s;
      qz = (r12 + r21) / s;
    } else {
      const s = Math.sqrt(1 + r22 - r00 - r11) * 2;
      qw = (r10 - r01) / s;
      qx = (r02 + r20) / s;
      qy = (r12 + r21) / s;
      qz = 0.25 * s;
    }
    const rot2 = new Float32Array([qx, qy, qz, qw]);
    const scale4 = new Float32Array([sx, sy, sz]);
    return { translation: t, rotation: rot2, scale: scale4 };
  }
  slerp(q0, q1, t, out) {
    let dot2 = q0[0] * q1[0] + q0[1] * q1[1] + q0[2] * q1[2] + q0[3] * q1[3];
    if (dot2 < 0) {
      dot2 = -dot2;
      q1 = [-q1[0], -q1[1], -q1[2], -q1[3]];
    }
    if (dot2 > 0.9995) {
      for (let i = 0; i < 4; i++) out[i] = q0[i] + t * (q1[i] - q0[i]);
      const len2 = Math.hypot(...out);
      for (let i = 0; i < 4; i++) out[i] /= len2;
      return;
    }
    const theta0 = Math.acos(dot2);
    const theta = theta0 * t;
    const sinTheta = Math.sin(theta);
    const sinTheta0 = Math.sin(theta0);
    const s0 = Math.cos(theta) - dot2 * sinTheta / sinTheta0;
    const s1 = sinTheta / sinTheta0;
    for (let i = 0; i < 4; i++) {
      out[i] = s0 * q0[i] + s1 * q1[i];
    }
  }
  updateSingleBoneCubeAnimation(glbAnimation, nodes, time, boneMatrices) {
    const channels = glbAnimation.channels;
    const samplers = glbAnimation.samplers;
    const nodeChannels = /* @__PURE__ */ new Map();
    for (const channel of channels) {
      if (!nodeChannels.has(channel.target.node)) nodeChannels.set(channel.target.node, []);
      nodeChannels.get(channel.target.node).push(channel);
    }
    for (let j = 0; j < this.skeleton.length; j++) {
      const nodeIndex = this.skeleton[j];
      const node2 = nodes[nodeIndex];
      if (!node2.translation) node2.translation = new Float32Array([0, 0, 0]);
      if (!node2.rotation) node2.rotation = quatImpl.create();
      if (!node2.scale) node2.scale = new Float32Array([1, 1, 1]);
      if (!node2.originalTranslation) node2.originalTranslation = node2.translation.slice();
      if (!node2.originalRotation) node2.originalRotation = node2.rotation.slice();
      if (!node2.originalScale) node2.originalScale = node2.scale.slice();
      const channelsForNode = nodeChannels.get(nodeIndex) || [];
      for (const channel of channelsForNode) {
        const path2 = channel.target.path;
        const sampler = samplers[channel.sampler];
        const inputTimes = this.getAccessorArray(this.glb, sampler.input);
        const outputArray = this.getAccessorArray(this.glb, sampler.output);
        const numComponents = path2 === "rotation" ? 4 : 3;
        const animTime = time % inputTimes[inputTimes.length - 1];
        let i = 0;
        while (i < inputTimes.length - 1 && inputTimes[i + 1] <= animTime) i++;
        const t0 = inputTimes[i];
        const t1 = inputTimes[Math.min(i + 1, inputTimes.length - 1)];
        const factor = t1 !== t0 ? (animTime - t0) / (t1 - t0) : 0;
        const v0 = outputArray.subarray(i * numComponents, (i + 1) * numComponents);
        const v1 = outputArray.subarray(
          Math.min(i + 1, inputTimes.length - 1) * numComponents,
          Math.min(i + 2, inputTimes.length) * numComponents
        );
        if (path2 === "translation") {
          for (let k = 0; k < 3; k++)
            node2.translation[k] = v0[k] * (1 - factor) + v1[k] * factor;
        } else if (path2 === "scale") {
          for (let k = 0; k < 3; k++)
            node2.scale[k] = v0[k] * (1 - factor) + v1[k] * factor;
        } else if (path2 === "rotation") {
          this.slerp(v0, v1, factor, node2.rotation);
        }
      }
      node2.transform = this.composeMatrix(node2.translation, node2.rotation, node2.scale);
    }
    const computeWorld = (nodeIndex) => {
      const node2 = nodes[nodeIndex];
      if (!node2.worldMatrix) node2.worldMatrix = mat4Impl.create();
      let parentWorld = node2.parent !== null ? nodes[node2.parent].worldMatrix : null;
      if (parentWorld) {
        mat4Impl.multiply(parentWorld, node2.transform, node2.worldMatrix);
      } else {
        mat4Impl.copy(node2.transform, node2.worldMatrix);
      }
      mat4Impl.scale(node2.worldMatrix, [this.scaleBoneTest, this.scaleBoneTest, this.scaleBoneTest], node2.worldMatrix);
      if (node2.children) {
        for (const childIndex of node2.children) computeWorld(childIndex);
      }
    };
    for (let i = 0; i < nodes.length; i++) {
      if (nodes[i].parent === null || nodes[i].parent === void 0) {
        computeWorld(i);
      }
    }
    for (let j = 0; j < this.skeleton.length; j++) {
      const jointNode = nodes[this.skeleton[j]];
      const finalMat = mat4Impl.create();
      mat4Impl.multiply(jointNode.worldMatrix, jointNode.inverseBindMatrix, finalMat);
      boneMatrices.set(finalMat, j * 16);
    }
    this.device.queue.writeBuffer(this.bonesBuffer, 0, boneMatrices);
    return boneMatrices;
  }
};

// ../../../engine/plugin/tooltip/ToolTip.js
var METoolTip = class {
  constructor() {
    const tooltip = document.createElement("div");
    tooltip.style.position = "fixed";
    tooltip.style.padding = "6px 10px";
    tooltip.style.background = "rgba(0,0,0,0.8)";
    tooltip.style.color = "#fff";
    tooltip.style.borderRadius = "6px";
    tooltip.style.fontFamily = "Arial";
    tooltip.style.fontSize = "12px";
    tooltip.style.pointerEvents = "none";
    tooltip.style.opacity = "0";
    tooltip.style.transition = "opacity 0.2s ease";
    tooltip.style.zIndex = "9999";
    tooltip.style.whiteSpace = "pre-line";
    document.body.appendChild(tooltip);
    this.tooltip = tooltip;
  }
  attachTooltip(element, text) {
    element.addEventListener("mouseenter", (e) => {
      this.tooltip.textContent = text;
      this.tooltip.style.opacity = "1";
    });
    element.addEventListener("mousemove", (e) => {
      this.tooltip.style.left = e.clientX + 12 + "px";
      this.tooltip.style.top = e.clientY + 12 + "px";
    });
    element.addEventListener("mouseleave", () => {
      this.tooltip.style.opacity = "0";
    });
  }
};

// ../client.js
var MEEditorClient = class {
  ws = null;
  constructor(typeOfRun, name2) {
    this.ws = new WebSocket("ws://localhost:1243");
    this.ws.onopen = () => {
      if (typeOfRun == "created from editor") {
        console.log(`%cCreated from editor. Watch <signal> ${name2}`, LOG_FUNNY_ARCADE2);
        let o2 = {
          action: "watch",
          name: name2
        };
        o2 = JSON.stringify(o2);
        this.ws.send(o2);
        o2 = {
          action: "list",
          path: name2
        };
        o2 = JSON.stringify(o2);
        this.ws.send(o2);
      }
      console.log("%c[EDITOR][WS OPEN]", LOG_FUNNY_ARCADE2);
      document.dispatchEvent(new CustomEvent("editorx-ws-ready", {}));
    };
    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("%c[EDITOR][WS MESSAGE]", LOG_FUNNY_ARCADE2, data);
        if (data && data.ok == true && data.payload && data.payload.redirect == true) {
          setTimeout(() => location.assign(data.name + ".html"), 2e3);
        } else if (data.payload && data.payload == "stop-watch done") {
          mb.show("watch-stoped");
        } else if (data.listAssetsForGraph) {
          document.dispatchEvent(new CustomEvent("editorx-update-assets-list", {
            detail: data
          }));
        } else if (data.listAssets) {
          document.dispatchEvent(new CustomEvent("la", {
            detail: data
          }));
        } else if (data.projects) {
          const projects = data.payload.filter((item) => item.name !== "readme.md").map((item) => item.name.trim());
          if (projects.length === 0) {
            console.warn("No projects found");
            return;
          }
          const txt = "Project list: \n" + projects.map((p) => `- ${p}`).join("\n") + "\n  Choose project name:";
          const projectName = prompt(txt);
          if (projectName) {
            console.log("Project name:", projectName);
            location.assign(projectName + ".html");
          } else {
            console.error("Project loading cancelled");
          }
        } else if (data.details) {
          document.dispatchEvent(new CustomEvent("file-detail-data", {
            detail: data
          }));
        } else if (data.refresh == "refresh") {
          setTimeout(() => document.dispatchEvent(new CustomEvent("updateSceneContainer", { detail: {} })), 1e3);
        } else {
          if (data.methodSaves && data.ok == true) {
            mb.show("Graph saved \u2705");
            if (typeof data.graphName === "string") document.dispatchEvent(new CustomEvent("get-shader-graphs", {}));
          }
          if (data.methodLoads && data.ok == true && data.shaderGraphs) {
            mb.show("Graphs list \u2705" + data.shaderGraphs);
            document.dispatchEvent(new CustomEvent("on-shader-graphs-list", { detail: data.shaderGraphs }));
          } else if (data.methodLoads && data.ok == true) {
            mb.show("Graph loads \u2705", data);
            document.dispatchEvent(new CustomEvent("on-graph-load", { detail: data.graph }));
          } else if (data.aiGenGraph && data.ok == true) {
            mb.show("AIGraph Generator response graph part \u2705", data.aiGenNodes);
            document.dispatchEvent(new CustomEvent("on-ai-graph-response", { detail: data.aiGenNodes }));
          } else {
            mb.show("From editorX:" + data.ok);
          }
        }
      } catch (e) {
        console.error("[WS ERROR PARSE]", e);
      }
    };
    this.ws.onerror = (err) => {
      console.error("%c[WS ERROR]", "color: red", err);
      document.dispatchEvent(new CustomEvent("editor-not-running", { detail: {} }));
    };
    this.ws.onclose = () => {
      console.log("%c[WS CLOSED]", "color: gray");
    };
    this.attachEvents();
  }
  attachEvents() {
    document.addEventListener("lp", (e) => {
      console.info("Load project <signal>");
      let o2 = {
        action: "lp"
      };
      o2 = JSON.stringify(o2);
      this.ws.send(o2);
    });
    document.addEventListener("cnp", (e) => {
      console.info("Create new project <signal>");
      let o2 = {
        action: "cnp",
        name: e.detail.name,
        features: e.detail.features
      };
      o2 = JSON.stringify(o2);
      this.ws.send(o2);
    });
    document.addEventListener("stop-watch", (e) => {
      console.info("stop-watch <signal>");
      let o2 = {
        action: "stop-watch",
        name: e.detail.name
      };
      o2 = JSON.stringify(o2);
      this.ws.send(o2);
    });
    document.addEventListener("start-watch", (e) => {
      console.info("start-watch <signal>");
      let o2 = {
        action: "watch",
        name: e.detail.name
      };
      o2 = JSON.stringify(o2);
      this.ws.send(o2);
    });
    document.addEventListener("nav-folder", (e) => {
      console.info("nav-folder <signal>");
      let o2 = {
        action: "nav-folder",
        name: e.detail.name,
        rootFolder: e.detail.rootFolder
      };
      o2 = JSON.stringify(o2);
      this.ws.send(o2);
    });
    document.addEventListener("file-detail", (e) => {
      console.info("%c[file-detail <signal>]", LOG_FUNNY_ARCADE2);
      let o2 = {
        action: "file-detail",
        name: e.detail.name,
        rootFolder: e.detail.rootFolder
      };
      o2 = JSON.stringify(o2);
      this.ws.send(o2);
    });
    document.addEventListener("web.editor.addCube", (e) => {
      console.info("%c[web.editor.addCube]", LOG_FUNNY_ARCADE2);
      let o2 = {
        action: "addCube",
        projectName: location.href.split("/public/")[1].split(".")[0],
        options: e.detail
      };
      o2 = JSON.stringify(o2);
      this.ws.send(o2);
    });
    document.addEventListener("web.editor.addSphere", (e) => {
      console.info("%c[web.editor.addSphere]", LOG_FUNNY_ARCADE2);
      let o2 = {
        action: "addSphere",
        projectName: location.href.split("/public/")[1].split(".")[0],
        options: e.detail
      };
      o2 = JSON.stringify(o2);
      this.ws.send(o2);
    });
    document.addEventListener("save-methods", (e) => {
      console.info("%cSave methods <signal>", LOG_FUNNY_ARCADE2);
      let o2 = {
        action: "save-methods",
        methodsContainer: e.detail.methodsContainer
      };
      o2 = JSON.stringify(o2);
      this.ws.send(o2);
    });
    document.addEventListener("save-graph", (e) => {
      console.info("%cSave graph <signal>", LOG_FUNNY_ARCADE2);
      let o2 = {
        action: "save-graph",
        graphData: e.detail
      };
      o2 = JSON.stringify(o2);
      this.ws.send(o2);
    });
    document.addEventListener("save-shader-graph", (e) => {
      console.info("%cSave shader-graph <signal>", LOG_FUNNY_ARCADE2);
      let o2 = {
        action: "save-shader-graph",
        graphData: e.detail
      };
      o2 = JSON.stringify(o2);
      this.ws.send(o2);
    });
    document.addEventListener("aiGenGraphCall", (e) => {
      console.info("%caiGenGraphCall fluxCodexVertex <signal>", LOG_FUNNY_ARCADE2);
      let o2 = {
        action: "aiGenGraphCall",
        prompt: e.detail
      };
      o2 = JSON.stringify(o2);
      this.ws.send(o2);
    });
    document.addEventListener("load-shader-graph", (e) => {
      console.info("%cLoad shader-graph <signal>", LOG_FUNNY_ARCADE2);
      let o2 = {
        action: "load-shader-graph",
        name: e.detail
      };
      o2 = JSON.stringify(o2);
      this.ws.send(o2);
    });
    document.addEventListener("delete-shader-graph", (e) => {
      console.info("%cDelete shader-graph <signal>", LOG_FUNNY_ARCADE2);
      let o2 = {
        action: "delete-shader-graph",
        name: e.detail
      };
      o2 = JSON.stringify(o2);
      this.ws.send(o2);
    });
    document.addEventListener("get-shader-graphs", () => {
      console.info("%cget-shader-graphs <signal>", LOG_FUNNY_ARCADE2);
      let o2 = {
        action: "get-shader-graphs"
      };
      o2 = JSON.stringify(o2);
      this.ws.send(o2);
    });
    document.addEventListener("web.editor.addGlb", (e) => {
      console.log("%c[web.editor.addGlb]: " + e.detail, LOG_FUNNY_ARCADE2);
      let o2 = {
        action: "addGlb",
        projectName: location.href.split("/public/")[1].split(".")[0],
        options: e.detail
      };
      o2 = JSON.stringify(o2);
      this.ws.send(o2);
    });
    document.addEventListener("web.editor.addObj", (e) => {
      console.log("%c[web.editor.addObj]: " + e.detail, LOG_FUNNY_ARCADE2);
      let o2 = {
        action: "addObj",
        projectName: location.href.split("/public/")[1].split(".")[0],
        options: e.detail
      };
      o2 = JSON.stringify(o2);
      this.ws.send(o2);
    });
    document.addEventListener("web.editor.addMp3", (e) => {
    });
    document.addEventListener("web.editor.delete", (e) => {
      console.log("%c[web.editor.delete]: " + e.detail, LOG_FUNNY_ARCADE2);
      let o2 = {
        action: "delete-obj",
        projectName: location.href.split("/public/")[1].split(".")[0],
        name: e.detail.prefix
      };
      o2 = JSON.stringify(o2);
      this.ws.send(o2);
    });
    document.addEventListener("web.editor.update.pos", (e) => {
      console.log("%c[web.editor.update.pos]: " + e.detail, LOG_FUNNY_ARCADE2);
      let o2 = {
        action: "updatePos",
        projectName: location.href.split("/public/")[1].split(".")[0],
        data: e.detail
      };
      o2 = JSON.stringify(o2);
      this.ws.send(o2);
    });
    document.addEventListener("web.editor.update.rot", (e) => {
      console.log("%c[web.editor.update.rot]: " + e.detail, LOG_FUNNY_ARCADE2);
      let o2 = {
        action: "updateRot",
        projectName: location.href.split("/public/")[1].split(".")[0],
        data: e.detail
      };
      o2 = JSON.stringify(o2);
      this.ws.send(o2);
    });
    document.addEventListener("web.editor.update.scale", (e) => {
      console.log("%c[web.editor.update.scale]: " + e.detail, LOG_FUNNY_ARCADE2);
      let o2 = {
        action: "updateScale",
        projectName: location.href.split("/public/")[1].split(".")[0],
        data: e.detail
      };
      o2 = JSON.stringify(o2);
      this.ws.send(o2);
    });
    document.addEventListener("web.editor.update.useScale", (e) => {
      console.log("%c[web.editor.update.useScale]: " + e.detail, LOG_FUNNY_ARCADE2);
      let o2 = {
        action: "useScale",
        projectName: location.href.split("/public/")[1].split(".")[0],
        data: e.detail
      };
      o2 = JSON.stringify(o2);
      this.ws.send(o2);
    });
  }
};

// ../editor.provider.js
var EditorProvider = class {
  constructor(core) {
    this.core = core;
    this.addEditorEvents();
  }
  getNameFromPath(p) {
    return p.split(/[/\\]/).pop().replace(/\.[^/.]+$/, "");
  }
  addEditorEvents() {
    document.addEventListener("web.editor.input", (e) => {
      console.log("[EDITOR-input]: ", e.detail);
      switch (e.detail.propertyId) {
        case "position": {
          console.log("change signal for pos", e.detail);
          if (e.detail.property == "x" || e.detail.property == "y" || e.detail.property == "z") document.dispatchEvent(new CustomEvent("web.editor.update.pos", {
            detail: e.detail
          }));
          break;
        }
        case "rotation": {
          console.log("[signal][rot]");
          if (e.detail.property == "x" || e.detail.property == "y" || e.detail.property == "z") document.dispatchEvent(new CustomEvent("web.editor.update.rot", {
            detail: e.detail
          }));
          break;
        }
        case "scale": {
          console.log("[signal][scale]");
          if (e.detail.property == "0" || e.detail.property == "1" || e.detail.property == "2") {
            document.dispatchEvent(new CustomEvent("web.editor.update.scale", {
              detail: e.detail
            }));
          }
          break;
        }
        default:
          console.log("changes not saved.");
      }
      let sceneObj = this.core.getSceneObjectByName(e.detail.inputFor);
      if (e.detail.property == "no info") {
        sceneObj[e.detail.propertyId] = e.detail.value;
        if (e.detail.propertyId === "useScale") document.dispatchEvent(new CustomEvent("web.editor.update.useScale", { detail: e.detail }));
        return;
      }
      if (sceneObj) {
        sceneObj[e.detail.propertyId][e.detail.property] = parseFloat(e.detail.value);
      } else {
        console.warn("EditorProvider input error");
        return;
      }
    });
    document.addEventListener("web.editor.addCube", (e) => {
      downloadMeshes({ cube: "./res/meshes/blender/cube.obj" }, (m) => {
        const texturesPaths2 = "./res/meshes/blender/cube.png";
        this.core.addMeshObj({
          position: { x: 0, y: 0, z: -20 },
          rotation: { x: 0, y: 0, z: 0 },
          rotationSpeed: { x: 0, y: 0, z: 0 },
          texturesPaths: [texturesPaths2],
          // useUVShema4x2: true,
          name: "" + e.detail.index,
          mesh: m.cube,
          raycast: { enabled: true, radius: 2 },
          physics: {
            enabled: e.detail.physics,
            geometry: "Cube"
          }
        });
      }, { scale: [1, 1, 1] });
    });
    document.addEventListener("web.editor.addSphere", (e) => {
      downloadMeshes({ mesh: "./res/meshes/shapes/sphere.obj" }, (m) => {
        const texturesPaths2 = "./res/meshes/blender/cube.png";
        this.core.addMeshObj({
          position: { x: 0, y: 0, z: -20 },
          rotation: { x: 0, y: 0, z: 0 },
          rotationSpeed: { x: 0, y: 0, z: 0 },
          texturesPaths: [texturesPaths2],
          // useUVShema4x2: true,
          name: e.detail.index,
          mesh: m.mesh,
          raycast: { enabled: true, radius: 2 },
          physics: {
            enabled: e.detail.physics,
            geometry: "Sphere"
          }
        });
      }, { scale: [1, 1, 1] });
    });
    document.addEventListener("web.editor.addGlb", async (e) => {
      console.log("[web.editor.addGlb]: ", e.detail.path);
      e.detail.path = e.detail.path.replace("\\res", "res");
      var glbFile01 = await fetch(e.detail.path).then((res) => res.arrayBuffer().then((buf) => uploadGLBModel(buf, this.core.device)));
      this.core.addGlbObj({
        material: { type: "power", useTextureFromGlb: true },
        scale: [2, 2, 2],
        position: { x: 0, y: 0, z: -20 },
        name: this.getNameFromPath(e.detail.path),
        texturesPaths: ["./res/meshes/glb/textures/mutant_origin.png"]
      }, null, glbFile01);
    });
    document.addEventListener("web.editor.addObj", (e) => {
      console.log("[web.editor.addObj]: ", e.detail);
      e.detail.path = e.detail.path.replace("\\res", "res");
      e.detail.path = e.detail.path.replace(/\\/g, "/");
      downloadMeshes({ objMesh: `${e.detail.path}` }, (m) => {
        const texturesPaths2 = "./res/meshes/blender/cube.png";
        this.core.addMeshObj({
          position: { x: 0, y: 0, z: -20 },
          rotation: { x: 0, y: 0, z: 0 },
          rotationSpeed: { x: 0, y: 0, z: 0 },
          texturesPaths: [texturesPaths2],
          // useUVShema4x2: true,
          name: e.detail.index,
          mesh: m.objMesh,
          raycast: { enabled: true, radius: 2 },
          physics: {
            enabled: e.detail.physics,
            geometry: "Cube"
          }
        });
      }, { scale: [1, 1, 1] });
    });
    document.addEventListener("web.editor.delete", (e) => {
      console.log("[web.editor.delete]: ", e.detail.fullName);
      this.core.removeSceneObjectByName(e.detail.fullName);
    });
  }
};

// ../flexCodexShaderAdapter.js
function graphAdapter(compilerResult, nodes) {
  const { structs, uniforms, functions, locals, outputs, mainLines } = compilerResult;
  const globals = /* @__PURE__ */ new Set();
  globals.add("const PI: f32 = 3.141592653589793;");
  globals.add("override shadowDepthTextureSize: f32 = 1024.0;");
  const baseColor = outputs.baseColor || "vec3f(1.0)";
  const alpha = outputs.alpha || "1.0";
  const normal = outputs.normal || "normalize(input.fragNorm)";
  const emissive = outputs.emissive || "vec3f(0.0)";
  for (const node2 of nodes) {
    if (node2.type === "LightShadowNode") {
      functions.push(`
fn computeSpotLight(light: SpotLight, N: vec3f, fragPos: vec3f, V: vec3f, material: PBRMaterialData) -> vec3f {
    let L = normalize(light.position - fragPos);
    let NdotL = max(dot(N, L), 0.0);

    let theta = dot(L, normalize(-light.direction));
    let epsilon = light.innerCutoff - light.outerCutoff;
    var coneAtten = clamp((theta - light.outerCutoff) / epsilon, 0.0, 1.0);

    // coneAtten = 1.0;
    if (coneAtten <= 0.0 || NdotL <= 0.0) {
        return vec3f(0.0);
    }

    let F0 = mix(vec3f(0.04), material.baseColor.rgb, vec3f(material.metallic));
    let H = normalize(L + V);
    let F = F0 + (1.0 - F0) * pow(1.0 - max(dot(H, V), 0.0), 5.0);

    let alpha = material.roughness * material.roughness;
    let NdotH = max(dot(N, H), 0.0);
    let alpha2 = alpha * alpha;
    let denom = (NdotH * NdotH * (alpha2 - 1.0) + 1.0);
    let D = alpha2 / (PI * denom * denom + 1e-5);

    let k = (alpha + 1.0) * (alpha + 1.0) / 8.0;
    let NdotV = max(dot(N, V), 0.0);
    let Gv = NdotV / (NdotV * (1.0 - k) + k);
    let Gl = NdotL / (NdotL * (1.0 - k) + k);
    let G = Gv * Gl;

    let numerator = D * G * F;
    let denominator = 4.0 * NdotV * NdotL + 1e-5;
    let specular = numerator / denominator;

    let kS = F;
    let kD = (vec3f(1.0) - kS) * (1.0 - material.metallic);
    let diffuse = kD * material.baseColor.rgb / PI;

    let radiance = light.color * light.intensity;
    // return (diffuse + specular) * radiance * NdotL * coneAtten;
    return material.baseColor * light.color * light.intensity * NdotL * coneAtten;
}

fn sampleShadow(shadowUV: vec2f, layer: i32, depthRef: f32, normal: vec3f, lightDir: vec3f) -> f32 {
    var visibility: f32 = 0.0;
    let biasConstant: f32 = 0.001;
    let slopeBias = max(0.002 * (1.0 - dot(normal, lightDir)), 0.0);
    let bias = biasConstant + slopeBias;
    let oneOverSize = 1.0 / (shadowDepthTextureSize * 0.5);
    let offsets: array<vec2f, 9> = array<vec2f, 9>(
        vec2(-1.0, -1.0), vec2(0.0, -1.0), vec2(1.0, -1.0),
        vec2(-1.0,  0.0), vec2(0.0,  0.0), vec2(1.0,  0.0),
        vec2(-1.0,  1.0), vec2(0.0,  1.0), vec2(1.0,  1.0)
    );
    for(var i: u32 = 0u; i < 9u; i = i + 1u) {
        visibility += textureSampleCompare(
            shadowMapArray, shadowSampler,
            shadowUV + offsets[i] * oneOverSize,
            layer, depthRef - bias
        );
    }
    return visibility / 9.0;
}
`);
    }
  }
  return `
/* === Engine uniforms === */

// DINAMIC GLOBALS
${[...globals].join("\n")}

// DINAMIC STRUCTS
${[...structs].join("\n")}

// PREDEFINED
struct Scene {
    lightViewProjMatrix  : mat4x4f,
    cameraViewProjMatrix : mat4x4f,
    cameraPos            : vec3f,
    padding2             : f32,
    lightPos             : vec3f,
    padding              : f32,
    globalAmbient        : vec3f,
    padding3             : f32,
    time                 : f32,
    deltaTime            : f32,
    padding4             : vec2f,
};

// PREDEFINED
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

// PREDEFINED
struct MaterialPBR {
    baseColorFactor : vec4f,
    metallicFactor  : f32,
    roughnessFactor : f32,
    _pad1           : f32,
    _pad2           : f32,
};

// PREDEFINED
struct PBRMaterialData {
    baseColor : vec3f,
    metallic  : f32,
    roughness : f32,
    alpha     : f32
};

// PREDEFINED
const MAX_SPOTLIGHTS = 20u;

// PREDEFINED
@group(0) @binding(0) var<uniform> scene : Scene;
@group(0) @binding(1) var shadowMapArray: texture_depth_2d_array;
@group(0) @binding(2) var shadowSampler: sampler_comparison;
@group(0) @binding(3) var meshTexture: texture_2d<f32>;
@group(0) @binding(4) var meshSampler: sampler;
@group(0) @binding(5) var<uniform> spotlights: array<SpotLight, MAX_SPOTLIGHTS>;
@group(0) @binding(6) var metallicRoughnessTex: texture_2d<f32>;
@group(0) @binding(7) var metallicRoughnessSampler: sampler;
@group(0) @binding(8) var<uniform> material: MaterialPBR;

// \u2705 Graph custom uniforms
${[...uniforms].join("\n")}

// \u2705 Graph custom functions
${functions.join("\n\n")}

// PREDEFINED Fragment input
struct FragmentInput {
    @location(0) shadowPos : vec4f,
    @location(1) fragPos   : vec3f,
    @location(2) fragNorm  : vec3f,
    @location(3) uv        : vec2f,
};

// PREDEFINED PBR helpers
fn getPBRMaterial(uv: vec2f) -> PBRMaterialData {
    let texColor = textureSample(meshTexture, meshSampler, uv);
    let baseColor = texColor.rgb * material.baseColorFactor.rgb;
    let mrTex = textureSample(metallicRoughnessTex, metallicRoughnessSampler, uv);
    let metallic = mrTex.b * material.metallicFactor;
    let roughness = mrTex.g * material.roughnessFactor;
    
    // \u2705 Get alpha from texture and material factor
    // let alpha = texColor.a * material.baseColorFactor.a;
    let alpha = material.baseColorFactor.a;
    
    return PBRMaterialData(baseColor, metallic, roughness, alpha);
}

@fragment
fn main(input: FragmentInput) -> @location(0) vec4f {
  // Locals
  ${locals.join("\n  ")}
  ${mainLines.join("\n  ")}
  return ${outputs.outColor};
}
`;
}

// ../flexCodexShader.js
var FragmentShaderRegistry = {};
var FragmentShaderGraph = class {
  constructor(id2) {
    this.id = id2;
    this.nodes = [];
    this.connections = [];
    this.spawnX = 80;
    this.spawnY = 80;
    this.spawnStepX = 220;
    this.spawnStepY = 140;
    this.spawnCol = 0;
    this.runtimeList = [];
    this.runtime_memory = {};
    this.onGraphLoadAttached = false;
  }
  addNode(node2) {
    if (node2.type === "FragmentOutput") {
      const exists = this.nodes.some((n2) => n2.type === "FragmentOutput");
      if (exists) {
        console.warn("FragmentOutput already exists");
        return null;
      }
    }
    this.nodes.push(node2);
    return node2;
  }
  connect(fromNode, fromPin, toNode, toPin) {
    this.connections = this.connections.filter((c) => !(c.toNode === toNode && c.toPin === toPin));
    this.connections.push({ fromNode, fromPin, toNode, toPin });
  }
  getInput(node2, pin) {
    return this.connections.find((c) => c.toNode === node2 && c.toPin === pin);
  }
  compile() {
    const wgsl = FragmentCompiler.compile(this);
    FragmentShaderRegistry[this.id] = wgsl;
    return wgsl;
  }
  nextSpawn() {
    const x2 = this.spawnX + this.spawnCol * this.spawnStepX;
    const y2 = this.spawnY;
    this.spawnCol++;
    if (this.spawnCol >= 3) {
      this.spawnCol = 0;
      this.spawnY += this.spawnStepY;
    }
    return { x: x2, y: y2 };
  }
  makeDraggable(el2, node2, connectionLayer) {
    let ox = 0, oy = 0, drag = false;
    el2.addEventListener("pointerdown", (e) => {
      drag = true;
      ox = e.clientX - el2.offsetLeft;
      oy = e.clientY - el2.offsetTop;
      el2.setPointerCapture(e.pointerId);
    });
    el2.addEventListener("pointermove", (e) => {
      if (!drag) return;
      el2.style.left = e.clientX - ox + "px";
      el2.style.top = e.clientY - oy + "px";
      node2.x = e.clientX - ox;
      node2.y = e.clientY - oy;
      connectionLayer.redrawAll();
    });
    el2.addEventListener("pointerup", () => drag = false);
  }
  clear() {
    this.nodes = [];
    this.connections = [];
    this.spawnX = 80;
    this.spawnY = 80;
    this.spawnCol = 0;
    if (this.connectionLayer) {
      this.connectionLayer.svg.innerHTML = "";
    }
    const container = document.getElementsByClassName("fancy-grid-bg dark");
    if (container) {
      const nodeElements = container[0].querySelectorAll(".nodeShader");
      nodeElements.forEach((el2) => el2.remove());
    }
    this.connectionLayer.redrawAll();
  }
};
var CompileContext = class {
  constructor(shaderGraph) {
    this.shaderGraph = shaderGraph;
    this.cache = /* @__PURE__ */ new Map();
    this.structs = [];
    this.uniforms = [];
    this.functions = /* @__PURE__ */ new Map();
    this.locals = [];
    this.mainLines = [];
    this.tmpIndex = 0;
    this.outputs = {
      outColor: null
    };
  }
  temp(type2, expr) {
    const name2 = `t${this.tmpIndex++}`;
    this.locals.push(`let ${name2}: ${type2} = ${expr};`);
    return name2;
  }
  registerFunction(name2, code) {
    if (!this.functions.has(name2)) {
      this.functions.set(name2, code);
    }
  }
  resolve(node2, pin) {
    const key = `${node2.id}:${pin}`;
    if (this.cache.has(key)) return this.cache.get(key);
    if (!this.resolving) this.resolving = /* @__PURE__ */ new Set();
    if (this.resolving.has(key)) {
      console.warn("Cyclic dependency detected:", key);
      return node2.default?.(pin) ?? "0.0";
    }
    this.resolving.add(key);
    const conn = this.shaderGraph.getInput(node2, pin);
    let value;
    if (conn) {
      value = this.resolve(conn.fromNode, conn.fromPin);
    } else {
      if (node2.inputs && pin in node2.inputs) {
        value = node2.inputs[pin].default;
      } else {
        value = void 0;
      }
    }
    const result2 = node2.build(pin, value, this);
    if (result2?.out !== void 0) {
      this.cache.set(key, result2.out);
    }
    this.resolving.delete(key);
    return result2.out;
  }
};
var FragmentCompiler = class {
  static compile(shaderGraph) {
    const ctx = new CompileContext(shaderGraph);
    shaderGraph.nodes.forEach((n2) => {
      if (n2.type.endsWith("Output")) {
        ctx.resolve(n2, Object.keys(n2.inputs)[0]);
      }
    });
    if (!ctx.outputs.outColor) {
      throw new Error("ShaderGraph: No visual output");
    }
    return {
      structs: ctx.structs,
      uniforms: ctx.uniforms,
      functions: [...ctx.functions.values()],
      locals: ctx.locals,
      outputs: ctx.outputs,
      mainLines: ctx.mainLines
    };
  }
};
var NODE_ID = 0;
var ShaderNode = class {
  constructor(type2) {
    this.id = "N" + NODE_ID++;
    this.type = type2;
    this.inputs = {};
  }
  default(pin) {
    return this.inputs[pin]?.default ?? "0.0";
  }
  build(_, value, ctx) {
    return {
      out: value,
      type: "f32"
    };
  }
};
var FragmentOutputNode = class extends ShaderNode {
  constructor() {
    super("FragmentOutput");
    this.inputs = { color: { default: "vec4f(1.0)" } };
  }
  build(_, __, ctx) {
    const conn = ctx.shaderGraph.getInput(this, "color");
    let value;
    if (conn) {
      value = ctx.resolve(conn.fromNode, conn.fromPin);
    } else {
      value = this.inputs.color.default;
    }
    ctx.outputs.outColor = value;
    return { out: ctx.outputs.outColor, type: "vec4f" };
  }
};
var AlphaOutput = class extends ShaderNode {
  constructor() {
    super("AlphaOutput");
    this.inputs = { alpha: { default: "1.0" } };
  }
  build(_, __, ctx) {
    ctx.outputs.alpha = ctx.resolve(this, "alpha");
    return { out: ctx.outputs.alpha };
  }
};
var NormalOutput = class extends ShaderNode {
  constructor() {
    super("NormalOutput");
    this.inputs = { normal: { default: "input.normal" } };
  }
  build(_, __, ctx) {
    ctx.outputs.normal = ctx.resolve(this, "normal");
    return { out: ctx.outputs.normal };
  }
};
var LightShadowNode = class extends ShaderNode {
  constructor() {
    super("LightShadowNode");
    this.inputs = { intensity: { default: "1" } };
  }
  build(_, __, ctx) {
    const lightCalcCode = `
    let norm = normalize(input.fragNorm);
    let viewDir = normalize(scene.cameraPos - input.fragPos);
    let materialData = getPBRMaterial(input.uv);
    var lightContribution = vec3f(0.0);
    for (var i: u32 = 0u; i < MAX_SPOTLIGHTS; i = i + 1u) {
        let sc = spotlights[i].lightViewProj * vec4<f32>(input.fragPos, 1.0);
        let p  = sc.xyz / sc.w;
        let uv = clamp(p.xy * 0.5 + vec2<f32>(0.5), vec2<f32>(0.0), vec2<f32>(1.0));
        let depthRef = p.z * 0.5 + 0.5;
        let lightDir = normalize(spotlights[i].position - input.fragPos);
        let bias = spotlights[i].shadowBias;
        let visibility = sampleShadow(uv, i32(i), depthRef - bias, norm, lightDir);
        let contrib = computeSpotLight(spotlights[i], norm, input.fragPos, viewDir, materialData);
        lightContribution += contrib * visibility;
    }`;
    ctx.locals.push(lightCalcCode);
    return {
      out: "lightContribution",
      type: "vec3f"
    };
  }
};
var LightToColorNode = class extends ShaderNode {
  constructor() {
    super("LightToColor");
    this.inputs = {
      light: { default: "vec3f(1.0)" }
    };
  }
  build(pin, value, ctx) {
    const conn = ctx.shaderGraph.getInput(this, "light");
    let l;
    if (conn) {
      l = ctx.resolve(conn.fromNode, conn.fromPin);
    } else {
      l = this.inputs.light.default;
    }
    const result2 = ctx.temp("vec4f", `vec4f(${l}, 1.0)`);
    return {
      out: result2,
      type: "vec4f"
    };
  }
};
var UVNode = class extends ShaderNode {
  constructor() {
    super("UV");
  }
  build() {
    return {
      out: "input.uv",
      type: "vec2f"
    };
  }
};
var AddVec2Node = class extends ShaderNode {
  constructor() {
    super("AddVec2");
    this.inputs = {
      a: { default: "vec2f(0.0)" },
      b: { default: "vec2f(0.0)" }
    };
  }
  build(_, __, ctx) {
    const connA = ctx.shaderGraph.getInput(this, "a");
    const connB = ctx.shaderGraph.getInput(this, "b");
    const a = connA ? ctx.resolve(connA.fromNode, connA.fromPin) : this.inputs.a.default;
    const b = connB ? ctx.resolve(connB.fromNode, connB.fromPin) : this.inputs.b.default;
    return {
      out: ctx.temp("vec2f", `${a} + ${b}`),
      type: "vec2f"
    };
  }
};
var CameraPosNode = class extends ShaderNode {
  constructor() {
    super("CameraPos");
  }
  build(_, __, ctx) {
    return {
      out: "scene.cameraPos",
      type: "vec3f"
    };
  }
};
var MultiplyVec2Node = class extends ShaderNode {
  constructor() {
    super("MultiplyVec2");
    this.inputs = {
      a: { default: "vec2f(1.0)" },
      b: { default: "1.0" }
      // Can be scalar or vec2
    };
  }
  build(_, __, ctx) {
    const connA = ctx.shaderGraph.getInput(this, "a");
    const connB = ctx.shaderGraph.getInput(this, "b");
    const a = connA ? ctx.resolve(connA.fromNode, connA.fromPin) : this.inputs.a.default;
    const b = connB ? ctx.resolve(connB.fromNode, connB.fromPin) : this.inputs.b.default;
    return {
      out: ctx.temp("vec2f", `${a} * ${b}`),
      type: "vec2f"
    };
  }
};
var TimeNode = class extends ShaderNode {
  constructor() {
    super("Time");
  }
  build(_, __, ctx) {
    return {
      out: "scene.time",
      type: "f32"
    };
  }
};
var InlineFunctionNode = class extends ShaderNode {
  constructor(name2 = "customFn", code = "") {
    super("InlineFunction");
    this.fnName = name2;
    this.code = code;
    this.inputs = {
      a: { default: "input.uv" },
      b: { default: "globals.time" }
    };
  }
  build(_, __, ctx) {
    ctx.registerFunction(this.fnName, this.code);
    const connA = ctx.shaderGraph.getInput(this, "a");
    const connB = ctx.shaderGraph.getInput(this, "b");
    const a = connA ? ctx.resolve(connA.fromNode, connA.fromPin) : this.inputs.a.default;
    const b = connB ? ctx.resolve(connB.fromNode, connB.fromPin) : this.inputs.b.default;
    return {
      out: ctx.temp("vec4f", `${this.fnName}(${a}, ${b})`),
      type: "vec4f"
    };
  }
};
var TextureSamplerNode = class extends ShaderNode {
  constructor(name2 = "tex0") {
    super("TextureSampler");
    this.name = name2;
    this.inputs = { uv: { default: "input.uv" } };
  }
  build(_, __, ctx) {
    const conn = ctx.shaderGraph.getInput(this, "uv");
    let uv;
    if (conn) {
      uv = ctx.resolve(conn.fromNode, conn.fromPin);
    } else {
      uv = this.inputs.uv.default;
    }
    return {
      out: ctx.temp("vec4f", `textureSample(meshTexture, meshSampler, ${uv})`),
      type: "vec4f"
    };
  }
};
var MultiplyColorNode = class extends ShaderNode {
  constructor() {
    super("MultiplyColor");
    this.inputs = {
      a: { default: "vec4(1.0)" },
      b: { default: "vec4(1.0)" }
    };
  }
  build(_, __, ctx) {
    const connA = ctx.shaderGraph.getInput(this, "a");
    const connB = ctx.shaderGraph.getInput(this, "b");
    let a, b;
    if (connA) {
      a = ctx.resolve(connA.fromNode, connA.fromPin);
    } else {
      a = this.inputs.a.default;
    }
    if (connB) {
      b = ctx.resolve(connB.fromNode, connB.fromPin);
    } else {
      b = this.inputs.b.default;
    }
    const t = ctx.temp("vec4f", `${a} * ${b}`);
    return { out: t, type: "vec4f" };
  }
};
var GrayscaleNode = class extends ShaderNode {
  constructor() {
    super("Grayscale");
    this.inputs = { color: { default: "vec4(1.0)" } };
  }
  build(_, __, ctx) {
    const conn = ctx.shaderGraph.getInput(this, "color");
    const c = conn ? ctx.resolve(conn.fromNode, conn.fromPin) : this.inputs.color.default;
    return {
      out: ctx.temp("vec4f", `vec4(vec3(dot(${c}.rgb,vec3(0.299,0.587,0.114))),${c}.a)`),
      type: "vec4f"
    };
  }
};
var ContrastNode = class extends ShaderNode {
  constructor() {
    super("Contrast");
    this.inputs = {
      color: { default: "vec4(1.0)" },
      contrast: { default: "1.0" }
    };
  }
  build(_, __, ctx) {
    const connColor = ctx.shaderGraph.getInput(this, "color");
    const connContrast = ctx.shaderGraph.getInput(this, "contrast");
    const c = connColor ? ctx.resolve(connColor.fromNode, connColor.fromPin) : this.inputs.color.default;
    const k = connContrast ? ctx.resolve(connContrast.fromNode, connContrast.fromPin) : this.inputs.contrast.default;
    return {
      out: ctx.temp("vec4f", `vec4(((${c}.rgb-0.5)*${k}+0.5),${c}.a)`),
      type: "vec4f"
    };
  }
};
var FloatNode = class extends ShaderNode {
  constructor(value = 1) {
    super("Float");
    this.value = value;
  }
  build(_, __, ctx) {
    return {
      out: `${this.value}`,
      type: "f32"
    };
  }
};
var Vec2Node = class extends ShaderNode {
  constructor(vx = 0, vy = 0) {
    super("Vec2");
    this.valueX = vx;
    this.valueY = vy;
  }
  build(_, __, ctx) {
    return {
      out: `vec2f(${this.valueX}, ${this.valueY})`,
      // ✅ Use valueX, valueY
      type: "vec2f"
    };
  }
};
var Vec3Node = class extends ShaderNode {
  constructor(vx = 0, vy = 0, vz = 0) {
    super("Vec3");
    this.valueX = vx;
    this.valueY = vy;
    this.valueZ = vz;
  }
  build(_, __, ctx) {
    return {
      out: `vec3f(${this.valueX}, ${this.valueY}, ${this.valueZ})`,
      type: "vec3f"
    };
  }
};
var Vec4Node = class extends ShaderNode {
  constructor(vx = 0, vy = 0, vz = 0, vw = 1) {
    super("Vec4");
    this.valueX = vx;
    this.valueY = vy;
    this.valueZ = vz;
    this.valueW = vw;
  }
  build(_, __, ctx) {
    return {
      out: `vec4f(${this.valueX}, ${this.valueY}, ${this.valueZ}, ${this.valueW})`,
      type: "vec4f"
    };
  }
};
var ColorNode = class extends ShaderNode {
  constructor(r2 = 1, g = 1, b = 1, a = 1) {
    super("Color");
    this.r = r2;
    this.g = g;
    this.b = b;
    this.a = a;
  }
  build(_, __, ctx) {
    return {
      out: `vec4f(${this.r}, ${this.g}, ${this.b}, ${this.a})`,
      type: "vec4f"
    };
  }
};
var AddNode = class extends ShaderNode {
  constructor() {
    super("Add");
    this.inputs = {
      a: { default: "0.0" },
      b: { default: "0.0" }
    };
  }
  build(_, __, ctx) {
    const connA = ctx.shaderGraph.getInput(this, "a");
    const connB = ctx.shaderGraph.getInput(this, "b");
    const a = connA ? ctx.resolve(connA.fromNode, connA.fromPin) : this.inputs.a.default;
    const b = connB ? ctx.resolve(connB.fromNode, connB.fromPin) : this.inputs.b.default;
    return {
      out: ctx.temp("f32", `${a} + ${b}`),
      type: "f32"
    };
  }
};
var SubtractNode = class extends ShaderNode {
  constructor() {
    super("Subtract");
    this.inputs = {
      a: { default: "0.0" },
      b: { default: "0.0" }
    };
  }
  build(_, __, ctx) {
    const connA = ctx.shaderGraph.getInput(this, "a");
    const connB = ctx.shaderGraph.getInput(this, "b");
    const a = connA ? ctx.resolve(connA.fromNode, connA.fromPin) : this.inputs.a.default;
    const b = connB ? ctx.resolve(connB.fromNode, connB.fromPin) : this.inputs.b.default;
    return {
      out: ctx.temp("f32", `${a} - ${b}`),
      type: "f32"
    };
  }
};
var MultiplyNode = class extends ShaderNode {
  constructor() {
    super("Multiply");
    this.inputs = {
      a: { default: "1.0" },
      b: { default: "1.0" }
    };
  }
  build(_, __, ctx) {
    const connA = ctx.shaderGraph.getInput(this, "a");
    const connB = ctx.shaderGraph.getInput(this, "b");
    const a = connA ? ctx.resolve(connA.fromNode, connA.fromPin) : this.inputs.a.default;
    const b = connB ? ctx.resolve(connB.fromNode, connB.fromPin) : this.inputs.b.default;
    return {
      out: ctx.temp("f32", `${a} * ${b}`),
      type: "f32"
    };
  }
};
var DivideNode = class extends ShaderNode {
  constructor() {
    super("Divide");
    this.inputs = {
      a: { default: "1.0" },
      b: { default: "1.0" }
    };
  }
  build(_, __, ctx) {
    const connA = ctx.shaderGraph.getInput(this, "a");
    const connB = ctx.shaderGraph.getInput(this, "b");
    const a = connA ? ctx.resolve(connA.fromNode, connA.fromPin) : this.inputs.a.default;
    const b = connB ? ctx.resolve(connB.fromNode, connB.fromPin) : this.inputs.b.default;
    return {
      out: ctx.temp("f32", `${a} / ${b}`),
      type: "f32"
    };
  }
};
var PowerNode = class extends ShaderNode {
  constructor() {
    super("Power");
    this.inputs = {
      base: { default: "1.0" },
      exponent: { default: "2.0" }
    };
  }
  build(_, __, ctx) {
    const connBase = ctx.shaderGraph.getInput(this, "base");
    const connExp = ctx.shaderGraph.getInput(this, "exponent");
    const base = connBase ? ctx.resolve(connBase.fromNode, connBase.fromPin) : this.inputs.base.default;
    const exp = connExp ? ctx.resolve(connExp.fromNode, connExp.fromPin) : this.inputs.exponent.default;
    return {
      out: ctx.temp("f32", `pow(${base}, ${exp})`),
      type: "f32"
    };
  }
};
var LerpNode = class extends ShaderNode {
  constructor() {
    super("Lerp");
    this.inputs = {
      a: { default: "0.0" },
      b: { default: "1.0" },
      t: { default: "0.5" }
    };
  }
  build(_, __, ctx) {
    const connA = ctx.shaderGraph.getInput(this, "a");
    const connB = ctx.shaderGraph.getInput(this, "b");
    const connT = ctx.shaderGraph.getInput(this, "t");
    const a = connA ? ctx.resolve(connA.fromNode, connA.fromPin) : this.inputs.a.default;
    const b = connB ? ctx.resolve(connB.fromNode, connB.fromPin) : this.inputs.b.default;
    const t = connT ? ctx.resolve(connT.fromNode, connT.fromPin) : this.inputs.t.default;
    return {
      out: ctx.temp("f32", `mix(${a}, ${b}, ${t})`),
      type: "f32"
    };
  }
};
var SinNode = class extends ShaderNode {
  constructor() {
    super("Sin");
    this.inputs = {
      value: { default: "0.0" }
    };
  }
  build(_, __, ctx) {
    const conn = ctx.shaderGraph.getInput(this, "value");
    const val = conn ? ctx.resolve(conn.fromNode, conn.fromPin) : this.inputs.value.default;
    return {
      out: ctx.temp("f32", `sin(${val})`),
      type: "f32"
    };
  }
};
var CosNode = class extends ShaderNode {
  constructor() {
    super("Cos");
    this.inputs = {
      value: { default: "0.0" }
    };
  }
  build(_, __, ctx) {
    const conn = ctx.shaderGraph.getInput(this, "value");
    const val = conn ? ctx.resolve(conn.fromNode, conn.fromPin) : this.inputs.value.default;
    return {
      out: ctx.temp("f32", `cos(${val})`),
      type: "f32"
    };
  }
};
var DotProductNode = class extends ShaderNode {
  constructor() {
    super("DotProduct");
    this.inputs = {
      a: { default: "vec3f(0.0)" },
      b: { default: "vec3f(0.0)" }
    };
  }
  build(_, __, ctx) {
    const connA = ctx.shaderGraph.getInput(this, "a");
    const connB = ctx.shaderGraph.getInput(this, "b");
    const a = connA ? ctx.resolve(connA.fromNode, connA.fromPin) : this.inputs.a.default;
    const b = connB ? ctx.resolve(connB.fromNode, connB.fromPin) : this.inputs.b.default;
    return {
      out: ctx.temp("f32", `dot(${a}, ${b})`),
      type: "f32"
    };
  }
};
var NormalizeNode = class extends ShaderNode {
  constructor() {
    super("Normalize");
    this.inputs = {
      vector: { default: "vec3f(1.0)" }
    };
  }
  build(_, __, ctx) {
    const conn = ctx.shaderGraph.getInput(this, "vector");
    const vec = conn ? ctx.resolve(conn.fromNode, conn.fromPin) : this.inputs.vector.default;
    return {
      out: ctx.temp("vec3f", `normalize(${vec})`),
      type: "vec3f"
    };
  }
};
var LengthNode = class extends ShaderNode {
  constructor() {
    super("Length");
    this.inputs = {
      vector: { default: "vec3f(0.0)" }
    };
  }
  build(_, __, ctx) {
    const conn = ctx.shaderGraph.getInput(this, "vector");
    const vec = conn ? ctx.resolve(conn.fromNode, conn.fromPin) : this.inputs.vector.default;
    return {
      out: ctx.temp("f32", `length(${vec})`),
      type: "f32"
    };
  }
};
var SplitVec4Node = class extends ShaderNode {
  constructor() {
    super("SplitVec4");
    this.inputs = {
      vector: { default: "vec4f(0.0)" }
    };
  }
  build(pin, __, ctx) {
    const conn = ctx.shaderGraph.getInput(this, "vector");
    const vec = conn ? ctx.resolve(conn.fromNode, conn.fromPin) : this.inputs.vector.default;
    if (!this._temp) {
      this._temp = ctx.temp("vec4f", vec);
    }
    switch (pin) {
      case "x":
        return { out: `${this._temp}.x`, type: "f32" };
      case "y":
        return { out: `${this._temp}.y`, type: "f32" };
      case "z":
        return { out: `${this._temp}.z`, type: "f32" };
      case "w":
        return { out: `${this._temp}.w`, type: "f32" };
      default:
        return { out: this._temp, type: "vec4f" };
    }
  }
};
var CombineVec4Node = class extends ShaderNode {
  constructor() {
    super("CombineVec4");
    this.inputs = {
      x: { default: "0.0" },
      y: { default: "0.0" },
      z: { default: "0.0" },
      w: { default: "1.0" }
    };
  }
  build(_, __, ctx) {
    const connX = ctx.shaderGraph.getInput(this, "x");
    const connY = ctx.shaderGraph.getInput(this, "y");
    const connZ = ctx.shaderGraph.getInput(this, "z");
    const connW = ctx.shaderGraph.getInput(this, "w");
    const x2 = connX ? ctx.resolve(connX.fromNode, connX.fromPin) : this.inputs.x.default;
    const y2 = connY ? ctx.resolve(connY.fromNode, connY.fromPin) : this.inputs.y.default;
    const z = connZ ? ctx.resolve(connZ.fromNode, connZ.fromPin) : this.inputs.z.default;
    const w = connW ? ctx.resolve(connW.fromNode, connW.fromPin) : this.inputs.w.default;
    return {
      out: ctx.temp("vec4f", `vec4f(${x2}, ${y2}, ${z}, ${w})`),
      type: "vec4f"
    };
  }
};
var FracNode = class extends ShaderNode {
  constructor() {
    super("Frac");
    this.inputs = {
      value: { default: "0.0" }
    };
  }
  build(_, __, ctx) {
    const conn = ctx.shaderGraph.getInput(this, "value");
    const val = conn ? ctx.resolve(conn.fromNode, conn.fromPin) : this.inputs.value.default;
    return {
      out: ctx.temp("f32", `fract(${val})`),
      type: "f32"
    };
  }
};
var SmoothstepNode = class extends ShaderNode {
  constructor() {
    super("Smoothstep");
    this.inputs = {
      edge0: { default: "0.0" },
      edge1: { default: "1.0" },
      x: { default: "0.5" }
    };
  }
  build(_, __, ctx) {
    const connEdge0 = ctx.shaderGraph.getInput(this, "edge0");
    const connEdge1 = ctx.shaderGraph.getInput(this, "edge1");
    const connX = ctx.shaderGraph.getInput(this, "x");
    const edge0 = connEdge0 ? ctx.resolve(connEdge0.fromNode, connEdge0.fromPin) : this.inputs.edge0.default;
    const edge1 = connEdge1 ? ctx.resolve(connEdge1.fromNode, connEdge1.fromPin) : this.inputs.edge1.default;
    const x2 = connX ? ctx.resolve(connX.fromNode, connX.fromPin) : this.inputs.x.default;
    return {
      out: ctx.temp("f32", `smoothstep(${edge0}, ${edge1}, ${x2})`),
      type: "f32"
    };
  }
};
var OneMinusNode = class extends ShaderNode {
  constructor() {
    super("OneMinus");
    this.inputs = {
      value: { default: "0.0" }
    };
  }
  build(_, __, ctx) {
    const conn = ctx.shaderGraph.getInput(this, "value");
    const val = conn ? ctx.resolve(conn.fromNode, conn.fromPin) : this.inputs.value.default;
    return {
      out: ctx.temp("f32", `1.0 - ${val}`),
      type: "f32"
    };
  }
};
var FragmentPositionNode = class extends ShaderNode {
  constructor() {
    super("FragmentPosition");
  }
  build(_, __, ctx) {
    return {
      out: "input.fragPos",
      type: "vec3f"
    };
  }
};
var FragmentNormalNode = class extends ShaderNode {
  constructor() {
    super("FragmentNormal");
  }
  build(_, __, ctx) {
    return {
      out: "input.fragNorm",
      type: "vec3f"
    };
  }
};
var ViewDirectionNode = class extends ShaderNode {
  constructor() {
    super("ViewDirection");
  }
  build(_, __, ctx) {
    return {
      out: ctx.temp("vec3f", "normalize(scene.cameraPos - input.fragPos)"),
      type: "vec3f"
    };
  }
};
var GlobalAmbientNode = class extends ShaderNode {
  constructor() {
    super("GlobalAmbient");
  }
  build(_, __, ctx) {
    return {
      out: "scene.globalAmbient",
      type: "vec3f"
    };
  }
};
var ConnectionLayer = class {
  constructor(svg, shaderGraph) {
    this.svg = svg;
    this.shaderGraph = shaderGraph;
    this.temp = null;
    this.from = null;
    document.addEventListener("pointermove", (e) => this.move(e));
    document.addEventListener("pointerup", (e) => this.up(e));
  }
  attach(pin) {
    pin.onpointerdown = (e) => {
      e.stopPropagation();
      if (pin.dataset.type !== "output") return;
      this.from = pin;
      this.temp = this.path();
      this.svg.appendChild(this.temp);
    };
  }
  move(e) {
    if (!this.temp || !this.from) return;
    this.draw(this.temp, this.center(this.from), { x: e.clientX, y: e.clientY });
  }
  up(e) {
    if (!this.temp || !this.from) return;
    const t = document.elementFromPoint(e.clientX, e.clientY);
    if (t?.classList.contains("pinShader") && t.dataset.type === "input") {
      this.finalize(this.from, t);
    }
    this.temp.remove();
    this.temp = this.from = null;
  }
  finalize(outPin, inPin) {
    const fromNode = this.shaderGraph.nodes.find((n2) => n2.id === outPin.dataset.node);
    const toNode = this.shaderGraph.nodes.find((n2) => n2.id === inPin.dataset.node);
    const fromPin = outPin.dataset.pin;
    const toPin = inPin.dataset.pin;
    this.shaderGraph.connect(fromNode, fromPin, toNode, toPin);
    this.redrawAll();
  }
  redrawAll() {
    [...this.svg.children].forEach((p) => p.remove());
    this.shaderGraph.connections.forEach((c) => this.redrawConnection(c));
  }
  redrawConnection(conn) {
    const path2 = this.path();
    path2.dataset.from = `${conn.fromNode.id}:${conn.fromPin}`;
    path2.dataset.to = `${conn.toNode.id}:${conn.toPin}`;
    this.svg.appendChild(path2);
    const a = document.querySelector(`.pinShader.output[data-node="${conn.fromNode.id}"][data-pin="${conn.fromPin}"]`);
    const b = document.querySelector(`.pinShader.input[data-node="${conn.toNode.id}"][data-pin="${conn.toPin}"]`);
    if (a && b) this.draw(path2, this.center(a), this.center(b));
  }
  path() {
    const p = document.createElementNS("http://www.w3.org/2000/svg", "path");
    p.setAttribute("stroke", "#6aa9ff");
    p.setAttribute("stroke-width", "2");
    p.setAttribute("fill", "none");
    return p;
  }
  draw(p, a, b) {
    const dx = Math.abs(b.x - a.x) * 0.5;
    p.setAttribute("d", `M${a.x},${a.y} C${a.x + dx},${a.y} ${b.x - dx},${b.y} ${b.x},${b.y}`);
  }
  center(el2) {
    const r2 = el2.getBoundingClientRect();
    const svgRect = this.svg.getBoundingClientRect();
    return {
      x: r2.left + r2.width / 2 - svgRect.left,
      y: r2.top + r2.height / 2 - svgRect.top
    };
  }
};
async function openFragmentShaderEditor(id2 = "fragShader") {
  return new Promise((resolve, reject) => {
    const shaderGraph = new FragmentShaderGraph(id2);
    const root = document.createElement("div");
    root.id = "shaderDOM";
    root.style.cssText = `
    position:fixed; left: 17.5%; top:4%;
    background:#0b0e14; color:#eee;
    display:flex; font-family:system-ui;
    width:300%;height:90%
  `;
    root.style.display = "none";
    const menu = document.createElement("div");
    menu.style.cssText = `
    width:200px; border-right:1px solid #222;
    padding:8px; background:#0f1320; height: 77vh; overflow: scroll;
  `;
    const btn = (txt, fn) => {
      const b2 = document.createElement("button");
      b2.textContent = txt;
      b2.style.cssText = "width:100%;margin:4px 0;";
      if (txt == "Compile All" || txt == "Compile" || txt == "Save Graph" || txt == "Load Graph") b2.style.cssText += "color: orange;";
      if (txt == "Create New") b2.style.cssText += "color: lime;";
      if (txt == "Delete") b2.style.cssText += "color: red;";
      b2.classList.add("btn");
      b2.classList.add("btnLeftBox");
      b2.onclick = fn;
      menu.appendChild(b2);
    };
    const area = document.createElement("div");
    area.style.cssText = "flex:1;position:relative";
    area.classList.add("fancy-grid-bg");
    area.classList.add("dark");
    let pan = { active: false, ox: 0, oy: 0 };
    area.addEventListener("pointerdown", (e) => {
      if (e.target !== area) return;
      pan.active = true;
      pan.ox = e.clientX;
      pan.oy = e.clientY;
      area.setPointerCapture(e.pointerId);
    });
    area.addEventListener("pointermove", (e) => {
      if (!pan.active) return;
      const dx = e.clientX - pan.ox;
      const dy = e.clientY - pan.oy;
      pan.ox = e.clientX;
      pan.oy = e.clientY;
      shaderGraph.nodes.forEach((n2) => {
        n2.x += dx;
        n2.y += dy;
        const el2 = document.querySelector(`.nodeShader[data-node-id="${n2.id}"]`);
        if (el2) {
          el2.style.left = n2.x + "px";
          el2.style.top = n2.y + "px";
        }
      });
      connectionLayer.redrawAll();
    });
    area.addEventListener("pointerup", (e) => {
      pan.active = false;
      area.releasePointerCapture(e.pointerId);
    });
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.style.position = "absolute";
    svg.style.left = "0";
    svg.style.top = "0";
    svg.style.width = "100%";
    svg.style.height = "100%";
    svg.style.pointerEvents = "none";
    area.appendChild(svg);
    root.appendChild(menu);
    root.appendChild(area);
    document.body.appendChild(root);
    const style = document.createElement("style");
    style.textContent = `
#shaderDOM { z-index:2 }

.nodeShader {
  position:absolute;
  min-width:140px;
  background:#151a2a;
  border:1px solid #222;
  border-radius:6px;
  padding:0;
  color:#eee;
  cursor:move;
}

.nodeShader.selected {
  border-color: #ff8800;
  box-shadow: 0 0 8px #ff8800;
}

.nodeShader .node-title {
  -webkit-text-stroke-width: 0.2px;
  display: block;
  padding: 6px 8px;
  font-size: 13px;
  line-height: 1.2;
  color: #ffffff;
  background: #1f2937;
  white-space: nowrap;
  position: relative;
  z-index: 10;
  user-select: none;
  border-radius: 6px 6px 0 0;
  border-bottom: 1px solid #333;
}

.node-properties {
  padding: 6px 8px;
  background: #1a1f2e;
  border-bottom: 1px solid #333;
}

.node-properties input,
.node-properties textarea {
  font-family: monospace;
}

.node-properties input:focus,
.node-properties textarea:focus {
  outline: none;
  border-color: #6aa9ff;
}

.nodeShader-body {
  display:flex;
  gap:8px;
  justify-content: space-between;
  padding: 6px 8px;
}

.nodeShader-inputs {
  display:flex;
  flex-direction:column;
}

.pinShader-row {
  position: relative;
  width: 100%;
  height: 18px;
  display: flex;
  align-items: center;
  font-family: monospace;
  font-size: 12px;
  color: #ddd;
}

.pinShader {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #0f0;
  border: 2px solid #000;
  z-index: 5;
  flex-shrink: 0;
}

.pinShader.input {  margin-left: -6px; background: #ff6a6a; }
.pinShader.output { margin-right: -6px; background: #6aa9ff; }

.pinShader-label {
  margin-left: 6px;
  white-space: nowrap;
  pointer-events: none;
  user-select: none;
  z-index: 6;
}

svg path {
  pointer-events:none;
}
`;
    document.head.appendChild(style);
    const connectionLayer = new ConnectionLayer(svg, shaderGraph);
    function addNode(node2, x2, y2) {
      const test = shaderGraph.addNode(node2);
      if (test == null) return;
      if (x2 == null || y2 == null) {
        const p = shaderGraph.nextSpawn();
        x2 = p.x;
        y2 = p.y;
      }
      node2.x = x2;
      node2.y = y2;
      const el2 = document.createElement("div");
      el2.className = "nodeShader";
      el2.style.left = x2 + "px";
      el2.style.top = y2 + "px";
      area.appendChild(el2);
      el2.tabIndex = 0;
      el2.addEventListener("click", (e) => {
        e.stopPropagation();
        document.querySelectorAll(".nodeShader.selected").forEach((n2) => n2.classList.remove("selected"));
        el2.classList.add("selected");
      });
      el2.dataset.nodeId = node2.id;
      const title = document.createElement("div");
      title.className = "node-title";
      title.textContent = node2.type;
      el2.appendChild(title);
      const propsContainer = document.createElement("div");
      propsContainer.className = "node-properties";
      propsContainer.style.cssText = "padding: 4px 8px; background: #1a1f2e;";
      function addPropertyInput(label, propName, value, type2 = "number", step = "0.01") {
        const row2 = document.createElement("div");
        row2.style.cssText = "display: flex; align-items: center; gap: 6px; margin: 2px 0;";
        const labelEl = document.createElement("label");
        labelEl.textContent = label + ":";
        labelEl.style.cssText = "font-size: 11px; color: #aaa; min-width: 30px;";
        const input = document.createElement("input");
        input.type = type2;
        input.value = value;
        input.step = step;
        input.style.cssText = "flex: 1; background: #0a0d14; border: 1px solid #333; color: #fff; padding: 2px 4px; font-size: 11px; border-radius: 3px;";
        input.addEventListener("input", () => {
          const val = type2 === "number" ? parseFloat(input.value) : input.value;
          node2[propName] = val;
        });
        input.addEventListener("pointerdown", (e) => e.stopPropagation());
        row2.appendChild(labelEl);
        row2.appendChild(input);
        propsContainer.appendChild(row2);
      }
      if (node2.type === "Float") {
        addPropertyInput("Value", "value", node2.value);
      } else if (node2.type === "Vec2") {
        addPropertyInput("X", "valueX", node2.valueX || 0);
        addPropertyInput("Y", "valueY", node2.valueY || 0);
      } else if (node2.type === "Vec3") {
        addPropertyInput("X", "valueX", node2.valueX || 0);
        addPropertyInput("Y", "valueY", node2.valueY || 0);
        addPropertyInput("Z", "valueZ", node2.valueZ || 0);
      } else if (node2.type === "Vec4") {
        addPropertyInput("X", "valueX", node2.valueX || 0);
        addPropertyInput("Y", "valueY", node2.valueY || 0);
        addPropertyInput("Z", "valueZ", node2.valueZ || 0);
        addPropertyInput("W", "valueW", node2.valueW || 1);
      } else if (node2.type === "Color") {
        addPropertyInput("R", "r", node2.r);
        addPropertyInput("G", "g", node2.g);
        addPropertyInput("B", "b", node2.b);
        addPropertyInput("A", "a", node2.a);
      } else if (node2.type === "AddVec2") {
        addPropertyInput("Default A", "defaultA", node2.inputs.a.default);
        addPropertyInput("Default B", "defaultB", node2.inputs.b.default);
      } else if (node2.type === "InlineFunction") {
        addPropertyInput("Name", "fnName", node2.fnName, "text");
        const ta = document.createElement("textarea");
        ta.value = node2.code;
        ta.style.cssText = "width: 100%; height: 80px; background: #0a0d14; border: 1px solid #333; color: #fff; padding: 4px; font-family: monospace; font-size: 11px; resize: vertical;";
        ta.oninput = () => node2.code = ta.value;
        ta.onpointerdown = (e) => e.stopPropagation();
        propsContainer.appendChild(ta);
      }
      if (propsContainer.children.length > 0) {
        el2.appendChild(propsContainer);
      }
      const body2 = document.createElement("div");
      body2.className = "nodeShader-body";
      el2.appendChild(body2);
      function createPinRow(pinName, type2 = "input") {
        const row2 = document.createElement("div");
        row2.className = "pinShader-row";
        const pin = document.createElement("div");
        pin.className = "pinShader " + (type2 === "input" ? "input" : "output");
        pin.dataset.node = node2.id;
        pin.dataset.pin = pinName;
        pin.dataset.type = type2;
        const label = document.createElement("div");
        label.className = "pinShader-label";
        label.textContent = pinName;
        if (type2 === "input") row2.append(pin, label);
        else {
          row2.style.justifyContent = "flex-end";
          row2.append(label, pin);
        }
        return { row: row2, pin };
      }
      const inputsContainer = document.createElement("div");
      inputsContainer.className = "nodeShader-inputs";
      body2.appendChild(inputsContainer);
      Object.keys(node2.inputs || {}).forEach((pinName) => {
        const { row: row2, pin } = createPinRow(pinName, "input");
        inputsContainer.appendChild(row2);
      });
      const outputContainer = document.createElement("div");
      outputContainer.style.width = "100%";
      body2.appendChild(outputContainer);
      const { row: outRow, pin: outPin } = createPinRow("out", "output");
      outputContainer.appendChild(outRow);
      connectionLayer.attach(outPin);
      shaderGraph.connectionLayer = connectionLayer;
      shaderGraph.makeDraggable(el2, node2, connectionLayer);
    }
    document.addEventListener("keydown", (e) => {
      if (e.key === "Delete") {
        const sel = document.querySelector(".nodeShader.selected");
        if (!sel) return;
        const nodeId2 = sel.dataset.nodeId;
        const node2 = shaderGraph.nodes.find((n2) => n2.id === nodeId2);
        if (!node2) return;
        shaderGraph.connections = shaderGraph.connections.filter(
          (c) => c.fromNode !== node2 && c.toNode !== node2
        );
        [...svg.querySelectorAll("path")].forEach((p) => {
          if (p.dataset.from?.startsWith(nodeId2 + ":") || p.dataset.to?.startsWith(nodeId2 + ":")) {
            p.remove();
          }
        });
        sel.remove();
        shaderGraph.nodes = shaderGraph.nodes.filter((n2) => n2 !== node2);
        shaderGraph.connectionLayer.redrawConnection();
      }
    });
    btn("outColor", () => addNode(new FragmentOutputNode(), 500, 200));
    btn("CameraPos", () => addNode(new CameraPosNode()));
    btn("MultiplyVec2", () => addNode(new MultiplyVec2Node()));
    btn("Time", () => addNode(new TimeNode()));
    btn("AddVec2", () => addNode(new AddVec2Node()));
    btn("GlobalAmbient", () => addNode(new GlobalAmbientNode()));
    btn("TextureSampler", () => addNode(new TextureSamplerNode()));
    btn("MultiplyColor", () => addNode(new MultiplyColorNode()));
    btn("Grayscale", () => addNode(new GrayscaleNode()));
    btn("Contrast", () => addNode(new ContrastNode()));
    btn("Inline Function", () => addNode(new InlineFunctionNode("customFn", "")));
    btn("LightShadowNode", () => addNode(new LightShadowNode()));
    btn("LightToColorNode", () => addNode(new LightToColorNode()));
    btn("AlphaOutput", () => addNode(new AlphaOutput()));
    btn("NormalOutput", () => addNode(new NormalOutput()));
    btn("Float", () => {
      const val = prompt("Enter float value:", "1.0");
      addNode(new FloatNode(parseFloat(val) || 1));
    });
    btn("UV", () => addNode(new UVNode(1, 0)));
    btn("Vec3", () => addNode(new Vec3Node(1, 0, 0)));
    btn("Vec2", () => addNode(new Vec2Node(1, 0)));
    btn("Color", () => addNode(new ColorNode(1, 1, 1, 1)));
    btn("Add", () => addNode(new AddNode()));
    btn("Multiply", () => addNode(new MultiplyNode()));
    btn("Power", () => addNode(new PowerNode()));
    btn("Lerp", () => addNode(new LerpNode()));
    btn("Sin", () => addNode(new SinNode()));
    btn("Cos", () => addNode(new CosNode()));
    btn("Normalize", () => addNode(new NormalizeNode()));
    btn("DotProduct", () => addNode(new DotProductNode()));
    btn("Length", () => addNode(new LengthNode()));
    btn("Frac", () => addNode(new FracNode()));
    btn("OneMinus", () => addNode(new OneMinusNode()));
    btn("Smoothstep", () => addNode(new SmoothstepNode()));
    btn("FragPosition", () => addNode(new FragmentPositionNode()));
    btn("FragNormal", () => addNode(new FragmentNormalNode()));
    btn("ViewDirection", () => addNode(new ViewDirectionNode()));
    btn("SplitVec4", () => addNode(new SplitVec4Node()));
    btn("CombineVec4", () => addNode(new CombineVec4Node()));
    btn("Create New", async () => {
      shaderGraph.clear();
      let nameOfGraphMaterital = prompt("You must define a name for shader graph:", "MyShader1");
      if (nameOfGraphMaterital && nameOfGraphMaterital !== "") {
        const exist = await loadGraph(nameOfGraphMaterital, shaderGraph, addNode);
        if (exist === true) {
          console.info("ALREADY EXIST SHADER, please use diff name" + exist);
        } else {
          shaderGraph.id = nameOfGraphMaterital;
          saveGraph(shaderGraph, nameOfGraphMaterital);
        }
      }
    });
    btn("Compile", () => {
      let r2 = shaderGraph.compile();
      const graphGenShaderWGSL = graphAdapter(r2, shaderGraph.nodes);
      shaderGraph.runtime_memory[shaderGraph.id] = graphGenShaderWGSL;
    });
    btn("Compile All", () => {
      for (let x2 = 0; x2 < shaderGraph.runtimeList.length; x2++) {
        setTimeout(() => {
          byId("shader-graphs-list").selectedIndex = x2 + 1;
          const event = new Event("change", { bubbles: true });
          byId("shader-graphs-list").dispatchEvent(event);
          if (shaderGraph.runtimeList.length == x2) {
            console.log("LAST");
          }
        }, 500 * x2);
      }
    });
    btn("Save Graph", () => {
      saveGraph(shaderGraph, shaderGraph.id);
    });
    btn("Load Graph", async () => {
      shaderGraph.clear();
      let nameOfGraphMaterital = prompt("Choose Name:", "MyShader1");
      const exist = await loadGraph(nameOfGraphMaterital, shaderGraph, addNode);
      if (exist === false) {
        alert("\u26A0\uFE0FGraph no exist!\u26A0\uFE0F");
      }
    });
    btn("Delete", () => {
      console.log("[DELETE]", shaderGraph.id);
      document.dispatchEvent(new CustomEvent("delete-shader-graph", { detail: shaderGraph.id }));
    });
    btn("Import JSON", async (e) => {
      shaderGraph.clear();
      let nameOfGraphMaterital = prompt("You must define a name for shader graph:", "MyShader1");
      if (nameOfGraphMaterital && nameOfGraphMaterital !== "") {
        const exist = await loadGraph(nameOfGraphMaterital, shaderGraph, addNode);
        if (exist === true) {
          console.info("ALREADY EXIST SHADER, please use diff name" + exist);
        } else {
          shaderGraph.id = nameOfGraphMaterital;
          const input = document.createElement("input");
          input.type = "file";
          input.accept = ".json";
          input.style.display = "none";
          input.onchange = (e2) => {
            const file = e2.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = () => {
              try {
                let data = JSON.parse(reader.result);
                data.id = shaderGraph.id;
                document.dispatchEvent(new CustomEvent("on-graph-load", { detail: { name: data.id, content: data } }));
              } catch (err) {
                console.error("Invalid JSON file", err);
              }
            };
            reader.readAsText(file);
          };
          document.body.appendChild(input);
          input.click();
        }
      }
    });
    const titleb = document.createElement("p");
    titleb.style.cssText = "width:100%;margin:4px 0;";
    titleb.classList.add("btn3");
    titleb.classList.add("btnLeftBox");
    titleb.innerHTML = `Current shader:`;
    titleb.style.webkitTextStrokeWidth = 0;
    menu.appendChild(titleb);
    const b = document.createElement("select");
    b.id = "shader-graphs-list";
    b.style.cssText = "width:100%;margin:4px 0;";
    b.classList.add("btn");
    b.classList.add("btnLeftBox");
    b.style.webkitTextStrokeWidth = 0;
    menu.appendChild(b);
    document.addEventListener("on-shader-graphs-list", (e) => {
      const shaders = e.detail;
      b.innerHTML = "";
      var __ = 0;
      if (!byId("shader-graphs-list-dom")) {
        __ = 1;
        const placeholder2 = document.createElement("option");
        placeholder2.id = "shader-graphs-list-dom";
        placeholder2.textContent = "Select shader";
        placeholder2.value = "";
        placeholder2.disabled = true;
        placeholder2.selected = true;
        b.appendChild(placeholder2);
      }
      shaderGraph.runtimeList = [];
      shaders.forEach((shader, index) => {
        const opt = document.createElement("option");
        opt.value = index;
        opt.textContent = shader.name;
        shaderGraph.runtimeList.push(shader.name);
        let test = JSON.parse(shader.content);
        shaderGraph.runtime_memory[shader.name] = test.final;
        b.appendChild(opt);
      });
      if (__ == 1) {
        b.onchange = (event) => {
          shaderGraph.clear();
          const selectedIndex = event.target.value;
          const selectedShader = shaders[selectedIndex];
          console.log("Selected shader:", selectedShader.name);
          document.dispatchEvent(new CustomEvent("load-shader-graph", { detail: selectedShader.name }));
          console.log("Lets load selectedShader.name ", selectedShader.name);
        };
      }
      document.dispatchEvent(new CustomEvent("sgraphs-ready", {}));
    });
    document.dispatchEvent(new CustomEvent("get-shader-graphs", {}));
    document.addEventListener("sgraphs-ready", async () => {
      if (shaderGraph.runtimeList.length > 0) {
        shaderGraph.id = shaderGraph.runtimeList[0];
        const exist = await loadGraph(shaderGraph.id, shaderGraph, addNode);
        if (exist == false) {
          saveGraph(shaderGraph, shaderGraph.id);
          console.log("NEW SHADER:[SAVED]" + exist);
        }
      } else {
        console.log("no saved graphs");
      }
      resolve(shaderGraph);
    });
  });
}
function serializeGraph(shaderGraph) {
  return JSON.stringify({
    nodes: shaderGraph.nodes.map((n2) => ({
      id: n2.id,
      type: n2.type,
      x: n2.x ?? 100,
      y: n2.y ?? 100,
      fnName: n2.fnName,
      code: n2.code,
      name: n2.name,
      value: n2.value,
      r: n2.r,
      g: n2.g,
      b: n2.b,
      a: n2.a,
      inputs: Object.fromEntries(Object.entries(n2.inputs || {}).map(([k, v]) => [k, { default: v.default }])),
      valueX: n2.valueX,
      valueY: n2.valueY,
      valueZ: n2.valueZ,
      valueW: n2.valueW
    })),
    connections: shaderGraph.connections.map((c) => ({
      from: c.fromNode.id,
      fromPin: c.fromPin,
      to: c.toNode.id,
      toPin: c.toPin
    })),
    final: shaderGraph.runtime_memory[shaderGraph.id] ? shaderGraph.runtime_memory[shaderGraph.id] : null
  });
}
function saveGraph(shaderGraph, key = "fragShaderGraph") {
  let content = serializeGraph(shaderGraph);
  localStorage.setItem(key, content);
  console.log("test compile content", shaderGraph.runtime_memory[key]);
  console.log("test compile content", content);
  if (shaderGraph.runtime_memory[key]) {
  } else {
    console.warn("GraphShader is saved for src but with no compile final data for prod build.");
  }
  document.dispatchEvent(new CustomEvent("save-shader-graph", {
    detail: {
      name: key,
      content
    }
  }));
  console.log("%cShader shaderGraph saved", LOG_FUNNY_ARCADE2);
}
async function loadGraph(key, shaderGraph, addNodeUI) {
  if (shaderGraph.onGraphLoadAttached === false) {
    shaderGraph.onGraphLoadAttached = true;
    document.addEventListener("on-graph-load", (e) => {
      if (e.detail == null) {
        return;
      }
      shaderGraph.nodes.length = 0;
      shaderGraph.connections.length = 0;
      shaderGraph.id = e.detail.name;
      let data;
      if (typeof e.detail.content === "object") {
        data = e.detail.content;
      } else {
        data = JSON.parse(e.detail.content);
      }
      if (!data) return false;
      const map = {};
      data.nodes.forEach((node2) => {
        const saveId = node2.id;
        const saveX = node2.x;
        const saveY = node2.y;
        switch (node2.type) {
          case "FragmentOutput":
            node2 = new FragmentOutputNode();
            break;
          case "CameraPos":
            node2 = new CameraPosNode();
            break;
          case "MultiplyVec2":
            node2 = new MultiplyVec2Node();
            break;
          case "AddVec2":
            node2 = new AddVec2Node();
            break;
          case "Time":
            node2 = new TimeNode();
            break;
          case "InlineFunction":
            node2 = new InlineFunctionNode(node2.fnName, node2.code);
            break;
          case "TextureSampler":
            node2 = new TextureSamplerNode(node2.name);
            break;
          case "MultiplyColor":
            node2 = new MultiplyColorNode();
            break;
          case "Grayscale":
            node2 = new GrayscaleNode();
            break;
          case "Contrast":
            node2 = new ContrastNode();
            break;
          case "AlphaOutput":
            node2 = new AlphaOutput();
            break;
          case "NormalOutput":
            node2 = new NormalOutput();
            break;
          case "LightShadowNode":
            node2 = new LightShadowNode();
            break;
          case "LightToColor":
            node2 = new LightToColorNode();
            break;
          case "UV":
            node2 = new UVNode();
            break;
          case "Float":
            node2 = new FloatNode(node2.value ?? 1);
            break;
          case "Vec2":
            node2 = new Vec2Node(node2.valueX ?? 0, node2.valueY ?? 0);
            break;
          case "Vec3":
            node2 = new Vec3Node(node2.valueX ?? 0, node2.valueY ?? 0, node2.valueZ ?? 0);
            break;
          case "Vec4":
            node2 = new Vec4Node(node2.valueX ?? 0, node2.valueY ?? 0, node2.valueZ ?? 0, node2.valueW ?? 1);
            break;
          case "Color":
            node2 = new ColorNode(node2.r ?? 1, node2.g ?? 1, node2.b ?? 1, node2.a ?? 1);
            break;
          case "Add":
            node2 = new AddNode();
            break;
          case "Subtract":
            node2 = new SubtractNode();
            break;
          case "Multiply":
            node2 = new MultiplyNode();
            break;
          case "Divide":
            node2 = new DivideNode();
            break;
          case "Power":
            node2 = new PowerNode();
            break;
          case "Sin":
            node2 = new SinNode();
            break;
          case "Cos":
            node2 = new CosNode();
            break;
          case "Normalize":
            node2 = new NormalizeNode();
            break;
          case "DotProduct":
            node2 = new DotProductNode();
            break;
          case "Lerp":
            node2 = new LerpNode();
            break;
          case "Frac":
            node2 = new FracNode();
            break;
          case "OneMinus":
            node2 = new OneMinusNode();
            break;
          case "Smoothstep":
            node2 = new SmoothstepNode();
            break;
          case "FragmentPosition":
            node2 = new FragmentPositionNode();
            break;
          case "ViewDirection":
            node2 = new ViewDirectionNode();
            break;
          case "SplitVec4":
            node2 = new SplitVec4Node();
            break;
          case "CombineVec4":
            node2 = new CombineVec4Node();
            break;
          case "GlobalAmbient":
            node2 = new GlobalAmbientNode();
            break;
        }
        node2.id = saveId;
        node2.x = saveX;
        node2.y = saveY;
        map[node2.id] = node2;
        addNodeUI(node2, node2.x, node2.y);
      });
      setTimeout(() => data.connections.forEach((c) => {
        const fromNode = map[c.from];
        const toNode = map[c.to];
        const fromPin = c.fromPin;
        const toPin = c.toPin;
        if (!fromNode || !toNode) {
          console.warn("Skipping connection due to missing node", c);
          return;
        }
        shaderGraph.connect(fromNode, fromPin, toNode, toPin);
        const path2 = shaderGraph.connectionLayer.path();
        path2.dataset.from = `${fromNode.id}:${fromPin}`;
        path2.dataset.to = `${toNode.id}:${toPin}`;
        shaderGraph.connectionLayer.svg.appendChild(path2);
        shaderGraph.connectionLayer.redrawAll(path2);
      }), 50);
      return true;
    });
  }
  document.dispatchEvent(new CustomEvent("load-shader-graph", { detail: key }));
}

// ../curve-editor.js
var CurveEditor = class {
  constructor({ width = 651, height = 300, samples = 128 } = {}) {
    this.curveStore = new CurveStore();
    this.width = width;
    this.height = height;
    this.samples = samples;
    this.keys = [
      { time: 0, value: 0, inTangent: 0, outTangent: 0 },
      { time: 1, value: 0, inTangent: 0, outTangent: 0 }
    ];
    this.valueMin = -1;
    this.valueMax = 1;
    this.padLeft = 32;
    this.padBottom = 18;
    this.canvas = document.createElement("canvas");
    this.canvas.width = width;
    this.canvas.height = height;
    this.ctx = this.canvas.getContext("2d");
    this.zeroY = Math.round(this.height * 0.5) + 0.5;
    this.graphHeight = this.height - this.padBottom;
    this.snapEnabled = true;
    this.snapSteps = 20;
    this.snapValueSteps = 20;
    this.name = "Curve";
    this.currentValue = 0;
    this.value = 0;
    this.activeKey = null;
    this.dragMode = null;
    this._grabDX = 0;
    this._grabDY = 0;
    this.time = 0;
    this.loop = true;
    this.speed = 1;
    this.isGraphRunning = false;
    this._editorOpen = false;
    this._createPopup();
    this._bindMouse();
    this._buildToolbar();
    this._enableDrag();
    this.length = 1;
    this._lastTime = performance.now();
    this._runner = null;
    this.baked = this.bake(samples);
    setTimeout(() => this.draw(), 100);
  }
  _valueToY(v) {
    const n2 = (v - this.valueMin) / (this.valueMax - this.valueMin);
    return (1 - n2) * this.graphHeight;
  }
  _yToValue(y2) {
    const n2 = 1 - y2 / this.height;
    return this.valueMin + n2 * (this.valueMax - this.valueMin);
  }
  _snap(value, steps) {
    if (!this.snapEnabled) return value;
    const range = this.valueMax - this.valueMin;
    return Math.round((value - this.valueMin) / range * steps) / steps * range + this.valueMin;
  }
  // VALUE EVALUATION (HERMITE)
  getValue(t) {
    t = Math.max(0, Math.min(1, t));
    for (let i = 0; i < this.keys.length - 1; i++) {
      const k0 = this.keys[i];
      const k1 = this.keys[i + 1];
      if (t >= k0.time && t <= k1.time) {
        const dt = k1.time - k0.time;
        const u = (t - k0.time) / dt;
        const u2 = u * u;
        const u3 = u2 * u;
        const m0 = k0.outTangent * dt;
        const m1 = k1.inTangent * dt;
        return (2 * u3 - 3 * u2 + 1) * k0.value + (u3 - 2 * u2 + u) * m0 + (-2 * u3 + 3 * u2) * k1.value + (u3 - u2) * m1;
      }
    }
    return this.keys.at(-1).value;
  }
  // DRAW
  draw() {
    const padLeft = 32;
    const padBottom = 18;
    const ctx = this.ctx;
    const w = this.width - padLeft;
    const h = this.height - padBottom;
    ctx.save();
    ctx.translate(padLeft, 0);
    ctx.clearRect(-50, -50, w + padLeft + 50, h + padBottom + 50);
    ctx.fillStyle = "#0b0f14";
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "#1c2533";
    for (let i = 0; i <= 10; i++) {
      const x2 = i / 10 * w;
      const y3 = i / 10 * h;
      ctx.beginPath();
      ctx.moveTo(x2, 0);
      ctx.lineTo(x2, h);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, y3);
      ctx.lineTo(w, y3);
      ctx.stroke();
    }
    ctx.fillStyle = "#9aa7b2";
    ctx.font = "11px monospace";
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.fillText("+1", -6, this._valueToY(0.9));
    ctx.fillText("0", -6, this._valueToY(0));
    ctx.fillText("-1", -6, this._valueToY(-0.9));
    const zeroY = this._valueToY(0);
    ctx.strokeStyle = "#2e3b4e";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, zeroY);
    ctx.lineTo(w, zeroY);
    ctx.stroke();
    ctx.lineWidth = 1;
    ctx.strokeStyle = "#4fc3f7";
    ctx.beginPath();
    for (let i = 0; i <= 100; i++) {
      const t = i / 100;
      const x2 = t * w;
      const y3 = this._valueToY(this.getValue(t));
      i === 0 ? ctx.moveTo(x2, y3) : ctx.lineTo(x2, y3);
    }
    ctx.stroke();
    this.keys.forEach((k) => {
      const x2 = this._timeToX(k.time);
      const y3 = this._valueToY(k.value);
      ctx.strokeStyle = "#888";
      ctx.beginPath();
      ctx.moveTo(x2, y3);
      ctx.lineTo(x2 + 30, y3 - k.outTangent * 30);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x2, y3);
      ctx.lineTo(x2 - 30, y3 + k.inTangent * 30);
      ctx.stroke();
      ctx.fillStyle = "#ffcc00";
      ctx.beginPath();
      ctx.arc(x2, y3, 4, 0, Math.PI * 2);
      ctx.fill();
    });
    const playX = this._timeToX(this.time);
    const playY = this._valueToY(this.getValueNow());
    ctx.strokeStyle = "#ff5555";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(playX, 0);
    ctx.lineTo(playX, h);
    ctx.stroke();
    ctx.fillStyle = "#ff5555";
    ctx.beginPath();
    ctx.arc(playX, playY, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 1;
    ctx.restore();
    ctx.fillStyle = "#ffffffff";
    ctx.font = "13px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    const y2 = this.height - padBottom + 2;
    ctx.fillText("0s", padLeft, y2);
    ctx.fillText(
      (this.length * 0.5).toFixed(2) + "s",
      padLeft + w * 0.5,
      y2
    );
    ctx.fillText(
      this.length.toFixed(2) + "s",
      padLeft + w,
      y2
    );
    this._updateToolbar();
  }
  _getMouse(e) {
    const r2 = this.canvas.getBoundingClientRect();
    return {
      x: e.clientX - r2.left - this.padLeft,
      y: e.clientY - r2.top
    };
  }
  _bindMouse() {
    const hitKey = (mx, my) => {
      return this.keys.find((k) => {
        const x2 = this._timeToX(k.time);
        const y2 = this._valueToY(k.value);
        const HIT_RADIUS = 20;
        return Math.hypot(mx - x2, my - y2) <= HIT_RADIUS;
      });
    };
    const hitPlayhead = (mx, my) => {
      if (this.isGraphRunning) return false;
      const w = this.width - this.padLeft;
      const playX = this._timeToX(this.time);
      const playY = this._valueToY(this.getValueNow());
      return Math.hypot(mx - playX, my - playY) < 8;
    };
    this.canvas.addEventListener("mousedown", (e) => {
      const { x: mx, y: my } = this._getMouse(e);
      if (hitPlayhead(mx, my)) {
        this.activeKey = "playhead";
        this.dragMode = "playhead";
        return;
      }
      const k = hitKey(mx, my);
      if (k) {
        const w = this.width - this.padLeft;
        const kx = k.time * w;
        const ky = this._valueToY(k.value);
        this._grabDX = mx - kx;
        this._grabDY = my - ky;
        this.activeKey = k;
        this.dragMode = e.shiftKey ? "tangent" : "key";
      }
    });
    window.addEventListener("mousemove", (e) => {
      if (!this.activeKey) return;
      const { x: mx, y: my } = this._getMouse(e);
      if (this.dragMode === "playhead" && this.activeKey === "playhead") {
        const w = this.width - this.padLeft;
        let t = Math.max(0, Math.min(1, mx / w));
        t = this._snap(t, this.snapSteps);
        this.time = t;
        this.draw();
        return;
      }
      if (this.dragMode === "key") {
        const w = this.width - this.padLeft;
        let t = (mx - this._grabDX) / w;
        t = Math.max(0, Math.min(1 - 1e-6, t));
        let v = this._yToValue(my - this._grabDY);
        v = Math.max(this.valueMin, Math.min(this.valueMax, v));
        v = this._snap(v, this.snapValueSteps);
        t = this._snap(t, this.snapSteps);
        v = this._snap(v, this.snapValueSteps);
        this.activeKey.time = t;
        this.activeKey.value = v;
        this.keys.sort((a, b) => a.time - b.time);
      }
      if (this.dragMode === "tangent") {
        const dx = mx / r.width - this.activeKey.time;
        const dy = 1 - my / r.height - this.activeKey.value;
        this.activeKey.outTangent = dy / dx || 0;
        this.activeKey.inTangent = this.activeKey.outTangent;
      }
      this.draw();
      this._reBake();
    });
    window.addEventListener("mouseup", () => {
      this.activeKey = null;
      this.dragMode = null;
    });
    this.canvas.addEventListener("dblclick", (e) => {
      const { x: x2, y: y2 } = this._getMouse(e);
      const w = this.width - this.padLeft;
      const t = Math.max(0, Math.min(1, x2 / w));
      const v = this._yToValue(y2);
      this.keys.push({
        time: t,
        value: v,
        inTangent: 0,
        outTangent: 0
      });
      this.keys.sort((a, b) => a.time - b.time);
      this._reBake();
      this.draw();
    });
    this.canvas.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      const { x: mx, y: my } = this._getMouse(e);
      const k = hitKey(mx, my);
      if (k && this.keys.length > 2) {
        this.keys = this.keys.filter((x2) => x2 !== k);
        this.draw();
        this._reBake();
      }
    });
  }
  _timeToX(t) {
    const w = this.width - this.padLeft;
    const R = 4;
    let x2 = t * w;
    return Math.min(Math.max(x2, R), w - R);
  }
  // BAKING
  bake(samples = this.samples) {
    const data = new Float32Array(samples);
    for (let i = 0; i < samples; i++) {
      const t = i / (samples - 1);
      data[i] = this.getValue(t);
    }
    return data;
  }
  _reBake() {
    this.baked = this.bake(this.samples);
  }
  exec(delta) {
    if (!this.isGraphRunning) return this.value;
    this.time += delta / this.length * this.speed;
    if (this.loop && this.time > 1) this.time = 0;
    if (!this.loop && this.time > 1) {
      this.time = 1;
      this.stop();
    }
    const idx = Math.floor(this.time * (this.samples - 1));
    this.value = this.baked[idx];
    this.draw();
    return this.value;
  }
  // SYNTETIC FOR NOW 
  play() {
    if (this.isGraphRunning) return;
    this.isGraphRunning = true;
    this._lastTime = performance.now();
    this._runner = setInterval(() => {
      const now = performance.now();
      const delta = (now - this._lastTime) / 1e3;
      this._lastTime = now;
      this.exec(delta);
    }, 16);
  }
  stop() {
    this.isGraphRunning = false;
    if (this._runner) {
      clearInterval(this._runner);
      this._runner = null;
    }
    this.draw();
  }
  getValueNow() {
    return this.value;
  }
  _createPopup() {
    this.popup = document.createElement("div");
    this.popup.id = "curve-editor";
    Object.assign(this.popup.style, {
      position: "fixed",
      top: "20%",
      left: "20%",
      transform: "translate(-50%,-50%)",
      background: "#111",
      border: "1px solid #333",
      padding: "5px",
      display: "none",
      zIndex: 999,
      width: "650px",
      height: "409px",
      paddingLeft: "2px",
      paddingRight: "2px"
    });
    this.toolbarTitle = document.createElement("div");
    this.toolbarTitle.style.cssText = `
      display:flex;
      align-items:center;
      gap:10px;
      padding:4px 6px;
      background:#121822;
      border-bottom:1px solid #1c2533;
      font-size:12px;
      margin-bottom: 5px;
    `;
    this.toolbarTitle.innerHTML = `<h3>Curve Editor</h3>`;
    this.popup.appendChild(this.toolbarTitle);
    this.popup.appendChild(this.canvas);
    document.body.appendChild(this.popup);
  }
  toggleEditor() {
    this._editorOpen = !this._editorOpen;
    this.popup.style.display = this._editorOpen ? "block" : "none";
    this.draw();
  }
  _buildToolbar() {
    this.root = document.createElement("div");
    this.root.style.cssText = `
    background:#0b0f14;
    border:1px solid #1c2533;
    font-family:monospace;
    color:#cfd8dc;
    width:${this.width}px;
  `;
    this.toolbar = document.createElement("div");
    this.toolbar.style.cssText = `
    display:flex;
    align-items:center;
    gap:10px;
    padding:4px 6px;
    background:#121822;
    border-bottom:1px solid #1c2533;
    font-size:12px;
  `;
    this.nameInput = document.createElement("input");
    this.nameInput.value = this.name;
    this.nameInput.disabled = true;
    this.nameInput.style.cssText = `
    width:80px;
    background:#0b0f14;
    border:1px solid #1c2533;
    color:#fff;
    padding:2px 4px;
  `;
    this.nameInput.onchange = () => this.name = this.nameInput.value;
    this.playBtn = document.createElement("button");
    this.playBtn.textContent = "\u25B6";
    this.playBtn.style.cssText = `
      background:#1c2533;
      color:#fff;
      border:none;
      padding:2px 8px;
      cursor:pointer;
    `;
    this.playBtn.onclick = () => {
      this.isGraphRunning ? this.stop() : this.play();
    };
    this.lengthInput = document.createElement("input");
    this.lengthInput.type = "number";
    this.lengthInput.value = this.length;
    this.lengthInput.step = "0.1";
    this.lengthInput.style.cssText = `
      width:60px;
      background:#0b0f14;
      border:1px solid #1c2533;
      color:#fff;
      padding:2px 4px;
    `;
    this.lengthInput.onchange = () => {
      this.length = Math.max(0.01, parseFloat(this.lengthInput.value));
    };
    this.timeLabel = document.createElement("span");
    this.valueLabel = document.createElement("span");
    this.runLabel = document.createElement("span");
    this.snapBtn = document.createElement("button");
    this.snapBtn.textContent = "Snap";
    this.snapBtn.style.cssText = `
    background:#1c2533;
    color:#fff;
    border:none;
    padding:2px 6px;
    cursor:pointer;
  `;
    this.snapBtn.onclick = () => {
      this.snapEnabled = !this.snapEnabled;
      this.snapBtn.style.opacity = this.snapEnabled ? "1" : "0.4";
    };
    const lenLabel = document.createElement("span");
    lenLabel.textContent = "Len";
    this.resetBtn = document.createElement("button");
    this.resetBtn.textContent = "Reset";
    this.resetBtn.style.cssText = this.snapBtn.style.cssText;
    this.resetBtn.onclick = () => {
      this.time = 0;
      this.draw();
    };
    this.saveBtn = document.createElement("button");
    this.saveBtn.textContent = "\u{1F4BE} Save";
    this.saveBtn.style.cssText = `
      background:#1c2533;
      color:#fff;
      border:none;
      padding:2px 6px;
      cursor:pointer;
    `;
    this.saveBtn.onclick = () => {
      let curve = this.curveStore.getByName(this.name);
      if (!curve) {
        curve = new CurveData(this.name);
        this.curveStore.curves.push(curve);
      }
      curve.keys = this.keys.map((k) => ({ ...k }));
      curve.length = this.length;
      curve.loop = this.loop;
      curve.bake(this.samples);
      this.curveStore.save(curve);
      byId("saveMainGraphDOM").click();
      console.log(`%c Curve [${this.name}] saved`, "color:#4caf50;font-weight:bold");
    };
    this.hideBtn = document.createElement("button");
    this.hideBtn.textContent = "Hide";
    this.hideBtn.style.cssText = `
      background:#1c2533;
      color:#fff;
      border:none;
      padding:2px 6px;
      cursor:pointer;
    `;
    this.hideBtn.onclick = () => {
      this.toggleEditor();
      console.log(`%c Curve [${this.name}] saved!`, LOG_FUNNY_ARCADE2);
    };
    this.toolbar.append(
      this.nameInput,
      this.playBtn,
      lenLabel,
      this.lengthInput,
      this.timeLabel,
      this.valueLabel,
      this.runLabel,
      this.snapBtn,
      this.resetBtn,
      this.saveBtn,
      this.hideBtn
    );
    this.root.append(this.toolbar);
    this.popup.appendChild(this.root);
  }
  _updateToolbar = () => {
    this.currentValue = this.getValueNow();
    const timeSec = this.time * this.length;
    this.timeLabel.textContent = `T: ${timeSec.toFixed(2)}s`;
    this.valueLabel.textContent = `V: ${this.currentValue.toFixed(3)}`;
    this.runLabel.textContent = this.isGraphRunning ? "ACTIVE" : "STOPED";
    this.runLabel.style.color = this.isGraphRunning ? "#4caf50" : "#ff9800";
    this.playBtn.textContent = this.isGraphRunning ? "\u23F8" : "\u25B6";
  };
  _enableDrag() {
    const el2 = this.popup;
    const handle = this.toolbar;
    const handle2 = this.toolbarTitle;
    let isDown = false;
    let startX = 0;
    let startY = 0;
    let startLeft = 0;
    let startTop = 0;
    handle.style.cursor = "move";
    handle2.style.cursor = "move";
    handle.addEventListener("mousedown", (e) => {
      isDown = true;
      startX = e.clientX;
      startY = e.clientY;
      const rect = el2.getBoundingClientRect();
      startLeft = rect.left;
      startTop = rect.top;
      document.body.style.userSelect = "none";
    });
    handle2.addEventListener("mousedown", (e) => {
      isDown = true;
      startX = e.clientX;
      startY = e.clientY;
      const rect = el2.getBoundingClientRect();
      startLeft = rect.left;
      startTop = rect.top;
      document.body.style.userSelect = "none";
    });
    window.addEventListener("mousemove", (e) => {
      if (!isDown) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      el2.style.left = startLeft + dx + "px";
      el2.style.top = startTop + dy + "px";
      el2.style.transform = "none";
    });
    window.addEventListener("mouseup", () => {
      isDown = false;
      document.body.style.userSelect = "";
    });
  }
  bindCurve(curve, meta = {}) {
    this.curve = curve;
    this.keys = curve.keys;
    this.length = curve.length;
    this.loop = curve.loop;
    this.name = meta.idNode;
    this.nameInput.value = this.name;
    this.lengthInput.value = this.length;
    this.idNode = meta.idNode ?? null;
    this.time = 0;
    this._reBake();
    this.draw();
  }
};
var CurveData = class {
  constructor(name2) {
    this.name = name2;
    this.keys = [
      { time: 0, value: 0, inTangent: 0, outTangent: 0 },
      { time: 1, value: 1, inTangent: 0, outTangent: 0 }
    ];
    this.length = 1;
    this.loop = true;
    this.samples = 128;
    this.baked = null;
  }
  getValue(t) {
    t = Math.max(0, Math.min(1, t));
    for (let i = 0; i < this.keys.length - 1; i++) {
      const k0 = this.keys[i];
      const k1 = this.keys[i + 1];
      if (t >= k0.time && t <= k1.time) {
        const dt = k1.time - k0.time;
        const u = (t - k0.time) / dt;
        const u2 = u * u;
        const u3 = u2 * u;
        const m0 = k0.outTangent * dt;
        const m1 = k1.inTangent * dt;
        return (2 * u3 - 3 * u2 + 1) * k0.value + (u3 - 2 * u2 + u) * m0 + (-2 * u3 + 3 * u2) * k1.value + (u3 - u2) * m1;
      }
    }
    return this.keys.at(-1).value;
  }
  // bake real values, not normalized 0-1
  bake(samples = this.samples) {
    this.baked = new Float32Array(samples);
    for (let i = 0; i < samples; i++) {
      const t = i / (samples - 1);
      this.baked[i] = this.getValue(t);
    }
  }
  evaluate(time01) {
    if (!this.baked) {
      console.warn("Curve not baked!");
      return 0;
    }
    let t = time01;
    if (this.loop) t = t % 1;
    else t = Math.min(1, Math.max(0, t));
    const idx = Math.floor(t * (this.baked.length - 1));
    return this.baked[idx];
  }
};
var CurveStore = class {
  constructor() {
    this.CURVE_STORAGE_KEY = "PROJECT_NAME";
    this.curves = [];
    this.load();
  }
  has(name2) {
    return this.curves.some((c) => c.name === name2);
  }
  getOrCreate(curveArg) {
    let curve = this.curves.find((c) => c.name === curveArg.name);
    if (curve) return curve;
    curve = new CurveData(curveArg.name);
    this.curves.push(curve);
    return curve;
  }
  getByName(name2) {
    return this.curves.find((c) => c.name === name2) || null;
  }
  add(curve) {
    this.curves.push(curve);
    this.save();
  }
  removeByName(name2) {
    this.curves = this.curves.filter((c) => c.name !== name2);
    this.save();
  }
  getAll() {
    return this.curves;
  }
  // SAVE / LOAD
  save() {
    console.log("TEST SAVE", this.curves);
    const data = {
      version: 1,
      curves: this.curves
    };
    localStorage.setItem(this.CURVE_STORAGE_KEY, JSON.stringify(data));
  }
  // saveCurve(curveData) {
  //   const idx = this.curves.findIndex(c => c.name === curveData.name);
  //   if(idx >= 0) {
  //     this.curves[idx] = curveData;
  //   } else {
  //     this.curves.push(curveData);
  //   }
  //   this.save();
  // }
  load() {
    const raw = localStorage.getItem(this.CURVE_STORAGE_KEY);
    if (!raw) return;
    try {
      const data = JSON.parse(raw);
      if (!data.curves) return;
      this.curves = data.curves.map((c) => this._fromJSON(c));
    } catch (e) {
      console.warn("CurveStore load failed", e);
      this.curves = [];
    }
  }
  _fromJSON(obj2) {
    const c = new CurveData(obj2.name);
    c.keys = obj2.keys || [];
    c.length = obj2.length ?? 1;
    c.loop = !!obj2.loop;
    return c;
  }
};

// ../generateAISchema.js
var tasks = [
  "On load print hello world",
  "On load create a cube named box1 at position 0 0 0",
  "Create a the labyrinth using generatorWall",
  "Set texture for floor object",
  "Create a cube and enable raycast",
  "Create 5 cubes in a row with spacing",
  "Create a pyramid of cubes with 4 levels",
  "Play mp3 audio on load",
  "Create audio reactive node from music",
  "Print beat value when detected",
  "Rotate box1 slowly on Y axis every frame",
  "Move box1 forward on Z axis over time",
  "Oscillate box1 Y position between 0 and 2",
  "Change box1 rotation using sine wave",
  "On ray hit print hit object name",
  "Apply force to hit object in ray direction",
  "Change texture of object when clicked new texture rust metal",
  "Generate random number and print it",
  "Set variable score to 0",
  "Increase score by 1 on object hit, Print score value",
  "Dispatch custom event named GAME_START",
  "After 2 seconds create a new cube",
  "Animate cube position using curve timeline",
  "Enable vertex wave animation on floor"
];
var providers = [
  "ollama",
  "groq"
];

// ../fluxCodexVertex.js
var runtimeCacheObjs = [];
var FluxCodexVertex = class {
  constructor(boardId, boardWrapId, logId, methodsManager, projName, toolTip) {
    this.debugMode = true;
    this.toolTip = toolTip;
    this.curveEditor = new CurveEditor();
    this.SAVE_KEY = "fluxCodexVertex" + projName;
    this.methodsManager = methodsManager;
    this.variables = {
      number: {},
      boolean: {},
      string: {},
      object: {}
    };
    this.board = document.getElementById(boardId);
    this.boardWrap = document.getElementById(boardWrapId);
    this.svg = this.board.querySelector("svg.connections");
    this.logEl = document.getElementById(logId);
    this.nodes = {};
    this.links = [];
    this.nodeCounter = 1;
    this.linkCounter = 1;
    this._execContext = null;
    this.state = {
      draggingNode: null,
      dragOffset: [0, 0],
      connecting: null,
      selectedNode: null,
      pan: [0, 0],
      panning: false,
      panStart: [0, 0],
      zoom: 1
    };
    this.clearRuntime = () => {
      app.graphUpdate = () => {
      };
      console.info("%cDestroy runtime objects." + Object.values(this.nodes).filter((n2) => n2.title == "On Draw"), LOG_FUNNY_ARCADE2);
      let allOnDraws = Object.values(this.nodes).filter((n2) => n2.title == "On Draw");
      for (var x2 = 0; x2 < allOnDraws.length; x2++) {
        allOnDraws[x2]._listenerAttached = false;
      }
      let getCurrentGIzmoObj = app.mainRenderBundle.filter((o2) => o2.effects.gizmoEffect && o2.effects.gizmoEffect.enabled == false);
      if (getCurrentGIzmoObj.length > 0) getCurrentGIzmoObj[0].effects.gizmoEffect.enabled = true;
      app.mainRenderBundle.forEach((o2) => {
        o2.vertexAnim.disableAll();
      });
      for (let x3 = 0; x3 < runtimeCacheObjs.length; x3++) {
        app.removeSceneObjectByName(runtimeCacheObjs[x3].name);
      }
      document.dispatchEvent(new CustomEvent("updateSceneContainer", { detail: {} }));
      byId("graph-status").innerHTML = "\u26AB";
    };
    this.setZoom = (z) => {
      this.state.zoom = Math.max(0.2, Math.min(2.5, z));
      this.board.style.transform = `scale(${this.state.zoom})`;
    };
    this.onWheel = (e) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      this.setZoom(this.state.zoom + delta);
    };
    this.boardWrap.addEventListener("wheel", this.onWheel.bind(this), {
      passive: false
      // IMPORTANT
    });
    this.createVariablesPopup();
    this.createAIToolPopup();
    this._createImportInput();
    this.bindGlobalListeners();
    this._varInputs = {};
    document.addEventListener("on-ai-graph-response", (e) => {
      console.info("%c<AI RESPONSE>", LOG_FUNNY_ARCADE2);
      byId("graphGenJSON").value = e.detail;
      byId("ai-status").removeAttribute("data-ai-status");
    });
    document.addEventListener("keydown", (e) => {
      const target = e.composedPath && e.composedPath()[0] || e.target || document.activeElement;
      function isEditableElement(el2) {
        if (!el2) return false;
        if (el2 instanceof HTMLInputElement || el2 instanceof HTMLTextAreaElement || el2 instanceof HTMLSelectElement) return true;
        if (el2.isContentEditable) return true;
        if (el2.getAttribute && el2.getAttribute("role") === "textbox") return true;
        return false;
      }
      if (isEditableElement(target)) return;
      if (e.key == "F6") {
        e.preventDefault();
        this.runGraph();
      } else if (e.key === "Delete") {
        if (this.state.selectedNode) {
          this.deleteNode(this.state.selectedNode);
          this.state.selectedNode = null;
        }
      }
    });
    this.createContextMenu();
    document.addEventListener("fluxcodex.input.change", (e) => {
      console.log("fluxcodex.input.change");
      const { nodeId: nodeId2, field, value } = e.detail;
      const node2 = this.nodes.find((n2) => n2.id === nodeId2);
      if (!node2) return;
      if (node2.type !== "getSubObject") return;
      this.handleGetSubObject(node2, value);
      if (field !== "path") return;
    });
    document.addEventListener("web.editor.addMp3", (e) => {
      console.log("[web.editor.addMp3]: ", e.detail);
      e.detail.path = e.detail.path.replace("\\res", "res");
      e.detail.path = e.detail.path.replace(/\\/g, "/");
      this.addNode("audioMP3", e.detail);
    });
    document.addEventListener("show-curve-editor", (e) => {
      this.curveEditor.toggleEditor();
    });
    setTimeout(() => this.init(), 3300);
  }
  createContextMenu() {
    let CMenu = document.createElement("div");
    CMenu.id = "fc-context-menu";
    CMenu.classList.add("fc-context-menu");
    CMenu.classList.add("hidden");
    const board = document.getElementById("board");
    board.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      CMenu.innerHTML = this.getFluxCodexMenuHTML();
      const menuRect = CMenu.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      let x2 = e.clientX;
      let y2 = e.clientY;
      if (x2 + menuRect.width > vw) {
        x2 = vw - menuRect.width - 5;
      }
      if (y2 > vh * 0.5) {
        y2 = y2 - menuRect.height;
      }
      if (y2 < 5) y2 = 5;
      CMenu.style.left = x2 + "px";
      CMenu.style.top = y2 + "px";
      CMenu.classList.remove("hidden");
    });
    document.addEventListener("click", () => {
      CMenu.classList.add("hidden");
    });
    byId("app").appendChild(CMenu);
  }
  getFluxCodexMenuHTML() {
    return `
    <h3>Events / Func</h3>
    <button onclick="app.editor.fluxCodexVertex.addNode('event')">Event: onLoad</button>
    <button onclick="app.editor.fluxCodexVertex.addNode('function')">Function</button>
    <button onclick="app.editor.fluxCodexVertex.addNode('if')">If Branch</button>
    <button onclick="app.editor.fluxCodexVertex.addNode('genrand')">GenRandInt</button>
    <button onclick="app.editor.fluxCodexVertex.addNode('print')">Print</button>
    <button onclick="app.editor.fluxCodexVertex.addNode('timeout')">SetTimeout</button>
    <button onclick="app.editor.fluxCodexVertex.addNode('getArray')">getArray</button>
    <button onclick="app.editor.fluxCodexVertex.addNode('forEach')">forEach</button>
    <hr>
    <span>Networking</span>
    <button onclick="app.editor.fluxCodexVertex.addNode('fetch')">Fetch</button>
    <hr>
    <span>Scene</span>
    <button onclick="app.editor.fluxCodexVertex.addNode('getSceneObject')">Get Scene Object</button>
    <button onclick="app.editor.fluxCodexVertex.addNode('getSceneLight')">Get Scene Light</button>
    <button onclick="app.editor.fluxCodexVertex.addNode('getObjectAnimation')">Get Object Animation</button>
    <button onclick="app.editor.fluxCodexVertex.addNode('setPosition')">Set Position</button>
    <button onclick="app.editor.fluxCodexVertex.addNode('setMaterial')">Set Material</button>
    <button onclick="app.editor.fluxCodexVertex.addNode('setWaterParams')">Set Water Material Params</button>
    <button onclick="app.editor.fluxCodexVertex.addNode('translateByX')">Translate by X</button>
    <button onclick="app.editor.fluxCodexVertex.addNode('translateByY')">Translate by Y</button>
    <button onclick="app.editor.fluxCodexVertex.addNode('translateByZ')">Translate by Z</button>
    <button onclick="app.editor.fluxCodexVertex.addNode('setSpeed')">Set Speed</button>
    <button onclick="app.editor.fluxCodexVertex.addNode('getSpeed')">Get Speed</button>
    <button onclick="app.editor.fluxCodexVertex.addNode('setRotation')">Set Rotation</button>
    <button onclick="app.editor.fluxCodexVertex.addNode('setRotate')">Set Rotate</button>
    <button onclick="app.editor.fluxCodexVertex.addNode('setRotateX')">Set RotateX</button>
    <button onclick="app.editor.fluxCodexVertex.addNode('setRotateY')">Set RotateY</button>
    <button onclick="app.editor.fluxCodexVertex.addNode('setRotateZ')">Set RotateZ</button>
    <button onclick="app.editor.fluxCodexVertex.addNode('setTexture')">Set Texture</button>
    <button onclick="app.editor.fluxCodexVertex.addNode('onTargetPositionReach')">onTargetPositionReach</button>
    <button onclick="app.editor.fluxCodexVertex.addNode('dynamicFunction')">Function Dinamic</button>
    <button onclick="app.editor.fluxCodexVertex.addNode('refFunction')">Function by Ref</button>
    <button onclick="app.editor.fluxCodexVertex.addNode('getSubObject')">Get Sub Object</button>
    <hr>
    <span>Comment</span>
    <button onclick="app.editor.fluxCodexVertex.addNode('comment')">Comment</button>
    <hr>
    <span>Math</span>
    <button onclick="app.editor.fluxCodexVertex.addNode('add')">Add (+)</button>
    <button onclick="app.editor.fluxCodexVertex.addNode('sub')">Sub (-)</button>
    <button onclick="app.editor.fluxCodexVertex.addNode('mul')">Mul (*)</button>
    <button onclick="app.editor.fluxCodexVertex.addNode('div')">Div (/)</button>
    <button onclick="app.editor.fluxCodexVertex.addNode('sin')">Sin</button>
    <button onclick="app.editor.fluxCodexVertex.addNode('cos')">Cos</button>
    <button onclick="app.editor.fluxCodexVertex.addNode('pi')">Pi</button>
    <hr>
    <span>Comparison</span>
    <button onclick="app.editor.fluxCodexVertex.addNode('equal')">Equal (==)</button>
    <button onclick="app.editor.fluxCodexVertex.addNode('notequal')">Not Equal (!=)</button>
    <button onclick="app.editor.fluxCodexVertex.addNode('greater')">Greater (>)</button>
    <button onclick="app.editor.fluxCodexVertex.addNode('less')">Less (<)</button>
    <hr>
    <span>Compile</span>
    <button onclick="app.editor.fluxCodexVertex.compileGraph()">Save</button>
    <button onclick="app.editor.fluxCodexVertex.runGraph()">Run (F6)</button>
  `;
  }
  log(...args2) {
    this.logEl.textContent = args2.join(" ");
  }
  createGetNumberNode(varName) {
    return this.addNode("getNumber", { var: varName });
  }
  createGetBooleanNode(varName) {
    return this.addNode("getBoolean", { var: varName });
  }
  createGetStringNode(varName) {
    return this.addNode("getString", { var: varName });
  }
  createGetObjectNode(varName) {
    return this.addNode("getObject", { var: varName });
  }
  createSetNumberNode(varName) {
    return this.addNode("setNumber", { var: varName });
  }
  createSetBooleanNode(varName) {
    return this.addNode("setBoolean", { var: varName });
  }
  createSetStringNode(varName) {
    return this.addNode("setString", { var: varName });
  }
  createSetObjectNode(varName) {
    return this.addNode("setObject", { var: varName });
  }
  evaluateGetterNode(n2) {
    const key = n2.fields?.find((f) => f.key === "var")?.value;
    if (!key) return;
    const type2 = n2.title.replace("Get ", "").toLowerCase();
    const entry = this.variables[type2]?.[key];
    n2._returnCache = entry ? entry.value : type2 === "number" ? 0 : type2 === "boolean" ? false : type2 === "string" ? "" : type2 === "object" ? {} : void 0;
  }
  notifyVariableChanged(type2, key) {
    for (const id2 in this.nodes) {
      const n2 = this.nodes[id2];
      if (n2.isGetterNode) {
        const varField = n2.fields?.find((f) => f.key === "var");
        if (varField?.value === key && n2.title.replace("Get ", "").toLowerCase() === type2) {
          this.evaluateGetterNode(n2);
          if (n2.displayEl) {
            const val = n2._returnCache;
            if (type2 === "object")
              n2.displayEl.textContent = JSON.stringify(val, null, 2);
            else if (type2 === "number")
              n2.displayEl.textContent = val.toFixed(3);
            else n2.displayEl.textContent = String(val);
          }
        }
      }
      n2.inputs?.forEach((pin) => {
        const link = this.getConnectedSource(n2.id, pin.name);
        if (link?.node?.isGetterNode) {
          const srcNode = link.node;
          const srcPin = link.pin;
          if (srcNode.fields?.find((f) => f.key === "var")?.value === key) {
            this._adaptGetSubObjectOnConnect(n2, srcNode, srcPin);
          }
        }
      });
    }
    const input = this._varInputs?.[`${type2}.${key}`];
    if (input) {
      const storedValue = this.variables?.[type2]?.[key];
      if (type2 === "object")
        input.value = JSON.stringify(storedValue ?? {}, null, 2);
      else input.value = storedValue ?? "";
    }
  }
  createVariablesPopup() {
    if (this._varsPopup) return;
    const popup = document.createElement("div");
    popup.id = "varsPopup";
    this._varsPopup = popup;
    Object.assign(popup.style, {
      display: "none",
      flexDirection: "column",
      position: "absolute",
      top: "10%",
      left: "0",
      width: "60%",
      height: "60%",
      overflow: "scroll",
      background: "linear-gradient(135deg, #1a1a1a 0%, #2b2b2b 100%), /* subtle dark gradient */ repeating-linear-gradient(0deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.05) 1px, transparent 1px, transparent 20px), repeating-linear-gradient(90deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.05) 1px, transparent 1px, transparent 20px)",
      backgroundBlendMode: "overlay",
      backgroundSize: "auto, 20px 20px, 20px 20px",
      border: "1px solid #444",
      borderRadius: "8px",
      padding: "10px",
      zIndex: 99,
      color: "#eee",
      overflowX: "hidden"
    });
    const title = document.createElement("div");
    title.innerHTML = `Variables`;
    title.style.marginBottom = "8px";
    title.style.fontWeight = "bold";
    popup.appendChild(title);
    const list = document.createElement("div");
    list.id = "varslist";
    popup.appendChild(list);
    const btns = document.createElement("div");
    btns.style.marginTop = "10px";
    btns.style.display = "flex";
    btns.style.gap = "6px";
    btns.append(
      this._createVarBtn("Number", "number"),
      this._createVarBtn("Boolean", "boolean"),
      this._createVarBtn("String", "string"),
      this._createVarBtn("Object", "object")
    );
    popup.appendChild(btns);
    const hideVPopup = document.createElement("button");
    hideVPopup.innerText = `Hide`;
    hideVPopup.classList.add("btn4");
    hideVPopup.style.margin = "8px 8px 8px 8px";
    hideVPopup.style.width = "200px";
    hideVPopup.style.fontWeight = "bold";
    hideVPopup.style.webkitTextStrokeWidth = "0px";
    hideVPopup.addEventListener("click", () => {
      byId("varsPopup").style.display = "none";
    });
    popup.appendChild(hideVPopup);
    const saveVPopup = document.createElement("button");
    saveVPopup.innerText = `Save`;
    saveVPopup.classList.add("btn4");
    saveVPopup.style.margin = "8px 8px 8px 8px";
    saveVPopup.style.width = "200px";
    saveVPopup.style.height = "70px";
    saveVPopup.style.fontWeight = "bold";
    saveVPopup.style.webkitTextStrokeWidth = "0px";
    saveVPopup.addEventListener("click", () => {
      this.compileGraph();
    });
    popup.appendChild(saveVPopup);
    document.body.appendChild(popup);
    this.makePopupDraggable(popup);
    this._refreshVarsList(list);
  }
  createAIToolPopup() {
    if (this._aiPopup) return;
    const popup = document.createElement("div");
    popup.id = "aiPopup";
    this._aiPopup = popup;
    Object.assign(popup.style, {
      display: "none",
      flexDirection: "column",
      alignItems: "flex-start",
      position: "absolute",
      top: "10%",
      left: "5%",
      width: "50%",
      height: "70%",
      background: `
    linear-gradient(145deg, #141414 0%, #1e1e1e 60%, #252525 100%),
    repeating-linear-gradient(
      0deg,
      rgba(255,255,255,0.04),
      rgba(255,255,255,0.04) 1px,
      transparent 1px,
      transparent 22px
    ),
    repeating-linear-gradient(
      90deg,
      rgba(255,255,255,0.04),
      rgba(255,255,255,0.04) 1px,
      transparent 1px,
      transparent 22px
    )
  `,
      backgroundBlendMode: "overlay",
      backgroundSize: "auto, 22px 22px, 22px 22px",
      border: "1px solid rgba(255,255,255,0.15)",
      borderRadius: "10px",
      boxShadow: `
    0 20px 40px rgba(0,0,0,0.65),
    inset 0 1px 0 rgba(255,255,255,0.05)
  `,
      padding: "12px 14px",
      zIndex: 99,
      color: "#e6e6e6",
      overflowY: "auto",
      overflowX: "hidden",
      fontFamily: "Orbitron, monospace",
      fontSize: "13px"
    });
    const title = document.createElement("div");
    title.innerHTML = `FluxCodexVertex AI generator [Experimental]`;
    title.style.marginBottom = "18px";
    title.style.fontWeight = "bold";
    title.style.fontSize = "20px";
    popup.appendChild(title);
    const label1 = document.createElement("span");
    label1.innerText = `Select task for ai`;
    popup.appendChild(label1);
    const selectPrompt = document.createElement("select");
    selectPrompt.style.width = "400px";
    const placeholder2 = document.createElement("option");
    placeholder2.textContent = "Select task";
    placeholder2.value = "";
    placeholder2.disabled = true;
    placeholder2.selected = true;
    selectPrompt.appendChild(placeholder2);
    tasks.forEach((t, i) => {
      const opt = document.createElement("option");
      opt.value = i;
      opt.textContent = t;
      selectPrompt.appendChild(opt);
    });
    popup.appendChild(selectPrompt);
    const label2 = document.createElement("span");
    label2.innerText = `Select provider [Only OLLAMA for now]`;
    popup.appendChild(label2);
    const selectPromptProvider = document.createElement("select");
    selectPromptProvider.style.width = "400px";
    providers.forEach((p, i) => {
      const opt = document.createElement("option");
      opt.value = i;
      opt.textContent = p;
      selectPromptProvider.appendChild(opt);
    });
    popup.appendChild(selectPromptProvider);
    const call = document.createElement("button");
    call.id = "ai-status";
    call.innerText = `Generate`;
    call.classList.add("btnLeftBox");
    call.classList.add("btn4");
    call.style.margin = "8px 8px 8px 8px";
    call.style.width = "200px";
    call.style.fontWeight = "bold";
    call.style.webkitTextStrokeWidth = "0px";
    call.addEventListener("click", (e) => {
      if (selectPrompt.selectedIndex > 0) {
      }
      if (e.target.getAttribute("data-ai-status") == null) {
        e.target.setAttribute("data-ai-status", "wip");
      } else {
        if (e.target.getAttribute("data-ai-status") == "wip") {
          console.info("gen ai tool call PREVENT ");
          return;
        } else {
          console.info("gen ai tool call !!!!!!!!!!!!!!!! else ");
        }
      }
      console.log(`%cAI TASK:${selectPrompt.selectedOptions[0].innerText}`, LOG_FUNNY_ARCADE2);
      document.dispatchEvent(new CustomEvent("aiGenGraphCall", {
        detail: {
          provider: providers[0],
          // hardcode
          task: selectPrompt.selectedOptions[0].innerText
        }
      }));
    });
    popup.appendChild(call);
    this.toolTip.attachTooltip(call, "AI will try to generate graph. It is not guaranteed to work \u26A0\uFE0F");
    const list = document.createElement("textarea");
    list.style.height = "500px";
    list.id = "graphGenJSON";
    list.disabled = true;
    Object.assign(list.style, {
      height: "100%",
      minHeight: "420px",
      resize: "none",
      background: "#0f0f0f",
      color: "#d0f0ff",
      border: "1px solid #333",
      borderRadius: "6px",
      padding: "10px",
      marginBottom: "10px",
      fontFamily: "JetBrains Mono, monospace",
      fontSize: "12px",
      lineHeight: "1.4",
      width: "98%",
      outline: "none",
      boxShadow: "inset 0 0 8px rgba(0,0,0,0.6)"
    });
    popup.appendChild(list);
    this.toolTip.attachTooltip(list, "If the exported graph is not valid, in the last case you can manually try to fix it, but it is best to make a new query \u26A0\uFE0F");
    const wrap1 = document.createElement("div");
    wrap1.style.display = "flex";
    wrap1.style.height = "50px";
    popup.appendChild(wrap1);
    const hideAIGen = document.createElement("button");
    hideAIGen.innerText = `Hide`;
    hideAIGen.classList.add("btn4");
    hideAIGen.classList.add("btnLeftBox");
    hideAIGen.style.margin = "8px 8px 8px 8px";
    hideAIGen.style.width = "100px";
    hideAIGen.style.fontWeight = "bold";
    hideAIGen.style.webkitTextStrokeWidth = "0px";
    hideAIGen.addEventListener("click", () => {
      byId("aiPopup").style.display = "none";
    });
    wrap1.appendChild(hideAIGen);
    const copy3 = document.createElement("button");
    copy3.innerText = `Copy`;
    copy3.classList.add("btnLeftBox");
    copy3.classList.add("btn4");
    copy3.style.margin = "8px 8px 8px 8px";
    copy3.style.width = "100px";
    copy3.style.fontWeight = "bold";
    copy3.style.color = "lime";
    copy3.style.webkitTextStrokeWidth = "0px";
    copy3.addEventListener("click", async () => {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(list.value);
      } else {
        list.select();
        document.execCommand("copy");
      }
    });
    wrap1.appendChild(copy3);
    const exportJSON = document.createElement("button");
    exportJSON.innerText = `Export JSON`;
    exportJSON.classList.add("btnLeftBox");
    exportJSON.classList.add("btn4");
    exportJSON.style.margin = "8px 8px 8px 8px";
    exportJSON.style.width = "100px";
    exportJSON.style.fontWeight = "bold";
    exportJSON.style.color = "lime";
    exportJSON.style.webkitTextStrokeWidth = "0px";
    exportJSON.addEventListener("click", async () => {
      this.exportAIGenJson(byId("graphGenJSON").value);
    });
    wrap1.appendChild(exportJSON);
    const insertGraph = document.createElement("button");
    insertGraph.innerText = `Insert graph`;
    insertGraph.classList.add("btnLeftBox");
    insertGraph.classList.add("btn4");
    insertGraph.style.margin = "8px 8px 8px 8px";
    insertGraph.style.width = "100px";
    insertGraph.style.fontWeight = "bold";
    insertGraph.style.color = "lime";
    insertGraph.style.webkitTextStrokeWidth = "0px";
    insertGraph.addEventListener("click", async () => {
      console.log("TEST OVERRIDE", list.value);
      let test = JSON.parse(list.value);
      this.mergeGraphBundle(test);
    });
    wrap1.appendChild(insertGraph);
    document.body.appendChild(popup);
    this.makePopupDraggable(popup);
  }
  exportAIGenJson(graphData, fileName = "ai-gen-fcv-graph.json") {
    try {
      const blob = new Blob([graphData], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      console.log("Graph exported successfully.");
    } catch (error) {
      console.error("Failed to export graph:", error);
    }
  }
  _refreshVarsList(container) {
    container.innerHTML = "";
    const colors = {
      number: "#4fc3f7",
      boolean: "#aed581",
      string: "#ffb74d",
      object: "#ce93d8"
    };
    for (const type2 in this.variables) {
      for (const name2 in this.variables[type2]) {
        const row2 = document.createElement("div");
        Object.assign(row2.style, {
          display: "flex",
          alignItems: "center",
          gap: "6px",
          padding: "4px",
          cursor: "pointer",
          borderBottom: "1px solid #222",
          color: colors[type2] || "#fff",
          placeContent: "space-around"
        });
        const label = document.createElement("span");
        label.textContent = `${name2} (${type2})`;
        label.style.width = "20%";
        let input;
        if (type2 === "object") {
          input = document.createElement("textarea");
          input.value = JSON.stringify(this.variables[type2][name2] ?? {}, null, 2);
          input.style.height = "40px";
          input.style.webkitTextStrokeWidth = "0px";
        } else {
          input = document.createElement("input");
          input.value = this.variables[type2][name2] ?? "";
        }
        input.style.width = "30%";
        this._varInputs[`${type2}.${name2}`] = input;
        Object.assign(input.style, {
          background: "#000",
          color: "#fff",
          border: "1px solid #333"
        });
        input.oninput = () => {
          if (type2 === "object") {
            try {
              this.variables.object[name2] = JSON.parse(input.value);
            } catch {
              return;
            }
          } else if (type2 === "number") {
            this.variables.number[name2] = parseFloat(input.value);
          } else if (type2 === "boolean") {
            this.variables.boolean[name2] = input.value === "true";
          } else {
            this.variables.string[name2] = input.value;
          }
        };
        const btnGet = document.createElement("button");
        btnGet.innerText = "Get";
        btnGet.classList.add("btnGetter");
        btnGet.onclick = () => {
          if (type2 === "number") this.createGetNumberNode(name2);
          else if (type2 === "boolean") this.createGetBooleanNode(name2);
          else if (type2 === "string") this.createGetStringNode(name2);
          else if (type2 === "object") this.createGetObjectNode(name2);
        };
        const btnSet = document.createElement("button");
        btnSet.innerText = "Set";
        btnSet.classList.add("btnGetter");
        btnSet.onclick = () => {
          if (type2 === "number") this.createSetNumberNode(name2);
          else if (type2 === "boolean") this.createSetBooleanNode(name2);
          else if (type2 === "string") this.createSetStringNode(name2);
          else if (type2 === "object") this.createSetObjectNode(name2);
        };
        const btnDel = document.createElement("button");
        btnDel.innerText = "Del";
        btnDel.classList.add("btnGetter");
        btnDel.style.color = "#ff5252";
        btnDel.onclick = () => {
          if (!confirm(`Delete variable "${name2}" (${type2}) ?`)) return;
          delete this.variables[type2][name2];
          delete this._varInputs[`${type2}.${name2}`];
          this._refreshVarsList(container);
        };
        row2.append(label, input, btnGet, btnSet, btnDel);
        container.appendChild(row2);
      }
    }
  }
  makePopupDraggable(popup, handle = popup) {
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let startLeft = 0;
    let startTop = 0;
    handle.style.cursor = "move";
    handle.addEventListener("mousedown", (e) => {
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      const rect = popup.getBoundingClientRect();
      startLeft = rect.left;
      startTop = rect.top;
      popup.style.left = startLeft + "px";
      popup.style.top = startTop + "px";
      popup.style.transform = "none";
      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    });
    const onMove = (e) => {
      if (!isDragging) return;
      popup.style.left = startLeft + (e.clientX - startX) + "px";
      popup.style.top = startTop + (e.clientY - startY) + "px";
    };
    const onUp = () => {
      isDragging = false;
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
  }
  _createVarBtn(label, type2) {
    const btn = document.createElement("button");
    btn.textContent = label;
    btn.style.flex = "1";
    btn.style.cursor = "pointer";
    btn.classList.add("btn4");
    btn.onclick = () => {
      const name2 = prompt(`New ${type2} variable name`);
      if (!name2) return;
      if (!this.variables[type2]) this.variables[type2] = {};
      if (this.variables[type2][name2]) {
        alert("Variable exists");
        return;
      }
      this.variables[type2][name2] = type2 === "object" ? {} : type2 === "number" ? 0 : type2 === "boolean" ? false : type2 === "string" ? "" : null;
      this._refreshVarsList(this._varsPopup.children[1]);
    };
    return btn;
  }
  _getPinDot(nodeId2, pinName, isOutput) {
    const nodeEl = document.querySelector(`.node[data-id="${nodeId2}"]`);
    if (!nodeEl) return null;
    const io = isOutput ? "out" : "in";
    return nodeEl.querySelector(`.pin[data-pin="${pinName}"][data-io="${io}"] .dot`);
  }
  populateVariableSelect(select2, type2) {
    select2.innerHTML = "";
    const vars = this.variables[type2];
    if (!vars.length) {
      const opt = document.createElement("option");
      opt.textContent = "(no variables)";
      opt.disabled = true;
      select2.appendChild(opt);
      return;
    }
    vars.forEach((v) => {
      const opt = document.createElement("option");
      opt.value = v.name;
      opt.textContent = v.name;
      select2.appendChild(opt);
    });
  }
  // Dynamic Method Helpers
  getArgNames(fn) {
    const src = fn.toString().trim();
    const arrowNoParen = src.match(/^([a-zA-Z0-9_$]+)\s*=>/);
    if (arrowNoParen) {
      return [arrowNoParen[1].trim()];
    }
    const argsMatch = src.match(/\(([^)]*)\)/);
    if (argsMatch && argsMatch[1].trim().length > 0) {
      return argsMatch[1].split(",").map((a) => a.trim()).filter((a) => a.length > 0);
    }
    return [];
  }
  hasReturn(fn) {
    const src = fn.toString().trim();
    if (/=>\s*[^({]/.test(src)) {
      return true;
    }
    if (/return\s+/.test(src)) {
      return true;
    }
    return false;
  }
  adaptNodeToMethod(node2, methodItem) {
    const fn = this.methodsManager.compileFunction(methodItem.code);
    node2.inputs = [{ name: "exec", type: "action" }];
    node2.outputs = [{ name: "execOut", type: "action" }];
    const args2 = this.getArgNames(fn);
    args2.forEach((arg) => node2.inputs.push({ name: arg, type: "value" }));
    if (this.hasReturn(fn)) node2.outputs.push({ name: "return", type: "value" });
    node2.outputs.push({ name: "reference", type: "function" });
    node2.attachedMethod = methodItem.name;
    node2.fn = fn;
    this.updateNodeDOM(node2.id);
  }
  adaptNodeToMethod2(node2, methodItem) {
    const fn = this.methodsManager.compileFunction(methodItem.code);
    const args2 = this.getArgNames(fn);
    const preservedInputs = node2.inputs.filter(
      (p) => p.type === "action" || p.name === "reference"
    );
    const preservedOutputs = node2.outputs.filter(
      (p) => p.type === "action"
    );
    node2.inputs = [...preservedInputs];
    node2.outputs = [...preservedOutputs];
    args2.forEach((arg) => {
      if (!node2.inputs.some((p) => p.name === arg)) {
        node2.inputs.push({ name: arg, type: "value" });
      }
    });
    if (this.hasReturn(fn)) {
      if (!node2.outputs.some((p) => p.name === "return")) {
        node2.outputs.push({ name: "return", type: "value" });
      }
    }
    node2.attachedMethod = methodItem.name;
    node2.fn = fn;
    this.updateNodeDOM(node2.id);
  }
  adaptRefFunctionNode(node2, fnRef) {
    const args2 = this.getArgNames(fnRef);
    const hasReturn = this.hasReturn(fnRef);
    const preservedInputs = node2.inputs.filter(
      (p) => p.type === "action" || p.name === "reference"
    );
    const preservedOutputs = node2.outputs.filter(
      (p) => p.type === "action"
    );
    node2.inputs = [...preservedInputs];
    node2.outputs = [...preservedOutputs];
    args2.forEach((arg) => {
      if (!node2.inputs.some((p) => p.name === arg)) {
        node2.inputs.push({
          name: arg,
          type: "value"
        });
      }
    });
    if (hasReturn) {
      if (!node2.outputs.some((p) => p.name === "return")) {
        node2.outputs.push({
          name: "return",
          type: "value"
        });
      }
    }
    node2.fn = (...callArgs) => fnRef(...callArgs);
    this.updateNodeDOM(node2.id);
  }
  populateMethodsSelect(selectEl) {
    selectEl.innerHTML = "";
    const placeholder2 = document.createElement("option");
    placeholder2.value = "";
    placeholder2.textContent = "-- Select Method --";
    selectEl.appendChild(placeholder2);
    this.methodsManager.methodsContainer.forEach((method) => {
      const opt = document.createElement("option");
      opt.value = method.name;
      opt.textContent = method.name;
      selectEl.appendChild(opt);
    });
  }
  _getSceneSelectedName(node2) {
    return node2.fields?.find(
      (f) => f.key === "selectedObject" || f.key === "object"
    )?.value;
  }
  updateNodeDOM(nodeId2) {
    const node2 = this.nodes[nodeId2];
    const el2 = document.querySelector(`.node[data-id="${nodeId2}"]`);
    if (!el2) return;
    const left2 = el2.querySelector(".pins-left");
    const right2 = el2.querySelector(".pins-right");
    if (!left2 || !right2) return;
    left2.innerHTML = "";
    right2.innerHTML = "";
    const inputs = node2.inputs || [];
    const outputs = node2.outputs || [];
    inputs.forEach((pin) => left2.appendChild(this._pinElement(pin, false, nodeId2)));
    outputs.forEach((pin) => right2.appendChild(this._pinElement(pin, true, nodeId2)));
    if (node2.title === "Get Scene Object" || node2.title === "Get Scene Light" || node2.title === "Get Scene Animation") {
      const select2 = el2.querySelector("select.scene-select");
      if (select2) {
        console.log("!TEST! ???");
      }
    } else if (node2.category === "action" && node2.title === "Function") {
      let select2 = el2.querySelector("select.method-select");
      if (!select2) {
        select2 = document.createElement("select");
        select2.className = "method-select";
        select2.style.cssText = "width:100%; margin-top:6px;";
        el2.querySelector(".body").appendChild(select2);
      }
      this.populateMethodsSelect(select2);
      if (node2.attachedMethod) select2.value = node2.attachedMethod;
      select2.onchange = (e) => {
        const selected = this.methodsManager.methodsContainer.find((m) => m.name === e.target.value);
        console.log("test reference::::", selected);
        if (selected) this.adaptNodeToMethod(node2, selected);
      };
    } else if (node2.category === "functions") {
      const dom2 = document.querySelector(`.node[data-id="${nodeId2}"]`);
      this.restoreDynamicFunctionNode(node2, dom2);
    } else if (node2.category === "reffunctions") {
      const dom2 = document.querySelector(`.node[data-id="${nodeId2}"]`);
      this.restoreDynamicFunctionNode(node2, dom2);
    }
  }
  restoreDynamicFunctionNode(node, dom) {
    if (!node.accessObject && node.accessObjectLiteral) {
      try {
        node.accessObject = eval(node.accessObjectLiteral);
      } catch (e) {
        console.warn("Failed to eval accessObjectLiteral:", node.accessObjectLiteral, e);
        node.accessObject = [];
      }
    }
    if (!node.fields) node.fields = [];
    if (!node.fields.find((f) => f.key === "selectedObject")) {
      node.fields.push({ key: "selectedObject", value: "" });
    }
    if (!node.inputs || node.inputs.length === 0) {
      node.inputs = [{ name: "exec", type: "action" }];
    }
    if (!node.outputs || node.outputs.length === 0) {
      node.outputs = [{ name: "execOut", type: "action" }];
    }
    let select = dom.querySelector("select");
    if (select == null) {
      select = document.createElement("select");
      select.id = node.id;
      select.className = "method-select";
      select.style.cssText = "width:100%; margin-top:6px;";
      dom.appendChild(select);
    }
    if (select && node.accessObject) {
      const numOptions = select.options.length;
      const newLength = Object.keys(node.accessObject).filter((key) => typeof node.accessObject[key] === "function");
      if (numOptions !== newLength.length + 1) {
        select.innerHTML = "";
        const placeholder2 = document.createElement("option");
        placeholder2.value = "";
        placeholder2.textContent = "-- Select Function --";
        select.appendChild(placeholder2);
        Object.keys(node.accessObject).filter((key) => typeof node.accessObject[key] === "function").forEach((fnName) => {
          const opt = document.createElement("option");
          opt.value = fnName;
          opt.textContent = fnName;
          select.appendChild(opt);
        });
        const selected = node.fields.find((f) => f.key === "selectedObject")?.value;
        if (selected) select.value = selected;
      }
      select.onchange = (e) => {
        const val = e.target.value;
        node.fields.find((f) => f.key === "selectedObject").value = val;
      };
    }
  }
  // NODE/PIN
  startConnect(nodeId2, pinName, type2, isOut) {
    this.state.connecting = {
      node: nodeId2,
      pin: pinName,
      type: type2,
      out: isOut
    };
  }
  _applyConnectionRuntime(from, to, type2) {
    const toNode = this.nodes[to.node];
    const fromNode = this.nodes[from.node];
    if (!toNode || !fromNode) return;
    if (toNode.title === "reffunctions" && to.pin === "reference") {
      const fnRef = this.getPinValue(fromNode, from.pin);
      if (typeof fnRef === "function") {
        toNode._fnRef = fnRef;
        this.adaptRefFunctionNode(toNode, fnRef);
      }
    }
    this.onPinsConnected(fromNode, from.pin, toNode, to.pin);
  }
  restoreConnectionsRuntime() {
    for (const link of this.links) {
      this._applyConnectionRuntime(link.from, link.to, link.type);
    }
  }
  finishConnect(nodeId2, pinName, type2) {
    if (!this.state.connecting || this.state.connecting.node === nodeId2) {
      this.state.connecting = null;
      return;
    }
    const from = this.state.connecting.out ? this.state.connecting : { node: nodeId2, pin: pinName };
    const to = this.state.connecting.out ? { node: nodeId2, pin: pinName } : this.state.connecting;
    if (from.pin && to.pin && this.isTypeCompatible(this.state.connecting.type, type2)) {
      const exists = this.links.find(
        (l) => l.from.node === from.node && l.from.pin === from.pin && l.to.node === to.node && l.to.pin === to.pin
      );
      if (!exists) {
        this.links.push({ id: "link_" + this.linkCounter++, from, to, type: type2 });
        this.updateLinks();
        if (type2 === "value") setTimeout(() => this.updateValueDisplays(), 0);
      }
    }
    this.state.connecting = null;
    let toNode = this.nodes[to.node];
    let fromNode = this.nodes[from.node];
    if (toNode && toNode.title === "reffunctions" && to.pin === "reference") {
      console.log("sss ");
      const fnRef = this.getPinValue(fromNode, from.pin);
      if (typeof fnRef !== "function") return;
      toNode._fnRef = fnRef;
      this.adaptRefFunctionNode(toNode, fnRef);
    }
    toNode = this.nodes[to.node];
    fromNode = this.nodes[from.node];
    this.onPinsConnected(fromNode, from.pin, toNode, to.pin);
  }
  _adaptGetSubObjectOnConnect(getSubNode, sourceNode) {
    const obj2 = sourceNode._returnCache;
    if (!obj2 || typeof obj2 !== "object") return;
    const varField = sourceNode.fields?.find((f) => f.key === "var");
    const previewField = getSubNode.fields?.find((f) => f.key === "objectPreview");
    if (previewField) {
      previewField.value = varField?.value || "[object]";
      if (getSubNode.objectPreviewEl)
        getSubNode.objectPreviewEl.value = previewField.value;
    }
    const path2 = getSubNode.fields?.find((f) => f.key === "path")?.value;
    const target = this.resolvePath(obj2, path2);
    this.adaptSubObjectPins(getSubNode, target);
    getSubNode._subCache = {};
    if (target && typeof target === "object") {
      for (const k in target) getSubNode._subCache[k] = target[k];
    }
    getSubNode._needsRebuild = false;
    getSubNode._pinsBuilt = true;
    this.updateNodeDOM(getSubNode.id);
  }
  onPinsConnected(sourceNode, sourcePin, targetNode) {
    if (targetNode.title === "Get Scene Object" || targetNode.title === "Get Sub Object" || targetNode.title === "Get Scene Light") {
      this._adaptGetSubObjectOnConnect(targetNode, sourceNode, sourcePin);
    }
  }
  // get func for ref pin
  getPinValue(node2, pinName) {
    const out = node2.outputs?.find((p) => p.name === pinName);
    let getName = node2.fields.find((item) => item.key == "selectedObject").value;
    if (node2.title == "Get Scene Object") {
      return app.getSceneObjectByName(getName)[out.name];
    } else if (node2.title == "Get Scene Animation") {
      return app.getSceneObjectByName(getName)[out.name];
    } else {
      getName = parseInt(getName.replace("light", ""));
      return node2.accessObject[getName][pinName];
    }
  }
  normalizePinType(type2) {
    if (!type2) return "any";
    if (type2 === "number") return "value";
    return type2;
  }
  updateSceneObjectPins(node2, objectName2) {
    const obj2 = (node2.accessObject || []).find((o2) => o2.name === objectName2);
    if (!obj2) return;
    node2.outputs = [];
    node2.exposeProps.forEach((p) => {
      const value = this.getByPath(obj2, p);
      if (value !== void 0) {
        const type2 = typeof value === "number" ? "number" : typeof value === "string" ? "string" : "object";
        node2.outputs.push({ name: p, type: type2 });
      }
    });
    this.updateNodeDOM(node2.id);
  }
  _pinElement(pinSpec, isOutput, nodeId2) {
    const pin = document.createElement("div");
    if (pinSpec.name == "position") {
      pin.className = `pin pin-${pinSpec.name}`;
    } else {
      pin.className = `pin pin-${pinSpec.type}`;
    }
    pin.dataset.pin = pinSpec.name;
    pin.dataset.type = pinSpec.type;
    pin.dataset.io = isOutput ? "out" : "in";
    pin.dataset.node = nodeId2;
    const dot2 = document.createElement("div");
    dot2.className = "dot";
    pin.appendChild(dot2);
    const label = document.createElement("span");
    label.className = "pin-label";
    label.textContent = pinSpec.name;
    pin.appendChild(label);
    pin.addEventListener(
      "mousedown",
      () => this.startConnect(nodeId2, pinSpec.name, pinSpec.type, isOutput)
    );
    pin.addEventListener(
      "mouseup",
      () => this.finishConnect(nodeId2, pinSpec.name, pinSpec.type, isOutput)
    );
    return pin;
  }
  createNodeDOM(spec) {
    const el = document.createElement("div");
    if (spec.title == "Fetch") {
      el.className = "node " + (spec.title.toLowerCase() || "");
    } else if (spec.title == "Play MP3") {
      el.className = "node audios";
    } else if (spec.title == "Curve") {
      el.className = "node curve";
    } else if (spec.title == "Set Shader Graph") {
      el.className = "node shader";
    } else {
      el.className = "node " + (spec.category || "");
    }
    el.style.left = spec.x + "px";
    el.style.top = spec.y + "px";
    el.dataset.id = spec.id;
    const header = document.createElement("div");
    header.className = "header";
    header.textContent = spec.title;
    el.appendChild(header);
    const body = document.createElement("div");
    body.className = "body";
    const row = document.createElement("div");
    if (spec.title == "Comment") {
      row.classList.add("pin-row");
      row.classList.add("comment");
    } else {
      row.className = "pin-row";
    }
    const left = document.createElement("div");
    left.className = "pins-left";
    const right = document.createElement("div");
    right.className = "pins-right";
    (spec.inputs || []).forEach((pin) => {
      pin.type = this.normalizePinType(pin.type);
      left.appendChild(this._pinElement(pin, false, spec.id));
    });
    (spec.outputs || []).forEach((pin) => {
      pin.type = this.normalizePinType(pin.type);
      right.appendChild(this._pinElement(pin, true, spec.id));
    });
    row.appendChild(left);
    row.appendChild(right);
    body.appendChild(row);
    if (spec.title == "Curve") {
      const c = new CurveData(spec.id);
      let curve = this.curveEditor.curveStore.getOrCreate(c);
      spec.curve = curve;
      console.log(`%c Create DOM corotine Node [CURVE] ${spec.curve}`, LOG_FUNNY_ARCADE2);
      this.curveEditor.bindCurve(spec.curve, {
        name: spec.id,
        idNode: spec.id
      });
    }
    if (spec.comment) {
      const textarea = document.createElement("textarea");
      textarea.style.webkitBoxShadow = "inset 0px 0px 1px 4px #9E9E9E";
      textarea.style.boxShadow = "inset 0px 0px 22px 1px rgba(118, 118, 118, 1)";
      textarea.style.backgroundColor = "gray";
      textarea.style.color = "black";
      textarea.value = spec.fields.find((f) => f.key === "text").value;
      textarea.oninput = () => {
        spec.fields.find((f) => f.key === "text").value = textarea.value;
        row.textContent = textarea.value || "Comment";
      };
      body.appendChild(textarea);
    }
    if (spec.fields?.length && !spec.comment && spec.title != "GenRandInt") {
      const fieldsWrap = document.createElement("div");
      fieldsWrap.className = "node-fields";
      spec.fields.forEach((field) => {
        if (field.key === "var") return;
        const input = this.createFieldInput(spec, field);
        if (field.key === "objectPreview") {
          spec.objectPreviewEl = input;
        }
        fieldsWrap.appendChild(input);
      });
      body.appendChild(fieldsWrap);
    }
    if (spec.fields && spec.title === "GenRandInt") {
      const container = document.createElement("div");
      container.className = "genrand-inputs";
      spec.fields.forEach((f) => {
        const input = document.createElement("input");
        input.type = "number";
        input.value = f.value;
        input.style.width = "40px";
        input.style.marginRight = "4px";
        input.addEventListener("input", (e) => f.value = e.target.value);
        container.appendChild(input);
        const label = document.createElement("span");
        label.textContent = f.key;
        label.className = "field-label";
        container.appendChild(label);
      });
      body.appendChild(container);
    } else if (spec.category === "math" || spec.category === "value" || spec.title === "Print") {
      const display = document.createElement("div");
      display.className = "value-display";
      display.textContent = "?";
      spec.displayEl = display;
      body.appendChild(display);
    }
    if (spec.title === "Function" && spec.category === "action" && !spec.builtIn && !spec.isVariableNode) {
      const select2 = document.createElement("select");
      select2.id = spec.id;
      select2.className = "method-select";
      select2.style.cssText = "width:100%; margin-top:6px;";
      body.appendChild(select2);
      this.populateMethodsSelect(select2);
      if (spec.attachedMethod) {
        select2.value = spec.attachedMethod;
      }
      select2.addEventListener("change", (e) => {
        const selected = this.methodsManager.methodsContainer.find(
          (m) => m.name === e.target.value
        );
        if (selected) {
          console.log("test reference", selected);
          this.adaptNodeToMethod(spec, selected);
        }
      });
    }
    if (spec.fields?.some((f) => f.key === "var") && !spec.comment) {
      const input = document.createElement("input");
      input.type = "text";
      input.value = spec.fields.find((f) => f.key === "var")?.value ?? "";
      input.readOnly = true;
      input.style.width = "100%";
      input.style.marginTop = "6px";
      input.style.opacity = "0.7";
      input.style.cursor = "default";
      body.appendChild(input);
    }
    if (spec.title === "functions") {
      const select = document.createElement("select");
      select.style.width = "100%";
      select.style.marginTop = "6px";
      if (spec.accessObject === void 0) {
        spec.accessObject = eval(spec.accessObjectLiteral);
      }
      this.populateDynamicFunctionSelect(select, spec);
      select.addEventListener("change", (e) => {
        const fnName = e.target.value;
        if (fnName) {
          this.adaptDynamicFunction(spec, fnName);
        }
      });
      body.appendChild(select);
    }
    if (spec.title === "Get Scene Object" || spec.title === "Get Scene Animation" || spec.title === "Get Scene Light") {
      const select = document.createElement("select");
      select.id = spec._id ? spec._id : spec.id;
      select.style.width = "100%";
      select.style.marginTop = "6px";
      if (spec.accessObject === void 0) spec.accessObject = eval(spec.accessObjectLiteral);
      const objects = spec.accessObject || [];
      const placeholder = document.createElement("option");
      placeholder.textContent = "-- Select Object --";
      placeholder.value = "";
      select.appendChild(placeholder);
      spec.accessObject.forEach((obj2) => {
        const opt = document.createElement("option");
        opt.value = obj2.name;
        opt.textContent = obj2.name;
        select.appendChild(opt);
      });
      if (spec.fields[0].value) select.value = spec.fields[0].value;
      select.addEventListener("change", (e) => {
        const name2 = e.target.value;
        spec.fields[0].value = name2;
        this.updateSceneObjectPins(spec, name2);
      });
      el.appendChild(select);
    } else if (spec.title === "Set Shader Graph") {
      const select = document.createElement("select");
      select.id = spec._id ? spec._id : spec.id;
      select.style.width = "100%";
      select.style.marginTop = "6px";
      if (spec.accessObject === void 0) spec.accessObject = eval(spec.accessObjectLiteral);
      const placeholder = document.createElement("option");
      placeholder.textContent = "-- Select Shader --";
      placeholder.value = "";
      select.appendChild(placeholder);
      spec.accessObject.runtimeList.forEach((name2) => {
        const opt = document.createElement("option");
        opt.value = name2;
        opt.textContent = name2;
        select.appendChild(opt);
      });
      select.addEventListener("change", (e) => {
        const name2 = e.target.value;
        spec.fields[0].value = name2;
        const dom2 = document.querySelector(`.node[data-id="${spec.id}"]`);
        let fields = dom2.querySelectorAll(".node-fields");
        fields[0].children[0].value = name2;
      });
      el.appendChild(select);
      select.value = spec.fields[0].value;
      setTimeout(() => select.dispatchEvent(new Event("change", { bubbles: true })), 100);
    }
    el.appendChild(body);
    header.addEventListener("mousedown", (e) => {
      e.preventDefault();
      this.state.draggingNode = el;
      const rect = el.getBoundingClientRect();
      const bx = this.board.getBoundingClientRect();
      this.state.dragOffset = [
        e.clientX - rect.left + bx.left,
        e.clientY - rect.top + bx.top
      ];
      document.body.style.cursor = "grabbing";
    });
    el.addEventListener("click", (e) => {
      e.stopPropagation();
      this.selectNode(spec.id);
      this.updateNodeDOM(spec.id);
    });
    el.addEventListener("dblclick", (e) => {
      e.stopPropagation();
      console.log("DBL " + spec.id);
      this.onNodeDoubleClick(spec);
    });
    return el;
  }
  selectNode(id2) {
    if (this.state.selectedNode) {
      document.querySelector(`.node[data-id="${this.state.selectedNode}"]`)?.classList.remove("selected");
    }
    this.state.selectedNode = id2;
    document.querySelector(`.node[data-id="${id2}"]`)?.classList.add("selected");
  }
  populateDynamicFunctionSelect(select2, spec2) {
    select2.innerHTML = "";
    const placeholder2 = document.createElement("option");
    placeholder2.value = "";
    placeholder2.textContent = "-- Select Function --";
    select2.appendChild(placeholder2);
    if (!spec2.accessObject || typeof spec2.accessObject !== "object") return;
    for (const key in spec2.accessObject) {
      if (typeof spec2.accessObject[key] === "function") {
        const opt = document.createElement("option");
        opt.value = key;
        opt.textContent = key;
        select2.appendChild(opt);
      }
    }
    let current = spec2.fields.find((item) => item.key == "selectedObject").value;
    for (const opt of select2.options) {
      if (opt.text === current) {
        opt.selected = true;
        break;
      }
    }
  }
  isTypeCompatible(fromType, toType) {
    if (fromType === "action" || toType === "action") {
      return fromType === toType;
    }
    if (fromType === toType) return true;
    if (fromType === "any" || toType === "any") return true;
    return false;
  }
  addNode(type, options = {}) {
    const id = "node_" + this.nodeCounter++;
    const x = Math.abs(this.state.pan[0]) + 100 + Math.random() * 200;
    const y = Math.abs(this.state.pan[1]) + 100 + Math.random() * 200;
    const nodeFactories = {
      event: (id2, x2, y2) => ({
        id: id2,
        title: "onLoad",
        x: x2,
        y: y2,
        category: "event",
        inputs: [],
        outputs: [{ name: "exec", type: "action" }]
      }),
      audioMP3: (id2, x2, y2, options2) => ({
        id: id2,
        x: x2,
        y: y2,
        title: "Play MP3",
        category: "action",
        inputs: [
          { name: "exec", type: "action" },
          { name: "key", type: "string", default: "audio" },
          { name: "src", type: "string", default: "" },
          { name: "clones", type: "number", default: 1 }
        ],
        outputs: [
          { name: "execOut", type: "action" }
        ],
        fields: [
          { key: "created", value: false },
          { key: "key", value: options2?.name },
          { key: "src", value: options2?.path }
        ],
        noselfExec: "true"
      }),
      generator: (id2, x2, y2) => ({
        id: id2,
        x: x2,
        y: y2,
        title: "Generator",
        category: "action",
        inputs: [
          { name: "exec", type: "action" },
          { name: "material", type: "string" },
          { name: "pos", type: "object" },
          { name: "rot", type: "object" },
          { name: "texturePath", type: "string" },
          { name: "name", type: "string" },
          { name: "geometry", type: "string" },
          { name: "raycast", type: "boolean" },
          { name: "scale", type: "object" },
          { name: "sum", type: "number" },
          { name: "delay", type: "number" }
        ],
        outputs: [
          { name: "execOut", type: "action" }
        ],
        fields: [
          { key: "material", value: "standard" },
          { key: "pos", value: "{x:0, y:0, z:-20}" },
          { key: "rot", value: "{x:0, y:0, z:0}" },
          { key: "texturePath", value: "res/textures/star1.png" },
          { key: "name", value: "TEST" },
          { key: "geometry", value: "Cube" },
          { key: "raycast", value: true },
          { key: "scale", value: [1, 1, 1] },
          { key: "sum", value: 10 },
          { key: "delay", value: 500 },
          { key: "created", value: false }
        ],
        noselfExec: "true"
      }),
      generatorWall: (id2, x2, y2) => ({
        id: id2,
        x: x2,
        y: y2,
        title: "Generator Wall",
        category: "action",
        inputs: [
          { name: "exec", type: "action" },
          { name: "material", type: "string" },
          { name: "pos", type: "object" },
          { name: "rot", type: "object" },
          { name: "texturePath", type: "string" },
          { name: "name", type: "string" },
          { name: "size", type: "string" },
          { name: "raycast", type: "boolean" },
          { name: "scale", type: "object" },
          { name: "spacing", type: "number" },
          { name: "delay", type: "number" }
        ],
        outputs: [
          { name: "execOut", type: "action" }
        ],
        fields: [
          { key: "material", value: "standard" },
          { key: "pos", value: "{x:0, y:0, z:-20}" },
          { key: "rot", value: "{x:0, y:0, z:0}" },
          { key: "texturePath", value: "res/textures/star1.png" },
          { key: "name", value: "TEST" },
          { key: "size", value: "10x3" },
          { key: "raycast", value: true },
          { key: "scale", value: [1, 1, 1] },
          { key: "spacing", value: 10 },
          { key: "delay", value: 500 },
          { key: "created", value: false }
        ],
        noselfExec: "true"
      }),
      generatorPyramid: (id2, x2, y2) => ({
        id: id2,
        x: x2,
        y: y2,
        title: "Generator Pyramid",
        category: "action",
        inputs: [
          { name: "exec", type: "action" },
          { name: "material", type: "string" },
          { name: "pos", type: "object" },
          { name: "rot", type: "object" },
          { name: "texturePath", type: "string" },
          { name: "name", type: "string" },
          { name: "levels", type: "number" },
          { name: "raycast", type: "boolean" },
          { name: "scale", type: "object" },
          { name: "spacing", type: "number" },
          { name: "delay", type: "number" }
        ],
        outputs: [
          { name: "execOut", type: "action" },
          { name: "complete", type: "action" },
          { name: "objectNames", type: "object" }
        ],
        fields: [
          { key: "material", value: "standard" },
          { key: "pos", value: "{x:0, y:0, z:-20}" },
          { key: "rot", value: "{x:0, y:0, z:0}" },
          { key: "texturePath", value: "res/textures/star1.png" },
          { key: "name", value: "TEST" },
          { key: "levels", value: "5" },
          { key: "raycast", value: true },
          { key: "scale", value: [1, 1, 1] },
          { key: "spacing", value: 10 },
          { key: "delay", value: 500 },
          { key: "created", value: false }
        ],
        noselfExec: "true"
      }),
      addObj: (id2, x2, y2) => ({
        id: id2,
        x: x2,
        y: y2,
        title: "Add OBJ",
        category: "action",
        inputs: [
          { name: "exec", type: "action" },
          { name: "path", type: "string" },
          { name: "material", type: "string" },
          { name: "pos", type: "object" },
          { name: "rot", type: "object" },
          { name: "texturePath", type: "string" },
          { name: "name", type: "string" },
          { name: "raycast", type: "boolean" },
          { name: "scale", type: "object" },
          { name: "isPhysicsBody", type: "boolean" },
          { name: "isInstancedObj", type: "boolean" }
        ],
        outputs: [
          { name: "execOut", type: "action" },
          { name: "complete", type: "action" },
          { name: "error", type: "action" }
        ],
        fields: [
          { key: "path", value: "res/meshes/blender/cube.obj" },
          { key: "material", value: "standard" },
          { key: "pos", value: "{x:0, y:0, z:-20}" },
          { key: "rot", value: "{x:0, y:0, z:0}" },
          { key: "texturePath", value: "res/textures/star1.png" },
          { key: "name", value: "TEST" },
          { key: "raycast", value: true },
          { key: "scale", value: [1, 1, 1] },
          { key: "isPhysicsBody", type: false },
          { key: "isInstancedObj", type: false },
          { key: "created", value: false }
        ],
        noselfExec: "true"
      }),
      setForceOnHit: (id2, x2, y2) => ({
        id: id2,
        x: x2,
        y: y2,
        title: "Set Force On Hit",
        category: "action",
        inputs: [
          { name: "exec", type: "action" },
          { name: "objectName", type: "string" },
          { name: "rayDirection", type: "object" },
          { name: "strength", type: "number" }
        ],
        outputs: [
          { name: "execOut", type: "action" }
        ],
        fields: [],
        noselfExec: "true"
      }),
      setVideoTexture: (id2, x2, y2) => ({
        id: id2,
        x: x2,
        y: y2,
        title: "Set Video Texture",
        category: "action",
        inputs: [
          { name: "exec", type: "action" },
          { name: "objectName", type: "string" },
          { name: "VideoTextureArg", type: "object" },
          { name: "muteAudio", type: "boolean" }
        ],
        outputs: [
          { name: "execOut", type: "action" }
        ],
        fields: [
          { key: "objectName", value: "standard" },
          { key: "VideoTextureArg", value: "{type: 'video', src: 'res/videos/tunel.mp4'}" },
          { key: "muteAudio", value: true }
        ],
        noselfExec: "true"
      }),
      setCanvasInlineTexture: (id2, x2, y2) => ({
        id: id2,
        x: x2,
        y: y2,
        title: "Set CanvasInline",
        category: "action",
        inputs: [
          { name: "exec", type: "action" },
          { name: "objectName", type: "string" },
          { name: "canvaInlineProgram", type: "function" },
          { name: "specialCanvas2dArg", type: "object" }
        ],
        outputs: [
          { name: "execOut", type: "action" }
        ],
        fields: [
          { key: "objectName", value: "standard" },
          { key: "canvaInlineProgram", value: "function (ctx, canvas) {}" },
          { key: "specialCanvas2dArg", value: "{ hue: 200, glow: 10, text: 'Hello programmer', fontSize: 60, flicker: 0.05, }" }
        ],
        noselfExec: "true"
      }),
      audioReactiveNode: (id2, x2, y2) => ({
        id: id2,
        x: x2,
        y: y2,
        title: "Audio Reactive Node",
        category: "action",
        inputs: [
          { name: "exec", type: "action" },
          { name: "audioSrc", type: "string" },
          { name: "loop", type: "boolean" },
          { name: "thresholdBeat", type: "number" }
        ],
        outputs: [
          { name: "execOut", type: "action" },
          { name: "low", type: "number" },
          { name: "mid", type: "number" },
          { name: "high", type: "number" },
          { name: "energy", type: "number" },
          { name: "beat", type: "boolean" }
        ],
        fields: [
          { key: "audioSrc", value: "audionautix-black-fly.mp3" },
          { key: "loop", value: true },
          { key: "thresholdBeat", value: 0.7 },
          { key: "created", value: false }
        ],
        noselfExec: "true"
      }),
      oscillator: (id2, x2, y2) => ({
        id: id2,
        x: x2,
        y: y2,
        title: "Oscillator",
        category: "action",
        inputs: [
          { name: "exec", type: "action" },
          { name: "min", type: "number" },
          { name: "max", type: "number" },
          { name: "step", type: "number" },
          { name: "regime", type: "string" },
          { name: "resist", type: "number" },
          { name: "resistMode", type: "number" }
        ],
        outputs: [
          { name: "execOut", type: "action" },
          { name: "value", type: "number" }
        ],
        fields: [
          { key: "min", value: 0 },
          { key: "max", value: 10 },
          { key: "step", value: 0.2 },
          { key: "regime", value: "pingpong" },
          { key: "resist", value: 0.02 },
          { key: "resistMode", value: "linear" }
        ],
        noselfExec: "true"
      }),
      curveTimeline: (id2, x2, y2) => ({
        id: id2,
        x: x2,
        y: y2,
        title: "Curve",
        category: "action",
        inputs: [
          { name: "exec", type: "action" },
          { name: "name", type: "string" },
          { name: "delta", type: "number" }
        ],
        outputs: [
          { name: "execOut", type: "action" },
          { name: "value", type: "number" }
        ],
        fields: [
          { key: "name", value: "Curve1" }
        ],
        curve: {},
        noselfExec: "true"
      }),
      eventCustom: (id2, x2, y2) => ({
        id: id2,
        x: x2,
        y: y2,
        title: "Custom Event",
        category: "event",
        fields: [
          { key: "name", value: "myEvent" }
        ],
        inputs: [],
        outputs: [
          { name: "exec", type: "action" },
          { name: "detail", type: "object" }
        ],
        _listenerAttached: false,
        _returnCache: null,
        noselfExec: "true"
      }),
      dispatchEvent: (id2, x2, y2) => ({
        id: id2,
        x: x2,
        y: y2,
        title: "Dispatch Event",
        category: "event",
        inputs: [
          { name: "exec", type: "action" },
          { name: "eventName", type: "string", default: "myEvent" },
          { name: "detail", type: "object", default: {} }
        ],
        outputs: [
          { name: "execOut", type: "action" }
        ],
        noselfExec: "true"
      }),
      rayHitEvent: (id2, x2, y2) => ({
        id: id2,
        x: x2,
        y: y2,
        title: "On Ray Hit",
        category: "event",
        inputs: [],
        outputs: [
          { name: "exec", type: "action" },
          { name: "hitObjectName", type: "string" },
          { name: "screenCoords", type: "object" },
          { name: "rayOrigin", type: "object" },
          { name: "rayDirection", type: "object" },
          { name: "hitObject", type: "object" },
          { name: "hitNormal", type: "object" },
          { name: "hitDistance", type: "object" },
          { name: "eventName", type: "object" },
          { name: "button", type: "number" },
          { name: "timestamp", type: "number" }
        ],
        noselfExec: "true",
        _listenerAttached: false
      }),
      onDraw: (id2, x2, y2) => ({
        id: id2,
        x: x2,
        y: y2,
        title: "On Draw",
        category: "event",
        inputs: [],
        outputs: [
          { name: "exec", type: "action" },
          { name: "delta", type: "number" },
          { name: "skip", type: "number" }
        ],
        fields: [
          { key: "skip", value: 5 }
        ],
        noselfExec: "true",
        _listenerAttached: false
      }),
      onKey: (id2, x2, y2) => ({
        id: id2,
        x: x2,
        y: y2,
        title: "On Key",
        category: "event",
        inputs: [],
        outputs: [
          { name: "keyDown", type: "action" },
          { name: "keyUp", type: "action" },
          { name: "isHeld", type: "boolean" },
          { name: "anyKeyDown", type: "action" },
          { name: "keyCode", type: "string" },
          { name: "shift", type: "action" },
          { name: "ctrl", type: "action" },
          { name: "alt", type: "action" }
        ],
        fields: [
          { key: "key", value: "W" }
        ],
        noselfExec: "true",
        _listenerAttached: false
      }),
      function: (id2, x2, y2) => ({
        id: id2,
        title: "Function",
        x: x2,
        y: y2,
        category: "action",
        inputs: [{ name: "exec", type: "action" }],
        outputs: [{ name: "execOut", type: "action" }]
      }),
      if: (id2, x2, y2) => ({
        id: id2,
        title: "if",
        x: x2,
        y: y2,
        category: "logic",
        inputs: [
          { name: "exec", type: "action" },
          { name: "condition", type: "boolean" }
        ],
        outputs: [
          { name: "true", type: "action" },
          { name: "false", type: "action" }
        ],
        fields: [
          { key: "condition", value: true }
        ],
        noselfExec: "true"
      }),
      genrand: (id2, x2, y2) => ({
        id: id2,
        title: "GenRandInt",
        x: x2,
        y: y2,
        category: "value",
        inputs: [],
        outputs: [{ name: "result", type: "value" }],
        fields: [
          { key: "min", value: "0" },
          { key: "max", value: "10" }
        ]
      }),
      print: (id2, x2, y2) => ({
        id: id2,
        title: "Print",
        x: x2,
        y: y2,
        category: "actionprint",
        inputs: [
          { name: "exec", type: "action" },
          { name: "value", type: "any" }
        ],
        outputs: [{ name: "execOut", type: "action" }],
        fields: [{ key: "label", value: "Result" }],
        builtIn: true,
        noselfExec: "true"
      }),
      timeout: (id2, x2, y2) => ({
        id: id2,
        title: "SetTimeout",
        x: x2,
        y: y2,
        category: "timer",
        inputs: [
          { name: "exec", type: "action" },
          { name: "delay", type: "value" }
        ],
        outputs: [{ name: "execOut", type: "action" }],
        fields: [{ key: "delay", value: "1000" }],
        builtIn: true
      }),
      // string operation
      startsWith: (id2, x2, y2) => ({
        id: id2,
        title: "Starts With [string]",
        x: x2,
        y: y2,
        category: "stringOperation",
        inputs: [
          { name: "input", type: "string" },
          { name: "prefix", type: "string" }
        ],
        outputs: [{ name: "return", type: "boolean" }]
      }),
      endsWith: (id2, x2, y2) => ({
        id: id2,
        title: "Ends With [string]",
        x: x2,
        y: y2,
        category: "stringOperation",
        inputs: [
          { name: "input", type: "string" },
          { name: "suffix", type: "string" }
        ],
        outputs: [{ name: "return", type: "boolean" }]
      }),
      includes: (id2, x2, y2) => ({
        id: id2,
        title: "Includes [string]",
        x: x2,
        y: y2,
        category: "stringOperation",
        inputs: [
          { name: "input", type: "string" },
          { name: "search", type: "string" }
        ],
        outputs: [{ name: "return", type: "boolean" }]
      }),
      toUpperCase: (id2, x2, y2) => ({
        id: id2,
        title: "To Upper Case [string]",
        x: x2,
        y: y2,
        category: "stringOperation",
        inputs: [{ name: "input", type: "string" }],
        outputs: [{ name: "return", type: "string" }]
      }),
      toLowerCase: (id2, x2, y2) => ({
        id: id2,
        title: "To Lower Case [string]",
        x: x2,
        y: y2,
        category: "stringOperation",
        inputs: [{ name: "input", type: "string" }],
        outputs: [{ name: "return", type: "string" }]
      }),
      trim: (id2, x2, y2) => ({
        id: id2,
        title: "Trim [string]",
        x: x2,
        y: y2,
        category: "stringOperation",
        inputs: [{ name: "input", type: "string" }],
        outputs: [{ name: "return", type: "string" }]
      }),
      length: (id2, x2, y2) => ({
        id: id2,
        title: "String Length",
        x: x2,
        y: y2,
        category: "stringOperation",
        inputs: [{ name: "input", type: "string" }],
        outputs: [{ name: "return", type: "number" }]
      }),
      substring: (id2, x2, y2) => ({
        id: id2,
        title: "Substring [string]",
        x: x2,
        y: y2,
        category: "stringOperation",
        inputs: [
          { name: "input", type: "string" },
          { name: "start", type: "number" },
          { name: "end", type: "number" }
        ],
        outputs: [{ name: "return", type: "string" }]
      }),
      replace: (id2, x2, y2) => ({
        id: id2,
        title: "Replace [string]",
        x: x2,
        y: y2,
        category: "stringOperation",
        inputs: [
          { name: "input", type: "string" },
          { name: "search", type: "string" },
          { name: "replace", type: "string" }
        ],
        outputs: [{ name: "return", type: "string" }]
      }),
      split: (id2, x2, y2) => ({
        id: id2,
        title: "Split [string]",
        x: x2,
        y: y2,
        category: "stringOperation",
        inputs: [
          { name: "input", type: "string" },
          { name: "separator", type: "string" }
        ],
        outputs: [{ name: "return", type: "array" }]
      }),
      concat: (id2, x2, y2) => ({
        id: id2,
        title: "Concat [string]",
        x: x2,
        y: y2,
        category: "stringOperation",
        inputs: [
          { name: "a", type: "string" },
          { name: "b", type: "string" }
        ],
        outputs: [{ name: "return", type: "string" }]
      }),
      isEmpty: (id2, x2, y2) => ({
        id: id2,
        title: "Is Empty [string]",
        x: x2,
        y: y2,
        category: "stringOperation",
        inputs: [{ name: "input", type: "string" }],
        outputs: [{ name: "return", type: "boolean" }]
      }),
      // Math
      add: (id2, x2, y2) => ({
        id: id2,
        title: "Add",
        x: x2,
        y: y2,
        category: "math",
        inputs: [
          { name: "a", type: "value" },
          { name: "b", type: "value" }
        ],
        outputs: [{ name: "result", type: "value" }]
      }),
      sub: (id2, x2, y2) => ({
        id: id2,
        title: "Sub",
        x: x2,
        y: y2,
        category: "math",
        inputs: [
          { name: "a", type: "value" },
          { name: "b", type: "value" }
        ],
        outputs: [{ name: "result", type: "value" }]
      }),
      mul: (id2, x2, y2) => ({
        id: id2,
        title: "Mul",
        x: x2,
        y: y2,
        category: "math",
        inputs: [
          { name: "a", type: "value" },
          { name: "b", type: "value" }
        ],
        outputs: [{ name: "result", type: "value" }]
      }),
      div: (id2, x2, y2) => ({
        id: id2,
        title: "Div",
        x: x2,
        y: y2,
        category: "math",
        inputs: [
          { name: "a", type: "value" },
          { name: "b", type: "value" }
        ],
        outputs: [{ name: "result", type: "value" }]
      }),
      sin: (id2, x2, y2) => ({
        id: id2,
        title: "Sin",
        x: x2,
        y: y2,
        category: "math",
        inputs: [{ name: "a", type: "value" }],
        outputs: [{ name: "result", type: "value" }]
      }),
      cos: (id2, x2, y2) => ({
        id: id2,
        title: "Cos",
        x: x2,
        y: y2,
        category: "math",
        inputs: [{ name: "a", type: "value" }],
        outputs: [{ name: "result", type: "value" }]
      }),
      pi: (id2, x2, y2) => ({
        id: id2,
        title: "Pi",
        x: x2,
        y: y2,
        category: "math",
        inputs: [],
        outputs: [{ name: "result", type: "value" }]
      }),
      // comparation nodes
      greater: (id2, x2, y2) => ({
        id: id2,
        title: "A > B",
        x: x2,
        y: y2,
        category: "compare",
        inputs: [
          { name: "A", type: "number" },
          { name: "B", type: "number" }
        ],
        outputs: [{ name: "result", type: "boolean" }]
      }),
      less: (id2, x2, y2) => ({
        id: id2,
        title: "A < B",
        x: x2,
        y: y2,
        category: "compare",
        inputs: [
          { name: "A", type: "number" },
          { name: "B", type: "number" }
        ],
        outputs: [{ name: "result", type: "boolean" }]
      }),
      equal: (id2, x2, y2) => ({
        id: id2,
        title: "A == B",
        x: x2,
        y: y2,
        category: "compare",
        inputs: [
          { name: "A", type: "any" },
          { name: "B", type: "any" }
        ],
        outputs: [{ name: "result", type: "boolean" }]
      }),
      notequal: (id2, x2, y2) => ({
        id: id2,
        title: "A != B",
        x: x2,
        y: y2,
        category: "compare",
        inputs: [
          { name: "A", type: "any" },
          { name: "B", type: "any" }
        ],
        outputs: [{ name: "result", type: "boolean" }]
      }),
      greaterEqual: (id2, x2, y2) => ({
        id: id2,
        title: "A >= B",
        x: x2,
        y: y2,
        category: "compare",
        inputs: [
          { name: "A", type: "number" },
          { name: "B", type: "number" }
        ],
        outputs: [{ name: "result", type: "boolean" }]
      }),
      lessEqual: (id2, x2, y2) => ({
        id: id2,
        title: "A <= B",
        x: x2,
        y: y2,
        category: "compare",
        inputs: [
          { name: "A", type: "number" },
          { name: "B", type: "number" }
        ],
        outputs: [{ name: "result", type: "boolean" }]
      }),
      getNumber: (id2, x2, y2) => ({
        id: id2,
        title: "Get Number",
        x: x2,
        y: y2,
        category: "value",
        outputs: [{ name: "result", type: "number" }],
        fields: [{ key: "var", value: "" }],
        isGetterNode: true
      }),
      getBoolean: (id2, x2, y2) => ({
        id: id2,
        title: "Get Boolean",
        x: x2,
        y: y2,
        category: "value",
        outputs: [{ name: "result", type: "boolean" }],
        fields: [{ key: "var", value: "" }],
        isGetterNode: true
      }),
      getString: (id2, x2, y2) => ({
        id: id2,
        title: "Get String",
        x: x2,
        y: y2,
        category: "value",
        outputs: [{ name: "result", type: "string" }],
        fields: [{ key: "var", value: "" }],
        isGetterNode: true
      }),
      getObject: (id2, x2, y2) => ({
        id: id2,
        title: "Get Object",
        x: x2,
        y: y2,
        category: "value",
        outputs: [{ name: "result", type: "object" }],
        fields: [{ key: "var", value: "" }],
        isGetterNode: true
      }),
      setObject: (id2, x2, y2) => ({
        id: id2,
        title: "Set Object",
        x: x2,
        y: y2,
        category: "action",
        isVariableNode: true,
        inputs: [
          { name: "exec", type: "action" },
          { name: "value", type: "object" }
        ],
        outputs: [{ name: "execOut", type: "action" }],
        fields: [
          { key: "var", value: "" },
          { key: "literal", value: {} }
        ]
      }),
      setNumber: (id2, x2, y2) => ({
        id: id2,
        title: "Set Number",
        x: x2,
        y: y2,
        category: "action",
        isVariableNode: true,
        inputs: [
          { name: "exec", type: "action" },
          { name: "value", type: "number" }
        ],
        outputs: [{ name: "execOut", type: "action" }],
        fields: [
          { key: "var", value: "" },
          { key: "literal", value: 0 }
        ]
      }),
      setBoolean: (id2, x2, y2) => ({
        id: id2,
        title: "Set Boolean",
        x: x2,
        y: y2,
        category: "action",
        isVariableNode: true,
        inputs: [
          { name: "exec", type: "action" },
          { name: "value", type: "boolean" }
        ],
        outputs: [{ name: "execOut", type: "action" }],
        fields: [
          { key: "var", value: "" },
          { key: "literal", value: false }
        ]
      }),
      setString: (id2, x2, y2) => ({
        id: id2,
        title: "Set String",
        x: x2,
        y: y2,
        category: "action",
        isVariableNode: true,
        inputs: [
          { name: "exec", type: "action" },
          { name: "value", type: "string" }
        ],
        outputs: [{ name: "execOut", type: "action" }],
        fields: [
          { key: "var", value: "" },
          { key: "literal", value: "" }
        ]
      }),
      getNumberLiteral: (id2, x2, y2) => ({
        id: id2,
        title: "getNumberLiteral",
        x: x2,
        y: y2,
        category: "action",
        inputs: [{ name: "exec", type: "action" }],
        outputs: [{ name: "execOut", type: "action" }, { name: "value", type: "number" }],
        fields: [{ key: "value", value: 1 }],
        noselfExec: "true"
      }),
      comment: (id2, x2, y2) => ({
        id: id2,
        title: "Comment",
        x: x2,
        y: y2,
        category: "meta",
        inputs: [],
        outputs: [],
        comment: true,
        noExec: true,
        fields: [{ key: "text", value: "Add comment" }]
      }),
      dynamicFunction: (id2, x2, y2, accessObject) => ({
        id: id2,
        title: "functions",
        x: x2,
        y: y2,
        category: "action",
        inputs: [{ name: "exec", type: "action" }],
        outputs: [{ name: "execOut", type: "action" }],
        fields: [{ key: "selectedObject", value: "" }],
        accessObject: accessObject ? accessObject : window.app,
        accessObjectLiteral: "window.app"
      }),
      refFunction: (id2, x2, y2) => ({
        id: id2,
        title: "reffunctions",
        x: x2,
        y: y2,
        category: "action",
        inputs: [
          { name: "exec", type: "action" },
          { name: "reference", type: "any" }
        ],
        outputs: [{ name: "execOut", type: "action" }]
      }),
      getSceneObject: (id2, x2, y2) => ({
        noExec: true,
        id: id2,
        title: "Get Scene Object",
        x: x2,
        y: y2,
        category: "scene",
        inputs: [],
        outputs: [],
        fields: [{ key: "selectedObject", value: "" }],
        builtIn: true,
        accessObject: window.app?.mainRenderBundle,
        accessObjectLiteral: "window.app?.mainRenderBundle",
        exposeProps: ["name", "position", "rotation", "scale"]
      }),
      getShaderGraph: (id2, x2, y2) => ({
        noExec: true,
        id: id2,
        title: "Set Shader Graph",
        x: x2,
        y: y2,
        category: "action",
        inputs: [
          { name: "exec", type: "action" },
          { objectName: "objectName", type: "string" }
        ],
        outputs: [{ name: "execOut", type: "action" }],
        fields: [
          { key: "selectedShader", value: "" },
          { key: "objectName", value: "FLOOR" }
        ],
        builtIn: true,
        accessObject: window.app?.shaderGraph,
        accessObjectLiteral: "window.app?.shaderGraph"
      }),
      getSceneLight: (id2, x2, y2) => ({
        noExec: true,
        id: id2,
        title: "Get Scene Light",
        x: x2,
        y: y2,
        category: "scene",
        inputs: [],
        outputs: [],
        fields: [{ key: "selectedObject", value: "" }],
        builtIn: true,
        accessObject: window.app?.lightContainer,
        accessObjectLiteral: "window.app?.lightContainer",
        exposeProps: [
          "ambientFactor",
          "setPosX",
          "setPosY",
          "setPosZ",
          "setIntensity",
          "setInnerCutoff",
          "setOuterCutoff",
          "setColor",
          "setColorR",
          "setColorB",
          "setColorG",
          "setRange",
          "setAmbientFactor",
          "setShadowBias"
        ]
      }),
      getObjectAnimation: (id2, x2, y2) => ({
        noExec: true,
        id: id2,
        title: "Get Scene Animation",
        x: x2,
        y: y2,
        category: "scene",
        inputs: [],
        outputs: [],
        fields: [{ key: "selectedObject", value: "" }],
        builtIn: true,
        accessObject: window.app?.mainRenderBundle,
        accessObjectLiteral: "window.app?.mainRenderBundle",
        exposeProps: [
          "name",
          "glb.glbJsonData.animations",
          "glb.animationIndex",
          "playAnimationByName",
          "playAnimationByIndex"
        ]
      }),
      getPosition: (id2, x2, y2) => ({
        id: id2,
        x: x2,
        y: y2,
        title: "Get Position",
        category: "scene",
        inputs: [{ name: "position", semantic: "position" }],
        outputs: [
          { name: "x", semantic: "number" },
          { name: "y", semantic: "number" },
          { name: "z", semantic: "number" }
        ],
        noExec: true
      }),
      setPosition: (id2, x2, y2) => ({
        id: id2,
        x: x2,
        y: y2,
        title: "Set Position",
        category: "scene",
        inputs: [
          { name: "exec", type: "action" },
          { name: "position", semantic: "position" },
          { name: "x", semantic: "number" },
          { name: "y", semantic: "number" },
          { name: "z", semantic: "number" }
        ],
        outputs: [{ name: "execOut", type: "action" }]
      }),
      setSpeed: (id2, x2, y2) => ({
        id: id2,
        x: x2,
        y: y2,
        title: "Set Speed",
        category: "scene",
        inputs: [
          { name: "exec", type: "action" },
          { name: "position", semantic: "position" },
          { name: "thrust", semantic: "number" }
        ],
        outputs: [{ name: "execOut", type: "action" }]
      }),
      setTexture: (id2, x2, y2) => ({
        id: id2,
        x: x2,
        y: y2,
        title: "Set Texture",
        category: "scene",
        inputs: [
          { name: "exec", type: "action" },
          { name: "texturePath", semantic: "texturePath" },
          { name: "sceneObjectName", semantic: "string" }
        ],
        outputs: [{ name: "execOut", type: "action" }]
      }),
      setBlend: (id2, x2, y2) => ({
        id: id2,
        x: x2,
        y: y2,
        title: "Set Blend",
        category: "scene",
        inputs: [
          { name: "exec", type: "action" },
          { name: "alpha", type: "number" },
          { name: "sceneObjectName", semantic: "string" }
        ],
        fields: [
          { key: "sceneObjectName", value: "FLOOR" },
          { key: "alpha", value: 0.5 }
        ],
        outputs: [{ name: "execOut", type: "action" }]
      }),
      setProductionMode: (id2, x2, y2) => ({
        id: id2,
        x: x2,
        y: y2,
        title: "Set Production Mode",
        category: "scene",
        inputs: [
          { name: "exec", type: "action" },
          { name: "disableLoopWarns", type: "boolean" }
        ],
        outputs: [{ name: "execOut", type: "action" }],
        fields: [
          { key: "disableLoopWarns", value: "true" }
        ]
      }),
      setMaterial: (id2, x2, y2) => ({
        id: id2,
        x: x2,
        y: y2,
        title: "Set Material",
        category: "scene",
        inputs: [
          { name: "exec", type: "action" },
          { name: "materialType", semantic: "string" },
          { name: "sceneObjectName", semantic: "string" }
        ],
        outputs: [{ name: "execOut", type: "action" }],
        fields: [
          { key: "sceneObjectName", value: "FLOOR" },
          { key: "materialType", value: "standard", placeholder: "standard|power|water" }
        ]
      }),
      setWaterParams: (id2, x2, y2) => ({
        id: id2,
        x: x2,
        y: y2,
        title: "Set Water Material Params",
        category: "scene",
        inputs: [
          { name: "exec", type: "action" },
          { name: "sceneObjectName", semantic: "string" },
          { name: "deepColor(vec3f)", semantic: "object" },
          { name: "waveSpeed", semantic: "number" },
          { name: "shallowColor(vec3f)", semantic: "object" },
          { name: "waveScale", semantic: "number" },
          { name: "waveHeight", semantic: "number" },
          { name: "fresnelPower", semantic: "number" },
          { name: "specularPower", semantic: "number" }
        ],
        outputs: [{ name: "execOut", type: "action" }],
        fields: [
          { key: "sceneObjectName", value: "FLOOR" },
          { key: "deepColor(vec3f)", value: "[0.0, 0.2, 0.4]" },
          { key: "waveSpeed", value: "0.5" },
          { key: "shallowColor(vec3f)", value: "[0.0, 0.5, 0.7]" },
          { key: "waveScale", value: "4.0" },
          { key: "waveHeight", value: "0.15" },
          { key: "fresnelPower", value: "3.0" },
          { key: "specularPower", value: "128" }
        ]
      }),
      setVertexWave: (id2, x2, y2) => ({
        id: id2,
        x: x2,
        y: y2,
        title: "Set Vertex Wave",
        category: "scene",
        inputs: [
          { name: "exec", type: "action" },
          { name: "sceneObjectName", semantic: "string" },
          { name: "intensity", type: "number" },
          { name: "enableWave", type: "boolean" },
          { name: "Wave Speed", type: "number" },
          { name: "Wave Amplitude", type: "number" },
          { name: "Wave Frequency", type: "number" }
        ],
        outputs: [{ name: "execOut", type: "action" }],
        fields: [
          { key: "sceneObjectName", value: "FLOOR" },
          { key: "enableWave", value: false },
          { key: "Wave Speed", value: 3 },
          { key: "Wave Amplitude", value: 0.2 },
          { key: "Wave Frequency", value: 1.5 }
        ]
      }),
      setVertexWind: (id2, x2, y2) => ({
        id: id2,
        x: x2,
        y: y2,
        title: "Set Vertex Wind",
        category: "scene",
        inputs: [
          { name: "exec", type: "action" },
          { name: "sceneObjectName", semantic: "string" },
          { name: "enableWind", type: "boolean" },
          { name: "Wind Speed", type: "number" },
          { name: "Wind Strength", type: "number" },
          { name: "Wind HeightInfluence", type: "number" },
          { name: "Wind Turbulence", type: "number" }
        ],
        outputs: [{ name: "execOut", type: "action" }],
        fields: [
          { key: "sceneObjectName", value: "FLOOR" },
          { key: "enableWind", value: false },
          { key: "Wind Speed", value: 2 },
          { key: "Wind Strength", value: 0.4 },
          { key: "Wind HeightInfluence", value: 2 },
          { key: "Wind Turbulence", value: 0.4 }
        ]
      }),
      setVertexPulse: (id2, x2, y2) => ({
        id: id2,
        x: x2,
        y: y2,
        title: "Set Vertex Pulse",
        category: "scene",
        inputs: [
          { name: "exec", type: "action" },
          { name: "sceneObjectName", semantic: "string" },
          { name: "enablePulse", type: "boolean" },
          { name: "Pulse speed", type: "number" },
          { name: "Pulse amount", type: "number" },
          { name: "Pulse centerX", type: "number" },
          { name: "Pulse centerY", type: "number" }
        ],
        outputs: [{ name: "execOut", type: "action" }],
        fields: [
          { key: "sceneObjectName", value: "FLOOR" },
          { key: "enablePulse", value: false },
          { key: "Pulse speed", value: 1 },
          { key: "Pulse amount", value: 2 },
          { key: "Pulse centerX", value: 0 },
          { key: "Pulse centerY", value: 0 }
        ]
      }),
      setVertexTwist: (id2, x2, y2) => ({
        id: id2,
        x: x2,
        y: y2,
        title: "Set Vertex Twist",
        category: "scene",
        inputs: [
          { name: "exec", type: "action" },
          { name: "sceneObjectName", semantic: "string" },
          { name: "enableTwist", type: "boolean" },
          { name: "Twist speed", type: "number" },
          { name: "Twist amount", type: "number" }
        ],
        outputs: [{ name: "execOut", type: "action" }],
        fields: [
          { key: "sceneObjectName", value: "FLOOR" },
          { key: "enableTwist", value: false },
          { key: "Twist speed", value: 1 },
          { key: "Twist amount", value: 1 }
        ]
      }),
      setVertexNoise: (id2, x2, y2) => ({
        id: id2,
        x: x2,
        y: y2,
        title: "Set Vertex Noise",
        category: "scene",
        inputs: [
          { name: "exec", type: "action" },
          { name: "sceneObjectName", semantic: "string" },
          { name: "enableNoise", type: "boolean" },
          { name: "Noise Scale", type: "number" },
          { name: "Noise Strength", type: "number" },
          { name: "Noise Speed", type: "number" }
        ],
        outputs: [{ name: "execOut", type: "action" }],
        fields: [
          { key: "sceneObjectName", value: "FLOOR" },
          { key: "enableNoise", value: false },
          { key: "Noise Scale", value: 0.5 },
          { key: "Noise Strength", value: 0.02 },
          { key: "Noise Speed", value: 0.3 }
        ]
      }),
      setVertexOcean: (id2, x2, y2) => ({
        id: id2,
        x: x2,
        y: y2,
        title: "Set Vertex Ocean",
        category: "scene",
        inputs: [
          { name: "exec", type: "action" },
          { name: "sceneObjectName", semantic: "string" },
          { name: "enableOcean", type: "boolean" },
          { name: "Ocean Scale", type: "number" },
          { name: "Ocean Height", type: "number" },
          { name: "Ocean speed", type: "number" }
        ],
        outputs: [{ name: "execOut", type: "action" }],
        fields: [
          { key: "sceneObjectName", value: "FLOOR" },
          { key: "enableOcean", value: false },
          { key: "Ocean Scale", value: 2 },
          { key: "Ocean Height", value: 0.08 },
          { key: "Ocean speed", value: 1.5 }
        ]
      }),
      getSpeed: (id2, x2, y2) => ({
        id: id2,
        x: x2,
        y: y2,
        title: "Get Speed",
        category: "scene",
        inputs: [
          { name: "exec", type: "action" },
          { name: "position", semantic: "position" }
        ],
        outputs: [
          { name: "execOut", type: "action" },
          { name: "thrust", semantic: "number" }
        ]
      }),
      setRotate: (id2, x2, y2) => ({
        id: id2,
        x: x2,
        y: y2,
        title: "Set Rotate",
        category: "scene",
        inputs: [
          { name: "exec", type: "action" },
          { name: "rotation", semantic: "rotation" },
          { name: "x", semantic: "number" },
          { name: "y", semantic: "number" },
          { name: "z", semantic: "number" }
        ],
        outputs: [{ name: "execOut", type: "action" }]
      }),
      setRotateX: (id2, x2, y2) => ({
        id: id2,
        x: x2,
        y: y2,
        title: "Set RotateX",
        category: "scene",
        inputs: [
          { name: "exec", type: "action" },
          { name: "rotation", semantic: "rotation" },
          { name: "x", semantic: "number" }
        ],
        outputs: [{ name: "execOut", type: "action" }]
      }),
      setRotateY: (id2, x2, y2) => ({
        id: id2,
        x: x2,
        y: y2,
        title: "Set RotateY",
        category: "scene",
        inputs: [
          { name: "exec", type: "action" },
          { name: "rotation", semantic: "rotation" },
          { name: "y", semantic: "number" }
        ],
        outputs: [{ name: "execOut", type: "action" }]
      }),
      setRotateZ: (id2, x2, y2) => ({
        id: id2,
        x: x2,
        y: y2,
        title: "Set RotateZ",
        category: "scene",
        inputs: [
          { name: "exec", type: "action" },
          { name: "rotation", semantic: "rotation" },
          { name: "z", semantic: "number" }
        ],
        outputs: [{ name: "execOut", type: "action" }]
      }),
      setRotation: (id2, x2, y2) => ({
        id: id2,
        x: x2,
        y: y2,
        title: "Set Rotation",
        category: "scene",
        inputs: [
          { name: "exec", type: "action" },
          { name: "rotation", semantic: "rotation" },
          { name: "x", semantic: "number" },
          { name: "y", semantic: "number" },
          { name: "z", semantic: "number" }
        ],
        outputs: [{ name: "execOut", type: "action" }]
      }),
      translateByX: (id2, x2, y2) => ({
        id: id2,
        x: x2,
        y: y2,
        title: "Translate By X",
        category: "scene",
        inputs: [
          { name: "exec", type: "action" },
          { name: "position", semantic: "position" },
          { name: "x", semantic: "number" }
        ],
        outputs: [{ name: "execOut", type: "action" }],
        builtIn: true
      }),
      translateByY: (id2, x2, y2) => ({
        id: id2,
        x: x2,
        y: y2,
        title: "Translate By Y",
        category: "scene",
        inputs: [
          { name: "exec", type: "action" },
          { name: "position", semantic: "position" },
          { name: "y", semantic: "number" }
        ],
        outputs: [{ name: "execOut", type: "action" }]
      }),
      translateByZ: (id2, x2, y2) => ({
        id: id2,
        x: x2,
        y: y2,
        title: "Translate By Z",
        category: "scene",
        inputs: [
          { name: "exec", type: "action" },
          { name: "position", semantic: "position" },
          { name: "z", semantic: "number" }
        ],
        outputs: [{ name: "execOut", type: "action" }]
      }),
      onTargetPositionReach: (id2, x2, y2) => ({
        id: id2,
        x: x2,
        y: y2,
        title: "On Target Position Reach",
        category: "event",
        noExec: true,
        inputs: [{ name: "position", type: "object" }],
        outputs: [{ name: "exec", type: "action" }],
        _listenerAttached: false
      }),
      fetch: (id2, x2, y2) => ({
        id: id2,
        title: "Fetch",
        x: x2,
        y: y2,
        category: "action",
        inputs: [
          { name: "exec", type: "action" },
          { name: "url", type: "string" },
          { name: "method", type: "string", default: "GET" },
          { name: "body", type: "object" },
          { name: "headers", type: "object" }
        ],
        outputs: [
          { name: "execOut", type: "action" },
          { name: "error", type: "action" },
          { name: "response", type: "object" },
          { name: "status", type: "number" }
        ]
      }),
      getSubObject: (id2, x2, y2) => ({
        id: id2,
        title: "Get Sub Object",
        x: x2,
        y: y2,
        category: "value",
        inputs: [
          { name: "exec", type: "action" },
          { name: "object", type: "object" }
        ],
        outputs: [{ name: "execOut", type: "action" }],
        fields: [
          { key: "objectPreview", value: "", readonly: true },
          { key: "path", value: "", placeholder: "SomeProperty" }
        ],
        isDynamicNode: true,
        _needsRebuild: true,
        _pinsBuilt: false
      }),
      forEach: (id2, x2, y2) => ({
        id: id2,
        title: "For Each",
        type: "forEach",
        x: x2,
        y: y2,
        state: { item: null, index: 0 },
        inputs: [
          { name: "exec", type: "action" },
          { name: "array", type: "any" }
          // semantic array pin
        ],
        outputs: [
          { name: "loop", type: "action" },
          { name: "completed", type: "action" },
          { name: "item", type: "any" },
          { name: "index", type: "number" }
        ]
      }),
      getArray: (id2, x2, y2, initialArray = []) => ({
        id: id2,
        type: "getArray",
        title: "Get Array",
        x: x2,
        y: y2,
        fields: [
          { key: "array", value: initialArray.slice() }
        ],
        inputs: [
          { name: "exec", type: "action" },
          { name: "array", type: "any" }
        ],
        outputs: [
          { name: "execOut", type: "action" },
          { name: "array", type: "any" }
        ],
        _returnCache: initialArray.slice()
      })
    };
    let spec = null;
    if (type === "dynamicFunction") {
      let AO = prompt(`
Add global access object and explore all method inside!
(in theory can be any object)
LIST OF INTEREST OBJECT:
 - app            (from main objects yuo can access func like 'activateBloomEffect' of 'activateVolumetricEffect')
 - app.bloomPass  (After activateBloomEffect now you can access bloom params)
 - app.cameras.WASD (Access camera methods)
        `);
      if (AO) {
        console.warn("Adding AO ", eval(AO));
        options.accessObject = eval(AO);
      } else {
        console.warn("Adding global access object failed...");
        options.accessObject = window.app;
        return;
      }
      ;
      if (nodeFactories[type]) spec = nodeFactories[type](id, x, y, options.accessObject);
      spec.accessObjectLiteral = AO;
    } else if (type === "audioMP3" && options?.path && options?.name) {
      if (nodeFactories[type]) spec = nodeFactories[type](id, x, y, options);
    } else {
      if (nodeFactories[type]) spec = nodeFactories[type](id, x, y);
    }
    if (spec && spec.fields && options) {
      for (const f of spec.fields) {
        if (options[f.key] !== void 0) {
          f.value = options[f.key];
        }
      }
    }
    if (spec) {
      const dom2 = this.createNodeDOM(spec);
      this.board.appendChild(dom2);
      this.nodes[id] = spec;
      return id;
    }
    return null;
  }
  setVariable(type2, key, value) {
    if (!this.variables[type2][key]) return;
    this.variables[type2][key].value = value;
    this.notifyVariableChanged(type2, key);
  }
  updateArrayNode(node2, newValue) {
    if (!Array.isArray(newValue)) {
      console.warn("Value must be an array");
      return;
    }
    const field = node2.fields.find((f) => f.key === "array");
    if (field) {
      field.value = newValue;
      node2._returnCache = newValue;
    }
  }
  initEventNodes() {
    for (const nodeId2 in this.nodes) {
      const n2 = this.nodes[nodeId2];
      if (n2.category === "event") {
        this.activateEventNode(nodeId2);
      }
    }
  }
  adaptSubObjectPins(node2, obj2) {
    if (!obj2 || typeof obj2 !== "object") return;
    node2.outputs = node2.outputs.filter((p) => p.type === "action");
    if (obj2 && typeof obj2 === "object") {
      for (const key of Object.keys(obj2)) {
        node2.outputs.push({
          name: key,
          type: this.detectType(obj2[key])
        });
      }
    }
  }
  detectType(val) {
    if (typeof val === "number") return "number";
    if (typeof val === "boolean") return "boolean";
    if (typeof val === "string") return "string";
    if (typeof val === "object") return "object";
    return "any";
  }
  createFieldInput(node2, field) {
    const input = document.createElement("input");
    input.type = "text";
    input.value = field.value ?? "";
    input.placeholder = field.placeholder ?? "";
    input.disabled = field.readonly === true;
    if (field.readonly) {
      input.style.opacity = "0.7";
      input.style.cursor = "default";
    }
    const saveInputValue = () => {
      let val;
      if (field.type === "object") {
        try {
          val = JSON.parse(input.value);
        } catch {
          return;
        }
      } else {
        val = input.value;
      }
      field.value = val;
      if (node2.isGetterNode && field.key === "var") {
        this.notifyVariableChanged("object", val);
      }
      document.dispatchEvent(
        new CustomEvent("fluxcodex.field.change", {
          detail: {
            nodeId: node2.id,
            nodeType: node2.type,
            fieldKey: field.key,
            fieldType: field.type,
            value: field.value
          }
        })
      );
    };
    input.onkeydown = (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        saveInputValue();
      }
    };
    input.onblur = () => saveInputValue();
    if (node2.title === "Get Sub Object" && field.key === "path") {
      input.oninput = () => {
        const link = this.getConnectedSource(node2.id, "object");
        if (!link?.node?.isGetterNode) {
          if (link.node.title == "Get Sub Object") {
            console.log("special sub sub test ", link.node.title);
            let target2 = this.resolvePath(link.node._returnCache, link.pin);
            node2.outputs = node2.outputs.filter((p) => p.type === "action");
            if (target2 && typeof target2 === "object") {
              for (const k in target2) {
                node2.outputs.push({
                  name: k,
                  type: this.detectType(target2[k])
                });
              }
            }
          }
          if (link.node.title == "Get Scene Animation") {
            console.log("special test ", link.node.title);
            const varField2 = link.node.fields?.find((f) => f.key === "selectedObject");
            console.log("special test ", varField2);
            if (link.pin.indexOf(".") != -1) {
              let target2 = this.resolvePath(app.getSceneObjectByName(varField2.value), link.pin);
              console.log("special test target ", target2);
              link.node._subCache = target2;
              node2.outputs = node2.outputs.filter((p) => p.type === "action");
              if (target2 && typeof target2 === "object") {
                for (const k in target2) {
                  node2.outputs.push({
                    name: k,
                    type: this.detectType(target2[k])
                  });
                }
              }
              node2._needsRebuild = false;
              node2._pinsBuilt = true;
              this.updateNodeDOM(node2.id);
            }
            console.log("special test :::: ", link.node.accessObject[varField2.value]);
          }
          return;
        }
        const varField = link.node.fields?.find((f) => f.key === "var");
        const varName = varField?.value;
        const rootObj = this.variables?.object?.[varName];
        const path2 = input.value;
        const target = this.resolvePath(rootObj, path2);
        node2._subCache = {};
        node2._subCache = target;
        node2.outputs = node2.outputs.filter((p) => p.type === "action");
        if (target && typeof target === "object") {
          for (const k in target) {
            node2.outputs.push({
              name: k,
              type: this.detectType(target[k])
            });
          }
        }
        node2._needsRebuild = false;
        node2._pinsBuilt = true;
        this.updateNodeDOM(node2.id);
      };
    }
    return input;
  }
  resolvePath(obj2, path2) {
    if (!obj2 || !path2) return obj2;
    const parts = path2.split(".").filter((p) => p.length);
    let current = obj2;
    for (const part of parts) {
      if (current && typeof current === "object" && part in current) {
        current = current[part];
      } else {
        return void 0;
      }
    }
    return current;
  }
  resolveAccessObject(accessObject, objectName2) {
    if (!accessObject) return null;
    if (Array.isArray(accessObject)) {
      return accessObject.find((o2) => o2.name === objectName2) || null;
    }
    if (typeof accessObject === "object") {
      return accessObject[objectName2] || null;
    }
    return null;
  }
  adaptNodeToAccessMethod(node2, objectName2, methodName) {
    const obj2 = this.accessObject.find((o2) => o2.name === objectName2);
    if (!obj2) return;
    const method = obj2[methodName];
    if (typeof method !== "function") return;
    const args2 = this.getArgNames(method);
    node2.inputs = [{ name: "exec", type: "action" }];
    node2.outputs = [{ name: "execOut", type: "action" }];
    args2.forEach((arg) => node2.inputs.push({ name: arg, type: "value" }));
    if (this.hasReturn(method)) {
      node2.outputs.push({ name: "return", type: "value" });
    }
    node2._access = { objectName: objectName2, methodName };
    this.updateNodeDOM(node2.id);
  }
  activateEventNode(nodeId2) {
    const n2 = this.nodes[nodeId2];
    if (n2.title === "On Target Position Reach") {
      const pos2 = this.getValue(nodeId2, "position");
      if (!pos2) return;
      pos2.onTargetPositionReach = () => {
        this.enqueueOutputs(n2, "exec");
      };
      n2._listenerAttached = true;
    } else if (n2.title == "On Ray Hit") {
      if (n2._listenerAttached) return;
      app.reference.addRaycastsListener();
      const handler = (e) => {
        n2._returnCache = e.detail;
        this.enqueueOutputs(n2, "exec");
      };
      app.canvas.addEventListener("ray.hit.event", handler);
      n2._eventHandler = handler;
      n2._listenerAttached = true;
      return;
    } else if (n2.title == "On Draw") {
      if (n2._listenerAttached) return;
      let skip = n2.fields.find((f) => f.key === "skip")?.value;
      if (typeof n2._frameCounter === "undefined") {
        n2._frameCounter = 0;
      }
      const graph = this;
      app.graphUpdate = function(delta) {
        n2._frameCounter++;
        if (skip > 0 && n2._frameCounter < skip) return;
        n2._frameCounter = 0;
        n2._returnCache = delta;
        graph.enqueueOutputs(n2, "exec");
      };
      n2._listenerAttached = true;
      return;
    } else if (n2.title == "On Key") {
      if (n2._listenerAttached) return;
      const graph = this;
      n2._isHeld = false;
      window.addEventListener("keydown", (e) => {
        n2.lastKey = e.key;
        graph.enqueueOutputs(n2, "anyKeyDown");
        if (e.ctrlKey == true) graph.enqueueOutputs(n2, "ctrl");
        if (e.altKey == true) graph.enqueueOutputs(n2, "alt");
        if (e.shiftKey == true) graph.enqueueOutputs(n2, "shift");
        const keyValue = n2.fields.find((f) => f.key === "key")?.value;
        if (!keyValue) return;
        if (e.key.toLowerCase() === keyValue.toLowerCase()) {
          n2._isHeld = true;
          graph.enqueueOutputs(n2, "keyDown");
        }
      });
      window.addEventListener("keyup", (e) => {
        console.log("ON e.shiftKey !!!!!", e.shiftKey);
        console.log("ON e.altKey !!!!!", e.altKey);
        console.log("ON e.ctrltKey !!!!!", e.ctrlKey);
        const keyValue = n2.fields.find((f) => f.key === "key")?.value;
        if (!keyValue) return;
        if (e.key.toLowerCase() === keyValue.toLowerCase()) {
          n2._isHeld = false;
          graph.enqueueOutputs(n2, "keyUp");
        }
      });
      window.addEventListener("blur", () => {
        if (n2._isHeld) {
          n2._isHeld = false;
          graph.enqueueOutputs(n2, "keyUp");
        }
      });
      n2._listenerAttached = true;
    }
  }
  _executeAttachedMethod(n2) {
    if (n2.attachedMethod) {
      const method = this.methodsManager.methodsContainer.find(
        (m) => m.name === n2.attachedMethod
      );
      if (method) {
        const fn = this.methodsManager.compileFunction(method.code);
        const args2 = this.getArgNames(fn).map(
          (argName) => this.getValue(n2.id, argName)
        );
        let result2;
        try {
          result2 = fn(...args2);
        } catch (err) {
          console.error("User method error:", err);
        }
        if (this.hasReturn(fn)) n2._returnCache = result2;
      }
    }
  }
  getValue(nodeId2, pinName, visited = /* @__PURE__ */ new Set()) {
    const node2 = this.nodes[nodeId2];
    if (visited.has(nodeId2 + ":" + pinName)) {
      return void 0;
    }
    if (!node2 || visited.has(nodeId2)) return void 0;
    visited.add(nodeId2);
    if (node2.title === "Function" && pinName === "reference") {
      if (typeof node2.fn === "undefined") {
        const selected = this.methodsManager.methodsContainer.find((m) => m.name === node2.attachedMethod);
        if (selected) {
          node2.fn = this.methodsManager.compileFunction(selected.code);
        } else {
          console.warn("Node: Function PinName: reference [reference not found at methodsContainer]");
        }
      }
      return node2.fn;
    }
    if (node2.title === "On Draw") {
      if (pinName == "delta") return node2._returnCache;
    }
    if (node2.title === "On Key" && pinName == "isHeld") return node2._isHeld;
    if (node2.title === "On Key" && pinName == "keyCode") return node2.lastKey;
    if (node2.title === "Generator Pyramid" && pinName == "objectNames") return node2._returnCache;
    if (node2.title === "Audio Reactive Node") {
      if (pinName === "low") {
        return node2._returnCache[0];
      } else if (pinName === "mid") {
        return node2._returnCache[1];
      } else if (pinName === "high") {
        return node2._returnCache[2];
      } else if (pinName === "energy") {
        return node2._returnCache[3];
      } else if (pinName === "beat") {
        return node2._returnCache[4];
      }
    }
    if (node2.title === "Oscillator" && pinName == "value") {
      return node2._returnCache;
    }
    if (node2.title === "On Ray Hit") {
      if (pinName === "hitObjectName") {
        return node2._returnCache["hitObject"]["name"];
      } else {
        return node2._returnCache[pinName];
      }
    }
    if (node2.title === "if" && pinName === "condition") {
      let testLink = this.links.find((l) => l.to.node === nodeId2 && l.to.pin === pinName);
      let t;
      try {
        t = this.getValue(testLink.from.node, testLink.from.pin);
      } catch (err) {
        console.log(`IF NODE ${node2.id} have no conditional pin connected - default is false... fix this in FluxCodexVertex graph editor.`);
        return false;
      }
      if (typeof t !== "undefined") {
        return t;
      }
      if (this._execContext !== nodeId2) {
        console.warn("[IF] condition read outside exec ignored");
        return node2.fields?.find((f) => f.key === "condition")?.value;
      }
    }
    if (node2.title === "Custom Event" && pinName === "detail") {
      console.warn("[Custom Event]  getvalue");
      return node2._returnCache;
    }
    if (node2.title === "Dispatch Event" && (pinName === "eventName" || pinName === "detail")) {
      let testLink = this.links.find((l) => l.to.node === nodeId2 && l.to.pin === pinName);
      return this.getValue(testLink.from.node, testLink.from.pin);
    }
    if (node2.isGetterNode) {
      if (node2._returnCache === void 0) {
        this.triggerNode(node2.id);
      }
      let value = node2._returnCache;
      if (typeof value === "string") {
        try {
          if (node2.title == "Get String") {
          } else {
            value = JSON.parse(value);
          }
        } catch (e) {
          console.warn("[getValue][json parse err]:", e);
        }
      }
      return value;
    }
    const link = this.links.find((l) => l.to.node === nodeId2 && l.to.pin === pinName);
    if (link) return this.getValue(link.from.node, link.from.pin, visited);
    const field = node2.fields?.find((f) => f.key === pinName);
    if (field) return field.value;
    const inputPin = node2.inputs?.find((p) => p.name === pinName);
    if (inputPin) return inputPin.default ?? 0;
    if (node2.title === "Get Scene Object" || node2.title === "Get Scene Animation" || node2.title === "Get Scene Light") {
      const objName = this._getSceneSelectedName(node2);
      if (!objName) return void 0;
      const dom2 = this.board.querySelector(`[data-id="${nodeId2}"]`);
      const selects = dom2.querySelectorAll("select");
      let select2 = selects[0];
      select2.innerHTML = ``;
      if (select2) {
        node2.accessObject.forEach((obj3) => {
          const opt = document.createElement("option");
          opt.value = obj3.name;
          opt.textContent = obj3.name;
          select2.appendChild(opt);
        });
      }
      if (node2.fields[0].value) select2.value = node2.fields[0].value;
      const obj2 = (node2.accessObject || []).find((o2) => o2.name === objName);
      if (!obj2) return void 0;
      const out = node2.outputs.find((o2) => o2.name === pinName);
      if (!out) return void 0;
      if (pinName.indexOf(".") != -1) {
        return this.resolvePath(obj2, pinName);
      }
      return obj2[pinName];
    } else if (node2.title === "Get Position") {
      const pos2 = this.getValue(nodeId2, "position");
      if (!pos2) return void 0;
      node2._returnCache = {
        x: pos2.x,
        y: pos2.y,
        z: pos2.z
      };
      return node2._returnCache[pinName];
    } else if (node2.title === "Get Sub Object") {
      let varField = node2.outputs?.find((f) => f.name === "0");
      let isName = node2.outputs?.find((f) => f.name === "name");
      if (varField) {
        if (varField.type == "object") {
          return node2._subCache[parseInt(varField.name)];
        }
      }
      return node2._subCache;
    } else if (node2.type === "forEach") {
      if (pinName === "item") return node2.state?.item;
      if (pinName === "index") return node2.state?.index;
    }
    if (["math", "value", "compare", "stringOperation"].includes(node2.category)) {
      let result2;
      switch (node2.title) {
        case "Starts With [string]":
          console.log("test startsWith");
          result2 = this.getValue(nodeId2, "input").startsWith(this.getValue(nodeId2, "prefix"));
          break;
        case "Ends With [string]":
          result2 = this.getValue(nodeId2, "input")?.endsWith(this.getValue(nodeId2, "suffix"));
          break;
        case "Includes [string]":
          result2 = this.getValue(nodeId2, "input")?.includes(this.getValue(nodeId2, "search"));
          break;
        case "Equals [string]":
          result2 = this.getValue(nodeId2, "a") === this.getValue(nodeId2, "b");
          break;
        case "Not Equals [string]":
          result2 = this.getValue(nodeId2, "a") !== this.getValue(nodeId2, "b");
          break;
        case "To Upper Case [string]":
          result2 = this.getValue(nodeId2, "input")?.toUpperCase();
          break;
        case "To Lower Case [string]":
          result2 = this.getValue(nodeId2, "input")?.toLowerCase();
          break;
        case "Trim [string]":
          result2 = this.getValue(nodeId2, "input")?.trim();
          break;
        case "String Length":
          result2 = this.getValue(nodeId2, "input")?.length ?? 0;
          break;
        case "Substring [string]":
          result2 = this.getValue(nodeId2, "input")?.substring(
            this.getValue(nodeId2, "start"),
            this.getValue(nodeId2, "end")
          );
          break;
        case "Replace [string]":
          result2 = this.getValue(nodeId2, "input")?.replace(
            this.getValue(nodeId2, "search"),
            this.getValue(nodeId2, "replace")
          );
          break;
        case "Split [string]":
          result2 = this.getValue(nodeId2, "input")?.split(this.getValue(nodeId2, "separator"));
          break;
        case "Concat [string]":
          result2 = (this.getValue(nodeId2, "a") ?? "") + (this.getValue(nodeId2, "b") ?? "");
          break;
        case "Is Empty [string]":
          result2 = !this.getValue(nodeId2, "input") || this.getValue(nodeId2, "input").length === 0;
          break;
        case "Add":
          result2 = this.getValue(nodeId2, "a") + this.getValue(nodeId2, "b");
          break;
        case "Sub":
          result2 = this.getValue(nodeId2, "a") - this.getValue(nodeId2, "b");
          break;
        case "Mul":
          result2 = this.getValue(nodeId2, "a") * this.getValue(nodeId2, "b");
          break;
        case "Div":
          result2 = this.getValue(nodeId2, "a") / this.getValue(nodeId2, "b");
          break;
        case "Sin":
          result2 = Math.sin(this.getValue(nodeId2, "a"));
          break;
        case "Cos":
          result2 = Math.cos(this.getValue(nodeId2, "a"));
          break;
        case "Pi":
          result2 = Math.PI;
          break;
        case "A > B":
          result2 = this.getValue(nodeId2, "A") > this.getValue(nodeId2, "B");
          break;
        case "A < B":
          result2 = this.getValue(nodeId2, "A") < this.getValue(nodeId2, "B");
          break;
        case "A == B":
          let varA = this.getValue(nodeId2, "A");
          let varB = this.getValue(nodeId2, "B");
          if (typeof varA == "object") {
            const r2 = this.deepEqual(varA, varB);
            result2 = r2;
          } else {
            result2 = this.getValue(nodeId2, "A") != this.getValue(nodeId2, "B");
          }
          break;
        case "A != B":
          let varAN = this.getValue(nodeId2, "A");
          let varBN = this.getValue(nodeId2, "B");
          if (typeof varAN == "object") {
            const r2 = this.deepEqual(varAN, varBN);
            result2 = !r2;
          } else {
            result2 = this.getValue(nodeId2, "A") != this.getValue(nodeId2, "B");
          }
          break;
        case "A >= B":
          result2 = this.getValue(nodeId2, "A") >= this.getValue(nodeId2, "B");
          break;
        case "A <= B":
          result2 = this.getValue(nodeId2, "A") <= this.getValue(nodeId2, "B");
          break;
        case "GenRandInt":
          const min2 = +node2.fields?.find((f) => f.key === "min")?.value || 0;
          const max2 = +node2.fields?.find((f) => f.key === "max")?.value || 10;
          result2 = Math.floor(Math.random() * (max2 - min2 + 1)) + min2;
          break;
        default:
          result2 = void 0;
      }
      node2._returnCache = result2;
      if (node2.displayEl) node2.displayEl.textContent = typeof result2 === "number" ? result2.toFixed(3) : String(result2);
      return result2;
    }
    if (node2.outputs?.some((o2) => o2.name === pinName)) {
      const dynamicNodes = ["GenRandInt", "RandomFloat"];
      if ((node2._returnCache === void 0 || dynamicNodes.includes(node2.title)) && !node2.noselfExec) {
        this._execContext = nodeId2;
        this.triggerNode(nodeId2);
        this._execContext = null;
      }
      return node2._returnCache;
    }
    return void 0;
  }
  updateValueDisplays() {
    for (const id2 in this.nodes) {
      const node2 = this.nodes[id2];
      if (!node2.displayEl) continue;
      if (node2.title === "Print") {
        const pin = node2.inputs?.[0];
        if (!pin) continue;
        const val = this.getValue(node2.id, pin.name);
        if (val === void 0) {
          node2.displayEl.textContent = "undefined";
        } else if (typeof val === "object") {
          node2.displayEl.textContent = JSON.stringify(val, null, 2);
        } else if (typeof val === "number") {
          node2.displayEl.textContent = val.toFixed(3);
        } else {
          node2.displayEl.textContent = String(val);
        }
      }
    }
  }
  extractArgs(code) {
    const match = code.match(/function\s+[^(]*\(([^)]*)\)/);
    if (!match) return [];
    return match[1].split(",").map((a) => a.trim()).filter(Boolean);
  }
  adaptDynamicFunction(node2, fnName) {
    console.log("adaptDynamicFunction(node, fnName) ");
    const fn = node2.accessObject?.[fnName];
    if (typeof fn !== "function") return;
    node2.inputs = [{ name: "exec", type: "action" }];
    node2.outputs = [{ name: "execOut", type: "action" }];
    const args2 = this.getArgNames(fn);
    args2.forEach((arg) => {
      node2.inputs.push({ name: arg, type: "any" });
    });
    if (this.hasReturn(fn)) {
      node2.outputs.push({ name: "return", type: "value" });
    }
    node2.category = "functions";
    node2.fn = fn;
    node2.fnName = fnName;
    node2.descFunc = fnName;
    this.updateNodeDOM(node2.id);
  }
  invalidateVariableGetters(type2, varName) {
    for (const id2 in this.nodes) {
      const n2 = this.nodes[id2];
      if (n2.category === "value" && n2.fields?.some((f) => f.key === "var" && f.value === varName) && n2.title === `Get ${type2[0].toUpperCase() + type2.slice(1)}`) {
        delete n2._returnCache;
      }
    }
  }
  deepEqual(a, b) {
    if (a === b) return true;
    if (typeof a !== "object" || typeof b !== "object" || a == null || b == null)
      return false;
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return false;
    for (const key of keysA) {
      if (!keysB.includes(key)) return false;
      if (!this.deepEqual(a[key], b[key])) return false;
    }
    return true;
  }
  triggerNode(nodeId) {
    const n = this.nodes[nodeId];
    if (!n) return;
    this._execContext = nodeId;
    const highlight = document.querySelector(`.node[data-id="${nodeId}"] .header`);
    if (highlight) {
      highlight.style.filter = "brightness(1.5)";
      setTimeout(() => highlight.style.filter = "none", 200);
    }
    if (n.title === "Get Sub Object") {
      const obj2 = this.getValue(n.id, "object");
      let path2 = n.fields.find((f) => f.key === "path")?.value;
      let target = this.resolvePath(obj2, path2);
      if (target === void 0) {
        path2 = path2.replace("value.", "");
        target = this.resolvePath(obj2, path2);
      }
      console.warn("SET CACHE target is ", target);
      n._subCache = target;
      n._returnCache = target;
      n._needsRebuild = false;
      n._pinsBuilt = true;
      this.enqueueOutputs(n, "execOut");
      return;
    } else if (n.type === "forEach") {
      let arr;
      const link = this.links.find((l) => l.to.node === n.id);
      if (link) arr = this.getValue(link.from.node, link.from.pin);
      if (arr === void 0) {
        const inputPin = n.inputs?.find((p) => p.name === "array");
        arr = inputPin?.default;
      }
      if (typeof arr === "string") {
        try {
          arr = JSON.parse(arr);
        } catch (e) {
          console.warn("Failed to parse array string", arr);
          arr = [];
        }
      }
      if (!Array.isArray(arr)) return;
      arr.forEach((item, index) => {
        n.state = { item, index };
        this.links.filter((l) => l.type === "action" && l.from.node === n.id && l.from.pin === "loop").forEach((l) => {
          this.triggerNode(l.to.node);
        });
      });
      this.links.filter((l) => l.type === "action" && l.from.node === n.id && l.from.pin === "completed").forEach((l) => {
        this.triggerNode(l.to.node);
      });
    } else if (n.title === "Get Array") {
      let arr;
      const link = this.links.find(
        (l) => l.to.node === n.id && (l.to.pin === "array" || l.to.pin === "result" || l.to.pin === "value")
      );
      if (link) {
        const fromNode = this.nodes[link.from.node];
        if (fromNode._returnCache === void 0 && fromNode._subCache === void 0) {
        }
        if (fromNode._returnCache) arr = fromNode._returnCache;
        if (fromNode._subCache) arr = fromNode._subCache;
      } else {
        arr = n.inputs?.find((p) => p.name === "array")?.default ?? [];
      }
      n._returnCache = Array.isArray(arr) ? arr : arr ? arr[link.from.pin] : this.getValue(link.from.node, link.from.pin);
      this.enqueueOutputs(n, "execOut");
      return;
    } else if (n.title === "reffunctions") {
      const fn = n._fnRef;
      if (typeof fn !== "function") {
        console.warn("[reffunctions] No function reference");
        this.enqueueOutputs(n, "execOut");
        return;
      }
      const args2 = n.inputs.filter((p) => p.type !== "action" && p.name !== "reference").map((p) => this.getValue(n.id, p.name));
      const result2 = fn(...args2);
      if (this.hasReturn(fn)) {
        n._returnCache = result2;
      }
      this.enqueueOutputs(n, "execOut");
      return;
    } else if (n.title === "Custom Event") {
      console.log("********************************");
      const eventName = n.fields?.find((f) => f.key === "name")?.value;
      if (!eventName) return;
      const handler = (e) => {
        console.log("**TRUE** HANDLER**");
        n._returnCache = e.detail;
        this.enqueueOutputs(n, "exec");
      };
      console.log("**eventName**", eventName);
      window.removeEventListener(eventName, handler);
      window.addEventListener(eventName, handler);
      n._eventHandler = handler;
      n._listenerAttached = true;
      return;
    } else if (n.title === "Dispatch Event") {
      const name2 = this.getValue(nodeId, "eventName");
      if (!name2) {
        console.warn("[Dispatch] missing eventName");
        this.enqueueOutputs(n, "execOut");
        return;
      }
      const detail = this.getValue(nodeId, "detail");
      console.log("*************window.dispatchEvent****************", name2);
      window.dispatchEvent(
        new CustomEvent(name2, {
          detail: detail ?? {}
        })
      );
      this.enqueueOutputs(n, "execOut");
      return;
    } else if (n.title === "On Ray Hit") {
      console.log("On Ray Hit =NOTHING NOW", n._listenerAttached);
    }
    if (n.isGetterNode) {
      const varField = n.fields?.find((f) => f.key === "var");
      if (varField && varField.value) {
        const type2 = n.title.replace("Get ", "").toLowerCase();
        const value = this.getVariable(type2, varField.value);
        n._returnCache = value;
        if (n.displayEl) {
          if (type2 === "object") {
            n.displayEl.textContent = value !== void 0 ? JSON.stringify(value) : "{}";
          } else if (typeof value === "number") {
            n.displayEl.textContent = value.toFixed(3);
          } else {
            n.displayEl.textContent = String(value);
          }
        }
      }
      n.finished = true;
      return;
    }
    if (n.title === "On Target Position Reach") {
      const pos2 = this.getValue(nodeId, "position");
      console.info("On Target Position Reach ", pos2);
      if (!pos2) return;
      pos2.onTargetPositionReach = () => {
        this.triggerNode(n);
        this.enqueueOutputs(n, "exec");
      };
      n._listenerAttached = true;
      return;
    }
    if (n.category === "functions") {
      n.accessObject = eval(n.accessObjectLiteral);
      if (n.fn === void 0) {
        n.fn = n.accessObject[n.fnName];
      }
      const args = n.inputs.filter((p) => p.type !== "action").map((p) => this.getValue(n.id, p.name));
      const result = n.fn(...args);
      if (this.hasReturn(n.fn)) {
        n._returnCache = result;
      }
      this.enqueueOutputs(n, "execOut");
      return;
    }
    if (n.category === "event" && typeof n.noselfExec === "undefined") {
      console.info(`%c<EMPTY EXEC>: ${n.title}`, LOG_FUNNY_ARCADE2);
      this.enqueueOutputs(n, "exec");
      return;
    }
    if (n.category === "event" && typeof n.noselfExec != "undefined") {
      console.log("<PREVENT SELF EXEC>");
      return;
    }
    if (n.isVariableNode) {
      const type2 = n.title.replace("Set ", "").toLowerCase();
      const varField = n.fields?.find((f) => f.key === "var");
      if (varField && varField.value) {
        let value = this.getValue(nodeId, "value");
        if (n.title == "Set Object") {
          if (value == 0) {
            let varliteral = n.fields?.find((f) => f.key === "literal");
            this.variables[type2][varField.value] = JSON.parse(varliteral.value);
          }
        } else {
          if (value == 0) {
            let varliteral = n.fields?.find((f) => f.key === "literal");
            this.variables[type2][varField.value] = JSON.parse(varliteral.value);
            value = JSON.parse(varliteral.value);
          } else {
            console.log("set object ", value);
            this.variables[type2][varField.value] = { value };
          }
        }
        this.notifyVariableChanged(type2, varField.value);
        for (const nodeId2 in this.nodes) {
          const node2 = this.nodes[nodeId2];
          if (node2.isGetterNode) {
            const vf2 = node2.fields?.find((f) => f.key === "var");
            if (vf2 && vf2.value === varField.value && node2.displayEl) {
              if (type2 === "object") {
                node2.displayEl.textContent = JSON.stringify(value);
              } else {
                node2.displayEl.textContent = typeof value === "number" ? value.toFixed(3) : String(value);
              }
              node2._returnCache = value;
            }
          }
        }
      }
      n.finished = true;
      this.enqueueOutputs(n, "execOut");
      return;
    }
    if (n.title === "Fetch") {
      const url = this.getValue(nodeId, "url");
      if (!url) {
        console.warn("[Fetch] URL missing");
        this.enqueueOutputs(n, "error");
        return;
      }
      const method = this.getValue(nodeId, "method") || "GET";
      const body2 = this.getValue(nodeId, "body");
      const headers = this.getValue(nodeId, "headers") || {};
      const options2 = { method, headers };
      if (body2 && method !== "GET") {
        options2.body = typeof body2 === "string" ? body2 : JSON.stringify(body2);
        if (!headers["Content-Type"]) {
          headers["Content-Type"] = "application/json";
        }
      }
      fetch(url, options2).then(async (res) => {
        n._returnCache = {
          response: await res.json().catch(() => null),
          status: res.status
        };
        this.enqueueOutputs(n, "execOut");
      }).catch((err) => {
        console.error("[Fetch]", err);
        this.enqueueOutputs(n, "error");
      });
      return;
    }
    if (["action", "actionprint", "timer"].includes(n.category)) {
      if (n.attachedMethod) this._executeAttachedMethod(n);
      if (n.title === "Print") {
        const label = n.fields?.find((f) => f.key === "label")?.value || "Print:";
        let val;
        const link = this.getConnectedSource(nodeId, "value");
        if (link) {
          const fromNode = link.node;
          const fromPin = link.pin;
          if (fromNode._subCache && typeof fromNode._subCache === "object" && fromPin in fromNode._subCache) {
            val = fromNode._subCache[fromPin];
          } else {
            val = this.getValue(fromNode.id, fromPin);
          }
        } else {
          val = this.getValue(nodeId, "value");
        }
        if (n.displayEl) {
          if (typeof val === "object") {
            n.displayEl.textContent = JSON.stringify(val);
          } else if (typeof val === "number") {
            n.displayEl.textContent = val.toFixed(3);
          } else {
            n.displayEl.textContent = String(val);
          }
        }
        console.info(`%c[Print] ${label}` + val, LOG_FUNNY_ARCADE2);
      } else if (n.title === "SetTimeout") {
        const delay2 = +n.fields?.find((f) => f.key === "delay")?.value || 1e3;
        setTimeout(() => this.enqueueOutputs(n, "execOut"), delay2);
        return;
      } else if (n.title === "Play MP3") {
        const key = this.getValue(nodeId, "key");
        const src = this.getValue(nodeId, "src");
        const clones = Number(this.getValue(nodeId, "clones")) || 1;
        if (!key || !src) {
          console.info(`%c[Play MP3] Missing key or src...`, LOG_FUNNY_ARCADE2);
          this.enqueueOutputs(n, "execOut");
          return;
        }
        const createdField2 = n.fields.find((f) => f.key === "created");
        if (!createdField2.value) {
          createdField2.disabled = true;
          app.matrixSounds.createAudio(key, src, clones);
          createdField2.value = true;
        }
        app.matrixSounds.play(key);
        this.enqueueOutputs(n, "execOut");
        return;
      } else if (n.title === "Generator") {
        const texturePath = this.getValue(nodeId, "texturePath");
        const mat = this.getValue(nodeId, "material");
        let pos = this.getValue(nodeId, "pos");
        const geo = this.getValue(nodeId, "geometry");
        let rot = this.getValue(nodeId, "rot");
        let delay = this.getValue(nodeId, "delay");
        let sum = this.getValue(nodeId, "sum");
        let raycast = this.getValue(nodeId, "raycast");
        let scale = this.getValue(nodeId, "scale");
        let name = this.getValue(nodeId, "name");
        if (raycast == "true") {
          raycast = true;
        } else {
          raycast = false;
        }
        if (typeof delay == "string") delay = parseInt(delay);
        if (typeof pos == "string") eval("pos = " + pos);
        if (typeof rot == "string") eval("rot = " + rot);
        if (!texturePath || !pos) {
          console.warn("[Generator] Missing input fields...");
          this.enqueueOutputs(n, "execOut");
          return;
        }
        const createdField = n.fields.find((f) => f.key === "created");
        if (createdField.value == "false" || createdField.value == false) {
          console.log("!GEN! ONCE!");
          app.physicsBodiesGenerator(mat, pos, rot, texturePath, name, geo, raycast, scale, sum, delay);
        }
        this.enqueueOutputs(n, "execOut");
        return;
      } else if (n.title === "Generator Wall") {
        const texturePath = this.getValue(nodeId, "texturePath");
        const mat = this.getValue(nodeId, "material");
        let pos = this.getValue(nodeId, "pos");
        const size = this.getValue(nodeId, "size");
        let rot = this.getValue(nodeId, "rot");
        let delay = this.getValue(nodeId, "delay");
        let spacing = this.getValue(nodeId, "spacing");
        let raycast = this.getValue(nodeId, "raycast");
        let scale = this.getValue(nodeId, "scale");
        let name = this.getValue(nodeId, "name");
        if (raycast == "true") {
          raycast = true;
        } else {
          raycast = false;
        }
        if (typeof delay == "string") delay = parseInt(delay);
        if (typeof pos == "string") eval("pos = " + pos);
        if (typeof rot == "string") eval("rot = " + rot);
        if (typeof scale == "string") eval("scale = " + scale);
        if (!texturePath || !pos) {
          console.warn("[Generator] Missing input fields...");
          this.enqueueOutputs(n, "execOut");
          return;
        }
        const createdField = n.fields.find((f) => f.key === "created");
        if (createdField.value == "false" || createdField.value == false) {
          app.physicsBodiesGeneratorWall(mat, pos, rot, texturePath, name, size, raycast, scale, spacing, delay);
        }
        this.enqueueOutputs(n, "execOut");
        return;
      } else if (n.title === "Add OBJ") {
        const path = this.getValue(nodeId, "path");
        const texturePath = this.getValue(nodeId, "texturePath");
        const mat = this.getValue(nodeId, "material");
        let pos = this.getValue(nodeId, "pos");
        let isPhysicsBody = this.getValue(nodeId, "isPhysicsBody");
        let rot = this.getValue(nodeId, "rot");
        let isInstancedObj = this.getValue(nodeId, "isInstancedObj");
        let raycast = this.getValue(nodeId, "raycast");
        let scale = this.getValue(nodeId, "scale");
        let name = this.getValue(nodeId, "name");
        if (raycast == "true") {
          raycast = true;
        } else {
          raycast = false;
        }
        if (isInstancedObj == "true") {
          isInstancedObj = true;
        } else {
          isInstancedObj = false;
        }
        if (isPhysicsBody == "true") {
          isPhysicsBody = true;
        } else {
          isPhysicsBody = false;
        }
        if (typeof pos == "string") eval("pos = " + pos);
        if (typeof rot == "string") eval("rot = " + rot);
        if (typeof scale == "string") eval("scale = " + scale);
        if (!texturePath || !path) {
          console.warn("[Generator] Missing input fields...");
          this.enqueueOutputs(n, "execOut");
          return;
        }
        const createdField = n.fields.find((f) => f.key === "created");
        if (createdField.value == "false" || createdField.value == false) {
          app.editorAddOBJ(path, mat, pos, rot, texturePath, name, isPhysicsBody, raycast, scale, isInstancedObj).then((object) => {
            object._GRAPH_CACHE = true;
            n._returnCache = object;
            this.enqueueOutputs(n, "complete");
          }).catch((err) => {
            console.log(`%cADD OBJ ERROR GRAPH!`, LOG_FUNNY_ARCADE2);
            n._returnCache = null;
            this.enqueueOutputs(n, "error");
          });
        }
        this.enqueueOutputs(n, "execOut");
        return;
      } else if (n.title === "Generator Pyramid") {
        const texturePath = this.getValue(nodeId, "texturePath");
        const mat = this.getValue(nodeId, "material");
        let pos = this.getValue(nodeId, "pos");
        const levels = this.getValue(nodeId, "levels");
        let rot = this.getValue(nodeId, "rot");
        let delay = this.getValue(nodeId, "delay");
        let spacing = this.getValue(nodeId, "spacing");
        let raycast = this.getValue(nodeId, "raycast");
        let scale = this.getValue(nodeId, "scale");
        let name = this.getValue(nodeId, "name");
        if (raycast == "true") {
          raycast = true;
        } else {
          raycast = false;
        }
        if (typeof delay == "string") delay = parseInt(delay);
        if (typeof pos == "string") eval("pos = " + pos);
        if (typeof rot == "string") eval("rot = " + rot);
        if (typeof scale == "string") eval("scale = " + scale);
        if (!texturePath || !pos) {
          console.warn("[Generator] Missing input fields...");
          this.enqueueOutputs(n, "execOut");
          return;
        }
        const createdField = n.fields.find((f) => f.key === "created");
        if (createdField.value == "false" || createdField.value == false) {
          app.physicsBodiesGeneratorDeepPyramid(mat, pos, rot, texturePath, name, levels, raycast, scale, spacing, delay).then((objects2) => {
            n._returnCache = objects2;
            this.enqueueOutputs(n, "complete");
          });
        }
        this.enqueueOutputs(n, "execOut");
        return;
      } else if (n.title === "Set Force On Hit") {
        const objectName2 = this.getValue(nodeId, "objectName");
        const strength = this.getValue(nodeId, "strength");
        const rayDirection = this.getValue(nodeId, "rayDirection");
        if (!objectName2 || !rayDirection || !strength) {
          console.warn("[Set Force On Hit] Missing input fields...");
          this.enqueueOutputs(n, "execOut");
          return;
        }
        let b = app.matrixAmmo.getBodyByName(objectName2);
        const i = new Ammo.btVector3(
          rayDirection[0] * strength,
          rayDirection[1] * strength,
          rayDirection[2] * strength
        );
        b.applyCentralImpulse(i);
        this.enqueueOutputs(n, "execOut");
        return;
      } else if (n.title === "Set Video Texture") {
        const objectName = this.getValue(nodeId, "objectName");
        let videoTextureArg = this.getValue(nodeId, "VideoTextureArg");
        if (!objectName) {
          console.warn("[Set Video Texture] Missing input fields...");
          this.enqueueOutputs(n, "execOut");
          return;
        }
        if (typeof videoTextureArg != "object") {
          if (typeof videoTextureArg == "string") {
            eval("videoTextureArg = " + videoTextureArg);
          }
          if (typeof videoTextureArg === "undefined" || videoTextureArg === null)
            videoTextureArg = {
              type: "video",
              // video , camera  //not tested canvas2d, canvas2dinline
              src: "res/videos/tunel.mp4"
            };
        }
        let o = app.getSceneObjectByName(objectName);
        o.loadVideoTexture(videoTextureArg);
        this.enqueueOutputs(n, "execOut");
        return;
      } else if (n.title === "Set CanvasInline") {
        const objectName = this.getValue(nodeId, "objectName");
        let canvaInlineProgram = this.getValue(nodeId, "canvaInlineProgram");
        let specialCanvas2dArg = this.getValue(nodeId, "specialCanvas2dArg");
        if (!objectName) {
          console.log(`%c Node [Set CanvasInline] probably objectname is missing...`, LOG_FUNNY_ARCADE2);
          this.enqueueOutputs(n, "execOut");
          return;
        }
        if (typeof specialCanvas2dArg == "string") {
          eval("specialCanvas2dArg = " + specialCanvas2dArg);
        }
        if (typeof canvaInlineProgram != "function") {
          if (typeof canvaInlineProgram == "string") {
            canvaInlineProgram = eval("canvaInlineProgram = " + canvaInlineProgram);
          }
          if (typeof canvaInlineProgram === "undefined" || canvaInlineProgram === null)
            canvaInlineProgram = function(ctx, canvas) {
            };
        }
        let o = app.getSceneObjectByName(objectName);
        if (typeof o === "undefined") {
          console.log(`%c Node [Set CanvasInline] probably objectname is wrong...`, LOG_FUNNY_ARCADE2);
          mb.show("FluxCodexVertex Exec order is breaked on [Set CanvasInline] node id:", n.id);
          return;
        }
        o.loadVideoTexture({
          type: "canvas2d-inline",
          canvaInlineProgram,
          specialCanvas2dArg: specialCanvas2dArg ? specialCanvas2dArg : void 0
        });
        this.enqueueOutputs(n, "execOut");
        return;
      } else if (n.title === "Curve") {
        const cName = this.getValue(nodeId, "name");
        const cDelta = this.getValue(nodeId, "delta");
        if (!cName) {
          console.log(`%c Node [CURVE] probably name is missing...`, LOG_FUNNY_ARCADE2);
          this.enqueueOutputs(n, "execOut");
          return;
        }
        let curve = this.curveEditor.curveStore.getByName(nodeId);
        if (!curve) {
          console.warn("Curve not found:", cName);
          this.enqueueOutputs(n, "execOut");
          return;
        }
        if (!curve.baked) {
          console.log(`%cNode [CURVE] ${curve} bake.`, LOG_FUNNY_ARCADE2);
          curve.bake();
        }
        n.curve = curve;
        const t01 = cDelta / curve.length;
        let V = n.curve.evaluate(t01);
        n._returnCache = V;
        this.enqueueOutputs(n, "execOut");
        return;
      } else if (n.title === "getNumberLiteral") {
        const literailNum = this.getValue(nodeId, "number");
        n._returnCache = literailNum;
        this.enqueueOutputs(n, "execOut");
        return;
      } else if (n.title === "Audio Reactive Node") {
        const src = this.getValue(nodeId, "audioSrc");
        const loop = this.getValue(nodeId, "loop");
        const thresholdBeat = this.getValue(nodeId, "thresholdBeat");
        const createdField2 = n.fields.find((f) => f.key === "created");
        if (!n._audio && !n._loading) {
          n._loading = true;
          createdField2.value = true;
          createdField2.disabled = true;
          app.audioManager.load(src).then((asset) => {
            asset.audio.loop = loop;
            n._audio = asset;
            n._energyHistory = [];
            n._beatCooldown = 0;
            n._loading = false;
          });
          return;
        }
        if (!n._audio || !n._audio.ready) return;
        const data = n._audio.updateFFT();
        if (!data) return;
        let low = 0, mid = 0, high = 0;
        for (let i = 0; i < 16; i++) low += data[i];
        for (let i = 16; i < 64; i++) mid += data[i];
        for (let i = 64; i < 128; i++) high += data[i];
        low /= 16;
        mid /= 48;
        high /= 64;
        const energy = (low + mid + high) / 3;
        const hist = n._energyHistory;
        hist.push(low);
        if (hist.length > 30) hist.shift();
        let avg = 0;
        for (let i = 0; i < hist.length; i++) avg += hist[i];
        avg /= hist.length;
        let beat = false;
        if (low > avg * thresholdBeat && n._beatCooldown <= 0) {
          beat = true;
          n._beatCooldown = 10;
        }
        if (n._beatCooldown > 0) n._beatCooldown--;
        n._returnCache = [low, mid, high, energy, beat];
        this.enqueueOutputs(n, "execOut");
        return;
      } else if (n.title === "Oscillator") {
        const min2 = this.getValue(nodeId, "min");
        const max2 = this.getValue(nodeId, "max");
        const step = this.getValue(nodeId, "step");
        const regime = this.getValue(nodeId, "regime");
        const resist = this.getValue(nodeId, "resist");
        const resistMode = this.getValue(nodeId, "resistMode");
        if (!n._listenerAttached) {
          n.osc = new OSCILLATOR(min2, max2, step, {
            regime,
            resist,
            resistMode
          });
          n._listenerAttached = true;
        }
        n._returnCache = n.osc.UPDATE();
      } else if (n.title === "Set Shader Graph") {
        console.warn("[Set Shader Graph] ?????  ??input fields...");
        const objectName2 = this.getValue(nodeId, "objectName");
        let selectedShader = this.getValue(nodeId, "selectedShader");
        if (!objectName2) {
          console.warn("[Set Shader Graph] Missing input fields...");
          this.enqueueOutputs(n, "execOut");
          return;
        }
        let o2 = app.getSceneObjectByName(objectName2);
        o2.changeMaterial("graph", app.shaderGraph.runtime_memory[selectedShader]);
        this.enqueueOutputs(n, "execOut");
        return;
      }
      this.enqueueOutputs(n, "execOut");
      return;
    }
    if (n.category === "logic" && n.title === "if") {
      const condition = Boolean(this.getValue(nodeId, "condition"));
      this.enqueueOutputs(n, condition ? "true" : "false");
      this._execContext = null;
      return;
    }
    if (n.title === "Get Speed") {
      const pos2 = this.getValue(nodeId, "position");
      if (pos2?.getSpeed) n._returnCache = pos2.getSpeed();
      this.enqueueOutputs(n, "execOut");
      return;
    } else if (n.title === "Set Water Material Params") {
      let deepColor = this.getValue(nodeId, "deepColor(vec3f)");
      let waveSpeed = this.getValue(nodeId, "waveSpeed");
      let shallowColor = this.getValue(nodeId, "shallowColor(vec3f)");
      let waveScale = this.getValue(nodeId, "waveScale");
      let waveHeight = this.getValue(nodeId, "waveHeight");
      let fresnelPower = this.getValue(nodeId, "fresnelPower");
      let specularPower = this.getValue(nodeId, "specularPower");
      let sceneObjectName = this.getValue(nodeId, "sceneObjectName");
      if (deepColor && sceneObjectName) {
        deepColor = JSON.parse(deepColor);
        shallowColor = JSON.parse(shallowColor);
        let obj2 = app.getSceneObjectByName(sceneObjectName);
        obj2.updateWaterParams(deepColor, shallowColor, waveSpeed, waveScale, waveHeight, fresnelPower, specularPower);
      }
      this.enqueueOutputs(n, "execOut");
      return;
    } else if (n.title === "Set VertexAnim Intesity") {
      let sceneObjectName = this.getValue(nodeId, "sceneObjectName");
      let intensity = this.getValue(nodeId, "intensity");
      if (sceneObjectName) {
        let obj2 = app.getSceneObjectByName(sceneObjectName);
        obj2.vertexAnim.setIntensity(intensity);
      }
      this.enqueueOutputs(n, "execOut");
      return;
    } else if (n.title === "Set Vertex Wave") {
      let sceneObjectName = this.getValue(nodeId, "sceneObjectName");
      let enableWave = this.getValue(nodeId, "enableWave");
      let waveSpeed = this.getValue(nodeId, "Wave Speed");
      let waveAmplitude = this.getValue(nodeId, "Wave Amplitude");
      let waveFrequency = this.getValue(nodeId, "Wave Frequency");
      if (sceneObjectName) {
        if (enableWave == true || enableWave == "true") {
          let obj2 = app.getSceneObjectByName(sceneObjectName);
          obj2.vertexAnim.enableWave();
          obj2.vertexAnim.setWaveParams(waveSpeed, waveAmplitude, waveFrequency);
        } else {
          obj.vertexAnim.disableWave();
        }
      }
      this.enqueueOutputs(n, "execOut");
      return;
    } else if (n.title === "Set Vertex Wind") {
      let sceneObjectName = this.getValue(nodeId, "sceneObjectName");
      let enableWind = this.getValue(nodeId, "enableWind");
      let windSpeed = this.getValue(nodeId, "Wind Speed");
      let windStrength = this.getValue(nodeId, "Wind Strength");
      let windHeightInfluence = this.getValue(nodeId, "Wind HeightInfluence");
      let windTurbulence = this.getValue(nodeId, "Wind Turbulence");
      if (sceneObjectName) {
        let obj2 = app.getSceneObjectByName(sceneObjectName);
        if (enableWind == true || enableWind == "true") {
          obj2.vertexAnim.enableWind();
          obj2.vertexAnim.setWindParams(windSpeed, windStrength, windHeightInfluence, windTurbulence);
        } else {
          obj2.vertexAnim.disableWind();
        }
      }
      this.enqueueOutputs(n, "execOut");
      return;
    } else if (n.title === "Set Vertex Pulse") {
      let sceneObjectName = this.getValue(nodeId, "sceneObjectName");
      let enablePulse = this.getValue(nodeId, "enablePulse");
      let pulseSpeed = this.getValue(nodeId, "Pulse speed");
      let pulseAmount = this.getValue(nodeId, "Pulse amount");
      let pulseCenterX = this.getValue(nodeId, "Pulse centerX");
      let pulseCenterY = this.getValue(nodeId, "Pulse centerY");
      if (sceneObjectName) {
        let obj2 = app.getSceneObjectByName(sceneObjectName);
        if (enablePulse == true || enablePulse == "true") {
          obj2.vertexAnim.enablePulse();
          obj2.vertexAnim.setPulseParams(pulseSpeed, pulseAmount, pulseCenterX, pulseCenterY);
        } else {
          obj2.vertexAnim.disablePulse();
        }
      }
      this.enqueueOutputs(n, "execOut");
      return;
    } else if (n.title === "Set Vertex Twist") {
      let sceneObjectName = this.getValue(nodeId, "sceneObjectName");
      let enableTwist = this.getValue(nodeId, "enableTwist");
      let twistSpeed = this.getValue(nodeId, "Twist speed");
      let twistAmount = this.getValue(nodeId, "Twist amount");
      if (sceneObjectName) {
        console.log(" TEST VERTEX ANIMATION !Twist ", enableTwist);
        let obj2 = app.getSceneObjectByName(sceneObjectName);
        if (enableTwist == true || enableTwist == "true") {
          obj2.vertexAnim.enableTwist();
          obj2.vertexAnim.setTwistParams(twistSpeed, twistAmount);
        }
      }
      this.enqueueOutputs(n, "execOut");
      return;
    } else if (n.title === "Set Vertex Noise") {
      let sceneObjectName = this.getValue(nodeId, "sceneObjectName");
      let enableNoise = this.getValue(nodeId, "enableNoise");
      let noiseScale = this.getValue(nodeId, "Noise Scale");
      let noiseStrength = this.getValue(nodeId, "Noise Strength");
      let noiseSpeed = this.getValue(nodeId, "Noise Speed");
      if (sceneObjectName) {
        console.log(" TEST VERTEX ANIMATION !enableNoise ", enableNoise);
        let obj2 = app.getSceneObjectByName(sceneObjectName);
        if (enableNoise == true || enableNoise == "true") {
          obj2.vertexAnim.enableNoise();
          obj2.vertexAnim.setNoiseParams(noiseScale, noiseStrength, noiseSpeed);
        }
      }
      this.enqueueOutputs(n, "execOut");
      return;
    } else if (n.title === "Set Vertex Ocean") {
      let sceneObjectName = this.getValue(nodeId, "sceneObjectName");
      let enableOcean = this.getValue(nodeId, "enableOcean");
      let oceanScale = this.getValue(nodeId, "Ocean Scale");
      let oceanHeight = this.getValue(nodeId, "Ocean Height");
      let oceanSpeed = this.getValue(nodeId, "Ocean speed");
      if (sceneObjectName) {
        let obj2 = app.getSceneObjectByName(sceneObjectName);
        if (enableOcean == true || enableOcean == "true") {
          obj2.vertexAnim.enableOcean();
          obj2.vertexAnim.setOceanParams(oceanScale, oceanHeight, oceanSpeed);
        } else {
          obj2.vertexAnim.disableOcean();
        }
      }
      this.enqueueOutputs(n, "execOut");
      return;
    } else if (n.title === "Set Material") {
      const materialType = this.getValue(nodeId, "materialType");
      const sceneObjectName = this.getValue(nodeId, "sceneObjectName");
      if (materialType && materialType !== "graph") {
        console.log("sceneObjectName", sceneObjectName);
        let obj2 = app.getSceneObjectByName(sceneObjectName);
        obj2.changeMaterial(materialType);
      }
      this.enqueueOutputs(n, "execOut");
      return;
    } else if (n.title === "Set Blend") {
      const a = parseFloat(this.getValue(nodeId, "alpha"));
      const sceneObjectName = this.getValue(nodeId, "sceneObjectName");
      if (sceneObjectName) {
        let obj2 = app.getSceneObjectByName(sceneObjectName);
        obj2.setBlend(a);
      }
      this.enqueueOutputs(n, "execOut");
      return;
    } else if (n.title === "Set Texture") {
      const texpath = this.getValue(nodeId, "texturePath");
      const sceneObjectName = this.getValue(nodeId, "sceneObjectName");
      if (texpath) {
        let obj2 = app.getSceneObjectByName(sceneObjectName);
        obj2.loadTex0([texpath]).then(() => {
          setTimeout(() => obj2.changeTexture(obj2.texture0), 200);
        });
      }
      this.enqueueOutputs(n, "execOut");
      return;
    } else if (n.title === "Set Speed") {
      const pos2 = this.getValue(nodeId, "position");
      if (pos2?.setSpeed) {
        pos2.setSpeed(this.getValue(nodeId, "thrust"));
      }
      this.enqueueOutputs(n, "execOut");
      return;
    } else if (n.title === "Set Position") {
      const pos2 = this.getValue(nodeId, "position");
      if (pos2?.setPosition) {
        pos2.setPosition(this.getValue(nodeId, "x"), this.getValue(nodeId, "y"), this.getValue(nodeId, "z"));
      }
      this.enqueueOutputs(n, "execOut");
      return;
    } else if (n.title === "Set Rotation") {
      const rot2 = this.getValue(nodeId, "rotation");
      if (rot2?.setRotation) {
        rot2.setRotation(this.getValue(nodeId, "x"), this.getValue(nodeId, "y"), this.getValue(nodeId, "z"));
      }
      this.enqueueOutputs(n, "execOut");
      return;
    } else if (n.title === "Set Rotate") {
      const rot2 = this.getValue(nodeId, "rotation");
      if (rot2?.setRotate) {
        rot2.setRotate(this.getValue(nodeId, "x"), this.getValue(nodeId, "y"), this.getValue(nodeId, "z"));
      }
      this.enqueueOutputs(n, "execOut");
      return;
    } else if (n.title === "Set RotateX") {
      const rot2 = this.getValue(nodeId, "rotation");
      if (rot2?.setRotateX) {
        rot2.setRotateX(this.getValue(nodeId, "x"));
      }
      this.enqueueOutputs(n, "execOut");
      return;
    } else if (n.title === "Set RotateY") {
      const rot2 = this.getValue(nodeId, "rotation");
      if (rot2?.setRotateY) {
        rot2.setRotateY(this.getValue(nodeId, "y"));
      }
      this.enqueueOutputs(n, "execOut");
      return;
    } else if (n.title === "Set RotateZ") {
      const rot2 = this.getValue(nodeId, "rotation");
      if (rot2?.setRotateZ) {
        rot2.setRotateZ(this.getValue(nodeId, "z"));
      }
      this.enqueueOutputs(n, "execOut");
      return;
    } else if (n.title === "Translate By X") {
      const pos2 = this.getValue(nodeId, "position");
      if (pos2?.translateByX) {
        pos2.translateByX(this.getValue(nodeId, "x"));
      }
      this.enqueueOutputs(n, "execOut");
      return;
    } else if (n.title === "Translate By Y") {
      const pos2 = this.getValue(nodeId, "position");
      if (pos2?.translateByY) {
        pos2.translateByX(this.getValue(nodeId, "y"));
      }
      this.enqueueOutputs(n, "execOut");
      return;
    } else if (n.title === "Translate By Z") {
      const pos2 = this.getValue(nodeId, "position");
      if (pos2?.translateByZ) {
        pos2.translateByX(this.getValue(nodeId, "z"));
      }
      this.enqueueOutputs(n, "execOut");
      return;
    } else if (n.title === "Set Production Mode") {
      const disableLoopWarns = this.getValue(nodeId, "disableLoopWarns");
      if (disableLoopWarns) {
      }
      byId("hideEditorBtn").click();
      this.enqueueOutputs(n, "execOut");
      return;
    }
    if (["math", "value", "compare", "stringOperation"].includes(n.category)) {
      let result2;
      switch (n.title) {
        case "Starts With [string]":
          result2 = this.getValue(nodeId, "input").startsWith(this.getValue(nodeId, "prefix"));
          break;
        case "Add":
          result2 = this.getValue(nodeId, "a") + this.getValue(nodeId, "b");
          break;
        case "Sub":
          result2 = this.getValue(nodeId, "a") - this.getValue(nodeId, "b");
          break;
        case "Mul":
          result2 = this.getValue(nodeId, "a") * this.getValue(nodeId, "b");
          break;
        case "Div":
          result2 = this.getValue(nodeId, "a") / this.getValue(nodeId, "b");
          break;
        case "Sin":
          result2 = Math.sin(this.getValue(nodeId, "a"));
          break;
        case "Cos":
          result2 = Math.cos(this.getValue(nodeId, "a"));
          break;
        case "Pi":
          result2 = Math.PI;
          break;
        case "A > B":
          result2 = this.getValue(nodeId, "A") > this.getValue(nodeId, "B");
          break;
        case "A < B":
          result2 = this.getValue(nodeId, "A") < this.getValue(nodeId, "B");
          break;
        case "A == B":
          let varA = this.getValue(nodeId, "A");
          let varB = this.getValue(nodeId, "B");
          if (typeof varA == "object") {
            const r2 = this.deepEqual(varA, varB);
            result2 = r2;
          } else {
            result2 = this.getValue(nodeId, "A") != this.getValue(nodeId, "B");
          }
          break;
        case "A != B":
          let varAN = this.getValue(nodeId, "A");
          let varBN = this.getValue(nodeId, "B");
          if (typeof varAN == "object") {
            const r2 = this.deepEqual(varAN, varBN);
            result2 = !r2;
          } else {
            result2 = this.getValue(nodeId, "A") != this.getValue(nodeId, "B");
          }
          break;
        case "A >= B":
          result2 = this.getValue(nodeId, "A") >= this.getValue(nodeId, "B");
          break;
        case "A <= B":
          result2 = this.getValue(nodeId, "A") <= this.getValue(nodeId, "B");
          break;
        case "GenRandInt":
          const min2 = +n.fields?.find((f) => f.key === "min")?.value || 0;
          const max2 = +n.fields?.find((f) => f.key === "max")?.value || 10;
          result2 = Math.floor(Math.random() * (max2 - min2 + 1)) + min2;
          break;
        default:
          result2 = void 0;
      }
      n._returnCache = result2;
      if (n.displayEl) n.displayEl.textContent = typeof result2 === "number" ? result2.toFixed(3) : String(result2);
    }
    this._execContext = null;
  }
  getConnectedSource(nodeId2, inputName) {
    const link = this.links.find((l) => l.to.node === nodeId2 && l.to.pin === inputName);
    if (!link) return null;
    return {
      node: this.nodes[link.from.node],
      pin: link.from.pin
    };
  }
  populateAccessMethods(select2) {
    select2.innerHTML = "";
    this.accessObject.forEach((obj2) => {
      Object.getOwnPropertyNames(obj2.__proto__).filter((k) => typeof obj2[k] === "function" && k !== "constructor").forEach((fn) => {
        const opt = document.createElement("option");
        opt.value = `${obj2.name}.${fn}`;
        opt.textContent = `${obj2.name}.${fn}`;
        select2.appendChild(opt);
      });
    });
    select2.onchange = (e) => {
      const [objName, fnName] = e.target.value.split(".");
      this.adaptNodeToAccessMethod(node, objName, fnName);
    };
  }
  getByPath(obj2, path2) {
    return path2.split(".").reduce((acc, key) => acc?.[key], obj2);
  }
  getVariable(type2, key) {
    const entry = this.variables[type2]?.[key];
    if (entry === void 0) return void 0;
    if (entry && typeof entry === "object" && "value" in entry) {
      return entry.value;
    }
    return entry;
  }
  enqueueOutputs(n2, pinName) {
    this.links.filter((l) => l.from.node === n2.id && l.from.pin === pinName && l.type === "action").forEach(
      (l) => setTimeout(() => {
        this.triggerNode(l.to.node);
      }, 2)
    );
  }
  deleteNode(nodeId2) {
    const node2 = this.nodes[nodeId2];
    if (!node2) return;
    this.links = this.links.filter((link) => {
      if (link.from.node === nodeId2 || link.to.node === nodeId2) {
        const dom3 = document.getElementById(link.id);
        if (dom3) dom3.remove();
        return false;
      }
      return true;
    });
    const dom2 = this.board.querySelector(`[data-id="${nodeId2}"]`);
    if (dom2) dom2.remove();
    delete this.nodes[nodeId2];
    this.updateLinks();
  }
  bindGlobalListeners() {
    document.addEventListener("mousemove", this.handleMouseMove.bind(this));
    document.addEventListener("mouseup", this.handleMouseUp.bind(this));
    this.boardWrap.addEventListener(
      "mousedown",
      this.handleBoardWrapMouseDown.bind(this)
    );
    this.boardWrap.addEventListener("mousedown", () => {
      byId("app").style.opacity = 1;
    });
    this.board.addEventListener("click", () => {
      byId("app").style.opacity = 1;
    });
  }
  handleMouseMove(e) {
    if (this.state.draggingNode) {
      const el2 = this.state.draggingNode;
      const newX = e.clientX - this.state.dragOffset[0];
      const newY = e.clientY - this.state.dragOffset[1];
      el2.style.left = newX + "px";
      el2.style.top = newY + "px";
      const id2 = el2.dataset.id;
      if (this.nodes[id2]) {
        this.nodes[id2].x = newX;
        this.nodes[id2].y = newY;
      }
      this.updateLinks();
    } else if (this.state.panning) {
      const dx = e.clientX - this.state.panStart[0], dy = e.clientY - this.state.panStart[1];
      this.state.pan[0] += dx;
      this.state.pan[1] += dy;
      this.board.style.transform = `translate(${this.state.pan[0]}px,${this.state.pan[1]}px)`;
      this.state.panStart = [e.clientX, e.clientY];
      this.updateLinks();
    }
  }
  handleMouseUp() {
    this.state.draggingNode = null;
    this.state.panning = false;
    document.body.style.cursor = "default";
  }
  handleBoardWrapMouseDown(e) {
    if (!e.target.closest(".node")) {
      this.state.panning = true;
      this.state.panStart = [e.clientX, e.clientY];
      document.body.style.cursor = "grabbing";
      this.selectNode(null);
    }
  }
  updateLinks() {
    while (this.svg.firstChild) this.svg.removeChild(this.svg.firstChild);
    const bRect = this.board.getBoundingClientRect();
    this.links.forEach((l) => {
      const fromDot = this._getPinDot(l.from.node, l.from.pin, true);
      const toDot = this._getPinDot(l.to.node, l.to.pin, false);
      if (!fromDot || !toDot) return;
      const fRect = fromDot.getBoundingClientRect(), tRect = toDot.getBoundingClientRect();
      const x1 = fRect.left - bRect.left + 6, y1 = fRect.top - bRect.top + 6;
      const x2 = tRect.left - bRect.left + 6, y2 = tRect.top - bRect.top + 6;
      const path2 = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "path"
      );
      path2.setAttribute("class", "link " + (l.type === "value" ? "value" : ""));
      path2.setAttribute(
        "d",
        `M${x1},${y1} C${x1 + 50},${y1} ${x2 - 50},${y2} ${x2},${y2}`
      );
      this.svg.appendChild(path2);
    });
  }
  runGraph() {
    if (byId("graph-status").innerHTML == "\u{1F534}" || Object.values(this.nodes).length == 0) {
      if (mb) mb.show("FluxCodexVertex not ready yet...");
      return;
    }
    let getCurrentGIzmoObj = app.mainRenderBundle.filter((o2) => o2.effects.gizmoEffect && o2.effects.gizmoEffect.enabled);
    if (getCurrentGIzmoObj.length > 0) getCurrentGIzmoObj[0].effects.gizmoEffect.enabled = false;
    byId("app").style.opacity = 0.5;
    this.initEventNodes();
    Object.values(this.nodes).forEach((n2) => n2._returnCache = void 0);
    Object.values(this.nodes).filter((n2) => n2.category === "event" && n2.title === "onLoad").forEach((n2) => this.triggerNode(n2.id));
    byId("graph-status").innerHTML = "\u{1F534}";
  }
  compileGraph() {
    const bundle = {
      nodes: this.nodes,
      links: this.links,
      nodeCounter: this.nodeCounter,
      linkCounter: this.linkCounter,
      pan: this.state.pan,
      variables: this.variables
    };
    function saveReplacer(key, value) {
      if (key === "fn") return void 0;
      if (key === "accessObject") return void 0;
      if (key === "_returnCache") return void 0;
      if (key === "_listenerAttached") return false;
      if (key === "_audio") return void 0;
      if (key === "_loading") return false;
      if (key === "_energyHistory") return void 0;
      if (key === "_beatCooldown") return 0;
      return value;
    }
    let d = JSON.stringify(bundle, saveReplacer);
    localStorage.setItem(this.SAVE_KEY, d);
    document.dispatchEvent(new CustomEvent("save-graph", { detail: d }));
  }
  clearStorage() {
    let ask = confirm("\u26A0\uFE0F This will delete all nodes. Are you sure?");
    if (ask) {
      this.clearAllNodes();
      localStorage.removeItem(this.SAVE_KEY);
      this.compileGraph();
    }
  }
  clearAllNodes() {
    this.board.querySelectorAll(".node").forEach((n2) => n2.remove());
    this.nodes = [];
    this.nodes.length = 0;
    this.links.length = 0;
    this.state.selectedNode = null;
    this.state.draggingNode = null;
    this.state.connectingPin = null;
    this.updateLinks();
  }
  _buildSaveBundle() {
    return {
      nodes: this.nodes,
      links: this.links,
      nodeCounter: this.nodeCounter,
      linkCounter: this.linkCounter,
      pan: this.state.pan,
      variables: this.variables,
      version: 1
    };
  }
  _loadFromBundle(data) {
    this.nodes = data.nodes || {};
    this.links = data.links || {};
    this.nodeCounter = data.nodeCounter || 0;
    this.linkCounter = data.linkCounter || 0;
    this.state.pan = data.pan || { x: 0, y: 0 };
    this.variables = data.variables || {
      number: {},
      boolean: {},
      string: {}
    };
    this._refreshVarsList(this._varsPopup.children[1]);
    this.loadFromImport();
    this.log("Graph imported from JSON");
  }
  exportToJSON() {
    const bundle = this._buildSaveBundle();
    console.log(bundle);
    function saveReplacer(key, value) {
      if (key === "fn") return void 0;
      if (key === "accessObject") return void 0;
      if (key === "_returnCache") return void 0;
      if (key === "_listenerAttached") return false;
      return value;
    }
    const json = JSON.stringify(bundle, saveReplacer);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "fluxcodex-graph.json";
    a.click();
    URL.revokeObjectURL(url);
    this.log("Graph exported as JSON");
  }
  _createImportInput() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.style.display = "none";
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const data = JSON.parse(reader.result);
          this._loadFromBundle(data);
        } catch (err) {
          console.error("Invalid JSON file", err);
        }
      };
      reader.readAsText(file);
    };
    document.body.appendChild(input);
    this._importInput = input;
  }
  init() {
    const saved = localStorage.getItem(this.SAVE_KEY);
    if (saved || app.graph) {
      try {
        let data;
        try {
          if (app.graph) {
            data = app.graph;
          } else {
            console.warn("\u26A0\uFE0F Used cached data for graph, load from localstorage!");
            data = JSON.parse(saved);
          }
          if (data == null) {
            console.warn("\u26A0\uFE0F No file also no cache for graph, Editor faild to load!");
            return;
          }
        } catch (e) {
          console.warn("\u26A0\uFE0F No cache for graph, load from module!");
          data = app.graph;
        }
        if (data.variables) {
          this.variables = data.variables;
          this._refreshVarsList(this._varsPopup.children[1]);
        }
        this.nodes = data.nodes || {};
        this.links = data.links || [];
        this.nodeCounter = data.nodeCounter || 1;
        this.linkCounter = data.linkCounter || 1;
        this.state.pan = data.pan || [0, 0];
        this.board.style.transform = `translate(${this.state.pan[0]}px,${this.state.pan[1]}px)`;
        Object.values(this.nodes).forEach((spec2) => {
          const domEl = this.createNodeDOM(spec2);
          this.board.appendChild(domEl);
          if (spec2.category === "value" && spec2.title !== "GenRandInt" || spec2.category === "math" || spec2.title === "Print") {
            spec2.displayEl = domEl.querySelector(".value-display");
          }
          this.updateNodeDOM(spec2.id);
        });
        this.updateLinks();
        this.restoreConnectionsRuntime();
        this.log("Loaded graph.");
        return;
      } catch (e) {
        console.error("Failed to load graph from storage:", e);
      }
    }
    this.addNode("event");
  }
  loadFromImport() {
    Object.values(this.nodes).forEach((spec2) => {
      const domEl = this.createNodeDOM(spec2);
      this.board.appendChild(domEl);
      if (spec2.category === "value" && spec2.title !== "GenRandInt" || spec2.category === "math" || spec2.title === "Print") {
        spec2.displayEl = domEl.querySelector(".value-display");
      }
      if (spec2.category === "action" && spec2.title === "Function") {
        this.updateNodeDOM(spec2.id);
      }
    });
    this.updateLinks();
    this.updateValueDisplays();
    this.log("Restored graph.");
    this.compileGraph();
    return;
  }
  onNodeDoubleClick(node2) {
    console.log(`%c Node [CURVE  func] ${node2.curve}`, LOG_FUNNY_ARCADE2);
    if (node2.title !== "Curve") return;
    this.curveEditor.bindCurve(node2.curve, {
      name: node2.id,
      idNode: node2.id
    });
    this.curveEditor.toggleEditor(true);
  }
  mergeGraphBundle(data) {
    if (!data || !data.nodes) return;
    const nodeOffset = this.nodeCounter;
    const linkOffset = this.linkCounter;
    const nodeIdMap = {};
    Object.values(data.nodes).forEach((node2) => {
      const oldId = node2.id;
      const newId = "n" + this.nodeCounter++;
      nodeIdMap[oldId] = newId;
      const newNode = {
        ...node2,
        id: newId,
        // Offset so they don't overlap existing nodes
        x: (node2.x || 0) + 100,
        y: (node2.y || 0) + 100
      };
      this.nodes[newId] = newNode;
      const domEl = this.createNodeDOM(newNode);
      this.board.appendChild(domEl);
      if (newNode.category === "value" && newNode.title !== "GenRandInt" || newNode.category === "math" || newNode.title === "Print") {
        newNode.displayEl = domEl.querySelector(".value-display");
      }
    });
    if (Array.isArray(data.links)) {
      data.links.forEach((link) => {
        const newLinkId = "l" + this.linkCounter++;
        const newLink = {
          ...link,
          id: newLinkId,
          from: {
            ...link.from,
            node: nodeIdMap[link.from.node]
          },
          to: {
            ...link.to,
            node: nodeIdMap[link.to.node]
          }
        };
        if (this.nodes[newLink.from.node] && this.nodes[newLink.to.node]) {
          this.links.push(newLink);
        }
      });
    }
    Object.keys(nodeIdMap).forEach((oldId) => {
      this.updateNodeDOM(nodeIdMap[oldId]);
    });
    this.updateLinks();
    if (this.restoreConnectionsRuntime) {
      this.restoreConnectionsRuntime();
    }
    this.log(`Merged ${Object.keys(nodeIdMap).length} nodes with links.`);
    this.compileGraph();
  }
};

// ../hud.js
var EditorHud = class {
  constructor(core, a, toolTip) {
    this.core = core;
    this.sceneContainer = null;
    this.FS = new FullscreenManager();
    this.toolTip = toolTip;
    if (a == "infly") {
      this.createTopMenuInFly();
    } else if (a == "created from editor") {
      this.createTopMenu();
      this.createAssets();
      this.createGizmoIcons();
    } else if (a == "pre editor") {
      this.createTopMenuPre();
    } else {
      throw console.error("Editor err");
    }
    this.createEditorSceneContainer();
    this.createScenePropertyBox();
    this.currentProperties = [];
    document.addEventListener("editor-not-running", () => {
      this.noEditorConn();
    });
    document.addEventListener("file-detail-data", (e) => {
      console.log(e.detail.details);
      let getPATH = e.detail.details.path.split("public")[1];
      const ext = getPATH.split(".").pop();
      if (ext == "glb" && confirm("GLB FILE \u{1F4E6} Do you wanna add it to the scene ?")) {
        let objName = prompt(`Path: ${getPATH} 
 \u{1F4E6} Enter Uniq Name: `);
        if (confirm("\u269B Enable physics (Ammo)?")) {
          let o2 = {
            physics: true,
            path: getPATH,
            index: objName
          };
          document.dispatchEvent(new CustomEvent("web.editor.addGlb", { detail: o2 }));
        } else {
          let o2 = {
            physics: false,
            path: getPATH,
            index: objName
          };
          document.dispatchEvent(new CustomEvent("web.editor.addGlb", { detail: o2 }));
        }
      } else if (ext == "obj" && confirm("OBJ FILE \u{1F4E6} Do you wanna add it to the scene ?")) {
        let objName = prompt("\u{1F4E6} Enter uniq name: ");
        if (confirm("\u269B Enable physics (Ammo)?")) {
          let o2 = {
            physics: true,
            path: getPATH,
            index: objName
          };
          document.dispatchEvent(new CustomEvent("web.editor.addObj", {
            detail: o2
          }));
        } else {
          let o2 = {
            physics: false,
            path: getPATH,
            index: objName
          };
          document.dispatchEvent(new CustomEvent("web.editor.addObj", {
            detail: o2
          }));
        }
      } else if (ext == "mp3" && confirm("MP3 FILE \u{1F4E6} Do you wanna add it to the scene ?")) {
        let objName = prompt("\u{1F4E6} Enter uniq name: ");
        let o2 = {
          path: getPATH,
          name: objName
        };
        document.dispatchEvent(new CustomEvent("web.editor.addMp3", {
          detail: o2
        }));
      } else {
        let s = "";
        for (let key in e.detail.details) {
          if (key == "path") {
            s += key + ":" + e.detail.details[key].split("public")[1] + "\n";
          } else {
            s += key + ":" + e.detail.details[key] + "\n";
          }
        }
        mb.show(s);
      }
    });
  }
  noEditorConn() {
    this.errorForm = document.createElement("div");
    this.errorForm.id = "errorForm";
    Object.assign(this.errorForm.style, {
      position: "absolute",
      top: "20%",
      left: "25%",
      width: "50%",
      height: "30vh",
      backgroundColor: "rgba(0,0,0,0.85)",
      display: "flex",
      color: "white",
      fontFamily: "'Orbitron', sans-serif",
      zIndex: "15",
      padding: "2px",
      boxSizing: "border-box",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center"
    });
    this.errorForm.innerHTML = `
       <h1 class='fancy-label' style="font-size: 24px;" >No connection with editor node app.</h1>
       <h3 class='fancy-label'>Run from root [npm run editorx] 
 
          or run from ./src/tools/editor/backend [npm run editorx] 

          Than refresh page [clear default cache browser with CTRL+F5] </h3>
    `;
    document.body.appendChild(this.errorForm);
  }
  createTopMenu() {
    this.editorMenu = document.createElement("div");
    this.editorMenu.id = "editorMenu";
    Object.assign(this.editorMenu.style, {
      position: "absolute",
      top: "0",
      left: "30%",
      width: "60%",
      height: "50px;",
      backgroundColor: "rgba(0,0,0,0.85)",
      display: "flex",
      alignItems: "start",
      // overflow: "auto",
      color: "white",
      fontFamily: "'Orbitron', sans-serif",
      zIndex: "15",
      padding: "2px",
      boxSizing: "border-box",
      flexDirection: "row"
    });
    this.editorMenu.innerHTML = " PROJECT MENU  ";
    this.editorMenu.innerHTML = `
    <div class="top-item">
      <div class="top-btn">Project \u25BE</div>
      <div class="dropdown">
      <div id="start-watch" class="drop-item">\u{1F6E0}\uFE0F Watch</div>
      <div id="stop-watch" class="drop-item">\u{1F6E0}\uFE0F Stop Watch</div>
      <div id="start-refresh" class="drop-item">\u{1F6E0}\uFE0F Refresh</div>
      <!--div id="start-prod-build" class="drop-item">\u{1F6E0}\uFE0F Build for production</div-->
      </div>
    </div>

    <div class="top-item">
      <div class="top-btn">Insert \u25BE</div>
      <div class="dropdown">
        <div id="addCube" class="drop-item">\u{1F9CA}Cube</div>
        <div id="addCubePhysics" class="drop-item">\u{1F9CA}Cube with Physics</div>
        <div id="addSphere" class="drop-item">\u26AASphere</div>
        <div id="addSpherePhysics" class="drop-item">\u26AASphere with Physics</div>
        <small>Glb and Obj files add direct from asset (by selecting)</small>
        <!--div class="drop-item">\u{1F4A1} Light</div-->
      </div>
    </div>

    <div class="top-item">
      <div class="top-btn">AI tools \u25BE</div>
      <div class="dropdown">
        <div id="showAITools" class="drop-item">\u26AA AI graph generator</div>
      </div>
    </div>
    
    <div class="top-item">
      <div class="top-btn">Script \u25BE</div>
      <div class="dropdown">
        <div id="showVisualCodeEditorBtn" class="drop-item btn4">
           <span>Visual Scripting</span>
           <small>\u2328\uFE0FFluxCodexVertex</small>
           <small>\u2328\uFE0FPress F6 for run</small>
        </div>
        <div id="showCodeVARSBtn" class="drop-item btn4">
           <span>Variable editor</span>
           <small>\u{1F527}Visual Script tool</small>
        </div>
        <div id="showCodeEditorBtn" class="drop-item btn4">
           <span>Show code editor</span>
           <small>\u{1F469}\u200D\u{1F4BB}Function raw edit</small>
           <small>Custom Functions</small>
        </div>
        <div id="showCurveEditorBtn" class="drop-item btn4">
           <span>Show curve editor</span>
           <small>\u{1F4C8}Timeline curve editor</small>
           <small> </small>
        </div>
        <div id="showShaderEditorBtn" class="drop-item btn4">
           <span>Show shader editor</span>
           <small>Shader editor</small>
           <small> </small>
        </div>
      </div>
    </div>

    <div class="top-item">
      <div class="top-btn">View \u25BE</div>
      <div class="dropdown">
        <div id="hideEditorBtn" class="drop-item">
           <h4>Hide Editor UI</h4>
           <small>Show editor - press F4 \u2328\uFE0F</small>
        </div>
        <div id="bg-transparent" class="drop-item">
           <h4>Background transparent</h4>
           <small>Fancy style</small>
        </div>
        <div id="bg-tradicional" class="drop-item">
           <h4>Background tradicional</h4>
           <small>Old school</small>
        </div>
        <div id="fullScreenBtn" class="drop-item">
         <span>FullScreen</span>
         <small>Exit - press F11 \u2328\uFE0F</small>
        </div>
      </div>
    </div>

    <div class="top-item">
      <div class="top-btn">About \u25BE</div>
      <div class="dropdown">
        <div id="showAboutEditor" class="drop-item">matrix-engine-wgpu</div>
        <div class="drop-item">Raport issuse on <a href="https://github.com/zlatnaspirala/matrix-engine-wgpu/issues">Github</a></div>
      </div>
    </div>

    <div class="btn2">
      <button class="btn" id="saveMainGraphDOM">SAVE GRAPH</button>
      <button class="btn" id="runMainGraphDOM">RUN [F6]</button>
      <button class="btn" id="stopMainGraphDOM">STOP</button>
      <span id="graph-status">\u26AB</span>
    </div>
  `;
    document.body.appendChild(this.editorMenu);
    this.editorMenu.querySelectorAll(".top-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const menu = e.target.nextElementSibling;
        this.editorMenu.querySelectorAll(".dropdown").forEach((d) => {
          if (d !== menu) d.style.display = "none";
        });
        menu.style.display = menu.style.display === "block" ? "none" : "block";
      });
    });
    byId("saveMainGraphDOM").addEventListener("click", () => {
      app.editor.fluxCodexVertex.compileGraph();
    });
    byId("runMainGraphDOM").addEventListener("click", () => {
      app.editor.fluxCodexVertex.runGraph();
    });
    this.toolTip.attachTooltip(byId("saveMainGraphDOM"), "Any changes in graph must be saved.");
    this.toolTip.attachTooltip(byId("runMainGraphDOM"), "Run main graph, sometimes engine need refresh.");
    this.toolTip.attachTooltip(byId("stopMainGraphDOM"), "Stop main graph, clear dynamic created objects.");
    byId("stopMainGraphDOM").addEventListener("click", () => {
      app.editor.fluxCodexVertex.clearRuntime();
    });
    document.addEventListener("click", (e) => {
      if (!this.editorMenu.contains(e.target)) {
        this.editorMenu.querySelectorAll(".dropdown").forEach((d) => {
          d.style.display = "none";
        });
      }
    });
    byId("fullScreenBtn").addEventListener("click", () => {
      this.FS.request();
    });
    this.toolTip.attachTooltip(byId("fullScreenBtn"), "Just editor gui part for fullscreen - not fullscreen for real program.");
    byId("showAITools").addEventListener("click", () => {
      byId("aiPopup").style.display = "flex";
    });
    this.toolTip.attachTooltip(byId("showAITools"), "Experimental stage, MEWGPU use open source ollama platform. Possible to create less complex - assets data not yet involment...");
    byId("hideEditorBtn").addEventListener("click", () => {
      this.editorMenu.style.display = "none";
      this.assetsBox.style.display = "none";
      this.sceneProperty.style.display = "none";
      this.sceneContainer.style.display = "none";
      byId("app").style.display = "none";
    });
    byId("bg-transparent").addEventListener("click", () => {
      byId("boardWrap").style.backgroundImage = "none";
    });
    this.toolTip.attachTooltip(byId("bg-transparent"), "Make visible both (mix) graphs and render.");
    byId("bg-tradicional").addEventListener("click", () => {
      byId("boardWrap").style.backgroundImage = "";
    });
    this.toolTip.attachTooltip(byId("bg-tradicional"), "Make visible graphs layout only.");
    if (byId("stop-watch")) byId("stop-watch").addEventListener("click", () => {
      document.dispatchEvent(new CustomEvent("stop-watch", {
        detail: {}
      }));
    });
    this.toolTip.attachTooltip(byId("stop-watch"), "Stops JavaScript compilers. Use this when working with Git, for example, to avoid unnecessary builds.");
    if (byId("start-watch")) byId("start-watch").addEventListener("click", () => {
      document.dispatchEvent(new CustomEvent("start-watch", {
        detail: {}
      }));
    });
    this.toolTip.attachTooltip(byId("start-watch"), "Start watch builds for JavaScript compilers.No need at start up - watcher already started on backend of editor.");
    if (byId("cnpBtn")) byId("cnpBtn").addEventListener("click", () => {
      let name2 = prompt("\u{1F4E6} Project name :", "MyProject1");
      let features = {
        physics: false,
        networking: false
      };
      if (confirm("\u269B Enable physics (Ammo)?")) {
        features.physics = true;
      }
      if (confirm("\u{1F50C} Enable networking (kurento/ov)?")) {
        features.networking = true;
      }
      console.log(features);
      document.dispatchEvent(new CustomEvent("cnp", {
        detail: {
          name: name2,
          features
        }
      }));
    });
    if (byId("cnpBtn")) this.toolTip.attachTooltip(byId("cnpBtn"), "Create new project. You must input project name.");
    byId("start-refresh").onclick = () => {
      location.reload(true);
    };
    if (byId("start-refresh")) this.toolTip.attachTooltip(byId("start-refresh"), "Simple refresh page.");
    if (byId("addCube")) byId("addCube").addEventListener("click", () => {
      let objName = prompt("\u{1F4E6} Enter uniq name: ");
      let o2 = {
        physics: false,
        index: objName
      };
      document.dispatchEvent(new CustomEvent("web.editor.addCube", {
        detail: o2
      }));
    });
    if (byId("addCube")) this.toolTip.attachTooltip(byId("addCube"), "Create Cube scene object with no physics.If you wanna objects who will be in kinematic also in physics regime (switching) then you need to use CubePhysics.");
    if (byId("addSphere")) byId("addSphere").addEventListener("click", () => {
      let objName = prompt("\u{1F4E6} Enter uniq name: ");
      let o2 = {
        physics: false,
        index: objName
      };
      document.dispatchEvent(new CustomEvent("web.editor.addSphere", {
        detail: o2
      }));
    });
    if (byId("addCubePhysics")) byId("addCubePhysics").addEventListener("click", () => {
      let objName = prompt("\u{1F4E6} Enter uniq name: ");
      let o2 = {
        physics: true,
        index: objName
      };
      document.dispatchEvent(new CustomEvent("web.editor.addCube", {
        detail: o2
      }));
    });
    if (byId("addSpherePhysics")) byId("addSpherePhysics").addEventListener("click", () => {
      let objName = prompt("\u{1F4E6} Enter uniq name: ");
      let o2 = {
        physics: true,
        index: objName
      };
      document.dispatchEvent(new CustomEvent("web.editor.addSphere", {
        detail: o2
      }));
    });
    byId("showCodeEditorBtn").addEventListener("click", (e) => {
      document.dispatchEvent(new CustomEvent("show-method-editor", { detail: {} }));
    });
    byId("showCurveEditorBtn").addEventListener("click", (e) => {
      document.dispatchEvent(new CustomEvent("show-curve-editor", { detail: {} }));
    });
    byId("showShaderEditorBtn").addEventListener("click", (e) => {
      if (byId("app").style.display == "flex") {
        byId("app").style.display = "none";
      }
      if (byId("shaderDOM") === null) {
        openFragmentShaderEditor().then((e2) => {
          app.shaderGraph = e2;
        });
      } else if (byId("shaderDOM").style.display === "flex") {
        byId("shaderDOM").style.display = "none";
      } else {
        byId("shaderDOM").style.display = "flex";
      }
    });
    byId("showVisualCodeEditorBtn").addEventListener("click", (e) => {
      if (byId("shaderDOM") && byId("shaderDOM").style.display == "flex") {
        byId("shaderDOM").style.display = "none";
      }
      if (byId("app").style.display == "flex") {
        byId("app").style.display = "none";
      } else {
        byId("app").style.display = "flex";
        if (this.core.editor.fluxCodexVertex) this.core.editor.fluxCodexVertex.updateLinks();
      }
    });
    byId("showCodeVARSBtn").addEventListener("click", (e) => {
      byId("app").style.display = "flex";
      byId("varsPopup").style.display = "flex";
      this.core.editor.fluxCodexVertex.updateLinks();
    });
    document.addEventListener("updateSceneContainer", (e) => {
      this.updateSceneContainer();
    });
    this.showAboutModal = () => {
      alert(`
  \u2714\uFE0F Support for 3D objects and scene transformations
  \u2714\uFE0F Ammo.js physics integration
  \u2714\uFE0F Networking with Kurento/OpenVidu/Own middleware Nodejs -> frontend
  \u2714\uFE0F Event system
  \u{1F3AF} Save system - direct code line [file-protocol]
  \u{1F3AF} Adding Visual Scripting System called 
     FlowCodexVertex (deactivete from top menu)(activate on pressing F4 key)
  \u{1F3AF} Adding Visual Scripting graph for shaders - FlowCodexShader.
     Source code: https://github.com/zlatnaspirala/matrix-engine-wgpu
     More at https://maximumroulette.com
        `);
    };
    byId("showAboutEditor").addEventListener("click", this.showAboutModal);
  }
  createGizmoIcons() {
    this.gizmoBox = document.createElement("div");
    this.assetsBox.id = "gizmoBox";
    Object.assign(this.gizmoBox.style, {
      position: "absolute",
      top: "0",
      left: "17.55%",
      width: "190px",
      height: "64px",
      backgroundColor: "transparent",
      display: "flex",
      alignItems: "start",
      color: "white",
      zIndex: "10",
      padding: "2px",
      boxSizing: "border-box",
      flexDirection: "row"
    });
    this.gizmoBox.innerHTML = `
    <div>
    <img id="mode0" data-mode="0" class="gizmo-icon" src="./res/textures/editor/0.png" width="48px" height="48px"/>
    <img id="mode1" data-mode="1" class="gizmo-icon" src="./res/textures/editor/1.png" width="48px" height="48px"/>
    <img id="mode2" data-mode="2" class="gizmo-icon" src="./res/textures/editor/2.png" width="48px" height="48px"/>
    </div>
    `;
    document.body.appendChild(this.gizmoBox);
    if (!document.getElementById("gizmo-style")) {
      const style = document.createElement("style");
      style.id = "gizmo-style";
      style.innerHTML = `
            .gizmo-icon {
                cursor: pointer;
                transition: all 0.2s ease-in-out;
                border-radius: 4px;
                padding: 4px;
            }
            /* Hover State */
            .gizmo-icon:hover {
                background-color: rgba(255, 255, 255, 0.15);
                transform: scale(1.1);
                filter: brightness(1.2);
            }
            /* Active/Click State */
            .gizmo-icon:active {
                transform: scale(0.95);
                background-color: rgba(255, 255, 255, 0.3);
            }
        `;
      document.head.appendChild(style);
    }
    const setMode = (e) => {
      let m = parseInt(e.target.getAttribute("data-mode"));
      dispatchEvent(new CustomEvent("editor-set-gizmo-mode", { detail: { mode: m } }));
      if (m == 0) {
        byId("mode0").style.border = "gray 1px solid";
        byId("mode1").style.border = "none";
        byId("mode2").style.border = "none";
      } else if (m == 1) {
        byId("mode0").style.border = "none";
        byId("mode1").style.border = "gray 1px solid";
        byId("mode2").style.border = "none";
      } else if (m == 2) {
        byId("mode0").style.border = "none";
        byId("mode1").style.border = "none";
        byId("mode2").style.border = "gray 1px solid";
      }
    };
    ["mode0", "mode1", "mode2"].forEach((id2) => {
      byId(id2).addEventListener("pointerdown", setMode);
    });
    this.toolTip.attachTooltip(byId("mode0"), `Set gizmo mode to 'translate'.
`);
    this.toolTip.attachTooltip(byId("mode1"), `Set gizmo mode to 'rotate'.
`);
    this.toolTip.attachTooltip(byId("mode2"), `Set gizmo mode to 'scale'.
`);
  }
  createAssets() {
    this.assetsBox = document.createElement("div");
    this.assetsBox.id = "assetsBox";
    Object.assign(this.assetsBox.style, {
      position: "absolute",
      bottom: "0",
      left: "17.55%",
      width: "63%",
      height: "250px",
      backgroundColor: "rgba(0,0,0,0.85)",
      display: "flex",
      alignItems: "start",
      color: "white",
      fontFamily: "'Orbitron', sans-serif",
      zIndex: "15",
      padding: "2px",
      boxSizing: "border-box",
      flexDirection: "column"
    });
    this.assetsBox.innerHTML = "ASSTES";
    this.assetsBox.innerHTML = `
    <div id="folderTitle" >Root</div>
    <div id="folderBack" class="scenePropItem" >...</div>
    <div id='res-folder' class="file-browser">
    </div>`;
    document.body.appendChild(this.assetsBox);
    byId("folderBack").addEventListener("click", () => {
      let getCurrent = byId("res-folder").getAttribute("data-root-folder");
      const t = getCurrent.substring(0, getCurrent.lastIndexOf("\\"));
      const last = t.substring(t.lastIndexOf("\\") + 1);
      if (last == "public") {
        return;
      }
      document.dispatchEvent(new CustomEvent("nav-folder", {
        detail: {
          rootFolder: t || "",
          name: ""
        }
      }));
    });
    this.toolTip.attachTooltip(byId("folderTitle"), `This represent real folders files present intro res folder (what ever is there).

    From assets box you can add glb or obj files direct with simple click. Everyting will be saved automatic.

    Support for mp3 adding by click also. No support for mp4 - mp4 can be added from 'Set Textures' node.
    `);
    document.addEventListener("la", (e) => {
      console.log(`%c[Editor]Root Resource Folder: ${e.detail.rootFolder}`, LOG_FUNNY_ARCADE2);
      byId("res-folder").setAttribute("data-root-folder", e.detail.rootFolder);
      byId("res-folder").innerHTML = "";
      e.detail.payload.forEach((i) => {
        let item = document.createElement("div");
        item.classList.add("file-item");
        if (i.isDir == true) {
          item.classList.add("folder");
        } else if (i.name.split(".")[1] == "jpg" || i.name.split(".")[1] == "png" || i.name.split(".")[1] == "jpeg") {
          item.classList.add("png");
        } else if (i.name.split(".")[1] == "mp3") {
          item.classList.add("mp3");
        } else if (i.name.split(".")[1] == "js") {
          item.classList.add("js");
        } else if (i.name.split(".")[1] == "ttf" || i.name.split(".")[1] == "ttf" || i.name.split(".")[1] == "TTF" || i.name.split(".")[1] == "otf" || i.name.split(".")[1] == "woff" || i.name.split(".")[1] == "woff2") {
          item.classList.add("ttf");
        } else if (i.name.split(".")[1] == "glb") {
          item.classList.add("glb");
        } else {
          item.classList.add("unknown");
        }
        item.innerHTML = "<p>" + i.name + "</p>";
        byId("res-folder").appendChild(item);
        item.addEventListener("click", (e2) => {
          if (i.isDir == true) document.dispatchEvent(new CustomEvent("nav-folder", {
            detail: {
              rootFolder: byId("res-folder").getAttribute("data-root-folder") || "",
              name: item.children[0].innerText
            }
          }));
          if (i.isDir == false) document.dispatchEvent(new CustomEvent("file-detail", {
            detail: {
              rootFolder: byId("res-folder").getAttribute("data-root-folder") || "",
              name: item.innerText
            }
          }));
        });
      });
      document.querySelectorAll(".file-item").forEach((el2) => {
        el2.addEventListener("click", () => {
          document.querySelectorAll(".file-item").forEach((x2) => x2.classList.remove("selected"));
          el2.classList.add("selected");
        });
      });
    });
  }
  createTopMenuPre() {
    this.editorMenu = document.createElement("div");
    this.editorMenu.id = "editorMenu";
    Object.assign(this.editorMenu.style, {
      position: "absolute",
      top: "0",
      left: "20%",
      width: "60%",
      height: "50px;",
      backgroundColor: "rgba(0,0,0,0.85)",
      display: "flex",
      alignItems: "start",
      color: "white",
      fontFamily: "'Orbitron', sans-serif",
      zIndex: "15",
      padding: "2px",
      boxSizing: "border-box",
      flexDirection: "row"
    });
    this.editorMenu.innerHTML = " PROJECT MENU  ";
    this.editorMenu.innerHTML = `
    <div class="top-item">
      <div class="top-btn">Project \u25BE</div>
      <div class="dropdown">
      <div id="cnpBtn" class="drop-item">\u{1F4E6} Create new project</div>
      <div id="loadProjectBtn" class="drop-item">\u{1F4C2} Load</div>
      </div>
    </div>

    <div class="top-item">
      <div class="top-btn">About \u25BE</div>
      <div class="dropdown">
        <div id="showAboutEditor" class="drop-item">matrix-engine-wgpu</div>
      </div>
    </div>
  `;
    document.body.appendChild(this.editorMenu);
    this.editorMenu.querySelectorAll(".top-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const menu = e.target.nextElementSibling;
        this.editorMenu.querySelectorAll(".dropdown").forEach((d) => {
          if (d !== menu) d.style.display = "none";
        });
        menu.style.display = menu.style.display === "block" ? "none" : "block";
      });
    });
    document.addEventListener("click", (e) => {
      if (!this.editorMenu.contains(e.target)) {
        this.editorMenu.querySelectorAll(".dropdown").forEach((d) => {
          d.style.display = "none";
        });
      }
    });
    if (byId("loadProjectBtn")) byId("loadProjectBtn").addEventListener("click", () => {
      document.dispatchEvent(new CustomEvent("lp", {
        detail: {}
      }));
    });
    if (byId("cnpBtn")) byId("cnpBtn").addEventListener("click", () => {
      let name2 = prompt("\u{1F4E6} Project name :", "MyProject1");
      let features = {
        physics: false,
        networking: false
      };
      if (confirm("\u269B Enable physics (Ammo)?")) {
        features.physics = true;
      }
      if (confirm("\u{1F50C} Enable networking (kurento/ov)?")) {
        features.networking = true;
      }
      console.log(features);
      document.dispatchEvent(new CustomEvent("cnp", {
        detail: {
          name: name2,
          features
        }
      }));
    });
    this.showAboutModal = () => {
      alert(`
  \u2714\uFE0F Support for 3D objects and scene transformations
  \u2714\uFE0F Ammo.js physics integration
  \u2714\uFE0F Networking with Kurento/OpenVidu/Own middleware Nodejs -> frontend
  \u2714\uFE0F Event system
  \u{1F3AF} Save system - direct code line [file-protocol]
  \u{1F3AF} Adding Visual Scripting System called 
     FlowCodexVertex (deactivete from top menu)(activate on pressing F4 key)
     Source code: https://github.com/zlatnaspirala/matrix-engine-wgpu
     More at https://maximumroulette.com
        `);
    };
    byId("showAboutEditor").addEventListener("click", this.showAboutModal);
  }
  createTopMenuInFly() {
    this.editorMenu = document.createElement("div");
    this.editorMenu.id = "editorMenu";
    Object.assign(this.editorMenu.style, {
      position: "absolute",
      top: "0",
      left: "20%",
      width: "60%",
      height: "50px;",
      backgroundColor: "rgba(0,0,0,0.85)",
      display: "flex",
      alignItems: "start",
      color: "white",
      fontFamily: "'Orbitron', sans-serif",
      zIndex: "15",
      padding: "2px",
      boxSizing: "border-box",
      flexDirection: "row"
    });
    this.editorMenu.innerHTML = " PROJECT MENU ";
    this.editorMenu.innerHTML = `
    <div>INFLY Regime of work no saves. Nice for runtime debugging or get data for map setup.</div>
    <div class="top-item">
      <div class="top-btn">About \u25BE</div>
      <div class="dropdown">
        <div id="showAboutEditor" class="drop-item">matrix-engine-wgpu</div>
      </div>
    </div>
  `;
    document.body.appendChild(this.editorMenu);
    this.editorMenu.querySelectorAll(".top-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const menu = e.target.nextElementSibling;
        this.editorMenu.querySelectorAll(".dropdown").forEach((d) => {
          if (d !== menu) d.style.display = "none";
        });
        menu.style.display = menu.style.display === "block" ? "none" : "block";
      });
    });
    document.addEventListener("click", (e) => {
      if (!this.editorMenu.contains(e.target)) {
        this.editorMenu.querySelectorAll(".dropdown").forEach((d) => {
          d.style.display = "none";
        });
      }
    });
    this.showAboutModal = () => {
      alert(`
  \u2714\uFE0F Support for 3D objects and scene transformations
  \u2714\uFE0F Ammo.js physics integration
  \u2714\uFE0F Networking with Kurento/OpenVidu/Own middleware Nodejs -> frontend
  \u2714\uFE0F Event system
  \u{1F3AF} Save system - direct code line [file-protocol]
     Adding Visual Scripting System called 
     flowCodexVertex (deactivete from top menu)(activate on pressing F4 key)
     Source code: https://github.com/zlatnaspirala/matrix-engine-wgpu
     More at https://maximumroulette.com
        `);
    };
    byId("showAboutEditor").addEventListener("click", this.showAboutModal);
  }
  createEditorSceneContainer() {
    this.sceneContainer = document.createElement("div");
    this.sceneContainer.id = "sceneContainer";
    Object.assign(this.sceneContainer.style, {
      position: "absolute",
      top: "0",
      left: "0",
      width: "17.5%",
      height: "100vh",
      backgroundColor: "rgb(75 75 75 / 85%)",
      display: "flex",
      alignItems: "start",
      overflow: "auto",
      color: "white",
      fontFamily: "'Orbitron', sans-serif",
      zIndex: "15",
      padding: "2px",
      boxSizing: "border-box",
      flexDirection: "column"
    });
    this.scene = document.createElement("div");
    this.scene.id = "scene";
    Object.assign(this.scene.style, {
      width: "100%",
      height: "100%",
      backgroundColor: "rgba(0,0,0,0.85)",
      display: "flex",
      alignItems: "start",
      color: "white",
      fontFamily: "'Orbitron', sans-serif",
      zIndex: "15",
      padding: "2px",
      boxSizing: "border-box",
      flexDirection: "column"
    });
    this.sceneContainerTitle = document.createElement("div");
    this.sceneContainerTitle.style.height = "30px";
    this.sceneContainerTitle.style.width = "-webkit-fill-available";
    this.sceneContainerTitle.style.fontSize = isMobile() == true ? "x-larger" : "larger";
    this.sceneContainerTitle.style.padding = "5px";
    this.sceneContainerTitle.innerHTML = "Scene container";
    this.sceneContainer.appendChild(this.sceneContainerTitle);
    this.sceneContainer.appendChild(this.scene);
    document.body.appendChild(this.sceneContainer);
  }
  updateSceneContainer() {
    this.scene.innerHTML = ``;
    this.core.mainRenderBundle.forEach((sceneObj) => {
      let so = document.createElement("div");
      so.style.height = "20px";
      so.classList.add("sceneContainerItem");
      so.innerHTML = sceneObj.name;
      so.addEventListener("click", this.updateSceneObjProperties);
      this.scene.appendChild(so);
    });
  }
  createScenePropertyBox() {
    this.sceneProperty = document.createElement("div");
    this.sceneProperty.id = "sceneProperty";
    this.sceneProperty.classList.add("scenePropItem");
    Object.assign(this.sceneProperty.style, {
      position: "absolute",
      top: "0",
      right: "0",
      width: "20%",
      height: "100vh",
      backgroundColor: "rgb(35 35 35 / 63%)",
      display: "flex",
      alignItems: "start",
      overflow: "auto",
      color: "white",
      fontFamily: "'Orbitron', sans-serif",
      zIndex: "15",
      padding: "2px",
      boxSizing: "border-box",
      flexDirection: "column"
    });
    this.objectProperies = document.createElement("div");
    this.objectProperies.id = "objectProperies";
    Object.assign(this.objectProperies.style, {
      width: "100%",
      height: "auto",
      backgroundColor: "rgba(0,0,0,0.85)",
      display: "flex",
      alignItems: "start",
      color: "white",
      fontFamily: "monospace",
      zIndex: "15",
      padding: "2px",
      boxSizing: "border-box",
      flexDirection: "column"
    });
    this.objectProperiesTitle = document.createElement("div");
    this.objectProperiesTitle.style.height = "40px";
    this.objectProperiesTitle.style.fontSize = "120%";
    this.objectProperiesTitle.innerHTML = "Scene object properties";
    this.sceneProperty.appendChild(this.objectProperiesTitle);
    this.sceneProperty.appendChild(this.objectProperies);
    document.body.appendChild(this.sceneProperty);
  }
  updateSceneObjProperties = (e) => {
    this.currentProperties = [];
    this.objectProperiesTitle.style.fontSize = "120%";
    this.objectProperiesTitle.innerHTML = `Scene object properties`;
    this.objectProperies.innerHTML = ``;
    const currentSO = this.core.getSceneObjectByName(e.target.innerHTML);
    this.objectProperiesTitle.innerHTML = `<span style="color:lime;">Name: ${e.target.innerHTML}</span> 
      <span style="color:yellow;"> [${currentSO.constructor.name}]`;
    const OK = Object.keys(currentSO);
    OK.forEach((prop) => {
      if (prop == "glb" && typeof currentSO[prop] !== "undefined" && currentSO[prop] != null) {
        this.currentProperties.push(new SceneObjectProperty(this.objectProperies, "glb", currentSO, this.core));
      } else {
        this.currentProperties.push(new SceneObjectProperty(this.objectProperies, prop, currentSO, this.core));
      }
    });
    this.currentProperties.push(new SceneObjectProperty(this.objectProperies, "editor-events", currentSO, this.core));
    if (navigator.clipboard) {
      navigator.clipboard.writeText(currentSO.name);
    } else {
      document.execCommand("copy", true, currentSO.name);
    }
  };
  updateSceneObjPropertiesFromGizmo = (name2) => {
    this.currentProperties = [];
    this.objectProperiesTitle.style.fontSize = "120%";
    this.objectProperiesTitle.innerHTML = `Scene object properties`;
    this.objectProperies.innerHTML = ``;
    const currentSO = this.core.getSceneObjectByName(name2);
    this.objectProperiesTitle.innerHTML = `<span style="color:lime;">Name: ${name2}</span> 
      <span style="color:yellow;"> [${currentSO.constructor.name}]`;
    const OK = Object.keys(currentSO);
    OK.forEach((prop) => {
      if (prop == "glb" && typeof currentSO[prop] !== "undefined" && currentSO[prop] != null) {
        this.currentProperties.push(new SceneObjectProperty(this.objectProperies, "glb", currentSO, this.core));
      } else {
        this.currentProperties.push(new SceneObjectProperty(this.objectProperies, prop, currentSO, this.core));
      }
    });
    this.currentProperties.push(new SceneObjectProperty(this.objectProperies, "editor-events", currentSO, this.core));
  };
};
var SceneObjectProperty = class {
  constructor(parentDOM, propName, currSceneObj, core) {
    this.core = core;
    this.subObjectsProps = [];
    this.propName = document.createElement("div");
    this.propName.style.width = "100%";
    if (propName == "device" || propName == "position" || propName == "rotation" || propName == "raycast" || propName == "entityArgPass" || propName == "scale" || propName == "maxInstances" || propName == "texturesPaths" || propName == "glb" || propName == "itIsPhysicsBody" || propName == "useScale") {
      this.propName.style.overflow = "hidden";
      this.propName.style.height = "20px";
      this.propName.style.borderBottom = "solid lime 2px";
      this.propName.addEventListener("click", (e) => {
        if (e.currentTarget.style.height != "fit-content") {
          this.propName.style.overflow = "unset";
          e.currentTarget.style.height = "fit-content";
        } else {
          this.propName.style.overflow = "hidden";
          e.currentTarget.style.height = "20px";
        }
      });
      if (propName == "itIsPhysicsBody") {
        this.propName.innerHTML = `<div style="text-align:left;" >${propName} <span style="border-radius:7px;background:green;">PhysicsBody</span>
        <span style="border-radius:6px;background:gray;">More info\u{1F53D}</span></div>`;
      } else if (propName == "position" || propName == "scale" || propName == "rotation" || propName == "glb") {
        this.propName.innerHTML = `<div style="text-align:left;" >${propName} <span style="border-radius:7px;background:purple;">sceneObj</span>
        <span style="border-radius:6px;background:gray;">More info\u{1F53D}</span></div>`;
      } else if (propName == "entityArgPass") {
        this.propName.innerHTML = `<div style="text-align:left;" >${propName} <span style="border-radius:7px;background:brown;">webGPU props</span>
        <span style="border-radius:6px;background:gray;">More info\u{1F53D}</span></div>`;
      } else if (propName == "maxInstances") {
        this.propName.innerHTML = `<div style="text-align:left;" >${propName} <span style="border-radius:7px;background:brown;">instanced</span>
        <span style="border-radius:6px;background:gray;"> <input type="number" value="${currSceneObj[propName]}" /> </span></div>`;
      } else if (propName == "useScale") {
        this.propName.innerHTML = `<div style="display:flex;" >useScale  + ${this.readBool(currSceneObj, propName)} </div>`;
      } else if (propName == "texturesPaths") {
        this.propName.innerHTML = `<div style="text-align:left;" >${propName} <span style="border-radius:7px;background:purple;">sceneObj</span>
         <span style="border-radius:6px;background:gray;"> 
           Path: ${currSceneObj[propName]} 
         </span>
           <div style="text-align:center;padding:5px;margin:5px;"> <img src="${currSceneObj[propName]}" width="256px" height="auto" /> </div>
        </div>`;
      } else {
        this.propName.innerHTML = `<div style="text-align:left;" >${propName} <span style="border-radius:7px;background:red;">sys</span> 
        <span style="border-radius:6px;background:gray;">${currSceneObj[propName]}</span></div>`;
      }
      if (currSceneObj[propName] && typeof currSceneObj[propName].adapterInfo !== "undefined") {
        this.exploreSubObject(currSceneObj[propName].adapterInfo, "adapterInfo").forEach((item) => {
          if (typeof item === "string") {
            this.propName.innerHTML += `<div style="text-align:left;"> ${item.split(":"[1])} </div>`;
          } else {
            item.addEventListener("click", (event) => {
              event.stopPropagation();
            });
            this.propName.appendChild(item);
          }
        });
      } else if (propName == "itIsPhysicsBody") {
        let body2 = this.core.matrixAmmo.getBodyByName(currSceneObj.name);
        for (let key in body2) {
          if (typeof body2[key] === "string") {
            this.propName.innerHTML += `<div style="display:flex;text-align:left;"> 
              <div style="background:black;color:white;width:35%;">${key}</div>
              <div style="background:lime;color:black;width:55%;">${body2[key]} </div>`;
          } else {
            let item = document.createElement("div");
            item.style.display = "flex";
            let funcNameDesc = document.createElement("span");
            funcNameDesc.style.background = "blue";
            funcNameDesc.style.width = "55%";
            funcNameDesc.innerHTML = key + ":";
            item.appendChild(funcNameDesc);
            if (typeof body2[key] === "function") {
              console.log("function");
              let physicsFuncDesc = document.createElement("select");
              item.appendChild(physicsFuncDesc);
            } else if (typeof body2[key] === "object") {
              console.log("OBJECT");
              let objDesc = document.createElement("span");
              objDesc.style.background = "yellow";
              objDesc.style.color = "black";
              objDesc.innerHTML = key;
              item.appendChild(objDesc);
            }
            item.addEventListener("click", (event) => {
              event.stopPropagation();
            });
            this.propName.style.textAlign = "left";
            this.propName.appendChild(item);
          }
        }
      } else if (propName == "position" || propName == "rotation" || propName == "raycast" || propName == "entityArgPass" || propName == "scale") {
        this.exploreSubObject(currSceneObj[propName], propName, currSceneObj).forEach((item) => {
          if (typeof item === "string") {
            this.propName.innerHTML += `<div style="text-align:left;"> ${item.split(":"[1])} </div>`;
          } else {
            item.addEventListener("click", (event) => {
              event.stopPropagation();
            });
            this.propName.appendChild(item);
          }
        });
      } else if (propName == "glb") {
        this.exploreGlb(currSceneObj[propName], propName, currSceneObj).forEach((item) => {
          if (typeof item === "string") {
            this.propName.innerHTML += `<div style="text-align:left;"> ${item.split(":"[1])} </div>`;
          } else {
            item.addEventListener("click", (event) => {
              event.stopPropagation();
            });
            this.propName.appendChild(item);
          }
        });
      } else if (propName == "itIsPhysicsBody") {
        this.propName.style.borderBottom = "solid lime 2px";
        this.propName.innerHTML = `<div style="text-align:left;" >${propName} <span style="border-radius:7px;background:deepskyblue;">boolean</span>
        <span style="border-radius:6px;background:gray;">${currSceneObj[propName]}</span></div>`;
      }
      parentDOM.appendChild(this.propName);
    } else if (propName == "isVideo") {
      this.propName.style.borderBottom = "solid lime 2px";
      this.propName.innerHTML = `<div style="text-align:left;" >${propName} <span style="border-radius:7px;background:deepskyblue;">boolean</span>
        <span style="border-radius:6px;background:gray;">${currSceneObj[propName]}</span></div>`;
      parentDOM.appendChild(this.propName);
    } else if (propName == "editor-events") {
      this.addEditorEventsProp(currSceneObj, parentDOM);
      this.addEditorDeleteAction(currSceneObj, parentDOM);
    } else {
    }
  }
  readBool(currSceneObj, rootKey) {
    return `
    <input type="checkbox"
      class="inputEditor"
      name="${rootKey}"
      ${currSceneObj[rootKey] == true ? "checked" : ""}
      onchange="
        console.log(this.checked, 'checkbox change fired');
        document.dispatchEvent(
          new CustomEvent('web.editor.input', {
            detail: {
              inputFor: ${currSceneObj ? "'" + currSceneObj.name + "'" : "'no info'"},
              propertyId: ${currSceneObj ? "'" + rootKey + "'" : "'no info'"},
              property: 'no info',
              value: this.checked
            }
          })
        );
      "
    />
  `;
  }
  exploreSubObject(subobj, rootKey, currSceneObj) {
    let a = [];
    let __ = [];
    for (const key in subobj) {
      __.push(key);
    }
    __.forEach((prop, index) => {
      if (index == 0) a.push(`${rootKey}`);
      let d = null;
      d = document.createElement("div");
      d.style.textAlign = "left";
      d.style.display = "flex";
      if (typeof subobj[prop] === "number") {
        d.innerHTML += `<div style="width:50%;">${prop}</div> 
         <div style="width:48%; background:lime;color:black;" > 

         <input class="inputEditor" name="${prop}" 
          onchange="console.log(this.value, 'change fired'); 
          document.dispatchEvent(new CustomEvent('web.editor.input', {detail: {
           'inputFor': ${currSceneObj ? "'" + currSceneObj.name + "'" : "'no info'"} ,
           'propertyId': ${currSceneObj ? "'" + rootKey + "'" : "'no info'"} ,
           'property': ${currSceneObj ? "'" + prop + "'" : "'no info'"} ,
           'value': ${currSceneObj ? "this.value" : "'no info'"}
          }}))" 
         ${rootKey == "adapterInfo" ? " disabled='true'" : " "} type="number" value="${isNaN(subobj[prop]) ? 0 : subobj[prop]}" /> 
        
         </div>`;
      } else if (Array.isArray(subobj[prop])) {
        d.innerHTML += `<div style="width:50%">${prop}</div> 
         <div style="width:${subobj[prop].length == 0 ? "unset" : "48%"}; background:lime;color:black;border-radius:5px;" > ${subobj[prop].length == 0 ? "[Empty array]" : subobj[prop]} </div>`;
      } else if (subobj[prop] === null) {
        d.innerHTML += `<div style="width:50%;">${prop}</div> 
         <div style="width:unset; background:lime;color:black;padding:1px;border-radius:5px;" >${subobj[prop]}</div>`;
      } else if (subobj[prop] == false) {
        d.innerHTML += `<div style="width:50%;">${prop}</div> 
         <div style="width:unset; background:lime;color:black;padding:1px;border-radius:5px;" >false</div>`;
      } else if (typeof subobj[prop] === "function") {
        d.innerHTML += `<div style="width:50%;">${prop}</div> 
         <div style="width:48%; background:lime;color:black;padding:1px;border-radius:5px;" >[Available from graph]</div>`;
      } else if (subobj[prop] == "") {
        d.innerHTML += `<div style="width:50%;">${prop}</div> 
         <div style="width:unset; background:lime;color:black;padding:1px;border-radius:5px;" >none</div>`;
      } else {
        d.innerHTML += `<div style="width:50%;">${prop}</div> 
         <div style="width:48%; background:lime;color:black;padding:1px;border-radius:5px;" >${subobj[prop]}</div>`;
      }
      a.push(d);
    });
    return a;
  }
  exploreGlb(subobj, rootKey, currSceneObj) {
    let a = [];
    let __ = [];
    for (const key in subobj) {
      __.push(key);
    }
    __.forEach((prop, index) => {
      if (index == 0) a.push(`${rootKey}`);
      let d = null;
      d = document.createElement("div");
      d.style.textAlign = "left";
      d.style.display = "flex";
      d.style.flexWrap = "wrap";
      if (typeof subobj[prop] === "number") {
        d.innerHTML += `<div style="width:50%;">${prop}</div> 
         <div style="width:48%; background:lime;color:black;" >
           <input
           class="inputEditor" name="${prop}" 
           ${prop === "animationIndex" ? "max='" + subobj["glbJsonData"]["animations"].length - 1 + "'" : ""}
             onchange="console.log(this.value, 'change fired'); 
            document.dispatchEvent(new CustomEvent('web.editor.input', {detail: {
             'inputFor': ${currSceneObj ? "'" + currSceneObj.name + "'" : "'no info'"} ,
             'propertyId': ${currSceneObj ? "'" + rootKey + "'" : "'no info'"} ,
             'property': ${currSceneObj ? "'" + prop + "'" : "'no info'"} ,
             'value': ${currSceneObj ? "this.value" : "'no info'"}
            }}))" 
           ${rootKey == "adapterInfo" ? "disabled='true'" : ""}" type="number" value="${subobj[prop]}" /> 
           </div>`;
      } else if (Array.isArray(subobj[prop]) && prop == "nodes") {
        d.innerHTML += `<div style="width:50%">${prop}</div> 
         <div style="width:${subobj[prop].length == 0 ? "unset" : "48%"}; background:lime;color:black;border-radius:5px;" > 
            ${subobj[prop].length == 0 ? "[Empty array]" : subobj[prop].length}
         </div>`;
      } else if (Array.isArray(subobj[prop]) && prop == "skins") {
        d.innerHTML += `<div style="width:50%">${prop}</div> 
         <div style="width:${subobj[prop].length == 0 ? "unset" : "48%"}; background:lime;color:black;border-radius:5px;" > 
            ${subobj[prop].length == 0 ? "[Empty array]" : subobj[prop].map((item) => {
          if (item && typeof item === "object" && "name" in item) {
            return item.name + " Joints:" + item.joints.length + "\n inverseBindMatrices:" + item.inverseBindMatrices;
          }
          return String(item);
        }).join(", ")}
         </div>`;
      } else if (prop == "glbJsonData") {
        console.log("init glbJsonData: " + rootKey);
        d.innerHTML += `<div style="width:50%">Animations:</div> 

         <div style="width:${subobj[prop].animations.length == 0 ? "unset" : "48%"}; background:lime;color:black;border-radius:5px;" > 
            ${subobj[prop].animations.length == 0 ? "[Empty array]" : subobj[prop].animations.map((item) => {
          if (item && typeof item === "object" && "name" in item) {
            return item.name;
          }
          return String(item);
        }).join(", ")}
         </div>
         

         <div style="width:50%">Skinned meshes:</div> 
         <div style="width:${subobj[prop].meshes.length == 0 ? "unset" : "48%"}; background:lime;color:black;border-radius:5px;" > 
            ${subobj[prop].meshes.length == 0 ? "[Empty array]" : subobj[prop].meshes.map((item) => {
          if (item && typeof item === "object" && "name" in item) {
            return item.name + " \n Primitives : " + item.primitives.length;
          }
          return String(item);
        }).join(", ")}
         </div>
          

         <div style="width:50%">Images:</div> 
         <div style="width:${subobj[prop].images.length == 0 ? "unset" : "48%"}; background:lime;color:black;border-radius:5px;" > 
            ${subobj[prop].images.length == 0 ? "[Empty array]" : subobj[prop].images.map((item) => {
          if (item && typeof item === "object" && "name" in item) {
            return "<div>" + item.name + " \n mimeType: " + item.mimeType + "</div>";
          }
          return String(item);
        }).join(", ")}
         </div>

         

         <div style="width:50%">Materials:</div> 
         <div style="width:${subobj[prop].materials.length == 0 ? "unset" : "48%"}; background:lime;color:black;border-radius:5px;" > 
            ${subobj[prop].materials.length == 0 ? "[Empty array]" : subobj[prop].materials.map((item) => {
          if (item && typeof item === "object" && "name" in item) {
            return "<div>" + item.name + " \n metallicFactor: " + item.pbrMetallicRoughness.metallicFactor + " \n roughnessFactor: " + item.pbrMetallicRoughness.roughnessFactor + "</div>";
          }
          return String(item);
        }).join(", ")}
         </div>
         
         `;
      } else if (subobj[prop] === null) {
        d.innerHTML += `<div style="width:50%;">${prop}</div> 
         <div style="width:unset; background:lime;color:black;padding:1px;border-radius:5px;" >${subobj[prop]}</div>`;
      } else if (subobj[prop] == false) {
        d.innerHTML += `<div style="width:50%;">${prop}</div> 
         <div style="width:unset; background:lime;color:black;padding:1px;border-radius:5px;" >false</div>`;
      } else if (subobj[prop] == "") {
        d.innerHTML += `<div style="width:50%;">${prop}</div> 
         <div style="width:unset; background:lime;color:black;padding:1px;border-radius:5px;" >none</div>`;
      } else {
        d.innerHTML += `<div style="width:50%;">${prop}</div> 
         <div style="width:48%; background:lime;color:black;padding:1px;border-radius:5px;" >${subobj[prop]}</div>`;
      }
      a.push(d);
    });
    return a;
  }
  addEditorEventsProp(currSceneObj, parentDOM) {
    this.propName.innerHTML += `<div>HIT</div>`;
    this.propName.innerHTML += `<div style='display:flex;'>
      <div style="align-content: center;">onTargetReached (NoPhysics)</div>
      <div><select id='sceneObjEditorPropEvents' ></select></div>
    </div>`;
    parentDOM.appendChild(this.propName);
    byId("sceneObjEditorPropEvents").onchange = (e) => {
      console.log("Event system selection:", e.target.value);
      if (e.target.value == "none") {
        currSceneObj.position.onTargetPositionReach = () => {
        };
        console.log("clear event");
        return;
      }
      const method = app.editor.methodsManager.methodsContainer.find(
        (m) => m.name === e.target.value
      );
      let F = app.editor.methodsManager.compileFunction(method.code);
      currSceneObj.position.onTargetPositionReach = F;
      console.log("[position.onTargetPositionReach][attached]", F);
    };
    byId("sceneObjEditorPropEvents").innerHTML = "";
    this.core.editor.methodsManager.methodsContainer.forEach((m, index) => {
      if (index == 0) {
        const op2 = document.createElement("option");
        op2.value = "none";
        op2.textContent = `none`;
        byId("sceneObjEditorPropEvents").appendChild(op2);
      }
      const op = document.createElement("option");
      op.value = m.name;
      op.textContent = `${m.name}  [${m.type}]`;
      byId("sceneObjEditorPropEvents").appendChild(op);
    });
  }
  addEditorDeleteAction(currSceneObj, parentDOM) {
    this.propName.innerHTML += `<div style='display:flex;'>
      <div style="align-content: center;color:red;">Delete sceneObject:</div>
      <div><button  data-sceneobject='${currSceneObj.name}' id='delete-${currSceneObj.name}'>DELETE</button></div>
    </div>`;
    byId(`delete-${currSceneObj.name}`).addEventListener("click", () => {
      if (this.core.mainRenderBundle.length <= 1) {
        alert("WARN - SCENE IS EMPTY IN EDITOR MODE YOU WILL GOT FREEZE - After adding first obj again you must refresh!");
      }
      let name2 = currSceneObj.name;
      let ruleOfNaming = name2;
      const underscoreIndex = name2.indexOf("_");
      const dashIndex = name2.indexOf("-");
      if (underscoreIndex === -1 || // no '_'
      dashIndex !== -1 && dashIndex < underscoreIndex) {
        ruleOfNaming = name2.split("-")[0];
      }
      alert(ruleOfNaming);
      document.dispatchEvent(new CustomEvent("web.editor.delete", {
        detail: { prefix: ruleOfNaming, fullName: currSceneObj.name }
      }));
    });
  }
};

// ../methodsManager.js
var MethodsManager = class {
  constructor(editorType) {
    this.editorType = editorType;
    this.methodsContainer = [];
    this.createUI();
    this.loadMethods(editorType).then((r2) => {
      this.methodsContainer = r2;
      this.refreshSelect();
      this.select.click();
    });
    document.addEventListener("show-method-editor", () => {
      this.popup.style.display = "block";
      this.wrapper.style.display = "block";
    });
    document.addEventListener("XcompileFunction", (e) => {
      this.compileFunction(e.detail.code);
    });
  }
  loadMethods = async (editorType) => {
    return new Promise(async (resolve, reject) => {
      if (editorType == "created from editor") {
        const page = location.pathname.split("/").pop().replace(".html", "");
        const file = `./${page}_methods.js`;
        let module;
        try {
          module = await import(file);
          if (module) {
            resolve(module.default);
          } else {
            reject([]);
          }
        } catch (err) {
          reject([]);
        }
      } else {
        resolve([]);
      }
    });
  };
  makePopupDraggable() {
    let isDragging = false;
    let offsetX = 0;
    let offsetY = 0;
    this.wrapper.style.cursor = "move";
    this.wrapper.addEventListener("mousedown", (e) => {
      isDragging = true;
      const rect = this.popup.getBoundingClientRect();
      offsetX = e.clientX - rect.left;
      offsetY = e.clientY - rect.top;
      this.popup.style.transition = "none";
    });
    document.addEventListener("mousemove", (e) => {
      if (!isDragging) return;
      this.popup.style.left = e.clientX - offsetX + "px";
      this.popup.style.top = e.clientY - offsetY + "px";
      this.popup.style.transform = "none";
    });
    document.addEventListener("mouseup", () => {
      if (isDragging) isDragging = false;
    });
  }
  createUI() {
    this.wrapper = document.createElement("div");
    this.wrapper.style.cssText = `
      padding: 10px; 
      background:#2f2f2f;
      border-radius:8px;
      color:#ddd; 
      font-family: monospace;
    `;
    this.select = document.createElement("select");
    this.select.style.cssText = `
      width:100%;
      padding:5px;
      background:#3a3a3a;
      color:#fff;
      border:1px solid #555;
      margin-bottom:10px;
    `;
    this.select.onchange = () => {
      console.log("CHANGE SCRIPT SELECT");
      const index = this.select.selectedIndex;
      const method = this.methodsContainer[index];
      if (!method) return;
      this.openEditor(method);
    };
    this.select.onclick = () => {
      const index = this.select.selectedIndex;
      const method = this.methodsContainer[index];
      if (method) this.openEditor(method);
    };
    this.managerTitle = document.createElement("p");
    this.managerTitle.innerText = "Custom Method Box";
    this.managerTitle.style.cssText = `
      width:100%;
      padding:6px;
      margin-top: -10px;
      color:#fff;
      background: unset;
      font-size: 140%;
      font-family: 'stormfaze';
    `;
    this.wrapper.appendChild(this.managerTitle);
    this.btnNew = document.createElement("button");
    this.btnNew.innerText = "New Method";
    this.btnNew.style.cssText = `
      width:30%;
      padding:6px;
      margin-left:10px;
      background:rgb(20 94 171);
      color:#fff;
      border:1px solid #555;
      cursor:pointer;
    `;
    this.btnNew.onclick = () => this.openEditor();
    this.wrapper.appendChild(this.select);
    this.popup = document.createElement("div");
    this.popup.style.cssText = `
      position:fixed;
      top:50%; left:50%;
      transform:translate(-50%,-50%);
      background:#2a2a2a;
      padding:20px;
      border:1px solid #555;
      border-radius:8px;
      display:none;
      width:30%;
      height: 75%;
      z-index:999;
    `;
    this.popup.appendChild(this.wrapper);
    this.btnRemove = document.createElement("button");
    this.btnRemove.innerText = "Remove method";
    this.btnRemove.style.cssText = `
        margin-top:10px;
        margin-left:10px;
        padding:6px 14px;
        background:#a33;
        color:#fff;
        border:1px solid #800;
        cursor:pointer;
      `;
    this.btnRemove.onclick = () => this.removeMethod();
    this.textarea = document.createElement("textarea");
    this.textarea.id = "code-editor-textarea";
    this.textarea.style.cssText = `
      width:99%; 
      height:78%; 
      background:#1e1e1e;
      font-size: larger;
      color:#fff; 
      border:1px solid #555;
      box-shadow: inset 0px 0px 10px 0px #3F51B5;
      -webkit-text-stroke-width:0;
    `;
    this.popup.appendChild(this.textarea);
    this.btnSave = document.createElement("button");
    this.btnSave.innerText = "Save method";
    this.btnSave.style.cssText = `
      margin-top:10px;
      padding:6px 14px;
      margin-left:10px;
      background:rgb(45 133 0);
      color:#fff;
      border:1px solid #666;
      cursor:pointer;
    `;
    this.btnSave.onclick = () => this.saveMethod();
    this.popup.appendChild(this.btnSave);
    this.popup.appendChild(this.btnRemove);
    this.popup.appendChild(this.btnNew);
    this.btnExit = document.createElement("button");
    this.btnExit.innerText = "Hide";
    this.btnExit.style.cssText = `
      margin-top:10px;
      padding:6px 14px;
      margin-left:10px;
      background:#555;
      color:#fff;
      border:1px solid #666;
      cursor:pointer;
    `;
    this.btnExit.onclick = () => {
      this.popup.style.display = "none";
    };
    this.popup.appendChild(this.btnExit);
    this.makePopupDraggable();
    document.body.appendChild(this.popup);
  }
  openEditor(existing) {
    this.editing = existing || null;
    this.textarea.value = existing ? existing.code : "";
  }
  saveMethod() {
    const code = this.textarea.value.trim();
    if (!code) return;
    const name2 = this.extractName(code);
    const obj2 = {
      name: name2,
      code,
      type: this.detectType(code),
      fn: this.compileFunction(code),
      intervalId: null
    };
    if (obj2.type === "interval") {
      obj2.intervalId = obj2.fn();
    }
    if (this.editing) {
      const idx = this.methodsContainer.indexOf(this.editing);
      this.methodsContainer[idx] = obj2;
    } else {
      this.methodsContainer.push(obj2);
    }
    this.refreshSelect();
    this.popup.style.display = "none";
    document.dispatchEvent(new CustomEvent("save-methods", {
      detail: {
        methodsContainer: this.methodsContainer
      }
    }));
  }
  removeMethod() {
    if (!this.editing) return;
    const idx = this.methodsContainer.indexOf(this.editing);
    if (idx === -1) return;
    if (this.methodsContainer[idx].intervalId) {
      clearInterval(this.methodsContainer[idx].intervalId);
    }
    this.methodsContainer.splice(idx, 1);
    this.editing = null;
    this.refreshSelect();
    this.textarea.value = "";
    document.dispatchEvent(new CustomEvent("save-methods", {
      detail: {
        methodsContainer: this.methodsContainer
      }
    }));
  }
  refreshSelect() {
    this.select.innerHTML = "";
    this.methodsContainer.forEach((m) => {
      const op = document.createElement("option");
      op.textContent = `${m.name}  [${m.type}]`;
      this.select.appendChild(op);
    });
  }
  extractName(code) {
    const match = code.match(/function\s+([a-zA-Z0-9_]+)/);
    return match ? match[1] : "method_" + (this.methodsContainer.length + 1);
  }
  detectType(code) {
    if (code.includes("setInterval")) return "interval";
    if (code.includes("return")) return "return";
    return "void";
  }
  compileFunction(code) {
    try {
      const fn = new Function(code + "; return " + this.extractName(code) + ";")();
      return fn;
    } catch (e) {
      console.error("Compilation error:", e);
      return () => {
      };
    }
  }
  destroyIntervals() {
    this.methodsContainer.forEach((m) => {
      if (m.intervalId) clearInterval(m.intervalId);
    });
  }
};

// ../editor.js
var Editor = class {
  constructor(core, a, projName) {
    this.core = core;
    this.toolTip = new METoolTip();
    this.methodsManager = new MethodsManager(this.check(a));
    this.editorHud = new EditorHud(core, this.check(a), this.toolTip);
    this.editorProvider = new EditorProvider(core, this.check(a));
    if (this.check(a) == "pre editor") {
      this.client = new MEEditorClient(this.check(a));
    } else if (this.check(a) == "created from editor") {
      document.addEventListener("editorx-ws-ready", () => {
        openFragmentShaderEditor().then((e) => {
          byId("shaderDOM").style.display = "none";
          app.shaderGraph = e;
        });
      });
      this.client = new MEEditorClient(this.check(a), projName);
      this.createFluxCodexVertexDOM();
      setTimeout(() => {
        console.log("MOMENT BEFORE COSTRUCT MAIN FLUXCODEXVERTEX GRAPH");
        this.fluxCodexVertex = new FluxCodexVertex("board", "boardWrap", "log", this.methodsManager, projName, this.toolTip);
        setTimeout(() => {
          this.fluxCodexVertex.updateLinks();
        }, 2500);
      }, 1e3);
    }
  }
  check(a) {
    if (typeof a !== "undefined" && a == "created from editor") {
      return a;
    } else if (typeof a !== "undefined" && a == "pre editor") {
      return a;
    } else {
      return "infly";
    }
  }
  createFluxCodexVertexDOM() {
    let FCV = document.createElement("div");
    FCV.id = "app";
    FCV.style.display = "none";
    FCV.style.opacity = 1;
    FCV.innerHTML = `
    <div id="leftBar">
      <span>Declaration</span>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.addNode('setProductionMode')">Set ProductionMode</button>
      <span>Events/Func</span>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.addNode('event')">Event: onLoad</button>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.addNode('onDraw')">Event: onDraw</button>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.addNode('onKey')">Event: onKey</button>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.addNode('eventCustom')">Custom Event</button>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.addNode('dispatchEvent')">Dispatch Event</button>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.addNode('function')">Function</button>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.addNode('if')">If Branch</button>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.addNode('genrand')">GenRandInt</button>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.addNode('print')">Print</button>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.addNode('timeout')">SetTimeout</button>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.addNode('getArray')">getArray</button>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.addNode('forEach')">forEach</button>
      <span>Scene objects [agnostic]</span>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.addNode('getSceneObject')">Get scene object</button>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.addNode('addObj')">Add OBJ</button>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.addNode('getObjectAnimation')">Get Object Animation</button>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.addNode('setPosition')">Set position</button>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.addNode('getShaderGraph')">Set Shader Graph</button>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.addNode('setMaterial')">Set Material</button>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.addNode('setBlend')">Set Blend</button>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.addNode('setSpeed')">Set Speed</button>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.addNode('getSpeed')">Get Speed</button>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.addNode('setRotation')">Set rotation</button>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.addNode('setRotate')">Set Rotate</button>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.addNode('setRotateX')">Set RotateX</button>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.addNode('setRotateY')">Set RotateY</button>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.addNode('setRotateZ')">Set RotateZ</button>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.addNode('setTexture')">Set Texture</button>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.addNode('translateByX')">TranslateByX</button>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.addNode('translateByY')">TranslateByY</button>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.addNode('translateByZ')">TranslateByZ</button>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.addNode('onTargetPositionReach')">onTarget PositionReach</button>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.addNode('rayHitEvent')">Ray Hit Event</button>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.addNode('setWaterParams')">Set Water Material Params</button>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.addNode('setVertexAnim')">Set VertexAnim Intesity</button>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.addNode('setVertexWave')">Set Vertex Wave</button>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.addNode('setVertexWind')">Set Vertex Wind</button>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.addNode('setVertexPulse')">Set Vertex Pulse</button>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.addNode('setVertexTwist')">Set Vertex Twist</button>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.addNode('setVertexNoise')">Set Vertex Noise</button>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.addNode('setVertexOcean')">Set Vertex Ocean</button>
      <span>Dinamics</span>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.addNode('dynamicFunction')">Function Dinamic</button>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.addNode('getSubObject')">Get Sub Object</button>
      <span>Data mod</span>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.addNode('curveTimeline')">Curve Timeline</button>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.addNode('oscillator')">Oscillator</button>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.addNode('getNumberLiteral')">Get Number Literal</button>
      <span>Networking</span>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.addNode('fetch')">Fetch</button>
      <span>Media</span>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.addNode('audioMP3')">Add Mp3</button>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.addNode('setVideoTexture')">Set Video Tex[Mp4]</button>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.addNode('setCanvasInlineTexture')">Set Canvas2d Inline Tex</button>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.addNode('audioReactiveNode')">Audio Reactive Node</button>
      <span>Physics</span>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.addNode('generator')">Generator in place</button>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.addNode('generatorWall')">Generate Wall</button>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.addNode('generatorPyramid')">Generate Pyramid</button>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.addNode('setForceOnHit')">Set Force On Hit</button>
      <span>String Operations</span>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.addNode('startsWith')">Starts With</button>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.addNode('startsWith')">Starts With</button>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.addNode('endsWith')">Ends With</button>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.addNode('includes')">includes</button>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.addNode('toUpperCase')">toUpperCase</button>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.addNode('toLowerCase')">toLowerCase</button>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.addNode('trim')">Trim</button>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.addNode('length')">Length</button>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.addNode('substring')">Substring</button>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.addNode('startsWith')">Replace</button>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.addNode('startsWith')">Split</button>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.addNode('concat')">Concat</button>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.addNode('isEmpty')">isEmpty</button>

      <span>Math</span>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.addNode('add')">Add (+)</button>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.addNode('sub')">Sub (-)</button>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.addNode('mul')">Mul (*)</button>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.addNode('div')">Div (/)</button>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.addNode('sin')">Sin</button>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.addNode('cos')">Cos</button>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.addNode('pi')">Pi</button>
      <span>COMPARISON</span>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.addNode('equal')">Equal (==)</button>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.addNode('notequal')">Not Equal (!=)</button>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.addNode('greater')">Greater (>)</button>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.addNode('less')">Less (<)</button>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.addNode('greaterEqual')">Greater/Equal (>=)</button>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.addNode('lessEqual')">Less/Equal (<=)</button>
      <hr style="border:none; height:1px; background:rgba(255,255,255,0.03); margin:10px 0;">
      <span>Compile FluxCodexVertex</span>
      <button style="color:#00bcd4;" class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.compileGraph()">Save Graph</button>
      <button style="color:#00bcd4;" class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.clearStorage();">Clear All</button>
      <button style="color:#00bcd4;" class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.runGraph()">Run (F6)</button>
      <hr style="border:none; height:1px; background:rgba(255,255,255,0.03); margin:10px 0;">
      <button style="color: lime;" class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.exportToJSON()">Export (JSON)</button>
      <button style="color: lime;" class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex._importInput.click()">Import (JSON)</button>

      <pre id="log" aria-live="polite"></pre>
    </div>
    <div id="boardWrap">
      <div id="board">
        <svg class="connections"></svg>
      </div>
    </div>
    `;
    document.body.appendChild(FCV);
  }
};

// ../../../engine/postprocessing/bloom.js
var BloomPass = class {
  constructor(width, height, device2, intensity = 1.5) {
    this.enabled = false;
    this.device = device2;
    this.width = width;
    this.height = height;
    this.brightTex = this._createTexture();
    this.blurTexA = this._createTexture();
    this.blurTexB = this._createTexture();
    this.sampler = device2.createSampler({
      magFilter: "linear",
      minFilter: "linear"
    });
    this.intensityBuffer = this._createUniformBuffer([intensity]);
    this.blurDirX = this._createUniformBuffer([1, 0]);
    this.blurDirY = this._createUniformBuffer([0, 1]);
    this.params = {
      intensity,
      threshold: 0.6,
      knee: 0.5,
      blurRadius: 6
    };
    this.paramBuffer = this.device.createBuffer({
      size: 16,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });
    this._updateParams();
    this.brightPipeline = this._createPipeline(
      brightPassWGSL(),
      [
        { binding: 0, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: "float" } },
        { binding: 1, visibility: GPUShaderStage.FRAGMENT, sampler: { type: "filtering" } },
        { binding: 2, visibility: GPUShaderStage.FRAGMENT, buffer: { type: "uniform" } }
      ]
    );
    this.blurPipeline = this._createPipeline(
      blurPassWGSL(),
      [
        { binding: 0, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: "float" } },
        { binding: 1, visibility: GPUShaderStage.FRAGMENT, sampler: { type: "filtering" } },
        { binding: 2, visibility: GPUShaderStage.FRAGMENT, buffer: { type: "uniform" } },
        { binding: 3, visibility: GPUShaderStage.FRAGMENT, buffer: { type: "uniform" } }
      ]
    );
    this.combinePipeline = this._createPipeline(
      combinePassWGSL(),
      [
        { binding: 0, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: "float" } },
        { binding: 1, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: "float" } },
        { binding: 2, visibility: GPUShaderStage.FRAGMENT, sampler: { type: "filtering" } },
        { binding: 3, visibility: GPUShaderStage.FRAGMENT, buffer: { type: "uniform" } }
      ]
    );
  }
  _createTexture() {
    return this.device.createTexture({
      size: [this.width, this.height],
      format: "rgba16float",
      usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING
    });
  }
  _createPipeline(fragmentWGSL2, bindGroupLayoutEntries) {
    const bindGroupLayout = this.device.createBindGroupLayout({
      entries: bindGroupLayoutEntries
    });
    return this.device.createRenderPipeline({
      layout: this.device.createPipelineLayout({
        bindGroupLayouts: [bindGroupLayout]
      }),
      vertex: {
        module: this.device.createShaderModule({ code: fullscreenQuadWGSL() }),
        entryPoint: "vert"
      },
      fragment: {
        module: this.device.createShaderModule({ code: fragmentWGSL2 }),
        entryPoint: "main",
        targets: [{ format: "rgba16float" }]
      },
      primitive: { topology: "triangle-list" }
    });
  }
  _updateParams() {
    this.device.queue.writeBuffer(
      this.paramBuffer,
      0,
      new Float32Array([
        this.params.intensity,
        this.params.threshold,
        this.params.knee,
        this.params.blurRadius
      ])
    );
  }
  setIntensity = (v) => {
    this.params.intensity = v;
    this._updateParams();
  };
  setThreshold = (v) => {
    this.params.threshold = v;
    this._updateParams();
  };
  setKnee = (v) => {
    this.params.knee = v;
    this._updateParams();
  };
  setBlurRadius = (v) => {
    this.params.blurRadius = v;
    this._updateParams();
  };
  _createUniformBuffer(data) {
    const buffer = this.device.createBuffer({
      size: 16,
      // std140 safe
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });
    this.device.queue.writeBuffer(buffer, 0, new Float32Array(data));
    return buffer;
  }
  _brightBindGroup(view) {
    return this.device.createBindGroup({
      layout: this.brightPipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: view },
        { binding: 1, resource: this.sampler },
        { binding: 2, resource: { buffer: this.paramBuffer } }
      ]
    });
  }
  _blurBindGroup(view, dirBuffer) {
    return this.device.createBindGroup({
      layout: this.blurPipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: view },
        { binding: 1, resource: this.sampler },
        { binding: 2, resource: { buffer: dirBuffer } },
        { binding: 3, resource: { buffer: this.paramBuffer } }
      ]
    });
  }
  _combineBindGroup(sceneView, bloomView) {
    return this.device.createBindGroup({
      layout: this.combinePipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: sceneView },
        { binding: 1, resource: bloomView },
        { binding: 2, resource: this.sampler },
        { binding: 3, resource: { buffer: this.paramBuffer } }
      ]
    });
  }
  _beginFullscreenPass(encoder, targetView) {
    return encoder.beginRenderPass({
      colorAttachments: [{
        view: targetView,
        loadOp: "clear",
        storeOp: "store",
        clearValue: { r: 0, g: 0, b: 0, a: 1 }
      }]
    });
  }
  render(encoder, sceneView, finalTargetView) {
    {
      const pass2 = this._beginFullscreenPass(encoder, this.brightTex.createView());
      pass2.setPipeline(this.brightPipeline);
      pass2.setBindGroup(0, this._brightBindGroup(sceneView));
      pass2.draw(6);
      pass2.end();
    }
    {
      const pass2 = this._beginFullscreenPass(encoder, this.blurTexA.createView());
      pass2.setPipeline(this.blurPipeline);
      pass2.setBindGroup(0, this._blurBindGroup(this.brightTex.createView(), this.blurDirX));
      pass2.draw(6);
      pass2.end();
    }
    {
      const pass2 = this._beginFullscreenPass(encoder, this.blurTexB.createView());
      pass2.setPipeline(this.blurPipeline);
      pass2.setBindGroup(0, this._blurBindGroup(this.blurTexA.createView(), this.blurDirY));
      pass2.draw(6);
      pass2.end();
    }
    {
      const pass2 = this._beginFullscreenPass(encoder, finalTargetView);
      pass2.setPipeline(this.combinePipeline);
      pass2.setBindGroup(
        0,
        this._combineBindGroup(sceneView, this.blurTexB.createView())
      );
      pass2.draw(6);
      pass2.end();
    }
  }
};
function fullscreenQuadWGSL() {
  return `
    @vertex
    fn vert(@builtin(vertex_index) i : u32) -> @builtin(position) vec4<f32> {
      var pos = array<vec2<f32>, 6>(
        vec2(-1.0, -1.0), vec2(1.0, -1.0), vec2(-1.0, 1.0),
        vec2(-1.0, 1.0), vec2(1.0, -1.0), vec2(1.0, 1.0)
      );
      return vec4(pos[i], 0.0, 1.0);
    }
  `;
}
function brightPassWGSL() {
  return `
    struct BloomParams {
    intensity: f32,
    threshold: f32,
    knee: f32,
    radius: f32,
  };
    @group(0) @binding(0) var tex: texture_2d<f32>;
    @group(0) @binding(1) var samp: sampler;
    @group(0) @binding(2) var<uniform> bloom: BloomParams;
    @fragment
    fn main(@builtin(position) p: vec4<f32>) -> @location(0) vec4<f32> {
      let size = vec2<f32>(textureDimensions(tex));
      let uv = p.xy / size;
      let c = textureSample(tex, samp, uv).rgb;
      let lum = dot(c, vec3<f32>(0.2126,0.7152,0.0722));
      let x = max(lum - bloom.threshold, 0.0);
      let w = x * x / (x + bloom.knee);
      return vec4(c * w, 1.0);
    }
  `;
}
function blurPassWGSL() {
  return `
   struct BloomParams {
    intensity: f32,
    threshold: f32,
    knee: f32,
    radius: f32,
  };

  @group(0) @binding(0) var tex: texture_2d<f32>;
  @group(0) @binding(1) var samp: sampler;
  @group(0) @binding(2) var<uniform> dir: vec2<f32>;
  @group(0) @binding(3) var<uniform> bloom: BloomParams;

  @fragment
  fn main(@builtin(position) p: vec4<f32>) -> @location(0) vec4<f32> {
    let size = vec2<f32>(textureDimensions(tex));
    let uv = p.xy / size;
    let r = bloom.radius;
    let o = array<f32,5>(-r, -r*0.5, 0.0, r*0.5, r);
    let w = array<f32,5>(0.1,0.2,0.4,0.2,0.1);
    var col = vec3(0.0);
    for(var i=0;i<5;i++){
      col += textureSample(tex, samp, uv + o[i]*dir/size).rgb * w[i];
    }
    return vec4(col,1.0);
  }
`;
}
function combinePassWGSL() {
  return `
  struct BloomParams {
    intensity: f32,
    threshold: f32,
    knee: f32,
    radius: f32,
  };
  @group(0) @binding(0) var origTex: texture_2d<f32>;
  @group(0) @binding(1) var bloomTex: texture_2d<f32>;
  @group(0) @binding(2) var samp: sampler;
  @group(0) @binding(3) var<uniform> bloom: BloomParams;

  @fragment
  fn main(@builtin(position) p: vec4<f32>) -> @location(0) vec4<f32> {
    let size = vec2<f32>(textureDimensions(origTex));
    let uv = p.xy / size;

    let origColor = textureSample(origTex, samp, uv).rgb;
    let bloomColor = textureSample(bloomTex, samp, uv).rgb;

    // additive bloom
    let color = origColor + bloomColor * bloom.intensity;

    return vec4(color, 1.0);
  }
`;
}

// ../../../engine/raycast.js
var touchCoordinate = {
  enabled: false,
  x: 0,
  y: 0,
  stopOnFirstDetectedHit: false
};
function getRayFromMouse(event, canvas, camera) {
  const rect = canvas.getBoundingClientRect();
  const x2 = (event.clientX - rect.left) / rect.width * 2 - 1;
  const y2 = -((event.clientY - rect.top) / rect.height * 2 - 1);
  const invProjection = mat4Impl.inverse(camera.projectionMatrix);
  const invView = mat4Impl.inverse(camera.view);
  const clip = [x2, y2, 1, 1];
  let eye = vec4Impl.transformMat4(clip, invProjection);
  eye = [eye[0], eye[1], -1, 0];
  const worldDir4 = vec4Impl.transformMat4(eye, invView);
  const rayDirection = vec3Impl.normalize([worldDir4[0], worldDir4[1], worldDir4[2]]);
  const rayOrigin = [...camera.position];
  return { rayOrigin, rayDirection, screen: { x: x2, y: y2 } };
}
function rayIntersectsSphere(rayOrigin, rayDirection, sphereCenter, sphereRadius) {
  const center = [sphereCenter.x, sphereCenter.y, sphereCenter.z];
  const oc = vec3Impl.subtract(rayOrigin, center);
  const a = vec3Impl.dot(rayDirection, rayDirection);
  const b = 2 * vec3Impl.dot(oc, rayDirection);
  const c = vec3Impl.dot(oc, oc) - sphereRadius * sphereRadius;
  const discriminant = b * b - 4 * a * c;
  if (discriminant < 0) return null;
  const t = (-b - Math.sqrt(discriminant)) / (2 * a);
  if (t < 0) return null;
  const hitPoint = vec3Impl.add(rayOrigin, vec3Impl.mulScalar(rayDirection, t));
  const hitNormal = vec3Impl.normalize(vec3Impl.subtract(hitPoint, center));
  return { t, hitPoint, hitNormal };
}
function computeAABB(vertices) {
  const min2 = [Infinity, Infinity, Infinity];
  const max2 = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < vertices.length; i += 3) {
    min2[0] = Math.min(min2[0], vertices[i]);
    min2[1] = Math.min(min2[1], vertices[i + 1]);
    min2[2] = Math.min(min2[2], vertices[i + 2]);
    max2[0] = Math.max(max2[0], vertices[i]);
    max2[1] = Math.max(max2[1], vertices[i + 1]);
    max2[2] = Math.max(max2[2], vertices[i + 2]);
  }
  return [min2, max2];
}
function rayIntersectsAABB(rayOrigin, rayDirection, boxMin, boxMax) {
  let tmin = (boxMin[0] - rayOrigin[0]) / rayDirection[0];
  let tmax = (boxMax[0] - rayOrigin[0]) / rayDirection[0];
  if (tmin > tmax) [tmin, tmax] = [tmax, tmin];
  let tymin = (boxMin[1] - rayOrigin[1]) / rayDirection[1];
  let tymax = (boxMax[1] - rayOrigin[1]) / rayDirection[1];
  if (tymin > tymax) [tymin, tymax] = [tymax, tymin];
  if (tmin > tymax || tymin > tmax) return null;
  if (tymin > tmin) tmin = tymin;
  if (tymax < tmax) tmax = tymax;
  let tzmin = (boxMin[2] - rayOrigin[2]) / rayDirection[2];
  let tzmax = (boxMax[2] - rayOrigin[2]) / rayDirection[2];
  if (tzmin > tzmax) [tzmin, tzmax] = [tzmax, tzmin];
  if (tmin > tzmax || tzmin > tmax) return null;
  const t = Math.max(tmin, 0);
  const hitPoint = vec3Impl.add(rayOrigin, vec3Impl.mulScalar(rayDirection, t));
  return { t, hitPoint };
}
function computeWorldVertsAndAABB(object) {
  const modelMatrix = object.getModelMatrix(object.position);
  const worldVerts = [];
  for (let i = 0; i < object.mesh.vertices.length; i += 3) {
    const local = [object.mesh.vertices[i], object.mesh.vertices[i + 1], object.mesh.vertices[i + 2]];
    const world = vec3Impl.transformMat4(local, modelMatrix);
    worldVerts.push(...world);
  }
  const [boxMin, boxMax] = computeAABB(worldVerts);
  return { modelMatrix, worldVerts, boxMin, boxMax };
}
function dispatchRayHitEvent(canvas, data) {
  if (data.eventName == "click") {
    canvas.dispatchEvent(new CustomEvent("ray.hit.event", { detail: data }));
  } else if (data.eventName == "mousedown") {
    canvas.dispatchEvent(new CustomEvent("ray.hit.mousedown", { detail: data }));
  } else {
    canvas.dispatchEvent(new CustomEvent("ray.hit.event.mm", { detail: data }));
  }
}
function addRaycastsListener(canvasId = "canvas1", eventName = "click") {
  const canvas = document.getElementById(canvasId);
  if (!canvas) {
    console.warn(`[Raycaster] Canvas with id '${canvasId}' not found.`);
    return;
  }
  canvas.addEventListener(eventName, (event) => {
    const camera = app.cameras[app.mainCameraParams.type];
    const { rayOrigin, rayDirection, screen } = getRayFromMouse(event, canvas, camera);
    let closestHit = null;
    for (const object of app.mainRenderBundle) {
      if (!object.raycast?.enabled) continue;
      const { boxMin, boxMax } = computeWorldVertsAndAABB(object);
      const hitAABB = rayIntersectsAABB(rayOrigin, rayDirection, boxMin, boxMax);
      if (!hitAABB) continue;
      const sphereHit = rayIntersectsSphere(rayOrigin, rayDirection, object.position, object.raycast.radius);
      const hit = sphereHit || hitAABB;
      if (hit && (!closestHit || hit.t < closestHit.t)) {
        closestHit = { ...hit, hitObject: object };
        if (touchCoordinate.stopOnFirstDetectedHit) break;
      }
    }
    if (closestHit) {
      dispatchRayHitEvent(canvas, {
        hitObject: closestHit.hitObject,
        hitPoint: closestHit.hitPoint,
        hitNormal: closestHit.hitNormal || null,
        hitDistance: closestHit.t,
        rayOrigin,
        rayDirection,
        screenCoords: screen,
        camera,
        timestamp: performance.now(),
        button: event.button,
        eventName
      });
    }
  });
}

// ../../../engine/generators/generator.js
function stabilizeTowerBody(body2) {
  body2.setDamping(0.8, 0.95);
  body2.setSleepingThresholds(0.4, 0.4);
  body2.setAngularFactor(new Ammo.btVector3(0.1, 0.1, 0.1));
  body2.setFriction(1);
  body2.setRollingFriction(0.8);
}
function physicsBodiesGenerator(material = "standard", pos2, rot2, texturePath2, name2 = "gen1", geometry = "Cube", raycast2 = false, scale4 = [1, 1, 1], sum2 = 100, delay2 = 500, mesh = null) {
  let engine = this;
  const inputCube = { mesh: "./res/meshes/blender/cube.obj" };
  const inputSphere = { mesh: "./res/meshes/blender/sphere.obj" };
  function handler(m) {
    let RAY = { enabled: raycast2 == true ? true : false, radius: 1 };
    for (var x2 = 0; x2 < sum2; x2++) {
      setTimeout(() => {
        engine.addMeshObj({
          material: { type: material },
          position: pos2,
          rotation: rot2,
          rotationSpeed: { x: 0, y: 0, z: 0 },
          texturesPaths: [texturePath2],
          name: name2 + "_" + x2,
          mesh: m.mesh,
          physics: {
            enabled: true,
            geometry
          },
          raycast: RAY
        });
        const o2 = app.getSceneObjectByName(cubeName);
        runtimeCacheObjs.push(o2);
      }, x2 * delay2);
    }
  }
  if (geometry == "Cube") {
    downloadMeshes(inputCube, handler, { scale: scale4 });
  } else if (geometry == "Sphere") {
    downloadMeshes(inputSphere, handler, { scale: scale4 });
  }
}
function physicsBodiesGeneratorWall(material = "standard", pos2, rot2, texturePath2, name2 = "wallCube", size2 = "10x3", raycast2 = false, scale4 = [1, 1, 1], spacing2 = 2, delay2 = 200) {
  const engine = this;
  const [width, height] = size2.toLowerCase().split("x").map((n2) => parseInt(n2, 10));
  const inputCube = { mesh: "./res/meshes/blender/cube.obj" };
  function handler(m) {
    let index = 0;
    const RAY = { enabled: !!raycast2, radius: 1 };
    for (let y2 = 0; y2 < height; y2++) {
      for (let x2 = 0; x2 < width; x2++) {
        const cubeName2 = `${name2}_${index}`;
        setTimeout(() => {
          engine.addMeshObj({
            material: { type: material },
            position: {
              x: pos2.x + x2 * spacing2,
              y: pos2.y + y2 * spacing2 - 2.8,
              z: pos2.z
            },
            rotation: rot2,
            rotationSpeed: { x: 0, y: 0, z: 0 },
            texturesPaths: [texturePath2],
            name: cubeName2,
            mesh: m.mesh,
            physics: {
              scale: scale4,
              enabled: true,
              geometry: "Cube"
            },
            raycast: RAY
          });
          const o2 = app.getSceneObjectByName(cubeName2);
          runtimeCacheObjs.push(o2);
        }, index * delay2);
        index++;
      }
    }
  }
  downloadMeshes(inputCube, handler, { scale: scale4 });
}
function physicsBodiesGeneratorPyramid(material = "standard", pos2, rot2, texturePath2, name2 = "pyramidCube", levels2 = 5, raycast2 = false, scale4 = [1, 1, 1], spacing2 = 2, delay2 = 500) {
  const engine = this;
  const inputCube = { mesh: "./res/meshes/blender/cube.obj" };
  function handler(m) {
    let index = 0;
    const RAY = { enabled: !!raycast2, radius: 1 };
    for (let y2 = 0; y2 < levels2; y2++) {
      const rowCount = levels2 - y2;
      const xOffset = (rowCount - 1) * spacing2 * 0.5;
      for (let x2 = 0; x2 < rowCount; x2++) {
        const cubeName2 = `${name2}_${index}`;
        setTimeout(() => {
          engine.addMeshObj({
            material: { type: material },
            position: {
              x: pos2.x + x2 * spacing2 - xOffset,
              y: pos2.y + y2 * spacing2,
              z: pos2.z
            },
            rotation: rot2,
            rotationSpeed: { x: 0, y: 0, z: 0 },
            texturesPaths: [texturePath2],
            name: cubeName2,
            mesh: m.mesh,
            physics: {
              scale: scale4,
              enabled: true,
              geometry: "Cube"
            },
            raycast: RAY
          });
          const o2 = app.getSceneObjectByName(cubeName2);
          runtimeCacheObjs.push(o2);
        }, delay2);
        index++;
      }
    }
  }
  downloadMeshes(inputCube, handler, { scale: scale4 });
}
function physicsBodiesGeneratorDeepPyramid(material = "standard", pos2, rot2, texturePath2, name2 = "pyramidCube", levels2 = 5, raycast2 = false, scale4 = [1, 1, 1], spacing2 = 2, delay2 = 200) {
  return new Promise((resolve, reject) => {
    const engine = this;
    const inputCube = { mesh: "./res/meshes/blender/cube.obj" };
    levels2 = parseFloat(levels2);
    function handler(m) {
      let index = 0;
      const totalCubes = levels2 * (levels2 + 1) * (2 * levels2 + 1) / 6;
      const lastIndex = totalCubes - 1;
      const RAY = { enabled: !!raycast2, radius: 1 };
      const objects2 = [];
      for (let y2 = 0; y2 < levels2; y2++) {
        const sizeX = levels2 - y2;
        const sizeZ = levels2 - y2;
        const xOffset = (sizeX - 1) * spacing2 * 0.5;
        const zOffset = (sizeZ - 1) * spacing2 * 0.5;
        for (let x2 = 0; x2 < sizeX; x2++) {
          for (let z = 0; z < sizeZ; z++) {
            const cubeName2 = `${name2}_${index}`;
            const currentIndex = index;
            setTimeout(() => {
              engine.addMeshObj({
                material: { type: material },
                position: {
                  x: pos2.x + x2 * spacing2 - xOffset,
                  y: pos2.y + y2 * spacing2,
                  z: pos2.z + z * spacing2 - zOffset
                },
                rotation: rot2,
                rotationSpeed: { x: 0, y: 0, z: 0 },
                texturesPaths: [texturePath2],
                name: cubeName2,
                mesh: m.mesh,
                physics: {
                  scale: scale4,
                  enabled: true,
                  geometry: "Cube"
                },
                raycast: RAY
              });
              const b = app.matrixAmmo.getBodyByName(cubeName2);
              stabilizeTowerBody(b);
              const o2 = app.getSceneObjectByName(cubeName2);
              runtimeCacheObjs.push(o2);
              objects2.push(o2.name);
              if (currentIndex === lastIndex) {
                resolve(objects2);
              }
            }, delay2 * index);
            index++;
          }
        }
      }
    }
    downloadMeshes(inputCube, handler, { scale: scale4 });
  });
}
function physicsBodiesGeneratorTower(material = "standard", pos2, rot2, texturePath2, name2 = "towerCube", height = 10, raycast2 = false, scale4 = [1, 1, 1], spacing2 = 2) {
  const engine = this;
  const inputCube = { mesh: "./res/meshes/blender/cube.obj" };
  function handler(m) {
    const RAY = { enabled: !!raycast2, radius: 1 };
    for (let y2 = 0; y2 < height; y2++) {
      const cubeName2 = `${name2}_${y2}`;
      setTimeout(() => {
        engine.addMeshObj({
          material: { type: material },
          position: {
            x: pos2.x,
            y: pos2.y + y2 * spacing2,
            z: pos2.z
          },
          rotation: rot2,
          rotationSpeed: { x: 0, y: 0, z: 0 },
          texturesPaths: [texturePath2],
          name: cubeName2,
          mesh: m.mesh,
          physics: {
            scale: scale4,
            enabled: true,
            geometry: "Cube"
          },
          raycast: RAY
        });
        const b = app.matrixAmmo.getBodyByName(cubeName2);
        stabilizeTowerBody(b);
        const o2 = app.getSceneObjectByName(cubeName2);
        runtimeCacheObjs.push(o2);
      }, delay);
    }
  }
  downloadMeshes(inputCube, handler, { scale: scale4 });
}
function addOBJ(path2, material = "standard", pos2, rot2, texturePath2, name2, isPhysicsBody2 = false, raycast2 = false, scale4 = [1, 1, 1], isInstancedObj2 = false) {
  return new Promise((resolve, reject) => {
    const engine = this;
    const inputCube = { mesh: path2 };
    function handler(m) {
      const RAY = { enabled: !!raycast2, radius: 1 };
      engine.addMeshObj({
        material: { type: material },
        position: {
          x: pos2.x,
          y: pos2.y,
          z: pos2.z
        },
        rotation: rot2,
        rotationSpeed: { x: 0, y: 0, z: 0 },
        texturesPaths: [texturePath2],
        name: name2,
        mesh: m.mesh,
        physics: {
          scale: scale4,
          enabled: isPhysicsBody2,
          geometry: "Cube"
        },
        raycast: RAY
      });
      const o2 = app.getSceneObjectByName(name2);
      runtimeCacheObjs.push(o2);
      resolve(o2);
    }
    downloadMeshes(inputCube, handler, { scale: scale4 });
  });
}

// ../../../engine/core-cache.js
var TextureCache = class {
  constructor(device2) {
    this.device = device2;
    this.cache = /* @__PURE__ */ new Map();
  }
  async get(path2, format) {
    if (this.cache.has(path2)) {
      return this.cache.get(path2);
    }
    const promise = this.#load(path2, format);
    this.cache.set(path2, promise);
    return promise;
  }
  async #load(path2, format) {
    const response = await fetch(path2);
    const blob = await response.blob();
    const imageBitmap = await createImageBitmap(blob);
    const texture = this.device.createTexture({
      size: [imageBitmap.width, imageBitmap.height, 1],
      format,
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT
    });
    this.device.queue.copyExternalImageToTexture(
      { source: imageBitmap },
      { texture },
      [imageBitmap.width, imageBitmap.height]
    );
    const sampler = this.device.createSampler({
      magFilter: "linear",
      minFilter: "linear",
      addressModeU: "repeat",
      addressModeV: "repeat",
      addressModeW: "repeat"
    });
    return { texture, sampler };
  }
};

// ../../../sounds/audioAsset.js
var AudioAssetManager = class {
  constructor() {
    this.assets = /* @__PURE__ */ new Map();
    this.loading = /* @__PURE__ */ new Map();
  }
  load(path2, options2 = {}) {
    if (this.assets.has(path2)) {
      return Promise.resolve(this.assets.get(path2));
    }
    if (this.loading.has(path2)) {
      return this.loading.get(path2);
    }
    const asset = new MatrixMusicAsset({ path: path2, ...options2 });
    const promise = asset.init().then((a) => {
      this.assets.set(path2, a);
      this.loading.delete(path2);
      return a;
    });
    this.loading.set(path2, promise);
    return promise;
  }
};
var MatrixMusicAsset = class {
  constructor({ path: path2, autoplay = true, containerId = null }) {
    this.path = path2;
    this.autoplay = autoplay;
    this.containerId = containerId;
    this.audio = null;
    this.ctx = null;
    this.source = null;
    this.gain = null;
    this.filter = null;
    this.analyser = null;
    this.frequencyData = null;
    this.ready = false;
  }
  async init() {
    this.audio = document.createElement("audio");
    this.audio.id = this.path;
    this.audio.src = `res/audios/${this.path}`;
    this.audio.autoplay = this.autoplay;
    this.audio.playsInline = true;
    this.audio.controls = true;
    (this.containerId ? document.getElementById(this.containerId) : document.body)?.appendChild(this.audio);
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AudioCtx();
    if (this.ctx.state === "suspended") {
      await this.ctx.resume();
    }
    this.source = this.ctx.createMediaElementSource(this.audio);
    this.gain = this.ctx.createGain();
    this.filter = this.ctx.createBiquadFilter();
    this.analyser = this.ctx.createAnalyser();
    this.filter.frequency.value = 5e3;
    this.analyser.fftSize = 2048;
    this.source.connect(this.gain).connect(this.filter).connect(this.ctx.destination);
    this.source.connect(this.analyser);
    this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount);
    try {
      await this.audio.play();
    } catch {
    }
    this.ready = true;
    return this;
  }
  updateFFT() {
    if (!this.ready) return null;
    this.analyser.getByteFrequencyData(this.frequencyData);
    return this.frequencyData;
  }
};

// ../../../engine/postprocessing/volumetric.js
var VolumetricPass = class {
  constructor(width, height, device2, options2 = {}) {
    this.enabled = false;
    this.device = device2;
    this.width = width;
    this.height = height;
    this.volumetricTex = this._createTexture(width, height);
    this.sampler = device2.createSampler({
      label: "VolumetricPass.linearSampler",
      magFilter: "linear",
      minFilter: "linear",
      addressModeU: "clamp-to-edge",
      addressModeV: "clamp-to-edge"
    });
    this.depthSampler = device2.createSampler({
      label: "VolumetricPass.comparisonSampler",
      compare: "less-equal"
    });
    this.params = {
      density: options2.density ?? 0.03,
      steps: options2.steps ?? 32,
      scatterStrength: options2.scatterStrength ?? 1,
      heightFalloff: options2.heightFalloff ?? 0.1
    };
    this.lightParams = {
      color: options2.lightColor ?? [1, 0.85, 0.6],
      direction: [0, -1, 0.5]
    };
    this.paramsBuffer = device2.createBuffer({
      label: "VolumetricPass.paramsBuffer",
      size: 16,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });
    this.invViewProjBuffer = device2.createBuffer({
      label: "VolumetricPass.invViewProjBuffer",
      size: 64,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });
    this.lightViewProjBuffer = device2.createBuffer({
      label: "VolumetricPass.lightViewProjBuffer",
      size: 64,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });
    this.lightDirBuffer = device2.createBuffer({
      label: "VolumetricPass.lightDirBuffer",
      size: 16,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });
    this.lightColorBuffer = device2.createBuffer({
      label: "VolumetricPass.lightColorBuffer",
      size: 16,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });
    this._updateParams();
    this._updateLightColor();
    this.marchPipeline = this._createMarchPipeline();
    this.compositePipeline = this._createCompositePipeline();
  }
  // ─── Public setters ────────────────────────────────────────────────────────
  setDensity = (v) => {
    this.params.density = v;
    this._updateParams();
  };
  setSteps = (v) => {
    this.params.steps = v;
    this._updateParams();
  };
  setScatterStrength = (v) => {
    this.params.scatterStrength = v;
    this._updateParams();
  };
  setHeightFalloff = (v) => {
    this.params.heightFalloff = v;
    this._updateParams();
  };
  setLightColor = (r2, g, b) => {
    this.lightParams.color = [r2, g, b];
    this._updateLightColor();
  };
  setLightDirection = (x2, y2, z) => {
    this.lightParams.direction = [x2, y2, z];
    this.device.queue.writeBuffer(this.lightDirBuffer, 0, new Float32Array([x2, y2, z, 0]));
  };
  // ─── Internal ─────────────────────────────────────────────────────────────
  _updateParams() {
    this.device.queue.writeBuffer(this.paramsBuffer, 0, new Float32Array([
      this.params.density,
      this.params.steps,
      this.params.scatterStrength,
      this.params.heightFalloff
    ]));
  }
  _updateLightColor() {
    this.device.queue.writeBuffer(
      this.lightColorBuffer,
      0,
      new Float32Array([...this.lightParams.color, 0])
    );
  }
  _createTexture(w, h) {
    return this.device.createTexture({
      label: "VolumetricPass.texture",
      size: [w, h],
      format: "rgba16float",
      usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING
    });
  }
  _beginPass(encoder, targetView, label) {
    return encoder.beginRenderPass({
      label,
      colorAttachments: [{
        view: targetView,
        loadOp: "clear",
        storeOp: "store",
        clearValue: { r: 0, g: 0, b: 0, a: 0 }
      }]
    });
  }
  // ─── Pipelines ─────────────────────────────────────────────────────────────
  _createMarchPipeline() {
    const bgl = this.device.createBindGroupLayout({
      label: "VolumetricPass.marchBGL",
      entries: [
        { binding: 0, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: "depth" } },
        { binding: 1, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: "depth", viewDimension: "2d-array" } },
        { binding: 2, visibility: GPUShaderStage.FRAGMENT, sampler: { type: "comparison" } },
        // ← must be 'comparison'
        { binding: 3, visibility: GPUShaderStage.FRAGMENT, buffer: { type: "uniform" } },
        { binding: 4, visibility: GPUShaderStage.FRAGMENT, buffer: { type: "uniform" } },
        { binding: 5, visibility: GPUShaderStage.FRAGMENT, buffer: { type: "uniform" } },
        { binding: 6, visibility: GPUShaderStage.FRAGMENT, buffer: { type: "uniform" } },
        { binding: 7, visibility: GPUShaderStage.FRAGMENT, buffer: { type: "uniform" } }
      ]
    });
    return this.device.createRenderPipeline({
      label: "VolumetricPass.marchPipeline",
      layout: this.device.createPipelineLayout({
        label: "VolumetricPass.marchPipelineLayout",
        bindGroupLayouts: [bgl]
      }),
      vertex: {
        module: this.device.createShaderModule({ label: "VolumetricPass.vert", code: fullscreenVertWGSL() }),
        entryPoint: "vert"
      },
      fragment: {
        module: this.device.createShaderModule({ label: "VolumetricPass.marchFrag", code: marchFragWGSL() }),
        entryPoint: "main",
        targets: [{ format: "rgba16float" }]
      },
      primitive: { topology: "triangle-list" }
    });
  }
  _createCompositePipeline() {
    const bgl = this.device.createBindGroupLayout({
      label: "VolumetricPass.compositeBGL",
      entries: [
        { binding: 0, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: "float" } },
        { binding: 1, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: "float" } },
        { binding: 2, visibility: GPUShaderStage.FRAGMENT, sampler: { type: "filtering" } },
        { binding: 3, visibility: GPUShaderStage.FRAGMENT, buffer: { type: "uniform" } }
      ]
    });
    return this.device.createRenderPipeline({
      label: "VolumetricPass.compositePipeline",
      layout: this.device.createPipelineLayout({
        label: "VolumetricPass.compositePipelineLayout",
        bindGroupLayouts: [bgl]
      }),
      vertex: {
        module: this.device.createShaderModule({ label: "VolumetricPass.compositeVert", code: fullscreenVertWGSL() }),
        entryPoint: "vert"
      },
      fragment: {
        module: this.device.createShaderModule({ label: "VolumetricPass.compositeFrag", code: compositeFragWGSL() }),
        entryPoint: "main",
        targets: [{ format: "rgba16float" }]
      },
      primitive: { topology: "triangle-list" }
    });
  }
  // ─── Bind Groups ───────────────────────────────────────────────────────────
  _marchBindGroup(depthView, shadowArrayView) {
    return this.device.createBindGroup({
      label: "VolumetricPass.marchBindGroup",
      layout: this.marchPipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: depthView },
        { binding: 1, resource: shadowArrayView },
        { binding: 2, resource: this.depthSampler },
        // comparison sampler
        { binding: 3, resource: { buffer: this.invViewProjBuffer } },
        { binding: 4, resource: { buffer: this.lightViewProjBuffer } },
        { binding: 5, resource: { buffer: this.lightDirBuffer } },
        { binding: 6, resource: { buffer: this.lightColorBuffer } },
        { binding: 7, resource: { buffer: this.paramsBuffer } }
      ]
    });
  }
  _compositeBindGroup(sceneView) {
    return this.device.createBindGroup({
      label: "VolumetricPass.compositeBindGroup",
      layout: this.compositePipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: sceneView },
        { binding: 1, resource: this.volumetricTex.createView() },
        { binding: 2, resource: this.sampler },
        { binding: 3, resource: { buffer: this.paramsBuffer } }
      ]
    });
  }
  // ─── Render ────────────────────────────────────────────────────────────────
  /**
   * @param {GPUCommandEncoder} encoder
   * @param {GPUTextureView} sceneView        — your sceneTextureView
   * @param {GPUTextureView} depthView        — your mainDepthView
   * @param {GPUTextureView} shadowArrayView  — your shadowArrayView
   * @param {object} camera  — { invViewProjectionMatrix: Float32Array(16) }
   * @param {object} light   — { viewProjectionMatrix: Float32Array(16), direction: [x,y,z] }
   */
  render(encoder, sceneView, depthView, shadowArrayView, camera, light) {
    this.device.queue.writeBuffer(this.invViewProjBuffer, 0, camera.invViewProjectionMatrix);
    this.device.queue.writeBuffer(this.lightViewProjBuffer, 0, light.viewProjectionMatrix);
    this.device.queue.writeBuffer(this.lightDirBuffer, 0, new Float32Array([...light.direction, 0]));
    {
      const pass2 = this._beginPass(encoder, this.volumetricTex.createView(), "VolumetricPass.marchPass");
      pass2.setPipeline(this.marchPipeline);
      pass2.setBindGroup(0, this._marchBindGroup(depthView, shadowArrayView));
      pass2.draw(6);
      pass2.end();
    }
    {
      const pass2 = this._beginPass(encoder, this.compositeOutputTex.createView(), "VolumetricPass.compositePass");
      pass2.setPipeline(this.compositePipeline);
      pass2.setBindGroup(0, this._compositeBindGroup(sceneView));
      pass2.draw(6);
      pass2.end();
    }
  }
  /** Call once after constructor. Chainable: new VolumetricPass(...).init() */
  init() {
    this.compositeOutputTex = this._createTexture(this.width, this.height);
    return this;
  }
  /** Call on canvas resize */
  resize(width, height) {
    this.width = width;
    this.height = height;
    this.volumetricTex = this._createTexture(width, height);
    this.compositeOutputTex = this._createTexture(width, height);
  }
};
function fullscreenVertWGSL() {
  return (
    /* wgsl */
    `
    @vertex
    fn vert(@builtin(vertex_index) i: u32) -> @builtin(position) vec4<f32> {
      var pos = array<vec2<f32>, 6>(
        vec2(-1.0, -1.0), vec2(1.0, -1.0), vec2(-1.0,  1.0),
        vec2(-1.0,  1.0), vec2(1.0, -1.0), vec2(1.0,  1.0)
      );
      return vec4(pos[i], 0.0, 1.0);
    }
  `
  );
}
function marchFragWGSL() {
  return (
    /* wgsl */
    `

  @group(0) @binding(0) var depthTex:   texture_depth_2d;
  @group(0) @binding(1) var shadowTex:  texture_depth_2d_array;
  @group(0) @binding(2) var cmpSamp:    sampler_comparison;
  @group(0) @binding(3) var<uniform> invViewProj:   mat4x4<f32>;
  @group(0) @binding(4) var<uniform> lightViewProj: mat4x4<f32>;
  @group(0) @binding(5) var<uniform> lightDir:      vec4<f32>;
  @group(0) @binding(6) var<uniform> lightColor:    vec4<f32>;

  struct Params { density: f32, steps: f32, scatterStrength: f32, heightFalloff: f32 }
  @group(0) @binding(7) var<uniform> params: Params;

  fn worldPos(uv: vec2<f32>, depth: f32) -> vec3<f32> {
    let ndc   = vec4(uv.x * 2.0 - 1.0, (1.0 - uv.y) * 2.0 - 1.0, depth, 1.0);
    let world = invViewProj * ndc;
    return world.xyz / world.w;
  }

  fn fogDensity(p: vec3<f32>) -> f32 {
    return params.density * exp(-max(p.y, 0.0) * params.heightFalloff);
  }

  @fragment
  fn main(@builtin(position) fc: vec4<f32>) -> @location(0) vec4<f32> {
    let sz    = vec2<f32>(textureDimensions(depthTex));
    let uv    = fc.xy / sz;
    let depth = textureLoad(depthTex, vec2<i32>(fc.xy), 0);

    let ro    = worldPos(uv, 0.0);
    let rt    = worldPos(uv, depth);
    let rlen  = length(rt - ro);
    let rdir  = normalize(rt - ro);
    let steps = max(i32(params.steps), 8);
    let step  = rlen / f32(steps);

    var accum = vec3<f32>(0.0);
    var trans = 1.0;

    for (var i = 0; i < steps; i++) {
      let p = ro + rdir * ((f32(i) + 0.5) * step);

      // \u2500\u2500 textureSampleCompare MUST be in uniform control flow \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
      // Compute shadow coords for every sample unconditionally.
      // Gate the contribution with branchless math \u2014 never use if/continue/break above this call.
      let ls  = lightViewProj * vec4(p, 1.0);
      let lp  = ls.xyz / ls.w;
      let suv = lp.xy * 0.5 + 0.5;

      let shadow   = textureSampleCompare(shadowTex, cmpSamp, suv, 0, lp.z - 0.002);
      let inBounds = f32(suv.x >= 0.0 && suv.x <= 1.0 && suv.y >= 0.0 && suv.y <= 1.0);
      let lit      = shadow * inBounds;

      let d   = fogDensity(p) * step;
      let ext = exp(-d);
      let s   = trans * (1.0 - ext) * lit * params.scatterStrength * f32(d > 0.0001);

      accum += s * lightColor.rgb;
      trans *= select(1.0, ext, d > 0.0001);
    }

    return vec4<f32>(accum, 1.0 - trans);
  }
  `
  );
}
function compositeFragWGSL() {
  return (
    /* wgsl */
    `

  @group(0) @binding(0) var sceneTex: texture_2d<f32>;
  @group(0) @binding(1) var volTex:   texture_2d<f32>;
  @group(0) @binding(2) var samp:     sampler;
  struct Params { density: f32, steps: f32, scatterStrength: f32, heightFalloff: f32 }
  @group(0) @binding(3) var<uniform> params: Params;

  @fragment
  fn main(@builtin(position) fc: vec4<f32>) -> @location(0) vec4<f32> {
    let uv    = fc.xy / vec2<f32>(textureDimensions(sceneTex));
    let scene = textureSample(sceneTex, samp, uv);
    let vol   = textureSample(volTex, samp, uv);
    // vol.rgb = scattered light | vol.a = fog opacity
    return vec4<f32>(scene.rgb * (1.0 - vol.a) + vol.rgb, scene.a);
  }
  `
  );
}

// ../../../world.js
var MatrixEngineWGPU = class {
  // save class reference
  reference = {
    MEMeshObj,
    MEMeshObjInstances,
    BVHPlayerInstances,
    BVHPlayer,
    downloadMeshes,
    addRaycastsListener,
    graphAdapter,
    effectsClassRef: {
      FlameEffect,
      FlameEmitter,
      PointerEffect,
      HPBarEffect,
      MANABarEffect
    }
  };
  mainRenderBundle = [];
  lightContainer = [];
  frame = () => {
  };
  entityHolder = [];
  lastTime = 0;
  entityArgPass = {
    loadOp: "clear",
    storeOp: "store",
    depthLoadOp: "clear",
    depthStoreOp: "store"
  };
  matrixSounds = new MatrixSounds();
  audioManager = new AudioAssetManager();
  constructor(options2, callback) {
    if (typeof options2 == "undefined" || typeof options2 == "function") {
      this.options = {
        useSingleRenderPass: true,
        canvasSize: "fullscreen",
        canvasId: "canvas1",
        mainCameraParams: {
          type: "WASD",
          responseCoef: 2e3
        },
        clearColor: { r: 0.584, g: 0, b: 0.239, a: 1 }
      };
      callback = options2;
    }
    if (typeof options2.clearColor === "undefined") {
      options2.clearColor = { r: 0.584, g: 0, b: 0.239, a: 1 };
    }
    if (typeof options2.canvasId === "undefined") {
      options2.canvasId = "canvas1";
    }
    if (typeof options2.mainCameraParams === "undefined") {
      options2.mainCameraParams = {
        type: "WASD",
        responseCoef: 2e3
      };
    }
    if (typeof options2.dontUsePhysics == "undefined") {
      this.physicsBodiesGenerator = physicsBodiesGenerator.bind(this);
      this.physicsBodiesGeneratorWall = physicsBodiesGeneratorWall.bind(this);
      this.physicsBodiesGeneratorPyramid = physicsBodiesGeneratorPyramid.bind(this);
      this.physicsBodiesGeneratorTower = physicsBodiesGeneratorTower.bind(this);
      this.physicsBodiesGeneratorDeepPyramid = physicsBodiesGeneratorDeepPyramid.bind(this);
    }
    this.editorAddOBJ = addOBJ.bind(this);
    this.logLoopError = true;
    if (typeof options2.alphaMode == "undefined") {
      options2.alphaMode = "no";
    } else if (options2.alphaMode != "opaque" && options2.alphaMode != "premultiplied") {
      console.error("[webgpu][alphaMode] Wrong enum Valid:'opaque','premultiplied' !!!");
      return;
    }
    if (typeof options2.useContex == "undefined") {
      options2.useContex = "webgpu";
    }
    if (typeof options2.dontUsePhysics == "undefined") {
      this.matrixAmmo = new MatrixAmmo();
    }
    this.editor = void 0;
    if (typeof options2.useEditor !== "undefined") {
      if (typeof options2.projectType !== "undefined" && options2.projectType == "created from editor") {
        this.editor = new Editor(this, "created from editor", options2.projectName);
      } else if (typeof options2.projectType !== "undefined" && options2.projectType == "pre editor") {
        this.editor = new Editor(this, options2.projectType);
      } else {
        this.editor = new Editor(this, "infly");
      }
    }
    window.addEventListener("keydown", (e) => {
      if (e.code == "F4") {
        e.preventDefault();
        mb.error(`Activated WebEditor view.`);
        app.activateEditor();
        return false;
      }
    });
    this.activateEditor = () => {
      if (this.editor == null || typeof this.editor === "undefined") {
        if (typeof options2.projectType !== "undefined" && options2.projectType == "created from editor") {
          this.editor = new Editor(this, "created from editor");
        } else if (typeof options2.projectType !== "undefined" && options2.projectType == "pre editor") {
          this.editor = new Editor(this, options2.projectType);
        } else {
          this.editor = new Editor(this, "infly");
        }
        this.editor.editorHud.updateSceneContainer();
      } else {
        this.editor.editorHud.editorMenu.style.display = "flex";
        this.editor.editorHud.assetsBox.style.display = "flex";
        this.editor.editorHud.sceneProperty.style.display = "flex";
        this.editor.editorHud.sceneContainer.style.display = "flex";
      }
    };
    this.options = options2;
    this.mainCameraParams = options2.mainCameraParams;
    const target = this.options.appendTo || document.body;
    var canvas = document.createElement("canvas");
    canvas.id = this.options.canvasId;
    if (this.options.canvasSize == "fullscreen") {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    } else {
      canvas.width = this.options.canvasSize.w;
      canvas.height = this.options.canvasSize.h;
    }
    target.append(canvas);
    const initialCameraPosition = vec3Impl.create(0, 0, 0);
    this.mainCameraParams = {
      type: this.options.mainCameraParams.type,
      responseCoef: this.options.mainCameraParams.responseCoef
    };
    this.cameras = {
      arcball: new ArcballCamera({ position: initialCameraPosition }),
      WASD: new WASDCamera({ position: initialCameraPosition, canvas, pitch: 0.18, yaw: -0.1 }),
      RPG: new RPGCamera({ position: initialCameraPosition, canvas })
    };
    this.label = new MultiLang();
    if (urlQuery.lang != null) {
      this.label.loadMultilang(urlQuery.lang).then((r2) => {
        this.label.get = r2;
      }).catch((r2) => {
        this.label.get = r2;
      });
    } else {
      this.label.loadMultilang().then((r2) => {
        this.label.get = r2;
      }).catch((r2) => {
        this.label.get = r2;
      });
      ;
    }
    this.init({ canvas, callback });
  }
  init = async ({ canvas, callback }) => {
    this.canvas = canvas;
    this.adapter = await navigator.gpu.requestAdapter();
    this.device = await this.adapter.requestDevice({
      extensions: ["ray_tracing"]
    });
    if (this.options.alphaMode == "no") {
      this.context = canvas.getContext("webgpu");
    } else if (this.options.alphaMode == "opaque") {
      this.context = canvas.getContext("webgpu", { alphaMode: "opaque" });
    } else if (this.options.alphaMode == "opaque") {
      this.context = canvas.getContext("webgpu", { alphaMode: "premultiplied" });
    }
    const devicePixelRatio = window.devicePixelRatio;
    canvas.width = canvas.clientWidth * devicePixelRatio;
    canvas.height = canvas.clientHeight * devicePixelRatio;
    const presentationFormat = navigator.gpu.getPreferredCanvasFormat();
    this.context.configure({
      device: this.device,
      format: presentationFormat,
      alphaMode: "premultiplied"
    });
    this.frame = this.frameSinglePass;
    this.globalAmbient = vec3Impl.create(0.5, 0.5, 0.5);
    this.MAX_SPOTLIGHTS = 20;
    this.inputHandler = createInputHandler(window, canvas);
    this.createGlobalStuff();
    this.shadersPack = {};
    console.log("%c ---------------------------------------------------------------------------------------------- ", LOG_FUNNY);
    console.log("%c \u{1F9EC} Matrix-Engine-Wgpu \u{1F9EC} ", LOG_FUNNY_BIG_NEON);
    console.log("%c ---------------------------------------------------------------------------------------------- ", LOG_FUNNY);
    console.log("%c Version 1.9.0 ", LOG_FUNNY);
    console.log("%c\u{1F47D}  ", LOG_FUNNY_EXTRABIG);
    console.log(
      "%cMatrix Engine WGPU - Port is open.\nCreative power loaded with visual scripting.\nLast features : Adding Gizmo , Optimised render in name of performance,\n audioReactiveNode, onDraw , onKey , curve editor.\nNo tracking. No hype. Just solutions. \u{1F525}",
      LOG_FUNNY_BIG_ARCADE
    );
    console.log(
      "%cSource code: \u{1F449} GitHub:\nhttps://github.com/zlatnaspirala/matrix-engine-wgpu",
      LOG_FUNNY_ARCADE2
    );
    setTimeout(() => {
      this.run(callback);
    }, 50);
  };
  createGlobalStuff() {
    this.textureCache = new TextureCache(this.device);
    this._destroyQueue = /* @__PURE__ */ new Set();
    this.flushDestroyQueue = () => {
      if (!this._destroyQueue.size) return;
      this._destroyQueue.forEach((name2) => {
        this.removeSceneObjectByName(name2);
      });
      this._destroyQueue.clear();
    };
    this.destroyByPrefix = (prefix) => {
      const toDestroy = [];
      for (const obj2 of this.mainRenderBundle) {
        if (obj2.name.startsWith(prefix)) {
          toDestroy.push(obj2.name);
        }
      }
      toDestroy.forEach(
        (name2) => this._destroyQueue.add(name2)
      );
    };
    this.destroyBySufix = (sufix) => {
      const toDestroy = [];
      for (const obj2 of this.mainRenderBundle) {
        if (obj2.name.endsWith(sufix)) {
          toDestroy.push(obj2.name);
        }
      }
      toDestroy.forEach(
        (name2) => this._destroyQueue.add(name2)
      );
    };
    this.bloomPass = {
      enabled: false,
      setIntensity: (v) => {
      },
      setKnee: (v) => {
      },
      setBlurRadius: (v) => {
      },
      setThreshold: (v) => {
      }
    };
    this.volumetricPass = {
      enabled: false
    };
    this.bloomOutputTex = this.device.createTexture({
      size: [this.canvas.width, this.canvas.height],
      format: "rgba16float",
      usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING
    });
    this.sceneTexture = this.device.createTexture({
      label: "final pipeline sceneTexture",
      size: [this.canvas.width, this.canvas.height],
      format: "rgba16float",
      usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING
    });
    this.sceneTextureView = this.sceneTexture.createView();
    this.presentSampler = this.device.createSampler({
      magFilter: "linear",
      minFilter: "linear"
    });
    this.presentPipeline = this.device.createRenderPipeline({
      label: "final pipeline",
      layout: "auto",
      vertex: {
        module: this.device.createShaderModule({ code: fullscreenQuadWGSL() }),
        entryPoint: "vert"
      },
      fragment: {
        module: this.device.createShaderModule({
          code: `
        @group(0) @binding(0) var hdrTex : texture_2d<f32>;
        @group(0) @binding(1) var samp : sampler;

        @fragment
        fn main(@builtin(position) pos: vec4<f32>) -> @location(0) vec4<f32> {
          let uv = pos.xy / vec2<f32>(textureDimensions(hdrTex));
          let hdr = textureSample(hdrTex, samp, uv).rgb;

          // simple tonemap
          let ldr = hdr / (hdr + vec3(1.0));

          return vec4<f32>(ldr, 1.0);
        }
      `
        }),
        entryPoint: "main",
        targets: [{ format: "bgra8unorm" }]
        // rgba16float  bgra8unorm
      }
    });
    this.createBloomBindGroup();
    this.spotlightUniformBuffer = this.device.createBuffer({
      label: "spotlightUniformBufferGLOBAL",
      size: this.MAX_SPOTLIGHTS * 144,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });
    this.SHADOW_RES = 1024;
    this.createTexArrayForShadows();
    this.mainDepthTexture = this.device.createTexture({
      size: [this.canvas.width, this.canvas.height],
      format: "depth24plus",
      usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING
    });
    this.mainDepthView = this.mainDepthTexture.createView();
    this.mainRenderPassDesc = {
      label: "mainRenderPassDesc",
      colorAttachments: [{
        view: void 0,
        // set each frame
        loadOp: "clear",
        storeOp: "store",
        clearValue: [0.02, 0.02, 0.02, 1]
      }],
      depthStencilAttachment: {
        view: this.mainDepthView,
        // fixed
        depthLoadOp: "clear",
        depthStoreOp: "store",
        depthClearValue: 1
      }
    };
    const depthTexture = this.device.createTexture({
      size: [this.canvas.width, this.canvas.height],
      format: "depth24plus",
      usage: GPUTextureUsage.RENDER_ATTACHMENT
    });
    this.depthTextureViewTrail = depthTexture.createView();
  }
  createTexArrayForShadows() {
    let numberOfLights = this.lightContainer.length;
    if (this.lightContainer.length == 0) {
      setTimeout(() => {
        this.createMe();
      }, 800);
    }
    this.createMe = () => {
      Math.max(1, this.lightContainer.length);
      if (this.lightContainer.length == 0) {
        setTimeout(() => {
          this.createMe();
        }, 800);
        return;
      }
      this.shadowTextureArray = this.device.createTexture({
        label: `shadowTextureArray[GLOBAL] num of light ${numberOfLights}`,
        size: {
          width: 1024,
          height: 1024,
          depthOrArrayLayers: numberOfLights
          // at least 1
        },
        dimension: "2d",
        format: "depth32float",
        usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING
      });
      this.shadowArrayView = this.shadowTextureArray.createView({
        dimension: "2d-array"
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
  getSceneObjectByName = (name2) => {
    return this.mainRenderBundle.find((sceneObject) => sceneObject.name === name2);
  };
  getSceneLightByName = (name2) => {
    return this.lightContainer.find((l) => l.name === name2);
  };
  getNameFromPath(p) {
    return p.split(/[/\\]/).pop().replace(/\.[^/.]+$/, "");
  }
  removeSceneObjectByName = (name2) => {
    const index = this.mainRenderBundle.findIndex((obj3) => obj3.name === name2);
    if (index === -1) {
      console.warn("%cScene object not found:" + name2, LOG_FUNNY_ARCADE2);
      return false;
    }
    const obj2 = this.mainRenderBundle[index];
    let testPB = app.matrixAmmo.getBodyByName(obj2.name);
    if (testPB !== null) {
      try {
        this.matrixAmmo.dynamicsWorld.removeRigidBody(testPB);
      } catch (e) {
        console.warn("%cPhysics cleanup error:" + e, LOG_FUNNY_ARCADE2);
      }
    }
    this.mainRenderBundle.splice(index, 1);
    return true;
  };
  addLight(o2) {
    const camera = this.cameras[this.mainCameraParams.type];
    let newLight = new SpotLight(camera, this.inputHandler, this.device, this.lightContainer.length);
    this.lightContainer.push(newLight);
    this.createTexArrayForShadows();
    console.log(`%cAdd light: ${newLight}`, LOG_FUNNY_ARCADE2);
  }
  addMeshObj = (o2, clearColor = this.options.clearColor) => {
    if (typeof o2.name === "undefined") {
      o2.name = genName(9);
    }
    if (typeof o2.position === "undefined") {
      o2.position = { x: 0, y: 0, z: -4 };
    }
    if (typeof o2.rotation === "undefined") {
      o2.rotation = { x: 0, y: 0, z: 0 };
    }
    if (typeof o2.rotationSpeed === "undefined") {
      o2.rotationSpeed = { x: 0, y: 0, z: 0 };
    }
    if (typeof o2.texturesPaths === "undefined") {
      o2.texturesPaths = ["./res/textures/default.png"];
    }
    if (typeof o2.material === "undefined") {
      o2.material = { type: "standard" };
    }
    if (typeof o2.mainCameraParams === "undefined") {
      o2.mainCameraParams = this.mainCameraParams;
    }
    if (typeof o2.scale === "undefined") {
      o2.scale = [1, 1, 1];
    }
    if (typeof o2.raycast === "undefined") {
      o2.raycast = { enabled: false, radius: 2 };
    }
    if (typeof o2.useScale === "undefined") {
      o2.useScale = false;
    }
    o2.entityArgPass = this.entityArgPass;
    o2.cameras = this.cameras;
    if (typeof o2.physics === "undefined") {
      o2.physics = {
        scale: [1, 1, 1],
        enabled: true,
        geometry: "Sphere",
        // must be fixed<<
        radius: typeof o2.scale == Number ? o2.scale : o2.scale[0],
        name: o2.name,
        rotation: o2.rotation
      };
    }
    if (typeof o2.physics.enabled === "undefined") {
      o2.physics.enabled = true;
    }
    if (typeof o2.physics.geometry === "undefined") {
      o2.physics.geometry = "Cube";
    }
    if (typeof o2.physics.radius === "undefined") {
      o2.physics.radius = o2.scale;
    }
    if (typeof o2.physics.mass === "undefined") {
      o2.physics.mass = 1;
    }
    if (typeof o2.physics.name === "undefined") {
      o2.physics.name = o2.name;
    }
    if (typeof o2.physics.scale === "undefined") {
      o2.physics.scale = o2.scale;
    }
    if (typeof o2.physics.rotation === "undefined") {
      o2.physics.rotation = o2.rotation;
    }
    o2.physics.position = o2.position;
    if (typeof o2.objAnim == "undefined" || typeof o2.objAnim == null) {
      o2.objAnim = null;
    } else {
      if (typeof o2.objAnim.animations !== "undefined") {
        o2.objAnim.play = play;
      }
      o2.objAnim.meshList = o2.objAnim.meshList;
      if (typeof o2.mesh === "undefined") {
        o2.mesh = o2.objAnim.meshList[0];
        console.info("objSeq animation is active.");
      }
      o2.objAnim.scaleAll = function(s) {
        for (var k in this.meshList) {
          this.meshList[k].setScale(s);
        }
      };
    }
    o2.textureCache = this.textureCache;
    let AM = this.globalAmbient.slice();
    let myMesh1 = new MEMeshObj(this.canvas, this.device, this.context, o2, this.inputHandler, AM);
    myMesh1.spotlightUniformBuffer = this.spotlightUniformBuffer;
    myMesh1.clearColor = clearColor;
    if (o2.physics.enabled == true) {
      this.matrixAmmo.addPhysics(myMesh1, o2.physics);
    }
    this.mainRenderBundle.push(myMesh1);
    if (typeof this.editor !== "undefined") {
      this.editor.editorHud.updateSceneContainer();
    }
  };
  createBloomBindGroup() {
    this.bloomBindGroup = this.device.createBindGroup({
      layout: this.presentPipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: this.bloomOutputTex },
        { binding: 1, resource: this.presentSampler }
      ]
    });
    this.noBloomBindGroup = this.device.createBindGroup({
      layout: this.presentPipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: this.sceneTexture.createView() },
        { binding: 1, resource: this.presentSampler }
      ]
    });
  }
  async run(callback) {
    setTimeout(() => {
      requestAnimationFrame(this.frame);
    }, 1e3);
    setTimeout(() => {
      callback(this);
    }, 1);
  }
  destroyProgram = () => {
    console.warn("%c[MatrixEngineWGPU] Destroy program", "color: orange");
    this.frame = () => {
    };
    if (this._rafId) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }
    for (const obj2 of this.mainRenderBundle) {
      try {
        obj2?.destroy?.();
      } catch (e) {
        console.warn("Object destroy error:", obj2?.name, e);
      }
    }
    this.mainRenderBundle.length = 0;
    this.matrixAmmo?.destroy?.();
    this.matrixAmmo = null;
    this.editor?.destroy?.();
    this.editor = null;
    this.inputHandler?.destroy?.();
    this.inputHandler = null;
    this.mainDepthTexture?.destroy();
    this.shadowTextureArray?.destroy();
    this.shadowVideoTexture?.destroy();
    this.mainDepthTexture = null;
    this.shadowTextureArray = null;
    this.shadowVideoTexture = null;
    try {
      this.context?.unconfigure?.();
    } catch {
    }
    this.canvas?.remove();
    this.canvas = null;
    this.device = null;
    this.context = null;
    this.adapter = null;
    console.warn("%c[MatrixEngineWGPU] Destroy complete \u2714", "color: lightgreen");
  };
  updateLights() {
    const floatsPerLight = 36;
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
    if (typeof this.mainRenderBundle == "undefined" || this.mainRenderBundle.length == 0) {
      setTimeout(() => {
        requestAnimationFrame(this.frame);
      }, 100);
      return;
    }
    let now;
    const currentTime = performance.now() / 1e3;
    const bufferUpdates = [];
    this.mainRenderBundle.forEach((m, index) => {
      if (m.vertexAnimBuffer && m.vertexAnimParams) {
        m.time = currentTime * m.deltaTimeAdapter;
        m.vertexAnimParams[0] = m.time;
        bufferUpdates.push({
          buffer: m.vertexAnimBuffer,
          data: m.vertexAnimParams
        });
      }
      if (m.isVideo == true) {
        if (!m.externalTexture) {
          m.createBindGroupForRender();
          setTimeout(() => {
            requestAnimationFrame(this.frame);
          }, 300);
          return;
        }
      }
    });
    for (const update of bufferUpdates) {
      this.device.queue.writeBuffer(update.buffer, 0, update.data);
    }
    try {
      let commandEncoder = this.device.createCommandEncoder();
      if (this.matrixAmmo) this.matrixAmmo.updatePhysics();
      this.updateLights();
      this.mainRenderBundle.forEach((mesh, index) => {
        mesh.position.update();
        mesh.updateModelUniformBuffer();
        if (mesh.update) mesh.update(mesh.time);
        if (mesh.updateTime) {
          mesh.updateTime(currentTime);
        }
        this.lightContainer.forEach((light) => {
          light.update();
          mesh.getTransformationMatrix(this.mainRenderBundle, light, index);
        });
      });
      for (let i = 0; i < this.lightContainer.length; i++) {
        const light = this.lightContainer[i];
        let ViewPerLightRenderShadowPass = this.shadowTextureArray.createView({
          dimension: "2d",
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
            depthLoadOp: "clear",
            depthStoreOp: "store",
            depthClearValue: 1
          }
        });
        now = performance.now() / 1e3;
        for (const [meshIndex, mesh] of this.mainRenderBundle.entries()) {
          if (mesh instanceof BVHPlayerInstances) {
            mesh.updateInstanceData(mesh.getModelMatrix(mesh.position, mesh.useScale));
            shadowPass.setPipeline(light.shadowPipelineInstanced);
          } else {
            shadowPass.setPipeline(light.shadowPipeline);
          }
          if (mesh.videoIsReady == "NONE") {
            shadowPass.setBindGroup(0, light.getShadowBindGroup(mesh, meshIndex));
            if (mesh instanceof BVHPlayerInstances) {
              shadowPass.setBindGroup(1, mesh.modelBindGroupInstanced);
            } else {
              shadowPass.setBindGroup(1, mesh.modelBindGroup);
            }
            mesh.drawShadows(shadowPass, light);
          }
        }
        shadowPass.end();
      }
      this.mainRenderPassDesc.colorAttachments[0].view = this.sceneTextureView;
      let pass2 = commandEncoder.beginRenderPass(this.mainRenderPassDesc);
      for (const mesh of this.mainRenderBundle) {
        if (mesh.material?.useBlend === true) continue;
        pass2.setPipeline(mesh.pipeline);
        if (!mesh.sceneBindGroupForRender || mesh.FINISH_VIDIO_INIT == false && mesh.isVideo == true) {
          for (const m of this.mainRenderBundle) {
            if (m.isVideo == true) {
              m.shadowDepthTextureView = this.shadowVideoView;
              m.FINISH_VIDIO_INIT = true;
              m.setupPipeline();
              pass2.setPipeline(mesh.pipeline);
            } else {
              m.shadowDepthTextureView = this.shadowArrayView;
              m.setupPipeline();
            }
          }
        }
        mesh.drawElements(pass2, this.lightContainer);
      }
      for (const mesh of this.mainRenderBundle) {
        if (mesh.material?.useBlend !== true) continue;
        pass2.setPipeline(mesh.pipelineTransparent);
        if (!mesh.sceneBindGroupForRender || mesh.FINISH_VIDIO_INIT == false && mesh.isVideo == true) {
          for (const m of this.mainRenderBundle) {
            if (m.isVideo == true) {
              m.shadowDepthTextureView = this.shadowVideoView;
              m.FINISH_VIDIO_INIT = true;
              m.setupPipeline();
              pass2.setPipeline(mesh.pipelineTransparent);
            } else {
              m.shadowDepthTextureView = this.shadowArrayView;
              m.setupPipeline();
            }
          }
        }
        mesh.drawElements(pass2, this.lightContainer);
      }
      pass2.end();
      if (this.collisionSystem) this.collisionSystem.update();
      const transPassDesc = {
        colorAttachments: [{ view: this.sceneTextureView, loadOp: "load", storeOp: "store" }],
        depthStencilAttachment: {
          view: this.mainDepthView,
          depthLoadOp: "load",
          depthStoreOp: "store",
          depthClearValue: 1
        }
      };
      const transPass = commandEncoder.beginRenderPass(transPassDesc);
      const viewProjMatrix = mat4Impl.multiply(
        this.cameras[this.mainCameraParams.type].projectionMatrix,
        this.cameras[this.mainCameraParams.type].view,
        mat4Impl.identity()
      );
      for (const mesh of this.mainRenderBundle) {
        if (mesh.effects) Object.keys(mesh.effects).forEach((effect_) => {
          const effect = mesh.effects[effect_];
          if (effect == null || effect.enabled == false) return;
          let md = mesh.getModelMatrix(mesh.position, mesh.useScale);
          if (effect.updateInstanceData) effect.updateInstanceData(md);
          effect.render(transPass, mesh, viewProjMatrix);
        });
      }
      transPass.end();
      if (this.volumetricPass.enabled === true) {
        const cam = this.cameras[this.mainCameraParams.type];
        const invViewProj = mat4Impl.invert(
          mat4Impl.multiply(cam.projectionMatrix, cam.view, mat4Impl.identity())
        );
        const light = this.lightContainer[0];
        this.volumetricPass.render(
          commandEncoder,
          this.sceneTextureView,
          // ← your existing scene color
          this.mainDepthView,
          // ← your existing depth
          this.shadowArrayView,
          // ← your existing shadow array
          { invViewProjectionMatrix: invViewProj },
          {
            viewProjectionMatrix: light.viewProjMatrix,
            // Float32Array 16
            direction: light.direction
            // [x, y, z]
          }
        );
      }
      const canvasView = this.context.getCurrentTexture().createView();
      if (this.bloomPass.enabled == true) {
        const bloomInput = this.volumetricPass.enabled ? this.volumetricPass.compositeOutputTex.createView() : this.sceneTextureView;
        this.bloomPass.render(commandEncoder, bloomInput, this.bloomOutputTex);
      }
      pass2 = commandEncoder.beginRenderPass({
        colorAttachments: [{
          view: canvasView,
          loadOp: "clear",
          storeOp: "store",
          clearValue: { r: 0, g: 0, b: 0, a: 1 }
        }]
      });
      pass2.setPipeline(this.presentPipeline);
      pass2.setBindGroup(0, this.bloomPass.enabled === true ? this.bloomBindGroup : this.noBloomBindGroup);
      pass2.draw(6);
      pass2.end();
      this.graphUpdate(now);
      this.device.queue.submit([commandEncoder.finish()]);
      requestAnimationFrame(this.frame);
    } catch (err) {
      if (this.logLoopError) console.log("%cLoop(err):" + err + " info : " + err.stack, LOG_WARN);
      requestAnimationFrame(this.frame);
    }
  };
  graphUpdate = (delta) => {
  };
  addGlbObj = (o2, BVHANIM, glbFile, clearColor = this.options.clearColor) => {
    if (typeof o2.name === "undefined") {
      o2.name = genName(9);
    }
    if (typeof o2.position === "undefined") {
      o2.position = { x: 0, y: 0, z: -4 };
    }
    if (typeof o2.rotation === "undefined") {
      o2.rotation = { x: 0, y: 0, z: 0 };
    }
    if (typeof o2.rotationSpeed === "undefined") {
      o2.rotationSpeed = { x: 0, y: 0, z: 0 };
    }
    if (typeof o2.texturesPaths === "undefined") {
      o2.texturesPaths = ["./res/textures/default.png"];
    }
    if (typeof o2.material === "undefined") {
      o2.material = { type: "standard" };
    }
    if (typeof o2.mainCameraParams === "undefined") {
      o2.mainCameraParams = this.mainCameraParams;
    }
    if (typeof o2.scale === "undefined") {
      o2.scale = [1, 1, 1];
    }
    if (typeof o2.raycast === "undefined") {
      o2.raycast = { enabled: false, radius: 2 };
    }
    if (typeof o2.pointerEffect === "undefined") {
      o2.pointerEffect = { enabled: false };
    }
    if (typeof o2.useScale === "undefined") {
      o2.useScale = false;
    }
    o2.entityArgPass = this.entityArgPass;
    o2.cameras = this.cameras;
    if (typeof o2.physics === "undefined") {
      o2.physics = {
        scale: [1, 1, 1],
        enabled: true,
        geometry: "Sphere",
        //                   must be fixed<<
        radius: typeof o2.scale == Number ? o2.scale : o2.scale[0],
        name: o2.name,
        rotation: o2.rotation
      };
    }
    if (typeof o2.physics.enabled === "undefined") {
      o2.physics.enabled = true;
    }
    if (typeof o2.physics.geometry === "undefined") {
      o2.physics.geometry = "Cube";
    }
    if (typeof o2.physics.radius === "undefined") {
      o2.physics.radius = o2.scale;
    }
    if (typeof o2.physics.mass === "undefined") {
      o2.physics.mass = 1;
    }
    if (typeof o2.physics.name === "undefined") {
      o2.physics.name = o2.name;
    }
    if (typeof o2.physics.scale === "undefined") {
      o2.physics.scale = o2.scale;
    }
    if (typeof o2.physics.rotation === "undefined") {
      o2.physics.rotation = o2.rotation;
    }
    o2.physics.position = o2.position;
    if (typeof o2.objAnim == "undefined" || typeof o2.objAnim == null) {
      o2.objAnim = null;
    } else {
      alert("GLB not use objAnim (it is only for obj sequence). GLB use BVH skeletal for animation");
    }
    o2.textureCache = this.textureCache;
    let skinnedNodeIndex = 0;
    for (const skinnedNode of glbFile.skinnedMeshNodes) {
      let c = 0;
      for (const primitive of skinnedNode.mesh.primitives) {
        o2.name = o2.name + "-" + skinnedNode.name + "-" + c;
        const bvhPlayer = new BVHPlayer(
          o2,
          BVHANIM,
          glbFile,
          c,
          skinnedNodeIndex,
          this.canvas,
          this.device,
          this.context,
          this.inputHandler,
          this.globalAmbient.slice()
        );
        skinnedNodeIndex++;
        bvhPlayer.spotlightUniformBuffer = this.spotlightUniformBuffer;
        bvhPlayer.clearColor = clearColor;
        this.mainRenderBundle.push(bvhPlayer);
        setTimeout(() => {
          document.dispatchEvent(new CustomEvent("updateSceneContainer", { detail: {} }));
        }, 50);
        c++;
      }
    }
    if (typeof this.editor !== "undefined") {
      this.editor.editorHud.updateSceneContainer();
    }
  };
  addGlbObjInctance = (o2, BVHANIM, glbFile, clearColor = this.options.clearColor) => {
    if (typeof o2.name === "undefined") {
      o2.name = genName(9);
    }
    if (typeof o2.position === "undefined") {
      o2.position = { x: 0, y: 0, z: -4 };
    }
    if (typeof o2.rotation === "undefined") {
      o2.rotation = { x: 0, y: 0, z: 0 };
    }
    if (typeof o2.rotationSpeed === "undefined") {
      o2.rotationSpeed = { x: 0, y: 0, z: 0 };
    }
    if (typeof o2.texturesPaths === "undefined") {
      o2.texturesPaths = ["./res/textures/default.png"];
    }
    if (typeof o2.material === "undefined") {
      o2.material = { type: "standard" };
    }
    if (typeof o2.mainCameraParams === "undefined") {
      o2.mainCameraParams = this.mainCameraParams;
    }
    if (typeof o2.scale === "undefined") {
      o2.scale = [1, 1, 1];
    }
    if (typeof o2.raycast === "undefined") {
      o2.raycast = { enabled: false, radius: 2 };
    }
    if (typeof o2.pointerEffect === "undefined") {
      o2.pointerEffect = {
        enabled: false,
        pointer: false,
        ballEffect: false
      };
    }
    if (typeof o2.useScale === "undefined") {
      o2.useScale = false;
    }
    o2.entityArgPass = this.entityArgPass;
    o2.cameras = this.cameras;
    if (typeof o2.physics === "undefined") {
      o2.physics = {
        scale: o2.scale,
        enabled: true,
        geometry: "Sphere",
        //                   must be fixed<<
        radius: typeof o2.scale == Number ? o2.scale : o2.scale[0],
        name: o2.name,
        rotation: o2.rotation
      };
    }
    if (typeof o2.physics.enabled === "undefined") {
      o2.physics.enabled = true;
    }
    if (typeof o2.physics.geometry === "undefined") {
      o2.physics.geometry = "Cube";
    }
    if (typeof o2.physics.radius === "undefined") {
      o2.physics.radius = o2.scale;
    }
    if (typeof o2.physics.mass === "undefined") {
      o2.physics.mass = 1;
    }
    if (typeof o2.physics.name === "undefined") {
      o2.physics.name = o2.name;
    }
    if (typeof o2.physics.scale === "undefined") {
      o2.physics.scale = o2.scale;
    }
    if (typeof o2.physics.rotation === "undefined") {
      o2.physics.rotation = o2.rotation;
    }
    o2.physics.position = o2.position;
    if (typeof o2.objAnim == "undefined" || typeof o2.objAnim == null) {
      o2.objAnim = null;
    } else {
      console.warn("GLB not use objAnim (it is only for obj sequence). GLB use BVH skeletal for animation");
    }
    let skinnedNodeIndex = 0;
    for (const skinnedNode of glbFile.skinnedMeshNodes) {
      let c = 0;
      for (const primitive of skinnedNode.mesh.primitives) {
        o2.name = o2.name + "_" + skinnedNode.name;
        if (skinnedNodeIndex == 0) {
        } else {
          o2.pointerEffect = { enabled: false };
        }
        const bvhPlayer = new BVHPlayerInstances(
          o2,
          BVHANIM,
          glbFile,
          c,
          skinnedNodeIndex,
          this.canvas,
          this.device,
          this.context,
          this.inputHandler,
          this.globalAmbient.slice()
        );
        bvhPlayer.spotlightUniformBuffer = this.spotlightUniformBuffer;
        bvhPlayer.clearColor = clearColor;
        setTimeout(() => {
          this.mainRenderBundle.push(bvhPlayer);
          setTimeout(() => {
            document.dispatchEvent(new CustomEvent("updateSceneContainer", { detail: {} }));
          }, 50);
        }, 200);
        c++;
      }
      skinnedNodeIndex++;
    }
    if (typeof this.editor !== "undefined") {
      this.editor.editorHud.updateSceneContainer();
    }
  };
  activateBloomEffect = () => {
    if (this.bloomPass.enabled != true) {
      this.bloomPass = new BloomPass(this.canvas.width, this.canvas.height, this.device, 1.5);
      this.bloomPass.enabled = true;
    }
  };
  activateVolumetricEffect = () => {
    if (this.volumetricPass.enabled != true) {
      this.volumetricPass = new VolumetricPass(
        this.canvas.width,
        this.canvas.height,
        this.device,
        {
          density: 0.03,
          steps: 32,
          scatterStrength: 1.2,
          heightFalloff: 0.08,
          lightColor: [1, 0.88, 0.65]
          // warm sunlight
        }
      ).init();
      this.volumetricPass.enabled = true;
    }
  };
};

// ../../../../projects/Test2/graph.js
var graph_default = { "nodes": { "n24": { "id": "n24", "title": "onLoad", "x": 91.6319580078125, "y": 478.6319885253906, "category": "event", "inputs": [], "outputs": [{ "name": "exec", "type": "action" }], "fields": [] }, "node_28": { "id": "node_28", "x": 475.71185302734375, "y": 510.29168701171875, "title": "Set Blend", "category": "scene", "inputs": [{ "name": "exec", "type": "action" }, { "name": "alpha", "type": "value" }, { "name": "sceneObjectName", "semantic": "string", "type": "any" }], "fields": [{ "key": "sceneObjectName", "value": "FLOOR" }, { "key": "alpha", "value": "0.5" }], "outputs": [{ "name": "execOut", "type": "action" }] }, "node_29": { "id": "node_29", "x": 483.357666015625, "y": 749.3264465332031, "title": "Set Material", "category": "scene", "inputs": [{ "name": "exec", "type": "action" }, { "name": "materialType", "semantic": "string", "type": "any" }, { "name": "sceneObjectName", "semantic": "string", "type": "any" }], "outputs": [{ "name": "execOut", "type": "action" }], "fields": [{ "key": "sceneObjectName", "value": "FLOOR" }, { "key": "materialType", "value": "water", "placeholder": "standard|power|water" }] }, "node_30": { "id": "node_30", "x": 481.3958740234375, "y": 968.3402862548828, "title": "Set Blend", "category": "scene", "inputs": [{ "name": "exec", "type": "action" }, { "name": "alpha", "type": "value" }, { "name": "sceneObjectName", "semantic": "string", "type": "any" }], "fields": [{ "key": "sceneObjectName", "value": "monster_MutantMesh" }, { "key": "alpha", "value": 0.5 }], "outputs": [{ "name": "execOut", "type": "action" }] }, "node_31": { "id": "node_31", "x": 722.8785247802734, "y": 1185.9445190429688, "title": "Set Vertex Ocean", "category": "scene", "inputs": [{ "name": "exec", "type": "action" }, { "name": "sceneObjectName", "semantic": "string", "type": "any" }, { "name": "enableOcean", "type": "boolean" }, { "name": "Ocean Scale", "type": "value" }, { "name": "Ocean Height", "type": "value" }, { "name": "Ocean speed", "type": "value" }], "outputs": [{ "name": "execOut", "type": "action" }], "fields": [{ "key": "sceneObjectName", "value": "FLOOR" }, { "key": "enableOcean", "value": "true" }, { "key": "Ocean Scale", "value": "1" }, { "key": "Ocean Height", "value": "0.02" }, { "key": "Ocean speed", "value": "0.5" }] } }, "links": [{ "id": "link_25", "from": { "node": "n24", "pin": "exec", "type": "action", "out": true }, "to": { "node": "node_28", "pin": "exec" }, "type": "action" }, { "id": "link_26", "from": { "node": "node_28", "pin": "execOut", "type": "action", "out": true }, "to": { "node": "node_29", "pin": "exec" }, "type": "action" }, { "id": "link_27", "from": { "node": "node_29", "pin": "execOut", "type": "action", "out": true }, "to": { "node": "node_30", "pin": "exec" }, "type": "action" }, { "id": "link_28", "from": { "node": "node_30", "pin": "execOut", "type": "action", "out": true }, "to": { "node": "node_31", "pin": "exec" }, "type": "action" }], "nodeCounter": 34, "linkCounter": 31, "pan": [-399, -564], "variables": { "number": {}, "boolean": {}, "string": {}, "object": {} } };

// ../../../../projects/Test2/shader-graphs.js
var shaderGraphsProdc = [
  {
    "name": "fragShaderGraph",
    "content": '{"nodes":[{"id":"N0","type":"FragmentOutput","x":347,"y":321,"inputs":{"color":{"default":"vec4f(1.0)"}}}],"connections":[]}'
  }
];

// ../../../../projects/Test2/app-gen.js
var app2 = new MatrixEngineWGPU(
  {
    useEditor: true,
    projectType: "created from editor",
    projectName: "Test2",
    useSingleRenderPass: true,
    canvasSize: "fullscreen",
    mainCameraParams: {
      type: "WASD",
      responseCoef: 1e3
    },
    clearColor: { r: 0, b: 0.1, g: 0.1, a: 1 }
  },
  (app3) => {
    addEventListener("AmmoReady", async () => {
      addRaycastsListener("canvas1", "mousedown");
      app3.graph = graph_default;
      shaderGraphsProdc.forEach((gShader) => {
        let shaderReady = JSON.parse(gShader.content);
        app3.shadersPack[gShader.name] = shaderReady.final;
        if (typeof shaderReady.final === "undefined") console.warn(`Shader ${shaderReady.name} is not compiled.`);
      });
      app3.addLight();
      downloadMeshes({ mesh: "./res/meshes/blender/plane.obj" }, (m) => {
        let texturesPaths2 = ["./res/meshes/blender/cube.png"];
        app3.addMeshObj({
          position: { x: 0, y: -1, z: -20 },
          rotation: { x: 0, y: 0, z: 0 },
          rotationSpeed: { x: 0, y: 0, z: 0 },
          texturesPaths: [texturesPaths2],
          name: "FLOOR",
          pointerEffect: {
            enabled: true,
            // pointEffect: true,
            gizmoEffect: true
            // destructionEffect: true
          },
          mesh: m.mesh,
          raycast: { enabled: true, radius: 2 },
          physics: { enabled: false, geometry: "Cube" }
        });
      }, { scale: [25, 1, 25] });
      setTimeout(() => {
        app3.getSceneObjectByName("FLOOR").useScale = true;
      }, 800);
      setTimeout(() => {
        app3.getSceneObjectByName("FLOOR").position.SetX(0.9600000000000115);
      }, 800);
      var glbFile01 = await fetch("res/meshes/glb/monster.glb").then((res) => res.arrayBuffer().then((buf) => uploadGLBModel(buf, app3.device)));
      texturesPaths = ["./res/meshes/blender/cube.png"];
      app3.addGlbObjInctance({
        position: { x: 0, y: 0, z: -20 },
        rotation: { x: 0, y: 0, z: 0 },
        rotationSpeed: { x: 0, y: 0, z: 0 },
        texturesPaths: [texturesPaths],
        scale: [2, 2, 2],
        name: app3.getNameFromPath("res/meshes/glb/monster.glb"),
        material: { type: "standard", useTextureFromGlb: true },
        raycast: { enabled: true, radius: 2 },
        pointerEffect: { enabled: true },
        physics: { enabled: true, geometry: "Cube" }
      }, null, glbFile01);
      setTimeout(() => {
        app3.getSceneObjectByName("monster_MutantMesh").useScale = true;
      }, 800);
      setTimeout(() => {
        app3.getSceneObjectByName("monster_MutantMesh").position.SetX(-1.0699999999999996);
      }, 800);
      setTimeout(() => {
        app3.getSceneObjectByName("monster_MutantMesh").position.SetY(-0.18999999999999517);
      }, 800);
      setTimeout(() => {
        app3.getSceneObjectByName("FLOOR").position.SetZ(-9.226682931566936);
      }, 800);
      setTimeout(() => {
        app3.getSceneObjectByName("FLOOR").position.SetY(-2.2299999999999907);
      }, 800);
    });
  }
);
window.app = app2;
/*! Bundled license information:

bvh-loader/module/bvh-loader.js:
  (**
   * @description Manual convert python script BVH
   * from https://github.com/dabeschte/npybvh to the JS.
   * @author Nikola Lukic
   * @license GPL-V3
   *)
*/
//# sourceMappingURL=Test2.js.map
