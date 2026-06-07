import MatrixEngineWGPU from "./src/world.js";
import {downloadMeshes} from './src/engine/loader-obj.js';
import {byId, LOG_FUNNY, mb, randomFloatFromTo} from "./src/engine/utils.js";
import {dices, myDom} from "./examples/games/jamb/jamb-script.js";
import {addRaycastsAABBListener, addRaycastsListener} from "./src/engine/raycast.js";

export let application = new MatrixEngineWGPU({
  useSingleRenderPass: true,
  canvasSize: 'fullscreen',
  useCannon: true,
  MAX_SPOTLIGHTS: 1,
  MAX_BONES: 0,
  mainCameraParams: {
    type: 'WASD',
    responseCoef: 1000
  }
}, () => {

  application.updateTitleEvent = new CustomEvent('updateTitle', {
    detail: {text: '', status: 'FREE'}
  });
  application.DICE_ROLL_EVENT = new CustomEvent('DICE.ROLL', {});

  application.addLight();
  application.lightContainer[0].outerCutoff = 0.5;
  application.lightContainer[0].setPosZ(-16);
  application.lightContainer[0].setIntensity(6);
  application.lightContainer[0].setTargetZ(-20);
  application.lightContainer[0].setPosY(9);
  application.globalAmbient[0] = 0.7;
  application.globalAmbient[1] = 0.7;
  application.globalAmbient[2] = 0.7;
  application.activateBloomEffect();
  application.bloomPass.setIntensity(1);
  application.bloomPass.setBlurRadius(2);

  const diceTexturePath = './res/meshes/jamb/dice.png';

  // Dom operations
  application.userState = {
    name: 'Guest',
    points: 0
  };
  application.myDom = myDom;
  application.dices = dices;
  application.activateDiceClickListener = null;

  // Detect which face is on top from a plain quaternion {x, y, z, w}
  // application.matrixPhysics.detectTopFaceFromQuat = (q) => {

  //   // 1. Get the direction each face is pointing in World Space
  //   const worldRight = new CANNON.Vec3(1, 0, 0);
  //   const worldUp    = new CANNON.Vec3(0, 1, 0);
  //   const worldFwd   = new CANNON.Vec3(0, 0, 1);

  //   // 2. Rotate these by the body's orientation
  //   body.quaternion.vmult(worldRight, worldRight);
  //   body.quaternion.vmult(worldUp, worldUp);
  //   body.quaternion.vmult(worldFwd, worldFwd);

  //   // 3. The face with the highest Y value (pointing at the sky) is the winner
  //   const candidates = [
  //       { face: 1, vec: worldUp },    // Top
  //       { face: 6, vec: worldUp.negate() }, // Bottom
  //       { face: 2, vec: worldRight }, // Right
  //       { face: 5, vec: worldRight.negate() }, // Left
  //       { face: 3, vec: worldFwd },   // Front
  //       { face: 4, vec: worldFwd.negate() }    // Back
  //   ];

  //   return candidates.reduce((best, current) => 
  //       current.vec.y > best.vec.y ? current : best
  //   ).face;

  //   return;
  //   const faces = [
  //     {face: 1, vec: [0, 1, 0]},
  //     {face: 2, vec: [0, -1, 0]},
  //     {face: 3, vec: [0, 0, 1]},
  //     {face: 4, vec: [0, 0, -1]},
  //     {face: 5, vec: [1, 0, 0]},
  //     {face: 6, vec: [-1, 0, 0]}
  //   ];

  //   let maxDot = -Infinity;
  //   let topFace = null;

  //   for(const f of faces) {
  //     const v = application.matrixPhysics.applyQuatToVec(q, f.vec);
  //     if(v.y > maxDot) {
  //       maxDot = v.y;
  //       topFace = f.face;
  //     }
  //   }

  //   return topFace;
  // };

  application.matrixPhysics.applyQuatToVec = (q, vec) => {
    const [x, y, z] = vec;
    const qx = q.x, qy = q.y, qz = q.z, qw = q.w;

    const ix = qw * x + qy * z - qz * y;
    const iy = qw * y + qz * x - qx * z;
    const iz = qw * z + qx * y - qy * x;
    const iw = -qx * x - qy * y - qz * z;

    return {
      x: ix * qw + iw * -qx + iy * -qz - iz * -qy,
      y: iy * qw + iw * -qy + iz * -qx - ix * -qz,
      z: iz * qw + iw * -qz + ix * -qy - iy * -qx
    };
  };


  // This code must be on top (Physics)
  application.matrixPhysics.detectCollision = async (e) => {


    const body0Name = e.detail.body0Name;
    const body1Name = e.detail.body1Name;

    let diceName = null;

    if(body0Name === 'ground') {
      diceName = body1Name;
    }

    if(body1Name === 'ground') {
      diceName = body0Name;
    }

    console.log('..................');
    if(!diceName) return;

    // Get body id
    const bodyId = application.matrixPhysics.getBodyByName(diceName);
    if(bodyId == null) return;

    setTimeout(async () => {
      const is = await application.matrixPhysics.isSleeping(bodyId);
      if(is === false) {
        console.log(' not sleep')
        return;
      }

      const q = await application.matrixPhysics.getQuaternion(bodyId);
      if(!q) return;

      const quatPlain = {
        x: q.x,
        y: q.y,
        z: q.z,
        w: q.w
      };

      application.matrixPhysics._onGroundContact(
        diceName,
        quatPlain,
        bodyId
      );
    }, 4000)

  };

  application.matrixPhysics._onGroundContact = async (bodyName, quatPlain, bodyId) => {
    const face = await application.matrixPhysics.getDiceFace(bodyId);
    console.log('TEST FACE', face)
    if(face) {
      application.matrixPhysics.lastRoll = face.toString();
      dispatchEvent(new CustomEvent(`dice-${face}`, {
        detail: {result: `dice-${face}`, cubeId: bodyName}
      }));
    }
  };

  addRaycastsAABBListener();

  application.canvas.addEventListener("ray.hit.event", (e) => {
    console.log('ray.hit.event', byId('topTitleDOM'));
    if(byId('topTitleDOM') && byId('topTitleDOM').getAttribute('data-gamestatus') != 'FREE' &&
      byId('topTitleDOM').getAttribute('data-gamestatus') != 'status-select') {
      console.log('no hit in middle of game ...', e.detail.hitObject.name);
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

  // Sounds
  application.matrixSounds.createAudio('start', 'res/audios/start.mp3', 1)
  application.matrixSounds.createAudio('block', 'res/audios/block.mp3', 6)
  application.matrixSounds.createAudio('dice1', 'res/audios/dice1.mp3', 6)
  application.matrixSounds.createAudio('dice2', 'res/audios/dice2.mp3', 6)
  application.matrixSounds.createAudio('hover', 'res/audios/feel.mp3', 3)
  application.matrixSounds.createAudio('roll', 'res/audios/dice-roll.mp3', 2)

  addEventListener('PhysicsReady', () => {
    myDom.createJamb();
    myDom.addDraggerForTable();
    myDom.createBlocker();
    app.matrixPhysics.speedUpSimulation(2);

    downloadMeshes({
      cube: "./res/meshes/jamb/dice.obj",
    }, onLoadObj, {scale: [0.5, 0.5, 0.5], swap: [null]})

    downloadMeshes({
      bg: "./res/meshes/shapes/cube.obj",
    }, onLoadObjFloor, {scale: [1, 1, 1], swap: [null]})

    downloadMeshes({
      mainTitle: "./res/meshes/jamb/jamb-title.obj",
    }, onLoadObjOther, {scale: [3, 2, 3], swap: [null]})

    downloadMeshes({
      cube: "./res/meshes/jamb/dice.obj",
    }, onLoadObjWallCenter, {scale: [1, 1, 1], swap: [null]})

    downloadMeshes({
      cube: "./res/meshes/jamb/dice.obj",
    }, (m) => {
      // right
      application.addMeshObj({
        position: {x: 15, y: 5, z: -18},
        rotation: {x: 0, y: -22, z: 0},
        scale: [10, 10, 1],
        useScale: false,
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
        position: {x: -15, y: 5, z: -18},
        rotation: {x: 0, y: 22, z: 0},
        scale: [10, 10, 1],
        texturesPaths: ['./res/meshes/jamb/text.png'],
        name: 'wallLeft',
        useScale: false,
        mesh: m.cube,
        physics: {
          mass: 0,
          enabled: true,
          geometry: "Cube"
        },
        raycast: {enabled: false, radius: 2},
      })
    }, {scale: [1, 1, 1], swap: [null]})

  })

  function onLoadObjWallCenter(m) {
    application.myLoadedMeshesWalls = m;
    // WALL Center
    application.addMeshObj({
      position: {x: 0, y: 5, z: -22},
      rotation: {x: 0, y: 0, z: 0},
      scale: [15, 10, 2],
      useScale: false,
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
      position: {x: 0, y: 5, z: -15},
      rotation: {x: 90, y: 0, z: 0},
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
    setTimeout(() => {
      app.cameras.WASD.setYaw(-6.21);
      app.cameras.WASD.setPitch(-0.32);
      app.cameras.WASD.setZ(0);
      app.cameras.WASD.setY(3.76);
      // BODY x, y, z, rotX, rotY, RotZ
      app.matrixPhysics.setKinematicTransform(
        app.matrixPhysics.getBodyByName('mainTitle'), 0, 0, 0, 1)
      // app.matrixPhysics.setKinematicTransform(   app.matrixPhysics.getBodyByName('bg'), 0, -10, 0, 0, 0, 0)
    }, 1200);
  }

  function onLoadObjFloor(m) {
    // application.myLoadedMeshes = m;
    application.addMeshObj({
      scale: [25, 1, 25],
      position: {x: 0, y: -1, z: -10},
      rotation: {x: 0, y: 0, z: 0},
      texturesPaths: ['./res/meshes/jamb/bg.png'],
      name: 'floor',
      mesh: m.bg,
      physics: {
        // collide: false,
        mass: 0,
        enabled: false,
        geometry: "Cube"
      },
      raycast: {enabled: false, radius: 2},
    })
  }

  function onLoadObj(m, originScale) {
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
        scale: originScale,
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
        scale: originScale,
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
        scale: originScale,
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
        scale: originScale,
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
        scale: originScale,
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
        scale: originScale,
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
        app.cameras.WASD.setYaw(0.01);
        app.cameras.WASD.setPitch(-1.26);
        app.cameras.WASD.setZ(-18);
        app.cameras.WASD.setY(19);

        if(dices.STATUS == "FREE_TO_PLAY" || dices.STATUS == "IN_PLAY") {
          dices.STATUS = "SELECT_DICES_1";
          console.log(`%cStatus<SELECT_DICES_1>`, LOG_FUNNY)
          setTimeout(() => {
            app.updateTitleEvent.detail.text = app.label.get.freetoroll;
            app.updateTitleEvent.detail.status = 'FREE';
            dispatchEvent(app.updateTitleEvent);
          }, 500);
        } else if(dices.STATUS == "SELECT_DICES_1") {
          dices.STATUS = "SELECT_DICES_2";
          setTimeout(() => {
            app.updateTitleEvent.detail.text = app.label.get.freetoroll;
            app.updateTitleEvent.detail.status = 'FREE';
            dispatchEvent(app.updateTitleEvent);
          }, 500);
          console.log(`%cStatus<SELECT_DICES_2>`, LOG_FUNNY)
        } else if(dices.STATUS == "SELECT_DICES_2") {
          dices.STATUS = "FINISHED";
          console.log(`%cStatus<FINISHED>`, LOG_FUNNY)
          app.updateTitleEvent.detail.text = app.label.get.pick5;
          app.updateTitleEvent.detail.status = 'status-select';
          dispatchEvent(app.updateTitleEvent);
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

      app.cameras.WASD.setYaw(0);
      app.cameras.WASD.setPitch(0);
      app.cameras.WASD.setZ(0);
      app.cameras.WASD.setY(3.76);

      app.updateTitleEvent.detail.text = app.label.get.hand1;
      app.updateTitleEvent.detail.status = 'FREE';
      dispatchEvent(app.updateTitleEvent);
    })

    // ACTIONS
    let dice1Click = (e) => {
      // console.log('>>>>>>>> diceclick 1 :::  ', e)
      dices.R[e.detail.cubeId] = '1';
      dices.checkAll()
    };

    let dice2Click = (e) => {
      console.log('>>>>>>>> diceclick 2 :::  ', e)
      dices.R[e.detail.cubeId] = '2';
      dices.checkAll()
    };

    let dice3Click = (e) => {
      console.log('>>>>>>>> diceclick 3 :::  ', e)
      dices.R[e.detail.cubeId] = '3';
      dices.checkAll()
    };

    let dice4Click = (e) => {
      console.log('>>>>>>>> diceclick 4 :::  ', e)
      dices.R[e.detail.cubeId] = '4';
      dices.checkAll()
    }

    let dice5Click = (e) => {
      console.log('>>>>>>>> diceclick 5 :::  ', e)
      dices.R[e.detail.cubeId] = '5';
      dices.checkAll()
    }

    let dice6Click = (e) => {
      // console.info('DICE 6', e.detail)
      console.log('>>>>>>>> diceclick 6 :::  ', e)
      dices.R[e.detail.cubeId] = '6';
      dices.checkAll()
    }

    function shootDice(x) {
      setTimeout(() => {
        // app.matrixPhysics.getBodyByName(`CubePhysics${x}`).setAngularVelocity(new Ammo.btVector3(
        //   randomFloatFromTo(3, 12), 9, 9
        // ))
        // app.matrixPhysics.getBodyByName(`CubePhysics${x}`).setLinearVelocity(new Ammo.btVector3(
        //   randomFloatFromTo(-5, 5), 15, -20
        // ))
        const body = app.matrixPhysics.getBodyByName(`CubePhysics${x}`);
        app.matrixPhysics.shootBody(
          body,
          randomFloatFromTo(-5, 5), 15, -20,   // linear
          randomFloatFromTo(3, 12), 9, 9        // angular
        );
        setTimeout(() => app.matrixSounds.play('roll'), 1500);
      }, 200 * x)
    }

    application.activateDiceClickListener = (index) => {
      console.log('activateDiceClickListener ', index)
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

        app.updateTitleEvent.detail.text = app.label.get.hand1;
        app.updateTitleEvent.detail.status = 'inplay';

        console.log('app.updateTitleEvent ...');
        dispatchEvent(app.updateTitleEvent);


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
            // console.log("Still in game last char is id : ", key[key.length - 1]);
            application.activateDiceClickListener(parseInt(key[key.length - 1]))
            shootDice(key[key.length - 1])
          } else {
            application.activateDiceClickListener(parseInt(key[key.length - 1]))
          }
        }
        app.updateTitleEvent.detail.text = dices.STATUS == "SELECT_DICES_1" ? app.label.get.hand1 : app.label.get.hand2;
        app.updateTitleEvent.detail.status = 'inplay';
        dispatchEvent(app.updateTitleEvent);
      } else if(dices.STATUS == "FINISHED") {
        mb.error('No more roll...');
        mb.show('Pick up 5 dices');
      }
    }

    addEventListener('DICE.ROLL', rollProcedure)
    app.ROLL = () => {
      dispatchEvent(app.DICE_ROLL_EVENT);
    };
  }
})

window.app = application