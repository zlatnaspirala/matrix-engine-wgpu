import MatrixEngineWGPU from "../src/world.js";
import {downloadMeshes} from '../src/engine/loader-obj.js';
import {uploadGLBModel} from "../src/engine/loaders/webgpu-gltf.js";

export var snakeLights = function() {
  let app = new MatrixEngineWGPU({
    useSingleRenderPass: true,
    canvasSize: 'fullscreen',
    dontUsePhysics: true,
    mainCameraParams: {
      type: 'WASD',
      responseCoef: 1000
    },
    clearColor: {r: 0.01, b: 0.01, g: 0.01, a: 1}
  }, async () => {

    const NUM_LIGHTS = 20;
    const SNAKE_SPEED = 0.8;
    const SNAKE_SPACING = 0.35;
    const LIGHT_HEIGHT = 10;
    const CENTER = {x: 0, z: -10};

    const LIGHT_COLORS = [
      [1.0, 0.1, 0.05], [1.0, 0.3, 0.05], [1.0, 0.55, 0.05], [1.0, 0.8, 0.05],
      [0.8, 1.0, 0.05], [0.4, 1.0, 0.05], [0.05, 1.0, 0.2], [0.05, 1.0, 0.7],
      [0.05, 0.8, 1.0], [0.05, 0.5, 1.0], [0.05, 0.2, 1.0], [0.2, 0.05, 1.0],
      [0.5, 0.05, 1.0], [0.8, 0.05, 1.0], [1.0, 0.05, 0.8], [1.0, 0.05, 0.5],
      [1.0, 0.05, 0.3], [0.9, 0.1, 0.1], [0.7, 0.1, 0.1], [0.5, 0.05, 0.05],
    ];

    // ─── PATH DEFINITIONS ───────────────────────────────────────────────────
    // Each path is a function(t) -> {x, z} in local space, then shifted by CENTER

    const PATHS = {

      snake: (t) => ({
        x: CENTER.x + Math.sin(t) * 20,      // was 12
        z: CENTER.z + Math.sin(t * 2) * 12,  // was 7
      }),

      circle: (t) => ({
        x: CENTER.x + Math.cos(t) * 18,      // was 10
        z: CENTER.z + Math.sin(t) * 18,      // was 10
      }),

      star: (t) => {
        const r = 14 + 7 * Math.cos(t * 5);  // was 8 + 4
        return {
          x: CENTER.x + r * Math.cos(t),
          z: CENTER.z + r * Math.sin(t),
        };
      },

      infinity: (t) => ({
        x: CENTER.x + 18 * Math.cos(t),      // was 11
        z: CENTER.z + 10 * Math.sin(t * 2),  // was 6
      }),

      heart: (t) => ({
        x: CENTER.x + 13 * Math.pow(Math.sin(t), 3),         // was 8
        z: CENTER.z - 10 * (Math.cos(t) - 0.5 * Math.cos(2 * t) - 0.25 * Math.cos(3 * t) - 0.1 * Math.cos(4 * t)), // was 6
      }),

      rose: (t) => {
        const r = 16 * Math.cos(t * 3);      // was 10
        return {
          x: CENTER.x + r * Math.cos(t),
          z: CENTER.z + r * Math.sin(t),
        };
      },

      spiral: (t) => {
        const r = 3 + (t % (Math.PI * 2)) * 1.2;
        return {
          x: CENTER.x + r * Math.cos(t * 3),
          z: CENTER.z + r * Math.sin(t * 3),
        };
      },


      heart: (t) => ({
        x: CENTER.x + 8 * Math.pow(Math.sin(t), 3),
        z: CENTER.z - 6 * (Math.cos(t) - 0.5 * Math.cos(2 * t) - 0.25 * Math.cos(3 * t) - 0.1 * Math.cos(4 * t)),
      }),

      // Letters — sampled as closed loops
      letterS: (t) => {
        // S shape via two arcs joined
        const phase = ((t % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
        if(phase < Math.PI) {
          return {
            x: CENTER.x + 4 * Math.cos(phase + Math.PI) + 2,
            z: CENTER.z + 4 * Math.sin(phase) - 3,
          };
        } else {
          return {
            x: CENTER.x + 4 * Math.cos(phase) - 2,
            z: CENTER.z + 4 * Math.sin(phase) + 3,
          };
        }
      },

      letterO: (t) => ({
        x: CENTER.x + 8 * Math.cos(t),
        z: CENTER.z + 11 * Math.sin(t),
      }),

      wave: (t) => ({
        x: CENTER.x + t * 3,
        z: CENTER.z + 7 * Math.sin(t * 2.5),
      }),


    };

    // ─── PATH SWITCHER ───────────────────────────────────────────────────────

    const pathNames = Object.keys(PATHS);
    let currentPathKey = 'snake';
    let nextPathKey = null;
    let morphT = 1.0;        // 1.0 = fully on currentPath
    const MORPH_SPEED = 1.2;        // how fast we blend (seconds)

    // Call this to switch path with smooth morph
    app.switchPath = (name) => {
      if(!PATHS[name]) {console.warn('Unknown path:', name); return;}
      if(name === currentPathKey) return;
      nextPathKey = name;
      morphT = 0.0;
    };

    // Auto-cycle every 6 seconds
    let autoCycleIndex = 0;
    setInterval(() => {
      autoCycleIndex = (autoCycleIndex + 1) % pathNames.length;
      app.switchPath(pathNames[autoCycleIndex]);
    }, 6000);

    // ─── LIGHTS ─────────────────────────────────────────────────────────────

    for(let i = 0;i < NUM_LIGHTS;i++) app.addLight();

    for(let i = 0;i < NUM_LIGHTS;i++) {
      const light = app.lightContainer[i];
      const phaseOffset = i * SNAKE_SPACING;
      const fade = 1.0 - (i / NUM_LIGHTS) * 0.4;
      // const fade = 1.0 - (i / NUM_LIGHTS) * 0.6;

      light.intensity = 15 * fade;
      light.color = LIGHT_COLORS[i];

      light.innerCutoff = 0.97 - (i / NUM_LIGHTS) * 0.05; // 0.97 → 0.92
      light.outerCutoff = 0.92 - (i / NUM_LIGHTS) * 0.05; // 0.92 → 0.87
      light.intensity = 18 * fade;
      light._phase = phaseOffset;

      const initialPos = PATHS[currentPathKey](0);
      light.position = [initialPos.x, LIGHT_HEIGHT, initialPos.z];
      light.target = [initialPos.x, 0, initialPos.z];

      light.updater.push((light) => {
        const t = app.now * SNAKE_SPEED - light._phase;
        const cur = PATHS[currentPathKey](t);

        let x, z;
        if(nextPathKey && morphT < 1.0) {
          const nxt = PATHS[nextPathKey](t);
          // Smooth ease in-out
          const ease = morphT * morphT * (3 - 2 * morphT);
          x = cur.x + (nxt.x - cur.x) * ease;
          z = cur.z + (nxt.z - cur.z) * ease;
        } else {
          if(nextPathKey && morphT >= 1.0) {
            currentPathKey = nextPathKey;
            nextPathKey = null;
          }
          x = cur.x;
          z = cur.z;
        }

        light.position = [x, LIGHT_HEIGHT, z];
        light.target = [x, 0, z];
      });
    }

    // Advance morph timer in a single updater on the first light
    app.lightContainer[0].updater.push(() => {
      if(nextPathKey && morphT < 1.0) {
        morphT = Math.min(1.0, morphT + (1 / 60) / MORPH_SPEED);
      }
    });

    // ─── SCENE ──────────────────────────────────────────────────────────────

    downloadMeshes({cube: "./res/meshes/blender/cube.obj"}, (m) => {
      app.addMeshObj({
        material: {type: 'standard'},
        position: {x: CENTER.x, y: -5, z: CENTER.z},
        texturesPaths: ['./res/textures/floor1.webp'],
        name: 'floor',
        mesh: m.cube,
        scale: [50, 0.5, 50],
        physics: {enabled: false}
      });
    }, {scale: [50, 0.5, 50]});

    const glbFile = await fetch("res/meshes/glb/monster.glb")
      .then(r => r.arrayBuffer())
      .then(buf => uploadGLBModel(buf, app.device));

    app.addGlbObj({
      material: {type: 'standard', useTextureFromGlb: true},
      useScale: true,
      scale: [5, 5, 5],
      position: {x: CENTER.x, y: -4, z: CENTER.z},
      name: 'monster',
      texturesPaths: ['./res/meshes/glb/textures/mutant_origin.webp'],
    }, null, glbFile);

    app.activateBloomEffect();
    
    setTimeout(() => {
      app.cameras.WASD.yaw = 0;
      app.cameras.WASD.pitch = -0.55;
      app.cameras.WASD.position = [CENTER.x, 22, CENTER.z + 26];
    }, 800);

  });

  window.app = app;
}