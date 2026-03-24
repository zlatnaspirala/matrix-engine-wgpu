import {mat4, vec3} from 'wgpu-matrix';

// The common functionality between camera implementations
class CameraBase {
  // The camera matrix
  matrix_ = new Float32Array([
    1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1,
  ]);

  // The calculated view matrix readonly
  view_ = mat4.create();

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
    mat4.copy(mat, this.matrix_);
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
    mat4.copy(mat, this.view_);
  }

  // Returns column vector 0 of the camera matrix
  get right() {
    return this.right_;
  }

  // Assigns `vec` to the first 3 elements of column vector 0 of the camera matrix
  set right(vec) {
    vec3.copy(vec, this.right_);
  }

  // Returns column vector 1 of the camera matrix
  get up() {
    return this.up_;
  }

  // Assigns `vec` to the first 3 elements of column vector 1 of the camera matrix \ Vec3
  set up(vec) {
    vec3.copy(vec, this.up_);
  }

  // Returns column vector 2 of the camera matrix
  get back() {
    return this.back_;
  }

  // Assigns `vec` to the first 3 elements of column vector 2 of the camera matrix
  set back(vec) {
    vec3.copy(vec, this.back_);
  }

  // Returns column vector 3 of the camera matrix
  get position() {
    return this.position_;
  }

  // Assigns `vec` to the first 3 elements of column vector 3 of the camera matrix
  set position(vec) {
    vec3.copy(vec, this.position_);
  }
}

// WASDCamera is a camera implementation that behaves similar to first-person-shooter PC games.
export class WASDCamera {
  pitch = 0;
  yaw = 0;
  position = new Float32Array(3);
  velocity = new Float32Array(3);
  view = new Float32Array(16);
  VP = new Float32Array(16);
  projectionMatrix = new Float32Array(16);
  _moveVelScratch = new Float32Array(3);

  right = vec3.fromValues(1, 0, 0);
  up = vec3.fromValues(0, 1, 0);
  back = vec3.fromValues(0, 0, 1);
  // view = mat4.create();
  // projectionMatrix = mat4.create();
  // VP = mat4.create();
  // _moveVelScratch = vec3.create()
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
    // const pointerLast = this._pointerLast;
    canvas.style.touchAction = 'none';
    canvas.addEventListener('pointerdown', e => {
      e.preventDefault();
      this._mouseDown = true;
      this._lastX = e.clientX;
      this._lastY = e.clientY;
      canvas.setPointerCapture(e.pointerId);
    }, {passive: true});
    const pointerUp = e => {this._mouseDown = false;};
    canvas.addEventListener('pointerup', pointerUp, {passive: true});
    canvas.addEventListener('pointercancel', pointerUp, {passive: true});
    canvas.addEventListener('pointermove', e => {
      e.preventDefault();
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
        this._recalculateViewVP();
      }
    }, {passive: false});

    this._keyInterval = null;
    // Keyboard WASD
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
        this._keyInterval = setInterval(() => this._applyDigitalMovement(), 16);
      } else {
        const d = this._digital;
        if(!d.forward && !d.backward && !d.left && !d.right && !d.up && !d.down) {
          clearInterval(this._keyInterval);
          this._keyInterval = null;
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
  }
}

// ArcballCamera implements a basic orbiting camera around the world origin
export class ArcballCamera extends CameraBase {
  // The camera distance from the target
  distance = 0;

  // The current angular velocity
  angularVelocity = 0;

  // The current rotation axis
  axis_ = vec3.create();

  // Returns the rotation axis
  get axis() {
    return this.axis_;
  }
  // Assigns `vec` to the rotation axis
  set axis(vec) {
    vec3.copy(vec, this.axis_);
  }

  // Speed multiplier for camera rotation
  rotationSpeed = 1;

  // Speed multiplier for camera zoom
  zoomSpeed = 0.1;

  // Rotation velocity drag coeffient [0 .. 1]
  // 0: Spins forever
  // 1: Instantly stops spinning
  frictionCoefficient = 0.999;

  setProjection(fov = (2 * Math.PI) / 5, aspect = 1, near = 1, far = 1000) {
    this.projectionMatrix = mat4.perspective(fov, aspect, near, far);
  }
  // Construtor
  constructor(options) {
    super();
    if(options && options.position) {
      this.position = options.position;
      this.distance = vec3.len(this.position);
      this.back = vec3.normalize(this.position);

      this.setProjection((2 * Math.PI) / 5, this.aspect, 1, 2000);

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
    this.distance = vec3.len(this.position);
  }

  update(deltaTime, input) {
    const epsilon = 0.0000001;
    if(input.analog.touching) {
      // Currently being dragged.
      this.angularVelocity = 0;
    } else {
      // Dampen any existing angular velocity
      this.angularVelocity *= Math.pow(1 - this.frictionCoefficient, deltaTime);
    }
    // Calculate the movement vector
    const movement = vec3.create();
    vec3.addScaled(movement, this.right, input.analog.x, movement);
    vec3.addScaled(movement, this.up, -input.analog.y, movement);
    // Cross the movement vector with the view direction to calculate the rotation axis x magnitude
    const crossProduct = vec3.cross(movement, this.back);
    // Calculate the magnitude of the drag
    const magnitude = vec3.len(crossProduct);
    if(magnitude > epsilon) {
      // Normalize the crossProduct to get the rotation axis
      this.axis = vec3.scale(crossProduct, 1 / magnitude);
      // Remember the current angular velocity. This is used when the touch is released for a fling.
      this.angularVelocity = magnitude * this.rotationSpeed;
    }
    // The rotation around this.axis to apply to the camera matrix this update
    const rotationAngle = this.angularVelocity * deltaTime;
    if(rotationAngle > epsilon) {
      // Rotate the matrix around axis
      // Note: The rotation is not done as a matrix-matrix multiply as the repeated multiplications
      // will quickly introduce substantial error into the matrix.
      this.back = vec3.normalize(rotate(this.back, this.axis, rotationAngle));
      this.recalcuateRight();
      this.recalcuateUp();
    }

    // recalculate `this.position` from `this.back` considering zoom
    if(input.analog.zoom !== 0) {
      this.distance *= 1 + input.analog.zoom * this.zoomSpeed;
    }
    this.position = vec3.scale(this.back, this.distance);

    // Invert the camera matrix to build the view matrix
    // this.view = mat4.invert(this.matrix);
    mat4.invert(this.matrix, this.view_);
    return this.view_;
  }

  // Assigns `this.right` with the cross product of `this.up` and `this.back`
  recalcuateRight() {
    this.right = vec3.normalize(vec3.cross(this.up, this.back));
  }

  // Assigns `this.up` with the cross product of `this.back` and `this.right`
  recalcuateUp() {
    this.up = vec3.normalize(vec3.cross(this.back, this.right));
  }
}

export class RPGCamera {
  // ====== CORE ======
  pitch = -0.88;
  yaw = 0;

  position = vec3.create();

  right = vec3.fromValues(1, 0, 0);
  up = vec3.fromValues(0, 1, 0);
  back = vec3.fromValues(0, 0, 1);

  view = mat4.create();
  projectionMatrix = mat4.create();
  VP = mat4.create();

  _viewScratch = mat4.create();
  _rotYScratch = mat4.create();
  _rotXScratch = mat4.create();

  // ====== RPG LOGIC ======
  followMe = null;
  followMeOffset = 150;

  scrollY = 50;
  minY = 50.5;
  maxY = 135.0;
  scrollSpeed = 1;

  mousRollInAction = false;
  _dirty = true;

  constructor(options = {}) {
    if(options.position) vec3.copy(options.position, this.position);

    this.canvas = options.canvas;
    this.aspect = this.canvas ? this.canvas.width / this.canvas.height : 1;
    this.setProjection((2 * Math.PI) / 5, this.aspect, 1, 2000);

    this._setupEvents();

    // initial build
    this._updateOrientation();
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

  _updateOrientation() {
    mat4.rotationY(this.yaw, this._rotYScratch);
    mat4.rotateX(this._rotYScratch, this.pitch, this._rotXScratch);

    this.right[0] = this._rotXScratch[0];
    this.right[1] = this._rotXScratch[1];
    this.right[2] = this._rotXScratch[2];

    this.up[0] = this._rotXScratch[4];
    this.up[1] = this._rotXScratch[5];
    this.up[2] = this._rotXScratch[6];

    this.back[0] = this._rotXScratch[8];
    this.back[1] = this._rotXScratch[9];
    this.back[2] = this._rotXScratch[10];
  }

  _updateFollow() {
    if(!this.followMe) return;

    if(this.followMe.inMove === true || this.mousRollInAction) {
      this.followMeOffset = this.scrollY;
      this.position[0] = this.followMe.x;
      this.position[2] = this.followMe.z + this.followMeOffset;

      app.lightContainer[0].position[0] = this.followMe.x;
      app.lightContainer[0].position[2] = this.followMe.z;
      app.lightContainer[0].target[0] = this.followMe.x;
      app.lightContainer[0].target[2] = this.followMe.z;

      this.mousRollInAction = false;
      this._dirty = true;
    }

    const smoothFactor = 0.1;
    this.position[1] += (this.scrollY - this.position[1]) * smoothFactor;
  }

  update() {
    this._updateFollow();
    if(!this._dirty) return;
    this._updateOrientation();
    // build view NO INVERT
    const rx = this.right, uy = this.up, bz = this.back, p = this.position;
    const vs = this._viewScratch;
    vs[0] = rx[0]; vs[4] = rx[1]; vs[8] = rx[2]; vs[12] = -(rx[0] * p[0] + rx[1] * p[1] + rx[2] * p[2]);
    vs[1] = uy[0]; vs[5] = uy[1]; vs[9] = uy[2]; vs[13] = -(uy[0] * p[0] + uy[1] * p[1] + uy[2] * p[2]);
    vs[2] = bz[0]; vs[6] = bz[1]; vs[10] = bz[2]; vs[14] = -(bz[0] * p[0] + bz[1] * p[1] + bz[2] * p[2]);
    vs[3] = vs[7] = vs[11] = 0; vs[15] = 1;
    this.view.set(vs);
    RPGCamera.mat4MultiplySafe(this.projectionMatrix, this.view, this.VP);
    this._dirty = false;
  }
}

// Returns `x` clamped between [`min` .. `max`]
function clamp(x, min, max) {
  return Math.min(Math.max(x, min), max);
}

// Returns `x` float-modulo `div`
function mod(x, div) {
  return x - Math.floor(Math.abs(x) / div) * div * Math.sign(x);
}

// Returns `vec` rotated `angle` radians around `axis`
function rotate(vec, axis, angle) {
  return vec3.transformMat4Upper3x3(vec, mat4.rotation(axis, angle));
}

// Returns the linear interpolation between 'a' and 'b' using 's'
function lerp(a, b, s) {
  return vec3.addScaled(a, vec3.sub(b, a), s);
}

export function createInputHandler(window, canvas) {

  const digital = {
    forward: false, backward: false,
    left: false, right: false,
    up: false, down: false,
  };

  const analog = {x: 0, y: 0, zoom: 0};

  // Track last position per pointerId for reliable delta on touch
  const pointerLast = new Map();
  let mouseDown = false;

  const output = {
    digital,
    analog: {x: 0, y: 0, zoom: 0, touching: false}
  };

  const setDigital = (e, value) => {
    switch(e.code) {
      case 'KeyW': digital.forward = value; break;
      case 'KeyS': digital.backward = value; break;
      case 'KeyA': digital.left = value; break;
      case 'KeyD': digital.right = value; break;
      case 'KeyV': digital.up = value; break;
      case 'KeyC': digital.down = value; break;
    }
    e.stopPropagation();
  };

  window.addEventListener('keydown', (e) => setDigital(e, true), {passive: true});
  window.addEventListener('keyup', (e) => setDigital(e, false), {passive: true});

  canvas.style.touchAction = 'none'; // ← critical: was 'pinch-zoom', blocks pointermove on mobile

  canvas.addEventListener('pointerdown', (e) => {
    e.preventDefault();              // ← must prevent default to receive move events reliably
    mouseDown = true;
    pointerLast.set(e.pointerId, {x: e.clientX, y: e.clientY});
    canvas.setPointerCapture(e.pointerId); // ← capture so move fires even if finger drifts off canvas
  }, {passive: false});            // ← passive: false required when calling preventDefault

  canvas.addEventListener('pointerup', (e) => {
    mouseDown = false;
    pointerLast.delete(e.pointerId);
  }, {passive: true});

  canvas.addEventListener('pointercancel', (e) => {
    mouseDown = false;
    pointerLast.delete(e.pointerId);
  }, {passive: true});

  const MOUSE_SENS = 0.07;
  const TOUCH_SENS = 0.02;

  canvas.addEventListener('pointermove', (e) => {
    const events = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
    for(const ce of events) {
      if(ce.pointerType === 'mouse') {
        if((ce.buttons & 1) === 0) continue;
        analog.x += ce.movementX * MOUSE_SENS;
        analog.y += ce.movementY * MOUSE_SENS;
      } else {
        const last = pointerLast.get(ce.pointerId);
        if(!last) continue;
        analog.x += (ce.clientX - last.x) * TOUCH_SENS;
        analog.y += (ce.clientY - last.y) * TOUCH_SENS;
        last.x = ce.clientX;
        last.y = ce.clientY;
      }
    }
  }, {passive: true});

  return function getInput() {
    output.analog.x = analog.x;
    output.analog.y = analog.y;
    output.analog.zoom = analog.zoom;
    output.analog.touching = mouseDown;
    analog.x = 0;
    analog.y = 0;
    analog.zoom = 0;
    return output;
  };
}