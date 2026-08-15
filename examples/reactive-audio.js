import MatrixEngineWGPU from "../src/world.js";
import {downloadMeshes} from '../src/engine/loader-obj.js';
import {addRaycastsAABBListener} from "../src/engine/raycast.js";
import {isMobile, randomIntFromTo} from "../src/engine/utils.js";
import {DepthWebcamVoxelEffect} from "../src/engine/effects/camera-depth.js";
import {AudioSplatFieldEffect} from "../src/engine/effects/reacte-audio.js";

export var loadReactiveAudio = function() {
  let reactiveAudio = new MatrixEngineWGPU({
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

    reactiveAudio.addLight();
    // if you double call downloadMeshes for same path engine use cached values no double fetch...
    downloadMeshes({ball: "./res/meshes/blender/sphere.obj", cube: "./res/meshes/blender/cube.obj", },
      onLoadObj, {scale: [1, 1, 1]})
    addRaycastsAABBListener('canvas1', 'click');

    async function onLoadObj(m) {
      // reactiveAudio.addMeshObj({
      //   material: {type: 'standard', share: true},
      //   position: {x: 0, y: -1, z: -20},
      //   rotation: {x: 0, y: 0, z: 0},
      //   scale: [100, 100, 100],
      //   rotationSpeed: {x: 0, y: 0.01, z: 0},
      //   texturesPaths: ['./res/textures/env-maps/sky1_lod_mid.webp'],
      //   name: 'sky',
      //   mesh: m.ball,
      //   physics: {
      //     enabled: false,
      //     geometry: "Sphere"
      //   }
      // });

      // material: {type: 'mirror', share: true }, share: true if not defined it is false.
      let MYCUBE = reactiveAudio.addMeshObj({
        material: {type: 'standard'},
        position: {x: 0, y: 4, z: -10},
        rotation: {x: 0, y: 0, z: 0},
        rotationSpeed: {x: 0, y: 0, z: 0},
        scale: [15, 15, 15],
        texturesPaths: ['./res/textures/floor1.webp', './res/textures/env-maps/sky1_lod_mid.webp'],
        name: 'cube',
        mesh: m.cube,
        envMapParams: {
          baseColorMix: 0.1,                // CLEAR SKY
          mirrorTint: [0.9, 0.95, 1.0],     // Slight cool tint
          reflectivity: 0.75,               // 25% reflection blend
          illuminateColor: [0.3, 0.7, 1.0], // Soft cyan
          illuminateStrength: 1.5,          // Gentle rim
          illuminatePulse: 0.1,             // No pulse (static)
          fresnelPower: 5,                  // Medium-sharp edge
          envLodBias: 1.5,
          usePlanarReflection: false,       // Must be false - WIP
        },
        raycast: {enabled: true, radius: 1},
        physics: {
          enabled: false,
          mass: 0,
          geometry: "Cube"
        },
        pointerEffect: {
          enabled: true,
          bloodBurst: true
        }
      })

      reactiveAudio.lightContainer[0].setIntensity(225);
      reactiveAudio.activateBloomEffect();
      reactiveAudio.lightContainer[0].behavior.setOsc0(-2, 2, 0.01)
      reactiveAudio.lightContainer[0].behavior.value_ = -1;
      reactiveAudio.lightContainer[0].updater.push((light) => {
        light.setTargetX(light.behavior.setPath0());
        light.setPosX(light.behavior.setPath0());
      })
      reactiveAudio.lightContainer[0].setPosition(0, 65, -10);
      reactiveAudio.lightContainer[0].setTarget(0, 0, -10);

      MYCUBE.setBlend(0.01)

      setTimeout(() => {

        let reactiveA = {
          _audio: null,
          _loading: true,
          _energyHistory: [],
          _beatCooldown: 0,
          thresholdBeat: 0.7,
        };

        app.audioManager.load('./audionautix-black-fly.mp3').then(asset => {
          asset.audio.loop = true;
          reactiveA._audio = asset;
          reactiveA._loading = false;
          MYCUBE.effects.audioE = new AudioSplatFieldEffect(app.device, {
            format: 'rgba16float',
            cameraBuffer: app.cameraBuffer,
            mode: 'waveformRibbon',
            reactiveAudio: reactiveA
          })
          console.log('....................')
        });

        MYCUBE.effects.bloodBurst.gravity = 20;
        // app.getSceneObjectByName('sky').setAmbient(2, 0.5, 1);
        // MYCUBE.effects.flameEmitter.rotSpeed = 1;
        // MYCUBE.effects.flameEmitter.recreateVertexDataFromData([
        //   -2.582509022040566, 0.21125441598805741, 0.4249951687253338,
        //   0.4724163587305734, 2.381811753816671, 3.074841196886901, -2.3797025623904164, -3.4608908819087145]);
        MYCUBE.setBlend(0.01)
        MYCUBE.setAmbient(2, 3, 2);
        app.MYCUBE = MYCUBE;
        let cam = app.getCamera();
        cam.setYaw(-0.03);
        cam.setPitch(0);
        cam.setZ(1.7);
        cam.setY(5.7);

        app.bloomPass.setIntensity(1000);
        app.bloomPass.setBlurRadius(458)

        app.buildRenderBuckets();
        cam._dirtyAngle = true;
      }, 700);
    }

    reactiveAudio.canvas.addEventListener("ray.hit.event", (e) => {
      console.log('ray.hit.event detected');
      if(e.detail.hitObject.name.startsWith('cube')) {
        // e.detail.hitObject.effects.bloodBurst.spawn([0, 0, 0], null, 60, 2.0);
        // e.detail.hitObject.effects.flameEmitter.recreateVertexDataCrazzy(5);
        // e.detail.hitObject.effects.flameEmitter.setIntensity(randomIntFromTo(1, 200));
        e.detail.hitObject.setAmbient(randomIntFromTo(1, 7), randomIntFromTo(1, 2), randomIntFromTo(1, 5));
        // app.bloomPass.setBlurRadius(randomIntFromTo(1, 5))
      }
    });

  })
  window.app = reactiveAudio;
}