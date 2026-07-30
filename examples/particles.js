import MatrixEngineWGPU from "../src/world.js";
import {downloadMeshes} from '../src/engine/loader-obj.js';
import {addRaycastsAABBListener} from "../src/engine/raycast.js";
import {uploadGLBModel} from "../src/engine/loaders/webgpu-gltf.js";
import {followPath, loadNavMesh} from "../src/engine/buildin/navigation-plane/navigation.js";
import {ParticleActionEmitter} from "../src/engine/effects/particles.js";
import {getOrientation, isMobile, randomIntFromTo} from "../src/engine/utils.js";
import {KaleidoscopeEmitter} from "../src/engine/effects/kaleidoscopeEffectInstance.js";
import {MobileDOM} from "../src/engine/cameras.js";
import {WaterSimEffect} from "../src/engine/effects/waterSimEffect.js";
import {mat4, vec3} from "wgpu-matrix";

export var loadParticles = function() {

  let particles = new MatrixEngineWGPU({
    canvasSize: 'fullscreen',
    fastRender: 0.9,
    dontUsePhysics: true,
    MAX_SPOTLIGHTS: 1,
    MAX_BONES: 0,
    mainCameraParams: {type: 'WASD', responseCoef: 1000},
    clearColor: {r: 0, b: 0, g: 0, a: 1}
  }, () => {
    // Music
    app.matrixSounds.createAudio('music', 'res/audios/audionautix-black-fly.mp3', 1);
    app.matrixSounds.audios.music.loop = true;
    // Dom
    let bloomRadius = 0.1;
    let bloomIntesity = 0.1;
    let arg1 = isMobile() && getOrientation() === 'portrait' ? {left: '84', bottom: 82, color: 'red'} : {left: '5', color: 'red'};
    MobileDOM.addButton("Bloom radius +", function() {
      app.bloomPass.setBlurRadius(bloomRadius);
      bloomRadius++;
    }, () => {}, arg1);
    let arg2 = isMobile() && getOrientation() === 'portrait' ? {left: '84', bottom: 73, color: 'red'} : {left: '13', color: 'red'};
    MobileDOM.addButton("Bloom radius -", function() {
      app.bloomPass.setBlurRadius(bloomRadius);
      if((bloomRadius - 1 > 0)) bloomRadius--;
    }, () => {}, arg2);
    let arg3 = isMobile() && getOrientation() === 'portrait' ? {left: '84', bottom: 64, color: 'red'} : {left: '21', color: 'red'};
    MobileDOM.addButton("Bloom intesity +", function() {
      app.bloomPass.setIntensity(bloomIntesity);
      bloomIntesity = bloomIntesity + 0.5;
    }, () => {}, arg3);
    let arg4 = isMobile() && getOrientation() === 'portrait' ? {left: '84', bottom: 55, color: 'red'} : {left: '29', color: 'red'};
    MobileDOM.addButton("Bloom intesity -", function() {
      app.bloomPass.setIntensity(bloomIntesity);
      if((bloomIntesity - 0.5 > 0)) bloomIntesity = bloomIntesity - 0.5;
    }, () => {}, arg4);
    let arg5 = isMobile() && getOrientation() === 'portrait' ? {left: '84', bottom: 46, color: '#5a48fc'} : {left: '37', color: '#8b7eff'};
    MobileDOM.addButton("Volumetric", function() {
      app.activateVolumetricEffect();
    }, () => {}, arg5);
    let arg6 = isMobile() && getOrientation() === 'portrait' ? {left: '84', bottom: 37, color: '#6655ff'} : {left: '45', color: '#6453ff'};
    MobileDOM.addButton("HZB", function() {
      app.activateHZB();
    }, () => {}, arg6);
    let arg7 = isMobile() && getOrientation() === 'portrait' ? {left: '84', bottom: 28, color: '#6655ff'} : {left: '53', color: '#6453ff'};
    MobileDOM.addButton("Salute", function() {
      app.MONSTER.playAnimationByName('salute');
    }, () => {}, arg7);

    particles.addLight();

    downloadMeshes({cube: "./res/meshes/blender/cube.obj", land: "./res/meshes/maps-objs/map-1.obj"},
      onLoadObj, {scale: [1, 1, 1]});

    // Ray
    addRaycastsAABBListener('canvas1', 'click');

    async function onLoadObj(m) {
      var glbFile01 = await fetch("res/meshes/glb/monster.glb").then(res => res.arrayBuffer().then(buf => uploadGLBModel(buf, particles.device)));
      let MONSTER = particles.addGlbObjInctance({
        material: {type: 'power', shared: false, useTextureFromGlb: true},
        useScale: true,
        scale: [10, 10, 10],
        position: {x: 0, y: -4, z: -20},
        name: 'firstGlb',
        texturesPaths: ['./res/meshes/glb/textures/mutant_origin.webp'],
      }, null, glbFile01);

      loadNavMesh("./res/meshes/nav-mesh/navmesh.json").then((r) => {
        app.nav = r;
        app.GROUND = app.addMeshObj({
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

      let birds = particles.addMeshObj({
        material: {type: 'standard'},
        position: {x: 0, y: 0, z: 0},
        rotation: {x: 0, y: 0, z: 0},
        rotationSpeed: {x: 0, y: 0, z: 0},
        scale: [10, 10, 10],
        texturesPaths: ['./res/textures/env-maps/sky1_lod_mid.webp'],
        name: 'birds',
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
      app.birds = birds;
      app.MONSTER = MONSTER;
      app.birds.position = app.MONSTER.position;

      particles.lightContainer[0].setIntensity(10);
      particles.lightContainer[0].setRange(100);
      particles.activateBloomEffect();
      particles.lightContainer[0].setPosition(0, 90, -10);
      particles.lightContainer[0].setTarget(0, 0, -10);
      app.MONSTER.position.thrust = 0.2;

      let MAT_EFFECT_WATER = app.addMeshObj({
        material: {type: 'standard'},
        position: {x: 0, y: 0, z: 0},
        rotation: {x: 0, y: 0, z: 0},
        rotationSpeed: {x: 0, y: 0, z: 0},
        scale: [50, 1, 50],
        texturesPaths: ['./res/textures/env-maps/sky1_lod_mid.webp'],
        name: 'waterEffect',
        useBlend: true,
        mesh: m.cube,
        isBlend: true,
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
        app.MONSTER.playAnimationByName('idle');

        app.GROUND.setBlend(0.8);
        app.birds.setBlend(0.001);
        app.matrixSounds.play('music');
        app.MONSTER.position.onPositionReach = () => {
          console.log('MONSTER.position.onTargetPositionReach')
          app.MONSTER.playAnimationByName('idle');
        }
        app.MONSTER.updateMaxInstances(4);
        app.MONSTER.updateInstances(4);
        app.MONSTER.trailAnimation.delay = 70;

        app.MAT_EFFECT_WATER.setBlend(0.001)
        app.MAT_EFFECT_WATER.effects.waterEffect = new WaterSimEffect(app.device, 'rgba16float', {size: 50}, app.cameraBuffer);
        app.autoUpdate.push({update: followMe, my: app.MAT_EFFECT_WATER.effects.waterEffect})

        app.birds.effects.keeffect = new KaleidoscopeEmitter(app.device, 'rgba16float', 30, app.cameraBuffer)
        app.birds.effects.particles = new ParticleActionEmitter(particles.device, 'rgba16float', isMobile() ? 50 : 200, app.cameraBuffer);
        app.birds.effects.particles2 = new ParticleActionEmitter(particles.device, 'rgba16float', isMobile() ? 50 : 200, app.cameraBuffer);
        app.birds.effects.particles3 = new ParticleActionEmitter(particles.device, 'rgba16float', isMobile() ? 50 : 200, app.cameraBuffer);
        app.birds.effects.particles4 = new ParticleActionEmitter(particles.device, 'rgba16float', isMobile() ? 50 : 200, app.cameraBuffer);
        let cam = app.getCamera();
        cam.setYaw(-0.03); cam.setPitch(-0.49); cam.setZ(0); cam.setY(12);
        app.buildRenderBuckets();
        cam._dirtyAngle = true;
      }, 700);
    }

    particles.canvas.addEventListener("ray.hit.event", (e) => {
      const {hitObject, hitPoint} = e.detail;
      app.birds.effects.particles.setAction('birds', {separationRadius: 1.2, angularVelRange: [0, 0]});
      app.birds.effects.particles2.setAction('orbitMagic', {separationRadius: 1.2, angularVelRange: [0, 0]});
      app.birds.effects.particles3.setAction('spiral'); //
      app.birds.effects.particles4.setAction('bloodSplat', {separationRadius: 1.2});
      app.birds.effects.particles4.burst()
      app.birds.effects.keeffect.recreateVertexDataCrazzy(randomIntFromTo(6, 36));
      app.birds.effects.keeffect.setIntensity(randomIntFromTo(3, 23));
      const start = [app.MONSTER.position.x, app.MONSTER.position.y, app.MONSTER.position.z];
      const end = [hitPoint[0], hitPoint[1], hitPoint[2]];
      // app.net.send({
      //   heroName: app.localHero.name,
      //   sceneName: hero.name,
      //   followPath: {start: start, end: end},
      // })
      app.MONSTER.playAnimationByName('walk');
      const path = app.nav.findPath(start, end);
      if(!path || path.length === 0) {console.warn('No valid path found.'); return;}
      followPath(app.MONSTER, path, app);
    });
  })
  window.app = particles;
}