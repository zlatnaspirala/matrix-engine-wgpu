import MatrixEngineWGPU from "../src/world.js";
import {downloadMeshes} from '../src/engine/loader-obj.js';
import {uploadGLBModel} from "../src/engine/loaders/webgpu-gltf.js";
import {CameraPath, isMobile, ORBIT} from '../src/engine/utils.js';

export var myLights = function() {
  let myLights = new MatrixEngineWGPU({
    fastRender: 0.9,
    canvasSize: 'fullscreen',
    dontUsePhysics: true,
    mainCameraParams: {
      type: 'cinematicCamera',
      responseCoef: 1000
    },
    clearColor: {r: 0, b: 0.122, g: 0.122, a: 1}
  }, async () => {

    const NUM_LIGHTS = 4;
    const ORBIT_RADIUS = 8;
    const ORBIT_SPEED = 0.6;
    const TARGET = {x: 0, y: 0, z: -10};

    // Light colors cycling around the hue wheel
    const LIGHT_COLORS = [
      [1.0, 0.2, 0.2],  // red
      [1.0, 0.6, 0.1],  // orange
      [0.2, 0.2, 1.0],  // blue
      [1.0, 1.0, 0.1],  // yellow
      [0.2, 1.0, 0.2],  // green
      [0.1, 1.0, 0.6],  // teal
      [0.1, 0.6, 1.0],  // sky
      [0.6, 0.1, 1.0],  // purple
      [1.0, 0.1, 0.8],  // pink
      [1.0, 0.1, 0.4],  // rose
    ];
    // Ground
    downloadMeshes({plane: "./res/meshes/blender/plane.obj"}, (m) => {
      const floor = myLights.addMeshObj({
        material: {type: 'standard'},
        shadowsCast: false,
        position: {x: 0, y: -5, z: -10},
        texturesPaths: ['./res/textures/floor1.webp'],
        name: 'floor',
        mesh: m.plane,
        scale: [6, 0.5, 6],
        physics: {enabled: false}
      });

      setTimeout(() => {
        const checker2 = floor.createCheckerboardTexture(256, 128, [0, 50, 50, 255], [20, 200, 200, 255]);
        let samplerTest = myLights.device.createSampler({
          magFilter: 'nearest',
          minFilter: 'nearest',
          addressModeU: 'repeat',
          addressModeV: 'repeat',
        });
        floor.changeTexture(checker2, samplerTest);
        floor.setUVScale(12, 12);
      }, 200)

    }, {scale: [30, 0.5, 30]});
    // GLB monster
    const glbFile = await fetch("res/meshes/glb/monster.glb")
      .then(res => res.arrayBuffer())
      .then(buf => uploadGLBModel(buf, myLights.device));

    myLights.addGlbObjInctance({
      material: {type: 'standard', useTextureFromGlb: true},
      useScale: true,
      scale: [6, 6, 6],
      position: {x: TARGET.x, y: TARGET.y - 4, z: TARGET.z},
      name: 'monster',
      texturesPaths: ['./res/meshes/glb/textures/mutant_origin.webp'],
    }, null, glbFile);

    for(let i = 0;i < NUM_LIGHTS;i++) {
      myLights.addLight();
    }

    // Set up lights evenly spaced around the circle
    for(let i = 0;i < NUM_LIGHTS;i++) {
      const light = myLights.lightContainer[i];
      const angleOffset = (i / NUM_LIGHTS) * Math.PI * 2;
      const color = LIGHT_COLORS[i];
      light.setIntensity(8.5);
      light.color = color;
      // Orbit height varies slightly per light for more visual interest
      const heightOffset = Math.sin(angleOffset) * 2;
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
        const height = 4 + Math.sin(light.orbitAngle + angleOffset) * 2;
        const x = TARGET.x + Math.cos(light.orbitAngle) * ORBIT_RADIUS;
        const z = TARGET.z + Math.sin(light.orbitAngle) * ORBIT_RADIUS;
        light.setPosition(x, height, z);
        light.setTarget(TARGET.x, TARGET.y, TARGET.z);
      });
    }

    if(isMobile() == false) myLights.activateBloomEffect();

    setTimeout(() => {
      let monster = app.getSceneObjectByName('monster_MutantMesh');
      monster.updateMaxInstances(4);
      monster.updateInstances(4);
      monster.trailAnimation.delay = 50;
      monster.playAnimationByIndex(3);

      myLights.getCamera().setYaw(-0.03);
      myLights.getCamera().setPitch(-0.35);
      myLights.getCamera().setPosition(0, 8, 5);

      const frames = [];
      for(let i = 0;i <= 16;i++) {
        const a = (i / 16) * Math.PI * 2;
        frames.push({
          position: [Math.sin(a) * 15, 5, -10 + Math.cos(a) * 15],
          target: [0, 0, -10],
        });
      }

      const cam = myLights.getCamera();
      const orbit = new CameraPath(frames, {loop: true, parameterization: 'arc'});
      cam.setPath(orbit).play({speed: 0.1, loop: true});

    }, 800);
  });
  window.app = myLights;
}