/**
 * @description
 * For now it is posible for editor to work on fly
 * with no memory/saves.
 */

export default class EditorProvider {
  constructor(core) {
    this.core = core;
    this.addEditorEvents();
  }

  addEditorEvents() {
    document.addEventListener('web.editor.input', (e) => {
      console.log("[EDITOR] sceneObj: ", e.detail.inputFor);
      console.log("[EDITOR] sceneObj: ", e.detail.propertyId);
      console.log("[EDITOR] sceneObj: ", e.detail.property);

      // InFly Method
      let sceneObj = this.core.getSceneObjectByName(e.detail.inputFor);
      if (sceneObj) {
        sceneObj[e.detail.propertyId][e.detail.property] = e.detail.value;
      } else {
        console.warn("EditorProvider input error");
        return;
      }

    })
  }
}