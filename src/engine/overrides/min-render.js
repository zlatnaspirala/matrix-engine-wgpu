import {LOG_WARN} from "../utils";

export let zeroPass = function() {
  const now2 = performance.now();
  this.now = now2 * 0.001;
  this.autoUpdate.forEach((_) => _.update())
  requestAnimationFrame(this.frame);
  try {
    let commandEncoder = this.device.createCommandEncoder();
    const camera = this.getCamera();
    if((camera._dirty || camera._dirtyAngle)) this.getTransformationMatrix(camera, now2);
    camera.update();
    this.mainRenderPassDesc.colorAttachments[0].view = this.sceneTextureView;
    let pass = commandEncoder.beginRenderPass(this.mainRenderPassDesc);
    let lastPipeline = null;
    const len = this.mainRenderBundle.length;
    for(let i = 0;i < len;i++) {
      const mesh = this.mainRenderBundle[i];
      if(mesh.position.inMove) mesh.updateModelUniformBuffer(i);
      mesh.position.update();
      if(mesh.update) mesh.update(now2);
      if(!mesh.sceneBindGroupForRender) {
        mesh.shadowDepthTextureView = this.shadowArrayView;
        mesh.setupPipeline();
      }
      const targetPipeline = mesh.pipeline || this.mainRenderBundle[0].pipeline;
      if(lastPipeline !== targetPipeline) {
        pass.setPipeline(targetPipeline);
        lastPipeline = targetPipeline;
      }
      mesh.drawElements(pass, this.lightContainer);
    }
    pass.end();
    const canvasTexture = this.context.getCurrentTexture();
    if(this._lastCanvasTex !== canvasTexture) {
      this._lastCanvasTex = canvasTexture;
      this._canvasView = canvasTexture.createView();
    }
    const canvasView = this._canvasView;
    this.finalPS.colorAttachments[0].view = canvasView;
    pass = commandEncoder.beginRenderPass(this.finalPS);
    pass.setPipeline(this.presentPipeline);
    pass.setBindGroup(0, this._activeBindGroup);
    pass.draw(6);
    pass.end();
    this.submitQueue[0] = commandEncoder.finish();
    this.device.queue.submit(this.submitQueue);
    this.submitQueue[0] = null;
    if(this.collisionSystem) this.collisionSystem.update();
    this.graphUpdate(this.now);
    this.blendQueue.length = 0;
  } catch(err) {
    if(this.logLoopError) console.log(`%cLoop(warn): ${err} Info: ${err.stack}`, LOG_WARN);
  }
}