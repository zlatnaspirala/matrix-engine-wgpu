import {LOG_FUNNY_ARCADE, degToRad, quaternion_rotation_matrix, radToDeg, scriptManager} from "../engine/utils";
import {MEConfig} from "../me-config";

export default class MatrixAmmo {
  constructor(options = {roundDimensionX: 10, roundDimensionY: 10, gravity: -10}) {
    this.options = options;
    if(!this.options.gravity) this.options.gravity = -10;
    console.log('this.options.gravity::::::', this.options.gravity)
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
    if(pOptions.geometry == "Sphere") {
      this.addPhysicsSphere(MEObject, pOptions)
    } else if(pOptions.geometry == "Cube") {
      this.addPhysicsBox(MEObject, pOptions)
    }
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
    // console.log('startTransform.setRotation', startTransform.setRotation)
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
      // frameA,
      // frameB,
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
    if(typeof Ammo === 'undefined') return;

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

    const timeStep = 1 / 60;
    const maxSubSteps = 4;
    for(let i = 0;i < this.speedUpSimulation;i++) {
      this.dynamicsWorld.stepSimulation(timeStep, maxSubSteps);
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