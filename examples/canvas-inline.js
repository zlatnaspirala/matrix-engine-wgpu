import MatrixEngineWGPU from "../src/world.js";
import {downloadMeshes} from '../src/engine/loader-obj.js';
import {addRaycastsAABBListener} from "../src/engine/raycast.js";
import {isMobile} from "../src/engine/utils.js";

export var canvasInline = function() {
  let loadObjFile = new MatrixEngineWGPU({
    canvasSize: 'fullscreen',
    fastRender: 0.6,
    dontUsePhysics: true,
    mainCameraParams: {
      type: 'WASD',
      // type: 'firstPersonCamera',
      responseCoef: 1000
    },
    clearColor: {r: 0, b: 0.122, g: 0.122, a: 1}
  }, () => {
    loadObjFile.addLight();

    downloadMeshes({ball: "./res/meshes/blender/sphere.obj", cube: "./res/meshes/blender/cube.obj", },
      onLoadObj, {scale: [1, 1, 1]})
    downloadMeshes({cube: "./res/meshes/blender/cube.obj"}, onGround, {scale: [30, 0.5, 30]})

    addRaycastsAABBListener('canvas1', 'click');

    function onGround(m) {
      loadObjFile.addMeshObj({
        material: {type: 'standard'},
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
      loadObjFile.addMeshObj({
        material: {type: 'standard'},
        position: {x: 0, y: -1, z: -20},
        rotation: {x: 0, y: 0, z: 0},
        scale: [100, 100, 100],
        rotationSpeed: {x: 0, y: 110.5, z: 0},
        texturesPaths: ['./res/textures/env-maps/sky1_lod_mid.webp'],
        name: 'sky',
        mesh: m.ball,
        physics: {
          enabled: false,
          geometry: "Sphere"
        }
      });

      // share: true if not defined it is false.
      let MYCUBE = loadObjFile.addMeshObj({
        material: {type: 'standard', share: true},
        position: {x: 0, y: 3, z: -10},
        rotation: {x: 0, y: 0, z: 0},
        rotationSpeed: {x: 0, y: 0, z: 0},
        texturesPaths: ['./res/textures/floor1.webp'],
        name: 'cube',
        mesh: m.cube,
        envMapParams: {
          baseColorMix: 0.3,                // CLEAR SKY
          mirrorTint: [0.9, 0.95, 1.0],     // Slight cool tint
          reflectivity: 0.35,               // 25% reflection blend
          illuminateColor: [0.3, 0.7, 1.0], // Soft cyan
          illuminateStrength: 0.5,          // Gentle rim
          illuminatePulse: 0.1,             // No pulse (static)
          fresnelPower: 5,                  // Medium-sharp edge
          envLodBias: 1.5,
          usePlanarReflection: false,       // ✅ Env map mode
        },
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

      loadObjFile.lightContainer[0].setIntensity(5);

      if(isMobile() == false) {
        loadObjFile.activateBloomEffect();
        loadObjFile.lightContainer[0].behavior.setOsc0(-2, 2, 0.01)
        loadObjFile.lightContainer[0].behavior.value_ = -1;
        loadObjFile.lightContainer[0].updater.push((light) => {
          light.setTargetX(light.behavior.setPath0());
          light.setPosX(light.behavior.setPath0());
        })
        loadObjFile.lightContainer[0].setPosition(0, 15, -10);
        loadObjFile.lightContainer[0].setTarget(0, 0, -10);
      }

      setTimeout(() => {
        // let TEST = app.getSceneObjectByName('cube')
        MYCUBE.loadVideoTexture({
          type: 'canvas2d-inline',
          canvaInlineProgram: (() => {

            // ── matrix rain state ──────────────────────────────────────
            const COLS = Math.floor(512 / 14);
            const drops = Array.from({length: COLS}, () => Math.floor(Math.random() * -40));
            const chars = 'アイウエオカキクケコ01アイウエオ';
            let frame = 0;

            // ── panel anchors — change x/y to move entire panel ────────
            const BALANCE = {x: 18, y: 18, w: 220, h: 108, r: 8};
            const BALLS = {x: 274, y: 18, w: 220, h: 108, r: 8};

            // ── helpers ────────────────────────────────────────────────
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

            function drawPanel(ctx, p, pulse) {
              ctx.fillStyle = 'rgba(0,0,0,0.6)';
              roundRect(ctx, p.x, p.y, p.w, p.h, p.r);
              ctx.fill();
              ctx.strokeStyle = `rgba(0,${Math.floor(200 * pulse)},50,0.7)`;
              ctx.lineWidth = 1;
              roundRect(ctx, p.x, p.y, p.w, p.h, p.r);
              ctx.stroke();
            }

            // ── main draw — called every frame by loadVideoTexture ─────
            return (ctx, {balance = 99840, balls = 3, maxBalls = 5} = {}) => {
              const W = ctx.canvas.width;
              const H = ctx.canvas.height;
              const pulse = 0.85 + 0.15 * Math.sin(frame * 0.06);

              // fade trail
              ctx.fillStyle = 'rgba(0,0,0,0.18)';
              ctx.fillRect(0, 0, W, H);

              // matrix rain
              ctx.font = '12px monospace';
              for(let i = 0;i < COLS;i++) {
                const ch = chars[Math.floor(Math.random() * chars.length)];
                const br = Math.random();
                ctx.fillStyle = br > 0.92
                  ? '#ffffff'
                  : `rgba(0,${Math.floor(160 + br * 95)},${Math.floor(br * 60)},${0.4 + br * 0.6})`;
                ctx.fillText(ch, i * 14, drops[i] * 14);
                if(drops[i] * 14 > H + 14 && Math.random() > 0.975) drops[i] = 0;
                else drops[i]++;
              }

              ctx.save();
              ctx.shadowColor = '#00ff41';
              ctx.shadowBlur = 18 * pulse;

              // ── BALANCE panel ─────────────────────────────────────────
              const B = BALANCE;
              drawPanel(ctx, B, pulse);

              ctx.font = 'bold 11px monospace';
              ctx.fillStyle = 'rgba(0,200,60,0.55)';
              ctx.fillText('MATRIX ENGINE // PINBALL', B.x + 12, B.y + 18);

              ctx.font = 'bold 13px monospace';
              ctx.fillStyle = `rgba(0,${Math.floor(220 * pulse)},60,0.85)`;
              ctx.fillText('BALANCE', B.x + 12, B.y + 46);

              ctx.font = 'bold 32px monospace';
              ctx.fillStyle = `rgba(0,${Math.floor(255 * pulse)},80,1)`;
              ctx.fillText(balance.toLocaleString(), B.x + 12, B.y + 82);

              // ── BALLS panel ───────────────────────────────────────────
              const BL = BALLS;
              drawPanel(ctx, BL, pulse);

              ctx.font = 'bold 13px monospace';
              ctx.fillStyle = `rgba(0,${Math.floor(220 * pulse)},60,0.85)`;
              ctx.fillText('BALLS', BL.x + 12, BL.y + 46);

              for(let b = 0;b < maxBalls;b++) {
                ctx.beginPath();
                ctx.arc(BL.x + 24 + b * 34, BL.y + 70, 12, 0, Math.PI * 2);
                if(b < balls) {
                  ctx.fillStyle = `rgba(0,${Math.floor(255 * pulse)},80,1)`;
                  ctx.shadowBlur = 14 * pulse;
                } else {
                  ctx.fillStyle = 'rgba(0,60,20,0.5)';
                  ctx.shadowBlur = 0;
                }
                ctx.fill();
              }

              ctx.restore();

              // ── footer ────────────────────────────────────────────────
              ctx.font = 'bold 11px monospace';
              ctx.fillStyle = `rgba(0,${Math.floor(180 * pulse)},50,0.6)`;
              ctx.fillText(`FRM:${String(frame).padStart(5, '0')}`, 18, H - 12);
              ctx.fillText('MatrixEngine-WGPU', W - 170, H - 12);

              frame++;
            };
          })()
        });

        // MYCUBE.effects.flameEmitter.setIntensity(100);
        // MYCUBE.effects.flameEmitter.recreateVertexDataCrazzy(4); 
        MYCUBE.setAmbient(10, 1, 0);
        let cam = app.getCamera();
        cam.setYaw(-0.03);
        cam.setPitch(-0.49);
        cam.setZ(0);
        cam.setY(10);
        app.buildRenderBuckets(app.mainRenderBundle);
        cam._dirtyAngle = true;
      }, 800);
    }

    loadObjFile.canvas.addEventListener("ray.hit.event", (e) => {
      // console.log('ray.hit.event detected');
      if(e.detail.hitObject.name.startsWith('cube')) {
        e.detail.hitObject.effects.flameEmitter.recreateVertexDataCrazzy(4)
      }
    });

  })
  window.app = loadObjFile;
}