export default class FluxCodexVertex {
  constructor(boardId, boardWrapId, logId, methodsManager) {
    this.methodsManager = methodsManager;
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
    this.bindGlobalListeners();

    // Initialize the graph
    this.init();
  }

  // ====================================================================
  // 1. UTILITY & DEBUGGING
  // ====================================================================
  log(...args) {
    this.logEl.textContent = args.join(' ');
  }

  _getPinDot(nodeId, pinName, isOutput) {
    const nodeEl = document.querySelector(`.node[data-id="${nodeId}"]`);
    if(!nodeEl) return null;
    const io = isOutput ? 'out' : 'in';
    return nodeEl.querySelector(`.pin[data-pin="${pinName}"][data-io="${io}"] .dot`);
  }

  // --------------------------------------------------------------------
  // Dynamic Method Helpers
  // --------------------------------------------------------------------
  getArgNames(fn) {
    const src = fn.toString();
    const args = src.match(/\(([^)]*)\)/);
    if(!args) return [];
    return args[1]
      .split(',')
      .map(a => a.trim())
      .filter(a => a.length);
  }

  hasReturn(fn) {
    return /return\s+/.test(fn.toString());
  }

  adaptNodeToMethod(node, methodItem) {
    // Compile the function inline
    const fn = this.methodsManager.compileFunction(methodItem.code);

    // Clear old pins
    node.inputs = [{name: "exec", type: "action"}];
    node.outputs = [{name: "execOut", type: "action"}];

    // Detect arguments
    const args = this.getArgNames(fn);
    args.forEach(arg => node.inputs.push({name: arg, type: "any"}));

    // Detect return
    if(this.hasReturn(fn)) {
      node.outputs.push({name: "return", type: "any"});
    }

    // Store method on node
    node.attachedMethod = methodItem.name;
    node.fn = fn;

    // Update the DOM
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

    // Pin containers
    const left = el.querySelector('.pins-left');
    const right = el.querySelector('.pins-right');
    if(!left || !right) return;

    // Clear existing pins
    left.innerHTML = '';
    right.innerHTML = '';

    // Recreate pins
    (node.inputs || []).forEach(pin => left.appendChild(this._pinElement(pin, false, nodeId)));
    (node.outputs || []).forEach(pin => right.appendChild(this._pinElement(pin, true, nodeId)));

    // Re-add method select for function nodes
    if(node.category === 'action' && node.attachedMethod) {
      let select = el.querySelector('select.method-select');
      if(!select) {
        select = document.createElement('select');
        select.className = 'method-select';
        el.querySelector('.body').prepend(select);
      }
      this.populateMethodsSelect(select);
      select.value = node.attachedMethod;

      // Bind change event
      select.addEventListener('change', (e) => {
        const methodName = e.target.value;
        const methodItem = this.methodsManager.methodsContainer.find(m => m.name === methodName);
        if(methodItem) this.adaptNodeToMethod(node, methodItem);
      });
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
    if(from.pin && to.pin && this.state.connecting.type === type) {
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

  _pinElement(pinSpec, isOutput, nodeId) {
    const pin = document.createElement('div');
    pin.className = 'pin ' + pinSpec.type;
    pin.dataset.pin = pinSpec.name;
    pin.dataset.type = pinSpec.type;
    pin.dataset.io = isOutput ? 'out' : 'in';

    const dot = document.createElement('div');
    dot.className = 'dot';
    pin.appendChild(dot);

    pin.addEventListener('mousedown', (e) => this.startConnect(nodeId, pinSpec.name, pinSpec.type, isOutput));
    pin.addEventListener('mouseup', (e) => this.finishConnect(nodeId, pinSpec.name, pinSpec.type, isOutput));
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

    // --- Pins row ---
    const row = document.createElement('div');
    row.className = 'pin-row';
    const left = document.createElement('div'); left.className = 'pins-left';
    const right = document.createElement('div'); right.className = 'pins-right';

    (spec.inputs || []).forEach(pin => left.appendChild(this._pinElement(pin, false, spec.id)));
    (spec.outputs || []).forEach(pin => right.appendChild(this._pinElement(pin, true, spec.id)));

    row.appendChild(left);
    row.appendChild(right);
    body.appendChild(row);

    // --- Display block (for value/math/Print) ---
    if((spec.category === 'value' && spec.title !== 'GenRandInt') || spec.category === 'math' || spec.title === 'Print') {
        const display = document.createElement('div');
        display.className = 'value-display';
        display.textContent = '?';
        spec.displayEl = display;
        body.appendChild(display);
    }

    // --- Method select (for action/function nodes) ---
    if(spec.category === 'action') {
        let select = el.querySelector('select.method-select');
        if(!select) {
            select = document.createElement('select');
            select.className = 'method-select';
            select.style.cssText = 'width:100%; margin-top:6px;';
            body.appendChild(select);
        }
        this.populateMethodsSelect(select);

        // Pre-select if method already attached
        if(spec.attachedMethod) select.value = spec.attachedMethod;

        // Event listener
        select.onchange = (e) => {
            const selected = this.methodsManager.methodsContainer.find(m => m.name === e.target.value);
            if(selected) {
                this.adaptNodeToMethod(spec, selected); // Updates pins + DOM
            }
        };
    }

    el.appendChild(body);

    // --- Drag header ---
    header.addEventListener('mousedown', e => {
        e.preventDefault();
        this.state.draggingNode = el;
        const rect = el.getBoundingClientRect();
        const bx = this.board.getBoundingClientRect();
        this.state.dragOffset = [e.clientX - rect.left + bx.left, e.clientY - rect.top + bx.top];
        document.body.style.cursor = 'grabbing';
    });

    // --- Select node on click ---
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

  addNode(type) {
    const id = 'node_' + (this.nodeCounter++);
    const x = Math.abs(this.state.pan[0]) + 100 + Math.random() * 200;
    const y = Math.abs(this.state.pan[1]) + 100 + Math.random() * 200;

    let spec = null;
    if(type === 'function') {
      spec = {id, title: 'Function', x, y, category: 'action', inputs: [{name: "exec", type: "action"}], outputs: [{name: "execOut", type: "action"}]};
    } else if(type === 'event') {
      spec = {id, title: 'onLoad', x, y, category: 'event', inputs: [], outputs: [{name: "exec", type: "action"}]};
    }
    // add other node types...

    if(spec) {
      const dom = this.createNodeDOM(spec);
      this.board.appendChild(dom);
      this.nodes[id] = spec;
      return id;
    }
    return null;
  }

  _executeAttachedMethod(n) {
    if(n.attachedMethod) {
      const method = this.methodsManager.methodsContainer.find(m => m.name === n.attachedMethod);
      if(method) {
        const fn = method.fn;
        const args = this.getArgNames(fn).map(argName => this.getValue(n.id, argName));
        let result;
        try {result = fn(...args);} catch(err) {console.error("User method error:", err);}
        if(this.hasReturn(fn)) n._returnCache = result;
      }
    }
  }

  getValue(nodeId, pinName, visited = new Set()) {
    const n = this.nodes[nodeId];
    if(!n) return 0;

    // Return cached dynamic function output
    if(n.attachedMethod && pinName === "return") return n._returnCache ?? 0;

    let linkToSource = null;
    for(const link of this.links) {
      if(link.to.node === nodeId && link.to.pin === pinName && link.type === 'value') {linkToSource = link; break;}
    }
    if(linkToSource) {
      const sourceNodeId = linkToSource.from.node;
      if(visited.has(sourceNodeId)) return 0;
      const newVisited = new Set(visited); newVisited.add(nodeId);
      return this.getValue(sourceNodeId, linkToSource.from.pin, newVisited);
    }

    if(n.title === 'GenRandInt') {
      const min = +(n.fields?.find(f => f.key === 'min')?.value) || 0;
      const max = +(n.fields?.find(f => f.key === 'max')?.value) || 10;
      return Math.floor(Math.random() * (max - min + 1) + min);
    }
    if(n.title === 'Pi') return Math.PI;

    const vA = +this.getValue(nodeId, 'a', visited) || 0;
    const vB = +this.getValue(nodeId, 'b', visited) || 0;
    if(n.title === 'Add') return vA + vB;
    if(n.title === 'Sub') return vA - vB;
    if(n.title === 'Mul') return vA * vB;
    if(n.title === 'Div') return vB ? vA / vB : 0;
    if(n.title === 'Sin') return Math.sin(vA);
    if(n.title === 'Cos') return Math.cos(vA);

    return 0;
  }

  updateValueDisplays() {
    Object.values(this.nodes).forEach(n => {
      if(n.displayEl && n.outputs?.some(o => o.name === 'result')) {
        n.displayEl.textContent = this.getValue(n.id, 'result').toFixed(3);
      }
    });
  }

  triggerNode(id) {
    const n = this.nodes[id]; if(!n) return;
    const el = document.querySelector(`.node[data-id="${id}"] .header`);
    if(el) {el.style.filter = 'brightness(1.5)'; setTimeout(() => el.style.filter = 'none', 200);}

    if(n.category === 'event') {this.enqueueOutputs(n, 'exec'); return;}

    else if(n.category === 'action' || n.category === 'timer') {
      // --- STEP 2: execute attached method
      this._executeAttachedMethod(n);

      // Built-in nodes
      if(n.title === 'Print') {
        const valueToPrint = this.getValue(id, 'value');
        const labelField = n.fields?.find(f => f.key === 'label');
        const label = labelField ? labelField.value : 'Print:';
        if(n.displayEl) n.displayEl.textContent = valueToPrint;
        console.log(`[Blueprint] ${label}`, valueToPrint);
        this.log(`> ${label}`, valueToPrint);
      } else if(n.title === 'SetTimeout') {
        const delay = +n.fields?.find(f => f.key === 'delay')?.value || 1000;
        setTimeout(() => this.enqueueOutputs(n, 'execOut'), delay);
        return;
      }
      this.enqueueOutputs(n, 'execOut');
    }

    else if(n.category === 'control' && n.title === 'If') {
      const condition = this.getValue(id, 'condition');
      this.enqueueOutputs(n, condition ? 'true' : 'false');
    }
  }

  enqueueOutputs(n, pinName) {
    this.links.filter(l => l.from.node === n.id && l.from.pin === pinName && l.type === 'action')
      .forEach(l => setTimeout(() => this.triggerNode(l.to.node), 10));
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

  runGraph() {this.updateValueDisplays(); Object.values(this.nodes).filter(n => n.category === 'event' && n.title === 'onLoad').forEach(n => this.triggerNode(n.id));}

  compileGraph() {
    const bundle = {nodes: this.nodes, links: this.links, nodeCounter: this.nodeCounter, linkCounter: this.linkCounter, pan: this.state.pan};
    localStorage.setItem(FluxCodexVertex.SAVE_KEY, JSON.stringify(bundle));
    this.log('Graph saved to LocalStorage!');
  }

  clearStorage() {localStorage.removeItem(FluxCodexVertex.SAVE_KEY); this.log('Save cleared. Refresh to reset.');}

  init() {
    const saved = localStorage.getItem(FluxCodexVertex.SAVE_KEY);
    if(saved) {
      try {
        const data = JSON.parse(saved);
        this.nodes = data.nodes || {};
        this.links = data.links || [];
        this.nodeCounter = data.nodeCounter || 1;
        this.linkCounter = data.linkCounter || 1;
        this.state.pan = data.pan || [0, 0];
        this.board.style.transform = `translate(${this.state.pan[0]}px,${this.state.pan[1]}px)`;
        Object.values(this.nodes).forEach(spec => {
          const domEl = this.createNodeDOM(spec);
          this.board.appendChild(domEl);
          if((spec.category === 'value' && spec.title !== 'GenRandInt') || spec.category === 'math' || spec.category === 'Print') {
            spec.displayEl = domEl.querySelector('.value-display');
          }
        });
        this.updateLinks(); this.updateValueDisplays(); this.log('Restored graph.'); return;
      } catch(e) {console.error("Failed to load graph from storage:", e);}
    }
    this.addNode('event');
  }
}

FluxCodexVertex.SAVE_KEY = 'matrixEngineVisualScripting';
