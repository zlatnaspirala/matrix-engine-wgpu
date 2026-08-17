import MatrixEngineWGPU from "../src/world.js";
import {downloadMeshes} from '../src/engine/loader-obj.js';
import {uploadGLBModel} from "../src/engine/loaders/webgpu-gltf.js";
import {OSCILLATOR, randomIntFromTo} from "../src/engine/utils.js";
import {followPath, loadNavMesh} from "../src/engine/buildin/navigation-plane/navigation.js";
import {addRaycastsAABBListener} from "../src/engine/raycast.js";

export var snakeLightsInstancedMAX = function() {
  let app = new MatrixEngineWGPU({
    fastRender: 0.9,
    canvasSize: 'fullscreen',
    dontUsePhysics: true,
    MAX_SPOTLIGHTS: 1,
    mainCameraParams: {
      type: 'WASD',
      responseCoef: 1000
    },
    clearColor: {r: 0.01, b: 0.01, g: 0.01, a: 1}
  }, async () => {
    addRaycastsAABBListener('canvas1', 'click');
    const LIGHT_HEIGHT = 35;
    const CENTER = {x: 0, z: -10};
    app.addLight();
    const light = app.lightContainer[0];
    light.setIntensity(30);
    light.setPosition(CENTER.x, LIGHT_HEIGHT, CENTER.z);
    light.setTarget(CENTER.x, 0, CENTER.z);

    loadNavMesh("./res/meshes/nav-mesh/navmesh.json").then((r) => {
      app.nav = r;
      downloadMeshes({cube: "./res/meshes/blender/cube.obj"}, (m) => {
        app.addMeshObj({
          material: {type: 'standard'},
          position: {x: CENTER.x, y: -5, z: CENTER.z},
          texturesPaths: ['./res/textures/floor1.webp'],
          name: 'ground',
          mesh: m.cube,
          scale: [1, 0.5, 1],
          physics: {enabled: false},
          shadowsCast: false,
          raycast: {enabled: true, radius: 1.5}
        });
      }, {scale: [80, 0.7, 80]});

    })

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
    app.bloomPass.setBlurRadius(1.6);
    let monster = null;

    setTimeout(() => {
      monster = app.getSceneObjectByName('monster_MutantMesh');
      monster.sharedBones = false;
      monster.updateMaxInstances(150);
      monster.updateInstances(150);
      monster.position.thrust = 0.2
      app.monster = monster;
      // monster.trailAnimation.delay = 15;
      app.cameras.WASD.setYaw(0);
      app.cameras.WASD.setPitch(-0.55);
      app.cameras.WASD.setPosition(CENTER.x, 22, CENTER.z + 26);


      app.monster.playAnimationByIndex(3);

      app.monster.position.onPositionReach = () => {
             app.monster.playAnimationByIndex(3)
      }
 

      app.canvas.addEventListener("ray.hit.event", (e) => {
        console.log('hitObject hitPoint ?', app.monster.position.z); // should be true
        const {hitObject, hitPoint} = e.detail;

        const start = [app.monster.position.x, app.monster.position.y, app.monster.position.z];
        const end = [hitPoint[0], hitPoint[1], hitPoint[2]];

        const path = app.nav.findPath(start, end);
        if(!path || path.length === 0) {console.warn('No valid path found.'); return;}
        app.monster.playAnimationByIndex(4)
        followPath(app.monster, path, app);

      })


      let currentIdx = 1;
      const totalInstances = monster.instanceTargets.length - 1;
      let radius = 32;

      let deltaRadius = new OSCILLATOR(0, 32, 8);

      // Center based on the first target's initial position
      const centerX = monster.instanceTargets[0].position[0];
      const centerZ = monster.instanceTargets[0].position[2];

      // const moveTimer = setInterval(() => {
      //   // --- PHASE 1: POSITIONING ---
      //   if(currentIdx <= totalInstances) {
      //     let angle = (currentIdx / totalInstances) * (2 * Math.PI);
      //     let newPosX = centerX + radius * Math.cos(angle);
      //     let newPosZ = centerZ + radius * Math.sin(angle);
      //     monster.instanceTargets[currentIdx].position[0] = newPosX;
      //     monster.instanceTargets[currentIdx].position[2] = newPosZ;
      //     console.log(`Positioned ${currentIdx}`);
      //     currentIdx++;
      //   } else {
      //     clearInterval(moveTimer);
      //     console.log("Circle complete! Starting scale wave...");
      //     startScaleWave();
      //   }
      // }, 500);

      const moveTimer = {
        update: () => {
          // --- PHASE 1: POSITIONING ---
          if(currentIdx <= totalInstances) {
            let angle = (currentIdx / totalInstances) * (2 * Math.PI);
            let newPosX = centerX + (radius + deltaRadius.UPDATE()) * Math.cos(angle);
            let newPosZ = centerZ + (radius + deltaRadius.UPDATE()) * Math.sin(angle);
            monster.instanceTargets[currentIdx].position[0] = newPosX;
            monster.instanceTargets[currentIdx].position[2] = newPosZ;
            console.log(`Positioned ${currentIdx}`);
            currentIdx++;
          } else {
            // clearInterval(moveTimer);
            // console.log("Circle complete! Starting scale wave...");
            startScaleWave();
          }
        }
      }

      app.autoUpdate.push(moveTimer)

      function startScaleWave() {

        let scaleIdx = 1;
        // setInterval(() => {
        //   let prevIdx = scaleIdx === 1 ? totalInstances : scaleIdx - 1;
        //   monster.instanceTargets[prevIdx].scale = [1, 1, 1];
        //   monster.instanceTargets[prevIdx].color[0] = 0.5;
        //   monster.instanceTargets[prevIdx].color[1] = 0.5;
        //   monster.instanceTargets[prevIdx].color[2] = 0.5;
        //   monster.instanceTargets[scaleIdx].scale = [2, 2, 2];
        //   monster.instanceTargets[scaleIdx].color[randomIntFromTo(0, 2)] = randomIntFromTo(2, 20);
        //   scaleIdx++;
        //   if(scaleIdx > totalInstances) scaleIdx = 1;
        // }, 750);

        let scaleCharacters = {
          update: () => {
            let prevIdx = scaleIdx === 1 ? totalInstances : scaleIdx - 1;
            monster.instanceTargets[prevIdx].scale = [1, 1, 1];
            monster.instanceTargets[prevIdx].color[0] = 0.5;
            monster.instanceTargets[prevIdx].color[1] = 0.5;
            monster.instanceTargets[prevIdx].color[2] = 0.5;
            monster.instanceTargets[scaleIdx].scale = [2, 2, 2];
            monster.instanceTargets[scaleIdx].color[randomIntFromTo(0, 2)] = randomIntFromTo(2, 20);
            scaleIdx++;
            if(scaleIdx > totalInstances) scaleIdx = 1;
          }
        }
        app.autoUpdate.push(scaleCharacters)


      }
    }, 1000);
  });

  window.app = app;
}