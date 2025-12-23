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
import {byId} from "../../engine/utils";

export default class FluxCodexVertex {
  constructor(boardId, boardWrapId, logId, methodsManager) {
    this.debugMode = true;
    this.toolTip = new METoolTip();

    this.methodsManager = methodsManager;
    this.variables = {
      number: {},
      boolean: {},
      string: {},
      object: {}
    };

    // DOM Elements
    this.board = document.getElementById(boardId);
    this.boardWrap = document.getElementById(boardWrapId);
    this.svg = this.board.querySelector('svg.connections');
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
      panStart: [0, 0]
    };

    // Bind event listeners
    this.createVariablesPopup();
    this._createImportInput();
    this.bindGlobalListeners();

    // track - for dom update
    this._varInputs = {}; // { "object.myVar": textarea }

    // Initialize the graph
    this.init();

    document.addEventListener('keydown', (e) => {
      if(e.key == 'F6') {
        e.preventDefault();
        this.runGraph();
      } else if(e.key === "Delete" /*|| e.key === "Backspace"*/) {
        if(this.state.selectedNode) {
          this.deleteNode(this.state.selectedNode);
          this.state.selectedNode = null;
        }
      }

    });

    this.createContextMenu();

    document.addEventListener('fluxcodex.input.change', e => {
      const {nodeId, field, value} = e.detail;

      const node = this.nodes.find(n => n.id === nodeId);
      if(!node) return;

      if(node.type !== 'getSubObject') return;
      if(field !== 'path') return;

      this.handleGetSubObject(node, value);
    });
  }

  createContextMenu() {
    let CMenu = document.createElement('div');
    CMenu.id = "fc-context-menu";
    CMenu.classList.add('fc-context-menu');
    CMenu.classList.add('hidden');

    const board = document.getElementById('board');

    board.addEventListener('contextmenu', e => {
      e.preventDefault();

      CMenu.innerHTML = this.getFluxCodexMenuHTML();

      const menuRect = CMenu.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      let x = e.clientX;
      let y = e.clientY;

      // Horizontal clamp (prevent right overflow)
      if(x + menuRect.width > vw) {
        x = vw - menuRect.width - 5;
      }

      // Vertical smart placement
      if(y > vh * 0.5) {
        // open upwards
        y = y - menuRect.height;
      }

      // Final clamp (top safety)
      if(y < 5) y = 5;

      CMenu.style.left = x + 'px';
      CMenu.style.top = y + 'px';
      CMenu.classList.remove('hidden');
    });

    document.addEventListener('click', () => {
      CMenu.classList.add('hidden');
    });


    byId('app').appendChild(CMenu);
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

    <hr>
    <span>Networking</span>
    <button onclick="app.editor.fluxCodexVertex.addNode('fetch')">Fetch</button>

    <hr>
    <span>Scene</span>
    <button onclick="app.editor.fluxCodexVertex.addNode('getSceneObject')">Get Scene Object</button>
    <button onclick="app.editor.fluxCodexVertex.addNode('setPosition')">Set Position</button>
    <button onclick="app.editor.fluxCodexVertex.addNode('onTargetPositionReach')">onTargetPositionReach</button>

    <button onclick="app.editor.fluxCodexVertex.addNode('getObjectAnimation')">getObjectAnimation</button>

    <button onclick="app.editor.fluxCodexVertex.addNode('dynamicFunction')">Function Dinamic</button>
    <button onclick="app.editor.fluxCodexVertex.addNode('getSubObject')">Get Sub Object</button>

    <hr>
    <span>JSON</span>
    <button onclick="app.editor.fluxCodexVertex.addNode('dynamicJSON')">JSON</button>

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

  log(...args) {this.logEl.textContent = args.join(' ');}

  createGetNumberNode(varName) {
    return this.addNode('getNumber', {var: varName});
  }

  createGetBooleanNode(varName) {
    return this.addNode('getBoolean', {var: varName});
  }

  createGetStringNode(varName) {
    return this.addNode('getString', {var: varName});
  }

  createGetObjectNode(varName) {
    return this.addNode('getObject', {var: varName});
  }

  createSetNumberNode(varName) {
    return this.addNode('setNumber', {var: varName});
  }

  createSetBooleanNode(varName) {
    return this.addNode('setBoolean', {var: varName});
  }

  createSetStringNode(varName) {
    return this.addNode('setString', {var: varName});
  }

  createSetObjectNode(varName) {
    return this.addNode('setObject', {var: varName});
  }

  evaluateGetterNode(n) {
    const key = n.fields?.find(f => f.key === 'var')?.value;
    if(!key) return;

    const type = n.title.replace('Get ', '').toLowerCase();
    const entry = this.variables[type]?.[key];

    // Use existing object directly
    n._returnCache = entry ? entry.value : (
      type === 'number' ? 0 :
        type === 'boolean' ? false :
          type === 'string' ? '' :
            type === 'object' ? {} :
              undefined
    );

    // Cache on node
    n._cachedValue = n._returnCache;

    // Cache on output pin
    const out = n.outputs?.[0];
    if(out) out.value = n._returnCache;

    console.log('[EVALUATE GETTER]', n.id, 'type:', type, 'key:', key, 'value:', n._returnCache);
  }

  notifyVariableChanged(type, key) {
    for(const id in this.nodes) {
      const n = this.nodes[id];

      // Update getter nodes
      if(n.isGetterNode) {
        const varField = n.fields?.find(f => f.key === 'var');
        if(varField?.value === key && n.title.replace('Get ', '').toLowerCase() === type) {
          this.evaluateGetterNode(n);

          if(n.displayEl) {
            const val = n._returnCache;
            if(type === 'object') n.displayEl.textContent = JSON.stringify(val, null, 2);
            else if(type === 'number') n.displayEl.textContent = val.toFixed(3);
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
          if(srcNode.fields?.find(f => f.key === 'var')?.value === key) {
            this._adaptGetSubObjectOnConnect(n, srcNode, srcPin);
          }
        }
      });
    }

    // Update variable input UI if exists
    const input = this._varInputs?.[`${type}.${key}`];
    if(input) {
      const storedValue = this.variables?.[type]?.[key];
      if(type === 'object') input.value = JSON.stringify(storedValue ?? {}, null, 2);
      else input.value = storedValue ?? '';
    }

    console.log('[NOTIFY VARIABLE]', type, key, 'value:', this.variables[type]?.[key]);
  }

  createVariablesPopup() {
    if(this._varsPopup) return;
    const popup = document.createElement('div');
    popup.id = 'varsPopup';
    this._varsPopup = popup;
    Object.assign(popup.style, {
      display: 'none',
      flexDirection: 'column',
      position: 'absolute',
      top: '10%',
      left: '0',
      width: '60%',
      height: '60%',
      overflow: 'scroll',
      background: 'linear-gradient(135deg, #1a1a1a 0%, #2b2b2b 100%), /* subtle dark gradient */ repeating-linear-gradient(0deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.05) 1px, transparent 1px, transparent 20px), repeating-linear-gradient(90deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.05) 1px, transparent 1px, transparent 20px)',
      backgroundBlendMode: 'overlay',
      backgroundSize: 'auto, 20px 20px, 20px 20px',
      border: '1px solid #444',
      borderRadius: '8px',
      padding: '10px',
      zIndex: 9999,
      color: '#eee',
      overflowX: 'hidden'
    });
    // HEADER
    const title = document.createElement('div');
    title.innerHTML = `Variables`;
    title.style.marginBottom = '8px';
    title.style.fontWeight = 'bold';
    popup.appendChild(title);

    const list = document.createElement('div');
    list.id = 'varslist'
    popup.appendChild(list);

    // CREATE BUTTONS
    const btns = document.createElement('div');
    btns.style.marginTop = '10px';
    btns.style.display = 'flex';
    btns.style.gap = '6px';

    btns.append(this._createVarBtn('Number', 'number'),
      this._createVarBtn('Boolean', 'boolean'),
      this._createVarBtn('String', 'string'),
      this._createVarBtn('Object', 'object')
    );

    popup.appendChild(btns);

    const hideVPopup = document.createElement('button');
    hideVPopup.innerText = `Hide`;
    hideVPopup.classList.add('btn4');
    hideVPopup.style.margin = '8px 8px 8px 8px';
    hideVPopup.style.width = '100px';
    hideVPopup.style.fontWeight = 'bold';
    // hideVPopup.style.height = '4%';
    hideVPopup.style.webkitTextStrokeWidth = '0px';
    hideVPopup.addEventListener('click', () => {
      byId('varsPopup').style.display = 'none';
    })
    popup.appendChild(hideVPopup);
    document.body.appendChild(popup);
    this.makePopupDraggable(popup);
    this._refreshVarsList(list);
  }

  _refreshVarsList(container) {
    container.innerHTML = '';

    const colors = {number: '#4fc3f7', boolean: '#aed581', string: '#ffb74d', object: '#ce93d8'};

    for(const type in this.variables) {
      for(const name in this.variables[type]) {
        const row = document.createElement('div');
        Object.assign(row.style, {display: 'flex', alignItems: 'center', gap: '6px', padding: '4px', cursor: 'pointer', borderBottom: '1px solid #222', color: colors[type] || '#fff'});

        const label = document.createElement('span');
        label.textContent = `${name} (${type})`;
        label.style.minWidth = '120px';

        let input;
        if(type === 'object') {
          input = document.createElement('textarea');
          input.value = JSON.stringify(this.variables[type][name] ?? {}, null, 2);  // ← read direct object
          input.style.width = '120px';
          input.style.height = '40px';
          input.style.webkitTextStrokeWidth = '0px';
        } else {
          input = document.createElement('input');
          input.value = this.variables[type][name] ?? '';
          input.style.width = '60px';
        }

        this._varInputs[`${type}.${name}`] = input;
        Object.assign(input.style, {background: '#000', color: '#fff', border: '1px solid #333'});

        input.oninput = () => {
          const link = this.getConnectedSource(node.id, 'object');
          if(!link?.node?.isGetterNode) return;

          const varField = link.node.fields?.find(f => f.key === 'var');
          const varName = varField?.value;
          const rootObj = this.variables?.object?.[varName];

          const path = input.value;
          const target = this.resolvePath(rootObj, path);

          console.log('[PATH INPUT CHANGE]', node.id, 'path:', path, 'target:', target);

          // 1️⃣ cache for pin creation
          node._subCache = {};
               node._subCache = target;
          // if(target && typeof target === 'object') {
          //   for(const k in target) node._subCache[k] = target[k];
          // }

          // 2️⃣ mark dirty (pins rebuild later)
          node._needsRebuild = true;
          node._pinsBuilt = false;

          this.updateNodeDOM(node.id);
        };


        const btnGet = document.createElement('button');
        btnGet.innerText = 'Get';
        btnGet.classList.add('btnGetter');
        btnGet.onclick = () => {
          if(type === 'number') this.createGetNumberNode(name);
          else if(type === 'boolean') this.createGetBooleanNode(name);
          else if(type === 'string') this.createGetStringNode(name);
          else if(type === 'object') this.createGetObjectNode(name);
        };

        const btnSet = document.createElement('button');
        btnSet.innerText = 'Set';
        btnSet.classList.add('btnGetter');
        btnSet.onclick = () => {
          if(type === 'number') this.createSetNumberNode(name);
          else if(type === 'boolean') this.createSetBooleanNode(name);
          else if(type === 'string') this.createSetStringNode(name);
          else if(type === 'object') this.createSetObjectNode(name);
        };

        row.append(label, input, btnGet, btnSet);
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

    handle.style.cursor = 'move';

    handle.addEventListener('mousedown', e => {
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      const rect = popup.getBoundingClientRect();
      startLeft = rect.left;
      startTop = rect.top;
      popup.style.left = startLeft + 'px';
      popup.style.top = startTop + 'px';
      popup.style.transform = 'none';
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    });

    const onMove = e => {
      if(!isDragging) return;
      popup.style.left = startLeft + (e.clientX - startX) + 'px';
      popup.style.top = startTop + (e.clientY - startY) + 'px';
    };

    const onUp = () => {
      isDragging = false;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
  }

  _createVarBtn(label, type) {
    const btn = document.createElement('button');
    btn.textContent = label;
    btn.style.flex = '1';
    btn.style.cursor = 'pointer';
    btn.classList.add('btn4');

    btn.onclick = () => {
      const name = prompt(`New ${type} variable name`);
      if(!name) return;

      if(!this.variables[type]) this.variables[type] = {};
      if(this.variables[type][name]) {
        alert('Variable exists');
        return;
      }

      // Create variable
      this.variables[type][name] =
        type === 'object' ? {} :  // ← store object directly
          type === 'number' ? 0 :
            type === 'boolean' ? false :
              type === 'string' ? '' : null;

      this._refreshVarsList(this._varsPopup.children[1]);
      console.log('[NEW VARIABLE]', type, name, this.variables[type][name]);
    };

    return btn;
  }


  _getPinDot(nodeId, pinName, isOutput) {
    const nodeEl = document.querySelector(`.node[data-id="${nodeId}"]`);
    if(!nodeEl) return null;
    const io = isOutput ? 'out' : 'in';
    return nodeEl.querySelector(`.pin[data-pin="${pinName}"][data-io="${io}"] .dot`);
  }

  populateVariableSelect(select, type) {
    select.innerHTML = '';

    const vars = this.variables[type];
    if(!vars.length) {
      const opt = document.createElement('option');
      opt.textContent = '(no variables)';
      opt.disabled = true;
      select.appendChild(opt);
      return;
    }

    vars.forEach(v => {
      const opt = document.createElement('option');
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
    if(/=>\s*[^({]/.test(src)) {return true;}
    // Case 2: normal "return" inside function body
    if(/return\s+/.test(src)) {return true;}
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
    node.attachedMethod = methodItem.name;
    node.fn = fn;
    // Refresh the DOM so new pins are clickable
    this.updateNodeDOM(node.id);
  }

  adaptNodeToMethod2(node, methodItem) {
    const fn = this.methodsManager.compileFunction(methodItem.code);
    const args = this.getArgNames(fn);

    // RESET value pins (keep exec)
    node.inputs = node.inputs.filter(p => p.type === 'action');
    node.outputs = node.outputs.filter(p => p.type === 'action');

    // Create input pins from function signature
    args.forEach(arg => {
      node.inputs.push({name: arg, type: 'value'});
    });

    // Return pin
    if(this.hasReturn(fn)) {
      node.outputs.push({name: 'return', type: 'value'});
    }

    node.attachedMethod = methodItem.name;
    node.fn = fn;

    this.updateNodeDOM(node.id);
  }

  populateMethodsSelect(selectEl) {
    selectEl.innerHTML = '';
    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = '-- Select Method --';
    selectEl.appendChild(placeholder);
    this.methodsManager.methodsContainer.forEach(method => {
      const opt = document.createElement('option');
      opt.value = method.name;
      opt.textContent = method.name;
      selectEl.appendChild(opt);
    });
  }

  updateNodeDOM(nodeId) {
    const node = this.nodes[nodeId];
    const el = document.querySelector(`.node[data-id="${nodeId}"]`);
    if(!el) return;

    const left = el.querySelector('.pins-left');
    const right = el.querySelector('.pins-right');
    if(!left || !right) return;

    // Clear only **non-exec pins**
    left.innerHTML = '';
    right.innerHTML = '';

    // Keep exec pins in the spec
    const inputs = node.inputs || [];
    const outputs = node.outputs || [];

    inputs.forEach(pin => left.appendChild(this._pinElement(pin, false, nodeId)));
    outputs.forEach(pin => right.appendChild(this._pinElement(pin, true, nodeId)));

    // Method select (only for Function nodes)
    if(node.category === 'action' && node.title === 'Function') {
      let select = el.querySelector('select.method-select');
      if(!select) {
        select = document.createElement('select');
        select.className = 'method-select';
        select.style.cssText = 'width:100%; margin-top:6px;';
        el.querySelector('.body').appendChild(select);
      }
      this.populateMethodsSelect(select);

      if(node.attachedMethod) select.value = node.attachedMethod;

      select.onchange = (e) => {
        const selected = this.methodsManager.methodsContainer.find(m => m.name === e.target.value);
        if(selected) this.adaptNodeToMethod(node, selected);
      };
    }
  }

  // NODE/PIN CREATION
  // CONNECTION HANDLERS
  startConnect(nodeId, pinName, type, isOut) {
    this.state.connecting = {node: nodeId, pin: pinName, type: type, out: isOut};
  }

  finishConnect(nodeId, pinName, type, isOut) {
    if(!this.state.connecting || this.state.connecting.node === nodeId) {
      this.state.connecting = null;
      return;
    }

    const from = this.state.connecting.out ? this.state.connecting : {node: nodeId, pin: pinName};
    const to = this.state.connecting.out ? {node: nodeId, pin: pinName} : this.state.connecting;

    // Prevent duplicate links and type mismatch
    if(from.pin && to.pin && this.isTypeCompatible(this.state.connecting.type, type)) {
      const exists = this.links.find(l =>
        l.from.node === from.node && l.from.pin === from.pin &&
        l.to.node === to.node && l.to.pin === to.pin
      );
      if(!exists) {
        this.links.push({id: 'link_' + (this.linkCounter++), from, to, type});
        this.updateLinks();
        if(type === 'value') setTimeout(() => this.updateValueDisplays(), 0);
      }
    }
    this.state.connecting = null;

    // test _______________________________
    let toNode = this.nodes[to.node];
    let fromNode = this.nodes[from.node];

    if(toNode && toNode.category === 'functions' && toNode.code && to.pin === 'reference') {
      console.log('TEST FUNC PIN ADAPT');
      const fnRef = this.getPinValue(fromNode, from.pin);
      if(typeof fnRef !== 'function') return;
      toNode._fnRef = fnRef;
      const fnName = fnRef.name || 'wrappedFn';
      toNode.code = `
        function ${fnName}(fn, ...args) {
          return fn(...args);
        }
        `.trim();
      // toNode.reference = fnRef;
      this.adaptNodeToMethod2(toNode, {
        name: this.methodsManager.extractName(toNode.code),
        code: toNode.code
      });
    }

    // ---------------------------------------
    // Get Sub Object – adapt pins on connect
    // ---------------------------------------
    toNode = this.nodes[to.node];
    fromNode = this.nodes[from.node];

    this.onPinsConnected(fromNode, from.pin, toNode, to.pin);

  }

  _adaptGetSubObjectOnConnect(getSubNode, sourceNode, sourcePin) {
    // 1️⃣ Get object from getter
    const obj = sourceNode._cachedValue;
    if(!obj || typeof obj !== 'object') return;

    // 2️⃣ Update preview field
    const varField = sourceNode.fields?.find(f => f.key === 'var');
    const previewField = getSubNode.fields?.find(f => f.key === 'objectPreview');
    if(previewField) {
      previewField.value = varField?.value || '[object]';
      if(getSubNode.objectPreviewEl) getSubNode.objectPreviewEl.value = previewField.value;
    }

    // 3️⃣ Resolve path
    const path = getSubNode.fields?.find(f => f.key === 'path')?.value;
    const target = this.resolvePath(obj, path);

    // 4️⃣ Adapt pins dynamically
    this.adaptSubObjectPins(getSubNode, target);

    // 5️⃣ Cache resolved object
    getSubNode._subCache = {};
    if(target && typeof target === 'object') {
      for(const k in target) getSubNode._subCache[k] = target[k];
    }

    getSubNode._needsRebuild = false;
    getSubNode._pinsBuilt = true;

    console.log('[ADAPT SUB OBJECT]', getSubNode.id, 'path:', path, 'target:', target);

    // 6️⃣ Optional: redraw node
    this.updateNodeDOM(getSubNode.id);
  }


  onPinsConnected(sourceNode, sourcePin, targetNode, targetPin) {

    // only react if target is GetSubObject-like node
    if(
      targetNode.title === 'Get Scene Object' ||
      targetNode.title === 'Get Sub Object'
    ) {
      this._adaptGetSubObjectOnConnect(
        targetNode,
        sourceNode,
        sourcePin
      );
    }
  }

  getPinValue(node, pinName) {
    const out = node.outputs?.find(p => p.name === pinName);
    return out?.value;
  }

  normalizePinType(type) {
    if(!type) return 'any';
    if(type === 'number') return 'value';
    return type;
  }

  updateSceneObjectPins(node, objectName) {
    const obj = (node.accessObject || []).find(o => o.name === objectName);
    if(!obj) return;
    // clear 
    node.outputs = [];
    // expose one-level properties
    // const props = ['name', 'position', 'rotation', 'scale'];
    node.exposeProps.forEach(p => {
      const value = this.getByPath(obj, p);
      if(value !== undefined) {
        const type =
          typeof value === 'number' ? 'number' :
            typeof value === 'string' ? 'string' :
              'object';
        node.outputs.push({name: p, type});
      }
    });
    // Refresh DOM
    this.updateNodeDOM(node.id);
  }

  _pinElement(pinSpec, isOutput, nodeId) {
    const pin = document.createElement('div');
    // CSS class with type
    // console.log('test pin :', pinSpec.name);
    if(pinSpec.name == 'position') {
      pin.className = `pin pin-${pinSpec.name}`;
    } else {
      pin.className = `pin pin-${pinSpec.type}`;
    }
    pin.dataset.pin = pinSpec.name;
    pin.dataset.type = pinSpec.type;
    pin.dataset.io = isOutput ? 'out' : 'in';
    pin.dataset.node = nodeId;

    // Dot (connect point)
    const dot = document.createElement('div');
    dot.className = 'dot';
    pin.appendChild(dot);

    // Pin Label
    const label = document.createElement('span');
    label.className = 'pin-label';
    label.textContent = pinSpec.name;
    pin.appendChild(label);

    // Connect events
    pin.addEventListener('mousedown', () =>
      this.startConnect(nodeId, pinSpec.name, pinSpec.type, isOutput)
    );

    pin.addEventListener('mouseup', () =>
      this.finishConnect(nodeId, pinSpec.name, pinSpec.type, isOutput)
    );

    return pin;
  }


  handleGetSubObject(node, path) {
    const objInput = node.inputs.find(i => i.name === 'object');
    if(!objInput || typeof objInput.value !== 'object') {
      node.outputs.length = 0;
      this.editor.draw();
      return;
    }

    const target = path
      .split('.')
      .filter(Boolean)
      .reduce((o, k) => (o && o[k] !== undefined ? o[k] : undefined), objInput.value);

    console.log('[PATH RESOLVE]', path, target);

    node.outputs.length = 0;

    if(target && typeof target === 'object') {
      Object.keys(target).forEach(k => {
        node.outputs.push({name: k, type: 'any'});
      });
    }

    this.editor.draw();
  }


  createNodeDOM(spec) {
    const el = document.createElement('div');

    if(spec.title == 'Fetch') {
      el.className = 'node ' + (spec.title.toLowerCase() || '');
    } else {
      el.className = 'node ' + (spec.category || '');
    }

    el.style.left = spec.x + 'px';
    el.style.top = spec.y + 'px';
    el.dataset.id = spec.id;

    // --- Header ---
    const header = document.createElement('div');
    header.className = 'header';
    header.textContent = spec.title;
    el.appendChild(header);

    // --- Body ---
    const body = document.createElement('div');
    body.className = 'body';

    // --- Pin row ---
    const row = document.createElement('div');
    row.className = 'pin-row';

    const left = document.createElement('div');
    left.className = 'pins-left';

    const right = document.createElement('div');
    right.className = 'pins-right';

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

    // ==================================================
    // 🔴 FIELD INPUTS (CORRECT PLACE)
    // ==================================================
    if(spec.fields?.length) {
      const fieldsWrap = document.createElement('div');
      fieldsWrap.className = 'node-fields';

      spec.fields.forEach(field => {
        // skip special cases handled elsewhere
        if(field.key === 'var') return;

        const input = this.createFieldInput(spec, field);

        if(field.key === 'objectPreview') {
          spec.objectPreviewEl = input;
        }

        fieldsWrap.appendChild(input);
      });

      body.appendChild(fieldsWrap);
    }

    // Value display
    if(spec.fields && spec.title === 'GenRandInt') {
      const container = document.createElement('div');
      container.className = 'genrand-inputs';

      spec.fields.forEach(f => {
        const input = document.createElement('input');
        input.type = 'number';
        input.value = f.value;
        input.style.width = '40px';
        input.style.marginRight = '4px';
        input.addEventListener('input', e => f.value = e.target.value);
        container.appendChild(input);

        const label = document.createElement('span');
        label.textContent = f.key;
        label.className = 'field-label';
        container.appendChild(label);
      });

      body.appendChild(container);
    } else if(spec.category === 'math' || spec.category === 'value' || spec.title === 'Print') {
      const display = document.createElement('div');
      display.className = 'value-display';
      display.textContent = '?';
      spec.displayEl = display;
      body.appendChild(display);
    }

    // Function Method Selector
    if(spec.title === 'Function' && spec.category === 'action' && !spec.builtIn && !spec.isVariableNode) {
      const select = document.createElement('select');
      select.className = 'method-select';
      select.style.cssText = 'width:100%; margin-top:6px;';

      body.appendChild(select);

      this.populateMethodsSelect(select);
      if(spec.attachedMethod) {
        select.value = spec.attachedMethod;
      }

      select.addEventListener('change', (e) => {
        const selected = this.methodsManager.methodsContainer.find(
          m => m.name === e.target.value
        );
        if(selected) {
          this.adaptNodeToMethod(spec, selected);
        }
      });
    }

    // Variable name input (temporary until popup)
    if(spec.fields?.some(f => f.key === 'var')) {
      const input = document.createElement('input');
      input.type = 'text';
      input.value = spec.fields.find(f => f.key === 'var')?.value ?? '';
      input.readOnly = true;

      input.style.width = '100%';
      input.style.marginTop = '6px';
      input.style.opacity = '0.7';
      input.style.cursor = 'default';

      body.appendChild(input);

    }


    if(spec.title === 'functions') {
      const select = document.createElement('select');
      select.style.width = '100%';
      select.style.marginTop = '6px';

      this.populateDynamicFunctionSelect(select, spec.accessObject);

      select.addEventListener('change', e => {
        const fnName = e.target.value;
        if(fnName) {
          this.adaptDynamicFunction(spec, fnName);
        }
      });

      body.appendChild(select);
    }

    if(spec.title === 'Get Scene Object' || spec.title === 'Get Scene Animation') {


      const select = document.createElement('select');
      select.style.width = '100%';
      select.style.marginTop = '6px';

      // Populate scene objects
      const objects = spec.accessObject || [];// window.app?.mainRenderBundle || [];
      const placeholder = document.createElement('option');
      placeholder.textContent = '-- Select Object --';
      placeholder.value = '';
      select.appendChild(placeholder);

      objects.forEach(obj => {
        const opt = document.createElement('option');
        opt.value = obj.name;
        opt.textContent = obj.name;
        select.appendChild(opt);
      });

      if(spec.fields[0].value) select.value = spec.fields[0].value;

      select.addEventListener('change', (e) => {
        const name = e.target.value;
        spec.fields[0].value = name;
        this.updateSceneObjectPins(spec, name);
      });
      el.appendChild(select);
    }



    el.appendChild(body);
    // --- Dragging ---
    header.addEventListener('mousedown', (e) => {
      e.preventDefault();
      this.state.draggingNode = el;
      const rect = el.getBoundingClientRect();
      const bx = this.board.getBoundingClientRect();
      this.state.dragOffset = [
        e.clientX - rect.left + bx.left,
        e.clientY - rect.top + bx.top
      ];
      document.body.style.cursor = 'grabbing';
    });
    // --- Selecting ---
    el.addEventListener('click', e => {
      e.stopPropagation();
      this.selectNode(spec.id);
    });

    return el;
  }


  selectNode(id) {
    if(this.state.selectedNode) {
      document.querySelector(`.node[data-id="${this.state.selectedNode}"]`)?.classList.remove('selected');
    }
    this.state.selectedNode = id;
    document.querySelector(`.node[data-id="${id}"]`)?.classList.add('selected');
  }

  populateDynamicFunctionSelect(select, accessObject) {
    select.innerHTML = '';

    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = '-- Select Function --';
    select.appendChild(placeholder);

    if(!accessObject || typeof accessObject !== 'object') return;

    for(const key in accessObject) {
      if(typeof accessObject[key] === 'function') {
        const opt = document.createElement('option');
        opt.value = key;
        opt.textContent = key;
        select.appendChild(opt);
      }
    }
  }

  updateFunctionPins(node, objectName, funcName) {
    const obj = this.resolveAccessObject(node.accessObject, objectName);
    if(!obj) {
      console.warn('Access object not found:', objectName);
      return;
    }

    const fn = obj[funcName];
    if(typeof fn !== 'function') {
      console.warn('Not a function:', funcName);
      return;
    }

    // reset exec pins
    node.inputs = [{name: 'exec', type: 'action'}];
    node.outputs = [{name: 'execOut', type: 'action'}];

    // args → inputs
    const args = this.getArgNames(fn);
    args.forEach(arg => {
      node.inputs.push({name: arg, type: 'value'});
    });

    // return → output
    if(this.hasReturn(fn)) {
      node.outputs.push({name: 'return', type: 'value'});
    }

    // store metadata only
    node._access = {
      objectName,
      methodName: funcName
    };

    node.category = 'functions';
    node.title = `${objectName}.${funcName}`;

    this.updateNodeDOM(node.id);
  }

  isTypeCompatible(fromType, toType) {
    if(fromType === 'action' || toType === 'action') {
      return fromType === toType;
    }
    if(fromType === toType) return true;
    if(fromType === 'any' || toType === 'any') return true;
    return false;
  }

  addNode(type, options = {}) {
    const id = 'node_' + (this.nodeCounter++);
    const x = Math.abs(this.state.pan[0]) + 100 + Math.random() * 200;
    const y = Math.abs(this.state.pan[1]) + 100 + Math.random() * 200;

    // Node factory map
    const nodeFactories = {
      'event': (id, x, y) => ({
        id, title: 'onLoad', x, y, category: 'event',
        inputs: [], outputs: [{name: 'exec', type: 'action'}]
      }),
      'function': (id, x, y) => ({
        id, title: 'Function', x, y, category: 'action',
        inputs: [{name: 'exec', type: 'action'}],
        outputs: [{name: 'execOut', type: 'action'}]
      }),
      'if': (id, x, y) => ({
        id, title: 'if', x, y, category: 'logic',
        inputs: [
          {name: 'exec', type: 'action'},
          {name: 'condition', type: 'boolean'}
        ],
        outputs: [
          {name: 'true', type: 'action'},
          {name: 'false', type: 'action'}
        ],
        fields: [
          {key: 'condition', value: true} // default literal for condition
        ]
      }),
      'genrand': (id, x, y) => ({
        id, title: 'GenRandInt', x, y, category: 'value',
        inputs: [], outputs: [{name: 'result', type: 'value'}],
        fields: [{key: 'min', value: '0'}, {key: 'max', value: '10'}]
      }),
      'print': (id, x, y) => ({
        id, title: 'Print', x, y,
        category: 'actionprint',
        inputs: [{name: 'exec', type: 'action'}, {name: 'value', type: 'any'}],
        outputs: [{name: 'execOut', type: 'action'}],
        fields: [{key: 'label', value: 'Result'}],
        builtIn: true
      }),
      'timeout': (id, x, y) => ({
        id, title: 'SetTimeout', x, y, category: 'timer',
        inputs: [{name: 'exec', type: 'action'}, {name: 'delay', type: 'value'}],
        outputs: [{name: 'execOut', type: 'action'}],
        fields: [{key: 'delay', value: '1000'}],
        builtIn: true
      }),
      // Math nodes
      'add': (id, x, y) => ({id, title: 'Add', x, y, category: 'math', inputs: [{name: 'a', type: 'value'}, {name: 'b', type: 'value'}], outputs: [{name: 'result', type: 'value'}]}),
      'sub': (id, x, y) => ({id, title: 'Sub', x, y, category: 'math', inputs: [{name: 'a', type: 'value'}, {name: 'b', type: 'value'}], outputs: [{name: 'result', type: 'value'}]}),
      'mul': (id, x, y) => ({id, title: 'Mul', x, y, category: 'math', inputs: [{name: 'a', type: 'value'}, {name: 'b', type: 'value'}], outputs: [{name: 'result', type: 'value'}]}),
      'div': (id, x, y) => ({id, title: 'Div', x, y, category: 'math', inputs: [{name: 'a', type: 'value'}, {name: 'b', type: 'value'}], outputs: [{name: 'result', type: 'value'}]}),
      'sin': (id, x, y) => ({id, title: 'Sin', x, y, category: 'math', inputs: [{name: 'a', type: 'value'}], outputs: [{name: 'result', type: 'value'}]}),
      'cos': (id, x, y) => ({id, title: 'Cos', x, y, category: 'math', inputs: [{name: 'a', type: 'value'}], outputs: [{name: 'result', type: 'value'}]}),
      'pi': (id, x, y) => ({id, title: 'Pi', x, y, category: 'math', inputs: [], outputs: [{name: 'result', type: 'value'}]}),
      // comparation nodes
      'greater': (id, x, y) => ({
        id, title: 'A > B', x, y, category: 'compare',
        inputs: [{name: 'A', type: 'number'}, {name: 'B', type: 'number'}],
        outputs: [{name: 'result', type: 'boolean'}]
      }),
      'less': (id, x, y) => ({
        id, title: 'A < B', x, y, category: 'compare',
        inputs: [{name: 'A', type: 'number'}, {name: 'B', type: 'number'}],
        outputs: [{name: 'result', type: 'boolean'}]
      }),
      'equal': (id, x, y) => ({
        id, title: 'A == B', x, y, category: 'compare',
        inputs: [{name: 'A', type: 'any'}, {name: 'B', type: 'any'}],
        outputs: [{name: 'result', type: 'boolean'}]
      }),
      'notequal': (id, x, y) => ({
        id, title: 'A != B', x, y, category: 'compare',
        inputs: [{name: 'A', type: 'any'}, {name: 'B', type: 'any'}],
        outputs: [{name: 'result', type: 'boolean'}]
      }),
      'greaterEqual': (id, x, y) => ({
        id, title: 'A >= B', x, y, category: 'compare',
        inputs: [{name: 'A', type: 'number'}, {name: 'B', type: 'number'}],
        outputs: [{name: 'result', type: 'boolean'}]
      }),
      'lessEqual': (id, x, y) => ({
        id, title: 'A <= B', x, y, category: 'compare',
        inputs: [{name: 'A', type: 'number'}, {name: 'B', type: 'number'}],
        outputs: [{name: 'result', type: 'boolean'}]
      }),
      'getNumber': (id, x, y) => ({
        id, title: 'Get Number', x, y,
        category: 'value',
        outputs: [{name: 'result', type: 'number'}],
        fields: [{key: 'var', value: ''}],
        isGetterNode: true
      }),
      'getBoolean': (id, x, y) => ({
        id, title: 'Get Boolean', x, y,
        category: 'value',
        outputs: [{name: 'result', type: 'boolean'}],
        fields: [{key: 'var', value: ''}],
        isGetterNode: true
      }),
      'getString': (id, x, y) => ({
        id, title: 'Get String', x, y,
        category: 'value',
        outputs: [{name: 'result', type: 'string'}],
        fields: [{key: 'var', value: ''}],
        isGetterNode: true
      }),

      'getObject': (id, x, y) => ({
        id,
        title: 'Get Object',
        x, y,
        category: 'value',
        outputs: [{name: 'result', type: 'object'}],
        fields: [{key: 'var', value: ''}],
        isGetterNode: true
      }),

      'setObject': (id, x, y) => ({
        id,
        title: 'Set Object',
        x, y,
        category: 'action',
        isVariableNode: true,
        inputs: [
          {name: 'exec', type: 'action'},
          {name: 'value', type: 'object'}
        ],
        outputs: [{name: 'execOut', type: 'action'}],
        fields: [
          {key: 'var', value: ''},
          {key: 'literal', value: {}}
        ]
      }),

      'setNumber': (id, x, y) => ({
        id, title: 'Set Number', x, y,
        category: 'action',
        isVariableNode: true,
        inputs: [
          {name: 'exec', type: 'action'},
          {name: 'value', type: 'number'}
        ],
        outputs: [{name: 'execOut', type: 'action'}],
        fields: [
          {key: 'var', value: ''},
          {key: 'literal', value: 0}
        ]
      }),
      'setBoolean': (id, x, y) => ({
        id, title: 'Set Boolean', x, y,
        category: 'action',
        isVariableNode: true,
        inputs: [
          {name: 'exec', type: 'action'},
          {name: 'value', type: 'boolean'}
        ],
        outputs: [{name: 'execOut', type: 'action'}],
        fields: [{key: 'var', value: ''}, {key: 'literal', value: false}]
      }),
      'setString': (id, x, y) => ({
        id, title: 'Set String', x, y,
        category: 'action',
        isVariableNode: true,
        inputs: [
          {name: 'exec', type: 'action'},
          {name: 'value', type: 'string'}
        ],
        outputs: [{name: 'execOut', type: 'action'}],
        fields: [{key: 'var', value: ''}, {key: 'literal', value: ''}]
      }),

      'comment': (id, x, y, comment = "Add comment") => ({
        id,
        title: comment, x, y,
        category: 'meta',
        inputs: [],
        outputs: [],
        comment: true,
        noExec: true
      }),
      // 'downloadMeshes': (id, x, y) => ({
      //   id, title: 'downloadMeshes',
      //   category: 'functions', x, y,
      //   builtIn: true,
      //   inputs: [
      //     {name: 'exec', type: 'action'},
      //     {name: 'name', type: 'value'},
      //     {name: 'path', type: 'value'},
      //   ],
      //   outputs: [
      //     {name: 'execOut', type: 'action'}
      //   ],  // generated dynamically
      //   noExec: false,
      // }),
      // full dinamic  functions taje ref from object (only funcs)
      'dynamicFunction': (id, x, y) => ({
        id,
        title: 'functions',
        x, y,
        category: 'action',
        inputs: [{name: 'exec', type: 'action'}],
        outputs: [{name: 'execOut', type: 'action'}],
        accessObject: window.app
      }),

      'getSceneObject': (id, x, y) => ({
        noExec: true,
        id, title: 'Get Scene Object', x, y,
        category: 'scene',
        inputs: [],
        outputs: [],
        fields: [{key: 'selectedObject', value: ''}],
        builtIn: true,
        accessObject: window.app?.mainRenderBundle,
        exposeProps: ['name', 'position', 'rotation', 'scale']
      }),

      'getObjectAnimation': (id, x, y) => ({
        noExec: true,
        id, title: 'Get Scene Animation', x, y,
        category: 'scene',
        inputs: [], // no inputs
        outputs: [], // will be filled dynamically
        fields: [{key: 'selectedObject', value: ''}],
        builtIn: true,
        accessObject: window.app?.mainRenderBundle, // direct man
        exposeProps: ['name', 'glb.glbJsonData.animations', 'glb.animationIndex']
      }),

      'getPosition': (id, x, y) => ({
        id, title: 'Get Position',
        category: 'scene',
        inputs: [{name: 'position', semantic: 'position'}],
        outputs: [
          {name: 'x', semantic: 'number'},
          {name: 'y', semantic: 'number'},
          {name: 'z', semantic: 'number'}
        ],
        noExec: true
      }),
      'setPosition': (id, x, y) => ({
        id, title: 'Set Position',
        category: 'scene',
        inputs: [
          {name: 'exec', type: 'action'},
          {name: 'position', semantic: 'position'},
          {name: 'x', semantic: 'number'},
          {name: 'y', semantic: 'number'},
          {name: 'z', semantic: 'number'}
        ],
        outputs: [{name: 'execOut', type: 'action'}],
      }),

      'translateByX': (id, x, y) => ({
        id, title: 'Translate By X',
        category: 'scene',
        inputs: [
          {name: 'exec', type: 'action'},
          {name: 'position', semantic: 'position'},
          {name: 'x', semantic: 'number'}
        ],
        outputs: [{name: 'execOut', type: 'action'}],
        builtIn: true
      }),
      'translateByY': (id, x, y) => ({
        id, title: 'Translate By Y',
        category: 'scene',
        inputs: [
          {name: 'exec', type: 'action'},
          {name: 'position', semantic: 'position'},
          {name: 'y', semantic: 'number'}
        ],
        outputs: [{name: 'execOut', type: 'action'}]
      }),

      'translateByZ': (id, x, y) => ({
        id, title: 'Translate By Z',
        category: 'scene',
        inputs: [
          {name: 'exec', type: 'action'},
          {name: 'position', semantic: 'position'},
          {name: 'z', semantic: 'number'}
        ],
        outputs: [{name: 'execOut', type: 'action'}]
      }),

      'onTargetPositionReach': (id, x, y) => ({
        id,
        title: 'On Target Position Reach',
        category: 'event',
        noExec: true,
        inputs: [
          {name: 'position', type: 'object'}
        ],
        outputs: [
          {name: 'exec', type: 'action'}
        ],
        _listenerAttached: false
      }),

      'fetch': (id, x, y) => ({
        id,
        title: 'Fetch',
        x, y,
        category: 'action',
        inputs: [
          {name: 'exec', type: 'action'},
          {name: 'url', type: 'string'},
          {name: 'method', type: 'string', default: 'GET'},
          {name: 'body', type: 'object'},
          {name: 'headers', type: 'object'}
        ],
        outputs: [
          {name: 'execOut', type: 'action'},
          {name: 'error', type: 'action'},
          {name: 'response', type: 'object'},
          {name: 'status', type: 'number'}
        ]
      }),

      'getSubObject': (id, x, y) => ({
        id,
        title: 'Get Sub Object',
        x, y,
        category: 'value',
        inputs: [
          {name: 'exec', type: 'action'},
          {name: 'object', type: 'object'}
        ],
        outputs: [
          {name: 'execOut', type: 'action'}
        ],
        fields: [
          {key: 'objectPreview', value: '', readonly: true},
          {key: 'path', value: '', placeholder: 'SomeProperty'}
        ],
        isDynamicNode: true,
        _needsRebuild: true,   // 👈 MUST be true initially
        _pinsBuilt: false
      })

    };


    // Generate node spec
    let spec = null;
    if(nodeFactories[type]) spec = nodeFactories[type](id, x, y);

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

  initEventNodes() {
    for(const nodeId in this.nodes) {
      const n = this.nodes[nodeId];
      if(n.category === 'event') {
        this.activateEventNode(nodeId);
      }
    }
  }

  // adaptSubObjectPins(node, obj) {
  //   if(!obj || typeof obj !== 'object') return;

  //   // Keep only action pins, remove old property pins
  //   node.outputs = node.outputs.filter(p => p.type === 'action');

  //   // Add pins for object keys
  //   for(const key of Object.keys(obj)) {
  //     node.outputs.push({
  //       name: key,
  //       type: this.detectType(obj[key])
  //     });
  //   }

  //   // Mark as pins built
  //   node._pinsBuilt = true;
  // }

  adaptSubObjectPins(node, obj) {
    // Keep only action pins
    node.outputs = node.outputs.filter(p => p.type === 'action');

    if(obj && typeof obj === 'object') {
      for(const key of Object.keys(obj)) {
        node.outputs.push({
          name: key,
          type: this.detectType(obj[key])
        });
      }
    }
    // No pins for primitive values (string/number/boolean)
  }



  detectType(val) {
    if(typeof val === 'number') return 'number';
    if(typeof val === 'boolean') return 'boolean';
    if(typeof val === 'string') return 'string';
    if(typeof val === 'object') return 'object';
    return 'any';
  }

  createFieldInput(node, field) {
    const input = document.createElement('input');
    input.type = 'text';
    input.value = field.value ?? '';
    input.placeholder = field.placeholder ?? '';
    input.disabled = field.readonly === true;

    if(field.readonly) {
      input.style.opacity = '0.7';
      input.style.cursor = 'default';
    }

    // 1️⃣ Define save function first
    const saveInputValue = () => {
      let val;

      if(field.type === 'object') {
        try {
          val = JSON.parse(input.value);
        } catch {
          return; // 🚫 invalid JSON → DO NOT overwrite
        }
      } else {
        val = input.value;
      }

      field.value = val;

      // existing logic stays
      if(node.isGetterNode && field.key === 'var') {
        this.notifyVariableChanged('object', val);
      }

      // ✅ DISPATCH (NEW)
      document.dispatchEvent(new CustomEvent('fluxcodex.field.change', {
        detail: {
          nodeId: node.id,
          nodeType: node.type,
          fieldKey: field.key,
          fieldType: field.type,
          value: field.value
        }
      }));
    };


    // 2️⃣ Now assign handlers
    input.onkeydown = e => {
      if(e.key === 'Enter') {
        e.preventDefault();
        saveInputValue();
      }
    };

    // console.log("TEST saveInputValue")
    input.onblur = () => saveInputValue();

    if(node.title === 'Get Sub Object' && field.key === 'path') {
      input.oninput = () => {
        const link = this.getConnectedSource(node.id, 'object');
        if(!link?.node?.isGetterNode) return;

        const varField = link.node.fields?.find(f => f.key === 'var');
        const varName = varField?.value;
        const rootObj = this.variables?.object?.[varName];

        const path = input.value;
        const target = this.resolvePath(rootObj, path);

        console.log('[PATH INPUT CHANGE]', node.id, 'path:', path, 'target:', target);

        // 🔹 1. Cache for pin creation
        node._subCache = {};
        // if(target && typeof target === 'object') {
        //   // store object keys
        //   for(const k in target) node._subCache[k] = target[k];
        // } else {
        //   // store primitive value under "value"
        //   node._subCache['value'] = target;
        // }

        // 🔥 DIRECTLY SAVE target
        node._subCache = target;

        // 🔹 2. Only rebuild pins if target is an object
        node.outputs = node.outputs.filter(p => p.type === 'action'); // clear old object pins
        if(target && typeof target === 'object') {
          for(const k in target) {
            node.outputs.push({
              name: k,
              type: this.detectType(target[k])
            });
          }
        }

        node._needsRebuild = false;
        node._pinsBuilt = true;

        this.updateNodeDOM(node.id); // refresh visuals
      };
    }





    return input;
  }


  resolvePath(obj, path) {
    if(!obj || !path) return obj; // if no path, return the root object

    const parts = path.split('.').filter(p => p.length);
    let current = obj;

    for(const part of parts) {
      if(current && typeof current === 'object' && part in current) {
        current = current[part];
      } else {
        return undefined; // path not found
      }
    }
    return current;
  }


  resolveAccessObject(accessObject, objectName) {
    if(!accessObject) return null;
    // case 1: array [{name, ...}]
    if(Array.isArray(accessObject)) {
      return accessObject.find(o => o.name === objectName) || null;
    }
    // case 2: dictionary {player: obj}
    if(typeof accessObject === 'object') {
      return accessObject[objectName] || null;
    }
    return null;
  }

  adaptNodeToAccessMethod(node, objectName, methodName) {
    const obj = this.accessObject.find(o => o.name === objectName);
    if(!obj) return;

    const method = obj[methodName];
    if(typeof method !== 'function') return;

    const args = this.getArgNames(method);

    node.inputs = [{name: 'exec', type: 'action'}];
    node.outputs = [{name: 'execOut', type: 'action'}];

    args.forEach(arg =>
      node.inputs.push({name: arg, type: 'value'})
    );

    if(this.hasReturn(method)) {
      node.outputs.push({name: 'return', type: 'value'});
    }

    node._access = {
      objectName,
      methodName
    };

    this.updateNodeDOM(node.id);
  }


  activateEventNode(nodeId) {
    console.log('activateEventNode ????')
    const n = this.nodes[nodeId];
    // if(n._listenerAttached) return;
    // console.log('activateEventNode 1????')
    if(n.title === 'On Target Position Reach') {
      const pos = this.getValue(nodeId, 'position');
      if(!pos) return;
      pos.onTargetPositionReach = () => {
        console.log('real onTargetPositionReach called')
        this.enqueueOutputs(n, 'exec');
      };
      n._listenerAttached = true;
    }
  }

  _executeAttachedMethod(n) {
    if(n.attachedMethod) {
      const method = this.methodsManager.methodsContainer.find(m => m.name === n.attachedMethod);
      if(method) {
        const fn = this.methodsManager.compileFunction(method.code);
        const args = this.getArgNames(fn).map(argName => this.getValue(n.id, argName));
        let result;
        try {result = fn(...args);} catch(err) {console.error("User method error:", err);}
        if(this.hasReturn(fn)) n._returnCache = result;
      }
    }
  }

  getValue(nodeId, pinName, visited = new Set()) {
    const node = this.nodes[nodeId];
    if(!node || visited.has(nodeId)) return undefined;
    visited.add(nodeId);

    // Block IF condition evaluation outside exec
    if(node.title === 'if' && pinName === 'condition' && this._execContext !== nodeId) {
      console.warn(`[GET] Blocked IF condition outside exec for node ${nodeId}`);
      return undefined;
    }


    // 1️⃣ Literal field
    const field = node.fields?.find(f => f.key === pinName);
    if(field) return field.value;

    // 2️⃣ Linked input pin
    const link = this.links.find(l => l.to.node === nodeId && l.to.pin === pinName);
    if(link) return this.getValue(link.from.node, link.from.pin, visited);

    // 3️⃣ Default input pin
    const inputPin = node.inputs?.find(p => p.name === pinName);
    if(inputPin) return inputPin.default ?? 0;

    if(node.title === 'Get Scene Object' || node.title === 'Get Scene Animation') {
      // direct reference to real object must be migrated to factory 
      // to make it reusable for any other priject
      console.log('FUNC getValue , ' + 'node.title :' + node.title + ',' + this.nodes[nodeId]._returnCache);
      const objName = node.fields[0].value;
      console.log(' objName is n.fields[0].value = ' + node.fields[0].value)
      const obj = (node.accessObject || []).find(o => o.name === objName);
      if(!obj) return undefined;
      const out = node.outputs.find(o => o.name === pinName);
      if(!out) return undefined;
      return obj[pinName]; // simple one-level property access
    } else if(node.title === 'Get Position') {
      const pos = this.getValue(nodeId, 'position');
      if(!pos) return undefined;

      node._returnCache = {
        x: pos.x,
        y: pos.y,
        z: pos.z
      };

      return node._returnCache[pinName];
    } else if(node.title === 'Get Sub Object') {
 return node._subCache; // simple, raw value

    }


    // 4️⃣ Dynamic output (computed node)
    if(node.outputs?.some(o => o.name === pinName)) {
      const dynamicNodes = ['GenRandInt', 'RandomFloat'];
      if(node._returnCache === undefined || dynamicNodes.includes(node.title)) {
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

    if(node.title === 'Print') {
      // assume first input pin is the value to print
      const pin = node.inputs?.[0];
      if(!pin) continue;

      const val = this.getValue(node.id, pin.name);
      if(val === undefined) {
        node.displayEl.textContent = 'undefined';
      } else if(typeof val === 'object') {
        node.displayEl.textContent = JSON.stringify(val, null, 2);
      } else if(typeof val === 'number') {
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

    return match[1]
      .split(',')
      .map(a => a.trim())
      .filter(Boolean);
  }

  adaptDynamicFunction(node, fnName) {
    const fn = node.accessObject?.[fnName];
    if(typeof fn !== 'function') return;

    // reset pins (KEEP exec)
    node.inputs = [{name: 'exec', type: 'action'}];
    node.outputs = [{name: 'execOut', type: 'action'}];

    // args → inputs
    const args = this.getArgNames(fn);
    args.forEach(arg => {
      node.inputs.push({name: arg, type: 'value'});
    });

    // return → output
    if(this.hasReturn(fn)) {
      node.outputs.push({name: 'return', type: 'value'});
    }

    node.category = 'functions';
    node.fn = fn;               // REAL FUNCTION
    node.fnName = fnName;
    node.title = fnName;        // show function name on node

    this.updateNodeDOM(node.id);
  }


  invalidateVariableGetters(type, varName) {
    for(const id in this.nodes) {
      const n = this.nodes[id];
      if(
        n.category === 'value' &&
        n.fields?.some(f => f.key === 'var' && f.value === varName) &&
        n.title === `Get ${type[0].toUpperCase() + type.slice(1)}`
      ) {
        delete n._returnCache;
      }
    }
  }

  triggerNode(nodeId) {
    const n = this.nodes[nodeId];
    if(!n) return;
    this._execContext = nodeId;

    // Highlight node header
    const highlight = document.querySelector(`.node[data-id="${nodeId}"] .header`);
    if(highlight) {
      highlight.style.filter = 'brightness(1.5)';
      setTimeout(() => highlight.style.filter = 'none', 200);
    }

    if(n.title === 'Get Sub Object') {
      const obj = this.getValue(n.id, 'object'); // root object
      const path = n.fields.find(f => f.key === 'path')?.value;
      const target = this.resolvePath(obj, path);

      // always store something in _subCache
      n._subCache = {};

      if(target && typeof target === 'object') {
        for(const k in target) n._subCache[k] = target[k];
      } else {
        n._subCache['value'] = target; // primitive stored here
      }

      // rebuild output pins only if object
      n.outputs = n.outputs.filter(p => p.type === 'action'); // clear old
      if(target && typeof target === 'object') {
        for(const k in target) {
          n.outputs.push({
            name: k,
            type: this.detectType(target[k])
          });
        }
      }

      n._needsRebuild = false;
      n._pinsBuilt = true;

      this.enqueueOutputs(n, 'execOut');
      return;
    }



    if(n.isGetterNode) {
      const varField = n.fields?.find(f => f.key === 'var');
      if(varField && varField.value) {
        const type = n.title.replace('Get ', '').toLowerCase(); // number / boolean / string / object
        const value = this.getVariable(type, varField.value);

        n._returnCache = value;

        // Update visual label if exists
        if(n.displayEl) {
          if(type === 'object') {
            n.displayEl.textContent =
              value !== undefined ? JSON.stringify(value) : '{}';
          } else if(typeof value === 'number') {
            n.displayEl.textContent = value.toFixed(3);
          } else {
            n.displayEl.textContent = String(value);
          }
        }
      }

      n.finished = true;
      return;
    }



    if(n.title === 'On Target Position Reach') {
      console.log('TEST TEST On Target Position Reach ', pos);
      // if(n._listenerAttached) return;

      const pos = this.getValue(nodeId, 'position');
      if(!pos) return;

      // 🔥 subscribe to position updates
      // Attach listener (engine-agnostic)
      console.log('TEST TEST ', pos);
      pos.onTargetPositionReach = () => {

        this.triggerNode(n) // NO HELP
        this.enqueueOutputs(n, 'exec');

        alert(' TARGET REACh ')
      };

      n._listenerAttached = true;
      return;
    }


    // --- functionDinamic execution ---
    if(n.category === 'functions' && n.fn) {
      const args = n.inputs
        .filter(p => p.type !== 'action')
        .map(p => this.getValue(n.id, p.name));

      const result = n.fn(...args);

      if(this.hasReturn(n.fn)) {
        n._returnCache = result;
      }

      this.enqueueOutputs(n, 'execOut');
      return;
    }

    if(n.category === 'event') {
      this.enqueueOutputs(n, 'exec');
      return;
    }

    if(n.isVariableNode) {
      const type = n.title.replace('Set ', '').toLowerCase();
      const varField = n.fields?.find(f => f.key === 'var');

      if(varField && varField.value) {
        const value = this.getValue(nodeId, 'value');
        this.variables[type][varField.value] = {value};

        this.notifyVariableChanged(type, varField.value);

        // Update matching getter nodes instantly
        for(const nodeId2 in this.nodes) {
          const node2 = this.nodes[nodeId2];
          if(node2.isGetterNode) {
            const vf2 = node2.fields?.find(f => f.key === 'var');
            if(vf2 && vf2.value === varField.value && node2.displayEl) {

              if(type === 'object') {
                node2.displayEl.textContent = JSON.stringify(value);
              } else {
                node2.displayEl.textContent =
                  typeof value === 'number'
                    ? value.toFixed(3)
                    : String(value);
              }

              node2._returnCache = value;
            }
          }
        }
      }

      n.finished = true;
      this.enqueueOutputs(n, 'execOut');
      return;
    }

    if(n.title === 'Fetch') {
      const url = this.getValue(nodeId, 'url');
      if(!url) {
        console.warn('[Fetch] URL missing');
        this.enqueueOutputs(n, 'error');
        return;
      }

      const method = this.getValue(nodeId, 'method') || 'GET';
      const body = this.getValue(nodeId, 'body');
      const headers = this.getValue(nodeId, 'headers') || {};

      const options = {
        method,
        headers
      };

      if(body && method !== 'GET') {
        options.body =
          typeof body === 'string' ? body : JSON.stringify(body);

        if(!headers['Content-Type']) {
          headers['Content-Type'] = 'application/json';
        }
      }

      fetch(url, options)
        .then(async res => {
          n._returnCache = {
            response: await res.json().catch(() => null),
            status: res.status
          };

          this.enqueueOutputs(n, 'execOut');
        })
        .catch(err => {
          console.error('[Fetch]', err);
          this.enqueueOutputs(n, 'error');
        });

      return;
    }



    // -----------------------------
    // Action / Print / Timer Nodes
    // -----------------------------
    if(['action', 'actionprint', 'timer'].includes(n.category)) {
      if(n.attachedMethod) this._executeAttachedMethod(n);

      if(n.title === 'Print') {
        const label = n.fields?.find(f => f.key === 'label')?.value || 'Print:';
        let val;

        const link = this.getConnectedSource(nodeId, 'value');
        if(link) {
          const fromNode = link.node;
          const fromPin = link.pin;

          // ✅ Check _subCache first (for Get Sub Object)
          if(fromNode._subCache && fromPin in fromNode._subCache) {
            val = fromNode._subCache[fromPin];
          }
          // ✅ Otherwise fallback to normal getValue
          else {
            val = this.getValue(fromNode.id, fromPin);
          }
        } else {
          val = this.getValue(nodeId, 'value');
        }

        if(n.displayEl) {
          if(typeof val === 'object') {
            n.displayEl.textContent = JSON.stringify(val);
          } else if(typeof val === 'number') {
            n.displayEl.textContent = val.toFixed(3);
          } else {
            n.displayEl.textContent = String(val);
          }
        }

        console.log(`[Print] ${label}`, val);
        this.log(`> ${label}`, val);
      }


      else if(n.title === 'SetTimeout') {
        const delay = +n.fields?.find(f => f.key === 'delay')?.value || 1000;
        setTimeout(() => this.enqueueOutputs(n, 'execOut'), delay);
        return;
      }

      this.enqueueOutputs(n, 'execOut');
      return;
    }

    // -----------------------------
    // IF Node
    // -----------------------------
    if(n.category === 'logic' && n.title === 'if') {
      const condition = Boolean(this.getValue(nodeId, 'condition'));
      this.enqueueOutputs(n, condition ? 'true' : 'false');
      this._execContext = null;
      return;
    }

    if(n.title === 'Set Position') {
      const pos = this.getValue(nodeId, 'position');
      if(pos?.setPosition) {
        pos.setPosition(
          this.getValue(nodeId, 'x'),
          this.getValue(nodeId, 'y'),
          this.getValue(nodeId, 'z')
        );
      }
      this.enqueueOutputs(n, 'execOut');
      return;
    } else if(n.title === 'Translate By X') {
      const pos = this.getValue(nodeId, 'position');
      if(pos?.translateByX) {
        pos.translateByX(this.getValue(nodeId, 'x'));
      }
      this.enqueueOutputs(n, 'execOut');
      return;
    } else if(n.title === 'Translate By Y') {
      const pos = this.getValue(nodeId, 'position');
      if(pos?.translateByY) {
        pos.translateByX(this.getValue(nodeId, 'y'));
      }
      this.enqueueOutputs(n, 'execOut');
      return;
    } else if(n.title === 'Translate By Z') {
      const pos = this.getValue(nodeId, 'position');
      if(pos?.translateByZ) {
        pos.translateByX(this.getValue(nodeId, 'z'));
      }
      this.enqueueOutputs(n, 'execOut');
      return;
    }

    // -----------------------------
    // Math / Value / Compare Nodes
    // -----------------------------
    if(['math', 'value', 'compare'].includes(n.category)) {
      let result;

      switch(n.title) {
        case 'Add': result = this.getValue(nodeId, 'a') + this.getValue(nodeId, 'b'); break;
        case 'Sub': result = this.getValue(nodeId, 'a') - this.getValue(nodeId, 'b'); break;
        case 'Mul': result = this.getValue(nodeId, 'a') * this.getValue(nodeId, 'b'); break;
        case 'Div': result = this.getValue(nodeId, 'a') / this.getValue(nodeId, 'b'); break;
        case 'Sin': result = Math.sin(this.getValue(nodeId, 'a')); break;
        case 'Cos': result = Math.cos(this.getValue(nodeId, 'a')); break;
        case 'Pi': result = Math.PI; break;
        case 'A > B': result = this.getValue(nodeId, 'A') > this.getValue(nodeId, 'B'); break;
        case 'A < B': result = this.getValue(nodeId, 'A') < this.getValue(nodeId, 'B'); break;
        case 'A == B': result = this.getValue(nodeId, 'A') == this.getValue(nodeId, 'B'); break;
        case 'A != B': result = this.getValue(nodeId, 'A') != this.getValue(nodeId, 'B'); break;
        case 'A >= B': result = this.getValue(nodeId, 'A') >= this.getValue(nodeId, 'B'); break;
        case 'A <= B': result = this.getValue(nodeId, 'A') <= this.getValue(nodeId, 'B'); break;
        case 'GenRandInt':
          const min = +n.fields?.find(f => f.key === 'min')?.value || 0;
          const max = +n.fields?.find(f => f.key === 'max')?.value || 10;
          result = Math.floor(Math.random() * (max - min + 1)) + min;
          break;
        default:
          result = undefined;
      }

      n._returnCache = result;
      if(n.displayEl) n.displayEl.textContent =
        typeof result === 'number' ? result.toFixed(3) : String(result);
    }



    this._execContext = null;
  }

  getConnectedSource(nodeId, inputName) {
    const link = this.links.find(l => l.to.node === nodeId && l.to.pin === inputName);
    if(!link) return null;
    return {
      node: this.nodes[link.from.node],
      pin: link.from.pin
    };
  }

  populateAccessMethods(select) {
    select.innerHTML = '';
    this.accessObject.forEach(obj => {
      Object.getOwnPropertyNames(obj.__proto__)
        .filter(k => typeof obj[k] === 'function' && k !== 'constructor')
        .forEach(fn => {
          const opt = document.createElement('option');
          opt.value = `${obj.name}.${fn}`;
          opt.textContent = `${obj.name}.${fn}`;
          select.appendChild(opt);
        });
    });

    select.onchange = e => {
      const [objName, fnName] = e.target.value.split('.');
      this.adaptNodeToAccessMethod(node, objName, fnName);
    };
  }


  getByPath(obj, path) {
    return path.split('.').reduce((acc, key) => acc?.[key], obj);
  }


  getVariable(type, key) {
    if(!this.variables[type][key]) return undefined;
    return this.variables[type][key].value;
  }

  enqueueOutputs(n, pinName) {
    this.links.filter(l => l.from.node === n.id && l.from.pin === pinName && l.type === 'action')
      .forEach(l => setTimeout(() => this.triggerNode(l.to.node), 10));
  }

  deleteNode(nodeId) {
    const node = this.nodes[nodeId];
    if(!node) return;

    // 1) Remove links related to this node
    this.links = this.links.filter(link => {

      // link.from = { node, pin }
      // link.to   = { node, pin }

      if(link.from.node === nodeId || link.to.node === nodeId) {

        // Also remove DOM SVG line
        const dom = document.getElementById(link.id);
        if(dom) dom.remove();

        return false; // remove from array
      }
      return true;
    });

    // 2) Remove the node DOM itself
    const dom = this.board.querySelector(`[data-id="${nodeId}"]`);
    if(dom) dom.remove();

    // 3) Remove from internal registry
    delete this.nodes[nodeId];

    // 4) Update UI
    this.updateLinks();
  }

  bindGlobalListeners() {
    document.addEventListener('mousemove', this.handleMouseMove.bind(this));
    document.addEventListener('mouseup', this.handleMouseUp.bind(this));
    this.boardWrap.addEventListener('mousedown', this.handleBoardWrapMouseDown.bind(this));

    this.board.addEventListener('click', () => {
      byId('app').style.opacity = 1;
    })
  }

  handleMouseMove(e) {
    if(this.state.draggingNode) {
      const el = this.state.draggingNode;
      const newX = e.clientX - this.state.dragOffset[0];
      const newY = e.clientY - this.state.dragOffset[1];
      el.style.left = newX + 'px'; el.style.top = newY + 'px';
      const id = el.dataset.id; if(this.nodes[id]) {this.nodes[id].x = newX; this.nodes[id].y = newY;}
      this.updateLinks();
    } else if(this.state.panning) {
      const dx = e.clientX - this.state.panStart[0], dy = e.clientY - this.state.panStart[1];
      this.state.pan[0] += dx; this.state.pan[1] += dy;
      this.board.style.transform = `translate(${this.state.pan[0]}px,${this.state.pan[1]}px)`;
      this.state.panStart = [e.clientX, e.clientY];
      this.updateLinks();
    }
  }

  handleMouseUp() {
    if(this.state.draggingNode) setTimeout(() => this.updateValueDisplays(), 0);
    this.state.draggingNode = null; this.state.panning = false;
    document.body.style.cursor = 'default';
  }

  handleBoardWrapMouseDown(e) {
    if(!e.target.closest('.node')) {
      this.state.panning = true;
      this.state.panStart = [e.clientX, e.clientY];
      document.body.style.cursor = 'grabbing';
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
      const fRect = fromDot.getBoundingClientRect(), tRect = toDot.getBoundingClientRect();
      const x1 = (fRect.left - bRect.left) + 6, y1 = (fRect.top - bRect.top) + 6;
      const x2 = (tRect.left - bRect.left) + 6, y2 = (tRect.top - bRect.top) + 6;
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('class', 'link ' + (l.type === 'value' ? 'value' : ''));
      path.setAttribute('d', `M${x1},${y1} C${x1 + 50},${y1} ${x2 - 50},${y2} ${x2},${y2}`);
      this.svg.appendChild(path);
    });
  }

  runGraph() {
    byId('app').style.opacity = 0.4;
    this.updateValueDisplays();
    this.initEventNodes();
    Object.values(this.nodes).forEach(n => n._returnCache = undefined);
    Object.values(this.nodes).filter(n => n.category === 'event' && n.title === 'onLoad').forEach(n => this.triggerNode(n.id));
  }

  compileGraph() {
    const bundle = {
      nodes: this.nodes,
      links: this.links,
      nodeCounter: this.nodeCounter,
      linkCounter: this.linkCounter,
      pan: this.state.pan,
      variables: this.variables
    };
    localStorage.setItem(FluxCodexVertex.SAVE_KEY, JSON.stringify(bundle));
    this.log('Graph saved to LocalStorage!');
  }

  clearStorage() {localStorage.removeItem(FluxCodexVertex.SAVE_KEY); this.log('Save cleared. Refresh to reset.');}

  clearAllNodes() {
    // Remove node DOMs
    this.board.querySelectorAll('.node').forEach(n => n.remove());

    // Clear data
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
      version: 1
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
      string: {}
    };

    // refresh UI
    this._refreshVarsList(this._varsPopup.children[1]);
    this.loadFromImport();

    this.log('Graph imported from JSON');
  }

  exportToJSON() {
    const bundle = this._buildSaveBundle();
    const json = JSON.stringify(bundle, null, 2);

    const blob = new Blob([json], {type: 'application/json'});
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'fluxcodex-graph.json';
    a.click();

    URL.revokeObjectURL(url);

    this.log('Graph exported as JSON');
  }

  _createImportInput() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.style.display = 'none';

    input.onchange = (e) => {
      const file = e.target.files[0];
      if(!file) return;

      const reader = new FileReader();
      reader.onload = () => {
        try {
          const data = JSON.parse(reader.result);
          this._loadFromBundle(data);
        } catch(err) {
          console.error('Invalid JSON file', err);
        }
      };
      reader.readAsText(file);
    };

    document.body.appendChild(input);
    this._importInput = input;
  }

  init() {
    const saved = localStorage.getItem(FluxCodexVertex.SAVE_KEY);
    if(saved) {
      try {
        const data = JSON.parse(saved);
        console.log('data.variables', data.variables)
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

          if((spec.category === 'value' && spec.title !== 'GenRandInt') || spec.category === 'math' || spec.title === 'Print') {
            spec.displayEl = domEl.querySelector('.value-display');
          }

          // Only function nodes get dynamic pins updated
          if(spec.category === 'action' && spec.title === 'Function') {
            this.updateNodeDOM(spec.id);
          }
        });
        this.updateLinks(); this.updateValueDisplays(); this.log('Restored graph.'); return;
      } catch(e) {console.error("Failed to load graph from storage:", e);}
    }
    this.addNode('event');
  }

  loadFromImport() {
    Object.values(this.nodes).forEach(spec => {
      const domEl = this.createNodeDOM(spec);
      this.board.appendChild(domEl);

      if((spec.category === 'value' && spec.title !== 'GenRandInt') || spec.category === 'math' || spec.title === 'Print') {
        spec.displayEl = domEl.querySelector('.value-display');
      }

      // Only function nodes get dynamic pins updated
      if(spec.category === 'action' && spec.title === 'Function') {
        this.updateNodeDOM(spec.id);
      }
    });
    this.updateLinks(); this.updateValueDisplays(); this.log('Restored graph.');

    this.compileGraph();
    return;
  }
}

FluxCodexVertex.SAVE_KEY = 'matrixEngineVisualScripting';
