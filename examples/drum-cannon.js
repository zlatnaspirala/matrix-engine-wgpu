import MatrixEngineWGPU from "../src/world.js";
import {downloadMeshes} from '../src/engine/loader-obj.js';
import {addRaycastsAABBListener, addRaycastsListener} from "../src/engine/raycast.js";
import {MeshMorpher} from "../src/engine/procedural-mesh.js";
import {PVector} from "../src/engine/matrix-class.js";
import {isMobile} from "../src/engine/utils.js";

export var loadDrumCannon = function() {
  let DRUM = new MatrixEngineWGPU({
    canvasSize: 'fullscreen',
    // useCannon: true,
    useJolt: true,
    fastRender: 0.9,
    MAX_SPOTLIGHTS: 1,
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

      DRUM.addMeshObj({
        position: {x: 0, y: -0.5, z: -10},
        rotation: {x: 0, y: 0, z: 0},
        rotationSpeed: {x: 0, y: 0, z: 0},
        scale: [25, 0.1, 25],
        texturesPaths: ['res/icons/editor/chatgpt-gen-bg-inv.webp'],
        name: 'ground',
        mesh: m.plane,
        physics: {enabled: false}
      });

      // DRUM BOTTOM
      const drum0 = DRUM.addMeshObj({
        material: {type: 'standard'},
        position: {x: 0, y: 14.5, z: -20},
        rotation: {x: 0, y: 0, z: 0},
        rotationSpeed: {x: 0, y: 0, z: 0},
        scale: [4.3, 0.5, 4.3],
        texturesPaths: ['./res/textures/floor1.webp'],
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

      const drum1 = DRUM.addMeshObj({
        material: {type: 'standard'},
        position: {x: 0, y: 21, z: -13.5},
        rotation: {x: 20, y: 0, z: 0},
        rotationSpeed: {x: 0, y: 0, z: 0},
        scale: [4.5, 8, 0.5],
        texturesPaths: ['./res/textures/floor1.webp'],
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
        position: {x: 0, y: 21, z: -27.5},
        rotation: {x: -20, y: 0, z: 0},
        rotationSpeed: {x: 0, y: 0, z: 0},
        scale: [4.5, 8, 0.5],
        texturesPaths: ['./res/textures/floor1.webp'],
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
        position: {x: 5.5, y: 21, z: -20},
        rotation: {x: 0, y: 0, z: 0},
        rotationSpeed: {x: 0, y: 0, z: 0},
        scale: [0.5, 10, 8],
        texturesPaths: ['./res/textures/floor1.webp'],
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
        position: {x: -7, y: 21, z: -20},
        rotation: {x: 0, y: 0, z: 0},
        rotationSpeed: {x: 0, y: 0, z: 0},
        scale: [2, 10, 8],
        texturesPaths: ['./res/textures/floor1.webp'],
        name: 'bure_l2',
        mesh: m.planeZ,
        physics: {
          mass: 0,
          enabled: true,
          geometry: "Cube",
          group: 1,
        },
        raycast: {enabled: true, radius: 1}
      })



      // DRUM.addProceduralMeshObj({
      //   material: {type: 'standard'},
      //   position: {x: 10, y: 15, z: -17},
      //   rotation: {x: 0, y: 0, z: 0},
      //   scale: [1, 1, 1],
      //   rotationSpeed: {x: 0, y: 0, z: 0},
      //   texturesPaths: ['./res/textures/cube-g1_low.webp'],
      //   meshA: MeshMorpher.capsule(1, 2, false),
      //   meshB: MeshMorpher.cube(1),
      //   name: `morph_1`,
      //   physics: {
      //     enabled: true,
      //     geometry: "Capsule",
      //     mass: 1,
      //     radius: 1.0,
      //     height: 2.0,
      //     group: 2,
      //     mask: -1,
      //   },
      //   raycast: {enabled: true, radius: 1}
      // });

      // DRUM.addProceduralMeshObj({
      //   material: {type: 'standard'},
      //   position: {x: 6, y: 15, z: -17},
      //   rotation: {x: 0, y: 0, z: 0},
      //   scale: [1, 1, 1],
      //   rotationSpeed: {x: 0, y: 0, z: 0},
      //   texturesPaths: ['./res/textures/cube-g1_low.webp'],
      //   meshA: MeshMorpher.cylinder(1, 2),
      //   meshB: MeshMorpher.cube(1),
      //   name: `morph_cylinder`,
      //   physics: {
      //     enabled: true,
      //     geometry: "Cylinder",
      //     mass: 1,
      //     radius: 1.0,
      //     height: 2.0,
      //     group: 2,
      //     mask: -1,
      //   },
      //   raycast: {enabled: true, radius: 1}
      // });

      // DRUM.addProceduralMeshObj({
      //   material: {type: 'standard'},
      //   position: {x: 1, y: 3, z: -7},
      //   rotation: {x: 0, y: 0, z: 0},
      //   scale: [1, 1, 1],
      //   rotationSpeed: {x: 0, y: 0, z: 0},
      //   texturesPaths: ['./res/textures/cube-g1_low.webp'],
      //   meshA: MeshMorpher.cone(1, 3, false),
      //   meshB: MeshMorpher.cube(1),
      //   name: `morph_cone`,
      //   physics: {
      //     enabled: true,
      //     geometry: "Cone",
      //     mass: 1,
      //     radius: 1,
      //     height: 3,
      //     group: 2,
      //     mask: -1,
      //   },
      //   raycast: {enabled: true, radius: 1}
      // });
      // not isolated bug yet - selecting not precise!
      setTimeout(async () => {
        drum0.setBlend(0.1)
        drum1.setBlend(0.1)
        drum2.setBlend(0.1)
        drum3.setBlend(0.1)
        drum4.setBlend(0.1)

        let textures = [];

        for (var j=1;j< 40;j++) {
          textures.push(`res/textures/numbers/${j}.png`)
        }

        DRUM.physicsBodiesGenerator(
          "standard",
          {x: 0, y: 50, z: -20},
          {x: 0, y: 0, z: 0},
          textures,
          "testGen",
          "Sphere",
          false,
          [1, 1, 1],
          35, 100, null,
          {x: 1.1, y: 1.1, z: 1.1} // offset - just little to not get ball on ball effect
        ).then((T) => {
          console.log(T)
          DRUM.canvas.addEventListener("ray.hit.event", (e) => {
            console.log('ray.hit.event detected');
            if(e.detail.hitObject.name.startsWith('bure_l2')) {
              app.matrixPhysics.lotteryMachineShake(T, 250)
            }
          });
          // setTimeout(async () => {app.matrixPhysics.lotteryMachineShake(T, 0.001)}, 4000)
        })

      }, 2500)

      if(isMobile() == false) app.activateBloomEffect();
      DRUM.lightContainer[0].setPosY(45);
      DRUM.lightContainer[0].setIntensity(80);
    }

  })
  window.app = DRUM;
}