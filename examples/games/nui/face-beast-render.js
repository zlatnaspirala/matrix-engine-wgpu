
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
import {MeshMorpher} from "../../../src/engine/procedural-mesh.js";

const TEXT = `The Beast Render`;

export var loadFaceBeast = function() {

  let loadFace = new MatrixEngineWGPU({
    canvasSize: 'fullscreen',
    fastRender: 0.9,
    // dontUsePhysics: true,
    useCannon: true,
    MAX_SPOTLIGHTS: 2,
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
    // loadFace.addLight();
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

      loadFace.addProceduralMeshObj({
        material: {type: 'standard'},
        position: {x: 1, y: 3, z: -7},
        rotation: {x: 0, y: 0, z: 0},
        scale: [2, 2, 2],
        rotationSpeed: {x: 0, y: 0, z: 0},
        texturesPaths: ['./res/textures/cube-g1_low.webp'],
        meshA: MeshMorpher.cone(1, 3, false),
        meshB: MeshMorpher.cube(1),
        name: `morph_cone`,
        physics: {
          enabled: true,
          geometry: "Cone",
          mass: 1,
          radius: 1,
          height: 3,
          group: 2,
          mask: -1,
        },
        raycast: {enabled: true, radius: 1}
      });


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

      loadFace.activateBloomEffect();
      // app.activateVolumetricEffect({
      //   density: 0.05,
      //   steps: 30,
      //   scatterStrength: 0.5,
      //   heightFalloff: 0.2,
      //   lightColor: [0, 1, 5]
      // });
      loadFace.lightContainer[0].setIntensity(1000);
      app.lightContainer[0].setColorB(1)
      loadFace.lightContainer[0].setPosition(0, 65, 0);
      loadFace.lightContainer[0].setTarget(0, 0, -20);


      // loadFace.lightContainer[1].setPosition(0, 5, -10);
      // loadFace.lightContainer[1].setTarget(0, 5, 20);

      const sampler = loadFace.device.createSampler({
        magFilter: 'linear',
        minFilter: 'linear',
        mipmapFilter: 'nearest',
        addressModeU: 'clamp-to-edge',
        addressModeV: 'clamp-to-edge'
      });

      loadAtlasFONT(loadFace.device).then((OUTPUT) => {
        loadFace.floor.effects.gpuText = new MSDFTextEffect(
          loadFace.device,
          'rgba16float',
          OUTPUT.msdfTexture,
          sampler,
          loadFace.cameraBuffer,
          OUTPUT.font, {scale: 0.05, localOffset: [-15 ,1,0]}
        );

        // app.floor.effects.gpuText.setLocalOffset( -15 ,1,0)

        loadFace.floor.effects.gpuText.typeText(TEXT, 200, () => {
          // console.log('Typing complete!');
          MYCUBE.effects.splat = new GaussianSplatScene(loadFace.device, 'rgba16float', loadFace.cameraBuffer);
        });
      });
      // text
      setTimeout(async () => {
        MYCUBE.setBlend(0);
        // 
        const layer = await MYCUBE.effects.splat.initialize('./res/meshes/ply/beast-text.ply', 6, "point-list");
        // const layer = await MYCUBE.effects.splat.initialize('./res/meshes/ply/beast.ply', 6, "triangle-list");

        // animator = new SplatColorAnimator(
        //   loadFace.device,
        //   layer.positions,
        //   layer.vertexCount,
        //   layer.colorBuffer
        // );
        // animator.setMode('pulse');
        // animator.setScale(0.8);
        // animator.setSpeed(0.8);
        // layer.colorBuffer = animator.colorBuffer;
        // loadFace.autoUpdate.push(animator);

        // loadFace.animator = animator;

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
          {scale: 5, clusterRadius: 1.0, origin: [0, 0, 0], mirrorX: true}
        );

        MYCUBE.effects.faceEffect = faceEffect;
        MYCUBE.effects.faceEffect.setScale(32);

        app.MYCUBE = MYCUBE;

        loadFace.MYCUBE.position.thrust = 0.1;
        // app.MYCUBE.position.translateByX(-10)
        // Hook mediapipe into it
        nui.onResults = (results) => {
          MYCUBE.effects.faceEffect.setFaceData(results);
        };
        loadFace.activateHZB();

        // Important for face uv view!
        MYCUBE.effects.faceEffect.setMode('mesh');
        MYCUBE.position.translateByY(14)

        let cam = app.getCamera();
        cam.setYaw(0);
        cam.setPitch(0);
        cam.setZ(4);
        cam.setY(6);
        app.buildRenderBuckets();
        cam._dirtyAngle = true;
      }, 7000);
    }

    loadFace.canvas.addEventListener("ray.hit.event", (e) => {
      console.log('ray.hit.event detected');
      // if you wanna disable
      // nui.onResults = (results) => {};
      // MYCUBE.effects.splat.splatLayers[0].positionAnimator.setMode('dust');
    });

  })
  window.app = loadFace;
}