import {uploadGLBModel} from "../../../src/engine/loaders/webgpu-gltf";
import {LOG_FUNNY, LOG_MATRIX} from "../../../src/engine/utils";
import {Hero} from "./hero";
import {startUpPositions} from "./static";

export class Creep extends Hero {

  heroAnimationArrange = {
    dead: null,
    walk: null,
    salute: null,
    attack: null,
    idle: null
  }

  creepFocusAttackOn = null;

  constructor(o, archetypes = ["creep"], group = "enemy", team) {
    super(o.name, archetypes);
    this.name = o.name;
    this.core = o.core;
    this.group = group;
    this.team = team;
    this.loadCreeps(o);
    return this;
  }

  loadCreeps = async (o) => {
    try {
      var glbFile01 = await fetch(o.path).then(res => res.arrayBuffer().then(buf => uploadGLBModel(buf, this.core.device)));
      this.core.addGlbObjInctance({
        material: {type: 'standard', useTextureFromGlb: true},
        scale: [20, 20, 20],
        position: o.position,
        name: o.name,
        texturesPaths: ['./res/meshes/glb/textures/mutant_origin.png'],
        raycast: {enabled: true, radius: 1.1},
        pointerEffect: {
          enabled: true,
          energyBar: true
        }
      }, null, glbFile01);
      // make small async - cooking glbs files
      setTimeout(() => {
        this.heroe_bodies = app.mainRenderBundle.filter(obj =>
          obj.name && obj.name.includes(o.name)
        );
        this.heroe_bodies.forEach((subMesh, idx) => {
          subMesh.position.thrust = this.moveSpeed;
          subMesh.glb.animationIndex = 0;
          // adapt manual if blender is not setup
          subMesh.glb.glbJsonData.animations.forEach((a, index) => {
            // console.info(`%c Animation loading for creeps: ${a.name} index ${index}`, LOG_MATRIX)
            if(a.name == 'dead') this.heroAnimationArrange.dead = index;
            if(a.name == 'walk') this.heroAnimationArrange.walk = index;
            if(a.name == 'salute') this.heroAnimationArrange.salute = index;
            if(a.name == 'attack') this.heroAnimationArrange.attack = index;
            if(a.name == 'idle') this.heroAnimationArrange.idle = index;
          });

          // adapt
          subMesh.globalAmbient = [1, 1, 1, 1];
          if(this.name.indexOf('friendly_creeps') != -1) {
            subMesh.globalAmbient = [12, 12, 12, 1];
          } else if(this.name.indexOf('enemy_creep') != -1) {
            subMesh.globalAmbient = [12, 1, 1, 1];
          }

          //
          if(this.group == 'friendly') {
            if(idx == 0) {
              subMesh.position.netObject = subMesh.name;
              let t = subMesh.name.replace('friendly_creeps', 'enemy_creep');
              console.log('It is friendly creep use emit net', t);
              subMesh.position.remoteName = t;
              subMesh.rotation.emitY = subMesh.name;
              subMesh.rotation.remoteName = t;
            }
          }
          // maybe will help - remote net players no nedd to collide in other remote user gamaplay
          // this.core.collisionSystem.register((o.name + idx), subMesh.position, 15.0, 'enemies');
          // dont care for multi sub mesh now
          if(idx == 0) this.core.collisionSystem.register((o.name), subMesh.position, 15.0, this.group);
        });
        this.setStartUpPosition();
        this.attachEvents();
      }, 1700)
    } catch(err) {throw err;}
  }

  setWalk() {
    this.heroe_bodies.forEach(subMesh => {
      subMesh.glb.animationIndex = this.heroAnimationArrange.walk;
      console.info(`%chero walk`, LOG_MATRIX)
    });
  }

  setSalute() {
    this.heroe_bodies.forEach(subMesh => {
      subMesh.glb.animationIndex = this.heroAnimationArrange.salute;
      console.info(`%chero salute`, LOG_MATRIX)
    });
  }

  setDead() {
    this.heroe_bodies.forEach(subMesh => {
      subMesh.glb.animationIndex = this.heroAnimationArrange.dead;
      console.info(`%chero dead`, LOG_MATRIX)
    });
  }

  setIdle() {
    this.heroe_bodies.forEach(subMesh => {
      subMesh.glb.animationIndex = this.heroAnimationArrange.idle;
      console.info(`%chero idle`, LOG_MATRIX)
    });
  }

  setAttack() {
    this.heroe_bodies.forEach(subMesh => {
      subMesh.glb.animationIndex = this.heroAnimationArrange.attack;
      console.info(`%chero attack`, LOG_MATRIX)
    });
  }

  setStartUpPosition() {
    if(this.group == 'enemy') {
      this.heroe_bodies.forEach((subMesh, idx) => {
        subMesh.position.setPosition(
          startUpPositions[this.core.player.data.enemyTeam][0],
          startUpPositions[this.core.player.data.enemyTeam][1],
          startUpPositions[this.core.player.data.enemyTeam][2]);
      });
    } else {
      this.heroe_bodies.forEach((subMesh, idx) => {
        subMesh.position.setPosition(
          startUpPositions[this.core.player.data.team][0],
          startUpPositions[this.core.player.data.team][1],
          startUpPositions[this.core.player.data.team][2]);
      });
    }
  }

  attachEvents() {
    addEventListener(`onDamage-${this.name}`, (e) => {
      if(this.group == 'enemy') {
        console.info(`%c onDamage-${this.name} group: ${this.group}  creep damage!`, LOG_FUNNY)
      } else {
        alert('friendly creep damage must come from net')
      }

      this.heroe_bodies[0].effects.energyBar.setProgress(e.detail.progress);

      this.core.net.sendOnlyData({
        type: "damage-creep",
        defenderName: e.detail.defender,
        defenderTeam: this.team,
        hp: e.detail.hp,
        progress: e.detail.progress
      });

      // if detail is 0
      if(e.detail.progress == 0) {
        this.setDead();
        console.info(`%c creep dead [${this.name}], attacker[${e.detail.attacker}]`, LOG_MATRIX)
        setTimeout(() => {
          this.setStartUpPosition();
          this.setWalk();
        }, 2000);
        // e.detail.attacker.killEnemy(e.detail.defenderLevel);

      }
    });

    if(this.group != 'enemy') {
      addEventListener(`animationEnd-${this.heroe_bodies[0].name}`, (e) => {
        // CHECK DISTANCE
        if(e.detail.animationName != 'attack' && this.creepFocusAttackOn == null) {
          return;
        }

        if(this.group == "friendly") {

          if(this.creepFocusAttackOn == null) {
            console.info('FOCUS ON GROUND BUT COLLIDE WITH ENEMY-ANIMATION END setIdle:', e.detail.animationName)
            let isEnemiesClose = false; // on close distance 
            this.core.enemies.enemies.forEach((enemy) => {
              let tt = this.core.RPG.distance3D(
                this.heroe_bodies[0].position,
                enemy.heroe_bodies[0].position);
              if(tt < this.core.RPG.distanceForAction) {
                console.log(`%c ATTACK DAMAGE ${enemy.heroe_bodies[0].name}`, LOG_MATRIX)
                isEnemiesClose = true;
                this.calcDamage(this, enemy);
              } else {
                console.log(`%c creepFocusAttackOn = null; (fcreep vs enemy hero)(navigate-friendly_creeps1) `, LOG_MATRIX)
                this.creepFocusAttackOn = null;
                dispatchEvent(new CustomEvent('navigate-friendly_creeps', {detail: {
                  localCreepNav: this,
                  index: this.name[this.name.length-1]
                }}))
              }
            })
            // if(isEnemiesClose == false) this.setIdle();
            return;
          }
          else {
            // Focus on enemy vs creeps !!!
            if(this.core.enemies.enemies.length > 0) this.core.enemies.enemies.forEach((enemy) => {
              if(this.creepFocusAttackOn.name.indexOf(enemy.name) != -1) {
                let tt = this.core.RPG.distance3D(
                  this.heroe_bodies[0].position,
                  this.creepFocusAttackOn.heroe_bodies[0].position);
                if(tt < this.core.RPG.distanceForAction) {
                  console.log(`%c [creep] ATTACK DAMAGE ON ${enemy.heroe_bodies[0].name}`, LOG_MATRIX)
                  this.calcDamage(this, enemy);
                  return;
                } else {
                  // leave it go creep to your goals...
                  console.log(`%c creepFocusAttackOn != null; (fcreep vs enemy hero)(navigate-friendly_creeps2) `, LOG_MATRIX)
                  this.creepFocusAttackOn = null;
                  dispatchEvent(new CustomEvent('navigate-friendly_creeps', {detail: 'test'}))
                }
              }
            })

            if(this.core.enemies.creeps.length > 0) this.core.enemies.creeps.forEach((creep) => {
              if(this.creepFocusAttackOn.name.indexOf(creep.name) != -1) {
                let tt = this.core.RPG.distance3D(
                  this.heroe_bodies[0].position,
                  this.creepFocusAttackOn.heroe_bodies[0].position);
                if(tt < this.core.RPG.distanceForAction) {
                  console.log(`%c creep ATTACK DAMAGE ${creep.heroe_bodies[0].name}`, LOG_MATRIX)
                  this.calcDamage(this, creep);
                } else {
                  // leave it go creep to your goals...
                  console.log(`%c creepFocusAttackOn = null; (fcreep vs creeps)(navigate-friendly_creeps3) `, LOG_MATRIX)
                  this.creepFocusAttackOn = null;
                  dispatchEvent(new CustomEvent('navigate-friendly_creeps', {detail: 'test'}))
                }
              }
            })
          }
        }
      })
    }
  }
}