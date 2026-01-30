/**
 * This file created by:
 * @author Nikola Lukic 
 * @email zlatnaspirala@gmail.com mart 2024
 * @description npm import/export
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
import {OSCILLATOR, SWITCHER} from "./src/engine/utils.js";
import {uploadGLBModel} from "./src/engine/loaders/webgpu-gltf.js";

var about = () => {
  console.info("Hi npm. matrix-engine for webgpu is ready...")
  console.info("--------------------------------------------")
  console.info("List of features: ")
  console.info(" - Loading obj files with uvs")
  console.info(" - Scene camera use -z front")
  console.info(" - position, rotation - same like matrix-engine")
  console.info(" - Physics used Ammo.js build")
  console.info(" - Raycaster HIT/CLICK on object scene")
  console.info(" - Light cast shadow multi lights")
  console.info("--------------------------------------------")
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
  SWITCHER,
  OSCILLATOR,
  uploadGLBModel,
  about
}
