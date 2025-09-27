import {mat4, vec3} from 'wgpu-matrix';
import {vertexShadowWGSL} from '../shaders/vertexShadow.wgsl';
import Behavior from './behavior';

/**
 * @description
 * Spot light with shodow cast.
 * @author Nikola Lukic
 * @email zlatnaspirala@gmail.com
 */
export class SpotLight {
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
    position = vec3.create(0, 10, -20),
    target = vec3.create(0, 0, -20),
    fov = 45, aspect = 1.0, near = 0.1, far = 200) {

    this.fov = fov;
    this.aspect = aspect;
    this.near = near;
    this.far = far;

    this.camera = camera;
    this.inputHandler = inputHandler;
    this.position = position;
    this.target = target;
    this.up = vec3.create(0, 0, -1);
    this.direction = vec3.normalize(vec3.subtract(target, position));
    this.intensity = 1.0;
    this.color = vec3.create(1.0, 1.0, 1.0); // white

    this.viewMatrix = mat4.lookAt(position, target, this.up);
    this.projectionMatrix = mat4.perspective(
      (this.fov * Math.PI) / 180,
      this.aspect,
      this.near,
      this.far
    );

    this.setProjection = function(fov = (2 * Math.PI) / 5, aspect = 1.0, near = 0.1, far = 200) {
      this.projectionMatrix = mat4.perspective(fov, aspect, near, far);
    }

    this.updateProjection = function() {
      this.projectionMatrix = mat4.perspective(this.fov, this.aspect, this.near, this.far);
    }

    this.device = device;
    this.viewProjMatrix = mat4.multiply(this.projectionMatrix, this.viewMatrix);

    this.fov = fov;
    this.aspect = aspect;
    this.near = near;
    this.far = far;

    this.innerCutoff = Math.cos((Math.PI / 180) * 12.5);
    this.outerCutoff = Math.cos((Math.PI / 180) * 17.5);

    this.ambientFactor = 0.5;
    this.range = 20.0;
    this.shadowBias = 0.01;

    this.SHADOW_RES = 1024;
    this.primitive = {
      topology: 'triangle-list',
      cullMode: 'back', // for front interest border drawen shadows !
      frontFace: 'ccw'
    }

    this.shadowTexture = this.device.createTexture({
      label: 'shadowTexture[light]',
      size: [this.SHADOW_RES, this.SHADOW_RES, 1],
      format: "depth32float",
      usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
    });

    this.shadowSampler = device.createSampler({
      label: 'shadowSampler[light]',
      compare: 'less',
      magFilter: 'linear',
      minFilter: 'linear',
    });

    this.renderPassDescriptor = {
      label: "renderPassDescriptor shadowPass [per SpotLigth]",
      colorAttachments: [],
      depthStencilAttachment: {
        view: this.shadowTexture.createView(),
        depthClearValue: 1.0,
        depthLoadOp: "clear",
        depthStoreOp: "store",
      },
    }

    this.uniformBufferBindGroupLayout = this.device.createBindGroupLayout({
      label: 'uniformBufferBindGroupLayout in light',
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
    this.shadowBindGroup = [];

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

    // test
    this.getShadowBindGroup_bones = (index) => {

      if(this.shadowBindGroup[index]) {
        return this.shadowBindGroup[index];
      }

      this.modelUniformBuffer = this.device.createBuffer({
        size: 4 * 16, // 4x4 matrix
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
      });

      this.shadowBindGroup[index] = this.device.createBindGroup({
        label: 'model BindGroupForShadow in light',
        layout: this.uniformBufferBindGroupLayout,
        entries: [
          {
            binding: 0,
            resource: {
              buffer: this.modelUniformBuffer,
            },
          },
        ],
      });
      return this.shadowBindGroupContainer[index];
    }

    this.modelBindGroupLayout = this.device.createBindGroupLayout({
      label: 'modelBindGroupLayout in light [one bindings]',
      entries: [{binding: 0, visibility: GPUShaderStage.VERTEX, buffer: {type: 'uniform'}, },]
    });

    this.shadowPipeline = this.device.createRenderPipeline({
      label: 'shadowPipeline per light',
      layout: this.device.createPipelineLayout({
        label: 'createPipelineLayout - uniformBufferBindGroupLayout light',
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

    // Only osc values +-
    this.behavior = new Behavior();

    // put here only func
    this.updater = [];
  }

  update() {
    this.updater.forEach((update) => {update(this)})
    this.direction = vec3.normalize(vec3.subtract(this.target, this.position));
    const target = vec3.add(this.position, this.direction);
    this.viewMatrix = mat4.lookAt(this.position, target, this.up);
    this.viewProjMatrix = mat4.multiply(this.projectionMatrix, this.viewMatrix);
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