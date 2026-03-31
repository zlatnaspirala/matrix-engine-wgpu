import MatrixEngineWGPU from "../src/world.js";
import {downloadMeshes} from '../src/engine/loader-obj.js';
import {addRaycastsAABBListener} from "../src/engine/raycast.js";
import {isMobile} from "../src/engine/utils.js";

export var loadObjFile = function() {
  let loadObjFile = new MatrixEngineWGPU({
    canvasSize: 'fullscreen',
    fastRender: 0.9,
    dontUsePhysics: true,
    mainCameraParams: {
      type: 'WASD',
      responseCoef: 1000
    },
    clearColor: {r: 0, b: 0.122, g: 0.122, a: 1}
  }, () => {
    loadObjFile.addLight();

    downloadMeshes({ball: "./res/meshes/blender/sphere.obj", cube: "./res/meshes/blender/cube.obj", },
      onLoadObj, {scale: [1, 1, 1]})
    downloadMeshes({cube: "./res/meshes/blender/cube.obj"}, onGround, {scale: [30, 0.5, 30]})

    addRaycastsAABBListener('canvas1', 'click');

    function onGround(m) {
      loadObjFile.addMeshObj({
        material: {type: 'mirror'},
        envMapParams: {
          baseColorMix: 0.5,                // CLEAR SKY
          mirrorTint: [0.9, 0.95, 1.0],     // Slight cool tint
          reflectivity: 0.5,                // 25% reflection blend
          illuminateColor: [0.5, 0.5, 0.2], // Soft cyan
          illuminateStrength: 0.1,          // Gentle rim
          illuminatePulse: 0.01,            // No pulse (static)
          fresnelPower: 0.1,                // Medium-sharp edge
          envLodBias: 2.5,
          usePlanarReflection: false,       // ✅ Env map mode
        },
        position: {x: 0, y: -5, z: -10},
        rotation: {x: 0, y: 0, z: 0},
        rotationSpeed: {x: 0, y: 0, z: 0},
        texturesPaths: ['./res/textures/floor1.webp', './res/textures/env-maps/sky1_lod_mid.webp'],
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
      loadObjFile.addMeshObj({
        material: {type: 'mirror'},
        position: {x: 0, y: -1, z: -20},
        rotation: {x: 0, y: 0, z: 0},
        scale: [100, 100, 100],
        rotationSpeed: {x: 0, y: 110.5, z: 0},
        texturesPaths: ['./res/textures/cube-g1.webp', './res/textures/env-maps/sky1_lod_mid.webp'],
        envMapParams: {
          baseColorMix: 0.0,                // CLEAR SKY
          mirrorTint: [0.9, 0.95, 1.0],     // Slight cool tint
          reflectivity: 0.95,               // 25% reflection blend
          illuminateColor: [0.2, 0.2, 0.2], // Soft cyan
          illuminateStrength: 0.1,          // Gentle rim
          illuminatePulse: 0.01,            // No pulse (static)
          fresnelPower: 1.0,                // Medium-sharp edge
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

      let MYCUBE = loadObjFile.addMeshObj({
        material: {type: 'standard'},
        position: {x: 0, y: 3, z: -10},
        rotation: {x: 0, y: 0, z: 0},
        rotationSpeed: {x: 0, y: 0, z: 0},
        texturesPaths: ['./res/textures/floor1.webp', './res/textures/env-maps/sky1_lod_mid.webp'],
        name: 'cube',
        mesh: m.cube,
        envMapParams: {
          baseColorMix: 0.99,               // CLEAR SKY
          mirrorTint: [0.9, 0.95, 1.0],     // Slight cool tint
          reflectivity: 0.25,               // 25% reflection blend
          illuminateColor: [0.3, 0.7, 1.0], // Soft cyan
          illuminateStrength: 0.1,          // Gentle rim
          illuminatePulse: 0.01,            // No pulse (static)
          fresnelPower: 2.0,                // Medium-sharp edge
          envLodBias: 1.5,
          usePlanarReflection: false,       // ✅ Env map mode
        },
        raycast: {enabled: true, radius: 1},
        physics: {
          enabled: false,
          mass: 0,
          geometry: "Cube"
        },
        pointerEffect: {
          enabled: true,
          flameEmitter: true
        }
      })

      loadObjFile.lightContainer[0].setIntensity(5);

      if(isMobile() == false) {
        loadObjFile.activateBloomEffect();
        loadObjFile.lightContainer[0].behavior.setOsc0(-2, 2, 0.01)
        loadObjFile.lightContainer[0].behavior.value_ = -1;
        loadObjFile.lightContainer[0].updater.push((light) => {
          light.setTargetX(light.behavior.setPath0());
          light.setPosX(light.behavior.setPath0());
        })
        loadObjFile.lightContainer[0].setPosition(0, 15, -10);
        loadObjFile.lightContainer[0].setTarget(0, 0, -10);
      }

      setTimeout(() => {
        MYCUBE.effects.flameEmitter.setIntensity(100);
        MYCUBE.effects.flameEmitter.recreateVertexDataCrazzy(4);
        MYCUBE.setAmbient(10, 1, 0);
        app.cameras.WASD.yaw = -0.03;
        app.cameras.WASD.pitch = -0.49;
        app.cameras.WASD.position[2] = 0;
        app.cameras.WASD.position[1] = 10;
        app.cameras.WASD._dirtyAngle = true;
      }, 400);
    }

    loadObjFile.canvas.addEventListener("ray.hit.event", (e) => {
      // console.log('ray.hit.event detected');
      if(e.detail.hitObject.name.startsWith('cube')) {
        e.detail.hitObject.effects.flameEmitter.recreateVertexDataCrazzy(4)
      }
    });

  })
  window.app = loadObjFile;
}