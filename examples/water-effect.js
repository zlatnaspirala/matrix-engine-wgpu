import MatrixEngineWGPU from "../src/world.js";
import {downloadMeshes} from '../src/engine/loader-obj.js';
import {addRaycastsAABBListener} from "../src/engine/raycast.js";
import {isMobile, randomIntFromTo} from "../src/engine/utils.js";
import {GenGeoTexture2} from "../src/engine/effects/gen-tex2.js";
import {WaterSimEffect} from "../src/engine/effects/waterSimEffect.js";
import {mat4, vec3} from "wgpu-matrix";
import {uploadGLBModel} from "../src/engine/loaders/webgpu-gltf.js";

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
    // downloadMeshes({cube: "./res/meshes/blender/cube.obj"}, onGround, {scale: [30, 1, 30]})

    addRaycastsAABBListener('canvas1', 'click');

    function onGround(m) {
      // waterEffect.addMeshObj({
      //   material: {type: 'mirror', share: true},
      //   position: {x: 0, y: -5, z: -10},
      //   rotation: {x: 0, y: 0, z: 0},
      //   rotationSpeed: {x: 0, y: 0, z: 0},
      //   texturesPaths: ['./res/textures/floor1.webp', './res/textures/env-maps/sky1_lod_mid.webp'],
      //   name: 'floor',
      //   envMapParams: {
      //     baseColorMix: 0.1,                // CLEAR SKY
      //     mirrorTint: [0.9, 0.95, 1.0],     // Slight cool tint
      //     reflectivity: 0.75,               // 25% reflection blend
      //     illuminateColor: [0.3, 0.7, 1.0], // Soft cyan
      //     illuminateStrength: 1.5,          // Gentle rim
      //     illuminatePulse: 0.1,             // No pulse (static)
      //     fresnelPower: 5,                  // Medium-sharp edge
      //     envLodBias: 1.5,
      //     usePlanarReflection: false,       // Must be false - WIP
      //   },
      //   mesh: m.cube,
      //   physics: {
      //     enabled: false,
      //     mass: 0,
      //     geometry: "Cube"
      //   }
      // })
    }

    async function onLoadObj(m) {

      var glbFile01 = await fetch("res/meshes/glb/monster.glb").then(res => res.arrayBuffer().then(buf => uploadGLBModel(buf, waterEffect.device)));
      let MONSTER = waterEffect.addGlbObj({
        material: {type: 'power', shared: false, useTextureFromGlb: true},
        useScale: true,
        scale: [20, 20, 20],
        position: {x: 0, y: -13, z: -20},
        name: 'firstGlb',
        texturesPaths: ['./res/meshes/glb/textures/mutant_origin.webp'],
      }, null, glbFile01)[0];

      MONSTER.playAnimationByName('walk')
      // let MAT_WATER = waterEffect.addMeshObj({
      //   material: {type: 'water', shared: false},
      //   position: {x: -30, y: 2, z: -10},
      //   rotation: {x: 0, y: 0, z: 0},
      //   rotationSpeed: {x: 0, y: 0, z: 0},
      //   scale: [5, 1, 5],
      //   texturesPaths: ['./res/textures/floor1.webp', './res/textures/env-maps/sky1_lod_mid.webp'],
      //   name: 'cube',
      //   mesh: m.ball,
      //   useBlend: true,
      //   raycast: {enabled: true, radius: 1},
      //   physics: {
      //     enabled: false,
      //     mass: 0,
      //     geometry: "Cube"
      //   }
      // })

      let MAT_EFFECT_WATER = waterEffect.addMeshObj({
        material: {type: 'standard'},
        position: {x: 10, y: 0, z: 0},
        rotation: {x: 0, y: 0, z: 0},
        rotationSpeed: {x: 0, y: 0, z: 0},
        scale: [50, 1, 50],
        texturesPaths: ['./res/textures/env-maps/sky1_lod_mid.webp'],
        name: 'waterEffect',
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
      });

      app.MAT_EFFECT_WATER = MAT_EFFECT_WATER;
      app.MONSTER = MONSTER;

      waterEffect.lightContainer[0].setIntensity(2);
      waterEffect.activateBloomEffect();
      // waterEffect.lightContainer[0].behavior.setOsc0(-2, 2, 0.01)
      // waterEffect.lightContainer[0].behavior.value_ = -1;
      // waterEffect.lightContainer[0].updater.push((light) => {
      //   light.setTargetX(light.behavior.setPath0());
      //   light.setPosX(light.behavior.setPath0());
      // })
      waterEffect.lightContainer[0].setPosition(0, 25, -10);
      waterEffect.lightContainer[0].setTarget(0, 0, -10);

      app.MONSTER.position.thrust = 0.1

      let oldCenter = [0, 0, 0];

      // Inside your animation/render loop:
      function followMe(currentTime) {
        // 1. Get your object's current world position (e.g., from your model matrix)
        const newCenter = [
          MONSTER.position.x,
          MONSTER.position.y,
          MONSTER.position.z
        ];

        const radius = 10.5; // Size of the sphere interacting with the water
        // 2. Stamp the sphere into the water simulation
        this.my.stampSphere(oldCenter, newCenter, radius);

        // 4. Save current center as old center for the next frame
        oldCenter = [...newCenter];
      }


      setTimeout(() => {

        
  

        MAT_EFFECT_WATER.setBlend(0.001);
        MAT_EFFECT_WATER.effects.waterEffect = new WaterSimEffect(waterEffect.device, 'rgba16float', {
          size: 50
        }, app.cameraBuffer);


        waterEffect.autoUpdate.push({update: followMe, my: MAT_EFFECT_WATER.effects.waterEffect })


        // // app.getSceneObjectByName('sky').setAmbient(2, 0.5, 1);
        // MAT_WATER.effects.flameEmitter.rotSpeed = 1;
        // // Nice fire tourch effect.
        // MAT_WATER.effects.flameEmitter.recreateVertexDataFromData([
        //   -2.582509022040566, 0.21125441598805741, 0.4249951687253338,
        //   0.4724163587305734, 2.381811753816671, 3.074841196886901, -2.3797025623904164, -3.4608908819087145]);

        // MAT_WATER.setAmbient(2, 3, 0.5);
        // app.MAT_WATER = MAT_WATER;
        // MONSTER.updateWaterParams([0, 1, 10], [0, 1, 2], 8, 1, 2, 0.1, 0.5);
        // MAT_WATER.updateWaterParams([0, 1, 10], [0, 1, 2], 8, 1, 2, 0.1, 0.5);
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
      console.log('ray.hit.event detected', e.detail);
      const {hitObject, hitPoint} = e.detail;
      // if(hitObject.name.startsWith('cube')) return; // guessing this should probably be your water mesh's name, not 'cube' — see note below

      // const water = hitObject.effects.waterEffect;
      const water = app.MAT_EFFECT_WATER.effects.waterEffect;
      const invModel = mat4.invert(hitObject._modelMatrix); // or baseModelMatrix, whatever the mesh actually carries
      const local = vec3.transformMat4(hitPoint, invModel);
      console.log('local coords (should be roughly -1..1):', local);
      // water.addDrop(local[0], local[2], 0.03, 0.5);

      water.stampSphere(local, local)
      // water.useExternalGeometry(app.MONSTER.vertexBuffer, app.MONSTER.indexBuffer, app.MONSTER.indexCount, 'uint16')

    });

  })
  window.app = waterEffect;
}