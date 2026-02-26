# matrix-engine-wgpu

**Author:** Nikola Lukić
📧 [zlatnaspirala@gmail.com](mailto:zlatnaspirala@gmail.com)
📅 Version: 1.9.2 2026

---

## Logo

<img width="320" height="320" src="https://github.com/zlatnaspirala/matrix-engine-wgpu/blob/main/public/res/icons/512.png?raw=true" />

> Logo includes the official WebGPU logo.
> **WebGPU logo by [W3C](https://www.w3.org/)**
> Licensed under [Creative Commons Attribution 4.0](https://www.w3.org/2023/02/webgpu-logos.html)

---

## Description

This project is a `stable` but also `work-in-progress` WebGPU engine inspired by the original **matrix-engine** for WebGL.
It uses the `wgpu-matrix` npm package as a replacement for `gl-matrix` to handle model-view-projection matrices.

Published on npm as: **`matrix-engine-wgpu`**

Backend editor support list:
Only for windows (linux must be adapted paths rule)
 - Chrome    - desktop [windows]
 - Firefox   - desktop [windows]
 - Edge      - desktop [windows]
 - Opera     - desktop [windows]

---

## Done list []

- ✔️ Support for 3D objects and scene transformations
- ✔️ Ammo.js physics integration
- ✔️ Networking with Kurento/OpenVidu/Own middleware Nodejs -> frontend
- ✔️ Bloom post processing
- 📦 Based on the `shadowMapping` sample from [webgpu-samples](https://webgpu.github.io/webgpu-samples/?sample=shadowMapping)
- ✔️ Web GUI(online) Editor [app exec graph] with Visual Scripting (Named: FlowCodexVertex)
- ✔️ Web GUI(online) Editor [shader graph] with Visual Scripting (Named: FlowCodexShader)
- ✔️ Dynamic shadow cast (done also for skinned meshes)
- ✔️ VertexShader displacment (done also for skinned meshes), nice for water effect
- ✔️ Basic flow for AI Graph Generator - Simple tasks passed for now with ollama platform. [Open account/open-source/free-service-quota](https://ollama.com/)
- ✔️ Trace from V8.GC_MC_BACKGROUND_MARKING (67.9ms) to V8.GCScavenger (7.7ms).
     GC is no longer a factor. ✅

## Roadmap

- (Preparing API DOCs)[https://github.com/zlatnaspirala/matrix-engine-wgpu/wiki/Visual-Scripting-API]
- 🎯 Test linux OS -> Editor creates and manages files internally (Windows tested only!)
- 🎯 Add editor nav arrows in editor mode
- 🎯 Test others physics libraries [same interface/drive system]
- 🎯 Sync npm version and make editor posible from `npm i matrix-engine-wgpu`
- 🎯 Sync npm version for matrix-engine-wgpu wrapper (me-webgpu-react)[https://github.com/zlatnaspirala/me-webgpu-react]


## FluxCodexVertex Web Graph Editor 🚀 (since version 1.8.0)

EditorX has **two main parts**:
- **Frontend** (`./src/tools/editor`)
- **Backend** (`./src/tools/editor/backend`)

> **Before running anything**, install dependencies with `npm i`:
>
> - in the **root** folder
> - and also inside `./src/tools/editor/backend`

The backend is built using **Node.js** 🟢

---

## General Features 🧩

- Editor creates and manages files internally (Windows tested only!).
- Scene container [adding objs -> auto save]
- SceneObject property container [selected object] [auto save]
- Assets toolbar added (bottom panel)
  - Add **GLB** or **OBJ** files (also mp3) from the asset toolbox by selecting them.
- Top menu for adding primitives (Cube / Sphere) with or without physics ⚙️
- Integrated Visual Scripting system 🧠 FluxCodexVertex for program exec flow.
- Integrated Visual Scripting system 🧠 FluxCodexShader for shader.

---

## Visual Scripting – Implemented Features ✅

- Add **Math nodes**, **events / custom methods**, **variable popup**, **SceneObject access**
- Get SceneObject → set position → bind `onTargetReach` events
- SetTexture, setMaterial, 
- Fetch, GetArray, forEach, Print, IF, Math, compare, string operation etc...
- Custom func editor - Function Manager after creating use it from visual scripting.
- Generator physics bodies in sequence pos in choosen geometry in world pos (Pyramid, wall, in place).
- onDraw Event node - called on every frame.Can be multiply used and set skip value. More skip less calls.
- Audio reactive node Audio to pos , rot, scale or geometry or any... Outputs low, mid, high, energy and beat.
- Run the graph ▶️
- Stop the graph Just basic - clear dinamic created object and stops onDraw calls.
- Save graph
  - Saved to file direct also cached on **LocalStorage**
  - For final builds, becomes a real **JS object** injected into the app flow.[DONE]
- Export graph to **JSON**
- Import graph from **JSON**
- [Experimental] Generate graphs with ai tools services First working graph done with ollama platform.
  You need to open account on ollama platform for free quota service. Get API key and add it
  to the aitool config file (src\tools\editor\backend\config.js) Backend Config.js is in git ignored list.
  If you need to create it use this format:
  ```js
  export const aiConfig = {
    ollama: '***********',
    qrok: '************'
  }
  ```
  For now i create graphs with simple tasks.
  In future it will be able to create whole scenes or simple games.

---

### ⚠️ Important Notes

Visual Scripting is only available when running the engine **from source**  
(not from `npm i matrix-engine-wgpu`).

You must clone or download the engine source from the **GitHub repository**.

---

### Instructions 📌

Editor use esbuild compiler but still present browserify, both works perfect.

- Run the editor with:

```bash
npm run editorx
```

from the engine root directory.
EditorX is an alias for FluxCodexVertex backend part (needed three words to keep the name unique)
Run the scene by pressing F6 or by clicking Run in the left panel
If you delete all objects from the scene, you must refresh the page and add at least one object again
Before importing a graph, delete all nodes from the FluxCodexVertex graph
After deleting everything, click Save to store an empty [] array.
All changes in graph must be saved manually/clicking for now 💾 (no autosave for graphs).

<img width="860" height="640" src="https://github.com/zlatnaspirala/matrix-engine-wgpu/blob/main/non-project-files/visual-scripting-fetch.png?raw=true" />

---


## Api documentation

Live :
https://maximumroulette.com/apps/webgpu/api-docs/


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

- Destroy sceneObj:
  ```js
  app.removeSceneObjectByName("Sphere1");
  ```
- Also interest for clearing physics body and render part:

  ```js

  app.destroyByPrefix("towers");
  // OR
  app.destroyBySufix("_001");
  // Destroy objects become true after calling flushDestroyQueue function.
  app.flushDestroyQueue();
  ```

- Cleanly destroy the scene:
  ```js
  app.destroyProgram();
  ```

---

### Camera Options

For now translation is only with `WASD` keyboard keys.

Supported types: `WASD`, `arcball`

`WASD` also use 'c' and 'v' for up and down camera position.

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
  app.lightContainer[0].behavior.osc0.on*maximum_value = function() {/* what ever*/};
  app.lightContainer[0].behavior.osc0.on_minimum_value = function() {/* what ever\_/};

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
```js
material: {type: 'standard'}
material: {type: 'pong'}
material: {type: 'power'}
material: {type: 'water'}
material: {type: 'metal'}
material: {type: 'mirror'}
```

- Standard is fully supported with lights shadow cast down (not for anims yet)
- Pong
- Power - no shadows cast
- Mirror is env map. If you use mirror you must pass arg

```js
// Also for addMeshObj
TEST_ANIM.addGlbObj({
  material: {type: 'power'},
...
}, null, glbFile);


// Mirror example
TEST_ANIM.addGlbObj({
  material: {type: 'mirror'},
  envMapParams: {
    baseColorMix: 0.55,
    mirrorTint: [0.9, 0.95, 1.0],     // Slight cool tint
    reflectivity: 0.95,               // 25% reflection blend
    illuminateColor: [0.3, 0.7, 1.0], // Soft cyan
    illuminateStrength: 0.1,          // Gentle rim
    illuminatePulse: 0.001,           // No pulse (static)
    fresnelPower: 5.0,                // Medium-sharp edge
    envLodBias: 2.5,
    usePlanarReflection: false,       // ✅ FOr now only false - Env map mode
  },
...
}, null, glbFile);
```

- Mirror mat update params In runtime:
```js
// Access some object with mirror mat
app.mainRenderBundle[5].writeParamsMirror(
  {
    baseColorMix: 0.9,
    mirrorTint: [0.9, 0.95, 1.0],
    reflectivity: 0.25,
    illuminateColor: [1.3, 0.7, 1.0],
    illuminateStrength: 11.4,
    illuminatePulse: 1.1,
    fresnelPower: 2.50,
    envLodBias: 2.5,
    usePlanarReflection: false,
  }
)
```

- Change only textures (no recreation of pipeline)

```js
await app.mainRenderBundle[0].loadTex0(["res/icons/editor/chatgpt-gen-bg.png"]);
app.mainRenderBundle[0].changeTexture(app.mainRenderBundle[0].texture0);
```

- Setup Blend (For water mat use blend!)
```js
app.mainRenderBundle[0].setBlend(0.5);
```

Examples for setup water params:
```js
app.mainRenderBundle[0].updateWaterParams(
  [0.0, 0.1, 0.3],      // Deep: navy
  [0.2, 0.6, 0.9],      // Shallow: blue
  2.0,                   // Wave speed: fast continuous
  1.8,                   // Wave scale: rolling waves
  0.5,                   // Wave height: tall active waves
  1.5,                   // Fresnel: strong
  50.0                   // Specular: soft highlights
);

app.mainRenderBundle[0].updateWaterParams(
  [0.0, 0.3, 0.5],      // Deep: medium blue
  [0.3, 0.8, 1.0],      // Shallow: bright cyan
  1.2,                   // Wave speed: gentle continuous (changed from 0.6)
  2.5,                   // Wave scale: smooth ripples (changed from 5.0)
  0.3,                   // Wave height: visible movement
  2.5,                   // Fresnel: moderate reflection
  100.0                  // Specular: sharp sparkles
);
```

### Effect (Standalone pipeline draw subsystem)
Activation for prebuild(buildin) effects
```js

TEST_ANIM.addGlbObj({
...
pointerEffect: {
  enabled: true,
  flameEffect: true,
  flameEmitter: true,
},
...
}, null, glbFile);

// Access in runtime :
// app.mainRenderBundle[0].effects
```

### Bloom post processing

Activete with :

```js
app.activateBloomEffect();
```

Manipulate with `app.bloomPass`:
setKnee
setIntensity
setThreshold
setBlurRadius

Fancy results:
<img src="https://github.com/zlatnaspirala/matrix-engine-wgpu/blob/main/non-project-files/bloom.png?raw=true" />

### Volumetric effect

In [1.9.2] added `activateVolumetricEffect`
  !Note volumetric works only if bloom is activated. Bloom can work alone.
  !To avoid createing bind group in loop. 


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
var glbFile01 = await fetch(p).then(res =>
  res.arrayBuffer().then(buf => uploadGLBModel(buf, this.core.device))
);
this.core.addGlbObjInctance(
  {
    material: {type: "standard", useTextureFromGlb: true},
    scale: [20, 20, 20],
    position: {x: 0, y: -4, z: -220},
    name: this.name,
    texturesPaths: ["./res/meshes/glb/textures/mutant_origin.png"],
    raycast: {enabled: true, radius: 1.5},
    pointerEffect: {enabled: true},
  },
  null,
  glbFile01
);

// access  - index -0 is BASE MESH ! I added maxLimit = 5 you can change this from engine source.
// added lepr smoot translate , also color+.
app.mainRenderBundle[1].instanceTargets[1].position[2] = 10;
// This recreate buffer it is not for loop call space
app.mainRenderBundle[1].updateInstances(5);
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

### Networking

From 1.7.0 engine powered by networking. Used kurento&Openvidu server for backend.
Very good for handling streams, channels etc...

See example code at `./examples/games/rpg/`

Buildin net sync basic:
Lets say app is engine root object and net is networking object.
webRTC tech with openvidu server middleware server

```js
app.net = new MatrixStream({
  active: true,
  domain: "maximumroulette.com",
  port: 2020,
  sessionName: "forestOfHollowBlood-free-for-all",
  resolution: "160x240",
  isDataOnly: urlQuery.camera || urlQuery.audio ? false : true,
  customData: forestOfHollowBlood.player.data,
});

// `customData` if you wanna pass some extra meta data on connection-created event
// No need always camera and mic we can use is like data signaling only.
```

How to use buildin network operations:

```js
// Activate emiting remote position, on remote side adapted on scene object with same name
sceneObject.position.netObject = sceneObject[0].name;
// For now net view for rot is axis separated - cost is ok for orientaion remote pass
sceneObject.rotation.emitY = sceneObject.name;
// If you need oposite remote/local situation. For example:
// you friendly object is enemy object at remote machine that just setup another flag
sceneObject.position.netObject = sceneObject[0].name; // we still need this setup!
sceneObject.position.remoteName = sceneObjecOposite[0].name;
```

Use toRemote arg prop in send pass, if not it is default [] emit to all.

Intelegent emit for teams (two teams implemented).
Position will be emited for teams[0] and received for uniq scene obj name.
Position will be emited for teams[1] and received for oposite (eg. enemy) uniq scene obj name.
In this case toRemote is overrided (Don't pass it).
Used for RPGMOG project.

```js
mesh.position.teams[0] = [connId0, connId1];
mesh.position.teams[1] = [connId2, connId3];

// emiter in core engine file
if (this.teams.length > 0)
  if (this.teams[0].length > 0)
    app.net.send({
      toRemote: this.teams[0], // default null remote conns
      sceneName: this.netObject, // origin scene name to receive
      netPos: {x: this.x, y: this.y, z: this.z},
    });
if (this.teams.length > 0)
  if (this.teams[1].length > 0)
    app.net.send({
      toRemote: this.teams[1], // default null remote conns
      remoteName: this.remoteName, // to enemy players
      sceneName: this.netObject, // now not important
      netPos: {x: this.x, y: this.y, z: this.z},
    });
```

### About URLParams

Buildin Url Param check for multiLang. MultiLang feature is also buildin options.

Load multilang json file data.

- ?lang=en

Access from code:

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

## MOBA game Beta version done

Features done:

- Navigation mesh
- Hero class
- GLB animations
- Automatic team selection (South vs North)
- Homebase stone (tron / enemytron)
- Invertory (construct from 2 or 3 new upgraded item)

<img width="860" height="640" src="https://github.com/zlatnaspirala/matrix-engine-wgpu/blob/main/non-project-files/mmorpg-online-game.png?raw=true" />
<img width="860" height="640" src="https://github.com/zlatnaspirala/matrix-engine-wgpu/blob/main/non-project-files/mmorpg-online-game2.png?raw=true" />
<img width="860" height="640" src="https://github.com/zlatnaspirala/matrix-engine-wgpu/blob/main/non-project-files/mmorpg-online-game3.png?raw=true" />
<img width="860" height="640" src="https://github.com/zlatnaspirala/matrix-engine-wgpu/blob/main/non-project-files/mmorpg-online-game4.png?raw=true" />

Install it on your desktop with one click.
<img width="860" height="640" src="https://github.com/zlatnaspirala/matrix-engine-wgpu/blob/main/non-project-files/mmorpg-online-game5.png?raw=true" />

[Invest in Forest Of Hollow Blood 9,660$](https://goldenspiral.itch.io/forest-of-hollow-blood)
See more details at [FOHB Wiki](https://github.com/zlatnaspirala/matrix-engine-wgpu/wiki/Support-the-Future-of-Forest-of-Hollow-Blood)

---

## Live Demos & Dev Links

- [Matrix-engine-wgpu Live demos](https://maximumroulette.com/apps/webgpu/examples.html)
- 💲💲💲 Support JAMB 3D this project on [itch.io](https://goldenspiral.itch.io/jamb-3d-deluxe)
- [MOBA Forest Of Hollow Blood Live](https://maximumroulette.com/apps/webgpu/examples.html)

  <img width="860" height="640" src="https://github.com/zlatnaspirala/matrix-engine-wgpu/blob/main/non-project-files/RPG.png?raw=true" />

- [CodePen Demo](https://codepen.io/zlatnaspirala/pen/VwNKMar?editors=0011)
  → Uses `empty.js` build from:
  [https://maximumroulette.com/apps/megpu/empty.js](https://maximumroulette.com/apps/megpu/empty.js)
- [CodeSandbox Implementation](https://codesandbox.io/p/github/zlatnaspirala/matrix-engine-wgpu/main?file=%2Fpackage.json%3A14%2C16)

---

Performance for Jamb game:

<img width="860" height="640" src="https://github.com/zlatnaspirala/matrix-engine-wgpu/blob/main/non-project-files/performance.png?raw=true" />

Special licence for MOBA example:
```
Creative Commons Attribution 4.0 International (CC BY 4.0)

You are free to share and adapt this project, provided that you give appropriate credit.
Attribution requirement:
Include the following notice (with working link) in any distributed version or about page:

"Forest Of Hollow Blood — an MOBA example made with MatrixEngineWGPU (https://github.com/zlatnaspirala/matrix-engine-wgpu)"

```

## Web Editor FluxCodexVertex from version [1.8.0]

Run editor

```js
npm run editorx
```

Navigate to `matrix-engine.html` it is landing page for editor.
After create new project or load project page will be redirect to
`./public/<PROJECT_NAME>.html`
Source location : `./projects/<PROJECT_NAME>`

Features :

- Create new project/ load project - only on landing page
- Create cubeMesh
- Properties box for selected sceneObj
- Events system (Create func and attach to sceneObj)
- Resource navigation
- Visual Scripting

  <img width="860" height="640" src="https://github.com/zlatnaspirala/matrix-engine-wgpu/blob/main/non-project-files/visual-scripting-math.png?raw=true" />

@Note
License for fluxCodexVertex.js (MPL 2.0)
Affect only this file! Just leave comment licence part in header of file.

YT video promotion :

About 'In fly' regime:
Editor can be activated even without backend node but in that case no
saves.

## License && Credits

### Usage Note

You may use, modify, and sell projects based on this code — just keep this notice and included references intact (whole licence paragraph).
- Most important is reference on matrix-engine-wgpu.
- You need just to copy paste this text to about form on your web page or any other type of app.
- You can remove almost all licence for assets if you remove current assest from your project

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

- Music used: BLACK FLY by Audionautix | http://audionautix.com
  Music promoted by https://www.free-stock-music.com
  Creative Commons Attribution-ShareAlike 3.0 Unported

- Used free assets from great https://craftpix.net
  Magic icons : https://craftpix.net/freebies/free-rpg-splash-game-512x512-icons/

- For background music in rpg template used:
  Music by <a href="https://pixabay.com/users/sonican-38947841/?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=379413">Dvir Silverstone</a> from <a href="https://pixabay.com//?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=379413">Pixabay</a>
  Sound Effect by <a href="https://pixabay.com/users/freesound_crunchpixstudio-49769582/?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=384915">Crunchpix Studio</a> from <a href="https://pixabay.com//?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=384915">Pixabay</a>
  Music by <a href="https://pixabay.com/users/emmraan-24732583/?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=280277">Emmraan</a> from <a href="https://pixabay.com//?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=280277">Pixabay</a>

  'Ruined rock fence' (https://skfb.ly/6RLwN) by VladNeko is licensed under Creative Commons Attribution (http://creativecommons.org/licenses/by/4.0/).

  // test
  "fantasy rock" (https://skfb.ly/oHXAz) by duckcracker02 is licensed under Creative Commons Attribution (http://creativecommons.org/licenses/by/4.0/).

  "Fantasy Rock" (https://skfb.ly/oHZSq) by lalune is licensed under Creative Commons Attribution (http://creativecommons.org/licenses/by/4.0/).

  Invertory images
  https://djinnbestiary.itch.io/ancient-oddities-vol-1-13-free-potions

---

### BSD 3-Clause License (from WebGPU Samples)

[Full License Text](https://github.com/webgpu/webgpu-samples/blob/main/LICENSE.txt)

Top level main.js instance (Jamb 3d deluxe)

---

## 📘 Learning Resource:
 [WebGPU Ray Tracing](https://maierfelix.github.io/2020-01-13-webgpu-ray-tracing/)
  ChatGPT , claude ai
