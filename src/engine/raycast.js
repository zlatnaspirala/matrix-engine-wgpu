/**
 * @author Nikola Lukic
 * @email zlatnaspirala@gmail.com
 * @site https://maximumroulette.com
 * @Licence GPL v3
 * @credits chatgpt used for this script adaptation.
 * @Note matrix-engine-wgpu adaptation test
 * default for now:
 * app.cameras['WASD']
 * Only tested for WASD type of camera.
 * app is global - will be fixed in future
 */
import {mat4, vec3, vec4} from "wgpu-matrix";
let rayHitEvent;

export let touchCoordinate = {
  enabled: false,
  x: 0,
  y: 0,
  stopOnFirstDetectedHit: false
};

function multiplyMatrixVector(matrix, vector) {
  return vec4.transformMat4(vector, matrix);
}

export function getRayFromMouse(event, canvas, camera) {
  const rect = canvas.getBoundingClientRect();
  let x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  let y = ((event.clientY - rect.top) / rect.height) * 2 - 1;
  y = -y; // flip Y only (WebGPU NDC)

  const aspect = canvas.width / canvas.height;
  camera.projectionMatrix = mat4.perspective((2 * Math.PI) / 5, aspect, 0.1, 1000);

  const invProjection = mat4.inverse(camera.projectionMatrix);
  const invView = mat4.inverse(camera.view);

  // NDC -> clip -> eye -> world
  let clip = [x, y, 1, 1];
  let eye = vec4.transformMat4(clip, invProjection);
  eye = [eye[0], eye[1], -1, 0]; // direction in view space

  let worldDir = vec4.transformMat4(eye, invView);
  const rayDirection = vec3.normalize([worldDir[0], worldDir[1], worldDir[2]]);

  const rayOrigin = [...camera.position];
  return {rayOrigin, rayDirection};
}
// export function getRayFromMouse(event, canvas, camera) {
//   const rect = canvas.getBoundingClientRect();
//   let x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
//   let y = ((event.clientY - rect.top) / rect.height) * 2 - 1;
//   // simple invert
//   x = -x;
//   y = -y;
//   const fov = Math.PI / 4;
//   const aspect = canvas.width / canvas.height;
//   const near = 0.1;
//   const far = 1000;
//   camera.projectionMatrix = mat4.perspective((2 * Math.PI) / 5, aspect, 1, 1000.0);
//   const invProjection = mat4.inverse(camera.projectionMatrix);
//   const invView = mat4.inverse(camera.view);
//   const ndc = [x, y, 1, 1];
//   let worldPos = multiplyMatrixVector(invProjection, ndc);
//   worldPos = multiplyMatrixVector(invView, worldPos);
//   let world;
//   if(worldPos[3] !== 0) {
//     world = [
//       worldPos[0] / worldPos[3],
//       worldPos[2] / worldPos[3],
//       worldPos[1] / worldPos[3]
//     ];
//   } else {
//     console.log("[raycaster]special case 0.");
//     world = [
//       worldPos[0],
//       worldPos[1],
//       worldPos[2]
//     ];
//   }
//   const rayOrigin = [camera.position[0], camera.position[1], camera.position[2]];
//   const rayDirection = vec3.normalize(vec3.subtract(world, rayOrigin));
//   rayDirection[2] = -rayDirection[2];
//   return {rayOrigin, rayDirection};
// }

export function getRayFromMouse2(event, canvas, camera) {
  const rect = canvas.getBoundingClientRect();
  let x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  let y = ((event.clientY - rect.top) / rect.height) * 2 - 1;
  // simple invert
  y = -y;
  const fov = Math.PI / 4;
  const aspect = canvas.width / canvas.height;
  const near = 0.1;
  const far = 1000;
  camera.projectionMatrix = mat4.perspective((2 * Math.PI) / 5, aspect, 1, 1000.0);
  const invProjection = mat4.inverse(camera.projectionMatrix);
  const invView = mat4.inverse(camera.view);
  const ndc = [x, y, 1, 1];
  let worldPos = multiplyMatrixVector(invProjection, ndc);
  worldPos = multiplyMatrixVector(invView, worldPos);
  let world;
  if(worldPos[3] !== 0) {
    world = [
      worldPos[0] / worldPos[3],
      worldPos[1] / worldPos[3],
      worldPos[2] / worldPos[3]
    ];
  } else {
    console.log("[raycaster]special case 0.");
    world = [
      worldPos[0],
      worldPos[1],
      worldPos[2]
    ];
  }
  const rayOrigin = [camera.position[0], camera.position[1], camera.position[2]];
  const rayDirection = vec3.normalize(vec3.subtract(world, rayOrigin));
  return {rayOrigin, rayDirection};
}

export function rayIntersectsSphere(rayOrigin, rayDirection, sphereCenter, sphereRadius) {
  const pos = [sphereCenter.x, sphereCenter.y, sphereCenter.z];
  const oc = vec3.subtract(rayOrigin, pos);
  const a = vec3.dot(rayDirection, rayDirection);
  const b = 2.0 * vec3.dot(oc, rayDirection);
  const c = vec3.dot(oc, oc) - sphereRadius * sphereRadius;
  const discriminant = b * b - 4 * a * c;
  return discriminant > 0;
}

export function addRaycastListener(canvasId = "canvas1") {
  let canvasDom = document.getElementById(canvasId);
  canvasDom.addEventListener('click', (event) => {
    let camera = app.cameras.WASD;
    const {rayOrigin, rayDirection} = getRayFromMouse(event, canvasDom, camera);
    for(const object of app.mainRenderBundle) {
      if(object.raycast.enabled == true) {
        if(rayIntersectsSphere(rayOrigin, rayDirection, object.position, object.raycast.radius)) {
          // Just like in matrix-engine webGL version "ray.hit.event"
          canvasDom.dispatchEvent(new CustomEvent('ray.hit.event', {
            detail: {
              hitObject: object,
              rayOrigin: rayOrigin,
              rayDirection: rayDirection
            }
          }))
          if(touchCoordinate.stopOnFirstDetectedHit == true) {
            break;
          }
        }
      }
    }
  });
}

// Compute AABB from flat vertices array [x,y,z, x,y,z, ...]
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

// Ray-AABB intersection using slabs method
export function rayIntersectsAABB(rayOrigin, rayDirection, boxMin, boxMax) {
  let tmin = (boxMin[0] - rayOrigin[0]) / rayDirection[0];
  let tmax = (boxMax[0] - rayOrigin[0]) / rayDirection[0];
  if(tmin > tmax) [tmin, tmax] = [tmax, tmin];

  let tymin = (boxMin[1] - rayOrigin[1]) / rayDirection[1];
  let tymax = (boxMax[1] - rayOrigin[1]) / rayDirection[1];
  if(tymin > tymax) [tymin, tymax] = [tymax, tymin];

  if((tmin > tymax) || (tymin > tmax)) return false;
  if(tymin > tmin) tmin = tymin;
  if(tymax < tmax) tmax = tymax;

  let tzmin = (boxMin[2] - rayOrigin[2]) / rayDirection[2];
  let tzmax = (boxMax[2] - rayOrigin[2]) / rayDirection[2];
  if(tzmin > tzmax) [tzmin, tzmax] = [tzmax, tzmin];

  if((tmin > tzmax) || (tzmin > tmax)) return false;

  return true;
}

export function computeWorldVertsAndAABB(object) {
  const modelMatrix = object.getModelMatrix(object.position);
  const worldVerts = [];
  for(let i = 0;i < object.mesh.vertices.length;i += 3) {
    const local = vec3.fromValues(
      object.mesh.vertices[i],
      object.mesh.vertices[i + 1],
      object.mesh.vertices[i + 2]
    );
    const world = vec3.transformMat4(local, modelMatrix); // OK
    worldVerts.push(world[0], world[1], world[2]);
  }
  const [boxMin, boxMax] = computeAABB(worldVerts);
  return {
    modelMatrix,
    worldVerts,
    boxMin,
    boxMax,
  };
}

export function addRaycastsAABBListener(canvasId = "canvas1") {
  const canvasDom = document.getElementById(canvasId);
  if(!canvasDom) {
    console.warn(`Canvas with id ${canvasId} not found`);
    return;
  }

  canvasDom.addEventListener('click', (event) => {
    console.warn(`Canvas click  ${event} `);
    const camera = app.cameras.WASD;
    const {rayOrigin, rayDirection} = getRayFromMouse2(event, canvasDom, camera);
    for(const object of app.mainRenderBundle) {
      const {boxMin, boxMax} = computeWorldVertsAndAABB(object);
      if(object.raycast.enabled == false) return;
      if(rayIntersectsAABB(rayOrigin, rayDirection, boxMin, boxMax)) {
        // console.log('AABB hit:', object.name);
        canvasDom.dispatchEvent(new CustomEvent('ray.hit.event', {
          detail: {hitObject: object},
          rayOrigin: rayOrigin,
          rayDirection: rayDirection
        }));
        if(touchCoordinate.stopOnFirstDetectedHit == true) {
          break;
        }
      }
    }
  });
}