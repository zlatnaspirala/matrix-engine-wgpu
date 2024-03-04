import MatrixEngineWGPU from "./src/meWGPU";

let application = new MatrixEngineWGPU(()=> {

  let o = {
    position: { x: 5, y: 2, z: -10}
  };

  application.addCube()
  application.addBall(o.position)

})

window.app = application