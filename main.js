import MatrixEngineWGPU from "./src/meWGPU";

let application = new MatrixEngineWGPU(()=> {

  let c = {
    position: { x: -5, y: 3, z: -10}
  };

  let o = {
    position: { x: 5, y: 2, z: -10}
  };

  application.addCube(c)
  application.addBall(o)

})

window.app = application