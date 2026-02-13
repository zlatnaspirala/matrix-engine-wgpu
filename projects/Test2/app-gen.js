import MatrixEngineWGPU from "../../src/world.js";
import {downloadMeshes} from '../../src/engine/loader-obj.js';
import {uploadGLBModel} from "../../src/engine/loaders/webgpu-gltf.js";
import graph from "./graph.js";
import {shaderGraphsProdc} from "./shader-graphs.js"
import {gizmoEffect} from "../../src/shaders/gizmo/gimzoShader.js";
import {addRaycastsListener} from "../../src/engine/raycast.js";

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

      addRaycastsListener("canvas1", "mousedown");
      // app.canvas.addEventListener("ray.hit.event", (e) => {
      //   console.log('ray.hit.event detected', e.detail);
      // })

      // [only fro projects created from editor]
      app.graph = graph;
      shaderGraphsProdc.forEach((gShader) => {
        let shaderReady = JSON.parse(gShader.content);
        app.shadersPack[gShader.name] = shaderReady.final;
        if(typeof shaderReady.final === "undefined") console.warn(`Shader ${shaderReady.name} is not compiled.`);
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
          pointerEffect: {
            enabled: true,
            pointEffect: true,
            gizmoEffect: true,
            destructionEffect: true
          },
          mesh: m.mesh,
          raycast: {enabled: true, radius: 2},
          physics: {enabled: false, geometry: "Cube"}
        });
      }, {scale: [25, 1, 25]});

      // ME END FLOOR addCube



       // ME START FLOOR useScaleno info
 setTimeout(() => {
  app.getSceneObjectByName('FLOOR').useScale = true;
 }, 800);
 // ME END FLOOR useScaleno info
 
 
       // ME START cube1 addCube
 downloadMeshes({cube: "./res/meshes/blender/cube.obj"}, (m) => { 
   let texturesPaths = ['./res/meshes/blender/cube.png']; 
   app.addMeshObj({
     position: {x: 0, y: 0, z: -20}, rotation: {x: 0, y: 0, z: 0}, rotationSpeed: {x: 0, y: 0, z: 0},
     texturesPaths: [texturesPaths],
     name: 'cube1',
     mesh: m.cube,
     raycast: {enabled: true, radius: 2},
     physics: {enabled: false, geometry: "Cube"}
   }); 
 }, {scale: [1, 1, 1]});  
 // ME END cube1 addCube
 

          // ME START FLOOR updatePosz
 setTimeout(() => {
  app.getSceneObjectByName('FLOOR').position.SetZ(-19.5959686775923);
 }, 800);
 // ME END FLOOR updatePosz
 
   // ME START FLOOR updatePosy
 setTimeout(() => {
  app.getSceneObjectByName('FLOOR').position.SetY(-4.030000000000009);
 }, 800);
 // ME END FLOOR updatePosy
 
   // ME START cube1 updatePosx
 setTimeout(() => {
  app.getSceneObjectByName('cube1').position.SetX(-5.839999999999996);
 }, 800);
 // ME END cube1 updatePosx
 
    // ME START FLOOR updatePosx
 setTimeout(() => {
  app.getSceneObjectByName('FLOOR').position.SetX(-0.30999999999999933);
 }, 800);
 // ME END FLOOR updatePosx
 
 // [MAIN_REPLACE2]
    })
  })
window.app = app;
