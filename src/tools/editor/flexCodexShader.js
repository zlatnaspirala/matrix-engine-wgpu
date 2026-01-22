import {LOG_FUNNY_ARCADE} from "../../engine/utils.js";
import {graphAdapter} from "./flexCodexShaderAdapter.js";

export const FragmentShaderRegistry = {};

export class FragmentShaderGraph {
  constructor(id) {
    this.id = id;
    this.nodes = [];
    this.connections = [];
    // pos of node
    this.spawnX = 80;
    this.spawnY = 80;
    this.spawnStepX = 220;
    this.spawnStepY = 140;
    this.spawnCol = 0;
  }

  addNode(node) {
    // node.shaderGraph = this;
    console.log('nodes detect bug 1', node)
    this.nodes.push(node);
    return node;
  }

  connect(fromNode, fromPin, toNode, toPin) {
    this.connections = this.connections.filter(
      c => !(c.toNode === toNode && c.toPin === toPin)
    );
    this.connections.push({fromNode, fromPin, toNode, toPin});
  }

  getInput(node, pin) {
    return this.connections.find(
      c => c.toNode === node && c.toPin === pin
    );
  }

  compile() {
    const wgsl = FragmentCompiler.compile(this);
    FragmentShaderRegistry[this.id] = wgsl;
    return wgsl;
  }

  nextSpawn() {
    const x = this.spawnX + this.spawnCol * this.spawnStepX;
    const y = this.spawnY;
    this.spawnCol++;
    if(this.spawnCol >= 3) {
      this.spawnCol = 0;
      this.spawnY += this.spawnStepY;
    }
    return {x, y};
  }

  makeDraggable(el, node, connectionLayer) {
    let ox = 0, oy = 0, drag = false;
    el.addEventListener("pointerdown", e => {
      drag = true;
      ox = e.clientX - el.offsetLeft;
      oy = e.clientY - el.offsetTop;
      el.setPointerCapture(e.pointerId);
    });
    el.addEventListener("pointermove", e => {
      if(!drag) return;
      el.style.left = (e.clientX - ox) + "px";
      el.style.top = (e.clientY - oy) + "px";
      node.x = (e.clientX - ox);
      node.y = (e.clientY - oy);
      connectionLayer.redrawAll();
    });
    el.addEventListener("pointerup", () => drag = false);
  }
}

class CompileContext {
  constructor(shaderGraph) {
    this.shaderGraph = shaderGraph;
    this.cache = new Map();

    this.structs = [];
    this.uniforms = [];
    this.functions = new Map();
    this.locals = [];
    this.mainLines = [];

    this.tmpIndex = 0;
    this.outputs = {
      outColor: null
    };
  }

  temp(type, expr) {
    const name = `t${this.tmpIndex++}`;
    this.locals.push(`let ${name}: ${type} = ${expr};`);
    return name;
  }

  registerFunction(name, code) {
    if(!this.functions.has(name)) {
      this.functions.set(name, code);
    }
  }

  resolve(node, pin) {
    const key = `${node.id}:${pin}`;
    if(this.cache.has(key)) return this.cache.get(key);

    if(!this.resolving) this.resolving = new Set();
    if(this.resolving.has(key)) {
      console.warn("Cyclic dependency detected:", key);
      return node.default?.(pin) ?? "0.0";
    }
    this.resolving.add(key);

    const conn = this.shaderGraph.getInput(node, pin);

    let value;

    if(conn) {
      value = this.resolve(conn.fromNode, conn.fromPin);
      console.log('value = this.resolve(conn.fromNode, conn.fromPin); ', value)
    } else {
      // ✅ ONLY inputs have defaults
      if(node.inputs && pin in node.inputs) {
        value = node.inputs[pin].default;
      } else {
        // 🔥 OUTPUT PIN → no default
        value = undefined;
      }
    }

    const result = node.build(pin, value, this);

    if(result?.out !== undefined) {
      this.cache.set(key, result.out);
    }

    this.resolving.delete(key);
    return result.out;
  }


}

class FragmentCompiler {
  static compile(shaderGraph) {
    const ctx = new CompileContext(shaderGraph);
    shaderGraph.nodes.forEach(n => {
      if(n.type.endsWith("Output")) {
        ctx.resolve(n, Object.keys(n.inputs)[0]);
      }
    });
    if(!ctx.outputs.outColor) {
      throw new Error("ShaderGraph: No visual output");
    }
    return {
      structs: ctx.structs,
      uniforms: ctx.uniforms,
      functions: [...ctx.functions.values()],
      locals: ctx.locals,
      outputs: ctx.outputs,
      mainLines: ctx.mainLines
    };
  }
}

let NODE_ID = 0;
export class ShaderNode {
  constructor(type) {
    this.id = "N" + NODE_ID++;
    this.type = type;
    this.inputs = {};
  }
  default(pin) {
    return this.inputs[pin]?.default ?? "0.0";
  }
  build(_, value, ctx) {
    return {
      out: value,
      type: "f32"
    };
  }
}

export class FragmentOutputNode extends ShaderNode {
  constructor() {
    super("FragmentOutput");
    this.inputs = {color: {default: "vec4f(1.0)"}};
  }

  build(_, __, ctx) {
    const conn = ctx.shaderGraph.getInput(this, "color");
    let value;
    if(conn) {
      // Resolve the node connected to this input
      value = ctx.resolve(conn.fromNode, conn.fromPin);
    } else {
      // No connection → use default
      value = this.inputs.color.default;
    }
    ctx.outputs.outColor = value;
    console.log('From FragmentOutputNode ctx.outputs.outColor', ctx.outputs.outColor);
    return {out: ctx.outputs.outColor, type: "vec4f"};
  }
}

export class BaseColorOutputNode extends ShaderNode {
  constructor() {
    super("BaseColorOutput");
    this.inputs = {color: {default: "vec3f(1.0)"}};
  }

  build(_, __, ctx) {
    const conn = ctx.shaderGraph.getInput(this, "color");
    let value;
    if(conn) {
      value = ctx.resolve(conn.fromNode, conn.fromPin);
    } else {
      value = this.inputs.color.default;
    }
    ctx.outputs.baseColor = value;
    return {out: ctx.outputs.baseColor};
  }
}

export class EmissiveOutputNode extends ShaderNode {
  constructor() {
    super("EmissiveOutput");
    this.inputs = {color: {default: "vec3f(0.0)"}};
  }

  build(_, __, ctx) {
    ctx.outputs.emissive = ctx.resolve(this, "color");
    return {out: ctx.outputs.emissive};
  }
}

export class AlphaOutputNode extends ShaderNode {
  constructor() {
    super("AlphaOutput");
    this.inputs = {alpha: {default: "1.0"}};
  }

  build(_, __, ctx) {
    ctx.outputs.alpha = ctx.resolve(this, "alpha");
    return {out: ctx.outputs.alpha};
  }
}

export class NormalOutputNode extends ShaderNode {
  constructor() {
    super("NormalOutput");
    this.inputs = {normal: {default: "input.normal"}};
  }

  build(_, __, ctx) {
    ctx.outputs.normal = ctx.resolve(this, "normal");
    return {out: ctx.outputs.normal};
  }
}

// sTANDARD SOME STUFF ARE PREDEFINED ALREADY IN ADAPTER
export class LightShadowNode extends ShaderNode {
  constructor() {
    super("LightShadowNode");
    this.inputs = {intensity: {default: "1"}};
  }

  build(_, __, ctx) {
    // Generate the light calculation code as a string
    const lightCalcCode = `
    let norm = normalize(input.fragNorm);
    let viewDir = normalize(scene.cameraPos - input.fragPos);
    let materialData = getPBRMaterial(input.uv);
    var lightContribution = vec3f(0.0);
    for (var i: u32 = 0u; i < MAX_SPOTLIGHTS; i = i + 1u) {
        let sc = spotlights[i].lightViewProj * vec4<f32>(input.fragPos, 1.0);
        let p  = sc.xyz / sc.w;
        let uv = clamp(p.xy * 0.5 + vec2<f32>(0.5), vec2<f32>(0.0), vec2<f32>(1.0));
        let depthRef = p.z * 0.5 + 0.5;
        let lightDir = normalize(spotlights[i].position - input.fragPos);
        let bias = spotlights[i].shadowBias;
        let visibility = sampleShadow(uv, i32(i), depthRef - bias, norm, lightDir);
        let contrib = computeSpotLight(spotlights[i], norm, input.fragPos, viewDir, materialData);
        lightContribution += contrib * visibility;
    }`;
    
    ctx.locals.push(lightCalcCode);
    
    // Return the variable name that downstream nodes can use
    return {
      out: "lightContribution",
      type: "vec3f"
    };
  }
}

// export class LightToColorNode extends ShaderNode {
//   constructor() {
//     super("LightToColor");
//     this.inputs = {
//       light: {default: "vec3f(1.0)"}
//     };
//   }

//   build(pin, value, ctx) {
//     // Use the value parameter if provided, otherwise resolve
//     const l = value !== undefined ? value : ctx.resolve(this, "light");
//     return {
//       out: `vec4f(${l}, 1.0)`,
//       type: "vec4f"
//     };
//   }
// }
export class LightToColorNode extends ShaderNode {
  constructor() {
    super("LightToColor");
    this.inputs = {
      light: {default: "vec3f(1.0)"}
    };
  }

  build(pin, value, ctx) {
    const conn = ctx.shaderGraph.getInput(this, "light");
    let l;
    if(conn) {
      l = ctx.resolve(conn.fromNode, conn.fromPin);
    } else {
      l = this.inputs.light.default;
    }
    // Use ctx.temp() to create a temporary variable
    const result = ctx.temp("vec4f", `vec4f(${l}, 1.0)`);
    return {
      out: result,
      type: "vec4f"
    };
  }
}

export class UVNode extends ShaderNode {
  constructor() {
    super("UV");
  }

  build() {
    return {
      out: "input.uv",
      type: "vec2f"
    };
  }
}

export class TimeNode extends ShaderNode {
  constructor() {
    super("Time");
  }
  
  build(_, __, ctx) {
    return {
      out: "scene.time",
      type: "f32"
    };
  }
}

export class InlineFunctionNode extends ShaderNode {
  constructor(name = "customFn", code = "") {
    super("InlineFunction");
    this.fnName = name;
    this.code = code;
    this.inputs = {
      a: {default: "input.uv"},
      b: {default: "globals.time"}
    };
  }
  
  build(_, __, ctx) {
    ctx.registerFunction(this.fnName, this.code);
    
    const connA = ctx.shaderGraph.getInput(this, "a");
    const connB = ctx.shaderGraph.getInput(this, "b");
    
    const a = connA ? ctx.resolve(connA.fromNode, connA.fromPin) : this.inputs.a.default;
    const b = connB ? ctx.resolve(connB.fromNode, connB.fromPin) : this.inputs.b.default;
    
    return {
      out: ctx.temp("vec4f", `${this.fnName}(${a}, ${b})`),
      type: "vec4f"  // Adjust type based on your function's actual return type
    };
  }
}

export class TextureSamplerNode extends ShaderNode {
  constructor(name = "tex0") {
    super("TextureSampler");
    this.name = name;
    this.inputs = {uv: {default: "input.uv"}};
  }
  build(_, __, ctx) {
    const conn = ctx.shaderGraph.getInput(this, "uv");
    let uv;
    if(conn) {
      uv = ctx.resolve(conn.fromNode, conn.fromPin);
    } else {
      uv = this.inputs.uv.default;
    }
    
    return {
      out: ctx.temp("vec4f", `textureSample(meshTexture, meshSampler, ${uv})`),
      type: "vec4f"
    };
  }
}

export class MultiplyColorNode extends ShaderNode {
  constructor() {
    super("MultiplyColor");
    this.inputs = {
      a: {default: "vec4(1.0)"},
      b: {default: "vec4(1.0)"}
    };
  }
  build(_, __, ctx) {
    // Resolve each input properly
    const connA = ctx.shaderGraph.getInput(this, "a");
    const connB = ctx.shaderGraph.getInput(this, "b");
    
    let a, b;
    
    if(connA) {
      a = ctx.resolve(connA.fromNode, connA.fromPin);
    } else {
      a = this.inputs.a.default;
    }
    
    if(connB) {
      b = ctx.resolve(connB.fromNode, connB.fromPin);
    } else {
      b = this.inputs.b.default;
    }
    
    const t = ctx.temp("vec4f", `${a} * ${b}`);
    return {out: t, type: "vec4f"};
  }
}

export class ClampNode extends ShaderNode {
  constructor() {
    super("Clamp");
    this.inputs = {
      x: {default: "0.0"},
      min: {default: "0.0"},
      max: {default: "1.0"}
    };
  }

  build(_, __, ctx) {
    const connX = ctx.shaderGraph.getInput(this, "x");
    const connMin = ctx.shaderGraph.getInput(this, "min");
    const connMax = ctx.shaderGraph.getInput(this, "max");
    
    const x = connX ? ctx.resolve(connX.fromNode, connX.fromPin) : this.inputs.x.default;
    const min = connMin ? ctx.resolve(connMin.fromNode, connMin.fromPin) : this.inputs.min.default;
    const max = connMax ? ctx.resolve(connMax.fromNode, connMax.fromPin) : this.inputs.max.default;
    
    return {
      out: ctx.temp("f32", `clamp(${x}, ${min}, ${max})`),
      type: "f32"
    };
  }
}

export class GrayscaleNode extends ShaderNode {
  constructor() {
    super("Grayscale");
    this.inputs = {color: {default: "vec4(1.0)"}};
  }
  
  build(_, __, ctx) {
    const conn = ctx.shaderGraph.getInput(this, "color");
    const c = conn ? ctx.resolve(conn.fromNode, conn.fromPin) : this.inputs.color.default;
    
    return {
      out: ctx.temp("vec4f", `vec4(vec3(dot(${c}.rgb,vec3(0.299,0.587,0.114))),${c}.a)`),
      type: "vec4f"
    };
  }
}
export class ContrastNode extends ShaderNode {
  constructor() {
    super("Contrast");
    this.inputs = {
      color: {default: "vec4(1.0)"},
      contrast: {default: "1.0"}
    };
  }
  
  build(_, __, ctx) {
    const connColor = ctx.shaderGraph.getInput(this, "color");
    const connContrast = ctx.shaderGraph.getInput(this, "contrast");
    
    const c = connColor ? ctx.resolve(connColor.fromNode, connColor.fromPin) : this.inputs.color.default;
    const k = connContrast ? ctx.resolve(connContrast.fromNode, connContrast.fromPin) : this.inputs.contrast.default;
    
    return {
      out: ctx.temp("vec4f", `vec4(((${c}.rgb-0.5)*${k}+0.5),${c}.a)`),
      type: "vec4f"
    };
  }
}


class ConnectionLayer {
  constructor(svg, shaderGraph) {
    this.svg = svg;
    this.shaderGraph = shaderGraph;
    this.temp = null;
    this.from = null;
    document.addEventListener("pointermove", e => this.move(e));
    document.addEventListener("pointerup", e => this.up(e));
  }
  attach(pin) {
    pin.onpointerdown = e => {
      e.stopPropagation();
      if(pin.dataset.type !== "output") return;
      this.from = pin;
      this.temp = this.path();
      this.svg.appendChild(this.temp);
    };
  }

  move(e) {
    if(!this.temp || !this.from) return;
    this.draw(this.temp, this.center(this.from), {x: e.clientX, y: e.clientY});
  }

  up(e) {
    if(!this.temp || !this.from) return;
    const t = document.elementFromPoint(e.clientX, e.clientY);
    if(t?.classList.contains("pinShader") && t.dataset.type === "input") {
      this.finalize(this.from, t);
    }
    this.temp.remove();
    this.temp = this.from = null;
  }
  finalize(outPin, inPin) {
    const fromNode = this.shaderGraph.nodes.find(n => n.id === outPin.dataset.node);
    const toNode = this.shaderGraph.nodes.find(n => n.id === inPin.dataset.node);
    const fromPin = outPin.dataset.pin;
    const toPin = inPin.dataset.pin;
    this.shaderGraph.connect(fromNode, fromPin, toNode, toPin);
    this.redrawAll();
  }

  redrawAll() {
    [...this.svg.children].forEach(p => p.remove()); // remove old paths
    this.shaderGraph.connections.forEach(c => this.redrawConnection(c));
  }

  redrawConnection(conn) {
    const path = this.path();
    path.dataset.from = `${conn.fromNode.id}:${conn.fromPin}`;
    path.dataset.to = `${conn.toNode.id}:${conn.toPin}`;
    this.svg.appendChild(path);

    const a = document.querySelector(`.pinShader.output[data-node="${conn.fromNode.id}"][data-pin="${conn.fromPin}"]`);
    const b = document.querySelector(`.pinShader.input[data-node="${conn.toNode.id}"][data-pin="${conn.toPin}"]`);
    if(a && b) this.draw(path, this.center(a), this.center(b));
  }

  path() {
    const p = document.createElementNS("http://www.w3.org/2000/svg", "path");
    p.setAttribute("stroke", "#6aa9ff");
    p.setAttribute("stroke-width", "2");
    p.setAttribute("fill", "none");
    return p;
  }

  draw(p, a, b) {
    const dx = Math.abs(b.x - a.x) * 0.5;
    p.setAttribute("d", `M${a.x},${a.y} C${a.x + dx},${a.y} ${b.x - dx},${b.y} ${b.x},${b.y}`);
  }

  center(el) {
    const r = el.getBoundingClientRect();
    const svgRect = this.svg.getBoundingClientRect();
    return {
      x: r.left + r.width / 2 - svgRect.left,
      y: r.top + r.height / 2 - svgRect.top
    };
  }
}

export function openFragmentShaderEditor(id = "fragShader") {
  const shaderGraph = new FragmentShaderGraph(id);

  const root = document.createElement("div");
  root.id = "shaderDOM";
  root.style.cssText = `
    position:fixed; left: 17.5%; top:4%;
    background:#0b0e14; color:#eee;
    display:flex; font-family:monospace;
    width:300%;height:90%
  `;

  /* LEFT MENU */
  const menu = document.createElement("div");
  menu.style.cssText = `
    width:180px; border-right:1px solid #222;
    padding:8px; background:#0f1320;
  `;

  const btn = (txt, fn) => {
    const b = document.createElement("button");
    b.textContent = txt;

    b.style.cssText = "width:100%;margin:4px 0;";

    if(txt == "Compile" || txt == "Save Graph" || txt == "Load Graph") b.style.cssText += "color: orange;";

    b.classList.add("btn");
    b.classList.add("btnLeftBox");


    b.onclick = fn;
    menu.appendChild(b);
  };

  /* GRAPH AREA */
  const area = document.createElement("div");
  area.style.cssText = "flex:1;position:relative";
  area.classList.add('fancy-grid-bg');
  area.classList.add('dark');

  let pan = {active: false, ox: 0, oy: 0};
  area.addEventListener("pointerdown", e => {
    if(e.target !== area) return;
    pan.active = true;
    pan.ox = e.clientX;
    pan.oy = e.clientY;
    area.setPointerCapture(e.pointerId);
  });
  area.addEventListener("pointermove", e => {
    if(!pan.active) return;
    const dx = e.clientX - pan.ox;
    const dy = e.clientY - pan.oy;
    pan.ox = e.clientX;
    pan.oy = e.clientY;
    shaderGraph.nodes.forEach(n => {
      n.x += dx;
      n.y += dy;
      const el = document.querySelector(`.nodeShader[data-node-id="${n.id}"]`);
      if(el) {
        el.style.left = n.x + "px";
        el.style.top = n.y + "px";
      }
    });

    connectionLayer.redrawAll();
  });

  area.addEventListener("pointerup", e => {
    pan.active = false;
    area.releasePointerCapture(e.pointerId);
  });
  ///////////
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.style.position = "absolute";
  svg.style.left = "0";
  svg.style.top = "0";
  svg.style.width = "100%";
  svg.style.height = "100%";
  svg.style.pointerEvents = "none";
  area.appendChild(svg);
  root.appendChild(menu);
  root.appendChild(area);
  document.body.appendChild(root);
  const style = document.createElement("style");
  style.textContent = `
#shaderDOM { z-index:2 }

.nodeShader {
  position:absolute;
  min-width:140px;
  background:#151a2a;
  border:1px solid #222;
  border-radius:6px;
  padding:6px 8px;
  color:#eee;
  cursor:move;
}

.nodeShader.selected {
  border-color: #ff8800;
  box-shadow: 0 0 8px #ff8800;
}

.nodeShader .title {
  display: block;
  padding: 6px 8px;
  font-family: monospace;
  font-size: 13px;
  line-height: 1.2;
  color: #ffffff;
  background: #333;
  white-space: nowrap;
  position: relative;
  z-index: 10;
  user-select: none;
}

.nodeShader-body {
  display:flex;
  gap:8px;
  justify-content: space-between;
}

.nodeShader-inputs {
  display:flex;
  flex-direction:column;
}

.pinShader-row {
  position: relative;
  width: 100%;
  height: 18px;
  display: flex;
  align-items: center;
  font-family: monospace;
  font-size: 12px;
  color: #ddd;
}

.pinShader {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #0f0;
  border: 2px solid #000;
  z-index: 5;
  flex-shrink: 0;
}

 
.pinShader.input {  margin-left: -6px; background: #ff6a6a; }
.pinShader.output { margin-right: -6px; background: #6aa9ff; }

.pinShader-label {
  margin-left: 6px;
  white-space: nowrap;
  pointer-events: none;
  user-select: none;
  z-index: 6;
}

svg path {
  pointer-events:none;
}

`;
  document.head.appendChild(style);

  const connectionLayer = new ConnectionLayer(svg, shaderGraph);

  function addNode(node, x, y) {
    shaderGraph.addNode(node);
    if(x == null || y == null) {
      const p = shaderGraph.nextSpawn();
      x = p.x;
      y = p.y;
    }
    node.x = x;
    node.y = y;
    const el = document.createElement("div");
    el.className = "nodeShader";
    el.style.left = x + "px";
    el.style.top = y + "px";
    area.appendChild(el);
    el.tabIndex = 0;
    el.addEventListener("click", e => {
      e.stopPropagation();
      document.querySelectorAll(".nodeShader.selected").forEach(n => n.classList.remove("selected"));
      el.classList.add("selected");
    });
    el.dataset.nodeId = node.id;
    const title = document.createElement("div");
    title.className = "node-title";
    title.textContent = node.type;
    el.appendChild(title);
    const body = document.createElement("div");
    body.className = "nodeShader-body";
    el.appendChild(body);

    function createPinRow(pinName, type = "input") {
      const row = document.createElement("div");
      row.className = "pinShader-row";

      const pin = document.createElement("div");
      pin.className = "pinShader " + (type === "input" ? "input" : "output");
      pin.dataset.node = node.id;
      pin.dataset.pin = pinName;
      pin.dataset.type = type;

      const label = document.createElement("div");
      label.className = "pinShader-label";
      label.textContent = pinName;

      if(type === "input") row.append(pin, label);
      else {
        row.style.justifyContent = "flex-end";
        row.append(label, pin);
      }

      return {row, pin};
    }

    const inputsContainer = document.createElement("div");
    inputsContainer.className = "nodeShader-inputs";
    body.appendChild(inputsContainer);

    Object.keys(node.inputs || {}).forEach(pinName => {
      const {row, pin} = createPinRow(pinName, "input");
      inputsContainer.appendChild(row);
    });

    const outputContainer = document.createElement("div");
    outputContainer.style.width = '100%';
    body.appendChild(outputContainer);
    const {row: outRow, pin: outPin} = createPinRow("out", "output");
    outputContainer.appendChild(outRow);
    connectionLayer.attach(outPin);

    if(node.type === "InlineFunction") {
      const nameInput = document.createElement("input");
      nameInput.value = node.fnName;
      nameInput.oninput = () => (node.fnName = nameInput.value);
      el.appendChild(nameInput);

      const ta = document.createElement("textarea");
      ta.value = node.code;
      ta.style.width = "220px";
      ta.style.height = "100px";
      ta.oninput = () => (node.code = ta.value);
      el.appendChild(ta);
    }

    shaderGraph.connectionLayer = connectionLayer;
    shaderGraph.makeDraggable(el, node, connectionLayer);
  }


  document.addEventListener("keydown", e => {
    if(e.key === "Delete") {
      const sel = document.querySelector(".nodeShader.selected");
      if(!sel) return;

      const nodeId = sel.dataset.nodeId; // assign this when creating node
      const node = shaderGraph.nodes.find(n => n.id === nodeId);

      console.log('TTTTTTTTTTTTTTTT', node);

      if(!node) return;

      // remove connections involving this node
      shaderGraph.connections = shaderGraph.connections.filter(
        c => c.fromNode !== node && c.toNode !== node
      );

      // remove SVG paths
      [...svg.querySelectorAll("path")].forEach(p => {
        if(p.dataset.from?.startsWith(nodeId + ":") || p.dataset.to?.startsWith(nodeId + ":")) {
          p.remove();
        }
      });

      sel.remove();
      shaderGraph.nodes = shaderGraph.nodes.filter(n => n !== node);
      // ??????????????
      shaderGraph.connectionLayer.redrawConnection();
    }
  });

  btn("Add TextureSampler", () => addNode(new TextureSamplerNode()));
  btn("Add MultiplyColor", () => addNode(new MultiplyColorNode()));
  btn("Add Grayscale", () => addNode(new GrayscaleNode()));
  btn("Add Contrast", () => addNode(new ContrastNode()));
  btn("Add Inline WGSL", () => addNode(new InlineWGSLNode(prompt("WGSL code"))));
  btn("Add Inline Function", () => addNode(new InlineFunctionNode("customFn", "")));
  btn("Add BaseColorOutputNode", () => addNode(new BaseColorOutputNode()));
  btn("Add EmissiveOutputNode", () => addNode(new EmissiveOutputNode()));
  btn("Add LightShadowNode", () => addNode(new LightShadowNode()));
  btn("Add LightToColorNode", () => addNode(new LightToColorNode()));

  btn("Add AlphaOutputNode", () => addNode(new AlphaOutputNode()));
  btn("Add NormalOutputNode", () => addNode(new NormalOutputNode()));

  btn("Compile", () => {
    let r = shaderGraph.compile();
    const graphGenShaderWGSL = graphAdapter(r, shaderGraph.nodes);
    console.log("test compile ", graphGenShaderWGSL)
    // hard code THIS IS OK FOR NOW LEAVE IT !!
    app.mainRenderBundle[0].changeMaterial('graph', graphGenShaderWGSL);
  });

  btn("Save Graph", () => saveGraph(shaderGraph));
  btn("Load Graph", () => loadGraph("fragShaderGraph", shaderGraph, addNode));

  loadGraph("fragShaderGraph", shaderGraph, addNode);
  console.log(shaderGraph.nodes);
  if(shaderGraph.nodes.length == 0) addNode(new FragmentOutputNode(), 500, 200);
  return shaderGraph;
}

function serializeGraph(shaderGraph) {
  return JSON.stringify({
    nodes: shaderGraph.nodes.map(n => ({
      id: n.id,
      type: n.type,
      x: n.x ?? 100,
      y: n.y ?? 100,
      fnName: n.fnName,
      code: n.code,
      name: n.name,
      inputs: Object.fromEntries(Object.entries(n.inputs || {}).map(([k, v]) => [k, {default: v.default}]))
    })),
    connections: shaderGraph.connections.map(c => ({
      from: c.fromNode.id,
      fromPin: c.fromPin,
      to: c.toNode.id,
      toPin: c.toPin
    }))
  });
}

function saveGraph(shaderGraph, key = "fragShaderGraph") {
  localStorage.setItem(key, serializeGraph(shaderGraph));
  console.log("%cShader shaderGraph saved", LOG_FUNNY_ARCADE);
}

function loadGraph(key, shaderGraph, addNodeUI) {
  shaderGraph.nodes.length = 0;
  shaderGraph.connections.length = 0;
  const data = JSON.parse(localStorage.getItem(key));
  if(!data) return;
  const map = {};
  data.nodes.forEach(node => {
    const saveId = node.id;
    switch(node.type) {
      case "FragmentOutput": node = new FragmentOutputNode(); break;
      case "InlineFunction": node = new InlineFunctionNode(node.fnName, node.code); break;
      case "TextureSampler": node = new TextureSamplerNode(node.name); break;
      case "MultiplyColor": node = new MultiplyColorNode(); break;
      case "Grayscale": node = new GrayscaleNode(); break;
      case "Contrast": node = new ContrastNode(); break;
      case "FragOutput": node = new FragOutputNode(); break;
      case "BaseColorOutput": node = new BaseColorOutputNode(); break;
      case "EmissiveOutputNode": node = new EmissiveOutputNode(); break;
      case "AlphaOutputNode": node = new AlphaOutputNode(); break;
      case "NormalOutputNode": node = new NormalOutputNode(); break;
      case "LightShadowNode": node = new LightShadowNode(); break;
      case "LightToColor": node = new LightToColorNode(); break;
      case "UV": node = new UVNode(); break;
    }
    node.id = saveId;
    console.log("Loaded: " + node)
    map[node.id] = node;
    addNodeUI(node, node.x, node.y);
  });
  setTimeout(() => data.connections.forEach(c => {
    const fromNode = map[c.from];
    const toNode = map[c.to];
    const fromPin = c.fromPin;
    const toPin = c.toPin;
    if(!fromNode || !toNode) {
      console.warn("Skipping connection due to missing node", c);
      return;
    }
    shaderGraph.connect(fromNode, fromPin, toNode, toPin);
    const path = shaderGraph.connectionLayer.path();
    path.dataset.from = `${fromNode.id}:${fromPin}`;
    path.dataset.to = `${toNode.id}:${toPin}`;
    shaderGraph.connectionLayer.svg.appendChild(path);
    shaderGraph.connectionLayer.redrawAll(path);
  }), 100);
}