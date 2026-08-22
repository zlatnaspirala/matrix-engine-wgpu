import {vec3} from "wgpu-matrix";
import {LOG_WARN} from "../utils";

export async function GPUIndirectDraws() {
  const now2 = performance.now();
  this.now = now2 * 0.001;
  const camera = this.getCamera();

  this.autoUpdate.forEach((_) => _.update(this.now));
  requestAnimationFrame(this.frame);
  try {
    let commandEncoder = this.device.createCommandEncoder();

    // 1. UPDATE CULLING DATA
    for(let i = 0;i < this.indirectManager.indirectMeshes.length;i++) {
      const mesh = this.indirectManager.indirectMeshes[i];

      const meshIndex =
        this.indirectManager.meshToIndexMap.get(mesh.name) ??
        mesh.indirectDrawIndex;

      if(mesh.instanceData) {
        for(let j = 0;j < mesh.instanceCount;j++) {
          const globalIdx = mesh.globalInstanceIndex + j;
          const strideOffset = j * mesh.floatsPerInstance;

          const worldPos = vec3.fromValues(
            mesh.instanceData[strideOffset + 12],
            mesh.instanceData[strideOffset + 13],
            mesh.instanceData[strideOffset + 14]
          );

          const radius = mesh.boundingSphere?.radius || 1.0;
          this.computeCulling.updateInstance(globalIdx, worldPos, radius, meshIndex);
        }
      } else {
        const worldPos = mesh.modelMatrix.slice(12, 15);
        const radius = mesh.boundingSphere?.radius || 1.0;
        this.computeCulling.updateInstance(mesh.globalInstanceIndex, worldPos, radius, meshIndex);
      }
    }


    // // Inside your main render/update loop, before running compute culling:
    // for(const [meshName, drawIndex] of this.indirectManager.meshToIndexMap.entries()) {
    //   const offset = drawIndex * 5;
    //   // Reset instanceCount to 0; keep indexCount, firstIndex, etc. intact!
    //   this.computeCulling.indirectData[offset + 1] = 0;
    // }

    // console.log("Mesh map data sent to GPU:", this.computeCulling.instanceMeshData);
    // Push the reset 0-instance counts to the GPU buffer
    // this.computeCulling.flushIndirectBuffer();

// for (let i = 0; i < this.maxDrawCalls; i++) {
//   this.indirectData[i * 5 + 1] = 0; 
// }

    this.computeCulling.flushIndirectBuffer();
    this.computeCulling.flushInstances();
    await this.computeCulling.execute(
      commandEncoder,
      camera.view,
      camera.projectionMatrix,
      camera.position,
      1000.0
    );

    // PHYSICS&LIGHTS
    if(this.matrixPhysics) this.matrixPhysics.updatePhysics();
    this.updateLights();

    // SHADOWS
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

    // ============ 4. MAIN RENDER ============
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
      if(mesh.effects) {
        for(const effectName in mesh.effects) {
          const effect = mesh.effects[effectName];
          effect.simulate?.(commandEncoder);
        }
      }
    }

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

    // ============ 5. POST PROCESSING ============
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

    // ============ 6. SINGLE SUBMIT ============
    this.device.queue.submit([commandEncoder.finish()]);

    if(this.collisionSystem) this.collisionSystem.update();
    this.graphUpdate(this.now);
    this.blendQueue.length = 0;
  } catch(err) {
    if(this.logLoopError) console.log(`%cLoop(warn): ${err} Info: ${err.stack}`, LOG_WARN);
  }
}