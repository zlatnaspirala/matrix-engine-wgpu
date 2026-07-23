import MatrixEngineWGPU from "../src/world.js";
import {downloadMeshes} from '../src/engine/loader-obj.js';
import {addRaycastsAABBListener} from "../src/engine/raycast.js";
import {isMobile, randomIntFromTo} from "../src/engine/utils.js";
import {GenGeoTexture2} from "../src/engine/effects/gen-tex2.js";
import {WaterSimEffect} from "../src/engine/effects/waterSimEffect.js";

export var loadWaterEffects = function() {

  let waterEffect = new MatrixEngineWGPU({
    canvasSize: 'fullscreen',
    fastRender: 0.9,
    dontUsePhysics: true,
    MAX_SPOTLIGHTS: 1,
    MAX_BONES: 0,
    mainCameraParams: {
      type: 'WASD',// 'firstPersonCamera',
      responseCoef: 1000
    },
    clearColor: {r: 0, b: 0, g: 0, a: 1}
  }, () => {

    waterEffect.addLight();
    // if you double call downloadMeshes for same path engine use cached values no double fetch...
    downloadMeshes({ball: "./res/meshes/blender/sphere.obj", cube: "./res/meshes/blender/cube.obj", },
      onLoadObj, {scale: [1, 1, 1]})
    downloadMeshes({cube: "./res/meshes/blender/cube.obj"}, onGround, {scale: [30, 0.5, 30]})

    addRaycastsAABBListener('canvas1', 'click');

    function onGround(m) {
      waterEffect.addMeshObj({
        material: {type: 'mirror', share: true},
        position: {x: 0, y: -5, z: -10},
        rotation: {x: 0, y: 0, z: 0},
        rotationSpeed: {x: 0, y: 0, z: 0},
        texturesPaths: ['./res/textures/floor1.webp', './res/textures/env-maps/sky1_lod_mid.webp'],
        name: 'floor',
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
        mesh: m.cube,
        physics: {
          enabled: false,
          mass: 0,
          geometry: "Cube"
        }
      })
    }

    async function onLoadObj(m) {
      let MAT_WATER = waterEffect.addMeshObj({
        material: {type: 'water'},
        position: {x: -10, y: 4, z: -10},
        rotation: {x: 0, y: 0, z: 0},
        rotationSpeed: {x: 0, y: 0, z: 0},
        scale: [5, 1, 5],
        texturesPaths: ['./res/textures/floor1.webp', './res/textures/env-maps/sky1_lod_mid.webp'],
        name: 'cube',
        mesh: m.cube,
        useBlend: true,
        raycast: {enabled: true, radius: 1},
        physics: {
          enabled: false,
          mass: 0,
          geometry: "Cube"
        }
      })

      let MAT_EFFECT_WATER = waterEffect.addMeshObj({
        material: {type: 'standard'},
        position: {x: 10, y: 1, z: 0},
        rotation: {x: 0, y: 0, z: 0},
        rotationSpeed: {x: 0, y: 0, z: 0},
        scale: [5, 5, 5],
        texturesPaths: ['./res/textures/floor1.webp', './res/textures/env-maps/sky1_lod_mid.webp'],
        name: 'cube',
        useBlend: true,
        mesh: m.cube,
        raycast: {enabled: true, radius: 1},
        physics: {
          enabled: false,
          mass: 0,
          geometry: "Cube"
        },
        pointerEffect: {
          enabled: true,
        }
      })

      waterEffect.lightContainer[0].setIntensity(15);
      waterEffect.activateBloomEffect();
      waterEffect.lightContainer[0].behavior.setOsc0(-2, 2, 0.01)
      waterEffect.lightContainer[0].behavior.value_ = -1;
      waterEffect.lightContainer[0].updater.push((light) => {
        light.setTargetX(light.behavior.setPath0());
        light.setPosX(light.behavior.setPath0());
      })
      waterEffect.lightContainer[0].setPosition(0, 15, -10);
      waterEffect.lightContainer[0].setTarget(0, 0, -10);

      setTimeout(() => {

         MAT_EFFECT_WATER.setBlend(0.001);
         MAT_EFFECT_WATER.effects.waterEffect = new WaterSimEffect(waterEffect.device, 'rgba16float', undefined, app.cameraBuffer);
        // // app.getSceneObjectByName('sky').setAmbient(2, 0.5, 1);
        // MAT_WATER.effects.flameEmitter.rotSpeed = 1;

        // // Nice fire tourch effect.
        // MAT_WATER.effects.flameEmitter.recreateVertexDataFromData([
        //   -2.582509022040566, 0.21125441598805741, 0.4249951687253338,
        //   0.4724163587305734, 2.381811753816671, 3.074841196886901, -2.3797025623904164, -3.4608908819087145]);

        // MAT_WATER.setAmbient(2, 3, 0.5);
        app.MAT_WATER = MAT_WATER;

        MAT_WATER.updateWaterParams([0, 1, 10], [0, 1, 2], 8, 1, 2, 0.1, 0.5);

        let cam = app.getCamera();
        cam.setYaw(-0.03);
        cam.setPitch(-0.49);
        cam.setZ(0);
        cam.setY(10);
        app.buildRenderBuckets();

        cam._dirtyAngle = true;
      }, 700);
    }

    waterEffect.canvas.addEventListener("ray.hit.event", (e) => {
      console.log('ray.hit.event detected');
      if(e.detail.hitObject.name.startsWith('cube')) {
        e.detail.hitObject.effects.waterEffect.addDrop(0.5,0.5);
      }
    });

  })
  window.app = waterEffect;
}