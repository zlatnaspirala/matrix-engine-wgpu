import {flameEffect} from "../../shaders/flame-effect/flameEffect";
import {pointerEffect} from "../../shaders/standalone/pointer.effect";
import {FlameEffect} from "../effects/flame";
import {FlameEmitter} from "../effects/flame-emmiter";
import {KaleidoscopeEffect} from "../effects/KaleidoscopeEffect";
import {KaleidoscopeEmitter} from "../effects/kaleidoscopeEffectInstance";
import {randomIntFromTo} from "../utils";

/**
 * @description
 * ProjectileSystem — FPS projectile manager for the beast
 *
 * Two modes:
 *   hitscan    — instant raycast, no moving mesh (bullets)
 *   projectile — moving mesh using Position.translateByXYZ (rockets)
 *
 * Position.update() is called by the engine each frame automatically.
 * Hook collision check into your game loop manually — see comment below.
 */
export class ProjectileSystem {
  /**
   * @param {object} engine       — MatrixEngineWGPU instance
   * @param {object} mesh         — cube mesh for projectile/decal visuals
   * @param {object} collision    — CollisionSystem instance
   * @param {object} [opts]
   * @param {number} [opts.projectileSpeed=0.8]
   * @param {number} [opts.projectileLifetime=3000]  — ms before auto-despawn
   * @param {number} [opts.projectileScale=0.15]
   * @param {string} [opts.projectileTex]
   * @param {string} [opts.decalTex]
   * @param {number} [opts.decalSize=0.4]
   * @param {number} [opts.decalLifetime=2000]
   * @param {Function} [opts.onHitscanHit]    — callback(hitPoint, normal, reflect, entry)
   * @param {Function} [opts.onProjectileHit] — callback(hitPoint, normal, entry)
   */
  constructor(engine, mesh, collision, opts = {}) {
    this.engine = engine;
    this.mesh = mesh;
    this.collision = collision;
    this.cam = this.engine.getCamera();

    this._speed = opts.projectileSpeed ?? 1;
    this._lifetime = opts.projectileLifetime ?? 4000;
    this._scale = opts.projectileScale ?? 0.25;
    this._tex = opts.projectileTex ?? './res/textures/shooter/decal.webp';
    this._decalTex = opts.decalTex ?? './res/textures/shooter/decal.webp';
    this._decalSize = opts.decalSize ?? 0.2;
    this._decalLifetime = opts.decalLifetime ?? 2000;

    this.onHitscanHit = opts.onHitscanHit ?? null;
    this.onProjectileHit = opts.onProjectileHit ?? null;

    this._projectiles = [];
    this._uid = 0;
    this._maxDecals = opts.maxDecals ?? 40;
    this._decals = [];
    this.pArg = {name: null, obj: null, dir: null};
  }

  _getCameraState() {
    const ox = this.cam.position[0];
    const oy = this.cam.position[1];
    const oz = this.cam.position[2];
    const dx = -this.cam.back[0];
    const dy = -this.cam.back[1];
    const dz = -this.cam.back[2];
    const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
    return {
      origin: {x: ox, y: oy, z: oz},
      dir: {x: dx / len, y: dy / len, z: dz / len},
      cam: this.cam
    };
  }

  _rayVsAABB(ro, rd, entry) {
    const h = entry.half ?? {x: 1, y: 1, z: 1};
    const mn = {x: entry.pos.x - h.x, y: entry.pos.y - h.y, z: entry.pos.z - h.z};
    const mx = {x: entry.pos.x + h.x, y: entry.pos.y + h.y, z: entry.pos.z + h.z};

    let tmin = -Infinity, tmax = Infinity;
    let hitAxis = 'x', hitSign = 1;

    for(const axis of ['x', 'y', 'z']) {
      if(Math.abs(rd[axis]) < 1e-8) {
        if(ro[axis] < mn[axis] || ro[axis] > mx[axis]) return null;
      } else {
        const t1 = (mn[axis] - ro[axis]) / rd[axis];
        const t2 = (mx[axis] - ro[axis]) / rd[axis];
        const tN = Math.min(t1, t2);
        const tF = Math.max(t1, t2);
        if(tN > tmin) {
          tmin = tN;
          hitAxis = axis;
          hitSign = t1 < t2 ? -1 : 1;
        }
        tmax = Math.min(tmax, tF);
      }
    }

    if(tmax < 0 || tmin > tmax) return null;

    const t = tmin < 0 ? tmax : tmin;
    const normal = {x: 0, y: 0, z: 0};
    normal[hitAxis] = hitSign;

    return {t, normal};
  }

  _reflect(dir, normal) {
    const dot = dir.x * normal.x + dir.y * normal.y + dir.z * normal.z;
    return {
      x: dir.x - 2 * dot * normal.x,
      y: dir.y - 2 * dot * normal.y,
      z: dir.z - 2 * dot * normal.z,
    };
  }

  _despawn(name) {
    const idx = this._projectiles.findIndex(p => p.name === name);
    if(idx !== -1) this._projectiles.splice(idx, 1);
    let getObj = this.engine.getSceneObjectByName(name);
    if(getObj) {
      // console.log("REMOVE ", name);
      this.engine.removeSceneObjectByName(name);
    } else {
      // console.log("RE POS  ", name);
      const obj = this.engine.mainRenderBundle?.find(o => o.name === name);
      if(obj) {obj.position.x = 99999; obj.position.y = 99999; obj.position.z = 99999;}
    }
  }

  spawnDecal(hitPoint, normal, groupHit) {
    const group = groupHit;
    const name = `decal_${this._uid++}`;
    const offset = 0.02;
    const s = this._decalSize;
    const pos = {
      x: hitPoint.x + normal.x * offset,
      y: hitPoint.y + normal.y * offset,
      z: hitPoint.z + normal.z * offset,
    };
    const scale = [
      normal.x !== 0 ? 0.02 : s,
      normal.y !== 0 ? 0.02 : s,
      normal.z !== 0 ? 0.02 : s,
    ];

    const isEnemy = group === 'enemy' || group === 'zombi_head';
    const obj = this.engine.addMeshObj({
      shadowsCast: false,
      material: {type: 'standard', shared: false, useBlend: true},
      position: pos,
      scale,
      texturesPaths: [this._decalTex],
      name,
      mesh: this.mesh,
      physics: {enabled: false, mass: 0, geometry: 'Cube'},
      pointerEffect: {
        enabled: true,
        bloodBurst: isEnemy ? true : false
      }
    });

    if(isEnemy) obj.setBlend(0.001)
    setTimeout(() => {
      // obj.effects.kaleBullet = new FlameEffect(this.engine.device, "rgba16float", "rgba16float", undefined, this.engine.cameraBuffer);
      // obj.effects.kaleBullet = new FlameEmitter(this.engine.device, "rgba16float", 20, this.engine.cameraBuffer);
      console.log(group)
      if(isEnemy) obj.effects.bloodBurst.spawn([0, 0, 0], null, 30, 3.0);
      // obj.effects.kaleBullet.recreateVertexData(5);
      // obj.effects.kaleBullet.setIntensity(100);
      // obj.effects.kaleBullet.setDirection("forward")
    }, 20)
    setTimeout(() => this._despawn(name), this._decalLifetime);
    return obj;
  }

  /**
   * Instant raycast from camera forward.
   * Tests all static collision entries, spawns decal on hit.
   * @param {number} [maxDist=200]
   */
  fireHitscan(maxDist = 200) {
    const {origin, dir} = this._getCameraState();
    let closest = null;
    let closestT = maxDist;
    let closestN = null;
    for(const entry of this.collision.staticEntries) {
      const result = this._rayVsAABB(origin, dir, entry);
      if(result && result.t > 0.5 && result.t < closestT) {
        closestT = result.t;
        closest = entry;
        closestN = result.normal;
      }
    }
    if(!closest) return null;
    const hitPoint = {
      x: origin.x + dir.x * closestT,
      y: origin.y + dir.y * closestT,
      z: origin.z + dir.z * closestT,
    };
    const reflect = this._reflect(dir, closestN);
    this.spawnDecal(hitPoint, closestN);
    if(this.onHitscanHit) {
      this.onHitscanHit(hitPoint, closestN, reflect, closest);
    }
    return {hitPoint, normal: closestN, reflect, entry: closest, distance: closestT};
  }

  fireProjectile() {
    const {origin, dir} = this._getCameraState();
    const name = `proj_${this._uid++}`;
    const maxDist = 200;
    const rotation = this._dirToEuler(dir);
    // sweep the full path NOW, same test fireHitscan uses
    let closest = null;
    let closestT = maxDist;
    let closestN = null;
    let groupHit = null;
    for(const entry of this.collision.staticEntries) {
      const result = this._rayVsAABB(origin, dir, entry);
      if(result && result.t > 0.001 && result.t < closestT) {
        closestT = result.t;
        closest = entry;
        closestN = result.normal;
        groupHit = entry.group;
      }
    }
    // travel distance is capped at the wall, not the arbitrary 200
    const travelDist = closest ? closestT : maxDist;
    const targetX = origin.x + dir.x * travelDist;
    const targetY = origin.y + dir.y * travelDist;
    const targetZ = origin.z + dir.z * travelDist;
    const obj = this.engine.addMeshObj({
      shadowsCast: false,
      material: {type: 'standard', shared: false, useBlend: true},
      position: {x: origin.x, y: origin.y, z: origin.z},
      scale: [this._scale, this._scale, this._scale],
      rotation: {x: 90, y: rotation.y, z: 0},
      texturesPaths: [this._tex],
      name,
      mesh: this.mesh,
      physics: {enabled: false, mass: 0, geometry: 'Cube'},
      pointerEffect: {
        enabled: true
      }
    });

    obj.effects = {};
    obj.setBlend(0.7);
    setTimeout(() => {
      obj.effects.kaleBullet = new FlameEmitter(this.engine.device, "rgba16float", 20, this.engine.cameraBuffer);
      // obj.effects.kaleBullet = new KaleidoscopeEffect(this.engine.device, "rgba16float", 'pyramid', undefined, this.engine.cameraBuffer);
      // obj.effects.kaleBullet.recreateVertexData(12);
      // console.log(obj.effects.kaleBullet)
      obj.effects.kaleBullet.setIntensity(200);

    }, 10);

    obj.position.setSpeed(this._speed);
    obj.position.translateByXYZ(targetX, targetY, targetZ);

    // reached target: either it's a wall hit, or a clean miss at maxDist
    obj.position.onTargetPositionReach = () => {
      if(closest) {
        const hitPoint = {x: targetX, y: targetY, z: targetZ};
        const reflect = this._reflect(dir, closestN);
        setTimeout(() => this.spawnDecal(hitPoint, closestN, groupHit), 60)
        if(this.onHitscanHit) {
          this.onHitscanHit(hitPoint, closestN, reflect, closest);
        }
      }
      setTimeout(() => this._despawn(name), 100)
    };

    this.pArg.name = name;
    this.pArg.obj = obj;
    this.pArg.dir = dir;
    this._projectiles.push(this.pArg);
    // setTimeout(() => this._despawn(name), this._lifetime);
    return {name, obj, dir};
  }

  _dirToEuler(dir, worldUp = {x: 0, y: 1, z: 0}) {
    const dlen = Math.hypot(dir.x, dir.y, dir.z) || 1;
    const fx = dir.x / dlen, fz = dir.z / dlen;
    let yawDeg = Math.atan2(-fx, fz) * 180 / Math.PI;
    // console.log('dir:', dir, 'yawDeg:', yawDeg);
    return {x: 0, y: yawDeg, z: 0};
  }

}