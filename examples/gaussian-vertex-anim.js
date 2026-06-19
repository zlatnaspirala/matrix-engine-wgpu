import MatrixEngineWGPU from "../src/world.js";
import {downloadMeshes} from '../src/engine/loader-obj.js';
import {addRaycastsAABBListener} from "../src/engine/raycast.js";
import {randomIntFromTo} from "../src/engine/utils.js";
import {GaussianSplatScene, SplatColorAnimator, SplatPositionAnimator} from "../src/engine/effects/splat.js";
import {uploadGLBModel} from "../src/engine/loaders/webgpu-gltf.js";
import {MobileDOM} from "../src/engine/cameras.js";
import {KaleidoscopeEmitter} from "../src/engine/effects/kaleidoscopeEffectInstance.js";

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

    let animator, positionAnimator;

    gaussianSplat.addLight();

    downloadMeshes({
      ball: "./res/meshes/blender/sphere.obj",
      cube: "./res/meshes/blender/cube.obj",
      me: "./res/meshes/obj/nidza.obj"
    }, onLoadObj, {scale: [1, 1, 1]})
    downloadMeshes({cube: "./res/meshes/blender/cube.obj"}, onGround, {scale: [30, 0.5, 30]})

    addRaycastsAABBListener('canvas1', 'click');

    const modes = ['rings', 'wave', 'zones', 'pulse'];

    function onGround(m) {}

    async function onLoadObj(m) {
      // let topologyArgNidza = {
      //   topology: 'point-list',
      //   cullMode: 'back',
      //   frontFace: 'ccw'
      // }
      let MYCUBE = gaussianSplat.addMeshObj({
        material: {type: 'standard'},
        position: {x: 0, y: 4, z: -20},
        rotation: {x: 0, y: 180, z: 0},
        rotationSpeed: {x: 0, y: 0, z: 0},
        scale: [1, 1, 1],
        texturesPaths: ['./res/icons/512.webp'],
        name: 'me',
        // primitive: topologyArgNidza,
        mesh: m.me,
        raycast: {enabled: true, radius: 1},
        physics: {enabled: false},
        pointerEffect: {enabled: true, flameEmitter: true}
      })

      gaussianSplat.lightContainer[0].setIntensity(365);
      gaussianSplat.lightContainer[0].setRange(240)
      gaussianSplat.activateBloomEffect();
      gaussianSplat.bloomPass.setBlurRadius(0.1);
      gaussianSplat.lightContainer[0].setPosition(0, 90, -20);
      gaussianSplat.lightContainer[0].setTarget(0, 0, -20);

      // Glb
      const glbFile = await fetch("res/meshes/glb/monster.glb")
        .then(res => res.arrayBuffer())
        .then(buf => uploadGLBModel(buf, gaussianSplat.device));

      let topologyArg = {
        topology: 'point-list',
        cullMode: 'back',
        frontFace: 'ccw'
      }

      let MYGLB = gaussianSplat.addGlbObjInctance({
        material: {type: 'standard', useTextureFromGlb: true},
        useScale: true,
        scale: [16, 16, 16],
        position: {x: 0, y: 4, z: -20},
        name: 'monster',
        primitive: topologyArg,
        texturesPaths: ['./res/meshes/glb/textures/mutant_origin.webp'],
      }, null, glbFile);

      MYGLB.playAnimationByIndex(0);

      setTimeout(async () => {
        window.MYCUBE = MYCUBE;
        window.MYGLB = MYGLB;
        MYCUBE.setBlend(0.5);
        MYCUBE.position.setSpeed(0.1)
        MYCUBE.position.translateByY(40)
        let guard = false;
        MYCUBE.position.onTargetPositionReach = async () => {
          MYCUBE.position.translateByY(-10);
          MYGLB.playAnimationByIndex(2);

          if(guard === false) {
            MYCUBE.effects.splat = new GaussianSplatScene(gaussianSplat.device, 'rgba16float', gaussianSplat.cameraBuffer);
            const layer = await MYCUBE.effects.splat.initialize('./res/meshes/ply/beast.ply', 6, "point-list");
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

            positionAnimator = new SplatPositionAnimator(
              app.device,
              MYCUBE.effects.splat.splatLayers[0].positions,
              MYCUBE.effects.splat.splatLayers[0].vertexCount
            );

            MYCUBE.effects.splat.splatLayers[0].attachPositionAnimator(positionAnimator)
            app.autoUpdate.push(positionAnimator);
            positionAnimator.setMode('hold');

            setTimeout(() => {
              let adapt = MYCUBE.effects.splat.splatLayers[0].sampleMeshVertices(MYGLB.mesh.vertices, app.autoUpdate[1].vertexCount);
              const adapt1 = MYCUBE.effects.splat.splatLayers[0].remapAxes(adapt, {from: 'Z_UP', to: 'Y_UP'});
              app.autoUpdate[1].morphTo(adapt1, 1.0, 15000)
              MYCUBE.rotation.rotationSpeed.x = 1;
            }, 4000)

            let modeIndex = 0;
            MobileDOM.addButton("Mode",
              function() {
                const mode = modes[modeIndex];
                positionAnimator.setMode(mode);
                console.log('Mode:', mode);
                modeIndex = (modeIndex + 1) % modes.length;
              },
              () => {}, {left: '61'}
            );

            guard = true;
          }
        }

        // Effects:
        // positionAnimator.setMode('tornado');
        // positionAnimator.setMode('liquid');
        // positionAnimator.setMode('pulse');
        // positionAnimator.triggerDust(2.5);
        // positionAnimator.morphTo(meshBPositions, 2.0); // smooth morph to any other PLY
        // positionAnimator.resetToBase(1.5);             // back to meshA
        // positionAnimator.setUpAxis('Z');

        // app.canvas.addEventListener("ray.hit.event", (e) => {});

        MYCUBE.effects.keeffect = new KaleidoscopeEmitter(gaussianSplat.device, 'rgba16float', 40, gaussianSplat.cameraBuffer)

        // MYCUBE.effects.flameEmitter.setIntensity(21);
        // MYCUBE.effects.flameEmitter.recreateVertexDataCrazzy(20);
        // MYCUBE.effects.flameEmitter.recreateVertexDataFromData([-0.9259007514618081, 0.4179421017513555, 0.11768499353838083, 0.10608869389091338, 0.977154565205311, 0.7464570350478348, -0.7737847072761124, -1.3015114156980743])

        MYCUBE.effects.flameEmitter.instanceTargets.forEach((e) => {
          e.currentScale = [160, 160, 160]
        })
        MYCUBE.effects.flameEmitter.instanceTargets.forEach((p, i, array) => {
          array[i].color = [0, 11, 0, 0.7];
        })
        let cam = app.getCamera();
        cam.setYaw(0);
        cam.setPitch(0);
        cam.setZ(30);
        cam.setY(12);
        app.buildRenderBuckets();
        cam._dirtyAngle = true;

        // Dom
        let bloomRadius = 0.1;
        let bloomIntesity = 0.1;
        let glbAnimation = 0;
        MobileDOM.addButton("Bloom radius +", function() {
          app.bloomPass.setBlurRadius(bloomRadius);
          bloomRadius++;
        }, () => {}, {left: '5'});

        MobileDOM.addButton("Bloom radius -", function() {
          app.bloomPass.setBlurRadius(bloomRadius);
          if((bloomRadius - 1 > 0)) bloomRadius--;
        }, () => {}, {left: '13'});

        MobileDOM.addButton("Bloom intesity +", function() {
          app.bloomPass.setIntensity(bloomIntesity);
          bloomIntesity = bloomIntesity + 10;
        }, () => {}, {left: '21'});

        MobileDOM.addButton("Bloom intesity -", function() {
          app.bloomPass.setIntensity(bloomIntesity);
          if((bloomIntesity - 10 > 0)) bloomIntesity = bloomIntesity - 10;
        }, () => {}, {left: '29'});

        MobileDOM.addButton("Flame effect random", function() {
          // MYCUBE.effects.flameEmitter.recreateVertexDataCrazzy(10);
          // MYCUBE.effects.flameEmitter.setIntensity(randomIntFromTo(1, 200));
          let memoS = [randomIntFromTo(10, 150), randomIntFromTo(10, 150), randomIntFromTo(10, 150)];
          let memoC = [randomIntFromTo(0, 100), randomIntFromTo(0, 100), randomIntFromTo(0, 100)];
          MYCUBE.effects.flameEmitter.instanceTargets.forEach((e) => {
            e.currentScale = memoS;
            e.color = memoC;
          })
          MYCUBE.effects.keeffect.recreateVertexDataCrazzy(randomIntFromTo(6, 36));
          MYCUBE.effects.keeffect.setIntensity(randomIntFromTo(3, 23));
        }, () => {}, {left: '37'});

        MobileDOM.addButton("Animation", function() {
          if(glbAnimation < 4) {
            glbAnimation++;
          } else {
            glbAnimation = 0;
          }
          MYGLB.playAnimationByIndex(glbAnimation);
        }, () => {}, {left: '45'});

        const topologies = [
          'triangle-list',
          'triangle-strip',
          'line-list',
          'line-strip',
          'point-list'
        ];
        let topologyIndex = 0;
        MobileDOM.addButton("Topology",
          function() {
            topologyIndex = (topologyIndex + 1) % topologies.length;
            const topology = topologies[topologyIndex];
            MYGLB.setTopology(topology);
          },
          () => {}, {left: '53'});

        let delay = 100;
        const delayStep = 100;
        const delayMax = 1000;
        MobileDOM.addButton(
          `Delay (0-1sec)`,
          function() {
            delay += delayStep;
            if(delay > delayMax) {
              delay = 0;
            }
            MYGLB.trailAnimation.delay = delay;
            console.log('Trail delay:', delay);
          },
          () => {},
          {left: '69'}
        );

        let currentNumberOfTrails = 2;
        const minInstances = 1;
        const maxInstances = 5;
        MobileDOM.addButton(
          `Trails (1-5)`,
          function() {
            currentNumberOfTrails++;
            if(currentNumberOfTrails > maxInstances) {
              currentNumberOfTrails = minInstances;
            }
            MYGLB.updateInstances(currentNumberOfTrails);
            console.log('Trails:', currentNumberOfTrails);
          },
          () => {},
          {left: '77'}
        );

      }, 500);
    }

  })
  window.app = gaussianSplat;
}