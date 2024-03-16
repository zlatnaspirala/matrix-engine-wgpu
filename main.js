import MatrixEngineWGPU from "./src/world.js";
import {downloadMeshes} from './src/engine/loader-obj.js';

export let application = new MatrixEngineWGPU({
  useSingleRenderPass: false,
  canvasSize: 'fullscreen',
  mainCameraParams: {
    type: 'WASD',
    responseCoef: 1000
  }
}, () => {


  addEventListener('AmmoReady', () => {


    downloadMeshes({
      welcomeText: "./res/meshes/blender/piramyd.obj",
      armor: "./res/meshes/obj/armor.obj",
      lopta: "./res/meshes/blender/lopta.obj",
    }, onLoadObj)
  
  })


  function onLoadObj(m) {

    console.log('Loaded objs:', m);

    application.addMeshObj({
      position: {x: -3, y: 0, z: -5},
      rotation: {x: 0, y: 0, z: 0},
      rotationSpeed: {x: 0, y: 10, z: 0},
      texturesPaths: ['./res/meshes/obj/armor.png'],
      name: 'Armor',
      mesh: m.armor
    })

    application.addMeshObj({
      position: {x: 1, y: 0, z: -5},
      rotation: {x: -90, y: 0, z: 0},
      rotationSpeed: {x: 0, y: 0, z: 0},
      texturesPaths: ['./res/meshes/obj/armor.png'],
      name: 'MyText',
      mesh: m.welcomeText
    })

    application.addMeshObj({
      position: {x: 1, y: 0, z: -5},
      rotation: {x: -90, y: 0, z: 0},
      rotationSpeed: {x: 0, y: 0, z: 0},
      texturesPaths: ['./res/meshes/obj/armor.png'],
      name: 'Lopta-Fizika',
      mesh: m.lopta,
      physics:{ enabled: true }
    })
  }

  let o = {
    scale: 10,
    position: {x: 3, y: -12, z: -10},
    rotation: {x: 0, y: 0, z: 0},
    texturesPaths: ['./res/textures/rust.jpg']
  };
  // application.addCube(o)

})

window.app = application