# matrix-engine-wgpu

**Author:** Nikola Lukić
📧 [zlatnaspirala@gmail.com](mailto:zlatnaspirala@gmail.com)
📅 Version: 1.6.0             2025

---

## Logo

<img width="320" height="320" src="https://github.com/zlatnaspirala/matrix-engine-wgpu/blob/main/public/res/icons/512.png?raw=true" />

> Logo includes the official WebGPU logo.
> **WebGPU logo by [W3C](https://www.w3.org/)**
> Licensed under [Creative Commons Attribution 4.0](https://www.w3.org/2023/02/webgpu-logos.html)

---

## Description

This project is a work-in-progress WebGPU engine inspired by the original **matrix-engine** for WebGL.
It uses the `wgpu-matrix` npm package as a replacement for `gl-matrix` to handle model-view-projection matrices.

Published on npm as: **`matrix-engine-wgpu`**

---

## Goals

- ✔️ Support for 3D objects and scene transformations
- 🎯 Replicate matrix-engine (WebGL) features
- 📦 Based on the `shadowMapping` sample from [webgpu-samples](https://webgpu.github.io/webgpu-samples/?sample=shadowMapping)
- ✔️ Ammo.js physics full integration

---

## Features

### Scene Management

- Canvas is dynamically created in JavaScript—no `<canvas>` element needed in HTML.

- Access the main scene objects:

  ```js
  app.mainRenderBundle[0];
  ```

  or by name:

  ```js
  app.getSceneObjectByName("Sphere1");
  ```

- Add meshes with `.addMeshObj()`, supporting `.obj` loading, unlit textures, cubes, spheres, etc.

- Cleanly destroy the scene:

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

### Object Position

Best way for access physics body object:
app.matrixAmmo.getBodyByName(name)
also app.matrixAmmo.getNameByBody

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

### 3D Camera Example

Manipulate WASD camera:

```js
app.cameras.WASD.pitch = 0.2;
```

---

💡 Lighting System

Matrix Engine WGPU now supports independent light entities, meaning lights are no longer tied to the camera. You can freely place and configure lights in the scene, and they will affect objects based on their type and parameters.

Supported Light Types

SpotLight – Emits light in a cone shape with configurable cutoff angles.

(Planned: PointLight, DirectionalLight, AmbientLight)

Features

✅ Supports multiple lights (4 max), ~20 for next update.
✅ Shadow-ready (spotlight0 shadows implemented, extendable to others)

```json
## Important Required to be added manual:
```

```js
engine.addLight();
```

Access lights with array lightContainer:

```js
app.lightContainer[0];
```

Small behavior object.
 - For now just one ocs0 object
 Everytime if called than updated (light.position[0] = light.behavior.setPath0())
  behavior.setOsc0(min, max, step);
  app.lightContainer[0].behavior.osc0.on_maximum_value = function() {/* what ever*/};
  app.lightContainer[0].behavior.osc0.on_minimum_value = function() {/* what ever*/};

Make light move by x.
```js
loadObjFile.addLight();
loadObjFile.lightContainer[0].behavior.setOsc0(-1, 1, 0.01);
loadObjFile.lightContainer[0].behavior.value_ = -1;
loadObjFile.lightContainer[0].updater.push(light => {
  light.position[0] = light.behavior.setPath0();
});
```

### Materials
 With last glb feature materials become part of engine also.

material: {type: 'standard'}
material: {type: 'pong'}
material: {type: 'power'}

 - Standard is fully supported with lights shadow cast down (not for anims yet)
 - Pong 
 - Power - no shadows cast

```js
// Also for addMeshObj
TEST_ANIM.addGlbObj({
material: {type: 'power'},
...
}, null, glbFile);
```


### Object Interaction (Raycasting)

The raycast returns:

```js
{
  rayOrigin: [x, y, z],
  rayDirection: [x, y, z] // normalized
}
```

Manual raycast example:

```js
window.addEventListener("click", event => {
  let canvas = document.querySelector("canvas");
  let camera = app.cameras.WASD;
  const {rayOrigin, rayDirection} = getRayFromMouse(event, canvas, camera);

  for (const object of app.mainRenderBundle) {
    if (
      rayIntersectsSphere(
        rayOrigin,
        rayDirection,
        object.position,
        object.raycast.radius
      )
    ) {
      console.log("Object clicked:", object.name);
    }
  }
});
```

Automatic raycast listener:

```js
addRaycastListener();

// Must be app.canvas or [Program name].canvas
app.canvas.addEventListener("ray.hit.event", event => {
  console.log("Ray hit:", event.detail.hitObject);
});
```

Engine also exports (box):

- addRaycastsAABBListener
- rayIntersectsAABB,
- computeAABB,
- computeWorldVertsAndAABB,

---

### How to Load `.obj` Models

```js
import MatrixEngineWGPU from "./src/world.js";
import {downloadMeshes} from "./src/engine/loader-obj.js";

export let application = new MatrixEngineWGPU(
  {
    useSingleRenderPass: true,
    canvasSize: "fullscreen",
    mainCameraParams: {
      type: "WASD",
      responseCoef: 1000,
    },
  },
  () => {
    addEventListener("AmmoReady", () => {
      downloadMeshes(
        {
          welcomeText: "./res/meshes/blender/piramyd.obj",
          armor: "./res/meshes/obj/armor.obj",
          sphere: "./res/meshes/blender/sphere.obj",
          cube: "./res/meshes/blender/cube.obj",
        },
        onLoadObj
      );
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
        texturesPaths: ["./res/meshes/blender/cube.png"],
        name: "CubePhysics",
        mesh: meshes.cube,
        physics: {
          enabled: true,
          geometry: "Cube",
        },
      });

      application.addMeshObj({
        position: {x: 0, y: 2, z: -10},
        rotation: {x: 0, y: 0, z: 0},
        rotationSpeed: {x: 0, y: 0, z: 0},
        texturesPaths: ["./res/meshes/blender/cube.png"],
        name: "SpherePhysics",
        mesh: meshes.sphere,
        physics: {
          enabled: true,
          geometry: "Sphere",
        },
      });
    }
  }
);

window.app = application;
```

### 🔁 Load OBJ Sequence Animation

This example shows how to load and animate a sequence of .obj files to simulate mesh-based animation (e.g. walking character).

```js
import MatrixEngineWGPU from "../src/world.js";
import {downloadMeshes, makeObjSeqArg} from "../src/engine/loader-obj.js";
import {LOG_MATRIX} from "../src/engine/utils.js";

export var loadObjsSequence = function () {
  let loadObjFile = new MatrixEngineWGPU(
    {
      useSingleRenderPass: true,
      canvasSize: "fullscreen",
      mainCameraParams: {
        type: "WASD",
        responseCoef: 1000,
      },
    },
    () => {
      addEventListener("AmmoReady", () => {
        downloadMeshes(
          makeObjSeqArg({
            id: "swat-walk-pistol",
            path: "res/meshes/objs-sequence/swat-walk-pistol",
            from: 1,
            to: 20,
          }),
          onLoadObj,
          {scale: [10, 10, 10]}
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
            walk: {from: 1, to: 20, speed: 3},
            walkPistol: {from: 36, to: 60, speed: 3},
          },
        };

        loadObjFile.addMeshObj({
          position: {x: 0, y: 2, z: -10},
          rotation: {x: 0, y: 0, z: 0},
          rotationSpeed: {x: 0, y: 0, z: 0},
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
    }
  );

  window.app = loadObjFile;
};
```

💡 GLB binary loading bvh(rig)animations.
 - See examples glb-loader.js (build with npm run glb-loader)
 - Next update materials improvements!
 - Light affect just for first frame or t-pose.
 - For npm service import uploadGLBModel.

From 1.6.0 glb support multi skinned mesh + mutli primitives cases.

Limitation:
glb loader not handled for non animation case. Use obj loader for static mesh.

Must powerfull call is new class MEMeshObjInstances.
MEMeshObj is good now for optimised call(less conditionals).
You can add instanced draws and modify basic color for each individualy also 
transformation good for fantazy or any game dev.

Example:
```js
   var glbFile01 = await fetch(p).then(res => res.arrayBuffer().then(buf => uploadGLBModel(buf, this.core.device)));
      this.core.addGlbObjInctance({
        material: {type: 'standard', useTextureFromGlb: true},
        scale: [20, 20, 20],
        position: {x: 0, y: -4, z: -220},
        name: this.name,
        texturesPaths: ['./res/meshes/glb/textures/mutant_origin.png'],
        raycast: {enabled: true, radius: 1.5},
        pointerEffect: {enabled: true}
      }, null, glbFile01);

// access  - index -0 is BASE MESH ! I added maxLimit = 5 you can change this from engine source.
// added lepr smoot translate , also color+.
app.mainRenderBundle[1].instanceTargets[1].position[2] = 10;
// This recreate buffer it is not for loop call space 
app.mainRenderBundle[1].updateInstances(5)
```


### 📽️ Video textures

```js
TEST.loadVideoTexture({
  type: "video", // video , camera  //not tested canvas2d, canvas2dinline
  src: "res/videos/tunel.mp4",
});
```

For canvasinline attach this to arg (example for direct draw on canvas2d and passing intro webgpu pipeline):

```js
canvaInlineProgram: (ctx, canvas) => {
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "white";
  ctx.font = "20px Orbitron";
  ctx.fillText(`FPS: ${Math.round(performance.now() % 60)}`, 10, 30);
};
```

<pre>
| Scenario                       | Best Approach                      |
| ------------------------------ | ---------------------------------- |
| Dynamic 2D canvas animation    | `canvas.captureStream()` → `video` |
| Static canvas snapshot         | `createImageBitmap(canvas)`        |
| Replaying real video or webcam | Direct `video` element             |
</pre>

### Note

If this happen less then 15 times (Loading procces) then it is ok probably...

```json
Draw func (err):TypeError: Failed to execute 'beginRenderPass' on 'GPUCommandEncoder': The provided value is not of type 'GPURenderPassDescriptor'.
```

### Note VideoTexture

It is possible for 1 or 2 warn in middle time when mesh switch to the videoTexture.
Will be fixxed in next update.

```js
Dimension (TextureViewDimension::e2DArray) of [TextureView of Texture "shadowTextureArray[GLOBAL] num of light 1"] doesn't match the expected dimension (TextureViewDimension::e2D).
```

## About URLParams

Buildin Url Param check for multiLang.

```js
urlQuery.lang;
```

---

## About `main.js`

`main.js` is the main instance for the jamb 3d deluxe game template.
It contains the game context, e.g., `dices`.

What ever you find here onder main.js is open source part.
Next level of upgrade is commercial part.

For a clean startup without extra logic, use `empty.js`.
This minimal build is ideal for online editors like CodePen or StackOverflow snippets.

<img width="860" height="640" src="https://github.com/zlatnaspirala/matrix-engine-wgpu/blob/main/non-project-files/3d-jamb.png?raw=true" />

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

🎲 The first full app example will be a WebGPU-powered **Jamb 3d deluxe** game.


## RPG game WIP

  Features done:
   - Navigation mesh
   - Hero class
   - GLB animations

<img width="860" height="640" src="https://github.com/zlatnaspirala/matrix-engine-wgpu/blob/main/non-project-files/RPG.png?raw=true" />

---

## Live Demos & Dev Links

- [Jamb WebGPU Demo (WIP)](https://maximumroulette.com/apps/webgpu/)
  Support on https://goldenspiral.itch.io/jamb-3d-deluxe
- [CodePen Demo](https://codepen.io/zlatnaspirala/pen/VwNKMar?editors=0011)
  → Uses `empty.js` build from:
  [https://maximumroulette.com/apps/megpu/empty.js](https://maximumroulette.com/apps/megpu/empty.js)
- [CodeSandbox Implementation](https://codesandbox.io/p/github/zlatnaspirala/matrix-engine-wgpu/main?file=%2Fpackage.json%3A14%2C16)
- 📘 Learning Resource: [WebGPU Ray Tracing](https://maierfelix.github.io/2020-01-13-webgpu-ray-tracing/)
- 💲 Commercial part: [3d-jamb](https://goldenspiral.itch.io/jamb-3d-deluxe)

---

Performance for Jamb game: 

<img width="860" height="640" src="https://github.com/zlatnaspirala/matrix-engine-wgpu/blob/main/non-project-files/performance.png?raw=true" />


## License

### Usage Note

You may use, modify, and sell projects based on this code — just keep this notice and included references intact.

---

### Attribution & Credits

- Engine design and scene structure inspired by:
  [WebGPU Samples](https://webgpu.github.io/webgpu-samples/?sample=shadowMapping)
- OBJ Loader adapted from:
  [http://math.hws.edu/graphicsbook/source/webgl/cube-camera.html](http://math.hws.edu/graphicsbook/source/webgl/cube-camera.html)
- Dice roll sound `roll1.wav` sourced from:
  [https://wavbvkery.com/dice-rolling-sound/](https://wavbvkery.com/dice-rolling-sound/)
- Raycasting logic and glb loader assisted by ChatGPT.
- GLTF Loader: https://github.com/Twinklebear/webgpu-gltf, improved with chatgpt.
- Music by <a href="https://pixabay.com/users/mfcc-28627740/?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=274290">Mykola Sosin</a> from <a href="https://pixabay.com//?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=274290">Pixabay</a>
- Characters used from great mixamo.com
  -✅What you can do
  You can use Mixamo characters and animations royalty-free in commercial, personal, or non‑profit projects (games, films, prints, etc.).You own your creations / how you use them.No requirement to credit Adobe / Mixamo (though allowed).
  -🚫What you cannot do
  You cannot redistribute or sell the raw Mixamo character or animation files “as is” (i.e. as standalone assets) to others.You can’t use Mixamo content to create a competing library of characters / animations (i.e. you can’t just package them and sell them to others).
  You can’t use Mixamo’s content (or outputs) to train AI / machine learning models.

 - Used free assets from great https://craftpix.net
   Magic icons : https://craftpix.net/freebies/free-rpg-splash-game-512x512-icons/

 - For background music in rpg template used:
   Music by <a href="https://pixabay.com/users/sonican-38947841/?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=379413">Dvir Silverstone</a> from <a href="https://pixabay.com//?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=379413">Pixabay</a>
   Sound Effect by <a href="https://pixabay.com/users/freesound_crunchpixstudio-49769582/?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=384915">Crunchpix Studio</a> from <a href="https://pixabay.com//?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=384915">Pixabay</a>
   Music by <a href="https://pixabay.com/users/emmraan-24732583/?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=280277">Emmraan</a> from <a href="https://pixabay.com//?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=280277">Pixabay</a>
---

### BSD 3-Clause License (from WebGPU Samples)

[Full License Text](https://github.com/webgpu/webgpu-samples/blob/main/LICENSE.txt)

Top level main.js instance (Jamb 3d deluxe)

---
