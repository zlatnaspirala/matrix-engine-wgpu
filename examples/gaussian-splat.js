import MatrixEngineWGPU from "../src/world.js";
import {downloadMeshes} from '../src/engine/loader-obj.js';
import {addRaycastsAABBListener} from "../src/engine/raycast.js";
import {isMobile, randomFloatFromTo, randomIntFromTo} from "../src/engine/utils.js";
import {GaussianSplatScene, SplatColorAnimator} from "../src/engine/effects/splat.js";

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

    let animator;

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

    const modes = ['rings', 'wave', 'zones', 'pulse'];
    // Function to set a random mode
    function setRandomMode() {
      const randomIndex = Math.floor(Math.random() * modes.length);
      const selectedMode = modes[randomIndex];
      animator.setMode(selectedMode);

      animator.setScale(randomFloatFromTo(0.2, 10));
      animator.setSpeed(randomFloatFromTo(0.2, 4));

      console.log(`Mode set to: ${selectedMode}`);
    }

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

      setTimeout(async () => {
        window.MYCUBE = MYCUBE;
        MYCUBE.setBlend(0.001);
        MYCUBE.effects.splat = new GaussianSplatScene(gaussianSplat.device, 'rgba16float', gaussianSplat.cameraBuffer);
        const layer = await MYCUBE.effects.splat.initialize('./res/meshes/ply/test2.ply', 12, "point-list");
        animator = new SplatColorAnimator(
          app.device,
          layer.positions,
          layer.vertexCount,
          layer.colorBuffer
        );
        animator.setMode('pulse');
        animator.setScale(0.8);
        animator.setSpeed(0.8);
        layer.colorBuffer = animator.colorBuffer;
        app.autoUpdate.push(animator);
        // just for dev
        window.animator = animator;
        MYCUBE.effects.flameEmitter.setIntensity(100);
        MYCUBE.effects.flameEmitter.recreateVertexDataCrazzy(4);
        MYCUBE.effects.flameEmitter.instanceTargets.forEach((e) => {
          e.currentScale = [110, 110, 110]
        })
        MYCUBE.effects.flameEmitter.instanceTargets.forEach((p, i, array) => {
          array[i].color = [0, 11, 0, 0.7];
        })
        let cam = app.getCamera();
        cam.setYaw(0);
        cam.setPitch(-0.15);
        cam.setZ(7);
        cam.setY(17);
        app.buildRenderBuckets();
        cam._dirtyAngle = true;

        
    setInterval(() => {
      const memoI = randomIntFromTo(90, 150);
      MYCUBE.effects.flameEmitter.setIntensity(memoI);
      const memoCONFIG = randomIntFromTo(5, 15);
      MYCUBE.effects.flameEmitter.recreateVertexDataCrazzy(memoCONFIG);
      let memoS = [randomIntFromTo(90, 150), randomIntFromTo(90, 150), randomIntFromTo(90, 150)];
      let memoC = [randomIntFromTo(0, 100), randomIntFromTo(0, 100), randomIntFromTo(0, 100)];
      MYCUBE.effects.flameEmitter.instanceTargets.forEach((e) => {
        e.currentScale = memoS;
        e.color = memoC;
      })
      setRandomMode()
      // console.log("memo color : " + memoC);
      // console.log("memo scale : " + memoS);
      // console.log("memo intes : " + memoI);
      // console.log("memo memoCONFIG : " + memoCONFIG);
    }, 2000)

      }, 1500);
    }


  })
  window.app = gaussianSplat;
}