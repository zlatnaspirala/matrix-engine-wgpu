import {vec3, vec4} from "wgpu-matrix";
import {getAxisRot, quaternion_rotation_matrix, scriptManager} from "../engine/utils";

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

      // Best wat to save it like class prop
      this.Ammo = Ammo;

      this.lastUpdate = 0
      console.log("Ammo core loaded.");

      this.initPhysics();

      // this.initObjectTest()

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

    var groundShape = new Ammo.btBoxShape(new Ammo.btVector3(50, 50, 50)),
      groundTransform = new Ammo.btTransform();
    groundTransform.setIdentity();
    groundTransform.setOrigin(new Ammo.btVector3(0, -50, 0));
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

  initObjectTest() {

    var colShape = new Ammo.btSphereShape(1),
      startTransform = new Ammo.btTransform();

    startTransform.setIdentity();

    var mass = 1,
      isDynamic = (mass !== 0),
      localInertia = new Ammo.btVector3(0, 0, 0);

    if(isDynamic)
      colShape.calculateLocalInertia(mass, localInertia);

    startTransform.setOrigin(new Ammo.btVector3(2, 10, 0));

    var myMotionState = new Ammo.btDefaultMotionState(startTransform),
      rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, myMotionState, colShape, localInertia),
      body = new Ammo.btRigidBody(rbInfo);

    this.dynamicsWorld.addRigidBody(body);
    this.rigidBodies.push(body);

  }

  updatePhysics() {

    // Step world
    this.dynamicsWorld.stepSimulation(1 / 60, 10);
    // Update rigid bodies
    var trans = new Ammo.btTransform();
    this.rigidBodies.forEach(function(body) {
      if(body.getMotionState()) {
        body.getMotionState().getWorldTransform(trans);
        // console.log("world pos = " + [trans.getOrigin().x().toFixed(2), trans.getOrigin().y().toFixed(2), trans.getOrigin().z().toFixed(2)]);
        // console.log("world rot = " + trans.getRotation());
        var test = trans.getRotation();
        // var testAxis = test.getAxis();
        // var testAngle = test.getAngle()
        // testAxis.x()
        // console.log("world axis X = " + testAxis.x());
        console.log("world axis X = " + test.x());
        console.log("world axis Y = " + test.y());
        console.log("world axis Z = " + test.z());
        console.log("world axis W = " + test.w());
        var bug = getAxisRot({x: test.x(),y: test.y(),z: test.z(),w: test.w()})
        console.log('bug:', bug)
        // transform.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w));
      }
    })
  }
}
