export const cannonTest = `

import {MatrixEngineWGPU,downloadMeshes,
addRaycastsListener,PVector,
isMobile} from "matrix-engine-wgpu";

export var testCannonES = function() {
  let physicsPlayground = new MatrixEngineWGPU({
    canvasSize: 'fullscreen',
    useCannon: true,
    fastRender: 0.9,
    MAX_SPOTLIGHTS: 1,
    MAX_BONES: 0,
    mainCameraParams: {
      type: 'WASD',
      responseCoef: 1000
    },
    clearColor: {r: 0, b: 0.122, g: 0.122, a: 1}
  }, () => {
    physicsPlayground.addLight();
    addRaycastsListener();
    addEventListener('PhysicsReady', () => {
      downloadMeshes({
        cube: "./res/meshes/blender/cube.obj",
        plane: "./res/meshes/blender/plane.obj",
        ball: "./res/meshes/shapes/sphere-uv-cilinder-proj.obj",
        reel: "./res/meshes/obj/reel.obj"
      }, onGround, {scale: [1, 1, 1]})

      physicsPlayground.matrixPhysics.speedUpSimulation(2);

      physicsPlayground.physicsBodiesChain();

      // physicsPlayground.physicsBodiesGeneratorDeepPyramid(
      //   "standard", {x: 0, y: 1, z: -20}, {x: 0, y: 0, z: 0},
      //   "./res/textures/gold-1.webp", "pyr", 2, true, [1, 1, 1], 2, 400
      // );

      // Buildin options
      app.physicsBodiesGeneratorWall("standard",
        {x: -4.5, y: 1, z: -10}, {x: 0, y: 0, z: 0},
        ["./res/textures/rust.jpg",],
        'my_set_walls', "5x3", true, [1, 1, 1], 2.05, 1000, "ByZ");

      let strength = 10;
      physicsPlayground.canvas.addEventListener("ray.hit.event", (e) => {
        console.log('ray.hit.event detected');
        let b = app.matrixPhysics.getBodyByName(e.detail.hitObject.name);
        app.matrixPhysics.applyImpulse(b, new PVector(
          e.detail.rayDirection[0] * strength,
          e.detail.rayDirection[1] * strength,
          e.detail.rayDirection[2] * strength))
      });
    })

    async function onGround(m) {
      let cam = app.getCamera();
      cam.setYaw(-0.03);
      cam.setPitch(-0.49);
      cam.setZ(0);
      cam.setY(3.76);
      cam._dirtyAngle = true;

      physicsPlayground.addMeshObj({
        position: {x: 0, y: -0.5, z: -10},
        rotation: {x: 0, y: 0, z: 0},
        rotationSpeed: {x: 0, y: 0, z: 0},
        scale: [25, 0.1, 25],
        texturesPaths: ['res/icons/editor/chatgpt-gen-bg-inv.webp'],
        name: 'ground',
        mesh: m.plane,
        physics: {enabled: false}
      });

      if(isMobile() == false) app.activateBloomEffect();
      physicsPlayground.lightContainer[0].setPosY(14);
      physicsPlayground.lightContainer[0].setIntensity(24);
    }
  })
  window.app = physicsPlayground;
}`;