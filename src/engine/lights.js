import {mat4, vec3} from 'wgpu-matrix';

export class SpotLight {
  // injected
  camera;
  inputHandler;

  // Light
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
    camera,
    inputHandler,
    position = vec3.create(0, 5, -10),
    target = vec3.create(0, 0, 0),
    fov = 45,
    aspect = 1.0,
    near = 0.1,
    far = 200
  ) {
    this.camera = camera;
    this.inputHandler = inputHandler;

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
    // this.direction = vec3.normalize(vec3.subtract(this.target, this.position));
    // this.viewMatrix = mat4.lookAt(this.position, this.target, this.up);
    // this.viewProjMatrix = mat4.multiply(this.projectionMatrix, this.viewMatrix);
    // console.log('test light update this.target : ', this.target)
    // Use the existing direction
    const target = vec3.add(this.position, this.direction);
    this.viewMatrix = mat4.lookAt(this.position, target, this.up);
    this.viewProjMatrix = mat4.multiply(this.projectionMatrix, this.viewMatrix);
  }

  updateSceneUniforms(mainRenderBundle) {
    const now = Date.now();
    // First frame safety
    let dt = (now - this.lastFrameMS) / 1000;
    if(!this.lastFrameMS) {dt = 16;}
    this.lastFrameMS = now;
    // engine, once per frame
    this.camera.update(dt, this.inputHandler());
    const camVP = mat4.multiply(this.camera.projectionMatrix, this.camera.view); // P * V

    for(const mesh of mainRenderBundle) {
      // scene buffer layout = 0..63 lightVP, 64..127 camVP, 128..143 lightPos(+pad)
      this.device.queue.writeBuffer(
        mesh.sceneUniformBuffer,
        64, // cameraViewProjMatrix offset
        camVP.buffer,
        camVP.byteOffset,
        camVP.byteLength
      );
    }
    // const camVP = mat4.multiply(camera.projectionMatrix, camera.view);
    // const sceneData = new Float32Array(36); // 16 + 16 + 4
    // sceneData.set(this.viewProjMatrix, 0);
    // sceneData.set(camVP, 16);
    // sceneData.set(this.position, 32);
    // if(!this.device) {
    //   console.warn("Device not set for SpotLight");
    //   return;
    // }
    // this.device.queue.writeBuffer(
    //   sceneUniformBuffer,
    //   // this.spotlightUniformBuffer,
    //   0,
    //   sceneData.buffer,
    //   sceneData.byteOffset,
    //   sceneData.byteLength
    // );
  }

  prepareBuffer(device) {
    if(!this.device) this.device = device;
    this.spotlightUniformBuffer = this.device.createBuffer({
      size: 16 * 4, // 64 bytes
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    const spotlightData = this.getLightDataBuffer();
    this.device.queue.writeBuffer(
      this.spotlightUniformBuffer,
      0,
      spotlightData.buffer,
      spotlightData.byteOffset,
      spotlightData.byteLength
    );
  }

  updateLightBuffer() {
    if(!this.device || !this.spotlightUniformBuffer) {return;}
    const spotlightData = this.getLightDataBuffer();
    this.device.queue.writeBuffer(
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