import MatrixEngineWGPU from "../src/world.js";
import {downloadMeshes} from '../src/engine/loader-obj.js';
import {geoTypesForMorph, LOG_MATRIX} from "../src/engine/utils.js";
import {MeshMorpher} from "../src/engine/procedural-mesh.js";
import {addRaycastsAABBListener} from "../src/engine/raycast.js";

export var fontana = function() {
  let fontana = new MatrixEngineWGPU({
    useSingleRenderPass: true,
    canvasSize: 'fullscreen',
    mainCameraParams: {
      type: 'WASD',
      responseCoef: 1000
    },
    clearColor: {r: 0, b: 0.122, g: 0.122, a: 1}
  }, () => {
    addEventListener('AmmoReady', () => {
      addRaycastsAABBListener();
      downloadMeshes({
        ball: "./res/meshes/blender/sphere.obj",
        cube: "./res/meshes/blender/cube.obj",
      }, onLoadObj,
        {scale: [2, 2, 2]})
      downloadMeshes({
        cube: "./res/meshes/blender/cube.obj",
      }, onGround,
        {scale: [30, 0.5, 30]})
    })

    function onGround(m) {
      fontana.addMeshObj({
        material: {type: 'standard'},
        position: {x: 0, y: -5, z: -10},
        rotation: {x: 0, y: 0, z: 0},
        rotationSpeed: {x: 0, y: 0, z: 0},
        texturesPaths: ['./res/textures/floor1.webp', './res/textures/env-maps/sky1.webp'],
        envMapParams: {
          baseColorMix: 0.5,
          mirrorTint: [0.9, 0.95, 1.0],    // Slight cool tint
          reflectivity: 0.4,               // 25% reflection blend
          illuminateColor: [0.3, 0.7, 1.0], // Soft cyan
          illuminateStrength: 0.1,          // Gentle rim
          illuminatePulse: 0.001,             // No pulse (static)
          fresnelPower: 5.0,                // Medium-sharp edge
          envLodBias: 2.5,
          usePlanarReflection: false,  // ✅ Env map mode
        },
        name: 'floor',
        mesh: m.cube,
        physics: {
          enabled: false,
          mass: 0,
          geometry: "Cube"
        }
      })
    }

    function onLoadObj(m) {
      fontana.myLoadedMeshes = m;
      fontana.addMeshObj({
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
      // fontana
      const obj = fontana.addFontana({
        material: {type: 'free'},
        position: {x: 0, y: 4, z: -15} ,
        rotation: {x: 0, y: 0, z: 0},
        scale: [10, 10, 10],
        rotationSpeed: {x: 0, y: 0, z: 0},
        texturesPaths: ['./res/textures/cube-g1_low.webp'],
        name: `fontana`,
        physics: {enabled: false, geometry: "Sphere"},
        raycast: {enabled: true, radius: 1.5}
      });

      fontana.addLight();
      fontana.lightContainer[0].setIntensity(10);

      fontana.activateBloomEffect();
      fontana.lightContainer[0].behavior.setOsc0(-2, 2, 0.001)
      fontana.lightContainer[0].behavior.value_ = -1;
      fontana.lightContainer[0].updater.push((light) => {
        light.setPosX(light.behavior.setPath0())
        light.setTargetX(light.behavior.setPath0())
      })

      fontana.lightContainer[0].setPosition(0, 17, -10);
      fontana.lightContainer[0].setTarget(0, 0, -10);

      // var TEST = fontana.getSceneObjectByName('cube2');
      setTimeout(() => {
        // app.activateBloomEffect();
        app.cameras.WASD.yaw = -0.03;
        app.cameras.WASD.pitch = -0.49;
        app.cameras.WASD.position[2] = 0;
        app.cameras.WASD.position[1] = 5;
      }, 800);
    }

    fontana.canvas.addEventListener("ray.hit.event", (e) => {
      console.log('ray.hit.event detected');
      if(e.detail.hitObject.morphTo) e.detail.hitObject.morphTo(0.0, 500);

    });

  })
  window.app = fontana;
}