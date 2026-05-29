import MatrixEngineWGPU from "../src/world.js";
import {downloadMeshes} from '../src/engine/loader-obj.js';
import {addRaycastsAABBListener} from "../src/engine/raycast.js";
import {isMobile, randomIntFromTo} from "../src/engine/utils.js";
import {GenGeoTexture2} from "../src/engine/effects/gen-tex2.js";
import {initializeSpritesForMesh, SpritesPack2D} from "../src/engine/effects/sprite2d2.js";
import {GenGeo} from "../src/engine/effects/gen.js";
import {GenGeoTexture} from "../src/engine/effects/gen-tex.js";
import {InstancedKinematicOperations} from "../src/engine/procedures/InstancedKinematicOperations.js";

export var loadSprite2 = function() {

  let world2D = new MatrixEngineWGPU({
    canvasSize: 'fullscreen',
    fastRender: 0.9,
    useMatter: true,
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
    downloadMeshes({ball: "./res/meshes/blender/sphere.obj", cube: "./res/meshes/blender/cube.obj", },
      onLoadObj, {scale: [1, 1, 1]})
    downloadMeshes({cube: "./res/meshes/blender/cube.obj"}, onGround, {scale: [30, 0.5, 30]})

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
        position: {x: 0, y: 9, z: -10},
        rotation: {x: 180, y: 0, z: 0},
        rotationSpeed: {x: 0, y: 0, z: 0},
        scale: [4, 4, 0.01],
        texturesPaths: ['./res/textures/floor1.webp', './res/textures/env-maps/sky1_lod_mid.webp'],
        name: 'cube',
        mesh: m.cube,
        raycast: {enabled: true, radius: 1},
        physics: {
          enabled: false,
          mass: 0,
          geometry: "Cube"
        },
        pointerEffect: {
          enabled: true
        }
      })


      // const batch = new SpritesPack2D(app.device, 'rgba16float', 'rgba16float', world2D.cameraBuffer);
      // await batch.registerSpritesheet("reel", "./res/textures/slot/reel1-lod0.webp", 4, 4);
      // // await batch.registerSpritesheet("effects", "./res/textures/slot/reel1-lod0.webp", 4, 4);
      // const sprite = batch.createSprite("my-sprite", 'reel', {scale: 2.0});
      // const sprite1 = batch.createSprite("my-sprite1", 'reel', {scale: 2.0});
      // sprite.play(12.0, true);
      // sprite1.play(2.0, true);
      // world2D.TEST = sprite;

      const batch = await initializeSpritesForMesh(
        MYCUBE,                                    // Your mesh
        app.device,                              // WebGPU device
        'rgba16float',                           // Format
        app.cameraBuffer,                     // Camera buffer
        "./res/textures/slot/reel1-lod0.webp", // Spritesheet path
        4,                                       // Grid cols
        4,                                       // Grid rows
        "circle"                                // Pattern: matrix|pulsing|flow|circle|wave
      );

      // const spr = batch.getSprite("player-instance-1");
      

      world2D.lightContainer[0].setIntensity(15);
      world2D.activateBloomEffect();
      world2D.lightContainer[0].behavior.setOsc0(-2, 2, 0.01)
      world2D.lightContainer[0].behavior.value_ = -1;
      world2D.lightContainer[0].updater.push((light) => {
        light.setTargetX(light.behavior.setPath0());
        light.setPosX(light.behavior.setPath0());
      })
      world2D.lightContainer[0].setPosition(0, 15, -10);
      world2D.lightContainer[0].setTarget(0, 0, -10);

      MYCUBE.effects.circle = new GenGeoTexture2(world2D.device, 'rgba16float', 'circle2', './res/textures/star1.png', 3, world2D.cameraBuffer);

      setTimeout(() => {
        // invisible
        MYCUBE.setBlend(0.9);
        MYCUBE.setupPipeline()
        app.buildRenderBuckets();


        MYCUBE.effects.circle.updateInstanceCount(10);

        const FX = new InstancedKinematicOperations(
          MYCUBE.effects.circle.instanceTargets
        );

        FX.cinematicSequence();

        // MYCUBE.effects.circle.instanceTargets[0].color[0] = 100;
        // MYCUBE.effects.circle.instanceTargets[0].position[1] = -5; 

        // MYCUBE.effects.circle.instanceTargets[1].color[1] = 100;
        // MYCUBE.effects.circle.instanceTargets[1].position[1] = -2; 

        MYCUBE.effects.circle.instanceTargets[0].isDyrty = true;

        app.getSceneObjectByName('sky').setAmbient(2, 0.5, 1);

        // MYCUBE.effects.flameEmitter.setIntensity(100);
        // MYCUBE.effects.flameEmitter.recreateVertexDataCrazzy(4); 
        // MYCUBE.effects.flameEmitter.rotSpeed = 1;

        // MYCUBE.effects.flameEmitter.recreateVertexDataFromData([
        //   -2.582509022040566, 0.21125441598805741, 0.4249951687253338,
        //   0.4724163587305734, 2.381811753816671, 3.074841196886901, -2.3797025623904164, -3.4608908819087145]);

        MYCUBE.setAmbient(2, 0, 0);
        let cam = app.getCamera();
        cam.setYaw(-0.03);
        cam.setPitch(-0.49);
        cam.setZ(10);
        cam.setY(30);
        app.buildRenderBuckets();

        console.log('MYCUBE.effects.flameEmitter.recreateVertexDataFromData', MYCUBE.effects.flameEmitter.recreateVertexDataFromData)

        cam._dirtyAngle = true;
      }, 700);
    }

    world2D.canvas.addEventListener("ray.hit.event", (e) => {
      console.log('ray.hit.event detected');
      if(e.detail.hitObject.name.startsWith('cube')) {
        e.detail.hitObject.effects.flameEmitter.recreateVertexDataCrazzy(5);
        e.detail.hitObject.effects.flameEmitter.setIntensity(randomIntFromTo(1, 200));
        e.detail.hitObject.setAmbient(randomIntFromTo(1, 7), randomIntFromTo(1, 2), randomIntFromTo(1, 5));
        app.bloomPass.setBlurRadius(randomIntFromTo(1, 5))
      }
    });

  })
  window.app = world2D;
}