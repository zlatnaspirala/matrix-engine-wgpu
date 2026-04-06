import MatrixEngineWGPU from "../src/world.js";
import {downloadMeshes} from '../src/engine/loader-obj.js';
import {geoTypesForMorph} from "../src/engine/utils.js";
import {MeshMorpher} from "../src/engine/procedural-mesh.js";
import {addRaycastsAABBListener} from "../src/engine/raycast.js";

export var procMesh = function() {
  let procMesh = new MatrixEngineWGPU({
    dontUsePhysics: true,
    canvasSize: 'fullscreen',
    mainCameraParams: {
      type: 'WASD',
      responseCoef: 1000
    },
    clearColor: {r: 0, b: 0.122, g: 0.122, a: 1}
  }, () => {

    procMesh.addLight();
    addRaycastsAABBListener();
    downloadMeshes({ball: "./res/meshes/blender/sphere.obj", cube: "./res/meshes/blender/cube.obj", }, onLoadObj, {scale: [2, 2, 2]})
    downloadMeshes({cube: "./res/meshes/blender/cube.obj", }, onGround, {scale: [30, 0.5, 30]})

    function onGround(m) {
      procMesh.addMeshObj({
        material: {type: 'standard'},
        position: {x: 0, y: -5, z: -10},
        rotation: {x: 0, y: 0, z: 0},
        rotationSpeed: {x: 0, y: 0, z: 0},
        texturesPaths: ['./res/textures/floor1.webp', './res/textures/env-maps/sky1.webp'],
        // envMapParams: {
        //   baseColorMix: 0.5,
        //   mirrorTint: [0.9, 0.95, 1.0],    // Slight cool tint
        //   reflectivity: 0.4,               // 25% reflection blend
        //   illuminateColor: [0.3, 0.7, 1.0], // Soft cyan
        //   illuminateStrength: 0.1,          // Gentle rim
        //   illuminatePulse: 0.001,             // No pulse (static)
        //   fresnelPower: 5.0,                // Medium-sharp edge
        //   envLodBias: 2.5,
        //   usePlanarReflection: false,  // ✅ Env map mode
        // },
        name: 'floor',
        mesh: m.cube,
        physics: {
          enabled: false,
          mass: 0,
          geometry: "Cube"
        }
      })
    }

    function onLoadObj(m) {
      procMesh.myLoadedMeshes = m;

      let test = MeshMorpher.compose(
        {shape: MeshMorpher.cube(1), offset: [-2, 0, 0]},
        {shape: MeshMorpher.cube(1), offset: [2, 0, 0]},
      );

      procMesh.addProceduralMeshObj({
        material: {type: 'standard'},
        position: {x: 0, y: 5, z: -15},
        rotation: {x: 0, y: 0, z: 0},
        scale: [1, 1, 1],
        rotationSpeed: {x: 0, y: 0, z: 0},
        texturesPaths: ['./res/textures/cube-g1_low.webp'],
        meshA: test,
        meshB: test,
        name: `morph_1`,
        physics: {
          enabled: false,
          geometry: "Sphere"
        }
      });
      const meshObjects = [];
      const spacing = 3;
      const keys = Object.keys(geoTypesForMorph);
      let col = 0;
      let row = 0;
      for(let i = 0;i < keys.length - 1;i++) {
        const typeA = keys[i];
        const typeB = keys[i + 1];
        const obj = procMesh.addProceduralMeshObj({
          material: {type: 'free'},
          position: {x: col * spacing - 5, y: 1, z: -15 + row * spacing},
          rotation: {x: 0, y: 0, z: 0},
          scale: [1, 1, 1],
          rotationSpeed: {x: 0, y: 0, z: 0},
          texturesPaths: ['./res/textures/cube-g1_low.webp'],
          meshA: MeshMorpher[typeA](1),
          meshB: MeshMorpher[typeB](1),
          name: `morph_${typeA}_to_${typeB}`,
          physics: {enabled: false, geometry: "Sphere"},
          raycast: {enabled: true, radius: 1.5}
        });
        meshObjects.push(obj);
        col++;
        if(col % 4 === 0) {row++; col = 0;}
      }

      const runChain = (index) => {
        if(index >= meshObjects.length) return;
        meshObjects[index].morphTo(1.0, 600, () => {
          runChain(index + 1);
        });
      };

      runChain(0);

      procMesh.lightContainer[0].intensity = 10;
      procMesh.lightContainer[0].behavior.setOsc0(-2, 2, 0.1)
      procMesh.lightContainer[0].behavior.value_ = -1;
      procMesh.lightContainer[0].updater.push((light) => {
        light.setPosX(light.behavior.setPath0())
        light.setTargetX(light.behavior.setPath0())
      });
      procMesh.lightContainer[0].setPosition(0, 17, -10);
      procMesh.lightContainer[0].setTarget(0, 0, -10);

      setTimeout(() => {
        app.cameras.WASD.setYaw(-0.03);
        app.cameras.WASD.setPitch(-0.49);
        app.cameras.WASD.setZ(0);
        app.cameras.WASD.setY(5);
        app.cameras.WASD._dirtyAngle = true;
      }, 800);
    }

    procMesh.canvas.addEventListener("ray.hit.event", (e) => {
      // console.log('ray.hit.event');
      if(e.detail.hitObject.morphTo) e.detail.hitObject.morphTo(0.0, 500);
    });
  })
  window.app = procMesh;
}