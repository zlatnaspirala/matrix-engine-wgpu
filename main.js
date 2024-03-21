import MatrixEngineWGPU from "./src/world.js";
import {downloadMeshes} from './src/engine/loader-obj.js';
import {LOG_FUNNY, LOG_INFO, LOG_MATRIX} from "./src/engine/utils.js";

export let application = new MatrixEngineWGPU({
  useSingleRenderPass: true,
  canvasSize: 'fullscreen',
  mainCameraParams: {
    type: 'WASD',
    responseCoef: 1000
  }
}, () => {

  addEventListener('AmmoReady', () => {
    downloadMeshes({
      welcomeText: "./res/meshes/blender/piramyd.obj",
      armor: "./res/meshes/obj/armor.obj",
      sphere: "./res/meshes/blender/sphere.obj",
      cube: "./res/meshes/blender/cube.obj",
    }, onLoadObj)
  })

  function onLoadObj(m) {
    application.myLoadedMeshes = m;
    for(var key in m) {
      console.log(`%c Loaded objs: ${key} `, LOG_MATRIX);
    }

    application.addMeshObj({
      position: {x: 0, y: 2, z: -10},
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

    application.addMeshObj({
      position: {x: 0, y: 2, z: -10},
      rotation: {x: 0, y: 0, z: 0},
      rotationSpeed: {x: 0, y: 0, z: 0},
      texturesPaths: ['./res/meshes/blender/cube.png'],
      name: 'SpherePhysics',
      mesh: m.sphere,
      physics: {
        enabled: true,
        geometry: "Sphere"
      }
    })
  }
})

window.app = application