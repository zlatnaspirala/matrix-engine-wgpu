
import MatrixEngineWGPU from "../../../src/world.js";
// import {uploadGLBModel} from "../../../src/engine/loaders/webgpu-gltf.js";
import {Controller} from "./controller.js";
import {HUD} from "./hud.js";
import {MEMapLoader} from "./map-loader.js";
import {Character} from "./character-base.js";
import {HERO_PROFILES} from "./hero.js";
import {Enemie} from "./enemy-character.js";

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
    type: 'WASD',
    responseCoef: 1000
  },
  clearColor: {r: 0, b: 0.122, g: 0.122, a: 1}
}, () => {

  addEventListener('AmmoReady', async () => {

    mysticore.RPG = new Controller(mysticore.canvas);
    app.cameras.WASD.movementSpeed = 100;
    // MAPs
    mysticore.mapLoader = new MEMapLoader(mysticore, "./res/meshes/nav-mesh/navmesh.json");
    // LOCAL HERO
    mysticore.localHero = new Character(
      mysticore,
      "res/meshes/glb/woman1.glb",
      'MariaSword', HERO_PROFILES.MariaSword.baseArchetypes);
    mysticore.HUD = new HUD(mysticore.localHero);
    setTimeout(() => {
      app.cameras.WASD.yaw = -0.03;
      app.cameras.WASD.pitch = -0.49;
      app.cameras.WASD.position[2] = 0;
      app.cameras.WASD.position[1] = 23;
    }, 2000)

    // new enemy characters
    mysticore.enemies = new Enemie(
      {
        core: mysticore,
        // core: mysticore,
        name: 'Slayzer',
        path: 'res/meshes/glb/monster.glb'
      }
    );
  })
  mysticore.addLight();
})

// just for dev
window.app = mysticore;