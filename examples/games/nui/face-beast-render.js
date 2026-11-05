
import MatrixEngineWGPU from "../../../src/world.js";
import {downloadMeshes} from '../../../src/engine/loader-obj.js';
import {addRaycastsAABBListener} from "../../../src/engine/raycast.js";
import {byId, isMobile, randomIntFromTo} from "../../../src/engine/utils.js";
import {PipeCommander, PipeGestureResolver} from "../../../src/engine/buildin/nui-pipe.js";
import {MobileDOM} from "../../../src/engine/cameras.js";
// import {SplatHandEffect} from "../../../src/engine/effects/splat-mediapipe.js";
import {GaussianSplatScene, SplatColorAnimator, SplatPositionAnimator} from "../../../src/engine/effects/splat.js";
import {SplatFaceEffect} from "../../../src/engine/effects/splatFace.js";
import {loadAtlasFONT, MSDFTextEffect} from "../../../src/engine/effects/msdfText.js";
import {MatrixTTS} from "../../../src/engine/tts.js";
import {MeshMorpher} from "../../../src/engine/procedural-mesh.js";
import {LaserProjectile} from "../../../src/engine/effects/laser.js";
import {CollisionSystem} from "../../../src/engine/collision-sub-system.js";

const TEXT = `The Beast Render`;

export var loadFaceBeast = function() {

  let loadFace = new MatrixEngineWGPU({
    canvasSize: 'fullscreen',
    fastRender: 0.87,
    dontUsePhysics: true,
    // useCannon: true,
    MAX_SPOTLIGHTS: 2,
    MAX_BONES: 0,
    mainCameraParams: {
      type: 'WASD',
      // noEvents: true,
      responseCoef: 1000
    },
    clearColor: {r: 0, b: 0.122, g: 0.122, a: 1}
  }, () => {
    // MatrixTTS
    // loadFace.tts = new MatrixTTS();
    loadFace.collisionSystem = new CollisionSystem(loadFace);

    let MYCUBE, animator;
    const pipe = new PipeGestureResolver();
    const nui = new PipeCommander(true, null, null, {
      enableVisual: false,
      mode: 'face'
    });
    // Dom
    let bloomRadius = 0.1;
    let bloomIntesity = 0.1;
    let glbAnimation = 0;

    let arg1 = isMobile() && getOrientation() === 'portrait' ? {left: '84', bottom: 82} : {left: '5'};
    MobileDOM.addButton("Bloom radius +", function() {
      app.bloomPass.setBlurRadius(bloomRadius);
      bloomRadius++;
    }, () => {}, arg1);

    let arg2 = isMobile() && getOrientation() === 'portrait' ? {left: '84', bottom: 73} : {left: '13'};
    MobileDOM.addButton("Bloom radius -", function() {
      app.bloomPass.setBlurRadius(bloomRadius);
      if((bloomRadius - 1 > 0)) bloomRadius--;
    }, () => {}, arg2);

    let arg3 = isMobile() && getOrientation() === 'portrait' ? {left: '84', bottom: 64} : {left: '21'};
    MobileDOM.addButton("Bloom intesity +", function() {
      app.bloomPass.setIntensity(bloomIntesity);
      bloomIntesity = bloomIntesity + 20;
    }, () => {}, arg3);

    let arg4 = isMobile() && getOrientation() === 'portrait' ? {left: '84', bottom: 55} : {left: '29'};
    MobileDOM.addButton("Bloom intesity -", function() {
      app.bloomPass.setIntensity(bloomIntesity);
      if((bloomIntesity - 10 > 0)) bloomIntesity = bloomIntesity - 10;
    }, () => {}, arg4);

    loadFace.addLight();
    // loadFace.addLight();
    downloadMeshes({ball: "./res/meshes/blender/sphere.obj", cube: "./res/meshes/blender/cube.obj"}, onLoadObj, {scale: [1, 1, 1]})
    downloadMeshes({cube: "./res/meshes/blender/cube.obj"}, onGround, {scale: [30, 0.5, 30]})
    addRaycastsAABBListener('canvas1', 'click');

    async function onGround(m) {
      // let arg1 = isMobile() && getOrientation() === 'portrait' ? {left: '5'} : {left: '53'};
      // MobileDOM.addButton("Enable camera",
      //   function() {
      //     // nui.enableWebcam()
      //     if(byId('auto-video').style.zIndex === '-1') {
      //       byId('auto-video').style.zIndex = 1;
      //       byId('auto-video').style.opacity = 0.4;
      //     } else {
      //       byId('auto-video').style.zIndex = -1;
      //       byId('auto-video').style.opacity = 0.4;
      //     }
      //   },
      //   () => {}, arg1);

      loadFace.floor = loadFace.addMeshObj({
        material: {type: 'dark', share: true},
        position: {x: 0, y: -1, z: -10},
        rotation: {x: 0, y: 0, z: 0},
        scale: [10,1,10],
        rotationSpeed: {x: 0, y: 0, z: 0},
        texturesPaths: ['./res/textures/white-metal.png'],
        name: 'floor',
        mesh: m.cube,
        physics: {
          enabled: false,
          mass: 0,
          geometry: "Cube"
        }
      })
    }

    function createPillar(loadFace, m, x, y, z, name) {
      const base = loadFace.addMeshObj({
        material: {type: 'dark', share: true},
        position: {x: x, y: y, z: z},
        rotation: {x: 0, y: 0, z: 0},
        rotationSpeed: {x: 0, y: 0, z: 0},
        scale: [1, 10, 1],
        texturesPaths: ['./res/textures/white-metal2.webp'],
        name: 'cube' + name,
        mesh: m.cube,
        raycast: {enabled: true, radius: 1},
        physics: {enabled: false, mass: 1, geometry: "Cube"}
      });

      const top = loadFace.addMeshObj({
        material: {type: 'dark', share: true},
        position: {x: x, y: y + 6, z: z},
        rotation: {x: 0, y: 0, z: 0},
        rotationSpeed: {x: 0, y: 0, z: 0},
        scale: [1.8, 3, 1.8],
        texturesPaths: ['./res/textures/matrix1.webp'],
        name: 'cube' + name,
        mesh: m.cube,
        raycast: {enabled: true, radius: 1},
        physics: {enabled: false, mass: 1, geometry: "Cube"}
      });

      return {base, top};
    }

    async function onLoadObj(m) {

      loadFace.addProceduralMeshObj({
        material: {type: 'standard'},
        position: {x: 25, y: 25, z: -92},
        rotation: {x: 0, y: 0, z: 0},
        scale: [9, 17, 9],
        rotationSpeed: {x: 0, y: 10, z: 0},
        texturesPaths: ['./res/textures/cube-g1_low.webp'],
        meshA: MeshMorpher.cone(1, 3, false),
        meshB: MeshMorpher.cube(1),
        name: `morph_coneLeft`,
        physics: {
          enabled: false,
          geometry: "Cone",
          mass: 1,
          radius: 1,
          height: 3,
          group: 2,
          mask: -1,
        },
        raycast: {enabled: true, radius: 1}
      });

      loadFace.addProceduralMeshObj({
        material: {type: 'standard'},
        position: {x: -25, y: 25, z: -92},
        rotation: {x: 0, y: 0, z: 0},
        scale: [9, 17, 9],
        rotationSpeed: {x: 0, y: 10, z: 0},
        texturesPaths: ['./res/textures/cube-g1_low.webp'],
        meshA: MeshMorpher.cone(1, 3, false),
        meshB: MeshMorpher.cube(1),
        name: `morph_coneRight`,
        physics: {
          enabled: false,
          geometry: "Cone",
          mass: 1,
          radius: 1,
          height: 3,
          group: 2,
          mask: -1,
        },
        raycast: {enabled: true, radius: 1}
      });


      MYCUBE = loadFace.addMeshObj({
        material: {type: 'standard', share: true},
        position: {x: 0, y: 4, z: -15},
        rotation: {x: 0, y: 0, z: 0},
        rotationSpeed: {x: 0, y: 0, z: 0},
        scale: [1, 1, 1],
        texturesPaths: ['./res/textures/white-metal.png'],
        name: 'MYCUBE',
        mesh: m.cube,
        raycast: {enabled: true, radius: 1},
        physics: {
          enabled: false,
          mass: 0,
          geometry: "Cube"
        },
        pointerEffect: {enabled: true}
      });

      loadFace.SAVE_CUBE = m.cube;

      const pillar1 = createPillar(loadFace, m, -20, 6, -30, "pil1");
      const pillar2 = createPillar(loadFace, m, 20, 6, -30, "pil2");
      const pillar3 = createPillar(loadFace, m, -23, 6, -20, "pil3");
      const pillar4 = createPillar(loadFace, m, 23, 6, -20, "pil4");

      loadFace.activateBloomEffect();
      // app.activateVolumetricEffect({
      //   density: 0.05,
      //   steps: 30,
      //   scatterStrength: 0.5,
      //   heightFalloff: 0.2,
      //   lightColor: [0, 1, 5]
      // });
      loadFace.lightContainer[0].setIntensity(1000);
      app.lightContainer[0].setColorB(1)
      loadFace.lightContainer[0].setPosition(0, 65, 0);
      loadFace.lightContainer[0].setTarget(0, 0, -20);

      // loadFace.lightContainer[1].setPosition(0, 5, -10);
      // loadFace.lightContainer[1].setTarget(0, 5, 20);

      const sampler = loadFace.device.createSampler({
        magFilter: 'linear',
        minFilter: 'linear',
        mipmapFilter: 'nearest',
        addressModeU: 'clamp-to-edge',
        addressModeV: 'clamp-to-edge'
      });

      loadFace.MYCUBE = MYCUBE;

      loadAtlasFONT(loadFace.device).then((OUTPUT) => {

        const checker2 = loadFace.floor.createCheckerboardTexture(256, 128, [0, 50, 50, 255], [20, 200, 200, 255]);
        let samplerTest = loadFace.device.createSampler({
          magFilter: 'nearest',
          minFilter: 'nearest',
          addressModeU: 'repeat',
          addressModeV: 'repeat',
        });
        loadFace.floor.changeTexture(checker2, samplerTest);
        loadFace.floor.setUVScale(12, 12);

        loadFace.MYCUBE.effects.gpuText = new MSDFTextEffect(
          loadFace.device,
          'rgba16float',
          OUTPUT.msdfTexture,
          sampler,
          loadFace.cameraBuffer,
          OUTPUT.font, {scale: 0.05, localOffset: [-20, 9, 0]}
        );

        // app.MYCUBE.effects.gpuText.setLocalOffset( -15 ,1,0)

        loadFace.MYCUBE.effects.gpuText.typeText('SHOOT THE CUBES', 120, () => {
          // console.log('Typing complete!');
          MYCUBE.effects.splat = new GaussianSplatScene(loadFace.device, 'rgba16float', loadFace.cameraBuffer);
        });
      });
      // text
      setTimeout(async () => {
        MYCUBE.setBlend(0);
        const layer = await MYCUBE.effects.splat.initialize('./res/meshes/ply/beast-text.ply', 6, "point-list");
        // const layer = await MYCUBE.effects.splat.initialize('./res/meshes/ply/beast.ply', 6, "triangle-list");

        // animator = new SplatColorAnimator(
        //   loadFace.device,
        //   layer.positions,
        //   layer.vertexCount,
        //   layer.colorBuffer
        // );
        // animator.setMode('pulse');
        // animator.setScale(0.8);
        // animator.setSpeed(0.8);
        // layer.colorBuffer = animator.colorBuffer;
        // loadFace.autoUpdate.push(animator);
        // loadFace.animator = animator;
        let positionAnimator = new SplatPositionAnimator(
          loadFace.device,
          MYCUBE.effects.splat.splatLayers[0].positions,
          MYCUBE.effects.splat.splatLayers[0].vertexCount
        );

        MYCUBE.effects.splat.splatLayers[0].attachPositionAnimator(positionAnimator)
        loadFace.autoUpdate.push(positionAnimator);
        positionAnimator.setMode('hold');
        loadFace.positionAnimator = positionAnimator;

        const faceEffect = new SplatFaceEffect(
          loadFace.device,
          'rgba16float',
          loadFace.cameraBuffer,
          MYCUBE.effects.splat.splatLayers[0],
          {scale: 5, clusterRadius: 1.0, origin: [0, 0, 0], mirrorX: true}
        );

        MYCUBE.effects.faceEffect = faceEffect;
        MYCUBE.effects.faceEffect.setScale(32);

        // Laser + gameplay. Keep the hot path allocation-light.
        const laser = MYCUBE.effects.laser = new LaserProjectile(app.device, 'rgba16float', app.cameraBuffer, {maxBeams: 2, width: 0.075, intensity: 3});
        const LASER_LENGTH = 20, LASER_HIT_RADIUS = 0.28, FIRE_INTERVAL = 0.08;
        const FIRE_DIRECTION = 1, FACE_HIT_RADIUS = 3.2, CUBE_RESPAWN_Z = 90;
        let lastFire = 0, energy = 100, dead = false;
        function showGameplayStatus(message) {
          const gpuText = app.floor?.effects?.gpuText;
          if(gpuText) gpuText.typeText(message, 80);
        }
        function segmentHitsSphere(ax, ay, az, bx, by, bz, cx, cy, cz, radius) {
          const vx = bx - ax, vy = by - ay, vz = bz - az, wx = cx - ax, wy = cy - ay, wz = cz - az;
          const lenSq = vx * vx + vy * vy + vz * vz;
          let t = lenSq > 1e-8 ? (wx * vx + wy * vy + wz * vz) / lenSq : 0;
          if(t < 0) t = 0; else if(t > 1) t = 1;
          const dx = ax + vx * t - cx, dy = ay + vy * t - cy, dz = az + vz * t - cz;
          return dx * dx + dy * dy + dz * dz <= radius * radius;
        }
        function respawnCube(cube) {
          const cfg = cube._runnerCfg;
          cube.position.z = CUBE_RESPAWN_Z + Math.random() * 30;
          cube.position.x = cfg.minX + Math.random() * (cfg.maxX - cfg.minX);
          cube.position.y = cfg.minY + Math.random() * (cfg.maxY - cfg.minY);
          cube._runnerSpeed = cfg.speedMin + Math.random() * (cfg.speedMax - cfg.speedMin);
        }
        function updateLasers(nowSec) {
          if(dead) return;
          const activeRunners = runnerSet?.runners;
          const facePos = MYCUBE.position;
          if(activeRunners) {
            for(let i = 0;i < activeRunners.length;i++) {
              const cube = activeRunners[i];
              const dx = cube.position.x - facePos.x, dy = cube.position.y - facePos.y, dz = cube.position.z - facePos.z;
              const hitRadius = FACE_HIT_RADIUS + (cube._runnerScale || 1);
              if(dx * dx + dy * dy + dz * dz <= hitRadius * hitRadius) {
                energy = Math.max(0, energy - 15);
                respawnCube(cube);
                if(energy === 0) {dead = true; showGameplayStatus('YOU DIED... ENERGY: 0'); laser.cancelAll();}
                else showGameplayStatus('CUBE HIT! ENERGY: ' + energy);
                return;
              }
            }
          }
          const A = faceEffect.anchors;
          if(!A.valid || A.mouthOpen < 0.5 || nowSec - lastFire < FIRE_INTERVAL) return;
          lastFire = nowSec;
          for(let sideIndex = 0;sideIndex < 2;sideIndex++) {
            const eye = sideIndex === 0 ? A.rightEye : A.leftEye;
            // Keep the beams distinct at the eyes, then converge them toward a
            // tight shared target area. A small residual offset preserves two
            // separate collision paths instead of collapsing to one point.
            const otherEye = sideIndex === 0 ? A.leftEye : A.rightEye;
            const eyeMidX = (A.rightEye[0] + A.leftEye[0]) * 0.5;
            const eyeMidY = (A.rightEye[1] + A.leftEye[1]) * 0.5;
            const eyeMidZ = (A.rightEye[2] + A.leftEye[2]) * 0.5;
            const TARGET_SPREAD = 0.18;
            const endX = eyeMidX + A.forward[0] * LASER_LENGTH * FIRE_DIRECTION + (eye[0] - eyeMidX) * TARGET_SPREAD;
            const endY = eyeMidY + A.forward[1] * LASER_LENGTH * FIRE_DIRECTION + (eye[1] - eyeMidY) * TARGET_SPREAD;
            const endZ = eyeMidZ + A.forward[2] * LASER_LENGTH * FIRE_DIRECTION + (eye[2] - eyeMidZ) * TARGET_SPREAD;
            laser.fireBeam(eye, [endX, endY, endZ], 0.2);
            if(!activeRunners) continue;
            for(let i = 0;i < activeRunners.length;i++) {
              const cube = activeRunners[i], radius = (cube._runnerScale || 1) * 1.05 + LASER_HIT_RADIUS;
              if(segmentHitsSphere(eye[0], eye[1], eye[2], endX, endY, endZ, cube.position.x, cube.position.y, cube.position.z, radius)) {
                respawnCube(cube);
                showGameplayStatus('NICE SHOT! CUBE DESTROYED');
              }
            }
          }
        }
        app.autoUpdate.push({update: updateLasers})


        loadFace.MYCUBE.position.thrust = 0.1;
        // app.MYCUBE.position.translateByX(-10)
        app.MYCUBE.rotation.x = 25;

        // Hook mediapipe into it
        nui.onResults = (results) => {
          MYCUBE.effects.faceEffect.setFaceData(results);
        };
        // loadFace.activateHZB();

        // Important for face uv view!
        MYCUBE.effects.faceEffect.setMode('mesh');
        // MYCUBE.position.translateByY(14);


        let cam = app.getCamera();
        cam.setYaw(0);
        cam.setPitch(-0.3);
        cam.setZ(34);
        cam.setY(12);
        app.buildRenderBuckets();
        cam._dirtyAngle = true;
      }, 8000);
    }

    let isRunning = false;
    let runnerSet;

    function ambientFromColor(color) {return {r: color.r, g: color.g, b: color.b};}

    function determinateType() {
      const chooseType = randomIntFromTo(1, 3);
      let r, b, g;
      if(chooseType === 1) {r = 70; b = 0.5; g = 0.5;}
      else if(chooseType === 2) {r = 70; b = 0.5; g = 0.5;}
      else if(chooseType === 3) {r = 0.5; b = 0.5; g = 70;}
      return {r, g, b};
    }

    function damageFromColor(color, baseDamage = 15) {
      if(color.r > color.b && color.r > color.g) {return baseDamage * 1.5;}
      if(color.g > color.r && color.g > color.b) {return -baseDamage * 0.8;}
      return baseDamage * 0.5;
    }

    function slowFromColor(color) {return color.g;}

    let hitEvent = new CustomEvent('player-hit', {detail: {obstacleId: 0}});

    function spawnRunners(menuBeast, mesh, opts = {}) {
      const cfg = Object.assign({
        count: 12,
        minX: -18,
        maxX: 18,
        minY: 1,
        maxY: 2,
        startZ: 60,
        endZ: -40,
        speedMin: 0.6,
        speedMax: 1.6,
        scaleMin: 0.8,
        scaleMax: 1.8
      }, opts);

      const runners = [];

      function rand(a, b) {return a + Math.random() * (b - a);}

      for(let i = 0;i < cfg.count;i++) {
        const x = rand(cfg.minX, cfg.maxX);
        const y = rand(cfg.minY, cfg.maxY);
        const z = cfg.startZ + Math.random() * 30;
        const s = rand(cfg.scaleMin, cfg.scaleMax);
        const obj = menuBeast.addMeshObj({
          material: {type: 'standard', share: false},
          position: {x: x, y: y, z: z},
          rotation: {x: 0, y: 0, z: 0},
          rotationSpeed: {x: 15, y: 0, z: 0},
          scale: [s, s, s],
          texturesPaths: ['./res/textures/matrix1.webp'],
          name: 'runner' + i,
          mesh: mesh,
          raycast: {enabled: true, radius: 1},
          physics: {enabled: false, mass: 0, geometry: "Cube"}
        });
        obj._runnerSpeed = rand(cfg.speedMin, cfg.speedMax);
        obj._runnerScale = s;
        obj._runnerCfg = cfg;
        obj._runnerColor = determinateType();
        obj._runnerDamage = damageFromColor(obj._runnerColor);
        obj._runnerSlow = slowFromColor(obj._runnerColor);
        const amb = ambientFromColor(obj._runnerColor);
        // console.log("?>>>>>>>>>>>>>>>>>>>>>>>>>" + amb)
        obj.setAmbient(amb.r, amb.g, amb.b);
        //obj.setupMaterialPBR(obj._runnerColor.r , obj._runnerColor.g, obj._runnerColor.b)
        runners.push(obj);
        const rRadius = Math.max(s) || s;
        try {
          collisionSystem.register(obj.name, obj.position, s * 1.25, 'obstacle');
        } catch(err) {
          console.warn('collision register failed', err);
        }
      }

      // Update function called each frame via app.autoUpdate
      const updater = {
        update: function() {
          for(let i = 0;i < runners.length;i++) {
            const r = runners[i];
            // move towards negative Z (from +Z to -Z). This direction assumes player is at -Z.
            if(!r.position) continue;
            r.position.z -= r._runnerSpeed;
            if(r.rotation) r.rotation.y += 0.01 + r._runnerSpeed * 0.01;
            if(r.position.z < r._runnerCfg.endZ) {
              r.position.z = r._runnerCfg.startZ + Math.random() * 30;
              r.position.x = rand(r._runnerCfg.minX, r._runnerCfg.maxX);
              r.position.y = rand(r._runnerCfg.minY, r._runnerCfg.maxY);
              r._runnerSpeed = rand(r._runnerCfg.speedMin, r._runnerCfg.speedMax);
            }
          }
        }
      };

      app.autoUpdate.push(updater);
      return {runners, updater};
    }

    loadFace.canvas.addEventListener("ray.hit.event", (e) => {
      console.log('ray.hit.event detected');
      if(isRunning === false) {
        runnerSet = spawnRunners(loadFace, loadFace.SAVE_CUBE, {count: 8, minX: -22, maxX: 22, minY: 0.5, maxY: 3, startZ: 60, endZ: -50, speedMin: 0.55, speedMax: 1.5});
        isRunning = true;
      }
    });

  })
  window.app = loadFace;
}