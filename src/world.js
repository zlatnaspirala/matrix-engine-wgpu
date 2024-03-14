import {vec3} from "wgpu-matrix";
import MEBall from "./engine/ball.js";
import MECube from './engine/cube.js';
import {ArcballCamera, WASDCamera} from "./engine/engine.js";
import MEMesh from "./engine/mesh.js";
import MEMeshObj from "./engine/mesh-obj.js";

export default class MatrixEngineWGPU {

  mainRenderBundle = [];
  rbContainer = [];
  frame = () => {};

  entityHolder = [];

  entityArgPass = {
    loadOp: 'clear',
    storeOp: 'store',
    depthLoadOp: 'clear',
    depthStoreOp: 'store'
  }

  // The input handler
  constructor(options, callback) {
    // console.log('typeof options ', typeof options )
    if(typeof options == 'undefined' || typeof options == "function") {
      this.options = {
        useSingleRenderPass: true,
        canvasSize: 'fullscreen',
        mainCameraParams: {
          type: 'WASD',
          responseCoef: 2000
        }
      }
      callback = options;
    }
    if(typeof options.mainCameraParams === 'undefined') {
      options.mainCameraParams = {
        type: 'WASD',
        responseCoef: 2000
      }
    }
    this.options = options;

    this.mainCameraParams = options.mainCameraParams;

    var canvas = document.createElement('canvas')
    if(this.options.canvasSize == 'fullscreen') {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    } else {
      canvas.width = this.options.canvasSize.w;
      canvas.height = this.options.canvasSize.h;
    }
    document.body.append(canvas)

    // The camera types
    const initialCameraPosition = vec3.create(0, 0, 0);
    // console.log('passed : o.mainCameraParams.responseCoef ', o.mainCameraParams.responseCoef)
    this.mainCameraParams = {
      type: this.options.mainCameraParams.type,
      responseCoef: this.options.mainCameraParams.responseCoef
    }

    this.cameras = {
      arcball: new ArcballCamera({position: initialCameraPosition}),
      WASD: new WASDCamera({position: initialCameraPosition}),
    };

    this.init({canvas, callback})
  }

  init = async ({canvas, callback}) => {
    this.canvas = canvas;
    this.adapter = await navigator.gpu.requestAdapter();
    this.device = await this.adapter.requestDevice();
    this.context = canvas.getContext('webgpu');

    const devicePixelRatio = window.devicePixelRatio;
    canvas.width = canvas.clientWidth * devicePixelRatio;
    canvas.height = canvas.clientHeight * devicePixelRatio;
    const presentationFormat = navigator.gpu.getPreferredCanvasFormat();

    this.context.configure({
      device: this.device,
      format: presentationFormat,
      alphaMode: 'premultiplied',
    });

    if(this.options.useSingleRenderPass == true) {
      this.makeDefaultRenderPassDescriptor()
      this.frame = this.frameSinglePass;
    } else {
      // must be
      this.frame = this.framePassPerObject;
    }

    this.run(callback)
  };

  makeDefaultRenderPassDescriptor = () => {

    this.depthTexture = this.device.createTexture({
      size: [this.canvas.width, this.canvas.height],
      format: 'depth24plus',
      usage: GPUTextureUsage.RENDER_ATTACHMENT,
    });

    this.renderPassDescriptor = {
      colorAttachments: [
        {
          view: undefined,
          clearValue: {r: 0.0, g: 0.0, b: 0.0, a: 1.0},
          loadOp: 'clear',
          storeOp: 'store',
        },
      ],
      depthStencilAttachment: {
        view: this.depthTexture.createView(),
        depthClearValue: 1.0,
        depthLoadOp: 'clear',
        depthStoreOp: 'store',
      },
    };
  }

  addCube = (o) => {
    if(typeof o === 'undefined') {
      var o = {
        scale: 1,
        position: {x: 0, y: 0, z: -4},
        texturesPaths: ['./res/textures/default.png'],
        rotation: {x: 0, y: 0, z: 0},
        rotationSpeed: {x: 0, y: 0, z: 0},
        entityArgPass: this.entityArgPass,
        cameras: this.cameras,
        mainCameraParams: this.mainCameraParams
      }
    } else {
      if(typeof o.position === 'undefined') {o.position = {x: 0, y: 0, z: -4}}
      if(typeof o.rotation === 'undefined') {o.rotation = {x: 0, y: 0, z: 0}}
      if(typeof o.rotationSpeed === 'undefined') {o.rotationSpeed = {x: 0, y: 0, z: 0}}
      if(typeof o.texturesPaths === 'undefined') {o.texturesPaths = ['./res/textures/default.png']}
      if(typeof o.scale === 'undefined') {o.scale = 1;}
      if(typeof o.mainCameraParams === 'undefined') {o.mainCameraParams = this.mainCameraParams}
      o.entityArgPass = this.entityArgPass;
      o.cameras = this.cameras;
    }
    let myCube1 = new MECube(this.canvas, this.device, this.context, o)
    this.mainRenderBundle.push(myCube1);
  }

  addBall = (o) => {
    if(typeof o === 'undefined') {
      var o = {
        scale: 1,
        position: {x: 0, y: 0, z: -4},
        texturesPaths: ['./res/textures/default.png'],
        rotation: {x: 0, y: 0, z: 0},
        rotationSpeed: {x: 0, y: 0, z: 0},
        entityArgPass: this.entityArgPass,
        cameras: this.cameras,
        mainCameraParams: this.mainCameraParams
      }
    } else {
      if(typeof o.position === 'undefined') {o.position = {x: 0, y: 0, z: -4}}
      if(typeof o.rotation === 'undefined') {o.rotation = {x: 0, y: 0, z: 0}}
      if(typeof o.rotationSpeed === 'undefined') {o.rotationSpeed = {x: 0, y: 0, z: 0}}
      if(typeof o.texturesPaths === 'undefined') {o.texturesPaths = ['./res/textures/default.png']}
      if(typeof o.mainCameraParams === 'undefined') {o.mainCameraParams = this.mainCameraParams}
      if(typeof o.scale === 'undefined') {o.scale = 1;}
      o.entityArgPass = this.entityArgPass;
      o.cameras = this.cameras;
    }
    let myBall1 = new MEBall(this.canvas, this.device, this.context, o)
    this.mainRenderBundle.push(myBall1);
  }

  addMesh = (o) => {
    if(typeof o.position === 'undefined') {o.position = {x: 0, y: 0, z: -4}}
    if(typeof o.rotation === 'undefined') {o.rotation = {x: 0, y: 0, z: 0}}
    if(typeof o.rotationSpeed === 'undefined') {o.rotationSpeed = {x: 0, y: 0, z: 0}}
    if(typeof o.texturesPaths === 'undefined') {o.texturesPaths = ['./res/textures/default.png']}
    if(typeof o.mainCameraParams === 'undefined') {o.mainCameraParams = this.mainCameraParams}
    if(typeof o.scale === 'undefined') {o.scale = 1;}
    o.entityArgPass = this.entityArgPass;
    o.cameras = this.cameras;
    if(typeof o.name === 'undefined') {o.name = 'random' + Math.random();}
    if(typeof o.mesh === 'undefined') {
      throw console.error('arg mesh is empty...');
      return;
    }
    console.log('Mesh procedure', o)

    let myMesh1 = new MEMesh(this.canvas, this.device, this.context, o)
    this.mainRenderBundle.push(myMesh1);


  }

  addMeshObj = (o) => {
    if(typeof o.position === 'undefined') {o.position = {x: 0, y: 0, z: -4}}
    if(typeof o.rotation === 'undefined') {o.rotation = {x: 0, y: 0, z: 0}}
    if(typeof o.rotationSpeed === 'undefined') {o.rotationSpeed = {x: 0, y: 0, z: 0}}
    if(typeof o.texturesPaths === 'undefined') {o.texturesPaths = ['./res/textures/default.png']}
    if(typeof o.mainCameraParams === 'undefined') {o.mainCameraParams = this.mainCameraParams}
    if(typeof o.scale === 'undefined') {o.scale = 1;}
    o.entityArgPass = this.entityArgPass;
    o.cameras = this.cameras;
    if(typeof o.name === 'undefined') {o.name = 'random' + Math.random();}
    if(typeof o.mesh === 'undefined') {
      throw console.error('arg mesh is empty...');
      return;
    }
    console.log('Mesh procedure', o)

    let myMesh1 = new MEMeshObj(this.canvas, this.device, this.context, o)
    this.mainRenderBundle.push(myMesh1);


  }

  run(callback) {
    setTimeout(() => {requestAnimationFrame(this.frame)}, 500)
    setTimeout(() => {callback()}, 20)
  }

  frameSinglePass = () => {

    let passEncoder;
    let commandEncoder = this.device.createCommandEncoder();
    if(typeof this.mainRenderBundle != 'undefined') this.mainRenderBundle.forEach((meItem, index) => {
      meItem.position.update();
      meItem.draw(commandEncoder);
      if(typeof meItem.done == 'undefined') {
        this.rbContainer.push(meItem.renderBundle);
        this.renderPassDescriptor.colorAttachments[0].view = this.context
          .getCurrentTexture()
          .createView();
        //  console.log('prolazi ')
        passEncoder = commandEncoder.beginRenderPass(this.renderPassDescriptor);
        passEncoder.executeBundles(this.rbContainer);
        passEncoder.end();
        // this.device.queue.submit([commandEncoder.finish()]);
      }
    })
    this.device.queue.submit([commandEncoder.finish()]);

    requestAnimationFrame(this.frame);
  }

  framePassPerObject = () => {
    // console.log('framePassPerObject')
    let commandEncoder = this.device.createCommandEncoder();
    this.rbContainer = [];
    let passEncoder;
    this.mainRenderBundle.forEach((meItem, index) => {
      meItem.draw(commandEncoder);
      meItem.position.update();
      if(meItem.renderBundle) {
        this.rbContainer.push(meItem.renderBundle)
        passEncoder = commandEncoder.beginRenderPass(meItem.renderPassDescriptor);
        passEncoder.executeBundles(this.rbContainer);
        passEncoder.end();
      } else {
        meItem.draw(commandEncoder)
      }

    })
    this.device.queue.submit([commandEncoder.finish()]);
    requestAnimationFrame(this.frame);
  }
}