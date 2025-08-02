import {LOG_FUNNY, degToRad, quaternion_rotation_matrix, radToDeg, scriptManager} from "../engine/utils";

export default class MatrixAmmo {
  constructor() {
    // THIS PATH IS PATH FROM PUBLIC FINAL FOLDER
    scriptManager.LOAD(
      "https://maximumroulette.com/apps/megpu/ammo.js",
      "ammojs",
      undefined,
      undefined,
      this.init,
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

    var groundShape = new Ammo.btBoxShape(new Ammo.btVector3(70, 1, 70)),
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
    const FLAGS = {
      TEST_NIDZA: 3,
      CF_KINEMATIC_OBJECT: 2
    }

    let Ammo = this.Ammo;
    console.log(pOptions.radius + "<<pOptions.radius")
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

  deactivatePhysics(body) {
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
      //   if(item.kB == contactManifold.getBody1().kB) {
      //     // console.log('Detected body1 =', item.name)
      //   }
      // })

      if(this.ground.kB == contactManifold.getBody0().kB &&
        this.getNameByBody(contactManifold.getBody1()) == 'CubePhysics1') {
        // console.log(this.ground ,'GROUND IS IN CONTACT WHO IS BODY1 ', contactManifold.getBody1())
        // console.log('GROUND IS IN CONTACT WHO IS BODY1 getNameByBody  ', this.getNameByBody(contactManifold.getBody1()))
        // CHECK ROTATION
        var testR = contactManifold.getBody1().getWorldTransform().getRotation();
        if(Math.abs(testR.y()) < 0.00001) {
          this.lastRoll += " 4 +";
          this.presentScore += 4;
          dispatchEvent(new CustomEvent('dice-1', {}));
        }
        if(Math.abs(testR.x()) < 0.00001) {
          this.lastRoll += " 3 +";
          this.presentScore += 3;
          dispatchEvent(new CustomEvent('dice-4', {}));
        }
        if(testR.x().toString().substring(0, 5) == testR.y().toString().substring(1, 6)) {
          this.lastRoll += " 2 +";
          this.presentScore += 2;
          dispatchEvent(new CustomEvent('dice-6', {}));
        }

        if(testR.x().toString().substring(0, 5) == testR.y().toString().substring(0, 5)) {
          this.lastRoll += " 1 +";
          this.presentScore += 1;
          dispatchEvent(new CustomEvent('dice-2', {}));
        }

        if(testR.z().toString().substring(0, 5) == testR.y().toString().substring(1, 6)) {
          this.lastRoll += " 6 +";
          this.presentScore += 6;
          dispatchEvent(new CustomEvent('dice-5', {}));
        }

        if(testR.z().toString().substring(0, 5) == testR.y().toString().substring(0, 5)) {
          this.lastRoll += " 5 +";
          this.presentScore += 5;
          dispatchEvent(new CustomEvent('dice-3', {}));
        }

        console.log('this.lastRoll = ', this.lastRoll, ' presentScore = ', this.presentScore)
      }
    }
  }

  updatePhysics() {
    if(typeof Ammo === 'undefined') return;
    const trans = new Ammo.btTransform();
    const transform = new Ammo.btTransform();

    this.rigidBodies.forEach(function(body) {
      if(body.isKinematic) {
        transform.setIdentity();
        transform.setOrigin(new Ammo.btVector3(
          body.MEObject.position.x,
          body.MEObject.position.y,
          body.MEObject.position.z
        ));
        const quat = new Ammo.btQuaternion();
        quat.setRotation(
          new Ammo.btVector3(
            body.MEObject.rotation.axis.x,
            body.MEObject.rotation.axis.y,
            body.MEObject.rotation.axis.z
          ),
          degToRad(body.MEObject.rotation.angle)
        );
        transform.setRotation(quat);

        body.setWorldTransform(transform);
        const ms = body.getMotionState();
        if(ms) ms.setWorldTransform(transform);
      }
    });

    Ammo.destroy(transform);

    // Step simulation AFTER setting kinematic transforms
    const timeStep = 1 / 60;
    const maxSubSteps = 10;

    for(let i = 0;i < this.speedUpSimulation;i++) {
      this.dynamicsWorld.stepSimulation(timeStep, maxSubSteps);
    }

    this.rigidBodies.forEach(function(body) {
      if(!body.isKinematic && body.getMotionState()) {
        body.getMotionState().getWorldTransform(trans);

        const _x = +trans.getOrigin().x().toFixed(2);
        const _y = +trans.getOrigin().y().toFixed(2);
        const _z = +trans.getOrigin().z().toFixed(2);

        body.MEObject.position.setPosition(_x, _y, _z);

        const rot = trans.getRotation();
        const rotAxis = rot.getAxis();
        rot.normalize();

        body.MEObject.rotation.axis.x = rotAxis.x();
        body.MEObject.rotation.axis.y = rotAxis.y();
        body.MEObject.rotation.axis.z = rotAxis.z();
        body.MEObject.rotation.matrixRotation = quaternion_rotation_matrix(rot);
        body.MEObject.rotation.angle = radToDeg(parseFloat(rot.getAngle().toFixed(2)));
      }
    });

    Ammo.destroy(trans);
    this.detectCollision();
  }
}