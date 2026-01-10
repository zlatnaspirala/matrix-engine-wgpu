import MatrixEngineWGPU from "../../src/world.js";
import {downloadMeshes} from '../../src/engine/loader-obj.js';
import {uploadGLBModel} from "../../src/engine/loaders/webgpu-gltf.js";

let app = new MatrixEngineWGPU(

  {
  
  useEditor: true,
  projectType: "created from editor",
  projectName: 'MyProject1',
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

      // ME START FLOOR addCube

      downloadMeshes({mesh: "./res/meshes/blender/plane.obj"}, (m) => {
          let texturesPaths = ['./res/meshes/blender/cube.png'];
          app.addMeshObj({
            position: {x: 0, y: -1, z: -20}, rotation: {x: 0, y: 0, z: 0}, rotationSpeed: {x: 0, y: 0, z: 0},
            texturesPaths: [texturesPaths],
            name: 'FLOOR',
            mesh: m.mesh,
            raycast: {enabled: true, radius: 2},
            physics: {enabled: false, geometry: "Cube"}
          });
        }, {scale: [25, 1, 25]});

      // ME END FLOOR addCube

  
// [MAIN_REPLACE2]
 })
})
window.app = app;
