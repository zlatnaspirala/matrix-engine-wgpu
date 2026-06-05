import MatrixEngineWGPU from "../src/world.js";
import {downloadMeshes} from '../src/engine/loader-obj.js';
import {addRaycastsAABBListener, addRaycastsListener} from "../src/engine/raycast.js";
// import {MeshMorpher} from "../src/engine/procedural-mesh.js";
// import {PVector} from "../src/engine/matrix-class.js";
import {isMobile} from "../src/engine/utils.js";

export var loadDrumCannon = function() {
  let DRUM = new MatrixEngineWGPU({
    canvasSize: 'fullscreen',
    useJolt: true,
    fastRender: 0.9,
    MAX_SPOTLIGHTS: 4,
    MAX_BONES: 0,
    mainCameraParams: {
      type: 'WASD',
      responseCoef: 1000
    },
    clearColor: {r: 0, b: 0.122, g: 0.122, a: 1}
  }, () => {

    addRaycastsAABBListener();
    addEventListener('PhysicsReady', () => {
      downloadMeshes({
        cube: "./res/meshes/blender/cube.obj",
        plane: "./res/meshes/blender/plane.obj",
        planeZ: "./res/meshes/obj/plane-z.obj",
        ball: "./res/meshes/shapes/sphere-uv-cilinder-proj.obj",
        reel: "./res/meshes/obj/reel.obj",
        side: "./res/meshes/obj/drumpart.obj",
        side2: "./res/meshes/obj/drumpart2.obj"
      }, onGround, {scale: [1, 1, 1]})
      // DRUM.matrixPhysics.speedUpSimulation(4);
      // DRUM.physicsBodiesChain();
    })

    async function onGround(m) {
      let cam = app.getCamera();
      cam.setYaw(0);
      cam.setPitch(-0.1);
      cam.setZ(10);
      cam.setY(33);
      cam._dirtyAngle = true;
      // Ground
      DRUM.addMeshObj({
        position: {x: 0, y: -0.5, z: -10},
        rotation: {x: 0, y: 0, z: 0},
        rotationSpeed: {x: 0, y: 0, z: 0},
        scale: [35, 1, 35],
        texturesPaths: ['res/icons/editor/chatgpt-gen-bg-inv.webp'],
        name: 'ground',
        mesh: m.plane,
        physics: {enabled: false}
      });

      function createDrum(app, m, cx, drumY, cz) {
        const o = (dx, dy, dz) => ({x: cx + dx, y: drumY + dy, z: cz + dz});

        const drum0 = app.addMeshObj({
          material: {type: 'standard'},
          position: o(0, 0, 0),
          rotation: {x: 0, y: 0, z: 0}, rotationSpeed: {x: 0, y: 0, z: 0},
          scale: [4.3, 0.5, 4.3], name: 'bure_bottom', mesh: m.cube,
          physics: {enabled: true, mass: 0, geometry: 'Cube', group: 1},
          raycast: {enabled: false, radius: 1}
        });

        const drumTop = app.addMeshObj({
          material: {type: 'standard'},
          position: o(10, 17, -2),
          rotation: {x: -7, y: 0, z: 0}, rotationSpeed: {x: 0, y: 0, z: 0},
          scale: [5, 1, 7], name: 'bure_top1', mesh: m.cube,
          physics: {enabled: true, kinematic: true, mass: 0, geometry: 'Cube', layer: 0},
          raycast: {enabled: false, radius: 1}
        });

        const drumTopTop = app.addMeshObj({
          material: {type: 'standard'},
          position: o(10, 19.5, -2),
          rotation: {x: -7, y: 0, z: 0}, rotationSpeed: {x: 0, y: 0, z: 0},
          scale: [5, 1, 7], name: 'toptop', mesh: m.cube,
          physics: {enabled: true, kinematic: true, mass: 0, geometry: 'Cube', layer: 0},
          raycast: {enabled: false, radius: 1}
        });

        const drumTopBlockCube1 = app.addMeshObj({
          material: {type: 'standard'},
          position: o(-3.3, 15.8, +7),
          rotation: {x: -7, y: 0, z: 0}, rotationSpeed: {x: 0, y: 0, z: 0},
          scale: [1.45, 1.45, 1], name: 'bure_topBlock1', mesh: m.cube,
          physics: {enabled: true, mass: 0, geometry: 'Cube', layer: 0},
          raycast: {enabled: false, radius: 1}
        });

        const drumTopBlockCube2 = app.addMeshObj({
          material: {type: 'standard'},
          position: o(3.3, 15.8, +7),
          rotation: {x: -7, y: 0, z: 0}, rotationSpeed: {x: 0, y: 0, z: 0},
          scale: [1.45, 1.45, 1], name: 'bure_topBlock2', mesh: m.cube,
          physics: {enabled: true, mass: 0, geometry: 'Cube', layer: 0},
          raycast: {enabled: false, radius: 1}
        });

        const drumTopAngled = app.addMeshObj({
          material: {type: 'standard'},
          position: o(0, 18, +8.5),
          rotation: {x: 50, y: 0, z: 0}, rotationSpeed: {x: 0, y: 0, z: 0},
          scale: [5.5, 1, 4], name: 'bure_topA', mesh: m.cube,
          physics: {enabled: true, mass: 0, geometry: 'Cube', group: 1},
          raycast: {enabled: false, radius: 1}
        });

        const drum1 = app.addMeshObj({
          material: {type: 'standard'},
          position: o(0, 6.5, +6.5),
          rotation: {x: 20, y: 0, z: 0}, rotationSpeed: {x: 0, y: 0, z: 0},
          scale: [4.5, 8, 0.5], name: 'bure_r1', mesh: m.cube,
          physics: {
            enabled: true, mass: 0, geometry: 'Cube',
            vertices: m.reel.vertices, indices: m.reel.indices, group: 1
          },
          raycast: {enabled: false, radius: 1}
        });

        const drum2 = app.addMeshObj({
          material: {type: 'standard'},
          position: o(0, 6.5, -7.5),
          rotation: {x: -20, y: 0, z: 0}, rotationSpeed: {x: 0, y: 0, z: 0},
          scale: [4.5, 8, 0.5], name: 'bure_r2', mesh: m.cube,
          physics: {
            enabled: true, mass: 0, geometry: 'Cube',
            vertices: m.reel.vertices, indices: m.reel.indices, group: 1
          },
          raycast: {enabled: false, radius: 1}
        });

        const drum3 = app.addMeshObj({
          material: {type: 'standard'},
          position: o(5.5, 8, 0),
          rotation: {x: 0, y: 0, z: 0}, rotationSpeed: {x: 0, y: 0, z: 0},
          scale: [0.5, 10, 8], name: 'bure_l1', mesh: m.cube,
          physics: {enabled: true, mass: 0, geometry: 'Cube', group: 1},
          raycast: {enabled: false, radius: 1}
        });

        const drum4 = app.addMeshObj({
          material: {type: 'standard'},
          position: o(-7, 8, 0),
          rotation: {x: 0, y: 0, z: 0}, rotationSpeed: {x: 0, y: 0, z: 0},
          scale: [2, 10, 8], name: 'bure_l2', mesh: m.cube,
          physics: {enabled: true, mass: 0, geometry: 'Cube', group: 1},
          raycast: {enabled: true, radius: 1}
        });

        const ballcatch = app.addMeshObj({
          material: {type: 'standard'},
          position: o(0, 10, -15),
          rotation: {x: 0, y: 0, z: 0}, rotationSpeed: {x: 0, y: 0, z: 0},
          scale: [5, 1, 5], name: 'ballcatch', mesh: m.cube,
          physics: {enabled: true, mass: 0, geometry: 'Cube', group: 1},
          raycast: {enabled: false, radius: 1}
        });

        const parts = [drum0, drum1, drum2, drum3, drum4,
          drumTop, drumTopAngled, drumTopTop,
          drumTopBlockCube1, drumTopBlockCube2];

        setTimeout(() => parts.forEach(p => p.setBlend(0.4)), 400);

        return {
          drum0, drum1, drum2, drum3, drum4,
          drumTop, drumTopTop, drumTopAngled,
          drumTopBlockCube1, drumTopBlockCube2,
          ballcatch,
          toptopName: 'toptop',
          topName: 'bure_top1'
        };
      }

      DRUM.drumConfig = {cx: 0, drumY: 21, cz: -20};

      const drum = createDrum(DRUM, m, 0, 21, -20);

      // not isolated bug yet - selecting not precise!
      setTimeout(async () => {
        // drum0.setBlend(0.1)
        // drum1.setBlend(0.1)
        // drum2.setBlend(0.1)
        // drum3.setBlend(0.1)
        // drum4.setBlend(0.1)
        // drumTop.setBlend(0.1)
        // drumTopAngled.setBlend(0.1)
        // drumTopTop.setBlend(0.1)
        // drumTopBlockCube1.setBlend(0.1)
        // drumTopBlockCube2.setBlend(0.1)

        let toptopID = DRUM.matrixPhysics.getBodyByName('toptop');
        let topID = DRUM.matrixPhysics.getBodyByName('bure_top1');

        let textures = [];
        for(var j = 1;j < 40;j++) {
          textures.push(`res/textures/numbers/${j}.png`)
        }

        DRUM.physicsBodiesGenerator(
          "standard",
          {x: 0, y: 50, z: -20},
          {x: 0, y: 0, z: 0},
          textures,
          "balls",
          "Sphere",
          false,
          [1, 1, 1],
          35, 100, null,
          {x: 1.1, y: 1.1, z: 1.1} // offset - just little to not get ball on ball effect
        ).then((T) => {
          console.log(T)
          DRUM.BALLS_ID = T;
          DRUM.BALLS_ID_INIT = T;
          DRUM.SLICED = [];
          DRUM.SLICED_PERMAMENT = [];
          // DRUM.FIRST_TEST
          DRUM.canvas.addEventListener("ray.hit.event", (e) => {
            console.log('ray.hit.event detected');
            if(e.detail.hitObject.name.startsWith('bure_l2')) {
              // app.matrixPhysics.lotteryMachineShake(T, 300)
            }
          });

          setTimeout(async () => {
            // console.log(' ssss ', toptopID)
            const {cx, drumY, cz} = DRUM.drumConfig;
            app.matrixPhysics.setBodyTransform(toptopID, cx - 1.5, drumY + 20, cz - 2);
            app.matrixPhysics.setBodyTransform(topID, cx - 1.5, drumY + 15, cz - 2);
            setTimeout(() => {
              DRUM.updaterDrum.checkWin = true;
            }, 500)
          }, 500)
        })
      }, 2500)

      DRUM.faceCamera = (idx, duration = 1.0) => {
        const totalFrames = Math.round(duration * 60);
        let frame = 0;

        const targetAngle = Math.PI; // face toward +Z (camera)

        const interval = setInterval(() => {
          if(frame >= totalFrames) {
            clearInterval(interval);
            return;
          }

          const t = frame / totalFrames;
          const eased = t * t * (3 - 2 * t);
          const angle = targetAngle * eased;

          // Y-axis rotation quaternion
          const qy = Math.sin(angle * 0.5);
          const qw = Math.cos(angle * 0.5);

          app.matrixPhysics.setKinematicRotation(idx, 0, qy, 0, qw);
          frame++;
        }, 1000 / 60);
      }

      DRUM.animateSpiral = (idx, delay, opts) => {
        const {radius, height, rotations, centerX, centerZ, startY, duration = 5.0} = opts;
        const totalFrames = Math.round(duration * 60);
        let frame = 0;
        setTimeout(() => {
          const interval = setInterval(() => {
            if(frame >= totalFrames) {
              clearInterval(interval);
              app.matrixPhysics.setKinematicTransform(idx, centerX, height, centerZ);
              return;
            }
            const t = frame / totalFrames;
            const eased = t * t * (3 - 2 * t);          // smoothstep
            const r = radius * (1 - eased);              // shrinks to 0
            const angle = t * Math.PI * 2 * rotations;   // winds in

            const x = centerX + Math.cos(angle) * r;
            const z = centerZ + Math.sin(angle) * r;
            const y = startY + (height - startY) * eased;
            app.matrixPhysics.setKinematicTransform(idx, x, y, z);
            frame++;
          }, 1000 / 60);
        }, delay);
      }

      DRUM.matrixPhysics.detectCollision = (e) => {
        const body0Name = e.detail.body0Name;
        const body1Name = e.detail.body1Name;
        const rayDirection = e.detail.rayDirection;
        if(body0Name === "toptop" && body1Name.startsWith("balls_") ||
          body1Name === "toptop" && body0Name.startsWith("balls_")) {
          // console.log('DETECTED POTENCIAL WIN BALL', e.detail)
          const ID = app.matrixPhysics.getBodyByName(body1Name);
          const index = app.BALLS_ID.indexOf(ID);
          if(index > -1) {
            let sliced = app.BALLS_ID.splice(index, 1);
            DRUM.SLICED.push(sliced[0]);
          }
        } else if(body0Name === "bure_bottom" && body1Name.startsWith("balls_") ||
          body1Name === "bure_bottom" && body0Name.startsWith("balls_")) {
          const ID = app.matrixPhysics.getBodyByName(body1Name);
          if(app.BALLS_ID && app.BALLS_ID.indexOf(ID) === -1) {
            // console.log('sliced check passed get activated again')
            app.BALLS_ID.push(ID);
          }
        } else if(body1Name === "ballcatch" && body0Name.startsWith("balls_") ||
          body0Name === "ballcatch" && body1Name.startsWith("balls_")) {
          const ID = app.matrixPhysics.getBodyByName(body1Name);
          console.log('DETECTED WIN BALL', e.detail);
          DRUM.SLICED_PERMAMENT.push(ID);
          const slot = DRUM.SLICED_PERMAMENT.length;
          if(slot === 5) {
            console.log('DETECTED LAST WIN BALL', e.detail);
            DRUM.updaterDrum.checkWin = false;

            setTimeout(() => {
              DRUM.SLICED_PERMAMENT.forEach((ballID) => {
                app.faceCamera(ballID, 1)
              });

            } , 4000)

          }
          app.faceCamera(ID, 5)
          app.matrixPhysics.switchToKinematic(ID);
          app.animateSpiral(ID, 200, {
            radius: 15,
            rotations: 5,
            centerX: 0,
            centerZ: -15,
            startY: 25,
            height: 0 + slot * 3,
            duration: 5.0
          });
        }
      };

      DRUM.updaterDrum = {
        checkWin: false,
        c: 0,
        update: function() {
          this.c++;
          if(this.checkWin === true && this.c > 10) {
            app.matrixPhysics.lotteryMachineShake(app.BALLS_ID, 270)
            this.c = 0;
          }
        }
      };

      const NUM_LIGHTS = 4;
      const ORBIT_RADIUS = 5;
      const ORBIT_SPEED = 1;
      const TARGET = {x: 0, y: 25, z: -10};

      // Light colors cycling around the hue wheel
      const LIGHT_COLORS = [
        [2.0, 0.2, 0.2],  // red
        [1.0, 0.6, 0.1],  // orange
        [0.2, 0.2, 2.0],  // blue
        [1.0, 2.0, 0.1],  // yellow
        [0.2, 1.0, 0.2],  // green
        [0.1, 1.0, 0.6],  // teal
        [0.1, 0.6, 1.0],  // sky
        [0.6, 0.1, 1.0],  // purple
        [1.0, 0.1, 0.8],  // pink
        [1.0, 0.1, 0.4],  // rose
      ];

      for(let i = 0;i < NUM_LIGHTS;i++) {
        DRUM.addLight();
      }

      // Set up lights evenly spaced around the circle
      for(let i = 0;i < NUM_LIGHTS;i++) {
        const light = DRUM.lightContainer[i];
        const angleOffset = (i / NUM_LIGHTS) * Math.PI * 2;
        const color = LIGHT_COLORS[i];
        light.setIntensity(45);
        light.color = color;
        const heightOffset = Math.sin(angleOffset) * 2;
        light.setPosition(
          TARGET.x + Math.cos(angleOffset) * ORBIT_RADIUS,
          4 + heightOffset,
          TARGET.z + Math.sin(angleOffset) * ORBIT_RADIUS
        );
        light.setTarget(TARGET.x, TARGET.y, TARGET.z);
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

      DRUM.autoUpdate.push(DRUM.updaterDrum);
      if(isMobile() == false) {
        app.activateBloomEffect();
        app.bloomPass.setBlurRadius(1)
      }
    }

  })
  window.app = DRUM;
}