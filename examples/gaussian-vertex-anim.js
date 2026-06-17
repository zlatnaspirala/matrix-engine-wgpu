import MatrixEngineWGPU from "../src/world.js";
import {downloadMeshes} from '../src/engine/loader-obj.js';
import {addRaycastsAABBListener} from "../src/engine/raycast.js";
import {isMobile, randomFloatFromTo, randomIntFromTo} from "../src/engine/utils.js";
import {GaussianSplatScene, SplatColorAnimator, SplatPositionAnimator} from "../src/engine/effects/splat.js";
import {uploadGLBModel} from "../src/engine/loaders/webgpu-gltf.js";

export var loadGaussianSplatVertAnim = function() {

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
    downloadMeshes({
      ball: "./res/meshes/blender/sphere.obj",
      cube: "./res/meshes/blender/cube.obj"
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
      // console.log(`Mode set to: ${selectedMode}`);
    }

    function onGround(m) {}

    async function onLoadObj(m) {
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


      // glb test
      const glbFile = await fetch("res/meshes/glb/monster.glb")
        .then(res => res.arrayBuffer())
        .then(buf => uploadGLBModel(buf, gaussianSplat.device));

      gaussianSplat.addGlbObjInctance({
        material: {type: 'standard', useTextureFromGlb: true},
        useScale: true,
        scale: [6, 6, 6],
        position: {x: 0, y: 4, z: -20},
        name: 'monster',
        texturesPaths: ['./res/meshes/glb/textures/mutant_origin.webp'],
      }, null, glbFile);



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


        let positionAnimator = new SplatPositionAnimator(
          app.device,
          MYCUBE.effects.splat.splatLayers[0].positions,
          MYCUBE.effects.splat.splatLayers[0].vertexCount
        );

        // In your render loop:
        // positionAnimator.update(time, deltaTime);

        // Effects:
        // positionAnimator.setMode('tornado');
        // positionAnimator.setMode('liquid');
        // positionAnimator.setMode('pulse');
        // positionAnimator.triggerDust(2.5);
        // positionAnimator.morphTo(meshBPositions, 2.0); // smooth morph to any other PLY
        // positionAnimator.resetToBase(1.5);             // back to meshA

        MYCUBE.effects.splat.splatLayers[0].attachPositionAnimator(positionAnimator)
        app.autoUpdate.push(positionAnimator);

        positionAnimator.setMode('hold');

        let adapt = MYCUBE.effects.splat.splatLayers[0].sampleMeshVertices(app.mainRenderBundle[1].mesh.vertices, app.autoUpdate[1].vertexCount);
        app.autoUpdate[1].morphTo(adapt, 2.0)

        // just for dev
        window.animator = animator;

        MYCUBE.effects.flameEmitter.setIntensity(20);
        MYCUBE.effects.flameEmitter.recreateVertexDataCrazzy(3);
        MYCUBE.effects.flameEmitter.instanceTargets.forEach((e) => {
          e.currentScale = [60, 60, 60]
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


        // setInterval(() => {
        //   const memoI = randomIntFromTo(90, 120);
        //   MYCUBE.effects.flameEmitter.setIntensity(memoI);
        //   const memoCONFIG = randomIntFromTo(5, 15);
        //   MYCUBE.effects.flameEmitter.recreateVertexDataCrazzy(memoCONFIG);
        //   let memoS = [randomIntFromTo(90, 150), randomIntFromTo(90, 150), randomIntFromTo(90, 150)];
        //   let memoC = [randomIntFromTo(0, 100), randomIntFromTo(0, 100), randomIntFromTo(0, 100)];
        //   MYCUBE.effects.flameEmitter.instanceTargets.forEach((e) => {
        //     e.currentScale = memoS;
        //     e.color = memoC;
        //   })
        //   setRandomMode()
        //   // console.log("memo color : " + memoC);
        //   // console.log("memo scale : " + memoS);
        //   // console.log("memo intes : " + memoI);
        //   // console.log("memo memoCONFIG : " + memoCONFIG);
        // }, 3000)

      }, 1500);
    }


  })
  window.app = gaussianSplat;
}