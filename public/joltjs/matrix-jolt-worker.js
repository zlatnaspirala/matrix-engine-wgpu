// import { degToRad, radToDeg, quaternion_rotation_matrix } from '../../src/engine/utils';

function quaternion_rotation_matrix(Q) {

  // Covert a quaternion into a full three-dimensional rotation matrix.

  // Input
  // :param Q: A 4 element array representing the quaternion (q0,q1,q2,q3) 

  // Output
  // :return: A 3x3 element matrix representing the full 3D rotation matrix. 
  //          This rotation matrix converts a point in the local reference 
  //          frame to a point in the global reference frame.
  // """
  // # Extract the values from Q
  var q0 = Q[0]
  var q1 = Q[1]
  var q2 = Q[2]
  var q3 = Q[3]

  // # First row of the rotation matrix
  var r00 = 2 * (q0 * q0 + q1 * q1) - 1
  var r01 = 2 * (q1 * q2 - q0 * q3)
  var r02 = 2 * (q1 * q3 + q0 * q2)

  // # Second row of the rotation matrix
  var r10 = 2 * (q1 * q2 + q0 * q3)
  var r11 = 2 * (q0 * q0 + q2 * q2) - 1
  var r12 = 2 * (q2 * q3 - q0 * q1)

  // # Third row of the rotation matrix
  var r20 = 2 * (q1 * q3 - q0 * q2)
  var r21 = 2 * (q2 * q3 + q0 * q1)
  var r22 = 2 * (q0 * q0 + q3 * q3) - 1

  // # 3x3 rotation matrix
  var rot_matrix = [[r00, r01, r02],
  [r10, r11, r12],
  [r20, r21, r22]]

  return rot_matrix;
}

const LAYER_NON_MOVING = 0;
const LAYER_MOVING = 1;
const NUM_BROAD_PHASE_LAYERS = 2;
const FLOATS_PER_BODY = 8; // px py pz ax ay az angle pad

class MatrixJolt {
  constructor() {
    this.rigidBodies = [];
    this.Jolt = null;
    this.joltInterface = null;
    this.physicsSystem = null;
    this.bodyInterface = null;
    this.speedUpSimulation = 1;
    this.options = {roundDimension: 100, gravity: 10};
    // SAB snapshot buffer — grown as bodies are added
    this._sab = null;
    this._snapshot = null;
  }

  _allocSAB(bodyCount) {
    const FLOATS = bodyCount * FLOATS_PER_BODY;
    const bytes = 4 + FLOATS * 4;

    if(typeof SharedArrayBuffer !== 'undefined') {
      this._sab = new SharedArrayBuffer(bytes);
      this._snapshot = new Float32Array(this._sab, 4);
      this._useSAB = true;
    } else {
      this._sab = null;
      this._snapshot = new Float32Array(FLOATS);
      this._useSAB = false;
      console.log('  this._useSAB = false; ')
    }

    if(this._useSAB) {
      new Uint32Array(this._sab, 0, 1)[0] = bodyCount;
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

  // ── BODY CREATION ───────────────────────────────────────────────
  addBody(pOptions) {
    console.log('addBody(pOptions) !!!!!')
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

    // Grow SAB to fit
    this._allocSAB(this.rigidBodies.length);

    return this.rigidBodies.length - 1;
  }

  _addSphere(pOptions) {
    const Jolt = this.Jolt;
    const radius = Array.isArray(pOptions.radius) ? pOptions.radius[0] : (pOptions.radius || 1);
    return this._createBody(pOptions, new Jolt.SphereShape(radius));
  }

  _addBox(pOptions) {
    const Jolt = this.Jolt;
    const [sx, sy, sz] = pOptions.scale;
    return this._createBody(pOptions, new Jolt.BoxShape(new Jolt.Vec3(sx, sy, sz)));
  }

  _addCapsule(pOptions) {
    const Jolt = this.Jolt;
    return this._createBody(pOptions,
      new Jolt.CapsuleShape((pOptions.height || 2) * 0.5, pOptions.radius || 1));
  }

  _addCylinder(pOptions) {
    const Jolt = this.Jolt;
    return this._createBody(pOptions,
      new Jolt.CylinderShape(pOptions.height / 4, pOptions.radius));
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
    console.log('pOptions.scale >>>>>>>>>>>>>>>>>>>>', pOptions.scale)
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

  _createBody(pOptions, shape) {
    const Jolt = this.Jolt;
    const pos = pOptions.position || {x: 0, y: 0, z: 0};
    const isKinematic = pOptions.mass === 0 && pOptions.state === undefined;

    const settings = new Jolt.BodyCreationSettings(
      shape,
      new Jolt.RVec3(pos.x, pos.y, pos.z),
      Jolt.Quat.prototype.sIdentity(),
      isKinematic ? Jolt.EMotionType_Kinematic : Jolt.EMotionType_Dynamic,
      isKinematic ? LAYER_NON_MOVING : LAYER_MOVING
    );
    settings.mOverrideMassProperties = Jolt.EOverrideMassProperties_CalculateInertia;
    settings.mMassPropertiesOverride.mMass = pOptions.mass || 1;
    if(pOptions.restitution !== undefined) settings.mRestitution = pOptions.restitution;
    if(pOptions.friction !== undefined) settings.mFriction = pOptions.friction;

    const body = this.bodyInterface.CreateBody(settings);
    Jolt.destroy(settings);

    body.name = pOptions.name;
    body.isKinematic = isKinematic;

    this.bodyInterface.AddBody(body.GetID(), Jolt.EActivation_Activate);
    this.rigidBodies.push(body);
    return body;
  }

  // ── COMMANDS (called from message handler) ───────────────────────
  applyImpulse(idx, x, y, z) {
    console.log('WORKER', idx)
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

  // ── STEP + SNAPSHOT WRITE ────────────────────────────────────────
  step() {
    if(!this.joltInterface) return;
    const Jolt = this.Jolt;
    const bi = this.bodyInterface;

    for(let i = 0;i < this.speedUpSimulation;i++) {
      this.joltInterface.Step(1 / 60, 1);
    }
    // Write dynamic body state into SAB
    const snap = this._snapshot;
    if(!snap) return;
    this.rigidBodies.forEach((body, i) => {
      const base = i * FLOATS_PER_BODY;
      if(body.isKinematic) {
        // kinematic: no change needed, main thread controls these
        return;
      }
      const id = body.GetID();
      const pos = bi.GetPosition(id);

      // console.log('[worker] body', i, 'pos:', pos.GetX(), pos.GetY(), pos.GetZ());

      const rot = bi.GetRotation(id);

      snap[base + 0] = pos.GetX();
      snap[base + 1] = pos.GetY();
      snap[base + 2] = pos.GetZ();

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
      snap[base + 7] = 0; // pad
    });
  }
}

function buildConeVerts(radius, height, segments = 16) {
  const verts = [];
  const half = height / 2;
  // base at -half, apex at +half
  // COM will be at -half + height/4 = -height/4 from origin
  // close enough for most cases, or compensate in addPhysicsCone
  for(let i = 0;i < segments;i++) {
    const a = (i / segments) * Math.PI * 2;
    verts.push(
      Math.cos(a) * radius,
      -half, // base at -height/2
      Math.sin(a) * radius
    );
  }
  verts.push(0, half, 0); // apex at +height/2
  return verts;
}

const jolt = new MatrixJolt();

self.onmessage = async ({data}) => {
  // console.log('[worker] raw message:', data);
  const {cmd, id} = data;

  switch(cmd) {
    case 'init': {
      await jolt.init(data.options);
      self.postMessage({cmd: 'ready', id: id});
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
      // Transfer the SAB reference back so main thread can read it
      console.log(' Transfer the SAB reference back so main thread can read it', jolt._sab)
      self.postMessage({cmd: 'bodyAdded', id, idx, sab: jolt._sab});
      break;
    }
    case 'step': {
      jolt.step();
      if(!jolt._useSAB && jolt._snapshot) {
        // console.log('________________ jolt._snapshot ', jolt._snapshot)
        const copy = jolt._snapshot.slice();
        self.postMessage({cmd: 'snapshot', snap: copy}, [copy.buffer]);
      }
      break;
    }
    case 'applyImpulse':
      console.log('TEST jolt.applyImpulse ')
      jolt.applyImpulse(data.idx, data.x, data.y, data.z); break;
    case 'setLinearVelocity':
      jolt.setLinearVelocity(data.idx, data.x, data.y, data.z); break;
    case 'setKinematicTransform':
      jolt.setKinematicTransform(data.idx, data.x, data.y, data.z); break;
    case 'setGravity':
      jolt.setGravity(data.x, data.y, data.z); break;
  }
};