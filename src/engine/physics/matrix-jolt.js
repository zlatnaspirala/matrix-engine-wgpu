import {MEConfig} from "../../me-config";
import {buildConeVerts} from "../matrix-class";
import {LOG_FUNNY_ARCADE, degToRad, quaternion_rotation_matrix, radToDeg, scriptManager} from "../utils";

const LAYER_NON_MOVING = 0;
const LAYER_MOVING = 1;
const NUM_BROAD_PHASE_LAYERS = 2;

export class MatrixJolt {
  constructor(options = {roundDimension: 100, gravity: 10}) {
    this.options = options;
    this.rigidBodies = [];
    this.bodyIds = [];
    this.Jolt = null;
    this.joltInterface = null;
    this.physicsSystem = null;
    this.bodyInterface = null;
    this.ground = null;
    this.speedUpSimulation = 1;
    this._initJolt();
  }

  _initJolt() {
    import('https://www.unpkg.com/jolt-physics/dist/jolt-physics.wasm-compat.js').then(module => {
      module.default().then(Jolt => {
        this.Jolt = Jolt;
        this.initPhysics(MEConfig.PHYSICS_GROUND_Y);
        console.log("%c Jolt core loaded.", LOG_FUNNY_ARCADE);
        setTimeout(() => {
          dispatchEvent(new CustomEvent('PhysicsReady', {}));
        }, 250);
      });
    });
  }

  setGravity(x, y, z) {
    const Jolt = this.Jolt;
    const gravityVect = new Jolt.Vec3(x, y, z);
    this.physicsSystem.SetGravity(gravityVect);
    Jolt.destroy(gravityVect);
  }

  initPhysics(GROUND_Y) {
    const Jolt = this.Jolt;

    // Layer setup — mirrors the standard Jolt hello world pattern
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

    // Ground plane
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
    groundBody.name = 'ground';
    this.ground = groundBody;
    this.bodyInterface.AddBody(groundBody.GetID(), Jolt.EActivation_DontActivate);
  }

  addPhysics(MEObject, pOptions) {
    switch(pOptions.geometry) {
      case "Sphere":
        return this.addPhysicsSphere(MEObject, pOptions);
      case "Cube":
        return this.addPhysicsBox(MEObject, pOptions);
      case "Capsule":
        return this.addPhysicsCapsule(MEObject, pOptions);
      case "Cylinder":
        return this.addPhysicsCylinder(MEObject, pOptions);
      case "Cone":
      case "ConeX":
      case "ConeZ":
        return this.addPhysicsCone(MEObject, pOptions);
      case "ConvexHull":
        return this.addPhysicsConvexHull(MEObject, pOptions);
      case "StaticPlane":
        // In Jolt, you usually use a very large Box or a Mesh for the floor
        return this.addPhysicsStaticPlane(MEObject, pOptions);
      case "BvhMesh":
        return this.addPhysicsBvhMesh(MEObject, pOptions);
      // Jolt handles axis orientation (X/Z) differently than Ammo.
      case "CapsuleX":
      case "CapsuleZ":
        return this.addPhysicsCapsule(MEObject, pOptions);
      case "CylinderX":
      case "CylinderZ":
        return this.addPhysicsCylinder(MEObject, pOptions);
      default:
        console.warn("Jolt addPhysics: unknown geometry type:", pOptions.geometry);
        return null;
    }
  }

  addPhysicsSphere(MEObject, pOptions) {
    const Jolt = this.Jolt;
    const radius = Array.isArray(pOptions.radius) ? pOptions.radius[0] : pOptions.radius;
    const shape = new Jolt.SphereShape(radius);
    const isKinematic = pOptions.mass === 0 && typeof pOptions.state === 'undefined';

    const bodySettings = new Jolt.BodyCreationSettings(
      shape,
      new Jolt.RVec3(pOptions.position.x, pOptions.position.y, pOptions.position.z),
      Jolt.Quat.prototype.sIdentity(),
      isKinematic ? Jolt.EMotionType_Kinematic : Jolt.EMotionType_Dynamic,
      LAYER_MOVING
    );
    bodySettings.mRestitution = 0.3;

    bodySettings.mOverrideMassProperties = Jolt.EOverrideMassProperties_CalculateInertia;
    bodySettings.mMassPropertiesOverride.mMass = pOptions.mass || 1;

    const body = this.bodyInterface.CreateBody(bodySettings);
    Jolt.destroy(bodySettings);

    body.name = pOptions.name;
    body.MEObject = MEObject;
    body.isKinematic = isKinematic;
    MEObject.itIsPhysicsBody = true;

    this.bodyInterface.AddBody(body.GetID(), Jolt.EActivation_Activate);
    this.rigidBodies.push(body);
    return body;
  }

  addPhysicsBox(MEObject, pOptions) {
    const Jolt = this.Jolt;
    const isKinematic = pOptions.mass === 0 && typeof pOptions.state === 'undefined';

    const shape = new Jolt.BoxShape(
      new Jolt.Vec3(pOptions.scale[0], pOptions.scale[1], pOptions.scale[2])
    );

    // FIX 1: Capture the return value of sEulerAngles! 
    // The quat created by 'new Jolt.Quat()' is (0,0,0,0), which is INVALID.
    const rx = degToRad(pOptions.rotation?.x || 0);
    const ry = degToRad(pOptions.rotation?.y || 0);
    const rz = degToRad(pOptions.rotation?.z || 0);
    const v3 = new Jolt.Vec3(rx, ry, rz);
    const quat = Jolt.Quat.prototype.sEulerAngles(v3);
    Jolt.destroy(v3); // Clean up temp vector

    const bodySettings = new Jolt.BodyCreationSettings(
      shape,
      new Jolt.RVec3(pOptions.position.x, pOptions.position.y, pOptions.position.z),
      quat, // Now this is a valid normalized rotation
      isKinematic ? Jolt.EMotionType_Kinematic : Jolt.EMotionType_Dynamic,
      LAYER_MOVING
    );

    // FIX 2: Correctly set the mass. Jolt ignores 'bodySettings.mMass'.
    bodySettings.mOverrideMassProperties = Jolt.EOverrideMassProperties_CalculateInertia;
    bodySettings.mMassPropertiesOverride.mMass = pOptions.mass || 1;

    const body = this.bodyInterface.CreateBody(bodySettings);
    Jolt.destroy(bodySettings);

    body.name = pOptions.name;
    body.MEObject = MEObject;
    body.isKinematic = isKinematic;
    MEObject.itIsPhysicsBody = true;

    this.bodyInterface.AddBody(body.GetID(), Jolt.EActivation_Activate);
    this.rigidBodies.push(body);
    return body;
  }

  setBodyVelocity = (body, x, y, z) => {
    this.bodyInterface.SetLinearVelocity(body.GetID(), new this.Jolt.Vec3(x, y, z));
  }

  setKinematicTransform = (body, x, y, z, rx = 0, ry = 0, rz = 0) => {
    const Jolt = this.Jolt;
    const pos = this.bodyInterface.GetPosition(body.GetID());
    const newPos = new Jolt.RVec3(pos.GetX() + x, pos.GetY() + y, pos.GetZ() + z);
    const quat = Jolt.Quat.prototype.sEulerAngles(new Jolt.Vec3(rx, ry, rz));
    this.bodyInterface.MoveKinematic(body.GetID(), newPos, quat, 1 / 60);
  }

  getBodyByName = (name) => {
    return this.rigidBodies.find(b => b.MEObject.name === name) || null;
  }

  setBodyTransform(body, pVect) {
    const Jolt = this.Jolt;
    const id = body.GetID();
    const pos = new Jolt.RVec3(pVect.x, pVect.y, pVect.z);
    const quat = Jolt.Quat.prototype.sIdentity();
    this.bodyInterface.SetPositionAndRotation(id, pos, quat, Jolt.EActivation_DontActivate);
    Jolt.destroy(pos);
  }

  deactivatePhysics = (body) => {
    const Jolt = this.Jolt;
    this.bodyInterface.RemoveBody(body.GetID());
    this.bodyInterface.AddBody(body.GetID(), Jolt.EActivation_DontActivate);
    this.bodyInterface.SetLinearVelocity(body.GetID(), new Jolt.Vec3(0, 0, 0));
    this.bodyInterface.SetAngularVelocity(body.GetID(), new Jolt.Vec3(0, 0, 0));
    body.isKinematic = true;
  }

  shootBody = (body, lx, ly, lz, ax, ay, az) => {
    const Jolt = this.Jolt;
    const id = body.GetID();
    this.bodyInterface.SetLinearVelocity(id, new Jolt.Vec3(lx, ly, lz));
    this.bodyInterface.SetAngularVelocity(id, new Jolt.Vec3(ax, ay, az));
    this.bodyInterface.ActivateBody(id);
  }

  // Inside MatrixJolt class
  applyImpulse(body, pVect) {
    const id = body.GetID();
    const jVect = new this.Jolt.Vec3(pVect.x, pVect.y, pVect.z);
    this.bodyInterface.ActivateBody(id);
    this.bodyInterface.AddImpulse(id, jVect);
    this.Jolt.destroy(jVect);
  }

  applyTorque(body, pVect) {
    const v = new this.Jolt.Vec3(pVect.x, pVect.y, pVect.z);
    this.bodyInterface.ActivateBody(body.GetID());
    this.bodyInterface.AddAngularImpulse(body.GetID(), v);
  }

  setAngularVelocity(body, pVect) {
    const v = new this.Jolt.Vec3(pVect.x, pVect.y, pVect.z);
    this.bodyInterface.SetAngularVelocity(body.GetID(), v);
  }

  setMaterial(body, friction, restitution) {
    // Jolt usually sets these via Shape or BodySettings, but we can override:
    body.SetFriction(friction);
    body.SetRestitution(restitution);
  }

  activate(body) {
    this.bodyInterface.ActivateBody(body.GetID());
  }

  explode(positionVect, radius, strength) {
    this.rigidBodies.forEach(body => {
      if(body.isKinematic) return;

      const id = body.GetID();
      const p = this.bodyInterface.GetPosition(id);

      const dx = p.GetX() - positionVect.x;
      const dy = p.GetY() - positionVect.y;
      const dz = p.GetZ() - positionVect.z;

      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if(dist > radius || dist === 0) return;

      // Standard falloff formula
      const force = strength / (dist + 0.1);

      this.applyImpulse(body, new PVector(
        dx * force,
        dy * force,
        dz * force
      ));
    });
  }

  // ─── CAPSULE ──────────────────────────────────────────────────
  addPhysicsCapsule(MEObject, pOptions) {
    const Jolt = this.Jolt;
    const radius = pOptions.radius || 1;
    const halfHeight = (pOptions.height || 1) * 0.5;

    // Jolt capsules are defined by half-height
    const shape = new Jolt.CapsuleShape(halfHeight, radius);
    return this._createJoltBody(MEObject, pOptions, shape);
  }

  // ─── SPHERE ───────────────────────────────────────────────────
  addPhysicsSphere(MEObject, pOptions) {
    const Jolt = this.Jolt;
    const radius = Array.isArray(pOptions.radius) ? pOptions.radius[0] : (pOptions.radius || 1);
    const shape = new Jolt.SphereShape(radius);

    return this._createJoltBody(MEObject, pOptions, shape);
  }

  // ─── CYLINDER ─────────────────────────────────────────────────
  addPhysicsCylinder(MEObject, pOptions) {
    const Jolt = this.Jolt;
    const halfHeight = pOptions.height;
    const radius = pOptions.radius;
    const shape = new Jolt.CylinderShape(halfHeight, radius);
    console.log('cylinder COM:', shape.GetCenterOfMass().GetY());
    let B = this._createJoltBody(MEObject, pOptions, shape);
    console.log('cylinder layer:', pOptions.mass === 0 ? 'STATIC' : 'DYNAMIC');
    console.log('cylinder bodyID:', B?.GetID?.());
    console.log('cylinder valid:', shape.GetType());
    console.log('cylinder bounds:', shape.GetLocalBounds().mMin.GetY(), shape.GetLocalBounds().mMax.GetY());
    return B;
  }

  // ─── CONE ─────────────────────────────────────────────────────
  addPhysicsCone(MEObject, pOptions) {
    const Jolt = this.Jolt;
    const verts = buildConeVerts(pOptions.radius, pOptions.height);
    const settings = new Jolt.ConvexHullShapeSettings();
    const points = settings.mPoints;
    for(let i = 0;i < verts.length / 3;i++) {
      const v = new Jolt.Vec3(
        verts[i * 3],
        verts[i * 3 + 1],
        verts[i * 3 + 2]
      );
      points.push_back(v);
      Jolt.destroy(v);
    }
    const shapeResult = settings.Create();
    if(shapeResult.HasError()) {
      console.error(shapeResult.GetError().c_str());
      Jolt.destroy(settings);
      return null;
    }
    const shape = shapeResult.Get();
    const com = shape.GetCenterOfMass();
    pOptions.position.y += com.GetY();
    return this._createJoltBody(MEObject, pOptions, shape);
  }


  // ─── CONVEX HULL ──────────────────────────────────────────────
  addPhysicsConvexHull(MEObject, pOptions) {
    const Jolt = this.Jolt;
    const verts = new Float32Array(pOptions.vertices);
    const numPoints = verts.length / 3;
    const settings = new Jolt.ConvexHullShapeSettings();
    settings.mHullTolerance = 1e-6;
    const points = settings.mPoints;
    const sx = pOptions.scale?.[0] ?? 1;
    const sy = pOptions.scale?.[1] ?? 1;
    const sz = pOptions.scale?.[2] ?? 1;

    for(let i = 0;i < numPoints;i++) {
      const x = verts[i * 3] * sx;
      const y = verts[i * 3 + 1] * sy;
      const z = verts[i * 3 + 2] * sz;
      // Skip invalid values (VERY important)
      if(!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) continue;
      const v = new Jolt.Vec3(x, y, z);
      points.push_back(v);
      Jolt.destroy(v);
    }
    // console.log("Jolt hull input points:", points.size());
    if(points.size() < 4) {
      console.error("ConvexHull: not enough valid points");
      Jolt.destroy(settings);
      return null;
    }
    const shapeResult = settings.Create();
    if(shapeResult.HasError()) {
      console.error("Hull Error:", shapeResult.GetError().c_str());
      Jolt.destroy(settings);
      Jolt.destroy(shapeResult);
      return null;
    }

    const shape = shapeResult.Get();
    const com = shape.GetCenterOfMass();
    console.log('Hull center of mass offset:', com.GetX(), com.GetY(), com.GetZ());
    pOptions.position.x = pOptions.position.x - com.GetX()
    pOptions.position.y = pOptions.position.y - com.GetY()
    pOptions.position.z = pOptions.position.z - com.GetZ()
    const body = this._createJoltBody(MEObject, pOptions, shape);
    console.log('Hull body created:', body, body?.GetID?.());
    Jolt.destroy(settings);
    Jolt.destroy(shapeResult);
    return body;
  }

  // ─── HINGE CONSTRAINT ─────────────────────────────────────────
  addHingeConstraint(MEObjectA, MEObjectB, pOptions) {
    const Jolt = this.Jolt;
    const bodyA = this.getBodyByMEObject(MEObjectA);
    const bodyB = this.getBodyByMEObject(MEObjectB);
    if(!bodyA || !bodyB) return null;
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
    const constraint = settings.Create(bodyA, bodyB);
    this.physicsSystem.AddConstraint(constraint);
    if(!this.constraints) this.constraints = [];
    this.constraints.push(constraint);
    return constraint;
  }

  _createJoltBody(MEObject, pOptions, shape) {
    const Jolt = this.Jolt;
    const pos = pOptions.position || {x: 0, y: 0, z: 0};
    const isKinematic = pOptions.mass === 0 && typeof pOptions.state === 'undefined';

    const settings = new Jolt.BodyCreationSettings(
      shape,
      new Jolt.RVec3(pos.x, pos.y, pos.z),
      Jolt.Quat.prototype.sIdentity(),
      isKinematic ? Jolt.EMotionType_Kinematic : Jolt.EMotionType_Dynamic,
      isKinematic ? LAYER_NON_MOVING : LAYER_MOVING
    );

    // ← this is what sphere has that _createJoltBody was missing
    settings.mOverrideMassProperties = Jolt.EOverrideMassProperties_CalculateInertia;
    settings.mMassPropertiesOverride.mMass = pOptions.mass || 1;

    if(pOptions.restitution !== undefined) settings.mRestitution = pOptions.restitution;
    if(pOptions.friction !== undefined) settings.mFriction = pOptions.friction;

    const body = this.bodyInterface.CreateBody(settings);
    Jolt.destroy(settings);

    body.name = pOptions.name;
    body.MEObject = MEObject;
    body.isKinematic = isKinematic;
    MEObject.itIsPhysicsBody = true;

    this.bodyInterface.AddBody(body.GetID(), Jolt.EActivation_Activate);
    this.rigidBodies.push(body);
    return body;
  }

  getBodyByMEObject(meObj) {
    return this.rigidBodies.find(b => b.MEObject === meObj);
  }

  updatePhysics() {
    if(!this.joltInterface) return;
    const Jolt = this.Jolt;
    const bi = this.bodyInterface;
    // Push kinematic bodies from MEObject → physics
    this.rigidBodies.forEach(body => {
      if(body.isKinematic) {
        const {x, y, z} = body.MEObject.position;
        const axis = body.MEObject.rotation.axis;
        const angle = degToRad(body.MEObject.rotation.angle);
        const quat = Jolt.Quat.prototype.sRotation(
          new Jolt.Vec3(axis.x, axis.y, axis.z), angle
        );
        bi.MoveKinematic(body.GetID(), new Jolt.RVec3(x, y, z), quat, 1 / 60);
      }
    });

    // Step
    for(let i = 0;i < this.speedUpSimulation;i++) {
      this.joltInterface.Step(1 / 60, 1);
    }

    // Read dynamic bodies back into MEObject
    this.rigidBodies.forEach(body => {
      if(!body.isKinematic) {
        const id = body.GetID();
        const pos = bi.GetPosition(id);
        const rot = bi.GetRotation(id);
        body.MEObject.position.setPosition(pos.GetX(), pos.GetY(), pos.GetZ());
        body.MEObject.position.inMove = true;
        // Quat → axis/angle + matrix, same as your Ammo pattern
        const qx = rot.GetX(), qy = rot.GetY(), qz = rot.GetZ(), qw = rot.GetW();
        const sinHalfAngle = Math.sqrt(qx * qx + qy * qy + qz * qz);
        const angle = 2 * Math.atan2(sinHalfAngle, qw);
        if(sinHalfAngle > 0.0001) {
          const s = 1 / sinHalfAngle;
          body.MEObject.rotation.axis.x = qx * s;
          body.MEObject.rotation.axis.y = qy * s;
          body.MEObject.rotation.axis.z = qz * s;
        } else {
          // Identity rotation — default axis so renderer doesn't choke
          body.MEObject.rotation.axis.x = 0;
          body.MEObject.rotation.axis.y = 1;
          body.MEObject.rotation.axis.z = 0;
        }
        body.MEObject.rotation.angle = radToDeg(angle);
        body.MEObject.rotation.matrixRotation = quaternion_rotation_matrix([qw, qx, qy, qz]);
      }
    });
  }
}