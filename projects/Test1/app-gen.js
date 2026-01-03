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

 
 

                 
       
       // ME START L_BOX addCube
 downloadMeshes({cube: "./res/meshes/blender/cube.obj"}, (m) => { 
   let texturesPaths = ['./res/meshes/blender/cube.png']; 
   app.addMeshObj({
     position: {x: 0, y: 0, z: -20}, rotation: {x: 0, y: 0, z: 0}, rotationSpeed: {x: 0, y: 0, z: 0},
     texturesPaths: [texturesPaths],
     name: 'L_BOX',
     mesh: m.cube,
     raycast: {enabled: true, radius: 2},
     physics: {enabled: false, geometry: "Cube"}
   }); 
 }, {scale: [1, 1, 1]});  
 // ME END L_BOX addCube
 

      
       
       // ME START R_BOX addCube
 downloadMeshes({cube: "./res/meshes/blender/cube.obj"}, (m) => { 
   let texturesPaths = ['./res/meshes/blender/cube.png']; 
   app.addMeshObj({
     position: {x: 0, y: 0, z: -20}, rotation: {x: 0, y: 0, z: 0}, rotationSpeed: {x: 0, y: 0, z: 0},
     texturesPaths: [texturesPaths],
     name: 'R_BOX',
     mesh: m.cube,
     raycast: {enabled: true, radius: 2},
     physics: {enabled: false, geometry: "Cube"}
   }); 
 }, {scale: [1, 1, 1]});  
 // ME END R_BOX addCube
 

          // ME START L_BOX updatePosx
 setTimeout(() => {
  app.getSceneObjectByName('L_BOX').position.SetX(-4);
 }, 800);
 // ME END L_BOX updatePosx
 
    // ME START REEL_1
 downloadMeshes({cube: "res/meshes/obj/reel.obj"}, (m) => { 
   const texturesPaths = ['./res/meshes/blender/cube.png']; 
   app.addMeshObj({
     position: {x: 0, y: 0, z: -20}, rotation: {x: 0, y: 0, z: 0}, rotationSpeed: {x: 0, y: 0, z: 0},
     texturesPaths: [texturesPaths],
     name: 'REEL_1',
     mesh: m.cube,
     raycast: {enabled: true, radius: 2},
     physics: {enabled: false, geometry: "Cube"}
   }); 
 }, {scale: [1, 1, 1]});  
 // ME END REEL_1
 

        // ME START REEL_1 updateScale0
 setTimeout(() => {
  app.getSceneObjectByName('REEL_1').scale[0] = 2;
 }, 800);
 // ME END REEL_1 updateScale0
 
  // ME START REEL_1 updateScale1
 setTimeout(() => {
  app.getSceneObjectByName('REEL_1').scale[1] = 2;
 }, 800);
 // ME END REEL_1 updateScale1
 
  // ME START REEL_1 updateScale2
 setTimeout(() => {
  app.getSceneObjectByName('REEL_1').scale[2] = 2;
 }, 800);
 // ME END REEL_1 updateScale2
 
   // ME START R_BOX updatePosx
 setTimeout(() => {
  app.getSceneObjectByName('R_BOX').position.SetX(4);
 }, 800);
 // ME END R_BOX updatePosx
 
   // ME START R_BOX updatePosy
 setTimeout(() => {
  app.getSceneObjectByName('R_BOX').position.SetY(2);
 }, 800);
 // ME END R_BOX updatePosy
 
     // ME START L_BOX updatePosy
 setTimeout(() => {
  app.getSceneObjectByName('L_BOX').position.SetY(2);
 }, 800);
 // ME END L_BOX updatePosy
 
    // ME START REEL_1 updatePosy
 setTimeout(() => {
  app.getSceneObjectByName('REEL_1').position.SetY(4);
 }, 800);
 // ME END REEL_1 updatePosy
 
 
       // ME START REEL_2
 downloadMeshes({cube: "res/meshes/obj/reel.obj"}, (m) => { 
   const texturesPaths = ['./res/meshes/blender/cube.png']; 
   app.addMeshObj({
     position: {x: 0, y: 0, z: -20}, rotation: {x: 0, y: 0, z: 0}, rotationSpeed: {x: 0, y: 0, z: 0},
     texturesPaths: [texturesPaths],
     name: 'REEL_2',
     mesh: m.cube,
     raycast: {enabled: true, radius: 2},
     physics: {enabled: false, geometry: "Cube"}
   }); 
 }, {scale: [1, 1, 1]});  
 // ME END REEL_2
 

          // ME START REEL_1 updatePosx
 setTimeout(() => {
  app.getSceneObjectByName('REEL_1').position.SetX(-2);
 }, 800);
 // ME END REEL_1 updatePosx
 
  // ME START REEL_2 updateScale0
 setTimeout(() => {
  app.getSceneObjectByName('REEL_2').scale[0] = 2;
 }, 800);
 // ME END REEL_2 updateScale0
 
  // ME START REEL_2 updateScale2
 setTimeout(() => {
  app.getSceneObjectByName('REEL_2').scale[2] = 2;
 }, 800);
 // ME END REEL_2 updateScale2
 
   // ME START REEL_2 updateScale1
 setTimeout(() => {
  app.getSceneObjectByName('REEL_2').scale[1] = 2;
 }, 800);
 // ME END REEL_2 updateScale1
 
   // ME START REEL_2 updatePosx
 setTimeout(() => {
  app.getSceneObjectByName('REEL_2').position.SetX(0);
 }, 800);
 // ME END REEL_2 updatePosx
 
     // ME START REEL_2 updatePosy
 setTimeout(() => {
  app.getSceneObjectByName('REEL_2').position.SetY(4);
 }, 800);
 // ME END REEL_2 updatePosy
 
 
       // ME START REEL_3
 downloadMeshes({cube: "res/meshes/obj/reel.obj"}, (m) => { 
   const texturesPaths = ['./res/meshes/blender/cube.png']; 
   app.addMeshObj({
     position: {x: 0, y: 0, z: -20}, rotation: {x: 0, y: 0, z: 0}, rotationSpeed: {x: 0, y: 0, z: 0},
     texturesPaths: [texturesPaths],
     name: 'REEL_3',
     mesh: m.cube,
     raycast: {enabled: true, radius: 2},
     physics: {enabled: false, geometry: "Cube"}
   }); 
 }, {scale: [1, 1, 1]});  
 // ME END REEL_3
 

       // ME START REEL_3 updateScale0
 setTimeout(() => {
  app.getSceneObjectByName('REEL_3').scale[0] = 2;
 }, 800);
 // ME END REEL_3 updateScale0
 
  // ME START REEL_3 updateScale1
 setTimeout(() => {
  app.getSceneObjectByName('REEL_3').scale[1] = 2;
 }, 800);
 // ME END REEL_3 updateScale1
 
  // ME START REEL_3 updateScale2
 setTimeout(() => {
  app.getSceneObjectByName('REEL_3').scale[2] = 2;
 }, 800);
 // ME END REEL_3 updateScale2
 
   // ME START REEL_3 updatePosx
 setTimeout(() => {
  app.getSceneObjectByName('REEL_3').position.SetX(2);
 }, 800);
 // ME END REEL_3 updatePosx
 
     // ME START REEL_3 updatePosy
 setTimeout(() => {
  app.getSceneObjectByName('REEL_3').position.SetY(4);
 }, 800);
 // ME END REEL_3 updatePosy
 
 // [MAIN_REPLACE2]
 
    })
  });

window.app = app;