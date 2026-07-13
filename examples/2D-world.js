import MatrixEngineWGPU from "../src/world.js";
import {downloadMeshes} from '../src/engine/loader-obj.js';
import {addRaycastsAABBListener} from "../src/engine/raycast.js";
import {randomIntFromTo} from "../src/engine/utils.js";
import {GenGeoTexture2} from "../src/engine/effects/gen-tex2.js";
import {initializeSpritesForMesh, SpritesPack2D} from "../src/engine/effects/sprite2d2.js";
import {InstancedKinematicOperations} from "../src/engine/procedures/InstancedKinematicOperations.js";
import {animateRotationY} from "../src/engine/procedures/sceneobjectKinematics.js";
import {KaleidoscopeEmitter} from "../src/engine/effects/kaleidoscopeEffectInstance.js";

export var loadSprite1 = function() {

  let world2D = new MatrixEngineWGPU({
    canvasSize: 'fullscreen',
    fastRender: 0.9,
    dontUsePhysics: true,
    MAX_SPOTLIGHTS: 1,
    MAX_BONES: 0,
    mainCameraParams: {
      type: 'WASD',
      responseCoef: 1000
    },
    clearColor: {r: 0, b: 0.122, g: 0.122, a: 1}
  }, () => {

    world2D.addLight();
    // if you double call downloadMeshes for same path engine use cached values no double fetch...
    downloadMeshes({ball: "./res/meshes/blender/sphere.obj", cube: "./res/meshes/blender/cube.obj", plane: "./res/meshes/blender/plane.obj"},
      onLoadObj, {scale: [1, 1, 1]})
    downloadMeshes({cube: "./res/meshes/blender/cube.obj"}, onGround, {scale: [35, 0.5, 35]})

    addRaycastsAABBListener('canvas1', 'click');

    function onGround(m) {
      world2D.addMeshObj({
        material: {type: 'standard', share: true},
        position: {x: 0, y: -5, z: -10},
        rotation: {x: 0, y: 0, z: 0},
        rotationSpeed: {x: 0, y: 0, z: 0},
        texturesPaths: ['./res/textures/floor1.webp'],
        name: 'floor',
        mesh: m.cube,
        physics: {
          enabled: false,
          mass: 0,
          geometry: "Cube"
        }
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
        physics: {
          enabled: false,
          geometry: "Sphere"
        }
      });

      // share: true if not defined it is false.
      let MYCUBE = world2D.addMeshObj({
        material: {type: 'standard'},
        position: {x: -6, y: 15, z: -10},
        rotation: {x: 180, y: 0, z: 0},
        rotationSpeed: {x: 0, y: 0, z: 0},
        scale: [3.5, 3.5, 3.5],
        texturesPaths: ['./res/textures/floor1.webp'],
        name: 'cube',
        mesh: m.cube,
        raycast: {enabled: false, radius: 1},
        physics: {
          enabled: false,
          mass: 0,
          geometry: "Cube"
        },
        pointerEffect: {
          enabled: true
        }
      })

      let MYCUBE2 = world2D.addMeshObj({
        material: {type: 'standard'},
        position: {x: 0, y: 15, z: -10},
        rotation: {x: 180, y: 0, z: 0},
        rotationSpeed: {x: 0, y: 0, z: 0},
        scale: [3.5, 3.5, 3.5],
        texturesPaths: ['./res/textures/floor1.webp'],
        name: 'cube2',
        mesh: m.cube,
        raycast: {enabled: false, radius: 1},
        physics: {
          enabled: false,
          mass: 0,
          geometry: "Cube"
        },
        pointerEffect: {
          enabled: true
        }
      })

      let MYCUBE3 = world2D.addMeshObj({
        material: {type: 'standard'},
        position: {x: 6, y: 15, z: -10},
        rotation: {x: 180, y: 0, z: 0},
        rotationSpeed: {x: 0, y: 0, z: 0},
        scale: [3.5, 3.5, 3.5],
        texturesPaths: ['./res/textures/floor1.webp'],
        name: 'cube3',
        mesh: m.cube,
        raycast: {enabled: false, radius: 1},
        physics: {
          enabled: false,
          mass: 0,
          geometry: "Cube"
        },
        pointerEffect: {
          enabled: true
        }
      })


      // const spr = batch.getSprite("player-instance-1");
      // MYCUBE.effects.mySprite1 = batch;

      world2D.lightContainer[0].setIntensity(15);
      world2D.activateBloomEffect();
      world2D.activateVolumetricEffect();
      world2D.lightContainer[0].behavior.setOsc0(-2, 2, 0.01)
      world2D.lightContainer[0].behavior.value_ = -1;
      world2D.lightContainer[0].updater.push((light) => {
        light.setTargetX(light.behavior.setPath0());
        light.setPosX(light.behavior.setPath0());
      })
      world2D.lightContainer[0].setPosition(0, 45, -8);
      world2D.lightContainer[0].setTarget(0, 0, -10);

      console.log(MYCUBE3)

      let MYCUBE_EFFECT = world2D.addMeshObj({
        material: {type: 'standard'},
        position: {x: 0, y: 15, z: -10},
        rotation: {x: 90, y: 0, z: 180},
        rotationSpeed: {x: 0, y: 0, z: 0},
        scale: [9, 9, 9],
        texturesPaths: ['./res/icons/512.webp'],
        name: 'cubeeffect',
        mesh: m.plane,
        raycast: {enabled: true, radius: 1},
        physics: {
          enabled: false,
          mass: 0,
          geometry: "Cube"
        },
        pointerEffect: {
          enabled: true,
          //  flameEmitter: true,
        }
      })

      setTimeout(async () => {
        MYCUBE_EFFECT.effects.circle = new GenGeoTexture2(world2D.device, 'rgba16float', 'circle2', './res/textures/star1.png', 3, world2D.cameraBuffer);
        MYCUBE_EFFECT.effects.keeffect = new KaleidoscopeEmitter(world2D.device, 'rgba16float', 30, world2D.cameraBuffer)


        const batch = await initializeSpritesForMesh(
          MYCUBE,                                    // Your mesh
          app.device,                              // WebGPU device
          'rgba16float',                           // Format
          app.cameraBuffer,                     // Camera buffer
          "./res/textures/slot/reel1-lod0.webp", // Spritesheet path
          4,                                       // Grid cols
          4,                                       // Grid rows
          "circle",                                // Pattern: matrix|pulsing|flow|circle|wave
          {radius: 4.5, count: 18}
        );

        const batch2 = await initializeSpritesForMesh(
          MYCUBE2,                                    // Your mesh
          app.device,                              // WebGPU device
          'rgba16float',                           // Format
          app.cameraBuffer,                     // Camera buffer
          "./res/textures/slot/reel1-lod0.webp", // Spritesheet path
          4,                                       // Grid cols
          4,                                       // Grid rows
          "circle",                                // Pattern: matrix|pulsing|flow|circle|wave
          {radius: 4.5, count: 18}
        );

        const batch3 = await initializeSpritesForMesh(
          MYCUBE3,                                    // Your mesh
          app.device,                              // WebGPU device
          'rgba16float',                           // Format
          app.cameraBuffer,                     // Camera buffer
          "./res/textures/slot/reel1-lod0.webp", // Spritesheet path
          4,                                       // Grid cols
          4,                                       // Grid rows
          "circle",                                // Pattern: matrix|pulsing|flow|circle|wave
          {radius: 4.5, count: 18}
        );


        let cam = app.getCamera();
        cam.setYaw(-0.03);
        cam.setPitch(-0.05);
        cam.setZ(22);
        cam.setY(16);
        cam._dirtyAngle = true;

        MYCUBE.setBlend(0.001);
        MYCUBE2.setBlend(0.001);
        MYCUBE3.setBlend(0.001);
        MYCUBE.setupPipeline()
        app.buildRenderBuckets();

      }, 600)

      setTimeout(() => {
        let timer1 = null;

        let myReel1 = [...MYCUBE.effects.spriteBatch.sprites.values()];
        const count = myReel1.length;
        let myReel2 = [...MYCUBE2.effects.spriteBatch.sprites.values()];
        const count2 = myReel2.length;
        let myReel3 = [...MYCUBE3.effects.spriteBatch.sprites.values()];
        const count3 = myReel3.length;


        myReel1.forEach((sprite, index) => {
          const angle = (index / count) * Math.PI * 2;
          sprite.play(index * 0.5);
        })

        myReel2.forEach((sprite, index) => {
          const angle = (index / count) * Math.PI * 2;
          sprite.play(index* 0.5);
        })

        myReel3.forEach((sprite, index) => {
          const angle = (index / count) * Math.PI * 2;
          sprite.play(index* 0.5);
        })

        setTimeout(() => {
          MYCUBE_EFFECT.effects.circle.updateInstanceCount(8);
          const FX = new InstancedKinematicOperations(MYCUBE_EFFECT.effects.circle.instanceTargets);
          FX.orbit();

          myReel1.forEach((sprite, index) => {
            const baseAngle = index * 20;
            const targetY = baseAngle;
            setTimeout(() => {
              const angle = (index / count) * Math.PI * 2;
              const yDeg = angle * (180 / Math.PI);
              const FIX = 90;
              sprite.pause();
              sprite.goToFrame(randomIntFromTo(0, 8))
              sprite.setTargetRotation(90, yDeg - FIX, FIX);
              if(index === myReel1.length - 1) {
                animateRotationY(MYCUBE.rotation, 90, 1000);
                setTimeout(() => {
                  MYCUBE.rotation.setRotateX(2.5)
                }, 1500)
              }
            }, 100 * index);
          });

          myReel2.forEach((sprite, index) => {
            const baseAngle = index * 20;
            const targetY = baseAngle;
            setTimeout(() => {
              const angle = (index / count2) * Math.PI * 2;
              const yDeg = angle * (180 / Math.PI);
              const FIX = 90;
              sprite.pause();
              sprite.goToFrame(randomIntFromTo(0, 8))
              sprite.setTargetRotation(90, yDeg - FIX, FIX);
              if(index === myReel2.length - 1) {
                animateRotationY(MYCUBE2.rotation, 90, 1000);
                setTimeout(() => {
                  MYCUBE2.rotation.setRotateX(4)
                }, 1700)
              }
            }, 200 * index);
          });


          myReel3.forEach((sprite, index) => {
            const baseAngle = index * 20;
            const targetY = baseAngle;
            setTimeout(() => {
              const angle = (index / count3) * Math.PI * 2;
              const yDeg = angle * (180 / Math.PI);
              const FIX = 90;
              sprite.pause();
              sprite.goToFrame(randomIntFromTo(0, 8))
              sprite.setTargetRotation(90, yDeg - FIX, FIX);
              if(index === myReel3.length - 1) {
                animateRotationY(MYCUBE3.rotation, 90, 1000);
                setTimeout(() => {
                  MYCUBE3.rotation.setRotateX(8);
                  MYCUBE_EFFECT.rotation.setRotateZ(1)
                  MYCUBE_EFFECT.effects.keeffect.recreateVertexDataFromData(
                    [-6.94798115268439, 13.359448700316488, 15.690525966669506, 14.642970205525577, 2.5040455061885725, 13.874531871189749, -16.32885928825164, -11.8878829677588]
                  )
                }, 1900)
              }
            }, 300 * index);
          });

        }, 3000)

        MYCUBE_EFFECT.effects.circle.instanceTargets[0].isDyrty = true;
        app.getSceneObjectByName('sky').setAmbient(2, 0.5, 1);
        MYCUBE.setAmbient(2, 0, 0);
      }, 1000);
    }

    world2D.canvas.addEventListener("ray.hit.event", (e) => {
      console.log('ray.hit.event detected');
      if(e.detail.hitObject.name.startsWith('cubeeffect')) {
        e.detail.hitObject.effects.keeffect.recreateVertexDataCrazzy(randomIntFromTo(6, 36));
        e.detail.hitObject.effects.keeffect.setIntensity(randomIntFromTo(3, 23));
      }
    });

  })
  window.app = world2D;
}