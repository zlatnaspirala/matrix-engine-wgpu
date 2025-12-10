import MatrixEngineWGPU from "../../src/world.js";
import {downloadMeshes} from '../../src/engine/loader-obj.js';
import {uploadGLBModel} from "../../src/engine/loaders/webgpu-gltf.js";

let app = new MatrixEngineWGPU(

  {
  
  useEditor: true,
  projectType: "created from editor",
  projectName: 'Test1',
  useSingleRenderPass: true,
  canvasSize: 'fullscreen',
  mainCameraParams: {
    type: 'WASD',
    responseCoef: 1000
  },
  clearColor: {r: 0, b: 0.1, g: 0.1, a: 1}
}
  
, (app) => {
addEventListener('AmmoReady', async () => { 
  // [light]
  app.addLight();

      // [MAIN_REPLACE2]
 })
})
window.app = app;
