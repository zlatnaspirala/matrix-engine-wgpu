const FLOATS_PER_BODY = 8;

export class PhysicsBridge {
  constructor(workerUrl) {
    this._worker = new Worker(workerUrl, {type: 'module'});
    this._snapshot = null;
    this._pending = new Map();
    this._msgId = 0;
    this._bodyIndexMap = new Map();
    this._ready = false;
    this._queue = []; // buffered addPhysics calls before ready

    this._worker.onmessage = ({data}) => this._onMessage(data);
  }

  async init(options = {}) {
    await this._send('init', {options});
    this._ready = true;

    // drain queue
    for(const {MEObject, pOptions} of this._queue) {
      this._doAddPhysics(MEObject, pOptions);
    }
    this._queue = [];

    // defer one tick so all addEventListener('PhysicsReady') 
    // calls in constructors finish registering first
    setTimeout(() => {
      dispatchEvent(new CustomEvent('PhysicsReady', {}));
    }, 10);
  }

  addPhysics(MEObject, pOptions) {
    if(!this._ready) {
      this._queue.push({MEObject, pOptions}); // buffer until ready
      return;
    }
    this._doAddPhysics(MEObject, pOptions);
  }

  _doAddPhysics(MEObject, pOptions) {
    this._send('addBody', {pOptions}).then(idx => {
      this._bodyIndexMap.set(MEObject, idx);
    });
  }
  // ── same signature as MatrixJolt.updatePhysics ───────────────────
  updatePhysics() {
    if(!this._ready) return; // silent no-op until worker is up

    for(const [meObj, idx] of this._bodyIndexMap) {
      if(meObj.itIsKinematic) {
        const {x, y, z} = meObj.position;
        this._worker.postMessage({cmd: 'setKinematicTransform', idx, x, y, z});
      }
    }

    this._worker.postMessage({cmd: 'step'});
    this._syncToObjects();
  }

  // ── rest of MatrixJolt public API ────────────────────────────────
  setGravity(x, y, z) {
    this._worker.postMessage({cmd: 'setGravity', x, y, z});
  }

  applyImpulse(MEObject, pVect) {
    const idx = this._bodyIndexMap.get(MEObject);
    if(idx === undefined) return;
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

  // ── init — replaces _initJolt() + PhysicsReady event ────────────
  async init(options = {}) {
    await this._send('init', {options});
    dispatchEvent(new CustomEvent('PhysicsReady', {}));
  }

  // ── internals ────────────────────────────────────────────────────
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
      meObj.rotation.matrixRotation = quaternion_rotation_matrix(
        _snapQuat(snap, b) // see below
      );
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