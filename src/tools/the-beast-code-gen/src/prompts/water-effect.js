export const waterEffect = `

import {MatrixEngineWGPU,downloadMeshes,
addRaycastsAABBListener,WaterSimEffect,
uploadGLBModel,followPath, loadNavMesh} from "matrix-engine-wgpu";
import {mat4, vec3} from "wgpu-matrix";

let waterEffect = new MatrixEngineWGPU({
  canvasSize: 'fullscreen',
  fastRender: 0.9,
  dontUsePhysics: true,
  MAX_SPOTLIGHTS: 1,
  MAX_BONES: 0,
  mainCameraParams: {
    type: 'WASD', // 'firstPersonCamera',
    responseCoef: 1000
  },
  clearColor: {r: 0, b: 0, g: 0, a: 1}
}, () => {

  waterEffect.addLight();
  downloadMeshes({
    ball: "./res/meshes/blender/sphere.obj",
    cube: "./res/meshes/blender/cube.obj",
    land: "./res/meshes/maps-objs/map-1.obj",
  },
    onLoadObj, {scale: [1, 1, 1]})

  addRaycastsAABBListener('canvas1', 'click');

  async function onLoadObj(m) {
    var glbFile01 = await fetch("res/meshes/glb/monster.glb").then(res => res.arrayBuffer().then(buf => uploadGLBModel(buf, waterEffect.device)));
    let MONSTER = waterEffect.addGlbObj({
      material: {type: 'power', shared: false, useTextureFromGlb: true},
      useScale: true,
      scale: [10, 10, 10],
      position: {x: 0, y: -4, z: -20},
      name: 'firstGlb',
      texturesPaths: ['./res/meshes/glb/textures/mutant_origin.webp'],
    }, null, glbFile01)[0];

    MONSTER.playAnimationByName('walk');

    loadNavMesh("./res/meshes/nav-mesh/navmesh.json").then((r) => {
      app.nav = r;
      app.addMeshObj({
        position: {x: 0, y: -4, z: -10},
        rotation: {x: 0, y: 0, z: 0},
        rotationSpeed: {x: 0, y: 0, z: 0},
        scale: [100, 1, 100],
        texturesPaths: ['./res/textures/white-metal2.webp'],
        name: 'ground',
        mesh: m.cube,
        physics: {
          enabled: false,
          mass: 0,
          geometry: "Cube"
        },
        raycast: {enabled: true, radius: 1.5}
      });

    })

    let MAT_EFFECT_WATER = waterEffect.addMeshObj({
      material: {type: 'standard'},
      position: {x: 10, y: 0, z: 0},
      rotation: {x: 0, y: 0, z: 0},
      rotationSpeed: {x: 0, y: 0, z: 0},
      scale: [50, 1, 50],
      texturesPaths: ['./res/textures/env-maps/sky1_lod_mid.webp'],
      name: 'waterEffect',
      useBlend: true,
      mesh: m.cube,
      raycast: {enabled: true, radius: 1},
      physics: {
        enabled: false,
        mass: 0,
        geometry: "Cube"
      },
      pointerEffect: {
        enabled: true,
      }
    });

    app.MAT_EFFECT_WATER = MAT_EFFECT_WATER;
    app.MONSTER = MONSTER;

    waterEffect.lightContainer[0].setIntensity(2);
    waterEffect.activateBloomEffect();
    // waterEffect.lightContainer[0].behavior.setOsc0(-2, 2, 0.01)
    // waterEffect.lightContainer[0].behavior.value_ = -1;
    // waterEffect.lightContainer[0].updater.push((light) => {
    //   light.setTargetX(light.behavior.setPath0());
    //   light.setPosX(light.behavior.setPath0());
    // })
    waterEffect.lightContainer[0].setPosition(0, 25, -10);
    waterEffect.lightContainer[0].setTarget(0, 0, -10);
    app.MONSTER.position.thrust = 0.1
    function followMe() {
      if(MONSTER.position.inMove === false) return;
      const newWorld = [MONSTER.position.x, MONSTER.position.y, MONSTER.position.z];
      const newLocal = vec3.transformMat4(newWorld, mat4.invert(this.my._finalMatrix));
      if(this.my._oldLocal) {
        this.my.stampSphere(
          [this.my._oldLocal[0], 0, this.my._oldLocal[2]],
          [newLocal[0], 0, newLocal[2]],
          0.5
        );
      }
      this.my._oldLocal = newLocal;
    }
    setTimeout(() => {
      MAT_EFFECT_WATER.setBlend(0.001);
      MAT_EFFECT_WATER.effects.waterEffect = new WaterSimEffect(waterEffect.device, 'rgba16float', {
        size: 50
      }, app.cameraBuffer);
      waterEffect.autoUpdate.push({update: followMe, my: MAT_EFFECT_WATER.effects.waterEffect})
      let cam = app.getCamera();
      cam.setYaw(-0.03);
      cam.setPitch(-0.49);
      cam.setZ(0);
      cam.setY(10);
      app.buildRenderBuckets();
      cam._dirtyAngle = true;
    }, 700);
  }

  waterEffect.canvas.addEventListener("ray.hit.event", (e) => {
    const {hitObject, hitPoint} = e.detail;
    const water = app.MAT_EFFECT_WATER.effects.waterEffect;
    const invModel = mat4.invert(hitObject._modelMatrix); 
    const local = vec3.transformMat4(hitPoint, invModel);
    water.addDrop(local[0], local[2], 0.03, 0.5);
    const start = [app.MONSTER.position.x, app.MONSTER.position.y, app.MONSTER.position.z];
    const end = [hitPoint[0], hitPoint[1], hitPoint[2]];
    const path = app.nav.findPath(start, end);
    if(!path || path.length === 0) {console.warn('No valid path found.'); return;}
    followPath(app.MONSTER, path, app);
  });

})
window.app = waterEffect;`;