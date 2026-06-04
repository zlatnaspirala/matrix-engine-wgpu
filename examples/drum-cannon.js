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

    DRUM.addLight();
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
      cam.setYaw(-0.03);
      cam.setPitch(-0.49);
      cam.setZ(0);
      cam.setY(13);
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

      let drumY = 14.5;

      // DRUM BOTTOM
      const drum0 = DRUM.addMeshObj({
        material: {type: 'standard'},
        position: {x: 0, y: drumY, z: -20},
        rotation: {x: 0, y: 0, z: 0},
        rotationSpeed: {x: 0, y: 0, z: 0},
        scale: [4.3, 0.5, 4.3],
        // texturesPaths: ['./res/textures/floor1.webp'],
        name: 'bure_bottom',
        mesh: m.cube,
        physics: {
          enabled: true,
          mass: 0,
          geometry: "Cube",
          group: 1,
        },
        raycast: {enabled: false, radius: 1}
      })

      const drumTop = DRUM.addMeshObj({
        material: {type: 'standard'},
        position: {x: 10, y: drumY + 17, z: -22},
        rotation: {x: -7, y: 0, z: 0},
        rotationSpeed: {x: 0, y: 0, z: 0},
        scale: [5, 1, 7],
        // texturesPaths: ['./res/textures/floor1.webp'],
        name: 'bure_top1',
        mesh: m.cube,
        physics: {
          enabled: true,
          kinematic: true,
          mass: 0,
          geometry: "Cube",
          layer: 0,
        },
        raycast: {enabled: false, radius: 1}
      })

      const drumTopTop = DRUM.addMeshObj({
        material: {type: 'standard'},
        position: {x: 10, y: drumY + 20.5, z: -22},
        rotation: {x: -7, y: 0, z: 0},
        rotationSpeed: {x: 0, y: 0, z: 0},
        scale: [5, 1, 7],
        // texturesPaths: ['./res/textures/floor1.webp'],
        name: 'toptop',
        mesh: m.cube,
        physics: {
          enabled: true,
          kinematic: true,
          mass: 0,
          geometry: "Cube",
          layer: 0,
        },
        raycast: {enabled: false, radius: 1}
      })

      const drumTopBlockCube1 = DRUM.addMeshObj({
        material: {type: 'standard'},
        position: {x: -3.3, y: drumY + 15, z: -13},
        rotation: {x: -7, y: 0, z: 0},
        rotationSpeed: {x: 0, y: 0, z: 0},
        scale: [1.35, 1.35, 1],
        // texturesPaths: ['./res/textures/floor1.webp'],
        name: 'bure_topBlock1',
        mesh: m.cube,
        physics: {
          enabled: true,
          mass: 0,
          geometry: "Cube",
          layer: 0,
        },
        raycast: {enabled: false, radius: 1}
      })


      const drumTopBlockCube2 = DRUM.addMeshObj({
        material: {type: 'standard'},
        position: {x: 3.3, y: drumY + 15, z: -13},
        rotation: {x: -7, y: 0, z: 0},
        rotationSpeed: {x: 0, y: 0, z: 0},
        scale: [1.35, 1.35, 1],
        // texturesPaths: ['./res/textures/floor1.webp'],
        name: 'bure_topBlock2',
        mesh: m.cube,
        physics: {
          enabled: true,
          mass: 0,
          geometry: "Cube",
          layer: 0,
        },
        raycast: {enabled: false, radius: 1}
      })

      const drumTopAngled = DRUM.addMeshObj({
        material: {type: 'standard'},
        position: {x: 0, y: drumY + 18, z: -11.5},
        rotation: {x: 50, y: 0, z: 0},
        rotationSpeed: {x: 0, y: 0, z: 0},
        scale: [5.5, 1, 4],
        // texturesPaths: ['./res/textures/floor1.webp'],
        name: 'bure_topA',
        mesh: m.cube,
        physics: {
          enabled: true,
          mass: 0,
          geometry: "Cube",
          group: 1,
        },
        raycast: {enabled: false, radius: 1}
      })

      const drum1 = DRUM.addMeshObj({
        material: {type: 'standard'},
        position: {x: 0, y: drumY + 6.5, z: -13.5},
        rotation: {x: 20, y: 0, z: 0},
        rotationSpeed: {x: 0, y: 0, z: 0},
        scale: [4.5, 8, 0.5],
        // texturesPaths: ['./res/textures/floor1.webp'],
        name: 'bure_r1',
        mesh: m.cube,
        physics: {
          enabled: true,
          // kinematic: true,
          mass: 0,
          geometry: "Cube",
          vertices: m.reel.vertices,
          indices: m.reel.indices,
          group: 1,
        },
        raycast: {enabled: false, radius: 1}
      })

      const drum2 = DRUM.addMeshObj({
        material: {type: 'standard'},
        position: {x: 0, y: drumY + 6.5, z: -27.5},
        rotation: {x: -20, y: 0, z: 0},
        rotationSpeed: {x: 0, y: 0, z: 0},
        scale: [4.5, 8, 0.5],
        // texturesPaths: ['./res/textures/floor1.webp'],
        name: 'bure_r2',
        mesh: m.cube,
        physics: {
          enabled: true,
          mass: 0,
          geometry: "Cube",
          vertices: m.reel.vertices,
          indices: m.reel.indices,
          group: 1,
        },
        raycast: {enabled: false, radius: 1}
      })

      const drum3 = DRUM.addMeshObj({
        material: {type: 'standard'},
        position: {x: 5.5, y: 22.5, z: -20},
        rotation: {x: 0, y: 0, z: 0},
        rotationSpeed: {x: 0, y: 0, z: 0},
        scale: [0.5, 10, 8],
        // texturesPaths: ['./res/textures/floor1.webp'],
        name: 'bure_l1',
        mesh: m.cube,
        physics: {
          mass: 0,
          enabled: true,
          geometry: "Cube",
          group: 1,
          // mask: 2,
        },
        raycast: {enabled: false, radius: 1}
      })

      const drum4 = DRUM.addMeshObj({
        material: {type: 'standard'},
        position: {x: -7, y: 22.5, z: -20},
        rotation: {x: 0, y: 0, z: 0},
        rotationSpeed: {x: 0, y: 0, z: 0},
        scale: [2, 10, 8],
        // texturesPaths: ['./res/textures/floor1.webp'],
        name: 'bure_l2',
        mesh: m.cube,
        physics: {
          mass: 0,
          enabled: true,
          geometry: "Cube",
          group: 1,
        },
        raycast: {enabled: true, radius: 1}
      })

      const ballcatch = DRUM.addMeshObj({
        material: {type: 'standard'},
        position: {x: 0, y: drumY + 10, z: -35},
        rotation: {x: 0, y: 0, z: 0},
        rotationSpeed: {x: 0, y: 0, z: 0},
        scale: [5, 1, 5],
        // texturesPaths: ['./res/textures/floor1.webp'],
        name: 'ballcatch',
        mesh: m.cube,
        physics: {
          enabled: true,
          mass: 0,
          geometry: "Cube",
          group: 1,
        },
        raycast: {enabled: false, radius: 1}
      })

      // not isolated bug yet - selecting not precise!
      setTimeout(async () => {
        drum0.setBlend(0.1)
        drum1.setBlend(0.1)
        drum2.setBlend(0.1)
        drum3.setBlend(0.1)
        drum4.setBlend(0.1)
        drumTop.setBlend(0.1)
        drumTopAngled.setBlend(0.1)
        drumTopTop.setBlend(0.1)
        drumTopBlockCube1.setBlend(0.1)
        drumTopBlockCube2.setBlend(0.1)

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
          // DRUM.FIRST_TEST
          DRUM.canvas.addEventListener("ray.hit.event", (e) => {
            console.log('ray.hit.event detected');
            if(e.detail.hitObject.name.startsWith('bure_l2')) {
              // app.matrixPhysics.lotteryMachineShake(T, 300)
            }
          });

          setTimeout(async () => {
            console.log(' ssss ', toptopID)
            app.matrixPhysics.setBodyTransform(toptopID, 0, 35, -22);
            app.matrixPhysics.setBodyTransform(topID, 0, 29.5, -22);
            // app.matrixPhysics.lotteryMachineShake(T, 0.001)
            setTimeout(() => {
              DRUM.updaterDrum.checkWin = true;
            }, 500)
          }, 500)
        })
      }, 2500)

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
            DRUM.SLICED.push(sliced);
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
          const winNumbers = DRUM.SLICED.length;
          if(winNumbers === 10) {
            console.log('DETECTED LAST WIN BALL', e.detail);
            DRUM.updaterDrum.checkWin = false;
          }
          app.matrixPhysics.switchToKinematic(ID);
          setTimeout(() => {
            // app.matrixPhysics.setKinematicTransform(ID, 10, 20, -20)
            app.animateSpiral(ID, 200, {
              radius: 15,
              rotations: 5,
              centerX: 0,
              centerZ: -15,
              startY: 25,
              height: 0 + winNumbers * 3,
              duration: 5.0
            });
          }, 100);
        }
      };

      DRUM.updaterDrum = {
        checkWin: false,
        c: 0,
        update: function() {
          this.c++;
          if(this.checkWin === true && this.c > 10) {
            app.matrixPhysics.lotteryMachineShake(app.BALLS_ID, 300)
            this.c = 0;
          }
        }
      };

      DRUM.autoUpdate.push(DRUM.updaterDrum);
      if(isMobile() == false) app.activateBloomEffect();
      DRUM.lightContainer[0].setPosY(55);
      DRUM.lightContainer[0].setIntensity(80);
    }

  })
  window.app = DRUM;
}