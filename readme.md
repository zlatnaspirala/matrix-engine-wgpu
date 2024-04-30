# matrix-engine-wgpu
## [not fully operative for now - WIP]
## Author Nikola Lukic zlatnaspirala@gmail.com 2024

## Logo:

<img width="320" height="320" src="https://github.com/zlatnaspirala/matrix-engine-wgpu/blob/main/public/res/icons/512.png?raw=true" />

### In logo i used webGPU logo from:

<span>WebGPU logo by <a href="https://www.w3.org/"><abbr title="World Wide Web Consortium">W3C</abbr></a></span>.
The logos are licensed under Creative Commons Attribution 4.0 International.
Download from https://www.w3.org/2023/02/webgpu-logos.html

Used npm package `wgpu-matrix` for replacment of glmatrix library.Classis "modelViewProjectionMatrix" calculations.
I publish (this repo) npm package with name `matrix-engine-wgpu`.

## Objective

- scene objects feature [objects/scene/transformation] ✔️
- Make it similar to the matrix-engine webGL features.
- Main base example is `shadowMapping` from [webgpu-samples](https://webgpu.github.io/webgpu-samples/?sample=shadowMapping)
- Integrate ammojs [basic cube]✔️

## Support list

### SCENE/APP
- Everytime you run program make new canvas from code.No need to have canvas in html file.

- Only access to the object scene instance look like:
  `mainRenderBundle` is scene holder.
  ```js
  app.mainRenderBundle[0];
  ```

  - For now only `addMeshObj` works [Obj file loader].
  You can use unlitTextures simpliest pipline with addCube, addBall. See in examples...

- Destroy current/runned program and make free space for next app...
  [This function stops render and remove canvas]
 ```js
 app.destroyProgram()
 ```

### Camera

Camera type: `WASD | arcball`
```js
  mainCameraParams: {
    type: 'WASD',
    responseCoef: 1000
  }
```

### Position [YT video - use position from console](https://www.youtube.com/watch?v=cipic7hkN7o&ab_channel=javascriptfanatic)
#### app.mainRenderBundle[0] -> position

Position is taken from matrix-engine[webgl] same struct.
```js
app.mainRenderBundle[0].position.translateByX(12);
```

Teleport/ direct set
```js
app.mainRenderBundle[0].position.SetX(-2);
```

Change speed of translation
```js
app.mainRenderBundle[0].position.thrust = 0.1;
```

####Note: Position for Physics enabled object look like:
No working `.position` and `.rotation` in physics enabled regime but you can read it.
You must use Ammo body funcs like : applyForce, setAngularVelocity, setLinearVelocity etc...
```js
app.matrixAmmo.rigidBodies[0].setAngularVelocity(new Ammo.btVector3(0,2,0))
app.matrixAmmo.rigidBodies[0].setLinearVelocity(new Ammo.btVector3(0,7,0))
```

### Rotation
#### app.mainRenderBundle[0].rotation

Rotate object by axis by degree:
```js
app.mainRenderBundle[0].rotation.x = 45
```

Active rotation
```js
app.mainRenderBundle[0].rotation.rotationSpeed.y = 10
```

Stop rotating
```js
app.mainRenderBundle[0].rotation.rotationSpeed.y = 0
```

#### Note: In physics enabled object `.rotation.x y z` have no affect.

## Camera manipulation examples

 ```js
 app.cameras.WASD.pitch = 0.2
 ```


## How to load obj [with uvs] file:
Main instance script:
```js
import MatrixEngineWGPU from "./src/world.js";
import {downloadMeshes} from './src/engine/loader-obj.js';
import {LOG_FUNNY, LOG_INFO, LOG_MATRIX} from "./src/engine/utils.js";

export let application = new MatrixEngineWGPU({
  useSingleRenderPass: true,
  canvasSize: 'fullscreen',
  mainCameraParams: {
    type: 'WASD',
    responseCoef: 1000
  }
}, () => {

  addEventListener('AmmoReady', () => {
    downloadMeshes({
      welcomeText: "./res/meshes/blender/piramyd.obj",
      armor: "./res/meshes/obj/armor.obj",
      sphere: "./res/meshes/blender/sphere.obj",
      cube: "./res/meshes/blender/cube.obj",
    }, onLoadObj)
  })

  function onLoadObj(m) {
    application.myLoadedMeshes = m;
    for(var key in m) {
      console.log(`%c Loaded objs: ${key} `, LOG_MATRIX);
    }

    application.addMeshObj({
      position: {x: 0, y: 2, z: -10},
      rotation: {x: 0, y: 0, z: 0},
      rotationSpeed: {x: 0, y: 0, z: 0},
      texturesPaths: ['./res/meshes/blender/cube.png'],
      name: 'CubePhysics',
      mesh: m.cube,
      physics: {
        enabled: true,
        geometry: "Cube"
      }
    })

    application.addMeshObj({
      position: {x: 0, y: 2, z: -10},
      rotation: {x: 0, y: 0, z: 0},
      rotationSpeed: {x: 0, y: 0, z: 0},
      texturesPaths: ['./res/meshes/blender/cube.png'],
      name: 'SpherePhysics',
      mesh: m.sphere,
      physics: {
        enabled: true,
        geometry: "Sphere"
      }
    })
  }
})

window.app = application
```

## NPM Scripts

Bundle compiler: `watchify`

```js
  "main-worker": "watchify app-worker.js -p [esmify --noImplicitAny] -o public/app-worker.js",
  "examples": "watchify examples.js -p [esmify --noImplicitAny] -o public/examples.js",
  "main": "watchify main.js -p [esmify --noImplicitAny] -o public/app.js",
  "build-empty": "watchify empty.js -p [esmify --noImplicitAny] -o public/empty.js",
  "build-all": "npm run main-worker.js | npm run examples | npm run main | npm run build-empty"
```

1. "main-worker" use same endpoint but with root wrapper.
2. "examples" for now build just one current (just import script from ./examples/) instance.
3. "main" this is build for main.js main instance.
4. "build-empty" when you wanna use this engine on codepen or stackoverflow just build one empty instance
   and you can write megpu code.
5. "build-all" build all at once [every output is diff name].

## Resource

- Resources place is ./public also this folder is root for output js builds,
  after all you get all needed stuff in one public folder (www).

## Proof of concept
  - Main example will be 🎲 Ultimate Yahtzee game.

## LINKS

- How to use it on codepen
  https://codepen.io/zlatnaspirala/pen/VwNKMar?editors=0011
  I use empty build then i add/upload to my VPS public server you can use it:
  Usually last night build stable/unstable version.
  https://maximumroulette.com/apps/megpu/empty.js
  You can build your own with `npm run build-empty`.

## LICENCE

### Note:

"Just keep this text also any other about textual file / or code commnet with ref...
and you can sell or what ever you want with your project."

- Structural shema for project and personal learning inspired by:
  https://webgpu.github.io/webgpu-samples/samples/renderBundles also
  https://webgpu.github.io/webgpu-samples/?sample=shadowMapping

- Obj loader [same like matrix-engine webgl engine]
  Obj loader source http://math.hws.edu/graphicsbook/source/webgl/cube-camera.html

### BSD 3-Clause

https://github.com/webgpu/webgpu-samples/blob/main/LICENSE.txt

Copyright 2019 WebGPU Samples Contributors

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

1.  Redistributions of source code must retain the above copyright notice,
    this list of conditions and the following disclaimer.

2.  Redistributions in binary form must reproduce the above copyright notice,
    this list of conditions and the following disclaimer in the documentation
    and/or other materials provided with the distribution.

3.  Neither the name of the copyright holder nor the names of its
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
