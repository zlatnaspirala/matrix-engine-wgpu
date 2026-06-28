import {downloadMeshes} from '../../../src/engine/loader-obj.js';
import {addRaycastsAABBListener} from "../../../src/engine/raycast.js";
import {isMobile, randomIntFromTo} from "../../../src/engine/utils.js";
import {GenGeoTexture2} from "../../../src/engine/effects/gen-tex2.js";
import MatrixEngineWGPU from '../../../src/world.js';
import {CollisionSystem} from "../../../src/engine/collision-sub-system.js";
import {MapCreator} from "../../../src/engine/buildin/map-creator/map-creator.js";

/**
 * map-creator-example.js
 * Demonstrates MapCreator usage inside the beast's standard init pattern.
 */

// import MatrixEngineWGPU from '../src/world.js';
// import {downloadMeshes} from '../src/engine/loader-obj.js';
// import {addRaycastsAABBListener} from '../src/engine/raycast.js';
// import {CollisionSystem} from '../src/engine/collision-sub-system.js';
// import {MapCreator} from './map-creator.js';   // ← import the class

export var loadHang3d = function() {
  let app = new MatrixEngineWGPU({
    canvasSize: 'fullscreen',
    fastRender: 0.9,
    // render:        'culling',
    dontUsePhysics: true,
    MAX_SPOTLIGHTS: 1,
    MAX_BONES: 0,
    mainCameraParams: {
      type: 'firstPersonCamera',
      responseCoef: 1000
    },
    clearColor: {r: 0.02, b: 0.05, g: 0.02, a: 1}
  }, () => {
    app.collisionSystem = new CollisionSystem(app);
    app.addLight();
    addRaycastsAABBListener();

    app.activateHZB();

    downloadMeshes({cube: './res/meshes/blender/cube.obj'}, (m) => {

      // ── 1. Instantiate MapCreator
      const mc = new MapCreator(app, m.cube, app.collisionSystem, {
        wallTexture: './res/textures/blankgray2.webp',
        floorTexture: './res/textures/white-metal2.webp',
        ceilTexture: './res/textures/blankgray2.webp',
        shadowsCast: true
      });

      mc.createRoom({
        origin: {x: -0, y: 0, z: 20},
        width: 10, depth: 10, height: 4,
        doors: ['+x', '-z'],
        doorWidth: 2.5,
        roof: true,
        tag: 'start_room'
      });

      mc.createTunnel({
        from: {x: -35, y: 0.1, z: 0},
        to: {x: -15, y: 0, z: 0},
        width: 3.5,
        height: 3.0,
        roof: true,
        tag: 'entry_tunnel'
      });

      mc.createFightArena({
        origin: {x: 0, y: 0, z: 0},
        width: 32, depth: 32,
        wallHeight: 2.5,
        pillars: 16, pillarH: 4,
        covers: 0,
        roof: false,
        doors: ['-x', '+z'],
        tag: 'main_arena'
      });

      mc.createStairs({
        origin: {x: -5, y: 0, z: 0},
        axis: 'z',
        steps: 8,
        stepW: 2,
        stepH: 0.4,
        stepD: 0.8,
        walls: true,
        tag: 'stairs_up'
      });

      // mc.createMazeLayer({
      //   origin:    { x: -65, y: 0, z: 0 },
      //   mazeSize:  15,
      //   spacing:   2,
      //   wallHeight: 3,
      //   roof:      false,
      //   tag:       'ground_maze'
      // });

      // ── 7. Example F: multi-level maze (3 floors, stairs between) ─────
      mc.createMultiLevelMaze({
        origin: {x: -65, y: -7, z: -22},
        levels: 3,
        mazeSize: 13,
        spacing: 2,
        wallHeight: 3,
        levelGap: 1,
        stairSteps: 8,
        roofLevels: true
      });

      // ── 8. Example G: full compound preset (one call)
      // mc.createFPSMapCompound({
      //   origin:     { x: 0, y: 0, z: 100 },
      //   multiLevel: true,
      //   mazeLevels: 2,
      //   mazeSize:   19
      // });

      const light = app.lightContainer[0];
      light.setPosition(0, 50, -20);
      light.setIntensity(200);

      app.cameras.firstPersonCamera.movementSpeed = 0.12;
      app.cameras.firstPersonCamera.setPosition(0, 5, 0);
      app.collisionSystem.registerCamera(app.cameras.firstPersonCamera.position, 1.0);


      app.canvas.addEventListener("ray.hit.event", (e) => {
        console.log('ray.hit.event detected');
        if(e.detail.hitObject.name.indexOf('_pillar') !== -1) {
          e.detail.hitObject.setAmbient(randomIntFromTo(1, 7), randomIntFromTo(1, 2), randomIntFromTo(1, 5));
          // app.bloomPass.setBlurRadius(randomIntFromTo(1, 5))
        }
      });


    }, {scale: [1, 1, 1]});
  });

  window.app = app;
};


// export var loadHang3d = function() {

//   let hang3d = new MatrixEngineWGPU({
//     canvasSize: 'fullscreen',
//     fastRender: 0.9,
//     dontUsePhysics: true,
//     MAX_SPOTLIGHTS: 1,
//     MAX_BONES: 0,
//     mainCameraParams: {
//       type: 'firstPersonCamera',
//       responseCoef: 1000
//     },
//     clearColor: {r: 0, b: 0.122, g: 0.122, a: 1}
//   }, () => {

//     hang3d.addLight();
//     // if you double call downloadMeshes for same path engine use cached values no double fetch...
//     downloadMeshes({ball: "./res/meshes/blender/sphere.obj", cube: "./res/meshes/blender/cube.obj", },
//       onLoadObj, {scale: [1, 1, 1]})
//     downloadMeshes({cube: "./res/meshes/blender/cube.obj"}, onGround, {scale: [30, 0.5, 30]})

//     addRaycastsAABBListener('canvas1', 'click');

//     function onGround(m) {
//       hang3d.addMeshObj({
//         material: {type: 'standard', share: true},
//         position: {x: 0, y: -5, z: -10},
//         rotation: {x: 0, y: 0, z: 0},
//         rotationSpeed: {x: 0, y: 0, z: 0},
//         texturesPaths: ['./res/textures/floor1.webp'], //, './res/textures/env-maps/sky1_lod_mid.webp'],
//         name: 'floor',
//         mesh: m.cube,
//         physics: {
//           enabled: false,
//           mass: 0,
//           geometry: "Cube"
//         }
//       })
//     }

//     async function onLoadObj(m) {
//       hang3d.addMeshObj({
//         material: {type: 'standard', share: true},
//         position: {x: 0, y: -1, z: -20},
//         rotation: {x: 0, y: 0, z: 0},
//         scale: [100, 100, 100],
//         rotationSpeed: {x: 0, y: 0.1, z: 0},
//         texturesPaths: ['./res/textures/env-maps/sky1_lod_mid.webp'],
//         name: 'sky',
//         mesh: m.ball,
//         physics: {
//           enabled: false,
//           geometry: "Sphere"
//         }
//       });

//       // share: true if not defined it is false.
//       let MYCUBE = hang3d.addMeshObj({
//         material: {type: 'mirror'},
//         position: {x: 0, y: 4, z: -10},
//         rotation: {x: 0, y: 0, z: 0},
//         rotationSpeed: {x: 0, y: 0, z: 0},
//         scale: [3, 5, 1],
//         texturesPaths: ['./res/textures/floor1.webp', './res/textures/env-maps/sky1_lod_mid.webp'],
//         name: 'cube',
//         mesh: m.cube,
//         envMapParams: {
//           baseColorMix: 0.1,                // CLEAR SKY
//           mirrorTint: [0.9, 0.95, 1.0],     // Slight cool tint
//           reflectivity: 0.75,               // 25% reflection blend
//           illuminateColor: [0.3, 0.7, 1.0], // Soft cyan
//           illuminateStrength: 1.5,          // Gentle rim
//           illuminatePulse: 0.1,             // No pulse (static)
//           fresnelPower: 5,                  // Medium-sharp edge
//           envLodBias: 1.5,
//           usePlanarReflection: false,       // ✅ Env map mode
//         },
//         raycast: {enabled: true, radius: 1},
//         physics: {
//           enabled: false,
//           mass: 0,
//           geometry: "Cube"
//         },
//         pointerEffect: {
//           enabled: true,
//           flameEmitter: true,
//           // flameEffect: true
//         }
//       })

//       hang3d.lightContainer[0].setIntensity(15);
//       hang3d.activateBloomEffect();
//       hang3d.lightContainer[0].behavior.setOsc0(-2, 2, 0.01)
//       hang3d.lightContainer[0].behavior.value_ = -1;
//       hang3d.lightContainer[0].updater.push((light) => {
//         light.setTargetX(light.behavior.setPath0());
//         light.setPosX(light.behavior.setPath0());
//       })
//       hang3d.lightContainer[0].setPosition(0, 15, -10);
//       hang3d.lightContainer[0].setTarget(0, 0, -10);

//       setTimeout(() => {
//         MYCUBE.effects.circle = new GenGeoTexture2(hang3d.device, 'rgba16float', 'circle2', './res/textures/star1.png', 1, app.cameraBuffer);

//         app.getSceneObjectByName('sky').setAmbient(2, 0.5, 1);

//         // MYCUBE.effects.flameEmitter.setIntensity(100);
//         // MYCUBE.effects.flameEmitter.recreateVertexDataCrazzy(4);
//         MYCUBE.effects.flameEmitter.rotSpeed = 1;

//         MYCUBE.effects.flameEmitter.recreateVertexDataFromData([
//           -2.582509022040566, 0.21125441598805741, 0.4249951687253338,
//           0.4724163587305734, 2.381811753816671, 3.074841196886901, -2.3797025623904164, -3.4608908819087145]);

//         MYCUBE.setAmbient(2, 3, 0.5);
//         let cam = app.getCamera();
//         cam.setYaw(-0.03);
//         cam.setPitch(-0.49);
//         cam.setZ(0);
//         cam.setY(10);
//         app.buildRenderBuckets();

//         cam._dirtyAngle = true;
//       }, 700);
//     }



//   })
//   window.app = hang3d;
// }