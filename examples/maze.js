import MatrixEngineWGPU from '../src/world.js';
import {downloadMeshes} from '../src/engine/loader-obj.js';
import {addRaycastsAABBListener} from "../src/engine/raycast.js";
import {CollisionSystem} from '../src/engine/collision-sub-system.js';

export var mazeGame = function() {
  let maze = new MatrixEngineWGPU({
    canvasSize: 'fullscreen',
    fastRender: 0.8,
    render: 'zero', // test
    dontUsePhysics: true,
    mainCameraParams: {
      type: 'firstPersonCamera',
      responseCoef: 1000
    },
    clearColor: {r: 0, b: 0.122, g: 0.122, a: 1}
  }, () => {
    const mazeSize = 50;
    const spacing = 2;
    maze.collisionSystem = new CollisionSystem(maze);

    maze.addLight();
    addRaycastsAABBListener();
    // 1. Load the Cube Mesh
    downloadMeshes({cube: "./res/meshes/blender/cube.obj"}, (m) => {
      generateMazeLogic(m);
    }, {scale: [1, 1, 1]});

    function generateMazeLogic(meshes) {
      // Create a grid (0 = wall, 1 = path)
      let grid = Array(mazeSize).fill().map(() => Array(mazeSize).fill(0));
      // Basic Recursive Backtracker to ensure ONE path
      function walk(x, y) {
        grid[y][x] = 1;
        let dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]].sort(() => Math.random() - 0.5);
        for(let [dx, dy] of dirs) {
          let nx = x + dx * 2, ny = y + dy * 2;
          if(nx >= 0 && nx < mazeSize && ny >= 0 && ny < mazeSize && grid[ny][nx] === 0) {
            grid[y + dy][x + dx] = 1; // Break the wall
            walk(nx, ny);
          }
        }
      }

      walk(0, 0); // Start generation
      grid[mazeSize - 1][mazeSize - 2] = 1; // Ensure exit point

      // 2. Instantiate the Maze Walls
      for(let y = 0;y < mazeSize;y++) {
        for(let x = 0;x < mazeSize;x++) {
          if(grid[y][x] === 0) {
            const wallName = `wall_${x}_${y}`;
            let test = maze.addMeshObj({
              shadowsCast: false,
              material: {type: 'minia'},
              position: {
                x: x * spacing - (mazeSize * spacing) / 2,
                y: 0,
                z: y * spacing - (mazeSize * spacing) / 2
              },
              texturesPaths: ['./res/textures/tex02.webp'],
              name: wallName,
              mesh: meshes.cube,
              physics: {enabled: false, mass: 0, geometry: "Cube"}
            });
            maze.collisionSystem.register((test.name), test.position, 1.1, 'enemy');

          }
        }
      }

      app.cameras.firstPersonCamera.movementSpeed = 0.05;
      maze.collisionSystem.registerCamera(app.cameras.firstPersonCamera.position, 1.0);
    }

  })
  window.app = maze;
}