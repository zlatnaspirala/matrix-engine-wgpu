
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
import {SplatPoseEffect} from "../../../src/engine/effects/splatPose.js";

const TEXT = `The Beast Render`;

export var loadPoseBeast = function() {

  let loadPose = new MatrixEngineWGPU({
    canvasSize: 'fullscreen',
    fastRender: 0.9,
    // dontUsePhysics: true,
    useCannon: true,
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
    // loadPose.tts = new MatrixTTS();
    let MYCUBE, animator;
    const pipe = new PipeGestureResolver();
    const nui = new PipeCommander(true, null, null, {
      enableVisual: false,
      mode: 'pose'
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

    loadPose.addLight();
    // loadPose.addLight();
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

      loadPose.floor = loadPose.addMeshObj({
        material: {type: 'dark', share: true},
        position: {x: 0, y: -1, z: -10},
        rotation: {x: 0, y: 0, z: 0},
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

    function createPillar(loadPose, m, x, y, z, name) {
      const base = loadPose.addMeshObj({
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

      const top = loadPose.addMeshObj({
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

      loadPose.addProceduralMeshObj({
        material: {type: 'standard'},
        position: {x: 1, y: 3, z: -7},
        rotation: {x: 0, y: 0, z: 0},
        scale: [2, 2, 2],
        rotationSpeed: {x: 0, y: 0, z: 0},
        texturesPaths: ['./res/textures/cube-g1_low.webp'],
        meshA: MeshMorpher.cone(1, 3, false),
        meshB: MeshMorpher.cube(1),
        name: `morph_cone`,
        physics: {
          enabled: true,
          geometry: "Cone",
          mass: 1,
          radius: 1,
          height: 3,
          group: 2,
          mask: -1,
        },
        raycast: {enabled: true, radius: 1}
      });

      MYCUBE = loadPose.addMeshObj({
        material: {type: 'standard', share: true},
        position: {x: 0, y: 5, z: -10},
        rotation: {x: 0, y: 0, z: 0},
        rotationSpeed: {x: 0, y: 0, z: 0},
        scale: [1, 1, 1],
        texturesPaths: ['./res/textures/white-metal.png'],
        name: 'MYCUBE',
        mesh: m.cube,
        physics: {
          enabled: false,
          mass: 0,
          geometry: "Cube"
        },
        pointerEffect: {enabled: true}
      });

      loadPose.SAVE_CUBE = m.cube;

      const pillar1 = createPillar(loadPose, m, -20, 6, -30, "pil1");
      const pillar2 = createPillar(loadPose, m, 20, 6, -30, "pil2");
      const pillar3 = createPillar(loadPose, m, -20, 6, 20, "pil3");
      const pillar4 = createPillar(loadPose, m, 20, 6, 20, "pil4");

      loadPose.activateBloomEffect();
      // app.activateVolumetricEffect({
      //   density: 0.05,
      //   steps: 30,
      //   scatterStrength: 0.5,
      //   heightFalloff: 0.2,
      //   lightColor: [0, 1, 5]
      // });
      loadPose.lightContainer[0].setIntensity(1000);
      app.lightContainer[0].setColorB(1)
      loadPose.lightContainer[0].setPosition(0, 65, 0);
      loadPose.lightContainer[0].setTarget(0, 0, -20);

      // loadPose.lightContainer[1].setPosition(0, 5, -10);
      // loadPose.lightContainer[1].setTarget(0, 5, 20);

      const sampler = loadPose.device.createSampler({
        magFilter: 'linear',
        minFilter: 'linear',
        mipmapFilter: 'nearest',
        addressModeU: 'clamp-to-edge',
        addressModeV: 'clamp-to-edge'
      });

      loadAtlasFONT(loadPose.device).then((OUTPUT) => {
        loadPose.floor.effects.gpuText = new MSDFTextEffect(
          loadPose.device,
          'rgba16float',
          OUTPUT.msdfTexture,
          sampler,
          loadPose.cameraBuffer,
          OUTPUT.font, {scale: 0.05, localOffset: [-15, 1, 0]}
        );

        // app.floor.effects.gpuText.setLocalOffset( -15 ,1,0)

        loadPose.floor.effects.gpuText.typeText(TEXT, 200, () => {
            console.log('Typing complete!');
          MYCUBE.effects.splat = new GaussianSplatScene(loadPose.device, 'rgba16float', loadPose.cameraBuffer);
           setTimeout( loadRest, 1000)
        });
      });
      // text

    }

    loadRest = async () => {
        MYCUBE.setBlend(0);
        const layer = await MYCUBE.effects.splat.initialize('./res/meshes/ply/beast-text.ply', 6, "point-list");
        // const layer = await MYCUBE.effects.splat.initialize('./res/meshes/ply/beast.ply', 6, "triangle-list");

        // animator = new SplatColorAnimator(
        //   loadPose.device,
        //   layer.positions,
        //   layer.vertexCount,
        //   layer.colorBuffer
        // );
        // animator.setMode('pulse');
        // animator.setScale(0.8);
        // animator.setSpeed(0.8);
        // layer.colorBuffer = animator.colorBuffer;
        // loadPose.autoUpdate.push(animator);
        // loadPose.animator = animator;
        let positionAnimator = new SplatPositionAnimator(
          loadPose.device,
          MYCUBE.effects.splat.splatLayers[0].positions,
          MYCUBE.effects.splat.splatLayers[0].vertexCount
        );

        MYCUBE.effects.splat.splatLayers[0].attachPositionAnimator(positionAnimator)
        loadPose.autoUpdate.push(positionAnimator);
        positionAnimator.setMode('hold');
        loadPose.positionAnimator = positionAnimator;

        const faceEffect = new SplatPoseEffect(
          loadPose.device,
          'rgba16float',
          loadPose.cameraBuffer,
          MYCUBE.effects.splat.splatLayers[0],
          {scale: 5, clusterRadius: 1.0, origin: [0, 0, 0], mirrorX: true}
        );

        MYCUBE.effects.faceEffect = faceEffect;
        MYCUBE.effects.faceEffect.setScale(32);

        // Laser
        const laser = MYCUBE.effects.laser = new LaserProjectile(app.device, 'rgba16float', app.cameraBuffer);
        const LASER_LENGTH = 12;
        const FIRE_INTERVAL = 0.08; // seconds between beam refreshes
        const FIRE_DIRECTION = 1;   // 1 = out of the face toward the viewer, -1 = into the scene
        let lastFire = 0;

        function updateLasers(nowSec) {
          const A = faceEffect.anchors;
          if(!A.valid) return;
          // open your mouth to fire
          if(A.mouthOpen < 0.5) return;
          if(nowSec - lastFire < FIRE_INTERVAL) return;
          lastFire = nowSec;

          for(const side of ['right', 'left']) {
            const eye = side === 'right' ? A.rightEye : A.leftEye;
            const end = [
              eye[0] + A.forward[0] * LASER_LENGTH * FIRE_DIRECTION,
              eye[1] + A.forward[1] * LASER_LENGTH * FIRE_DIRECTION,
              eye[2] + A.forward[2] * LASER_LENGTH * FIRE_DIRECTION,
            ];
            laser.fireBeam(eye, end, 0.2);
          }
        }

        // app.autoUpdate.push({update: updateLasers})

        // just for dev console 
        loadPose.MYCUBE = MYCUBE;

        loadPose.MYCUBE.position.thrust = 0.1;
        // app.MYCUBE.position.translateByX(-10)
        // Hook mediapipe into it
        nui.onResults = (r) => {
            // console.log(r.landmarks?.length, r.landmarks?.[0]?.[0]);
          MYCUBE.effects.faceEffect.setPoseData(r);
        };
        loadPose.activateHZB();

        // Important for face uv view!
        MYCUBE.effects.faceEffect.setMode('mesh');
        MYCUBE.position.translateByY(14);


        let cam = app.getCamera();
        cam.setYaw(0);
        cam.setPitch(0);
        cam.setZ(4);
        cam.setY(6);
        app.buildRenderBuckets();
        cam._dirtyAngle = true;
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
              // r._runnerColor = determinateType();
              // r._runnerDamage = damageFromColor(r._runnerColor);
              // r._runnerSlow = slowFromColor(r._runnerColor);
              r.position.z = r._runnerCfg.startZ + Math.random() * 30;
              r.position.x = rand(r._runnerCfg.minX, r._runnerCfg.maxX);
              r.position.y = rand(r._runnerCfg.minY, r._runnerCfg.maxY);
              r._runnerSpeed = rand(r._runnerCfg.speedMin, r._runnerCfg.speedMax);
              const s2 = rand(r._runnerCfg.scaleMin, r._runnerCfg.scaleMax);
              if(r.scale) r.scale = [s2, s2, s2];
            }
          }
        }
      };

      app.autoUpdate.push(updater);
      return {runners, updater};
    }

    loadPose.canvas.addEventListener("ray.hit.event", (e) => {
      console.log('ray.hit.event detected');
      if(isRunning === false) {
        runnerSet = spawnRunners(loadPose, loadPose.SAVE_CUBE, {count: 8, minX: -22, maxX: 22, minY: 0.5, maxY: 3, startZ: 60, endZ: -50, speedMin: 0.55, speedMax: 1.5});
        isRunning = true;
      }
    });

  })
  window.app = loadPose;
}