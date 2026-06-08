import MatrixEngineWGPU from "./src/world.js";
import {downloadMeshes} from './src/engine/loader-obj.js';
import {byId, LOG_FUNNY, mb, randomFloatFromTo, randomIntFromTo} from "./src/engine/utils.js";
import {dices, myDom} from "./examples/games/jamb/jamb-script.js";
import {addRaycastsAABBListener, addRaycastsListener} from "./src/engine/raycast.js";

export let application = new MatrixEngineWGPU({
  useSingleRenderPass: true,
  canvasSize: 'fullscreen',
  useCannon: true,
  MAX_SPOTLIGHTS: 4,
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
  application.diceFaceEvents = [
    new CustomEvent(`dice-1`, {detail: {result: ``, cubeId: ''}}),
    new CustomEvent(`dice-2`, {detail: {result: ``, cubeId: ''}}),
    new CustomEvent(`dice-3`, {detail: {result: ``, cubeId: ''}}),
    new CustomEvent(`dice-4`, {detail: {result: ``, cubeId: ''}}),
    new CustomEvent(`dice-5`, {detail: {result: ``, cubeId: ''}}),
    new CustomEvent(`dice-6`, {detail: {result: ``, cubeId: ''}})
  ];

  const NUM_LIGHTS = 4;
  const ORBIT_RADIUS = 8;
  const ORBIT_SPEED = 0.6;
  const TARGET = {x: 0, y: 0, z: -10};

  const LIGHT_COLORS = [
    [10.0, 0.2, 0.2],  // red
    [1.0, 10.6, 0.1],  // orange
    [0.2, 0.2, 11.0],  // blue
    [1.0, 11.0, 0.1],  // yellow
  ];

  for(let i = 0;i < NUM_LIGHTS;i++) {
    application.addLight();

    application.lightContainer[i].outerCutoff = 0.8;
    application.lightContainer[i].setPosZ(-10);
    application.lightContainer[i].setPosX(-2 + i * 2);
    application.lightContainer[i].setIntensity(2);
    application.lightContainer[i].setTargetZ(-20);
    application.lightContainer[i].setPosY(25);
  }

  // application.addLight();


  application.makeMyLightMoveByY = () => {
    for(let i = 0;i < NUM_LIGHTS;i++) {
      const light = application.lightContainer[i];
      const angleOffset = (i / NUM_LIGHTS) * Math.PI * 2;
      const color = LIGHT_COLORS[i];
      light.setIntensity(8.5);
      light.color = color;
      // Orbit height varies slightly per light for more visual interest
      const heightOffset = Math.sin(angleOffset) * 2;
      light.setPosition(
        TARGET.x + Math.cos(angleOffset) * ORBIT_RADIUS,
        4 + heightOffset,
        TARGET.z + Math.sin(angleOffset) * ORBIT_RADIUS
      );
      light.setTarget(TARGET.x, TARGET.y, TARGET.z);

      // Each light orbits at its own phase offset
      light.orbitAngle = angleOffset;

      light.updater.push((light) => {
        light.orbitAngle += ORBIT_SPEED * 0.01;
        const height = 4 + Math.sin(light.orbitAngle + angleOffset) * 2;
        const x = TARGET.x + Math.cos(light.orbitAngle) * ORBIT_RADIUS;
        const z = TARGET.z + Math.sin(light.orbitAngle) * ORBIT_RADIUS;
        light.setPosition(x, height, z);
        light.setTarget(TARGET.x, TARGET.y, TARGET.z);
      });
    }
  }

  application.disableMyLightMoveByY = () => {

  };

  application.globalAmbient[0] = 1.7;
  application.globalAmbient[1] = .7;
  application.globalAmbient[2] = .5;
  application.activateBloomEffect();
  application.bloomPass.setIntensity(1);
  application.bloomPass.setBlurRadius(1);

  // const diceTexturePath = './res/meshes/jamb/gemini-dice.webp';
  const diceTexturePath = './res/meshes/jamb/dice3.webp';

  // Dom operations
  application.userState = {
    name: 'Guest',
    points: 0
  };
  application.myDom = myDom;
  application.dices = dices;
  application.activateDiceClickListener = null;

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

  application.matrixPhysics.detectCollision = async (e) => {
    const body0Name = e.detail.body0Name;
    const body1Name = e.detail.body1Name;
    let diceName = false;
    if(body0Name === 'ground') diceName = body1Name;
    if(body1Name === 'ground') diceName = body0Name;
    if(diceName === false) {
      console.log('prevent no ground')
      return;
    }

    const bodyId = application.matrixPhysics.getBodyByName(diceName);
    if(bodyId == null) return;

    const waitForSleep = () => new Promise((resolve) => {
      let attempts = 0;
      const check = async () => {
        attempts++;
        if(attempts > 60) {resolve(); return;} // ~10s hard timeout
        const is = await application.matrixPhysics.isSleeping(bodyId);
        if(is) {
          resolve();
        } else {
          setTimeout(check, 150);
        }
      };
      setTimeout(check, 4000); // first check after 1s
    });

    await waitForSleep();
    application.matrixPhysics._onGroundContact(diceName, bodyId);
  };

  application.matrixPhysics._onGroundContact = async (bodyName, bodyId) => {
    const face = await application.matrixPhysics.getDiceFace(bodyId);
    console.log('FACE: ', face)
    if(face) {
      application.matrixPhysics.lastRoll = face.toString();
      application.diceFaceEvents[face - 1].detail.result = `dice-${face}`;
      application.diceFaceEvents[face - 1].detail.cubeId = bodyName;
      dispatchEvent(application.diceFaceEvents[face - 1]);
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
      // but if in SAVED 
      const allNames = Object.keys(application.dices.SAVED_DICES);
      if(allNames.indexOf(e.detail.hitObject.name) !== -1) {
        // -
        console.log("UNPICK THIS.", e.detail.hitObject.name)
        application.dices.unPickDice(e.detail.hitObject.name)
        return;
      }
    } else if(application.dices.STATUS == "SELECT_DICES_1" ||
      application.dices.STATUS == "SELECT_DICES_2" ||
      application.dices.STATUS == "FINISHED") {

      if(Object.keys(application.dices.SAVED_DICES).length >= 5) {
        console.log("PREVENTED SELECT1/2 pick.", e.detail.hitObject.name)
        return;
      }

      const allNames = Object.keys(application.dices.SAVED_DICES);
      if(allNames.indexOf(e.detail.hitObject.name) !== -1) {
        // -
        console.log("UNPICK2 THIS.", e.detail.hitObject.name)
        application.dices.unPickDice(e.detail.hitObject.name)
        return;
      } else {
        console.log("hit cube status SELECT1/2 pick.", e.detail.hitObject.name)
        application.dices.pickDice(e.detail.hitObject.name)
      }


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
    }, onLoadObj, {scale: [1, 1, 1], swap: [null]})

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
        position: {x: 21, y: 5, z: -21},
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
        position: {x: -21, y: 5, z: -21},
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
      position: {x: 0, y: 5, z: -28},
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
    application.mainTitle = application.addMeshObj({
      position: {x: 0, y: 11, z: -21},
      rotation: {x: 90, y: 0, z: 0},
      rotationSpeed: {x: 1, y: 0, z: 0},
      scale: [1.6, 1.6, 1.6],
      texturesPaths: ['./res/meshes/jamb/text.png'],
      name: 'mainTitle',
      mesh: m.mainTitle,
      physics: {
        enabled: false,
      },
      raycast: {enabled: false, radius: 2},
    })
    setTimeout(() => {
      app.cameras.WASD.setYaw(0);
      app.cameras.WASD.setPitch(0.1);
      app.cameras.WASD.setZ(0);
      app.cameras.WASD.setY(4);
    }, 500);
  }

  function onLoadObjFloor(m) {
    application.addMeshObj({
      scale: [25, 1, 25],
      position: {x: 0, y: -1, z: -10},
      rotation: {x: 0, y: 0, z: 0},
      texturesPaths: ['./res/meshes/jamb/bg.webp'],
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

  function onLoadObj(m) {
    application.myLoadedMeshes = m;
    // Add dices
    const diceScale = [1.1, 1.1, 1.1];
    application.addMeshObj({
      position: {x: 0, y: 6, z: -10},
      rotation: {x: 0, y: 0, z: 0},
      rotationSpeed: {x: 0, y: 0, z: 0},
      scale: diceScale,
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
      scale: diceScale,
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
      scale: diceScale,
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
      scale: diceScale,
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
      scale: diceScale,
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
      scale: diceScale,
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
        // console.log(`%cFINAL<preliminar> ${dices.R}`, LOG_FUNNY)
        application.TOLERANCE = 0;
        app.cameras.WASD.setPitch(-1.26);
        app.cameras.WASD.setZ(-18);
        app.cameras.WASD.setY(19);
        app.mainTitle.position.translateByZ(-24);
        app.cameras.WASD._dirtyAngle = true;

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

      app.mainTitle.position.translateByZ(-21)
      app.cameras.WASD.setYaw(0);
      app.cameras.WASD.setPitch(0);
      app.cameras.WASD.setZ(0);
      app.cameras.WASD.setY(4);
      app.cameras.WASD._dirtyAngle = true;

      app.updateTitleEvent.detail.text = app.label.get.hand1;
      app.updateTitleEvent.detail.status = 'FREE';
      dispatchEvent(app.updateTitleEvent);
    })

    // ACTIONS
    let dice1Click = (e) => {
      dices.R[e.detail.cubeId] = '1';
      dices.checkAll()
    };

    let dice2Click = (e) => {
      dices.R[e.detail.cubeId] = '2';
      dices.checkAll()
    };

    let dice3Click = (e) => {
      dices.R[e.detail.cubeId] = '3';
      dices.checkAll()
    };

    let dice4Click = (e) => {
      dices.R[e.detail.cubeId] = '4';
      dices.checkAll()
    }

    let dice5Click = (e) => {
      dices.R[e.detail.cubeId] = '5';
      dices.checkAll()
    }

    let dice6Click = (e) => {
      dices.R[e.detail.cubeId] = '6';
      dices.checkAll()
    }

    function shootDice(x) {
      setTimeout(() => {
        const body = app.matrixPhysics.getBodyByName(`CubePhysics${x}`);
        app.matrixPhysics.shootBody(
          body,
          randomFloatFromTo(-4, 4), randomIntFromTo(25, 30), randomIntFromTo(-45, -65), // linear
          randomFloatFromTo(3, 12), randomIntFromTo(12, 20), 9                           // angular
        );
        setTimeout(() => app.matrixSounds.play('roll'), 100);
      }, 100 * x)
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

        app.dices.R = {};  // clear previous roll results
        app.dices.C = 0;

        app.matrixSounds.play('start')
        dices.STATUS = "IN_PLAY";
        app.updateTitleEvent.detail.text = app.label.get.hand1;
        app.updateTitleEvent.detail.status = 'inplay';
        // console.log('IN_PLAY');
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