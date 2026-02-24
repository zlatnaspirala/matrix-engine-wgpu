import {LOG_FUNNY, LOG_FUNNY_ARCADE, degToRad, quaternion_rotation_matrix, radToDeg, scriptManager} from "../engine/utils";

export default class MatrixAmmo {
  constructor(options = {roundDimension: 100, gravity: 10}) {
    // THIS PATH IS PATH FROM PUBLIC FINAL FOLDER
    this.options = options;
    // scriptManager.LOAD("https://maximumroulette.com/apps/megpu/ammo.js", "ammojs",
    scriptManager.LOAD("ammojs/ammo.js", "ammojs",
      undefined, undefined, this.init,
    );
    this.lastRoll = '';
    this.presentScore = '';
    this.speedUpSimulation = 1;
  }

  init = () => {
    Ammo().then(Ammo => {
      // Physics variables
      this.dynamicsWorld = null;
      this.rigidBodies = [];
      this.Ammo = Ammo;
      this.lastUpdate = 0
      console.log("%c Ammo core loaded.", LOG_FUNNY_ARCADE);
      this.initPhysics();
      // simulate async
      setTimeout(() => {
        dispatchEvent(new CustomEvent('AmmoReady', {}))
      }, 200)
    });
  };

  initPhysics() {
    let Ammo = this.Ammo;
    // Physics configuration
    var collisionConfiguration = new Ammo.btDefaultCollisionConfiguration(),
      dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration),
      overlappingPairCache = new Ammo.btDbvtBroadphase(),
      solver = new Ammo.btSequentialImpulseConstraintSolver();

    this.dynamicsWorld = new Ammo.btDiscreteDynamicsWorld(dispatcher, overlappingPairCache, solver, collisionConfiguration);
    this.dynamicsWorld.setGravity(new Ammo.btVector3(0, -10, 0));

    var groundShape = new Ammo.btBoxShape(new Ammo.btVector3(this.options.roundDimension, 1, this.options.roundDimension)),
      groundTransform = new Ammo.btTransform();
    groundTransform.setIdentity();
    groundTransform.setOrigin(new Ammo.btVector3(0, -4.45, 0));
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
    this.detectCollision();


    // cache for loop call opti
    this._trans = new Ammo.btTransform();
    this._transform = new Ammo.btTransform();
    this._btVec3 = new Ammo.btVector3(0, 0, 0);
    this._btVec3Axis = new Ammo.btVector3(0, 0, 0);
    this._btQuat = new Ammo.btQuaternion(0, 0, 0, 1);
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

  detectCollision() {
    // console.log('override this')
    return;
    this.lastRoll = '';
    this.presentScore = '';
    let dispatcher = this.dynamicsWorld.getDispatcher();
    let numManifolds = dispatcher.getNumManifolds();
    for(let i = 0;i < numManifolds;i++) {
      let contactManifold = dispatcher.getManifoldByIndexInternal(i);
      // let numContacts = contactManifold.getNumContacts();
      // this.rigidBodies.forEach((item) => {
      //   if(item.kB == contactManifold.getBody0().kB) {
      //     // console.log('Detected body0 =', item.name)
      //   }
      if(this.ground.kB == contactManifold.getBody0().kB &&
        this.getNameByBody(contactManifold.getBody1()) == 'CubePhysics1') {
        // console.log(this.ground ,'GROUND IS IN CONTACT WHO IS BODY1 ', contactManifold.getBody1())
        // console.log('GROUND IS IN CONTACT WHO IS BODY1 getNameByBody  ', this.getNameByBody(contactManifold.getBody1()))
        // CHECK ROTATION
        var testR = contactManifold.getBody1().getWorldTransform().getRotation();
        console.log('this.lastRoll = ', this.lastRoll, ' presentScore = ', this.presentScore)
      }
    }
  }

  updatePhysics() {
    if(typeof Ammo === 'undefined') return;

    this.rigidBodies.forEach((body) => {
      if(body.isKinematic) {
        this._transform.setIdentity();
        this._btVec3.setValue(
          body.MEObject.position.x,
          body.MEObject.position.y,
          body.MEObject.position.z
        );
        this._transform.setOrigin(this._btVec3);
        this._btVec3Axis.setValue(
          body.MEObject.rotation.axis.x,
          body.MEObject.rotation.axis.y,
          body.MEObject.rotation.axis.z
        );
        this._btQuat.setRotation(this._btVec3Axis, degToRad(body.MEObject.rotation.angle));
        this._transform.setRotation(this._btQuat);
        body.setWorldTransform(this._transform);
        const ms = body.getMotionState();
        if(ms) ms.setWorldTransform(this._transform);
      }
    });

    const timeStep = 1 / 60;
    const maxSubSteps = 10;
    for(let i = 0;i < this.speedUpSimulation;i++) {
      this.dynamicsWorld.stepSimulation(timeStep, maxSubSteps);
    }
    this.rigidBodies.forEach((body) => {
      if(!body.isKinematic && body.getMotionState()) {
        body.getMotionState().getWorldTransform(this._trans);
        const _x = Math.round(this._trans.getOrigin().x() * 100) / 100;
        const _y = Math.round(this._trans.getOrigin().y() * 100) / 100;
        const _z = Math.round(this._trans.getOrigin().z() * 100) / 100;
        body.MEObject.position.setPosition(_x, _y, _z);
        const rot = this._trans.getRotation();
        const rotAxis = rot.getAxis();
        rot.normalize();
        body.MEObject.rotation.axis.x = rotAxis.x();
        body.MEObject.rotation.axis.y = rotAxis.y();
        body.MEObject.rotation.axis.z = rotAxis.z();
        body.MEObject.rotation.matrixRotation = quaternion_rotation_matrix(rot);
        body.MEObject.rotation.angle = radToDeg(rot.getAngle());
      }
    });
    // NO Ammo.destroy needed — reused objects stay alive
    this.detectCollision();
  }
}