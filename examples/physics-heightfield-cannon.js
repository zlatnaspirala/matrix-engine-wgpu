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

      // Drop a small cluster of dynamic bodies to demonstrate native terrain collision.
      for(let i = 0;i < 10;i++) {
        const x = ((i % 5) - 2) * 2.2;
        const z = -10 + (Math.floor(i / 5) - 0.5) * 5;
        world.addMeshObj({
          position: {x, y: 12 + (i % 3) * 2, z},
          scale: [0.65, 0.65, 0.65],
          texturesPaths: ['./res/textures/rust.jpg'],
          name: 'terrain-box-' + i,
          mesh: meshes.cube,
          physics: {enabled: true, geometry: 'Cube', mass: 2, friction: 0.8}
        });
      }

      const camera = world.getCamera();
      camera.setYaw(0);
      camera.setPitch(-0.42);
      camera.setZ(24);
      camera.setY(18);
      camera._dirtyAngle = true;

      world.lightContainer[0].setPosY(40);
      world.lightContainer[0].setIntensity(70);
    }
  });
  window.app = world;
};
