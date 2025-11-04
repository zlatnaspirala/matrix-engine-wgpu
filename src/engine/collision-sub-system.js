import {resolvePairRepulsion} from "../../examples/games/rpg/nav-mesh";

export class CollisionSystem {
  constructor() {
    this.entries = [];
  }

  register(id, positionInstance, radius = 0.6, group = "default") {
    this.entries.push({id, pos: positionInstance, radius, group});
  }

  unregister(id) {
    this.entries = this.entries.filter(e => e.id !== id);
  }

  update() {
    const n = this.entries.length;
    for(let i = 0;i < n;i++) {
      for(let j = i + 1;j < n;j++) {
        const A = this.entries[i];
        const B = this.entries[j];
        if(A.group === B.group) continue;
        const minDist = A.radius; // + B.radius;
        const testCollide = resolvePairRepulsion(A.pos, B.pos, minDist, 1.0);
        if(testCollide) {
          // console.log('collide A ' + A + " vs B " + B);
          dispatchEvent(new CustomEvent('close-distance', {detail: {A: A, B: B}}))
        }
      }
    }
  }
}