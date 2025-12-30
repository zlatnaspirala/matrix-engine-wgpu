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
          name: 'Cube_' + app.mainRenderBundle.length,
          mesh: m.cube,
          raycast: {enabled: true, radius: 2},
          physics: {enabled: false, geometry: "Cube"}
        });
      }, {scale: [1, 1, 1]});
      // ME END Cube_0 addCube

 

      
       
       // ME START bot
 var glbFile01 = await fetch('res/meshes/glb/bot.glb').then(res => res.arrayBuffer().then(buf => uploadGLBModel(buf, app.device)));
   texturesPaths = ['./res/meshes/blender/cube.png']; 
    app.addGlbObj({ 
     position: {x: 0, y: 0, z: -20}, rotation: {x: 0, y: 0, z: 0}, rotationSpeed: {x: 0, y: 0, z: 0},
     texturesPaths: [texturesPaths],
     scale: [2, 2, 2],
     name:  app.getNameFromPath('res/meshes/glb/bot.glb'),
     material: {type: 'power', useTextureFromGlb: true},
     raycast: {enabled: true, radius: 2},
     physics: {enabled: false, geometry: "Cube"}
   }, null, glbFile01);
 // ME END bot
 

      
       // ME START Cube_2 addCube
 downloadMeshes({cube: "./res/meshes/blender/cube.obj"}, (m) => { 
   let texturesPaths = ['./res/meshes/blender/cube.png']; 
   app.addMeshObj({
     position: {x: 0, y: 0, z: -20}, rotation: {x: 0, y: 0, z: 0}, rotationSpeed: {x: 0, y: 0, z: 0},
     texturesPaths: [texturesPaths],
     name: 'Cube_' + app.mainRenderBundle.length,
     mesh: m.cube,
     raycast: {enabled: true, radius: 2},
     physics: {enabled: false, geometry: "Cube"}
   }); 
 }, {scale: [1, 1, 1]});  
 // ME END Cube_2 addCube
 

         // ME START Cube_0 updatePosx
 setTimeout(() => {
  app.getSceneObjectByName('Cube_0').position.SetX(3);
 }, 200);
 // ME END Cube_0 updatePosx
 
            // ME START Cube_1 updatePosz
 setTimeout(() => {
  app.getSceneObjectByName('Cube_1').position.SetZ(-24);
 }, 200);
 // ME END Cube_1 updatePosz
 
                // ME START Cube_1 updatePosy
 setTimeout(() => {
  app.getSceneObjectByName('Cube_1').position.SetY(1);
 }, 200);
 // ME END Cube_1 updatePosy
 
      // ME START Cube_1 updatePosx
 setTimeout(() => {
  app.getSceneObjectByName('Cube_1').position.SetX(0);
 }, 200);
 // ME END Cube_1 updatePosx
 
 // [MAIN_REPLACE2]
 
    })
  });

window.app = app;