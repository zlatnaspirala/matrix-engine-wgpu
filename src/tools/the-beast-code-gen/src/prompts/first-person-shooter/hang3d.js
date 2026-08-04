export const FPS = `
import {
  MatrixEngineWGPU, downloadMeshes, addRaycastsAABBListener,
  byId, isMobile, CollisionSystem, MapCreator, ProjectileSystem, MobileDOM,
  uploadGLBModel, Player, randomIntFromTo, vecOf
} from "matrix-engine-wgpu";

export function setupCanvasFilters(canvasId) {
  let canvas = document.getElementById(canvasId);
  if(canvas == null) {
    canvas = document.getElementsByTagName('canvas')[0];
  }

  const filterState = {
    blur: "0px",
    grayscale: "0%",
    brightness: "100%",
    contrast: "100%",
    saturate: "100%",
    sepia: "0%",
    invert: "0%",
    hueRotate: "0deg"
  };

  function updateFilter() {
    const filterString = \`
      blur(\${filterState.blur}) 
      grayscale(\${filterState.grayscale}) 
      brightness(\${filterState.brightness}) 
      contrast(\${filterState.contrast}) 
      saturate(\${filterState.saturate}) 
      sepia(\${filterState.sepia}) 
      invert(\${filterState.invert}) 
      hue-rotate(\${filterState.hueRotate})
    \`.trim();
    canvas.style.filter = filterString;
  }

  const bindings = {
    blurControl: "blur",
    grayscaleControl: "grayscale",
    brightnessControl: "brightness",
    contrastControl: "contrast",
    saturateControl: "saturate",
    sepiaControl: "sepia",
    invertControl: "invert",
    hueControl: "hueRotate"
  };

  Object.entries(bindings).forEach(([selectId, key]) => {
    const el = document.getElementById(selectId);
    el.addEventListener("change", (e) => {
      filterState[key] = e.target.value;
      updateFilter();
    });
  });
  updateFilter();
}

export let settingsBox = \`
<div style="">
  <span style="font-size:170%" data-label="settings"></span>
  <div style="justify-items: flex-end;margin:20px;" >
    <div>
      <span data-label="sounds"></span>
      <label class="switch">
        <input id="settingsAudios" type="checkbox">
        <span class="sliderSwitch round"></span>
      </label>
    </div>
    <div>
      <span data-label="lightMove"></span>
      <label class="switch">
        <input id="settingsLight" type="checkbox">
        <span class="sliderSwitch round"></span>
      </label>
    </div>

      <div>
        <label>Blur:</label>
        <select id="blurControl">
          <option value="0px">Blur: 0</option>
          <option value="1px">Blur: 1</option>
          <option value="2px">Blur: 2</option>
          <option value="3px">Blur: 3</option>
        </select>
      </div>

      <div>
      <label>Grayscale:</label>
      <select id="grayscaleControl">
        <option value="0%">Grayscale: 0%</option>
        <option value="25%">Grayscale: 25%</option>
        <option value="50%">Grayscale: 50%</option>
        <option value="75%">Grayscale: 75%</option>
        <option value="100%">Grayscale: 100%</option>
      </select>
      </div>
      
      <div>
       <label>Brightness:</label>
      <select id="brightnessControl">
        <option value="100%">100%</option>
        <option value="150%">150%</option>
        <option value="200%">200%</option>
      </select>
      </div>
      
      <div>
      <label>Contrast:</label>
      <select id="contrastControl">
        <option value="100%">100%</option>
        <option value="150%">150%</option>
        <option value="200%">200%</option>
      </select>
      </div>
      
      <div>
      <label>Saturate:</label>
      <select id="saturateControl">
        <option value="100%">100%</option>
        <option value="150%">150%</option>
        <option value="200%">200%</option>
      </select>
     </div>
      
      <div>
      <label>Sepia:</label>
      <select id="sepiaControl">
        <option value="0%">0%</option>
        <option value="50%">50%</option>
        <option value="100%">100%</option>
      </select>
     </div>
      
      <div>
      <label>Invert:</label>
      <select id="invertControl">
        <option value="0%">0%</option>
        <option value="50%">50%</option>
        <option value="100%">100%</option>
      </select>
     </div>
      
      <div>
      <label>Hue Rotate:</label>
      <select id="hueControl">
        <option value="0deg">0°</option>
        <option value="90deg">90°</option>
        <option value="180deg">180°</option>
        <option value="270deg">270°</option>
      </select>
      </div>
 
    <div style="margin-top:20px;">
      <button class="btn" onclick="document.getElementById('messageBox').style.display = 'none'">
        <span data-label="hide"></span>
      </button>
    </div>

    <img src="res/icons/512.png" style="position:absolute;left:10px;top:5%;width:300px;z-index:-1;"/>
  </div>
</div>\`;

export let welcomeBoxHTML =
  \`<span class="fancy-title" data-label="welcomeMsg"></span>
     <a href="https://github.com/zlatnaspirala/matrix-engine-wgpu">zlatnaspirala/matrix-engine-wgpu</a><br><br>
     <div style="display:flex;flex-direction:column;align-items: center;margin:20px;padding: 10px;">
       <span style="width:100%" data-label="choosename"></span>
       <input id='nickId' style="text-align: center;height:50px;font-size:100%;width:250px" class="fancy-label" type="text" value="" />
      </div>
     <button id="startFromWelcome" class="btn" ><span style="font-size:30px;margin:15px;padding:10px" data-label="startGame"></span></button> <br>
     <div><span class="fancy-label" data-label="changeLang"></span></div> 
     <button class="btn" onclick="
      app.label.loadMultilang('en').then(r => {
        app.label.get = r;
        app.label.update()
      });
     " ><span data-label="english"></span></button> 
     <button class="btn" onclick="app.label.loadMultilang('sr').then(r => {
        app.label.get = r
        app.label.update() })" ><span data-label="serbian"></span></button>\`;

export class hang3dUI {
  constructor() {
    var messageBox = document.createElement('div')
    messageBox.id = 'messageBox';
    messageBox.classList.add('msg-box')
    // messageBox.innerHTML = welcomeBoxHTML;
    messageBox.style.display = 'none';
    messageBox.style.zIndex = 10000;
    messageBox.style.top = isMobile() ? '0' : '0';
    messageBox.style.width = isMobile() ? '100%' : '82%';
    messageBox.style.height = isMobile() ? '100%' : '100%';
    messageBox.style.background = 'black';
    messageBox.innerHTML = settingsBox;
    document.body.appendChild(messageBox);
    var settings = document.createElement('div')
    settings.id = 'settings';
    Object.assign(settings.style, {
      position: 'fixed',
      top: '2%',
      right: '5%',
      background: \`rgba(0,0,0,1)\`,
      border: \`2px solid rgba(255,255,255,1)\`,
      borderRadius: \`10px\`,
      zIndex: '9999',
      overflow: 'hidden'
    });
    settings.classList.add('btn');
    settings.innerHTML = \`<span data-label="settings"></span>\`;
    document.body.appendChild(settings);
    
    if (localStorage.getItem('settingsAudios') === 'on') {
      byId('settingsAudios').click();
      byId('settingsAudios').value = 'on';
      byId('settingsAudios').checked = true;
      // app.matrixSounds.play('music');
    } else if (localStorage.getItem('settingsAudios') === 'off') { 
      byId('settingsAudios').value = 'off';
      byId('settingsAudios').checked = false;
    } else {
      byId('settingsAudios').click();
      byId('settingsAudios').value = 'on';
      byId('settingsAudios').checked = true;
      // app.matrixSounds.play('music');
      localStorage.setItem('settingsAudios', 'on');
    }
    byId('settingsAudios').addEventListener('change', (e) => {
      console.log("byId('settingsAudios')", byId('settingsAudios'))
      if(e.target.checked == true) {
        app.matrixSounds.unmuteAll();
        // app.matrixSounds.play('music');
        localStorage.setItem('settingsAudios', 'on');
      } else {
        app.matrixSounds.muteAll();
        localStorage.setItem('settingsAudios', 'off');
      }
    });
    byId('settingsLight').addEventListener('change', (e) => {
      if(e.target.checked == true) {
        const light = app.lightContainer[0];
        // light.setPosition(0, 60, 0);
        light.setIntensity(10);
        light.setColor([100, 1, 100])
      } else {
        const light = app.lightContainer[0];
        // light.setPosition(0, 60, 0);
        light.setIntensity(10);
        light.setColor([1, 2, 1])
      }
    });
    setupCanvasFilters();

    settings.addEventListener('click', () => {
      if(messageBox.style.display === 'none') {
        messageBox.style.display = 'block';
      } else {
        messageBox.style.display = 'none';
      }
      dispatchEvent(new CustomEvent('updateLang', {}))

    });
    dispatchEvent(new CustomEvent('updateLang', {}))
  }
}

export const mapParams = {
  zombie: {
    startUpPositions: {
      south: [-20, 0.2, 20],
      p1: [-8.35, 0.2, 4.56],
      p2: [8.35, 0.2, 4.56],
      p3: [4.35, 0.2, 4.56],
      north: [20, 0.2, -20]
    },
  },
  collectItems: [
    {id: '1', position: {x: 2.5, y: 0.4, z: 10}, radius: 0.4, type: 'ammo', amount: '100', scale : [0.2,0.2,0.2], tex : './res/textures/metal/metal1.webp'},
    {id: '2', position: {x: -4, y: 0.4, z: -10}, radius: 0.4, type: 'energy', amount: '50', scale : [0.8,0.8,0.8], tex : './res/textures/blankgray2.webp'},
    {id: '3', position: {x: -60.56, y: -1.799, z: -0.045}, radius: 0.4, type: 'energy', amount: '50', scale : [1,1.5,1], tex : './res/textures/blankgray2.webp'},
    {id: '4', position: {x: -44.79292678833008, y: 2.3, z: -0.29}, radius: 1, type: 'armor', amount: '50', scale : [1,1,1], tex : './res/meshes/obj/armor.webp'},
  ]
}

const DEG2RAD = Math.PI / 180;
const RAD2DEG = 180 / Math.PI;

const startTime = performance.now();

export class Zombi {

  zombieAnims = {
    dead: null,
    walk: null,
    nono: null,
    attack: null,
    idle: null
  }

  creepHPReset = 20;
  creepFocusAttackOn = null;
  zombieSpeedWalk = 0.003;

  hp = this.creepHPReset;
  isDead = false;
  attackDamage = 32;
  exposeDamage = false;
  attackCooldownTicks = 100;
  _attackCooldownLeft = 0;

  aiConfig = {
    detectRangeFront: 25,
    detectRangeBack: 10,
    attackRange: 1.6,
    rotationStepDeg: 35,
    stepDistance: 0.4
  }

  zombiDieEvent = new CustomEvent('zombie-die', {detail: null})
  aiState = 'attack'; // idle | chase | attack | dead

  cam = app.getCamera();

  constructor(o, archetypes = ["zombie"], group = "enemy", team) {
    this.name = o.name;
    this.core = o.core;
    this.group = group;
    this.team = team;
    this.archetype = archetypes[0];
    this.loadCreep(o);
    return this;
  }

  loadCreep = async (o) => {
    this.o = o;
    try {
      this.core.addGlbObjInctance({
        material: {type: 'standard', useTextureFromGlb: (this.o.name.includes("zombi-cap") === true ? false : true), shared: true},
        shadowsCast: false,
        scale: [0.8, 0.8, 0.8],
        position: o.position,
        name: o.name,
        texturesPaths: (this.o.name.includes("zombi-cap") === true ? ['./res/meshes/glb/zombi-cap.webp'] : undefined),
        raycast: {enabled: true, radius: 1.1},
        pointerEffect: {
          enabled: true,
          // energyBar: true
        }
      }, null, o.data);
      this.asyncHelper(this.o).then(() => {
        // console.log('creeps loaded in scene... on firts hand !!!')
      }).catch(() => {
        setTimeout(() => {this.asyncHelper(this.o);}, 1000);
      });

    } catch(err) {throw err;}
  }

  asyncHelper = async (o) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        this.zombie_bodies = app.mainRenderBundle.filter(obj => obj.name && obj.name.includes(o.name) === true);
        if(this.zombie_bodies.length == 0) {
          reject();
          return;
        }
        let bPos;
        const delta_ = randomIntFromTo(0, 150);
        this.zombie_bodies.forEach((subMesh, idx) => {
          subMesh.setAmbient(randomIntFromTo(0, 2), randomIntFromTo(0, 2), randomIntFromTo(0, 2));
          subMesh.position.thrust = this.zombieSpeedWalk;
          subMesh.animationSpeed = 450 + delta_;
          subMesh.animationIndex = 0;
          subMesh.glb.glbJsonData.animations.forEach((a, index) => {
            if(a.name == 'crawl') this.zombieAnims.crawl = index;
            if(a.name == 'dead') this.zombieAnims.dead = index;
            if(a.name == 'zombi-walking') this.zombieAnims.walk = index;
            if(a.name == 'no_no') this.zombieAnims.nono = index;
            if(a.name == 'attack') this.zombieAnims.attack = index;
            if(a.name == 'idle') this.zombieAnims.idle = index;
          });
          subMesh.setAmbient(1, 1, 1, 1);
          if(idx == 0) {
            subMesh.sharedState.emitAnimationEvent = true;
            bPos = subMesh.position;
            this.core.collisionSystem.registerStatic(o.name, subMesh.position, 0.1, this.group,
              {
                x: subMesh.scale[0] / 3.5,
                y: subMesh.scale[1] * 1.5,
                z: subMesh.scale[2] / 3.5
              });
          } else {
            subMesh.position = bPos;
            this.core.collisionSystem.registerStatic(o.name, subMesh.position, 0.2, 'zombi_head',
              {
                x: subMesh.scale[0] / 4,
                y: subMesh.scale[1] * 1.75,
                z: subMesh.scale[2] / 4
              }
            );
          }
        });
        this.attachEvents();
        resolve();
      }, 250);
    })
  }

  setWalk() {
    this.zombie_bodies.forEach(subMesh => {
      if(this.archetype === 'zombie-crawl') {subMesh.playAnimationByIndex(this.zombieAnims.crawl);}
      else {subMesh.playAnimationByIndex(this.zombieAnims.walk);}
    });
  }

  setSalute() {
    this.zombie_bodies.forEach(subMesh => {
      subMesh.playAnimationByIndex(this.zombieAnims.salute)
    });
  }

  setDead() {
    this.zombie_bodies.forEach(subMesh => {
      subMesh.playAnimationByIndex(this.zombieAnims.dead)
    });
  }

  setIdle() {
    this.zombie_bodies.forEach(subMesh => {
      subMesh.playAnimationByIndex(this.zombieAnims.idle)
    });
  }

  setAttack() {
    this.zombie_bodies.forEach(subMesh => {
      subMesh.playAnimationByIndex(this.zombieAnims.attack)
    });
  }

  setAmbientColor(r, b, g) {
    this.core.getSceneObjectIfIncludes("zombi-cap").forEach((part) => {
      part.setAmbient(r, b, g, 1)
    })
  }

  setStartUpPosCreep() {
    this.zombie_bodies.forEach((subMesh, idx) => {
      subMesh.position.setPosition(
        mapParams.zombie.startUpPositions['north'][0],
        mapParams.zombie.startUpPositions['north'][1],
        mapParams.zombie.startUpPositions['north'][2]);
    });
  }

  spawnPosZombie(id = 1) {
    this.zombie_bodies.forEach((subMesh, idx) => {
      subMesh.position.setPosition(
        mapParams.zombie.startUpPositions['p' + id][0],
        mapParams.zombie.startUpPositions['p' + id][1],
        mapParams.zombie.startUpPositions['p' + id][2]);
    });
    this.isDead = false;
    this.hp = this.creepHPReset;
  }

  updateEnergyBar() {
    const head = this.zombie_bodies[0];
    // if(head?.effects?.energyBar) {
    //   head.effects.energyBar.setProgress(this.hp / this.creepHPReset); // 0-1 scale
    // }
  }

  takeDamage(amount = 0.2) {
    if(this.isDead) return;
    this.hp = Math.max(0, this.hp - amount);
    this.updateEnergyBar();
    app.matrixSounds.play('zombie' + randomIntFromTo(1, 3));
    if(this.hp <= 0) {
      this.die();
      app.matrixSounds.play('zombiedead');
    }
  }

  die() {
    this.isDead = true;
    this.aiState = 'dead';
    this.setDead();
    this.core.collisionSystem.unregister?.(this.name);
    dispatchEvent(this.zombiDieEvent);
    setTimeout(() => {
      this.spawnPosZombie(randomIntFromTo(1, 3));
      this.setIdle();
    }, 600);
  }

  getPlayerPosition() {
    const cam = app.getCamera();
    return cam ? vecOf(cam.position) : null;
  }

  isPlayerInFront(zombiePos, rotYDeg, playerPos) {
    const zp = vecOf(zombiePos);
    const rad = (rotYDeg || 0) * DEG2RAD;
    const fx = Math.sin(rad);
    const fz = Math.cos(rad);
    const dx = playerPos.x - zp.x;
    const dz = playerPos.z - zp.z;
    const len = Math.sqrt(dx * dx + dz * dz) || 1;
    return ((dx / len) * fx + (dz / len) * fz) > 0;
  }

  rotateStep(current, target, maxStepDeg) {
    let diff = ((target - current + 540) % 360) - 180;
    const clamped = Math.max(-maxStepDeg, Math.min(maxStepDeg, diff));
    return (current + clamped + 360) % 360;
  }

  resolveStaticCollisionXZ(candidateX, candidateY, candidateZ, radius = 0.5) {
    const cs = this.core.collisionSystem;
    cs._getNeighborCells(candidateX, candidateY, candidateZ, cs._staticGrid, cs._staticNeighbors);
    const fakePos = {x: candidateX, y: candidateY, z: candidateZ};
    const neighbors = cs._staticNeighbors;
    for(let i = 0;i < neighbors.length;i++) {
      const entry = neighbors[i];
      if(entry.group === 'floor') continue;
      if(entry.id === this.name) continue;
      cs.resolveVsStaticCube(fakePos, radius, entry);
    }
    return fakePos;
  }

  moveTowardPlayer(zombiePos, rotYDeg, playerPos) {
    const zp = vecOf(zombiePos);
    const dx = playerPos.x - zp.x;
    const dz = playerPos.z - zp.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    if(dist < 0.0001) return rotYDeg;

    const nx = dx / dist;
    const nz = dz / dist;
    const targetAngleY = (Math.atan2(nx, nz) * RAD2DEG + 360) % 360;
    const newRotY = this.rotateStep(rotYDeg || 0, targetAngleY, this.aiConfig.rotationStepDeg);

    const step = Math.min(this.aiConfig.stepDistance, Math.max(0, dist - this.aiConfig.attackRange));
    if(step > 0) {
      const rawX = zp.x + nx * step;
      const rawZ = zp.z + nz * step;
      const resolved = this.resolveStaticCollisionXZ(rawX, zp.y, rawZ, 0.7);
      zombiePos.translateByXYZ(resolved.x, zp.y, resolved.z);
      // zombiePos.translateByXYZ(playerPos.x, zp.y, playerPos.z);

    }
    return newRotY;
  }

  resolveAttack() {
    if(this._attackCooldownLeft > 0) {
      this._attackCooldownLeft--;
      return;
    }
    this._attackCooldownLeft = this.attackCooldownTicks;
    this.exposeDamage = true;
    this.setAttack();
  }

  distanceXZ(a, b) {
    const dx = a.x - b.x;
    const dz = a.z - b.z;
    return Math.sqrt(dx * dx + dz * dz);
  }

  navigateStep() {
    if(this.isDead) return;
    if(app.getCamera().position[1] < -10) {app.player.die()}

    const head = this.zombie_bodies[0];
    const playerPos = this.getPlayerPosition();
    if(!playerPos) return;
    const zp = vecOf(head.position);
    const dist = this.distanceXZ(zp, playerPos);
    const inFront = this.isPlayerInFront(head.position, head.rotation.y, playerPos);
    const detectRange = inFront ? this.aiConfig.detectRangeFront : this.aiConfig.detectRangeBack;

    if(dist > detectRange) {
      if(this.aiState !== 'idle') {this.aiState = 'idle'; this.setIdle();}
      this.exposeDamage = false;
      return;
    }

    if(dist <= this.aiConfig.attackRange) {
      if(this.aiState !== 'attack') {this.aiState = 'attack'; this.setAttack();}
      app.matrixSounds.play('zombie' + randomIntFromTo(1, 4));
      this.resolveAttack();
      return;
    }

    this.aiState = 'chase';
    const newRotY = this.moveTowardPlayer(head.position, head.rotation.y, playerPos);
    this.zombie_bodies.forEach(subMesh => {subMesh.rotation.y = newRotY;});
    this.exposeDamage = false;
    this.setWalk();
  }

  _rotAnimHandle = null;

  smoothRotateTo(subMesh, targetY, durationMs = 900) {
    if(this._rotAnimHandle) cancelAnimationFrame(this._rotAnimHandle);
    const startY = subMesh.rotation.y;
    let diff = ((targetY - startY + 540) % 360) - 180;
    const startTime = performance.now();

    const step = (now) => {
      const t = Math.min(1, (now - startTime) / durationMs);
      subMesh.rotation.y = (startY + diff * t + 360) % 360;
      // console.log("subMesh.rotation.y : ", subMesh.rotation.y)
      if(t < 1) {
        this._rotAnimHandle = requestAnimationFrame(step);
      } else {
        this._rotAnimHandle = null;
      }
    };
    this._rotAnimHandle = requestAnimationFrame(step);
  }

  attachEvents() {
    app.autoUpdate.push({update: () => {this.navigateStep()}})
    addEventListener(\`animationEnd-\${this.zombie_bodies[0].name}\`, (e) => {
      // if(e.detail.animationName === 'dead') {return;}
      if(this.exposeDamage === true) {
        app.matrixSounds.play('zombie2');
        app.player.takeDamage(this.attackDamage);
        app.energy.setValue(app.player.energy);
        return;
      }
      if(randomIntFromTo(0, 50) < 1) {
        app.matrixSounds.play('zombie' + randomIntFromTo(1, 4));
      }
    })
  }
}


let app = new MatrixEngineWGPU({
  canvasSize: 'fullscreen',
  fastRender: 0.95,
  render: 'culling',
  cullingRange: 1200,
  dontUsePhysics: true,
  MAX_SPOTLIGHTS: 1,
  MAX_BONES: 0,
  LOAD_AFTER_CLICK_MOBILE: false,
  MOUSE_SENS: 0.005,
  TOUCH_SENS: 0.01,
  mainCameraParams: {
    type: 'firstPersonCamera',
    responseCoef: 1000
  },
  clearColor: {r: 0, b: 0, g: 0, a: 1}
}, () => {
  // app.tts = new MatrixTTS();
  app.collisionSystem = new CollisionSystem(app);
  app.addLight();
  addRaycastsAABBListener(undefined, "mousedown");
  app.activateHZB();
  app.activateBloomEffect();
  // Audios
  // app.matrixSounds.createAudio('music', 'res/audios/audionautix-black-fly.mp3', 1);
  app.matrixSounds.createAudio('shot', 'res/audios/gun/gunshot.mp3', 3);
  app.matrixSounds.createAudio('zombie1', 'res/audios/zombie/zombie-1.mp3', 2);
  app.matrixSounds.createAudio('zombie2', 'res/audios/zombie/zombie-2.mp3', 2);
  app.matrixSounds.createAudio('zombie3', 'res/audios/zombie/zombie-9.mp3', 2);
  app.matrixSounds.createAudio('zombie4', 'res/audios/zombie/zombie-16.mp3', 2);
  app.matrixSounds.createAudio('zombiedead', 'res/audios/zombie/zombie-10.mp3', 2);
  app.matrixSounds.createAudio('feelgood', 'res/audios/feel.mp3', 1);
  // app.matrixSounds.audios.music.loop = true;

  app.UI = new hang3dUI();

  MobileDOM.addButton("T", () => {}, undefined, {
    image: "./res/textures/shooter/s.webp",
    left: isMobile() === true ? 41 : 46.5,
    bottom: isMobile() === true ? 40 : 42.5,
    color: 'black',
    size: innerHeight / 10
  })

  app.energy = MobileDOM.addProgressBar({width: innerWidth / 3, height: 30, size: innerWidth / 3, bottom: 82.5, left: 33, color: '#00bcd4'});
  app.energy.setValue(100);

  MobileDOM.addButton("Kills 0", () => {}, undefined, {
    id: 'player-status',
    image: "./res/textures/shooter/s.webp",
    left: isMobile() === true ? 2 : 15,
    bottom: isMobile() === true ? 85 : 85,
    color: 'red',
    size: innerHeight / 10
  })
  const timeNode = document.createTextNode('');
  byId('player-status').appendChild(timeNode);

  MobileDOM.addButton("Ammo 100", () => {}, undefined, {
    id: 'player-ammo',
    image: "./res/textures/shooter/s.webp",
    left: isMobile() === true ? 23.5 : 25,
    bottom: isMobile() === true ? 85 : 85,
    color: '#ffeb3b',
    size: innerHeight / 10
  })

  MobileDOM.addButton("Armor NO", () => {}, undefined, {
    id: 'player-armor',
    image: "./res/textures/shooter/s.webp",
    left: isMobile() === true ? 44.5 : 35,
    bottom: isMobile() === true ? 85 : 85,
    color: '#6cff3b',
    size: innerHeight / 10
  })

  app.player = new Player({
    name: 'Samanta',
    typeOfController: 'fps',
    onEnergyChange: (val) => app.energy.setValue(val)
  });

  const cam = app.getCamera();
  let preventFire = false;

  downloadMeshes({
    cube: './res/meshes/blender/cube.obj',
    ball: './res/meshes/blender/sphepe-mob.obj',
    armor: './res/meshes/obj/armor.obj',
    energyItem: './res/meshes/obj/energy-cube.obj',
    hang2: './res/meshes/obj/modelpack19/hang2/hang2.obj',
    ammo: './res/meshes/obj/ammo.obj'
  }, async (m) => {

    if(isMobile() === true) {
      MobileDOM.addButton("FIRE", () => {
        fire();
      }, undefined, {
        width: '30px',
        height: '30px',
        image: "./res/textures/shooter/s.webp",
        color: 'red',
        left: 60,
        bottom: 20,
        size: innerHeight / 10
      }, () => {
        if(preventFire === false) {
          preventFire = true;
          fire();
          setTimeout(() => {preventFire = false;}, 350)
        }
      })

      MobileDOM.addButton("JUMP", () => {
        if(app.collisionSystem?._onGround) {
          app.collisionSystem._gravityAcc = 0.22;
          app.collisionSystem._onGround = false;
          this._dirty = true;
          this._dirtyAngle = true;
        }
      }, undefined, {
        width: '30px',
        height: '30px',
        image: "./res/textures/shooter/s.webp",
        color: 'red',
        left: 80,
        bottom: 20,
        size: innerHeight / 10
      })

      MobileDOM.addButton("FIRE", () => {
        fire();
      }, undefined, {
        width: '30px',
        height: '30px',
        image: "./res/textures/shooter/s.webp",
        color: 'red',
        left: 10,
        bottom: 20,
        size: innerHeight / 10
      }, () => {
        if(preventFire === false) {
          preventFire = true;
          fire();
          setTimeout(() => {preventFire = false;}, 210)
        }
      })
    }

    const mc = new MapCreator(app, m, app.collisionSystem, {
      wallTexture: './res/textures/shooter/metal-block.webp',
      floorTexture: './res/textures/shooter/metal-block.webp',
      ceilTexture: './res/textures/blankgray2.webp',
      shadowsCast: true,
      pillarDecoration: true,
      pillarsFlame: false
    }, mapParams );
    mc.createRoom({
      origin: {x: -0, y: 0.1, z: 20},
      width: 10, depth: 10, height: 4,
      doors: ['+x', '-z'],
      doorWidth: 2.5,
      roof: true,
      uvShema: [10, 10],
      tag: 'start_room'
    });

    mc.createTunnel({
      from: {x: -35, y: 0.1, z: 0},
      to: {x: -15, y: 0, z: 0},
      width: 3.5,
      height: 3.0,
      roof: true,
      tag: 'entry_tunnel'
    });

    mc.createFightArena({
      origin: {x: 0, y: 0, z: 0},
      width: 32, depth: 32,
      wallHeight: 2.5,
      pillars: 16, pillarH: 4,
      covers: 4,
      roof: false,
      doors: ['-x', '+z'],
      uvShema: [10, 10],
      tag: 'main_arena'
    });

    mc.createStairs({
      origin: {x: -6, y: 0, z: 0},
      axis: 'z',
      steps: 8,
      stepW: 3,
      stepH: 0.4,
      stepD: 0.8,
      walls: true,
      uvShema: [3, 6],
      tag: 'stairs_up'
    });

    mc.createMultiLevelMaze({
      origin: {x: -65.3, y: -3.3, z: -22},
      levels: 2,
      mazeSize: 13,
      spacing: 2,
      wallHeight: 3,
      levelGap: 1,
      stairSteps: 8,
      roofLevels: true
    });

    app.gameMap = mc;

    var glbFile01 = await fetch('./res/meshes/glb/zombie-cap.glb').then(res => res.arrayBuffer().then(buf => uploadGLBModel(buf, app.device)));
    var glbFile02 = await fetch('./res/meshes/glb/zombi-crawl1.glb').then(res => res.arrayBuffer().then(buf => uploadGLBModel(buf, app.device)));

    const options0 = {
      core: app,
      name: 'zombi-cap0',
      archetypes: ["zombie"],
      position: {x: 0, y: 0.2, z: -10},
      data: glbFile01
    }

    const options1 = {
      core: app,
      name: 'zombi-cap1',
      archetypes: ["zombie"],
      position: {x: -4.35, y: 0.2, z: -10},
      data: glbFile01
    }

    const options2 = {
      core: app,
      name: 'zombi-cap2',
      archetypes: ["zombie"],
      position: {x: -5.35, y: 0.2, z: -10},
      data: glbFile01
    }

    const optionsC0 = {
      core: app,
      name: 'zombi-crawl0',
      archetypes: ["zombie-crawl"],
      position: {x: 4.35, y: 0.2, z: -10},
      data: glbFile02
    }

    const optionsC1 = {
      core: app,
      name: 'zombi-crawl1',
      archetypes: ["zombie-crawl"],
      position: {x: 0, y: 0.2, z: -10},
      data: glbFile02
    }

    const optionsZombiMaze0 = {
      core: app,
      name: 'zombi-c-maze0',
      archetypes: ["zombie-crawl"],
      position: {x: -44.79292678833008, y: 1.1, z: -0.29},
      data: glbFile02
    }

    const optionsZombiMaze1 = {
      core: app,
      name: 'zombi-c-maze1',
      archetypes: ["zombie-crawl"],
      position: {x: -44.14, y: 1.1, z: -21.38},
      data: glbFile02
    }

    const optionsZombiMaze2 = {
      core: app,
      name: 'zombi-c-maze2',
      archetypes: ["zombie-crawl"],
      position: {x: -44.14, y: 1.1, z: -21.38},
      data: glbFile02
    }

    app.zombies = [
      // base
      new Zombi(options0), new Zombi(options1), new Zombi(options2),
      new Zombi(optionsC0), new Zombi(optionsC1),
      // maze
      new Zombi(optionsZombiMaze0), new Zombi(optionsZombiMaze1), new Zombi(optionsZombiMaze2)
    ];

    const light = app.lightContainer[0];
    light.setPosition(0, 60, 0);
    light.setIntensity(20);
    app.cameras.firstPersonCamera.movementSpeed = 0.1;
    app.cameras.firstPersonCamera.setPosition(0, 7, 0);
    app.collisionSystem.registerCamera(app.cameras.firstPersonCamera.position, 1.08);

    app.projectileSystem = new ProjectileSystem(app, m.ball, app.collisionSystem,
      {
        projectileSpeed: 0.45,
        projectileScale: 0.07,
        onHitscanHit: (hitPoint, normal, reflect, entry) => {
          let t = app.zombies.filter((z) => z.name === entry.id)[0]
          if(t && entry.group) {
            if(t && entry.group && entry.group === 'enemy') t.takeDamage();
            if(t && entry.group && entry.group === 'zombi_head') t.takeDamage(2.5);
          }
          // console.log('ray hit', t);
        },
        onProjectileHit: (hitPoint, normal, entry) => {}
      }
    );

    if(isMobile() === false) {
      app.canvas.addEventListener("mouseup", (e) => {
        setTimeout(() => {
          if(e.button == 2) app.getCamera().setProjection((2 * Math.PI) / 5, app.getCamera().aspect, 0.3, 200);
        }, 100)
      })
    }

    app.canvas.addEventListener("ray.hit.mousedown", (e) => {
      // app.projectileSystem.fireHitscan();
      if(e.detail.button === 2) {
        app.getCamera().setProjection((0.5 * Math.PI) / 5, app.getCamera().aspect, 0.3, 200);
        return;
      }
      fire();
    });
  }, {scale: [1, 1, 1]});
  const fire = () => {
    if(app.player.ammo < 1) return;
    app.matrixSounds.play('shot');
    app.projectileSystem.fireProjectile();
    app.player.useAmmo(1)
  }
});

window.app = app;
`;