import MatrixEngineWGPU from "../src/world.js";
import {downloadMeshes, makeObjSeqArg} from '../src/engine/loader-obj.js';
import {LOG_MATRIX} from "../src/engine/utils.js";

/**
 * @description
 * In this example we laso use optimisation flag
 *  MAX_BONES: 0
 * because this is morphing not skeletal animation.
 * Sequence of meshies are loaded and then drawen on by one.
 * 
 * @Performace$Price
 * Medium
 * 
 * It it good to use it for mobile devices also
 * but size of objects are crucial.
 */
export var loadObjsSequence = function() {
  let loadObjFile = new MatrixEngineWGPU({
    fastRender: 0.8,
    canvasSize: 'fullscreen',
    dontUsePhysics: true,
    MAX_SPOTLIGHTS: 1,
    MAX_BONES: 0,
    mainCameraParams: {
      type: 'WASD',
      responseCoef: 1000
    }
  }, () => {

    loadObjFile.addLight();
    loadObjFile.lightContainer[0].setPosZ(-20);
    loadObjFile.lightContainer[0].setPosY(35);
    loadObjFile.lightContainer[0].setIntensity(5);

    downloadMeshes({cube: "./res/meshes/blender/cube.obj"}, onGround, {scale: [20, 1, 20]});

    downloadMeshes(
      makeObjSeqArg({
        id: "swat-walk-pistol",
        path: "res/meshes/objs-sequence/swat-walk-pistol",
        from: 1,
        to: 20
      }),
      onLoadObj, {scale: [0.1, 0.1, 0.1]});

    function onLoadObj(m) {
      console.log(`%c Loaded objs , now construct scene object : ${m} `, LOG_MATRIX);
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
        material: {type: 'standard'},
        position: {x: 0, y: 0, z: -20},
        rotation: {x: 0, y: 0, z: 0},
        rotationSpeed: {x: 0, y: 0, z: 0},
        useScale: true,
        scale: [100, 100, 100],
        texturesPaths: ['./res/meshes/blender/swat.png'],
        name: 'swat',
        mesh: m['swat-walk-pistol'],
        physics: {
          enabled: false,
          geometry: "Cube"
        },
        objAnim: objAnim
      })

      setTimeout(() => {
        // Int 1 is max speed
        app.getSceneObjectByName('swat').objAnim.animations.walk.speed = 1;

        let cam = app.getCamera();
        cam.setPitch(-0.26);
        cam.setYaw(-0.06);
        cam.setY(15);
        cam.setZ(11);
        cam._dirtyAngle = true;

        app.getSceneObjectByName('swat').objAnim.play('walk');
      }, 200);
    }

    function onGround(m) {
      loadObjFile.addMeshObj({
        position: {x: 0, y: -1, z: -10},
        rotation: {x: 0, y: 0, z: 0},
        rotationSpeed: {x: 0, y: 0, z: 0},
        texturesPaths: ['./res/textures/cube-g1-extra_low.png'],
        name: 'ground',
        mesh: m.cube,
        physics: {
          enabled: false,
          mass: 0,
          geometry: "Cube"
        }
      })
    }
  })
  window.app = loadObjFile;
}