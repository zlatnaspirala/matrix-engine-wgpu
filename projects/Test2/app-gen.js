import MatrixEngineWGPU from "../../src/world.js";
import {downloadMeshes} from '../../src/engine/loader-obj.js';
import {uploadGLBModel} from "../../src/engine/loaders/webgpu-gltf.js";
import graph from "./graph.js";
import {shaderGraphsProdc} from "./shader-graphs.js"
import {gizmoEffect} from "../../src/shaders/gizmo/gimzoShader.js";
import {addRaycastsListener} from "../../src/engine/raycast.js";
import {flameEffect} from "../../src/shaders/flame-effect/flameEffect.js";

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
            // pointEffect: true,
            gizmoEffect: true,
            // flameEffect: true,
            // destructionEffect: true
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
 

          // ME START cube1 updatePosy
 setTimeout(() => {
  app.getSceneObjectByName('cube1').position.SetY(2.349999999999998);
 }, 800);
 // ME END cube1 updatePosy
 
     // ME START cube1 updateRoty
 setTimeout(() => {
  app.getSceneObjectByName('cube1').rotation.y = -0;
 }, 800);
 // ME END cube1 updateRoty
 
  // ME START cube1 updateRotz
 setTimeout(() => {
  app.getSceneObjectByName('cube1').rotation.z = 0;
 }, 800);
 // ME END cube1 updateRotz
 
    // ME START cube1 updateRotx
 setTimeout(() => {
  app.getSceneObjectByName('cube1').rotation.x = -7.7000000000000055;
 }, 800);
 // ME END cube1 updateRotx
 
  // ME START FLOOR updatePosz
 setTimeout(() => {
  app.getSceneObjectByName('FLOOR').position.SetZ(-20.346530579447325);
 }, 800);
 // ME END FLOOR updatePosz
 
 
       // ME START monster
 var glbFile01 = await fetch('res/meshes/glb/monster.glb').then(res => res.arrayBuffer().then(buf => uploadGLBModel(buf, app.device)));
   texturesPaths = ['./res/meshes/blender/cube.png']; 
    app.addGlbObj({ 
     position: {x: 0, y: 0, z: -20}, rotation: {x: 0, y: 0, z: 0}, rotationSpeed: {x: 0, y: 0, z: 0},
     texturesPaths: [texturesPaths],
     scale: [2, 2, 2],
     name:  app.getNameFromPath('res/meshes/glb/monster.glb'),
     material: {type: 'standard', useTextureFromGlb: true},
     raycast: {enabled: true, radius: 2},
     physics: {enabled: true, geometry: "Cube"}
   }, null, glbFile01);
 // ME END monster
 

       // ME START cube1 updatePosx
 setTimeout(() => {
  app.getSceneObjectByName('cube1').position.SetX(-3.2399999999999958);
 }, 800);
 // ME END cube1 updatePosx
 
                 // ME START FLOOR updatePosy
 setTimeout(() => {
  app.getSceneObjectByName('FLOOR').position.SetY(-4.350000000000002);
 }, 800);
 // ME END FLOOR updatePosy
 
  // ME START monster-MutantMesh-0 useScaleno info
 setTimeout(() => {
  app.getSceneObjectByName('monster-MutantMesh-0').useScale = true;
 }, 800);
 // ME END monster-MutantMesh-0 useScaleno info
 
  // ME START FLOOR updatePosx
 setTimeout(() => {
  app.getSceneObjectByName('FLOOR').position.SetX(0.2700000000000007);
 }, 800);
 // ME END FLOOR updatePosx
 
 // [MAIN_REPLACE2]
    })
  })
window.app = app;
