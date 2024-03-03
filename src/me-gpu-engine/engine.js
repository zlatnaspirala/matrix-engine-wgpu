import MatrixEngineGPUCreateBuffers from "./buffers.js";
import {cubeTexShader, shaderSrc} from "../shaders/shaders.js";
import MatrixEngineGPUTextures from "./textures.js";
import MatrixEngineGPURender from "./render.js";
import MECubeTexPipline from "./pipline.js";
import MECubeTexPipline2 from "./pipline2.js";

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

  async addCubeTex(options) {
    
    if (typeof options === 'undefined') {
      var options = {
        scale: 1
      }
    }

    const moduleCubeTex = this.device.createShaderModule({code: cubeTexShader})
    const piplineCubeTex = new MECubeTexPipline(this.device, this.presentationFormat, moduleCubeTex, this.context, this.canvas, options);

    const texture = await this.textureManager.createTextureFromImage(this.device,
      './res/textures/tex1.jpg', {mips: false, flipY: false});

    const sampler = this.device.createSampler({
      magFilter: 'linear',
      minFilter: 'linear',
      mipmapFilter: 'linear',
    });
    piplineCubeTex.loadObjProgram(this.device, this.buffersManager, sampler, texture)

    this.systemScene.push(piplineCubeTex)
  }

  async addCubeTex2(options) {

    if (typeof options === 'undefined') {
      var options = {
        scale: 1
      }
    }
    const piplineCubeTex = new MECubeTexPipline2(this.device, this.presentationFormat, this.context, this.canvas, options);

    this.systemScene.push(piplineCubeTex)
  }

  main() {
    this.buffersManager = new MatrixEngineGPUCreateBuffers(this.device);
    this.textureManager = new MatrixEngineGPUTextures(this.device);

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


}
