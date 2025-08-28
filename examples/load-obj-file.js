import MatrixEngineWGPU from "../src/world.js";
import {downloadMeshes} from '../src/engine/loader-obj.js';
import {LOG_FUNNY, LOG_INFO, LOG_MATRIX} from "../src/engine/utils.js";
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

        // loadObjFile.addLight();
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
        },
        // raycast: { enabled: true , radius: 2 }
      })

    }

    function onLoadObj(m) {
      loadObjFile.myLoadedMeshes = m;
      for(var key in m) {
        // console.log(`%c Loaded objs: ${key} `, LOG_MATRIX);
      }
      loadObjFile.addMeshObj({
        position: {x: 0, y: 2, z: -20},
        rotation: {x: 0, y: 0, z: 0},
        rotationSpeed: {x: 0, y: 0, z: 0},
        texturesPaths: ['./res/meshes/blender/cube.png'],
        name: 'cube1',
        mesh: m.cube,
        physics: {
          enabled: false,
          geometry: "Cube",
        },
        // raycast: { enabled: true , radius: 2 }
      })

      loadObjFile.addMeshObj({
        position: {x: 0, y: -1, z: -20},
        rotation: {x: 0, y: 0, z: 0},
        rotationSpeed: {x: 0, y: 111, z: 0},
        texturesPaths: ['./res/meshes/blender/cube.png'],
        name: 'ball1',
        mesh: m.ball,
        physics: {
          enabled: false,
          geometry: "Sphere"
        },
        // raycast: { enabled: true , radius: 2 }
      })

      var TEST = loadObjFile.getSceneObjectByName('cube2');
      console.log(`%c Test access scene ${TEST} object.`, LOG_MATRIX);

      loadObjFile.addLight();
      loadObjFile.lightContainer[0].behavior.setOsc0(-1,1,0.1)
      loadObjFile.lightContainer[0].behavior.value_ = -1;
      loadObjFile.lightContainer[0].updater.push((light) => {
        light.position[0] = light.behavior.setPath0()
      })

    }
  })
  // just for dev
  window.app = loadObjFile;
}