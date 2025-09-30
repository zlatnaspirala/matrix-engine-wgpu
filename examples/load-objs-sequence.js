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
      app.lightContainer[0].position[1] = 12;
      app.lightContainer[0].intensity = 12;

      downloadMeshes(
        makeObjSeqArg({
          id: "swat-walk-pistol",
          path: "res/meshes/objs-sequence/swat-walk-pistol",
          from: 1,
          to: 20
        }),
        onLoadObj,
        {scale: [0.1,0.1,0.1]}
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
        position: {x: 0, y: 2, z: -20},
        rotation: {x: 0, y: 0, z: 0},
        rotationSpeed: {x: 0, y: 0, z: 0},
        scale: [100,100,100],
        texturesPaths: ['./res/meshes/blender/cube.png'],
        name: 'swat',
        mesh: m['swat-walk-pistol'],
        physics: {
          enabled: false,
          geometry: "Cube"
        },
        objAnim: objAnim
      })
      app.mainRenderBundle[0].objAnim.play('walk');

      setTimeout(()=> {
      app.cameras.WASD.pitch =  -0.2605728267949113;
      app.cameras.WASD.yaw = -0.0580;
      app.cameras.WASD.position[1] = 15
      app.cameras.WASD.position[2] = 11
      }, 200)
    }
  })
  // Just for dev - easy console access
  window.app = loadObjFile;
}