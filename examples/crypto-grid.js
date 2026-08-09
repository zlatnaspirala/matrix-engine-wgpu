import MatrixEngineWGPU from "../src/world.js";
import {downloadMeshes} from '../src/engine/loader-obj.js';
import {addRaycastsAABBListener, rayIntersectsSphere2} from "../src/engine/raycast.js";
import {CameraPath, randomIntFromTo} from "../src/engine/utils.js";
import {CryptoGridEffect} from "../src/engine/effects/coingecko.js";
import {ExternalDataHandler} from "../src/engine/buildin/externalDataHandler/externalDataHandler.js";
import {CoinGeckoAdapter} from "../src/engine/buildin/externalDataHandler/adapters/coingecko/coingecko.js";
import {SeismicPortalAdapter} from "../src/engine/buildin/externalDataHandler/adapters/seismicPortal/seismicPortal.js";
import {DragRotateController} from "../src/engine/procedures/drag-rotate-object.js";
import {WaterSimEffect} from "../src/engine/effects/waterSimEffect.js";
import {mat4, vec3} from "wgpu-matrix";
import {WaterSimSphereEffect} from "../src/engine/effects/waterSimEffectSphere.js";

export var loadCryptoGrid = function() {

  let MAT_EFFECT_WATER;

  let cryptoGrid = new MatrixEngineWGPU({
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

    cryptoGrid.addLight();
    // if you double call downloadMeshes for same path engine use cached values no double fetch...
    downloadMeshes({ball: "./res/meshes/blender/earth.obj", cube: "./res/meshes/blender/cube.obj", },
      onLoadObj, {scale: [1, 1, 1]})
    addRaycastsAABBListener('canvas1', 'click');

    async function onLoadObj(m) {

      MAT_EFFECT_WATER = cryptoGrid.addMeshObj({
        material: {type: 'standard'},
        position: {x: 0, y: 20, z: -10},
        rotation: {x: 0, y: 0, z: 0},
        rotationSpeed: {x: 0, y: 0, z: 0},
        scale: [30, 30, 30],
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

      let EARTH = cryptoGrid.addMeshObj({
        material: {type: 'mirror'},
        position: {x: 0, y: 20, z: -10},
        rotation: {x: 0, y: 0, z: 180},
        rotationSpeed: {x: 0, y: 0, z: 0},
        scale: [10, 10, 10],
        texturesPaths: ['./res/meshes/blender/earth.webp', './res/textures/env-maps/sky1_lod_mid.webp'],
        name: 'earth',
        mesh: m.ball,
        envMapParams: {
          baseColorMix: 0.7,                // CLEAR SKY
          mirrorTint: [0.9, 0.95, 1.0],     // Slight cool tint
          reflectivity: 0.75,               // 25% reflection blend
          illuminateColor: [0.3, 0.7, 1.0], // Soft cyan
          illuminateStrength: 1.5,          // Gentle rim
          illuminatePulse: 0.1,             // No pulse (static)
          fresnelPower: 5,                  // Medium-sharp edge
          envLodBias: 1.5,
          usePlanarReflection: false,       // ✅ Env map mode
        },
        raycast: {enabled: true, radius: 10},
        physics: {
          enabled: false,
          mass: 0,
          geometry: "Cube"
        },
        pointerEffect: {
          enabled: true,
          flameEmitter: true
          // flameEffect: true
        }
      })

      cryptoGrid.lightContainer[0].setIntensity(5);

      const globeDrag = new DragRotateController(EARTH, cryptoGrid.canvas, cryptoGrid.getCamera(), {
        sensitivity: 0.6,
        inertia: 0.94,
        autoRotateSpeed: 0.05,
      });

      cryptoGrid.autoUpdate.push(
        globeDrag);

      // if(isMobile() == false) {
      cryptoGrid.activateBloomEffect();
      cryptoGrid.lightContainer[0].behavior.setOsc0(-2, 2, 0.01)
      cryptoGrid.lightContainer[0].behavior.value_ = -1;
      cryptoGrid.lightContainer[0].updater.push((light) => {
        light.setTargetX(light.behavior.setPath0());
        light.setPosX(light.behavior.setPath0());
      })
      cryptoGrid.lightContainer[0].setPosition(0, 15, -10);
      cryptoGrid.lightContainer[0].setTarget(0, 0, -10);
      // }

      setTimeout(() => {
        // app.getSceneObjectByName('sky').setAmbient(2, 0.5, 1);
        EARTH.effects.cryptoGrid = new CryptoGridEffect(app.device, 'rgba16float', 256, app.cameraBuffer);
        const dataHandler = new ExternalDataHandler();
        // dataHandler.registerAdapter("coingecko", new CoinGeckoAdapter(["bitcoin", "ripple"], 64));
        // dataHandler.onUpdate((name, grid) => {
        //   if(name === "coingecko") EARTH.effects.cryptoGrid.updateData(grid);
        // });
        // dataHandler.start("coingecko", 30000);
        dataHandler.registerAdapter("seismic", new SeismicPortalAdapter(64));
        dataHandler.onUpdate((name, grid) => {
          if(name === "seismic") EARTH.effects.cryptoGrid.updateData(grid);
        });
        dataHandler.start("seismic");

        // EARTH.effects.flameEmitter.setIntensity(100);
        // EARTH.effects.flameEmitter.recreateVertexDataCrazzy(4); 
        EARTH.effects.flameEmitter.rotSpeed = 1;
        EARTH.effects.flameEmitter.recreateVertexDataFromData([
          -2.582509022040566, 0.21125441598805741, 0.4249951687253338,
          0.4724163587305734, 2.381811753816671, 3.074841196886901, -2.3797025623904164, -3.4608908819087145]);

        EARTH.setAmbient(2, 3, 0.5);

        MAT_EFFECT_WATER.setBlend(0.001);
        MAT_EFFECT_WATER.effects.waterEffect = new WaterSimSphereEffect(cryptoGrid.device, 'rgba16float', {
          isSphere: true,
          geometryType: 'sphere',
          detail: 32,
          size: 50,
        }, app.cameraBuffer);
        // cryptoGrid.autoUpdate.push({update: followMe, my: MAT_EFFECT_WATER.effects.waterEffect})
        app.MAT_EFFECT_WATER = MAT_EFFECT_WATER;
        let cam = app.getCamera();
        cam.setYaw(-0.03);
        cam.setPitch(-0.49);
        cam.setZ(45);
        cam.setY(50);
        console.log('sssssssssssss')
        // const introPath = new CameraPath([
        //   {position: [0, 5, 20], target: [0, 0, 0]},
        //   {position: [10, 12, 10], target: [0, 1, 0]},
        //   {position: [0, 15, -22], target: [0, 0, 0]},
        // ], {parameterization: 'arc'});
        // cam.setPath(introPath).play({
        //   speed: 0.3,
        //   onEnd: () => console.log('done'),
        // });
        cam._dirtyAngle = true;
        app.buildRenderBuckets();
        // IMPORTANT
        app.mainRenderBundle[0].updateBoundingSphere();
      }, 500);
    }


    //  cryptoGrid.canvas.addEventListener("pointerdown", (e) => {
    //   const camera = app.cameras[app.mainCameraParams.type];
    //   const {rayOrigin, rayDirection} = getRayFromMouse(e, app.canvas, app.getCamera());

    //   const hitObject = app.MAT_EFFECT_WATER;
    //   const center = {
    //     x: hitObject.boundingSphere.center[0],
    //     y: hitObject.boundingSphere.center[1],
    //     z: hitObject.boundingSphere.center[2]
    //   };
    //   const hit = rayIntersectsSphere2(rayOrigin, rayDirection, center, hitObject.boundingSphere.radius);
    //   if(!hit) return; // true miss — no AABB fallback, no false hits, no edge artifacts

    //   const water = app.MAT_EFFECT_WATER.effects.waterEffect;
    //   const invModel = mat4.invert(hitObject._modelMatrix);
    //   const local = vec3.transformMat4(hit.hitPoint, invModel);
    //   const sphereNormal = vec3.normalize(local);

    //   const u = Math.atan2(sphereNormal[2], sphereNormal[0]) / (2 * Math.PI) + 0.5;
    //   const v = Math.asin(Math.max(-1, Math.min(1, sphereNormal[1]))) / Math.PI + 0.5;

    //   water.addDrop(u * 2 - 1, v * 2 - 1, 0.03, 0.5);
    // });

    // cryptoGrid.canvas.addEventListener("ray.hit.event", (e) => {
    //   const {hitObject, hitPoint} = e.detail;
    //   const water = app.MAT_EFFECT_WATER.effects.waterEffect;

    //   const invModel = mat4.invert(hitObject._modelMatrix);
    //   const local = vec3.transformMat4(hitPoint, invModel);
    //   const sphereNormal = vec3.normalize(local);

    //   const u = Math.atan2(sphereNormal[2], sphereNormal[0]) / (2 * Math.PI) + 0.5; // 0..1
    //   const v = Math.asin(Math.max(-1, Math.min(1, sphereNormal[1]))) / Math.PI + 0.5; // 0..1

    //   // dropFragShader does `u.center * 0.5 + 0.5` internally to get back to 0..1,
    //   // so center must be passed in -1..1 — same convention the plane path always used
    //   water.addDrop(u * 2 - 1, v * 2 - 1, 0.03, 0.5);
    // });

    cryptoGrid.canvas.addEventListener("ray.hit.event", (e) => {
      console.log('ray.hit.event detected');

      const {hitObject, hitPoint} = e.detail;
      const water = app.MAT_EFFECT_WATER.effects.waterEffect;
      const invModel = mat4.invert(hitObject._modelMatrix);
      const local = vec3.transformMat4(hitPoint, invModel);
      water.addDrop(local[0], local[2], 0.03, 0.5);


      if(e.detail.hitObject.name.startsWith('cube')) {
        e.detail.hitObject.effects.flameEmitter.recreateVertexDataCrazzy(5);
        e.detail.hitObject.effects.flameEmitter.setIntensity(randomIntFromTo(1, 200));
        e.detail.hitObject.setAmbient(randomIntFromTo(1, 7), randomIntFromTo(1, 2), randomIntFromTo(1, 5));
        app.bloomPass.setBlurRadius(randomIntFromTo(1, 5))
      }
    });

  })
  window.app = cryptoGrid;
}