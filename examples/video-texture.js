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

    addEventListener('AmmoReady', () => {
      downloadMeshes({
        welcomeText: "./res/meshes/blender/piramyd.obj",
        armor: "./res/meshes/obj/armor.obj",
        sphere: "./res/meshes/blender/sphere.obj",
        cube: "./res/meshes/blender/cube.obj",
      }, onLoadObj,
        {scale: [1, 1, 1]})
    })

    function onLoadObj(m) {
      videoTexture.myLoadedMeshes = m;
      for(var key in m) {
        console.log(`%c Loaded objs: ${key} `, LOG_MATRIX);
      }

      videoTexture.addMeshObj({
        position: {x: 0, y: 2, z: -10},
        rotation: {x: 0, y: 0, z: 0},
        rotationSpeed: {x: 0, y: 0, z: 0},
        texturesPaths: ['./res/meshes/blender/cube.png'],
        name: 'MyVideoTex',
        mesh: m.cube,
        physics: {
          enabled: true,
          geometry: "Cube"
        },
        // raycast: { enabled: true , radius: 2 }
      })

      var TEST = videoTexture.getSceneObjectByName('MyVideoTex');

      console.log(`%c Test video-texture...`, LOG_MATRIX);
      TEST.loadVideoTexture({
        type: 'video',
        src: 'res/videos/tunel.mp4'
      });

    }
  })

  window.app = videoTexture;

}