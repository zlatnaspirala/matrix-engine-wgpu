import MatrixEngineWGPU from "../src/world.js";
import {downloadMeshes, makeObjSeqArg} from '../src/engine/loader-obj.js';
import {LOG_MATRIX} from "../src/engine/utils.js";

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

      // requied now
      loadObjFile.addLight();

      // adapt
      app.lightContainer[0].position[2] = -20;
      app.lightContainer[0].position[1] = 16;
      app.lightContainer[0].intensity = 12;

      downloadMeshes({
        cube: "./res/meshes/blender/cube.obj",
      }, onGround,
        {scale: [20, 1, 20]})


      downloadMeshes(
        makeObjSeqArg({
          id: "swat-walk-pistol",
          path: "res/meshes/objs-sequence/swat-walk-pistol",
          from: 1,
          to: 20
        }),
        onLoadObj,
        {scale: [0.1, 0.1, 0.1]}
      );
    })

    function onLoadObj(m) {
      console.log(`%c Loaded objs: ${m} `, LOG_MATRIX);
      var objAnim = {
        id: "swat-walk-pistol",
        meshList: m,
        currentAni: 1,
        animations: {
          active: 'walk',
          walk: {
            from: 1,
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
        position: {x: 0, y: 0, z: -20},
        rotation: {x: 0, y: 0, z: 0},
        rotationSpeed: {x: 0, y: 0, z: 0},
        scale: [100, 100, 100],
        texturesPaths: ['./res/meshes/blender/cube.png'],
        name: 'swat',
        mesh: m['swat-walk-pistol'],
        physics: {
          enabled: false,
          geometry: "Cube"
        },
        objAnim: objAnim
      })
  

      setTimeout(() => {
        app.cameras.WASD.pitch = -0.2605728267949113;
        app.cameras.WASD.yaw = -0.0580;
        app.cameras.WASD.position[1] = 15
        app.cameras.WASD.position[2] = 11;
        app.getSceneObjectByName('swat').objAnim.play('walk')
      }, 200)
    }

    function onGround(m) {

      setTimeout(() => {
        app.cameras.WASD.yaw = -0.03;
        app.cameras.WASD.pitch = -0.49;
        app.cameras.WASD.position[2] = 0;
        app.cameras.WASD.position[1] = 3.76;
      }, 500)

      loadObjFile.addMeshObj({
        position: {x: 0, y: 0, z: -10},
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
  })
  // Just for dev - easy console access
  window.app = loadObjFile;
}