import MatrixEngineWGPU from "../../src/world.js";
import {downloadMeshes} from '../../src/engine/loader-obj.js';
import {uploadGLBModel} from "../../src/engine/loaders/webgpu-gltf.js";
import graph from "./graph.js";
import {shaderGraphsProdc} from "./shader-graphs.js"
import {addRaycastsListener} from "../../src/engine/raycast.js";

let app = new MatrixEngineWGPU(
  {
    useEditor: true,
    projectType: "created from editor",
    projectName: 'Test1',
    useSingleRenderPass: true,
    canvasSize: 'fullscreen',
    mainCameraParams: {
      type: 'WASD',
      responseCoef: 1000
    },
    clearColor: {r: 0, b: 0.1, g: 0.1, a: 1}
  }
  , (app) => {
    app.graph = graph;

    shaderGraphsProdc.forEach((gShader) => {
      let shaderReady = JSON.parse(gShader.content);
      app.shadersPack[gShader.name] = shaderReady.final;
      if(typeof shaderReady.final === undefined) console.warn(`Shader ${shaderReady.name} is not compiled.`);
    });

    addEventListener('AmmoReady', async () => {

      addRaycastsListener("canvas1", "mousedown");
      // [light]
      app.addLight();
      // ME START Cube_0 addCube
      downloadMeshes({cube: "./res/meshes/blender/plane.obj"}, (m) => {
        // downloadMeshes({cube: "./res/meshes/shapes/plane-water.obj"}, (m) => {
        let texturesPaths = ['./res/meshes/blender/cube.png'];
        app.addMeshObj({
          position: {x: 0, y: 0, z: -20}, rotation: {x: 0, y: 0, z: 0}, rotationSpeed: {x: 0, y: 0, z: 0},
          texturesPaths: [texturesPaths],
          name: 'FLOOR',
          mesh: m.cube,
          raycast: {enabled: true, radius: 2},
          physics: {enabled: false, geometry: "Cube"},
          pointerEffect: {
            enabled: true,
            gizmoEffect: true,
          },
        });
      }, {scale: [1, 1, 1]});
      // ME END Cube_0 addCube

      // ME START L_BOX addCube
      downloadMeshes({cube: "./res/meshes/blender/cube.obj"}, (m) => {
        let texturesPaths = ['./res/meshes/blender/cube.png'];
        app.addMeshObj({
          position: {x: 0, y: 0, z: -20}, rotation: {x: 0, y: 0, z: 0}, rotationSpeed: {x: 0, y: 0, z: 0},
          texturesPaths: [texturesPaths],
          name: 'L_BOX',
          mesh: m.cube,
          raycast: {enabled: true, radius: 2},
          physics: {enabled: false, geometry: "Cube"}
        });
      }, {scale: [1, 1, 1]});
      // ME END L_BOX addCube

      // ME START R_BOX addCube
      downloadMeshes({cube: "./res/meshes/blender/cube.obj"}, (m) => {
        let texturesPaths = ['./res/meshes/blender/cube.png'];
        app.addMeshObj({
          position: {x: 0, y: 0, z: -20}, rotation: {x: 0, y: 0, z: 0}, rotationSpeed: {x: 0, y: 0, z: 0},
          texturesPaths: [texturesPaths],
          name: 'R_BOX',
          mesh: m.cube,
          raycast: {enabled: true, radius: 2},
          physics: {enabled: false, geometry: "Cube"}
        });
      }, {scale: [1, 1, 1]});
      // ME END R_BOX addCube


      // ME START L_BOX updatePosx
      setTimeout(() => {
        app.getSceneObjectByName('L_BOX').position.SetX(-4);
      }, 800);
      // ME END L_BOX updatePosx

      // ME START REEL_1
      downloadMeshes({cube: "res/meshes/obj/reel.obj"}, (m) => {
        const texturesPaths = ['./res/meshes/blender/cube.png'];
        app.addMeshObj({
          position: {x: 0, y: 0, z: -20}, rotation: {x: 0, y: 0, z: 0}, rotationSpeed: {x: 0, y: 0, z: 0},
          texturesPaths: [texturesPaths],
          name: 'REEL_1',
          mesh: m.cube,
          raycast: {enabled: true, radius: 2},
          physics: {enabled: false, geometry: "Cube"}
        });
      }, {scale: [1, 1, 1]});
      // ME END REEL_1


      // ME START REEL_1 updateScale0
      setTimeout(() => {
        app.getSceneObjectByName('REEL_1').scale[0] = 2;
      }, 800);
      // ME END REEL_1 updateScale0

      // ME START REEL_1 updateScale1
      setTimeout(() => {
        app.getSceneObjectByName('REEL_1').scale[1] = 2;
      }, 800);
      // ME END REEL_1 updateScale1

      // ME START REEL_1 updateScale2
      setTimeout(() => {
        app.getSceneObjectByName('REEL_1').scale[2] = 2;
      }, 800);
      // ME END REEL_1 updateScale2

      // ME START R_BOX updatePosx
      setTimeout(() => {
        app.getSceneObjectByName('R_BOX').position.SetX(4);
      }, 800);
      // ME END R_BOX updatePosx

      // ME START REEL_2
      downloadMeshes({cube: "res/meshes/obj/reel.obj"}, (m) => {
        const texturesPaths = ['./res/meshes/blender/cube.png'];
        app.addMeshObj({
          position: {x: 0, y: 0, z: -20}, rotation: {x: 0, y: 0, z: 0}, rotationSpeed: {x: 0, y: 0, z: 0},
          texturesPaths: [texturesPaths],
          name: 'REEL_2',
          mesh: m.cube,
          raycast: {enabled: true, radius: 2},
          physics: {enabled: false, geometry: "Cube"}
        });
      }, {scale: [1, 1, 1]});
      // ME END REEL_2


      // ME START REEL_2 updateScale0
      setTimeout(() => {
        app.getSceneObjectByName('REEL_2').scale[0] = 2;
      }, 800);
      // ME END REEL_2 updateScale0

      // ME START REEL_2 updateScale2
      setTimeout(() => {
        app.getSceneObjectByName('REEL_2').scale[2] = 2;
      }, 800);
      // ME END REEL_2 updateScale2

      // ME START REEL_2 updateScale1
      setTimeout(() => {
        app.getSceneObjectByName('REEL_2').scale[1] = 2;
      }, 800);
      // ME END REEL_2 updateScale1

      // ME START REEL_2 updatePosx
      setTimeout(() => {
        app.getSceneObjectByName('REEL_2').position.SetX(0);
      }, 800);
      // ME END REEL_2 updatePosx

      // ME START REEL_3
      downloadMeshes({cube: "res/meshes/obj/reel.obj"}, (m) => {
        const texturesPaths = ['./res/meshes/blender/cube.png'];
        app.addMeshObj({
          position: {x: 0, y: 0, z: -20}, rotation: {x: 0, y: 0, z: 0}, rotationSpeed: {x: 0, y: 0, z: 0},
          texturesPaths: [texturesPaths],
          name: 'REEL_3',
          mesh: m.cube,
          raycast: {enabled: true, radius: 2},
          physics: {enabled: false, geometry: "Cube"}
        });
      }, {scale: [1, 1, 1]});
      // ME END REEL_3


      // ME START REEL_3 updateScale0
      setTimeout(() => {
        app.getSceneObjectByName('REEL_3').scale[0] = 2;
      }, 800);
      // ME END REEL_3 updateScale0

      // ME START REEL_3 updateScale1
      setTimeout(() => {
        app.getSceneObjectByName('REEL_3').scale[1] = 2;
      }, 800);
      // ME END REEL_3 updateScale1

      // ME START REEL_3 updateScale2
      setTimeout(() => {
        app.getSceneObjectByName('REEL_3').scale[2] = 2;
      }, 800);
      // ME END REEL_3 updateScale2

      // ME START REEL_3 updatePosx
      setTimeout(() => {
        app.getSceneObjectByName('REEL_3').position.SetX(2);
      }, 800);
      // ME END REEL_3 updatePosx

      // ME START L_BOX updateScale0
      setTimeout(() => {
        app.getSceneObjectByName('L_BOX').scale[0] = 1;
      }, 800);
      // ME END L_BOX updateScale0

      // ME START L_BOX updateScale1
      setTimeout(() => {
        app.getSceneObjectByName('L_BOX').scale[1] = 4;
      }, 800);
      // ME END L_BOX updateScale1

      // ME START R_BOX updateScale1
      setTimeout(() => {
        app.getSceneObjectByName('R_BOX').scale[1] = 4;
      }, 800);
      // ME END R_BOX updateScale1

      // ME START REEL_2 updatePosy
      setTimeout(() => {
        app.getSceneObjectByName('REEL_2').position.SetY(3);
      }, 800);
      // ME END REEL_2 updatePosy

      // ME START REEL_3 updatePosy
      setTimeout(() => {
        app.getSceneObjectByName('REEL_3').position.SetY(3);
      }, 800);
      // ME END REEL_3 updatePosy

      // ME START L_BOX updatePosy
      setTimeout(() => {
        app.getSceneObjectByName('L_BOX').position.SetY(1);
      }, 800);
      // ME END L_BOX updatePosy

      // ME START R_BOX updatePosy
      setTimeout(() => {
        app.getSceneObjectByName('R_BOX').position.SetY(1);
      }, 800);
      // ME END R_BOX updatePosy

      // ME START REEL_1 updatePosx
      setTimeout(() => {
        app.getSceneObjectByName('REEL_1').position.SetX(-2);
      }, 800);
      // ME END REEL_1 updatePosx

      // ME START REEL_1 updatePosy
      setTimeout(() => {
        app.getSceneObjectByName('REEL_1').position.SetY(3);
      }, 800);
      // ME END REEL_1 updatePosy



      // ME START BANNER1
      downloadMeshes({cube: "res/meshes/blender/plane.obj"}, (m) => {
        const texturesPaths = ['./res/meshes/blender/cube.png'];
        app.addMeshObj({
          position: {x: 0, y: 0, z: -20}, rotation: {x: 0, y: 0, z: 0}, rotationSpeed: {x: 0, y: 0, z: 0},
          texturesPaths: [texturesPaths],
          name: 'BANNER1',
          mesh: m.cube,
          raycast: {enabled: true, radius: 2},
          physics: {enabled: false, geometry: "Cube"}
        });
      }, {scale: [1, 1, 1]});
      // ME END BANNER1


      // ME START BANNER1 updateRotx
      setTimeout(() => {
        app.getSceneObjectByName('BANNER1').rotation.x = 90;
      }, 800);
      // ME END BANNER1 updateRotx

      // ME START BANNER1 updatePosx
      setTimeout(() => {
        app.getSceneObjectByName('BANNER1').position.SetX(0);
      }, 800);
      // ME END BANNER1 updatePosx

      // ME START BANNER2
      downloadMeshes({cube: "res/meshes/blender/plane.obj"}, (m) => {
        const texturesPaths = ['./res/meshes/blender/cube.png'];
        app.addMeshObj({
          position: {x: 0, y: 0, z: -20}, rotation: {x: 0, y: 0, z: 0}, rotationSpeed: {x: 0, y: 0, z: 0},
          texturesPaths: [texturesPaths],
          name: 'BANNER2',
          mesh: m.cube,
          raycast: {enabled: true, radius: 2},
          physics: {enabled: false, geometry: "Cube"}
        });
      }, {scale: [1, 1, 1]});
      // ME END BANNER2


      // ME START BANNER2 updateRotx
      setTimeout(() => {
        app.getSceneObjectByName('BANNER2').rotation.x = 90;
      }, 800);
      // ME END BANNER2 updateRotx

      // ME START BANNER2 updateScale1
      setTimeout(() => {
        app.getSceneObjectByName('BANNER2').scale[1] = 3;
      }, 800);
      // ME END BANNER2 updateScale1

      // ME START BANNER2 updateScale2
      setTimeout(() => {
        app.getSceneObjectByName('BANNER2').scale[2] = 3;
      }, 800);
      // ME END BANNER2 updateScale2

      // ME START BANNER2 updatePosy
      setTimeout(() => {
        app.getSceneObjectByName('BANNER2').position.SetY(9);
      }, 800);
      // ME END BANNER2 updatePosy

      // ME START BANNER2 updateRoty
      setTimeout(() => {
        app.getSceneObjectByName('BANNER2').rotation.y = 0;
      }, 800);
      // ME END BANNER2 updateRoty

      // ME START BANNER2 updateRotz
      setTimeout(() => {
        app.getSceneObjectByName('BANNER2').rotation.z = -30;
      }, 800);
      // ME END BANNER2 updateRotz

      // ME START BANNER1 updateScale0
      setTimeout(() => {
        app.getSceneObjectByName('BANNER1').scale[0] = 3;
      }, 800);
      // ME END BANNER1 updateScale0

      // ME START BANNER1 updateScale1
      setTimeout(() => {
        app.getSceneObjectByName('BANNER1').scale[1] = 3;
      }, 800);
      // ME END BANNER1 updateScale1

      // ME START BANNER1 updateScale2
      setTimeout(() => {
        app.getSceneObjectByName('BANNER1').scale[2] = 3;
      }, 800);
      // ME END BANNER1 updateScale2

      // ME START BANNER2 updateScale0
      setTimeout(() => {
        app.getSceneObjectByName('BANNER2').scale[0] = 4;
      }, 800);
      // ME END BANNER2 updateScale0

      // ME START BANNER3
      downloadMeshes({cube: "res/meshes/blender/plane.obj"}, (m) => {
        const texturesPaths = ['./res/meshes/blender/cube.png'];
        app.addMeshObj({
          position: {x: 0, y: 0, z: -20}, rotation: {x: 0, y: 0, z: 0}, rotationSpeed: {x: 0, y: 0, z: 0},
          texturesPaths: [texturesPaths],
          name: 'BANNER3',
          mesh: m.cube,
          raycast: {enabled: true, radius: 2},
          physics: {enabled: false, geometry: "Cube"}
        });
      }, {scale: [1, 1, 1]});
      // ME END BANNER3


      // ME START BANNER3 updateRotx
      setTimeout(() => {
        app.getSceneObjectByName('BANNER3').rotation.x = 90;
      }, 800);
      // ME END BANNER3 updateRotx

      // ME START BANNER3 updateScale0
      setTimeout(() => {
        app.getSceneObjectByName('BANNER3').scale[0] = 3;
      }, 800);
      // ME END BANNER3 updateScale0

      // ME START BANNER3 updateScale1
      setTimeout(() => {
        app.getSceneObjectByName('BANNER3').scale[1] = 3;
      }, 800);
      // ME END BANNER3 updateScale1

      // ME START BANNER3 updateScale2
      setTimeout(() => {
        app.getSceneObjectByName('BANNER3').scale[2] = 3;
      }, 800);
      // ME END BANNER3 updateScale2

      // ME START BANNER3 updatePosy
      setTimeout(() => {
        app.getSceneObjectByName('BANNER3').position.SetY(9);
      }, 800);
      // ME END BANNER3 updatePosy

      // ME START BANNER3 updatePosx
      setTimeout(() => {
        app.getSceneObjectByName('BANNER3').position.SetX(8);
      }, 800);
      // ME END BANNER3 updatePosx

      // ME START BANNER3 updateRotz
      setTimeout(() => {
        app.getSceneObjectByName('BANNER3').rotation.z = 30;
      }, 800);
      // ME END BANNER3 updateRotz



      // ME START FLOOR updateScale2
      setTimeout(() => {
        app.getSceneObjectByName('FLOOR').scale[2] = 19;
      }, 800);
      // ME END FLOOR updateScale2

      // ME START FLOOR updateScale1
      setTimeout(() => {
        app.getSceneObjectByName('FLOOR').scale[1] = 1;
      }, 800);
      // ME END FLOOR updateScale1

      // ME START FLOOR updateScale0
      setTimeout(() => {
        app.getSceneObjectByName('FLOOR').scale[0] = 18;
      }, 800);
      // ME END FLOOR updateScale0

      // ME START FLOOR updateRotx
      setTimeout(() => {
        app.getSceneObjectByName('FLOOR').rotation.x = 0;
      }, 800);
      // ME END FLOOR updateRotx

      // ME START FLOOR useScaleno info
      setTimeout(() => {
        app.getSceneObjectByName('FLOOR').useScale = true;
      }, 800);
      // ME END FLOOR useScaleno info



      // ME START L_BOX useScaleno info
      setTimeout(() => {
        app.getSceneObjectByName('L_BOX').useScale = true;
      }, 800);
      // ME END L_BOX useScaleno info

      // ME START REEL_1 useScaleno info
      setTimeout(() => {
        app.getSceneObjectByName('REEL_1').useScale = true;
      }, 800);
      // ME END REEL_1 useScaleno info

      // ME START R_BOX useScaleno info
      setTimeout(() => {
        app.getSceneObjectByName('R_BOX').useScale = true;
      }, 800);
      // ME END R_BOX useScaleno info

      // ME START BANNER2 useScaleno info
      setTimeout(() => {
        app.getSceneObjectByName('BANNER2').useScale = true;
      }, 800);
      // ME END BANNER2 useScaleno info

      // ME START REEL_2 useScaleno info
      setTimeout(() => {
        app.getSceneObjectByName('REEL_2').useScale = true;
      }, 800);
      // ME END REEL_2 useScaleno info

      // ME START REEL_3 useScaleno info
      setTimeout(() => {
        app.getSceneObjectByName('REEL_3').useScale = true;
      }, 800);
      // ME END REEL_3 useScaleno info

      // ME START BANNER3 useScaleno info
      setTimeout(() => {
        app.getSceneObjectByName('BANNER3').useScale = true;
      }, 800);
      // ME END BANNER3 useScaleno info

      // ME START BANNER1 useScaleno info
      setTimeout(() => {
        app.getSceneObjectByName('BANNER1').useScale = true;
      }, 800);
      // ME END BANNER1 useScaleno info


      // ME START REEL_TOP
      downloadMeshes({cube: "res/meshes/obj/reel-top.obj"}, (m) => {
        const texturesPaths = ['./res/meshes/blender/cube.png'];
        app.addMeshObj({
          position: {x: 0, y: 0, z: -20}, rotation: {x: 0, y: 0, z: 0}, rotationSpeed: {x: 0, y: 0, z: 0},
          texturesPaths: [texturesPaths],
          name: 'REEL_TOP',
          mesh: m.cube,
          raycast: {enabled: true, radius: 2},
          physics: {enabled: false, geometry: "Cube"}
        });
      }, {scale: [1, 1, 1]});
      // ME END REEL_TOP


      // ME START REEL_TOP useScaleno info
      setTimeout(() => {
        app.getSceneObjectByName('REEL_TOP').useScale = true;
      }, 800);
      // ME END REEL_TOP useScaleno info

      // ME START REEL_TOP updateScale1
      setTimeout(() => {
        app.getSceneObjectByName('REEL_TOP').scale[1] = 2;
      }, 800);
      // ME END REEL_TOP updateScale1

      // ME START REEL_TOP updateScale2
      setTimeout(() => {
        app.getSceneObjectByName('REEL_TOP').scale[2] = 2;
      }, 800);
      // ME END REEL_TOP updateScale2

      // ME START REEL_TOP updateScale0
      setTimeout(() => {
        app.getSceneObjectByName('REEL_TOP').scale[0] = 2.1;
      }, 800);
      // ME END REEL_TOP updateScale0

       // ME START R_BOX updatePosz
 setTimeout(() => {
  app.getSceneObjectByName('R_BOX').position.SetZ(-20);
 }, 800);
 // ME END R_BOX updatePosz
 
     // ME START BANNER2 updatePosx
 setTimeout(() => {
  app.getSceneObjectByName('BANNER2').position.SetX(-9);
 }, 800);
 // ME END BANNER2 updatePosx
 
   // ME START BANNER1 updatePosy
 setTimeout(() => {
  app.getSceneObjectByName('BANNER1').position.SetY(9);
 }, 800);
 // ME END BANNER1 updatePosy
 
   // ME START BANNER1 updatePosz
 setTimeout(() => {
  app.getSceneObjectByName('BANNER1').position.SetZ(-18);
 }, 800);
 // ME END BANNER1 updatePosz
 
  // ME START BANNER2 updatePosz
 setTimeout(() => {
  app.getSceneObjectByName('BANNER2').position.SetZ(-20);
 }, 800);
 // ME END BANNER2 updatePosz
 
    // ME START FLOOR updatePosy
 setTimeout(() => {
  app.getSceneObjectByName('FLOOR').position.SetY(-2.4500000000000046);
 }, 800);
 // ME END FLOOR updatePosy
 
  // ME START FLOOR updatePosz
 setTimeout(() => {
  app.getSceneObjectByName('FLOOR').position.SetZ(-20.000094540456008);
 }, 800);
 // ME END FLOOR updatePosz
 
  // ME START REEL_TOP updatePosy
 setTimeout(() => {
  app.getSceneObjectByName('REEL_TOP').position.SetY(3);
 }, 800);
 // ME END REEL_TOP updatePosy
 
 // [MAIN_REPLACE2]

    })
  });

window.app = app;