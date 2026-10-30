import MatrixEngineWGPU from "../../../src/world.js";
import {downloadMeshes} from '../../../src/engine/loader-obj.js';
import {addRaycastsAABBListener} from "../../../src/engine/raycast.js";
import {SpritesPack2D} from "../../../src/engine/effects/sprite2d2.js";
import {InstancedKinematicOperations} from "../../../src/engine/procedures/InstancedKinematicOperations.js";
import {KaleidoscopeEmitter} from "../../../src/engine/effects/kaleidoscopeEffectInstance.js";
import {randomIntFromTo} from "../../../src/engine/utils.js";
import {GenGeoTexture2} from "../../../src/engine/effects/gen-tex2.js";
import {adaptSlotConfig, fetchSlotConfig} from "./networking.js";
import {SlotReel} from "./reel.js";
import {SlotGame} from "./state.js";

/**
 *
 * Add your domain where you have installer or runned "slot-simulator" application.
 * Add you machine ID created from "slot-simulator".
 */
const baseUrl = 'https://slot-simulator.onrender.com';
const machineId = '6ac80510c453c7d32ec5364a';

const sleep = ms => new Promise(r => setTimeout(r, ms));
const SPACING = 6, SCALE = 3.5;
const reelX = (i, n) => (i - (n - 1) / 2) * SPACING;

async function initializeSymbolReel(mesh, engine, reelCfg) {
  const batch = new SpritesPack2D(engine.device, 'rgba16float', 'rgba16float', engine.cameraBuffer);
  const symbolIds = [...new Set(reelCfg.strip)];
  for(const id of symbolIds) {
    const path = `./res/textures/slot/symbols/${encodeURIComponent(id)}.webp`;
    await batch.registerSpritesheet(id, path, 4, 4);
  }

  const count = reelCfg.strip.length;
  const radius = 4.5;
  reelCfg.strip.forEach((id, index) => {
    const angle = (index / count) * Math.PI * 2;
    batch.createSprite(`symbol-${index}`, id, {
      currentFrame: 0,
      autoPlay: false,
      scale: 1,
      localOffset: [Math.cos(angle) * radius, Math.sin(angle) * radius, 0]
    });
  });

  if(!mesh.effects) mesh.effects = {};
  mesh.effects.spriteBatch = batch;
  return batch;
}

export var loadSlot = function() {

  let slotMachine = new MatrixEngineWGPU({
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
  }, async () => {

    const raw = await fetchSlotConfig(baseUrl, machineId);
    const slot = adaptSlotConfig(raw);
    console.log(slot.reelCount, slot.visibleRows, slot.paylines.length);
    slot.warnings.forEach(w => console.warn('[slot]', w));
    const n = slot.reelCount;

    slotMachine.addLight();
    downloadMeshes({ball: "./res/meshes/blender/sphere.obj", cube: "./res/meshes/blender/cube.obj", plane: "./res/meshes/blender/plane.obj"},
      onLoadObj, {scale: [1, 1, 1]})
    downloadMeshes({cube: "./res/meshes/blender/cube.obj"}, onGround, {scale: [35, 0.5, 35]})
    addRaycastsAABBListener('canvas1', 'click');

    function onGround(m) {
      slotMachine.addMeshObj({
        material: {type: 'standard', share: true},
        position: {x: 0, y: -5, z: -10},
        rotation: {x: 0, y: 0, z: 0},
        rotationSpeed: {x: 0, y: 0, z: 0},
        texturesPaths: ['./res/textures/floor1.webp'],
        name: 'floor',
        mesh: m.cube,
        physics: {
          enabled: false,
          mass: 0,
          geometry: "Cube"
        }
      })
    }

    async function onLoadObj(m) {
      slotMachine.addMeshObj({
        material: {type: 'standard', share: true},
        position: {x: 0, y: -1, z: -20},
        rotation: {x: 0, y: 0, z: 0},
        scale: [100, 100, 100],
        rotationSpeed: {x: 0, y: 0.1, z: 0},
        texturesPaths: ['./res/textures/env-maps/sky1_lod_mid.webp'],
        name: 'sky',
        mesh: m.ball,
        physics: {
          enabled: false,
          geometry: "Sphere"
        }
      });

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

      slotMachine.lightContainer[0].setIntensity(15);
      slotMachine.activateBloomEffect();
      slotMachine.activateVolumetricEffect();
      slotMachine.lightContainer[0].behavior.setOsc0(-2, 2, 0.01)
      slotMachine.lightContainer[0].behavior.value_ = -1;
      slotMachine.lightContainer[0].updater.push((light) => {
        light.setTargetX(light.behavior.setPath0());
        light.setPosX(light.behavior.setPath0());
      })
      slotMachine.lightContainer[0].setPosition(0, 45, -8);
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
      FX_MESH.effects.circle = new GenGeoTexture2(slotMachine.device, 'rgba16float', 'circle2', './res/textures/star1.png', 3, slotMachine.cameraBuffer);
      FX_MESH.effects.keeffect = new KaleidoscopeEmitter(slotMachine.device, 'rgba16float', 30, slotMachine.cameraBuffer);

      for(const [i, mesh] of reelMeshes.entries()) {
        await initializeSymbolReel(mesh, slotMachine, slot.reels[i]);
      }

      const cam = slotMachine.getCamera();
      cam.setYaw(-0.03); cam.setPitch(-0.05);
      cam.setZ(22 * Math.max(1, n / 3)); cam.setY(16);
      cam._dirtyAngle = true;

      reelMeshes.forEach(mesh => mesh.setBlend(0.001));
      reelMeshes[0].setupPipeline();
      slotMachine.buildRenderBuckets();

      // debug
      slotMachine.reelMeshes = reelMeshes;

      await sleep(400);

      const views = reelMeshes.map((mesh, i) => new SlotReel(mesh, slot.reels[i], {visibleRows: slot.visibleRows}));
      for(const v of views) await v.layout(60);

      FX_MESH.effects.circle.updateInstanceCount(8);
      new InstancedKinematicOperations(FX_MESH.effects.circle.instanceTargets).orbit();
      FX_MESH.effects.circle.instanceTargets[0].isDyrty = true;
      slotMachine.getSceneObjectByName('sky').setAmbient(2, 0.5, 1);
      reelMeshes.forEach(r => r.setAmbient(2, 0, 0));

      const game = new SlotGame(slot, views, {
        lineBet: 1,
        onPresentWin: async res => {
          FX_MESH.effects.keeffect.recreateVertexDataCrazzy(randomIntFromTo(6, 36));
          FX_MESH.effects.keeffect.setIntensity(randomIntFromTo(3, 23));
          await sleep(1500);
        }
      });
      game.on('result', r => console.log('RESULT', r.grid.map(c => c.join(' ')), 'win', r.totalWin, 'FS', r.freeSpinsLeft));

      window.slot = slot; window.slotGame = game; window.slotViews = views;
      window.addEventListener('keydown', e => {if(e.code === 'Space') game.spin();});

      const es = new EventSource(`${baseUrl}/slot-api/machines/${machineId}/events`);
      es.addEventListener('spin', e => game.playResult(JSON.parse(e.data)));
    }

    slotMachine.canvas.addEventListener("ray.hit.event", (e) => {
      console.log('ray.hit.event detected');
      if(e.detail.hitObject.name.startsWith('cubeeffect')) {
        e.detail.hitObject.effects.keeffect.recreateVertexDataCrazzy(randomIntFromTo(6, 36));
        e.detail.hitObject.effects.keeffect.setIntensity(randomIntFromTo(3, 23));
      }
    });

  })
  window.app = slotMachine;
}