import MatrixEngineWGPU from "../src/world.js";
import {downloadMeshes} from '../src/engine/loader-obj.js';
import {geoTypesForMorph, LOG_MATRIX} from "../src/engine/utils.js";
import {MeshMorpher} from "../src/engine/procedural-mesh.js";
import {addRaycastsAABBListener} from "../src/engine/raycast.js";
import {uploadGLBModel} from "../src/engine/loaders/webgpu-gltf.js";

export var loadObjFile = function() {
  let loadObjFile = new MatrixEngineWGPU({
    useSingleRenderPass: true,
    canvasSize: 'fullscreen',
    dontUsePhysics: true,
    mainCameraParams: {
      type: 'WASD',
      responseCoef: 1000
    },
    clearColor: {r: 0, b: 0.122, g: 0.122, a: 1}
  }, () => {

    loadObjFile.addLight();
    addRaycastsAABBListener();
    // addEventListener('AmmoReady', () => {

    // })

    setTimeout(() => {
      downloadMeshes({
        ball: "./res/meshes/blender/sphere.obj",
        cube: "./res/meshes/blender/cube.obj",
      }, onLoadObj,
        {scale: [1, 1, 1]})

      downloadMeshes({
        cube: "./res/meshes/blender/cube.obj",
      }, onGround,
        {scale: [30, 0.5, 30]})

    }, 2)

    function onGround(m) {
      loadObjFile.addMeshObj({
        material: {type: 'standard'},
        position: {x: 0, y: -5, z: -10},
        rotation: {x: 0, y: 0, z: 0},
        rotationSpeed: {x: 0, y: 0, z: 0},
        texturesPaths: ['./res/textures/floor1.webp'],
        name: 'floor',
        mesh: m.cube,
        physics: {
          enabled: false,
          mass: 0,
          geometry: "Cube"
        }
      })
    }

    async function onLoadObj(m) {
      loadObjFile.myLoadedMeshes = m;
      loadObjFile.addMeshObj({
        material: {type: 'mirror'},
        position: {x: 0, y: -1, z: -20},
        rotation: {x: 0, y: 0, z: 0},
        scale: [100, 100, 100],
        rotationSpeed: {x: 0, y: 0, z: 0},
        texturesPaths: ['./res/textures/cube-g1.webp', './res/textures/env-maps/sky1_lod_mid.webp'],
        envMapParams: {
          baseColorMix: 0.0,                // CLEAR SKY
          mirrorTint: [0.9, 0.95, 1.0],     // Slight cool tint
          reflectivity: 0.25,               // 25% reflection blend
          illuminateColor: [0.3, 0.7, 1.0], // Soft cyan
          illuminateStrength: 0.1,          // Gentle rim
          illuminatePulse: 0.01,            // No pulse (static)
          fresnelPower: 2.0,                // Medium-sharp edge
          envLodBias: 1.5,
          usePlanarReflection: false,       // ✅ Env map mode
        },
        name: 'sky',
        mesh: m.ball,
        physics: {
          enabled: false,
          geometry: "Sphere"
        }
      });

      loadObjFile.addMeshObj({
        material: {type: 'standard'},
        position: {x: 0, y: 3, z: -10},
        rotation: {x: 0, y: 0, z: 0},
        rotationSpeed: {x: 0, y: 0, z: 0},
        texturesPaths: ['./res/textures/floor1.webp'],
        name: 'cube',
        mesh: m.cube,
        physics: {
          enabled: false,
          mass: 0,
          geometry: "Cube"
        },
        pointerEffect: {
          enabled: true,
          pointer: true,
          flameEmitter: true,
          flameEffect: true,
        }
      })


      // var glbFile11 = await fetch("res/meshes/glb/woman1.glb").then(res => res.arrayBuffer().then(buf => uploadGLBModel(buf, loadObjFile.device)));
      //    loadObjFile.addGlbObjInctance({
      //      material: {type: 'mirror', useTextureFromGlb: true},
      //      envMapParams: {
      //        baseColorMix: 0.75,
      //        mirrorTint: [0.9, 0.5, 1.0],    // Slight cool tint
      //        reflectivity: 0.5,               // 25% reflection blend
      //        illuminateColor: [0.3, 0.7, 1.0], // Soft cyan
      //        illuminateStrength: 0.1,          // Gentle rim
      //        illuminatePulse: 0.001,             // No pulse (static)
      //        fresnelPower: 5.0,                // Medium-sharp edge
      //        envLodBias: 2.5,
      //        usePlanarReflection: false,  // ✅ Env map mode
      //      },
      //      useScale: true,
      //      scale: [20, 20, 20],
      //      position: {x: 0, y: -4, z: -20},
      //      name: 'woman1',
      //      texturesPaths: ['./res/meshes/glb/textures/mutant_origin.webp', './res/textures/env-maps/sky1.webp'],
      //    }, null, glbFile11);



      loadObjFile.lightContainer[0].intensity = 10;

      // loadObjFile.activateBloomEffect();
      // loadObjFile.lightContainer[0].behavior.setOsc0(-2, 2, 0.001)
      // loadObjFile.lightContainer[0].behavior.value_ = -1;
      // loadObjFile.lightContainer[0].updater.push((light) => {
      //   light.position[0] = light.behavior.setPath0()
      //   light.target[0] = light.behavior.setPath0()
      // })

      loadObjFile.lightContainer[0].position = [0, 17, -10];
      loadObjFile.lightContainer[0].target = [0, 0, -10];

      var TEST = loadObjFile.getSceneObjectByName('cube2');
      setTimeout(() => {
        // app.activateBloomEffect();
        let cube1 = app.getSceneObjectByName('cube1')
        // cube1.effects.flameEffect.intensity = 100;
        // cube1.effects.flameEffect.morphTo("pyramid", 8)
        app.cameras.WASD.yaw = -0.03;
        app.cameras.WASD.pitch = -0.49;
        app.cameras.WASD.position[2] = 0;
        app.cameras.WASD.position[1] = 5;
      }, 800);
    }

    loadObjFile.canvas.addEventListener("ray.hit.event", (e) => {
      console.log('ray.hit.event detected');
      if(e.detail.hitObject.morphTo) e.detail.hitObject.morphTo(0.0, 500);

    });

  })
  window.app = loadObjFile;
}