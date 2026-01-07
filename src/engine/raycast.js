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

function multiplyMatrixVector(matrix, vector) {
  return vec4.transformMat4(vector, matrix);
}

export function getRayFromMouse(event, canvas, camera) {
  const rect = canvas.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  const y = -(((event.clientY - rect.top) / rect.height) * 2 - 1); // flip Y (WebGPU NDC)

  // Use precomputed projection if available
  const invProjection = mat4.inverse(camera.projectionMatrix);
  const invView = mat4.inverse(camera.view);

  const clip = [x, y, 1, 1];
  let eye = vec4.transformMat4(clip, invProjection);
  eye = [eye[0], eye[1], -1, 0];
  const worldDir4 = vec4.transformMat4(eye, invView);
  const rayDirection = vec3.normalize([worldDir4[0], worldDir4[1], worldDir4[2]]);
  const rayOrigin = [...camera.position];
  return {rayOrigin, rayDirection, screen: {x, y}};
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
  const modelMatrix = object.getModelMatrix(object.position);
  const worldVerts = [];
  for(let i = 0;i < object.mesh.vertices.length;i += 3) {
    const local = [object.mesh.vertices[i], object.mesh.vertices[i + 1], object.mesh.vertices[i + 2]];
    const world = vec3.transformMat4(local, modelMatrix);
    worldVerts.push(...world);
  }
  const [boxMin, boxMax] = computeAABB(worldVerts);
  return {modelMatrix, worldVerts, boxMin, boxMax};
}

// 🧠 Dispatch rich event
function dispatchRayHitEvent(canvas, data) {
  if (data.eventName == 'click') {
    canvas.dispatchEvent(new CustomEvent("ray.hit.event", {detail: data}));
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
