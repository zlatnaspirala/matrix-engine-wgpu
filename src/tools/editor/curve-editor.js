export class CurveEditor {
  constructor({ width = 300, height = 150, samples = 256 } = {}) {
    this.width = width;
    this.height = height;
    this.samples = samples;

    this.keys = [
      { time: 0, value: 0, inTangent: 0, outTangent: 0 },
      { time: 1, value: 1, inTangent: 0, outTangent: 0 },
    ];

    this.canvas = document.createElement("canvas");
    this.canvas.width = width;
    this.canvas.height = height;
    this.ctx = this.canvas.getContext("2d");

    this.activeKey = null;
    this.dragMode = null;

    this.time = 0;           // runtime time
    this.loop = true;
    this.speed = 1;
    this.baked = this.bake(samples);

    this.isGraphRunning = false; // flag for scrubbing playhead

    this._editorOpen = false;
    this._createPopup();
    this._bindMouse();
    this.draw();
  }

  // =========================
  // VALUE EVALUATION (HERMITE)
  // =========================
  getValue(t) {
    t = Math.max(0, Math.min(1, t));

    for (let i = 0; i < this.keys.length - 1; i++) {
      const k0 = this.keys[i];
      const k1 = this.keys[i + 1];
      if (t >= k0.time && t <= k1.time) {
        const dt = k1.time - k0.time;
        const u = (t - k0.time) / dt;
        const u2 = u * u;
        const u3 = u2 * u;
        const m0 = k0.outTangent * dt;
        const m1 = k1.inTangent * dt;
        return (
          (2*u3 - 3*u2 + 1)*k0.value +
          (u3 - 2*u2 + u)*m0 +
          (-2*u3 + 3*u2)*k1.value +
          (u3 - u2)*m1
        );
      }
    }
    return this.keys.at(-1).value;
  }

  // =========================
  // DRAW
  // =========================
  draw() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#0b0f14";
    ctx.fillRect(0, 0, w, h);

    // grid
    ctx.strokeStyle = "#1c2533";
    for (let i = 0; i <= 10; i++) {
      const x = (i/10)*w;
      const y = (i/10)*h;
      ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,h); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(w,y); ctx.stroke();
    }

    // curve
    ctx.strokeStyle = "#4fc3f7";
    ctx.beginPath();
    for(let i=0;i<=100;i++){
      const t = i/100;
      const x = t*w;
      const y = (1-this.getValue(t))*h;
      i===0 ? ctx.moveTo(x,y) : ctx.lineTo(x,y);
    }
    ctx.stroke();

    // keys + tangents
    this.keys.forEach(k=>{
      const x = k.time*w;
      const y = (1-k.value)*h;

      // tangents
      ctx.strokeStyle="#888";
      ctx.beginPath();
      ctx.moveTo(x,y);
      ctx.lineTo(x+30, y - k.outTangent*30);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(x,y);
      ctx.lineTo(x-30, y + k.inTangent*30);
      ctx.stroke();

      // key circle
      ctx.fillStyle="#ffcc00";
      ctx.beginPath();
      ctx.arc(x,y,4,0,Math.PI*2);
      ctx.fill();
    });

    // =========================
    // PLAYHEAD
    // =========================
    const playX = this.time * w;
    const playY = (1 - this.getValueNow()) * h;

    // vertical line
    ctx.strokeStyle = "#ff5555";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(playX, 0);
    ctx.lineTo(playX, h);
    ctx.stroke();

    // dot
    ctx.fillStyle = "#ff5555";
    ctx.beginPath();
    ctx.arc(playX, playY, 5, 0, Math.PI*2);
    ctx.fill();

    ctx.lineWidth = 1;
  }

  // =========================
  // MOUSE INTERACTION
  // =========================
  _bindMouse() {
    const hitKey = (mx,my)=>{
      const w=this.width,h=this.height;
      return this.keys.find(k=>{
        const x=k.time*w, y=(1-k.value)*h;
        return Math.hypot(mx-x,my-y)<6;
      });
    };

    const hitPlayhead = (mx,my)=>{
      if(this.isGraphRunning) return false;
      const playX = this.time*this.width;
      const playY = (1 - this.getValueNow())*this.height;
      return Math.hypot(mx - playX, my - playY) < 8;
    };

    this.canvas.addEventListener("mousedown", e=>{
      const r=this.canvas.getBoundingClientRect();
      const mx = e.clientX - r.left;
      const my = e.clientY - r.top;

      if(hitPlayhead(mx,my)){
        this.activeKey = 'playhead';
        this.dragMode = 'playhead';
        return;
      }

      const k = hitKey(mx,my);
      if(k){
        this.activeKey = k;
        this.dragMode = e.shiftKey ? "tangent" : "key";
      }
    });

    window.addEventListener("mousemove", e=>{
      if(!this.activeKey) return;
      const r=this.canvas.getBoundingClientRect();
      const mx = e.clientX - r.left;
      const my = e.clientY - r.top;

      // ===== playhead dragging =====
      if(this.dragMode==='playhead' && this.activeKey==='playhead'){
        const t = Math.max(0, Math.min(1, mx / this.width));
        this.time = t;
        this.draw();
        return;
      }

      // ===== key dragging =====
      if(this.dragMode==="key"){
        this.activeKey.time = Math.max(0, Math.min(1, mx/r.width));
        this.activeKey.value = Math.max(0, Math.min(1,1-my/r.height));
        this.keys.sort((a,b)=>a.time-b.time);
      }
      if(this.dragMode==="tangent"){
        const dx = (mx/r.width) - this.activeKey.time;
        const dy = (1-my/r.height) - this.activeKey.value;
        this.activeKey.outTangent = dy/dx || 0;
        this.activeKey.inTangent = this.activeKey.outTangent;
      }

      this.draw();
      this._reBake();
    });

    window.addEventListener("mouseup", ()=>{
      this.activeKey = null;
      this.dragMode = null;
    });

    // add key
    this.canvas.addEventListener("dblclick", e=>{
      const r=this.canvas.getBoundingClientRect();
      const t = (e.clientX - r.left)/r.width;
      const v = 1-(e.clientY - r.top)/r.height;
      this.keys.push({time:t,value:v,inTangent:0,outTangent:0});
      this.keys.sort((a,b)=>a.time-b.time);
      this.draw();
      this._reBake();
    });

    // delete key
    this.canvas.addEventListener("contextmenu", e=>{
      e.preventDefault();
      const r=this.canvas.getBoundingClientRect();
      const mx = e.clientX - r.left;
      const my = e.clientY - r.top;
      const k = hitKey(mx,my);
      if(k && this.keys.length>2){
        this.keys=this.keys.filter(x=>x!==k);
        this.draw();
        this._reBake();
      }
    });
  }

  // =========================
  // BAKING
  // =========================
  bake(samples=this.samples){
    const data = new Float32Array(samples);
    for(let i=0;i<samples;i++){
      const t=i/(samples-1);
      data[i]=this.getValue(t);
    }
    return data;
  }

  _reBake(){ this.baked=this.bake(this.samples); }

  // =========================
  // RUNTIME EXEC (like TimelineNode)
  // =========================
  exec(delta){
    this.time += delta*this.speed;
    if(this.loop && this.time>1) this.time=0;
    if(!this.loop && this.time>1) this.time=1;
    const idx = Math.floor(this.time*(this.samples-1));
    this.value = this.baked[idx];
    return this.value;
  }

  getValueNow(){ return this.value; }

  // =========================
  // POPUP UI
  // =========================
  _createPopup(){
    this.popup = document.createElement("div");
    Object.assign(this.popup.style,{
      position:"fixed",
      top:"50%",
      left:"50%",
      transform:"translate(-50%,-50%)",
      background:"#111",
      border:"1px solid #333",
      padding:"8px",
      display:"none",
      zIndex:9999
    });
    this.popup.appendChild(this.canvas);
    document.body.appendChild(this.popup);
  }

  toggleEditor(){
    this._editorOpen=!this._editorOpen;
    this.popup.style.display=this._editorOpen?"block":"none";
    this.draw();
  }
}
