import MatrixEngineGPUCreateBuffers from "./buffers.js";
import {cubeTexShader, shaderSrc} from "../shaders/shaders.js";
import MatrixEngineGPUTextures from "./textures.js";
import MatrixEngineGPURender from "./render.js";
import MECubeTexPipline from "./pipline.js";

export default class MatrixEngineGPUEngine {

  name = "MatrixEngineWGPU WebGPU Powered PWA Application - MIT LICENCE";
  author = "zlatnaspirala@";
  version = "1.0.0";
  adapter = null;
  device = null;
  systemScene = [];

  constructor() {
    this.loadwebGPUContext().then(() => {
      // load simple cube
      this.main();
    });

    this.systemScene = [];
  }

  async addCubeTex() {
    const moduleCubeTex = this.device.createShaderModule({code: cubeTexShader})
    const piplineCubeTex = new MECubeTexPipline(this.device, this.presentationFormat, moduleCubeTex, this.context, this.canvas);

    const texture = await this.textureManager.createTextureFromImage(this.device,
      './res/textures/tex1.jpg', {mips: true, flipY: false});

    const sampler = this.device.createSampler({
      magFilter: 'linear',
      minFilter: 'linear',
      mipmapFilter: 'linear',
    });
    piplineCubeTex.loadObjProgram(this.device, this.buffersManager, sampler, texture)

    this.systemScene.push(piplineCubeTex)
  }

  main() {
    this.buffersManager = new MatrixEngineGPUCreateBuffers(this.device);
    this.textureManager = new MatrixEngineGPUTextures(this.device);
    this.shaderModule = this.device.createShaderModule({code: shaderSrc});
    this.createPipline();
    this.render = new MatrixEngineGPURender(this)
  }

  loadwebGPUContext() {
    return new Promise(async (resolve, reject) => {
      this.adapter = await navigator.gpu?.requestAdapter();
      this.device = await this.adapter?.requestDevice();
      if(!this.device) {
        fail("need a browser that supports WebGPU");
        reject();
        return;
      }
      this.canvas = document.querySelector("canvas") ||
        (() => {
          let canvasDom = document.createElement("canvas");
          canvasDom.id = "matrix-engine-wgpu";
          canvasDom.width = window.innerWidth;
          canvasDom.height = window.innerHeight;
          document.body.append(canvasDom);
          return canvasDom;
        })();

      // Oyee
      this.context = this.canvas.getContext("webgpu");

      this.presentationFormat = navigator.gpu.getPreferredCanvasFormat(this.adapter);

      this.context.configure({
        device: this.device,
        format: this.presentationFormat,
        alphaMode: 'premultiplied'
      });

      this.canvasInfo = {
        canvas: this.canvas,
        presentationFormat: this.presentationFormat,
        // these are filled out in resizeToDisplaySize
        renderTarget: undefined,
        renderTargetView: undefined,
        depthTexture: undefined,
        depthTextureView: undefined,
        sampleCount: 4, // can be 1 or 4
      };

      resolve();
    });
  }

  createPipline() {
    var shaderModule = this.shaderModule;
    this.pipeline = this.device.createRenderPipeline({
      layout: "auto",
      vertex: {
        module: shaderModule,
        entryPoint: "myVSMain",
        buffers: [
          // position
          {
            arrayStride: 3 * 4, // 3 floats, 4 bytes each
            attributes: [{shaderLocation: 0, offset: 0, format: "float32x3"}],
          },
          // normals
          {
            arrayStride: 3 * 4, // 3 floats, 4 bytes each
            attributes: [{shaderLocation: 1, offset: 0, format: "float32x3"}],
          },
          // texcoords
          {
            arrayStride: 2 * 4, // 2 floats, 4 bytes each
            attributes: [{shaderLocation: 2, offset: 0, format: "float32x2"}],
          },
        ],
      },
      fragment: {
        module: this.shaderModule,
        entryPoint: "myFSMain",
        targets: [{format: this.presentationFormat}],
      },
      primitive: {
        topology: "triangle-list",
        cullMode: "back",
      },
      depthStencil: {
        depthWriteEnabled: true,
        depthCompare: "less",
        format: "depth24plus",
      },
      ...(this.canvasInfo.sampleCount > 1 && {
        multisample: {
          count: this.canvasInfo.sampleCount,
        },
      }),
    });

    this.createPP();
  }

  createPP() {
    const vUniformBufferSize = 2 * 16 * 4; // 2 mat4s * 16 floats per mat * 4 bytes per float
    const fUniformBufferSize = 3 * 4; // 1 vec3 * 3 floats per vec3 * 4 bytes per float

    this.vsUniformBuffer = this.device.createBuffer({
      size: Math.max(16, vUniformBufferSize),
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    this.fsUniformBuffer = this.device.createBuffer({
      size: Math.max(16, fUniformBufferSize),
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    this.vsUniformValues = new Float32Array(2 * 16); // 2 mat4s
    this.worldViewProjection = this.vsUniformValues.subarray(0, 16);
    this.worldInverseTranspose = this.vsUniformValues.subarray(16, 32);
    this.fsUniformValues = new Float32Array(3); // 1 vec3
    this.lightDirection = this.fsUniformValues.subarray(0, 3);

    console.log("test this.textureManager.sampler ", this.textureManager.sampler);

    this.bindGroup = this.device.createBindGroup({
      layout: this.pipeline.getBindGroupLayout(0),
      entries: [
        {binding: 0, resource: {buffer: this.vsUniformBuffer}},
        {binding: 1, resource: {buffer: this.fsUniformBuffer}},
        {binding: 2, resource: this.textureManager.sampler},
        {binding: 3, resource: this.textureManager.tex.createView()},
      ],
    });

    this.renderPassDescriptor = {
      colorAttachments: [
        {
          // view: undefined, // Assigned later
          // resolveTarget: undefined, // Assigned Later
          clearValue: {r: 0.5, g: 0.5, b: 0.5, a: 1.0},
          loadOp: "clear",
          storeOp: "store",
        },
      ],
      depthStencilAttachment: {
        // view: undefined,  // Assigned later
        depthClearValue: 1,
        depthLoadOp: "clear",
        depthStoreOp: "store",
      },
    };
  }

}
