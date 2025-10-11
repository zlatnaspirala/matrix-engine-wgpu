
import MatrixEngineWGPU from "../../../src/world.js";
// import {uploadGLBModel} from "../../../src/engine/loaders/webgpu-gltf.js";
import {Controller} from "./controller.js";
import {HUD} from "./hud.js";
import {MEMapLoader} from "./map-loader.js";
import {Character} from "./characterBase.js";

/**
 * @Note
 * “Character and animation assets from Mixamo,
 * used under Adobe’s royalty‑free license. 
 * Redistribution of raw assets is not permitted.”
 **/
let MYSTICORE = new MatrixEngineWGPU({
  useSingleRenderPass: true,
  canvasSize: 'fullscreen',
  mainCameraParams: {
    type: 'WASD',
    responseCoef: 1000
  },
  clearColor: {r: 0, b: 0.122, g: 0.122, a: 1}
}, () => {

  addEventListener('AmmoReady', async () => {

    MYSTICORE.RPG = new Controller(MYSTICORE.canvas);
    MYSTICORE.HUD = new HUD();

    app.cameras.WASD.movementSpeed = 100;

    setTimeout(() => {
      app.cameras.WASD.yaw = -0.03;
      app.cameras.WASD.pitch = -0.49;
      app.cameras.WASD.position[2] = 0;
      app.cameras.WASD.position[1] = 23;
    }, 2000)

    // MAPs
    MYSTICORE.mapLoader = new MEMapLoader(MYSTICORE, "./res/meshes/nav-mesh/navmesh.json");

    // LOCAL HERO
    MYSTICORE.localHero = new Character(
      MYSTICORE,
      "res/meshes/glb/woman1.glb",
      'MariaSword', HERO_PROFILES.MariaSword.baseArchetypes);

  })
  MYSTICORE.addLight();
})

// just for dev
window.app = MYSTICORE;