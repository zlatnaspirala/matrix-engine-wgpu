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
import {MatrixTTS} from "./tts.js";
import {Marketplace} from "./marketplace.js";
import {Inventory} from "./invertoryManager.js";

/**
 * @description
 * This is main root dep file.
 * All start from here.
 * @Note
 * “Character and animation assets from Mixamo,
 * used under Adobe’s royalty‑free license. 
 * Redistribution of raw assets is not permitted.”
 **/
// set orientation  in animation end hero
// setup HP after setDead
if(!SS.has('player') || !LS.has('player')) {
  location.href = 'https://google.com';
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

  // forestOfHollowBlood.tts = new MatrixTTS();

  forestOfHollowBlood.player = {
    username: "guest"
  };

  // Audios
  forestOfHollowBlood.matrixSounds.createAudio('music', 'res/audios/rpg/music.mp3', 1)
  forestOfHollowBlood.matrixSounds.createAudio('win1', 'res/audios/rpg/feel.mp3', 2);

  // addEventListener('AmmoReady', async () => {

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

    forestOfHollowBlood.player.remoteByTeam = {
      south: [],
      north: []
    };

    app.matrixSounds.audios.music.loop = true;

    addEventListener('net-ready', () => {
      // console.log('net-ready ----------------------------------------------------');
      // console.log('forestOfHollowBlood.player.data.numOfPlayers', forestOfHollowBlood.player.data.numOfPlayers);
      // automatic
      byId('join-btn').click();
      // console.log('net-ready ----------------------------------------------------');

      // fix arg also
      // setTimeout(() => {
      console.log(' NOW LOAD CREEPS ');
      forestOfHollowBlood.loadEnemyCreeps();
      // }, 1000);
      byId('buttonLeaveSession').addEventListener('click', () => {
        location.assign("rpg-menu.html");
      });
    });

    forestOfHollowBlood.loadEnemyCreeps = () => {
      if(forestOfHollowBlood.player.data.team == 'south') {
        forestOfHollowBlood.player.data.enemyTeam = 'north';
        forestOfHollowBlood.enemies = new EnemiesManager(forestOfHollowBlood, 'north');
      } else {
        forestOfHollowBlood.player.data.enemyTeam = 'south';
        forestOfHollowBlood.enemies = new EnemiesManager(forestOfHollowBlood, 'south');
      }
    }

    addEventListener('connectionDestroyed', (e) => {
      console.log('connectionDestroyed , bad bad . end of game.');
      /**
       * @note
       * For now actual is most simple way 
       * Destroy game session if any player disconnected.
       * Later : after adding DB backend account session
       * add negative BAN flag for players who leave gameplay.
       */
      if(byId('remote-' + e.detail.connectionId)) {
        byId('remote-' + e.detail.connectionId).remove();
        //....
        // byId('waiting-' + e.detail.connectionId).remove();
        mb.error(`Player ${e.detail.connectionId} disconnected...`);
        let getPlayer = JSON.parse(e.detail.event.connection.data);
        let disPlayer = forestOfHollowBlood.getSceneObjectByName(getPlayer.mesh);
        mb.error(`Player ${e.detail.connectionId} disconnected..${disPlayer}.`);
        // back to base for now
        disPlayer.position.setPosition(
          startUpPositions[getPlayer.team][0],
          startUpPositions[getPlayer.team][1],
          startUpPositions[getPlayer.team][2]);
      }

      setTimeout(() => {
        // app.net.closeSession();
        app.net.buttonLeaveSession.click();
        location.assign("rpg-menu.html");
      }, 4000);
    });

    addEventListener("onConnectionCreated", (e) => {
      const remoteCons = Array.from(e.detail.connection.session.remoteConnections.entries());
      if(remoteCons.length == (forestOfHollowBlood.player.data.numOfPlayers - 1)) {
        console.log(' -------------------GAME PLAYERS REACHED ALL PLAYERS---------------------------------');
      }
      const isLocal = e.detail.connection.connectionId == app.net.session.connection.connectionId;
      if(e.detail.connection.session.remoteConnections.size == 0) {
        // FIRST BE EMITER
        if(forestOfHollowBlood.net.virtualEmiter == null && isLocal) {
          // console.log('[- Absolute first I AM EMITTER FOR NEUTRALS virtualEmiter set1 ]', e.detail.connection.connectionId);
          forestOfHollowBlood.net.virtualEmiter = e.detail.connection.connectionId;
          document.title = "VE " + app.net.session.connection.connectionId;
        }
      }
      else {
        // If present same team than emitter is active ...
        let isSameTeamAlready = false;
        for(var x = 0;x < remoteCons.length;x++) {
          let currentRemoteConn = JSON.parse(remoteCons[x][1].data);
          if(forestOfHollowBlood.player.data.team == currentRemoteConn.team) {
            // 0 is string connId 1 is full connec objc 
            // console.log('[COLLECT teams >>>>>>local>>>>>>>]  already present team player .', remoteCons[x]);
            isSameTeamAlready = true;
            if(forestOfHollowBlood.player.remoteByTeam[forestOfHollowBlood.player.data.team].indexOf(remoteCons[x][1]) == -1) {
              forestOfHollowBlood.player.remoteByTeam[forestOfHollowBlood.player.data.team].push(remoteCons[x][1]);
            }
          } else {
            // console.log('[COLLECT teams >>>>>>enemy>>>>>>>]  already present team player .', remoteCons[x]);
            if(forestOfHollowBlood.player.remoteByTeam[currentRemoteConn.team].indexOf(remoteCons[x][1]) == -1) {
              forestOfHollowBlood.player.remoteByTeam[currentRemoteConn.team].push(remoteCons[x][1]);
            }
          }
        }
        if(isSameTeamAlready == false && isLocal == true) {
          console.log('[EMITTER FOR NEUTRALS] virtualEmiter set2 [x]', remoteCons[x]);
          forestOfHollowBlood.net.virtualEmiter = e.detail.connection.connectionId;
          document.title = "VE " + app.net.session.connection.connectionId;
        }
      }

      if(e.detail.connection.connectionId == app.net.session.connection.connectionId) {
        let newPlayer = document.createElement('div');
        newPlayer.innerHTML = `Local Player: ${e.detail.connection.connectionId}`;
        newPlayer.id = `local-${e.detail.connection.connectionId}`;
        byId('matrix-net').appendChild(newPlayer);
        // document.title = forestOfHollowBlood.label.get.titleBan;
        // document.title = app.net.session.connection.connectionId;

        // local
        // forestOfHollowBlood.localHero.loadfriendlyCreeps();
      } else {
        //--------------------------------------------------------
        let newPlayer = document.createElement('div');
        newPlayer.innerHTML = `remote Player: ${e.detail.connection.connectionId}`;
        newPlayer.id = `remote-${e.detail.connection.connectionId}`;
        byId('matrix-net').appendChild(newPlayer);
        let d = JSON.parse(e.detail.connection.data)
        if(d.team == app.player.data.team) {
          // for case on refresh CRITICAL !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
          // for case on refresh CRITICAL !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
          // console.log('[new Friendly hero]', d);
          // d.mesh 
          let testIfExistAlready = app.mainRenderBundle.filter(obj =>
            obj.name && obj.name.includes(d.mesh));
          if(testIfExistAlready.length > 0) {
            console.log('[new Friendly hero already exist do nothing]', d);
          } else {
            app.localHero.loadFriendlyHero(d);
          }
        } else {
          let testIfExistAlready = app.mainRenderBundle.filter(obj =>
            obj.name && obj.name.includes(d.mesh));
          if(testIfExistAlready.length > 0) {
            console.log('[new enemy hero already exist do nothing]', d);
          } else {
            // console.log('[new enemy hero]', d);
            app.enemies.loadEnemyHero(d);
          }
        }
      }
    });

    addEventListener('self-msg-data', (e) => {

      let d = JSON.parse(e.detail.data);
      console.log('<data-receive self>', d);
      if(d.type == "damage") {
        // string
        console.log('<data-receive damage for >', d.defenderName);
        let IsEnemyHeroObj = forestOfHollowBlood.enemies.enemies.find((enemy) => enemy.name === d.defenderName);
        let IsEnemyCreepObj = forestOfHollowBlood.enemies.creeps.find((creep) => creep.name === d.defenderName);
        if(IsEnemyHeroObj) {
          console.log('<data-receive damage for IsEnemyHeroObj >', IsEnemyHeroObj);
          const progress = Math.max(0, Math.min(1, d.hp / IsEnemyHeroObj.getHPMax()));
          IsEnemyHeroObj.heroe_bodies[0].effects.energyBar.setProgress(progress);
          console.log('<data-receive damage IsEnemyHeroObj progress >', progress);
          if(progress == 0) {
            if(app.localHero.name == d.attackerName) {
              console.log('<data-receive damage KILL by local >', d.attackerName);
              app.localHero.killEnemy(1);
            }
          }

          //..
        }
      }
    });

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

        // new
        let IsFriendlyHeroObj = forestOfHollowBlood.localHero.friendlyLocal.heroes.find((fhero) => fhero.name === d.defenderName);

        if(IsFriendlyHeroObj) {
          //
          console.log('<data-receive damage for IsFriendlyHeroObj >', IsFriendlyHeroObj);
          const progress = Math.max(0, Math.min(1, d.hp / IsFriendlyHeroObj.getHPMax()));
          IsFriendlyHeroObj.heroe_bodies[0].effects.energyBar.setProgress(progress);
          console.log('<data-receive damage IsFriendlyHeroObj progress >', progress);

        } else if(IsEnemyHeroObj) {
          console.log('<data-receive damage for IsEnemyHeroObj >', IsEnemyHeroObj);
          const progress = Math.max(0, Math.min(1, d.hp / IsEnemyHeroObj.getHPMax()));
          IsEnemyHeroObj.heroe_bodies[0].effects.energyBar.setProgress(progress);
          console.log('<data-receive damage IsEnemyHeroObj progress >', progress);
          if(progress == 0) {
            if(app.localHero.name == d.attackerName) {
              console.log('<data-receive damage KILL by local >', d.attackerName);
              app.localHero.killEnemy(1);
            }
          }

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
    });

    forestOfHollowBlood.RPG = new Controller(forestOfHollowBlood);

    forestOfHollowBlood.mapLoader = new MEMapLoader(forestOfHollowBlood, "./res/meshes/nav-mesh/navmesh.json");
    // fix arg later!
    forestOfHollowBlood.localHero = new Character(
      forestOfHollowBlood, forestOfHollowBlood.player.data.path,
      forestOfHollowBlood.player.data.hero, [forestOfHollowBlood.player.data.archetypes]);

    forestOfHollowBlood.localHero.inventory = new Inventory(forestOfHollowBlood.localHero);
    forestOfHollowBlood.marketPlace = new Marketplace(forestOfHollowBlood.localHero);
    forestOfHollowBlood.marketPlace.mb = mb;
    forestOfHollowBlood.marketPlace.label = forestOfHollowBlood.label;
    forestOfHollowBlood.localHero.inventory.loadAllRules(forestOfHollowBlood.marketPlace._generateItems());

    forestOfHollowBlood.HUD = new HUD(forestOfHollowBlood.localHero);

    forestOfHollowBlood.collisionSystem = new CollisionSystem(forestOfHollowBlood);
    app.matrixSounds.play('music');
  // })
  forestOfHollowBlood.addLight();
})
window.app = forestOfHollowBlood;