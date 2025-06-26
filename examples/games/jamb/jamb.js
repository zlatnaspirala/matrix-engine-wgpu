import MatrixEngineWGPU from "../../../src/world.js";
import {downloadMeshes} from '../../../src/engine/loader-obj.js';
import {LOG_FUNNY, LOG_INFO, LOG_MATRIX, byId, mb} from "../../../src/engine/utils.js";

export let dices = {
  C: 0,
  STATUS: 'FREE_TO_PLAY',
  STATUS_H2: 'WAIT',
  STATUS_H3: 'WAIT',
  R: {},

  SAVED_DICES: {},

  pickDice: function(dice) {
    if(Object.keys(this.SAVED_DICES).length >= 5) {
      console.log("⚠️ You can only select up to 5 dice!");
      return; // prevent adding more
    }
    this.SAVED_DICES[dice] = this.R[dice]
    this.refreshSelectedBox()
  },

  refreshSelectedBox: function(arg) {
    let currentIndex = 0;
    for(var key in this.SAVED_DICES) {
      // console.log('key.......', key, ' obj: ', this.SAVED_DICES[key]);
      let B = app.matrixAmmo.getBodyByName(key)
      this.deactivatePhysics(B)
      const transform = new Ammo.btTransform();
      transform.setIdentity();
      transform.setOrigin(new Ammo.btVector3(0, 0, 0));
      B.setWorldTransform(transform);
      // let testB = this.getDiceByName(key)
      B.MEObject.position.setPosition(-5 + currentIndex, 5, -16)
      currentIndex += 3;
    }
  },

  deactivatePhysics: function(body) {
    const CF_KINEMATIC_OBJECT = 2;
    const DISABLE_DEACTIVATION = 4;

    // Remove from world if already added
    app.matrixAmmo.dynamicsWorld.removeRigidBody(body);

    // Set kinematic
    body.setCollisionFlags(body.getCollisionFlags() | CF_KINEMATIC_OBJECT);
    body.setActivationState(DISABLE_DEACTIVATION);

    // Optional: Zero velocities
    const zero = new Ammo.btVector3(0, 0, 0);
    body.setLinearVelocity(zero);
    body.setAngularVelocity(zero);

    // Re-add to world
    app.matrixAmmo.dynamicsWorld.addRigidBody(body);

    // Manual flag for logic
    body.isKinematic = true;
  },

  activatePhysics: function(body) {
    body.setCollisionFlags(body.getCollisionFlags() & ~2); // remove CF_KINEMATIC_OBJECT
    body.setActivationState(1); // 1 = ACTIVE_TAG

    body.isKinematic = false;
  },



  getAllDices: function() {
    return app.mainRenderBundle.filter(item => item.name.indexOf("CubePhysics") !== -1);
  },

  getDiceByName: function(name) {
    return app.mainRenderBundle.find(item => item.name === name);
  },

  checkAll: function() {
    // this.C++;
    // if(typeof this.R.CubePhysics1 != 'undefined' &&
    //   typeof this.R.CubePhysics2 != 'undefined' &&
    //   typeof this.R.CubePhysics3 != 'undefined' &&
    //   typeof this.R.CubePhysics4 != 'undefined' &&
    //   typeof this.R.CubePhysics5 != 'undefined' &&
    //   typeof this.R.CubePhysics6 != 'undefined' && this.C > 1200) {
    //   dispatchEvent(new CustomEvent('all-done', {detail: {}}))
    //   this.C = 0;
    // }
    this.C++;
    let allRolled = true;
    for(let i = 1;i <= 6;i++) {
      const key = "CubePhysics" + i;
      if(key in this.SAVED_DICES) continue; // 🔒 skip saved dice
      if(typeof this.R[key] === 'undefined') {
        allRolled = false;
        break;
      }
    }
    if(allRolled && this.C > 1200) {
      dispatchEvent(new CustomEvent('all-done', {detail: {}}));
      this.C = 0;
    }
  },
  validatePass: function() {
     if (Object.keys(this.SAVED_DICES).length >= 5) {
      console.log('%cBLOCK', LOG_FUNNY)
      mb.error(`Must select minimum 5 dices before add results...`);
      return false;
    }
    if(dices.STATUS != "FINISHED") {
      console.log('%cBLOCK', LOG_FUNNY)
      mb.error(`STATUS IS ${dices.STATUS}, please wait for results...`);
      app.matrixSounds.play('block')
      return false;
    } else {
      return true;
    }
  }
};

export let myDom = {

  state: {
    rowDown: []
  },

  memoNumberRow: [],

  hideSettings: function() {
    byId('blocker').style.display = 'none';
    byId('messageBox').style.display = 'none';
  },

  createMenu: function() {

    var root = document.createElement('div')
    root.id = 'hud';
    root.style.position = 'absolute';
    root.style.right = '10%';
    root.style.top = '10%';

    var help = document.createElement('div')
    help.id = 'HELP';
    help.classList.add('btn')
    help.innerHTML = `<span data-label="help"></span>`;

    var settings = document.createElement('div')
    settings.id = 'settings';
    settings.classList.add('btn')
    settings.innerHTML = `<span data-label="settings"></span>`;
    settings.addEventListener('click', () => {

      byId('messageBox').innerHTML = `
      <div>
        <span data-label="settings"></span>
        <div>

        <div>
          <span data-label="sounds"></span>

          <label class="switch">
            <input type="checkbox">
            <span class="sliderSwitch round"></span>
          </label>

        </div>

        <div>
          <button class="btn" onclick="app.myDom.hideSettings()">
            <span data-label="hide"></span>
          </button>
        </div>

        </div>
      </div>
      `;

      byId('blocker').style.display = 'flex';
      byId('messageBox').style.display = 'flex';

      dispatchEvent(new CustomEvent('updateLang', {}))
    })

    var roll = document.createElement('div')
    roll.id = 'hud-roll';
    roll.classList.add('btn');
    roll.innerHTML = `<span data-label="roll"></span>`;
    roll.addEventListener('click', () => {
      app.ROLL()
    })

    var separator = document.createElement('div')
    separator.innerHTML = `=======`;

    root.append(settings)
    root.append(help)
    root.append(separator)
    root.append(roll)

    document.body.appendChild(root)

    // global access
    // app.label.update()
    dispatchEvent(new CustomEvent('updateLang', {}))
  },

  createBlocker: function() {
    var root = document.createElement('div')
    root.id = 'blocker';

    var messageBox = document.createElement('div')
    messageBox.id = 'messageBox';

    // console.log('TEST', app.label.get)
    messageBox.innerHTML = `
     <span class="fancy-title" data-label="welcomeMsg"></span>
     <a href="https://github.com/zlatnaspirala/matrix-engine-wgpu">zlatnaspirala/matrix-engine-wgpu</a><br><br>
     <button class="btn" ><span style="font-size:30px;margin:15px;padding:10px" data-label="startGame"></span></button> <br>
     <div><span class="fancy-label" data-label="changeLang"></span></div> 
     <button class="btn" onclick="
      app.label.loadMultilang('en').then(r => {
        app.label.get = r;
        app.label.update()
      });
     " ><span data-label="english"></span></button> 
     <button class="btn" onclick="app.label.loadMultilang('sr').then(r => {
        app.label.get = r
        app.label.update() })" ><span data-label="serbian"></span></button> 
    `;


    let initialMsgBoxEvent = function() {
      console.log('click on msgbox')
      byId('messageBox').innerHTML = ``;
      byId('blocker').style.display = 'none';
      myDom.createMenu();
      messageBox.removeEventListener('click', initialMsgBoxEvent)

      document.querySelectorAll('.btn, .fancy-label, .fancy-title').forEach(el => {
        el.addEventListener('mouseenter', () => {
          app.matrixSounds.play('hover');
        });
      });
    };

    messageBox.addEventListener('click', initialMsgBoxEvent)
    root.append(messageBox)

    document.body.appendChild(root);

    app.label.update();

    // test 
    document.querySelectorAll('.btn, .fancy-label, .fancy-title').forEach(el => {
      el.addEventListener('mouseenter', () => {
        app.matrixSounds.play('hover');
      });
    });
  },

  createJamb: function() {
    var root = document.createElement('div')
    root.id = 'jambTable';
    root.style.position = 'absolute';
    root.style.display = 'flex';
    root.style.top = '10px';
    root.style.left = '10px';
    root.style.width = '200px';
    root.style.background = '#7d7d7d8c';

    var rowHeader = document.createElement('div')
    rowHeader.id = 'rowHeader';
    rowHeader.style.top = '10px';
    rowHeader.style.left = '10px';
    rowHeader.style.width = '200px';
    rowHeader.innerHTML = '<span data-label="cornerText"></span><span id="user-points">0</span>';
    root.appendChild(rowHeader);
    rowHeader.classList.add('myTheme1')

    var rowDown = document.createElement('div')
    rowDown.id = 'rowDown';
    rowDown.style.top = '10px';
    rowDown.style.left = '10px';
    rowDown.style.width = '200px';
    rowDown.innerHTML = '↓';
    rowDown.classList.add('myTheme1')
    root.appendChild(rowDown);

    var rowFree = document.createElement('div')
    rowFree.id = 'rowFree';
    rowFree.style.top = '10px';
    rowFree.style.left = '10px';
    rowFree.style.width = '200px';
    rowFree.innerHTML = '↕';
    rowFree.classList.add('myTheme1')
    root.appendChild(rowFree);

    var rowUp = document.createElement('div')
    rowUp.id = 'rowUp';
    rowUp.style.top = '10px';
    rowUp.style.left = '10px';
    rowUp.style.width = '200px';
    rowUp.innerHTML = '↑';
    rowUp.classList.add('myTheme1')
    root.appendChild(rowUp);

    var rowHand = document.createElement('div')
    rowHand.id = 'rowHand';
    rowHand.style.top = '10px';
    rowHand.style.left = '10px';
    rowHand.style.width = '200px';
    rowHand.innerHTML = '<span data-label="hand"></span>';
    rowHand.classList.add('myTheme1')
    root.appendChild(rowHand);

    // INJECT TABLE HEADER ROW
    this.createLeftHeaderRow(rowHeader);
    this.createRowDown(rowDown);
    this.createRowFree(rowFree);
    this.createRow(rowUp);
    this.createRow(rowHand);

    this.createSelectedBox();

    document.body.appendChild(root);
    // console.log('JambTable added.')
  },

  createSelectedBox: function() {
    var handResultsBoxUI = document.createElement('div')
    handResultsBoxUI.id = 'handResultsBoxUI';
    handResultsBoxUI.style.width = 'auto';
    handResultsBoxUI.style.position = 'absolute';
    handResultsBoxUI.style.left = '35%';
    handResultsBoxUI.style.top = '5%';
    handResultsBoxUI.style.background = '#7d7d7d8c';
    handResultsBoxUI.innerHTML = `SELECTED BOX`;
    document.body.appendChild(handResultsBoxUI);
    addEventListener('HAND_RESULTS', (e) => {
      //

    })
  },

  // chooseFinalResults: function() {
  //   var chooseFinalResults = document.createElement('div')
  //   chooseFinalResults.id = 'chooseFinalResults';
  //   chooseFinalResults.style.width = 'auto';
  //   chooseFinalResults.style.position = 'absolute';
  //   chooseFinalResults.style.left = '35%';
  //   chooseFinalResults.style.top = '25%';
  //   chooseFinalResults.style.background = '#7d7d7d8c';
  //   chooseFinalResults.innerHTML = ``;
  //   document.body.appendChild(chooseFinalResults);
  //   chooseFinalResults.addEventListener('click', (e) => {
  //     //
  //   })
  // },

  addBallToSelectedBox: function(selectedBall) {
    //

  },

  createLeftHeaderRow: function(myRoot) {
    for(var x = 1;x < 7;x++) {
      var rowNumber = document.createElement('div')
      rowNumber.id = 'rowNumber' + x;
      rowNumber.style.top = '10px';
      rowNumber.style.left = '10px';
      rowNumber.style.width = 'auto';
      rowNumber.style.background = '#7d7d7d8c';
      rowNumber.innerHTML = `<span>${x}</span>`;
      myRoot.appendChild(rowNumber);
    }

    var rowNumberSum = document.createElement('div')
    rowNumberSum.id = 'H_rowNumberSum';

    rowNumberSum.style.width = 'auto';
    rowNumberSum.style.background = '#7d7d7d8c';
    rowNumberSum.innerHTML = `Σ`;
    myRoot.appendChild(rowNumberSum);

    var rowMax = document.createElement('div')
    rowMax.id = 'H_rowMax';
    rowMax.style.width = 'auto';
    rowMax.style.background = '#7d7d7d8c';
    rowMax.innerHTML = `<span data-label="MAX"></span>`;
    myRoot.appendChild(rowMax);

    var rowMin = document.createElement('div')
    rowMin.id = 'H_rowMax';
    rowMin.style.width = 'auto';
    rowMin.style.background = '#7d7d7d8c';
    rowMin.innerHTML = `<span data-label="MIN"></span>`;
    myRoot.appendChild(rowMin);

    var rowMaxMinSum = document.createElement('div')
    rowMaxMinSum.id = 'H_rowMaxMinSum';
    rowMaxMinSum.style.width = 'auto';
    rowMaxMinSum.style.background = '#7d7d7d8c';
    rowMaxMinSum.innerHTML = `Σ`;
    myRoot.appendChild(rowMaxMinSum);

    var largeStraight = document.createElement('div')
    largeStraight.id = 'H_largeStraight';
    largeStraight.style.width = 'auto';
    largeStraight.style.background = '#7d7d7d8c';
    largeStraight.innerHTML = `<span data-label="straight"></span>`;
    myRoot.appendChild(largeStraight);

    var threeOfAKind = document.createElement('div')
    threeOfAKind.id = 'H_threeOfAKind';
    threeOfAKind.style.width = 'auto';
    threeOfAKind.style.background = '#7d7d7d8c';
    threeOfAKind.innerHTML = `<span data-label="threeOf"></span>`;
    myRoot.appendChild(threeOfAKind);

    var fullHouse = document.createElement('div')
    fullHouse.id = 'H_fullHouse';
    fullHouse.style.width = 'auto';
    fullHouse.style.background = '#7d7d7d8c';
    fullHouse.innerHTML = `<span data-label="fullhouse"></span>`;
    myRoot.appendChild(fullHouse);

    var poker = document.createElement('div')
    poker.id = 'H_poker';
    poker.style.width = 'auto';
    poker.style.background = '#7d7d7d8c';
    poker.innerHTML = `<span data-label="poker"></span>`;
    myRoot.appendChild(poker);

    var jamb = document.createElement('div')
    jamb.id = 'H_jamb';
    jamb.style.width = 'auto';
    jamb.style.background = '#7d7d7d8c';
    jamb.innerHTML = `<span data-label="jamb"></span>`;
    myRoot.appendChild(jamb);

    var rowSum = document.createElement('div')
    rowSum.id = 'H_rowSum';
    rowSum.style.width = 'auto';
    rowSum.style.background = '#7d7d7d8c';
    rowSum.innerHTML = `Σ`;
    myRoot.appendChild(rowSum);

    var rowSumFINAL = document.createElement('div')
    rowSumFINAL.id = 'H_rowSumFINAL';
    rowSumFINAL.style.width = 'auto';
    rowSumFINAL.style.background = '#7d7d7d8c';
    rowSumFINAL.innerHTML = `<spam data-label="final"></span>`;
    myRoot.appendChild(rowSumFINAL);
  },

  createRow: function(myRoot) {
    for(var x = 1;x < 7;x++) {
      var rowNumber = document.createElement('div')
      rowNumber.id = 'rowNumber' + x;
      rowNumber.style.top = '10px';
      rowNumber.style.left = '10px';
      rowNumber.style.width = 'auto';
      rowNumber.style.background = '#7d7d7d8c';
      rowNumber.innerHTML = `-`;
      rowNumber.addEventListener('click', () => {
        console.log('LOG THIS ', this)
        // works
        // rowDown
        if(this.state.rowDown.length == 0) {
          console.log('it is no play yet in this row ', this)

        }
      })
      myRoot.appendChild(rowNumber);
    }

    var rowNumberSum = document.createElement('div')
    rowNumberSum.id = 'rowNumberSum';

    rowNumberSum.style.width = 'auto';
    rowNumberSum.style.background = '#7d7d7d8c';
    rowNumberSum.innerHTML = `-`;
    myRoot.appendChild(rowNumberSum);

    var rowMax = document.createElement('div')
    rowMax.id = 'rowMax';
    rowMax.style.width = 'auto';
    rowMax.style.background = '#7d7d7d8c';
    rowMax.innerHTML = `-`;
    myRoot.appendChild(rowMax);

    var rowMin = document.createElement('div')
    rowMin.id = 'rowMax';
    rowMin.style.width = 'auto';
    rowMin.style.background = '#7d7d7d8c';
    rowMin.innerHTML = `-`;
    myRoot.appendChild(rowMin);

    var rowMaxMinSum = document.createElement('div')
    rowMaxMinSum.id = 'rowMaxMinSum';
    rowMaxMinSum.style.width = 'auto';
    rowMaxMinSum.style.background = '#7d7d7d8c';
    rowMaxMinSum.innerHTML = `-`;
    myRoot.appendChild(rowMaxMinSum);

    var largeStraight = document.createElement('div')
    largeStraight.id = 'largeStraight';
    largeStraight.style.width = 'auto';
    largeStraight.style.background = '#7d7d7d8c';
    largeStraight.innerHTML = `-`;
    myRoot.appendChild(largeStraight);

    var threeOfAKind = document.createElement('div')
    threeOfAKind.id = 'down_threeOfAKind';
    threeOfAKind.style.width = 'auto';
    threeOfAKind.style.background = '#7d7d7d8c';
    threeOfAKind.innerHTML = `-`;
    myRoot.appendChild(threeOfAKind);

    var fullHouse = document.createElement('div')
    fullHouse.id = 'fullHouse';
    fullHouse.style.width = 'auto';
    fullHouse.style.background = '#7d7d7d8c';
    fullHouse.innerHTML = `-`;
    myRoot.appendChild(fullHouse);

    var poker = document.createElement('div')
    poker.id = 'poker';
    poker.style.width = 'auto';
    poker.style.background = '#7d7d7d8c';
    poker.innerHTML = `-`;
    myRoot.appendChild(poker);

    var jamb = document.createElement('div')
    jamb.id = 'jamb';
    jamb.style.width = 'auto';
    jamb.style.background = '#7d7d7d8c';
    jamb.innerHTML = `-`;
    myRoot.appendChild(jamb);

    var rowSum = document.createElement('div')
    rowSum.id = 'rowSum';
    rowSum.style.width = 'auto';
    rowSum.style.background = '#7d7d7d8c';
    rowSum.innerHTML = `-`;
    myRoot.appendChild(rowSum);


  },

  createRowFree: function(myRoot) {
    for(var x = 1;x < 7;x++) {
      var rowNumber = document.createElement('div')
      rowNumber.id = 'free-rowNumber' + x;
      rowNumber.style.top = '10px';
      rowNumber.style.left = '10px';
      rowNumber.style.width = 'auto';
      rowNumber.style.background = '#7d7d7d8c';
      rowNumber.innerHTML = `-`;
      rowNumber.addEventListener('click', (e) => {
        if(dices.validatePass() == false) return;
        var getName = e.target.id;
        getName = getName.replace('free-rowNumber', '')
        var count23456 = 0;
        for(let key in dices.SAVED_DICES) {
          if(parseInt(dices.R[key]) == parseInt(getName)) {
            count23456++;
          }
        }
        this.state.rowDown.push((count23456 * parseInt(getName)))
        e.target.innerHTML = (count23456 * parseInt(getName));
        if(parseInt(getName) == 6) {
          myDom.calcFreeNumbers()
        }
        dices.STATUS = "FREE_TO_PLAY";
        dispatchEvent(new CustomEvent('FREE_TO_PLAY', {}))
      })
      myRoot.appendChild(rowNumber);
    }

    var rowNumberSum = document.createElement('div')
    rowNumberSum.id = 'free-rowNumberSum';
    rowNumberSum.style.width = 'auto';
    rowNumberSum.style.background = '#7d7d7d8c';
    rowNumberSum.innerHTML = `-`;
    myRoot.appendChild(rowNumberSum);

    var rowMax = document.createElement('div')
    rowMax.id = 'free-rowMax';
    rowMax.style.width = 'auto';
    rowMax.style.background = '#7d7d7d8c';
    rowMax.innerHTML = `-`;
    rowMax.addEventListener("click", this.calcFreeRowMax);
    myRoot.appendChild(rowMax);

    var rowMin = document.createElement('div')
    rowMin.id = 'free-rowMin';
    rowMin.style.width = 'auto';
    rowMin.style.background = '#7d7d7d8c';
    rowMin.innerHTML = `-`;
    rowMin.addEventListener('click', this.calcFreeRowMin);
    myRoot.appendChild(rowMin);

    var rowMaxMinSum = document.createElement('div')
    rowMaxMinSum.id = 'free-rowMaxMinSum';
    rowMaxMinSum.style.width = 'auto';
    rowMaxMinSum.style.background = '#7d7d7d8c';
    rowMaxMinSum.innerHTML = `-`;
    myRoot.appendChild(rowMaxMinSum);

    var largeStraight = document.createElement('div')
    largeStraight.id = 'free-largeStraight';
    largeStraight.style.width = 'auto';
    largeStraight.style.background = '#7d7d7d8c';
    largeStraight.innerHTML = `-`;
    largeStraight.addEventListener('click', this.attachFreeKenta);
    myRoot.appendChild(largeStraight);

    var threeOfAKind = document.createElement('div')
    threeOfAKind.id = 'free-threeOfAKind';
    threeOfAKind.style.width = 'auto';
    threeOfAKind.style.background = '#7d7d7d8c';
    threeOfAKind.innerHTML = `-`;
    threeOfAKind.addEventListener('click', this.attachFreeTrilling)
    myRoot.appendChild(threeOfAKind);

    var fullHouse = document.createElement('div')
    fullHouse.id = 'free-fullHouse';
    fullHouse.style.width = 'auto';
    fullHouse.style.background = '#7d7d7d8c';
    fullHouse.innerHTML = `-`;
    fullHouse.addEventListener('click', this.attachFreeFullHouse)
    myRoot.appendChild(fullHouse);

    var poker = document.createElement('div')
    poker.id = 'free-poker';
    poker.style.width = 'auto';
    poker.style.background = '#7d7d7d8c';
    poker.innerHTML = `-`;
    poker.addEventListener('click', this.attachFreePoker)
    myRoot.appendChild(poker);

    var jamb = document.createElement('div')
    jamb.id = 'free-jamb';
    jamb.style.width = 'auto';
    jamb.style.background = '#7d7d7d8c';
    jamb.innerHTML = `-`;
    jamb.addEventListener('click', this.attachFreeJamb)
    myRoot.appendChild(jamb);

    var rowSum = document.createElement('div')
    rowSum.id = 'free-rowSum';
    rowSum.style.width = 'auto';
    rowSum.style.background = '#7d7d7d8c';
    rowSum.innerHTML = `-`;
    myRoot.appendChild(rowSum);
  },

  createRowDown: function(myRoot) {
    for(var x = 1;x < 7;x++) {
      var rowNumber = document.createElement('div')
      rowNumber.id = 'down-rowNumber' + x;
      rowNumber.style.top = '10px';
      rowNumber.style.left = '10px';
      rowNumber.style.width = 'auto';
      rowNumber.style.background = '#7d7d7d8c';
      rowNumber.innerHTML = `-`;

      this.memoNumberRow.push(rowNumber)
      // initial
      if(x == 1) {
        rowNumber.classList.add('canPlay')
      }

      rowNumber.addEventListener('click', (e) => {

        if(dices.validatePass() == false) return;

        var getName = e.target.id;
        getName = getName.replace('down-rowNumber', '')
        if(this.state.rowDown.length == 0) {
          console.log('LOG ', getName)
          if(parseInt(getName) == 1) {
            var count1 = 0;
            for(let key in dices.SAVED_DICES) {
              if(parseInt(dices.R[key]) == 1) {
                console.log('yeap', dices.R)
                count1++;
              }
            }
            this.state.rowDown.push(count1)
            e.target.innerHTML = count1;
            e.target.classList.remove('canPlay')
            this.memoNumberRow[1].classList.add('canPlay')
            dices.STATUS = "FREE_TO_PLAY";
            dispatchEvent(new CustomEvent('FREE_TO_PLAY', {}))
          } else {
            console.log('BLOCK')

          }
        } else {
          if(this.state.rowDown.length > 0) {
            if(parseInt(getName) == this.state.rowDown.length + 1) {
              console.log('moze za ', parseInt(getName))
              var count23456 = 0;
              for(let key in dices.SAVED_DICES) {
                if(parseInt(dices.R[key]) == parseInt(getName)) {
                  console.log('yeap', dices.R)
                  count23456++;
                }
              }
              this.state.rowDown.push((count23456 * parseInt(getName)))
              //
              e.target.innerHTML = (count23456 * parseInt(getName));
              if(parseInt(getName) == 6) {
                // calc sum
                console.log('calc sum for numb ~ ')
                //  this.state.rowDown.length + 1
                myDom.calcDownNumbers()
                e.target.classList.remove('canPlay')
                this.rowMax.classList.add('canPlay')
              } else {
                e.target.classList.remove('canPlay')
                this.memoNumberRow[parseInt(getName)].classList.add('canPlay')
              }
              dices.STATUS = "FREE_TO_PLAY";
              dispatchEvent(new CustomEvent('FREE_TO_PLAY', {}))
            } else {
              console.log('BLOCK')
            }
          }
        }
      })
      myRoot.appendChild(rowNumber);
    }

    var rowNumberSum = document.createElement('div')
    rowNumberSum.id = 'down-rowNumberSum';

    rowNumberSum.style.width = 'auto';
    rowNumberSum.style.background = '#7d7d7d8c';
    rowNumberSum.innerHTML = `-`;
    myRoot.appendChild(rowNumberSum);

    var rowMax = document.createElement('div')
    rowMax.id = 'down-rowMax';
    rowMax.style.width = 'auto';
    rowMax.style.background = '#7d7d7d8c';
    rowMax.innerHTML = `-`;
    myRoot.appendChild(rowMax);
    this.rowMax = rowMax;
    // this.rowMax.addEventListener("click", (e) => {
    //   e.target.classList.remove('canPlay')
    //   this.rowMin.classList.add('canPlay')
    // })

    var rowMin = document.createElement('div')
    rowMin.id = 'down-rowMin';
    rowMin.style.width = 'auto';
    rowMin.style.background = '#7d7d7d8c';
    rowMin.innerHTML = `-`;
    this.rowMin = rowMin;
    myRoot.appendChild(rowMin);
    this.rowMin = rowMin;
    var rowMaxMinSum = document.createElement('div')
    rowMaxMinSum.id = 'down-rowMaxMinSum';
    rowMaxMinSum.style.width = 'auto';
    rowMaxMinSum.style.background = '#7d7d7d8c';
    rowMaxMinSum.innerHTML = `-`;
    myRoot.appendChild(rowMaxMinSum);

    var largeStraight = document.createElement('div')
    largeStraight.id = 'down-largeStraight';
    largeStraight.style.width = 'auto';
    largeStraight.style.background = '#7d7d7d8c';
    largeStraight.innerHTML = `-`;
    myRoot.appendChild(largeStraight);

    var threeOfAKind = document.createElement('div')
    threeOfAKind.id = 'down-threeOfAKind';
    threeOfAKind.style.width = 'auto';
    threeOfAKind.style.background = '#7d7d7d8c';
    threeOfAKind.innerHTML = `-`;
    myRoot.appendChild(threeOfAKind);

    var fullHouse = document.createElement('div')
    fullHouse.id = 'down-fullHouse';
    fullHouse.style.width = 'auto';
    fullHouse.style.background = '#7d7d7d8c';
    fullHouse.innerHTML = `-`;
    myRoot.appendChild(fullHouse);

    var poker = document.createElement('div')
    poker.id = 'down-poker';
    poker.style.width = 'auto';
    poker.style.background = '#7d7d7d8c';
    poker.innerHTML = `-`;
    myRoot.appendChild(poker);

    var jamb = document.createElement('div')
    jamb.id = 'down-jamb';
    jamb.style.width = 'auto';
    jamb.style.background = '#7d7d7d8c';
    jamb.innerHTML = `-`;
    myRoot.appendChild(jamb);

    var rowSum = document.createElement('div')
    rowSum.id = 'down-rowSum';
    rowSum.style.width = 'auto';
    rowSum.style.background = '#7d7d7d8c';
    rowSum.innerHTML = `-`;
    myRoot.appendChild(rowSum);
  },

  calcDownNumbers: function() {
    var s = 0;
    this.state.rowDown.forEach((i) => {
      console.log(parseFloat(i))
      s += parseFloat(i)
    })
    byId('down-rowNumberSum').style.background = 'rgb(113 0 0 / 55%)';
    byId('down-rowNumberSum').innerHTML = s;
    // console.log('this.rowMax also set free to plat status', this.rowMax)
    dices.STATUS = "FREE_TO_PLAY";
    dispatchEvent(new CustomEvent('FREE_TO_PLAY', {}))
    this.rowMax.addEventListener("click", this.calcDownRowMax)
  },

  // free row start

  calcFreeNumbers: function() {
    var s = 0;
    this.state.rowDown.forEach((i) => {
      console.log(parseFloat(i))
      s += parseFloat(i)
    })
    byId('free-rowNumberSum').style.background = 'rgb(113 0 0 / 55%)';
    byId('free-rowNumberSum').innerHTML = s;
    // console.log('this.rowMax also set free to plat status', this.rowMax)
    dices.STATUS = "FREE_TO_PLAY";
    dispatchEvent(new CustomEvent('FREE_TO_PLAY', {}))
    byId('free-rowMax').addEventListener("click", this.calc)
  },

  calcFreeRowMax: (e) => {
    if(dices.validatePass() == false) return;
    var test = 0;
    let keyLessNum = Object.keys(dices.R).reduce((key, v) => dices.R[v] < dices.R[key] ? v : key);
    for(var key in dices.R) {
      if(key != keyLessNum) {
        test += parseFloat(dices.R[key]);
      }
    }
    e.target.innerHTML = test;
    // now attach next event.
    dices.STATUS = "FREE_TO_PLAY";
    dispatchEvent(new CustomEvent('FREE_TO_PLAY', {}));
    byId('free-rowMax').removeEventListener("click", this.calcFreeRowMax);
  },

  calcFreeRowMin: () => {
    if(dices.validatePass() == false) return;
    var maxTestKey = Object.keys(dices.R).reduce(function(a, b) {return dices.R[a] > dices.R[b] ? a : b});
    var test = 0;
    for(var key in dices.R) {
      if(key != maxTestKey) {
        test += parseFloat(dices.R[key])
      } else {
        console.log('not calc dice ', dices.R[key])
      }
    }
    byId('free-rowMin').innerHTML = test;
    byId('free-rowMin').removeEventListener('click', this.calcFreeRowMin);
    // calc max min dont forget rules for bonus +30
    var SUMMINMAX = parseFloat(byId('free-rowMax').innerHTML) - parseFloat(byId('free-rowMin').innerHTML)
    byId('free-rowMaxMinSum').innerHTML = SUMMINMAX;
    myDom.incrasePoints(SUMMINMAX);
    dices.STATUS = "FREE_TO_PLAY";
    dispatchEvent(new CustomEvent('FREE_TO_PLAY', {}))
  },

  attachFreeKenta: function() {
    if(dices.validatePass() == false) return;

    console.log('Test free kenta :', dices.R)
    var result = app.myDom.checkForDuplicate()[0];
    var testArray = app.myDom.checkForDuplicate()[1];
    console.log('TEST duplik: ' + result);
    if(result.length == 2) {
      console.log('TEST duplik less 3 : ' + result);
      var locPrevent = false;
      testArray.forEach((item, index, array) => {
        if(result[0].value == item.value && locPrevent == false) {
          console.log('detect by value item.value', item.value)
          locPrevent = true;
          array.splice(index, 1);
        }
      })
      // if we catch  1 and 6 in same stack then it is not possible for kenta...
      var test1 = false, test6 = false;
      testArray.forEach((item, index, array) => {
        if(item.value == 1) {
          test1 = true;
        } else if(item.value == 6) {
          test6 = true;
        }
      })
      if(test1 == true && test6 == true) {
        byId('free-largeStraight').innerHTML = `0`;
      } else if(test1 == true) {
        byId('free-largeStraight').innerHTML = 15 + 50;
        myDom.incrasePoints(15 + 50);
      } else if(test6 == true) {
        byId('free-largeStraight').innerHTML = 20 + 50;
        myDom.incrasePoints(20 + 50);
      }
    } else if(result < 2) {
      byId('free-largeStraight').innerHTML = 66;
      myDom.incrasePoints(66);
    } else {
      // zero value
      byId('free-largeStraight').innerHTML = `0`;
    }
    byId('free-largeStraight').removeEventListener('click', this.attachFreeKenta)
    dices.STATUS = "FREE_TO_PLAY";
    dispatchEvent(new CustomEvent('FREE_TO_PLAY', {}))
  },

  attachFreeTrilling: function() {
    if(dices.validatePass() == false) return;

    var result = app.myDom.checkForDuplicate()[0];
    // var testArray = app.myDom.checkForDuplicate()[1];
    // console.log('DUPLICATE FOR TRILING ', result);
    if(result.length > 2) {
      var testWin = 0;
      var TEST = app.myDom.checkForAllDuplicate();
      console.log('DUPLICATE FOR TRILING TEST ', TEST);
      for(var key in TEST) {
        if(TEST[key] > 2) {
          // win
          var getDiceID = parseInt(key.replace('value__', ''))
          testWin = getDiceID * 3;
        }
      }
      console.log('DUPLICATE FOR TRILING 30 + TEST ', testWin);
      if(testWin > 0) {
        byId('free-threeOfAKind').innerHTML = 20 + testWin;
        myDom.incrasePoints(20 + testWin);
      }
    } else {
      byId('free-threeOfAKind').innerHTML = 0;
    }
    byId('free-threeOfAKind').removeEventListener('click', this.attachFreeTrilling)
    dices.STATUS = "FREE_TO_PLAY";
    dispatchEvent(new CustomEvent('FREE_TO_PLAY', {}))
  },

  attachFreeFullHouse: function() {

    if(dices.validatePass() == false) return;

    var TEST = app.myDom.checkForAllDuplicate();
    // console.log('DUPLICATE FOR FULL HOUSE 30 + TEST ');
    var win = 0;
    var testPair = false;
    var testTrilling = false;
    var testWinPair = 0;
    var testWinTrilling = 0;
    for(var key in TEST) {
      if(TEST[key] == 2) {
        // win
        var getDiceID = parseInt(key.replace('value__', ''))
        testWinPair = getDiceID * 2;
        testPair = true;
      } else if(TEST[key] == 3) {
        var getDiceID = parseInt(key.replace('value__', ''))
        testWinTrilling = getDiceID * 3;
        testTrilling = true;
      }
    }
    if(testPair == true && testTrilling == true) {
      win = testWinPair + testWinTrilling;
      byId('free-fullHouse').innerHTML = win + 30;
      myDom.incrasePoints(win + 30);
    } else {
      byId('free-fullHouse').innerHTML = 0;
    }

    byId('free-fullHouse').removeEventListener('click', this.attachFreeFullHouse)
    dices.STATUS = "FREE_TO_PLAY";
    dispatchEvent(new CustomEvent('FREE_TO_PLAY', {}))
  },

  attachFreePoker: function() {
    if(dices.validatePass() == false) return;

    var TEST = app.myDom.checkForAllDuplicate();
    // console.log('DUPLICATE FOR poker 40 + TEST ');
    for(var key in TEST) {
      if(TEST[key] == 4 || TEST[key] > 4) {
        var getDiceID = parseInt(key.replace('value__', ''))
        var win = getDiceID * 4;
        byId('free-poker').innerHTML = win + 40;
        myDom.incrasePoints(win + 40);
      }
    }
    byId('free-poker').removeEventListener('click', this.attachFreePoker)
    dices.STATUS = "FREE_TO_PLAY";
    dispatchEvent(new CustomEvent('FREE_TO_PLAY', {}))
  },

  attachFreeJamb: function() {
    if(dices.validatePass() == false) return;
    // console.log('<GAMEPLAY><FREE ROW IS FEELED>')
    var TEST = app.myDom.checkForAllDuplicate();
    for(var key in TEST) {
      if(TEST[key] == 5 || TEST[key] > 5) {
        // win
        var getDiceID = parseInt(key.replace('value__', ''))
        var win = getDiceID * 5;
        byId('free-poker').innerHTML = win + 50;
        myDom.incrasePoints(win + 50);
      }
    }
    byId('free-jamb').removeEventListener('click', this.attachFreeJamb)
    dices.STATUS = "FREE_TO_PLAY";
    dispatchEvent(new CustomEvent('FREE_TO_PLAY', {}))
  },
  // end of free row

  calcDownRowMax: (e) => {
    if(dices.validatePass() == false) return;
    e.target.classList.remove('canPlay');
    this.rowMin.classList.add('canPlay');
    var test = 0;
    let keyLessNum = Object.keys(dices.R).reduce((key, v) => dices.R[v] < dices.R[key] ? v : key);
    // console.log('FIND MIN DICE TO REMOVE FROM SUM ', keyLessNum);
    for(var key in dices.R) {
      if(key != keyLessNum) {
        test += parseFloat(dices.R[key]);
      }
    }
    e.target.innerHTML = test;
    // now attach next event.
    dices.STATUS = "FREE_TO_PLAY";
    dispatchEvent(new CustomEvent('FREE_TO_PLAY', {}));
    this.rowMax.removeEventListener("click", this.calcDownRowMax);
    byId('down-rowMin').addEventListener('click', this.calcDownRowMin);
  },

  incrasePoints: function(arg) {
    byId('user-points').innerHTML = parseInt(byId('user-points').innerHTML) + parseInt(arg);
  },

  calcDownRowMin: () => {
    if(dices.validatePass() == false) return;
    this.rowMin.classList.remove('canPlay')
    console.log('MIN ENABLED')
    var maxTestKey = Object.keys(dices.R).reduce(function(a, b) {return dices.R[a] > dices.R[b] ? a : b});
    var test = 0;
    for(var key in dices.R) {
      if(key != maxTestKey) {
        test += parseFloat(dices.R[key])
      } else {
        console.log('not calc dice ', dices.R[key])
      }
    }
    this.rowMin.innerHTML = test;
    byId('down-rowMin').removeEventListener('click', this.calcDownRowMin);
    // calc max min dont forget rules for bonus +30
    var SUMMINMAX = parseFloat(this.rowMax.innerHTML) - parseFloat(this.rowMin.innerHTML)
    byId('down-rowMaxMinSum').innerHTML = SUMMINMAX;
    myDom.incrasePoints(SUMMINMAX);
    dices.STATUS = "FREE_TO_PLAY";
    dispatchEvent(new CustomEvent('FREE_TO_PLAY', {}))
    byId('down-largeStraight').classList.add('canPlay');
    byId('down-largeStraight').addEventListener('click', this.attachKenta)
  },

  checkForDuplicate: function() {
    var testArray = [];
    for(var key in dices.R) {
      var gen = {myId: key, value: dices.R[key]};
      testArray.push(gen);
    }
    var result = Object.values(testArray.reduce((c, v) => {
      let k = v.value;
      c[k] = c[k] || [];
      c[k].push(v);
      return c;
    }, {})).reduce((c, v) => v.length > 1 ? c.concat(v) : c, []);

    return [result, testArray];
  },

  checkForAllDuplicate: function() {
    var testArray = [];
    for(var key in dices.R) {
      var gen = {myId: key, value: dices.R[key]};
      testArray.push(gen);
    }
    // console.log('testArray ', testArray)
    var result = Object.values(testArray.reduce((c, v) => {
      let k = v.value;
      c[k] = c[k] || [];
      c[k].push(v);
      return c;
    }, {})).reduce((c, v) => v.length > 1 ? c.concat(v) : c, []);
    var discret = {};
    result.forEach((item, index, array) => {
      if(typeof discret['value__' + item.value] === 'undefined') {
        discret['value__' + item.value] = 1;
      } else {
        discret['value__' + item.value] += 1;
      }
    })
    return discret;
  },

  attachKenta: function() {
    console.log('Test kenta  ', dices.R)
    byId('down-largeStraight').classList.remove('canPlay')
    var result = app.myDom.checkForDuplicate()[0];
    var testArray = app.myDom.checkForDuplicate()[1];
    // console.log('TEST duplik: ' + result);
    if(result.length == 2) {
      console.log('TEST duplik less 3 : ' + result);
      var locPrevent = false;
      testArray.forEach((item, index, array) => {
        if(result[0].value == item.value && locPrevent == false) {
          console.log('detect by value item.value', item.value)
          locPrevent = true;
          array.splice(index, 1);
        }
      })
      // if we catch  1 and 6 in same stack then it is not possible for kenta...
      var test1 = false, test6 = false;
      testArray.forEach((item, index, array) => {
        if(item.value == 1) {
          test1 = true;
        } else if(item.value == 6) {
          test6 = true;
        }
      })
      if(test1 == true && test6 == true) {
        byId('down-largeStraight').innerHTML = `0`;
      } else if(test1 == true) {
        byId('down-largeStraight').innerHTML = 15 + 50;
        myDom.incrasePoints(15 + 50);
      } else if(test6 == true) {
        byId('down-largeStraight').innerHTML = 20 + 50;
        myDom.incrasePoints(20 + 50);
      }
    } else if(result < 2) {
      byId('down-largeStraight').innerHTML = 66;
      myDom.incrasePoints(66);
    } else {
      // zero value
      byId('down-largeStraight').innerHTML = `0`;
    }
    byId('down-threeOfAKind').addEventListener('click', this.attachDownTrilling)
    byId('down-largeStraight').removeEventListener('click', this.attachKenta)
    dices.STATUS = "FREE_TO_PLAY";
    dispatchEvent(new CustomEvent('FREE_TO_PLAY', {}))
  },

  attachDownTrilling: function() {
    var result = app.myDom.checkForDuplicate()[0];
    // var testArray = app.myDom.checkForDuplicate()[1];
    // console.log('DUPLICATE FOR TRILING ', result);
    if(result.length > 2) {
      var testWin = 0;
      var TEST = app.myDom.checkForAllDuplicate();
      console.log('DUPLICATE FOR TRILING TEST ', TEST);
      for(var key in TEST) {
        if(TEST[key] > 2) {
          // win
          var getDiceID = parseInt(key.replace('value__', ''))
          testWin = getDiceID * 3;
        }
      }
      console.log('DUPLICATE FOR TRILING 30 + TEST ', testWin);
      byId('down-threeOfAKind').innerHTML = 20 + testWin;
      myDom.incrasePoints(20 + testWin);
    } else {
      byId('down-threeOfAKind').innerHTML = 0;
    }
    byId('down-threeOfAKind').removeEventListener('click', this.attachDownTrilling)
    byId('down-fullHouse').addEventListener('click', this.attachDownFullHouse)
    dices.STATUS = "FREE_TO_PLAY";
    dispatchEvent(new CustomEvent('FREE_TO_PLAY', {}))
  },

  attachDownFullHouse: function() {
    var TEST = app.myDom.checkForAllDuplicate();
    // console.log('DUPLICATE FOR FULL HOUSE 30 + TEST ');
    var win = 0;
    var testPair = false;
    var testTrilling = false;
    var testWinPair = 0;
    var testWinTrilling = 0;
    for(var key in TEST) {
      if(TEST[key] == 2) {
        // win
        var getDiceID = parseInt(key.replace('value__', ''))
        testWinPair = getDiceID * 2;
        testPair = true;
      } else if(TEST[key] == 3) {
        var getDiceID = parseInt(key.replace('value__', ''))
        testWinTrilling = getDiceID * 3;
        testTrilling = true;
      }
    }
    if(testPair == true && testTrilling == true) {
      win = testWinPair + testWinTrilling;
      byId('down-fullHouse').innerHTML = win + 30;
      myDom.incrasePoints(win + 30);
    } else {
      byId('down-fullHouse').innerHTML = 0;
    }
    byId('down-poker').addEventListener('click', this.attachDownPoker)
    byId('down-fullHouse').removeEventListener('click', this.attachDownFullHouse)
    dices.STATUS = "FREE_TO_PLAY";
    dispatchEvent(new CustomEvent('FREE_TO_PLAY', {}))
  },

  attachDownPoker: function() {
    var TEST = app.myDom.checkForAllDuplicate();
    // console.log('DUPLICATE FOR poker 40 + TEST ');
    for(var key in TEST) {
      if(TEST[key] == 4 || TEST[key] > 4) {
        // win
        var getDiceID = parseInt(key.replace('value__', ''))
        var win = getDiceID * 4;
        byId('down-poker').innerHTML = win + 40;
        myDom.incrasePoints(win + 40);
      }
    }
    byId('down-poker').removeEventListener('click', this.attachDownPoker)
    byId('down-jamb').addEventListener('click', this.attachDownJamb)
    dices.STATUS = "FREE_TO_PLAY";
    dispatchEvent(new CustomEvent('FREE_TO_PLAY', {}))
  },

  attachDownJamb: function() {
    byId('down-jamb').removeEventListener('click', this.attachDownJamb)
    console.log('<GAMEPLAY><DOWN ROW IS FEELED>')
    var TEST = app.myDom.checkForAllDuplicate();
    for(var key in TEST) {
      if(TEST[key] == 5 || TEST[key] > 5) {
        // win
        var getDiceID = parseInt(key.replace('value__', ''))
        var win = getDiceID * 5;
        byId('down-poker').innerHTML = win + 50;
        myDom.incrasePoints(win + 50);
      }
    }
    dices.STATUS = "FREE_TO_PLAY";
    dispatchEvent(new CustomEvent('FREE_TO_PLAY', {}))
  }
}