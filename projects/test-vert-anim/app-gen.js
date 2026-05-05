import MatrixEngineWGPU from "../../src/world.js";
import {downloadMeshes} from '../../src/engine/loader-obj.js';
import {uploadGLBModel} from "../../src/engine/loaders/webgpu-gltf.js";
import graph from "./graph.js";
import {shaderGraphsProdc} from "./shader-graphs.js";
import {addRaycastsListener} from "../../src/engine/raycast.js";

let app = new MatrixEngineWGPU(

  {
  dontUsePhysics: true,
  useEditor: true,
  projectType: "created from editor",
  projectName: 'test-vert-anim',
  canvasSize: 'fullscreen',
  mainCameraParams: {
    type: 'WASD',
    responseCoef: 1000
  },
  clearColor: {r: 0, b: 0, g: 0, a: 1}
}
  
, (app) => {
// [only for projects created from editor]
app.graph = graph;
 shaderGraphsProdc.forEach((gShader) => {
   let shaderReady = JSON.parse(gShader.content);
   app.shadersPack[gShader.name] = shaderReady.final;
   if (typeof shaderReady.final === "undefined") console.warn(`Shader ${shaderReady.name} is not compiled.`);
 });
addRaycastsListener("canvas1", "mousedown");
// Avoid position y 0 vs floor zero !
app.cameras.WASD.setPosition(0,4,0)
// [light]
app.addLight();

      // ME START FLOOR addCube

      downloadMeshes({mesh: "./res/meshes/blender/plane.obj"}, (m) => {
          let texturesPaths = ['./res/textures/floor1.webp'];
          app.addMeshObj({
            material: { type: 'standard' },
            position: {x: 0, y: 0, z: -20}, rotation: {x: 0, y: 0, z: 0}, rotationSpeed: {x: 0, y: 0, z: 0},
            texturesPaths: texturesPaths,
            name: 'FLOOR',
            mesh: m.mesh,
            raycast: {enabled: true, radius: 2},
            physics: {enabled: false, geometry: "Cube"},
            pointerEffect: {
              enabled: true,
              gizmoEffect: true
          },
          });
        }, {scale: [25, 1, 25]});

      // ME END FLOOR addCube

  

       // ME START MYCUBE addCube
 downloadMeshes({cube: "./res/meshes/blender/cube.obj"}, (m) => { 
   let texturesPaths = ['./res/meshes/blender/cube.png']; 
   app.addMeshObj({
     position: {x: 0, y: 0, z: -20}, rotation: {x: 0, y: 0, z: 0}, rotationSpeed: {x: 0, y: 0, z: 0},
     texturesPaths: [texturesPaths],
     name: 'MYCUBE',
     mesh: m.cube,
     raycast: {enabled: true, radius: 2},
     physics: {enabled: false, geometry: "Cube"}
   }); 
 }, {scale: [1, 1, 1]});  
 // ME END MYCUBE addCube
 

        // ME START FLOOR updatePosy
 setTimeout(() => {
  app.getSceneObjectByName('FLOOR').position.SetY(-0.12000000000000001);
 }, 800);
 // ME END FLOOR updatePosy
 
         // ME START FLOOR updatePosz
 setTimeout(() => {
  app.getSceneObjectByName('FLOOR').position.SetZ(-20);
 }, 800);
 // ME END FLOOR updatePosz
 
  // ME START MYCUBE updatePosy
 setTimeout(() => {
  app.getSceneObjectByName('MYCUBE').position.SetY(5.6599999999999575);
 }, 800);
 // ME END MYCUBE updatePosy
 
  // ME START MYCUBE updatePosz
 setTimeout(() => {
  app.getSceneObjectByName('MYCUBE').position.SetZ(-20.41560950304462);
 }, 800);
 // ME END MYCUBE updatePosz
 
  // ME START MYCUBE updatePosx
 setTimeout(() => {
  app.getSceneObjectByName('MYCUBE').position.SetX(0.45999999999999175);
 }, 800);
 // ME END MYCUBE updatePosx
 
 // [MAIN_REPLACE2]
})
window.app = app;
