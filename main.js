import MatrixEngineWGPU from "./src/meWGPU";

let application = new MatrixEngineWGPU({ useSingleRenderPass: false }, () => {

  let c = {
    position: {x: -3, y: 0, z: -5},
    rotation: {x: 0, y: 45, z: 0},
    rotationSpeed: {x: 0, y: 0, z: 0},
    texturesPaths: ['./res/textures/rust.jpg']
  };

  let o = {
    position: {x: 3, y: 0, z: -10},
    rotation: {x: 0, y: 45, z: 0},
    rotationSpeed: {x: 0, y: 10, z: 0},
    texturesPaths: ['./res/textures/rust.jpg']
  };


  application.addBall(o)

  application.addCube(c)
  

})

window.app = application