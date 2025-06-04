Here's an improved version of your `README.md`, written in clearer and more natural English while preserving all technical details and your original intent:

---

# matrix-engine-wgpu

**⚠️ Work in Progress – Not Fully Functional Yet**

**Author:** Nikola Lukić
📧 [zlatnaspirala@gmail.com](mailto:zlatnaspirala@gmail.com)
📅 2024

---

## Logo

<img width="320" height="320" src="https://github.com/zlatnaspirala/matrix-engine-wgpu/blob/main/public/res/icons/512.png?raw=true" />

> Logo includes the official WebGPU logo.
> **WebGPU logo by [W3C](https://www.w3.org/)**
> Licensed under [Creative Commons Attribution 4.0](https://www.w3.org/2023/02/webgpu-logos.html)

---

## Description

This project is a work-in-progress WebGPU engine inspired by the original **matrix-engine** for WebGL.
It uses the `wgpu-matrix` npm package as a modern replacement for `gl-matrix` for handling model-view-projection matrices.

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

* A canvas is dynamically created in JavaScript — no `<canvas>` in HTML required.

* Access the main scene using:

  ```js
  app.mainRenderBundle[0];
  ```

* Add meshes using `.addMeshObj()`
  (Supports `.obj` loading, unlit textures, cubes, spheres, etc.)

* Cleanly destroy the current scene:

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

Control object position with:

```js
app.mainRenderBundle[0].position.translateByX(12);
```

Teleport / Direct set:

```js
app.mainRenderBundle[0].position.SetX(-2);
```

Change movement speed:

```js
app.mainRenderBundle[0].position.thrust = 0.1;
```

> ⚠️ For physics-enabled objects, use Ammo.js functions.
> `.position` and `.rotation` won't apply visually but can be read.

Example:

```js
app.matrixAmmo.rigidBodies[0].setAngularVelocity(new Ammo.btVector3(0, 2, 0));
app.matrixAmmo.rigidBodies[0].setLinearVelocity(new Ammo.btVector3(0, 7, 0));
```

---

### Object Rotation

Rotate manually:

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

> ⚠️ Same note as position: `.rotation.x/y/z` has no effect for physics-enabled objects.

---

### Camera Example

Manipulate WASD camera:

```js
app.cameras.WASD.pitch = 0.2;
```

---

## Object Interaction (Raycasting)

Manual raycast:

```js
window.addEventListener('click', (event) => {
  let canvas = document.querySelector('canvas');
  let camera = app.cameras.WASD;
  const { rayOrigin, rayDirection } = getRayFromMouse(event, canvas, camera);

  for (const object of app.mainRenderBundle) {
    if (rayIntersectsSphere(rayOrigin, rayDirection, object.position, 2)) {
      console.log('Object clicked:', object.name);
    }
  }
});
```

Automatic raycast:

```js
addRaycastListener();
window.addEventListener('ray.hit.event', (event) => {
  console.log(event.detail);
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

Script summary:

1. `main-worker`: For core instance with root wrapper.
2. `examples`: Current example build from `./examples/`.
3. `main`: Main project build (YAMB).
4. `empty`: Build minimal setup for environments like CodePen or StackOverflow.
5. `build-all`: Run all the above builds at once.

---

## Resources

* All resources and output go into `./public` — a single folder with everything you need.

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

* 📘 Learning Resource:
  [WebGPU Ray Tracing](https://maierfelix.github.io/2020-01-13-webgpu-ray-tracing/)

---

## License

### Usage Note

> You may use, modify, and even sell your project with this code — just keep this notice and any included references in place.

---

### Attribution & Credits

* Engine design and scene structure inspired by:
  [WebGPU Samples](https://webgpu.github.io/webgpu-samples/?sample=shadowMapping)

* OBJ Loader adapted from:
  [http://math.hws.edu/graphicsbook/source/webgl/cube-camera.html](http://math.hws.edu/graphicsbook/source/webgl/cube-camera.html)

* Dice roll sound `roll1.wav` sourced from:
  [https://wavbvkery.com/dice-rolling-sound/](https://wavbvkery.com/dice-rolling-sound/)

---

### BSD 3-Clause License (from WebGPU Samples)

[Full License Text](https://github.com/webgpu/webgpu-samples/blob/main/LICENSE.txt)

---

