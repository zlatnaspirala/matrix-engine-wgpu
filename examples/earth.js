import MatrixEngineWGPU from "../src/world.js";
import {downloadMeshes} from '../src/engine/loader-obj.js';
import {addRaycastsAABBListener, rayIntersectsSphere2} from "../src/engine/raycast.js";
import {CameraPath, OSCILLATOR, randomIntFromTo} from "../src/engine/utils.js";
import {ChartsEffect} from "../src/engine/effects/datagrams.js";
import {ExternalDataHandler} from "../src/engine/buildin/externalDataHandler/externalDataHandler.js";
import {CoinGeckoAdapter} from "../src/engine/buildin/externalDataHandler/adapters/coingecko/coingecko.js";
import {SeismicPortalAdapter} from "../src/engine/buildin/externalDataHandler/adapters/seismicPortal/seismicPortal.js";
import {DragRotateController} from "../src/engine/procedures/drag-rotate-object.js";
import {WaterSimEffect} from "../src/engine/effects/waterSimEffect.js";
import {mat4, vec3} from "wgpu-matrix";
import {WaterSimSphereEffect} from "../src/engine/effects/waterSimEffectSphere.js";
import {EarthquakeEffect} from "../src/engine/effects/seismic.js";

export var loadEarth = function() {
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
    downloadMeshes({ball: "./res/meshes/blender/earth.obj", cube: "./res/meshes/blender/cube.obj", },
      onLoadObj, {scale: [1, 1, 1]})
    addRaycastsAABBListener('canvas1', 'click');

    async function onLoadObj(m) {

      let EARTH = cryptoGrid.addMeshObj({
        material: {type: 'standard'},
        position: {x: 0, y: 20, z: -10},
        rotation: {x: 0, y: 0, z: 0},
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
        }
      })

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

      cryptoGrid.lightContainer[0].setIntensity(6);

      const globeDrag = new DragRotateController(EARTH, cryptoGrid.canvas, cryptoGrid.getCamera(), {
        sensitivity: 0.6,
        inertia: 0.94,
        autoRotateSpeed: 0.0,
      });

      cryptoGrid.autoUpdate.push(globeDrag);

      // let osc0 = new OSCILLATOR(0, 3, 0.005);
      // let osc1 = new OSCILLATOR(0, 2, 0.01);
      // let osc2 = new OSCILLATOR(0, 2, 0.009);
      // let osc3 = new OSCILLATOR(0, 2, 0.009);
      // let updater2 = {
      //   update: () => {
      //     osc0.UPDATE();
      //     osc1.UPDATE();
      //     osc2.UPDATE();
      //     osc3.UPDATE();
      //     cryptoGrid.MAT_EFFECT_WATER.effects.waterEffect.updateWaterParameters(osc0.value_, osc1.value_, osc2.value_, osc3.value_)
      //   }
      // }

      cryptoGrid.activateBloomEffect();
      cryptoGrid.lightContainer[0].setPosition(0, 15, -10);
      cryptoGrid.lightContainer[0].setTarget(0, 0, -10);

      setTimeout(() => {

        EARTH.effects.earthquake = new EarthquakeEffect(cryptoGrid.device, 'rgba16float', 'rgba16float', {
          sphereScale: 0.98,
          useParentMesh: EARTH,
        }, cryptoGrid.cameraBuffer);

        // cryptoGrid.autoUpdate.push(updater2);
        const dataHandler = new ExternalDataHandler();
        dataHandler.registerAdapter("seismic", new SeismicPortalAdapter(64));
        dataHandler.onUpdate((name, grid) => {
          if(name === "seismic") {
            console.log(grid);
            EARTH.effects.earthquake.updateData(grid);
          }
        });
        dataHandler.start("seismic");

        // EARTH.setBlend(1)
        EARTH.setAmbient(1, 1, 1);
        MAT_EFFECT_WATER.setBlend(0.001);
        MAT_EFFECT_WATER.effects.waterEffect = new WaterSimSphereEffect(cryptoGrid.device, 'rgba16float', {
          isSphere: true,
          geometryType: 'sphere',
          detail: 32,
          size: 50,
        }, app.cameraBuffer);
        app.MAT_EFFECT_WATER = MAT_EFFECT_WATER;
        app.EARTH = EARTH;
        let cam = app.getCamera();
        cam.setYaw(-0.03);
        cam.setPitch(-0.49);
        cam.setZ(45);
        cam.setY(50);

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

    cryptoGrid.canvas.addEventListener("ray.hit.event", (e) => {
      console.log('ray.hit.event detected');
      const {hitObject, hitPoint} = e.detail;
      const water = app.MAT_EFFECT_WATER.effects.waterEffect;
      // // const invModel = mat4.invert(hitObject._modelMatrix);
      // // const local = vec3.transformMat4(hitPoint, invModel);
      const invModel = mat4.inverse(hitObject._modelMatrix);
      const localHit = vec3.transformMat4(hitPoint, invModel);
      const dir = vec3.normalize(localHit);
      const u = 0.5 + Math.atan2(dir[2], dir[0]) / (2 * Math.PI);
      const v = 0.5 - Math.asin(dir[1]) / Math.PI;
      water.addDrop(u, v, 0.03, 0.01);
      // water.addDrop(local[0], local[2], 0.03, 0.5);
      if(e.detail.hitObject.name.startsWith('cube')) {
        e.detail.hitObject.setAmbient(randomIntFromTo(1, 7), randomIntFromTo(1, 2), randomIntFromTo(1, 5));
        app.bloomPass.setBlurRadius(randomIntFromTo(1, 5))
      }
    });

  })
  window.app = cryptoGrid;
}