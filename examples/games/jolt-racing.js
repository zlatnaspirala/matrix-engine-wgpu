import MatrixEngineWGPU from "../src/world.js";
import {downloadMeshes} from '../src/engine/loader-obj.js';

// Jolt-powered open-world oval racer.
// Demo 56: tiled heightfield terrain, native vehicle constraint, GPU culling and motion blur.
export var joltRaceGame = function() {
  const world = new MatrixEngineWGPU({
    canvasSize: 'fullscreen',
    useJolt: true,
    render: 'GPUInstancedDraw',
    GPUCullingRad: 180,
    fastRender: 0.9,
    MAX_SPOTLIGHTS: 1,
    MAX_BONES: 0,
    mainCameraParams: {type: 'WASD', responseCoef: 1000},
    clearColor: {r: 0.025, g: 0.055, b: 0.075, a: 1}
  }, () => {
    world.addLight();

    addEventListener('PhysicsReady', () => {
      downloadMeshes({
        cube: "./res/meshes/blender/cube.obj",
        ball: "./res/meshes/shapes/sphere.obj"
      }, onMeshesLoaded, {scale: [1, 1, 1]});
    });

    // Smooth, world-coordinate terrain function. Adjacent heightfield tiles sample
    // the same function, so their shared edges have identical heights.
    const terrainHeight = (x, z) =>
      1.45 +
      Math.sin(x * 0.035) * 0.20 +
      Math.cos(z * 0.041) * 0.17 +
      Math.sin((x + z) * 0.025) * 0.13 +
      Math.cos((x - z) * 0.018) * 0.08;

    // The course is an oval centred at (0, -10), on a four-tile 256x256 world.
    const COURSE = {xRadius: 38, zRadius: 27, centerZ: -10};
    const coursePoint = t => ({
      x: COURSE.xRadius * Math.cos(t),
      z: COURSE.centerZ + COURSE.zRadius * Math.sin(t)
    });

    async function onMeshesLoaded(meshes) {
      const tileSamples = 65;
      const tileSpacing = 2;
      const tileSize = (tileSamples - 1) * tileSpacing;
      const tileCenters = [-tileSize * 0.5, tileSize * 0.5];

      // Four moderate native heightfields instead of one oversized terrain body.
      for(const centerX of tileCenters) {
        for(const centerZ of tileCenters) {
          const heights = new Float32Array(tileSamples * tileSamples);
          for(let z = 0;z < tileSamples;z++) {
            for(let x = 0;x < tileSamples;x++) {
              const worldX = centerX + (x - (tileSamples - 1) * 0.5) * tileSpacing;
              const worldZ = centerZ + (z - (tileSamples - 1) * 0.5) * tileSpacing;
              heights[z * tileSamples + x] = terrainHeight(worldX, worldZ);
            }
          }

          const tileName = `race-terrain-${centerX}-${centerZ}`;
          world.addProceduralMeshObj({
            name: tileName + '-visual',
            position: {x: centerX, y: 0, z: centerZ},
            scale: [1, 1, 1],
            geometryA: {
              type: 'heightfield',
              size: 1,
              segments: tileSamples - 1,
              options: {
                heightData: heights,
                columns: tileSamples,
                rows: tileSamples,
                elementSize: tileSpacing
              }
            },
            texturesPaths: ['res/icons/editor/chatgpt-gen-bg-inv.webp'],
            material: {type: 'standard', share: true},
            physics: {enabled: false}
          });

          await world.matrixPhysics.addHeightfield({
            heightData: heights,
            columns: tileSamples,
            rows: tileSamples,
            elementSize: tileSpacing,
            position: {x: centerX, y: 0, z: centerZ},
            friction: 0.95,
            name: tileName
          });
        }
      }

      // Track ribbon and safety rails. The physics surface remains the continuous
      // heightfield beneath it, so the car never depends on decorative mesh colliders.
      const trackSegments = 112;
      for(let i = 0;i < trackSegments;i++) {
        const a = coursePoint((i / trackSegments) * Math.PI * 2);
        const b = coursePoint(((i + 1) / trackSegments) * Math.PI * 2);
        const dx = b.x - a.x;
        const dz = b.z - a.z;
        const length = Math.hypot(dx, dz);
        const angle = Math.atan2(dx, dz) * 180 / Math.PI;
        const x = (a.x + b.x) * 0.5;
        const z = (a.z + b.z) * 0.5;
        const y = terrainHeight(x, z);

        world.addMeshObj({
          name: `race-road-${i}`,
          position: {x, y: y + 0.055, z},
          rotation: {x: 0, y: angle, z: 0},
          scale: [8.8, 0.12, length + 0.35],
          texturesPaths: ['./res/textures/floor1.webp'],
          material: {type: 'standard', share: true},
          mesh: meshes.cube,
          shadowsCast: false,
          physics: {enabled: false}
        });

        // Low guard rails on both sides of the track.
        const sideX = Math.cos(angle * Math.PI / 180);
        const sideZ = -Math.sin(angle * Math.PI / 180);
        for(const side of [-1, 1]) {
          world.addMeshObj({
            name: `race-rail-${i}-${side}`,
            position: {
              x: x + sideX * side * 5.1,
              y: y + 0.75,
              z: z + sideZ * side * 5.1
            },
            rotation: {x: 0, y: angle, z: 0},
            scale: [0.38, 1.35, length + 0.45],
            texturesPaths: ['./res/textures/rust.jpg'],
            material: {type: 'standard', share: true},
            mesh: meshes.cube,
            shadowsCast: false,
            physics: {enabled: false}
          });
        }
      }

      // Start/finish gantry and four visible checkpoint gates.
      const checkpointAngles = [-Math.PI / 2, 0, Math.PI / 2, Math.PI];
      const checkpoints = checkpointAngles.map((angle, index) => {
        const p = coursePoint(angle);
        const tangent = Math.atan2(
          -COURSE.xRadius * Math.sin(angle),
          COURSE.zRadius * Math.cos(angle)
        ) * 180 / Math.PI;
        const y = terrainHeight(p.x, p.z);
        for(const side of [-1, 1]) {
          world.addMeshObj({
            name: `checkpoint-${index}-post-${side}`,
            position: {x: p.x + side * 4.7, y: y + 1.8, z: p.z},
            scale: [0.55, 3.6, 0.55],
            texturesPaths: ['./res/textures/gold-1.webp'],
            material: {type: 'standard', share: true},
            mesh: meshes.cube,
            shadowsCast: false,
            physics: {enabled: false}
          });
        }
        world.addMeshObj({
          name: `checkpoint-${index}-top`,
          position: {x: p.x, y: y + 3.55, z: p.z},
          rotation: {x: 0, y: tangent, z: 0},
          scale: [10, 0.45, 0.55],
          texturesPaths: ['./res/textures/gold-1.webp'],
          material: {type: 'standard', share: true},
          mesh: meshes.cube,
          shadowsCast: false,
          physics: {enabled: false}
        });
        return p;
      });

      // Scatter a deterministic forest and rock formations beyond the guard rails.
      // GPU culling keeps the distant scenery inexpensive while driving.
      let seed = 918273;
      const random = () => {
        seed = (seed * 1664525 + 1013904223) >>> 0;
        return seed / 4294967296;
      };
      let treeCount = 0, rockCount = 0;
      for(let i = 0;i < 260;i++) {
        const x = (random() - 0.5) * 224;
        const z = COURSE.centerZ + (random() - 0.5) * 224;
        const ellipse = Math.sqrt(
          (x * x) / (COURSE.xRadius * COURSE.xRadius) +
          ((z - COURSE.centerZ) ** 2) / (COURSE.zRadius * COURSE.zRadius)
        );
        if(ellipse < 1.38 || ellipse > 3.0) continue;
        const y = terrainHeight(x, z);
        if(i % 3 !== 0) {
          const height = 2.8 + random() * 2.8;
          world.addMeshObj({
            name: `race-tree-trunk-${treeCount}`,
            position: {x, y: y + height * 0.42, z},
            scale: [0.55, height * 0.85, 0.55],
            texturesPaths: ['./res/textures/rust.jpg'],
            material: {type: 'standard', share: true},
            mesh: meshes.cube,
            shadowsCast: false,
            physics: {enabled: false}
          });
          world.addMeshObj({
            name: `race-tree-crown-${treeCount}`,
            position: {x, y: y + height + 1.0, z},
            scale: [2.2 + random(), 2.5 + random(), 2.2 + random()],
            texturesPaths: ['./res/textures/gold-1.webp'],
            material: {type: 'standard', share: true},
            mesh: meshes.ball,
            shadowsCast: false,
            physics: {enabled: false}
          });
          treeCount++;
        } else {
          const size = 1.2 + random() * 2.2;
          world.addMeshObj({
            name: `race-rock-${rockCount++}`,
            position: {x, y: y + size * 0.35, z},
            scale: [size, size * 0.7, size * 1.2],
            texturesPaths: ['./res/textures/blankgray2.webp'],
            material: {type: 'standard', share: true},
            mesh: meshes.ball,
            shadowsCast: false,
            physics: {enabled: false}
          });
        }
      }

      // Native Jolt vehicle. Keep the proven heightfield demo's chassis and wheel setup.
      const start = coursePoint(-Math.PI / 2);
      const chassis = world.addMeshObj({
        position: {x: start.x, y: terrainHeight(start.x, start.z) + 2.0, z: start.z},
        scale: [1, 0.5, 2],
        texturesPaths: ['./res/textures/rust.jpg'],
        name: 'race-car-chassis',
        mesh: meshes.cube,
        physics: {enabled: false}
      });
      const wheelMeshes = [0, 1, 2, 3].map(i => world.addMeshObj({
        position: {x: start.x, y: terrainHeight(start.x, start.z) + 1.2, z: start.z},
        scale: [0.25, 0.5, 0.5],
        texturesPaths: ['./res/textures/gold-1.webp'],
        name: 'race-car-wheel-' + i,
        mesh: meshes.cube,
        physics: {enabled: false}
      }));

      const vehicleId = await world.matrixPhysics.addVehicle(chassis, wheelMeshes, {
        name: 'jolt-race-car',
        position: {
          x: start.x,
          y: terrainHeight(start.x, start.z) + 2.0,
          z: start.z
        },
        rotation: {x: 0, y: 90, z: 0},
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
      camera.setYaw(Math.PI * 0.5);
      camera.setPitch(-0.28);
      camera.setFollow(chassis.position, [-14, 7, 0], 0.08);

      // Existing engine post-processing: keep motion blur tasteful at racing speed.
      world.activateFXAA();
      world.activateMotionBlur({strength: 0.38, samples: 10});

      // W/Up = accelerate, S/Down = reverse, A/D = steer, V = brake.
      let lastEngine = 0, lastSteering = 0, lastBrake = 0;
      let nextCheckpoint = 1;
      let lap = 0;
      let lapStartedAt = performance.now();
      let bestLap = 0;
      let hudAt = 0;
      let previousPosition = {x: start.x, z: start.z};
      let speed = 0;

      const hud = document.getElementById('msgBox');
      if(hud) {
        hud.style.left = '50%';
        hud.style.top = '12px';
        hud.style.transform = 'translateX(-50%)';
        hud.style.width = 'min(560px, 90vw)';
        hud.style.textAlign = 'center';
        hud.style.pointerEvents = 'none';
        hud.textContent = 'BEAST RACING  |  W/↑ accelerate  S/↓ reverse  A/D steer  V brake  |  Pass all 4 gates to complete a lap';
      }

      world.autoUpdate.push({
        update: () => {
          camera.updateFollow();
          const digital = camera._digital;
          const engine = digital & 1 ? 1500 : digital & 2 ? -800 : 0;
          const steering = digital & 4 ? 0.4 : digital & 8 ? -0.4 : 0;
          const brake = digital & 16 ? 60 : 0;
          if(engine !== lastEngine || steering !== lastSteering || brake !== lastBrake) {
            lastEngine = engine;
            lastSteering = steering;
            lastBrake = brake;
            world.matrixPhysics.vehicleControl(vehicleId, engine, steering, brake);
          }

          const position = chassis.position;
          const dx = position.x - previousPosition.x;
          const dz = position.z - previousPosition.z;
          speed = Math.hypot(dx, dz) * 60 * 3.6;
          previousPosition = {x: position.x, z: position.z};

          const gate = checkpoints[nextCheckpoint];
          if(Math.hypot(position.x - gate.x, position.z - gate.z) < 8.5) {
            nextCheckpoint++;
            if(nextCheckpoint >= checkpoints.length) {
              nextCheckpoint = 0;
            } else if(nextCheckpoint === 0) {
              // The start/finish gate is checkpoint zero; crossing it completes a lap.
            }
          }

          // A lap is counted only after the three intermediate gates and then
          // crossing the start/finish gate in the correct order.
          if(nextCheckpoint === 0 && Math.hypot(position.x - checkpoints[0].x, position.z - checkpoints[0].z) < 8.5) {
            lap++;
            const now = performance.now();
            const lapTime = (now - lapStartedAt) / 1000;
            if(!bestLap || lapTime < bestLap) bestLap = lapTime;
            lapStartedAt = now;
            nextCheckpoint = 1;
          }

          const now = performance.now();
          if(hud && now - hudAt > 180) {
            hudAt = now;
            const currentLap = (now - lapStartedAt) / 1000;
            const format = seconds => {
              const mins = Math.floor(seconds / 60);
              return `${mins}:${(seconds % 60).toFixed(2).padStart(5, '0')}`;
            };
            hud.textContent =
              `BEAST RACING   |   LAP ${lap + 1}   |   ${format(currentLap)}   |   BEST ${bestLap ? format(bestLap) : '--:--'}   |   ${Math.round(speed)} km/h   |   NEXT GATE ${nextCheckpoint + 1}/4`;
          }
        }
      });

      world.lightContainer[0].setPosY(55);
      world.lightContainer[0].setIntensity(48);
      if(world.lightContainer[0].setPosition) world.lightContainer[0].setPosition(0, 55, -10);
      window.raceGame = {world, chassis, vehicleId, checkpoints};
    }
  });

  window.app = world;
};
