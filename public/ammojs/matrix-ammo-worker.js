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
    this.maxSubSteps = 4;
    this.options = {roundDimensionX: 100, roundDimensionY: 100, gravity: -10};
    this._snapshot = null;
    this._useSAB = false;
    this._sab = null;
    this._trans = null;
    this._transform = null;
    this._origin = null;
    this._quat = null;
    this._axis = null;
    this.lastCollisionState = new Map();
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
    this.dynamicsWorld.addRigidBody(groundBody);
  }

  _allocBuffer(bodyCount) {
    const FLOATS = bodyCount * FLOATS_PER_BODY;
    const bytes = 4 + FLOATS * 4;
    if(typeof SharedArrayBuffer !== 'undefined') {
      this._sab = new SharedArrayBuffer(bytes);
      this._snapshot = new Float32Array(this._sab, 4);
      this._useSAB = true;
      new Uint32Array(this._sab, 0, 1)[0] = bodyCount;
    } else {
      this._sab = null;
      this._snapshot = new Float32Array(FLOATS);
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
    this._allocBuffer(this.rigidBodies.length);
    return this.rigidBodies.length - 1;
  }

  _applyBodyFlags(body, pOptions) {
    const CF_KINEMATIC = 2;
    const CF_NO_RESPONSE = 3;
    if(pOptions.mass === 0 && pOptions.state === undefined && pOptions.collide === undefined) {
      body.setCollisionFlags(CF_KINEMATIC);
      body.setActivationState(2);
      body.isKinematic = true;
    } else if(pOptions.collide === false) {
      body.setCollisionFlags(CF_NO_RESPONSE);
      body.setActivationState(4);
    } else {
      body.setActivationState(4);
    }
  }

  _registerBody(body, pOptions) {
    body.name = pOptions.name;
    this.dynamicsWorld.addRigidBody(body);
    this.rigidBodies.push(body);
    return body;
  }

  _addSphere(pOptions) {
    const Ammo = this.Ammo;
    const shape = new Ammo.btSphereShape(
      Array.isArray(pOptions.radius) ? pOptions.radius[0] : pOptions.radius
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
    console.warn("addHingeConstraint: bodies not found for WORKER");
    let Ammo = this.Ammo;
    if(!this.constraints) this.constraints = [];
    const bodyA = this.rigidBodies[idxA];
    const bodyB = this.rigidBodies[idxB];
    if(!bodyA || !bodyB) {
      console.warn("addHingeConstraint: bodies not found for MEObjects");
      return null;
    }
    // PIVOTS & AXIS
    const pivotA = pOptions.pivotA || [0, 0, 0];
    const pivotB = pOptions.pivotB || [0, 0, 0];
    const axis = pOptions.axis || [0, 1, 0];
    const ammoPivotA = new Ammo.btVector3(pivotA[0], pivotA[1], pivotA[2]);
    const ammoPivotB = new Ammo.btVector3(pivotB[0], pivotB[1], pivotB[2]);
    const frameA = new Ammo.btTransform();
    frameA.setIdentity();
    frameA.setOrigin(new Ammo.btVector3(pivotA[0], pivotA[1], pivotA[2])); // offset here
    const frameB = new Ammo.btTransform();
    frameB.setIdentity();
    frameB.setOrigin(new Ammo.btVector3(pivotB[0], pivotB[1], pivotB[2]));
    const ammoAxisA = new Ammo.btVector3(axis[0], axis[1], axis[2]);
    const ammoAxisB = new Ammo.btVector3(axis[0], axis[1], axis[2]);
    // CREATE HINGE
    const hinge = new Ammo.btHingeConstraint(
      bodyA,
      bodyB,
      ammoPivotA,
      ammoPivotB,
      ammoAxisA,
      ammoAxisB,
      true
    );
    // LIMITS
    if(pOptions.limits) {
      hinge.setLimit(pOptions.limits[0], pOptions.limits[1]);
    }
    this.dynamicsWorld.addConstraint(hinge, true);
    hinge.name = pOptions.name;
    this.constraints.push(hinge);

    const constraintIdx = this.constraints.length - 1;
    console.log("hingle at index: ", constraintIdx)
    self.postMessage({cmd: 'bodyAdded', id: msgID, idx: constraintIdx});
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
    const mass = pOptions.mass ?? 1;
    const inertia = new Ammo.btVector3(0, 0, 0);
    if(mass > 0) shape.calculateLocalInertia(mass, inertia);
    const body = new Ammo.btRigidBody(
      new Ammo.btRigidBodyConstructionInfo(mass, new Ammo.btDefaultMotionState(t), shape, inertia)
    );
    this._applyBodyFlags(body, pOptions);
    return this._registerBody(body, pOptions);
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
    const body = this.rigidBodies[idx];
    body.setLimit(v0, v1, v2, v3, v4);
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
      if(body.isKinematic || !body.getMotionState()) return;
      const base = i * FLOATS_PER_BODY;
      body.getMotionState().getWorldTransform(this._trans);
      snap[base + 0] = this._trans.getOrigin().x();
      snap[base + 1] = this._trans.getOrigin().y();
      snap[base + 2] = this._trans.getOrigin().z();
      const rot = this._trans.getRotation();
      rot.normalize();
      const axis = rot.getAxis();
      snap[base + 3] = axis.x();
      snap[base + 4] = axis.y();
      snap[base + 5] = axis.z();
      snap[base + 6] = rot.getAngle();
      snap[base + 7] = 0;
    });
    // collision detection — post events to main thread
    this._detectCollision();
  }

  _detectCollision() {
    const dispatcher = this.dynamicsWorld.getDispatcher();
    const numManifolds = dispatcher.getNumManifolds();
    const currentCollisions = new Set();
    for(let i = 0;i < numManifolds;i++) {
      const manifold = dispatcher.getManifoldByIndexInternal(i);
      if(manifold.getNumContacts() === 0) continue;
      // const name0 = this.rigidBodies.indexOf(manifold.getBody0());
      // const name1 = this.rigidBodies.indexOf(manifold.getBody1());
      const ptr0 = Ammo.getPointer(manifold.getBody0());
      const ptr1 = Ammo.getPointer(manifold.getBody1());

      const name0 = this.rigidBodies[this.rigidBodies.findIndex(b => b && Ammo.getPointer(b) === ptr0)].name;
      const name1 = this.rigidBodies[this.rigidBodies.findIndex(b => b && Ammo.getPointer(b) === ptr1)].name;

      console.log('worker - name0', name0)
      const key = `${name0}|${name1}`;
      currentCollisions.add(key);
      if(!this.lastCollisionState.has(key)) {
        const contact = manifold.getContactPoint();
        const normal = contact.get_m_normalWorldOnB();
        self.postMessage({
          cmd: 'collision',
          body0Name: name0,
          body1Name: name1,
          normal: [normal.x(), normal.y(), normal.z()]
        });
      }
    }
    this.lastCollisionState = currentCollisions;
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
    case 'shootBody': ammo.applyImpulse(data.idx, data.lx, data.ly, data.lz, data.ax, data.ay, data.az); break;

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
    case 'activate': ammo.activate(data.idx); break;
    case 'setDamping': ammo.setDamping(data.idx, data.linear, data.angular); break;
    case 'setSleepingThresholds': ammo.setSleepingThresholds(data.idx, data.linear, data.angular); break;
    case 'setAngularFactor': ammo.setAngularFactor(data.idx, data.x, data.y, data.z); break;
    // case 'setFriction': ammo.setFriction(data.idx, data.friction); break;
    case 'setRollingFriction': ammo.setRollingFriction(data.idx, data.friction); break;

    case 'addHingeConstraint': ammo.addHingeConstraint(data.idxA, data.idxB, data.options, data.id); break;
    case 'enableAngularMotor': ammo.enableAngularMotor(data.constraintIdx, data.enable, data.targetVelocity, data.maxMotorImpulse); break;

  }
};