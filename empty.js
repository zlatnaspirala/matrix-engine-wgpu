import MatrixEngineWGPU from "./src/world.js";
import {downloadMeshes} from './src/engine/loader-obj.js';
import {LOG_MATRIX} from "./src/engine/utils.js";

export let application = new MatrixEngineWGPU({
  useSingleRenderPass: true,
  mainCameraParams: {
    type: 'WASD',
    responseCoef: 1000
  },
  canvasSize: 'fullscreen'
}, () => {
  window.app = application
  // for now
  window.downloadMeshes = downloadMeshes;
  console.info(`%c matrix-engine-wgpu [ready]`, LOG_MATRIX);
})
