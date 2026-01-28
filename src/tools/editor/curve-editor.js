/**
 * @description
 * Matrix-Engine-Wgpu Curve Editor
 */

import {byId, LOG_FUNNY_ARCADE} from "../../engine/utils";

export class CurveEditor {
  constructor({width = 651, height = 300, samples = 128} = {}) {
    this.curveStore = new CurveStore();
    this.width = width;
    this.height = height;
    this.samples = samples;
    this.keys = [
      {time: 0, value: 0, inTangent: 0, outTangent: 0},
      {time: 1, value: 0, inTangent: 0, outTangent: 0},
    ];
    this.valueMin = -1;
    this.valueMax = 1;
    this.padLeft = 32;
    this.padBottom = 18;
    this.canvas = document.createElement("canvas");
    this.canvas.width = width;
    this.canvas.height = height;
    this.ctx = this.canvas.getContext("2d");

    this.zeroY = Math.round(this.height * 0.5) + 0.5;
    this.graphHeight = this.height - this.padBottom;

    this.snapEnabled = true;
    this.snapSteps = 20;
    this.snapValueSteps = 20;

    this.name = "Curve";
    this.currentValue = 0;
    // fix
    this.value = 0;

    this.activeKey = null;
    this.dragMode = null;
    this._grabDX = 0;
    this._grabDY = 0;

    this.time = 0;
    this.loop = true;
    this.speed = 1;
    this.isGraphRunning = false;

    this._editorOpen = false;
    this._createPopup();
    this._bindMouse();
    this._buildToolbar();
    this._enableDrag();

    this.length = 1.0;
    this._lastTime = performance.now();
    this._runner = null;
    this.baked = this.bake(samples);

    setTimeout(() => this.draw(), 100);
  }

  _valueToY(v) {
    const n = (v - this.valueMin) / (this.valueMax - this.valueMin);
    return (1 - n) * this.graphHeight;
  }

  _yToValue(y) {
    const n = 1 - (y / this.height);
    return this.valueMin + n * (this.valueMax - this.valueMin);
  }

  _snap(value, steps) {
    if(!this.snapEnabled) return value;
    const range = this.valueMax - this.valueMin;
    return Math.round((value - this.valueMin) / range * steps) / steps * range + this.valueMin;
  }

  // VALUE EVALUATION (HERMITE)
  getValue(t) {
    t = Math.max(0, Math.min(1, t));

    for(let i = 0;i < this.keys.length - 1;i++) {
      const k0 = this.keys[i];
      const k1 = this.keys[i + 1];
      if(t >= k0.time && t <= k1.time) {
        const dt = k1.time - k0.time;
        const u = (t - k0.time) / dt;
        const u2 = u * u;
        const u3 = u2 * u;
        const m0 = k0.outTangent * dt;
        const m1 = k1.inTangent * dt;
        return (
          (2 * u3 - 3 * u2 + 1) * k0.value +
          (u3 - 2 * u2 + u) * m0 +
          (-2 * u3 + 3 * u2) * k1.value +
          (u3 - u2) * m1
        );
      }
    }
    return this.keys.at(-1).value;
  }

  // DRAW
  draw() {

    const padLeft = 32;
    const padBottom = 18;

    const ctx = this.ctx;
    const w = this.width - padLeft;
    const h = this.height - padBottom;

    ctx.save();
    ctx.translate(padLeft, 0);

    ctx.clearRect(-50, -50, w + padLeft + 50, h + padBottom + 50);
    ctx.fillStyle = "#0b0f14";
    ctx.fillRect(0, 0, w, h);

    // grid
    ctx.strokeStyle = "#1c2533";
    for(let i = 0;i <= 10;i++) {
      const x = (i / 10) * w;
      const y = (i / 10) * h;
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }

    // ===== Y AXIS LABELS =====
    ctx.fillStyle = "#9aa7b2";
    ctx.font = "11px monospace";
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";

    ctx.fillText("+1", -6, this._valueToY(0.9));
    ctx.fillText("0", -6, this._valueToY(0));
    ctx.fillText("-1", -6, this._valueToY(-0.9));

    const zeroY = this._valueToY(0);
    ctx.strokeStyle = "#2e3b4e";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, zeroY);
    ctx.lineTo(w, zeroY);
    ctx.stroke();
    ctx.lineWidth = 1;

    // curve
    ctx.strokeStyle = "#4fc3f7";
    ctx.beginPath();
    for(let i = 0;i <= 100;i++) {
      const t = i / 100;
      // const x = t * w;
      const x = t * w;
      const y = this._valueToY(this.getValue(t));
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();

    // keys + tangents
    this.keys.forEach(k => {
      const x = this._timeToX(k.time);
      const y = this._valueToY(k.value);

      // tangents
      ctx.strokeStyle = "#888";
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + 30, y - k.outTangent * 30);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - 30, y + k.inTangent * 30);
      ctx.stroke();

      // key circle
      ctx.fillStyle = "#ffcc00";
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
    });
    // PLAYHEAD
    const playX = this._timeToX(this.time);
    const playY = this._valueToY(this.getValueNow());
    // vertical line
    ctx.strokeStyle = "#ff5555";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(playX, 0);
    ctx.lineTo(playX, h);
    ctx.stroke();

    // dot
    ctx.fillStyle = "#ff5555";
    ctx.beginPath();
    ctx.arc(playX, playY, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 1;

    ctx.restore();

    // ===== X AXIS LABELS =====
    ctx.fillStyle = "#ffffffff";
    ctx.font = "13px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";

    const y = this.height - padBottom + 2;

    ctx.fillText("0s", padLeft, y);
    ctx.fillText(
      (this.length * 0.5).toFixed(2) + "s",
      padLeft + w * 0.5,
      y
    );
    ctx.fillText(
      this.length.toFixed(2) + "s",
      padLeft + w,
      y
    );

    this._updateToolbar();
  }

  _getMouse(e) {
    const r = this.canvas.getBoundingClientRect();
    return {
      x: e.clientX - r.left - this.padLeft,
      y: e.clientY - r.top
    };
  }

  _bindMouse() {
    const hitKey = (mx, my) => {
      return this.keys.find(k => {
        const x = this._timeToX(k.time);
        const y = this._valueToY(k.value);
        const HIT_RADIUS = 20;
        return Math.hypot(mx - x, my - y) <= HIT_RADIUS;
      });
    };

    const hitPlayhead = (mx, my) => {
      if(this.isGraphRunning) return false;
      const w = this.width - this.padLeft;
      const playX = this._timeToX(this.time);
      const playY = this._valueToY(this.getValueNow());
      return Math.hypot(mx - playX, my - playY) < 8;
    };

    this.canvas.addEventListener("mousedown", e => {
      const {x: mx, y: my} = this._getMouse(e);
      if(hitPlayhead(mx, my)) {
        this.activeKey = 'playhead';
        this.dragMode = 'playhead';
        return;
      }
      const k = hitKey(mx, my);
      if(k) {
        const w = this.width - this.padLeft;
        const kx = k.time * w;
        const ky = this._valueToY(k.value);

        this._grabDX = mx - kx;
        this._grabDY = my - ky;

        this.activeKey = k;
        this.dragMode = e.shiftKey ? "tangent" : "key";
      }
    });

    window.addEventListener("mousemove", e => {
      if(!this.activeKey) return;
      const {x: mx, y: my} = this._getMouse(e);
      if(this.dragMode === 'playhead' && this.activeKey === 'playhead') {
        const w = this.width - this.padLeft;
        let t = Math.max(0, Math.min(1, mx / w));
        t = this._snap(t, this.snapSteps);
        this.time = t;
        this.draw();
        return;
      }
      if(this.dragMode === "key") {
        const w = this.width - this.padLeft;
        // let t = (mx - this._grabDX) / w;
        let t = (mx - this._grabDX) / w;
        t = Math.max(0, Math.min(1 - 1e-6, t));
        let v = this._yToValue(my - this._grabDY);
        v = Math.max(this.valueMin, Math.min(this.valueMax, v));
        v = this._snap(v, this.snapValueSteps);
        t = this._snap(t, this.snapSteps);
        v = this._snap(v, this.snapValueSteps);
        this.activeKey.time = t;
        this.activeKey.value = v;
        this.keys.sort((a, b) => a.time - b.time);
      }
      if(this.dragMode === "tangent") {
        const dx = (mx / r.width) - this.activeKey.time;
        const dy = (1 - my / r.height) - this.activeKey.value;
        this.activeKey.outTangent = dy / dx || 0;
        this.activeKey.inTangent = this.activeKey.outTangent;
      }

      this.draw();
      this._reBake();
    });

    window.addEventListener("mouseup", () => {
      this.activeKey = null;
      this.dragMode = null;
    });

    this.canvas.addEventListener("dblclick", e => {
      const {x, y} = this._getMouse(e);
      const w = this.width - this.padLeft;

      const t = Math.max(0, Math.min(1, x / w));
      const v = this._yToValue(y);

      this.keys.push({
        time: t,
        value: v,
        inTangent: 0,
        outTangent: 0
      });

      this.keys.sort((a, b) => a.time - b.time);
      this._reBake();
      this.draw();
    });

    // delete key
    this.canvas.addEventListener("contextmenu", e => {
      e.preventDefault();
      const {x: mx, y: my} = this._getMouse(e);
      const k = hitKey(mx, my);
      if(k && this.keys.length > 2) {
        this.keys = this.keys.filter(x => x !== k);
        this.draw();
        this._reBake();
      }
    });
  }

  _timeToX(t) {
    const w = this.width - this.padLeft;
    const R = 4;
    let x = t * w;

    // clamp so circle is fully inside canvas
    return Math.min(Math.max(x, R), w - R);
  }

  // BAKING
  bake(samples = this.samples) {
    const data = new Float32Array(samples);
    for(let i = 0;i < samples;i++) {
      const t = i / (samples - 1);
      data[i] = this.getValue(t);
    }
    return data;
  }

  _reBake() {this.baked = this.bake(this.samples);}

  exec(delta) {
    if(!this.isGraphRunning) return this.value;
    this.time += (delta / this.length) * this.speed;
    if(this.loop && this.time > 1) this.time = 0;
    if(!this.loop && this.time > 1) {
      this.time = 1;
      this.stop();
    }
    const idx = Math.floor(this.time * (this.samples - 1));
    this.value = this.baked[idx];
    this.draw();
    return this.value;
  }

  // SYNTETIC FOR NOW 
  play() {
    if(this.isGraphRunning) return;
    this.isGraphRunning = true;
    this._lastTime = performance.now();
    this._runner = setInterval(() => {
      const now = performance.now();
      const delta = (now - this._lastTime) / 1000;
      this._lastTime = now;
      this.exec(delta);
    }, 16); // ~60fps
  }

  stop() {
    this.isGraphRunning = false;
    if(this._runner) {
      clearInterval(this._runner);
      this._runner = null;
    }
    this.draw();
  }

  getValueNow() {return this.value;}

  _createPopup() {
    this.popup = document.createElement("div");
    this.popup.id = "curve-editor";
    Object.assign(this.popup.style, {
      position: "fixed",
      top: "20%",
      left: "20%",
      transform: "translate(-50%,-50%)",
      background: "#111",
      border: "1px solid #333",
      padding: "5px",
      display: "none",
      zIndex: 999999,
      width: '650px',
      height: '409px',
      paddingLeft: '2px',
      paddingRight: '2px'
    });


    this.toolbarTitle = document.createElement("div");
    this.toolbarTitle.style.cssText = `
      display:flex;
      align-items:center;
      gap:10px;
      padding:4px 6px;
      background:#121822;
      border-bottom:1px solid #1c2533;
      font-size:12px;
      margin-bottom: 5px;
    `;

    this.toolbarTitle.innerHTML = `<h3>Curve Editor</h3>`

    this.popup.appendChild(this.toolbarTitle);
    this.popup.appendChild(this.canvas);
    document.body.appendChild(this.popup);
  }

  toggleEditor() {
    // console.log('_editorOpen')
    this._editorOpen = !this._editorOpen;
    this.popup.style.display = this._editorOpen ? "block" : "none";
    this.draw();
  }

  _buildToolbar() {
    this.root = document.createElement("div");
    this.root.style.cssText = `
    background:#0b0f14;
    border:1px solid #1c2533;
    font-family:monospace;
    color:#cfd8dc;
    width:${this.width}px;
  `;

    // Toolbar
    this.toolbar = document.createElement("div");
    this.toolbar.style.cssText = `
    display:flex;
    align-items:center;
    gap:10px;
    padding:4px 6px;
    background:#121822;
    border-bottom:1px solid #1c2533;
    font-size:12px;
  `;

    this.nameInput = document.createElement("input");
    // console.log(this.name)
    this.nameInput.value = this.name;
    this.nameInput.disabled = true;
    this.nameInput.style.cssText = `
    width:80px;
    background:#0b0f14;
    border:1px solid #1c2533;
    color:#fff;
    padding:2px 4px;
  `;
    this.nameInput.onchange = () => this.name = this.nameInput.value;

    this.playBtn = document.createElement("button");
    this.playBtn.textContent = "▶";
    this.playBtn.style.cssText = `
      background:#1c2533;
      color:#fff;
      border:none;
      padding:2px 8px;
      cursor:pointer;
    `;
    this.playBtn.onclick = () => {
      this.isGraphRunning ? this.stop() : this.play();
    };

    this.lengthInput = document.createElement("input");
    this.lengthInput.type = "number";
    this.lengthInput.value = this.length;
    this.lengthInput.step = "0.1";
    this.lengthInput.style.cssText = `
      width:60px;
      background:#0b0f14;
      border:1px solid #1c2533;
      color:#fff;
      padding:2px 4px;
    `;
    this.lengthInput.onchange = () => {
      this.length = Math.max(0.01, parseFloat(this.lengthInput.value));
    };

    // Time label
    this.timeLabel = document.createElement("span");

    // Value label
    this.valueLabel = document.createElement("span");

    // Running indicator
    this.runLabel = document.createElement("span");

    // Snap toggle
    this.snapBtn = document.createElement("button");
    this.snapBtn.textContent = "Snap";
    this.snapBtn.style.cssText = `
    background:#1c2533;
    color:#fff;
    border:none;
    padding:2px 6px;
    cursor:pointer;
  `;
    this.snapBtn.onclick = () => {
      this.snapEnabled = !this.snapEnabled;
      this.snapBtn.style.opacity = this.snapEnabled ? "1" : "0.4";
    };

    const lenLabel = document.createElement("span");
    lenLabel.textContent = "Len";

    // Reset button
    this.resetBtn = document.createElement("button");
    this.resetBtn.textContent = "Reset";
    this.resetBtn.style.cssText = this.snapBtn.style.cssText;
    this.resetBtn.onclick = () => {
      this.time = 0;
      this.draw();
    };

    this.saveBtn = document.createElement("button");
    this.saveBtn.textContent = "💾 Save";
    this.saveBtn.style.cssText = `
      background:#1c2533;
      color:#fff;
      border:none;
      padding:2px 6px;
      cursor:pointer;
    `;
    this.saveBtn.onclick = () => {
      let curve = this.curveStore.getByName(this.name);
      if(!curve) {
        curve = new CurveData(this.name);
        this.curveStore.curves.push(curve);
      }
      curve.keys = this.keys.map(k => ({...k}));
      curve.length = this.length;
      curve.loop = this.loop;
      curve.bake(this.samples);
      this.curveStore.save(curve);
      byId('saveMainGraphDOM').click();
      console.log(`%c Curve [${this.name}] saved`, "color:#4caf50;font-weight:bold");
    };

    this.hideBtn = document.createElement("button");
    this.hideBtn.textContent = "Hide";
    this.hideBtn.style.cssText = `
      background:#1c2533;
      color:#fff;
      border:none;
      padding:2px 6px;
      cursor:pointer;
    `;
    this.hideBtn.onclick = () => {
      this.toggleEditor();
      console.log(`%c Curve [${this.name}] saved!`, LOG_FUNNY_ARCADE);
    };

    this.toolbar.append(
      this.nameInput,
      this.playBtn,
      lenLabel,
      this.lengthInput,
      this.timeLabel,
      this.valueLabel,
      this.runLabel,
      this.snapBtn,
      this.resetBtn,
      this.saveBtn,
      this.hideBtn
    );

    this.root.append(this.toolbar);
    this.popup.appendChild(this.root);
  }

  _updateToolbar = () => {
    this.currentValue = this.getValueNow();
    const timeSec = this.time * this.length;

    this.timeLabel.textContent =
      `T: ${timeSec.toFixed(2)}s`;

    this.valueLabel.textContent =
      `V: ${this.currentValue.toFixed(3)}`;

    this.runLabel.textContent =
      this.isGraphRunning ? "ACTIVE" : "STOPED";

    this.runLabel.style.color =
      this.isGraphRunning ? "#4caf50" : "#ff9800";

    this.playBtn.textContent =
      this.isGraphRunning ? "⏸" : "▶";
  };

  _enableDrag() {
    const el = this.popup;
    const handle = this.toolbar;
    const handle2 = this.toolbarTitle;

    let isDown = false;
    let startX = 0;
    let startY = 0;
    let startLeft = 0;
    let startTop = 0;

    handle.style.cursor = "move";
    handle2.style.cursor = "move";

    handle.addEventListener("mousedown", (e) => {
      isDown = true;
      startX = e.clientX;
      startY = e.clientY;

      const rect = el.getBoundingClientRect();
      startLeft = rect.left;
      startTop = rect.top;

      document.body.style.userSelect = "none";
    });

    handle2.addEventListener("mousedown", (e) => {
      isDown = true;
      startX = e.clientX;
      startY = e.clientY;

      const rect = el.getBoundingClientRect();
      startLeft = rect.left;
      startTop = rect.top;

      document.body.style.userSelect = "none";
    });

    window.addEventListener("mousemove", (e) => {
      if(!isDown) return;

      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      el.style.left = startLeft + dx + "px";
      el.style.top = startTop + dy + "px";
      el.style.transform = "none";
    });

    window.addEventListener("mouseup", () => {
      isDown = false;
      document.body.style.userSelect = "";
    });
  }

  bindCurve(curve, meta = {}) {
    // console.log("BIND curve", curve, meta);
    this.curve = curve;
    this.keys = curve.keys;
    this.length = curve.length;
    this.loop = curve.loop;
    this.name = meta.idNode;
    this.nameInput.value = this.name;
    this.lengthInput.value = this.length;
    this.idNode = meta.idNode ?? null;

    this.time = 0;
    this._reBake();
    this.draw();
  }
}

/**
 * @description
 * Data class
 **/

export class CurveData {
  constructor(name) {
    this.name = name;
    this.keys = [
      {time: 0, value: 0, inTangent: 0, outTangent: 0},
      {time: 1, value: 1, inTangent: 0, outTangent: 0}
    ];
    this.length = 1;
    this.loop = true;
    this.samples = 128;
    this.baked = null;
  }

  getValue(t) {
    t = Math.max(0, Math.min(1, t));

    for(let i = 0;i < this.keys.length - 1;i++) {
      const k0 = this.keys[i];
      const k1 = this.keys[i + 1];
      if(t >= k0.time && t <= k1.time) {
        const dt = k1.time - k0.time;
        const u = (t - k0.time) / dt;
        const u2 = u * u;
        const u3 = u2 * u;
        const m0 = k0.outTangent * dt;
        const m1 = k1.inTangent * dt;
        return (
          (2 * u3 - 3 * u2 + 1) * k0.value +
          (u3 - 2 * u2 + u) * m0 +
          (-2 * u3 + 3 * u2) * k1.value +
          (u3 - u2) * m1
        );
      }
    }
    return this.keys.at(-1).value;
  }

  // bake real values, not normalized 0-1
  bake(samples = this.samples) {
    this.baked = new Float32Array(samples);
    for(let i = 0;i < samples;i++) {
      const t = i / (samples - 1);
      this.baked[i] = this.getValue(t);
    }
  }

  evaluate(time01) {
    if(!this.baked) {
      console.warn("Curve not baked!");
      return 0;
    }

    let t = time01;
    if(this.loop) t = t % 1;
    else t = Math.min(1, Math.max(0, t));

    const idx = Math.floor(t * (this.baked.length - 1));
    return this.baked[idx];
  }
}

class CurveStore {
  constructor() {
    this.CURVE_STORAGE_KEY = "PROJECT_NAME";
    this.curves = [];
    this.load();
  }

  has(name) {
    return this.curves.some(c => c.name === name);
  }

  getOrCreate(curveArg) {
    let curve = this.curves.find(c => c.name === curveArg.name);
    if(curve) return curve;
    // console.log("PUSH in getOrCreate")
    curve = new CurveData(curveArg.name);
    this.curves.push(curve);
    return curve;
  }

  getByName(name) {
    return this.curves.find(c => c.name === name) || null;
  }

  add(curve) {
    this.curves.push(curve);
    this.save();
  }

  removeByName(name) {
    this.curves = this.curves.filter(c => c.name !== name);
    this.save();
  }

  getAll() {
    return this.curves;
  }

  // SAVE / LOAD
  save() {
    console.log('TEST SAVE', this.curves);
    const data = {
      version: 1,
      curves: this.curves
    };
    localStorage.setItem(this.CURVE_STORAGE_KEY, JSON.stringify(data));
  }

  // saveCurve(curveData) {
  //   const idx = this.curves.findIndex(c => c.name === curveData.name);
  //   if(idx >= 0) {
  //     this.curves[idx] = curveData;
  //   } else {
  //     this.curves.push(curveData);
  //   }
  //   this.save();
  // }

  load() {
    const raw = localStorage.getItem(this.CURVE_STORAGE_KEY);
    if(!raw) return;

    try {
      const data = JSON.parse(raw);
      if(!data.curves) return;

      this.curves = data.curves.map(c => this._fromJSON(c));
    } catch(e) {
      console.warn("CurveStore load failed", e);
      this.curves = [];
    }
  }

  _fromJSON(obj) {
    const c = new CurveData(obj.name);
    c.keys = obj.keys || [];
    c.length = obj.length ?? 1;
    c.loop = !!obj.loop;
    return c;
  }
}
