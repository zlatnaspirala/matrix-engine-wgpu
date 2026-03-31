import {LOG_FUNNY_ARCADE, degToRad, quaternion_rotation_matrix, radToDeg, scriptManager} from "../engine/utils";
import {MEConfig} from "../me-config";

export default class MatrixAmmo {
  constructor(options = {roundDimensionX: 10, roundDimensionY: 10, gravity: -10}) {
    this.options = options;
    if(!this.options.gravity) this.options.gravity = -10;
    // scriptManager.LOAD("https://maximumroulette.com/apps/megpu/ammo.js", "ammojs",
    scriptManager.LOAD("ammojs/ammo.js", "ammojs",
      undefined, undefined, this.init,
    );
    this.lastRoll = '';
    this.presentScore = '';
    this.speedUpSimulation = 1;

    this.collisionEvent = new CustomEvent('pCollision', {
      detail: {body0Name: null, body1Name: null, contactCount: 0}
    });
    this.lastCollisionState = new Map();
  }

  initPhysicsScratch() {
    this._trans = new Ammo.btTransform();
    this._transform = new Ammo.btTransform();
    this._origin = new Ammo.btVector3(0, 0, 0);
    this._quat = new Ammo.btQuaternion();
    this._axis = new Ammo.btVector3(0, 0, 0);

    this.maxSubSteps = 4;
  }

  init = () => {
    Ammo().then(Ammo => {
      this.initPhysicsScratch();
      this.dynamicsWorld = null;
      this.rigidBodies = [];
      this.Ammo = Ammo;
      this.lastUpdate = 0;
      console.log("%cAmmo core loaded.", LOG_FUNNY_ARCADE);
      this.initPhysics(MEConfig.PHYSICS_GROUND_Y);
      setTimeout(() => {dispatchEvent(new CustomEvent('AmmoReady', {}))}, 200);
    });
  };

  initPhysics(GROUND_Y = -4) {
    let Ammo = this.Ammo;
    // Physics configuration
    var collisionConfiguration = new Ammo.btDefaultCollisionConfiguration(),
      dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration),
      overlappingPairCache = new Ammo.btDbvtBroadphase(),
      solver = new Ammo.btSequentialImpulseConstraintSolver();
    this.dynamicsWorld = new Ammo.btDiscreteDynamicsWorld(dispatcher, overlappingPairCache, solver, collisionConfiguration);
    this.dynamicsWorld.setGravity(new Ammo.btVector3(0, this.options.gravity, 0));

    var groundShape = new Ammo.btBoxShape(new Ammo.btVector3(this.options.roundDimensionX, 1, this.options.roundDimensionY)),
      groundTransform = new Ammo.btTransform();
    groundTransform.setIdentity();
    groundTransform.setOrigin(new Ammo.btVector3(0, GROUND_Y, 0));
    var mass = 0,
      isDynamic = (mass !== 0),
      localInertia = new Ammo.btVector3(0, 0, 0);

    if(isDynamic) groundShape.calculateLocalInertia(mass, localInertia);
    var myMotionState = new Ammo.btDefaultMotionState(groundTransform),
      rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, myMotionState, groundShape, localInertia),
      body = new Ammo.btRigidBody(rbInfo);
    body.name = 'ground';
    this.ground = body;
    this.dynamicsWorld.addRigidBody(body);
  }

  addPhysics(MEObject, pOptions) {
    switch(pOptions.geometry) {
      case "Sphere": return this.addPhysicsSphere(MEObject, pOptions);
      case "Cube": return this.addPhysicsBox(MEObject, pOptions);
      case "Capsule": return this.addPhysicsCapsule(MEObject, pOptions);
      case "CapsuleX": return this.addPhysicsCapsuleX(MEObject, pOptions);
      case "CapsuleZ": return this.addPhysicsCapsuleZ(MEObject, pOptions);
      case "Cylinder": return this.addPhysicsCylinder(MEObject, pOptions);
      case "CylinderX": return this.addPhysicsCylinderX(MEObject, pOptions);
      case "CylinderZ": return this.addPhysicsCylinderZ(MEObject, pOptions);
      case "Cone": return this.addPhysicsCone(MEObject, pOptions);
      case "ConeX": return this.addPhysicsConeX(MEObject, pOptions);
      case "ConeZ": return this.addPhysicsConeZ(MEObject, pOptions);
      case "StaticPlane": return this.addPhysicsStaticPlane(MEObject, pOptions);
      case "ConvexHull": return this.addPhysicsConvexHull(MEObject, pOptions);
      case "BvhMesh": return this.addPhysicsBvhMesh(MEObject, pOptions);
      case "Compound": return this.addPhysicsCompound(MEObject, pOptions);
      case "Heightfield": return this.addPhysicsHeightfield(MEObject, pOptions);
      default:
        console.warn("addPhysics: unknown geometry type:", pOptions.geometry);
        return null;
    }
  }

  _applyBodyFlags(body, pOptions) {
    const CF_KINEMATIC = 2;
    const CF_NO_RESPONSE = 3;
    if(pOptions.mass === 0 && pOptions.state === undefined && pOptions.collide === undefined) {
      body.setCollisionFlags(CF_KINEMATIC);
      body.setActivationState(2);
    } else if(pOptions.collide === false) {
      body.setCollisionFlags(CF_NO_RESPONSE);
      body.setActivationState(4);
    } else {
      body.setActivationState(4);
    }
  }

  // ─── shared helper ────────────────────────────────────────────
  // Registers body in world + rigidBodies list.
  _registerBody(body, MEObject, pOptions) {
    body.name = pOptions.name;
    MEObject.itIsPhysicsBody = true;
    body.MEObject = MEObject;
    this.dynamicsWorld.addRigidBody(body);
    this.rigidBodies.push(body);
    return body;
  }

  addPhysicsCapsule(MEObject, pOptions) {
    const Ammo = this.Ammo;
    const colShape = new Ammo.btCapsuleShape(pOptions.radius ? pOptions.radius : 1, pOptions.height ? pOptions.height : 1);
    const startTransform = new Ammo.btTransform();
    startTransform.setIdentity();
    startTransform.setOrigin(new Ammo.btVector3(
      pOptions.position.x, pOptions.position.y, pOptions.position.z
    ));
    const mass = pOptions.mass;
    const localInertia = new Ammo.btVector3(0, 0, 0);
    colShape.calculateLocalInertia(mass, localInertia);
    const rbInfo = new Ammo.btRigidBodyConstructionInfo(
      mass, new Ammo.btDefaultMotionState(startTransform), colShape, localInertia
    );
    const body = new Ammo.btRigidBody(rbInfo);

    body.setDamping(pOptions.damping ? pOptions.damping : 0.8, pOptions.damping ? pOptions.damping : 1);
    body.setRestitution(pOptions.restitution ? pOptions.restitution : 0.1);
    body.setFriction(pOptions.fiction ? pOptions.fiction : 1.0);

    this._applyBodyFlags(body, pOptions);
    return this._registerBody(body, MEObject, pOptions);
  }

  addPhysicsSphere(MEObject, pOptions) {
    const FLAGS = {
      TEST_NIDZA: 3,
      CF_KINEMATIC_OBJECT: 2
    }

    let Ammo = this.Ammo;
    var colShape = new Ammo.btSphereShape(Array.isArray(pOptions.radius) ? pOptions.radius[0] : pOptions.radius),
      startTransform = new Ammo.btTransform();
    startTransform.setIdentity();
    var mass = 1;
    var localInertia = new Ammo.btVector3(0, 0, 0);
    colShape.calculateLocalInertia(mass, localInertia);
    startTransform.setOrigin(new Ammo.btVector3(pOptions.position.x, pOptions.position.y, pOptions.position.z));

    var myMotionState = new Ammo.btDefaultMotionState(startTransform),
      rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, myMotionState, colShape, localInertia),
      body = new Ammo.btRigidBody(rbInfo);

    if(pOptions.mass == 0 && typeof pOptions.state == 'undefined' && typeof pOptions.collide == 'undefined') {
      body.setActivationState(2)
      body.setCollisionFlags(FLAGS.CF_KINEMATIC_OBJECT);
      // console.log('what is pOptions.mass and state is 2 ....', pOptions.mass)
    } else if(typeof pOptions.collide != 'undefined' && pOptions.collide == false) {
      // idea not work for now - eliminate collide effect
      body.setActivationState(4)
      body.setCollisionFlags(FLAGS.TEST_NIDZA);
    } else {
      body.setActivationState(4)
    }

    body.name = pOptions.name;
    MEObject.itIsPhysicsBody = true;
    body.MEObject = MEObject;
    this.dynamicsWorld.addRigidBody(body);
    this.rigidBodies.push(body);
    return body;
  }

  addPhysicsBox(MEObject, pOptions) {
    const FLAGS = {
      TEST_NIDZA: 3,
      CF_KINEMATIC_OBJECT: 2
    }
    let Ammo = this.Ammo;
    // improve this - scale by comp
    var colShape = new Ammo.btBoxShape(new Ammo.btVector3(pOptions.scale[0], pOptions.scale[1], pOptions.scale[2])),
      startTransform = new Ammo.btTransform();
    startTransform.setIdentity();
    var mass = pOptions.mass;
    var localInertia = new Ammo.btVector3(0, 0, 0);
    colShape.calculateLocalInertia(mass, localInertia);
    startTransform.setOrigin(new Ammo.btVector3(pOptions.position.x, pOptions.position.y, pOptions.position.z));
    // console.log('pOptions.rotation : ', pOptions.rotation)
    var t = startTransform.getRotation()
    t.setX(degToRad(pOptions.rotation.x))
    t.setY(degToRad(pOptions.rotation.y))
    t.setZ(degToRad(pOptions.rotation.z))
    startTransform.setRotation(t)

    var myMotionState = new Ammo.btDefaultMotionState(startTransform),
      rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, myMotionState, colShape, localInertia),
      body = new Ammo.btRigidBody(rbInfo);

    if(pOptions.mass == 0 && typeof pOptions.state == 'undefined' && typeof pOptions.collide == 'undefined') {
      body.setActivationState(2)
      body.setCollisionFlags(FLAGS.CF_KINEMATIC_OBJECT);
      console.log('pOptions.mass is 0 and state is 2', pOptions.mass)
    } else if(typeof pOptions.collide != 'undefined' && pOptions.collide == false) {
      // idea not work for now - eliminate collide effect
      body.setActivationState(4)
      body.setCollisionFlags(FLAGS.TEST_NIDZA);
    } else {
      body.setActivationState(4)
    }
    body.name = pOptions.name;
    MEObject.itIsPhysicsBody = true;
    body.MEObject = MEObject;
    this.dynamicsWorld.addRigidBody(body);
    this.rigidBodies.push(body);
    return body;
  }

  addHingeConstraint(MEObjectA, MEObjectB, pOptions) {
    let Ammo = this.Ammo;
    if(!this.constraints) this.constraints = [];
    // FIND BODIES VIA MEObject
    let bodyA = null;
    let bodyB = null;

    for(let i = 0;i < this.rigidBodies.length;i++) {
      if(this.rigidBodies[i].MEObject === MEObjectA) {
        bodyA = this.rigidBodies[i];
      }
      if(this.rigidBodies[i].MEObject === MEObjectB) {
        bodyB = this.rigidBodies[i];
      }
    }

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
    // ADD TO WORLD
    this.dynamicsWorld.addConstraint(hinge, true);
    // STORE ONLY (NO FAKE LINKS)
    hinge.name = pOptions.name;
    this.constraints.push(hinge);
    return hinge;
  }

  // ─── capsule on X axis ────────────────────────────────────────
  addPhysicsCapsuleX(MEObject, pOptions) {
    const Ammo = this.Ammo;
    const colShape = new Ammo.btCapsuleShape(pOptions.radius ? pOptions.radius : 1, pOptions.height ? pOptions.height : 1);
    const startTransform = new Ammo.btTransform();
    startTransform.setIdentity();
    startTransform.setOrigin(new Ammo.btVector3(
      pOptions.position.x, pOptions.position.y, pOptions.position.z
    ));
    const mass = pOptions.mass;
    const localInertia = new Ammo.btVector3(0, 0, 0);
    colShape.calculateLocalInertia(mass, localInertia);
    const body = new Ammo.btRigidBody(new Ammo.btRigidBodyConstructionInfo(
      mass, new Ammo.btDefaultMotionState(startTransform), colShape, localInertia
    ));
    body.setDamping(pOptions.damping ? pOptions.damping : 0.8, pOptions.damping ? pOptions.damping : 1);
    body.setRestitution(pOptions.restitution ? pOptions.restitution : 0.1);
    body.setFriction(pOptions.fiction ? pOptions.fiction : 1.0);
    this._applyBodyFlags(body, pOptions);
    return this._registerBody(body, MEObject, pOptions);
  }

  // ─── capsule on Z axis ────────────────────────────────────────
  addPhysicsCapsuleZ(MEObject, pOptions) {
    const Ammo = this.Ammo;
    const colShape = new Ammo.btCapsuleShape(pOptions.radius ? pOptions.radius : 1, pOptions.height ? pOptions.height : 1);
    const startTransform = new Ammo.btTransform();
    startTransform.setIdentity();
    startTransform.setOrigin(new Ammo.btVector3(
      pOptions.position.x, pOptions.position.y, pOptions.position.z
    ));
    const mass = pOptions.mass;
    const localInertia = new Ammo.btVector3(0, 0, 0);
    colShape.calculateLocalInertia(mass, localInertia);
    const body = new Ammo.btRigidBody(new Ammo.btRigidBodyConstructionInfo(
      mass, new Ammo.btDefaultMotionState(startTransform), colShape, localInertia
    ));
    body.setDamping(pOptions.damping ? pOptions.damping : 0.8, pOptions.damping ? pOptions.damping : 1);
    body.setRestitution(pOptions.restitution ? pOptions.restitution : 0.1);
    body.setFriction(pOptions.fiction ? pOptions.fiction : 1.0);
    this._applyBodyFlags(body, pOptions);
    return this._registerBody(body, MEObject, pOptions);
  }

  // ─────────────────────────────────────────────────────────────
  // 2. CYLINDER  (Y axis — barrels, pillars, wheels)
  //    pOptions: { scale: [rx, hy, rz], mass, position, rotation, name }
  //    scale[0] = radius X, scale[1] = half-height, scale[2] = radius Z
  // ─────────────────────────────────────────────────────────────
  addPhysicsCylinder(MEObject, pOptions) {
    const Ammo = this.Ammo;
    const colShape = new Ammo.btCylinderShape(
      new Ammo.btVector3(pOptions.scale[0], pOptions.scale[1], pOptions.scale[2])
    );
    const startTransform = new Ammo.btTransform();
    startTransform.setIdentity();
    startTransform.setOrigin(new Ammo.btVector3(
      pOptions.position.x, pOptions.position.y, pOptions.position.z
    ));
    const rot = startTransform.getRotation();
    rot.setX(degToRad(pOptions.rotation?.x ?? 0));
    rot.setY(degToRad(pOptions.rotation?.y ?? 0));
    rot.setZ(degToRad(pOptions.rotation?.z ?? 0));
    startTransform.setRotation(rot);
    const mass = pOptions.mass;
    const localInertia = new Ammo.btVector3(0, 0, 0);
    colShape.calculateLocalInertia(mass, localInertia);
    const body = new Ammo.btRigidBody(new Ammo.btRigidBodyConstructionInfo(
      mass, new Ammo.btDefaultMotionState(startTransform), colShape, localInertia
    ));
    // body.setDamping(pOptions.damping ? pOptions.damping : 0.8, pOptions.damping ? pOptions.damping : 1);
    // body.setRestitution(pOptions.restitution ? pOptions.restitution : 0.1);
    // body.setFriction(pOptions.fiction ? pOptions.fiction : 1.0);
    this._applyBodyFlags(body, pOptions);
    return this._registerBody(body, MEObject, pOptions);
  }

  // ─── cylinder on X axis ───────────────────────────────────────
  addPhysicsCylinderX(MEObject, pOptions) {
    const Ammo = this.Ammo;
    const colShape = new Ammo.btCylinderShapeX(
      new Ammo.btVector3(pOptions.scale[0], pOptions.scale[1], pOptions.scale[2])
    );
    const startTransform = new Ammo.btTransform();
    startTransform.setIdentity();
    startTransform.setOrigin(new Ammo.btVector3(
      pOptions.position.x, pOptions.position.y, pOptions.position.z
    ));
    const mass = pOptions.mass;
    const localInertia = new Ammo.btVector3(0, 0, 0);
    colShape.calculateLocalInertia(mass, localInertia);
    const body = new Ammo.btRigidBody(new Ammo.btRigidBodyConstructionInfo(
      mass, new Ammo.btDefaultMotionState(startTransform), colShape, localInertia
    ));
    body.setDamping(pOptions.damping ? pOptions.damping : 0.8, pOptions.damping ? pOptions.damping : 1);
    body.setRestitution(pOptions.restitution ? pOptions.restitution : 0.1);
    body.setFriction(pOptions.fiction ? pOptions.fiction : 1.0);
    this._applyBodyFlags(body, pOptions);
    return this._registerBody(body, MEObject, pOptions);
  }

  // ─── cylinder on Z axis ───────────────────────────────────────
  addPhysicsCylinderZ(MEObject, pOptions) {
    const Ammo = this.Ammo;
    const colShape = new Ammo.btCylinderShapeZ(
      new Ammo.btVector3(pOptions.scale[0], pOptions.scale[1], pOptions.scale[2])
    );
    const startTransform = new Ammo.btTransform();
    startTransform.setIdentity();
    startTransform.setOrigin(new Ammo.btVector3(
      pOptions.position.x, pOptions.position.y, pOptions.position.z
    ));
    const mass = pOptions.mass;
    const localInertia = new Ammo.btVector3(0, 0, 0);
    colShape.calculateLocalInertia(mass, localInertia);
    const body = new Ammo.btRigidBody(new Ammo.btRigidBodyConstructionInfo(
      mass, new Ammo.btDefaultMotionState(startTransform), colShape, localInertia
    ));
    body.setDamping(pOptions.damping ? pOptions.damping : 0.8, pOptions.damping ? pOptions.damping : 1);
    body.setRestitution(pOptions.restitution ? pOptions.restitution : 0.1);
    body.setFriction(pOptions.fiction ? pOptions.fiction : 1.0);
    this._applyBodyFlags(body, pOptions);
    return this._registerBody(body, MEObject, pOptions);
  }

  // ─────────────────────────────────────────────────────────────
  // 3. CONE  (Y axis)
  //    pOptions: { radius, height, mass, position, name }
  // ─────────────────────────────────────────────────────────────
  addPhysicsCone(MEObject, pOptions) {
    const Ammo = this.Ammo;
    const colShape = new Ammo.btConeShape(pOptions.radius ? pOptions.radius : 1, pOptions.height ? pOptions.height : 1);
    const startTransform = new Ammo.btTransform();
    startTransform.setIdentity();
    startTransform.setOrigin(new Ammo.btVector3(
      pOptions.position.x, pOptions.position.y, pOptions.position.z
    ));
    startTransform.setOrigin(new Ammo.btVector3(
      pOptions.position.x,
      pOptions.position.y, // pOptions.height*0.5,
      pOptions.position.z
    ));
    const mass = pOptions.mass;
    const localInertia = new Ammo.btVector3(0, 0, 0);
    colShape.calculateLocalInertia(mass, localInertia);
    const body = new Ammo.btRigidBody(new Ammo.btRigidBodyConstructionInfo(
      mass, new Ammo.btDefaultMotionState(startTransform), colShape, localInertia
    ));
    // body.setDamping(pOptions.damping ? pOptions.damping : 0.8, pOptions.damping ? pOptions.damping : 0.8);
    // body.setRestitution(pOptions.restitution ? pOptions.restitution : 0.1);
    // body.setFriction(pOptions.fiction ? pOptions.fiction : 1.0);
    this._applyBodyFlags(body, pOptions);
    return this._registerBody(body, MEObject, pOptions);
  }

  // ─── cone on X axis ───────────────────────────────────────────
  addPhysicsConeX(MEObject, pOptions) {
    const Ammo = this.Ammo;
    const colShape = new Ammo.btConeShapeX(pOptions.radius ? pOptions.radius : 1, pOptions.height ? pOptions.height : 1);
    const startTransform = new Ammo.btTransform();
    startTransform.setIdentity();
    startTransform.setOrigin(new Ammo.btVector3(
      pOptions.position.x, pOptions.position.y, pOptions.position.z
    ));
    const mass = pOptions.mass;
    const localInertia = new Ammo.btVector3(0, 0, 0);
    colShape.calculateLocalInertia(mass, localInertia);
    const body = new Ammo.btRigidBody(new Ammo.btRigidBodyConstructionInfo(
      mass, new Ammo.btDefaultMotionState(startTransform), colShape, localInertia
    ));
    this._applyBodyFlags(body, pOptions);
    return this._registerBody(body, MEObject, pOptions);
  }

  // ─── cone on Z axis ───────────────────────────────────────────
  addPhysicsConeZ(MEObject, pOptions) {
    const Ammo = this.Ammo;
    const colShape = new Ammo.btConeShapeZ(pOptions.radius, pOptions.height);
    const startTransform = new Ammo.btTransform();
    startTransform.setIdentity();
    startTransform.setOrigin(new Ammo.btVector3(
      pOptions.position.x, pOptions.position.y, pOptions.position.z
    ));
    const mass = pOptions.mass;
    const localInertia = new Ammo.btVector3(0, 0, 0);
    colShape.calculateLocalInertia(mass, localInertia);
    const body = new Ammo.btRigidBody(new Ammo.btRigidBodyConstructionInfo(
      mass, new Ammo.btDefaultMotionState(startTransform), colShape, localInertia
    ));
    this._applyBodyFlags(body, pOptions);
    return this._registerBody(body, MEObject, pOptions);
  }

  // ─────────────────────────────────────────────────────────────
  // 4. STATIC PLANE  (mass = 0 always, infinite flat surface)
  //    pOptions: { normal: [nx,ny,nz], constant, position, name }
  //    normal  = surface normal, e.g. [0,1,0] = horizontal floor
  //    constant = signed distance from origin, e.g. 0 = floor at y=0
  // ─────────────────────────────────────────────────────────────
  addPhysicsStaticPlane(MEObject, pOptions) {
    const Ammo = this.Ammo;
    const n = pOptions.normal ?? [0, 1, 0];
    const colShape = new Ammo.btStaticPlaneShape(
      new Ammo.btVector3(n[0], n[1], n[2]),
      pOptions.constant ?? 0
    );
    const startTransform = new Ammo.btTransform();
    startTransform.setIdentity();
    // plane has no meaningful origin but setOrigin keeps the API consistent
    startTransform.setOrigin(new Ammo.btVector3(
      pOptions.position?.x ?? 0,
      pOptions.position?.y ?? 0,
      pOptions.position?.z ?? 0
    ));
    const localInertia = new Ammo.btVector3(0, 0, 0);
    const body = new Ammo.btRigidBody(new Ammo.btRigidBodyConstructionInfo(
      0, new Ammo.btDefaultMotionState(startTransform), colShape, localInertia
    ));
    // planes are always static kinematic
    body.setCollisionFlags(2);
    body.setActivationState(2);
    return this._registerBody(body, MEObject, pOptions);
  }

  // ─────────────────────────────────────────────────────────────
  // 5. CONVEX HULL  (dynamic-safe approximate mesh shape)
  //    pOptions: { vertices: Float32Array|Array, mass, position, rotation, name }
  //    vertices = flat [x,y,z, x,y,z, ...] — all points, no indices needed
  // ─────────────────────────────────────────────────────────────
  addPhysicsConvexHull(MEObject, pOptions) {
    const Ammo = this.Ammo;
    const colShape = new Ammo.btConvexHullShape();
    const verts = pOptions.vertices;
    const sx = pOptions.scale?.[0] ?? 1;
    const sy = pOptions.scale?.[1] ?? 1;
    const sz = pOptions.scale?.[2] ?? 1;
    for(let i = 0;i < verts.length;i += 3) {
      colShape.addPoint(new Ammo.btVector3(
        verts[i] * sx,
        verts[i + 1] * sy,
        verts[i + 2] * sz
      ), true);
    }
    const startTransform = new Ammo.btTransform();
    startTransform.setIdentity();
    startTransform.setOrigin(new Ammo.btVector3(
      pOptions.position.x, pOptions.position.y, pOptions.position.z
    ));
    const rot = startTransform.getRotation();
    rot.setX(degToRad(pOptions.rotation?.x ?? 0));
    rot.setY(degToRad(pOptions.rotation?.y ?? 0));
    rot.setZ(degToRad(pOptions.rotation?.z ?? 0));
    startTransform.setRotation(rot);
    const mass = pOptions.mass;
    const localInertia = new Ammo.btVector3(0, 0, 0);
    colShape.calculateLocalInertia(mass, localInertia);
    const body = new Ammo.btRigidBody(new Ammo.btRigidBodyConstructionInfo(
      mass, new Ammo.btDefaultMotionState(startTransform), colShape, localInertia
    ));
    this._applyBodyFlags(body, pOptions);
    return this._registerBody(body, MEObject, pOptions);
  }

  // ─────────────────────────────────────────────────────────────
  // 6. BVH TRIANGLE MESH  (exact mesh shape — static / mass=0 only)
  //    pOptions: { vertices: Float32Array, indices: Uint16Array|Uint32Array,
  //                position, rotation, name }
  //    vertices = flat [x,y,z, ...], indices = triangle index triples
  // ─────────────────────────────────────────────────────────────
  addPhysicsBvhMesh(MEObject, pOptions) {
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
    const colShape = new Ammo.btBvhTriangleMeshShape(triMesh, true, true);
    const startTransform = new Ammo.btTransform();
    startTransform.setIdentity();
    startTransform.setOrigin(new Ammo.btVector3(
      pOptions.position.x, pOptions.position.y, pOptions.position.z
    ));
    const rot = startTransform.getRotation();
    rot.setX(degToRad(pOptions.rotation?.x ?? 0));
    rot.setY(degToRad(pOptions.rotation?.y ?? 0));
    rot.setZ(degToRad(pOptions.rotation?.z ?? 0));
    startTransform.setRotation(rot);
    const localInertia = new Ammo.btVector3(0, 0, 0);
    // mass must be 0 — BVH is static only
    const body = new Ammo.btRigidBody(new Ammo.btRigidBodyConstructionInfo(
      0, new Ammo.btDefaultMotionState(startTransform), colShape, localInertia
    ));
    body.setCollisionFlags(2);
    body.setActivationState(2);
    return this._registerBody(body, MEObject, pOptions);
  }

  // ─────────────────────────────────────────────────────────────
  // 7. COMPOUND  (combine multiple child shapes at offsets)
  //    pOptions: {
  //      children: [
  //        { shape: Ammo.btCollisionShape, offset: {x,y,z}, rotation: {x,y,z} },
  //        ...
  //      ],
  //      mass, position, rotation, name
  //    }
  //    Build each child shape first (btBoxShape, btSphereShape, etc.)
  //    then pass them in as pOptions.children.
  // ─────────────────────────────────────────────────────────────
  addPhysicsCompound(MEObject, pOptions) {
    const Ammo = this.Ammo;
    const compound = new Ammo.btCompoundShape();
    for(const child of pOptions.children) {
      const childTransform = new Ammo.btTransform();
      childTransform.setIdentity();
      childTransform.setOrigin(new Ammo.btVector3(
        child.offset?.x ?? 0,
        child.offset?.y ?? 0,
        child.offset?.z ?? 0
      ));
      const cRot = childTransform.getRotation();
      cRot.setX(degToRad(child.rotation?.x ?? 0));
      cRot.setY(degToRad(child.rotation?.y ?? 0));
      cRot.setZ(degToRad(child.rotation?.z ?? 0));
      childTransform.setRotation(cRot);
      compound.addChildShape(childTransform, child.shape);
    }
    const startTransform = new Ammo.btTransform();
    startTransform.setIdentity();
    startTransform.setOrigin(new Ammo.btVector3(
      pOptions.position.x, pOptions.position.y, pOptions.position.z
    ));
    const rot = startTransform.getRotation();
    rot.setX(degToRad(pOptions.rotation?.x ?? 0));
    rot.setY(degToRad(pOptions.rotation?.y ?? 0));
    rot.setZ(degToRad(pOptions.rotation?.z ?? 0));
    startTransform.setRotation(rot);
    const mass = pOptions.mass;
    const localInertia = new Ammo.btVector3(0, 0, 0);
    compound.calculateLocalInertia(mass, localInertia);
    const body = new Ammo.btRigidBody(new Ammo.btRigidBodyConstructionInfo(
      mass, new Ammo.btDefaultMotionState(startTransform), compound, localInertia
    ));
    this._applyBodyFlags(body, pOptions);
    return this._registerBody(body, MEObject, pOptions);
  }

  // ─────────────────────────────────────────────────────────────
  // 8. HEIGHTFIELD  (terrain — static, mass=0 always)
  //    pOptions: {
  //      data: Float32Array,       // row-major height values
  //      widthSamples: number,     // samples along X
  //      heightSamples: number,    // samples along Z
  //      minHeight: number,
  //      maxHeight: number,
  //      heightScale: number,      // usually 1
  //      position, name
  //    }
  //    The Float32Array must be kept alive (don't let it be GC'd).
  //    Store it on pOptions or on the MEObject if you need to access it later.
  // ─────────────────────────────────────────────────────────────
  addPhysicsHeightfield(MEObject, pOptions) {
    const Ammo = this.Ammo;
    const data = pOptions.data; // Float32Array
    // Copy into Ammo's heap so Bullet can read it
    const nBytes = data.length * 4;
    const ptr = Ammo._malloc(nBytes);
    Ammo.HEAPF32.set(data, ptr >> 2);
    // Store ptr on MEObject so caller can free it later with Ammo._free(ptr)
    MEObject._heightfieldPtr = ptr;
    const colShape = new Ammo.btHeightfieldTerrainShape(
      pOptions.widthSamples,
      pOptions.heightSamples,
      ptr,
      pOptions.heightScale ?? 1,
      pOptions.minHeight,
      pOptions.maxHeight,
      1,           // upAxis: 1 = Y
      'PHY_FLOAT',
      false        // flipQuadEdges
    );
    // Scale the shape to match world units if needed
    if(pOptions.worldScale) {
      colShape.setLocalScaling(new Ammo.btVector3(
        pOptions.worldScale.x ?? 1,
        pOptions.worldScale.y ?? 1,
        pOptions.worldScale.z ?? 1
      ));
    }
    const startTransform = new Ammo.btTransform();
    startTransform.setIdentity();
    // Bullet centres the heightfield at origin — offset Y by mid-height
    const midY = (pOptions.minHeight + pOptions.maxHeight) / 2;
    startTransform.setOrigin(new Ammo.btVector3(
      pOptions.position?.x ?? 0,
      (pOptions.position?.y ?? 0) + midY,
      pOptions.position?.z ?? 0
    ));
    const localInertia = new Ammo.btVector3(0, 0, 0);
    const body = new Ammo.btRigidBody(new Ammo.btRigidBodyConstructionInfo(
      0, new Ammo.btDefaultMotionState(startTransform), colShape, localInertia
    ));
    body.setCollisionFlags(2);
    body.setActivationState(2);
    return this._registerBody(body, MEObject, pOptions);
  }

  setBodyVelocity = (body, x, y, z) => {
    var tbv30 = new Ammo.btVector3();
    tbv30.setValue(x, y, z);
    body.setLinearVelocity(tbv30);
  }

  setKinematicTransform = (body, x, y, z, rx, ry, rz) => {
    if(typeof rx == 'undefined') {var rx = 0;}
    if(typeof ry == 'undefined') {var ry = 0;}
    if(typeof rz == 'undefined') {var rz = 0;}
    let pos = new Ammo.btVector3();
    // let quat = new Ammo.btQuaternion();
    pos = body.getWorldTransform().getOrigin();
    let localRot = body.getWorldTransform().getRotation();
    // console.log('pre pos x:', pos.x(), " y : ", pos.y(), " z:", pos.z())
    pos.setX(pos.x() + x)
    pos.setY(pos.y() + y)
    pos.setZ(pos.z() + z)
    localRot.setX(rx)
    localRot.setY(ry)
    localRot.setZ(rz)
    let physicsBody = body;
    let ms = physicsBody.getMotionState();
    if(ms) {
      var tmpTrans = new Ammo.btTransform();
      tmpTrans.setIdentity();
      tmpTrans.setOrigin(pos);
      tmpTrans.setRotation(localRot);
      ms.setWorldTransform(tmpTrans);
    }
  }

  getBodyByName = (name) => {
    var b = null;
    this.rigidBodies.forEach((item, index, array) => {
      if(item.name == name) {
        b = array[index];
      }
    });
    return b;
  }

  getNameByBody = (body) => {
    var b = null;
    this.rigidBodies.forEach((item, index, array) => {
      if(item.kB == body.kB) {
        b = array[index].name;
      }
    });
    return b;
  }

  deactivatePhysics = (body) => {
    const CF_KINEMATIC_OBJECT = 2;
    const DISABLE_DEACTIVATION = 4;
    // 1. Remove from world
    this.dynamicsWorld.removeRigidBody(body);
    // 2. Set body to kinematic
    const flags = body.getCollisionFlags();
    body.setCollisionFlags(flags | CF_KINEMATIC_OBJECT);
    body.setActivationState(DISABLE_DEACTIVATION); // no auto-wakeup
    // 3. Clear motion
    const zero = new Ammo.btVector3(0, 0, 0);
    body.setLinearVelocity(zero);
    body.setAngularVelocity(zero);
    // 4. Reset transform to current position (optional — preserves pose)
    const currentTransform = body.getWorldTransform();
    body.setWorldTransform(currentTransform);
    body.getMotionState().setWorldTransform(currentTransform);
    // 5. Add back to physics world
    this.matrixAmmo.dynamicsWorld.addRigidBody(body);
    // 6. Mark it manually (logic flag)
    body.isKinematic = true;
  }

  raycastToTarget(fromBody, toBody) {
    let from = fromBody.getWorldTransform().getOrigin();
    let to = toBody.getWorldTransform().getOrigin();

    let rayDirection = [
      to.x() - from.x(),
      to.y() - from.y(),
      to.z() - from.z()
    ];

    let length = Math.sqrt(
      rayDirection[0] ** 2 + rayDirection[1] ** 2 + rayDirection[2] ** 2
    );

    return [
      rayDirection[0] / length,
      rayDirection[1] / length,
      rayDirection[2] / length
    ];
  }

  detectCollision() {
    let dispatcher = this.dynamicsWorld.getDispatcher();
    let numManifolds = dispatcher.getNumManifolds();
    let currentCollisions = new Set();
    for(let i = 0;i < numManifolds;i++) {
      let contactManifold = dispatcher.getManifoldByIndexInternal(i);
      let numContacts = contactManifold.getNumContacts();
      if(numContacts > 0) {
        let body0 = contactManifold.getBody0();
        let body1 = contactManifold.getBody1();
        let name0 = this.getNameByBody(body0);
        let name1 = this.getNameByBody(body1);
        let collisionKey = `${name0}|${name1}`;
        currentCollisions.add(collisionKey);
        if(!this.lastCollisionState.has(collisionKey)) {
          // Get contact normal
          let contact = contactManifold.getContactPoint();
          let normal = contact.get_m_normalWorldOnB();
          let rayDirection = [normal.x(), normal.y(), normal.z()];
          this.collisionEvent.detail.body0Name = name0;
          this.collisionEvent.detail.body1Name = name1;
          this.collisionEvent.detail.rayDirection = rayDirection;
          document.dispatchEvent(this.collisionEvent);
        }
      }
    }

    this.lastCollisionState = currentCollisions;
  }

  updatePhysics() {
    this.rigidBodies.forEach((body) => {
      if(body.isKinematic) {
        this._transform.setIdentity();
        this._origin.setValue(
          body.MEObject.position.x,
          body.MEObject.position.y,
          body.MEObject.position.z
        );
        this._transform.setOrigin(this._origin);
        this._axis.setValue(
          body.MEObject.rotation.axis.x,
          body.MEObject.rotation.axis.y,
          body.MEObject.rotation.axis.z
        );
        this._quat.setRotation(this._axis, degToRad(body.MEObject.rotation.angle));
        this._transform.setRotation(this._quat);
        body.setWorldTransform(this._transform);
        const ms = body.getMotionState();
        if(ms) ms.setWorldTransform(this._transform);
      }
    });

    for(let i = 0;i < this.speedUpSimulation;i++) {
      this.dynamicsWorld.stepSimulation(1 / 30, this.maxSubSteps);
    }

    this.rigidBodies.forEach((body) => {
      if(!body.isKinematic && body.getMotionState()) {
        body.getMotionState().getWorldTransform(this._trans);
        const _x = +this._trans.getOrigin().x();
        const _y = +this._trans.getOrigin().y();
        const _z = +this._trans.getOrigin().z();
        body.MEObject.position.setPosition(_x, _y, _z);
        body.MEObject.position.inMove = true;
        const rot = this._trans.getRotation();
        const rotAxis = rot.getAxis();
        rot.normalize();
        body.MEObject.rotation.axis.x = rotAxis.x();
        body.MEObject.rotation.axis.y = rotAxis.y();
        body.MEObject.rotation.axis.z = rotAxis.z();
        body.MEObject.rotation.matrixRotation = quaternion_rotation_matrix(rot);
        body.MEObject.rotation.angle = radToDeg(parseFloat(rot.getAngle()));
      }
    });
    this.detectCollision();
  }
}