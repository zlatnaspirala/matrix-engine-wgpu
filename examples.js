/**
 * @examples
 * MATRIX_ENGINE_WGPU EXAMPLE WORKSPACE
 */

// import {loadJamb} from "./examples/load-jamb.js";
import {loadCameraTexture} from "./examples/camera-texture.js";
import {loadGLBLoader} from "./examples/glb-loader.js";
import {loadObjFile} from "./examples/load-obj-file.js";
import {loadObjsSequence} from "./examples/load-objs-sequence.js";
import {physicsPlayground} from "./examples/physics-playground.js";
import {loadVideoTexture} from "./examples/video-texture.js";
import {byId, urlQuery} from "./src/engine/utils.js";

window.urlQ = urlQuery;

// A helper function to change the demo without breaking the URL
const switchDemo = (id) => {
  const url = new URL(window.location.href);
  url.searchParams.set('demo', id);
  window.location.href = url.toString();
  // Setting href automatically triggers the reload with the new param
};

// Demo 1
byId('loadObjFile').addEventListener("click", () => switchDemo('1'));

// Demo 2
byId('physicsPlayground').addEventListener("click", () => switchDemo('2'));

// Demo 3
byId('camera-texture').addEventListener("click", () => switchDemo('3'));

// Demo 4
byId('video-texture').addEventListener("click", () => switchDemo('4'));

// Demo 5 - Fixed ID
byId('objs-anim').addEventListener("click", () => switchDemo('5'));

// Demo 6 - Fixed ID
byId('glb-loader').addEventListener("click", () => switchDemo('6'));

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
}