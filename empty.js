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

window.MatrixEngineWGPU = MatrixEngineWGPU;

window.theBeast = {
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
  MobileDOM,
  geoTypesForMorph
}
 
