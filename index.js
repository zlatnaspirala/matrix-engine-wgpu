/**
 * This file created by:
 * Nikola Lukic zlatnaspirala@gmail.com mart 2024
 * npm import/export
 */
import {degToRad} from "wgpu-matrix/dist/2.x/utils.js";
import {downloadMeshes} from "./src/engine/loader-obj.js";
import MatrixEngineWGPU from "./src/meWGPU.js";
import {getRayFromMouse, rayIntersectsSphere} from "./src/engine/raycast.js";

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
	addRaycastListener,
  degToRad,
  about
}
