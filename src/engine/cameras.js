import {mat4, vec3} from 'wgpu-matrix';
import {isMobile} from './utils';

export class WASDCamera {
  pitch = 0;
  yaw = 0;
  position = new Float32Array(3);
  velocity = new Float32Array(3);
  view = new Float32Array(16);
  VP = new Float32Array(16);
  projectionMatrix = new Float32Array(16);
  _moveVelScratch = new Float32Array(3);
  _dirty = true;
  right = vec3.fromValues(1, 0, 0);
  up = vec3.fromValues(0, 1, 0);
  back = vec3.fromValues(0, 0, 1);
  _rotYScratch = mat4.create();
  _rotXScratch = mat4.create();
  _viewScratch = mat4.create();
  _digital = {forward: false, backward: false, left: false, right: false, up: false, down: false};
  _lastX = 0;
  _lastY = 0;
  _mouseDown = false;
  _pointerLastScratch = {x: 0, y: 0};
  // Sensitivity
  MOUSE_SENS = 0.01;
  TOUCH_SENS = 0.03;
  movementSpeed = 0.2;
  rotationSpeed = 1;
  _dirtyAngle = false;

  constructor(options = {}) {
    if(options.position) {
      this.position[0] = options.position[0];
      this.position[1] = options.position[1];
      this.position[2] = options.position[2];
    }
    if(options.pitch) this.pitch = options.pitch;
    if(options.yaw) this.yaw = options.yaw;
    this.canvas = options.canvas;
    this.aspect = options.canvas ? options.canvas.width / options.canvas.height : 1;
    this.setProjection((2 * Math.PI) / 5, this.aspect, 1, 1000);
    if(this.canvas) this._setupInput(this.canvas);
    this._recalculateViewVP();
  }

  setProjection(fov = (2 * Math.PI) / 5, aspect = 1, near = 1, far = 1000) {
    mat4.perspective(fov, aspect, near, far, this.projectionMatrix);
    this._recalculateViewVP();
  }

  static mat4MultiplySafe(a, b, out) {
    const a00 = a[0], a01 = a[4], a02 = a[8], a03 = a[12];
    const a10 = a[1], a11 = a[5], a12 = a[9], a13 = a[13];
    const a20 = a[2], a21 = a[6], a22 = a[10], a23 = a[14];
    const a30 = a[3], a31 = a[7], a32 = a[11], a33 = a[15];

    const b00 = b[0], b01 = b[4], b02 = b[8], b03 = b[12];
    const b10 = b[1], b11 = b[5], b12 = b[9], b13 = b[13];
    const b20 = b[2], b21 = b[6], b22 = b[10], b23 = b[14];
    const b30 = b[3], b31 = b[7], b32 = b[11], b33 = b[15];

    out[0] = a00 * b00 + a01 * b10 + a02 * b20 + a03 * b30;
    out[1] = a10 * b00 + a11 * b10 + a12 * b20 + a13 * b30;
    out[2] = a20 * b00 + a21 * b10 + a22 * b20 + a23 * b30;
    out[3] = a30 * b00 + a31 * b10 + a32 * b20 + a33 * b30;

    out[4] = a00 * b01 + a01 * b11 + a02 * b21 + a03 * b31;
    out[5] = a10 * b01 + a11 * b11 + a12 * b21 + a13 * b31;
    out[6] = a20 * b01 + a21 * b11 + a22 * b21 + a23 * b31;
    out[7] = a30 * b01 + a31 * b11 + a32 * b21 + a33 * b31;

    out[8] = a00 * b02 + a01 * b12 + a02 * b22 + a03 * b32;
    out[9] = a10 * b02 + a11 * b12 + a12 * b22 + a13 * b32;
    out[10] = a20 * b02 + a21 * b12 + a22 * b22 + a23 * b32;
    out[11] = a30 * b02 + a31 * b12 + a32 * b22 + a33 * b32;

    out[12] = a00 * b03 + a01 * b13 + a02 * b23 + a03 * b33;
    out[13] = a10 * b03 + a11 * b13 + a12 * b23 + a13 * b33;
    out[14] = a20 * b03 + a21 * b13 + a22 * b23 + a23 * b33;
    out[15] = a30 * b03 + a31 * b13 + a32 * b23 + a33 * b33;

    return out;
  }

  _recalculateViewVP() {
    const cy = Math.cos(this.yaw), sy = Math.sin(this.yaw);
    const cp = Math.cos(this.pitch), sp = Math.sin(this.pitch);
    this.right[0] = cy; this.right[1] = 0; this.right[2] = -sy;
    this.up[0] = sy * sp; this.up[1] = cp; this.up[2] = cy * sp;
    this.back[0] = sy * cp; this.back[1] = -sp; this.back[2] = cy * cp;
    const rx = this.right, uy = this.up, bz = this.back, p = this.position;
    const vs = this.view;
    vs[0] = rx[0]; vs[4] = rx[1]; vs[8] = rx[2]; vs[12] = -(rx[0] * p[0] + rx[1] * p[1] + rx[2] * p[2]);
    vs[1] = uy[0]; vs[5] = uy[1]; vs[9] = uy[2]; vs[13] = -(uy[0] * p[0] + uy[1] * p[1] + uy[2] * p[2]);
    vs[2] = bz[0]; vs[6] = bz[1]; vs[10] = bz[2]; vs[14] = -(bz[0] * p[0] + bz[1] * p[1] + bz[2] * p[2]);
    vs[3] = 0; vs[7] = 0; vs[11] = 0; vs[15] = 1;
    WASDCamera.mat4MultiplySafe(this.projectionMatrix, this.view, this.VP);
  }

  _setupInput(canvas) {
    canvas.style.touchAction = 'none';
    canvas.addEventListener('pointerdown', e => {
      // e.preventDefault();
      this._mouseDown = true;
      this._lastX = e.clientX;
      this._lastY = e.clientY;
      canvas.setPointerCapture(e.pointerId);
    }, {passive: true});
    const pointerUp = e => {this._mouseDown = false;};
    canvas.addEventListener('pointerup', pointerUp, {passive: true});
    canvas.addEventListener('pointercancel', pointerUp, {passive: true});
    canvas.addEventListener('pointermove', e => {
      // e.preventDefault();
      const events = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
      for(const ce of events) {
        let dx = 0, dy = 0;
        if(ce.pointerType === 'mouse') {
          if((ce.buttons & 1) === 0) continue;
          dx = ce.movementX * this.MOUSE_SENS;
          dy = ce.movementY * this.MOUSE_SENS;
        } else {
          dx = (ce.clientX - this._lastX) * this.TOUCH_SENS;
          dy = (ce.clientY - this._lastY) * this.TOUCH_SENS;
          this._lastX = ce.clientX;
          this._lastY = ce.clientY;
        }
        this.yaw -= dx * this.rotationSpeed;
        this.pitch -= dy * this.rotationSpeed;
        this.yaw %= Math.PI * 2;
        this.pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.pitch));
        this._dirtyAngle = true;
        // this._recalculateViewVP();
      }
    }, {passive: true});

    this._keyInterval = null;
    const setDigital = (e, value) => {
      switch(e.code) {
        case 'KeyW': this._digital.forward = value; break;
        case 'KeyS': this._digital.backward = value; break;
        case 'KeyA': this._digital.left = value; break;
        case 'KeyD': this._digital.right = value; break;
        case 'KeyV': this._digital.up = value; break;
        case 'KeyC': this._digital.down = value; break;
      }
      if(value == true && this._keyInterval === null) {
        this._keyInterval = setInterval(() => {
          this._dirty = true;
          this._dirtyAngle = true;
          this._applyDigitalMovement()
        }, 16);
      } else {
        const d = this._digital;
        if(!d.forward && !d.backward && !d.left && !d.right && !d.up && !d.down) {
          clearInterval(this._keyInterval);
          this._keyInterval = null;
          console.log
          this._dirty = false;
          this._dirtyAngle = false;
        }
      }
    };
    window.addEventListener('keydown', e => setDigital(e, true), {passive: true});
    window.addEventListener('keyup', e => setDigital(e, false), {passive: true});
  }

  _applyDigitalMovement() {
    const d = this._digital;
    let vx = 0, vy = 0, vz = 0;

    if(d.forward) {vx -= this.back[0]; vy -= this.back[1]; vz -= this.back[2];}
    if(d.backward) {vx += this.back[0]; vy += this.back[1]; vz += this.back[2];}
    if(d.right) {vx += this.right[0]; vy += this.right[1]; vz += this.right[2];}
    if(d.left) {vx -= this.right[0]; vy -= this.right[1]; vz -= this.right[2];}
    if(d.up) {vx += this.up[0]; vy += this.up[1]; vz += this.up[2];}
    if(d.down) {vx -= this.up[0]; vy -= this.up[1]; vz -= this.up[2];}

    const len = Math.sqrt(vx * vx + vy * vy + vz * vz);
    if(len < 0.0001) return;

    const s = this.movementSpeed; // / len;
    this.position[0] += vx * s;
    this.position[1] += vy * s;
    this.position[2] += vz * s;

    // only update translation — rotation already correct
    const rx = this.right, uy = this.up, bz = this.back, p = this.position;
    this.view[12] = -(rx[0] * p[0] + rx[1] * p[1] + rx[2] * p[2]);
    this.view[13] = -(uy[0] * p[0] + uy[1] * p[1] + uy[2] * p[2]);
    this.view[14] = -(bz[0] * p[0] + bz[1] * p[1] + bz[2] * p[2]);
    WASDCamera.mat4MultiplySafe(this.projectionMatrix, this.view, this.VP);
    this._dirty = false;
  }

  update() {
    if(!this._dirtyAngle) return;
    this._recalculateViewVP();
    this._dirtyAngle = false;
  }

  setX(x) {
    this.position[0] = x;
    this._dirtyAngle = true;
  }

  setY(y) {
    this.position[1] = y;
    this._dirtyAngle = true;
  }

  setZ(z) {
    this.position[2] = z;
    this._dirtyAngle = true;
  }

  setPosition(x, y, z) {
    this.position[0] = x;
    this.position[1] = y;
    this.position[2] = z;
    this._dirtyAngle = true;
  }

  setPitch(p) {
    this.pitch = p;
    this._dirtyAngle = true;
  }

  setYaw(y) {
    this.yaw = y;
    this._dirtyAngle = true;
  }

  setTarget(x, y, z) {
    this.target[0] = x;
    this.target[1] = y;
    this.target[2] = z;
    this._dirtyAngle = true;
  }
}

export class ArcballCamera {
  position = new Float32Array(3);
  right = new Float32Array(3);
  up = new Float32Array(3);
  back = new Float32Array(3);

  view = new Float32Array(16);
  projectionMatrix = new Float32Array(16);
  VP = new Float32Array(16);

  distance = 0;
  angularVelocity = 0;
  axis = new Float32Array(3);
  rotationSpeed = 1;
  zoomSpeed = 0.1;
  frictionCoefficient = 0.999;

  _movement = new Float32Array(3);
  _cross = new Float32Array(3);

  constructor(options = {}) {
    if(options.position) {
      this.position.set(options.position);
      this.distance = Math.hypot(
        this.position[0],
        this.position[1],
        this.position[2]
      );
      const invLen = 1 / this.distance;
      this.back[0] = this.position[0] * invLen;
      this.back[1] = this.position[1] * invLen;
      this.back[2] = this.position[2] * invLen;
    }
    this.setProjection((2 * Math.PI) / 5, 1, 1, 2000);
    this._recalculateRight();
    this._recalculateUp();
    this._recalculateViewVP();
  }

  setProjection(fov, aspect, near, far) {
    mat4.perspective(fov, aspect, near, far, this.projectionMatrix);
  }

  _normalize(v) {
    const len = Math.hypot(v[0], v[1], v[2]);
    if(len > 0.000001) {
      const inv = 1 / len;
      v[0] *= inv;
      v[1] *= inv;
      v[2] *= inv;
    }
  }

  _crossFn(a, b, out) {
    const ax = a[0], ay = a[1], az = a[2];
    const bx = b[0], by = b[1], bz = b[2];
    out[0] = ay * bz - az * by;
    out[1] = az * bx - ax * bz;
    out[2] = ax * by - ay * bx;
  }

  _rotateVec(v, axis, angle, out) {
    const x = v[0], y = v[1], z = v[2];
    const u = axis[0], vA = axis[1], w = axis[2];
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    out[0] =
      u * (u * x + vA * y + w * z) * (1 - cos) +
      x * cos +
      (-w * y + vA * z) * sin;
    out[1] =
      vA * (u * x + vA * y + w * z) * (1 - cos) +
      y * cos +
      (w * x - u * z) * sin;
    out[2] =
      w * (u * x + vA * y + w * z) * (1 - cos) +
      z * cos +
      (-vA * x + u * y) * sin;
  }

  _recalculateRight() {
    this._crossFn(this.up, this.back, this.right);
    this._normalize(this.right);
  }

  _recalculateUp() {
    this._crossFn(this.back, this.right, this.up);
    this._normalize(this.up);
  }

  _recalculateViewVP() {
    const rx = this.right, uy = this.up, bz = this.back, p = this.position;
    const vs = this.view;
    vs[0] = rx[0]; vs[4] = rx[1]; vs[8] = rx[2]; vs[12] = -(rx[0] * p[0] + rx[1] * p[1] + rx[2] * p[2]);
    vs[1] = uy[0]; vs[5] = uy[1]; vs[9] = uy[2]; vs[13] = -(uy[0] * p[0] + uy[1] * p[1] + uy[2] * p[2]);
    vs[2] = bz[0]; vs[6] = bz[1]; vs[10] = bz[2]; vs[14] = -(bz[0] * p[0] + bz[1] * p[1] + bz[2] * p[2]);
    vs[3] = 0; vs[7] = 0; vs[11] = 0; vs[15] = 1;
    ArcballCamera.mat4MultiplySafe(this.projectionMatrix, this.view, this.VP);
  }

  update(deltaTime, input) {
    const epsilon = 1e-7;
    if(input.analog.touching) {
      this.angularVelocity = 0;
    } else {
      this.angularVelocity *= Math.pow(1 - this.frictionCoefficient, deltaTime);
    }
    const m = this._movement;
    m[0] = this.right[0] * input.analog.x + this.up[0] * -input.analog.y;
    m[1] = this.right[1] * input.analog.x + this.up[1] * -input.analog.y;
    m[2] = this.right[2] * input.analog.x + this.up[2] * -input.analog.y;
    const c = this._cross;
    this._crossFn(m, this.back, c);
    const mag = Math.hypot(c[0], c[1], c[2]);
    if(mag > epsilon) {
      const inv = 1 / mag;
      this.axis[0] = c[0] * inv;
      this.axis[1] = c[1] * inv;
      this.axis[2] = c[2] * inv;
      this.angularVelocity = mag * this.rotationSpeed;
    }
    const angle = this.angularVelocity * deltaTime;
    if(angle > epsilon) {
      this._rotateVec(this.back, this.axis, angle, this.back);
      this._normalize(this.back);
      this._recalculateRight();
      this._recalculateUp();
    }
    if(input.analog.zoom !== 0) {
      this.distance *= 1 + input.analog.zoom * this.zoomSpeed;
    }
    this.position[0] = this.back[0] * this.distance;
    this.position[1] = this.back[1] * this.distance;
    this.position[2] = this.back[2] * this.distance;
    this._recalculateViewVP();
    return this.view;
  }
  static mat4MultiplySafe(a, b, out) {return out}
}

export class RPGCamera {
  pitch = -0.88;
  yaw = 0;

  position = new Float32Array(3);

  right = new Float32Array(3);
  up = new Float32Array(3);
  back = new Float32Array(3);

  view = new Float32Array(16);
  projectionMatrix = new Float32Array(16);
  VP = new Float32Array(16);

  // ===== RPG =====
  followMe = null;
  followMeOffset = 150;

  scrollY = 50;
  minY = 50.5;
  maxY = 135.0;
  scrollSpeed = 1;

  mousRollInAction = false;

  _dirty = true;

  constructor(options = {}) {
    if(options.position) {
      this.position[0] = options.position[0];
      this.position[1] = options.position[1];
      this.position[2] = options.position[2];
    }

    this.canvas = options.canvas;
    this.aspect = this.canvas ? this.canvas.width / this.canvas.height : 1;

    this.setProjection((2 * Math.PI) / 5, this.aspect, 1, 2000);

    this._setupEvents();

    this._recalculateViewVP();
  }

  setProjection(fov, aspect, near, far) {
    mat4.perspective(fov, aspect, near, far, this.projectionMatrix);
    this._dirty = true;
  }

  static mat4MultiplySafe(a, b, out) {
    const a00 = a[0], a01 = a[4], a02 = a[8], a03 = a[12];
    const a10 = a[1], a11 = a[5], a12 = a[9], a13 = a[13];
    const a20 = a[2], a21 = a[6], a22 = a[10], a23 = a[14];
    const a30 = a[3], a31 = a[7], a32 = a[11], a33 = a[15];

    const b00 = b[0], b01 = b[4], b02 = b[8], b03 = b[12];
    const b10 = b[1], b11 = b[5], b12 = b[9], b13 = b[13];
    const b20 = b[2], b21 = b[6], b22 = b[10], b23 = b[14];
    const b30 = b[3], b31 = b[7], b32 = b[11], b33 = b[15];

    out[0] = a00 * b00 + a01 * b10 + a02 * b20 + a03 * b30;
    out[1] = a10 * b00 + a11 * b10 + a12 * b20 + a13 * b30;
    out[2] = a20 * b00 + a21 * b10 + a22 * b20 + a23 * b30;
    out[3] = a30 * b00 + a31 * b10 + a32 * b20 + a33 * b30;

    out[4] = a00 * b01 + a01 * b11 + a02 * b21 + a03 * b31;
    out[5] = a10 * b01 + a11 * b11 + a12 * b21 + a13 * b31;
    out[6] = a20 * b01 + a21 * b11 + a22 * b21 + a23 * b31;
    out[7] = a30 * b01 + a31 * b11 + a32 * b21 + a33 * b31;

    out[8] = a00 * b02 + a01 * b12 + a02 * b22 + a03 * b32;
    out[9] = a10 * b02 + a11 * b12 + a12 * b22 + a13 * b32;
    out[10] = a20 * b02 + a21 * b12 + a22 * b22 + a23 * b32;
    out[11] = a30 * b02 + a31 * b12 + a32 * b22 + a33 * b32;

    out[12] = a00 * b03 + a01 * b13 + a02 * b23 + a03 * b33;
    out[13] = a10 * b03 + a11 * b13 + a12 * b23 + a13 * b33;
    out[14] = a20 * b03 + a21 * b13 + a22 * b23 + a23 * b33;
    out[15] = a30 * b03 + a31 * b13 + a32 * b23 + a33 * b33;

    return out;
  }

  _setupEvents() {
    addEventListener('wheel', (e) => {
      this.mousRollInAction = true;

      this.scrollY -= e.deltaY * this.scrollSpeed * 0.01;
      this.scrollY = Math.max(this.minY, Math.min(this.maxY, this.scrollY));

      this._dirty = true;
    });
  }

  // 🔥 SAME AS WASD (no matrices)
  _updateOrientation() {
    const cy = Math.cos(this.yaw), sy = Math.sin(this.yaw);
    const cp = Math.cos(this.pitch), sp = Math.sin(this.pitch);

    this.right[0] = cy; this.right[1] = 0; this.right[2] = -sy;
    this.up[0] = sy * sp; this.up[1] = cp; this.up[2] = cy * sp;
    this.back[0] = sy * cp; this.back[1] = -sp; this.back[2] = cy * cp;
  }

  _updateFollow() {
    if(!this.followMe) return;
    if(this.followMe.inMove === true || this.mousRollInAction) {
      this.followMeOffset = this.scrollY;
      this.position[0] = this.followMe.x;
      this.position[2] = this.followMe.z + this.followMeOffset;
      app.lightContainer[0].setPosX(this.followMe.x);
      app.lightContainer[0].setPosZ(this.followMe.z);
      app.lightContainer[0].setTargetX(this.followMe.x);
      app.lightContainer[0].setTargetZ(this.followMe.z);
      this.mousRollInAction = false;
      this._dirty = true;
    }
    // smooth Y only (cheap)
    const smoothFactor = 0.1;
    const newY = this.position[1] + (this.scrollY - this.position[1]) * smoothFactor;
    if(Math.abs(newY - this.position[1]) > 0.0001) {
      this.position[1] = newY;
      this._dirty = true;
    }
  }

  _recalculateViewVP() {
    this._updateOrientation();

    const rx = this.right, uy = this.up, bz = this.back, p = this.position;
    const vs = this.view;

    vs[0] = rx[0]; vs[4] = rx[1]; vs[8] = rx[2]; vs[12] = -(rx[0] * p[0] + rx[1] * p[1] + rx[2] * p[2]);
    vs[1] = uy[0]; vs[5] = uy[1]; vs[9] = uy[2]; vs[13] = -(uy[0] * p[0] + uy[1] * p[1] + uy[2] * p[2]);
    vs[2] = bz[0]; vs[6] = bz[1]; vs[10] = bz[2]; vs[14] = -(bz[0] * p[0] + bz[1] * p[1] + bz[2] * p[2]);

    vs[3] = 0; vs[7] = 0; vs[11] = 0; vs[15] = 1;

    RPGCamera.mat4MultiplySafe(this.projectionMatrix, this.view, this.VP);
  }

  update() {
    this._updateFollow();

    if(!this._dirty) return;

    this._recalculateViewVP();
    this._dirty = false;
  }
}

export class FirstPersonCamera {
  pitch = 0;
  yaw = 0;
  position = new Float32Array(3);
  velocity = new Float32Array(3);
  view = new Float32Array(16);
  VP = new Float32Array(16);
  projectionMatrix = new Float32Array(16);
  _moveVelScratch = new Float32Array(3);
  _dirty = true;
  right = vec3.fromValues(1, 0, 0);
  up = vec3.fromValues(0, 1, 0);
  back = vec3.fromValues(0, 0, 1);
  _rotYScratch = mat4.create();
  _rotXScratch = mat4.create();
  _viewScratch = mat4.create();
  _digital = {forward: false, backward: false, left: false, right: false};
  _lastX = 0;
  _lastY = 0;
  _mouseDown = false;
  _pointerLastScratch = {x: 0, y: 0};
  MOUSE_SENS = 0.01;
  TOUCH_SENS = 0.03;
  movementSpeed = 0.2;
  rotationSpeed = 1;
  _dirtyAngle = false;

  constructor(options = {}) {
    if(options.position) {
      this.position[0] = options.position[0];
      this.position[1] = options.position[1];
      this.position[2] = options.position[2];
    }
    if(options.pitch) this.pitch = options.pitch;
    if(options.yaw) this.yaw = options.yaw;
    this.canvas = options.canvas;
    this.aspect = options.canvas ? options.canvas.width / options.canvas.height : 1;
    this.setProjection((2 * Math.PI) / 5, this.aspect, 0.3, 100);
    if(this.canvas) this._setupInput(this.canvas);
    this._recalculateViewVP();

    if(isMobile() == true) {
      MobileDOM.createWASD(this);
    }
  }

  setProjection(fov = (2 * Math.PI) / 5, aspect = 1, near = 1, far = 1000) {
    mat4.perspective(fov, aspect, near, far, this.projectionMatrix);
    this._recalculateViewVP();
  }

  static mat4MultiplySafe(a, b, out) {
    const a00 = a[0], a01 = a[4], a02 = a[8], a03 = a[12];
    const a10 = a[1], a11 = a[5], a12 = a[9], a13 = a[13];
    const a20 = a[2], a21 = a[6], a22 = a[10], a23 = a[14];
    const a30 = a[3], a31 = a[7], a32 = a[11], a33 = a[15];
    const b00 = b[0], b01 = b[4], b02 = b[8], b03 = b[12];
    const b10 = b[1], b11 = b[5], b12 = b[9], b13 = b[13];
    const b20 = b[2], b21 = b[6], b22 = b[10], b23 = b[14];
    const b30 = b[3], b31 = b[7], b32 = b[11], b33 = b[15];
    out[0] = a00 * b00 + a01 * b10 + a02 * b20 + a03 * b30;
    out[1] = a10 * b00 + a11 * b10 + a12 * b20 + a13 * b30;
    out[2] = a20 * b00 + a21 * b10 + a22 * b20 + a23 * b30;
    out[3] = a30 * b00 + a31 * b10 + a32 * b20 + a33 * b30;
    out[4] = a00 * b01 + a01 * b11 + a02 * b21 + a03 * b31;
    out[5] = a10 * b01 + a11 * b11 + a12 * b21 + a13 * b31;
    out[6] = a20 * b01 + a21 * b11 + a22 * b21 + a23 * b31;
    out[7] = a30 * b01 + a31 * b11 + a32 * b21 + a33 * b31;
    out[8] = a00 * b02 + a01 * b12 + a02 * b22 + a03 * b32;
    out[9] = a10 * b02 + a11 * b12 + a12 * b22 + a13 * b32;
    out[10] = a20 * b02 + a21 * b12 + a22 * b22 + a23 * b32;
    out[11] = a30 * b02 + a31 * b12 + a32 * b22 + a33 * b32;
    out[12] = a00 * b03 + a01 * b13 + a02 * b23 + a03 * b33;
    out[13] = a10 * b03 + a11 * b13 + a12 * b23 + a13 * b33;
    out[14] = a20 * b03 + a21 * b13 + a22 * b23 + a23 * b33;
    out[15] = a30 * b03 + a31 * b13 + a32 * b23 + a33 * b33;
    return out;
  }

  _recalculateViewVP() {
    const cy = Math.cos(this.yaw), sy = Math.sin(this.yaw);
    const cp = Math.cos(this.pitch), sp = Math.sin(this.pitch);
    this.right[0] = cy; this.right[1] = 0; this.right[2] = -sy;
    this.up[0] = sy * sp; this.up[1] = cp; this.up[2] = cy * sp;
    this.back[0] = sy * cp; this.back[1] = -sp; this.back[2] = cy * cp;
    const rx = this.right, uy = this.up, bz = this.back, p = this.position;
    const vs = this.view;
    vs[0] = rx[0]; vs[4] = rx[1]; vs[8] = rx[2]; vs[12] = -(rx[0] * p[0] + rx[1] * p[1] + rx[2] * p[2]);
    vs[1] = uy[0]; vs[5] = uy[1]; vs[9] = uy[2]; vs[13] = -(uy[0] * p[0] + uy[1] * p[1] + uy[2] * p[2]);
    vs[2] = bz[0]; vs[6] = bz[1]; vs[10] = bz[2]; vs[14] = -(bz[0] * p[0] + bz[1] * p[1] + bz[2] * p[2]);
    vs[3] = 0; vs[7] = 0; vs[11] = 0; vs[15] = 1;
    FirstPersonCamera.mat4MultiplySafe(this.projectionMatrix, this.view, this.VP);
  }

  _setupInput(canvas) {
    canvas.style.touchAction = 'none';
    canvas.addEventListener('pointerdown', e => {
      this._mouseDown = true;
      this._lastX = e.clientX;
      this._lastY = e.clientY;
      canvas.setPointerCapture(e.pointerId);
    }, {passive: true});
    const pointerUp = e => {this._mouseDown = false;};
    canvas.addEventListener('pointerup', pointerUp, {passive: true});
    canvas.addEventListener('pointercancel', pointerUp, {passive: true});
    canvas.addEventListener('pointermove', e => {
      const events = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
      for(const ce of events) {
        let dx = 0, dy = 0;
        if(ce.pointerType === 'mouse') {
          // if((ce.buttons & 1) === 0) continue;
          dx = ce.movementX * this.MOUSE_SENS;
          dy = ce.movementY * this.MOUSE_SENS;
        } else {
          dx = (ce.clientX - this._lastX) * this.TOUCH_SENS;
          dy = (ce.clientY - this._lastY) * this.TOUCH_SENS;
          this._lastX = ce.clientX;
          this._lastY = ce.clientY;
        }
        this.yaw -= dx * this.rotationSpeed;
        this.pitch -= dy * this.rotationSpeed;
        this.yaw %= Math.PI * 2;
        this.pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.pitch));
        this._dirtyAngle = true;
      }
    }, {passive: true});

    this._keyInterval = null;
    const setDigital = (e, value) => {
      switch(e.code) {
        case 'KeyW': this._digital.forward = value; break;
        case 'KeyS': this._digital.backward = value; break;
        case 'KeyA': this._digital.left = value; break;
        case 'KeyD': this._digital.right = value; break;
        // no V/C
      }
      if(value == true && this._keyInterval === null) {
        this._keyInterval = setInterval(() => {
          this._dirty = true;
          this._applyDigitalMovement();
        }, 16);
      } else {
        const d = this._digital;
        if(!d.forward && !d.backward && !d.left && !d.right) {
          clearInterval(this._keyInterval);
          this._keyInterval = null;
          this._dirty = false;
        }
      }
    };
    window.addEventListener('keydown', e => setDigital(e, true), {passive: true});
    window.addEventListener('keyup', e => setDigital(e, false), {passive: true});
  }

  _applyDigitalMovement() {
    const d = this._digital;
    let vx = 0, vz = 0;

    // flatten back onto XZ, ignore pitch
    const fx = -this.back[0];
    const fz = -this.back[2];
    const flen = Math.sqrt(fx * fx + fz * fz);
    const fnx = flen > 0.0001 ? fx / flen : 0;
    const fnz = flen > 0.0001 ? fz / flen : 0;

    if(d.forward) {vx += fnx; vz += fnz;}
    if(d.backward) {vx -= fnx; vz -= fnz;}
    if(d.right) {vx += this.right[0]; vz += this.right[2];}
    if(d.left) {vx -= this.right[0]; vz -= this.right[2];}

    const len = Math.sqrt(vx * vx + vz * vz);
    if(len < 0.0001) return;

    const s = this.movementSpeed / len;
    this.position[0] += vx * s;
    // position[1] never touched — stays at whatever was set in constructor
    this.position[2] += vz * s;

    const rx = this.right, uy = this.up, bz = this.back, p = this.position;
    this.view[12] = -(rx[0] * p[0] + rx[1] * p[1] + rx[2] * p[2]);
    this.view[13] = -(uy[0] * p[0] + uy[1] * p[1] + uy[2] * p[2]);
    this.view[14] = -(bz[0] * p[0] + bz[1] * p[1] + bz[2] * p[2]);
    FirstPersonCamera.mat4MultiplySafe(this.projectionMatrix, this.view, this.VP);
  }

  update() {
    if(!this._dirtyAngle) return;
    this._recalculateViewVP();
    this._dirtyAngle = false;
  }
}

const MobileDOM = {

  createWASD(camera, options = {}) {
    const size = options.size ?? 60;
    const margin = options.margin ?? 20;
    const opacity = options.opacity ?? 0.35;
    const color = options.color ?? '#ffffff';

    const wrap = document.createElement('div');
    Object.assign(wrap.style, {
      position: 'fixed',
      bottom: `${margin}px`,
      left: `${margin}px`,
      width: `${size * 3 + 8}px`,
      userSelect: 'none',
      zIndex: '9999',
      display: 'grid',
      gridTemplateColumns: `repeat(3, ${size}px)`,
      gridTemplateRows: `repeat(2, ${size}px)`,
      gap: '4px',
      touchAction: 'none',
    });

    // [key, label, col, row, digital_key]
    const defs = [
      ['W', '▲', 2, 1, 'forward'],
      ['A', '◀', 1, 2, 'left'],
      ['S', '▼', 2, 2, 'backward'],
      ['D', '▶', 3, 2, 'right'],
    ];

    for(const [, label, col, row, action] of defs) {
      const btn = document.createElement('div');
      Object.assign(btn.style, {
        width: `${size}px`,
        height: `${size}px`,
        gridColumn: `${col}`,
        gridRow: `${row}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: `${size * 0.38}px`,
        color,
        background: `rgba(255,255,255,${opacity * 0.4})`,
        border: `2px solid rgba(255,255,255,${opacity})`,
        borderRadius: `${size * 0.18}px`,
        cursor: 'pointer',
        WebkitTapHighlightColor: 'transparent',
      });
      btn.textContent = label;

      const press = () => {
        camera._digital[action] = true;
        btn.style.background = `rgba(255,255,255,${opacity})`;
        if(camera._keyInterval === null) {
          camera._keyInterval = setInterval(() => {
            camera._dirty = true;
            camera._applyDigitalMovement();
          }, 16);
        }
      };

      const release = () => {
        camera._digital[action] = false;
        btn.style.background = `rgba(255,255,255,${opacity * 0.4})`;
        const d = camera._digital;
        if(!d.forward && !d.backward && !d.left && !d.right) {
          clearInterval(camera._keyInterval);
          camera._keyInterval = null;
          camera._dirty = false;
        }
      };

      btn.addEventListener('pointerdown', e => {e.stopPropagation(); press(); btn.setPointerCapture(e.pointerId);}, {passive: true});
      btn.addEventListener('pointerup', e => {release();}, {passive: true});
      btn.addEventListener('pointercancel', e => {release();}, {passive: true});

      wrap.appendChild(btn);
    }

    document.body.appendChild(wrap);
    return wrap; // caller can hide/remove later
  },

  addButton(label, onClick, options = {}) {
    const size = options.size ?? 56;
    const margin = options.margin ?? 20;
    const opacity = options.opacity ?? 0.35;

    const btn = document.createElement('div');
    Object.assign(btn.style, {
      position: 'fixed',
      bottom: options.bottom ?? `${margin}px`,
      right: options.right ?? `${margin}px`,
      width: `${size}px`,
      height: `${size}px`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: `${size * 0.35}px`,
      color: options.color ?? '#ffffff',
      background: `rgba(255,255,255,${opacity * 0.4})`,
      border: `2px solid rgba(255,255,255,${opacity})`,
      borderRadius: '50%',
      zIndex: '9999',
      userSelect: 'none',
      cursor: 'pointer',
      WebkitTapHighlightColor: 'transparent',
      touchAction: 'none',
    });
    btn.textContent = label;

    btn.addEventListener('pointerdown', e => {
      e.stopPropagation();
      btn.style.background = `rgba(255,255,255,${opacity})`;
      onClick(e);
    }, {passive: true});
    btn.addEventListener('pointerup', () => {btn.style.background = `rgba(255,255,255,${opacity * 0.4})`;}, {passive: true});
    btn.addEventListener('pointercancel', () => {btn.style.background = `rgba(255,255,255,${opacity * 0.4})`;}, {passive: true});

    document.body.appendChild(btn);
    return btn;
  },
};