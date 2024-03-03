import { mat4, vec3 } from 'wgpu-matrix';
import { createSphereMesh, SphereLayout } from './src/test2/ballsBuffer.js';
import {BALL_SHADER} from './src/shaders/shaders.js';
import MEBall from "./src/test2/ball.js";
import MECube from './src/test2/cube.js';


var canvas = document.createElement('canvas')
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
document.body.append(canvas)



const init = async ({ canvas }) => {

  const adapter = await navigator.gpu.requestAdapter();
  const device = await adapter.requestDevice();



  const context = canvas.getContext('webgpu');
  const devicePixelRatio = window.devicePixelRatio;
  canvas.width = canvas.clientWidth * devicePixelRatio;
  canvas.height = canvas.clientHeight * devicePixelRatio;
  const presentationFormat = navigator.gpu.getPreferredCanvasFormat();

  context.configure({
    device,
    format: presentationFormat,
    alphaMode: 'premultiplied',
  });

  let NIK = new MEBall(canvas, device)

  let NIK2 = new MEBall(canvas, device)
  // let NIK2 = new MEBall(canvas, device)

  function frame() {

    if (NIK.moonTexture == null) {
      console.log('not ready')
      return;
    }
    const transformationMatrix = NIK.getTransformationMatrix(0, 0.5, -5);
    device.queue.writeBuffer(
      NIK.uniformBuffer,
      0,
      transformationMatrix.buffer,
      transformationMatrix.byteOffset,
      transformationMatrix.byteLength
    );
    NIK.renderPassDescriptor.colorAttachments[0].view = context
      .getCurrentTexture()
      .createView();


      const transformationMatrix2 = NIK2.getTransformationMatrix(0.4, 0.7, -5);
    device.queue.writeBuffer(
      NIK2.uniformBuffer,
      0,
      transformationMatrix2.buffer,
      transformationMatrix2.byteOffset,
      transformationMatrix2.byteLength
    );
    NIK2.renderPassDescriptor.colorAttachments[0].view = context
      .getCurrentTexture()
      .createView();


    const commandEncoder = device.createCommandEncoder();
    const passEncoder = commandEncoder.beginRenderPass(NIK.renderPassDescriptor);

    if (NIK.settings.useRenderBundles) {
      // Executing a bundle is equivalent to calling all of the commands encoded
      // in the render bundle as part of the current render pass.
      passEncoder.executeBundles([NIK.renderBundle, NIK2.renderBundle]);
    } else {
      // Alternatively, the same render commands can be encoded manually, which
      // can take longer since each command needs to be interpreted by the
      // JavaScript virtual machine and re-validated each time.
      renderScene(passEncoder);
    }

    passEncoder.end();
    device.queue.submit([commandEncoder.finish()]);

    requestAnimationFrame(frame);
  }

  setTimeout(() => { requestAnimationFrame(frame); }, 1000)
};


init({canvas})
