import {mat4, vec3} from 'wgpu-matrix';
import {vertexShadowWGSL} from '../shaders/vertexShadow.wgsl';
import Behavior from './behavior';
import {vertexShadowWGSLInstanced} from '../shaders/instanced/vertexShadow.instanced.wgsl';
import {randomIntFromTo} from './utils';

/**
 * @description
 * Spot light with shodow cast.
 * @author Nikola Lukic
 * @email zlatnaspirala@gmail.com
 */
export class SpotLight {
  name;
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
    indexx,
    position = vec3.create(0, 10, -20),
    target = vec3.create(0, 0, -20),
    fov = 45, aspect = 1.0, near = 0.1, far = 200) {

    aspect = 1; //hot fix
    this.name = "light" + indexx;
    this.getName = () => {return "light" + indexx};
    this.fov = fov;
    this.aspect = 1;
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

    this.innerCutoff = Math.cos((Math.PI / 180) * 20.0);
    this.outerCutoff = Math.cos((Math.PI / 180) * 30.0);

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
      return this.shadowBindGroup[index];
    }

    this.modelBindGroupLayout = this.device.createBindGroupLayout({
      label: 'modelBindGroupLayout in light [one bindings]',
      entries: [
        {binding: 0, visibility: GPUShaderStage.VERTEX, buffer: {type: 'uniform'}},
        {binding: 1, visibility: GPUShaderStage.VERTEX, buffer: {type: 'uniform', }}
      ]
    });

    this.modelBindGroupLayoutInstanced = this.device.createBindGroupLayout({
      label: 'modelBindGroupLayout in light [for skinned] [instanced]',
      entries: [
        {binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: {type: "read-only-storage"}},
        {binding: 1, visibility: GPUShaderStage.VERTEX, buffer: {type: 'uniform'}, },
      ],
    });

    this.shadowPipeline = this.device.createRenderPipeline({
      label: 'shadowPipeline per light',
      layout: this.device.createPipelineLayout({
        label: 'createPipelineLayout - uniformBufferBindGroupLayout light [regular]',
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

    this.shadowPipelineInstanced = this.device.createRenderPipeline({
      label: 'shadowPipeline [instanced] per light',
      layout: this.device.createPipelineLayout({
        label: 'createPipelineLayout - uniformBufferBindGroupLayout light [instanced]',
        bindGroupLayouts: [
          this.uniformBufferBindGroupLayout,
          this.modelBindGroupLayoutInstanced,
        ],
      }),
      vertex: {
        module: this.device.createShaderModule({
          code: vertexShadowWGSLInstanced,
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
        depthBias: 2,              // Constant bias (try 1-4)
        depthBiasSlopeScale: 2.0,
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
      this.shadowBias,
      0.0,
      ...m
    ]);
  }

  // Setters
  setPosX = (x) => {
    this.position[0] = x;
  }
  setPosY = (y) => {
    this.position[1] = y;
  }
  setPosZ = (z) => {
    this.position[2] = z;
  }
  setInnerCutoff = (innerCutoff) => {
    this.innerCutoff = innerCutoff;
  }
  setOuterCutoff = (outerCutoff) => {
    this.outerCutoff = outerCutoff;
  }
  setIntensity = (intensity) => {
    this.intensity = intensity;
  }
  setColor = (color) => {
    this.color = color;
  }
  setColorR = (colorR) => {
    this.color[0] = colorR;
  }
  setColorB = (colorB) => {
    this.color[1] = colorB;
  }
  setColorG = (colorG) => {
    this.color[2] = colorG;
  }
  setRange = (range) => {
    this.range = range;
  }
  setAmbientFactor = (ambientFactor) => {
    this.ambientFactor = ambientFactor;
  }
  setShadowBias = (shadowBias) => {
    this.shadowBias = shadowBias;
  }

}