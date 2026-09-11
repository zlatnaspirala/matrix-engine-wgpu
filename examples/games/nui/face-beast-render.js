
import MatrixEngineWGPU from "../../../src/world.js";
import {downloadMeshes} from '../../../src/engine/loader-obj.js';
import {addRaycastsAABBListener} from "../../../src/engine/raycast.js";
import {byId, isMobile} from "../../../src/engine/utils.js";
import {PipeCommander, PipeGestureResolver} from "../../../src/engine/buildin/nui-pipe.js";
import {MobileDOM} from "../../../src/engine/cameras.js";
// import {SplatHandEffect} from "../../../src/engine/effects/splat-mediapipe.js";
import {GaussianSplatScene, SplatColorAnimator, SplatPositionAnimator} from "../../../src/engine/effects/splat.js";
import {SplatFaceEffect} from "../../../src/engine/effects/splatFace.js";
import {loadAtlasFONT, MSDFTextEffect} from "../../../src/engine/effects/msdfText.js";
import {MatrixTTS} from "../../../src/engine/tts.js";

const TEXT = `The Beast`;

export var loadFaceBeast = function() {

  let loadFace = new MatrixEngineWGPU({
    canvasSize: 'fullscreen',
    fastRender: 0.9,
    dontUsePhysics: true,
    useCannon: true,
    MAX_SPOTLIGHTS: 1,
    MAX_BONES: 0,
    mainCameraParams: {
      type: 'WASD',
      // noEvents: true,
      responseCoef: 1000
    },
    clearColor: {r: 0, b: 0.122, g: 0.122, a: 1}
  }, () => {

    // MatrixTTS
    // loadFace.tts = new MatrixTTS();
    let MYCUBE, animator;
    const pipe = new PipeGestureResolver();
    const nui = new PipeCommander(true, null, null, {
      enableVisual: false,
      mode: 'face'
    });


    // Dom
    let bloomRadius = 0.1;
    let bloomIntesity = 0.1;
    let glbAnimation = 0;

    let arg1 = isMobile() && getOrientation() === 'portrait' ? {left: '84', bottom: 82} : {left: '5'};
    MobileDOM.addButton("Bloom radius +", function() {
      app.bloomPass.setBlurRadius(bloomRadius);
      bloomRadius++;
    }, () => {}, arg1);

    let arg2 = isMobile() && getOrientation() === 'portrait' ? {left: '84', bottom: 73} : {left: '13'};
    MobileDOM.addButton("Bloom radius -", function() {
      app.bloomPass.setBlurRadius(bloomRadius);
      if((bloomRadius - 1 > 0)) bloomRadius--;
    }, () => {}, arg2);

    let arg3 = isMobile() && getOrientation() === 'portrait' ? {left: '84', bottom: 64} : {left: '21'};
    MobileDOM.addButton("Bloom intesity +", function() {
      app.bloomPass.setIntensity(bloomIntesity);
      bloomIntesity = bloomIntesity + 20;
    }, () => {}, arg3);

    let arg4 = isMobile() && getOrientation() === 'portrait' ? {left: '84', bottom: 55} : {left: '29'};
    MobileDOM.addButton("Bloom intesity -", function() {
      app.bloomPass.setIntensity(bloomIntesity);
      if((bloomIntesity - 10 > 0)) bloomIntesity = bloomIntesity - 10;
    }, () => {}, arg4);

    loadFace.addLight();
    downloadMeshes({ball: "./res/meshes/blender/sphere.obj", cube: "./res/meshes/blender/cube.obj"}, onLoadObj, {scale: [1, 1, 1]})
    downloadMeshes({cube: "./res/meshes/blender/cube.obj"}, onGround, {scale: [30, 0.5, 30]})
    addRaycastsAABBListener('canvas1', 'click');

    async function onGround(m) {
      // let arg1 = isMobile() && getOrientation() === 'portrait' ? {left: '5'} : {left: '53'};
      // MobileDOM.addButton("Enable camera",
      //   function() {
      //     // nui.enableWebcam()
      //     if(byId('auto-video').style.zIndex === '-1') {
      //       byId('auto-video').style.zIndex = 1;
      //       byId('auto-video').style.opacity = 0.4;
      //     } else {
      //       byId('auto-video').style.zIndex = -1;
      //       byId('auto-video').style.opacity = 0.4;
      //     }
      //   },
      //   () => {}, arg1);

      loadFace.floor = loadFace.addMeshObj({
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

    function createPillar(loadFace, m, x, y, z, name) {
      const base = loadFace.addMeshObj({
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

      const top = loadFace.addMeshObj({
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

      MYCUBE = loadFace.addMeshObj({
        material: {type: 'standard', share: true},
        position: {x: 0, y: 5, z: -10},
        rotation: {x: 0, y: 0, z: 0},
        rotationSpeed: {x: 0, y: 0, z: 0},
        scale: [1, 1, 1],
        texturesPaths: ['./res/textures/white-metal.png'],
        name: 'MYCUBE',
        mesh: m.cube,
        physics: {
          enabled: false,
          mass: 0,
          geometry: "Cube"
        },
        pointerEffect: {enabled: true}
      })

      const pillar1 = createPillar(loadFace, m, -20, 6, -30, "pil1");
      const pillar2 = createPillar(loadFace, m, 20, 6, -30, "pil2");
      const pillar3 = createPillar(loadFace, m, -20, 6, 20, "pil3");
      const pillar4 = createPillar(loadFace, m, 20, 6, 20, "pil4");

      loadFace.lightContainer[0].setIntensity(0.7);
      app.lightContainer[0].setColorB(100)
      loadFace.activateBloomEffect();
      // app.activateVolumetricEffect({
      //   density: 0.5,
      //   steps: 30,
      //   scatterStrength: 2,
      //   heightFalloff: 0.2,
      //   lightColor: [0, 1.8, 10]
      // })
      loadFace.lightContainer[0].setPosition(0, 55, 0);
      loadFace.lightContainer[0].setTarget(0, 0, -20);

      const sampler = loadFace.device.createSampler({
        magFilter: 'linear',
        minFilter: 'linear',
        mipmapFilter: 'nearest',
        addressModeU: 'clamp-to-edge',
        addressModeV: 'clamp-to-edge'
      });

      loadAtlasFONT(loadFace.device).then((OUTPUT) => {
        // console.log("FONT ", OUTPUT)
        loadFace.floor.effects.gpuText = new MSDFTextEffect(
          loadFace.device,
          'rgba16float',
          OUTPUT.msdfTexture,
          sampler,
          loadFace.cameraBuffer,
          OUTPUT.font, {scale: 0.1}
        );

        loadFace.floor.effects.gpuText.typeText(TEXT, 200, () => {
          console.log('Typing complete!');
        });
      });
      // text
      setTimeout(async () => {


        MYCUBE.setBlend(0);

        MYCUBE.effects.splat = new GaussianSplatScene(loadFace.device, 'rgba16float', loadFace.cameraBuffer);
        const layer = await MYCUBE.effects.splat.initialize('./res/meshes/ply/beast.ply', 6, "point-list");
        // const layer = await MYCUBE.effects.splat.initialize('./res/meshes/ply/beast.ply', 6, "triangle-list");
        animator = new SplatColorAnimator(
          loadFace.device,
          layer.positions,
          layer.vertexCount,
          layer.colorBuffer
        );
        animator.setMode('pulse');
        animator.setScale(0.8);
        animator.setSpeed(0.8);
        layer.colorBuffer = animator.colorBuffer;
        loadFace.autoUpdate.push(animator);

        loadFace.animator = animator;

        let positionAnimator = new SplatPositionAnimator(
          loadFace.device,
          MYCUBE.effects.splat.splatLayers[0].positions,
          MYCUBE.effects.splat.splatLayers[0].vertexCount
        );

        MYCUBE.effects.splat.splatLayers[0].attachPositionAnimator(positionAnimator)
        loadFace.autoUpdate.push(positionAnimator);
        positionAnimator.setMode('hold');

        loadFace.positionAnimator = positionAnimator;

        const faceEffect = new SplatFaceEffect(
          loadFace.device,
          'rgba16float',
          loadFace.cameraBuffer,
          MYCUBE.effects.splat.splatLayers[0],

          {
            scale: 5,
            clusterRadius: 1.0,
            origin: [0, 0, 0],
            mirrorX: true
          }
        );

        MYCUBE.effects.faceEffect = faceEffect;
        app.MYCUBE = MYCUBE; // denug
        loadFace.MYCUBE.position.thrust = 0.1;
        // app.MYCUBE.position.translateByX(-10)

        // Hook mediapipe into it
        nui.onResults = (results) => {
          // console.log('face detected:', results?.landmarks?.length ?? 0);
          MYCUBE.effects.faceEffect.setFaceData(results);
        };

        loadFace.activateHZB();
        // MYCUBE.effects.circle = new GenGeoTexture2(loadFace.device, 'rgba16float', 'circle2', './res/textures/star1.png', 1, app.cameraBuffer);
        // app.getSceneObjectByName('sky').setAmbient(2, 0.5, 1);
        let cam = app.getCamera();
        cam.setYaw(-0.03);
        cam.setPitch(-0.49);
        cam.setZ(0);
        cam.setY(7);
        app.buildRenderBuckets();
        cam._dirtyAngle = true;
      }, 6000);
    }


    loadFace.canvas.addEventListener("ray.hit.event", (e) => {
      console.log('ray.hit.event detected');
      // if you wanna disable
      // nui.onResults = (results) => {
      //   // MYCUBE.effects.faceEffect.setFaceData(results);
      // };
      MYCUBE.effects.splat.splatLayers[0].positionAnimator.setMode('dust');
      // app.MYCUBE.position.translateByX(-5000)
      // if(e.detail.hitObject.name.startsWith('cube')) {      }
    });

  })
  window.app = loadFace;
}