import {byId} from "../../engine/utils";
import {MEEditorClient} from "./client";
import EditorProvider from "./editor.provider";
import {openFragmentShaderEditor} from "./flexCodexShader";
import FluxCodexVertex from "./fluxCodexVertex";
import EditorHud from "./hud";
import MethodsManager from "./methodsManager";

export class Editor {

  constructor(core, a, projName) {
    this.core = core;
    this.methodsManager = new MethodsManager(this.check(a));
    this.editorHud = new EditorHud(core, this.check(a));
    this.editorProvider = new EditorProvider(core, this.check(a));
    if(this.check(a) == 'pre editor') {
      this.client = new MEEditorClient(this.check(a));
    } else if(this.check(a) == 'created from editor') {

      document.addEventListener('editorx-ws-ready', () => {
        openFragmentShaderEditor().then((e) => {
          byId('shaderDOM').style.display = 'none';
          app.shaderGraph = e;
          console.log('AUTO INIT app.shaderGraph', app.shaderGraph)
        })
      });

      this.client = new MEEditorClient(this.check(a), projName);
      // Visual Scripting
      this.createFluxCodexVertexDOM();

      setTimeout(() => {
        console.log("MOMENT BEFORE COSTRUCT MAIN GRAPH")
        this.fluxCodexVertex = new FluxCodexVertex('board', 'boardWrap', 'log', this.methodsManager, projName);
        setTimeout(() => {
          this.fluxCodexVertex.updateLinks();
        }, 3000);
      }, 1500);
    }
    // console.log("methodsManager", this.methodsManager);
  }

  check(a) {
    if(typeof a !== 'undefined' && a == "created from editor") {
      return a;
    } else if(typeof a !== 'undefined' && a == "pre editor") {
      return a;
    } else {
      return "infly";
    }
  }

  createFluxCodexVertexDOM() {
    let FCV = document.createElement('div');
    FCV.id = 'app';
    FCV.style.display = 'none';
    FCV.style.opacity = 1;
    // test async 
    // setTimeout(() => FCV.style.display = 'none' , 200);
    FCV.innerHTML = `
    <div id="leftBar">
      <span>Events/Func</span>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.addNode('event')">Event: onLoad</button>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.addNode('onDraw')">Event: onDraw</button>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.addNode('onKey')">Event: onKey</button>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.addNode('eventCustom')">Custom Event</button>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.addNode('dispatchEvent')">Dispatch Event</button>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.addNode('function')">Function</button>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.addNode('if')">If Branch</button>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.addNode('genrand')">GenRandInt</button>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.addNode('print')">Print</button>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.addNode('timeout')">SetTimeout</button>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.addNode('getArray')">getArray</button>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.addNode('forEach')">forEach</button>
      <span>Scene objects [agnostic]</span>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.addNode('getSceneObject')">Get scene object</button>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.addNode('getObjectAnimation')">Get Object Animation</button>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.addNode('setPosition')">Set position</button>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.addNode('getShaderGraph')">Get shader graph</button>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.addNode('setSpeed')">Set Speed</button>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.addNode('getSpeed')">Get Speed</button>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.addNode('setRotation')">Set rotation</button>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.addNode('setRotate')">Set Rotate</button>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.addNode('setRotateX')">Set RotateX</button>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.addNode('setRotateY')">Set RotateY</button>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.addNode('setRotateZ')">Set RotateZ</button>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.addNode('translateByX')">TranslateByX</button>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.addNode('translateByY')">TranslateByY</button>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.addNode('translateByZ')">TranslateByZ</button>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.addNode('onTargetPositionReach')">onTarget PositionReach</button>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.addNode('rayHitEvent')">Ray Hit Event</button>

      <span>Dinamics</span>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.addNode('dynamicFunction')">Function Dinamic</button>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.addNode('getSubObject')">Get Sub Object</button>

      <span>Data mod</span>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.addNode('curveTimeline')">Curve Timeline</button>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.addNode('oscillator')">Oscillator</button>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.addNode('getNumberLiteral')">Get Number Literal</button>


      <span>Networking</span>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.addNode('fetch')">Fetch</button>
      <span>Media</span>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.addNode('audioMP3')">Add Mp3</button>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.addNode('setVideoTexture')">Set Video Tex[Mp4]</button>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.addNode('setCanvasInlineTexture')">Set Canvas2d Inline Tex</button>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.addNode('audioReactiveNode')">Audio Reactive Node</button>

      <span>Physics</span>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.addNode('generator')">Generator in place</button>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.addNode('generatorWall')">Generate Wall</button>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.addNode('generatorPyramid')">Generate Pyramid</button>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.addNode('setForceOnHit')">Set Force On Hit</button>

      <span>String Operations</span>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.addNode('startsWith')">Starts With</button>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.addNode('startsWith')">Starts With</button>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.addNode('endsWith')">Ends With</button>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.addNode('includes')">includes</button>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.addNode('toUpperCase')">toUpperCase</button>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.addNode('toLowerCase')">toLowerCase</button>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.addNode('trim')">Trim</button>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.addNode('length')">Length</button>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.addNode('substring')">Substring</button>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.addNode('startsWith')">Replace</button>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.addNode('startsWith')">Split</button>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.addNode('concat')">Concat</button>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.addNode('isEmpty')">isEmpty</button>

      <span>Math</span>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.addNode('add')">Add (+)</button>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.addNode('sub')">Sub (-)</button>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.addNode('mul')">Mul (*)</button>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.addNode('div')">Div (/)</button>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.addNode('sin')">Sin</button>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.addNode('cos')">Cos</button>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.addNode('pi')">Pi</button>
      <span>COMPARISON</span>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.addNode('equal')">Equal (==)</button>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.addNode('notequal')">Not Equal (!=)</button>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.addNode('greater')">Greater (>)</button>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.addNode('less')">Less (<)</button>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.addNode('greaterEqual')">Greater/Equal (>=)</button>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.addNode('lessEqual')">Less/Equal (<=)</button>
      <hr style="border:none; height:1px; background:rgba(255,255,255,0.03); margin:10px 0;">
      <span>Compile FluxCodexVertex</span>
      <button style="color:#00bcd4;" class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.compileGraph()">Save Graph</button>
      <button style="color:#00bcd4;" class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.clearStorage();">Clear All</button>
      <button style="color:#00bcd4;" class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.runGraph()">Run (F6)</button>
      <hr style="border:none; height:1px; background:rgba(255,255,255,0.03); margin:10px 0;">
      <button style="color: lime;" class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.exportToJSON()">Export (JSON)</button>
      <button style="color: lime;" class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex._importInput.click()">Import (JSON)</button>

      <pre id="log" aria-live="polite"></pre>
    </div>
    <div id="boardWrap">
      <div id="board">
        <svg class="connections"></svg>
      </div>
    </div>
    `;
    document.body.appendChild(FCV);
  }
}