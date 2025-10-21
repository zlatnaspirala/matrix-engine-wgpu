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

    addEventListener('local-hero-bodies-ready', () => {
      app.cameras.RPG.position[1] = 130;
      app.cameras.RPG.followMe = mysticore.localHero.heroe_bodies[0].position;
    })

    mysticore.RPG = new Controller(mysticore);
    app.cameras.RPG.movementSpeed = 100;
    mysticore.mapLoader = new MEMapLoader(mysticore, "./res/meshes/nav-mesh/navmesh.json");
    mysticore.localHero = new Character(
      mysticore,
      "res/meshes/glb/woman1.glb",
      'MariaSword', HERO_PROFILES.MariaSword.baseArchetypes);
    mysticore.HUD = new HUD(mysticore.localHero);
    mysticore.enemies = new EnemiesManager(mysticore);
    mysticore.collisionSystem = new CollisionSystem(mysticore);
    // setTimeout(() => {   // }, 3000);
  })
  mysticore.addLight();
})
window.app = mysticore;