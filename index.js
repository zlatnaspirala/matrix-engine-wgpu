/**
 * This file created by:
 * @author Nikola Lukic 
 * @email zlatnaspirala@gmail.com mart 2024
 * @description npm import/export
 * Sync with version 1.15.7
 * 
 */

import MatrixEngineWGPU from "./src/world.js";
import {downloadMeshes, makeObjSeqArg} from "./src/engine/loader-obj.js";
import {
  addRaycastsAABBListener,
  addRaycastListener, getRayFromMouse,
  getRayFromMouse2, rayIntersectsSphere,
  computeWorldVertsAndAABB, rayIntersectsAABB,
  computeAABB,
  touchCoordinate
} from "./src/engine/raycast.js";
import {CameraPath, geoTypesForMorph, isMobile, OSCILLATOR, randomFloatFromTo, randomIntFromTo, SWITCHER} from "./src/engine/utils.js";
import {uploadGLBModel} from "./src/engine/loaders/webgpu-gltf.js";
import {MeshMorpher} from "./src/engine/procedural-mesh.js";
import {CollisionSystem} from "./src/engine/collision-sub-system.js";
import {KaleidoscopeEmitter} from "./src/engine/effects/kaleidoscopeEffectInstance.js";
import {KaleidoscopePresets} from "./src/engine/effects/KaleidoscopeEffect.js";
import {PVector} from "./src/engine/matrix-class.js";

var about = () => {
  console.info("npm matrix-engine-wgpu is ready...")
  console.info("--------------------------------------------")
  console.info("List of features: ")
  console.info(" - Loading obj files with uvs")
  console.info(" - Loading glb binary file - animations, trail effects.")
  console.info(" - Scene camera use -z front.")
  console.info(" - position, rotation - same like matrix-engine")
  console.info(" - Physics used Ammo.js build , cannones and joltjs.")
  console.info(" - Raycaster HIT/CLICK on object scene")
  console.info(" - Light cast shadow multi lights")
  console.info(" - MeshMorpher and geoTypesForMorph")
  console.info(" - CollisionSystem (non-physics)")
  console.info(" - CameraPath (Cinematic camera options)")
  console.info(" - NEXT FOR NPM - Run Visual Scripting Editor")
  console.info("--------------------------------------------")
}

export {
  MatrixEngineWGPU,
  touchCoordinate,
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
  uploadGLBModel,
  randomIntFromTo,
  randomFloatFromTo,
  isMobile,
  KaleidoscopePresets,
  KaleidoscopeEmitter,
  KaleidoscopeEffect,
  PVector,
  CameraPath,
  SWITCHER,
  OSCILLATOR,
  CollisionSystem,
  MeshMorpher,
  geoTypesForMorph,
  about
}