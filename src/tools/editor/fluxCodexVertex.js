/**
 * @description
 * Flux Codex Vertex use visual scripting model.
 *
 * @filename
 * fluxCodexVertex.js
 *
 * @Licence
 * This Source Code Form is subject to the terms of the
 * Mozilla Public License, v. 2.0.
 * If a copy of the MPL was not distributed with this file,
 * You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2025 Nikola Lukić zlatnaspirala@gmail.com
 *
 * @Note
 * License summary for fluxCodexVertex.js (MPL 2.0):
 *
 * ✔ You MAY:
 * - Use this file in commercial and proprietary software
 * - Modify and redistribute this file
 * - Combine it with closed-source code
 * - Sell software that includes this file
 *
 * ✘ You MUST:
 * - Publish the source code of this file if you modify it
 * - Keep this file under MPL 2.0
 * - Provide a link to the MPL 2.0 license
 * - Preserve copyright notices
 *
 * ✔ You do NOT have to:
 * - Open-source your entire project
 * - Publish files that merely import or use this file
 * - Release unrelated source code
 *
 * - MPL applies ONLY to this file
 */
import {METoolTip} from "../../engine/plugin/tooltip/ToolTip";
import {byId, LOG_FUNNY_ARCADE, mb, OSCILLATOR} from "../../engine/utils";
import {MatrixMusicAsset} from "../../sounds/audioAsset";
import {CurveData, CurveEditor} from "./curve-editor";

// Engine agnostic
export let runtimeCacheObjs = [];

export default class FluxCodexVertex {
  constructor(boardId, boardWrapId, logId, methodsManager, projName) {
    this.debugMode = true;
    this.toolTip = new METoolTip();

    this.curveEditor = new CurveEditor();

    this.SAVE_KEY = "fluxCodexVertex" + projName;
    this.methodsManager = methodsManager;
    this.variables = {
      number: {},
      boolean: {},
      string: {},
      object: {},
    };

    // DOM Elements
    this.board = document.getElementById(boardId);
    this.boardWrap = document.getElementById(boardWrapId);
    this.svg = this.board.querySelector("svg.connections");
    this.logEl = document.getElementById(logId);

    // Data Model
    this.nodes = {};
    this.links = [];
    this.nodeCounter = 1;
    this.linkCounter = 1;

    this._execContext = null;

    // State Management
    this.state = {
      draggingNode: null,
      dragOffset: [0, 0],
      connecting: null,
      selectedNode: null,
      pan: [0, 0],
      panning: false,
      panStart: [0, 0],
      zoom: 1
    };

    this.clearRuntime = () => {
      app.graphUpdate = () => {};
      // stop sepcial onDraw node
      console.info("%cDestroy runtime objects." + Object.values(this.nodes).filter((n) => n.title == "On Draw") , LOG_FUNNY_ARCADE);
      let allOnDraws = Object.values(this.nodes).filter((n) => n.title == "On Draw");
      for(var x = 0;x < allOnDraws.length;x++) {
        allOnDraws[x]._listenerAttached = false;
      }
      for(let x = 0;x < runtimeCacheObjs.length;x++) {
        // runtimeCacheObjs[x].destroy(); BUGGY - no sync with render loop logic!
        app.removeSceneObjectByName(runtimeCacheObjs[x].name);
      }
      byId("graph-status").innerHTML = '⚫';
    };

    this.setZoom = (z) => {
      this.state.zoom = Math.max(0.2, Math.min(2.5, z));
      this.board.style.transform = `scale(${this.state.zoom})`;
    }

    this.onWheel = (e) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      this.setZoom(this.state.zoom + delta);
    }

    this.boardWrap.addEventListener("wheel", this.onWheel.bind(this), {
      passive: false // IMPORTANT
    });

    // Bind event listeners
    this.createVariablesPopup();
    this._createImportInput();
    this.bindGlobalListeners();

    this._varInputs = {};

    // EXTRA TIME
    setTimeout(() => this.init(), 3000);

    document.addEventListener("keydown", e => {
      if(e.key == "F6") {
        e.preventDefault();
        this.runGraph();
      } else if(e.key === "Delete") {
        if(this.state.selectedNode) {
          this.deleteNode(this.state.selectedNode);
          this.state.selectedNode = null;
        }
      }
    });

    this.createContextMenu();
    // not in use ? - alternative for refresh getters/ no exec nodes
    document.addEventListener("fluxcodex.input.change", e => {
      console.log('fluxcodex.input.change')
      const {nodeId, field, value} = e.detail;
      const node = this.nodes.find(n => n.id === nodeId);
      if(!node) return;
      if(node.type !== "getSubObject") return;
      this.handleGetSubObject(node, value);
      if(field !== "path") return;
    });

    // only node no need to write intro files
    document.addEventListener('web.editor.addMp3', (e) => {
      console.log("[web.editor.addMp3]: ", e.detail);
      e.detail.path = e.detail.path.replace('\\res', 'res');
      e.detail.path = e.detail.path.replace(/\\/g, '/');
      this.addNode('audioMP3', e.detail);
    });

    // curve editor stuff
    document.addEventListener('show-curve-editor', (e) => {
      console.log('show-showCurveEditorBtn editor ', e);
      this.curveEditor.toggleEditor();
    });
  }

  createContextMenu() {
    let CMenu = document.createElement("div");
    CMenu.id = "fc-context-menu";
    CMenu.classList.add("fc-context-menu");
    CMenu.classList.add("hidden");

    const board = document.getElementById("board");

    board.addEventListener("contextmenu", e => {
      e.preventDefault();

      CMenu.innerHTML = this.getFluxCodexMenuHTML();

      const menuRect = CMenu.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      let x = e.clientX;
      let y = e.clientY;

      if(x + menuRect.width > vw) {x = vw - menuRect.width - 5;}
      if(y > vh * 0.5) {y = y - menuRect.height;}
      if(y < 5) y = 5;

      CMenu.style.left = x + "px";
      CMenu.style.top = y + "px";
      CMenu.classList.remove("hidden");
    });

    document.addEventListener("click", () => {
      CMenu.classList.add("hidden");
    });

    byId("app").appendChild(CMenu);
  }

  getFluxCodexMenuHTML() {
    return `
    <h3>Events / Func</h3>
    <button onclick="app.editor.fluxCodexVertex.addNode('event')">Event: onLoad</button>
    <button onclick="app.editor.fluxCodexVertex.addNode('function')">Function</button>
    <button onclick="app.editor.fluxCodexVertex.addNode('if')">If Branch</button>
    <button onclick="app.editor.fluxCodexVertex.addNode('genrand')">GenRandInt</button>
    <button onclick="app.editor.fluxCodexVertex.addNode('print')">Print</button>
    <button onclick="app.editor.fluxCodexVertex.addNode('timeout')">SetTimeout</button>
    <button onclick="app.editor.fluxCodexVertex.addNode('getArray')">getArray</button>
    <button onclick="app.editor.fluxCodexVertex.addNode('forEach')">forEach</button>
    <hr>
    <span>Networking</span>
    <button onclick="app.editor.fluxCodexVertex.addNode('fetch')">Fetch</button>
    <hr>
    <span>Scene</span>
    <button onclick="app.editor.fluxCodexVertex.addNode('getSceneObject')">Get Scene Object</button>
    <button onclick="app.editor.fluxCodexVertex.addNode('getSceneLight')">Get Scene Light</button>
    <button onclick="app.editor.fluxCodexVertex.addNode('getObjectAnimation')">Get Object Animation</button>
    <button onclick="app.editor.fluxCodexVertex.addNode('setPosition')">Set Position</button>
    <button onclick="app.editor.fluxCodexVertex.addNode('translateByX')">Translate by X</button>
    <button onclick="app.editor.fluxCodexVertex.addNode('translateByY')">Translate by Y</button>
    <button onclick="app.editor.fluxCodexVertex.addNode('translateByZ')">Translate by Z</button>
    <button onclick="app.editor.fluxCodexVertex.addNode('setSpeed')">Set Speed</button>
    <button onclick="app.editor.fluxCodexVertex.addNode('getSpeed')">Get Speed</button>
    <button onclick="app.editor.fluxCodexVertex.addNode('setRotation')">Set Rotation</button>
    <button onclick="app.editor.fluxCodexVertex.addNode('setRotate')">Set Rotate</button>
    <button onclick="app.editor.fluxCodexVertex.addNode('setRotateX')">Set RotateX</button>
    <button onclick="app.editor.fluxCodexVertex.addNode('setRotateY')">Set RotateY</button>
    <button onclick="app.editor.fluxCodexVertex.addNode('setRotateZ')">Set RotateZ</button>
    <button onclick="app.editor.fluxCodexVertex.addNode('setTexture')">Set Texture</button>
    <button onclick="app.editor.fluxCodexVertex.addNode('onTargetPositionReach')">onTargetPositionReach</button>
    <button onclick="app.editor.fluxCodexVertex.addNode('dynamicFunction')">Function Dinamic</button>
    <button onclick="app.editor.fluxCodexVertex.addNode('refFunction')">Function by Ref</button>
    <button onclick="app.editor.fluxCodexVertex.addNode('getSubObject')">Get Sub Object</button>
    <hr>
    <span>Comment</span>
    <button onclick="app.editor.fluxCodexVertex.addNode('comment')">Comment</button>
    <hr>
    <span>Math</span>
    <button onclick="app.editor.fluxCodexVertex.addNode('add')">Add (+)</button>
    <button onclick="app.editor.fluxCodexVertex.addNode('sub')">Sub (-)</button>
    <button onclick="app.editor.fluxCodexVertex.addNode('mul')">Mul (*)</button>
    <button onclick="app.editor.fluxCodexVertex.addNode('div')">Div (/)</button>
    <button onclick="app.editor.fluxCodexVertex.addNode('sin')">Sin</button>
    <button onclick="app.editor.fluxCodexVertex.addNode('cos')">Cos</button>
    <button onclick="app.editor.fluxCodexVertex.addNode('pi')">Pi</button>
    <hr>
    <span>Comparison</span>
    <button onclick="app.editor.fluxCodexVertex.addNode('equal')">Equal (==)</button>
    <button onclick="app.editor.fluxCodexVertex.addNode('notequal')">Not Equal (!=)</button>
    <button onclick="app.editor.fluxCodexVertex.addNode('greater')">Greater (>)</button>
    <button onclick="app.editor.fluxCodexVertex.addNode('less')">Less (<)</button>
    <hr>
    <span>Compile</span>
    <button onclick="app.editor.fluxCodexVertex.compileGraph()">Save</button>
    <button onclick="app.editor.fluxCodexVertex.runGraph()">Run (F6)</button>
  `;
  }

  log(...args) {this.logEl.textContent = args.join(" ")}

  createGetNumberNode(varName) {
    return this.addNode("getNumber", {var: varName});
  }

  createGetBooleanNode(varName) {
    return this.addNode("getBoolean", {var: varName});
  }

  createGetStringNode(varName) {
    return this.addNode("getString", {var: varName});
  }

  createGetObjectNode(varName) {
    return this.addNode("getObject", {var: varName});
  }

  createSetNumberNode(varName) {
    return this.addNode("setNumber", {var: varName});
  }

  createSetBooleanNode(varName) {
    return this.addNode("setBoolean", {var: varName});
  }

  createSetStringNode(varName) {
    return this.addNode("setString", {var: varName});
  }

  createSetObjectNode(varName) {
    return this.addNode("setObject", {var: varName});
  }

  evaluateGetterNode(n) {
    const key = n.fields?.find(f => f.key === "var")?.value;
    if(!key) return;
    const type = n.title.replace("Get ", "").toLowerCase();
    const entry = this.variables[type]?.[key];
    n._returnCache = entry ? entry.value : type === "number" ? 0
      : type === "boolean" ? false : type === "string" ? "" : type === "object"
        ? {} : undefined;
  }

  notifyVariableChanged(type, key) {
    for(const id in this.nodes) {
      const n = this.nodes[id];
      // Update getter nodes
      if(n.isGetterNode) {
        const varField = n.fields?.find(f => f.key === "var");
        if(
          varField?.value === key &&
          n.title.replace("Get ", "").toLowerCase() === type
        ) {
          this.evaluateGetterNode(n);
          if(n.displayEl) {
            const val = n._returnCache;
            if(type === "object")
              n.displayEl.textContent = JSON.stringify(val, null, 2);
            else if(type === "number")
              n.displayEl.textContent = val.toFixed(3);
            else n.displayEl.textContent = String(val);
          }
        }
      }
      // Update sub-object nodes connected to this getter
      n.inputs?.forEach(pin => {
        const link = this.getConnectedSource(n.id, pin.name);
        if(link?.node?.isGetterNode) {
          const srcNode = link.node;
          const srcPin = link.pin;
          if(srcNode.fields?.find(f => f.key === "var")?.value === key) {
            this._adaptGetSubObjectOnConnect(n, srcNode, srcPin);
          }
        }
      });
    }
    // Update variable input UI if exists
    const input = this._varInputs?.[`${type}.${key}`];
    if(input) {
      const storedValue = this.variables?.[type]?.[key];
      if(type === "object")
        input.value = JSON.stringify(storedValue ?? {}, null, 2);
      else input.value = storedValue ?? "";
    }
  }

  createVariablesPopup() {
    if(this._varsPopup) return;
    const popup = document.createElement("div");
    popup.id = "varsPopup";
    this._varsPopup = popup;
    Object.assign(popup.style, {
      display: "none",
      flexDirection: "column",
      position: "absolute",
      top: "10%",
      left: "0",
      width: "60%",
      height: "60%",
      overflow: "scroll",
      background:
        "linear-gradient(135deg, #1a1a1a 0%, #2b2b2b 100%), /* subtle dark gradient */ repeating-linear-gradient(0deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.05) 1px, transparent 1px, transparent 20px), repeating-linear-gradient(90deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.05) 1px, transparent 1px, transparent 20px)",
      backgroundBlendMode: "overlay",
      backgroundSize: "auto, 20px 20px, 20px 20px",
      border: "1px solid #444",
      borderRadius: "8px",
      padding: "10px",
      zIndex: 9999,
      color: "#eee",
      overflowX: "hidden",
    });
    // HEADER
    const title = document.createElement("div");
    title.innerHTML = `Variables`;
    title.style.marginBottom = "8px";
    title.style.fontWeight = "bold";
    popup.appendChild(title);
    const list = document.createElement("div");
    list.id = "varslist";
    popup.appendChild(list);
    // CREATE BUTTONS
    const btns = document.createElement("div");
    btns.style.marginTop = "10px";
    btns.style.display = "flex";
    btns.style.gap = "6px";
    btns.append(
      this._createVarBtn("Number", "number"),
      this._createVarBtn("Boolean", "boolean"),
      this._createVarBtn("String", "string"),
      this._createVarBtn("Object", "object")
    );

    popup.appendChild(btns);
    const hideVPopup = document.createElement("button");
    hideVPopup.innerText = `Hide`;
    hideVPopup.classList.add("btn4");
    hideVPopup.style.margin = "8px 8px 8px 8px";
    hideVPopup.style.width = "200px";
    hideVPopup.style.fontWeight = "bold";
    hideVPopup.style.webkitTextStrokeWidth = "0px";
    hideVPopup.addEventListener("click", () => {byId("varsPopup").style.display = "none";});
    popup.appendChild(hideVPopup);

    const saveVPopup = document.createElement("button");
    saveVPopup.innerText = `Save`;
    saveVPopup.classList.add("btn4");
    saveVPopup.style.margin = "8px 8px 8px 8px";
    saveVPopup.style.width = "200px";
    saveVPopup.style.height = "70px";
    saveVPopup.style.fontWeight = "bold";
    saveVPopup.style.webkitTextStrokeWidth = "0px";
    saveVPopup.addEventListener("click", () => {this.compileGraph()});
    popup.appendChild(saveVPopup);

    document.body.appendChild(popup);
    this.makePopupDraggable(popup);
    this._refreshVarsList(list);
  }

  _refreshVarsList(container) {
    container.innerHTML = "";

    const colors = {
      number: "#4fc3f7",
      boolean: "#aed581",
      string: "#ffb74d",
      object: "#ce93d8",
    };

    for(const type in this.variables) {
      for(const name in this.variables[type]) {
        const row = document.createElement("div");
        Object.assign(row.style, {
          display: "flex",
          alignItems: "center",
          gap: "6px",
          padding: "4px",
          cursor: "pointer",
          borderBottom: "1px solid #222",
          color: colors[type] || "#fff",
          placeContent: "space-around"
        });

        const label = document.createElement("span");
        label.textContent = `${name} (${type})`;
        label.style.width = "20%";

        let input;
        if(type === "object") {
          input = document.createElement("textarea");
          input.value = JSON.stringify(this.variables[type][name] ?? {}, null, 2);
          input.style.height = "40px";
          input.style.webkitTextStrokeWidth = "0px";
        } else {
          input = document.createElement("input");
          input.value = this.variables[type][name] ?? "";
        }
        input.style.width = "30%";

        this._varInputs[`${type}.${name}`] = input;
        Object.assign(input.style, {
          background: "#000",
          color: "#fff",
          border: "1px solid #333",
        });

        input.oninput = () => {
          if(type === "object") {
            try {
              this.variables.object[name] = JSON.parse(input.value);
            } catch {
              return;
            }
          } else if(type === "number") {
            this.variables.number[name] = parseFloat(input.value);
          } else if(type === "boolean") {
            this.variables.boolean[name] = input.value === "true";
          } else {
            this.variables.string[name] = input.value;
          }
        };

        const btnGet = document.createElement("button");
        btnGet.innerText = "Get";
        btnGet.classList.add("btnGetter");
        btnGet.onclick = () => {
          if(type === "number") this.createGetNumberNode(name);
          else if(type === "boolean") this.createGetBooleanNode(name);
          else if(type === "string") this.createGetStringNode(name);
          else if(type === "object") this.createGetObjectNode(name);
        };

        const btnSet = document.createElement("button");
        btnSet.innerText = "Set";
        btnSet.classList.add("btnGetter");
        btnSet.onclick = () => {
          if(type === "number") this.createSetNumberNode(name);
          else if(type === "boolean") this.createSetBooleanNode(name);
          else if(type === "string") this.createSetStringNode(name);
          else if(type === "object") this.createSetObjectNode(name);
        };

        const btnDel = document.createElement("button");
        btnDel.innerText = "Del";
        btnDel.classList.add("btnGetter");
        btnDel.style.color = "#ff5252";

        btnDel.onclick = () => {
          if(!confirm(`Delete variable "${name}" (${type}) ?`)) return;
          delete this.variables[type][name];
          delete this._varInputs[`${type}.${name}`];
          this._refreshVarsList(container);
        };

        row.append(label, input, btnGet, btnSet, btnDel);
        container.appendChild(row);
      }
    }
  }

  makePopupDraggable(popup, handle = popup) {
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let startLeft = 0;
    let startTop = 0;

    handle.style.cursor = "move";

    handle.addEventListener("mousedown", e => {
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      const rect = popup.getBoundingClientRect();
      startLeft = rect.left;
      startTop = rect.top;
      popup.style.left = startLeft + "px";
      popup.style.top = startTop + "px";
      popup.style.transform = "none";
      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    });

    const onMove = e => {
      if(!isDragging) return;
      popup.style.left = startLeft + (e.clientX - startX) + "px";
      popup.style.top = startTop + (e.clientY - startY) + "px";
    };

    const onUp = () => {
      isDragging = false;
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
  }

  _createVarBtn(label, type) {
    const btn = document.createElement("button");
    btn.textContent = label;
    btn.style.flex = "1";
    btn.style.cursor = "pointer";
    btn.classList.add("btn4");

    btn.onclick = () => {
      const name = prompt(`New ${type} variable name`);
      if(!name) return;
      if(!this.variables[type]) this.variables[type] = {};
      if(this.variables[type][name]) {
        alert("Variable exists");
        return;
      }
      // Create variable
      this.variables[type][name] =
        type === "object" ? {} : type === "number" ? 0 : type === "boolean" ? false : type === "string" ? "" : null;
      this._refreshVarsList(this._varsPopup.children[1]);
      // console.log("[NEW VARIABLE]", type, name, this.variables[type][name]);
    };

    return btn;
  }

  _getPinDot(nodeId, pinName, isOutput) {
    const nodeEl = document.querySelector(`.node[data-id="${nodeId}"]`);
    if(!nodeEl) return null;
    const io = isOutput ? "out" : "in";
    return nodeEl.querySelector(`.pin[data-pin="${pinName}"][data-io="${io}"] .dot`);
  }

  populateVariableSelect(select, type) {
    select.innerHTML = "";

    const vars = this.variables[type];
    if(!vars.length) {
      const opt = document.createElement("option");
      opt.textContent = "(no variables)";
      opt.disabled = true;
      select.appendChild(opt);
      return;
    }

    vars.forEach(v => {
      const opt = document.createElement("option");
      opt.value = v.name;
      opt.textContent = v.name;
      select.appendChild(opt);
    });
  }
  // Dynamic Method Helpers
  getArgNames(fn) {
    const src = fn.toString().trim();
    // Case 1: arrow function with no parentheses:  a => ...
    const arrowNoParen = src.match(/^([a-zA-Z0-9_$]+)\s*=>/);
    if(arrowNoParen) {
      return [arrowNoParen[1].trim()];
    }
    // Case 2: normal (a,b) => ...  OR function(a,b) { ... }
    const argsMatch = src.match(/\(([^)]*)\)/);
    if(argsMatch && argsMatch[1].trim().length > 0) {
      return argsMatch[1]
        .split(",")
        .map(a => a.trim())
        .filter(a => a.length > 0);
    }
    // Default: no args
    return [];
  }

  hasReturn(fn) {
    const src = fn.toString().trim();
    // Case 1: implicit return in arrow: (a)=>a+2  OR  a=>a*2
    // Detect arrow "=>" followed by an expression, not "{"
    if(/=>\s*[^({]/.test(src)) {
      return true;
    }
    // Case 2: normal "return" inside function body
    if(/return\s+/.test(src)) {
      return true;
    }
    return false;
  }

  adaptNodeToMethod(node, methodItem) {
    const fn = this.methodsManager.compileFunction(methodItem.code);
    // Reset pins except execution pins
    node.inputs = [{name: "exec", type: "action"}];
    node.outputs = [{name: "execOut", type: "action"}];
    // Dynamic input pins
    const args = this.getArgNames(fn);
    args.forEach(arg => node.inputs.push({name: arg, type: "value"}));
    // Dynamic return pin
    if(this.hasReturn(fn)) node.outputs.push({name: "return", type: "value"});

    // test 
    node.outputs.push({name: "reference", type: "function"});

    node.attachedMethod = methodItem.name;
    node.fn = fn;
    this.updateNodeDOM(node.id);
  }

  adaptNodeToMethod2(node, methodItem) {
    const fn = this.methodsManager.compileFunction(methodItem.code);
    const args = this.getArgNames(fn);

    // Preserve action + reference pins
    const preservedInputs = node.inputs.filter(
      p => p.type === "action" || p.name === "reference"
    );

    const preservedOutputs = node.outputs.filter(
      p => p.type === "action"
    );

    node.inputs = [...preservedInputs];
    node.outputs = [...preservedOutputs];

    // Add argument pins (reuse if exists)
    args.forEach(arg => {
      if(!node.inputs.some(p => p.name === arg)) {
        node.inputs.push({name: arg, type: "value"});
      }
    });

    // Return value
    if(this.hasReturn(fn)) {
      if(!node.outputs.some(p => p.name === "return")) {
        node.outputs.push({name: "return", type: "value"});
      }
    }

    node.attachedMethod = methodItem.name;
    node.fn = fn;
    this.updateNodeDOM(node.id);
  }

  adaptRefFunctionNode(node, fnRef) {
    const args = this.getArgNames(fnRef);
    const hasReturn = this.hasReturn(fnRef);
    // Preserve exec + reference pins
    const preservedInputs = node.inputs.filter(
      p => p.type === "action" || p.name === "reference"
    );

    const preservedOutputs = node.outputs.filter(
      p => p.type === "action"
    );

    node.inputs = [...preservedInputs];
    node.outputs = [...preservedOutputs];
    // 🔹 Real argument pins
    args.forEach(arg => {
      if(!node.inputs.some(p => p.name === arg)) {
        node.inputs.push({
          name: arg,
          type: "value"
        });
      }
    });
    // 🔹 Real return
    if(hasReturn) {
      if(!node.outputs.some(p => p.name === "return")) {
        node.outputs.push({
          name: "return",
          type: "value"
        });
      }
    }
    // Execution logic
    node.fn = (...callArgs) => fnRef(...callArgs);
    this.updateNodeDOM(node.id);
  }

  populateMethodsSelect(selectEl) {
    selectEl.innerHTML = "";
    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "-- Select Method --";
    selectEl.appendChild(placeholder);
    this.methodsManager.methodsContainer.forEach(method => {
      const opt = document.createElement("option");
      opt.value = method.name;
      opt.textContent = method.name;
      selectEl.appendChild(opt);
    });
  }

  _getSceneSelectedName(node) {
    return node.fields?.find(
      f => f.key === "selectedObject" || f.key === "object"
    )?.value;
  }

  updateNodeDOM(nodeId) {
    const node = this.nodes[nodeId];
    const el = document.querySelector(`.node[data-id="${nodeId}"]`);
    if(!el) return;

    const left = el.querySelector(".pins-left");
    const right = el.querySelector(".pins-right");
    if(!left || !right) return;
    // Clear only **non-exec pins**
    left.innerHTML = "";
    right.innerHTML = "";

    const inputs = node.inputs || [];
    const outputs = node.outputs || [];

    inputs.forEach(pin => left.appendChild(this._pinElement(pin, false, nodeId)));
    outputs.forEach(pin => right.appendChild(this._pinElement(pin, true, nodeId)));

    if(node.title === "Get Scene Object" || node.title === "Get Scene Light" || node.title === "Get Scene Animation") {
      const select = el.querySelector("select.scene-select");
      if(select) {
        console.log('!TEST! ???')
        const objects = spec.accessObject || [];
        objects.forEach(obj => {
          const opt = document.createElement("option");
          opt.value = obj.name;
          opt.textContent = obj.name;
          select.appendChild(opt);
        });
        const selected = this._getSceneSelectedName(node);
        if(selected) {
          select.value = selected;
        }
      }
    } else if(node.category === "action" && node.title === "Function") {
      let select = el.querySelector("select.method-select");
      if(!select) {
        select = document.createElement("select");
        select.className = "method-select";
        select.style.cssText = "width:100%; margin-top:6px;";
        el.querySelector(".body").appendChild(select);
      }
      this.populateMethodsSelect(select);

      if(node.attachedMethod) select.value = node.attachedMethod;

      select.onchange = e => {
        const selected = this.methodsManager.methodsContainer.find(m => m.name === e.target.value);
        console.log('test reference::::', selected)
        if(selected) this.adaptNodeToMethod(node, selected);
      };
    } else if(node.category === "functions") {
      const dom = document.querySelector(`.node[data-id="${nodeId}"]`);
      this.restoreDynamicFunctionNode(node, dom);
    } else if(node.category === "reffunctions") {
      const dom = document.querySelector(`.node[data-id="${nodeId}"]`);
      this.restoreDynamicFunctionNode(node, dom);
    }
  }

  restoreDynamicFunctionNode(node, dom) {
    // Restore accessObject reference from literal
    if(!node.accessObject && node.accessObjectLiteral) {
      try {
        node.accessObject = eval(node.accessObjectLiteral);
      } catch(e) {
        console.warn("Failed to eval accessObjectLiteral:", node.accessObjectLiteral, e);
        node.accessObject = [];
      }
    }

    // Ensure fields exist
    if(!node.fields) node.fields = [];
    if(!node.fields.find(f => f.key === "selectedObject")) {
      node.fields.push({key: "selectedObject", value: ""});
    }

    // Ensure pins exist
    if(!node.inputs || node.inputs.length === 0) {
      node.inputs = [{name: "exec", type: "action"}];
    }
    if(!node.outputs || node.outputs.length === 0) {
      node.outputs = [{name: "execOut", type: "action"}];
    }

    // Rebuild DOM select for this node
    let select = dom.querySelector("select");

    if(select == null) {
      select = document.createElement("select");
      select.id = node.id;
      select.className = "method-select";
      select.style.cssText = "width:100%; margin-top:6px;";
      dom.appendChild(select);
    }

    if(select && node.accessObject) {
      const numOptions = select.options.length;
      const newLength = Object.keys(node.accessObject)
        .filter(key => typeof node.accessObject[key] === "function")

      // Only repopulate if length differs // +1 for placeholder
      if(numOptions !== newLength.length + 1) {
        select.innerHTML = "";
        const placeholder = document.createElement("option");
        placeholder.value = "";
        placeholder.textContent = "-- Select Function --";
        select.appendChild(placeholder);

        Object.keys(node.accessObject)
          .filter(key => typeof node.accessObject[key] === "function")
          .forEach(fnName => {
            const opt = document.createElement("option");
            opt.value = fnName;
            opt.textContent = fnName;
            select.appendChild(opt);
          });


        // restore previously selected
        const selected = node.fields.find(f => f.key === "selectedObject")?.value;
        if(selected) select.value = selected;
      }

      // Attach onchange
      select.onchange = e => {
        const val = e.target.value;
        node.fields.find(f => f.key === "selectedObject").value = val;
      };
    }
  }

  // NODE/PIN
  startConnect(nodeId, pinName, type, isOut) {
    this.state.connecting = {
      node: nodeId,
      pin: pinName,
      type: type,
      out: isOut,
    };
  }

  _applyConnectionRuntime(from, to, type) {
    const toNode = this.nodes[to.node];
    const fromNode = this.nodes[from.node];
    if(!toNode || !fromNode) return;

    // RefFunction special case
    if(toNode.title === "reffunctions" && to.pin === "reference") {
      const fnRef = this.getPinValue(fromNode, from.pin);
      if(typeof fnRef === "function") {
        toNode._fnRef = fnRef;
        this.adaptRefFunctionNode(toNode, fnRef);
      }
    }
    // generic hook
    this.onPinsConnected(fromNode, from.pin, toNode, to.pin);
  }

  restoreConnectionsRuntime() {
    for(const link of this.links) {
      this._applyConnectionRuntime(link.from, link.to, link.type);
    }
  }

  finishConnect(nodeId, pinName, type) {
    if(!this.state.connecting || this.state.connecting.node === nodeId) {
      this.state.connecting = null;
      return;
    }
    const from = this.state.connecting.out
      ? this.state.connecting
      : {node: nodeId, pin: pinName};
    const to = this.state.connecting.out
      ? {node: nodeId, pin: pinName}
      : this.state.connecting;
    // Prevent duplicate links and type mismatch
    if(from.pin && to.pin && this.isTypeCompatible(this.state.connecting.type, type)) {
      const exists = this.links.find(l =>
        l.from.node === from.node &&
        l.from.pin === from.pin &&
        l.to.node === to.node &&
        l.to.pin === to.pin
      );
      if(!exists) {
        this.links.push({id: "link_" + this.linkCounter++, from, to, type});
        this.updateLinks();
        if(type === "value") setTimeout(() => this.updateValueDisplays(), 0);
      }
    }
    this.state.connecting = null;

    let toNode = this.nodes[to.node];
    let fromNode = this.nodes[from.node];

    if(toNode && toNode.title === "reffunctions" && to.pin === "reference") {
      console.log('sss ')
      const fnRef = this.getPinValue(fromNode, from.pin);
      if(typeof fnRef !== "function") return;
      toNode._fnRef = fnRef;
      this.adaptRefFunctionNode(toNode, fnRef);
    }
    // Get Sub Object – adapt pins on connect
    toNode = this.nodes[to.node];
    fromNode = this.nodes[from.node];
    this.onPinsConnected(fromNode, from.pin, toNode, to.pin);
  }

  _adaptGetSubObjectOnConnect(getSubNode, sourceNode) {
    // alert('adapt')
    const obj = sourceNode._returnCache;
    if(!obj || typeof obj !== "object") return;
    const varField = sourceNode.fields?.find(f => f.key === "var");
    const previewField = getSubNode.fields?.find(f => f.key === "objectPreview");
    if(previewField) {
      previewField.value = varField?.value || "[object]";
      if(getSubNode.objectPreviewEl)
        getSubNode.objectPreviewEl.value = previewField.value;
    }
    const path = getSubNode.fields?.find(f => f.key === "path")?.value;
    const target = this.resolvePath(obj, path);
    this.adaptSubObjectPins(getSubNode, target);
    getSubNode._subCache = {};
    if(target && typeof target === "object") {
      for(const k in target) getSubNode._subCache[k] = target[k];
    }
    getSubNode._needsRebuild = false;
    getSubNode._pinsBuilt = true;
    // console.log("[ADAPT SUB OBJECT]", getSubNode.id, "path:", path, "target:", target);
    this.updateNodeDOM(getSubNode.id);
  }

  onPinsConnected(sourceNode, sourcePin, targetNode) {
    if(targetNode.title === "Get Scene Object" || targetNode.title === "Get Sub Object" ||
      targetNode.title === "Get Scene Light"
    ) {
      this._adaptGetSubObjectOnConnect(targetNode, sourceNode, sourcePin);
    }
  }

  // get func for ref pin
  getPinValue(node, pinName) {
    const out = node.outputs?.find(p => p.name === pinName);
    let getName = node.fields.find(item => item.key == "selectedObject").value;
    // little hard code - fix in future
    // By current light rule of given names.
    if(node.title == "Get Scene Object") {
      return app.getSceneObjectByName(getName)[out.name];
    } else if(node.title == "Get Scene Animation") {
      return app.getSceneObjectByName(getName)[out.name];
    } else {
      // light for now
      getName = parseInt(getName.replace("light", ""));
      return node.accessObject[getName][pinName];
    }
  }

  normalizePinType(type) {
    if(!type) return "any";
    if(type === "number") return "value";
    return type;
  }

  updateSceneObjectPins(node, objectName) {
    const obj = (node.accessObject || []).find(o => o.name === objectName);
    if(!obj) return;
    // clear
    node.outputs = [];
    node.exposeProps.forEach(p => {
      const value = this.getByPath(obj, p);
      if(value !== undefined) {
        const type = typeof value === "number" ? "number"
          : typeof value === "string" ? "string" : "object";
        node.outputs.push({name: p, type});
      }
    });
    this.updateNodeDOM(node.id);
  }

  _pinElement(pinSpec, isOutput, nodeId) {
    const pin = document.createElement("div");
    if(pinSpec.name == "position") {
      pin.className = `pin pin-${pinSpec.name}`;
    } else {
      pin.className = `pin pin-${pinSpec.type}`;
    }
    pin.dataset.pin = pinSpec.name;
    pin.dataset.type = pinSpec.type;
    pin.dataset.io = isOutput ? "out" : "in";
    pin.dataset.node = nodeId;
    // Dot (connect point)
    const dot = document.createElement("div");
    dot.className = "dot";
    pin.appendChild(dot);
    // Pin Label
    const label = document.createElement("span");
    label.className = "pin-label";
    label.textContent = pinSpec.name;
    pin.appendChild(label);
    // Connect events
    pin.addEventListener("mousedown", () =>
      this.startConnect(nodeId, pinSpec.name, pinSpec.type, isOutput)
    );

    pin.addEventListener("mouseup", () =>
      this.finishConnect(nodeId, pinSpec.name, pinSpec.type, isOutput)
    );

    return pin;
  }

  createNodeDOM(spec) {
    const el = document.createElement("div");

    if(spec.title == "Fetch") {
      el.className = "node " + (spec.title.toLowerCase() || "");
    } else if(spec.title == "Play MP3") {
      el.className = "node " + "audios";
    } else if(spec.title == "Curve") {
      el.className = "node " + "curve";
    } else {
      el.className = "node " + (spec.category || "");
    }

    el.style.left = spec.x + "px";
    el.style.top = spec.y + "px";
    el.dataset.id = spec.id;

    // --- Header ---
    const header = document.createElement("div");
    header.className = "header";
    header.textContent = spec.title;
    el.appendChild(header);

    // --- Body ---
    const body = document.createElement("div");
    body.className = "body";

    // --- Pin row ---
    const row = document.createElement("div");
    if(spec.title == "Comment") {
      row.classList.add('pin-row');
      row.classList.add('comment');
    } else {
      row.className = "pin-row";
    }

    const left = document.createElement("div");
    left.className = "pins-left";

    const right = document.createElement("div");
    right.className = "pins-right";

    // Normalize pins before building DOM
    (spec.inputs || []).forEach(pin => {
      pin.type = this.normalizePinType(pin.type);
      left.appendChild(this._pinElement(pin, false, spec.id));
    });

    (spec.outputs || []).forEach(pin => {
      pin.type = this.normalizePinType(pin.type);
      right.appendChild(this._pinElement(pin, true, spec.id));
    });

    row.appendChild(left);
    row.appendChild(right);
    body.appendChild(row);

    if(spec.title == "Curve") {

      const c = new CurveData(spec.id);
      let curve = this.curveEditor.curveStore.getOrCreate(c);
      spec.curve = curve;

      console.log(`%c Create DOM corotine Node [CURVE] ${spec.curve}`, LOG_FUNNY_ARCADE);

      this.curveEditor.bindCurve(spec.curve, {
        name: spec.id,
        idNode: spec.id
      });
    }

    if(spec.comment) {
      const textarea = document.createElement("textarea");
      // textarea.style
      textarea.style.webkitBoxShadow = "inset 0px 0px 1px 4px #9E9E9E";
      textarea.style.boxShadow =
        "inset 0px 0px 22px 1px rgba(118, 118, 118, 1)";
      textarea.style.backgroundColor = "gray";
      textarea.style.color = "black";

      textarea.value = spec.fields.find(f => f.key === "text").value;

      textarea.oninput = () => {
        spec.fields.find(f => f.key === "text").value = textarea.value;
        row.textContent = textarea.value || "Comment";
      };

      body.appendChild(textarea);
    }
    // 🔴 FIELD INPUTS
    if(spec.fields?.length && !spec.comment && spec.title != "GenRandInt") {
      const fieldsWrap = document.createElement("div");
      fieldsWrap.className = "node-fields";
      spec.fields.forEach(field => {
        // skip special cases handled elsewhere
        if(field.key === "var") return;
        const input = this.createFieldInput(spec, field);
        if(field.key === "objectPreview") {
          spec.objectPreviewEl = input;
        }
        fieldsWrap.appendChild(input);
      });
      body.appendChild(fieldsWrap);
    }

    // Value display
    if(spec.fields && spec.title === "GenRandInt") {
      const container = document.createElement("div");
      container.className = "genrand-inputs";

      spec.fields.forEach(f => {
        const input = document.createElement("input");
        input.type = "number";
        input.value = f.value;
        input.style.width = "40px";
        input.style.marginRight = "4px";
        input.addEventListener("input", e => (f.value = e.target.value));
        container.appendChild(input);

        const label = document.createElement("span");
        label.textContent = f.key;
        label.className = "field-label";
        container.appendChild(label);
      });

      body.appendChild(container);
    } else if(spec.category === "math" || spec.category === "value" || spec.title === "Print") {
      const display = document.createElement("div");
      display.className = "value-display";
      display.textContent = "?";
      spec.displayEl = display;
      body.appendChild(display);
    }

    // Function Method Selector
    if(spec.title === "Function" && spec.category === "action" && !spec.builtIn && !spec.isVariableNode) {
      const select = document.createElement("select");
      select.id = spec.id;
      select.className = "method-select";
      select.style.cssText = "width:100%; margin-top:6px;";

      body.appendChild(select);

      this.populateMethodsSelect(select);
      if(spec.attachedMethod) {
        select.value = spec.attachedMethod;
      }

      select.addEventListener("change", e => {
        const selected = this.methodsManager.methodsContainer.find(
          m => m.name === e.target.value
        );
        if(selected) {
          console.log('test reference', selected)
          this.adaptNodeToMethod(spec, selected);
        }
      });
    }
    // Variable name input (temporary until popup)
    if(spec.fields?.some(f => f.key === "var") && !spec.comment) {

      const input = document.createElement("input");
      input.type = "text";
      input.value = spec.fields.find(f => f.key === "var")?.value ?? "";
      input.readOnly = true;

      input.style.width = "100%";
      input.style.marginTop = "6px";
      input.style.opacity = "0.7";
      input.style.cursor = "default";

      body.appendChild(input);
    }

    if(spec.title === "functions") {
      const select = document.createElement("select");
      select.style.width = "100%";
      select.style.marginTop = "6px";

      if(spec.accessObject === undefined) {
        spec.accessObject = eval(spec.accessObjectLiteral);
      }
      this.populateDynamicFunctionSelect(select, spec);

      select.addEventListener("change", e => {
        const fnName = e.target.value;
        if(fnName) {
          this.adaptDynamicFunction(spec, fnName);
        }
      });

      body.appendChild(select);
    }

    if(spec.title === "Get Scene Object" || spec.title === "Get Scene Animation" || spec.title === "Get Scene Light") {
      const select = document.createElement("select");
      select.id = spec._id ? spec._id : spec.id;
      select.style.width = "100%";
      select.style.marginTop = "6px";

      // Populate scene objects
      if(spec.accessObject === undefined) spec.accessObject = eval(spec.accessObjectLiteral);
      const objects = spec.accessObject || []; // window.app?.mainRenderBundle || [];

      const placeholder = document.createElement("option");
      placeholder.textContent = "-- Select Object --";
      placeholder.value = "";
      select.appendChild(placeholder);
      // console.log('WORKS objects', spec.accessObject.length);
      spec.accessObject.forEach(obj => {
        const opt = document.createElement("option");
        opt.value = obj.name;
        opt.textContent = obj.name;
        select.appendChild(opt);
      });

      if(spec.fields[0].value) select.value = spec.fields[0].value;

      select.addEventListener("change", e => {
        const name = e.target.value;
        spec.fields[0].value = name;
        this.updateSceneObjectPins(spec, name);
      });
      el.appendChild(select);
    }

    el.appendChild(body);
    // --- Dragging ---
    header.addEventListener("mousedown", e => {
      e.preventDefault();
      this.state.draggingNode = el;
      const rect = el.getBoundingClientRect();
      const bx = this.board.getBoundingClientRect();
      this.state.dragOffset = [
        e.clientX - rect.left + bx.left,
        e.clientY - rect.top + bx.top,
      ];
      document.body.style.cursor = "grabbing";
    });
    // --- Selecting ---
    el.addEventListener("click", e => {
      e.stopPropagation();
      this.selectNode(spec.id);

      this.updateNodeDOM(spec.id)
    });

    el.addEventListener("dblclick", e => {
      e.stopPropagation();
      console.log('DBL ' + spec.id);
      this.onNodeDoubleClick(spec);

    });

    return el;
  }

  selectNode(id) {
    if(this.state.selectedNode) {
      document
        .querySelector(`.node[data-id="${this.state.selectedNode}"]`)
        ?.classList.remove("selected");
    }
    this.state.selectedNode = id;
    document.querySelector(`.node[data-id="${id}"]`)?.classList.add("selected");
  }

  populateDynamicFunctionSelect(select, spec) {
    select.innerHTML = "";

    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "-- Select Function --";
    select.appendChild(placeholder);

    if(!spec.accessObject || typeof spec.accessObject !== "object") return;

    for(const key in spec.accessObject) {
      if(typeof spec.accessObject[key] === "function") {
        const opt = document.createElement("option");
        opt.value = key;
        opt.textContent = key;
        select.appendChild(opt);
      }
    }
    // console.log(spec.fields.find(item => item.key == "selectedObject").value)
    let current = spec.fields.find(item => item.key == "selectedObject").value;
    for(const opt of select.options) {
      if(opt.text === current) {
        opt.selected = true;
        break;
      }
    }
  }

  isTypeCompatible(fromType, toType) {
    if(fromType === "action" || toType === "action") {
      return fromType === toType;
    }
    if(fromType === toType) return true;
    if(fromType === "any" || toType === "any") return true;
    return false;
  }

  addNode(type, options = {}) {
    const id = "node_" + this.nodeCounter++;
    const x = Math.abs(this.state.pan[0]) + 100 + Math.random() * 200;
    const y = Math.abs(this.state.pan[1]) + 100 + Math.random() * 200;

    // Node factory map
    const nodeFactories = {
      event: (id, x, y) => ({
        id, title: "onLoad", x, y,
        category: "event",
        inputs: [],
        outputs: [{name: "exec", type: "action"}],
      }),

      audioMP3: (id, x, y, options) => ({
        id, x, y, title: "Play MP3",
        category: "action",
        inputs: [
          {name: "exec", type: "action"},
          {name: "key", type: "string", default: "audio"},
          {name: "src", type: "string", default: ""},
          {name: "clones", type: "number", default: 1}
        ],
        outputs: [
          {name: "execOut", type: "action"}
        ],
        fields: [
          {key: "created", value: false},
          {key: "key", value: options?.name},
          {key: "src", value: options?.path},
        ],
        noselfExec: "true"
      }),

      generator: (id, x, y) => ({
        id, x, y, title: "Generator",
        category: "action",
        inputs: [
          {name: "exec", type: "action"},
          {name: "material", type: "string"},
          {name: "pos", type: "object"},
          {name: "rot", type: "object"},
          {name: "texturePath", type: "string"},
          {name: "name", type: "string"},
          {name: "geometry", type: "string"},
          {name: "raycast", type: "boolean"},
          {name: "scale", type: "object"},
          {name: "sum", type: "number"},
          {name: "delay", type: "number"},
        ],
        outputs: [
          {name: "execOut", type: "action"}
        ],
        fields: [
          {key: "material", value: "standard"},
          {key: "pos", value: '{x:0, y:0, z:-20}'},
          {key: "rot", value: '{x:0, y:0, z:0}'},
          {key: "texturePath", value: "res/textures/star1.png"},
          {key: "name", value: "TEST"},
          {key: "geometry", value: "Cube"},
          {key: "raycast", value: true},
          {key: "scale", value: [1, 1, 1]},
          {key: "sum", value: 10},
          {key: "delay", value: 500},
          {key: "created", value: false},
        ],
        noselfExec: "true"
      }),

      generatorWall: (id, x, y) => ({
        id, x, y, title: "Generator Wall",
        category: "action",
        inputs: [
          {name: "exec", type: "action"},
          {name: "material", type: "string"},
          {name: "pos", type: "object"},
          {name: "rot", type: "object"},
          {name: "texturePath", type: "string"},
          {name: "name", type: "string"},
          {name: "size", type: "string"},
          {name: "raycast", type: "boolean"},
          {name: "scale", type: "object"},
          {name: "spacing", type: "number"},
          {name: "delay", type: "number"}
        ],
        outputs: [
          {name: "execOut", type: "action"}
        ],
        fields: [
          {key: "material", value: "standard"},
          {key: "pos", value: '{x:0, y:0, z:-20}'},
          {key: "rot", value: '{x:0, y:0, z:0}'},
          {key: "texturePath", value: "res/textures/star1.png"},
          {key: "name", value: "TEST"},
          {key: "size", value: "10x3"},
          {key: "raycast", value: true},
          {key: "scale", value: [1, 1, 1]},
          {key: "spacing", value: 10},
          {key: "delay", value: 500},
          {key: "created", value: false},
        ],
        noselfExec: "true"
      }),

      generatorPyramid: (id, x, y) => ({
        id, x, y, title: "Generator Pyramid",
        category: "action",
        inputs: [
          {name: "exec", type: "action"},
          {name: "material", type: "string"},
          {name: "pos", type: "object"},
          {name: "rot", type: "object"},
          {name: "texturePath", type: "string"},
          {name: "name", type: "string"},
          {name: "levels", type: "number"},
          {name: "raycast", type: "boolean"},
          {name: "scale", type: "object"},
          {name: "spacing", type: "number"},
          {name: "delay", type: "number"}
        ],
        outputs: [
          {name: "execOut", type: "action"}
        ],
        fields: [
          {key: "material", value: "standard"},
          {key: "pos", value: '{x:0, y:0, z:-20}'},
          {key: "rot", value: '{x:0, y:0, z:0}'},
          {key: "texturePath", value: "res/textures/star1.png"},
          {key: "name", value: "TEST"},
          {key: "levels", value: "5"},
          {key: "raycast", value: true},
          {key: "scale", value: [1, 1, 1]},
          {key: "spacing", value: 10},
          {key: "delay", value: 500},
          {key: "created", value: false},
        ],
        noselfExec: "true"
      }),

      setForceOnHit: (id, x, y) => ({
        id, x, y, title: "Set Force On Hit",
        category: "action",
        inputs: [
          {name: "exec", type: "action"},
          {name: "objectName", type: "string"},
          {name: "rayDirection", type: "object"},
          {name: "strength", type: "number"},

        ],
        outputs: [
          {name: "execOut", type: "action"}
        ],
        fields: [],
        noselfExec: "true"
      }),

      setVideoTexture: (id, x, y) => ({
        id, x, y, title: "Set Video Texture",
        category: "action",
        inputs: [
          {name: "exec", type: "action"},
          {name: "objectName", type: "string"},
          {name: "VideoTextureArg", type: "object"},
        ],
        outputs: [
          {name: "execOut", type: "action"}
        ],
        fields: [
          {key: "objectName", value: "standard"},
          {key: "VideoTextureArg", value: "{type: 'video', src: 'res/videos/tunel.mp4'}"}
        ],
        noselfExec: "true"
      }),

      setCanvasInlineTexture: (id, x, y) => ({
        id, x, y, title: "Set CanvasInline",
        category: "action",
        inputs: [
          {name: "exec", type: "action"},
          {name: "objectName", type: "string"},
          {name: "canvaInlineProgram", type: "function"},
          {name: "specialCanvas2dArg", type: "object"},
        ],
        outputs: [
          {name: "execOut", type: "action"}
        ],
        fields: [
          {key: "objectName", value: "standard"},
          {key: "canvaInlineProgram", value: "function (ctx, canvas) {}"},
          {key: "specialCanvas2dArg", value: "{ hue: 200, glow: 10, text: 'Hello programmer', fontSize: 60, flicker: 0.05, }"},
        ],
        noselfExec: "true"
      }),

      audioReactiveNode: (id, x, y) => ({
        id, x, y, title: "Audio Reactive Node",
        category: "action",
        inputs: [
          {name: "exec", type: "action"},
          {name: "audioSrc", type: "string"},
          {name: "loop", type: "boolean"},
          {name: "thresholdBeat", type: "number"},

        ],
        outputs: [
          {name: "execOut", type: "action"},
          {name: "low", type: "number"},
          {name: "mid", type: "number"},
          {name: "high", type: "number"},
          {name: "energy", type: "number"},
          {name: "beat", type: "boolean"}
        ],
        fields: [
          {key: "audioSrc", value: "audionautix-black-fly.mp3"},
          {key: "loop", value: true},
          {key: "thresholdBeat", value: 0.7},
          {key: "created", value: false},
        ],
        noselfExec: "true"
      }),

      curveTimeline: (id, x, y) => ({
        id, x, y, title: "Curve",
        category: "action",
        inputs: [
          {name: "exec", type: "action"},
          {name: "name", type: "string"},
          {name: "delta", type: "number"},
        ],
        outputs: [
          {name: "execOut", type: "action"},
          {name: "value", type: "number"}
        ],
        fields: [
          {key: "name", value: "Curve1"}
        ],
        curve: {},
        noselfExec: "true"
      }),

      eventCustom: (id, x, y) => ({
        id, x, y,
        title: "Custom Event",
        category: "event",
        fields: [
          {key: "name", value: "myEvent"}
        ],
        inputs: [],
        outputs: [
          {name: "exec", type: "action"},
          {name: "detail", type: "object"}
        ],
        _listenerAttached: false,
        _returnCache: null,
        noselfExec: 'true'
      }),

      dispatchEvent: (id, x, y) => ({
        id, x, y,
        title: "Dispatch Event",
        category: "event",
        inputs: [
          {name: "exec", type: "action"},
          {name: "eventName", type: "string", default: "myEvent"},
          {name: "detail", type: "object", default: {}}
        ],
        outputs: [
          {name: "execOut", type: "action"}
        ],
        noselfExec: 'true'
      }),

      rayHitEvent: (id, x, y) => ({
        id, x, y,
        title: "On Ray Hit",
        category: "event",
        inputs: [],
        outputs: [
          {name: "exec", type: "action"},
          {name: "hitObjectName", type: "string"},
          {name: "screenCoords", type: "object"},
          {name: "rayOrigin", type: "object"},
          {name: "rayDirection", type: "object"},
          {name: "hitObject", type: "object"},
          {name: "hitNormal", type: "object"},
          {name: "hitDistance", type: "object"},
          {name: "eventName", type: "object"},
          {name: "button", type: "number"},
          {name: "timestamp", type: "number"}
        ],
        noselfExec: 'true',
        _listenerAttached: false,
      }),

      onDraw: (id, x, y) => ({
        id, x, y,
        title: "On Draw",
        category: "event",
        inputs: [],
        outputs: [
          {name: "exec", type: "action"},
          {name: "delta", type: "number"},
          {name: "skip", type: "number"}
        ],
        fields: [
          {key: "skip", value: 5}
        ],
        noselfExec: 'true',
        _listenerAttached: false,
      }),

      function: (id, x, y) => ({
        id, title: "Function", x, y,
        category: "action",
        inputs: [{name: "exec", type: "action"}],
        outputs: [{name: "execOut", type: "action"}],
      }),

      if: (id, x, y) => ({
        id, title: "if", x, y,
        category: "logic",
        inputs: [
          {name: "exec", type: "action"},
          {name: "condition", type: "boolean"},
        ],
        outputs: [
          {name: "true", type: "action"},
          {name: "false", type: "action"},
        ],
        fields: [
          {key: "condition", value: true},
        ],
        noselfExec: "true"
      }),

      genrand: (id, x, y) => ({
        id, title: "GenRandInt", x, y,
        category: "value",
        inputs: [],
        outputs: [{name: "result", type: "value"}],
        fields: [
          {key: "min", value: "0"},
          {key: "max", value: "10"},
        ],
      }),

      print: (id, x, y) => ({
        id, title: "Print", x, y,
        category: "actionprint",
        inputs: [
          {name: "exec", type: "action"},
          {name: "value", type: "any"},
        ],
        outputs: [{name: "execOut", type: "action"}],
        fields: [{key: "label", value: "Result"}],
        builtIn: true,
        noselfExec: 'true'
      }),

      timeout: (id, x, y) => ({
        id, title: "SetTimeout", x, y,
        category: "timer",
        inputs: [
          {name: "exec", type: "action"},
          {name: "delay", type: "value"},
        ],
        outputs: [{name: "execOut", type: "action"}],
        fields: [{key: "delay", value: "1000"}],
        builtIn: true,
      }),

      // string operation
      startsWith: (id, x, y) => ({
        id, title: "Starts With [string]", x, y,
        category: "stringOperation",
        inputs: [
          {name: "input", type: "string"},
          {name: "prefix", type: "string"}
        ],
        outputs: [{name: "return", type: "boolean"}],
      }),

      endsWith: (id, x, y) => ({
        id, title: "Ends With [string]", x, y,
        category: "stringOperation",
        inputs: [
          {name: "input", type: "string"},
          {name: "suffix", type: "string"}
        ],
        outputs: [{name: "return", type: "boolean"}]
      }),

      includes: (id, x, y) => ({
        id, title: "Includes [string]", x, y,
        category: "stringOperation",
        inputs: [
          {name: "input", type: "string"},
          {name: "search", type: "string"}
        ],
        outputs: [{name: "return", type: "boolean"}]
      }),
      toUpperCase: (id, x, y) => ({
        id, title: "To Upper Case [string]", x, y,
        category: "stringOperation",
        inputs: [{name: "input", type: "string"}],
        outputs: [{name: "return", type: "string"}]
      }),
      toLowerCase: (id, x, y) => ({
        id, title: "To Lower Case [string]", x, y,
        category: "stringOperation",
        inputs: [{name: "input", type: "string"}],
        outputs: [{name: "return", type: "string"}]
      }),
      trim: (id, x, y) => ({
        id, title: "Trim [string]", x, y,
        category: "stringOperation",
        inputs: [{name: "input", type: "string"}],
        outputs: [{name: "return", type: "string"}]
      }),
      length: (id, x, y) => ({
        id, title: "String Length", x, y,
        category: "stringOperation",
        inputs: [{name: "input", type: "string"}],
        outputs: [{name: "return", type: "number"}]
      }),
      substring: (id, x, y) => ({
        id, title: "Substring [string]", x, y,
        category: "stringOperation",
        inputs: [
          {name: "input", type: "string"},
          {name: "start", type: "number"},
          {name: "end", type: "number"}
        ],
        outputs: [{name: "return", type: "string"}]
      }),
      replace: (id, x, y) => ({
        id, title: "Replace [string]", x, y,
        category: "stringOperation",
        inputs: [
          {name: "input", type: "string"},
          {name: "search", type: "string"},
          {name: "replace", type: "string"}
        ],
        outputs: [{name: "return", type: "string"}]
      }),
      split: (id, x, y) => ({
        id, title: "Split [string]", x, y,
        category: "stringOperation",
        inputs: [
          {name: "input", type: "string"},
          {name: "separator", type: "string"}
        ],
        outputs: [{name: "return", type: "array"}]
      }),

      concat: (id, x, y) => ({
        id, title: "Concat [string]", x, y,
        category: "stringOperation",
        inputs: [
          {name: "a", type: "string"},
          {name: "b", type: "string"}
        ],
        outputs: [{name: "return", type: "string"}]
      }),

      isEmpty: (id, x, y) => ({
        id, title: "Is Empty [string]", x, y,
        category: "stringOperation",
        inputs: [{name: "input", type: "string"}],
        outputs: [{name: "return", type: "boolean"}]
      }),

      // Math
      add: (id, x, y) => ({
        id, title: "Add", x, y,
        category: "math",
        inputs: [
          {name: "a", type: "value"},
          {name: "b", type: "value"},
        ],
        outputs: [{name: "result", type: "value"}],
      }),

      sub: (id, x, y) => ({
        id, title: "Sub", x, y,
        category: "math",
        inputs: [
          {name: "a", type: "value"},
          {name: "b", type: "value"},
        ],
        outputs: [{name: "result", type: "value"}],
      }),

      mul: (id, x, y) => ({
        id, title: "Mul", x, y,
        category: "math",
        inputs: [
          {name: "a", type: "value"},
          {name: "b", type: "value"},
        ],
        outputs: [{name: "result", type: "value"}],
      }),

      div: (id, x, y) => ({
        id, title: "Div", x, y,
        category: "math",
        inputs: [
          {name: "a", type: "value"},
          {name: "b", type: "value"},
        ],
        outputs: [{name: "result", type: "value"}],
      }),

      sin: (id, x, y) => ({
        id, title: "Sin", x, y,
        category: "math",
        inputs: [{name: "a", type: "value"}],
        outputs: [{name: "result", type: "value"}],
      }),

      cos: (id, x, y) => ({
        id, title: "Cos", x, y,
        category: "math",
        inputs: [{name: "a", type: "value"}],
        outputs: [{name: "result", type: "value"}],
      }),

      pi: (id, x, y) => ({
        id,
        title: "Pi",
        x,
        y,
        category: "math",
        inputs: [],
        outputs: [{name: "result", type: "value"}],
      }),
      // comparation nodes
      greater: (id, x, y) => ({
        id,
        title: "A > B",
        x,
        y,
        category: "compare",
        inputs: [
          {name: "A", type: "number"},
          {name: "B", type: "number"},
        ],
        outputs: [{name: "result", type: "boolean"}],
      }),

      less: (id, x, y) => ({
        id,
        title: "A < B",
        x,
        y,
        category: "compare",
        inputs: [
          {name: "A", type: "number"},
          {name: "B", type: "number"},
        ],
        outputs: [{name: "result", type: "boolean"}],
      }),

      equal: (id, x, y) => ({
        id, title: "A == B", x, y,
        category: "compare",
        inputs: [
          {name: "A", type: "any"},
          {name: "B", type: "any"},
        ],
        outputs: [{name: "result", type: "boolean"}],
      }),

      notequal: (id, x, y) => ({
        id, title: "A != B", x, y,
        category: "compare",
        inputs: [
          {name: "A", type: "any"},
          {name: "B", type: "any"},
        ],
        outputs: [{name: "result", type: "boolean"}],
      }),

      greaterEqual: (id, x, y) => ({
        id, title: "A >= B", x, y,
        category: "compare",
        inputs: [
          {name: "A", type: "number"},
          {name: "B", type: "number"},
        ],
        outputs: [{name: "result", type: "boolean"}],
      }),

      lessEqual: (id, x, y) => ({
        id, title: "A <= B", x, y,
        category: "compare",
        inputs: [
          {name: "A", type: "number"},
          {name: "B", type: "number"},
        ],
        outputs: [{name: "result", type: "boolean"}],
      }),

      getNumber: (id, x, y) => ({
        id, title: "Get Number", x, y,
        category: "value",
        outputs: [{name: "result", type: "number"}],
        fields: [{key: "var", value: ""}],
        isGetterNode: true
      }),

      getBoolean: (id, x, y) => ({
        id, title: "Get Boolean", x, y,
        category: "value",
        outputs: [{name: "result", type: "boolean"}],
        fields: [{key: "var", value: ""}],
        isGetterNode: true
      }),

      getString: (id, x, y) => ({
        id, title: "Get String", x, y,
        category: "value",
        outputs: [{name: "result", type: "string"}],
        fields: [{key: "var", value: ""}],
        isGetterNode: true,
      }),

      getObject: (id, x, y) => ({
        id, title: "Get Object", x, y,
        category: "value",
        outputs: [{name: "result", type: "object"}],
        fields: [{key: "var", value: ""}],
        isGetterNode: true,
      }),

      setObject: (id, x, y) => ({
        id, title: "Set Object", x, y,
        category: "action",
        isVariableNode: true,
        inputs: [
          {name: "exec", type: "action"},
          {name: "value", type: "object"},
        ],
        outputs: [{name: "execOut", type: "action"}],
        fields: [
          {key: "var", value: ""},
          {key: "literal", value: {}},
        ],
      }),

      setNumber: (id, x, y) => ({
        id, title: "Set Number", x, y,
        category: "action",
        isVariableNode: true,
        inputs: [
          {name: "exec", type: "action"},
          {name: "value", type: "number"},
        ],
        outputs: [{name: "execOut", type: "action"}],
        fields: [
          {key: "var", value: ""},
          {key: "literal", value: 0},
        ],
      }),

      setBoolean: (id, x, y) => ({
        id, title: "Set Boolean", x, y,
        category: "action",
        isVariableNode: true,
        inputs: [
          {name: "exec", type: "action"},
          {name: "value", type: "boolean"},
        ],
        outputs: [{name: "execOut", type: "action"}],
        fields: [
          {key: "var", value: ""},
          {key: "literal", value: false},
        ],
      }),

      setString: (id, x, y) => ({
        id, title: "Set String", x, y,
        category: "action",
        isVariableNode: true,
        inputs: [
          {name: "exec", type: "action"},
          {name: "value", type: "string"},
        ],
        outputs: [{name: "execOut", type: "action"}],
        fields: [
          {key: "var", value: ""},
          {key: "literal", value: ""},
        ],
      }),


      getNumberLiteral: (id, x, y) => ({
        id, title: "getNumberLiteral", x, y,
        category: "action",
        inputs: [{name: "exec", type: "action"}],
        outputs: [{name: "execOut", type: "action"}, {name: "value", type: "number"}],
        fields: [{key: "value", value: 1}],
        noselfExec: "true"
      }),

      comment: (id, x, y) => ({
        id, title: "Comment", x, y,
        category: "meta",
        inputs: [],
        outputs: [],
        comment: true,
        noExec: true,
        fields: [{key: "text", value: "Add comment"}],
      }),

      dynamicFunction: (id, x, y, accessObject) => ({
        id, title: "functions", x, y,
        category: "action",
        inputs: [{name: "exec", type: "action"}],
        outputs: [{name: "execOut", type: "action"}],
        fields: [{key: "selectedObject", value: ""}],
        accessObject: (accessObject ? accessObject : window.app),
        accessObjectLiteral: "window.app",
      }),

      refFunction: (id, x, y) => ({
        id, title: "reffunctions", x, y,
        category: "action",
        inputs: [
          {name: "exec", type: "action"},
          {name: "reference", type: "any"}
        ],
        outputs: [{name: "execOut", type: "action"}],
      }),

      getSceneObject: (id, x, y) => ({
        noExec: true, id,
        title: "Get Scene Object", x, y,
        category: "scene",
        inputs: [],
        outputs: [],
        fields: [{key: "selectedObject", value: ""}],
        builtIn: true,
        accessObject: window.app?.mainRenderBundle,
        accessObjectLiteral: "window.app?.mainRenderBundle",
        exposeProps: ["name", "position", "rotation", "scale"],
      }),

      getSceneLight: (id, x, y) => ({
        noExec: true, id,
        title: "Get Scene Light", x, y,
        category: "scene",
        inputs: [],
        outputs: [],
        fields: [{key: "selectedObject", value: ""}],
        builtIn: true,
        accessObject: window.app?.lightContainer,
        accessObjectLiteral: "window.app?.lightContainer",
        exposeProps: ["ambientFactor", "setPosX", "setPosY", "setPosZ", "setIntensity",
          "setInnerCutoff", "setOuterCutoff", "setColor", "setColorR",
          "setColorB", "setColorG", "setRange", "setAmbientFactor", "setShadowBias"],
      }),

      getObjectAnimation: (id, x, y) => ({
        noExec: true, id, title: "Get Scene Animation", x, y,
        category: "scene",
        inputs: [],
        outputs: [],
        fields: [{key: "selectedObject", value: ""}],
        builtIn: true,
        accessObject: window.app?.mainRenderBundle,
        accessObjectLiteral: "window.app?.mainRenderBundle",
        exposeProps: [
          "name",
          "glb.glbJsonData.animations",
          "glb.animationIndex",
          "playAnimationByName",
          "playAnimationByIndex"
        ],
      }),

      getPosition: (id, x, y) => ({
        id, x, y,
        title: "Get Position",
        category: "scene",
        inputs: [{name: "position", semantic: "position"}],
        outputs: [
          {name: "x", semantic: "number"},
          {name: "y", semantic: "number"},
          {name: "z", semantic: "number"},
        ],
        noExec: true,
      }),

      setPosition: (id, x, y) => ({
        id, x, y,
        title: "Set Position",
        category: "scene",
        inputs: [
          {name: "exec", type: "action"},
          {name: "position", semantic: "position"},
          {name: "x", semantic: "number"},
          {name: "y", semantic: "number"},
          {name: "z", semantic: "number"},
        ],
        outputs: [{name: "execOut", type: "action"}],
      }),

      setSpeed: (id, x, y) => ({
        id, x, y,
        title: "Set Speed",
        category: "scene",
        inputs: [
          {name: "exec", type: "action"},
          {name: "position", semantic: "position"},
          {name: "thrust", semantic: "number"},
        ],
        outputs: [{name: "execOut", type: "action"}],
      }),

      setTexture: (id, x, y) => ({
        id, x, y,
        title: "Set Texture",
        category: "scene",
        inputs: [
          {name: "exec", type: "action"},
          {name: "texturePath", semantic: "texturePath"},
          {name: "sceneObjectName", semantic: "string"},
        ],
        outputs: [{name: "execOut", type: "action"}],
      }),

      getSpeed: (id, x, y) => ({
        id, x, y,
        title: "Get Speed",
        category: "scene",
        inputs: [
          {name: "exec", type: "action"},
          {name: "position", semantic: "position"}
        ],
        outputs: [
          {name: "execOut", type: "action"},
          {name: "thrust", semantic: "number"},
        ],
      }),

      setRotate: (id, x, y) => ({
        id, x, y,
        title: "Set Rotate",
        category: "scene",
        inputs: [
          {name: "exec", type: "action"},
          {name: "rotation", semantic: "rotation"},
          {name: "x", semantic: "number"},
          {name: "y", semantic: "number"},
          {name: "z", semantic: "number"},
        ],
        outputs: [{name: "execOut", type: "action"}],
      }),

      setRotateX: (id, x, y) => ({
        id, x, y,
        title: "Set RotateX",
        category: "scene",
        inputs: [
          {name: "exec", type: "action"},
          {name: "rotation", semantic: "rotation"},
          {name: "x", semantic: "number"}
        ],
        outputs: [{name: "execOut", type: "action"}],
      }),

      setRotateY: (id, x, y) => ({
        id, x, y,
        title: "Set RotateY",
        category: "scene",
        inputs: [
          {name: "exec", type: "action"},
          {name: "rotation", semantic: "rotation"},
          {name: "y", semantic: "number"}
        ],
        outputs: [{name: "execOut", type: "action"}],
      }),

      setRotateZ: (id, x, y) => ({
        id, x, y,
        title: "Set RotateZ",
        category: "scene",
        inputs: [
          {name: "exec", type: "action"},
          {name: "rotation", semantic: "rotation"},
          {name: "z", semantic: "number"}
        ],
        outputs: [{name: "execOut", type: "action"}],
      }),

      setRotation: (id, x, y) => ({
        id, x, y,
        title: "Set Rotation",
        category: "scene",
        inputs: [
          {name: "exec", type: "action"},
          {name: "rotation", semantic: "rotation"},
          {name: "x", semantic: "number"},
          {name: "y", semantic: "number"},
          {name: "z", semantic: "number"},
        ],
        outputs: [{name: "execOut", type: "action"}],
      }),

      translateByX: (id, x, y) => ({
        id, x, y, title: "Translate By X",
        category: "scene",
        inputs: [
          {name: "exec", type: "action"},
          {name: "position", semantic: "position"},
          {name: "x", semantic: "number"},
        ],
        outputs: [{name: "execOut", type: "action"}],
        builtIn: true,
      }),

      translateByY: (id, x, y) => ({
        id, x, y, title: "Translate By Y",
        category: "scene",
        inputs: [
          {name: "exec", type: "action"},
          {name: "position", semantic: "position"},
          {name: "y", semantic: "number"},
        ],
        outputs: [{name: "execOut", type: "action"}],
      }),

      translateByZ: (id, x, y) => ({
        id, x, y, title: "Translate By Z",
        category: "scene",
        inputs: [
          {name: "exec", type: "action"},
          {name: "position", semantic: "position"},
          {name: "z", semantic: "number"},
        ],
        outputs: [{name: "execOut", type: "action"}],
      }),

      onTargetPositionReach: (id, x, y) => ({
        id, x, y,
        title: "On Target Position Reach",
        category: "event",
        noExec: true,
        inputs: [{name: "position", type: "object"}],
        outputs: [{name: "exec", type: "action"}],
        _listenerAttached: false,
      }),

      fetch: (id, x, y) => ({
        id, title: "Fetch", x, y,
        category: "action",
        inputs: [
          {name: "exec", type: "action"},
          {name: "url", type: "string"},
          {name: "method", type: "string", default: "GET"},
          {name: "body", type: "object"},
          {name: "headers", type: "object"},
        ],
        outputs: [
          {name: "execOut", type: "action"},
          {name: "error", type: "action"},
          {name: "response", type: "object"},
          {name: "status", type: "number"},
        ],
      }),

      getSubObject: (id, x, y) => ({
        id, title: "Get Sub Object", x, y,
        category: "value",
        inputs: [
          {name: "exec", type: "action"},
          {name: "object", type: "object"},
        ],
        outputs: [{name: "execOut", type: "action"}],
        fields: [
          {key: "objectPreview", value: "", readonly: true},
          {key: "path", value: "", placeholder: "SomeProperty"},
        ],
        isDynamicNode: true,
        _needsRebuild: true,
        _pinsBuilt: false,
      }),

      forEach: (id, x, y) => ({
        id,
        title: "For Each",
        type: "forEach",
        x,
        y,
        state: {item: null, index: 0},
        inputs: [
          {name: "exec", type: "action"},
          {name: "array", type: "any"},  // semantic array pin
        ],
        outputs: [
          {name: "loop", type: "action"},
          {name: "completed", type: "action"},
          {name: "item", type: "any"},
          {name: "index", type: "number"},
        ],
      }),

      getArray: (id, x, y, initialArray = []) => ({
        id, type: "getArray",
        title: "Get Array",
        x, y,
        fields: [
          {key: "array", value: initialArray.slice()},
        ],
        inputs: [
          {name: "exec", type: "action"},
          {name: "array", type: "any"},
        ],
        outputs: [
          {name: "execOut", type: "action"},
          {name: "array", type: "any"}
        ],
        _returnCache: initialArray.slice(),
      }),
    };

    // Generate node spec
    let spec = null;

    if(type === 'dynamicFunction') {
      // Exception for dynamic access
      let AO = prompt(`Add global access object !`);
      if(AO) {
        console.warn("Adding AO ", eval(AO));
        options.accessObject = eval(AO);
      } else {
        console.warn("Adding global access object failed...");
        options.accessObject = window.app;
        return;
      };
      if(nodeFactories[type]) spec = nodeFactories[type](id, x, y, options.accessObject);
      spec.accessObjectLiteral = AO;

    } else if(type === 'audioMP3' && options?.path && options?.name) {
      if(nodeFactories[type]) spec = nodeFactories[type](id, x, y, options);
    } else {
      if(nodeFactories[type]) spec = nodeFactories[type](id, x, y);
    }

    if(spec && spec.fields && options) {
      for(const f of spec.fields) {
        if(options[f.key] !== undefined) {
          f.value = options[f.key];
        }
      }
    }

    if(spec) {
      const dom = this.createNodeDOM(spec);
      this.board.appendChild(dom);
      this.nodes[id] = spec;
      return id;
    }

    return null;
  }

  setVariable(type, key, value) {
    if(!this.variables[type][key]) return;

    this.variables[type][key].value = value;
    this.notifyVariableChanged(type, key);
  }

  updateArrayNode(node, newValue) {
    if(!Array.isArray(newValue)) {
      console.warn("Value must be an array");
      return;
    }

    const field = node.fields.find(f => f.key === "array");
    if(field) {
      field.value = newValue;
      node._returnCache = newValue;
    }
  }

  initEventNodes() {
    for(const nodeId in this.nodes) {
      const n = this.nodes[nodeId];
      if(n.category === "event") {
        // console.log('ACTIVATRE NODE ', n.title)
        this.activateEventNode(nodeId);
      }
    }
  }

  adaptSubObjectPins(node, obj) {
    // 🚫 DO NOTHING if no valid object
    if(!obj || typeof obj !== "object") return;
    node.outputs = node.outputs.filter(p => p.type === "action");
    if(obj && typeof obj === "object") {
      for(const key of Object.keys(obj)) {
        node.outputs.push({
          name: key,
          type: this.detectType(obj[key]),
        });
      }
    }
  }

  detectType(val) {
    if(typeof val === "number") return "number";
    if(typeof val === "boolean") return "boolean";
    if(typeof val === "string") return "string";
    if(typeof val === "object") return "object";
    return "any";
  }

  createFieldInput(node, field) {
    const input = document.createElement("input");
    input.type = "text";
    input.value = field.value ?? "";
    input.placeholder = field.placeholder ?? "";
    input.disabled = field.readonly === true;

    if(field.readonly) {
      input.style.opacity = "0.7";
      input.style.cursor = "default";
    }

    const saveInputValue = () => {
      let val;
      if(field.type === "object") {
        try {
          val = JSON.parse(input.value);
        } catch {
          return;
        }
      } else {
        val = input.value;
      }

      field.value = val;

      // existing logic stays
      if(node.isGetterNode && field.key === "var") {
        this.notifyVariableChanged("object", val);
      }

      // ? not tested in last ver
      document.dispatchEvent(
        new CustomEvent("fluxcodex.field.change", {
          detail: {
            nodeId: node.id,
            nodeType: node.type,
            fieldKey: field.key,
            fieldType: field.type,
            value: field.value,
          },
        })
      );
    };

    input.onkeydown = e => {
      if(e.key === "Enter") {
        e.preventDefault();
        saveInputValue();
      }
    };

    input.onblur = () => saveInputValue();

    if(node.title === "Get Sub Object" && field.key === "path") {
      input.oninput = () => {
        const link = this.getConnectedSource(node.id, "object");
        if(!link?.node?.isGetterNode) {


          if(link.node.title == "Get Sub Object") {
            console.log('special sub sub test ', link.node.title)
            let target = this.resolvePath(link.node._returnCache, link.pin);
            node.outputs = node.outputs.filter(p => p.type === "action"); // clear old object pins
            if(target && typeof target === "object") {
              for(const k in target) {
                node.outputs.push({
                  name: k,
                  type: this.detectType(target[k]),
                });
              }
            }
          }
          if(link.node.title == "Get Scene Animation") {
            console.log('special test ', link.node.title)

            const varField = link.node.fields?.find(f => f.key === "selectedObject");
            console.log('special test ', varField)

            // pin: "glb.glbJsonData.animations"

            if(link.pin.indexOf('.') != -1) {
              let target = this.resolvePath(app.getSceneObjectByName(varField.value), link.pin);
              console.log('special test target ', target)
              link.node._subCache = target;

              node.outputs = node.outputs.filter(p => p.type === "action"); // clear old object pins
              if(target && typeof target === "object") {
                for(const k in target) {
                  node.outputs.push({
                    name: k,
                    type: this.detectType(target[k]),
                  });
                }
              }

              node._needsRebuild = false;
              node._pinsBuilt = true;
              this.updateNodeDOM(node.id);
            }
            console.log('special test :::: ', link.node.accessObject[varField.value])
            // this.getValue(link.node.id, "")
          }
          return;

        }

        const varField = link.node.fields?.find(f => f.key === "var");
        const varName = varField?.value;
        const rootObj = this.variables?.object?.[varName];

        const path = input.value;
        const target = this.resolvePath(rootObj, path);
        node._subCache = {};
        node._subCache = target;
        node.outputs = node.outputs.filter(p => p.type === "action"); // clear old object pins
        if(target && typeof target === "object") {
          for(const k in target) {
            node.outputs.push({
              name: k,
              type: this.detectType(target[k]),
            });
          }
        }

        node._needsRebuild = false;
        node._pinsBuilt = true;
        this.updateNodeDOM(node.id);
      };
    }

    return input;
  }

  resolvePath(obj, path) {
    if(!obj || !path) return obj;
    const parts = path.split(".").filter(p => p.length);
    let current = obj;
    for(const part of parts) {
      if(current && typeof current === "object" && part in current) {
        current = current[part];
      } else {
        return undefined;
      }
    }
    return current;
  }

  resolveAccessObject(accessObject, objectName) {
    if(!accessObject) return null;
    if(Array.isArray(accessObject)) {
      return accessObject.find(o => o.name === objectName) || null;
    }
    if(typeof accessObject === "object") {
      return accessObject[objectName] || null;
    }
    return null;
  }

  adaptNodeToAccessMethod(node, objectName, methodName) {
    const obj = this.accessObject.find(o => o.name === objectName);
    if(!obj) return;

    const method = obj[methodName];
    if(typeof method !== "function") return;

    const args = this.getArgNames(method);

    node.inputs = [{name: "exec", type: "action"}];
    node.outputs = [{name: "execOut", type: "action"}];

    args.forEach(arg => node.inputs.push({name: arg, type: "value"}));

    if(this.hasReturn(method)) {
      node.outputs.push({name: "return", type: "value"});
    }

    node._access = {objectName, methodName};
    this.updateNodeDOM(node.id);
  }

  activateEventNode(nodeId) {
    const n = this.nodes[nodeId];
    if(n.title === "On Target Position Reach") {
      const pos = this.getValue(nodeId, "position");
      if(!pos) return;
      pos.onTargetPositionReach = () => {
        this.enqueueOutputs(n, "exec");
      };
      n._listenerAttached = true;
    } else if(n.title == "On Ray Hit") {
      // console.log('ON RAY HIT INIT ONLE !!!!!!!!!!!!!!!!!')
      if(n._listenerAttached) return;
      app.reference.addRaycastsListener();
      const handler = (e) => {
        n._returnCache = e.detail;
        this.enqueueOutputs(n, "exec");
      };
      app.canvas.addEventListener("ray.hit.event", handler);
      n._eventHandler = handler;
      n._listenerAttached = true;
      return;
    } else if(n.title == "On Draw") {
      // console.log('ON DRAW INIT ONLE !!!!!', n.fields.find(f => f.key === "skip")?.value);
      if(n._listenerAttached) return;
      let skip = n.fields.find(f => f.key === "skip")?.value;
      if(typeof n._frameCounter === "undefined") {n._frameCounter = 0;}
      const graph = this;
      app.graphUpdate = function(delta) {
        n._frameCounter++;
        if(skip > 0 && n._frameCounter < skip) return;
        n._frameCounter = 0;
        // console.info('.....', delta)
        n._returnCache = delta;
        graph.enqueueOutputs(n, "exec");
      };
      n._listenerAttached = true;
      return;
    }
  }

  _executeAttachedMethod(n) {
    if(n.attachedMethod) {
      const method = this.methodsManager.methodsContainer.find(
        m => m.name === n.attachedMethod
      );
      if(method) {
        const fn = this.methodsManager.compileFunction(method.code);
        const args = this.getArgNames(fn).map(argName =>
          this.getValue(n.id, argName)
        );
        let result;
        try {
          result = fn(...args);
        } catch(err) {
          console.error("User method error:", err);
        }
        if(this.hasReturn(fn)) n._returnCache = result;
      }
    }
  }

  getValue(nodeId, pinName, visited = new Set()) {
    const node = this.nodes[nodeId];
    if(visited.has(nodeId + ":" + pinName)) {
      return undefined;
    }
    if(!node || visited.has(nodeId)) return undefined;
    visited.add(nodeId);

    if(node.title === "Function" && pinName === "reference") {
      if(typeof node.fn === 'undefined') {
        const selected = this.methodsManager.methodsContainer.find(m => m.name === node.attachedMethod);
        if(selected) {
          node.fn = this.methodsManager.compileFunction(selected.code);
        } else {
          console.warn('Node: Function PinName: reference [reference not found at methodsContainer]')
        }
      }
      return node.fn;
    }

    if(node.title === "On Draw") {
      if(pinName == "delta") return node._returnCache;
    }
    if(node.title === "Audio Reactive Node") {
      if(pinName === "low") {
        return node._returnCache[0]
      } else if(pinName === "mid") {
        return node._returnCache[1]
      } else if(pinName === "high") {
        return node._returnCache[2]
      } else if(pinName === "energy") {
        return node._returnCache[3]
      } else if(pinName === "beat") {
        return node._returnCache[4]
      }
    }

    if(node.title === "On Ray Hit") {
      if(pinName === "hitObjectName") {
        return node._returnCache['hitObject']['name'];
      } else {
        return node._returnCache[pinName];
      }
    }

    if(node.title === "if" && pinName === "condition") {
      let testLink = this.links.find(l => l.to.node === nodeId && l.to.pin === pinName);
      let t;
      try {
        t = this.getValue(testLink.from.node, testLink.from.pin);
      } catch(err) {
        console.log(`IF NODE ${node.id} have no conditional pin connected - default is false... fix this in FluxCodexVertex graph editor.`)
        return false;
      }
      if(typeof t !== 'undefined') {
        return t;
      }
      if(this._execContext !== nodeId) {
        console.warn("[IF] condition read outside exec ignored");
        return node.fields?.find(f => f.key === "condition")?.value;
      }
      // ?
    }

    if(node.title === "Custom Event" && pinName === "detail") {
      console.warn("[Custom Event]  getvalue");
      return node._returnCache;
    }
    if(node.title === "Dispatch Event" && (pinName === 'eventName' || pinName === 'detail')) {
      let testLink = this.links.find(l => l.to.node === nodeId && l.to.pin === pinName);
      return this.getValue(testLink.from.node, testLink.from.pin);
    }

    if(node.isGetterNode) {
      if(node._returnCache === undefined) {
        this.triggerNode(node.id);
      }
      let value = node._returnCache;
      // Optional: parse string to array
      if(typeof value === "string") {
        try {
          if(node.title == "Get String") {
            // value = JSON.parse(value);
          } else {
            value = JSON.parse(value);
          }
        } catch(e) {
          console.warn('[getValue][json parse err]:', e);
        }
      }
      return value;
    }


    const link = this.links.find(l => l.to.node === nodeId && l.to.pin === pinName);
    if(link) return this.getValue(link.from.node, link.from.pin, visited);

    const field = node.fields?.find(f => f.key === pinName);
    if(field) return field.value;


    const inputPin = node.inputs?.find(p => p.name === pinName);
    if(inputPin) return inputPin.default ?? 0;

    if(node.title === "Get Scene Object" || node.title === "Get Scene Animation" || node.title === "Get Scene Light") {
      const objName = this._getSceneSelectedName(node);
      if(!objName) return undefined;
      //repopulate
      const dom = this.board.querySelector(`[data-id="${nodeId}"]`);
      const selects = dom.querySelectorAll("select"); // returns NodeList
      let select = selects[0];
      // alert()
      // if((select.options.length-1) != node.accessObject.length) {
      select.innerHTML = ``;
      if(select) {
        node.accessObject.forEach(obj => {
          const opt = document.createElement("option");
          opt.value = obj.name;
          opt.textContent = obj.name;
          select.appendChild(opt);
        });
      }

      if(node.fields[0].value) select.value = node.fields[0].value;
      // console.log('>>>>>>>>>>>>>>>>>>>>>')

      const obj = (node.accessObject || []).find(o => o.name === objName);
      if(!obj) return undefined;
      const out = node.outputs.find(o => o.name === pinName);
      if(!out) return undefined;

      if(pinName.indexOf('.') != -1) {
        return this.resolvePath(obj, pinName);
      }

      return obj[pinName];
    } else if(node.title === "Get Position") {
      const pos = this.getValue(nodeId, "position");
      if(!pos) return undefined;
      node._returnCache = {
        x: pos.x,
        y: pos.y,
        z: pos.z,
      };
      return node._returnCache[pinName];
    } else if(node.title === "Get Sub Object") {

      let varField = node.outputs?.find(f => f.name === "0");
      let isName = node.outputs?.find(f => f.name === "name");
      // console.log('test1 :::', varField)
      if(varField) if(varField.type == 'object') {
        return node._subCache[parseInt(varField.name)]
      }
      // console.log('test2 :::', isName);
      return node._subCache;
    } else if(node.type === "forEach") {
      if(pinName === "item") return node.state?.item;
      if(pinName === "index") return node.state?.index;
    }

    // console.log("GETVALUE COMPARE!")
    if(["math", "value", "compare", "stringOperation"].includes(node.category)) {
      let result;
      switch(node.title) {
        case "Starts With [string]":
          console.log('test startsWith');
          result = this.getValue(nodeId, "input").startsWith(this.getValue(nodeId, "prefix"));
          break;
        case "Ends With [string]":
          result = this.getValue(nodeId, "input")
            ?.endsWith(this.getValue(nodeId, "suffix"));
          break;
        case "Includes [string]":
          result = this.getValue(nodeId, "input")
            ?.includes(this.getValue(nodeId, "search"));
          break;
        case "Equals [string]":
          result = this.getValue(nodeId, "a") === this.getValue(nodeId, "b");
          break;
        case "Not Equals [string]":
          result = this.getValue(nodeId, "a") !== this.getValue(nodeId, "b");
          break;
        case "To Upper Case [string]":
          result = this.getValue(nodeId, "input")?.toUpperCase();
          break;
        case "To Lower Case [string]":
          result = this.getValue(nodeId, "input")?.toLowerCase();
          break;
        case "Trim [string]":
          result = this.getValue(nodeId, "input")?.trim();
          break;
        case "String Length":
          result = this.getValue(nodeId, "input")?.length ?? 0;
          break;
        case "Substring [string]":
          result = this.getValue(nodeId, "input")
            ?.substring(
              this.getValue(nodeId, "start"),
              this.getValue(nodeId, "end")
            );
          break;
        case "Replace [string]":
          result = this.getValue(nodeId, "input")
            ?.replace(
              this.getValue(nodeId, "search"),
              this.getValue(nodeId, "replace")
            );
          break;
        case "Split [string]":
          result = this.getValue(nodeId, "input")
            ?.split(this.getValue(nodeId, "separator"));
          break;
        case "Concat [string]":
          result =
            (this.getValue(nodeId, "a") ?? "") +
            (this.getValue(nodeId, "b") ?? "");
          break;
        case "Is Empty [string]":
          result = !this.getValue(nodeId, "input") ||
            this.getValue(nodeId, "input").length === 0;
          break;

        case "Add":
          result = this.getValue(nodeId, "a") + this.getValue(nodeId, "b");
          break;
        case "Sub":
          result = this.getValue(nodeId, "a") - this.getValue(nodeId, "b");
          break;
        case "Mul":
          result = this.getValue(nodeId, "a") * this.getValue(nodeId, "b");
          break;
        case "Div":
          result = this.getValue(nodeId, "a") / this.getValue(nodeId, "b");
          break;
        case "Sin":
          result = Math.sin(this.getValue(nodeId, "a"));
          break;
        case "Cos":
          result = Math.cos(this.getValue(nodeId, "a"));
          break;
        case "Pi":
          result = Math.PI;
          break;
        case "A > B":
          result = this.getValue(nodeId, "A") > this.getValue(nodeId, "B");
          break;
        case "A < B":
          result = this.getValue(nodeId, "A") < this.getValue(nodeId, "B");
          break;
        case "A == B":
          let varA = this.getValue(nodeId, "A");
          let varB = this.getValue(nodeId, "B");
          if(typeof varA == "object") {
            const r = this.deepEqual(varA, varB);
            result = r;
          } else {
            result = this.getValue(nodeId, "A") != this.getValue(nodeId, "B");
          }
          break;
        case "A != B":
          let varAN = this.getValue(nodeId, "A");
          let varBN = this.getValue(nodeId, "B");
          if(typeof varAN == "object") {
            const r = this.deepEqual(varAN, varBN);
            result = !r;
          } else {
            result = this.getValue(nodeId, "A") != this.getValue(nodeId, "B");
          }
          break;
        case "A >= B":
          result = this.getValue(nodeId, "A") >= this.getValue(nodeId, "B");
          break;
        case "A <= B":
          result = this.getValue(nodeId, "A") <= this.getValue(nodeId, "B");
          break;
        case "GenRandInt":
          const min = + node.fields?.find(f => f.key === "min")?.value || 0;
          const max = + node.fields?.find(f => f.key === "max")?.value || 10;
          result = Math.floor(Math.random() * (max - min + 1)) + min;
          break;
        default:
          result = undefined;
      }

      node._returnCache = result;
      if(node.displayEl) node.displayEl.textContent = typeof result === "number" ? result.toFixed(3) : String(result);
      return result;
    }

    if(node.outputs?.some(o => o.name === pinName)) {
      const dynamicNodes = ["GenRandInt", "RandomFloat"];
      if((node._returnCache === undefined || dynamicNodes.includes(node.title)) && !node.noselfExec) {
        this._execContext = nodeId;
        this.triggerNode(nodeId);
        this._execContext = null;
      }
      return node._returnCache;
    }
    return undefined;
  }

  updateValueDisplays() {
    for(const id in this.nodes) {
      const node = this.nodes[id];
      if(!node.displayEl) continue;
      if(node.title === "Print") {
        const pin = node.inputs?.[0];
        if(!pin) continue;
        const val = this.getValue(node.id, pin.name);
        if(val === undefined) {
          node.displayEl.textContent = "undefined";
        } else if(typeof val === "object") {
          node.displayEl.textContent = JSON.stringify(val, null, 2);
        } else if(typeof val === "number") {
          node.displayEl.textContent = val.toFixed(3);
        } else {
          node.displayEl.textContent = String(val);
        }
      }
    }
  }

  extractArgs(code) {
    const match = code.match(/function\s+[^(]*\(([^)]*)\)/);
    if(!match) return [];
    return match[1].split(",").map(a => a.trim()).filter(Boolean);
  }

  adaptDynamicFunction(node, fnName) {
    console.log('adaptDynamicFunction(node, fnName) ')
    const fn = node.accessObject?.[fnName];
    if(typeof fn !== "function") return;
    node.inputs = [{name: "exec", type: "action"}];
    node.outputs = [{name: "execOut", type: "action"}];
    // args → inputs read
    const args = this.getArgNames(fn);
    args.forEach(arg => {
      node.inputs.push({name: arg, type: "any"});
    });
    if(this.hasReturn(fn)) {
      node.outputs.push({name: "return", type: "value"});
    }
    node.category = "functions";
    node.fn = fn; // REAL FUNCTION
    node.fnName = fnName;
    node.descFunc = fnName;
    // node.title = fnName;
    this.updateNodeDOM(node.id);
  }

  invalidateVariableGetters(type, varName) {
    for(const id in this.nodes) {
      const n = this.nodes[id];
      if(n.category === "value" &&
        n.fields?.some(f => f.key === "var" && f.value === varName) &&
        n.title === `Get ${type[0].toUpperCase() + type.slice(1)}`) {
        delete n._returnCache;
      }
    }
  }

  deepEqual(a, b) {
    if(a === b) return true;
    if(typeof a !== "object" || typeof b !== "object" || a == null || b == null)
      return false;
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if(keysA.length !== keysB.length) return false;
    for(const key of keysA) {
      if(!keysB.includes(key)) return false;
      if(!this.deepEqual(a[key], b[key])) return false;
    }
    return true;
  }

  triggerNode(nodeId) {
    const n = this.nodes[nodeId];
    if(!n) return;
    this._execContext = nodeId;
    // Highlight node header
    const highlight = document.querySelector(`.node[data-id="${nodeId}"] .header`);
    if(highlight) {
      highlight.style.filter = "brightness(1.5)";
      setTimeout(() => (highlight.style.filter = "none"), 200);
    }

    if(n.title === "Get Sub Object") {
      const obj = this.getValue(n.id, "object");
      let path = n.fields.find(f => f.key === "path")?.value;
      let target = this.resolvePath(obj, path);

      if(target === undefined) {
        // probably no prefix .value 
        path = path.replace('value.', '');
        target = this.resolvePath(obj, path);
      }
      console.warn('SET CACHE target is ', target)
      // n.outputs = n.outputs.filter(p => p.type === "action");
      n._subCache = target;
      n._returnCache = target;
      n._needsRebuild = false;
      n._pinsBuilt = true;

      this.enqueueOutputs(n, "execOut");
      return;
    } else if(n.type === "forEach") {
      let arr;
      const link = this.links.find(l => l.to.node === n.id);
      if(link) arr = this.getValue(link.from.node, link.from.pin);
      // Fallback to literal
      if(arr === undefined) {
        const inputPin = n.inputs?.find(p => p.name === "array");
        arr = inputPin?.default;
      }

      if(typeof arr === "string") {
        try {
          arr = JSON.parse(arr);
        } catch(e) {
          console.warn("Failed to parse array string", arr);
          arr = [];
        }
      }
      if(!Array.isArray(arr)) return;
      arr.forEach((item, index) => {
        // update node runtime state!
        n.state = {item, index};
        this.links.filter(l => l.type === "action" && l.from.node === n.id && l.from.pin === "loop").forEach(l => {
          this.triggerNode(l.to.node);
        });
      });
      // completed pin (once)
      this.links.filter(l => l.type === "action" && l.from.node === n.id && l.from.pin === "completed")
        .forEach(l => {this.triggerNode(l.to.node)});
    } else if(n.title === "Get Array") {
      let arr;
      // Find input link BAd but ok for now
      const link = this.links.find(l =>
        l.to.node === n.id && (l.to.pin === "array" ||
          l.to.pin === "result" || l.to.pin === "value")
      );



      if(link) {
        const fromNode = this.nodes[link.from.node];
        if(fromNode._returnCache === undefined && fromNode._subCache === undefined) {
          this.triggerNode(fromNode.id);
        }
        if(fromNode._returnCache) arr = fromNode._returnCache;
        if(fromNode._subCache) arr = fromNode._subCache;

      } else {
        // fallback to default literal
        arr = n.inputs?.find(p => p.name === "array")?.default ?? [];
      }
      // make it fluid 
      n._returnCache = Array.isArray(arr) ? arr : arr ? arr[link.from.pin] :
        this.getValue(link.from.node, link.from.pin);

      this.enqueueOutputs(n, "execOut");
      return;
    } else if(n.title === "reffunctions") {
      const fn = n._fnRef;
      if(typeof fn !== "function") {
        console.warn("[reffunctions] No function reference");
        this.enqueueOutputs(n, "execOut");
        return;
      }

      // Collect REAL args (exclude exec + reference)
      const args = n.inputs
        .filter(p => p.type !== "action" && p.name !== "reference")
        .map(p => this.getValue(n.id, p.name));

      const result = fn(...args);

      if(this.hasReturn(fn)) {
        n._returnCache = result;
      }

      this.enqueueOutputs(n, "execOut");
      return;
    } else if(n.title === "Custom Event") {
      console.log('********************************')
      // if(n._listenerAttached === true) return;

      const eventName = n.fields?.find(f => f.key === "name")?.value;
      if(!eventName) return;
      const handler = (e) => {
        console.log('**TRUE** HANDLER**');
        n._returnCache = e.detail;
        this.enqueueOutputs(n, "exec");
      };
      console.log('**eventName**', eventName)
      window.removeEventListener(eventName, handler);
      window.addEventListener(eventName, handler);
      n._eventHandler = handler;
      n._listenerAttached = true;
      return;
    } else if(n.title === "Dispatch Event") {
      const name = this.getValue(nodeId, "eventName");
      if(!name) {
        console.warn("[Dispatch] missing eventName");
        this.enqueueOutputs(n, "execOut");
        return;
      }
      const detail = this.getValue(nodeId, "detail");
      console.log('*************window.dispatchEvent****************', name)
      window.dispatchEvent(
        new CustomEvent(name, {
          detail: detail ?? {}
        })
      );

      this.enqueueOutputs(n, "execOut");
      return;
    } else if(n.title === "On Ray Hit") {
      console.log('On Ray Hit =NOTHING NOW', n._listenerAttached)
    }

    if(n.isGetterNode) {
      const varField = n.fields?.find(f => f.key === "var");
      if(varField && varField.value) {
        const type = n.title.replace("Get ", "").toLowerCase();
        const value = this.getVariable(type, varField.value);
        n._returnCache = value;
        // Update visual label if exists
        if(n.displayEl) {
          if(type === "object") {
            n.displayEl.textContent =
              value !== undefined ? JSON.stringify(value) : "{}";
          } else if(typeof value === "number") {
            n.displayEl.textContent = value.toFixed(3);
          } else {
            n.displayEl.textContent = String(value);
          }
        }
      }
      n.finished = true;
      return;
    }

    if(n.title === "On Target Position Reach") {

      const pos = this.getValue(nodeId, "position");
      console.info("On Target Position Reach ", pos);
      if(!pos) return;
      // Attach listener (engine-agnostic)
      pos.onTargetPositionReach = () => {
        this.triggerNode(n);
        this.enqueueOutputs(n, "exec");
      };
      n._listenerAttached = true;
      return;
    }

    // functionDinamic execution
    if(n.category === "functions") {
      // bloomPass is created in post time - make always update
      n.accessObject = eval(n.accessObjectLiteral);
      if(n.fn === undefined) {
        n.fn = n.accessObject[n.fnName]
      }

      const args = n.inputs
        .filter(p => p.type !== "action")
        .map(p => this.getValue(n.id, p.name));
      const result = n.fn(...args);
      if(this.hasReturn(n.fn)) {
        n._returnCache = result;
      }
      this.enqueueOutputs(n, "execOut");
      return;
    }

    if(n.category === "event" && typeof n.noselfExec === 'undefined') {
      // console.log('EXEC :  ', n.title)
      this.enqueueOutputs(n, "exec");
      return;
    }

    if(n.category === "event" && typeof n.noselfExec != 'undefined') {
      console.log('PREVENT SELF EXEC')
      return;
    }

    if(n.isVariableNode) {
      const type = n.title.replace("Set ", "").toLowerCase();
      const varField = n.fields?.find(f => f.key === "var");

      if(varField && varField.value) {

        let value = this.getValue(nodeId, "value");
        // if 0 probably no pin connection
        if(n.title == "Set Object") {
          if(value == 0) {
            let varliteral = n.fields?.find(f => f.key === "literal");
            console.log("set object  varliteral.value ", varliteral.value);
            this.variables[type][varField.value] = JSON.parse(varliteral.value);
          }
        } else {
          console.log("set object ", value);
          this.variables[type][varField.value] = {value};
        }

        this.notifyVariableChanged(type, varField.value);
        // Update matching getter nodes instantly
        for(const nodeId2 in this.nodes) {
          const node2 = this.nodes[nodeId2];
          if(node2.isGetterNode) {
            const vf2 = node2.fields?.find(f => f.key === "var");
            if(vf2 && vf2.value === varField.value && node2.displayEl) {
              if(type === "object") {
                node2.displayEl.textContent = JSON.stringify(value);
              } else {
                node2.displayEl.textContent =
                  typeof value === "number" ? value.toFixed(3) : String(value);
              }
              node2._returnCache = value;
            }
          }
        }
      }

      n.finished = true;
      this.enqueueOutputs(n, "execOut");
      return;
    }

    if(n.title === "Fetch") {
      const url = this.getValue(nodeId, "url");
      if(!url) {
        console.warn("[Fetch] URL missing");
        this.enqueueOutputs(n, "error");
        return;
      }

      const method = this.getValue(nodeId, "method") || "GET";
      const body = this.getValue(nodeId, "body");
      const headers = this.getValue(nodeId, "headers") || {};
      const options = {method, headers};

      if(body && method !== "GET") {
        options.body = typeof body === "string" ? body : JSON.stringify(body);

        if(!headers["Content-Type"]) {
          headers["Content-Type"] = "application/json";
        }
      }

      fetch(url, options)
        .then(async res => {
          n._returnCache = {
            response: await res.json().catch(() => null),
            status: res.status,
          };
          this.enqueueOutputs(n, "execOut");
        })
        .catch(err => {
          console.error("[Fetch]", err);
          this.enqueueOutputs(n, "error");
        });
      return;
    }

    // Action / Print / Timer Nodes
    if(["action", "actionprint", "timer"].includes(n.category)) {
      // only for custom functions from managerfunction
      if(n.attachedMethod) this._executeAttachedMethod(n);

      if(n.title === "Print") {
        const label = n.fields?.find(f => f.key === "label")?.value || "Print:";
        let val;

        const link = this.getConnectedSource(nodeId, "value");
        if(link) {
          const fromNode = link.node;
          const fromPin = link.pin;
          if(
            fromNode._subCache &&
            typeof fromNode._subCache === "object" &&
            fromPin in fromNode._subCache
          ) {
            val = fromNode._subCache[fromPin];
          } else {
            val = this.getValue(fromNode.id, fromPin);
          }
        } else {
          val = this.getValue(nodeId, "value");
        }

        if(n.displayEl) {
          if(typeof val === "object") {
            n.displayEl.textContent = JSON.stringify(val);
          } else if(typeof val === "number") {
            n.displayEl.textContent = val.toFixed(3);
          } else {
            n.displayEl.textContent = String(val);
          }
        }

        console.info(`%c[Print] ${label}` + val, LOG_FUNNY_ARCADE);
      } else if(n.title === "SetTimeout") {
        const delay = +n.fields?.find(f => f.key === "delay")?.value || 1000;
        setTimeout(() => this.enqueueOutputs(n, "execOut"), delay);
        return;
      } else if(n.title === "Play MP3") {
        const key = this.getValue(nodeId, "key");
        const src = this.getValue(nodeId, "src");
        const clones = Number(this.getValue(nodeId, "clones")) || 1;

        if(!key || !src) {
          console.info(`%c[Play MP3] Missing key or src...`, LOG_FUNNY_ARCADE);
          this.enqueueOutputs(n, "execOut");
          return;
        }

        const createdField = n.fields.find(f => f.key === "created");

        if(!createdField.value) {
          createdField.disabled = true;
          app.matrixSounds.createAudio(key, src, clones);
          createdField.value = true;
        }

        app.matrixSounds.play(key);

        this.enqueueOutputs(n, "execOut");
        return;
      } else if(n.title === "Generator") {
        const texturePath = this.getValue(nodeId, "texturePath");
        const mat = this.getValue(nodeId, "material");
        let pos = this.getValue(nodeId, "pos");
        const geo = this.getValue(nodeId, "geometry");
        let rot = this.getValue(nodeId, "rot");
        let delay = this.getValue(nodeId, "delay");
        let sum = this.getValue(nodeId, "sum");
        let raycast = this.getValue(nodeId, "raycast");
        let scale = this.getValue(nodeId, "scale");
        let name = this.getValue(nodeId, "name");
        // spec adaptation
        if(raycast == "true") {raycast = true} else {raycast = false;}
        if(typeof delay == 'string') delay = parseInt(delay);
        if(typeof pos == 'string') eval("pos = " + pos)
        if(typeof rot == 'string') eval("rot = " + rot)
        if(!texturePath || !pos) {
          console.warn("[Generator] Missing input fields...");
          this.enqueueOutputs(n, "execOut");
          return;
        }
        const createdField = n.fields.find(f => f.key === "created");
        if(createdField.value == "false" || createdField.value == false) {
          console.log('!GEN! ONCE!');
          app.physicsBodiesGenerator(mat, pos, rot, texturePath, name, geo, raycast, scale, sum, delay);
          // createdField.value = true;
        }

        this.enqueueOutputs(n, "execOut");
        return;
      } else if(n.title === "Generator Wall") {
        const texturePath = this.getValue(nodeId, "texturePath");
        const mat = this.getValue(nodeId, "material");
        let pos = this.getValue(nodeId, "pos");
        const size = this.getValue(nodeId, "size");
        let rot = this.getValue(nodeId, "rot");
        let delay = this.getValue(nodeId, "delay");
        let spacing = this.getValue(nodeId, "spacing");
        let raycast = this.getValue(nodeId, "raycast");
        let scale = this.getValue(nodeId, "scale");
        let name = this.getValue(nodeId, "name");
        // spec adaptation
        if(raycast == "true") {raycast = true} else {raycast = false;}
        if(typeof delay == 'string') delay = parseInt(delay);
        if(typeof pos == 'string') eval("pos = " + pos);
        if(typeof rot == 'string') eval("rot = " + rot);
        if(typeof scale == 'string') eval("scale = " + scale);
        if(!texturePath || !pos) {
          console.warn("[Generator] Missing input fields...");
          this.enqueueOutputs(n, "execOut");
          return;
        }
        const createdField = n.fields.find(f => f.key === "created");
        if(createdField.value == "false" || createdField.value == false) {
          // console.log('!GEN WALL! ONCE!');
          app.physicsBodiesGeneratorWall(mat, pos, rot, texturePath, name, size, raycast, scale, spacing, delay);
          // createdField.value = true;
        }

        this.enqueueOutputs(n, "execOut");
        return;
      } else if(n.title === "Generator Pyramid") {
        const texturePath = this.getValue(nodeId, "texturePath");
        const mat = this.getValue(nodeId, "material");
        let pos = this.getValue(nodeId, "pos");
        const levels = this.getValue(nodeId, "levels");
        let rot = this.getValue(nodeId, "rot");
        let delay = this.getValue(nodeId, "delay");
        let spacing = this.getValue(nodeId, "spacing");
        let raycast = this.getValue(nodeId, "raycast");
        let scale = this.getValue(nodeId, "scale");
        let name = this.getValue(nodeId, "name");
        // spec adaptation
        if(raycast == "true") {raycast = true} else {raycast = false;}
        if(typeof delay == 'string') delay = parseInt(delay);
        if(typeof pos == 'string') eval("pos = " + pos);
        if(typeof rot == 'string') eval("rot = " + rot);
        if(typeof scale == 'string') eval("scale = " + scale);
        if(!texturePath || !pos) {
          console.warn("[Generator] Missing input fields...");
          this.enqueueOutputs(n, "execOut");
          return;
        }
        const createdField = n.fields.find(f => f.key === "created");
        if(createdField.value == "false" || createdField.value == false) {
          // console.log('!GEN PYRAMID! ONCE!');
          app.physicsBodiesGeneratorDeepPyramid(mat, pos, rot, texturePath, name, levels, raycast, scale, spacing, delay);
          // createdField.value = true;
        }

        this.enqueueOutputs(n, "execOut");
        return;
      } else if(n.title === "Set Force On Hit") {
        const objectName = this.getValue(nodeId, "objectName");
        const strength = this.getValue(nodeId, "strength");
        const rayDirection = this.getValue(nodeId, "rayDirection");
        if(!objectName || !rayDirection || !strength) {
          console.warn("[Set Force On Hit] Missing input fields...");
          this.enqueueOutputs(n, "execOut");
          return;
        }
        let b = app.matrixAmmo.getBodyByName(objectName);
        const i = new Ammo.btVector3(
          rayDirection[0] * strength,
          rayDirection[1] * strength,
          rayDirection[2] * strength
        );
        b.applyCentralImpulse(i);
        this.enqueueOutputs(n, "execOut");
        return;
      } else if(n.title === "Set Video Texture") {
        const objectName = this.getValue(nodeId, "objectName");
        let videoTextureArg = this.getValue(nodeId, "VideoTextureArg");

        if(!objectName) {
          console.warn("[Set Video Texture] Missing input fields...");
          this.enqueueOutputs(n, "execOut");
          return;
        }

        // console.warn("[Set Video Texture] arg:", videoTextureArg);
        if(typeof videoTextureArg != 'object') {
          // console.warn("[Set Video Texture] arg is not object!:", videoTextureArg);
          if(typeof videoTextureArg == 'string') {
            eval("videoTextureArg = " + videoTextureArg);
          }
          if(typeof videoTextureArg === "undefined" || videoTextureArg === null)
            videoTextureArg = {
              type: "video", // video , camera  //not tested canvas2d, canvas2dinline
              src: "res/videos/tunel.mp4",
            };
        }

        let o = app.getSceneObjectByName(objectName);
        o.loadVideoTexture(videoTextureArg);

        this.enqueueOutputs(n, "execOut");
        return;
      } else if(n.title === "Set CanvasInline") {
        const objectName = this.getValue(nodeId, "objectName");
        let canvaInlineProgram = this.getValue(nodeId, "canvaInlineProgram");
        let specialCanvas2dArg = this.getValue(nodeId, "specialCanvas2dArg");
        if(!objectName) {
          console.log(`%c Node [Set CanvasInline] probably objectname is missing...`, LOG_FUNNY_ARCADE);
          this.enqueueOutputs(n, "execOut");
          return;
        }
        // console.warn("[canvaInlineProgram] specialCanvas2dArg arg:", specialCanvas2dArg);
        if(typeof specialCanvas2dArg == 'string') {
          eval("specialCanvas2dArg = " + specialCanvas2dArg);
        }
        if(typeof canvaInlineProgram != 'function') {
          // console.warn("[canvaInlineProgram] arg is not object!:", canvaInlineProgram);
          if(typeof canvaInlineProgram == 'string') {
            canvaInlineProgram = eval("canvaInlineProgram = " + canvaInlineProgram);
          }
          if(typeof canvaInlineProgram === "undefined" || canvaInlineProgram === null)
            canvaInlineProgram = function(ctx, canvas) {};
        }

        let o = app.getSceneObjectByName(objectName);
        if(typeof o === 'undefined') {
          console.log(`%c Node [Set CanvasInline] probably objectname is wrong...`, LOG_FUNNY_ARCADE);
          mb.show("FluxCodexVertex Exec order is breaked on [Set CanvasInline] node id:", n.id);
          return;
        }
        // mb.show("FluxCodexVertex WHAT IS on [Set CanvasInline] node id:", n.id);
        o.loadVideoTexture({
          type: "canvas2d-inline",
          canvaInlineProgram: canvaInlineProgram,
          specialCanvas2dArg: specialCanvas2dArg ? specialCanvas2dArg : undefined
        });

        this.enqueueOutputs(n, "execOut");
        return;
      } else if(n.title === "Curve") {
        const cName = this.getValue(nodeId, "name");
        const cDelta = this.getValue(nodeId, "delta");
        if(!cName) {
          console.log(`%c Node [CURVE] probably name is missing...`, LOG_FUNNY_ARCADE);
          this.enqueueOutputs(n, "execOut");
          return;
        }
        let curve = this.curveEditor.curveStore.getByName(nodeId);
        if(!curve) {
          console.warn("Curve not found:", cName);
          this.enqueueOutputs(n, "execOut");
          return;
        }
        if(!curve.baked) {
          console.log(`%cNode [CURVE] ${curve} bake.`, LOG_FUNNY_ARCADE);
          curve.bake();
        }
        n.curve = curve;
        const t01 = cDelta / curve.length;
        // smooth
        // const t01 = curve.loop
        // ? (cDelta / curve.length) % 1
        // : Math.min(1, Math.max(0, cDelta / curve.length));
        let V = n.curve.evaluate(t01);
        n._returnCache = V;
        this.enqueueOutputs(n, "execOut");
        return;
      } else if(n.title === "getNumberLiteral") {
        const literailNum = this.getValue(nodeId, "number");
        n._returnCache = literailNum;
        this.enqueueOutputs(n, "execOut");
        return;
      } else if(n.title === "Audio Reactive Node") {
        const src = this.getValue(nodeId, "audioSrc");
        const loop = this.getValue(nodeId, "loop");
        const thresholdBeat = this.getValue(nodeId, "thresholdBeat");
        const createdField = n.fields.find(f => f.key === "created");
        if(!n._audio && !n._loading) {
          n._loading = true;
          createdField.value = true;
          createdField.disabled = true;
          app.audioManager.load(src).then(asset => {
            asset.audio.loop = loop;
            n._audio = asset;
            n._energyHistory = [];
            n._beatCooldown = 0;
            n._loading = false;
          });
          return;
        }

        if(!n._audio || !n._audio.ready) return;
        const data = n._audio.updateFFT();
        if(!data) return;
        let low = 0, mid = 0, high = 0;
        for(let i = 0;i < 16;i++) low += data[i];
        for(let i = 16;i < 64;i++) mid += data[i];
        for(let i = 64;i < 128;i++) high += data[i];
        low /= 16;
        mid /= 48;
        high /= 64;
        const energy = (low + mid + high) / 3;
        const hist = n._energyHistory;
        hist.push(low);
        if(hist.length > 30) hist.shift();
        let avg = 0;
        for(let i = 0;i < hist.length;i++) avg += hist[i];
        avg /= hist.length;
        let beat = false;
        if(low > avg * thresholdBeat && n._beatCooldown <= 0) {
          beat = true;
          n._beatCooldown = 10;
        }
        if(n._beatCooldown > 0) n._beatCooldown--;
        n._returnCache = [low, mid, high, energy, beat];

        this.enqueueOutputs(n, "execOut");
        return;
      }


      this.enqueueOutputs(n, "execOut");
      return;
    }

    if(n.category === "logic" && n.title === "if") {
      // console.log('TEST LOGIC ')
      const condition = Boolean(this.getValue(nodeId, "condition"));
      this.enqueueOutputs(n, condition ? "true" : "false");
      this._execContext = null;
      return;
    }

    if(n.title === "Get Speed") {
      const pos = this.getValue(nodeId, "position");
      if(pos?.getSpeed) {
        // this.getValue(nodeId, "thrust")
        console.log('pos.getSpeed()', pos.getSpeed())
        n._returnCache = pos.getSpeed();
      }
      this.enqueueOutputs(n, "execOut");
      return;
    } else if(n.title === "Set Texture") {
      const texpath = this.getValue(nodeId, "texturePath");
      const sceneObjectName = this.getValue(nodeId, "sceneObjectName");
      if(texpath) {
        // console.log('sceneObjectName', sceneObjectName)
        let obj = app.getSceneObjectByName(sceneObjectName);
        obj.loadTex0([texpath]).then(() => {
          setTimeout(() => obj.changeTexture(obj.texture0), 200);
        })
      }
      this.enqueueOutputs(n, "execOut");
      return;
    } else if(n.title === "Set Speed") {
      const pos = this.getValue(nodeId, "position");
      if(pos?.setSpeed) {
        pos.setSpeed(this.getValue(nodeId, "thrust"));
      }
      this.enqueueOutputs(n, "execOut");
      return;
    } else if(n.title === "Set Position") {
      const pos = this.getValue(nodeId, "position");
      if(pos?.setPosition) {
        pos.setPosition(this.getValue(nodeId, "x"), this.getValue(nodeId, "y"), this.getValue(nodeId, "z"));
      }
      this.enqueueOutputs(n, "execOut");
      return;
    } else if(n.title === "Set Rotation") {
      const rot = this.getValue(nodeId, "rotation");
      if(rot?.setRotation) {
        rot.setRotation(this.getValue(nodeId, "x"), this.getValue(nodeId, "y"), this.getValue(nodeId, "z"));
      }
      this.enqueueOutputs(n, "execOut");
      return;
    } else if(n.title === "Set Rotate") {
      const rot = this.getValue(nodeId, "rotation");
      if(rot?.setRotate) {
        rot.setRotate(this.getValue(nodeId, "x"), this.getValue(nodeId, "y"), this.getValue(nodeId, "z"));
      }
      this.enqueueOutputs(n, "execOut");
      return;
    } else if(n.title === "Set RotateX") {
      const rot = this.getValue(nodeId, "rotation");
      if(rot?.setRotateX) {
        rot.setRotateX(this.getValue(nodeId, "x"));
      }
      this.enqueueOutputs(n, "execOut");
      return;
    } else if(n.title === "Set RotateY") {
      const rot = this.getValue(nodeId, "rotation");
      if(rot?.setRotateY) {
        rot.setRotateY(this.getValue(nodeId, "y"));
      }
      this.enqueueOutputs(n, "execOut");
      return;
    } else if(n.title === "Set RotateZ") {
      const rot = this.getValue(nodeId, "rotation");
      if(rot?.setRotateZ) {
        rot.setRotateZ(this.getValue(nodeId, "z"));
      }
      this.enqueueOutputs(n, "execOut");
      return;
    } else if(n.title === "Translate By X") {
      const pos = this.getValue(nodeId, "position");
      if(pos?.translateByX) {
        pos.translateByX(this.getValue(nodeId, "x"));
      }
      this.enqueueOutputs(n, "execOut");
      return;
    } else if(n.title === "Translate By Y") {
      const pos = this.getValue(nodeId, "position");
      if(pos?.translateByY) {
        pos.translateByX(this.getValue(nodeId, "y"));
      }
      this.enqueueOutputs(n, "execOut");
      return;
    } else if(n.title === "Translate By Z") {
      const pos = this.getValue(nodeId, "position");
      if(pos?.translateByZ) {
        pos.translateByX(this.getValue(nodeId, "z"));
      }
      this.enqueueOutputs(n, "execOut");
      return;
    }

    // console.log("BEFORE COMPARE ");
    if(["math", "value", "compare", "stringOperation"].includes(n.category)) {

      console.log("BEFORE COMPARE ")
      let result;

      switch(n.title) {
        case "Starts With [string]":
          // console.log('test startsWith');
          result = this.getValue(nodeId, "input").startsWith(this.getValue(nodeId, "prefix"));
          break;
        case "Add":
          result = this.getValue(nodeId, "a") + this.getValue(nodeId, "b");
          break;
        case "Sub":
          result = this.getValue(nodeId, "a") - this.getValue(nodeId, "b");
          break;
        case "Mul":
          result = this.getValue(nodeId, "a") * this.getValue(nodeId, "b");
          break;
        case "Div":
          result = this.getValue(nodeId, "a") / this.getValue(nodeId, "b");
          break;
        case "Sin":
          result = Math.sin(this.getValue(nodeId, "a"));
          break;
        case "Cos":
          result = Math.cos(this.getValue(nodeId, "a"));
          break;
        case "Pi":
          result = Math.PI;
          break;
        case "A > B":
          result = this.getValue(nodeId, "A") > this.getValue(nodeId, "B");
          break;
        case "A < B":
          result = this.getValue(nodeId, "A") < this.getValue(nodeId, "B");
          break;
        case "A == B":
          let varA = this.getValue(nodeId, "A");
          let varB = this.getValue(nodeId, "B");
          if(typeof varA == "object") {
            const r = this.deepEqual(varA, varB);
            result = r;
          } else {
            result = this.getValue(nodeId, "A") != this.getValue(nodeId, "B");
          }
          break;
        case "A != B":
          let varAN = this.getValue(nodeId, "A");
          let varBN = this.getValue(nodeId, "B");
          if(typeof varAN == "object") {
            const r = this.deepEqual(varAN, varBN);
            result = !r;
          } else {
            result = this.getValue(nodeId, "A") != this.getValue(nodeId, "B");
          }
          break;
        case "A >= B":
          result = this.getValue(nodeId, "A") >= this.getValue(nodeId, "B");
          break;
        case "A <= B":
          result = this.getValue(nodeId, "A") <= this.getValue(nodeId, "B");
          break;
        case "GenRandInt":
          const min = +n.fields?.find(f => f.key === "min")?.value || 0;
          const max = +n.fields?.find(f => f.key === "max")?.value || 10;
          result = Math.floor(Math.random() * (max - min + 1)) + min;
          break;
        default:
          result = undefined;
      }

      n._returnCache = result;
      if(n.displayEl) n.displayEl.textContent = typeof result === "number" ? result.toFixed(3) : String(result);
    }

    this._execContext = null;

  }

  getConnectedSource(nodeId, inputName) {
    const link = this.links.find(l => l.to.node === nodeId && l.to.pin === inputName);
    if(!link) return null;
    return {
      node: this.nodes[link.from.node],
      pin: link.from.pin,
    };
  }

  populateAccessMethods(select) {
    // console.log("populateAccessMethods")
    select.innerHTML = "";
    this.accessObject.forEach(obj => {
      Object.getOwnPropertyNames(obj.__proto__)
        .filter(k => typeof obj[k] === "function" && k !== "constructor")
        .forEach(fn => {
          const opt = document.createElement("option");
          opt.value = `${obj.name}.${fn}`;
          opt.textContent = `${obj.name}.${fn}`;
          select.appendChild(opt);
        });
    });

    select.onchange = e => {
      const [objName, fnName] = e.target.value.split(".");
      this.adaptNodeToAccessMethod(node, objName, fnName);
    };
  }

  getByPath(obj, path) {
    return path.split(".").reduce((acc, key) => acc?.[key], obj);
  }

  getVariable(type, key) {
    const entry = this.variables[type]?.[key];
    if(entry === undefined) return undefined;
    if(entry && typeof entry === "object" && "value" in entry) {
      return entry.value;
    }
    return entry;
  }

  enqueueOutputs(n, pinName) {
    this.links
      .filter(l => l.from.node === n.id && l.from.pin === pinName && l.type === "action")
      .forEach(l =>
        setTimeout(() => {
          this.triggerNode(l.to.node);
        }, 2)
      );
  }

  deleteNode(nodeId) {
    const node = this.nodes[nodeId];
    if(!node) return;

    this.links = this.links.filter(link => {
      if(link.from.node === nodeId || link.to.node === nodeId) {
        const dom = document.getElementById(link.id);
        if(dom) dom.remove();
        return false;
      }
      return true;
    });

    const dom = this.board.querySelector(`[data-id="${nodeId}"]`);
    if(dom) dom.remove();
    delete this.nodes[nodeId];
    this.updateLinks();
  }

  bindGlobalListeners() {
    document.addEventListener("mousemove", this.handleMouseMove.bind(this));
    document.addEventListener("mouseup", this.handleMouseUp.bind(this));
    this.boardWrap.addEventListener(
      "mousedown",
      this.handleBoardWrapMouseDown.bind(this)
    );

    this.board.addEventListener("click", () => {
      byId("app").style.opacity = 1;
    });
  }

  handleMouseMove(e) {
    if(this.state.draggingNode) {
      const el = this.state.draggingNode;
      const newX = e.clientX - this.state.dragOffset[0];
      const newY = e.clientY - this.state.dragOffset[1];
      el.style.left = newX + "px";
      el.style.top = newY + "px";
      const id = el.dataset.id;
      if(this.nodes[id]) {
        this.nodes[id].x = newX;
        this.nodes[id].y = newY;
      }
      this.updateLinks();
    } else if(this.state.panning) {
      const dx = e.clientX - this.state.panStart[0],
        dy = e.clientY - this.state.panStart[1];
      this.state.pan[0] += dx;
      this.state.pan[1] += dy;
      this.board.style.transform = `translate(${this.state.pan[0]}px,${this.state.pan[1]}px)`;
      this.state.panStart = [e.clientX, e.clientY];
      this.updateLinks();
    }
  }

  handleMouseUp() {
    // if(this.state.draggingNode) setTimeout(() => this.updateValueDisplays(), 0);
    this.state.draggingNode = null;
    this.state.panning = false;
    document.body.style.cursor = "default";
  }

  handleBoardWrapMouseDown(e) {
    if(!e.target.closest(".node")) {
      this.state.panning = true;
      this.state.panStart = [e.clientX, e.clientY];
      document.body.style.cursor = "grabbing";
      this.selectNode(null);
    }
  }

  updateLinks() {
    while(this.svg.firstChild) this.svg.removeChild(this.svg.firstChild);
    const bRect = this.board.getBoundingClientRect();
    this.links.forEach(l => {
      const fromDot = this._getPinDot(l.from.node, l.from.pin, true);
      const toDot = this._getPinDot(l.to.node, l.to.pin, false);
      if(!fromDot || !toDot) return;
      const fRect = fromDot.getBoundingClientRect(),
        tRect = toDot.getBoundingClientRect();
      const x1 = fRect.left - bRect.left + 6,
        y1 = fRect.top - bRect.top + 6;
      const x2 = tRect.left - bRect.left + 6,
        y2 = tRect.top - bRect.top + 6;
      const path = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "path"
      );
      path.setAttribute("class", "link " + (l.type === "value" ? "value" : ""));
      path.setAttribute(
        "d",
        `M${x1},${y1} C${x1 + 50},${y1} ${x2 - 50},${y2} ${x2},${y2}`
      );
      this.svg.appendChild(path);
    });
  }

  runGraph() {
    // console.log('this.nodes', Object.values(this.nodes));
    if(byId("graph-status").innerHTML == '🔴' || Object.values(this.nodes).length == 0) {
      // Just dummy thoughts — this is wrong.
      // Every data in DOMs is good to use like status flas or any others calls.
      if(mb) mb.show('FluxCodexVertex not ready yet...');
      return;
    }
    byId("app").style.opacity = 0.5;
    this.initEventNodes();
    Object.values(this.nodes).forEach(n => (n._returnCache = undefined));
    Object.values(this.nodes)
      .filter(n => n.category === "event" && n.title === "onLoad")
      .forEach(n => this.triggerNode(n.id));
    byId("graph-status").innerHTML = '🔴';
  }

  compileGraph() {
    const bundle = {
      nodes: this.nodes,
      links: this.links,
      nodeCounter: this.nodeCounter,
      linkCounter: this.linkCounter,
      pan: this.state.pan,
      variables: this.variables,
    };

    function saveReplacer(key, value) {
      if(key === 'fn') return undefined;
      if(key === 'accessObject') return undefined;
      if(key === '_returnCache') return undefined;
      if(key === '_listenerAttached') return false;
      if(key === '_audio') return undefined;
      if(key === '_loading') return false;
      if(key === '_energyHistory') return undefined;
      if(key === '_beatCooldown') return 0;
      return value;
    }

    let d = JSON.stringify(bundle, saveReplacer);
    localStorage.setItem(this.SAVE_KEY, d);
    document.dispatchEvent(new CustomEvent('save-graph', {detail: d}));
    this.log("Graph saved to LocalStorage and final script");
  }

  clearStorage() {
    let ask = confirm("⚠️ This will delete all nodes. Are you sure?");
    if(ask) {
      this.clearAllNodes();
      localStorage.removeItem(this.SAVE_KEY);
      this.compileGraph(); // not just save empty
      // location.reload(true);
    }
  }

  clearAllNodes() {
    // Remove node DOMs
    this.board.querySelectorAll(".node").forEach(n => n.remove());
    // Clear data
    this.nodes = [];
    this.nodes.length = 0;
    this.links.length = 0;
    // Clear state
    this.state.selectedNode = null;
    this.state.draggingNode = null;
    this.state.connectingPin = null;
    // Optional: redraw connections
    this.updateLinks();
  }

  _buildSaveBundle() {
    return {
      nodes: this.nodes,
      links: this.links,
      nodeCounter: this.nodeCounter,
      linkCounter: this.linkCounter,
      pan: this.state.pan,
      variables: this.variables,
      version: 1,
    };
  }

  _loadFromBundle(data) {
    this.nodes = data.nodes || {};
    this.links = data.links || {};
    this.nodeCounter = data.nodeCounter || 0;
    this.linkCounter = data.linkCounter || 0;
    this.state.pan = data.pan || {x: 0, y: 0};

    this.variables = data.variables || {
      number: {},
      boolean: {},
      string: {},
    };

    // refresh UI
    this._refreshVarsList(this._varsPopup.children[1]);
    this.loadFromImport();

    this.log("Graph imported from JSON");
  }

  exportToJSON() {
    const bundle = this._buildSaveBundle();
    console.log(bundle);

    function saveReplacer(key, value) {
      if(key === 'fn') return undefined;
      if(key === 'accessObject') return undefined;
      if(key === '_returnCache') return undefined;
      if(key === '_listenerAttached') return false;
      return value;
    }

    const json = JSON.stringify(bundle, saveReplacer);

    const blob = new Blob([json], {type: "application/json"});
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "fluxcodex-graph.json";
    a.click();

    URL.revokeObjectURL(url);

    this.log("Graph exported as JSON");
  }

  _createImportInput() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.style.display = "none";

    input.onchange = e => {
      const file = e.target.files[0];
      if(!file) return;

      const reader = new FileReader();
      reader.onload = () => {
        try {
          const data = JSON.parse(reader.result);
          this._loadFromBundle(data);
        } catch(err) {
          console.error("Invalid JSON file", err);
        }
      };
      reader.readAsText(file);
    };

    document.body.appendChild(input);
    this._importInput = input;
  }

  init() {
    const saved = localStorage.getItem(this.SAVE_KEY);
    if(saved || app.graph) {
      try {
        let data;
        try {
          data = JSON.parse(saved);
          if(data == null) {
            console.warn("⚠️ No cache for graph, load from module!");
            data = app.graph;
          }
        } catch(e) {
          console.warn("⚠️ No cache for graph, load from module!");
          data = app.graph;
        }
        if(data.variables) {
          this.variables = data.variables;
          this._refreshVarsList(this._varsPopup.children[1]);
        }
        this.nodes = data.nodes || {};
        this.links = data.links || [];
        this.nodeCounter = data.nodeCounter || 1;
        this.linkCounter = data.linkCounter || 1;
        this.state.pan = data.pan || [0, 0];
        this.board.style.transform = `translate(${this.state.pan[0]}px,${this.state.pan[1]}px)`;
        Object.values(this.nodes).forEach(spec => {
          const domEl = this.createNodeDOM(spec);
          this.board.appendChild(domEl);
          if((spec.category === "value" && spec.title !== "GenRandInt") ||
            spec.category === "math" || spec.title === "Print") {
            spec.displayEl = domEl.querySelector(".value-display");
          }
          this.updateNodeDOM(spec.id);
        });
        this.updateLinks();
        this.restoreConnectionsRuntime();
        this.log("Loaded graph.");
        return;
      } catch(e) {
        console.error("Failed to load graph from storage:", e);
      }
    }
    this.addNode("event");
  }

  loadFromImport() {
    Object.values(this.nodes).forEach(spec => {
      const domEl = this.createNodeDOM(spec);
      this.board.appendChild(domEl);

      if((spec.category === "value" && spec.title !== "GenRandInt") ||
        spec.category === "math" || spec.title === "Print") {
        spec.displayEl = domEl.querySelector(".value-display");
      }
      // Only function nodes get dynamic pins updated
      if(spec.category === "action" && spec.title === "Function") {
        this.updateNodeDOM(spec.id);
      }
    });
    this.updateLinks();
    this.updateValueDisplays();
    this.log("Restored graph.");

    this.compileGraph();
    return;
  }

  // test
  onNodeDoubleClick(node) {
    console.log(`%c Node [CURVE  func] ${node.curve}`, LOG_FUNNY_ARCADE);
    if(node.title !== "Curve") return;
    this.curveEditor.bindCurve(node.curve, {
      name: node.id,
      idNode: node.id
    });
    this.curveEditor.toggleEditor(true);
  }

}