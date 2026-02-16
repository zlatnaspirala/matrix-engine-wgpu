import {Position} from "../matrix-class";

export class FireballSystem {
  static CONFIG = {
    speed: 0.3,    // Position.thrust value
    homingStrength: 0.08,
    hitRadius: 1.5,
    damage: 50,
    lifetime: 4000,
    maxActive: 8,
  };

  constructor(meshInstanced) {
    this.mesh = meshInstanced;
    this.projectiles = [];
    this.slotOffset = meshInstanced.instanceCount;
  }

  spawn(fromPosition, target) {
    if(this.projectiles.length >= FireballSystem.CONFIG.maxActive) return;

    const slotIndex = this.slotOffset + this.projectiles.length;
    const t = this.mesh.instanceTargets[slotIndex];

    // ── Give each fireball its own Position
    const pos = new Position(fromPosition.x, fromPosition.y, fromPosition.z);
    pos.setSpeed(FireballSystem.CONFIG.speed);

    t.color[3] = 1.0;
    t.scale = [1, 1, 1];

    this.projectiles.push({
      slot: slotIndex,
      target: target,
      pos: pos,           // ← owns its own Position
      spawnTime: performance.now(),
      alive: true,
    });
  }

  update(deltaTime) {
    const cfg = FireballSystem.CONFIG;
    const toRemove = [];

    for(let i = 0;i < this.projectiles.length;i++) {
      const p = this.projectiles[i];
      if(!p.alive) {toRemove.push(i); continue;}

      // ── Expire
      if(performance.now() - p.spawnTime > cfg.lifetime) {
        this._kill(p); toRemove.push(i); continue;
      }

      // ── Target dead
      if(!p.target || p.target.hp <= 0) {
        this._kill(p); toRemove.push(i); continue;
      }

      // ── Homing + tick
      p.pos.translateByXZ(p.target.position.x, p.target.position.z);
      p.pos.translateByY(p.target.position.y);
      p.pos.update(); // ← manual tick since not a scene object

      // ── Sync to instanceTarget
      const t = this.mesh.instanceTargets[p.slot];
      t.position[0] = p.pos.x;
      t.position[1] = p.pos.y;
      t.position[2] = p.pos.z;

      // ── Hit check
      const dx = p.pos.x - p.target.position.x;
      const dy = p.pos.y - p.target.position.y;
      const dz = p.pos.z - p.target.position.z;

      if(Math.sqrt(dx * dx + dy * dy + dz * dz) < cfg.hitRadius) {
        this._onHit(p); toRemove.push(i); continue;
      }
    }

    for(let i = toRemove.length - 1;i >= 0;i--) {
      this.projectiles.splice(toRemove[i], 1);
    }
  }

  _onHit(p) {
    p.target.hp -= FireballSystem.CONFIG.damage;
    dispatchEvent(new CustomEvent('fireball-hit', {
      detail: {
        target: p.target,
        position: p.pos.worldLocation,
        damage: FireballSystem.CONFIG.damage,
      }
    }));
    this._kill(p);
  }

  _kill(p) {
    p.alive = false;
    const t = this.mesh.instanceTargets[p.slot];
    t.scale = [0, 0, 0];
    t.color[3] = 0;
  }
}