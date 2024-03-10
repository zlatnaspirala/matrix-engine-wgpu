# matrix-wgpu 
## [underconstruct - not fully operative for now - deeply WIP]
## Author Nikola Lukic zlatnaspirala@gmail.com 2024


## Logo:

<img width="350" height="350" src="https://github.com/zlatnaspirala/matrix-engine-wgpu/blob/main/public/res/icons/512.png?raw=true" />

### In logo i used webGPU logo from:
<span>WebGPU logo by <a href="https://www.w3.org/"><abbr title="World Wide Web Consortium">W3C</abbr></a></span>.
The logos are licensed under Creative Commons Attribution 4.0 International.
Download from https://www.w3.org/2023/02/webgpu-logos.html

Used npm package `wgpu-matrix` for replacment of glmatrix library.

I publish (this repo) npm package with name `matrix-engine-wgpu`.


## Objective
  - scene objects feature [objects/scene/transformation]
  - Make it similar to the matrix-engine webGL features.

For now i will use `createRenderBundleEncoder` for multi object scene draws.


Main instance script:
```js
import MatrixEngineWGPU from "./src/meWGPU";
import {mesh} from "./src/engine/final/stanfordDragon";

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

  // application.addBall(o)
  application.addCube(c)
  application.addMesh({
    position: {x: 2, y: 0, z: -10},
    name: 'dragon',
    mesh: mesh
  });
})

window.app = application
```

Not the best solution but works for now.
Next level is draw in one scene different shaders different pipline...

System draws func:
```js
frame = () => {
    let commandEncoder = this.device.createCommandEncoder();
    this.rbContainer = [];

    let passEncoder;

    this.mainRenderBundle.forEach((meItem, index) => {
      meItem.draw();
      this.rbContainer.push(meItem.renderBundle)
      if(index == 0) passEncoder = commandEncoder.beginRenderPass(meItem.renderPassDescriptor);
    })

    // passEncoder.executeBundles([NIK.renderBundle, NIK2.renderBundle]);
    passEncoder.executeBundles(this.rbContainer);
    passEncoder.end();
    this.device.queue.submit([commandEncoder.finish()]);

    requestAnimationFrame(this.frame);
  }
```

## LICENCE

 - Structural shema for project and personal learning inspired by:
   https://webgpu.github.io/webgpu-samples/samples/renderBundles

### BSD 3-Clause 

https://github.com/webgpu/webgpu-samples/blob/main/LICENSE.txt

Copyright 2019 WebGPU Samples Contributors

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

   1. Redistributions of source code must retain the above copyright notice,
      this list of conditions and the following disclaimer.

   2. Redistributions in binary form must reproduce the above copyright notice,
      this list of conditions and the following disclaimer in the documentation
      and/or other materials provided with the distribution.

   3. Neither the name of the copyright holder nor the names of its
      contributors may be used to endorse or promote products derived from this
      software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
