import MatrixEngineWGPU from "../../../src/world.js";
import {Controller} from "./controller.js";
import {HUD} from "./hud.js";
import {MEMapLoader} from "./map-loader.js";
import {Character} from "./character-base.js";
import {EnemiesManager} from "./enemies-manager.js";
import {CollisionSystem} from "../../../src/engine/collision-sub-system.js";
import {LS, mb, SS, urlQuery} from "../../../src/engine/utils.js";
import {MatrixStream} from "../../../src/engine/networking/net.js";
import {byId} from "../../../src/engine/networking/matrix-stream.js";
import {startUpPositions} from "./static.js";

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
// in prodc SS in dev LS
if(!SS.has('player') || !LS.has('player')) {
  // alert('No no');
  location.assign('google.com');
}

let forestOfHollowBlood = new MatrixEngineWGPU({
  useSingleRenderPass: true,
  canvasSize: 'fullscreen',
  mainCameraParams: {
    type: 'RPG',
    responseCoef: 1000
  },
  clearColor: {r: 0, b: 0.122, g: 0.122, a: 1}
}, () => {

  forestOfHollowBlood.player = {
    username: "guest"
  };

  // Audios
  forestOfHollowBlood.matrixSounds.createAudio('music', 'res/audios/rpg/music.mp3', 1)
  forestOfHollowBlood.matrixSounds.createAudio('win1', 'res/audios/rpg/feel.mp3', 2);

  addEventListener('AmmoReady', async () => {

    forestOfHollowBlood.player.data = SS.get('player');

    forestOfHollowBlood.net = new MatrixStream({
      active: true,
      domain: 'maximumroulette.com',
      port: 2020,
      sessionName: 'forestOfHollowBlood-free-for-all',
      resolution: '160x240',
      isDataOnly: (urlQuery.camera || urlQuery.audio ? false : true),
      customData: forestOfHollowBlood.player.data
    });

    forestOfHollowBlood.net.virtualEmiter = null;
    app.matrixSounds.audios.music.loop = true;

    addEventListener('net-ready', () => {
      // console.log('net-ready');
      // fix arg also
      if(forestOfHollowBlood.player.data.team == 'south') {
        forestOfHollowBlood.player.data.enemyTeam = 'north';
        forestOfHollowBlood.enemies = new EnemiesManager(forestOfHollowBlood, 'north');
      } else {
        forestOfHollowBlood.player.data.enemyTeam = 'south';
        forestOfHollowBlood.enemies = new EnemiesManager(forestOfHollowBlood, 'south');
      }
    });

    addEventListener('connectionDestroyed', (e) => {
      console.log('connectionDestroyed , bad bad.');
      if(byId('remote-' + e.detail.connectionId)) {
        byId('remote-' + e.detail.connectionId).remove();
        //....
        mb.error(`Player ${e.detail.connectionId} disconnected...`);
      }
    });

    addEventListener("onConnectionCreated", (e) => {
      if(e.detail.connection.connectionId == app.net.session.connection.connectionId) {
        let newPlayer = document.createElement('div');
        newPlayer.innerHTML = `Local Player: ${e.detail.connection.connectionId}`;
        newPlayer.id = `local-${e.detail.connection.connectionId}`;
        byId('matrix-net').appendChild(newPlayer);
        document.title = forestOfHollowBlood.label.get.titleBan;
      } else {
        let newPlayer = document.createElement('div');
        newPlayer.innerHTML = `remote Player: ${e.detail.connection.connectionId}`;
        newPlayer.id = `remote-${e.detail.connection.connectionId}`;
        byId('matrix-net').appendChild(newPlayer);
        if(forestOfHollowBlood.net.virtualEmiter == null) {
          // only one - first remote (it means in theory 'best remote player network response time')
          forestOfHollowBlood.net.virtualEmiter = e.detail.connection.connectionId;
        }
        let d = JSON.parse(e.detail.connection.data)
        console.log('testCustomData[newconn]', d);
        forestOfHollowBlood.enemies.loadEnemyHero(d);
      }
    })

    addEventListener('only-data-receive', (e) => {
      console.log('<data-receive>', e)
      if(e.detail.from.connectionId == app.net.session.connection.connectionId) {
        console.log('<data-receive damage for local hero !>', d)
      }
      let d = JSON.parse(e.detail.data);
      if(d.type == "damage") {
        // string
        console.log('<data-receive damage for >', d.defenderName);
        let IsEnemyHeroObj = forestOfHollowBlood.enemies.enemies.find((enemy) => enemy.name === d.defenderName);
        let IsEnemyCreepObj = forestOfHollowBlood.enemies.creeps.find((creep) => creep.name === d.defenderName);
        if(IsEnemyHeroObj) {
          console.log('<data-receive damage for IsEnemyHeroObj >', IsEnemyHeroObj);
          const progress = Math.max(0, Math.min(1, d.hp / IsEnemyHeroObj.getHPMax()));
          IsEnemyHeroObj.heroe_bodies[0].effects.energyBar.setProgress(progress);
          //..
        } else if(IsEnemyCreepObj) {
          console.log('<data-receive damage for IsEnemyCreepObj >', IsEnemyCreepObj);
          const progress = Math.max(0, Math.min(1, d.hp / IsEnemyCreepObj.getHPMax()));
          IsEnemyCreepObj.heroe_bodies[0].effects.energyBar.setProgress(progress);
          //..
        } else if(app.localHero.name == d.defenderName) {
          console.log('<data-receive damage for LOCAL HERO >');
          const progress = Math.max(0, Math.min(1, d.hp / app.localHero.getHPMax()));
          app.localHero.heroe_bodies[0].effects.energyBar.setProgress(progress);
          if(d.hp == 0 || progress == 0) {
            // local hero dead
            app.localHero.setDead();
            setTimeout(() => {
              app.localHero.heroe_bodies[0].position.setPosition(
                startUpPositions[forestOfHollowBlood.player.data.team][0],
                startUpPositions[forestOfHollowBlood.player.data.team][1],
                startUpPositions[forestOfHollowBlood.player.data.team][2]
              );
            }, 1000);
          }
        }
      } else if("damage-creep") {
        console.log('<data-receive damage creep team:', d.defenderTeam);
        // true always
        if(app.player.data.team == d.defenderTeam) {
          // get last char from string defenderName
          let getCreepByIndex = parseInt(d.defenderName[d.defenderName.length - 1]);
          app.localHero.friendlyLocal.creeps[getCreepByIndex]
            .heroe_bodies[0].effects.energyBar.setProgress(d.progress);
          if(d.progress == 0) {
            app.localHero.friendlyLocal.creeps[getCreepByIndex].setDead();

            setTimeout(() => {
              app.localHero.friendlyLocal.creeps[getCreepByIndex].setStartUpPosition();
              app.localHero.friendlyLocal.creeps[getCreepByIndex].gotoFinal = false;
              app.localHero.friendlyLocal.creeps[getCreepByIndex].heroe_bodies[0].effects.energyBar.setProgress(1);
            }, 1000)

            //  SEND ENERGY BATR PROGREEs
            // this.core.net.sendOnlyData({
            //   type: "damage-creep",
            //   defenderName: e.detail.defender,
            //   defenderTeam: this.team,
            //   hp: e.detail.hp,
            //   progress: e.detail.progress
            // });

          }
        }
      }
    })

    addEventListener('local-hero-bodies-ready', () => {
      app.cameras.RPG.position[1] = 130;
      app.cameras.RPG.movementSpeed = 100;
      app.cameras.RPG.followMe = forestOfHollowBlood.localHero.heroe_bodies[0].position;
      app.cameras.RPG.mousRollInAction = true;
      // automatic
      byId('join-btn').click();
    });

    forestOfHollowBlood.RPG = new Controller(forestOfHollowBlood);

    forestOfHollowBlood.mapLoader = new MEMapLoader(forestOfHollowBlood, "./res/meshes/nav-mesh/navmesh.json");
    // fix arg later!
    forestOfHollowBlood.localHero = new Character(
      forestOfHollowBlood, forestOfHollowBlood.player.data.path,
      forestOfHollowBlood.player.data.hero, [forestOfHollowBlood.player.data.archetypes]);

    forestOfHollowBlood.HUD = new HUD(forestOfHollowBlood.localHero);

    forestOfHollowBlood.collisionSystem = new CollisionSystem(forestOfHollowBlood);
    app.matrixSounds.play('music');
  })
  forestOfHollowBlood.addLight();
})
window.app = forestOfHollowBlood;