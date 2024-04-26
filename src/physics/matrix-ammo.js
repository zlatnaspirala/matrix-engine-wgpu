import {vec3} from "wgpu-matrix";
import {LOG_FUNNY, LOG_MATRIX, quaternion_rotation_matrix, radToDeg, scriptManager} from "../engine/utils";

export default class MatrixAmmo {
  constructor() {
    // THIS PATH IS PATH FROM PUBLIC FINAL FOLDER
    scriptManager.LOAD(
      "./ammojs/ammo.js",
      "ammojs",
      undefined,
      undefined,
      this.init,
    );
  }

  init = () => {
    console.log('pre ammo')
    Ammo().then(Ammo => {
      // Physics variables
      this.dynamicsWorld = null;
      this.rigidBodies = [];
      this.Ammo = Ammo;
      this.lastUpdate = 0
      console.log("%c Ammo core loaded.", LOG_FUNNY);
      this.initPhysics();
      // simulate async
      setTimeout(() => dispatchEvent(new CustomEvent('AmmoReady', {})), 100);
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

    var groundShape = new Ammo.btBoxShape(new Ammo.btVector3(50, 0.5, 50)),
      groundTransform = new Ammo.btTransform();
    groundTransform.setIdentity();
    groundTransform.setOrigin(new Ammo.btVector3(0, -1, 0));
    var mass = 0,
      isDynamic = (mass !== 0),
      localInertia = new Ammo.btVector3(0, 0, 0);

    if(isDynamic)
      groundShape.calculateLocalInertia(mass, localInertia);

    var myMotionState = new Ammo.btDefaultMotionState(groundTransform),
      rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, myMotionState, groundShape, localInertia),
      body = new Ammo.btRigidBody(rbInfo);
    body.name = 'ground';
    this.ground = body;
    this.dynamicsWorld.addRigidBody(body);
    // this.rigidBodies.push(body);

    // add collide event
    this.detectCollision()
  }

  addPhysics(MEObject, pOptions) {
    if(pOptions.geometry == "Sphere") {
      this.addPhysicsSphere(MEObject, pOptions)
    } else if(pOptions.geometry == "Cube") {
      this.addPhysicsBox(MEObject, pOptions)
    }
  }

  addPhysicsSphere(MEObject, pOptions) {
    let Ammo = this.Ammo;
    var colShape = new Ammo.btSphereShape(pOptions.radius),
      startTransform = new Ammo.btTransform();
    startTransform.setIdentity();
    var mass = 1;
    var localInertia = new Ammo.btVector3(0, 0, 0);
    colShape.calculateLocalInertia(mass, localInertia);

    startTransform.setOrigin(new Ammo.btVector3(pOptions.position.x, pOptions.position.y, pOptions.position.z));

    var myMotionState = new Ammo.btDefaultMotionState(startTransform),
      rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, myMotionState, colShape, localInertia),
      body = new Ammo.btRigidBody(rbInfo);

    body.MEObject = MEObject;
    this.dynamicsWorld.addRigidBody(body);
    this.rigidBodies.push(body);
    return body;
  }

  addPhysicsBox(MEObject, pOptions) {

    const FLAGS = {CF_KINEMATIC_OBJECT: 2}

    let Ammo = this.Ammo;
    var colShape = new Ammo.btBoxShape(new Ammo.btVector3(1, 1, 1)),
      startTransform = new Ammo.btTransform();
    startTransform.setIdentity();
    var mass = pOptions.mass;
    var localInertia = new Ammo.btVector3(0, 0, 0);
    colShape.calculateLocalInertia(mass, localInertia);
    startTransform.setOrigin(new Ammo.btVector3(pOptions.position.x, pOptions.position.y, pOptions.position.z));
    var myMotionState = new Ammo.btDefaultMotionState(startTransform),
      rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, myMotionState, colShape, localInertia),
      body = new Ammo.btRigidBody(rbInfo);

    if(pOptions.mass == 0 && typeof pOptions.state == 'undefined') {
      body.setActivationState(2)
      body.setCollisionFlags(FLAGS.CF_KINEMATIC_OBJECT);

      console.log('what is pOptions.mass and state is 2 ....', pOptions.mass)
    } else {
      body.setActivationState(4)
    }


    console.log('what is name....', pOptions.name)
    body.name = pOptions.name;

    body.MEObject = MEObject;
    this.dynamicsWorld.addRigidBody(body);
    this.rigidBodies.push(body);
    return body;
  }

  setBodyVelocity(body, x, y, z) {
    var tbv30 = new Ammo.btVector3();
    tbv30.setValue(x, y, z);
    body.setLinearVelocity(tbv30);
  }

  setKinematicTransform(body, x, y, z, rx, ry, rz) {

    if(typeof rx == 'undefined') {var rx = 0;}
    if(typeof ry == 'undefined') {var ry = 0;}
    if(typeof rz == 'undefined') {var rz = 0;}

    let pos = new Ammo.btVector3();
    let quat = new Ammo.btQuaternion();
    pos = body.getWorldTransform().getOrigin();
    let localRot = body.getWorldTransform().getRotation();
    console.log('pre pos x:', pos.x(), " y : ", pos.y(), " z:", pos.z())
    pos.setX(pos.x() + x)
    pos.setY(pos.y() + y)
    pos.setZ(pos.z() + z)
    console.log('position kinematic move : ', pos)
    console.log('position localRot  : ', localRot)
    localRot.setX(rx)
    localRot.setY(ry)
    localRot.setZ(rz)
    console.log('position localRot after  : ', localRot)
    // body.getWorldQuaternion(quat);
    // let physicsBody = kObject.userData.physicsBody;
    let physicsBody = body;
    let ms = physicsBody.getMotionState();
    if(ms) {
      var tmpTrans = new Ammo.btTransform();

      // quat.setValue(quat.x(), quat.y(), quat.z(), quat.w());
      tmpTrans.setIdentity();
      tmpTrans.setOrigin(pos);
      tmpTrans.setRotation(localRot);
      ms.setWorldTransform(tmpTrans);
    }
    console.log('body, ', body)
  }

  getBodyByName(name) {
    var b = null;
    this.rigidBodies.forEach((item, index, array) => {
      if(item.name == name) {
        b = array[index];
      }
    });
    return b;
  }

  getNameByBody(body) {
    var b = null;
    this.rigidBodies.forEach((item, index, array) => {
      if(item.kB == body.kB) {
        b = array[index].name;
      }
    });
    return b;
  }

  detectCollision() {
    let dispatcher = this.dynamicsWorld.getDispatcher();
    let numManifolds = dispatcher.getNumManifolds();
    // console.log('detect collision')
    for(let i = 0;i < numManifolds;i++) {
      let contactManifold = dispatcher.getManifoldByIndexInternal(i);
      let numContacts = contactManifold.getNumContacts();

      this.rigidBodies.forEach((item) => {
        if(item.kB == contactManifold.getBody0().kB) {
          // console.log('Detected body0 =', item.name)
        }
        if(item.kB == contactManifold.getBody1().kB) {
          // console.log('Detected body1 =', item.name)
        }
      })

      if(this.ground.kB == contactManifold.getBody0().kB &&
      this.getNameByBody(contactManifold.getBody1()) == 'CubePhysics2') {
        // console.log(this.ground ,'GROUND IS IN CONTACT WHO IS BODY1 ', contactManifold.getBody1())
        // console.log('GROUND IS IN CONTACT WHO IS BODY1 getNameByBody  ', this.getNameByBody(contactManifold.getBody1()))
        // CHECK ROTATION
        var testR = contactManifold.getBody1().getWorldTransform().getRotation();

        var TEST = this.getBodyByName('CubePhysics2')

        // console.log('testR.getAngle() =  ', radToDeg(testR.getAngle()))
        // console.log('testR.getAngle() =  ',  TEST )
        
        // console.log('testR.getAxis() =  ', testR.getAxis().x(), ' y ' ,  testR.getAxis().y(), ' z ' ,  testR.getAxis().z())
        // console.log('testR.x y z() =  ', testR.x(), ' , ' , testR.y(), '  , ' , testR.z() , ' w ', testR.w())

      }

      for(let j = 0;j < numContacts;j++) {
        let contactPoint = contactManifold.getContactPoint(j);
        let distance = contactPoint.getDistance();
        // console.log({manifoldIndex: i, contactIndex: j, distance: distance});
      }
    }
  }

  updatePhysics() {
    // Step world
    this.dynamicsWorld.stepSimulation(1 / 60, 10);
    // Update rigid bodies
    var trans = new Ammo.btTransform();
    this.rigidBodies.forEach(function(body) {
      if(body.getMotionState()) {
        body.getMotionState().getWorldTransform(trans);
        var _x = trans.getOrigin().x().toFixed(2);
        var _y = trans.getOrigin().y().toFixed(2);
        var _z = trans.getOrigin().z().toFixed(2);
        body.MEObject.position.setPosition(_x, _y, _z)
        var test = trans.getRotation();
        var testAxis = test.getAxis();
        test.normalize()
        body.MEObject.rotation.axis.x = testAxis.x()
        body.MEObject.rotation.axis.y = testAxis.y()
        body.MEObject.rotation.axis.z = testAxis.z()
        // var tx = radToDeg(parseFloat(test.getAngle().toFixed(2)) * testAxis.x().toFixed(2))
        // var ty = radToDeg(parseFloat(test.getAngle().toFixed(2)) * testAxis.y().toFixed(2))
        // var tz = radToDeg(parseFloat(test.getAngle().toFixed(2)) * testAxis.z().toFixed(2))
        body.MEObject.rotation.matrixRotation = quaternion_rotation_matrix(test);
        body.MEObject.rotation.angle = radToDeg(parseFloat(test.getAngle().toFixed(2)))
      }
    })

    // collision detect
    this.detectCollision()
  }
}
