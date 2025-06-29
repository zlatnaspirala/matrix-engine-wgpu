(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";

var _jamb = require("./examples/games/jamb/jamb.js");
var _loadObjFile = require("./examples/load-obj-file.js");
var _unlitTextures = require("./examples/unlit-textures.js");
var _utils = require("./src/engine/utils.js");
/**
 * @examples
 * MATRIX_ENGINE_WGPU EXAMPLE WORKSPACE
 * Nikola Lukic 2024
 */

// For future
var examples = {
  loadJamb: _jamb.loadJamb,
  loadObjFile: _loadObjFile.loadObjFile,
  unlitTextures: _unlitTextures.unlitTextures
};
(0, _utils.byId)('loadObjFile').addEventListener("click", () => {
  (0, _utils.byId)('loadObjFile').setAttribute('disabled', true);
  (0, _utils.byId)('unlitTextures').removeAttribute('disabled');
  if (typeof app !== "undefined") app.destroyProgram();
  (0, _loadObjFile.loadObjFile)();
});
(0, _utils.byId)('unlitTextures').addEventListener("click", () => {
  (0, _utils.byId)('unlitTextures').setAttribute('disabled', true);
  (0, _utils.byId)('loadObjFile').removeAttribute('disabled');
  if (typeof app !== "undefined") app.destroyProgram();
  (0, _unlitTextures.unlitTextures)();
});
(0, _utils.byId)('jamb').addEventListener("click", () => {
  (0, _utils.byId)('unlitTextures').setAttribute('disabled', true);
  (0, _utils.byId)('loadObjFile').setAttribute('disabled', true);
  (0, _utils.byId)('jamb').removeAttribute('disabled');
  if (typeof app !== "undefined") app.destroyProgram();
  (0, _jamb.loadJamb)();
});

},{"./examples/games/jamb/jamb.js":3,"./examples/load-obj-file.js":4,"./examples/unlit-textures.js":5,"./src/engine/utils.js":15}],2:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.welcomeBoxHTML = exports.settingsBox = void 0;
let settingsBox = exports.settingsBox = `
<div>
  <span style="font-size:170%" data-label="settings"></span>
  <div style="margin:20px;" >
    <div>
      <span data-label="sounds"></span>
      <label class="switch">
        <input id="settingsAudios" type="checkbox">
        <span class="sliderSwitch round"></span>
      </label>
    </div>
    <div>
    <div>
      <span data-label="graphics"></span>
      <select id="blurControl">
        <option value="0px">Blur: 0</option>
        <option value="1px">Blur: 1</option>
        <option value="2px">Blur: 2</option>
        <option value="3px">Blur: 3</option>
      </select>
      </div>

      <div>
      <select id="grayscaleControl">
        <option value="0%">Grayscale: 0%</option>
        <option value="25%">Grayscale: 25%</option>
        <option value="50%">Grayscale: 50%</option>
        <option value="75%">Grayscale: 75%</option>
        <option value="100%">Grayscale: 100%</option>
      </select>
      </div>
      
      <div>
       <label>Brightness:</label>
      <select id="brightnessControl">
        <option value="100%">100%</option>
        <option value="150%">150%</option>
        <option value="200%">200%</option>
      </select>
      </div>
      
      <div>
      <label>Contrast:</label>
      <select id="contrastControl">
        <option value="100%">100%</option>
        <option value="150%">150%</option>
        <option value="200%">200%</option>
      </select>
      </div>
      
      <div>
      <label>Saturate:</label>
      <select id="saturateControl">
        <option value="100%">100%</option>
        <option value="150%">150%</option>
        <option value="200%">200%</option>
      </select>
     </div>
      
      <div>
      <label>Sepia:</label>
      <select id="sepiaControl">
        <option value="0%">0%</option>
        <option value="50%">50%</option>
        <option value="100%">100%</option>
      </select>
     </div>
      
      <div>
      <label>Invert:</label>
      <select id="invertControl">
        <option value="0%">0%</option>
        <option value="50%">50%</option>
        <option value="100%">100%</option>
      </select>
     </div>
      
      <div>
      <label>Hue Rotate:</label>
      <select id="hueControl">
        <option value="0deg">0°</option>
        <option value="90deg">90°</option>
        <option value="180deg">180°</option>
        <option value="270deg">270°</option>
      </select>
      </div>

    </div>
    <div>
      <button class="btn" onclick="app.myDom.hideSettings()">
        <span data-label="hide"></span>
      </button>
    </div>
  </div>
</div>`;
let welcomeBoxHTML = exports.welcomeBoxHTML = `<span class="fancy-title" data-label="welcomeMsg"></span>
     <a href="https://github.com/zlatnaspirala/matrix-engine-wgpu">zlatnaspirala/matrix-engine-wgpu</a><br><br>
     <div style="display:flex;flex-direction:column;align-items: center;margin:20px;padding: 10px;">
       <span style="width:100%">Choose nickname:</span>
       <input style="text-align: center;height:50px;font-size:100%;width:250px" class="fancy-label" type="text" value="Guest" />
      </div>
     <button id="startFromWelcome" class="btn" ><span style="font-size:30px;margin:15px;padding:10px" data-label="startGame"></span></button> <br>
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

},{}],3:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.myDom = exports.dices = void 0;
var _utils = require("../../../src/engine/utils.js");
var _htmlContent = require("./html-content.js");
let dices = exports.dices = {
  C: 0,
  STATUS: 'FREE_TO_PLAY',
  R: {},
  SAVED_DICES: {},
  pickDice: function (dice) {
    if (Object.keys(this.SAVED_DICES).length >= 5) {
      console.log("⚠️ You can only select up to 5 dice!");
      return; // prevent adding more
    }
    this.SAVED_DICES[dice] = this.R[dice];
    this.refreshSelectedBox();
  },
  refreshSelectedBox: function (arg) {
    let currentIndex = 0;
    for (var key in this.SAVED_DICES) {
      let B = app.matrixAmmo.getBodyByName(key);
      this.deactivatePhysics(B);
      const transform = new Ammo.btTransform();
      transform.setIdentity();
      transform.setOrigin(new Ammo.btVector3(0, 0, 0));
      B.setWorldTransform(transform);
      B.MEObject.position.setPosition(-5 + currentIndex, 5, -16);
      currentIndex += 3;
    }
  },
  deactivatePhysics: function (body) {
    const CF_KINEMATIC_OBJECT = 2;
    const DISABLE_DEACTIVATION = 4;
    // 1. Remove from world
    app.matrixAmmo.dynamicsWorld.removeRigidBody(body);
    // 2. Set body to kinematic
    const flags = body.getCollisionFlags();
    body.setCollisionFlags(flags | CF_KINEMATIC_OBJECT);
    body.setActivationState(DISABLE_DEACTIVATION); // no auto-wakeup
    // 3. Clear motion
    const zero = new Ammo.btVector3(0, 0, 0);
    body.setLinearVelocity(zero);
    body.setAngularVelocity(zero);
    // 4. Reset transform to current position (optional — preserves pose)
    const currentTransform = body.getWorldTransform();
    body.setWorldTransform(currentTransform);
    body.getMotionState().setWorldTransform(currentTransform);
    // 5. Add back to physics world
    app.matrixAmmo.dynamicsWorld.addRigidBody(body);
    // 6. Mark it manually (logic flag)
    body.isKinematic = true;
  },
  resetBodyAboveFloor: function (body, x = 0, z = 0) {
    const y = 3 + Math.random();
    const transform = new Ammo.btTransform();
    transform.setIdentity();
    transform.setOrigin(new Ammo.btVector3(x, y, z));
    body.setWorldTransform(transform);
    body.getMotionState().setWorldTransform(transform);
  },
  activatePhysics: function (body) {
    // 1. Make it dynamic again
    body.setCollisionFlags(body.getCollisionFlags() & ~2); // remove kinematic
    body.setActivationState(1); // ACTIVE_TAG
    body.isKinematic = false;

    // 2. Reset position ABOVE the floor — force it out of collision
    // const newY = 3 + Math.random(); // ensure it’s above the floor
    const transform = new Ammo.btTransform();
    transform.setIdentity();
    const newX = (Math.random() - 0.5) * 4; // spread from -2 to +2 on X
    const newY = 3; // fixed height above floor
    transform.setOrigin(new Ammo.btVector3(newX, newY, 0));
    body.setWorldTransform(transform);

    // 3. Clear velocities
    body.setLinearVelocity(new Ammo.btVector3(0, 0, 0));
    body.setAngularVelocity(new Ammo.btVector3(0, 0, 0));

    // 4. Enable CCD (to prevent tunneling)
    const size = 1; // cube side length
    body.setCcdMotionThreshold(1e-7);
    body.setCcdSweptSphereRadius(size * 0.5);

    // Re-add to world if needed
    // Optionally: remove and re-add if not responding
    app.matrixAmmo.dynamicsWorld.removeRigidBody(body);
    app.matrixAmmo.dynamicsWorld.addRigidBody(body);

    // 5. Reactivate it
    body.activate(true);
    this.resetBodyAboveFloor(body);
  },
  activateAllDicesPhysics: function () {
    this.getAllDices().filter(item => {
      let test = app.matrixAmmo.getBodyByName(item.name)?.isKinematicObject();
      if (test === true) {
        return true;
      } else {
        return false;
      }
    }).forEach(dice => {
      const body = app.matrixAmmo.getBodyByName(dice.name);
      if (body) {
        this.activatePhysics(body); // <--- FIX: pass the physics body, not the dice object
      }
    });
  },
  getAllDices: function () {
    return app.mainRenderBundle.filter(item => item.name.indexOf("CubePhysics") !== -1);
  },
  getDiceByName: function (name) {
    return app.mainRenderBundle.find(item => item.name === name);
  },
  checkAll: function () {
    this.C++;
    let activeRollingCount = 0;
    let allReady = true;
    for (let i = 1; i <= 6; i++) {
      const key = "CubePhysics" + i;
      if (key in this.SAVED_DICES) continue; // skip saved ones
      activeRollingCount++; // count how many are still active
      if (typeof this.R[key] === 'undefined') {
        allReady = false;
        break;
      }
    }
    // Dynamic threshold: min wait time based on rolling dice
    const minWait = Math.max(200, activeRollingCount * 200); // e.g. 1 die => 200, 5 dice => 1000, 6 dice => 1200
    if (allReady && this.C > minWait) {
      dispatchEvent(new CustomEvent('all-done', {
        detail: {}
      }));
      this.C = 0;
    }
  },
  validatePass: function () {
    if (Object.keys(this.SAVED_DICES).length !== 5) {
      console.log('%cBLOCK', _utils.LOG_FUNNY);
      _utils.mb.error(`Must select (minimum) 5 dices before add results...`);
      return false;
    }
    if (dices.STATUS != "FINISHED") {
      console.log('%cBLOCK', _utils.LOG_FUNNY);
      _utils.mb.error(`STATUS IS ${dices.STATUS}, please wait for results...`);
      app.matrixSounds.play('block');
      return false;
    } else {
      return true;
    }
  }
};
let myDom = exports.myDom = {
  state: {
    rowDown: []
  },
  memoNumberRow: [],
  hideSettings: function () {
    (0, _utils.byId)('blocker').style.display = 'none';
    (0, _utils.byId)('messageBox').style.display = 'none';
  },
  createMenu: function () {
    var root = document.createElement('div');
    root.id = 'hud';
    root.style.position = 'absolute';
    root.style.right = '10%';
    root.style.top = '10%';
    var help = document.createElement('div');
    help.id = 'HELP';
    help.classList.add('btn');
    help.innerHTML = `<span data-label="help"></span>`;
    var settings = document.createElement('div');
    settings.id = 'settings';
    settings.classList.add('btn');
    settings.innerHTML = `<span data-label="settings"></span>`;
    settings.addEventListener('click', () => {
      (0, _utils.byId)('messageBox').innerHTML = _htmlContent.settingsBox;
      (0, _utils.byId)('blocker').style.display = 'flex';
      (0, _utils.byId)('messageBox').style.display = 'unset';
      dispatchEvent(new CustomEvent('updateLang', {}));
      (0, _utils.byId)('settingsAudios').addEventListener('change', e => {
        if (e.target.checked == true) {
          app.matrixSounds.unmuteAll();
        } else {
          app.matrixSounds.muteAll();
        }
      });
      (0, _utils.setupCanvasFilters)();
    });
    var roll = document.createElement('div');
    roll.id = 'hud-roll';
    roll.classList.add('btn');
    roll.innerHTML = `<span data-label="roll"></span>`;
    roll.addEventListener('click', () => {
      app.ROLL();
    });
    var separator = document.createElement('div');
    separator.innerHTML = `✨maximumroulette.com✨`;
    root.append(settings);
    root.append(help);
    root.append(separator);
    root.append(roll);
    document.body.appendChild(root);

    // global access
    // app.label.update()
    dispatchEvent(new CustomEvent('updateLang', {}));
  },
  createBlocker: function () {
    var root = document.createElement('div');
    root.id = 'blocker';
    var messageBox = document.createElement('div');
    messageBox.id = 'messageBox';

    // console.log('TEST', app.label.get)
    messageBox.innerHTML = _htmlContent.welcomeBoxHTML;
    let initialMsgBoxEvent = function () {
      console.log('click on msgbox');
      (0, _utils.byId)('messageBox').innerHTML = ``;
      (0, _utils.byId)('blocker').style.display = 'none';
      myDom.createMenu();
      messageBox.removeEventListener('click', initialMsgBoxEvent);
      document.querySelectorAll('.btn, .fancy-label, .fancy-title').forEach(el => {
        el.addEventListener('mouseenter', () => {
          app.matrixSounds.play('hover');
        });
      });
    };
    root.append(messageBox);
    document.body.appendChild(root);
    app.label.update();
    document.querySelectorAll('.btn, .fancy-label, .fancy-title').forEach(el => {
      el.addEventListener('mouseenter', () => {
        app.matrixSounds.play('hover');
      });
    });
    setTimeout(() => {
      (0, _utils.byId)('startFromWelcome').addEventListener('click', initialMsgBoxEvent);
    }, 200);
  },
  createJamb: function () {
    var root = document.createElement('div');
    root.id = 'jambTable';
    root.style.position = 'absolute';
    root.style.display = 'flex';
    root.style.top = '5px';
    root.style.left = '5px';
    root.style.width = '200px';
    // root.style.background = '#7d7d7d8c';

    var rowHeader = document.createElement('div');
    rowHeader.id = 'rowHeader';
    rowHeader.style.top = '10px';
    rowHeader.style.left = '10px';
    rowHeader.style.width = '200px';
    rowHeader.innerHTML = '<span data-label="cornerText"></span><span id="user-points">0</span>';
    root.appendChild(rowHeader);
    rowHeader.classList.add('fancy-label');
    var rowDown = document.createElement('div');
    rowDown.id = 'rowDown';
    rowDown.style.top = '10px';
    rowDown.style.left = '10px';
    rowDown.style.width = '200px';
    rowDown.innerHTML = '↓<span data-label="down"></span>';
    rowDown.classList.add('fancy-label');
    rowDown.classList.add('btn');
    root.appendChild(rowDown);
    var rowFree = document.createElement('div');
    rowFree.id = 'rowFree';
    rowFree.style.top = '10px';
    rowFree.style.left = '10px';
    rowFree.style.width = '200px';
    rowFree.innerHTML = '↕<span data-label="free"></span>';
    rowFree.classList.add('fancy-label');
    rowFree.classList.add('btn');
    root.appendChild(rowFree);
    var rowUp = document.createElement('div');
    rowUp.id = 'rowUp';
    rowUp.style.top = '10px';
    rowUp.style.left = '10px';
    rowUp.style.width = '200px';
    rowUp.innerHTML = '↑<span data-label="up"></span>';
    rowUp.classList.add('fancy-label');
    rowUp.classList.add('btn');
    root.appendChild(rowUp);
    var rowHand = document.createElement('div');
    rowHand.id = 'rowHand';
    rowHand.style.top = '10px';
    rowHand.style.left = '10px';
    rowHand.style.width = '200px';
    rowHand.innerHTML = '<span data-label="hand"></span>';
    rowHand.classList.add('fancy-label');
    rowHand.classList.add('btn');
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
  createSelectedBox: function () {
    var topTitleDOM = document.createElement('div');
    topTitleDOM.id = 'topTitleDOM';
    topTitleDOM.style.width = 'auto';
    topTitleDOM.style.position = 'absolute';
    topTitleDOM.style.left = '35%';
    topTitleDOM.style.top = '5%';
    topTitleDOM.style.background = '#7d7d7d8c';
    topTitleDOM.innerHTML = app.label.get.ready + ", " + app.userState.name + '.';
    document.body.appendChild(topTitleDOM);
    addEventListener('updateTitle', e => {
      (0, _utils.typeText)('topTitleDOM', e.detail);
    });
  },
  createLeftHeaderRow: function (myRoot) {
    for (var x = 1; x < 7; x++) {
      var rowNumber = document.createElement('div');
      rowNumber.id = 'rowNumber' + x;
      rowNumber.style.top = '10px';
      rowNumber.style.left = '10px';
      rowNumber.style.width = 'auto';
      rowNumber.style.background = '#7d7d7d8c';
      rowNumber.innerHTML = `<span>${x}</span>`;
      myRoot.appendChild(rowNumber);
    }
    var rowNumberSum = document.createElement('div');
    rowNumberSum.id = 'H_rowNumberSum';
    rowNumberSum.style.width = 'auto';
    rowNumberSum.style.background = '#7d7d7d8c';
    rowNumberSum.innerHTML = `Σ`;
    myRoot.appendChild(rowNumberSum);
    var rowMax = document.createElement('div');
    rowMax.id = 'H_rowMax';
    rowMax.style.width = 'auto';
    rowMax.style.background = '#7d7d7d8c';
    rowMax.innerHTML = `<span data-label="MAX"></span>`;
    myRoot.appendChild(rowMax);
    var rowMin = document.createElement('div');
    rowMin.id = 'H_rowMax';
    rowMin.style.width = 'auto';
    rowMin.style.background = '#7d7d7d8c';
    rowMin.innerHTML = `<span data-label="MIN"></span>`;
    myRoot.appendChild(rowMin);
    var rowMaxMinSum = document.createElement('div');
    rowMaxMinSum.id = 'H_rowMaxMinSum';
    rowMaxMinSum.style.width = 'auto';
    rowMaxMinSum.style.background = '#7d7d7d8c';
    rowMaxMinSum.innerHTML = `Σ`;
    myRoot.appendChild(rowMaxMinSum);
    var largeStraight = document.createElement('div');
    largeStraight.id = 'H_largeStraight';
    largeStraight.style.width = 'auto';
    largeStraight.style.background = '#7d7d7d8c';
    largeStraight.innerHTML = `<span data-label="straight"></span>`;
    myRoot.appendChild(largeStraight);
    var threeOfAKind = document.createElement('div');
    threeOfAKind.id = 'H_threeOfAKind';
    threeOfAKind.style.width = 'auto';
    threeOfAKind.style.background = '#7d7d7d8c';
    threeOfAKind.innerHTML = `<span data-label="threeOf"></span>`;
    myRoot.appendChild(threeOfAKind);
    var fullHouse = document.createElement('div');
    fullHouse.id = 'H_fullHouse';
    fullHouse.style.width = 'auto';
    fullHouse.style.background = '#7d7d7d8c';
    fullHouse.innerHTML = `<span data-label="fullhouse"></span>`;
    myRoot.appendChild(fullHouse);
    var poker = document.createElement('div');
    poker.id = 'H_poker';
    poker.style.width = 'auto';
    poker.style.background = '#7d7d7d8c';
    poker.innerHTML = `<span data-label="poker"></span>`;
    myRoot.appendChild(poker);
    var jamb = document.createElement('div');
    jamb.id = 'H_jamb';
    jamb.style.width = 'auto';
    jamb.style.background = '#7d7d7d8c';
    jamb.innerHTML = `<span data-label="jamb"></span>`;
    myRoot.appendChild(jamb);
    var rowSum = document.createElement('div');
    rowSum.id = 'H_rowSum';
    rowSum.style.width = 'auto';
    rowSum.style.background = '#7d7d7d8c';
    rowSum.innerHTML = `Σ`;
    myRoot.appendChild(rowSum);
    var rowSumFINAL = document.createElement('div');
    rowSumFINAL.id = 'H_rowSumFINAL';
    rowSumFINAL.style.width = 'auto';
    rowSumFINAL.style.background = '#7d7d7d8c';
    rowSumFINAL.innerHTML = `<spam data-label="final"></span>`;
    myRoot.appendChild(rowSumFINAL);
  },
  createRow: function (myRoot) {
    for (var x = 1; x < 7; x++) {
      var rowNumber = document.createElement('div');
      rowNumber.id = 'rowNumber' + x;
      rowNumber.style.top = '10px';
      rowNumber.style.left = '10px';
      rowNumber.style.width = 'auto';
      rowNumber.style.background = '#7d7d7d8c';
      rowNumber.innerHTML = `-`;
      rowNumber.addEventListener('click', () => {
        console.log('LOG THIS ', this);
        // works
        // rowDown
        if (this.state.rowDown.length == 0) {
          console.log('it is no play yet in this row ', this);
        }
      });
      myRoot.appendChild(rowNumber);
    }
    var rowNumberSum = document.createElement('div');
    rowNumberSum.id = 'rowNumberSum';
    rowNumberSum.style.width = 'auto';
    rowNumberSum.style.background = '#7d7d7d8c';
    rowNumberSum.innerHTML = `-`;
    myRoot.appendChild(rowNumberSum);
    var rowMax = document.createElement('div');
    rowMax.id = 'rowMax';
    rowMax.style.width = 'auto';
    rowMax.style.background = '#7d7d7d8c';
    rowMax.innerHTML = `-`;
    myRoot.appendChild(rowMax);
    var rowMin = document.createElement('div');
    rowMin.id = 'rowMax';
    rowMin.style.width = 'auto';
    rowMin.style.background = '#7d7d7d8c';
    rowMin.innerHTML = `-`;
    myRoot.appendChild(rowMin);
    var rowMaxMinSum = document.createElement('div');
    rowMaxMinSum.id = 'rowMaxMinSum';
    rowMaxMinSum.style.width = 'auto';
    rowMaxMinSum.style.background = '#7d7d7d8c';
    rowMaxMinSum.innerHTML = `-`;
    myRoot.appendChild(rowMaxMinSum);
    var largeStraight = document.createElement('div');
    largeStraight.id = 'largeStraight';
    largeStraight.style.width = 'auto';
    largeStraight.style.background = '#7d7d7d8c';
    largeStraight.innerHTML = `-`;
    myRoot.appendChild(largeStraight);
    var threeOfAKind = document.createElement('div');
    threeOfAKind.id = 'down_threeOfAKind';
    threeOfAKind.style.width = 'auto';
    threeOfAKind.style.background = '#7d7d7d8c';
    threeOfAKind.innerHTML = `-`;
    myRoot.appendChild(threeOfAKind);
    var fullHouse = document.createElement('div');
    fullHouse.id = 'fullHouse';
    fullHouse.style.width = 'auto';
    fullHouse.style.background = '#7d7d7d8c';
    fullHouse.innerHTML = `-`;
    myRoot.appendChild(fullHouse);
    var poker = document.createElement('div');
    poker.id = 'poker';
    poker.style.width = 'auto';
    poker.style.background = '#7d7d7d8c';
    poker.innerHTML = `-`;
    myRoot.appendChild(poker);
    var jamb = document.createElement('div');
    jamb.id = 'jamb';
    jamb.style.width = 'auto';
    jamb.style.background = '#7d7d7d8c';
    jamb.innerHTML = `-`;
    myRoot.appendChild(jamb);
    var rowSum = document.createElement('div');
    rowSum.id = 'rowSum';
    rowSum.style.width = 'auto';
    rowSum.style.background = '#7d7d7d8c';
    rowSum.innerHTML = `-`;
    myRoot.appendChild(rowSum);
  },
  createRowFree: function (myRoot) {
    for (var x = 1; x < 7; x++) {
      var rowNumber = document.createElement('div');
      rowNumber.id = 'free-rowNumber' + x;
      rowNumber.style.top = '10px';
      rowNumber.style.left = '10px';
      rowNumber.style.width = 'auto';
      rowNumber.style.background = '#7d7d7d8c';
      rowNumber.innerHTML = `-`;
      rowNumber.addEventListener('click', e => {
        if (dices.validatePass() == false) return;
        var getName = e.target.id;
        getName = getName.replace('free-rowNumber', '');
        var count23456 = 0;
        for (let key in dices.SAVED_DICES) {
          if (parseInt(dices.R[key]) == parseInt(getName)) {
            count23456++;
          }
        }
        this.state.rowDown.push(count23456 * parseInt(getName));
        e.target.innerHTML = count23456 * parseInt(getName);
        if (parseInt(getName) == 6) {
          myDom.calcFreeNumbers();
        }
        dices.STATUS = "FREE_TO_PLAY";
        dispatchEvent(new CustomEvent('FREE_TO_PLAY', {}));
      });
      myRoot.appendChild(rowNumber);
    }
    var rowNumberSum = document.createElement('div');
    rowNumberSum.id = 'free-rowNumberSum';
    rowNumberSum.style.width = 'auto';
    rowNumberSum.style.background = '#7d7d7d8c';
    rowNumberSum.innerHTML = `-`;
    myRoot.appendChild(rowNumberSum);
    var rowMax = document.createElement('div');
    rowMax.id = 'free-rowMax';
    rowMax.style.width = 'auto';
    rowMax.style.background = '#7d7d7d8c';
    rowMax.innerHTML = `-`;
    rowMax.addEventListener("click", this.calcFreeRowMax);
    myRoot.appendChild(rowMax);
    var rowMin = document.createElement('div');
    rowMin.id = 'free-rowMin';
    rowMin.style.width = 'auto';
    rowMin.style.background = '#7d7d7d8c';
    rowMin.innerHTML = `-`;
    rowMin.addEventListener('click', this.calcFreeRowMin);
    myRoot.appendChild(rowMin);
    var rowMaxMinSum = document.createElement('div');
    rowMaxMinSum.id = 'free-rowMaxMinSum';
    rowMaxMinSum.style.width = 'auto';
    rowMaxMinSum.style.background = '#7d7d7d8c';
    rowMaxMinSum.innerHTML = `-`;
    myRoot.appendChild(rowMaxMinSum);
    var largeStraight = document.createElement('div');
    largeStraight.id = 'free-largeStraight';
    largeStraight.style.width = 'auto';
    largeStraight.style.background = '#7d7d7d8c';
    largeStraight.innerHTML = `-`;
    largeStraight.addEventListener('click', this.attachFreeKenta);
    myRoot.appendChild(largeStraight);
    var threeOfAKind = document.createElement('div');
    threeOfAKind.id = 'free-threeOfAKind';
    threeOfAKind.style.width = 'auto';
    threeOfAKind.style.background = '#7d7d7d8c';
    threeOfAKind.innerHTML = `-`;
    threeOfAKind.addEventListener('click', this.attachFreeTrilling);
    myRoot.appendChild(threeOfAKind);
    var fullHouse = document.createElement('div');
    fullHouse.id = 'free-fullHouse';
    fullHouse.style.width = 'auto';
    fullHouse.style.background = '#7d7d7d8c';
    fullHouse.innerHTML = `-`;
    fullHouse.addEventListener('click', this.attachFreeFullHouse);
    myRoot.appendChild(fullHouse);
    var poker = document.createElement('div');
    poker.id = 'free-poker';
    poker.style.width = 'auto';
    poker.style.background = '#7d7d7d8c';
    poker.innerHTML = `-`;
    poker.addEventListener('click', this.attachFreePoker);
    myRoot.appendChild(poker);
    var jamb = document.createElement('div');
    jamb.id = 'free-jamb';
    jamb.style.width = 'auto';
    jamb.style.background = '#7d7d7d8c';
    jamb.innerHTML = `-`;
    jamb.addEventListener('click', this.attachFreeJamb);
    myRoot.appendChild(jamb);
    var rowSum = document.createElement('div');
    rowSum.id = 'free-rowSum';
    rowSum.style.width = 'auto';
    rowSum.style.background = '#7d7d7d8c';
    rowSum.innerHTML = `-`;
    myRoot.appendChild(rowSum);
  },
  createRowDown: function (myRoot) {
    for (var x = 1; x < 7; x++) {
      var rowNumber = document.createElement('div');
      rowNumber.id = 'down-rowNumber' + x;
      rowNumber.style.top = '10px';
      rowNumber.style.left = '10px';
      rowNumber.style.width = 'auto';
      rowNumber.style.background = '#7d7d7d8c';
      rowNumber.innerHTML = `-`;
      this.memoNumberRow.push(rowNumber);
      // initial
      if (x == 1) {
        rowNumber.classList.add('canPlay');
      }
      rowNumber.addEventListener('click', e => {
        if (dices.validatePass() == false) return;
        var getName = e.target.id;
        getName = getName.replace('down-rowNumber', '');
        if (this.state.rowDown.length == 0) {
          console.log('LOG ', getName);
          if (parseInt(getName) == 1) {
            var count1 = 0;
            for (let key in dices.SAVED_DICES) {
              if (parseInt(dices.R[key]) == 1) {
                console.log('yeap', dices.R);
                count1++;
              }
            }
            this.state.rowDown.push(count1);
            e.target.innerHTML = count1;
            e.target.classList.remove('canPlay');
            this.memoNumberRow[1].classList.add('canPlay');
            dices.STATUS = "FREE_TO_PLAY";
            dispatchEvent(new CustomEvent('FREE_TO_PLAY', {}));
          } else {
            console.log('BLOCK');
          }
        } else {
          if (this.state.rowDown.length > 0) {
            if (parseInt(getName) == this.state.rowDown.length + 1) {
              console.log('moze za ', parseInt(getName));
              var count23456 = 0;
              for (let key in dices.SAVED_DICES) {
                if (parseInt(dices.R[key]) == parseInt(getName)) {
                  console.log('yeap', dices.R);
                  count23456++;
                }
              }
              this.state.rowDown.push(count23456 * parseInt(getName));
              //
              e.target.innerHTML = count23456 * parseInt(getName);
              if (parseInt(getName) == 6) {
                // calc sum
                console.log('calc sum for numb ~ ');
                //  this.state.rowDown.length + 1
                myDom.calcDownNumbers();
                e.target.classList.remove('canPlay');
                this.rowMax.classList.add('canPlay');
              } else {
                e.target.classList.remove('canPlay');
                this.memoNumberRow[parseInt(getName)].classList.add('canPlay');
              }
              dices.STATUS = "FREE_TO_PLAY";
              dispatchEvent(new CustomEvent('FREE_TO_PLAY', {}));
            } else {
              console.log('BLOCK');
            }
          }
        }
      });
      myRoot.appendChild(rowNumber);
    }
    var rowNumberSum = document.createElement('div');
    rowNumberSum.id = 'down-rowNumberSum';
    rowNumberSum.style.width = 'auto';
    rowNumberSum.style.background = '#7d7d7d8c';
    rowNumberSum.innerHTML = `-`;
    myRoot.appendChild(rowNumberSum);
    var rowMax = document.createElement('div');
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

    var rowMin = document.createElement('div');
    rowMin.id = 'down-rowMin';
    rowMin.style.width = 'auto';
    rowMin.style.background = '#7d7d7d8c';
    rowMin.innerHTML = `-`;
    this.rowMin = rowMin;
    myRoot.appendChild(rowMin);
    this.rowMin = rowMin;
    var rowMaxMinSum = document.createElement('div');
    rowMaxMinSum.id = 'down-rowMaxMinSum';
    rowMaxMinSum.style.width = 'auto';
    rowMaxMinSum.style.background = '#7d7d7d8c';
    rowMaxMinSum.innerHTML = `-`;
    myRoot.appendChild(rowMaxMinSum);
    var largeStraight = document.createElement('div');
    largeStraight.id = 'down-largeStraight';
    largeStraight.style.width = 'auto';
    largeStraight.style.background = '#7d7d7d8c';
    largeStraight.innerHTML = `-`;
    myRoot.appendChild(largeStraight);
    var threeOfAKind = document.createElement('div');
    threeOfAKind.id = 'down-threeOfAKind';
    threeOfAKind.style.width = 'auto';
    threeOfAKind.style.background = '#7d7d7d8c';
    threeOfAKind.innerHTML = `-`;
    myRoot.appendChild(threeOfAKind);
    var fullHouse = document.createElement('div');
    fullHouse.id = 'down-fullHouse';
    fullHouse.style.width = 'auto';
    fullHouse.style.background = '#7d7d7d8c';
    fullHouse.innerHTML = `-`;
    myRoot.appendChild(fullHouse);
    var poker = document.createElement('div');
    poker.id = 'down-poker';
    poker.style.width = 'auto';
    poker.style.background = '#7d7d7d8c';
    poker.innerHTML = `-`;
    myRoot.appendChild(poker);
    var jamb = document.createElement('div');
    jamb.id = 'down-jamb';
    jamb.style.width = 'auto';
    jamb.style.background = '#7d7d7d8c';
    jamb.innerHTML = `-`;
    myRoot.appendChild(jamb);
    var rowSum = document.createElement('div');
    rowSum.id = 'down-rowSum';
    rowSum.style.width = 'auto';
    rowSum.style.background = '#7d7d7d8c';
    rowSum.innerHTML = `-`;
    myRoot.appendChild(rowSum);
  },
  calcDownNumbers: function () {
    var s = 0;
    this.state.rowDown.forEach(i => {
      console.log(parseFloat(i));
      s += parseFloat(i);
    });
    (0, _utils.byId)('down-rowNumberSum').style.background = 'rgb(113 0 0 / 55%)';
    (0, _utils.byId)('down-rowNumberSum').innerHTML = s;
    // console.log('this.rowMax also set free to plat status', this.rowMax)
    dices.STATUS = "FREE_TO_PLAY";
    dispatchEvent(new CustomEvent('FREE_TO_PLAY', {}));
    this.rowMax.addEventListener("click", this.calcDownRowMax);
  },
  // free row start

  calcFreeNumbers: function () {
    var s = 0;
    this.state.rowDown.forEach(i => {
      console.log(parseFloat(i));
      s += parseFloat(i);
    });
    (0, _utils.byId)('free-rowNumberSum').style.background = 'rgb(113 0 0 / 55%)';
    (0, _utils.byId)('free-rowNumberSum').innerHTML = s;
    // console.log('this.rowMax also set free to plat status', this.rowMax)
    dices.STATUS = "FREE_TO_PLAY";
    dispatchEvent(new CustomEvent('FREE_TO_PLAY', {}));
    (0, _utils.byId)('free-rowMax').addEventListener("click", this.calc);
  },
  calcFreeRowMax: e => {
    if (dices.validatePass() == false) return;
    var test = 0;
    let keyLessNum = Object.keys(dices.R).reduce((key, v) => dices.R[v] < dices.R[key] ? v : key);
    for (var key in dices.R) {
      if (key != keyLessNum) {
        test += parseFloat(dices.R[key]);
      }
    }
    e.target.innerHTML = test;
    // now attach next event.
    dices.STATUS = "FREE_TO_PLAY";
    dispatchEvent(new CustomEvent('FREE_TO_PLAY', {}));
    (0, _utils.byId)('free-rowMax').removeEventListener("click", (void 0).calcFreeRowMax);
  },
  calcFreeRowMin: () => {
    if (dices.validatePass() == false) return;
    var maxTestKey = Object.keys(dices.R).reduce(function (a, b) {
      return dices.R[a] > dices.R[b] ? a : b;
    });
    var test = 0;
    for (var key in dices.R) {
      if (key != maxTestKey) {
        test += parseFloat(dices.R[key]);
      } else {
        console.log('not calc dice ', dices.R[key]);
      }
    }
    (0, _utils.byId)('free-rowMin').innerHTML = test;
    (0, _utils.byId)('free-rowMin').removeEventListener('click', (void 0).calcFreeRowMin);
    // calc max min dont forget rules for bonus +30
    var SUMMINMAX = parseFloat((0, _utils.byId)('free-rowMax').innerHTML) - parseFloat((0, _utils.byId)('free-rowMin').innerHTML);
    (0, _utils.byId)('free-rowMaxMinSum').innerHTML = SUMMINMAX;
    myDom.incrasePoints(SUMMINMAX);
    dices.STATUS = "FREE_TO_PLAY";
    dispatchEvent(new CustomEvent('FREE_TO_PLAY', {}));
  },
  attachFreeKenta: function () {
    if (dices.validatePass() == false) return;
    console.log('Test free kenta :', dices.R);
    var result = app.myDom.checkForDuplicate()[0];
    var testArray = app.myDom.checkForDuplicate()[1];
    console.log('TEST duplik: ' + result);
    if (result.length == 2) {
      console.log('TEST duplik less 3 : ' + result);
      var locPrevent = false;
      testArray.forEach((item, index, array) => {
        if (result[0].value == item.value && locPrevent == false) {
          console.log('detect by value item.value', item.value);
          locPrevent = true;
          array.splice(index, 1);
        }
      });
      // if we catch  1 and 6 in same stack then it is not possible for kenta...
      var test1 = false,
        test6 = false;
      testArray.forEach((item, index, array) => {
        if (item.value == 1) {
          test1 = true;
        } else if (item.value == 6) {
          test6 = true;
        }
      });
      if (test1 == true && test6 == true) {
        (0, _utils.byId)('free-largeStraight').innerHTML = `0`;
      } else if (test1 == true) {
        (0, _utils.byId)('free-largeStraight').innerHTML = 15 + 50;
        myDom.incrasePoints(15 + 50);
      } else if (test6 == true) {
        (0, _utils.byId)('free-largeStraight').innerHTML = 20 + 50;
        myDom.incrasePoints(20 + 50);
      }
    } else if (result < 2) {
      (0, _utils.byId)('free-largeStraight').innerHTML = 66;
      myDom.incrasePoints(66);
    } else {
      // zero value
      (0, _utils.byId)('free-largeStraight').innerHTML = `0`;
    }
    (0, _utils.byId)('free-largeStraight').removeEventListener('click', this.attachFreeKenta);
    dices.STATUS = "FREE_TO_PLAY";
    dispatchEvent(new CustomEvent('FREE_TO_PLAY', {}));
  },
  attachFreeTrilling: function () {
    if (dices.validatePass() == false) return;
    var result = app.myDom.checkForDuplicate()[0];
    // var testArray = app.myDom.checkForDuplicate()[1];
    // console.log('DUPLICATE FOR TRILING ', result);
    if (result.length > 2) {
      var testWin = 0;
      var TEST = app.myDom.checkForAllDuplicate();
      console.log('DUPLICATE FOR TRILING TEST ', TEST);
      for (var key in TEST) {
        if (TEST[key] > 2) {
          // win
          var getDiceID = parseInt(key.replace('value__', ''));
          testWin = getDiceID * 3;
        }
      }
      console.log('DUPLICATE FOR TRILING 30 + TEST ', testWin);
      if (testWin > 0) {
        (0, _utils.byId)('free-threeOfAKind').innerHTML = 20 + testWin;
        myDom.incrasePoints(20 + testWin);
      }
    } else {
      (0, _utils.byId)('free-threeOfAKind').innerHTML = 0;
    }
    (0, _utils.byId)('free-threeOfAKind').removeEventListener('click', this.attachFreeTrilling);
    dices.STATUS = "FREE_TO_PLAY";
    dispatchEvent(new CustomEvent('FREE_TO_PLAY', {}));
  },
  attachFreeFullHouse: function () {
    if (dices.validatePass() == false) return;
    var TEST = app.myDom.checkForAllDuplicate();
    // console.log('DUPLICATE FOR FULL HOUSE 30 + TEST ');
    var win = 0;
    var testPair = false;
    var testTrilling = false;
    var testWinPair = 0;
    var testWinTrilling = 0;
    for (var key in TEST) {
      if (TEST[key] == 2) {
        // win
        var getDiceID = parseInt(key.replace('value__', ''));
        testWinPair = getDiceID * 2;
        testPair = true;
      } else if (TEST[key] == 3) {
        var getDiceID = parseInt(key.replace('value__', ''));
        testWinTrilling = getDiceID * 3;
        testTrilling = true;
      }
    }
    if (testPair == true && testTrilling == true) {
      win = testWinPair + testWinTrilling;
      (0, _utils.byId)('free-fullHouse').innerHTML = win + 30;
      myDom.incrasePoints(win + 30);
    } else {
      (0, _utils.byId)('free-fullHouse').innerHTML = 0;
    }
    (0, _utils.byId)('free-fullHouse').removeEventListener('click', this.attachFreeFullHouse);
    dices.STATUS = "FREE_TO_PLAY";
    dispatchEvent(new CustomEvent('FREE_TO_PLAY', {}));
  },
  attachFreePoker: function () {
    if (dices.validatePass() == false) return;
    var TEST = app.myDom.checkForAllDuplicate();
    // console.log('DUPLICATE FOR poker 40 + TEST ');
    for (var key in TEST) {
      if (TEST[key] == 4 || TEST[key] > 4) {
        var getDiceID = parseInt(key.replace('value__', ''));
        var win = getDiceID * 4;
        (0, _utils.byId)('free-poker').innerHTML = win + 40;
        myDom.incrasePoints(win + 40);
      }
    }
    (0, _utils.byId)('free-poker').removeEventListener('click', this.attachFreePoker);
    dices.STATUS = "FREE_TO_PLAY";
    dispatchEvent(new CustomEvent('FREE_TO_PLAY', {}));
  },
  attachFreeJamb: function () {
    if (dices.validatePass() == false) return;
    // console.log('<GAMEPLAY><FREE ROW IS FEELED>')
    var TEST = app.myDom.checkForAllDuplicate();
    for (var key in TEST) {
      if (TEST[key] == 5 || TEST[key] > 5) {
        // win
        var getDiceID = parseInt(key.replace('value__', ''));
        var win = getDiceID * 5;
        (0, _utils.byId)('free-poker').innerHTML = win + 50;
        myDom.incrasePoints(win + 50);
      }
    }
    (0, _utils.byId)('free-jamb').removeEventListener('click', this.attachFreeJamb);
    dices.STATUS = "FREE_TO_PLAY";
    dispatchEvent(new CustomEvent('FREE_TO_PLAY', {}));
  },
  // end of free row

  calcDownRowMax: e => {
    if (dices.validatePass() == false) return;
    e.target.classList.remove('canPlay');
    (void 0).rowMin.classList.add('canPlay');
    var test = 0;
    let keyLessNum = Object.keys(dices.R).reduce((key, v) => dices.R[v] < dices.R[key] ? v : key);
    // console.log('FIND MIN DICE TO REMOVE FROM SUM ', keyLessNum);
    for (var key in dices.R) {
      if (key != keyLessNum) {
        test += parseFloat(dices.R[key]);
      }
    }
    e.target.innerHTML = test;
    // now attach next event.
    dices.STATUS = "FREE_TO_PLAY";
    dispatchEvent(new CustomEvent('FREE_TO_PLAY', {}));
    (void 0).rowMax.removeEventListener("click", (void 0).calcDownRowMax);
    (0, _utils.byId)('down-rowMin').addEventListener('click', (void 0).calcDownRowMin);
  },
  incrasePoints: function (arg) {
    (0, _utils.byId)('user-points').innerHTML = parseInt((0, _utils.byId)('user-points').innerHTML) + parseInt(arg);
  },
  calcDownRowMin: () => {
    if (dices.validatePass() == false) return;
    (void 0).rowMin.classList.remove('canPlay');
    console.log('MIN ENABLED');
    var maxTestKey = Object.keys(dices.R).reduce(function (a, b) {
      return dices.R[a] > dices.R[b] ? a : b;
    });
    var test = 0;
    for (var key in dices.R) {
      if (key != maxTestKey) {
        test += parseFloat(dices.R[key]);
      } else {
        console.log('not calc dice ', dices.R[key]);
      }
    }
    (void 0).rowMin.innerHTML = test;
    (0, _utils.byId)('down-rowMin').removeEventListener('click', (void 0).calcDownRowMin);
    // calc max min dont forget rules for bonus +30
    var SUMMINMAX = parseFloat((void 0).rowMax.innerHTML) - parseFloat((void 0).rowMin.innerHTML);
    (0, _utils.byId)('down-rowMaxMinSum').innerHTML = SUMMINMAX;
    myDom.incrasePoints(SUMMINMAX);
    dices.STATUS = "FREE_TO_PLAY";
    dispatchEvent(new CustomEvent('FREE_TO_PLAY', {}));
    (0, _utils.byId)('down-largeStraight').classList.add('canPlay');
    (0, _utils.byId)('down-largeStraight').addEventListener('click', (void 0).attachKenta);
  },
  checkForDuplicate: function () {
    var testArray = [];
    for (var key in dices.R) {
      var gen = {
        myId: key,
        value: dices.R[key]
      };
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
  checkForAllDuplicate: function () {
    var testArray = [];
    for (var key in dices.R) {
      var gen = {
        myId: key,
        value: dices.R[key]
      };
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
      if (typeof discret['value__' + item.value] === 'undefined') {
        discret['value__' + item.value] = 1;
      } else {
        discret['value__' + item.value] += 1;
      }
    });
    return discret;
  },
  attachKenta: function () {
    console.log('Test kenta  ', dices.R);
    (0, _utils.byId)('down-largeStraight').classList.remove('canPlay');
    var result = app.myDom.checkForDuplicate()[0];
    var testArray = app.myDom.checkForDuplicate()[1];
    // console.log('TEST duplik: ' + result);
    if (result.length == 2) {
      console.log('TEST duplik less 3 : ' + result);
      var locPrevent = false;
      testArray.forEach((item, index, array) => {
        if (result[0].value == item.value && locPrevent == false) {
          console.log('detect by value item.value', item.value);
          locPrevent = true;
          array.splice(index, 1);
        }
      });
      // if we catch  1 and 6 in same stack then it is not possible for kenta...
      var test1 = false,
        test6 = false;
      testArray.forEach((item, index, array) => {
        if (item.value == 1) {
          test1 = true;
        } else if (item.value == 6) {
          test6 = true;
        }
      });
      if (test1 == true && test6 == true) {
        (0, _utils.byId)('down-largeStraight').innerHTML = `0`;
      } else if (test1 == true) {
        (0, _utils.byId)('down-largeStraight').innerHTML = 15 + 50;
        myDom.incrasePoints(15 + 50);
      } else if (test6 == true) {
        (0, _utils.byId)('down-largeStraight').innerHTML = 20 + 50;
        myDom.incrasePoints(20 + 50);
      }
    } else if (result < 2) {
      (0, _utils.byId)('down-largeStraight').innerHTML = 66;
      myDom.incrasePoints(66);
    } else {
      // zero value
      (0, _utils.byId)('down-largeStraight').innerHTML = `0`;
    }
    (0, _utils.byId)('down-threeOfAKind').addEventListener('click', this.attachDownTrilling);
    (0, _utils.byId)('down-largeStraight').removeEventListener('click', this.attachKenta);
    dices.STATUS = "FREE_TO_PLAY";
    dispatchEvent(new CustomEvent('FREE_TO_PLAY', {}));
  },
  attachDownTrilling: function () {
    var result = app.myDom.checkForDuplicate()[0];
    // var testArray = app.myDom.checkForDuplicate()[1];
    // console.log('DUPLICATE FOR TRILING ', result);
    if (result.length > 2) {
      var testWin = 0;
      var TEST = app.myDom.checkForAllDuplicate();
      console.log('DUPLICATE FOR TRILING TEST ', TEST);
      for (var key in TEST) {
        if (TEST[key] > 2) {
          // win
          var getDiceID = parseInt(key.replace('value__', ''));
          testWin = getDiceID * 3;
        }
      }
      console.log('DUPLICATE FOR TRILING 30 + TEST ', testWin);
      (0, _utils.byId)('down-threeOfAKind').innerHTML = 20 + testWin;
      myDom.incrasePoints(20 + testWin);
    } else {
      (0, _utils.byId)('down-threeOfAKind').innerHTML = 0;
    }
    (0, _utils.byId)('down-threeOfAKind').removeEventListener('click', this.attachDownTrilling);
    (0, _utils.byId)('down-fullHouse').addEventListener('click', this.attachDownFullHouse);
    dices.STATUS = "FREE_TO_PLAY";
    dispatchEvent(new CustomEvent('FREE_TO_PLAY', {}));
  },
  attachDownFullHouse: function () {
    var TEST = app.myDom.checkForAllDuplicate();
    // console.log('DUPLICATE FOR FULL HOUSE 30 + TEST ');
    var win = 0;
    var testPair = false;
    var testTrilling = false;
    var testWinPair = 0;
    var testWinTrilling = 0;
    for (var key in TEST) {
      if (TEST[key] == 2) {
        // win
        var getDiceID = parseInt(key.replace('value__', ''));
        testWinPair = getDiceID * 2;
        testPair = true;
      } else if (TEST[key] == 3) {
        var getDiceID = parseInt(key.replace('value__', ''));
        testWinTrilling = getDiceID * 3;
        testTrilling = true;
      }
    }
    if (testPair == true && testTrilling == true) {
      win = testWinPair + testWinTrilling;
      (0, _utils.byId)('down-fullHouse').innerHTML = win + 30;
      myDom.incrasePoints(win + 30);
    } else {
      (0, _utils.byId)('down-fullHouse').innerHTML = 0;
    }
    (0, _utils.byId)('down-poker').addEventListener('click', this.attachDownPoker);
    (0, _utils.byId)('down-fullHouse').removeEventListener('click', this.attachDownFullHouse);
    dices.STATUS = "FREE_TO_PLAY";
    dispatchEvent(new CustomEvent('FREE_TO_PLAY', {}));
  },
  attachDownPoker: function () {
    var TEST = app.myDom.checkForAllDuplicate();
    // console.log('DUPLICATE FOR poker 40 + TEST ');
    for (var key in TEST) {
      if (TEST[key] == 4 || TEST[key] > 4) {
        // win
        var getDiceID = parseInt(key.replace('value__', ''));
        var win = getDiceID * 4;
        (0, _utils.byId)('down-poker').innerHTML = win + 40;
        myDom.incrasePoints(win + 40);
      }
    }
    (0, _utils.byId)('down-poker').removeEventListener('click', this.attachDownPoker);
    (0, _utils.byId)('down-jamb').addEventListener('click', this.attachDownJamb);
    dices.STATUS = "FREE_TO_PLAY";
    dispatchEvent(new CustomEvent('FREE_TO_PLAY', {}));
  },
  attachDownJamb: function () {
    (0, _utils.byId)('down-jamb').removeEventListener('click', this.attachDownJamb);
    console.log('<GAMEPLAY><DOWN ROW IS FEELED>');
    var TEST = app.myDom.checkForAllDuplicate();
    for (var key in TEST) {
      if (TEST[key] == 5 || TEST[key] > 5) {
        // win
        var getDiceID = parseInt(key.replace('value__', ''));
        var win = getDiceID * 5;
        (0, _utils.byId)('down-poker').innerHTML = win + 50;
        myDom.incrasePoints(win + 50);
      }
    }
    dices.STATUS = "FREE_TO_PLAY";
    dispatchEvent(new CustomEvent('FREE_TO_PLAY', {}));
  }
};

},{"../../../src/engine/utils.js":15,"./html-content.js":2}],4:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.loadObjFile = void 0;
var _world = _interopRequireDefault(require("../src/world.js"));
var _loaderObj = require("../src/engine/loader-obj.js");
var _utils = require("../src/engine/utils.js");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
// import MatrixEngineWGPU from "./src/world.js";
// import {downloadMeshes} from './src/engine/loader-obj.js';

var loadObjFile = function () {
  let loadObjFile = new _world.default({
    useSingleRenderPass: true,
    canvasSize: 'fullscreen',
    mainCameraParams: {
      type: 'WASD',
      responseCoef: 1000
    }
  }, () => {
    addEventListener('AmmoReady', () => {
      (0, _loaderObj.downloadMeshes)({
        welcomeText: "./res/meshes/blender/piramyd.obj",
        armor: "./res/meshes/obj/armor.obj",
        sphere: "./res/meshes/blender/sphere.obj",
        cube: "./res/meshes/blender/cube.obj"
      }, onLoadObj);
    });
    function onLoadObj(m) {
      loadObjFile.myLoadedMeshes = m;
      for (var key in m) {
        console.log(`%c Loaded objs: ${key} `, _utils.LOG_MATRIX);
      }
      loadObjFile.addMeshObj({
        position: {
          x: 0,
          y: 2,
          z: -10
        },
        rotation: {
          x: 0,
          y: 0,
          z: 0
        },
        rotationSpeed: {
          x: 0,
          y: 0,
          z: 0
        },
        texturesPaths: ['./res/meshes/blender/cube.png'],
        name: 'CubePhysics',
        mesh: m.cube,
        physics: {
          enabled: true,
          geometry: "Cube"
        }
      });
      loadObjFile.addMeshObj({
        position: {
          x: 0,
          y: 2,
          z: -10
        },
        rotation: {
          x: 0,
          y: 0,
          z: 0
        },
        rotationSpeed: {
          x: 0,
          y: 0,
          z: 0
        },
        texturesPaths: ['./res/meshes/blender/cube.png'],
        name: 'SpherePhysics',
        mesh: m.sphere,
        physics: {
          enabled: true,
          geometry: "Sphere"
        }
      });
      loadObjFile.addMeshObj({
        position: {
          x: 0,
          y: 2,
          z: -10
        },
        rotation: {
          x: 0,
          y: 0,
          z: 0
        },
        rotationSpeed: {
          x: 0,
          y: 0,
          z: 0
        },
        texturesPaths: ['./res/meshes/blender/cube.png'],
        name: 'CubePhysics',
        mesh: m.welcomeText,
        physics: {
          enabled: true,
          geometry: "Cube"
        }
      });
    }
  });
  window.app = loadObjFile;
};
exports.loadObjFile = loadObjFile;

},{"../src/engine/loader-obj.js":10,"../src/engine/utils.js":15,"../src/world.js":23}],5:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.unlitTextures = void 0;
var _world = _interopRequireDefault(require("../src/world.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
var unlitTextures = function () {
  let unlitTextures = new _world.default({
    useSingleRenderPass: false,
    canvasSize: 'fullscreen'
  }, () => {
    let c = {
      scale: 2,
      position: {
        x: -3,
        y: 0,
        z: -10
      },
      rotation: {
        x: 0,
        y: 0,
        z: 0
      },
      rotationSpeed: {
        x: 10,
        y: 0,
        z: 0
      },
      texturesPaths: ['./res/textures/rust.jpg']
    };
    let o = {
      scale: 2,
      position: {
        x: 3,
        y: 0,
        z: -10
      },
      rotation: {
        x: 0,
        y: 0,
        z: 0
      },
      rotationSpeed: {
        x: 10,
        y: 0,
        z: 0
      },
      texturesPaths: ['./res/textures/default.png']
    };
    unlitTextures.addBall(c);
    unlitTextures.addCube(o);
  });
  window.app = unlitTextures;
};
exports.unlitTextures = unlitTextures;

},{"../src/world.js":23}],6:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.quat = exports.mat4 = exports.mat3 = void 0;
exports.setDefaultType = setDefaultType;
exports.vec4 = exports.vec3 = exports.vec2 = exports.utils = void 0;
/* wgpu-matrix@2.5.1, license MIT */
/*
 * Copyright 2022 Gregg Tavares
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.  IN NO EVENT SHALL
 * THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 */
let EPSILON = 0.000001;
/**
 * Set the value for EPSILON for various checks
 * @param v - Value to use for EPSILON.
 * @returns previous value of EPSILON;
 */
function setEpsilon(v) {
  const old = EPSILON;
  EPSILON = v;
  return old;
}
/**
 * Convert degrees to radians
 * @param degrees - Angle in degrees
 * @returns angle converted to radians
 */
function degToRad(degrees) {
  return degrees * Math.PI / 180;
}
/**
 * Convert radians to degrees
 * @param radians - Angle in radians
 * @returns angle converted to degrees
 */
function radToDeg(radians) {
  return radians * 180 / Math.PI;
}
/**
 * Lerps between a and b via t
 * @param a - starting value
 * @param b - ending value
 * @param t - value where 0 = a and 1 = b
 * @returns a + (b - a) * t
 */
function lerp$4(a, b, t) {
  return a + (b - a) * t;
}
/**
 * Compute the opposite of lerp. Given a and b and a value between
 * a and b returns a value between 0 and 1. 0 if a, 1 if b.
 * Note: no clamping is done.
 * @param a - start value
 * @param b - end value
 * @param v - value between a and b
 * @returns (v - a) / (b - a)
 */
function inverseLerp(a, b, v) {
  const d = b - a;
  return Math.abs(b - a) < EPSILON ? a : (v - a) / d;
}
/**
 * Compute the euclidean modulo
 *
 * ```
 * // table for n / 3
 * -5, -4, -3, -2, -1,  0,  1,  2,  3,  4,  5   <- n
 * ------------------------------------
 * -2  -1  -0  -2  -1   0,  1,  2,  0,  1,  2   <- n % 3
 *  1   2   0   1   2   0,  1,  2,  0,  1,  2   <- euclideanModule(n, 3)
 * ```
 *
 * @param n - dividend
 * @param m - divisor
 * @returns the euclidean modulo of n / m
 */
function euclideanModulo(n, m) {
  return (n % m + m) % m;
}
var utils = exports.utils = /*#__PURE__*/Object.freeze({
  __proto__: null,
  get EPSILON() {
    return EPSILON;
  },
  setEpsilon: setEpsilon,
  degToRad: degToRad,
  radToDeg: radToDeg,
  lerp: lerp$4,
  inverseLerp: inverseLerp,
  euclideanModulo: euclideanModulo
});

/*
 * Copyright 2022 Gregg Tavares
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.  IN NO EVENT SHALL
 * THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 */
/**
 *
 * Vec2 math functions.
 *
 * Almost all functions take an optional `dst` argument. If it is not passed in the
 * functions will create a new Vec2. In other words you can do this
 *
 *     const v = vec2.cross(v1, v2);  // Creates a new Vec2 with the cross product of v1 x v2.
 *
 * or
 *
 *     const v = vec2.create();
 *     vec2.cross(v1, v2, v);  // Puts the cross product of v1 x v2 in v
 *
 * The first style is often easier but depending on where it's used it generates garbage where
 * as there is almost never allocation with the second style.
 *
 * It is always safe to pass any vector as the destination. So for example
 *
 *     vec2.cross(v1, v2, v1);  // Puts the cross product of v1 x v2 in v1
 *
 */
let VecType$2 = Float32Array;
/**
 * Sets the type this library creates for a Vec2
 * @param ctor - the constructor for the type. Either `Float32Array`, `Float64Array`, or `Array`
 * @returns previous constructor for Vec2
 */
function setDefaultType$6(ctor) {
  const oldType = VecType$2;
  VecType$2 = ctor;
  return oldType;
}
/**
 * Creates a Vec2; may be called with x, y, z to set initial values.
 *
 * Note: Since passing in a raw JavaScript array
 * is valid in all circumstances, if you want to
 * force a JavaScript array into a Vec2's specified type
 * it would be faster to use
 *
 * ```
 * const v = vec2.clone(someJSArray);
 * ```
 *
 * Note: a consequence of the implementation is if your Vec2Type = `Array`
 * instead of `Float32Array` or `Float64Array` then any values you
 * don't pass in will be undefined. Usually this is not an issue since
 * (a) using `Array` is rare and (b) using `vec2.create` is usually used
 * to create a Vec2 to be filled out as in
 *
 * ```
 * const sum = vec2.create();
 * vec2.add(v1, v2, sum);
 * ```
 *
 * @param x - Initial x value.
 * @param y - Initial y value.
 * @returns the created vector
 */
function create$5(x = 0, y = 0) {
  const dst = new VecType$2(2);
  if (x !== undefined) {
    dst[0] = x;
    if (y !== undefined) {
      dst[1] = y;
    }
  }
  return dst;
}

/*
 * Copyright 2022 Gregg Tavares
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.  IN NO EVENT SHALL
 * THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 */
/**
 *
 * Vec3 math functions.
 *
 * Almost all functions take an optional `dst` argument. If it is not passed in the
 * functions will create a new `Vec3`. In other words you can do this
 *
 *     const v = vec3.cross(v1, v2);  // Creates a new Vec3 with the cross product of v1 x v2.
 *
 * or
 *
 *     const v = vec3.create();
 *     vec3.cross(v1, v2, v);  // Puts the cross product of v1 x v2 in v
 *
 * The first style is often easier but depending on where it's used it generates garbage where
 * as there is almost never allocation with the second style.
 *
 * It is always safe to pass any vector as the destination. So for example
 *
 *     vec3.cross(v1, v2, v1);  // Puts the cross product of v1 x v2 in v1
 *
 */
let VecType$1 = Float32Array;
/**
 * Sets the type this library creates for a Vec3
 * @param ctor - the constructor for the type. Either `Float32Array`, `Float64Array`, or `Array`
 * @returns previous constructor for Vec3
 */
function setDefaultType$5(ctor) {
  const oldType = VecType$1;
  VecType$1 = ctor;
  return oldType;
}
/**
 * Creates a vec3; may be called with x, y, z to set initial values.
 * @param x - Initial x value.
 * @param y - Initial y value.
 * @param z - Initial z value.
 * @returns the created vector
 */
function create$4(x, y, z) {
  const dst = new VecType$1(3);
  if (x !== undefined) {
    dst[0] = x;
    if (y !== undefined) {
      dst[1] = y;
      if (z !== undefined) {
        dst[2] = z;
      }
    }
  }
  return dst;
}

/*
 * Copyright 2022 Gregg Tavares
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.  IN NO EVENT SHALL
 * THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 */
/**
 * Creates a Vec2; may be called with x, y, z to set initial values. (same as create)
 * @param x - Initial x value.
 * @param y - Initial y value.
 * @returns the created vector
 */
const fromValues$3 = create$5;
/**
 * Sets the values of a Vec2
 * Also see {@link vec2.create} and {@link vec2.copy}
 *
 * @param x first value
 * @param y second value
 * @param dst - vector to hold result. If not passed in a new one is created.
 * @returns A vector with its elements set.
 */
function set$5(x, y, dst) {
  dst = dst || new VecType$2(2);
  dst[0] = x;
  dst[1] = y;
  return dst;
}
/**
 * Applies Math.ceil to each element of vector
 * @param v - Operand vector.
 * @param dst - vector to hold result. If not passed in a new one is created.
 * @returns A vector that is the ceil of each element of v.
 */
function ceil$2(v, dst) {
  dst = dst || new VecType$2(2);
  dst[0] = Math.ceil(v[0]);
  dst[1] = Math.ceil(v[1]);
  return dst;
}
/**
 * Applies Math.floor to each element of vector
 * @param v - Operand vector.
 * @param dst - vector to hold result. If not passed in a new one is created.
 * @returns A vector that is the floor of each element of v.
 */
function floor$2(v, dst) {
  dst = dst || new VecType$2(2);
  dst[0] = Math.floor(v[0]);
  dst[1] = Math.floor(v[1]);
  return dst;
}
/**
 * Applies Math.round to each element of vector
 * @param v - Operand vector.
 * @param dst - vector to hold result. If not passed in a new one is created.
 * @returns A vector that is the round of each element of v.
 */
function round$2(v, dst) {
  dst = dst || new VecType$2(2);
  dst[0] = Math.round(v[0]);
  dst[1] = Math.round(v[1]);
  return dst;
}
/**
 * Clamp each element of vector between min and max
 * @param v - Operand vector.
 * @param max - Min value, default 0
 * @param min - Max value, default 1
 * @param dst - vector to hold result. If not passed in a new one is created.
 * @returns A vector that the clamped value of each element of v.
 */
function clamp$2(v, min = 0, max = 1, dst) {
  dst = dst || new VecType$2(2);
  dst[0] = Math.min(max, Math.max(min, v[0]));
  dst[1] = Math.min(max, Math.max(min, v[1]));
  return dst;
}
/**
 * Adds two vectors; assumes a and b have the same dimension.
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @param dst - vector to hold result. If not passed in a new one is created.
 * @returns A vector that is the sum of a and b.
 */
function add$3(a, b, dst) {
  dst = dst || new VecType$2(2);
  dst[0] = a[0] + b[0];
  dst[1] = a[1] + b[1];
  return dst;
}
/**
 * Adds two vectors, scaling the 2nd; assumes a and b have the same dimension.
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @param scale - Amount to scale b
 * @param dst - vector to hold result. If not passed in a new one is created.
 * @returns A vector that is the sum of a + b * scale.
 */
function addScaled$2(a, b, scale, dst) {
  dst = dst || new VecType$2(2);
  dst[0] = a[0] + b[0] * scale;
  dst[1] = a[1] + b[1] * scale;
  return dst;
}
/**
 * Returns the angle in radians between two vectors.
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @returns The angle in radians between the 2 vectors.
 */
function angle$2(a, b) {
  const ax = a[0];
  const ay = a[1];
  const bx = a[0];
  const by = a[1];
  const mag1 = Math.sqrt(ax * ax + ay * ay);
  const mag2 = Math.sqrt(bx * bx + by * by);
  const mag = mag1 * mag2;
  const cosine = mag && dot$3(a, b) / mag;
  return Math.acos(cosine);
}
/**
 * Subtracts two vectors.
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @param dst - vector to hold result. If not passed in a new one is created.
 * @returns A vector that is the difference of a and b.
 */
function subtract$3(a, b, dst) {
  dst = dst || new VecType$2(2);
  dst[0] = a[0] - b[0];
  dst[1] = a[1] - b[1];
  return dst;
}
/**
 * Subtracts two vectors.
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @param dst - vector to hold result. If not passed in a new one is created.
 * @returns A vector that is the difference of a and b.
 */
const sub$3 = subtract$3;
/**
 * Check if 2 vectors are approximately equal
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @returns true if vectors are approximately equal
 */
function equalsApproximately$5(a, b) {
  return Math.abs(a[0] - b[0]) < EPSILON && Math.abs(a[1] - b[1]) < EPSILON;
}
/**
 * Check if 2 vectors are exactly equal
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @returns true if vectors are exactly equal
 */
function equals$5(a, b) {
  return a[0] === b[0] && a[1] === b[1];
}
/**
 * Performs linear interpolation on two vectors.
 * Given vectors a and b and interpolation coefficient t, returns
 * a + t * (b - a).
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @param t - Interpolation coefficient.
 * @param dst - vector to hold result. If not passed in a new one is created.
 * @returns The linear interpolated result.
 */
function lerp$3(a, b, t, dst) {
  dst = dst || new VecType$2(2);
  dst[0] = a[0] + t * (b[0] - a[0]);
  dst[1] = a[1] + t * (b[1] - a[1]);
  return dst;
}
/**
 * Performs linear interpolation on two vectors.
 * Given vectors a and b and interpolation coefficient vector t, returns
 * a + t * (b - a).
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @param t - Interpolation coefficients vector.
 * @param dst - vector to hold result. If not passed in a new one is created.
 * @returns the linear interpolated result.
 */
function lerpV$2(a, b, t, dst) {
  dst = dst || new VecType$2(2);
  dst[0] = a[0] + t[0] * (b[0] - a[0]);
  dst[1] = a[1] + t[1] * (b[1] - a[1]);
  return dst;
}
/**
 * Return max values of two vectors.
 * Given vectors a and b returns
 * [max(a[0], b[0]), max(a[1], b[1]), max(a[2], b[2])].
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @param dst - vector to hold result. If not passed in a new one is created.
 * @returns The max components vector.
 */
function max$2(a, b, dst) {
  dst = dst || new VecType$2(2);
  dst[0] = Math.max(a[0], b[0]);
  dst[1] = Math.max(a[1], b[1]);
  return dst;
}
/**
 * Return min values of two vectors.
 * Given vectors a and b returns
 * [min(a[0], b[0]), min(a[1], b[1]), min(a[2], b[2])].
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @param dst - vector to hold result. If not passed in a new one is created.
 * @returns The min components vector.
 */
function min$2(a, b, dst) {
  dst = dst || new VecType$2(2);
  dst[0] = Math.min(a[0], b[0]);
  dst[1] = Math.min(a[1], b[1]);
  return dst;
}
/**
 * Multiplies a vector by a scalar.
 * @param v - The vector.
 * @param k - The scalar.
 * @param dst - vector to hold result. If not passed in a new one is created.
 * @returns The scaled vector.
 */
function mulScalar$3(v, k, dst) {
  dst = dst || new VecType$2(2);
  dst[0] = v[0] * k;
  dst[1] = v[1] * k;
  return dst;
}
/**
 * Multiplies a vector by a scalar. (same as mulScalar)
 * @param v - The vector.
 * @param k - The scalar.
 * @param dst - vector to hold result. If not passed in a new one is created.
 * @returns The scaled vector.
 */
const scale$5 = mulScalar$3;
/**
 * Divides a vector by a scalar.
 * @param v - The vector.
 * @param k - The scalar.
 * @param dst - vector to hold result. If not passed in a new one is created.
 * @returns The scaled vector.
 */
function divScalar$3(v, k, dst) {
  dst = dst || new VecType$2(2);
  dst[0] = v[0] / k;
  dst[1] = v[1] / k;
  return dst;
}
/**
 * Inverse a vector.
 * @param v - The vector.
 * @param dst - vector to hold result. If not passed in a new one is created.
 * @returns The inverted vector.
 */
function inverse$5(v, dst) {
  dst = dst || new VecType$2(2);
  dst[0] = 1 / v[0];
  dst[1] = 1 / v[1];
  return dst;
}
/**
 * Invert a vector. (same as inverse)
 * @param v - The vector.
 * @param dst - vector to hold result. If not passed in a new one is created.
 * @returns The inverted vector.
 */
const invert$4 = inverse$5;
/**
 * Computes the cross product of two vectors; assumes both vectors have
 * three entries.
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @param dst - vector to hold result. If not passed in a new one is created.
 * @returns The vector of a cross b.
 */
function cross$1(a, b, dst) {
  dst = dst || new VecType$1(3);
  const z = a[0] * b[1] - a[1] * b[0];
  dst[0] = 0;
  dst[1] = 0;
  dst[2] = z;
  return dst;
}
/**
 * Computes the dot product of two vectors; assumes both vectors have
 * three entries.
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @returns dot product
 */
function dot$3(a, b) {
  return a[0] * b[0] + a[1] * b[1];
}
/**
 * Computes the length of vector
 * @param v - vector.
 * @returns length of vector.
 */
function length$3(v) {
  const v0 = v[0];
  const v1 = v[1];
  return Math.sqrt(v0 * v0 + v1 * v1);
}
/**
 * Computes the length of vector (same as length)
 * @param v - vector.
 * @returns length of vector.
 */
const len$3 = length$3;
/**
 * Computes the square of the length of vector
 * @param v - vector.
 * @returns square of the length of vector.
 */
function lengthSq$3(v) {
  const v0 = v[0];
  const v1 = v[1];
  return v0 * v0 + v1 * v1;
}
/**
 * Computes the square of the length of vector (same as lengthSq)
 * @param v - vector.
 * @returns square of the length of vector.
 */
const lenSq$3 = lengthSq$3;
/**
 * Computes the distance between 2 points
 * @param a - vector.
 * @param b - vector.
 * @returns distance between a and b
 */
function distance$2(a, b) {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  return Math.sqrt(dx * dx + dy * dy);
}
/**
 * Computes the distance between 2 points (same as distance)
 * @param a - vector.
 * @param b - vector.
 * @returns distance between a and b
 */
const dist$2 = distance$2;
/**
 * Computes the square of the distance between 2 points
 * @param a - vector.
 * @param b - vector.
 * @returns square of the distance between a and b
 */
function distanceSq$2(a, b) {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  return dx * dx + dy * dy;
}
/**
 * Computes the square of the distance between 2 points (same as distanceSq)
 * @param a - vector.
 * @param b - vector.
 * @returns square of the distance between a and b
 */
const distSq$2 = distanceSq$2;
/**
 * Divides a vector by its Euclidean length and returns the quotient.
 * @param v - The vector.
 * @param dst - vector to hold result. If not passed in a new one is created.
 * @returns The normalized vector.
 */
function normalize$3(v, dst) {
  dst = dst || new VecType$2(2);
  const v0 = v[0];
  const v1 = v[1];
  const len = Math.sqrt(v0 * v0 + v1 * v1);
  if (len > 0.00001) {
    dst[0] = v0 / len;
    dst[1] = v1 / len;
  } else {
    dst[0] = 0;
    dst[1] = 0;
  }
  return dst;
}
/**
 * Negates a vector.
 * @param v - The vector.
 * @param dst - vector to hold result. If not passed in a new one is created.
 * @returns -v.
 */
function negate$4(v, dst) {
  dst = dst || new VecType$2(2);
  dst[0] = -v[0];
  dst[1] = -v[1];
  return dst;
}
/**
 * Copies a vector. (same as {@link vec2.clone})
 * Also see {@link vec2.create} and {@link vec2.set}
 * @param v - The vector.
 * @param dst - vector to hold result. If not passed in a new one is created.
 * @returns A copy of v.
 */
function copy$5(v, dst) {
  dst = dst || new VecType$2(2);
  dst[0] = v[0];
  dst[1] = v[1];
  return dst;
}
/**
 * Clones a vector. (same as {@link vec2.copy})
 * Also see {@link vec2.create} and {@link vec2.set}
 * @param v - The vector.
 * @param dst - vector to hold result. If not passed in a new one is created.
 * @returns A copy of v.
 */
const clone$5 = copy$5;
/**
 * Multiplies a vector by another vector (component-wise); assumes a and
 * b have the same length.
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @param dst - vector to hold result. If not passed in a new one is created.
 * @returns The vector of products of entries of a and b.
 */
function multiply$5(a, b, dst) {
  dst = dst || new VecType$2(2);
  dst[0] = a[0] * b[0];
  dst[1] = a[1] * b[1];
  return dst;
}
/**
 * Multiplies a vector by another vector (component-wise); assumes a and
 * b have the same length. (same as mul)
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @param dst - vector to hold result. If not passed in a new one is created.
 * @returns The vector of products of entries of a and b.
 */
const mul$5 = multiply$5;
/**
 * Divides a vector by another vector (component-wise); assumes a and
 * b have the same length.
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @param dst - vector to hold result. If not passed in a new one is created.
 * @returns The vector of quotients of entries of a and b.
 */
function divide$2(a, b, dst) {
  dst = dst || new VecType$2(2);
  dst[0] = a[0] / b[0];
  dst[1] = a[1] / b[1];
  return dst;
}
/**
 * Divides a vector by another vector (component-wise); assumes a and
 * b have the same length. (same as divide)
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @param dst - vector to hold result. If not passed in a new one is created.
 * @returns The vector of quotients of entries of a and b.
 */
const div$2 = divide$2;
/**
 * Creates a random unit vector * scale
 * @param scale - Default 1
 * @param dst - vector to hold result. If not passed in a new one is created.
 * @returns The random vector.
 */
function random$1(scale = 1, dst) {
  dst = dst || new VecType$2(2);
  const angle = Math.random() * 2 * Math.PI;
  dst[0] = Math.cos(angle) * scale;
  dst[1] = Math.sin(angle) * scale;
  return dst;
}
/**
 * Zero's a vector
 * @param dst - vector to hold result. If not passed in a new one is created.
 * @returns The zeroed vector.
 */
function zero$2(dst) {
  dst = dst || new VecType$2(2);
  dst[0] = 0;
  dst[1] = 0;
  return dst;
}
/**
 * transform Vec2 by 4x4 matrix
 * @param v - the vector
 * @param m - The matrix.
 * @param dst - optional Vec2 to store result. If not passed a new one is created.
 * @returns the transformed vector
 */
function transformMat4$2(v, m, dst) {
  dst = dst || new VecType$2(2);
  const x = v[0];
  const y = v[1];
  dst[0] = x * m[0] + y * m[4] + m[12];
  dst[1] = x * m[1] + y * m[5] + m[13];
  return dst;
}
/**
 * Transforms vec4 by 3x3 matrix
 *
 * @param v - the vector
 * @param m - The matrix.
 * @param dst - optional Vec2 to store result. If not passed a new one is created.
 * @returns the transformed vector
 */
function transformMat3$1(v, m, dst) {
  dst = dst || new VecType$2(2);
  const x = v[0];
  const y = v[1];
  dst[0] = m[0] * x + m[4] * y + m[8];
  dst[1] = m[1] * x + m[5] * y + m[9];
  return dst;
}
var vec2Impl = exports.vec2 = /*#__PURE__*/Object.freeze({
  __proto__: null,
  create: create$5,
  setDefaultType: setDefaultType$6,
  fromValues: fromValues$3,
  set: set$5,
  ceil: ceil$2,
  floor: floor$2,
  round: round$2,
  clamp: clamp$2,
  add: add$3,
  addScaled: addScaled$2,
  angle: angle$2,
  subtract: subtract$3,
  sub: sub$3,
  equalsApproximately: equalsApproximately$5,
  equals: equals$5,
  lerp: lerp$3,
  lerpV: lerpV$2,
  max: max$2,
  min: min$2,
  mulScalar: mulScalar$3,
  scale: scale$5,
  divScalar: divScalar$3,
  inverse: inverse$5,
  invert: invert$4,
  cross: cross$1,
  dot: dot$3,
  length: length$3,
  len: len$3,
  lengthSq: lengthSq$3,
  lenSq: lenSq$3,
  distance: distance$2,
  dist: dist$2,
  distanceSq: distanceSq$2,
  distSq: distSq$2,
  normalize: normalize$3,
  negate: negate$4,
  copy: copy$5,
  clone: clone$5,
  multiply: multiply$5,
  mul: mul$5,
  divide: divide$2,
  div: div$2,
  random: random$1,
  zero: zero$2,
  transformMat4: transformMat4$2,
  transformMat3: transformMat3$1
});

/*
 * Copyright 2022 Gregg Tavares
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.  IN NO EVENT SHALL
 * THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 */
/**
 * 3x3 Matrix math math functions.
 *
 * Almost all functions take an optional `dst` argument. If it is not passed in the
 * functions will create a new matrix. In other words you can do this
 *
 *     const mat = mat3.translation([1, 2, 3]);  // Creates a new translation matrix
 *
 * or
 *
 *     const mat = mat3.create();
 *     mat3.translation([1, 2, 3], mat);  // Puts translation matrix in mat.
 *
 * The first style is often easier but depending on where it's used it generates garbage where
 * as there is almost never allocation with the second style.
 *
 * It is always save to pass any matrix as the destination. So for example
 *
 *     const mat = mat3.identity();
 *     const trans = mat3.translation([1, 2, 3]);
 *     mat3.multiply(mat, trans, mat);  // Multiplies mat * trans and puts result in mat.
 *
 */
let MatType$1 = Float32Array;
// This mess is because with Mat3 we have 3 unused elements.
// For Float32Array and Float64Array that's not an issue
// but for Array it's troublesome
const ctorMap = new Map([[Float32Array, () => new Float32Array(12)], [Float64Array, () => new Float64Array(12)], [Array, () => new Array(12).fill(0)]]);
let newMat3 = ctorMap.get(Float32Array);
/**
 * Sets the type this library creates for a Mat3
 * @param ctor - the constructor for the type. Either `Float32Array`, `Float64Array`, or `Array`
 * @returns previous constructor for Mat3
 */
function setDefaultType$4(ctor) {
  const oldType = MatType$1;
  MatType$1 = ctor;
  newMat3 = ctorMap.get(ctor);
  return oldType;
}
/**
 * Create a Mat3 from values
 *
 * Note: Since passing in a raw JavaScript array
 * is valid in all circumstances, if you want to
 * force a JavaScript array into a Mat3's specified type
 * it would be faster to use
 *
 * ```
 * const m = mat3.clone(someJSArray);
 * ```
 *
 * Note: a consequence of the implementation is if your Mat3Type = `Array`
 * instead of `Float32Array` or `Float64Array` then any values you
 * don't pass in will be undefined. Usually this is not an issue since
 * (a) using `Array` is rare and (b) using `mat3.create` is usually used
 * to create a Mat3 to be filled out as in
 *
 * ```
 * const m = mat3.create();
 * mat3.perspective(fov, aspect, near, far, m);
 * ```
 *
 * @param v0 - value for element 0
 * @param v1 - value for element 1
 * @param v2 - value for element 2
 * @param v3 - value for element 3
 * @param v4 - value for element 4
 * @param v5 - value for element 5
 * @param v6 - value for element 6
 * @param v7 - value for element 7
 * @param v8 - value for element 8
 * @returns matrix created from values.
 */
function create$3(v0, v1, v2, v3, v4, v5, v6, v7, v8) {
  const dst = newMat3();
  // to make the array homogenous
  dst[3] = 0;
  dst[7] = 0;
  dst[11] = 0;
  if (v0 !== undefined) {
    dst[0] = v0;
    if (v1 !== undefined) {
      dst[1] = v1;
      if (v2 !== undefined) {
        dst[2] = v2;
        if (v3 !== undefined) {
          dst[4] = v3;
          if (v4 !== undefined) {
            dst[5] = v4;
            if (v5 !== undefined) {
              dst[6] = v5;
              if (v6 !== undefined) {
                dst[8] = v6;
                if (v7 !== undefined) {
                  dst[9] = v7;
                  if (v8 !== undefined) {
                    dst[10] = v8;
                  }
                }
              }
            }
          }
        }
      }
    }
  }
  return dst;
}
/**
 * Sets the values of a Mat3
 * Also see {@link mat3.create} and {@link mat3.copy}
 *
 * @param v0 - value for element 0
 * @param v1 - value for element 1
 * @param v2 - value for element 2
 * @param v3 - value for element 3
 * @param v4 - value for element 4
 * @param v5 - value for element 5
 * @param v6 - value for element 6
 * @param v7 - value for element 7
 * @param v8 - value for element 8
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns Mat3 set from values.
 */
function set$4(v0, v1, v2, v3, v4, v5, v6, v7, v8, dst) {
  dst = dst || newMat3();
  dst[0] = v0;
  dst[1] = v1;
  dst[2] = v2;
  dst[3] = 0;
  dst[4] = v3;
  dst[5] = v4;
  dst[6] = v5;
  dst[7] = 0;
  dst[8] = v6;
  dst[9] = v7;
  dst[10] = v8;
  dst[11] = 0;
  return dst;
}
/**
 * Creates a Mat3 from the upper left 3x3 part of a Mat4
 * @param m4 - source matrix
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns Mat3 made from m4
 */
function fromMat4(m4, dst) {
  dst = dst || newMat3();
  dst[0] = m4[0];
  dst[1] = m4[1];
  dst[2] = m4[2];
  dst[3] = 0;
  dst[4] = m4[4];
  dst[5] = m4[5];
  dst[6] = m4[6];
  dst[7] = 0;
  dst[8] = m4[8];
  dst[9] = m4[9];
  dst[10] = m4[10];
  dst[11] = 0;
  return dst;
}
/**
 * Creates a Mat3 rotation matrix from a quaternion
 * @param q - quaternion to create matrix from
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns Mat3 made from q
 */
function fromQuat$1(q, dst) {
  dst = dst || newMat3();
  const x = q[0];
  const y = q[1];
  const z = q[2];
  const w = q[3];
  const x2 = x + x;
  const y2 = y + y;
  const z2 = z + z;
  const xx = x * x2;
  const yx = y * x2;
  const yy = y * y2;
  const zx = z * x2;
  const zy = z * y2;
  const zz = z * z2;
  const wx = w * x2;
  const wy = w * y2;
  const wz = w * z2;
  dst[0] = 1 - yy - zz;
  dst[1] = yx + wz;
  dst[2] = zx - wy;
  dst[3] = 0;
  dst[4] = yx - wz;
  dst[5] = 1 - xx - zz;
  dst[6] = zy + wx;
  dst[7] = 0;
  dst[8] = zx + wy;
  dst[9] = zy - wx;
  dst[10] = 1 - xx - yy;
  dst[11] = 0;
  return dst;
}
/**
 * Negates a matrix.
 * @param m - The matrix.
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns -m.
 */
function negate$3(m, dst) {
  dst = dst || newMat3();
  dst[0] = -m[0];
  dst[1] = -m[1];
  dst[2] = -m[2];
  dst[4] = -m[4];
  dst[5] = -m[5];
  dst[6] = -m[6];
  dst[8] = -m[8];
  dst[9] = -m[9];
  dst[10] = -m[10];
  return dst;
}
/**
 * Copies a matrix. (same as {@link mat3.clone})
 * Also see {@link mat3.create} and {@link mat3.set}
 * @param m - The matrix.
 * @param dst - The matrix. If not passed a new one is created.
 * @returns A copy of m.
 */
function copy$4(m, dst) {
  dst = dst || newMat3();
  dst[0] = m[0];
  dst[1] = m[1];
  dst[2] = m[2];
  dst[4] = m[4];
  dst[5] = m[5];
  dst[6] = m[6];
  dst[8] = m[8];
  dst[9] = m[9];
  dst[10] = m[10];
  return dst;
}
/**
 * Copies a matrix (same as {@link mat3.copy})
 * Also see {@link mat3.create} and {@link mat3.set}
 * @param m - The matrix.
 * @param dst - The matrix. If not passed a new one is created.
 * @returns A copy of m.
 */
const clone$4 = copy$4;
/**
 * Check if 2 matrices are approximately equal
 * @param a Operand matrix.
 * @param b Operand matrix.
 * @returns true if matrices are approximately equal
 */
function equalsApproximately$4(a, b) {
  return Math.abs(a[0] - b[0]) < EPSILON && Math.abs(a[1] - b[1]) < EPSILON && Math.abs(a[2] - b[2]) < EPSILON && Math.abs(a[4] - b[4]) < EPSILON && Math.abs(a[5] - b[5]) < EPSILON && Math.abs(a[6] - b[6]) < EPSILON && Math.abs(a[8] - b[8]) < EPSILON && Math.abs(a[9] - b[9]) < EPSILON && Math.abs(a[10] - b[10]) < EPSILON;
}
/**
 * Check if 2 matrices are exactly equal
 * @param a Operand matrix.
 * @param b Operand matrix.
 * @returns true if matrices are exactly equal
 */
function equals$4(a, b) {
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[4] === b[4] && a[5] === b[5] && a[6] === b[6] && a[8] === b[8] && a[9] === b[9] && a[10] === b[10];
}
/**
 * Creates a 3-by-3 identity matrix.
 *
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns A 3-by-3 identity matrix.
 */
function identity$2(dst) {
  dst = dst || newMat3();
  dst[0] = 1;
  dst[1] = 0;
  dst[2] = 0;
  dst[4] = 0;
  dst[5] = 1;
  dst[6] = 0;
  dst[8] = 0;
  dst[9] = 0;
  dst[10] = 1;
  return dst;
}
/**
 * Takes the transpose of a matrix.
 * @param m - The matrix.
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns The transpose of m.
 */
function transpose$1(m, dst) {
  dst = dst || newMat3();
  if (dst === m) {
    let t;
    // 0 1 2
    // 4 5 6
    // 8 9 10
    t = m[1];
    m[1] = m[4];
    m[4] = t;
    t = m[2];
    m[2] = m[8];
    m[8] = t;
    t = m[6];
    m[6] = m[9];
    m[9] = t;
    return dst;
  }
  const m00 = m[0 * 4 + 0];
  const m01 = m[0 * 4 + 1];
  const m02 = m[0 * 4 + 2];
  const m10 = m[1 * 4 + 0];
  const m11 = m[1 * 4 + 1];
  const m12 = m[1 * 4 + 2];
  const m20 = m[2 * 4 + 0];
  const m21 = m[2 * 4 + 1];
  const m22 = m[2 * 4 + 2];
  dst[0] = m00;
  dst[1] = m10;
  dst[2] = m20;
  dst[4] = m01;
  dst[5] = m11;
  dst[6] = m21;
  dst[8] = m02;
  dst[9] = m12;
  dst[10] = m22;
  return dst;
}
/**
 * Computes the inverse of a 3-by-3 matrix.
 * @param m - The matrix.
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns The inverse of m.
 */
function inverse$4(m, dst) {
  dst = dst || newMat3();
  const m00 = m[0 * 4 + 0];
  const m01 = m[0 * 4 + 1];
  const m02 = m[0 * 4 + 2];
  const m10 = m[1 * 4 + 0];
  const m11 = m[1 * 4 + 1];
  const m12 = m[1 * 4 + 2];
  const m20 = m[2 * 4 + 0];
  const m21 = m[2 * 4 + 1];
  const m22 = m[2 * 4 + 2];
  const b01 = m22 * m11 - m12 * m21;
  const b11 = -m22 * m10 + m12 * m20;
  const b21 = m21 * m10 - m11 * m20;
  const invDet = 1 / (m00 * b01 + m01 * b11 + m02 * b21);
  dst[0] = b01 * invDet;
  dst[1] = (-m22 * m01 + m02 * m21) * invDet;
  dst[2] = (m12 * m01 - m02 * m11) * invDet;
  dst[4] = b11 * invDet;
  dst[5] = (m22 * m00 - m02 * m20) * invDet;
  dst[6] = (-m12 * m00 + m02 * m10) * invDet;
  dst[8] = b21 * invDet;
  dst[9] = (-m21 * m00 + m01 * m20) * invDet;
  dst[10] = (m11 * m00 - m01 * m10) * invDet;
  return dst;
}
/**
 * Compute the determinant of a matrix
 * @param m - the matrix
 * @returns the determinant
 */
function determinant$1(m) {
  const m00 = m[0 * 4 + 0];
  const m01 = m[0 * 4 + 1];
  const m02 = m[0 * 4 + 2];
  const m10 = m[1 * 4 + 0];
  const m11 = m[1 * 4 + 1];
  const m12 = m[1 * 4 + 2];
  const m20 = m[2 * 4 + 0];
  const m21 = m[2 * 4 + 1];
  const m22 = m[2 * 4 + 2];
  return m00 * (m11 * m22 - m21 * m12) - m10 * (m01 * m22 - m21 * m02) + m20 * (m01 * m12 - m11 * m02);
}
/**
 * Computes the inverse of a 3-by-3 matrix. (same as inverse)
 * @param m - The matrix.
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns The inverse of m.
 */
const invert$3 = inverse$4;
/**
 * Multiplies two 3-by-3 matrices with a on the left and b on the right
 * @param a - The matrix on the left.
 * @param b - The matrix on the right.
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns The matrix product of a and b.
 */
function multiply$4(a, b, dst) {
  dst = dst || newMat3();
  const a00 = a[0];
  const a01 = a[1];
  const a02 = a[2];
  const a10 = a[4 + 0];
  const a11 = a[4 + 1];
  const a12 = a[4 + 2];
  const a20 = a[8 + 0];
  const a21 = a[8 + 1];
  const a22 = a[8 + 2];
  const b00 = b[0];
  const b01 = b[1];
  const b02 = b[2];
  const b10 = b[4 + 0];
  const b11 = b[4 + 1];
  const b12 = b[4 + 2];
  const b20 = b[8 + 0];
  const b21 = b[8 + 1];
  const b22 = b[8 + 2];
  dst[0] = a00 * b00 + a10 * b01 + a20 * b02;
  dst[1] = a01 * b00 + a11 * b01 + a21 * b02;
  dst[2] = a02 * b00 + a12 * b01 + a22 * b02;
  dst[4] = a00 * b10 + a10 * b11 + a20 * b12;
  dst[5] = a01 * b10 + a11 * b11 + a21 * b12;
  dst[6] = a02 * b10 + a12 * b11 + a22 * b12;
  dst[8] = a00 * b20 + a10 * b21 + a20 * b22;
  dst[9] = a01 * b20 + a11 * b21 + a21 * b22;
  dst[10] = a02 * b20 + a12 * b21 + a22 * b22;
  return dst;
}
/**
 * Multiplies two 3-by-3 matrices with a on the left and b on the right (same as multiply)
 * @param a - The matrix on the left.
 * @param b - The matrix on the right.
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns The matrix product of a and b.
 */
const mul$4 = multiply$4;
/**
 * Sets the translation component of a 3-by-3 matrix to the given
 * vector.
 * @param a - The matrix.
 * @param v - The vector.
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns The matrix with translation set.
 */
function setTranslation$1(a, v, dst) {
  dst = dst || identity$2();
  if (a !== dst) {
    dst[0] = a[0];
    dst[1] = a[1];
    dst[2] = a[2];
    dst[4] = a[4];
    dst[5] = a[5];
    dst[6] = a[6];
  }
  dst[8] = v[0];
  dst[9] = v[1];
  dst[10] = 1;
  return dst;
}
/**
 * Returns the translation component of a 3-by-3 matrix as a vector with 3
 * entries.
 * @param m - The matrix.
 * @param dst - vector to hold result. If not passed a new one is created.
 * @returns The translation component of m.
 */
function getTranslation$2(m, dst) {
  dst = dst || create$5();
  dst[0] = m[8];
  dst[1] = m[9];
  return dst;
}
/**
 * Returns an axis of a 3x3 matrix as a vector with 2 entries
 * @param m - The matrix.
 * @param axis - The axis 0 = x, 1 = y,
 * @returns The axis component of m.
 */
function getAxis$2(m, axis, dst) {
  dst = dst || create$5();
  const off = axis * 4;
  dst[0] = m[off + 0];
  dst[1] = m[off + 1];
  return dst;
}
/**
 * Sets an axis of a 3x3 matrix as a vector with 2 entries
 * @param m - The matrix.
 * @param v - the axis vector
 * @param axis - The axis  0 = x, 1 = y;
 * @param dst - The matrix to set. If not passed a new one is created.
 * @returns The matrix with axis set.
 */
function setAxis$1(m, v, axis, dst) {
  if (dst !== m) {
    dst = copy$4(m, dst);
  }
  const off = axis * 4;
  dst[off + 0] = v[0];
  dst[off + 1] = v[1];
  return dst;
}
/**
 * Returns the scaling component of the matrix
 * @param m - The Matrix
 * @param dst - The vector to set. If not passed a new one is created.
 */
function getScaling$2(m, dst) {
  dst = dst || create$5();
  const xx = m[0];
  const xy = m[1];
  const yx = m[4];
  const yy = m[5];
  dst[0] = Math.sqrt(xx * xx + xy * xy);
  dst[1] = Math.sqrt(yx * yx + yy * yy);
  return dst;
}
/**
 * Creates a 3-by-3 matrix which translates by the given vector v.
 * @param v - The vector by which to translate.
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns The translation matrix.
 */
function translation$1(v, dst) {
  dst = dst || newMat3();
  dst[0] = 1;
  dst[1] = 0;
  dst[2] = 0;
  dst[4] = 0;
  dst[5] = 1;
  dst[6] = 0;
  dst[8] = v[0];
  dst[9] = v[1];
  dst[10] = 1;
  return dst;
}
/**
 * Translates the given 3-by-3 matrix by the given vector v.
 * @param m - The matrix.
 * @param v - The vector by which to translate.
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns The translated matrix.
 */
function translate$1(m, v, dst) {
  dst = dst || newMat3();
  const v0 = v[0];
  const v1 = v[1];
  const m00 = m[0];
  const m01 = m[1];
  const m02 = m[2];
  const m10 = m[1 * 4 + 0];
  const m11 = m[1 * 4 + 1];
  const m12 = m[1 * 4 + 2];
  const m20 = m[2 * 4 + 0];
  const m21 = m[2 * 4 + 1];
  const m22 = m[2 * 4 + 2];
  if (m !== dst) {
    dst[0] = m00;
    dst[1] = m01;
    dst[2] = m02;
    dst[4] = m10;
    dst[5] = m11;
    dst[6] = m12;
  }
  dst[8] = m00 * v0 + m10 * v1 + m20;
  dst[9] = m01 * v0 + m11 * v1 + m21;
  dst[10] = m02 * v0 + m12 * v1 + m22;
  return dst;
}
/**
 * Creates a 3-by-3 matrix which rotates  by the given angle.
 * @param angleInRadians - The angle by which to rotate (in radians).
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns The rotation matrix.
 */
function rotation$1(angleInRadians, dst) {
  dst = dst || newMat3();
  const c = Math.cos(angleInRadians);
  const s = Math.sin(angleInRadians);
  dst[0] = c;
  dst[1] = s;
  dst[2] = 0;
  dst[4] = -s;
  dst[5] = c;
  dst[6] = 0;
  dst[8] = 0;
  dst[9] = 0;
  dst[10] = 1;
  return dst;
}
/**
 * Rotates the given 3-by-3 matrix  by the given angle.
 * @param m - The matrix.
 * @param angleInRadians - The angle by which to rotate (in radians).
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns The rotated matrix.
 */
function rotate$1(m, angleInRadians, dst) {
  dst = dst || newMat3();
  const m00 = m[0 * 4 + 0];
  const m01 = m[0 * 4 + 1];
  const m02 = m[0 * 4 + 2];
  const m10 = m[1 * 4 + 0];
  const m11 = m[1 * 4 + 1];
  const m12 = m[1 * 4 + 2];
  const c = Math.cos(angleInRadians);
  const s = Math.sin(angleInRadians);
  dst[0] = c * m00 + s * m10;
  dst[1] = c * m01 + s * m11;
  dst[2] = c * m02 + s * m12;
  dst[4] = c * m10 - s * m00;
  dst[5] = c * m11 - s * m01;
  dst[6] = c * m12 - s * m02;
  if (m !== dst) {
    dst[8] = m[8];
    dst[9] = m[9];
    dst[10] = m[10];
  }
  return dst;
}
/**
 * Creates a 3-by-3 matrix which scales in each dimension by an amount given by
 * the corresponding entry in the given vector; assumes the vector has three
 * entries.
 * @param v - A vector of
 *     2 entries specifying the factor by which to scale in each dimension.
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns The scaling matrix.
 */
function scaling$1(v, dst) {
  dst = dst || newMat3();
  dst[0] = v[0];
  dst[1] = 0;
  dst[2] = 0;
  dst[4] = 0;
  dst[5] = v[1];
  dst[6] = 0;
  dst[8] = 0;
  dst[9] = 0;
  dst[10] = 1;
  return dst;
}
/**
 * Scales the given 3-by-3 matrix in each dimension by an amount
 * given by the corresponding entry in the given vector; assumes the vector has
 * three entries.
 * @param m - The matrix to be modified.
 * @param v - A vector of 2 entries specifying the
 *     factor by which to scale in each dimension.
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns The scaled matrix.
 */
function scale$4(m, v, dst) {
  dst = dst || newMat3();
  const v0 = v[0];
  const v1 = v[1];
  dst[0] = v0 * m[0 * 4 + 0];
  dst[1] = v0 * m[0 * 4 + 1];
  dst[2] = v0 * m[0 * 4 + 2];
  dst[4] = v1 * m[1 * 4 + 0];
  dst[5] = v1 * m[1 * 4 + 1];
  dst[6] = v1 * m[1 * 4 + 2];
  if (m !== dst) {
    dst[8] = m[8];
    dst[9] = m[9];
    dst[10] = m[10];
  }
  return dst;
}
/**
 * Creates a 3-by-3 matrix which scales uniformly in each dimension
 * @param s - Amount to scale
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns The scaling matrix.
 */
function uniformScaling$1(s, dst) {
  dst = dst || newMat3();
  dst[0] = s;
  dst[1] = 0;
  dst[2] = 0;
  dst[4] = 0;
  dst[5] = s;
  dst[6] = 0;
  dst[8] = 0;
  dst[9] = 0;
  dst[10] = 1;
  return dst;
}
/**
 * Scales the given 3-by-3 matrix in each dimension by an amount
 * given.
 * @param m - The matrix to be modified.
 * @param s - Amount to scale.
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns The scaled matrix.
 */
function uniformScale$1(m, s, dst) {
  dst = dst || newMat3();
  dst[0] = s * m[0 * 4 + 0];
  dst[1] = s * m[0 * 4 + 1];
  dst[2] = s * m[0 * 4 + 2];
  dst[4] = s * m[1 * 4 + 0];
  dst[5] = s * m[1 * 4 + 1];
  dst[6] = s * m[1 * 4 + 2];
  if (m !== dst) {
    dst[8] = m[8];
    dst[9] = m[9];
    dst[10] = m[10];
  }
  return dst;
}
var mat3Impl = exports.mat3 = /*#__PURE__*/Object.freeze({
  __proto__: null,
  setDefaultType: setDefaultType$4,
  create: create$3,
  set: set$4,
  fromMat4: fromMat4,
  fromQuat: fromQuat$1,
  negate: negate$3,
  copy: copy$4,
  clone: clone$4,
  equalsApproximately: equalsApproximately$4,
  equals: equals$4,
  identity: identity$2,
  transpose: transpose$1,
  inverse: inverse$4,
  determinant: determinant$1,
  invert: invert$3,
  multiply: multiply$4,
  mul: mul$4,
  setTranslation: setTranslation$1,
  getTranslation: getTranslation$2,
  getAxis: getAxis$2,
  setAxis: setAxis$1,
  getScaling: getScaling$2,
  translation: translation$1,
  translate: translate$1,
  rotation: rotation$1,
  rotate: rotate$1,
  scaling: scaling$1,
  scale: scale$4,
  uniformScaling: uniformScaling$1,
  uniformScale: uniformScale$1
});

/*
 * Copyright 2022 Gregg Tavares
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.  IN NO EVENT SHALL
 * THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 */
/**
 * Creates a vec3; may be called with x, y, z to set initial values. (same as create)
 * @param x - Initial x value.
 * @param y - Initial y value.
 * @param z - Initial z value.
 * @returns the created vector
 */
const fromValues$2 = create$4;
/**
 * Sets the values of a Vec3
 * Also see {@link vec3.create} and {@link vec3.copy}
 *
 * @param x first value
 * @param y second value
 * @param z third value
 * @param dst - vector to hold result. If not passed in a new one is created.
 * @returns A vector with its elements set.
 */
function set$3(x, y, z, dst) {
  dst = dst || new VecType$1(3);
  dst[0] = x;
  dst[1] = y;
  dst[2] = z;
  return dst;
}
/**
 * Applies Math.ceil to each element of vector
 * @param v - Operand vector.
 * @param dst - vector to hold result. If not passed in a new one is created.
 * @returns A vector that is the ceil of each element of v.
 */
function ceil$1(v, dst) {
  dst = dst || new VecType$1(3);
  dst[0] = Math.ceil(v[0]);
  dst[1] = Math.ceil(v[1]);
  dst[2] = Math.ceil(v[2]);
  return dst;
}
/**
 * Applies Math.floor to each element of vector
 * @param v - Operand vector.
 * @param dst - vector to hold result. If not passed in a new one is created.
 * @returns A vector that is the floor of each element of v.
 */
function floor$1(v, dst) {
  dst = dst || new VecType$1(3);
  dst[0] = Math.floor(v[0]);
  dst[1] = Math.floor(v[1]);
  dst[2] = Math.floor(v[2]);
  return dst;
}
/**
 * Applies Math.round to each element of vector
 * @param v - Operand vector.
 * @param dst - vector to hold result. If not passed in a new one is created.
 * @returns A vector that is the round of each element of v.
 */
function round$1(v, dst) {
  dst = dst || new VecType$1(3);
  dst[0] = Math.round(v[0]);
  dst[1] = Math.round(v[1]);
  dst[2] = Math.round(v[2]);
  return dst;
}
/**
 * Clamp each element of vector between min and max
 * @param v - Operand vector.
 * @param max - Min value, default 0
 * @param min - Max value, default 1
 * @param dst - vector to hold result. If not passed in a new one is created.
 * @returns A vector that the clamped value of each element of v.
 */
function clamp$1(v, min = 0, max = 1, dst) {
  dst = dst || new VecType$1(3);
  dst[0] = Math.min(max, Math.max(min, v[0]));
  dst[1] = Math.min(max, Math.max(min, v[1]));
  dst[2] = Math.min(max, Math.max(min, v[2]));
  return dst;
}
/**
 * Adds two vectors; assumes a and b have the same dimension.
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @param dst - vector to hold result. If not passed in a new one is created.
 * @returns A vector that is the sum of a and b.
 */
function add$2(a, b, dst) {
  dst = dst || new VecType$1(3);
  dst[0] = a[0] + b[0];
  dst[1] = a[1] + b[1];
  dst[2] = a[2] + b[2];
  return dst;
}
/**
 * Adds two vectors, scaling the 2nd; assumes a and b have the same dimension.
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @param scale - Amount to scale b
 * @param dst - vector to hold result. If not passed in a new one is created.
 * @returns A vector that is the sum of a + b * scale.
 */
function addScaled$1(a, b, scale, dst) {
  dst = dst || new VecType$1(3);
  dst[0] = a[0] + b[0] * scale;
  dst[1] = a[1] + b[1] * scale;
  dst[2] = a[2] + b[2] * scale;
  return dst;
}
/**
 * Returns the angle in radians between two vectors.
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @returns The angle in radians between the 2 vectors.
 */
function angle$1(a, b) {
  const ax = a[0];
  const ay = a[1];
  const az = a[2];
  const bx = a[0];
  const by = a[1];
  const bz = a[2];
  const mag1 = Math.sqrt(ax * ax + ay * ay + az * az);
  const mag2 = Math.sqrt(bx * bx + by * by + bz * bz);
  const mag = mag1 * mag2;
  const cosine = mag && dot$2(a, b) / mag;
  return Math.acos(cosine);
}
/**
 * Subtracts two vectors.
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @param dst - vector to hold result. If not passed in a new one is created.
 * @returns A vector that is the difference of a and b.
 */
function subtract$2(a, b, dst) {
  dst = dst || new VecType$1(3);
  dst[0] = a[0] - b[0];
  dst[1] = a[1] - b[1];
  dst[2] = a[2] - b[2];
  return dst;
}
/**
 * Subtracts two vectors.
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @param dst - vector to hold result. If not passed in a new one is created.
 * @returns A vector that is the difference of a and b.
 */
const sub$2 = subtract$2;
/**
 * Check if 2 vectors are approximately equal
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @returns true if vectors are approximately equal
 */
function equalsApproximately$3(a, b) {
  return Math.abs(a[0] - b[0]) < EPSILON && Math.abs(a[1] - b[1]) < EPSILON && Math.abs(a[2] - b[2]) < EPSILON;
}
/**
 * Check if 2 vectors are exactly equal
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @returns true if vectors are exactly equal
 */
function equals$3(a, b) {
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
}
/**
 * Performs linear interpolation on two vectors.
 * Given vectors a and b and interpolation coefficient t, returns
 * a + t * (b - a).
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @param t - Interpolation coefficient.
 * @param dst - vector to hold result. If not passed in a new one is created.
 * @returns The linear interpolated result.
 */
function lerp$2(a, b, t, dst) {
  dst = dst || new VecType$1(3);
  dst[0] = a[0] + t * (b[0] - a[0]);
  dst[1] = a[1] + t * (b[1] - a[1]);
  dst[2] = a[2] + t * (b[2] - a[2]);
  return dst;
}
/**
 * Performs linear interpolation on two vectors.
 * Given vectors a and b and interpolation coefficient vector t, returns
 * a + t * (b - a).
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @param t - Interpolation coefficients vector.
 * @param dst - vector to hold result. If not passed in a new one is created.
 * @returns the linear interpolated result.
 */
function lerpV$1(a, b, t, dst) {
  dst = dst || new VecType$1(3);
  dst[0] = a[0] + t[0] * (b[0] - a[0]);
  dst[1] = a[1] + t[1] * (b[1] - a[1]);
  dst[2] = a[2] + t[2] * (b[2] - a[2]);
  return dst;
}
/**
 * Return max values of two vectors.
 * Given vectors a and b returns
 * [max(a[0], b[0]), max(a[1], b[1]), max(a[2], b[2])].
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @param dst - vector to hold result. If not passed in a new one is created.
 * @returns The max components vector.
 */
function max$1(a, b, dst) {
  dst = dst || new VecType$1(3);
  dst[0] = Math.max(a[0], b[0]);
  dst[1] = Math.max(a[1], b[1]);
  dst[2] = Math.max(a[2], b[2]);
  return dst;
}
/**
 * Return min values of two vectors.
 * Given vectors a and b returns
 * [min(a[0], b[0]), min(a[1], b[1]), min(a[2], b[2])].
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @param dst - vector to hold result. If not passed in a new one is created.
 * @returns The min components vector.
 */
function min$1(a, b, dst) {
  dst = dst || new VecType$1(3);
  dst[0] = Math.min(a[0], b[0]);
  dst[1] = Math.min(a[1], b[1]);
  dst[2] = Math.min(a[2], b[2]);
  return dst;
}
/**
 * Multiplies a vector by a scalar.
 * @param v - The vector.
 * @param k - The scalar.
 * @param dst - vector to hold result. If not passed in a new one is created.
 * @returns The scaled vector.
 */
function mulScalar$2(v, k, dst) {
  dst = dst || new VecType$1(3);
  dst[0] = v[0] * k;
  dst[1] = v[1] * k;
  dst[2] = v[2] * k;
  return dst;
}
/**
 * Multiplies a vector by a scalar. (same as mulScalar)
 * @param v - The vector.
 * @param k - The scalar.
 * @param dst - vector to hold result. If not passed in a new one is created.
 * @returns The scaled vector.
 */
const scale$3 = mulScalar$2;
/**
 * Divides a vector by a scalar.
 * @param v - The vector.
 * @param k - The scalar.
 * @param dst - vector to hold result. If not passed in a new one is created.
 * @returns The scaled vector.
 */
function divScalar$2(v, k, dst) {
  dst = dst || new VecType$1(3);
  dst[0] = v[0] / k;
  dst[1] = v[1] / k;
  dst[2] = v[2] / k;
  return dst;
}
/**
 * Inverse a vector.
 * @param v - The vector.
 * @param dst - vector to hold result. If not passed in a new one is created.
 * @returns The inverted vector.
 */
function inverse$3(v, dst) {
  dst = dst || new VecType$1(3);
  dst[0] = 1 / v[0];
  dst[1] = 1 / v[1];
  dst[2] = 1 / v[2];
  return dst;
}
/**
 * Invert a vector. (same as inverse)
 * @param v - The vector.
 * @param dst - vector to hold result. If not passed in a new one is created.
 * @returns The inverted vector.
 */
const invert$2 = inverse$3;
/**
 * Computes the cross product of two vectors; assumes both vectors have
 * three entries.
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @param dst - vector to hold result. If not passed in a new one is created.
 * @returns The vector of a cross b.
 */
function cross(a, b, dst) {
  dst = dst || new VecType$1(3);
  const t1 = a[2] * b[0] - a[0] * b[2];
  const t2 = a[0] * b[1] - a[1] * b[0];
  dst[0] = a[1] * b[2] - a[2] * b[1];
  dst[1] = t1;
  dst[2] = t2;
  return dst;
}
/**
 * Computes the dot product of two vectors; assumes both vectors have
 * three entries.
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @returns dot product
 */
function dot$2(a, b) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}
/**
 * Computes the length of vector
 * @param v - vector.
 * @returns length of vector.
 */
function length$2(v) {
  const v0 = v[0];
  const v1 = v[1];
  const v2 = v[2];
  return Math.sqrt(v0 * v0 + v1 * v1 + v2 * v2);
}
/**
 * Computes the length of vector (same as length)
 * @param v - vector.
 * @returns length of vector.
 */
const len$2 = length$2;
/**
 * Computes the square of the length of vector
 * @param v - vector.
 * @returns square of the length of vector.
 */
function lengthSq$2(v) {
  const v0 = v[0];
  const v1 = v[1];
  const v2 = v[2];
  return v0 * v0 + v1 * v1 + v2 * v2;
}
/**
 * Computes the square of the length of vector (same as lengthSq)
 * @param v - vector.
 * @returns square of the length of vector.
 */
const lenSq$2 = lengthSq$2;
/**
 * Computes the distance between 2 points
 * @param a - vector.
 * @param b - vector.
 * @returns distance between a and b
 */
function distance$1(a, b) {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  const dz = a[2] - b[2];
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}
/**
 * Computes the distance between 2 points (same as distance)
 * @param a - vector.
 * @param b - vector.
 * @returns distance between a and b
 */
const dist$1 = distance$1;
/**
 * Computes the square of the distance between 2 points
 * @param a - vector.
 * @param b - vector.
 * @returns square of the distance between a and b
 */
function distanceSq$1(a, b) {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  const dz = a[2] - b[2];
  return dx * dx + dy * dy + dz * dz;
}
/**
 * Computes the square of the distance between 2 points (same as distanceSq)
 * @param a - vector.
 * @param b - vector.
 * @returns square of the distance between a and b
 */
const distSq$1 = distanceSq$1;
/**
 * Divides a vector by its Euclidean length and returns the quotient.
 * @param v - The vector.
 * @param dst - vector to hold result. If not passed in a new one is created.
 * @returns The normalized vector.
 */
function normalize$2(v, dst) {
  dst = dst || new VecType$1(3);
  const v0 = v[0];
  const v1 = v[1];
  const v2 = v[2];
  const len = Math.sqrt(v0 * v0 + v1 * v1 + v2 * v2);
  if (len > 0.00001) {
    dst[0] = v0 / len;
    dst[1] = v1 / len;
    dst[2] = v2 / len;
  } else {
    dst[0] = 0;
    dst[1] = 0;
    dst[2] = 0;
  }
  return dst;
}
/**
 * Negates a vector.
 * @param v - The vector.
 * @param dst - vector to hold result. If not passed in a new one is created.
 * @returns -v.
 */
function negate$2(v, dst) {
  dst = dst || new VecType$1(3);
  dst[0] = -v[0];
  dst[1] = -v[1];
  dst[2] = -v[2];
  return dst;
}
/**
 * Copies a vector. (same as {@link vec3.clone})
 * Also see {@link vec3.create} and {@link vec3.set}
 * @param v - The vector.
 * @param dst - vector to hold result. If not passed in a new one is created.
 * @returns A copy of v.
 */
function copy$3(v, dst) {
  dst = dst || new VecType$1(3);
  dst[0] = v[0];
  dst[1] = v[1];
  dst[2] = v[2];
  return dst;
}
/**
 * Clones a vector. (same as {@link vec3.copy})
 * Also see {@link vec3.create} and {@link vec3.set}
 * @param v - The vector.
 * @param dst - vector to hold result. If not passed in a new one is created.
 * @returns A copy of v.
 */
const clone$3 = copy$3;
/**
 * Multiplies a vector by another vector (component-wise); assumes a and
 * b have the same length.
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @param dst - vector to hold result. If not passed in a new one is created.
 * @returns The vector of products of entries of a and b.
 */
function multiply$3(a, b, dst) {
  dst = dst || new VecType$1(3);
  dst[0] = a[0] * b[0];
  dst[1] = a[1] * b[1];
  dst[2] = a[2] * b[2];
  return dst;
}
/**
 * Multiplies a vector by another vector (component-wise); assumes a and
 * b have the same length. (same as mul)
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @param dst - vector to hold result. If not passed in a new one is created.
 * @returns The vector of products of entries of a and b.
 */
const mul$3 = multiply$3;
/**
 * Divides a vector by another vector (component-wise); assumes a and
 * b have the same length.
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @param dst - vector to hold result. If not passed in a new one is created.
 * @returns The vector of quotients of entries of a and b.
 */
function divide$1(a, b, dst) {
  dst = dst || new VecType$1(3);
  dst[0] = a[0] / b[0];
  dst[1] = a[1] / b[1];
  dst[2] = a[2] / b[2];
  return dst;
}
/**
 * Divides a vector by another vector (component-wise); assumes a and
 * b have the same length. (same as divide)
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @param dst - vector to hold result. If not passed in a new one is created.
 * @returns The vector of quotients of entries of a and b.
 */
const div$1 = divide$1;
/**
 * Creates a random vector
 * @param scale - Default 1
 * @param dst - vector to hold result. If not passed in a new one is created.
 * @returns The random vector.
 */
function random(scale = 1, dst) {
  dst = dst || new VecType$1(3);
  const angle = Math.random() * 2 * Math.PI;
  const z = Math.random() * 2 - 1;
  const zScale = Math.sqrt(1 - z * z) * scale;
  dst[0] = Math.cos(angle) * zScale;
  dst[1] = Math.sin(angle) * zScale;
  dst[2] = z * scale;
  return dst;
}
/**
 * Zero's a vector
 * @param dst - vector to hold result. If not passed in a new one is created.
 * @returns The zeroed vector.
 */
function zero$1(dst) {
  dst = dst || new VecType$1(3);
  dst[0] = 0;
  dst[1] = 0;
  dst[2] = 0;
  return dst;
}
/**
 * transform vec3 by 4x4 matrix
 * @param v - the vector
 * @param m - The matrix.
 * @param dst - optional vec3 to store result. If not passed a new one is created.
 * @returns the transformed vector
 */
function transformMat4$1(v, m, dst) {
  dst = dst || new VecType$1(3);
  const x = v[0];
  const y = v[1];
  const z = v[2];
  const w = m[3] * x + m[7] * y + m[11] * z + m[15] || 1;
  dst[0] = (m[0] * x + m[4] * y + m[8] * z + m[12]) / w;
  dst[1] = (m[1] * x + m[5] * y + m[9] * z + m[13]) / w;
  dst[2] = (m[2] * x + m[6] * y + m[10] * z + m[14]) / w;
  return dst;
}
/**
 * Transform vec4 by upper 3x3 matrix inside 4x4 matrix.
 * @param v - The direction.
 * @param m - The matrix.
 * @param dst - optional Vec3 to store result. If not passed a new one is created.
 * @returns The transformed vector.
 */
function transformMat4Upper3x3(v, m, dst) {
  dst = dst || new VecType$1(3);
  const v0 = v[0];
  const v1 = v[1];
  const v2 = v[2];
  dst[0] = v0 * m[0 * 4 + 0] + v1 * m[1 * 4 + 0] + v2 * m[2 * 4 + 0];
  dst[1] = v0 * m[0 * 4 + 1] + v1 * m[1 * 4 + 1] + v2 * m[2 * 4 + 1];
  dst[2] = v0 * m[0 * 4 + 2] + v1 * m[1 * 4 + 2] + v2 * m[2 * 4 + 2];
  return dst;
}
/**
 * Transforms vec3 by 3x3 matrix
 *
 * @param v - the vector
 * @param m - The matrix.
 * @param dst - optional vec3 to store result. If not passed a new one is created.
 * @returns the transformed vector
 */
function transformMat3(v, m, dst) {
  dst = dst || new VecType$1(3);
  const x = v[0];
  const y = v[1];
  const z = v[2];
  dst[0] = x * m[0] + y * m[4] + z * m[8];
  dst[1] = x * m[1] + y * m[5] + z * m[9];
  dst[2] = x * m[2] + y * m[6] + z * m[10];
  return dst;
}
/**
 * Transforms vec3 by Quaternion
 * @param v - the vector to transform
 * @param q - the quaternion to transform by
 * @param dst - optional vec3 to store result. If not passed a new one is created.
 * @returns the transformed
 */
function transformQuat(v, q, dst) {
  dst = dst || new VecType$1(3);
  const qx = q[0];
  const qy = q[1];
  const qz = q[2];
  const w2 = q[3] * 2;
  const x = v[0];
  const y = v[1];
  const z = v[2];
  const uvX = qy * z - qz * y;
  const uvY = qz * x - qx * z;
  const uvZ = qx * y - qy * x;
  dst[0] = x + uvX * w2 + (qy * uvZ - qz * uvY) * 2;
  dst[1] = y + uvY * w2 + (qz * uvX - qx * uvZ) * 2;
  dst[2] = z + uvZ * w2 + (qx * uvY - qy * uvX) * 2;
  return dst;
}
/**
 * Returns the translation component of a 4-by-4 matrix as a vector with 3
 * entries.
 * @param m - The matrix.
 * @param dst - vector to hold result. If not passed a new one is created.
 * @returns The translation component of m.
 */
function getTranslation$1(m, dst) {
  dst = dst || new VecType$1(3);
  dst[0] = m[12];
  dst[1] = m[13];
  dst[2] = m[14];
  return dst;
}
/**
 * Returns an axis of a 4x4 matrix as a vector with 3 entries
 * @param m - The matrix.
 * @param axis - The axis 0 = x, 1 = y, 2 = z;
 * @returns The axis component of m.
 */
function getAxis$1(m, axis, dst) {
  dst = dst || new VecType$1(3);
  const off = axis * 4;
  dst[0] = m[off + 0];
  dst[1] = m[off + 1];
  dst[2] = m[off + 2];
  return dst;
}
/**
 * Returns the scaling component of the matrix
 * @param m - The Matrix
 * @param dst - The vector to set. If not passed a new one is created.
 */
function getScaling$1(m, dst) {
  dst = dst || new VecType$1(3);
  const xx = m[0];
  const xy = m[1];
  const xz = m[2];
  const yx = m[4];
  const yy = m[5];
  const yz = m[6];
  const zx = m[8];
  const zy = m[9];
  const zz = m[10];
  dst[0] = Math.sqrt(xx * xx + xy * xy + xz * xz);
  dst[1] = Math.sqrt(yx * yx + yy * yy + yz * yz);
  dst[2] = Math.sqrt(zx * zx + zy * zy + zz * zz);
  return dst;
}
var vec3Impl = exports.vec3 = /*#__PURE__*/Object.freeze({
  __proto__: null,
  create: create$4,
  setDefaultType: setDefaultType$5,
  fromValues: fromValues$2,
  set: set$3,
  ceil: ceil$1,
  floor: floor$1,
  round: round$1,
  clamp: clamp$1,
  add: add$2,
  addScaled: addScaled$1,
  angle: angle$1,
  subtract: subtract$2,
  sub: sub$2,
  equalsApproximately: equalsApproximately$3,
  equals: equals$3,
  lerp: lerp$2,
  lerpV: lerpV$1,
  max: max$1,
  min: min$1,
  mulScalar: mulScalar$2,
  scale: scale$3,
  divScalar: divScalar$2,
  inverse: inverse$3,
  invert: invert$2,
  cross: cross,
  dot: dot$2,
  length: length$2,
  len: len$2,
  lengthSq: lengthSq$2,
  lenSq: lenSq$2,
  distance: distance$1,
  dist: dist$1,
  distanceSq: distanceSq$1,
  distSq: distSq$1,
  normalize: normalize$2,
  negate: negate$2,
  copy: copy$3,
  clone: clone$3,
  multiply: multiply$3,
  mul: mul$3,
  divide: divide$1,
  div: div$1,
  random: random,
  zero: zero$1,
  transformMat4: transformMat4$1,
  transformMat4Upper3x3: transformMat4Upper3x3,
  transformMat3: transformMat3,
  transformQuat: transformQuat,
  getTranslation: getTranslation$1,
  getAxis: getAxis$1,
  getScaling: getScaling$1
});

/**
 * 4x4 Matrix math math functions.
 *
 * Almost all functions take an optional `dst` argument. If it is not passed in the
 * functions will create a new matrix. In other words you can do this
 *
 *     const mat = mat4.translation([1, 2, 3]);  // Creates a new translation matrix
 *
 * or
 *
 *     const mat = mat4.create();
 *     mat4.translation([1, 2, 3], mat);  // Puts translation matrix in mat.
 *
 * The first style is often easier but depending on where it's used it generates garbage where
 * as there is almost never allocation with the second style.
 *
 * It is always save to pass any matrix as the destination. So for example
 *
 *     const mat = mat4.identity();
 *     const trans = mat4.translation([1, 2, 3]);
 *     mat4.multiply(mat, trans, mat);  // Multiplies mat * trans and puts result in mat.
 *
 */
let MatType = Float32Array;
/**
 * Sets the type this library creates for a Mat4
 * @param ctor - the constructor for the type. Either `Float32Array`, `Float64Array`, or `Array`
 * @returns previous constructor for Mat4
 */
function setDefaultType$3(ctor) {
  const oldType = MatType;
  MatType = ctor;
  return oldType;
}
/**
 * Create a Mat4 from values
 *
 * Note: Since passing in a raw JavaScript array
 * is valid in all circumstances, if you want to
 * force a JavaScript array into a Mat4's specified type
 * it would be faster to use
 *
 * ```
 * const m = mat4.clone(someJSArray);
 * ```
 *
 * Note: a consequence of the implementation is if your Mat4Type = `Array`
 * instead of `Float32Array` or `Float64Array` then any values you
 * don't pass in will be undefined. Usually this is not an issue since
 * (a) using `Array` is rare and (b) using `mat4.create` is usually used
 * to create a Mat4 to be filled out as in
 *
 * ```
 * const m = mat4.create();
 * mat4.perspective(fov, aspect, near, far, m);
 * ```
 *
 * @param v0 - value for element 0
 * @param v1 - value for element 1
 * @param v2 - value for element 2
 * @param v3 - value for element 3
 * @param v4 - value for element 4
 * @param v5 - value for element 5
 * @param v6 - value for element 6
 * @param v7 - value for element 7
 * @param v8 - value for element 8
 * @param v9 - value for element 9
 * @param v10 - value for element 10
 * @param v11 - value for element 11
 * @param v12 - value for element 12
 * @param v13 - value for element 13
 * @param v14 - value for element 14
 * @param v15 - value for element 15
 * @returns created from values.
 */
function create$2(v0, v1, v2, v3, v4, v5, v6, v7, v8, v9, v10, v11, v12, v13, v14, v15) {
  const dst = new MatType(16);
  if (v0 !== undefined) {
    dst[0] = v0;
    if (v1 !== undefined) {
      dst[1] = v1;
      if (v2 !== undefined) {
        dst[2] = v2;
        if (v3 !== undefined) {
          dst[3] = v3;
          if (v4 !== undefined) {
            dst[4] = v4;
            if (v5 !== undefined) {
              dst[5] = v5;
              if (v6 !== undefined) {
                dst[6] = v6;
                if (v7 !== undefined) {
                  dst[7] = v7;
                  if (v8 !== undefined) {
                    dst[8] = v8;
                    if (v9 !== undefined) {
                      dst[9] = v9;
                      if (v10 !== undefined) {
                        dst[10] = v10;
                        if (v11 !== undefined) {
                          dst[11] = v11;
                          if (v12 !== undefined) {
                            dst[12] = v12;
                            if (v13 !== undefined) {
                              dst[13] = v13;
                              if (v14 !== undefined) {
                                dst[14] = v14;
                                if (v15 !== undefined) {
                                  dst[15] = v15;
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
  return dst;
}
/**
 * Sets the values of a Mat4
 * Also see {@link mat4.create} and {@link mat4.copy}
 *
 * @param v0 - value for element 0
 * @param v1 - value for element 1
 * @param v2 - value for element 2
 * @param v3 - value for element 3
 * @param v4 - value for element 4
 * @param v5 - value for element 5
 * @param v6 - value for element 6
 * @param v7 - value for element 7
 * @param v8 - value for element 8
 * @param v9 - value for element 9
 * @param v10 - value for element 10
 * @param v11 - value for element 11
 * @param v12 - value for element 12
 * @param v13 - value for element 13
 * @param v14 - value for element 14
 * @param v15 - value for element 15
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns Mat4 created from values.
 */
function set$2(v0, v1, v2, v3, v4, v5, v6, v7, v8, v9, v10, v11, v12, v13, v14, v15, dst) {
  dst = dst || new MatType(16);
  dst[0] = v0;
  dst[1] = v1;
  dst[2] = v2;
  dst[3] = v3;
  dst[4] = v4;
  dst[5] = v5;
  dst[6] = v6;
  dst[7] = v7;
  dst[8] = v8;
  dst[9] = v9;
  dst[10] = v10;
  dst[11] = v11;
  dst[12] = v12;
  dst[13] = v13;
  dst[14] = v14;
  dst[15] = v15;
  return dst;
}
/**
 * Creates a Mat4 from a Mat3
 * @param m3 - source matrix
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns Mat4 made from m3
 */
function fromMat3(m3, dst) {
  dst = dst || new MatType(16);
  dst[0] = m3[0];
  dst[1] = m3[1];
  dst[2] = m3[2];
  dst[3] = 0;
  dst[4] = m3[4];
  dst[5] = m3[5];
  dst[6] = m3[6];
  dst[7] = 0;
  dst[8] = m3[8];
  dst[9] = m3[9];
  dst[10] = m3[10];
  dst[11] = 0;
  dst[12] = 0;
  dst[13] = 0;
  dst[14] = 0;
  dst[15] = 1;
  return dst;
}
/**
 * Creates a Mat4 rotation matrix from a quaternion
 * @param q - quaternion to create matrix from
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns Mat4 made from q
 */
function fromQuat(q, dst) {
  dst = dst || new MatType(16);
  const x = q[0];
  const y = q[1];
  const z = q[2];
  const w = q[3];
  const x2 = x + x;
  const y2 = y + y;
  const z2 = z + z;
  const xx = x * x2;
  const yx = y * x2;
  const yy = y * y2;
  const zx = z * x2;
  const zy = z * y2;
  const zz = z * z2;
  const wx = w * x2;
  const wy = w * y2;
  const wz = w * z2;
  dst[0] = 1 - yy - zz;
  dst[1] = yx + wz;
  dst[2] = zx - wy;
  dst[3] = 0;
  dst[4] = yx - wz;
  dst[5] = 1 - xx - zz;
  dst[6] = zy + wx;
  dst[7] = 0;
  dst[8] = zx + wy;
  dst[9] = zy - wx;
  dst[10] = 1 - xx - yy;
  dst[11] = 0;
  dst[12] = 0;
  dst[13] = 0;
  dst[14] = 0;
  dst[15] = 1;
  return dst;
}
/**
 * Negates a matrix.
 * @param m - The matrix.
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns -m.
 */
function negate$1(m, dst) {
  dst = dst || new MatType(16);
  dst[0] = -m[0];
  dst[1] = -m[1];
  dst[2] = -m[2];
  dst[3] = -m[3];
  dst[4] = -m[4];
  dst[5] = -m[5];
  dst[6] = -m[6];
  dst[7] = -m[7];
  dst[8] = -m[8];
  dst[9] = -m[9];
  dst[10] = -m[10];
  dst[11] = -m[11];
  dst[12] = -m[12];
  dst[13] = -m[13];
  dst[14] = -m[14];
  dst[15] = -m[15];
  return dst;
}
/**
 * Copies a matrix. (same as {@link mat4.clone})
 * Also see {@link mat4.create} and {@link mat4.set}
 * @param m - The matrix.
 * @param dst - The matrix. If not passed a new one is created.
 * @returns A copy of m.
 */
function copy$2(m, dst) {
  dst = dst || new MatType(16);
  dst[0] = m[0];
  dst[1] = m[1];
  dst[2] = m[2];
  dst[3] = m[3];
  dst[4] = m[4];
  dst[5] = m[5];
  dst[6] = m[6];
  dst[7] = m[7];
  dst[8] = m[8];
  dst[9] = m[9];
  dst[10] = m[10];
  dst[11] = m[11];
  dst[12] = m[12];
  dst[13] = m[13];
  dst[14] = m[14];
  dst[15] = m[15];
  return dst;
}
/**
 * Copies a matrix (same as {@link mat4.copy})
 * Also see {@link mat4.create} and {@link mat4.set}
 * @param m - The matrix.
 * @param dst - The matrix. If not passed a new one is created.
 * @returns A copy of m.
 */
const clone$2 = copy$2;
/**
 * Check if 2 matrices are approximately equal
 * @param a - Operand matrix.
 * @param b - Operand matrix.
 * @returns true if matrices are approximately equal
 */
function equalsApproximately$2(a, b) {
  return Math.abs(a[0] - b[0]) < EPSILON && Math.abs(a[1] - b[1]) < EPSILON && Math.abs(a[2] - b[2]) < EPSILON && Math.abs(a[3] - b[3]) < EPSILON && Math.abs(a[4] - b[4]) < EPSILON && Math.abs(a[5] - b[5]) < EPSILON && Math.abs(a[6] - b[6]) < EPSILON && Math.abs(a[7] - b[7]) < EPSILON && Math.abs(a[8] - b[8]) < EPSILON && Math.abs(a[9] - b[9]) < EPSILON && Math.abs(a[10] - b[10]) < EPSILON && Math.abs(a[11] - b[11]) < EPSILON && Math.abs(a[12] - b[12]) < EPSILON && Math.abs(a[13] - b[13]) < EPSILON && Math.abs(a[14] - b[14]) < EPSILON && Math.abs(a[15] - b[15]) < EPSILON;
}
/**
 * Check if 2 matrices are exactly equal
 * @param a - Operand matrix.
 * @param b - Operand matrix.
 * @returns true if matrices are exactly equal
 */
function equals$2(a, b) {
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3] && a[4] === b[4] && a[5] === b[5] && a[6] === b[6] && a[7] === b[7] && a[8] === b[8] && a[9] === b[9] && a[10] === b[10] && a[11] === b[11] && a[12] === b[12] && a[13] === b[13] && a[14] === b[14] && a[15] === b[15];
}
/**
 * Creates a 4-by-4 identity matrix.
 *
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns A 4-by-4 identity matrix.
 */
function identity$1(dst) {
  dst = dst || new MatType(16);
  dst[0] = 1;
  dst[1] = 0;
  dst[2] = 0;
  dst[3] = 0;
  dst[4] = 0;
  dst[5] = 1;
  dst[6] = 0;
  dst[7] = 0;
  dst[8] = 0;
  dst[9] = 0;
  dst[10] = 1;
  dst[11] = 0;
  dst[12] = 0;
  dst[13] = 0;
  dst[14] = 0;
  dst[15] = 1;
  return dst;
}
/**
 * Takes the transpose of a matrix.
 * @param m - The matrix.
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns The transpose of m.
 */
function transpose(m, dst) {
  dst = dst || new MatType(16);
  if (dst === m) {
    let t;
    t = m[1];
    m[1] = m[4];
    m[4] = t;
    t = m[2];
    m[2] = m[8];
    m[8] = t;
    t = m[3];
    m[3] = m[12];
    m[12] = t;
    t = m[6];
    m[6] = m[9];
    m[9] = t;
    t = m[7];
    m[7] = m[13];
    m[13] = t;
    t = m[11];
    m[11] = m[14];
    m[14] = t;
    return dst;
  }
  const m00 = m[0 * 4 + 0];
  const m01 = m[0 * 4 + 1];
  const m02 = m[0 * 4 + 2];
  const m03 = m[0 * 4 + 3];
  const m10 = m[1 * 4 + 0];
  const m11 = m[1 * 4 + 1];
  const m12 = m[1 * 4 + 2];
  const m13 = m[1 * 4 + 3];
  const m20 = m[2 * 4 + 0];
  const m21 = m[2 * 4 + 1];
  const m22 = m[2 * 4 + 2];
  const m23 = m[2 * 4 + 3];
  const m30 = m[3 * 4 + 0];
  const m31 = m[3 * 4 + 1];
  const m32 = m[3 * 4 + 2];
  const m33 = m[3 * 4 + 3];
  dst[0] = m00;
  dst[1] = m10;
  dst[2] = m20;
  dst[3] = m30;
  dst[4] = m01;
  dst[5] = m11;
  dst[6] = m21;
  dst[7] = m31;
  dst[8] = m02;
  dst[9] = m12;
  dst[10] = m22;
  dst[11] = m32;
  dst[12] = m03;
  dst[13] = m13;
  dst[14] = m23;
  dst[15] = m33;
  return dst;
}
/**
 * Computes the inverse of a 4-by-4 matrix.
 * @param m - The matrix.
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns The inverse of m.
 */
function inverse$2(m, dst) {
  dst = dst || new MatType(16);
  const m00 = m[0 * 4 + 0];
  const m01 = m[0 * 4 + 1];
  const m02 = m[0 * 4 + 2];
  const m03 = m[0 * 4 + 3];
  const m10 = m[1 * 4 + 0];
  const m11 = m[1 * 4 + 1];
  const m12 = m[1 * 4 + 2];
  const m13 = m[1 * 4 + 3];
  const m20 = m[2 * 4 + 0];
  const m21 = m[2 * 4 + 1];
  const m22 = m[2 * 4 + 2];
  const m23 = m[2 * 4 + 3];
  const m30 = m[3 * 4 + 0];
  const m31 = m[3 * 4 + 1];
  const m32 = m[3 * 4 + 2];
  const m33 = m[3 * 4 + 3];
  const tmp0 = m22 * m33;
  const tmp1 = m32 * m23;
  const tmp2 = m12 * m33;
  const tmp3 = m32 * m13;
  const tmp4 = m12 * m23;
  const tmp5 = m22 * m13;
  const tmp6 = m02 * m33;
  const tmp7 = m32 * m03;
  const tmp8 = m02 * m23;
  const tmp9 = m22 * m03;
  const tmp10 = m02 * m13;
  const tmp11 = m12 * m03;
  const tmp12 = m20 * m31;
  const tmp13 = m30 * m21;
  const tmp14 = m10 * m31;
  const tmp15 = m30 * m11;
  const tmp16 = m10 * m21;
  const tmp17 = m20 * m11;
  const tmp18 = m00 * m31;
  const tmp19 = m30 * m01;
  const tmp20 = m00 * m21;
  const tmp21 = m20 * m01;
  const tmp22 = m00 * m11;
  const tmp23 = m10 * m01;
  const t0 = tmp0 * m11 + tmp3 * m21 + tmp4 * m31 - (tmp1 * m11 + tmp2 * m21 + tmp5 * m31);
  const t1 = tmp1 * m01 + tmp6 * m21 + tmp9 * m31 - (tmp0 * m01 + tmp7 * m21 + tmp8 * m31);
  const t2 = tmp2 * m01 + tmp7 * m11 + tmp10 * m31 - (tmp3 * m01 + tmp6 * m11 + tmp11 * m31);
  const t3 = tmp5 * m01 + tmp8 * m11 + tmp11 * m21 - (tmp4 * m01 + tmp9 * m11 + tmp10 * m21);
  const d = 1 / (m00 * t0 + m10 * t1 + m20 * t2 + m30 * t3);
  dst[0] = d * t0;
  dst[1] = d * t1;
  dst[2] = d * t2;
  dst[3] = d * t3;
  dst[4] = d * (tmp1 * m10 + tmp2 * m20 + tmp5 * m30 - (tmp0 * m10 + tmp3 * m20 + tmp4 * m30));
  dst[5] = d * (tmp0 * m00 + tmp7 * m20 + tmp8 * m30 - (tmp1 * m00 + tmp6 * m20 + tmp9 * m30));
  dst[6] = d * (tmp3 * m00 + tmp6 * m10 + tmp11 * m30 - (tmp2 * m00 + tmp7 * m10 + tmp10 * m30));
  dst[7] = d * (tmp4 * m00 + tmp9 * m10 + tmp10 * m20 - (tmp5 * m00 + tmp8 * m10 + tmp11 * m20));
  dst[8] = d * (tmp12 * m13 + tmp15 * m23 + tmp16 * m33 - (tmp13 * m13 + tmp14 * m23 + tmp17 * m33));
  dst[9] = d * (tmp13 * m03 + tmp18 * m23 + tmp21 * m33 - (tmp12 * m03 + tmp19 * m23 + tmp20 * m33));
  dst[10] = d * (tmp14 * m03 + tmp19 * m13 + tmp22 * m33 - (tmp15 * m03 + tmp18 * m13 + tmp23 * m33));
  dst[11] = d * (tmp17 * m03 + tmp20 * m13 + tmp23 * m23 - (tmp16 * m03 + tmp21 * m13 + tmp22 * m23));
  dst[12] = d * (tmp14 * m22 + tmp17 * m32 + tmp13 * m12 - (tmp16 * m32 + tmp12 * m12 + tmp15 * m22));
  dst[13] = d * (tmp20 * m32 + tmp12 * m02 + tmp19 * m22 - (tmp18 * m22 + tmp21 * m32 + tmp13 * m02));
  dst[14] = d * (tmp18 * m12 + tmp23 * m32 + tmp15 * m02 - (tmp22 * m32 + tmp14 * m02 + tmp19 * m12));
  dst[15] = d * (tmp22 * m22 + tmp16 * m02 + tmp21 * m12 - (tmp20 * m12 + tmp23 * m22 + tmp17 * m02));
  return dst;
}
/**
 * Compute the determinant of a matrix
 * @param m - the matrix
 * @returns the determinant
 */
function determinant(m) {
  const m00 = m[0 * 4 + 0];
  const m01 = m[0 * 4 + 1];
  const m02 = m[0 * 4 + 2];
  const m03 = m[0 * 4 + 3];
  const m10 = m[1 * 4 + 0];
  const m11 = m[1 * 4 + 1];
  const m12 = m[1 * 4 + 2];
  const m13 = m[1 * 4 + 3];
  const m20 = m[2 * 4 + 0];
  const m21 = m[2 * 4 + 1];
  const m22 = m[2 * 4 + 2];
  const m23 = m[2 * 4 + 3];
  const m30 = m[3 * 4 + 0];
  const m31 = m[3 * 4 + 1];
  const m32 = m[3 * 4 + 2];
  const m33 = m[3 * 4 + 3];
  const tmp0 = m22 * m33;
  const tmp1 = m32 * m23;
  const tmp2 = m12 * m33;
  const tmp3 = m32 * m13;
  const tmp4 = m12 * m23;
  const tmp5 = m22 * m13;
  const tmp6 = m02 * m33;
  const tmp7 = m32 * m03;
  const tmp8 = m02 * m23;
  const tmp9 = m22 * m03;
  const tmp10 = m02 * m13;
  const tmp11 = m12 * m03;
  const t0 = tmp0 * m11 + tmp3 * m21 + tmp4 * m31 - (tmp1 * m11 + tmp2 * m21 + tmp5 * m31);
  const t1 = tmp1 * m01 + tmp6 * m21 + tmp9 * m31 - (tmp0 * m01 + tmp7 * m21 + tmp8 * m31);
  const t2 = tmp2 * m01 + tmp7 * m11 + tmp10 * m31 - (tmp3 * m01 + tmp6 * m11 + tmp11 * m31);
  const t3 = tmp5 * m01 + tmp8 * m11 + tmp11 * m21 - (tmp4 * m01 + tmp9 * m11 + tmp10 * m21);
  return m00 * t0 + m10 * t1 + m20 * t2 + m30 * t3;
}
/**
 * Computes the inverse of a 4-by-4 matrix. (same as inverse)
 * @param m - The matrix.
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns The inverse of m.
 */
const invert$1 = inverse$2;
/**
 * Multiplies two 4-by-4 matrices with a on the left and b on the right
 * @param a - The matrix on the left.
 * @param b - The matrix on the right.
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns The matrix product of a and b.
 */
function multiply$2(a, b, dst) {
  dst = dst || new MatType(16);
  const a00 = a[0];
  const a01 = a[1];
  const a02 = a[2];
  const a03 = a[3];
  const a10 = a[4 + 0];
  const a11 = a[4 + 1];
  const a12 = a[4 + 2];
  const a13 = a[4 + 3];
  const a20 = a[8 + 0];
  const a21 = a[8 + 1];
  const a22 = a[8 + 2];
  const a23 = a[8 + 3];
  const a30 = a[12 + 0];
  const a31 = a[12 + 1];
  const a32 = a[12 + 2];
  const a33 = a[12 + 3];
  const b00 = b[0];
  const b01 = b[1];
  const b02 = b[2];
  const b03 = b[3];
  const b10 = b[4 + 0];
  const b11 = b[4 + 1];
  const b12 = b[4 + 2];
  const b13 = b[4 + 3];
  const b20 = b[8 + 0];
  const b21 = b[8 + 1];
  const b22 = b[8 + 2];
  const b23 = b[8 + 3];
  const b30 = b[12 + 0];
  const b31 = b[12 + 1];
  const b32 = b[12 + 2];
  const b33 = b[12 + 3];
  dst[0] = a00 * b00 + a10 * b01 + a20 * b02 + a30 * b03;
  dst[1] = a01 * b00 + a11 * b01 + a21 * b02 + a31 * b03;
  dst[2] = a02 * b00 + a12 * b01 + a22 * b02 + a32 * b03;
  dst[3] = a03 * b00 + a13 * b01 + a23 * b02 + a33 * b03;
  dst[4] = a00 * b10 + a10 * b11 + a20 * b12 + a30 * b13;
  dst[5] = a01 * b10 + a11 * b11 + a21 * b12 + a31 * b13;
  dst[6] = a02 * b10 + a12 * b11 + a22 * b12 + a32 * b13;
  dst[7] = a03 * b10 + a13 * b11 + a23 * b12 + a33 * b13;
  dst[8] = a00 * b20 + a10 * b21 + a20 * b22 + a30 * b23;
  dst[9] = a01 * b20 + a11 * b21 + a21 * b22 + a31 * b23;
  dst[10] = a02 * b20 + a12 * b21 + a22 * b22 + a32 * b23;
  dst[11] = a03 * b20 + a13 * b21 + a23 * b22 + a33 * b23;
  dst[12] = a00 * b30 + a10 * b31 + a20 * b32 + a30 * b33;
  dst[13] = a01 * b30 + a11 * b31 + a21 * b32 + a31 * b33;
  dst[14] = a02 * b30 + a12 * b31 + a22 * b32 + a32 * b33;
  dst[15] = a03 * b30 + a13 * b31 + a23 * b32 + a33 * b33;
  return dst;
}
/**
 * Multiplies two 4-by-4 matrices with a on the left and b on the right (same as multiply)
 * @param a - The matrix on the left.
 * @param b - The matrix on the right.
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns The matrix product of a and b.
 */
const mul$2 = multiply$2;
/**
 * Sets the translation component of a 4-by-4 matrix to the given
 * vector.
 * @param a - The matrix.
 * @param v - The vector.
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns The matrix with translation set.
 */
function setTranslation(a, v, dst) {
  dst = dst || identity$1();
  if (a !== dst) {
    dst[0] = a[0];
    dst[1] = a[1];
    dst[2] = a[2];
    dst[3] = a[3];
    dst[4] = a[4];
    dst[5] = a[5];
    dst[6] = a[6];
    dst[7] = a[7];
    dst[8] = a[8];
    dst[9] = a[9];
    dst[10] = a[10];
    dst[11] = a[11];
  }
  dst[12] = v[0];
  dst[13] = v[1];
  dst[14] = v[2];
  dst[15] = 1;
  return dst;
}
/**
 * Returns the translation component of a 4-by-4 matrix as a vector with 3
 * entries.
 * @param m - The matrix.
 * @param dst - vector to hold result. If not passed a new one is created.
 * @returns The translation component of m.
 */
function getTranslation(m, dst) {
  dst = dst || create$4();
  dst[0] = m[12];
  dst[1] = m[13];
  dst[2] = m[14];
  return dst;
}
/**
 * Returns an axis of a 4x4 matrix as a vector with 3 entries
 * @param m - The matrix.
 * @param axis - The axis 0 = x, 1 = y, 2 = z;
 * @returns The axis component of m.
 */
function getAxis(m, axis, dst) {
  dst = dst || create$4();
  const off = axis * 4;
  dst[0] = m[off + 0];
  dst[1] = m[off + 1];
  dst[2] = m[off + 2];
  return dst;
}
/**
 * Sets an axis of a 4x4 matrix as a vector with 3 entries
 * @param m - The matrix.
 * @param v - the axis vector
 * @param axis - The axis  0 = x, 1 = y, 2 = z;
 * @param dst - The matrix to set. If not passed a new one is created.
 * @returns The matrix with axis set.
 */
function setAxis(a, v, axis, dst) {
  if (dst !== a) {
    dst = copy$2(a, dst);
  }
  const off = axis * 4;
  dst[off + 0] = v[0];
  dst[off + 1] = v[1];
  dst[off + 2] = v[2];
  return dst;
}
/**
 * Returns the scaling component of the matrix
 * @param m - The Matrix
 * @param dst - The vector to set. If not passed a new one is created.
 */
function getScaling(m, dst) {
  dst = dst || create$4();
  const xx = m[0];
  const xy = m[1];
  const xz = m[2];
  const yx = m[4];
  const yy = m[5];
  const yz = m[6];
  const zx = m[8];
  const zy = m[9];
  const zz = m[10];
  dst[0] = Math.sqrt(xx * xx + xy * xy + xz * xz);
  dst[1] = Math.sqrt(yx * yx + yy * yy + yz * yz);
  dst[2] = Math.sqrt(zx * zx + zy * zy + zz * zz);
  return dst;
}
/**
 * Computes a 4-by-4 perspective transformation matrix given the angular height
 * of the frustum, the aspect ratio, and the near and far clipping planes.  The
 * arguments define a frustum extending in the negative z direction.  The given
 * angle is the vertical angle of the frustum, and the horizontal angle is
 * determined to produce the given aspect ratio.  The arguments near and far are
 * the distances to the near and far clipping planes.  Note that near and far
 * are not z coordinates, but rather they are distances along the negative
 * z-axis.  The matrix generated sends the viewing frustum to the unit box.
 * We assume a unit box extending from -1 to 1 in the x and y dimensions and
 * from 0 to 1 in the z dimension.
 *
 * Note: If you pass `Infinity` for zFar then it will produce a projection matrix
 * returns -Infinity for Z when transforming coordinates with Z <= 0 and +Infinity for Z
 * otherwise.
 *
 * @param fieldOfViewYInRadians - The camera angle from top to bottom (in radians).
 * @param aspect - The aspect ratio width / height.
 * @param zNear - The depth (negative z coordinate)
 *     of the near clipping plane.
 * @param zFar - The depth (negative z coordinate)
 *     of the far clipping plane.
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns The perspective matrix.
 */
function perspective(fieldOfViewYInRadians, aspect, zNear, zFar, dst) {
  dst = dst || new MatType(16);
  const f = Math.tan(Math.PI * 0.5 - 0.5 * fieldOfViewYInRadians);
  dst[0] = f / aspect;
  dst[1] = 0;
  dst[2] = 0;
  dst[3] = 0;
  dst[4] = 0;
  dst[5] = f;
  dst[6] = 0;
  dst[7] = 0;
  dst[8] = 0;
  dst[9] = 0;
  dst[11] = -1;
  dst[12] = 0;
  dst[13] = 0;
  dst[15] = 0;
  if (zFar === Infinity) {
    dst[10] = -1;
    dst[14] = -zNear;
  } else {
    const rangeInv = 1 / (zNear - zFar);
    dst[10] = zFar * rangeInv;
    dst[14] = zFar * zNear * rangeInv;
  }
  return dst;
}
/**
 * Computes a 4-by-4 orthogonal transformation matrix that transforms from
 * the given the left, right, bottom, and top dimensions to -1 +1 in x, and y
 * and 0 to +1 in z.
 * @param left - Left side of the near clipping plane viewport.
 * @param right - Right side of the near clipping plane viewport.
 * @param bottom - Bottom of the near clipping plane viewport.
 * @param top - Top of the near clipping plane viewport.
 * @param near - The depth (negative z coordinate)
 *     of the near clipping plane.
 * @param far - The depth (negative z coordinate)
 *     of the far clipping plane.
 * @param dst - Output matrix. If not passed a new one is created.
 * @returns The orthographic projection matrix.
 */
function ortho(left, right, bottom, top, near, far, dst) {
  dst = dst || new MatType(16);
  dst[0] = 2 / (right - left);
  dst[1] = 0;
  dst[2] = 0;
  dst[3] = 0;
  dst[4] = 0;
  dst[5] = 2 / (top - bottom);
  dst[6] = 0;
  dst[7] = 0;
  dst[8] = 0;
  dst[9] = 0;
  dst[10] = 1 / (near - far);
  dst[11] = 0;
  dst[12] = (right + left) / (left - right);
  dst[13] = (top + bottom) / (bottom - top);
  dst[14] = near / (near - far);
  dst[15] = 1;
  return dst;
}
/**
 * Computes a 4-by-4 perspective transformation matrix given the left, right,
 * top, bottom, near and far clipping planes. The arguments define a frustum
 * extending in the negative z direction. The arguments near and far are the
 * distances to the near and far clipping planes. Note that near and far are not
 * z coordinates, but rather they are distances along the negative z-axis. The
 * matrix generated sends the viewing frustum to the unit box. We assume a unit
 * box extending from -1 to 1 in the x and y dimensions and from 0 to 1 in the z
 * dimension.
 * @param left - The x coordinate of the left plane of the box.
 * @param right - The x coordinate of the right plane of the box.
 * @param bottom - The y coordinate of the bottom plane of the box.
 * @param top - The y coordinate of the right plane of the box.
 * @param near - The negative z coordinate of the near plane of the box.
 * @param far - The negative z coordinate of the far plane of the box.
 * @param dst - Output matrix. If not passed a new one is created.
 * @returns The perspective projection matrix.
 */
function frustum(left, right, bottom, top, near, far, dst) {
  dst = dst || new MatType(16);
  const dx = right - left;
  const dy = top - bottom;
  const dz = near - far;
  dst[0] = 2 * near / dx;
  dst[1] = 0;
  dst[2] = 0;
  dst[3] = 0;
  dst[4] = 0;
  dst[5] = 2 * near / dy;
  dst[6] = 0;
  dst[7] = 0;
  dst[8] = (left + right) / dx;
  dst[9] = (top + bottom) / dy;
  dst[10] = far / dz;
  dst[11] = -1;
  dst[12] = 0;
  dst[13] = 0;
  dst[14] = near * far / dz;
  dst[15] = 0;
  return dst;
}
let xAxis;
let yAxis;
let zAxis;
/**
 * Computes a 4-by-4 aim transformation.
 *
 * This is a matrix which positions an object aiming down positive Z.
 * toward the target.
 *
 * Note: this is **NOT** the inverse of lookAt as lookAt looks at negative Z.
 *
 * @param position - The position of the object.
 * @param target - The position meant to be aimed at.
 * @param up - A vector pointing up.
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns The aim matrix.
 */
function aim(position, target, up, dst) {
  dst = dst || new MatType(16);
  xAxis = xAxis || create$4();
  yAxis = yAxis || create$4();
  zAxis = zAxis || create$4();
  normalize$2(subtract$2(target, position, zAxis), zAxis);
  normalize$2(cross(up, zAxis, xAxis), xAxis);
  normalize$2(cross(zAxis, xAxis, yAxis), yAxis);
  dst[0] = xAxis[0];
  dst[1] = xAxis[1];
  dst[2] = xAxis[2];
  dst[3] = 0;
  dst[4] = yAxis[0];
  dst[5] = yAxis[1];
  dst[6] = yAxis[2];
  dst[7] = 0;
  dst[8] = zAxis[0];
  dst[9] = zAxis[1];
  dst[10] = zAxis[2];
  dst[11] = 0;
  dst[12] = position[0];
  dst[13] = position[1];
  dst[14] = position[2];
  dst[15] = 1;
  return dst;
}
/**
 * Computes a 4-by-4 camera aim transformation.
 *
 * This is a matrix which positions an object aiming down negative Z.
 * toward the target.
 *
 * Note: this is the inverse of `lookAt`
 *
 * @param eye - The position of the object.
 * @param target - The position meant to be aimed at.
 * @param up - A vector pointing up.
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns The aim matrix.
 */
function cameraAim(eye, target, up, dst) {
  dst = dst || new MatType(16);
  xAxis = xAxis || create$4();
  yAxis = yAxis || create$4();
  zAxis = zAxis || create$4();
  normalize$2(subtract$2(eye, target, zAxis), zAxis);
  normalize$2(cross(up, zAxis, xAxis), xAxis);
  normalize$2(cross(zAxis, xAxis, yAxis), yAxis);
  dst[0] = xAxis[0];
  dst[1] = xAxis[1];
  dst[2] = xAxis[2];
  dst[3] = 0;
  dst[4] = yAxis[0];
  dst[5] = yAxis[1];
  dst[6] = yAxis[2];
  dst[7] = 0;
  dst[8] = zAxis[0];
  dst[9] = zAxis[1];
  dst[10] = zAxis[2];
  dst[11] = 0;
  dst[12] = eye[0];
  dst[13] = eye[1];
  dst[14] = eye[2];
  dst[15] = 1;
  return dst;
}
/**
 * Computes a 4-by-4 view transformation.
 *
 * This is a view matrix which transforms all other objects
 * to be in the space of the view defined by the parameters.
 *
 * @param eye - The position of the object.
 * @param target - The position meant to be aimed at.
 * @param up - A vector pointing up.
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns The look-at matrix.
 */
function lookAt(eye, target, up, dst) {
  dst = dst || new MatType(16);
  xAxis = xAxis || create$4();
  yAxis = yAxis || create$4();
  zAxis = zAxis || create$4();
  normalize$2(subtract$2(eye, target, zAxis), zAxis);
  normalize$2(cross(up, zAxis, xAxis), xAxis);
  normalize$2(cross(zAxis, xAxis, yAxis), yAxis);
  dst[0] = xAxis[0];
  dst[1] = yAxis[0];
  dst[2] = zAxis[0];
  dst[3] = 0;
  dst[4] = xAxis[1];
  dst[5] = yAxis[1];
  dst[6] = zAxis[1];
  dst[7] = 0;
  dst[8] = xAxis[2];
  dst[9] = yAxis[2];
  dst[10] = zAxis[2];
  dst[11] = 0;
  dst[12] = -(xAxis[0] * eye[0] + xAxis[1] * eye[1] + xAxis[2] * eye[2]);
  dst[13] = -(yAxis[0] * eye[0] + yAxis[1] * eye[1] + yAxis[2] * eye[2]);
  dst[14] = -(zAxis[0] * eye[0] + zAxis[1] * eye[1] + zAxis[2] * eye[2]);
  dst[15] = 1;
  return dst;
}
/**
 * Creates a 4-by-4 matrix which translates by the given vector v.
 * @param v - The vector by
 *     which to translate.
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns The translation matrix.
 */
function translation(v, dst) {
  dst = dst || new MatType(16);
  dst[0] = 1;
  dst[1] = 0;
  dst[2] = 0;
  dst[3] = 0;
  dst[4] = 0;
  dst[5] = 1;
  dst[6] = 0;
  dst[7] = 0;
  dst[8] = 0;
  dst[9] = 0;
  dst[10] = 1;
  dst[11] = 0;
  dst[12] = v[0];
  dst[13] = v[1];
  dst[14] = v[2];
  dst[15] = 1;
  return dst;
}
/**
 * Translates the given 4-by-4 matrix by the given vector v.
 * @param m - The matrix.
 * @param v - The vector by
 *     which to translate.
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns The translated matrix.
 */
function translate(m, v, dst) {
  dst = dst || new MatType(16);
  const v0 = v[0];
  const v1 = v[1];
  const v2 = v[2];
  const m00 = m[0];
  const m01 = m[1];
  const m02 = m[2];
  const m03 = m[3];
  const m10 = m[1 * 4 + 0];
  const m11 = m[1 * 4 + 1];
  const m12 = m[1 * 4 + 2];
  const m13 = m[1 * 4 + 3];
  const m20 = m[2 * 4 + 0];
  const m21 = m[2 * 4 + 1];
  const m22 = m[2 * 4 + 2];
  const m23 = m[2 * 4 + 3];
  const m30 = m[3 * 4 + 0];
  const m31 = m[3 * 4 + 1];
  const m32 = m[3 * 4 + 2];
  const m33 = m[3 * 4 + 3];
  if (m !== dst) {
    dst[0] = m00;
    dst[1] = m01;
    dst[2] = m02;
    dst[3] = m03;
    dst[4] = m10;
    dst[5] = m11;
    dst[6] = m12;
    dst[7] = m13;
    dst[8] = m20;
    dst[9] = m21;
    dst[10] = m22;
    dst[11] = m23;
  }
  dst[12] = m00 * v0 + m10 * v1 + m20 * v2 + m30;
  dst[13] = m01 * v0 + m11 * v1 + m21 * v2 + m31;
  dst[14] = m02 * v0 + m12 * v1 + m22 * v2 + m32;
  dst[15] = m03 * v0 + m13 * v1 + m23 * v2 + m33;
  return dst;
}
/**
 * Creates a 4-by-4 matrix which rotates around the x-axis by the given angle.
 * @param angleInRadians - The angle by which to rotate (in radians).
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns The rotation matrix.
 */
function rotationX(angleInRadians, dst) {
  dst = dst || new MatType(16);
  const c = Math.cos(angleInRadians);
  const s = Math.sin(angleInRadians);
  dst[0] = 1;
  dst[1] = 0;
  dst[2] = 0;
  dst[3] = 0;
  dst[4] = 0;
  dst[5] = c;
  dst[6] = s;
  dst[7] = 0;
  dst[8] = 0;
  dst[9] = -s;
  dst[10] = c;
  dst[11] = 0;
  dst[12] = 0;
  dst[13] = 0;
  dst[14] = 0;
  dst[15] = 1;
  return dst;
}
/**
 * Rotates the given 4-by-4 matrix around the x-axis by the given
 * angle.
 * @param m - The matrix.
 * @param angleInRadians - The angle by which to rotate (in radians).
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns The rotated matrix.
 */
function rotateX$1(m, angleInRadians, dst) {
  dst = dst || new MatType(16);
  const m10 = m[4];
  const m11 = m[5];
  const m12 = m[6];
  const m13 = m[7];
  const m20 = m[8];
  const m21 = m[9];
  const m22 = m[10];
  const m23 = m[11];
  const c = Math.cos(angleInRadians);
  const s = Math.sin(angleInRadians);
  dst[4] = c * m10 + s * m20;
  dst[5] = c * m11 + s * m21;
  dst[6] = c * m12 + s * m22;
  dst[7] = c * m13 + s * m23;
  dst[8] = c * m20 - s * m10;
  dst[9] = c * m21 - s * m11;
  dst[10] = c * m22 - s * m12;
  dst[11] = c * m23 - s * m13;
  if (m !== dst) {
    dst[0] = m[0];
    dst[1] = m[1];
    dst[2] = m[2];
    dst[3] = m[3];
    dst[12] = m[12];
    dst[13] = m[13];
    dst[14] = m[14];
    dst[15] = m[15];
  }
  return dst;
}
/**
 * Creates a 4-by-4 matrix which rotates around the y-axis by the given angle.
 * @param angleInRadians - The angle by which to rotate (in radians).
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns The rotation matrix.
 */
function rotationY(angleInRadians, dst) {
  dst = dst || new MatType(16);
  const c = Math.cos(angleInRadians);
  const s = Math.sin(angleInRadians);
  dst[0] = c;
  dst[1] = 0;
  dst[2] = -s;
  dst[3] = 0;
  dst[4] = 0;
  dst[5] = 1;
  dst[6] = 0;
  dst[7] = 0;
  dst[8] = s;
  dst[9] = 0;
  dst[10] = c;
  dst[11] = 0;
  dst[12] = 0;
  dst[13] = 0;
  dst[14] = 0;
  dst[15] = 1;
  return dst;
}
/**
 * Rotates the given 4-by-4 matrix around the y-axis by the given
 * angle.
 * @param m - The matrix.
 * @param angleInRadians - The angle by which to rotate (in radians).
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns The rotated matrix.
 */
function rotateY$1(m, angleInRadians, dst) {
  dst = dst || new MatType(16);
  const m00 = m[0 * 4 + 0];
  const m01 = m[0 * 4 + 1];
  const m02 = m[0 * 4 + 2];
  const m03 = m[0 * 4 + 3];
  const m20 = m[2 * 4 + 0];
  const m21 = m[2 * 4 + 1];
  const m22 = m[2 * 4 + 2];
  const m23 = m[2 * 4 + 3];
  const c = Math.cos(angleInRadians);
  const s = Math.sin(angleInRadians);
  dst[0] = c * m00 - s * m20;
  dst[1] = c * m01 - s * m21;
  dst[2] = c * m02 - s * m22;
  dst[3] = c * m03 - s * m23;
  dst[8] = c * m20 + s * m00;
  dst[9] = c * m21 + s * m01;
  dst[10] = c * m22 + s * m02;
  dst[11] = c * m23 + s * m03;
  if (m !== dst) {
    dst[4] = m[4];
    dst[5] = m[5];
    dst[6] = m[6];
    dst[7] = m[7];
    dst[12] = m[12];
    dst[13] = m[13];
    dst[14] = m[14];
    dst[15] = m[15];
  }
  return dst;
}
/**
 * Creates a 4-by-4 matrix which rotates around the z-axis by the given angle.
 * @param angleInRadians - The angle by which to rotate (in radians).
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns The rotation matrix.
 */
function rotationZ(angleInRadians, dst) {
  dst = dst || new MatType(16);
  const c = Math.cos(angleInRadians);
  const s = Math.sin(angleInRadians);
  dst[0] = c;
  dst[1] = s;
  dst[2] = 0;
  dst[3] = 0;
  dst[4] = -s;
  dst[5] = c;
  dst[6] = 0;
  dst[7] = 0;
  dst[8] = 0;
  dst[9] = 0;
  dst[10] = 1;
  dst[11] = 0;
  dst[12] = 0;
  dst[13] = 0;
  dst[14] = 0;
  dst[15] = 1;
  return dst;
}
/**
 * Rotates the given 4-by-4 matrix around the z-axis by the given
 * angle.
 * @param m - The matrix.
 * @param angleInRadians - The angle by which to rotate (in radians).
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns The rotated matrix.
 */
function rotateZ$1(m, angleInRadians, dst) {
  dst = dst || new MatType(16);
  const m00 = m[0 * 4 + 0];
  const m01 = m[0 * 4 + 1];
  const m02 = m[0 * 4 + 2];
  const m03 = m[0 * 4 + 3];
  const m10 = m[1 * 4 + 0];
  const m11 = m[1 * 4 + 1];
  const m12 = m[1 * 4 + 2];
  const m13 = m[1 * 4 + 3];
  const c = Math.cos(angleInRadians);
  const s = Math.sin(angleInRadians);
  dst[0] = c * m00 + s * m10;
  dst[1] = c * m01 + s * m11;
  dst[2] = c * m02 + s * m12;
  dst[3] = c * m03 + s * m13;
  dst[4] = c * m10 - s * m00;
  dst[5] = c * m11 - s * m01;
  dst[6] = c * m12 - s * m02;
  dst[7] = c * m13 - s * m03;
  if (m !== dst) {
    dst[8] = m[8];
    dst[9] = m[9];
    dst[10] = m[10];
    dst[11] = m[11];
    dst[12] = m[12];
    dst[13] = m[13];
    dst[14] = m[14];
    dst[15] = m[15];
  }
  return dst;
}
/**
 * Creates a 4-by-4 matrix which rotates around the given axis by the given
 * angle.
 * @param axis - The axis
 *     about which to rotate.
 * @param angleInRadians - The angle by which to rotate (in radians).
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns A matrix which rotates angle radians
 *     around the axis.
 */
function axisRotation(axis, angleInRadians, dst) {
  dst = dst || new MatType(16);
  let x = axis[0];
  let y = axis[1];
  let z = axis[2];
  const n = Math.sqrt(x * x + y * y + z * z);
  x /= n;
  y /= n;
  z /= n;
  const xx = x * x;
  const yy = y * y;
  const zz = z * z;
  const c = Math.cos(angleInRadians);
  const s = Math.sin(angleInRadians);
  const oneMinusCosine = 1 - c;
  dst[0] = xx + (1 - xx) * c;
  dst[1] = x * y * oneMinusCosine + z * s;
  dst[2] = x * z * oneMinusCosine - y * s;
  dst[3] = 0;
  dst[4] = x * y * oneMinusCosine - z * s;
  dst[5] = yy + (1 - yy) * c;
  dst[6] = y * z * oneMinusCosine + x * s;
  dst[7] = 0;
  dst[8] = x * z * oneMinusCosine + y * s;
  dst[9] = y * z * oneMinusCosine - x * s;
  dst[10] = zz + (1 - zz) * c;
  dst[11] = 0;
  dst[12] = 0;
  dst[13] = 0;
  dst[14] = 0;
  dst[15] = 1;
  return dst;
}
/**
 * Creates a 4-by-4 matrix which rotates around the given axis by the given
 * angle. (same as axisRotation)
 * @param axis - The axis
 *     about which to rotate.
 * @param angleInRadians - The angle by which to rotate (in radians).
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns A matrix which rotates angle radians
 *     around the axis.
 */
const rotation = axisRotation;
/**
 * Rotates the given 4-by-4 matrix around the given axis by the
 * given angle.
 * @param m - The matrix.
 * @param axis - The axis
 *     about which to rotate.
 * @param angleInRadians - The angle by which to rotate (in radians).
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns The rotated matrix.
 */
function axisRotate(m, axis, angleInRadians, dst) {
  dst = dst || new MatType(16);
  let x = axis[0];
  let y = axis[1];
  let z = axis[2];
  const n = Math.sqrt(x * x + y * y + z * z);
  x /= n;
  y /= n;
  z /= n;
  const xx = x * x;
  const yy = y * y;
  const zz = z * z;
  const c = Math.cos(angleInRadians);
  const s = Math.sin(angleInRadians);
  const oneMinusCosine = 1 - c;
  const r00 = xx + (1 - xx) * c;
  const r01 = x * y * oneMinusCosine + z * s;
  const r02 = x * z * oneMinusCosine - y * s;
  const r10 = x * y * oneMinusCosine - z * s;
  const r11 = yy + (1 - yy) * c;
  const r12 = y * z * oneMinusCosine + x * s;
  const r20 = x * z * oneMinusCosine + y * s;
  const r21 = y * z * oneMinusCosine - x * s;
  const r22 = zz + (1 - zz) * c;
  const m00 = m[0];
  const m01 = m[1];
  const m02 = m[2];
  const m03 = m[3];
  const m10 = m[4];
  const m11 = m[5];
  const m12 = m[6];
  const m13 = m[7];
  const m20 = m[8];
  const m21 = m[9];
  const m22 = m[10];
  const m23 = m[11];
  dst[0] = r00 * m00 + r01 * m10 + r02 * m20;
  dst[1] = r00 * m01 + r01 * m11 + r02 * m21;
  dst[2] = r00 * m02 + r01 * m12 + r02 * m22;
  dst[3] = r00 * m03 + r01 * m13 + r02 * m23;
  dst[4] = r10 * m00 + r11 * m10 + r12 * m20;
  dst[5] = r10 * m01 + r11 * m11 + r12 * m21;
  dst[6] = r10 * m02 + r11 * m12 + r12 * m22;
  dst[7] = r10 * m03 + r11 * m13 + r12 * m23;
  dst[8] = r20 * m00 + r21 * m10 + r22 * m20;
  dst[9] = r20 * m01 + r21 * m11 + r22 * m21;
  dst[10] = r20 * m02 + r21 * m12 + r22 * m22;
  dst[11] = r20 * m03 + r21 * m13 + r22 * m23;
  if (m !== dst) {
    dst[12] = m[12];
    dst[13] = m[13];
    dst[14] = m[14];
    dst[15] = m[15];
  }
  return dst;
}
/**
 * Rotates the given 4-by-4 matrix around the given axis by the
 * given angle. (same as rotate)
 * @param m - The matrix.
 * @param axis - The axis
 *     about which to rotate.
 * @param angleInRadians - The angle by which to rotate (in radians).
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns The rotated matrix.
 */
const rotate = axisRotate;
/**
 * Creates a 4-by-4 matrix which scales in each dimension by an amount given by
 * the corresponding entry in the given vector; assumes the vector has three
 * entries.
 * @param v - A vector of
 *     three entries specifying the factor by which to scale in each dimension.
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns The scaling matrix.
 */
function scaling(v, dst) {
  dst = dst || new MatType(16);
  dst[0] = v[0];
  dst[1] = 0;
  dst[2] = 0;
  dst[3] = 0;
  dst[4] = 0;
  dst[5] = v[1];
  dst[6] = 0;
  dst[7] = 0;
  dst[8] = 0;
  dst[9] = 0;
  dst[10] = v[2];
  dst[11] = 0;
  dst[12] = 0;
  dst[13] = 0;
  dst[14] = 0;
  dst[15] = 1;
  return dst;
}
/**
 * Scales the given 4-by-4 matrix in each dimension by an amount
 * given by the corresponding entry in the given vector; assumes the vector has
 * three entries.
 * @param m - The matrix to be modified.
 * @param v - A vector of three entries specifying the
 *     factor by which to scale in each dimension.
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns The scaled matrix.
 */
function scale$2(m, v, dst) {
  dst = dst || new MatType(16);
  const v0 = v[0];
  const v1 = v[1];
  const v2 = v[2];
  dst[0] = v0 * m[0 * 4 + 0];
  dst[1] = v0 * m[0 * 4 + 1];
  dst[2] = v0 * m[0 * 4 + 2];
  dst[3] = v0 * m[0 * 4 + 3];
  dst[4] = v1 * m[1 * 4 + 0];
  dst[5] = v1 * m[1 * 4 + 1];
  dst[6] = v1 * m[1 * 4 + 2];
  dst[7] = v1 * m[1 * 4 + 3];
  dst[8] = v2 * m[2 * 4 + 0];
  dst[9] = v2 * m[2 * 4 + 1];
  dst[10] = v2 * m[2 * 4 + 2];
  dst[11] = v2 * m[2 * 4 + 3];
  if (m !== dst) {
    dst[12] = m[12];
    dst[13] = m[13];
    dst[14] = m[14];
    dst[15] = m[15];
  }
  return dst;
}
/**
 * Creates a 4-by-4 matrix which scales a uniform amount in each dimension.
 * @param s - the amount to scale
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns The scaling matrix.
 */
function uniformScaling(s, dst) {
  dst = dst || new MatType(16);
  dst[0] = s;
  dst[1] = 0;
  dst[2] = 0;
  dst[3] = 0;
  dst[4] = 0;
  dst[5] = s;
  dst[6] = 0;
  dst[7] = 0;
  dst[8] = 0;
  dst[9] = 0;
  dst[10] = s;
  dst[11] = 0;
  dst[12] = 0;
  dst[13] = 0;
  dst[14] = 0;
  dst[15] = 1;
  return dst;
}
/**
 * Scales the given 4-by-4 matrix in each dimension by a uniform scale.
 * @param m - The matrix to be modified.
 * @param s - The amount to scale.
 * @param dst - matrix to hold result. If not passed a new one is created.
 * @returns The scaled matrix.
 */
function uniformScale(m, s, dst) {
  dst = dst || new MatType(16);
  dst[0] = s * m[0 * 4 + 0];
  dst[1] = s * m[0 * 4 + 1];
  dst[2] = s * m[0 * 4 + 2];
  dst[3] = s * m[0 * 4 + 3];
  dst[4] = s * m[1 * 4 + 0];
  dst[5] = s * m[1 * 4 + 1];
  dst[6] = s * m[1 * 4 + 2];
  dst[7] = s * m[1 * 4 + 3];
  dst[8] = s * m[2 * 4 + 0];
  dst[9] = s * m[2 * 4 + 1];
  dst[10] = s * m[2 * 4 + 2];
  dst[11] = s * m[2 * 4 + 3];
  if (m !== dst) {
    dst[12] = m[12];
    dst[13] = m[13];
    dst[14] = m[14];
    dst[15] = m[15];
  }
  return dst;
}
var mat4Impl = exports.mat4 = /*#__PURE__*/Object.freeze({
  __proto__: null,
  setDefaultType: setDefaultType$3,
  create: create$2,
  set: set$2,
  fromMat3: fromMat3,
  fromQuat: fromQuat,
  negate: negate$1,
  copy: copy$2,
  clone: clone$2,
  equalsApproximately: equalsApproximately$2,
  equals: equals$2,
  identity: identity$1,
  transpose: transpose,
  inverse: inverse$2,
  determinant: determinant,
  invert: invert$1,
  multiply: multiply$2,
  mul: mul$2,
  setTranslation: setTranslation,
  getTranslation: getTranslation,
  getAxis: getAxis,
  setAxis: setAxis,
  getScaling: getScaling,
  perspective: perspective,
  ortho: ortho,
  frustum: frustum,
  aim: aim,
  cameraAim: cameraAim,
  lookAt: lookAt,
  translation: translation,
  translate: translate,
  rotationX: rotationX,
  rotateX: rotateX$1,
  rotationY: rotationY,
  rotateY: rotateY$1,
  rotationZ: rotationZ,
  rotateZ: rotateZ$1,
  axisRotation: axisRotation,
  rotation: rotation,
  axisRotate: axisRotate,
  rotate: rotate,
  scaling: scaling,
  scale: scale$2,
  uniformScaling: uniformScaling,
  uniformScale: uniformScale
});

/*
 * Copyright 2022 Gregg Tavares
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.  IN NO EVENT SHALL
 * THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 */
/**
 *
 * Quat4 math functions.
 *
 * Almost all functions take an optional `dst` argument. If it is not passed in the
 * functions will create a new `Quat4`. In other words you can do this
 *
 *     const v = quat4.cross(v1, v2);  // Creates a new Quat4 with the cross product of v1 x v2.
 *
 * or
 *
 *     const v = quat4.create();
 *     quat4.cross(v1, v2, v);  // Puts the cross product of v1 x v2 in v
 *
 * The first style is often easier but depending on where it's used it generates garbage where
 * as there is almost never allocation with the second style.
 *
 * It is always safe to pass any vector as the destination. So for example
 *
 *     quat4.cross(v1, v2, v1);  // Puts the cross product of v1 x v2 in v1
 *
 */
let QuatType = Float32Array;
/**
 * Sets the type this library creates for a Quat4
 * @param ctor - the constructor for the type. Either `Float32Array`, `Float64Array`, or `Array`
 * @returns previous constructor for Quat4
 */
function setDefaultType$2(ctor) {
  const oldType = QuatType;
  QuatType = ctor;
  return oldType;
}
/**
 * Creates a quat4; may be called with x, y, z to set initial values.
 * @param x - Initial x value.
 * @param y - Initial y value.
 * @param z - Initial z value.
 * @param w - Initial w value.
 * @returns the created vector
 */
function create$1(x, y, z, w) {
  const dst = new QuatType(4);
  if (x !== undefined) {
    dst[0] = x;
    if (y !== undefined) {
      dst[1] = y;
      if (z !== undefined) {
        dst[2] = z;
        if (w !== undefined) {
          dst[3] = w;
        }
      }
    }
  }
  return dst;
}

/*
 * Copyright 2022 Gregg Tavares
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.  IN NO EVENT SHALL
 * THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 */
/**
 * Creates a Quat; may be called with x, y, z to set initial values. (same as create)
 * @param x - Initial x value.
 * @param y - Initial y value.
 * @param z - Initial z value.
 * @param z - Initial w value.
 * @returns the created vector
 */
const fromValues$1 = create$1;
/**
 * Sets the values of a Quat
 * Also see {@link quat.create} and {@link quat.copy}
 *
 * @param x first value
 * @param y second value
 * @param z third value
 * @param w fourth value
 * @param dst - vector to hold result. If not passed in a new one is created.
 * @returns A vector with its elements set.
 */
function set$1(x, y, z, w, dst) {
  dst = dst || new QuatType(4);
  dst[0] = x;
  dst[1] = y;
  dst[2] = z;
  dst[3] = w;
  return dst;
}
/**
 * Sets a quaternion from the given angle and  axis,
 * then returns it.
 *
 * @param axis - the axis to rotate around
 * @param angleInRadians - the angle
 * @param dst - quaternion to hold result. If not passed in a new one is created.
 * @returns The quaternion that represents the given axis and angle
 **/
function fromAxisAngle(axis, angleInRadians, dst) {
  dst = dst || new QuatType(4);
  const halfAngle = angleInRadians * 0.5;
  const s = Math.sin(halfAngle);
  dst[0] = s * axis[0];
  dst[1] = s * axis[1];
  dst[2] = s * axis[2];
  dst[3] = Math.cos(halfAngle);
  return dst;
}
/**
 * Gets the rotation axis and angle
 * @param q - quaternion to compute from
 * @param dst - Vec3 to hold result. If not passed in a new one is created.
 * @return angle and axis
 */
function toAxisAngle(q, dst) {
  dst = dst || create$4(4);
  const angle = Math.acos(q[3]) * 2;
  const s = Math.sin(angle * 0.5);
  if (s > EPSILON) {
    dst[0] = q[0] / s;
    dst[1] = q[1] / s;
    dst[2] = q[2] / s;
  } else {
    dst[0] = 1;
    dst[1] = 0;
    dst[2] = 0;
  }
  return {
    angle,
    axis: dst
  };
}
/**
 * Returns the angle in degrees between two rotations a and b.
 * @param a - quaternion a
 * @param b - quaternion b
 * @return angle in radians between the two quaternions
 */
function angle(a, b) {
  const d = dot$1(a, b);
  return Math.acos(2 * d * d - 1);
}
/**
 * Multiplies two quaternions
 *
 * @param a - the first quaternion
 * @param b - the second quaternion
 * @param dst - quaternion to hold result. If not passed in a new one is created.
 * @returns A quaternion that is the result of a * b
 */
function multiply$1(a, b, dst) {
  dst = dst || new QuatType(4);
  const ax = a[0];
  const ay = a[1];
  const az = a[2];
  const aw = a[3];
  const bx = b[0];
  const by = b[1];
  const bz = b[2];
  const bw = b[3];
  dst[0] = ax * bw + aw * bx + ay * bz - az * by;
  dst[1] = ay * bw + aw * by + az * bx - ax * bz;
  dst[2] = az * bw + aw * bz + ax * by - ay * bx;
  dst[3] = aw * bw - ax * bx - ay * by - az * bz;
  return dst;
}
/**
 * Multiplies two quaternions
 *
 * @param a - the first quaternion
 * @param b - the second quaternion
 * @param dst - quaternion to hold result. If not passed in a new one is created.
 * @returns A quaternion that is the result of a * b
 */
const mul$1 = multiply$1;
/**
 * Rotates the given quaternion around the X axis by the given angle.
 * @param q - quaternion to rotate
 * @param angleInRadians - The angle by which to rotate
 * @param dst - quaternion to hold result. If not passed in a new one is created.
 * @returns A quaternion that is the result of a * b
 */
function rotateX(q, angleInRadians, dst) {
  dst = dst || new QuatType(4);
  const halfAngle = angleInRadians * 0.5;
  const qx = q[0];
  const qy = q[1];
  const qz = q[2];
  const qw = q[3];
  const bx = Math.sin(halfAngle);
  const bw = Math.cos(halfAngle);
  dst[0] = qx * bw + qw * bx;
  dst[1] = qy * bw + qz * bx;
  dst[2] = qz * bw - qy * bx;
  dst[3] = qw * bw - qx * bx;
  return dst;
}
/**
 * Rotates the given quaternion around the Y axis by the given angle.
 * @param q - quaternion to rotate
 * @param angleInRadians - The angle by which to rotate
 * @param dst - quaternion to hold result. If not passed in a new one is created.
 * @returns A quaternion that is the result of a * b
 */
function rotateY(q, angleInRadians, dst) {
  dst = dst || new QuatType(4);
  const halfAngle = angleInRadians * 0.5;
  const qx = q[0];
  const qy = q[1];
  const qz = q[2];
  const qw = q[3];
  const by = Math.sin(halfAngle);
  const bw = Math.cos(halfAngle);
  dst[0] = qx * bw - qz * by;
  dst[1] = qy * bw + qw * by;
  dst[2] = qz * bw + qx * by;
  dst[3] = qw * bw - qy * by;
  return dst;
}
/**
 * Rotates the given quaternion around the Z axis by the given angle.
 * @param q - quaternion to rotate
 * @param angleInRadians - The angle by which to rotate
 * @param dst - quaternion to hold result. If not passed in a new one is created.
 * @returns A quaternion that is the result of a * b
 */
function rotateZ(q, angleInRadians, dst) {
  dst = dst || new QuatType(4);
  const halfAngle = angleInRadians * 0.5;
  const qx = q[0];
  const qy = q[1];
  const qz = q[2];
  const qw = q[3];
  const bz = Math.sin(halfAngle);
  const bw = Math.cos(halfAngle);
  dst[0] = qx * bw + qy * bz;
  dst[1] = qy * bw - qx * bz;
  dst[2] = qz * bw + qw * bz;
  dst[3] = qw * bw - qz * bz;
  return dst;
}
/**
 * Spherically linear interpolate between two quaternions
 *
 * @param a - starting value
 * @param b - ending value
 * @param t - value where 0 = a and 1 = b
 * @param dst - quaternion to hold result. If not passed in a new one is created.
 * @returns A quaternion that is the result of a * b
 */
function slerp(a, b, t, dst) {
  dst = dst || new QuatType(4);
  const ax = a[0];
  const ay = a[1];
  const az = a[2];
  const aw = a[3];
  let bx = b[0];
  let by = b[1];
  let bz = b[2];
  let bw = b[3];
  let cosOmega = ax * bx + ay * by + az * bz + aw * bw;
  if (cosOmega < 0) {
    cosOmega = -cosOmega;
    bx = -bx;
    by = -by;
    bz = -bz;
    bw = -bw;
  }
  let scale0;
  let scale1;
  if (1.0 - cosOmega > EPSILON) {
    const omega = Math.acos(cosOmega);
    const sinOmega = Math.sin(omega);
    scale0 = Math.sin((1 - t) * omega) / sinOmega;
    scale1 = Math.sin(t * omega) / sinOmega;
  } else {
    scale0 = 1.0 - t;
    scale1 = t;
  }
  dst[0] = scale0 * ax + scale1 * bx;
  dst[1] = scale0 * ay + scale1 * by;
  dst[2] = scale0 * az + scale1 * bz;
  dst[3] = scale0 * aw + scale1 * bw;
  return dst;
}
/**
 * Compute the inverse of a quaternion
 *
 * @param q - quaternion to compute the inverse of
 * @returns A quaternion that is the result of a * b
 */
function inverse$1(q, dst) {
  dst = dst || new QuatType(4);
  const a0 = q[0];
  const a1 = q[1];
  const a2 = q[2];
  const a3 = q[3];
  const dot = a0 * a0 + a1 * a1 + a2 * a2 + a3 * a3;
  const invDot = dot ? 1 / dot : 0;
  dst[0] = -a0 * invDot;
  dst[1] = -a1 * invDot;
  dst[2] = -a2 * invDot;
  dst[3] = a3 * invDot;
  return dst;
}
/**
 * Compute the conjugate of a quaternion
 * For quaternions with a magnitude of 1 (a unit quaternion)
 * this returns the same as the inverse but is faster to calculate.
 *
 * @param q - quaternion to compute the conjugate of.
 * @param dst - quaternion to hold result. If not passed in a new one is created.
 * @returns The conjugate of q
 */
function conjugate(q, dst) {
  dst = dst || new QuatType(4);
  dst[0] = -q[0];
  dst[1] = -q[1];
  dst[2] = -q[2];
  dst[3] = q[3];
  return dst;
}
/**
 * Creates a quaternion from the given rotation matrix.
 *
 * The created quaternion is not normalized.
 *
 * @param m - rotation matrix
 * @param dst - quaternion to hold result. If not passed in a new one is created.
 * @returns the result
 */
function fromMat(m, dst) {
  dst = dst || new QuatType(4);
  /*
  0 1 2
  3 4 5
  6 7 8
     0 1 2
  4 5 6
  8 9 10
   */
  // Algorithm in Ken Shoemake's article in 1987 SIGGRAPH course notes
  // article "Quaternion Calculus and Fast Animation".
  const trace = m[0] + m[5] + m[10];
  if (trace > 0.0) {
    // |w| > 1/2, may as well choose w > 1/2
    const root = Math.sqrt(trace + 1); // 2w
    dst[3] = 0.5 * root;
    const invRoot = 0.5 / root; // 1/(4w)
    dst[0] = (m[6] - m[9]) * invRoot;
    dst[1] = (m[8] - m[2]) * invRoot;
    dst[2] = (m[1] - m[4]) * invRoot;
  } else {
    // |w| <= 1/2
    let i = 0;
    if (m[5] > m[0]) {
      i = 1;
    }
    if (m[10] > m[i * 4 + i]) {
      i = 2;
    }
    const j = (i + 1) % 3;
    const k = (i + 2) % 3;
    const root = Math.sqrt(m[i * 4 + i] - m[j * 4 + j] - m[k * 4 + k] + 1.0);
    dst[i] = 0.5 * root;
    const invRoot = 0.5 / root;
    dst[3] = (m[j * 4 + k] - m[k * 4 + j]) * invRoot;
    dst[j] = (m[j * 4 + i] + m[i * 4 + j]) * invRoot;
    dst[k] = (m[k * 4 + i] + m[i * 4 + k]) * invRoot;
  }
  return dst;
}
/**
 * Creates a quaternion from the given euler angle x, y, z using the provided intrinsic order for the conversion.
 *
 * @param xAngleInRadians - angle to rotate around X axis in radians.
 * @param yAngleInRadians - angle to rotate around Y axis in radians.
 * @param zAngleInRadians - angle to rotate around Z axis in radians.
 * @param order - order to apply euler angles
 * @param dst - quaternion to hold result. If not passed in a new one is created.
 * @returns A quaternion representing the same rotation as the euler angles applied in the given order
 */
function fromEuler(xAngleInRadians, yAngleInRadians, zAngleInRadians, order, dst) {
  dst = dst || new QuatType(4);
  const xHalfAngle = xAngleInRadians * 0.5;
  const yHalfAngle = yAngleInRadians * 0.5;
  const zHalfAngle = zAngleInRadians * 0.5;
  const sx = Math.sin(xHalfAngle);
  const cx = Math.cos(xHalfAngle);
  const sy = Math.sin(yHalfAngle);
  const cy = Math.cos(yHalfAngle);
  const sz = Math.sin(zHalfAngle);
  const cz = Math.cos(zHalfAngle);
  switch (order) {
    case 'xyz':
      dst[0] = sx * cy * cz + cx * sy * sz;
      dst[1] = cx * sy * cz - sx * cy * sz;
      dst[2] = cx * cy * sz + sx * sy * cz;
      dst[3] = cx * cy * cz - sx * sy * sz;
      break;
    case 'xzy':
      dst[0] = sx * cy * cz - cx * sy * sz;
      dst[1] = cx * sy * cz - sx * cy * sz;
      dst[2] = cx * cy * sz + sx * sy * cz;
      dst[3] = cx * cy * cz + sx * sy * sz;
      break;
    case 'yxz':
      dst[0] = sx * cy * cz + cx * sy * sz;
      dst[1] = cx * sy * cz - sx * cy * sz;
      dst[2] = cx * cy * sz - sx * sy * cz;
      dst[3] = cx * cy * cz + sx * sy * sz;
      break;
    case 'yzx':
      dst[0] = sx * cy * cz + cx * sy * sz;
      dst[1] = cx * sy * cz + sx * cy * sz;
      dst[2] = cx * cy * sz - sx * sy * cz;
      dst[3] = cx * cy * cz - sx * sy * sz;
      break;
    case 'zxy':
      dst[0] = sx * cy * cz - cx * sy * sz;
      dst[1] = cx * sy * cz + sx * cy * sz;
      dst[2] = cx * cy * sz + sx * sy * cz;
      dst[3] = cx * cy * cz - sx * sy * sz;
      break;
    case 'zyx':
      dst[0] = sx * cy * cz - cx * sy * sz;
      dst[1] = cx * sy * cz + sx * cy * sz;
      dst[2] = cx * cy * sz - sx * sy * cz;
      dst[3] = cx * cy * cz + sx * sy * sz;
      break;
    default:
      throw new Error(`Unknown rotation order: ${order}`);
  }
  return dst;
}
/**
 * Copies a quaternion. (same as {@link quat.clone})
 * Also see {@link quat.create} and {@link quat.set}
 * @param q - The quaternion.
 * @param dst - quaternion to hold result. If not passed in a new one is created.
 * @returns A quaternion that is a copy of q
 */
function copy$1(q, dst) {
  dst = dst || new QuatType(4);
  dst[0] = q[0];
  dst[1] = q[1];
  dst[2] = q[2];
  dst[3] = q[3];
  return dst;
}
/**
 * Clones a quaternion. (same as {@link quat.copy})
 * Also see {@link quat.create} and {@link quat.set}
 * @param q - The quaternion.
 * @param dst - quaternion to hold result. If not passed in a new one is created.
 * @returns A copy of q.
 */
const clone$1 = copy$1;
/**
 * Adds two quaternions; assumes a and b have the same dimension.
 * @param a - Operand quaternion.
 * @param b - Operand quaternion.
 * @param dst - quaternion to hold result. If not passed in a new one is created.
 * @returns A quaternion that is the sum of a and b.
 */
function add$1(a, b, dst) {
  dst = dst || new QuatType(4);
  dst[0] = a[0] + b[0];
  dst[1] = a[1] + b[1];
  dst[2] = a[2] + b[2];
  dst[3] = a[3] + b[3];
  return dst;
}
/**
 * Subtracts two quaternions.
 * @param a - Operand quaternion.
 * @param b - Operand quaternion.
 * @param dst - quaternion to hold result. If not passed in a new one is created.
 * @returns A quaternion that is the difference of a and b.
 */
function subtract$1(a, b, dst) {
  dst = dst || new QuatType(4);
  dst[0] = a[0] - b[0];
  dst[1] = a[1] - b[1];
  dst[2] = a[2] - b[2];
  dst[3] = a[3] - b[3];
  return dst;
}
/**
 * Subtracts two quaternions.
 * @param a - Operand quaternion.
 * @param b - Operand quaternion.
 * @param dst - quaternion to hold result. If not passed in a new one is created.
 * @returns A quaternion that is the difference of a and b.
 */
const sub$1 = subtract$1;
/**
 * Multiplies a quaternion by a scalar.
 * @param v - The quaternion.
 * @param k - The scalar.
 * @param dst - quaternion to hold result. If not passed in a new one is created.
 * @returns The scaled quaternion.
 */
function mulScalar$1(v, k, dst) {
  dst = dst || new QuatType(4);
  dst[0] = v[0] * k;
  dst[1] = v[1] * k;
  dst[2] = v[2] * k;
  dst[3] = v[3] * k;
  return dst;
}
/**
 * Multiplies a quaternion by a scalar. (same as mulScalar)
 * @param v - The quaternion.
 * @param k - The scalar.
 * @param dst - quaternion to hold result. If not passed in a new one is created.
 * @returns The scaled quaternion.
 */
const scale$1 = mulScalar$1;
/**
 * Divides a vector by a scalar.
 * @param v - The vector.
 * @param k - The scalar.
 * @param dst - quaternion to hold result. If not passed in a new one is created.
 * @returns The scaled quaternion.
 */
function divScalar$1(v, k, dst) {
  dst = dst || new QuatType(4);
  dst[0] = v[0] / k;
  dst[1] = v[1] / k;
  dst[2] = v[2] / k;
  dst[3] = v[3] / k;
  return dst;
}
/**
 * Computes the dot product of two quaternions
 * @param a - Operand quaternion.
 * @param b - Operand quaternion.
 * @returns dot product
 */
function dot$1(a, b) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];
}
/**
 * Performs linear interpolation on two quaternions.
 * Given quaternions a and b and interpolation coefficient t, returns
 * a + t * (b - a).
 * @param a - Operand quaternion.
 * @param b - Operand quaternion.
 * @param t - Interpolation coefficient.
 * @param dst - quaternion to hold result. If not passed in a new one is created.
 * @returns The linear interpolated result.
 */
function lerp$1(a, b, t, dst) {
  dst = dst || new QuatType(4);
  dst[0] = a[0] + t * (b[0] - a[0]);
  dst[1] = a[1] + t * (b[1] - a[1]);
  dst[2] = a[2] + t * (b[2] - a[2]);
  dst[3] = a[3] + t * (b[3] - a[3]);
  return dst;
}
/**
 * Computes the length of quaternion
 * @param v - quaternion.
 * @returns length of quaternion.
 */
function length$1(v) {
  const v0 = v[0];
  const v1 = v[1];
  const v2 = v[2];
  const v3 = v[3];
  return Math.sqrt(v0 * v0 + v1 * v1 + v2 * v2 + v3 * v3);
}
/**
 * Computes the length of quaternion (same as length)
 * @param v - quaternion.
 * @returns length of quaternion.
 */
const len$1 = length$1;
/**
 * Computes the square of the length of quaternion
 * @param v - quaternion.
 * @returns square of the length of quaternion.
 */
function lengthSq$1(v) {
  const v0 = v[0];
  const v1 = v[1];
  const v2 = v[2];
  const v3 = v[3];
  return v0 * v0 + v1 * v1 + v2 * v2 + v3 * v3;
}
/**
 * Computes the square of the length of quaternion (same as lengthSq)
 * @param v - quaternion.
 * @returns square of the length of quaternion.
 */
const lenSq$1 = lengthSq$1;
/**
 * Divides a quaternion by its Euclidean length and returns the quotient.
 * @param v - The quaternion.
 * @param dst - quaternion to hold result. If not passed in a new one is created.
 * @returns The normalized quaternion.
 */
function normalize$1(v, dst) {
  dst = dst || new QuatType(4);
  const v0 = v[0];
  const v1 = v[1];
  const v2 = v[2];
  const v3 = v[3];
  const len = Math.sqrt(v0 * v0 + v1 * v1 + v2 * v2 + v3 * v3);
  if (len > 0.00001) {
    dst[0] = v0 / len;
    dst[1] = v1 / len;
    dst[2] = v2 / len;
    dst[3] = v3 / len;
  } else {
    dst[0] = 0;
    dst[1] = 0;
    dst[2] = 0;
    dst[3] = 0;
  }
  return dst;
}
/**
 * Check if 2 quaternions are approximately equal
 * @param a - Operand quaternion.
 * @param b - Operand quaternion.
 * @returns true if quaternions are approximately equal
 */
function equalsApproximately$1(a, b) {
  return Math.abs(a[0] - b[0]) < EPSILON && Math.abs(a[1] - b[1]) < EPSILON && Math.abs(a[2] - b[2]) < EPSILON && Math.abs(a[3] - b[3]) < EPSILON;
}
/**
 * Check if 2 quaternions are exactly equal
 * @param a - Operand quaternion.
 * @param b - Operand quaternion.
 * @returns true if quaternions are exactly equal
 */
function equals$1(a, b) {
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3];
}
/**
 * Creates an identity quaternion
 * @param dst - quaternion to hold result. If not passed in a new one is created.
 * @returns an identity quaternion
 */
function identity(dst) {
  dst = dst || new QuatType(4);
  dst[0] = 0;
  dst[1] = 0;
  dst[2] = 0;
  dst[3] = 1;
  return dst;
}
let tempVec3;
let xUnitVec3;
let yUnitVec3;
/**
 * Computes a quaternion to represent the shortest rotation from one vector to another.
 *
 * @param aUnit - the start vector
 * @param bUnit - the end vector
 * @param dst - quaternion to hold result. If not passed in a new one is created.
 * @returns the result
 */
function rotationTo(aUnit, bUnit, dst) {
  dst = dst || new QuatType(4);
  tempVec3 = tempVec3 || create$4();
  xUnitVec3 = xUnitVec3 || create$4(1, 0, 0);
  yUnitVec3 = yUnitVec3 || create$4(0, 1, 0);
  const dot = dot$2(aUnit, bUnit);
  if (dot < -0.999999) {
    cross(xUnitVec3, aUnit, tempVec3);
    if (len$2(tempVec3) < 0.000001) {
      cross(yUnitVec3, aUnit, tempVec3);
    }
    normalize$2(tempVec3, tempVec3);
    fromAxisAngle(tempVec3, Math.PI, dst);
    return dst;
  } else if (dot > 0.999999) {
    dst[0] = 0;
    dst[1] = 0;
    dst[2] = 0;
    dst[3] = 1;
    return dst;
  } else {
    cross(aUnit, bUnit, tempVec3);
    dst[0] = tempVec3[0];
    dst[1] = tempVec3[1];
    dst[2] = tempVec3[2];
    dst[3] = 1 + dot;
    return normalize$1(dst, dst);
  }
}
let tempQuat1;
let tempQuat2;
/**
 * Performs a spherical linear interpolation with two control points
 *
 * @param a - the first quaternion
 * @param b - the second quaternion
 * @param c - the third quaternion
 * @param d - the fourth quaternion
 * @param t - Interpolation coefficient 0 to 1
 * @returns result
 */
function sqlerp(a, b, c, d, t, dst) {
  dst = dst || new QuatType(4);
  tempQuat1 = tempQuat1 || new QuatType(4);
  tempQuat2 = tempQuat2 || new QuatType(4);
  slerp(a, d, t, tempQuat1);
  slerp(b, c, t, tempQuat2);
  slerp(tempQuat1, tempQuat2, 2 * t * (1 - t), dst);
  return dst;
}
var quatImpl = exports.quat = /*#__PURE__*/Object.freeze({
  __proto__: null,
  create: create$1,
  setDefaultType: setDefaultType$2,
  fromValues: fromValues$1,
  set: set$1,
  fromAxisAngle: fromAxisAngle,
  toAxisAngle: toAxisAngle,
  angle: angle,
  multiply: multiply$1,
  mul: mul$1,
  rotateX: rotateX,
  rotateY: rotateY,
  rotateZ: rotateZ,
  slerp: slerp,
  inverse: inverse$1,
  conjugate: conjugate,
  fromMat: fromMat,
  fromEuler: fromEuler,
  copy: copy$1,
  clone: clone$1,
  add: add$1,
  subtract: subtract$1,
  sub: sub$1,
  mulScalar: mulScalar$1,
  scale: scale$1,
  divScalar: divScalar$1,
  dot: dot$1,
  lerp: lerp$1,
  length: length$1,
  len: len$1,
  lengthSq: lengthSq$1,
  lenSq: lenSq$1,
  normalize: normalize$1,
  equalsApproximately: equalsApproximately$1,
  equals: equals$1,
  identity: identity,
  rotationTo: rotationTo,
  sqlerp: sqlerp
});

/*
 * Copyright 2022 Gregg Tavares
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.  IN NO EVENT SHALL
 * THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 */
/**
 *
 * Vec4 math functions.
 *
 * Almost all functions take an optional `dst` argument. If it is not passed in the
 * functions will create a new `Vec4`. In other words you can do this
 *
 *     const v = vec4.cross(v1, v2);  // Creates a new Vec4 with the cross product of v1 x v2.
 *
 * or
 *
 *     const v = vec4.create();
 *     vec4.cross(v1, v2, v);  // Puts the cross product of v1 x v2 in v
 *
 * The first style is often easier but depending on where it's used it generates garbage where
 * as there is almost never allocation with the second style.
 *
 * It is always safe to pass any vector as the destination. So for example
 *
 *     vec4.cross(v1, v2, v1);  // Puts the cross product of v1 x v2 in v1
 *
 */
let VecType = Float32Array;
/**
 * Sets the type this library creates for a Vec4
 * @param ctor - the constructor for the type. Either `Float32Array`, `Float64Array`, or `Array`
 * @returns previous constructor for Vec4
 */
function setDefaultType$1(ctor) {
  const oldType = VecType;
  VecType = ctor;
  return oldType;
}
/**
 * Creates a vec4; may be called with x, y, z to set initial values.
 * @param x - Initial x value.
 * @param y - Initial y value.
 * @param z - Initial z value.
 * @param w - Initial w value.
 * @returns the created vector
 */
function create(x, y, z, w) {
  const dst = new VecType(4);
  if (x !== undefined) {
    dst[0] = x;
    if (y !== undefined) {
      dst[1] = y;
      if (z !== undefined) {
        dst[2] = z;
        if (w !== undefined) {
          dst[3] = w;
        }
      }
    }
  }
  return dst;
}

/*
 * Copyright 2022 Gregg Tavares
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.  IN NO EVENT SHALL
 * THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 */
/**
 * Creates a vec4; may be called with x, y, z to set initial values. (same as create)
 * @param x - Initial x value.
 * @param y - Initial y value.
 * @param z - Initial z value.
 * @param z - Initial w value.
 * @returns the created vector
 */
const fromValues = create;
/**
 * Sets the values of a Vec4
 * Also see {@link vec4.create} and {@link vec4.copy}
 *
 * @param x first value
 * @param y second value
 * @param z third value
 * @param w fourth value
 * @param dst - vector to hold result. If not passed in a new one is created.
 * @returns A vector with its elements set.
 */
function set(x, y, z, w, dst) {
  dst = dst || new VecType(4);
  dst[0] = x;
  dst[1] = y;
  dst[2] = z;
  dst[3] = w;
  return dst;
}
/**
 * Applies Math.ceil to each element of vector
 * @param v - Operand vector.
 * @param dst - vector to hold result. If not passed in a new one is created.
 * @returns A vector that is the ceil of each element of v.
 */
function ceil(v, dst) {
  dst = dst || new VecType(4);
  dst[0] = Math.ceil(v[0]);
  dst[1] = Math.ceil(v[1]);
  dst[2] = Math.ceil(v[2]);
  dst[3] = Math.ceil(v[3]);
  return dst;
}
/**
 * Applies Math.floor to each element of vector
 * @param v - Operand vector.
 * @param dst - vector to hold result. If not passed in a new one is created.
 * @returns A vector that is the floor of each element of v.
 */
function floor(v, dst) {
  dst = dst || new VecType(4);
  dst[0] = Math.floor(v[0]);
  dst[1] = Math.floor(v[1]);
  dst[2] = Math.floor(v[2]);
  dst[3] = Math.floor(v[3]);
  return dst;
}
/**
 * Applies Math.round to each element of vector
 * @param v - Operand vector.
 * @param dst - vector to hold result. If not passed in a new one is created.
 * @returns A vector that is the round of each element of v.
 */
function round(v, dst) {
  dst = dst || new VecType(4);
  dst[0] = Math.round(v[0]);
  dst[1] = Math.round(v[1]);
  dst[2] = Math.round(v[2]);
  dst[3] = Math.round(v[3]);
  return dst;
}
/**
 * Clamp each element of vector between min and max
 * @param v - Operand vector.
 * @param max - Min value, default 0
 * @param min - Max value, default 1
 * @param dst - vector to hold result. If not passed in a new one is created.
 * @returns A vector that the clamped value of each element of v.
 */
function clamp(v, min = 0, max = 1, dst) {
  dst = dst || new VecType(4);
  dst[0] = Math.min(max, Math.max(min, v[0]));
  dst[1] = Math.min(max, Math.max(min, v[1]));
  dst[2] = Math.min(max, Math.max(min, v[2]));
  dst[3] = Math.min(max, Math.max(min, v[3]));
  return dst;
}
/**
 * Adds two vectors; assumes a and b have the same dimension.
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @param dst - vector to hold result. If not passed in a new one is created.
 * @returns A vector that is the sum of a and b.
 */
function add(a, b, dst) {
  dst = dst || new VecType(4);
  dst[0] = a[0] + b[0];
  dst[1] = a[1] + b[1];
  dst[2] = a[2] + b[2];
  dst[3] = a[3] + b[3];
  return dst;
}
/**
 * Adds two vectors, scaling the 2nd; assumes a and b have the same dimension.
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @param scale - Amount to scale b
 * @param dst - vector to hold result. If not passed in a new one is created.
 * @returns A vector that is the sum of a + b * scale.
 */
function addScaled(a, b, scale, dst) {
  dst = dst || new VecType(4);
  dst[0] = a[0] + b[0] * scale;
  dst[1] = a[1] + b[1] * scale;
  dst[2] = a[2] + b[2] * scale;
  dst[3] = a[3] + b[3] * scale;
  return dst;
}
/**
 * Subtracts two vectors.
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @param dst - vector to hold result. If not passed in a new one is created.
 * @returns A vector that is the difference of a and b.
 */
function subtract(a, b, dst) {
  dst = dst || new VecType(4);
  dst[0] = a[0] - b[0];
  dst[1] = a[1] - b[1];
  dst[2] = a[2] - b[2];
  dst[3] = a[3] - b[3];
  return dst;
}
/**
 * Subtracts two vectors.
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @param dst - vector to hold result. If not passed in a new one is created.
 * @returns A vector that is the difference of a and b.
 */
const sub = subtract;
/**
 * Check if 2 vectors are approximately equal
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @returns true if vectors are approximately equal
 */
function equalsApproximately(a, b) {
  return Math.abs(a[0] - b[0]) < EPSILON && Math.abs(a[1] - b[1]) < EPSILON && Math.abs(a[2] - b[2]) < EPSILON && Math.abs(a[3] - b[3]) < EPSILON;
}
/**
 * Check if 2 vectors are exactly equal
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @returns true if vectors are exactly equal
 */
function equals(a, b) {
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3];
}
/**
 * Performs linear interpolation on two vectors.
 * Given vectors a and b and interpolation coefficient t, returns
 * a + t * (b - a).
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @param t - Interpolation coefficient.
 * @param dst - vector to hold result. If not passed in a new one is created.
 * @returns The linear interpolated result.
 */
function lerp(a, b, t, dst) {
  dst = dst || new VecType(4);
  dst[0] = a[0] + t * (b[0] - a[0]);
  dst[1] = a[1] + t * (b[1] - a[1]);
  dst[2] = a[2] + t * (b[2] - a[2]);
  dst[3] = a[3] + t * (b[3] - a[3]);
  return dst;
}
/**
 * Performs linear interpolation on two vectors.
 * Given vectors a and b and interpolation coefficient vector t, returns
 * a + t * (b - a).
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @param t - Interpolation coefficients vector.
 * @param dst - vector to hold result. If not passed in a new one is created.
 * @returns the linear interpolated result.
 */
function lerpV(a, b, t, dst) {
  dst = dst || new VecType(4);
  dst[0] = a[0] + t[0] * (b[0] - a[0]);
  dst[1] = a[1] + t[1] * (b[1] - a[1]);
  dst[2] = a[2] + t[2] * (b[2] - a[2]);
  dst[3] = a[3] + t[3] * (b[3] - a[3]);
  return dst;
}
/**
 * Return max values of two vectors.
 * Given vectors a and b returns
 * [max(a[0], b[0]), max(a[1], b[1]), max(a[2], b[2])].
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @param dst - vector to hold result. If not passed in a new one is created.
 * @returns The max components vector.
 */
function max(a, b, dst) {
  dst = dst || new VecType(4);
  dst[0] = Math.max(a[0], b[0]);
  dst[1] = Math.max(a[1], b[1]);
  dst[2] = Math.max(a[2], b[2]);
  dst[3] = Math.max(a[3], b[3]);
  return dst;
}
/**
 * Return min values of two vectors.
 * Given vectors a and b returns
 * [min(a[0], b[0]), min(a[1], b[1]), min(a[2], b[2])].
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @param dst - vector to hold result. If not passed in a new one is created.
 * @returns The min components vector.
 */
function min(a, b, dst) {
  dst = dst || new VecType(4);
  dst[0] = Math.min(a[0], b[0]);
  dst[1] = Math.min(a[1], b[1]);
  dst[2] = Math.min(a[2], b[2]);
  dst[3] = Math.min(a[3], b[3]);
  return dst;
}
/**
 * Multiplies a vector by a scalar.
 * @param v - The vector.
 * @param k - The scalar.
 * @param dst - vector to hold result. If not passed in a new one is created.
 * @returns The scaled vector.
 */
function mulScalar(v, k, dst) {
  dst = dst || new VecType(4);
  dst[0] = v[0] * k;
  dst[1] = v[1] * k;
  dst[2] = v[2] * k;
  dst[3] = v[3] * k;
  return dst;
}
/**
 * Multiplies a vector by a scalar. (same as mulScalar)
 * @param v - The vector.
 * @param k - The scalar.
 * @param dst - vector to hold result. If not passed in a new one is created.
 * @returns The scaled vector.
 */
const scale = mulScalar;
/**
 * Divides a vector by a scalar.
 * @param v - The vector.
 * @param k - The scalar.
 * @param dst - vector to hold result. If not passed in a new one is created.
 * @returns The scaled vector.
 */
function divScalar(v, k, dst) {
  dst = dst || new VecType(4);
  dst[0] = v[0] / k;
  dst[1] = v[1] / k;
  dst[2] = v[2] / k;
  dst[3] = v[3] / k;
  return dst;
}
/**
 * Inverse a vector.
 * @param v - The vector.
 * @param dst - vector to hold result. If not passed in a new one is created.
 * @returns The inverted vector.
 */
function inverse(v, dst) {
  dst = dst || new VecType(4);
  dst[0] = 1 / v[0];
  dst[1] = 1 / v[1];
  dst[2] = 1 / v[2];
  dst[3] = 1 / v[3];
  return dst;
}
/**
 * Invert a vector. (same as inverse)
 * @param v - The vector.
 * @param dst - vector to hold result. If not passed in a new one is created.
 * @returns The inverted vector.
 */
const invert = inverse;
/**
 * Computes the dot product of two vectors
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @returns dot product
 */
function dot(a, b) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];
}
/**
 * Computes the length of vector
 * @param v - vector.
 * @returns length of vector.
 */
function length(v) {
  const v0 = v[0];
  const v1 = v[1];
  const v2 = v[2];
  const v3 = v[3];
  return Math.sqrt(v0 * v0 + v1 * v1 + v2 * v2 + v3 * v3);
}
/**
 * Computes the length of vector (same as length)
 * @param v - vector.
 * @returns length of vector.
 */
const len = length;
/**
 * Computes the square of the length of vector
 * @param v - vector.
 * @returns square of the length of vector.
 */
function lengthSq(v) {
  const v0 = v[0];
  const v1 = v[1];
  const v2 = v[2];
  const v3 = v[3];
  return v0 * v0 + v1 * v1 + v2 * v2 + v3 * v3;
}
/**
 * Computes the square of the length of vector (same as lengthSq)
 * @param v - vector.
 * @returns square of the length of vector.
 */
const lenSq = lengthSq;
/**
 * Computes the distance between 2 points
 * @param a - vector.
 * @param b - vector.
 * @returns distance between a and b
 */
function distance(a, b) {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  const dz = a[2] - b[2];
  const dw = a[3] - b[3];
  return Math.sqrt(dx * dx + dy * dy + dz * dz + dw * dw);
}
/**
 * Computes the distance between 2 points (same as distance)
 * @param a - vector.
 * @param b - vector.
 * @returns distance between a and b
 */
const dist = distance;
/**
 * Computes the square of the distance between 2 points
 * @param a - vector.
 * @param b - vector.
 * @returns square of the distance between a and b
 */
function distanceSq(a, b) {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  const dz = a[2] - b[2];
  const dw = a[3] - b[3];
  return dx * dx + dy * dy + dz * dz + dw * dw;
}
/**
 * Computes the square of the distance between 2 points (same as distanceSq)
 * @param a - vector.
 * @param b - vector.
 * @returns square of the distance between a and b
 */
const distSq = distanceSq;
/**
 * Divides a vector by its Euclidean length and returns the quotient.
 * @param v - The vector.
 * @param dst - vector to hold result. If not passed in a new one is created.
 * @returns The normalized vector.
 */
function normalize(v, dst) {
  dst = dst || new VecType(4);
  const v0 = v[0];
  const v1 = v[1];
  const v2 = v[2];
  const v3 = v[3];
  const len = Math.sqrt(v0 * v0 + v1 * v1 + v2 * v2 + v3 * v3);
  if (len > 0.00001) {
    dst[0] = v0 / len;
    dst[1] = v1 / len;
    dst[2] = v2 / len;
    dst[3] = v3 / len;
  } else {
    dst[0] = 0;
    dst[1] = 0;
    dst[2] = 0;
    dst[3] = 0;
  }
  return dst;
}
/**
 * Negates a vector.
 * @param v - The vector.
 * @param dst - vector to hold result. If not passed in a new one is created.
 * @returns -v.
 */
function negate(v, dst) {
  dst = dst || new VecType(4);
  dst[0] = -v[0];
  dst[1] = -v[1];
  dst[2] = -v[2];
  dst[3] = -v[3];
  return dst;
}
/**
 * Copies a vector. (same as {@link vec4.clone})
 * Also see {@link vec4.create} and {@link vec4.set}
 * @param v - The vector.
 * @param dst - vector to hold result. If not passed in a new one is created.
 * @returns A copy of v.
 */
function copy(v, dst) {
  dst = dst || new VecType(4);
  dst[0] = v[0];
  dst[1] = v[1];
  dst[2] = v[2];
  dst[3] = v[3];
  return dst;
}
/**
 * Clones a vector. (same as {@link vec4.copy})
 * Also see {@link vec4.create} and {@link vec4.set}
 * @param v - The vector.
 * @param dst - vector to hold result. If not passed in a new one is created.
 * @returns A copy of v.
 */
const clone = copy;
/**
 * Multiplies a vector by another vector (component-wise); assumes a and
 * b have the same length.
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @param dst - vector to hold result. If not passed in a new one is created.
 * @returns The vector of products of entries of a and b.
 */
function multiply(a, b, dst) {
  dst = dst || new VecType(4);
  dst[0] = a[0] * b[0];
  dst[1] = a[1] * b[1];
  dst[2] = a[2] * b[2];
  dst[3] = a[3] * b[3];
  return dst;
}
/**
 * Multiplies a vector by another vector (component-wise); assumes a and
 * b have the same length. (same as mul)
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @param dst - vector to hold result. If not passed in a new one is created.
 * @returns The vector of products of entries of a and b.
 */
const mul = multiply;
/**
 * Divides a vector by another vector (component-wise); assumes a and
 * b have the same length.
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @param dst - vector to hold result. If not passed in a new one is created.
 * @returns The vector of quotients of entries of a and b.
 */
function divide(a, b, dst) {
  dst = dst || new VecType(4);
  dst[0] = a[0] / b[0];
  dst[1] = a[1] / b[1];
  dst[2] = a[2] / b[2];
  dst[3] = a[3] / b[3];
  return dst;
}
/**
 * Divides a vector by another vector (component-wise); assumes a and
 * b have the same length. (same as divide)
 * @param a - Operand vector.
 * @param b - Operand vector.
 * @param dst - vector to hold result. If not passed in a new one is created.
 * @returns The vector of quotients of entries of a and b.
 */
const div = divide;
/**
 * Zero's a vector
 * @param dst - vector to hold result. If not passed in a new one is created.
 * @returns The zeroed vector.
 */
function zero(dst) {
  dst = dst || new VecType(4);
  dst[0] = 0;
  dst[1] = 0;
  dst[2] = 0;
  dst[3] = 0;
  return dst;
}
/**
 * transform vec4 by 4x4 matrix
 * @param v - the vector
 * @param m - The matrix.
 * @param dst - optional vec4 to store result. If not passed a new one is created.
 * @returns the transformed vector
 */
function transformMat4(v, m, dst) {
  dst = dst || new VecType(4);
  const x = v[0];
  const y = v[1];
  const z = v[2];
  const w = v[3];
  dst[0] = m[0] * x + m[4] * y + m[8] * z + m[12] * w;
  dst[1] = m[1] * x + m[5] * y + m[9] * z + m[13] * w;
  dst[2] = m[2] * x + m[6] * y + m[10] * z + m[14] * w;
  dst[3] = m[3] * x + m[7] * y + m[11] * z + m[15] * w;
  return dst;
}
var vec4Impl = exports.vec4 = /*#__PURE__*/Object.freeze({
  __proto__: null,
  create: create,
  setDefaultType: setDefaultType$1,
  fromValues: fromValues,
  set: set,
  ceil: ceil,
  floor: floor,
  round: round,
  clamp: clamp,
  add: add,
  addScaled: addScaled,
  subtract: subtract,
  sub: sub,
  equalsApproximately: equalsApproximately,
  equals: equals,
  lerp: lerp,
  lerpV: lerpV,
  max: max,
  min: min,
  mulScalar: mulScalar,
  scale: scale,
  divScalar: divScalar,
  inverse: inverse,
  invert: invert,
  dot: dot,
  length: length,
  len: len,
  lengthSq: lengthSq,
  lenSq: lenSq,
  distance: distance,
  dist: dist,
  distanceSq: distanceSq,
  distSq: distSq,
  normalize: normalize,
  negate: negate,
  copy: copy,
  clone: clone,
  multiply: multiply,
  mul: mul,
  divide: divide,
  div: div,
  zero: zero,
  transformMat4: transformMat4
});

/**
 * Sets the type this library creates for all types
 *
 * example:
 *
 * ```
 * setDefaultType(Float64Array);
 * ```
 *
 * @param ctor - the constructor for the type. Either `Float32Array`, `Float64Array`, or `Array`
 */
function setDefaultType(ctor) {
  setDefaultType$4(ctor);
  setDefaultType$3(ctor);
  setDefaultType$2(ctor);
  setDefaultType$6(ctor);
  setDefaultType$5(ctor);
  setDefaultType$1(ctor);
}

},{}],7:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _shaders = require("../shaders/shaders");
var _wgpuMatrix = require("wgpu-matrix");
var _matrixClass = require("./matrix-class");
var _engine = require("./engine");
class MEBall {
  constructor(canvas, device, context, o) {
    this.context = context;
    this.device = device;

    // The input handler
    this.inputHandler = (0, _engine.createInputHandler)(window, canvas);
    this.cameras = o.cameras;
    this.scale = o.scale;
    console.log('passed : o.mainCameraParams.responseCoef ', o.mainCameraParams.responseCoef);
    this.mainCameraParams = {
      type: o.mainCameraParams.type,
      responseCoef: o.mainCameraParams.responseCoef
    }; // |  WASD 'arcball' };

    this.lastFrameMS = 0;
    this.entityArgPass = o.entityArgPass;
    this.SphereLayout = {
      vertexStride: 8 * 4,
      positionsOffset: 0,
      normalOffset: 3 * 4,
      uvOffset: 6 * 4
    };
    if (typeof o.raycast === 'undefined') {
      this.raycast = {
        enabled: false,
        radius: 2
      };
    } else {
      this.raycast = o.raycast;
    }
    this.texturesPaths = [];
    o.texturesPaths.forEach(t => {
      this.texturesPaths.push(t);
    });
    this.position = new _matrixClass.Position(o.position.x, o.position.y, o.position.z);
    this.rotation = new _matrixClass.Rotation(o.rotation.x, o.rotation.y, o.rotation.z);
    this.rotation.rotationSpeed.x = o.rotationSpeed.x;
    this.rotation.rotationSpeed.y = o.rotationSpeed.y;
    this.rotation.rotationSpeed.z = o.rotationSpeed.z;
    this.shaderModule = device.createShaderModule({
      code: _shaders.UNLIT_SHADER
    });
    this.presentationFormat = navigator.gpu.getPreferredCanvasFormat();
    this.pipeline = device.createRenderPipeline({
      layout: 'auto',
      vertex: {
        module: this.shaderModule,
        entryPoint: 'vertexMain',
        buffers: [{
          arrayStride: this.SphereLayout.vertexStride,
          attributes: [{
            // position
            shaderLocation: 0,
            offset: this.SphereLayout.positionsOffset,
            format: 'float32x3'
          }, {
            // normal
            shaderLocation: 1,
            offset: this.SphereLayout.normalOffset,
            format: 'float32x3'
          }, {
            // uv
            shaderLocation: 2,
            offset: this.SphereLayout.uvOffset,
            format: 'float32x2'
          }]
        }]
      },
      fragment: {
        module: this.shaderModule,
        entryPoint: 'fragmentMain',
        targets: [{
          format: this.presentationFormat
        }]
      },
      primitive: {
        topology: 'triangle-list',
        // Backface culling since the sphere is solid piece of geometry.
        // Faces pointing away from the camera will be occluded by faces
        // pointing toward the camera.
        cullMode: 'back'
      },
      // Enable depth testing so that the fragment closest to the camera
      // is rendered in front.
      depthStencil: {
        depthWriteEnabled: true,
        depthCompare: 'less',
        format: 'depth24plus'
      }
    });
    this.depthTexture = device.createTexture({
      size: [canvas.width, canvas.height],
      format: 'depth24plus',
      usage: GPUTextureUsage.RENDER_ATTACHMENT
    });
    this.uniformBufferSize = 4 * 16; // 4x4 matrix
    this.uniformBuffer = device.createBuffer({
      size: this.uniformBufferSize,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });

    // Fetch the images and upload them into a GPUTexture.
    this.texture0 = null;
    this.moonTexture = null;
    this.settings = {
      useRenderBundles: true,
      asteroidCount: 15
    };
    this.loadTex0(this.texturesPaths, device).then(() => {
      this.loadTex1(this.texturesPaths, device).then(() => {
        this.sampler = device.createSampler({
          magFilter: 'linear',
          minFilter: 'linear'
        });
        this.transform = _wgpuMatrix.mat4.create();
        _wgpuMatrix.mat4.identity(this.transform);

        // Create one large central planet surrounded by a large ring of asteroids
        this.planet = this.createGeometry(this.scale);
        this.planet.bindGroup = this.createSphereBindGroup(this.texture0, this.transform);
        var asteroids = [this.createGeometry(12, 8, 6, 0.15)];
        this.renderables = [this.planet];

        // this.ensureEnoughAsteroids(asteroids, this.transform);
        this.renderPassDescriptor = {
          colorAttachments: [{
            view: undefined,
            clearValue: {
              r: 0.0,
              g: 0.0,
              b: 0.0,
              a: 1.0
            },
            loadOp: this.entityArgPass.loadOp,
            storeOp: this.entityArgPass.storeOp
          }],
          depthStencilAttachment: {
            view: this.depthTexture.createView(),
            depthClearValue: 1.0,
            depthLoadOp: this.entityArgPass.depthLoadOp,
            depthStoreOp: this.entityArgPass.depthStoreOp
          }
        };
        const aspect = canvas.width / canvas.height;
        this.projectionMatrix = _wgpuMatrix.mat4.perspective(2 * Math.PI / 5, aspect, 1, 100.0);
        this.modelViewProjectionMatrix = _wgpuMatrix.mat4.create();
        this.frameBindGroup = device.createBindGroup({
          layout: this.pipeline.getBindGroupLayout(0),
          entries: [{
            binding: 0,
            resource: {
              buffer: this.uniformBuffer
            }
          }]
        });

        // The render bundle can be encoded once and re-used as many times as needed.
        // Because it encodes all of the commands needed to render at the GPU level,
        // those commands will not need to execute the associated JavaScript code upon
        // execution or be re-validated, which can represent a significant time savings.
        //
        // However, because render bundles are immutable once created, they are only
        // appropriate for rendering content where the same commands will be executed
        // every time, with the only changes being the contents of the buffers and
        // textures used. Cases where the executed commands differ from frame-to-frame,
        // such as when using frustrum or occlusion culling, will not benefit from
        // using render bundles as much.
        this.renderBundle;
        this.updateRenderBundle();
      });
    });
  }
  ensureEnoughAsteroids(asteroids, transform) {
    for (let i = this.renderables.length; i <= this.settings.asteroidCount; ++i) {
      // Place copies of the asteroid in a ring.
      const radius = Math.random() * 1.7 + 1.25;
      const angle = Math.random() * Math.PI * 2;
      const x = Math.sin(angle) * radius;
      const y = (Math.random() - 0.5) * 0.015;
      const z = Math.cos(angle) * radius;
      _wgpuMatrix.mat4.identity(transform);
      _wgpuMatrix.mat4.translate(transform, [x, y, z], transform);
      _wgpuMatrix.mat4.rotateX(transform, Math.random() * Math.PI, transform);
      _wgpuMatrix.mat4.rotateY(transform, Math.random() * Math.PI, transform);
      this.renderables.push({
        ...asteroids[i % asteroids.length],
        bindGroup: this.createSphereBindGroup(this.moonTexture, transform)
      });
    }
  }
  updateRenderBundle() {
    console.log('updateRenderBundle');
    const renderBundleEncoder = this.device.createRenderBundleEncoder({
      colorFormats: [this.presentationFormat],
      depthStencilFormat: 'depth24plus'
    });
    this.renderScene(renderBundleEncoder);
    this.renderBundle = renderBundleEncoder.finish();
  }
  createGeometry(radius, widthSegments = 8, heightSegments = 4, randomness = 0) {
    const sphereMesh = this.createSphereMesh(radius, widthSegments, heightSegments, randomness);
    // Create a vertex buffer from the sphere data.
    const vertices = this.device.createBuffer({
      size: sphereMesh.vertices.byteLength,
      usage: GPUBufferUsage.VERTEX,
      mappedAtCreation: true
    });
    new Float32Array(vertices.getMappedRange()).set(sphereMesh.vertices);
    vertices.unmap();
    const indices = this.device.createBuffer({
      size: sphereMesh.indices.byteLength,
      usage: GPUBufferUsage.INDEX,
      mappedAtCreation: true
    });
    new Uint16Array(indices.getMappedRange()).set(sphereMesh.indices);
    indices.unmap();
    return {
      vertices,
      indices,
      indexCount: sphereMesh.indices.length
    };
  }
  createSphereBindGroup(texture, transform) {
    const uniformBufferSize = 4 * 16; // 4x4 matrix
    const uniformBuffer = this.device.createBuffer({
      size: uniformBufferSize,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
      mappedAtCreation: true
    });
    new Float32Array(uniformBuffer.getMappedRange()).set(transform);
    uniformBuffer.unmap();
    const bindGroup = this.device.createBindGroup({
      layout: this.pipeline.getBindGroupLayout(1),
      entries: [{
        binding: 0,
        resource: {
          buffer: uniformBuffer
        }
      }, {
        binding: 1,
        resource: this.sampler
      }, {
        binding: 2,
        resource: texture.createView()
      }]
    });
    return bindGroup;
  }
  getTransformationMatrix(pos) {
    // const viewMatrix = mat4.identity();
    const now = Date.now();
    const deltaTime = (now - this.lastFrameMS) / this.mainCameraParams.responseCoef;
    this.lastFrameMS = now;

    // const viewMatrix = mat4.identity(); ORI
    const camera = this.cameras[this.mainCameraParams.type];
    const viewMatrix = camera.update(deltaTime, this.inputHandler());
    _wgpuMatrix.mat4.translate(viewMatrix, _wgpuMatrix.vec3.fromValues(pos.x, pos.y, pos.z), viewMatrix);
    _wgpuMatrix.mat4.rotateX(viewMatrix, Math.PI * this.rotation.getRotX(), viewMatrix);
    _wgpuMatrix.mat4.rotateY(viewMatrix, Math.PI * this.rotation.getRotY(), viewMatrix);
    _wgpuMatrix.mat4.rotateZ(viewMatrix, Math.PI * this.rotation.getRotZ(), viewMatrix);
    _wgpuMatrix.mat4.multiply(this.projectionMatrix, viewMatrix, this.modelViewProjectionMatrix);
    return this.modelViewProjectionMatrix;
  }
  async loadTex1(texPaths, device) {
    return new Promise(async resolve => {
      const response = await fetch(texPaths[0]);
      const imageBitmap = await createImageBitmap(await response.blob());
      this.moonTexture = device.createTexture({
        size: [imageBitmap.width, imageBitmap.height, 1],
        format: 'rgba8unorm',
        usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT
      });
      var moonTexture = this.moonTexture;
      device.queue.copyExternalImageToTexture({
        source: imageBitmap
      }, {
        texture: moonTexture
      }, [imageBitmap.width, imageBitmap.height]);
      resolve();
    });
  }
  async loadTex0(paths, device) {
    return new Promise(async resolve => {
      const response = await fetch(paths[0]);
      const imageBitmap = await createImageBitmap(await response.blob());
      console.log('loadTex0 WHAT IS THIS -> ', this);
      this.texture0 = device.createTexture({
        size: [imageBitmap.width, imageBitmap.height, 1],
        format: 'rgba8unorm',
        usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT
      });
      var texture0 = this.texture0;
      device.queue.copyExternalImageToTexture({
        source: imageBitmap
      }, {
        texture: texture0
      }, [imageBitmap.width, imageBitmap.height]);
      resolve();
    });
  }
  createSphereMesh(radius, widthSegments = 3, heightSegments = 3, randomness = 0) {
    const vertices = [];
    const indices = [];
    widthSegments = Math.max(3, Math.floor(widthSegments));
    heightSegments = Math.max(2, Math.floor(heightSegments));
    const firstVertex = _wgpuMatrix.vec3.create();
    const vertex = _wgpuMatrix.vec3.create();
    const normal = _wgpuMatrix.vec3.create();
    let index = 0;
    const grid = [];

    // generate vertices, normals and uvs
    for (let iy = 0; iy <= heightSegments; iy++) {
      const verticesRow = [];
      const v = iy / heightSegments;
      // special case for the poles
      let uOffset = 0;
      if (iy === 0) {
        uOffset = 0.5 / widthSegments;
      } else if (iy === heightSegments) {
        uOffset = -0.5 / widthSegments;
      }
      for (let ix = 0; ix <= widthSegments; ix++) {
        const u = ix / widthSegments;
        // Poles should just use the same position all the way around.
        if (ix == widthSegments) {
          _wgpuMatrix.vec3.copy(firstVertex, vertex);
        } else if (ix == 0 || iy != 0 && iy !== heightSegments) {
          const rr = radius + (Math.random() - 0.5) * 2 * randomness * radius;
          // vertex
          vertex[0] = -rr * Math.cos(u * Math.PI * 2) * Math.sin(v * Math.PI);
          vertex[1] = rr * Math.cos(v * Math.PI);
          vertex[2] = rr * Math.sin(u * Math.PI * 2) * Math.sin(v * Math.PI);
          if (ix == 0) {
            _wgpuMatrix.vec3.copy(vertex, firstVertex);
          }
        }
        vertices.push(...vertex);

        // normal
        _wgpuMatrix.vec3.copy(vertex, normal);
        _wgpuMatrix.vec3.normalize(normal, normal);
        vertices.push(...normal);
        // uv
        vertices.push(u + uOffset, 1 - v);
        verticesRow.push(index++);
      }
      grid.push(verticesRow);
    }
    // indices
    for (let iy = 0; iy < heightSegments; iy++) {
      for (let ix = 0; ix < widthSegments; ix++) {
        const a = grid[iy][ix + 1];
        const b = grid[iy][ix];
        const c = grid[iy + 1][ix];
        const d = grid[iy + 1][ix + 1];
        if (iy !== 0) indices.push(a, b, d);
        if (iy !== heightSegments - 1) indices.push(b, c, d);
      }
    }
    return {
      vertices: new Float32Array(vertices),
      indices: new Uint16Array(indices)
    };
  }

  // Render bundles function as partial, limited render passes, so we can use the
  // same code both to render the scene normally and to build the render bundle.
  renderScene(passEncoder) {
    if (typeof this.renderables === 'undefined') return;
    passEncoder.setPipeline(this.pipeline);
    passEncoder.setBindGroup(0, this.frameBindGroup);

    // Loop through every renderable object and draw them individually.
    // (Because many of these meshes are repeated, with only the transforms
    // differing, instancing would be highly effective here. This sample
    // intentionally avoids using instancing in order to emulate a more complex
    // scene, which helps demonstrate the potential time savings a render bundle
    // can provide.)
    let count = 0;
    for (const renderable of this.renderables) {
      passEncoder.setBindGroup(1, renderable.bindGroup);
      passEncoder.setVertexBuffer(0, renderable.vertices);
      passEncoder.setIndexBuffer(renderable.indices, 'uint16');
      passEncoder.drawIndexed(renderable.indexCount);
      if (++count > this.settings.asteroidCount) {
        break;
      }
    }
  }
  draw = () => {
    if (this.moonTexture == null) {
      console.log('not ready');
      return;
    }
    const transformationMatrix = this.getTransformationMatrix(this.position);
    this.device.queue.writeBuffer(this.uniformBuffer, 0, transformationMatrix.buffer, transformationMatrix.byteOffset, transformationMatrix.byteLength);
    this.renderPassDescriptor.colorAttachments[0].view = this.context.getCurrentTexture().createView();
  };
}
exports.default = MEBall;

},{"../shaders/shaders":19,"./engine":9,"./matrix-class":11,"wgpu-matrix":6}],8:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _shaders = require("../shaders/shaders");
var _wgpuMatrix = require("wgpu-matrix");
var _matrixClass = require("./matrix-class");
var _engine = require("./engine");
var SphereLayout = {
  vertexStride: 8 * 4,
  positionsOffset: 0,
  normalOffset: 3 * 4,
  uvOffset: 6 * 4
};
class MECube {
  constructor(canvas, device, context, o) {
    this.device = device;
    this.context = context;
    this.entityArgPass = o.entityArgPass;
    this.inputHandler = (0, _engine.createInputHandler)(window, canvas);
    this.cameras = o.cameras;
    console.log('passed : o.mainCameraParams.responseCoef ', o.mainCameraParams.responseCoef);
    this.mainCameraParams = {
      type: o.mainCameraParams.type,
      responseCoef: o.mainCameraParams.responseCoef
    }; // |  WASD 'arcball' };

    this.lastFrameMS = 0;
    this.shaderModule = device.createShaderModule({
      code: _shaders.UNLIT_SHADER
    });
    this.texturesPaths = [];
    if (typeof o.raycast === 'undefined') {
      this.raycast = {
        enabled: false,
        radius: 2
      };
    } else {
      this.raycast = o.raycast;
    }

    // useUVShema4x2 pass this from top !

    o.texturesPaths.forEach(t => {
      this.texturesPaths.push(t);
    });
    this.presentationFormat = navigator.gpu.getPreferredCanvasFormat();
    this.position = new _matrixClass.Position(o.position.x, o.position.y, o.position.z);
    console.log('cube added on pos : ', this.position);
    this.rotation = new _matrixClass.Rotation(o.rotation.x, o.rotation.y, o.rotation.z);
    this.rotation.rotationSpeed.x = o.rotationSpeed.x;
    this.rotation.rotationSpeed.y = o.rotationSpeed.y;
    this.rotation.rotationSpeed.z = o.rotationSpeed.z;
    this.scale = o.scale;
    this.pipeline = device.createRenderPipeline({
      layout: 'auto',
      vertex: {
        module: this.shaderModule,
        entryPoint: 'vertexMain',
        buffers: [{
          arrayStride: SphereLayout.vertexStride,
          attributes: [
          // position
          {
            shaderLocation: 0,
            offset: SphereLayout.positionsOffset,
            format: 'float32x3'
          },
          // normal
          {
            shaderLocation: 1,
            offset: SphereLayout.normalOffset,
            format: 'float32x3'
          },
          // uv
          {
            shaderLocation: 2,
            offset: SphereLayout.uvOffset,
            format: 'float32x2'
          }]
        }]
      },
      fragment: {
        module: this.shaderModule,
        entryPoint: 'fragmentMain',
        targets: [{
          format: this.presentationFormat
        }]
      },
      primitive: {
        topology: 'triangle-list',
        // Backface culling since the sphere is solid piece of geometry.
        // Faces pointing away from the camera will be occluded by faces
        // pointing toward the camera.
        cullMode: 'back'
      },
      // Enable depth testing so that the fragment closest to the camera
      // is rendered in front.
      depthStencil: {
        depthWriteEnabled: true,
        depthCompare: 'less',
        format: 'depth24plus'
      }
    });
    this.depthTexture = device.createTexture({
      size: [canvas.width, canvas.height],
      format: 'depth24plus',
      usage: GPUTextureUsage.RENDER_ATTACHMENT
    });
    this.uniformBufferSize = 4 * 16; // 4x4 matrix
    this.uniformBuffer = device.createBuffer({
      size: this.uniformBufferSize,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });

    // Fetch the images and upload them into a GPUTexture.
    this.texture0 = null;
    this.moonTexture = null;
    this.settings = {
      useRenderBundles: true,
      asteroidCount: 15
    };
    this.loadTex0(this.texturesPaths, device).then(() => {
      this.loadTex1(this.texturesPaths, device).then(() => {
        this.sampler = device.createSampler({
          magFilter: 'linear',
          minFilter: 'linear'
        });
        this.transform = _wgpuMatrix.mat4.create();
        _wgpuMatrix.mat4.identity(this.transform);
        this.planet = this.createGeometry({
          scale: this.scale,
          useUVShema4x2: false
        });
        this.planet.bindGroup = this.createSphereBindGroup(this.texture0, this.transform);

        // can be used like instance draws
        var asteroids = [
          // this.createGeometry(0.2, 8, 6, 0.15),
        ];
        this.renderables = [this.planet];
        // this.ensureEnoughAsteroids(asteroids, this.transform);
        this.renderPassDescriptor = {
          colorAttachments: [{
            view: undefined,
            clearValue: {
              r: 0.0,
              g: 0.0,
              b: 0.0,
              a: 1.0
            },
            loadOp: this.entityArgPass.loadOp,
            storeOp: this.entityArgPass.storeOp
          }],
          depthStencilAttachment: {
            view: this.depthTexture.createView(),
            depthClearValue: 1.0,
            depthLoadOp: this.entityArgPass.depthLoadOp,
            depthStoreOp: this.entityArgPass.depthStoreOp
          }
        };
        const aspect = canvas.width / canvas.height;
        this.projectionMatrix = _wgpuMatrix.mat4.perspective(2 * Math.PI / 5, aspect, 1, 1000.0);
        this.modelViewProjectionMatrix = _wgpuMatrix.mat4.create();
        this.frameBindGroup = device.createBindGroup({
          layout: this.pipeline.getBindGroupLayout(0),
          entries: [{
            binding: 0,
            resource: {
              buffer: this.uniformBuffer
            }
          }]
        });

        // The render bundle can be encoded once and re-used as many times as needed.
        // Because it encodes all of the commands needed to render at the GPU level,
        // those commands will not need to execute the associated JavaScript code upon
        // execution or be re-validated, which can represent a significant time savings.
        //
        // However, because render bundles are immutable once created, they are only
        // appropriate for rendering content where the same commands will be executed
        // every time, with the only changes being the contents of the buffers and
        // textures used. Cases where the executed commands differ from frame-to-frame,
        // such as when using frustrum or occlusion culling, will not benefit from
        // using render bundles as much.
        this.renderBundle;
        this.updateRenderBundle();
      });
    });
  }
  ensureEnoughAsteroids(asteroids, transform) {
    for (let i = this.renderables.length; i <= this.settings.asteroidCount; ++i) {
      // Place copies of the asteroid in a ring.
      const radius = Math.random() * 1.7 + 1.25;
      const angle = Math.random() * Math.PI * 2;
      const x = Math.sin(angle) * radius;
      const y = (Math.random() - 0.5) * 0.015;
      const z = Math.cos(angle) * radius;
      _wgpuMatrix.mat4.identity(transform);
      _wgpuMatrix.mat4.translate(transform, [x, y, z], transform);
      _wgpuMatrix.mat4.rotateX(transform, Math.random() * Math.PI, transform);
      _wgpuMatrix.mat4.rotateY(transform, Math.random() * Math.PI, transform);
      this.renderables.push({
        ...asteroids[i % asteroids.length],
        bindGroup: this.createSphereBindGroup(this.moonTexture, transform)
      });
    }
  }
  updateRenderBundle() {
    console.log('[CUBE] updateRenderBundle');
    const renderBundleEncoder = this.device.createRenderBundleEncoder({
      colorFormats: [this.presentationFormat],
      depthStencilFormat: 'depth24plus'
    });
    this.renderScene(renderBundleEncoder);
    this.renderBundle = renderBundleEncoder.finish();
  }
  createGeometry(options) {
    const mesh = this.createCubeVertices(options);
    // Create a vertex buffer from the sphere data.
    const vertices = this.device.createBuffer({
      size: mesh.vertices.byteLength,
      usage: GPUBufferUsage.VERTEX,
      mappedAtCreation: true
    });
    new Float32Array(vertices.getMappedRange()).set(mesh.vertices);
    vertices.unmap();
    const indices = this.device.createBuffer({
      size: mesh.indices.byteLength,
      usage: GPUBufferUsage.INDEX,
      mappedAtCreation: true
    });
    new Uint16Array(indices.getMappedRange()).set(mesh.indices);
    indices.unmap();
    return {
      vertices,
      indices,
      indexCount: mesh.indices.length
    };
  }
  createSphereBindGroup(texture, transform) {
    const uniformBufferSize = 4 * 16; // 4x4 matrix
    const uniformBuffer = this.device.createBuffer({
      size: uniformBufferSize,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
      mappedAtCreation: true
    });
    new Float32Array(uniformBuffer.getMappedRange()).set(transform);
    uniformBuffer.unmap();
    const bindGroup = this.device.createBindGroup({
      layout: this.pipeline.getBindGroupLayout(1),
      entries: [{
        binding: 0,
        resource: {
          buffer: uniformBuffer
        }
      }, {
        binding: 1,
        resource: this.sampler
      }, {
        binding: 2,
        resource: texture.createView()
      }]
    });
    return bindGroup;
  }

  // TEST 
  getViewMatrix() {
    const camera = this.cameras[this.mainCameraParams.type];
    const viewMatrix = camera.update(deltaTime, this.inputHandler());
    return viewMatrix;
  }
  getTransformationMatrix(pos) {
    const now = Date.now();
    const deltaTime = (now - this.lastFrameMS) / this.mainCameraParams.responseCoef;
    this.lastFrameMS = now;

    // const viewMatrix = mat4.identity(); ORI
    const camera = this.cameras[this.mainCameraParams.type];
    const viewMatrix = camera.update(deltaTime, this.inputHandler());
    _wgpuMatrix.mat4.translate(viewMatrix, _wgpuMatrix.vec3.fromValues(pos.x, pos.y, pos.z), viewMatrix);
    _wgpuMatrix.mat4.rotateX(viewMatrix, Math.PI * this.rotation.getRotX(), viewMatrix);
    _wgpuMatrix.mat4.rotateY(viewMatrix, Math.PI * this.rotation.getRotY(), viewMatrix);
    _wgpuMatrix.mat4.rotateZ(viewMatrix, Math.PI * this.rotation.getRotZ(), viewMatrix);
    _wgpuMatrix.mat4.multiply(this.projectionMatrix, viewMatrix, this.modelViewProjectionMatrix);
    return this.modelViewProjectionMatrix;
  }
  async loadTex1(textPath, device) {
    return new Promise(async resolve => {
      const response = await fetch(textPath[0]);
      const imageBitmap = await createImageBitmap(await response.blob());
      this.moonTexture = device.createTexture({
        size: [imageBitmap.width, imageBitmap.height, 1],
        format: 'rgba8unorm',
        usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT
      });
      var moonTexture = this.moonTexture;
      device.queue.copyExternalImageToTexture({
        source: imageBitmap
      }, {
        texture: moonTexture
      }, [imageBitmap.width, imageBitmap.height]);
      resolve();
    });
  }
  async loadTex0(texturesPaths, device) {
    return new Promise(async resolve => {
      const response = await fetch(texturesPaths[0]);
      const imageBitmap = await createImageBitmap(await response.blob());
      console.log('WHAT IS THIS ', this);
      this.texture0 = device.createTexture({
        size: [imageBitmap.width, imageBitmap.height, 1],
        format: 'rgba8unorm',
        usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT
      });
      var texture0 = this.texture0;
      device.queue.copyExternalImageToTexture({
        source: imageBitmap
      }, {
        texture: texture0
      }, [imageBitmap.width, imageBitmap.height]);
      resolve();
    });
  }

  // Render bundles function as partial, limited render passes, so we can use the
  // same code both to render the scene normally and to build the render bundle.
  renderScene(passEncoder) {
    if (typeof this.renderables === 'undefined') return;
    passEncoder.setPipeline(this.pipeline);
    passEncoder.setBindGroup(0, this.frameBindGroup);

    // Loop through every renderable object and draw them individually.
    // (Because many of these meshes are repeated, with only the transforms
    // differing, instancing would be highly effective here. This sample
    // intentionally avoids using instancing in order to emulate a more complex
    // scene, which helps demonstrate the potential time savings a render bundle
    // can provide.)
    let count = 0;
    for (const renderable of this.renderables) {
      passEncoder.setBindGroup(1, renderable.bindGroup);
      passEncoder.setVertexBuffer(0, renderable.vertices);
      passEncoder.setIndexBuffer(renderable.indices, 'uint16');
      passEncoder.drawIndexed(renderable.indexCount);
      if (++count > this.settings.asteroidCount) {
        break;
      }
    }
  }
  createCubeVertices(options) {
    if (typeof options === 'undefined') {
      var options = {
        scale: 1,
        useUVShema4x2: false
      };
    }
    if (typeof options.scale === 'undefined') options.scale = 1;
    let vertices;
    if (options.useUVShema4x2 == true) {
      vertices = new Float32Array([
      //  position   |  texture coordinate
      //-------------+----------------------
      // front face     select the top left image  1, 0.5,   
      -1, 1, 1, 1, 0, 0, 0, 0, -1, -1, 1, 1, 0, 0, 0, 0.5, 1, 1, 1, 1, 0, 0, 0.25, 0, 1, -1, 1, 1, 0, 0, 0.25, 0.5,
      // right face     select the top middle image
      1, 1, -1, 1, 0, 0, 0.25, 0, 1, 1, 1, 1, 0, 0, 0.5, 0, 1, -1, -1, 1, 0, 0, 0.25, 0.5, 1, -1, 1, 1, 0, 0, 0.5, 0.5,
      // back face      select to top right image
      1, 1, -1, 1, 0, 0, 0.5, 0, 1, -1, -1, 1, 0, 0, 0.5, 0.5, -1, 1, -1, 1, 0, 0, 0.75, 0, -1, -1, -1, 1, 0, 0, 0.75, 0.5,
      // left face       select the bottom left image
      -1, 1, 1, 1, 0, 0, 0, 0.5, -1, 1, -1, 1, 0, 0, 0.25, 0.5, -1, -1, 1, 1, 0, 0, 0, 1, -1, -1, -1, 1, 0, 0, 0.25, 1,
      // bottom face     select the bottom middle image
      1, -1, 1, 1, 0, 0, 0.25, 0.5, -1, -1, 1, 1, 0, 0, 0.5, 0.5, 1, -1, -1, 1, 0, 0, 0.25, 1, -1, -1, -1, 1, 0, 0, 0.5, 1,
      // top face        select the bottom right image
      -1, 1, 1, 1, 0, 0, 0.5, 0.5, 1, 1, 1, 1, 0, 0, 0.75, 0.5, -1, 1, -1, 1, 0, 0, 0.5, 1, 1, 1, -1, 1, 0, 0, 0.75, 1]);
    } else {
      vertices = new Float32Array([
      //  position                                                   |  texture coordinate
      //-------------                                              +----------------------
      // front face     select the top left image  1, 0.5,   
      -1 * options.scale, 1 * options.scale, 1 * options.scale, 1, 0, 0, 0, 0, -1 * options.scale, -1 * options.scale, 1 * options.scale, 1, 0, 0, 0, 1, 1 * options.scale, 1 * options.scale, 1 * options.scale, 1, 0, 0, 1, 0, 1 * options.scale, -1 * options.scale, 1 * options.scale, 1, 0, 0, 1, 1,
      // right face     select the top middle image
      1 * options.scale, 1 * options.scale, -1 * options.scale, 1, 0, 0, 0, 0, 1 * options.scale, 1 * options.scale, 1 * options.scale, 1, 0, 0, 0, 1, 1 * options.scale, -1 * options.scale, -1 * options.scale, 1, 0, 0, 1, 0, 1 * options.scale, -1 * options.scale, 1 * options.scale, 1, 0, 0, 1, 1,
      // back face      select to top right image
      1 * options.scale, 1 * options.scale, -1 * options.scale, 1, 0, 0, 0, 0, 1 * options.scale, -1 * options.scale, -1 * options.scale, 1, 0, 0, 0, 1, -1 * options.scale, 1 * options.scale, -1 * options.scale, 1, 0, 0, 1, 0, -1 * options.scale, -1 * options.scale, -1 * options.scale, 1, 0, 0, 1, 1,
      // left face       select the bottom left image
      -1 * options.scale, 1 * options.scale, 1 * options.scale, 1, 0, 0, 0, 0, -1 * options.scale, 1 * options.scale, -1 * options.scale, 1, 0, 0, 0, 1, -1 * options.scale, -1 * options.scale, 1 * options.scale, 1, 0, 0, 1, 0, -1 * options.scale, -1 * options.scale, -1 * options.scale, 1, 0, 0, 1, 1,
      // bottom face     select the bottom middle image
      1 * options.scale, -1 * options.scale, 1 * options.scale, 1, 0, 0, 0, 0, -1 * options.scale, -1 * options.scale, 1 * options.scale, 1, 0, 0, 0, 1, 1 * options.scale, -1 * options.scale, -1 * options.scale, 1, 0, 0, 1, 0, -1 * options.scale, -1 * options.scale, -1 * options.scale, 1, 0, 0, 1, 1,
      // top face        select the bottom right image
      -1 * options.scale, 1 * options.scale, 1 * options.scale, 1, 0, 0, 0, 0, 1 * options.scale, 1 * options.scale, 1 * options.scale, 1, 0, 0, 0, 1, -1 * options.scale, 1 * options.scale, -1 * options.scale, 1, 0, 0, 1, 0, 1 * options.scale, 1 * options.scale, -1 * options.scale, 1, 0, 0, 1, 1]);
    }
    const indices = new Uint16Array([0, 1, 2, 2, 1, 3,
    // front
    4, 5, 6, 6, 5, 7,
    // right
    8, 9, 10, 10, 9, 11,
    // back
    12, 13, 14, 14, 13, 15,
    // left
    16, 17, 18, 18, 17, 19,
    // bottom
    20, 21, 22, 22, 21, 23 // top
    ]);
    return {
      vertices,
      indices,
      numVertices: indices.length
    };
  }
  draw = () => {
    if (this.moonTexture == null) {
      console.log('not ready');
      return;
    }
    const transformationMatrix = this.getTransformationMatrix(this.position);
    this.device.queue.writeBuffer(this.uniformBuffer, 0, transformationMatrix.buffer, transformationMatrix.byteOffset, transformationMatrix.byteLength);
    this.renderPassDescriptor.colorAttachments[0].view = this.context.getCurrentTexture().createView();
  };
}
exports.default = MECube;

},{"../shaders/shaders":19,"./engine":9,"./matrix-class":11,"wgpu-matrix":6}],9:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.WASDCamera = exports.ArcballCamera = void 0;
exports.createInputHandler = createInputHandler;
var _wgpuMatrix = require("wgpu-matrix");
var _utils = require("./utils");
// Note: The code in this file does not use the 'dst' output parameter of functions in the
// 'wgpu-matrix' library, so produces many temporary vectors and matrices.
// This is intentional, as this sample prefers readability over performance.

// import Input from './input';

// // Common interface for camera implementations
// export default interface Camera {
//   // update updates the camera using the user-input and returns the view matrix.
//   update(delta_time: number, input: Input): Mat4;

//   // The camera matrix.
//   // This is the inverse of the view matrix.
//   matrix: Mat4;
//   // Alias to column vector 0 of the camera matrix.
//   right: Vec4;
//   // Alias to column vector 1 of the camera matrix.
//   up: Vec4;
//   // Alias to column vector 2 of the camera matrix.
//   back: Vec4;
//   // Alias to column vector 3 of the camera matrix.
//   position: Vec4;
// }

// The common functionality between camera implementations
class CameraBase {
  // The camera matrix
  matrix_ = new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);

  // The calculated view matrix readonly
  view_ = _wgpuMatrix.mat4.create();

  // Aliases to column vectors of the matrix
  right_ = new Float32Array(this.matrix_.buffer, 4 * 0, 4);
  up_ = new Float32Array(this.matrix_.buffer, 4 * 4, 4);
  back_ = new Float32Array(this.matrix_.buffer, 4 * 8, 4);
  position_ = new Float32Array(this.matrix_.buffer, 4 * 12, 4);

  // Returns the camera matrix
  get matrix() {
    return this.matrix_;
  }
  // Assigns `mat` to the camera matrix
  set matrix(mat) {
    _wgpuMatrix.mat4.copy(mat, this.matrix_);
  }

  // Returns the camera view matrix
  get view() {
    return this.view_;
  }
  // Assigns `mat` to the camera view
  set view(mat) {
    _wgpuMatrix.mat4.copy(mat, this.view_);
  }

  // Returns column vector 0 of the camera matrix
  get right() {
    return this.right_;
  }
  // Assigns `vec` to the first 3 elements of column vector 0 of the camera matrix
  set right(vec) {
    _wgpuMatrix.vec3.copy(vec, this.right_);
  }

  // Returns column vector 1 of the camera matrix
  get up() {
    return this.up_;
  }
  // Assigns `vec` to the first 3 elements of column vector 1 of the camera matrix \ Vec3
  set up(vec) {
    _wgpuMatrix.vec3.copy(vec, this.up_);
  }

  // Returns column vector 2 of the camera matrix
  get back() {
    return this.back_;
  }
  // Assigns `vec` to the first 3 elements of column vector 2 of the camera matrix
  set back(vec) {
    _wgpuMatrix.vec3.copy(vec, this.back_);
  }

  // Returns column vector 3 of the camera matrix
  get position() {
    return this.position_;
  }
  // Assigns `vec` to the first 3 elements of column vector 3 of the camera matrix
  set position(vec) {
    _wgpuMatrix.vec3.copy(vec, this.position_);
  }
}

// WASDCamera is a camera implementation that behaves similar to first-person-shooter PC games.
class WASDCamera extends CameraBase {
  // The camera absolute pitch angle
  pitch = 0;
  // The camera absolute yaw angle
  yaw = 0;

  // The movement veloicty readonly
  velocity_ = _wgpuMatrix.vec3.create();

  // Speed multiplier for camera movement
  movementSpeed = 10;

  // Speed multiplier for camera rotation
  rotationSpeed = 1;

  // Movement velocity drag coeffient [0 .. 1]
  // 0: Continues forever
  // 1: Instantly stops moving
  frictionCoefficient = 0.99;

  // Returns velocity vector
  get velocity() {
    return this.velocity_;
  }
  // Assigns `vec` to the velocity vector
  set velocity(vec) {
    _wgpuMatrix.vec3.copy(vec, this.velocity_);
  }
  constructor(options) {
    super();
    if (options && (options.position || options.target)) {
      const position = options.position ?? _wgpuMatrix.vec3.create(0, 0, 0);
      const target = options.target ?? _wgpuMatrix.vec3.create(0, 0, 0);
      const forward = _wgpuMatrix.vec3.normalize(_wgpuMatrix.vec3.sub(target, position));
      this.recalculateAngles(forward);
      this.position = position;
      // console.log(`%cCamera pos: ${position}`, LOG_INFO);
    }
  }

  // Returns the camera matrix
  get matrix() {
    return super.matrix;
  }

  // Assigns `mat` to the camera matrix, and recalcuates the camera angles
  set matrix(mat) {
    super.matrix = mat;
    this.recalculateAngles(this.back);
  }
  update(deltaTime, input) {
    const sign = (positive, negative) => (positive ? 1 : 0) - (negative ? 1 : 0);

    // Apply the delta rotation to the pitch and yaw angles
    this.yaw -= input.analog.x * deltaTime * this.rotationSpeed;
    this.pitch -= input.analog.y * deltaTime * this.rotationSpeed;

    // Wrap yaw between [0° .. 360°], just to prevent large accumulation.
    this.yaw = mod(this.yaw, Math.PI * 2);
    // Clamp pitch between [-90° .. +90°] to prevent somersaults.
    this.pitch = clamp(this.pitch, -Math.PI / 2, Math.PI / 2);

    // Save the current position, as we're about to rebuild the camera matrix.
    const position = _wgpuMatrix.vec3.copy(this.position);

    // Reconstruct the camera's rotation, and store into the camera matrix.
    super.matrix = _wgpuMatrix.mat4.rotateX(_wgpuMatrix.mat4.rotationY(this.yaw), this.pitch);
    // super.matrix = mat4.rotateX(mat4.rotationY(this.yaw), -this.pitch);
    // super.matrix = mat4.rotateY(mat4.rotateX(this.pitch), this.yaw);

    // Calculate the new target velocity
    const digital = input.digital;
    const deltaRight = sign(digital.right, digital.left);
    const deltaUp = sign(digital.up, digital.down);
    const targetVelocity = _wgpuMatrix.vec3.create();
    const deltaBack = sign(digital.backward, digital.forward);
    _wgpuMatrix.vec3.addScaled(targetVelocity, this.right, deltaRight, targetVelocity);
    _wgpuMatrix.vec3.addScaled(targetVelocity, this.up, deltaUp, targetVelocity);
    _wgpuMatrix.vec3.addScaled(targetVelocity, this.back, deltaBack, targetVelocity);
    _wgpuMatrix.vec3.normalize(targetVelocity, targetVelocity);
    _wgpuMatrix.vec3.mulScalar(targetVelocity, this.movementSpeed, targetVelocity);

    // Mix new target velocity
    this.velocity = lerp(targetVelocity, this.velocity, Math.pow(1 - this.frictionCoefficient, deltaTime));

    // Integrate velocity to calculate new position
    this.position = _wgpuMatrix.vec3.addScaled(position, this.velocity, deltaTime);

    // Invert the camera matrix to build the view matrix
    this.view = _wgpuMatrix.mat4.invert(this.matrix);
    return this.view;
  }

  // Recalculates the yaw and pitch values from a directional vector
  recalculateAngles(dir) {
    this.yaw = Math.atan2(dir[0], dir[2]);
    this.pitch = -Math.asin(dir[1]);
  }
}

// ArcballCamera implements a basic orbiting camera around the world origin
exports.WASDCamera = WASDCamera;
class ArcballCamera extends CameraBase {
  // The camera distance from the target
  distance = 0;

  // The current angular velocity
  angularVelocity = 0;

  // The current rotation axis
  axis_ = _wgpuMatrix.vec3.create();

  // Returns the rotation axis
  get axis() {
    return this.axis_;
  }
  // Assigns `vec` to the rotation axis
  set axis(vec) {
    _wgpuMatrix.vec3.copy(vec, this.axis_);
  }

  // Speed multiplier for camera rotation
  rotationSpeed = 1;

  // Speed multiplier for camera zoom
  zoomSpeed = 0.1;

  // Rotation velocity drag coeffient [0 .. 1]
  // 0: Spins forever
  // 1: Instantly stops spinning
  frictionCoefficient = 0.999;

  // Construtor
  constructor(options) {
    super();
    if (options && options.position) {
      this.position = options.position;
      this.distance = _wgpuMatrix.vec3.len(this.position);
      this.back = _wgpuMatrix.vec3.normalize(this.position);
      this.recalcuateRight();
      this.recalcuateUp();
    }
  }

  // Returns the camera matrix
  get matrix() {
    return super.matrix;
  }

  // Assigns `mat` to the camera matrix, and recalcuates the distance
  set matrix(mat) {
    super.matrix = mat;
    this.distance = _wgpuMatrix.vec3.len(this.position);
  }
  update(deltaTime, input) {
    const epsilon = 0.0000001;
    if (input.analog.touching) {
      // Currently being dragged.
      this.angularVelocity = 0;
    } else {
      // Dampen any existing angular velocity
      this.angularVelocity *= Math.pow(1 - this.frictionCoefficient, deltaTime);
    }

    // Calculate the movement vector
    const movement = _wgpuMatrix.vec3.create();
    _wgpuMatrix.vec3.addScaled(movement, this.right, input.analog.x, movement);
    _wgpuMatrix.vec3.addScaled(movement, this.up, -input.analog.y, movement);

    // Cross the movement vector with the view direction to calculate the rotation axis x magnitude
    const crossProduct = _wgpuMatrix.vec3.cross(movement, this.back);

    // Calculate the magnitude of the drag
    const magnitude = _wgpuMatrix.vec3.len(crossProduct);
    if (magnitude > epsilon) {
      // Normalize the crossProduct to get the rotation axis
      this.axis = _wgpuMatrix.vec3.scale(crossProduct, 1 / magnitude);

      // Remember the current angular velocity. This is used when the touch is released for a fling.
      this.angularVelocity = magnitude * this.rotationSpeed;
    }

    // The rotation around this.axis to apply to the camera matrix this update
    const rotationAngle = this.angularVelocity * deltaTime;
    if (rotationAngle > epsilon) {
      // Rotate the matrix around axis
      // Note: The rotation is not done as a matrix-matrix multiply as the repeated multiplications
      // will quickly introduce substantial error into the matrix.
      this.back = _wgpuMatrix.vec3.normalize(rotate(this.back, this.axis, rotationAngle));
      this.recalcuateRight();
      this.recalcuateUp();
    }

    // recalculate `this.position` from `this.back` considering zoom
    if (input.analog.zoom !== 0) {
      this.distance *= 1 + input.analog.zoom * this.zoomSpeed;
    }
    this.position = _wgpuMatrix.vec3.scale(this.back, this.distance);

    // Invert the camera matrix to build the view matrix
    this.view = _wgpuMatrix.mat4.invert(this.matrix);
    return this.view;
  }

  // Assigns `this.right` with the cross product of `this.up` and `this.back`
  recalcuateRight() {
    this.right = _wgpuMatrix.vec3.normalize(_wgpuMatrix.vec3.cross(this.up, this.back));
  }

  // Assigns `this.up` with the cross product of `this.back` and `this.right`
  recalcuateUp() {
    this.up = _wgpuMatrix.vec3.normalize(_wgpuMatrix.vec3.cross(this.back, this.right));
  }
}

// Returns `x` clamped between [`min` .. `max`]
exports.ArcballCamera = ArcballCamera;
function clamp(x, min, max) {
  return Math.min(Math.max(x, min), max);
}

// Returns `x` float-modulo `div`
function mod(x, div) {
  return x - Math.floor(Math.abs(x) / div) * div * Math.sign(x);
}

// Returns `vec` rotated `angle` radians around `axis`
function rotate(vec, axis, angle) {
  return _wgpuMatrix.vec3.transformMat4Upper3x3(vec, _wgpuMatrix.mat4.rotation(axis, angle));
}

// Returns the linear interpolation between 'a' and 'b' using 's'
function lerp(a, b, s) {
  return _wgpuMatrix.vec3.addScaled(a, _wgpuMatrix.vec3.sub(b, a), s);
}

// Input holds as snapshot of input state
// export default interface Input {
//   // Digital input (e.g keyboard state)
//   readonly digital: {
//     readonly forward: boolean;
//     readonly backward: boolean;
//     readonly left: boolean;
//     readonly right: boolean;
//     readonly up: boolean;
//     readonly down: boolean;
//   };
//   // Analog input (e.g mouse, touchscreen)
//   readonly analog: {
//     readonly x: number;
//     readonly y: number;
//     readonly zoom: number;
//     readonly touching: boolean;
//   };
// }
// InputHandler is a function that when called, returns the current Input state.
// export type InputHandler = () => Input;
// createInputHandler returns an InputHandler by attaching event handlers to the window and canvas.
function createInputHandler(window, canvas) {
  let digital = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    up: false,
    down: false
  };
  let analog = {
    x: 0,
    y: 0,
    zoom: 0
  };
  let mouseDown = false;
  const setDigital = (e, value) => {
    switch (e.code) {
      case 'KeyW':
        digital.forward = value;
        e.preventDefault();
        e.stopPropagation();
        break;
      case 'KeyS':
        digital.backward = value;
        e.preventDefault();
        e.stopPropagation();
        break;
      case 'KeyA':
        digital.left = value;
        e.preventDefault();
        e.stopPropagation();
        break;
      case 'KeyD':
        digital.right = value;
        e.preventDefault();
        e.stopPropagation();
        break;
      case 'Space':
        digital.up = value;
        e.preventDefault();
        e.stopPropagation();
        break;
      case 'ShiftLeft':
      case 'ControlLeft':
      case 'KeyC':
        digital.down = value;
        e.preventDefault();
        e.stopPropagation();
        break;
    }
  };
  window.addEventListener('keydown', e => setDigital(e, true));
  window.addEventListener('keyup', e => setDigital(e, false));
  canvas.style.touchAction = 'pinch-zoom';
  canvas.addEventListener('pointerdown', () => {
    mouseDown = true;
  });
  canvas.addEventListener('pointerup', () => {
    mouseDown = false;
  });
  canvas.addEventListener('pointermove', e => {
    mouseDown = e.pointerType == 'mouse' ? (e.buttons & 1) !== 0 : true;
    if (mouseDown) {
      // console.log('TEST ', analog)
      analog.x += e.movementX / 10;
      analog.y += e.movementY / 10;
    }
  });
  canvas.addEventListener('wheel', e => {
    mouseDown = (e.buttons & 1) !== 0;
    if (mouseDown) {
      // The scroll value varies substantially between user agents / browsers.
      // Just use the sign.
      analog.zoom += Math.sign(e.deltaY);
      e.preventDefault();
      e.stopPropagation();
    }
  }, {
    passive: false
  });
  return () => {
    const out = {
      digital,
      analog: {
        x: analog.x,
        y: analog.y,
        zoom: analog.zoom,
        touching: mouseDown
      }
    };
    // Clear the analog values, as these accumulate.
    analog.x = 0;
    analog.y = 0;
    analog.zoom = 0;
    return out;
  };
}

},{"./utils":15,"wgpu-matrix":6}],10:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.makeObjSeqArg = exports.initMeshBuffers = exports.downloadMeshes = exports.constructMesh = void 0;
exports.play = play;
/**
 * The main Mesh class. The constructor will parse through the OBJ file data
 * and collect the vertex, vertex normal, texture, and face information. This
 * information can then be used later on when creating your VBOs. See
 * OBJ.initMeshBuffers for an example of how to use the newly created Mesh
 *
 * Nidza Note:
 * There is difference from me source obj loader and me-wgpu obj loader
 * Here we need scele in comp x,y,z because we use also primitive [cube, sphere etc...]
 * @class Mesh
 * @constructor
 *
 * @param {String} objectData a string representation of an OBJ file with newlines preserved.
 */

class constructMesh {
  constructor(objectData, inputArg) {
    this.inputArg = inputArg;
    this.objectData = objectData;
    this.create(objectData, inputArg);
    this.setScale = s => {
      this.inputArg.scale = s;
      this.create(this.objectData, this.inputArg);
    };
    this.updateBuffers = () => {
      this.inputArg.scale = [0.1, 0.1, 0.1];
      this.create(this.objectData, this.inputArg);
    };
  }
  create = (objectData, inputArg, callback) => {
    if (typeof callback === 'undefined') callback = function () {};
    let initOrientation = [0, 1, 2];
    /*
      The OBJ file format does a sort of compression when saving a model in a
      program like Blender. There are at least 3 sections (4 including textures)
      within the file. Each line in a section begins with the same string:
        * 'v': indicates vertex section
        * 'vn': indicates vertex normal section
        * 'f': indicates the faces section
        * 'vt': indicates vertex texture section (if textures were used on the model)
      Each of the above sections (except for the faces section) is a list/set of
      unique vertices.
      Each line of the faces section contains a list of
      (vertex, [texture], normal) groups
      Some examples:
          // the texture index is optional, both formats are possible for models
          // without a texture applied
          f 1/25 18/46 12/31
          f 1//25 18//46 12//31
          // A 3 vertex face with texture indices
          f 16/92/11 14/101/22 1/69/1
          // A 4 vertex face
          f 16/92/11 40/109/40 38/114/38 14/101/22
      The first two lines are examples of a 3 vertex face without a texture applied.
      The second is an example of a 3 vertex face with a texture applied.
      The third is an example of a 4 vertex face. Note: a face can contain N
      number of vertices.
      Each number that appears in one of the groups is a 1-based index
      corresponding to an item from the other sections (meaning that indexing
      starts at one and *not* zero).
      For example:
          `f 16/92/11` is saying to
            - take the 16th element from the [v] vertex array
            - take the 92nd element from the [vt] texture array
            - take the 11th element from the [vn] normal array
          and together they make a unique vertex.
      Using all 3+ unique Vertices from the face line will produce a polygon.
      Now, you could just go through the OBJ file and create a new vertex for
      each face line and WebGL will draw what appears to be the same model.
      However, vertices will be overlapped and duplicated all over the place.
      Consider a cube in 3D space centered about the origin and each side is
      2 units long. The front face (with the positive Z-axis pointing towards
      you) would have a Top Right vertex (looking orthogonal to its normal)
      mapped at (1,1,1) The right face would have a Top Left vertex (looking
      orthogonal to its normal) at (1,1,1) and the top face would have a Bottom
      Right vertex (looking orthogonal to its normal) at (1,1,1). Each face
      has a vertex at the same coordinates, however, three distinct vertices
      will be drawn at the same spot.
      To solve the issue of duplicate Vertices (the `(vertex, [texture], normal)`
      groups), while iterating through the face lines, when a group is encountered
      the whole group string ('16/92/11') is checked to see if it exists in the
      packed.hashindices object, and if it doesn't, the indices it specifies
      are used to look up each attribute in the corresponding attribute arrays
      already created. The values are then copied to the corresponding unpacked
      array (flattened to play nice with WebGL's ELEMENT_ARRAY_BUFFER indexing),
      the group string is added to the hashindices set and the current unpacked
      index is used as this hashindices value so that the group of elements can
      be reused. The unpacked index is incremented. If the group string already
      exists in the hashindices object, its corresponding value is the index of
      that group and is appended to the unpacked indices array.
      */
    var verts = [],
      vertNormals = [],
      textures = [],
      unpacked = {};
    // unpacking stuff
    unpacked.verts = [];
    unpacked.norms = [];
    unpacked.textures = [];
    unpacked.hashindices = {};
    unpacked.indices = [];
    unpacked.index = 0;
    // array of lines separated by the newline
    var lines = objectData.split('\n');

    // update swap orientation
    if (inputArg.swap[0] !== null) {
      swap(inputArg.swap[0], inputArg.swap[1], initOrientation);
    }
    var VERTEX_RE = /^v\s/;
    var NORMAL_RE = /^vn\s/;
    var TEXTURE_RE = /^vt\s/;
    var FACE_RE = /^f\s/;
    var WHITESPACE_RE = /\s+/;
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i].trim();
      var elements = line.split(WHITESPACE_RE);
      elements.shift();
      if (VERTEX_RE.test(line)) {
        // if this is a vertex
        verts.push.apply(verts, elements);
      } else if (NORMAL_RE.test(line)) {
        // if this is a vertex normal
        vertNormals.push.apply(vertNormals, elements);
      } else if (TEXTURE_RE.test(line)) {
        // if this is a texture
        textures.push.apply(textures, elements);
      } else if (FACE_RE.test(line)) {
        // if this is a face
        /*
          split this face into an array of vertex groups
          for example:
            f 16/92/11 14/101/22 1/69/1
          becomes:
            ['16/92/11', '14/101/22', '1/69/1'];
          */
        var quad = false;
        for (var j = 0, eleLen = elements.length; j < eleLen; j++) {
          // Triangulating quads
          // quad: 'f v0/t0/vn0 v1/t1/vn1 v2/t2/vn2 v3/t3/vn3/'
          // corresponding triangles:
          //      'f v0/t0/vn0 v1/t1/vn1 v2/t2/vn2'
          //      'f v2/t2/vn2 v3/t3/vn3 v0/t0/vn0'
          if (j === 3 && !quad) {
            // add v2/t2/vn2 in again before continuing to 3
            j = 2;
            quad = true;
          }
          if (elements[j] in unpacked.hashindices) {
            unpacked.indices.push(unpacked.hashindices[elements[j]]);
          } else {
            /*
                  Each element of the face line array is a vertex which has its
                  attributes delimited by a forward slash. This will separate
                  each attribute into another array:
                      '19/92/11'
                  becomes:
                      vertex = ['19', '92', '11'];
                  where
                      vertex[0] is the vertex index
                      vertex[1] is the texture index
                      vertex[2] is the normal index
                  Think of faces having Vertices which are comprised of the
                  attributes location (v), texture (vt), and normal (vn).
                  */
            var vertex = elements[j].split('/');
            /*
                  The verts, textures, and vertNormals arrays each contain a
                  flattend array of coordinates.
                  Because it gets confusing by referring to vertex and then
                  vertex (both are different in my descriptions) I will explain
                  what's going on using the vertexNormals array:
                  vertex[2] will contain the one-based index of the vertexNormals
                  section (vn). One is subtracted from this index number to play
                  nice with javascript's zero-based array indexing.
                  Because vertexNormal is a flattened array of x, y, z values,
                  simple pointer arithmetic is used to skip to the start of the
                  vertexNormal, then the offset is added to get the correct
                  component: +0 is x, +1 is y, +2 is z.
                  This same process is repeated for verts and textures.
                  */
            // vertex position
            unpacked.verts.push(+verts[(vertex[0] - 1) * 3 + initOrientation[0]] * inputArg.scale[0]);
            unpacked.verts.push(+verts[(vertex[0] - 1) * 3 + initOrientation[1]] * inputArg.scale[1]);
            unpacked.verts.push(+verts[(vertex[0] - 1) * 3 + initOrientation[2]] * inputArg.scale[2]);

            // vertex textures
            if (textures.length) {
              unpacked.textures.push(+textures[(vertex[1] - 1) * 2 + 0]);
              unpacked.textures.push(+textures[(vertex[1] - 1) * 2 + 1]);
            }
            // vertex normals
            unpacked.norms.push(+vertNormals[(vertex[2] - 1) * 3 + 0]);
            unpacked.norms.push(+vertNormals[(vertex[2] - 1) * 3 + 1]);
            unpacked.norms.push(+vertNormals[(vertex[2] - 1) * 3 + 2]);
            // add the newly created vertex to the list of indices
            unpacked.hashindices[elements[j]] = unpacked.index;
            unpacked.indices.push(unpacked.index);
            // increment the counter
            unpacked.index += 1;
          }
          if (j === 3 && quad) {
            // add v0/t0/vn0 onto the second triangle
            unpacked.indices.push(unpacked.hashindices[elements[0]]);
          }
        }
      }
    }
    this.vertices = unpacked.verts;
    this.vertexNormals = unpacked.norms;
    this.textures = unpacked.textures;
    this.indices = unpacked.indices;
    callback();
    return this;
  };
}
exports.constructMesh = constructMesh;
var Ajax = function () {
  // this is just a helper class to ease ajax calls
  var _this = this;
  this.xmlhttp = new XMLHttpRequest();
  this.get = function (url, callback) {
    _this.xmlhttp.onreadystatechange = function () {
      if (_this.xmlhttp.readyState === 4) {
        callback(_this.xmlhttp.responseText, _this.xmlhttp.status);
      }
    };
    _this.xmlhttp.open('GET', url, true);
    _this.xmlhttp.send();
  };
};

/**
 * Takes in an object of `mesh_name`, `'/url/to/OBJ/file'` pairs and a callback
 * function. Each OBJ file will be ajaxed in and automatically converted to
 * an OBJ.Mesh. When all files have successfully downloaded the callback
 * function provided will be called and passed in an object containing
 * the newly created meshes.
 *
 * **Note:** In order to use this function as a way to download meshes, a
 * webserver of some sort must be used.
 *
 * @param {Object} nameAndURLs an object where the key is the name of the mesh and the value is the url to that mesh's OBJ file
 *
 * @param {Function} completionCallback should contain a function that will take one parameter: an object array where the keys will be the unique object name and the value will be a Mesh object
 *
 * @param {Object} meshes In case other meshes are loaded separately or if a previously declared variable is desired to be used, pass in a (possibly empty) json object of the pattern: { '<mesh_name>': OBJ.Mesh }
 *
 */
var downloadMeshes = function (nameAndURLs, completionCallback, inputArg) {
  // the total number of meshes. this is used to implement "blocking"
  var semaphore = Object.keys(nameAndURLs).length;
  // if error is true, an alert will given
  var error = false;
  // this is used to check if all meshes have been downloaded
  // if meshes is supplied, then it will be populated, otherwise
  // a new object is created. this will be passed into the completionCallback
  if (typeof inputArg === 'undefined') {
    var inputArg = {
      scale: [0.1, 0.1, 0.1],
      swap: [null]
    };
  }
  if (typeof inputArg.scale === 'undefined') inputArg.scale = [0.1, 0.1, 0.1];
  if (typeof inputArg.swap === 'undefined') inputArg.swap = [null];
  var meshes = {};

  // loop over the mesh_name,url key,value pairs
  for (var mesh_name in nameAndURLs) {
    if (nameAndURLs.hasOwnProperty(mesh_name)) {
      new Ajax().get(nameAndURLs[mesh_name], function (name) {
        return function (data, status) {
          if (status === 200) {
            meshes[name] = new constructMesh(data, inputArg);
          } else {
            error = true;
            console.error('An error has occurred and the mesh "' + name + '" could not be downloaded.');
          }
          // the request has finished, decrement the counter
          semaphore--;
          if (semaphore === 0) {
            if (error) {
              // if an error has occurred, the user is notified here and the
              // callback is not called
              console.error('An error has occurred and one or meshes has not been ' + 'downloaded. The execution of the script has terminated.');
              throw '';
            }
            // there haven't been any errors in retrieving the meshes
            // call the callback
            completionCallback(meshes);
          }
        };
      }(mesh_name));
    }
  }
};

/**
 * Takes in the WebGL context and a Mesh, then creates and appends the buffers
 * to the mesh object as attributes.
 *
 * @param {WebGLRenderingContext} gl the `canvas.getContext('webgl')` context instance
 * @param {Mesh} mesh a single `OBJ.Mesh` instance
 *
 * The newly created mesh attributes are:
 *
 * Attrbute | Description
 * :--- | ---
 * **normalBuffer**       |contains the model&#39;s Vertex Normals
 * normalBuffer.itemSize  |set to 3 items
 * normalBuffer.numItems  |the total number of vertex normals
 * |
 * **textureBuffer**      |contains the model&#39;s Texture Coordinates
 * textureBuffer.itemSize |set to 2 items
 * textureBuffer.numItems |the number of texture coordinates
 * |
 * **vertexBuffer**       |contains the model&#39;s Vertex Position Coordinates (does not include w)
 * vertexBuffer.itemSize  |set to 3 items
 * vertexBuffer.numItems  |the total number of vertices
 * |
 * **indexBuffer**        |contains the indices of the faces
 * indexBuffer.itemSize   |is set to 1
 * indexBuffer.numItems   |the total number of indices
 *
 * A simple example (a lot of steps are missing, so don't copy and paste):
 *
 *     var gl   = canvas.getContext('webgl'),
 *         mesh = OBJ.Mesh(obj_file_data);
 *     // compile the shaders and create a shader program
 *     var shaderProgram = gl.createProgram();
 *     // compilation stuff here
 *     ...
 *     // make sure you have vertex, vertex normal, and texture coordinate
 *     // attributes located in your shaders and attach them to the shader program
 *     shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
 *     gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);
 *
 *     shaderProgram.vertexNormalAttribute = gl.getAttribLocation(shaderProgram, "aVertexNormal");
 *     gl.enableVertexAttribArray(shaderProgram.vertexNormalAttribute);
 *
 *     shaderProgram.textureCoordAttribute = gl.getAttribLocation(shaderProgram, "aTextureCoord");
 *     gl.enableVertexAttribArray(shaderProgram.textureCoordAttribute);
 *
 *     // create and initialize the vertex, vertex normal, and texture coordinate buffers
 *     // and save on to the mesh object
 *     OBJ.initMeshBuffers(gl, mesh);
 *
 *     // now to render the mesh
 *     gl.bindBuffer(gl.ARRAY_BUFFER, mesh.vertexBuffer);
 *     gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, mesh.vertexBuffer.itemSize, gl.FLOAT, false, 0, 0);
 *     // it's possible that the mesh doesn't contain
 *     // any texture coordinates (e.g. suzanne.obj in the development branch).
 *     // in this case, the texture vertexAttribArray will need to be disabled
 *     // before the call to drawElements
 *     if(!mesh.textures.length){
 *       gl.disableVertexAttribArray(shaderProgram.textureCoordAttribute);
 *     }
 *     else{
 *       // if the texture vertexAttribArray has been previously
 *       // disabled, then it needs to be re-enabled
 *       gl.enableVertexAttribArray(shaderProgram.textureCoordAttribute);
 *       gl.bindBuffer(gl.ARRAY_BUFFER, mesh.textureBuffer);
 *       gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, mesh.textureBuffer.itemSize, gl.FLOAT, false, 0, 0);
 *     }
 *
 *     gl.bindBuffer(gl.ARRAY_BUFFER, mesh.normalBuffer);
 *     gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, mesh.normalBuffer.itemSize, gl.FLOAT, false, 0, 0);
 *
 *     gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.mesh.indexBuffer);
 *     gl.drawElements(gl.TRIANGLES, model.mesh.indexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
 */
exports.downloadMeshes = downloadMeshes;
var initMeshBuffers = function (gl, mesh) {
  // mesh.vertexNormals
  // mesh.textures
  // mesh.vertices
  // mesh.indices
};

/**
 * @description
 * Construct sequence list argument for downloadMeshes.
 * This is adaptation for blender obj animation export.
 * For example:
 *    matrixEngine.objLoader.downloadMeshes(
      matrixEngine.objLoader.makeObjSeqArg(
        {
          id: objName,
          joinMultiPahts: [
            {
              path: "res/bvh-skeletal-base/swat-guy/seq-walk/low/swat",
              id: objName,
              from: 1, to: 34
            },
            {
              path: "res/bvh-skeletal-base/swat-guy/seq-walk-pistol/low/swat-walk-pistol",
              id: objName,
              from: 35, to: 54
            }
          ]
        }),
      onLoadObj
    );
 */
exports.initMeshBuffers = initMeshBuffers;
const makeObjSeqArg = arg => {
  // Adaptation for blender (animation) obj exporter.
  var local = {};
  function localCalc(arg, noInitial = false) {
    var zeros = '00000';
    var l = {};
    var helper = arg.from;
    for (let j = arg.from, z = 1; j <= arg.to; j++) {
      if (z > 9 && z < 99) {
        zeros = '0000';
      } else if (z > 99 && z < 999) {
        zeros = '000';
      } // no need more then 999

      if (helper == arg.from && noInitial === false) {
        l[arg.id] = arg.path + '_' + zeros + z + '.obj';
      } else {
        l[arg.id + (helper - 1)] = arg.path + '_' + zeros + z + '.obj';
      }
      helper++;
      z++;
    }
    return l;
  }
  if (typeof arg.path === 'string') {
    local = localCalc(arg);
  } else if (typeof arg.path === 'undefined') {
    if (typeof arg.joinMultiPahts !== 'undefined') {
      console.log("ITS joinMultiPahts!");
      var localFinal = {};
      arg.joinMultiPahts.forEach((arg, index) => {
        if (index === 0) {
          localFinal = Object.assign(local, localCalc(arg));
        } else {
          localFinal = Object.assign(local, localCalc(arg, true));
        }
      });
      console.log("joinMultiPahts LOCAL => ", localFinal);
      return localFinal;
    }
  }
  return local;
};

/**
 * @description
 * Switching obj seq animations frames range.
 */
exports.makeObjSeqArg = makeObjSeqArg;
function play(nameAni) {
  this.animation.anims.active = nameAni;
  this.animation.currentAni = this.animation.anims[this.animation.anims.active].from;
}

},{}],11:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Rotation = exports.Position = void 0;
var _utils = require("./utils");
/**
 * @description 
 * Sub classes for matrix-wgpu
 * Base class
 * Position { x, y, z }
 */

class Position {
  constructor(x, y, z) {
    // console.log('TEST TYTPOF ', x)
    // Not in use for nwo this is from matrix-engine project [nameUniq]
    this.nameUniq = null;
    if (typeof x == 'undefined') x = 0;
    if (typeof y == 'undefined') y = 0;
    if (typeof z == 'undefined') z = 0;
    this.x = parseFloat(x);
    this.y = parseFloat(y);
    this.z = parseFloat(z);
    this.velY = 0;
    this.velX = 0;
    this.velZ = 0;
    this.inMove = false;
    this.targetX = parseFloat(x);
    this.targetY = parseFloat(y);
    this.targetZ = parseFloat(z);
    this.thrust = 0.01;
    return this;
  }
  setSpeed(n) {
    if (typeof n === 'number') {
      this.thrust = n;
    } else {
      console.log('Description: arguments (w, h) must be type of number.');
    }
  }
  translateByX(x) {
    this.inMove = true;
    this.targetX = parseFloat(x);
  }
  translateByY(y) {
    this.inMove = true;
    this.targetY = parseFloat(y);
  }
  translateByZ(z) {
    this.inMove = true;
    this.targetZ = parseFloat(z);
  }
  translateByXY(x, y) {
    this.inMove = true;
    this.targetX = parseFloat(x);
    this.targetY = parseFloat(y);
  }
  translateByXZ(x, z) {
    this.inMove = true;
    this.targetX = parseFloat(x);
    this.targetZ = parseFloat(z);
  }
  translateByYZ(y, z) {
    this.inMove = true;
    this.targetY = parseFloat(y);
    this.targetZ = parseFloat(z);
  }
  onTargetPositionReach() {}
  update() {
    var tx = parseFloat(this.targetX) - parseFloat(this.x),
      ty = parseFloat(this.targetY) - parseFloat(this.y),
      tz = parseFloat(this.targetZ) - parseFloat(this.z),
      dist = Math.sqrt(tx * tx + ty * ty + tz * tz);
    this.velX = tx / dist * this.thrust;
    this.velY = ty / dist * this.thrust;
    this.velZ = tz / dist * this.thrust;
    if (this.inMove == true) {
      if (dist > this.thrust) {
        this.x += this.velX;
        this.y += this.velY;
        this.z += this.velZ;

        // // from me
        // if(net && net.connection && typeof em === 'undefined' && App.scene[this.nameUniq].net.enable == true) net.connection.send({
        //   netPos: {x: this.x, y: this.y, z: this.z},
        //   netObjId: this.nameUniq,
        // });
      } else {
        this.x = this.targetX;
        this.y = this.targetY;
        this.z = this.targetZ;
        this.inMove = false;
        this.onTargetPositionReach();

        // // from me
        // if(net && net.connection && typeof em === 'undefined' && App.scene[this.nameUniq].net.enable == true) net.connection.send({
        //   netPos: {x: this.x, y: this.y, z: this.z},
        //   netObjId: this.nameUniq,
        // });
      }
    }
  }
  get worldLocation() {
    return [parseFloat(this.x), parseFloat(this.y), parseFloat(this.z)];
  }
  SetX(newx, em) {
    this.x = newx;
    this.targetX = newx;
    this.inMove = false;

    // if(net && net.connection && typeof em === 'undefined' &&
    //   App.scene[this.nameUniq].net && App.scene[this.nameUniq].net.enable == true) {
    //   net.connection.send({
    //     netPos: {x: this.x, y: this.y, z: this.z},
    //     netObjId: this.nameUniq,
    //   });
    // }
  }
  SetY(newy, em) {
    this.y = newy;
    this.targetY = newy;
    this.inMove = false;
    // if(net && net.connection && typeof em === 'undefined' &&
    //   App.scene[this.nameUniq].net && App.scene[this.nameUniq].net.enable == true) net.connection.send({
    //     netPos: {x: this.x, y: this.y, z: this.z},
    //     netObjId: this.nameUniq,
    //   });
  }
  SetZ(newz, em) {
    this.z = newz;
    this.targetZ = newz;
    this.inMove = false;
    // if(net && net.connection && typeof em === 'undefined' &&
    //   App.scene[this.nameUniq].net && App.scene[this.nameUniq].net.enable == true) net.connection.send({
    //     netPos: {x: this.x, y: this.y, z: this.z},
    //     netObjId: this.nameUniq,
    //   });
  }
  get X() {
    return parseFloat(this.x);
  }
  get Y() {
    return parseFloat(this.y);
  }
  get Z() {
    return parseFloat(this.z);
  }
  setPosition(newx, newy, newz) {
    this.x = newx;
    this.y = newy;
    this.z = newz;
    this.targetX = newx;
    this.targetY = newy;
    this.targetZ = newz;
    this.inMove = false;

    // from me
    // if(App.scene[this.nameUniq] && net && net.connection && typeof em === 'undefined' &&
    //   App.scene[this.nameUniq].net && App.scene[this.nameUniq].net.enable == true) net.connection.send({
    //     netPos: {x: this.x, y: this.y, z: this.z},
    //     netObjId: this.nameUniq,
    //   });
  }
}
exports.Position = Position;
class Rotation {
  constructor(x, y, z) {
    // Not in use for nwo this is from matrix-engine project [nameUniq]
    this.nameUniq = null;
    if (typeof x == 'undefined') x = 0;
    if (typeof y == 'undefined') y = 0;
    if (typeof z == 'undefined') z = 0;
    this.x = x;
    this.y = y;
    this.z = z;
    this.rotationSpeed = {
      x: 0,
      y: 0,
      z: 0
    };
    this.angle = 0;
    this.axis = {
      x: 0,
      y: 0,
      z: 0
    };
    // not in use good for exstend logic
    this.matrixRotation = null;
  }
  toDegree() {
    /*
    heading = atan2(y * sin(angle)- x * z * (1 - cos(angle)) , 1 - (y2 + z2 ) * (1 - cos(angle)))
    attitude = asin(x * y * (1 - cos(angle)) + z * sin(angle))
    bank = atan2(x * sin(angle)-y * z * (1 - cos(angle)) , 1 - (x2 + z2) * (1 - cos(angle)))
    */
    return [(0, _utils.radToDeg)(this.axis.x), (0, _utils.radToDeg)(this.axis.y), (0, _utils.radToDeg)(this.axis.z)];
  }
  toDegreeX() {
    return Math.cos((0, _utils.radToDeg)(this.axis.x) / 2);
  }
  toDegreeY() {
    return Math.cos((0, _utils.radToDeg)(this.axis.z) / 2);
  }
  toDegreeZ() {
    return Math.cos((0, _utils.radToDeg)(this.axis.y) / 2);
  }
  getRotX() {
    if (this.rotationSpeed.x == 0) {
      return (0, _utils.degToRad)(this.x);
    } else {
      this.x = this.x + this.rotationSpeed.x * 0.001;
      return (0, _utils.degToRad)(this.x);
    }
  }
  getRotY() {
    if (this.rotationSpeed.y == 0) {
      return (0, _utils.degToRad)(this.y);
    } else {
      this.y = this.y + this.rotationSpeed.y * 0.001;
      return (0, _utils.degToRad)(this.y);
    }
  }
  getRotZ() {
    if (this.rotationSpeed.z == 0) {
      return (0, _utils.degToRad)(this.z);
    } else {
      this.z = this.z + this.rotationSpeed.z * 0.001;
      return (0, _utils.degToRad)(this.z);
    }
  }
}
exports.Rotation = Rotation;

},{"./utils":15}],12:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _wgpuMatrix = require("wgpu-matrix");
var _matrixClass = require("./matrix-class");
var _engine = require("./engine");
var _vertexShadow = require("../shaders/vertexShadow.wgsl");
var _fragment = require("../shaders/fragment.wgsl");
var _vertex = require("../shaders/vertex.wgsl");
var _utils = require("./utils");
var _raycast = require("./raycast");
class MEMeshObj {
  constructor(canvas, device, context, o) {
    if (typeof o.name === 'undefined') o.name = (0, _utils.genName)(9);
    if (typeof o.raycast === 'undefined') {
      this.raycast = {
        enabled: false,
        radius: 2
      };
    } else {
      this.raycast = o.raycast;
    }
    this.name = o.name;
    this.done = false;
    this.device = device;
    this.context = context;
    this.entityArgPass = o.entityArgPass;

    // Mesh stuff
    this.mesh = o.mesh;
    this.mesh.uvs = this.mesh.textures;
    console.log(`%c Mesh loaded: ${o.name}`, _utils.LOG_FUNNY_SMALL);
    this.inputHandler = (0, _engine.createInputHandler)(window, canvas);
    this.cameras = o.cameras;
    this.mainCameraParams = {
      type: o.mainCameraParams.type,
      responseCoef: o.mainCameraParams.responseCoef
    };

    // touchCoordinate.enabled = true;

    this.lastFrameMS = 0;
    this.texturesPaths = [];
    o.texturesPaths.forEach(t => {
      this.texturesPaths.push(t);
    });
    this.presentationFormat = navigator.gpu.getPreferredCanvasFormat();
    this.position = new _matrixClass.Position(o.position.x, o.position.y, o.position.z);
    this.rotation = new _matrixClass.Rotation(o.rotation.x, o.rotation.y, o.rotation.z);
    this.rotation.rotationSpeed.x = o.rotationSpeed.x;
    this.rotation.rotationSpeed.y = o.rotationSpeed.y;
    this.rotation.rotationSpeed.z = o.rotationSpeed.z;
    this.scale = o.scale;
    this.runProgram = () => {
      return new Promise(async resolve => {
        this.shadowDepthTextureSize = 1024;
        const aspect = canvas.width / canvas.height;
        this.projectionMatrix = _wgpuMatrix.mat4.perspective(2 * Math.PI / 5, aspect, 1, 2000.0);
        this.modelViewProjectionMatrix = _wgpuMatrix.mat4.create();
        // console.log('cube added texturesPaths: ', this.texturesPaths)
        this.loadTex0(this.texturesPaths, device).then(() => {
          // console.log('loaded tex buffer for mesh:', this.texture0)
          resolve();
        });
      });
    };
    this.runProgram().then(() => {
      const aspect = canvas.width / canvas.height;
      const presentationFormat = navigator.gpu.getPreferredCanvasFormat();
      this.context.configure({
        device: this.device,
        format: presentationFormat,
        alphaMode: 'premultiplied'
      });

      // Create the model vertex buffer.
      this.vertexBuffer = this.device.createBuffer({
        size: this.mesh.vertices.length * Float32Array.BYTES_PER_ELEMENT,
        usage: GPUBufferUsage.VERTEX,
        mappedAtCreation: true
      });
      {
        // const mapping = new Float32Array(this.vertexBuffer.getMappedRange());
        // // for(let i = 0;i < this.mesh.vertices.length;++i) {
        // //   mapping.set(this.mesh.vertices[i], 6 * i);
        // //   mapping.set(this.mesh.normals[i], 6 * i + 3);
        // // }
        // this.vertexBuffer.unmap();
        new Float32Array(this.vertexBuffer.getMappedRange()).set(this.mesh.vertices);
        this.vertexBuffer.unmap();
      }

      // NIDZA TEST SECOUND BUFFER
      // Create the model vertex buffer.
      this.vertexNormalsBuffer = this.device.createBuffer({
        size: this.mesh.vertexNormals.length * Float32Array.BYTES_PER_ELEMENT,
        usage: GPUBufferUsage.VERTEX,
        mappedAtCreation: true
      });
      {
        new Float32Array(this.vertexNormalsBuffer.getMappedRange()).set(this.mesh.vertexNormals);
        this.vertexNormalsBuffer.unmap();
      }
      this.vertexTexCoordsBuffer = this.device.createBuffer({
        size: this.mesh.textures.length * Float32Array.BYTES_PER_ELEMENT,
        usage: GPUBufferUsage.VERTEX,
        mappedAtCreation: true
      });
      {
        new Float32Array(this.vertexTexCoordsBuffer.getMappedRange()).set(this.mesh.textures);
        this.vertexTexCoordsBuffer.unmap();
      }

      // Create the model index buffer.
      this.indexCount = this.mesh.indices.length;
      this.indexBuffer = this.device.createBuffer({
        size: this.indexCount * Uint16Array.BYTES_PER_ELEMENT,
        usage: GPUBufferUsage.INDEX,
        mappedAtCreation: true
      });
      {
        // const mapping = new Uint16Array(this.indexBuffer.getMappedRange());
        // for(let i = 0;i < this.mesh.indices.length;++i) {
        //   mapping.set(this.mesh.indices[i], i);
        // }
        new Uint16Array(this.indexBuffer.getMappedRange()).set(this.mesh.indices);
        this.indexBuffer.unmap();
      }

      // Create the depth texture for rendering/sampling the shadow map.
      this.shadowDepthTexture = this.device.createTexture({
        size: [this.shadowDepthTextureSize, this.shadowDepthTextureSize, 1],
        usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
        format: 'depth32float'
      });
      this.shadowDepthTextureView = this.shadowDepthTexture.createView();

      // Create some common descriptors used for both the shadow pipeline
      // and the color rendering pipeline.
      this.vertexBuffers = [{
        arrayStride: Float32Array.BYTES_PER_ELEMENT * 3,
        attributes: [{
          // position
          shaderLocation: 0,
          offset: 0,
          format: "float32x3"
        }]
      }, {
        arrayStride: Float32Array.BYTES_PER_ELEMENT * 3,
        attributes: [{
          // normal
          shaderLocation: 1,
          offset: 0,
          format: "float32x3"
        }]
      }, {
        arrayStride: Float32Array.BYTES_PER_ELEMENT * 2,
        attributes: [{
          // uvs
          shaderLocation: 2,
          offset: 0,
          format: "float32x2"
        }]
      }];
      const primitive = {
        topology: 'triangle-list',
        cullMode: 'back'
      };
      this.uniformBufferBindGroupLayout = this.device.createBindGroupLayout({
        entries: [{
          binding: 0,
          visibility: GPUShaderStage.VERTEX,
          buffer: {
            type: 'uniform'
          }
        }]
      });
      this.shadowPipeline = this.device.createRenderPipeline({
        layout: this.device.createPipelineLayout({
          bindGroupLayouts: [this.uniformBufferBindGroupLayout, this.uniformBufferBindGroupLayout]
        }),
        vertex: {
          module: this.device.createShaderModule({
            code: _vertexShadow.vertexShadowWGSL
          }),
          buffers: this.vertexBuffers
        },
        depthStencil: {
          depthWriteEnabled: true,
          depthCompare: 'less',
          format: 'depth32float'
        },
        primitive
      });

      // Create a bind group layout which holds the scene uniforms and
      // the texture+sampler for depth. We create it manually because the WebPU
      // implementation doesn't infer this from the shader (yet).
      this.bglForRender = this.device.createBindGroupLayout({
        entries: [{
          binding: 0,
          visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
          buffer: {
            type: 'uniform'
          }
        }, {
          binding: 1,
          visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
          texture: {
            sampleType: 'depth'
          }
        }, {
          binding: 2,
          visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
          sampler: {
            type: 'comparison'
          }
        }, {
          binding: 3,
          visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
          texture: {
            sampleType: 'float'
          }
        }, {
          binding: 4,
          visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
          sampler: {
            type: 'filtering'
          }
        }]
      });
      this.pipeline = this.device.createRenderPipeline({
        layout: this.device.createPipelineLayout({
          bindGroupLayouts: [this.bglForRender, this.uniformBufferBindGroupLayout]
        }),
        vertex: {
          module: this.device.createShaderModule({
            code: _vertex.vertexWGSL
          }),
          buffers: this.vertexBuffers
        },
        fragment: {
          module: this.device.createShaderModule({
            code: _fragment.fragmentWGSL
          }),
          targets: [{
            format: presentationFormat
          }],
          constants: {
            shadowDepthTextureSize: this.shadowDepthTextureSize
          }
        },
        depthStencil: {
          depthWriteEnabled: true,
          depthCompare: 'less',
          format: 'depth24plus-stencil8'
        },
        primitive
      });
      const depthTexture = this.device.createTexture({
        size: [canvas.width, canvas.height],
        format: 'depth24plus-stencil8',
        usage: GPUTextureUsage.RENDER_ATTACHMENT
      });
      this.renderPassDescriptor = {
        colorAttachments: [{
          // view is acquired and set in render loop.
          view: undefined,
          clearValue: {
            r: 0.5,
            g: 0.5,
            b: 0.5,
            a: 1.0
          },
          loadOp: 'load',
          storeOp: 'store'
        }],
        depthStencilAttachment: {
          view: depthTexture.createView(),
          depthClearValue: 1.0,
          depthLoadOp: 'clear',
          depthStoreOp: 'store',
          stencilClearValue: 0,
          stencilLoadOp: 'clear',
          stencilStoreOp: 'store'
        }
      };
      this.modelUniformBuffer = this.device.createBuffer({
        size: 4 * 16,
        // 4x4 matrix
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
      });
      this.sceneUniformBuffer = this.device.createBuffer({
        // Two 4x4 viewProj matrices,
        // one for the camera and one for the light.
        // Then a vec3 for the light position.
        // Rounded to the nearest multiple of 16.
        size: 2 * 4 * 16 + 4 * 4,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
      });
      this.sceneBindGroupForShadow = this.device.createBindGroup({
        layout: this.uniformBufferBindGroupLayout,
        entries: [{
          binding: 0,
          resource: {
            buffer: this.sceneUniformBuffer
          }
        }]
      });
      this.sceneBindGroupForRender = this.device.createBindGroup({
        layout: this.bglForRender,
        entries: [{
          binding: 0,
          resource: {
            buffer: this.sceneUniformBuffer
          }
        }, {
          binding: 1,
          resource: this.shadowDepthTextureView
        }, {
          binding: 2,
          resource: this.device.createSampler({
            compare: 'less'
          })
        }, {
          binding: 3,
          resource: this.texture0.createView()
        }, {
          binding: 4,
          resource: this.sampler
        }]
      });
      this.modelBindGroup = this.device.createBindGroup({
        layout: this.uniformBufferBindGroupLayout,
        entries: [{
          binding: 0,
          resource: {
            buffer: this.modelUniformBuffer
          }
        }]
      });

      // Rotates the camera around the origin based on time.
      this.getTransformationMatrix = pos => {
        const now = Date.now();
        const deltaTime = (now - this.lastFrameMS) / this.mainCameraParams.responseCoef;
        this.lastFrameMS = now;
        // const this.viewMatrix = mat4.identity()
        const camera = this.cameras[this.mainCameraParams.type];
        this.viewMatrix = camera.update(deltaTime, this.inputHandler());
        _wgpuMatrix.mat4.translate(this.viewMatrix, _wgpuMatrix.vec3.fromValues(pos.x, pos.y, pos.z), this.viewMatrix);
        _wgpuMatrix.mat4.rotate(this.viewMatrix, _wgpuMatrix.vec3.fromValues(this.rotation.axis.x, this.rotation.axis.y, this.rotation.axis.z), (0, _utils.degToRad)(this.rotation.angle), this.viewMatrix);

        // console.info('angle: ', this.rotation.angle, ' axis ' ,  this.rotation.axis.x, ' , ', this.rotation.axis.y, ' , ',  this.rotation.axis.z)
        _wgpuMatrix.mat4.multiply(this.projectionMatrix, this.viewMatrix, this.modelViewProjectionMatrix);
        return this.modelViewProjectionMatrix;
      };
      this.upVector = _wgpuMatrix.vec3.fromValues(0, 1, 0);
      this.origin = _wgpuMatrix.vec3.fromValues(0, 0, 0);
      this.lightPosition = _wgpuMatrix.vec3.fromValues(0, 0, 0);
      this.lightViewMatrix = _wgpuMatrix.mat4.lookAt(this.lightPosition, this.origin, this.upVector);
      const lightProjectionMatrix = _wgpuMatrix.mat4.create();
      var myLMargin = 100;
      {
        const left = -myLMargin;
        const right = myLMargin;
        const bottom = -myLMargin;
        const top = myLMargin;
        const near = -200;
        const far = 300;
        _wgpuMatrix.mat4.ortho(left, right, bottom, top, near, far, lightProjectionMatrix);
        // test 
        // mat4.ortho(right, left, top, bottom, near, far, lightProjectionMatrix);
      }
      this.lightViewProjMatrix = _wgpuMatrix.mat4.multiply(lightProjectionMatrix, this.lightViewMatrix);

      // looks like affect on transformations for now const 0
      const modelMatrix = _wgpuMatrix.mat4.translation([0, 0, 0]);
      // The camera/light aren't moving, so write them into buffers now.
      {
        const lightMatrixData = this.lightViewProjMatrix; // as Float32Array;
        this.device.queue.writeBuffer(this.sceneUniformBuffer, 0, lightMatrixData.buffer, lightMatrixData.byteOffset, lightMatrixData.byteLength);
        const lightData = this.lightPosition;
        this.device.queue.writeBuffer(this.sceneUniformBuffer, 128, lightData.buffer, lightData.byteOffset, lightData.byteLength);
        const modelData = modelMatrix;
        this.device.queue.writeBuffer(this.modelUniformBuffer, 0, modelData.buffer, modelData.byteOffset, modelData.byteLength);
      }
      this.shadowPassDescriptor = {
        colorAttachments: [],
        depthStencilAttachment: {
          view: this.shadowDepthTextureView,
          depthClearValue: 1.0,
          depthLoadOp: 'clear',
          depthStoreOp: 'store'
        }
      };
      this.done = true;
    });
  }
  updateLightsTest = position => {
    console.log('Update light position.', position);
    this.lightPosition = _wgpuMatrix.vec3.fromValues(position[0], position[1], position[2]);
    this.lightViewMatrix = _wgpuMatrix.mat4.lookAt(this.lightPosition, this.origin, this.upVector);
    const lightProjectionMatrix = _wgpuMatrix.mat4.create();
    {
      const left = -80;
      const right = 80;
      const bottom = -80;
      const top = 80;
      const near = -200;
      const far = 300;
      _wgpuMatrix.mat4.ortho(left, right, bottom, top, near, far, lightProjectionMatrix);
    }
    this.lightViewProjMatrix = _wgpuMatrix.mat4.multiply(lightProjectionMatrix, this.lightViewMatrix);

    // looks like affect on transformations for now const 0
    const modelMatrix = _wgpuMatrix.mat4.translation([0, 0, 0]);
    // The camera/light aren't moving, so write them into buffers now.
    {
      const lightMatrixData = this.lightViewProjMatrix; // as Float32Array;
      this.device.queue.writeBuffer(this.sceneUniformBuffer, 0,
      // 0 ori
      lightMatrixData.buffer, lightMatrixData.byteOffset, lightMatrixData.byteLength);
      const lightData = this.lightPosition;
      this.device.queue.writeBuffer(this.sceneUniformBuffer, 256, lightData.buffer, lightData.byteOffset, lightData.byteLength);
      const modelData = modelMatrix;
      this.device.queue.writeBuffer(this.modelUniformBuffer, 0, modelData.buffer, modelData.byteOffset, modelData.byteLength);
    }
    this.shadowPassDescriptor = {
      colorAttachments: [],
      depthStencilAttachment: {
        view: this.shadowDepthTextureView,
        depthClearValue: 1.0,
        // ori 1.0
        depthLoadOp: 'clear',
        depthStoreOp: 'store'
      }
    };

    ///////////////////////
  };
  async loadTex0(texturesPaths, device) {
    this.sampler = device.createSampler({
      magFilter: 'linear',
      minFilter: 'linear'
    });
    return new Promise(async resolve => {
      const response = await fetch(texturesPaths[0]);
      const imageBitmap = await createImageBitmap(await response.blob());
      this.texture0 = device.createTexture({
        size: [imageBitmap.width, imageBitmap.height, 1],
        format: 'rgba8unorm',
        usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT
      });
      device.queue.copyExternalImageToTexture({
        source: imageBitmap
      }, {
        texture: this.texture0
      }, [imageBitmap.width, imageBitmap.height]);
      resolve();
    });
  }
  draw = commandEncoder => {
    if (this.done == false) return;
    const transformationMatrix = this.getTransformationMatrix(this.position);
    this.device.queue.writeBuffer(this.sceneUniformBuffer, 64, transformationMatrix.buffer, transformationMatrix.byteOffset, transformationMatrix.byteLength);
    this.renderPassDescriptor.colorAttachments[0].view = this.context.getCurrentTexture().createView();
  };
  drawElements = renderPass => {
    renderPass.setBindGroup(0, this.sceneBindGroupForRender);
    renderPass.setBindGroup(1, this.modelBindGroup);
    renderPass.setVertexBuffer(0, this.vertexBuffer);
    renderPass.setVertexBuffer(1, this.vertexNormalsBuffer);
    renderPass.setVertexBuffer(2, this.vertexTexCoordsBuffer);
    renderPass.setIndexBuffer(this.indexBuffer, 'uint16');
    renderPass.drawIndexed(this.indexCount);
  };
  drawShadows = shadowPass => {
    shadowPass.setBindGroup(0, this.sceneBindGroupForShadow);
    shadowPass.setBindGroup(1, this.modelBindGroup);
    shadowPass.setVertexBuffer(0, this.vertexBuffer);
    shadowPass.setVertexBuffer(1, this.vertexNormalsBuffer);
    shadowPass.setVertexBuffer(2, this.vertexTexCoordsBuffer);
    shadowPass.setIndexBuffer(this.indexBuffer, 'uint16');
    shadowPass.drawIndexed(this.indexCount);
  };
}
exports.default = MEMeshObj;

},{"../shaders/fragment.wgsl":18,"../shaders/vertex.wgsl":20,"../shaders/vertexShadow.wgsl":21,"./engine":9,"./matrix-class":11,"./raycast":14,"./utils":15,"wgpu-matrix":6}],13:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _wgpuMatrix = require("wgpu-matrix");
var _matrixClass = require("./matrix-class");
var _engine = require("./engine");
var _vertexShadow = require("../shaders/vertexShadow.wgsl");
var _fragment = require("../shaders/fragment.wgsl");
var _vertex = require("../shaders/vertex.wgsl");
var _loaderObj = require("./loader-obj");
class MEMesh {
  constructor(canvas, device, context, o) {
    this.done = false;
    this.device = device;
    this.context = context;
    this.entityArgPass = o.entityArgPass;
    this.mesh = o.mesh;
    this.inputHandler = (0, _engine.createInputHandler)(window, canvas);
    this.cameras = o.cameras;
    this.mainCameraParams = {
      type: o.mainCameraParams.type,
      responseCoef: o.mainCameraParams.responseCoef
    };
    this.lastFrameMS = 0;
    this.texturesPaths = [];
    o.texturesPaths.forEach(t => {
      this.texturesPaths.push(t);
    });
    this.presentationFormat = navigator.gpu.getPreferredCanvasFormat();
    this.position = new _matrixClass.Position(o.position.x, o.position.y, o.position.z);
    // console.log('cube added on pos : ', this.position)
    this.rotation = new _matrixClass.Rotation(o.rotation.x, o.rotation.y, o.rotation.z);
    this.rotation.rotationSpeed.x = o.rotationSpeed.x;
    this.rotation.rotationSpeed.y = o.rotationSpeed.y;
    this.rotation.rotationSpeed.z = o.rotationSpeed.z;
    this.scale = o.scale;

    // new
    this.runProgram = () => {
      return new Promise(async resolve => {
        this.shadowDepthTextureSize = 1024;
        const aspect = canvas.width / canvas.height;
        this.projectionMatrix = _wgpuMatrix.mat4.perspective(2 * Math.PI / 5, aspect, 1, 2000.0);
        this.modelViewProjectionMatrix = _wgpuMatrix.mat4.create();
        this.loadTex0(this.texturesPaths, device).then(() => {
          resolve();
          console.log('load tex for mesh', this.texture0);
        });
      });
    };
    this.runProgram().then(() => {
      const aspect = canvas.width / canvas.height;
      const presentationFormat = navigator.gpu.getPreferredCanvasFormat();
      this.context.configure({
        device: this.device,
        format: presentationFormat,
        alphaMode: 'premultiplied'
      });

      // Create the model vertex buffer.
      this.vertexBuffer = this.device.createBuffer({
        size: this.mesh.positions.length * 3 * 2 * Float32Array.BYTES_PER_ELEMENT,
        usage: GPUBufferUsage.VERTEX,
        mappedAtCreation: true
      });
      {
        const mapping = new Float32Array(this.vertexBuffer.getMappedRange());
        for (let i = 0; i < this.mesh.positions.length; ++i) {
          mapping.set(this.mesh.positions[i], 6 * i);
          mapping.set(this.mesh.normals[i], 6 * i + 3);
        }
        this.vertexBuffer.unmap();
      }

      // Create the model index buffer.
      this.indexCount = this.mesh.triangles.length * 3;
      this.indexBuffer = this.device.createBuffer({
        size: this.indexCount * Uint16Array.BYTES_PER_ELEMENT,
        usage: GPUBufferUsage.INDEX,
        mappedAtCreation: true
      });
      {
        const mapping = new Uint16Array(this.indexBuffer.getMappedRange());
        for (let i = 0; i < this.mesh.triangles.length; ++i) {
          mapping.set(this.mesh.triangles[i], 3 * i);
        }
        this.indexBuffer.unmap();
      }

      // Create the depth texture for rendering/sampling the shadow map.
      this.shadowDepthTexture = this.device.createTexture({
        size: [this.shadowDepthTextureSize, this.shadowDepthTextureSize, 1],
        usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
        format: 'depth32float'
      });
      this.shadowDepthTextureView = this.shadowDepthTexture.createView();

      // Create some common descriptors used for both the shadow pipeline
      // and the color rendering pipeline.
      this.vertexBuffers = [{
        arrayStride: Float32Array.BYTES_PER_ELEMENT * 6,
        attributes: [{
          // position
          shaderLocation: 0,
          offset: 0,
          format: 'float32x3'
        }, {
          // normal
          shaderLocation: 1,
          offset: Float32Array.BYTES_PER_ELEMENT * 3,
          format: 'float32x3'
        }]
      }];
      const primitive = {
        topology: 'triangle-list',
        cullMode: 'back'
      };
      this.uniformBufferBindGroupLayout = this.device.createBindGroupLayout({
        entries: [{
          binding: 0,
          visibility: GPUShaderStage.VERTEX,
          buffer: {
            type: 'uniform'
          }
        }]
      });
      this.shadowPipeline = this.device.createRenderPipeline({
        layout: this.device.createPipelineLayout({
          bindGroupLayouts: [this.uniformBufferBindGroupLayout, this.uniformBufferBindGroupLayout]
        }),
        vertex: {
          module: this.device.createShaderModule({
            code: _vertexShadow.vertexShadowWGSL
          }),
          buffers: this.vertexBuffers
        },
        depthStencil: {
          depthWriteEnabled: true,
          depthCompare: 'less',
          format: 'depth32float'
        },
        primitive
      });

      // Create a bind group layout which holds the scene uniforms and
      // the texture+sampler for depth. We create it manually because the WebPU
      // implementation doesn't infer this from the shader (yet).
      this.bglForRender = this.device.createBindGroupLayout({
        entries: [{
          binding: 0,
          visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
          buffer: {
            type: 'uniform'
          }
        }, {
          binding: 1,
          visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
          texture: {
            sampleType: 'depth'
          }
        }, {
          binding: 2,
          visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
          sampler: {
            type: 'comparison'
          }
        }, {
          binding: 3,
          visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
          texture: {
            sampleType: 'float'
          }
        }, {
          binding: 4,
          visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
          sampler: {
            type: 'filtering'
          }
        }]
      });
      this.pipeline = this.device.createRenderPipeline({
        layout: this.device.createPipelineLayout({
          bindGroupLayouts: [this.bglForRender, this.uniformBufferBindGroupLayout]
        }),
        vertex: {
          module: this.device.createShaderModule({
            code: _vertex.vertexWGSL
          }),
          buffers: this.vertexBuffers
        },
        fragment: {
          module: this.device.createShaderModule({
            code: _fragment.fragmentWGSL
          }),
          targets: [{
            format: presentationFormat
          }],
          constants: {
            shadowDepthTextureSize: this.shadowDepthTextureSize
          }
        },
        depthStencil: {
          depthWriteEnabled: true,
          depthCompare: 'less',
          format: 'depth24plus-stencil8'
        },
        primitive
      });
      const depthTexture = this.device.createTexture({
        size: [canvas.width, canvas.height],
        format: 'depth24plus-stencil8',
        usage: GPUTextureUsage.RENDER_ATTACHMENT
      });
      this.renderPassDescriptor = {
        colorAttachments: [{
          // view is acquired and set in render loop.
          view: undefined,
          clearValue: {
            r: 0.5,
            g: 0.5,
            b: 0.5,
            a: 1.0
          },
          loadOp: 'load',
          storeOp: 'store'
        }],
        depthStencilAttachment: {
          view: depthTexture.createView(),
          depthClearValue: 1.0,
          depthLoadOp: 'clear',
          depthStoreOp: 'store',
          stencilClearValue: 0,
          stencilLoadOp: 'clear',
          stencilStoreOp: 'store'
        }
      };
      this.modelUniformBuffer = this.device.createBuffer({
        size: 4 * 16,
        // 4x4 matrix
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
      });
      this.sceneUniformBuffer = this.device.createBuffer({
        // Two 4x4 viewProj matrices,
        // one for the camera and one for the light.
        // Then a vec3 for the light position.
        // Rounded to the nearest multiple of 16.
        size: 2 * 4 * 16 + 4 * 4,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
      });
      this.sceneBindGroupForShadow = this.device.createBindGroup({
        layout: this.uniformBufferBindGroupLayout,
        entries: [{
          binding: 0,
          resource: {
            buffer: this.sceneUniformBuffer
          }
        }]
      });
      this.sceneBindGroupForRender = this.device.createBindGroup({
        layout: this.bglForRender,
        entries: [{
          binding: 0,
          resource: {
            buffer: this.sceneUniformBuffer
          }
        }, {
          binding: 1,
          resource: this.shadowDepthTextureView
        }, {
          binding: 2,
          resource: this.device.createSampler({
            compare: 'less'
          })
        }, {
          binding: 3,
          resource: this.texture0.createView()
        }, {
          binding: 4,
          resource: this.sampler
        }]
      });
      this.modelBindGroup = this.device.createBindGroup({
        layout: this.uniformBufferBindGroupLayout,
        entries: [{
          binding: 0,
          resource: {
            buffer: this.modelUniformBuffer
          }
        }]
      });

      // Rotates the camera around the origin based on time.
      this.getTransformationMatrix = pos => {
        const now = Date.now();
        const deltaTime = (now - this.lastFrameMS) / this.mainCameraParams.responseCoef;
        this.lastFrameMS = now;
        const camera = this.cameras[this.mainCameraParams.type];
        this.viewMatrix = camera.update(deltaTime, this.inputHandler());
        _wgpuMatrix.mat4.translate(this.viewMatrix, _wgpuMatrix.vec3.fromValues(pos.x, pos.y, pos.z), this.viewMatrix);
        _wgpuMatrix.mat4.rotateX(this.viewMatrix, Math.PI * this.rotation.getRotX(), this.viewMatrix);
        _wgpuMatrix.mat4.rotateY(this.viewMatrix, Math.PI * this.rotation.getRotY(), this.viewMatrix);
        _wgpuMatrix.mat4.rotateZ(this.viewMatrix, Math.PI * this.rotation.getRotZ(), this.viewMatrix);
        _wgpuMatrix.mat4.multiply(this.projectionMatrix, this.viewMatrix, this.modelViewProjectionMatrix);
        return this.modelViewProjectionMatrix;
      };
      this.upVector = _wgpuMatrix.vec3.fromValues(0, 1, 0);
      this.origin = _wgpuMatrix.vec3.fromValues(0, 0, 0);
      const lightPosition = _wgpuMatrix.vec3.fromValues(50, 100, -100);
      const lightViewMatrix = _wgpuMatrix.mat4.lookAt(lightPosition, this.origin, this.upVector);
      const lightProjectionMatrix = _wgpuMatrix.mat4.create();
      {
        const left = -80;
        const right = 80;
        const bottom = -80;
        const top = 80;
        const near = -200;
        const far = 300;
        _wgpuMatrix.mat4.ortho(left, right, bottom, top, near, far, lightProjectionMatrix);
      }
      const lightViewProjMatrix = _wgpuMatrix.mat4.multiply(lightProjectionMatrix, lightViewMatrix);

      // looks like affect on transformations for now const 0
      const modelMatrix = _wgpuMatrix.mat4.translation([0, 0, 0]);
      // The camera/light aren't moving, so write them into buffers now.
      {
        const lightMatrixData = lightViewProjMatrix; // as Float32Array;
        this.device.queue.writeBuffer(this.sceneUniformBuffer, 0, lightMatrixData.buffer, lightMatrixData.byteOffset, lightMatrixData.byteLength);
        const lightData = lightPosition;
        this.device.queue.writeBuffer(this.sceneUniformBuffer, 128, lightData.buffer, lightData.byteOffset, lightData.byteLength);
        const modelData = modelMatrix;
        this.device.queue.writeBuffer(this.modelUniformBuffer, 0, modelData.buffer, modelData.byteOffset, modelData.byteLength);
      }
      this.shadowPassDescriptor = {
        colorAttachments: [],
        depthStencilAttachment: {
          view: this.shadowDepthTextureView,
          depthClearValue: 1.0,
          depthLoadOp: 'clear',
          depthStoreOp: 'store'
        }
      };
      this.done = true;
    });
  }
  async loadTex0(texturesPaths, device) {
    this.sampler = device.createSampler({
      magFilter: 'linear',
      minFilter: 'linear'
    });
    return new Promise(async resolve => {
      const response = await fetch(texturesPaths[0]);
      const imageBitmap = await createImageBitmap(await response.blob());
      this.texture0 = device.createTexture({
        size: [imageBitmap.width, imageBitmap.height, 1],
        format: 'rgba8unorm',
        usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT
      });
      device.queue.copyExternalImageToTexture({
        source: imageBitmap
      }, {
        texture: this.texture0
      }, [imageBitmap.width, imageBitmap.height]);
      resolve();
    });
  }
  draw = commandEncoder => {
    if (this.done == false) return;
    const transformationMatrix = this.getTransformationMatrix(this.position);
    this.device.queue.writeBuffer(this.sceneUniformBuffer, 64, transformationMatrix.buffer, transformationMatrix.byteOffset, transformationMatrix.byteLength);
    this.renderPassDescriptor.colorAttachments[0].view = this.context.getCurrentTexture().createView();
    {
      const shadowPass = commandEncoder.beginRenderPass(this.shadowPassDescriptor);
      shadowPass.setPipeline(this.shadowPipeline);
      shadowPass.setBindGroup(0, this.sceneBindGroupForShadow);
      shadowPass.setBindGroup(1, this.modelBindGroup);
      shadowPass.setVertexBuffer(0, this.vertexBuffer);
      shadowPass.setIndexBuffer(this.indexBuffer, 'uint16');
      shadowPass.drawIndexed(this.indexCount);
      shadowPass.end();
    }
    {
      const renderPass = commandEncoder.beginRenderPass(this.renderPassDescriptor);
      renderPass.setPipeline(this.pipeline);
      renderPass.setBindGroup(0, this.sceneBindGroupForRender);
      renderPass.setBindGroup(1, this.modelBindGroup);
      renderPass.setVertexBuffer(0, this.vertexBuffer);
      renderPass.setIndexBuffer(this.indexBuffer, 'uint16');
      renderPass.drawIndexed(this.indexCount);
      renderPass.end();
    }
  };
}
exports.default = MEMesh;

},{"../shaders/fragment.wgsl":18,"../shaders/vertex.wgsl":20,"../shaders/vertexShadow.wgsl":21,"./engine":9,"./loader-obj":10,"./matrix-class":11,"wgpu-matrix":6}],14:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.addRaycastListener = addRaycastListener;
exports.getRayFromMouse = getRayFromMouse;
exports.rayIntersectsSphere = rayIntersectsSphere;
exports.touchCoordinate = void 0;
var _wgpuMatrix = require("wgpu-matrix");
/**
 * @author Nikola Lukic
 * @email zlatnaspirala@gmail.com
 * @site https://maximumroulette.com
 * @Licence GPL v3
 * @credits chatgpt used for this script adaptation.
 * @Note matrix-engine-wgpu adaptation test
 * default for now:
 * app.cameras['WASD']
 * Only tested for WASD type of camera.
 * app is global - will be fixed in future
 */

let rayHitEvent;
let touchCoordinate = exports.touchCoordinate = {
  enabled: false,
  x: 0,
  y: 0,
  stopOnFirstDetectedHit: false
};
function multiplyMatrixVector(matrix, vector) {
  return _wgpuMatrix.vec4.transformMat4(vector, matrix);
}
function getRayFromMouse(event, canvas, camera) {
  const rect = canvas.getBoundingClientRect();
  let x = (event.clientX - rect.left) / rect.width * 2 - 1;
  let y = (event.clientY - rect.top) / rect.height * 2 - 1;
  // simple invert
  x = -x;
  y = -y;
  const fov = Math.PI / 4;
  const aspect = canvas.width / canvas.height;
  const near = 0.1;
  const far = 1000;
  camera.projectionMatrix = _wgpuMatrix.mat4.perspective(2 * Math.PI / 5, aspect, 1, 1000.0);
  const invProjection = _wgpuMatrix.mat4.inverse(camera.projectionMatrix);

  // const correctedView = mat4.clone(camera.view_);
  // correctedView[2] *= -1;
  // correctedView[6] *= -1;
  // correctedView[10] *= -1;
  // const invView = mat4.inverse(correctedView);

  const invView = _wgpuMatrix.mat4.inverse(camera.view);
  const ndc = [x, y, 1, 1];
  let worldPos = multiplyMatrixVector(invProjection, ndc);
  worldPos = multiplyMatrixVector(invView, worldPos);
  let world;
  if (worldPos[3] !== 0) {
    world = [worldPos[0] / worldPos[3], worldPos[2] / worldPos[3], worldPos[1] / worldPos[3]];
  } else {
    console.log("[raycaster]special case 0.");
    world = [worldPos[0], worldPos[1], worldPos[2]];
  }
  const rayOrigin = [camera.position[0], camera.position[1], camera.position[2]];
  const rayDirection = _wgpuMatrix.vec3.normalize(_wgpuMatrix.vec3.subtract(world, rayOrigin));
  rayDirection[2] = -rayDirection[2];
  return {
    rayOrigin,
    rayDirection
  };
}
function rayIntersectsSphere(rayOrigin, rayDirection, sphereCenter, sphereRadius) {
  const pos = [sphereCenter.x, sphereCenter.y, sphereCenter.z];
  const oc = _wgpuMatrix.vec3.subtract(rayOrigin, pos);
  const a = _wgpuMatrix.vec3.dot(rayDirection, rayDirection);
  const b = 2.0 * _wgpuMatrix.vec3.dot(oc, rayDirection);
  const c = _wgpuMatrix.vec3.dot(oc, oc) - sphereRadius * sphereRadius;
  const discriminant = b * b - 4 * a * c;
  return discriminant > 0;
}
function addRaycastListener() {
  window.addEventListener('click', event => {
    let canvas = document.getElementsByTagName('canvas')[0];
    let camera = app.cameras.WASD;
    const {
      rayOrigin,
      rayDirection
    } = getRayFromMouse(event, canvas, camera);
    for (const object of app.mainRenderBundle) {
      if (rayIntersectsSphere(rayOrigin, rayDirection, object.position, object.raycast.radius)) {
        // console.log('Object clicked:', object.name);
        // Just like in matrix-engine webGL version "ray.hit.event"
        dispatchEvent(new CustomEvent('ray.hit.event', {
          detail: {
            hitObject: object
          }
        }));
      }
    }
  });
}

},{"wgpu-matrix":6}],15:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.LOG_WARN = exports.LOG_MATRIX = exports.LOG_INFO = exports.LOG_FUNNY_SMALL = exports.LOG_FUNNY = void 0;
exports.ORBIT = ORBIT;
exports.ORBIT_FROM_ARRAY = ORBIT_FROM_ARRAY;
exports.OSCILLATOR = OSCILLATOR;
exports.SWITCHER = SWITCHER;
exports.byId = void 0;
exports.createAppEvent = createAppEvent;
exports.degToRad = degToRad;
exports.genName = genName;
exports.getAxisRot = getAxisRot;
exports.getAxisRot2 = getAxisRot2;
exports.getAxisRot3 = getAxisRot3;
exports.mb = exports.mat4 = void 0;
exports.quaternion_rotation_matrix = quaternion_rotation_matrix;
exports.radToDeg = radToDeg;
exports.randomFloatFromTo = randomFloatFromTo;
exports.randomIntFromTo = randomIntFromTo;
exports.scriptManager = void 0;
exports.setupCanvasFilters = setupCanvasFilters;
exports.typeText = typeText;
exports.vec3 = exports.urlQuery = void 0;
const vec3 = exports.vec3 = {
  cross(a, b, dst) {
    dst = dst || new Float32Array(3);
    const t0 = a[1] * b[2] - a[2] * b[1];
    const t1 = a[2] * b[0] - a[0] * b[2];
    const t2 = a[0] * b[1] - a[1] * b[0];
    dst[0] = t0;
    dst[1] = t1;
    dst[2] = t2;
    return dst;
  },
  subtract(a, b, dst) {
    dst = dst || new Float32Array(3);
    dst[0] = a[0] - b[0];
    dst[1] = a[1] - b[1];
    dst[2] = a[2] - b[2];
    return dst;
  },
  normalize(v, dst) {
    dst = dst || new Float32Array(3);
    const length = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
    // make sure we don't divide by 0.
    if (length > 0.00001) {
      dst[0] = v[0] / length;
      dst[1] = v[1] / length;
      dst[2] = v[2] / length;
    } else {
      dst[0] = 0;
      dst[1] = 0;
      dst[2] = 0;
    }
    return dst;
  }
};
const mat4 = exports.mat4 = {
  projection(width, height, depth, dst) {
    // Note: This matrix flips the Y axis so that 0 is at the top.
    return mat4.ortho(0, width, height, 0, depth, -depth, dst);
  },
  perspective(fieldOfViewYInRadians, aspect, zNear, zFar, dst) {
    dst = dst || new Float32Array(16);
    const f = Math.tan(Math.PI * 0.5 - 0.5 * fieldOfViewYInRadians);
    const rangeInv = 1 / (zNear - zFar);
    dst[0] = f / aspect;
    dst[1] = 0;
    dst[2] = 0;
    dst[3] = 0;
    dst[4] = 0;
    dst[5] = f;
    dst[6] = 0;
    dst[7] = 0;
    dst[8] = 0;
    dst[9] = 0;
    dst[10] = zFar * rangeInv;
    dst[11] = -1;
    dst[12] = 0;
    dst[13] = 0;
    dst[14] = zNear * zFar * rangeInv;
    dst[15] = 0;
    return dst;
  },
  ortho(left, right, bottom, top, near, far, dst) {
    dst = dst || new Float32Array(16);
    dst[0] = 2 / (right - left);
    dst[1] = 0;
    dst[2] = 0;
    dst[3] = 0;
    dst[4] = 0;
    dst[5] = 2 / (top - bottom);
    dst[6] = 0;
    dst[7] = 0;
    dst[8] = 0;
    dst[9] = 0;
    dst[10] = 1 / (near - far);
    dst[11] = 0;
    dst[12] = (right + left) / (left - right);
    dst[13] = (top + bottom) / (bottom - top);
    dst[14] = near / (near - far);
    dst[15] = 1;
    return dst;
  },
  identity(dst) {
    dst = dst || new Float32Array(16);
    dst[0] = 1;
    dst[1] = 0;
    dst[2] = 0;
    dst[3] = 0;
    dst[4] = 0;
    dst[5] = 1;
    dst[6] = 0;
    dst[7] = 0;
    dst[8] = 0;
    dst[9] = 0;
    dst[10] = 1;
    dst[11] = 0;
    dst[12] = 0;
    dst[13] = 0;
    dst[14] = 0;
    dst[15] = 1;
    return dst;
  },
  multiply(a, b, dst) {
    dst = dst || new Float32Array(16);
    const b00 = b[0 * 4 + 0];
    const b01 = b[0 * 4 + 1];
    const b02 = b[0 * 4 + 2];
    const b03 = b[0 * 4 + 3];
    const b10 = b[1 * 4 + 0];
    const b11 = b[1 * 4 + 1];
    const b12 = b[1 * 4 + 2];
    const b13 = b[1 * 4 + 3];
    const b20 = b[2 * 4 + 0];
    const b21 = b[2 * 4 + 1];
    const b22 = b[2 * 4 + 2];
    const b23 = b[2 * 4 + 3];
    const b30 = b[3 * 4 + 0];
    const b31 = b[3 * 4 + 1];
    const b32 = b[3 * 4 + 2];
    const b33 = b[3 * 4 + 3];
    const a00 = a[0 * 4 + 0];
    const a01 = a[0 * 4 + 1];
    const a02 = a[0 * 4 + 2];
    const a03 = a[0 * 4 + 3];
    const a10 = a[1 * 4 + 0];
    const a11 = a[1 * 4 + 1];
    const a12 = a[1 * 4 + 2];
    const a13 = a[1 * 4 + 3];
    const a20 = a[2 * 4 + 0];
    const a21 = a[2 * 4 + 1];
    const a22 = a[2 * 4 + 2];
    const a23 = a[2 * 4 + 3];
    const a30 = a[3 * 4 + 0];
    const a31 = a[3 * 4 + 1];
    const a32 = a[3 * 4 + 2];
    const a33 = a[3 * 4 + 3];
    dst[0] = b00 * a00 + b01 * a10 + b02 * a20 + b03 * a30;
    dst[1] = b00 * a01 + b01 * a11 + b02 * a21 + b03 * a31;
    dst[2] = b00 * a02 + b01 * a12 + b02 * a22 + b03 * a32;
    dst[3] = b00 * a03 + b01 * a13 + b02 * a23 + b03 * a33;
    dst[4] = b10 * a00 + b11 * a10 + b12 * a20 + b13 * a30;
    dst[5] = b10 * a01 + b11 * a11 + b12 * a21 + b13 * a31;
    dst[6] = b10 * a02 + b11 * a12 + b12 * a22 + b13 * a32;
    dst[7] = b10 * a03 + b11 * a13 + b12 * a23 + b13 * a33;
    dst[8] = b20 * a00 + b21 * a10 + b22 * a20 + b23 * a30;
    dst[9] = b20 * a01 + b21 * a11 + b22 * a21 + b23 * a31;
    dst[10] = b20 * a02 + b21 * a12 + b22 * a22 + b23 * a32;
    dst[11] = b20 * a03 + b21 * a13 + b22 * a23 + b23 * a33;
    dst[12] = b30 * a00 + b31 * a10 + b32 * a20 + b33 * a30;
    dst[13] = b30 * a01 + b31 * a11 + b32 * a21 + b33 * a31;
    dst[14] = b30 * a02 + b31 * a12 + b32 * a22 + b33 * a32;
    dst[15] = b30 * a03 + b31 * a13 + b32 * a23 + b33 * a33;
    return dst;
  },
  cameraAim(eye, target, up, dst) {
    dst = dst || new Float32Array(16);
    const zAxis = vec3.normalize(vec3.subtract(eye, target));
    const xAxis = vec3.normalize(vec3.cross(up, zAxis));
    const yAxis = vec3.normalize(vec3.cross(zAxis, xAxis));
    dst[0] = xAxis[0];
    dst[1] = xAxis[1];
    dst[2] = xAxis[2];
    dst[3] = 0;
    dst[4] = yAxis[0];
    dst[5] = yAxis[1];
    dst[6] = yAxis[2];
    dst[7] = 0;
    dst[8] = zAxis[0];
    dst[9] = zAxis[1];
    dst[10] = zAxis[2];
    dst[11] = 0;
    dst[12] = eye[0];
    dst[13] = eye[1];
    dst[14] = eye[2];
    dst[15] = 1;
    return dst;
  },
  inverse(m, dst) {
    dst = dst || new Float32Array(16);
    const m00 = m[0 * 4 + 0];
    const m01 = m[0 * 4 + 1];
    const m02 = m[0 * 4 + 2];
    const m03 = m[0 * 4 + 3];
    const m10 = m[1 * 4 + 0];
    const m11 = m[1 * 4 + 1];
    const m12 = m[1 * 4 + 2];
    const m13 = m[1 * 4 + 3];
    const m20 = m[2 * 4 + 0];
    const m21 = m[2 * 4 + 1];
    const m22 = m[2 * 4 + 2];
    const m23 = m[2 * 4 + 3];
    const m30 = m[3 * 4 + 0];
    const m31 = m[3 * 4 + 1];
    const m32 = m[3 * 4 + 2];
    const m33 = m[3 * 4 + 3];
    const tmp0 = m22 * m33;
    const tmp1 = m32 * m23;
    const tmp2 = m12 * m33;
    const tmp3 = m32 * m13;
    const tmp4 = m12 * m23;
    const tmp5 = m22 * m13;
    const tmp6 = m02 * m33;
    const tmp7 = m32 * m03;
    const tmp8 = m02 * m23;
    const tmp9 = m22 * m03;
    const tmp10 = m02 * m13;
    const tmp11 = m12 * m03;
    const tmp12 = m20 * m31;
    const tmp13 = m30 * m21;
    const tmp14 = m10 * m31;
    const tmp15 = m30 * m11;
    const tmp16 = m10 * m21;
    const tmp17 = m20 * m11;
    const tmp18 = m00 * m31;
    const tmp19 = m30 * m01;
    const tmp20 = m00 * m21;
    const tmp21 = m20 * m01;
    const tmp22 = m00 * m11;
    const tmp23 = m10 * m01;
    const t0 = tmp0 * m11 + tmp3 * m21 + tmp4 * m31 - (tmp1 * m11 + tmp2 * m21 + tmp5 * m31);
    const t1 = tmp1 * m01 + tmp6 * m21 + tmp9 * m31 - (tmp0 * m01 + tmp7 * m21 + tmp8 * m31);
    const t2 = tmp2 * m01 + tmp7 * m11 + tmp10 * m31 - (tmp3 * m01 + tmp6 * m11 + tmp11 * m31);
    const t3 = tmp5 * m01 + tmp8 * m11 + tmp11 * m21 - (tmp4 * m01 + tmp9 * m11 + tmp10 * m21);
    const d = 1 / (m00 * t0 + m10 * t1 + m20 * t2 + m30 * t3);
    dst[0] = d * t0;
    dst[1] = d * t1;
    dst[2] = d * t2;
    dst[3] = d * t3;
    dst[4] = d * (tmp1 * m10 + tmp2 * m20 + tmp5 * m30 - (tmp0 * m10 + tmp3 * m20 + tmp4 * m30));
    dst[5] = d * (tmp0 * m00 + tmp7 * m20 + tmp8 * m30 - (tmp1 * m00 + tmp6 * m20 + tmp9 * m30));
    dst[6] = d * (tmp3 * m00 + tmp6 * m10 + tmp11 * m30 - (tmp2 * m00 + tmp7 * m10 + tmp10 * m30));
    dst[7] = d * (tmp4 * m00 + tmp9 * m10 + tmp10 * m20 - (tmp5 * m00 + tmp8 * m10 + tmp11 * m20));
    dst[8] = d * (tmp12 * m13 + tmp15 * m23 + tmp16 * m33 - (tmp13 * m13 + tmp14 * m23 + tmp17 * m33));
    dst[9] = d * (tmp13 * m03 + tmp18 * m23 + tmp21 * m33 - (tmp12 * m03 + tmp19 * m23 + tmp20 * m33));
    dst[10] = d * (tmp14 * m03 + tmp19 * m13 + tmp22 * m33 - (tmp15 * m03 + tmp18 * m13 + tmp23 * m33));
    dst[11] = d * (tmp17 * m03 + tmp20 * m13 + tmp23 * m23 - (tmp16 * m03 + tmp21 * m13 + tmp22 * m23));
    dst[12] = d * (tmp14 * m22 + tmp17 * m32 + tmp13 * m12 - (tmp16 * m32 + tmp12 * m12 + tmp15 * m22));
    dst[13] = d * (tmp20 * m32 + tmp12 * m02 + tmp19 * m22 - (tmp18 * m22 + tmp21 * m32 + tmp13 * m02));
    dst[14] = d * (tmp18 * m12 + tmp23 * m32 + tmp15 * m02 - (tmp22 * m32 + tmp14 * m02 + tmp19 * m12));
    dst[15] = d * (tmp22 * m22 + tmp16 * m02 + tmp21 * m12 - (tmp20 * m12 + tmp23 * m22 + tmp17 * m02));
    return dst;
  },
  lookAt(eye, target, up, dst) {
    return mat4.inverse(mat4.cameraAim(eye, target, up, dst), dst);
  },
  translation([tx, ty, tz], dst) {
    dst = dst || new Float32Array(16);
    dst[0] = 1;
    dst[1] = 0;
    dst[2] = 0;
    dst[3] = 0;
    dst[4] = 0;
    dst[5] = 1;
    dst[6] = 0;
    dst[7] = 0;
    dst[8] = 0;
    dst[9] = 0;
    dst[10] = 1;
    dst[11] = 0;
    dst[12] = tx;
    dst[13] = ty;
    dst[14] = tz;
    dst[15] = 1;
    return dst;
  },
  rotationX(angleInRadians, dst) {
    const c = Math.cos(angleInRadians);
    const s = Math.sin(angleInRadians);
    dst = dst || new Float32Array(16);
    dst[0] = 1;
    dst[1] = 0;
    dst[2] = 0;
    dst[3] = 0;
    dst[4] = 0;
    dst[5] = c;
    dst[6] = s;
    dst[7] = 0;
    dst[8] = 0;
    dst[9] = -s;
    dst[10] = c;
    dst[11] = 0;
    dst[12] = 0;
    dst[13] = 0;
    dst[14] = 0;
    dst[15] = 1;
    return dst;
  },
  rotationY(angleInRadians, dst) {
    const c = Math.cos(angleInRadians);
    const s = Math.sin(angleInRadians);
    dst = dst || new Float32Array(16);
    dst[0] = c;
    dst[1] = 0;
    dst[2] = -s;
    dst[3] = 0;
    dst[4] = 0;
    dst[5] = 1;
    dst[6] = 0;
    dst[7] = 0;
    dst[8] = s;
    dst[9] = 0;
    dst[10] = c;
    dst[11] = 0;
    dst[12] = 0;
    dst[13] = 0;
    dst[14] = 0;
    dst[15] = 1;
    return dst;
  },
  rotationZ(angleInRadians, dst) {
    const c = Math.cos(angleInRadians);
    const s = Math.sin(angleInRadians);
    dst = dst || new Float32Array(16);
    dst[0] = c;
    dst[1] = s;
    dst[2] = 0;
    dst[3] = 0;
    dst[4] = -s;
    dst[5] = c;
    dst[6] = 0;
    dst[7] = 0;
    dst[8] = 0;
    dst[9] = 0;
    dst[10] = 1;
    dst[11] = 0;
    dst[12] = 0;
    dst[13] = 0;
    dst[14] = 0;
    dst[15] = 1;
    return dst;
  },
  scaling([sx, sy, sz], dst) {
    dst = dst || new Float32Array(16);
    dst[0] = sx;
    dst[1] = 0;
    dst[2] = 0;
    dst[3] = 0;
    dst[4] = 0;
    dst[5] = sy;
    dst[6] = 0;
    dst[7] = 0;
    dst[8] = 0;
    dst[9] = 0;
    dst[10] = sz;
    dst[11] = 0;
    dst[12] = 0;
    dst[13] = 0;
    dst[14] = 0;
    dst[15] = 1;
    return dst;
  },
  translate(m, translation, dst) {
    return mat4.multiply(m, mat4.translation(translation), dst);
  },
  rotateX(m, angleInRadians, dst) {
    return mat4.multiply(m, mat4.rotationX(angleInRadians), dst);
  },
  rotateY(m, angleInRadians, dst) {
    return mat4.multiply(m, mat4.rotationY(angleInRadians), dst);
  },
  rotateZ(m, angleInRadians, dst) {
    return mat4.multiply(m, mat4.rotationZ(angleInRadians), dst);
  },
  scale(m, scale, dst) {
    return mat4.multiply(m, mat4.scaling(scale), dst);
  }
};
function degToRad(degrees) {
  return degrees * Math.PI / 180;
}
;
function radToDeg(r) {
  var pi = Math.PI;
  return r * (180 / pi);
}
;
function createAppEvent(name, myDetails) {
  return new CustomEvent(name, {
    detail: {
      eventName: name,
      data: myDetails
    },
    bubbles: true
  });
}

/**
 * @description
 * Load script in runtime.
 */
var scriptManager = exports.scriptManager = {
  SCRIPT_ID: 0,
  LOAD: function addScript(src, id, type, parent, callback) {
    var s = document.createElement('script');
    s.onload = function () {
      // console.log('Script id loaded [src]: ' + this.src);
      if (typeof callback != 'undefined') callback();
    };
    if (typeof type !== 'undefined') {
      s.setAttribute('type', type);
      s.innerHTML = src;
    } else {
      s.setAttribute('src', src);
    }
    if (typeof id !== 'undefined') {
      s.setAttribute('id', id);
    }
    if (typeof parent !== 'undefined') {
      document.getElementById(parent).appendChild(s);
      if (typeof callback != 'undefined') callback();
    } else {
      document.body.appendChild(s);
    }
  },
  loadModule: function addScript(src, id, type, parent) {
    console.log('Script id load called ');
    var s = document.createElement('script');
    s.onload = function () {
      scriptManager.SCRIPT_ID++;
    };
    if (typeof type === 'undefined') {
      s.setAttribute('type', 'module');
      s.setAttribute('src', src);
    } else {
      s.setAttribute('type', type);
      s.innerHTML = src;
    }
    s.setAttribute('src', src);
    if (typeof id !== 'undefined') {
      s.setAttribute('id', id);
    }
    if (typeof parent !== 'undefined') {
      document.getElementById(parent).appendChild(s);
    } else {
      document.body.appendChild(s);
    }
  },
  loadGLSL: function (src) {
    return new Promise(resolve => {
      fetch(src).then(data => {
        resolve(data.text());
      });
    });
  }
};

// GET PULSE VALUES IN REAL TIME
function OSCILLATOR(min, max, step) {
  if ((typeof min === 'string' || typeof min === 'number') && (typeof max === 'string' || typeof max === 'number') && (typeof step === 'string' || typeof step === 'number')) {
    var ROOT = this;
    this.min = parseFloat(min);
    this.max = parseFloat(max);
    this.step = parseFloat(step);
    this.value_ = parseFloat(min);
    this.status = 0;
    this.on_maximum_value = function () {};
    this.on_minimum_value = function () {};
    this.UPDATE = function (STATUS_) {
      if (STATUS_ === undefined) {
        if (this.status == 0 && this.value_ < this.max) {
          this.value_ = this.value_ + this.step;
          if (this.value_ >= this.max) {
            this.value_ = this.max;
            this.status = 1;
            ROOT.on_maximum_value();
          }
          return this.value_;
        } else if (this.status == 1 && this.value_ > this.min) {
          this.value_ = this.value_ - this.step;
          if (this.value_ <= this.min) {
            this.value_ = this.min;
            this.status = 0;
            ROOT.on_minimum_value();
          }
          return this.value_;
        }
      } else {
        return this.value_;
      }
    };
  } else {
    console.log("SYS : warning for procedure 'SYS.MATH.OSCILLATOR' Desciption : Replace object with string or number, min >> " + typeof min + ' and max >>' + typeof max + ' and step >>' + typeof step + ' << must be string or number.');
  }
}

// this is class not func ecma5
function SWITCHER() {
  var ROOT = this;
  ROOT.VALUE = 1;
  ROOT.GET = function () {
    ROOT.VALUE = ROOT.VALUE * -1;
    return ROOT.VALUE;
  };
}
function ORBIT(cx, cy, angle, p) {
  var s = Math.sin(angle);
  var c = Math.cos(angle);
  p.x -= cx;
  p.y -= cy;
  var xnew = p.x * c - p.y * s;
  var ynew = p.x * s + p.y * c;
  p.x = xnew + cx;
  p.y = ynew + cy;
  return p;
}
function ORBIT_FROM_ARRAY(cx, cy, angle, p, byIndexs) {
  var s = Math.sin(angle);
  var c = Math.cos(angle);
  p[byIndexs[0]] -= cx;
  p[byIndexs[1]] -= cy;
  var xnew = p[byIndexs[0]] * c - p[byIndexs[1]] * s;
  var ynew = p[byIndexs[0]] * s + p[byIndexs[1]] * c;
  p[byIndexs[0]] = xnew + cx;
  p[byIndexs[1]] = ynew + cy;
  return p;
}
var byId = function (id) {
  return document.getElementById(id);
};
exports.byId = byId;
function randomFloatFromTo(min, max) {
  return Math.random() * (max - min) + min;
}
function randomIntFromTo(min, max) {
  if (typeof min === 'object' || typeof max === 'object') {
    console.log("SYS : warning Desciption : Replace object with string , this >> " + typeof min + ' and ' + typeof min + ' << must be string or number.');
  } else if (typeof min === 'undefined' || typeof max === 'undefined') {
    console.log("SYS : warning Desciption : arguments (min, max) cant be undefined , this >> " + typeof min + ' and ' + typeof min + ' << must be string or number.');
  } else {
    return Math.floor(Math.random() * (max - min + 1) + min);
  }
}
var urlQuery = exports.urlQuery = function () {
  var query_string = {};
  var query = window.location.search.substring(1);
  var vars = query.split('&');
  for (var i = 0; i < vars.length; i++) {
    var pair = vars[i].split('=');
    if (typeof query_string[pair[0]] === 'undefined') {
      query_string[pair[0]] = decodeURIComponent(pair[1]);
    } else if (typeof query_string[pair[0]] === 'string') {
      var arr = [query_string[pair[0]], decodeURIComponent(pair[1])];
      query_string[pair[0]] = arr;
    } else {
      query_string[pair[0]].push(decodeURIComponent(pair[1]));
    }
  }
  return query_string;
}();
function getAxisRot(q1) {
  var x, y, z;

  // if w>1 acos and sqrt will produce errors, this cant happen if quaternion is normalised
  if (q1.w > 1) q1.normalise();
  var angle = 2 * Math.acos(q1.w);
  // assuming quaternion normalised then w is less than 1, so term always positive.
  var s = Math.sqrt(1 - q1.w * q1.w);
  // test to avoid divide by zero, s is always positive due to sqrt
  if (s < 0.001) {
    // if s close to zero then direction of axis not important
    // if it is important that axis is normalised then replace with x=1; y=z=0;

    x = q1.x;
    y = q1.y;
    z = q1.z;
  } else {
    x = q1.x / s; // normalise axis
    y = q1.y / s;
    z = q1.z / s;
  }
  return [radToDeg(x), radToDeg(y), radToDeg(z)];
}
function getAxisRot2(targetAxis, Q) {
  Q.normalize(); // if w>1 acos and sqrt will produce errors, this cant happen if quaternion is normalised
  var angle = 2 * Math.acos(Q.w());
  var s = Math.sqrt(1 - Q.w() * Q.w()); // assuming quaternion normalised then w is less than 1, so term always positive.
  if (s < 0.001) {
    // test to avoid divide by zero, s is always positive due to sqrt
    // if s close to zero then direction of axis not important
    // if it is important that axis is normalised then replace with x=1; y=z=0;
    // targetAxis.x = 1;
    // targetAxis.y = 0;
    // targetAxis.z = 0;
    targetAxis.x = Q.x();
    targetAxis.y = Q.y();
    targetAxis.z = Q.z();
  } else {
    targetAxis.x = Q.x() / s; // normalise axis
    targetAxis.y = Q.y() / s;
    targetAxis.z = Q.z() / s;
  }
  return [targetAxis, angle];
}
function getAxisRot3(Q) {
  var angle = Math.acos(Q.w) * 2;
  var axis = {};
  if (Math.sin(Math.acos(angle)) > 0) {
    axis.x = Q.x / Math.sin(Math.acos(angle / 2));
    axis.y = Q.y / Math.sin(Math.acos(angle / 2));
    axis.z = Q.z / Math.sin(Math.acos(angle / 2));
  } else {
    axis.x = 0;
    axis.y = 0;
    axis.z = 0;
  }
  return axis;
}

// NTO TESTED
function quaternion_rotation_matrix(Q) {
  // Covert a quaternion into a full three-dimensional rotation matrix.

  // Input
  // :param Q: A 4 element array representing the quaternion (q0,q1,q2,q3) 

  // Output
  // :return: A 3x3 element matrix representing the full 3D rotation matrix. 
  //          This rotation matrix converts a point in the local reference 
  //          frame to a point in the global reference frame.
  // """
  // # Extract the values from Q
  var q0 = Q[0];
  var q1 = Q[1];
  var q2 = Q[2];
  var q3 = Q[3];

  // # First row of the rotation matrix
  var r00 = 2 * (q0 * q0 + q1 * q1) - 1;
  var r01 = 2 * (q1 * q2 - q0 * q3);
  var r02 = 2 * (q1 * q3 + q0 * q2);

  // # Second row of the rotation matrix
  var r10 = 2 * (q1 * q2 + q0 * q3);
  var r11 = 2 * (q0 * q0 + q2 * q2) - 1;
  var r12 = 2 * (q2 * q3 - q0 * q1);

  // # Third row of the rotation matrix
  var r20 = 2 * (q1 * q3 - q0 * q2);
  var r21 = 2 * (q2 * q3 + q0 * q1);
  var r22 = 2 * (q0 * q0 + q3 * q3) - 1;

  // # 3x3 rotation matrix
  var rot_matrix = [[r00, r01, r02], [r10, r11, r12], [r20, r21, r22]];
  return rot_matrix;
}

// copnsole log graphics
const LOG_WARN = exports.LOG_WARN = 'background: gray; color: yellow; font-size:10px';
const LOG_INFO = exports.LOG_INFO = 'background: green; color: white; font-size:11px';
const LOG_MATRIX = exports.LOG_MATRIX = "font-family: stormfaze;color: #lime; font-size:11px;text-shadow: 2px 2px 4px orangered;background: black;";
const LOG_FUNNY = exports.LOG_FUNNY = "font-family: stormfaze;color: #f1f033; font-size:14px;text-shadow: 2px 2px 4px #f335f4, 4px 4px 4px #d64444, 2px 2px 4px #c160a6, 6px 2px 0px #123de3;background: black;";
const LOG_FUNNY_SMALL = exports.LOG_FUNNY_SMALL = "font-family: stormfaze;color: #f1f033; font-size:10px;text-shadow: 2px 2px 4px #f335f4, 4px 4px 4px #d64444, 1px 1px 2px #c160a6, 3px 1px 0px #123de3;background: black;";
function genName(length) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
let mb = exports.mb = {
  root: () => byId('msgBox'),
  pContent: () => byId('not-content'),
  copy: function () {
    navigator.clipboard.writeText(mb.root().children[0].innerText);
  },
  c: 0,
  ic: 0,
  t: {},
  setContent: function (content, t) {
    var iMsg = document.createElement('div');
    iMsg.innerHTML = content;
    iMsg.id = `msgbox-loc-${mb.c}`;
    mb.root().appendChild(iMsg);
    iMsg.classList.add('animate1');
    if (t == 'ok') {
      iMsg.style = 'font-family: stormfaze;color:white;padding:7px;margin:2px';
    } else {
      iMsg.style = 'font-family: stormfaze;color:white;padding:7px;margin:2px';
    }
  },
  kill: function () {
    mb.root().remove();
  },
  show: function (content, t) {
    mb.setContent(content, t);
    mb.root().style.display = "block";
    var loc2 = mb.c;
    setTimeout(function () {
      byId(`msgbox-loc-${loc2}`).classList.remove("fadeInDown");
      byId(`msgbox-loc-${loc2}`).classList.add("fadeOut");
      setTimeout(function () {
        byId(`msgbox-loc-${loc2}`).style.display = "none";
        byId(`msgbox-loc-${loc2}`).classList.remove("fadeOut");
        byId(`msgbox-loc-${loc2}`).remove();
        mb.ic++;
        if (mb.c == mb.ic) {
          mb.root().style.display = 'none';
        }
      }, 1000);
    }, 3000);
    mb.c++;
  },
  error: function (content) {
    mb.root().classList.remove("success");
    mb.root().classList.add("error");
    mb.root().classList.add("fadeInDown");
    mb.show(content, 'err');
  },
  success: function (content) {
    mb.root().classList.remove("error");
    mb.root().classList.add("success");
    mb.root().classList.add("fadeInDown");
    mb.show(content, 'ok');
  }
};
function typeText(elementId, text, delay = 50) {
  const el = document.getElementById(elementId);
  el.innerText = '';
  let index = 0;
  function typeNextChar() {
    if (index < text.length) {
      el.textContent += text.charAt(index);
      index++;
      setTimeout(typeNextChar, delay);
    }
  }
  typeNextChar();
}
function setupCanvasFilters(canvasId) {
  let canvas = document.getElementById(canvasId);
  if (canvas == null) {
    canvas = document.getElementsByTagName('canvas')[0];
  }
  const filterState = {
    blur: "0px",
    grayscale: "0%",
    brightness: "100%",
    contrast: "100%",
    saturate: "100%",
    sepia: "0%",
    invert: "0%",
    hueRotate: "0deg"
  };
  function updateFilter() {
    const filterString = `
      blur(${filterState.blur}) 
      grayscale(${filterState.grayscale}) 
      brightness(${filterState.brightness}) 
      contrast(${filterState.contrast}) 
      saturate(${filterState.saturate}) 
      sepia(${filterState.sepia}) 
      invert(${filterState.invert}) 
      hue-rotate(${filterState.hueRotate})
    `.trim();
    canvas.style.filter = filterString;
  }
  const bindings = {
    blurControl: "blur",
    grayscaleControl: "grayscale",
    brightnessControl: "brightness",
    contrastControl: "contrast",
    saturateControl: "saturate",
    sepiaControl: "sepia",
    invertControl: "invert",
    hueControl: "hueRotate"
  };
  Object.entries(bindings).forEach(([selectId, key]) => {
    const el = document.getElementById(selectId);
    el.addEventListener("change", e => {
      filterState[key] = e.target.value;
      updateFilter();
    });
  });
  updateFilter(); // Initial
}

},{}],16:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.MultiLang = void 0;
var _utils = require("../engine/utils");
class MultiLang {
  constructor() {
    addEventListener('updateLang', () => {
      console.log('Multilang updated.');
      this.update();
    });
  }
  update = function () {
    var allTranDoms = document.querySelectorAll('[data-label]');
    allTranDoms.forEach(i => {
      i.innerHTML = this.get[i.getAttribute('data-label')];
    });
  };
  loadMultilang = async function (lang = 'en') {
    lang = 'res/multilang/' + lang + '.json';
    console.info(`%cMultilang: ${lang}`, _utils.LOG_MATRIX);
    try {
      const r = await fetch(lang, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      return await r.json();
    } catch (err) {
      console.warn('Not possible to access multilang json asset! Err => ', err);
      return {};
    }
  };
}
exports.MultiLang = MultiLang;

},{"../engine/utils":15}],17:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _utils = require("../engine/utils");
// import {vec3} from "wgpu-matrix";

class MatrixAmmo {
  constructor() {
    // THIS PATH IS PATH FROM PUBLIC FINAL FOLDER
    _utils.scriptManager.LOAD("./ammojs/ammo.js", "ammojs", undefined, undefined, this.init);
    this.lastRoll = '';
    this.presentScore = '';
  }
  init = () => {
    // console.log('pre ammo')
    Ammo().then(Ammo => {
      // Physics variables
      this.dynamicsWorld = null;
      this.rigidBodies = [];
      this.Ammo = Ammo;
      this.lastUpdate = 0;
      console.log("%c Ammo core loaded.", _utils.LOG_FUNNY);
      this.initPhysics();
      // simulate async
      setTimeout(() => dispatchEvent(new CustomEvent('AmmoReady', {})), 100);
    });
  };
  initPhysics() {
    let Ammo = this.Ammo;
    // Physics configuration
    var collisionConfiguration = new Ammo.btDefaultCollisionConfiguration(),
      dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration),
      overlappingPairCache = new Ammo.btDbvtBroadphase(),
      solver = new Ammo.btSequentialImpulseConstraintSolver();
    this.dynamicsWorld = new Ammo.btDiscreteDynamicsWorld(dispatcher, overlappingPairCache, solver, collisionConfiguration);
    this.dynamicsWorld.setGravity(new Ammo.btVector3(0, -10, 0));
    var groundShape = new Ammo.btBoxShape(new Ammo.btVector3(70, 1, 70)),
      groundTransform = new Ammo.btTransform();
    groundTransform.setIdentity();
    groundTransform.setOrigin(new Ammo.btVector3(0, -4.45, 0));
    var mass = 0,
      isDynamic = mass !== 0,
      localInertia = new Ammo.btVector3(0, 0, 0);
    if (isDynamic) groundShape.calculateLocalInertia(mass, localInertia);
    var myMotionState = new Ammo.btDefaultMotionState(groundTransform),
      rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, myMotionState, groundShape, localInertia),
      body = new Ammo.btRigidBody(rbInfo);
    body.name = 'ground';
    this.ground = body;
    this.dynamicsWorld.addRigidBody(body);
    // this.rigidBodies.push(body);
    // add collide event
    this.detectCollision();
  }
  addPhysics(MEObject, pOptions) {
    if (pOptions.geometry == "Sphere") {
      this.addPhysicsSphere(MEObject, pOptions);
    } else if (pOptions.geometry == "Cube") {
      this.addPhysicsBox(MEObject, pOptions);
    }
  }
  addPhysicsSphere(MEObject, pOptions) {
    let Ammo = this.Ammo;
    var colShape = new Ammo.btSphereShape(pOptions.radius),
      startTransform = new Ammo.btTransform();
    startTransform.setIdentity();
    var mass = 1;
    var localInertia = new Ammo.btVector3(0, 0, 0);
    colShape.calculateLocalInertia(mass, localInertia);
    startTransform.setOrigin(new Ammo.btVector3(pOptions.position.x, pOptions.position.y, pOptions.position.z));
    var myMotionState = new Ammo.btDefaultMotionState(startTransform),
      rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, myMotionState, colShape, localInertia),
      body = new Ammo.btRigidBody(rbInfo);
    body.MEObject = MEObject;
    this.dynamicsWorld.addRigidBody(body);
    this.rigidBodies.push(body);
    return body;
  }
  addPhysicsBox(MEObject, pOptions) {
    const FLAGS = {
      TEST_NIDZA: 3,
      CF_KINEMATIC_OBJECT: 2
    };
    let Ammo = this.Ammo;
    // improve this - scale by comp
    var colShape = new Ammo.btBoxShape(new Ammo.btVector3(pOptions.scale[0], pOptions.scale[1], pOptions.scale[2])),
      startTransform = new Ammo.btTransform();
    startTransform.setIdentity();
    var mass = pOptions.mass;
    var localInertia = new Ammo.btVector3(0, 0, 0);
    colShape.calculateLocalInertia(mass, localInertia);
    startTransform.setOrigin(new Ammo.btVector3(pOptions.position.x, pOptions.position.y, pOptions.position.z));
    //rotation
    // console.log('startTransform.setRotation', startTransform.setRotation)
    var t = startTransform.getRotation();
    t.setX((0, _utils.degToRad)(pOptions.rotation.x));
    t.setY((0, _utils.degToRad)(pOptions.rotation.y));
    t.setZ((0, _utils.degToRad)(pOptions.rotation.z));
    startTransform.setRotation(t);

    // startTransform.setRotation(pOptions.rotation.x, pOptions.rotation.y, pOptions.rotation.z);

    var myMotionState = new Ammo.btDefaultMotionState(startTransform),
      rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, myMotionState, colShape, localInertia),
      body = new Ammo.btRigidBody(rbInfo);
    if (pOptions.mass == 0 && typeof pOptions.state == 'undefined' && typeof pOptions.collide == 'undefined') {
      body.setActivationState(2);
      body.setCollisionFlags(FLAGS.CF_KINEMATIC_OBJECT);
      // console.log('what is pOptions.mass and state is 2 ....', pOptions.mass)
    } else if (typeof pOptions.collide != 'undefined' && pOptions.collide == false) {
      // idea not work for now - eliminate collide effect
      body.setActivationState(4);
      body.setCollisionFlags(FLAGS.TEST_NIDZA);
    } else {
      body.setActivationState(4);
    }
    // console.log('what is name.', pOptions.name)
    body.name = pOptions.name;
    body.MEObject = MEObject;
    this.dynamicsWorld.addRigidBody(body);
    this.rigidBodies.push(body);
    return body;
  }
  setBodyVelocity(body, x, y, z) {
    var tbv30 = new Ammo.btVector3();
    tbv30.setValue(x, y, z);
    body.setLinearVelocity(tbv30);
  }
  setKinematicTransform(body, x, y, z, rx, ry, rz) {
    if (typeof rx == 'undefined') {
      var rx = 0;
    }
    if (typeof ry == 'undefined') {
      var ry = 0;
    }
    if (typeof rz == 'undefined') {
      var rz = 0;
    }
    let pos = new Ammo.btVector3();
    // let quat = new Ammo.btQuaternion();
    pos = body.getWorldTransform().getOrigin();
    let localRot = body.getWorldTransform().getRotation();
    // console.log('pre pos x:', pos.x(), " y : ", pos.y(), " z:", pos.z())
    pos.setX(pos.x() + x);
    pos.setY(pos.y() + y);
    pos.setZ(pos.z() + z);
    localRot.setX(rx);
    localRot.setY(ry);
    localRot.setZ(rz);
    let physicsBody = body;
    let ms = physicsBody.getMotionState();
    if (ms) {
      var tmpTrans = new Ammo.btTransform();
      // quat.setValue(quat.x(), quat.y(), quat.z(), quat.w());
      tmpTrans.setIdentity();
      tmpTrans.setOrigin(pos);
      tmpTrans.setRotation(localRot);
      ms.setWorldTransform(tmpTrans);
    }
  }
  getBodyByName(name) {
    var b = null;
    this.rigidBodies.forEach((item, index, array) => {
      if (item.name == name) {
        b = array[index];
      }
    });
    return b;
  }
  getNameByBody(body) {
    var b = null;
    this.rigidBodies.forEach((item, index, array) => {
      if (item.kB == body.kB) {
        b = array[index].name;
      }
    });
    return b;
  }
  detectCollision() {
    console.log('override this');
    return;
    this.lastRoll = '';
    this.presentScore = '';
    let dispatcher = this.dynamicsWorld.getDispatcher();
    let numManifolds = dispatcher.getNumManifolds();
    for (let i = 0; i < numManifolds; i++) {
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

      if (this.ground.kB == contactManifold.getBody0().kB && this.getNameByBody(contactManifold.getBody1()) == 'CubePhysics1') {
        // console.log(this.ground ,'GROUND IS IN CONTACT WHO IS BODY1 ', contactManifold.getBody1())
        // console.log('GROUND IS IN CONTACT WHO IS BODY1 getNameByBody  ', this.getNameByBody(contactManifold.getBody1()))
        // CHECK ROTATION
        var testR = contactManifold.getBody1().getWorldTransform().getRotation();
        if (Math.abs(testR.y()) < 0.00001) {
          this.lastRoll += " 4 +";
          this.presentScore += 4;
          dispatchEvent(new CustomEvent('dice-1', {}));
        }
        if (Math.abs(testR.x()) < 0.00001) {
          this.lastRoll += " 3 +";
          this.presentScore += 3;
          dispatchEvent(new CustomEvent('dice-4', {}));
        }
        if (testR.x().toString().substring(0, 5) == testR.y().toString().substring(1, 6)) {
          this.lastRoll += " 2 +";
          this.presentScore += 2;
          dispatchEvent(new CustomEvent('dice-6', {}));
        }
        if (testR.x().toString().substring(0, 5) == testR.y().toString().substring(0, 5)) {
          this.lastRoll += " 1 +";
          this.presentScore += 1;
          dispatchEvent(new CustomEvent('dice-2', {}));
        }
        if (testR.z().toString().substring(0, 5) == testR.y().toString().substring(1, 6)) {
          this.lastRoll += " 6 +";
          this.presentScore += 6;
          dispatchEvent(new CustomEvent('dice-5', {}));
        }
        if (testR.z().toString().substring(0, 5) == testR.y().toString().substring(0, 5)) {
          this.lastRoll += " 5 +";
          this.presentScore += 5;
          dispatchEvent(new CustomEvent('dice-3', {}));
        }
        console.log('this.lastRoll = ', this.lastRoll, ' presentScore = ', this.presentScore);
      }
    }
  }
  updatePhysics() {
    const trans = new Ammo.btTransform();
    const transform = new Ammo.btTransform();
    this.rigidBodies.forEach(function (body) {
      if (body.isKinematic) {
        transform.setIdentity();
        transform.setOrigin(new Ammo.btVector3(body.MEObject.position.x, body.MEObject.position.y, body.MEObject.position.z));
        const quat = new Ammo.btQuaternion();
        quat.setRotation(new Ammo.btVector3(body.MEObject.rotation.axis.x, body.MEObject.rotation.axis.y, body.MEObject.rotation.axis.z), (0, _utils.degToRad)(body.MEObject.rotation.angle));
        transform.setRotation(quat);
        body.setWorldTransform(transform);
        const ms = body.getMotionState();
        if (ms) ms.setWorldTransform(transform);
      }
    });
    Ammo.destroy(transform);

    // Step simulation AFTER setting kinematic transforms
    this.dynamicsWorld.stepSimulation(1 / 60, 10);
    this.rigidBodies.forEach(function (body) {
      if (!body.isKinematic && body.getMotionState()) {
        body.getMotionState().getWorldTransform(trans);
        const _x = +trans.getOrigin().x().toFixed(2);
        const _y = +trans.getOrigin().y().toFixed(2);
        const _z = +trans.getOrigin().z().toFixed(2);
        body.MEObject.position.setPosition(_x, _y, _z);
        const rot = trans.getRotation();
        const rotAxis = rot.getAxis();
        rot.normalize();
        body.MEObject.rotation.axis.x = rotAxis.x();
        body.MEObject.rotation.axis.y = rotAxis.y();
        body.MEObject.rotation.axis.z = rotAxis.z();
        body.MEObject.rotation.matrixRotation = (0, _utils.quaternion_rotation_matrix)(rot);
        body.MEObject.rotation.angle = (0, _utils.radToDeg)(parseFloat(rot.getAngle().toFixed(2)));
      }
    });
    Ammo.destroy(trans);
    this.detectCollision();
  }
}
exports.default = MatrixAmmo;

},{"../engine/utils":15}],18:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.fragmentWGSL = void 0;
let fragmentWGSL = exports.fragmentWGSL = `override shadowDepthTextureSize: f32 = 1024.0;

struct Scene {
  lightViewProjMatrix : mat4x4f,
  cameraViewProjMatrix : mat4x4f,
  lightPos : vec3f,
}

@group(0) @binding(0) var<uniform> scene : Scene;
@group(0) @binding(1) var shadowMap: texture_depth_2d;
@group(0) @binding(2) var shadowSampler: sampler_comparison;
@group(0) @binding(3) var meshTexture: texture_2d<f32>;
@group(0) @binding(4) var meshSampler: sampler;

struct FragmentInput {
  @location(0) shadowPos : vec3f,
  @location(1) fragPos : vec3f,
  @location(2) fragNorm : vec3f,
  @location(3) uv : vec2f,
}

const albedo = vec3f(0.9);
const ambientFactor = 0.7;

@fragment
fn main(input : FragmentInput) -> @location(0) vec4f {
  // Percentage-closer filtering. Sample texels in the region
  // to smooth the result.
  var visibility = 0.0;
  let oneOverShadowDepthTextureSize = 1.0 / shadowDepthTextureSize;
  for (var y = -1; y <= 1; y++) {
    for (var x = -1; x <= 1; x++) {
      let offset = vec2f(vec2(x, y)) * oneOverShadowDepthTextureSize;

      visibility += textureSampleCompare(
        shadowMap, shadowSampler,
        input.shadowPos.xy + offset, input.shadowPos.z - 0.007
      );
    }
  }
  visibility /= 9.0;
  let lambertFactor = max(dot(normalize(scene.lightPos - input.fragPos), normalize(input.fragNorm)), 0.0);
  let lightingFactor = min(ambientFactor + visibility * lambertFactor, 1.0);
  let textureColor = textureSample(meshTexture, meshSampler, input.uv);

  return vec4(textureColor.rgb * lightingFactor * albedo, 1.0);
  // return vec4f(input.fragNorm * 0.5 + 0.5, 1)
  // return vec4f(input.uv, 0, 1)
  // return vec4(textureColor.rgb , 0.5);
}`;

},{}],19:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.UNLIT_SHADER = void 0;
/**
 * @description
 * UNIT Texures -
 * Good for performance
 */
const UNLIT_SHADER = exports.UNLIT_SHADER = `struct Uniforms {
  viewProjectionMatrix : mat4x4f
}
@group(0) @binding(0) var<uniform> uniforms : Uniforms;

@group(1) @binding(0) var<uniform> modelMatrix : mat4x4f;

struct VertexInput {
  @location(0) position : vec4f,
  @location(1) normal : vec3f,
  @location(2) uv : vec2f
}

struct VertexOutput {
  @builtin(position) position : vec4f,
  @location(0) normal: vec3f,
  @location(1) uv : vec2f,
}

@vertex
fn vertexMain(input: VertexInput) -> VertexOutput {
  var output : VertexOutput;
  output.position = uniforms.viewProjectionMatrix * modelMatrix * input.position;
  output.normal = normalize((modelMatrix * vec4(input.normal, 0)).xyz);
  output.uv = input.uv;
  return output;
}

@group(1) @binding(1) var meshSampler: sampler;
@group(1) @binding(2) var meshTexture: texture_2d<f32>;

// Static directional lighting
const lightDir = vec3f(0, 1, 0);
const dirColor = vec3(1);
const ambientColor = vec3f(0.05);

@fragment
fn fragmentMain(input: VertexOutput) -> @location(0) vec4f {
  let textureColor = textureSample(meshTexture, meshSampler, input.uv);

  // Very simplified lighting algorithm.
  let lightColor = saturate(ambientColor + max(dot(input.normal, lightDir), 0.0) * dirColor);

  return vec4f(textureColor.rgb * lightColor, textureColor.a);
}`;

},{}],20:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.vertexWGSL = void 0;
let vertexWGSL = exports.vertexWGSL = `struct Scene {
  lightViewProjMatrix: mat4x4f,
  cameraViewProjMatrix: mat4x4f,
  lightPos: vec3f,
}

struct Model {
  modelMatrix: mat4x4f,
}

@group(0) @binding(0) var<uniform> scene : Scene;
@group(1) @binding(0) var<uniform> model : Model;

struct VertexOutput {
  @location(0) shadowPos: vec3f,
  @location(1) fragPos: vec3f,
  @location(2) fragNorm: vec3f,
  @location(3) uv : vec2f,
  
  @builtin(position) Position: vec4f,
}

@vertex
fn main(
  @location(0) position: vec3f,
  @location(1) normal: vec3f,
  @location(2) uv : vec2f
) -> VertexOutput {
  var output : VertexOutput;

  // XY is in (-1, 1) space, Z is in (0, 1) space
  let posFromLight = scene.lightViewProjMatrix * model.modelMatrix * vec4(position, 1.0);

  // Convert XY to (0, 1)
  // Y is flipped because texture coords are Y-down.
  output.shadowPos = vec3(
    posFromLight.xy * vec2(0.5, -0.5) + vec2(0.5),
    posFromLight.z
  );

  output.Position = scene.cameraViewProjMatrix * model.modelMatrix * vec4(position, 1.0);
  output.fragPos = output.Position.xyz;
  output.fragNorm = normal;
  // nidza
  output.uv = uv;

  return output;
}
`;

},{}],21:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.vertexShadowWGSL = void 0;
let vertexShadowWGSL = exports.vertexShadowWGSL = `struct Scene {
  lightViewProjMatrix: mat4x4f,
  cameraViewProjMatrix: mat4x4f,
  lightPos: vec3f,
}

struct Model {
  modelMatrix: mat4x4f,
}

@group(0) @binding(0) var<uniform> scene : Scene;
@group(1) @binding(0) var<uniform> model : Model;

@vertex
fn main(
  @location(0) position: vec3f
) -> @builtin(position) vec4f {
  return scene.lightViewProjMatrix * model.modelMatrix * vec4(position, 1);
}
`;

},{}],22:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.MatrixSounds = void 0;
class MatrixSounds {
  constructor() {
    this.volume = 0.5;
    this.audios = {};
    this.enabled = true; // 🔇 global flag to mute/allow audio
  }
  muteAll() {
    this.enabled = false;
    Object.values(this.audios).forEach(audio => audio.pause());
  }
  unmuteAll() {
    this.enabled = true;
  }
  createClones(c, name, path) {
    for (let x = 1; x < c; x++) {
      const a = new Audio(path);
      a.id = name + x;
      a.volume = this.volume;
      this.audios[name + x] = a;
      document.body.append(a);
    }
  }
  createAudio(name, path, useClones) {
    const a = new Audio(path);
    a.id = name;
    a.volume = this.volume;
    this.audios[name] = a;
    document.body.append(a);
    if (typeof useClones !== 'undefined') {
      this.createClones(useClones, name, path);
    }
  }
  play(name) {
    if (!this.enabled) return; // 🔇 prevent playing if muted

    const audio = this.audios[name];
    if (!audio) return;
    if (audio.paused) {
      audio.play().catch(e => {
        if (e.name !== 'NotAllowedError') console.warn("sounds error:", e);
      });
    } else {
      this.tryClone(name);
    }
  }
  tryClone(name) {
    if (!this.enabled) return; // 🔇 prevent playing clones

    let cc = 1;
    try {
      while (this.audios[name + cc] && this.audios[name + cc].paused === false) {
        cc++;
      }
      if (this.audios[name + cc]) {
        this.audios[name + cc].play();
      }
    } catch (err) {
      console.warn("Clone play failed:", err);
    }
  }
}
exports.MatrixSounds = MatrixSounds;

},{}],23:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _wgpuMatrix = require("wgpu-matrix");
var _ball = _interopRequireDefault(require("./engine/ball.js"));
var _cube = _interopRequireDefault(require("./engine/cube.js"));
var _engine = require("./engine/engine.js");
var _mesh = _interopRequireDefault(require("./engine/mesh.js"));
var _meshObj = _interopRequireDefault(require("./engine/mesh-obj.js"));
var _matrixAmmo = _interopRequireDefault(require("./physics/matrix-ammo.js"));
var _utils = require("./engine/utils.js");
var _lang = require("./multilang/lang.js");
var _sounds = require("./sounds/sounds.js");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
class MatrixEngineWGPU {
  mainRenderBundle = [];
  rbContainer = [];
  frame = () => {};
  entityHolder = [];
  entityArgPass = {
    loadOp: 'clear',
    storeOp: 'store',
    depthLoadOp: 'clear',
    depthStoreOp: 'store'
  };
  matrixAmmo = new _matrixAmmo.default();
  matrixSounds = new _sounds.MatrixSounds();

  // The input handler
  constructor(options, callback) {
    // console.log('typeof options ', typeof options )
    if (typeof options == 'undefined' || typeof options == "function") {
      this.options = {
        useSingleRenderPass: true,
        canvasSize: 'fullscreen',
        mainCameraParams: {
          type: 'WASD',
          responseCoef: 2000
        }
      };
      callback = options;
    }
    if (typeof options.mainCameraParams === 'undefined') {
      options.mainCameraParams = {
        type: 'WASD',
        responseCoef: 2000
      };
    }
    this.options = options;
    this.mainCameraParams = options.mainCameraParams;
    var canvas = document.createElement('canvas');
    if (this.options.canvasSize == 'fullscreen') {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    } else {
      canvas.width = this.options.canvasSize.w;
      canvas.height = this.options.canvasSize.h;
    }
    document.body.append(canvas);

    // The camera types
    const initialCameraPosition = _wgpuMatrix.vec3.create(0, 0, 0);
    // console.log('passed : o.mainCameraParams.responseCoef ', o.mainCameraParams.responseCoef)
    this.mainCameraParams = {
      type: this.options.mainCameraParams.type,
      responseCoef: this.options.mainCameraParams.responseCoef
    };
    this.cameras = {
      arcball: new _engine.ArcballCamera({
        position: initialCameraPosition
      }),
      WASD: new _engine.WASDCamera({
        position: initialCameraPosition
      })
    };

    //
    this.label = new _lang.MultiLang();
    if (_utils.urlQuery.lang != null) {
      this.label.loadMultilang(_utils.urlQuery.lang).then(r => {
        this.label.get = r;
      });
    } else {
      this.label.loadMultilang().then(r => {
        this.label.get = r;
      });
    }
    this.init({
      canvas,
      callback
    });
  }
  init = async ({
    canvas,
    callback
  }) => {
    this.canvas = canvas;
    this.adapter = await navigator.gpu.requestAdapter();
    this.device = await this.adapter.requestDevice({
      extensions: ["ray_tracing"]
    });

    // Maybe works in ssl with webworkers...
    // const adapterInfo = await this.adapter.requestAdapterInfo();
    // var test = this.adapter.features()
    // console.log(adapterInfo.vendor);
    // console.log('test' + test);
    // console.log("FEATURES : " + this.adapter.features)

    this.context = canvas.getContext('webgpu');
    const devicePixelRatio = window.devicePixelRatio;
    canvas.width = canvas.clientWidth * devicePixelRatio;
    canvas.height = canvas.clientHeight * devicePixelRatio;
    const presentationFormat = navigator.gpu.getPreferredCanvasFormat();
    this.context.configure({
      device: this.device,
      format: presentationFormat,
      alphaMode: 'premultiplied'
    });
    if (this.options.useSingleRenderPass == true) {
      this.frame = this.frameSinglePass;
    } else {
      this.frame = this.framePassPerObject;
    }
    this.run(callback);
  };

  // Not in use for now
  addCube = o => {
    if (typeof o === 'undefined') {
      var o = {
        scale: 1,
        position: {
          x: 0,
          y: 0,
          z: -4
        },
        texturesPaths: ['./res/textures/default.png'],
        rotation: {
          x: 0,
          y: 0,
          z: 0
        },
        rotationSpeed: {
          x: 0,
          y: 0,
          z: 0
        },
        entityArgPass: this.entityArgPass,
        cameras: this.cameras,
        mainCameraParams: this.mainCameraParams
      };
    } else {
      if (typeof o.position === 'undefined') {
        o.position = {
          x: 0,
          y: 0,
          z: -4
        };
      }
      if (typeof o.rotation === 'undefined') {
        o.rotation = {
          x: 0,
          y: 0,
          z: 0
        };
      }
      if (typeof o.rotationSpeed === 'undefined') {
        o.rotationSpeed = {
          x: 0,
          y: 0,
          z: 0
        };
      }
      if (typeof o.texturesPaths === 'undefined') {
        o.texturesPaths = ['./res/textures/default.png'];
      }
      if (typeof o.scale === 'undefined') {
        o.scale = 1;
      }
      if (typeof o.mainCameraParams === 'undefined') {
        o.mainCameraParams = this.mainCameraParams;
      }
      o.entityArgPass = this.entityArgPass;
      o.cameras = this.cameras;
    }
    let myCube1 = new _cube.default(this.canvas, this.device, this.context, o);
    this.mainRenderBundle.push(myCube1);
  };

  // Not in use for now
  addBall = o => {
    if (typeof o === 'undefined') {
      var o = {
        scale: 1,
        position: {
          x: 0,
          y: 0,
          z: -4
        },
        texturesPaths: ['./res/textures/default.png'],
        rotation: {
          x: 0,
          y: 0,
          z: 0
        },
        rotationSpeed: {
          x: 0,
          y: 0,
          z: 0
        },
        entityArgPass: this.entityArgPass,
        cameras: this.cameras,
        mainCameraParams: this.mainCameraParams
      };
    } else {
      if (typeof o.position === 'undefined') {
        o.position = {
          x: 0,
          y: 0,
          z: -4
        };
      }
      if (typeof o.rotation === 'undefined') {
        o.rotation = {
          x: 0,
          y: 0,
          z: 0
        };
      }
      if (typeof o.rotationSpeed === 'undefined') {
        o.rotationSpeed = {
          x: 0,
          y: 0,
          z: 0
        };
      }
      if (typeof o.texturesPaths === 'undefined') {
        o.texturesPaths = ['./res/textures/default.png'];
      }
      if (typeof o.mainCameraParams === 'undefined') {
        o.mainCameraParams = this.mainCameraParams;
      }
      if (typeof o.scale === 'undefined') {
        o.scale = 1;
      }
      o.entityArgPass = this.entityArgPass;
      o.cameras = this.cameras;
    }
    let myBall1 = new _ball.default(this.canvas, this.device, this.context, o);
    this.mainRenderBundle.push(myBall1);
  };

  // Not in use for now
  addMesh = o => {
    if (typeof o.position === 'undefined') {
      o.position = {
        x: 0,
        y: 0,
        z: -4
      };
    }
    if (typeof o.rotation === 'undefined') {
      o.rotation = {
        x: 0,
        y: 0,
        z: 0
      };
    }
    if (typeof o.rotationSpeed === 'undefined') {
      o.rotationSpeed = {
        x: 0,
        y: 0,
        z: 0
      };
    }
    if (typeof o.texturesPaths === 'undefined') {
      o.texturesPaths = ['./res/textures/default.png'];
    }
    if (typeof o.mainCameraParams === 'undefined') {
      o.mainCameraParams = this.mainCameraParams;
    }
    if (typeof o.scale === 'undefined') {
      o.scale = 1;
    }
    o.entityArgPass = this.entityArgPass;
    o.cameras = this.cameras;
    if (typeof o.name === 'undefined') {
      o.name = 'random' + Math.random();
    }
    if (typeof o.mesh === 'undefined') {
      throw console.error('arg mesh is empty...');
      return;
    }
    console.log('Mesh procedure', o);
    let myMesh1 = new _mesh.default(this.canvas, this.device, this.context, o);
    this.mainRenderBundle.push(myMesh1);
  };
  addMeshObj = o => {
    if (typeof o.name === 'undefined') {
      o.name = (0, _utils.genName)(9);
    }
    if (typeof o.position === 'undefined') {
      o.position = {
        x: 0,
        y: 0,
        z: -4
      };
    }
    if (typeof o.rotation === 'undefined') {
      o.rotation = {
        x: 0,
        y: 0,
        z: 0
      };
    }
    if (typeof o.rotationSpeed === 'undefined') {
      o.rotationSpeed = {
        x: 0,
        y: 0,
        z: 0
      };
    }
    if (typeof o.texturesPaths === 'undefined') {
      o.texturesPaths = ['./res/textures/default.png'];
    }
    if (typeof o.mainCameraParams === 'undefined') {
      o.mainCameraParams = this.mainCameraParams;
    }
    if (typeof o.scale === 'undefined') {
      o.scale = [1, 1, 1];
    }
    if (typeof o.raycast === 'undefined') {
      o.raycast = {
        enabled: false
      };
    }
    o.entityArgPass = this.entityArgPass;
    o.cameras = this.cameras;
    // if(typeof o.name === 'undefined') {o.name = 'random' + Math.random();}
    if (typeof o.mesh === 'undefined') {
      _utils.mb.error('arg mesh is empty for ', o.name);
      throw console.error('arg mesh is empty...');
      return;
    }
    if (typeof o.physics === 'undefined') {
      o.physics = {
        scale: [1, 1, 1],
        enabled: true,
        geometry: "Sphere",
        radius: o.scale,
        name: o.name,
        rotation: o.rotation
      };
    }
    if (typeof o.physics.enabled === 'undefined') {
      o.physics.enabled = true;
    }
    if (typeof o.physics.geometry === 'undefined') {
      o.physics.geometry = "Sphere";
    }
    if (typeof o.physics.radius === 'undefined') {
      o.physics.radius = o.scale;
    }
    if (typeof o.physics.mass === 'undefined') {
      o.physics.mass = 1;
    }
    if (typeof o.physics.name === 'undefined') {
      o.physics.name = o.name;
    }
    if (typeof o.physics.scale === 'undefined') {
      o.physics.scale = o.scale;
    }
    if (typeof o.physics.rotation === 'undefined') {
      o.physics.rotation = o.rotation;
    }

    // send same pos
    o.physics.position = o.position;
    //  console.log('Mesh procedure', o)
    let myMesh1 = new _meshObj.default(this.canvas, this.device, this.context, o);
    if (o.physics.enabled == true) {
      this.matrixAmmo.addPhysics(myMesh1, o.physics);
    }
    this.mainRenderBundle.push(myMesh1);
  };
  run(callback) {
    setTimeout(() => {
      requestAnimationFrame(this.frame);
    }, 500);
    setTimeout(() => {
      callback(this);
    }, 20);
  }
  destroyProgram = () => {
    this.mainRenderBundle = undefined;
    this.canvas.remove();
  };
  frameSinglePass = () => {
    if (typeof this.mainRenderBundle == 'undefined') return;
    try {
      let shadowPass = null;
      let renderPass;
      let commandEncoder = this.device.createCommandEncoder();
      this.mainRenderBundle.forEach((meItem, index) => {
        meItem.position.update();
      });
      this.matrixAmmo.updatePhysics();
      this.mainRenderBundle.forEach((meItem, index) => {
        meItem.draw(commandEncoder);
        shadowPass = commandEncoder.beginRenderPass(meItem.shadowPassDescriptor);
        shadowPass.setPipeline(meItem.shadowPipeline);
        meItem.drawShadows(shadowPass);
        shadowPass.end();
      });
      this.mainRenderBundle.forEach((meItem, index) => {
        if (index == 0) {
          renderPass = commandEncoder.beginRenderPass(meItem.renderPassDescriptor);
          renderPass.setPipeline(meItem.pipeline);
        }
      });
      this.mainRenderBundle.forEach((meItem, index) => {
        meItem.drawElements(renderPass);
      });
      if (renderPass) renderPass.end();
      this.device.queue.submit([commandEncoder.finish()]);
      requestAnimationFrame(this.frame);
    } catch (err) {
      console.log('%cDraw func (err):' + err, _utils.LOG_WARN);
      requestAnimationFrame(this.frame);
    }
  };
  framePassPerObject = () => {
    let commandEncoder = this.device.createCommandEncoder();
    this.mainRenderBundle.forEach(meItem => {
      // Update transforms, physics, etc. (optional)
      meItem.draw(commandEncoder); // optional: if this does per-frame updates

      if (meItem.renderBundle) {
        // Set up view per object
        meItem.renderPassDescriptor.colorAttachments[0].view = this.context.getCurrentTexture().createView();
        const passEncoder = commandEncoder.beginRenderPass(meItem.renderPassDescriptor);
        passEncoder.executeBundles([meItem.renderBundle]); // ✅ Use only this bundle
        passEncoder.end();
      } else {
        meItem.draw(commandEncoder); // fallback if no renderBundle
      }
    });
    this.device.queue.submit([commandEncoder.finish()]);
    requestAnimationFrame(this.frame);
  };
}
exports.default = MatrixEngineWGPU;

},{"./engine/ball.js":7,"./engine/cube.js":8,"./engine/engine.js":9,"./engine/mesh-obj.js":12,"./engine/mesh.js":13,"./engine/utils.js":15,"./multilang/lang.js":16,"./physics/matrix-ammo.js":17,"./sounds/sounds.js":22,"wgpu-matrix":6}]},{},[1]);
