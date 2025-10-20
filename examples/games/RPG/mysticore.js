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
let mysticore = new MatrixEngineWGPU({
  useSingleRenderPass: true,
  canvasSize: 'fullscreen',
  mainCameraParams: {
    type: 'RPG',
    responseCoef: 1000
  },
  clearColor: {r: 0, b: 0.122, g: 0.122, a: 1}
}, () => {

  addEventListener('AmmoReady', async () => {
    mysticore.RPG = new Controller(mysticore);
    app.cameras.RPG.movementSpeed = 100;

    mysticore.mapLoader = new MEMapLoader(mysticore, "./res/meshes/nav-mesh/navmesh.json");

    mysticore.localHero = new Character(
      mysticore,
      "res/meshes/glb/woman1.glb",
      'MariaSword', HERO_PROFILES.MariaSword.baseArchetypes);
    mysticore.HUD = new HUD(mysticore.localHero);
    setTimeout(() => {
      // app.cameras.RPG.yaw = -0.03;
      // app.cameras.RPG.pitch = -0.49;
      // app.cameras.RPG.position[2] = 0;
      app.cameras.RPG.position[1] = 100;
    }, 2000)

    mysticore.enemies = new EnemiesManager(mysticore);

    mysticore.collisionSystem = new CollisionSystem(mysticore)
  })
  mysticore.addLight();
})
window.app = mysticore;