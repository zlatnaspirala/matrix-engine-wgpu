import {downloadMeshes} from '../../../src/engine/loader-obj.js';
import {addRaycastsAABBListener} from "../../../src/engine/raycast.js";
import {isMobile, randomIntFromTo} from "../../../src/engine/utils.js";
import MatrixEngineWGPU from '../../../src/world.js';
import {CollisionSystem} from "../../../src/engine/collision-sub-system.js";
import {MapCreator} from "../../../src/engine/buildin/map-creator/map-creator.js";
import {ProjectileSystem} from '../../../src/engine/procedures/fps-projectile.js';
import {MobileDOM} from '../../../src/engine/cameras.js';

export var loadHang3d = function() {
  let app = new MatrixEngineWGPU({
    canvasSize: 'fullscreen',
    fastRender: 0.95,
    render: 'culling',
    cullingRange: 1200,
    dontUsePhysics: true,
    MAX_SPOTLIGHTS: 1,
    MAX_BONES: 0,
    lock: 'landscape',
    LOAD_AFTER_CLICK_MOBILE: true,
    mainCameraParams: {
      type: 'firstPersonCamera',
      responseCoef: 1000
    },
    clearColor: {r: 0, b: 0, g: 0, a: 1}
  }, () => {
    app.collisionSystem = new CollisionSystem(app);
    app.addLight();
    addRaycastsAABBListener();
    app.activateHZB();
    app.activateBloomEffect();

    MobileDOM.addButton("T", () => {}, undefined, {
      image: "./res/textures/shooter/s.webp",
      left: 44.5,
      bottom: 42.8,
      color: 'black',
      size: innerHeight / 10
    })

    const cam = app.getCamera();

    if(isMobile() === true) {
      MobileDOM.addButton("JUMP", () => {
        window.app.collisionSystem._gravityAcc = 0.22;
        window.app.collisionSystem._onGround = false;
        cam._dirty = true;
        cam._dirtyAngle = true;
      }, undefined, {
        width: '50px',
        height: '50px',
        image: "./res/textures/shooter/s.webp",
        color: 'red',
        left: 80,
        bottom: 30,
        size: innerHeight / 10
      })
    }

    downloadMeshes({cube: './res/meshes/blender/cube.obj', ball: './res/meshes/blender/sphepe-mob.obj'}, (m) => {

      const mc = new MapCreator(app, m.cube, app.collisionSystem, {
        wallTexture: './res/textures/white-metal2.webp',
        floorTexture: './res/textures/floor.webp',
        ceilTexture: './res/textures/blankgray2.webp',
        shadowsCast: true
      });
      mc.createRoom({
        origin: {x: -0, y: 0.1, z: 20},
        width: 10, depth: 10, height: 4,
        doors: ['+x', '-z'],
        doorWidth: 2.5,
        roof: true,
        uvShema: [10, 10],
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
        covers: 4,
        roof: false,
        doors: ['-x', '+z'],
        tag: 'main_arena'
      });

      mc.createStairs({
        origin: {x: -6, y: 0, z: 0},
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

      mc.createMultiLevelMaze({
        origin: {x: -65, y: -3, z: -22},
        levels: 2,
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

      app.projectileSystem = new ProjectileSystem(app, m.ball, app.collisionSystem,
        {
          projectileSpeed: 0.5,
          projectileScale: 0.075,
          onHitscanHit: (hitPoint, normal, reflect, entry) => {
            console.log('ray hit', entry.id);

          },
          onProjectileHit: (hitPoint, normal, entry) => {
            console.log('rocket hit', entry.id);
          }
        }
      );

      // checkProjectiles

      app.canvas.addEventListener("ray.hit.event", (e) => {
        console.log('ray.hit.event detected', e.detail.hitObject.name);
        // app.projectileSystem.fireHitscan();
        app.projectileSystem.fireProjectile();
      });
    }, {scale: [1, 1, 1]});
  });

  window.app = app;
};