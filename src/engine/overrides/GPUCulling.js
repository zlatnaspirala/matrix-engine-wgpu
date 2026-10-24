import {mat4, vec3} from "wgpu-matrix";
import {LOG_WARN} from "../utils";

export async function GPUIndirectDraws() {
  const now2 = performance.now();
  this.now = now2 * 0.001;
  const camera = this.getCamera();
  this.autoUpdate.forEach((_) => _.update(this.now));
  requestAnimationFrame(this.frame);
  try {
    let commandEncoder = this.device.createCommandEncoder();
    // PHYSICS&LIGHTS
    if(this.matrixPhysics) this.matrixPhysics.updatePhysics();
    this.updateLights();
    // SHADOWS
    this._sceneData[44] = (performance.now() - this.startTime) / 1000;
    this.device.queue.writeBuffer(this.globalSceneUniformBuffer, 0, this._sceneData.buffer, this._sceneData.byteOffset, this._sceneData.byteLength);

    if(camera._digital) {camera._applyDigitalMovement(this.now);}
    if(camera._dirtyAngle) {camera.update(); this.getTransformationMatrix(camera, now2);}

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
    //PER MESH
    const len = this.mainRenderBundle.length;
    let drawCount = 0;
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
      if(mesh.effects) {
        for(const effectName in mesh.effects) {
          const effect = mesh.effects[effectName];
          effect.simulate?.(commandEncoder);
        }
      }

      const drawIndex = this.indirectManager.meshToIndexMap.get(mesh.name) ?? mesh.indirectDrawIndex ?? i;
      if(drawIndex >= this.computeCulling.maxDrawCalls) continue;
      const instanceCount = mesh.instanceCount || 1;
      let center, radius = mesh.boundingSphere?.radius || 1.0;
      mesh.updateBoundingSphere?.();
      const instanceData = mesh.instanceData;
      const stride = mesh.floatsPerInstance || 20;
      if(instanceData && instanceCount > 1 && instanceData.length >= instanceCount * stride) {
        let minX = Infinity, minY = Infinity, minZ = Infinity, maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
        for(let j = 0;j < instanceCount;j++) {
          const o = j * stride + 12;
          minX = Math.min(minX, instanceData[o]); maxX = Math.max(maxX, instanceData[o]);
          minY = Math.min(minY, instanceData[o + 1]); maxY = Math.max(maxY, instanceData[o + 1]);
          minZ = Math.min(minZ, instanceData[o + 2]); maxZ = Math.max(maxZ, instanceData[o + 2]);
        }
        center = [(minX + maxX) * 0.5, (minY + maxY) * 0.5, (minZ + maxZ) * 0.5];
        radius = 0;
        for(let j = 0;j < instanceCount;j++) {
          const o = j * stride;
          const dx = instanceData[o + 12] - center[0], dy = instanceData[o + 13] - center[1], dz = instanceData[o + 14] - center[2];
          const sx = Math.hypot(instanceData[o], instanceData[o + 1], instanceData[o + 2]);
          const sy = Math.hypot(instanceData[o + 4], instanceData[o + 5], instanceData[o + 6]);
          const sz = Math.hypot(instanceData[o + 8], instanceData[o + 9], instanceData[o + 10]);
          radius = Math.max(radius, Math.hypot(dx, dy, dz) + (mesh.boundingSphere?.radius || 1.0) * Math.max(sx, sy, sz));
        }
      } else {
        const matrix = mesh.modelMatrix || mesh._modelMatrix;
        center = mesh.boundingSphere?.center || [matrix?.[12] ?? mesh.position.x ?? 0, matrix?.[13] ?? mesh.position.y ?? 0, matrix?.[14] ?? mesh.position.z ?? 0];
      }
      this.computeCulling.setMeshDrawCommand(drawIndex, mesh.indexCount, instanceCount);
      this.computeCulling.updateInstance(drawIndex, center, radius, drawIndex);
      drawCount = Math.max(drawCount, drawIndex + 1);
    }

    this.computeCulling.flushIndirectBuffer();
    this.computeCulling.flushInstances(drawCount);
    await this.computeCulling.execute(commandEncoder, camera.view, camera.projectionMatrix, camera.position, drawCount, 500.0);
    this.mainRenderPassDesc.colorAttachments[0].view = this.sceneTextureView;
    let pass = commandEncoder.beginRenderPass(this.mainRenderPassDesc);
    pass.setBindGroup(0, this.sceneBindGroup);
    const indirectBuffer = this.computeCulling.getIndirectBuffer();

    for(const [pipeline, meshes] of this.opaqueBuckets) {
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
        const drawIndex = this.indirectManager.meshToIndexMap.get(mesh.name) ?? mesh.indirectDrawIndex;
        const indirectOffset = drawIndex * 20;
        mesh.drawElementsIndirect(pass, indirectBuffer, indirectOffset);
      }
    }

    for(const [pipeline, meshes] of this.transparentBuckets) {
      pass.setPipeline(pipeline);
      for(const mesh of meshes) {
        pass.setBindGroup(1, mesh.materialBindGroup);
        pass.setBindGroup(2, mesh.modelBindGroup);
        if(mesh.material.type === "mirror") pass.setBindGroup(3, mesh.mirrorBindGroup);
        if(mesh.material.type === "water") pass.setBindGroup(3, mesh.waterBindGroup);
        const drawIndex = this.indirectManager.meshToIndexMap.get(mesh.name) ?? mesh.indirectDrawIndex;
        const indirectOffset = drawIndex * 20;
        mesh.drawElementsIndirect(pass, indirectBuffer, indirectOffset);
      }
    }

    for(const className in this.effectsByType) {
      const pile = this.effectsByType[className];
      if(pile.length === 0) continue;
      if(className === '_WaterSimEffect' || className === '_DepthWebcamVoxelEffect' || className === '_WaterSimSphereEffect') {
        for(const {effect, mesh} of pile) {
          if(effect.enabled === false) continue;
          if(effect.updateInstanceData) effect.updateInstanceData(mesh.modelMatrix);
          effect.render(pass, mesh, camera.VP);
        }
        continue;
      }
      pass.setPipeline(pile[0].effect.pipeline);
      for(const {effect, mesh} of pile) {
        if(effect.enabled === false) continue;
        if(effect.updateInstanceData) effect.updateInstanceData(mesh.modelMatrix);
        effect.render(pass, mesh, camera.VP, 0.016);
      }
    }
    pass.end();

    // POST PROCESSING
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
    this.device.queue.submit([commandEncoder.finish()]);
    if(this.collisionSystem) this.collisionSystem.update();
    // this.graphUpdate(this.now);
    // this.blendQueue.length = 0;
  } catch(err) {
    if(this.logLoopError) console.log(`%cLoop(warn): ${err} Info: ${err.stack}`, LOG_WARN);
  }
}