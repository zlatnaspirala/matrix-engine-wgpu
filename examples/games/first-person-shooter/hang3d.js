import {downloadMeshes} from '../../../src/engine/loader-obj.js';
import {addRaycastsAABBListener} from "../../../src/engine/raycast.js";
import {isMobile, randomIntFromTo} from "../../../src/engine/utils.js";
import MatrixEngineWGPU from '../../../src/world.js';
import {CollisionSystem} from "../../../src/engine/collision-sub-system.js";
import {MapCreator} from "../../../src/engine/buildin/map-creator/map-creator.js";
import {ProjectileSystem} from '../../../src/engine/procedures/fps-projectile.js';
import {MobileDOM} from '../../../src/engine/cameras.js';
import {hang3dUI} from './options.js';
import {Zombi} from './zombie.js';
import {uploadGLBModel} from '../../../src/engine/loaders/webgpu-gltf.js';
import {Player} from '../../../src/engine/plugin/player-object/player.js';

export var loadHang3d = function() {
  let app = new MatrixEngineWGPU({
    canvasSize: 'fullscreen',
    fastRender: 0.95,
    render: 'culling',
    cullingRange: 1200,
    dontUsePhysics: true,
    MAX_SPOTLIGHTS: 1,
    MAX_BONES: 0,
    LOAD_AFTER_CLICK_MOBILE: true,
    MOUSE_SENS: 0.005,
    TOUCH_SENS: 0.01,
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

    app.matrixSounds.createAudio('music', 'res/audios/audionautix-black-fly.mp3', 1);
    app.matrixSounds.audios.music.loop = true;

    app.UI = new hang3dUI();

    MobileDOM.addButton("T", () => {}, undefined, {
      image: "./res/textures/shooter/s.webp",
      left: isMobile() === true ? 41 : 46.5,
      bottom: isMobile() === true ? 40 : 42.5,
      color: 'black',
      size: innerHeight / 10
    })

    app.energy = MobileDOM.addProgressBar({size: innerWidth / 3, bottom: 95, left: 33, color: '#00bcd4'});
    app.energy.setValue(100);

    MobileDOM.addButton("status", () => {}, undefined, {
      id: 'player-status',
      image: "./res/textures/shooter/s.webp",
      left: isMobile() === true ? 10 : 15,
      bottom: isMobile() === true ? 90 : 85,
      color: 'black',
      size: innerHeight / 10
    })

    app.player = new Player({
      name: 'Samanta',
      typeOfController: 'fps',
      onEnergyChange: (val) => app.energy.setValue(val)
    });

    const cam = app.getCamera();
    let preventFire = false;

    if(isMobile() === true) {

      MobileDOM.addButton("FIRE", () => {
        app.projectileSystem.fireProjectile();
      }, undefined, {
        width: '30px',
        height: '30px',
        image: "./res/textures/shooter/s.webp",
        color: 'red',
        left: 60,
        bottom: 20,
        size: innerHeight / 10
      }, () => {
        if(preventFire === false) {
          preventFire = true;
          app.projectileSystem.fireProjectile();
          setTimeout(() => {preventFire = false;}, 350)
        }
      })

      MobileDOM.addButton("JUMP", () => {
        if(app.collisionSystem?._onGround) {
          app.collisionSystem._gravityAcc = 0.22;
          app.collisionSystem._onGround = false;
          this._dirty = true;
          this._dirtyAngle = true;
        }
      }, undefined, {
        width: '30px',
        height: '30px',
        image: "./res/textures/shooter/s.webp",
        color: 'red',
        left: 80,
        bottom: 20,
        size: innerHeight / 10
      })

      MobileDOM.addButton("FIRE", () => {
        app.projectileSystem.fireProjectile();
      }, undefined, {
        width: '30px',
        height: '30px',
        image: "./res/textures/shooter/s.webp",
        color: 'red',
        left: 10,
        bottom: 20,
        size: innerHeight / 10
      }, () => {
        if(preventFire === false) {
          preventFire = true;
          app.projectileSystem.fireProjectile();
          setTimeout(() => {preventFire = false;}, 210)
        }
      })
    }

    downloadMeshes({cube: './res/meshes/blender/cube.obj', ball: './res/meshes/blender/sphepe-mob.obj'}, async (m) => {

      const mc = new MapCreator(app, m.cube, app.collisionSystem, {
        wallTexture: './res/textures/shooter/metal-block.webp',
        floorTexture: './res/textures/shooter/metal-block.webp',
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
        uvShema: [10, 10],
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
        uvShema: [3, 6],
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

      // mc.createFPSMapCompound({
      //   origin:     { x: 0, y: 0, z: 100 },
      //   multiLevel: true,
      //   mazeLevels: 2,
      //   mazeSize:   19
      // });

      var glbFile01 = await fetch('./res/meshes/glb/zombie-cap.glb').then(res => res.arrayBuffer().then(buf => uploadGLBModel(buf, app.device)));

      const options = {
        core: app,
        name: 'zombi-cap',
        archetypes: ["zombie"],
        position: {x: 0, y: 0.2, z: -10},
        data: glbFile01
      }

      const options1 = {
        core: app,
        name: 'zombi-cap-red',
        archetypes: ["zombie"],
        // -8.35 ,1.1, 0.2
        position: {x: -8.35, y: 0.2, z: -10},
        data: glbFile01
      }

      app.zombies = [new Zombi(options),  new Zombi(options1)];

      app.matrixSounds.play('music');

      const light = app.lightContainer[0];
      light.setPosition(0, 60, 0);
      light.setIntensity(20);
      app.cameras.firstPersonCamera.movementSpeed = 0.1;
      app.cameras.firstPersonCamera.setPosition(0, 5, 0);
      app.collisionSystem.registerCamera(app.cameras.firstPersonCamera.position, 1.0);

      app.projectileSystem = new ProjectileSystem(app, m.ball, app.collisionSystem,
        {
          projectileSpeed: 0.5,
          projectileScale: 0.075,
          onHitscanHit: (hitPoint, normal, reflect, entry) => {
            console.log('app.getCamera().position[0] ', app.getCamera().position[0]);
            console.log('app.getCamera().position[0] ', app.getCamera().position[1]);
            let t = app.zombies.filter((z) => z.name === entry.id)[0]
            if (t) t.takeDamage();
            console.log('ray hit', t);
          },
          onProjectileHit: (hitPoint, normal, entry) => {
            console.log('rocket hit', entry.id);
          }
        }
      );

      app.canvas.addEventListener("ray.hit.event", (e) => {
        console.log('ray.hit.event detected', e.detail.hitObject.name);
        // app.projectileSystem.fireHitscan();
        app.projectileSystem.fireProjectile();
      });
    }, {scale: [1, 1, 1]});
  });

  window.app = app;
};