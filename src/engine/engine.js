// Note: The code in this file does not use the 'dst' output parameter of functions in the
// 'wgpu-matrix' library, so produces many temporary vectors and matrices.
// This is intentional, as this sample prefers readability over performance.
import {mat4, vec3} from 'wgpu-matrix';
import {LOG_INFO} from './utils';

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
export class WASDCamera extends CameraBase {
  // The camera absolute pitch angle
  pitch = 0;
  // The camera absolute yaw angle
  yaw = 0;

  setPitch = (pitch) => {
    this.pitch = pitch;
  }

  setYaw = (yaw) => {
    this.yaw = yaw;
  }

  setX = (x) => {
    this.position[0] = x;
  }

  setY = (y) => {
    this.position[1] = y;
  }

  setZ = (z) => {
    this.position[2] = z;
  }

  // The movement veloicty readonly
  velocity_ = vec3.create();

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
    vec3.copy(vec, this.velocity_);
  }

  setProjection(fov = (2 * Math.PI) / 5, aspect = 1, near = 1, far = 1000) {
    this.projectionMatrix = mat4.perspective(fov, aspect, near, far);
  }

  constructor(options) {
    super();
    if(options && (options.position || options.target)) {
      const position = options.position ?? vec3.create(0, 0, 0);
      const target = options.target ?? vec3.create(0, 0, 0);
      const forward = vec3.normalize(vec3.sub(target, position));
      this.recalculateAngles(forward);
      this.position = position;
      this.canvas = options.canvas;
      this.aspect = options.canvas.width / options.canvas.height;
      this.setProjection((2 * Math.PI) / 5, this.aspect, 1, 2000);
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
    const sign = (positive, negative) =>
      (positive ? 1 : 0) - (negative ? 1 : 0);

    // Apply the delta rotation to the pitch and yaw angles
    this.yaw -= input.analog.x * deltaTime * this.rotationSpeed;
    this.pitch -= input.analog.y * deltaTime * this.rotationSpeed;

    // Wrap yaw between [0° .. 360°], just to prevent large accumulation.
    this.yaw = mod(this.yaw, Math.PI * 2);
    // Clamp pitch between [-90° .. +90°] to prevent somersaults.
    this.pitch = clamp(this.pitch, -Math.PI / 2, Math.PI / 2);

    // Save the current position, as we're about to rebuild the camera matrix.
    const position = vec3.copy(this.position);

    // Reconstruct the camera's rotation, and store into the camera matrix.
    super.matrix = mat4.rotateX(mat4.rotationY(this.yaw), this.pitch);
    // super.matrix = mat4.rotateX(mat4.rotationY(this.yaw), -this.pitch);
    // super.matrix = mat4.rotateY(mat4.rotateX(this.pitch), this.yaw);

    // Calculate the new target velocity
    const digital = input.digital;
    const deltaRight = sign(digital.right, digital.left);
    const deltaUp = sign(digital.up, digital.down);
    const targetVelocity = vec3.create();
    const deltaBack = sign(digital.backward, digital.forward);
    vec3.addScaled(targetVelocity, this.right, deltaRight, targetVelocity);
    vec3.addScaled(targetVelocity, this.up, deltaUp, targetVelocity);
    vec3.addScaled(targetVelocity, this.back, deltaBack, targetVelocity);
    vec3.normalize(targetVelocity, targetVelocity);
    vec3.mulScalar(targetVelocity, this.movementSpeed, targetVelocity);

    // Mix new target velocity
    this.velocity = lerp(
      targetVelocity,
      this.velocity,
      Math.pow(1 - this.frictionCoefficient, deltaTime)
    );

    // Integrate velocity to calculate new position
    this.position = vec3.addScaled(position, this.velocity, deltaTime);

    // Invert the camera matrix to build the view matrix
    this.view = mat4.invert(this.matrix);
    return this.view;
  }

  // Recalculates the yaw and pitch values from a directional vector
  recalculateAngles(dir) {
    this.yaw = Math.atan2(dir[0], dir[2]);
    this.pitch = -Math.asin(dir[1]);
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
    this.view = mat4.invert(this.matrix);
    return this.view;
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
  let digital = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    up: false,
    down: false,
  };
  let analog = {
    x: 0,
    y: 0,
    zoom: 0,
  };
  let mouseDown = false;

  const setDigital = (e, value) => {
    switch(e.code) {
      case 'KeyW': digital.forward = value; break;
      case 'KeyS': digital.backward = value; break;
      case 'KeyA': digital.left = value; break;
      case 'KeyD': digital.right = value; break;
      case 'KeyV': digital.up = value; break;
      case 'KeyC': digital.down = value; break;
    }
    // if you wanna dosavle all keyboard input for some reason...
    // add later like new option feature...
    // e.preventDefault();
    e.stopPropagation();
  };

  window.addEventListener('keydown', (e) => setDigital(e, true));
  window.addEventListener('keyup', (e) => setDigital(e, false));

  canvas.style.touchAction = 'pinch-zoom';
  canvas.addEventListener('pointerdown', () => {mouseDown = true;});
  canvas.addEventListener('pointerup', () => {mouseDown = false;});
  canvas.addEventListener('pointermove', (e) => {
    mouseDown = e.pointerType === 'mouse' ? (e.buttons & 1) !== 0 : true;
    if(mouseDown) {
      analog.x += e.movementX / 10;
      analog.y += e.movementY / 10;
    }
  });

  canvas.addEventListener('wheel', (e) => {
    // if((e.buttons & 1) !== 0) {
    //   analog.zoom += Math.sign(e.deltaY);
    //   e.preventDefault();
    //   e.stopPropagation();
    // }
  }, {passive: false});

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
        touching: mouseDown,
      },
    };
    // Reset only the deltas for next frame
    analog.x = 0;
    analog.y = 0;
    analog.zoom = 0;
    return out;
  };
}

export class RPGCamera extends CameraBase {
  followMe = null;
  pitch = 0;
  yaw = 0;
  velocity_ = vec3.create();
  movementSpeed = 10;
  rotationSpeed = 1;
  followMeOffset = 150; // << mobile adaptation needed after all...
  // Movement velocity drag coeffient [0 .. 1]
  // 0: Continues forever
  // 1: Instantly stops moving
  frictionCoefficient = 0.99;
  // Returns velocity vector

  // Inside your camera control init
  scrollY = 50;
  minY = 50.5;   // minimum camera height
  maxY = 135.0;   // maximum camera height
  scrollSpeed = 1;



  get velocity() {
    return this.velocity_;
  }
  // Assigns `vec` to the velocity vector
  set velocity(vec) {
    vec3.copy(vec, this.velocity_);
  }

  setProjection(fov = (2 * Math.PI) / 5, aspect = 1, near = 1, far = 1000) {
    this.projectionMatrix = mat4.perspective(fov, aspect, near, far);
  }

  constructor(options) {
    super();
    if(options && (options.position || options.target)) {
      const position = options.position ?? vec3.create(0, 0, 0);
      const target = options.target ?? vec3.create(0, 0, 0);
      const forward = vec3.normalize(vec3.sub(target, position));
      this.recalculateAngles(forward);
      this.position = position;
      this.canvas = options.canvas;
      this.aspect = options.canvas.width / options.canvas.height;
      this.setProjection((2 * Math.PI) / 5, this.aspect, 1, 2000);
      // console.log(`%cCamera constructor : ${position}`, LOG_INFO);

      this.mousRollInAction = false;
      addEventListener('wheel', (e) => {
        // Scroll up = zoom out / higher Y
        this.mousRollInAction = true;
        this.scrollY -= e.deltaY * this.scrollSpeed * 0.01;
        // Clamp to range
        this.scrollY = Math.max(this.minY, Math.min(this.maxY, this.scrollY));
      });
    }
  }

  get matrix() {
    return super.matrix;
  }

  // Assigns `mat` to the camera matrix, and recalcuates the camera angles
  set matrix(mat) {
    super.matrix = mat;
    this.recalculateAngles(this.back);
  }

  update(deltaTime, input) {
    const sign = (positive, negative) =>
      (positive ? 1 : 0) - (negative ? 1 : 0);
    // Apply the delta rotation to the pitch and yaw angles
    this.yaw = 0;//-= input.analog.x * deltaTime * this.rotationSpeed;
    this.pitch = -0.88;//  -= input.analog.y * deltaTime * this.rotationSpeed;
    // // Wrap yaw between [0° .. 360°], just to prevent large accumulation.
    this.yaw = mod(this.yaw, Math.PI * 2);
    // // Clamp pitch between [-90° .. +90°] to prevent somersaults.
    this.pitch = clamp(this.pitch, -Math.PI / 2, Math.PI / 2);
    // Save the current position, as we're about to rebuild the camera matrix.
    if(this.followMe != null && this.followMe.inMove === true ||
      this.mousRollInAction == true
    ) {
      //  console.log("  follow : " + this.followMe.x)

      this.followMeOffset = this.scrollY;
      // if player not move allow mouse explore map 
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

    let position = vec3.copy(this.position);
    // Reconstruct the camera's rotation, and store into the camera matrix.
    super.matrix = mat4.rotateX(mat4.rotationY(this.yaw), this.pitch);
    // Calculate the new target velocity
    const digital = input.digital;
    const deltaRight = sign(digital.right, digital.left);
    const deltaUp = sign(digital.up, digital.down);
    const targetVelocity = vec3.create();
    const deltaBack = sign(digital.backward, digital.forward);
    // older then follow
    if(deltaBack == -1) {
      // console.log(deltaBack + "  deltaBack ")
      position[2] += -10;
    } else if(deltaBack == 1) {
      position[2] += 10;
    }
    position[0] += deltaRight * 10;
    vec3.addScaled(targetVelocity, this.right, deltaRight, targetVelocity);
    vec3.addScaled(targetVelocity, this.up, deltaUp, targetVelocity);
    vec3.normalize(targetVelocity, targetVelocity);
    vec3.mulScalar(targetVelocity, this.movementSpeed, targetVelocity);
    this.velocity = lerp(
      targetVelocity,
      this.velocity,
      Math.pow(1 - this.frictionCoefficient, deltaTime)
    );
    this.position = vec3.addScaled(position, this.velocity, deltaTime);
    this.view = mat4.invert(this.matrix);
    return this.view;
  }

  recalculateAngles(dir) {
    this.yaw = Math.atan2(dir[0], dir[2]);
    this.pitch = -Math.asin(dir[1]);
  }
}
