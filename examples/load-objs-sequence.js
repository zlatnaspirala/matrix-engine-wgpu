import MatrixEngineWGPU from "../src/world.js";
import {downloadMeshes, makeObjSeqArg} from '../src/engine/loader-obj.js';
import {loadTextureView, LOG_MATRIX} from "../src/engine/utils.js";

/**
 *
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
  }, async () => {

    loadObjFile.addLight();
    loadObjFile.lightContainer[0].setPosZ(-20);
    loadObjFile.lightContainer[0].setPosY(45);
    loadObjFile.lightContainer[0].setIntensity(15);

    downloadMeshes({cube: "./res/meshes/blender/cube.obj"}, onGround, {scale: [20, 1, 20]});

    loadObjFile.activateBloomEffect();

    loadObjFile.activateVolumetricTexProj({
      density: 0.03,
      steps: 32,
      scatterStrength: 0.2,
      heightFalloff:  10.8,
      lightColor: [3.0, 1.0, 1.0]
    });
    // loadObjFile.volumetricPass.setDensity(2);

     app.volumetricPass.setDensity(16);
    const view = await loadTextureView(loadObjFile.device, 'res/textures/shooter/hang3d.png');
    loadObjFile.volumetricPass.setProjectionTexture(view, loadObjFile.lightContainer[0].viewProjMatrix);
    loadObjFile.volumetricPass.setTextureProjectionIntensity(121.0); // 0..2
    // app.volumetricPass.disableTextureProjection();

    // physicsPlayground.activateVolumetricClouds({
    //   qualityScale: 0.35,
    //   steps: 24,
    //   coverage: 0.58,
    //   cloudBase: 2,
    //   cloudTop: 28,
    //   noiseScale: 0.035,
    //   windSpeed: 0.8,
    //   scatterStrength: 0.2,
    // })

    // app.activateVolumetricClouds2({coverage: 0.55, cloudBase: 120, cloudThickness: 60})
    // app.volumetricPass.setCloudLayer(-21, 100);

    // loadObjFile.activateVolumetricEffect({density: 1.5, steps: 30, scatterStrength: 1, heightFalloff: 1.6, lightColor: [10, 1.8, 0]})

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

      setTimeout(async () => {





        // Int 1 is max speed
        app.getSceneObjectByName('swat').objAnim.animations.walk.speed = 1;

        let cam = app.getCamera();
        cam.setPitch(-0.26);
        cam.setYaw(-0.06);
        cam.setY(15);
        cam.setZ(11);
        cam._dirtyAngle = true;

        app.getSceneObjectByName('swat').objAnim.play('walk');
      }, 300);
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