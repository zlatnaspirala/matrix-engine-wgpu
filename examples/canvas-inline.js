import MatrixEngineWGPU from "../src/world.js";
import {downloadMeshes} from '../src/engine/loader-obj.js';
import {addRaycastsAABBListener} from "../src/engine/raycast.js";
import {isMobile} from "../src/engine/utils.js";
import {MeshMorpher} from "../src/engine/procedural-mesh.js";

export var canvasInline = function() {
  let loadObjFile = new MatrixEngineWGPU({
    canvasSize: 'fullscreen',
    fastRender: 0.85,
    dontUsePhysics: true,
    MAX_SPOTLIGHTS: isMobile() ? 1 : 2,
    MAX_BONES: 0,
    mainCameraParams: {
      type: 'WASD',
      responseCoef: 1000
    },
    clearColor: {r: 0, b: 0, g: 0, a: 0}
  }, () => {
    loadObjFile.addLight();

    downloadMeshes({ball: "./res/meshes/blender/sphere.obj", cube: "./res/meshes/blender/plane.obj", },
      onLoadObj, {scale: [1, 1, 1]})
    downloadMeshes({plane: "./res/meshes/blender/plane.obj"}, onGround, {scale: [30, 0.5, 30]})

    addRaycastsAABBListener('canvas1', 'click');

    function onGround(m) {
      let floor = loadObjFile.addMeshObj({
        material: {type: 'standard'},
        position: {x: 0, y: -5, z: -10},
        rotation: {x: 0, y: 0, z: 0},
        rotationSpeed: {x: 0, y: 0, z: 0},
        texturesPaths: ['./res/textures/floor1.webp'], //, './res/textures/env-maps/sky1_lod_mid.webp'],
        name: 'floor',
        mesh: m.plane,
        physics: {
          enabled: false,
          mass: 0,
          geometry: "Cube"
        }
      })

      setTimeout(() => {
        const checker2 = floor.createCheckerboardTexture(256, 128, [0, 50, 50, 255], [20, 200, 200, 255]);
        let samplerTest = loadObjFile.device.createSampler({
          magFilter: 'nearest',
          minFilter: 'nearest',
          addressModeU: 'repeat',
          addressModeV: 'repeat',
        });
        floor.changeTexture(checker2, samplerTest);
        floor.setUVScale(8, 8);
      }, 500)
    }

    async function onLoadObj(m) {
      let VIDEO_ARG = {
        type: 'canvas2d-inline',
        canvaInlineProgram: (() => {
          const COLS = Math.floor(512 / 14);
          const drops = Array.from({length: COLS}, () => Math.floor(Math.random() * -40));
          const chars = 'アイウエオカキクケコアイウエオ';
          // const chars = '01';
          let frame = 0;
          function roundRect(ctx, x, y, w, h, r) {
            ctx.beginPath();
            ctx.moveTo(x + r, y);
            ctx.lineTo(x + w - r, y);
            ctx.quadraticCurveTo(x + w, y, x + w, y + r);
            ctx.lineTo(x + w, y + h - r);
            ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
            ctx.lineTo(x + r, y + h);
            ctx.quadraticCurveTo(x, y + h, x, y + h - r);
            ctx.lineTo(x, y + r);
            ctx.quadraticCurveTo(x, y, x + r, y);
            ctx.closePath();
          }
          return (ctx) => {
            const W = ctx.canvas.width;
            const H = ctx.canvas.height;
            const pulse = 0.85 + 0.15 * Math.sin(frame * 0.06);
            // fade trail
            ctx.fillStyle = 'rgba(0, 0, 0, 0.01)';
            ctx.fillRect(0, 0, W, H);
            // matrix rain
            // ctx.font = '13px monospace';
            for(let i = 0;i < COLS;i++) {
              const ch = chars[Math.floor(Math.random() * chars.length)];
              const br = Math.random();
              ctx.fillStyle = br > 0.82
                ? '#ffffff4b'
                : `rgba(0,${Math.floor(160 + br * 95)},${Math.floor(br * 60)},${0.4 + br * 0.6})`;
              ctx.fillText(ch, i * 14, drops[i] * 14);
              if(drops[i] * 14 > H + 14 && Math.random() > 0.975) drops[i] = 0;
              else drops[i]++;
            }

            // ctx.save();
            ctx.shadowColor = '#00ff4052';
            ctx.shadowBlur = 18 * pulse;
            // ctx.restore();

            // ctx.font = 'bold 11px monospace';
            // ctx.fillStyle = `rgba(0,${Math.floor(180 * pulse)},50,0.6)`;
            // ctx.fillText(`FRM:${String(frame).padStart(5, '0')}`, 18, H - 12);
            // ctx.fillText('MatrixEngine-WGPU', W - 170, H - 12);

            frame++;
          };
        })()
      };

      let sky = loadObjFile.addMeshObj({
        material: {type: 'standard', share: true},
        position: {x: 0, y: -1, z: -20},
        rotation: {x: 0, y: 0, z: 0},
        scale: [100, 100, 100],
        rotationSpeed: {x: 0, y: 0.5, z: 0},
        texturesPaths: ['./res/textures/env-maps/sky1_lod_mid.webp'],
        name: 'sky',
        mesh: m.ball,
        isVideo: VIDEO_ARG,
        physics: {
          enabled: false,
          geometry: "Sphere"
        }
      });

      // share: true if not defined it is false.
      let MYCUBE = loadObjFile.addMeshObj({
        material: {type: 'standard', share: true},
        position: {x: 0, y: 7, z: -10},
        rotation: {x: 0, y: 0, z: 0},
        scale: [7, 7, 7],
        rotationSpeed: {x: 0, y: 3, z: 0},
        texturesPaths: ['./res/textures/env-maps/sky1_lod_mid.webp'],
        name: 'cube',
        mesh: m.cube,
        raycast: {enabled: true, radius: 1},
        physics: {
          enabled: false,
          mass: 0,
          geometry: "Cube"
        },
        // pointerEffect: {
        //   enabled: true,
        //   flameEmitter: true
        //   // flameEffect: true
        // }
      })

      let MYCYLINDER = loadObjFile.addProceduralMeshObj({
        material: {type: 'standard', share: true},
        position: {x: 0, y: 7, z: -10},
        rotation: {x: 0, y: 0, z: 0},
        scale: [5, 5, 5],
        rotationSpeed: {x: 0, y: 0, z: 0},
        texturesPaths: ['./res/textures/env-maps/sky1_lod_mid.webp'],
        meshA: MeshMorpher.sphere(1, 2),
        meshB: MeshMorpher.cube(1),
        name: `morph_1`,
        physics: {
          enabled: false
        },
        raycast: {enabled: true, radius: 1}
      });

      loadObjFile.lightContainer[0].setIntensity(10);

      // if(isMobile() == false) {
        loadObjFile.activateBloomEffect();
        loadObjFile.lightContainer[0].behavior.setOsc0(-2, 2, 0.01)
        loadObjFile.lightContainer[0].behavior.value_ = -1;
        loadObjFile.lightContainer[0].updater.push((light) => {
          light.setTargetX(light.behavior.setPath0());
          light.setPosX(light.behavior.setPath0());
        })
        loadObjFile.lightContainer[0].setPosition(0, 25, -10);
        loadObjFile.lightContainer[0].setTarget(0, 0, -10);
      // }

      setTimeout(() => {
        // Load canvas tex in runtime...
        MYCUBE.loadVideoTexture(VIDEO_ARG);

        MYCUBE.setBlend(0.1);
        MYCUBE.setupPipeline();

        MYCYLINDER.loadVideoTexture(VIDEO_ARG);
        MYCYLINDER.setBlend(0.1);
        MYCYLINDER.setupPipeline();

        // MYCUBE.effects.flameEmitter.setIntensity(100);
        // MYCUBE.effects.flameEmitter.recreateVertexDataCrazzy(4); 
        // MYCUBE.setAmbient(10, 1, 0);
        let cam = app.getCamera();
        cam.setYaw(-0.03);
        cam.setPitch(-0.49);
        cam.setZ(5);
        cam.setY(20);
        app.buildRenderBuckets();
        cam._dirtyAngle = true;
      }, 800);
    }

    let STATUS = 1;
    loadObjFile.canvas.addEventListener("ray.hit.event", (e) => {
      // console.log('ray.hit.event detected');
      if(e.detail.hitObject.name == 'morph_1') {
        // if(e.detail.hitObject.effects.flameEmitter) e.detail.hitObject.effects.flameEmitter.recreateVertexDataCrazzy(4)
        e.detail.hitObject.morphTo(STATUS)
        if(STATUS == 1) STATUS = 0;
        else STATUS = 1;
      }
    });
  })
  window.app = loadObjFile;
}