/**
* MatrixEngine Raycaster (improved)
* Author: Nikola Lukić
* Version: 2.0
*/

import {mat4, vec3, vec4} from "wgpu-matrix";

export let touchCoordinate = {
  enabled: false,
  x: 0,
  y: 0,
  stopOnFirstDetectedHit: false,
};

const _invProj = mat4.create();
const _invView = mat4.create();
const _clip = new Float32Array([0, 0, 1, 1]);
const _rayOrigin = new Float32Array(3);

export function getRayFromMouse(event, canvas, camera) {
  const rect = canvas.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  const y = -(((event.clientY - rect.top) / rect.height) * 2 - 1);

  mat4.inverse(camera.projectionMatrix, _invProj);
  mat4.inverse(camera.view, _invView);

  _clip[0] = x;
  _clip[1] = y;
  let eye = vec4.transformMat4(_clip, _invProj);
  eye = [eye[0], eye[1], -1, 0];
  const worldDir4 = vec4.transformMat4(eye, _invView);
  const rayDirection = vec3.normalize([worldDir4[0], worldDir4[1], worldDir4[2]]);

  _rayOrigin[0] = camera.position[0];
  _rayOrigin[1] = camera.position[1];
  _rayOrigin[2] = camera.position[2];

  return {rayOrigin: _rayOrigin, rayDirection, screen: {x, y}};
}

// Backward compatibility alias
export const getRayFromMouse2 = getRayFromMouse;

export function rayIntersectsSphere(rayOrigin, rayDirection, sphereCenter, sphereRadius) {
  const center = [sphereCenter.x, sphereCenter.y, sphereCenter.z];
  const oc = vec3.subtract(rayOrigin, center);
  const a = vec3.dot(rayDirection, rayDirection);
  const b = 2.0 * vec3.dot(oc, rayDirection);
  const c = vec3.dot(oc, oc) - sphereRadius * sphereRadius;
  const discriminant = b * b - 4 * a * c;

  if(discriminant < 0) return null;
  const t = (-b - Math.sqrt(discriminant)) / (2.0 * a);
  if(t < 0) return null;

  const hitPoint = vec3.add(rayOrigin, vec3.mulScalar(rayDirection, t));
  const hitNormal = vec3.normalize(vec3.subtract(hitPoint, center));
  return {t, hitPoint, hitNormal};
}

export function computeAABB(vertices) {
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  for(let i = 0;i < vertices.length;i += 3) {
    min[0] = Math.min(min[0], vertices[i]);
    min[1] = Math.min(min[1], vertices[i + 1]);
    min[2] = Math.min(min[2], vertices[i + 2]);
    max[0] = Math.max(max[0], vertices[i]);
    max[1] = Math.max(max[1], vertices[i + 1]);
    max[2] = Math.max(max[2], vertices[i + 2]);
  }
  return [min, max];
}

// Ray-AABB intersection returning distance (slab method)
export function rayIntersectsAABB(rayOrigin, rayDirection, boxMin, boxMax) {
  let tmin = (boxMin[0] - rayOrigin[0]) / rayDirection[0];
  let tmax = (boxMax[0] - rayOrigin[0]) / rayDirection[0];
  if(tmin > tmax) [tmin, tmax] = [tmax, tmin];

  let tymin = (boxMin[1] - rayOrigin[1]) / rayDirection[1];
  let tymax = (boxMax[1] - rayOrigin[1]) / rayDirection[1];
  if(tymin > tymax) [tymin, tymax] = [tymax, tymin];

  if(tmin > tymax || tymin > tmax) return null;
  if(tymin > tmin) tmin = tymin;
  if(tymax < tmax) tmax = tymax;

  let tzmin = (boxMin[2] - rayOrigin[2]) / rayDirection[2];
  let tzmax = (boxMax[2] - rayOrigin[2]) / rayDirection[2];
  if(tzmin > tzmax) [tzmin, tzmax] = [tzmax, tzmin];

  if(tmin > tzmax || tzmin > tmax) return null;
  const t = Math.max(tmin, 0.0);
  const hitPoint = vec3.add(rayOrigin, vec3.mulScalar(rayDirection, t));
  return {t, hitPoint};
}

export function computeWorldVertsAndAABB(object) {
  // const modelMatrix = object.getModelMatrix(object.position, true);
  // const worldVerts = [];
  // if(object.meshA) {
  //   for(let i = 0;i < object.meshA.vertices.length;i += 3) {
  //     const local = [object.meshA.vertices[i], object.meshA.vertices[i + 1], object.meshA.vertices[i + 2]];
  //     const world = vec3.transformMat4(local, modelMatrix);
  //     worldVerts.push(...world);
  //   }
  // } else {
  //   for(let i = 0;i < object.mesh.vertices.length;i += 3) {
  //     const local = [object.mesh.vertices[i], object.mesh.vertices[i + 1], object.mesh.vertices[i + 2]];
  //     const world = vec3.transformMat4(local, modelMatrix);
  //     worldVerts.push(...world);
  //   }
  // }
  // const [boxMin, boxMax] = computeAABB(worldVerts);
  // return {modelMatrix, worldVerts, boxMin, boxMax};

  // Return cached AABB if object hasn't moved
  if(object._aabbCache &&
    object._aabbCache.x === object.position.x &&
    object._aabbCache.y === object.position.y &&
    object._aabbCache.z === object.position.z) {
    return object._aabbCache;
  }

  const modelMatrix = object.getModelMatrix(object.position, true);
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  const verts = object.meshA ? object.meshA.vertices : object.mesh.vertices;

  // Compute AABB directly without building worldVerts array
  for(let i = 0;i < verts.length;i += 3) {
    const world = vec3.transformMat4(
      [verts[i], verts[i + 1], verts[i + 2]],
      modelMatrix
    );
    min[0] = Math.min(min[0], world[0]);
    min[1] = Math.min(min[1], world[1]);
    min[2] = Math.min(min[2], world[2]);
    max[0] = Math.max(max[0], world[0]);
    max[1] = Math.max(max[1], world[1]);
    max[2] = Math.max(max[2], world[2]);
  }

  // Cache result with position snapshot
  object._aabbCache = {
    modelMatrix,
    boxMin: min,
    boxMax: max,
    x: object.position.x,
    y: object.position.y,
    z: object.position.z
  };

  return object._aabbCache;
}

// 🧠 Dispatch rich event
function dispatchRayHitEvent(canvas, data) {
  if(data.eventName == 'click') {
    canvas.dispatchEvent(new CustomEvent("ray.hit.event", {detail: data}));
  } else if(data.eventName == 'mousedown') {
    canvas.dispatchEvent(new CustomEvent("ray.hit.mousedown", {detail: data}));
  } else {
    canvas.dispatchEvent(new CustomEvent("ray.hit.event.mm", {detail: data}));
  }
}

export function addRaycastsListener(canvasId = "canvas1", eventName = 'click') {
  const canvas = document.getElementById(canvasId);
  if(!canvas) {
    console.warn(`[Raycaster] Canvas with id '${canvasId}' not found.`);
    return;
  }

  canvas.addEventListener(eventName, (event) => {
    const camera = app.cameras[app.mainCameraParams.type];
    const {rayOrigin, rayDirection, screen} = getRayFromMouse(event, canvas, camera);
    let closestHit = null;

    for(const object of app.mainRenderBundle) {
      if(!object.raycast?.enabled) continue;

      const {boxMin, boxMax} = computeWorldVertsAndAABB(object);
      const hitAABB = rayIntersectsAABB(rayOrigin, rayDirection, boxMin, boxMax);
      if(!hitAABB) continue;

      const sphereHit = rayIntersectsSphere(rayOrigin, rayDirection, object.position, object.raycast.radius);
      const hit = sphereHit || hitAABB;

      if(hit && (!closestHit || hit.t < closestHit.t)) {
        closestHit = {...hit, hitObject: object};
        if(touchCoordinate.stopOnFirstDetectedHit) break;
      }
    }

    if(closestHit) {
      dispatchRayHitEvent(canvas, {
        hitObject: closestHit.hitObject,
        hitPoint: closestHit.hitPoint,
        hitNormal: closestHit.hitNormal || null,
        hitDistance: closestHit.t,
        rayOrigin,
        rayDirection,
        screenCoords: screen,
        camera,
        timestamp: performance.now(),
        button: event.button,
        eventName: eventName
      });
    }
  });
}

export function addRaycastsAABBListener(canvasId = "canvas1", eventName = 'click') {
  const canvas = document.getElementById(canvasId);
  if(!canvas) {
    console.warn(`[Raycaster] Canvas with id '${canvasId}' not found.`);
    return;
  }

  canvas.addEventListener(eventName, (event) => {
    const camera = app.cameras[app.mainCameraParams.type];
    const {rayOrigin, rayDirection, screen} = getRayFromMouse(event, canvas, camera);
    let closestHit = null;

    for(const object of app.mainRenderBundle) {
      if(!object.raycast?.enabled) continue;
      const {boxMin, boxMax} = computeWorldVertsAndAABB(object);
      const hitAABB = rayIntersectsAABB(rayOrigin, rayDirection, boxMin, boxMax);
      if(!hitAABB) continue;
      const hit = hitAABB;
      if(hit && (!closestHit || hit.t < closestHit.t)) {
        closestHit = {...hit, hitObject: object};
        if(touchCoordinate.stopOnFirstDetectedHit) break;
      }
    }

    if(closestHit) {
      dispatchRayHitEvent(canvas, {
        hitObject: closestHit.hitObject,
        hitPoint: closestHit.hitPoint,
        hitNormal: closestHit.hitNormal || null,
        hitDistance: closestHit.t,
        rayOrigin,
        rayDirection,
        screenCoords: screen,
        camera,
        timestamp: performance.now(),
        button: event.button,
        eventName: eventName
      });
    }
  });
}
