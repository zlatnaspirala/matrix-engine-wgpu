import {vec3, mat4} from "wgpu-matrix";
import {uploadGLBModel} from "../../../src/engine/loaders/webgpu-gltf";
import {byId, LOG_MATRIX} from "../../../src/engine/utils";
import {Hero, HERO_PROFILES} from "./hero";
import {Creep} from "./creep-character";
import {followPath} from "./nav-mesh";
import {creepPoints, startUpPositions} from "./static";
import {FriendlyHero} from "./friendly-character";

export class Character extends Hero {

  friendlyLocal = {
    heroes: [],
    creeps: []
  };

  creepThrust = 0.85;

  heroAnimationArrange = {
    dead: null,
    walk: null,
    salute: null,
    attack: null,
    idle: null
  };

  friendlyCreepAnimationArrange = {
    dead: null,
    walk: null,
    salute: null,
    attack: null,
    idle: null
  };

  heroFocusAttackOn = null;
  mouseTarget = null;

  gold = 100;

  constructor(forestOfHollowBlood, path, name = 'MariaSword', archetypes = ["Warrior", "Mage"]) {
    super(name, archetypes);
    console.info(`%cLOADING local hero name : ${name}`, LOG_MATRIX)
    console.info(`%cLOADING local hero forestOfHollowBlood.player.data : ${forestOfHollowBlood.player.data}`, LOG_MATRIX)

    this.name = name;
    this.core = forestOfHollowBlood;
    this.heroe_bodies = [];

    this.loadLocalHero(path);
    this.loadfriendlyCreeps();
    // async
    setTimeout(() => this.setupHUDForHero(name), 1100);
  }

  setupHUDForHero(name) {
    console.info(`%cLOADING hero name : ${name}`, LOG_MATRIX)
    // if(name == 'MariaSword') {
    for(var x = 1;x < 5;x++) {
      byId(`magic-slot-${x - 1}`).style.background = `url("./res/textures/rpg/magics/${name.toLowerCase()}-${x}.png")`;
      byId(`magic-slot-${x - 1}`).style.backgroundRepeat = "round";
    }
    byId('hudLeftBox').style.background = `url('./res/textures/rpg/hero-image/${name.toLowerCase()}.png')  center center / cover no-repeat`;
    byId('hudDesriptionText').innerHTML = app.label.get[name.toLowerCase()];
  }

  async loadfriendlyCreeps() {
    this.friendlyLocal.creeps.push(new Creep({
      core: this.core,
      name: 'friendly_creeps0',
      archetypes: ["creep"],
      path: 'res/meshes/glb/bot.glb',
      position: {x: 0, y: -23, z: 0}
    }, ['creep'], 'friendly', app.player.data.team));
    this.friendlyLocal.creeps.push(new Creep({
      core: this.core,
      name: 'friendly_creeps1',
      archetypes: ["creep"],
      path: 'res/meshes/glb/bot.glb',
      position: {x: 150, y: -23, z: 0}
    }, ['creep'], 'friendly', app.player.data.team));
    this.friendlyLocal.creeps.push(new Creep({
      core: this.core,
      name: 'friendly_creeps2',
      archetypes: ["creep"],
      path: 'res/meshes/glb/bot.glb',
      position: {x: 100, y: -23, z: 0}
    }, ['creep'], 'friendly', app.player.data.team));

    setTimeout(() => {
      // console.info('setAllCreepsAtStartPos')
      app.localHero.setAllCreepsAtStartPos().then(() => {
        console.log('passed in first')
      }).catch(() => {
        setTimeout(() => {
          app.localHero.setAllCreepsAtStartPos().then(() => {
            console.log('passed in socound')
          }).catch(() => {
            alert('FAILD');
          })
        }, 5000)
      });
    }, 15000);

  }

  async loadLocalHero(p) {
    try {
      var glbFile01 = await fetch(p).then(res => res.arrayBuffer().then(buf => uploadGLBModel(buf, this.core.device)));
      this.core.addGlbObjInctance({
        material: {type: 'standard', useTextureFromGlb: true},
        scale: [20, 20, 20],
        position: {
          x: startUpPositions[this.core.player.data.team][0],
          y: startUpPositions[this.core.player.data.team][1],
          z: startUpPositions[this.core.player.data.team][2]
        },
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
          circlePlaneTexPath: './res/textures/star1.png',
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
          // circlePlane: true,
          circlePlaneTex: true,
          circlePlaneTexPath: './res/textures/star1.png',
        }
      }, null, glbFile02);
      // ---------
      // make small async - cooking glbs files  mouseTarget_Circle
      this.setupHero().then(() => {
        //
      }).catch(() => {
        this.setupHero().then(() => {}).catch(() => {})
      })
    } catch(err) {throw err;}
  }

  setupHero() {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        console.info(`%cAnimation setup...`, LOG_MATRIX)
        this.mouseTarget = app.getSceneObjectByName('mouseTarget_Circle');
        this.mouseTarget.animationSpeed = 20000;

        if(typeof app.localHero.mouseTarget.instanceTargets === 'undefined') {
          reject();
          return;
        }
        app.localHero.mouseTarget.instanceTargets[1].position[1] = 1;
        app.localHero.mouseTarget.instanceTargets[1].scale = [0.4, 0.4, 0.4];

        this.heroe_bodies = app.mainRenderBundle.filter(obj =>
          obj.name && obj.name.includes(this.name)
        );
        this.core.RPG.heroe_bodies = this.heroe_bodies;
        this.core.RPG.heroe_bodies.forEach((subMesh, id) => {
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
          })
          if(id == 0) subMesh.sharedState.emitAnimationEvent = true;
          this.core.collisionSystem.register(`local${id}`, subMesh.position, 15.0, 'local_hero');
        });
        if(app.localHero.heroe_bodies[0].effects) {
          app.localHero.heroe_bodies[0].effects.flameEmitter.recreateVertexDataRND(1);
        } else {
          alert(`what is app.localHero.heroe_bodies[0] ${app.localHero.heroe_bodies[0]} `);
        }

        // adapt
        app.localHero.heroe_bodies[0].globalAmbient = [1, 1, 1, 1];
        if(app.localHero.name == 'Slayzer') {
          app.localHero.heroe_bodies[0].globalAmbient = [2, 2, 3, 1];
        } else if(app.localHero.name == 'Steelborn') {
          app.localHero.heroe_bodies[0].globalAmbient = [12, 12, 12, 1]
        }

        app.localHero.heroe_bodies[0].effects.circlePlaneTex.rotateEffectSpeed = 0.1;

        this.attachEvents();
        // important!
        for(var x = 0;x < app.localHero.heroe_bodies.length;x++) {
          if(x > 0) {
            app.localHero.heroe_bodies[x].position = app.localHero.heroe_bodies[0].position;
            app.localHero.heroe_bodies[x].rotation = app.localHero.heroe_bodies[0].rotation;
          }
        }
        // activete net pos emit - becouse uniq name of hero body set net id by scene obj name simple
        // app.localHero.heroe_bodies[0].position.netObject = app.net.session.connection.connectionId;
        // not top solution - for now . High cost - precision good.
        app.localHero.heroe_bodies[0].position.netObject = app.localHero.heroe_bodies[0].name;
        // DISABLED
        // app.net.multiPlayer.onFollowPath = (e) => {
        //   console.log('e.data.followPath.start' , e.data.followPath.start)
        //   let remoteEnemy = this.core.enemies.enemies.find((enemy => enemy.name === e.data.heroName))
        //   remoteEnemy.remoteNav(e.data.followPath.end);
        // }
        // for now net view for rot is axis separated - cost is ok for orientaion remote pass
        app.localHero.heroe_bodies[0].rotation.emitY = app.localHero.heroe_bodies[0].name;
        dispatchEvent(new CustomEvent('local-hero-bodies-ready', {
          detail: `This is not sync - 99% works`
        }))
      }, 5000); // return to 2 -3 - testing on 3-4 on same computer
    })
  }

  async loadFriendlyHero(p) {
    try {
      this.friendlyLocal.heroes.push(new FriendlyHero(
        {
          core: this.core,
          name: p.hero,
          archetypes: p.archetypes,
          path: p.path,
          position: {x: 0, y: -23, z: 0}
        }
      ));
    } catch(err) {
      console.error(err);
    }
  }

  setAllCreepsAtStartPos = () => {
    return new Promise((resolve, reject) => {
      try {
        this.friendlyLocal.creeps.forEach((subMesh_) => {
          if(typeof subMesh_.heroe_bodies === 'undefined') {
            reject();
            return;
          }
        })
        // console.info(`%c promise pass setAllCreepsAtStartPos...`, LOG_MATRIX)
        this.friendlyLocal.creeps.forEach((subMesh_, id) => {
          let subMesh = subMesh_.heroe_bodies[0];
          subMesh.position.thrust = subMesh_.moveSpeed;
          subMesh.glb.animationIndex = 0;
          // adapt manual if blender is not setup
          subMesh.glb.glbJsonData.animations.forEach((a, index) => {
            // console.info(`%c ANimation: ${a.name} index ${index}`, LOG_MATRIX)
            if(a.name == 'dead') this.friendlyCreepAnimationArrange.dead = index;
            if(a.name == 'walk') this.friendlyCreepAnimationArrange.walk = index;
            if(a.name == 'salute') this.friendlyCreepAnimationArrange.salute = index;
            if(a.name == 'attack') this.friendlyCreepAnimationArrange.attack = index;
            if(a.name == 'idle') this.friendlyCreepAnimationArrange.idle = index;
          })
          // if(id == 0) subMesh.sharedState.emitAnimationEvent = true;
          // this.core.collisionSystem.register(`local${id}`, subMesh.position, 15.0, 'local_hero');
        });

        app.localHero.friendlyLocal.creeps.forEach((creep, index) => {
          creep.heroe_bodies[0].position.setPosition(
            startUpPositions[this.core.player.data.team][0] + (index + 1) * 50,
            startUpPositions[this.core.player.data.team][1],
            startUpPositions[this.core.player.data.team][2] + (index + 1) * 50);
        })

        resolve();
        // if(this.core.net.virtualEmiter != null) {
        //   console.info(`%c virtualEmiter use navigateCreeps `, LOG_MATRIX)
        //   this.navigateCreeps();
        // }
      } catch(err) {
        console.info('errr in ', err)
      }
    })
  }

  navigateCreeps() {
    // console.log('navigateCreeps()');
    app.localHero.friendlyLocal.creeps.forEach((creep, index) => {
      this.navigateCreep(creep, index);
    })
  }

  distance3DArrayInput(a, b) {
    const dx = a[0] - b[0];
    const dy = a[1] - b[1];
    const dz = a[2] - b[2];
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  navigateCreep(creep, index) {
    if(creep.creepFocusAttackOn != null) {
      // console.log('test attacher nuuu return ');
      return;
    }
    creep.firstPoint = creepPoints[this.core.player.data.team].firstPoint;
    creep.finalPoint = creepPoints[this.core.player.data.team].finalPoint;
    const start = [creep.heroe_bodies[0].position.x, creep.heroe_bodies[0].position.y, creep.heroe_bodies[0].position.z];
    let test = this.distance3DArrayInput(creep.firstPoint, start);
    if(test < 20) {
      creep.gotoFinal = true;
    }
    const end = [creep.firstPoint[0], creep.firstPoint[1], creep.firstPoint[2]];
    const endFinal = [creep.finalPoint[0], creep.finalPoint[1], creep.finalPoint[2]];

    let path;
    if(creep.gotoFinal) {
      if(creep.gotoFinal == true) {
        path = this.core.RPG.nav.findPath(start, endFinal);
      } else {
        path = this.core.RPG.nav.findPath(start, end);
      }
    } else {
      path = this.core.RPG.nav.findPath(start, end);
    }
    if(!path || path.length === 0) {console.warn('No valid path found.'); return;}
    this.setWalkCreep(index);
    followPath(creep.heroe_bodies[0], path, this.core);
  }

  setWalk() {
    this.core.RPG.heroe_bodies.forEach((subMesh, index) => {
      subMesh.glb.animationIndex = this.heroAnimationArrange.walk;
      // console.info(`%chero walk`, LOG_MATRIX)
      if(index == 0) app.net.send({
        sceneName: subMesh.name,
        animationIndex: subMesh.glb.animationIndex
      })
    });
  }

  setSalute() {
    this.core.RPG.heroe_bodies.forEach((subMesh, index) => {
      subMesh.glb.animationIndex = this.heroAnimationArrange.salute;
      // console.info(`%chero salute`, LOG_MATRIX)
      if(index == 0) app.net.send({
        sceneName: subMesh.name,
        animationIndex: subMesh.glb.animationIndex
      })
    });
  }

  setDead() {
    this.core.RPG.heroe_bodies.forEach((subMesh, index) => {
      subMesh.glb.animationIndex = this.heroAnimationArrange.dead;
      if(index == 0) app.net.send({
        sceneName: subMesh.name,
        animationIndex: subMesh.glb.animationIndex
      })
      console.info(`%chero dead`, LOG_MATRIX)
    });
  }

  setIdle() {
    this.core.RPG.heroe_bodies.forEach((subMesh, index) => {
      subMesh.glb.animationIndex = this.heroAnimationArrange.idle;
      // console.info(`%chero idle`, LOG_MATRIX)
      if(index == 0) app.net.send({
        sceneName: subMesh.name,
        animationIndex: subMesh.glb.animationIndex
      })
    });
  }

  setAttack(on) {
    this.heroFocusAttackOn = on;
    this.core.RPG.heroe_bodies.forEach(subMesh => {
      subMesh.glb.animationIndex = this.heroAnimationArrange.attack;
      console.info(`%c ${subMesh.name} BEFORE SEND attack index ${subMesh.glb.animationIndex}`, LOG_MATRIX)
      app.net.send({
        sceneName: subMesh.name,
        animationIndex: subMesh.glb.animationIndex
      })
    });
  }

  setWalkCreep(creepIndex) {
    console.info(`%cfriendly setWalkCreep!`, LOG_MATRIX)
    if(this.friendlyLocal.creeps[creepIndex].heroe_bodies[0].glb.animationIndex != this.friendlyCreepAnimationArrange.walk) {
      this.friendlyLocal.creeps[creepIndex].heroe_bodies[0].glb.animationIndex = this.friendlyCreepAnimationArrange.walk;
      // app.net.send({
      //   remoteName: this.friendlyLocal.creeps[creepIndex].heroe_bodies[0].position.remoteName,
      //   sceneName: 'not in use',
      //   animationIndex: this.friendlyLocal.creeps[creepIndex].heroe_bodies[0].glb.animationIndex
      // })

      // this.friendlyLocal.creeps[creepIndex].heroe_bodies[0]
      // // logic is only for two team - index 0 is local !!!
      // if(this.teams[0].length > 0) app.net.send({
      //   // team: this.teams[0],
      //   toRemote: this.teams[0], // default null remote conns
      //   // remoteName: this.remoteName,
      //   sceneName: this.netObject, // origin scene name to receive
      //   netPos: {x: this.x, y: this.y, z: this.z},
      // });

      // // remove if (this.teams[1].length > 0)  after alll this is only for CASE OF SUM PLAYER 3 FOR TEST ONLY
      // if(this.teams[1].length > 0) app.net.send({
      //   // team: this.teams[1],
      //   toRemote: this.teams[1], // default null remote conns
      //   remoteName: this.remoteName, // to enemy players
      //   sceneName: this.netObject, // now not important
      //   netPos: {x: this.x, y: this.y, z: this.z},
      // });


    }
  }

  setAttackCreep(creepIndex) {
    // console.info(`%cfriendly creep attack enemy!`, LOG_MATRIX)
    if(this.friendlyLocal.creeps[creepIndex].heroe_bodies[0].glb.animationIndex != this.friendlyCreepAnimationArrange.attack) {
      this.friendlyLocal.creeps[creepIndex].heroe_bodies[0].glb.animationIndex = this.friendlyCreepAnimationArrange.attack;
      // app.net.send({
      //   remoteName: this.friendlyLocal.creeps[creepIndex].heroe_bodies[0].position.remoteName,
      //   sceneName: 'not in use',
      //   animationIndex: this.friendlyLocal.creeps[creepIndex].heroe_bodies[0].glb.animationIndex
      // })
    }
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
    // Events HERO pos
    addEventListener('set-walk', () => {
      this.setWalk();
    })
    addEventListener('set-idle', () => {
      this.setIdle();
    })
    addEventListener('set-attack', () => {
      this.setAttack();
    })
    addEventListener('set-dead', () => {
      this.setDead();
    })
    addEventListener('set-salute', () => {
      this.setSalute();
    })

    addEventListener('close-distance', (e) => {
      // console.info('close distance :', e.detail)
      if((e.detail.A.id.indexOf('friendly') != -1 && e.detail.B.id.indexOf('friendly') != -1) ||
        (e.detail.A.group == "local_hero" && e.detail.B.id.indexOf('friendly') != -1) ||
        (e.detail.A.group == "friendly" && e.detail.B.group == "local_hero")) {
        // console.info('close distance BOTH friendly :', e.detail.A)
        return;
      }
      // nisu 2 local creeps
      if(e.detail.A.group == "enemy") {
        if(e.detail.B.group == "friendly") {
          //------------------ BLOCK
          let lc = app.localHero.friendlyLocal.creeps.filter((localCreep) => localCreep.name == e.detail.B.id)[0];
          lc.creepFocusAttackOn =
            app.enemies.enemies.filter((enemy) => enemy.name == e.detail.A.id)[0];
          if(lc.creepFocusAttackOn === undefined) {
            lc.creepFocusAttackOn = app.enemies.creeps.filter((creep) => creep.name == e.detail.B.id)[0];
          }
          app.localHero.setAttackCreep(e.detail.B.id[e.detail.B.id.length - 1]);
          // console.info('creep vs creep ')
        }
      } else if(e.detail.A.group == "friendly") {
        // console.info('close distance A is friendly:', e.detail.A.group)
        if(e.detail.B.group == "enemy") {
          // console.info('close distance B is enemies:', e.detail.A.group)
          //------------------
          //------------------ BLOCK
          let lc = app.localHero.friendlyLocal.creeps.filter((localCreep) => localCreep.name == e.detail.A.id)[0];
          lc.creepFocusAttackOn =
            app.enemies.enemies.filter((enemy) => enemy.name == e.detail.B.id)[0];
          if(lc.creepFocusAttackOn == undefined) {
            lc.creepFocusAttackOn = app.enemies.creeps.filter((creep) => creep.name == e.detail.B.id)[0];
          }
          app.localHero.setAttackCreep(e.detail.A.id[e.detail.A.id.length - 1]);
          // console.info('creep vs creep ')
          // console.info('close distance A is friendly:', e.detail.A.group)
        }
      }
      // if(this.heroFocusAttackOn && this.heroFocusAttackOn.name.indexOf(e.detail.A.id) != -1) {
      //   // this.setAttack(this.heroFocusAttackOn);
      // }
      if(e.detail.A.group == 'local_hero' || e.detail.B.group == 'local_hero') {
        // probably friend - works only got creeps < 10 for now
        this.setAttack(this.heroFocusAttackOn);
      }
    })

    addEventListener(`animationEnd-${this.heroe_bodies[0].name}`, (e) => {
      // CHECK DISTANCE
      if(e.detail.animationName != 'attack') {
        //--------------------------------
        return;
        //--------------------------------
      }
      if(this.heroFocusAttackOn == null) {
        // console.info('animationEnd [heroFocusAttackOn == null ]', e.detail.animationName)
        let isEnemiesClose = false; // on close distance 
        this.core.enemies.enemies.forEach((enemy) => {
          if(enemy.heroe_bodies) {
            let tt = this.core.RPG.distance3D(
              this.heroe_bodies[0].position,
              enemy.heroe_bodies[0].position);
            if(tt < this.core.RPG.distanceForAction) {
              console.log(`%cATTACK DAMAGE ${enemy.heroe_bodies[0].name}`, LOG_MATRIX)
              isEnemiesClose = true;
              this.calcDamage(this, enemy);
            }
          }
        })
        if(isEnemiesClose == false) this.setIdle();
        return;
      }
      else {
        // Focus on enemy
        if(this.core.enemies.enemies.length > 0) this.core.enemies.enemies.forEach((enemy) => {
          if(this.heroFocusAttackOn.name.indexOf(enemy.name) != -1) {
            let tt = this.core.RPG.distance3D(
              this.heroe_bodies[0].position,
              this.heroFocusAttackOn.position);
            if(tt < this.core.RPG.distanceForAction) {
              console.log(`%cATTACK DAMAGE [lhero on enemy hero] ${enemy.heroe_bodies[0].name}`, LOG_MATRIX)
              this.calcDamage(this, enemy);
              return;
            }
          }
        })

        if(this.core.enemies.creeps.length > 0) this.core.enemies.creeps.forEach((creep) => {
          if(this.heroFocusAttackOn.name.indexOf(creep.name) != -1) {
            let tt = this.core.RPG.distance3D(
              this.heroe_bodies[0].position,
              this.heroFocusAttackOn.position);
            if(tt < this.core.RPG.distanceForAction) {
              console.log(`%cATTACK DAMAGE [lhero on creep] ${creep.heroe_bodies[0].name}`, LOG_MATRIX)
              this.calcDamage(this, creep);
            }
          }
        })
      }
    })

    // This is common for all kineamtic bodies
    addEventListener('onTargetPositionReach', (e) => {

      if(e.detail.name.indexOf('friendly-creep') != -1) {
        let getName = e.detail.name.split('_')[0];
        let t = app.localHero.friendlyLocal.creeps.filter((obj) => obj.name == getName);
        if(t[0].creepFocusAttackOn != null) {
          // console.log(`%[character base]onTargetPositionReach 
          //  creepFocusAttackOn : ${t[0].creepFocusAttackOn}`, LOG_MATRIX)
          return;
        }

        let testz = e.detail.body.position.z - t[0].firstPoint[2];
        let testx = e.detail.body.position.x - t[0].firstPoint[0];
        if(testz > 15 && testx > 15) {
          // got to first point  t[0] for now only  one sub mesh per creep...
          const start = [t[0].heroe_bodies[0].position.x, t[0].heroe_bodies[0].position.y, t[0].heroe_bodies[0].position.z];
          const path = this.core.RPG.nav.findPath(start, t[0].firstPoint);
          if(!path || path.length === 0) {console.warn('No valid path found.'); return;}
          // getName[getName.length-1] becouse for now creekps have sum < 10
          console.log('followPath creep to the FIRST POINT....')
          setTimeout(() => {
            this.setWalkCreep(getName[getName.length - 1]);
            followPath(t[0].heroe_bodies[0], path, app)
          }, 1000);
        } else {
          // goto final
          // console.log('SEND TO last POINT POINT to the enemy home....', t[0].finalPoint)
          const start = [t[0].heroe_bodies[0].position.x, t[0].heroe_bodies[0].position.y, t[0].heroe_bodies[0].position.z];
          const path = this.core.RPG.nav.findPath(start, t[0].finalPoint);
          if(!path || path.length === 0) {console.warn('No valid path found.'); return;}
          // getName[getName.length-1] becouse for now creekps have sum < 10
          // at the end finalPoint will be point of enemy base!
          setTimeout(() => {
            followPath(t[0].heroe_bodies[0], path, app)
            this.setWalkCreep(getName[getName.length - 1]);
          }, 1000);
        }
        //--------------------------------
        return;
        //--------------------------------
      }

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
      if(this.core.RPG.selected.includes(this.heroe_bodies[0])) {
        // console.log("onMouseTarget POS:", e.detail.type);
        this.mouseTarget.position.setPosition(e.detail.x, this.mouseTarget.position.y, e.detail.z)
        if(e.detail.type == "attach") {
          this.mouseTarget.effects.circlePlaneTex.instanceTargets[0].color = [1, 0, 0, 0.9];
        } else {
          this.mouseTarget.effects.circlePlaneTex.instanceTargets[0].color = [0.6, 0.8, 1, 0.4];
        }
      }
    })

    addEventListener('navigate-friendly_creeps', (e) => {
      if(e.detail.localCreepNav) {
        console.log(`%c navigate creep ${e.detail.localCreepNav}  index : ${e.detail.index}`, LOG_MATRIX)
        this.navigateCreep(e.detail.localCreepNav, e.detail.index);
      } else {
        this.navigateCreeps();
      }
    })

    addEventListener('updateLocalHeroGold', (e) => {
      this.gold += e.detail.gold;
    })
  }
}
