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

      // ME START Cube_0 addCube
      downloadMeshes({cube: "./res/meshes/blender/cube.obj"}, (m) => {
        let texturesPaths = ['./res/meshes/blender/cube.png'];
        app.addMeshObj({
          position: {x: 0, y: 0, z: -20}, rotation: {x: 0, y: 0, z: 0}, rotationSpeed: {x: 0, y: 0, z: 0},
          texturesPaths: [texturesPaths],
          name: 'FLOOR',
          mesh: m.cube,
          raycast: {enabled: true, radius: 2},
          physics: {enabled: false, geometry: "Cube"}
        });
      }, {scale: [1, 1, 1]});
      // ME END Cube_0 addCube

  
 

 
 

           // ME START FLOOR updateScale0
 setTimeout(() => {
  app.getSceneObjectByName('FLOOR').scale[0] = 15;
 }, 800);
 // ME END FLOOR updateScale0
 
  // ME START FLOOR updateScale2
 setTimeout(() => {
  app.getSceneObjectByName('FLOOR').scale[2] = 15;
 }, 800);
 // ME END FLOOR updateScale2
 
  // ME START FLOOR updateScale1
 setTimeout(() => {
  app.getSceneObjectByName('FLOOR').scale[1] = 0.01;
 }, 800);
 // ME END FLOOR updateScale1

 
 

                 
       // [MAIN_REPLACE2]
 
    })
  });

window.app = app;