import MatrixEngineWGPU from "../src/world.js";
import {downloadMeshes} from '../src/engine/loader-obj.js';
import {LOG_FUNNY, LOG_INFO, LOG_MATRIX} from "../src/engine/utils.js";
import {addRaycastsListener} from "../src/engine/raycast.js";

export var physicsPlayground = function() {
  let physicsPlayground = new MatrixEngineWGPU({
    useSingleRenderPass: true,
    canvasSize: 'fullscreen',
    mainCameraParams: {
      type: 'WASD',
      responseCoef: 1000
    },
    clearColor: {r: 0, b: 0.122, g: 0.122, a: 1}
  }, () => {

    addRaycastsListener();

    addEventListener('AmmoReady', () => {
      // downloadMeshes({
      //   ball: "./res/meshes/blender/sphere.obj",
      //   cube: "./res/meshes/blender/cube.obj",
      // }, onLoadObj,
      //   {scale: [1, 1, 1]})
      downloadMeshes({
        cube: "./res/meshes/blender/cube.obj",
      }, onGround,
        {scale: [20, 0.01, 20]})

      // physicsPlayground.physicsBodiesGenerator(
      //   "standard",
      //   {x: 0, y: 0, z: -20},
      //   {x: 0, y: 0, z: 0},
      //   "res/textures/star1.png",
      //   "testGen",
      //   "Cube",
      //   false,
      //   [1, 1, 1],
      //   100
      // );

      // physicsPlayground.physicsBodiesGeneratorWall(
      //   "standard",
      //   {x: -10, y: 1, z: -20},
      //   {x: 0, y: 0, z: 0},
      //   "res/textures/star1.png",
      //   "cube",
      //   "10x3",
      //   true,
      //   [1, 1, 1],
      //   2,
      //   100
      // );

      // physicsPlayground.physicsBodiesGeneratorPyramid(
      //   "standard",
      //   {x: 0, y: 1, z: -20},
      //   {x: 0, y: 0, z: 0},
      //   "./res/meshes/blender/cube.png",
      //   "pyr",
      //   6,
      //   true,
      //   [1, 1, 1],
      //   2
      // );

      // 
      app.physicsBodiesGeneratorWall(
        "mirror",
        {x: -4.5, y: 0, z: -10},
        {x: 0, y: 0, z: 0},
        ["./res/textures/rust.jpg", "./res/textures/env-maps/sky1.webp"],
        'my_set_walls', "5x5", true, [1, 1, 1], 2, 70);

      let strength = 10;
      app.canvas.addEventListener("ray.hit.event", (e) => {
        console.log('ray.hit.event detected');
        let b = app.matrixAmmo.getBodyByName(e.detail.hitObject.name);
        const i = new Ammo.btVector3(
          e.detail.rayDirection[0] * strength,
          e.detail.rayDirection[1] * strength,
          e.detail.rayDirection[2] * strength
        );
        b.applyCentralImpulse(i);
      });

      // physicsPlayground.physicsBodiesGeneratorTower(
      //   "standard",
      //   {x: 0, y: 0, z: -20},
      //   {x: 0, y: 0, z: 0},
      //   "./res/meshes/blender/cube.png",
      //   "tower",
      //   10,
      //   true,
      //   [1, 1, 1],
      //   2
      // );

    })

    function onGround(m) {
      setTimeout(() => {
        app.cameras.WASD.yaw = -0.03;
        app.cameras.WASD.pitch = -0.49;
        app.cameras.WASD.position[2] = 0;
        app.cameras.WASD.position[1] = 3.76;
      }, 1000);
      physicsPlayground.addMeshObj({
        position: {x: 0, y: -3.5, z: -10},
        rotation: {x: 0, y: 0, z: 0},
        rotationSpeed: {x: 0, y: 0, z: 0},
        texturesPaths: ['res/icons/editor/chatgpt-gen-bg-inv.png'],
        name: 'ground',
        mesh: m.cube,
        physics: {
          enabled: false,
          mass: 0,
          geometry: "Cube"
        },
        // raycast: { enabled: true , radius: 2 }
      });

      physicsPlayground.addLight();
      physicsPlayground.lightContainer[0].behavior.setOsc0(-1, 1, 0.001)
      physicsPlayground.lightContainer[0].behavior.value_ = -1;
      physicsPlayground.lightContainer[0].updater.push((light) => {
        light.position[0] = light.behavior.setPath0()
      })
      physicsPlayground.lightContainer[0].position[1] = 14;
    }

    function onLoadObj(m) {
      physicsPlayground.myLoadedMeshes = m;
      physicsPlayground.addMeshObj({
        material: {type: 'standard'},
        position: {x: 0, y: 2, z: -20},
        rotation: {x: 0, y: 0, z: 0},
        rotationSpeed: {x: 0, y: 0, z: 0},
        texturesPaths: ['./res/meshes/blender/cube.png'],
        name: 'cube1',
        mesh: m.cube,
        physics: {
          enabled: true,
          geometry: "Cube",
        },
        raycast: {enabled: true, radius: 1}
      })

      physicsPlayground.addMeshObj({
        material: {type: 'standard'},
        position: {x: 0, y: 2, z: -20},
        rotation: {x: 0, y: 0, z: 0},
        rotationSpeed: {x: 0, y: 0, z: 0},
        texturesPaths: ['./res/meshes/blender/cube.png'],
        name: 'cube2',
        mesh: m.cube,
        physics: {
          enabled: false,
          geometry: "Cube",
        },
        raycast: {enabled: true, radius: 1}
      })

      physicsPlayground.addMeshObj({
        material: {type: 'standard'},
        position: {x: 0, y: -1, z: -20},
        rotation: {x: 0, y: 0, z: 0},
        rotationSpeed: {x: 0, y: 111, z: 0},
        texturesPaths: ['./res/meshes/blender/cube.png'],
        name: 'ball1',
        mesh: m.ball,
        physics: {
          enabled: true,
          geometry: "Sphere"
        },
        raycast: {enabled: true, radius: 1}
      })

      var TEST = physicsPlayground.getSceneObjectByName('cube1');
      console.log(`%c Test access scene ${TEST} object.`, LOG_MATRIX);

      let mybodycube = app.matrixAmmo.getBodyByName('cube1');
      let mybodycube2 = app.matrixAmmo.getBodyByName('cube2');

      // const pivotA = new Ammo.btVector3(0, 0, 0); // door local pivot
      // const pivotB = new Ammo.btVector3(0, 0, 0); // frame local pivot

      // const axisA = new Ammo.btVector3(0, 1, 0); // Y axis
      // const axisB = new Ammo.btVector3(0, 1, 0);

      // const hinge = new Ammo.btHingeConstraint(
      //   mybodycube,
      //   mybodycube2,
      //   pivotA,
      //   pivotB,
      //   axisA,
      //   axisB,
      //   true
      // );

      // hinge.setLimit(-Math.PI / 2, Math.PI / 2); // 90° open
      // physicsPlayground.matrixAmmo.dynamicsWorld.addConstraint(hinge, true);
      //  app.matrixAmmo.getBodyByName(`CubePhysics${x}`).setAngularVelocity(new Ammo.btVector3(
      //      randomFloatFromTo(3, 12), 9, 9
      // ))

      physicsPlayground.canvas.addEventListener("ray.hit.event", (e) => {
        console.log('ray.hit.event detected', e.detail);
        const body = app.matrixAmmo.getBodyByName(e.detail.hitObject.name);

        // ------------------------------------------------------
        // body.setAngularVelocity(new Ammo.btVector3(0, 9, 9));
        // ------------------------------------------------------

        // ------------------------------------------------------
        const impulse = new Ammo.btVector3(0, 5, 0);
        body.applyCentralImpulse(impulse);
        // ------------------------------------------------------


        // ------------------------------------------------------
        // const torque = new Ammo.btVector3(0, 10, 0);
        // body.applyTorqueImpulse(torque);
        // ------------------------------------------------------

        // ------------------------------------------------------
        // const dir = e.detail.rayDirection;
        // const strength = 20;

        // const impulse = new Ammo.btVector3(
        //   dir[0] * strength,
        //   dir[1] * strength,
        //   dir[2] * strength
        // );

        // body.applyCentralImpulse(impulse);
        // // ------------------------------------------------------

        // // ------------------------------------------------------
        // body.activate(true);
        // ------------------------------------------------------

        //
        // PhysicsMaterials = {
        //   metal: {friction: 0.4, restitution: 0.1},
        //   rubber: {friction: 1.0, restitution: 0.9},
        //   ice: {friction: 0.01, restitution: 0.0}
        // };
        // body.setFriction(mat.friction);
        // body.setRestitution(mat.restitution);

        // explode(position, radius, strength) {
        //   for(const body of this.bodies) {
        //     const p = body.getWorldTransform().getOrigin();
        //     const dx = p.x() - position[0];
        //     const dy = p.y() - position[1];
        //     const dz = p.z() - position[2];

        //     const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        //     if(dist > radius) continue;

        //     const force = strength / (dist + 0.1);
        //     body.activate(true);
        //     body.applyCentralImpulse(
        //       new Ammo.btVector3(dx * force, dy * force, dz * force)
        //     );
        //   }
        // }

      });


    }
  })
  // just for dev
  window.app = physicsPlayground;
}