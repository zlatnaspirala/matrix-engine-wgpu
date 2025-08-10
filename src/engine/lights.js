import {mat4, vec3} from 'wgpu-matrix';

export class SpotLight {
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

  constructor(
    position = vec3.create(0, 5, 10),
    target = vec3.create(0, 0, 0),
    fov = 45,
    aspect = 1.0,
    near = 0.1,
    far = 100
  ) {
    this.position = position;
    this.target = target;
    this.up = vec3.create(0, 1, 0);
    this.direction = vec3.normalize(vec3.subtract(target, position));

    this.viewMatrix = mat4.lookAt(position, target, this.up);
    this.projectionMatrix = mat4.perspective(
      (fov * Math.PI) / 180,
      aspect,
      near,
      far
    );
    this.viewProjMatrix = mat4.multiply(this.projectionMatrix, this.viewMatrix);

    this.fov = fov;
    this.aspect = aspect;
    this.near = near;
    this.far = far;

    this.innerCutoff = Math.cos((Math.PI / 180) * 12.5);
    this.outerCutoff = Math.cos((Math.PI / 180) * 17.5);
  }

  update() {
    this.direction = vec3.normalize(vec3.subtract(this.target, this.position));
    this.viewMatrix = mat4.lookAt(this.position, this.target, this.up);
    this.viewProjMatrix = mat4.multiply(this.projectionMatrix, this.viewMatrix);
    console.log('test light update this.position : ', this.position)
  }

  updateSceneUniforms = (sceneUniformBuffer, camera, inputHandler) => {

    console.log('test camera.view ', camera.view)
    // Update spotlight matrices
    this.update();

    const now = Date.now();

    // Get camera matrices
    camera.update(now, inputHandler()); // Your camera class should also update view/projection
    const camVP = mat4.multiply(camera.projectionMatrix, camera.view);

    // Prepare float data
    const sceneData = new Float32Array(16 + 16 + 4); // 2 matrices + vec3

    // Light view-proj matrix
    sceneData.set(this.viewProjMatrix, 0);

    // Camera view-proj matrix
    sceneData.set(camVP, 16);

    // Light position (vec3f + padding)
    sceneData.set(this.position, 32);

    // Write to GPU
    this.device.queue.writeBuffer(
      sceneUniformBuffer,
      0,
      sceneData.buffer,
      sceneData.byteOffset,
      sceneData.byteLength
    );

    console.log('light.viewProj[0..3]', this.viewProjMatrix.slice(0, 4));
    console.log('camera.vp[0..3]', camVP.slice(0, 4));
  }

  prepareBuffer(device) {
    this.device = device;
    this.spotlightUniformBuffer = device.createBuffer({
      size: 16 * 4, // 64 bytes
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    const spotlightData = this.getLightDataBuffer();

    device.queue.writeBuffer(
      this.spotlightUniformBuffer,
      0,
      spotlightData.buffer,
      spotlightData.byteOffset,
      spotlightData.byteLength
    );
  }

  getLightDataBuffer() {
    return new Float32Array([
      ...this.position, 0.0,
      ...this.direction, 0.0,
      this.innerCutoff,
      this.outerCutoff,
      0.0,
      0.0,
    ]);
  }
}
