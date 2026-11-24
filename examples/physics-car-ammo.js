import MatrixEngineWGPU from "../src/world.js";
import {downloadMeshes} from '../src/engine/loader-obj.js';

/**
 * Raycast vehicle (Ammo btRaycastVehicle).
 * Keys come from the active WASDCamera bitmask (desktop keys and MobileDOM pad):
 * W/Up = engine, S/Down = reverse, A/Left, D/Right = steer, V = brake.
 */
export var carAmmo = function() {
  let carDemo = new MatrixEngineWGPU({
    canvasSize: 'fullscreen',
    useAmmo: true,
    fastRender: 0.8,
    MAX_SPOTLIGHTS: 1,
    MAX_BONES: 0,
    mainCameraParams: {type: 'WASD', responseCoef: 1000},
    clearColor: {r: 0, b: 0.122, g: 0.122, a: 1}
  }, () => {
    carDemo.addLight();
    addEventListener('PhysicsReady', () => {
      downloadMeshes({
        cube: "./res/meshes/blender/cube.obj"
      }, onLoad, {scale: [1, 1, 1]});
    });

    async function onLoad(m) {
      // Shared row-major heightmap used by both the rendered mesh and Ammo's native
      // btHeightfieldTerrainShape. Samples are world-space height units.
      const terrainColumns = 65, terrainRows = 65, terrainElementSize = 2;
      const terrainHeights = new Float32Array(terrainColumns * terrainRows);
      for(let z = 0;z < terrainRows;z++) {
        for(let x = 0;x < terrainColumns;x++) {
          const nx = (x - (terrainColumns - 1) * 0.5) / ((terrainColumns - 1) * 0.5);
          const nz = (z - (terrainRows - 1) * 0.5) / ((terrainRows - 1) * 0.5);
          const hills = Math.sin(nx * 5.2) * Math.cos(nz * 4.4) * 1.15;
          const ridge = Math.sin((nx + nz) * 3.1) * 0.55;
          const bowl = Math.max(0, 1 - (nx * nx + nz * nz)) * 0.8;
          terrainHeights[z * terrainColumns + x] = 2.5 + hills + ridge + bowl;
        }
      }
      carDemo.addProceduralMeshObj({
        name: 'car-terrain',
        position: {x: 0, y: 0, z: -10},
        scale: [1, 1, 1],
        geometryA: {
          type: 'heightfield', size: 1, segments: terrainColumns - 1,
          options: {
            heightData: terrainHeights, columns: terrainColumns, rows: terrainRows,
            elementSize: terrainElementSize
          }
        },
        texturesPaths: ['res/icons/editor/chatgpt-gen-bg-inv.webp'],
        material: {type: 'standard'},
        physics: {enabled: false}
      });
      await carDemo.matrixPhysics.addHeightfield({
        heightData: terrainHeights, columns: terrainColumns, rows: terrainRows,
        elementSize: terrainElementSize, position: {x: 0, y: 0, z: -10},
        friction: 1, name: 'car-terrain'
      });

      // Physics is disabled on the meshes: the vehicle registers the bodies in the worker.
      const chassis = carDemo.addMeshObj({
        position: {x: 0, y: 7, z: -10}, scale: [1, 0.5, 2],
        texturesPaths: ['./res/textures/rust.jpg'],
        name: 'car', mesh: m.cube, physics: {enabled: false}
      });
      // Cube wheels so the spin is visible. Swap m.cube for a wheel mesh with its axle along X.
      const wheels = [0, 1, 2, 3].map(i => carDemo.addMeshObj({
        position: {x: 0, y: 6, z: -10}, scale: [0.25, 0.5, 0.5],
        texturesPaths: ['./res/textures/gold-1.webp'],
        name: 'wheel' + i, mesh: m.cube, physics: {enabled: false}
      }));

      // The vehicle's forward axis is +Z. Rotated 180 deg so W drives away from the chase camera (-Z).
      const vid = await carDemo.matrixPhysics.addVehicle(chassis, wheels, {
        name: 'car', position: {x: 0, y: 6, z: -10}, rotation: {x: 0, y: 180, z: 0},
        scale: [1, 0.5, 2], mass: 800,
        vehicle: {wheelRadius: 0.5}
      });

      const cam = carDemo.cameras.WASD;
      cam.setYaw(0);
      cam.setPitch(-0.35);
      cam.setFollow(chassis.position, [0, 6, 14], 0.08);

      let lastE = 0, lastS = 0, lastB = 0;
      carDemo.autoUpdate.push({
        update: () => {
          cam.updateFollow();
          const d = cam._digital;
          const e = d & 1 ? 1500 : d & 2 ? -800 : 0;
          const s = d & 4 ? 0.4 : d & 8 ? -0.4 : 0;
          const b = d & 16 ? 60 : 0;
          if(e === lastE && s === lastS && b === lastB) return;
          lastE = e; lastS = s; lastB = b;
          carDemo.matrixPhysics.vehicleControl(vid, e, s, b);
        }
      });

      carDemo.lightContainer[0].setPosY(40);
      carDemo.lightContainer[0].setIntensity(60);
    }
  });
  window.app = carDemo;
}
