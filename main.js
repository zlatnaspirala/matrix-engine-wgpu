import MatrixEngineWGPU from "./src/world.js";
import {downloadMeshes} from './src/engine/loader-obj.js';
import {LOG_FUNNY, LOG_INFO, LOG_MATRIX} from "./src/engine/utils.js";
// change this after in examples folder
import {myDom} from "./examples/games/jamb/jamb.js";

console.log(' pre ucitavanje')

export let application = new MatrixEngineWGPU({
  useSingleRenderPass: true,
  canvasSize: 'fullscreen',
  mainCameraParams: {
    type: 'WASD',
    responseCoef: 1000
  }
}, () => {
  // Dom operations
  myDom.createJamb();

  addEventListener('AmmoReady', () => {
    downloadMeshes({
      mainTitle: "./res/meshes/jamb/jamb-title.obj",
      cube: "./res/meshes/jamb/dice.obj",
      bg: "./res/meshes/jamb/bg.obj",
    }, onLoadObj)
  })

  function onLoadObj(m) {
    application.myLoadedMeshes = m;
    for(var key in m) {
      console.log(`%c Loaded objs -> : ${key} `, LOG_MATRIX);
    }

    // Add dices
    application.addMeshObj({
      position: {x: 0, y: 6, z: -10},
      rotation: {x: 0, y: 0, z: 0},
      rotationSpeed: {x: 0, y: 0, z: 0},
      texturesPaths: ['./res/meshes/jamb/dice.png'],
      useUVShema4x2: true,
      name: 'CubePhysics0',
      mesh: m.cube,
      physics: {
        enabled: true,
        geometry: "Cube"
      }
    })

    application.addMeshObj({
      position: {x: 0, y: 4, z: -10},
      rotation: {x: 0, y: 0, z: 0},
      rotationSpeed: {x: 0, y: 0, z: 0},
      texturesPaths: ['./res/meshes/jamb/dice-mark.png'],
      useUVShema4x2: true,
      name: 'CubePhysics2',
      mesh: m.cube,
      physics: {
        enabled: true,
        geometry: "Cube"
      }
    })

    application.addMeshObj({
      position: {x: 0, y: 4, z: -10},
      rotation: {x: 0, y: 0, z: 0},
      rotationSpeed: {x: 0, y: 0, z: 0},
      texturesPaths: ['./res/meshes/jamb/dice.png'],
      useUVShema4x2: true,
      name: 'CubePhysics3',
      mesh: m.cube,
      physics: {
        enabled: true,
        geometry: "Cube"
      }
    })

    application.addMeshObj({
      position: {x: 3, y: 4, z: -10},
      rotation: {x: 0, y: 0, z: 0},
      rotationSpeed: {x: 0, y: 0, z: 0},
      texturesPaths: ['./res/meshes/jamb/dice.png'],
      useUVShema4x2: true,
      name: 'CubePhysics4',
      mesh: m.cube,
      physics: {
        enabled: true,
        geometry: "Cube"
      }
    })

    application.addMeshObj({
      position: {x: -2, y: 4, z: -10},
      rotation: {x: 0, y: 0, z: 0},
      rotationSpeed: {x: 0, y: 0, z: 0},
      texturesPaths: ['./res/meshes/jamb/dice.png'],
      useUVShema4x2: true,
      name: 'CubePhysics5',
      mesh: m.cube,
      physics: {
        enabled: true,
        geometry: "Cube"
      }
    })

    application.addMeshObj({
      position: {x: 0, y: 1, z: -10},
      rotation: {x: 0, y: 0, z: 0},
      rotationSpeed: {x: 0, y: 0, z: 0},
      texturesPaths: ['./res/meshes/jamb/dice.png'],
      useUVShema4x2: true,
      name: 'CubePhysics6',
      mesh: m.cube,
      physics: {
        enabled: true,
        geometry: "Cube"
      }
    })

    // Add logo text top
    application.addMeshObj({
      position: {x: 0, y: 6, z: -10},
      rotation: {x: 0, y: 0, z: 0},
      texturesPaths: ['./res/meshes/jamb/text.png'],
      name: 'mainTitle',
      mesh: m.mainTitle,
      physics: {
        mass: 0,
        enabled: true,
        geometry: "Cube"
      }
    })

    application.addMeshObj({
      position: {x: 0, y: 6, z: -10},
      rotation: {x: 0, y: 0, z: 0},
      // rotationSpeed: {x: 0, y: 0, z: 0},
      texturesPaths: ['./res/meshes/jamb/bg.png'],
      name: 'bg',
      mesh: m.bg,
      physics: {
        mass: 0,
        enabled: true,
        geometry: "Cube"
      }
    })

    console.log('camera set')
    // application.cameras.WASD.pitch = 0.2
    setTimeout(()=> {
      app.cameras.WASD.velocity[1] = 18

      
      //                                             BODY              , x,  y, z, rotX, rotY, RotZ
      app.matrixAmmo.setKinematicTransform(app.matrixAmmo.rigidBodies[6], 0, 0, 0, 1)

      app.matrixAmmo.setKinematicTransform(app.matrixAmmo.rigidBodies[7], 0, -10, 0, 0, 0, 0)

      // Better access getBodyByName
      console.log(' app.matrixAmmo. ',  app.matrixAmmo.getBodyByName('CubePhysics2') )

    }, 1225)

  }
})

window.app = application