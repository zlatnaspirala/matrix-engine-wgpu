import MatrixEngineWGPU from "./src/world.js";
import {downloadMeshes} from './src/engine/loader-obj.js';
import {LOG_FUNNY, LOG_INFO, LOG_MATRIX} from "./src/engine/utils.js";
// change this after in examples folder
import {myDom} from "./examples/games/jamb/jamb.js";

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

  // this code must be on top
  application.matrixAmmo.detectCollision = function() {
    this.lastRoll = '';
    this.presentScore = '';

    let dispatcher = this.dynamicsWorld.getDispatcher();
    let numManifolds = dispatcher.getNumManifolds();

    for(let i = 0;i < numManifolds;i++) {
      let contactManifold = dispatcher.getManifoldByIndexInternal(i);
      // let numContacts = contactManifold.getNumContacts();
      // this.rigidBodies.forEach((item) => {
      //   if(item.kB == contactManifold.getBody0().kB) {
      //     // console.log('Detected body0 =', item.name)
      //   }
      //   if(item.kB == contactManifold.getBody1().kB) {
      //     // console.log('Detected body1 =', item.name)
      //   }
      // })

      // this.getNameByBody(contactManifold.getBody1()) == 'CubePhysics1'

      if(this.ground.kB == contactManifold.getBody0().kB) {
        // console.log(this.ground ,'GROUND IS IN CONTACT WHO IS BODY1 ', contactManifold.getBody1())
        // console.log('GROUND IS IN CONTACT WHO IS BODY1 getNameByBody  ', this.getNameByBody(contactManifold.getBody1()))
        // CHECK ROTATION
        var testR = contactManifold.getBody1().getWorldTransform().getRotation();
        if(Math.abs(testR.y()) < 0.00001) {
          this.lastRoll += " 4 +";
          this.presentScore += 4;
          dispatchEvent(new CustomEvent('dice-1', {
            detail: {
              cubeId: this.getNameByBody(contactManifold.getBody1())
            }
          }));
        }
        if(Math.abs(testR.x()) < 0.00001) {
          this.lastRoll += " 3 +";
          this.presentScore += 3;
          dispatchEvent(new CustomEvent('dice-5', {
            detail: {
              cubeId: this.getNameByBody(contactManifold.getBody1())
            }
          }));
        }
        if(testR.x().toString().substring(0, 5) == testR.y().toString().substring(1, 6)) {
          this.lastRoll += " 2 +";
          this.presentScore += 2;
          dispatchEvent(new CustomEvent('dice-6', {
            detail: {
              cubeId: this.getNameByBody(contactManifold.getBody1())
            }
          }));
        }

        if(testR.x().toString().substring(0, 5) == testR.y().toString().substring(0, 5)) {
          this.lastRoll += " 1 +";
          this.presentScore += 1;
          dispatchEvent(new CustomEvent('dice-2', {
            detail: {
              cubeId: this.getNameByBody(contactManifold.getBody1())
            }
          }));
        }

        if(testR.z().toString().substring(0, 5) == testR.y().toString().substring(1, 6)) {
          this.lastRoll += " 6 +";
          this.presentScore += 6;
          dispatchEvent(new CustomEvent('dice-4', {
            detail: {
              cubeId: this.getNameByBody(contactManifold.getBody1())
            }
          }));
        }

        if(testR.z().toString().substring(0, 5) == testR.y().toString().substring(0, 5)) {
          this.lastRoll += " 5 +";
          this.presentScore += 5;
          dispatchEvent(new CustomEvent('dice-3', {
            detail: {
              cubeId: this.getNameByBody(contactManifold.getBody1())
            }
          }));
        }

        // console.log('this.lastRoll = ', this.lastRoll, ' presentScore = ', this.presentScore)
      }
    }
  }

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
      name: 'CubePhysics1',
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


    // 
    addEventListener('dice-1', (e) => {
      console.info('DICE 1', e.detail)
    })
    addEventListener('dice-2', (e) => {
      console.info('DICE 2', e.detail)
    })
    addEventListener('dice-3', (e) => {
      console.info('DICE 3', e.detail)
    })
    addEventListener('dice-4', (e) => {
      console.info('DICE 4', e.detail)
    })
    addEventListener('dice-5', (e) => {
      // console.info('DICE 5')
    })
    addEventListener('dice-6', (e) => {
      console.info('DICE 6', e.detail)
    })

    // console.log('camera set')
    // application.cameras.WASD.pitch = 0.2
    setTimeout(()=> {
      app.cameras.WASD.velocity[1] = 18
      //                                             BODY              , x,  y, z, rotX, rotY, RotZ
      app.matrixAmmo.setKinematicTransform(app.matrixAmmo.rigidBodies[6], 0, 0, 0, 1)
      app.matrixAmmo.setKinematicTransform(app.matrixAmmo.rigidBodies[7], 0, -10, 0, 0, 0, 0)
      // Better access getBodyByName
      console.log(' app.matrixAmmo. ',  app.matrixAmmo.getBodyByName('CubePhysics1') )
    }, 1225)
  }
})

window.app = application