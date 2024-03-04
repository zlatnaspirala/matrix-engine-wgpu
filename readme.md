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

I publish (this repo) npm package with name `matrix-wgpu`.


## Objective
  - scene objects feature [objects/scene/transformation]
  - Make it similar to the matrix-engine webGL features.

For now i will use `createRenderBundleEncoder` for multi object scene draws.

Main instance script:
```js
let application = new MatrixEngineWGPU(()=> {

  let o = {
    position: { x: 5, y: 2, z: -10}
  };

  application.addCube()
  application.addBall(o.position)

})
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

 - MIT LICENCE - Nikola Lukic zlatnaspirala@gmail.com 2024
 - Structural shema for project and personal learning inspired by:
   https://webgpu.github.io/webgpu-samples/samples/renderBundles
