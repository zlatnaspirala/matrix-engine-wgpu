## CHANGES [Started from feb 2026]

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
