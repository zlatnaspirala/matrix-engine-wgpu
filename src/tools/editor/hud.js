import {METoolTip} from "../../engine/plugin/tooltip/ToolTip.js";
import {byId, FullscreenManager, isMobile, jsonHeaders, LOG_FUNNY_ARCADE, mb} from "../../engine/utils.js";
import {openFragmentShaderEditor} from "./flexCodexShader.js";

/**
 * @Author NIkola Lukic
 * @description
 * Web Editor for matrix-engine-wgpu
 * Using "file protocol" in direct way no virtual/syntetic assets
 */
export default class EditorHud {
  constructor(core, a) {
    this.core = core;
    this.sceneContainer = null;
    this.FS = new FullscreenManager();
    this.toolTip = new METoolTip();
    if(a == 'infly') {
      this.createTopMenuInFly();
    } else if(a == "created from editor") {
      this.createTopMenu();
      this.createAssets();
      setTimeout(() => openFragmentShaderEditor().then((e) => {
        byId('shaderDOM').style.display = 'none';
        app.shaderGraph = e;
        console.log('AUTO INIT app.shaderGraph', app.shaderGraph)
      }), 100);
    } else if(a == "pre editor") {
      this.createTopMenuPre();
    } else {
      throw console.error('Editor err');
    }
    this.createEditorSceneContainer();
    this.createScenePropertyBox();
    this.currentProperties = [];

    setTimeout(() => document.dispatchEvent(new CustomEvent('updateSceneContainer', {detail: {}})), 1000);

    document.addEventListener('editor-not-running', () => {
      this.noEditorConn();
    });

    document.addEventListener('file-detail-data', (e) => {
      console.log(e.detail.details)
      let getPATH = e.detail.details.path.split("public")[1];
      const ext = getPATH.split('.').pop();

      if(ext == 'glb' && confirm("GLB FILE 📦 Do you wanna add it to the scene ?")) {
        let name = prompt("📦 GLB file : ", getPATH);
        let objName = prompt("📦 Enter uniq name: ");
        if(confirm("⚛ Enable physics (Ammo)?")) {
          // infly
          let o = {
            physics: true,
            path: getPATH,
            index: objName
          }
          document.dispatchEvent(new CustomEvent('web.editor.addGlb', {
            detail: o
          }));
        } else {
          // infly
          let o = {
            physics: false,
            path: getPATH,
            index: objName
          }
          document.dispatchEvent(new CustomEvent('web.editor.addGlb', {
            detail: o
          }));
        }
      } else if(ext == 'obj' && confirm("OBJ FILE 📦 Do you wanna add it to the scene ?")) {
        let objName = prompt("📦 Enter uniq name: ");
        if(confirm("⚛ Enable physics (Ammo)?")) {
          // infly 
          let o = {
            physics: true,
            path: getPATH,
            index: objName
          }
          document.dispatchEvent(new CustomEvent('web.editor.addObj', {
            detail: o
          }));
        } else {
          // infly
          let o = {
            physics: false,
            path: getPATH,
            index: objName
          }
          document.dispatchEvent(new CustomEvent('web.editor.addObj', {
            detail: o
          }));
        }
      } else if(ext == 'mp3' && confirm("MP3 FILE 📦 Do you wanna add it to the scene ?")) {
        let objName = prompt("📦 Enter uniq name: ");
        // infly
        let o = {
          path: getPATH,
          name: objName
        }
        document.dispatchEvent(new CustomEvent('web.editor.addMp3', {
          detail: o
        }));
      }


      else {
        let s = "";
        for(let key in e.detail.details) {
          if(key == "path") {
            s += key + ":" + e.detail.details[key].split("public")[1] + "\n";
          } else {
            s += key + ":" + e.detail.details[key] + "\n";
          }
        }
        mb.show(s);
      }
    });
  }

  noEditorConn() {
    this.errorForm = document.createElement("div");
    this.errorForm.id = "errorForm";
    Object.assign(this.errorForm.style, {
      position: "absolute",
      top: "20%",
      left: "25%",
      width: "50%",
      height: "30vh",
      backgroundColor: "rgba(0,0,0,0.85)",
      display: "flex",
      color: "white",
      fontFamily: "'Orbitron', sans-serif",
      zIndex: "15",
      padding: "2px",
      boxSizing: "border-box",
      flexDirection: "column",
      justifyContent: 'center',
      alignItems: 'center'
    });

    this.errorForm.innerHTML = `
       <h2 class='fancy-label'>No connection with editor node app.</h2>
       <h3 class='fancy-label'>Run from root [npm run editorx] \n 
          or run from ./src/tools/editor/backend [npm run editorx] \n
          Than refresh page [clear default cache browser with CTRL+F5] </h3>
    `;
    document.body.appendChild(this.errorForm);
  }

  createTopMenu() {
    this.editorMenu = document.createElement("div");
    this.editorMenu.id = "editorMenu";
    Object.assign(this.editorMenu.style, {
      position: "absolute",
      top: "0",
      left: "30%",
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

    this.editorMenu.innerHTML = `
    <div class="top-item">
      <div class="top-btn">Project ▾</div>
      <div class="dropdown">
      <div id="start-watch" class="drop-item">🛠️ Watch</div>
      <div id="stop-watch" class="drop-item">🛠️ Stop Watch</div>
      <div id="start-refresh" class="drop-item">🛠️ Refresh</div>
      <div id="start-prod-build" class="drop-item">🛠️ Build for production</div>
      </div>
    </div>

    <div class="top-item">
      <div class="top-btn">Insert ▾</div>
      <div class="dropdown">
        <div id="addCube" class="drop-item">🧊Cube</div>
        <div id="addCubePhysics" class="drop-item">🧊Cube with Physics</div>
        <div id="addSphere" class="drop-item">⚪Sphere</div>
        <div id="addSpherePhysics" class="drop-item">⚪Sphere with Physics</div>
        <small>Glb and Obj files add direct from asset (by selecting)</small>
        <!--div class="drop-item">💡 Light</div-->
      </div>
    </div>

    <div class="top-item">
      <div class="top-btn">Settings ▾</div>
      <div class="dropdown">
        <div id="cameraBox" class="drop-item">
           <p>📽️Camera</p>
           <div>Pitch: <input id="camera-settings-pitch" step='0.1' type='number' value='0' /></div>
           <div>Yaw: <input id="camera-settings-yaw" step='0.1' type='number' value='0' /></div>
           <!--div> Position :  </br>
            \n 
            X: <input id="camera-settings-pos-x" step='0.5' type='number' value='0' /> \n
            Y: <input id="camera-settings-pos-y" step='0.5' type='number' value='0' /> \n
            Z: <input id="camera-settings-pos-z" step='0.5' type='number' value='0' />
           </div-->
        </div>
      </div>
    </div>
    
    
    <div class="top-item">
      <div class="top-btn">Script ▾</div>
      <div class="dropdown">
        <div id="showVisualCodeEditorBtn" class="drop-item btn4">
           <span>Visual Scripting</span>
           <small>⌨️FluxCodexVertex</small>
           <small>⌨️Press F6 for run</small>
        </div>
        <div id="showCodeVARSBtn" class="drop-item btn4">
           <span>Variable editor</span>
           <small>🔧Visual Script tool</small>
        </div>
        <div id="showCodeEditorBtn" class="drop-item btn4">
           <span>Show code editor</span>
           <small>👩‍💻Function raw edit</small>
           <small>Custom Functions</small>
        </div>
        <div id="showCurveEditorBtn" class="drop-item btn4">
           <span>Show curve editor</span>
           <small>📈Timeline curve editor</small>
           <small> </small>
        </div>
        <div id="showShaderEditorBtn" class="drop-item btn4">
           <span>Show shader editor</span>
           <small>Shader editor</small>
           <small> </small>
        </div>
      </div>
    </div>

    <div class="top-item">
      <div class="top-btn">View ▾</div>
      <div class="dropdown">
        <div id="hideEditorBtn" class="drop-item">
           <p>Hide Editor UI</p>
           <small>Show editor - press F4 ⌨️</small>
        </div>
        <div id="bg-transparent" class="drop-item">
           <p>Background transparent</p>
           <small>Fancy style</small>
        </div>
        <div id="bg-tradicional" class="drop-item">
           <p>Background tradicional</p>
           <small>Old school</small>
        </div>
        <div id="fullScreenBtn" class="drop-item">
         <span>FullScreen</span>
         <small>Exit - press F11 ⌨️</small>
        </div>
      </div>
    </div>

    <div class="top-item">
      <div class="top-btn">About ▾</div>
      <div class="dropdown">
        <div id="showAboutEditor" class="drop-item">matrix-engine-wgpu</div>
      </div>
    </div>

    <div class="btn2">
      <button class="btn" id="saveMainGraphDOM">SAVE GRAPH</button>
      <button class="btn" id="runMainGraphDOM">RUN [F6]</button>
      <button class="btn" id="stopMainGraphDOM">STOP</button>
      <span id="graph-status">⚫</span>
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

    // run top many

    byId('saveMainGraphDOM').addEventListener('click', () => {
      // global for now.
      app.editor.fluxCodexVertex.compileGraph();
    });
    byId('runMainGraphDOM').addEventListener('click', () => {
      // global for now.
      app.editor.fluxCodexVertex.runGraph();
    });

    this.toolTip.attachTooltip(byId('saveMainGraphDOM'), "Any changes in graph must be saved.");
    this.toolTip.attachTooltip(byId('runMainGraphDOM'), "Run main graph, sometimes engine need refresh.");
    this.toolTip.attachTooltip(byId('stopMainGraphDOM'), "Stop main graph, clear dynamic created objects.");

    byId('stopMainGraphDOM').addEventListener('click', () => {
      // global for now.
      app.editor.fluxCodexVertex.clearRuntime();
    });

    // Close on outside tap
    document.addEventListener("click", e => {
      if(!this.editorMenu.contains(e.target)) {
        this.editorMenu.querySelectorAll(".dropdown").forEach(d => {
          d.style.display = "none";
        });
      }
    });

    byId('fullScreenBtn').addEventListener('click', () => {
      this.FS.request()
    });

    this.toolTip.attachTooltip(byId('fullScreenBtn'), "Just editor gui part for fullscreen - not fullscreen for real program.");

    byId('hideEditorBtn').addEventListener('click', () => {
      this.editorMenu.style.display = 'none';
      this.assetsBox.style.display = 'none';
      this.sceneProperty.style.display = 'none';
      this.sceneContainer.style.display = 'none';
      byId('app').style.display = 'none';
    });

    byId('bg-transparent').addEventListener('click', () => {
      byId('boardWrap').style.backgroundImage = 'none';
    });
    this.toolTip.attachTooltip(byId('bg-transparent'), "Make visible both (mix) graphs and render.");

    byId('bg-tradicional').addEventListener('click', () => {
      // byId('boardWrap').style.backgroundImage = 'url("res/icons/editor/chatgpt-gen-bg.png")';
      byId('boardWrap').style.backgroundImage = '';
    });
    this.toolTip.attachTooltip(byId('bg-tradicional'), "Make visible graphs layout only.");

    if(byId('stop-watch')) byId('stop-watch').addEventListener('click', () => {
      document.dispatchEvent(new CustomEvent('stop-watch', {
        detail: {}
      }));
    });
    this.toolTip.attachTooltip(byId('stop-watch'), "Stops JavaScript compilers. Use this when working with Git, for example, to avoid unnecessary builds.");

    if(byId('start-watch')) byId('start-watch').addEventListener('click', () => {
      document.dispatchEvent(new CustomEvent('start-watch', {
        detail: {}
      }));
    });
    this.toolTip.attachTooltip(byId('start-watch'), "Start watch builds for JavaScript compilers.No need at start up - watcher already started on backend of editor.");

    if(byId('cnpBtn')) byId('cnpBtn').addEventListener('click', () => {

      let name = prompt("📦 Project name :", "MyProject1");
      let features = {
        physics: false,
        networking: false
      };

      if(confirm("⚛ Enable physics (Ammo)?")) {
        features.physics = true;
      }

      if(confirm("🔌 Enable networking (kurento/ov)?")) {
        features.networking = true;
      }

      console.log(features);

      document.dispatchEvent(new CustomEvent('cnp', {
        detail: {
          name: name,
          features: features
        }
      }));
    });
    if(byId('cnpBtn')) this.toolTip.attachTooltip(byId('cnpBtn'), "Create new project. You must input project name.");

    byId('start-refresh').onclick = () => {
      location.reload(true);
    };
    if(byId('start-refresh')) this.toolTip.attachTooltip(byId('start-refresh'), "Simple refresh page.");


    byId('start-prod-build').onclick = () => {
      //
      console.log('.......start-prod-build.......');
      console.log('................................')

    };

    // OBJECT LEVEL
    if(byId('addCube')) byId('addCube').addEventListener('click', () => {
      let objName = prompt("📦 Enter uniq name: ");
      let o = {
        physics: false,
        index: objName
      };
      document.dispatchEvent(new CustomEvent('web.editor.addCube', {
        detail: o
      }));
    });
    if(byId('addCube')) this.toolTip.attachTooltip(byId('addCube'), "Create Cube scene object with no physics.If you wanna objects who will be in kinematic also in physics regime (switching) then you need to use CubePhysics.");

    if(byId('addSphere')) byId('addSphere').addEventListener('click', () => {
      let objName = prompt("📦 Enter uniq name: ");
      let o = {
        physics: false,
        index: objName
      };
      document.dispatchEvent(new CustomEvent('web.editor.addSphere', {
        detail: o
      }));
    });

    if(byId('addCubePhysics')) byId('addCubePhysics').addEventListener('click', () => {
      let objName = prompt("📦 Enter uniq name: ");
      let o = {
        physics: true,
        index: objName
      };
      document.dispatchEvent(new CustomEvent('web.editor.addCube', {
        detail: o
      }));
    });

    if(byId('addSpherePhysics')) byId('addSpherePhysics').addEventListener('click', () => {
      let objName = prompt("📦 Enter uniq name: ");
      let o = {
        physics: true,
        index: objName
      };
      document.dispatchEvent(new CustomEvent('web.editor.addSphere', {
        detail: o
      }));
    });

    // settings
    setTimeout(() => {
      this.core.cameras.WASD.pitch = byId('camera-settings-pitch').value;
      this.core.cameras.WASD.yaw = byId('camera-settings-yaw').value;
    }, 1500);

    byId('camera-settings-pitch').addEventListener('change', (e) => {
      console.log('setting camera pitch ', e);
      this.core.cameras.WASD.pitch = e.target.value;
    })
    byId('camera-settings-yaw').addEventListener('change', (e) => {
      console.log('setting camera', e)
      this.core.cameras.WASD.yaw = e.target.value;
    })

    byId('showCodeEditorBtn').addEventListener('click', (e) => {
      document.dispatchEvent(new CustomEvent('show-method-editor', {detail: {}}));
    });

    byId('showCurveEditorBtn').addEventListener('click', (e) => {
      document.dispatchEvent(new CustomEvent('show-curve-editor', {detail: {}}));
    });

    byId('showShaderEditorBtn').addEventListener('click', (e) => {
      if(byId('app').style.display == 'flex') {
        byId('app').style.display = 'none';
      }
      if(byId('shaderDOM') === null) {
        openFragmentShaderEditor().then((e) => {
          app.shaderGraph = e;
        });
      } else if(byId('shaderDOM').style.display === 'flex') {
        byId('shaderDOM').style.display = 'none';
      } else {
        byId('shaderDOM').style.display = 'flex'
      }
    });

    byId('showVisualCodeEditorBtn').addEventListener('click', (e) => {
      if(byId('shaderDOM') && byId('shaderDOM').style.display == 'flex') {
        byId('shaderDOM').style.display = 'none';
      }
      if(byId('app').style.display == 'flex') {
        byId('app').style.display = 'none';
      } else {
        byId('app').style.display = 'flex';
        if(this.core.editor.fluxCodexVertex) this.core.editor.fluxCodexVertex.updateLinks();
      }
    });

    byId('showCodeVARSBtn').addEventListener('click', (e) => {
      byId('app').style.display = 'flex';
      byId('varsPopup').style.display = 'flex';
      this.core.editor.fluxCodexVertex.updateLinks();
      // document.dispatchEvent(new CustomEvent('show-method-editor', {detail: {}}));
    });

    document.addEventListener('updateSceneContainer', (e) => {
      this.updateSceneContainer();
    })
    this.showAboutModal = () => {
      alert(`
  ✔️ Support for 3D objects and scene transformations
  ✔️ Ammo.js physics integration
  ✔️ Networking with Kurento/OpenVidu/Own middleware Nodejs -> frontend
  ✔️ Event system
  🎯 Save system - direct code line [file-protocol]
  🎯 Adding Visual Scripting System called 
     FlowCodexVertex (deactivete from top menu)(activate on pressing F4 key)
     Source code: https://github.com/zlatnaspirala/matrix-engine-wgpu
     More at https://maximumroulette.com
        `);
    }
    byId('showAboutEditor').addEventListener('click', this.showAboutModal);
  }

  createAssets() {
    this.assetsBox = document.createElement("div");
    this.assetsBox.id = "assetsBox";
    Object.assign(this.assetsBox.style, {
      position: "absolute",
      bottom: "0",
      left: "17.55%",
      width: "63%",
      height: "250px",
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
    this.assetsBox.innerHTML = "ASSTES";

    this.assetsBox.innerHTML = `
    <div id="folderTitle" >Root</div>
    <div id="folderBack" class="scenePropItem" >...</div>
    <div id='res-folder' class="file-browser">
    </div>`;

    document.body.appendChild(this.assetsBox);

    byId('folderBack').addEventListener('click', () => {
      let getCurrent = byId('res-folder').getAttribute('data-root-folder');
      const t = getCurrent.substring(0, getCurrent.lastIndexOf("\\"));
      const last = t.substring(t.lastIndexOf("\\") + 1);
      if(last == "public") {
        // console.log(last + "<PREVENTED>");
        return;
      }
      document.dispatchEvent(new CustomEvent("nav-folder", {
        detail: {
          rootFolder: t || "",
          name: ''
        }
      }));
    });

    this.toolTip.attachTooltip(byId('folderTitle'), `This represent real folders files present intro res folder (what ever is there).\n
    From assets box you can add glb or obj files direct with simple click. Everyting will be saved automatic.\n
    Support for mp3 adding by click also. No support for mp4 - mp4 can be added from 'Set Textures' node.

    `);
    // folderTitle

    document.addEventListener('la', (e) => {
      console.log(`%c[Editor]Root Resource Folder: ${e.detail.rootFolder}`, LOG_FUNNY_ARCADE);
      byId('res-folder').setAttribute('data-root-folder', e.detail.rootFolder);
      byId('res-folder').innerHTML = '';
      e.detail.payload.forEach((i) => {
        let item = document.createElement('div');
        item.classList.add('file-item');
        if(i.isDir == true) {
          item.classList.add('folder');
        } else if(i.name.split('.')[1] == 'jpg' ||
          i.name.split('.')[1] == 'png' ||
          i.name.split('.')[1] == 'jpeg') {
          item.classList.add('png');
        } else if(i.name.split('.')[1] == 'mp3') {
          item.classList.add('mp3');
        } else if(i.name.split('.')[1] == 'js') {
          item.classList.add('js');
        } else if(i.name.split('.')[1] == 'ttf' ||
          i.name.split('.')[1] == 'ttf' ||
          i.name.split('.')[1] == 'TTF' ||
          i.name.split('.')[1] == 'otf' ||
          i.name.split('.')[1] == 'woff' ||
          i.name.split('.')[1] == 'woff2') {
          item.classList.add('ttf');
        } else if(i.name.split('.')[1] == 'glb') {
          item.classList.add('glb');
        } else {
          item.classList.add('unknown');
        }

        item.innerHTML = "<p>" + i.name + "</p>";
        byId('res-folder').appendChild(item);
        item.addEventListener('click', (e) => {

          if(i.isDir == true) document.dispatchEvent(new CustomEvent("nav-folder", {
            detail: {
              rootFolder: byId('res-folder').getAttribute('data-root-folder') || "",
              name: item.children[0].innerText
            }
          }));

          if(i.isDir == false) document.dispatchEvent(new CustomEvent("file-detail", {
            detail: {
              rootFolder: byId('res-folder').getAttribute('data-root-folder') || "",
              name: item.innerText
            }
          }));
        });
      });
      document.querySelectorAll('.file-item').forEach(el => {
        el.addEventListener('click', () => {
          document.querySelectorAll('.file-item').forEach(x => x.classList.remove('selected'));
          el.classList.add('selected');
        });
      });
    })
  }

  createTopMenuPre() {
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
      color: "white",
      fontFamily: "'Orbitron', sans-serif",
      zIndex: "15",
      padding: "2px",
      boxSizing: "border-box",
      flexDirection: "row"
    });
    this.editorMenu.innerHTML = " PROJECT MENU  ";

    this.editorMenu.innerHTML = `
    <div class="top-item">
      <div class="top-btn">Project ▾</div>
      <div class="dropdown">
      <div id="cnpBtn" class="drop-item">📦 Create new project</div>
      <div id="loadProjectBtn" class="drop-item">📂 Load</div>
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

    if(byId('loadProjectBtn')) byId('loadProjectBtn').addEventListener('click', () => {
      document.dispatchEvent(new CustomEvent('lp', {
        detail: {}
      }));
    });

    if(byId('cnpBtn')) byId('cnpBtn').addEventListener('click', () => {
      let name = prompt("📦 Project name :", "MyProject1");
      let features = {
        physics: false,
        networking: false
      };

      if(confirm("⚛ Enable physics (Ammo)?")) {
        features.physics = true;
      }

      if(confirm("🔌 Enable networking (kurento/ov)?")) {
        features.networking = true;
      }
      console.log(features);
      document.dispatchEvent(new CustomEvent('cnp', {
        detail: {
          name: name,
          features: features
        }
      }));
    });

    this.showAboutModal = () => {
      alert(`
  ✔️ Support for 3D objects and scene transformations
  ✔️ Ammo.js physics integration
  ✔️ Networking with Kurento/OpenVidu/Own middleware Nodejs -> frontend
  ✔️ Event system
  🎯 Save system - direct code line [file-protocol]
  🎯 Adding Visual Scripting System called 
     FlowCodexVertex (deactivete from top menu)(activate on pressing F4 key)
     Source code: https://github.com/zlatnaspirala/matrix-engine-wgpu
     More at https://maximumroulette.com
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
      color: "white",
      fontFamily: "'Orbitron', sans-serif",
      zIndex: "15",
      padding: "2px",
      boxSizing: "border-box",
      flexDirection: "row"
    });
    this.editorMenu.innerHTML = " PROJECT MENU ";
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
  ✔️ Ammo.js physics integration
  ✔️ Networking with Kurento/OpenVidu/Own middleware Nodejs -> frontend
  ✔️ Event system
  🎯 Save system - direct code line [file-protocol]
     Adding Visual Scripting System called 
     flowCodexVertex (deactivete from top menu)(activate on pressing F4 key)
     Source code: https://github.com/zlatnaspirala/matrix-engine-wgpu
     More at https://maximumroulette.com
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
      width: "17.5%",
      height: "100vh",
      backgroundColor: "rgb(75 75 75 / 85%)",
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
    this.sceneContainerTitle.style.height = '30px';
    this.sceneContainerTitle.style.width = "-webkit-fill-available";
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
      backgroundColor: "rgb(35 35 35 / 63%)",
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
      fontFamily: 'monospace',
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
        this.currentProperties.push(new SceneObjectProperty(this.objectProperies, 'glb', currentSO, this.core));
      } else {
        this.currentProperties.push(new SceneObjectProperty(this.objectProperies, prop, currentSO, this.core));
      }
    });

    // Add editor events system
    this.currentProperties.push(new SceneObjectProperty(this.objectProperies, 'editor-events', currentSO, this.core));

  }
}

class SceneObjectProperty {
  constructor(parentDOM, propName, currSceneObj, core) {
    this.core = core;
    this.subObjectsProps = [];
    this.propName = document.createElement("div");
    this.propName.style.width = '100%';
    // console.log("init : " + propName)
    // Register
    if(propName == "device" || propName == "position" || propName == "rotation"
      || propName == "raycast" || propName == "entityArgPass" || propName == "scale"
      || propName == "maxInstances" || propName == "texturesPaths" || propName == "glb"
      || propName == "itIsPhysicsBody" || propName == "useScale"
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

      if(propName == "itIsPhysicsBody") {
        this.propName.innerHTML = `<div style="text-align:left;" >${propName} <span style="border-radius:7px;background:green;">PhysicsBody</span>
        <span style="border-radius:6px;background:gray;">More info🔽</span></div>`;
      } else if(propName == "position" || propName == "scale" || propName == "rotation" || propName == "glb") {
        this.propName.innerHTML = `<div style="text-align:left;" >${propName} <span style="border-radius:7px;background:purple;">sceneObj</span>
        <span style="border-radius:6px;background:gray;">More info🔽</span></div>`;
      } else if(propName == "entityArgPass") {
        this.propName.innerHTML = `<div style="text-align:left;" >${propName} <span style="border-radius:7px;background:brown;">webGPU props</span>
        <span style="border-radius:6px;background:gray;">More info🔽</span></div>`;
      } else if(propName == "maxInstances") {
        this.propName.innerHTML = `<div style="text-align:left;" >${propName} <span style="border-radius:7px;background:brown;">instanced</span>
        <span style="border-radius:6px;background:gray;"> <input type="number" value="${currSceneObj[propName]}" /> </span></div>`;
      } else if(propName == "useScale") {
        this.propName.innerHTML = `<div style="display:flex;" >useScale  + ${this.readBool(currSceneObj, propName)} </div>`;
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
      if(currSceneObj[propName] && typeof currSceneObj[propName].adapterInfo !== 'undefined') {
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
      } else if(propName == "itIsPhysicsBody") {
        let body = this.core.matrixAmmo.getBodyByName(currSceneObj.name);
        for(let key in body) {
          if(typeof body[key] === 'string') {
            this.propName.innerHTML += `<div style="display:flex;text-align:left;"> 
              <div style="background:black;color:white;width:35%;">${key}</div>
              <div style="background:lime;color:black;width:55%;">${body[key]} </div>`;
          } else {
            let item = document.createElement('div');
            item.style.display = "flex";

            let funcNameDesc = document.createElement('span');
            funcNameDesc.style.background = "blue";
            funcNameDesc.style.width = "55%";
            funcNameDesc.innerHTML = key + ":";
            item.appendChild(funcNameDesc);

            if(typeof body[key] === "function") {
              console.log("function");
              let physicsFuncDesc = document.createElement('select');
              // fill it
              item.appendChild(physicsFuncDesc);
            } else if(typeof body[key] === "object") {
              console.log("OBJECT");
              let objDesc = document.createElement('span');
              objDesc.style.background = "yellow";
              objDesc.style.color = "black";
              objDesc.innerHTML = key;
              item.appendChild(objDesc);
            }


            item.addEventListener('click', (event) => {
              event.stopPropagation();
            });
            this.propName.style.textAlign = 'left';
            this.propName.appendChild(item);
          }
        }
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
      } else if(propName == 'itIsPhysicsBody') {
        this.propName.style.borderBottom = 'solid lime 2px';
        this.propName.innerHTML = `<div style="text-align:left;" >${propName} <span style="border-radius:7px;background:deepskyblue;">boolean</span>
        <span style="border-radius:6px;background:gray;">${currSceneObj[propName]}</span></div>`;
      }

      parentDOM.appendChild(this.propName);

    } else if(propName == "isVideo") {
      this.propName.style.borderBottom = 'solid lime 2px';
      this.propName.innerHTML = `<div style="text-align:left;" >${propName} <span style="border-radius:7px;background:deepskyblue;">boolean</span>
        <span style="border-radius:6px;background:gray;">${currSceneObj[propName]}</span></div>`;
      parentDOM.appendChild(this.propName);
    } else if(propName == 'editor-events') {
      this.addEditorEventsProp(currSceneObj, parentDOM);
      this.addEditorDeleteAction(currSceneObj, parentDOM);

    } else {
      // this.propName.innerHTML = `<div>${propName}</div>`;
      // this.propName.innerHTML += `<div>${currSceneObj[propName]}</div>`;
    }
  }

  readBool(currSceneObj, rootKey) {
    return `
    <input type="checkbox"
      class="inputEditor"
      name="${rootKey}"
      ${currSceneObj[rootKey] == true ? "checked" : ""}
      onchange="
        console.log(this.checked, 'checkbox change fired');
        document.dispatchEvent(
          new CustomEvent('web.editor.input', {
            detail: {
              inputFor: ${currSceneObj ? "'" + currSceneObj.name + "'" : "'no info'"},
              propertyId: ${currSceneObj ? "'" + rootKey + "'" : "'no info'"},
              property: 'no info',
              value: this.checked
            }
          })
        );
      "
    />
  `;
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
         ${(rootKey == "adapterInfo" ? " disabled='true'" : " ")} type="number" value="${isNaN(subobj[prop]) ? 0 : subobj[prop]
          }" /> 
        
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

  addEditorEventsProp(currSceneObj, parentDOM) {
    this.propName.innerHTML += `<div>HIT</div>`;
    this.propName.innerHTML += `<div style='display:flex;'>
      <div style="align-content: center;">onTargetReached (NoPhysics)</div>
      <div><select id='sceneObjEditorPropEvents' ></select></div>
    </div>`;

    parentDOM.appendChild(this.propName);

    byId('sceneObjEditorPropEvents').onchange = (e) => {
      console.log('Event system selection:', e.target.value)
      if(e.target.value == "none") {
        currSceneObj.position.onTargetPositionReach = () => {};
        console.log('clear event')
        return;
      }
      const method = app.editor.methodsManager.methodsContainer.find(
        m => m.name === e.target.value
      );
      let F = app.editor.methodsManager.compileFunction(method.code);
      currSceneObj.position.onTargetPositionReach = F;
      console.log('[position.onTargetPositionReach][attached]', F);
    };

    byId('sceneObjEditorPropEvents').innerHTML = "";
    this.core.editor.methodsManager.methodsContainer.forEach((m, index) => {
      if(index == 0) {
        const op = document.createElement("option");
        op.value = 'none';
        op.textContent = `none`;
        byId('sceneObjEditorPropEvents').appendChild(op);
      }

      const op = document.createElement("option");
      op.value = m.name;
      op.textContent = `${m.name}  [${m.type}]`;
      byId('sceneObjEditorPropEvents').appendChild(op);
    });
  }

  addEditorDeleteAction(currSceneObj, parentDOM) {
    this.propName.innerHTML += `<div style='display:flex;'>
      <div style="align-content: center;color:red;">Delete sceneObject:</div>
      <div><button  data-sceneobject='${currSceneObj.name}' id='delete-${currSceneObj.name}'>DELETE</button></div>
    </div>`;
    byId(`delete-${currSceneObj.name}`).addEventListener('click', () => {
      if(this.core.mainRenderBundle.length <= 1) {
        alert("WARN - SCENE IS EMPTY IN EDITOR MODE YOU WILL GOT FREEZE - After adding first obj again you must refresh!");
      }
      // important
      let name = currSceneObj.name;
      let ruleOfNaming = name;

      const underscoreIndex = name.indexOf('_');
      const dashIndex = name.indexOf('-');

      // Rule 1 & 2
      if(
        underscoreIndex === -1 ||               // no '_'
        (dashIndex !== -1 && dashIndex < underscoreIndex) // '-' before '_'
      ) {
        ruleOfNaming = name.split('-')[0];
      }

      alert(ruleOfNaming);

      document.dispatchEvent(new CustomEvent('web.editor.delete', {
        detail: {prefix: ruleOfNaming, fullName: currSceneObj.name}
      }));
    });
  }

}
