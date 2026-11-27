# The Beast Animator (`the-beast-nui-animator`)

Browser-based Natural User Interface (NUI) motion capture studio that converts live webcam video, uploaded video tracks, and 478-point MediaPipe Face Mesh streams into **Mixamo-compatible `.bvh`** and **multi-animation `.glb`** files ready for **The Beast Engine (`matrix-engine-wgpu`)**, **Blender**, **Three.js**, and **Mixamo (`mixamo.com`)** pipelines.

Created by **Nikola Lukic** (`zlatnaspirala@gmail.com`) with **Google AI Studio**.

---

## Project Ecosystem & Distribution

- **Standalone Application & Upstream Updates:**
  [`https://github.com/zlatnaspirala/the-beast-nui-animator`](https://github.com/zlatnaspirala/the-beast-nui-animator)
  This repository is the standalone NUI motion-capture studio where new tracking, retargeting, recording, and export features are developed and maintained.
- **Engine Distribution Target (`matrix-engine-wgpu` / The Beast Project):**
  [`https://github.com/zlatnaspirala/matrix-engine-wgpu`](https://github.com/zlatnaspirala/matrix-engine-wgpu)
  Compiled builds and exported `.glb` / `.bvh` assets from this standalone tool are distributed into The Beast WebGPU engine (`matrix-engine-wgpu`), directly targeting its `uploadGLBModel()` and `BVHPlayerInstances` runtime animation pipeline.

---

## Correlation with Mixamo (`mixamo.com`) Standards & The Beast Engine

The Beast Animator is engineered around the **Adobe Mixamo (`mixamo.com`)** humanoid skeleton standard so animations recorded in the browser transfer cleanly without bone-mapping rewrites:

1. **Canonical 22-Bone Mixamo T-Pose Hierarchy:**
   - **Spine & Head:** `Hips` (root at `0.96m`) → `Spine` → `Spine1` → `Spine2` → `Neck` → `Head`
   - **Left Arm:** `LeftShoulder` → `LeftArm` → `LeftForeArm` → `LeftHand`
   - **Right Arm:** `RightShoulder` → `RightArm` → `RightForeArm` → `RightHand`
   - **Left Leg:** `LeftUpLeg` → `LeftLeg` → `LeftFoot` → `LeftToeBase`
   - **Right Leg:** `RightUpLeg` → `RightLeg` → `RightFoot` → `RightToeBase`
2. **Selectable Bone Naming Schemes:**
   - `mixamorig:Hips` (standard Mixamo FBX / glTF convention)
   - `mixamorigHips` (namespace-free Mixamo variant)
   - `Hips` (clean BVH standard)
3. **Custom Mixamo `.GLB` Retargeting:**
   You can upload any Mixamo-rigged `.glb`/`.gltf` character exported from `mixamo.com` or Blender. The retargeter resolves `restLocalQuaternions`, `restWorldQuaternions`, and optional facial morph targets (`FACIAL_BLENDSHAPES`) automatically so live MediaPipe pose & facial captures drive your custom character and export back out with baked animations.
4. **The Beast Engine (`matrix-engine-wgpu`) Compatibility Guarantee:**
   All exported `.glb` assets (both Mixamo body rigs and rigged MediaPipe Face Mesh exports) conform to both glTF 2.0 and `matrix-engine-wgpu`'s `BVHPlayerInstances` WebGPU loader requirements:
   - Indexed **triangle meshes** (`mode: 4`) with `UNSIGNED_SHORT` indices and normalized `NORMAL` attributes
   - `UNSIGNED_SHORT` (`5123`) `JOINTS_0` and normalized `WEIGHTS_0` skinning attributes
   - Explicit `TEXCOORD_0` UVs with embedded `DataTexture` base-color / tessellation atlases
   - Full `translation`, `rotation`, and `scale` keyframe tracks per bone in every animation clip
   - Multi-animation `.glb` packing (`Clips` bank) so multiple recorded clips (e.g. walk, wave, facial takes) live in a single `.glb` file switchable via `playAnimationByIndex()` / `playAnimationByName()`

---

## Core Features

- **Motion Lab (33-pt Pose Demo):** Built-in synthetic Mixamo benchmark motions (`Walk Cycle`, `Wave & Turn`, `Martial Kick`, `Deep Squat`, `T-Pose Calibration`).
- **Live Camera & Video Track Pose Capture:** Real-time MediaPipe `PoseLandmarker` 3D world-landmark retargeting with webcam mirroring, optional `Root XZ` displacement, and `Foot Ground` height stabilization.
- **Isolated 478-pt MediaPipe Face Mesh Scene:** Dedicated facial capture & demo studio with 1-Euro landmark/blendshape filtering, natural mouth gating, timeline playback, and **11-bone skeletal Face Mesh `.GLB` export** (`Head`, `Jaw`, `UpperLip`, `MouthCornerL/R`, `UpperLidL/R`, `LowerLidL/R`, `BrowL/R`) using your captured facial proportions and tessellation atlas.
- **Timed Recording & Multi-Clip Timeline:** Configurable countdown delay (`Start in`), recording duration (`Interval`), frame sampling (`Frame Step`), interactive scrubbing, zero-phase temporal `Smooth`, `.BVH` verification inspector, and multi-clip `.GLB` export.

---

## Local Development

```bash
npm install
npm run dev       # Starts Vite dev server on http://localhost:3000
npm run lint      # Runs TypeScript type-checking (tsc --noEmit)
npm run build     # Produces production bundle in dist/
```

---

## Author & License

- **Author:** Nikola Lukic (`zlatnaspirala@gmail.com`)
- **Built with:** Google AI Studio
- **License:** [MIT License](./LICENSE)
