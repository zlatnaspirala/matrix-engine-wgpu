
import MatrixEngineWGPU from "../../../src/world.js";
import {downloadMeshes} from '../../../src/engine/loader-obj.js';
import {addRaycastsAABBListener} from "../../../src/engine/raycast.js";
import {isMobile} from "../../../src/engine/utils.js";
import {PipeCommander, PipeGestureResolver} from "../../../src/engine/buildin/nui-pipe.js";
import {MobileDOM} from "../../../src/engine/cameras.js";

export var loadHand = function() {

  let loadHand = new MatrixEngineWGPU({
    canvasSize: 'fullscreen',
    fastRender: 0.9,
    dontUsePhysics: true,
    // useCannon: true,
    MAX_SPOTLIGHTS: 1,
    MAX_BONES: 0,
    mainCameraParams: {
      type: 'WASD',
      responseCoef: 1000
    },
    clearColor: {r: 0, b: 0.122, g: 0.122, a: 1}
  }, () => {
    const pipe = new PipeGestureResolver();
    const nui = new PipeCommander();
    // for now on top level
    // note : this must go in build in pack.
    // any way - override is always legal for any cather.
    const cam = app.getCamera();
    nui.onResults = (results) => {
      const hands = pipe.resolve(results);
      for(const hand of hands) {
        if(hand.isOpenHand) {
          // const worldPos = pipe.unprojected(hand.palmCenter, app._invViewProj, 10);
          // console.log(worldPos)
          console.log("open !!!!!!",);
          cam._digital.backward = false;
          clearInterval(cam._keyIntervalF)
          clearInterval(cam._keyIntervalB)
          cam._keyIntervalF = setInterval(() => {
            cam._digital.forward = true;
            cam._dirty = true;
            cam._dirtyAngle = true;
            cam._applyDigitalMovement();
          }, 26);
          // app.matrixPhysics.explode(1, worldPos.x, worldPos.y, worldPos.z, 15.0, 50.0);
        } else if(hand.isPointing) {
          // const worldPos = pipe.unprojected(hand.palmCenter, app._invViewProj, 10);
          const dir = hand.indexDirection;
          clearInterval(cam._keyIntervalF)
          clearInterval(cam._keyIntervalB)
          console.log("dir", hand.indexDirection);
          // left / right → rotate camera Y
          if(dir.x < -0.1) cam.yaw -= 0.1;
          if(dir.x > 0.4) cam.yaw += 0.1;
          // up / down → rotate camera X (pitch)
          if(dir.y > 0.4) cam.pitch += 0.1;
          if(dir.y < -0.1) cam.pitch -= 0.1;
          console.log('WHAT IS dir ', dir)
          cam._dirtyAngle = true;
          // app.matrixPhysics.explode(1, worldPos.x, worldPos.y, worldPos.z, 15, -30.0);
        } else if(hand.isPeace) {
          // grab nearest body
          // const worldPos = pipe.unprojected(hand.indexTip, app._invViewProj);
          // app.matrixPhysics.createPointConstraint("nearestBody", worldPos);
          console.log("PEACE !!",);
          cam._digital.forward = false;
          clearInterval(cam._keyIntervalF)
          clearInterval(cam._keyIntervalB)
          cam._keyIntervalB = setInterval(() => {
            cam._digital.backward = true;
            cam._dirty = true;
            cam._dirtyAngle = true;
            cam._applyDigitalMovement();
          }, 26);
          // console.log('PINCH');
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
      // let arg1 = isMobile() && getOrientation() === 'portrait' ? {left: '5'} : {left: '53'};
      // MobileDOM.addButton("Enable camera",
      //   function() {
      //     // nui.enableWebcam()
      //   },
      //   () => {}, arg1);

      loadHand.addMeshObj({
        material: {type: 'standard', share: true},
        position: {x: 0, y: 0, z: -10},
        rotation: {x: 0, y: 0, z: 0},
        rotationSpeed: {x: 0, y: 0, z: 0},
        texturesPaths: ['./res/textures/floor1.webp'],
        name: 'floor',
        mesh: m.cube,
        physics: {
          enabled: false,
          mass: 0,
          geometry: "Cube"
        }
      })
    }

    async function onLoadObj(m) {
      let MYCUBE = loadHand.addMeshObj({
        material: {type: 'standard'},
        position: {x: 0, y: 4, z: -10},
        rotation: {x: 0, y: 0, z: 0},
        rotationSpeed: {x: 0, y: 0, z: 0},
        scale: [5, 5, 5],
        texturesPaths: ['./res/textures/floor1.webp', './res/textures/env-maps/sky1_lod_mid.webp'],
        name: 'cube',
        mesh: m.cube,
        envMapParams: {
          baseColorMix: 0.1,                // CLEAR SKY
          mirrorTint: [0.9, 0.95, 1.0],     // Slight cool tint
          reflectivity: 0.75,               // 25% reflection blend
          illuminateColor: [0.3, 0.7, 1.0], // Soft cyan
          illuminateStrength: 1.5,          // Gentle rim
          illuminatePulse: 0.1,             // No pulse (static)
          fresnelPower: 5,                  // Medium-sharp edge
          envLodBias: 1.5,
          usePlanarReflection: false,       // ✅ Env map mode
        },
        raycast: {enabled: true, radius: 1},
        physics: {
          enabled: false,
          mass: 1,
          geometry: "Cube"
        }
      })

      loadHand.lightContainer[0].setIntensity(15);
      // loadHand.activateBloomEffect();
      loadHand.lightContainer[0].setPosition(0, 15, -10);
      loadHand.lightContainer[0].setTarget(0, 0, -10);

      setTimeout(() => {
        loadHand.activateHZB();
        // MYCUBE.effects.circle = new GenGeoTexture2(loadHand.device, 'rgba16float', 'circle2', './res/textures/star1.png', 1, app.cameraBuffer);
        // app.getSceneObjectByName('sky').setAmbient(2, 0.5, 1);
        let cam = app.getCamera();
        cam.setYaw(-0.03);
        cam.setPitch(-0.49);
        cam.setZ(0);
        cam.setY(10);
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