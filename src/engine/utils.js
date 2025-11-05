
export const vec3 = {
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
    if(length > 0.00001) {
      dst[0] = v[0] / length;
      dst[1] = v[1] / length;
      dst[2] = v[2] / length;
    } else {
      dst[0] = 0;
      dst[1] = 0;
      dst[2] = 0;
    }

    return dst;
  },
};

export const mat4 = {
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
    dst[0] = 1; dst[1] = 0; dst[2] = 0; dst[3] = 0;
    dst[4] = 0; dst[5] = 1; dst[6] = 0; dst[7] = 0;
    dst[8] = 0; dst[9] = 0; dst[10] = 1; dst[11] = 0;
    dst[12] = 0; dst[13] = 0; dst[14] = 0; dst[15] = 1;
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

    dst[0] = xAxis[0]; dst[1] = xAxis[1]; dst[2] = xAxis[2]; dst[3] = 0;
    dst[4] = yAxis[0]; dst[5] = yAxis[1]; dst[6] = yAxis[2]; dst[7] = 0;
    dst[8] = zAxis[0]; dst[9] = zAxis[1]; dst[10] = zAxis[2]; dst[11] = 0;
    dst[12] = eye[0]; dst[13] = eye[1]; dst[14] = eye[2]; dst[15] = 1;

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

    const t0 = (tmp0 * m11 + tmp3 * m21 + tmp4 * m31) -
      (tmp1 * m11 + tmp2 * m21 + tmp5 * m31);
    const t1 = (tmp1 * m01 + tmp6 * m21 + tmp9 * m31) -
      (tmp0 * m01 + tmp7 * m21 + tmp8 * m31);
    const t2 = (tmp2 * m01 + tmp7 * m11 + tmp10 * m31) -
      (tmp3 * m01 + tmp6 * m11 + tmp11 * m31);
    const t3 = (tmp5 * m01 + tmp8 * m11 + tmp11 * m21) -
      (tmp4 * m01 + tmp9 * m11 + tmp10 * m21);

    const d = 1 / (m00 * t0 + m10 * t1 + m20 * t2 + m30 * t3);

    dst[0] = d * t0;
    dst[1] = d * t1;
    dst[2] = d * t2;
    dst[3] = d * t3;

    dst[4] = d * ((tmp1 * m10 + tmp2 * m20 + tmp5 * m30) -
      (tmp0 * m10 + tmp3 * m20 + tmp4 * m30));
    dst[5] = d * ((tmp0 * m00 + tmp7 * m20 + tmp8 * m30) -
      (tmp1 * m00 + tmp6 * m20 + tmp9 * m30));
    dst[6] = d * ((tmp3 * m00 + tmp6 * m10 + tmp11 * m30) -
      (tmp2 * m00 + tmp7 * m10 + tmp10 * m30));
    dst[7] = d * ((tmp4 * m00 + tmp9 * m10 + tmp10 * m20) -
      (tmp5 * m00 + tmp8 * m10 + tmp11 * m20));

    dst[8] = d * ((tmp12 * m13 + tmp15 * m23 + tmp16 * m33) -
      (tmp13 * m13 + tmp14 * m23 + tmp17 * m33));
    dst[9] = d * ((tmp13 * m03 + tmp18 * m23 + tmp21 * m33) -
      (tmp12 * m03 + tmp19 * m23 + tmp20 * m33));
    dst[10] = d * ((tmp14 * m03 + tmp19 * m13 + tmp22 * m33) -
      (tmp15 * m03 + tmp18 * m13 + tmp23 * m33));
    dst[11] = d * ((tmp17 * m03 + tmp20 * m13 + tmp23 * m23) -
      (tmp16 * m03 + tmp21 * m13 + tmp22 * m23));

    dst[12] = d * ((tmp14 * m22 + tmp17 * m32 + tmp13 * m12) -
      (tmp16 * m32 + tmp12 * m12 + tmp15 * m22));
    dst[13] = d * ((tmp20 * m32 + tmp12 * m02 + tmp19 * m22) -
      (tmp18 * m22 + tmp21 * m32 + tmp13 * m02));
    dst[14] = d * ((tmp18 * m12 + tmp23 * m32 + tmp15 * m02) -
      (tmp22 * m32 + tmp14 * m02 + tmp19 * m12));
    dst[15] = d * ((tmp22 * m22 + tmp16 * m02 + tmp21 * m12) -
      (tmp20 * m12 + tmp23 * m22 + tmp17 * m02));
    return dst;
  },

  lookAt(eye, target, up, dst) {
    return mat4.inverse(mat4.cameraAim(eye, target, up, dst), dst);
  },

  translation([tx, ty, tz], dst) {
    dst = dst || new Float32Array(16);
    dst[0] = 1; dst[1] = 0; dst[2] = 0; dst[3] = 0;
    dst[4] = 0; dst[5] = 1; dst[6] = 0; dst[7] = 0;
    dst[8] = 0; dst[9] = 0; dst[10] = 1; dst[11] = 0;
    dst[12] = tx; dst[13] = ty; dst[14] = tz; dst[15] = 1;
    return dst;
  },

  rotationX(angleInRadians, dst) {
    const c = Math.cos(angleInRadians);
    const s = Math.sin(angleInRadians);
    dst = dst || new Float32Array(16);
    dst[0] = 1; dst[1] = 0; dst[2] = 0; dst[3] = 0;
    dst[4] = 0; dst[5] = c; dst[6] = s; dst[7] = 0;
    dst[8] = 0; dst[9] = -s; dst[10] = c; dst[11] = 0;
    dst[12] = 0; dst[13] = 0; dst[14] = 0; dst[15] = 1;
    return dst;
  },

  rotationY(angleInRadians, dst) {
    const c = Math.cos(angleInRadians);
    const s = Math.sin(angleInRadians);
    dst = dst || new Float32Array(16);
    dst[0] = c; dst[1] = 0; dst[2] = -s; dst[3] = 0;
    dst[4] = 0; dst[5] = 1; dst[6] = 0; dst[7] = 0;
    dst[8] = s; dst[9] = 0; dst[10] = c; dst[11] = 0;
    dst[12] = 0; dst[13] = 0; dst[14] = 0; dst[15] = 1;
    return dst;
  },

  rotationZ(angleInRadians, dst) {
    const c = Math.cos(angleInRadians);
    const s = Math.sin(angleInRadians);
    dst = dst || new Float32Array(16);
    dst[0] = c; dst[1] = s; dst[2] = 0; dst[3] = 0;
    dst[4] = -s; dst[5] = c; dst[6] = 0; dst[7] = 0;
    dst[8] = 0; dst[9] = 0; dst[10] = 1; dst[11] = 0;
    dst[12] = 0; dst[13] = 0; dst[14] = 0; dst[15] = 1;
    return dst;
  },

  scaling([sx, sy, sz], dst) {
    dst = dst || new Float32Array(16);
    dst[0] = sx; dst[1] = 0; dst[2] = 0; dst[3] = 0;
    dst[4] = 0; dst[5] = sy; dst[6] = 0; dst[7] = 0;
    dst[8] = 0; dst[9] = 0; dst[10] = sz; dst[11] = 0;
    dst[12] = 0; dst[13] = 0; dst[14] = 0; dst[15] = 1;
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
  },
};

export function degToRad(degrees) {return (degrees * Math.PI) / 180};

export function radToDeg(r) {var pi = Math.PI; return r * (180 / pi)};

export function createAppEvent(name, myDetails) {
  return new CustomEvent(name, {
    detail: {
      eventName: name,
      data: myDetails,
    },
    bubbles: true,
  });
}

/**
 * @description
 * Load script in runtime.
 */
export var scriptManager = {
  SCRIPT_ID: 0,
  LOAD: function addScript(src, id, type, parent, callback) {
    var s = document.createElement('script');
    s.onload = function() {
      // console.log('Script id loaded [src]: ' + this.src);
      if(typeof callback != 'undefined') callback();
    };
    if(typeof type !== 'undefined') {
      s.setAttribute('type', type);
      s.innerHTML = src;
    } else {s.setAttribute('src', src)}
    if(typeof id !== 'undefined') {s.setAttribute('id', id)}
    if(typeof parent !== 'undefined') {
      document.getElementById(parent).appendChild(s);
      if(typeof callback != 'undefined') callback();
    } else {
      document.body.appendChild(s);
    }
  },
  loadModule: function addScript(src, id, type, parent) {
    console.log('Script id load called ');
    var s = document.createElement('script');
    s.onload = function() {
      scriptManager.SCRIPT_ID++;
    };

    if(typeof type === 'undefined') {
      s.setAttribute('type', 'module');
      s.setAttribute('src', src);
    } else {
      s.setAttribute('type', type);
      s.innerHTML = src;
    }

    s.setAttribute('src', src);
    if(typeof id !== 'undefined') {
      s.setAttribute('id', id);
    }

    if(typeof parent !== 'undefined') {
      document.getElementById(parent).appendChild(s);
    } else {
      document.body.appendChild(s);
    }
  },
  loadGLSL: function(src) {
    return new Promise((resolve) => {
      fetch(src).then((data) => {
        resolve(data.text())
      })
    })
  }
};

// GET PULSE VALUES IN REAL TIME
export function OSCILLATOR(min, max, step) {
  if((typeof min === 'string' || typeof min === 'number') && (typeof max === 'string' || typeof max === 'number') && (typeof step === 'string' || typeof step === 'number')) {
    var ROOT = this;
    this.min = parseFloat(min);
    this.max = parseFloat(max);
    this.step = parseFloat(step);
    this.value_ = parseFloat(min);
    this.status = 0;
    this.on_maximum_value = function() {};
    this.on_minimum_value = function() {};
    this.UPDATE = function(STATUS_) {
      if(STATUS_ === undefined) {
        if(this.status == 0 && this.value_ < this.max) {
          this.value_ = this.value_ + this.step;
          if(this.value_ >= this.max) {
            this.value_ = this.max;
            this.status = 1;
            ROOT.on_maximum_value();
          }
          return this.value_;
        } else if(this.status == 1 && this.value_ > this.min) {
          this.value_ = this.value_ - this.step;
          if(this.value_ <= this.min) {
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
export function SWITCHER() {
  var ROOT = this;
  ROOT.VALUE = 1;
  ROOT.GET = function() {
    ROOT.VALUE = ROOT.VALUE * -1;
    return ROOT.VALUE;
  };
}

export function ORBIT(cx, cy, angle, p) {
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

export function ORBIT_FROM_ARRAY(cx, cy, angle, p, byIndexs) {
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

export var byId = function(id) {return document.getElementById(id)};
export function randomFloatFromTo(min, max) {return Math.random() * (max - min) + min;}

export function randomIntFromTo(min, max) {
  if(typeof min === 'object' || typeof max === 'object') {
    console.log(
      "SYS : warning Desciption : Replace object with string , this >> " + typeof min + ' and ' + typeof min + ' << must be string or number.'
    );
  } else if(typeof min === 'undefined' || typeof max === 'undefined') {
    console.log(
      "SYS : warning Desciption : arguments (min, max) cant be undefined , this >> " + typeof min + ' and ' + typeof min + ' << must be string or number.'
    );
  } else {
    return Math.floor(Math.random() * (max - min + 1) + min);
  }
}

export var urlQuery = (function() {
  var query_string = {};
  var query = window.location.search.substring(1);
  var vars = query.split('&');
  for(var i = 0;i < vars.length;i++) {
    var pair = vars[i].split('=');
    if(typeof query_string[pair[0]] === 'undefined') {
      query_string[pair[0]] = decodeURIComponent(pair[1]);
    } else if(typeof query_string[pair[0]] === 'string') {
      var arr = [query_string[pair[0]], decodeURIComponent(pair[1])];
      query_string[pair[0]] = arr;
    } else {
      query_string[pair[0]].push(decodeURIComponent(pair[1]));
    }
  }
  return query_string;
})();


export function getAxisRot(q1) {
  var x, y, z;

  // if w>1 acos and sqrt will produce errors, this cant happen if quaternion is normalised
  if(q1.w > 1) q1.normalise();
  var angle = 2 * Math.acos(q1.w);
  // assuming quaternion normalised then w is less than 1, so term always positive.
  var s = Math.sqrt(1 - q1.w * q1.w);
  // test to avoid divide by zero, s is always positive due to sqrt
  if(s < 0.001) {
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
  return [radToDeg(x), radToDeg(y), radToDeg(z)]
}

export function getAxisRot2(targetAxis, Q) {
  Q.normalize(); // if w>1 acos and sqrt will produce errors, this cant happen if quaternion is normalised
  var angle = 2 * Math.acos(Q.w());
  var s = Math.sqrt(1 - Q.w() * Q.w()); // assuming quaternion normalised then w is less than 1, so term always positive.
  if(s < 0.001) { // test to avoid divide by zero, s is always positive due to sqrt
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

export function getAxisRot3(Q) {

  var angle = Math.acos(Q.w) * 2;
  var axis = {};

  if(Math.sin(Math.acos(angle)) > 0) {

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
export function quaternion_rotation_matrix(Q) {

  // Covert a quaternion into a full three-dimensional rotation matrix.

  // Input
  // :param Q: A 4 element array representing the quaternion (q0,q1,q2,q3) 

  // Output
  // :return: A 3x3 element matrix representing the full 3D rotation matrix. 
  //          This rotation matrix converts a point in the local reference 
  //          frame to a point in the global reference frame.
  // """
  // # Extract the values from Q
  var q0 = Q[0]
  var q1 = Q[1]
  var q2 = Q[2]
  var q3 = Q[3]

  // # First row of the rotation matrix
  var r00 = 2 * (q0 * q0 + q1 * q1) - 1
  var r01 = 2 * (q1 * q2 - q0 * q3)
  var r02 = 2 * (q1 * q3 + q0 * q2)

  // # Second row of the rotation matrix
  var r10 = 2 * (q1 * q2 + q0 * q3)
  var r11 = 2 * (q0 * q0 + q2 * q2) - 1
  var r12 = 2 * (q2 * q3 - q0 * q1)

  // # Third row of the rotation matrix
  var r20 = 2 * (q1 * q3 - q0 * q2)
  var r21 = 2 * (q2 * q3 + q0 * q1)
  var r22 = 2 * (q0 * q0 + q3 * q3) - 1

  // # 3x3 rotation matrix
  var rot_matrix = [[r00, r01, r02],
  [r10, r11, r12],
  [r20, r21, r22]]

  return rot_matrix;
}

// copnsole log graphics
export const LOG_WARN = 'background: gray; color: yellow; font-size:10px';
export const LOG_INFO = 'background: green; color: white; font-size:11px';
export const LOG_MATRIX = "font-family: stormfaze;color: #lime; font-size:11px;text-shadow: 2px 2px 4px orangered;background: black;";
export const LOG_FUNNY = "font-family: stormfaze;color: #f1f033; font-size:14px;text-shadow: 2px 2px 4px #f335f4, 4px 4px 4px #d64444, 2px 2px 4px #c160a6, 6px 2px 0px #123de3;background: black;";
export const LOG_FUNNY_SMALL = "font-family: stormfaze;color: #f1f033; font-size:10px;text-shadow: 2px 2px 4px #f335f4, 4px 4px 4px #d64444, 1px 1px 2px #c160a6, 3px 1px 0px #123de3;background: black;";

export function genName(length) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for(let i = 0;i < length;i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export let mb = {
  root: () => byId('msgBox'),
  pContent: () => byId('not-content'),
  copy: function() {
    navigator.clipboard.writeText(mb.root().children[0].innerText);
  },
  c: 0, ic: 0, t: {},
  setContent: function(content, t) {
    var iMsg = document.createElement('div');
    iMsg.innerHTML = content;
    iMsg.id = `msgbox-loc-${mb.c}`;
    mb.root().appendChild(iMsg);
    iMsg.classList.add('animate1')
    if(t == 'ok') {
      iMsg.style = 'font-family: stormfaze;color:white;padding:7px;margin:2px';
    } else {
      iMsg.style = 'font-family: stormfaze;color:white;padding:7px;margin:2px';
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
        if(mb.c == mb.ic) {
          mb.root().style.display = 'none';
        }
      }, 1000)
    }, 3000);
    mb.c++;
  },
  error: function(content) {
    if(mb.root() == null) return;
    mb.root().classList.remove("success")
    mb.root().classList.add("error")
    mb.root().classList.add("fadeInDown");
    mb.show(content, 'err');
  },
  success: function(content) {
    if(mb.root() == null) return;
    mb.root().classList.remove("error")
    mb.root().classList.add("success")
    mb.root().classList.add("fadeInDown");
    mb.show(content, 'ok');
  }
}

// Registry to track running animations per element
const typingStates = new Map();

export function typeText(elementId, htmlString, delay = 50) {
  const el = document.getElementById(elementId);
  if(!el) return;

  // If an existing typing is running for this element, cancel it
  if(typingStates.has(elementId)) {
    clearTimeout(typingStates.get(elementId).timeoutId);
    typingStates.delete(elementId);
  }

  el.innerHTML = ''; // Clear previous content

  const tempEl = document.createElement('div');
  tempEl.innerHTML = htmlString;

  const queue = [];

  function flatten(node) {
    if(node.nodeType === Node.TEXT_NODE) {
      queue.push({type: 'text', text: node.textContent});
    } else if(node.nodeType === Node.ELEMENT_NODE) {
      if(node.tagName.toLowerCase() === 'img') {
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
        for(const child of node.childNodes) flatten(child);
        queue.push({type: 'end'});
      }
    }
  }

  for(const node of tempEl.childNodes) flatten(node);

  let stack = [];
  let currentElement = el;

  function typeNextChar() {
    if(queue.length === 0) {
      typingStates.delete(elementId); // Cleanup after finish
      return;
    }

    const item = queue[0];

    if(item.type === 'text') {
      if(!item.index) item.index = 0;

      const ch = item.text[item.index];
      if(ch === '\n') {
        currentElement.appendChild(document.createElement('br'));
      } else {
        currentElement.appendChild(document.createTextNode(ch));
      }

      item.index++;
      if(item.index >= item.text.length) queue.shift();

    } else if(item.type === 'element') {
      const newEl = document.createElement(item.tag);
      if(item.attributes) {
        for(let [key, val] of Object.entries(item.attributes)) {
          newEl.setAttribute(key, val);
        }
      }
      currentElement.appendChild(newEl);
      stack.push(currentElement);
      currentElement = newEl;
      queue.shift();

    } else if(item.type === 'end') {
      currentElement = stack.pop();
      queue.shift();

    } else if(item.type === 'img') {
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
    typingStates.set(elementId, {timeoutId});
  }

  typeNextChar();
}


export function setupCanvasFilters(canvasId) {
  let canvas = document.getElementById(canvasId);
  if(canvas == null) {
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
    el.addEventListener("change", (e) => {
      filterState[key] = e.target.value;
      updateFilter();
    });
  });

  updateFilter(); // Initial
}

/**
 * @description
 * // Save an object
    Storage.set('playerData', { name: 'Slayzer', hp: 120, mana: 80 });

    // Load it back
    const player = Storage.get('playerData');
    console.log(player.name); // "Slayzer"

    // Check if exists
    if (Storage.has('playerData')) console.log('Found!');

    // Remove one
    Storage.remove('playerData');

    // Clear all localStorage
    Storage.clear();
 */
export const LS = {
  set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  },

  get(key, defaultValue = null) {
    const item = localStorage.getItem(key);
    try {
      return item ? JSON.parse(item) : defaultValue;
    } catch(e) {
      console.warn(`Error parsing localStorage key "${key}"`, e);
      return defaultValue;
    }
  },

  has(key) {
    return localStorage.getItem(key) !== null;
  },

  remove(key) {
    localStorage.removeItem(key);
  },

  clear() {
    localStorage.clear();
  }
};

export const SS = {
  set(key, value) {
    sessionStorage.setItem(key, JSON.stringify(value));
  },

  get(key, defaultValue = null) {
    const item = sessionStorage.getItem(key);
    try {
      return item ? JSON.parse(item) : defaultValue;
    } catch(e) {
      console.warn(`Error parsing sessionStorage key "${key}"`, e);
      return defaultValue;
    }
  },

  has(key) {
    return sessionStorage.getItem(key) !== null;
  },

  remove(key) {
    sessionStorage.removeItem(key);
  },

  clear() {
    sessionStorage.clear();
  }
};
export const jsonHeaders = new Headers({
	"Content-Type": "application/json",
	"Accept": "application/json",
});

export const htmlHeader = new Headers({
	"Content-Type": "text/html",
	"Accept": "text/plain",
});

export function isEven(n) {
  return n % 2 === 0;
}

export function isOdd(n) {
  return n % 2 !== 0;
}