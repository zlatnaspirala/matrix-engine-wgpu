
import MatrixEngineWGPU from "../../../src/world.js";
import {downloadMeshes} from '../../../src/engine/loader-obj.js';
import {addRaycastsAABBListener} from "../../../src/engine/raycast.js";
import {byId, isMobile} from "../../../src/engine/utils.js";
import {PipeCommander, PipeGestureResolver} from "../../../src/engine/buildin/nui-pipe.js";
import {MobileDOM} from "../../../src/engine/cameras.js";

export var loadHand = function() {

  let loadHand = new MatrixEngineWGPU({
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
    const pipe = new PipeGestureResolver();
    const nui = new PipeCommander();

    loadHand.matrixPhysics.speedUpSimulation(2);
    // for now on top level
    // note : this must go in build in pack.
    // any way - override is always legal for any cather.
    const cam = app.getCamera();
    nui.onResults = (results) => {
      const hands = pipe.resolve(results);
      for(const hand of hands) {
        const thumb = hand.fingerStates[0];
        if(hand.isOpenHand) {
          // console.log("isOpenHand !!!!!!");
          cam._digital.backward = false;
          clearInterval(cam._keyIntervalB)
          cam._keyIntervalB = null;
          if(!cam._keyIntervalF) cam._keyIntervalF = setInterval(() => {
            cam._digital.forward = true;
            cam._dirty = true;
            cam._dirtyAngle = true;
            cam._applyDigitalMovement();
          }, 26);
        } else if(hand.isPointing) {
          // console.log("isPointing !!!!!!");
          const frame = hand.fingerStates[5];
          if(frame.forward.y < -0.3 && frame.forward.z < -0.3) {
            cam.yaw += 0.05;
          } else if(frame.forward.y > 0.3 && frame.forward.z > 0.3) {
            cam.yaw -= 0.05;
          } else if(frame.up.y < -0.8 && frame.up.z < 0.3) {
            cam.pitch += 0.05;
          }
          clearInterval(cam._keyIntervalF)
          clearInterval(cam._keyIntervalB)
          cam._keyIntervalF = null;
          cam._keyIntervalB = null;
          cam._digital.forward = false;
          cam._digital.backward = false;
          cam._dirtyAngle = true;
        } else if(hand.isPeace) {
          cam._digital.forward = false;
          clearInterval(cam._keyIntervalF)
          cam._keyIntervalF = null;
          if(!cam._keyIntervalB) cam._keyIntervalB = setInterval(() => {
            cam._digital.backward = true;
            cam._dirty = true;
            cam._dirtyAngle = true;
            cam._applyDigitalMovement();
          }, 16);
        } else if(hand.fingerStates[0] === true) {
          // console.log("palac !!!!!!");
          const frame = hand.fingerStates[5];
          if(thumb === true && frame.right.y > 0.7) {
            cam.pitch -= 0.05; // d
            cam._dirtyAngle = true;
          } else if(thumb === true && frame.right.y < -0.7) {
            // cam.pitch += 0.05;  // up
            const worldPos = pipe.unprojected(hand.palmCenter, app._invViewProj, 10);
            app.matrixPhysics.explodeAll([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
              worldPos.x, worldPos.y, worldPos.z, 15.0, 20.0);
          }
        } else {
          cam._digital.forward = false;
          cam._digital.backward = false;
          clearInterval(cam._keyIntervalB)
          clearInterval(cam._keyIntervalF)
        }
      }
    };

    loadHand.addLight();
    downloadMeshes({ball: "./res/meshes/blender/sphere.obj", cube: "./res/meshes/blender/cube.obj"}, onLoadObj, {scale: [1, 1, 1]})
    downloadMeshes({cube: "./res/meshes/blender/cube.obj"}, onGround, {scale: [30, 0.5, 30]})
    addRaycastsAABBListener('canvas1', 'click');

    function onGround(m) {
      let arg1 = isMobile() && getOrientation() === 'portrait' ? {left: '5'} : {left: '53'};
      MobileDOM.addButton("Enable camera",
        function() {
          // nui.enableWebcam()
          if (byId('auto-video').style.zIndex === '-1') {
            byId('auto-video').style.zIndex = 1;
            byId('auto-video').style.opacity = 0.4;
          } else {
            byId('auto-video').style.zIndex = -1;
            byId('auto-video').style.opacity = 0.4;
          }
        },
        () => {}, arg1);

      loadHand.addMeshObj({
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

    function createPillar(loadHand, m, x, y, z, name) {
      const base = loadHand.addMeshObj({
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

      const top = loadHand.addMeshObj({
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
      const pillar1 = createPillar(loadHand, m, -20, 6, -30, "pil1");
      const pillar2 = createPillar(loadHand, m, 20, 6, -30, "pil2");
      const pillar3 = createPillar(loadHand, m, -20, 6, 20, "pil3");
      const pillar4 = createPillar(loadHand, m, 20, 6, 20, "pil4");

      loadHand.lightContainer[0].setIntensity(0.7);
      app.lightContainer[0].setColorB(100)
      loadHand.activateBloomEffect();
      // app.activateVolumetricEffect({
      //   density: 0.5,
      //   steps: 30,
      //   scatterStrength: 2,
      //   heightFalloff: 0.2,
      //   lightColor: [0, 1.8, 10]
      // })
      loadHand.lightContainer[0].setPosition(0, 35, 0);
      loadHand.lightContainer[0].setTarget(0, 0, -20);

      setTimeout(() => {
        loadHand.activateHZB();
        // MYCUBE.effects.circle = new GenGeoTexture2(loadHand.device, 'rgba16float', 'circle2', './res/textures/star1.png', 1, app.cameraBuffer);
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

    // loadHand.canvas.addEventListener("ray.hit.event", (e) => {
    //   console.log('ray.hit.event detected');
    //   if(e.detail.hitObject.name.startsWith('cube')) {
    //     // e.detail.hitObject.effects.flameEmitter.recreateVertexDataCrazzy(5);
    //   }
    // });

  })
  window.app = loadHand;
}