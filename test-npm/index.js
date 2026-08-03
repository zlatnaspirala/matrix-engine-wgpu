// import {MatrixEngineWGPU, CameraPath, randomIntFromTo, addRaycastsAABBListener, downloadMeshes} from "matrix-engine-wgpu";

// let cinematicCamera = new MatrixEngineWGPU({
//   canvasSize: 'fullscreen',
//   fastRender: 0.9,
//   dontUsePhysics: true,
//   MAX_SPOTLIGHTS: 1,
//   MAX_BONES: 0,
//   mainCameraParams: {
//     type: 'cinematicCamera',
//     responseCoef: 1000
//   },
//   clearColor: {r: 0, b: 0.122, g: 0.122, a: 1}
// }, () => {

//   cinematicCamera.addLight();
//   // if you double call downloadMeshes for same path engine use cached values no double fetch...
//   downloadMeshes({ball: "./res/meshes/blender/sphere.obj", cube: "./res/meshes/blender/cube.obj", },
//     onLoadObj, {scale: [1, 1, 1]})
//   downloadMeshes({cube: "./res/meshes/blender/cube.obj"}, onGround, {scale: [30, 0.5, 30]})

//   addRaycastsAABBListener('canvas1', 'click');

//   function onGround(m) {
//     cinematicCamera.addMeshObj({
//       material: {type: 'standard', share: true},
//       position: {x: 0, y: -5, z: -10},
//       rotation: {x: 0, y: 0, z: 0},
//       rotationSpeed: {x: 0, y: 0, z: 0},
//       texturesPaths: ['./res/textures/floor1.webp'], //, './res/textures/env-maps/sky1_lod_mid.webp'],
//       name: 'floor',
//       mesh: m.cube,
//       physics: {
//         enabled: false,
//         mass: 0,
//         geometry: "Cube"
//       }
//     })
//   }

//   async function onLoadObj(m) {
//     cinematicCamera.addMeshObj({
//       material: {type: 'standard', share: true},
//       position: {x: 0, y: -1, z: -20},
//       rotation: {x: 0, y: 0, z: 0},
//       scale: [100, 100, 100],
//       rotationSpeed: {x: 0, y: 0.1, z: 0},
//       texturesPaths: ['./res/textures/env-maps/sky1_lod_mid.webp'],
//       name: 'sky',
//       mesh: m.ball,
//       physics: {
//         enabled: false,
//         geometry: "Sphere"
//       }
//     });

//     // share: true if not defined it is false.
//     let MYCUBE = cinematicCamera.addMeshObj({
//       material: {type: 'mirror'},
//       position: {x: 0, y: 4, z: -10},
//       rotation: {x: 0, y: 0, z: 0},
//       rotationSpeed: {x: 0, y: 0, z: 0},
//       scale: [3, 5, 1],
//       texturesPaths: ['./res/textures/floor1.webp', './res/textures/env-maps/sky1_lod_mid.webp'],
//       name: 'cube',
//       mesh: m.cube,
//       envMapParams: {
//         baseColorMix: 0.1,                // CLEAR SKY
//         mirrorTint: [0.9, 0.95, 1.0],     // Slight cool tint
//         reflectivity: 0.75,               // 25% reflection blend
//         illuminateColor: [0.3, 0.7, 1.0], // Soft cyan
//         illuminateStrength: 1.5,          // Gentle rim
//         illuminatePulse: 0.1,             // No pulse (static)
//         fresnelPower: 5,                  // Medium-sharp edge
//         envLodBias: 1.5,
//         usePlanarReflection: false,       // ✅ Env map mode
//       },
//       raycast: {enabled: true, radius: 1},
//       physics: {
//         enabled: false,
//         mass: 0,
//         geometry: "Cube"
//       },
//       pointerEffect: {
//         enabled: true,
//         flameEmitter: true
//         // flameEffect: true
//       }
//     })

//     cinematicCamera.lightContainer[0].setIntensity(5);

//     // if(isMobile() == false) {
//     cinematicCamera.activateBloomEffect();
//     cinematicCamera.lightContainer[0].behavior.setOsc0(-2, 2, 0.01)
//     cinematicCamera.lightContainer[0].behavior.value_ = -1;
//     cinematicCamera.lightContainer[0].updater.push((light) => {
//       light.setTargetX(light.behavior.setPath0());
//       light.setPosX(light.behavior.setPath0());
//     })
//     cinematicCamera.lightContainer[0].setPosition(0, 15, -10);
//     cinematicCamera.lightContainer[0].setTarget(0, 0, -10);
//     // }

//     setTimeout(() => {

//       app.getSceneObjectByName('sky').setAmbient(2, 0.5, 1);

//       // MYCUBE.effects.flameEmitter.setIntensity(100);
//       // MYCUBE.effects.flameEmitter.recreateVertexDataCrazzy(4); 
//       MYCUBE.effects.flameEmitter.rotSpeed = 1;
//       MYCUBE.effects.flameEmitter.recreateVertexDataFromData([
//         -2.582509022040566, 0.21125441598805741, 0.4249951687253338,
//         0.4724163587305734, 2.381811753816671, 3.074841196886901, -2.3797025623904164, -3.4608908819087145]);
//       MYCUBE.setAmbient(2, 3, 0.5);
//       let cam = app.getCamera();
//       cam.setYaw(-0.03);
//       cam.setPitch(-0.49);
//       cam.setZ(10);
//       cam.setY(20);

//       console.log('sssssssssssss')


//       const introPath = new CameraPath([
//         {position: [0, 5, 20], target: [0, 0, 0]},
//         {position: [10, 12, 10], target: [0, 1, 0]},
//         {position: [0, 15, -22], target: [0, 0, 0]},
//       ], {parameterization: 'arc'});

//       cam.setPath(introPath).play({
//         speed: 0.3,
//         onEnd: () => console.log('done'),
//       });

//       cam._dirtyAngle = true;

//       app.buildRenderBuckets();

//     }, 1000);
//   }

//   cinematicCamera.canvas.addEventListener("ray.hit.event", (e) => {
//     console.log('ray.hit.event detected');
//     if(e.detail.hitObject.name.startsWith('cube')) {
//       e.detail.hitObject.effects.flameEmitter.recreateVertexDataCrazzy(5);
//       e.detail.hitObject.effects.flameEmitter.setIntensity(randomIntFromTo(1, 200));
//       e.detail.hitObject.setAmbient(randomIntFromTo(1, 7), randomIntFromTo(1, 2), randomIntFromTo(1, 5));
//       app.bloomPass.setBlurRadius(randomIntFromTo(1, 5))
//     }
//   });

// })
// window.app = cinematicCamera;



import { MatrixEngineWGPU, downloadMeshes, CollisionSystem } from "matrix-engine-wgpu";

let beastApp = new MatrixEngineWGPU({
  canvasSize: 'fullscreen',
  fastRender: 0.9,
  dontUsePhysics: true,
  MAX_SPOTLIGHTS: 1,
  MAX_BONES: 0,
  mainCameraParams: { type: 'firstPersonCamera', responseCoef: 1000 },
  clearColor: {r: 0, g: 0.122, b: 0.122, a: 1}
}, () => {
  beastApp.addLight();
  beastApp.collisionSystem = new CollisionSystem(beastApp);

  let floor;
  downloadMeshes({floor: "./res/meshes/blender/cube.obj"}, onLoadFloor, {scale: [1,1,1]});
  downloadMeshes({cube: "./res/meshes/blender/cube.obj"}, onLoadWalls, {scale: [1,1,1]});

  function onLoadFloor(m) {
    // one long floor slab covering both rooms + tunnel
    floor = beastApp.addMeshObj({
      material: {type: 'standard', share: true},
      position: {x: 0, y: 0, z: -11},
      rotation: {x: 0, y: 0, z: 0},
      scale: [12, 1, 34],       // wide enough for rooms, long enough to span both + tunnel
      texturesPaths: ['./res/textures/floor1.webp'],
      name: 'floor',
      mesh: m.floor,
      physics: {enabled: false, mass: 0, geometry: "Cube"}
    });
    beastApp.collisionSystem.registerStatic(
      floor.name, floor.position, 1.1, 'floor',
      {x: 6, y: 0.5, z: 17}   // == scale/2
    );
  }

function addWall(x, z, orientation, length, i) {
  const THICK = 0.4;
  const HALF_HEIGHT = 1.5;
  const scale = orientation === 'x'
    ? [length, HALF_HEIGHT * 2, THICK]
    : [THICK, HALF_HEIGHT * 2, length];
  const half = orientation === 'x'
    ? {x: length / 2, y: HALF_HEIGHT, z: THICK / 2}
    : {x: THICK / 2, y: HALF_HEIGHT, z: length / 2};

  let wall = beastApp.addMeshObj({
    material: {type: 'standard', share: true},
    position: {x, y: HALF_HEIGHT, z},
    rotation: {x: 0, y: 0, z: 0},
    scale,
    texturesPaths: ['./res/textures/rust.jpg'],
    name: `wall_${i}`,
    mesh: beastApp._mazeCube,
    physics: {enabled: false, mass: 0, geometry: "Cube"}
  });
  beastApp.collisionSystem.registerStatic(wall.name, wall.position, 1.1, 'walls', half);
}

function onLoadWalls(m) {
  beastApp._mazeCube = m.cube;
  let i = 0;

  // ROOM A — outer walls (x-oriented) extended by THICK to cover corners: length 10.4
  addWall(0, -5, 'x', 10.4, i++);                // north wall (full, no gap)
  addWall(-3.6, 5, 'x', 3.2, i++);                // south wall, left segment (gap x:-2..2)
  addWall(3.6, 5, 'x', 3.2, i++);                 // south wall, right segment
  // side walls (z-oriented) trimmed by THICK so they stop at north/south inner faces: length 9.6
  addWall(-5, 0, 'z', 9.6, i++);                  // west wall
  addWall(5, 0, 'z', 9.6, i++);                   // east wall

  // TUNNEL — extend slightly (+THICK each end) to close the seam at the room gaps
  addWall(-1, 11, 'z', 12.4, i++);                // tunnel west wall
  addWall(1, 11, 'z', 12.4, i++);                 // tunnel east wall

  // ROOM B — mirrored
  addWall(-3.6, 17, 'x', 3.2, i++);               // north wall, left segment (gap x:-2..2)
  addWall(3.6, 17, 'x', 3.2, i++);                // north wall, right segment
  addWall(0, 27, 'x', 10.4, i++);                 // south wall (full)
  addWall(-5, 22, 'z', 9.6, i++);                 // west wall
  addWall(5, 22, 'z', 9.6, i++);                  // east wall

  beastApp.cameras.firstPersonCamera.position = new Float32Array([0, 5.8, 3]);
  beastApp.cameras.firstPersonCamera.movementSpeed = 0.1;
  beastApp.collisionSystem.registerCamera(beastApp.cameras.firstPersonCamera.position, 1.0);
}
});
window.app = beastApp;