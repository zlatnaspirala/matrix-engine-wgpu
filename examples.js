/**
 * @examples
 * MATRIX_ENGINE_WGPU EXAMPLE WORKSPACE
 * 2026
 */

import {loadCameraTexture} from "./examples/camera-texture.js";
import {fontana} from "./examples/fontana.js";
import {loadGLBLoader} from "./examples/glb-loader.js";
import {myLights} from "./examples/lights-test.js";
import {loadObjFile} from "./examples/load-obj-file.js";
import {loadObjsSequence} from "./examples/load-objs-sequence.js";
import {physicsPlayground} from "./examples/physics-playground.js";
import {procMesh} from "./examples/procedural-mesh.js";
import {snakeLightsInstanced} from "./examples/snake-lights-instanced.js";
import {snakeLights} from "./examples/snake-lights.js";
import {loadVideoTexture} from "./examples/video-texture.js";
import {byId, urlQuery} from "./src/engine/utils.js";

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

if(urlQ['demo'] === '1') {
  loadObjFile();
} else if(urlQ['demo'] === '2') {
  physicsPlayground()
} else if(urlQ['demo'] === '3') {
  loadCameraTexture();
} else if(urlQ['demo'] === '4') {
  loadVideoTexture();
} else if(urlQ['demo'] === '5') {
  loadObjsSequence()
} else if(urlQ['demo'] === '6') {
  loadGLBLoader();
} else if(urlQ['demo'] === '7') {
  procMesh();
} else if(urlQ['demo'] === '8') {
  fontana();
} else if(urlQ['demo'] === '9') {
  myLights();
} else if(urlQ['demo'] === '10') {
  snakeLights();
} else if(urlQ['demo'] === '11') {
  snakeLightsInstanced();
}


