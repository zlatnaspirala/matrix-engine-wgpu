import MatrixEngineWGPU from "../src/world.js";

export var unlitTextures = function() {
  let unlitTextures = new MatrixEngineWGPU({
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
      rotation: {x: 0, y: 0, z: 0},
      rotationSpeed: {x: 10, y: 0, z: 0},
      texturesPaths: ['./res/textures/default.png']
    };
    unlitTextures.addCube(o)
    
    unlitTextures.addBall(c)
    
  })

  window.app = unlitTextures;

}