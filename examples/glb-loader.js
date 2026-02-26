import MatrixEngineWGPU from "../src/world.js";
import {downloadMeshes} from '../src/engine/loader-obj.js';
// import {LOG_FUNNY, LOG_INFO, LOG_MATRIX} from "../src/engine/utils.js";
// import {loadBVH} from "../src/engine/loaders/bvh.js";
import {uploadGLBModel} from "../src/engine/loaders/webgpu-gltf.js";
/**
 * @Note
 * “Character and animation assets from Mixamo,
 * used under Adobe’s royalty‑free license. 
 * Redistribution of raw assets is not permitted.”
 **/
export function loadGLBLoader() {

  let TEST_ANIM = new MatrixEngineWGPU({
    useSingleRenderPass: true,
    canvasSize: 'fullscreen',
    mainCameraParams: {
      type: 'WASD',
      responseCoef: 1000
    },
    clearColor: {r: 0, b: 0.122, g: 0.122, a: 1}
  }, () => {

    addEventListener('AmmoReady', async () => {
      setTimeout(() => {
        app.cameras.WASD.yaw = -0.03;
        app.cameras.WASD.pitch = -0.49;
        app.cameras.WASD.position[2] = 0;
        app.cameras.WASD.position[1] = 35;
      }, 2000)

      downloadMeshes({cube: "./res/meshes/blender/cube.obj"}, onGround, {scale: [120, 0.5, 120]})

      // // Monster1
      var glbFile01 = await fetch("res/meshes/glb/monster.glb").then(res => res.arrayBuffer().then(buf => uploadGLBModel(buf, TEST_ANIM.device)));
      TEST_ANIM.addGlbObj({
        material: {type: 'standard', useTextureFromGlb: true},
        useScale: true,
        scale: [20, 20, 20],
        position: {x: 0, y: -4, z: -70},
        name: 'firstGlb',
        texturesPaths: ['./res/meshes/glb/textures/mutant_origin.png'],
      }, null, glbFile01);

      // var glbFile02 = await fetch("res/meshes/glb/monster.glb").then(res => res.arrayBuffer().then(buf => uploadGLBModel(buf, TEST_ANIM.device)));
      TEST_ANIM.addGlbObj({
        material: {type: 'power', useTextureFromGlb: true},
        useScale: true,
        scale: [20, 20, 20],
        position: {x: -40, y: -4, z: -70},
        name: 'firstGlb',
        texturesPaths: ['./res/meshes/glb/textures/mutant_origin.png'],
      }, null, glbFile01);

      // var glbFile03 = await fetch("res/meshes/glb/monster.glb").then(res => res.arrayBuffer().then(buf => uploadGLBModel(buf, TEST_ANIM.device)));
      TEST_ANIM.addGlbObj({
        material: {type: 'pong', useTextureFromGlb: true},
        useScale: true,
        scale: [20, 20, 20],
        position: {x: 40, y: -4, z: -70},
        name: 'firstGlb',
        texturesPaths: ['./res/meshes/glb/textures/mutant_origin.png'],
      }, null, glbFile01);

      // woman
      var glbFile11 = await fetch("res/meshes/glb/woman1.glb").then(res => res.arrayBuffer().then(buf => uploadGLBModel(buf, TEST_ANIM.device)));
      TEST_ANIM.addGlbObjInctance({
        material: {type: 'mirror', useTextureFromGlb: true},
        envMapParams: {
          baseColorMix: 0.75,
          mirrorTint: [0.9, 0.5, 1.0],    // Slight cool tint
          reflectivity: 0.5,               // 25% reflection blend
          illuminateColor: [0.3, 0.7, 1.0], // Soft cyan
          illuminateStrength: 0.1,          // Gentle rim
          illuminatePulse: 0.001,             // No pulse (static)
          fresnelPower: 5.0,                // Medium-sharp edge
          envLodBias: 2.5,
          usePlanarReflection: false,  // ✅ Env map mode
        },
        useScale: true,
        scale: [20, 20, 20],
        position: {x: 0, y: -4, z: -20},
        name: 'woman1',
        texturesPaths: ['./res/meshes/glb/textures/mutant_origin.png', './res/textures/env-maps/sky1.webp'],
      }, null, glbFile11);

      // var glbFile02 = await fetch("res/meshes/glb/woman1.glb").then(res => res.arrayBuffer().then(buf => uploadGLBModel(buf, TEST_ANIM.device)));
      TEST_ANIM.addGlbObj({
        material: {type: 'power', useTextureFromGlb: true},
        useScale: true,
        scale: [20, 20, 20],
        position: {x: -40, y: -4, z: -20},
        name: 'woman1',
        texturesPaths: ['./res/meshes/glb/textures/mutant_origin.png'],
      }, null, glbFile11);

      // var glbFile03 = await fetch("res/meshes/glb/woman1.glb").then(res => res.arrayBuffer().then(buf => uploadGLBModel(buf, TEST_ANIM.device)));
      TEST_ANIM.addGlbObj({
        material: {type: 'pong', useTextureFromGlb: true},
        useScale: true,
        scale: [20, 20, 20],
        position: {x: 40, y: -4, z: -20},
        name: 'woman1',
        texturesPaths: ['./res/meshes/glb/textures/mutant_origin.png'],
      }, null, glbFile11);


      // var glbFileWhouse = await fetch("res/meshes/glb/wood-house-1.glb").then(res => res.arrayBuffer().then(buf => uploadGLBModel(buf, TEST_ANIM.device)));
      // TEST_ANIM.addGlbObj({
      //   material: {type: 'pong', useTextureFromGlb: true},
      //   useScale: true,
      //   scale: [20, 20, 20],
      //   position: {x: 40, y: -4, z: -20},
      //   name: 'glbFileWhouse',
      //   texturesPaths: ['./res/meshes/glb/textures/mutant_origin.png'],
      // }, null, glbFileWhouse);

      // this is future load and replace skeletal anim.
      // const path = 'https://raw.githubusercontent.com/zlatnaspirala/Matrix-Engine-BVH-test/main/javascript-bvh/example.bvh';
      // const path = 'res/meshes/glb/glb-test1.bvh';
      // loadBVH(path).then(async (BVHANIM) => {
      //   var glbFile = await fetch(
      //     "res/meshes/glb/test.glb")
      //     .then(res => res.arrayBuffer().then(buf => uploadGLBModel(buf, TEST_ANIM.device)));
      //   TEST_ANIM.addGlbObj({
      //     // scale: [1,1,1],
      //     scale: [10, 10, 10],
      //     name: 'firstGlb',
      //     texturesPaths: ['./res/textures/rust.jpg'],
      //   }, BVHANIM, glbFile);
      // });
    })

    function onGround(m) {
      TEST_ANIM.addLight();
      TEST_ANIM.addMeshObj({
        material: {type: 'mirror'},
        envMapParams: {
          baseColorMix: 0.55,
          mirrorTint: [0.9, 0.95, 1.0],    // Slight cool tint
          reflectivity: 0.95,               // 25% reflection blend
          illuminateColor: [0.3, 0.7, 1.0], // Soft cyan
          illuminateStrength: 0.1,          // Gentle rim
          illuminatePulse: 0.001,             // No pulse (static)
          fresnelPower: 5.0,                // Medium-sharp edge
          envLodBias: 2.5,
          usePlanarReflection: false,  // ✅ Env map mode
        },
        position: {x: 0, y: -5, z: -10},
        rotation: {x: 0, y: 0, z: 0},
        rotationSpeed: {x: 0, y: 0, z: 0},
        texturesPaths: ['./res/textures/floor1.jpg', './res/textures/env-maps/sky1.webp'],
        name: 'ground',
        mesh: m.cube,
        physics: {
          enabled: false,
          mass: 0,
          geometry: "Cube"
        },
      });
      app.lightContainer[0].position[1] = 35;
      app.lightContainer[0].intensity = 6;

      app.activateBloomEffect();
      // app.activateVolumetricEffect();
      app.bloomPass.setIntensity(0.25);

    }
  })
  // just for dev
  window.app = TEST_ANIM;
}

// loadGLBLoader()