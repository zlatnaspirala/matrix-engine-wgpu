import MatrixEngineWGPU from "../src/meWGPU";

export let application = new MatrixEngineWGPU({
  useSingleRenderPass: false,
  canvasSize: 'fullscreen'
}, () => {

  let c = {
    scale: 2,
    position: {x: -3, y: 0, z: -10},
    rotation: {x: 0, y: 0, z: 0},
    rotationSpeed: {x: 10, y: 0, z: 0},
    texturesPaths: ['./res/textures/rust.jpg']
  };

  let o = {
    scale: 2,
    position: {x: 3, y: 0, z: -10},
    rotation: {x: 0, y: 45, z: 0},
    rotationSpeed: {x: 0, y: 10, z: 0},
    texturesPaths: ['./res/textures/rust.jpg']
  };
  application.addBall(c)
  application.addCube(o)
})

window.app = application