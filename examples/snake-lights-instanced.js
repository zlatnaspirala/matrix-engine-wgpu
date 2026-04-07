import MatrixEngineWGPU from "../src/world.js";
import {downloadMeshes} from '../src/engine/loader-obj.js';
import {uploadGLBModel} from "../src/engine/loaders/webgpu-gltf.js";

export var snakeLightsInstanced = function() {
  let app = new MatrixEngineWGPU({
    canvasSize: 'fullscreen',
    dontUsePhysics: true,
    mainCameraParams: {
      type: 'WASD',
      responseCoef: 1000
    },
    clearColor: {r: 0.01, b: 0.01, g: 0.01, a: 1}
  }, async () => {

    const NUM_LIGHTS = 2;
    const SNAKE_SPACING = 0.55;
    const LIGHT_HEIGHT = 15;
    const CENTER = {x: 0, z: -10};

    const LIGHT_COLORS = [
      [1.0, 0.1, 0.05], [1.0, 0.3, 0.05], [1.0, 0.55, 0.05], [1.0, 0.8, 0.05],
      [0.8, 1.0, 0.05], [0.4, 1.0, 0.05], [0.05, 1.0, 0.2], [0.05, 1.0, 0.7],
      [0.05, 0.8, 1.0], [0.05, 0.5, 1.0], [0.05, 0.2, 1.0], [0.2, 0.05, 1.0],
      [0.5, 0.05, 1.0], [0.8, 0.05, 1.0], [1.0, 0.05, 0.8], [1.0, 0.05, 0.5],
      [1.0, 0.05, 0.3], [0.9, 0.1, 0.1], [0.7, 0.1, 0.1], [0.5, 0.05, 0.05],
    ];

    // ─── LIGHTS ─────────────────────────────────────────────────────────────
    for(let i = 0;i < NUM_LIGHTS;i++) app.addLight();
    for(let i = 0;i < NUM_LIGHTS;i++) {
      const light = app.lightContainer[i];
      const phaseOffset = i * SNAKE_SPACING;
      const fade = 1.0 - (i / NUM_LIGHTS) * 0.4;
      light.color = LIGHT_COLORS[i];
      light.setIntensity(18 * fade);
      light._phase = phaseOffset;
      light.setPosition(CENTER.x, LIGHT_HEIGHT, CENTER.z);
      light.setTarget(CENTER.x, 0, CENTER.z);
    }

    // ─── SCENE ──────────────────────────────────────────────────────────────

    downloadMeshes({cube: "./res/meshes/blender/cube.obj"}, (m) => {
      app.addMeshObj({
        material: {type: 'standard'},
        position: {x: CENTER.x, y: -5, z: CENTER.z},
        texturesPaths: ['./res/textures/floor1.webp'],
        name: 'floor',
        mesh: m.cube,
        scale: [10, 0.5, 10],
        physics: {enabled: false},
        shadowsCast: false
      });
    }, {scale: [1, 0.5, 1]});

    const glbFile = await fetch("res/meshes/glb/monster.glb")
      .then(r => r.arrayBuffer())
      .then(buf => uploadGLBModel(buf, app.device));

    app.addGlbObjInctance({
      material: {type: 'standard', useTextureFromGlb: true},
      useScale: true,
      scale: [5, 5, 5],
      position: {x: CENTER.x, y: -4, z: CENTER.z},
      name: 'monster',
      texturesPaths: ['./res/meshes/glb/textures/mutant_origin.webp'],
    }, null, glbFile);

    app.activateBloomEffect();

    setTimeout(() => {
      let monster = app.getSceneObjectByName('monster_MutantMesh');
      // monster.updateMaxInstances(7);
      // monster.updateInstances(7);
      // monster.trailAnimation.delay = 15;
      app.cameras.WASD.setYaw(0);
      app.cameras.WASD.setPitch(-0.55);
      app.cameras.WASD.setPosition(CENTER.x, 22, CENTER.z + 26);
    }, 1200);

  });

  window.app = app;
}