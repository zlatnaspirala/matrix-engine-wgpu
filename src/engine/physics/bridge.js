import {quaternion_rotation_matrix} from "../utils";

const FLOATS_PER_BODY = 8;

export class PhysicsBridge {
  constructor(workerUrl) {
    this._worker = new Worker(workerUrl, {type: 'module'});
    this._worker.onerror = (e) => {
      console.error('Worker error:', e.message, e.filename, e.lineno);
    };
    this._snapshot = null;
    this._pending = new Map();
    this._msgId = 0;
    this._bodyIndexMap = new Map();
    this._ready = false;
    this._queue = [];
    this._worker.onmessage = ({data}) => this._onMessage(data);

    // cache
    this.pCollisionEvent = new CustomEvent('pCollision', {
      detail: {
        // body0Name: data.body0Name,
        // body1Name: data.body1Name,
        // rayDirection: data.normal
      }
    })
  }

  getBodyByName(name) {
    // console.log('[bridge] bodyIndexMap size:', this._bodyIndexMap.size);
    // for(const [meObj, idx] of this._bodyIndexMap) {
    //   // console.log(' -', meObj.name, idx);
    // }
    for(const [meObj, idx] of this._bodyIndexMap) {
      if(meObj.name === name) return idx;
    }
    return -1;
  }

  async init(options = {}) {
    await this._send('init', {options});
    this._ready = true;
    for(const {MEObject, pOptions} of this._queue) {this._doAddPhysics(MEObject, pOptions)}
    this._queue = [];
    setTimeout(() => {dispatchEvent(new CustomEvent('PhysicsReady', {}))}, 50);
  }

  addPhysics(MEObject, pOptions) {
    if(!this._ready) {
      this._queue.push({MEObject, pOptions});
      return;
    }
    console.log("ADD PHYSICSA MAINTHRED")
    this._doAddPhysics(MEObject, pOptions);
  }

  _doAddPhysics(MEObject, pOptions) {
    this._send('addBody', {pOptions}).then(idx => {
      this._bodyIndexMap.set(MEObject, idx);
    });
  }

  updatePhysics() {
    if(!this._ready) return;
    for(const [meObj, idx] of this._bodyIndexMap) {
      if(meObj.itIsKinematic) {
        const {x, y, z} = meObj.position;
        this._worker.postMessage({cmd: 'setKinematicTransform', idx, x, y, z});
      }
    }
    this._worker.postMessage({cmd: 'step'});
  }

  // ── rest of MatrixJolt public API ────────────────────────────────
  setGravity(x, y, z) {
    this._worker.postMessage({cmd: 'setGravity', x, y, z});
  }

  applyImpulse(idx, pVect) {
    // const idx = this._bodyIndexMap.get(MEObject);
    if(idx === undefined) return;
    console.log('[bridge] applyImpulse', idx, pVect);
    this._worker.postMessage({cmd: 'applyImpulse', idx, ...pVect});
  }

  applyTorque(MEObject, pVect) {
    const idx = this._bodyIndexMap.get(MEObject);
    if(idx === undefined) return;
    this._worker.postMessage({cmd: 'applyTorque', idx, ...pVect});
  }

  setBodyVelocity(MEObject, x, y, z) {
    const idx = this._bodyIndexMap.get(MEObject);
    if(idx === undefined) return;
    this._worker.postMessage({cmd: 'setLinearVelocity', idx, x, y, z});
  }

  activate(MEObject) {
    const idx = this._bodyIndexMap.get(MEObject);
    if(idx === undefined) return;
    this._worker.postMessage({cmd: 'activate', idx});
  }

  explode(positionVect, radius, strength) {
    this._worker.postMessage({cmd: 'explode', positionVect, radius, strength});
  }

  deactivatePhysics(MEObject) {
    const idx = this._bodyIndexMap.get(MEObject);
    if(idx === undefined) return;
    this._worker.postMessage({cmd: 'deactivate', idx});
  }

  _syncToObjects() {
    const snap = this._snapshot;
    if(!snap) return;
    const FLOATS = 8;
    for(const [meObj, idx] of this._bodyIndexMap) {
      if(meObj.itIsKinematic) continue;
      const b = idx * FLOATS;
      meObj.position.setPosition(snap[b], snap[b + 1], snap[b + 2]);
      meObj.position.inMove = true;
      meObj.rotation.axis.x = snap[b + 3];
      meObj.rotation.axis.y = snap[b + 4];
      meObj.rotation.axis.z = snap[b + 5];
      meObj.rotation.angle = snap[b + 6] * (180 / Math.PI);
      meObj.rotation.matrixRotation = quaternion_rotation_matrix(_snapQuat(snap, b));
    }
  }

  _send(cmd, extra = {}) {
    const id = this._msgId++;
    return new Promise(resolve => {
      this._pending.set(id, resolve);
      this._worker.postMessage({cmd, id, ...extra});
    });
  }

  _onMessage(data) {
    switch(data.cmd) {
      case 'ready':
      case 'bodyAdded':
        if(data.sab) this._snapshot = new Float32Array(data.sab, 4);
        this._pending.get(data.id)?.(data.idx);
        this._pending.delete(data.id);
        this._syncToObjects();
        break;
      case 'snapshot':
        this._snapshot = data.snap;
        this._syncToObjects();
        break;
      case 'collision':
        // re-dispatch as DOM event so existing listeners work unchanged
        this.pCollisionEvent.detail.body0Name = data.body0Name;
        this.pCollisionEvent.detail.body1Name = data.body1Name;
        this.pCollisionEvent.detail.rayDirection = data.normal;
        document.dispatchEvent(this.pCollisionEvent);
        break;
    }
  }
}

// axis/angle → [qw,qx,qy,qz] for quaternion_rotation_matrix
function _snapQuat(snap, b) {
  const ax = snap[b + 3], ay = snap[b + 4], az = snap[b + 5];
  const a = snap[b + 6];
  const s = Math.sin(a / 2);
  return [Math.cos(a / 2), ax * s, ay * s, az * s];
}