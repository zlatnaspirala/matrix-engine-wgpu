import MEBall from "./engine/ball.js";
import MECube from './engine/cube.js';
// import { mat4, vec3 } from 'wgpu-matrix';
// import { createSphereMesh, SphereLayout } from './src/engine/ballsBuffer.js';

export default class MatrixEngineWGPU {

  mainRenderBundle = [];

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

  run(callback) {
    setTimeout(() => {requestAnimationFrame(this.frame)}, 1000)
    setTimeout(() => {callback()}, 10)
  }

  frame = () => {
    const commandEncoder = this.device.createCommandEncoder();

    let passEncoder;
    this.mainRenderBundle.forEach((meItem) => {
      meItem.draw();
      passEncoder = commandEncoder.beginRenderPass(meItem.renderPassDescriptor);

      if(true) {
        // Executing a bundle is equivalent to calling all of the commands encoded
        // in the render bundle as part of the current render pass.
        //passEncoder.executeBundles([NIK.renderBundle, NIK2.renderBundle]);
        passEncoder.executeBundles([meItem.renderBundle]);
      } else {
        // Alternatively, the same render commands can be encoded manually, which
        // can take longer since each command needs to be interpreted by the
        // JavaScript virtual machine and re-validated each time.
        renderScene(passEncoder);
      }
      passEncoder.end();
      this.device.queue.submit([commandEncoder.finish()]);
    })
    requestAnimationFrame(this.frame);
  }
}