/**
 * @examples
 * MATRIX_ENGINE_WGPU EXAMPLE WORKSPACE
 * Nikola Lukic 2024
 */

// import {loadJamb} from "./examples/load-jamb.js";
import {loadCameraTexture} from "./examples/camera-texture.js";
import {loadObjFile} from "./examples/load-obj-file.js";
import {loadObjsSequence} from "./examples/load-objs-sequence.js";
import {unlitTextures} from "./examples/unlit-textures.js";
import {loadVideoTexture} from "./examples/video-texture.js";
import {byId} from "./src/engine/utils.js";

// For future
var examples = {
  // loadJamb,
  loadObjFile,
  unlitTextures,
  loadVideoTexture
};

function destroyJambDoms() {
  if(byId('hud')) byId('hud').remove();
  if(byId('jambTable')) byId('jambTable').remove();
  if(byId('topTitleDOM')) byId('topTitleDOM').remove();
}

byId('loadObjFile').addEventListener("click", () => {
  // byId('loadObjFile').setAttribute('disabled', true)
  // byId('unlitTextures').removeAttribute('disabled')
  if(typeof app !== "undefined") app.destroyProgram()
  destroyJambDoms();
  loadObjFile();
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

byId('jamb').addEventListener("click", () => {
  // byId('unlitTextures').setAttribute('disabled', true)
  // byId('loadObjFile').setAttribute('disabled', true)
  // byId('jamb').removeAttribute('disabled')
  if(typeof app !== "undefined") app.destroyProgram()
  destroyJambDoms();
  // loadJamb()
})

byId('objs-anim').addEventListener("click", () => {
  // byId('unlitTextures').setAttribute('disabled', true)
  // byId('loadObjFile').setAttribute('disabled', true)
  // byId('jamb').removeAttribute('disabled')
  if(typeof app !== "undefined") app.destroyProgram()
  destroyJambDoms();
  loadObjsSequence()
})
