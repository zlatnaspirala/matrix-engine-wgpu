/**
 * @Author NIkola Lukic
 * @description
 * Web Editor for matrix-engine-wgpu
 */
export default class EditorHud {
  constructor(core) {
    this.core = core;
    this.sceneContainer = null;
    this.createEditorSceneContainer();
    this.createScenePropertyBox();
    this.currentProperties = [];
  }

  createEditorSceneContainer() {
    this.sceneContainer = document.createElement("div");
    this.sceneContainer.id = "sceneContainer";
    Object.assign(this.sceneContainer.style, {
      position: "absolute",
      top: "0",
      left: "0",
      width: "20%",
      height: "100vh",
      backgroundColor: "rgba(0,0,0,0.5)",
      display: "flex",
      alignItems: "start",
      overflow: "auto",
      color: "white",
      fontFamily: "'Orbitron', sans-serif",
      zIndex: "15",
      padding: "2px",
      boxSizing: "border-box",
      flexDirection: "column"
    });

    this.scene = document.createElement("div");
    this.scene.id = "scene";
    Object.assign(this.scene.style, {
      width: "100%",
      height: "100%",
      backgroundColor: "rgba(0,0,0,0.5)",
      display: "flex",
      alignItems: "start",
      color: "white",
      fontFamily: "'Orbitron', sans-serif",
      zIndex: "15",
      padding: "2px",
      boxSizing: "border-box",
      flexDirection: "column"
    });

    this.sceneContainerTitle = document.createElement("div");
    this.sceneContainerTitle.style.height = '40px';
    this.sceneContainerTitle.innerHTML = '[Scene container]';
    this.sceneContainer.appendChild(this.sceneContainerTitle);
    this.sceneContainer.appendChild(this.scene);
    document.body.appendChild(this.sceneContainer);
  }

  updateSceneContainer() {
    this.scene.innerHTML = ``;
    this.core.mainRenderBundle.forEach(sceneObj => {
      let so = document.createElement('div');
      so.style.height = '20px';
      so.classList.add('sceneContainerItem');
      so.innerHTML = sceneObj.name;
      so.addEventListener('click', this.updateSceneObjProperties);
      this.scene.appendChild(so);
    });
  }

  createScenePropertyBox() {
    this.sceneProperty = document.createElement("div");
    this.sceneProperty.id = "sceneProperty";
    Object.assign(this.sceneProperty.style, {
      position: "absolute",
      top: "0",
      right: "0",
      width: "20%",
      height: "100vh",
      backgroundColor: "rgba(0,0,0,0.5)",
      display: "flex",
      alignItems: "start",
      overflow: "auto",
      color: "white",
      fontFamily: "'Orbitron', sans-serif",
      zIndex: "15",
      padding: "2px",
      boxSizing: "border-box",
      flexDirection: "column"
    });

    this.objectProperies = document.createElement("div");
    this.objectProperies.id = "objectProperies";
    Object.assign(this.objectProperies.style, {
      width: "100%",
      height: "100%",
      backgroundColor: "rgba(0,0,0,0.85)",
      display: "flex",
      alignItems: "start",
      color: "white",
      fontFamily: "'Orbitron', sans-serif",
      zIndex: "15",
      padding: "2px",
      boxSizing: "border-box",
      flexDirection: "column"
    });

    this.objectProperiesTitle = document.createElement("div");
    this.objectProperiesTitle.style.height = '40px';
    this.objectProperiesTitle.innerHTML = '[Scene properties]';
    this.sceneProperty.appendChild(this.objectProperiesTitle);
    this.sceneProperty.appendChild(this.objectProperies);
    document.body.appendChild(this.sceneProperty);
  }

  updateSceneObjProperties = (e) => {
    this.currentProperties = [];
    this.objectProperiesTitle.innerHTML = `[Scene properties]`;
    this.objectProperies.innerHTML = ``;
    const currentSO = this.core.getSceneObjectByName(e.target.innerHTML);
    this.objectProperiesTitle.innerHTML = `<span style="color:lime;">Name: ${e.target.innerHTML}</span> 
      <span style="color:yellow;"> [${currentSO.constructor.name}]`;
    // console.log('getOwnPropertyDescriptor :', Object.getOwnPropertyDescriptor(currentSO, 'name'))
    const OK = Object.keys(currentSO);
    OK.forEach((prop) => {
      console.log('[key]:', prop);
      if(prop == 'glb' && typeof currentSO[prop] !== 'undefined' &&  currentSO[prop] != null) {
        this.currentProperties.push(new SceneObjectProperty(this.objectProperies, 'glb', currentSO));
      } else {
        this.currentProperties.push(new SceneObjectProperty(this.objectProperies, prop, currentSO));
      }
    })
    // Returns only enumerable properties.
    // const enumObj = Object.getOwnPropertyNames(currentSO);
    // console.log('what is enumObj ', enumObj);
  }
}

class SceneObjectProperty {
  constructor(parentDOM, propName, currSceneObj) {
    this.propName = document.createElement("div");
    this.propName.innerHTML = `<div>${propName}</div>`;
    this.propName.innerHTML = `<div>${currSceneObj[propName]}</div>`;
    console.log('currSceneObj[propName] ', currSceneObj[propName]);
    parentDOM.appendChild(this.propName);
  }
}