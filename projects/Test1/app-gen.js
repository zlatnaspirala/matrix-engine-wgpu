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
 

      // [MAIN_REPLACE2]



































      
 })
})
window.app = app;
