/**
 * @description
 * MEWGPU - Scene Culling System for massive scenes.
 * Optimized with static array caching to eliminate runtime memory allocation.
 */
export class CulledRenderPass {
  constructor(range = 500) {
    this.visibleOpaqueMeshes = new Map();
    this.visibleTransparentMeshes = new Map();
    this.cullStats = {total: 0, visible: 0, culled: 0};
    this.range = range;
    this._camPos = new Float32Array(3);
    this._camForward = new Float32Array(3);
    this._opaqueArrayCache = new Map();
    this._transparentArrayCache = new Map();
  }

  cullAndGroup(camera, opaqueBuckets, transparentBuckets) {
    this.visibleOpaqueMeshes.clear();
    this.visibleTransparentMeshes.clear();
    this.cullStats = {total: 0, visible: 0, culled: 0};
    if(!camera || !camera.position || !camera.back) {
      this.visibleOpaqueMeshes = new Map(opaqueBuckets);
      this.visibleTransparentMeshes = new Map(transparentBuckets);
      return;
    }
    this._camPos[0] = camera.position[0];
    this._camPos[1] = camera.position[1];
    this._camPos[2] = camera.position[2];
    this._camForward[0] = -camera.back[0];
    this._camForward[1] = -camera.back[1];
    this._camForward[2] = -camera.back[2];
    if(opaqueBuckets) {
      for(const [pipeline, meshes] of opaqueBuckets) {
        let visibleMeshes = this._opaqueArrayCache.get(pipeline);
        if(!visibleMeshes) {
          visibleMeshes = [];
          this._opaqueArrayCache.set(pipeline, visibleMeshes);
        }
        visibleMeshes.length = 0;
        const len = meshes.length;
        for(let i = 0;i < len;i++) {
          const mesh = meshes[i];
          this.cullStats.total++;
          if(!mesh || !mesh._modelMatrix || mesh.ignoreCulling === true) {
            visibleMeshes.push(mesh);
            this.cullStats.visible++;
            continue;
          }
          const m = mesh._modelMatrix;
          const toObjX = m[12] - this._camPos[0];
          const toObjY = m[13] - this._camPos[1];
          const toObjZ = m[14] - this._camPos[2];
          const distanceSq = toObjX * toObjX + toObjY * toObjY + toObjZ * toObjZ;
          if(distanceSq < mesh.boundingSphere.radius) {
            visibleMeshes.push(mesh);
            this.cullStats.visible++;
            continue;
          }
          if(distanceSq > this.range) {
            this.cullStats.culled++;
            continue;
          }
          const distance = Math.sqrt(distanceSq);
          if(distance <= 0.0001) {
            visibleMeshes.push(mesh);
            this.cullStats.visible++;
            continue;
          }
          const dot = (toObjX / distance) * this._camForward[0] +
            (toObjY / distance) * this._camForward[1] +
            (toObjZ / distance) * this._camForward[2];
          const radius = mesh.boundingSphere.radius;
          const threshold = 0.2 - radius / distance;
          if(dot > threshold) {
            visibleMeshes.push(mesh);
            this.cullStats.visible++;
          } else {

            if (mesh.name === 'main_arena_floor_30') {
              console.log('mesh.', this._camPos )
            }
            this.cullStats.culled++;
          }
        }
        if(visibleMeshes.length > 0) {
          this.visibleOpaqueMeshes.set(pipeline, visibleMeshes);
        }
      }
    }
    if(transparentBuckets) {
      for(const [pipeline, meshes] of transparentBuckets) {
        let visibleMeshes = this._transparentArrayCache.get(pipeline);
        if(!visibleMeshes) {
          visibleMeshes = [];
          this._transparentArrayCache.set(pipeline, visibleMeshes);
        }
        visibleMeshes.length = 0;
        const len = meshes.length;
        for(let i = 0;i < len;i++) {
          const mesh = meshes[i];
          this.cullStats.total++;

          if(!mesh || !mesh._modelMatrix) {
            visibleMeshes.push(mesh);
            this.cullStats.visible++;
            continue;
          }
          const m = mesh._modelMatrix;
          const toObjX = m[12] - this._camPos[0];
          const toObjY = m[13] - this._camPos[1];
          const toObjZ = m[14] - this._camPos[2];
          const distanceSq = toObjX * toObjX + toObjY * toObjY + toObjZ * toObjZ;
          if(distanceSq < 4.0) {
            visibleMeshes.push(mesh);
            this.cullStats.visible++;
            continue;
          }
          if(distanceSq > this.range * this.range) {
            this.cullStats.culled++;
            continue;
          }
          const distance = Math.sqrt(distanceSq);
          if(distance <= 0.0001) {
            visibleMeshes.push(mesh);
            this.cullStats.visible++;
            continue;
          }

          const dot = (toObjX / distance) * this._camForward[0] +
            (toObjY / distance) * this._camForward[1] +
            (toObjZ / distance) * this._camForward[2];
          const radius = Math.max(
            mesh.scale[0],
            mesh.scale[1],
            mesh.scale[2]
          );
          const threshold = 0.2 - radius / distance;
          if(dot > threshold) {
            visibleMeshes.push(mesh);
            this.cullStats.visible++;
          } else {
            this.cullStats.culled++;
          }
        }
        if(visibleMeshes.length > 0) {
          this.visibleTransparentMeshes.set(pipeline, visibleMeshes);
        }
      }
    }
  }

  getStats() {
    const cullRate = this.cullStats.total > 0
      ? (this.cullStats.culled / this.cullStats.total * 100).toFixed(1)
      : 0;
    return {
      total: this.cullStats.total,
      visible: this.cullStats.visible,
      culled: this.cullStats.culled,
      cullRate: `${cullRate}%`,
    };
  }
}