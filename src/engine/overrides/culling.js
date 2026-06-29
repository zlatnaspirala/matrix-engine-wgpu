import {mat4} from "wgpu-matrix";
import {LOG_WARN} from "../utils";

export let cullingPass = function() {
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
    this._sceneData[44] = (performance.now() - this.startTime) / 1000;
    this.device.queue.writeBuffer(this.globalSceneUniformBuffer, 0, this._sceneData.buffer, this._sceneData.byteOffset, this._sceneData.byteLength);
    if(camera._dirtyAngle || camera._dirty) {
      this.getTransformationMatrix(camera, now2);
      camera.update();
    }
    for(let i = 0;i < this.lightContainer.length;i++) {
      const light = this.lightContainer[i];
      const p = commandEncoder.beginRenderPass(this._shadowPassDescs[i]);
      if(this.shadowBuckets.default.length) {
        p.setPipeline(light.shadowPipeline);
        for(let m of this.shadowBuckets.default) {
          p.setBindGroup(0, light.getShadowBindGroup(m));
          p.setBindGroup(1, m.modelBindGroup);
          m.drawShadows(p, light);
        }
      }
      if(this.shadowBuckets.instanced.length) {
        p.setPipeline(light.shadowPipelineInstanced);
        for(let m of this.shadowBuckets.instanced) {
          p.setBindGroup(0, light.getShadowBindGroup(m));
          p.setBindGroup(1, m.modelBindGroup);
          m.drawShadows(p, light);
        }
      }
      if(this.shadowBuckets.procedural.length) {
        p.setPipeline(light.shadowPipelineMorph);
        for(let m of this.shadowBuckets.procedural) {
          p.setBindGroup(0, light.getShadowBindGroup(m));
          p.setBindGroup(1, m.modelBindGroup);
          m.drawShadows(p, light);
        }
      }
      p.end();
    }
    const len = this.mainRenderBundle.length;
    for(let i = 0;i < len;i++) {
      const mesh = this.mainRenderBundle[i];
      mesh.updateInstanceData?.(mesh.modelMatrix);
      if(mesh.vertexAnim?.active) mesh.updateTime(this.now);
      mesh.position.update();
      mesh.updateModelUniformBuffer(i);
      if(mesh.updateMorphAnimation) mesh.updateMorphAnimation(this.now);
      if(mesh.update) mesh.update(now2);
      if(mesh.isVideo) mesh.updateVideoTexture();
      if(mesh.sourceCanvas) mesh.updateCanvasInlineTexture();
      mesh.updateBoundingSphere?.();
    }
    this.culledRenderPass.cullAndGroup(camera, this.opaqueBuckets, this.transparentBuckets);
    this.mainRenderPassDesc.colorAttachments[0].view = this.sceneTextureView;
    let pass = commandEncoder.beginRenderPass(this.mainRenderPassDesc);
    pass.setBindGroup(0, this.sceneBindGroup);
    for(const [pipeline, meshes] of this.culledRenderPass.visibleOpaqueMeshes) {
      pass.setPipeline(pipeline);
      let l = null;
      for(const mesh of meshes) {
        if(mesh.materialBindGroup !== l) {
          pass.setBindGroup(1, mesh.materialBindGroup);
          l = mesh.materialBindGroup;
        }
        pass.setBindGroup(2, mesh.modelBindGroup);
        if(mesh.material.type === "mirror") pass.setBindGroup(3, mesh.mirrorBindGroup);
        if(mesh.material.type === "water") pass.setBindGroup(3, mesh.waterBindGroup);
        mesh.drawElements(pass, this.lightContainer);
      }
    }
    for(const [pipeline, meshes] of this.culledRenderPass.visibleTransparentMeshes) {
      pass.setPipeline(pipeline);
      for(const mesh of meshes) {
        pass.setBindGroup(1, mesh.materialBindGroup);
        pass.setBindGroup(2, mesh.modelBindGroup);
        if(mesh.material.type === "mirror") pass.setBindGroup(3, mesh.mirrorBindGroup);
        if(mesh.material.type === "water") pass.setBindGroup(3, mesh.waterBindGroup);
        mesh.drawElements(pass, this.lightContainer);
      }
    }
    for(let meshIndex = 0;meshIndex < this.mainRenderBundle.length;meshIndex++) {
      const mesh = this.mainRenderBundle[meshIndex];
      if(mesh.effects) {
        for(const effectName in mesh.effects) {
          const effect = mesh.effects[effectName];
          if(effect === null || effect.enabled === false) continue;
          if(effect.updateInstanceData) effect.updateInstanceData(mesh.modelMatrix);
          effect.render(pass, mesh, camera.VP);
        }
      }
    }
    pass.end();

    if(this.ssrPass.enabled === true) {
      mat4.invert(camera.VP, this._invViewProj);
      this.ssrPass.updateConfig(this._invViewProj, camera.projectionMatrix);
      this.ssrPass.render(commandEncoder, {
        sceneTextureView: this.sceneTextureView,
        normalTextureView: this.normalTextureView,
        mainDepthView: this.mainDepthView,
        mainDepthTexture: this.mainDepthTexture,
        worldPosTextureView: this.worldPosTextureView
      });
    }

    if(this.volumetricPass.enabled === true) {
      if(this.ssrPass.enabled === false) mat4.invert(camera.VP, this._invViewProj);
      this._volumetricUniforms.invViewProjectionMatrix = this._invViewProj;
      for(let i = 0;i < this.lightContainer.length;i++) {
        const light = this.lightContainer[i];
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
    }

    const canvasTexture = this.context.getCurrentTexture();
    if(this._lastCanvasTex !== canvasTexture) {
      this._lastCanvasTex = canvasTexture;
      this._canvasView = canvasTexture.createView();
    }
    if(this.bloomPass.enabled === true) this.bloomPass.render(commandEncoder, this.bloomOutputTex.createView());
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

export let noShadowPass = function() {
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
    this._sceneData[44] = (performance.now() - this.startTime) / 1000;
    this.device.queue.writeBuffer(this.globalSceneUniformBuffer, 0, this._sceneData.buffer, this._sceneData.byteOffset, this._sceneData.byteLength);
    if(camera._dirtyAngle || camera._dirty) {
      this.getTransformationMatrix(camera, now2);
      camera.update();
    }

    const len = this.mainRenderBundle.length;
    for(let i = 0;i < len;i++) {
      const mesh = this.mainRenderBundle[i];
      mesh.updateInstanceData?.(mesh.modelMatrix);
      if(mesh.vertexAnim?.active) mesh.updateTime(this.now);
      mesh.position.update();
      mesh.updateModelUniformBuffer(i);
      if(mesh.updateMorphAnimation) mesh.updateMorphAnimation(this.now);
      if(mesh.update) mesh.update(now2);
      if(mesh.isVideo) mesh.updateVideoTexture();
      if(mesh.sourceCanvas) mesh.updateCanvasInlineTexture();

      // : Update world-space bounding sphere if mesh moved
      mesh.updateBoundingSphere?.();
    }

    // : Frustum cull all meshes before rendering (1-2ms overhead)
    const cullStartMs = performance.now();
    this.culledRenderPass.cullAndGroup(camera, this.opaqueBuckets, this.transparentBuckets);
    const cullTimeMs = performance.now() - cullStartMs;
    // console.log(`Cull: ${cullTimeMs.toFixed(2)}ms`); // Uncomment to measure

    this.mainRenderPassDesc.colorAttachments[0].view = this.sceneTextureView;
    let pass = commandEncoder.beginRenderPass(this.mainRenderPassDesc);
    pass.setBindGroup(0, this.sceneBindGroup);

    // ← CHANGE: Use visibleOpaqueMeshes instead of opaqueBuckets
    for(const [pipeline, meshes] of this.culledRenderPass.visibleOpaqueMeshes) {
      pass.setPipeline(pipeline);
      let l = null;
      for(const mesh of meshes) {
        if(mesh.materialBindGroup !== l) {
          pass.setBindGroup(1, mesh.materialBindGroup);
          l = mesh.materialBindGroup;
        }
        pass.setBindGroup(2, mesh.modelBindGroup);
        if(mesh.material.type === "mirror") pass.setBindGroup(3, mesh.mirrorBindGroup);
        if(mesh.material.type === "water") pass.setBindGroup(3, mesh.waterBindGroup);
        mesh.drawElements(pass, this.lightContainer);
      }
    }

    // ← CHANGE: Use visibleTransparentMeshes instead of transparentBuckets
    for(const [pipeline, meshes] of this.culledRenderPass.visibleTransparentMeshes) {
      pass.setPipeline(pipeline);
      for(const mesh of meshes) {
        pass.setBindGroup(1, mesh.materialBindGroup);
        pass.setBindGroup(2, mesh.modelBindGroup);
        if(mesh.material.type === "mirror") pass.setBindGroup(3, mesh.mirrorBindGroup);
        if(mesh.material.type === "water") pass.setBindGroup(3, mesh.waterBindGroup);
        mesh.drawElements(pass, this.lightContainer);
      }
    }

    for(let meshIndex = 0;meshIndex < this.mainRenderBundle.length;meshIndex++) {
      const mesh = this.mainRenderBundle[meshIndex];
      if(mesh.effects) {
        for(const effectName in mesh.effects) {
          const effect = mesh.effects[effectName];
          if(effect === null || effect.enabled === false) continue;
          if(effect.updateInstanceData) effect.updateInstanceData(mesh.modelMatrix);
          effect.render(pass, mesh, camera.VP);
        }
      }
    }
    pass.end();

    if(this.ssrPass.enabled === true) {
      mat4.invert(camera.VP, this._invViewProj);
      this.ssrPass.updateConfig(this._invViewProj, camera.projectionMatrix);
      this.ssrPass.render(commandEncoder, {
        sceneTextureView: this.sceneTextureView,
        normalTextureView: this.normalTextureView,
        mainDepthView: this.mainDepthView,
        mainDepthTexture: this.mainDepthTexture,
        worldPosTextureView: this.worldPosTextureView
      });
    }

    if(this.volumetricPass.enabled === true) {
      if(this.ssrPass.enabled === false) mat4.invert(camera.VP, this._invViewProj);
      this._volumetricUniforms.invViewProjectionMatrix = this._invViewProj;
      for(let i = 0;i < this.lightContainer.length;i++) {
        const light = this.lightContainer[i];
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
    }

    const canvasTexture = this.context.getCurrentTexture();
    if(this._lastCanvasTex !== canvasTexture) {
      this._lastCanvasTex = canvasTexture;
      this._canvasView = canvasTexture.createView();
    }
    if(this.bloomPass.enabled === true) this.bloomPass.render(commandEncoder, this.bloomOutputTex.createView());
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