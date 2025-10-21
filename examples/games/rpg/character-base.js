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
    if(name == 'MariaSword') {
      byId('magic-slot-0').style.background = 'url("./res/textures/rpg/magics/maria-sword-1.png")';
      byId('magic-slot-0').style.backgroundRepeat = "round";
      byId('magic-slot-1').style.background = 'url("./res/textures/rpg/magics/maria-sword-2.png")';
      byId('magic-slot-1').style.backgroundRepeat = "round";
      byId('magic-slot-2').style.background = 'url("./res/textures/rpg/magics/maria-sword-3.png")';
      byId('magic-slot-2').style.backgroundRepeat = "round";
      byId('magic-slot-3').style.background = 'url("./res/textures/rpg/magics/maria-sword-4.png")';
      byId('magic-slot-3').style.backgroundRepeat = "round";
    }
  }

  async loadLocalHero(p) {
    try {
      var glbFile01 = await fetch(p).then(res => res.arrayBuffer().then(buf => uploadGLBModel(buf, this.core.device)));
      this.core.addGlbObjInctance({
        material: {type: 'standard', useTextureFromGlb: true},
        scale: [20, 20, 20],
        position: {x: 0, y: -23, z: -220},
        name: this.name,
        texturesPaths: ['./res/meshes/glb/textures/mutant_origin.png'],
        raycast: {enabled: true, radius: 1.5},
        pointerEffect: {
          enabled: true,
          pointer: true,
          energyBar: true,
          flameEffect: false,
          flameEmitter: true,
          circlePlane: true,
          circlePlaneTex: true,
          circlePlaneTexPath: './res/textures/rpg/symbols/star.png',
        }
      }, null, glbFile01);

      // -------------------------

      // poenter mouse click
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
        this.attachEvents();
        dispatchEvent(new CustomEvent('local-hero-bodies-ready', {
          detail: "This is not sync - 99% works"
        }))
      }, 1500)

    } catch(err) {throw err;}
  }

  setWalk() {
    console.log('set walk base ')
    this.core.RPG.heroe_bodies.forEach(subMesh => {
      subMesh.glb.animationIndex = this.heroAnimationArrange.walk;
      console.info(`%chero walk`, LOG_MATRIX)
    });
  }

  setSalute() {
    this.core.RPG.heroe_bodies.forEach(subMesh => {
      subMesh.glb.animationIndex = this.heroAnimationArrange.salute;
      console.info(`%chero salute`, LOG_MATRIX)
    });
  }

  setDead() {
    this.core.RPG.heroe_bodies.forEach(subMesh => {
      subMesh.glb.animationIndex = this.heroAnimationArrange.dead;
      console.info(`%chero dead`, LOG_MATRIX)
    });
  }

  setIdle() {
    console.log('set idle base ')
    this.core.RPG.heroe_bodies.forEach(subMesh => {
      subMesh.glb.animationIndex = this.heroAnimationArrange.idle;
      console.info(`%chero idle`, LOG_MATRIX)
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
      console.log(e.detail);

      this.core.RPG.heroe_bodies.forEach(subMesh => {
        this.setSalute();
        // level0 have only one instance - more level more instance in visuals context
        console.info(`%cLOADING hero ghostPos`, LOG_MATRIX)
        const distance = 80.0;  // how far in front of hero
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

          console.log("?? ", this.setWalk)
          this.setWalk()
        }, 1300)
      });

    })

    // Events HERO MOVMENTS
    addEventListener('set-walk', () => {
      console.log('set walk 1 ')
      this.setWalk();
    })
    addEventListener('set-idle', () => {
      console.log('set idle 1 ')
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
      console.log('close distance - ', e.detail.A)
      if(this.heroFocusAttackOn && this.heroFocusAttackOn.name.indexOf(e.detail.A.id) != -1) {
        this.setAttack(this.heroFocusAttackOn);
      }
      // still attack
        this.setAttack(this.heroFocusAttackOn);
      // this.x = this.targetX;
      // this.y = this.targetY;
      // this.z = this.targetZ;
      // this.inMove = false;
      // this.onTargetPositionReach();
    })
    // must be sync with networking... in future
    // -------------------------------------------
    // console.log('ANIMATION END INITIAL NAME ', this.name)
    addEventListener(`animationEnd-${this.name}`, (e) => {
      // CHECK DISTANCE
      if(e.detail.animationName != 'attack') {
        // future
        // console.log('it is not attack + ')
        // // if(this.heroFocusAttackOn == null) { ?? maybe
        // this.setIdle();
        return;
      }

      if(this.heroFocusAttackOn == null) {
        console.log('ANIMATION END setIdle:', e.detail.animationName)
        this.setIdle();
        return;
      }

      this.core.enemies.enemies.forEach((enemy) => {
        if(this.heroFocusAttackOn.name.indexOf(enemy.name) != -1) {
          let tt = this.core.RPG.distance3D(
            this.heroe_bodies[0].position,
            this.heroFocusAttackOn.position);
          if(tt < this.core.RPG.distanceForAction) {
            console.log('Attack on :', this.heroFocusAttackOn.name)
            console.log('%c ATTACK DAMAGE CALC ', LOG_MATRIX)
            this.calcDamage(this, enemy);
          }
        }
      })
    })

    addEventListener('onTargetPositionReach', (e) => {
      console.log("Target pos reached. setIdle", e.detail);
      // for now only local hero
      if(this.heroFocusAttackOn == null) {
        this.setIdle();
      }
    })

    addEventListener('onMouseTarget', (e) => {
      // for now only local hero
      if(this.core.RPG.selected.includes(this.heroe_bodies[0])) {
        console.log("onMouseTarget POS >>>>>", e.detail.type);
        this.mouseTarget.position.setPosition(e.detail.x, this.mouseTarget.position.y, e.detail.z)
        if(e.detail.type == "attach") {
          this.mouseTarget.effects.circlePlane.instanceTargets[0].color = [1, 0, 0, 0.9];
        } else {
          this.mouseTarget.effects.circlePlane.instanceTargets[0].color = [0.6, 0.8, 1, 0.4];
        }
      }
    })

    // -------------------------------------------
  }
}
