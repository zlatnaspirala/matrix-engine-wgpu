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
    this.dir = opts.dir ?? -1;                  // CALIBRATE: 1 or -1, ring direction
    this.extraTurns = opts.extraTurns ?? 1;
    this.stopMs = opts.stopMs ?? 1050;
    this.startKickSpeed = opts.startKickSpeed ?? 0.45;
    this.startKickMs = opts.startKickMs ?? 100;
    this.accelerationMs = opts.accelerationMs ?? 360;
    this.overshootDegrees = opts.overshootDegrees ?? 1;
    this.settleMs = opts.settleMs ?? 190;
    this.visibleRows = opts.visibleRows ?? 3;
  }

  get fluidEffects() {return this.cfg.strip.map((_, i) => this.mesh.effects?.[`fluidSymbol${i}`]).filter(Boolean);}

  getAngle() {return this.mesh.rotation.x;}       // degrees, assumed readable
  setAngle(deg) {this.mesh.rotation.x = deg;}      // degrees, assumed writable

  async layout(delayPerSprite = 0) {
    const N = this.cfg.length;
    const effects = this.fluidEffects;
    if(effects.length !== N) console.warn(`[slot] ${effects.length} fluid effects vs strip length ${N}`);
    // Effect transforms are local to the reel mesh. The mesh rotation therefore
    // rotates every symbol fluid plane exactly like the previous sprite ring.
    for(const [i, effect] of effects.entries()) {
      const angle = (i / N) * Math.PI * 2;
      // The reel rotates around X, so its symbol ring lies in the YZ plane.
      // Face each fluid plane outward from the reel's X axis.
      effect.localOffset = [
        0,
        Math.cos(angle) * 5.6,
        Math.sin(angle) * 5.6
      ];
      effect.localRotation = [angle - Math.PI / 2, 0, 0];
      if(delayPerSprite) await sleep(delayPerSprite);
    }
    // animateRotationY(this.mesh.rotation, 90, 1000);
  }

  stripIndexForRow(stop, row, topIsPrev = true) {
    const center = Math.floor(this.visibleRows / 2);
    const offset = (row - center) * (topIsPrev ? 1 : -1);
    return ((stop + offset) % this.cfg.length + this.cfg.length) % this.cfg.length;
  }

  async playWinAt(stripIndex, {duration = 2500} = {}) {
    if(!Number.isInteger(stripIndex) || stripIndex < 0 || stripIndex >= this.cfg.length) {
      console.warn('[slot] Invalid winning fluid symbol index:', stripIndex);
      return;
    }

    const fluid = this.mesh.effects?.[`fluidSymbol${stripIndex}`];
    if(!fluid) {
      console.warn('[slot] Missing fluid symbol:', stripIndex);
      return;
    }

    // Several spaced bursts create a win pulse without flooding the GPU
    // splat queue every animation frame.
    const colors = [
      [2.2, 0.35, 0.12],
      [0.2, 2.0, 0.55],
      [0.25, 0.65, 2.2],
      [2.0, 0.25, 1.8],
      [2.0, 1.7, 0.2]
    ];
    const pulses = 4;
    for(let i = 0; i < pulses; i++) {
      fluid.burst(0.5, 0.5, 10, 850, colors[i % colors.length]);
      if(i < pulses - 1) await sleep(duration / pulses);
    }
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