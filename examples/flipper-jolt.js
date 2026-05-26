import MatrixEngineWGPU from "../src/world.js";
import {downloadMeshes} from "../src/engine/loader-obj.js";
import {addRaycastsAABBListener} from "../src/engine/raycast.js";
import {byId, isMobile, mb, randomFloatFromTo, randomIntFromTo} from "../src/engine/utils.js";
import {PVector} from "../src/engine/matrix-class.js";
import {MobileDOM} from "../src/engine/cameras.js";

export var flipperJolt = function() {
  let MYFLIPPER = {
    BALANCE: 0,
    BALLS: 5,
    STATUS_PUSH: 'wait'
  };

  let flipper = new MatrixEngineWGPU({
    // render: isMobile() == true ? 'mobile1' : undefined,
    fastRender: 0.8,
    useJolt: true,
    canvasSize: 'fullscreen',
    mainCameraParams: {type: 'WASD', responseCoef: 1000},
    PHYSICS_GROUND_BYZ: 40,
    PHYSICS_GROUND_BYX: 12,
    MAX_SPOTLIGHTS: isMobile() ? 4 : 4,
    clearColor: {r: 0, g: 1, b: 1, a: 1}
  }, () => {
    let hingeLeftID = 0;
    let hingeRightID = 0;
    const POWERPIN = 10;
    // Audios
    flipper.matrixSounds.createAudio('music', 'res/audios/hyperball_pursuit.mp3', 1);
    // flipper.matrixSounds.createAudio('music2', 'res/audios/rpg/wizard-rider.mp3', 1)
    flipper.matrixSounds.createAudio('push', 'res/audios/push.mp3', 1);
    flipper.matrixSounds.createAudio('click1', './res/audios/kenney/mp3/click1.mp3', 4);
    flipper.matrixSounds.createAudio('click3', './res/audios/kenney/mp3/click3.mp3', 4);
    flipper.matrixSounds.audios.music.volume = 0.25;
    flipper.matrixSounds.audios.music.loop = true;
    flipper.matrixSounds.audios.push.volume = 1;
    flipper.matrixSounds.audios.click1.volume = 1;
    flipper.matrixSounds.audios.click3.volume = 1;
    flipper.matrixSounds.play('music');

    addEventListener('PhysicsReady', () => {
      addRaycastsAABBListener();

      flipper.matrixSounds.speedUpSimulation(1);

      downloadMeshes({
        cube: "./res/meshes/blender/cube.obj",
        ball: "./res/meshes/shapes/sphere-uv-cubeproj.obj",
        pin: "./res/meshes/blender/pin-for-pinball.obj",
        pinR: "./res/meshes/blender/pin-for-pinball_right.obj",
        pushBtn: "./res/meshes/shapes/pushBtn.obj",
        vrcLeft: "./res/meshes/blender/vrc-left.obj",
        jumper: "./res/meshes/blender/jumper-up.obj",
        bottomLeft: "./res/meshes/blender/bottom-left.obj",
        glass: "./res/meshes/shapes/plane-subdivine-16.obj",
        bigBox: "./res/meshes/shapes/flipperBigBox.obj",
        plane: "./res/meshes/blender/plane.obj"
      },
        onGround, {scale: [1, 1, 1]});
    });

    if(isMobile()) byId('mobileControls').style.marginRight = '30%';

    MobileDOM.addButton("PUSH", async () => {
      let ball = app.matrixPhysics.getBodyByName('ball1');
      const pos = await app.matrixPhysics.getPosition(ball);
      if(pos.x > 5 && pos.z > -6.6) {
        if(MYFLIPPER.BALLS == 0) {
          mb.show('No more balls...')
          return;
        }
        flipper.matrixPhysics.applyImpulse(ball,
          new PVector(0, 0.1, -randomIntFromTo(0.5, 1)));
        flipper.matrixSounds.play('push');
        MYFLIPPER.BALLS--;
      }
    }, () => {}, {left: '80', bottom: '50'});

    // Lights
    const NUM_LIGHTS = isMobile() == true ? 3 : 4;
    const ORBIT_RADIUS = 8;
    const ORBIT_SPEED = 0.7;
    const TARGET = {x: 0, y: 0, z: -17};

    // Light colors cycling around the hue wheel
    const LIGHT_COLORS = [
      [2.5, 0.2, 0.2],  // red
      [2.5, 0.8, 0.1],  // orange
      [0.2, 0.2, 3.0],  // blue
      [2.0, 3.0, 0.1],  // yellow
      // [0.2, 1.0, 0.2],  // green
      // [0.1, 1.0, 0.6],  // teal
      // [0.1, 0.6, 1.0],  // sky
      // [0.6, 0.1, 1.0],  // purple
      // [1.0, 0.1, 0.8],  // pink
      // [1.0, 0.1, 0.4],  // rose
    ];

    for(let i = 0;i < NUM_LIGHTS;i++) {flipper.addLight()}
    // if(isMobile() == false) 
    for(let i = 0;i < NUM_LIGHTS;i++) {
      const light = flipper.lightContainer[i];
      const angleOffset = (i / NUM_LIGHTS) * Math.PI * 2;
      const color = LIGHT_COLORS[i];
      light.setIntensity(16);
      light.color = color;
      // Orbit height varies slightly per light for more visual interest
      const heightOffset = Math.sin(angleOffset) * 5;
      light.setPosition(
        TARGET.x + Math.cos(angleOffset) * ORBIT_RADIUS,
        4 + heightOffset,
        TARGET.z + Math.sin(angleOffset) * ORBIT_RADIUS
      );
      light.setTarget(TARGET.x, TARGET.y, TARGET.z);
      // Each light orbits at its own phase offset
      light.orbitAngle = angleOffset;
      light.updater.push((light) => {
        light.orbitAngle += ORBIT_SPEED * 0.01;
        const height = 8 + Math.sin(light.orbitAngle + angleOffset) * 5;
        const x = TARGET.x + Math.cos(light.orbitAngle) * ORBIT_RADIUS;
        const z = TARGET.z + Math.sin(light.orbitAngle) * ORBIT_RADIUS;
        light.setPosition(x, height, z);
        light.setTarget(TARGET.x, TARGET.y, TARGET.z);
      });
    }

    async function onGround(m) {
      // Ball
      const ball1 = flipper.addMeshObj({
        material: {type: 'standard', share: true},
        position: {x: 2, y: 1, z: -17},
        scale: [0.25, 0.25, 0.25],
        texturesPaths: ['./res/textures/blankgray2.webp'],
        name: 'ball1',
        mesh: m.ball,
        shadowsCast: false,
        physics: {
          enabled: true,
          mass: 0.05,
          geometry: "Sphere",
          group: 2,
          mask: -1
        },
        raycast: {enabled: false, radius: 1},
      });

      if(isMobile() == false) {
        // Shooter btn
        let pushBtn = flipper.addMeshObj({
          position: {x: 5, y: 0.7, z: -5.7},
          scale: [0.3, 0.3, 0.3],
          rotation: {x: 90, y: -90, z: 0},
          texturesPaths: ['res/textures/pushBtn.webp'],
          name: 'pushBtn',
          mesh: m.pushBtn,
          physics: {
            enabled: false,
            mass: 5,
            geometry: "Cube"
          },
          raycast: {enabled: true, radius: 1}
        });

        pushBtn.setUVScale(-1, -1);
      }

      // GROUND
      flipper.addMeshObj({
        position: {x: 0, y: -0.1, z: -21},
        scale: [6, 0.1, 15],
        texturesPaths: ['./res/icons/editor/chatgpt-gen-bg-inv.webp'],
        name: 'ground',
        mesh: m.cube,
        shadowsCast: false,
        physics: {
          enabled: false,
          mass: 0,
          geometry: "Cube"
        }
      });

      let TEXTBOX = {
        type: 'canvas2d-inline',
        specialCanvas2dArg: {middle: true},
        canvaInlineProgram: (() => {
          const COLS = Math.floor(512 / 16);
          const drops = Array.from({length: COLS}, () => Math.floor(Math.random() * -30));
          const chars = '0123♢✮♦♠♥♣';
          let frame = 0;

          const BALANCE = {x: 0, y: 0, w: 256, h: 128, r: 10};
          const BALLS = {x: 0, y: 128, w: 256, h: 128, r: 10};

          const PALETTE = [
            [255, 110, 180], [0, 220, 255], [255, 200, 0],
            [0, 255, 120], [180, 0, 255]
          ];

          function hue(i, t) {
            const index = Math.floor(i) % PALETTE.length;
            const [r, g, b] = PALETTE[index < 0 ? 0 : index];
            const p = 0.88 + 0.12 * Math.sin(t * 0.05 + i * 1.2);
            return [Math.floor(r * p), Math.floor(g * p), Math.floor(b * p)];
          }

          function roundRect(ctx, x, y, w, h, r) {
            ctx.beginPath();
            ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y);
            ctx.quadraticCurveTo(x + w, y, x + w, y + r);
            ctx.lineTo(x + w, y + h - r);
            ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
            ctx.lineTo(x + r, y + h);
            ctx.quadraticCurveTo(x, y + h, x, y + h - r);
            ctx.lineTo(x, y + r);
            ctx.quadraticCurveTo(x, y, x + r, y);
            ctx.closePath();
          }

          function drawPanel(ctx, p, [r, g, b], pulse, alpha = 0.05) {
            const grad = ctx.createLinearGradient(p.x, p.y, p.x + p.w, p.y + p.h);
            grad.addColorStop(0, `rgba(255,255,255,${alpha})`);
            grad.addColorStop(1, `rgba(255,2,255,${alpha + 0.1})`);
            ctx.fillStyle = grad;
            roundRect(ctx, p.x, p.y, p.w, p.h, p.r); ctx.fill();

            ctx.strokeStyle = `rgba(${r},${g},${b},0.95)`;
            ctx.lineWidth = 2.5;
            ctx.shadowColor = `rgb(${r},${g},${b})`;
            ctx.shadowBlur = 22 * pulse;
            roundRect(ctx, p.x, p.y, p.w, p.h, p.r); ctx.stroke();
            ctx.shadowBlur = 0;

            const tk = 11;
            ctx.strokeStyle = `rgb(${r},${g},${b})`;
            ctx.lineWidth = 2.5;
            [[p.x, p.y, 1, 1], [p.x + p.w, p.y, -1, 1], [p.x, p.y + p.h, 1, -1], [p.x + p.w, p.y + p.h, -1, -1]]
              .forEach(([cx, cy, sx, sy]) => {
                ctx.beginPath();
                ctx.moveTo(cx + sx * tk, cy);
                ctx.lineTo(cx, cy);
                ctx.lineTo(cx, cy + sy * tk);
                ctx.stroke();
              });
          }

          return (ctx, {maxBalls = 5} = {}) => {
            const balls = MYFLIPPER.BALLS;

            const W = ctx.canvas.width, H = ctx.canvas.height;
            const pulse = 0.8 + 0.2 * Math.sin(frame * 0.07);
            const t = frame;

            // === YOUR ORIGINAL RAIN SETTINGS (this worked) ===
            ctx.fillStyle = 'rgb(255, 255, 255)';
            ctx.fillRect(0, 0, W, H);

            for(let y = 0;y < H;y += 4) {
              ctx.fillStyle = 'rgb(255, 255, 255)';
              ctx.fillRect(0, y, W, 1);
            }

            ctx.font = 'bold 13px monospace';
            for(let i = 0;i < COLS;i++) {
              const ch = chars[Math.floor(Math.random() * chars.length)];
              const [r, g, b] = PALETTE[i % PALETTE.length];
              const br = 0.4 + Math.random() * 0.6;
              ctx.fillStyle = br > 0.93
                ? '#ffffff'
                : `rgba(${Math.floor(r * br)},${Math.floor(g * br)},${Math.floor(b * br)},0.9)`;
              ctx.fillText(ch, i * 16, drops[i] * 16);

              if(drops[i] * 16 > H + 16 && Math.random() > 0.97) drops[i] = 0;
              else drops[i]++;
            }

            ctx.save();

            // BALANCE PANEL
            const B = BALANCE;
            const bc = hue(1, t);
            drawPanel(ctx, B, bc, pulse, 0.01);

            ctx.font = 'bold 12px monospace';
            ctx.fillStyle = '#000000';
            ctx.shadowBlur = 8 * pulse;
            ctx.shadowColor = `rgb(${bc[0]},${bc[1]},${bc[2]})`;
            ctx.fillText('◈ MATRIX PINBALL ◈', B.x + 14, B.y + 20);

            ctx.font = 'bold 15px monospace';
            ctx.shadowBlur = 14 * pulse;
            ctx.fillText('BALANCE: ', B.x + 14, B.y + 46);

            const val = MYFLIPPER.BALANCE.toLocaleString();
            ctx.font = 'bold 42px monospace';
            let dx = B.x + 14;
            for(let i = 0;i < val.length;i++) {
              const [r, g, b] = hue(i, t);
              ctx.fillStyle = `rgb(${r},${g},${b})`;
              ctx.shadowColor = `rgb(${r},${g},${b})`;
              ctx.shadowBlur = 16 * pulse;

              ctx.strokeStyle = '#000000';
              ctx.lineWidth = 4;
              ctx.strokeText(val[i], dx, B.y + 90);
              ctx.fillText(val[i], dx, B.y + 90);
              dx += ctx.measureText(val[i]).width + 2;
            }

            // BALLS PANEL
            const BL = BALLS;
            const mc = hue(0, t);
            drawPanel(ctx, BL, mc, pulse, 0.06);

            ctx.font = 'bold 12px monospace';
            ctx.fillStyle = '#000000';
            ctx.shadowBlur = 10 * pulse;
            ctx.shadowColor = `rgb(${mc[0]},${mc[1]},${mc[2]})`;
            ctx.fillText('◈ FLIPPER STATUS ◈', BL.x + 14, BL.y + 20);

            ctx.font = 'bold 16px monospace';
            ctx.shadowBlur = 14 * pulse;
            ctx.fillText('BALLS REMAINING', BL.x + 14, BL.y + 46);

            for(let b = 0;b < maxBalls;b++) {
              const bx = BL.x + 28 + b * 42;
              const by = BL.y + 85;
              const [r, g, b2] = hue(b, t);
              const radius = 17.5;

              ctx.beginPath();
              ctx.arc(bx, by, radius, 0, Math.PI * 2);

              if(b < balls) {
                const bg = ctx.createRadialGradient(bx - 5, by - 5, 3, bx, by, radius);
                bg.addColorStop(0, '#ffffff');
                bg.addColorStop(0.35, `rgb(${r},${g},${b2})`);
                bg.addColorStop(1, `rgb(${Math.floor(r * 0.25)},${Math.floor(g * 0.25)},${Math.floor(b2 * 0.25)})`);
                ctx.fillStyle = bg;
                ctx.shadowColor = `rgb(${r},${g},${b2})`;
                ctx.shadowBlur = 26 * pulse;
              } else {
                ctx.fillStyle = 'rgba(30,10,40,0.85)';
                ctx.shadowBlur = 0;
              }
              ctx.fill();

              if(b < balls) {
                ctx.font = 'bold 15px monospace';
                ctx.fillStyle = '#000000';
                ctx.shadowBlur = 0;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText((b + 1).toString(), bx, by);
                ctx.textAlign = 'left';
                ctx.textBaseline = 'alphabetic';
              }
            }

            ctx.restore();

            // Footer
            const ft = hue(2, t);
            ctx.font = 'bold 10px monospace';
            ctx.fillStyle = '#000000';
            ctx.shadowColor = `rgb(${ft[0]},${ft[1]},${ft[2]})`;
            ctx.shadowBlur = 0;
            ctx.fillText('flipper: "Z" and "M" and for shootBall "Space"', 2, H - 10);
            ctx.shadowBlur = 0;

            frame++;
          };
        })()
      };

      let TEST;
      // if(isMobile() == false) 
      TEST = flipper.addMeshObj({
        material: {type: 'standard', share: false},
        position: {x: 0, y: 10, z: -35},
        scale: [7.5, 7.5, 7.5],
        rotation: {x: 90, y: 0, z: 0},
        texturesPaths: ['./res/icons/editor/chatgpt-gen-bg-inv.webp'],
        name: 'bigBox',
        // mesh: m.bigBox,
        mesh: m.plane,
        shadowsCast: false,
        isVideo: TEXTBOX,
        physics: {
          enabled: false,
          mass: 0,
          geometry: "Cube"
        },
      });

      // // canvas2d-inline
      // TEST.loadVideoTexture({
      //   type: 'canvas2d-inline',
      // });

      let envMapParams = {
        baseColorMix: 0.1,                // CLEAR SKY
        mirrorTint: [0.9, 0.95, 1.0],     // Slight cool tint
        reflectivity: 0.45,               // 25% reflection blend
        illuminateColor: [0.3, 0.7, 1.0], // Soft cyan
        illuminateStrength: 0.5,          // Gentle rim
        illuminatePulse: 0.01,            // No pulse (static)
        fresnelPower: 2.0,                // Medium-sharp edge
        envLodBias: 1.5,
        usePlanarReflection: false,       // ✅ Env map mode
      }

      if(isMobile() == false) {
        let glass = flipper.addMeshObj({
          material: {type: 'mirror'},
          position: {x: 0, y: 2.1, z: -20.5},
          scale: [6, 0.05, 14.5],
          texturesPaths: ['./res/textures/default2.png', './res/icons/editor/chatgpt-gen-bg-inv.webp'],
          name: 'glass',
          mesh: m.glass,
          shadowsCast: false,
          envMapParams: envMapParams,
          physics: {
            enabled: true,
            mass: 0,
            geometry: "Cube"
          }
        });
        glass.setBlend(0.1);

      } else {

        // let glass = flipper.addMeshObj({
        //   material: {type: 'standard'},
        //   position: {x: 0, y: 2.1, z: -20.5},
        //   scale: [6, 0.05, 14.5],
        //   texturesPaths: ['./res/textures/tex01.webp'], //['./res/icons/editor/chatgpt-gen-bg-inv.webp'],
        //   name: 'glass',
        //   mesh: m.glass,
        //   shadowsCast: false,
        //   // envMapParams: envMapParams,
        //   physics: {
        //     enabled: true,
        //     mass: 0,
        //     geometry: "Cube"
        //   }
        // });

        // glass.setBlend(0.01);
      }

      // BUMPERS
      const bumperPositions = [
        {x: 0, y: 0.7, z: -22},
        {x: 2, y: 0.7, z: -24},
        {x: -2, y: 0.7, z: -26},
        {x: -2, y: 0.7, z: -29}
      ];

      bumperPositions.forEach((p, i) => {
        flipper.addMeshObj({
          material: {type: 'standard'},
          position: p,
          scale: [0.6, 0.6, 0.6],
          texturesPaths: ['./res/textures/star1.png'],
          name: 'bumper' + i,
          mesh: m.ball,
          physics: {
            enabled: true,
            mass: 0,
            // geometry: "Sphere",
            // geometry: 'Cylinder',
            geometry: 'Cube',
            group: 2,
            mask: -1 // & ~1, // collide with everything EXCEPT group 1 (ground)
          },
          // raycast: {enabled: true, radius: 1}
        });
      });

      // Edges
      const TEdge = flipper.addMeshObj({
        material: {type: 'standard', share: true},
        position: {x: 0, y: 1, z: -36},
        scale: [6.2, 1, 0.5],
        texturesPaths: ['./res/textures/blankgray2.webp'],
        name: 'edgeTop',
        mesh: m.cube,
        physics: {
          enabled: true,
          mass: 0,
          geometry: "Cube",
          group: 2,
          mask: -1 & ~1
        }
      });

      // Inside flipper
      const topCurveInLeft = flipper.addMeshObj({
        material: {type: 'standard', share: true},
        position: {x: 4.5, y: 0.9, z: -36},
        scale: [1, 0.8, 1],
        texturesPaths: ['./res/textures/blankgray2.webp'],
        name: 'vrc-left',
        mesh: m.vrcLeft,
        physics: {
          enabled: true,
          mass: 0,
          geometry: "ConvexHull",
          vertices: m.vrcLeft.vertices,
          group: 2,
          mask: -1 & ~1
        }
      });

      const jumper1 = flipper.addMeshObj({
        material: {type: 'standard', share: true},
        position: {x: -4.8, y: 0.4, z: -29.3},
        scale: [1, 1, 1],
        texturesPaths: ['./res/textures/blankgray2.webp'],
        name: 'jumper1',
        mesh: m.jumper,
        physics: {
          enabled: true,
          mass: 0,
          geometry: "ConvexHull",
          vertices: m.jumper.vertices,
          group: 2,
          mask: -1 & ~1, // collide with everything EXCEPT group 1 (ground)
        }
      });

      const bottomLeft = flipper.addMeshObj({
        material: {type: 'standard', share: true},
        position: {x: -3.5, y: 0.3, z: -10},
        scale: [1, 1.2, 1],
        texturesPaths: ['./res/textures/blankgray2.webp'],
        name: 'bottomLeft',
        mesh: m.bottomLeft,
        physics: {
          enabled: true,
          mass: 0,
          geometry: "ConvexHull",
          vertices: m.bottomLeft.vertices
        }
      });

      const bottomRight = flipper.addMeshObj({
        material: {type: 'standard', share: true},
        position: {x: 3.5, y: 0.3, z: -10},
        rotation: {x: 0, y: 0, z: 0},
        scale: [-1, 1.2, 1],
        texturesPaths: ['./res/textures/blankgray2.webp'],
        name: 'bottomRight',
        mesh: m.bottomLeft,
        physics: {
          enabled: true,
          mass: 0,
          geometry: "ConvexHull",
          vertices: m.bottomLeft.vertices
        }
      });

      const BEdge = flipper.addMeshObj({
        material: {type: 'standard', share: true},
        position: {x: 0, y: 1, z: -6},
        rotation: {x: 0, y: 0, z: 0},
        scale: [6, 1.02, 0.2],
        texturesPaths: ['./res/textures/blankgray2.webp'],
        name: 'bottomEdge',
        mesh: m.cube,
        physics: {
          enabled: true,
          mass: 0,
          geometry: "Cube",
          group: 2,
          mask: -1 & ~1, // collide with everything EXCEPT group 1 (ground)
        }
      });

      const BEdgeYAngle = flipper.addMeshObj({
        material: {type: 'standard', share: true},
        position: {x: -0.6, y: 0.5, z: -6.5},
        rotation: {x: 0, y: -2.5, z: 0},
        scale: [4.8, 0.4, 0.1],
        texturesPaths: ['./res/textures/blankgray2.webp'],
        name: 'bottomEdge2',
        mesh: m.cube,
        physics: {
          enabled: true,
          mass: 0,
          geometry: "Cube",
          // layer: 0,
          group: 2,
          mask: -1
        }
      });

      const REdge = flipper.addMeshObj({
        material: {type: 'standard', share: true},
        position: {x: 5.8, y: 1, z: -21},
        scale: [0.2, 1, 15],
        rotation: {x: 0, y: 0, z: 0},
        texturesPaths: ['./res/textures/blankgray.webp'],
        name: 'edgeRigth',
        mesh: m.cube,
        physics: {
          enabled: true,
          mass: 0,
          geometry: "Cube"
        }
      });

      const REdge2 = flipper.addMeshObj({
        material: {type: 'standard', share: true},
        position: {x: 4.5, y: 1, z: -19.5},
        scale: [0.05, 1, 12.5],
        texturesPaths: ['./res/textures/blankgray.webp'],
        name: 'edgeRigth2',
        mesh: m.cube,
        physics: {
          enabled: true,
          mass: 0,
          geometry: "Cube"
        }
      });

      const LEdge = flipper.addMeshObj({
        material: {type: 'standard', share: true},
        position: {x: -5.7, y: 1, z: -21},
        scale: [0.3, 1, 15],
        texturesPaths: ['./res/textures/blankgray.webp'],
        name: 'edgeLeft',
        mesh: m.cube,
        physics: {
          enabled: true,
          mass: 0,
          geometry: "Cube"
        }
      });

      const checker2 = REdge.createCheckerboardTexture(256, 128, [0, 50, 50, 255], [20, 200, 200, 255]);
      let samplerTest = flipper.device.createSampler({
        magFilter: 'nearest',
        minFilter: 'nearest',
        addressModeU: 'repeat',
        addressModeV: 'repeat',
      });

      setTimeout(async () => {
        const leftBody = flipper.matrixPhysics.getBodyByName('flipperLeft');
        const rightBody = flipper.matrixPhysics.getBodyByName('flipperRight');

        MobileDOM.addButton("PIN-L", function() {
          // const leftBody = flipper.matrixPhysics.getBodyByName('flipperLeft');
          flipper.matrixPhysics.activate(leftBody, true);
          flipper.matrixPhysics.enableAngularMotor(hingeLeftID, true, -10, POWERPIN * 2);
          flipper.matrixSounds.play('click3');
        }, () => {
          setTimeout(() => {
            flipper.matrixPhysics.enableAngularMotor(hingeLeftID, true, 10, POWERPIN * 2);
            flipper.matrixSounds.play('click1');
          }, 30)
        },
          {left: '5'});

        MobileDOM.addButton("PIN-R", function() {
          // const rightBody = flipper.matrixPhysics.getBodyByName('flipperRight');
          flipper.matrixPhysics.activate(rightBody, true);
          flipper.matrixPhysics.enableAngularMotor(hingeRightID, true, 10, POWERPIN * 2);
          flipper.matrixSounds.play('click3');
        }, () => {
          setTimeout(() => {
            flipper.matrixPhysics.enableAngularMotor(hingeRightID, true, -10, POWERPIN * 2);
            flipper.matrixSounds.play('click1');
          }, 30)
        }, {left: '79'});

        flipper.matrixPhysics.activate(leftBody, true);
        flipper.matrixPhysics.activate(rightBody, true);
        flipper.matrixPhysics.setDamping(leftBody, 0., 0.);
        flipper.matrixPhysics.setDamping(rightBody, 0., 0.);
        flipper.matrixPhysics.setRestitution(leftBody, 0.1);
        flipper.matrixPhysics.setRestitution(rightBody, 0.1);
        flipper.matrixPhysics.setFriction(leftBody, 0.5);
        flipper.matrixPhysics.setFriction(rightBody, 0.5);
        let getLA = flipper.matrixPhysics.getBodyByName('flipperLeftAnchor');
        flipper.matrixPhysics.shootBody(getLA, 0, 0, 0, 0, 0, 0);
        let getRA = flipper.matrixPhysics.getBodyByName('flipperRightAnchor');
        flipper.matrixPhysics.shootBody(getRA, 0, 0, 0, 0, 0, 0);

        // BALL PHYSICS TUNING
        const ball = flipper.matrixPhysics.getBodyByName('ball1');
        flipper.matrixPhysics.setRestitution(ball, 0.1);
        flipper.matrixPhysics.setFriction(ball, 0.1);
        // FLIPPER SETUP
        const commonX = 0;
        const BA = flipper.matrixPhysics.getBodyByName('flipperLeft');
        const BB = flipper.matrixPhysics.getBodyByName('flipperLeftAnchor');
        const hingeLeft = app.matrixPhysics.addHingeConstraint(BA, BB, {
          name: "flipperLeftHinge",
          pivotA: [-commonX, 0, 0],
          pivotB: [0, 0, 0],
          axis: [0, 1, 0],
          limits: [-0.8, 0.5]
        });

        hingeLeft.then((idx) => {
          hingeLeftID = idx;
          app.matrixPhysics.setHingeLimit(idx, -0.8, 0.5, 0.0, 0.5, 1.0);
          app.matrixPhysics.enableAngularMotor(idx, true, 10, POWERPIN);
        })

        const BA1 = flipper.matrixPhysics.getBodyByName('flipperRight');
        const BB1 = flipper.matrixPhysics.getBodyByName('flipperRightAnchor');
        const hingeRight = app.matrixPhysics.addHingeConstraint(BA1, BB1, {
          name: "flipperRightHinge",
          pivotA: [commonX, 0, 0],
          pivotB: [0, 0, 0],
          axis: [0, 1, 0],
          limits: [-0.5, 0.8]
        });
        hingeRight.then((idx) => {
          hingeRightID = idx;
          app.matrixPhysics.enableAngularMotor(idx, true, -10, POWERPIN);   // increased strength
        })

        REdge.setUVScale(1, 1);
        // LEdge.changeTexture(checker2, samplerTest)
        LEdge.setUVScale(1, 1);
        REdge2.setUVScale(1, 1);

        let leftBodycurrPos = 'unpressed';
        window.addEventListener("keydown", (e) => {
          e.preventDefault();
          if(e.code === "KeyZ" && leftBodycurrPos == 'unpressed') {
            leftBodycurrPos = 'pressed';
            flipper.matrixPhysics.activate(leftBody, true);
            flipper.matrixPhysics.enableAngularMotor(hingeLeftID, true, -10, POWERPIN * 2);
            flipper.matrixSounds.play('click3');
          }
          if(e.code === "KeyM") {
            flipper.matrixPhysics.activate(rightBody, true);
            flipper.matrixPhysics.enableAngularMotor(hingeRightID, true, 10, POWERPIN * 2);
            flipper.matrixSounds.play('click3');
          }
        });

        window.addEventListener("keyup", async (e) => {
          if(e.code === "KeyZ") {
            leftBodycurrPos = 'unpressed';
            flipper.matrixPhysics.enableAngularMotor(hingeLeftID, true, 10, POWERPIN);
            flipper.matrixSounds.play('click1');
          }
          if(e.code === "KeyM") {
            flipper.matrixPhysics.enableAngularMotor(hingeRightID, true, -10, POWERPIN);
            flipper.matrixSounds.play('click1');
          }
          if(e.code == "Space") {
            MYFLIPPER.STATUS_PUSH = 'in action';
            let ball = app.matrixPhysics.getBodyByName(ball1.name);
            const pos = await app.matrixPhysics.getPosition(ball);
            if(pos.x > 5 && pos.z > -6) {
              if(MYFLIPPER.BALLS == 0) {
                mb.show('No more balls...')
                return;
              }
              flipper.matrixPhysics.applyImpulse(ball,
                new PVector(0, 0, -randomFloatFromTo(0.8, 1)));
              MYFLIPPER.BALLS--;
            } else if(pos.x < 5.1 && pos.z > -5.5) {
              flipper.matrixPhysics.applyImpulse(ball,
                new PVector(randomFloatFromTo(0.1, 0.15), 0, 0));
            }
          }
        });

        // console.info('BALL ID ', app.matrixPhysics.detectCollision)
        const strength = 0.01;
        app.matrixPhysics.detectCollision = (e) => {
          const body0Name = e.detail.body0Name;
          const body1Name = e.detail.body1Name;
          const rayDirection = e.detail.rayDirection;
          // (body1Name == "ball1" && body0Name.startsWith("bumper"))
          if(body0Name == "ball1" && body1Name.startsWith("bumper")) {
            flipper.matrixPhysics.applyImpulse(ball, new PVector(
              rayDirection[0] * 0.015, 0, rayDirection[2] * 0.015));
              MYFLIPPER.BALANCE = MYFLIPPER.BALANCE + 20;
          } else if(body1Name == 'bottomEdge2') {
            console.log('collision FORCE : ', body1Name)
            flipper.matrixPhysics.applyImpulse(ball,
              new PVector(0.3, 0, 0));
          }
        };

      }, 1000);

      const commonAchorX = 2.3;
      const commomBODYX = 0;
      const LAnchor = flipper.addMeshObj({
        texturesPaths: ['./res/textures/blankgray.webp'],
        position: {x: -commonAchorX, y: 0.3, z: -9.15},
        scale: [0.1, 0.1, 0.1],
        mesh: m.cube,
        physics: {
          enabled: true,
          mass: 0,
          geometry: "Cube",
          collisionGroup: 0,
          collisionSubGroup: 0,
          layer: 2,
          group: 2,
          mask: 1 // collide with world, NOT flipper
        },
        name: "flipperLeftAnchor"
      });

      const RAnchor = flipper.addMeshObj({
        texturesPaths: ['./res/textures/blankgray.webp'],
        position: {x: commonAchorX, y: 0.3, z: -9.15},
        scale: [0.1, 0.1, 0.1],
        mesh: m.cube,
        physics: {
          enabled: true,
          mass: 0,
          geometry: "Cube",
          // kinematic: true,  // ONLY JOLT
          // sensor: true,     // ONLY JOLT
          collisionGroup: 0,   // ONLY JOLT
          collisionSubGroup: 0,// ONLY JOLT
          layer: 2,            // ONLY JOLT
          group: 2,
          mask: 1 // collide with world, NOT flipper
        },
        name: "flipperRightAnchor"
      });

      flipper.addMeshObj({
        material: {type: 'standard', share: true},
        position: {x: -commomBODYX, y: 0.35, z: -9.3},
        scale: [1.5, 0.1, 0.2],
        texturesPaths: ['./res/textures/blankgray.webp'],
        name: 'flipperLeft',
        mesh: m.pin,
        physics: {
          enabled: true,
          mass: 0.5,
          geometry: "Cube",
          collisionGroup: 0,
          collisionSubGroup: 0,
          group: 1,
          mask: -1, // everything
          layer: 3, // LAYER_FLIPPER
        }
      });

      flipper.addMeshObj({
        material: {type: 'standard', share: true},
        position: {x: commomBODYX, y: 0.35, z: -9.3},
        scale: [1.5, 0.1, 0.2],
        texturesPaths: ['./res/textures/blankgray.webp'],
        name: 'flipperRight',
        mesh: m.pinR,
        physics: {
          enabled: true,
          mass: 0.5,
          geometry: "Cube",
          collisionGroup: 0,
          collisionSubGroup: 0,
          group: 1,
          mask: -1,
          layer: 3
        }
      });

      flipper.canvas.addEventListener("ray.hit.event", async (e) => {
        app.matrixSounds.play('click1');
        console.log('e.detail', e.detail);
        if(e.detail.hitObject.name == "pushBtn") {
          let ball = app.matrixPhysics.getBodyByName(ball1.name);
          const pos = await app.matrixPhysics.getPosition(ball);
          if(pos.x > 5 && pos.z > -6.6) flipper.matrixPhysics.applyImpulse(ball,
            new PVector(0, 0, -randomFloatFromTo(0.8, 1)));
        }
      });

      // GRAVITY TILT (PINBALL FEEL)
      flipper.matrixPhysics.setGravity(0, -9.8, 2);

      if(isMobile() == false) {
        // only render objs
        const leg1 = flipper.addMeshObj({
          material: {type: 'standard', share: true},
          position: {x: -5.5, y: -5, z: -6.1},
          scale: [0.2, 7, 0.2],
          texturesPaths: ['./res/textures/blankgray2.webp'],
          name: 'leg1',
          mesh: m.cube,
          shadowsCast: false,
          physics: {
            enabled: false,
            mass: 0,
            geometry: "Cube"
          }
        });

        const leg2 = flipper.addMeshObj({
          material: {type: 'standard', share: true},
          position: {x: 5.5, y: -5, z: -6.1},
          scale: [0.2, 7, 0.2],
          texturesPaths: ['./res/textures/blankgray2.webp'],
          name: 'leg2',
          mesh: m.cube,
          shadowsCast: false,
          physics: {
            enabled: false,
            mass: 0,
            geometry: "Cube"
          }
        });

        const leg3 = flipper.addMeshObj({
          material: {type: 'standard', share: true},
          position: {x: -5.5, y: -5, z: -36},
          scale: [0.2, 7, 0.2],
          texturesPaths: ['./res/textures/blankgray2.webp'],
          name: 'leg3',
          mesh: m.cube,
          shadowsCast: false,
          physics: {
            enabled: false,
            mass: 0,
            geometry: "Cube"
          }
        });

        const leg4 = flipper.addMeshObj({
          material: {type: 'standard', share: true},
          position: {x: 5.5, y: -5, z: -36},
          scale: [0.2, 7, 0.2],
          texturesPaths: ['./res/textures/blankgray2.webp'],
          name: 'leg4',
          mesh: m.cube,
          shadowsCast: false,
          physics: {
            enabled: false,
            mass: 0,
            geometry: "Cube"
          }
        });
      }

      setTimeout(() => {
        if(isMobile() == false) {
          app.activateBloomEffect();
          app.bloomPass.setBlurRadius(3);
        }
        app.cameras.WASD.setYaw(-0.03);
        app.cameras.WASD.setPitch(-0.49);
        app.cameras.WASD.setZ(0);
        app.cameras.WASD.setY(10);
        app.cameras.WASD._dirtyAngle = true;
      }, 900)
    }

  });
  window.app = flipper;
};