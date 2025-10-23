import {uploadGLBModel} from "../../../src/engine/loaders/webgpu-gltf.js";
import {byId, LS} from "../../../src/engine/utils.js";
import MatrixEngineWGPU from "../../../src/world.js";
import {HERO_ARCHETYPES} from "./hero.js";

/**
 * @Note
 * “Character and animation assets from Mixamo,
 * used under Adobe’s royalty‑free license. 
 * Redistribution of raw assets is not permitted.”
 **/
let mysticoreStartSceen = new MatrixEngineWGPU({
  useSingleRenderPass: true,
  canvasSize: 'fullscreen',
  mainCameraParams: {
    type: 'WASD',
    responseCoef: 1000
  },
  clearColor: {r: 0, b: 0.122, g: 0.122, a: 1}
}, (mysticoreStartSceen) => {

  mysticoreStartSceen.heroByBody = [];
  mysticoreStartSceen.selectedHero = 0;
  mysticoreStartSceen.lock = false;

  let heros = null;
  addEventListener('AmmoReady', async () => {

    heros = [
      {
        type: "Warrior",
        name: 'MariaSword',
        path: "res/meshes/glb/woman1.glb",
        desc: mysticoreStartSceen.label.get.mariasword
      },
      {type: "Warrior", name: 'Slayzer', path: "res/meshes/glb/monster.glb", desc: mysticoreStartSceen.label.get.slayzer},
      {type: "Warrior", name: 'Steelborn', path: "res/meshes/glb/bot.glb", desc: mysticoreStartSceen.label.get.steelborn},
    ];

    mysticoreStartSceen.heros = heros;

    // helper
    async function loadHeros() {
      for(var x = 0;x < heros.length;x++) {
        var glbFile01 = await fetch(heros[x].path).then(
          res => res.arrayBuffer().then(buf => uploadGLBModel(buf, app.device)));
        mysticoreStartSceen.addGlbObjInctance({
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

        mysticoreStartSceen.cameras.WASD.position = [0, 14, 52];
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

          if (x==2) {
            console.log('TEST------')
            hero0.forEach((p , i , array) => {
              array[i].globalAmbient = [6,6,6];
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
  mysticoreStartSceen.addLight();


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
      borderRadius: '120px',
      cursor: 'pointer'
    });
    nextBtn.textContent = "NEXT";
    nextBtn.addEventListener('click', () => {
      if(app.selectedHero >= app.heroByBody.length - 1 || app.lock == true) {
        console.log('NEXTBLOCKED ', app.selectedHero)
        return;
      }
      app.lock = true;
      app.selectedHero++;

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




      updateDesc()

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
      borderRadius: '120px',
      cursor: 'pointer'
    });
    previusBtn.textContent = "BACK";

    previusBtn.addEventListener('click', () => {
      console.log('TEST previusBtn mysticoreStartSceen.selectedHero', app.selectedHero)
      if(app.selectedHero < 1 || app.lock == true) {
        console.log('BLOCKED ', app.selectedHero)
        return;
      }
      app.lock = true;
      app.selectedHero--;
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



    //
    const startBtn = document.createElement("button");
    Object.assign(startBtn.style, {
      position: "absolute",
      bottom: '70px',
      right: '120px',
      width: "200px",
      textAlign: "center",
      color: "white",
      fontWeight: "bold",
      textShadow: "0 0 2px black",
      color: '#ffffffff',
      background: '#000000ff',
      height: "40px",
      fontSize: '16px',
      borderRadius: '120px',
      cursor: 'pointer'
    });
    startBtn.textContent = "start";
    startBtn.addEventListener('click', () => {
      console.log('START', app.selectedHero)
      LS.set('player', {
        hero: heros[app.selectedHero].name,
        path: heros[app.selectedHero].path
      })

      location.assign('rpg-game.html');
    });

    hud.appendChild(previusBtn);
    hud.appendChild(desc);
    hud.appendChild(nextBtn);
    hud.appendChild(startBtn);
    document.body.appendChild(hud);
    updateDesc();
  }
})
window.app = mysticoreStartSceen;