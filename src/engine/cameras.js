import {mat4, vec3} from 'wgpu-matrix';
import {byId, isMobile} from './utils';

export class WASDCamera {
  pitch = 0;
  yaw = 0;
  position = new Float32Array(3);
  velocity = new Float32Array(3);
  view = new Float32Array(16);
  VP = new Float32Array(16);
  projectionMatrix = new Float32Array(16);
  invProj = new Float32Array(16);
  _moveVelScratch = new Float32Array(3);
  _dirty = true;
  right = vec3.fromValues(1, 0, 0);
  up = vec3.fromValues(0, 1, 0);
  back = vec3.fromValues(0, 0, 1);
  _rotYScratch = mat4.create();
  _rotXScratch = mat4.create();
  _viewScratch = mat4.create();
  _digital = {forward: false, backward: false, left: false, right: false, up: false, down: false};
  _mouseDown = false;
  // Sensitivity matching standard FPCamera parameters
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
    if(options.noEvents) {
      this.noEvent = true;
    } else {
      this.noEvent = false;
    }
    if(this.canvas) this._setupInput(this.canvas);
    this._recalculateViewVP();
    if(isMobile() == true && options.isActive == 'init active cam') {
      MobileDOM.createWASD(this, {marginR: 0, marginD: 0});
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
    WASDCamera.mat4MultiplySafe(this.projectionMatrix, this.view, this.VP);
  }

  _setupInput(canvas) {
    canvas.style.touchAction = 'none';
    let touchStartX = 0, touchStartY = 0;
    if(isMobile() === true) {
      canvas.addEventListener('touchstart', e => {
        if(e.touches.length > 0) {
          touchStartX = e.touches[0].clientX;
          touchStartY = e.touches[0].clientY;
        }
      }, {passive: false});
      canvas.addEventListener('touchmove', e => {
        if(e.touches.length > 0) {
          const touch = e.touches[0];
          const dx = (touch.clientX - touchStartX) * this.TOUCH_SENS;
          const dy = (touch.clientY - touchStartY) * this.TOUCH_SENS;
          this.yaw -= dx * this.rotationSpeed;
          this.pitch -= dy * this.rotationSpeed;
          this.yaw %= Math.PI * 2;
          this.pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.pitch));
          this._dirtyAngle = true;
          touchStartX = touch.clientX;
          touchStartY = touch.clientY;
        }
        e.preventDefault();
      }, {passive: false});
    }

    if(isMobile() === false) {
      canvas.addEventListener('pointerdown', e => {
        if(e.pointerType === 'mouse') {
          this._mouseDown = true;
          if(canvas.requestPointerLock) {
            // canvas.requestPointerLock();
          } else {
            canvas.setPointerCapture(e.pointerId);
          }
        }
      }, {passive: false});

      canvas.addEventListener('pointermove', e => {
        if(e.pointerType === 'mouse' && this._mouseDown) {
          if(window.__isDragging === true) {return }
          const dx = e.movementX * this.MOUSE_SENS;
          const dy = e.movementY * this.MOUSE_SENS;
          this.yaw -= dx * this.rotationSpeed;
          this.pitch -= dy * this.rotationSpeed;
          this.yaw %= Math.PI * 2;
          this.pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.pitch));
          this._dirtyAngle = true;
        }
      }, {passive: true});

      canvas.addEventListener('pointerup', e => {
        if(e.pointerType === 'mouse') {
          this._mouseDown = false;
        }
      }, {passive: true});
    }

    this._keyInterval = null;
    const setDigital = (e, value) => {
      switch(e.code) {
        case 'ArrowUp': this._digital.forward = value; break;
        case 'ArrowDown': this._digital.backward = value; break;
        case 'ArrowLeft': this._digital.left = value; break;
        case 'ArrowRight': this._digital.right = value; break;
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
          this._applyDigitalMovement();
        }, 16);
      } else {
        const d = this._digital;
        if(!d.forward && !d.backward && !d.left && !d.right && !d.up && !d.down) {
          clearInterval(this._keyInterval);
          this._keyInterval = null;
          this._dirty = false;
          this._dirtyAngle = false;
        }
      }
    };

    if(this.noEvent !== true) {
      window.addEventListener('keydown', e => setDigital(e, true), {passive: true});
      window.addEventListener('keyup', e => setDigital(e, false), {passive: true});
    }
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

    const s = this.movementSpeed;
    this.position[0] += vx * s;
    this.position[1] += vy * s;
    this.position[2] += vz * s;

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

  setX = (x) => {this.position[0] = x; this._dirtyAngle = true;}
  setY = (y) => {this.position[1] = y; this._dirtyAngle = true;}
  setZ = (z) => {this.position[2] = z; this._dirtyAngle = true;}

  setPosition = (x, y, z) => {
    this.position[0] = x;
    this.position[1] = y;
    this.position[2] = z;
    this._dirtyAngle = true;
  }

  setPitch = (p) => {this.pitch = p; this._dirtyAngle = true;}
  setYaw = (y) => {this.yaw = y; this._dirtyAngle = true;}
}

export class ArcballCamera {
  invProj = new Float32Array(16);
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
  invProj = new Float32Array(16);
  VP = new Float32Array(16);

  // ===== RPG =====
  followMe = null;
  followMeOffset = 150;

  scrollY = 50;
  minY = 50.5;
  maxY = 135.0;
  scrollSpeed = 1;

  _detachedFromFollow = false;
  _digital = {forward: false, backward: false, left: false, right: false};
  _keyInterval = null;
  KEYBOARD_SPEED = 4.5;

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

    this.setProjection((2 * Math.PI) / 5, this.aspect, 1, 1000);

    this._setupEvents();

    this._recalculateViewVP();
  }

  setProjection(fov, aspect, near, far) {
    mat4.perspective(fov, aspect, near, far, this.projectionMatrix);
    this._dirty = true;
  }

  setPitch = (p) => {
    this.pitch = p;
    this._useTarget = false;
    this._dirtyAngle = true;
  }

  setYaw = (y) => {
    this.yaw = y;
    this._useTarget = false;
    this._dirtyAngle = true;
  }

  setPosition = (x, y, z) => {
    this.position[0] = x;
    this.position[1] = y;
    this.position[2] = z;
    this._dirtyAngle = true;
  }

  setX = (x) => {this.position[0] = x; this._dirtyAngle = true;}
  setY = (y) => {this.position[1] = y; this._dirtyAngle = true;}
  setZ = (z) => {this.position[2] = z; this._dirtyAngle = true;}

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

  _applyDigitalMovement() {
    const d = this._digital;
    let vx = 0, vz = 0;

    if(d.forward) {vx -= this.back[0]; vz -= this.back[2];}
    if(d.backward) {vx += this.back[0]; vz += this.back[2];}
    if(d.right) {vx += this.right[0]; vz += this.right[2];}
    if(d.left) {vx -= this.right[0]; vz -= this.right[2];}

    const len = Math.sqrt(vx * vx + vz * vz);
    if(len < 0.0001) return;

    const s = this.KEYBOARD_SPEED / len;
    this.position[0] += vx * s;
    this.position[2] += vz * s;

    this._dirty = true;
  }

  _setupKeyboard() {
    const setDigital = (e, value) => {
      switch(e.code) {
        case 'KeyW': this._digital.forward = value; break;
        case 'KeyS': this._digital.backward = value; break;
        case 'KeyA': this._digital.left = value; break;
        case 'KeyD': this._digital.right = value; break;
        case 'ArrowUp': this._digital.forward = value; break;
        case 'ArrowDown': this._digital.backward = value; break;
        case 'ArrowLeft': this._digital.left = value; break;
        case 'ArrowRight': this._digital.right = value; break;
      }

      if(value && this._keyInterval === null) {
        this._detachedFromFollow = true;
        this._keyInterval = setInterval(() => this._applyDigitalMovement(), 16);
      } else {
        const d = this._digital;
        if(!d.forward && !d.backward && !d.left && !d.right) {
          clearInterval(this._keyInterval);
          this._keyInterval = null;
        }
      }
    };

    window.addEventListener('keydown', e => setDigital(e, true), {passive: true});
    window.addEventListener('keyup', e => setDigital(e, false), {passive: true});
  }

  _pinchDist(touches) {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.hypot(dx, dy);
  }

  _setupEvents() {
    if(isMobile() == false) {
      addEventListener('wheel', (e) => {
        this.mousRollInAction = true;
        this.scrollY -= e.deltaY * this.scrollSpeed * 0.01;
        this.scrollY = Math.max(this.minY, Math.min(this.maxY, this.scrollY));
        this._dirty = true;
      });
      this._setupKeyboard();
    } else {
      let lastPinchDist;
      let lastTouchX = null, lastTouchY = null;

      addEventListener('touchmove', (e) => {
        // --- 2 fingers: pinch zoom ---
        if(e.touches.length === 2) {
          const dist = this._pinchDist(e.touches);
          if(lastPinchDist === null) {
            lastPinchDist = dist;
            return;
          }
          const delta = lastPinchDist - dist;
          this.scrollY -= delta * this.scrollSpeed * 0.5;
          this.scrollY = Math.max(this.minY, Math.min(this.maxY, this.scrollY));
          this._dirty = true;
          lastPinchDist = dist;
          return;
        }
        // --- 1 finger: pan camera ---
        if(e.touches.length === 1) {
          const tx = e.touches[0].clientX;
          const tz = e.touches[0].clientY;

          if(lastTouchX === null) {
            lastTouchX = tx;
            lastTouchY = tz;
            return;
          }

          const dx = tx - lastTouchX;
          const dz = tz - lastTouchY;
          lastTouchX = tx;
          lastTouchY = tz;

          const s = this.KEYBOARD_SPEED * 0.3;
          this.position[0] += this.right[0] * dx * s;
          this.position[2] -= this.right[2] * dx * s;
          this.position[0] -= this.back[0] * dz * s;
          this.position[2] += this.back[2] * dz * s;

          this._detachedFromFollow = true;
          this._dirty = true;
        }
      }, {passive: true});

      addEventListener('touchend', (e) => {
        if(e.touches.length < 2) lastPinchDist = null;
        if(e.touches.length === 0) {
          lastTouchX = null;
          lastTouchY = null;
        }
      }, {passive: true});
    }
  }

  _updateOrientation() {
    const cy = Math.cos(this.yaw), sy = Math.sin(this.yaw);
    const cp = Math.cos(this.pitch), sp = Math.sin(this.pitch);

    this.right[0] = cy; this.right[1] = 0; this.right[2] = -sy;
    this.up[0] = sy * sp; this.up[1] = cp; this.up[2] = cy * sp;
    this.back[0] = sy * cp; this.back[1] = -sp; this.back[2] = cy * cp;
  }

  _updateFollow() {
    if(!this.followMe) return;
    if(this.followMe.inMove === true) {
      this._detachedFromFollow = false;
    }
    if(this._detachedFromFollow) return;

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
  invProj = new Float32Array(16);
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
    this.setProjection((2 * Math.PI) / 5, this.aspect, 0.3, 200);

    this._jumpVelocity = 0;
    this._jumpForce = 0.18;
    this._isGrounded = false;

    if(this.canvas) this._setupInput(this.canvas);
    this._recalculateViewVP();
    if(isMobile() == true && options.isActive == 'init active cam') {
      MobileDOM.createWASD(this, {margin: 50});
    }
  }

  setPitch = (p) => {
    this.pitch = p;
    this._dirtyAngle = true;
  }

  setYaw = (y) => {
    this.yaw = y;
    this._dirtyAngle = true;
  }

  setProjection = (fov = (2 * Math.PI) / 5, aspect = 1, near = 1, far = 1000) => {
    mat4.perspective(fov, aspect, near, far, this.projectionMatrix);
    this._recalculateViewVP();
  }

  setPosition = (x, y, z) => {
    this.position[0] = x;
    this.position[1] = y;
    this.position[2] = z;
    this._dirtyAngle = true;
  }

  setX = (x) => {
    this.position[0] = x;
    this._dirtyAngle = true;
  }

  setY = (y) => {
    this.position[1] = y;
    this._dirtyAngle = true;
  }

  setZ = (z) => {
    this.position[2] = z;
    this._dirtyAngle = true;
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
    let touchStartX = 0, touchStartY = 0;
    if(isMobile() === true) canvas.addEventListener('touchstart', e => {
      if(e.touches.length > 0) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        console.log('touchstart:', touchStartX, touchStartY);
      }
    }, {passive: false});

    if(isMobile() === true) canvas.addEventListener('touchmove', e => {
      if(e.touches.length > 0) {
        const touch = e.touches[0];
        const dx = (touch.clientX - touchStartX) * this.TOUCH_SENS;
        const dy = (touch.clientY - touchStartY) * this.TOUCH_SENS;
        // console.log('touchmove dx=', dx, 'dy=', dy);
        this.yaw -= dx * this.rotationSpeed;
        this.pitch -= dy * this.rotationSpeed;
        this.yaw %= Math.PI * 2;
        this.pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.pitch));
        this._dirtyAngle = true;
        touchStartX = touch.clientX;
        touchStartY = touch.clientY;
      }
      e.preventDefault();
    }, {passive: false});
    // MOUSE
    if(isMobile() === false) canvas.addEventListener('pointerdown', e => {
      if(e.pointerType === 'mouse') {
        this._mouseDown = true;
        if(canvas.requestPointerLock) {
          canvas.requestPointerLock();
        } else {
          canvas.setPointerCapture(e.pointerId);
        }
      }
    }, {passive: false});

    if(isMobile() === false) canvas.addEventListener('pointermove', e => {
      if(e.pointerType === 'mouse') { // this._mouseDown
        if(window.__isDragging === true) {return }
        const dx = e.movementX * this.MOUSE_SENS;
        const dy = e.movementY * this.MOUSE_SENS;
        this.yaw -= dx * this.rotationSpeed;
        this.pitch -= dy * this.rotationSpeed;
        this.yaw %= Math.PI * 2;
        this.pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.pitch));
        this._dirtyAngle = true;
      }
    }, {passive: true});

    if(isMobile() === false) canvas.addEventListener('pointerup', e => {
      if(e.pointerType === 'mouse') {
        this._mouseDown = false;
      }
    }, {passive: true});

    this._keyInterval = null;
    const setDigital = (e, value) => {
      switch(e.code) {
        case 'KeyW': this._digital.forward = value; break;
        case 'KeyS': this._digital.backward = value; break;
        case 'KeyA': this._digital.left = value; break;
        case 'KeyD': this._digital.right = value; break;
        case 'ArrowUp': this._digital.forward = value; break;
        case 'ArrowDown': this._digital.backward = value; break;
        case 'ArrowLeft': this._digital.left = value; break;
        case 'ArrowRight': this._digital.right = value; break;
        case 'Space':
          if(value === true && window.app?.collisionSystem?._onGround) {
            // this._jumpVelocity = this._jumpForce;
            window.app.collisionSystem._gravityAcc = 0.22;  // upward, gravity will decelerate it
            window.app.collisionSystem._onGround = false;
            this._dirty = true;
            this._dirtyAngle = true;
          }
          break;
      }
      if(value == true && this._keyInterval === null) {
        this._keyInterval = setInterval(() => {
          this._dirty = true;
          this._dirtyAngle = true;
          this._applyDigitalMovement();
        }, 16);
      } else {
        const d = this._digital;
        if(!d.forward && !d.backward && !d.left && !d.right) {
          clearInterval(this._keyInterval);
          this._keyInterval = null;
          this._dirty = false;
          this._dirtyAngle = false;
        }
      }
    };
    window.addEventListener('keydown', e => setDigital(e, true), {passive: true});
    window.addEventListener('keyup', e => setDigital(e, false), {passive: true});
  }

  forceViewUpdate() {
    this._dirtyAngle = true;
    this._dirty = true;
    this._recalculateViewVP();
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
    this.position[2] += vz * s;
    if(this._jumpVelocity !== 0) {
      this.position[1] += this._jumpVelocity;
      this._jumpVelocity = 0;
    }

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

// CinematicCamera — no input, pure programmatic control
export class CinematicCamera {
  pitch = 0;
  yaw = 0;
  position = new Float32Array(3);
  velocity = new Float32Array(3);
  view = new Float32Array(16);
  VP = new Float32Array(16);
  projectionMatrix = new Float32Array(16);
  invProj = new Float32Array(16);
  right = vec3.fromValues(1, 0, 0);
  up = vec3.fromValues(0, 1, 0);
  back = vec3.fromValues(0, 0, 1);
  _dirtyAngle = false;

  _path = null;
  _t = 0;
  _playing = false;
  _speed = 1;
  _loop = false;
  _onEnd = null;

  _shake = {active: false, amplitude: 0, frequency: 10, elapsed: 0, duration: 0};
  _shakeOffset = new Float32Array(3);

  _useTarget = false;
  _target = new Float32Array(3);

  constructor(options = {}) {
    if(options.position) {
      this.position[0] = options.position[0];
      this.position[1] = options.position[1];
      this.position[2] = options.position[2];
    }
    if(options.pitch) this.pitch = options.pitch;
    if(options.yaw) this.yaw = options.yaw;
    if(options.target) {
      this._target[0] = options.target[0];
      this._target[1] = options.target[1];
      this._target[2] = options.target[2];
      this._useTarget = true;
    }

    this.canvas = options.canvas ?? null;
    const aspect = this.canvas
      ? this.canvas.width / this.canvas.height
      : (options.aspect ?? 16 / 9);

    this.setProjection(options.fov ?? (2 * Math.PI) / 5, aspect, options.near ?? 0.3, options.far ?? 200);
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

  // ── same setters as FirstPersonCamera ────────────────────────────────────────
  setPitch = (p) => {
    this.pitch = p;
    this._useTarget = false;
    this._dirtyAngle = true;
  }

  setYaw = (y) => {
    this.yaw = y;
    this._useTarget = false;
    this._dirtyAngle = true;
  }

  setPosition = (x, y, z) => {
    this.position[0] = x;
    this.position[1] = y;
    this.position[2] = z;
    this._dirtyAngle = true;
  }

  setX = (x) => {this.position[0] = x; this._dirtyAngle = true;}
  setY = (y) => {this.position[1] = y; this._dirtyAngle = true;}
  setZ = (z) => {this.position[2] = z; this._dirtyAngle = true;}

  setProjection = (fov = (2 * Math.PI) / 5, aspect = 1, near = 1, far = 1000) => {
    mat4.perspective(fov, aspect, near, far, this.projectionMatrix);
    this._recalculateViewVP();
  }

  // ── cinematic-only setters ───────────────────────────────────────────────────
  setTarget = (x, y, z) => {
    this._target[0] = x;
    this._target[1] = y;
    this._target[2] = z;
    this._useTarget = true;
    this._dirtyAngle = true;
  }

  setRoll = (r) => {
    // roll tilts the up vector around the forward axis
    this._roll = r;
    this._dirtyAngle = true;
  }

  // ── path control ─────────────────────────────────────────────────────────────
  setPath = (path) => {
    this._path = path;
    this._t = 0;
    return this;
  }

  play = (options = {}) => {
    if(!this._path) {console.warn('CinematicCamera.play(): no path set'); return this;}
    this._speed = options.speed ?? 1;
    this._loop = options.loop ?? false;
    this._onEnd = options.onEnd ?? null;
    this._t = options.startT ?? 0;
    this._playing = true;
    return this;
  }

  pause = () => {this._playing = false; return this;}
  resume = () => {this._playing = true; return this;}
  seekT = (t) => {this._t = t; return this;}

  shake = (amplitude, duration, frequency = 15) => {
    this._shake = {active: true, amplitude, frequency, duration, elapsed: 0};
  }

  _recalculateViewVP() {
    if(this._useTarget) {
      this._buildViewFromTarget();
    } else {
      this._buildViewFromPitchYaw();
    }
  }

  _buildViewFromPitchYaw() {
    const cy = Math.cos(this.yaw), sy = Math.sin(this.yaw);
    const cp = Math.cos(this.pitch), sp = Math.sin(this.pitch);

    this.right[0] = cy; this.right[1] = 0; this.right[2] = -sy;
    this.up[0] = sy * sp; this.up[1] = cp; this.up[2] = cy * sp;
    this.back[0] = sy * cp; this.back[1] = -sp; this.back[2] = cy * cp;

    // apply roll if set
    if(this._roll) {
      const cr = Math.cos(this._roll), sr = Math.sin(this._roll);
      const rx = this.right, uy = this.up;
      const nx = cr * rx[0] + sr * uy[0];
      const ny = cr * rx[1] + sr * uy[1];
      const nz = cr * rx[2] + sr * uy[2];
      const ux = -sr * rx[0] + cr * uy[0];
      const uyy = -sr * rx[1] + cr * uy[1];
      const uz = -sr * rx[2] + cr * uy[2];
      this.right[0] = nx; this.right[1] = ny; this.right[2] = nz;
      this.up[0] = ux; this.up[1] = uyy; this.up[2] = uz;
    }

    const rx = this.right, uy = this.up, bz = this.back, p = this.position;
    const vs = this.view;
    vs[0] = rx[0]; vs[4] = rx[1]; vs[8] = rx[2]; vs[12] = -(rx[0] * p[0] + rx[1] * p[1] + rx[2] * p[2]);
    vs[1] = uy[0]; vs[5] = uy[1]; vs[9] = uy[2]; vs[13] = -(uy[0] * p[0] + uy[1] * p[1] + uy[2] * p[2]);
    vs[2] = bz[0]; vs[6] = bz[1]; vs[10] = bz[2]; vs[14] = -(bz[0] * p[0] + bz[1] * p[1] + bz[2] * p[2]);
    vs[3] = 0; vs[7] = 0; vs[11] = 0; vs[15] = 1;
    CinematicCamera.mat4MultiplySafe(this.projectionMatrix, this.view, this.VP);
  }

  _buildViewFromTarget() {
    const p = this.position;
    const sk = this._shakeOffset;
    const ex = p[0] + sk[0], ey = p[1] + sk[1], ez = p[2] + sk[2];
    const tx = this._target[0], ty = this._target[1], tz = this._target[2];
    // forward
    let fx = tx - ex, fy = ty - ey, fz = tz - ez;
    const fl = Math.sqrt(fx * fx + fy * fy + fz * fz);
    if(fl < 1e-7) return;
    fx /= fl; fy /= fl; fz /= fl;
    // world up with optional roll
    let wux = 0, wuy = 1, wuz = 0;
    if(this._roll) {
      const cr = Math.cos(this._roll), sr = Math.sin(this._roll);
      // right of a non-rolled camera
      let rx0 = fy * 0 - fz * 1, ry0 = fz * 0 - fx * 0, rz0 = fx * 1 - fy * 0;
      const rl = Math.sqrt(rx0 * rx0 + ry0 * ry0 + rz0 * rz0);
      if(rl > 1e-7) {rx0 /= rl; ry0 /= rl; rz0 /= rl;}
      wux = cr * 0 - sr * rx0; wuy = cr * 1 - sr * ry0; wuz = cr * 0 - sr * rz0;
    }

    // right = forward × up
    let rx = fy * wuz - fz * wuy, ry = fz * wux - fx * wuz, rz = fx * wuy - fy * wux;
    const rl = Math.sqrt(rx * rx + ry * ry + rz * rz);
    if(rl < 1e-7) return;
    rx /= rl; ry /= rl; rz /= rl;
    // reorthogonalised up
    const upx = ry * fz - rz * fy, upy = rz * fx - rx * fz, upz = rx * fy - ry * fx;
    // sync pitch/yaw back so getters are consistent
    this.back[0] = -fx; this.back[1] = -fy; this.back[2] = -fz;
    this.right[0] = rx; this.right[1] = ry; this.right[2] = rz;
    this.up[0] = upx; this.up[1] = upy; this.up[2] = upz;
    this.yaw = Math.atan2(-fx, -fz);
    this.pitch = Math.asin(Math.max(-1, Math.min(1, fy)));
    const vs = this.view;
    vs[0] = rx; vs[4] = ry; vs[8] = rz; vs[12] = -(rx * ex + ry * ey + rz * ez);
    vs[1] = upx; vs[5] = upy; vs[9] = upz; vs[13] = -(upx * ex + upy * ey + upz * ez);
    vs[2] = -fx; vs[6] = -fy; vs[10] = -fz; vs[14] = -(-fx * ex - fy * ey - fz * ez);
    vs[3] = 0; vs[7] = 0; vs[11] = 0; vs[15] = 1;
    CinematicCamera.mat4MultiplySafe(this.projectionMatrix, this.view, this.VP);
  }

  update(dt = 0.016) {
    if(this._playing && this._path) {
      const totalT = this._path.totalTime;
      this._t += (dt * this._speed) / totalT;
      if(this._t >= 1) {
        if(this._loop) {
          this._t %= 1;
        } else {
          this._t = 1;
          this._playing = false;
          this._applyPathSample();
          if(this._onEnd) this._onEnd(this);
        }
      }
      if(this._playing || this._t === 1) this._applyPathSample();
    }

    const sk = this._shake;
    if(sk.active) {
      sk.elapsed += dt;
      const decay = Math.max(0, 1 - sk.elapsed / sk.duration);
      const amp = sk.amplitude * decay;
      const freq = sk.frequency * sk.elapsed;
      this._shakeOffset[0] = Math.sin(freq * 2.1731 + 1.23) * amp;
      this._shakeOffset[1] = Math.sin(freq * 1.7319 + 0.77) * amp;
      this._shakeOffset[2] = Math.sin(freq * 2.4721 + 2.11) * amp;
      if(sk.elapsed >= sk.duration) {
        sk.active = false;
        this._shakeOffset[0] = this._shakeOffset[1] = this._shakeOffset[2] = 0;
      }
      this._dirtyAngle = true;
    }

    if(!this._dirtyAngle) return;
    this._recalculateViewVP();
    this._dirtyAngle = false;
  }

  _applyPathSample() {
    const s = this._path.sample(this._t);
    this.setPosition(s.position[0], s.position[1], s.position[2]);
    this.setTarget(s.target[0], s.target[1], s.target[2]);
    if(s.roll !== undefined) this.setRoll(s.roll);
    if(s.fov !== undefined) {
      const aspect = this.canvas
        ? this.canvas.width / this.canvas.height
        : 16 / 9;
      this.setProjection(s.fov, aspect);
    }
    this._dirtyAngle = true;
  }
}

export class PlaneCamera {
  pitch = 0;
  yaw = 0;
  position = new Float32Array(3);
  right = new Float32Array(3);
  up = new Float32Array(3);
  back = new Float32Array(3);
  view = new Float32Array(16);
  projectionMatrix = new Float32Array(16);
  invProj = new Float32Array(16);
  VP = new Float32Array(16);
  followMe = null;
  followMeOffset = 80;
  scrollY = 80;
  minY = 3.0;
  maxY = 200.0;
  scrollSpeed = 0.2;
  smoothFactor = 0.1;
  mousRollInAction = false;
  _detachedFromFollow = false;
  _dirty = true;
  // CALLBACKS
  onLeft = null;
  onLeftRelease = null;
  onRight = null;
  onRightRelease = null;
  onUp = null;
  onUpRelease = null;
  onDown = null;
  onDownRelease = null;
  onAction1 = null;
  onAction1Release = null;
  onAction2 = null;
  onAction2Release = null;

  constructor(options = {}) {
    if(options.position) {
      this.position[0] = options.position[0];
      this.position[1] = options.position[1];
      this.position[2] = options.position[2];
    }

    this.canvas = options.canvas;
    this.aspect = this.canvas ? this.canvas.width / this.canvas.height : 1;

    this.setProjection((2 * Math.PI) / 5, this.aspect, 1, 1000);
    this._setupEvents();
    this._recalculateViewVP();

    if(isMobile() == true && options.isActive == 'init active cam') {
      this._setupMobileButtons();
    }
  }

  setProjection(fov, aspect, near, far) {
    mat4.perspective(fov, aspect, near, far, this.projectionMatrix);
    this._dirty = true;
  }

  setPitch = (p) => {this.pitch = p; this._dirty = true;}
  setYaw = (y) => {this.yaw = y; this._dirty = true;}

  setPosition = (x, y, z) => {
    this.position[0] = x;
    this.position[1] = y;
    this.position[2] = z;
    this._dirty = true;
  }

  setX = (x) => {this.position[0] = x; this._dirty = true;}
  setY = (y) => {this.position[1] = y; this._dirty = true;}
  setZ = (z) => {this.position[2] = z; this._dirty = true;}

  _setupMobileButtons() {
    MobileDOM.addButton('←', () => this.onLeft?.(), () => this.onLeftRelease?.(), {left: '20', bottom: '5'});
    MobileDOM.addButton('→', () => this.onRight?.(), () => this.onRightRelease?.(), {left: '60', bottom: '5'});
    MobileDOM.addButton('↑', () => this.onUp?.(), () => this.onUpRelease?.(), {left: '40', bottom: '15'});
    MobileDOM.addButton('↓', () => this.onDown?.(), () => this.onDownRelease?.(), {left: '40', bottom: '5'});
    MobileDOM.addButton('A', () => this.onAction1?.(), () => this.onAction1Release?.(), {left: '80', bottom: '40'});
    MobileDOM.addButton('B', () => this.onAction2?.(), () => this.onAction2Release?.(), {left: '80', bottom: '30'});
  }

  _setupKeyboard() {
    const handle = (e, isDown) => {
      switch(e.code) {
        case 'KeyA': case 'ArrowLeft': isDown ? this.onLeft?.() : this.onLeftRelease?.(); break;
        case 'KeyD': case 'ArrowRight': isDown ? this.onRight?.() : this.onRightRelease?.(); break;
        case 'KeyW': case 'ArrowUp': isDown ? this.onUp?.() : this.onUpRelease?.(); break;
        case 'KeyS': case 'ArrowDown': isDown ? this.onDown?.() : this.onDownRelease?.(); break;
        case 'KeyJ': isDown ? this.onAction1?.() : this.onAction1Release?.(); break;
        case 'KeyK': isDown ? this.onAction2?.() : this.onAction2Release?.(); break;
      }
    };

    window.addEventListener('keydown', e => {if(!e.repeat) handle(e, true);}, {passive: true});
    window.addEventListener('keyup', e => handle(e, false), {passive: true});
  }

  _pinchDist(touches) {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.hypot(dx, dy);
  }

  _setupEvents() {
    if(isMobile() == false) {
      addEventListener('wheel', (e) => {
        this.mousRollInAction = true;
        this.scrollY -= e.deltaY * this.scrollSpeed * 0.1;
        this.scrollY = Math.max(this.minY, Math.min(this.maxY, this.scrollY));
        this._dirty = true;
      });
      this._setupKeyboard();
    } else {
      let lastPinchDist = null;
      let lastTouchX = null, lastTouchY = null;

      addEventListener('touchmove', (e) => {
        if(e.touches.length === 2) {
          const dist = this._pinchDist(e.touches);
          if(lastPinchDist !== null) {
            const delta = lastPinchDist - dist;
            this.scrollY -= delta * this.scrollSpeed * 0.5;
            this.scrollY = Math.max(this.minY, Math.min(this.maxY, this.scrollY));
            this._dirty = true;
          }
          lastPinchDist = dist;
          return;
        }
        if(e.touches.length === 1) {
          const tx = e.touches[0].clientX;
          const tz = e.touches[0].clientY;
          if(lastTouchX !== null) {
            // no pan — touch is handled by MobileDOM buttons
          }
          lastTouchX = tx;
          lastTouchY = tz;
        }
      }, {passive: true});

      addEventListener('touchend', (e) => {
        if(e.touches.length < 2) lastPinchDist = null;
        if(e.touches.length === 0) {lastTouchX = null; lastTouchY = null;}
      }, {passive: true});
    }
  }

  _updateOrientation() {
    this.right[0] = 1; this.right[1] = 0; this.right[2] = 0;
    this.up[0] = 0; this.up[1] = 1; this.up[2] = 0;
    this.back[0] = 0; this.back[1] = 0; this.back[2] = 1;
  }

  _updateFollow() {
    if(!this.followMe) return;
    if(this._detachedFromFollow) return;
    if(this.mousRollInAction) {
      this.followMeOffset = this.scrollY;
      this.mousRollInAction = false;
    }
    const dx = this.followMe.x - this.position[0];
    const dy = this.followMe.y - this.position[1];
    if(Math.abs(dx) > 0.001 || Math.abs(dy) > 0.001) {
      this.position[0] += dx * this.smoothFactor;
      this.position[1] += dy * this.smoothFactor;
      this._dirty = true;
    }
    // smooth Z pull-back
    const newZ = this.position[2] + (this.scrollY - this.position[2]) * this.smoothFactor;
    if(Math.abs(newZ - this.position[2]) > 0.001) {
      this.position[2] = newZ;
      this._dirty = true;
    }
  }

  _recalculateViewVP() {
    this._updateOrientation();
    mat4.lookAt(
      [this.position[0], this.position[1], this.position[2]],
      [this.position[0], this.position[1], 0],
      [0, 1, 0],
      this.view
    );

    mat4.multiply(this.projectionMatrix, this.view, this.VP);
  }

  update() {
    this._updateFollow();
    if(!this._dirty) return;
    this._recalculateViewVP();
    this._dirty = false;
  }
}

// DEV
export class Camera2DOrthogonaly {
  pitch = 0;
  yaw = 0;
  position = new Float32Array(3);
  right = new Float32Array(3);
  up = new Float32Array(3);
  back = new Float32Array(3);
  view = mat4.identity();
  projectionMatrix = mat4.identity();
  invProj = mat4.identity();
  VP = mat4.identity();
  followMe = null;
  followMeOffset = 0;
  zoom = 12.0;
  minZoom = 2.0;
  maxZoom = 40.0;
  zoomSpeed = 0.01;
  smoothFactor = 0.12;
  _detachedFromFollow = false;
  _digital = {forward: false, backward: false, left: false, right: false};
  _keyInterval = null;
  KEYBOARD_SPEED = 4.5;
  // set after construction if you want WASD → worker velocity
  // cam._bridge = physicsBridge;  cam._followBodyId = bodyId;
  _bridge = null;
  _followBodyId = null;
  MOVE_FORCE = 0.015;
  _dirty = true;

  constructor(options = {}) {
    if(options.position) {
      this.position[0] = options.position[0];
      this.position[1] = options.position[1];
      this.position[2] = options.position[2];
    }

    this.canvas = options.canvas;
    this.aspect = this.canvas ? this.canvas.width / this.canvas.height : 1;

    if(options.zoom !== undefined) this.zoom = options.zoom;

    this._buildProjection();
    this._setupEvents();
    this._recalculateViewVP();
  }

  _buildProjection() {
    const r = this.zoom * this.aspect;
    const t = this.zoom;
    mat4.ortho(-r, r, -t, t, -1, 1, this.projectionMatrix);
    this._dirty = true;
  }

  setZoom(z) {
    this.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, z));
    this._buildProjection();
  }

  _updateOrientation() {
    this.right[0] = 1; this.right[1] = 0; this.right[2] = 0;
    this.up[0] = 0; this.up[1] = 1; this.up[2] = 0;
    this.back[0] = 0; this.back[1] = 0; this.back[2] = 1;
  }

  _recalculateViewVP() {
    this._updateOrientation();
    mat4.lookAt(
      [this.position[0], this.position[1], 1],   // eye
      [this.position[0], this.position[1], 0],   // target
      [0, 1, 0],                                 // up
      this.view
    );
    mat4.multiply(this.projectionMatrix, this.view, this.VP);
  }

  _updateFollow() {
    if(!this.followMe) return;
    if(this._detachedFromFollow) return;
    const tx = this.followMe.x;
    const ty = this.followMe.y;
    const dx = tx - this.position[0];
    const dy = ty - this.position[1];
    if(Math.abs(dx) > 0.001 || Math.abs(dy) > 0.001) {
      this.position[0] += dx * this.smoothFactor;
      this.position[1] += dy * this.smoothFactor;
      this._dirty = true;
    }
  }

  _applyDigitalMovement() {
    const d = this._digital;
    if(this._bridge && this._followBodyId !== null) {
      // send velocity to Matter.js worker — camera follows via followMe
      let vx = 0, vy = 0;
      if(d.left) vx -= this.MOVE_FORCE;
      if(d.right) vx += this.MOVE_FORCE;
      if(d.forward) vy -= this.MOVE_FORCE;
      if(d.backward) vy += this.MOVE_FORCE;
      if(vx === 0 && vy === 0) return;
      this._bridge._send({type: 'setVelocity', id: this._followBodyId, vx, vy});
    } else {
      // no bridge — move camera directly (free pan)
      let vx = 0, vz = 0;
      if(d.forward) vx -= this.back[0], vz -= this.back[2];
      if(d.backward) vx += this.back[0], vz += this.back[2];
      if(d.right) vx += this.right[0], vz += this.right[2];
      if(d.left) vx -= this.right[0], vz -= this.right[2];
      const len = Math.sqrt(vx * vx + vz * vz);
      if(len < 0.0001) return;
      const s = this.KEYBOARD_SPEED / len;
      this.position[0] += vx * s;
      this.position[2] += vz * s;
      this._dirty = true;
    }
  }

  setFollowObject = (obj, matterBridge) => {
    this._bridge = matterBridge;
    this.followMe = obj.position;
    // optional — only if you want WASD to drive physics velocity
    cam._followBodyId = heroBodyId;
  }

  _setupKeyboard() {
    const setDigital = (e, value) => {
      switch(e.code) {
        case 'KeyW': case 'ArrowUp': this._digital.forward = value; break;
        case 'KeyS': case 'ArrowDown': this._digital.backward = value; break;
        case 'KeyA': case 'ArrowLeft': this._digital.left = value; break;
        case 'KeyD': case 'ArrowRight': this._digital.right = value; break;
        default: return;
      }

      const d = this._digital;
      const anyDown = d.forward || d.backward || d.left || d.right;
      if(value && this._keyInterval === null) {
        this._detachedFromFollow = !this._bridge;  // detach only if no bridge
        this._keyInterval = setInterval(() => this._applyDigitalMovement(), 16);
      } else if(!anyDown) {
        clearInterval(this._keyInterval);
        this._keyInterval = null;
        // zero velocity on release
        if(this._bridge && this._followBodyId !== null) {
          this._bridge._send({type: 'setVelocity', id: this._followBodyId, vx: 0, vy: 0});
        }
      }
    };

    window.addEventListener('keydown', e => setDigital(e, true), {passive: true});
    window.addEventListener('keyup', e => setDigital(e, false), {passive: true});
  }

  _pinchDist(touches) {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.hypot(dx, dy);
  }

  _setupEvents() {
    if(isMobile() == false) {
      addEventListener('wheel', (e) => {
        this.setZoom(this.zoom - e.deltaY * this.zoomSpeed);
        this._dirty = true;
      });
      this._setupKeyboard();
    } else {
      let lastPinchDist = null;
      let lastTouchX = null, lastTouchY = null;

      addEventListener('touchmove', (e) => {
        if(e.touches.length === 2) {
          const dist = this._pinchDist(e.touches);
          if(lastPinchDist !== null) {
            this.setZoom(this.zoom + (lastPinchDist - dist) * this.zoomSpeed * 0.5);
            this._dirty = true;
          }
          lastPinchDist = dist;
          return;
        }
        if(e.touches.length === 1) {
          const tx = e.touches[0].clientX;
          const tz = e.touches[0].clientY;
          if(lastTouchX !== null) {
            const scale = (2 * this.zoom) / (this.canvas?.height ?? 600);
            this.position[0] -= (tx - lastTouchX) * scale;
            this.position[1] += (tz - lastTouchY) * scale;
            this._detachedFromFollow = true;
            this._dirty = true;
          }
          lastTouchX = tx;
          lastTouchY = tz;
        }
      }, {passive: true});

      addEventListener('touchend', (e) => {
        if(e.touches.length < 2) lastPinchDist = null;
        if(e.touches.length === 0) {lastTouchX = null; lastTouchY = null;}
      }, {passive: true});
    }
  }

  update() {
    this._updateFollow();
    if(!this._dirty) return;
    this._recalculateViewVP();
    this._dirty = false;
  }
}

export const MobileDOM = {
  eventDown: null,
  eventUp: null,
  eventCancel: null,

  createWASD(camera, options = {}) {
    const size = options.size ?? 60;
    const marginR = options.marginR ?? 0;
    const marginB = options.marginB ?? 0;
    const opacity = options.opacity ?? 0.35;
    const color = options.color ?? '#ffffff';

    const wrap = document.createElement('div');
    wrap.id = "mobileControls";
    Object.assign(wrap.style, {
      position: 'fixed',
      bottom: `${marginB}px`,
      right: `${marginR}px`,
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
      btn.id = label;
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
            camera._dirtyAngle = true;
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

      MobileDOM.eventDown = e => {
        e.stopPropagation(); press();
        btn.setPointerCapture(e.pointerId);
      };
      MobileDOM.eventUp = e => {release()};
      MobileDOM.eventCancel = e => {release()};

      btn.addEventListener('pointerdown', MobileDOM.eventDown, {passive: true});
      btn.addEventListener('pointerup', MobileDOM.eventUp, {passive: true});
      btn.addEventListener('pointercancel', MobileDOM.eventCancel, {passive: true});

      wrap.appendChild(btn);
    }

    document.body.appendChild(wrap);
    return wrap; // caller can hide/remove later
  },

  destroyWASD() {
    if(byId('mobileControls') == null) return;
    byId('▲').removeEventListener('pointerdown', MobileDOM.eventDown);
    byId('▲').removeEventListener('pointerup', MobileDOM.eventUp);
    byId('▲').removeEventListener('pointercancel', MobileDOM.eventCancel);
    byId('◀').removeEventListener('pointerdown', MobileDOM.eventDown);
    byId('◀').removeEventListener('pointerup', MobileDOM.eventUp);
    byId('◀').removeEventListener('pointercancel', MobileDOM.eventCancel);
    byId('▼').removeEventListener('pointerdown', MobileDOM.eventDown);
    byId('▼').removeEventListener('pointerup', MobileDOM.eventUp);
    byId('▼').removeEventListener('pointercancel', MobileDOM.eventCancel);
    byId('▶').removeEventListener('pointerdown', MobileDOM.eventDown);
    byId('▶').removeEventListener('pointerup', MobileDOM.eventUp);
    byId('▶').removeEventListener('pointercancel', MobileDOM.eventCancel);
    byId('▲').remove();
    byId('◀').remove();
    byId('▼').remove();
    byId('▶').remove();
    byId('mobileControls').remove();
  },

  addButton(label, onClick, onRelease = () => {}, options = {}) {
    document.body.style.touchAction = 'none';

    const size = options.size ?? 56;
    const bottom = options.bottom ?? 0;
    const left = options.left ?? 0;
    const opacity = options.opacity ?? 0.35;

    const btn = document.createElement('div');
    Object.assign(btn.style, {
      position: 'fixed',
      bottom: `${bottom}%`,
      left: `${left}%`,
      width: `${size}px`,
      height: `${size}px`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: `${size * 0.25}px`,
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

    if(isMobile() === true) {
      btn.addEventListener('touchstart', e => {
        e.stopPropagation();
        // btn.style.background = `rgba(255,255,255,${opacity})`;
        onClick(e);
      }, {passive: true});
      btn.addEventListener('touchend', (e) => {
        // btn.style.background = `rgba(255,255,255,${opacity * 0.4})`;
        onRelease(e);
      }, {passive: true});
      btn.addEventListener('touchcancel', () => {
        // btn.style.background = `rgba(255,255,255,${opacity * 0.4})`;
        onRelease(e);
      }, {passive: true});

    } else {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        onClick(e);
      }, {passive: true});
      btn.addEventListener('mouseup', (e) => {
        onRelease(e);
      }, {passive: true});
    }

    document.body.appendChild(btn);
    return btn;
  }
};