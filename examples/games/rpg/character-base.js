import {vec3, mat4} from "wgpu-matrix";
import {uploadGLBModel} from "../../../src/engine/loaders/webgpu-gltf";
import {byId, LOG_MATRIX} from "../../../src/engine/utils";
import {Hero, HERO_PROFILES} from "./hero";

export class Character extends Hero {

  positionThrust = 0.85;

  heroAnimationArrange = {
    dead: null,
    walk: null,
    salute: null,
    attack: null,
    idle: null
  };

  heroFocusAttackOn = null;
  mouseTarget = null;

  constructor(mysticore, path, name = 'MariaSword', archetypes = ["Warrior", "Mage"]) {
    super(name, archetypes);
    // console.info(`%cLOADING hero name : ${name}`, LOG_MATRIX)
    this.name = name;
    this.core = mysticore;
    this.heroe_bodies = [];
    this.loadLocalHero(path);
    // async
    setTimeout(() => this.setupHUDForHero(name), 500)
  }

  setupHUDForHero(name) {
    console.info(`%cLOADING hero name : ${name}`, LOG_MATRIX)
    // if(name == 'MariaSword') {
      for (var x = 1; x < 5; x++) {
        byId(`magic-slot-${x-1}`).style.background = `url("./res/textures/rpg/magics/${name.toLowerCase()}-${x}.png")`;
        byId(`magic-slot-${x-1}`).style.backgroundRepeat = "round";
      }
      byId('hudLeftBox').style.background = `url('./res/textures/rpg/hero-image/${name.toLowerCase()}.png')  center center / cover no-repeat`;
      byId('hudDesription').innerHTML = app.label.get.mariasword;  
  }

  async loadLocalHero(p) {
    try {
      var glbFile01 = await fetch(p).then(res => res.arrayBuffer().then(buf => uploadGLBModel(buf, this.core.device)));
      this.core.addGlbObjInctance({
        material: {type: 'standard', useTextureFromGlb: true},
        scale: [20, 20, 20],
        position: {x: 0, y: -23, z: -0},
        name: this.name,
        texturesPaths: ['./res/meshes/glb/textures/mutant_origin.png'],
        raycast: {enabled: true, radius: 1.5},
        pointerEffect: {
          enabled: true,
          pointer: true,
          energyBar: true,
          flameEffect: false,
          flameEmitter: true,
          circlePlane: false,
          circlePlaneTex: true,
          circlePlaneTexPath: './res/textures/rpg/magics/mariasword-2.png',
        }
      }, null, glbFile01);

      // Poenter mouse click
      var glbFile02 = await fetch('./res/meshes/glb/ring1.glb').then(res => res.arrayBuffer().then(buf => uploadGLBModel(buf, this.core.device)));
      this.core.addGlbObjInctance({
        material: {type: 'standard', useTextureFromGlb: false},
        scale: [20, 20, 20],
        position: {x: 0, y: -24, z: -220},
        name: 'mouseTarget',
        texturesPaths: ['./res/textures/default.png'],
        raycast: {enabled: false, radius: 1.5},
        pointerEffect: {
          enabled: true,
          circlePlane: true,
        }
      }, null, glbFile02);
      // ---------

      // make small async - cooking glbs files  mouseTarget_Circle
      setTimeout(() => {

          console.info(`%c ANimation: !!!!!!!!!!!!!!!`, LOG_MATRIX)

        this.mouseTarget = app.getSceneObjectByName('mouseTarget_Circle');
        this.heroe_bodies = app.mainRenderBundle.filter(obj =>
          obj.name && obj.name.includes(this.name)
        );
        this.core.RPG.heroe_bodies = this.heroe_bodies;
        this.core.RPG.heroe_bodies.forEach((subMesh, id) => {
          subMesh.position.thrust = this.moveSpeed;
          subMesh.glb.animationIndex = 0;
          // adapt manual if blender is not setup
          subMesh.glb.glbJsonData.animations.forEach((a, index) => {
            console.info(`%c ANimation: ${a.name} index ${index}`, LOG_MATRIX)
            if(a.name == 'dead') this.heroAnimationArrange.dead = index;
            if(a.name == 'walk') this.heroAnimationArrange.walk = index;
            if(a.name == 'salute') this.heroAnimationArrange.salute = index;
            if(a.name == 'attack') this.heroAnimationArrange.attack = index;
            if(a.name == 'idle') this.heroAnimationArrange.idle = index;
          })
          if(id == 0) subMesh.sharedState.emitAnimationEvent = true;
          this.core.collisionSystem.register(`local${id}`, subMesh.position, 15.0, 'local_hero');
        });
        app.localHero.heroe_bodies[0].effects.flameEmitter.recreateVertexDataRND(1)

        // adapt

        app.localHero.heroe_bodies[0].globalAmbient = [1,1,1,1];
        console.log('app.local', app.localHero.name);
        if (app.localHero.name == 'Slayzer') {
          app.localHero.heroe_bodies[0].globalAmbient = [2,2,3,1];
        } else if (app.localHero.name == '') {
          app.localHero.heroe_bodies[0].globalAmbient = [12,12,12,1]
        }
        
        this.attachEvents();
        // important !!
        // if(app.localHero.heroe_bodies.length > 1) {
        //   app.localHero.heroe_bodies[1].position = app.localHero.heroe_bodies[0].position;
        // }
        for (var x =0; x< app.localHero.heroe_bodies.length;x++){
          if (x>0) app.localHero.heroe_bodies[x].position = app.localHero.heroe_bodies[0].position;
        }

        dispatchEvent(new CustomEvent('local-hero-bodies-ready', {
          detail: "This is not sync - 99% works"
        }))
      }, 2500);
    } catch(err) {throw err;}
  }

  setWalk() {
    this.core.RPG.heroe_bodies.forEach(subMesh => {
      subMesh.glb.animationIndex = this.heroAnimationArrange.walk;
      // console.info(`%chero walk`, LOG_MATRIX)
    });
  }

  setSalute() {
    this.core.RPG.heroe_bodies.forEach(subMesh => {
      subMesh.glb.animationIndex = this.heroAnimationArrange.salute;
      // console.info(`%chero salute`, LOG_MATRIX)
    });
  }

  setDead() {
    this.core.RPG.heroe_bodies.forEach(subMesh => {
      subMesh.glb.animationIndex = this.heroAnimationArrange.dead;
      console.info(`%chero dead`, LOG_MATRIX)
    });
  }

  setIdle() {
    this.core.RPG.heroe_bodies.forEach(subMesh => {
      subMesh.glb.animationIndex = this.heroAnimationArrange.idle;
      // console.info(`%chero idle`, LOG_MATRIX)
    });
  }
  setAttack(on) {
    this.heroFocusAttackOn = on;
    this.core.RPG.heroe_bodies.forEach(subMesh => {
      subMesh.glb.animationIndex = this.heroAnimationArrange.attack;
      console.info(`%chero attack`, LOG_MATRIX)
    });
  }

  attachEvents() {
    addEventListener('attack-magic0', (e) => {
      this.setSalute();
      console.log(e.detail);
      this.core.RPG.heroe_bodies.forEach(subMesh => {
        // level0 have only one instance - more level more instance in visuals context
        console.info(`%cLOADING hero ghostPos`, LOG_MATRIX)
        const distance = 100.0;  // how far in front of hero
        const lift = 0.5;
        // --- rotation.y in degrees → radians
        const yawRad = (subMesh.rotation.y || 0) * Math.PI / 180;
        // --- local forward vector (relative to hero)
        const forward = vec3.normalize([
          Math.sin(yawRad),  // x
          0,                 // y
          Math.cos(yawRad)  // z (rig faces -Z)
        ]);

        // --- compute ghost local offset
        const ghostOffset = vec3.mulScalar(forward, distance);
        ghostOffset[1] += lift;

        // --- apply to local instance position
        subMesh.instanceTargets[1].position = ghostOffset;

        setTimeout(() => {
          subMesh.instanceTargets[1].position[0] = 0;
          subMesh.instanceTargets[1].position[2] = 0;
          console.log("? ", this.setWalk)
          this.setWalk()
        }, 1300)
      });

    })

    // Events HERO MOVMENTS
    addEventListener('set-walk', () => {
      this.setWalk();
    })
    addEventListener('set-idle', () => {
      this.setIdle();
    })
    addEventListener('set-attach', () => {
      this.setAttach();
    })
    addEventListener('set-dead', () => {
      this.setDead();
    })
    addEventListener('set-salute', () => {
      this.setSalute();
    })

    addEventListener('close-distance', (e) => {
      console.info('close distance with:', e.detail.A)
      if(this.heroFocusAttackOn && this.heroFocusAttackOn.name.indexOf(e.detail.A.id) != -1) {
        // this.setAttack(this.heroFocusAttackOn);
      }
      // still attack
      this.setAttack(this.heroFocusAttackOn);
    })

    // must be sync with networking... in future
    // -------------------------------------------
    // console.log('ANIMATION END INITIAL NAME ', this.name)
    addEventListener(`animationEnd-${this.name}`, (e) => {
      // CHECK DISTANCE
      if(e.detail.animationName != 'attack') {
        // // if(this.heroFocusAttackOn == null) { ?? maybe
        // this.setIdle();
        return;
      }

      if(this.heroFocusAttackOn == null) {
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
          }
        })
        if(isEnemiesClose == false) this.setIdle();
        return;
      }
      else {
        // Focus on enemy
        if (this.core.enemies.enemies.length >0) this.core.enemies.enemies.forEach((enemy) => {
          if(this.heroFocusAttackOn.name.indexOf(enemy.name) != -1) {
            let tt = this.core.RPG.distance3D(
              this.heroe_bodies[0].position,
              this.heroFocusAttackOn.position);
            if(tt < this.core.RPG.distanceForAction) {
              console.log(`%c ATTACK DAMAGE ${enemy.heroe_bodies[0].name}`, LOG_MATRIX)
              this.calcDamage(this, enemy);
              return;
            }
          }
        })

        if (this.core.enemies.creeps.length >0) this.core.enemies.creeps.forEach((enemy) => {
          if(this.heroFocusAttackOn.name.indexOf(enemy.name) != -1) {
            let tt = this.core.RPG.distance3D(
              this.heroe_bodies[0].position,
              this.heroFocusAttackOn.position);
            if(tt < this.core.RPG.distanceForAction) {
              console.log(`%c ATTACK DAMAGE ${enemy.heroe_bodies[0].name}`, LOG_MATRIX)
              this.calcDamage(this, enemy);
            }
          }
        })
      }
    })

    addEventListener('onTargetPositionReach', (e) => {
      // for now only local hero
      if(this.heroFocusAttackOn == null) {
        let isEnemiesClose = false; // on close distance 
        this.core.enemies.enemies.forEach((enemy) => {
          let tt = this.core.RPG.distance3D(
            this.heroe_bodies[0].position,
            enemy.heroe_bodies[0].position);
          if(tt < this.core.RPG.distanceForAction) {
            console.log(`%c ATTACK DAMAGE ${enemy.heroe_bodies[0].name}`, LOG_MATRIX)
            isEnemiesClose = true;
            this.calcDamage(this, enemy);
          }
        })
        if(isEnemiesClose == false) this.setIdle();
      }
    })

    addEventListener('onMouseTarget', (e) => {
      // for now only local hero
      if(this.core.RPG.selected.includes(this.heroe_bodies[0])) {
        // console.log("onMouseTarget POS:", e.detail.type);
        this.mouseTarget.position.setPosition(e.detail.x, this.mouseTarget.position.y, e.detail.z)
        if(e.detail.type == "attach") {
          this.mouseTarget.effects.circlePlane.instanceTargets[0].color = [1, 0, 0, 0.9];
        } else {
          this.mouseTarget.effects.circlePlane.instanceTargets[0].color = [0.6, 0.8, 1, 0.4];
        }
      }
    })
  }
}
