# matrix-engine-wgpu

**Author:** Nikola Lukić
📧 [zlatnaspirala@gmail.com](mailto:zlatnaspirala@gmail.com)
📅 2025

---

## Logo

<img width="320" height="320" src="https://github.com/zlatnaspirala/matrix-engine-wgpu/blob/main/public/res/icons/512.png?raw=true" />

> Logo includes the official WebGPU logo.
> **WebGPU logo by [W3C](https://www.w3.org/)**
> Licensed under [Creative Commons Attribution 4.0](https://www.w3.org/2023/02/webgpu-logos.html)

---

## Description

This project is a work-in-progress WebGPU engine inspired by the original **matrix-engine** for WebGL.
It uses the `wgpu-matrix` npm package as a modern replacement for `gl-matrix` to handle model-view-projection matrices.

Published on npm as: **`matrix-engine-wgpu`**

---

## Goals

* ✔️ Support for 3D objects and scene transformations
* 🎯 Replicate matrix-engine (WebGL) features
* 📦 Based on the `shadowMapping` sample from [webgpu-samples](https://webgpu.github.io/webgpu-samples/?sample=shadowMapping)
* ✔️ Ammo.js physics integration (basic cube)

---

## Features

### Scene Management

* Canvas is dynamically created in JavaScript—no `<canvas>` element needed in HTML.

* Access the main scene objects:

  ```js
  app.mainRenderBundle[0];
  ```

* Add meshes with `.addMeshObj()`, supporting `.obj` loading, unlit textures, cubes, spheres, etc.

* Cleanly destroy the scene:

  ```js
  app.destroyProgram();
  ```

---

### Camera Options

Supported types: `WASD`, `arcball`

```js
mainCameraParams: {
  type: 'WASD',
  responseCoef: 1000
}
```

---

### Object Positioning

Control object position:

```js
app.mainRenderBundle[0].position.translateByX(12);
```

Teleport / set directly:

```js
app.mainRenderBundle[0].position.SetX(-2);
```

Adjust movement speed:

```js
app.mainRenderBundle[0].position.thrust = 0.1;
```

> ⚠️ For physics-enabled objects, use Ammo.js functions — `.position` and `.rotation` are not visually applied but can be read.

Example:

```js
app.matrixAmmo.rigidBodies[0].setAngularVelocity(new Ammo.btVector3(0, 2, 0));
app.matrixAmmo.rigidBodies[0].setLinearVelocity(new Ammo.btVector3(0, 7, 0));
```

---

### Object Rotation

Manual rotation:

```js
app.mainRenderBundle[0].rotation.x = 45;
```

Auto-rotate:

```js
app.mainRenderBundle[0].rotation.rotationSpeed.y = 10;
```

Stop rotation:

```js
app.mainRenderBundle[0].rotation.rotationSpeed.y = 0;
```

> ⚠️ For physics-enabled objects, use Ammo.js methods (e.g., `.setLinearVelocity()`).

---

### Camera Example

Manipulate WASD camera:

```js
app.cameras.WASD.pitch = 0.2;
```

---

## Object Interaction (Raycasting)

The raycast returns:

```js
{
  rayOrigin: [x, y, z],
  rayDirection: [x, y, z] // normalized
}
```

Manual raycast example:

```js
window.addEventListener('click', (event) => {
  let canvas = document.querySelector('canvas');
  let camera = app.cameras.WASD;
  const { rayOrigin, rayDirection } = getRayFromMouse(event, canvas, camera);

  for (const object of app.mainRenderBundle) {
    if (rayIntersectsSphere(rayOrigin, rayDirection, object.position, object.raycast.radius)) {
      console.log('Object clicked:', object.name);
    }
  }
});
```

Automatic raycast listener:

```js
addRaycastListener();

window.addEventListener('ray.hit.event', (event) => {
  console.log('Ray hit:', event.detail.hitObject);
});
```

---

## How to Load `.obj` Models

```js
import MatrixEngineWGPU from "./src/world.js";
import { downloadMeshes } from './src/engine/loader-obj.js';

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
    }, onLoadObj);
  });

  function onLoadObj(meshes) {
    application.myLoadedMeshes = meshes;
    for (const key in meshes) {
      console.log(`%c Loaded obj: ${key} `, LOG_MATRIX);
    }

    application.addMeshObj({
      position: {x: 0, y: 2, z: -10},
      rotation: {x: 0, y: 0, z: 0},
      rotationSpeed: {x: 0, y: 0, z: 0},
      texturesPaths: ['./res/meshes/blender/cube.png'],
      name: 'CubePhysics',
      mesh: meshes.cube,
      physics: {
        enabled: true,
        geometry: "Cube"
      }
    });

    application.addMeshObj({
      position: {x: 0, y: 2, z: -10},
      rotation: {x: 0, y: 0, z: 0},
      rotationSpeed: {x: 0, y: 0, z: 0},
      texturesPaths: ['./res/meshes/blender/cube.png'],
      name: 'SpherePhysics',
      mesh: meshes.sphere,
      physics: {
        enabled: true,
        geometry: "Sphere"
      }
    });
  }
});

window.app = application;
```


## 🔁 Load OBJ Sequence Animation

This example shows how to load and animate a sequence of .obj files to simulate mesh-based animation (e.g. walking character).

js
Copy
Edit
import MatrixEngineWGPU from "../src/world.js";
import { downloadMeshes, makeObjSeqArg } from "../src/engine/loader-obj.js";
import { LOG_MATRIX } from "../src/engine/utils.js";

export var loadObjsSequence = function () {
  let loadObjFile = new MatrixEngineWGPU({
    useSingleRenderPass: true,
    canvasSize: "fullscreen",
    mainCameraParams: {
      type: "WASD",
      responseCoef: 1000,
    },
  }, () => {

    addEventListener("AmmoReady", () => {
      downloadMeshes(
        makeObjSeqArg({
          id: "swat-walk-pistol",
          path: "res/meshes/objs-sequence/swat-walk-pistol",
          from: 1,
          to: 20,
        }),
        onLoadObj,
        { scale: [10, 10, 10] }
      );
    });

    function onLoadObj(m) {
      console.log(`%c Loaded objs: ${m} `, LOG_MATRIX);
      var objAnim = {
        id: "swat-walk-pistol",
        meshList: m,
        currentAni: 1,
        animations: {
          active: "walk",
          walk: { from: 1, to: 20, speed: 3 },
          walkPistol: { from: 36, to: 60, speed: 3 },
        },
      };

      loadObjFile.addMeshObj({
        position: { x: 0, y: 2, z: -10 },
        rotation: { x: 0, y: 0, z: 0 },
        rotationSpeed: { x: 0, y: 0, z: 0 },
        scale: [100, 100, 100],
        texturesPaths: ["./res/meshes/blender/cube.png"],
        name: "swat",
        mesh: m["swat-walk-pistol"],
        physics: {
          enabled: false,
          geometry: "Cube",
        },
        objAnim: objAnim,
      });

      app.mainRenderBundle[0].objAnim.play("walk");
    }
  });

  window.app = loadObjFile;
};

### 📽️ Preview

## @Note
If this happen less then 15 times (Loading procces) then it is ok probably...
```warn
Draw func (err):TypeError: Failed to execute 'beginRenderPass' on 'GPUCommandEncoder': The provided value is not of type 'GPURenderPassDescriptor'.
```

## @Note
I act according to the fact that there is only one canvas element on the page.

## About URLParams
Buildin Url Param check for multiLang.
```js
    urlQuery.lang
```

---

## About `main.js`

`main.js` is the main instance for the Ultimate Yahtzee game template.
It contains the game context, e.g., `dices`.

For a clean startup without extra logic, use `empty.js`.
This minimal build is ideal for online editors like CodePen or StackOverflow snippets.

---

## NPM Scripts

Uses `watchify` to bundle JavaScript.

```json
"main-worker": "watchify app-worker.js -p [esmify --noImplicitAny] -o public/app-worker.js",
"examples": "watchify examples.js -p [esmify --noImplicitAny] -o public/examples.js",
"main": "watchify main.js -p [esmify --noImplicitAny] -o public/app.js",
"empty": "watchify empty.js -p [esmify --noImplicitAny] -o public/empty.js",
"build-all": "npm run main-worker && npm run examples && npm run main && npm run build-empty"
```

---

## Resources

All resources and output go into the `./public` folder — everything you need in one place.
This is static file storage.

---

## Proof of Concept

🎲 The first full app example will be a WebGPU-powered **Ultimate Yahtzee** game.

---

## Live Demos & Dev Links

* [Jamb WebGPU Demo (WIP)](https://maximumroulette.com/apps/webgpu/)
* [CodePen Demo](https://codepen.io/zlatnaspirala/pen/VwNKMar?editors=0011)
  → Uses `empty.js` build from:
  [https://maximumroulette.com/apps/megpu/empty.js](https://maximumroulette.com/apps/megpu/empty.js)
* [CodeSandbox Implementation](https://codesandbox.io/p/github/zlatnaspirala/matrix-engine-wgpu/main?file=%2Fpackage.json%3A14%2C16)
* 📘 Learning Resource: [WebGPU Ray Tracing](https://maierfelix.github.io/2020-01-13-webgpu-ray-tracing/)

---

## License

### Usage Note

You may use, modify, and sell projects based on this code — just keep this notice and included references intact.

---

### Attribution & Credits

* Engine design and scene structure inspired by:
  [WebGPU Samples](https://webgpu.github.io/webgpu-samples/?sample=shadowMapping)
* OBJ Loader adapted from:
  [http://math.hws.edu/graphicsbook/source/webgl/cube-camera.html](http://math.hws.edu/graphicsbook/source/webgl/cube-camera.html)
* Dice roll sound `roll1.wav` sourced from:
  [https://wavbvkery.com/dice-rolling-sound/](https://wavbvkery.com/dice-rolling-sound/)
* Raycasting logic assisted by ChatGPT

---

### BSD 3-Clause License (from WebGPU Samples)

[Full License Text](https://github.com/webgpu/webgpu-samples/blob/main/LICENSE.txt)

Top level main.js instance (Ultimate Yahtzee)

---