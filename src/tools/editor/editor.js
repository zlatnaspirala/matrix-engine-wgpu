import {MEEditorClient} from "./client";
import EditorProvider from "./editor.provider";
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
    }

    
    console.log("methodsManager", this.methodsManager);
    // this.methodsManager.lo
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
}