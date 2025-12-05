import MatrixEngineWGPU from "../../../world.js";
import {downloadMeshes} from '../../../engine/loader-obj.js';
import {uploadGLBModel} from "../../../engine/loaders/webgpu-gltf.js";

let app = new MatrixEngineWGPU({
  useEditor: true,
  projectType: "created from editor",
  useSingleRenderPass: true,
  canvasSize: 'fullscreen',
  mainCameraParams: {
    type: 'WASD',
    responseCoef: 1000
  },
  clearColor: {r: 0, b: 0.1, g: 0.1, a: 1}
}, (app) => {

  addEventListener('AmmoReady', async () => {
    console.log("AUTOGEN WITH PHISICS");
  })
})
window.app = app;
