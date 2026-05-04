import MatrixEngineWGPU from "../src/world.js";
import {downloadMeshes} from '../src/engine/loader-obj.js';
import {LOG_FUNNY, LOG_INFO, LOG_MATRIX} from "../src/engine/utils.js";
import {addRaycastsAABBListener} from "../src/engine/raycast.js";
import {MeshMorpher} from "../src/engine/procedural-mesh.js";

export var loadCameraTexture = function() {

  let cameraTexture = new MatrixEngineWGPU({
    useSingleRenderPass: true,
    canvasSize: 'fullscreen',
    mainCameraParams: {
      type: 'WASD',
      responseCoef: 1000
    },
    clearColor: {r: 0, b: 0.122, g: 0.122, a: 1}
  }, () => {

    addRaycastsAABBListener();
    cameraTexture.addLight();

    addEventListener('PhysicsReady', () => {
      downloadMeshes({
        welcomeText: "./res/meshes/blender/piramyd.obj",
        // sphere: "./res/meshes/blender/sphere.obj",
        // cube: "./res/meshes/blender/cube.obj",
      }, onLoadObj,
        {scale: [1, 1, 1]})
    })

    function onLoadObj(m) {

      cameraTexture.addProceduralMeshObj({
        position: {x: 0, y: 2, z: -10},
        rotation: {x: 0, y: 0, z: 0},
        rotationSpeed: {x: 0, y: 0, z: 0},
        texturesPaths: ['./res/meshes/blender/cube.png'],
        scale: [6,6,6],
        name: 'MyVideoTex',
        meshA: MeshMorpher.sphere(1, 2),
        meshB: MeshMorpher.cube(1),
        physics: {
          enabled: false,
          geometry: "Cube"
        },
        raycast: {enabled: true, radius: 2}
      })

      var TEST = cameraTexture.getSceneObjectByName('MyVideoTex');

      console.log(`%c Test video-texture...`, LOG_MATRIX);
      TEST.loadVideoTexture({
        type: 'camera'
      });

      let status = 1.0;

      cameraTexture.canvas.addEventListener("ray.hit.event", (e) => {
        console.log('ray.hit.event:', e.detail);
        TEST.morphTo(status);
        if (status == 1.0) {status = 0.0;}
        else {status = 1.0;}
      });

    }
  })

  window.app = cameraTexture;

}