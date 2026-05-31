import MatrixEngineWGPU from "../src/world.js";
import {downloadMeshes} from '../src/engine/loader-obj.js';
import {addRaycastsAABBListener} from "../src/engine/raycast.js";
import {PVector} from "../src/engine/matrix-class.js";

const BLOCK_TYPES = {
  SAFE:             { color: [0.2, 0.8, 0.2],  moving: false, dangerous: false },
  MOVING:           { color: [0.2, 0.4, 1.0],  moving: true,  dangerous: false },
  DANGEROUS_STATIC: { color: [1.0, 0.2, 0.2],  moving: false, dangerous: true  },
  DANGEROUS_MOVING: { color: [1.0, 0.5, 0.0],  moving: true,  dangerous: true  },
};

const BALL_COLOR  = [1.0, 0.9, 0.1];
const BALL_DANGER = true;

function pickType() {
  const r = Math.random();
  if (r > 0.85) return 'DANGEROUS_MOVING';
  if (r > 0.70) return 'DANGEROUS_STATIC';
  if (r > 0.50) return 'MOVING';
  return 'SAFE';
}

function generatePaths(startHeight, totalBlocks, meshData, world2D, levelRegistry) {
  const PATHS = [
    { xCenter: -34, label: 'LEFT'   },
    // { xCenter:   0, label: 'CENTER' },
    { xCenter:  34, label: 'RIGHT'  },
  ];

  const blocksPerPath = Math.floor(totalBlocks / PATHS.length);

  for (const path of PATHS) {
    for (let i = 1; i <= blocksPerPath; i++) {
      const y = startHeight + (i * 6);
      const x = path.xCenter + (Math.random() * 8 - 4);
      const type = pickType();
      const def = BLOCK_TYPES[type];
      const name = `BLOCK_${path.label}_${type}_${i}`;

      const block = world2D.addMeshObj({
        material: {type: 'standard'},
        position: {x, y, z: -10},
        scale: [3, 0.5, 1],
        name,
        mesh: meshData,
        physics: {enabled: true, mass: 0, kinematic: def.moving, geometry: "Cube"}
      });

      block.setAmbient(...def.color);
      block._blockType = type;

      if (def.moving) {
        block.isKinematic = true;
        block._baseX = x;
        block._baseY = y;
      }

      levelRegistry.set(name, {type, def, baseX: x, baseY: y, path: path.label});
    }
  }

  // bridge platforms connecting paths at intervals
  const bridgeCount = 4;
  for (let b = 0; b < bridgeCount; b++) {
    const y = startHeight + ((b + 1) * (blocksPerPath * 6 / bridgeCount));
    const name = `BLOCK_BRIDGE_SAFE_${b}`;
    const block = world2D.addMeshObj({
      material: {type: 'standard'},
      position: {x: 0, y, z: -10},
      scale: [10, 0.5, 1],
      name,
      mesh: meshData,
      physics: {enabled: true, mass: 0, geometry: "Cube"}
    });
    block.setAmbient(...BLOCK_TYPES.SAFE.color);
    block._blockType = 'SAFE';
    levelRegistry.set(name, {type: 'SAFE', def: BLOCK_TYPES.SAFE, baseX: 0, baseY: y});
  }
}

const COLLISION = {
  onPlayerLand(world2D) {
    setTimeout(() => world2D._PlayerCanJump = true, 150);
  },
  onDangerous(world2D, _playerID, rayDirection) {
    world2D.matrixPhysics.applyImpulse(_playerID, new PVector(
      rayDirection[0] * 3,
      1.5,
      rayDirection[2] * 3
    ));
    world2D._PlayerCanJump = false;
  }
};

export var loadSprite2 = function() {

  let world2D = new MatrixEngineWGPU({
    canvasSize: 'fullscreen',
    fastRender: 0.9,
    useMatter: true,
    MAX_SPOTLIGHTS: 1,
    MAX_BONES: 0,
    mainCameraParams: {
      type: 'planeCamera',
      responseCoef: 1000
    },
    clearColor: {r: 0, b: 0.122, g: 0.122, a: 1}
  }, () => {

    addEventListener('PhysicsReady', () => {
      world2D.addLight();
      downloadMeshes({ball: "./res/meshes/blender/sphere.obj", cube: "./res/meshes/blender/cube.obj"}, onLoadObj, {scale: [1, 1, 1]})
      downloadMeshes({cube: "./res/meshes/blender/cube.obj"}, onGround, {scale: [40, 1.5, 40]})
      addRaycastsAABBListener('canvas1', 'click');

      function onGround(m) {
        world2D.addMeshObj({
          material: {type: 'standard', share: true},
          position: {x: 0, y: -4, z: -10},
          rotation: {x: 0, y: 0, z: 0},
          rotationSpeed: {x: 0, y: 0, z: 0},
          texturesPaths: ['./res/textures/floor1.webp'],
          name: 'floor',
          mesh: m.cube,
          physics: {enabled: false, mass: 0, geometry: "Cube"}
        })
      }

      async function onLoadObj(m) {
        world2D.addMeshObj({
          material: {type: 'standard', share: true},
          position: {x: 0, y: -1, z: -20},
          rotation: {x: 0, y: 0, z: 0},
          scale: [100, 100, 100],
          rotationSpeed: {x: 0, y: 0.1, z: 0},
          texturesPaths: ['./res/textures/env-maps/sky1_lod_mid.webp'],
          name: 'sky',
          mesh: m.ball,
          physics: {enabled: false, geometry: "Sphere"}
        });

        let PLAYER = world2D.addMeshObj({
          material: {type: 'standard'},
          position: {x: 0, y: 1, z: -10},
          rotation: {x: 0, y: 0, z: 0},
          rotationSpeed: {x: 0, y: 0, z: 0},
          scale: [1, 1, 1],
          texturesPaths: ['./res/textures/floor1.webp'],
          name: 'PLAYER',
          mesh: m.cube,
          raycast: {enabled: true, radius: 1},
          physics: {enabled: true, mass: 1, geometry: "Cube"},
          pointerEffect: {enabled: true}
        });

        world2D.addMeshObj({
          material: {type: 'standard'},
          position: {x: 0, y: 10, z: -10},
          rotation: {x: 0, y: 0, z: 0},
          rotationSpeed: {x: 0, y: 0, z: 0},
          scale: [4, 1, 1],
          texturesPaths: ['./res/textures/floor1.webp'],
          name: 'BLOCK',
          mesh: m.cube,
          raycast: {enabled: true, radius: 1},
          physics: {enabled: true, mass: 0, geometry: "Cube"},
          pointerEffect: {enabled: true}
        });

        let BLOCK2 = world2D.addMeshObj({
          material: {type: 'standard'},
          position: {x: 10, y: 20, z: -10},
          rotation: {x: 0, y: 0, z: 0},
          rotationSpeed: {x: 0, y: 0, z: 0},
          scale: [3, 0.5, 1],
          texturesPaths: ['./res/textures/floor1.webp'],
          name: 'BLOCK2',
          mesh: m.cube,
          raycast: {enabled: true, radius: 1},
          physics: {enabled: true, mass: 0, kinematic: true, geometry: "Cube"},
          pointerEffect: {enabled: true}
        });

        BLOCK2.isKinematic = true;
        BLOCK2.setAmbient(...BLOCK_TYPES.MOVING.color);
        BLOCK2._blockType = 'MOVING';

        const levelRegistry = new Map();
        generatePaths(15, 24, m.cube, world2D, levelRegistry);

        // falling balls
        const BALL_COUNT = 6;
        const fallingBalls = [];
        for (let i = 0; i < BALL_COUNT; i++) {
          const bx = (Math.random() * 28) - 14;
          const by = 80 + Math.random() * 40;
          const name = `BALL_${i}`;
          const ball = world2D.addMeshObj({
            material: {type: 'standard'},
            position: {x: bx, y: by, z: -10},
            scale: [1, 1, 1],
            name,
            mesh: m.ball,
            physics: {enabled: true, mass: 2, geometry: "Sphere"}
          });
          ball.setAmbient(...BALL_COLOR);
          ball._blockType = 'BALL';
          fallingBalls.push({name, ball, spawnX: bx, spawnY: by});
        }

        world2D.lightContainer[0].setIntensity(55);
        world2D.activateBloomEffect();
        world2D.lightContainer[0].behavior.setOsc0(-2, 2, 0.01);
        world2D.lightContainer[0].behavior.value_ = -1;
        world2D.lightContainer[0].updater.push((light) => {
          light.setTargetX(light.behavior.setPath0());
          light.setPosX(light.behavior.setPath0());
        });
        world2D.lightContainer[0].setPosition(0, 45, 0);
        world2D.lightContainer[0].setRange(200);
        world2D.lightContainer[0].setTarget(0, 0, 0);

        setTimeout(() => {
          world2D.getSceneObjectByName('sky').setAmbient(2, 0.5, 1);
          PLAYER.setAmbient(2, 1, 0);

          let cam = world2D.getCamera();
          world2D._PlayerCanJump = true;
          let moveSpeed = 0.2;
          let jumpPower = moveSpeed * 2.65;
          let _playerID = world2D.matrixPhysics.getBodyByName('PLAYER');

          // BLOCK2 oscillator
          const BLOCK2_ID = world2D.matrixPhysics.getBodyByName('BLOCK2');
          let t = 0;
          world2D.autoUpdate.push({
            update: () => {
              t += 0.02;
              world2D.matrixPhysics.setKinematicInterpolate(BLOCK2_ID, Math.sin(t) * 8, 20, 0, 0.15);
            }
          });

          // moving platform updater
          const movingBlocks = [];
          for (const [name, entry] of levelRegistry) {
            if (!entry.def.moving) continue;
            const id = world2D.matrixPhysics.getBodyByName(name);
            if (id !== undefined && id !== -1) {
              movingBlocks.push({
                id,
                offset: Math.random() * Math.PI * 2,
                baseX: entry.baseX,
                baseY: entry.baseY,
              });
            }
          }

          let mt = 0;
          world2D.autoUpdate.push({
            update: () => {
              mt += 0.018;
              for (const b of movingBlocks) {
                world2D.matrixPhysics.setKinematicInterpolate(
                  b.id,
                  b.baseX + Math.sin(mt + b.offset) * 5,
                  b.baseY,
                  0,
                  0.2
                );
              }
            }
          });

          // ball respawn updater — reset when fallen below world
          world2D.autoUpdate.push({
            update: () => {
              for (const b of fallingBalls) {
                const id = world2D.matrixPhysics.getBodyByName(b.name);
                if (id === undefined || id === -1) continue;
                world2D.matrixPhysics.getPosition(id).then((pos) => {
                  if (pos && pos.y < -20) {
                    const nx = (Math.random() * 28) - 14;
                    const ny = 80 + Math.random() * 40;
                    world2D.matrixPhysics.setBodyTransform(id, nx, ny, 0);
                    world2D.matrixPhysics.setLinearVelocity(id, 0, 0, 0);
                  }
                });
              }
            }
          });

          cam.onUp = () => {
            if (world2D._PlayerCanJump === true) {
              world2D.matrixPhysics.applyImpulse(_playerID, new PVector(0, jumpPower, 0));
              world2D._PlayerCanJump = false;
            }
            world2D.matrixPhysics.isSleeping(_playerID).then((a) => {
              if (a) {
                world2D.matrixPhysics.applyImpulse(_playerID, new PVector(0, jumpPower, 0));
                world2D._PlayerCanJump = false;
              }
            });
          };

          cam.onLeft = () => {
            world2D.matrixPhysics.applyImpulse(_playerID, new PVector(-moveSpeed, 0, 0));
          };

          cam.onRight = () => {
            world2D.matrixPhysics.applyImpulse(_playerID, new PVector(moveSpeed, 0, 0));
          };

          world2D.matrixPhysics.detectCollision = (e) => {
            const body0Name = e.detail.body0Name;
            const body1Name = e.detail.body1Name;
            const rayDirection = e.detail.rayDirection;

            const isPlayer = body0Name === 'PLAYER' || body1Name === 'PLAYER';
            if (!isPlayer) return;

            const otherName = body0Name === 'PLAYER' ? body1Name : body0Name;
            const mesh = world2D.getSceneObjectByName(otherName);
            const blockType = mesh ? mesh._blockType : null;

            COLLISION.onPlayerLand(world2D);

            if (!blockType) return;

            if (blockType === 'DANGEROUS_STATIC' || blockType === 'DANGEROUS_MOVING' || blockType === 'BALL') {
              COLLISION.onDangerous(world2D, _playerID, rayDirection);
            }
          };

          cam.setYaw(-0.01);
          cam.setPitch(-0.05);
          cam.setZ(10);
          cam.setY(10);
          cam.followMe = PLAYER.position;

          world2D.buildRenderBuckets();
          cam._dirtyAngle = true;
        }, 700);
      }

      world2D.canvas.addEventListener("ray.hit.event", (e) => {
        if (e.detail.hitObject.name.startsWith('PLAYER')) {
          let _ = world2D.matrixPhysics.getBodyByName('PLAYER');
          world2D.matrixPhysics.applyImpulse(_, new PVector(0, 1, 0));
        }
      });

    })
  })
  window.app = world2D;
}