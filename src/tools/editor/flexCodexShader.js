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
import {byId, LOG_FUNNY_ARCADE} from "../../engine/utils.js";
import {graphAdapter} from "./flexCodexShaderAdapter.js";

export const FragmentShaderRegistry = {};

export class FragmentShaderGraph {
  constructor(id) {
    this.id = id;
    this.nodes = [];
    this.connections = [];
    this.spawnX = 80;
    this.spawnY = 80;
    this.spawnStepX = 220;
    this.spawnStepY = 140;
    this.spawnCol = 0;
    this.runtimeList = [];
    this.runtime_memory = {};
    this.onGraphLoadAttached = false;
  }

  addNode(node) {
    if(node.type === "FragmentOutput") {
      const exists = this.nodes.some(n => n.type === "FragmentOutput");
      if(exists) {
        console.warn("FragmentOutput already exists");
        return null;
      }
    }
    this.nodes.push(node); return node;
  }

  connect(fromNode, fromPin, toNode, toPin) {
    this.connections = this.connections.filter(c => !(c.toNode === toNode && c.toPin === toPin));
    this.connections.push({fromNode, fromPin, toNode, toPin});
  }

  getInput(node, pin) {
    return this.connections.find(c => c.toNode === node && c.toPin === pin);
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

  clear() {
    this.nodes = [];
    this.connections = [];
    this.spawnX = 80;
    this.spawnY = 80;
    this.spawnCol = 0;
    if(this.connectionLayer) {
      this.connectionLayer.svg.innerHTML = '';
    }
    const container = document.getElementsByClassName("fancy-grid-bg dark");
    if(container) {
      const nodeElements = container[0].querySelectorAll('.nodeShader');
      nodeElements.forEach(el => el.remove());
    }
    this.connectionLayer.redrawAll();
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
      // console.log('value = this.resolve(conn.fromNode, conn.fromPin); ', value)
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
    // console.log('From FragmentOutputNode ctx.outputs.outColor', ctx.outputs.outColor);
    return {out: ctx.outputs.outColor, type: "vec4f"};
  }
}

export class AlphaOutput extends ShaderNode {
  constructor() {
    super("AlphaOutput");
    this.inputs = {alpha: {default: "1.0"}};
  }

  build(_, __, ctx) {
    ctx.outputs.alpha = ctx.resolve(this, "alpha");
    return {out: ctx.outputs.alpha};
  }
}

export class NormalOutput extends ShaderNode {
  constructor() {
    super("NormalOutput");
    this.inputs = {normal: {default: "input.normal"}};
  }

  build(_, __, ctx) {
    ctx.outputs.normal = ctx.resolve(this, "normal");
    return {out: ctx.outputs.normal};
  }
}

// STANDARD SOME STUFF ARE PREDEFINED ALREADY IN ADAPTER
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

export class AddVec2Node extends ShaderNode {
  constructor() {
    super("AddVec2");
    this.inputs = {
      a: {default: "vec2f(0.0)"},
      b: {default: "vec2f(0.0)"}
    };
  }

  build(_, __, ctx) {
    const connA = ctx.shaderGraph.getInput(this, "a");
    const connB = ctx.shaderGraph.getInput(this, "b");

    const a = connA ? ctx.resolve(connA.fromNode, connA.fromPin) : this.inputs.a.default;
    const b = connB ? ctx.resolve(connB.fromNode, connB.fromPin) : this.inputs.b.default;

    return {
      out: ctx.temp("vec2f", `${a} + ${b}`),
      type: "vec2f"
    };
  }
}

export class CameraPosNode extends ShaderNode {
  constructor() {
    super("CameraPos");
  }
  build(_, __, ctx) {
    return {
      out: "scene.cameraPos",
      type: "vec3f"
    };
  }
}

export class MultiplyVec2Node extends ShaderNode {
  constructor() {
    super("MultiplyVec2");
    this.inputs = {
      a: {default: "vec2f(1.0)"},
      b: {default: "1.0"}  // Can be scalar or vec2
    };
  }

  build(_, __, ctx) {
    const connA = ctx.shaderGraph.getInput(this, "a");
    const connB = ctx.shaderGraph.getInput(this, "b");

    const a = connA ? ctx.resolve(connA.fromNode, connA.fromPin) : this.inputs.a.default;
    const b = connB ? ctx.resolve(connB.fromNode, connB.fromPin) : this.inputs.b.default;

    return {
      out: ctx.temp("vec2f", `${a} * ${b}`),
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
      type: "vec4f"
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

// CONSTANT/LITERAL NODES
export class FloatNode extends ShaderNode {
  constructor(value = 1.0) {
    super("Float");
    this.value = value;
  }

  build(_, __, ctx) {
    return {
      out: `${this.value}`,
      type: "f32"
    };
  }
}

export class Vec2Node extends ShaderNode {
  constructor(vx = 0.0, vy = 0.0) {
    super("Vec2");
    this.valueX = vx;  // ✅ Store vector X value
    this.valueY = vy;  // ✅ Store vector Y value
  }

  build(_, __, ctx) {
    return {
      out: `vec2f(${this.valueX}, ${this.valueY})`,  // ✅ Use valueX, valueY
      type: "vec2f"
    };
  }
}

export class Vec3Node extends ShaderNode {
  constructor(vx = 0.0, vy = 0.0, vz = 0.0) {
    super("Vec3");
    this.valueX = vx;
    this.valueY = vy;
    this.valueZ = vz;
  }

  build(_, __, ctx) {
    return {
      out: `vec3f(${this.valueX}, ${this.valueY}, ${this.valueZ})`,
      type: "vec3f"
    };
  }
}

export class Vec4Node extends ShaderNode {
  constructor(vx = 0.0, vy = 0.0, vz = 0.0, vw = 1.0) {
    super("Vec4");
    this.valueX = vx;
    this.valueY = vy;
    this.valueZ = vz;
    this.valueW = vw;
  }

  build(_, __, ctx) {
    return {
      out: `vec4f(${this.valueX}, ${this.valueY}, ${this.valueZ}, ${this.valueW})`,
      type: "vec4f"
    };
  }
}

export class ColorNode extends ShaderNode {
  constructor(r = 1.0, g = 1.0, b = 1.0, a = 1.0) {
    super("Color");
    this.r = r;
    this.g = g;
    this.b = b;
    this.a = a;
  }

  build(_, __, ctx) {
    return {
      out: `vec4f(${this.r}, ${this.g}, ${this.b}, ${this.a})`,
      type: "vec4f"
    };
  }
}

// MATH NODES
export class AddNode extends ShaderNode {
  constructor() {
    super("Add");
    this.inputs = {
      a: {default: "0.0"},
      b: {default: "0.0"}
    };
  }

  build(_, __, ctx) {
    const connA = ctx.shaderGraph.getInput(this, "a");
    const connB = ctx.shaderGraph.getInput(this, "b");

    const a = connA ? ctx.resolve(connA.fromNode, connA.fromPin) : this.inputs.a.default;
    const b = connB ? ctx.resolve(connB.fromNode, connB.fromPin) : this.inputs.b.default;

    return {
      out: ctx.temp("f32", `${a} + ${b}`),
      type: "f32"
    };
  }
}

export class SubtractNode extends ShaderNode {
  constructor() {
    super("Subtract");
    this.inputs = {
      a: {default: "0.0"},
      b: {default: "0.0"}
    };
  }

  build(_, __, ctx) {
    const connA = ctx.shaderGraph.getInput(this, "a");
    const connB = ctx.shaderGraph.getInput(this, "b");

    const a = connA ? ctx.resolve(connA.fromNode, connA.fromPin) : this.inputs.a.default;
    const b = connB ? ctx.resolve(connB.fromNode, connB.fromPin) : this.inputs.b.default;

    return {
      out: ctx.temp("f32", `${a} - ${b}`),
      type: "f32"
    };
  }
}

export class MultiplyNode extends ShaderNode {
  constructor() {
    super("Multiply");
    this.inputs = {
      a: {default: "1.0"},
      b: {default: "1.0"}
    };
  }

  build(_, __, ctx) {
    const connA = ctx.shaderGraph.getInput(this, "a");
    const connB = ctx.shaderGraph.getInput(this, "b");

    const a = connA ? ctx.resolve(connA.fromNode, connA.fromPin) : this.inputs.a.default;
    const b = connB ? ctx.resolve(connB.fromNode, connB.fromPin) : this.inputs.b.default;

    return {
      out: ctx.temp("f32", `${a} * ${b}`),
      type: "f32"
    };
  }
}

export class DivideNode extends ShaderNode {
  constructor() {
    super("Divide");
    this.inputs = {
      a: {default: "1.0"},
      b: {default: "1.0"}
    };
  }

  build(_, __, ctx) {
    const connA = ctx.shaderGraph.getInput(this, "a");
    const connB = ctx.shaderGraph.getInput(this, "b");

    const a = connA ? ctx.resolve(connA.fromNode, connA.fromPin) : this.inputs.a.default;
    const b = connB ? ctx.resolve(connB.fromNode, connB.fromPin) : this.inputs.b.default;

    return {
      out: ctx.temp("f32", `${a} / ${b}`),
      type: "f32"
    };
  }
}

export class PowerNode extends ShaderNode {
  constructor() {
    super("Power");
    this.inputs = {
      base: {default: "1.0"},
      exponent: {default: "2.0"}
    };
  }

  build(_, __, ctx) {
    const connBase = ctx.shaderGraph.getInput(this, "base");
    const connExp = ctx.shaderGraph.getInput(this, "exponent");

    const base = connBase ? ctx.resolve(connBase.fromNode, connBase.fromPin) : this.inputs.base.default;
    const exp = connExp ? ctx.resolve(connExp.fromNode, connExp.fromPin) : this.inputs.exponent.default;

    return {
      out: ctx.temp("f32", `pow(${base}, ${exp})`),
      type: "f32"
    };
  }
}

export class SqrtNode extends ShaderNode {
  constructor() {
    super("Sqrt");
    this.inputs = {
      value: {default: "1.0"}
    };
  }

  build(_, __, ctx) {
    const conn = ctx.shaderGraph.getInput(this, "value");
    const val = conn ? ctx.resolve(conn.fromNode, conn.fromPin) : this.inputs.value.default;

    return {
      out: ctx.temp("f32", `sqrt(${val})`),
      type: "f32"
    };
  }
}

export class AbsNode extends ShaderNode {
  constructor() {
    super("Abs");
    this.inputs = {
      value: {default: "0.0"}
    };
  }

  build(_, __, ctx) {
    const conn = ctx.shaderGraph.getInput(this, "value");
    const val = conn ? ctx.resolve(conn.fromNode, conn.fromPin) : this.inputs.value.default;

    return {
      out: ctx.temp("f32", `abs(${val})`),
      type: "f32"
    };
  }
}

export class MinNode extends ShaderNode {
  constructor() {
    super("Min");
    this.inputs = {
      a: {default: "0.0"},
      b: {default: "0.0"}
    };
  }

  build(_, __, ctx) {
    const connA = ctx.shaderGraph.getInput(this, "a");
    const connB = ctx.shaderGraph.getInput(this, "b");

    const a = connA ? ctx.resolve(connA.fromNode, connA.fromPin) : this.inputs.a.default;
    const b = connB ? ctx.resolve(connB.fromNode, connB.fromPin) : this.inputs.b.default;

    return {
      out: ctx.temp("f32", `min(${a}, ${b})`),
      type: "f32"
    };
  }
}

export class MaxNode extends ShaderNode {
  constructor() {
    super("Max");
    this.inputs = {
      a: {default: "0.0"},
      b: {default: "0.0"}
    };
  }

  build(_, __, ctx) {
    const connA = ctx.shaderGraph.getInput(this, "a");
    const connB = ctx.shaderGraph.getInput(this, "b");

    const a = connA ? ctx.resolve(connA.fromNode, connA.fromPin) : this.inputs.a.default;
    const b = connB ? ctx.resolve(connB.fromNode, connB.fromPin) : this.inputs.b.default;

    return {
      out: ctx.temp("f32", `max(${a}, ${b})`),
      type: "f32"
    };
  }
}

export class LerpNode extends ShaderNode {
  constructor() {
    super("Lerp");
    this.inputs = {
      a: {default: "0.0"},
      b: {default: "1.0"},
      t: {default: "0.5"}
    };
  }

  build(_, __, ctx) {
    const connA = ctx.shaderGraph.getInput(this, "a");
    const connB = ctx.shaderGraph.getInput(this, "b");
    const connT = ctx.shaderGraph.getInput(this, "t");

    const a = connA ? ctx.resolve(connA.fromNode, connA.fromPin) : this.inputs.a.default;
    const b = connB ? ctx.resolve(connB.fromNode, connB.fromPin) : this.inputs.b.default;
    const t = connT ? ctx.resolve(connT.fromNode, connT.fromPin) : this.inputs.t.default;

    return {
      out: ctx.temp("f32", `mix(${a}, ${b}, ${t})`),
      type: "f32"
    };
  }
}

export class SinNode extends ShaderNode {
  constructor() {
    super("Sin");
    this.inputs = {
      value: {default: "0.0"}
    };
  }

  build(_, __, ctx) {
    const conn = ctx.shaderGraph.getInput(this, "value");
    const val = conn ? ctx.resolve(conn.fromNode, conn.fromPin) : this.inputs.value.default;

    return {
      out: ctx.temp("f32", `sin(${val})`),
      type: "f32"
    };
  }
}

export class CosNode extends ShaderNode {
  constructor() {
    super("Cos");
    this.inputs = {
      value: {default: "0.0"}
    };
  }

  build(_, __, ctx) {
    const conn = ctx.shaderGraph.getInput(this, "value");
    const val = conn ? ctx.resolve(conn.fromNode, conn.fromPin) : this.inputs.value.default;

    return {
      out: ctx.temp("f32", `cos(${val})`),
      type: "f32"
    };
  }
}

export class TanNode extends ShaderNode {
  constructor() {
    super("Tan");
    this.inputs = {
      value: {default: "0.0"}
    };
  }

  build(_, __, ctx) {
    const conn = ctx.shaderGraph.getInput(this, "value");
    const val = conn ? ctx.resolve(conn.fromNode, conn.fromPin) : this.inputs.value.default;

    return {
      out: ctx.temp("f32", `tan(${val})`),
      type: "f32"
    };
  }
}

// VECTOR OPERATIONS
export class DotProductNode extends ShaderNode {
  constructor() {
    super("DotProduct");
    this.inputs = {
      a: {default: "vec3f(0.0)"},
      b: {default: "vec3f(0.0)"}
    };
  }

  build(_, __, ctx) {
    const connA = ctx.shaderGraph.getInput(this, "a");
    const connB = ctx.shaderGraph.getInput(this, "b");

    const a = connA ? ctx.resolve(connA.fromNode, connA.fromPin) : this.inputs.a.default;
    const b = connB ? ctx.resolve(connB.fromNode, connB.fromPin) : this.inputs.b.default;

    return {
      out: ctx.temp("f32", `dot(${a}, ${b})`),
      type: "f32"
    };
  }
}

export class CrossProductNode extends ShaderNode {
  constructor() {
    super("CrossProduct");
    this.inputs = {
      a: {default: "vec3f(0.0)"},
      b: {default: "vec3f(0.0)"}
    };
  }

  build(_, __, ctx) {
    const connA = ctx.shaderGraph.getInput(this, "a");
    const connB = ctx.shaderGraph.getInput(this, "b");

    const a = connA ? ctx.resolve(connA.fromNode, connA.fromPin) : this.inputs.a.default;
    const b = connB ? ctx.resolve(connB.fromNode, connB.fromPin) : this.inputs.b.default;

    return {
      out: ctx.temp("vec3f", `cross(${a}, ${b})`),
      type: "vec3f"
    };
  }
}

export class NormalizeNode extends ShaderNode {
  constructor() {
    super("Normalize");
    this.inputs = {
      vector: {default: "vec3f(1.0)"}
    };
  }

  build(_, __, ctx) {
    const conn = ctx.shaderGraph.getInput(this, "vector");
    const vec = conn ? ctx.resolve(conn.fromNode, conn.fromPin) : this.inputs.vector.default;

    return {
      out: ctx.temp("vec3f", `normalize(${vec})`),
      type: "vec3f"
    };
  }
}

export class LengthNode extends ShaderNode {
  constructor() {
    super("Length");
    this.inputs = {
      vector: {default: "vec3f(0.0)"}
    };
  }

  build(_, __, ctx) {
    const conn = ctx.shaderGraph.getInput(this, "vector");
    const vec = conn ? ctx.resolve(conn.fromNode, conn.fromPin) : this.inputs.vector.default;

    return {
      out: ctx.temp("f32", `length(${vec})`),
      type: "f32"
    };
  }
}

// CHANNEL/SWIZZLE NODES
export class SplitVec4Node extends ShaderNode {
  constructor() {
    super("SplitVec4");
    this.inputs = {
      vector: {default: "vec4f(0.0)"}
    };
    // This node has multiple outputs!
  }

  build(pin, __, ctx) {
    const conn = ctx.shaderGraph.getInput(this, "vector");
    const vec = conn ? ctx.resolve(conn.fromNode, conn.fromPin) : this.inputs.vector.default;

    // Store the temp once
    if(!this._temp) {
      this._temp = ctx.temp("vec4f", vec);
    }

    // Return different components based on which output pin is being resolved
    switch(pin) {
      case "x": return {out: `${this._temp}.x`, type: "f32"};
      case "y": return {out: `${this._temp}.y`, type: "f32"};
      case "z": return {out: `${this._temp}.z`, type: "f32"};
      case "w": return {out: `${this._temp}.w`, type: "f32"};
      default: return {out: this._temp, type: "vec4f"};
    }
  }
}

export class CombineVec4Node extends ShaderNode {
  constructor() {
    super("CombineVec4");
    this.inputs = {
      x: {default: "0.0"},
      y: {default: "0.0"},
      z: {default: "0.0"},
      w: {default: "1.0"}
    };
  }

  build(_, __, ctx) {
    const connX = ctx.shaderGraph.getInput(this, "x");
    const connY = ctx.shaderGraph.getInput(this, "y");
    const connZ = ctx.shaderGraph.getInput(this, "z");
    const connW = ctx.shaderGraph.getInput(this, "w");

    const x = connX ? ctx.resolve(connX.fromNode, connX.fromPin) : this.inputs.x.default;
    const y = connY ? ctx.resolve(connY.fromNode, connY.fromPin) : this.inputs.y.default;
    const z = connZ ? ctx.resolve(connZ.fromNode, connZ.fromPin) : this.inputs.z.default;
    const w = connW ? ctx.resolve(connW.fromNode, connW.fromPin) : this.inputs.w.default;

    return {
      out: ctx.temp("vec4f", `vec4f(${x}, ${y}, ${z}, ${w})`),
      type: "vec4f"
    };
  }
}

// UTILITY NODES
export class FracNode extends ShaderNode {
  constructor() {
    super("Frac");
    this.inputs = {
      value: {default: "0.0"}
    };
  }

  build(_, __, ctx) {
    const conn = ctx.shaderGraph.getInput(this, "value");
    const val = conn ? ctx.resolve(conn.fromNode, conn.fromPin) : this.inputs.value.default;

    return {
      out: ctx.temp("f32", `fract(${val})`),
      type: "f32"
    };
  }
}

export class FloorNode extends ShaderNode {
  constructor() {
    super("Floor");
    this.inputs = {
      value: {default: "0.0"}
    };
  }

  build(_, __, ctx) {
    const conn = ctx.shaderGraph.getInput(this, "value");
    const val = conn ? ctx.resolve(conn.fromNode, conn.fromPin) : this.inputs.value.default;

    return {
      out: ctx.temp("f32", `floor(${val})`),
      type: "f32"
    };
  }
}

export class CeilNode extends ShaderNode {
  constructor() {
    super("Ceil");
    this.inputs = {
      value: {default: "0.0"}
    };
  }

  build(_, __, ctx) {
    const conn = ctx.shaderGraph.getInput(this, "value");
    const val = conn ? ctx.resolve(conn.fromNode, conn.fromPin) : this.inputs.value.default;

    return {
      out: ctx.temp("f32", `ceil(${val})`),
      type: "f32"
    };
  }
}

export class SmoothstepNode extends ShaderNode {
  constructor() {
    super("Smoothstep");
    this.inputs = {
      edge0: {default: "0.0"},
      edge1: {default: "1.0"},
      x: {default: "0.5"}
    };
  }

  build(_, __, ctx) {
    const connEdge0 = ctx.shaderGraph.getInput(this, "edge0");
    const connEdge1 = ctx.shaderGraph.getInput(this, "edge1");
    const connX = ctx.shaderGraph.getInput(this, "x");

    const edge0 = connEdge0 ? ctx.resolve(connEdge0.fromNode, connEdge0.fromPin) : this.inputs.edge0.default;
    const edge1 = connEdge1 ? ctx.resolve(connEdge1.fromNode, connEdge1.fromPin) : this.inputs.edge1.default;
    const x = connX ? ctx.resolve(connX.fromNode, connX.fromPin) : this.inputs.x.default;

    return {
      out: ctx.temp("f32", `smoothstep(${edge0}, ${edge1}, ${x})`),
      type: "f32"
    };
  }
}

export class OneMinusNode extends ShaderNode {
  constructor() {
    super("OneMinus");
    this.inputs = {
      value: {default: "0.0"}
    };
  }

  build(_, __, ctx) {
    const conn = ctx.shaderGraph.getInput(this, "value");
    const val = conn ? ctx.resolve(conn.fromNode, conn.fromPin) : this.inputs.value.default;

    return {
      out: ctx.temp("f32", `1.0 - ${val}`),
      type: "f32"
    };
  }
}

// INPUT NODES
export class FragmentPositionNode extends ShaderNode {
  constructor() {
    super("FragmentPosition");
  }

  build(_, __, ctx) {
    return {
      out: "input.fragPos",
      type: "vec3f"
    };
  }
}

export class FragmentNormalNode extends ShaderNode {
  constructor() {
    super("FragmentNormal");
  }

  build(_, __, ctx) {
    return {
      out: "input.fragNorm",
      type: "vec3f"
    };
  }
}

export class ViewDirectionNode extends ShaderNode {
  constructor() {
    super("ViewDirection");
  }

  build(_, __, ctx) {
    return {
      out: ctx.temp("vec3f", "normalize(scene.cameraPos - input.fragPos)"),
      type: "vec3f"
    };
  }
}

export class GlobalAmbientNode extends ShaderNode {
  constructor() {
    super("GlobalAmbient");
  }

  build(_, __, ctx) {
    return {
      out: "scene.globalAmbient",
      type: "vec3f"
    };
  }
}

// export class InlineWGSLNode {
//   constructor(code = "return vec4f(1.0, 0.0, 0.0, 1.0);") {
//     this.id = nodeId++;
//     this.type = "InlineWGSL";
//     this.code = code;
//     this.label = "Inline WGSL";

//     this.inputs = {};
//     this.outputs = {
//       result: {type: "vec4f"}
//     };
//   }

//   build(pin, value, ctx) {
//     if(pin === "result") {
//       const fnName = `inlineWGSL_${this.id}`;

//       const fnCode = `
// fn ${fnName}() -> vec4f {
//   ${this.code}
// }`;

//       ctx.registerFunction(fnName, fnCode);
//       const out = ctx.temp("vec4f", `${fnName}()`);

//       return {out};
//     }
//   }
// }
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

export async function openFragmentShaderEditor(id = "fragShader") {
  return new Promise((resolve, reject) => {
    const shaderGraph = new FragmentShaderGraph(id);
    const root = document.createElement("div");
    root.id = "shaderDOM";
    root.style.cssText = `
    position:fixed; left: 17.5%; top:4%;
    background:#0b0e14; color:#eee;
    display:flex; font-family:system-ui;
    width:300%;height:90%
  `;
    root.style.display = 'none';
    /* LEFT MENU */
    const menu = document.createElement("div");
    menu.style.cssText = `
    width:200px; border-right:1px solid #222;
    padding:8px; background:#0f1320; height: 77vh; overflow: scroll;
  `;
    const btn = (txt, fn) => {
      const b = document.createElement("button");
      b.textContent = txt;
      b.style.cssText = "width:100%;margin:4px 0;";
      if(txt == "Compile All" || txt == "Compile" || txt == "Save Graph" || txt == "Load Graph") b.style.cssText += "color: orange;";
      if(txt == "Create New") b.style.cssText += "color: lime;";
      if(txt == "Delete") b.style.cssText += "color: red;";
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
  padding:0;
  color:#eee;
  cursor:move;
}

.nodeShader.selected {
  border-color: #ff8800;
  box-shadow: 0 0 8px #ff8800;
}

.nodeShader .node-title {
  -webkit-text-stroke-width: 0.2px;
  display: block;
  padding: 6px 8px;
  font-size: 13px;
  line-height: 1.2;
  color: #ffffff;
  background: #1f2937;
  white-space: nowrap;
  position: relative;
  z-index: 10;
  user-select: none;
  border-radius: 6px 6px 0 0;
  border-bottom: 1px solid #333;
}

.node-properties {
  padding: 6px 8px;
  background: #1a1f2e;
  border-bottom: 1px solid #333;
}

.node-properties input,
.node-properties textarea {
  font-family: monospace;
}

.node-properties input:focus,
.node-properties textarea:focus {
  outline: none;
  border-color: #6aa9ff;
}

.nodeShader-body {
  display:flex;
  gap:8px;
  justify-content: space-between;
  padding: 6px 8px;
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
      const test = shaderGraph.addNode(node);
      if(test == null) return;
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

      // ✅ ADD INPUT FIELDS FOR NODE PROPERTIES
      const propsContainer = document.createElement("div");
      propsContainer.className = "node-properties";
      propsContainer.style.cssText = "padding: 4px 8px; background: #1a1f2e;";

      // Helper to create labeled input
      function addPropertyInput(label, propName, value, type = "number", step = "0.01") {
        const row = document.createElement("div");
        row.style.cssText = "display: flex; align-items: center; gap: 6px; margin: 2px 0;";

        const labelEl = document.createElement("label");
        labelEl.textContent = label + ":";
        labelEl.style.cssText = "font-size: 11px; color: #aaa; min-width: 30px;";

        const input = document.createElement("input");
        input.type = type;
        input.value = value;
        input.step = step;
        input.style.cssText = "flex: 1; background: #0a0d14; border: 1px solid #333; color: #fff; padding: 2px 4px; font-size: 11px; border-radius: 3px;";

        input.addEventListener("input", () => {
          const val = type === "number" ? parseFloat(input.value) : input.value;
          node[propName] = val;
        });

        input.addEventListener("pointerdown", e => e.stopPropagation());

        row.appendChild(labelEl);
        row.appendChild(input);
        propsContainer.appendChild(row);
      }

      // ✅ ADD PROPERTIES BASED ON NODE TYPE
      if(node.type === "Float") {
        addPropertyInput("Value", "value", node.value);
      }
      else if(node.type === "Vec2") {
        addPropertyInput("X", "valueX", node.valueX || 0);
        addPropertyInput("Y", "valueY", node.valueY || 0);
      }
      else if(node.type === "Vec3") {
        addPropertyInput("X", "valueX", node.valueX || 0);
        addPropertyInput("Y", "valueY", node.valueY || 0);
        addPropertyInput("Z", "valueZ", node.valueZ || 0);
      }
      else if(node.type === "Vec4") {
        addPropertyInput("X", "valueX", node.valueX || 0);
        addPropertyInput("Y", "valueY", node.valueY || 0);
        addPropertyInput("Z", "valueZ", node.valueZ || 0);
        addPropertyInput("W", "valueW", node.valueW || 1);
      }
      else if(node.type === "Color") {
        addPropertyInput("R", "r", node.r);
        addPropertyInput("G", "g", node.g);
        addPropertyInput("B", "b", node.b);
        addPropertyInput("A", "a", node.a);
      } else if(node.type === "AddVec2") {
        // This node has vec2 inputs, but users typically connect nodes
        // If you want to show defaults:
        addPropertyInput("Default A", "defaultA", node.inputs.a.default);
        addPropertyInput("Default B", "defaultB", node.inputs.b.default);
      }

      else if(node.type === "InlineFunction") {
        addPropertyInput("Name", "fnName", node.fnName, "text");

        const ta = document.createElement("textarea");
        ta.value = node.code;
        ta.style.cssText = "width: 100%; height: 80px; background: #0a0d14; border: 1px solid #333; color: #fff; padding: 4px; font-family: monospace; font-size: 11px; resize: vertical;";
        ta.oninput = () => (node.code = ta.value);
        ta.onpointerdown = e => e.stopPropagation();
        propsContainer.appendChild(ta);
      }

      if(propsContainer.children.length > 0) {
        el.appendChild(propsContainer);
      }

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

      shaderGraph.connectionLayer = connectionLayer;
      shaderGraph.makeDraggable(el, node, connectionLayer);
    }

    document.addEventListener("keydown", e => {
      if(e.key === "Delete") {
        const sel = document.querySelector(".nodeShader.selected");
        if(!sel) return;
        const nodeId = sel.dataset.nodeId;
        const node = shaderGraph.nodes.find(n => n.id === nodeId);
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
        // ?
        shaderGraph.connectionLayer.redrawConnection();
      }
    });

    btn("outColor", () => addNode(new FragmentOutputNode(), 500, 200));
    btn("CameraPos", () => addNode(new CameraPosNode()));
    btn("MultiplyVec2", () => addNode(new MultiplyVec2Node()));
    btn("Time", () => addNode(new TimeNode()));
    btn("AddVec2", () => addNode(new AddVec2Node()));
    btn("GlobalAmbient", () => addNode(new GlobalAmbientNode()));
    btn("TextureSampler", () => addNode(new TextureSamplerNode()));
    btn("MultiplyColor", () => addNode(new MultiplyColorNode()));
    btn("Grayscale", () => addNode(new GrayscaleNode()));
    btn("Contrast", () => addNode(new ContrastNode()));
    // btn("Inline WGSL", () => addNode(new InlineWGSLNode(prompt("WGSL code"))));
    btn("Inline Function", () => addNode(new InlineFunctionNode("customFn", "")));
    // btn("BaseColorOutputNode", () => addNode(new BaseColorOutputNode()));
    // btn("EmissiveOutputNode", () => addNode(new EmissiveOutputNode()));
    btn("LightShadowNode", () => addNode(new LightShadowNode()));
    btn("LightToColorNode", () => addNode(new LightToColorNode()));
    btn("AlphaOutput", () => addNode(new AlphaOutput()));
    btn("NormalOutput", () => addNode(new NormalOutput()));
    // Constants
    btn("Float", () => {
      const val = prompt("Enter float value:", "1.0");
      addNode(new FloatNode(parseFloat(val) || 1.0));
    });
    btn("UV", () => addNode(new UVNode(1, 0)));
    btn("Vec3", () => addNode(new Vec3Node(1, 0, 0)));
    btn("Vec2", () => addNode(new Vec2Node(1, 0)));
    btn("Color", () => addNode(new ColorNode(1, 1, 1, 1)));
    // Math
    btn("Add", () => addNode(new AddNode()));
    btn("Multiply", () => addNode(new MultiplyNode()));
    btn("Power", () => addNode(new PowerNode()));
    btn("Lerp", () => addNode(new LerpNode()));
    // Trig
    btn("Sin", () => addNode(new SinNode()));
    btn("Cos", () => addNode(new CosNode()));
    // Vector
    btn("Normalize", () => addNode(new NormalizeNode()));
    btn("DotProduct", () => addNode(new DotProductNode()));
    btn("Length", () => addNode(new LengthNode()));
    // Utility
    btn("Frac", () => addNode(new FracNode()));
    btn("OneMinus", () => addNode(new OneMinusNode()));
    btn("Smoothstep", () => addNode(new SmoothstepNode()));
    // Inputs
    btn("FragPosition", () => addNode(new FragmentPositionNode()));
    btn("FragNormal", () => addNode(new FragmentNormalNode()));
    btn("ViewDirection", () => addNode(new ViewDirectionNode()));
    // Channel ops
    btn("SplitVec4", () => addNode(new SplitVec4Node()));
    btn("CombineVec4", () => addNode(new CombineVec4Node()));

    btn("Create New", async () => {
      shaderGraph.clear();
      let nameOfGraphMaterital = prompt("You must define a name for shader graph:", "MyShader1");
      if(nameOfGraphMaterital && nameOfGraphMaterital !== "") {
        const exist = await loadGraph(nameOfGraphMaterital, shaderGraph, addNode);
        if(exist === true) {
          console.info("ALREADY EXIST SHADER, please use diff name" + exist);
        } else {
          shaderGraph.id = nameOfGraphMaterital;
          saveGraph(shaderGraph, nameOfGraphMaterital);
        }
      }
    });

    btn("Compile", () => {
      let r = shaderGraph.compile();
      const graphGenShaderWGSL = graphAdapter(r, shaderGraph.nodes);
      // console.log("test compile ", graphGenShaderWGSL);
      shaderGraph.runtime_memory[shaderGraph.id] = graphGenShaderWGSL;
    });

    btn("Compile All", () => {
      for(let x = 0;x < shaderGraph.runtimeList.length;x++) {
        setTimeout(() => {
          byId('shader-graphs-list').selectedIndex = x + 1;
          const event = new Event('change', {bubbles: true});
          byId('shader-graphs-list').dispatchEvent(event);
          if(shaderGraph.runtimeList.length == x) {
            console.log('LAST');
          }
        }, 500 * x);
      }
    });

    btn("Save Graph", () => {
      saveGraph(shaderGraph, shaderGraph.id);
    });

    btn("Load Graph", async () => {
      shaderGraph.clear();
      let nameOfGraphMaterital = prompt("Choose Name:", "MyShader1");
      const exist = await loadGraph(nameOfGraphMaterital, shaderGraph, addNode);
      if(exist === false) {
        alert("⚠️Graph no exist!⚠️");
      }
    });

    btn("Delete", () => {
      console.log("[DELETE]", shaderGraph.id);
      document.dispatchEvent(new CustomEvent('delete-shader-graph', {detail: shaderGraph.id}));
    });

    btn("Import JSON", async () => {
      shaderGraph.clear();
      let nameOfGraphMaterital = prompt("You must define a name for shader graph:", "MyShader1");
      if(nameOfGraphMaterital && nameOfGraphMaterital !== "") {
        const exist = await loadGraph(nameOfGraphMaterital, shaderGraph, addNode);
        if(exist === true) {
          console.info("ALREADY EXIST SHADER, please use diff name" + exist);
        } else {
          shaderGraph.id = nameOfGraphMaterital;
          console.info("ADAPT DATA FROM JSON - name assinged");
          // importJSON(shaderGraph);
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
                let data = JSON.parse(reader.result);
                data.id = shaderGraph.id;
                console.log("test import json", data);
                console.log("test import json", shaderGraph.id);
                document.dispatchEvent(new CustomEvent('on-graph-load', {detail: {name: data.id, content: data}}));
                input.remove();
              } catch(err) {
                console.error("Invalid JSON file", err);
              }
            };
            reader.readAsText(file);
          };
          document.body.appendChild(input);
          input.click();
          // saveGraph(shaderGraph, nameOfGraphMaterital);
        }
      }
    });

    // gobal for now next:
    // direct connection with FluxCOdexVertex vs ShaderGraph
    // document.addEventListener("give-me-shader", () => {  });

    const titleb = document.createElement("p");
    // titleb.id = "shader-graphs-list";
    titleb.style.cssText = "width:100%;margin:4px 0;";
    titleb.classList.add("btn3");
    titleb.classList.add("btnLeftBox");
    titleb.innerHTML = `Current shader:`;
    titleb.style.webkitTextStrokeWidth = 0;
    menu.appendChild(titleb);

    const b = document.createElement("select");
    b.id = "shader-graphs-list";
    b.style.cssText = "width:100%;margin:4px 0;";
    b.classList.add("btn");
    b.classList.add("btnLeftBox");
    b.style.webkitTextStrokeWidth = 0;
    menu.appendChild(b);

    document.addEventListener("on-shader-graphs-list", (e) => {
      // console.log("on-shader-graphs-list :", e.detail);
      const shaders = e.detail;
      b.innerHTML = "";
      var __ = 0;
      if(!byId("shader-graphs-list-dom")) {
        __ = 1;
        const placeholder = document.createElement("option");
        placeholder.id = "shader-graphs-list-dom";
        placeholder.textContent = "Select shader";
        placeholder.value = "";
        placeholder.disabled = true;
        placeholder.selected = true;
        b.appendChild(placeholder);
      }

      shaderGraph.runtimeList = [];
      shaders.forEach((shader, index) => {
        const opt = document.createElement("option");
        opt.value = index;
        opt.textContent = shader.name;
        shaderGraph.runtimeList.push(shader.name);
        let test = JSON.parse(shader.content);
        // console.log("Graph content shader:", test.final);
        shaderGraph.runtime_memory[shader.name] = test.final;
        b.appendChild(opt);
      });

      if(__ == 1) {
        b.onchange = (event) => {
          shaderGraph.clear();
          const selectedIndex = event.target.value;
          const selectedShader = shaders[selectedIndex];
          console.log("Selected shader:", selectedShader.name);
          // console.log("Graph content:", selectedShader.content);
          // There is a other way - compile and assign - no cache policy
          // const exist = loadGraph(selectedShader.name, shaderGraph, addNode);
          document.dispatchEvent(new CustomEvent('load-shader-graph', {detail: selectedShader.name}));
          console.log("Lets load selectedShader.name ", selectedShader.name);
        };
      }
      document.dispatchEvent(new CustomEvent("sgraphs-ready", {}));
    });

    document.dispatchEvent(new CustomEvent('get-shader-graphs', {}));
    // Init
    document.addEventListener("sgraphs-ready", async () => {
      if(shaderGraph.runtimeList.length > 0) {
        // load first
        shaderGraph.id = shaderGraph.runtimeList[0];
        const exist = await loadGraph(shaderGraph.id, shaderGraph, addNode);
        if(exist == false) {
          saveGraph(shaderGraph, shaderGraph.id);
          console.log("NEW SHADER:[SAVED]" + exist);
        }
      } else {
        console.log('no saved graphs');
      }
      resolve(shaderGraph);
    });
    // if(shaderGraph.nodes.length == 0) addNode(new FragmentOutputNode(), 500, 200);
  })
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
      value: n.value,
      r: n.r, g: n.g, b: n.b, a: n.a,
      inputs: Object.fromEntries(Object.entries(n.inputs || {}).map(([k, v]) => [k, {default: v.default}])),

      valueX: n.valueX,
      valueY: n.valueY,
      valueZ: n.valueZ,
      valueW: n.valueW,
    })),
    connections: shaderGraph.connections.map(c => ({
      from: c.fromNode.id,
      fromPin: c.fromPin,
      to: c.toNode.id,
      toPin: c.toPin
    })),
    final: shaderGraph.runtime_memory[shaderGraph.id] ? shaderGraph.runtime_memory[shaderGraph.id] : null
  });
}

function saveGraph(shaderGraph, key = "fragShaderGraph") {
  let content = serializeGraph(shaderGraph);
  localStorage.setItem(key, content);
  console.log('test compile content', shaderGraph.runtime_memory[key]);
  console.log('test compile content', content);
  if(shaderGraph.runtime_memory[key]) {
    // content.runtime_memory = shaderGraph.runtime_memory[key];
  } else {
    console.warn("GraphShader is saved for src but with no compile final data for prod build.");
  }
  document.dispatchEvent(new CustomEvent('save-shader-graph', {
    detail: {
      name: key,
      content: content
    }
  }));
  console.log("%cShader shaderGraph saved", LOG_FUNNY_ARCADE);
}

async function loadGraph(key, shaderGraph, addNodeUI) {
  // shaderGraph.clear();
  // Editor is not aware where is project file 
  // It is in generated file&folder event projectName is defined
  // Its not good to write import for project file here in middle of engine core...
  if(shaderGraph.onGraphLoadAttached === false) {
    shaderGraph.onGraphLoadAttached = true;
    document.addEventListener('on-graph-load', (e) => {
      if(e.detail == null) {return;}
      shaderGraph.nodes.length = 0;
      shaderGraph.connections.length = 0;
      shaderGraph.id = e.detail.name;
      let data;
      if(typeof e.detail.content === 'object') {
        data = e.detail.content;
      } else {
        data = JSON.parse(e.detail.content);
      }
      if(!data) return false;
      const map = {};
      data.nodes.forEach(node => {
        const saveId = node.id;
        const saveX = node.x;
        const saveY = node.y;
        switch(node.type) {
          case "FragmentOutput": node = new FragmentOutputNode(); break;
          case "CameraPos": node = new CameraPosNode(); break;
          case "MultiplyVec2": node = new MultiplyVec2Node(); break;
          case "AddVec2": node = new AddVec2Node; break;
          case "Time": node = new TimeNode(); break;
          case "InlineFunction": node = new InlineFunctionNode(node.fnName, node.code); break;
          case "TextureSampler": node = new TextureSamplerNode(node.name); break;
          case "MultiplyColor": node = new MultiplyColorNode(); break;
          case "Grayscale": node = new GrayscaleNode(); break;
          case "Contrast": node = new ContrastNode(); break;
          case "AlphaOutput": node = new AlphaOutput(); break;
          case "NormalOutput": node = new NormalOutput(); break;
          case "LightShadowNode": node = new LightShadowNode(); break;
          case "LightToColor": node = new LightToColorNode(); break;
          case "UV": node = new UVNode(); break;
          case "Float": node = new FloatNode(node.value ?? 1.0); break;
          case "Vec2": node = new Vec2Node(node.valueX ?? 0, node.valueY ?? 0); break;
          case "Vec3": node = new Vec3Node(node.valueX ?? 0, node.valueY ?? 0, node.valueZ ?? 0); break;
          case "Vec4": node = new Vec4Node(node.valueX ?? 0, node.valueY ?? 0, node.valueZ ?? 0, node.valueW ?? 1); break;
          case "Color": node = new ColorNode(node.r ?? 1, node.g ?? 1, node.b ?? 1, node.a ?? 1); break;
          case "Add": node = new AddNode(); break;
          case "Subtract": node = new SubtractNode(); break;
          case "Multiply": node = new MultiplyNode(); break;
          case "Divide": node = new DivideNode(); break;
          case "Power": node = new PowerNode(); break;
          case "Sin": node = new SinNode(); break;
          case "Cos": node = new CosNode(); break;
          case "Normalize": node = new NormalizeNode(); break;
          case "DotProduct": node = new DotProductNode(); break;
          case "Lerp": node = new LerpNode(); break;
          case "Frac": node = new FracNode(); break;
          case "OneMinus": node = new OneMinusNode(); break;
          case "Smoothstep": node = new SmoothstepNode(); break;
          case "FragmentPosition": node = new FragmentPositionNode(); break;
          case "ViewDirection": node = new ViewDirectionNode(); break;
          case "SplitVec4": node = new SplitVec4Node(); break;
          case "CombineVec4": node = new CombineVec4Node(); break;
          case "GlobalAmbient": node = new GlobalAmbientNode(); break;
        }
        node.id = saveId;
        node.x = saveX;
        node.y = saveY;
        // console.log("Loaded:" + node)
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
      }), 50);

      // compile every loaded
      // let r = shaderGraph.compile();
      // const graphGenShaderWGSL = graphAdapter(r, shaderGraph.nodes);
      // console.log("test compile shaderGraph.final ", shaderGraph.final);
      // shaderGraph.runtime_memory[shaderGraph.id] = graphGenShaderWGSL;
      return true;
    });
  }
  document.dispatchEvent(new CustomEvent('load-shader-graph', {detail: key}));
}

function importJSON(shaderGraph) {

  // this._importInput = input;
}