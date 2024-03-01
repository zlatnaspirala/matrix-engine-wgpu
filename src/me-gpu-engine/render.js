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
    const width = Math.max(1, Math.min(device.limits.maxTextureDimension2D, canvas.clientWidth), );
    const height = Math.max(1, Math.min(device.limits.maxTextureDimension2D, canvas.clientHeight), );

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
    this.resizeToDisplaySize(this.engine.device, this.engine.canvasInfo);
    // console.log("this", this);
    let clientWidth = this.engine.canvas.clientWidth;
    let clientHeight = this.engine.canvas.clientHeight;

    const projection = mat4.perspective(
      (30 * Math.PI) / 180,
      clientWidth / clientHeight,
      0.5,
      10,
    );

    const eye = [1, 4, -6];
    const target = [0, 0, 0];
    const up = [0, 1, 0];

    const view = mat4.lookAt(eye, target, up);
    const viewProjection = mat4.multiply(projection, view);
    const world = mat4.rotationY(time);
    mat4.transpose(mat4.inverse(world), this.engine.worldInverseTranspose);
    mat4.multiply(viewProjection, world, this.engine.worldViewProjection);
    vec3.normalize([1, 8, -10], this.engine.lightDirection);

    this.engine.device.queue.writeBuffer(this.engine.vsUniformBuffer, 0, this.engine.vsUniformValues);
    this.engine.device.queue.writeBuffer(this.engine.fsUniformBuffer, 0, this.engine.fsUniformValues);

    if(this.engine.canvasInfo.sampleCount === 1) {
      const colorTexture = this.engine.context.getCurrentTexture();
      this.engine.renderPassDescriptor.colorAttachments[0].view = colorTexture.createView();
    } else {
      this.engine.renderPassDescriptor.colorAttachments[0].view = this.engine.canvasInfo.renderTargetView;
      this.engine.renderPassDescriptor.colorAttachments[0].resolveTarget = this.engine.context.getCurrentTexture().createView();
    }
    this.engine.renderPassDescriptor.depthStencilAttachment.view = this.engine.canvasInfo.depthTextureView;

    const commandEncoder = this.engine.device.createCommandEncoder();
    const passEncoder = commandEncoder.beginRenderPass(this.engine.renderPassDescriptor);

    passEncoder.setPipeline(this.engine.pipeline);
    passEncoder.setBindGroup(0, this.engine.bindGroup);
    passEncoder.setVertexBuffer(0, this.engine.buffersManager.MY_GPU_BUFFER.positionBuffer);
    passEncoder.setVertexBuffer(1, this.engine.buffersManager.MY_GPU_BUFFER.normalBuffer);
    passEncoder.setVertexBuffer(2, this.engine.buffersManager.MY_GPU_BUFFER.texcoordBuffer);
    passEncoder.setIndexBuffer(this.engine.buffersManager.MY_GPU_BUFFER.indicesBuffer, "uint16");
    passEncoder.drawIndexed(this.engine.buffersManager.MY_GPU_BUFFER.indices.length);
    passEncoder.end();

    this.engine.device.queue.submit([commandEncoder.finish()]);

    this.engine.systemScene.forEach((matrixEnginePipline) => {
      matrixEnginePipline.draw()
    })
    
 
    requestAnimationFrame(this.render);
  }



}
