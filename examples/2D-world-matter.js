import MatrixEngineWGPU from "../src/world.js";
import {downloadMeshes} from '../src/engine/loader-obj.js';
import {addRaycastsAABBListener} from "../src/engine/raycast.js";
import {PVector} from "../src/engine/matrix-class.js";

const BLOCK_TYPES = {
  SAFE: {color: [0.2, 0.8, 0.2], moving: false, dangerous: false},
  MOVING: {color: [0.2, 0.4, 1.0], moving: true, dangerous: false},
  DANGEROUS_STATIC: {color: [1.0, 0.2, 0.2], moving: false, dangerous: true},
  DANGEROUS_MOVING: {color: [1.0, 0.5, 0.0], moving: true, dangerous: true},
};

function pickType() {
  const r = Math.random();
  if(r > 0.85) return 'DANGEROUS_MOVING';
  if(r > 0.70) return 'DANGEROUS_STATIC';
  if(r > 0.50) return 'MOVING';
  return 'SAFE';
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
    clearColor: {r: 0, b: 0, g: 0, a: 1}
  }, () => {

    let _;
    world2D.addLight();
    addEventListener('PhysicsReady', () => {

      downloadMeshes({ball: "./res/meshes/blender/sphere.obj", cube: "./res/meshes/blender/cube.obj"}, onLoadObj, {scale: [1, 1, 1]})
      downloadMeshes({cube: "./res/meshes/blender/cube.obj"}, onGround, {scale: [43, 1.5, 43]})
      addRaycastsAABBListener('canvas1', 'click');

      

      function onGround(m) {
        world2D.addMeshObj({
          material: {type: 'standard', share: true},
          position: {x: 0, y: -1.5, z: -10},
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
          position: {x: 0, y: 4, z: -10},
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

        function generateLevel(startHeight, count, meshData) {
          for(let i = 1;i <= count;i++) {
            let y = startHeight + (i * 7);
            let x = (Math.random() * 24) - 12;
            let type = pickType();
            let def = BLOCK_TYPES[type];

            let block = world2D.addMeshObj({
              material: {type: 'standard'},
              position: {x: x, y: y, z: -10},
              scale: [3, 0.5, 1],
              name: `BLOCK_${type}_${i}`,
              mesh: meshData,
              physics: {
                enabled: true,
                mass: 0,
                kinematic: def.moving,
                geometry: "Cube"
              }
            });

            block.setAmbient(...def.color);
            block._blockType = type;

            if(def.moving) {
              block.isKinematic = true;
              block._baseX = x;
              block._baseY = y;
            }

            levelRegistry.set(`BLOCK_${type}_${i}`, {type, def, baseX: x, baseY: y});
          }
        }

        generateLevel(15, 20, m.cube);

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
          _ = app.matrixPhysics.getBodyByName('PLAYER');
          world2D.getSceneObjectByName('sky').setAmbient(2, 0.5, 1);
          PLAYER.setAmbient(2, 1, 0);

          let cam = world2D.getCamera();
          world2D._PlayerCanJump = true;
          let moveSpeed = 0.2;
          let jumpPower = moveSpeed * 2.4;
          let _playerID = world2D.matrixPhysics.getBodyByName('PLAYER');

          const BLOCK2_ID = world2D.matrixPhysics.getBodyByName('BLOCK2');
          let t = 0;
          world2D.autoUpdate.push({
            update: () => {
              t += 0.02;
              world2D.matrixPhysics.setKinematicInterpolate(BLOCK2_ID, Math.sin(t) * 8, 20, 0, 0.15);

            }
          });

          const movingBlocks = [];
          for(let i = 1;i <= 20;i++) {
            for(const type of ['MOVING', 'DANGEROUS_MOVING']) {
              const name = `BLOCK_${type}_${i}`;
              const id = world2D.matrixPhysics.getBodyByName(name);
              if(id !== undefined && id !== -1) {
                const entry = levelRegistry.get(name);
                movingBlocks.push({
                  id,
                  offset: Math.random() * Math.PI * 2,
                  baseX: entry ? entry.baseX : 0,
                  baseY: entry ? entry.baseY : 0,
                });
              }
            }
          }

          let mt = 0;
          world2D.autoUpdate.push({
            update: async () => {
              mt += 0.018;
              for(const b of movingBlocks) {
                world2D.matrixPhysics.setKinematicInterpolate(
                  b.id,
                  b.baseX + Math.sin(mt + b.offset) * 5,
                  b.baseY,
                  0,
                  0.2
                );
              }
              // check player failing
              const pos = await app.matrixPhysics.getPosition(_);
              if (pos.y < -10) {
                await app.matrixPhysics.switchToKinematic(_);
                app.matrixPhysics.setKinematicTransform(_, 0, 5, -25);
                app.matrixPhysics.switchToDinamic(_);

              }
            }
          });

          cam.onUp = () => {
            if(world2D._PlayerCanJump === true) {
              world2D.matrixPhysics.applyImpulse(_playerID, new PVector(0, jumpPower, 0));
              world2D._PlayerCanJump = false;
              return;
            }
            world2D.matrixPhysics.isSleeping(_playerID).then((a) => {
              if(a) {
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
            if(!isPlayer) return;

            const otherName = body0Name === 'PLAYER' ? body1Name : body0Name;
            const mesh = world2D.getSceneObjectByName(otherName);
            const blockType = mesh ? mesh._blockType : null;

            COLLISION.onPlayerLand(world2D);

            if(!blockType) return;

            if(blockType === 'DANGEROUS_STATIC' || blockType === 'DANGEROUS_MOVING') {
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
        }, 2500);
      }

      world2D.canvas.addEventListener("ray.hit.event", (e) => {
        if(e.detail.hitObject.name.startsWith('PLAYER')) {
         
          app.matrixPhysics.applyImpulse(_, new PVector(0, 1, 0));
        }
      });

    })
  })
  window.app = world2D;
}