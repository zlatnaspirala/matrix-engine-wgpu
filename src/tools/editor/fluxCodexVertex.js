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

import {byId} from "../../engine/utils";

export default class FluxCodexVertex {
  constructor(boardId, boardWrapId, logId, methodsManager) {
    this.debugMode = true;

    this.methodsManager = methodsManager;
    this.variables = {
      number: {},
      boolean: {},
      string: {}
    };

    const PIN_COLORS = {
      position: '#3b82f6',   // blue
      rotation: '#a855f7',   // purple
      scale: '#22c55e',      // green
      vector: '#06b6d4',     // cyan (x,y,z)
      number: '#facc15',     // yellow
      exec: '#ffffff'
    };
    
    // --- DOM Elements ---
    this.board = document.getElementById(boardId);
    this.boardWrap = document.getElementById(boardWrapId);
    this.svg = this.board.querySelector('svg.connections');
    this.logEl = document.getElementById(logId);

    // --- Data Model ---
    this.nodes = {};
    this.links = [];
    this.nodeCounter = 1;
    this.linkCounter = 1;

    this._execContext = null;

    // --- State Management ---
    this.state = {
      draggingNode: null,
      dragOffset: [0, 0], // [x, y]
      connecting: null, // {node, pin, type, out}
      selectedNode: null,
      pan: [0, 0], // [x, y]
      panning: false,
      panStart: [0, 0] // [x, y]
    };

    // Bind event listeners
    this.createVariablesPopup();
    this._createImportInput();
    this.bindGlobalListeners();


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

    })
  }

  // ====================================================================
  // 1. UTILITY & DEBUGGING
  // ====================================================================
  log(...args) {
    this.logEl.textContent = args.join(' ');
  }

  createGetNumberNode(varName) {
    return this.addNode('getNumber', {var: varName});
  }

  createGetBooleanNode(varName) {
    return this.addNode('getBoolean', {var: varName});
  }

  createGetStringNode(varName) {
    return this.addNode('getString', {var: varName});
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

  evaluateGetterNode(n) {
    const key = n.fields?.find(f => f.key === 'var')?.value;

    if(n.title === 'Get Number') {
      n._returnCache = this.variables.number[key]?.value ?? 0;
    }

    if(n.title === 'Get Boolean') {
      n._returnCache = this.variables.boolean[key]?.value ?? false;
    }

    if(n.title === 'Get String') {
      n._returnCache = this.variables.string[key]?.value ?? '';
    }
  }

  notifyVariableChanged(type, key) {
    for(const id in this.nodes) {
      const n = this.nodes[id];

      if(!n.fields) continue;
      if(!n.title.startsWith('Get')) continue;

      const varField = n.fields.find(f => f.key === 'var');
      if(!varField || varField.value !== key) continue;

      // type guard
      if(
        (type === 'number' && n.title !== 'Get Number') ||
        (type === 'boolean' && n.title !== 'Get Boolean') ||
        (type === 'string' && n.title !== 'Get String')
      ) continue;

      // recompute getter value
      this.evaluateGetterNode(n);

      // update UI
      if(n.displayEl) {
        n.displayEl.textContent = n._returnCache;
      }
    }
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
      width: '30%',
      height: '50%',
      overflow: 'scroll',
      background: '#111',
      border: '1px solid #444',
      borderRadius: '8px',
      padding: '10px',
      zIndex: 9999,
      color: '#eee',
      overflowX: 'hidden'
    });
    /* ---------- HEADER ---------- */
    const title = document.createElement('div');
    title.innerHTML = `Variables`;
    title.style.marginBottom = '8px';
    title.style.fontWeight = 'bold';
    popup.appendChild(title);


    /* ---------- LIST ---------- */
    const list = document.createElement('div');
    list.id = 'varslist'
    popup.appendChild(list);

    /* ---------- CREATE BUTTONS ---------- */
    const btns = document.createElement('div');
    btns.style.marginTop = '10px';
    btns.style.display = 'flex';
    btns.style.gap = '6px';

    btns.append(
      this._createVarBtn('Number', 'number'),
      this._createVarBtn('Boolean', 'boolean'),
      this._createVarBtn('String', 'string')
    );

    popup.appendChild(btns);

    const hideVPopup = document.createElement('button');
    hideVPopup.innerText = `Hide`;
    hideVPopup.style.margin = '18px 18px 18px 18px';
    // hideVPopup.style.padding = '8px 8px 8px 8px';
    hideVPopup.style.fontWeight = 'bold';
    hideVPopup.style.height = '4%';
    hideVPopup.style.webkitTextStrokeWidth = '0px';
    hideVPopup.addEventListener('click', () => {
      byId('varsPopup').style.display = 'none';
    })
    popup.appendChild(hideVPopup);

    document.body.appendChild(popup);
    // byId('app').appendChild(popup);

    this.makePopupDraggable(popup);

    this._refreshVarsList(list);
  }

  _refreshVarsList(container) {
    container.innerHTML = '';

    const colors = {
      number: '#4fc3f7',
      boolean: '#aed581',
      string: '#ffb74d'
    };

    for(const type in this.variables) {
      for(const name in this.variables[type]) {
        const row = document.createElement('div');

        Object.assign(row.style, {
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px',
          cursor: 'pointer',
          borderBottom: '1px solid #222',
          color: colors[type],
          webkitTextStrokeWidth: '0px'
        });

        /* label */
        const label = document.createElement('span');
        label.textContent = `${name} (${type})`;

        /* value input */
        const input = document.createElement('input');
        input.value = this.variables[type][name].value ?? '';
        input.style.width = '60px';
        input.style.background = '#000';
        input.style.color = '#fff';
        input.style.border = '1px solid #333';

        input.oninput = e => {
          this.variables[type][name].value =
            type === 'number' ? Number(e.target.value) :
              type === 'boolean' ? e.target.value === 'true' :
                e.target.value;
        };

        // /* CLICK → create getter node */
        // row.onclick = () => {
        //   if(type === 'number') {
        //     this.createGetNumberNode(name);
        //   }
        //   // boolean/string later
        // };

        const propagate = document.createElement('button');
        propagate.innerText = `Get ${name}`;
        /* CLICK → create getter node */
        propagate.onclick = () => {
          if(type === 'number') {
            this.createGetNumberNode(name);
          } else if(type === 'boolean') {
            this.createGetBooleanNode(name);
          } else if(type === 'string') {
            this.createSetStringNode(name);
          }
          // boolean/string later
        };

        const propagateSet = document.createElement('button');
        propagateSet.innerText = `Set ${name}`;
        /* CLICK → create getter node */
        propagateSet.onclick = () => {
          if(type === 'number') {
            this.createSetNumberNode(name);
          } else if(type === 'boolean') {
            this.createSetBooleanNode(name);
          } else if(type === 'string') {
            this.createSetStringNode(name);
          }
          // boolean/string later
        };

        row.append(label, input, propagate, propagateSet);
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
    btn.classList.add('btn')
    btn.onclick = () => {
      const name = prompt(`New ${type} variable name`);
      if(!name) return;

      if(this.variables[type][name]) {
        alert('Variable exists');
        return;
      }

      this.variables[type][name] = {
        value: type === 'number' ? 0 :
          type === 'boolean' ? false : ''
      };

      this._refreshVarsList(this._varsPopup.children[1]);
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
  // --------------------------------------------------------------------
  // Dynamic Method Helpers
  // --------------------------------------------------------------------
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

    node.attachedMethod = methodItem.name;
    node.fn = fn;

    // 🔹 Refresh the DOM so new pins are clickable
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

    // --- Method select (only for Function nodes) ---
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

  // ====================================================================
  // 2. NODE/PIN CREATION (DOM)
  // ====================================================================

  // ------------------------- CONNECTION HANDLERS -------------------------
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
  }

  normalizePinType(type) {
    if(!type) return 'any';
    if(type === 'number') return 'value';
    return type;
  }

  updateSceneObjectPins(node, objectName) {
    // node.outputs = [{name: 'execOut', type: 'action'}]; // optional exec if needed

    const obj = (window.app?.mainRenderBundle || []).find(o => o.name === objectName);
    if(!obj) return;

    // expose one-level properties
    const props = ['name', 'position', 'rotation', 'scale'];
    props.forEach(p => {
      if(obj[p] !== undefined) {
        const type = typeof obj[p] === 'number' ? 'number' :
          typeof obj[p] === 'string' ? 'string' : 'object';
        node.outputs.push({name: p, type});
      }
    });

    // Refresh DOM
    this.updateNodeDOM(node.id);
  }



  _pinElement(pinSpec, isOutput, nodeId) {
    const pin = document.createElement('div');

    // CSS class with type
    pin.className = `pin pin-${pinSpec.type}`;
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

  createNodeDOM(spec) {
    const el = document.createElement('div');
    el.className = 'node ' + (spec.category || '');
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

    // --- Value display ---
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
    }
    else if(spec.category === 'math' || spec.category === 'value' || spec.title === 'Print') {
      const display = document.createElement('div');
      display.className = 'value-display';
      display.textContent = '?';
      spec.displayEl = display;
      body.appendChild(display);
    }

    // --- Function Method Selector ---
    if(spec.category === 'action' && !spec.builtIn && !spec.isVariableNode) {
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


    if(spec.title === 'Get Scene Object') {
      const select = document.createElement('select');
      select.style.width = '100%';
      select.style.marginTop = '6px';

      // Populate scene objects
      const objects = window.app?.mainRenderBundle || [];
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

      'getSceneObject': (id, x, y) => ({
        noExec: true,
        id, title: 'Get Scene Object', x, y,
        category: 'scene',
        inputs: [], // no inputs
        outputs: [], // will be filled dynamically
        fields: [{key: 'selectedObject', value: ''}],

        builtIn: true
      }),
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

    if(node.title === 'Get Scene Object') {

      console.log('FUNC getValue , ' + 'node.title :' + node.title + ', this.nodes[nodeId]._returnCache = ' + this.nodes[nodeId]._returnCache);
      const objName = node.fields[0].value;
      console.log(' objName is n.fields[0].value = ' + node.fields[0].value)
      const obj = (window.app?.mainRenderBundle || []).find(o => o.name === objName);
      console.log('(window.app?.mainRenderBundle || []).find(o => o.name === objName) = ' + (window.app?.mainRenderBundle || []).find(o => o.name === objName))
      if(!obj) return undefined;

      const out = node.outputs.find(o => o.name === pinName);
      if(!out) return undefined;

      return obj[pinName]; // simple one-level property access
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
    Object.values(this.nodes).forEach(n => {
      if(!n.displayEl) return;

      const out = n.outputs?.find(o => o.name === 'result');
      if(!out) return;

      const v = this.getValue(n.id, 'result');

      if(v === undefined) {
        n.displayEl.textContent = '—';
      }
      else if(typeof v === 'number') {
        n.displayEl.textContent = v.toFixed(3);
      }
      else {
        n.displayEl.textContent = String(v);
      }
    });
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

    // --- Handle Getter Nodes ---
    if(n.isGetterNode) {
      const varField = n.fields?.find(f => f.key === 'var');
      if(varField && varField.value) {
        const type = n.title.replace('Get ', '').toLowerCase(); // number / boolean / string
        const value = this.getVariable(type, varField.value);
        n._returnCache = value;

        // Update visual label if exists
        if(n.displayEl) n.displayEl.textContent =
          typeof value === 'number' ? value.toFixed(3) : String(value);
      }

      n.finished = true;
      return;
    }

    // -----------------------------
    // Event Nodes
    // -----------------------------
    if(n.category === 'event') {
      this.enqueueOutputs(n, 'exec');
      return;
    }

    // -----------------------------
    // Variable Setter Nodes (skip Set Number)
    // -----------------------------
    if(n.isVariableNode && n.title !== 'Set Number') {
      const type = n.title.replace('Set ', '').toLowerCase();
      const varField = n.fields?.find(f => f.key === 'var');
      if(varField && varField.value) {
        const value = this.getValue(nodeId, 'value');
        this.setVariable(type, varField.value, value);
      }
    }

    // --- Handle SetNumber Nodes ---
    if(n.title === 'Set Number') {
      const varField = n.fields?.find(f => f.key === 'var');
      if(varField && varField.value) {
        const valInput = this.getValue(nodeId, 'value');
        this.variables.number[varField.value] = {value: valInput};

        // Update all corresponding GetNumber nodes immediately
        for(const nodeId2 in this.nodes) {
          const node2 = this.nodes[nodeId2];
          if(node2.isGetterNode) {
            const vf2 = node2.fields?.find(f => f.key === 'var');
            if(vf2 && vf2.value === varField.value && node2.displayEl) {
              node2.displayEl.textContent =
                typeof valInput === 'number' ? valInput.toFixed(3) : String(valInput);
              node2._returnCache = valInput;
            }
          }
        }
      }

      n.finished = true;
      this.enqueueOutputs(n, 'execOut');
      return;
    }

    // -----------------------------
    // Action / Print / Timer Nodes
    // -----------------------------
    if(['action', 'actionprint', 'timer'].includes(n.category)) {
      if(n.attachedMethod) this._executeAttachedMethod(n);

      if(n.title === 'Print') {
        const val = this.getValue(nodeId, 'value');
        const label = n.fields?.find(f => f.key === 'label')?.value || 'Print:';
        if(n.displayEl) n.displayEl.textContent = val;
        console.log(`[Print] ${label}`, val);
        this.log(`> ${label}`, val);
      } else if(n.title === 'SetTimeout') {
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


  // computeSceneNode(n) {
  //   const objName = n.fields?.find(f => f.key === 'selectedObject')?.value;
  //   const obj = this.scene?.[objName];

  //   n._returnCache = {
  //     NAME: obj?.name ?? '',
  //     POSITION: obj?.position ?? null,
  //     ROTATION: obj?.rotation ?? null,
  //     SCALE: obj?.scale ?? null
  //   };
  // }



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
    this.updateValueDisplays();
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
