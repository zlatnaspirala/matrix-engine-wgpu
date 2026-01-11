/**
 * @description
 * MethodsManager only for web editor jobs.
 * @author Nikola Lukic
 * @email zlatnaspirala@gmail.com
 * @format
 * { name, code, fn, type, intervalId }
 */
export default class MethodsManager {
  constructor(editorType) {
    this.editorType = editorType;
    this.methodsContainer = [];
    this.createUI();
    this.loadMethods(editorType).then((r) => {
      this.methodsContainer = r;
      this.refreshSelect();
      this.select.click();
    });
    document.addEventListener('show-method-editor', () => {
      this.popup.style.display = "block";
      this.wrapper.style.display = "block";
    });

    document.addEventListener('XcompileFunction', (e) => {
      this.compileFunction(e.detail.code);
    })
  }

  loadMethods = async (editorType) => {
    return new Promise(async (resolve, reject) => {
      if(editorType == 'created from editor') {
        const page = location.pathname.split("/").pop().replace(".html", "");
        const file = `../projects/${page}/methods.js`;
        let module;
        try {
          module = await import(file);
          if(module) {resolve(module.default)} else {
            reject([])
          }
        } catch(err) {
          reject([]);
        }
      } else {
        resolve([]);
      }
    })
  }

  makePopupDraggable() {
    let isDragging = false;
    let offsetX = 0;
    let offsetY = 0;

    // Use the wrapper as the drag handle
    this.wrapper.style.cursor = "move";

    this.wrapper.addEventListener("mousedown", (e) => {
      isDragging = true;
      const rect = this.popup.getBoundingClientRect();
      offsetX = e.clientX - rect.left;
      offsetY = e.clientY - rect.top;
      this.popup.style.transition = "none"; // remove transition during drag
    });

    document.addEventListener("mousemove", (e) => {
      if(!isDragging) return;
      this.popup.style.left = e.clientX - offsetX + "px";
      this.popup.style.top = e.clientY - offsetY + "px";
      this.popup.style.transform = "none"; // cancel centering transform
    });

    document.addEventListener("mouseup", () => {
      if(isDragging) isDragging = false;
    });
  }

  createUI() {
    // Wrapper
    this.wrapper = document.createElement("div");
    this.wrapper.style.cssText = `
      padding: 10px; 
      background:#2f2f2f;
      border-radius:8px;
      color:#ddd; 
      font-family: monospace;
      width:95%;
    `;

    this.select = document.createElement("select");
    this.select.style.cssText = `
      width:100%;
      padding:5px;
      background:#3a3a3a;
      color:#fff;
      border:1px solid #555;
      margin-bottom:10px;
    `;
    this.wrapper.appendChild(this.select);

    this.select.onchange = () => {
      console.log("CHANGE SCRIPT SELECT")
      const index = this.select.selectedIndex;
      const method = this.methodsContainer[index];
      if(!method) return;

      // Open editor with selected method
      this.openEditor(method);
    };

    this.select.onclick = () => {
      const index = this.select.selectedIndex;
      const method = this.methodsContainer[index];
      if(method) this.openEditor(method);
    };

    // BUTTON Add new
    this.btnNew = document.createElement("button");
    this.btnNew.innerText = "New Method";
    this.btnNew.style.cssText = `
      width:30%;
      padding:6px;
      background:#444;
      color:#fff;
      border:1px solid #555;
      cursor:pointer;
    `;
    this.btnNew.onclick = () => this.openEditor();
    this.wrapper.appendChild(this.btnNew);

    // Popup Editor
    this.popup = document.createElement("div");
    this.popup.style.cssText = `
      position:fixed;
      top:50%; left:50%;
      transform:translate(-50%,-50%);
      background:#2a2a2a;
      padding:20px;
      border:1px solid #555;
      border-radius:8px;
      display:none;
      width:400px;
      z-index:999;
    `;

    this.popup.appendChild(this.wrapper);


    // Add after btnSave or btnExit creation
    this.btnRemove = document.createElement("button");
    this.btnRemove.innerText = "Remove method";
    this.btnRemove.style.cssText = `
        margin-top:10px;
        margin-left:10px;
        padding:6px 14px;
        background:#a33;
        color:#fff;
        border:1px solid #800;
        cursor:pointer;
      `;
    this.btnRemove.onclick = () => this.removeMethod();
    this.popup.appendChild(this.btnRemove);

    this.textarea = document.createElement("textarea");
    this.textarea.id = "code-editor-textarea";
    this.textarea.style.cssText = `
      width:100%; 
      height:160px; 
      background:#1e1e1e; 
      color:#fff; 
      border:1px solid #555;
      box-shadow: inset 0px 0px 16px 0px #3F51B5;
      -webkit-text-stroke-color: #03A9F4;
    `;
    this.popup.appendChild(this.textarea);

    this.btnSave = document.createElement("button");
    this.btnSave.innerText = "Save method";
    this.btnSave.style.cssText = `
      margin-top:10px;
      padding:6px 14px;
      background:#555;
      color:#fff;
      border:1px solid #666;
      cursor:pointer;
    `;
    this.btnSave.onclick = () => this.saveMethod();
    this.popup.appendChild(this.btnSave);

    this.btnExit = document.createElement("button");
    this.btnExit.innerText = "Hide";
    this.btnExit.style.cssText = `
      margin-top:10px;
      padding:6px 14px;
      background:#555;
      color:#fff;
      border:1px solid #666;
      cursor:pointer;
    `;
    this.btnExit.onclick = () => {
      this.popup.style.display = "none";
    };
    this.popup.appendChild(this.btnExit);

    this.makePopupDraggable();
    document.body.appendChild(this.popup);
  }

  openEditor(existing) {
    this.editing = existing || null;
    this.textarea.value = existing ? existing.code : "";
    // this.popup.style.display = "block";
  }

  saveMethod() {
    const code = this.textarea.value.trim();

    if(!code) return;

    const name = this.extractName(code);

    const obj = {
      name,
      code,
      type: this.detectType(code),
      fn: this.compileFunction(code),
      intervalId: null
    };

    if(obj.type === "interval") {
      obj.intervalId = obj.fn(); // start the interval
    }

    // Replace or add
    if(this.editing) {
      const idx = this.methodsContainer.indexOf(this.editing);
      this.methodsContainer[idx] = obj;
    } else {
      this.methodsContainer.push(obj);
    }

    this.refreshSelect();
    this.popup.style.display = "none";

    document.dispatchEvent(new CustomEvent('save-methods', {
      detail: {
        methodsContainer: this.methodsContainer
      }
    }));

  }

  removeMethod() {
    if(!this.editing) return; // nothing selected

    const idx = this.methodsContainer.indexOf(this.editing);
    if(idx === -1) return;

    // If it was an interval, clear it
    if(this.methodsContainer[idx].intervalId) {
      clearInterval(this.methodsContainer[idx].intervalId);
    }

    // Remove from container
    this.methodsContainer.splice(idx, 1);

    // Reset editing
    this.editing = null;

    // Refresh select options
    this.refreshSelect();

    // Optionally clear editor
    this.textarea.value = "";

    // Dispatch update event
    document.dispatchEvent(new CustomEvent('save-methods', {
      detail: {
        methodsContainer: this.methodsContainer
      }
    }));
  }

  refreshSelect() {
    this.select.innerHTML = "";
    this.methodsContainer.forEach(m => {
      const op = document.createElement("option");
      op.textContent = `${m.name}  [${m.type}]`;
      this.select.appendChild(op);
    });
  }

  extractName(code) {
    const match = code.match(/function\s+([a-zA-Z0-9_]+)/);
    return match ? match[1] : "method_" + (this.methodsContainer.length + 1);
  }

  detectType(code) {
    if(code.includes("setInterval")) return "interval";
    if(code.includes("return")) return "return";
    return "void";
  }

  compileFunction(code) {
    try {
      // Wrap the function code into a callable unit
      const fn = new Function(code + "; return " + this.extractName(code) + ";")();
      return fn;
    } catch(e) {
      console.error("Compilation error:", e);
      return () => {};
    }
  }

  destroyIntervals() {
    this.methodsContainer.forEach(m => {
      if(m.intervalId) clearInterval(m.intervalId);
    });
  }
}
