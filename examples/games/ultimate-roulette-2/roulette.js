import MatrixEngineWGPU from "../../../src/world.js";
import {downloadMeshes} from "../../../src/engine/loader-obj.js";
import {addRaycastsAABBListener} from "../../../src/engine/raycast.js";
import {byId, CameraPath, isMobile, mb, randomFloatFromTo, randomIntFromTo} from "../../../src/engine/utils.js";
import {PVector} from "../../../src/engine/matrix-class.js";
import {MobileDOM} from "../../../src/engine/cameras.js";

export var loadRoulette = function() {

  let MYFLIPPER = {
    BALANCE: 10000,
    BALLS: 1,
    STATUS_PUSH: 'wait'
  };

  let roulette = new MatrixEngineWGPU({
    fastRender: 0.7,
    useJolt: true,
    canvasSize: 'fullscreen',
    // mainCameraParams: {type: 'cinematicCamera', responseCoef: 1000},
    mainCameraParams: {type: 'WASD', responseCoef: 1000},
    PHYSICS_GROUND_BYZ: 40,
    PHYSICS_GROUND_BYX: 12,
    MAX_SPOTLIGHTS: isMobile() ? 2 : 4,
    MAX_BONES: 0,
    clearColor: {r: 0, g: 1, b: 1, a: 1}
  }, () => {

    // Audios
    roulette.matrixSounds.createAudio('music', 'res/audios/hyperball_pursuit.mp3', 1);
    roulette.matrixSounds.createAudio('push', 'res/audios/push.mp3', 1);
    roulette.matrixSounds.createAudio('click1', './res/audios/kenney/mp3/click1.mp3', 4);
    roulette.matrixSounds.createAudio('click3', './res/audios/kenney/mp3/click3.mp3', 4);
    roulette.matrixSounds.audios.music.volume = 0.25;
    roulette.matrixSounds.audios.music.loop = true;
    roulette.matrixSounds.audios.push.volume = 1;
    roulette.matrixSounds.audios.click1.volume = 1;
    roulette.matrixSounds.audios.click3.volume = 1;
    roulette.matrixSounds.play('music');

    addEventListener('PhysicsReady', () => {
      addRaycastsAABBListener();
      roulette.matrixPhysics.speedUpSimulation(isMobile() === true ? 4 : 3);
      downloadMeshes({
        cube: "./res/meshes/blender/cube.obj",
        ball: "./res/meshes/blender/sphepe-mob.obj",
        plane: "./res/meshes/blender/plane.obj",
        table: './res/meshes/blender/roulette-static-1.obj',
        oval: './res/meshes/blender/roulette-static-2.obj',
        tableNumbers:  './res/meshes/blender/roulette-static-3.obj',
      },
        onGround, {scale: [1, 1, 1]});
    });

    if(isMobile() && byId('mobileControls')) byId('mobileControls').style.marginRight = '30%';

    let preventSpam = false;
    MobileDOM.addButton("ROLL", async () => {
      if(preventSpam === false) {
        preventSpam = true;
        let ball = app.matrixPhysics.getBodyByName('ball1');
        const pos = await app.matrixPhysics.getPosition(ball);
        if(MYFLIPPER.BALLS == 0) {
          mb.show('No more balls...');
          return;
        }
        // micro opti needed!
        roulette.matrixPhysics.applyImpulse(ball,
          new PVector(0, 0.2, -randomIntFromTo(0.8, 1.2)));
        roulette.matrixSounds.play('push');
      }
    }, () => {}, {left: '80', bottom: '50'});

    // Lights
    const NUM_LIGHTS = isMobile() == true ? 2 : 4;
    const ORBIT_RADIUS = 8;
    const ORBIT_SPEED = 0.7;
    const TARGET = {x: 0, y: 0, z: -17};

    // Light colors cycling around the hue wheel
    const LIGHT_COLORS = [
      [2.5, 0.2, 0.2],  // red
      [2.5, 0.8, 0.1],  // orange
      [0.2, 0.2, 3.0],  // blue
      [2.0, 3.0, 0.1],  // yellow
    ];

    for(let i = 0;i < NUM_LIGHTS;i++) {roulette.addLight()}
    for(let i = 0;i < NUM_LIGHTS;i++) {
      const light = roulette.lightContainer[i];
      const angleOffset = (i / NUM_LIGHTS) * Math.PI * 2;
      const color = LIGHT_COLORS[i];
      light.setIntensity(16);
      light.color = color;
      const heightOffset = Math.sin(angleOffset) * 5;
      light.setPosition(
        TARGET.x + Math.cos(angleOffset) * ORBIT_RADIUS,
        4 + heightOffset,
        TARGET.z + Math.sin(angleOffset) * ORBIT_RADIUS
      );
      light.setTarget(TARGET.x, TARGET.y, TARGET.z);
      light.orbitAngle = angleOffset;
      light.updater.push((light) => {
        light.orbitAngle += ORBIT_SPEED * 0.01;
        const height = 8 + Math.sin(light.orbitAngle + angleOffset) * 5;
        const x = TARGET.x + Math.cos(light.orbitAngle) * ORBIT_RADIUS;
        const z = TARGET.z + Math.sin(light.orbitAngle) * ORBIT_RADIUS;
        light.setPosition(x, height, z);
        light.setTarget(TARGET.x, TARGET.y, TARGET.z);
      });
    }

    async function onGround(m) {

      let staticMARGIN_Y = -10;
      // Ball
      const ball1 = roulette.addMeshObj({
        material: {type: 'standard', share: true},
        position: {x: 2, y: 11, z: -17},
        scale: [0.25, 0.25, 0.25],
        texturesPaths: ['./res/textures/blankgray2.webp'],
        name: 'ball1',
        mesh: m.ball,
        shadowsCast: false,
        physics: {
          enabled: true,
          mass: 0.05,
          geometry: "Sphere",
          group: 2,
          mask: -1
        },
        raycast: {enabled: false, radius: 1},
      });

      const table = roulette.addMeshObj({
        material: {type: 'standard'},
        position: {x: 0, y: 5 + staticMARGIN_Y, z: -10},
        scale: [0.2, 0.2, 0.2],
        texturesPaths: ['./res/meshes/blender/textures/leder19.jpg'],
        name: 'table',
        mesh: m.table,
        shadowsCast: false,
        physics: {
          enabled: false,
          mass: 0.05,
          geometry: "Sphere",
          group: 2,
          mask: -1
        },
        raycast: {enabled: false, radius: 1},
      });

      const tablenuMBERSteXTURE = roulette.addMeshObj({
        material: {type: 'standard'},
        position: {x: 0, y: 24+ staticMARGIN_Y, z: 8},
        rotation: {x: 180, y: 0, z: 0},
        scale: [0.17, 0.17, 0.17],
        texturesPaths: ['./res/meshes/blender/textures/numbers.png'],
        name: 'table',
        mesh: m.tableNumbers,
        shadowsCast: false,
        physics: {
          enabled: false,
          mass: 0.05,
          geometry: "Sphere",
          group: 2,
          mask: -1
        },
        raycast: {enabled: false, radius: 1},
      });


      const oval = roulette.addMeshObj({
        material: {type: 'standard'},
        position: {x: 0, y: 5+ staticMARGIN_Y, z: -10},
        rotation: {x: 0, y: 0, z: 0},
        scale: [0.2, 0.2, 0.2],
        texturesPaths: ['./res/meshes/blender/textures/unbenannt.jpg'],
        name: 'oval',
        mesh: m.oval,
        physics: {
          enabled: true,
          mass: 0,
          geometry: "ConvexHull",
          vertices: m.oval.vertices
        },
        raycast: {enabled: true, radius: 1}
      });

      // GROUND
      // roulette.addMeshObj({
      //   position: {x: 0, y: 5, z: -21},
      //   scale: [6, 0.1, 15],
      //   texturesPaths: ['./res/icons/editor/chatgpt-gen-bg-inv.webp'],
      //   name: 'ground',
      //   mesh: m.cube,
      //   shadowsCast: false,
      //   physics: {
      //     enabled: false,
      //     mass: 0,
      //     geometry: "Cube"
      //   }
      // });

      let envMapParams = {
        baseColorMix: 0.1,                // CLEAR SKY
        mirrorTint: [0.9, 0.95, 1.0],     // Slight cool tint
        reflectivity: 0.45,               // 25% reflection blend
        illuminateColor: [0.3, 0.7, 1.0], // Soft cyan
        illuminateStrength: 0.5,          // Gentle rim
        illuminatePulse: 0.01,            // No pulse (static)
        fresnelPower: 2.0,                // Medium-sharp edge
        envLodBias: 1.5,
        usePlanarReflection: false,       // ✅ must be false (no support)
      }

      setTimeout(async () => {
        // BALL PHYSICS TUNING
        const ball = roulette.matrixPhysics.getBodyByName('ball1');
        roulette.matrixPhysics.setRestitution(ball, 0.1);
        roulette.matrixPhysics.setFriction(ball, 0.1);

        window.addEventListener("keydown", (e) => {
          e.preventDefault();
          if(e.code === "KeyZ" && leftBodycurrPos === "unpressed") {
            roulette.matrixSounds.play('click3');
          }
        });

        app.matrixPhysics.detectCollision = (e) => {
          const body0Name = e.detail.body0Name;
          const body1Name = e.detail.body1Name;
          const rayDirection = e.detail.rayDirection;
          if(body0Name == "ball1" && body1Name.startsWith("bumper")) {
            //
          }
        };
      }, 1000);

      roulette.canvas.addEventListener("ray.hit.event", async (e) => {
        app.matrixSounds.play('click1');
        console.log('e.detail', e.detail);
        if(e.detail.hitObject.name == "pushBtn") {
          let ball = app.matrixPhysics.getBodyByName(ball1.name);
          const pos = await app.matrixPhysics.getPosition(ball);
          roulette.matrixPhysics.applyImpulse(ball,
            new PVector(0, 0, -randomFloatFromTo(0.8, 1)));
        }
      });

      // roulette.matrixPhysics.setGravity(0, -9.8, 0);
      setTimeout(() => {
        if(isMobile() == false) {
          app.activateBloomEffect();
          app.bloomPass.setBlurRadius(2.5);
        }

        const cam = app.getCamera();
        // const cinematicPath = new CameraPath([
        //   // SHOT 1: High wide angle, far back
        //   {
        //     position: [0, 20, 35],
        //     target: [0, 8, 0],
        //     fov: (2 * Math.PI) / 4.5  // slightly wider
        //   },
        //   // SHOT 2: Orbit left side, closer
        //   {
        //     position: [-15, 18, 20],
        //     target: [0, 6, 0],
        //     fov: (2 * Math.PI) / 5
        //   },
        //   // SHOT 3: Top-down angle
        //   {
        //     position: [8, 16, 12],
        //     target: [0, 5, 0],
        //     fov: (2 * Math.PI) / 5
        //   },
        //   {
        //     position: [0, 9, -2],
        //     target: [0, 3, -15],
        //     fov: (2 * Math.PI) / 5
        //   }
        // ], {
        //   parameterization: 'arc'
        // });

        // cam.setPath(cinematicPath).play({
        //   speed: 0.65,
        //   onEnd: () => {
        //     cam._dirtyAngle = true;
        //     // console.log('✅ Cinematic done, gameplay cam active');
        //   }
        // });
        cam._dirtyAngle = true;
      }, 1500);
    }

  });
  window.app = roulette;
};