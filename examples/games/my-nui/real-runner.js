import MatrixEngineWGPU from "../../../src/world.js";
import {downloadMeshes} from '../../../src/engine/loader-obj.js';
import {addRaycastsAABBListener} from "../../../src/engine/raycast.js";
import {byId, isMobile, randomIntFromTo} from "../../../src/engine/utils.js";
import {indicatorsBlocks, CanvasEngine, interActionController, NuiCursor, NuiMenu, NuiSlider, NuiButton} from "nui-commander";
import {createNuiContainer} from "../../../src/engine/buildin/adapter-nui-commander.js";
import {uploadGLBModel} from "../../../src/engine/loaders/webgpu-gltf.js";
import {CollisionSystem} from "../../../src/engine/collision-sub-system.js";
import {MobileDOM} from "../../../src/engine/cameras.js";

export var loadRunner = function() {

  createNuiContainer(true, false, true);
  let playerID;

  let menuBeast = new MatrixEngineWGPU({
    canvasSize: 'fullscreen',
    fastRender: 0.9,
    dontUsePhysics: true,
    // useCannon: true,
    MAX_SPOTLIGHTS: 1,
    MAX_BONES: 0,
    mainCameraParams: {
      type: 'WASD',
      noEvents: true,
      responseCoef: 1000
    },
    clearColor: {r: 0, b: 0.122, g: 0.122, a: 1}
  }, () => {

    byId('nui-commander-container').style.left = '10%';
    byId('nui-commander-container').style.top = '40%'

    var nuiCommander = {};
    // NUI PART START
    nuiCommander.drawer = new CanvasEngine(interActionController);
    nuiCommander.drawer.draw();
    nuiCommander.indicatorsBlocks = indicatorsBlocks;
    // nuiCommander.drawer.elements.push(nuiCommander.indicatorsBlocks);
    // nuiCommander.indicatorsBlocks.text[7] = 'zlatnaspirala';

    const cursor = new NuiCursor({color: "255, 80, 80"});
    nuiCommander.drawer.elements.push(cursor);

    const slider = new NuiSlider("Bloom Intesity", {
      row: 2, value: 1, onChange: v => {
        app.bloomPass.setIntensity(v)
      }
    });

    const sliderBloomRad = new NuiSlider("Bloom Blur", {
      row: 4, value: 1, onChange: v => {
        app.bloomPass.setBlurRadius(v)
      }
    });

    const hideSliderBloom = new NuiButton('hide', () => {
      nuiCommander.drawer.removeElement(slider);
      nuiCommander.drawer.removeElement(sliderBloomRad);
      nuiCommander.drawer.removeElement(hideSliderBloom);
      // bring the menu back
      nuiCommander.drawer.elements.push(menu);
    }, {col: 3, row: 0, cols: 2, rows: 1, sensitivity: 'low', bgColor: '#121234', textColor: "white"}
    )

    const menu = new NuiMenu([
      {label: "Light red", action: () => {app.lightContainer[0].setColor([100, 1, 0])}},
      {label: "Light green", action: () => {app.lightContainer[0].setColor([0, 100, 1])}},
      {
        label: "Volumetric", action: () => {
          app.activateVolumetricEffect({density: 0.5, steps: 30, scatterStrength: 2, heightFalloff: 0.2, lightColor: [0, 1.8, 10]})
        }
      },
      {
        label: "Bloom settings", action: () => {
          nuiCommander.drawer.removeElement(menu);
          nuiCommander.drawer.elements.push(slider);
          nuiCommander.drawer.elements.push(sliderBloomRad);
          nuiCommander.drawer.elements.push(hideSliderBloom);
        }
      },
    ], {
      col: 0,
      cols: 2,
      startRow: 0,
      dwellMs: 200,
      color: "255, 160, 255",
      accentColor: "255, 80, 120",
      onSelect: (item, i) => console.log("selected:", item.label)
    });

    nuiCommander.drawer.elements.push(menu);
    app.nui = nuiCommander;
    console.info("nui-commander controls attached.");
    // NUI PART END

    // menuBeast.matrixPhysics.speedUpSimulation(4);

    const cam = app.getCamera();
    // collision system for non-physics interactions
    const collisionSystem = new CollisionSystem();
    app.collisionSystem = collisionSystem;

    menuBeast.addLight();
    downloadMeshes({ball: "./res/meshes/blender/sphere.obj", cube: "./res/meshes/blender/cube.obj"}, onLoadObj, {scale: [1, 1, 1]})
    downloadMeshes({cube: "./res/meshes/blender/cube.obj"}, onGround, {scale: [30, 0.5, 30]})
    addRaycastsAABBListener('canvas1', 'click');

    async function onGround(m) {

      let arg1 = isMobile() && getOrientation() === 'portrait' ? {left: '10', bottom: '90', borderRadius: '2%'} : {left: '45', bottom: '90', borderRadius: '2%'};
      MobileDOM.addButton("Beast runner",
        function() {},
        () => {}, arg1);

      let arg2 = isMobile() && getOrientation() === 'portrait' ? {left: '10', bottom: '90'} : {left: '45', bottom: '90'};
      app.ENERGYBAR = MobileDOM.addProgressBar(arg2);


      let ground = menuBeast.addMeshObj({
        material: {type: 'standard', share: true},
        position: {x: 0, y: 0, z: -20},
        rotation: {x: 0, y: 0, z: 0},
        rotationSpeed: {x: 0, y: 0, z: 0},
        texturesPaths: ['./res/textures/white-metal.png'],
        name: 'floor',
        mesh: m.cube,
        physics: {
          enabled: false,
          mass: 0,
          geometry: "Cube"
        }
      })

      const glbFile = await fetch("res/meshes/glb/monster.glb")
        .then(res => res.arrayBuffer())
        .then(buf => uploadGLBModel(buf, menuBeast.device));

      let beast = menuBeast.addGlbObjInctance({
        material: {type: 'standard', useTextureFromGlb: true},
        useScale: true,
        scale: [4, 4.2, 4],
        position: {x: 0, y: -0.5, z: -25},
        name: 'player',
        // physics: {
        //   enabled: false,
        //   geometry: "Cube",
        //   mass: 1,
        //   radius: [1, 1.5, 1],
        //   scale: [1.5, 1.5, 1.5],
        //   height: 1.0,
        //   group: 2,
        //   mask: -1,
        // },
        texturesPaths: ['./res/meshes/glb/textures/mutant_origin.webp'],
      }, null, glbFile);

      app.beast = beast;
      app.beast.energy = 100;
      app.beast.setAmbient(1, 2, 1);
      collisionSystem.register('player', app.beast.position, 5, 'player');
      app.beast.playAnimationByName('walk');
    }

    function createPillar(menuBeast, m, x, y, z, name) {
      const base = menuBeast.addMeshObj({
        material: {type: 'dark', share: true},
        position: {x: x, y: y, z: z},
        rotation: {x: 0, y: 0, z: 0},
        rotationSpeed: {x: 0, y: 0, z: 0},
        scale: [1, 10, 1],
        texturesPaths: ['./res/textures/white-metal2.webp'],
        name: 'cube' + name,
        mesh: m.cube,
        raycast: {enabled: true, radius: 1},
        physics: {enabled: false, mass: 1, geometry: "Cube"}
      });

      const top = menuBeast.addMeshObj({
        material: {type: 'dark', share: true},
        position: {x: x, y: y + 6, z: z},
        rotation: {x: 0, y: 0, z: 0},
        rotationSpeed: {x: 0, y: 0, z: 0},
        scale: [1.8, 3, 1.8],
        texturesPaths: ['./res/textures/matrix1.webp'],
        name: 'cube' + name,
        mesh: m.cube,
        raycast: {enabled: true, radius: 1},
        physics: {enabled: false, mass: 1, geometry: "Cube"}
      });

      return {base, top};
    }

    async function onLoadObj(m) {

      function ambientFromColor(color) {return {r: color.r, g: color.g, b: color.b};}

      function randomObstacleColor() {
        const chooseType = randomIntFromTo(1, 3);
        let r, b, g;
        if(chooseType === 1) {
          r = 80;
          b = 0.5;
          g = 0.5;
        } else if(chooseType === 2) {
          r = 0.5;
          b = 80;
          g = 0.5;
        } if(chooseType === 3) {
          r = 0.5;
          b = 0.5;
          g = 80;
        }
        return {r, g, b};
      }

      function damageFromColor(color, baseDamage = 15) {
        if(color.r > color.b && color.r > color.g) {
          return baseDamage * 1.5;   // RED: more damage
        }
        if(color.g > color.r && color.g > color.b) {
          return -baseDamage * 0.8;  // GREEN: negative damage = heal
        }
        return baseDamage * 0.5;     // BLUE: less damage
      }

      function slowFromColor(color) {
        return color.g;
      }

      let hitEvent = new CustomEvent('player-hit', {detail: {obstacleId: 0}});
      // removed automatic wall generator to avoid blocking runners
      // app.physicsBodiesGeneratorWall("standard",
      //   {x: -4.5, y: 1, z: -10}, {x: 0, y: 0, z: 0},
      //   ["./res/textures/rust.jpg",],
      //   'my_set_walls', "5x3", true, [1, 1, 1], 2.05, 1000, "ByX");
      const pillar1 = createPillar(menuBeast, m, -20, 6, -30, "pil1");
      const pillar2 = createPillar(menuBeast, m, 20, 6, -30, "pil2");
      const pillar3 = createPillar(menuBeast, m, -20, 6, 20, "pil3");
      const pillar4 = createPillar(menuBeast, m, 20, 6, 20, "pil4");

      menuBeast.lightContainer[0].setIntensity(0.7);
      app.lightContainer[0].setColorB(100)
      menuBeast.activateBloomEffect();
      // app.activateVolumetricEffect({
      //   density: 0.5,
      //   steps: 30,
      //   scatterStrength: 2,
      //   heightFalloff: 0.2,
      //   lightColor: [0, 1.8, 10]
      // })
      menuBeast.lightContainer[0].setPosition(0, 35, 0);
      menuBeast.lightContainer[0].setTarget(0, 0, -20);

      // Runner system: obstacles that approach the player from +Z and loop back to +Z
      // Use collision-sub-system.js for non-physics collisions
      function spawnRunners(menuBeast, mesh, opts = {}) {
        const cfg = Object.assign({
          count: 12,
          minX: -18,
          maxX: 18,
          minY: 1,
          maxY: 2,
          startZ: 60,
          endZ: -40,  
          speedMin: 0.6,
          speedMax: 1.6,
          scaleMin: 0.8,
          scaleMax: 1.8
        }, opts);

        const runners = [];

        function rand(a, b) {return a + Math.random() * (b - a);}

        for(let i = 0;i < cfg.count;i++) {
          const x = rand(cfg.minX, cfg.maxX);
          const y = rand(cfg.minY, cfg.maxY);
          const z = cfg.startZ + Math.random() * 30;
          const s = rand(cfg.scaleMin, cfg.scaleMax);
          const obj = menuBeast.addMeshObj({
            material: {type: 'standard', share: false},
            position: {x: x, y: y, z: z},
            rotation: {x: 0, y: 0, z: 0},
            rotationSpeed: {x: 0, y: 0, z: 0},
            scale: [s, s, s],
            texturesPaths: ['./res/textures/matrix1.webp'],
            name: 'runner' + i,
            mesh: mesh,
            raycast: {enabled: true, radius: 1},
            physics: {enabled: false, mass: 0, geometry: "Cube"}
          });
          obj._runnerSpeed = rand(cfg.speedMin, cfg.speedMax);
          obj._runnerCfg = cfg;
          obj._runnerColor = randomObstacleColor();
          obj._runnerDamage = damageFromColor(obj._runnerColor);
          obj._runnerSlow = slowFromColor(obj._runnerColor);
          const amb = ambientFromColor(obj._runnerColor);
          // console.log("?>>>>>>>>>>>>>>>>>>>>>>>>>" + amb)
          obj.setAmbient(amb.r, amb.g, amb.b);
          //obj.setupMaterialPBR(obj._runnerColor.r , obj._runnerColor.g, obj._runnerColor.b)
          runners.push(obj);
          const rRadius = Math.max(s) || s;
          try {
            collisionSystem.register(obj.name, obj.position, s * 1.25, 'obstacle');
          } catch(err) {
            console.warn('collision register failed', err);
          }
        }

        // Update function called each frame via app.autoUpdate
        const updater = {
          update: function() {
            for(let i = 0;i < runners.length;i++) {
              const r = runners[i];
              // move towards negative Z (from +Z to -Z). This direction assumes player is at -Z.
              if(!r.position) continue;
              r.position.z -= r._runnerSpeed;
              if(r.rotation) r.rotation.y += 0.01 + r._runnerSpeed * 0.01;
              if(r.position.z < r._runnerCfg.endZ) {
                // r._runnerColor = randomObstacleColor();
                // r._runnerDamage = damageFromColor(r._runnerColor);
                // r._runnerSlow = slowFromColor(r._runnerColor);
                r.position.z = r._runnerCfg.startZ + Math.random() * 30;
                r.position.x = rand(r._runnerCfg.minX, r._runnerCfg.maxX);
                r.position.y = rand(r._runnerCfg.minY, r._runnerCfg.maxY);
                r._runnerSpeed = rand(r._runnerCfg.speedMin, r._runnerCfg.speedMax);
                const s2 = rand(r._runnerCfg.scaleMin, r._runnerCfg.scaleMax);
                if(r.scale) r.scale = [s2, s2, s2];
              }
            }
          }
        };

        app.autoUpdate.push(updater);
        return {runners, updater};
      }

      // spawn runners using cube mesh. tune count and ranges as needed.
      const runnerSet = spawnRunners(menuBeast, m.cube, {count: 14, minX: -22, maxX: 22, minY: 0.5, maxY: 3, startZ: 60, endZ: -50, speedMin: 0.55, speedMax: 1.5});

      addEventListener('player-hit', (e) => {
        console.log('HIT DAMAGE', e.detail.damage, 'ENERGY LEFT', e.detail.energy)
        app.ENERGYBAR.setValue(app.beast.energy);
        const redLevel = 1 + (100 - app.beast.energy) * (99 / 100);
        app.beast.setAmbient(redLevel, 2, 1);

      })

      window.addEventListener('close-distance', (e) => {
        try {
          const detail = e.detail.data || e.detail || {};
          const A = detail.A;
          const B = detail.B;
          if(!A || !B) return;
          if((A.group === 'player' && B.group === 'obstacle') || (B.group === 'player' && A.group === 'obstacle')) {
            const obstacle = A.group === 'obstacle' ? A : B;
            const obj = app.getSceneObjectByName(obstacle.id);
            if(!obj || !obj.position || !obj._runnerCfg) return;

            // debounce: ignore repeat hits within a short window
            const now = performance.now();
            if(obj._lastHitTime && now - obj._lastHitTime < 250) return;
            obj._lastHitTime = now;

            const damage = obj._runnerDamage || 10;
            app.beast.energy = Math.max(0, Math.min(100, app.beast.energy - damage));

            obj.position.z = obj._runnerCfg.startZ + Math.random() * 30;
            obj.position.x = Math.random() * (obj._runnerCfg.maxX - obj._runnerCfg.minX) + obj._runnerCfg.minX;
            obj.position.y = Math.random() * (obj._runnerCfg.maxY - obj._runnerCfg.minY) + obj._runnerCfg.minY;

            obj._runnerColor = randomObstacleColor();
            obj._runnerDamage = damageFromColor(obj._runnerColor);
            obj._runnerSlow = slowFromColor(obj._runnerColor);
            const amb = ambientFromColor(obj._runnerColor);
            obj.setAmbient(amb.r, amb.g, amb.b);

            hitEvent.detail.obstacleId = obstacle.id;
            hitEvent.detail.damage = damage;
            hitEvent.detail.energy = app.beast.energy;
            dispatchEvent(hitEvent);

            if(app.beast.energy <= 0) {
              dispatchEvent(new CustomEvent('player-dead', {detail: {}}));
            }
          }
        } catch(err) {console.warn('close-distance handler error', err);}
      });

      let controlBeast = {
        update: function() {
          const setNewZ = cursor.y * 0.05;
          const setNewX = (cursor.x - 300) * 0.05;
          app.beast.position.setPosition(setNewX, 0, -setNewZ)
          // app.matrixPhysics.setBodyTransform(playerID, setNewX, 0, -setNewZ)
        }
      }

      setTimeout(() => {

        // playerID = app.matrixPhysics.getBodyByName('player_MutantMesh');
        // console.log('PLAYER ID ', playerID)
        app.autoUpdate.push(controlBeast)

        menuBeast.activateHZB();
        // MYCUBE.effects.circle = new GenGeoTexture2(menuBeast.device, 'rgba16float', 'circle2', './res/textures/star1.png', 1, app.cameraBuffer);
        // app.getSceneObjectByName('sky').setAmbient(2, 0.5, 1);
        let cam = app.getCamera();
        cam.setYaw(-0.03);
        cam.setPitch(-0.49);
        cam.setZ(0);
        cam.setY(7);
        app.buildRenderBuckets();
        cam._dirtyAngle = true;
      }, 700);
    }

    // menuBeast.canvas.addEventListener("ray.hit.event", (e) => {
    //   console.log('ray.hit.event detected');
    //   if(e.detail.hitObject.name.startsWith('cube')) {
    //     // e.detail.hitObject.effects.flameEmitter.recreateVertexDataCrazzy(5);
    //   }
    // });
  })
  window.app = menuBeast;
}