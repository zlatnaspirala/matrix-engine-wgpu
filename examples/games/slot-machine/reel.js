import {animateRotationY} from "../../../src/engine/procedures/sceneobjectKinematics";

const sleep = ms => new Promise(r => setTimeout(r, ms));
const easeOutCubic = t => 1 - Math.pow(1 - t, 3);
const easeInOutCubic = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const animateValue = (duration, update) => new Promise(resolve => {
  const start = performance.now();
  const tick = now => {
    const t = Math.min(1, (now - start) / duration);
    update(t);
    if(t < 1) requestAnimationFrame(tick);
    else resolve();
  };
  requestAnimationFrame(tick);
});

export class SlotReel {
  constructor(mesh, reelCfg, opts = {}) {
    this.mesh = mesh;
    this.cfg = reelCfg;                        // {strip, length} from the server adapter
    this.spinSpeed = opts.spinSpeed ?? 6;      // same units as setRotateX(2.5) in your demo
    this.angleOffset = opts.angleOffset ?? 0;  // CALIBRATE: angle where sprite 0 faces the camera
    this.dir = opts.dir ?? 1;                  // CALIBRATE: 1 or -1, ring direction
    this.extraTurns = opts.extraTurns ?? 1;
    this.stopMs = opts.stopMs ?? 1050;
    this.startKickSpeed = opts.startKickSpeed ?? 0.45;
    this.startKickMs = opts.startKickMs ?? 100;
    this.accelerationMs = opts.accelerationMs ?? 360;
    this.overshootDegrees = opts.overshootDegrees ?? 1;
    this.settleMs = opts.settleMs ?? 190;
    this.visibleRows = opts.visibleRows ?? 3;
  }

  get sprites() {return [...this.mesh.effects.spriteBatch.sprites.values()];}

  // ---- the one engine-specific part I could not verify ----
  getAngle() {return this.mesh.rotation.x;}       // degrees, assumed readable
  setAngle(deg) {this.mesh.rotation.x = deg;}      // degrees, assumed writable
  // ---------------------------------------------------------

  async layout(delayPerSprite = 0) {
    const FIX = 90, N = this.cfg.length;
    const sprites = this.sprites;
    if(sprites.length !== N) console.warn(`[slot] ${sprites.length} sprites vs strip length ${N}`);
    for(const [i, sprite] of sprites.entries()) {
      const yDeg = (i / N) * 360;
      sprite.pause();
      sprite.goToFrame(0);
      sprite.setTargetRotation(90, yDeg - FIX, FIX);
      if(i === sprites.length - 1) {
        animateRotationY(this.mesh.rotation, 90, 1000);
      }
      if(delayPerSprite) await sleep(delayPerSprite);
    }
  }

  stripIndexForRow(stop, row, topIsPrev = true) {
    const center = Math.floor(this.visibleRows / 2);
    const offset = (row - center) * (topIsPrev ? 1 : -1);
    return ((stop + offset) % this.cfg.length + this.cfg.length) % this.cfg.length;
  }

  playWinAt(stripIndex, {duration = 1500, speed = 12} = {}) {
    if(!Number.isInteger(stripIndex) || stripIndex < 0 || stripIndex >= this.cfg.length) {
      console.warn('[slot] Invalid winning strip index:', stripIndex);
      return Promise.resolve();
    }

    // Resolve by the stable physical sprite name, never by Map iteration order.
    const sprite = this.mesh.effects.spriteBatch.getSprite(`symbol-${stripIndex}`);
    if(!sprite) {
      console.warn('[slot] Missing winning sprite:', `symbol-${stripIndex}`);
      return Promise.resolve();
    }

    sprite.playRange(0, 16, speed, true);
    return new Promise(resolve => {
      setTimeout(() => {
        sprite.pause();
        sprite.goToFrame(0);
        sprite.clearRange();
        sprite.reset();
        resolve();
      }, duration);
    });
  }

  angleForStop(s) {return this.angleOffset + this.dir * (s / this.cfg.length) * 360;}

  snapTo(s) {                       // calibration helper
    this.mesh.rotation.setRotateX(0);
    this.setAngle(this.angleForStop(s));
  }

  async startSpin() {
    // A short reverse mechanical kick, followed by a smooth acceleration.
    this.mesh.rotation.setRotateX(-this.startKickSpeed);
    await sleep(this.startKickMs);
    const fromSpeed = -this.startKickSpeed;
    await animateValue(this.accelerationMs, t => {
      this.mesh.rotation.setRotateX(
        fromSpeed + (this.spinSpeed - fromSpeed) * easeInOutCubic(t)
      );
    });
    this.mesh.rotation.setRotateX(this.spinSpeed);
  }

  async stopAt(stop) {
    this.mesh.rotation.setRotateX(0);
    const from = this.getAngle();
    const target = this.angleForStop(stop);
    const travel = ((((target - from) % 360) + 360) % 360) + 360 * this.extraTurns;
    const landing = from + travel;
    const overshoot = landing + this.overshootDegrees;
    const settleMs = Math.min(this.settleMs, this.stopMs * 0.35);
    const brakingMs = Math.max(1, this.stopMs - settleMs);

    // Brake into a tiny +1 degree overshoot, then mechanically settle backward
    // onto the exact backend-selected orientation (same angle modulo 360).
    await animateValue(brakingMs, t => {
      this.setAngle(from + (overshoot - from) * easeOutCubic(t));
    });
    await animateValue(settleMs, t => {
      this.setAngle(overshoot + (landing - overshoot) * easeOutCubic(t));
    });
    this.setAngle(landing);
  }
}