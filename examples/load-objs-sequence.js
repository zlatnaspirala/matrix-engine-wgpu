import MatrixEngineWGPU from "../src/world.js";
import {downloadMeshes, makeObjSeqArg} from '../src/engine/loader-obj.js';
import {LOG_MATRIX} from "../src/engine/utils.js";

export var loadObjsSequence = function() {
  let loadObjFile = new MatrixEngineWGPU({
    canvasSize: 'fullscreen',
    dontUsePhysics: true,
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
      onLoadObj,
      {scale: [0.1, 0.1, 0.1]}
    );

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
        app.cameras.WASD.setPitch(-0.26);
        app.cameras.WASD.setYaw(-0.06);
        app.cameras.WASD.setY(15);
        app.cameras.WASD.setZ(11);
        app.cameras.WASD._dirtyAngle = true;
        app.getSceneObjectByName('swat').objAnim.play('walk')
      }, 200);
    }

    function onGround(m) {
      loadObjFile.addMeshObj({
        position: {x: 0, y: -1, z: -10},
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
  })
  window.app = loadObjFile;
}