/**
 * @examples
 * MATRIX_ENGINE_WGPU EXAMPLE WORKSPACE
 * Nikola Lukic 2024
 */

import {loadJamb} from "./examples/games/jamb/jamb.js";
import {loadObjFile} from "./examples/load-obj-file.js";
import {loadObjsSequence} from "./examples/load-objs-sequence.js";
import {unlitTextures} from "./examples/unlit-textures.js";
import {byId} from "./src/engine/utils.js";

// For future
var examples = {
  loadJamb,
  loadObjFile,
  unlitTextures
};

byId('loadObjFile').addEventListener("click", () => {
  // byId('loadObjFile').setAttribute('disabled', true)
  // byId('unlitTextures').removeAttribute('disabled')
  if (typeof app !== "undefined") app.destroyProgram()
  loadObjFile()
})

byId('unlitTextures').addEventListener("click", () => {
  // byId('unlitTextures').setAttribute('disabled', true)
  // byId('loadObjFile').removeAttribute('disabled')
  if (typeof app !== "undefined") app.destroyProgram()
  unlitTextures()
})

byId('jamb').addEventListener("click", () => {
  // byId('unlitTextures').setAttribute('disabled', true)
  // byId('loadObjFile').setAttribute('disabled', true)
  // byId('jamb').removeAttribute('disabled')
  if (typeof app !== "undefined") app.destroyProgram()
  loadJamb()
})

byId('jamb').addEventListener("click", () => {
  // byId('unlitTextures').setAttribute('disabled', true)
  // byId('loadObjFile').setAttribute('disabled', true)
  // byId('jamb').removeAttribute('disabled')
  if (typeof app !== "undefined") app.destroyProgram()
  loadJamb()
})

byId('objs-anim').addEventListener("click", () => {
  // byId('unlitTextures').setAttribute('disabled', true)
  // byId('loadObjFile').setAttribute('disabled', true)
  // byId('jamb').removeAttribute('disabled')
  if (typeof app !== "undefined") app.destroyProgram()
  loadObjsSequence()
})



