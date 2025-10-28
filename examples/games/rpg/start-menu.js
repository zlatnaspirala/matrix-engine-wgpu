import {uploadGLBModel} from "../../../src/engine/loaders/webgpu-gltf.js";
import {MatrixStream} from "../../../src/engine/networking/net.js";
import {byId, LS} from "../../../src/engine/utils.js";
import MatrixEngineWGPU from "../../../src/world.js";
import {HERO_ARCHETYPES} from "./hero.js";

/**
 * @Note
 * “Character and animation assets from Mixamo,
 * used under Adobe’s royalty‑free license. 
 * Redistribution of raw assets is not permitted.”
 * 
 * @Note 
 * All @zlatnaspirala software use networking based
 * on openvidu/kurento media server(webRTC).
 * Node.js used for middleware.
 * Server Events API also used for helping in creation of
 * matching/waiting list players or get status of public channel
 * (game-play channel).
 **/
let forestOfHollowBloodStartSceen = new MatrixEngineWGPU({
  useSingleRenderPass: true,
  canvasSize: 'fullscreen',
  mainCameraParams: {
    type: 'WASD',
    responseCoef: 1000
  },
  clearColor: {r: 0, b: 0.122, g: 0.122, a: 1}
}, (forestOfHollowBloodStartSceen) => {

  forestOfHollowBloodStartSceen.heroByBody = [];
  forestOfHollowBloodStartSceen.selectedHero = 0;
  forestOfHollowBloodStartSceen.lock = false;

  // Audios
  forestOfHollowBloodStartSceen.matrixSounds.createAudio('music', 'res/audios/rpg/wizard-rider.mp3', 1)
  forestOfHollowBloodStartSceen.matrixSounds.createAudio('win1', 'res/audios/rpg/feel.mp3', 2);
  let heros = null;

  // Networking
  forestOfHollowBloodStartSceen.net = new MatrixStream({
    active: true,
    domain: 'maximumroulette.com',
    port: 2020,
    sessionName: 'forestOfHollowBlood-free-for-all-start',
    resolution: '160x240',
    isDataOnly: true
  });

  function handleHeroImage(selectHeroIndex) {
    let name;
    if(selectHeroIndex == 0) {
      name = 'mariasword';
    } else if(selectHeroIndex == 1) {
      name = 'slayzer';
    } else if(selectHeroIndex == 2) {
      name = 'slayzer';
    }
    return name;
  }

  function checkHeroStatus() {
    // app.net.session.remoteConnections.forEach((remoteConn) => {
    //   console.log(" test remote conn ", remoteConn.connectionId)
    // });
    let isUsed = false;
    document.querySelectorAll('[data-hero-index]').forEach((elem) => {
      const index = elem.getAttribute('data-hero-index');
      console.log('Hero element:', elem, 'Index:', index);
      if (index == app.selectedHero){
        isUsed = true;
      }
    });
    return isUsed;
  }

  function determinateSelection() {

    if (checkHeroStatus() == true) {
      console.log("hero used keep graphics no send ")
      return;
    }

    if(app.net.session.connection != null) app.net.sendOnlyData({
      selectHeroIndex: app.selectedHero
    });
    // fix for local
    if(byId(`waiting-img-${app.net.session.connection.connectionId}`)) {
      byId(`waiting-img-${app.net.session.connection.connectionId}`).src =
        `./res/textures/rpg/hero-image/${handleHeroImage(app.selectedHero)}.png`;
      heroImage.setAttribute('data-hero-index', app.selectedHero);
    } else {
      let heroImage = document.createElement('img');
      heroImage.setAttribute('data-hero-index', app.selectedHero);
      heroImage.id = `waiting-img-${app.net.session.connection.connectionId}`;
      heroImage.width = '64';
      heroImage.height = '64';
      heroImage.src = `./res/textures/rpg/hero-image/${handleHeroImage(app.selectedHero)}.png`
      byId(`waiting-${app.net.session.connection.connectionId}`).appendChild(heroImage);
    }
  }

  addEventListener('check-gameplay-channel', (e) => {
    let info = e.detail;
    console.log('check-gameplay-channel ', info)
    if(info.status) {
      console.log('check-gameplay-channel ', info.status)
      console.log('check-gameplay-channel [url] ', info.url)
      byId("onlineUsers").innerHTML = `GamePlay:Free`;
    } else {
      let info = JSON.parse(e.detail);
      console.log('check-gameplay-channel ', info.connections.numberOfElements)
      byId("onlineUsers").innerHTML = `GamePlay:${info.connections.numberOfElements}`;
    }
  })

  forestOfHollowBloodStartSceen.MINIMUM_PLAYERS = 4;

  forestOfHollowBloodStartSceen.setWaitingList = () => {
    // access net doms who comes with broadcaster2.html
    const waitingForOthersDOM = document.createElement("div");
    waitingForOthersDOM.id = "waitingForOthersDOM";
    Object.assign(waitingForOthersDOM.style, {
      flexFlow: 'wrap',
      width: "100%",
      height: "35%",
      backgroundColor: "rgba(60, 60, 60, 1)",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-around",
      color: "white",
      fontFamily: "'Orbitron', sans-serif",
      zIndex: "1",
      fontSize: '20px',
      padding: "10px",
      boxSizing: "border-box"
    });
    byId('session-header').appendChild(waitingForOthersDOM);


    const onlineUsers = document.createElement("div");
    onlineUsers.id = "onlineUsers";
    Object.assign(onlineUsers.style, {
      flexFlow: 'wrap',
      width: "100%",
      height: "35%",
      backgroundColor: "rgba(60, 60, 60, 1)",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-around",
      color: "white",
      fontFamily: "'Orbitron', sans-serif",
      zIndex: "1",
      fontSize: '20px',
      padding: "10px",
      boxSizing: "border-box"
    });
    byId('netHeader').appendChild(onlineUsers);
    app.net.fetchInfo('forestOfHollowBlood-free-for-all');
  }

  if(document.querySelector('.form-group')) document.querySelector('.form-group').style.display = 'none';
  // keep simple all networking code on top level
  // all job will be done with no account for now.
  addEventListener('net-ready', () => {
    document.querySelector('.form-group').style.display = 'none';
    byId("caller-title").innerHTML = `forestOfHollowBlood`;
    byId("sessionName").disabled = true;

    forestOfHollowBloodStartSceen.setWaitingList();
    // check game-play channel
    app.net.fetchInfo('forestOfHollowBlood-free-for-all');
  });

  addEventListener('connectionDestroyed', (e) => {
    if(byId(e.detail.connectionId)) {
      byId(`waiting-${e.detail.connectionId}`).remove();
    }
  });

  addEventListener("onConnectionCreated", (e) => {
    console.log('newconn : created', e.detail);
    let newPlayer = document.createElement('div');
    newPlayer.innerHTML = `Player: ${e.detail.connection.connectionId}`;
    newPlayer.id = `waiting-${e.detail.connection.connectionId}`;
    byId('waitingForOthersDOM').appendChild(newPlayer);

    let testParty = document.querySelectorAll('[id*="waiting-"]');
    console.info('Test number of players:', testParty);

    if(testParty.length >= forestOfHollowBloodStartSceen.MINIMUM_PLAYERS) {
      LS.set('player', {
        hero: heros[app.selectedHero].name,
        path: heros[app.selectedHero].path
      })
      location.assign('rpg-game.html');
    }
  })

  addEventListener('only-data-receive', (e) => {

    let t = JSON.parse(e.detail.data)

    if(t) {
      console.log(`<data-receive From ${e.detail.from} data:${t.selectHeroIndex}`);
      let name = handleHeroImage(t.selectHeroIndex);
      if(byId(`waiting-img-${e.detail.from.connectionId}`)) {
        byId(`waiting-img-${e.detail.from.connectionId}`).src = `./res/textures/rpg/hero-image/${name.toLowerCase()}.png`
      } else {
        let heroImage = document.createElement('img');
        heroImage.id = `waiting-img-${e.detail.from.connectionId}`;
        heroImage.width = '64';
        heroImage.height = '64';
        heroImage.src = `./res/textures/rpg/hero-image/${name.toLowerCase()}.png`
        byId(`waiting-${e.detail.from.connectionId}`).appendChild(heroImage);
      }
    }

  })

  addEventListener('AmmoReady', async () => {
    app.matrixSounds.play('music');
    heros = [
      {
        type: "Warrior",
        name: 'MariaSword',
        path: "res/meshes/glb/woman1.glb",
        desc: forestOfHollowBloodStartSceen.label.get.mariasword
      },
      {type: "Warrior", name: 'Slayzer', path: "res/meshes/glb/monster.glb", desc: forestOfHollowBloodStartSceen.label.get.slayzer},
      {type: "Warrior", name: 'Steelborn', path: "res/meshes/glb/bot.glb", desc: forestOfHollowBloodStartSceen.label.get.steelborn},
    ];

    forestOfHollowBloodStartSceen.heros = heros;

    // helper
    async function loadHeros() {
      for(var x = 0;x < heros.length;x++) {
        var glbFile01 = await fetch(heros[x].path).then(
          res => res.arrayBuffer().then(buf => uploadGLBModel(buf, app.device)));
        forestOfHollowBloodStartSceen.addGlbObjInctance({
          material: {type: 'standard', useTextureFromGlb: true},
          scale: [20, 20, 20],
          position: {x: 0 + x * 50, y: 0, z: -10},
          name: heros[x].name,
          texturesPaths: ['./res/meshes/glb/textures/mutant_origin.png'],
          raycast: {enabled: true, radius: 1},
          pointerEffect: {
            enabled: true,
            pointer: true,
            flameEffect: false,
            flameEmitter: true,
            circlePlane: true,
            circlePlaneTex: true,
            circlePlaneTexPath: './res/textures/rpg/symbols/star.png',
          }
        }, null, glbFile01);
      }

      setTimeout(() => {

        forestOfHollowBloodStartSceen.cameras.WASD.position = [0, 14, 52];
        app.cameras.WASD.pitch = -0.13;
        app.cameras.WASD.yaw = 0;
        app.mainRenderBundle.forEach((sceneObj) => {
          sceneObj.position.thrust = 1;
          if(sceneObj.effects.flameEmitter) sceneObj.effects.flameEmitter.recreateVertexDataRND(1)
        })

        for(var x = 0;x < heros.length;x++) {
          let hero0 = app.mainRenderBundle.filter((obj) => obj.name.indexOf(heros[x].name) != -1)
          app.heroByBody.push(hero0);
          if(x == 0) {
            hero0[0].effects.circlePlane.instanceTargets[0].color = [1, 0, 2, 1];
          }
          hero0[0].effects.flameEmitter.instanceTargets.forEach((p, i, array) => {
            array[i].color = [0, 0, 0, 0.7];
          })

          if(x == 2) {
            hero0.forEach((p, i, array) => {
              array[i].globalAmbient = [6, 6, 6];
            })
          }
        }
        app.lightContainer[0].position[2] = 10;
        app.lightContainer[0].position[1] = 50;
      }, 2500)
    }
    loadHeros();
    createHUDMEnu();
  })
  forestOfHollowBloodStartSceen.addLight();

  function createHUDMEnu() {
    document.body.style.cursor = "url('./res/icons/default.png') 0 0, auto";
    byId('canvas1').style.pointerEvents = 'none';

    const hud = document.createElement("div");
    hud.id = "hud-menu";
    Object.assign(hud.style, {
      position: "absolute",
      bottom: "0",
      left: "0",
      width: "100%",
      height: "35%",
      backgroundColor: "rgba(60, 60, 60, 1)",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-around",
      color: "white",
      fontFamily: "'Orbitron', sans-serif",
      zIndex: "1",
      fontSize: '20px',
      padding: "10px",
      boxSizing: "border-box"
    });

    const nextBtn = document.createElement("button");
    Object.assign(nextBtn.style, {
      // position: "absolute",
      width: "80px",
      textAlign: "center",
      color: "white",
      fontWeight: "bold",
      textShadow: "0 0 2px black",
      // color: '#eaff00',
      // background: '#aca8a8',
      height: "40px",
      fontSize: '16px',
    });
    nextBtn.classList.add('buttonMatrix');
    nextBtn.innerHTML = `
      <div class="button-outer">
        <div class="button-inner">
          <span id='nextBtn'>NEXT</span>
        </div>
      </div>
    `;
    nextBtn.addEventListener('click', () => {
      if(app.selectedHero >= app.heroByBody.length - 1 || app.lock == true) {
        console.log('NEXTBLOCKED ', app.selectedHero)
        return;
      }
      app.lock = true;
      app.selectedHero++;
      console.log('app.selectedHero::: ', app.selectedHero)
      // Fix on remote 
      if(app.net.session) {
        determinateSelection();
      }

      app.heroByBody.forEach((sceneObj, indexRoot) => {
        sceneObj.forEach((heroBodie) => {
          heroBodie.position.translateByX(-50 * app.selectedHero + indexRoot * 50)
          heroBodie.position.onTargetPositionReach = () => {
            app.lock = false;
          }
          // custom adapt 
          if(indexRoot == 0) {
            heroBodie.globalAmbient = [1, 1, 1];
          } else if(indexRoot == 1) {
            heroBodie.globalAmbient = [2, 2.5, 2];
          } else if(indexRoot == 2) {
            heroBodie.globalAmbient = [4, 4, 4];
          }

          if(heroBodie.effects.circlePlane) {
            if(indexRoot == app.selectedHero) {
              heroBodie.effects.circlePlane.instanceTargets[0].color = [1, 0, 2, 1];
            } else {
              heroBodie.effects.circlePlane.instanceTargets[0].color = [0.6, 0.8, 1, 0.4];
            }
          }
        })
      })
      updateDesc();
    });


    const desc = document.createElement("div");
    desc.id = 'desc';
    Object.assign(desc.style, {
      display: 'flex',
      flexDirection: 'column',
      width: "300px",
      textAlign: "center",
      color: 'c4deff',
      fontWeight: "bold",
      textShadow: "0 0 5px black",
    });
    desc.textContent = "HERO INFO";

    const previusBtn = document.createElement("button");
    Object.assign(previusBtn.style, {
      width: "80px",
      textAlign: "center",
      color: "white",
      fontWeight: "bold",
      textShadow: "0 0 2px black",
      height: "40px",
      fontSize: '16px'
    });

    previusBtn.classList.add('buttonMatrix');
    previusBtn.innerHTML = `
      <div class="button-outer">
        <div class="button-inner">
          <span id='previusBtnText'>BACK</span>
        </div>
      </div>
    `;

    previusBtn.addEventListener('click', () => {
      console.log('TEST previusBtn forestOfHollowBloodStartSceen.selectedHero', app.selectedHero)
      if(app.selectedHero < 1 || app.lock == true) {
        console.log('BLOCKED ', app.selectedHero)
        return;
      }
      app.lock = true;
      app.selectedHero--;

      if(app.net.session) {
        if(app.net.session.connection != null) app.net.sendOnlyData({
          selectHeroIndex: app.selectedHero
        });
        // fix for local
        determinateSelection();
      }

      app.heroByBody.forEach((sceneObj, indexRoot) => {
        sceneObj.forEach((heroBodie) => {
          heroBodie.position.translateByX(-app.selectedHero * 50 + indexRoot * 50)
          heroBodie.position.onTargetPositionReach = () => {
            app.lock = false;
          };

          if(heroBodie.effects.circlePlane) {
            if(indexRoot == app.selectedHero) {
              heroBodie.effects.circlePlane.instanceTargets[0].color = [1, 0, 2, 1];
            } else {
              heroBodie.effects.circlePlane.instanceTargets[0].color = [0.6, 0.8, 1, 0.4];
            }
          }

        })
      })
      updateDesc()
    });


    function updateDesc() {
      byId('desc').innerHTML = `
        <div style='height:130px;'> ${app.heros[(app.selectedHero)].desc}</div>
        `;
      let C = HERO_ARCHETYPES[app.heros[(app.selectedHero)].type];

      for(let key in C) {
        byId('desc').innerHTML += ` 
         <div style='font-size: 15px;display: inline-flex;justify-content:space-between'>
           <span style="color:#00e2ff"> ${key} </span> : <span style="color:red">${C[key]} </span>
          </div>
        `;
      }
    }

    const startBtn = document.createElement("button");
    Object.assign(startBtn.style, {
      position: "absolute",
      bottom: '20px',
      right: '120px',
      width: "250px",
      height: "60px",
      textAlign: "center",
      color: "white",
      fontWeight: "bold",
      textShadow: "0 0 2px black",
      color: '#ffffffff',
      background: '#000000ff',
      fontSize: '16px',
      cursor: 'url(./res/icons/default.png) 0 0, auto'
    });
    startBtn.classList.add('buttonMatrix');

    startBtn.innerHTML = `
      <div class="button-outer">
        <div class="button-inner">
          <span id='startBtnText'>PLAY</span>
        </div>
      </div>
    `;
    startBtn.addEventListener('click', (e) => {
      // console.log('START', app.selectedHero)
      if(app.net.connection == null) {
        console.log('app.net.connection is null let join gameplay sesion... Wait list.', app.selectedHero)
        byId('join-btn').click();
        byId("startBtnText").innerHTML = 'Waiting for others...';
        e.target.disabled = true;
        return;
      } else {
        console.log('app.net.connection is not null...', app.selectedHero)
        return;
      }
    });

    hud.appendChild(previusBtn);
    hud.appendChild(desc);
    hud.appendChild(nextBtn);
    hud.appendChild(startBtn);
    document.body.appendChild(hud);
    updateDesc();
  }
})
window.app = forestOfHollowBloodStartSceen;