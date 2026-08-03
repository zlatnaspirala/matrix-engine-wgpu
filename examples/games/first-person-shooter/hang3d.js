import {downloadMeshes} from '../../../src/engine/loader-obj.js';
import {addRaycastsAABBListener} from "../../../src/engine/raycast.js";
import {byId, isMobile} from "../../../src/engine/utils.js";
import MatrixEngineWGPU from '../../../src/world.js';
import {CollisionSystem} from "../../../src/engine/collision-sub-system.js";
import {MapCreator} from "../../../src/engine/buildin/map-creator/map-creator.js";
import {ProjectileSystem} from '../../../src/engine/procedures/fps-projectile.js';
import {MobileDOM} from '../../../src/engine/cameras.js';
import {hang3dUI} from './options.js';
import {Zombi} from './zombie.js';
import {uploadGLBModel} from '../../../src/engine/loaders/webgpu-gltf.js';
import {Player} from '../../../src/engine/plugin/player-object/player.js';
import {MatrixTTS} from '../moba/tts.js';

/**
 * @description
 * This is First Person Shooter demo.
 * Free for commercials - no need to republish source but
 * need to have all references.
 * Keep engine attribute links (git)
 * In this example i use 
 * @www mixamo.com objects rigs.
 * and for zombi template also used objects downloaded from:
 * @www md2.sitters-electronics.nl
 * Keep this "readme.md" file with files.
 */
export var loadHang3d = function() {
  let app = new MatrixEngineWGPU({
    canvasSize: 'fullscreen',
    fastRender: 0.95,
    render: 'culling',
    cullingRange: 1200,
    dontUsePhysics: true,
    MAX_SPOTLIGHTS: 1,
    MAX_BONES: 0,
    LOAD_AFTER_CLICK_MOBILE: false,
    MOUSE_SENS: 0.005,
    TOUCH_SENS: 0.01,
    mainCameraParams: {
      type: 'firstPersonCamera',
      responseCoef: 1000
    },
    clearColor: {r: 0, b: 0, g: 0, a: 1}
  }, () => {
    // app.tts = new MatrixTTS();
    app.collisionSystem = new CollisionSystem(app);
    app.addLight();
    addRaycastsAABBListener(undefined, "mousedown");
    app.activateHZB();
    app.activateBloomEffect();
    // Audios
    // app.matrixSounds.createAudio('music', 'res/audios/audionautix-black-fly.mp3', 1);
    app.matrixSounds.createAudio('shot', 'res/audios/gun/gunshot.mp3', 3);
    app.matrixSounds.createAudio('zombie1', 'res/audios/zombie/zombie-1.mp3', 2);
    app.matrixSounds.createAudio('zombie2', 'res/audios/zombie/zombie-2.mp3', 2);
    app.matrixSounds.createAudio('zombie3', 'res/audios/zombie/zombie-9.mp3', 2);
    app.matrixSounds.createAudio('zombie4', 'res/audios/zombie/zombie-16.mp3', 2);
    app.matrixSounds.createAudio('zombiedead', 'res/audios/zombie/zombie-10.mp3', 2);
    app.matrixSounds.createAudio('feelgood', 'res/audios/feel.mp3', 1);
    // app.matrixSounds.audios.music.loop = true;

    app.UI = new hang3dUI();

    MobileDOM.addButton("T", () => {}, undefined, {
      image: "./res/textures/shooter/s.webp",
      left: isMobile() === true ? 41 : 46.5,
      bottom: isMobile() === true ? 40 : 42.5,
      color: 'black',
      size: innerHeight / 10
    })

    app.energy = MobileDOM.addProgressBar({width: innerWidth / 3, height: 30, size: innerWidth / 3, bottom: 82.5, left: 33, color: '#00bcd4'});
    app.energy.setValue(100);

    MobileDOM.addButton("Kills 0", () => {}, undefined, {
      id: 'player-status',
      image: "./res/textures/shooter/s.webp",
      left: isMobile() === true ? 2 : 15,
      bottom: isMobile() === true ? 85 : 85,
      color: 'red',
      size: innerHeight / 10
    })
    const timeNode = document.createTextNode('');
    byId('player-status').appendChild(timeNode);

    MobileDOM.addButton("Ammo 100", () => {}, undefined, {
      id: 'player-ammo',
      image: "./res/textures/shooter/s.webp",
      left: isMobile() === true ? 23.5 : 25,
      bottom: isMobile() === true ? 85 : 85,
      color: '#ffeb3b',
      size: innerHeight / 10
    })

    MobileDOM.addButton("Armor NO", () => {}, undefined, {
      id: 'player-armor',
      image: "./res/textures/shooter/s.webp",
      left: isMobile() === true ? 44.5 : 35,
      bottom: isMobile() === true ? 85 : 85,
      color: '#6cff3b',
      size: innerHeight / 10
    })

    app.player = new Player({
      name: 'Samanta',
      typeOfController: 'fps',
      onEnergyChange: (val) => app.energy.setValue(val)
    });

    const cam = app.getCamera();
    let preventFire = false;

    downloadMeshes({
      cube: './res/meshes/blender/cube.obj',
      ball: './res/meshes/blender/sphepe-mob.obj',
      armor: './res/meshes/obj/armor.obj',
      energyItem: './res/meshes/obj/energy-cube.obj',
      hang2: './res/meshes/obj/modelpack19/hang2/hang2.obj',
      ammo: './res/meshes/obj/ammo.obj'
    }, async (m) => {

      if(isMobile() === true) {
        MobileDOM.addButton("FIRE", () => {
          fire();
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
            fire();
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
          fire();
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
            fire();
            setTimeout(() => {preventFire = false;}, 210)
          }
        })
      }

      const mc = new MapCreator(app, m, app.collisionSystem, {
        wallTexture: './res/textures/shooter/metal-block.webp',
        floorTexture: './res/textures/shooter/metal-block.webp',
        ceilTexture: './res/textures/blankgray2.webp',
        shadowsCast: true,
        pillarDecoration: true,
        pillarsFlame: false
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
        stepW: 3,
        stepH: 0.4,
        stepD: 0.8,
        walls: true,
        uvShema: [3, 6],
        tag: 'stairs_up'
      });

      mc.createMultiLevelMaze({
        origin: {x: -65.3, y: -3.3, z: -22},
        levels: 2,
        mazeSize: 13,
        spacing: 2,
        wallHeight: 3,
        levelGap: 1,
        stairSteps: 8,
        roofLevels: true
      });

      app.gameMap = mc;

      var glbFile01 = await fetch('./res/meshes/glb/zombie-cap.glb').then(res => res.arrayBuffer().then(buf => uploadGLBModel(buf, app.device)));
      var glbFile02 = await fetch('./res/meshes/glb/zombi-crawl1.glb').then(res => res.arrayBuffer().then(buf => uploadGLBModel(buf, app.device)));

      const options0 = {
        core: app,
        name: 'zombi-cap0',
        archetypes: ["zombie"],
        position: {x: 0, y: 0.2, z: -10},
        data: glbFile01
      }

      const options1 = {
        core: app,
        name: 'zombi-cap1',
        archetypes: ["zombie"],
        position: {x: -4.35, y: 0.2, z: -10},
        data: glbFile01
      }

      const options2 = {
        core: app,
        name: 'zombi-cap2',
        archetypes: ["zombie"],
        position: {x: -5.35, y: 0.2, z: -10},
        data: glbFile01
      }

      const optionsC0 = {
        core: app,
        name: 'zombi-crawl0',
        archetypes: ["zombie-crawl"],
        position: {x: 4.35, y: 0.2, z: -10},
        data: glbFile02
      }

      const optionsC1 = {
        core: app,
        name: 'zombi-crawl1',
        archetypes: ["zombie-crawl"],
        position: {x: 0, y: 0.2, z: -10},
        data: glbFile02
      }

      const optionsZombiMaze0 = {
        core: app,
        name: 'zombi-c-maze0',
        archetypes: ["zombie-crawl"],
        position: {x: -44.79292678833008, y: 1.1, z: -0.29},
        data: glbFile02
      }

      const optionsZombiMaze1 = {
        core: app,
        name: 'zombi-c-maze1',
        archetypes: ["zombie-crawl"],
        position: {x: -44.14, y: 1.1, z: -21.38},
        data: glbFile02
      }

      const optionsZombiMaze2 = {
        core: app,
        name: 'zombi-c-maze2',
        archetypes: ["zombie-crawl"],
        position: {x: -44.14, y: 1.1, z: -21.38},
        data: glbFile02
      }

      app.zombies = [
        // base
        new Zombi(options0), new Zombi(options1), new Zombi(options2),
        new Zombi(optionsC0), new Zombi(optionsC1),
        // maze
        new Zombi(optionsZombiMaze0), new Zombi(optionsZombiMaze1), new Zombi(optionsZombiMaze2)
      ];

      const light = app.lightContainer[0];
      light.setPosition(0, 60, 0);
      light.setIntensity(20);
      app.cameras.firstPersonCamera.movementSpeed = 0.1;
      app.cameras.firstPersonCamera.setPosition(0, 7, 0);
      app.collisionSystem.registerCamera(app.cameras.firstPersonCamera.position, 1.08);

      app.projectileSystem = new ProjectileSystem(app, m.ball, app.collisionSystem,
        {
          projectileSpeed: 0.45,
          projectileScale: 0.07,
          onHitscanHit: (hitPoint, normal, reflect, entry) => {
            let t = app.zombies.filter((z) => z.name === entry.id)[0]
            if(t && entry.group) {
              if(t && entry.group && entry.group === 'enemy') t.takeDamage();
              if(t && entry.group && entry.group === 'zombi_head') t.takeDamage(2.5);
            }
            // console.log('ray hit', t);
          },
          onProjectileHit: (hitPoint, normal, entry) => {}
        }
      );

      if(isMobile() === false) {
        app.canvas.addEventListener("mouseup", (e) => {
          setTimeout(() => {
            if(e.button == 2) app.getCamera().setProjection((2 * Math.PI) / 5, app.getCamera().aspect, 0.3, 200);
          }, 100)
        })
      }

      app.canvas.addEventListener("ray.hit.mousedown", (e) => {
        // app.projectileSystem.fireHitscan();
        if(e.detail.button === 2) {
          app.getCamera().setProjection((0.5 * Math.PI) / 5, app.getCamera().aspect, 0.3, 200);
          return;
        }
        fire();
      });
    }, {scale: [1, 1, 1]});
    const fire = () => {
      if(app.player.ammo < 1) return;
      app.matrixSounds.play('shot');
      app.projectileSystem.fireProjectile();
      app.player.useAmmo(1)
    }
  });

  window.app = app;
};