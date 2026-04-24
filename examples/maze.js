import MatrixEngineWGPU from '../src/world.js';
import {downloadMeshes} from '../src/engine/loader-obj.js';
import {addRaycastsAABBListener} from "../src/engine/raycast.js";
import {CollisionSystem} from '../src/engine/collision-sub-system.js';

export var mazeGame = function() {
  let maze = new MatrixEngineWGPU({
    canvasSize: 'fullscreen',
    fastRender: 0.8,
    render: 'nano', //'zero', // test
    dontUsePhysics: true,
    mainCameraParams: {
      type: 'firstPersonCamera',
      // type: 'WASD',
      responseCoef: 1000
    },
    clearColor: {r: 0, b: 0.122, g: 0.122, a: 1}
  }, () => {
    let mazeSize = 50;
    const spacing = 2;
    maze.collisionSystem = new CollisionSystem(maze);

    maze.addLight();
    addRaycastsAABBListener();
    // 1. Load the Cube Mesh
    downloadMeshes({cube: "./res/meshes/blender/cube.obj"}, (m) => {
      generateMazeLogic(m);
    }, {scale: [1, 1, 1]});

    function generateMazeLogic(meshes) {
      if(mazeSize % 2 === 0) mazeSize += 1;
      let grid = Array(mazeSize).fill().map(() => Array(mazeSize).fill(0));
      function walk(x, y) {
        grid[y][x] = 1;
        let dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]].sort(() => Math.random() - 0.5);
        for(let [dx, dy] of dirs) {
          let nx = x + dx * 2, ny = y + dy * 2;
          if(nx >= 0 && nx < mazeSize && ny >= 0 && ny < mazeSize && grid[ny][nx] === 0) {
            grid[y + dy][x + dx] = 1;
            walk(nx, ny);
          }
        }
      }
      walk(1, 1); // Start from (1,1) so (0,0) stays wall
      // Seal entire perimeter
      for(let i = 0;i < mazeSize;i++) {
        grid[0][i] = 0;
        grid[mazeSize - 1][i] = 0;
        grid[i][0] = 0;
        grid[i][mazeSize - 1] = 0;
      }
      // Carve entrance top-left, exit bottom-right
      grid[1][0] = 1;                          // entrance: left wall, row 1
      grid[mazeSize - 2][mazeSize - 1] = 1;   // exit: right wall, second-to-last row
      // Instantiate walls (unchanged)
      for(let y = 0;y < mazeSize;y++) {
        for(let x = 0;x < mazeSize;x++) {
          if(grid[y][x] === 0) {
            const wallName = `wall_${x}_${y}`;
            let test = maze.addMeshObj({
              shadowsCast: false,
              material: {type: 'standard'},
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
            maze.collisionSystem.registerStatic((test.name), test.position, 1.1, 'walls');
          }
        }
      }

      console.log('__________________')
      maze.cameras.firstPersonCamera.movementSpeed = 0.03;
      maze.collisionSystem.registerCamera(app.cameras.firstPersonCamera.position, 1.0);

      maze.cameras.firstPersonCamera.setPosition(-49, 0.40, -49);
      maze.cameras.WASD.setPosition(-49, 0.40, -49);

      // close space
      let test2 = maze.addMeshObj({
        shadowsCast: false,
        material: {type: 'standard'},
        position: {
          x: -51,
          y: 0,
          z: -49
        },
        texturesPaths: ['./res/textures/floor1.webp'], 
        // becouse nano render use single mat per objectScene entity text not changed!
        name: 'enter',
        mesh: meshes.cube,
        physics: {enabled: false, mass: 0, geometry: "Cube"}
      });
      maze.collisionSystem.registerStatic((test2.name), test2.position, 1.2, 'walls');

    }




  })
  window.app = maze;
}