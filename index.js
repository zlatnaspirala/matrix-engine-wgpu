/**
 * This file created by:
 * Nikola Lukic zlatnaspirala@gmail.com mart 2024
 * npm import/export
 */
import {degToRad} from "wgpu-matrix/dist/2.x/utils.js";
import {downloadMeshes} from "./src/engine/loader-obj.js";
import MatrixEngineWGPU from "./src/meWGPU.js";

var about = () => {
  console.log("Hi npm. matrix-engine for webgpu is ready...")
  console.log("--------------------------------------------")
  console.log("List of features : ")
  console.log(" - Loading obj files with uvs")
  console.log(" - Scene oriented draws")
  console.log(" - position, rotation - same like matrix-engine")
}

export {
  MatrixEngineWGPU,
  downloadMeshes,
  degToRad,
  about
}
