import {distance3D, LOG_MATRIX} from "../../../src/engine/utils";
import {mapParams} from "./table-params";

export class Zombi {

  zombieAnims = {
    dead: null,
    walk: null,
    nono: null,
    attack: null,
    idle: null
  }

  creepHPReset = 300;
  creepFocusAttackOn = null;

  constructor(o, archetypes = ["zombie"], group = "enemy", team) {
    this.name = o.name;
    this.core = o.core;
    this.group = group;
    this.team = team;
    this.loadCreep(o);
    return this;
  }

  loadCreep = async (o) => {
    this.o = o;
    try {
      this.core.addGlbObjInctance({
        material: {type: 'standard', useTextureFromGlb: true},
        shadowsCast: false,
        scale: [0.9, 0.9, 0.9],
        position: o.position,
        name: o.name,
        texturesPaths: ['./res/meshes/glb/textures/mutant_origin.webp'],
        raycast: {enabled: true, radius: 1.1},
        pointerEffect: {
          enabled: true,
          energyBar: true
        }
      }, null, o.data);
      this.asyncHelper(this.o).then(() => {
        // console.log('creeps loaded in scene...')
      }).catch(() => {
        // console.log('catch')
        setTimeout(() => {this.asyncHelper(this.o);}, 3000);
      });

    } catch(err) {throw err;}
  }

  asyncHelper = async (o) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        this.zombie_bodies = app.mainRenderBundle.filter(obj => obj.name && obj.name.includes(o.name));
        if(this.zombie_bodies.length == 0) {
          reject();
          return;
        }
        let bPos;
        this.zombie_bodies.forEach((subMesh, idx) => {
          subMesh.position.thrust = 0.01;
          subMesh.animationIndex = 0;
          subMesh.glb.glbJsonData.animations.forEach((a, index) => {
            console.info(`%c Animation loading for creeps: ${a.name} index ${index}`, LOG_MATRIX)
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
            this.core.collisionSystem.registerStatic((o.name), subMesh.position, 0.7, this.group,
              {
                x: subMesh.scale[0] / 3.5,
                y: subMesh.scale[1] * 2,
                z: subMesh.scale[2] / 3.5
              });
          } else {
            this.core.collisionSystem.registerStatic((o.name), subMesh.position, 0.7, 'zombi_head');
            subMesh.position = bPos;
          }
        });
        this.attachEvents();
        resolve();
      }, 3000);
    })
  }

  setWalk() {
    this.zombie_bodies.forEach(subMesh => {
      subMesh.playAnimationByIndex(this.zombieAnims.walk)
      console.info(`%chero walk`, LOG_MATRIX)
    });
  }

  setSalute() {
    this.zombie_bodies.forEach(subMesh => {
      subMesh.playAnimationByIndex(this.zombieAnims.salute)
      console.info(`%chero salute`, LOG_MATRIX)
    });
  }

  setDead() {
    this.zombie_bodies.forEach(subMesh => {
      subMesh.playAnimationByIndex(this.zombieAnims.dead)
      console.info(`%chero dead`, LOG_MATRIX)
    });
  }

  setIdle() {
    this.zombie_bodies.forEach(subMesh => {
      subMesh.playAnimationByIndex(this.zombieAnims.idle)
      console.info(`%chero idle`, LOG_MATRIX)
    });
  }

  setAttack() {
    this.zombie_bodies.forEach(subMesh => {
      subMesh.playAnimationByIndex(this.zombieAnims.attack)
      console.info(`%chero attack`, LOG_MATRIX)
    });
  }

  setStartUpPosCreep() {
    this.zombie_bodies.forEach((subMesh, idx) => {
      subMesh.position.setPosition(
        mapParams.zombie.startUpPositions['north'][0],
        mapParams.zombie.startUpPositions['north'][1],
        mapParams.zombie.startUpPositions['north'][2]);
    });
  }

  attachEvents() {
       console.log('animationEnd init')
    addEventListener(`animationEnd-${this.zombie_bodies[0].name}`, (e) => {
      if(e.detail.animationName === 'attack') {
        console.log('animationEnd BLOCK1')
        return;
      }
      console.info('animationEnd :', e.detail)
      if(this.group == "friendly") {
        if(this.creepFocusAttackOn == null) {
          // let tt = this.core.RPG.distance3D()
        }
      }

    })

  }
}