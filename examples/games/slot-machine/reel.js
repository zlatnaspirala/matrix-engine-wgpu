import {animateRotationY} from "../../../src/engine/procedures/sceneobjectKinematics";

const sleep = ms => new Promise(r => setTimeout(r, ms));
const easeOutCubic = t => 1 - Math.pow(1 - t, 3);

export class SlotReel {
  constructor(mesh, reelCfg, opts = {}) {
    this.mesh = mesh;
    this.cfg = reelCfg;                        // {strip, frames, length} from the adapter
    this.spinSpeed = opts.spinSpeed ?? 6;      // same units as setRotateX(2.5) in your demo
    this.angleOffset = opts.angleOffset ?? 0;  // CALIBRATE: angle where sprite 0 faces the camera
    this.dir = opts.dir ?? 1;                  // CALIBRATE: 1 or -1, ring direction
    this.extraTurns = opts.extraTurns ?? 1;
    this.stopMs = opts.stopMs ?? 900;
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
    const sprite = this.sprites[stripIndex];
    if(!sprite) return Promise.resolve();
    sprite.playRange(0, 16, speed, true);
    return new Promise(resolve => {
      setTimeout(() => {
        sprite.pause();
        sprite.goToFrame(0);
        resolve();
      }, duration);
    });
  }

    angleForStop(s) {return this.angleOffset + this.dir * (s / this.cfg.length) * 360;}

  snapTo(s) {                       // calibration helper
    this.mesh.rotation.setRotateX(0);
    this.setAngle(this.angleForStop(s));
  }

  startSpin() {this.mesh.rotation.setRotateX(this.spinSpeed);}

  stopAt(stop) {
    return new Promise(resolve => {
      this.mesh.rotation.setRotateX(0);
      const from = this.getAngle();
      const target = this.angleForStop(stop);
      const delta = ((((target - from) % 360) + 360) % 360) + 360 * this.extraTurns;
      const t0 = performance.now();
      const tick = now => {
        const t = Math.min(1, (now - t0) / this.stopMs);
        this.setAngle(from + delta * easeOutCubic(t));
        if(t < 1) requestAnimationFrame(tick); else resolve();
      };
      requestAnimationFrame(tick);
    });
  }
}