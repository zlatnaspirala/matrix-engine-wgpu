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

    let PLANE;
    physicsPlayground.addLight();
    addRaycastsListener();
    addEventListener('PhysicsReady', () => {
      downloadMeshes({
        cube: "./res/meshes/blender/cube.obj",
        plane: "./res/meshes/blender/plane-sub10.obj",
        ball: "./res/meshes/shapes/sphere-uv-cilinder-proj.obj",
        reel: "./res/meshes/obj/reel.obj"
      }, onGround, {scale: [1, 1, 1]})

      physicsPlayground.matrixPhysics.speedUpSimulation(2);

      physicsPlayground.physicsBodiesChain(undefined, {x: -6, y: 20, z: -10},
        undefined, "./res/meshes/obj/modelpack19/hang2/512/hang2.webp", 'hang2'
        , 5, true, undefined, undefined, undefined,
        "./res/meshes/obj/modelpack19/hang2/hang2.obj");

      physicsPlayground.physicsBodiesChain(undefined, {x: 6, y: 20, z: -10},
        undefined, "./res/meshes/obj/modelpack19/hang2/512/hang2.webp", 'hang22'
        , 5, true, undefined, undefined, undefined,
        "./res/meshes/obj/modelpack19/hang2/hang2.obj");

      physicsPlayground.physicsBodiesGeneratorDeepPyramid(
        "standard", {x: 0, y: 1, z: -20}, {x: 0, y: 0, z: 0},
        "./res/textures/gold-1.webp", "pyr", 2, true, [1, 1, 1], 2, 400
      );

      const W = 8;
      const H = 8;
      const NX = 10;
      const NY = 10;

      PLANE = app.addProceduralMeshObj({
        position: {x: 0, y: 15, z: -10},
        scale: [1, 1, 1],
        name: 'test',
        resolutionU: NX,
        resolutionV: NY,
        texturesPaths: ['./res/meshes/obj/modelpack19/hand-logo.webp'],
        meshA: MeshMorpher.clothPlane(W, H),
        meshB: MeshMorpher.clothPlane(W, H),
        physics: {
          enabled: true,
          geometry: "Cloth",
          nx: NX,
          ny: NY,
          width: W,
          height: H,
          pinTop: true
        }
      });

      // Buildin options
      app.physicsBodiesGeneratorWall("standard",
        {x: -4.5, y: 1, z: -10}, {x: 0, y: 0, z: 0},
        ["./res/textures/rust.jpg",],
        'my_set_walls', "5x3", true, [1, 1, 1], 2.05, 1000, "ByZ");

      let strength = 10;
      physicsPlayground.canvas.addEventListener("ray.hit.event", (e) => {
        console.log('ray.hit.event detected');
        let b = app.matrixPhysics.getBodyByName(e.detail.hitObject.name);
        app.matrixPhysics.applyImpulse(b, new PVector(
          e.detail.rayDirection[0] * strength,
          e.detail.rayDirection[1] * strength,
          e.detail.rayDirection[2] * strength))
        // if(e.detail.hitObject.name === 'test') {
        applyWindToCloth()
        // }
      });

      function applyWindToCloth(startIndex = 1, count = 121, nx = 10) {
        for(let i = 0;i < count;i++) {
          const row = Math.floor(i / (nx + 1));
          if(row === 0) continue;
          app.matrixPhysics.applyImpulse(startIndex + i, {
            x: Math.sin(performance.now() * 0.001) * 0.01,
            y: 0.01,
            z: 0.01
          });
        }
      }

    })

    async function onGround(m) {
      setTimeout(() => {
        PLANE.vertexAnim.enableCloth(1);
        app.activateHZB();
      }, 500)
      let cam = app.getCamera();
      cam.setYaw(-0.03);
      cam.setPitch(-0.49);
      cam.setZ(0);
      cam.setY(3.76);
      cam._dirtyAngle = true;

      physicsPlayground.addMeshObj({
        material: {type: 'standard'},
        position: {x: 0, y: 15, z: -20},
        rotation: {x: 0, y: 0, z: 0},
        rotationSpeed: {x: 0, y: 111, z: 0},
        scale: [5, 5, 5],
        texturesPaths: ['./res/meshes/obj/modelpack19/hand-logo.webp'],
        name: 'ball1',
        mesh: m.ball,
        physics: {
          enabled: true,
          geometry: "Sphere",
          group: 2,
          mask: -1,
        },
        raycast: {enabled: true, radius: 1}
      })

      physicsPlayground.addMeshObj({
        position: {x: 0, y: -0.5, z: -10},
        rotation: {x: 0, y: 0, z: 0},
        rotationSpeed: {x: 0, y: 0, z: 0},
        scale: [25, 0.1, 25],
        texturesPaths: ['res/icons/editor/chatgpt-gen-bg-inv.webp'],
        name: 'ground',
        mesh: m.plane,
        physics: {enabled: false}
      });

      physicsPlayground.addProceduralMeshObj({
        material: {type: 'standard'},
        position: {x: 1, y: 3, z: -7},
        rotation: {x: 0, y: 0, z: 0},
        scale: [1, 1, 1],
        rotationSpeed: {x: 0, y: 0, z: 0},
        texturesPaths: ['./res/textures/cube-g1_low.webp'],
        meshA: MeshMorpher.cone(1, 3, false),
        meshB: MeshMorpher.cube(1),
        name: `morph_cone`,
        physics: {
          enabled: true,
          geometry: "Cone",
          mass: 1,
          radius: 1,
          height: 3,
          group: 2,
          mask: -1,
        },
        raycast: {enabled: true, radius: 1}
      });

      app.activateBloomEffect();
      app.activateVolumetricEffect();
      

      physicsPlayground.lightContainer[0].setPosY(65);
      physicsPlayground.lightContainer[0].setIntensity(100);
    }
  })
  window.app = physicsPlayground;
}