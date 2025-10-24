import {uploadGLBModel} from "../../../src/engine/loaders/webgpu-gltf";
import {LOG_MATRIX} from "../../../src/engine/utils";
import {Hero} from "./hero";

export class Creep extends Hero {

  heroAnimationArrange = {
    dead: null,
    walk: null,
    salute: null,
    attack: null,
    idle: null
  }

  creepFocusAttackOn = null;

  constructor(o, archetypes = ["creep"], group = "enemy") {
    super(o.name, archetypes);
    this.name = o.name;
    this.core = o.core;
    this.group = group;
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
            // console.info(`%c ANimation: ${a.name} index ${index}`, LOG_MATRIX)
            if(a.name == 'dead') this.heroAnimationArrange.dead = index;
            if(a.name == 'walk') this.heroAnimationArrange.walk = index;
            if(a.name == 'salute') this.heroAnimationArrange.salute = index;
            if(a.name == 'attack') this.heroAnimationArrange.attack = index;
            if(a.name == 'idle') this.heroAnimationArrange.idle = index;
          });
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
    this.heroe_bodies.forEach((subMesh, idx) => {
      subMesh.position.setPosition(0, -23, 0)
    })
  }

  attachEvents() {
    addEventListener(`onDamage-${this.name}`, (e) => {
      console.info(`%frendly creep damage ${e.detail}`, LOG_MATRIX)
      this.heroe_bodies[0].effects.energyBar.setProgress(e.detail.progress);
      // if detail is 0
      if(e.detail.progress == 0) {
        this.setDead();
        console.info(`%cfrendly creep dead [${this.name}], attacker[${e.detail.attacker}]`, LOG_MATRIX)
        setTimeout(() => {
          this.setStartUpPosition()
        }, 2000)
        e.detail.attacker.killEnemy(e.detail.defenderLevel);
      }
    });

    addEventListener(`animationEnd-${this.name}`, (e) => {
      // CHECK DISTANCE
      if(e.detail.animationName != 'attack' && this.creepFocusAttackOn == null) {
        return;
      }

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
          }  else {
              // leave it go creep to your goals... NOT TESTED !!!!
              console.log(`%c this.creepFocusAttackOn = null; NO ATTACK clear `, LOG_MATRIX)
              this.creepFocusAttackOn = null;
              dispatchEvent(new CustomEvent('navigate-frendly-creeps', {detail: 'test'}))
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
              console.log(`%cATTACK DAMAGE ${enemy.heroe_bodies[0].name}`, LOG_MATRIX)
              this.calcDamage(this, enemy);
              return;
            } else {
              // leave it go creep to your goals...
              console.log(`%cNO ATTACK GO ...`, LOG_MATRIX)
              this.creepFocusAttackOn = null;
              dispatchEvent(new CustomEvent('navigate-frendly-creeps', {detail: 'test'}))
            }
          }
        })

        if(this.core.enemies.creeps.length > 0) this.core.enemies.creeps.forEach((enemy) => {
          if(this.creepFocusAttackOn.name.indexOf(enemy.name) != -1) {
            let tt = this.core.RPG.distance3D(
              this.heroe_bodies[0].position,
              this.creepFocusAttackOn.position);
            if(tt < this.core.RPG.distanceForAction) {
              console.log(`%c ATTACK DAMAGE ${enemy.heroe_bodies[0].name}`, LOG_MATRIX)
              this.calcDamage(this, enemy);
            } else {
              // leave it go creep to your goals...
              this.creepFocusAttackOn = null;
            }
          }
        })
      }
    })

  }

}