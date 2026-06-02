import MatrixEngineWGPU from "../src/world.js";
import {downloadMeshes} from '../src/engine/loader-obj.js';
import {addRaycastsListener} from "../src/engine/raycast.js";
import {MeshMorpher} from "../src/engine/procedural-mesh.js";
import {PVector} from "../src/engine/matrix-class.js";
import {isMobile} from "../src/engine/utils.js";

export var testCannonES = function() {
  let physicsPlayground = new MatrixEngineWGPU({
    canvasSize: 'fullscreen',
    useCannon: true,
    fastRender: 0.9,
    MAX_SPOTLIGHTS: 1,
    MAX_BONES: 0,
    mainCameraParams: {
      type: 'WASD',
      responseCoef: 1000
    },
    clearColor: {r: 0, b: 0.122, g: 0.122, a: 1}
  }, () => {

    physicsPlayground.addLight();
    addRaycastsListener();
    addEventListener('PhysicsReady', () => {
      downloadMeshes({
        cube: "./res/meshes/blender/cube.obj",
        plane: "./res/meshes/blender/plane.obj",
        ball: "./res/meshes/shapes/sphere-uv-cilinder-proj.obj",
        reel: "./res/meshes/obj/reel.obj",
        side: "./res/meshes/obj/drumpart.obj",
        side2: "./res/meshes/obj/drumpart2.obj"
      }, onGround, {scale: [1, 1, 1]})
      // physicsPlayground.matrixPhysics.speedUpSimulation(4);

      // physicsPlayground.physicsBodiesChain();
      // // physicsPlayground.physicsBodiesGeneratorDeepPyramid(
      // //   "standard", {x: 0, y: 1, z: -20}, {x: 0, y: 0, z: 0},
      // //   "./res/textures/gold-1.webp", "pyr", 2, true, [1, 1, 1], 2, 400
      // // );

      // // Buildin options
      // app.physicsBodiesGeneratorWall("standard",
      //   {x: -4.5, y: 0, z: -10}, {x: 0, y: 0, z: 0},
      //   ["./res/textures/rust.jpg",],
      //   'my_set_walls', "2x2", true, [1, 1, 1], 2, 70);

      let strength = 10;
      physicsPlayground.canvas.addEventListener("ray.hit.event", (e) => {
        console.log('ray.hit.event detected');
        let b = app.matrixPhysics.getBodyByName(e.detail.hitObject.name);
        app.matrixPhysics.applyImpulse(b, new PVector(
          e.detail.rayDirection[0] * strength,
          e.detail.rayDirection[1] * strength,
          e.detail.rayDirection[2] * strength))
      });
    })

    async function onGround(m) {

      // const myComplexGeometry = physicsPlayground.addMeshObj({
      //   material: {type: 'standard'},
      //   position: {x: 8, y: 4, z: -6},
      //   rotation: {x: 0, y: 0, z: 0.02},
      //   scale: [3, 3, 3],
      //   texturesPaths: ['./res/textures/slot/reel1-lod0.webp'],
      //   name: 'MyHull',
      //   mesh: m.reel,
      //   physics: {
      //     enabled: true,
      //     mass: 2,
      //     geometry: "ConvexHull",
      //     vertices: m.reel.vertices,
      //     indices: m.reel.indices,
      //     group: 2,
      //     mask: -1,
      //   },
      //   raycast: {enabled: true, radius: 1}
      // });

      let cam = app.getCamera();
      cam.setYaw(-0.03);
      cam.setPitch(-0.49);
      cam.setZ(0);
      cam.setY(13);
      cam._dirtyAngle = true;

      // physicsPlayground.addMeshObj({
      //   material: {type: 'standard'},
      //   position: {x: 0, y: 15, z: -20},
      //   rotation: {x: 0, y: 0, z: 0},
      //   rotationSpeed: {x: 0, y: 111, z: 0},
      //   scale: [5, 5, 5],
      //   texturesPaths: ['./res/textures/floor1.webp'],
      //   name: 'ball1',
      //   mesh: m.ball,
      //   physics: {
      //     enabled: true,
      //     geometry: "Sphere",
      //     group: 2,
      //     mask: -1,
      //   },
      //   raycast: {enabled: true, radius: 1}
      // })

      physicsPlayground.addMeshObj({
        position: {x: 0, y: -0.5, z: -10},
        rotation: {x: 0, y: 0, z: 0},
        rotationSpeed: {x: 0, y: 0, z: 0},
        scale: [25, 0.1, 25], // chatgpt-gen-bg-inv
        texturesPaths: ['res/icons/editor/chatgpt-gen-bg-inv.webp'],
        name: 'ground',
        mesh: m.plane,
        physics: {enabled: false}
      });


      // DRum
      // BOTTOM
      const drum0 = physicsPlayground.addMeshObj({
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
          // mask: 2,
        },
        raycast: {enabled: true, radius: 1}
      })

      const drum1 = physicsPlayground.addMeshObj({
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
          // mask: 2,
        },
        raycast: {enabled: true, radius: 1}
      })

      const drum2 = physicsPlayground.addMeshObj({
        material: {type: 'standard'},
        position: {x: 0, y: 21, z: -27.5},
        rotation: {x: -20, y: 0, z: 0},
        rotationSpeed: {x: 0, y: 0, z: 0},
        scale: [ 4.5, 8, 0.5],
        texturesPaths: ['./res/textures/floor1.webp'],
        name: 'bure_r2',
        mesh: m.cube,
        physics: {
          enabled: true,
          mass: 0,
          // kinematic: true,
          geometry: "Cube",
          vertices: m.reel.vertices,
          indices: m.reel.indices,
         group: 1,
          // mask: 2,
        },
        raycast: {enabled: true, radius: 1}
      })


      const drum3 = physicsPlayground.addMeshObj({
        material: {type: 'standard'},
        position: {x: 5.5, y: 21, z: -20},
        rotation: {x: 0, y: 180, z: 0},
        rotationSpeed: {x: 0, y: 0, z: 0},
        scale: [0.5, 10, 8],
        texturesPaths: ['./res/textures/floor1.webp'],
        name: 'bure_l1',
        mesh: m.cube,
        physics: {
          mass: 0,
          enabled: true,
          // kinematic: true,
          geometry: "Cube",
          vertices: m.reel.vertices,
          indices: m.reel.indices,
          group: 1,
          // mask: 2,
        },
        raycast: {enabled: true, radius: 1}
      })

      const drum4 = physicsPlayground.addMeshObj({
        material: {type: 'standard'},
        position: {x: -5.5, y: 21, z: -20},
        rotation: {x: 0, y: 0, z: 0},
        rotationSpeed: {x: 0, y: 0, z: 0},
        scale: [0.5, 10, 8],
        texturesPaths: ['./res/textures/floor1.webp'],
        name: 'bure_l2',
        mesh: m.cube,
        physics: {
          mass: 0,
          enabled: true,
          kinematic: true,
          geometry: "Cube",
          group: 0,
          // mask: 2,
        },
        raycast: {enabled: true, radius: 1}
      })




      // physicsPlayground.addProceduralMeshObj({
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

      // physicsPlayground.addProceduralMeshObj({
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

      // physicsPlayground.addProceduralMeshObj({
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


        drum0.setBlend(0.5)
        drum1.setBlend(0.5)
        drum2.setBlend(0.4)
        drum3.setBlend(0.4)
        drum4.setBlend(0.4)

        physicsPlayground.physicsBodiesGenerator(
          "standard",
          {x: 0, y: 150, z: -20},
          {x: 0, y: 0, z: 0},
          "res/textures/star1.png",
          "testGen",
          "Sphere",
          false,
          [1, 1, 1],
          15, 1
        ).then((T) => {


          // app.matrixPhysics.createBoundedSpace(T, {x: 0, y: 15, z: -20}, {x: 5, y: 5, z: 5});


          console.log(T)
          setTimeout(async () => {app.matrixPhysics.lotteryMachineShake(T, 0.001)}, 4000)

          //  app.matrixPhysics.createSphereBoundary(T, {x: 0, y: 25, z: -20}, 20);

        })




        //   console.log(T + "<<<<<<<<<<<<<<<<<<<>>>>>")
      }, 2500)

      if(isMobile() == false) app.activateBloomEffect();
      physicsPlayground.lightContainer[0].setPosY(14);
      physicsPlayground.lightContainer[0].setIntensity(24);
    }
  })
  window.app = physicsPlayground;
}