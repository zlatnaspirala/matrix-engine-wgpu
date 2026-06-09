/**
 * @examples
 * MATRIX_ENGINE_WGPU EXAMPLE WORKSPACE
 * @version 1.15.6
 * @www maximumroulette.com 2026
 */

import {loadCameraTexture} from "./examples/camera-texture.js";
// import {fontana} from "./examples/fontana.js";
import {loadGLBLoader} from "./examples/glb-loader.js";
import {myLights} from "./examples/my-lights.js";
import {loadObjFile} from "./examples/load-obj-file.js";
import {loadObjsSequence} from "./examples/load-objs-sequence.js";
import {physicsPlayground} from "./examples/physics-playground.js";
import {procMesh} from "./examples/procedural-mesh.js";
import {snakeLightsInstanced} from "./examples/snake-lights-instanced.js";
import {snakeLights} from "./examples/snake-lights.js";
import {loadVideoTexture} from "./examples/video-texture.js";
import {byId, isMobile, urlQuery} from "./src/engine/utils.js";
import {mazeGame} from "./examples/maze.js";
import {flipperJolt} from "./examples/flipper-jolt.js";
import {flipperAmmo} from "./examples/flipper-ammo.js";
import {testJolt} from "./examples/physics-test-jolt.js";
import {testCannonES} from "./examples/physics-test-cannones.js";
import {canvasInline} from "./examples/canvas-inline.js";
import {loadCinematicCamera} from "./examples/cinematic-camera.js";
import {loadDestructionProcedural} from "./examples/destruction-procedural.js";
import {loadKale} from "./examples/kale.js";
import {loadHZB} from "./examples/hzb-ray.js";
import {loadKinematicCollision} from "./examples/kinematic-collision.js";
import {loadSprite1} from "./examples/2D-world.js";
import {loadSprite2} from "./examples/2D-world-matter.js";
import {loadDrumCannon} from "./examples/drum-cannon.js";
import {uploadGLBModel} from "./src/engine/loaders/webgpu-gltf.js";
import {loadGaussianSplat} from "./examples/gaussian-splat.js";

window.urlQ = urlQuery;

if('serviceWorker' in navigator) {
  if(location.hostname.indexOf('localhost') == -1) {
    navigator.serviceWorker.register('cache.js');
  }
}

const switchDemo = (id) => {
  const url = new URL(window.location.href);
  url.searchParams.set('demo', id);
  window.location.href = url.toString();
};

const hideMenu = () => {
  document.getElementById('examples').style.left = "-150px";
}

byId('loadObjFile').addEventListener("click", () => switchDemo('1'));
byId('physicsPlayground').addEventListener("click", () => switchDemo('2'));
byId('camera-texture').addEventListener("click", () => switchDemo('3'));
byId('video-texture').addEventListener("click", () => switchDemo('4'));
byId('objs-anim').addEventListener("click", () => switchDemo('5'));
byId('glb-loader').addEventListener("click", () => switchDemo('6'));
byId('procedural-mesh').addEventListener("click", () => switchDemo('7'));
byId('myLights').addEventListener("click", () => switchDemo('9'));
byId('snake-light').addEventListener("click", () => switchDemo('10'));
byId('snake-light-instanced').addEventListener("click", () => switchDemo('11'));
byId('maze').addEventListener("click", () => switchDemo('12'));
byId('flipper-jolt').addEventListener("click", () => switchDemo('13'));

if (isMobile() === true) {
  byId('flipper-ammo').remove();
} else {
  byId('flipper-ammo').addEventListener("click", () => switchDemo('14'));
}

byId('test-jolt').addEventListener("click", () => switchDemo('15'));
byId('test-cannones').addEventListener("click", () => switchDemo('16'));
byId('canvas-inline').addEventListener("click", () => switchDemo('17'));
byId('cinematicCamera').addEventListener("click", () => switchDemo('18'));
byId('destruction-procedure').addEventListener("click", () => switchDemo('19'));
byId('loadkale').addEventListener("click", () => switchDemo('20'));
byId('loadhzb').addEventListener("click", () => switchDemo('21'));
byId('loadKCollision').addEventListener("click", () => switchDemo('22'));
byId('loadSprite1').addEventListener("click", () => switchDemo('23'));
byId('loadSprite2').addEventListener("click", () => switchDemo('24'));
byId('loadDrumCannon').addEventListener("click", () => switchDemo('25'));
byId('loadGaussianSplat').addEventListener("click", () => switchDemo('26'));
byId('jamb').addEventListener("click", () => window.open('https://goldenspiral.itch.io/jamb-3d-deluxe', '_blank'));
// byId('moba').addEventListener("click", () => window.open('https://goldenspiral.itch.io/forest-of-hollow-blood', '_blank'));
byId('moba').addEventListener("click", () => window.open('https://maximumroulette.com/apps/fohb', '_blank'));

window.loadObjFile = loadObjFile;

if(urlQ['demo'] === '1') {
  loadObjFile();
} else if(urlQ['demo'] === '2') {
  physicsPlayground();
} else if(urlQ['demo'] === '3') {
  loadCameraTexture();
} else if(urlQ['demo'] === '4') {
  loadVideoTexture();
} else if(urlQ['demo'] === '5') {
  loadObjsSequence();
} else if(urlQ['demo'] === '6') {
  loadGLBLoader();
} else if(urlQ['demo'] === '7') {
  procMesh();
} else if(urlQ['demo'] === '8') {
  loadObjFile();
} else if(urlQ['demo'] === '9') {
  myLights();
} else if(urlQ['demo'] === '10') {
  snakeLights();
} else if(urlQ['demo'] === '11') {
  snakeLightsInstanced();
} else if(urlQ['demo'] === '12') {
  mazeGame();
} else if(urlQ['demo'] === '13') {
  flipperJolt();
} else if(urlQ['demo'] === '14') {
  flipperAmmo();
} else if(urlQ['demo'] === '15') {
  testJolt();
} else if(urlQ['demo'] === '16') {
  testCannonES();
} else if(urlQ['demo'] === '17') {
  canvasInline();
} else if(urlQ['demo'] === '18') {
  loadCinematicCamera();
} else if(urlQ['demo'] === '19') {
  loadDestructionProcedural();
} else if(urlQ['demo'] === '20') {
  loadKale();
} else if(urlQ['demo'] === '21') {
  loadHZB();
} else if(urlQ['demo'] === '22') {
  loadKinematicCollision();
} else if(urlQ['demo'] === '23') {
  loadSprite1();
} else if(urlQ['demo'] === '24') {
  loadSprite2();
} else if(urlQ['demo'] === '25') {
  loadDrumCannon();
}  else if(urlQ['demo'] === '26') {
  loadGaussianSplat();
} else {
  loadObjFile();
}

setTimeout(() => {hideMenu()}, 2000);

// Pre cache politic 0 Only big one
fetch("res/meshes/glb/monster.glb");
fetch("./res/meshes/glb/woman1.glb");
