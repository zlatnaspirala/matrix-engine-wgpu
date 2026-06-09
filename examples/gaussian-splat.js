import MatrixEngineWGPU from "../src/world.js";
import {downloadMeshes} from '../src/engine/loader-obj.js';
import {addRaycastsAABBListener} from "../src/engine/raycast.js";
import {isMobile, randomIntFromTo} from "../src/engine/utils.js";
import {GenGeoTexture2} from "../src/engine/effects/gen-tex2.js";
import {GaussianSplatScene} from "../src/engine/effects/splat.js";

export var loadGaussianSplat = function() {

  let gaussianSplat = new MatrixEngineWGPU({
    canvasSize: 'fullscreen',
    fastRender: 0.9,
    dontUsePhysics: true,
    MAX_SPOTLIGHTS: 1,
    MAX_BONES: 0,
    mainCameraParams: {
      type: 'WASD',
      responseCoef: 1000
    },
    clearColor: {r: 0, b: 0.122, g: 0.122, a: 1}
  }, () => {

    gaussianSplat.addLight();
    // if you double call downloadMeshes for same path engine use cached values no double fetch...
    downloadMeshes({
      ball: "./res/meshes/blender/sphere.obj",
      cube: "./res/meshes/blender/cube.obj",
      // car: "./res/meshes/ply/d.obj"
     },
      onLoadObj, {scale: [1, 1, 1]})
    downloadMeshes({cube: "./res/meshes/blender/cube.obj"}, onGround, {scale: [30, 0.5, 30]})

    addRaycastsAABBListener('canvas1', 'click');



    function onGround(m) {
      // gaussianSplat.addMeshObj({
      //   material: {type: 'standard', share: true},
      //   position: {x: 0, y: -5, z: -10},
      //   rotation: {x: 0, y: 0, z: 0},
      //   rotationSpeed: {x: 0, y: 0, z: 0},
      //   texturesPaths: ['./res/textures/floor1.webp'], //, './res/textures/env-maps/sky1_lod_mid.webp'],
      //   name: 'floor',
      //   mesh: m.cube,
      //   physics: {
      //     enabled: false,
      //     mass: 0,
      //     geometry: "Cube"
      //   }
      // })
    }

    async function onLoadObj(m) {
      // gaussianSplat.addMeshObj({
      //   material: {type: 'standard', share: true},
      //   position: {x: 0, y: -1, z: -20},
      //   rotation: {x: 0, y: 0, z: 0},
      //   scale: [1, 1, 1],
      //   rotationSpeed: {x: 0, y: 0, z: 0},
      //   texturesPaths: ['./res/textures/env-maps/sky1_lod_mid.webp'],
      //   name: 'sky',
      //   mesh: m.car,
      //   physics: {
      //     enabled: false,
      //     geometry: "Sphere"
      //   }
      // });

      // share: true if not defined it is false.
      let MYCUBE = gaussianSplat.addMeshObj({
        material: {type: 'standard'},
        position: {x: 0, y: 4, z: -10},
        rotation: {x: -90, y: 0, z: 180},
        rotationSpeed: {x: 0, y: 0, z: 0},
        scale: [1, 1, 1],
        texturesPaths: ['./res/textures/floor1.webp', './res/textures/env-maps/sky1_lod_mid.webp'],
        name: 'cube',
        mesh: m.cube,
        raycast: {enabled: true, radius: 1},
        physics: {enabled: false},
        pointerEffect: {enabled: true, flameEmitter: true}
      })

      gaussianSplat.lightContainer[0].setIntensity(165);
      gaussianSplat.activateBloomEffect();
      gaussianSplat.lightContainer[0].behavior.setOsc0(-2, 2, 0.01)
      gaussianSplat.lightContainer[0].behavior.value_ = -1;
      gaussianSplat.lightContainer[0].updater.push((light) => {
        light.setTargetX(light.behavior.setPath0());
        light.setPosX(light.behavior.setPath0());
      })
      gaussianSplat.lightContainer[0].setPosition(0, 45, -10);
      gaussianSplat.lightContainer[0].setTarget(0, 0, -10);

      setTimeout(() => {

        window.MYCUBE = MYCUBE;
        // constructor(device, format, cameraBuffer)
        MYCUBE.effects.splat = new GaussianSplatScene(gaussianSplat.device, 'rgba16float', gaussianSplat.cameraBuffer);
        MYCUBE.effects.splat.initialize('./res/meshes/ply/test2.ply', 12, "point-list");
        // app.getSceneObjectByName('sky').setAmbient(2, 0.5, 1);
        // MYCUBE.effects.flameEmitter.setIntensity(100);
        // MYCUBE.effects.flameEmitter.recreateVertexDataCrazzy(4); 

        let cam = app.getCamera();
        cam.setYaw(-0.03);
        cam.setPitch(-0.49);
        cam.setZ(0);
        cam.setY(10);
        app.buildRenderBuckets();
        cam._dirtyAngle = true;
      }, 700);
    }

    gaussianSplat.canvas.addEventListener("ray.hit.event", (e) => {
      console.log('ray.hit.event detected');
      if(e.detail.hitObject.name.startsWith('cube')) {
        //
      }
    });

  })
  window.app = gaussianSplat;
}