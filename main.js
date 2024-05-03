import MatrixEngineWGPU from "./src/world.js";
import {downloadMeshes} from './src/engine/loader-obj.js';
import {LOG_FUNNY, LOG_INFO, LOG_MATRIX} from "./src/engine/utils.js";
import {dices, myDom} from "./examples/games/jamb/jamb.js";

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

  application.dices = dices;

  // this code must be on top
  application.matrixAmmo.detectCollision = function() {
    this.lastRoll = '';
    this.presentScore = '';
    let dispatcher = this.dynamicsWorld.getDispatcher();
    let numManifolds = dispatcher.getNumManifolds();
    for(let i = 0;i < numManifolds;i++) {
      let contactManifold = dispatcher.getManifoldByIndexInternal(i);
      // let numContacts = contactManifold.getNumContacts();
      if(this.ground.kB == contactManifold.getBody0().kB ||
        this.ground.kB == contactManifold.getBody1().kB) {
        // console.log(this.ground ,'GROUND IS IN CONTACT WHO IS BODY1 ', contactManifold.getBody1())
        // CHECK ROTATION BEST WAY - VISAL PART IS NOT INTEREST NOW 
        if(this.ground.kB == contactManifold.getBody0().kB) {
          var MY_DICE_NAME = this.getNameByBody(contactManifold.getBody1());
          var testR = contactManifold.getBody1().getWorldTransform().getRotation();
        }
        if(this.ground.kB == contactManifold.getBody1().kB) {
          var MY_DICE_NAME = this.getNameByBody(contactManifold.getBody0());
          var testR = contactManifold.getBody0().getWorldTransform().getRotation();
        }
        var passed = false;
        if(Math.abs(testR.y()) < 0.00001) {
          this.lastRoll = "1";
          this.presentScore += 4;
          passed = true;
        }
        if(Math.abs(testR.x()) < 0.00001) {
          this.lastRoll = "5";
          this.presentScore += 3;
          passed = true;
        }
        if(testR.x().toString().substring(0, 5) == testR.y().toString().substring(1, 6)) {
          this.lastRoll = "6";
          this.presentScore += 2;
          passed = true;
        }
        if(testR.x().toString().substring(0, 5) == testR.y().toString().substring(0, 5)) {
          this.lastRoll = "2";
          this.presentScore += 1;
          passed = true;
        }
        if(testR.z().toString().substring(0, 5) == testR.y().toString().substring(1, 6)) {
          this.lastRoll = "4";
          this.presentScore += 6;
          passed = true;
        }
        if(testR.z().toString().substring(0, 5) == testR.y().toString().substring(0, 5)) {
          this.lastRoll = "5";
          this.presentScore += 5;
          passed = true;
        }
        if (passed == true) dispatchEvent(new CustomEvent(`dice-${this.lastRoll}`, {
          detail: {
            result: `dice-${this.lastRoll}`,
            cubeId: MY_DICE_NAME
          }
        }))
      }
    }
  }

  addEventListener('AmmoReady', () => {
    downloadMeshes({
      mainTitle: "./res/meshes/jamb/jamb-title.obj",
      cube: "./res/meshes/jamb/dice.obj",
    }, onLoadObj, { scale: [1,1,1], swap: [null] })

    downloadMeshes({
      bg: "./res/meshes/jamb/bg.obj",
    }, onLoadObjOther, { scale: [1,1,1], swap: [null] })

  })

  function onLoadObjOther(m) {
    application.myLoadedMeshes = m;
    for(var key in m) {
      console.log(`%c Loaded objs -> : ${key} `, LOG_MATRIX);
    }

    application.addMeshObj({
      scale: [2,3,1],
      position: {x: 0, y: 6, z: -10},
      rotation: {x: 0, y: 0, z: 0},
      // rotationSpeed: {x: 0, y: 0, z: 0},
      texturesPaths: ['./res/meshes/jamb/bg.png'],
      name: 'bg',
      mesh: m.bg,
      physics: {
        collide: false,
        mass: 0,
        enabled: true,
        geometry: "Cube"
      }
    })
  }

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
      position: {x: -5, y: 4, z: -14},
      rotation: {x: 0, y: 0, z: 0},
      rotationSpeed: {x: 0, y: 0, z: 0},
      texturesPaths: ['./res/meshes/jamb/dice.png'],
      useUVShema4x2: true,
      name: 'CubePhysics2',
      mesh: m.cube,
      physics: {
        enabled: true,
        geometry: "Cube"
      }
    })

    application.addMeshObj({
      position: {x: 4, y: 8, z: -10},
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
      position: {x: -2, y: 4, z: -13},
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
      position: {x: -4, y: 6, z: -9},
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
      position: {x: 0, y: 6, z: -16},
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




    let TOLERANCE = 0;

    let allDiceDoneProcedure = () => {
      console.log("ALL DONE")
      TOLERANCE++;

      if (TOLERANCE > 1000) {
      removeEventListener('dice-1', dice1Click)
      removeEventListener('dice-2', dice2Click)
      removeEventListener('dice-3', dice3Click)
      removeEventListener('dice-4', dice4Click)
      removeEventListener('dice-5', dice5Click)
      removeEventListener('dice-6', dice6Click)
      console.log('FINAL : ',  dices.R)
      }
    };

    addEventListener('all-done', allDiceDoneProcedure)

    //
    let dice1Click = (e) => {
      console.info('DICE 1', e.detail)
      var info = {
        detail: e.detail,
        dice: 'dice-1'
      };
      dices.R[e.detail.cubeId] = '1';
      dices.checkAll()

      // removeEventListener('dice-1', dice1Click)
    };
    addEventListener('dice-1', dice1Click)

    let dice2Click = (e) => {
      // console.info('DICE 2', e.detail)
      var info = {
        detail: e.detail,
        dice: 'dice-2'
      };
      dices.R[e.detail.cubeId] = '2';
      dices.checkAll()
      // dices.R.push(info)

      // if(dices.R.length > 6) {
      //   dispatchEvent(new CustomEvent('all-done', {detail: {}}))
      //   // removeEventListener('dice-2', dice2Click)
      // }
      // removeEventListener('dice-2', dice2Click)
    };
    addEventListener('dice-2', dice2Click)

    let dice3Click = (e) => {
      // console.info('DICE 3', e.detail)
      var info = {
        detail: e.detail,
        dice: 'dice-3'
      };

      dices.R[e.detail.cubeId] = '3';
      dices.checkAll()
      // dices.R.push(info)

      // if(dices.R.length == 6) {
      //   dispatchEvent(new CustomEvent('all-done', {detail: {}}))
      //   removeEventListener('dice-3', dice3Click)
      // }
      // removeEventListener('dice-3', dice3Click)
    };
    addEventListener('dice-3', dice3Click)

    let dice4Click = (e) => {
      // console.info('DICE 4', e.detail)
      var info = {
        detail: e.detail,
        dice: 'dice-4'
      };
      dices.R[e.detail.cubeId] = '4';
      dices.checkAll()
      // dices.R.push(info)

      // if(dices.R.length == 6) {
      //   dispatchEvent(new CustomEvent('all-done', {detail: {}}))
      //   // removeEventListener('dice-4', dice4Click)
      // }
      // removeEventListener('dice-4', dice4Click)
    }
    addEventListener('dice-4', dice4Click)

    let dice5Click = (e) => {
      // console.info('DICE 5', e.detail)
      var info = {
        detail: e.detail,
        dice: 'dice-5'
      };
      dices.R[e.detail.cubeId] = '5';
      dices.checkAll()
      // dices.R.push(info)

      // if(dices.R.length == 6) {
      //   dispatchEvent(new CustomEvent('all-done', {detail: {}}))
      //   // removeEventListener('dice-5', diceClick5)
      // }
      // removeEventListener('dice-5', diceClick5)
    }
    addEventListener('dice-5', dice5Click)

    let dice6Click = (e) => {
      // console.info('DICE 6', e.detail)
      var info = {
        detail: e.detail,
        dice: 'dice-6'
      };

      dices.R[e.detail.cubeId] = '6';
      dices.checkAll()
      // dices.R.push(info)
      // if(dices.R.length == 6) {
      //   dispatchEvent(new CustomEvent('all-done', {detail: {}}))
      //   // removeEventListener('dice-6', dice6Click)
      // }
      // removeEventListener('dice-6', dice6Click)
    }
    addEventListener('dice-6', dice6Click)


    // console.log('camera set')
    // application.cameras.WASD.pitch = 0.2
    setTimeout(() => {
      app.cameras.WASD.velocity[1] = 18
      //                                             BODY              , x,  y, z, rotX, rotY, RotZ
      app.matrixAmmo.setKinematicTransform(app.matrixAmmo.rigidBodies[6], 0, 0, 0, 1)
      app.matrixAmmo.setKinematicTransform(app.matrixAmmo.rigidBodies[7], 0, -10, 0, 0, 0, 0)
      // Better access getBodyByName
      console.log(' app.matrixAmmo. ', app.matrixAmmo.getBodyByName('CubePhysics1'))
    }, 1225)
  }
})

window.app = application