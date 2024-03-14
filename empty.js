import MatrixEngineWGPU from "./src/world.js";
import {downloadMeshes} from './src/engine/loader-obj.js';

export let application = new MatrixEngineWGPU({
  useSingleRenderPass: false,
  canvasSize: 'fullscreen'
}, () => {
  window.app = application
  // for now
  window.downloadMeshes = downloadMeshes;
  console.log("matrix-engine-wgpu is loaded with text/javascript.")
})
