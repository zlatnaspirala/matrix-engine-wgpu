importScripts('ammo.js');

function quaternion_rotation_matrix(Q) {
  var q0 = Q[0], q1 = Q[1], q2 = Q[2], q3 = Q[3];
  return [
    [2 * (q0 * q0 + q1 * q1) - 1, 2 * (q1 * q2 - q0 * q3), 2 * (q1 * q3 + q0 * q2)],
    [2 * (q1 * q2 + q0 * q3), 2 * (q0 * q0 + q2 * q2) - 1, 2 * (q2 * q3 - q0 * q1)],
    [2 * (q1 * q3 - q0 * q2), 2 * (q2 * q3 + q0 * q1), 2 * (q0 * q0 + q3 * q3) - 1]
  ];
}

const degToRad = d => d * (Math.PI / 180);
const radToDeg = r => r * (180 / Math.PI);
const FLOATS_PER_BODY = 8;

class MatrixAmmoWorker {
  constructor() {
    this.Ammo = null;
    this.dynamicsWorld = null;
    this.rigidBodies = [];
    this.speedUpSimulation = 1;
    this.maxSubSteps = 1;
    this.options = {roundDimensionX: 100, roundDimensionY: 100, gravity: -10};
    this._snapshot = null;
    this._useSAB = false;
    this._sab = null;
    this._trans = null;
    this._transform = null;
    this._origin = null;
    this._quat = null;
    this._axis = null;
    this.lastCollisionState = new Set();
    this._currentCollisions = new Set();

    this._keyColl = '';
  }

  async init(options = {}) {
    Object.assign(this.options, options);
    self.Ammo = await Ammo();
    this.Ammo = self.Ammo;
    this._trans = new Ammo.btTransform();
    this._transform = new Ammo.btTransform();
    this._origin = new Ammo.btVector3(0, 0, 0);
    this._quat = new Ammo.btQuaternion();
    this._axis = new Ammo.btVector3(0, 0, 0);
    this._origin2 = new Ammo.btVector3(0, 0, 0);
    this._origin3 = new Ammo.btVector3(0, 0, 0);
    this._initPhysics(options.groundY ?? -1);
  }

  _initPhysics(GROUND_Y) {
    const Ammo = this.Ammo;
    const cc = new Ammo.btDefaultCollisionConfiguration();
    const dispatcher = new Ammo.btCollisionDispatcher(cc);
    const broadphase = new Ammo.btDbvtBroadphase();
    const solver = new Ammo.btSequentialImpulseConstraintSolver();
    this.dynamicsWorld = new Ammo.btDiscreteDynamicsWorld(dispatcher, broadphase, solver, cc);
    this.dynamicsWorld.setGravity(new Ammo.btVector3(0, this.options.gravity, 0));
    // Ground
    const groundShape = new Ammo.btBoxShape(
      new Ammo.btVector3(this.options.roundDimensionX, 1, this.options.roundDimensionY)
    );
    const groundTransform = new Ammo.btTransform();
    groundTransform.setIdentity();
    groundTransform.setOrigin(new Ammo.btVector3(0, GROUND_Y, 0));
    const groundBody = new Ammo.btRigidBody(
      new Ammo.btRigidBodyConstructionInfo(0, new Ammo.btDefaultMotionState(groundTransform), groundShape, new Ammo.btVector3(0, 0, 0))
    );
    groundBody.name = 'ground';
    const group = 1;
    const mask = -1;
    this.dynamicsWorld.addRigidBody(groundBody, group, mask);
    // this.rigidBodies.push(groundBody);
    // this._allocBuffer(this.rigidBodies.length);
    if(!this.ptrToName) this.ptrToName = new Map();
    this.ptrToName.set(Ammo.getPointer(groundBody), 'ground');
  }

  _allocBuffer(bodyCount) {
    const FLOATS = bodyCount * FLOATS_PER_BODY;
    const bytes = 4 + FLOATS * 4;
    if(typeof SharedArrayBuffer !== 'undefined') {
      const newSab = new SharedArrayBuffer(bytes);
      const newSnap = new Float32Array(newSab, 4);
      if(this._snapshot) newSnap.set(this._snapshot);
      this._sab = newSab;
      this._snapshot = newSnap;
      this._useSAB = true;
      new Uint32Array(this._sab, 0, 1)[0] = bodyCount;
    } else {
      const newSnap = new Float32Array(FLOATS);
      if(this._snapshot) newSnap.set(this._snapshot);
      this._snapshot = newSnap;
      this._useSAB = false;
    }
  }

  addBody(pOptions) {
    const Ammo = this.Ammo;
    let body = null;
    switch(pOptions.geometry) {
      case 'Sphere': body = this._addSphere(pOptions); break;
      case 'Cube': body = this._addBox(pOptions); break;
      case 'Capsule':
      case 'CapsuleX':
      case 'CapsuleZ': body = this._addCapsule(pOptions); break;
      case 'Cylinder':
      case 'CylinderX':
      case 'CylinderZ': body = this._addCylinder(pOptions); break;
      case 'Cone':
      case 'ConeX':
      case 'ConeZ': body = this._addCone(pOptions); break;
      case 'ConvexHull': body = this._addConvexHull(pOptions); break;
      case 'BvhMesh': body = this._addBvhMesh(pOptions); break;
      case 'StaticPlane': body = this._addStaticPlane(pOptions); break;
      default:
        console.warn('[ammo-worker] unknown geometry:', pOptions.geometry);
        return -1;
    }
    if(!body) return -1;
    return this.rigidBodies.length - 1;
  }

  _applyBodyFlags(body, pOptions) {
    const CF_STATIC = 1;
    const CF_KINEMATIC = 2;
    if(pOptions.mass === 0 && !pOptions.state) {
      body.setCollisionFlags(CF_STATIC);
      body.setActivationState(4);
      body.isKinematic = false;
      return;
    }
    if(pOptions.state === 4) {
      body.setCollisionFlags(CF_KINEMATIC);
      body.setActivationState(4);
      body.isKinematic = true;
      return;
    }
    body.setCollisionFlags(0);
    body.setActivationState(1);
    body.isKinematic = false;
  }

  _registerBody(body, pOptions) {
    body.name = pOptions.name;
    const group = pOptions.group ?? 1;
    const mask = pOptions.mask ?? -1;
    this.dynamicsWorld.addRigidBody(body, group, mask);
    this.rigidBodies.push(body);
    if(!this.ptrToName) this.ptrToName = new Map();
    this.ptrToName.set(Ammo.getPointer(body), pOptions.name);
    this._allocBuffer(this.rigidBodies.length);
    const idx = this.rigidBodies.length - 1;
    if(this._snapshot) {
      const base = idx * FLOATS_PER_BODY;
      this._snapshot[base + 0] = pOptions.position?.x ?? 0;
      this._snapshot[base + 1] = pOptions.position?.y ?? 0;
      this._snapshot[base + 2] = pOptions.position?.z ?? 0;
    }
    // console.log('registered:', pOptions.name, 'at index:', this.rigidBodies.length - 1);
    return body;
  }

  _addSphere(pOptions) {
    const Ammo = this.Ammo;
    const radius = (pOptions.radius ?? 1) * (pOptions.scale?.[0] ?? 1);
    //  const shape = new Ammo.btSphereShape(radius);
    const shape = new Ammo.btSphereShape(
      Array.isArray(pOptions.radius) ? pOptions.radius[0] : pOptions.scale?.[0]
    );

    const t = new Ammo.btTransform();
    t.setIdentity();
    t.setOrigin(new Ammo.btVector3(pOptions.position.x, pOptions.position.y, pOptions.position.z));
    const inertia = new Ammo.btVector3(0, 0, 0);
    const mass = pOptions.mass ?? 1;
    if(mass > 0) shape.calculateLocalInertia(mass, inertia);
    const body = new Ammo.btRigidBody(
      new Ammo.btRigidBodyConstructionInfo(mass, new Ammo.btDefaultMotionState(t), shape, inertia)
    );
    this._applyBodyFlags(body, pOptions);
    return this._registerBody(body, pOptions);
  }

  _addBox(pOptions) {
    const Ammo = this.Ammo;
    const shape = new Ammo.btBoxShape(
      new Ammo.btVector3(pOptions.scale[0], pOptions.scale[1], pOptions.scale[2])
    );
    const t = new Ammo.btTransform();
    t.setIdentity();
    t.setOrigin(new Ammo.btVector3(pOptions.position.x, pOptions.position.y, pOptions.position.z));
    const rot = t.getRotation();
    rot.setX(degToRad(pOptions.rotation?.x ?? 0));
    rot.setY(degToRad(pOptions.rotation?.y ?? 0));
    rot.setZ(degToRad(pOptions.rotation?.z ?? 0));
    t.setRotation(rot);

    const mass = pOptions.mass ?? 1;
    const inertia = new Ammo.btVector3(0, 0, 0);
    if(mass > 0) shape.calculateLocalInertia(mass, inertia);
    const body = new Ammo.btRigidBody(
      new Ammo.btRigidBodyConstructionInfo(mass, new Ammo.btDefaultMotionState(t), shape, inertia)
    );
    this._applyBodyFlags(body, pOptions);
    return this._registerBody(body, pOptions);
  }

  addHingeConstraint(idxA, idxB, pOptions, msgID) {
    let Ammo = this.Ammo;
    if(!this.constraints) this.constraints = [];
    const bodyA = this.rigidBodies[idxA];
    const bodyB = this.rigidBodies[idxB];
    if(!bodyA || !bodyB) {
      console.warn("addHingeConstraint: bodies not found for MEObjects");
      return null;
    }
    const pivotA = pOptions.pivotA || [0, 0, 0];
    const pivotB = pOptions.pivotB || [0, 0, 0];
    bodyA.setAngularVelocity(new Ammo.btVector3(0, 0, 0));
    bodyA.setDamping(0.2, 0.9);
    // console.log("pivotA", pivotA);
    const axis = pOptions.axis || [0, 1, 0];
    const ammoPivotA = new Ammo.btVector3(pivotA[0], pivotA[1], pivotA[2]);
    const ammoPivotB = new Ammo.btVector3(pivotB[0], pivotB[1], pivotB[2]);
    const ammoAxisA = new Ammo.btVector3(axis[0], axis[1], axis[2]);
    const ammoAxisB = new Ammo.btVector3(axis[0], axis[1], axis[2]);
    const hinge = new Ammo.btHingeConstraint(
      bodyA, bodyB,
      ammoPivotA, ammoPivotB,
      ammoAxisA, ammoAxisB,
      true
    );
    if(pOptions.limits) {
      hinge.setLimit(pOptions.limits[0], pOptions.limits[1]);
    }
    hinge.setLimit(-0.8, 0.5, 0.0, 0.5, 1.0);
    this.dynamicsWorld.addConstraint(hinge, true);
    hinge.enableAngularMotor(true, 0, 0);
    hinge.setLimit(-0.8, 0.5);

    const si = this.dynamicsWorld.getSolverInfo();
    si.set_m_numIterations(50);
    hinge.name = pOptions.name;
    this.constraints.push(hinge);
    const constraintIdx = this.constraints.length - 1;
    // console.log("hingle at index: ", constraintIdx);
    self.postMessage({cmd: 'constraintAdded', id: msgID, idx: constraintIdx});
  }

  enableAngularMotor(constraintIdx, enable, targetVelocity, maxMotorImpulse) {
    this.constraints[constraintIdx].enableAngularMotor(enable, targetVelocity, maxMotorImpulse);
  }

  _addCapsule(pOptions) {
    const Ammo = this.Ammo;
    const shape = new Ammo.btCapsuleShape(pOptions.radius ?? 1, pOptions.height ?? 1);
    const t = new Ammo.btTransform();
    t.setIdentity();
    t.setOrigin(new Ammo.btVector3(pOptions.position.x, pOptions.position.y, pOptions.position.z));
    const mass = pOptions.mass ?? 1;
    const inertia = new Ammo.btVector3(0, 0, 0);
    if(mass > 0) shape.calculateLocalInertia(mass, inertia);
    const body = new Ammo.btRigidBody(
      new Ammo.btRigidBodyConstructionInfo(mass, new Ammo.btDefaultMotionState(t), shape, inertia)
    );
    body.setDamping(pOptions.damping ?? 0.8, pOptions.damping ?? 1);
    body.setRestitution(pOptions.restitution ?? 0.1);
    body.setFriction(pOptions.friction ?? 1.0);
    this._applyBodyFlags(body, pOptions);
    return this._registerBody(body, pOptions);
  }

  _addCylinder(pOptions) {
    const Ammo = this.Ammo;
    const shape = new Ammo.btCylinderShape(
      new Ammo.btVector3(pOptions.scale[0], pOptions.scale[1], pOptions.scale[2])
    );
    const t = new Ammo.btTransform();
    t.setIdentity();
    t.setOrigin(new Ammo.btVector3(pOptions.position.x, pOptions.position.y, pOptions.position.z));
    const mass = pOptions.mass ?? 1;
    const inertia = new Ammo.btVector3(0, 0, 0);
    if(mass > 0) shape.calculateLocalInertia(mass, inertia);
    const body = new Ammo.btRigidBody(
      new Ammo.btRigidBodyConstructionInfo(mass, new Ammo.btDefaultMotionState(t), shape, inertia)
    );
    this._applyBodyFlags(body, pOptions);
    return this._registerBody(body, pOptions);
  }

  _addCone(pOptions) {
    const Ammo = this.Ammo;
    const shape = new Ammo.btConeShape(pOptions.radius ?? 1, pOptions.height ?? 1);
    const t = new Ammo.btTransform();
    t.setIdentity();
    t.setOrigin(new Ammo.btVector3(pOptions.position.x, pOptions.position.y, pOptions.position.z));
    const mass = pOptions.mass ?? 1;
    const inertia = new Ammo.btVector3(0, 0, 0);
    if(mass > 0) shape.calculateLocalInertia(mass, inertia);
    const body = new Ammo.btRigidBody(
      new Ammo.btRigidBodyConstructionInfo(mass, new Ammo.btDefaultMotionState(t), shape, inertia)
    );
    this._applyBodyFlags(body, pOptions);
    return this._registerBody(body, pOptions);
  }

  _addConvexHull(pOptions) {
    const Ammo = this.Ammo;
    const shape = new Ammo.btConvexHullShape();
    const verts = pOptions.vertices;
    const [sx, sy, sz] = pOptions.scale ?? [1, 1, 1];
    for(let i = 0;i < verts.length;i += 3) {
      shape.addPoint(new Ammo.btVector3(verts[i] * sx, verts[i + 1] * sy, verts[i + 2] * sz), true);
    }
    const t = new Ammo.btTransform();
    t.setIdentity();
    t.setOrigin(new Ammo.btVector3(pOptions.position.x, pOptions.position.y, pOptions.position.z));
    const rot = t.getRotation();
    rot.setX(degToRad(pOptions.rotation?.x ?? 0));
    rot.setY(degToRad(pOptions.rotation?.y ?? 0));
    rot.setZ(degToRad(pOptions.rotation?.z ?? 0));
    t.setRotation(rot);
    const mass = pOptions.mass ?? 1;
    const inertia = new Ammo.btVector3(0, 0, 0);
    if(mass > 0) shape.calculateLocalInertia(mass, inertia);
    const body = new Ammo.btRigidBody(
      new Ammo.btRigidBodyConstructionInfo(mass, new Ammo.btDefaultMotionState(t), shape, inertia)
    );
    this._applyBodyFlags(body, pOptions);
    return this._registerBody(body, pOptions);
  }

  clearBody(idx) {
    const body = this.rigidBodies[idx];
    const zero = new this.Ammo.btVector3(0, 0, 0);
    body.setAngularVelocity(zero);
    body.setLinearVelocity(zero);
    body.clearForces();
    Ammo.destroy(zero);
  }

  _addBvhMesh(pOptions) {
    const Ammo = this.Ammo;
    const triMesh = new Ammo.btTriangleMesh(true, true);
    const v = pOptions.vertices;
    const idx = pOptions.indices;
    for(let i = 0;i < idx.length;i += 3) {
      const i0 = idx[i] * 3, i1 = idx[i + 1] * 3, i2 = idx[i + 2] * 3;
      triMesh.addTriangle(
        new Ammo.btVector3(v[i0], v[i0 + 1], v[i0 + 2]),
        new Ammo.btVector3(v[i1], v[i1 + 1], v[i1 + 2]),
        new Ammo.btVector3(v[i2], v[i2 + 1], v[i2 + 2]),
        false
      );
    }
    const shape = new Ammo.btBvhTriangleMeshShape(triMesh, true, true);
    const t = new Ammo.btTransform();
    t.setIdentity();
    t.setOrigin(new Ammo.btVector3(pOptions.position.x, pOptions.position.y, pOptions.position.z));
    const body = new Ammo.btRigidBody(
      new Ammo.btRigidBodyConstructionInfo(0, new Ammo.btDefaultMotionState(t), shape, new Ammo.btVector3(0, 0, 0))
    );
    body.setCollisionFlags(2);
    body.setActivationState(2);
    return this._registerBody(body, pOptions);
  }

  _addStaticPlane(pOptions) {
    const Ammo = this.Ammo;
    const n = pOptions.normal ?? [0, 1, 0];
    const shape = new Ammo.btStaticPlaneShape(new Ammo.btVector3(n[0], n[1], n[2]), pOptions.constant ?? 0);
    const t = new Ammo.btTransform();
    t.setIdentity();
    t.setOrigin(new Ammo.btVector3(pOptions.position?.x ?? 0, pOptions.position?.y ?? 0, pOptions.position?.z ?? 0));
    const body = new Ammo.btRigidBody(
      new Ammo.btRigidBodyConstructionInfo(0, new Ammo.btDefaultMotionState(t), shape, new Ammo.btVector3(0, 0, 0))
    );
    body.setCollisionFlags(2);
    body.setActivationState(2);
    return this._registerBody(body, pOptions);
  }

  explode(idx, x, y, z, radius, strength) {
    console.log('worker  explode')
    const body = this.rigidBodies[idx];
    if(!body) return;
    this.rigidBodies.forEach(body => {
      const p = body.getWorldTransform().getOrigin();
      const dx = p.x() - x;
      const dy = p.y() - y;
      const dz = p.z() - z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if(dist > radius || dist === 0) return;
      const force = strength / (dist + 0.1);
      body.applyImpulse(new this.Ammo.btVector3(dx * force, dy * force, dz * force));
    });
  }

  shootBody = (idx, lx, ly, lz, ax, ay, az) => {
    const body = this.rigidBodies[idx];
    this._origin3.setValue(lx, ly, lz);
    body.setLinearFactor(this._origin3);
    this._origin3.setValue(ax, ay, az);
    body.setAngularFactor(this._origin3);
  }

  setActivationState = (idx, s) => {
    const body = this.rigidBodies[idx];
    body.setActivationState(s);
  }

  activate = (idx, s) => {
    const body = this.rigidBodies[idx];
    body.activate(s);
  }

  setDamping = (idx, l, a) => {
    const body = this.rigidBodies[idx];
    body.setDamping(l, a);
  }

  setRestitution = (idx, s) => {
    const body = this.rigidBodies[idx];
    body.setRestitution(s);
  }

  setFriction = (idx, s) => {
    const body = this.rigidBodies[idx];
    body.setFriction(s);
  }

  setHingeLimit(idx, v0, v1, v2, v3, v4) {
    this.constraints[idx].setLimit(v0, v1, v2, v3, v4);
  }

  applyImpulse(idx, x, y, z) {
    const body = this.rigidBodies[idx];
    if(!body) return;
    const v = new this.Ammo.btVector3(x, y, z);
    body.activate(true);
    body.applyCentralImpulse(v);
    this.Ammo.destroy(v);
  }

  applyTorque(idx, x, y, z) {
    const body = this.rigidBodies[idx];
    if(!body) return;
    const v = new this.Ammo.btVector3(x, y, z);
    body.activate(true);
    body.applyTorqueImpulse(v);
    this.Ammo.destroy(v);
  }

  setLinearVelocity(idx, x, y, z) {
    const body = this.rigidBodies[idx];
    if(!body) return;
    this._origin2.setValue(x, y, z);
    body.setLinearVelocity(this._origin2);
  }

  setKinematicTransform(idx, x, y, z) {
    const body = this.rigidBodies[idx];
    if(!body || !body.isKinematic) return;
    const pos = body.getWorldTransform().getOrigin();
    pos.setValue(x, y, z);
    const ms = body.getMotionState();
    if(ms) {
      this._transform.setIdentity();
      this._transform.setOrigin(pos);
      ms.setWorldTransform(this._transform);
    }
  }

  getPosition(idx, msgID) {
    const body = this.rigidBodies[idx];
    if(!body) {
      self.postMessage({cmd: 'getPosition', id: msgID, position: null});
      return;
    }
    const origin = body.getWorldTransform().getOrigin();
    self.postMessage({cmd: 'getPosition', id: msgID, position: {x: origin.x(), y: origin.y(), z: origin.z()}});
  }

  setGravity(x, y, z) {
    this._origin2.setValue(x, y, z);
    this.dynamicsWorld.setGravity(this._origin2);
  }

  activate(idx) {
    this.rigidBodies[idx]?.activate(true);
  }

  // Step + Snapshot
  step() {
    if(!this.dynamicsWorld) return;
    for(let i = 0;i < this.speedUpSimulation;i++) {
      this.dynamicsWorld.stepSimulation(1 / 30, this.maxSubSteps);
    }
    const snap = this._snapshot;
    if(!snap) return;
    this.rigidBodies.forEach((body, i) => {
      const base = i * FLOATS_PER_BODY;
      if(body.isKinematic == true) {
        body.getWorldTransform(this._trans);
        const origin = this._trans.getOrigin();
        const rot = this._trans.getRotation();
        snap[base + 0] = origin.x();
        snap[base + 1] = origin.y();
        snap[base + 2] = origin.z();
        snap[base + 3] = rot.x();
        snap[base + 4] = rot.y();
        snap[base + 5] = rot.z();
        snap[base + 6] = rot.w();
        snap[base + 7] = 0;
        return;
      }
      if(!body.getMotionState()) return;
      body.getMotionState().getWorldTransform(this._trans);
      const origin = this._trans.getOrigin();
      const rot = this._trans.getRotation();
      snap[base + 0] = origin.x();
      snap[base + 1] = origin.y();
      snap[base + 2] = origin.z();
      snap[base + 3] = rot.x();
      snap[base + 4] = rot.y();
      snap[base + 5] = rot.z();
      snap[base + 6] = rot.w();
      snap[base + 7] = 0;
    });
    this._detectCollision();
  }

  setGravityScale(idx, scale) {
    const body = this.rigidBodies[idx];
    if(!body) return;
    body.setGravity(new this.Ammo.btVector3(0, scale, 0));
  }

  setCollisionFlags(idx, flags) {
    this.rigidBodies[idx].setCollisionFlags(flags);
  }

  setBodyTransform(idx, x, y, z) {
    const body = this.rigidBodies[idx];
    if(!body) return;
    const t = body.getWorldTransform();
    this._origin2.setValue(x, y, z);
    t.setOrigin(this._origin2);
    body.setWorldTransform(t);
    body.getMotionState()?.setWorldTransform(t);
    this._origin3.setValue(0, 0, 0);
    body.setLinearVelocity(this._origin3);
    body.setAngularVelocity(this._origin3);
    body.clearForces();
  }

  _detectCollision() {
    const dispatcher = this.dynamicsWorld.getDispatcher();
    const numManifolds = dispatcher.getNumManifolds();

    // Clear the "current" set for this frame (reuses the object)
    this._currentCollisions.clear();

    for(let i = 0;i < numManifolds;i++) {
      const manifold = dispatcher.getManifoldByIndexInternal(i);
      if(manifold.getNumContacts() === 0) continue;

      const ptr0 = Ammo.getPointer(manifold.getBody0());
      const ptr1 = Ammo.getPointer(manifold.getBody1());

      const name0 = this.ptrToName.get(ptr0);
      const name1 = this.ptrToName.get(ptr1);

      if(!name0 || !name1) continue; // Use continue instead of return to check other manifolds
      if(name0 === 'ground' || name1 === 'ground') continue;

      // Use a consistent key order (e.g. alphabetical) so A|B is same as B|A
      // const key = name0 < name1 ? `${name0}|${name1}` : `${name1}|${name0}`;
      this._keyColl = name0+name1;
      const key = this._keyColl;

      this._currentCollisions.add(key);

      // Check against LAST frame's set
      if(!this.lastCollisionState.has(key)) {
        const contact = manifold.getContactPoint(0);
        const normal = contact.get_m_normalWorldOnB();

        self.postMessage({
          cmd: 'collision',
          body0Name: name0,
          body1Name: name1,
          normal: [normal.x(), normal.y(), normal.z()]
        });
      }
    }
    let temp = this.lastCollisionState;
    this.lastCollisionState = this._currentCollisions;
    this._currentCollisions = temp;
  }
}

const ammo = new MatrixAmmoWorker();

self.onmessage = async ({data}) => {
  const {cmd, id} = data;
  switch(cmd) {
    case 'init': {
      try {
        await ammo.init(data.options);
        self.postMessage({cmd: 'ready', id});
      } catch(e) {
        console.error('[ammo-worker] init failed:', e);
      }
      break;
    }
    case 'addBody': {
      const idx = ammo.addBody(data.pOptions);
      self.postMessage({cmd: 'bodyAdded', id, idx, sab: ammo._sab});
      break;
    }
    case 'step': {
      if(!ammo._useSAB && ammo._snapshot) {
        ammo.step();
        const copy = ammo._snapshot.slice();
        self.postMessage({cmd: 'snapshot', snap: copy}, [copy.buffer]);
      }
      break;
    }
    case 'applyImpulse': ammo.applyImpulse(data.idx, data.x, data.y, data.z); break;
    case 'shootBody': ammo.shootBody(data.idx, data.lx, data.ly, data.lz, data.ax, data.ay, data.az); break;
    case 'setActivationState': ammo.setActivationState(data.idx, data.s); break;
    case 'activate': ammo.activate(data.idx, data.s); break;
    case 'setDamping': ammo.setDamping(data.idx, data.l, data.a); break;
    case 'setRestitution': ammo.setRestitution(data.idx, data.s); break;
    case 'setFriction': ammo.setFriction(data.idx, data.s); break;
    case 'setHingeLimit': ammo.setHingeLimit(data.idx, data.v0, data.v1, data.v2, data.v3, data.v4); break;
    case 'explode': ammo.explode(data.idx, data.x, data.y, data.z, data.radius, data.strength); break;
    case 'applyTorque': ammo.applyTorque(data.idx, data.x, data.y, data.z); break;
    case 'setLinearVelocity': ammo.setLinearVelocity(data.idx, data.x, data.y, data.z); break;
    case 'setKinematicTransform': ammo.setKinematicTransform(data.idx, data.x, data.y, data.z); break;
    case 'setGravity': ammo.setGravity(data.x, data.y, data.z); break;
    case 'setSleepingThresholds': ammo.setSleepingThresholds(data.idx, data.linear, data.angular); break;
    case 'setAngularFactor': ammo.setAngularFactor(data.idx, data.x, data.y, data.z); break;
    case 'setRollingFriction': ammo.setRollingFriction(data.idx, data.friction); break;
    case 'addHingeConstraint': ammo.addHingeConstraint(data.idxA, data.idxB, data.options, data.id); break;
    case 'enableAngularMotor': ammo.enableAngularMotor(data.constraintIdx, data.enable, data.targetVelocity, data.maxMotorImpulse); break;
    case 'setCollisionFlags': ammo.setCollisionFlags(data.idx, data.flags); break;
    case 'clearBody': ammo.clearBody(data.idx); break;
    case 'setBodyTransform': ammo.setBodyTransform(data.idx, data.x, data.y, data.z); break;
    case 'setGravityScale': ammo.setGravityScale(data.idx, data.scale); break;
    case 'getPosition': ammo.getPosition(data.idx, data.id); break;
  }
};