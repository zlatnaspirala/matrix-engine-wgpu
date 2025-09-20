import MatrixEngineWGPU from "../src/world.js";
import {downloadMeshes} from '../src/engine/loader-obj.js';
import {LOG_FUNNY, LOG_INFO, LOG_MATRIX} from "../src/engine/utils.js";
import {applyBVHToGLB, BVHPlayer, loadBVH} from "../src/engine/loaders/bvh.js";
import {uploadGLBModel} from "../src/engine/loaders/webgpu-gltf.js";

let TEST_ANIM = new MatrixEngineWGPU({
  useSingleRenderPass: true,
  canvasSize: 'fullscreen',
  mainCameraParams: {
    type: 'WASD',
    responseCoef: 1000
  },
  clearColor: {r: 0, b: 0.122, g: 0.122, a: 1}
}, () => {

  addEventListener('AmmoReady', () => {

        setTimeout(()=> {
      app.cameras.WASD.yaw = -0.03;
      app.cameras.WASD.pitch = -0.49;
      app.cameras.WASD.position[2] = 0;
      app.cameras.WASD.position[1] = 3.76;
    },500)

    downloadMeshes({cube: "./res/meshes/blender/cube.obj"}, onGround, {scale: [20, 1, 20]})
    // const path = 'https://raw.githubusercontent.com/zlatnaspirala/Matrix-Engine-BVH-test/main/javascript-bvh/example.bvh';
    const path = 'res/meshes/glb/glb-test1.bvh';

    loadBVH(path).then(async (BVHANIM) => {
      console.info(BVHANIM)
      var glbFile = await fetch(
        "res/meshes/glb/test.glb")
        .then(res => res.arrayBuffer().then(buf => uploadGLBModel(buf, TEST_ANIM.device)));

      // ✅ Inspect nodes (should now include bones + hierarchy)
      glbFile.nodes.forEach((node, i) => {
        console.log(`Node[${i}]: ${node.name || "(unnamed)"}`);
        if(node.children) {
          console.log(`   Children: ${node.children}`);
        }
        if(node.mesh !== undefined) {
          console.log(`   Mesh attached →`, node.mesh);
        }
        if(node.skin !== undefined) {
          console.log(`   Uses skin index: ${node.skin}`);
        }
      });


      TEST_ANIM.addGlbObj({
        scale: [1,1,1],
        name: 'firstGlb',
        texturesPaths: ['./res/textures/rust.jpg'],
      }, BVHANIM, glbFile);

    });
  })

  function onGround(m) {
    TEST_ANIM.addLight();

    // -0.03450356494543923 -0.4885164267948901 0 3.759999990463257


    TEST_ANIM.addMeshObj({
      position: {x: 0, y: -5, z: -10},
      rotation: {x: 0, y: 0, z: 0},
      rotationSpeed: {x: 0, y: 0, z: 0},
      texturesPaths: ['./res/meshes/blender/cube.png'],
      name: 'ground',
      mesh: m.cube,
      physics: {
        enabled: false,
        mass: 0,
        geometry: "Cube"
      },
      // raycast: { enabled: true , radius: 2 }
    })

    // alert('yes')
  }

})
// just for dev
window.app = TEST_ANIM;
