import MatrixEngineWGPU from "../src/world.js";
import {downloadMeshes, makeObjSeqArg} from '../src/engine/loader-obj.js';
// import MatrixEngineWGPU from "./src/world.js";
// import {downloadMeshes} from './src/engine/loader-obj.js';
import {LOG_FUNNY, LOG_INFO, LOG_MATRIX} from "../src/engine/utils.js";

export var loadObjsSequence = function() {

  let loadObjFile = new MatrixEngineWGPU({
    useSingleRenderPass: true,
    canvasSize: 'fullscreen',
    mainCameraParams: {
      type: 'WASD',
      responseCoef: 1000
    }
  }, () => {

    addEventListener('AmmoReady', () => {
      downloadMeshes(
        makeObjSeqArg({
          id: "swat-walk-pistol",
          path: "res/meshes/objs-sequence/swat-walk-pistol",
          from: 1,
          to: 20
        }),
        onLoadObj
      );
    })

    function onLoadObj(m) {
      // loadObjFile.myLoadedMeshes = m;
      // for(var key in m) {
      console.log(`%c Loaded objs: ${m} `, LOG_MATRIX);
      // }

      var animArg = {
        id: "swat-walk-pistol",
        meshList: m,
        // sumOfAniFrames: 61, No need if `animations` exist!
        currentAni: 0,
        // speed: 3, No need if `animations` exist!
        animations: {
          active: 'walk',
          walk: {
            from: 0,
            // to: 35,
            to: 20,
            speed: 3
          },
          walkPistol: {
            from: 36,
            to: 60,
            speed: 3
          }
        }
      };

      loadObjFile.addMeshObj({
        position: {x: 0, y: 2, z: -10},
        rotation: {x: 0, y: 0, z: 0},
        rotationSpeed: {x: 0, y: 0, z: 0},
        texturesPaths: ['./res/meshes/blender/cube.png'],
        name: 'CubePhysics',
        mesh: m.cube,
        physics: {
          enabled: false,
          geometry: "Cube"
        },
        objAnim
      })

      // loadObjFile.addMeshObj({
      //   position: {x: 0, y: 2, z: -10},
      //   rotation: {x: 0, y: 0, z: 0},
      //   rotationSpeed: {x: 0, y: 0, z: 0},
      //   texturesPaths: ['./res/meshes/blender/cube.png'],
      //   name: 'SpherePhysics',
      //   mesh: m.sphere,
      //   physics: {
      //     enabled: true,
      //     geometry: "Sphere"
      //   }
      // })


      // loadObjFile.addMeshObj({
      //   position: {x: 0, y: 2, z: -10},
      //   rotation: {x: 0, y: 0, z: 0},
      //   rotationSpeed: {x: 0, y: 0, z: 0},
      //   texturesPaths: ['./res/meshes/blender/cube.png'],
      //   name: 'CubePhysics',
      //   mesh: m.welcomeText,
      //   physics: {
      //     enabled: true,
      //     geometry: "Cube"
      //   }
      // })

    }
  })

  window.app = loadObjFile;

}