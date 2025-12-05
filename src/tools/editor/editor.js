import {MEEditorClient} from "./client";
import EditorProvider from "./editor.provider";
import EditorHud from "./hud";

export class Editor {

  constructor(core, a) {
    this.core = core;
    this.editorHud = new EditorHud(core, this.check(a));
    this.editorProvider = new EditorProvider(core, this.check(a));
    if(this.check(a) == 'created from editor' || this.check(a) == 'pre editor') {
      this.client = new MEEditorClient(this.check(a));
    }
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