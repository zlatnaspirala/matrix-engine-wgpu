
import MatrixEngineWGPU from "../../../src/world.js";
import {downloadMeshes} from '../../../src/engine/loader-obj.js';
import {addRaycastsAABBListener} from "../../../src/engine/raycast.js";
import {byId, isMobile} from "../../../src/engine/utils.js";
import {MobileDOM} from "../../../src/engine/cameras.js";

import {
  indicatorsBlocks,
  CanvasEngine,
  interActionController,
  NuiMsgBox
} from "nui-commander";
import {createNuiContainer} from "../../../src/engine/buildin/adapter-nui-commander.js";

var nuiCommander = {};


export var loadMenuBeast = function() {

  createNuiContainer();

  let menuBeast = new MatrixEngineWGPU({
    canvasSize: 'fullscreen',
    fastRender: 0.9,
    // dontUsePhysics: true,
    useCannon: true,
    MAX_SPOTLIGHTS: 1,
    MAX_BONES: 0,
    mainCameraParams: {
      type: 'WASD',
      noEvents: true,
      responseCoef: 1000
    },
    clearColor: {r: 0, b: 0.122, g: 0.122, a: 1}
  }, () => {
    nuiCommander.drawer = new CanvasEngine(interActionController);
    nuiCommander.drawer.draw();

    nuiCommander.indicatorsBlocks = indicatorsBlocks;
    nuiCommander.drawer.elements.push(nuiCommander.indicatorsBlocks);


    menuBeast.matrixPhysics.speedUpSimulation(2);
    // for now on top level
    // note : this must go in build in pack.
    // any way - override is always legal for any cather.
    const cam = app.getCamera();


    menuBeast.addLight();
    downloadMeshes({ball: "./res/meshes/blender/sphere.obj", cube: "./res/meshes/blender/cube.obj"}, onLoadObj, {scale: [1, 1, 1]})
    downloadMeshes({cube: "./res/meshes/blender/cube.obj"}, onGround, {scale: [30, 0.5, 30]})
    addRaycastsAABBListener('canvas1', 'click');

    function onGround(m) {
      let arg1 = isMobile() && getOrientation() === 'portrait' ? {left: '5'} : {left: '53'};
      MobileDOM.addButton("Enable camera",
        function() {
          // nui.enableWebcam()
          if(byId('auto-video').style.zIndex === '-1') {
            byId('auto-video').style.zIndex = 1;
            byId('auto-video').style.opacity = 0.4;
          } else {
            byId('auto-video').style.zIndex = -1;
            byId('auto-video').style.opacity = 0.4;
          }
        },
        () => {}, arg1);

      menuBeast.addMeshObj({
        material: {type: 'dark', share: true},
        position: {x: 0, y: -1, z: -10},
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
      app.physicsBodiesGeneratorWall("standard",
        {x: -4.5, y: 1, z: -10}, {x: 0, y: 0, z: 0},
        ["./res/textures/rust.jpg",],
        'my_set_walls', "5x3", true, [1, 1, 1], 2.05, 1000, "ByX");
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

      setTimeout(() => {
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