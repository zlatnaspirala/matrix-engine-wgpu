

export default class EditorHud {
  constructor() {
    this.sceneContainer = null;
    this.createEditorSceneContainer();
  }

  createEditorSceneContainer() {
    // Left BOX
    this.sceneContainer = document.createElement("div");
    this.sceneContainer.id = "sceneContainer";
    Object.assign(sceneContainer.style, {
      position: "absolute",
      top: "0",
      left: "0",
      width: "20%",
      height: "100vh",
      backgroundColor: "rgba(0,0,0,0.5)",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-around",
      color: "white",
      fontFamily: "'Orbitron', sans-serif",
      zIndex: "15",
      padding: "3px",
      boxSizing: "border-box"
    });

    document.body.appendChild(this.sceneContainer);
  }

}