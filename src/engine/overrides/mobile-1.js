import {LOG_WARN, MeshType} from "../utils";

// no integrated yet
export let mobile1 = function() {
  const now2 = performance.now();
  this.now = now2 * 0.001;
  this.lastFrameMS = this.now;
  this.autoUpdate.forEach((_) => _.update())
  requestAnimationFrame(this.frame);
  try {
    let commandEncoder = this.device.createCommandEncoder();
    if(this.matrixPhysics) this.matrixPhysics.updatePhysics();
    this.updateLights();
    const camera = this.getCamera();
    // this._sceneData[44] = (performance.now() - this.startTime) / 1000;
    // this.device.queue.writeBuffer(this.globalSceneUniformBuffer, 0, this._sceneData.buffer, this._sceneData.byteOffset, this._sceneData.byteLength);
    if(camera._dirtyAngle) this.getTransformationMatrix(camera, now2);
    camera.update();

    for(let i = 0;i < this.lightContainer.length;i++) {
      const light = this.lightContainer[i];
      const pass = commandEncoder.beginRenderPass(this._shadowPassDescs[i]);
      if(this.shadowBuckets.default.length) {
        pass.setPipeline(light.shadowPipeline);
        for(let m of this.shadowBuckets.default) {
          pass.setBindGroup(0, light.getShadowBindGroup(m));
          pass.setBindGroup(1, m.modelBindGroup);
          m.drawShadows(pass, light);
        }
      }
      // if(this.shadowBuckets.instanced.length) {
      //   pass.setPipeline(light.shadowPipelineInstanced);
      //   for(let m of this.shadowBuckets.instanced) {
      //     pass.setBindGroup(0, light.getShadowBindGroup(m));
      //     pass.setBindGroup(1, m.modelBindGroup);
      //     m.drawShadows(pass, light);
      //   }
      // }
      // if(this.shadowBuckets.procedural.length) {
      //   pass.setPipeline(light.shadowPipelineMorph);
      //   for(let m of this.shadowBuckets.procedural) {
      //     pass.setBindGroup(0, light.getShadowBindGroup(m));
      //     pass.setBindGroup(1, m.modelBindGroup);
      //     m.drawShadows(pass, light);
      //   }
      // }
      pass.end();
    }

    const len = this.mainRenderBundle.length;
    for(let i = 0;i < len;i++) {
      const mesh = this.mainRenderBundle[i];
      // if(mesh.updateInstanceData) mesh.updateInstanceData(mesh.modelMatrix);
      // if(mesh.vertexAnim?.active) mesh.updateTime(this.now);
      if(mesh.position.inMove === true) {mesh.updateModelUniformBuffer(i)}
      mesh.position.update();
      // if(mesh.updateMorphAnimation) mesh.updateMorphAnimation(this.now);
      // if(mesh.update) mesh.update(now2);
      // if(mesh.isVideo) mesh.updateVideoTexture();
    }

    this.mainRenderPassDesc.colorAttachments[0].view = this.sceneTextureView;
    let pass = commandEncoder.beginRenderPass(this.mainRenderPassDesc);
    pass.setBindGroup(0, this.sceneBindGroup);
    for(const [pipeline, meshes] of this.opaqueBuckets) {
      pass.setPipeline(pipeline);
      let l = null;
      for(const mesh of meshes) {
        if(mesh.materialBindGroup !== l) {
          pass.setBindGroup(1, mesh.materialBindGroup);
          l = mesh.materialBindGroup;
        } else {
          // console.log('same BIND GROUP!')
        }
        // pass.setBindGroup(1, mesh.materialBindGroup);
        pass.setBindGroup(2, mesh.modelBindGroup);
        if(mesh.material.type == "mirror") pass.setBindGroup(3, mesh.mirrorBindGroup);
        if(mesh.material.type == "water") pass.setBindGroup(3, mesh.waterBindGroup);
        mesh.drawElements(pass, this.lightContainer);
      }
    }
    for(const [pipeline, meshes] of this.transparentBuckets) {
      meshes.sort((a, b) => {
        const dx1 = camera.position[0] - a.position[0];
        const dz1 = camera.position[2] - a.position[2];
        const da = dx1 * dx1 + dz1 * dz1;
        const dx2 = camera.position[0] - b.position[0];
        const dz2 = camera.position[2] - b.position[2];
        const db = dx2 * dx2 + dz2 * dz2;
        return db - da;
      });
      pass.setPipeline(pipeline);
      for(const mesh of meshes) {
        pass.setBindGroup(1, mesh.materialBindGroup);
        pass.setBindGroup(2, mesh.modelBindGroup);
        if(mesh.material.type == "mirror") pass.setBindGroup(3, mesh.mirrorBindGroup);
        if(mesh.material.type == "water") pass.setBindGroup(3, mesh.waterBindGroup);
        mesh.drawElements(pass, this.lightContainer);
      }
    }
    pass.end();

    const transPass = commandEncoder.beginRenderPass(this._transPassDesc);
    const viewProjMatrix = camera.VP;
    for(let meshIndex = 0;meshIndex < this.mainRenderBundle.length;meshIndex++) {
      const mesh = this.mainRenderBundle[meshIndex];
      if(mesh.effects) {
        for(const effectName in mesh.effects) {
          const effect = mesh.effects[effectName];
          if(effect == null || effect.enabled === false) continue;
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
    if(this.bloomPass.enabled == true) {
      // this.bloomPass.render(commandEncoder, bloomInput, this.bloomOutputTex);
      this.bloomPass.render(commandEncoder, this.bloomOutputTex.createView());
    }
    this.finalPS.colorAttachments[0].view = this._canvasView;
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