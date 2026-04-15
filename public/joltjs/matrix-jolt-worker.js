const LAYER_NON_MOVING = 0;
const LAYER_MOVING = 1;
const LAYER_ANCHOR = 2;
const LAYER_FLIPPER = 3;
const NUM_OBJ_LAYERS = 4;
const FLOATS_PER_BODY = 8;
const NUM_BROAD_PHASE_LAYERS = 5;
const BP_LAYER_STATIC = 0;
const BP_LAYER_DYNAMIC = 1;

const degToRad = d => d * (Math.PI / 180);

function localToWorld(Jolt, body, localOffset) {
  const rot = body.GetRotation(); // Jolt quaternion
  // Rotate the offset vector by the quaternion: v' = q * v * q^-1
  const ox = localOffset[0], oy = localOffset[1], oz = localOffset[2];
  const qx = rot.GetX(), qy = rot.GetY(), qz = rot.GetZ(), qw = rot.GetW();

  // q * v
  const tx = qw * ox + qy * oz - qz * oy;
  const ty = qw * oy + qz * ox - qx * oz;
  const tz = qw * oz + qx * oy - qy * ox;
  const tw = -qx * ox - qy * oy - qz * oz;

  // (q*v) * q^-1
  const rx = tx * qw + tw * (-qx) + ty * (-qz) - tz * (-qy);
  const ry = ty * qw + tw * (-qy) + tz * (-qx) - tx * (-qz);
  const rz = tz * qw + tw * (-qz) + tx * (-qy) - ty * (-qx);

  const pos = body.GetPosition();
  return new Jolt.RVec3(
    pos.GetX() + rx,
    pos.GetY() + ry,
    pos.GetZ() + rz
  );
}

function buildConeVerts(radius, height, segments = 16) {
  const verts = [];
  const half = height / 2;
  for(let i = 0;i < segments;i++) {
    const a = (i / segments) * Math.PI * 2;
    verts.push(Math.cos(a) * radius, -half, Math.sin(a) * radius);
  }
  verts.push(0, half, 0);
  return verts;
}

class MatrixJolt {
  constructor() {
    this.rigidBodies = [];
    this.constraints = [];
    this.Jolt = null;
    this.joltInterface = null;
    this.physicsSystem = null;
    this.bodyInterface = null;
    this.speedUpSimulation = 3;
    this.options = {roundDimension: 100, gravity: 10};
    this._sab = null;
    this._snapshot = null;
    this._useSAB = false;
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

  async init(options = {}) {
    Object.assign(this.options, options);
    const module = await import('https://www.unpkg.com/jolt-physics/dist/jolt-physics.wasm-compat.js');
    const Jolt = await module.default();
    this.Jolt = Jolt;
    // cache
    this._vector0 = new Jolt.Vec3();
    this._vector1 = new Jolt.Vec3();
    this._vector2 = new Jolt.Vec3();
    this._initPhysics(options.groundY ?? 0);
    console.log('PHYSICS[JOLT]')
  }

  _initPhysics(GROUND_Y) {
    const Jolt = this.Jolt;
    const objectFilter = new Jolt.ObjectLayerPairFilterTable(NUM_OBJ_LAYERS);

    // existing
    objectFilter.EnableCollision(LAYER_NON_MOVING, LAYER_MOVING);
    objectFilter.EnableCollision(LAYER_MOVING, LAYER_MOVING);
    // objectFilter.EnableCollision(LAYER_NON_MOVING, LAYER_ANCHOR);
    // objectFilter.EnableCollision(LAYER_MOVING, LAYER_ANCHOR);
    objectFilter.EnableCollision(LAYER_FLIPPER, LAYER_MOVING);
    // objectFilter.EnableCollision(LAYER_FLIPPER, LAYER_NON_MOVING);
    // LAYER_FLIPPER <-> LAYER_ANCHOR = omitted

    const bpLayerInterface = new Jolt.BroadPhaseLayerInterfaceTable(NUM_OBJ_LAYERS, NUM_BROAD_PHASE_LAYERS);
    bpLayerInterface.MapObjectToBroadPhaseLayer(LAYER_NON_MOVING, BP_LAYER_STATIC);
    bpLayerInterface.MapObjectToBroadPhaseLayer(LAYER_MOVING, BP_LAYER_DYNAMIC);
    bpLayerInterface.MapObjectToBroadPhaseLayer(LAYER_ANCHOR, BP_LAYER_STATIC);  // kinematic = static BP bucket
    bpLayerInterface.MapObjectToBroadPhaseLayer(LAYER_FLIPPER, BP_LAYER_DYNAMIC);

    const bpObjectFilter = new Jolt.ObjectVsBroadPhaseLayerFilterTable(
      bpLayerInterface, NUM_BROAD_PHASE_LAYERS, objectFilter, NUM_OBJ_LAYERS
    );

    const settings = new Jolt.JoltSettings();
    settings.mObjectLayerPairFilter = objectFilter;
    settings.mBroadPhaseLayerInterface = bpLayerInterface;
    settings.mObjectVsBroadPhaseLayerFilter = bpObjectFilter;
    this.joltInterface = new Jolt.JoltInterface(settings);
    Jolt.destroy(settings);
    this.physicsSystem = this.joltInterface.GetPhysicsSystem();
    this.bodyInterface = this.physicsSystem.GetBodyInterface();
    this._vector0.Set(0, -this.options.gravity, 0);
    this.physicsSystem.SetGravity(this._vector0);
    this._vector1.Set(this.options.roundDimension, 1, this.options.roundDimension);
    const groundShape = new Jolt.BoxShape(this._vector1);
    const groundSettings = new Jolt.BodyCreationSettings(
      groundShape,
      new Jolt.RVec3(0, GROUND_Y, 0),
      Jolt.Quat.prototype.sIdentity(),
      Jolt.EMotionType_Static,
      LAYER_NON_MOVING
    );
    const groundBody = this.bodyInterface.CreateBody(groundSettings);
    Jolt.destroy(groundSettings);
    this.bodyInterface.AddBody(groundBody.GetID(), Jolt.EActivation_DontActivate);
  }

  addBody(pOptions) {
    let body = null;
    switch(pOptions.geometry) {
      case 'Sphere': body = this._addSphere(pOptions); break;
      case 'Cube': body = this._addBox(pOptions); break;
      case 'Capsule': body = this._addCapsule(pOptions); break;
      case 'Cylinder': body = this._addCylinder(pOptions); break;
      case 'Cone': body = this._addCone(pOptions); break;
      case 'ConvexHull': body = this._addConvexHull(pOptions); break;
      case 'BvhMesh': body = this._addBvhMesh(pOptions); break;
      default: return -1;
    }
    return body ? this.rigidBodies.length - 1 : -1;
  }

  _registerBody(body, pOptions) {
    body.name = pOptions.name;
    this.rigidBodies.push(body);
    this.bodyIDs = this.rigidBodies.map(b => b.GetID());
    this._allocBuffer(this.rigidBodies.length);
    const idx = this.rigidBodies.length - 1;
    if(this._snapshot) {
      const base = idx * FLOATS_PER_BODY;
      this._snapshot[base + 0] = pOptions.position?.x ?? 0;
      this._snapshot[base + 1] = pOptions.position?.y ?? 0;
      this._snapshot[base + 2] = pOptions.position?.z ?? 0;
    }
    return body;
  }

  _createBody(pOptions, shape) {
    const Jolt = this.Jolt;
    const pos = pOptions.position || {x: 0, y: 0, z: 0};

    const rot = pOptions.rotation || {x: 0, y: 0, z: 0};

    const rx = degToRad(rot.x || 0);
    const ry = degToRad(rot.y || 0);
    const rz = degToRad(rot.z || 0);

    // half angles
    const cx = Math.cos(rx * 0.5);
    const sx = Math.sin(rx * 0.5);
    const cy = Math.cos(ry * 0.5);
    const sy = Math.sin(ry * 0.5);
    const cz = Math.cos(rz * 0.5);
    const sz = Math.sin(rz * 0.5);

    // Euler (XYZ) → quaternion
    const q = new Jolt.Quat(
      sx * cy * cz + cx * sy * sz,
      cx * sy * cz - sx * cy * sz,
      cx * cy * sz + sx * sy * cz,
      cx * cy * cz - sx * sy * sz
    );

    const isKinematic = pOptions.kinematic || pOptions.state === 4;
    const isStatic = (pOptions.mass === 0 || pOptions.mass === undefined) && !isKinematic;

    const motionType = isStatic
      ? Jolt.EMotionType_Static
      : (isKinematic ? Jolt.EMotionType_Kinematic : Jolt.EMotionType_Dynamic);

    let layer;
    if(pOptions.layer !== undefined) {
      layer = pOptions.layer;
    } else if(isKinematic) {
      layer = LAYER_ANCHOR;
    } else if(isStatic) {
      layer = LAYER_NON_MOVING;
    } else {
      layer = LAYER_MOVING;
    }

    const settings = new Jolt.BodyCreationSettings(
      shape,
      new Jolt.RVec3(pos.x, pos.y, pos.z),
      q, // ✅ use computed quaternion
      motionType,
      layer
    );

    if(!isStatic) {
      settings.mOverrideMassProperties = Jolt.EOverrideMassProperties_CalculateInertia;
      settings.mMassPropertiesOverride.mMass = pOptions.mass || 1;
    }

    if(pOptions.restitution !== undefined) settings.mRestitution = pOptions.restitution;
    if(pOptions.friction !== undefined) settings.mFriction = pOptions.friction;

    const body = this.bodyInterface.CreateBody(settings);
    Jolt.destroy(settings);

    if(pOptions.sensor) {
      body.SetIsSensor(true);
    }

    body.isKinematic = isKinematic;

    this.bodyInterface.AddBody(
      body.GetID(),
      isStatic ? Jolt.EActivation_DontActivate : Jolt.EActivation_Activate
    );

    return this._registerBody(body, pOptions);
  }

  _addSphere(pOptions) {
    return this._createBody(pOptions, new this.Jolt.SphereShape(pOptions.scale[0]));
  }

  _addBox(pOptions) {
    const s = pOptions.scale || [1, 1, 1];
    return this._createBody(pOptions, new this.Jolt.BoxShape(new this.Jolt.Vec3(s[0], s[1], s[2])));
  }

  _addCapsule(pOptions) {
    const halfHeight = (pOptions.height || 1) * 0.5;
    const radius = pOptions.radius || 1;
    const shape = new this.Jolt.CapsuleShape(halfHeight, radius);
    return this._createBody(pOptions, shape);
  }

  _addCylinder(pOptions) {
    const Jolt = this.Jolt;
    const halfHeight = pOptions.scale ? pOptions.scale[1] : (pOptions.height || 2) * 0.5;
    const radius = pOptions.scale ? pOptions.scale[0] : (pOptions.radius || 1);

    const shape = new this.Jolt.CylinderShape(halfHeight, radius);
    return this._createBody(pOptions, shape);
  }

  _addCone(pOptions) {
    const Jolt = this.Jolt;
    const verts = buildConeVerts(pOptions.radius, pOptions.height);
    const settings = new Jolt.ConvexHullShapeSettings();
    const points = settings.mPoints;
    // this._vector0.Set()
    for(let i = 0;i < verts.length / 3;i++) {
      const v = new Jolt.Vec3(verts[i * 3], verts[i * 3 + 1], verts[i * 3 + 2]);
      points.push_back(v);
      Jolt.destroy(v);
    }
    const result = settings.Create();
    if(result.HasError()) {console.error(result.GetError().c_str()); return null;}
    const shape = result.Get();
    pOptions.position.y += shape.GetCenterOfMass().GetY();
    return this._createBody(pOptions, shape);
  }

  _addConvexHull(pOptions) {
    const Jolt = this.Jolt;
    const settings = new Jolt.ConvexHullShapeSettings();

    const verts = pOptions.vertices;
    const [sx, sy, sz] = pOptions.scale ?? [1, 1, 1];

    for(let i = 0;i < verts.length;i += 3) {
      settings.mPoints.push_back(
        new Jolt.Vec3(
          verts[i] * sx,
          verts[i + 1] * sy,
          verts[i + 2] * sz
        )
      );
    }
    const result = settings.Create();
    const shape = result.Get();
    Jolt.destroy(settings);
    return this._createBody(pOptions, shape);
  }

  _addBvhMesh(pOptions) {
    const Jolt = this.Jolt;
    const settings = new Jolt.MeshShapeSettings();

    const v = pOptions.vertices;
    const idx = pOptions.indices;
    const [sx, sy, sz] = pOptions.scale ?? [1, 1, 1];

    // ✅ APPLY SCALE HERE
    for(let i = 0;i < v.length;i += 3) {
      settings.mTriangleVertices.push_back(
        new Jolt.Float3(
          v[i] * sx,
          v[i + 1] * sy,
          v[i + 2] * sz
        )
      );
    }

    for(let i = 0;i < idx.length;i += 3) {
      settings.mIndexedTriangles.push_back(
        new Jolt.IndexedTriangle(idx[i], idx[i + 1], idx[i + 2], 0)
      );
    }

    const result = settings.Create();
    const shape = result.Get();

    Jolt.destroy(settings);

    return this._createBody(pOptions, shape);
  }

  // --- COMMAND INTERFACE ---

  applyImpulse(idx, x, y, z) {
    const b = this.rigidBodies[idx];
    if(b) this.bodyInterface.AddImpulse(b.GetID(), new this.Jolt.Vec3(x, y, z));
  }

  applyTorque(idx, x, y, z) {
    const b = this.rigidBodies[idx];
    if(b) this.bodyInterface.AddTorque(b.GetID(), new this.Jolt.Vec3(x, y, z));
  }

  shootBody(idx, lx, ly, lz, ax, ay, az) {
    const b = this.rigidBodies[idx];
    if(b) {
      this.bodyInterface.SetLinearVelocity(b.GetID(), new this.Jolt.Vec3(lx, ly, lz));
      this.bodyInterface.SetAngularVelocity(b.GetID(), new this.Jolt.Vec3(ax, ay, az));
    }
  }

  setLinearVelocity(idx, x, y, z) {
    const b = this.rigidBodies[idx];
    if(b) this.bodyInterface.SetLinearVelocity(b.GetID(), new this.Jolt.Vec3(x, y, z));
  }

  setActivationState(idx, state) {
    const b = this.rigidBodies[idx];
    if(b && state === 1) this.bodyInterface.ActivateBody(b.GetID());
  }

  activate(idx, force) {
    const b = this.rigidBodies[idx];
    if(b) this.bodyInterface.ActivateBody(b.GetID());
  }

  setDamping(idx, linear, angular) {
    const b = this.rigidBodies[idx];
    const mp = b?.GetMotionProperties();
    if(mp) {
      mp.SetLinearDamping(linear);
      mp.SetAngularDamping(angular);
    }
  }

  setRestitution(idx, s) {
    const b = this.rigidBodies[idx];
    if(b) b.SetRestitution(s);
  }

  setFriction(idx, s) {
    const b = this.rigidBodies[idx];
    if(b) b.SetFriction(s);
  }

  setGravity(x, y, z) {
    this.physicsSystem.SetGravity(new this.Jolt.Vec3(x, y, z));
  }

  setGravityScale(idx, scale) {
    const b = this.rigidBodies[idx];
    const mp = b?.GetMotionProperties();
    if(mp) mp.SetGravityFactor(scale);
  }

  setBodyTransform(idx, x, y, z) {
    const b = this.rigidBodies[idx];
    if(b) this.bodyInterface.SetPosition(b.GetID(), new this.Jolt.RVec3(x, y, z), this.Jolt.EActivation_Activate);
  }

  setKinematicTransform(idx, x, y, z) {
    const b = this.rigidBodies[idx];
    if(b) this.bodyInterface.MoveKinematic(b.GetID(), new this.Jolt.RVec3(x, y, z), this.Jolt.Quat.prototype.sIdentity(), 1 / 60);
  }

  clearBody(idx) {
    const b = this.rigidBodies[idx];
    if(b) {
      const zero = new this.Jolt.Vec3(0, 0, 0);
      this.bodyInterface.SetLinearVelocity(b.GetID(), zero);
      this.bodyInterface.SetAngularVelocity(b.GetID(), zero);
    }
  }

  explode(idx, x, y, z, radius, strength) {
    const b = this.rigidBodies[idx];
    if(!b) return;
    const bPos = this.bodyInterface.GetPosition(b.GetID());
    const dx = bPos.GetX() - x, dy = bPos.GetY() - y, dz = bPos.GetZ() - z;
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if(dist < radius) {
      const force = (1 - dist / radius) * strength;
      this.applyImpulse(idx, (dx / dist) * force, (dy / dist) * force, (dz / dist) * force);
    }
  }

  addHingeConstraint(idxA, idxB, pOptions, msgID) {
    const Jolt = this.Jolt;
    if(!this.constraints) this.constraints = [];
    const bodyA = this.rigidBodies[idxA];
    const bodyB = this.rigidBodies[idxB];

    if(bodyB.IsSensor()) {
      bodyB.SetIsSensor(true);
      console.log("SET SENSOR ON:", pOptions.name, bodyB.IsSensor());
    }


    if(!bodyA || !bodyB) return null;
    const pivotA = pOptions.pivotA || [0, 0, 0];
    const pivotB = pOptions.pivotB || [0, 0, 0];
    const axis = pOptions.axis || [0, 1, 0];
    console.log("hinge at index:", bodyA);
    console.log("hinge at index:", bodyB);
    const worldPivotA = localToWorld(Jolt, bodyA, pivotA);
    const worldPivotB = localToWorld(Jolt, bodyB, pivotB);


    console.log(
      "pivot diff:",
      worldPivotA.GetX() - worldPivotB.GetX(),
      worldPivotA.GetY() - worldPivotB.GetY(),
      worldPivotA.GetZ() - worldPivotB.GetZ()
    );


    const ax = axis[0], ay = axis[1], az = axis[2];
    let nx, ny, nz;
    if(Math.abs(ax) <= Math.abs(ay) && Math.abs(ax) <= Math.abs(az)) {
      // X is smallest component — cross with X axis
      nx = 0; ny = -az; nz = ay;
    } else if(Math.abs(ay) <= Math.abs(az)) {
      nx = az; ny = 0; nz = -ax;
    } else {
      nx = -ay; ny = ax; nz = 0;
    }
    // Normalize
    const nLen = Math.sqrt(nx * nx + ny * ny + nz * nz);
    nx /= nLen; ny /= nLen; nz /= nLen;

    const hingeSettings = new Jolt.HingeConstraintSettings();
    hingeSettings.mPoint1 = worldPivotA;
    hingeSettings.mPoint2 = worldPivotB;
    hingeSettings.mHingeAxis1 = new Jolt.Vec3(ax, ay, az);
    hingeSettings.mHingeAxis2 = new Jolt.Vec3(ax, ay, az);
    hingeSettings.mNormalAxis1 = new Jolt.Vec3(nx, ny, nz);
    hingeSettings.mNormalAxis2 = new Jolt.Vec3(nx, ny, nz);
    if(pOptions.limits) {
      hingeSettings.mLimitsMin = pOptions.limits[0];
      hingeSettings.mLimitsMax = pOptions.limits[1];
    }
    const constraint = hingeSettings.Create(bodyA, bodyB);
    this.physicsSystem.AddConstraint(constraint);
    constraint.name = pOptions.name;
    this.constraints.push(constraint);
    const constraintIdx = this.constraints.length - 1;
    console.log("hinge at index:", constraintIdx);
    self.postMessage({cmd: 'constraintAdded', id: msgID, idx: constraintIdx});
  }

  enableAngularMotor(cIdx, enable, targetVel, maxTorque) {
    const Jolt = this.Jolt;
    const c = this.constraints[cIdx];
    if(!c) return;

    const hinge = Jolt.castObject(c, Jolt.HingeConstraint);
    hinge.SetMotorState(enable ? Jolt.EMotorState_Velocity : Jolt.EMotorState_Off);

    if(enable) {
      hinge.SetTargetAngularVelocity(targetVel);
      const ms = hinge.GetMotorSettings();
      ms.mMaxTorqueLimit = Math.abs(maxTorque);
      ms.mMinTorqueLimit = -Math.abs(maxTorque);
    }
  }

  getPosition(idx, msgID) {
    const body = this.rigidBodies[idx];
    if(!body) {
      self.postMessage({cmd: 'getPosition', id: msgID, position: null});
      return;
    }
    const t = body.GetWorldTransform().GetTranslation();
    self.postMessage({
      cmd: 'getPosition',
      id: msgID,
      position: {x: t.GetX(), y: t.GetY(), z: t.GetZ()}
    });
  }

  step() {
    // if(!this.joltInterface) return;
    for(let i = 0;i < this.speedUpSimulation;i++) {
      this.joltInterface.Step(1 / 30, 1);
    }
    const snap = this._snapshot;
    if(!snap) return;
    const bi = this.bodyInterface;
    const ids = this.bodyIDs;
    const count = ids.length;
    for(let i = 0;i < count;i++) {
      const base = i * FLOATS_PER_BODY;
      const id = ids[i];
      // --- WASM calls ---
      const pos = bi.GetPosition(id);
      const rot = bi.GetRotation(id);
      // --- position ---
      snap[base + 0] = pos.GetX();
      snap[base + 1] = pos.GetY();
      snap[base + 2] = pos.GetZ();
      // --- quaternion DIRECT (NO CONVERSION)
      snap[base + 3] = rot.GetX();
      snap[base + 4] = rot.GetY();
      snap[base + 5] = rot.GetZ();
      snap[base + 6] = rot.GetW();
      // optional flag
      snap[base + 7] = 1;
    }
  }
}

const jolt = new MatrixJolt();

self.onmessage = async ({data}) => {
  const {cmd, id} = data;
  switch(cmd) {
    case 'init': await jolt.init(data.options); self.postMessage({cmd: 'ready', id}); break;
    case 'addBody': const idx = jolt.addBody(data.pOptions); self.postMessage({cmd: 'bodyAdded', id, idx, sab: jolt._sab}); break;
    case 'step': jolt.step(); if(!jolt._useSAB && jolt._snapshot) {const copy = jolt._snapshot.slice(); self.postMessage({cmd: 'snapshot', snap: copy}, [copy.buffer]);} break;
    case 'applyImpulse': jolt.applyImpulse(data.idx, data.x, data.y, data.z); break;
    case 'shootBody': jolt.shootBody(data.idx, data.lx, data.ly, data.lz, data.ax, data.ay, data.az); break;
    case 'setActivationState': jolt.setActivationState(data.idx, data.s); break;
    case 'activate': jolt.activate(data.idx, data.s); break;
    case 'setDamping': jolt.setDamping(data.idx, data.l, data.a); break;
    case 'setRestitution': jolt.setRestitution(data.idx, data.s); break;
    case 'setFriction': jolt.setFriction(data.idx, data.s); break;
    case 'applyTorque': jolt.applyTorque(data.idx, data.x, data.y, data.z); break;
    case 'setLinearVelocity': jolt.setLinearVelocity(data.idx, data.x, data.y, data.z); break;
    case 'setKinematicTransform': jolt.setKinematicTransform(data.idx, data.x, data.y, data.z); break;
    case 'setGravity': jolt.setGravity(data.x, data.y, data.z); break;
    case 'addHingeConstraint': jolt.addHingeConstraint(data.idxA, data.idxB, data.options, data.id); break;
    case 'enableAngularMotor': jolt.enableAngularMotor(data.constraintIdx, data.enable, data.targetVelocity, data.maxMotorImpulse); break;
    case 'clearBody': jolt.clearBody(data.idx); break;
    case 'setBodyTransform': jolt.setBodyTransform(data.idx, data.x, data.y, data.z); break;
    case 'setGravityScale': jolt.setGravityScale(data.idx, data.scale); break;
    case 'explode': jolt.explode(data.idx, data.x, data.y, data.z, data.radius, data.strength); break;
    case 'getPosition': jolt.getPosition(data.idx, data.id); break;
  }
};