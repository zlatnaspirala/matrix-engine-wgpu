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
      backgroundColor: "rgba(0,0,0,0.85)",
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

    this.sceneContainerTitle = document.createElement("div");
    this.sceneContainerTitle.style.height = '40px';
    this.sceneContainerTitle.innerHTML = '<b>Scene container</b>';
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
    this.sceneProperty.classList.add('scenePropItem');
    Object.assign(this.sceneProperty.style, {
      position: "absolute",
      top: "0",
      right: "0",
      width: "20%",
      height: "100vh",
      backgroundColor: "rgba(0,0,0,0.85)",
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
    this.objectProperiesTitle.style.fontSize = '120%';
    this.objectProperiesTitle.innerHTML = '----Scene properties----';
    this.sceneProperty.appendChild(this.objectProperiesTitle);
    this.sceneProperty.appendChild(this.objectProperies);
    document.body.appendChild(this.sceneProperty);
  }

  updateSceneObjProperties = (e) => {
    this.currentProperties = [];
    this.objectProperiesTitle.style.fontSize = '120%';
    this.objectProperiesTitle.innerHTML = `----Scene properties----`;
    this.objectProperies.innerHTML = ``;
    const currentSO = this.core.getSceneObjectByName(e.target.innerHTML);
    this.objectProperiesTitle.innerHTML = `<span style="color:lime;">Name: ${e.target.innerHTML}</span> 
      <span style="color:yellow;"> [${currentSO.constructor.name}]`;
    const OK = Object.keys(currentSO);
    OK.forEach((prop) => {
      // console.log('[key]:', prop);
      if(prop == 'glb' && typeof currentSO[prop] !== 'undefined' && currentSO[prop] != null) {
        this.currentProperties.push(new SceneObjectProperty(this.objectProperies, 'glb', currentSO));
      } else {
        this.currentProperties.push(new SceneObjectProperty(this.objectProperies, prop, currentSO));
      }
    })
  }
}

class SceneObjectProperty {
  constructor(parentDOM, propName, currSceneObj) {
    this.subObjectsProps = [];
    this.propName = document.createElement("div");
    this.propName.style.width = '100%';
    // console.log(propName)
    if(propName == "device" || propName == "position") {
      this.propName.style.overflow = 'hidden';
      this.propName.style.height = '20px';
      this.propName.addEventListener('click', (e) => {
        if(e.currentTarget.style.height != 'unset') {
          e.currentTarget.style.height = 'unset';
        } else {
          e.currentTarget.style.height = '20px';
        }
      })

      if(propName == "position") {
        this.propName.innerHTML = `<div>${propName} <span style="border-radius:7px;background:purple;">sceneObj</span>
        <span style="border-radius:6px;background:gray;">More info🔽</span></div>`;
      } else {
        this.propName.innerHTML = `<div>${propName} <span style="border-radius:7px;background:red;">sys</span> 
        <span style="border-radius:6px;background:gray;">More info🔽</span></div>`;
      }



      if(typeof currSceneObj[propName].adapterInfo !== 'undefined') {
        this.exploreSubObject(currSceneObj[propName].adapterInfo, 'adapterInfo').forEach((item) => {
          if(typeof item === 'string') {
            this.propName.innerHTML += `<div style="text-align:left;"> ${item.split(':'[1])} </div>`;
          } else {
            item.addEventListener('click', (event) => {
              event.stopPropagation();
            });
            this.propName.appendChild(item);
          }
        })
      } else if(propName == 'position') {
        console.log('[propName] ', propName);
        console.log('currSceneObj[propName] ', currSceneObj[propName]);
        this.exploreSubObject(currSceneObj[propName], 'position').forEach((item) => {
          if(typeof item === 'string') {
            this.propName.innerHTML += `<div style="text-align:left;"> ${item.split(':'[1])} </div>`;
          } else {
            item.addEventListener('click', (event) => {
              event.stopPropagation();
            });
            this.propName.appendChild(item);
          }
        })
      }

      parentDOM.appendChild(this.propName);
    } else {
      // this.propName.innerHTML = `<div>${propName}</div>`;
      // this.propName.innerHTML += `<div>${currSceneObj[propName]}</div>`;
    }
  }

  exploreSubObject(subobj, rootKey) {
    let a = []; let __ = [];
    for(const key in subobj) {
      __.push(key);
    }
    __.forEach((prop, index) => {
      if(index == 0) a.push(`${rootKey}`);
      let d = null;
      d = document.createElement("div");
      d.style.textAlign = "left";
      d.style.display = "flex";
      if(typeof subobj[prop] === 'number') {
        d.innerHTML += `<div style="width:50%;">${prop}</div> 
         <div style="width:48%; background:lime;color:black;" > <input type="number" value="${subobj[prop]}" /> </div>`;
      } else if(Array.isArray(subobj[prop])) {
        d.innerHTML += `<div style="width:50%">${prop}</div> 
         <div style="width:${( subobj[prop].length == 0 ? "unset" : "48%" )}; background:lime;color:black;" > ${ ( subobj[prop].length == 0 ? "[Empty array]" : subobj[prop] ) } </div>`;
      } else if (subobj[prop] === null) {
        d.innerHTML += `<div style="width:50%;">${prop}</div> 
         <div style="width:unset; background:lime;color:black;padding:1px;border-radius:5px;" >${subobj[prop]}</div>`;
      }else {
        d.innerHTML += `<div style="width:50%;">${prop}</div> 
         <div style="width:48%; background:lime;color:black;padding:1px;border-radius:5px;" >${subobj[prop]}</div>`;
      }

      a.push(d);
    });
    // this.subObjectsProps.push(a);
    return a;
  }
}