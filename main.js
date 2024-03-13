import MatrixEngineWGPU from "./src/meWGPU";
// import {adaptJSON1} from "./src/engine/final/adaptJSON1.js";
// import stanfordDragonData from "./public/res/meshes/dragon/stanfordDragonData.js"
import {testCUSTOMGEO} from "./public/res/meshes/blender/piramida.js";
import {downloadMeshes} from './src/engine/loader-obj.js';

let application = new MatrixEngineWGPU({
  useSingleRenderPass: false,
  canvasSize: 'fullscreen'
}, () => {

  let c = {
    scale: 1,
    position: {x: -2, y: 2, z: -10},
    rotation: {x: 0, y: 0, z: 0},
    rotationSpeed: {x: 0, y: 0, z: 0},
    texturesPaths: ['./res/textures/rust.jpg']
  };

  let o = {
    scale: 2,
    position: {x: 2, y: 0, z: -10},
    rotation: {x: 0, y: 45, z: 0},
    rotationSpeed: {x: 0, y: 0, z: 0},
    texturesPaths: ['./res/textures/rust.jpg']
  };

  // let mesh = adaptJSON1(stanfordDragonData)
  // application.addBall(o)
  // application.addCube(c)
  // application.addCube(o)

  function onLoadObj(m) {
    console.log('APP ', m.armor);
    console.log('APP2 ', testCUSTOMGEO);

    application.addMeshObj({
      position: {x: 0, y: 0, z: -5},
      texturesPaths: ['./res/meshes/obj/armor.png'],
      name: 'Armor',
      mesh: m.armor
    })
  }

  downloadMeshes(
    {armor: "./res/meshes/obj/armor.obj"},
    onLoadObj
  )
})

window.app = application