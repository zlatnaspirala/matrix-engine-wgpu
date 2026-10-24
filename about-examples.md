# Examples Guide

This guide maps the `./examples` directory to the rendering features, engine systems, and playable prototypes demonstrated by MatrixEngineWGPU. Most files are focused experiments: open the source to see how a feature is configured and connected to the engine.

- **Example workspace:** [`examples.js`](examples.js) — imports demos and maps the showcase menu to demo IDs.
- **Example sources:** [`examples/`](examples/)
- **Game prototypes:** [`examples/games/`](examples/games/)
- **Main README:** [`readme.md`](readme.md)
- **Live demo gallery:** [MatrixEngineWGPU examples](https://maximumroulette.com/apps/webgpu/examples.html)

## Run the example gallery locally

From the repository root:

```bash
npm install
npm run examples
```

In a second terminal, serve the `public` directory:

```bash
npm run hosts
```

Open [http://localhost:3000/examples.html](http://localhost:3000/examples.html). The examples build script watches `examples.js` and writes the bundled module to `public/examples.js`; the gallery HTML is the entry point that loads it.

Some demos require browser features such as WebGPU, webcam access, or a supported GPU/backend. Webcam and other browser permissions must be granted when prompted. Physics examples can use different backends, and a few showcase options are hidden on mobile.

## Quick index: gallery demo IDs

The IDs below are wired in `examples.js`. Open the local or hosted gallery and select the matching demo; the URL uses the `demo` query parameter.

| ID | Demo | Main area |
|---:|---|---|
| 1 | OBJ loading | Load and render OBJ assets |
| 2 | Physics playground | Physics interaction and ray-hit events |
| 3 | Camera texture | Use a camera/video source as a texture |
| 4 | Video texture | Video-backed textures |
| 5 | OBJ sequence | Sequence-based object animation |
| 6 | GLB loader | GLB assets and animation |
| 7 | Procedural mesh | Runtime mesh creation |
| 8 | OBJ loader alias | Routes to the OBJ loading example |
| 9 | Lights | Light setup and scene illumination |
| 10 | Snake lights | Moving lights |
| 11 | Instanced snake lights | Instancing with moving lights |
| 12 | Maze | Large scene, camera movement, and culling |
| 13 | Jolt flipper | Flipper game with Jolt physics |
| 14 | Ammo flipper | Flipper game with Ammo.js (desktop gallery option) |
| 15 | Jolt test | Jolt physics integration |
| 16 | cannon-es test | cannon-es physics integration |
| 17 | Canvas inline | Canvas2D content inside a WebGPU scene |
| 18 | Cinematic camera | Camera path animation |
| 19 | Procedural destruction | Procedural mesh/destruction experiment |
| 20 | Kaleidoscope | Kaleidoscope visual effect |
| 21 | HZB ray | HZB/depth-related experiment |
| 22 | Kinematic collision | Kinematic collision handling |
| 23 | 2D world | 2D-style world/sprite example |
| 24 | 2D world + Matter.js | 2D example with Matter.js |
| 25 | Drum cannon | Cannon/physics interaction demo |
| 26 | Gaussian splat | Gaussian splat rendering |
| 27 | Gaussian splat vertex animation | Animated splat experiment |
| 28 | Hand tracking | MediaPipe hand tracking |
| 29 | Stream render | Remote render streaming |
| 30 | Hang3d | First-person zombie-shooter template |
| 31 | Beast menu | Game/menu prototype; requests fullscreen |
| 32 | BVH skeletal animation | BVH animation |
| 33 | BVH shared material | BVH animation with shared material |
| 34 | Water effects | Water material/effects |
| 35 | Particles | Particle system |
| 36 | Runner | Runner prototype |
| 37 | Crypto grid | Crypto-grid visual demo |
| 38 | Earth | Earth rendering demo |
| 39 | Camera depth | Camera/depth experiment |
| 40 | Reactive audio | Audio-reactive visuals |
| 41 | Maximum instancing | High-count instancing stress test |
| 42 | Hand tracking renderer | Hand tracking with the Beast renderer |
| 43 | Face tracking renderer | Face tracking with the Beast renderer |
| 44 | Gaussian splat animation test | Additional splat animation experiment |
| 45 | Roulette | Roulette game prototype |
| 46 | MSDF text | Multi-channel signed distance field text |
| 47 | Face mask | Face-mask tracking example |
| 48 | Pose renderer | Pose tracking with the Beast renderer |
| 49 | Pose to GLB | Pose-to-GLB experiment |
| 50 | Slot machine | Slot-machine prototype |

The gallery's available controls are the source of truth for which demos are exposed in the current build. Additional files in `examples/` may be useful as source-level experiments even when they are not individually wired to a gallery button.

## Rendering and scene examples

| File | What to explore |
|---|---|
| [`load-obj-file.js`](examples/load-obj-file.js) | Loading and displaying OBJ models |
| [`load-objs-sequence.js`](examples/load-objs-sequence.js) | Sequence-based object animation |
| [`glb-loader.js`](examples/glb-loader.js) | GLB model loading |
| [`procedural-mesh.js`](examples/procedural-mesh.js) | Procedural geometry |
| [`maze.js`](examples/maze.js) | Camera movement, a larger scene, and CPU/GPU culling configuration |
| [`max-instanced-13y-gpu-card.js`](examples/max-instanced-13y-gpu-card.js) | High-volume instancing stress test |
| [`snake-lights.js`](examples/snake-lights.js) and [`snake-lights-instanced.js`](examples/snake-lights-instanced.js) | Compare standard scene objects and instanced rendering |
| [`my-lights.js`](examples/my-lights.js) | Lighting setup |
| [`earth.js`](examples/earth.js) | Earth rendering |
| [`camera-depth.js`](examples/camera-depth.js) | Camera and depth behavior |
| [`cinematic-camera.js`](examples/cinematic-camera.js) | Camera path movement |
| [`canvas-inline.js`](examples/canvas-inline.js) | Canvas2D drawing integrated into a scene |
| [`camera-texture.js`](examples/camera-texture.js) and [`video-texture.js`](examples/video-texture.js) | Camera/video texture sources |
| [`msdfText.js`](examples/msdfText.js) | MSDF text rendering |
| [`load-objs-sequence.js`](examples/load-objs-sequence.js) | Object sequence loading and playback |

## Animation, effects, and procedural graphics

| File | What to explore |
|---|---|
| [`bvh-skeletal.js`](examples/bvh-skeletal.js) | BVH skeletal animation |
| [`bvh-skeletal-shared-mat.js`](examples/bvh-skeletal-shared-mat.js) | Skeletal animation using shared materials |
| [`gaussian-splat.js`](examples/gaussian-splat.js) | Gaussian splat scene |
| [`gaussian-vertex-anim.js`](examples/gaussian-vertex-anim.js) and [`gaussian-test.js`](examples/gaussian-test.js) | Splat animation experiments |
| [`water-effect.js`](examples/water-effect.js) | Water rendering |
| [`particles.js`](examples/particles.js) and [`particles_NEW_WIP.js`](examples/particles_NEW_WIP.js) | Particle system and work-in-progress variant |
| [`destruction-procedural.js`](examples/destruction-procedural.js) | Procedural destruction |
| [`kale.js`](examples/kale.js) | Kaleidoscope effect |
| [`hzb-ray.js`](examples/hzb-ray.js) | HZB/depth experiment |
| [`reactive-audio.js`](examples/reactive-audio.js) | Audio-reactive parameters |
| [`crypto-grid.js`](examples/crypto-grid.js) | Crypto-grid visual experiment |
| [`fontana.js`](examples/fontana.js) | Fountain-style scene experiment |

## Physics and interaction

| File | What to explore |
|---|---|
| [`physics-playground.js`](examples/physics-playground.js) | Interactive physics and object hit handling |
| [`physics-test-cannones.js`](examples/physics-test-cannones.js) | cannon-es bridge |
| [`physics-test-jolt.js`](examples/physics-test-jolt.js) | Jolt bridge |
| [`flipper-ammo.js`](examples/flipper-ammo.js) | Flipper game using Ammo.js |
| [`flipper-jolt.js`](examples/flipper-jolt.js) | Flipper game using Jolt |
| [`2D-world.js`](examples/2D-world.js) and [`2D-world-matter.js`](examples/2D-world-matter.js) | 2D-style examples, including Matter.js |
| [`kinematic-collision.js`](examples/kinematic-collision.js) | Kinematic collision behavior |
| [`drum-cannon.js`](examples/drum-cannon.js) | Cannon/physics interaction |

## Camera, media, and computer vision

| File | What to explore |
|---|---|
| [`camera-texture.js`](examples/camera-texture.js) | Camera input as a texture |
| [`video-texture.js`](examples/video-texture.js) | Video texture |
| [`stream-render.js`](examples/stream-render.js) | Remote render stream example |
| [`face-mask.js`](examples/face-mask.js) | Face-mask tracking |
| [`games/nui/hand.js`](examples/games/nui/hand.js) | Hand tracking |
| [`games/nui/hand-beast-render.js`](examples/games/nui/hand-beast-render.js) | Hand tracking rendered with the engine |
| [`games/nui/face-beast-render.js`](examples/games/nui/face-beast-render.js) | Face tracking rendered with the engine |
| [`games/nui/pose-beast-render.js`](examples/games/nui/pose-beast-render.js) | Pose tracking rendered with the engine |
| [`games/nui/pose-to-glb.js`](examples/games/nui/pose-to-glb.js) | Pose-to-GLB experiment |

Camera and vision examples depend on browser permission policies and supported device APIs. Test them over localhost or HTTPS and allow access when prompted.

## Game prototypes in `examples/games/`

These are larger example projects with their own entry points and supporting files rather than single-feature demos.

| Directory | Project / focus |
|---|---|
| [`moba/`](examples/games/moba/) | **Forest of Hollow Blood** — MOBA prototype with heroes, creeps, navigation, combat, and networking-related systems. See its [entry point](examples/games/moba/forestOfHollowBlood.js) and [license](examples/games/moba/LICENCE). |
| [`first-person-shooter/`](examples/games/first-person-shooter/) | Hang3d zombie / first-person-shooter template. Start with [`hang3d.js`](examples/games/first-person-shooter/hang3d.js) and its [readme](examples/games/first-person-shooter/readme.md). |
| [`jamb/`](examples/games/jamb/) | Jamb 3D game source and supporting scripts. See [`jamb.js`](examples/games/jamb/jamb.js) and the [folder readme](examples/games/jamb/readme.md). |
| [`slot-machine/`](examples/games/slot-machine/) | Slot-machine mechanics split across reel, slot, state, math, and networking modules. |
| [`ultimate-roulette-2/`](examples/games/ultimate-roulette-2/) | Roulette prototype: [`roulette.js`](examples/games/ultimate-roulette-2/roulette.js). |
| [`my-nui/`](examples/games/my-nui/) | NUI-related runner/menu experiments: [`real-runner.js`](examples/games/my-nui/real-runner.js), [`menu-beast.js`](examples/games/my-nui/menu-beast.js). |
| [`nui/`](examples/games/nui/) | Hand, face, and pose tracking examples, including rendering and pose conversion. |

The MOBA example has its own license/attribution notice. Check the relevant project and asset terms before redistributing game files or bundled assets.

## Tips for learning from the source

1. Start with a small focused demo such as OBJ loading, lighting, water, or a camera example.
2. Find its loader function and initialization options, then trace the specific engine APIs it calls.
3. Compare paired examples where available—for example, standard versus instanced lights, Ammo.js versus Jolt flippers, or BVH animation with and without shared materials.
4. Use the maze and instancing examples to explore larger-scene rendering and performance options.
5. Treat files explicitly marked `WIP` or named as tests as experiments, not necessarily as stable public APIs.

## Notes

- The gallery registration and demo IDs live in [`examples.js`](examples.js); IDs can change as the gallery evolves.
- The example source files are not all standalone HTML pages. Many are imported by the gallery bundle.
- Asset paths and required files are relative to the repository's public resources or the configured runtime base path. Run examples through a local HTTP server instead of opening the HTML file directly.
- The examples demonstrate engine usage; they are not a guarantee that every feature is supported by every browser, GPU, or mobile device.
