import MEBall from "./engine/ball.js";
import MECube from './engine/cube.js';
// import { mat4, vec3 } from 'wgpu-matrix';
// import { createSphereMesh, SphereLayout } from './src/engine/ballsBuffer.js';

export default class MatrixEngineWGPU {

  mainRenderBundle = [];
  rbContainer = [];

  constructor(callback) {
    var canvas = document.createElement('canvas')
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
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

    this.run(callback)
  };

  addCube = () => {
    let myCube1 = new MECube(this.canvas, this.device, this.context)
    this.mainRenderBundle.push(myCube1);
    // let NIK2 = new MEBall(canvas, device)
  }

  addBall = (o) => {
    if(typeof o === 'undefined') {
      var o = {
        position: {x: 0, y: 0, z: -4}
      }
    }
    let myBall1 = new MEBall(this.canvas, this.device, this.context, o)
    this.mainRenderBundle.push(myBall1);
  }

  run(callback) {
    setTimeout(() => {requestAnimationFrame(this.frame)}, 1000)
    setTimeout(() => {callback()}, 10)
  }

  frame = () => {
    let commandEncoder = this.device.createCommandEncoder();
    this.rbContainer = [];

    let passEncoder;

    this.mainRenderBundle.forEach((meItem, index) => {
      meItem.draw();
      this.rbContainer.push(meItem.renderBundle)
      if(index == 0) passEncoder = commandEncoder.beginRenderPass(meItem.renderPassDescriptor);
    })

    // passEncoder.executeBundles([NIK.renderBundle, NIK2.renderBundle]);
    passEncoder.executeBundles(this.rbContainer);
    passEncoder.end();
    this.device.queue.submit([commandEncoder.finish()]);

    requestAnimationFrame(this.frame);
  }
}