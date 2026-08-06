/**
 * This file created by:
 * @author Nikola Lukic 
 * @email zlatnaspirala@gmail.com mart 2024-2026
 * @description npm import/export sync with
 * @version 1.18.6
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
import {byId, CameraPath, geometryTypes, geoTypesForMorph, getOrientation, isMobile, ORBIT, OSCILLATOR, randomFloatFromTo, randomIntFromTo, SWITCHER, vecOf} from "./src/engine/utils.js";
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
import {followPath, loadNavMesh} from "./src/engine/buildin/navigation-plane/navigation.js";
// Deplace src path in future.
import {MatrixTTS} from "./examples/games/moba/tts.js";
import {WaterSimEffect} from "./src/engine/effects/waterSimEffect.js";
import {animateRotationY} from "./src/engine/procedures/sceneobjectKinematics.js";
import {BVHSkeletal} from "./src/engine/loaders/raw-bvh-skeletal.js";
import {ParticleActionEmitter} from './src/engine/effects/particles.js'
// Top level
import {Player} from "./src/engine/plugin/player-object/player.js";
import {MEConfig} from "./src/me-config.js";
import {mocapCsCmuEdu} from "./public/res/bvh/mocap.cs.cmu.edu/mocap.js";

export {
  MatrixEngineWGPU,
  MEConfig,
  touchCoordinate,
  addRaycastsListener,
  KaleidoscopeEffect,
  InstancedKinematicOperations,
  SpritesPack2D,
  mb,
  Player,
  mocapCsCmuEdu,
  geometryTypes,
  ParticleActionEmitter,
  byId,
  vecOf,
  BVHSkeletal,
  animateRotationY,
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
  loadNavMesh,
  followPath,
  WaterSimEffect,
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
}