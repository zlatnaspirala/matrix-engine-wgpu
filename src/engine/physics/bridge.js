import {mat4} from 'wgpu-matrix';

function calculateSoftBodyNormals(positions, indices, vertexCount, fallbackNormals, normals, v2n, nodeAcc) {
  normals = normals || new Float32Array(vertexCount * 3);
  normals.fill(0);
  for(let i = 0;i + 2 < indices.length;i += 3) {
    const ia = indices[i], ib = indices[i + 1], ic = indices[i + 2];
    if(ia >= vertexCount || ib >= vertexCount || ic >= vertexCount) continue;
    const ax = positions[ia * 4], ay = positions[ia * 4 + 1], az = positions[ia * 4 + 2];
    const bx = positions[ib * 4], by = positions[ib * 4 + 1], bz = positions[ib * 4 + 2];
    const cx = positions[ic * 4], cy = positions[ic * 4 + 1], cz = positions[ic * 4 + 2];
    const abx = bx - ax, aby = by - ay, abz = bz - az;
    const acx = cx - ax, acy = cy - ay, acz = cz - az;
    const nx = aby * acz - abz * acy;
    const ny = abz * acx - abx * acz;
    const nz = abx * acy - aby * acx;
    normals[ia * 3] += nx; normals[ia * 3 + 1] += ny; normals[ia * 3 + 2] += nz;
    normals[ib * 3] += nx; normals[ib * 3 + 1] += ny; normals[ib * 3 + 2] += nz;
    normals[ic * 3] += nx; normals[ic * 3 + 1] += ny; normals[ic * 3 + 2] += nz;
  }
  // OBJ meshes duplicate vertices at UV/normal seams. Share the accumulated normal between all
  // vertices welded into the same physics node, otherwise seams show up as hard shading lines.
  if(v2n && nodeAcc) {
    nodeAcc.fill(0);
    for(let i = 0;i < vertexCount;i++) {
      const n = v2n[i] * 3, o = i * 3;
      nodeAcc[n] += normals[o]; nodeAcc[n + 1] += normals[o + 1]; nodeAcc[n + 2] += normals[o + 2];
    }
    for(let i = 0;i < vertexCount;i++) {
      const n = v2n[i] * 3, o = i * 3;
      normals[o] = nodeAcc[n]; normals[o + 1] = nodeAcc[n + 1]; normals[o + 2] = nodeAcc[n + 2];
    }
  }
  for(let i = 0;i < vertexCount;i++) {
    const o = i * 3;
    const len = Math.hypot(normals[o], normals[o + 1], normals[o + 2]);
    if(len > 1e-10) {
      normals[o] /= len;
      normals[o + 1] /= len;
      normals[o + 2] /= len;
    } else if(fallbackNormals && fallbackNormals.length >= o + 3) {
      normals[o] = fallbackNormals[o];
      normals[o + 1] = fallbackNormals[o + 1];
      normals[o + 2] = fallbackNormals[o + 2];
    } else {
      normals[o] = 0; normals[o + 1] = 1; normals[o + 2] = 0;
    }
  }
  return normals;
}


function updateSoftBodyNormals(meta, positions, vertexCount, v2n) {
  const normalBuffer = meta.mesh.vertexNormalsBuffer;
  const indices = meta.mesh.mesh?.indices;
  if(!normalBuffer || !indices?.length) return;
  if(!meta._normalScratch || meta._normalScratch.length !== vertexCount * 3) {
    meta._normalScratch = new Float32Array(vertexCount * 3);
  }
  if(v2n && !meta._nodeAcc) {
    let maxNode = 0;
    for(let k = 0;k < v2n.length;k++) if(v2n[k] > maxNode) maxNode = v2n[k];
    meta._nodeAcc = new Float32Array((maxNode + 1) * 3);
  }
  calculateSoftBodyNormals(
    positions, indices, vertexCount, meta.mesh.mesh?.vertexNormals,
    meta._normalScratch, v2n, meta._nodeAcc
  );
  app.device.queue.writeBuffer(normalBuffer, 0, meta._normalScratch);
}

function updateCannonSoftBodyNormals(meta, positions, vertexCount, v2n) {
  // Cannon keeps vertex positions current on every snapshot, while normal rebuilding
  // is deliberately amortized across snapshots to reduce main-thread work.
  meta._normalUpdateFrame = (meta._normalUpdateFrame || 0) + 1;
  if(meta._normalUpdateFrame & 1) {
    updateSoftBodyNormals(meta, positions, vertexCount, v2n);
  }
}

function uploadClothPackets(packets, clothMap, softBodyNormalUpdater) {
  if(!packets?.length) return;
  const device = app.device;
  for(let p = 0;p < packets.length;p++) {
    const packet = packets[p];
    const meta = clothMap.get(packet.startIndex);
    const buf = meta?.mesh?.vertexAnim?.clothBuffer;
    if(!buf) continue;
    const src = packet.positions, v2n = meta.v2n;
    if(meta.isSoftBody) meta.positions = src;
    const n = v2n ? v2n.length : meta.count;
    if(!meta._scratch || meta._scratch.length !== n * 4) meta._scratch = new Float32Array(n * 4);
    const dst = meta._scratch;
    const o = meta.off;
    for(let i = 0;i < n;i++) {
      const s = (v2n ? v2n[i] : i) * 3;
      const d = i * 4;
      dst[d] = src[s] + (o ? o[i * 3] : 0);
      dst[d + 1] = src[s + 1] + (o ? o[i * 3 + 1] : 0);
      dst[d + 2] = src[s + 2] + (o ? o[i * 3 + 2] : 0);
    }
    device.queue.writeBuffer(buf, 0, dst);

    if(meta.isSoftBody) softBodyNormalUpdater(meta, dst, n, v2n);
  }
}

export class PhysicsBridge {
  constructor(workerUrl) {
    this._worker = null;
    this._softBodyNormalUpdater = updateSoftBodyNormals;
    const isModule = workerUrl.indexOf('ammo') === -1 && workerUrl.indexOf('matter') === -1;
    const needsBlobBridge = new URL(workerUrl, location.href).origin !== location.origin;
    if(needsBlobBridge) {
      const blobText = isModule ? `import ${JSON.stringify(workerUrl)};` : `importScripts(${JSON.stringify(workerUrl)});`;
      const blob = new Blob([blobText], {type: 'application/javascript'});
      const blobUrl = URL.createObjectURL(blob);
      this._worker = isModule ? new Worker(blobUrl, {type: 'module'}) : new Worker(blobUrl);
    } else {
      this._worker = isModule ? new Worker(workerUrl, {type: 'module'}) : new Worker(workerUrl);
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
    this._quatScratch = new Float32Array(4);
    this._paused = false;
    this.updates = [];
    this._kinematicIdx = new Uint16Array(1024);
    this._kinematicPos = new Float32Array(1024 * 3);
    this._kinematicCount = 0;
    this.c = 0;
    this._clothMap = new Map();
  }

  get _PHYSICS_DRIVE() {
    return this._physicsDrive;
  }

  set _PHYSICS_DRIVE(value) {
    this._physicsDrive = value;
    // Select the engine-specific implementation once when world.js assigns its
    // existing driver identifier. The snapshot hot path does not branch on engine.
    this._softBodyNormalUpdater = value === 'CANNON'
      ? updateCannonSoftBodyNormals
      : updateSoftBodyNormals;
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
    this._send('addBody', {pOptions}).then((response) => {
      const startIndex = typeof response === 'object' ? response.idx : response;
      if(startIndex === undefined || startIndex < 0) return;
      if(pOptions.geometry === 'SoftBody') {
        this._clothMap.set(startIndex, {
          mesh: MEObject, startIndex,
          count: response?.count ?? 0,
          v2n: response?.vertexToNode || null,
          off: response?.vertexOffsets || null,
          isSoftBody: true
        });
        return;
      }
      if(pOptions.geometry === 'Cloth') {
        const nx = response?.nx ?? pOptions.nx ?? 10;
        const ny = response?.ny ?? pOptions.ny ?? 10;
        const count = response?.count ?? ((nx + 1) * (ny + 1));
        this._clothMap.set(startIndex, {mesh: MEObject, startIndex, nx, ny, count});
        return;
      }
      this._bodyIndexMap.set(startIndex, MEObject);
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
    // Update only the addressed render object. Updating every kinematic object
    // here made all remote replicas collapse onto the last received position.
    const meObj = this._bodyIndexMap.get(idx);
    if(meObj?.position?.setPosition) meObj.position.setPosition(x, y, z, false);
    if(idx === undefined || idx < 0) return;
    this._worker.postMessage({cmd: 'setKinematicTransform', count: 1, idx, x, y, z});
  }

  updatePhysics() {
    this._worker.postMessage({cmd: 'step'});
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
    if(idx === undefined || idx < 0) return;
    const meObj = this._bodyIndexMap.get(idx);
    if(meObj) meObj.isKinematic = true;
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

  // Heightfield terrain for Ammo, Cannon, and Jolt. heightData is a row-major Float32Array (rows * columns).
  // The selected physics worker owns the native heightfield shape for its lifetime.
  addHeightfield({heightData, columns, rows, elementSize = 1, position = {x: 0, y: 0, z: 0}, minHeight, maxHeight, friction = 1, name = 'heightfield'} = {}) {
    if(!(heightData instanceof Float32Array)) throw new TypeError('heightData must be a Float32Array');
    if(!Number.isInteger(columns) || !Number.isInteger(rows) || columns < 2 || rows < 2) {
      throw new RangeError('Heightfield columns and rows must both be integers >= 2');
    }
    if(heightData.length !== columns * rows) {
      throw new RangeError(`heightData length must equal columns * rows (${columns * rows})`);
    }
    if(!Number.isFinite(elementSize) || elementSize <= 0) throw new RangeError('elementSize must be > 0');
    return this._send('addBody', {
      pOptions: {
        geometry: 'Heightfield', heightData, columns, rows, elementSize,
        position, minHeight, maxHeight, friction, mass: 0, name
      }
    }).then(idx => idx);
  }

  // Ammo, Cannon, and Jolt vehicles register chassis and wheel snapshot slots here.
  addVehicle(chassisObj, wheelObjs, pOptions) {
    return this._send('addVehicle', {pOptions}).then(({idx, vid, wheelStart}) => {
      for(const [i, obj] of [[idx, chassisObj], ...wheelObjs.map((w, k) => [wheelStart + k, w])]) {
        obj.isKinematic = false;
        obj.itIsPhysicsBody = true; // otherwise getModelMatrix() rebuilds the matrix and drops the physics rotation
        this._bodyIndexMap.set(i, obj);
      }
      return vid;
    });
  }

  vehicleControl(vid, engine, steering, brake = 0) {
    this._worker.postMessage({cmd: 'vehicleControl', vid, engine, steering, brake});
  }

  getVehicleSpeed(vid) {return this._send('getVehicleSpeed', {vid});}

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

  createSphereBoundary(idxs, pos = {x: 0, y: 0, z: 0}, radius = 20) {
    this._worker.postMessage({cmd: 'createSphereBoundary', idxs, pos, radius});
  }

  applyClothForce(startIndex, x, y, z) {
    this._worker.postMessage({cmd: 'applyClothForce', startIndex, x, y, z});
  }

  getSoftBodyIndex(name) {
    for(const [idx, meta] of this._clothMap) {
      if(meta.isSoftBody && meta.mesh?.name === name) return idx;
    }
    return -1;
  }

  getSoftBodySnapshot(startIndex) {
    const meta = this._clothMap.get(startIndex);
    return meta?.isSoftBody ? (meta.positions || null) : null;
  }

  _syncToObjects() {
    const snap = this._snapshot;
    if(!snap) return;
    const STRIDE = 8;

    // 1. Sync standard rigid bodies
    for(const [idx, meObj] of this._bodyIndexMap) {
      if(!meObj.modelMatrix) continue;
      const b = idx * STRIDE;
      const x = snap[b], y = snap[b + 1], z = snap[b + 2];
      const quat = this._quatScratch;
      quat[0] = snap[b + 3];
      quat[1] = snap[b + 4];
      quat[2] = snap[b + 5];
      quat[3] = snap[b + 6];
      mat4.fromQuat(quat, meObj.modelMatrix);
      meObj.modelMatrix[12] = x;
      meObj.modelMatrix[13] = y;
      meObj.modelMatrix[14] = z;
      mat4.scale(meObj.modelMatrix, meObj.scale, meObj.modelMatrix);
      meObj.modelMatrix[15] = 1;
      meObj.position.inMove = true;
      meObj.position.x = x;
      meObj.position.y = y;
      meObj.position.z = z;
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
        // Jolt may replace its shared snapshot buffer when bodies are added.
        // Keep this optional so Cannon/Ammo/Matter worker responses remain unchanged.
        if(data.sab) this._snapshot = new Float32Array(data.sab, 4);
        const resolveFn = this._pending.get(data.id);
        if(resolveFn) {
          if(data.count && data.count > 1) {
            resolveFn({
              idx: data.idx, count: data.count, nx: data.nx, ny: data.ny,
              vertexToNode: data.vertexToNode, vertexOffsets: data.vertexOffsets
            });
          } else {
            resolveFn(data.idx);
          }
          this._pending.delete(data.id);
        }
        break;
      case 'snapshot':
        this._snapshot = data.snap;
        // Cannon cloth/soft-body and Jolt SoftBody use the same mesh upload path.
        // Keep the established _clothMap metadata and normal update logic shared.
        // Process the two packet lists separately; do not allocate a combined array per snapshot.
        uploadClothPackets(data.clothPackets, this._clothMap, this._softBodyNormalUpdater);
        uploadClothPackets(data.softBodyPackets, this._clothMap, this._softBodyNormalUpdater);
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
      case 'vehicleAdded':
        if(data.sab) this._snapshot = new Float32Array(data.sab, 4);
        this._pending.get(data.id)?.(data);
        this._pending.delete(data.id);
        break;
      case 'getVehicleSpeed':
        this._pending.get(data.id)?.(data.speed);
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