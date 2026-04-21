import {mat4} from 'wgpu-matrix';

export class PhysicsBridge {
  constructor(workerUrl) {
    this._worker = null;
    if(workerUrl.indexOf('ammo') != -1) {
      this._worker = new Worker(workerUrl);
    } else {
      this._worker = new Worker(workerUrl, {type: 'module'});
    }
    this._worker.onerror = (e) => {
      console.error('MEWorker error:', e.message, e.filename, e.lineno);
    };
    this._snapshot = null;
    this._pending = new Map();
    this._msgId = 0;
    this._bodyIndexMap = new Map();
    this._ready = false;
    this._queue = [];
    this._worker.onmessage = ({data}) => this._onMessage(data);

    this.pCollisionEvent = new CustomEvent('pCollision', {detail: {}});
    this.pCollisionEventArg = { detail: {
      body0Name: '',
      body1Name: '',
      rayDirection: [0,0,0]
    }};

    this.detectCollision = (e) => {};
    this.tempRot = mat4.create();
    this._paused = false;
    this.updates = [];
    this._kinematicIdx = new Uint16Array(1024); // or max bodies
    this._kinematicPos = new Float32Array(1024 * 3);
    this._kinematicCount = 0;
    this.c = 0;
  }

  getBodyByName(name) {
    for(const [meObj, idx] of this._bodyIndexMap) if(meObj.name === name) return idx;
    console.info('[bridge] Body not found -1 :', name);
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
    this._doAddPhysics(MEObject, pOptions);
  }

  _doAddPhysics(MEObject, pOptions) {
    MEObject.isKinematic = pOptions.state === 4;
    this._send('addBody', {pOptions}).then(idx => {
      this._bodyIndexMap.set(MEObject, idx);
    });
  }

  updatePhysics() {
    let count = 0;
    const idxArr = this._kinematicIdx;
    const posArr = this._kinematicPos;
    for(const [meObj, idx] of this._bodyIndexMap) {
      if(!meObj.isKinematic) continue;
      const base = count * 3;
      idxArr[count] = idx;
      posArr[base + 0] = meObj.position.x;
      posArr[base + 1] = meObj.position.y;
      posArr[base + 2] = meObj.position.z;
      count++;
    }
    this._kinematicCount = count;
    if(count > 0) {
      this._worker.postMessage({cmd: 'setKinematicTransform', count, idx: idxArr, pos: posArr});
    }

    if (this.c % 2 === 0)  this._worker.postMessage({cmd: 'step'});
    this.c++;
  }

  // MatrixJolt public API
  setGravity(x, y, z) {this._worker.postMessage({cmd: 'setGravity', x, y, z})}

  setHingeLimit(idx, v0, v1, v2, v3, v4) {
    if(idx === undefined) return;
    this._worker.postMessage({cmd: 'setHingeLimit', idx, v0, v1, v2, v3, v4});
  }

  applyImpulse(idx, pVect) {
    if(idx === undefined) return;
    this._worker.postMessage({cmd: 'applyImpulse', idx, ...pVect});
  }

  shootBody(idx, lx, ly, lz, ax, ay, az) {
    if(idx === undefined) return;
    this._worker.postMessage({cmd: 'shootBody', idx, lx, ly, lz, ax, ay, az});
  }

  setActivationState(idx, s) {
    if(idx === undefined) return;
    this._worker.postMessage({cmd: 'setActivationState', idx, s});
  }

  activate(idx, s) {
    if(idx === undefined) return;
    this._worker.postMessage({cmd: 'activate', idx, s});
  }

  setDamping(idx, l, a) {
    if(idx === undefined) return;
    this._worker.postMessage({cmd: 'setDamping', idx, l, a});
  }

  setRestitution(idx, s) {
    if(idx === undefined) return;
    this._worker.postMessage({cmd: 'setRestitution', idx, s});
  }

  setFriction(idx, s) {
    if(idx === undefined) return;
    this._worker.postMessage({cmd: 'setFriction', idx, s});
  }

  applyTorque(idx, pVect) {
    if(idx === undefined) return;
    this._worker.postMessage({cmd: 'applyTorque', idx, ...pVect});
  }

  setBodyVelocity(idx, x, y, z) {
    if(idx === undefined) return;
    this._worker.postMessage({cmd: 'setLinearVelocity', idx, x, y, z});
  }

  setBodyAngularVelocity(idx, x, y, z) {
    if(idx === undefined) return;
    this._worker.postMessage({cmd: 'setBodyAngularVelocity', idx, x, y, z});
  }

  explode(idx, x, y, z, radius, strength) {
    if(idx === undefined) return;
    this._worker.postMessage({cmd: 'explode', idx, x, y, z, radius, strength});
  }

  deactivatePhysics(idx) {
    if(idx === undefined) return;
    this._worker.postMessage({cmd: 'deactivate', idx});
  }

  setDamping(idx, linear, angular) {
    if(idx === undefined) return;
    this._worker.postMessage({cmd: 'setDamping', idx, linear, angular});
  }

  setSleepingThresholds(idx, linear, angular) {
    if(idx === undefined) return;
    this._worker.postMessage({cmd: 'setSleepingThresholds', idx, linear, angular});
  }

  setAngularFactor(idx, x, y, z) {
    if(idx === undefined) return;
    this._worker.postMessage({cmd: 'setAngularFactor', idx, x, y, z});
  }

  setRollingFriction(idx, friction) {
    if(idx === undefined) return;
    this._worker.postMessage({cmd: 'setRollingFriction', idx, friction});
  }

  addHingeConstraint(idxA, idxB, options) {
    if(idxA === undefined || idxB === undefined || idxA === -1 || idxB === -1) {
      console.log('error in addHingeConstraint !!! ');
      return Promise.resolve(-1);
    }
    return this._send('addHingeConstraint', {idxA, idxB, options});
  }

  enableAngularMotor(constraintIdx, enable, targetVelocity, maxMotorImpulse) {
    if(constraintIdx === undefined) return;
    this._worker.postMessage({cmd: 'enableAngularMotor', constraintIdx, enable, targetVelocity, maxMotorImpulse});
  }

  getPosition(idx) {
    console.log('ADD', idx)
    return this._send('getPosition', {idx: idx});
  }

  clearBody(idx) {
    this._worker.postMessage({cmd: 'clearBody', idx});
  }

  speedUpSimulation(value) {
    this._worker.postMessage({cmd: 'speedUpSimulation', value});
  }

  setCollisionFlags(idx, flags) {
    if(idx === undefined || idx === -1) return;
    this._worker.postMessage({cmd: 'setCollisionFlags', idx, flags});
  }

  _syncToObjects() {
    const snap = this._snapshot;
    if(!snap) return;
    const STRIDE = 8;
    for(const [meObj, idx] of this._bodyIndexMap) {
      const b = idx * STRIDE;
      
      const pos = snap.subarray(b, b + 3);
      const quat = snap.subarray(b + 3, b + 7);
      mat4.fromQuat(quat, meObj.modelMatrix);
      meObj.modelMatrix[12] = pos[0];
      meObj.modelMatrix[13] = pos[1];
      meObj.modelMatrix[14] = pos[2];
      mat4.scale(meObj.modelMatrix, meObj.scale, meObj.modelMatrix);
      meObj.modelMatrix[15] = 1;
      meObj.position.inMove = true;
    }
  }

  _send(cmd, extra = {}) {
    const id = this._msgId++;
    return new Promise(resolve => {
      this._pending.set(id, resolve);
      this._worker.postMessage({cmd, id, ...extra});
    });
  }

  setBodyTransform(idx, x, y, z) {
    if(idx === undefined || idx === -1) return;
    this._worker.postMessage({cmd: 'setBodyTransform', idx, x, y, z});
  }

  setGravityScale(idx, scale) {
    if(idx === undefined || idx === -1) return;
    this._worker.postMessage({cmd: 'setGravityScale', idx, scale});
  }

  _onMessage(data) {
    switch(data.cmd) {
      case 'ready':
      // this._worker.onmessage = ({data}) => this._onMessage(data);
      case 'bodyAdded':
        this._pending.get(data.id)?.(data.idx);
        this._pending.delete(data.id);
        break;
      case 'snapshot':
        this._snapshot = data.snap;
        this._syncToObjects();
        break;
      case 'collision':
        this.pCollisionEventArg.detail.body0Name = data.body0Name;
        this.pCollisionEventArg.detail.body1Name = data.body1Name;
        this.pCollisionEventArg.detail.rayDirection = data.normal;
        // document.dispatchEvent(this.pCollisionEvent);
        this.detectCollision(this.pCollisionEventArg);
        break;
      case 'constraintAdded':
        this._pending.get(data.id)?.(data.idx);
        this._pending.delete(data.id);
        break;
      case 'getPosition':
        
        this._pending.get(data.id)?.(data.position);
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