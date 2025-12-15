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
        const texturesPaths = ['./res/meshes/blender/cube.png'];
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


      // ME START Cube_0 updateRotx
 setTimeout(() => {
  app.getSceneObjectByName('Cube_0').rotation.x = -3;
 }, 200);
 // ME END Cube_0 updateRotx
 
           // ME START Cube_0 updatePosx
 setTimeout(() => {
  app.getSceneObjectByName('Cube_0').position.SetX(7);
 }, 200);
 // ME END Cube_0 updatePosx
 
        // ME START Cube_0 updatePosy
 setTimeout(() => {
  app.getSceneObjectByName('Cube_0').position.SetY(7);
 }, 200);
 // ME END Cube_0 updatePosy
 
 
       // ME START Glb_1 
 var glbFile01 = await fetch('res/meshes/env/tower.glb').then(res => res.arrayBuffer().then(buf => uploadGLBModel(buf, app.device)));
   const texturesPaths = ['./res/meshes/blender/cube.png']; 
    app.addGlbObj({ 
     position: {x: 0, y: 0, z: -20}, rotation: {x: 0, y: 0, z: 0}, rotationSpeed: {x: 0, y: 0, z: 0},
     texturesPaths: [texturesPaths],
     scale: [2, 2, 2],
     name: 'Glb_' + app.mainRenderBundle.length,
     material: {type: 'power', useTextureFromGlb: true},
     raycast: {enabled: true, radius: 2},
     physics: {enabled: true, geometry: "Cube"}
   }, null, glbFile01);
 // ME END Glb_1 
 

      
       // ME START Cube_1 addCube
 downloadMeshes({cube: "./res/meshes/blender/cube.obj"}, (m) => { 
   const texturesPaths = ['./res/meshes/blender/cube.png']; 
   app.addMeshObj({
     position: {x: 0, y: 0, z: -20}, rotation: {x: 0, y: 0, z: 0}, rotationSpeed: {x: 0, y: 0, z: 0},
     texturesPaths: [texturesPaths],
     name: 'Cube_' + app.mainRenderBundle.length,
     mesh: m.cube,
     raycast: {enabled: true, radius: 2},
     physics: {enabled: true, geometry: "Cube"}
   }); 
 }, {scale: [1, 1, 1]});  
 // ME END Cube_1 addCube
 

      
       // ME START Cube_2 addCube
 downloadMeshes({cube: "./res/meshes/blender/cube.obj"}, (m) => { 
   const texturesPaths = ['./res/meshes/blender/cube.png']; 
   app.addMeshObj({
     position: {x: 0, y: 0, z: -20}, rotation: {x: 0, y: 0, z: 0}, rotationSpeed: {x: 0, y: 0, z: 0},
     texturesPaths: [texturesPaths],
     name: 'Cube_' + app.mainRenderBundle.length,
     mesh: m.cube,
     raycast: {enabled: true, radius: 2},
     physics: {enabled: true, geometry: "Cube"}
   }); 
 }, {scale: [1, 1, 1]});  
 // ME END Cube_2 addCube
 

      
       // ME START Cube_3 addCube
 downloadMeshes({cube: "./res/meshes/blender/cube.obj"}, (m) => { 
   const texturesPaths = ['./res/meshes/blender/cube.png']; 
   app.addMeshObj({
     position: {x: 0, y: 0, z: -20}, rotation: {x: 0, y: 0, z: 0}, rotationSpeed: {x: 0, y: 0, z: 0},
     texturesPaths: [texturesPaths],
     name: 'Cube_' + app.mainRenderBundle.length,
     mesh: m.cube,
     raycast: {enabled: true, radius: 2},
     physics: {enabled: true, geometry: "Cube"}
   }); 
 }, {scale: [1, 1, 1]});  
 // ME END Cube_3 addCube
 

      
       // ME START Cube_4 addCube
 downloadMeshes({cube: "./res/meshes/blender/cube.obj"}, (m) => { 
   const texturesPaths = ['./res/meshes/blender/cube.png']; 
   app.addMeshObj({
     position: {x: 0, y: 0, z: -20}, rotation: {x: 0, y: 0, z: 0}, rotationSpeed: {x: 0, y: 0, z: 0},
     texturesPaths: [texturesPaths],
     name: 'Cube_' + app.mainRenderBundle.length,
     mesh: m.cube,
     raycast: {enabled: true, radius: 2},
     physics: {enabled: true, geometry: "Cube"}
   }); 
 }, {scale: [1, 1, 1]});  
 // ME END Cube_4 addCube
 

      
       // ME START Cube_5 addCube
 downloadMeshes({cube: "./res/meshes/blender/cube.obj"}, (m) => { 
   const texturesPaths = ['./res/meshes/blender/cube.png']; 
   app.addMeshObj({
     position: {x: 0, y: 0, z: -20}, rotation: {x: 0, y: 0, z: 0}, rotationSpeed: {x: 0, y: 0, z: 0},
     texturesPaths: [texturesPaths],
     name: 'Cube_' + app.mainRenderBundle.length,
     mesh: m.cube,
     raycast: {enabled: true, radius: 2},
     physics: {enabled: true, geometry: "Cube"}
   }); 
 }, {scale: [1, 1, 1]});  
 // ME END Cube_5 addCube
 

      
       // ME START Cube_6 addCube
 downloadMeshes({cube: "./res/meshes/blender/cube.obj"}, (m) => { 
   const texturesPaths = ['./res/meshes/blender/cube.png']; 
   app.addMeshObj({
     position: {x: 0, y: 0, z: -20}, rotation: {x: 0, y: 0, z: 0}, rotationSpeed: {x: 0, y: 0, z: 0},
     texturesPaths: [texturesPaths],
     name: 'Cube_' + app.mainRenderBundle.length,
     mesh: m.cube,
     raycast: {enabled: true, radius: 2},
     physics: {enabled: true, geometry: "Cube"}
   }); 
 }, {scale: [1, 1, 1]});  
 // ME END Cube_6 addCube
 

      
       // ME START Cube_7 addCube
 downloadMeshes({cube: "./res/meshes/blender/cube.obj"}, (m) => { 
   const texturesPaths = ['./res/meshes/blender/cube.png']; 
   app.addMeshObj({
     position: {x: 0, y: 0, z: -20}, rotation: {x: 0, y: 0, z: 0}, rotationSpeed: {x: 0, y: 0, z: 0},
     texturesPaths: [texturesPaths],
     name: 'Cube_' + app.mainRenderBundle.length,
     mesh: m.cube,
     raycast: {enabled: true, radius: 2},
     physics: {enabled: true, geometry: "Cube"}
   }); 
 }, {scale: [1, 1, 1]});  
 // ME END Cube_7 addCube
 

      
       // ME START Cube_8 addCube
 downloadMeshes({cube: "./res/meshes/blender/cube.obj"}, (m) => { 
   const texturesPaths = ['./res/meshes/blender/cube.png']; 
   app.addMeshObj({
     position: {x: 0, y: 0, z: -20}, rotation: {x: 0, y: 0, z: 0}, rotationSpeed: {x: 0, y: 0, z: 0},
     texturesPaths: [texturesPaths],
     name: 'Cube_' + app.mainRenderBundle.length,
     mesh: m.cube,
     raycast: {enabled: true, radius: 2},
     physics: {enabled: true, geometry: "Cube"}
   }); 
 }, {scale: [1, 1, 1]});  
 // ME END Cube_8 addCube
 

      
       // ME START Cube_9 addCube
 downloadMeshes({cube: "./res/meshes/blender/cube.obj"}, (m) => { 
   const texturesPaths = ['./res/meshes/blender/cube.png']; 
   app.addMeshObj({
     position: {x: 0, y: 0, z: -20}, rotation: {x: 0, y: 0, z: 0}, rotationSpeed: {x: 0, y: 0, z: 0},
     texturesPaths: [texturesPaths],
     name: 'Cube_' + app.mainRenderBundle.length,
     mesh: m.cube,
     raycast: {enabled: true, radius: 2},
     physics: {enabled: true, geometry: "Cube"}
   }); 
 }, {scale: [1, 1, 1]});  
 // ME END Cube_9 addCube
 

      
       // ME START Cube_10 addCube
 downloadMeshes({cube: "./res/meshes/blender/cube.obj"}, (m) => { 
   const texturesPaths = ['./res/meshes/blender/cube.png']; 
   app.addMeshObj({
     position: {x: 0, y: 0, z: -20}, rotation: {x: 0, y: 0, z: 0}, rotationSpeed: {x: 0, y: 0, z: 0},
     texturesPaths: [texturesPaths],
     name: 'Cube_' + app.mainRenderBundle.length,
     mesh: m.cube,
     raycast: {enabled: true, radius: 2},
     physics: {enabled: true, geometry: "Cube"}
   }); 
 }, {scale: [1, 1, 1]});  
 // ME END Cube_10 addCube
 

      
       // ME START Cube_11 addCube
 downloadMeshes({cube: "./res/meshes/blender/cube.obj"}, (m) => { 
   const texturesPaths = ['./res/meshes/blender/cube.png']; 
   app.addMeshObj({
     position: {x: 0, y: 0, z: -20}, rotation: {x: 0, y: 0, z: 0}, rotationSpeed: {x: 0, y: 0, z: 0},
     texturesPaths: [texturesPaths],
     name: 'Cube_' + app.mainRenderBundle.length,
     mesh: m.cube,
     raycast: {enabled: true, radius: 2},
     physics: {enabled: true, geometry: "Cube"}
   }); 
 }, {scale: [1, 1, 1]});  
 // ME END Cube_11 addCube
 

      
       // ME START Cube_12 addCube
 downloadMeshes({cube: "./res/meshes/blender/cube.obj"}, (m) => { 
   const texturesPaths = ['./res/meshes/blender/cube.png']; 
   app.addMeshObj({
     position: {x: 0, y: 0, z: -20}, rotation: {x: 0, y: 0, z: 0}, rotationSpeed: {x: 0, y: 0, z: 0},
     texturesPaths: [texturesPaths],
     name: 'Cube_' + app.mainRenderBundle.length,
     mesh: m.cube,
     raycast: {enabled: true, radius: 2},
     physics: {enabled: true, geometry: "Cube"}
   }); 
 }, {scale: [1, 1, 1]});  
 // ME END Cube_12 addCube
 

      
       // ME START Cube_13 addCube
 downloadMeshes({cube: "./res/meshes/blender/cube.obj"}, (m) => { 
   const texturesPaths = ['./res/meshes/blender/cube.png']; 
   app.addMeshObj({
     position: {x: 0, y: 0, z: -20}, rotation: {x: 0, y: 0, z: 0}, rotationSpeed: {x: 0, y: 0, z: 0},
     texturesPaths: [texturesPaths],
     name: 'Cube_' + app.mainRenderBundle.length,
     mesh: m.cube,
     raycast: {enabled: true, radius: 2},
     physics: {enabled: true, geometry: "Cube"}
   }); 
 }, {scale: [1, 1, 1]});  
 // ME END Cube_13 addCube
 

      
       // ME START Cube_14 addCube
 downloadMeshes({cube: "./res/meshes/blender/cube.obj"}, (m) => { 
   const texturesPaths = ['./res/meshes/blender/cube.png']; 
   app.addMeshObj({
     position: {x: 0, y: 0, z: -20}, rotation: {x: 0, y: 0, z: 0}, rotationSpeed: {x: 0, y: 0, z: 0},
     texturesPaths: [texturesPaths],
     name: 'Cube_' + app.mainRenderBundle.length,
     mesh: m.cube,
     raycast: {enabled: true, radius: 2},
     physics: {enabled: true, geometry: "Cube"}
   }); 
 }, {scale: [1, 1, 1]});  
 // ME END Cube_14 addCube
 

      
       // ME START Cube_15 addCube
 downloadMeshes({cube: "./res/meshes/blender/cube.obj"}, (m) => { 
   const texturesPaths = ['./res/meshes/blender/cube.png']; 
   app.addMeshObj({
     position: {x: 0, y: 0, z: -20}, rotation: {x: 0, y: 0, z: 0}, rotationSpeed: {x: 0, y: 0, z: 0},
     texturesPaths: [texturesPaths],
     name: 'Cube_' + app.mainRenderBundle.length,
     mesh: m.cube,
     raycast: {enabled: true, radius: 2},
     physics: {enabled: true, geometry: "Cube"}
   }); 
 }, {scale: [1, 1, 1]});  
 // ME END Cube_15 addCube
 

      
       // ME START Cube_16 addCube
 downloadMeshes({cube: "./res/meshes/blender/cube.obj"}, (m) => { 
   const texturesPaths = ['./res/meshes/blender/cube.png']; 
   app.addMeshObj({
     position: {x: 0, y: 0, z: -20}, rotation: {x: 0, y: 0, z: 0}, rotationSpeed: {x: 0, y: 0, z: 0},
     texturesPaths: [texturesPaths],
     name: 'Cube_' + app.mainRenderBundle.length,
     mesh: m.cube,
     raycast: {enabled: true, radius: 2},
     physics: {enabled: true, geometry: "Cube"}
   }); 
 }, {scale: [1, 1, 1]});  
 // ME END Cube_16 addCube
 

      
       // ME START Cube_17 addCube
 downloadMeshes({cube: "./res/meshes/blender/cube.obj"}, (m) => { 
   const texturesPaths = ['./res/meshes/blender/cube.png']; 
   app.addMeshObj({
     position: {x: 0, y: 0, z: -20}, rotation: {x: 0, y: 0, z: 0}, rotationSpeed: {x: 0, y: 0, z: 0},
     texturesPaths: [texturesPaths],
     name: 'Cube_' + app.mainRenderBundle.length,
     mesh: m.cube,
     raycast: {enabled: true, radius: 2},
     physics: {enabled: true, geometry: "Cube"}
   }); 
 }, {scale: [1, 1, 1]});  
 // ME END Cube_17 addCube
 

      
       // ME START Cube_18 addCube
 downloadMeshes({cube: "./res/meshes/blender/cube.obj"}, (m) => { 
   const texturesPaths = ['./res/meshes/blender/cube.png']; 
   app.addMeshObj({
     position: {x: 0, y: 0, z: -20}, rotation: {x: 0, y: 0, z: 0}, rotationSpeed: {x: 0, y: 0, z: 0},
     texturesPaths: [texturesPaths],
     name: 'Cube_' + app.mainRenderBundle.length,
     mesh: m.cube,
     raycast: {enabled: true, radius: 2},
     physics: {enabled: true, geometry: "Cube"}
   }); 
 }, {scale: [1, 1, 1]});  
 // ME END Cube_18 addCube
 

      // [MAIN_REPLACE2]






















    })
  });

window.app = app;