import MatrixEngineWGPU from "./src/world.js";
import {downloadMeshes} from './src/engine/loader-obj.js';
import {byId, LOG_FUNNY, LOG_INFO, LOG_MATRIX, mb, randomFloatFromTo, randomIntFromTo} from "./src/engine/utils.js";
import {dices, myDom} from "./examples/games/jamb/jamb.js";
import {addRaycastsAABBListener, addRaycastsListener, touchCoordinate, rayIntersectsSphere, getRayFromMouse} from "./src/engine/raycast.js";

export let application = new MatrixEngineWGPU({
  useSingleRenderPass: true,
  canvasSize: 'fullscreen',
  mainCameraParams: {
    type: 'WASD',
    responseCoef: 1000
  }
}, () => {

  application.addLight();
  console.log('light added.')
  application.lightContainer[0].outerCutoff = 0.5;
  application.lightContainer[0].position[2] = -10;
  application.lightContainer[0].intensity = 2;
  application.lightContainer[0].target[2] = -25;
  application.lightContainer[0].position[1] = 9;
  application.globalAmbient[0] = 0.7;
  application.globalAmbient[1] = 0.7;
  application.globalAmbient[2] = 0.7;

  const diceTexturePath = './res/meshes/jamb/dice.png';

  // Dom operations
  application.userState = {
    name: 'Guest',
    points: 0
  };
  application.myDom = myDom;
  myDom.createJamb();
  myDom.addDraggerForTable();
  myDom.createBlocker();
  application.dices = dices;

  application.activateDiceClickListener = null;

  // -------------------------
  // TEST
  application.matrixAmmo.detectTopFaceFromQuat = (q) => {
    // Define based on *visual face* → object-space normal mapping
    const faces = [
      {face: 1, vec: [0, 1, 0]},   // top
      {face: 2, vec: [0, -1, 0]},  // bottom
      {face: 3, vec: [0, 0, 1]},   // front
      {face: 4, vec: [0, 0, -1]},  // back
      {face: 5, vec: [1, 0, 0]},   // right
      {face: 6, vec: [-1, 0, 0]}   // left
    ];

    let maxDot = -Infinity;
    let topFace = null;

    for(const f of faces) {
      const v = application.matrixAmmo.applyQuatToVec(q, f.vec);
      const dot = v.y; // Compare with world up (0, 1, 0)
      if(dot > maxDot) {
        maxDot = dot;
        topFace = f.face;
      }
    }

    return topFace;
  };

  application.matrixAmmo.applyQuatToVec = (q, vec) => {
    const [x, y, z] = vec;
    const qx = q.x(), qy = q.y(), qz = q.z(), qw = q.w();

    // Quaternion * vector * inverse(quaternion)
    const ix = qw * x + qy * z - qz * y;
    const iy = qw * y + qz * x - qx * z;
    const iz = qw * z + qx * y - qy * x;
    const iw = -qx * x - qy * y - qz * z;

    return {
      x: ix * qw + iw * -qx + iy * -qz - iz * -qy,
      y: iy * qw + iw * -qy + iz * -qx - ix * -qz,
      z: iz * qw + iw * -qz + ix * -qy - iy * -qx
    };
  }
  // -------------------------
  // This code must be on top (Physics)
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
        const face = application.matrixAmmo.detectTopFaceFromQuat(testR);
        if(face) {
          this.lastRoll = face.toString();
          // Update score logic
          dispatchEvent(new CustomEvent(`dice-${face}`, {detail: {result: `dice-${face}`, cubeId: MY_DICE_NAME}}));
        }
        // if(Math.abs(testR.y()) < 0.00001) {
        //   this.lastRoll = "3";
        //   this.presentScore += 4;
        //   passed = true;
        // }
        // if(Math.abs(testR.x()) < 0.00001) {
        //   this.lastRoll = "5";
        //   this.presentScore += 3;
        //   passed = true;
        // }
        // if(testR.x().toString().substring(0, 5) == testR.y().toString().substring(1, 6)) {
        //   this.lastRoll = "6";
        //   this.presentScore += 2;
        //   passed = true;
        // }
        // if(testR.x().toString().substring(0, 5) == testR.y().toString().substring(0, 5)) {
        //   this.lastRoll = "2";
        //   this.presentScore += 1;
        //   passed = true;
        // }
        // if(testR.z().toString().substring(0, 5) == testR.y().toString().substring(1, 6)) {
        //   this.lastRoll = "4";
        //   this.presentScore += 6;
        //   passed = true;
        // }
        // if(testR.z().toString().substring(0, 5) == testR.y().toString().substring(0, 5)) {
        //   this.lastRoll = "1";
        //   this.presentScore += 5;
        //   passed = true;
        // }
        // if(passed == true) dispatchEvent(new CustomEvent(`dice-${this.lastRoll}`, {
        //   detail: {
        //     result: `dice-${this.lastRoll}`,
        //     cubeId: MY_DICE_NAME
        //   }
        // }))
      }
    }
  }

  addRaycastsListener();
  // addRaycastsAABBListener();

  application.canvas.addEventListener("ray.hit.event", (e) => {
    console.log('ray.hit.event @@@@@@@@@@@@ detected');

    if(byId('topTitleDOM') && byId('topTitleDOM').getAttribute('data-gamestatus') != 'FREE' &&
      byId('topTitleDOM').getAttribute('data-gamestatus') != 'status-select') {
      console.log('no hit in middle of game ...');
      return;
    }

    if(application.dices.STATUS == "FREE_TO_PLAY") {
      console.log("hit cube status free to play prevent pick. ", e.detail.hitObject.name)
    } else if(application.dices.STATUS == "SELECT_DICES_1" ||
      application.dices.STATUS == "SELECT_DICES_2" ||
      application.dices.STATUS == "FINISHED") {

      if(Object.keys(application.dices.SAVED_DICES).length >= 5) {
        console.log("PREVENTED SELECT1/2 pick.", e.detail.hitObject.name)
        return;
      }
      console.log("hit cube status SELECT1/2 pick.", e.detail.hitObject.name)
      application.dices.pickDice(e.detail.hitObject.name)
    }
  });

  addEventListener('mousemove', (e) => {
    // console.log('only on click')

  })

  // Sounds
  application.matrixSounds.createAudio('start', 'res/audios/start.mp3', 1)
  application.matrixSounds.createAudio('block', 'res/audios/block.mp3', 6)
  application.matrixSounds.createAudio('dice1', 'res/audios/dice1.mp3', 6)
  application.matrixSounds.createAudio('dice2', 'res/audios/dice2.mp3', 6)
  application.matrixSounds.createAudio('hover', 'res/audios/toggle_002.mp3', 3)
  application.matrixSounds.createAudio('roll', 'res/audios/dice-roll.mp3', 2)

  addEventListener('AmmoReady', () => {

    app.matrixAmmo.speedUpSimulation = 2;

    downloadMeshes({
      cube: "./res/meshes/jamb/dice.obj",
    }, onLoadObj, {scale: [1, 1, 1], swap: [null]})

    // downloadMeshes({
    //   star1: "./res/meshes/shapes/star1.obj",
    // }, (m) => {

    //   let o = {
    //     scale: 2,
    //     position: {x: 3, y: 0, z: -10},
    //     rotation: {x: 0, y: 0, z: 0},
    //     rotationSpeed: {x: 10, y: 0, z: 0},
    //     texturesPaths: ['./res/textures/default.png']
    //   };
    // }, {scale: [11, 11, 11], swap: [null]})

    downloadMeshes({
      bg: "./res/meshes/jamb/bg.obj",
    }, onLoadObjFloor, {scale: [3, 1, 3], swap: [null]})

    downloadMeshes({
      mainTitle: "./res/meshes/jamb/jamb-title.obj",
    }, onLoadObjOther, {scale: [3, 2, 3], swap: [null]})

    downloadMeshes({
      cube: "./res/meshes/jamb/dice.obj",
    }, onLoadObjWallCenter, {scale: [50, 10, 10], swap: [null]})

    downloadMeshes({
      cube: "./res/meshes/jamb/dice.obj",
    }, (m) => {
      for(var key in m) {
        // console.log(`%c Loaded objs -> : ${key} `, LOG_MATRIX);
      }
      // right
      application.addMeshObj({
        position: {x: 25, y: 5.5, z: -25},
        rotation: {x: 0, y: -22, z: 0},
        scale: [25, 10, 4],
        texturesPaths: ['./res/meshes/jamb/text.png'],
        name: 'wallRight',
        mesh: m.cube,
        physics: {
          mass: 0,
          enabled: true,
          geometry: "Cube"
        },
        raycast: {enabled: false, radius: 2},
      })

      application.addMeshObj({
        position: {x: -25, y: 5.5, z: -25},
        rotation: {x: 0, y: 22, z: 0},
        scale: [25, 10, 4],
        texturesPaths: ['./res/meshes/jamb/text.png'],
        name: 'wallLeft',
        mesh: m.cube,
        physics: {
          mass: 0,
          enabled: true,
          geometry: "Cube"
        },
        raycast: {enabled: false, radius: 2},
      })
    }, {scale: [25, 10, 4], swap: [null]})

  })

  function onLoadObjWallCenter(m) {
    application.myLoadedMeshesWalls = m;
    for(var key in m) {
      // console.log(`%c Loaded objs -> : ${key} `, LOG_MATRIX);
    }

    // WALLS Center
    application.addMeshObj({
      position: {x: 0, y: 5, z: -45},
      rotation: {x: 0, y: 0, z: 0},
      scale: [50, 10, 10],
      texturesPaths: ['./res/meshes/jamb/text.png'],
      name: 'wallCenter',
      mesh: m.cube,
      physics: {
        mass: 0,
        enabled: true,
        geometry: "Cube"
      },
      raycast: {enabled: false, radius: 2},
    })
  }

  function onLoadObjOther(m) {
    application.myLoadedMeshes = m;
    // Add logo text top
    application.addMeshObj({
      position: {x: 0, y: 6, z: -15},
      rotation: {x: 0, y: 0, z: 0},
      texturesPaths: ['./res/meshes/jamb/text.png'],
      name: 'mainTitle',
      mesh: m.mainTitle,
      physics: {
        mass: 0,
        enabled: true,
        geometry: "Cube"
      },
      raycast: {enabled: false, radius: 2},
    })
    // application.cameras.WASD.pitch = 0.2
    setTimeout(() => {
      // app.cameras.WASD.velocity[1] = 18
      console.log('set camera position with timeout...')
      app.cameras.WASD.yaw = -6.21;
      app.cameras.WASD.pitch = -0.32;
      app.cameras.WASD.position[2] = 0;
      app.cameras.WASD.position[1] = 3.76;
      //                                             BODY              , x,  y, z, rotX, rotY, RotZ
      app.matrixAmmo.setKinematicTransform(
        app.matrixAmmo.getBodyByName('mainTitle'), 0, 0, 0, 1)
      app.matrixAmmo.setKinematicTransform(
        app.matrixAmmo.getBodyByName('bg'), 0, -10, 0, 0, 0, 0)
      // Better access getBodyByName
      // console.log(' app.matrixAmmo. ', app.matrixAmmo.getBodyByName('CubePhysics1'))
    }, 1200)
  }

  function onLoadObjFloor(m) {
    application.myLoadedMeshes = m;
    application.addMeshObj({
      scale: [10, 0.1, 0.1],
      position: {x: 0, y: 6, z: -10},
      rotation: {x: 0, y: 0, z: 0},
      texturesPaths: ['./res/meshes/jamb/bg.png'],
      name: 'bg',
      mesh: m.bg,
      physics: {
        collide: false,
        mass: 0,
        enabled: true,
        geometry: "Cube"
      },
      raycast: {enabled: false, radius: 2},
    })
  }

  function onLoadObj(m) {
    application.myLoadedMeshes = m;
    // Add dices
    application.addMeshObj({
      position: {x: 0, y: 6, z: -10},
      rotation: {x: 0, y: 0, z: 0},
      rotationSpeed: {x: 0, y: 0, z: 0},
      texturesPaths: [diceTexturePath],
      useUVShema4x2: true,
      name: 'CubePhysics1',
      mesh: m.cube,
      raycast: {enabled: true, radius: 2},
      physics: {
        enabled: true,
        geometry: "Cube"
      }
    })

    application.addMeshObj({
      position: {x: -5, y: 4, z: -14},
      rotation: {x: 0, y: 0, z: 0},
      rotationSpeed: {x: 0, y: 0, z: 0},
      texturesPaths: [diceTexturePath],
      useUVShema4x2: true,
      name: 'CubePhysics2',
      mesh: m.cube,
      raycast: {enabled: true, radius: 2},
      physics: {
        enabled: true,
        geometry: "Cube"
      }
    })

    application.addMeshObj({
      position: {x: 4, y: 8, z: -10},
      rotation: {x: 0, y: 0, z: 0},
      rotationSpeed: {x: 0, y: 0, z: 0},
      texturesPaths: [diceTexturePath],
      useUVShema4x2: true,
      name: 'CubePhysics3',
      mesh: m.cube,
      raycast: {enabled: true, radius: 2},
      physics: {
        enabled: true,
        geometry: "Cube"
      }
    })

    application.addMeshObj({
      position: {x: 3, y: 4, z: -10},
      rotation: {x: 0, y: 0, z: 0},
      rotationSpeed: {x: 0, y: 0, z: 0},
      texturesPaths: [diceTexturePath],
      useUVShema4x2: true,
      name: 'CubePhysics4',
      mesh: m.cube,
      raycast: {enabled: true, radius: 2},
      physics: {
        enabled: true,
        geometry: "Cube"
      }
    })

    application.addMeshObj({
      position: {x: -2, y: 4, z: -13},
      rotation: {x: 0, y: 0, z: 0},
      rotationSpeed: {x: 0, y: 0, z: 0},
      texturesPaths: [diceTexturePath],
      useUVShema4x2: true,
      name: 'CubePhysics5',
      mesh: m.cube,
      raycast: {enabled: true, radius: 2},
      physics: {
        enabled: true,
        geometry: "Cube"
      }
    })

    application.addMeshObj({
      position: {x: -4, y: 6, z: -9},
      rotation: {x: 0, y: 0, z: 0},
      rotationSpeed: {x: 0, y: 0, z: 0},
      texturesPaths: [diceTexturePath],
      useUVShema4x2: true,
      name: 'CubePhysics6',
      mesh: m.cube,
      raycast: {enabled: true, radius: 2},
      physics: {
        enabled: true,
        geometry: "Cube"
      }
    })

    application.TOLERANCE = 0;
    let allDiceDoneProcedure = () => {
      console.log("ALL DONE", application.TOLERANCE)
      application.TOLERANCE++;
      if(application.TOLERANCE >= 1) {
        removeEventListener('dice-1', dice1Click)
        removeEventListener('dice-2', dice2Click)
        removeEventListener('dice-3', dice3Click)
        removeEventListener('dice-4', dice4Click)
        removeEventListener('dice-5', dice5Click)
        removeEventListener('dice-6', dice6Click)
        console.log(`%cFINAL<preliminar> ${dices.R}`, LOG_FUNNY)
        application.TOLERANCE = 0;
        console.log('se camera position 2')
        app.cameras.WASD.yaw = 0.01;
        app.cameras.WASD.pitch = -1.26;
        app.cameras.WASD.position[2] = -18;
        app.cameras.WASD.position[1] = 19;
        // ??                                                     ?
        if(dices.STATUS == "FREE_TO_PLAY" || dices.STATUS == "IN_PLAY") {
          dices.STATUS = "SELECT_DICES_1";
          console.log(`%cStatus<SELECT_DICES_1>`, LOG_FUNNY)
          setTimeout(() => {
            dispatchEvent(new CustomEvent('updateTitle',
              {
                detail: {
                  text: app.label.get.freetoroll,
                  status: 'FREE'
                }
              }));
          }, 500);
        } else if(dices.STATUS == "SELECT_DICES_1") {
          dices.STATUS = "SELECT_DICES_2";
          setTimeout(() => {
            dispatchEvent(new CustomEvent('updateTitle',
              {
                detail: {
                  text: app.label.get.freetoroll,
                  status: 'FREE'
                }
              }));
          }, 500);
          console.log(`%cStatus<SELECT_DICES_2>`, LOG_FUNNY)
        } else if(dices.STATUS == "SELECT_DICES_2") {
          dices.STATUS = "FINISHED";
          console.log(`%cStatus<FINISHED>`, LOG_FUNNY)
          dispatchEvent(new CustomEvent('updateTitle',
            {
              detail: {
                text: app.label.get.pick5,
                status: 'status-select'
              }
            }));
        }
      }
    };

    addEventListener('all-done', allDiceDoneProcedure);

    addEventListener('FREE_TO_PLAY', () => {
      // Big reset
      console.log(`%c<Big reset needed ...>`, LOG_FUNNY)
      app.dices.SAVED_DICES = {};
      app.dices.setStartUpPosition();
      setTimeout(() => {
        app.dices.activateAllDicesPhysics();
      }, 1000);

      // console.log('se camera position 3')
      app.cameras.WASD.yaw = 0;
      app.cameras.WASD.pitch = 0;
      app.cameras.WASD.position[2] = 0;
      app.cameras.WASD.position[1] = 3.76;

      dispatchEvent(new CustomEvent('updateTitle',
        {
          detail: {
            text: app.label.get.hand1,
            status: 'FREE'
          }
        }));
    })

    // ACTIONS
    let dice1Click = (e) => {
      // console.info('DICE 1 click ?????????', e.detail)
      dices.R[e.detail.cubeId] = '1';
      dices.checkAll()
    };

    let dice2Click = (e) => {
      // console.info('DICE 2', e.detail)
      dices.R[e.detail.cubeId] = '2';
      dices.checkAll()
    };

    let dice3Click = (e) => {
      // console.info('DICE 3', e.detail)
      dices.R[e.detail.cubeId] = '3';
      dices.checkAll()
    };

    let dice4Click = (e) => {
      // console.info('DICE 4', e.detail)
      dices.R[e.detail.cubeId] = '4';
      dices.checkAll()
    }

    let dice5Click = (e) => {
      // console.info('DICE 5', e.detail)
      dices.R[e.detail.cubeId] = '5';
      dices.checkAll()
    }

    let dice6Click = (e) => {
      // console.info('DICE 6', e.detail)
      dices.R[e.detail.cubeId] = '6';
      dices.checkAll()
    }

    function shootDice(x) {
      setTimeout(() => {
        app.matrixAmmo.getBodyByName(`CubePhysics${x}`).setAngularVelocity(new Ammo.btVector3(
          randomFloatFromTo(3, 12), 9, 9
        ))
        app.matrixAmmo.getBodyByName(`CubePhysics${x}`).setLinearVelocity(new Ammo.btVector3(
          randomFloatFromTo(-5, 5), 15, -20
        ))
        setTimeout(() => app.matrixSounds.play('roll'), 1500)
      }, 200 * x)
    }

    application.activateDiceClickListener = (index) => {
      index = parseInt(index);
      switch(index) {
        case 1:
          addEventListener('dice-1', dice1Click)
        case 2:
          addEventListener('dice-2', dice2Click)
        case 3:
          addEventListener('dice-3', dice3Click)
        case 4:
          addEventListener('dice-4', dice4Click)
        case 5:
          addEventListener('dice-5', dice5Click)
        case 6:
          addEventListener('dice-6', dice6Click)
      }
    };

    let rollProcedure = () => {
      if(topTitleDOM.getAttribute('data-gamestatus') != 'FREE') {
        console.log('validation fails...');
        return;
      }
      if(dices.STATUS == "FREE_TO_PLAY") {
        app.matrixSounds.play('start')
        dices.STATUS = "IN_PLAY";
        dispatchEvent(new CustomEvent('updateTitle',
          {
            detail: {
              text: app.label.get.hand1,
              status: 'inplay'
            }
          }));
        addEventListener('dice-1', dice1Click)
        addEventListener('dice-2', dice2Click)
        addEventListener('dice-3', dice3Click)
        addEventListener('dice-4', dice4Click)
        addEventListener('dice-5', dice5Click)
        addEventListener('dice-6', dice6Click)

        for(var x = 1;x < 7;x++) {
          shootDice(x)
        }
      } else if(dices.STATUS == "SELECT_DICES_1" || dices.STATUS == "SELECT_DICES_2") {
        // Now no selected dices still rolling
        for(let i = 1;i <= 6;i++) {
          const key = "CubePhysics" + i;
          if(!(key in app.dices.SAVED_DICES)) {
            console.log("Still in game last char is id : ", key[key.length - 1]);
            application.activateDiceClickListener(parseInt(key[key.length - 1]))
            shootDice(key[key.length - 1])
          } else {
            console.log("??????????Still in game last char is id : ", key[key.length - 1]);
            application.activateDiceClickListener(parseInt(key[key.length - 1]))
          }
        }
        // ????
        // application.activateDiceClickListener(1);

        dispatchEvent(new CustomEvent('updateTitle',
          {
            detail: {
              text: dices.STATUS == "SELECT_DICES_1" ? app.label.get.hand1 : app.label.get.hand2,
              status: 'inplay'
            }
          }));

      } else if(dices.STATUS == "FINISHED") {
        mb.error('No more roll...');
        mb.show('Pick up 5 dices');
      }
    }

    addEventListener('DICE.ROLL', rollProcedure)
    app.ROLL = () => {
      dispatchEvent(new CustomEvent('DICE.ROLL', {}))
    }
  }
})

window.app = application