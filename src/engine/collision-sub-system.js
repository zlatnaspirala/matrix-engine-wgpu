import {pairRepulsion} from "./matrix-class";

export function resolvePairRepulsion(Apos, Bpos, minDistance = 30.0, pushStrength = 0.5) {
  // Apos and Bpos are Position instances (with x,z,targetX,targetZ)
  const dx = Bpos.x - Apos.x;
  const dz = Bpos.z - Apos.z;
  const distSq = dx * dx + dz * dz;
  const minDistSq = minDistance * minDistance;
  if(distSq < minDistSq && distSq > 1e-8) {
    const dist = Math.sqrt(distSq);
    const overlap = minDistance - dist;
    const nx = dx / dist;
    const nz = dz / dist;
    const totalPush = overlap * pushStrength;
    const pushA = totalPush * 0.5;
    const pushB = totalPush * 0.5;
    Apos.x -= nx * pushA;
    Apos.z -= nz * pushA;
    Bpos.x += nx * pushB;
    Bpos.z += nz * pushB;
    // Apos.targetX = Apos.x;
    // Apos.targetZ = Apos.z;
    // Bpos.targetX = Bpos.x;
    // Bpos.targetZ = Bpos.z;

    return true;
  }
  // exact overlap (practically same point) -> small jitter to separate
  if(distSq <= 1e-8) {
    const jitter = 0.01;
    Apos.x += (Math.random() - 0.5) * jitter;
    Apos.z += (Math.random() - 0.5) * jitter;
    Apos.targetX = Apos.x; Apos.targetZ = Apos.z;
    return true;
  }
  return false;
}

export class CollisionSystem {
  constructor() {
    this.entries = [];
    this.staticEntries = []; // walls go here
    this.cameraEntry = null;

    this.cellSize = 100;
    this._grid = new Map();
    this._staticGrid = new Map(); // built once, never rebuilt

    this._event1 = new CustomEvent('close-distance', {detail: {data: ""}});
    this._eventDetail = {};
    this._neighbors = [];
    this._staticNeighbors = [];
  }

  // existing register — dynamic entities (enemies, players)
  register(id, positionInstance, radius = 0.6, group = "default") {
    this.entries.push({id, pos: positionInstance, radius, group});
  }

  // new: walls, maze geometry — built into _staticGrid once
  registerStatic(id, positionInstance, radius = 0.6, group = "default") {
    const entry = {id, pos: positionInstance, radius, group};
    this.staticEntries.push(entry);
    // insert directly into static grid
    const key = this._cellKey(positionInstance.x, positionInstance.z);
    let cell = this._staticGrid.get(key);
    if(!cell) {cell = []; this._staticGrid.set(key, cell);}
    cell.push(entry);
  }

  unregister(id) {
    this.entries = this.entries.filter(e => e.id !== id);
    if(this.cameraEntry && this.cameraEntry.id === id) this.cameraEntry = null;
  }

  registerCamera(cameraInstance, radius = 1.0) {
    this.cameraEntry = {id: "camera", pos: cameraInstance, radius, group: "camera"};
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

  _getNeighborCells(x, z, grid, out) {
    out.length = 0;
    const cx = Math.floor(x / this.cellSize);
    const cz = Math.floor(z / this.cellSize);
    for(let dx = -1;dx <= 1;dx++) {
      for(let dz = -1;dz <= 1;dz++) {
        const key = ((cx + dx) << 16) ^ (cz + dz);
        const cell = grid.get(key);
        if(cell) {
          for(let i = 0;i < cell.length;i++) out.push(cell[i]);
        }
      }
    }
    return out;
  }

  update() {
    // dynamic vs dynamic (enemies vs enemies) — your existing MOBA logic untouched
    this._buildGrid();
    const n = this.entries.length;
    for(let i = 0;i < n;i++) {
      const A = this.entries[i];
      const neighbors = this._getNeighborCells(A.pos.x, A.pos.z, this._grid, this._neighbors);
      for(let j = 0;j < neighbors.length;j++) {
        const B = neighbors[j];
        if(A === B) continue;
        const minDist = (A.radius + B.radius) * 0.5;
        if(A.group === B.group) {
          resolvePairRepulsion(A.pos, B.pos, minDist, 1.0);
          continue;
        }
        if(A.id >= B.id) continue;
        const dx = A.pos.x - B.pos.x;
        const dz = A.pos.z - B.pos.z;
        if(dx * dx + dz * dz > minDist * minDist) continue;
        const testCollide = resolvePairRepulsion(A.pos, B.pos, minDist, 1.0);
        if(testCollide) {
          this._eventDetail.A = A;
          this._eventDetail.B = B;
          this._event1.detail.data = this._eventDetail;
          dispatchEvent(this._event1);
          return;
        }
      }
    }

    // camera vs static walls — query _staticGrid only
    if(this.cameraEntry) {
      const cam = this.cameraEntry;
      const camX = cam.pos[0];
      const camZ = cam.pos[2];
      if(camX !== this._lastCamX || camZ !== this._lastCamZ) {
        this._lastCamX = camX;
        this._lastCamZ = camZ;
        const neighbors = this._getNeighborCells(camX, camZ, this._staticGrid, this._staticNeighbors);
        for(let i = 0;i < neighbors.length;i++) {
          pairRepulsion(cam.pos, neighbors[i].pos, 1 + 0.5, 1.1);
        }
      }
    }
  }
}