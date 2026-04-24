import {LOG_WARN} from "../utils";

// Nano render is psecial only for uniform scene objects
export let nanoPass = function() {
  const now2 = performance.now();
  this.now = now2 * 0.001;
  this.autoUpdate.forEach((_) => _.update())
  requestAnimationFrame(this.frame);
  try {
    let commandEncoder = this.device.createCommandEncoder();
    this.updateLights();
    const camera = this.getCamera();
    if(camera._dirtyAngle || camera._dirty) this.getTransformationMatrix(camera, now2);
    camera.update();
    const len = this.mainRenderBundle.length;
    for(let i = 0;i < len;i++) {
      const mesh = this.mainRenderBundle[i];
      // if(mesh.updateInstanceData) mesh.updateInstanceData(mesh.modelMatrix);
      // if(mesh.vertexAnim?.active) mesh.updateTime(this.now);
      if(mesh.position.inMove) mesh.updateModelUniformBuffer(i)
      mesh.position.update();
      // if(mesh.updateMorphAnimation) mesh.updateMorphAnimation(this.now);
      // if(mesh.update) mesh.update(now2);
    }
    this.mainRenderPassDesc.colorAttachments[0].view = this.sceneTextureView;
    let pass = commandEncoder.beginRenderPass(this.mainRenderPassDesc);
    pass.setBindGroup(0, this.sceneBindGroup);
    for(const [pipeline, meshes] of this.opaqueBuckets) {
      pass.setPipeline(pipeline);
      pass.setBindGroup(1, meshes[0].materialBindGroup);
      for(const mesh of meshes) {
        pass.setBindGroup(2, mesh.modelBindGroup);
        mesh.drawElements(pass, this.lightContainer);
      }
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