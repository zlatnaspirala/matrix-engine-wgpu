import {mat4} from 'wgpu-matrix';

export class PhysicsBridge {
  constructor(workerUrl) {
    this._worker = null;
    const isModule = workerUrl.indexOf('ammo') === -1 && workerUrl.indexOf('matter') === -1;
    const needsBlobBridge = new URL(workerUrl, location.href).origin !== location.origin;
    if(needsBlobBridge) {
      const blobText = isModule
        ? `import ${JSON.stringify(workerUrl)};`
        : `importScripts(${JSON.stringify(workerUrl)});`;
      const blob = new Blob([blobText], {type: 'application/javascript'});
      const blobUrl = URL.createObjectURL(blob);
      this._worker = isModule
        ? new Worker(blobUrl, {type: 'module'})
        : new Worker(blobUrl);
    } else {
      this._worker = isModule
        ? new Worker(workerUrl, {type: 'module'})
        : new Worker(workerUrl);
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
    this.wPhysicsSteps = 1;
    this._worker.onmessage = ({data}) => this._onMessage(data);
    this.pCollisionEvent = new CustomEvent('pCollision', {detail: {}});
    this.pCollisionEventArg = {
      detail: {
        body0Name: '',
        body1Name: '',
        rayDirection: [0, 0, 0]
      }
    };
    this.detectCollision = (e) => {};
    this.collisionPersisted = (e) => {};
    this.collisionRemoved = (e) => {};
    this.tempRot = mat4.create();
    this._paused = false;
    this.updates = [];
    this._kinematicIdx = new Uint16Array(1024);
    this._kinematicPos = new Float32Array(1024 * 3);
    this._kinematicCount = 0;
    this.c = 0;
  }

  getBodyByName(name) {
    for(const [idx, meObj] of this._bodyIndexMap) if(meObj.name === name) return idx;
    console.info('[bridge] Body not found -1 :', name);
    return -1;
  }

  async init(options = {}) {
    await this._send('init', {options});
    this._ready = true;
    for(const {MEObject, pOptions} of this._queue) {this._doAddPhysics(MEObject, pOptions)}
    this._queue = [];
    setTimeout(() => {
      dispatchEvent(new CustomEvent('PhysicsReady', {}))
      setTimeout(() => {
        if(app.mainRenderBundle.length == 0) {
          setTimeout(() => {
            dispatchEvent(new CustomEvent('PhysicsReady', {}));
          }, 750);
        }
      }, 200);
    }, 450);
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

    this._send('addBody', {pOptions}).then((startIndex) => {
      console.log("ssssssssssssss cloth startIndex:", startIndex);

      // Check if this specific body option was a Cloth
      if(pOptions.geometry === 'Cloth') {
        //       nx: 15, // Must match your OBJ's width subdivisions + 1 (or match total vertex math)
        // ny: 23, // Must match your OBJ's height subdivisions + 1
        const nx = pOptions.nx || 15;
        const ny = pOptions.ny || 23;
        const count = (nx + 1) * (ny + 1);

        if(!this._clothMap) this._clothMap = new Map();

        this._clothMap.set(startIndex, {
          mesh: MEObject,
          startIndex: startIndex,
          nx: nx,
          ny: ny,
          count: count
        });

        console.log("Cloth registered successfully:", {startIndex, nx, ny, count});
      } else {
        // Regular rigid body
        this._bodyIndexMap.set(startIndex, MEObject);
      }
    });
  }

  setKinematicTransformDeplaced() {
    let count = 0;
    const idxArr = this._kinematicIdx;
    const posArr = this._kinematicPos;
    for(const [idx, meObj] of this._bodyIndexMap) {
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
  }

  setKinematicRotation(idx, x, y, z, w = 1) {
    this._worker.postMessage({cmd: 'setKinematicRotation', idx: idx, x: x, y: y, z: z, w: w});
  }

  setKinematicTransform(idx, x, y, z = 0) {
    let count = 0;
    for(const [idx_, meObj] of this._bodyIndexMap) {
      if(!meObj.isKinematic && idx_ !== idx) continue;
      meObj.position.setPosition(x, y, z);
      count++;
    }
    this._kinematicCount = count;
    if(count > 0) {
      this._worker.postMessage({cmd: 'setKinematicTransform', count, idx: idx, x: x, y: y, z: z});
    }
  }

  updatePhysics() {
    this._worker.postMessage({cmd: 'step'})
  }

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

  explodeAll(idxs, x, y, z, radius, strength) {
    if(idxs === undefined) return;
    this._worker.postMessage({cmd: 'explodeAll', idxs, x, y, z, radius, strength});
  }

  deactivatePhysics(idx) {
    if(idx === undefined) return;
    this._worker.postMessage({cmd: 'deactivate', idx});
  }

  switchToKinematic(idx) {
    if(idx === undefined) return;
    this._worker.postMessage({cmd: 'switchToKinematic', idx});
  }

  switchToDinamic(idx) {
    if(idx === undefined) return;
    this._worker.postMessage({cmd: 'switchToDinamic', idx});
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

  getQuaternion(idx) {
    if(idx === undefined) return;
    return this._send('getQuaternion', {idx: idx});
  }

  getDiceFace(idx) {
    if(idx === undefined) return;
    return this._send('getDiceFace', {idx: idx});
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

  removeRigidBody(idx) {
    if(idx === undefined || idx === -1) return;
    this._worker.postMessage({cmd: 'removeRigidBody', idx});
    this._bodyIndexMap.delete(idx);
  }

  createChain(ids, size = 0.5, mass = 0.3, marginSpace = 0.1) {
    this._worker.postMessage({cmd: 'createChain', ids, size, mass, marginSpace});
  }

  createBoundedSpace(ids, pos = {x: 0, y: 0, z: 0}, size = {x: 5, y: 5, z: 5}) {
    this._worker.postMessage({cmd: 'createBoundedSpace', ids, pos, size});
  }

  lotteryMachineShake(ids, strength = 5) {
    this._worker.postMessage({cmd: 'lotteryMachineShake', ids, strength});
  }

  isSleeping(idx) {
    return this._send('isSleeping', {idx: idx});
  }

  setKinematicInterpolate(idx, targetX, targetY, targetZ = 0, lerpFactor) {
    this._worker.postMessage({cmd: 'setKinematicInterpolate', idx, targetX, targetY, targetZ, lerpFactor});
  }
  //---

  createSphereBoundary(idxs, pos = {x: 0, y: 0, z: 0}, radius = 20) {
    this._worker.postMessage({cmd: 'createSphereBoundary', idxs, pos, radius});
  }

  // _syncToObjects() {
  //   const snap = this._snapshot;
  //   if(!snap) return;
  //   const STRIDE = 8;
  //   for(const [idx, meObj] of this._bodyIndexMap) {
  //     // if(!meObj.modelMatrix || meObj.isKinematic=== true) continue;
  //     if(!meObj.modelMatrix) continue;
  //     const b = idx * STRIDE;
  //     const pos = snap.subarray(b, b + 3);
  //     const quat = snap.subarray(b + 3, b + 7);
  //     mat4.fromQuat(quat, meObj.modelMatrix);
  //     meObj.modelMatrix[12] = pos[0];
  //     meObj.modelMatrix[13] = pos[1];
  //     meObj.modelMatrix[14] = pos[2];
  //     mat4.scale(meObj.modelMatrix, meObj.scale, meObj.modelMatrix);
  //     meObj.modelMatrix[15] = 1;
  //     meObj.position.inMove = true;
  //     meObj.position.x = pos[0];
  //     meObj.position.y = pos[1];
  //     meObj.position.z = pos[2];
  //   }
  // }
  _syncToObjects() {
    const snap = this._snapshot;
    if(!snap) return;
    const STRIDE = 8;

    // 1. Sync standard rigid bodies
    for(const [idx, meObj] of this._bodyIndexMap) {
      if(!meObj.modelMatrix) continue;
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
      meObj.position.x = pos[0];
      meObj.position.y = pos[1];
      meObj.position.z = pos[2];
    }

    // 2. Sync Cloth Meshes using the same snapshot array
    if(this._clothMap) {
      console.log("Syncing cloths, map size:", this._clothMap.size);
      for(const [startIndex, cloth] of this._clothMap) {
        const mesh = cloth.mesh;
        if(!mesh || !mesh.mesh.vertices) continue;
        const positions = mesh.mesh.vertices;
        if(!positions) continue;
        const nx = cloth.nx;
        const ny = cloth.ny;
        let vertexIndex = 0;
        for(let y = 0;y <= ny;y++) {
          for(let x = 0;x <= nx;x++) {
            const bodyIndex = startIndex + (y * (nx + 1) + x);
            const b = bodyIndex * STRIDE;
            const px = snap[b + 0];
            const py = snap[b + 1];
            const pz = snap[b + 2];

            if(vertexIndex === 0) {
              console.log("Particle 0 position:", px.toFixed(2), py.toFixed(2), pz.toFixed(2));
            }

            if(positions.setXYZ) {
              positions.setXYZ(vertexIndex, px, py, pz);
            } else {
              positions[vertexIndex * 3 + 0] = px;
              positions[vertexIndex * 3 + 1] = py;
              positions[vertexIndex * 3 + 2] = pz;
            }
            vertexIndex++;
          }
        }
        // mesh.geometry.attributes.position.needsUpdate = true;

      }
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
      case 'bodyAdded':
        const resolveFn = this._pending.get(data.id);
        if(resolveFn) {
          if(data.count && data.count > 1) {
            resolveFn({idx: data.idx, count: data.count, nx: data.nx, ny: data.ny});
          } else {
            resolveFn(data.idx);
          }
          this._pending.delete(data.id);
        }
        break;
      case 'snapshot':
        this._snapshot = data.snap;
        this._syncToObjects();
        break;
      case 'collision':
        this.pCollisionEventArg.detail.body0Name = data.body0Name;
        this.pCollisionEventArg.detail.body1Name = data.body1Name;
        this.pCollisionEventArg.detail.rayDirection = data.normal;
        this.detectCollision(this.pCollisionEventArg);
        break;
      case 'collisionPersisted': // only jolt
        this.pCollisionEventArg.detail.body0Name = data.body0Name;
        this.pCollisionEventArg.detail.body1Name = data.body1Name;
        this.pCollisionEventArg.detail.rayDirection = null;
        this.collisionPersisted(this.pCollisionEventArg);
        break;
      case 'collisionRemoved': // only jolt
        this.pCollisionEventArg.detail.body0Name = data.body0ID;
        this.pCollisionEventArg.detail.body1Name = data.body1ID;
        this.pCollisionEventArg.detail.rayDirection = null;
        this.collisionRemoved(this.pCollisionEventArg);
        break;
      case 'constraintAdded':
        this._pending.get(data.id)?.(data.idx);
        this._pending.delete(data.id);
        break;
      case 'getPosition':
        this._pending.get(data.id)?.(data.position);
        this._pending.delete(data.id);
        break;
      case 'getQuaternion':
        this._pending.get(data.id)?.(data.quaternion);
        this._pending.delete(data.id);
        break;
      case 'getDiceFace':
        this._pending.get(data.id)?.(data.face);
        this._pending.delete(data.id);
        break;
      case 'isSleeping':
        this._pending.get(data.id)?.(data.isSleeping);
        this._pending.delete(data.id);
        break;
    }
  }
}