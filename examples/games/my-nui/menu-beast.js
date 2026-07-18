
import MatrixEngineWGPU from "../../../src/world.js";
import {downloadMeshes} from '../../../src/engine/loader-obj.js';
import {addRaycastsAABBListener} from "../../../src/engine/raycast.js";
import {byId, isMobile} from "../../../src/engine/utils.js";

import {
  indicatorsBlocks,
  CanvasEngine,
  interActionController,
  NuiMsgBox,
  NuiCursor,
  NuiMenu,
  NuiSlider,
  NuiButton
} from "nui-commander";
import {createNuiContainer} from "../../../src/engine/buildin/adapter-nui-commander.js";
import {uploadGLBModel} from "../../../src/engine/loaders/webgpu-gltf.js";

export var loadMenuBeast = function() {

  createNuiContainer(true, false, true);

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

    byId('nui-commander-container').style.left = '10%';
    byId('nui-commander-container').style.top = '40%'

    var nuiCommander = {};
    // NUI PART START
    nuiCommander.drawer = new CanvasEngine(interActionController);
    nuiCommander.drawer.draw();

    nuiCommander.indicatorsBlocks = indicatorsBlocks;
    nuiCommander.drawer.elements.push(nuiCommander.indicatorsBlocks);

    nuiCommander.indicatorsBlocks.text[7] = '';

    const cursor = new NuiCursor({color: "255, 80, 80"});
    nuiCommander.drawer.elements.push(cursor);

    const slider = new NuiSlider("Bloom Intesity", {
      row: 2, value: 1, onChange: v => {
        // console.log('test')
        app.bloomPass.setIntensity(v)
      }
    });

    const sliderBloomRad = new NuiSlider("Bloom Blur", {
      row: 4, value: 1, onChange: v => {
        // console.log('test')
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
      {
        label: "Light red", action: () => {
          app.lightContainer[0].setColor([100, 1, 0])
        }
      },
      {
        label: "Light green", action: () => {
          app.lightContainer[0].setColor([0, 100, 1])
        }
      },
      {
        label: "Volumetric", action: () => {
          app.activateVolumetricEffect({
            density: 0.5,
            steps: 30,
            scatterStrength: 2,
            heightFalloff: 0.2,
            lightColor: [0, 1.8, 10]
          })
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
      // {
      //   label: "Set pos Z", action: () => {
      //     console.log( "cursor pos : " + cursor.y )
      //     // app.matrixPhysics.explodeAll([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
      //     //   0, 0, -20, 15.0, 20.0);
      //   }
      // },
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

    menuBeast.matrixPhysics.speedUpSimulation(4);
    // for now on top level
    // note : this must go in build in pack.
    // any way - override is always legal for any cather.
    const cam = app.getCamera();


    menuBeast.addLight();
    downloadMeshes({ball: "./res/meshes/blender/sphere.obj", cube: "./res/meshes/blender/cube.obj"}, onLoadObj, {scale: [1, 1, 1]})
    downloadMeshes({cube: "./res/meshes/blender/cube.obj"}, onGround, {scale: [30, 0.5, 30]})
    addRaycastsAABBListener('canvas1', 'click');

    async function onGround(m) {
      // let arg1 = isMobile() && getOrientation() === 'portrait' ? {left: '5'} : {left: '53'};
      // MobileDOM.addButton("Enable camera",
      //   function() {        },
      //   () => {}, arg1);

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
        scale: [4, 4, 4],
        position: {x: 0, y: -1, z: -25},
        name: 'beast',
        physics: {
          enabled: true,
          geometry: "Cube",
          mass: 1,
          radius: [0.5, 0.5, 0.5],
          scale: [2, 0.5, 2],
          height: 1.0,
          group: 2,
          mask: -1,
        },
        texturesPaths: ['./res/meshes/glb/textures/mutant_origin.webp'],
      }, null, glbFile);


      app.beast = beast;
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

      let controlBeast = {
        update: function() {
            console.log( "cursor pos : " + cursor.x )
            // 0 - 480
            // 0 - 48
            const setNewZ = cursor.y * 0.05;
            const setNewX = (cursor.x - 300) * 0.05;
            app.matrixPhysics.setBodyTransform(2, setNewX , 0, -setNewZ)
        }
      }
      app.autoUpdate.push(controlBeast)

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