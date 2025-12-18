import {MEEditorClient} from "./client";
import EditorProvider from "./editor.provider";
import FluxCodexVertex from "./fluxCodexVertex";
import EditorHud from "./hud";
import MethodsManager from "./methodsManager";

// import methodsContainer from './';

export class Editor {

  constructor(core, a, projName) {
    this.core = core;
    this.methodsManager = new MethodsManager(this.check(a));
    this.editorHud = new EditorHud(core, this.check(a));
    this.editorProvider = new EditorProvider(core, this.check(a));
    if(this.check(a) == 'pre editor') {
      this.client = new MEEditorClient(this.check(a));
    } else if(this.check(a) == 'created from editor') {
      this.client = new MEEditorClient(this.check(a), projName);
      // Visual Scripting
      this.createFluxCodexVertexDOM();
      setTimeout(() => {
        this.fluxCodexVertex = new FluxCodexVertex('board', 'boardWrap', 'log', this.methodsManager)
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
      <h3>Events/Func</h3>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.addNode('event')">Event: onLoad</button>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.addNode('function')">Function</button>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.addNode('if')">If Branch</button>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.addNode('genrand')">GenRandInt</button>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.addNode('print')">Print</button>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.addNode('timeout')">SetTimeout</button>
      <hr style="border:none; height:1px; background:rgba(255,255,255,0.03); margin:10px 0;">
      <span>Scene objects</span>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.addNode('getSceneObject')">Get scene object</button>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.addNode('setPosition')">Set position</button>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.addNode('translateByX')">TranslateByX</button>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.addNode('translateByY')">TranslateByY</button>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.addNode('translateByZ')">TranslateByZ</button>
      
      <hr style="border:none; height:1px; background:rgba(255,255,255,0.03); margin:10px 0;">
      <span>Math</span>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.addNode('add')">Add (+)</button>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.addNode('sub')">Sub (-)</button>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.addNode('mul')">Mul (*)</button>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.addNode('div')">Div (/)</button>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.addNode('sin')">Sin</button>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.addNode('cos')">Cos</button>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.addNode('pi')">Pi</button>
      <hr style="border:none; height:1px; background:rgba(255,255,255,0.03); margin:10px 0;">
      <span>COMPARISON</span>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.addNode('equal')">Equal (==)</button>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.addNode('notequal')">Not Equal (!=)</button>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.addNode('greater')">Greater (>)</button>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.addNode('less')">Less (<)</button>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.addNode('greaterEqual')">Greater/Equal (>=)</button>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.addNode('lessEqual')">Less/Equal (<=)</button>
      <hr style="border:none; height:1px; background:rgba(255,255,255,0.03); margin:10px 0;">
      <hr style="border:none; height:1px; background:rgba(255,255,255,0.03); margin:10px 0;">
      <span>Compile FluxCodexVertex</span>
      <button style="color:orangered;" class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.compileGraph()">Save to LocalStorage</button>
      <button style="color:red;" class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.clearStorage();">Clear Save</button>
      <button style="color:orangered;" class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.runGraph()">Run (F6)</button>
      <hr style="border:none; height:1px; background:rgba(255,255,255,0.03); margin:10px 0;">
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex.exportToJSON()">Export (JSON)</button>
      <button class="btn4 btnLeftBox" onclick="app.editor.fluxCodexVertex._importInput.click()">Import (JSON)</button>

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