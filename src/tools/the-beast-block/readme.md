# The Beast Block

A compact 3D blocking volume, level layout, and physics/asset metadata creator built for game engines.

- **Author:** Nikola Lukic (`zlatnaspirala@gmail.com`)
- **Built with:** Google AI Studio
- **Upstream Updates:** [https://github.com/zlatnaspirala/the-beast-block](https://github.com/zlatnaspirala/the-beast-block)
- **Distributed Into:** The Beast Engine — [https://github.com/zlatnaspirala/matrix-engine-wgpu](https://github.com/zlatnaspirala/matrix-engine-wgpu)
- **License:** [MIT](./LICENSE)

---

## Project Architecture & Distribution

**The Beast Block** is maintained as a standalone web application at [`zlatnaspirala/the-beast-block`](https://github.com/zlatnaspirala/the-beast-block) and distributed into **The Beast** WebGPU engine ([`zlatnaspirala/matrix-engine-wgpu`](https://github.com/zlatnaspirala/matrix-engine-wgpu)) as its map/collision blockout and scene volume authoring tool. All upstream tool updates originate in `the-beast-block`.

---

## Correlation with Mixamo.com Standards & The Beast Project

When authoring levels for **The Beast** (`matrix-engine-wgpu`) alongside **Mixamo.com** character rigs and animations, consistent coordinate space and scale alignment are critical:

1. **Coordinate System & Orientation (`Right-Handed Y-Up`, `XYZ` Euler)**
   - **The Beast Block** operates in a right-handed **Y-up** world (`+Y` up, `+X` right, `+Z` forward toward the viewer), matching WebGPU/glTF (`GLB`) and **Mixamo.com** upright character orientation (`Y-up` export standard).
   - Rotations are authored in degrees (`rotationDeg`) and exported alongside radians (`rotationRad`) in `XYZ` Euler order so `matrix-engine-wgpu` can consume transforms directly without axis swizzling.

2. **Natural `[-1, +1]` Unit Cube Space & Mixamo Scale Alignment**
   - Every base cube in **The Beast Block** spans `[-1, +1]` on each local axis (`2 × 2 × 2` world units at `scale: [1, 1, 1]`), meaning the volume `scale` equals its world **half-extents**.
   - **Mixamo.com** humanoid characters exported to glTF/GLB (`1 unit = 1 meter` in WebGPU/glTF pipelines, ~`1.7–1.85` units tall; or normalized from Mixamo FBX centimeter scale `0.01` inside `matrix-engine-wgpu`) align cleanly with blockout clearances:
     - `scale.y = 1.0` (`2.0` units tall): Standard doorway / character-height reference wall or trigger volume.
     - `scale.y = 0.5` (`1.0` unit tall): Waist-high FPS cover block for Mixamo rifle/pistol crouch & strafe poses.
     - `scale.y = 0.25` (`0.5` unit tall): Jumpable step, ramp ledge, or platform slab.
   - Keeping **The Beast Block** volumes, **Mixamo** character colliders (`Capsule` / `Cube` `meshType`), and `matrix-engine-wgpu` scene units aligned prevents floating characters, mismatched step heights, and scaled-root collision bugs.

3. **Asset & Physics Bridge to `matrix-engine-wgpu`**
   - **`obj` & `glb` Proxy Cubes:** Place lightweight colored cubes representing `.obj` (`./res/meshes/blender/cube.obj`) or `.glb` (`./res/meshes/glb/ring1.glb`) meshes with `filePath` and `texPath` (`./res/textures/blankgray2.webp`) metadata ready for The Beast asset loader.
   - **Material & Blending:** Every item carries `ambientColor` (`r`, `g`, `b`, default `0.5`), `isBlend`, and `blendAlpha` for engine shader/material setup.
   - **Physics Metadata:** Every item exports a `physics` block (`enabled`, `mass`, `group`, `meshType`) supporting `SoftBody`, `Cloth`, `Heightfield`, `Sphere`, `Cube`, `Capsule`, `Cylinder`, `Cone`, `ConvexHull`, and `BvhMesh`.

---

## Features

- **Volume & Proxy Item Types:**
  - `solid` — Standard solid collision geometry
  - `trigger` — Non-solid trigger / event zone
  - `clip` — Invisible Player Clip barrier (blocks player movement without visual geometry)
  - `hazard` — Damage / lava / kill volume
  - `obj` — Wavefront `.obj` mesh proxy with `filePath` & `texPath`
  - `glb` — glTF `.glb` mesh proxy with `filePath` & `texPath`
- **Drawing & Transform Tools:**
  - **Click**, **Drag**, **Move (Hover Paint)**, **Transform** (`G` Move / `R` Rotate / `S` Scale gizmos), and **Erase** modes.
  - Pre-placement **Brush** transform (`positionOffset`, `rotation`, `scale`), quick size presets, and ground grid snapping (`Free`, `0.25`, `0.5`, `1`, `2`).
- **Full Undo / Redo Stack:** Tracks placement, transforms, deletions, category switches, material/physics edits, and map imports (`Ctrl+Z` / `Ctrl+Y`).
- **Quake-Style Arena Presets:** Includes 4 large symmetric Quake-style arenas plus an asymmetric mission level (`Mission: Blackout Stronghold`).
- **JSON Export / Import (`blocking-volumes-v1`):** Copy, download, or import `.json` level layouts directly into **The Beast** engine.

---

## Export JSON Format (`blocking-volumes-v1`)

```json
{
  "format": "blocking-volumes-v1",
  "coordinateSpace": {
    "cubeLocalMin": [-1, -1, -1],
    "cubeLocalMax": [1, 1, 1],
    "cubeUnitSize": [2, 2, 2],
    "handedness": "right-handed-y-up",
    "rotationOrder": "XYZ"
  },
  "count": 1,
  "volumes": [
    {
      "id": "vol_1",
      "name": "Block 01",
      "category": "glb",
      "position": [0, 1, 0],
      "rotationDeg": [0, 0, 0],
      "rotationRad": [0, 0, 0],
      "scale": [1, 1, 1],
      "halfExtents": [1, 1, 1],
      "localMin": [-1, -1, -1],
      "localMax": [1, 1, 1],
      "ambientColor": { "r": 0.5, "g": 0.5, "b": 0.5 },
      "isBlend": false,
      "blendAlpha": 0.5,
      "physics": {
        "enabled": false,
        "mass": 0,
        "group": 1,
        "meshType": "Cube"
      },
      "filePath": "./res/meshes/glb/ring1.glb",
      "texPath": "./res/textures/blankgray2.webp"
    }
  ]
}
```

---

## Development

```bash
npm install
npm run dev      # Start dev server on port 3000
npm run lint     # Type-check with tsc --noEmit
npm run build    # Production build to dist/
```
