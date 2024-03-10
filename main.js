import MatrixEngineWGPU from "./src/meWGPU";

import dragon from "./public/res/meshes/dragon/dragon";
import {mesh} from "./src/engine/final/stanfordDragon";

let application = new MatrixEngineWGPU({ 
  useSingleRenderPass: true,
  canvasSize: 'fullscreen' }, () => {

    console.log('application.mainCameraParams' , application.mainCameraParams);

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



  // application.addBall(o)
  application.addCube(c)
  application.addMesh({
    position: {x: 2, y: 0, z: -10},
    name: 'dragon',
    mesh: mesh
  });


  // application.addCube(o)
})

window.app = application