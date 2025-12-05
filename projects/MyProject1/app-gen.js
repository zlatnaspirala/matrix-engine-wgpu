import MatrixEngineWGPU from "../../src/world.js";
import {downloadMeshes} from '../../src/engine/loader-obj.js';
import {uploadGLBModel} from "../../src/engine/loaders/webgpu-gltf.js";

let app = new MatrixEngineWGPU(

  {
  autogen: true,
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
// [MAIN_REPLACE1]
// [MAIN_REPLACE2]

   var glbFile01 = await fetch("res/meshes/glb/monster.glb").then(res => res.arrayBuffer().then(buf => uploadGLBModel(buf, TEST_ANIM.device)));
      TEST_ANIM.addGlbObj({
        material: {type: 'standard', useTextureFromGlb: true},
        scale: [20, 20, 20],
        position: {x: 0, y: -4, z: -70},
        name: 'firstGlb',
        texturesPaths: ['./res/meshes/glb/textures/mutant_origin.png'],
      }, null, glbFile01);

 })
})
window.app = app;
