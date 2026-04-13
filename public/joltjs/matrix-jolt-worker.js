const LAYER_NON_MOVING = 0;
const LAYER_MOVING = 1;
const NUM_BROAD_PHASE_LAYERS = 2;
const FLOATS_PER_BODY = 8; // px py pz ax ay az angle pad

class MatrixJolt {
  constructor() {
    this.rigidBodies = [];
    this.constraints = [];
    this.Jolt = null;
    this.joltInterface = null;
    this.physicsSystem = null;
    this.bodyInterface = null;
    this.speedUpSimulation = 1;
    this.options = {roundDimension: 100, gravity: 10};
    this._sab = null;
    this._snapshot = null;
    this._useSAB = false;
  }

  // Mirrors Ammo _allocBuffer: grows buffer and copies existing data
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
    this._initPhysics(options.groundY ?? 0);
  }

  _initPhysics(GROUND_Y) {
    const Jolt = this.Jolt;
    const objectFilter = new Jolt.ObjectLayerPairFilterTable(2);
    objectFilter.EnableCollision(LAYER_NON_MOVING, LAYER_MOVING);
    objectFilter.EnableCollision(LAYER_MOVING, LAYER_MOVING);

    const bpLayerInterface = new Jolt.BroadPhaseLayerInterfaceTable(2, 2);
    bpLayerInterface.MapObjectToBroadPhaseLayer(LAYER_NON_MOVING, 0);
    bpLayerInterface.MapObjectToBroadPhaseLayer(LAYER_MOVING, 1);

    const bpObjectFilter = new Jolt.ObjectVsBroadPhaseLayerFilterTable(
      bpLayerInterface, NUM_BROAD_PHASE_LAYERS, objectFilter, 2
    );

    const settings = new Jolt.JoltSettings();
    settings.mObjectLayerPairFilter = objectFilter;
    settings.mBroadPhaseLayerInterface = bpLayerInterface;
    settings.mObjectVsBroadPhaseLayerFilter = bpObjectFilter;

    this.joltInterface = new Jolt.JoltInterface(settings);
    Jolt.destroy(settings);

    this.physicsSystem = this.joltInterface.GetPhysicsSystem();
    this.bodyInterface = this.physicsSystem.GetBodyInterface();
    this.physicsSystem.SetGravity(new Jolt.Vec3(0, -this.options.gravity, 0));

    // Ground
    const groundShape = new Jolt.BoxShape(
      new Jolt.Vec3(this.options.roundDimension, 1, this.options.roundDimension)
    );
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
      default:
        console.warn('Unknown geometry:', pOptions.geometry);
        return -1;
    }
    if(!body) return -1;
    return this.rigidBodies.length - 1;
  }

  // Central registration — mirrors Ammo _registerBody
  _registerBody(body, pOptions) {
    body.name = pOptions.name;
    this.rigidBodies.push(body);
    this._allocBuffer(this.rigidBodies.length);
    const idx = this.rigidBodies.length - 1;
    // Seed initial position so snapshot is valid before first step
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
    const isKinematic = pOptions.state === 4;
    const isStatic = pOptions.mass === 0 && !isKinematic;

    const motionType = isStatic ? Jolt.EMotionType_Static
      : isKinematic ? Jolt.EMotionType_Kinematic
        : Jolt.EMotionType_Dynamic;
    const layer = isStatic || isKinematic ? LAYER_NON_MOVING : LAYER_MOVING;

    const settings = new Jolt.BodyCreationSettings(
      shape,
      new Jolt.RVec3(pos.x, pos.y, pos.z),
      Jolt.Quat.prototype.sIdentity(),
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

    body.isKinematic = isKinematic;
    const activation = isStatic ? Jolt.EActivation_DontActivate : Jolt.EActivation_Activate;
    this.bodyInterface.AddBody(body.GetID(), activation);

    return this._registerBody(body, pOptions);
  }

  _addSphere(pOptions) {
    const radius = Array.isArray(pOptions.radius) ? pOptions.radius[0] : (pOptions.radius || 1);
    return this._createBody(pOptions, new this.Jolt.SphereShape(radius));
  }

  _addBox(pOptions) {
    const [sx, sy, sz] = pOptions.scale;
    return this._createBody(pOptions, new this.Jolt.BoxShape(new this.Jolt.Vec3(sx, sy, sz)));
  }

  _addCapsule(pOptions) {
    return this._createBody(pOptions,
      new this.Jolt.CapsuleShape((pOptions.height || 2) * 0.5, pOptions.radius || 1));
  }

  _addCylinder(pOptions) {
    return this._createBody(pOptions,
      new this.Jolt.CylinderShape(pOptions.height / 4, pOptions.radius));
  }

  _addCone(pOptions) {
    const Jolt = this.Jolt;
    const verts = buildConeVerts(pOptions.radius, pOptions.height);
    const settings = new Jolt.ConvexHullShapeSettings();
    const points = settings.mPoints;
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
    const verts = new Float32Array(pOptions.vertices);
    const settings = new Jolt.ConvexHullShapeSettings();
    settings.mHullTolerance = 1e-6;
    const points = settings.mPoints;
    const [sx, sy, sz] = pOptions.scale ?? [1, 1, 1];
    for(let i = 0;i < verts.length / 3;i++) {
      const x = verts[i * 3] * sx, y = verts[i * 3 + 1] * sy, z = verts[i * 3 + 2] * sz;
      if(!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) continue;
      const v = new Jolt.Vec3(x, y, z);
      points.push_back(v);
      Jolt.destroy(v);
    }
    if(points.size() < 4) {Jolt.destroy(settings); return null;}
    const result = settings.Create();
    if(result.HasError()) {Jolt.destroy(settings); return null;}
    const shape = result.Get();
    const com = shape.GetCenterOfMass();
    pOptions.position.x -= com.GetX();
    pOptions.position.y -= com.GetY();
    pOptions.position.z -= com.GetZ();
    const body = this._createBody(pOptions, shape);
    Jolt.destroy(settings);
    return body;
  }

  _addBvhMesh(pOptions) {
    const Jolt = this.Jolt;
    const v = pOptions.vertices;
    const idx = pOptions.indices;
    const settings = new Jolt.MeshShapeSettings();
    const triangles = settings.mTriangleVertices;
    const indexed = settings.mIndexedTriangles;

    // Push all vertices
    for(let i = 0;i < v.length;i += 3) {
      const jv = new Jolt.Float3(v[i], v[i + 1], v[i + 2]);
      triangles.push_back(jv);
      Jolt.destroy(jv);
    }
    // Push all triangles
    for(let i = 0;i < idx.length;i += 3) {
      const tri = new Jolt.IndexedTriangle(idx[i], idx[i + 1], idx[i + 2], 0);
      indexed.push_back(tri);
      Jolt.destroy(tri);
    }

    const result = settings.Create();
    if(result.HasError()) {
      console.error('[jolt] BvhMesh error:', result.GetError().c_str());
      Jolt.destroy(settings);
      return null;
    }
    const shape = result.Get();
    Jolt.destroy(settings);

    // BvhMesh is always static
    const origMass = pOptions.mass;
    pOptions.mass = 0;
    const body = this._createBody(pOptions, shape);
    pOptions.mass = origMass;
    return body;
  }

  // COMMANDS

  applyImpulse(idx, x, y, z) {
    const body = this.rigidBodies[idx];
    if(!body) return;
    const v = new this.Jolt.Vec3(x, y, z);
    this.bodyInterface.ActivateBody(body.GetID());
    this.bodyInterface.AddImpulse(body.GetID(), v);
    this.Jolt.destroy(v);
  }

  setLinearVelocity(idx, x, y, z) {
    const body = this.rigidBodies[idx];
    if(!body) return;
    this.bodyInterface.SetLinearVelocity(body.GetID(), new this.Jolt.Vec3(x, y, z));
  }

  setKinematicTransform(idx, x, y, z) {
    const body = this.rigidBodies[idx];
    if(!body || !body.isKinematic) return;
    const Jolt = this.Jolt;
    this.bodyInterface.MoveKinematic(
      body.GetID(),
      new Jolt.RVec3(x, y, z),
      Jolt.Quat.prototype.sIdentity(),
      1 / 60
    );
  }

  setGravity(x, y, z) {
    const v = new this.Jolt.Vec3(x, y, z);
    this.physicsSystem.SetGravity(v);
    this.Jolt.destroy(v);
  }

  setBodyTransform(idx, x, y, z) {
    const body = this.rigidBodies[idx];
    if(!body) return;
    const Jolt = this.Jolt;
    const pos = new Jolt.RVec3(x, y, z);
    this.bodyInterface.SetPosition(body.GetID(), pos, Jolt.EActivation_Activate);
    this.bodyInterface.SetLinearVelocity(body.GetID(), new Jolt.Vec3(0, 0, 0));
    this.bodyInterface.SetAngularVelocity(body.GetID(), new Jolt.Vec3(0, 0, 0));
    Jolt.destroy(pos);
  }

  setGravityScale(idx, scale) {
    const body = this.rigidBodies[idx];
    if(!body) return;
    // Jolt doesn't have per-body gravity scale directly; apply via override
    // Approximate: set gravity factor via body motion properties
    body.GetMotionProperties?.()?.SetGravityFactor?.(scale);
  }

  clearBody(idx) {
    const body = this.rigidBodies[idx];
    if(!body) return;
    const Jolt = this.Jolt;
    const zero = new Jolt.Vec3(0, 0, 0);
    this.bodyInterface.SetLinearVelocity(body.GetID(), zero);
    this.bodyInterface.SetAngularVelocity(body.GetID(), zero);
    Jolt.destroy(zero);
  }

  // lx/ly/lz = linear factor mask, ax/ay/az = angular factor mask
  // Jolt doesn't have per-axis factor setters like Ammo, so we approximate:
  // lock axes by setting the corresponding velocity components to zero after each step
  // is not feasible here — instead store the factors and apply in step, or just set velocity directly.
  // For the common use case (projectile: full linear, no angular), we just set the velocities.
  shootBody(idx, lx, ly, lz, ax, ay, az) {
    const body = this.rigidBodies[idx];
    if(!body) return;
    const Jolt = this.Jolt;
    const id = body.GetID();
    // Apply linear factor by zeroing out axes where lx/ly/lz == 0
    const vel = this.bodyInterface.GetLinearVelocity(id);
    this.bodyInterface.SetLinearVelocity(id, new Jolt.Vec3(
      vel.GetX() * lx, vel.GetY() * ly, vel.GetZ() * lz
    ));
    const ang = this.bodyInterface.GetAngularVelocity(id);
    this.bodyInterface.SetAngularVelocity(id, new Jolt.Vec3(
      ang.GetX() * ax, ang.GetY() * ay, ang.GetZ() * az
    ));
  }

  addHingeConstraint(idxA, idxB, pOptions, msgID) {
    const Jolt = this.Jolt;
    const bodyA = this.rigidBodies[idxA];
    const bodyB = this.rigidBodies[idxB];
    if(!bodyA || !bodyB) {
      console.warn('addHingeConstraint: bodies not found');
      self.postMessage({cmd: 'constraintAdded', id: msgID, idx: -1});
      return;
    }
    const pivotA = pOptions.pivotA || [0, 0, 0];
    const pivotB = pOptions.pivotB || [0, 0, 0];
    const axis = pOptions.axis || [0, 1, 0];

    const settings = new Jolt.HingeConstraintSettings();
    settings.mPoint1 = new Jolt.RVec3(pivotA[0], pivotA[1], pivotA[2]);
    settings.mPoint2 = new Jolt.RVec3(pivotB[0], pivotB[1], pivotB[2]);
    settings.mHingeAxis1 = new Jolt.Vec3(axis[0], axis[1], axis[2]);
    settings.mHingeAxis2 = new Jolt.Vec3(axis[0], axis[1], axis[2]);

    if(pOptions.limits) {
      settings.mLimitsMin = pOptions.limits[0];
      settings.mLimitsMax = pOptions.limits[1];
    }

    const constraint = this.physicsSystem.AddConstraint(settings.Create(bodyA, bodyB));
    Jolt.destroy(settings);

    constraint.name = pOptions.name;
    this.constraints.push(constraint);
    const constraintIdx = this.constraints.length - 1;
    self.postMessage({cmd: 'constraintAdded', id: msgID, idx: constraintIdx});
  }

  enableAngularMotor(constraintIdx, enable, targetVelocity, maxMotorImpulse) {
    const c = this.constraints[constraintIdx];
    if(!c) return;
    if(enable) {
      c.SetMotorState(this.Jolt.EMotorState_Velocity);
      c.SetTargetAngularVelocity(targetVelocity);
    } else {
      c.SetMotorState(this.Jolt.EMotorState_Off);
    }
  }

  // STEP + SNAPSHOT WRITE
  step() {
    if(!this.joltInterface) return;
    const Jolt = this.Jolt;
    const bi = this.bodyInterface;
    for(let i = 0;i < this.speedUpSimulation;i++) {
      this.joltInterface.Step(1 / 60, 1);
    }
    const snap = this._snapshot;
    if(!snap) return;
    this.rigidBodies.forEach((body, i) => {
      const base = i * FLOATS_PER_BODY;
      const id = body.GetID();

      if(body.isKinematic) {
        // Mirror Ammo: kinematic bodies write their current transform so
        // the main thread snapshot stays consistent
        const pos = bi.GetPosition(id);
        snap[base + 0] = pos.GetX();
        snap[base + 1] = pos.GetY();
        snap[base + 2] = pos.GetZ();
        const rot = bi.GetRotation(id);
        const qx = rot.GetX(), qy = rot.GetY(), qz = rot.GetZ(), qw = rot.GetW();
        const sinHalf = Math.sqrt(qx * qx + qy * qy + qz * qz);
        const angle = 2 * Math.atan2(sinHalf, qw);
        if(sinHalf > 0.0001) {
          const s = 1 / sinHalf;
          snap[base + 3] = qx * s;
          snap[base + 4] = qy * s;
          snap[base + 5] = qz * s;
        } else {
          snap[base + 3] = 0; snap[base + 4] = 1; snap[base + 5] = 0;
        }
        snap[base + 6] = angle;
        snap[base + 7] = 0;
        return;
      }

      const pos = bi.GetPosition(id);
      const px = pos.GetX();
      if(isNaN(px)) return;
      snap[base + 0] = px;
      snap[base + 1] = pos.GetY();
      snap[base + 2] = pos.GetZ();
      const rot = bi.GetRotation(id);
      const qx = rot.GetX(), qy = rot.GetY(), qz = rot.GetZ(), qw = rot.GetW();
      const sinHalf = Math.sqrt(qx * qx + qy * qy + qz * qz);
      const angle = 2 * Math.atan2(sinHalf, qw);
      if(sinHalf > 0.0001) {
        const s = 1 / sinHalf;
        snap[base + 3] = qx * s;
        snap[base + 4] = qy * s;
        snap[base + 5] = qz * s;
      } else {
        snap[base + 3] = 0; snap[base + 4] = 1; snap[base + 5] = 0;
      }
      snap[base + 6] = angle;
      snap[base + 7] = 0;
    });
  }
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

// ─── Worker message handler ───────────────────────────────────────────────────

const jolt = new MatrixJolt();

self.onmessage = async ({data}) => {
  const {cmd, id} = data;
  switch(cmd) {
    case 'init': {
      await jolt.init(data.options);
      self.postMessage({cmd: 'ready', id});
      break;
    }
    case 'getBodyIndexByName': {
      const body = jolt.rigidBodies.find(b => b.name === data.name);
      const idx = body ? jolt.rigidBodies.indexOf(body) : -1;
      self.postMessage({cmd: 'bodyIndex', id: data.id, idx});
      break;
    }
    case 'addBody': {
      const idx = jolt.addBody(data.pOptions);
      self.postMessage({cmd: 'bodyAdded', id, idx, sab: jolt._sab});
      break;
    }
    case 'step': {
      jolt.step();
      if(!jolt._useSAB && jolt._snapshot) {
        const copy = jolt._snapshot.slice();
        self.postMessage({cmd: 'snapshot', snap: copy}, [copy.buffer]);
      }
      break;
    }
    case 'applyImpulse':
      jolt.applyImpulse(data.idx, data.x, data.y, data.z); break;
    case 'setLinearVelocity':
      jolt.setLinearVelocity(data.idx, data.x, data.y, data.z); break;
    case 'setKinematicTransform':
      jolt.setKinematicTransform(data.idx, data.x, data.y, data.z); break;
    case 'setGravity':
      jolt.setGravity(data.x, data.y, data.z); break;
    case 'setBodyTransform':
      jolt.setBodyTransform(data.idx, data.x, data.y, data.z); break;
    case 'setGravityScale':
      jolt.setGravityScale(data.idx, data.scale); break;
    case 'shootBody':
      jolt.shootBody(data.idx, data.lx, data.ly, data.lz, data.ax, data.ay, data.az); break;
    case 'clearBody':
      jolt.clearBody(data.idx); break;
    case 'addHingeConstraint':
      jolt.addHingeConstraint(data.idxA, data.idxB, data.options, data.id); break;
    case 'enableAngularMotor':
      jolt.enableAngularMotor(data.constraintIdx, data.enable, data.targetVelocity, data.maxMotorImpulse); break;
  }
};