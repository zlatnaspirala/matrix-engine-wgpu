import {uploadGLBModel} from "../../../src/engine/loaders/webgpu-gltf.js";
import {MatrixStream} from "../../../src/engine/networking/net.js";
import {byId, isOdd, LS, SS, mb, typeText} from "../../../src/engine/utils.js";
import MatrixEngineWGPU from "../../../src/world.js";
import {HERO_ARCHETYPES} from "./hero.js";

/**
 * @name forestOfHollowBloodStartSceen
 * @Note
 * “Character and animation assets from Mixamo,
 * used under Adobe’s royalty‑free license. 
 * Redistribution of raw assets is not permitted.”
 * 
 * @Note 
 * This is startup main instance for menu screen adn for the game.
 * All @zlatnaspirala software use networking based
 * on openvidu/kurento media server(webRTC).
 * Node.js used for middleware.
 * Server Events API also used for helping in creation of
 * matching/waiting list players or get status of public channel
 * (game-play channel).
 * 
 * @note
 * Only last non selected hero player will get 
 * first free hero in selection action next/back.
 * For now. Next better varian can be timer solution.
 **/
let forestOfHollowBloodStartSceen = new MatrixEngineWGPU({
  useSingleRenderPass: true,
  canvasSize: {w: window.visualViewport.width, h: window.visualViewport.height + 100},//'fullscreen',
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
    // func exist in case of changinf hero names...
    let name = 'no-name';
    if(selectHeroIndex == 0) {
      name = 'mariasword';
    } else if(selectHeroIndex == 1) {
      name = 'slayzer';
    } else if(selectHeroIndex == 2) {
      name = 'slayzer';
    } else if(selectHeroIndex == 3) {
      name = 'warrok';
    } else if(selectHeroIndex == 4) {
      name = 'skeletonz';
    }
    return name;
  }

  function checkHeroStatus() {
    // app.net.session.remoteConnections.forEach((remoteConn) => {
    //   console.log(" test remote conn ", remoteConn.connectionId)
    // });
    let isUsed = false;
    document.querySelectorAll('[data-hero-index]').forEach((elem) => {
      let index = parseInt(elem.getAttribute('data-hero-index'));
      console.log(app.selectedHero, ' app.selectedHero VS Index:', index);
      if(index == app.selectedHero) {
        isUsed = true;
        console.log('Hero element: Index: TRUE !!!!!', index);
      }
    });
    return isUsed;
  }

  function determinateTeam() {
    console.log('check remote conn.app.net.session.remoteConnections.size..', app.net.session.remoteConnections.size);
    if(app.net.session.remoteConnections.size == 0) {
      // Rule - even -> south team odd -> north team
      return "south";
    } else {
      if(isOdd(app.net.session.remoteConnections.size) == true) {
        return "north";
      } else {
        return "south";
      }
    }
  }

  function determinateSelection() {

    if(checkHeroStatus() == true) {
      console.log("hero used keep graphics no send ")
      return;
    }

    if(app.net.session.connection != null) {
      console.log("Test team data moment", byId(`waiting-${app.net.session.connection.connectionId}`).getAttribute('data-hero-team'))
      let testDom = byId(`waiting-${app.net.session.connection.connectionId}`).getAttribute('data-hero-team');
      if(typeof testDom != 'string') {
        console.low('Potencial error not handled....')
      }
      app.net.sendOnlyData({
        type: "selectHeroIndex",
        selectHeroIndex: app.selectedHero,
        team: testDom
      });
    }
    // fix for local
    if(byId(`waithero-img-${app.net.session.connection.connectionId}`)) {
      let heroImage = byId(`waithero-img-${app.net.session.connection.connectionId}`);
      heroImage.src =
        `./res/textures/rpg/hero-image/${handleHeroImage(app.selectedHero)}.png`;
      heroImage.setAttribute('data-hero-index', app.selectedHero);
    } else {
      let heroImage = document.createElement('img');
      heroImage.setAttribute('data-hero-index', app.selectedHero);
      heroImage.id = `waithero-img-${app.net.session.connection.connectionId}`;
      heroImage.width = '64';
      heroImage.height = '64';
      heroImage.src = `./res/textures/rpg/hero-image/${handleHeroImage(app.selectedHero)}.png`
      byId(`waiting-${app.net.session.connection.connectionId}`).appendChild(heroImage);
    }
    // Only last non selected hero player will get 
    // first free hero in selection action next/back.
    // For now.
    if(isAllSelected() == true) {
      forestOfHollowBloodStartSceen.gotoGamePlay();
    }
  }

  function isAllSelected() {
    let sumParty = document.querySelectorAll('[id*="waiting-"]');
    let testSelection = document.querySelectorAll('[id*="waithero-img-"]');
    console.info(testSelection, ' testSelection vs Number of players:', sumParty);
    if(sumParty.length == forestOfHollowBloodStartSceen.MINIMUM_PLAYERS) {
      // good all are still here
      if(testSelection.length == forestOfHollowBloodStartSceen.MINIMUM_PLAYERS) {
        // good all selected hero !PLAY!
        return true;
      } else {
        mb.error(`No selection hero for all players...`);
        return false;
      }
    } else {
      mb.error(`No enough players...`);
      return false;
    }
  }

  forestOfHollowBloodStartSceen.gotoGamePlay = (preventEmit) => {
    // check again ! good all selected hero !PLAY!
    console.log('...', byId(`waiting-${app.net.session.connection.connectionId}`));
    LS.set('player', {
      mesh: heros[app.selectedHero].meshName,
      hero: heros[app.selectedHero].name,
      path: heros[app.selectedHero].path,
      archetypes: [heros[app.selectedHero].type],
      team: byId(`waiting-${app.net.session.connection.connectionId}`).getAttribute('data-hero-team'),
      data: Date.now()
    })
    SS.set('player', {
      mesh: heros[app.selectedHero].meshName,
      hero: heros[app.selectedHero].name,
      path: heros[app.selectedHero].path,
      archetypes: [heros[app.selectedHero].type],
      team: byId(`waiting-${app.net.session.connection.connectionId}`).getAttribute('data-hero-team'),
      data: Date.now()
    })

    if (typeof preventEmit === 'undefined') forestOfHollowBloodStartSceen.net.sendOnlyData({
      type: 'start'
    })

    location.assign('rpg-game.html');
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

  forestOfHollowBloodStartSceen.MINIMUM_PLAYERS = 2;

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
    byId('matrix-net').style.opacity = '0.75';
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
    if(app.net.session.connection.connectionId == e.detail.connection.connectionId) {
      console.log('newconn : created [LOCAL] determinate team');
      let team = determinateTeam();
      newPlayer.setAttribute('data-hero-team', team);
      newPlayer.innerHTML = `<div id="${e.detail.connection.connectionId}-title" >Player:${e.detail.connection.connectionId} Team:${team}</div>`;
      setTimeout(() => app.net.sendOnlyData({type: "team-notify", team: team}), 1500);
    } else {
      newPlayer.innerHTML = `<div id="${e.detail.connection.connectionId}-title" >Player:${e.detail.connection.connectionId}</div>`;
    }
    newPlayer.id = `waiting-${e.detail.connection.connectionId}`;
    byId('waitingForOthersDOM').appendChild(newPlayer);
    let testParty = document.querySelectorAll('[id*="waiting-"]');
    console.info('Test number of players:', testParty);
    if(testParty.length == forestOfHollowBloodStartSceen.MINIMUM_PLAYERS) {
      // when all choose hero goto play
      mb.success(`Consensus is reached. Party${forestOfHollowBloodStartSceen.MINIMUM_PLAYERS}
          When all player select hero gameplay starts.
        `);
    } else if(testParty.length < forestOfHollowBloodStartSceen.MINIMUM_PLAYERS) {
      mb.success(`Player ${e.detail.connection.connectionId} joined party.Select your hero and wait for other...`);
    } else if(testParty.length > forestOfHollowBloodStartSceen.MINIMUM_PLAYERS) {
      if(e.detail.connection.connectionId == app.net.session.connection.connectionId) {
        mb.success(`Max players is reached.Please wait for next party...`);
      }
    }
  })

  addEventListener('only-data-receive', (e) => {
    let t = JSON.parse(e.detail.data);
    if(t) {
      if(t.type == 'selectHeroIndex') {
        console.log(`<data-receive From ${e.detail.from} data:${t.selectHeroIndex}`);
        let name = handleHeroImage(t.selectHeroIndex);
        let heroImage = byId(`waithero-img-${e.detail.from.connectionId}`);
        if(heroImage) {
          heroImage.src = `./res/textures/rpg/hero-image/${name.toLowerCase()}.png`;
          heroImage.setAttribute('data-hero-index', t.selectHeroIndex);
        } else {
          let heroImage = document.createElement('img');
          heroImage.id = `waithero-img-${e.detail.from.connectionId}`;
          heroImage.width = '64'; heroImage.height = '64';
          heroImage.src = `./res/textures/rpg/hero-image/${name.toLowerCase()}.png`;
          heroImage.setAttribute('data-hero-index', t.selectHeroIndex);
          byId(`waiting-${e.detail.from.connectionId}`).appendChild(heroImage);
          // also add team for initial user problem case...
          if(t.team) {
            byId(`${e.detail.from.connectionId}-title`).innerHTML = `Player:${e.detail.from.connectionId} Team:${t.team}`;
          }
        }
      } else if(t.type == 'team-notify') {
        console.log(`<data-receive From ${e.detail.from.connectionId} team:${t.team}  ${byId(`waiting-${e.detail.from.connectionId}`)}`);
        byId(`${e.detail.from.connectionId}-title`).innerHTML = `Player:${e.detail.from.connectionId} Team:${t.team}`;
      } else if(t.type == 'start') {
        // HERE_
        forestOfHollowBloodStartSceen.gotoGamePlay("no emit");
      }
    }
  })

  addEventListener('AmmoReady', async () => {
    app.matrixSounds.play('music');
    heros = [
      {type: "Warrior", name: 'MariaSword', path: "res/meshes/glb/woman1.glb", desc: forestOfHollowBloodStartSceen.label.get.mariasword},
      {type: "Warrior", name: 'Slayzer', path: "res/meshes/glb/monster.glb", desc: forestOfHollowBloodStartSceen.label.get.slayzer},
      {type: "Tank", name: 'Steelborn', path: "res/meshes/glb/bot.glb", desc: forestOfHollowBloodStartSceen.label.get.steelborn},
      {type: "Mage", name: 'Warrok', path: "res/meshes/glb/warrok.glb", desc: forestOfHollowBloodStartSceen.label.get.warrok},
      {type: "Necromancer", name: 'Skeletonz', path: "res/meshes/glb/skeletonz.glb", desc: forestOfHollowBloodStartSceen.label.get.skeletonz},
      {type: "Assassin", name: 'Erika', path: "res/meshes/glb/erika.glb", desc: forestOfHollowBloodStartSceen.label.get.skeletonz},
    ];

    forestOfHollowBloodStartSceen.heros = heros;

    // helper
    async function loadHeros() {
      for(var x = 0;x < heros.length;x++) {
        var glbFile01 = await fetch(heros[x].path).then(
          res => res.arrayBuffer().then(buf => uploadGLBModel(buf, app.device)));
        forestOfHollowBloodStartSceen.addGlbObjInctance({
          material: (x == 2 ? {type: 'power', useTextureFromGlb: true} : {type: 'standard', useTextureFromGlb: true}),
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
          heros[x].meshName = hero0[0].name;
          if(x == 0) {
            hero0[0].effects.circlePlane.instanceTargets[0].color = [1, 0, 2, 1];
          }
          hero0[0].effects.flameEmitter.instanceTargets.forEach((p, i, array) => {
            array[i].color = [0, 1, 0, 0.7];
          })

          if(x == 2) {
            hero0.forEach((p, i, array) => {
              array[i].globalAmbient = [11, 11, 1];
            })
          }
          if(x == 3 || x == 5) {
            hero0.forEach((p, i, array) => {
              array[i].globalAmbient = [10, 10, 10];
              array[i].effects.flameEmitter.smoothFlickeringScale = 0.005;
            })
          }
          if(x == 4) {
            hero0.forEach((p, i, array) => {
              array[i].globalAmbient = [6, 6, 8];
            })
          }
        }
        app.lightContainer[0].position[2] = 10;
        app.lightContainer[0].position[1] = 50;
        app.lightContainer[0].intensity = 1.4;
      }, 3000);
    }
    loadHeros();
    createHUDMEnu();
  })
  forestOfHollowBloodStartSceen.addLight();

  function createHUDMEnu() {
    document.body.style.cursor = "url('./res/icons/default.png') 0 0, auto";
    document.addEventListener("contextmenu", event => event.preventDefault());
    byId('canvas1').style.pointerEvents = 'none';

    const hud = document.createElement("div");
    hud.id = "hud-menu";
    Object.assign(hud.style, {
      position: "fixed",
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
      if(app.net.session) {determinateSelection()}

      app.heroByBody.forEach((sceneObj, indexRoot) => {
        sceneObj.forEach((heroBodie) => {
          heroBodie.position.translateByX(-50 * app.selectedHero + indexRoot * 50)
          heroBodie.position.onTargetPositionReach = () => {
            app.lock = false;
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
        // console.log('BLOCKED', app.selectedHero)
        return;
      }
      app.lock = true;
      app.selectedHero--;

      if(app.net.session) {
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
           <span style="color:#00e2ff"> ${key} </span> : <span style="color:#02e2ff">${C[key]} </span>
          </div>
        `;
      }
    }

    const startBtn = document.createElement("button");
    Object.assign(startBtn.style, {
      position: "fixed",
      bottom: '40px',
      right: '120px',
      width: "250px",
      height: "54px",
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
        console.log('nothing...', app.selectedHero)
        return;
      }
    });

    //about
    forestOfHollowBloodStartSceen.showAbout = () => {
      byId('helpBox').style.display = 'block';
      typeText('helpBox', app.label.get.aboutRPG, 10);
    };

    var helpBox = document.createElement('div')
    helpBox.id = 'helpBox';
    helpBox.style.position = 'fixed';
    helpBox.style.right = '20%';
    helpBox.style.display = 'none';
    helpBox.style.zIndex = '2';
    helpBox.style.top = '15%';
    helpBox.style.width = '60%';
    helpBox.style.height = '50%';
    helpBox.style.fontSize = '100%';
    helpBox.classList.add('btn');
    helpBox.addEventListener('click', () => {
      byId('helpBox').style.display = 'none';
    });
    document.body.appendChild(helpBox);

    const aboutBtn = document.createElement("button");
    Object.assign(aboutBtn.style, {
      position: "fixed",
      bottom: '40px',
      left: '120px',
      width: "150px",
      height: "54px",
      textAlign: "center",
      color: "white",
      fontWeight: "bold",
      textShadow: "0 0 2px black",
      color: '#ffffffff',
      background: '#000000ff',
      fontSize: '16px',
      cursor: 'url(./res/icons/default.png) 0 0, auto',
      pointerEvents: 'auto'
    });
    aboutBtn.classList.add('buttonMatrix');

    aboutBtn.innerHTML = `
      <div class="button-outer">
        <div class="button-inner">
          <span data-label='aboutword'>ABOUT</span>
        </div>
      </div>
    `;
    aboutBtn.addEventListener('click', (e) => app.showAbout());
    hud.appendChild(aboutBtn);

    const loader = document.createElement("div");
    Object.assign(loader.style, {
      position: "fixed",
      display: 'flex',
      bottom: '0',
      left: '0',
      width: "100vw",
      height: "100vh",
      textAlign: "center",
      color: "white",
      zIndex: 10,
      fontWeight: "bold",
      textShadow: "0 0 2px black",
      color: '#ffffffff',
      background: '#000000ff',
      fontSize: '16px',
      cursor: 'url(./res/icons/default.png) 0 0, auto',
      pointerEvents: 'auto'
    });
    // loader.classList.add('buttonMatrix');
    loader.innerHTML = `
      <div class="loader">
        <div class="progress-container">
          <div class="progress-bar" id="progressBar"></div>
          </div>
        <div class="counter" id="counter">0%</div>
      </div>
    `;
    loader.addEventListener('click', (e) => {
      app.matrixSounds.play('music');
    });
    hud.appendChild(loader);
    // console.log('help dom, ', byId('helpBox'))

    let progress = 0;
    let bar = null;
    let counter = null;

    function fakeProgress() {
      if(progress < 100) {
        // Random step to look "non-linear"
        progress += Math.random() * 5;
        if(progress > 100) progress = 100;
        bar.style.width = progress + '%';
        counter.textContent = Math.floor(progress) + '%';
        setTimeout(fakeProgress, 80 + Math.random() * 150);
      } else {
        counter.textContent = "Let the game begin!";
        bar.style.boxShadow = "0 0 30px #00ff99";

        setTimeout(() => {
          loader.remove();
        }, 250)
      }
    }

    setTimeout(() => {
      bar = document.getElementById('progressBar');
      counter = document.getElementById('counter');
      fakeProgress()
    }, 300);

    //
    hud.appendChild(previusBtn);
    hud.appendChild(desc);
    hud.appendChild(nextBtn);
    hud.appendChild(startBtn);
    document.body.appendChild(hud);
    updateDesc();
  }
})
window.app = forestOfHollowBloodStartSceen;