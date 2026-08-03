import {randomIntFromTo, vecOf} from "matrix-engine-wgpu";
import {mapParams} from "./table-params";

const DEG2RAD = Math.PI / 180;
const RAD2DEG = 180 / Math.PI;

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
            // console.info(`%c Animation loading for creeps: ${a.name} index ${index}`, LOG_MATRIX)
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
    // const head = this.zombie_bodies[0];
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
    addEventListener(`animationEnd-${this.zombie_bodies[0].name}`, (e) => {
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