import {vec3, mat4} from "wgpu-matrix";

export default class MatrixEngineGPURender {
  engine = null;

  constructor(engine) {
    this.engine = engine;

    requestAnimationFrame(this.render);
  }

  resizeToDisplaySize(device, canvasInfo) {
    const {
      canvas,
      renderTarget,
      presentationFormat,
      depthTexture,
      sampleCount,
    } = canvasInfo;
    const width = Math.max(1, Math.min(device.limits.maxTextureDimension2D, canvas.clientWidth),);
    const height = Math.max(1, Math.min(device.limits.maxTextureDimension2D, canvas.clientHeight),);

    const needResize = !canvasInfo.renderTarget || width !== canvas.width || height !== canvas.height;
    if(needResize) {
      if(renderTarget) {renderTarget.destroy()}
      if(depthTexture) {depthTexture.destroy()}
      canvas.width = width;
      canvas.height = height;

      if(sampleCount > 1) {
        const newRenderTarget = device.createTexture({
          size: [canvas.width, canvas.height],
          format: presentationFormat,
          sampleCount,
          usage: GPUTextureUsage.RENDER_ATTACHMENT,
        });
        canvasInfo.renderTarget = newRenderTarget;
        canvasInfo.renderTargetView = newRenderTarget.createView();
      }

      const newDepthTexture = device.createTexture({
        size: [canvas.width, canvas.height],
        format: "depth24plus",
        sampleCount,
        usage: GPUTextureUsage.RENDER_ATTACHMENT,
      });
      canvasInfo.depthTexture = newDepthTexture;
      canvasInfo.depthTextureView = newDepthTexture.createView();
    }
    return needResize;
  }

  render = (t) => {
    var time = t;
    time *= 0.001;
    //  this.resizeToDisplaySize(this.engine.device, this.engine.canvasInfo);

    this.engine.systemScene.forEach((matrixEnginePipline) => {
      matrixEnginePipline.draw(1, 2)
    })

    requestAnimationFrame(this.render);
  }



}
