import MatrixEngineWGPU from "../src/world.js";
import {downloadMeshes} from '../src/engine/loader-obj.js';
import {addRaycastsAABBListener} from "../src/engine/raycast.js";
import {isMobile, randomIntFromTo} from "../src/engine/utils.js";
import {FlameEmitter} from "../src/engine/effects/flame-emmiter.js";
import {KaleidoscopeEffect} from "../src/engine/effects/KaleidoscopeEffect.js";
import {LaserProjectile} from "../src/engine/effects/laser.js";
import {FluidEffect} from "../src/engine/effects/fluid-.js";

export var loadFluidEffectExample = function() {

  let fluidEffectDemo = new MatrixEngineWGPU({
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

    fluidEffectDemo.addLight();
    // if you double call downloadMeshes for same path engine use cached values no double fetch...
    downloadMeshes({ball: "./res/meshes/blender/sphere.obj", cube: "./res/meshes/blender/cube.obj", },
      onLoadObj, {scale: [1, 1, 1]})
    downloadMeshes({cube: "./res/meshes/blender/cube.obj"}, onGround, {scale: [30, 0.5, 30]})

    addRaycastsAABBListener('canvas1', 'click');

    function onGround(m) {
      fluidEffectDemo.addMeshObj({
        material: {type: 'mirror', share: true},
        envMapParams: {
          baseColorMix: 0.6,                // CLEAR SKY
          mirrorTint: [0.9, 0.95, 1.0],     // Slight cool tint
          reflectivity: 0.75,               // 25% reflection blend
          illuminateColor: [0.3, 0.7, 1.0], // Soft cyan
          illuminateStrength: 1.5,          // Gentle rim
          illuminatePulse: 0.1,             // No pulse (static)
          fresnelPower: 5,                  // Medium-sharp edge
          envLodBias: 1.5,
          usePlanarReflection: false,       // Must be false - WIP
        },
        position: {x: 0, y: -20, z: -10},
        rotation: {x: 0, y: 0, z: 0},
        rotationSpeed: {x: 0, y: 0, z: 0},
        texturesPaths: ['./res/textures/floor1.webp', './res/textures/env-maps/sky1_lod_mid.webp'],
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
      // material: {type: 'mirror', share: true }, share: true if not defined it is false.
      let MYCUBE = fluidEffectDemo.addMeshObj({
        material: {type: 'standard'},
        position: {x: 0, y: 1, z: -10},
        rotation: {x: 0, y: 0, z: 0},
        rotationSpeed: {x: 0, y: 0, z: 0},
        scale: [3, 2.5, 2],
        texturesPaths: ['./res/textures/floor1.webp'],
        name: 'cube',
        mesh: m.cube,
        raycast: {enabled: true, radius: 1},
        physics: {
          enabled: false,
          mass: 0,
          geometry: "Cube"
        },
        pointerEffect: {enabled: true}
      })

      MYCUBE.setBlend(0.001)

      fluidEffectDemo.lightContainer[0].setIntensity(15);
      fluidEffectDemo.activateBloomEffect();
      // fluidEffectDemo.lightContainer[0].behavior.setOsc0(-2, 2, 0.01)
      // fluidEffectDemo.lightContainer[0].behavior.value_ = -1;
      // fluidEffectDemo.lightContainer[0].updater.push((light) => {
      //   light.setTargetX(light.behavior.setPath0());
      //   light.setPosX(light.behavior.setPath0());
      // })
      fluidEffectDemo.lightContainer[0].setPosition(0, 15, -10);
      fluidEffectDemo.lightContainer[0].setTarget(0, 0, -10);

      setTimeout(() => {
        app.MYCUBE = MYCUBE;
        // MYCUBE.effects.circle = new GenGeoTexture2(fluidEffectDemo.device, 'rgba16float', 'circle2', './res/textures/star1.png', 1, app.cameraBuffer);
        // MYCUBE.effects.circle  = new GenGeo(fluidEffectDemo.device, 'rgba16float', 'sphere', 2, fluidEffectDemo.cameraBuffer);
        app.MYCUBE.effects.laser = new LaserProjectile(app.device, 'rgba16float', app.cameraBuffer);
        app.MYCUBE.effects.laser.fireBeam([0,3,0], [0,3, -10])
        // Configuration for the spiral laser animation
        // const center = [0, 2, -20]; // Center point of the spiral structure
        // let time = 0;
        // const totalBeams = 25;       // Number of active segments making up the spiral contour
        // const spiralRadius = 8;      // Maximum spread of the spiral
        // const heightStep = 0.6;      // Vertical distance between spiral loops
        // function animateSpiralLasers() {
        //   // Advance time/phase to rotate and crawl the spiral
        //   time += 0.03;

        //   for(let i = 0;i < totalBeams;i++) {
        //     setTimeout(() => {
        //       // Calculate fractional position along the spiral (0 to 1)
        //       const t = i / totalBeams;

        //       // Angle and radius calculation for a 3D spiral contour (Helix)
        //       const angle = time + (t * Math.PI * 6); // 3 full twists
        //       const currentRadius = spiralRadius * t;   // Expands outward from center

        //       // "From" position (inner/bottom start of the segment)
        //       const fromX = center[0] + Math.cos(angle) * currentRadius;
        //       const fromY = center[1] + (i * heightStep);
        //       const fromZ = center[2] + Math.sin(angle) * currentRadius;

        //       // "To" position (connects to the next step up/out to form the contour chain)
        //       const nextAngle = angle + 0.4;
        //       const nextRadius = spiralRadius * (t + 0.05);
        //       const toX = center[0] + Math.cos(nextAngle) * nextRadius;
        //       const toY = center[1] + ((i + 1) * heightStep);
        //       const toZ = center[2] + Math.sin(nextAngle) * nextRadius;

        //       // Psychedelic color shifting tied to the time loop
        //       const hueShift = (time * 50 + i * 10) % 360;


        //       // Fire the beam with a short life (0.08s) so it disappears quickly and slides seamlessly
        //       app.MYCUBE.effects.laser.fireBeam(
        //         [fromX, fromY, fromZ],
        //         [toX, toY, toZ],
        //         0.8, // Short lifespan guarantees lasers disappear and update instantly
        //         {
        //           colorA: [Math.floor(Math.abs(Math.sin(time + t) * 255)), Math.floor(Math.abs(Math.sin(time + t) * 255)), 100],
        //           colorB: [randomIntFromTo(150, 200), randomIntFromTo(50, 100), randomIntFromTo(50, 100)],
        //           width: 1.6,
        //           intensity: 1.5,
        //           scrollSpeed: 1.0 // Fast texture scroll along the laser body
        //         }
        //       );
        //     }, 100 * i)
        //   }
        //   // Loop continuously
        //   setTimeout(() => {animateSpiralLasers()}, 1000);
        // }
        // // animateSpiralLasers()

        MYCUBE.effects.fluidSpiral = new FluidEffect(app.device,
          {
            simRes: 128, dyeRes: 512, splatRadius: 1,
            localOffset: [-8, 1, -20],
            localRotation: [0, 0, 0],
            activeRotate: [0, 0, 0],
            scale: 7
          });

        MYCUBE.effects.fluidSpiralRight = new FluidEffect(app.device,
          {
            simRes: 128, dyeRes: 512, splatRadius: 0.1,
            localOffset: [8, 1, -20],
            localRotation: [0, 0, 0],
            activeRotate: [0, 0, 0],
            scale: 7
          });



          
        MYCUBE.effects.fluid = new FluidEffect(app.device,
          {
            simRes: 128, dyeRes: 512, splatRadius: 1,
            localOffset: [0, 1, 0],
            localRotation: [0, 0, 0],
            activeRotate: [0, 0, 0],
            scale: 2
          });

        MYCUBE.effects.fluid.attachPointer(app.canvas);

        // MYCUBE.effects.fluid.randomSplats(5);
        MYCUBE.effects.fluid.splat(0.5, 0.2, 0, 300, [1.0, 0.1, 0.1]);
        // Radial burst
        // MYCUBE.effects.fluid.burst(0.1, 0.1, 1, 0.01);          // count, strength, optional color
        // // Continuous source, e.g. a fire jet from the bottom
        // const jet = MYCUBE.effects.fluid.addEmitter({
        //   x: 0.5, y: 0.05, dx: 0, dy: 5,
        //   color: [2.0, 0.6, 0.1],
        //   jitter: 0.1
        // });
        const fire = MYCUBE.effects.fluid.addFire({x: 0.5, y: 0.05, height: 0.5});
        MYCUBE.effects.fluid.addEmitter({
          color: [1.6, 0.45, 0.08],
          interval: 0.016,
          jitter: 0.25,
          sweep: {
            from: [0.5, 0.05],   // bottom
            to: [0.5, 0.55],   // up
            duration: 0.6,       // seconds for one drag
            pause: 1.6,          // rest before the next drag
            strength: 60,       // low = gentle
            spread: 0.02         // random x offset per drag
          }
        });


        MYCUBE.effects.fluidSpiral.addSpiral({x: 0.5, y: 0.5});   // 2-arm galaxy, random colors
        const emmiterSpiral = {
          color: null,                // random colors; or [r,g,b]
          interval: 0.016,
          spiral: {
            cx: 0.5, cy: 0.5,         // center
            rStart: 0.02, rEnd: 0.35, // radius travels from rStart to rEnd (rEnd < rStart = inward)
            speed: 3,                 // radians per second
            duration: 3,              // seconds for one spiral
            pause: 0,                 // rest between spirals
            strength: 400,
            radial: 0.3,              // 0 = pure swirl, >0 pushes outward, <0 pulls inward
            arms: 2,                  // number of spiral arms
            reverse: false            // flip the rotation direction
          }
        }
        MYCUBE.effects.fluidSpiral.addEmitter(emmiterSpiral);

 
        // MYCUBE.effects.fluidSpiralRight.removeEmitter(emmiterSpiral);
        // MYCUBE.effects.fluidSpiralRight.clearEmitters();
        const emmiterSpiralRight = {
          color: null,                // random colors; or [r,g,b]
          interval: 0.016,
          spiral: {
            cx: 0.5, cy: 0.5,         // center
            rStart: 0.02, rEnd: 0.35, // radius travels from rStart to rEnd (rEnd < rStart = inward)
            speed: 2,                 // radians per second
            duration: 3,              // seconds for one spiral
            pause: 0,                 // rest between spirals
            strength: 200,
            radial: 0.3,              // 0 = pure swirl, >0 pushes outward, <0 pulls inward
            arms: 2,                  // number of spiral arms
            reverse: false            // flip the rotation direction
          }
        }
        MYCUBE.effects.fluidSpiralRight.addEmitter(emmiterSpiralRight)

        // 5x5 fluid display grid. The original three effects above stay untouched.
        // Reuse their positions and fill the remaining 22 cells around them.
        const fluidGridX = [-12, -6, 0, 6, 12];
        const fluidGridY = [-7, -3, 1, 5, 9];
        const existingFluidCells = new Set(['-8,1', '0,1', '8,1']);
        let fluidGridIndex = 0;

        for (const y of fluidGridY) {
          for (const x of fluidGridX) {
            if (existingFluidCells.has(`${x},${y}`)) continue;

            const fluid = new FluidEffect(app.device, {
              simRes: 64,
              dyeRes: 256,
              splatRadius: 0.16,
              localOffset: [x, y, 0],
              localRotation: [0, 0, 0],
              activeRotate: [0, 0, 0],
              scale: 1.7
            });

            MYCUBE.effects[`fluidGrid${fluidGridIndex}`] = fluid;

            // Alternate motion presets to give each cell a distinct look.
            const preset = fluidGridIndex % 4;
            if (preset === 0) {
              fluid.addSpiral({
                x: 0.5, y: 0.5,
                rStart: 0.02, rEnd: 0.34,
                speed: 2.2, duration: 4,
                strength: 260, radial: 0.2,
                arms: 2, color: [1.4, 0.25, 0.8]
              });
            } else if (preset === 1) {
              fluid.addFire({
                x: 0.5, y: 0.08, height: 0.62,
                duration: 0.9, pause: 0.35,
                strength: 90, spread: 0.12,
                color: [0.15, 0.8, 1.5]
              });
            } else if (preset === 2) {
              fluid.addEmitter({
                color: [0.3, 1.2, 0.35],
                interval: 0.025,
                orbit: {cx: 0.5, cy: 0.5, r: 0.24, speed: 1.4, strength: 230}
              });
            } else {
              fluid.addEmitter({
                color: [1.5, 0.65, 0.12],
                interval: 0.02,
                jitter: 0.35,
                sweep: {
                  from: [0.15, 0.12],
                  to: [0.85, 0.82],
                  duration: 1.8,
                  pause: 0.5,
                  strength: 110,
                  spread: 0.18
                }
              });
            }

            fluidGridIndex++;
          }
        }

        console.log(`[fluid-effects] 5x5 grid ready: ${fluidGridIndex + 3} fluid planes (3 original + ${fluidGridIndex} new)`);

        // // Orbiting emitter that swirls on its own, with random colors
        // MYCUBE.effects.fluid.addEmitter({
        //   orbit: {cx: 0.5, cy: 0.5, r: 0.25, speed: 1, strength: 40},
        //   color: null
        // });
        // MYCUBE.effects.fluid.removeEmitter(jet);
        // MYCUBE.effects.fluid.clearEmitters();
        dispatchEvent(new CustomEvent('update-effects'));
        // MYCUBE.setAmbient(2, 3, 0.5);
        let cam = app.getCamera();
        cam.setYaw(-0.0);
        cam.setPitch(-0.1);
        cam.setZ(16);
        cam.setY(5);
        app.buildRenderBuckets();

        cam._dirtyAngle = true;
      }, 700);
    }

    fluidEffectDemo.canvas.addEventListener("ray.hit.event", (e) => {
  
      if(e.detail.hitObject.name.startsWith('cube')) {
            console.log('ray.hit.event detected');
        app.MYCUBE.effects.fluid.splat(0.5, 0.2, 0, 300, [1.0, 10.1, 0.1]);
        // app.MYCUBE.effects.flameEmitter.instanceTargets.forEach((ins) => {
        //   ins.color[0] = randomIntFromTo(1, 10)
        //   ins.color[1] = randomIntFromTo(1, 10)
        //   ins.color[2] = 0
        // })
        // e.detail.hitObject.setAmbient(randomIntFromTo(1, 7), randomIntFromTo(1, 2), randomIntFromTo(1, 5));
        // app.bloomPass.setBlurRadius(randomIntFromTo(1, 5))
      }
    });

  })
  window.app = fluidEffectDemo;
}