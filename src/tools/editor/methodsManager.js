
export default class MethodsManager {
  constructor(rootElement) {
    this.root = rootElement;
    this.methodsContainer = []; // { name, code, fn, type, intervalId }
    this.createUI();
    this.loadMethods();
    document.addEventListener('show-method-editor', () => {
      this.popup.style.display = "block";
      this.wrapper.style.display = "block";
    })
  }

  async loadMethods() {
    const page = location.pathname.split("/").pop().replace(".html", "");
    const file = `../src/tools/editor/gen/${page}/methods.js`;
    const module = await import(file);
    const methodsContainer = module.default;
    console.log("methodsContainer     ", methodsContainer)
  }

  /*=====================================================
     UI
  =====================================================*/
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

    // SELECT — preview methods
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
      const index = this.select.selectedIndex;
      const method = this.methodsContainer[index];
      if(!method) return;

      // Open editor with selected method
      this.openEditor(method);
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

    this.textarea = document.createElement("textarea");
    this.textarea.style.cssText = `
      width:100%; 
      height:160px; 
      background:#1e1e1e; 
      color:#fff; 
      border:1px solid #555;
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

    document.body.appendChild(this.popup);
    // this.root.appendChild(this.wrapper);
  }

  /*=====================================================
     Logic
  =====================================================*/

  openEditor(existing) {
    this.editing = existing || null;
    this.textarea.value = existing ? existing.code : "";
    this.popup.style.display = "block";
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
