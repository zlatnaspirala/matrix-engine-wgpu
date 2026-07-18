export function resolvePairRepulsion(Apos, Bpos, minDistance = 30.0, pushStrength = 0.5) {
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

export function resolvePairRepulsion3D(Apos, Bpos, minDistance = 30.0, pushStrength = 0.5) {
  const dx = Bpos.x - Apos.x;
  const dy = Bpos.y - Apos.y;
  const dz = Bpos.z - Apos.z;
  const distSq = dx * dx + dy * dy + dz * dz;
  const minDistSq = minDistance * minDistance;
  if(distSq < minDistSq && distSq > 1e-8) {
    const dist = Math.sqrt(distSq);
    const overlap = minDistance - dist;
    const push = overlap * pushStrength * 0.5;
    const inv = push / dist;
    Apos.x -= dx * inv; Apos.y -= dy * inv; Apos.z -= dz * inv;
    Bpos.x += dx * inv; Bpos.y += dy * inv; Bpos.z += dz * inv;
    return true;
  }
  if(distSq <= 1e-8) {
    const j = 0.01;
    Apos.x += (Math.random() - .5) * j;
    Apos.y += (Math.random() - .5) * j;
    Apos.z += (Math.random() - .5) * j;
    return true;
  }
  return false;
}

export class CollisionSystem {
  constructor() {
    this.entries = [];
    this.staticEntries = [];
    this.cameraEntry = null;
    this.cameraVsStaticDist = 1.5;
    this.cellSize = 100;
    this._grid = new Map();
    this._staticGrid = new Map();
    this._event1 = new CustomEvent('close-distance', {detail: {data: ""}});
    this._eventDetail = {};
    this._neighbors = [];
    this._staticNeighbors = [];
    this.pickupEntries = [];
    this._pickupGrid = new Map();
    this._pickupNeighbors = [];
    this._gravityAcc = 0;
    this._gravityForce = -0.015;
    this._terminalVelocity = -0.5;
    this._onGround = false;
  }

  applyGravity(camPos, camRadius) {
    this._gravityAcc += this._gravityForce;
    if(this._gravityAcc < this._terminalVelocity) {
      this._gravityAcc = this._terminalVelocity;
    }
    camPos[1] += this._gravityAcc;
    this._onGround = false;
    const camX = camPos[0];
    const camY = camPos[1];
    const camZ = camPos[2];
    this._getNeighborCells(camX, camY, camZ, this._staticGrid, this._staticNeighbors);

    for(let i = 0;i < this._staticNeighbors.length;i++) {
      const entry = this._staticNeighbors[i];
      const fakePos = {x: camPos[0], y: camPos[1], z: camPos[2]};
      const prevY = fakePos.y;
      const hit = this.resolveVsStaticCube(fakePos, camRadius, entry);
      if(hit) {
        camPos[0] = fakePos.x;
        camPos[1] = fakePos.y;
        camPos[2] = fakePos.z;
        if(fakePos.y > prevY) {
          this._gravityAcc = 0;
          this._onGround = true;
        }
      }
    }

    app.getCamera()?.forceViewUpdate();
  }

  register(id, positionInstance, radius = 1, group = "default") {
    this.entries.push({id, pos: positionInstance, radius, group});
  }

  registerStatic(id, positionInstance, radius = 1, group = "default", halfExtents = null) {
    const entry = {
      id,
      pos: positionInstance,
      radius,
      group,
      // store actual box dimensions if provided, else assume unit cube
      half: halfExtents ?? {x: radius, y: radius, z: radius}
    };

    const h = entry.half;
    if(!h) {
      console.warn('entry missing half:', entry.id);
      return false;
    }

    this.staticEntries.push(entry);
    const key = this._cellKey(positionInstance.x, positionInstance.y ?? 0, positionInstance.z);
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

  _cellKey(x, y, z) {
    const cx = Math.floor(x / this.cellSize);
    const cy = Math.floor(y / this.cellSize);
    const cz = Math.floor(z / this.cellSize);
    return `${cx},${cy},${cz}`; // string key avoids bit-shift overflow in 3D
  }

  _buildGrid() {
    const grid = this._grid;
    grid.clear();
    for(let i = 0;i < this.entries.length;i++) {
      const e = this.entries[i];
      const key = this._cellKey(e.pos.x, e.pos.y, e.pos.z);
      let cell = grid.get(key);
      if(!cell) {cell = []; grid.set(key, cell);}
      cell.push(e);
    }
  }

  _getNeighborCells(x, y, z, grid, out) {
    out.length = 0;
    const cx = Math.floor(x / this.cellSize);
    const cy = Math.floor(y / this.cellSize);
    const cz = Math.floor(z / this.cellSize);
    for(let dx = -1;dx <= 1;dx++)
      for(let dy = -1;dy <= 1;dy++)
        for(let dz = -1;dz <= 1;dz++) {
          const key = `${cx + dx},${cy + dy},${cz + dz}`;
          const cell = grid.get(key);
          if(cell) for(let i = 0;i < cell.length;i++) out.push(cell[i]);
        }
  }

  resolveVsStaticCube(entityPos, entityRadius, entry) {
    const h = entry.half ?? {x: 1, y: 1, z: 1};

    const dx = entityPos.x - entry.pos.x;
    const dy = entityPos.y - entry.pos.y;
    const dz = entityPos.z - entry.pos.z;

    const overlapX = (entityRadius + h.x) - Math.abs(dx);
    const overlapZ = (entityRadius + h.z) - Math.abs(dz);

    if(overlapX <= 0 || overlapZ <= 0) return false;

    if(entry.group === 'floor') {
      const overlapY = (entityRadius + h.y) - Math.abs(dy);
      if(overlapY <= 0) return false;
      const cubeTop = entry.pos.y + h.y;
      const entityFeet = entityPos.y - entityRadius;
      if(entityFeet <= cubeTop) {
        entityPos.y = cubeTop + entityRadius;
        return true;
      }
      return false;
    }

    // for walls/pillars — check camera body overlaps the object's Y range
    // camera occupies [entityPos.y - entityRadius, entityPos.y + entityRadius]
    // object occupies [entry.pos.y - h.y, entry.pos.y + h.y]
    const camBottom = entityPos.y - entityRadius;
    const camTop = entityPos.y + entityRadius;
    const objBottom = entry.pos.y - h.y;
    const objTop = entry.pos.y + h.y;

    // no vertical body overlap — camera is above or below the object, ignore
    if(camBottom >= objTop || camTop <= objBottom) return false;

    // step-up: feet just below the top surface
    const stepHeight = 0.6;
    if(camBottom >= objTop - stepHeight && camBottom < objTop) {
      entityPos.y = objTop + entityRadius;
      return true;
    }
    if(overlapX < overlapZ) {
      entityPos.x += dx < 0 ? -overlapX : overlapX;
    } else {
      entityPos.z += dz < 0 ? -overlapZ : overlapZ;
    }
    return true;
  }

  registerPickup(id, positionInstance, radius = 0.6, type = 'energy', amount = 10) {
    const entry = {id, pos: positionInstance, radius, type, amount, collected: false};
    this.pickupEntries.push(entry);
    const key = this._cellKey(positionInstance.x, positionInstance.y ?? 0, positionInstance.z);
    let cell = this._pickupGrid.get(key);
    if(!cell) {cell = []; this._pickupGrid.set(key, cell);}
    cell.push(entry);
    return entry;
  }

  removePickup(entry) {
    entry.collected = true;
    const idx = this.pickupEntries.indexOf(entry);
    if(idx !== -1) this.pickupEntries.splice(idx, 1);
    const key = this._cellKey(entry.pos.x, entry.pos.y ?? 0, entry.pos.z);
    const cell = this._pickupGrid.get(key);
    if(cell) {
      const ci = cell.indexOf(entry);
      if(ci !== -1) cell.splice(ci, 1);
    }
    // delete visual
    app.removeSceneObjectByName(entry.id);
  }

  // called from update(), right after applyGravity — cheap, grid-bounded, not O(n)
  checkPickups(camPos, camRadius) {
    this._getNeighborCells(camPos[0], camPos[1], camPos[2], this._pickupGrid, this._pickupNeighbors);
    for(let i = 0;i < this._pickupNeighbors.length;i++) {
      const entry = this._pickupNeighbors[i];
      if(entry.collected) continue;
      const dx = camPos[0] - entry.pos.x;
      const dy = camPos[1] - entry.pos.y;
      const dz = camPos[2] - entry.pos.z;
      const rSum = camRadius + entry.radius;
      if(dx * dx + dy * dy + dz * dz <= rSum * rSum) {
        this.removePickup(entry);
        dispatchEvent(new CustomEvent('pickup-collected', {detail: {entry: entry}}));
      }
    }
  }

  update() {
    if(this.cameraEntry) {
      this.applyGravity(this.cameraEntry.pos, this.cameraEntry.radius);
      const cam = this.cameraEntry;
      this.checkPickups(cam.pos, cam.radius);
      this._getNeighborCells(cam.pos[0], cam.pos[1], cam.pos[2], this._staticGrid, this._staticNeighbors);
      for(let i = 0;i < this._staticNeighbors.length;i++) {
        const entry = this._staticNeighbors[i];
        if(entry.group === 'floor') continue;
        const fakePos = {x: cam.pos[0], y: cam.pos[1], z: cam.pos[2]};
        const hit = this.resolveVsStaticCube(fakePos, cam.radius, entry);
        if(hit) {
          cam.pos[0] = fakePos.x;
          cam.pos[1] = fakePos.y;
          cam.pos[2] = fakePos.z;
        }
      }
    }
    // dynamic vs dynamic
    this._buildGrid();
    const n = this.entries.length;
    for(let i = 0;i < n;i++) {
      const A = this.entries[i];
      this._getNeighborCells(A.pos.x, A.pos.y, A.pos.z, this._grid, this._neighbors);
      for(let j = 0;j < this._neighbors.length;j++) {
        const B = this._neighbors[j];
        if(A === B) continue;
        // const minDist = (A.radius + B.radius) * 0.5;
        const minDist = A.radius + B.radius;
        // if(A.group === B.group) {
        //   resolvePairRepulsion3D(A.pos, B.pos, minDist, 1.0);
        //   continue;
        // }
        if(A.id >= B.id) continue;
        const dx = A.pos.x - B.pos.x;
        const dz = A.pos.z - B.pos.z;
        if(dx * dx + dz * dz > minDist * minDist) continue;
        const testCollide = resolvePairRepulsion3D(A.pos, B.pos, minDist, 1.0);
        if(testCollide) {
          this._eventDetail.A = A;
          this._eventDetail.B = B;
          this._event1.detail.data = this._eventDetail;
          dispatchEvent(this._event1);
          // return;
        }
      }
    }
  }
}