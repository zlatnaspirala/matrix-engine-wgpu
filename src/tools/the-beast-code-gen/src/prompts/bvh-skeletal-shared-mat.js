export const BVH_SKELETAL_ANIMS = `

import {
  MatrixEngineWGPU, downloadMeshes, addRaycastsAABBListener,
  GenGeoTexture2, BVHSkeletal, mocapCsCmuEdu, randomIntFromTo
} from "matrix-engine-wgpu";

let BVHRawExample = new MatrixEngineWGPU({
  canvasSize: 'fullscreen',
  fastRender: 0.9,
  dontUsePhysics: true,
  MAX_SPOTLIGHTS: 1,
  MAX_BONES: 0,
  mainCameraParams: {
    type: 'firstPersonCamera',
    responseCoef: 1000
  },
  clearColor: {r: 0, b: 0.122, g: 0.122, a: 1}
}, () => {

  BVHRawExample.addLight();
  downloadMeshes({ball: "./res/meshes/blender/sphere.obj", cube: "./res/meshes/blender/cube.obj", }, onLoadObj, {scale: [1, 1, 1]})
  downloadMeshes({cube: "./res/meshes/blender/cube.obj"}, onGround, {scale: [30, 0.5, 30]})
  addRaycastsAABBListener('canvas1', 'click');

  function onGround(m) {
    BVHRawExample.addMeshObj({
      material: {type: 'mirror', share: true},
      position: {x: 0, y: -5, z: -10},
      rotation: {x: 0, y: 0, z: 0},
      rotationSpeed: {x: 0, y: 0, z: 0},
      texturesPaths: ['./res/textures/floor1.webp', './res/textures/env-maps/sky1_lod_mid.webp'],
      name: 'floor',
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
      mesh: m.cube,
      physics: {enabled: false}
    })
  }

  async function onLoadObj(m) {

    let MYCUBE = BVHRawExample.addMeshObj({
      material: {type: 'mirror', shared: true},
      position: {x: 0, y: 4, z: -10},
      rotation: {x: 0, y: 0, z: 0},
      rotationSpeed: {x: 0, y: 1, z: 0},
      scale: [5, 7, 3],
      texturesPaths: ['./res/textures/floor1.webp', './res/textures/env-maps/sky1_lod_mid.webp'],
      name: 'cube',
      mesh: m.cube,
      envMapParams: {
        baseColorMix: 0.1,
        mirrorTint: [0.9, 0.95, 1.0],
        reflectivity: 0.75,
        illuminateColor: [0.3, 0.7, 1.0],
        illuminateStrength: 1.5,
        illuminatePulse: 0.1,
        fresnelPower: 5,
        envLodBias: 1.5,
        usePlanarReflection: false,       // Must be false 
      },
      raycast: {enabled: true, radius: 1},
      physics: {
        enabled: false,
        mass: 0,
        geometry: "Cube"
      },
      // pointerEffect: {
      //   enabled: true,
      //   flameEmitter: true,
      //   // bloodBurst: true
      // }
    });

    BVHRawExample.ALL_SKELETALS = [];

   BVHSkeletal('./res/bvh/mocap.cs.cmu.edu/Female1_A01_Stand.bvh',
    "list", m,
    ['./res/textures/floor1.webp', './res/textures/env-maps/sky1_lod_mid.webp'], 0.2,
    {x: -20 , y: -26, z: -30}, undefined, true).then((r) => {
      // console.log('My bvh anim object', r)
      BVHRawExample.ALL_SKELETALS.push(r);
    })

    BVHRawExample.activateBloomEffect();
    BVHRawExample.lightContainer[0].setPosition(0, 50, -15);
    BVHRawExample.lightContainer[0].setTarget(0, 0, -15);
    BVHRawExample.lightContainer[0].setIntensity(200);
    app.lightContainer[0].setRange(100)
    app.lightContainer[0].outerCutoff = 2;

    setTimeout(() => {

      MYCUBE.effects.circle = new GenGeoTexture2(BVHRawExample.device, 'rgba16float', 'circle2', './res/textures/star1.png', 1, app.cameraBuffer);

      if(MYCUBE.effects.flameEmitter) {
        MYCUBE.effects.flameEmitter.rotSpeed = 1;
        // Nice fire tourch effect.
        MYCUBE.effects.flameEmitter.recreateVertexDataFromData([
          -2.582509022040566, 0.21125441598805741, 0.4249951687253338,
          0.4724163587305734, 2.381811753816671, 3.074841196886901, -2.3797025623904164, -3.4608908819087145]);
      }

      MYCUBE.setAmbient(2, 3, 0.5);
      let cam = app.getCamera();
      cam.setYaw(-0.03);
      cam.setPitch(-0.49);
      cam.setZ(0);
      cam.setY(10);
      cam.setY(15);
      app.activateVolumetricEffect()
      app.buildRenderBuckets();
      cam._dirtyAngle = true;
    }, 1000);
  }

  BVHRawExample.canvas.addEventListener("ray.hit.event", (e) => {
    console.log('ray.hit.event detected :', e.detail.hitObject.name);
    // if(e.detail.hitObject.name.startsWith('cube')) {
    let t = BVHRawExample.ALL_SKELETALS.filter((O) => e.detail.hitObject.name.indexOf(O.myName) !== -1);
    //  console.log('t ', t)
    if(t.length > 0) {
      // on mirror mat not too mush effect
      app.lightContainer[0].setColorR(randomIntFromTo(1, 30))
      app.lightContainer[0].setColorG(randomIntFromTo(1, 30))
      app.lightContainer[0].setColorB(randomIntFromTo(1, 30))
      t[0].THICKNESS = t[0].THICKNESS + 0.2;
      t[0].setupScale();
    }
  });
})
window.app = BVHRawExample;
`;