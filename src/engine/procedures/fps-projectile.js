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
    this._tex = opts.projectileTex ?? './res/textures/blankgray2.webp';
    this._decalTex = opts.decalTex ?? './res/textures/blankgray2.webp';
    this._decalSize = opts.decalSize ?? 0.4;
    this._decalLifetime = opts.decalLifetime ?? 2000;

    this.onHitscanHit = opts.onHitscanHit ?? null;
    this.onProjectileHit = opts.onProjectileHit ?? null;

    this._projectiles = [];
    this._uid = 0;
    this._maxDecals = opts.maxDecals ?? 20;
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
      this.engine.removeSceneObjectByName(name);
    } else {
      const obj = this.engine.mainRenderBundle?.find(o => o.name === name);
      if(obj) {obj.position.x = 99999; obj.position.y = 99999; obj.position.z = 99999;}
    }
  }

  spawnDecal(hitPoint, normal) {
    const name = `decal_${this._uid++}`;
    const offset = 0.02;
    const s = this._decalSize;

    const pos = {
      x: hitPoint.x + normal.x * offset,
      y: hitPoint.y + normal.y * offset,
      z: hitPoint.z + normal.z * offset,
    };

    // flatten on normal axis — makes a quad oriented to the hit surface
    const scale = [
      normal.x !== 0 ? 0.02 : s,
      normal.y !== 0 ? 0.02 : s,
      normal.z !== 0 ? 0.02 : s,
    ];

    const obj = this.engine.addMeshObj({
      shadowsCast: false,
      material: {type: 'standard', shared: false},
      position: pos,
      scale,
      texturesPaths: [this._decalTex],
      name,
      mesh: this.mesh,
      physics: {enabled: false, mass: 0, geometry: 'Cube'}
    });

    setTimeout(() => this._despawn(name), this._decalLifetime);
    return obj;
  }

  // HITSCAN
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

  // ── MOVING PROJECTILE ────────────────────────────────────────────────────

  /**
   * Spawn a moving projectile from camera position.
   * Position.translateByXYZ drives movement — no manual update needed.
   *
   * Collision check per frame:
   *   // in your game loop / after collisionSystem.update():
   *   ps.checkProjectiles();
   */
  fireProjectile() {
    const {origin, dir} = this._getCameraState();
    const name = `proj_${this._uid++}`;
    const dist = 200;

    const obj = this.engine.addMeshObj({
      shadowsCast: false,
      material: {type: 'standard', shared: true},
      position: {x: origin.x, y: origin.y, z: origin.z},
      scale: [this._scale, this._scale, this._scale],
      rotation: {x: 0 , y: 0 , z: 0},
      texturesPaths: [this._tex],
      name,
      mesh: this.mesh,
      physics: {enabled: false, mass: 0, geometry: 'Cube'},
      pointerEffect: {
        enabled: true
      }
    });

    obj.effects = {};
    setTimeout(() => {
      obj.effects.kaleBullet = new KaleidoscopeEmitter(this.engine.device, 'rgba16float', 30, this.engine.cameraBuffer)
      obj.effects.kaleBullet.recreateVertexDataCrazzy(randomIntFromTo(4, 16));
      obj.effects.kaleBullet.setIntensity(randomIntFromTo(10, 15));

      obj.effects.kaleBullet.setDirection("forward")
    }, 20)

    obj.position.setSpeed(this._speed);
    obj.position.translateByXYZ(
      origin.x + dir.x * dist,
      origin.y + dir.y * dist,
      origin.z + dir.z * dist
    );

    // despawn when Position reaches target (missed everything)
    obj.position.onTargetPositionReach = () => this._despawn(name);

    this.pArg.name = name;
    this.pArg.obj = obj;
    this.pArg.dir = dir;
    // this._projectiles.push({ name, obj, dir });
    this._projectiles.push(this.pArg);

    // auto despawn after lifetime regardless
    setTimeout(() => this._despawn(name), this._lifetime);

    return {name, obj, dir};
  }

  /**
   * Call this every frame after collisionSystem.update()
   * to detect moving projectile hits.
   *
   * Example in your game loop:
   *   collisionSystem.update();
   *   projectileSystem.checkProjectiles();
   */
  checkProjectiles() {
    for(let i = this._projectiles.length - 1;i >= 0;i--) {
      const p = this._projectiles[i];
      const pos = p.obj?.position;
      if(!pos) continue;

      for(const entry of this.collision.staticEntries) {
        const result = this._rayVsAABB(
          {x: pos.x, y: pos.y, z: pos.z},
          p.dir,
          entry
        );
        if(result && result.t >= 0 && result.t <= this._speed * 2) {
          const hitPoint = {x: pos.x, y: pos.y, z: pos.z};
          this.spawnDecal(hitPoint, result.normal);
          if(this.onProjectileHit) this.onProjectileHit(hitPoint, result.normal, entry);
          this._despawn(p.name);
          break;
        }
      }
    }
  }
}