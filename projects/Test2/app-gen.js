import MatrixEngineWGPU from "../../src/world.js";
import {downloadMeshes} from '../../src/engine/loader-obj.js';
import {uploadGLBModel} from "../../src/engine/loaders/webgpu-gltf.js";
import graph from "./graph.js";
import {shaderGraphsProdc} from "./shader-graphs.js"

let app = new MatrixEngineWGPU(

  {
  
  useEditor: true,
  projectType: "created from editor",
  projectName: 'Test2',
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
// [only fro projects created from editor]
app.graph = graph;
 shaderGraphsProdc.forEach((gShader) => {
   let shaderReady = JSON.parse(gShader.content);
   app.shadersPack[gShader.name] = shaderReady.final;
   if (typeof shaderReady.final === "undefined") console.warn(`Shader ${shaderReady.name} is not compiled.`);
 });
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

  

       // ME START nik addCube
 downloadMeshes({cube: "./res/meshes/blender/cube.obj"}, (m) => { 
   let texturesPaths = ['./res/meshes/blender/cube.png']; 
   app.addMeshObj({
     position: {x: 0, y: 0, z: -20}, rotation: {x: 0, y: 0, z: 0}, rotationSpeed: {x: 0, y: 0, z: 0},
     texturesPaths: [texturesPaths],
     name: 'nik',
     mesh: m.cube,
     raycast: {enabled: true, radius: 2},
     physics: {enabled: false, geometry: "Cube"}
   }); 
 }, {scale: [1, 1, 1]});  
 // ME END nik addCube
 

       // ME START nik useScaleno info
 setTimeout(() => {
  app.getSceneObjectByName('nik').useScale = true;
 }, 800);
 // ME END nik useScaleno info
 
      // ME START nik updateScale0
 setTimeout(() => {
  app.getSceneObjectByName('nik').scale[0] = 6;
 }, 800);
 // ME END nik updateScale0
 
      // ME START nik updateScale1
 setTimeout(() => {
  app.getSceneObjectByName('nik').scale[1] = 6;
 }, 800);
 // ME END nik updateScale1
 
       // ME START nik updateScale2
 setTimeout(() => {
  app.getSceneObjectByName('nik').scale[2] = 7;
 }, 800);
 // ME END nik updateScale2
 
 // [MAIN_REPLACE2]
 })
})
window.app = app;
