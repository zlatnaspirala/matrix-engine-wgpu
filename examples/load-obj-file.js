import MatrixEngineWGPU from "../src/world.js";
import {downloadMeshes} from '../src/engine/loader-obj.js';
import {addRaycastsAABBListener} from "../src/engine/raycast.js";
import {isMobile, randomIntFromTo} from "../src/engine/utils.js";
import {MEConfig} from "../src/me-config.js";
import {GenGeoTexture2} from "../src/engine/effects/gen-tex2.js";

export var loadObjFile = function() {

  let loadObjFile = new MatrixEngineWGPU({
    canvasSize: 'fullscreen',
    fastRender: 0.9,
    dontUsePhysics: true,
    MAX_SPOTLIGHTS: 1,
    mainCameraParams: {
      // type: 'WASD',
      type: 'firstPersonCamera',
      responseCoef: 1000
    },
    clearColor: {r: 0, b: 0.122, g: 0.122, a: 1}
  }, () => {

    loadObjFile.addLight();
    // if you double call downloadMeshes for same path engine use cached values no double fetch...
    downloadMeshes({ball: "./res/meshes/blender/sphere.obj", cube: "./res/meshes/blender/cube.obj", },
      onLoadObj, {scale: [1, 1, 1]})
    downloadMeshes({cube: "./res/meshes/blender/cube.obj"}, onGround, {scale: [30, 0.5, 30]})

    addRaycastsAABBListener('canvas1', 'click');

    function onGround(m) {
      loadObjFile.addMeshObj({
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
      loadObjFile.addMeshObj({
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
      let MYCUBE = loadObjFile.addMeshObj({
        material: {type: 'mirror'},
        position: {x: 0, y: 4, z: -10},
        rotation: {x: 0, y: 0, z: 0},
        rotationSpeed: {x: 0, y: 0, z: 0},
        scale: [3, 5, 1],
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
          flameEmitter: true,
          // flameEffect: true
        }
      })


      

      loadObjFile.lightContainer[0].setIntensity(15);

      // if(isMobile() == false) {
      loadObjFile.activateBloomEffect();
      loadObjFile.lightContainer[0].behavior.setOsc0(-2, 2, 0.01)
      loadObjFile.lightContainer[0].behavior.value_ = -1;
      loadObjFile.lightContainer[0].updater.push((light) => {
        light.setTargetX(light.behavior.setPath0());
        light.setPosX(light.behavior.setPath0());
      })
      loadObjFile.lightContainer[0].setPosition(0, 15, -10);
      loadObjFile.lightContainer[0].setTarget(0, 0, -10);
      // }

      setTimeout(() => {

        // MYCUBE.effects.circle = new GenGeoTexture2(loadObjFile.device, 'rgba16float', 'circle2', './res/textures/star1.png');

        app.getSceneObjectByName('sky').setAmbient(2, 0.5, 1);

        // MYCUBE.effects.flameEmitter.setIntensity(100);
        // MYCUBE.effects.flameEmitter.recreateVertexDataCrazzy(4); 
        MYCUBE.effects.flameEmitter.rotSpeed = 1;
        
        MYCUBE.effects.flameEmitter.recreateVertexDataFromData([
          -2.582509022040566, 0.21125441598805741, 0.4249951687253338,
          0.4724163587305734, 2.381811753816671, 3.074841196886901, -2.3797025623904164, -3.4608908819087145]);

        MYCUBE.setAmbient(2, 3, 0.5);
        let cam = app.getCamera();
        cam.setYaw(-0.03);
        cam.setPitch(-0.49);
        cam.setZ(0);
        cam.setY(10);
        app.buildRenderBuckets(app.mainRenderBundle);

        console.log('MYCUBE.effects.flameEmitter.recreateVertexDataFromData', MYCUBE.effects.flameEmitter.recreateVertexDataFromData)
        
        cam._dirtyAngle = true;
      }, 700);
    }

    loadObjFile.canvas.addEventListener("ray.hit.event", (e) => {
       console.log('ray.hit.event detected');
      if(e.detail.hitObject.name.startsWith('cube')) {
        e.detail.hitObject.effects.flameEmitter.recreateVertexDataCrazzy(5);
        e.detail.hitObject.effects.flameEmitter.setIntensity(randomIntFromTo(1, 200));
        e.detail.hitObject.setAmbient(randomIntFromTo(1, 7), randomIntFromTo(1, 2), randomIntFromTo(1, 5));
        app.bloomPass.setBlurRadius(randomIntFromTo(1, 5))
      }
    });

  })
  window.app = loadObjFile;
}