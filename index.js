/**
 * This file created by:
 * Nikola Lukic zlatnaspirala@gmail.com mart 2024
 * npm import/export
 */
// import {degToRad, radToDeg} from "./utils";
import {downloadMeshes, makeObjSeqArg} from "./src/engine/loader-obj.js";
import MatrixEngineWGPU from "./src/world.js";
import {
  addRaycastsAABBListener,
  addRaycastListener, getRayFromMouse,
  getRayFromMouse2, rayIntersectsSphere,
  computeWorldVertsAndAABB, rayIntersectsAABB,
  computeAABB
} from "./src/engine/raycast.js";

var about = () => {
  console.log("Hi npm. matrix-engine for webgpu is ready...")
  console.log("--------------------------------------------")
  console.log("List of features: ")
  console.log(" - Loading obj files with uvs")
  console.log(" - Scene camera use -z front")
  console.log(" - position, rotation - same like matrix-engine")
  console.log(" - Physics used Ammo.js build")
  console.log(" - Raycaster HIT/CLICK on object scene")
}

export {
  MatrixEngineWGPU,
  downloadMeshes,
  rayIntersectsSphere,
  getRayFromMouse,
  getRayFromMouse2,
  addRaycastListener,
  addRaycastsAABBListener,
  rayIntersectsAABB,
  computeAABB,
  computeWorldVertsAndAABB,
  makeObjSeqArg,
  about
}
