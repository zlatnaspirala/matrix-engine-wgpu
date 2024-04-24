import MatrixEngineWGPU from "../../../src/world.js";
import {downloadMeshes} from '../../../src/engine/loader-obj.js';
// import MatrixEngineWGPU from "./src/world.js";
// import {downloadMeshes} from './src/engine/loader-obj.js';
import {LOG_FUNNY, LOG_INFO, LOG_MATRIX} from "../../../src/engine/utils.js";

export var loadJamb = function() {

let jamb = new MatrixEngineWGPU({
  useSingleRenderPass: true,
  canvasSize: 'fullscreen',
  mainCameraParams: {
    type: 'arcball',
    responseCoef: 1
  }
}, () => {

  addEventListener('AmmoReady', () => {
    downloadMeshes({
      welcomeText: "./res/meshes/blender/piramyd.obj",
      cube: "./res/meshes/blender/cube.obj",
    }, onLoadObj)
  })

  function onLoadObj(m) {
    jamb.myLoadedMeshes = m;
    for(var key in m) {
      console.log(`%c Loaded objs: ${key} `, LOG_MATRIX);
    }

    jamb.addMeshObj({
      position: {x: 0, y: 2, z: -15},
      rotation: {x: 0, y: 0, z: 0},
      rotationSpeed: {x: 0, y: 0, z: 0},
      texturesPaths: ['./res/meshes/blender/cube.png'],
      name: 'CubePhysics',
      mesh: m.cube,
      physics: {
        enabled: true,
        geometry: "Cube"
      }
    })

    jamb.addMeshObj({
      position: {x: 0, y: 1, z: -120},
      rotation: {x: 0, y: 0, z: 0},
      rotationSpeed: {x: 0, y: 0, z: 0},
      texturesPaths: ['./res/meshes/blender/cube.png'],
      name: 'welcomeTextPhysics',
      mesh: m.welcomeText,
      // physics: {
      //   enabled: true,
      //   geometry: "Sphere"
      // }
    })
  }
})

 window.app = loadObjFile;

}