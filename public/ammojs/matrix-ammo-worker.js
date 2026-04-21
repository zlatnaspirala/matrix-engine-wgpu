importScripts('ammo.js');

const degToRad = d => d * (Math.PI / 180);
const radToDeg = r => r * (180 / Math.PI);
const FLOATS_PER_BODY = 8;

class MatrixAmmoWorker {
  constructor() {
    this.Ammo = null;
    this.dynamicsWorld = null;
    this.rigidBodies = [];
    this.speedUpSimulation = 2;
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

    this._pivotsA = null;
    this._pivotsB = null;

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
    this._transform2 = new Ammo.btTransform();
    this._zero = new Ammo.btVector3(0, 0, 0);
    this._origin = new Ammo.btVector3(0, 0, 0);
    this._quat = new Ammo.btQuaternion();
    this._axis = new Ammo.btVector3(0, 0, 0);
    this._origin2 = new Ammo.btVector3(0, 0, 0);
    this._origin3 = new Ammo.btVector3(0, 0, 0);
    this._pivotsA = new Ammo.btVector3(0, 0, 0);
    this._pivotsB = new Ammo.btVector3(0, 0, 0);
    this.inertia = new Ammo.btVector3(0, 0, 0);
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
      body.setActivationState(1);
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
    console.log('_registerBody:', pOptions.name, 'group:', pOptions.group, 'mask:', pOptions.mask);
    body.name = pOptions.name;
    const group = pOptions.group ?? 1;
    const mask = pOptions.mask ?? -1;
    console.log('addRigidBody:', pOptions.name, group, mask, typeof group, typeof mask);
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
      this._snapshot[base + 7] = 1; // ← mark as active
    }
    // console.log('registered:', pOptions.name, 'at index:', this.rigidBodies.length - 1);
    return body;
  }

  _addSphere(pOptions) {
    const Ammo = this.Ammo;
    const shape = new Ammo.btSphereShape(
      Array.isArray(pOptions.radius) ? pOptions.radius[0] : pOptions.scale?.[0]
    );
    this._transform.setIdentity();
    this._origin.setValue(pOptions.position.x, pOptions.position.y, pOptions.position.z);
    this._transform.setOrigin(this._origin);
    this.inertia.setValue(0, 0, 0);
    const mass = pOptions.mass ?? 1;
    if(mass > 0) shape.calculateLocalInertia(mass, this.inertia);
    const motionState = new Ammo.btDefaultMotionState(this._transform);
    const rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, shape, this.inertia);
    const body = new Ammo.btRigidBody(rbInfo);

    body.setCcdMotionThreshold(0.1);
    body.setCcdSweptSphereRadius(0.05);

    Ammo.destroy(rbInfo);
    this._applyBodyFlags(body, pOptions);
    return this._registerBody(body, pOptions);
  }

  _addBox(pOptions) {
    const Ammo = this.Ammo;
    this._origin.setValue(pOptions.scale[0], pOptions.scale[1], pOptions.scale[2]);
    const shape = new Ammo.btBoxShape(this._origin);
    this._transform2.setIdentity();
    this._origin.setValue(pOptions.position.x, pOptions.position.y, pOptions.position.z);
    this._transform2.setOrigin(this._origin);
    this._quat.setEulerZYX(
      degToRad(pOptions.rotation?.z ?? 0),
      degToRad(pOptions.rotation?.y ?? 0),
      degToRad(pOptions.rotation?.x ?? 0)
    );
    this._transform2.setRotation(this._quat);
    const mass = pOptions.mass ?? 1;
    this.inertia.setValue(0, 0, 0);
    if(mass > 0) shape.calculateLocalInertia(mass, this.inertia);
    const motionState = new Ammo.btDefaultMotionState(this._transform2);
    const rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, shape, this.inertia);
    const body = new Ammo.btRigidBody(rbInfo);
    Ammo.destroy(rbInfo);
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
    bodyA.setAngularVelocity(this._zero);
    bodyA.setDamping(0.05, 0.1);
    // console.log("pivotA", pivotA);
    const axis = pOptions.axis || [0, 1, 0];
    this._pivotsA.setValue(pivotA[0], pivotA[1], pivotA[2]);
    this._pivotsB.setValue(pivotB[0], pivotB[1], pivotB[2]);
    const ammoPivotA = this._pivotsA;
    const ammoPivotB = this._pivotsB;
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
    // addHingeConstraint
    this.dynamicsWorld.addConstraint(hinge, true);
    hinge.enableAngularMotor(true, 0, 100);
    // hinge.setLimit(-0.8, 0.5);
    // const si = this.dynamicsWorld.getSolverInfo();
    // si.set_m_numIterations(20);
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
    // const inertia = new Ammo.btVector3(0, 0, 0);
    this.inertia.setValue(0, 0, 0);
    if(mass > 0) shape.calculateLocalInertia(mass, this.inertia);
    const body = new Ammo.btRigidBody(
      new Ammo.btRigidBodyConstructionInfo(mass, new Ammo.btDefaultMotionState(t), shape, this.inertia)
    );
    body.setDamping(pOptions.damping ?? 0.8, pOptions.damping ?? 1);
    body.setRestitution(pOptions.restitution ?? 0.1);
    body.setFriction(pOptions.friction ?? 1.0);
    this._applyBodyFlags(body, pOptions);
    return this._registerBody(body, pOptions);
  }

  _addCylinder(pOptions) {
    const Ammo = this.Ammo;
    this._pivotsA.setValue(pOptions.scale[0], pOptions.scale[1], pOptions.scale[2]);
    const shape = new Ammo.btCylinderShape(this._pivotsA);
    const t = new Ammo.btTransform();
    this._transform2.setIdentity();
    this._origin.setValue(pOptions.position.x, pOptions.position.y, pOptions.position.z);
    this._transform2.setOrigin(this._origin);
    const mass = pOptions.mass ?? 1;
    // const inertia = new Ammo.btVector3(0, 0, 0);
    this.inertia.setValue(0, 0, 0);
    if(mass > 0) shape.calculateLocalInertia(mass, this.inertia);
    const motionState = new Ammo.btDefaultMotionState(this._transform2);
    const rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, shape, this.inertia);
    const body = new Ammo.btRigidBody(rbInfo);
    Ammo.destroy(rbInfo);
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
      this._origin.setValue(verts[i] * sx, verts[i + 1] * sy, verts[i + 2] * sz);
      shape.addPoint(this._origin, false);
    }
    shape.recalcLocalAabb();
    this._transform2.setIdentity();
    this._origin.setValue(pOptions.position.x, pOptions.position.y, pOptions.position.z);
    this._transform2.setOrigin(this._origin);
    this._quat.setEulerZYX(
      degToRad(pOptions.rotation?.z ?? 0),
      degToRad(pOptions.rotation?.y ?? 0),
      degToRad(pOptions.rotation?.x ?? 0)
    );
    this._transform2.setRotation(this._quat);
    const mass = pOptions.mass ?? 1;
    this.inertia.setValue(0, 0, 0);
    if(mass > 0) shape.calculateLocalInertia(mass, this.inertia);
    const motionState = new Ammo.btDefaultMotionState(this._transform2);
    const rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, shape, this.inertia);
    const body = new Ammo.btRigidBody(rbInfo);
    Ammo.destroy(rbInfo);
    this._applyBodyFlags(body, pOptions);
    return this._registerBody(body, pOptions);
  }

  clearBody(idx) {
    const body = this.rigidBodies[idx];
    body.setAngularVelocity(this._zero);
    body.setLinearVelocity(this._zero);
    body.clearForces();
    // Ammo.destroy(zero);
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
    // body.setCollisionFlags(2);
    // body.setActivationState(2);
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
    // body.setCollisionFlags(2);
    // body.setActivationState(2);
    return this._registerBody(body, pOptions);
  }

  explode(idx, x, y, z, radius, strength) {
    // console.log('worker  explode')
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

  setBodyAngularVelocity(idx, x, y, z) {
    const body = this.rigidBodies[idx];
    if(!body) return;
    this._origin2.setValue(x, y, z);
    body.setAngularVelocity(this._origin2);
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
  // step() {
  //   if(!this.dynamicsWorld) return;
  //   for(let i = 0;i < this.speedUpSimulation;i++) {
  //     this.dynamicsWorld.stepSimulation(1 / 30, this.maxSubSteps);
  //   }
  //   const snap = this._snapshot;
  //   if(!snap) return;
  //   this.rigidBodies.forEach((body, i) => {
  //     const base = i * FLOATS_PER_BODY;
  //     if(body.isKinematic == true) {
  //       body.getWorldTransform(this._trans);
  //       const origin = this._trans.getOrigin();
  //       const rot = this._trans.getRotation();
  //       snap[base + 0] = origin.x();
  //       snap[base + 1] = origin.y();
  //       snap[base + 2] = origin.z();
  //       snap[base + 3] = rot.x();
  //       snap[base + 4] = rot.y();
  //       snap[base + 5] = rot.z();
  //       snap[base + 6] = rot.w();
  //       snap[base + 7] = 0;
  //       return;
  //     }
  //     if(!body.getMotionState()) return;
  //     body.getMotionState().getWorldTransform(this._trans);
  //     const origin = this._trans.getOrigin();
  //     const rot = this._trans.getRotation();
  //     snap[base + 0] = origin.x();
  //     snap[base + 1] = origin.y();
  //     snap[base + 2] = origin.z();
  //     snap[base + 3] = rot.x();
  //     snap[base + 4] = rot.y();
  //     snap[base + 5] = rot.z();
  //     snap[base + 6] = rot.w();
  //     snap[base + 7] = 0;
  //   });
  //   this._detectCollision();
  // }

  step() {
    if(!this.dynamicsWorld) return;
    const deltaTime = 1 / 30;
    for(let i = 0;i < this.speedUpSimulation;i++) {
      this.dynamicsWorld.stepSimulation(deltaTime, this.maxSubSteps);
    }
    const snap = this._snapshot;
    if(!snap) return;
    const bodies = this.rigidBodies;
    const numBodies = bodies.length;
    for(let i = 0;i < numBodies;i++) {
      const body = bodies[i];
      const base = i * FLOATS_PER_BODY;
      // if(!body.isActive() && !body.isKinematic) {
      //   snap[base + 7] = 0;
      //   continue;
      // }
      if(body.isKinematic) {
        body.getWorldTransform(this._trans);
      } else {
        const ms = body.getMotionState();
        if(!ms) continue;
        ms.getWorldTransform(this._trans);
      }
      const origin = this._trans.getOrigin();
      const rot = this._trans.getRotation();
      snap[base + 0] = origin.x();
      snap[base + 1] = origin.y();
      snap[base + 2] = origin.z();
      snap[base + 3] = rot.x();
      snap[base + 4] = rot.y();
      snap[base + 5] = rot.z();
      snap[base + 6] = rot.w();
      snap[base + 7] = 1;
    }
    this._detectCollision();
  }

  setGravityScale(idx, scale) {
    const body = this.rigidBodies[idx];
    if(!body) return;
    this._origin2.setValue(0, scale, 0);
    body.setGravity(this._origin2);
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
    this._currentCollisions.clear();
    for(let i = 0;i < numManifolds;i++) {
      const manifold = dispatcher.getManifoldByIndexInternal(i);
      if(manifold.getNumContacts() === 0) continue;
      const ptr0 = Ammo.getPointer(manifold.getBody0());
      const ptr1 = Ammo.getPointer(manifold.getBody1());
      const name0 = this.ptrToName.get(ptr0);
      const name1 = this.ptrToName.get(ptr1);
      if(!name0 || !name1) continue;
      if(name0 === 'ground' || name1 === 'ground') continue;
      // const key = name0 < name1 ? `${name0}|${name1}` : `${name1}|${name0}`;
      const key = name0 < name1
        ? name0 + "|" + name1
        : name1 + "|" + name0;
      this._currentCollisions.add(key);
      if(!this.lastCollisionState.has(key)) {
        const contact = manifold.getContactPoint(0);
        const normal = contact.get_m_normalWorldOnB();
        self.postMessage({
          cmd: 'collision', body0Name: name0, body1Name: name1,
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
      ammo.step();
      if(!ammo._useSAB && ammo._snapshot) {
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
    case 'setBodyAngularVelocity': ammo.setBodyAngularVelocity(data.idx, data.x, data.y, data.z); break;
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