## CHANGES [Started from feb 2026]



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
  - fs                  (force fullscreen only on first click/touch)
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
