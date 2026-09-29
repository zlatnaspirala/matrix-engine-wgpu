import MatrixEngineWGPU from "../../src/world.js";
import {downloadMeshes} from '../../src/engine/loader-obj.js';
import {uploadGLBModel} from "../../src/engine/loaders/webgpu-gltf.js";
import graph from "./graph.js";
import {shaderGraphsProdc} from "./shader-graphs.js";
import {addRaycastsListener} from "../../src/engine/raycast.js";

let app = new MatrixEngineWGPU(

  {
  useCannon: true,
  useEditor: true,
  projectType: "created from editor",
  projectName: 'tutorial-6',
  canvasSize: 'fullscreen',
  mainCameraParams: {
    type:  "WASD",
    responseCoef: 1000
  },
  clearColor: {r: 0, b: 0, g: 0, a: 1}
}
  
, (app) => {
addEventListener('PhysicsReady', async () => { 
// [prevent - double call]
if (typeof app.loaded !== 'undefined') return;
app.loaded = true;
// [only for projects created from editor]
app.graph = graph;
 shaderGraphsProdc.forEach((gShader) => {
   let shaderReady = JSON.parse(gShader.content);
   app.shadersPack[gShader.name] = shaderReady.final;
   if (typeof shaderReady.final === "undefined") console.warn(`Shader ${shaderReady.name} is not compiled.`);
 });
addRaycastsListener("canvas1", "mousedown");
// Avoid position y 0 vs floor zero !
app.getCamera().setPosition(0,4,0)
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
            raycast: {enabled: true, radius: 1},
            physics: {enabled: false, geometry: "Cube"},
            pointerEffect: {
              enabled: true,
              gizmoEffect: true
          },
          });
        }, {scale: [25, 1, 25]});

      // ME END FLOOR addCube

  

       // ME START nikola addCube
 downloadMeshes({cube: "./res/meshes/blender/cube.obj"}, (m) => { 
   let texturesPaths = ['./res/textures/cube-g1-extra_low.png']; 
   app.addMeshObj({
     position: {x: 0, y: 0, z: -20}, rotation: {x: 0, y: 0, z: 0}, rotationSpeed: {x: 0, y: 0, z: 0},
     texturesPaths: [texturesPaths],
     name: 'nikola',
     mesh: m.cube,
     raycast: {enabled: true, radius: 1},
     physics: {enabled: false, geometry: "Cube"}
   }); 
 }, {scale: [1, 1, 1]});  
 // ME END nikola addCube
 

       // ME START FLOOR updatePosy
 setTimeout(() => {
 try { app.getSceneObjectByName('FLOOR').position.SetY(-0.7000000000000007); } catch(e) {}
 }, 800);
 // ME END FLOOR updatePosy
 
  // ME START nikola updatePosz
 setTimeout(() => {
 try { app.getSceneObjectByName('nikola').position.SetZ(-19.649999999999945); } catch(e) {}
 }, 800);
 // ME END nikola updatePosz
 
  // ME START nikola updatePosy
 setTimeout(() => {
 try { app.getSceneObjectByName('nikola').position.SetY(3.989999999999993); } catch(e) {}
 }, 800);
 // ME END nikola updatePosy
 
    // ME START nikola updatePosx
 setTimeout(() => {
 try { app.getSceneObjectByName('nikola').position.SetX(-3.8850000000000047); } catch(e) {}
 }, 800);
 // ME END nikola updatePosx
 
 // [MAIN_REPLACE2]
 })
})
window.app = app;
