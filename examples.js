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
import {unlitTextures} from "./examples/unlit-textures.js";
import {loadVideoTexture} from "./examples/video-texture.js";
import {byId} from "./src/engine/utils.js";

function destroyJambDoms() {
  if(byId('hud')) byId('hud').remove();
  if(byId('jambTable')) byId('jambTable').remove();
  if(byId('topTitleDOM')) byId('topTitleDOM').remove();
}

byId('loadObjFile').addEventListener("click", () => {
  if(typeof app !== "undefined") app.destroyProgram()
  destroyJambDoms();
  loadObjFile();
})

byId('physicsPlayground').addEventListener("click", () => {
  if(typeof app !== "undefined") {
    // still not perfect
    app.destroyProgram();
    app = undefined;
  }
  destroyJambDoms();
  physicsPlayground();
})

byId('unlitTextures').addEventListener("click", () => {
  // byId('unlitTextures').setAttribute('disabled', true)
  // byId('loadObjFile').removeAttribute('disabled')
  if(typeof app !== "undefined") app.destroyProgram()
  destroyJambDoms();
  unlitTextures();
})

byId('camera-texture').addEventListener("click", () => {
  if(typeof app !== "undefined") app.destroyProgram()
  destroyJambDoms();
  loadCameraTexture();
})

byId('video-texture').addEventListener("click", () => {
  if(typeof app !== "undefined") app.destroyProgram()
  destroyJambDoms();
  loadVideoTexture();
})

byId('glb-loader').addEventListener("click", () => {
  if(typeof app !== "undefined") app.destroyProgram()
  loadGLBLoader();
})

byId('jamb').addEventListener("click", () => {
  open("https://maximumroulette.com/apps/fohb");
})

byId('objs-anim').addEventListener("click", () => {
  if(typeof app !== "undefined") app.destroyProgram()
  destroyJambDoms();
  loadObjsSequence()
})
