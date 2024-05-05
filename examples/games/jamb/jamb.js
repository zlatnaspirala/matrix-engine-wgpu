import MatrixEngineWGPU from "../../../src/world.js";
import {downloadMeshes} from '../../../src/engine/loader-obj.js';
import {LOG_FUNNY, LOG_INFO, LOG_MATRIX, byId, mb} from "../../../src/engine/utils.js";

export let dices = {
  C: 0,
  STATUS: 'FREE_TO_PLAY',
  R: {},
  checkAll: function() {
    this.C++;
    if(typeof this.R.CubePhysics1 != 'undefined' &&
      typeof this.R.CubePhysics2 != 'undefined' &&
      typeof this.R.CubePhysics3 != 'undefined' &&
      typeof this.R.CubePhysics4 != 'undefined' &&
      typeof this.R.CubePhysics5 != 'undefined' &&
      typeof this.R.CubePhysics6 != 'undefined' && this.C > 2000) {
      dispatchEvent(new CustomEvent('all-done', {detail: {}}))
      this.C = 0;
    }
  }
};

export let myDom = {

  state: {
    rowDown: []
  },

  memoNumberRow: [],

  createMenu: function() {

    var root = document.createElement('div')
    root.id = 'hud';
    root.style.position = 'absolute';
    root.style.right = '10%';
    root.style.top = '10%';

    var help = document.createElement('div')
    help.id = 'HELP';
    help.classList.add('btn2')
    help.innerHTML = `<span data-label="help"></span>`;

    var settings = document.createElement('div')
    settings.id = 'settings';
    settings.classList.add('btn2')
    settings.innerHTML = `settings`;
    settings.addEventListener('click', () => {
      
      byId('messageBox').innerHTML = `
      <div>
        <span data-label="settings"></span>
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

    console.log('TEST', app.label.get)
    messageBox.innerHTML = `
     <span data-label="welcomeMsg"></span>
     <a href="https://github.com/zlatnaspirala/matrix-engine-wgpu">zlatnaspirala/matrix-engine-wgpu</a><br><br>
     <button class="btn" ><span style="font-size:30px;margin:15px;padding:10px" data-label="startGame"></span></button> <br>
     <div><span data-label="changeLang"></span></div> 
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
    };

    messageBox.addEventListener('click', initialMsgBoxEvent)
    root.append(messageBox)

    document.body.appendChild(root);

    app.label.update();
  },

  createJamb: function() {
    var root = document.createElement('div')
    root.id = 'jambTable';
    root.style.position = 'absolute';
    root.style.display = 'flex';
    root.style.top = '10px';
    root.style.left = '10px';
    root.style.width = '200px';
    // root.style.height = '500px';
    root.style.background = '#7d7d7d8c';

    var rowHeader = document.createElement('div')
    rowHeader.id = 'rowHeader';
    rowHeader.style.top = '10px';
    rowHeader.style.left = '10px';
    rowHeader.style.width = '200px';
    // rowHeader.style.background = '#7d7d7d8c';
    rowHeader.innerHTML = 'NIDZA';
    root.appendChild(rowHeader);
    rowHeader.classList.add('myTheme1')

    var rowDown = document.createElement('div')
    rowDown.id = 'rowDown';
    rowDown.style.top = '10px';
    rowDown.style.left = '10px';
    rowDown.style.width = '200px';
    // rowDown.style.background = '#7d7d7d8c';
    rowDown.innerHTML = '↓';
    rowDown.classList.add('myTheme1')
    // this.createRow(rowDown);
    // this.createSumField(rowDown);
    root.appendChild(rowDown);

    var rowFree = document.createElement('div')
    rowFree.id = 'rowFree';
    rowFree.style.top = '10px';
    rowFree.style.left = '10px';
    rowFree.style.width = '200px';
    // rowFree.style.background = '#7d7d7d8c';
    rowFree.innerHTML = '↕';
    rowFree.classList.add('myTheme1')
    root.appendChild(rowFree);

    var rowUp = document.createElement('div')
    rowUp.id = 'rowUp';
    rowUp.style.top = '10px';
    rowUp.style.left = '10px';
    rowUp.style.width = '200px';
    // rowUp.style.background = '#7d7d7d8c';
    rowUp.innerHTML = '↑';
    rowUp.classList.add('myTheme1')
    root.appendChild(rowUp);

    var rowHand = document.createElement('div')
    rowHand.id = 'rowHand';
    rowHand.style.top = '10px';
    rowHand.style.left = '10px';
    rowHand.style.width = '200px';
    // rowHand.style.background = '#7d7d7d8c';
    rowHand.innerHTML = 'Hand';
    rowHand.classList.add('myTheme1')
    root.appendChild(rowHand);

    // INJECT TABLE HEADER ROW
    this.createLeftHeaderRow(rowHeader);
    this.createRowDown(rowDown);
    this.createRow(rowFree);
    this.createRow(rowUp);
    this.createRow(rowHand);

    document.body.appendChild(root);
    console.log('JambTable added.')
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
    fullHouse.innerHTML = `Full`;
    myRoot.appendChild(fullHouse);

    var poker = document.createElement('div')
    poker.id = 'H_poker';
    poker.style.width = 'auto';
    poker.style.background = '#7d7d7d8c';
    poker.innerHTML = `Poker`;
    myRoot.appendChild(poker);

    var jamb = document.createElement('div')
    jamb.id = 'H_jamb';
    jamb.style.width = 'auto';
    jamb.style.background = '#7d7d7d8c';
    jamb.innerHTML = `Jamb`;
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
    rowSumFINAL.innerHTML = `Final Σ`;
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
    threeOfAKind.id = 'threeOfAKind';
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

        if(dices.STATUS == "IN_PLAY" || dices.STATUS == "FREE_TO_PLAY") {
          console.log('BLOCK FROM JAMB DOM  ')
          if(dices.STATUS == "IN_PLAY") mb.error(`STATUS IS ${dices.STATUS}, please wait for results...`);
          if(dices.STATUS == "FREE_TO_PLAY") mb.error(`STATUS IS ${dices.STATUS}, you need to roll dice first.`);
          return;
        }

        var getName = e.target.id;
        getName = getName.replace('down-rowNumber', '')
        if(this.state.rowDown.length == 0) {
          console.log('LOG ', getName)
          if(parseInt(getName) == 1) {
            var count1 = 0;
            for(let key in dices.R) {
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
              for(let key in dices.R) {
                if(parseInt(dices.R[key]) == parseInt(getName)) {
                  console.log('yeap', dices.R)
                  count23456++;
                }
              }
              this.state.rowDown.push((count23456 * parseInt(getName)))
              e.target.innerHTML = (count23456 * parseInt(getName));
              if(parseInt(getName) == 6) {
                // calc sum
                console.log('calc sum for numb ~ ')
                //  this.state.rowDown.length + 1
                myDom.calcDownNumbers()
                e.target.classList.remove('canPlay')
              } else {
                e.target.classList.remove('canPlay')
                this.memoNumberRow[parseInt(getName)].classList.add('canPlay')
              }
              dices.STATUS = "FREE_TO_PLAY";

              
              // dev
              // myDom.calcDownNumbers()

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

    var rowMin = document.createElement('div')
    rowMin.id = 'down-rowMax';
    rowMin.style.width = 'auto';
    rowMin.style.background = '#7d7d7d8c';
    rowMin.innerHTML = `-`;
    myRoot.appendChild(rowMin);

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
    console.log('sum is ', s)
    byId('down-rowNumberSum').style.background = 'rgb(113 0 0 / 55%)';
    byId('down-rowNumberSum').innerHTML = s;
    // unlock MAX and MIN

  }
};