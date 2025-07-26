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
  // simple invert
  x = -x;
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
      worldPos[2] / worldPos[3],
      worldPos[1] / worldPos[3]
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
  rayDirection[2] = -rayDirection[2];
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

export function addRaycastListener() {
  let canvasDom = document.getElementById("canvas1");
  canvasDom.addEventListener('click', (event) => {
    let camera = app.cameras.WASD;
    const {rayOrigin, rayDirection} = getRayFromMouse(event, canvasDom, camera);
    for(const object of app.mainRenderBundle) {
      if(rayIntersectsSphere(rayOrigin, rayDirection, object.position, object.raycast.radius)) {
        console.log('Object clicked:', object.name);
        // Just like in matrix-engine webGL version "ray.hit.event"
        dispatchEvent(new CustomEvent('ray.hit.event', {
          detail: {
            hitObject: object
          }
        }))
      }
    }
  });
}