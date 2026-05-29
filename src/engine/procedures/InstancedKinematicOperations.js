export class InstancedKinematicOperations {

  constructor(instanceTargets) {

    this.targets = instanceTargets;

    this.intervals = [];
    this.timeouts = [];

    this.destroyed = false;
  }

  // ---------------------------------------------------
  // INTERNAL SAFE HELPERS
  // ---------------------------------------------------

  addTimeout(callback, delay) {

    if(this.destroyed) return;

    const id = setTimeout(() => {

      if(this.destroyed) return;

      callback();

      const index = this.timeouts.indexOf(id);

      if(index !== -1) {
        this.timeouts.splice(index, 1);
      }

    }, delay);

    this.timeouts.push(id);

    return id;
  }

  addInterval(callback, ms = 16) {

    if(this.destroyed) return;

    this.stopIntervals();

    const id = setInterval(() => {

      if(this.destroyed) return;

      callback();

    }, ms);

    this.intervals.push(id);

    return id;
  }

  stopIntervals() {

    for(let i = 0;i < this.intervals.length;i++) {
      clearInterval(this.intervals[i]);
    }

    this.intervals.length = 0;
  }

  stopTimeouts() {

    for(let i = 0;i < this.timeouts.length;i++) {
      clearTimeout(this.timeouts[i]);
    }

    this.timeouts.length = 0;
  }

  stopAll() {

    this.stopIntervals();
    this.stopTimeouts();
  }

  destroy() {

    this.stopAll();

    this.targets = null;

    this.destroyed = true;
  }

  // ---------------------------------------------------
  // COLOR HELPERS
  // ---------------------------------------------------

  rainbow(t, time, index, alpha = 1) {

    t.color[0] =
      0.5 + Math.sin(time + index) * 0.5;

    t.color[1] =
      0.5 + Math.sin(time * 1.3 + index + 2) * 0.5;

    t.color[2] =
      0.5 + Math.sin(time * 1.7 + index + 4) * 0.5;

    t.color[3] = alpha;
  }

  neon(t, time, index, alpha = 1) {

    t.color[0] =
      0.8 + Math.sin(time * 4 + index) * 0.2;

    t.color[1] =
      0.2 + Math.sin(time * 3 + index) * 0.8;

    t.color[2] = 1.0;

    t.color[3] = alpha;
  }

  fire(t, time, index, alpha = 1) {

    t.color[0] = 1.0;

    t.color[1] =
      0.3 + Math.sin(time * 5 + index) * 0.3;

    t.color[2] =
      0.05 + Math.sin(time * 8 + index) * 0.05;

    t.color[3] = alpha;
  }

  pulseAlpha(t, time, speed = 4) {

    t.color[3] =
      0.3 + Math.abs(Math.sin(time * speed)) * 0.7;
  }

  // ---------------------------------------------------
  // RESET
  // ---------------------------------------------------

  reset() {

    if(!this.targets) return;

    for(let i = 0;i < this.targets.length;i++) {

      const t = this.targets[i];

      t.position[0] = 0;
      t.position[1] = 0;
      t.position[2] = 0;

      t.rotation[0] = 0;
      t.rotation[1] = 0;
      t.rotation[2] = 0;

      t.scale[0] = 1;
      t.scale[1] = 1;
      t.scale[2] = 1;

      t.color[0] = 1;
      t.color[1] = 1;
      t.color[2] = 1;
      t.color[3] = 1;
    }
  }

  // ---------------------------------------------------
  // ORBIT
  // ---------------------------------------------------

  orbit({
    radius = 8,
    speed = 0.03
  } = {}) {

    let angleOffset = 0;
    let time = 0;

    const count = this.targets.length;

    this.addInterval(() => {

      angleOffset += speed;
      time += 0.03;

      for(let i = 0;i < count;i++) {

        const angle =
          (Math.PI * 2 / count) * i +
          angleOffset;

        const t = this.targets[i];

        t.position[0] =
          Math.cos(angle) * radius;

        t.position[1] =
          Math.sin(angle) * radius;

        t.rotation[2] += 0.03;

        this.rainbow(
          t,
          time,
          i,
          0.5 + Math.abs(Math.sin(time + i))
        );
      }

    });
  }

  // ---------------------------------------------------
  // FLOWER
  // ---------------------------------------------------

  flower({
    radius = 10,
    speed = 0.04,
    petals = 5
  } = {}) {

    let time = 0;

    const count = this.targets.length;

    this.addInterval(() => {

      time += speed;

      for(let i = 0;i < count;i++) {

        const angle =
          (Math.PI * 2 / count) * i;

        const r =
          radius *
          Math.sin(petals * angle + time);

        const t = this.targets[i];

        t.position[0] =
          Math.cos(angle + time) * r;

        t.position[1] =
          Math.sin(angle + time) * r;

        t.rotation[0] += 0.01;
        t.rotation[1] += 0.02;
        t.rotation[2] += 0.03;

        const s =
          0.5 + Math.abs(Math.sin(time + i));

        t.scale[0] = s;
        t.scale[1] = s;
        t.scale[2] = s;

        this.neon(
          t,
          time,
          i,
          0.6 + Math.sin(time * 2 + i) * 0.4
        );
      }

    });
  }

  // ---------------------------------------------------
  // CHAOS
  // ---------------------------------------------------

  chaos({
    radius = 10,
    speed = 0.02
  } = {}) {

    let time = 0;

    const count = this.targets.length;

    this.addInterval(() => {

      time += speed;

      for(let i = 0;i < count;i++) {

        const t = this.targets[i];

        const a =
          time + i * 0.35;

        const r =
          radius +
          Math.sin(time * 2 + i) * 2;

        t.position[0] =
          Math.cos(a * 1.7) * r;

        t.position[1] =
          Math.sin(a * 1.3) * r;

        t.position[2] =
          Math.cos(a * 2.1) * 3;

        t.rotation[0] += 0.02;
        t.rotation[1] += 0.03;
        t.rotation[2] += 0.04;

        const s =
          0.6 +
          Math.abs(Math.sin(time * 3 + i));

        t.scale[0] = s;
        t.scale[1] = s;
        t.scale[2] = s;

        this.rainbow(
          t,
          time * 3,
          i,
          0.3 + Math.abs(Math.sin(time * 4 + i)) * 0.7
        );
      }

    });
  }

  // ---------------------------------------------------
  // FIRE STORM
  // ---------------------------------------------------

  fireStorm({
    radius = 6,
    speed = 0.05
  } = {}) {

    let time = 0;

    const count = this.targets.length;

    this.addInterval(() => {

      time += speed;

      for(let i = 0;i < count;i++) {

        const t = this.targets[i];

        const angle =
          (Math.PI * 2 / count) * i + time;

        const r =
          radius +
          Math.sin(time * 6 + i) * 2;

        t.position[0] =
          Math.cos(angle) * r;

        t.position[1] =
          Math.sin(angle) * r;

        t.position[2] =
          Math.sin(time * 4 + i) * 4;

        t.rotation[0] += 0.04;
        t.rotation[1] += 0.05;
        t.rotation[2] += 0.06;

        const s =
          0.7 +
          Math.abs(Math.sin(time * 8 + i)) * 1.5;

        t.scale[0] = s;
        t.scale[1] = s;
        t.scale[2] = s;

        this.fire(
          t,
          time,
          i,
          0.4 + Math.abs(Math.sin(time * 10 + i)) * 0.6
        );
      }

    });
  }

  // ---------------------------------------------------
  // CINEMATIC
  // ---------------------------------------------------

  cinematicSequence() {

    this.stopAll();

    this.orbit();

    this.addTimeout(() => {
      this.flower();
    }, 6000);

    this.addTimeout(() => {
      this.chaos();
    }, 12000);

    this.addTimeout(() => {
      this.orbit();
    }, 18000);
  }
}