
import MatrixEngineWGPU from "../../../src/world.js";
import {downloadMeshes} from '../../../src/engine/loader-obj.js';
import {addRaycastsAABBListener} from "../../../src/engine/raycast.js";
import {byId, isMobile} from "../../../src/engine/utils.js";
import {PipeCommander, PipeGestureResolver} from "../../../src/engine/buildin/nui-pipe.js";
import {MobileDOM} from "../../../src/engine/cameras.js";
import {SplatHandEffect} from "../../../src/engine/effects/splat-mediapipe.js";
import {GaussianSplatScene, SplatColorAnimator, SplatPositionAnimator} from "../../../src/engine/effects/splat.js";
import {SplatFaceEffect} from "../../../src/engine/effects/splatFace.js";
import {MSDFTextEffect} from "../../../src/engine/effects/msdfText.js";

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

    let MYCUBE, animator;
    const pipe = new PipeGestureResolver();
    const nui = new PipeCommander(true, null, null, {
      enableVisual: false,
      mode: 'face'
    });

    // for now on top level
    // note : this must go in build in pack.
    // any way - override is always legal for any cather.
    // const cam = app.getCamera();
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

      loadFace.addMeshObj({
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
        material: {type: 'dark', share: true},
        position: {x: 0, y: 5, z: -10},
        rotation: {x: 0, y: 0, z: 0},
        rotationSpeed: {x: 0, y: 0, z: 0},
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

      window.MYCUBE = MYCUBE;


      // app.physicsBodiesGeneratorWall("standard",
      //   {x: -4.5, y: 1, z: -10}, {x: 0, y: 0, z: 0},
      //   ["./res/textures/rust.jpg",],
      //   'my_set_walls', "5x3", true, [1, 1, 1], 2.05, 1000, "ByX");

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
      loadFace.lightContainer[0].setPosition(0, 35, 0);
      loadFace.lightContainer[0].setTarget(0, 0, -20);


      // text

      setTimeout(async () => {

        const fontResponse = await fetch('./res/3d-fonts/stormfaze.fnt');

        if(!fontResponse.ok) {
          throw new Error(
            `Failed to load BMFont file: ${fontResponse.status} ${fontResponse.statusText}`
          );
        }

        const fontXml = await fontResponse.text();

        // Parse BMFont XML
        const font = new BMFontParser(fontXml);

        console.log('Font loaded:', font.info.face);
        console.log('Atlas:', font.getAtlasDimensions());


        // ------------------------------------------------------------
        // LOAD MSDF ATLAS
        // ------------------------------------------------------------

        const response = await fetch('./res/3d-fonts/atlas.png');

        if(!response.ok) {
          throw new Error(
            `Failed to load MSDF atlas: ${response.status} ${response.statusText}`
          );
        }

        const blob = await response.blob();
        const bitmap = await createImageBitmap(blob);


        // ------------------------------------------------------------
        // CREATE GPU TEXTURE
        // ------------------------------------------------------------

        const device = loadFace.device;

        const msdfTexture = device.createTexture({
          size: {
            width: bitmap.width,
            height: bitmap.height,
            depthOrArrayLayers: 1
          },

          format: 'rgba8unorm',

          usage:
            GPUTextureUsage.TEXTURE_BINDING |
            GPUTextureUsage.COPY_DST
        });


        // ------------------------------------------------------------
        // UPLOAD ATLAS TO GPU
        // ------------------------------------------------------------

        const canvas = new OffscreenCanvas(
          bitmap.width,
          bitmap.height
        );

        const ctx = canvas.getContext('2d');

        ctx.drawImage(bitmap, 0, 0);

        const imageData = ctx.getImageData(
          0,
          0,
          bitmap.width,
          bitmap.height
        );

        device.queue.writeTexture(
          {
            texture: msdfTexture
          },

          imageData.data,

          {
            bytesPerRow: bitmap.width * 4,
            rowsPerImage: bitmap.height
          },

          {
            width: bitmap.width,
            height: bitmap.height,
            depthOrArrayLayers: 1
          }
        );


        // ------------------------------------------------------------
        // SAMPLER
        // ------------------------------------------------------------

        const sampler = device.createSampler({
          magFilter: 'linear',
          minFilter: 'linear',
          mipmapFilter: 'nearest',

          addressModeU: 'clamp-to-edge',
          addressModeV: 'clamp-to-edge'
        });


        // ------------------------------------------------------------
        // CREATE MSDF TEXT EFFECT
        // ------------------------------------------------------------

        MYCUBE.effects.gpuText = new MSDFTextEffect(
          device,
          'rgba16float',
          msdfTexture,
          sampler,
          loadFace.cameraBuffer,
          font                         // <-- THIS WAS MISSING
        );




        MYCUBE.effects.splat = new GaussianSplatScene(loadFace.device, 'rgba16float', loadFace.cameraBuffer);
        const layer = await MYCUBE.effects.splat.initialize('./res/meshes/ply/beast.ply', 6, "point-list");
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

        const faceEffect = new SplatFaceEffect(
          loadFace.device,
          'rgba16float',
          loadFace.cameraBuffer,
          MYCUBE.effects.splat.splatLayers[0],
          {
            scale: 4.5,
            clusterRadius: 1.0,
            origin: [0, 1.6, 0],
            mirrorX: true
          }
        );

        MYCUBE.effects.faceEffect = faceEffect;

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
      }, 700);
    }

    loadFace.canvas.addEventListener("ray.hit.event", (e) => {
      console.log('ray.hit.event detected');

      nui.onResults = (results) => {
        // MYCUBE.effects.faceEffect.setFaceData(results);
      };

      MYCUBE.effects.splat.splatLayers[0].positionAnimator.setMode('dust')
      // if(e.detail.hitObject.name.startsWith('cube')) {      }
    });

  })
  window.app = loadFace;
}