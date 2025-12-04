import EditorProvider from "./editor.provider";
import EditorHud from "./hud";

export class Editor {
  constructor(core, a) {
    this.core = core;
    this.editorHud = new EditorHud(core);
    this.editorProvider = new EditorProvider(core);

    if (typeof a !== 'undefined' && a=="") {

    }
    this.client = new MEEditorClient();
  }
}