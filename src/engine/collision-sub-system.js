import {resolvePairRepulsion} from "../../examples/games/rpg/nav-mesh";
import {pairRepulsion} from "./matrix-class";

export class CollisionSystem {
  constructor() {
    this.entries = [];
    this.cameraEntry = null;

    this.cellSize = 100;
    this._grid = new Map();

    this._event1 = new CustomEvent('close-distance', {});
    this._eventDetail = {};
    this._neighbors = [];
  }

  // DONT TOUCH THIS
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
  registerCamera(cameraInstance, radius = 1.0) {
    this.cameraEntry = {
      id: "camera",
      pos: cameraInstance,
      radius,
      group: "camera"
    };
  }
  _cellKey(x, z) {
    const cx = Math.floor(x / this.cellSize);
    const cz = Math.floor(z / this.cellSize);
    return (cx << 16) ^ cz;
  }

  _buildGrid() {
    const grid = this._grid;
    grid.clear();
    for(let i = 0;i < this.entries.length;i++) {
      const e = this.entries[i];
      const key = this._cellKey(e.pos.x, e.pos.z);
      let cell = grid.get(key);
      if(!cell) {cell = []; grid.set(key, cell);}
      cell.push(e);
    }
  }

  _getNeighborCells(x, z) {
    const result = this._neighbors;
    result.length = 0;

    const cx = Math.floor(x / this.cellSize);
    const cz = Math.floor(z / this.cellSize);

    for(let dx = -1;dx <= 1;dx++) {
      for(let dz = -1;dz <= 1;dz++) {
        const key = ((cx + dx) << 16) ^ (cz + dz);
        const cell = this._grid.get(key);
        if(cell) {
          for(let i = 0;i < cell.length;i++) {
            result.push(cell[i]); // NO spread
          }
        }
      }
    }

    return result;
  }

  update() {
    this._buildGrid();
    const n = this.entries.length;
    for(let i = 0;i < n;i++) {
      const A = this.entries[i];
      const neighbors = this._getNeighborCells(A.pos.x, A.pos.z);
      for(let j = 0;j < neighbors.length;j++) {
        const B = neighbors[j];
        if(A === B) continue;
        if(A.group === B.group) continue;
        if(A.id >= B.id) continue;
        const minDist = (A.radius + B.radius) * 0.5;
        const dx = A.pos.x - B.pos.x;
        const dz = A.pos.z - B.pos.z;
        const distSq = dx * dx + dz * dz;
        if(distSq > minDist * minDist) continue;
        const testCollide = resolvePairRepulsion(A.pos, B.pos, minDist, 1.0);
        if(testCollide) {
          this._eventDetail.A = A;
          this._eventDetail.B = B;
          this._event1.detail = this._eventDetail;
          dispatchEvent(this._event1);
        }
      }
    }
    // --- camera vs entities (only neighbor cells) ---
    if(this.cameraEntry) {
      const cam = this.cameraEntry;
      const camX = cam.pos[0];
      const camZ = cam.pos[2];
      if(camX !== this._lastCamX || camZ !== this._lastCamZ) {
        this._lastCamX = camX;
        this._lastCamZ = camZ;
        const neighbors = this._getNeighborCells(camX, camZ);
        for(let i = 0;i < neighbors.length;i++) {
          const target = neighbors[i];
          const minCamDist = 1 + 0.5;
          pairRepulsion(cam.pos, target.pos, minCamDist, 1.1);
          // if(collided) {
          //  // console.log('kinematic collision')
          // }
        }
      }
    }
  }
}