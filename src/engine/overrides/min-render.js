import {LOG_WARN} from "../utils";

export let zeroPass = function() {
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

    // for(let i = 0;i < this.lightContainer.length;i++) {
    //   const light = this.lightContainer[i];
    //   const pass = commandEncoder.beginRenderPass(this._shadowPassDescs[i]);
    //   if(this.shadowBuckets.default.length) {
    //     pass.setPipeline(light.shadowPipeline);
    //     for(let m of this.shadowBuckets.default) {
    //       pass.setBindGroup(0, light.getShadowBindGroup(m));
    //       pass.setBindGroup(1, m.modelBindGroup);
    //       m.drawShadows(pass, light);
    //     }
    //   }
    //   if(this.shadowBuckets.instanced.length) {
    //     pass.setPipeline(light.shadowPipelineInstanced);
    //     for(let m of this.shadowBuckets.instanced) {
    //       pass.setBindGroup(0, light.getShadowBindGroup(m));
    //       pass.setBindGroup(1, m.modelBindGroupInstanced);
    //       m.drawShadows(pass, light);
    //     }
    //   }
    //   if(this.shadowBuckets.procedural.length) {
    //     pass.setPipeline(light.shadowPipelineMorph);
    //     for(let m of this.shadowBuckets.procedural) {
    //       pass.setBindGroup(0, light.getShadowBindGroup(m));
    //       pass.setBindGroup(1, m.mainRenderBindGroup);
    //       m.drawShadows(pass, light);
    //     }
    //   }
    //   pass.end();
    // }

    const len = this.mainRenderBundle.length;
    for(let i = 0;i < len;i++) {
      const mesh = this.mainRenderBundle[i];
      if(mesh.updateInstanceData) mesh.updateInstanceData(mesh.modelMatrix);
      if(mesh.vertexAnim?.active) mesh.updateTime(this.now);
      if(mesh.position.inMove) mesh.updateModelUniformBuffer(i)
      mesh.position.update();
      if(mesh.updateMorphAnimation) mesh.updateMorphAnimation(this.now);
      if(mesh.update) mesh.update(now2);
      if(!mesh.pipeline) {
        mesh.shadowDepthTextureView = this.shadowArrayView;
      }
    }
    this.mainRenderPassDesc.colorAttachments[0].view = this.sceneTextureView;
    let pass = commandEncoder.beginRenderPass(this.mainRenderPassDesc);
    for(const [pipeline, meshes] of this.opaqueBuckets) {
      pass.setPipeline(pipeline);
      for(const mesh of meshes) {
        mesh.drawElements(pass, this.lightContainer);
      }
    }
    for(const [pipeline, meshes] of this.transparentBuckets) {
      if(cam._dirty) meshes.sort((a, b) => {
        const dx1 = cam.position[0] - a.position[0];
        const dz1 = cam.position[2] - a.position[2];
        const da = dx1 * dx1 + dz1 * dz1;
        const dx2 = cam.position[0] - b.position[0];
        const dz2 = cam.position[2] - b.position[2];
        const db = dx2 * dx2 + dz2 * dz2;
        return db - da;
      });
      pass.setPipeline(pipeline);
      for(const mesh of meshes) {
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