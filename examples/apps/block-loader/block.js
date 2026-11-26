


// 3. Usage
// Your uploaded JSON export can be loaded directly.

// Kinematic mode
// import { BlockLoader, CollisionSystem } from 'matrix-engine-wgpu';

// app.collisionSystem = new CollisionSystem(app);

// const loader = new BlockLoader(
//   app,
//   meshes.cube,
//   app.collisionSystem
// );

// const response = await fetch('./test-export.json');
// const mapData = await response.json();
// loader.load(mapData, {
//   mode: 'kinematic'
// });

// // Real physics mode
import {BlockLoader} from '../../../src/engine/block-loader.js';

// const loader = new BlockLoader(
//   app,
//   meshes.cube
// );
// loader.load(mapData, {
//   mode: 'physics',
//   mass: 0
// });

import MatrixEngineWGPU from "../../../src/world.js";
import {downloadMeshes} from '../../../src/engine/loader-obj.js';
import {isMobile, loadTextureView, LOG_MATRIX} from "../../../src/engine/utils.js";
import {addRaycastsListener} from "../../../src/engine/raycast.js";
import {PVector} from "../../../src/engine/matrix-class.js";

export var mapToolDemo = function() {
  let physicsPlayground = new MatrixEngineWGPU({
    canvasSize: 'fullscreen',
    useAmmo: true,
    fastRender: 0.8,
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
        ball: "./res/meshes/shapes/sphere-uv-cilinder-proj.obj",
        reel: "./res/meshes/obj/reel.obj"
      }, onGround, {scale: [1, 1, 1]});

      physicsPlayground.matrixPhysics.speedUpSimulation(4);

      app.activateBloomEffect();
      // app.activateVolumetricEffect({density: 0.5, steps: 30, scatterStrength: 2, heightFalloff: 0.2, lightColor: [0, 1.8, 10]})
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
        "./res/textures/gold-1.webp", "pyr", 3, true, [1, 1, 1], 2, 400
      );

      // Buildin options
      app.physicsBodiesGeneratorWall("standard",
        {x: -4.5, y: 0, z: -10}, {x: 0, y: 0, z: 0},
        ["./res/textures/rust.jpg",],
        'my_set_walls', "4x2", true, [1, 1, 1], 2, 70);

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

      const loader = new BlockLoader(
        physicsPlayground,
        m.cube
      );

      const response = await fetch('./res/blocking-map/test-export.json');
      const mapData = await response.json();

      loader.load(mapData, {
        mode: 'physics',
        mass: 0
      });

      // Complex geometry with ConvexHull
      const myComplexGeometry = physicsPlayground.addMeshObj({
        material: {type: 'standard'},
        position: {x: 8, y: 4, z: -6},
        rotation: {x: 0, y: 0, z: 0.02},
        scale: [3, 3, 3],
        texturesPaths: ['./res/textures/slot/reel1-lod0.webp'],
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
        texturesPaths: ['res/icons/editor/chatgpt-gen-bg-inv.webp'],
        name: 'ground',
        mesh: m.cube,
        physics: {
          enabled: false,
          mass: 0,
          geometry: "Cube"
        }
      });

      physicsPlayground.lightContainer[0].setPosY(75);
      physicsPlayground.lightContainer[0].setIntensity(50);


      // app.activateVolumetricEffect({
      //   density: 11,
      //   steps: 64,
      //   scatterStrength: 0.3,
      //   heightFalloff: 4.5,
      //   lightColor: [50, 1, 0]
      // })

      // const jelly = physicsPlayground.addMeshObj({
      //   material: {type: 'standard'},
      //   position: {x: 0, y: 8, z: -10},
      //   scale: [1, 1, 1],
      //   texturesPaths: ['./res/textures/floor1.webp'],
      //   name: 'jelly', mesh: m.ball,
      //   physics: {
      //     enabled: true, geometry: 'SoftBody', mass: 2,
      //     nodeSpacing: 0, group: 2, mask: -1,
      //     vertices: m.ball.vertices, indices: m.ball.indices,
      //     hub: false, radius: 0.1
      //   }
      // });
      // setTimeout(() => jelly.vertexAnim.enableCloth(1), 500);

      app.activateVolumetricTexProj({
        density: 0.03,
        steps: 32,
        scatterStrength: 0.2,
        heightFalloff: 10.8,
        lightColor: [1.0, 1.0, 1.0]
      }
      );
      app.volumetricPass.setDensity(34);
      const view = await loadTextureView(app.device, 'res/textures/shooter/hang3d.png');
      app.volumetricPass.setProjectionTexture(view, app.lightContainer[0].viewProjMatrix);
      app.volumetricPass.setTextureProjectionIntensity(11.0); // 0..2
      // app.volumetricPass.disableTextureProjection();
      // physicsPlayground.activateVolumetricClouds({
      //   qualityScale: 0.35,
      //   steps: 24,
      //   coverage: 0.58,
      //   cloudBase: 2,
      //   cloudTop: 28,
      //   noiseScale: 0.035,
      //   windSpeed: 0.8,
      //   scatterStrength: 0.2,
      // })
      // app.activateVolumetricClouds2({coverage: 0.55, cloudBase: 120, cloudThickness: 60})
      // app.volumetricPass.setCloudLayer(-21, 100);

    }

    function onLoadObj(m) {
      physicsPlayground.myLoadedMeshes = m;

      physicsPlayground.addMeshObj({
        material: {type: 'standard'},
        position: {x: 0, y: 2, z: -20},
        rotation: {x: 0, y: 0, z: 0},
        rotationSpeed: {x: 0, y: 0, z: 0},
        texturesPaths: ['./res/textures/cube-g1-extra_low.png'],
        name: 'cube1',
        mesh: m.cube,
        physics: {
          enabled: true,
          geometry: "Cube",
        },
        raycast: {enabled: true, radius: 1}
      })

      // physicsPlayground.addMeshObj({
      //   material: {type: 'standard'},
      //   position: {x: 0, y: 2, z: -20},
      //   rotation: {x: 0, y: 0, z: 0},
      //   rotationSpeed: {x: 0, y: 0, z: 0},
      //   texturesPaths: ['./res/textures/cube-g1-extra_low.png'],
      //   name: 'cube2',
      //   mesh: m.cube,
      //   physics: {
      //     enabled: false,
      //     geometry: "Cube",
      //   },
      //   raycast: {enabled: true, radius: 1}
      // })



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

mapToolDemo();