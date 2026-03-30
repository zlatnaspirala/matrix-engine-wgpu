import MatrixEngineWGPU from "../src/world.js";
import {downloadMeshes} from '../src/engine/loader-obj.js';
import {LOG_MATRIX} from "../src/engine/utils.js";
import {addRaycastsListener} from "../src/engine/raycast.js";
import {MeshMorpher} from "../src/engine/procedural-mesh.js";
import {uploadGLBModel} from "../src/engine/loaders/webgpu-gltf.js";

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

    addEventListener('AmmoReady', () => {
      downloadMeshes({
        cube: "./res/meshes/blender/cube.obj",
        ball: "./res/meshes/shapes/sphere.obj",
        reel: "./res/meshes/obj/reel.obj"
      }, onGround, {scale: [1, 1, 1]})
      physicsPlayground.matrixAmmo.speedUpSimulation = 4;

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

      // Buildin options
      // app.physicsBodiesGeneratorWall(
      //   "standard",
      //   {x: -4.5, y: 0, z: -10},
      //   {x: 0, y: 0, z: 0},
      //   ["./res/textures/rust.jpg",], // "./res/textures/env-maps/sky1.webp"],
      //   'my_set_walls', "2x2", true, [1, 1, 1], 2, 70);

      let strength = 10;
      physicsPlayground.canvas.addEventListener("ray.hit.event", (e) => {
        console.log('ray.hit.event detected');
        let b = app.matrixAmmo.getBodyByName(e.detail.hitObject.name);
        const i = new Ammo.btVector3(
          e.detail.rayDirection[0] * strength,
          e.detail.rayDirection[1] * strength,
          e.detail.rayDirection[2] * strength
        );
        b.applyCentralImpulse(i);
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
        position: {x: -12, y: 3, z: -6},
        rotation: {x: 0, y: 0, z: 0.02},
        scale: [2, 2, 2],
        texturesPaths: ['./res/textures/blankgray2.webp'],
        name: 'edgeTop',
        mesh: m.reel,
        physics: {
          enabled: true,
          mass: 2,
          geometry: "ConvexHull",
          vertices: m.reel.vertices
        }
      });

      // setTimeout(() => {
      app.cameras.WASD.yaw = -0.03;
      app.cameras.WASD.pitch = -0.49;
      app.cameras.WASD.position[2] = 0;
      app.cameras.WASD.position[1] = 3.76;
      app.cameras.WASD._dirtyAngle = true;
      // }, 1000);

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
        position: {x: 10, y: 5, z: -7},
        rotation: {x: 0, y: 0, z: 0},
        scale: [1, 1, 1],
        rotationSpeed: {x: 0, y: 0, z: 0},
        texturesPaths: ['./res/textures/cube-g1_low.webp'],
        meshA: MeshMorpher.capsule(1, 2),
        meshB: MeshMorpher.cube(1),
        name: `morph_1`,
        physics: {
          enabled: true,
          geometry: "Capsule",
          mass: 5,
          radius: 1.0,
          height: 2.0
        }
      });

      physicsPlayground.addProceduralMeshObj({
        material: {type: 'standard'},
        position: {x: 6, y: 5, z: -7},
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
          mass: 5,
          radius: 1.0,
          height: 2.0
        }
      });

      physicsPlayground.addProceduralMeshObj({
        material: {type: 'standard'},
        position: {x: 1, y: 3, z: -7},
        rotation: {x: 0, y: 0, z: 0},
        scale: [1, 1, 1],
        rotationSpeed: {x: 0, y: 0, z: 0},
        texturesPaths: ['./res/textures/cube-g1_low.webp'],
        meshA: MeshMorpher.cone(1, 5, false),
        meshB: MeshMorpher.cube(1),
        name: `morph_cone`,
        physics: {
          enabled: true,
          geometry: "Cone",
          mass: 5,
          radius: 1,
          height: 5
        }
      });

      physicsPlayground.addProceduralMeshObj({
        material: {type: 'standard'},
        position: {x: -4, y: 3, z: -7},
        rotation: {x: 0, y: 0, z: 0},
        scale: [1, 1, 1],
        rotationSpeed: {x: 0, y: 0, z: 0},
        texturesPaths: ['./res/textures/cube-g1_low.webp'],
        meshA: MeshMorpher.coneX(1, 4, false),
        meshB: MeshMorpher.cube(1),
        name: `morph_ConeX`,
        physics: {
          enabled: true,
          geometry: "ConeX",
          mass: 5,
          radius: 1,
          height: 4
        }
      });

      app.physicsBodiesGeneratorWall(
        "standard",
        {x: -5, y: 3, z: -20},
        {x: 0, y: 0, z: 0},
        ["./res/textures/rust.jpg",],
        'my_set_walls', "6x5", true, [1, 1, 1], 2, 70);

      app.activateBloomEffect();

      physicsPlayground.lightContainer[0].behavior.setOsc0(-1, 1, 0.001)
      physicsPlayground.lightContainer[0].behavior.value_ = -1;
      physicsPlayground.lightContainer[0].updater.push((light) => {
        light.setPosX(light.behavior.setPath0())
      })
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
  window.app = physicsPlayground;
}