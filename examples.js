/**
 * @examples
 * MATRIX_ENGINE_WGPU EXAMPLE WORKSPACE
 * 2026
 */

import {loadCameraTexture} from "./examples/camera-texture.js";
import {fontana} from "./examples/fontana.js";
import {loadGLBLoader} from "./examples/glb-loader.js";
import {myLights} from "./examples/my-lights.js";
import {loadObjFile} from "./examples/load-obj-file.js";
import {loadObjsSequence} from "./examples/load-objs-sequence.js";
import {physicsPlayground} from "./examples/physics-playground.js";
import {procMesh} from "./examples/procedural-mesh.js";
import {snakeLightsInstanced} from "./examples/snake-lights-instanced.js";
import {snakeLights} from "./examples/snake-lights.js";
import {loadVideoTexture} from "./examples/video-texture.js";
import {byId, urlQuery} from "./src/engine/utils.js";
import {mazeGame} from "./examples/maze.js";
import {flipper} from "./examples/flipper.js";

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
byId('fontana').addEventListener("click", () => switchDemo('8'));
byId('myLights').addEventListener("click", () => switchDemo('9'));
byId('snake-light').addEventListener("click", () => switchDemo('10'));
byId('snake-light-instanced').addEventListener("click", () => switchDemo('11'));
byId('maze').addEventListener("click", () => switchDemo('12'));
byId('flipper').addEventListener("click", () => switchDemo('13'));
byId('jamb').addEventListener("click", () => window.open('https://goldenspiral.itch.io/jamb-3d-deluxe', '_blank'));
byId('moba').addEventListener("click", () => window.open('https://goldenspiral.itch.io/forest-of-hollow-blood', '_blank'));


if(urlQ['demo'] === '1') {
  loadObjFile();
  setTimeout(()=> {hideMenu()}, 2000);
} else if(urlQ['demo'] === '2') {
  physicsPlayground();
  setTimeout(()=> {hideMenu()}, 2000);
} else if(urlQ['demo'] === '3') {
  loadCameraTexture();
  setTimeout(()=> {hideMenu()}, 2000);
} else if(urlQ['demo'] === '4') {
  loadVideoTexture();
  setTimeout(()=> {hideMenu()}, 2000);
} else if(urlQ['demo'] === '5') {
  loadObjsSequence();
  setTimeout(()=> {hideMenu()}, 2000);
} else if(urlQ['demo'] === '6') {
  loadGLBLoader();
  setTimeout(()=> {hideMenu()}, 2000);
} else if(urlQ['demo'] === '7') {
  procMesh();
  setTimeout(()=> {hideMenu()}, 2000);
} else if(urlQ['demo'] === '8') {
  fontana();
  setTimeout(()=> {hideMenu()}, 2000);
} else if(urlQ['demo'] === '9') {
  myLights();
  setTimeout(()=> {hideMenu()}, 2000);
} else if(urlQ['demo'] === '10') {
  snakeLights();
  setTimeout(()=> {hideMenu()}, 2000);
} else if(urlQ['demo'] === '11') {
  snakeLightsInstanced();
  setTimeout(()=> {hideMenu()}, 2000);
} else if(urlQ['demo'] === '12') {
  mazeGame();
  setTimeout(()=> {hideMenu()}, 2000);
} else if(urlQ['demo'] === '13') {
  flipper();
  setTimeout(()=> {hideMenu()}, 2000);
} else if(urlQ['demo'] === '14') {
  //
} else {
  flipper();
  setTimeout(()=> {hideMenu()}, 2000);
}
