import MatrixEngineWGPU from "../../../../src/world.js";
import {downloadMeshes} from '../../../../src/engine/loader-obj.js';
import {uploadGLBModel} from "../../../../src/engine/loaders/webgpu-gltf.js";

let app = new MatrixEngineWGPU({
  dontUsePhysics: true,
  useEditor: true,
  projectType: "pre editor",
  useSingleRenderPass: true,
  canvasSize: 'fullscreen',
  mainCameraParams: {
    type: 'WASD',
    responseCoef: 1000
  },
  clearColor: {r: 0, b: 0.1, g: 0.1, a: 1}
}, 
   (app) => {
    console.log("AUTOGEN NORMAL MAIN !");
  addEventListener('AmmoReady', async () => {
    console.log("AUTOGEN START UP");
  })
})
window.app = app;
