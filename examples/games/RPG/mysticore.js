
import MatrixEngineWGPU from "../../../src/world.js";
import {downloadMeshes} from '../../../src/engine/loader-obj.js';
import {uploadGLBModel} from "../../../src/engine/loaders/webgpu-gltf.js";
import {Controller} from "./controller.js";
/**
 * @Note
 * “Character and animation assets from Mixamo,
 * used under Adobe’s royalty‑free license. 
 * Redistribution of raw assets is not permitted.”
 **/
let MYSTICORE = new MatrixEngineWGPU({
  useSingleRenderPass: true,
  canvasSize: 'fullscreen',
  mainCameraParams: {
    type: 'WASD',
    responseCoef: 1000
  },
  clearColor: {r: 0, b: 0.122, g: 0.122, a: 1}
}, () => {

  addEventListener('AmmoReady', async () => {

    let test1 = new Controller(MYSTICORE.canvas);
    MYSTICORE.RPG = test1;

    app.cameras.WASD.movementSpeed = 100;

    setTimeout(() => {
      app.cameras.WASD.yaw = -0.03;
      app.cameras.WASD.pitch = -0.49;
      app.cameras.WASD.position[2] = 0;
      app.cameras.WASD.position[1] = 23;
    }, 2000)

    downloadMeshes({cube: "./res/meshes/blender/cube.obj"}, onGround, {scale: [120, 0.5, 120]})

    // // Monster1
    var glbFile01 = await fetch("res/meshes/glb/monster.glb").then(res => res.arrayBuffer().then(buf => uploadGLBModel(buf, MYSTICORE.device)));
    MYSTICORE.addGlbObj({
      material: {type: 'standard', useTextureFromGlb: true},
      scale: [20, 20, 20],
      position: {x: 0, y: -4, z: -70},
      name: 'local-hero',
      texturesPaths: ['./res/meshes/glb/textures/mutant_origin.png'],
      raycast: { enabled: true , radius: 1.5 }
    }, null, glbFile01);

    // var glbFile02 = await fetch("res/meshes/glb/monster.glb").then(res => res.arrayBuffer().then(buf => uploadGLBModel(buf, MYSTICORE.device)));
    // MYSTICORE.addGlbObj({
    //   material: {type: 'power', useTextureFromGlb: true},
    //   scale: [20, 20, 20],
    //   position: {x: -40, y: -4, z: -70},
    //   name: 'firstGlb',
    //   texturesPaths: ['./res/meshes/glb/textures/mutant_origin.png'],
    // }, null, glbFile02);

    // var glbFile03 = await fetch("res/meshes/glb/monster.glb").then(res => res.arrayBuffer().then(buf => uploadGLBModel(buf, MYSTICORE.device)));
    // MYSTICORE.addGlbObj({
    //   material: {type: 'pong', useTextureFromGlb: true},
    //   scale: [20, 20, 20],
    //   position: {x: 40, y: -4, z: -70},
    //   name: 'firstGlb',
    //   texturesPaths: ['./res/meshes/glb/textures/mutant_origin.png'],
    // }, null, glbFile03);

  })

  function onGround(m) {
    MYSTICORE.addLight();
    MYSTICORE.addMeshObj({
      position: {x: 0, y: -5, z: -10},
      rotation: {x: 0, y: 0, z: 0},
      rotationSpeed: {x: 0, y: 0, z: 0},
      texturesPaths: ['./res/meshes/blender/cube.png'],
      name: 'ground',
      mesh: m.cube,
      physics: {
        enabled: false,
        mass: 0,
        geometry: "Cube"
      },
    });
    app.lightContainer[0].position[1] = 25;
  }
})
// just for dev
window.app = MYSTICORE;

// let dragStart = null;
// let dragEnd = null;
// let selecting = false;

// canvas.addEventListener('mousedown', (e) => {
//     if(e.button === 2){ // right mouse
//         selecting = true;
//         dragStart = { x: e.clientX, y: e.clientY };
//         dragEnd = { x: e.clientX, y: e.clientY };
//     }
// });

// canvas.addEventListener('mousemove', (e) => {
//     if(selecting){
//         dragEnd = { x: e.clientX, y: e.clientY };
//     }
// });

// canvas.addEventListener('mouseup', (e) => {
//     if(selecting){
//         selecting = false;
//         selectCharactersInRect(dragStart, dragEnd);
//         dragStart = dragEnd = null;
//     }
// });