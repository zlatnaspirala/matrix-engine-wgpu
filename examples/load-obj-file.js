import MatrixEngineWGPU from "../src/world.js";
import {downloadMeshes} from '../src/engine/loader-obj.js';
import {geometryTypes, geoTypesForMorph, LOG_MATRIX} from "../src/engine/utils.js";
import {MeshMorpher} from "../src/engine/procedural-mesh.js";
// import {addRaycastsAABBListener} from "../src/engine/raycast.js";

export var loadObjFile = function() {
  let loadObjFile = new MatrixEngineWGPU({
    useSingleRenderPass: true,
    canvasSize: 'fullscreen',
    mainCameraParams: {
      type: 'WASD',
      responseCoef: 1000
    },
    clearColor: {r: 0, b: 0.122, g: 0.122, a: 1}
  }, () => {
    addEventListener('AmmoReady', () => {
      downloadMeshes({
        ball: "./res/meshes/blender/sphere.obj",
        cube: "./res/meshes/blender/cube.obj",
      }, onLoadObj,
        {scale: [2, 2, 2]})
      downloadMeshes({
        cube: "./res/meshes/blender/cube.obj",
      }, onGround,
        {scale: [20, 1, 20]})
    })

    function onGround(m) {
      loadObjFile.addMeshObj({
        material: {type: 'gpt'},
        position: {x: 0, y: -5, z: -10},
        rotation: {x: 0, y: 0, z: 0},
        rotationSpeed: {x: 0, y: 0, z: 0},
        texturesPaths: ['./res/textures/floor1.jpg', './res/textures/env-maps/sky1.webp'],
        envMapParams: {
          baseColorMix: 0.5,
          mirrorTint: [0.9, 0.95, 1.0],    // Slight cool tint
          reflectivity: 0.4,               // 25% reflection blend
          illuminateColor: [0.3, 0.7, 1.0], // Soft cyan
          illuminateStrength: 0.1,          // Gentle rim
          illuminatePulse: 0.001,             // No pulse (static)
          fresnelPower: 5.0,                // Medium-sharp edge
          envLodBias: 2.5,
          usePlanarReflection: false,  // ✅ Env map mode
        },
        name: 'ground',
        mesh: m.cube,
        physics: {
          enabled: false,
          mass: 0,
          geometry: "Cube"
        }
      })
    }

    function onLoadObj(m) {
      loadObjFile.myLoadedMeshes = m;

      loadObjFile.addMeshObj({
        material: {type: 'mirror'},
        position: {x: 0, y: -1, z: -20},
        rotation: {x: 0, y: 0, z: 0},
        scale: [100, 100, 100],
        rotationSpeed: {x: 0, y: 0, z: 0},
        texturesPaths: ['./res/textures/cube-g1.webp', './res/textures/env-maps/sky1_lod_mid.webp'],
        envMapParams: {
          baseColorMix: 0.0, // CLEAR SKY
          mirrorTint: [0.9, 0.95, 1.0],    // Slight cool tint
          reflectivity: 0.25,               // 25% reflection blend
          illuminateColor: [0.3, 0.7, 1.0], // Soft cyan
          illuminateStrength: 0.1,          // Gentle rim
          illuminatePulse: 0.01,             // No pulse (static)
          fresnelPower: 2.0,                // Medium-sharp edge
          envLodBias: 1.5,
          usePlanarReflection: false,  // ✅ Env map mode
        },
        name: 'sky',
        mesh: m.ball,
        physics: {
          enabled: false,
          geometry: "Sphere"
        }
      });


      // loadObjFile.addMeshObj({
      //   material: {type: 'standard'},
      //   position: {x: 0, y: 1, z: -10},
      //   rotation: {x: 0, y: 0, z: 0},
      //   scale: [0.5, 0.5, 0.5],
      //   rotationSpeed: {x: 0, y: 0, z: 0},
      //   texturesPaths: ['./res/textures/cube-g1.webp', './res/textures/env-maps/sky1_lod_mid.webp'],
      //   envMapParams: {
      //     baseColorMix: 0.0, // CLEAR SKY
      //     mirrorTint: [0.9, 0.95, 1.0],    // Slight cool tint
      //     reflectivity: 0.25,               // 25% reflection blend
      //     illuminateColor: [0.3, 0.7, 1.0], // Soft cyan
      //     illuminateStrength: 0.1,          // Gentle rim
      //     illuminatePulse: 0.01,             // No pulse (static)
      //     fresnelPower: 2.0,                // Medium-sharp edge
      //     envLodBias: 1.5,
      //     usePlanarReflection: false,  // ✅ Env map mode
      //   },
      //   name: 'ball',
      //   mesh: m.cube,
      //   physics: {
      //     enabled: false,
      //     geometry: "Sphere"
      //   }
      // });

      // const spacing = 4;
      // let i = 0;
      // let j = 0;
      // for(const key in geoTypesForMorph) {
      //   loadObjFile.addProceduralMeshObj({
      //     material: {type: 'standard'},
      //     position: {x: i * spacing - 5, y: 1, z: -20 + j * spacing},
      //     rotation: {x: 0, y: 0, z: 0},
      //     scale: [1, 1, 1],
      //     rotationSpeed: {x: 0, y: 0, z: 0},
      //     texturesPaths: ['./res/textures/cube-g1_low.webp'],
      //     meshA: MeshMorpher[key](1),
      //     meshB: MeshMorpher[key](1),
      //     name: `myProCube_${key}`,
      //     physics: {
      //       enabled: false,
      //       geometry: "Sphere"
      //     }
      //   });
      //   i++;
      //   if(i % 4 == 0) {
      //     j++;
      //     i = 0;
      //   }
      // }

      const spacing = 4;
      const keys = Object.keys(geoTypesForMorph);

      let col = 0;
      let row = 0;

      for(let i = 0;i < keys.length - 1;i++) {
        const typeA = keys[i];
        const typeB = keys[i + 1];
        loadObjFile.addProceduralMeshObj({
          material: {type: 'standard'},
          position: {x: col * spacing - 5, y: 1, z: -10 + row * spacing},
          rotation: {x: 0, y: 0, z: 0},
          scale: [1, 1, 1],
          rotationSpeed: {x: 0, y: 0, z: 0},
          texturesPaths: ['./res/textures/cube-g1_low.webp'],

          meshA: MeshMorpher[typeA](1),
          meshB: MeshMorpher[typeB](1),

          name: `morph_${typeA}_to_${typeB}`,

          physics: {
            enabled: false,
            geometry: "Sphere"
          }
        });

        col++;

        if(col % 4 === 0) {
          row++;
          col = 0;
        }
      }

      console.log(`%c Test access scene ${TEST} object.`, LOG_MATRIX);

      loadObjFile.addLight();
      loadObjFile.lightContainer[0].intensity = 20;

      loadObjFile.lightContainer[0].behavior.setOsc0(-1, 1, 0.001)
      loadObjFile.lightContainer[0].behavior.value_ = -1;
      loadObjFile.lightContainer[0].updater.push((light) => {
        light.position[0] = light.behavior.setPath0()
      })

      loadObjFile.lightContainer[0].position = [0, 6, -10];
      loadObjFile.lightContainer[0].target = [0, 0, -10];

      var TEST = loadObjFile.getSceneObjectByName('cube2');
      setTimeout(() => {
        // app.activateBloomEffect();
        let cube1 = app.getSceneObjectByName('cube1')
        // cube1.effects.flameEffect.intensity = 100;
        // cube1.effects.flameEffect.morphTo("pyramid", 8)
        app.cameras.WASD.yaw = -0.03;
        app.cameras.WASD.pitch = -0.49;
        app.cameras.WASD.position[2] = 0;
        app.cameras.WASD.position[1] = 3.76;
      }, 800);
    }
  })
  window.app = loadObjFile;
}