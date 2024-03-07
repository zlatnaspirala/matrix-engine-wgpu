import MEBall from "./engine/ball.js";
import MECube from './engine/cube.js';

export default class MatrixEngineWGPU {

  mainRenderBundle = [];
  rbContainer = [];
  frame = () => {};

  entityArgPass = {
    loadOp: 'clear',
    storeOp: 'store',
    depthLoadOp: 'clear',
    depthStoreOp: 'store'
  }

  constructor(options, callback) {
    // console.log('typeof options ', typeof options )
    if(typeof options == 'undefined' || typeof options == "function") {
      this.options = {
        useSingleRenderPass: true,
        canvasSize: 'fullscreen' // | [w,h]
      }
      callback = options;
    }

    this.options = options;

    var canvas = document.createElement('canvas')
    if(this.options.canvasSize == 'fullscreen') {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    } else {
      canvas.width = this.options.canvasSize.w;
      canvas.height = this.options.canvasSize.h;
    }
    document.body.append(canvas)
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
        position: {x: 0, y: 0, z: -4},
        texturesPaths: ['./res/textures/default.png'],
        rotation: {x: 0, y: 0, z: 0},
        rotationSpeed: {x: 0, y: 0, z: 0},
        entityArgPass: this.entityArgPass
      }
    } else {
      if(typeof o.position === 'undefined') {o.position = {x: 0, y: 0, z: -4}}
      if(typeof o.rotation === 'undefined') {o.rotation = {x: 0, y: 0, z: 0}}
      if(typeof o.rotationSpeed === 'undefined') {o.rotationSpeed = {x: 0, y: 0, z: 0}}
      if(typeof o.texturesPaths === 'undefined') {o.texturesPaths = ['./res/textures/default.png']}
      o.entityArgPass = this.entityArgPass;
    }
    let myCube1 = new MECube(this.canvas, this.device, this.context, o)
    this.mainRenderBundle.push(myCube1);
  }

  addBall = (o) => {
    if(typeof o === 'undefined') {
      var o = {
        position: {x: 0, y: 0, z: -4},
        texturesPaths: ['./res/textures/default.png'],
        rotation: {x: 0, y: 0, z: 0},
        rotationSpeed: {x: 0, y: 0, z: 0},
        entityArgPass: this.entityArgPass
      }
    } else {
      if(typeof o.position === 'undefined') {o.position = {x: 0, y: 0, z: -4}}
      if(typeof o.rotation === 'undefined') {o.rotation = {x: 0, y: 0, z: 0}}
      if(typeof o.rotationSpeed === 'undefined') {o.rotationSpeed = {x: 0, y: 0, z: 0}}
      if(typeof o.texturesPaths === 'undefined') {o.texturesPaths = ['./res/textures/default.png']}
      o.entityArgPass = this.entityArgPass;
    }
    let myBall1 = new MEBall(this.canvas, this.device, this.context, o)
    this.mainRenderBundle.push(myBall1);
  }

  run(callback) {
    setTimeout(() => {requestAnimationFrame(this.frame)}, 1000)
    setTimeout(() => {callback()}, 10)
  }

  frameSinglePass = () => {
    console.log('single')
    let commandEncoder = this.device.createCommandEncoder();
    this.rbContainer = [];
    let passEncoder;

    this.mainRenderBundle.forEach((meItem, index) => {
      meItem.draw();
      this.rbContainer.push(meItem.renderBundle)
      // if(index == 0) passEncoder = commandEncoder.beginRenderPass(meItem.renderPassDescriptor);
    })

    this.renderPassDescriptor.colorAttachments[0].view = this.context
      .getCurrentTexture()
      .createView();

    passEncoder = commandEncoder.beginRenderPass(this.renderPassDescriptor);
    passEncoder.executeBundles(this.rbContainer);
    passEncoder.end();
    this.device.queue.submit([commandEncoder.finish()]);
    requestAnimationFrame(this.frame);
  }

  framePassPerObject = () => {
    console.log('framePassPerObject')
    let commandEncoder = this.device.createCommandEncoder();
    this.rbContainer = [];
    let passEncoder;
    this.mainRenderBundle.forEach((meItem, index) => {
      meItem.draw();
      this.rbContainer.push(meItem.renderBundle)
      passEncoder = commandEncoder.beginRenderPass(meItem.renderPassDescriptor);
      passEncoder.executeBundles(this.rbContainer);
      passEncoder.end();
    })
    this.device.queue.submit([commandEncoder.finish()]);
    requestAnimationFrame(this.frame);
  }
}