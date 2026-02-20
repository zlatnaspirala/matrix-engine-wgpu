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
        {scale: [1, 1, 1]})
      downloadMeshes({
        cube: "./res/meshes/blender/cube.obj",
      }, onGround,
        {scale: [20, 1, 20]})
    })

    function onGround(m) {
      loadObjFile.addMeshObj({
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
        }
      })
    }

    function onLoadObj(m) {
      loadObjFile.myLoadedMeshes = m;
      loadObjFile.addMeshObj({
        material: {type: 'standard'},
        position: {x: 0, y: 2, z: -20},
        rotation: {x: 0, y: 0, z: 0},
        rotationSpeed: {x: 0, y: 0, z: 0},
        texturesPaths: ['./res/textures/cube-g1.png'],
        name: 'cube1',
        mesh: m.cube,
        physics: {
          enabled: false,
          geometry: "Cube",
        },
        pointerEffect: {
          enabled: true,
          flameEffect: true, // <<<<<<<<<<<
          flameEmitter: true, // <<<<<<<<<<<
        },
        raycast: {enabled: true, radius: 2}
      })

      loadObjFile.addMeshObj({
        material: {type: 'standard'},
        position: {x: 0, y: -1, z: -20},
        rotation: {x: 0, y: 0, z: 0},
        rotationSpeed: {x: 0, y: 111, z: 0},
        texturesPaths: ['./res/textures/spiral-1.png'],
        name: 'ball1',
        mesh: m.ball,
        physics: {
          enabled: false,
          geometry: "Sphere"
        }
      })

      console.log(`%c Test access scene ${TEST} object.`, LOG_MATRIX);

      loadObjFile.addLight();
      loadObjFile.lightContainer[0].behavior.setOsc0(-1, 1, 0.001)
      loadObjFile.lightContainer[0].behavior.value_ = -1;
      loadObjFile.lightContainer[0].updater.push((light) => {
        light.position[0] = light.behavior.setPath0()
      })
      loadObjFile.lightContainer[0].position[1] = 9;
      var TEST = loadObjFile.getSceneObjectByName('cube2');

      setTimeout(() => {
        app.cameras.WASD.yaw = -0.03;
        app.cameras.WASD.pitch = -0.49;
        app.cameras.WASD.position[2] = 0;
        app.cameras.WASD.position[1] = 3.76;
      }, 800);
    }
  })
  window.app = loadObjFile;
}