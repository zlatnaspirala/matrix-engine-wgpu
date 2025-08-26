import {mat4, vec3} from 'wgpu-matrix';
import {vertexShadowWGSL} from '../shaders/vertexShadow.wgsl';
export class SpotLight {
  // injected
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

  constructor(
    camera,
    inputHandler,
    device,
    position = vec3.create(0, 5, -20),
    target = vec3.create(0, 0, -20),
    fov = 45, aspect = 1.0, near = 0.1, far = 200) {
    this.camera = camera;
    this.inputHandler = inputHandler;

    this.position = position;
    this.target = target;
    this.up = vec3.create(0, 1, 0);
    this.direction = vec3.normalize(vec3.subtract(target, position));
    this.intensity = 1.0;
    this.color = vec3.create(1.0, 1.0, 1.0); // white

    this.viewMatrix = mat4.lookAt(position, target, this.up);
    this.projectionMatrix = mat4.perspective(
      (fov * Math.PI) / 180,
      aspect,
      near,
      far
    );

    this.device = device;
    this.viewProjMatrix = mat4.multiply(this.projectionMatrix, this.viewMatrix);

    this.fov = fov;
    this.aspect = aspect;
    this.near = near;
    this.far = far;

    this.innerCutoff = Math.cos((Math.PI / 180) * 12.5);
    this.outerCutoff = Math.cos((Math.PI / 180) * 17.5);

    this.ambientFactor = 0.5;
    this.range = 200.0;
    this.shadowBias = 0.01;

    this.SHADOW_RES = 1024;
    this.primitive = {
      topology: 'triangle-list',
      cullMode: 'back', // typical for shadow passes
      frontFace: 'ccw'
    }

    this.shadowTexture = this.device.createTexture({
      label: 'shadowTexture[light]',
      size: [this.SHADOW_RES, this.SHADOW_RES, 1],
      format: "depth32float",
      usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
    });

    this.shadowSampler = device.createSampler({
      compare: 'less',
      magFilter: 'linear',
      minFilter: 'linear',
    });

    this.renderPassDescriptor = {
      label: "shadowPass per ligth.",
      colorAttachments: [],
      depthStencilAttachment: {
        view: this.shadowTexture.createView(),
        depthClearValue: 1.0,
        depthLoadOp: "clear",
        depthStoreOp: "store",
      },
    }

    this.uniformBufferBindGroupLayout = this.device.createBindGroupLayout({
      label: 'modelBindGroup in light',
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.VERTEX,
          buffer: {
            type: 'uniform',
          },
        },
      ],
    });

    this.shadowBindGroupContainer = [];

    this.getShadowBindGroup = (mesh, index) => {

      if(this.shadowBindGroupContainer[index]) {
        return this.shadowBindGroupContainer[index];
      }

      this.shadowBindGroupContainer[index] = this.device.createBindGroup({
        label: 'sceneBindGroupForShadow in light',
        layout: this.uniformBufferBindGroupLayout,
        entries: [
          {
            binding: 0,
            resource: {
              buffer: mesh.sceneUniformBuffer,
            },
          },
        ],
      });

      return this.shadowBindGroupContainer[index];

    }

    this.modelBindGroupLayout = this.device.createBindGroupLayout({entries: [{binding: 0, visibility: GPUShaderStage.VERTEX, buffer: {type: 'uniform'}, },], });

    this.shadowPipeline = this.device.createRenderPipeline({
      label: 'shadowPipeline per light',
      layout: this.device.createPipelineLayout({
        label: 'createPipelineLayout - uniformBufferBindGroupLayout',
        bindGroupLayouts: [
          this.uniformBufferBindGroupLayout,
          this.modelBindGroupLayout,
        ],
      }),
      vertex: {
        module: this.device.createShaderModule({
          code: vertexShadowWGSL,
        }),
        buffers: [
          {
            arrayStride: 12, // 3 * 4 bytes (vec3f)
            attributes: [
              {
                shaderLocation: 0, // must match @location(0) in vertex shader
                offset: 0,
                format: "float32x3",
              },
            ],
          },
        ]
      },
      depthStencil: {
        depthWriteEnabled: true,
        depthCompare: 'less',
        format: 'depth32float',
      },
      primitive: this.primitive,
    });

    this.getMainPassBindGroup = function(mesh) {
      // You can cache it per mesh to avoid recreating each frame
      if(!this.mainPassBindGroupContainer) this.mainPassBindGroupContainer = [];
      const index = mesh._lightBindGroupIndex || 0; // assign unique per mesh if needed

      if(this.mainPassBindGroupContainer[index]) {
        return this.mainPassBindGroupContainer[index];
      }

      this.mainPassBindGroupContainer[index] = this.device.createBindGroup({
        label: `mainPassBindGroup for mesh`,
        layout: mesh.mainPassBindGroupLayout, // this should match the pipeline
        entries: [
          {
            binding: 0, // must match @binding in shader for shadow texture
            resource: this.shadowTexture.createView(),
          },
          {
            binding: 1, // must match @binding in shader for shadow sampler
            resource: this.shadowSampler,
          },
        ],
      });

      return this.mainPassBindGroupContainer[index];
    }
  }

  update() {

    //  this.target = vec3.create(x, y, z);              // new target
    this.direction = vec3.normalize(vec3.subtract(this.target, this.position));

    const target = vec3.add(this.position, this.direction);
    this.viewMatrix = mat4.lookAt(this.position, target, this.up);
    this.viewProjMatrix = mat4.multiply(this.projectionMatrix, this.viewMatrix);
  }

  updateSceneUniforms(mainRenderBundle) {
    const now = Date.now();
    // First frame safety
    let dt = (now - this.lastFrameMS) / 1000;
    if(!this.lastFrameMS) {dt = 1000;}
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
  }

  getLightDataBuffer() {
    const m = this.viewProjMatrix;
    return new Float32Array([
      ...this.position, 0.0,
      ...this.direction, 0.0,
      this.innerCutoff,
      this.outerCutoff,
      this.intensity,
      0.0,
      ...this.color,
      0.0,
      this.range,
      this.ambientFactor,
      this.shadowBias,  // <<--- use shadowBias
      0.0,              // keep padding
      ...m
    ]);
  }
}