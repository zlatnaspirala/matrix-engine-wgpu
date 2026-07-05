import {LOG_MATRIX} from "../../../src/engine/utils";
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
        scale: [2, 2, 2],
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
        console.log('catch')
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
        this.zombie_bodies.forEach((subMesh, idx) => {
          subMesh.position.thrust = this.moveSpeed;
          subMesh.animationIndex = 0;
          subMesh.glb.glbJsonData.animations.forEach((a, index) => {
            console.info(`%c Animation loading for creeps: ${a.name} index ${index}`, LOG_MATRIX)
            if(a.name == 'dead') this.zombieAnims.dead = index;
            if(a.name == 'walk') this.zombieAnims.walk = index;
            if(a.name == 'salute') this.zombieAnims.salute = index;
            if(a.name == 'attack') this.zombieAnims.attack = index;
            if(a.name == 'idle') this.zombieAnims.idle = index;
          });
          // adapt
          subMesh.setAmbient(1, 1, 1, 1);
          if(idx == 0) this.core.collisionSystem.register((o.name), subMesh.position, 1.0, this.group);
        });

        this.setStartUpPosition();
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
    addEventListener(`onDamage-${this.name}`, (e) => {
      if(this.group == 'enemy') {
        console.info(`%c onDamage-${this.name} group: ${this.group}  creep damage!`, LOG_FUNNY);
      } else {
        console.log('friendly creep damage must come from net. [never]');
        return;
      }

      this.zombie_bodies[0].effects.energyBar.setProgress(e.detail.progress);
      // this.core.net.sendOnlyData({
      //   type: "damage-creep",
      //   defenderName: e.detail.defender,
      //   defenderTeam: this.team,
      //   hp: e.detail.hp,
      //   progress: e.detail.progress
      // });
      if(e.detail.progress == 0) {
        this.setDead();
        console.info(`ZOmbi dead [${this.name}], attacker[${e.detail.attacker}]`);
        setTimeout(() => {
          this.setStartUpPosCreep();
          this.setWalk();
          this.creepFocusAttackOn = null;
          this.gotoFinal = false;
          this.hp = 300;
          this.zombie_bodies[0].effects.energyBar.setProgress(1);
          //
        }, 700);
      }
    });


    addEventListener(`animationEnd-${this.zombie_bodies[0].name}`, (e) => {
      if(e.detail.animationName != 'attack' && this.creepFocusAttackOn == null) {
        console.log('animationEnd BLOCK1')
        return;
      }
      console.info('animationEnd :', e.detail)
      if(this.group == "friendly") {
        if(this.creepFocusAttackOn == null) {
          let isEnemiesClose = false;
          this.core.enemies.enemies.forEach((enemy) => {
            if(typeof enemy.zombie_bodies === 'undefined') return;
            let tt = this.core.RPG.distance3D(
              this.zombie_bodies[0].position,
              enemy.zombie_bodies[0].position);
            if(tt < this.core.RPG.distanceForAction) {
              // console.log(`%c ATTACK DAMAGE ${enemy.zombie_bodies[0].name}`, LOG_MATRIX)
              isEnemiesClose = true;
              this.calcDamage(this, enemy);
              return;
            }
          });

          this.core.enemies.creeps.forEach((creep) => {
            if(typeof creep.zombie_bodies === 'undefined') return;
            let tt = this.core.RPG.distance3D(
              this.zombie_bodies[0].position,
              creep.zombie_bodies[0].position);
            if(tt < this.core.RPG.distanceForAction) {
              // console.log(`%c ATTACK DAMAGE ${creep.zombie_bodies[0].name}`, LOG_MATRIX)
              isEnemiesClose = true;
              this.calcDamage(this, creep);
              return;
            }
          });

        }
      }
    })

  }
}