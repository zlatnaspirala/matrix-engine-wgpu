
import {meWGPU} from "./src/me-gpu-world.js";


window.addEventListener('click', () => {
  // test

  meWGPU.addCubeTex2({
    scale: 0.5,
    positionX: 10
  })

  meWGPU.addCubeTex()


})

console.log('App level ... run1 ', meWGPU)
