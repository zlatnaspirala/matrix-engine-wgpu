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
    downloadMeshes({cube: "./res/meshes/blender/cube.obj"}, onGround, {scale: [20, 1, 20]})
    // const path = 'https://raw.githubusercontent.com/zlatnaspirala/Matrix-Engine-BVH-test/main/javascript-bvh/example.bvh';
    const path = 'res/meshes/glb/glb-test1.bvh';

    loadBVH(path).then(async (BVHANIM) => {
      console.info(BVHANIM)
      var glbFile = await fetch(
        "res/meshes/glb/test1.glb")
        .then(res => res.arrayBuffer().then(buf => uploadGLBModel(buf, TEST_ANIM.device)));
      // console.log('Loaded gltf ...', glbFile);
      // // ✅ Check if skins exist
      // if(glbFile.skins && glbFile.skins.length > 0) {
      //   console.log("Found skins:", glbFile.skins);

      //   // Each skin has: joints[] and inverseBindMatrices
      //   glbFile.skins.forEach((skin, i) => {
      //     console.log(`Skin[${i}] joints:`, skin.joints);
      //     console.log(`Skin[${i}] inverseBindMatrices:`, skin.inverseBindMatrices);
      //   });
      // } else {
      //   console.warn("❌ No skins found — mesh not bound to skeleton");
      // }

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

      // test 
      // glbFile.bvhToGLBMap = applyBVHToGLB(glbFile, BVHANIM, TEST_ANIM.device);
      // applyBVHToGLB(glbFile, BVHANIM, TEST_ANIM.device)

       TEST_ANIM.addGlbObj({name: 'firstGlb'}, BVHANIM, glbFile);

    });
  })

  function onGround(m) {
    TEST_ANIM.addLight();

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
