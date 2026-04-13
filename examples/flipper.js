import MatrixEngineWGPU from "../src/world.js";
import {downloadMeshes} from "../src/engine/loader-obj.js";
import {addRaycastsAABBListener} from "../src/engine/raycast.js";
import {isMobile, randomIntFromTo} from "../src/engine/utils.js";
import {PVector} from "../src/engine/matrix-class.js";

export var flipper = function() {
  let MYFLIPPER = {
    STATUS_PUSH: 'wait'
  };

  let flipper = new MatrixEngineWGPU({
    canvasSize: 'fullscreen',
    mainCameraParams: {type: 'WASD', responseCoef: 1000},
    PHYSICS_GROUND_BYZ: 40,
    PHYSICS_GROUND_BYX: 12,
    clearColor: {r: 0, g: 1, b: 1, a: 1}
  }, () => {
    // Audios
    flipper.matrixSounds.createAudio('music', 'res/audios/rpg/music.mp3', 1);
    flipper.matrixSounds.createAudio('music2', 'res/audios/rpg/wizard-rider.mp3', 1)
    flipper.matrixSounds.createAudio('win1', 'res/audios/rpg/feel.mp3', 2);
    flipper.matrixSounds.createAudio('click1', 'res/audios/click1.mp3', 1);
    flipper.matrixSounds.audios.click1.volume = 0.8;
    flipper.matrixSounds.createAudio('hover', 'res/audios/kenney/mp3/click3.mp3', 2);
    flipper.matrixSounds.audios.music.loop = true;
    flipper.matrixSounds.play('music');

    // Lights
    const NUM_LIGHTS = isMobile() == true ? 2 : 4;
    const ORBIT_RADIUS = 12;
    const ORBIT_SPEED = 0.6;
    const TARGET = {x: 0, y: 1, z: -15};

    // Light colors cycling around the hue wheel
    const LIGHT_COLORS = [
      [2.0, 0.2, 0.2],  // red
      [2.0, 0.8, 0.1],  // orange
      [0.2, 0.2, 2.0],  // blue
      [2.0, 2.0, 0.1],  // yellow
      [0.2, 1.0, 0.2],  // green
      [0.1, 1.0, 0.6],  // teal
      [0.1, 0.6, 1.0],  // sky
      [0.6, 0.1, 1.0],  // purple
      [1.0, 0.1, 0.8],  // pink
      [1.0, 0.1, 0.4],  // rose
    ];

    for(let i = 0;i < NUM_LIGHTS;i++) {flipper.addLight()}
    for(let i = 0;i < NUM_LIGHTS;i++) {
      const light = flipper.lightContainer[i];
      const angleOffset = (i / NUM_LIGHTS) * Math.PI * 2;
      const color = LIGHT_COLORS[i];
      light.setIntensity(15);
      light.color = color;
      // Orbit height varies slightly per light for more visual interest
      const heightOffset = Math.sin(angleOffset) * 2;
      light.setPosition(
        TARGET.x + Math.cos(angleOffset) * ORBIT_RADIUS,
        4 + heightOffset,
        TARGET.z + Math.sin(angleOffset) * ORBIT_RADIUS
      );
      light.setTarget(TARGET.x, TARGET.y, TARGET.z);
      // Each light orbits at its own phase offset
      light.orbitAngle = angleOffset;
      light.updater.push((light) => {
        light.orbitAngle += ORBIT_SPEED * 0.01;
        const height = 4 + Math.sin(light.orbitAngle + angleOffset) * 2;
        const x = TARGET.x + Math.cos(light.orbitAngle) * ORBIT_RADIUS;
        const z = TARGET.z + Math.sin(light.orbitAngle) * ORBIT_RADIUS;
        light.setPosition(x, height, z);
        light.setTarget(TARGET.x, TARGET.y, TARGET.z);
      });
    }

    addEventListener('PhysicsReady', () => {
      addRaycastsAABBListener();
      downloadMeshes({
        cube: "./res/meshes/blender/cube.obj",
        ball: "./res/meshes/shapes/sphere-uv-cubeproj.obj",
        pin: "./res/meshes/blender/pin-for-pinball.obj",
        pinR: "./res/meshes/blender/pin-for-pinball_right.obj",
        pushBtn: "./res/meshes/shapes/pushBtn.obj",
        vrcLeft: "./res/meshes/blender/vrc-left.obj",
        jumper: "./res/meshes/blender/jumper-up.obj",
        bottomLeft: "./res/meshes/blender/bottom-left.obj",
        glass: "./res/meshes/shapes/plane-subdivine-16.obj",
        bigBox: "./res/meshes/shapes/flipperBigBox.obj"
      },
        onGround,
        {scale: [1, 1, 1]}
      );
      flipper.matrixPhysics.speedUpSimulation = 3;
    });

    async function onGround(m) {
      // Ball
      const ball1 = flipper.addMeshObj({
        material: {type: 'standard'},
        position: {x: 0, y: 2, z: -15},
        scale: [0.25, 0.25, 0.25],
        texturesPaths: ['./res/meshes/blender/cube.png'],
        name: 'ball1',
        mesh: m.ball,
        shadowsCast: false,
        physics: {
          enabled: true,
          mass: 5,
          geometry: "Sphere",
          group: 2,
          mask: -1
        },
        raycast: {enabled: false, radius: 1},
        pointerEffect: {
          enabled: true,
          pointer: isMobile() == true ? false : true
        }
      });
      flipper.ball1 = ball1;

      // Shooter ball
      let pushBtn = flipper.addMeshObj({
        position: {x: 5, y: 0.7, z: -5.7},
        scale: [0.3, 0.3, 0.3],
        rotation: {x: 90, y: -90, z: 0},
        texturesPaths: ['res/textures/pushBtn.webp'],
        name: 'pushBtn',
        mesh: m.pushBtn,
        physics: {
          enabled: false,
          mass: 5,
          geometry: "Cube"
        },
        raycast: {enabled: true, radius: 1}
      });

      pushBtn.setUVScale(-1, -1);

      // GROUND
      flipper.addMeshObj({
        position: {x: 0, y: -0.1, z: -21},
        scale: [6, 0.1, 15],
        texturesPaths: ['./res/icons/editor/chatgpt-gen-bg-inv.png'],
        name: 'ground',
        mesh: m.cube,
        physics: {
          enabled: false,
          mass: 0,
          geometry: "Cube"
        }
      });

      flipper.addMeshObj({
        position: {x: 0, y: 6, z: -36},
        scale: [2.95, 3, 1],
        texturesPaths: ['./res/icons/editor/chatgpt-gen-bg-inv.png'],
        name: 'bigBox',
        mesh: m.bigBox,
        physics: {
          enabled: false,
          mass: 0,
          geometry: "Cube"
        }
      });

      let envMapParams = {
        baseColorMix: 0.1,                // CLEAR SKY
        mirrorTint: [0.9, 0.95, 1.0],     // Slight cool tint
        reflectivity: 0.45,               // 25% reflection blend
        illuminateColor: [0.3, 0.7, 1.0], // Soft cyan
        illuminateStrength: 0.5,          // Gentle rim
        illuminatePulse: 0.01,            // No pulse (static)
        fresnelPower: 2.0,                // Medium-sharp edge
        envLodBias: 1.5,
        usePlanarReflection: false,       // ✅ Env map mode
      }

      let glass = flipper.addMeshObj({
        material: {type: 'mirror'},
        position: {x: 0, y: 2.1, z: -20.5},
        scale: [6, 0.05, 14.5],
        texturesPaths: ['./res/textures/default2.png', './res/icons/editor/chatgpt-gen-bg-inv.png'],
        name: 'glass',
        mesh: m.glass,
        shadowsCast: false,
        envMapParams: envMapParams,
        physics: {
          enabled: true,
          mass: 0,
          geometry: "Cube"
        }
      });
      glass.setBlend(0.1);

      // BUMPERS
      const bumperPositions = [
        {x: 0, y: 0.7, z: -22},
        {x: 2, y: 0.7, z: -24},
        {x: -2, y: 0.7, z: -26},
        {x: -2.9, y: 0.7, z: -31.5}
      ];

      bumperPositions.forEach((p, i) => {
        flipper.addMeshObj({
          material: {type: 'standard'},
          position: p,
          scale: [0.6, 0.6, 0.6],
          texturesPaths: ['./res/textures/star1.png'],
          name: 'bumper' + i,
          mesh: m.ball,
          physics: {
            enabled: true,
            mass: 0,
            geometry: "Sphere",
            group: 2,
            mask: -1 & ~1, // collide with everything EXCEPT group 1 (ground)
          },
          raycast: {enabled: true, radius: 1}
        });
      });

      // Edges
      const TEdge = flipper.addMeshObj({
        material: {type: 'standard'},
        position: {x: 0, y: 1, z: -36},
        scale: [6.2, 1, 0.5],
        texturesPaths: ['./res/textures/blankgray2.webp'],
        name: 'edgeTop',
        mesh: m.cube,
        physics: {
          enabled: true,
          mass: 0,
          geometry: "Cube",
          group: 2,
          mask: -1 & ~1, // collide with everything EXCEPT group 1 (ground)
        }
      });

      // Inside flipper
      const topCurveInLeft = flipper.addMeshObj({
        material: {type: 'standard'},
        position: {x: 4.5, y: 0.9, z: -36},
        scale: [1, 0.8, 1],
        texturesPaths: ['./res/textures/blankgray2.webp'],
        name: 'vrc-left',
        mesh: m.vrcLeft,
        physics: {
          enabled: true,
          mass: 0,
          geometry: "ConvexHull",
          vertices: m.vrcLeft.vertices
        }
      });

      const jumper1 = flipper.addMeshObj({
        material: {type: 'standard'},
        position: {x: -4.8, y: 0.4, z: -29.3},
        scale: [1, 1, 1],
        texturesPaths: ['./res/textures/blankgray2.webp'],
        name: 'jumper1',
        mesh: m.jumper,
        physics: {
          enabled: true,
          mass: 0,
          geometry: "ConvexHull",
          vertices: m.jumper.vertices,
          group: 2,
          mask: -1 & ~1, // collide with everything EXCEPT group 1 (ground)
        }
      });

      const bottomLeft = flipper.addMeshObj({
        material: {type: 'standard'},
        position: {x: -3.5, y: 0.3, z: -10},
        scale: [1, 1.2, 1],
        texturesPaths: ['./res/textures/blankgray2.webp'],
        name: 'bottomLeft',
        mesh: m.bottomLeft,
        physics: {
          enabled: true,
          mass: 0,
          geometry: "ConvexHull",
          vertices: m.bottomLeft.vertices
        }
      });

      const bottomRight = flipper.addMeshObj({
        material: {type: 'standard'},
        position: {x: 3.5, y: 0.3, z: -10},
        rotation: {x: 0, y: 0, z: 0},
        scale: [-1, 1.2, 1],
        texturesPaths: ['./res/textures/blankgray2.webp'],
        name: 'bottomRight',
        mesh: m.bottomLeft,
        physics: {
          enabled: true,
          mass: 0,
          geometry: "ConvexHull",
          vertices: m.bottomLeft.vertices
        }
      });

      const BEdge = flipper.addMeshObj({
        material: {type: 'standard'},
        position: {x: 0, y: 1, z: -6},
        rotation: {x: 0, y: 0, z: 0},
        scale: [6, 1.02, 0.2],
        texturesPaths: ['./res/textures/blankgray2.webp'],
        name: 'bottomEdge',
        mesh: m.cube,
        physics: {
          enabled: true,
          mass: 0,
          geometry: "Cube",
          group: 2,
          mask: -1 & ~1, // collide with everything EXCEPT group 1 (ground)
        }
      });

      const BEdgeYAngle = flipper.addMeshObj({
        material: {type: 'standard'},
        position: {x: -0.5, y: 0.5, z: -6.5},
        rotation: {x: 0, y: -1.9, z: 0},
        scale: [4.5, 0.4, 0.1],
        texturesPaths: ['./res/textures/blankgray2.webp'],
        name: 'bottomEdge2',
        mesh: m.cube,
        physics: {
          enabled: true,
          mass: 0,
          geometry: "Cube",
          group: 1,
          mask: -1 & ~1, // collide with everything EXCEPT group 1 (ground)
        }
      });

      const REdge = flipper.addMeshObj({
        material: {type: 'standard'},
        position: {x: 5.8, y: 1, z: -21},
        scale: [0.2, 1, 15],
        texturesPaths: ['./res/textures/blankgray.webp', './res/icons/editor/chatgpt-gen-bg-inv.png'],
        name: 'edgeRigth',
        mesh: m.cube,
        physics: {
          enabled: true,
          mass: 0,
          geometry: "Cube"
        }
      });

      const REdge2 = flipper.addMeshObj({
        material: {type: 'standard'},
        position: {x: 4.5, y: 1, z: -19.5},
        scale: [0.05, 1, 12.5],
        texturesPaths: ['./res/textures/cube-test.png', './res/icons/editor/chatgpt-gen-bg-inv.png'],
        name: 'edgeRigth2',
        mesh: m.cube,
        physics: {
          enabled: true,
          mass: 0,
          geometry: "Cube"
        }
      });

      const LEdge = flipper.addMeshObj({
        material: {type: 'standard'},
        position: {x: -5.7, y: 1, z: -21},
        scale: [0.3, 1, 15],
        texturesPaths: ['./res/textures/blankgray.webp', './res/icons/editor/chatgpt-gen-bg-inv.png'],
        name: 'edgeLeft',
        mesh: m.cube,
        physics: {
          enabled: true,
          mass: 0,
          geometry: "Cube"
        }
      });

      const checker2 = REdge.createCheckerboardTexture(256, 128, [0, 50, 50, 255], [20, 200, 200, 255]);
      let samplerTest = flipper.device.createSampler({
        magFilter: 'nearest',
        minFilter: 'nearest',
        addressModeU: 'repeat',
        addressModeV: 'repeat',
      });

      setTimeout(async () => {
        const leftBody = flipper.matrixPhysics.getBodyByName('flipperLeft');
        const rightBody = flipper.matrixPhysics.getBodyByName('flipperRight');

        flipper.matrixPhysics.setActivationState(leftBody, 4);
        flipper.matrixPhysics.activate(leftBody, true);
        flipper.matrixPhysics.setActivationState(rightBody, 4);
        flipper.matrixPhysics.activate(rightBody, true);
        flipper.matrixPhysics.setDamping(leftBody, 0.95, 0.95);
        flipper.matrixPhysics.setDamping(rightBody, 0.95, 0.95);
        flipper.matrixPhysics.setRestitution(leftBody, 0.1);
        flipper.matrixPhysics.setRestitution(rightBody, 0.1);
        flipper.matrixPhysics.setFriction(leftBody, 1.5);
        flipper.matrixPhysics.setFriction(rightBody, 1.5);

        let getLA = flipper.matrixPhysics.getBodyByName('flipperLeftAnchor');
        flipper.matrixPhysics.shootBody(getLA, 0, 0, 0, 0, 0, 0);
        let getRA = flipper.matrixPhysics.getBodyByName('flipperRightAnchor');
        flipper.matrixPhysics.shootBody(getRA, 0, 0, 0, 0, 0, 0);

        // BALL PHYSICS TUNING
        const ball = flipper.matrixPhysics.getBodyByName('ball1');
        // flipper.matrixPhysics.setRestitution(ball, 0.9);
        flipper.matrixPhysics.setFriction(ball, 0.2);
        // flipper.matrixPhysics.setDamping(ball, 0.05, 0.05);

        // FLIPPER SETUP
        const commonX = 1;
        const BA = flipper.matrixPhysics.getBodyByName('flipperLeft');
        const BB = flipper.matrixPhysics.getBodyByName('flipperLeftAnchor');

        const hingeLeft = app.matrixPhysics.addHingeConstraint(BA, BB, {
          name: "flipperLeftHinge",
          pivotA: [-commonX, 0, 0],
          pivotB: [0, 0, 0],
          axis: [0, 1, 0],
          limits: [-0.8, 0.5]
        });
        let hingeLeftID = 0;
        let hingeRightID = 0;
        hingeLeft.then((idx) => {
          console.log('Hinge index (its is not regular rigidbody idx)', idx)
          hingeLeftID = idx;
          app.matrixPhysics.setHingeLimit(idx, -0.8, 0.5, 0.0, 0.5, 1.0);
          app.matrixPhysics.enableAngularMotor(idx, true, 10, 500);
        })

        const BA1 = flipper.matrixPhysics.getBodyByName('flipperRight');
        const BB1 = flipper.matrixPhysics.getBodyByName('flipperRightAnchor');

        const hingeRight = app.matrixPhysics.addHingeConstraint(BA1, BB1, {
          name: "flipperRightHinge",
          pivotA: [commonX, 0, 0],
          pivotB: [0, 0, 0],
          axis: [0, 1, 0],
          limits: [-0.8, 0.5]
        });
        hingeRight.then((idx) => {
          hingeRightID = idx;
          app.matrixPhysics.setHingeLimit(idx, -0.8, 0.5, 0.0, 0.5, 1.0);
          app.matrixPhysics.enableAngularMotor(idx, true, -25, 500);
        })

        REdge.setUVScale(1, 1);
        // LEdge.changeTexture(checker2, samplerTest)
        LEdge.setUVScale(1, 1);
        REdge2.setUVScale(1, 1);

        let leftBodycurrPos = 'unpressed';
        window.addEventListener("keydown", (e) => {
          e.preventDefault();
          if(e.code === "KeyZ" && leftBodycurrPos == 'unpressed') {
            leftBodycurrPos = 'pressed';
            flipper.matrixPhysics.activate(leftBody, true);
            flipper.matrixPhysics.setActivationState(leftBody, 4);
            flipper.matrixPhysics.enableAngularMotor(hingeLeftID, true, -25, 500);
          }
          if(e.code === "KeyM") {
            console.log('SENT KEY ', rightBody)
            flipper.matrixPhysics.activate(rightBody, true);
            flipper.matrixPhysics.setActivationState(rightBody, 4);
            flipper.matrixPhysics.enableAngularMotor(hingeRightID, true, 10, 500);
          }
        });

        window.addEventListener("keyup", (e) => {
          if(e.code === "KeyZ") {
            leftBodycurrPos = 'unpressed';
            flipper.matrixPhysics.enableAngularMotor(hingeLeftID, true, 10, 500);
          }
          if(e.code === "KeyM") {
            flipper.matrixPhysics.enableAngularMotor(hingeRightID, true, -25, 500);
          }
          if(e.code == "Space") {
            if(MYFLIPPER.STATUS_PUSH == 'free') {
              MYFLIPPER.STATUS_PUSH = 'in action';
              let ball = app.matrixPhysics.getBodyByName(ball1.name);
              flipper.matrixPhysics.applyImpulse(ball, new PVector(0, 0.2, -randomIntFromTo(10, 20)));
            }
          }
        });

      }, 500);

      const commonAchorX = 2.2;
      const commomBODYX = 0.8;

      const LAnchor = flipper.addMeshObj({
        position: {x: -commonAchorX, y: 0.3, z: -9.25},
        scale: [0.2, 0.2, 0.2],
        mesh: m.cube,
        physics: {
          enabled: true,
          mass: 0,
          geometry: "Cube",
          // state: 4,
          group: 2,
          mask: 1 // collide with world, NOT flipper
        },
        name: "flipperLeftAnchor"
      });

      const RAnchor = flipper.addMeshObj({
        position: {x: commonAchorX, y: 0.3, z: -9.25},
        scale: [0.2, 0.2, 0.2],
        mesh: m.cube,
        physics: {
          enabled: true,
          mass: 0,
          geometry: "Cube",
          // state: 4,
          // collide: undefined,
          group: 2,
          mask: 1 // collide with world, NOT flipper
        },
        name: "flipperRightAnchor"
      });

      flipper.addMeshObj({
        material: {type: 'standard'},
        position: {x: -commomBODYX, y: 0.3, z: -9},
        scale: [0.85, 0.1, 0.3],
        texturesPaths: ['./res/textures/blankgray.webp'],
        name: 'flipperLeft',
        mesh: m.pin,
        physics: {
          enabled: true,
          mass: 0.5,
          geometry: "ConvexHull",
          vertices: m.pin.vertices,
          group: 1,
          mask: -1 // everything
        }
      });

      flipper.addMeshObj({
        material: {type: 'standard'},
        position: {x: commomBODYX, y: 0.3, z: -9},
        scale: [0.85, 0.1, 0.3],
        texturesPaths: ['./res/textures/blankgray.webp'],
        name: 'flipperRight',
        mesh: m.pinR,
        physics: {
          enabled: true,
          mass: 0.5,
          geometry: "ConvexHull",
          vertices: m.pinR.vertices,
          group: 1,
          mask: -1 // everything
        }
      });


      flipper.canvas.addEventListener("ray.hit.event", (e) => {
        app.matrixSounds.play('click1');
        console.log('e.detail', e.detail);
        if(e.detail.hitObject.name == "pushBtn" && MYFLIPPER.STATUS_PUSH == 'free') {
          console.log('e.detail pushBtn123 ', e.detail);
          MYFLIPPER.STATUS_PUSH = 'in action';
          let ball = app.matrixPhysics.getBodyByName(ball1.name);
          // const impulse = new Ammo.btVector3(0, 0.2, -randomIntFromTo(10, 20));
          // ball.applyCentralImpulse(impulse);
          flipper.matrixPhysics.applyImpulse(ball, new PVector(0, 0.2, -randomIntFromTo(10, 20)));

        }
      });

      const ball = app.matrixPhysics.getBodyByName('ball1');
      const strength = 1;
      document.addEventListener("pCollision", (e) => {
        console.log('pCollision::', e);
        const body0Name = e.detail.body0Name;
        const body1Name = e.detail.body1Name;
        const rayDirection = e.detail.rayDirection;
        // console.log('collision : ', body1Name)
        if(body1Name.startsWith("bumper")) {
          // const bumperBody = app.matrixPhysics.getBodyByName(body1Name);
          if(ball != -1) {
            flipper.matrixPhysics.applyImpulse(ball, new PVector(
              rayDirection[0] * strength,
              Math.abs(rayDirection[1]) * strength + 8,
              rayDirection[2] * strength
            ));
          }
        } else if(body1Name.startsWith("edgeRigth") && MYFLIPPER.STATUS_PUSH == 'wait') {
          MYFLIPPER.STATUS_PUSH = 'free';
        } else if(body1Name.startsWith('bottomEdge2')) {
          console.log('collision XXMYFLIPPER.STATUS_PUSH freeX : ', MYFLIPPER.STATUS_PUSH)
          setTimeout(() => {
            MYFLIPPER.STATUS_PUSH = 'free';
          }, 3000);
        }
      });

      // GRAVITY TILT (PINBALL FEEL)
      flipper.matrixPhysics.setGravity(0, -9.8, 1.5);

      // only render objs
      const leg1 = flipper.addMeshObj({
        material: {type: 'standard'},
        position: {x: -5.5, y: -5, z: -6.1},
        scale: [0.2, 7, 0.2],
        texturesPaths: ['./res/textures/blankgray2.webp'],
        name: 'leg1',
        mesh: m.cube,
        shadowsCast: false,
        physics: {
          enabled: false,
          mass: 0,
          geometry: "Cube"
        }
      });

      const leg2 = flipper.addMeshObj({
        material: {type: 'standard'},
        position: {x: 5.5, y: -5, z: -6.1},
        scale: [0.2, 7, 0.2],
        texturesPaths: ['./res/textures/blankgray2.webp'],
        name: 'leg2',
        mesh: m.cube,
        shadowsCast: false,
        physics: {
          enabled: false,
          mass: 0,
          geometry: "Cube"
        }
      });

      const leg3 = flipper.addMeshObj({
        material: {type: 'standard'},
        position: {x: -5.5, y: -5, z: -36},
        scale: [0.2, 7, 0.2],
        texturesPaths: ['./res/textures/blankgray2.webp'],
        name: 'leg3',
        mesh: m.cube,
        shadowsCast: false,
        physics: {
          enabled: false,
          mass: 0,
          geometry: "Cube"
        }
      });

      const leg4 = flipper.addMeshObj({
        material: {type: 'standard'},
        position: {x: 5.5, y: -5, z: -36},
        scale: [0.2, 7, 0.2],
        texturesPaths: ['./res/textures/blankgray2.webp'],
        name: 'leg4',
        mesh: m.cube,
        shadowsCast: false,
        physics: {
          enabled: false,
          mass: 0,
          geometry: "Cube"
        }
      });
      // ball1.effects.pointer.yOffset = 3;
      setTimeout(() => {
        app.activateBloomEffect();
        app.cameras.WASD.setYaw(-0.03);
        app.cameras.WASD.setPitch(-0.49);
        app.cameras.WASD.setZ(0);
        app.cameras.WASD.setY(10);
        app.cameras.WASD._dirtyAngle = true;
      }, 500)
    }

  });
  window.app = flipper;
};