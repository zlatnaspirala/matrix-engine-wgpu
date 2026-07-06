/**
 * This file created by:
 * @author Nikola Lukic 
 * @email zlatnaspirala@gmail.com mart 2024-2026
 * @description npm import/export
 * Sync with version 1.16.2
 * @version 1.16.2
 */

import MatrixEngineWGPU from "./src/world.js";
import {downloadMeshes, makeObjSeqArg} from "./src/engine/loader-obj.js";
import {
  addRaycastsAABBListener,
  addRaycastsListener, getRayFromMouse,
  getRayFromMouse2, rayIntersectsSphere,
  computeWorldVertsAndAABB, rayIntersectsAABB,
  computeAABB,
  touchCoordinate
} from "./src/engine/raycast.js";
import {CameraPath, geoTypesForMorph, getOrientation, isMobile, ORBIT, OSCILLATOR, randomFloatFromTo, randomIntFromTo, SWITCHER} from "./src/engine/utils.js";
import {uploadGLBModel} from "./src/engine/loaders/webgpu-gltf.js";
import {MeshMorpher} from "./src/engine/procedural-mesh.js";
import {CollisionSystem} from "./src/engine/collision-sub-system.js";
import {KaleidoscopeEmitter} from "./src/engine/effects/kaleidoscopeEffectInstance.js";
import {KaleidoscopeEffect, KaleidoscopePresets} from "./src/engine/effects/KaleidoscopeEffect.js";
import {PVector} from "./src/engine/matrix-class.js";
import {MapCreator} from "./src/engine/buildin/map-creator/map-creator.js";
import {ProjectileSystem} from './src/engine/procedures/fps-projectile.js';
import {MobileDOM} from './src/engine/cameras.js';
import {mb} from "./src/engine/utils.js";
import {GenGeoTexture2} from "./src/engine/effects/gen-tex2.js";
import {MatrixStream} from "./src/engine/networking/net.js";
import {GaussianSplatScene, SplatColorAnimator, SplatPositionAnimator} from "./src/engine/effects/splat.js";
import {initializeSpritesForMesh, SpritesPack2D} from "./src/engine/effects/sprite2d2.js";
import {InstancedKinematicOperations} from "./src/engine/procedures/InstancedKinematicOperations.js";
import {MatrixTTS} from "./examples/games/moba/tts.js";

const about = () => {
  console.info("npm i matrix-engine-wgpu ver 1.16.2 is ready.")
  console.info("--------------------------------------------")
  console.info("List of features: ")
  console.info(" - Loading obj files with uvs.")
  console.info(" - Loading glb binary file - animations, trail (delay) effects.")
  console.info(" - Scene camera use -z front.")
  console.info(" - position, rotation - same like matrix-engine.")
  console.info(" - Physics used Ammo.js build, cannones, matterjs and joltjs.")
  console.info(" - Raycaster HIT/CLICK on object scene.")
  console.info(" - Light cast shadow multi lights.")
  console.info(" - MeshMorpher and geoTypesForMorph.")
  console.info(" - CollisionSystem (no physics libs) pure kinematic observer.")
  console.info(" - CameraPath (Cinematic camera options)")
  console.info(" - makeObjSeqArg is only for object sequence scene object(pre loaded - morph)")
  console.info(" - MapCreator, ProjectileSystem - non physics world based on colliderSystem.")
  console.info(" - MobileDOM - creating joystick or any hud button.")
  console.info(" - MatrixStream is deeply integrated in core but still you can use it in direct way.")
  console.info(" - KaleidoscopeEffect, GenGeoTexture2 are effect class see examples with instancing in direct way (not all effects supported in arg pointerEffect {}).")
  console.info(" - GaussianSplatScene, SplatColorAnimator, SplatPositionAnimator (see examples).")
  console.info(" - InstancedKinematicOperations, initializeSpritesForMesh, SpritesPack2D (see examples).")
  console.info(" - MatrixTTS for speach real time no sources files(see moba game example).")
  console.info(" - NEXT FEATURES : Run Editor & Visual Scripting Editor from npm package.")
  console.info("--------------------------------------------")
}

export {
  MatrixEngineWGPU,
  touchCoordinate,
  addRaycastsListener,
  KaleidoscopeEffect,
  InstancedKinematicOperations,
  SpritesPack2D,
  mb,
  initializeSpritesForMesh,
  downloadMeshes,
  rayIntersectsSphere,
  getRayFromMouse,
  getRayFromMouse2,
  addRaycastsAABBListener,
  rayIntersectsAABB,
  computeAABB,
  computeWorldVertsAndAABB,
  makeObjSeqArg,
  uploadGLBModel,
  randomIntFromTo,
  randomFloatFromTo,
  isMobile,
  ORBIT,
  getOrientation,
  KaleidoscopePresets,
  GaussianSplatScene,
  SplatColorAnimator,
  SplatPositionAnimator,
  KaleidoscopeEmitter,
  PVector,
  CameraPath,
  SWITCHER,
  OSCILLATOR,
  CollisionSystem,
  MapCreator,
  ProjectileSystem,
  MeshMorpher,
  GenGeoTexture2,
  MatrixStream,
  MatrixTTS,
  MobileDOM,
  geoTypesForMorph,
  about
}