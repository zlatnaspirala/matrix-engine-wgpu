import MatrixEngineWGPU from "../../../src/world.js";
import {Controller} from "./controller.js";
import {HUD} from "./hud.js";
import {MEMapLoader} from "./map-loader.js";
import {Character} from "./character-base.js";
import {HERO_PROFILES} from "./hero.js";
import {EnemiesManager} from "./enemies-manager.js";
import {CollisionSystem} from "../../../src/engine/collision-sub-system.js";

/**
 * @Note
 * “Character and animation assets from Mixamo,
 * used under Adobe’s royalty‑free license. 
 * Redistribution of raw assets is not permitted.”
 **/
let mysticoreStartSceenStartSceen = new MatrixEngineWGPU({
  useSingleRenderPass: true,
  canvasSize: 'fullscreen',
  mainCameraParams: {
    type: 'RPG',
    responseCoef: 1000
  },
  clearColor: {r: 0, b: 0.122, g: 0.122, a: 1}
}, () => {

  addEventListener('AmmoReady', async () => {

    let heros = [
      {name: 'Maria', path: "res/meshes/glb/woman1.glb"},
      {name: 'Slayzer', path: "res/meshes/glb/monster.glb"}
    ];

    async function loadHeros() {

      for(var x = 0;x < heros.length;x++) {
        var glbFile01 = await fetch(heros[x].path).then(res => res.arrayBuffer().then(buf => uploadGLBModel(buf, this.core.device)));
        this.core.addGlbObjInctance({
          material: {type: 'standard', useTextureFromGlb: true},
          scale: [20, 20, 20],
          position: {x: 0, y: -23, z: -0},
          name: heros[x].name,
          texturesPaths: ['./res/meshes/glb/textures/mutant_origin.png'],
          raycast: {enabled: true, radius: 1},
          pointerEffect: {
            enabled: true,
            pointer: true,
            energyBar: true,
            flameEffect: false,
            flameEmitter: true,
            circlePlane: true,
            circlePlaneTex: true,
            circlePlaneTexPath: './res/textures/rpg/symbols/star.png',
          }
        }, null, glbFile01);
      }


    }

    loadHeros();
    // mysticoreStartSceen.localHero = new Character(
    //   mysticoreStartSceen,
    //   "res/meshes/glb/woman1.glb",
    //   'MariaSword', HERO_PROFILES.MariaSword.baseArchetypes);
  })
  mysticoreStartSceen.addLight();
})
window.app = mysticoreStartSceen;