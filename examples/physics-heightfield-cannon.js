import MatrixEngineWGPU from "../src/world.js";
import {downloadMeshes} from '../src/engine/loader-obj.js';

// Cannon-es native Heightfield terrain demo (demo 54).
export var heightfieldCannon = function() {
  const world = new MatrixEngineWGPU({
    canvasSize: 'fullscreen',
    useCannon: true,
    fastRender: 0.9,
    MAX_SPOTLIGHTS: 1,
    MAX_BONES: 0,
    mainCameraParams: {type: 'WASD', responseCoef: 1000},
    clearColor: {r: 0, g: 0.122, b: 0.122, a: 1}
  }, () => {
    world.addLight();
    addEventListener('PhysicsReady', () => {
      downloadMeshes({
        cube: "./res/meshes/blender/cube.obj",
        ball: "./res/meshes/shapes/sphere.obj"
      }, onMeshesLoaded, {scale: [1, 1, 1]});
    });

    async function onMeshesLoaded(meshes) {
      const columns = 65, rows = 65, elementSize = 2;
      const heights = new Float32Array(columns * rows);
      for(let z = 0;z < rows;z++) {
        for(let x = 0;x < columns;x++) {
          const nx = (x - (columns - 1) * 0.5) / ((columns - 1) * 0.5);
          const nz = (z - (rows - 1) * 0.5) / ((rows - 1) * 0.5);
          const hills = Math.sin(nx * 5.2) * Math.cos(nz * 4.4) * 1.15;
          const ridge = Math.sin((nx + nz) * 3.1) * 0.55;
          const bowl = Math.max(0, 1 - (nx * nx + nz * nz)) * 0.8;
          heights[z * columns + x] = 2.5 + hills + ridge + bowl;
        }
      }

      world.addProceduralMeshObj({
        name: 'cannon-heightfield-visual',
        position: {x: 0, y: 0, z: -10},
        scale: [1, 1, 1],
        geometryA: {
          type: 'heightfield', size: 1, segments: columns - 1,
          options: {heightData: heights, columns, rows, elementSize}
        },
        texturesPaths: ['res/icons/editor/chatgpt-gen-bg-inv.webp'],
        material: {type: 'standard'},
        physics: {enabled: false}
      });

      await world.matrixPhysics.addHeightfield({
        heightData: heights, columns, rows, elementSize,
        position: {x: 0, y: 0, z: -10},
        friction: 0.9, name: 'cannon-heightfield'
      });

      // Chassis and wheel meshes are registered by the native Cannon RaycastVehicle.
      const chassis = world.addMeshObj({
        position: {x: 0, y: 5.2, z: -10},
        scale: [1, 0.5, 2],
        texturesPaths: ['./res/textures/rust.jpg'],
        name: 'cannon-car-chassis',
        mesh: meshes.cube,
        physics: {enabled: false}
      });
      const wheelMeshes = [0, 1, 2, 3].map(i => world.addMeshObj({
        position: {x: 0, y: 4.5, z: -10},
        scale: [0.25, 0.5, 0.5],
        texturesPaths: ['./res/textures/gold-1.webp'],
        name: 'cannon-car-wheel-' + i,
        mesh: meshes.cube,
        physics: {enabled: false}
      }));

      const vehicleId = await world.matrixPhysics.addVehicle(chassis, wheelMeshes, {
        name: 'cannon-heightfield-car',
        position: {x: 0, y: 5.2, z: -10},
        rotation: {x: 0, y: 180, z: 0},
        scale: [1, 0.5, 2],
        mass: 800,
        friction: 0.5,
        vehicle: {
          wheelRadius: 0.5,
          suspensionRestLength: 0.6,
          wheelConnectionY: -0.45,
          suspensionStiffness: 30,
          frictionSlip: 5,
          rollInfluence: 0.01
        }
      });

      const camera = world.cameras.WASD;
      camera.setYaw(0);
      camera.setPitch(-0.35);
      camera.setFollow(chassis.position, [0, 6, 14], 0.08);

      let lastEngine = 0, lastSteering = 0, lastBrake = 0;
      world.autoUpdate.push({
        update: () => {
          camera.updateFollow();
          const digital = camera._digital;
          const engine = digital & 1 ? 1500 : digital & 2 ? -800 : 0;
          const steering = digital & 4 ? 0.4 : digital & 8 ? -0.4 : 0;
          const brake = digital & 16 ? 60 : 0;
          if(engine === lastEngine && steering === lastSteering && brake === lastBrake) return;
          lastEngine = engine;
          lastSteering = steering;
          lastBrake = brake;
          world.matrixPhysics.vehicleControl(vehicleId, engine, steering, brake);
        }
      });

      world.lightContainer[0].setPosY(40);
      world.lightContainer[0].setIntensity(70);
    }
  });
  window.app = world;
};
