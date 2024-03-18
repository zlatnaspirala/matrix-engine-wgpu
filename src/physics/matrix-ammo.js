import {vec3, vec4} from "wgpu-matrix";
import {createAppEvent, getAxisRot, quaternion_rotation_matrix, scriptManager} from "../engine/utils";

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
    // start
    Ammo().then(Ammo => {
      // Physics variables
      this.dynamicsWorld = null;
      this.rigidBodies = [];
      this.Ammo = Ammo;
      this.lastUpdate = 0
      console.log("Ammo core loaded.");
      this.initPhysics();
      dispatchEvent(new CustomEvent('AmmoReady', {}))
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

    var groundShape = new Ammo.btBoxShape(new Ammo.btVector3(50, 2, 50)),
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

    this.dynamicsWorld.addRigidBody(body);
    // this.rigidBodies.push(body);
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
    var colShape = new Ammo.btSphereShape(1),
      startTransform = new Ammo.btTransform();
    startTransform.setIdentity();
    var mass = 1;
    var localInertia = new Ammo.btVector3(0, 0, 0);
    colShape.calculateLocalInertia(mass, localInertia);

    startTransform.setOrigin(new Ammo.btVector3(0, 25, -10));

    var myMotionState = new Ammo.btDefaultMotionState(startTransform),
      rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, myMotionState, colShape, localInertia),
      body = new Ammo.btRigidBody(rbInfo);

    body.MEObject = MEObject;
    this.dynamicsWorld.addRigidBody(body);
    this.rigidBodies.push(body);
    return body;
  }

  addPhysicsBox(MEObject, pOptions) {
    let Ammo = this.Ammo;
    var colShape = new Ammo.btBoxShape(new Ammo.btVector3(1, 1, 1)),
      startTransform = new Ammo.btTransform();
    startTransform.setIdentity();
    var mass = 1;
    var localInertia = new Ammo.btVector3(0, 0, 0);
    colShape.calculateLocalInertia(mass, localInertia);
    startTransform.setOrigin(new Ammo.btVector3(0, 25, -10));
    var myMotionState = new Ammo.btDefaultMotionState(startTransform),
      rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, myMotionState, colShape, localInertia),
      body = new Ammo.btRigidBody(rbInfo);
    body.setActivationState(4)
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
        // var testAxis = test.getAxis();
        // var testAngle = test.getAngle()
        // testAxis.x()
        // console.log("world axis X = " + testAxis.x());
        // console.log("world axis X = " + test.x());
        // console.log("world axis Y = " + test.y());
        // console.log("world axis Z = " + test.z());
        // console.log("world axis W = " + test.w());
        var bug = getAxisRot({x: test.x().toFixed(2), y: test.y().toFixed(2), z: test.z().toFixed(2), w: test.w().toFixed(2)})
        // console.log('bug:', bug)
        body.MEObject.rotation.x = bug[0]
        body.MEObject.rotation.y = bug[1]
        body.MEObject.rotation.z = bug[2]
        // transform.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w));
      }
    })
  }
}
