import MatrixEngineWGPU from "../src/world.js";
import {downloadMeshes} from '../src/engine/loader-obj.js';
import {addRaycastsAABBListener} from "../src/engine/raycast.js";
import {CameraPath, randomIntFromTo} from "../src/engine/utils.js";
import {KaleidoscopeEffect, KaleidoscopePresets} from "../src/engine/effects/KaleidoscopeEffect.js";
import {kaleidoscopeEffectInstance} from "../src/shaders/kale/kale.wgsl.js";
import {KaleidoscopeEmitter} from "../src/engine/effects/kaleidoscopeEffectInstance.js";

export var loadKale = function() {

  let ray = new MatrixEngineWGPU({
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

    ray.addLight();
    // if you double call downloadMeshes for same path engine use cached values no double fetch...
    downloadMeshes({ball: "./res/meshes/blender/sphere.obj", cube: "./res/meshes/blender/cube.obj", },
      onLoadObj, {scale: [-1, -1, -1]})
    downloadMeshes({cube: "./res/meshes/blender/cube.obj"}, onGround, {scale: [30, 0.5, 30]})

    addRaycastsAABBListener('canvas1', 'click');

    function onGround(m) {
      ray.addMeshObj({
        material: {type: 'standard', share: true},
        position: {x: 0, y: -5, z: -10},
        rotation: {x: 0, y: 0, z: 0},
        rotationSpeed: {x: 0, y: 0, z: 0},
        texturesPaths: ['./res/textures/floor1.webp'], //, './res/textures/env-maps/sky1_lod_mid.webp'],
        name: 'floor',
        mesh: m.cube,
        physics: {
          enabled: false,
          mass: 0,
          geometry: "Cube"
        }
      })
    }

    async function onLoadObj(m) {
      ray.addMeshObj({
        material: {type: 'standard', share: true},
        position: {x: 0, y: -1, z: -20},
        rotation: {x: 0, y: 0, z: 0},
        scale: [100, 100, 100],
        rotationSpeed: {x: 0, y: 0.1, z: 0},
        texturesPaths: ['./res/textures/env-maps/sky1_lod_mid.webp'],
        name: 'sky',
        mesh: m.ball,
        physics: {
          enabled: false,
          geometry: "Sphere"
        }
      });

      // share: true if not defined it is false.
      let MYCUBE = ray.addMeshObj({
        material: {type: 'mirror'},
        position: {x: -10, y: 3, z: -10},
        rotation: {x: 0, y: 0, z: 0},
        rotationSpeed: {x: 0, y: 0, z: 0},
        scale: [3, 7, 3],
        texturesPaths: ['./res/textures/floor1.webp', './res/textures/env-maps/sky1_lod_mid.webp'],
        name: 'cube',
        mesh: m.cube,
        envMapParams: {
          baseColorMix: 0.1,                // CLEAR SKY
          mirrorTint: [0.9, 0.95, 1.0],     // Slight cool tint
          reflectivity: 0.45,               // 25% reflection blend
          illuminateColor: [0.3, 0.7, 1.0], // Soft cyan
          illuminateStrength: 1.5,          // Gentle rim
          illuminatePulse: 0.1,             // No pulse (static)
          fresnelPower: 5,                  // Medium-sharp edge
          envLodBias: 1.5,
          usePlanarReflection: false,       // ✅ Env map mode
        },
        raycast: {enabled: true, radius: 1},
        physics: {
          enabled: false,
          mass: 0,
          geometry: "Cube"
        },
        pointerEffect: {
          enabled: true,
          // flameEmitter: true
          // flameEffect: true
        }
      });

      let MYCUBE2 = ray.addMeshObj({
        material: {type: 'mirror'},
        position: {x: 10, y: 3, z: -10},
        rotation: {x: 0, y: 0, z: 0},
        rotationSpeed: {x: 0, y: 0, z: 0},
        scale: [3, 7, 3],
        texturesPaths: ['./res/textures/floor1.webp', './res/textures/env-maps/sky1_lod_mid.webp'],
        name: 'cube',
        mesh: m.cube,
        raycast: {enabled: true, radius: 1},
        physics: {
          enabled: false,
          mass: 0,
          geometry: "Cube"
        },
        envMapParams: {
          baseColorMix: 0.1,                // CLEAR SKY
          mirrorTint: [0.9, 0.95, 1.0],     // Slight cool tint
          reflectivity: 0.45,               // 25% reflection blend
          illuminateColor: [0.3, 0.7, 1.0], // Soft cyan
          illuminateStrength: 1.5,          // Gentle rim
          illuminatePulse: 0.1,             // No pulse (static)
          fresnelPower: 5,                  // Medium-sharp edge
          envLodBias: 1.5,
          usePlanarReflection: false,       // ✅ Env map mode
        },
        pointerEffect: {
          enabled: true,
          // flameEmitter: true
          // flameEffect: true
        }
      });

      let MYBALL = ray.addMeshObj({
        material: {type: 'mirror'},
        position: {x: 0, y: 5, z: -10},
        rotation: {x: 0, y: 0, z: 0},
        rotationSpeed: {x: 0, y: 1, z: 0},
        scale: [4, 4, 4],
        texturesPaths: ['./res/textures/floor1.webp', './res/textures/env-maps/sky1_lod_mid.webp'],
        name: 'ball',
        mesh: m.ball,
        raycast: {enabled: true, radius: 1},
        envMapParams: {
          baseColorMix: 0.1,                // CLEAR SKY
          mirrorTint: [0.9, 0.95, 1.0],     // Slight cool tint
          reflectivity: 0.75,               // 25% reflection blend
          illuminateColor: [0.3, 0.7, 1.0], // Soft cyan
          illuminateStrength: 1.5,          // Gentle rim
          illuminatePulse: 0.1,             // No pulse (static)
          fresnelPower: 5,                  // Medium-sharp edge
          envLodBias: 1.5,
          usePlanarReflection: false,       // ✅ Env map mode
        },
        physics: {
          enabled: false,
          mass: 0,
          geometry: "Cube"
        },
        pointerEffect: {
          enabled: true,
          // flameEmitter: true
          // flameEffect: true
        }
      });

      ray.lightContainer[0].setIntensity(5);

      // if(isMobile() == false) {
      ray.activateBloomEffect();
      ray.lightContainer[0].behavior.setOsc0(-2, 2, 0.01)
      ray.lightContainer[0].behavior.value_ = -1;
      ray.lightContainer[0].updater.push((light) => {
        light.setTargetX(light.behavior.setPath0());
        light.setPosX(light.behavior.setPath0());
      })
      ray.lightContainer[0].setPosition(0, 45, -10);
      ray.lightContainer[0].setTarget(0, 0, -10);
      // }

      setTimeout(() => {
        // MYCUBE.effects.keffect = new KaleidoscopeEffect(ray.device, 'rgba16float', 'rgba16float', KaleidoscopePresets.classic)
        // MYCUBE.effects.keeffect = new KaleidoscopeEmitter(ray.device, 'rgba16float', 10, ray.cameraBuffer)
        // MYCUBE2.effects.keeffect = new KaleidoscopeEmitter(ray.device, 'rgba16float', 10, ray.cameraBuffer)
        MYBALL.effects.keeffect = new KaleidoscopeEmitter(ray.device, 'rgba16float', 30, ray.cameraBuffer)

        // Just for console manipulation test
        app.MYBALL = MYBALL;

        // How to make object invisible (no shadow also) but leave effects alone in visible field.
        // app.MYCUBE.setBlend(0);
        // app.MYCUBE.shadowsCast = false;
        // app.buildLightShadowBuckets();
        app.getSceneObjectByName('sky').setAmbient(2, 0.5, 1);

        // MYCUBE.effects.flameEmitter.setIntensity(100);
        // MYCUBE.effects.flameEmitter.recreateVertexDataCrazzy(4); 
        // MYCUBE.effects.flameEmitter.rotSpeed = 1;
        // MYCUBE.effects.flameEmitter.recreateVertexDataFromData([
        //   -2.582509022040566, 0.21125441598805741, 0.4249951687253338,
        //   0.4724163587305734, 2.381811753816671, 3.074841196886901, -2.3797025623904164, -3.4608908819087145]);
        MYCUBE.setAmbient(2, 3, 0.5);
        let cam = app.getCamera();
        cam.setYaw(-0.03);
        cam.setPitch(-0.49);
        cam.setZ(10);
        cam.setY(20);

        const introPath = new CameraPath([
          {position: [0, 5, 20], target: [0, 0, 0]},
          {position: [10, 12, 10], target: [0, 1, 0]},
          {position: [0, 15, -22], target: [0, 0, 0]},
        ], {parameterization: 'arc'});

        if(cam.setPath) cam.setPath(introPath).play({
          speed: 0.3,
          onEnd: () => console.log('done'),
        });

        app.buildRenderBuckets();
        cam._dirtyAngle = true;
      }, 700);
    }

    ray.canvas.addEventListener("ray.hit.event", (e) => {
      console.log('ray.hit.event detected');
      if(e.detail.hitObject.name.startsWith('cube')) {
        e.detail.hitObject.setAmbient(randomIntFromTo(1, 7), randomIntFromTo(1, 2), randomIntFromTo(1, 5));
        app.bloomPass.setBlurRadius(randomIntFromTo(1, 5))
        if(app.volumetricPass.enabled == false) app.activateVolumetricEffect()
        // e.detail.hitObject.effects.keeffect.recreateVertexDataCrazzy(5);
        // e.detail.hitObject.effects.keeffect.setIntensity(randomIntFromTo(1, 200));
        e.detail.hitObject.setupMaterialPBR([randomIntFromTo(1, 10), randomIntFromTo(1, 10), randomIntFromTo(1, 10)],
          [randomIntFromTo(1, 10), randomIntFromTo(1, 10), randomIntFromTo(1, 10)])
      } else if(e.detail.hitObject.name.startsWith('ball')) {
        // e.detail.hitObject.effects.keeffect.recreateVertexDataRND(10);
        e.detail.hitObject.setupMaterialPBR([randomIntFromTo(1, 100), randomIntFromTo(1, 100), randomIntFromTo(1, 100)],
          [randomIntFromTo(1, 100), randomIntFromTo(1, 100), randomIntFromTo(1, 100)])
        e.detail.hitObject.effects.keeffect.recreateVertexDataCrazzy(randomIntFromTo(6, 36));
        e.detail.hitObject.effects.keeffect.setIntensity(randomIntFromTo(3, 23));
        e.detail.hitObject.setAmbient(randomIntFromTo(1, 7), randomIntFromTo(1, 2), randomIntFromTo(1, 5));
        app.bloomPass.setBlurRadius(randomIntFromTo(0, 45))
      }
    });

  })
  window.app = ray;
}