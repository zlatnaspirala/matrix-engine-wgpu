import {mat4, vec3} from 'wgpu-matrix';
import {vertexShadowWGSL} from '../shaders/vertexShadow.wgsl';
import Behavior from './behavior';
import {vertexShadowWGSLInstanced} from '../shaders/instanced/vertexShadow.instanced.wgsl';
import {vertexMorphShadowWGSL, vertexMorphWGSL} from '../shaders/vertex.procedural.wgsl';
import {isMobile} from './utils';
import {MEConfig} from '../me-config';

/**
 * @description
 * Spot light with shadow cast.
 * Optimized: dirty-flag pattern for VP matrix and light buffer.
 * writeBuffer for lightVPBuffer is deferred — called from updateLights only when dirty.
 * @author Nikola Lukic
 * @email zlatnaspirala@gmail.com
 */
export class SpotLight {
  name;
  camera;
  inputHandler;
  // Backing fields for dirty-tracked properties
  _position;
  _target;
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

  // Dirty flags
  _dirty = true;            // VP matrix needs recompute (position/target changed)
  _lightBufferDirty = true; // _lightBuffer array needs rebuild before next upload

  // ─── Getters / Setters ────────────────────────────────────────────────────
  get position() {return this._position;}

  // set position(v) {
  //   vec3.copy(v, this._position);
  //   this._dirty = true;
  //   this._lightBufferDirty = true;
  // }

  setPosition(x, y, z) {
    this._position[0] = x;
    this._position[1] = y;
    this._position[2] = z;
    this._dirty = true;
    this._lightBufferDirty = true;
  }

  setPositionVec(v) {
    vec3.copy(v, this._position);
    this._dirty = true;
    this._lightBufferDirty = true;
  }

  get target() {return this._target;}

  setTargetVec(v) {
    vec3.copy(v, this._target);
    this._dirty = true;
    this._lightBufferDirty = true;
  }

  setTarget(x, y, z) {
    this._target[0] = x;
    this._target[1] = y;
    this._target[2] = z;
    this._dirty = true;
    this._lightBufferDirty = true;
  }

  setTargetX(x) {
    this._target[0] = x;
    this._dirty = true;
    this._lightBufferDirty = true;
  }

  setTargetY(y) {
    this._target[1] = y;
    this._dirty = true;
    this._lightBufferDirty = true;
  }

  setTargetZ(z) {
    this._target[2] = z;
    this._dirty = true;
    this._lightBufferDirty = true;
  }

  constructor(
    camera,
    inputHandler,
    device,
    indexx,
    shadowPassView = null,
    shadowSampler = null,
    fov = 45, aspect = 1.0, near = 0.1, far = 200) {

    aspect = 1;
    this.name = "light" + indexx;
    this.getName = () => {return "light" + indexx;};
    this.fov = fov;
    this.aspect = 1;
    this.near = near;
    this.far = far;

    this.lightDinamic = true;
    this.mainPassBindGroupContainer = {};

    this.camera = camera;
    this.inputHandler = inputHandler;

    // Use backing fields directly in constructor to avoid setter overhead
    // before scratch buffers exist
    this._position = vec3.create(0, 10, -20);
    this._target = vec3.create(0, 0, -20);
    this.up = vec3.create(0, 0, -1);

    this.direction = vec3.create();
    this.intensity = 1.0;
    this.color = vec3.create(1.0, 1.0, 1.0);

    this.viewMatrix = mat4.lookAt(this._position, this._target, this.up);
    this.projectionMatrix = mat4.perspective(
      (this.fov * Math.PI) / 180,
      this.aspect,
      this.near,
      this.far
    );

    this._lightBuffer = new Float32Array(36);
    this._diffScratch = vec3.create();
    this._dirScratch = vec3.create();
    this._viewMatrix = mat4.create();
    this._viewProjMatrix = mat4.create();

    // Start dirty so first frame always uploads
    this._dirty = true;
    this._lightBufferDirty = true;

    this.lightVPBuffer = device.createBuffer({
      label: 'lightVPBuffer_' + indexx,
      size: 144,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });

    this.setProjection = function(fov = (2 * Math.PI) / 5, aspect = 1.0, near = 0.1, far = 200) {
      this.projectionMatrix = mat4.perspective(fov, aspect, near, far);
      this._dirty = true;
    };

    this.updateProjection = function() {
      this.projectionMatrix = mat4.perspective(this.fov, this.aspect, this.near, this.far);
      this._dirty = true;
    };

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

    this.SHADOW_RES = MEConfig.SHADOW_RES;
    this.primitive = {
      topology: 'triangle-list',
      cullMode: 'back',
      frontFace: 'ccw'
    };

    this.shadowTextureView = shadowPassView;
    this.shadowSampler = shadowSampler;

    this.renderPassDescriptor = {
      label: "descriptor shadowPass[SpotLigth]",
      colorAttachments: [],
      depthStencilAttachment: {
        view: this.shadowTextureView,
        depthClearValue: 1.0,
        depthLoadOp: "clear",
        depthStoreOp: "store",
      },
    };

    this.uniformBufferBindGroupLayout = this.device.createBindGroupLayout({
      label: 'uniformBufferBindGroupLayout light',
      entries: [{binding: 0, visibility: GPUShaderStage.VERTEX, buffer: {type: 'uniform'}}],
    });

    this.shadowBindGroupContainer = {};
    this.shadowBindGroup = [];
    this.getShadowBindGroup = (mesh) => {
      if(this.shadowBindGroupContainer[mesh.name]) return this.shadowBindGroupContainer[mesh.name];
      this.shadowBindGroupContainer[mesh.name] = this.device.createBindGroup({
        label: 'sceneBindGroupForShadow light',
        layout: this.uniformBufferBindGroupLayout,
        entries: [{binding: 0, resource: {buffer: this.lightVPBuffer}}],
      });
      return this.shadowBindGroupContainer[mesh.name];
    };

    this.modelBindGroupLayout = this.device.createBindGroupLayout({
      label: 'modelBindGroupLayout light',
      entries: [
        {binding: 0, visibility: GPUShaderStage.VERTEX, buffer: {type: 'uniform'}},
        {binding: 1, visibility: GPUShaderStage.VERTEX, buffer: {type: 'uniform'}},
        {binding: 2, visibility: GPUShaderStage.VERTEX, buffer: {type: 'uniform'}},
        {binding: 3, visibility: GPUShaderStage.VERTEX, buffer: {type: 'uniform'}},
      ]
    });

    this.modelBindGroupLayoutInstanced = this.device.createBindGroupLayout({
      label: 'modelBindGroupLayout light [skinned][instanced]',
      entries: [
        {binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: {type: "read-only-storage"}},
        {binding: 1, visibility: GPUShaderStage.VERTEX, buffer: {type: 'uniform'}},
        {binding: 2, visibility: GPUShaderStage.VERTEX, buffer: {type: 'uniform'}},
        {binding: 3, visibility: GPUShaderStage.VERTEX, buffer: {type: 'uniform'}},
      ],
    });

    this.modelBindGroupLayoutMorph = this.device.createBindGroupLayout({
      label: 'modelBindGroupLayout light [morph]',
      entries: [
        {binding: 0, visibility: GPUShaderStage.VERTEX, buffer: {type: 'uniform'}}, // model
        {binding: 1, visibility: GPUShaderStage.VERTEX, buffer: {type: 'uniform'}}, // bones
        {binding: 2, visibility: GPUShaderStage.VERTEX, buffer: {type: 'uniform'}}, // vertexAnim
        {binding: 3, visibility: GPUShaderStage.VERTEX, buffer: {type: 'uniform'}}  // morphBlend
      ]
    });

    this.shadowPipeline = this.device.createRenderPipeline({
      label: 'shadowPipeline light',
      layout: this.device.createPipelineLayout({
        label: 'uniformBufferBindGroupLayout light[regular]',
        bindGroupLayouts: [
          this.uniformBufferBindGroupLayout,
          this.modelBindGroupLayout,
        ],
      }),
      vertex: {
        module: this.device.createShaderModule({code: vertexShadowWGSL}),
        buffers: [
          {arrayStride: 12, attributes: [{shaderLocation: 0, offset: 0, format: "float32x3"}]}, // pos
          {arrayStride: 12, attributes: [{shaderLocation: 1, offset: 0, format: "float32x3"}]}, // normal
          {arrayStride: 8, attributes: [{shaderLocation: 2, offset: 0, format: "float32x2"}]},  // uv
          {arrayStride: 16, attributes: [{shaderLocation: 3, offset: 0, format: "uint32x4"}]},  // joints
          {arrayStride: 16, attributes: [{shaderLocation: 4, offset: 0, format: "float32x4"}]}, // weights
        ]
      },
      depthStencil: {
        depthWriteEnabled: true,
        depthCompare: 'less',
        format: 'depth32float',
        depthBias: 1,
        depthBiasSlopeScale: 1,
        depthBiasClamp: 0
      },
      primitive: this.primitive,
    });

    this.shadowPipelineInstanced = this.device.createRenderPipeline({
      label: 'shadowPipeline [instanced]light',
      layout: this.device.createPipelineLayout({
        label: 'uniformBufferBindGroupLayout light[instanced]',
        bindGroupLayouts: [
          this.uniformBufferBindGroupLayout,
          this.modelBindGroupLayoutInstanced,
        ],
      }),
      vertex: {
        module: this.device.createShaderModule({code: vertexShadowWGSLInstanced}),
        buffers: [
          {arrayStride: 12, attributes: [{shaderLocation: 0, offset: 0, format: "float32x3"}]}, // pos
          {arrayStride: 12, attributes: [{shaderLocation: 1, offset: 0, format: "float32x3"}]}, // normal
          {arrayStride: 8, attributes: [{shaderLocation: 2, offset: 0, format: "float32x2"}]}, // uv
          {arrayStride: 16, attributes: [{shaderLocation: 3, offset: 0, format: "uint32x4"}]}, // joints
          {arrayStride: 16, attributes: [{shaderLocation: 4, offset: 0, format: "float32x4"}]}, // weights
        ]
      },
      depthStencil: {
        depthWriteEnabled: true,
        depthCompare: 'less',
        depthBias: 2,
        depthBiasSlopeScale: 2.0,
        format: 'depth32float',
        depthBiasClamp: 0
      },
      primitive: this.primitive,
    });

    this.shadowPipelineMorph = this.device.createRenderPipeline({
      label: 'shadowPipeline light [MORPH]',
      layout: this.device.createPipelineLayout({
        label: 'pipelineLayout light [morph]',
        bindGroupLayouts: [
          this.uniformBufferBindGroupLayout,
          this.modelBindGroupLayoutMorph,
        ],
      }),
      vertex: {
        module: this.device.createShaderModule({code: vertexMorphShadowWGSL}),
        buffers: [
          {arrayStride: 12, attributes: [{shaderLocation: 0, offset: 0, format: "float32x3"}]}, // posA
          {arrayStride: 12, attributes: [{shaderLocation: 1, offset: 0, format: "float32x3"}]}, // nrmA
          {arrayStride: 8, attributes: [{shaderLocation: 2, offset: 0, format: "float32x2"}]}, // uv
          {arrayStride: 12, attributes: [{shaderLocation: 6, offset: 0, format: "float32x3"}]}, // posB
          {arrayStride: 12, attributes: [{shaderLocation: 7, offset: 0, format: "float32x3"}]}, // nrmB
        ]
      },
      depthStencil: {
        depthWriteEnabled: true,
        depthCompare: 'less',
        format: 'depth32float',
        depthBias: 0,
        depthBiasSlopeScale: 0,
        depthBiasClamp: 0
      },
      primitive: this.primitive,
    });

    this.getMainPassBindGroup = function(mesh) {
      const key = mesh.name;
      if(this.mainPassBindGroupContainer[key]) return this.mainPassBindGroupContainer[key];
      this.mainPassBindGroupContainer[key] = this.device.createBindGroup({
        label: 'mainPassBindGroup for mesh',
        layout: mesh.mainPassBindGroupLayout,
        entries: [
          {binding: 0, resource: this.shadowTextureView},
          {binding: 1, resource: this.shadowSampler},
        ],
      });
      return this.mainPassBindGroupContainer[key];
    };

    this.behavior = new Behavior();
    this.updater = [];
  }

  // ─── Update ───────────────────────────────────────────────────────────────

  /**
   * Recomputes VP matrix only when dirty.
   * Does NOT call writeBuffer — that is batched in updateLights().
   * Returns true if the VP matrix was recomputed (caller should re-upload lightVPBuffer).
   */
  update() {
    // Run behavior animators — these call setters which mark _dirty
    this.updater.forEach((func) => {func(this);});
    if(!this._dirty) return false;
    vec3.subtract(this._target, this._position, this._diffScratch);
    vec3.normalize(this._diffScratch, this.direction);
    mat4.lookAt(this._position, this._target, this.up, this._viewMatrix);
    mat4.multiply(this.projectionMatrix, this._viewMatrix, this.viewProjMatrix);
    this._dirty = false;
    this._lightBufferDirty = true;
    return true;
  }

  // ─── Light data buffer ────────────────────────────────────────────────────

  /**
   * Returns the packed Float32Array for the spotlight uniform array.
   * Rebuilds only when _lightBufferDirty is true.
   */
  getLightDataBuffer() {
    if(!this._lightBufferDirty) return this._lightBuffer;

    const m = this.viewProjMatrix;
    const b = this._lightBuffer;
    b.set(this._position, 0);
    b[3] = 0.0;
    b.set(this.direction, 4);
    b[7] = 0.0;
    b[8] = this.innerCutoff;
    b[9] = this.outerCutoff;
    b[10] = this.intensity;
    b[11] = 0.0;
    b.set(this.color, 12);
    b[15] = 0.0;
    b[16] = this.range;
    b[17] = this.ambientFactor;
    b[18] = this.shadowBias;
    b[19] = 0.0;
    b.set(m, 20);

    this._lightBufferDirty = false;
    return b;
  }

  // ─── Setters ──────────────────────────────────────────────────────────────
  // Position components — mutate vec3 in place, mark both dirty flags

  setPosX = (x) => {
    if(this._position[0] === x) return;
    this._position[0] = x;
    this._dirty = true;
    this._lightBufferDirty = true;
  }

  setPosY = (y) => {
    if(this._position[1] === y) return;
    this._position[1] = y;
    this._dirty = true;
    this._lightBufferDirty = true;
  }

  setPosZ = (z) => {
    if(this._position[2] === z) return;
    this._position[2] = z;
    this._dirty = true;
    this._lightBufferDirty = true;
  }

  // These only affect the light buffer, not the VP matrix
  setInnerCutoff = (innerCutoff) => {
    this.innerCutoff = innerCutoff;
    this._lightBufferDirty = true;
  };
  setOuterCutoff = (outerCutoff) => {
    this.outerCutoff = outerCutoff;
    this._lightBufferDirty = true;
  };
  setIntensity = (intensity) => {
    this.intensity = intensity;
    this._lightBufferDirty = true;
  };
  setColor = (color) => {
    this.color = color;
    this._lightBufferDirty = true;
  };
  setColorR = (colorR) => {
    this.color[0] = colorR;
    this._lightBufferDirty = true;
  };
  setColorB = (colorB) => {
    this.color[1] = colorB;
    this._lightBufferDirty = true;
  };
  setColorG = (colorG) => {
    this.color[2] = colorG;
    this._lightBufferDirty = true;
  };
  setRange = (range) => {
    this.range = range;
    this._lightBufferDirty = true;
  };
  setAmbientFactor = (ambientFactor) => {
    this.ambientFactor = ambientFactor;
    this._lightBufferDirty = true;
  };
  setShadowBias = (shadowBias) => {
    this.shadowBias = shadowBias;
    this._lightBufferDirty = true;
  };
}