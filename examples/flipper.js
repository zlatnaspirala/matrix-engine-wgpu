import MatrixEngineWGPU from "../src/world.js";
import {downloadMeshes} from "../src/engine/loader-obj.js";
import {addRaycastsAABBListener} from "../src/engine/raycast.js";
import {physicsBodiesGenerator} from "../src/engine/generators/generator.js";

export var flipper = function() {
  let flipper = new MatrixEngineWGPU({
    canvasSize: 'fullscreen',
    mainCameraParams: {type: 'WASD', responseCoef: 1000},
    PHYSICS_GROUND_BYZ: 35,
    PHYSICS_GROUND_BYX: 5,
    clearColor: {r: 0, g: 1, b: 1, a: 1}
  }, () => {

    addEventListener('AmmoReady', () => {
      flipper.addLight();
      addRaycastsAABBListener();

      downloadMeshes({cube: "./res/meshes/blender/cube.obj", ball: "./res/meshes/shapes/sphere.obj"},
        onGround,
        {scale: [1, 1, 1]}
      );
      flipper.matrixAmmo.speedUpSimulation = 4;
    });

    function onGround(m) {
      // app.physicsBodiesGenerator("standard", {x : 0 , y: 0, z: -30} ,
      //    {x : 0 , y: 0, z: 0}, "./res/meshes/blender/cube.png" ,
      //     "nameaaaaa", "Cube", false, [1,1,1], 100, 1000);

      setTimeout(() => {
        app.cameras.WASD.yaw = -0.03;
        app.cameras.WASD.pitch = -0.49;
        app.cameras.WASD.position[2] = 0;
        app.cameras.WASD.position[1] = 3.76;
      }, 1000);

      // ball
      flipper.addMeshObj({
        material: {type: 'standard'},
        position: {x: 0, y: 32, z: -32},
        scale: [0.5, 0.5, 0.5],
        texturesPaths: ['./res/meshes/blender/cube.png'],
        name: 'ball1',
        mesh: m.ball,
        physics: {
          enabled: true,
          mass: 1,
          geometry: "Sphere"
        },
        raycast: {enabled: true, radius: 1}
      });

      // GROUND
      flipper.addMeshObj({
        position: {x: 0, y: 0, z: -21},
        scale: [6, 0.1, 15],
        texturesPaths: ['res/textures/cube-g1.webp'],
        name: 'ground',
        mesh: m.cube,
        physics: {
          enabled: false,
          mass: 0,
          geometry: "Cube"
        }
      });

      const LAnchor = flipper.addMeshObj({
        position: {x: -5, y: 0.5, z: -9},
        scale: [0.02, 0.02, 0.02],
        mesh: m.cube,
        physics: {
          enabled: true,
          mass: 0,
          geometry: "Cube",
          state: 4
        },
        name: "flipperLeftAnchor"
      });

      const RAnchor = flipper.addMeshObj({
        position: {x: 5, y: 0.5, z: -9},
        scale: [0.02, 0.02, 0.02],
        mesh: m.cube,
        physics: {
          enabled: true,
          mass: 0,
          geometry: "Cube",
          state: 4
        },
        name: "flipperRightAnchor"
      });

      let getLA = flipper.matrixAmmo.getBodyByName('flipperLeftAnchor');
      getLA.setLinearFactor(new Ammo.btVector3(0, 0, 0));
      getLA.setAngularFactor(new Ammo.btVector3(0, 0, 0));

      let getRA = flipper.matrixAmmo.getBodyByName('flipperRightAnchor');
      getRA.setLinearFactor(new Ammo.btVector3(0, 0, 0));
      getRA.setAngularFactor(new Ammo.btVector3(0, 0, 0));

      const L = flipper.addMeshObj({
        material: {type: 'standard'},
        position: {x: -5, y: 0.5, z: -9},
        scale: [2, 0.3, 0.5],
        texturesPaths: ['./res/meshes/blender/cube.png'],
        name: 'flipperLeft',
        mesh: m.cube,
        physics: {
          enabled: true,
          mass: 2,
          geometry: "Cube"
        }
      });

      const R = flipper.addMeshObj({
        material: {type: 'standard'},
        position: {x: 4, y: 0.5, z: -9},
        scale: [2, 0.3, 0.5],
        texturesPaths: ['./res/meshes/blender/cube.png'],
        name: 'flipperRigth',
        mesh: m.cube,
        physics: {
          enabled: true,
          mass: 2,
          geometry: "Cube"
        }
      });

      const leftBody = flipper.matrixAmmo.getBodyByName('flipperLeft');
      const rightBody = flipper.matrixAmmo.getBodyByName('flipperRigth');
      if(leftBody) {
        leftBody.setActivationState(4);
        leftBody.activate(true);
      }
      if(rightBody) {
        rightBody.setActivationState(4);
        rightBody.activate(true);
      }

      // BUMPERS
      const bumperPositions = [
        {x: 0, y: 0.5, z: -12},
        {x: 2, y: 0.5, z: -14},
        {x: -2, y: 0.5, z: -16}
      ];

      bumperPositions.forEach((p, i) => {
        flipper.addMeshObj({
          material: {type: 'standard'},
          position: p,
          scale: [0.7, 0.7, 0.7],
          texturesPaths: ['./res/meshes/blender/cube.png'],
          name: 'bumper' + i,
          mesh: m.ball,
          physics: {
            enabled: true,
            mass: 0,
            geometry: "Sphere"
          },
          raycast: {enabled: true, radius: 1}
        });
      });



      flipper.canvas.addEventListener("ray.hit.event", (e) => {
        //
      });

      document.addEventListener("pCollision", (e) => {
        console.log('pCollision::', e);
        const body0Name = e.detail.body0Name;
        const body1Name = e.detail.body1Name;
        const rayDirection = e.detail.rayDirection;
        if(body1Name.startsWith("bumper")) {
          const ball = app.matrixAmmo.getBodyByName('ball1');
          const bumperBody = app.matrixAmmo.getBodyByName(body1Name);
          if(ball && bumperBody) {
            const strength = 25;
            const impulse = new Ammo.btVector3(
              rayDirection[0] * strength,
              Math.abs(rayDirection[1]) * strength + 8,
              rayDirection[2] * strength
            );
            ball.activate(true);
            ball.applyCentralImpulse(impulse);
          }
        }

      })

      // GRAVITY TILT (PINBALL FEEL)
      flipper.matrixAmmo.dynamicsWorld.setGravity(
        new Ammo.btVector3(0, -9.8, 0)
      );

      // BALL PHYSICS TUNING
      const ball = flipper.matrixAmmo.getBodyByName('ball1');
      if(ball) {
        ball.setRestitution(0.9);
        ball.setFriction(0.2);
        ball.setRollingFriction(0.05);
        ball.setDamping(0.05, 0.05);
      }

      // FLIPPER SETUP
      const hingeLeft = app.matrixAmmo.addHingeConstraint(L, LAnchor, {
        name: "flipperLeftHinge",
        pivotA: [-2, 0, 0],
        pivotB: [0, 0, 0],
        axis: [0, 1, 0],
        limits: [-0.8, 0.5]
      });

      const hingeRight = app.matrixAmmo.addHingeConstraint(R, RAnchor, {
        name: "flipperRightHinge",
        pivotA: [0, 0, 0],
        pivotB: [0, 0, 0],
        axis: [0, 1, 0],
        limits: [-0.8, 0.5]
      });

      let leftBodycurrPos = 'unpressed';
      window.addEventListener("keydown", (e) => {
        e.preventDefault();
        if(e.code === "KeyZ" && leftBodycurrPos == 'unpressed') {
          console.log('left presseed')
          leftBodycurrPos = 'pressed';
          const leftBody = flipper.matrixAmmo.getBodyByName('flipperLeft');
          leftBody.activate(true);
          leftBody.setActivationState(4);
          hingeLeft.enableAngularMotor(true, -25, 200);
        }
        if(e.code === "KeyM") {
          console.log('right presseed')
          const rightBody = flipper.matrixAmmo.getBodyByName('flipperRigth');
          rightBody.activate(true);
          rightBody.setActivationState(4);
          hingeRight.enableAngularMotor(true, 25, 200);
        }
      });

      hingeLeft.enableAngularMotor(true, 10, 50);
      window.addEventListener("keyup", (e) => {
        if(e.code === "KeyZ") {
          leftBodycurrPos = 'unpressed';
          // const leftBody = flipper.matrixAmmo.getBodyByName('flipperLeft');
          // leftBody.activate(true);
          // leftBody.setActivationState(4);
          hingeLeft.enableAngularMotor(true, 10, 50);
        }
        if(e.code === "KeyM") {
          // const rightBody = flipper.matrixAmmo.getBodyByName('flipperRigth');
          // rightBody.activate(true);
          // rightBody.setActivationState(4);
          hingeRight.enableAngularMotor(true, -10, 50);
        }
      });
    }

  });

  window.app = flipper;
};