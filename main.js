import MatrixEngineWGPU from "./src/world.js";
import {downloadMeshes} from './src/engine/loader-obj.js';

export let application = new MatrixEngineWGPU({
  useSingleRenderPass: false,
  canvasSize: 'fullscreen'
}, () => {
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
  }

  downloadMeshes({
    welcomeText: "./res/meshes/blender/piramyd.obj",
    armor: "./res/meshes/obj/armor.obj"
  }, onLoadObj)

})

window.app = application