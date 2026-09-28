import MatrixEngineWGPU from "../src/world.js";
import {downloadMeshes} from '../src/engine/loader-obj.js';
import {addRaycastsAABBListener} from "../src/engine/raycast.js";
import {isMobile, randomIntFromTo} from "../src/engine/utils.js";
import {GenGeoTexture2} from "../src/engine/effects/gen-tex2.js";
import {FlameEmitter} from "../src/engine/effects/flame-emmiter.js";
import {HPBarEffect} from "../src/engine/effects/energy-bar.js";
import {FlameEffect} from "../src/engine/effects/flame.js";
import {GenGeoTexture} from "../src/engine/effects/gen-tex.js";
import {GenGeo} from "../src/engine/effects/gen.js";
import {KaleidoscopeEffect} from "../src/engine/effects/KaleidoscopeEffect.js";
import {LaserProjectile} from "../src/engine/effects/laser.js";
import {MANABarEffect} from "../src/engine/effects/mana-bar.js";

export var loadObjFile = function() {

  let loadObjFile = new MatrixEngineWGPU({
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

    loadObjFile.addLight();
    // if you double call downloadMeshes for same path engine use cached values no double fetch...
    downloadMeshes({ball: "./res/meshes/blender/sphere.obj", cube: "./res/meshes/blender/cube.obj", },
      onLoadObj, {scale: [1, 1, 1]})
    downloadMeshes({cube: "./res/meshes/blender/cube.obj"}, onGround, {scale: [30, 0.5, 30]})

    addRaycastsAABBListener('canvas1', 'click');

    function onGround(m) {
      loadObjFile.addMeshObj({
        material: {type: 'standard', share: true},
        position: {x: 0, y: -5, z: -10},
        rotation: {x: 0, y: 0, z: 0},
        rotationSpeed: {x: 0, y: 0, z: 0},
        texturesPaths: ['./res/textures/floor1.webp'], //, './res/textures/env-maps/sky1_lod_mid.webp'],
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
      // loadObjFile.addMeshObj({
      //   material: {type: 'standard', share: true},
      //   position: {x: 0, y: -1, z: -20},
      //   rotation: {x: 0, y: 0, z: 0},
      //   scale: [100, 100, 100],
      //   rotationSpeed: {x: 0, y: 0.01, z: 0},
      //   texturesPaths: ['./res/textures/env-maps/sky1_lod_mid.webp'],
      //   name: 'sky',
      //   mesh: m.ball,
      //   physics: {
      //     enabled: false,
      //     geometry: "Sphere"
      //   }
      // });

      // material: {type: 'mirror', share: true }, share: true if not defined it is false.
      let MYCUBE = loadObjFile.addMeshObj({
        material: {type: 'mirror'},
        position: {x: 0, y: 4, z: -10},
        rotation: {x: 0, y: 0, z: 0},
        rotationSpeed: {x: 0, y: 0, z: 0},
        scale: [3, 5, 3],
        texturesPaths: ['./res/textures/floor1.webp', './res/textures/env-maps/sky1_lod_mid.webp'],
        name: 'cube',
        mesh: m.cube,
        envMapParams: {
          baseColorMix: 0.1,                // CLEAR SKY
          mirrorTint: [0.9, 0.95, 1.0],     // Slight cool tint
          reflectivity: 0.75,               // 25% reflection blend
          illuminateColor: [0.3, 0.7, 1.0], // Soft cyan
          illuminateStrength: 1.5,          // Gentle rim
          illuminatePulse: 0.1,             // No pulse (static)
          fresnelPower: 5,                  // Medium-sharp edge
          envLodBias: 1.5,
          usePlanarReflection: false,       // Must be false - WIP
        },
        raycast: {enabled: true, radius: 1},
        physics: {
          enabled: false,
          mass: 0,
          geometry: "Cube"
        },
        pointerEffect: {
          enabled: true,
          flameEmitter: true,
          // bloodBurst: true
          flameEffect: true
        }
      })

      loadObjFile.lightContainer[0].setIntensity(15);
      loadObjFile.activateBloomEffect();
      loadObjFile.lightContainer[0].behavior.setOsc0(-2, 2, 0.01)
      loadObjFile.lightContainer[0].behavior.value_ = -1;
      loadObjFile.lightContainer[0].updater.push((light) => {
        light.setTargetX(light.behavior.setPath0());
        light.setPosX(light.behavior.setPath0());
      })
      loadObjFile.lightContainer[0].setPosition(0, 15, -10);
      loadObjFile.lightContainer[0].setTarget(0, 0, -10);

      setTimeout(() => {
        app.MYCUBE = MYCUBE;
        // MYCUBE.effects.circle = new GenGeoTexture2(loadObjFile.device, 'rgba16float', 'circle2', './res/textures/star1.png', 1, app.cameraBuffer);
        // MYCUBE.effects.circle  = new GenGeo(loadObjFile.device, 'rgba16float', 'sphere', 2, loadObjFile.cameraBuffer);

        app.MYCUBE.effects.mana = new MANABarEffect(app.device, 'rgba16float', app.cameraBuffer);

        // app.MYCUBE.effects.laser.fireBeam([0,3,0], [0,3, -10])

        // Configuration for the spiral laser animation
        const center = [0, 10, -20]; // Center point of the spiral structure
        let time = 0;
        const totalBeams = 25;       // Number of active segments making up the spiral contour
        const spiralRadius = 8;      // Maximum spread of the spiral
        const heightStep = 0.6;      // Vertical distance between spiral loops

        function animateSpiralLasers() {
          // Advance time/phase to rotate and crawl the spiral
          time += 0.03;

          for(let i = 0;i < totalBeams;i++) {
            setTimeout(() => {
              // Calculate fractional position along the spiral (0 to 1)
              const t = i / totalBeams;

              // Angle and radius calculation for a 3D spiral contour (Helix)
              const angle = time + (t * Math.PI * 6); // 3 full twists
              const currentRadius = spiralRadius * t;   // Expands outward from center

              // "From" position (inner/bottom start of the segment)
              const fromX = center[0] + Math.cos(angle) * currentRadius;
              const fromY = center[1] + (i * heightStep);
              const fromZ = center[2] + Math.sin(angle) * currentRadius;

              // "To" position (connects to the next step up/out to form the contour chain)
              const nextAngle = angle + 0.4;
              const nextRadius = spiralRadius * (t + 0.05);
              const toX = center[0] + Math.cos(nextAngle) * nextRadius;
              const toY = center[1] + ((i + 1) * heightStep);
              const toZ = center[2] + Math.sin(nextAngle) * nextRadius;

              // Psychedelic color shifting tied to the time loop
              const hueShift = (time * 50 + i * 10) % 360;


              // Fire the beam with a short life (0.08s) so it disappears quickly and slides seamlessly
              app.MYCUBE.effects.laser.fireBeam(
                [fromX, fromY, fromZ],
                [toX, toY, toZ],
                0.08, // Short lifespan guarantees lasers disappear and update instantly
                {
                  colorA: [255, Math.floor(Math.abs(Math.sin(time + t) * 255)), 100],
                  colorB: [0, 200, 255],
                  width: 0.6,
                  intensity: 1.5,
                  scrollSpeed: 8.0 // Fast texture scroll along the laser body
                }
              );
            }, 100 * i)

          }

          // Loop continuously
          setTimeout(() => {animateSpiralLasers()}, 1000);
        }

        // Kick off the animation loop
        // animateSpiralLasers();

        MYCUBE.effects.flameEmitterBlue = new FlameEmitter(loadObjFile.device, "rgba16float", 20, loadObjFile.cameraBuffer);


        // MYCUBE.effects.GenGeoTexture = new GenGeoTexture(loadObjFile.device,
        //   "rgba16float", undefined, './res/textures/star1.png', 12, loadObjFile.cameraBuffer)

        // app.getSceneObjectByName('sky').setAmbient(2, 0.5, 1);
        MYCUBE.effects.flameEmitter.rotSpeed = 1;

        // Nice fire tourch effect, data from test case logs.
        MYCUBE.effects.flameEmitter.recreateVertexDataFromData([
          -2.582509022040566, 0.21125441598805741, 0.4249951687253338,
          0.4724163587305734, 2.381811753816671, 3.074841196886901, -2.3797025623904164, -3.4608908819087145]);

        MYCUBE.setAmbient(2, 3, 0.5);
        let cam = app.getCamera();
        cam.setYaw(-0.03);
        cam.setPitch(-0.49);
        cam.setZ(0);
        cam.setY(10);
        app.buildRenderBuckets();

        cam._dirtyAngle = true;
      }, 700);
    }

    loadObjFile.canvas.addEventListener("ray.hit.event", (e) => {
      console.log('ray.hit.event detected');
      if(e.detail.hitObject.name.startsWith('cube')) {
        e.detail.hitObject.effects.flameEmitter.recreateVertexDataCrazzy(5);
        e.detail.hitObject.effects.flameEmitter.setIntensity(randomIntFromTo(1, 200));

        e.detail.hitObject.effects.flameEmitterBlue.recreateVertexDataCrazzy(5);
        app.MYCUBE.effects.flameEmitterBlue.instanceTargets.forEach((ins) => {
          ins.color[0] = randomIntFromTo(0, 1)
          ins.color[1] = randomIntFromTo(0, 1)
          ins.color[2] = randomIntFromTo(1000, 2000)
        })
        app.MYCUBE.effects.flameEmitter.instanceTargets.forEach((ins) => {
          ins.color[0] = randomIntFromTo(1, 10)
          ins.color[1] = randomIntFromTo(1, 10)
          ins.color[2] = 0
        })

        e.detail.hitObject.setAmbient(randomIntFromTo(1, 7), randomIntFromTo(1, 2), randomIntFromTo(1, 5));
        app.bloomPass.setBlurRadius(randomIntFromTo(1, 5))
      }
    });

  })
  window.app = loadObjFile;
}