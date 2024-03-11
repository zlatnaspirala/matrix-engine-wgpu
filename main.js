import MatrixEngineWGPU from "./src/meWGPU";

import {adaptJSON1} from "./src/engine/final/adaptJSON1.js";
import stanfordDragonData from "./public/res/meshes/dragon/stanfordDragonData.js"
import {testCUSTOMGEO} from "./public/res/meshes/blender/piramida.js";
import {downloadMeshes} from './src/engine/loader-obj.js';

let application = new MatrixEngineWGPU({ 
  useSingleRenderPass: true,
  canvasSize: 'fullscreen' }, () => {

  let c = {
    scale: 12,
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

  // testCUSTOMGEO
  let mesh = adaptJSON1(stanfordDragonData)
  //  application.addBall(o)
  // console.log('APP ', testCUSTOMGEO);
  // testCUSTOMGEO.positions = testCUSTOMGEO.vertices
  // testCUSTOMGEO.triangles = testCUSTOMGEO.faces;
  // testCUSTOMGEO.cells = testCUSTOMGEO.vertices;
  // testCUSTOMGEO.uvs = testCUSTOMGEO.normals;
  // console.log('APP ', testCUSTOMGEO)
  // testCUSTOMGEO = adaptJSON1(testCUSTOMGEO)

  function onLoadObj (m) {
    console.log('TES LOADING OBJ', m)
  }
  downloadMeshes(
    {armor: "./res/meshes/obj/armor.obj"},
    onLoadObj
  );

  application.addCube(c)

  application.addMesh({
    position: {x: 2, y: 0, z: -120},
    name: 'dragon',
    mesh: mesh
  });

  //  application.addCube(o)
})

window.app = application