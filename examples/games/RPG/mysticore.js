import MatrixEngineWGPU from "../../../src/world.js";
import {Controller} from "./controller.js";
import {HUD} from "./hud.js";
import {MEMapLoader} from "./map-loader.js";
import {Character} from "./character-base.js";
import {HERO_PROFILES} from "./hero.js";
import {EnemiesManager} from "./enemies-manager.js";
import {CollisionSystem} from "../../../src/engine/collision-sub-system.js";
import {LS} from "../../../src/engine/utils.js";
import {MatrixStream} from "../../../src/engine/networking/net.js";
import {byId} from "../../../src/engine/networking/matrix-stream.js";

/**
 * @description
 * This is main root dep file.
 * All start from here.
 * @Note
 * “Character and animation assets from Mixamo,
 * used under Adobe’s royalty‑free license. 
 * Redistribution of raw assets is not permitted.”
 **/

// Prevent no inputs cases
if(!LS.has('player')) {
  // alert('No no');
  location.assign('google.com');
}

let mysticore = new MatrixEngineWGPU({
  useSingleRenderPass: true,
  canvasSize: 'fullscreen',
  mainCameraParams: {
    type: 'RPG',
    responseCoef: 1000
  },
  clearColor: {r: 0, b: 0.122, g: 0.122, a: 1}
}, () => {

  let player = {
    username: "guest"
  };
  // Audios
  mysticore.matrixSounds.createAudio('music', 'res/audios/rpg/music.mp3', 1)
  mysticore.matrixSounds.createAudio('win1', 'res/audios/rpg/feel.mp3', 2);

  // test
  mysticore.net = new MatrixStream({
    active: true,
    domain: 'maximumroulette.com',
    port: 2020,
    sessionName: 'mysticore-free-for-all',
    resolution: '160x240'
  });

  addEventListener('AmmoReady', async () => {

    // NET
    addEventListener('net-ready', () => {
      console.log('net-ready');
    });

    addEventListener('connectionDestroyed', (e) => {
      console.log('connectionDestroyed , bad bad...');
      if(byId(e.detail.connectionId)) { }
    });

    addEventListener("onConnectionCreated", (e) => {
      console.log('newconn : created', e.detail);
      let newPlayer = document.createElement('div');
      newPlayer.innerHTML = `Player: ${e.detail.connection.connectionId}`;
      newPlayer.id = `waiting-${e.detail.connection.connectionId}`;
      //-- 
    })

    addEventListener('only-data-receive', (e) => {
      console.log('<data-receive>', e)
    })
    // END NET
    app.matrixSounds.audios.music.loop = true;

    player.data = LS.get('player');

    addEventListener('local-hero-bodies-ready', () => {
      app.cameras.RPG.position[1] = 130;
      app.cameras.RPG.followMe = mysticore.localHero.heroe_bodies[0].position;
    })
    mysticore.RPG = new Controller(mysticore);
    app.cameras.RPG.movementSpeed = 100;

    mysticore.mapLoader = new MEMapLoader(mysticore, "./res/meshes/nav-mesh/navmesh.json");

    mysticore.localHero = new Character(
      mysticore,
      player.data.path,
      player.data.hero, HERO_PROFILES.MariaSword.baseArchetypes);

    mysticore.HUD = new HUD(mysticore.localHero);

    mysticore.enemies = new EnemiesManager(mysticore);

    mysticore.collisionSystem = new CollisionSystem(mysticore);

    app.matrixSounds.play('music');
  })
  mysticore.addLight();
})
window.app = mysticore;