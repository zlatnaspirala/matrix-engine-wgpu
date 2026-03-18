import MatrixEngineWGPU from "../src/world.js";
import {downloadMeshes} from '../src/engine/loader-obj.js';
import {LOG_FUNNY, LOG_INFO, LOG_MATRIX} from "../src/engine/utils.js";
import {addRaycastsAABBListener} from "../src/engine/raycast.js";

// @group(0) @binding(5) var<uniform> postFXMode: u32;
export var loadVideoTexture = function() {

  let videoTexture = new MatrixEngineWGPU({
    useSingleRenderPass: true,
    canvasSize: 'fullscreen',
    mainCameraParams: {
      type: 'WASD',
      responseCoef: 1000
    },
    clearColor: {r: 0, b: 0.122, g: 0.122, a: 1}
  }, () => {

    // For now one light perscene must be added.
    // if you dont wanna light just use intesity = 0
    // videoTexture is app main instance
    videoTexture.addLight();

    addRaycastsAABBListener();
    videoTexture.canvas.addEventListener("ray.hit.event", (e) => {
      console.log('test ray after shadows merge')
    })

    console.log('test AmmoReady attach')
    addEventListener('AmmoReady', () => {
      downloadMeshes({
        piramyd: "./res/meshes/blender/piramyd.obj",
        cube: "./res/meshes/blender/cube.obj",
      }, onLoadObj,
        {scale: [5, 5, 5]})
    })

    function onLoadObj(m) {
      videoTexture.myLoadedMeshes = m;
      // for(var key in m) {
      //   console.log(`%c Loaded objs: ${key} `, LOG_MATRIX);
      // }

       videoTexture.addMeshObj({
        material: {type: 'standard'},
        position: {x: 0, y: -5, z: -10},
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

      videoTexture.addMeshObj({
        position: {x: 0, y: 5, z: -20},
        rotation: {x: 0, y: 0, z: 0},
        rotationSpeed: {x: 0, y: 0, z: 0},
        texturesPaths: ['./res/meshes/blender/cube.png'],
        name: 'MyVideoTex',
        mesh: m.cube,
        isVideo: {
          type: 'video',
          src: 'res/videos/tunel.mp4'
        },
        physics: {
          enabled: false,
          geometry: "Cube"
        },
        raycast: {enabled: true, radius: 12}
      })

      
      videoTexture.addMeshObj({
        position: {x: 10, y: 5, z: -20},
        rotation: {x: 90, y: 0, z: 0},
        rotationSpeed: {x: 0, y: 0, z: 0},
        texturesPaths: ['./res/meshes/blender/cube.png'],
        name: 'MyVideoTex',
        mesh: m.piramyd,
        isVideo: {
          type: 'video',
          src: 'res/videos/tunel.mp4'
        },
        physics: {
          enabled: false,
          geometry: "piramyd"
        },
        raycast: {enabled: true, radius: 12}
      })
      // also possibole to switch in runtime
      // var TEST = videoTexture.getSceneObjectByName('MyVideoTex');
      // console.log(`%c Test video-texture...`, LOG_MATRIX);
      // TEST.loadVideoTexture({
      //   type: 'video',
      //   src: 'res/videos/tunel.mp4'
      // });

      setTimeout(() => {
      videoTexture.cameras.WASD.yaw = -0.03;
      videoTexture.cameras.WASD.pitch = -0.49;
      videoTexture.cameras.WASD.position[2] = 10;
      videoTexture.cameras.WASD.position[1] = 5;
      }, 1000)
    }
  })

  window.app = videoTexture;

}