
## CHANGES [Started from feb 2026]

[1.18.xx - 1.19.xx]
  - Added DragRotateController (corespond with WASD camera - rotate object on dragging),
    
  - Added code-creator AI driven by not for graphs 
   it is for code direct.
   Backend:
   `npm run creator-backend`
   Frontend:
   `npm run creator`
  Fixed worker cross origin problem with running.
  - Fix engine internal defaul dummy links to be public links from 
   https://unpkg.com/matrix-engine-wgpu@latest/public/

[1.16.xx - 1.17.xx]
 - Particle effect class added.
 - updated nui-commander project to have width/height for NUI area div.
 - Water simulation effect (part of effects sub system)
 - Add navigationMesh and followPath class/func to npm export/import
 - Add support for raw bvh (skeletal) implementation.
 - Added video chat/stream plane follow local player and remote player
   for MOBA template - Used streamPlaying to get video elements for networking.
 - Added nui-commander (from npm) and used in demo=31 
 - Added physics enabled for glb and glb instanced class.
 - Adding to the matterjs switch kinematic dinamic obj type - improve platforme template.
 - Adding new feature for app graph editor part - remove links on double click or right click, also hover effect.
 - Added plugin 'player object' now only fot FPShooter prototypes
 - Added zombie area (Hang3d series)
 - removeKeyboard for FirstPerson Camera
 - Splat class + animator for colors also vertex positions.
 - Visual scripting improvments in general + ai tool part.
 - MediaPipe implemented (hand model)
 - Test webRTC canvas capture to android TV  main instance for recceiver android-tv-cast.js/html
 - Added First person shooter example (hang3d series - the-beast-hang3d)
 - Base Position class changes, added `translateByXYZ`
 - Micro optimisation : define CulledRenderPass only if culling activated from begin.
 - Adding MatrixTTS to export/import npm services
 - Make npm services sync with 1.16.2
 - FORCE_FULL_SCREEN Only if (urlQ['fs']) - no more || isMobile()

[1.15.xx]
 - Added `npm install @google/generative-ai` like new ai tool provider.
 - Added `npm install @anthropic-ai/sdk` like new ai tool provider.
 - Graph part synced - improvment for ai tool - gen graphs
 - Jamb (yacht) game synced with last ver of core + mobile supported.
 - JOLT worker improved for OnContactRemoved and OnContactPersisted (detect) override fn's.
 - geo effects fixed for moba prepare
 - added Sprite2DPAck class
 - no default physics any more must be
   useAmmo, useJolt, useCannon or useMatter
 - Improved volumetric and light - range param
 - PlaneCamera added - with zoom , support for mobile 
 

[1.14.0]
 - Added HZB postproccesing effect
 - Light micro optimisations
 - canvas.requestPointerLock for FPS camera
 - Culling scene system not active by default - activate with arg `render: 'culling'`


[1.12.0]
 - CinematicCamera
 

[1.11.3]
 - Choose physics lib from editor (Create new project procedure)
 - Gizmo fixed for z axis


[1.11.2]
Added support for Volumetric Effects post-processing on all light types.

MAX_SPOTLIGHTS is now controlled via URL parameters or MECONFIG (arguments will override both if provided).

Optimized performance by removing the dedicated effect pipeline pass; it now utilizes the existing pass for transparent objects.

Improved visual aesthetics for all example scenes.

[1.11.0]
[Mobile Optimization]

Added Jolt Physics support.

Implemented a bridge for the Physics-to-Physics Worker communication.

Physics engine now runs in a Web Worker by default as of version 1.11.0.

Added multi-select node graph support for the App Graph (FluxCodexVertex).

Added Pinball demo to showcase Jolt physics integration.

Portable performance: All examples are now fully optimized for mobile devices.

[1.10.0]
New main loop logic
Not any more per mesh operation.

```js
this.mainRenderPassDesc.colorAttachments[0].view = this.sceneTextureView;
let pass = commandEncoder.beginRenderPass(this.mainRenderPassDesc);
for (const [pipeline, meshes] of this.opaqueBuckets) {
  pass.setPipeline(pipeline);
  for (const mesh of meshes) {
    mesh.drawElements(pass, this.lightContainer);
  }
}
for (const [pipeline, meshes] of this.transparentBuckets) {
  meshes.sort((a, b) => {
    const cam = this.getCamera();
    const da = vec3.distance(cam.position, a.position);
    const db = vec3.distance(cam.position, b.position);
    return db - da;
  });
  pass.setPipeline(pipeline);
  for (const mesh of meshes) {
    mesh.drawElements(pass, this.lightContainer);
  }
}
pass.end();
```

[1.9.12]
Ambient per mesh uniform added:
app.mainRenderBundle[1].setAmbient(0,10,10)

[1.9.11]

- Added full capacibility of ammojs shapes combined with matrix-engine proceduralMesh class.

```js
      case "Sphere": return this.addPhysicsSphere(MEObject, pOptions);
      case "Cube": return this.addPhysicsBox(MEObject, pOptions);
      case "Capsule": return this.addPhysicsCapsule(MEObject, pOptions);
      case "CapsuleX": return this.addPhysicsCapsuleX(MEObject, pOptions);
      case "CapsuleZ": return this.addPhysicsCapsuleZ(MEObject, pOptions);
      case "Cylinder": return this.addPhysicsCylinder(MEObject, pOptions);
      case "CylinderX": return this.addPhysicsCylinderX(MEObject, pOptions);
      case "CylinderZ": return this.addPhysicsCylinderZ(MEObject, pOptions);
      case "Cone": return this.addPhysicsCone(MEObject, pOptions);
      case "ConeX": return this.addPhysicsConeX(MEObject, pOptions);
      case "ConeZ": return this.addPhysicsConeZ(MEObject, pOptions);
      case "StaticPlane": return this.addPhysicsStaticPlane(MEObject, pOptions);
      case "ConvexHull": return this.addPhysicsConvexHull(MEObject, pOptions);
      case "BvhMesh": return this.addPhysicsBvhMesh(MEObject, pOptions);
      case "Compound": return this.addPhysicsCompound(MEObject, pOptions);
      case "Heightfield": return this.addPhysicsHeightfield(MEObject, pOptions);
```

- setUVScale (new in vertex shaders)

- New func:
  createCheckerboardTexture(device, size = 256, tileSize = 32, colorA = [255, 0, 0, 255], colorB = [255, 255, 255, 255])

- added MEConfig with default values and checking url params.
  Engine in future will be fully scaled from url params.
  For now working params:
  - PHYSICS_GROUND_Y
  - fs (force fullscreen only on first click/touch)
  - shadowSize

- BIG win for performance, from now all examples will be worked also on mobile devices.
  scene uniform buffer is global now.
  adding new input arg for main instance:

- Added overiride render variants

```js
this.overrideRender = null;
if (typeof options.render !== "undefined") {
  if (options.render == "zero") {
    this.overrideRender = zeroPass.bind(this);
  }
}
```

[1.9.10] More optimisation in main loop!

- Added options for sending arg to the volumetric activation func.

````js
{
  density: 0.03,
  steps: 32,
  scatterStrength: 1.2,
  heightFalloff: 0.08,
  lightColor: [1.0, 0.88, 0.65],
}
```

[1.9.9]  More optimises main loop
Multi light casting shadows on each other hot fix.


[1.9.6] Mobile render back HOT FIX
       Clear allocations from loop

[1.9.5]
### ProceduralMesh

```js
export const geoTypesForMorph = {
 cube: "cube",
 sphere: "sphere",
 mobius: "mobius",
 plane: "plane",
 capsule: "capsule",
 cone: "cone",
 torus: "torus",
 cylinder: "cylinder",
 wavePlane: "wavePlane",
 supershape: "supershape",
 pyramid: "pyramid",
 diamond: "diamond",
 icosahedron: "icosahedron",
 circlePlane: "circlePlane",
 rock: "rock",
 star: "star",
 star3d: "star3d",
 littleStar: "littleStar",
 flatStar: "flatStar",
 klein: "klein",
 shell: "shell",
 rippleSphere: "rippleSphere",
 twistedTorus: "twistedTorus",
 tornado: "tornado",
 galaxySpiral: "galaxySpiral",
};
````

Draw all buildin proceduralMesh shapes:

```js
const spacing = 3;
const keys = Object.keys(geoTypesForMorph);
let col = 0;
let row = 0;
for (let i = 0; i < keys.length - 1; i++) {
  const typeA = keys[i];
  const typeB = keys[i + 1];
  loadObjFile.addProceduralMeshObj({
    material: {type: "power"},
    position: {x: col * spacing - 5, y: 1, z: -15 + row * spacing},
    rotation: {x: 0, y: 0, z: 0},
    scale: [1, 1, 1],
    rotationSpeed: {x: 0, y: 0, z: 0},
    texturesPaths: ["./res/textures/cube-g1_low.webp"],
    meshA: MeshMorpher[typeA](1),
    meshB: MeshMorpher[typeB](1),
    name: `morph_${typeA}_to_${typeB}`,
    physics: {
      enabled: false,
      geometry: "Sphere",
    },
  });
  col++;
  if (col % 4 === 0) {
    row++;
    col = 0;
  }
}

// Also works - but tested just two cube.
// need to improve and est more
// let test = MeshMorpher.compose(
//   {shape: MeshMorpher.cube(1), offset: [-2, 0, 0]},
//   {shape: MeshMorpher.cube(1), offset: [2, 0, 0]},
// );

// loadObjFile.addProceduralMeshObj({
//     material: {type: 'power'},
//     position: {x: 0 , y: 5, z: -15},
//     rotation: {x: 0, y: 0, z: 0},
//     scale: [1, 1, 1],
//     rotationSpeed: {x: 0, y: 0, z: 0},
//     texturesPaths: ['./res/textures/cube-g1_low.webp'],
//     meshA: test,
//     meshB: test,
//     name: `morph_1`,
//     physics: {
//       enabled: false,
//       geometry: "Sphere"
//     }
//   });
```

Morph between two shapes

```js
sceneObject.morphTo(1.0, 2000, () => {
  /*callback*/
});

sceneObject.morphTo(0.0, 2000, () => {
  /*callback*/
});
```

[1.9.3]
No memory leaks

GC is basically dead in the last trace:
0.04% — 1 sample vs 0.8% (30 samples) in the first trace
All GC events are ENSURE_SWEEPING_COMPLETED and TIME_TO_SAFEPOINT — those are tiny background cleanup tasks, not real collection pauses, all under 0.06ms

Compare to first trace where you had full V8.GC_MC_BACKGROUND_MARKING (67.9ms) and V8.GCScavenger (7.7ms).
The scratch buffers (\_negQ1, \_emptyChannels) and the composeTRS zero-alloc rewrite killed it. GC is no longer a factor. ✅

[1.9.2]

- Add activateVolumetricEffect
  Note volumetric works only if bloom is activated. Bloom can work alone.
  To avoid createing bind group in loop

From claude suggestion:
`You are 100% right, I contradicted myself! Creating bind groups in the render loop is bad — it allocates GPU objects every frame.
  And your instinct is correct — just always enable bloom when volumetric is on. They naturally belong together anyway (god rays + bloom = 🔥).`

[1.9.1]

- Prevent double call media device for video tex in context of "run/stop graph".
- On "clearRuntime" :
  let getCurrentGIzmoObj = app.mainRenderBundle.filter((o) => o.effects.gizmoEffect && o.effects.gizmoEffect.enabled == false)
  getCurrentGIzmoObj[0].effects.gizmoEffect.enabled = true;
  On "runGraph"
  let getCurrentGIzmoObj = app.mainRenderBundle.filter((o) => o.effects.gizmoEffect && o.effects.gizmoEffect.enabled)
  getCurrentGIzmoObj[0].effects.gizmoEffect.enabled = false;

[1.9.0]

- Improved AI GEN graph tool:
  ✔️ Basic flow for AI Graph Generator - Simple tasks passed for now. [Open account/open source/free service quota](https://ollama.com/)
- Gimzo implementation.
- Added typedoc for auto gen api-docs.
- Added some default shader graph
- Optimised render loop GPU.

```js
// New ++++
this.mainRenderBundle.forEach((mesh, index) => {
  mesh.position.update();
  mesh.updateModelUniformBuffer();
  this.lightContainer.forEach(light => {
    light.update();
    mesh.getTransformationMatrix(this.mainRenderBundle, light, index);
  });
});
// Old ----
// for(const light of this.lightContainer) {
//   light.update()
//   this.mainRenderBundle.forEach((meItem, index) => {
//     meItem.position.update()
//     meItem.updateModelUniformBuffer()
//     meItem.getTransformationMatrix(this.mainRenderBundle, light, index)
//   })
// }

// Aboid creating bind group in loop
// +++
pass.setBindGroup(
  0,
  this.bloomPass.enabled === true ? this.bloomBindGroup : this.noBloomBindGroup,
);
```

- Added typedoc dev tool for documetation generation.

```js
{
  "$schema": "https://typedoc.org/schema.json",
  "entryPoints": ["index.js"],
  "out": "api-docs",
  "name": "Matrix Engine Api Documentation",
  "includeVersion": true,
  "searchInComments": true,

  "compilerOptions": {
    "allowJs": true,
    "checkJs": false,
    "module": "ESNext",
    "target": "ESNext",
    "lib": ["DOM", "ESNext"],
    "moduleResolution": "node"
  }
}

```
