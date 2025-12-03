import {byId, isMobile, jsonHeaders, mb} from "../../engine/utils.js";

/**
 * @Author NIkola Lukic
 * @description
 * Web Editor for matrix-engine-wgpu
 */
export default class EditorHud {
  constructor(core) {
    this.core = core;
    this.sceneContainer = null;
    // this.createTopMenu();
    this.createTopMenuInFly();
    this.createEditorSceneContainer();
    this.createScenePropertyBox();
    this.currentProperties = [];
  }

  createTopMenu() {
    this.editorMenu = document.createElement("div");
    this.editorMenu.id = "editorMenu";
    Object.assign(this.editorMenu.style, {
      position: "absolute",
      top: "0",
      left: "20%",
      width: "60%",
      height: "50px;",
      backgroundColor: "rgba(0,0,0,0.85)",
      display: "flex",
      alignItems: "start",
      // overflow: "auto",
      color: "white",
      fontFamily: "'Orbitron', sans-serif",
      zIndex: "15",
      padding: "2px",
      boxSizing: "border-box",
      flexDirection: "row"
    });
    this.editorMenu.innerHTML = " PROJECT MENU  ";
    // document.body.appendChild(this.editorMenu);

    this.editorMenu.innerHTML = `
    <div class="top-item">
      <div class="top-btn">Project ▾</div>
      <div class="dropdown">
      <div class="drop-item">📦 Create new project</div>
      <div class="drop-item">📂 Load</div>
      <div class="drop-item">💾 Save</div>
      <div class="drop-item">🛠️ Build</div>
      </div>
    </div>

    <div class="top-item">
      <div class="top-btn">Insert ▾</div>
      <div class="dropdown">
        <div class="drop-item">🧊 Cube</div>
        <div class="drop-item">⚪ Sphere</div>
        <div class="drop-item">📦 GLB (model)</div>
        <div class="drop-item">💡 Light</div>
      </div>
    </div>

    <div class="top-item">
      <div class="top-btn">View ▾</div>
      <div class="dropdown">
        <div class="drop-item">Hide Editor UI</div>
        <div class="drop-item">FullScreen</div>
      </div>
    </div>

    <div class="top-item">
      <div class="top-btn">About ▾</div>
      <div class="dropdown">
        <div id="showAboutEditor" class="drop-item">matrix-engine-wgpu</div>
      </div>
    </div>
  `;

    document.body.appendChild(this.editorMenu);

    // Mobile friendly toggles
    this.editorMenu.querySelectorAll(".top-btn").forEach(btn => {
      btn.addEventListener("click", e => {
        const menu = e.target.nextElementSibling;

        // close others
        this.editorMenu.querySelectorAll(".dropdown").forEach(d => {
          if(d !== menu) d.style.display = "none";
        });

        // toggle
        menu.style.display =
          menu.style.display === "block" ? "none" : "block";
      });
    });

    // Close on outside tap
    document.addEventListener("click", e => {
      if(!this.editorMenu.contains(e.target)) {
        this.editorMenu.querySelectorAll(".dropdown").forEach(d => {
          d.style.display = "none";
        });
      }
    });

    this.showAboutModal = () => {
      alert(`
  ✔️ Support for 3D objects and scene transformations
  ✔️ Ammo.js physics full integration
  ✔️ Networking with Kurento/OpenVidu/Own middleware Nodejs -> frontend
  🎯 Replicate matrix-engine (WebGL) features
        `);
    }
    byId('showAboutEditor').addEventListener('click', this.showAboutModal);

  }

  createTopMenuInFly() {
    this.editorMenu = document.createElement("div");
    this.editorMenu.id = "editorMenu";
    Object.assign(this.editorMenu.style, {
      position: "absolute",
      top: "0",
      left: "20%",
      width: "60%",
      height: "50px;",
      backgroundColor: "rgba(0,0,0,0.85)",
      display: "flex",
      alignItems: "start",
      // overflow: "auto",
      color: "white",
      fontFamily: "'Orbitron', sans-serif",
      zIndex: "15",
      padding: "2px",
      boxSizing: "border-box",
      flexDirection: "row"
    });
    this.editorMenu.innerHTML = " PROJECT MENU  ";
    // document.body.appendChild(this.editorMenu);

    this.editorMenu.innerHTML = `
    <div>INFLY Regime of work no saves. Nice for runtime debugging or get data for map setup.</div>
    <div class="top-item">
      <div class="top-btn">About ▾</div>
      <div class="dropdown">
        <div id="showAboutEditor" class="drop-item">matrix-engine-wgpu</div>
      </div>
    </div>
  `;

    document.body.appendChild(this.editorMenu);

    // Mobile friendly toggles
    this.editorMenu.querySelectorAll(".top-btn").forEach(btn => {
      btn.addEventListener("click", e => {
        const menu = e.target.nextElementSibling;

        // close others
        this.editorMenu.querySelectorAll(".dropdown").forEach(d => {
          if(d !== menu) d.style.display = "none";
        });

        // toggle
        menu.style.display =
          menu.style.display === "block" ? "none" : "block";
      });
    });

    // Close on outside tap
    document.addEventListener("click", e => {
      if(!this.editorMenu.contains(e.target)) {
        this.editorMenu.querySelectorAll(".dropdown").forEach(d => {
          d.style.display = "none";
        });
      }
    });

    this.showAboutModal = () => {
      alert(`
  ✔️ Support for 3D objects and scene transformations
  ✔️ Ammo.js physics full integration
  ✔️ Networking with Kurento/OpenVidu/Own middleware Nodejs -> frontend
  🎯 Replicate matrix-engine (WebGL) features
        `);
    }
    byId('showAboutEditor').addEventListener('click', this.showAboutModal);

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
    this.sceneContainerTitle.style.fontSize = (isMobile() == true ? "x-larger" : "larger");
    this.sceneContainerTitle.style.padding = '5px';
    this.sceneContainerTitle.innerHTML = 'Scene container';
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
      height: "auto",
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
    this.objectProperiesTitle.innerHTML = 'Scene object properties';
    this.sceneProperty.appendChild(this.objectProperiesTitle);
    this.sceneProperty.appendChild(this.objectProperies);
    document.body.appendChild(this.sceneProperty);
  }

  updateSceneObjProperties = (e) => {
    this.currentProperties = [];
    this.objectProperiesTitle.style.fontSize = '120%';
    this.objectProperiesTitle.innerHTML = `Scene object properties`;
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
    // console.log("init : " + propName)
    // Register
    if(propName == "device" || propName == "position" || propName == "rotation"
      || propName == "raycast" || propName == "entityArgPass" || propName == "scale"
      || propName == "maxInstances" || propName == "texturesPaths" || propName == "glb"
    ) {
      this.propName.style.overflow = 'hidden';
      this.propName.style.height = '20px';
      this.propName.style.borderBottom = 'solid lime 2px';
      this.propName.addEventListener('click', (e) => {
        if(e.currentTarget.style.height != 'fit-content') {
          this.propName.style.overflow = 'unset';
          e.currentTarget.style.height = 'fit-content';
        } else {
          this.propName.style.overflow = 'hidden';
          e.currentTarget.style.height = '20px';
        }
      })

      if(propName == "position" || propName == "scale" || propName == "rotation" || propName == "glb") {
        this.propName.innerHTML = `<div style="text-align:left;" >${propName} <span style="border-radius:7px;background:purple;">sceneObj</span>
        <span style="border-radius:6px;background:gray;">More info🔽</span></div>`;
      } else if(propName == "entityArgPass") {
        this.propName.innerHTML = `<div style="text-align:left;" >${propName} <span style="border-radius:7px;background:brown;">webGPU props</span>
        <span style="border-radius:6px;background:gray;">More info🔽</span></div>`;
      } else if(propName == "maxInstances") {
        this.propName.innerHTML = `<div style="text-align:left;" >${propName} <span style="border-radius:7px;background:brown;">instanced</span>
        <span style="border-radius:6px;background:gray;"> <input type="number" value="${currSceneObj[propName]}" /> </span></div>`;
      } else if(propName == "texturesPaths") {
        this.propName.innerHTML = `<div style="text-align:left;" >${propName} <span style="border-radius:7px;background:purple;">sceneObj</span>
         <span style="border-radius:6px;background:gray;"> 
           Path: ${currSceneObj[propName]} 
         </span>
           <div style="text-align:center;padding:5px;margin:5px;"> <img src="${currSceneObj[propName]}" width="256px" height="auto" /> </div>
        </div>`;
      } else {
        this.propName.innerHTML = `<div style="text-align:left;" >${propName} <span style="border-radius:7px;background:red;">sys</span> 
        <span style="border-radius:6px;background:gray;">${currSceneObj[propName]}</span></div>`;
      }
      // console.log('[propName] ', propName);
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
      } else if(
        propName == 'position' ||
        propName == 'rotation' ||
        propName == "raycast" ||
        propName == "entityArgPass" ||
        propName == "scale") {

        // console.log('currSceneObj[propName] ', currSceneObj[propName]);
        this.exploreSubObject(currSceneObj[propName], propName, currSceneObj).forEach((item) => {
          if(typeof item === 'string') {
            this.propName.innerHTML += `<div style="text-align:left;"> ${item.split(':'[1])} </div>`;
          } else {
            item.addEventListener('click', (event) => {
              event.stopPropagation();
            });
            this.propName.appendChild(item);
          }
        })
      } else if(propName == 'glb') {
        this.exploreGlb(currSceneObj[propName], propName, currSceneObj).forEach((item) => {
          if(typeof item === 'string') {
            this.propName.innerHTML += `<div style="text-align:left;"> ${item.split(':'[1])} </div>`;
          } else {
            item.addEventListener('click', (event) => {
              event.stopPropagation();
            });
            this.propName.appendChild(item);
          }
        });
      }

      parentDOM.appendChild(this.propName);

    } else if(propName == "isVideo") {
      this.propName.style.borderBottom = 'solid lime 2px';
      this.propName.innerHTML = `<div style="text-align:left;" >${propName} <span style="border-radius:7px;background:deepskyblue;">boolean</span>
        <span style="border-radius:6px;background:gray;">${currSceneObj[propName]}</span></div>`;
      parentDOM.appendChild(this.propName);
    } else {
      // this.propName.innerHTML = `<div>${propName}</div>`;
      // this.propName.innerHTML += `<div>${currSceneObj[propName]}</div>`;
    }
  }

  exploreSubObject(subobj, rootKey, currSceneObj) {
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
         <div style="width:48%; background:lime;color:black;" > 

         <input class="inputEditor" name="${prop}" 
          onchange="console.log(this.value, 'change fired'); 
          document.dispatchEvent(new CustomEvent('web.editor.input', {detail: {
           'inputFor': ${currSceneObj ? "'" + currSceneObj.name + "'" : "'no info'"} ,
           'propertyId': ${currSceneObj ? "'" + rootKey + "'" : "'no info'"} ,
           'property': ${currSceneObj ? "'" + prop + "'" : "'no info'"} ,
           'value': ${currSceneObj ? "this.value" : "'no info'"}
          }}))" 
         ${(rootKey == "adapterInfo" ? " disabled='true'" : " ")} type="number" value="${subobj[prop]}" /> 
        
         </div>`;
      } else if(Array.isArray(subobj[prop])) {
        d.innerHTML += `<div style="width:50%">${prop}</div> 
         <div style="width:${(subobj[prop].length == 0 ? "unset" : "48%")}; background:lime;color:black;border-radius:5px;" > ${(subobj[prop].length == 0 ? "[Empty array]" : subobj[prop])} </div>`;
      } else if(subobj[prop] === null) {
        d.innerHTML += `<div style="width:50%;">${prop}</div> 
         <div style="width:unset; background:lime;color:black;padding:1px;border-radius:5px;" >${subobj[prop]}</div>`;
      } else if(subobj[prop] == false) {
        d.innerHTML += `<div style="width:50%;">${prop}</div> 
         <div style="width:unset; background:lime;color:black;padding:1px;border-radius:5px;" >false</div>`;
      } else if(subobj[prop] == "") {
        d.innerHTML += `<div style="width:50%;">${prop}</div> 
         <div style="width:unset; background:lime;color:black;padding:1px;border-radius:5px;" >none</div>`;
      } else {
        d.innerHTML += `<div style="width:50%;">${prop}</div> 
         <div style="width:48%; background:lime;color:black;padding:1px;border-radius:5px;" >${subobj[prop]}</div>`;
      }

      a.push(d);
    });
    // this.subObjectsProps.push(a);
    return a;
  }

  exploreGlb(subobj, rootKey, currSceneObj) {
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
      d.style.flexWrap = "wrap";
      if(typeof subobj[prop] === 'number') {
        d.innerHTML += `<div style="width:50%;">${prop}</div> 
         <div style="width:48%; background:lime;color:black;" >
           <input
           class="inputEditor" name="${prop}" 
           ${(prop === "animationIndex" ? "max='" + subobj['glbJsonData']['animations'].length - 1 + "'" : "")}
             onchange="console.log(this.value, 'change fired'); 
            document.dispatchEvent(new CustomEvent('web.editor.input', {detail: {
             'inputFor': ${currSceneObj ? "'" + currSceneObj.name + "'" : "'no info'"} ,
             'propertyId': ${currSceneObj ? "'" + rootKey + "'" : "'no info'"} ,
             'property': ${currSceneObj ? "'" + prop + "'" : "'no info'"} ,
             'value': ${currSceneObj ? "this.value" : "'no info'"}
            }}))" 
           ${(rootKey == "adapterInfo" ? "disabled='true'" : "")}" type="number" value="${subobj[prop]}" /> 
           </div>`;
      } else if(Array.isArray(subobj[prop]) && prop == "nodes") {
        console.log("init prop: " + rootKey)
        d.innerHTML += `<div style="width:50%">${prop}</div> 
         <div style="width:${(subobj[prop].length == 0 ? "unset" : "48%")}; background:lime;color:black;border-radius:5px;" > 
            ${(subobj[prop].length == 0 ? "[Empty array]" : subobj[prop].length)}
         </div>`;
      } else if(Array.isArray(subobj[prop]) && prop == "skins") {
        console.log("init prop: " + rootKey)
        d.innerHTML += `<div style="width:50%">${prop}</div> 
         <div style="width:${(subobj[prop].length == 0 ? "unset" : "48%")}; background:lime;color:black;border-radius:5px;" > 
            ${(subobj[prop].length == 0 ? "[Empty array]" :
            subobj[prop]
              .map(item => {
                if(item && typeof item === "object" && "name" in item) {
                  return item.name + " Joints:" + item.joints.length + "\n inverseBindMatrices:" + item.inverseBindMatrices;
                }
                return String(item);
              })
              .join(", ")
          )}
         </div>`;
      } else if(prop == "glbJsonData") {
        console.log("init glbJsonData: " + rootKey)

        d.innerHTML += `<div style="width:50%">Animations:</div> 

         <div style="width:${(subobj[prop].animations.length == 0 ? "unset" : "48%")}; background:lime;color:black;border-radius:5px;" > 
            ${(subobj[prop].animations.length == 0 ? "[Empty array]" :
            subobj[prop].animations
              .map(item => {
                if(item && typeof item === "object" && "name" in item) {
                  return item.name;
                }
                return String(item);
              })
              .join(", ")
          )}
         </div>
         \n
         <div style="width:50%">Skinned meshes:</div> 
         <div style="width:${(subobj[prop].meshes.length == 0 ? "unset" : "48%")}; background:lime;color:black;border-radius:5px;" > 
            ${(subobj[prop].meshes.length == 0 ? "[Empty array]" :
            subobj[prop].meshes
              .map(item => {
                if(item && typeof item === "object" && "name" in item) {
                  return item.name + " \n Primitives : " + item.primitives.length;
                }
                return String(item);
              })
              .join(", ")
          )}
         </div>
          \n
         <div style="width:50%">Images:</div> 
         <div style="width:${(subobj[prop].images.length == 0 ? "unset" : "48%")}; background:lime;color:black;border-radius:5px;" > 
            ${(subobj[prop].images.length == 0 ? "[Empty array]" :
            subobj[prop].images
              .map(item => {
                if(item && typeof item === "object" && "name" in item) {
                  return "<div>" + item.name + " \n mimeType: " + item.mimeType + "</div>";
                }
                return String(item);
              })
              .join(", ")
          )}
         </div>

         \n
         <div style="width:50%">Materials:</div> 
         <div style="width:${(subobj[prop].materials.length == 0 ? "unset" : "48%")}; background:lime;color:black;border-radius:5px;" > 
            ${(subobj[prop].materials.length == 0 ? "[Empty array]" :
            subobj[prop].materials
              .map(item => {
                if(item && typeof item === "object" && "name" in item) {
                  return "<div>" + item.name + " \n metallicFactor: " + item.pbrMetallicRoughness.metallicFactor +
                    " \n roughnessFactor: " + item.pbrMetallicRoughness.roughnessFactor + "</div>";
                }
                return String(item);
              })
              .join(", ")
          )}
         </div>
         
         `;



      } else if(subobj[prop] === null) {
        d.innerHTML += `<div style="width:50%;">${prop}</div> 
         <div style="width:unset; background:lime;color:black;padding:1px;border-radius:5px;" >${subobj[prop]}</div>`;
      } else if(subobj[prop] == false) {
        d.innerHTML += `<div style="width:50%;">${prop}</div> 
         <div style="width:unset; background:lime;color:black;padding:1px;border-radius:5px;" >false</div>`;
      } else if(subobj[prop] == "") {
        d.innerHTML += `<div style="width:50%;">${prop}</div> 
         <div style="width:unset; background:lime;color:black;padding:1px;border-radius:5px;" >none</div>`;
      } else {
        d.innerHTML += `<div style="width:50%;">${prop}</div> 
         <div style="width:48%; background:lime;color:black;padding:1px;border-radius:5px;" >${subobj[prop]}</div>`;
      }

      a.push(d);
    });
    // this.subObjectsProps.push(a);
    return a;
  }
}