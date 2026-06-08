import {LOG_FUNNY, byId, mb, setupCanvasFilters, typeText} from "../../../src/engine/utils.js";
import {settingsBox, welcomeBoxHTML} from "./html-content.js";

export let dices = {
  C: 0,
  STATUS: 'FREE_TO_PLAY',
  R: {},
  SAVED_DICES: {},
  allDoneEvent: new CustomEvent('all-done', {detail: {}}),
  freeToPlayEvent: new CustomEvent('FREE_TO_PLAY', {}),
  pickDice: function(dice) {
    if(Object.keys(this.SAVED_DICES).length >= 5) {
      console.log("⚠️ You can only select up to 5 dice!");
      return;
    }
    this.SAVED_DICES[dice] = this.R[dice]
    this.refreshSelectedBox()
  },
  unPickDice: function(dice) {
    if(Object.keys(this.SAVED_DICES).length == 0) {
      console.log("⚠️ no dice in selected box!");
      return;
    }
    delete this.SAVED_DICES[dice];
    let B = app.matrixPhysics.getBodyByName(dice);
    app.matrixPhysics.switchToDinamic(B);
    console.log("⚠️ UNPICK TEST  dice in selected box!");
    // this.refreshSelectedBox()
  },

  setStartUpPosition: () => {
    for(var x = 1;x < 7;x++) {
      console.log('DEBUG : app.matrixPhysics.getBodyByName ', app.matrixPhysics.getBodyByName(('CubePhysics' + x)).MEObject)
      const id = app.matrixPhysics.getBodyByName(('CubePhysics' + x));
      app.matrixPhysics.setKinematicTransform(id, -6 + x * 2, 2, -15)
    }
  },

  refreshSelectedBox: function(arg) {
    let currentIndex = 0;
    const physics = app.matrixPhysics;
    for(var name in this.SAVED_DICES) {
      let B = physics.getBodyByName(name);
      if(!B) continue;
      physics.switchToKinematic(B);
      physics.setBodyTransform(B, 0, 0, 0);
      physics.setKinematicTransform(B, -5 + currentIndex, 5, -16);
      currentIndex += 3;
    }
  },

  resetBodyAboveFloor: function(body, z = -14) {
    const pos = {x: -1 + Math.random(), y: 3, z: z};
    app.matrixPhysics.setBodyTransform(body, pos.x, pos.y, pos.z);
    app.matrixPhysics.activate(body, true);
  },

  activateAllDicesPhysics: function() {
    this.getAllDices().forEach((dice) => {
      const body = app.matrixPhysics.getBodyByName(dice.name);
      if(body) {app.matrixPhysics.switchToDinamic(body);}
    });
  },

  getAllDices: function() {
    return app.mainRenderBundle.filter(item => item.name.indexOf("CubePhysics") !== -1);
  },

  getDiceByName: function(name) {
    return app.mainRenderBundle.find(item => item.name === name);
  },

  checkAll: function() {
    this.C++;
    let activeRollingCount = 0;
    let allReady = true;
    for(let i = 1;i <= 6;i++) {
      const key = "CubePhysics" + i;
      if(key in this.SAVED_DICES) continue;
      activeRollingCount++;
      console.log(' ker  ', key)
      console.log(' ker  ', this.R[key])
      if(typeof this.R[key] === 'undefined') {
        allReady = false;
        break;
      }
    }
    // console.log('allReady ', allReady)
    if(allReady && this.C > activeRollingCount) {
      // console.log('test checkall all done ')
      dispatchEvent(dices.allDoneEvent);
      this.C = 0;
    }
  },

  validatePass: function() {
    if(Object.keys(this.SAVED_DICES).length !== 5) {
      console.log('%cBLOCK', LOG_FUNNY)
      mb.error(`Must select (minimum) 5 dices before add results...`);
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
    rowDown: [],
    up_: [],
    hand_: []
  },
  memoNumberRow: [],
  memoAllFreeRowElements: [],
  checkEndOfGame: function() {
    // check all free
    let allFree = true;
    // free-rowNumber
    app.myDom.memoAllFreeRowElements.forEach((item) => {
      if(item.innerHTML == '-') allFree = false;
    })
    if(allFree == false) {
      console.log('not end')
      return false;
    }
    if(byId('up-rowNumber1').innerHTML != '-' &&
      byId('down-jamb').innerHTML != '-') {
      dispatchEvent(new CustomEvent('updateTitle', {detail: {text: 'Game finished.', status: 'finished'}}));
      console.log('GAME END!')
      return true;
    }
  },

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
    help.addEventListener('click', () => {
      if(byId('helpBox').style.display != 'none') {
        byId('helpBox').style.display = 'none';
      } else {
        byId('helpBox').style.display = 'block';
      }
    });

    var table = document.createElement('div')
    table.id = 'showHideTableDOM';
    table.classList.add('btn')
    table.innerHTML = `<span data-label="table"></span>`;
    table.addEventListener('click', () => {
      this.showHideJambTable()
    });

    var settings = document.createElement('div')
    settings.id = 'settings';
    settings.classList.add('btn')
    settings.innerHTML = `<span data-label="settings"></span>`;
    settings.addEventListener('click', () => {
      if(document.getElementById('messageBox').getAttribute('data-loaded') != null) {
        byId('blocker').style.display = 'flex';
        byId('messageBox').style.display = 'unset';
        return;
      }
      byId('messageBox').innerHTML = settingsBox;
      byId('blocker').style.display = 'flex';
      byId('messageBox').style.display = 'unset';
      dispatchEvent(new CustomEvent('updateLang', {}))

      byId('settingsAudios').click()
      byId('settingsAudios').addEventListener('change', (e) => {
        if(e.target.checked == true) {
          app.matrixSounds.unmuteAll();
        } else {
          app.matrixSounds.muteAll();
        }
      });

      // new
      byId('settingsLight').addEventListener('change', (e) => {
        if(e.target.checked == true) {
          app.makeMyLightMoveByY();
        } else {
          app.disableMyLightMoveByY();
        }
      });

      setupCanvasFilters();
      byId('messageBox').setAttribute('data-loaded', 'loaded');
      document.getElementById('physicsSpeed').value = app.matrixPhysics.speedUpSimulation;
      byId("physicsSpeed").addEventListener("change", (e) => {
        app.matrixPhysics.speedUpSimulation(parseInt(e.target.value));
      });
    })

    var helpBox = document.createElement('div')
    helpBox.id = 'helpBox';
    helpBox.style.position = 'absolute';
    helpBox.style.right = '20%';
    helpBox.style.zIndex = '2';
    helpBox.style.top = '15%';
    helpBox.style.width = '60%';
    helpBox.style.height = '50%';
    helpBox.style.fontSize = '100%';
    helpBox.classList.add('btn');
    helpBox.addEventListener('click', () => {
      byId('helpBox').style.display = 'none';
    });
    document.body.appendChild(helpBox)
    typeText('helpBox', app.label.get.about, 10);
    var roll = document.createElement('div')
    roll.id = 'hud-roll';
    roll.classList.add('btn');
    roll.innerHTML = `<span data-label="roll"></span>`;
    roll.addEventListener('click', () => {app.ROLL()})

    var separator = document.createElement('div')
    separator.innerHTML = `✨maximumroulette.com✨`;
    root.append(settings)
    root.append(table);
    root.append(help)
    root.append(separator)
    root.append(roll)
    document.body.appendChild(root)
    dispatchEvent(new CustomEvent('updateLang', {}))
  },

  createBlocker: function() {
    var root = document.createElement('div')
    root.id = 'blocker';
    var messageBox = document.createElement('div')
    messageBox.id = 'messageBox';
    messageBox.innerHTML = welcomeBoxHTML;
    let initialMsgBoxEvent = function() {
      console.log('click on msgbox')
      app.userState.name = byId('nickId').value != '' ? byId('nickId').value : "Guest";
      myDom.createSelectedBox();
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
    root.append(messageBox)
    document.body.appendChild(root);
    app.label.update();
    document.querySelectorAll('.btn, .fancy-label, .fancy-title').forEach(el => {
      el.addEventListener('mouseenter', () => {
        app.matrixSounds.play('hover');
      });
    });

    byId('nickId').addEventListener('keydown', (event) => {
      if(event.key === 'Enter') {initialMsgBoxEvent()}
    });

    setTimeout(() => {
      byId('startFromWelcome').addEventListener('click', initialMsgBoxEvent)
    }, 200);
  },

  createJamb: function() {
    var root = document.createElement('div')
    root.id = 'jambTable';
    root.style.position = 'absolute';

    var dragHandler = document.createElement('div')
    dragHandler.id = 'dragHandler';
    dragHandler.classList.add('dragHandler')
    dragHandler.innerHTML = "⇅ Drag";
    root.append(dragHandler)

    var rowHeader = document.createElement('div')
    rowHeader.id = 'rowHeader';
    rowHeader.style.top = '10px';
    rowHeader.style.left = '10px';
    rowHeader.style.width = '200px';
    rowHeader.innerHTML = `<span data-label="cornerText"></span><span id="user-points">0</span>
      <span>score</span>`;
    root.appendChild(rowHeader);
    rowHeader.classList.add('fancy-label')

    var rowDown = document.createElement('div')
    rowDown.id = 'rowDown';
    rowDown.style.top = '10px';
    rowDown.style.left = '10px';
    rowDown.style.width = '200px';
    rowDown.innerHTML = '↓<span data-label="down"></span>';
    rowDown.classList.add('fancy-label')
    rowDown.classList.add('btn')
    root.appendChild(rowDown);

    var rowFree = document.createElement('div')
    rowFree.id = 'rowFree';
    rowFree.style.top = '10px';
    rowFree.style.left = '10px';
    rowFree.style.width = '200px';
    rowFree.innerHTML = '↕<span data-label="free"></span>';
    rowFree.classList.add('fancy-label')
    rowFree.classList.add('btn')
    root.appendChild(rowFree);

    var rowUp = document.createElement('div')
    rowUp.id = 'rowUp';
    rowUp.style.top = '10px';
    rowUp.style.left = '10px';
    rowUp.style.width = '200px';
    rowUp.innerHTML = '↑<span data-label="up"></span>';
    rowUp.classList.add('fancy-label')
    rowUp.classList.add('btn')
    root.appendChild(rowUp);

    var rowHand = document.createElement('div')
    rowHand.id = 'rowHand';
    rowHand.style.top = '10px';
    rowHand.style.left = '10px';
    rowHand.style.width = '200px';
    rowHand.innerHTML = '<span data-label="hand"></span>';
    rowHand.classList.add('fancy-label')
    rowHand.classList.add('btn')

    // next level
    rowHand.style.display = 'none';
    root.appendChild(rowHand);

    this.createLeftHeaderRow(rowHeader);
    this.createRowDown(rowDown);
    this.createRowFree(rowFree);
    this.createRowUp(rowUp, 'up_');
    this.createRowHand(rowHand, 'hand_');
    document.body.appendChild(root);
  },

  showHideJambTable: () => {
    const panel = document.getElementById('jambTable');
    if(panel.classList.contains('show')) {
      panel.classList.remove('show');
      panel.classList.add('hide');
      // Delay actual hiding from layout to finish animation
      setTimeout(() => {
        panel.style.display = 'none';
      }, 300);
    } else {
      panel.style.display = 'flex';
      setTimeout(() => {
        panel.classList.remove('hide');
        panel.classList.add('show');
      }, 10);
    }
  },

  createSelectedBox: function() {
    var topTitleDOM = document.createElement('div')
    topTitleDOM.id = 'topTitleDOM';
    topTitleDOM.style.width = 'auto';
    topTitleDOM.style.position = 'absolute';
    topTitleDOM.style.left = '35%';
    topTitleDOM.style.fontSize = '175%';
    topTitleDOM.style.top = '4%';
    topTitleDOM.style.background = '#7d7d7d8c';
    topTitleDOM.innerHTML = app.label.get.ready + ", " + app.userState.name + '.';
    topTitleDOM.setAttribute('data-gamestatus', 'FREE');
    document.body.appendChild(topTitleDOM);
    addEventListener('updateTitle', (e) => {
      typeText('topTitleDOM', e.detail.text);
      topTitleDOM.setAttribute('data-gamestatus', e.detail.status);
    })
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

  createRowUp: function(myRoot, prefix) {
    for(var x = 1;x < 7;x++) {
      var rowNumber = document.createElement('div')
      rowNumber.id = 'up-rowNumber' + x;
      rowNumber.style.top = '10px';
      rowNumber.style.left = '10px';
      rowNumber.style.width = 'auto';
      rowNumber.style.background = '#7d7d7d8c';
      rowNumber.style.cursor = 'pointer';
      rowNumber.innerHTML = `-`;
      this.memoNumberRow.push(rowNumber)
      // initial
      if(x == 6) {
        rowNumber.classList.add('canPlay')
      }
      rowNumber.addEventListener('click', (e) => {
        if(dices.validatePass() == false ||
          byId('up_rowNumberSum').innerHTML == '-' /* hardcode for testing*/
        ) return;

        var getName = e.target.id;
        getName = getName.replace('up-rowNumber', '')
        if(myDom.state.up_.length == 0) {
          console.log('LOG ', getName)
          if(parseInt(getName) == 6) {
            var count6 = 0;
            for(let key in dices.SAVED_DICES) {
              if(parseInt(dices.R[key]) == 6) {
                console.log('yeap', dices.R)
                count6++;
              }
            }
            myDom.state.up_.push((count6 * 6))
            e.target.innerHTML = (count6 * 6);
            dices.STATUS = "FREE_TO_PLAY";
            dispatchEvent(dices.freeToPlayEvent)
          } else {
            console.log('BLOCK')
          }
        } else {
          if(myDom.state.up_.length > 0) {
            if(parseInt(getName) == (6 - myDom.state.up_.length)) {
              console.log('moze za ', parseInt(getName))
              var count23456 = 0;
              for(let key in dices.SAVED_DICES) {
                if(parseInt(dices.R[key]) == parseInt(getName)) {
                  console.log('yeap', dices.R)
                  count23456++;
                }
              }
              myDom.state.up_.push((count23456 * parseInt(getName)))
              //
              e.target.innerHTML = (count23456 * parseInt(getName));
              if(parseInt(getName) == 1) {
                // calc sum
                console.log('calc sum for numb UP 1-6 ')
                myDom.calcUpNumbers()
                myDom.checkEndOfGame();
              } else {
                // e.target.classList.remove('canPlay')
                // this.memoNumberRow[parseInt(getName)].classList.add('canPlay')
              }
              dices.STATUS = "FREE_TO_PLAY";
              dispatchEvent(dices.freeToPlayEvent)
            } else {
              console.log('BLOCK')
            }
          }
        }
      })
      myRoot.appendChild(rowNumber);
    }

    var rowNumberSum = document.createElement('div')
    rowNumberSum.id = prefix + 'rowNumberSum';
    rowNumberSum.style.width = 'auto';
    rowNumberSum.style.background = '#0000008c';
    rowNumberSum.innerHTML = `-`;
    myRoot.appendChild(rowNumberSum);

    var rowMax = document.createElement('div')
    rowMax.id = prefix + 'rowMax';
    rowMax.style.width = 'auto';
    rowMax.style.background = '#7d7d7d8c';
    rowMax.style.cursor = 'pointer';
    rowMax.innerHTML = `-`;
    myRoot.appendChild(rowMax);

    var rowMin = document.createElement('div')
    rowMin.id = prefix + 'rowMin';
    rowMin.style.width = 'auto';
    rowMin.style.background = '#7d7d7d8c';
    rowMin.style.cursor = 'pointer';
    rowMin.innerHTML = `-`;
    myRoot.appendChild(rowMin);

    var rowMaxMinSum = document.createElement('div')
    rowMaxMinSum.id = prefix + 'rowMaxMinSum';
    rowMaxMinSum.style.width = 'auto';
    rowMaxMinSum.style.background = '#000000ff';
    rowMaxMinSum.innerHTML = `-`;
    myRoot.appendChild(rowMaxMinSum);

    var largeStraight = document.createElement('div')
    largeStraight.id = prefix + 'largeStraight';
    largeStraight.style.width = 'auto';
    largeStraight.style.background = '#7d7d7d8c';
    largeStraight.innerHTML = `-`;
    largeStraight.style.cursor = 'pointer';
    myRoot.appendChild(largeStraight);

    var threeOfAKind = document.createElement('div')
    threeOfAKind.id = prefix + 'threeOfAKind';
    threeOfAKind.style.width = 'auto';
    threeOfAKind.style.background = '#7d7d7d8c';
    threeOfAKind.innerHTML = `-`;
    threeOfAKind.style.cursor = 'pointer';
    myRoot.appendChild(threeOfAKind);

    var fullHouse = document.createElement('div')
    fullHouse.id = prefix + 'fullHouse';
    fullHouse.style.width = 'auto';
    fullHouse.style.background = '#7d7d7d8c';
    fullHouse.innerHTML = `-`;
    fullHouse.style.cursor = 'pointer';
    myRoot.appendChild(fullHouse);

    var poker = document.createElement('div')
    poker.id = prefix + 'poker';
    poker.style.width = 'auto';
    poker.style.background = '#7d7d7d8c';
    poker.innerHTML = `-`;
    poker.style.cursor = 'pointer';
    myRoot.appendChild(poker);

    var jamb = document.createElement('div')
    jamb.id = prefix + 'jamb';
    jamb.style.width = 'auto';
    jamb.style.background = '#7d7d7d8c';
    jamb.innerHTML = `-`;
    jamb.style.cursor = 'pointer';
    jamb.addEventListener('click', myDom.attachUpJamb)
    myRoot.appendChild(jamb);

    var rowSum = document.createElement('div')
    rowSum.id = prefix + 'rowSum';
    rowSum.style.width = 'auto';
    rowSum.style.background = '#3333338c';
    rowSum.innerHTML = `-`;
    myRoot.appendChild(rowSum);
  },

  // from free
  createRowHand: function(myRoot) {
    for(var x = 1;x < 7;x++) {
      var rowNumber = document.createElement('div')
      rowNumber.id = 'hand_rowNumber' + x;
      rowNumber.style.top = '10px';
      rowNumber.style.left = '10px';
      rowNumber.style.width = 'auto';
      rowNumber.style.background = '#7d7d7d8c';
      rowNumber.innerHTML = `-`;
      rowNumber.style.cursor = 'pointer';
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
        e.target.innerHTML = (count23456 * parseInt(getName));
        myDom.calcFreeNumbers();
        dices.STATUS = "FREE_TO_PLAY";
        dispatchEvent(dices.freeToPlayEvent)
      })
      myRoot.appendChild(rowNumber);
    }

    var rowNumberSum = document.createElement('div')
    rowNumberSum.id = 'hand_rowNumberSum';
    rowNumberSum.style.width = 'auto';
    rowNumberSum.style.background = '#000000ff';
    rowNumberSum.innerHTML = `-`;
    myRoot.appendChild(rowNumberSum);

    var rowMax = document.createElement('div')
    rowMax.id = 'hand_rowMax';
    rowMax.style.width = 'auto';
    rowMax.style.background = '#7d7d7d8c';
    rowMax.innerHTML = `-`;
    rowMax.style.cursor = 'pointer';
    rowMax.addEventListener("click", this.calcFreeRowMax);
    myRoot.appendChild(rowMax);

    var rowMin = document.createElement('div')
    rowMin.id = 'hand_rowMin';
    rowMin.style.width = 'auto';
    rowMin.style.background = '#7d7d7d8c';
    rowMin.innerHTML = `-`;
    rowMin.style.cursor = 'pointer';
    rowMin.addEventListener('click', this.calcFreeRowMin);
    myRoot.appendChild(rowMin);

    var rowMaxMinSum = document.createElement('div')
    rowMaxMinSum.id = 'hand_rowMaxMinSum';
    rowMaxMinSum.style.width = 'auto';
    rowMaxMinSum.style.background = '#0000008c';
    rowMaxMinSum.innerHTML = `-`;
    myRoot.appendChild(rowMaxMinSum);

    var largeStraight = document.createElement('div')
    largeStraight.id = 'hand_largeStraight';
    largeStraight.style.width = 'auto';
    largeStraight.style.background = '#7d7d7d8c';
    largeStraight.innerHTML = `-`;
    largeStraight.style.cursor = 'pointer';
    largeStraight.addEventListener('click', this.attachFreeKenta);
    myRoot.appendChild(largeStraight);

    var threeOfAKind = document.createElement('div')
    threeOfAKind.id = 'hand_threeOfAKind';
    threeOfAKind.style.width = 'auto';
    threeOfAKind.style.background = '#7d7d7d8c';
    threeOfAKind.innerHTML = `-`;
    threeOfAKind.style.cursor = 'pointer';
    threeOfAKind.addEventListener('click', this.attachFreeTrilling)
    myRoot.appendChild(threeOfAKind);

    var fullHouse = document.createElement('div')
    fullHouse.id = 'hand_fullHouse';
    fullHouse.style.width = 'auto';
    fullHouse.style.background = '#7d7d7d8c';
    fullHouse.innerHTML = `-`;
    fullHouse.style.cursor = 'pointer';
    fullHouse.addEventListener('click', this.attachFreeFullHouse)
    myRoot.appendChild(fullHouse);

    var poker = document.createElement('div')
    poker.id = 'hand_poker';
    poker.style.width = 'auto';
    poker.style.background = '#7d7d7d8c';
    poker.innerHTML = `-`;
    poker.style.cursor = 'pointer';
    poker.addEventListener('click', this.attachFreePoker)
    myRoot.appendChild(poker);

    var jamb = document.createElement('div')
    jamb.id = 'hand_jamb';
    jamb.style.width = 'auto';
    jamb.style.background = '#7d7d7d8c';
    jamb.innerHTML = `-`;
    jamb.style.cursor = 'pointer';
    // jamb.addEventListener('click', myDom.attachUpJamb)
    myRoot.appendChild(jamb);

    var rowSum = document.createElement('div')
    rowSum.id = 'hand_rowSum';
    rowSum.style.width = 'auto';
    rowSum.style.background = '#0000008c';
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
      rowNumber.style.cursor = 'pointer';
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
        e.target.innerHTML = (count23456 * parseInt(getName));
        // if(parseInt(getName) == 6) {
        // calc for all 
        myDom.calcFreeNumbers()
        // }
        dices.STATUS = "FREE_TO_PLAY";
        dispatchEvent(dices.freeToPlayEvent)
        myDom.checkEndOfGame();
      })
      myRoot.appendChild(rowNumber);
      this.memoAllFreeRowElements.push(rowNumber);
    }

    var rowNumberSum = document.createElement('div')
    rowNumberSum.id = 'free-rowNumberSum';
    rowNumberSum.style.width = 'auto';
    rowNumberSum.style.background = '#000000ff';
    rowNumberSum.innerHTML = `-`;
    myRoot.appendChild(rowNumberSum);

    var rowMax = document.createElement('div')
    rowMax.id = 'free-rowMax';
    rowMax.style.width = 'auto';
    rowMax.style.background = '#7d7d7d8c';
    rowMax.innerHTML = `-`;
    rowMax.style.cursor = 'pointer';
    rowMax.addEventListener("click", this.calcFreeRowMax);
    myRoot.appendChild(rowMax);
    this.memoAllFreeRowElements.push(rowMax);

    var rowMin = document.createElement('div')
    rowMin.id = 'free-rowMin';
    rowMin.style.width = 'auto';
    rowMin.style.background = '#7d7d7d8c';
    rowMin.innerHTML = `-`;
    rowMin.style.cursor = 'pointer';
    rowMin.addEventListener('click', this.calcFreeRowMin);
    myRoot.appendChild(rowMin);
    this.memoAllFreeRowElements.push(rowMin);

    var rowMaxMinSum = document.createElement('div')
    rowMaxMinSum.id = 'free-rowMaxMinSum';
    rowMaxMinSum.style.width = 'auto';
    rowMaxMinSum.style.background = '#0000008c';
    rowMaxMinSum.innerHTML = `-`;
    myRoot.appendChild(rowMaxMinSum);

    var largeStraight = document.createElement('div')
    largeStraight.id = 'free-largeStraight';
    largeStraight.style.width = 'auto';
    largeStraight.style.background = '#7d7d7d8c';
    largeStraight.innerHTML = `-`;
    largeStraight.style.cursor = 'pointer';
    largeStraight.addEventListener('click', this.attachFreeKenta);
    myRoot.appendChild(largeStraight);
    this.memoAllFreeRowElements.push(largeStraight);

    var threeOfAKind = document.createElement('div')
    threeOfAKind.id = 'free-threeOfAKind';
    threeOfAKind.style.width = 'auto';
    threeOfAKind.style.background = '#7d7d7d8c';
    threeOfAKind.innerHTML = `-`;
    threeOfAKind.style.cursor = 'pointer';
    threeOfAKind.addEventListener('click', this.attachFreeTrilling)
    myRoot.appendChild(threeOfAKind);
    this.memoAllFreeRowElements.push(threeOfAKind);

    var fullHouse = document.createElement('div')
    fullHouse.id = 'free-fullHouse';
    fullHouse.style.width = 'auto';
    fullHouse.style.background = '#7d7d7d8c';
    fullHouse.innerHTML = `-`;
    fullHouse.style.cursor = 'pointer';
    fullHouse.addEventListener('click', this.attachFreeFullHouse)
    myRoot.appendChild(fullHouse);
    this.memoAllFreeRowElements.push(fullHouse);

    var poker = document.createElement('div')
    poker.id = 'free-poker';
    poker.style.width = 'auto';
    poker.style.background = '#7d7d7d8c';
    poker.innerHTML = `-`;
    poker.style.cursor = 'pointer';
    poker.addEventListener('click', this.attachFreePoker)
    myRoot.appendChild(poker);
    this.memoAllFreeRowElements.push(poker);


    var jamb = document.createElement('div')
    jamb.id = 'free-jamb';
    jamb.style.width = 'auto';
    jamb.style.background = '#7d7d7d8c';
    jamb.innerHTML = `-`;
    jamb.style.cursor = 'pointer';
    jamb.addEventListener('click', this.attachFreeJamb)
    myRoot.appendChild(jamb);
    this.memoAllFreeRowElements.push(jamb);

    var rowSum = document.createElement('div')
    rowSum.id = 'free-rowSum';
    rowSum.style.width = 'auto';
    rowSum.style.background = '#0000008c';
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
      rowNumber.style.cursor = 'pointer';
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
        if(myDom.state.rowDown.length == 0) {
          console.log('LOG ', getName)
          if(parseInt(getName) == 1) {
            var count1 = 0;
            for(let key in dices.SAVED_DICES) {
              if(parseInt(dices.R[key]) == 1) {
                console.log('yeap', dices.R)
                count1++;
              }
            }
            myDom.state.rowDown.push(count1)
            e.target.innerHTML = count1;
            e.target.classList.remove('canPlay')
            myDom.memoNumberRow[1].classList.add('canPlay')
            dices.STATUS = "FREE_TO_PLAY";
            dispatchEvent(dices.freeToPlayEvent)
          } else {
            console.log('BLOCK')
          }
        } else {
          if(myDom.state.rowDown.length > 0) {
            if(parseInt(getName) == myDom.state.rowDown.length + 1) {
              console.log('moze za ', parseInt(getName))
              var count23456 = 0;
              for(let key in dices.SAVED_DICES) {
                if(parseInt(dices.R[key]) == parseInt(getName)) {
                  console.log('yeap', dices.R)
                  count23456++;
                }
              }
              myDom.state.rowDown.push((count23456 * parseInt(getName)))
              //
              e.target.innerHTML = (count23456 * parseInt(getName));
              if(parseInt(getName) == 6) {
                // calc sum
                console.log('calc sum for numb ~ ')
                myDom.calcDownNumbers()
                e.target.classList.remove('canPlay')
                byId('down-rowMax').classList.add('canPlay')
              } else {
                e.target.classList.remove('canPlay')
                this.memoNumberRow[parseInt(getName)].classList.add('canPlay')
              }
              dices.STATUS = "FREE_TO_PLAY";
              dispatchEvent(dices.freeToPlayEvent)
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
    rowNumberSum.style.background = '#0000008c';
    rowNumberSum.innerHTML = `-`;
    myRoot.appendChild(rowNumberSum);

    var rowMax = document.createElement('div')
    rowMax.id = 'down-rowMax';
    rowMax.style.width = 'auto';
    rowMax.style.background = '#7d7d7d8c';
    rowMax.innerHTML = `-`;
    rowMax.style.cursor = 'pointer';
    myRoot.appendChild(rowMax);

    var rowMin = document.createElement('div')
    rowMin.id = 'down-rowMin';
    rowMin.style.width = 'auto';
    rowMin.style.background = '#7d7d7d8c';
    rowMin.style.cursor = 'pointer';
    rowMin.innerHTML = `-`;
    myRoot.appendChild(rowMin);

    var rowMaxMinSum = document.createElement('div')
    rowMaxMinSum.id = 'down-rowMaxMinSum';
    rowMaxMinSum.style.width = 'auto';
    rowMaxMinSum.style.background = '#0000008c';
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
    rowSum.style.background = '#0000008c';
    rowSum.innerHTML = `-`;
    myRoot.appendChild(rowSum);
  },

  calcDownNumbers: function() {
    var s = 0;
    this.state.rowDown.forEach((i) => {
      console.log(parseFloat(i))
      s += parseFloat(i)
    })
    byId('down-rowNumberSum').style.background = '#0000008c';
    byId('down-rowNumberSum').innerHTML = s;
    myDom.incrasePoints(s);
    // console.log('this.rowMax also set free to plat status', this.rowMax)
    dices.STATUS = "FREE_TO_PLAY";
    dispatchEvent(dices.freeToPlayEvent)
    byId('down-rowMax').addEventListener("click", myDom.calcDownRowMax);
  },

  calcUpNumbers: function() {
    var s = 0;
    this.state.up_.forEach((i) => {
      console.log(parseFloat(i))
      s += parseFloat(i)
    })
    byId('up_rowNumberSum').style.background = '#0000008c';
    byId('up_rowNumberSum').innerHTML = s;
    myDom.incrasePoints(s);
    // console.log('this.rowMax also set free to plat status', this.rowMax)
    dices.STATUS = "FREE_TO_PLAY";
    dispatchEvent(dices.freeToPlayEvent)
    // byId('down-rowMax').addEventListener("click", myDom.calcDownRowMax);
  },

  // free row start

  calcFreeNumbers: function() {
    var s = 0;
    myDom.state.rowDown.forEach((i) => {
      console.log(parseFloat(i))
      s += parseFloat(i)
    })
    byId('free-rowNumberSum').style.background = 'black';
    byId('free-rowNumberSum').innerHTML = s;
    dices.STATUS = "FREE_TO_PLAY";
    dispatchEvent(dices.freeToPlayEvent)
    byId('free-rowMax').addEventListener("click", app.myDom.calcFreeRowMax)
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

    if(byId('free-rowMin').innerHTML != '-') {
      var SUMMINMAX = parseFloat(byId('free-rowMax').innerHTML) - parseFloat(byId('free-rowMin').innerHTML)
      byId('free-rowMaxMinSum').innerHTML = isNaN(SUMMINMAX) ? 0 : SUMMINMAX;
      myDom.incrasePoints((isNaN(SUMMINMAX) ? 0 : SUMMINMAX));
    }

    dices.STATUS = "FREE_TO_PLAY";
    dispatchEvent(dices.freeToPlayEvent);
    byId('free-rowMax').removeEventListener("click", app.myDom.calcFreeRowMax);

    myDom.checkEndOfGame();
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

    if(byId('free-rowMax').innerHTML != '-') {
      byId('free-rowMin').removeEventListener('click', app.myDom.calcFreeRowMin);
    }

    // calc max min dont forget rules for bonus +30
    var SUMMINMAX = parseFloat(byId('free-rowMax').innerHTML) - parseFloat(byId('free-rowMin').innerHTML)
    byId('free-rowMaxMinSum').innerHTML = isNaN(SUMMINMAX) ? 0 : SUMMINMAX;
    myDom.incrasePoints((isNaN(SUMMINMAX) ? 0 : SUMMINMAX));
    dices.STATUS = "FREE_TO_PLAY";
    dispatchEvent(dices.freeToPlayEvent)
    myDom.checkEndOfGame();
  },

  attachFreeKenta: function() {
    if(dices.validatePass() == false) return;
    console.log('Test free kenta :', dices.R)
    var result = app.myDom.checkForDuplicate()[0];
    var testArray = app.myDom.checkForDuplicate()[1];
    console.log('TEST duplik: ' + result);
    if(result.length >= 2) {
      // simplify for now
      byId('free-largeStraight').innerHTML = 0;
      console.log('must be 1 for kenta: ' + result);
      // var locPrevent = false;
      // testArray.forEach((item, index, array) => {
      //   if(result[0].value == item.value && locPrevent == false) {
      //     console.log('detect by value item.value', item.value)
      //     locPrevent = true;
      //     array.splice(index, 1);
      //   }
      // })
      // // if we catch  1 and 6 in same stack then it is not possible for kenta...
      // var test1 = false, test6 = false;
      // testArray.forEach((item, index, array) => {
      //   if(item.value == 1) {
      //     test1 = true;
      //   } else if(item.value == 6) {
      //     test6 = true;
      //   }
      // })
      // if(test1 == true && test6 == true) {
      //   byId('free-largeStraight').innerHTML = `0`;
      // } else if(test1 == true) {
      //   byId('free-largeStraight').innerHTML = 15 + 50;
      //   myDom.incrasePoints(15 + 50);
      // } else if(test6 == true) {
      //   byId('free-largeStraight').innerHTML = 20 + 50;
      //   myDom.incrasePoints(20 + 50);
      // }
    } else if(result < 2) {
      byId('free-largeStraight').innerHTML = 66;
      myDom.incrasePoints(66);
    }

    byId('free-largeStraight').removeEventListener('click', app.myDom.attachFreeKenta)
    dices.STATUS = "FREE_TO_PLAY";
    dispatchEvent(dices.freeToPlayEvent)

    myDom.checkEndOfGame();
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
    byId('free-threeOfAKind').removeEventListener('click', app.myDom.attachFreeTrilling)
    dices.STATUS = "FREE_TO_PLAY";
    dispatchEvent(dices.freeToPlayEvent)

    myDom.checkEndOfGame();
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
      console.log('...free-fullHouse.. ', win)
      byId('free-fullHouse').innerHTML = win + 30;
      myDom.incrasePoints(win + 30);
    } else {
      byId('free-fullHouse').innerHTML = 0;
    }

    byId('free-fullHouse').removeEventListener('click', app.myDom.attachFreeFullHouse)
    dices.STATUS = "FREE_TO_PLAY";
    dispatchEvent(dices.freeToPlayEvent)

    myDom.checkEndOfGame();
  },

  attachFreePoker: () => {
    if(dices.validatePass() == false) return;
    var TEST = app.myDom.checkForAllDuplicate();
    console.log('!!DUPLICATE FOR poker 4 + TEST ' + TEST);
    let isPoker = false;
    for(var key in TEST) {
      if(TEST[key] == 4 || TEST[key] > 4) {
        var getDiceID = parseInt(key.replace('value__', ''))
        var win = getDiceID * 4;
        byId('free-poker').innerHTML = win + 40;
        myDom.incrasePoints(win + 40);
        isPoker = true;
      }
    }
    byId('free-poker').removeEventListener('click', app.myDom.attachFreePoker)
    if(isPoker == false) {byId('free-poker').innerHTML = 0}
    dices.STATUS = "FREE_TO_PLAY";
    dispatchEvent(dices.freeToPlayEvent)

    myDom.checkEndOfGame();
  },

  attachFreeJamb: function() {
    if(dices.validatePass() == false) return;
    // console.log('<GAMEPLAY><FREE ROW IS FEELED>')
    var TEST = app.myDom.checkForAllDuplicate();
    let isJamb = false;
    for(var key in TEST) {
      if(TEST[key] == 5) {
        // win
        var getDiceID = parseInt(key.replace('value__', ''))
        var win = getDiceID * 5;
        byId('free-poker').innerHTML = win + 50;
        myDom.incrasePoints(win + 50);
        isJamb = true;
      }
    }
    byId('free-jamb').removeEventListener('click', app.myDom.attachFreeJamb)
    if(isJamb == false) {
      byId('free-jamb').innerHTML = 0;
    }
    dices.STATUS = "FREE_TO_PLAY";
    dispatchEvent(dices.freeToPlayEvent)

    myDom.checkEndOfGame();
  },
  // end of free row
  calcDownRowMax: (e) => {
    if(dices.validatePass() == false) return;
    e.target.classList.remove('canPlay');
    byId('down-rowMin').classList.add('canPlay');
    var test = 0;
    let keyLessNum = Object.keys(dices.R).reduce((key, v) => dices.R[v] < dices.R[key] ? v : key);
    // console.log('FIND MIN DICE TO REMOVE FROM SUM ', keyLessNum);
    for(var key in dices.SAVED_DICES) {
      if(key != keyLessNum) {
        test += parseFloat(dices.R[key]);
      }
    }
    e.target.innerHTML = test;
    // now attach next event.
    dices.STATUS = "FREE_TO_PLAY";
    dispatchEvent(dices.freeToPlayEvent);
    byId('down-rowMax').removeEventListener("click", myDom.calcDownRowMax);
    byId('down-rowMin').addEventListener('click', myDom.calcDownRowMin);
  },

  incrasePoints: function(arg) {
    byId('user-points').innerHTML = parseInt(byId('user-points').innerHTML) + parseInt(arg);
  },

  calcDownRowMin: () => {
    if(dices.validatePass() == false) return;
    byId('down-rowMin').classList.remove('canPlay')
    console.log('MIN ENABLED')
    var maxTestKey = Object.keys(dices.R).reduce(function(a, b) {return dices.R[a] > dices.R[b] ? a : b});
    var test = 0;
    for(var key in dices.R) {
      // if(key != maxTestKey) {
      test += parseFloat(dices.R[key])
      // } else {
      //   console.log('not calc dice ', dices.R[key])
      // }
    }
    byId('down-rowMin').innerHTML = test;
    byId('down-rowMin').removeEventListener('click', myDom.calcDownRowMin);
    // calc max min dont forget rules for bonus +30
    var SUMMINMAX = parseFloat(byId('down-rowMax').innerHTML) - parseFloat(byId('down-rowMin').innerHTML)
    byId('down-rowMaxMinSum').innerHTML = SUMMINMAX;
    myDom.incrasePoints(SUMMINMAX);
    dices.STATUS = "FREE_TO_PLAY";
    dispatchEvent(dices.freeToPlayEvent)
    byId('down-largeStraight').classList.add('canPlay');
    byId('down-largeStraight').addEventListener('click', myDom.attachKenta)
    // byId('down-rowMin').removeEventListener('click', myDom.calcDownRowMin);
  },

  checkForDuplicate: function() {
    var testArray = [];
    for(var key in dices.SAVED_DICES) {
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
    for(var key in dices.SAVED_DICES) {
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
    console.log('Test kenta  ', dices.SAVED_DICES)
    byId('down-largeStraight').classList.remove('canPlay')
    var result = app.myDom.checkForDuplicate()[0];
    var testArray = app.myDom.checkForDuplicate()[1];
    console.log('TEST duplik: ' + result);
    if(result.length > 0) {
      console.log('TEST duplik l : ' + result);
      var locPrevent = false;
      testArray.forEach((item, index, array) => {
        if(result[0].value == item.value && locPrevent == false) {
          console.log('detect by value item.value', item.value)
          locPrevent = true;
          array.splice(index, 1);
        }
      })
      byId('down-largeStraight').innerHTML = `0`;

    } else if(result < 2) {
      byId('down-largeStraight').innerHTML = 66;
      myDom.incrasePoints(66);
    } else {
      // zero value
      byId('down-largeStraight').innerHTML = `0`;
    }
    byId('down-threeOfAKind').addEventListener('click', myDom.attachDownTrilling)
    byId('down-largeStraight').removeEventListener('click', myDom.attachKenta)
    dices.STATUS = "FREE_TO_PLAY";
    dispatchEvent(dices.freeToPlayEvent)
  },

  attachDownTrilling: function() {
    var result = app.myDom.checkForDuplicate()[0];
    // var testArray = app.myDom.checkForDuplicate()[1];
    // console.log('DUPLICATE FOR TRILING ', result);
    if(result.length > 2) {
      var testWin = 0;
      var TEST = app.myDom.checkForAllDuplicate();
      console.log('DUPLICATE FOR TRILING TEST ', TEST);
      let isTrilling = false;
      for(var key in TEST) {
        if(TEST[key] > 2) {
          // win
          var getDiceID = parseInt(key.replace('value__', ''))
          testWin = getDiceID * 3;
          isTrilling = true;
          console.log('DUPLICATE FOR TRILING 30 + TEST ', testWin);
          byId('down-threeOfAKind').innerHTML = 20 + testWin;
          myDom.incrasePoints(20 + testWin);
        }
      }
      if(isTrilling == false) {
        byId('down-threeOfAKind').innerHTML = 0;
      }
    } else {
      byId('down-threeOfAKind').innerHTML = 0;
    }
    byId('down-threeOfAKind').removeEventListener('click', myDom.attachDownTrilling)
    byId('down-fullHouse').addEventListener('click', myDom.attachDownFullHouse)
    dices.STATUS = "FREE_TO_PLAY";
    dispatchEvent(dices.freeToPlayEvent)
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
    byId('down-poker').addEventListener('click', myDom.attachDownPoker)
    byId('down-fullHouse').removeEventListener('click', myDom.attachDownFullHouse)
    dices.STATUS = "FREE_TO_PLAY";
    dispatchEvent(dices.freeToPlayEvent)
  },

  attachDownPoker: function() {
    var TEST = app.myDom.checkForAllDuplicate();
    // console.log('DUPLICATE FOR poker 40 + TEST ');
    let isPoker = false;
    for(var key in TEST) {
      if(TEST[key] == 4 || TEST[key] > 4) {
        // win
        var getDiceID = parseInt(key.replace('value__', ''))
        var win = getDiceID * 4;
        byId('down-poker').innerHTML = win + 40;
        myDom.incrasePoints(win + 40);
        isPoker = true;
      }
    }
    if(isPoker == false) {
      byId('down-poker').innerHTML = 0;
    }
    byId('down-poker').removeEventListener('click', myDom.attachDownPoker)
    byId('down-jamb').addEventListener('click', myDom.attachDownJamb)
    dices.STATUS = "FREE_TO_PLAY";
    dispatchEvent(dices.freeToPlayEvent)
  },

  attachDownJamb: function() {
    byId('down-jamb').removeEventListener('click', myDom.attachDownJamb)
    console.log('<GAMEPLAY><DOWN ROW IS FEELED>')
    var TEST = app.myDom.checkForAllDuplicate();
    let isJamb = false;
    for(var key in TEST) {
      if(TEST[key] == 5 || TEST[key] > 5) {
        // win
        var getDiceID = parseInt(key.replace('value__', ''))
        var win = getDiceID * 5;
        byId('down-jamb').innerHTML = win + 50;
        myDom.incrasePoints(win + 50);
        isJamb = true;
      }
    }
    if(isJamb == false) {
      byId('down-jamb').innerHTML = 0;
    }
    dices.STATUS = "FREE_TO_PLAY";
    dispatchEvent(dices.freeToPlayEvent)

    myDom.checkEndOfGame();
  },

  attachUpJamb: function() {

    console.log('<GAMEPLAY><DOWN ROW IS FEELED>')
    var TEST = app.myDom.checkForAllDuplicate();
    let isJamb = false;
    for(var key in TEST) {
      if(TEST[key] == 5 || TEST[key] > 5) {
        // win
        var getDiceID = parseInt(key.replace('value__', ''))
        var win = getDiceID * 5;
        byId('up_jamb').innerHTML = win + 50;
        myDom.incrasePoints(win + 50);
        isJamb = true;
      }
    }
    if(isJamb == false) {
      byId('up_jamb').innerHTML = 0;
    }

    byId('up_jamb').removeEventListener('click', myDom.attachUpJamb)
    byId('up_poker').addEventListener('click', myDom.attachUpPoker)
    dices.STATUS = "FREE_TO_PLAY";
    dispatchEvent(dices.freeToPlayEvent)
  },

  attachUpPoker: function() {
    var TEST = app.myDom.checkForAllDuplicate();
    // console.log('DUPLICATE FOR poker 40 + TEST ');
    let isPoker = false;
    for(var key in TEST) {
      if(TEST[key] == 4 || TEST[key] > 4) {
        // win
        var getDiceID = parseInt(key.replace('value__', ''))
        var win = getDiceID * 4;
        byId('up_poker').innerHTML = win + 40;
        myDom.incrasePoints(win + 40);
        isPoker = true;
      }
    }
    if(isPoker == false) {
      byId('up_poker').innerHTML = 0;
    }
    byId('up_poker').removeEventListener('click', myDom.attachUpPoker)
    byId('up_fullHouse').addEventListener('click', myDom.attachUpFullHouse)
    dices.STATUS = "FREE_TO_PLAY";
    dispatchEvent(dices.freeToPlayEvent)
  },

  attachUpFullHouse: function() {
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
      byId('up_fullHouse').innerHTML = win + 30;
      myDom.incrasePoints(win + 30);
    } else {
      byId('up_fullHouse').innerHTML = 0;
    }
    byId('up_threeOfAKind').addEventListener('click', myDom.attachUpTrilling)
    byId('up_fullHouse').removeEventListener('click', myDom.attachUpFullHouse)
    dices.STATUS = "FREE_TO_PLAY";
    dispatchEvent(dices.freeToPlayEvent)
  },

  attachUpTrilling: function() {
    var result = app.myDom.checkForDuplicate()[0];
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
      byId('up_threeOfAKind').innerHTML = 20 + testWin;
      myDom.incrasePoints(20 + testWin);
    } else {
      byId('up_threeOfAKind').innerHTML = 0;
    }

    byId('up_threeOfAKind').removeEventListener('click', myDom.attachUpTrilling)
    byId('up_largeStraight').addEventListener('click', myDom.attachUpKenta)

    dices.STATUS = "FREE_TO_PLAY";
    dispatchEvent(dices.freeToPlayEvent)
  },

  attachUpKenta: function() {
    console.log('Test up kenta  ', dices.SAVED_DICES)
    byId('down-largeStraight').classList.remove('canPlay')
    var result = app.myDom.checkForDuplicate()[0];
    var testArray = app.myDom.checkForDuplicate()[1];
    console.log('TEST duplik: ' + result);
    if(result.length > 0) {
      console.log('TEST duplik l : ' + result);
      var locPrevent = false;
      testArray.forEach((item, index, array) => {
        if(result[0].value == item.value && locPrevent == false) {
          console.log('detect by value item.value', item.value)
          locPrevent = true;
          array.splice(index, 1);
        }
      })
      byId('up_largeStraight').innerHTML = `0`;

    } else if(result < 2) {
      byId('up_largeStraight').innerHTML = 66;
      myDom.incrasePoints(66);
    } else {
      // zero value
      byId('up_largeStraight').innerHTML = `0`;
    }
    byId('up_rowMin').addEventListener('click', myDom.calcUpRowMin)
    byId('up_largeStraight').removeEventListener('click', myDom.attachUpKenta)
    dices.STATUS = "FREE_TO_PLAY";
    dispatchEvent(dices.freeToPlayEvent)
  },

  calcUpRowMin: () => {
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
    byId('up_rowMin').innerHTML = test;
    byId('up_rowMin').removeEventListener('click', app.myDom.calcUpRowMin);
    byId('up_rowMax').addEventListener('click', app.myDom.calcUpRowMax);
    // calc max min dont forget rules for bonus +30
    // var SUMMINMAX = parseFloat(byId('free-rowMax').innerHTML) - parseFloat(byId('free-rowMin').innerHTML)
    // byId('up_rowMaxMinSum').innerHTML = isNaN(SUMMINMAX) ? 0 : SUMMINMAX;
    // myDom.incrasePoints((isNaN(SUMMINMAX) ? 0 : SUMMINMAX));
    dices.STATUS = "FREE_TO_PLAY";
    dispatchEvent(dices.freeToPlayEvent)
  },

  calcUpRowMax: (e) => {
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

    if(byId('free-rowMin').innerHTML != '-') {
      var SUMMINMAX = parseFloat(byId('free-rowMax').innerHTML) - parseFloat(byId('free-rowMin').innerHTML)
      byId('free-rowMaxMinSum').innerHTML = isNaN(SUMMINMAX) ? 0 : SUMMINMAX;
      myDom.incrasePoints((isNaN(SUMMINMAX) ? 0 : SUMMINMAX));
    }

    dices.STATUS = "FREE_TO_PLAY";
    dispatchEvent(dices.freeToPlayEvent);
    byId('free-rowMax').removeEventListener("click", app.myDom.calcFreeRowMax);
  },

  isDragging: false,
  offsetX: 0,
  offsetY: 0,
  addDraggerForTable: () => {
    byId('dragHandler').addEventListener('pointerdown', (e) => {
      myDom.isDragging = true;
      const rect = byId('jambTable').getBoundingClientRect();
      myDom.offsetX = e.clientX - rect.left;
      myDom.offsetY = e.clientY - rect.top;
      byId('dragHandler').setPointerCapture(e.pointerId);
    });

    byId('dragHandler').addEventListener('pointermove', (e) => {
      if(myDom.isDragging) {
        byId('jambTable').style.left = `${e.clientX - myDom.offsetX}px`;
        byId('jambTable').style.top = `${e.clientY - myDom.offsetY}px`;
      }
    });

    byId('dragHandler').addEventListener('pointerup', (e) => {
      myDom.isDragging = false;
      byId('dragHandler').releasePointerCapture(e.pointerId);
    });
  }
}

// app.makeMyLightMoveByY()