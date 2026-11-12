import MatrixEngineWGPU from "../../../src/world.js";
import {downloadMeshes} from '../../../src/engine/loader-obj.js';
import {addRaycastsAABBListener} from "../../../src/engine/raycast.js";
import {FluidEffect} from "../../../src/engine/effects/fluid-.js";
// import {InstancedKinematicOperations} from "../../../src/engine/procedures/InstancedKinematicOperations.js";
import {KaleidoscopeEmitter} from "../../../src/engine/effects/kaleidoscopeEffectInstance.js";
import {CameraPath, isMobile, mb, randomIntFromTo, sleep, urlQuery} from "../../../src/engine/utils.js";
// import {GenGeoTexture2} from "../../../src/engine/effects/gen-tex2.js";
import {adaptSlotConfig, fetchSlotConfig} from "./networking.js";
import {SlotReel} from "./reel.js";
import {SlotGame} from "./state.js";
import {LaserProjectile} from "../../../src/engine/effects/laser.js";
import {loadAtlasFONT, MSDFTextEffect} from "../../../src/engine/effects/msdfText.js";

/**
 * This example is open source.
 * Add your domain where you have installer or runned "slot-simulator" application.
 * Add you machine ID created from "slot-simulator".
 */
const baseUrl = 'https://slot-simulator.onrender.com';
const machineId1 = new URLSearchParams(window.location.search).get("machineId");
console.log('machineId1', machineId1)
const machineId = machineId1 || '6ac80510c453c7d32ec5364a';
export const SLOT_SIMULATOR_CONFIG_TOKEN = "SHITHAPPENS";

let game;
const ENABLE_REMOTE_SPIN_EVENTS = false;
const SPACING = 6, SCALE = 3.5;
const reelX = (i, n) => ((n - 1) / 2 - i) * SPACING;

let effectType = 'default';

// Every physical symbol gets its own small fluid simulation and emitter preset.
// The effect plane is positioned in reel-local space, so the parent reel rotation
// naturally carries the complete ring around the cylinder.
const FLUID_SYMBOL_PALETTE = [
  [1.8, 0.28, 0.12],
  [0.18, 1.55, 0.62],
  [0.18, 0.62, 1.8],
  [1.45, 0.2, 1.55],
  [1.5, 1.1, 0.16],
  [0.15, 1.35, 1.55]
];

function createSymbolEmitter(fluid, index) {
  const palette = FLUID_SYMBOL_PALETTE[Math.floor(Math.random() * FLUID_SYMBOL_PALETTE.length)];
  const variant = Math.floor(Math.random() * 4);
  const common = {
    color: palette,
    colorScale: 1,
    interval: 0.055 + (index % 3) * 0.012,
    jitter: 0.18
  };

  if(variant === 0) {
    fluid.addEmitter({
      ...common,
      spiral: {
        cx: 0.5, cy: 0.5, rStart: 0.03, rEnd: 0.31,
        speed: 2.2 + (index % 4) * 0.25,
        duration: 2.2, pause: 0.15, strength: 230,
        radial: 0.22, arms: 2, reverse: index % 2 === 0
      }
    });
  } else if(variant === 1) {
    fluid.addFire({
      x: 0.32 + (index % 4) * 0.12, y: 0.08,
      height: 0.55, duration: 0.75, pause: 0.25,
      strength: 90, spread: 0.08, color: palette,
      interval: common.interval, jitter: 0.3
    });
  } else if(variant === 2) {
    fluid.addEmitter({
      ...common,
      orbit: {
        cx: 0.5, cy: 0.5, r: 0.22,
        speed: 1.2 + (index % 5) * 0.2, strength: 260
      }
    });
  } else {
    fluid.addEmitter({
      ...common,
      sweep: {
        from: [0.12, 0.18 + (index % 3) * 0.08],
        to: [0.88, 0.72 - (index % 3) * 0.06],
        duration: 0.85, pause: 0.3,
        strength: 110, spread: 0.07
      }
    });
  }
}

async function initializeSymbolReel(mesh, engine, reelCfg) {
  if(!mesh.effects) mesh.effects = {};
  const effects = [];
  const count = reelCfg.strip.length;
  const radius = 5.6;

  for(let index = 0;index < count;index++) {
    const angle = (index / count) * Math.PI * 2;
    // const angle = (index / count) * Math.PI * 2;

    // localOffset: [
    //   0,
    //   Math.cos(angle) * radius,
    //   Math.sin(angle) * radius
    // ],

    //   localRotation: [
    //     angle - Math.PI / 2, 0, 0
    //   ]

    const fluid = new FluidEffect(engine.device, {
      // Intentionally compact: a reel can contain many independent symbols.
      simRes: 32,
      dyeRes: 96,
      pressureIterations: 4,
      curl: 14,
      densityDissipation: 0.985,
      velocityDissipation: 0.18,
      splatRadius: 0.12,
      splatForce: 1700,
      localOffset: [
        0,
        Math.cos(angle) * radius,
        Math.sin(angle) * radius
      ],
      // [Math.cos(angle) * radius, Math.sin(angle) * radius, 0],
      // FluidEffect uses radians and its quad normal is +Z. Turn it outward
      // from the reel cylinder, then let the reel mesh supply parent rotation.
      localRotation: [angle - Math.PI / 2, 0, 0], // [0, Math.PI / 2, angle],
      scale: [0.78, 0.78, 1]
    });

    createSymbolEmitter(fluid, index);
    fluid.burst(0.5, 0.5, 3, 170, FLUID_SYMBOL_PALETTE[index % FLUID_SYMBOL_PALETTE.length]);

    mesh.effects[`fluidSymbol${index}`] = fluid;
    effects.push(fluid);
  }

  return effects;
}

export var loadFluidsSlot = function() {

  mb.show("Please wait 10 sec to activate render.com hosted page.")

  let slotMachine = new MatrixEngineWGPU({
    canvasSize: 'fullscreen',
    fastRender: 0.9,
    dontUsePhysics: true,
    MAX_SPOTLIGHTS: 1,
    MAX_BONES: 0,
    mainCameraParams: {
      // type: 'cinematicCamera',
      type: 'WASD',
      responseCoef: 1000
    },
    clearColor: {r: 0, b: 0.122, g: 0.122, a: 1}
  }, async () => {
    let laser, floor, cam, introPath, spinSpeed = 16, delayReel = 60;

    // Configuration
    if(urlQuery['reelSpeed']) {
      spinSpeed = parseInt(urlQuery['reelSpeed']);
      // console.log('COnfiguration for graphics : reelSpeed', spinSpeed)
    }
    if(urlQuery['delayReel']) {
      delayReel = parseInt(urlQuery['delayReel']);
      // console.log('COnfiguration for graphics : delayReel', delayReel)
    }
    if(urlQuery['effectType']) {
      // not in use for now
      // console.log('COnfiguration for graphics : effectType', effectType)
      effectType = urlQuery['effectType'];
    }

    const raw = await fetchSlotConfig(baseUrl, machineId);
    const slot = adaptSlotConfig(raw);
    slot.warnings.forEach(w => console.warn('[slot]', w));
    const n = slot.reelCount;

    slotMachine.addLight();
    downloadMeshes({ball: "./res/meshes/blender/sphere.obj", cube: "./res/meshes/blender/cube.obj", plane: "./res/meshes/blender/plane.obj"},
      onLoadObj, {scale: [1, 1, 1]})
    downloadMeshes({cube: "./res/meshes/blender/cube.obj"}, onGround, {scale: [35, 0.5, 35]})
    addRaycastsAABBListener('canvas1', 'click');

    function onGround(m) {
      floor = slotMachine.addMeshObj({
        material: {type: 'standard', share: true},
        position: {x: 0, y: 0, z: -10},
        rotation: {x: 0, y: 180, z: 0},
        rotationSpeed: {x: 0, y: 0, z: 0},
        scale: [1, 1, 1],
        texturesPaths: ['./res/textures/floor1.webp'],
        name: 'floor',
        mesh: m.cube,
        physics: {
          enabled: false,
          mass: 0,
          geometry: "Cube"
        }
      })

      loadAtlasFONT(slotMachine.device).then((OUTPUT) => {
        const checker2 = floor.createCheckerboardTexture(256, 128, [0, 50, 50, 255], [20, 200, 200, 255]);
        let samplerTest = slotMachine.device.createSampler({
          magFilter: 'nearest',
          minFilter: 'nearest',
          addressModeU: 'repeat',
          addressModeV: 'repeat',
        });
        floor.changeTexture(checker2, samplerTest);
        floor.setUVScale(12, 12);

        floor.effects.gpuText = new MSDFTextEffect(
          slotMachine.device,
          'rgba16float',
          OUTPUT.msdfTexture,
          samplerTest,
          slotMachine.cameraBuffer,
          OUTPUT.font, {scale: 0.05, localOffset: [isMobile() ? -9 : -8, 5, 17], localScale: isMobile() ? [0.6, 0.8, 0.8] : [0.5, 0.7, 0.7]}
        );

        floor.effects.gpuText.typeText(slotMachine.demoBalanceText ?? 'Demo balance: 1000', 120, () => {
          // console.log('Demo balance display ready');
          floor.position.translateByY(-4);
        });
        slotMachine.floor = floor;
      });
    }

    async function onLoadObj(m) {

      let inputArg = {
        material: {type: 'standard', share: true},
        position: {x: 0, y: -1, z: -20},
        rotation: {x: 0, y: 0, z: 0},
        scale: [30, 30, 30],
        rotationSpeed: {x: 0, y: 0.1, z: 0},
        texturesPaths: ['./res/textures/cube-g1-extra_low.png'],
        name: 'sky',
        mesh: m.ball,
        physics: {
          enabled: false,
          geometry: "Sphere"
        }
      };

      if(isMobile() === false) {
        inputArg.isVideo = {
          type: 'video',
          src: 'res/videos/space.mp4'
        };
        slotMachine.addMeshObj(inputArg);
      }

      const reelMeshes = slot.reels.map((reel, i) => slotMachine.addMeshObj({
        material: {type: 'standard'},
        position: {x: reelX(i, n), y: 15, z: -10},
        rotation: {x: 180, y: 0, z: 0}, rotationSpeed: {x: 0, y: 0, z: 0},
        scale: [SCALE, SCALE, SCALE],
        texturesPaths: ['./res/textures/floor1.webp'],
        name: 'reel' + i, mesh: m.cube,
        raycast: {enabled: false, radius: 1},
        physics: {enabled: false, mass: 0, geometry: "Cube"},
        pointerEffect: {enabled: true}
      }));

      // postprocessing
      if(isMobile()) slotMachine.lightContainer[0].setIntensity(8); else slotMachine.lightContainer[0].setIntensity(15);
      slotMachine.activateBloomEffect();
      slotMachine.activateFXAA();
      if(isMobile()) slotMachine.bloomPass.setBlurRadius(2);
      if(isMobile() === false) {
        slotMachine.activateVolumetricEffect({
          density: 0.1, steps: 30, scatterStrength: 1, heightFalloff: 0.2, lightColor: [1, 1.8, 2]
        })
      }

      // slotMachine.lightContainer[0].behavior.setOsc0(-2, 2, 0.01)
      // slotMachine.lightContainer[0].behavior.value_ = -1;
      // slotMachine.lightContainer[0].updater.push((light) => {
      //   light.setTargetX(light.behavior.setPath0());
      //   light.setPosX(light.behavior.setPath0());
      // })
      slotMachine.lightContainer[0].setPosition(0, 35, -8);
      slotMachine.lightContainer[0].setTarget(0, 0, -10);

      const FX_MESH = slotMachine.addMeshObj({
        material: {type: 'standard'},
        position: {x: 0, y: 15, z: -10}, rotation: {x: 90, y: 0, z: 180}, rotationSpeed: {x: 0, y: 0, z: 0},
        scale: [9 * Math.max(1, n / 3), 9, 9],
        texturesPaths: ['./res/icons/512.webp'], name: 'cubeeffect', mesh: m.plane,
        raycast: {enabled: true, radius: 1},
        physics: {enabled: false, mass: 0, geometry: "Cube"},
        pointerEffect: {enabled: true}
      });

      await sleep(600);

      laser = FX_MESH.effects.laser = new LaserProjectile(
        slotMachine.device, 'rgba16float', slotMachine.cameraBuffer, {
        maxBeams: 24, width: 0.045, intensity: 2.8, colorA: [0.15, 0.95, 1, 1], colorB: [0.05, 0.25, 1, 1]
      });


      slotMachine.floor.effects.gpuText.setColor(1, 11, 1);
      slotMachine.laser = laser;

      // FX_MESH is a static carrier in front of the reels. Convert world XY
      // frame coordinates into its local XZ plane (its 90-degree X rotation).
      const framePoint = (worldX, worldY) => [
        -worldX / (9 * Math.max(1, n / 3)),
        2.4,
        (worldY - 15) / 9
      ];
      const fireFrameEdge = (a, b) => laser.fireBeam(
        framePoint(a[0], a[1]), framePoint(b[0], b[1]), 0
      );

      // Four permanent laser edges around each reel.
      for(let i = 0;i < n;i++) {
        const cx = reelX(i, n), halfW = 2.55, halfH = 7.0, cy = 15;
        const corners = [
          [cx - halfW, cy - halfH],
          [cx + halfW, cy - halfH],
          [cx + halfW, cy + halfH],
          [cx - halfW, cy + halfH]
        ];
        for(let edge = 0;edge < 4;edge++) {
          fireFrameEdge(corners[edge], corners[(edge + 1) % 4]);
        }
      }

      // FX_MESH.effects.circle = new GenGeoTexture2(slotMachine.device, 'rgba16float', 'circle2', './res/textures/star1.png', 3, slotMachine.cameraBuffer);
      FX_MESH.effects.keeffect = new KaleidoscopeEmitter(slotMachine.device, 'rgba16float', 30, slotMachine.cameraBuffer);

      for(const [i, mesh] of reelMeshes.entries()) {
        await initializeSymbolReel(mesh, slotMachine, slot.reels[i]);
      }

      cam = slotMachine.getCamera();
      cam.setYaw(-3.119);
      cam.setPitch(-0.05);
      // The intro path overrides the camera's live position, so use the
      // same device-specific Z value in the path's final keyframe as well.
      const adaptedZ = isMobile() ? -53 * Math.max(1, n / 3) : -45;
      cam.setZ(adaptedZ);
      cam.setY(16);
      introPath = new CameraPath([
        {position: [0, 5, 20], target: [0, 0, 0]},
        {position: [10, 10, 10], target: [0, 1, 0]},
        {position: [0, 13, adaptedZ], target: [0, 12, 0]},
      ], {parameterization: 'arc'});
      // cam.setPath(introPath).play({
      //   speed: 0.1,
      //   onEnd: () => console.log('done'),
      // });
      cam._dirtyAngle = true;

      reelMeshes.forEach(mesh => mesh.setBlend(0.001));
      // All reel sprite batches are attached after mesh creation. Rebuild the
      // engine's effect registry now so every reel is included in rendering.
      dispatchEvent(new Event('update-effects'));
      reelMeshes[0].setupPipeline();
      slotMachine.buildRenderBuckets();

      // debug
      slotMachine.reelMeshes = reelMeshes;
      await sleep(400);

      const views = reelMeshes.map((mesh, i) => new SlotReel(mesh, slot.reels[i],
        {
          visibleRows: slot.visibleRows,
          spinSpeed: spinSpeed
        }
      ));
      for(const v of views) await v.layout(delayReel);

      // FX_MESH.effects.circle.updateInstanceCount(8);
      // new InstancedKinematicOperations(FX_MESH.effects.circle.instanceTargets).orbit();
      // FX_MESH.effects.circle.instanceTargets[0].isDyrty = true;
      reelMeshes.forEach(r => r.setAmbient(2, 0, 0));
      // Free-play defaults: 1000 demo units, 1 unit stake per local spin.
      slotMachine.demoBalanceText = 'Demo balance: 100';

      game = new SlotGame(slot, views, {
        lineBet: 5,
        demoBalance: 100,
        betAmount: 1,
        onDemoBalance: balance => {
          slotMachine.demoBalanceText = `Demo balance: ${balance}`;
          slotMachine.floor?.effects?.gpuText?.setText(slotMachine.demoBalanceText);
        },
        onPresentWin: async res => {
          // console.log("what is res:" + res)
          // chatgpt SUGGESTION START
          // Cinematic win fly-through. Keep the first and last keyframes
          // identical to the intro camera pose so the path closes cleanly.
          // chatgpt SUGGESTION START
          const adaptedZ = isMobile() ? -53 * Math.max(1, n / 3) : -45;
          const pulsingPath = new CameraPath([
            {position: [0, 13, adaptedZ], target: [0, 12, 0]},
            {position: [0, 12, -25], target: [0, 12, 0]},
            {position: [0, 11, -10], target: [0, 13, 0]},
            {position: [5, 12, -8], target: [0, 15, 0]},
            {position: [7, 14, -3], target: [0, 23, 0]},
            {position: [2, 15, -6], target: [0, 32, 0]},
            {position: [-6, 12, -7], target: [0, 12, 0]},
            {position: [-5, 10, -3], target: [0, 13, 0]},
            {position: [0, 13, -24], target: [0, 12, 0]},
            {position: [0, 13, adaptedZ], target: [0, 12, 0]},
            // Use the default 0.5 tension: this engine's spline only interpolates
            // through keyframes at 0.5, so a lower value misses the endpoints.
          ], {parameterization: 'arc'});

          const winCamera = app.getCamera();
          FX_MESH.effects.keeffect.recreateVertexDataCrazzy(randomIntFromTo(16, 26));
          FX_MESH.effects.keeffect.setIntensity(randomIntFromTo(10, 13));
          app.lightContainer[0].setColorR(4011)
          app.floor.rotation.rotationSpeed.y = 10;

          await sleep(500);

          app.floor.rotation.rotationSpeed.y = 20;
          FX_MESH.rotation.rotationSpeed.x = 10;

          await sleep(500);

          // winCamera.setPath(pulsingPath).play({
          //   speed: 0.35,
          //   onEnd: () => {
          //     // Snap both position and look target to the exact intro pose.
          //     // This also guards against future path edits leaving residual drift.
          //     winCamera.setPosition(0, 13, -45);
          //     winCamera.setTarget(0, 12, 0);
          //     winCamera._dirtyAngle = true;
          //     console.log('win camera restored to intro pose');
          //   },
          // });
          app.floor.rotation.rotationSpeed.y = 30;

          await sleep(2500);

          FX_MESH.effects.keeffect.setIntensity(1);
          FX_MESH.effects.keeffect.recreateVertexDataCrazzy(randomIntFromTo(6, 8));
          app.lightContainer[0].setColorR(1)
          app.floor.rotation.rotationSpeed.y = 0;
          app.floor.rotation.setRotation(0, 180, 0);
          FX_MESH.rotation.rotationSpeed.x = 0;
          FX_MESH.rotation.setRotation(90, 0, 180);

        }
      });
      game.on('result', r => {
        // console.log('RESULT', r.grid.map(c => c.join(' ')), 'win', r.totalWin, 'FS', r.freeSpinsLeft)
        // Flash a bright laser across each winning row, briefly highlighting
        // the exact reel positions reported by the game evaluation.
        if(r.totalWin > 0) {
          const flashed = new Set();
          for(const win of(r.lineWins ?? [])) {
            for(const cell of(win.cells ?? [])) {
              const key = `${cell.reel}:${cell.row}`;
              if(flashed.has(key)) continue;
              flashed.add(key);
              const cx = reelX(cell.reel, n);
              const cy = 15 + (1 - cell.row) * 3.2;
              laser.fireBeam(
                framePoint(cx - 2.35, cy),
                framePoint(cx + 2.35, cy),
                0.9,
                {
                  colorA: [1, 0.95, 0.25, 1],
                  colorB: [1, 0.12, 0.45, 1],
                  width: 0.12,
                  intensity: 7,
                  mode: 1
                }
              );
            }
          }
        }
      });

      // debug
      window.slot = slot; window.slotGame = game; window.slotViews = views;
      window.addEventListener('keydown', e => {
        if(e.code !== 'Space') return;
        // Space is reserved for spinning: prevent page scrolling and ignore
        // key-repeat / extra presses until reels AND win presentation are done.
        e.preventDefault();

        // Spin
        if(e.repeat || game.state !== 'IDLE') return;
        game.spin();

        FX_MESH.effects.keeffect.recreateVertexDataCrazzy(randomIntFromTo(1, 2));
        FX_MESH.effects.keeffect.setIntensity(randomIntFromTo(2, 5));
      });

      // Remote spin events are opt-in; keyboard play stays fully local by default.
      if(ENABLE_REMOTE_SPIN_EVENTS) {
        const es = new EventSource(`${baseUrl}/slot-api/machines/${machineId}/events`);
        es.addEventListener('spin', e => game.playResult(JSON.parse(e.data)));
        slotMachine.slotEventSource = es;
      }

      game.on('insufficientBalance', ({balance, betAmount}) => {
        console.info(`[slot-demo] Not enough demo credits: balance=${balance}, bet=${betAmount}`);
      });
    }

    slotMachine.canvas.addEventListener("ray.hit.event", (e) => {
      console.log('ray.hit.event detected');
      if(e.detail.hitObject.name.startsWith('cubeeffect')) {
        if(game.state !== 'IDLE') return;
        game.spin();
      }
    });
  })
  window.app = slotMachine;
}