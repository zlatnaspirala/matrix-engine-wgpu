import {mat4, vec3} from 'wgpu-matrix';
import {isMobile} from './utils';
import {MEConfig} from '../me-config';

/**
 *
 * Bitmask:
 * 1  = forward / W / ArrowUp
 * 2  = backward / S / ArrowDown
 * 4  = left / A / ArrowLeft
 * 8  = right / D / ArrowRight
 * 16 = up / V
 * 32 = down / C
 */
export class WASDCamera {
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
  _rotYScratch = mat4.create();
  _rotXScratch = mat4.create();
  _viewScratch = mat4.create();
  _digital = 0;
  _mouseDown = false;
  _lookDisabled = false;
  MOUSE_SENS = MEConfig.MOUSE_SENS;
  TOUCH_SENS = MEConfig.TOUCH_SENS;
  movementSpeed = MEConfig.CAM_SPEED;
  rotationSpeed = 1;

  _dirtyAngle = true;
  usePointerEvents = false;
  static HALF_PI = Math.PI * 0.5;

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
    if(options.noEvents) {this.noEvent = true;} else {this.noEvent = false;}
    if(this.canvas) {this._setupInput(this.canvas);}
    this._recalculateViewVP();

    if(isMobile() === true && options.isActive == 'init active cam') {
      MobileDOM.createWASD(this, {
        marginR: 0,
        marginD: 0
      });
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

    out[0] =
      a00 * b00 +
      a01 * b10 +
      a02 * b20 +
      a03 * b30;

    out[1] =
      a10 * b00 +
      a11 * b10 +
      a12 * b20 +
      a13 * b30;

    out[2] =
      a20 * b00 +
      a21 * b10 +
      a22 * b20 +
      a23 * b30;

    out[3] =
      a30 * b00 +
      a31 * b10 +
      a32 * b20 +
      a33 * b30;

    out[4] =
      a00 * b01 +
      a01 * b11 +
      a02 * b21 +
      a03 * b31;

    out[5] =
      a10 * b01 +
      a11 * b11 +
      a12 * b21 +
      a13 * b31;

    out[6] =
      a20 * b01 +
      a21 * b11 +
      a22 * b21 +
      a23 * b31;

    out[7] =
      a30 * b01 +
      a31 * b11 +
      a32 * b21 +
      a33 * b31;

    out[8] =
      a00 * b02 +
      a01 * b12 +
      a02 * b22 +
      a03 * b32;

    out[9] =
      a10 * b02 +
      a11 * b12 +
      a12 * b22 +
      a13 * b32;

    out[10] =
      a20 * b02 +
      a21 * b12 +
      a22 * b22 +
      a23 * b32;

    out[11] =
      a30 * b02 +
      a31 * b12 +
      a32 * b22 +
      a33 * b32;

    out[12] =
      a00 * b03 +
      a01 * b13 +
      a02 * b23 +
      a03 * b33;

    out[13] =
      a10 * b03 +
      a11 * b13 +
      a12 * b23 +
      a13 * b33;

    out[14] =
      a20 * b03 +
      a21 * b13 +
      a22 * b23 +
      a23 * b33;

    out[15] =
      a30 * b03 +
      a31 * b13 +
      a32 * b23 +
      a33 * b33;
    return out;
  }

  _recalculateViewVP() {
    const yaw = this.yaw;
    const pitch = this.pitch;
    const cy = Math.cos(yaw);
    const sy = Math.sin(yaw);
    const cp = Math.cos(pitch);
    const sp = Math.sin(pitch);
    const rx = this.right;
    const uy = this.up;
    const bz = this.back;
    const p = this.position;
    const vs = this.view;
    rx[0] = cy;
    rx[1] = 0;
    rx[2] = -sy;
    uy[0] = sy * sp;
    uy[1] = cp;
    uy[2] = cy * sp;
    bz[0] = sy * cp;
    bz[1] = -sp;
    bz[2] = cy * cp;
    vs[0] = rx[0];
    vs[4] = rx[1];
    vs[8] = rx[2];
    vs[12] = -(rx[0] * p[0] + rx[1] * p[1] + rx[2] * p[2]);
    vs[1] = uy[0];
    vs[5] = uy[1];
    vs[9] = uy[2];
    vs[13] = -(uy[0] * p[0] + uy[1] * p[1] + uy[2] * p[2]);
    vs[2] = bz[0];
    vs[6] = bz[1];
    vs[10] = bz[2];
    vs[14] = -(bz[0] * p[0] + bz[1] * p[1] + bz[2] * p[2]);
    vs[3] = 0;
    vs[7] = 0;
    vs[11] = 0;
    vs[15] = 1;
    WASDCamera.mat4MultiplySafe(this.projectionMatrix, this.view, this.VP);
  }

  _setupInput(canvas) {
    canvas.style.touchAction = 'none';
    let touchStartX = 0;
    let touchStartY = 0;
    // MOBILE TOUCH
    if(isMobile() === true) {
      canvas.addEventListener('touchstart', (e) => {
        if(e.touches.length > 0) {
          const touch = e.touches[0];
          touchStartX = touch.clientX;
          touchStartY = touch.clientY;
        }
      }, {passive: false});

      canvas.addEventListener('touchmove', (e) => {
        if(this._lookDisabled) return;
        if(e.touches.length > 0) {
          const touch = e.touches[0];
          const dx = (touch.clientX - touchStartX) * this.TOUCH_SENS;
          const dy = (touch.clientY - touchStartY) * this.TOUCH_SENS;
          this.yaw -= dx * this.rotationSpeed;
          this.pitch -= dy * this.rotationSpeed;
          const HALF_PI = WASDCamera.HALF_PI;
          if(this.pitch > HALF_PI) {
            this.pitch = HALF_PI;
          } else if(this.pitch < -HALF_PI) {
            this.pitch = -HALF_PI;
          }
          this._dirtyAngle = true;
          touchStartX = touch.clientX;
          touchStartY = touch.clientY;
        }
        e.preventDefault();
      }, {passive: false});
    }
    // DESKTOP
    if(isMobile() === false) {
      canvas.oncontextmenu = (e) => {e.preventDefault();};
      if(this.usePointerEvents === true) {
        this._setupPointerEvents(canvas);
      } else {
        this._setupMouseEvents(canvas);
      }
    }
    // KEYBOARD
    if(this.noEvent !== true) {
      window.addEventListener('keydown', (e) => {
        if(e.repeat) return;
        let bit = 0;
        switch(e.code) {
          case 'ArrowUp':
          case 'KeyW':
            bit = 1;
            break;
          case 'ArrowDown':
          case 'KeyS':
            bit = 2;
            break;
          case 'ArrowLeft':
          case 'KeyA':
            bit = 4;
            break;
          case 'ArrowRight':
          case 'KeyD':
            bit = 8;
            break;
          case 'KeyV':
            bit = 16;
            break;
          case 'KeyC':
            bit = 32;
            break;
          default:
            return;
        }
        this._digital |= bit;
      }, {passive: true}
      );

      window.addEventListener('keyup', (e) => {
        let bit = 0;
        switch(e.code) {
          case 'ArrowUp':
          case 'KeyW':
            bit = 1;
            break;
          case 'ArrowDown':
          case 'KeyS':
            bit = 2;
            break;
          case 'ArrowLeft':
          case 'KeyA':
            bit = 4;
            break;
          case 'ArrowRight':
          case 'KeyD':
            bit = 8;
            break;
          case 'KeyV':
            bit = 16;
            break;
          case 'KeyC':
            bit = 32;
            break;
          default:
            return;
        }
        this._digital &= ~bit;
      }, {passive: true});
    }
  }
  // CLASSIC MOUSE EVENTS
  _setupMouseEvents(canvas) {
    canvas.onmousedown = (e) => {
      if(e.button !== 0) return;

      this._mouseDown = true;
    };

    canvas.onmousemove = (e) => {

      // KEEP THIS FOR GIZMO EDITOR MODE
      if(window.__isDragging === true) return;

      if(!this._mouseDown) return;

      if(this._lookDisabled) return;

      const dx = e.movementX;
      const dy = e.movementY;

      this.yaw -=
        dx *
        this.MOUSE_SENS *
        this.rotationSpeed;

      this.pitch -=
        dy *
        this.MOUSE_SENS *
        this.rotationSpeed;

      const HALF_PI = WASDCamera.HALF_PI;

      if(this.pitch > HALF_PI) {
        this.pitch = HALF_PI;
      } else if(this.pitch < -HALF_PI) {
        this.pitch = -HALF_PI;
      }

      this._dirtyAngle = true;
    };

    canvas.onmouseup = () => {
      this._mouseDown = false;
    };

    canvas.onmouseleave = () => {
      this._mouseDown = false;
    };
  }
  // POINTER EVENTS
  _setupPointerEvents(canvas) {
    canvas.addEventListener('pointerdown', (e) => {
      if(e.pointerType !== 'mouse') return;
      this._mouseDown = true;
      if(canvas.setPointerCapture) {canvas.setPointerCapture(e.pointerId);}
    }, {passive: true});

    canvas.addEventListener('pointermove', (e) => {
      // KEEP THIS FOR GIZMO EDITOR MODE
      if(window.__isDragging === true) return;
      if(e.pointerType !== 'mouse') return;
      if(!this._mouseDown) return;
      if(this._lookDisabled) return;
      const dx = e.movementX;
      const dy = e.movementY;
      this.yaw -= dx * this.MOUSE_SENS * this.rotationSpeed;
      this.pitch -= dy * this.MOUSE_SENS * this.rotationSpeed;
      const HALF_PI = WASDCamera.HALF_PI;
      if(this.pitch > HALF_PI) {
        this.pitch = HALF_PI;
      } else if(this.pitch < -HALF_PI) {
        this.pitch = -HALF_PI;
      }
      this._dirtyAngle = true;
    },
      {passive: true}
    );

    canvas.addEventListener('pointerup',
      (e) => {
        if(e.pointerType === 'mouse') {
          this._mouseDown = false;
        }
      },
      {passive: true}
    );

    canvas.addEventListener('pointercancel',
      (e) => {
        if(e.pointerType === 'mouse') {
          this._mouseDown = false;
        }
      },
      {passive: true}
    );
  }
  // WASD MOVEMENT
  _applyDigitalMovement() {
    const d = this._digital;
    if(d === 0) return;
    const right = this.right;
    const up = this.up;
    const back = this.back;
    const p = this.position;
    let vx = 0;
    let vy = 0;
    let vz = 0;
    if(d & 1) {vx -= back[0]; vy -= back[1]; vz -= back[2];}
    if(d & 2) {vx += back[0]; vy += back[1]; vz += back[2];}
    if(d & 4) {vx -= right[0]; vy -= right[1]; vz -= right[2];}
    if(d & 8) {vx += right[0]; vy += right[1]; vz += right[2];}
    if(d & 16) {vx += up[0]; vy += up[1]; vz += up[2];}
    if(d & 32) {vx -= up[0]; vy -= up[1]; vz -= up[2];}
    const s = this.movementSpeed;
    p[0] += vx * s;
    p[1] += vy * s;
    p[2] += vz * s;
    this._dirtyAngle = true;
  }

  update() {
    if(!this._dirtyAngle) return;
    this._recalculateViewVP();
    this._dirtyAngle = false;
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

  setPosition = (x, y, z) => {
    this.position[0] = x;
    this.position[1] = y;
    this.position[2] = z;
    this._dirtyAngle = true;
  }

  setPitch = (p) => {
    this.pitch = p;
    this._dirtyAngle = true;
  }

  setYaw = (y) => {
    this.yaw = y;
    this._dirtyAngle = true;
  }
  // LOOK CONTROL
  setLookEnabled = (enabled) => {this._lookDisabled = !enabled;}
  disableLook = () => {this._lookDisabled = true;}
  enableLook = () => {this._lookDisabled = false;}
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
  _lastMoveSceneTime = undefined;
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

  _applyDigitalMovement(sceneTime) {
    const d = this._digital;
    if(!d.forward && !d.backward && !d.left && !d.right) {
      this._lastMoveSceneTime = sceneTime;
      return;
    }
    if(this._lastMoveSceneTime === undefined) {
      this._lastMoveSceneTime = sceneTime;
      return;
    }
    let dt = sceneTime - this._lastMoveSceneTime;
    this._lastMoveSceneTime = sceneTime;
    if(dt <= 0) return;
    if(dt > 0.1) dt = 0.1;
    let vx = 0, vz = 0;
    if(d.forward) {vx -= this.back[0]; vz -= this.back[2];}
    if(d.backward) {vx += this.back[0]; vz += this.back[2];}
    if(d.right) {vx += this.right[0]; vz += this.right[2];}
    if(d.left) {vx -= this.right[0]; vz -= this.right[2];}
    const len = Math.sqrt(vx * vx + vz * vz);
    if(len < 0.0001) return;
    const s = this.KEYBOARD_SPEED * (dt / 0.016) / len;
    this.position[0] += vx * s;
    this.position[2] += vz * s;
    this._dirty = true;
    this._dirtyAngle = true;
  }

  _setupKeyboard() {
    const setDigital = (e, value) => {
      const d = this._digital;
      const wasAnyDown = d.forward || d.backward || d.left || d.right;
      switch(e.code) {
        case 'KeyW': case 'ArrowUp': d.forward = value; break;
        case 'KeyS': case 'ArrowDown': d.backward = value; break;
        case 'KeyA': case 'ArrowLeft': d.left = value; break;
        case 'KeyD': case 'ArrowRight': d.right = value; break;
        default: return;
      }
      const anyDown = d.forward || d.backward || d.left || d.right;
      if(value && !wasAnyDown) {
        this._detachedFromFollow = true;
        this._lastMoveSceneTime = undefined;
      } else if(!anyDown) {
        this._lastMoveSceneTime = undefined;
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
    if(!this._dirty) {this._dirtyAngle = false; return;}
    this._recalculateViewVP();
    this._dirty = false;
    this._dirtyAngle = false;
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
  right = vec3.fromValues(1, 0, 0);
  up = vec3.fromValues(0, 1, 0);
  back = vec3.fromValues(0, 0, 1);
  _rotYScratch = mat4.create();
  _rotXScratch = mat4.create();
  _viewScratch = mat4.create();
  // Bitmask:
  // 1 = forward, 2 = backward, 4 = left, 8 = right
  _digital = 0;
  _mouseDown = false;
  _lookDisabled = false;
  _jumpVelocity = 0;
  _jumpVelocityAMP = 1;
  _isGrounded = false;
  usePointerEvents = false;
  MOUSE_SENS = MEConfig.MOUSE_SENS;
  TOUCH_SENS = MEConfig.TOUCH_SENS;
  movementSpeed = MEConfig.CAM_SPEED;
  rotationSpeed = 1;
  _dirtyAngle = true;
  static HALF_PI = Math.PI * 0.5;
  static DIAG = 0.7071067811865476;
  constructor(options = {}) {
    if(options.usePointerEvents) {
      this.usePointerEvents = options.usePointerEvents;
    }
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
    this._onKeyDown = this._handleKeyDown.bind(this);
    this._onKeyUp = this._handleKeyUp.bind(this);
    if(this.canvas) {this._setupInput(this.canvas);}
    this._recalculateViewVP();
    if(isMobile() === true && options.isActive === 'init active cam') {
      MobileDOM.createWASD(this, {
        margin: 50,
        forMobileJoystick: true,
        color: 'red'
      });
    }
  }

  setProjection = (fov = (2 * Math.PI) / 5, aspect = 1, near = 1, far = 1000) => {
    mat4.perspective(fov, aspect, near, far, this.projectionMatrix);
    this._dirtyAngle = true;
    this._recalculateViewVP();
    this._dirtyAngle = false;
  };

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
    const yaw = this.yaw;
    const pitch = this.pitch;
    const cy = Math.cos(yaw);
    const sy = Math.sin(yaw);
    const cp = Math.cos(pitch);
    const sp = Math.sin(pitch);
    const rx = this.right;
    const uy = this.up;
    const bz = this.back;
    const p = this.position;
    const vs = this.view;
    rx[0] = cy;
    rx[1] = 0;
    rx[2] = -sy;
    uy[0] = sy * sp;
    uy[1] = cp;
    uy[2] = cy * sp;
    bz[0] = sy * cp;
    bz[1] = -sp;
    bz[2] = cy * cp;
    vs[0] = rx[0];
    vs[4] = rx[1];
    vs[8] = rx[2];
    vs[12] = -(rx[0] * p[0] + rx[1] * p[1] + rx[2] * p[2]);
    vs[1] = uy[0];
    vs[5] = uy[1];
    vs[9] = uy[2];
    vs[13] = -(uy[0] * p[0] + uy[1] * p[1] + uy[2] * p[2]);
    vs[2] = bz[0];
    vs[6] = bz[1];
    vs[10] = bz[2];
    vs[14] = -(bz[0] * p[0] + bz[1] * p[1] + bz[2] * p[2]);
    vs[3] = 0;
    vs[7] = 0;
    vs[11] = 0;
    vs[15] = 1;
    FirstPersonCamera.mat4MultiplySafe(this.projectionMatrix, vs, this.VP);
  }

  // INPUT SETUP
  _setupInput(canvas) {
    canvas.style.touchAction = 'none';
    const mobile = isMobile() === true;
    if(mobile) {
      this._setupTouchEvents(canvas);
    } else {
      canvas.oncontextmenu = (e) => e.preventDefault();
      if(this.usePointerEvents) {
        this._setupPointerEvents(canvas);
      } else {
        this._setupMouseEvents(canvas);
      }
    }

    window.addEventListener('keydown', this._onKeyDown, {passive: true});
    window.addEventListener('keyup', this._onKeyUp, {passive: true});
  }

  _setupTouchEvents(canvas) {
    let lookTouchId = null;
    let touchStartX = 0;
    let touchStartY = 0;
    canvas.addEventListener('touchstart', (e) => {
      if(lookTouchId !== null) return;
      const touches = e.changedTouches;
      for(let i = 0;i < touches.length;i++) {
        const t = touches[i];
        if(t.target === canvas) {
          lookTouchId = t.identifier;
          touchStartX = t.clientX;
          touchStartY = t.clientY;
          break;
        }
      }
    }, {passive: false});

    canvas.addEventListener('touchmove', (e) => {
      if(lookTouchId === null || this._lookDisabled) return;
      const touches = e.touches;
      let touch = null;
      for(let i = 0;i < touches.length;i++) {
        if(touches[i].identifier === lookTouchId) {
          touch = touches[i];
          break;
        }
      }
      if(touch === null) return;
      const dx = (touch.clientX - touchStartX) * this.TOUCH_SENS;
      const dy = (touch.clientY - touchStartY) * this.TOUCH_SENS;
      this.yaw -= dx * this.rotationSpeed;
      this.pitch -= dy * this.rotationSpeed;
      this._clampPitch();
      this._dirtyAngle = true;
      touchStartX = touch.clientX;
      touchStartY = touch.clientY;
      e.preventDefault();
    }, {passive: false});

    const clearLookTouch = (e) => {
      const touches = e.changedTouches;
      for(let i = 0;i < touches.length;i++) {
        if(touches[i].identifier === lookTouchId) {
          lookTouchId = null;
          break;
        }
      }
    };

    canvas.addEventListener('touchend', clearLookTouch, {passive: true});
    canvas.addEventListener('touchcancel', clearLookTouch, {passive: true});
  }

  _clampPitch() {
    const halfPi = FirstPersonCamera.HALF_PI;
    if(this.pitch > halfPi) {
      this.pitch = halfPi;
    } else if(this.pitch < -halfPi) {
      this.pitch = -halfPi;
    }
  }

  _setupMouseEvents(canvas) {
    // DESKTOP MOUSE — classic events by default.
    if(isMobile() === false) {
      canvas.addEventListener('contextmenu', e => {
        e.preventDefault();
      });
      const onMouseMove = e => {
        if(window.__isDragging === true) return;

        this.yaw -= e.movementX * this.MOUSE_SENS * this.rotationSpeed;
        this.pitch -= e.movementY * this.MOUSE_SENS * this.rotationSpeed;

        this.yaw %= Math.PI * 2;
        this.pitch = Math.max(
          -Math.PI / 2,
          Math.min(Math.PI / 2, this.pitch)
        );

        this._dirtyAngle = true;
      };
      canvas.addEventListener('mousemove', onMouseMove, {passive: true});
    }
  }

  _setupPointerEvents(canvas) {
    canvas.addEventListener('pointerdown', (e) => {
      if(e.pointerType !== 'mouse' || e.button !== 0) return;
      this._mouseDown = true;
      if(canvas.requestPointerLock) {
        canvas.requestPointerLock();
      } else if(canvas.setPointerCapture) {
        canvas.setPointerCapture(e.pointerId);
      }
    }, {passive: true});

    canvas.addEventListener('pointermove', (e) => {
      if(window.__isDragging === true) return;
      if(e.pointerType !== 'mouse') return;
      if(this._lookDisabled) return;
      this.yaw -= e.movementX * this.MOUSE_SENS * this.rotationSpeed;
      this.pitch -= e.movementY * this.MOUSE_SENS * this.rotationSpeed;
      this._clampPitch();
      this._dirtyAngle = true;
    }, {passive: true});

    const stopLook = (e) => {
      if(e.pointerType === 'mouse') {
        this._mouseDown = false;
      }
    };

    canvas.addEventListener('pointerup', stopLook, {passive: true});
    canvas.addEventListener('pointercancel', stopLook, {passive: true});
  }

  _getKeyBit(code) {
    switch(code) {
      case 'KeyW':
      case 'ArrowUp':
        return 1;
      case 'KeyS':
      case 'ArrowDown':
        return 2;
      case 'KeyA':
      case 'ArrowLeft':
        return 4;
      case 'KeyD':
      case 'ArrowRight':
        return 8;
      case 'Space':
        return 16;
      default:
        return 0;
    }
  }

  _handleKeyDown(e) {
    if(e.code === 'Space') {
      if(window.app?.collisionSystem?._onGround) {
        window.app.collisionSystem._gravityAcc = 0.22;
        window.app.collisionSystem._onGround = false;
        this._jumpVelocity = 1;
        this._dirtyAngle = true;
      }
    }
    const bit = this._getKeyBit(e.code);
    if(bit !== 0) {this._digital |= bit;}
  }

  _handleKeyUp(e) {
    if(e.code === 'Space') {return;}
    const bit = this._getKeyBit(e.code);
    if(bit !== 0) {
      this._digital &= ~bit;
    }
  }

  setDigital(e, value) {
    if(e.code === 'Space') {
      if(value === true && window.app?.collisionSystem?._onGround) {
        window.app.collisionSystem._gravityAcc = 0.22;
        window.app.collisionSystem._onGround = false;
        this._dirtyAngle = true;
      }
      return;
    }
    const bit = this._getKeyBit(e.code);
    if(bit === 0) return;
    if(value) {
      this._digital |= bit;
    } else {
      this._digital &= ~bit;
    }
  }

  _applyDigitalMovement(sceneTime) {
    const d = this._digital;
    if(d === 0) {
      this._lastMoveSceneTime = sceneTime;
      return;
    }
    if(this._lastMoveSceneTime === undefined) {
      this._lastMoveSceneTime = sceneTime;
      return;
    }
    let dt = sceneTime - this._lastMoveSceneTime;
    this._lastMoveSceneTime = sceneTime;
    if(dt <= 0) return;
    if(dt > 0.1) dt = 0.1;
    const fx = -this.back[0];
    const fz = -this.back[2];
    let vx = 0;
    let vz = 0;
    if(d & 1) {vx += fx; vz += fz;}
    if(d & 2) {vx -= fx; vz -= fz;}
    if(d & 4) {vx -= this.right[0]; vz -= this.right[2];}
    if(d & 8) {vx += this.right[0]; vz += this.right[2];}
    const len = Math.sqrt(vx * vx + vz * vz);
    if(len > 0.0001) {
      const speed = this.movementSpeed * (dt / 0.016) / len;
      this.position[0] += vx * speed;
      this.position[2] += vz * speed;
      this._dirtyAngle = true;
    }
    if(this._jumpVelocity !== 0) {
      this.position[1] += this._jumpVelocity;
      this._jumpVelocity = 0;
      this._dirtyAngle = true;
    } else {
      this._dirtyAngle = true;

    }
  }

  removeKeyboard() {
    window.removeEventListener('keydown', this._onKeyDown);
    window.removeEventListener('keyup', this._onKeyUp);
    this._digital = 0;
    this._onKeyDown = null;
    this._onKeyUp = null;
  }

  forceViewUpdate() {
    this._recalculateViewVP();
    this._dirtyAngle = false;
  }

  setPitch = (p) => {
    this.pitch = p;
    this._clampPitch();
    this._dirtyAngle = true;
  };

  setYaw = (y) => {
    this.yaw = y;
    this._dirtyAngle = true;
  };

  setPosition = (x, y, z) => {
    this.position[0] = x;
    this.position[1] = y;
    this.position[2] = z;
    this._dirtyAngle = true;
  };

  setX = (x) => {
    this.position[0] = x;
    this._dirtyAngle = true;
  };

  setY = (y) => {
    this.position[1] = y;
    this._dirtyAngle = true;
  };

  setZ = (z) => {
    this.position[2] = z;
    this._dirtyAngle = true;
  };

  setLookEnabled = (enabled) => {
    this._lookDisabled = !enabled;
  };

  disableLook = () => {
    this._lookDisabled = true;
  };

  enableLook = () => {
    this._lookDisabled = false;
  };

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

  // Cinematic-only setters
  setTarget = (x, y, z) => {
    this._target[0] = x;
    this._target[1] = y;
    this._target[2] = z;
    this._useTarget = true;
    this._dirtyAngle = true;
  }

  setRoll = (r) => {
    this._roll = r;
    this._dirtyAngle = true;
  }

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
    // this._dirtyAngle = false;
    this._dirtyAngle = this._playing || this._shake.active;
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
    this.handle = (e, isDown) => {
      switch(e.code) {
        case 'KeyA': case 'ArrowLeft': isDown ? this.onLeft?.() : this.onLeftRelease?.(); break;
        case 'KeyD': case 'ArrowRight': isDown ? this.onRight?.() : this.onRightRelease?.(); break;
        case 'KeyW': case 'ArrowUp': isDown ? this.onUp?.() : this.onUpRelease?.(); break;
        case 'KeyS': case 'ArrowDown': isDown ? this.onDown?.() : this.onDownRelease?.(); break;
        case 'KeyJ': isDown ? this.onAction1?.() : this.onAction1Release?.(); break;
        case 'KeyK': isDown ? this.onAction2?.() : this.onAction2Release?.(); break;
      }
    };
    window.addEventListener('keydown', e => {if(!e.repeat) this.handle(e, true);}, {passive: true});
    window.addEventListener('keyup', e => this.handle(e, false), {passive: true});
  }

  removeKeyboard() {
    window.removeEventListener('keydown', this.handle);
    window.removeEventListener('keyup', this.handle);
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
    if(!this._dirty) {this._dirtyAngle = false; return;}
    this._recalculateViewVP();
    this._dirty = false;
    this._dirtyAngle = false;
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
  _lastMoveSceneTime = undefined;
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

  _applyDigitalMovement(sceneTime) {
    const d = this._digital;
    const anyDown = d.forward || d.backward || d.left || d.right;
    if(!anyDown) {
      this._lastMoveSceneTime = sceneTime;
      return;
    }
    if(this._bridge && this._followBodyId !== null) {
      let vx = 0, vy = 0;
      if(d.left) vx -= this.MOVE_FORCE;
      if(d.right) vx += this.MOVE_FORCE;
      if(d.forward) vy -= this.MOVE_FORCE;
      if(d.backward) vy += this.MOVE_FORCE;
      this._bridge._send({type: 'setVelocity', id: this._followBodyId, vx, vy});
      return;
    }
    if(this._lastMoveSceneTime === undefined) {
      this._lastMoveSceneTime = sceneTime;
      return;
    }
    let dt = sceneTime - this._lastMoveSceneTime;
    this._lastMoveSceneTime = sceneTime;
    if(dt <= 0) return;
    if(dt > 0.1) dt = 0.1;
    let vx = 0, vz = 0;
    if(d.forward) vx -= this.back[0], vz -= this.back[2];
    if(d.backward) vx += this.back[0], vz += this.back[2];
    if(d.right) vx += this.right[0], vz += this.right[2];
    if(d.left) vx -= this.right[0], vz -= this.right[2];
    const len = Math.sqrt(vx * vx + vz * vz);
    if(len < 0.0001) return;
    const s = this.KEYBOARD_SPEED * (dt / 0.016) / len;
    this.position[0] += vx * s;
    this.position[2] += vz * s;
    this._dirty = true;
    this._dirtyAngle = true;
  }

  setFollowObject = (obj, matterBridge) => {
    this._bridge = matterBridge;
    this.followMe = obj.position;
    // optional — only if you want WASD to drive physics velocity
    cam._followBodyId = heroBodyId;
  }

  _setupKeyboard() {
    const setDigital = (e, value) => {
      const d = this._digital;
      const wasAnyDown = d.forward || d.backward || d.left || d.right;
      switch(e.code) {
        case 'KeyW': case 'ArrowUp': d.forward = value; break;
        case 'KeyS': case 'ArrowDown': d.backward = value; break;
        case 'KeyA': case 'ArrowLeft': d.left = value; break;
        case 'KeyD': case 'ArrowRight': d.right = value; break;
        default: return;
      }
      const anyDown = d.forward || d.backward || d.left || d.right;
      if(value && !wasAnyDown) {
        this._detachedFromFollow = !this._bridge;
        this._lastMoveSceneTime = undefined;
      }
      if(!anyDown) {
        this._lastMoveSceneTime = undefined;
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
    if(!this._dirty) {this._dirtyAngle = false; return;}
    this._recalculateViewVP();
    this._dirty = false;
    this._dirtyAngle = false;
  }
}

const DIGITAL_BITS = {forward: 1, backward: 2, left: 4, right: 8};

export const MobileDOM = {
  _wasd: null,
  eventDown: null,
  eventUp: null,
  eventCancel: null,
  createWASD(camera, options = {}) {
    const size = options.size ?? 60;
    const marginR = options.marginR ?? 0;
    const marginB = options.marginB ?? 0;
    const opacity = options.opacity ?? 0.35;
    const color = options.color ?? '#ffffff';
    const forMobileJoystick = options.forMobileJoystick ?? false;
    const wrap = document.createElement('div');
    wrap.id = 'mobileControls';
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
    const defs = [
      ['▲', 2, 1, 'forward'],
      ['◀', 1, 2, 'left'],
      ['▼', 2, 2, 'backward'],
      ['▶', 3, 2, 'right'],
    ];
    const idle = `rgba(255,255,255,${opacity * 0.4})`;
    const active = `rgba(255,255,255,${opacity})`;
    const setBit = (action, on) => {
      const bit = DIGITAL_BITS[action];
      if(!bit) return;
      if(on) {
        // First press after idle: reset the time base so the first frame
        // doesn't get a huge stale dt (the loop skips the call while _digital === 0)
        if(camera._digital === 0) camera._lastMoveSceneTime = undefined;
        camera._digital |= bit;
      } else {
        camera._digital &= ~bit;
      }
      buttons[action].style.background = on ? active : idle;
    };

    const buttons = {};
    const handlers = [];

    for(const [label, col, row, action] of defs) {
      const btn = document.createElement('div');
      btn.id = label;
      btn.dataset.action = action;
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
        background: idle,
        border: `2px solid rgba(255,255,255,${opacity})`,
        borderRadius: `${size * 0.18}px`,
        cursor: 'pointer',
        WebkitTapHighlightColor: 'transparent',
      });
      btn.textContent = label;
      buttons[action] = btn;

      if(!forMobileJoystick) {
        const down = e => {
          console.log('pad down', e.pointerId, document.elementFromPoint(e.clientX, e.clientY)?.dataset?.action);
          e.stopPropagation();
          btn.setPointerCapture(e.pointerId);
          setBit(action, true);
        };
        const up = () => setBit(action, false);
        btn.addEventListener('pointerdown', down, {passive: true});
        btn.addEventListener('pointerup', up, {passive: true});
        btn.addEventListener('pointercancel', up, {passive: true});
        handlers.push([btn, 'pointerdown', down], [btn, 'pointerup', up], [btn, 'pointercancel', up]);
      }
      wrap.appendChild(btn);
    }

    if(forMobileJoystick) {
      console.log('pad down forMobileJoystick true');
      // direction follows the finger across the pad
      let activePointerId = null;
      let activeAction = null;
      const setActive = (action) => {
        if(activeAction === action) return;
        if(activeAction) setBit(activeAction, false);
        activeAction = action;
        if(activeAction) setBit(activeAction, true);
      };
      const actionAt = (x, y) => document.elementFromPoint(x, y)?.dataset?.action ?? null;

      const onDown = e => {
        e.stopPropagation();
        activePointerId = e.pointerId;
        wrap.setPointerCapture(e.pointerId);
        setActive(actionAt(e.clientX, e.clientY));
      };
      const onMove = e => {
        if(e.pointerId !== activePointerId) return;
        setActive(actionAt(e.clientX, e.clientY));
      };
      const onUp = e => {
        if(e.pointerId !== activePointerId) return;
        activePointerId = null;
        setActive(null);
      };

      wrap.addEventListener('pointerdown', onDown, {passive: true});
      wrap.addEventListener('pointermove', onMove, {passive: true});
      wrap.addEventListener('pointerup', onUp, {passive: true});
      wrap.addEventListener('pointercancel', onUp, {passive: true});
      handlers.push(
        [wrap, 'pointerdown', onDown], [wrap, 'pointermove', onMove],
        [wrap, 'pointerup', onUp], [wrap, 'pointercancel', onUp]
      );
    }
    MobileDOM._wasd = {camera, handlers, wrap};
    document.body.appendChild(wrap);
    return wrap;
  },

  destroyWASD() {
    const w = MobileDOM._wasd;
    if(!w) return;
    for(const [el, type, fn] of w.handlers) el.removeEventListener(type, fn);
    w.camera._digital = 0;
    w.wrap.remove();
    MobileDOM._wasd = null;
  },

  addButton(label, onClick, onRelease = () => {}, options = {}, onMove = () => {}) {
    document.body.style.touchAction = 'none';
    const size = options.size ?? 56;
    const bottom = options.bottom ?? 0;
    const left = options.left ?? 0;
    const height = options.height ?? size;
    const width = options.width ?? size;
    const opacity = options.opacity ?? 0.35;
    const image = options.image ?? null;
    const setID = options.id ?? null;
    const fontSize = options.fontSize ?? `${size * 0.25}px`;
    const borderRadius = options.borderRadius ?? '50%';
    const btn = document.createElement('div');
    if(setID !== null) {btn.id = setID;}
    Object.assign(btn.style, {
      position: 'fixed',
      bottom: `${bottom}%`,
      left: `${left}%`,
      width: `${width}px`,
      height: `${height}px`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: fontSize,
      color: options.color ?? '#ffffff',
      background: image ? `url('${image}') no-repeat center/contain` : `rgba(255,255,255,${opacity * 0.4})`,
      border: `2px solid rgba(255,255,255,${opacity})`,
      borderRadius: borderRadius,
      zIndex: '9999',
      userSelect: 'none',
      cursor: 'pointer',
      WebkitTapHighlightColor: 'transparent',
      touchAction: 'none',
    });
    btn.textContent = label;

    if(isMobile() === true) {
      btn.addEventListener('touchstart', (e) => {
        e.stopPropagation();
        onClick(e);
      }, {passive: true});
      btn.addEventListener('touchend', (e) => {onRelease(e);}, {passive: true});
      btn.addEventListener('touchcancel', (e) => {onRelease(e);}, {passive: true});
      btn.addEventListener('touchmove', (e) => {onMove(e);}, {passive: true});
    } else {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        onClick(e);
      }, {passive: true});
      btn.addEventListener('mouseup', (e) => {onRelease(e);}, {passive: true});
      btn.addEventListener('mousemove', (e) => {onMove(e);}, {passive: true});
    }
    document.body.appendChild(btn);
    return btn;
  },

  addProgressBar(options = {}) {
    const size = options.size ?? 200;
    const bottom = options.bottom ?? 10;
    const left = options.left ?? 10;
    const opacity = options.opacity ?? 0.35;
    const color = options.color ?? '#4caf50';
    const height = options.height ?? size;
    const width = options.width ?? size;
    const barWrapper = document.createElement('div');
    Object.assign(barWrapper.style, {
      position: 'fixed',
      bottom: `${bottom}%`,
      left: `${left}%`,
      width: `${width}px`,
      height: `${height}px`,
      background: `rgba(0,0,0,${opacity})`,
      border: `2px solid rgba(255,255,255,${opacity})`,
      borderRadius: `${size * 0.05}px`,
      zIndex: '9999',
      overflow: 'hidden'
    });
    const fill = document.createElement('div');
    Object.assign(fill.style, {
      width: '100%',
      height: '100%',
      background: color,
      transition: 'width 0.2s ease, background 0.3s ease'
    });
    barWrapper.appendChild(fill);
    document.body.appendChild(barWrapper);
    return Object.assign(barWrapper, {
      setValue: (percent) => {
        const p = Math.max(0, Math.min(100, percent));
        fill.style.width = `${p}%`;
        fill.style.background = p > 60 ? '#4caf50' : p > 30 ? '#ffc107' : '#f44336';
      }
    });
  },

  addSlider(onChange = (v) => {}, options = {}) {
    const width = options.width ?? 200;
    const bottom = options.bottom ?? 5;
    const left = options.left ?? 10;
    const opacity = options.opacity ?? 0.35;
    const slider = document.createElement('input');
    Object.assign(slider, {
      type: 'range',
      min: options.min ?? 0,
      max: options.max ?? 100,
      value: options.value ?? 50
    });
    Object.assign(slider.style, {
      position: 'fixed',
      bottom: `${bottom}%`,
      left: `${left}%`,
      width: `${width}px`,
      zIndex: '9999',
      accentColor: options.color ?? '#ffffff',
      cursor: 'pointer',
      touchAction: 'none'
    });
    const handleInput = (e) => onChange(parseFloat(slider.value));
    if(isMobile()) {
      slider.addEventListener('touchmove', handleInput, {passive: true});
      slider.addEventListener('touchstart', handleInput, {passive: true});
    } else {
      slider.addEventListener('mousemove', handleInput, {passive: true});
      slider.addEventListener('mousedown', handleInput, {passive: true});
    }
    document.body.appendChild(slider);
    return slider;
  }
};