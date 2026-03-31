// no integrated yet
export let noShadowPass = function() {
  const now2 = performance.now();
  this.now = now2 * 0.001;
  this.lastFrameMS = this.now;
  this.autoUpdate.forEach((_) => _.update())
  requestAnimationFrame(this.frame);
  try {
    let commandEncoder = this.device.createCommandEncoder();
    if(this.matrixAmmo) this.matrixAmmo.updatePhysics();
    this.updateLights();
    const camera = this.getCamera();
    const _ = this.mainRenderBundle[0];
    if(!_) return;
    if((camera._dirty || camera._dirtyAngle)) _.getTransformationMatrix(camera.VP, now2);
    camera.update(_);

    // Main
    this.mainRenderPassDesc.colorAttachments[0].view = this.sceneTextureView;
    let pass = commandEncoder.beginRenderPass(this.mainRenderPassDesc);
    let lastPipeline = null;

    const len = this.mainRenderBundle.length;
    for(let i = 0;i < len;i++) {
      const mesh = this.mainRenderBundle[i];
      if(mesh.updateInstanceData) mesh.updateInstanceData(mesh.modelMatrix);
      if(mesh.vertexAnim.active == true) mesh.updateTime(this.now);
      if(mesh.position.inMove == true) mesh.updateModelUniformBuffer(i);
      mesh.position.update();
      if(mesh.updateMorphAnimation) mesh.updateMorphAnimation(this.now);
      if(mesh.update) mesh.update(now2);
      if(mesh.material?.useBlend) {this.blendQueue.push(mesh); continue;}
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
    // Blend
    for(let i = 0;i < this.blendQueue.length;i++) {
      const m = this.blendQueue[i];
      pass.setPipeline(m.pipelineTransparent);
      m.drawElements(pass, this.lightContainer);
    }
    pass.end();

    const transPass = commandEncoder.beginRenderPass(this._transPassDesc);
    const viewProjMatrix = camera.VP;
    for(let meshIndex = 0;meshIndex < this.mainRenderBundle.length;meshIndex++) {
      const mesh = this.mainRenderBundle[meshIndex];
      if(mesh.effects) {
        for(const effectName in mesh.effects) {
          const effect = mesh.effects[effectName];
          if(effect.enabled === false) continue;
          if(effect.updateInstanceData) effect.updateInstanceData(mesh.modelMatrix);
          effect.render(transPass, mesh, viewProjMatrix);
        }
      }
    }
    transPass.end();

    if(this.volumetricPass.enabled === true) {
      mat4.invert(camera.VP, this._invViewProj);
      const light = this.lightContainer[0];
      this._volumetricUniforms.invViewProjectionMatrix = this._invViewProj;
      this._volumetricLightUniforms.viewProjectionMatrix = light.viewProjMatrix;
      this._volumetricLightUniforms.direction = light.direction;
      this.volumetricPass.render(commandEncoder,
        this.sceneTextureView,
        this.mainDepthView,
        this.shadowArrayView,
        this._volumetricUniforms,
        this._volumetricLightUniforms
      );
    }

    const canvasTexture = this.context.getCurrentTexture();
    if(this._lastCanvasTex !== canvasTexture) {
      this._lastCanvasTex = canvasTexture;
      this._canvasView = canvasTexture.createView();
    }
    const canvasView = this._canvasView;
    if(this.bloomPass.enabled == true) {
      const bloomInput = this.volumetricPass.enabled ? this.volumetricPass.compositeOutputTexView : this.sceneTextureView;
      this.bloomPass.render(commandEncoder, bloomInput, this.bloomOutputTex);
    }
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