import MatrixEngineWGPU from "../src/world.js";
import {downloadMeshes} from '../src/engine/loader-obj.js';
import {LOG_MATRIX} from "../src/engine/utils.js";
import {addRaycastsListener} from "../src/engine/raycast.js";
import {MeshMorpher} from "../src/engine/procedural-mesh.js";
// import {uploadGLBModel} from "../src/engine/loaders/webgpu-gltf.js";
import {PVector} from "../src/engine/matrix-class.js";

export var physicsPlayground = function() {
  let physicsPlayground = new MatrixEngineWGPU({
    canvasSize: 'fullscreen',
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
        ball: "./res/meshes/shapes/sphere-uv-cilinder-proj.obj",
        reel: "./res/meshes/obj/reel.obj"
      }, onGround, {scale: [1, 1, 1]})
      // physicsPlayground.matrixPhysics.speedUpSimulation = 4;

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

      physicsPlayground.physicsBodiesGeneratorDeepPyramid(
        "standard", {x: 0, y: 1, z: -20}, {x: 0, y: 0, z: 0},
        "./res/textures/gold-1.webp", "pyr", 5, true, [1, 1, 1], 2, 400
      );

      // Buildin options
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
          e.detail.rayDirection[2] * strength));
      //   app.matrixPhysics.explode(b,
      //     e.detail.hitObject.position.x * strength,
      //     e.detail.hitObject.position.y * strength,
      //     e.detail.hitObject.position.z * strength, 4, 1);
      });
    })

    async function onGround(m) {

      // Not tested
      // var glbFile01 = await fetch("res/meshes/glb/monster.glb").then(res => res.arrayBuffer().then(buf => uploadGLBModel(buf, physicsPlayground.device)));
      // let myComplexGeometry2 = physicsPlayground.addGlbObj({
      //   material: {type: 'pong', useTextureFromGlb: true},
      //   useScale: true,
      //   scale: [10, 10, 10],
      //   position: {x: -10, y: 6, z: -10},
      //   name: 'firstGlb',
      //   texturesPaths: ['./res/meshes/glb/textures/mutant_origin.webp'],
      //   physics: {
      //     enabled: true,
      //     mass: 2,
      //     geometry: "Cube",
      //     vertices: m.reel.vertices
      //   }
      // }, null, glbFile01);
      // console.log('1myComplexGeometry', myComplexGeometry2)

      // Test complex geometry with ConvexHull
      const myComplexGeometry = physicsPlayground.addMeshObj({
        material: {type: 'standard'},
        position: {x: 8, y: 4, z: -6},
        rotation: {x: 0, y: 0, z: 0.02},
        scale: [3, 3, 3],
        texturesPaths: ['./res/textures/slot/reel1.webp'],
        name: 'MyHull',
        mesh: m.reel,
        physics: {
          enabled: true,
          mass: 2,
          geometry: "ConvexHull",
          vertices: m.reel.vertices
        },
        raycast: {enabled: true, radius: 1}
      });

      app.cameras.WASD.setYaw(-0.03);
      app.cameras.WASD.setPitch(-0.49);
      app.cameras.WASD.setZ(0);
      app.cameras.WASD.setY(3.76);
      app.cameras.WASD._dirtyAngle = true;

      physicsPlayground.addMeshObj({
        material: {type: 'standard'},
        position: {x: 0, y: 1255, z: -20},
        rotation: {x: 0, y: 0, z: 0},
        rotationSpeed: {x: 0, y: 111, z: 0},
        scale: [5, 5, 5],
        texturesPaths: ['./res/textures/floor1.webp'],
        name: 'ball1',
        mesh: m.ball,
        physics: {
          enabled: true,
          geometry: "Sphere"
        },
        raycast: {enabled: true, radius: 1}
      })

      physicsPlayground.addMeshObj({
        position: {x: 0, y: 0, z: -10},
        rotation: {x: 0, y: 0, z: 0},
        rotationSpeed: {x: 0, y: 0, z: 0},
        scale: [25, 0.01, 25],
        texturesPaths: ['res/icons/editor/chatgpt-gen-bg-inv.png'],
        name: 'ground',
        mesh: m.cube,
        physics: {
          enabled: false,
          mass: 0,
          geometry: "Cube"
        }
      });

      // let test = MeshMorpher.compose(
      //   {shape: MeshMorpher.capsule(1), offset: [0, 0, 0]},
      //   {shape: MeshMorpher.cube(1), offset: [0, 0, 0]},
      // );

      physicsPlayground.addProceduralMeshObj({
        material: {type: 'standard'},
        position: {x: 10, y: 15, z: -7},
        rotation: {x: 0, y: 0, z: 0},
        scale: [1, 1, 1],
        rotationSpeed: {x: 0, y: 0, z: 0},
        texturesPaths: ['./res/textures/cube-g1_low.webp'],
        meshA: MeshMorpher.capsule(1, 2, false),
        meshB: MeshMorpher.cube(1),
        name: `morph_1`,
        physics: {
          enabled: true,
          geometry: "Capsule",
          mass: 1,
          radius: 1.0,
          height: 2.0
        },
        raycast: {enabled: true, radius: 1}
      });

      physicsPlayground.addProceduralMeshObj({
        material: {type: 'standard'},
        position: {x: 6, y: 15, z: -7},
        rotation: {x: 0, y: 0, z: 0},
        scale: [1, 1, 1],
        rotationSpeed: {x: 0, y: 0, z: 0},
        texturesPaths: ['./res/textures/cube-g1_low.webp'],
        meshA: MeshMorpher.cylinder(1, 2),
        meshB: MeshMorpher.cube(1),
        name: `morph_cylinder`,
        physics: {
          enabled: true,
          geometry: "Cylinder",
          mass: 1,
          radius: 1.0,
          height: 2.0
        },
        raycast: {enabled: true, radius: 1}
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
          height: 3
        },
        raycast: {enabled: true, radius: 1}
      });

      app.activateBloomEffect();
      // physicsPlayground.lightContainer[0].behavior.setOsc0(-1, 1, 0.001)
      // physicsPlayground.lightContainer[0].behavior.value_ = -1;
      // physicsPlayground.lightContainer[0].updater.push((light) => {
      //   light.setPosX(light.behavior.setPath0())
      // })
      physicsPlayground.lightContainer[0].setPosY(14);
      physicsPlayground.lightContainer[0].setIntensity(24);
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



      var TEST = physicsPlayground.getSceneObjectByName('cube1');
      console.log(`%c Test access scene ${TEST} object.`, LOG_MATRIX);

      physicsPlayground.canvas.addEventListener("ray.hit.event", (e) => {
        console.log('ray.hit.event:', e.detail);
        const physics = app.matrixPhysics; // The engine instance
        const body = physics.getBodyByName(e.detail.hitObject.name);
        if(!body) return;
        // 1. Apply Impulse up
        // physics.applyImpulse(body, new PVector(0, 5, 0));
        // 2. Set Angular Velocity
        // physics.setAngularVelocity(body, new PVector(0, 9, 9));
        // 3. Directional hit based on ray
        // const dir = e.detail.rayDirection; // assuming [x, y, z]
        // const strength = 20;
        // physics.applyImpulse(body, new PVector(
        //   dir[0] * strength,
        //   dir[1] * strength,
        //   dir[2] * strength
        // ));
        // 4. Explosion example
        // const hitPos = new PVector(e.detail.hitPoint.x, e.detail.hitPoint.y, e.detail.hitPoint.z);
        // physics.explode(hitPos, 10, 50);
        // 5. Change Materials
        // const metal = {friction: 0.4, restitution: 0.1};
        // physics.setMaterial(body, metal.friction, metal.restitution);
      });
    }
  })
  window.app = physicsPlayground;
}