import MatrixEngineWGPU from "../src/world.js";
import {downloadMeshes} from '../src/engine/loader-obj.js';

export let application = new MatrixEngineWGPU({
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
  application.addCube(o)

  function onLoadObj(m) {
    console.log('Loaded obj:', m.armor);
    // console.log('APP2 ', jsonPiramyd);
    // jsonPiramyd.vertexNormals = jsonPiramyd.normals;
    // jsonPiramyd.indices = jsonPiramyd.faces;
    // jsonPiramyd.textures = jsonPiramyd.uvs;
    application.addMeshObj({
      position: {x: 0, y: 0, z: -5},
      texturesPaths: ['./res/meshes/obj/armor.png'],
      name: 'Armor',
      mesh:  m.armor
    })
  }

  // downloadMeshes({armor: "./res/meshes/obj/armor.obj"}, onLoadObj)
  downloadMeshes({armor: "./res/meshes/blender/piramyd.obj"}, onLoadObj)
})

window.app = application