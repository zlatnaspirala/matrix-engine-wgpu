import MatrixEngineWGPU from "../src/world.js";
import {downloadMeshes} from '../src/engine/loader-obj.js';
import {addRaycastsAABBListener, touchCoordinate} from "../src/engine/raycast.js";
import {isMobile, randomIntFromTo} from "../src/engine/utils.js";
// import {CollisionSystem} from "../src/engine/collision-sub-system.js";

export var loadHZB = function() {

  let HZB = new MatrixEngineWGPU({
    canvasSize: 'fullscreen',
    fastRender: 0.9,
    dontUsePhysics: true,
    MAX_BONES: 0,
    MAX_SPOTLIGHTS: 1,
    mainCameraParams: {
      type: 'WASD',
      responseCoef: 1000
    },
    clearColor: {r: 0, b: 0.122, g: 0.122, a: 1}
  }, () => {

    HZB.addLight();

    touchCoordinate.stopOnFirstDetectedHit = true;

    downloadMeshes({ball: "./res/meshes/blender/sphere.obj", cube: "./res/meshes/blender/cube.obj", },
      onLoadObj, {scale: [1, 1, 1]})
    downloadMeshes({cube: "./res/meshes/blender/cube.obj"}, onGround, {scale: [30, 0.5, 30]})

    addRaycastsAABBListener('canvas1', 'click');
    // Keep track of our grid objects globally within the block scope
    let activeGridCubes = [];
    let completedCubesCount = 0;
    const totalCubesInGrid = 9; // 3x3 grid

    function onGround(m) {
      HZB.addMeshObj({
        material: {type: 'standard', share: true},
        position: {x: 0, y: -1.1, z: -10},
        rotation: {x: 0, y: 0, z: 0},
        rotationSpeed: {x: 0, y: 0, z: 0},
        texturesPaths: ['./res/textures/floor1.webp'],
        name: 'floor',
        mesh: m.cube,
        physics: {enabled: false, mass: 0, geometry: "Cube"}
      })
    }

    function createCube(mesh, options = {}) {
      return HZB.addMeshObj({
        material: {type: options.materialType || 'dark'},
        position: {x: options.x || 0, y: options.y || 3, z: options.z || -15},
        rotation: {x: 0, y: 0, z: 0},
        rotationSpeed: {x: 0, y: 0, z: 0},
        scale: options.scale || [3.5, 3.5, 3.5],
        texturesPaths: ['./res/textures/floor1.webp', './res/textures/env-maps/sky1_lod_mid.webp'],
        name: options.name || 'cube',
        mesh: mesh,
        envMapParams: {
          baseColorMix: 0.1,
          mirrorTint: [0.9, 0.95, 1.0],
          reflectivity: 0.75,
          illuminateColor: [0.3, 0.7, 1.0],
          illuminateStrength: 1.5,
          illuminatePulse: 0.1,
          fresnelPower: 5,
          envLodBias: 1.5,
          usePlanarReflection: false,
        },
        raycast: {enabled: true, radius: 1},
        physics: {enabled: false, mass: 0, geometry: "Cube"},
        pointerEffect: {enabled: true}
      });
    }

    // --- Dynamic Single Lap Runner ---
    function runSingleLap(cubeObj, startX, startZ, row, col) {
      cubeObj.position.setSpeed(0.2);

      const travelDistance = 12;
      const groundY = 3;
      const peakY = 11;

      const pathPoints = [
        {x: startX + travelDistance, y: groundY, z: startZ},
        {x: startX + travelDistance, y: peakY, z: startZ - travelDistance},
        {x: startX, y: peakY, z: startZ - travelDistance},
        {x: startX, y: groundY, z: startZ}
      ];

      let currentStep = 0;

      function executeNextMove() {
        const target = pathPoints[currentStep];

        cubeObj.position.translateByX(target.x);
        cubeObj.position.translateByY(target.y);
        cubeObj.position.translateByZ(target.z);

        cubeObj.position.onTargetPositionReach = () => {
          cubeObj.position.onTargetPositionReach = null;

          if(currentStep === 3) {
            // Final home spin flourish
            console.log('test rotate')
            cubeObj.rotationSpeed.y = 10;

            setTimeout(() => {
              cubeObj.rotationSpeed.y = 0;
              cubeObj.rotation.y = 0;

              completedCubesCount++;

              if(completedCubesCount === totalCubesInGrid) {
                console.log("All cubes parked! Starting global sequence cooldown...");

                setTimeout(() => {
                  triggerEntireGridSequence();
                }, 2000);
              }

            }, 600);
          } else {
            currentStep++;
            executeNextMove();
          }
        };
      }

      // Maintain our staggered cascading wave entry timing
      setTimeout(() => {
        executeNextMove();
      }, (row + col) * 250);
    }

    function triggerEntireGridSequence() {
      completedCubesCount = 0;
      console.log("🎬 Playing layout sequence again...");
      activeGridCubes.forEach(item => {
        item.cube.position.x = item.startX;
        item.cube.position.y = 3;
        item.cube.position.z = item.startZ;
        runSingleLap(item.cube, item.startX, item.startZ, item.row, item.col);
      });
    }

    HZB.triggerEntireGridSequence = triggerEntireGridSequence;

    function generateCubeGrid(mesh, rows = 3, cols = 3, spacing = 12) {
      const startX = -((cols - 1) * spacing) / 2;
      const startZ = -15;

      for(let r = 0;r < rows;r++) {
        for(let c = 0;c < cols;c++) {
          const posX = startX + (c * spacing);
          const posZ = startZ + (r * spacing);
          const cubeName = `cube_r${r}_c${c}`;

          let newCube = createCube(mesh, {
            x: posX,
            y: 3,
            z: posZ,
            name: cubeName
          });

          activeGridCubes.push({
            cube: newCube,
            startX: posX,
            startZ: posZ,
            row: r,
            col: c
          });
        }
      }
    }

    async function onLoadObj(m) {
      // Skybox sphere
      HZB.addMeshObj({
        material: {type: 'dark', share: true},
        position: {x: 0, y: -1, z: -20},
        rotation: {x: 0, y: 0.1, z: 0},
        scale: [100, 100, 100],
        rotationSpeed: {x: 0, y: 0.02, z: 0},
        texturesPaths: ['./res/textures/env-maps/sky1_lod_mid.webp'],
        name: 'sky',
        mesh: m.ball,
        physics: {enabled: false, geometry: "Sphere"}
      });

      // Construct structural dataset layout
      generateCubeGrid(m.cube, 3, 3, 12);

      setTimeout(() => {
        HZB.lightContainer[0].setIntensity(14);
        HZB.activateBloomEffect();
        HZB.bloomPass.setBlurRadius(16);
        HZB.activateVolumetricEffect({
          density: 0.03,
          steps: 32,
          scatterStrength: 0.8,
          heightFollowoff: 0.08,
          lightColor: [2.0, 0.8, 0.5],
        });
        HZB.activateHZB();

        HZB.lightContainer[0].setPosition(0, 45, -10);
        HZB.lightContainer[0].setTarget(0, 0, -10);

        app.buildLightShadowBuckets();
        app.getSceneObjectByName('sky').setAmbient(2, 0.5, 1);
        let cam = app.getCamera();
        cam.setYaw(-0.0);
        cam.setPitch(-0.29);
        cam.setZ(25);
        cam.setY(5);
        HZB.getCamera().setPosition(0, 3, 10);
        // app.buildRenderBuckets();
        // 🚀 First main playback run trigger
        triggerEntireGridSequence();
        cam._dirtyAngle = true;
      }, 700);
    }

    HZB.canvas.addEventListener("ray.hit.event", (e) => {
      if(e.detail.hitObject.name.startsWith('cube')) {
        e.detail.hitObject.setAmbient(randomIntFromTo(1, 7), randomIntFromTo(1, 2), randomIntFromTo(1, 5));
        app.bloomPass.setBlurRadius(randomIntFromTo(1, 5))
      }
    });

  })
  window.app = HZB;
}