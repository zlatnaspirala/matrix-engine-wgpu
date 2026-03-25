import {pairRepulsion} from "./matrix-class";

export class CollisionSystem {
  constructor() {
    this.entries = [];
    this.cameraEntry = null;
  }

  register(id, positionInstance, radius = 0.6, group = "default") {
    this.entries.push({id, pos: positionInstance, radius, group});
  }

  unregister(id) {
    this.entries = this.entries.filter(e => e.id !== id);
    if(this.cameraEntry && this.cameraEntry.id === id) this.cameraEntry = null;
  }

  /**
   * Specifically register the WASD camera to the collision loop.
   * @param {Object} cameraInstance - Must have .x, .z (and ideally targetX/targetZ)
   */
  registerCamera(cameraInstance, radius = 5.0) {
    this.cameraEntry = {
      id: "wasd_camera",
      pos: cameraInstance,
      radius,
      group: "camera"
    };
  }

  update() {
    const n = this.entries.length;
    for(let i = 0;i < n;i++) {
      for(let j = i + 1;j < n;j++) {
        const A = this.entries[i];
        const B = this.entries[j];
        if(A.group === B.group) continue;
        const minDist = (A.radius + B.radius) / 1.5;
        const testCollide = pairRepulsion(A.pos, B.pos, minDist, 1.0);
        if(testCollide) {
          dispatchEvent(new CustomEvent('close-distance', {detail: {A, B}}));
        }
      }
    }

    if(this.cameraEntry) {
      for(let i = 0;i < n;i++) {
        const target = this.entries[i];
        const minCamDist = (this.cameraEntry.radius + target.radius);
        const collided = pairRepulsion(
          this.cameraEntry.pos,
          target.pos,
          minCamDist,
          0.8
        );
        if(collided) {
          dispatchEvent(new CustomEvent('camera-collision', {detail: {target}}));
        }
      }
    }
  }
}