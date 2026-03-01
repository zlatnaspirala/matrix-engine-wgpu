import MatrixEngineWGPU from "../src/world.js";
import {downloadMeshes} from '../src/engine/loader-obj.js';
import {LOG_MATRIX} from "../src/engine/utils.js";
// import {addRaycastsAABBListener} from "../src/engine/raycast.js";

export var loadObjFile = function() {
  let loadObjFile = new MatrixEngineWGPU({
    useSingleRenderPass: true,
    canvasSize: 'fullscreen',
    mainCameraParams: {
      type: 'WASD',
      responseCoef: 1000
    },
    clearColor: {r: 0, b: 0.122, g: 0.122, a: 1}
  }, () => {
    addEventListener('AmmoReady', () => {
      downloadMeshes({
        ball: "./res/meshes/blender/sphere.obj",
        cube: "./res/meshes/blender/cube.obj",
      }, onLoadObj,
        {scale: [2, 2, 2]})
      downloadMeshes({
        cube: "./res/meshes/blender/cube.obj",
      }, onGround,
        {scale: [20, 1, 20]})
    })

    function onGround(m) {
      loadObjFile.addMeshObj({
        material: {type: 'mirror'},
        position: {x: 0, y: -5, z: -10},
        rotation: {x: 0, y: 0, z: 0},
        rotationSpeed: {x: 0, y: 0, z: 0},
        texturesPaths: ['./res/textures/floor1.jpg', './res/textures/env-maps/sky1.webp'],
        envMapParams: {
          baseColorMix: 0.95,
          mirrorTint: [0.9, 0.95, 1.0],    // Slight cool tint
          reflectivity: 0.25,               // 25% reflection blend
          illuminateColor: [0.3, 0.7, 1.0], // Soft cyan
          illuminateStrength: 0.1,          // Gentle rim
          illuminatePulse: 0.001,             // No pulse (static)
          fresnelPower: 5.0,                // Medium-sharp edge
          envLodBias: 2.5,
          usePlanarReflection: false,  // ✅ Env map mode
        },
        name: 'ground',
        mesh: m.cube,
        physics: {
          enabled: false,
          mass: 0,
          geometry: "Cube"
        }
      })
    }

    function onLoadObj(m) {
      loadObjFile.myLoadedMeshes = m;
      loadObjFile.addMeshObj({
        material: {type: 'mirror'},
        position: {x: 0, y: 3, z: -20},
        rotation: {x: 0, y: 0, z: 0},
        rotationSpeed: {x: 0, y: 0, z: 0},
        texturesPaths: ['./res/textures/cube-g1.png', './res/textures/env-maps/sky1.webp'],
        name: 'cube1',
        mesh: m.cube,
        envMapParams: {
          baseColorMix: 0.2, // normal mix
          mirrorTint: [0.9, 0.95, 1.0],    // Slight cool tint
          reflectivity: 0.95,               // 25% reflection blend
          illuminateColor: [0.3, 0.7, 1.0], // Soft cyan
          illuminateStrength: 0.4,          // Gentle rim
          illuminatePulse: 0.001,             // No pulse (static)
          fresnelPower: 5.0,                // Medium-sharp edge
          envLodBias: 2.5,
          usePlanarReflection: false,  // ✅ Env map mode
        },
        physics: {
          enabled: false,
          geometry: "Cube",
        },
        // pointerEffect: {
        //   // enabled: true,
        //   // flameEffect: true,
        //   // flameEmitter: true,
        // },
        raycast: {enabled: true, radius: 2}
      })

      loadObjFile.addMeshObj({
        material: {type: 'mirror'},
        position: {x: 0, y: -1, z: -20},
        rotation: {x: 0, y: 0, z: 0},
        scale: [100, 100, 100],
        rotationSpeed: {x: 0, y: 0, z: 0},
        texturesPaths: ['./res/textures/cube-g1.png', './res/textures/env-maps/sky1.webp'],
        envMapParams: {
          baseColorMix: 0.0, // CLEAR SKY
          mirrorTint: [0.9, 0.95, 1.0],    // Slight cool tint
          reflectivity: 0.25,               // 25% reflection blend
          illuminateColor: [0.3, 0.7, 1.0], // Soft cyan
          illuminateStrength: 0.1,          // Gentle rim
          illuminatePulse: 0.01,             // No pulse (static)
          fresnelPower: 2.0,                // Medium-sharp edge
          envLodBias: 1.5,
          usePlanarReflection: false,  // ✅ Env map mode
        },
        name: 'sky',
        mesh: m.ball,
        physics: {
          enabled: false,
          geometry: "Sphere"
        }
      });

      loadObjFile.addProceduralMeshObj({
        material: {type: 'standard'},
        position: {x: 0, y: -1, z: -20},
        rotation: {x: 0, y: 0, z: 0},
        scale: [100, 100, 100],
        rotationSpeed: {x: 0, y: 0, z: 0},
        texturesPaths: ['./res/textures/cube-g1.png'],
        geometryA: {type: 'cube', size: 1},
        // geometryB: {type: 'sphere', size: 1, segments: 16},
        name: 'myProCube',
        mesh: m.ball,
        physics: {
          enabled: false,
          geometry: "Sphere"
        }
      });

      console.log(`%c Test access scene ${TEST} object.`, LOG_MATRIX);

      loadObjFile.addLight();
      loadObjFile.lightContainer[0].behavior.setOsc0(-1, 1, 0.001)
      loadObjFile.lightContainer[0].behavior.value_ = -1;
      loadObjFile.lightContainer[0].updater.push((light) => {
        light.position[0] = light.behavior.setPath0()
      })
      loadObjFile.lightContainer[0].position[1] = 11;
      var TEST = loadObjFile.getSceneObjectByName('cube2');
      setTimeout(() => {
        // app.activateBloomEffect();
        let cube1 = app.getSceneObjectByName('cube1')
        // cube1.effects.flameEffect.intensity = 100;
        // cube1.effects.flameEffect.morphTo("pyramid", 8)
        app.cameras.WASD.yaw = -0.03;
        app.cameras.WASD.pitch = -0.49;
        app.cameras.WASD.position[2] = 0;
        app.cameras.WASD.position[1] = 3.76;
      }, 800);
    }
  })
  window.app = loadObjFile;
}