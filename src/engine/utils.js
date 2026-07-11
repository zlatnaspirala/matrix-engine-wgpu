
export var supportsTouch = 'ontouchstart' in window || navigator.msMaxTouchPoints;

export const MeshType = Object.freeze({MESH: 0, INSTANCED: 1, PROCEDURAL: 2, BVHANIM: 3});

const touchStartHandler = function(e) {if(e.touches.length > 1) {e.preventDefault()} };
const touchMoveHandler = function(e) {if(e.touches.length > 1) {e.preventDefault()} };
const gestureStartHandler = function(e) {e.preventDefault()};

let preventZoomApplied = false;

export function preventZoom() {
  if(preventZoomApplied) return;
  preventZoomApplied = true;
  document.addEventListener('touchstart', touchStartHandler, {passive: false});
  document.addEventListener('touchmove', touchMoveHandler, {passive: false});
  document.addEventListener('gesturestart', gestureStartHandler);
}

// ✅ OPTIMIZATION: Cache screen.orientation check
let screenOrientationSupported = null;

export function getOrientation() {
  // 2011 from stackoverflow
  if(window.innerWidth > window.innerHeight) {
    return 'landscape';
  } else {
    return 'portrait';
  }
}
export function getScreenOrientationSupport() {
  if(screenOrientationSupported === null) {
    screenOrientationSupported = !!(screen.orientation && screen.orientation.lock);
  }
  return screenOrientationSupported;
}

export function checkLock() {
  return getScreenOrientationSupport();
}

export function mobileLock(o) {
  if(getScreenOrientationSupport()) {
    if(screen.orientation && screen.orientation.lock) screen.orientation.lock(o).then(function() {
      console.log(`%c[utils]Orientation locked to ${o}`, LOG_FUNNY_ARCADE);
    }).catch(function(error) {
      console.error("Orientation lock failed: ", error);
    });
  }
}

// ✅ OPTIMIZATION: Cache navigator.userAgent and regex patterns
const cachedUserAgent = navigator.userAgent;
const mobileRegexPatterns = [/Android/i, /webOS/i, /iPhone/i, /iPad/i, /iPod/i, /BlackBerry/i, /Windows Phone/i];
let mobileCheckResult = null;

export function isMobile() {
  if(mobileCheckResult !== null) return mobileCheckResult;
  if(supportsTouch) {
    mobileCheckResult = true;
    return true;
  }
  mobileCheckResult = mobileRegexPatterns.some(pattern => pattern.test(cachedUserAgent));
  return mobileCheckResult;
}

// ✅ OPTIMIZATION: Object pool for vec3 operations to eliminate per-frame allocations
const vec3Pool = {
  pool: [],
  acquire() {
    return this.pool.pop() || new Float32Array(3);
  },
  release(arr) {
    arr[0] = 0; arr[1] = 0; arr[2] = 0;
    this.pool.push(arr);
  }
};

export function vecOf(p) {
  if(p == null) return null;
  if(p.x !== undefined) return p;
  return {x: p[0], y: p[1], z: p[2]};
}

export function degToRad(degrees) {return (degrees * Math.PI) / 180}
export function radToDeg(r) {return r * (180 / Math.PI)}

export function createAppEvent(name, myDetails) {
  return new CustomEvent(name, {detail: {eventName: name, data: myDetails, }, bubbles: true, });
}

/**
 * @description
 * Load script in runtime.
 */
export var scriptManager = {
  SCRIPT_ID: 0,
  LOAD: function addScript(src, id, type, parent, callback) {
    var s = document.createElement('script');
    s.onload = function() {
      if(typeof callback != 'undefined') callback();
    };
    if(typeof type !== 'undefined') {
      s.setAttribute('type', type);
      s.innerHTML = src;
    } else {s.setAttribute('src', src)}
    if(typeof id !== 'undefined') {s.setAttribute('id', id)}
    if(typeof parent !== 'undefined') {
      document.getElementById(parent).appendChild(s);
      if(typeof callback != 'undefined') callback();
    } else {
      document.body.appendChild(s);
    }
  },
  loadModule: function addScript(src, id, type, parent) {
    var s = document.createElement('script');
    s.onload = function() {
      scriptManager.SCRIPT_ID++;
    };
    if(typeof type === 'undefined') {
      s.setAttribute('type', 'module');
      s.setAttribute('src', src);
    } else {
      s.setAttribute('type', type);
      s.innerHTML = src;
    }
    s.setAttribute('src', src);
    if(typeof id !== 'undefined') {
      s.setAttribute('id', id);
    }

    if(typeof parent !== 'undefined') {
      document.getElementById(parent).appendChild(s);
    } else {
      document.body.appendChild(s);
    }
  },
  loadGLSL: function(src) {
    return new Promise((resolve) => {
      fetch(src).then((data) => {
        resolve(data.text())
      })
    })
  }
};

// GET PULSE VALUES IN REAL TIME
export function OSCILLATOR(min, max, step, options) {
  if(min == null || max == null || step == null) {
    console.log("OSCILLATOR ERROR");
    return;
  }

  var ROOT = this;

  // ---- core values ----
  this.min0 = parseFloat(min);
  this.max0 = parseFloat(max);
  this.min = this.min0;
  this.max = this.max0;

  this.step = parseFloat(step);
  this.value_ = this.min;
  this.status = 0; // 0 up, 1 down

  // ---- options ----
  options = options || {};
  this.regime = options.regime || "pingpong";
  this.resist = parseFloat(options.resist) || 0;          // 0 = infinite
  this.resistMode = options.resistMode || "linear";       // linear | exp
  this.stopEpsilon = options.stopEpsilon || 0;            // 0 = never stop
  this.useDelta = options.useDelta || false;

  // ---- events ----
  this.on_maximum_value = function() {};
  this.on_minimum_value = function() {};
  this.on_stop = function() {};

  // ---- helpers ----
  this._applyResist = function() {
    if(this.resist <= 0) return;

    var range = this.max - this.min;
    if(range <= 0) return;

    var shrink;

    if(this.resistMode === "exp") {
      shrink = range * this.resist;
    } else {
      shrink = (this.max0 - this.min0) * this.resist;
    }

    this.min += shrink;
    this.max -= shrink;

    if(this.min > this.max) {
      var c = (this.min + this.max) * 0.5;
      this.min = this.max = c;
    }
  };

  // UPDATE!
  this.UPDATE = function(delta) {
    var s = this.step;
    if(this.useDelta && delta !== undefined) {
      s = s * delta;
    }
    switch(this.regime) {
      // ===== PING-PONG =====
      case "pingpong":
        if(this.status === 0) {
          this.value_ += s;
          if(this.value_ >= this.max) {
            this.value_ = this.max;
            this.status = 1;
            ROOT.on_maximum_value();
          }
        } else {
          this.value_ -= s;
          if(this.value_ <= this.min) {
            this.value_ = this.min;
            this.status = 0;
            this._applyResist();
            ROOT.on_minimum_value();
          }
        }
        break;

      // ===== ONLY MIN → MAX =====
      case "onlyFromMinToMax":
        this.value_ += s;
        if(this.value_ >= this.max) {
          this.value_ = this.min;
          this._applyResist();
          ROOT.on_maximum_value();
        }
        break;

      // ===== MAX → MIN =====
      case "fromMaxToMin":
        this.value_ -= s;
        if(this.value_ <= this.min) {
          this.value_ = this.max;
          this._applyResist();
          ROOT.on_minimum_value();
        }
        break;

      // ===== ONE SHOT =====
      case "oneShot":
        this.value_ += s;
        if(this.value_ >= this.max) {
          this.value_ = this.max;
          ROOT.on_stop();
        }
        break;

      // ===== SPRING TO CENTER =====
      case "springCenter":
        var center = (this.min + this.max) * 0.5;
        var force = (center - this.value_) * this.resist;
        this.value_ += force + s;

        if(Math.abs(center - this.value_) < this.stopEpsilon) {
          this.value_ = center;
          ROOT.on_stop();
        }
        break;
    }

    // ---- AUTO STOP ----
    if(this.stopEpsilon > 0) {
      if((this.max - this.min) < this.stopEpsilon) {
        ROOT.on_stop();
      }
    }

    return this.value_;
  };
}


// this is class not func ecma5
export function SWITCHER() {
  var ROOT = this;
  ROOT.VALUE = 1;
  ROOT.GET = function() {
    ROOT.VALUE = ROOT.VALUE * -1;
    return ROOT.VALUE;
  };
}

export function ORBIT(cx, cy, angle, p) {
  var s = Math.sin(angle);
  var c = Math.cos(angle);
  p.x -= cx;
  p.y -= cy;
  var xnew = p.x * c - p.y * s;
  var ynew = p.x * s + p.y * c;
  p.x = xnew + cx;
  p.y = ynew + cy;
  return p;
}

export function ORBIT_FROM_ARRAY(cx, cy, angle, p, byIndexs) {
  var s = Math.sin(angle);
  var c = Math.cos(angle);
  p[byIndexs[0]] -= cx;
  p[byIndexs[1]] -= cy;
  var xnew = p[byIndexs[0]] * c - p[byIndexs[1]] * s;
  var ynew = p[byIndexs[0]] * s + p[byIndexs[1]] * c;
  p[byIndexs[0]] = xnew + cx;
  p[byIndexs[1]] = ynew + cy;
  return p;
}

export var byId = function(id) {return document.getElementById(id)};
export function randomFloatFromTo(min, max) {return Math.random() * (max - min) + min;}

export function randomIntFromTo(min, max) {
  if(typeof min === 'object' || typeof max === 'object') {
    console.log(
      "SYS : warning Desciption : Replace object with string , this >> " + typeof min + ' and ' + typeof min + ' << must be string or number.'
    );
  } else if(typeof min === 'undefined' || typeof max === 'undefined') {
    console.log(
      "SYS : warning Desciption : arguments (min, max) cant be undefined , this >> " + typeof min + ' and ' + typeof min + ' << must be string or number.'
    );
  } else {
    return Math.floor(Math.random() * (max - min + 1) + min);
  }
}

export var urlQuery = (function() {
  var query_string = {};
  var query = window.location.search.substring(1);
  var vars = query.split('&');
  for(var i = 0;i < vars.length;i++) {
    var pair = vars[i].split('=');
    if(typeof query_string[pair[0]] === 'undefined') {
      query_string[pair[0]] = decodeURIComponent(pair[1]);
    } else if(typeof query_string[pair[0]] === 'string') {
      var arr = [query_string[pair[0]], decodeURIComponent(pair[1])];
      query_string[pair[0]] = arr;
    } else {
      query_string[pair[0]].push(decodeURIComponent(pair[1]));
    }
  }
  return query_string;
})();


export function getAxisRot(q1) {
  var x, y, z;

  // if w>1 acos and sqrt will produce errors, this cant happen if quaternion is normalised
  if(q1.w > 1) q1.normalise();
  var angle = 2 * Math.acos(q1.w);
  // assuming quaternion normalised then w is less than 1, so term always positive.
  var s = Math.sqrt(1 - q1.w * q1.w);
  // test to avoid divide by zero, s is always positive due to sqrt
  if(s < 0.001) {
    // if s close to zero then direction of axis not important
    // if it is important that axis is normalised then replace with x=1; y=z=0;

    x = q1.x;
    y = q1.y;
    z = q1.z;
  } else {
    x = q1.x / s; // normalise axis
    y = q1.y / s;
    z = q1.z / s;
  }
  return [radToDeg(x), radToDeg(y), radToDeg(z)]
}

export function getAxisRot2(targetAxis, Q) {
  Q.normalize(); // if w>1 acos and sqrt will produce errors, this cant happen if quaternion is normalised
  var angle = 2 * Math.acos(Q.w());
  var s = Math.sqrt(1 - Q.w() * Q.w()); // assuming quaternion normalised then w is less than 1, so term always positive.
  if(s < 0.001) { // test to avoid divide by zero, s is always positive due to sqrt
    // if s close to zero then direction of axis not important
    // if it is important that axis is normalised then replace with x=1; y=z=0;
    // targetAxis.x = 1;
    // targetAxis.y = 0;
    // targetAxis.z = 0;
    targetAxis.x = Q.x();
    targetAxis.y = Q.y();
    targetAxis.z = Q.z();
  } else {
    targetAxis.x = Q.x() / s; // normalise axis
    targetAxis.y = Q.y() / s;
    targetAxis.z = Q.z() / s;
  }
  return [targetAxis, angle];
}

export function getAxisRot3(Q) {

  var angle = Math.acos(Q.w) * 2;
  var axis = {};

  if(Math.sin(Math.acos(angle)) > 0) {

    axis.x = Q.x / Math.sin(Math.acos(angle / 2));
    axis.y = Q.y / Math.sin(Math.acos(angle / 2));
    axis.z = Q.z / Math.sin(Math.acos(angle / 2));

  } else {
    axis.x = 0;
    axis.y = 0;
    axis.z = 0;
  }

  return axis;
}

export function quaternion_rotation_matrix(Q) {
  var q0 = Q[0]
  var q1 = Q[1]
  var q2 = Q[2]
  var q3 = Q[3]
  var r00 = 2 * (q0 * q0 + q1 * q1) - 1
  var r01 = 2 * (q1 * q2 - q0 * q3)
  var r02 = 2 * (q1 * q3 + q0 * q2)
  var r10 = 2 * (q1 * q2 + q0 * q3)
  var r11 = 2 * (q0 * q0 + q2 * q2) - 1
  var r12 = 2 * (q2 * q3 - q0 * q1)
  var r20 = 2 * (q1 * q3 - q0 * q2)
  var r21 = 2 * (q2 * q3 + q0 * q1)
  var r22 = 2 * (q0 * q0 + q3 * q3) - 1
  var rot_matrix = [[r00, r01, r02],
  [r10, r11, r12],
  [r20, r21, r22]]
  return rot_matrix;
}

export const LOG_WARN = 'background: gray; color: yellow; font-size:10px';
export const LOG_INFO = 'background: green; color: white; font-size:11px';
export const LOG_MATRIX = "font-family: stormfaze;color: #lime; font-size:11px;text-shadow: 2px 2px 4px orangered;background: black;";
export const LOG_FUNNY = "font-family: stormfaze;color: #f1f033; font-size:18px;text-shadow: 2px 2px 4px #f335f4, 4px 4px 4px #d64444, 2px 2px 4px #c160a6, 6px 2px 0px #123de3;background: black;";
export const LOG_FUNNY_SMALL = "font-family: stormfaze;color: #f1f033; font-size:10px;text-shadow: 2px 2px 4px #f335f4, 4px 4px 4px #d64444, 1px 1px 2px #c160a6, 3px 1px 0px #123de3;background: black;";
export const LOG_FUNNY_BIG_TERMINAL =
  "font-family: monospace; font-size:15px; font-weight:bold;" +
  "color:#33ff33;" +
  "text-shadow: 2px 2px 0 #003300;" +
  "background:#000; padding:10px 14px;";
export const LOG_FUNNY_ARCADE =
  "font-family: system-ui; font-size:16px; font-weight:400;" +
  "color:#ffffff;" +
  "text-shadow: 2px 2px 6px #000;" +
  "background:linear-gradient(90deg,#111,#222); padding:12px 18px;";
export const LOG_FUNNY_BIG_ARCADE =
  "font-family: system-ui; font-size:24px; font-weight:600;" +
  "color:#ffffff;" +
  "text-shadow: 2px 2px 6px #000;" +
  "background:linear-gradient(90deg,#111,#222); padding:12px 18px;";
export const LOG_FUNNY_BIG_NEON =
  "font-family: stormfaze; font-size:30px; font-weight:900;" +
  "color:#00ffff;" +
  "text-shadow: 0 0 5px #01d6d6ff, 0 0 10px #00ffff, 4px 4px 0 #ff00ff;" +
  "background:black; padding:14px 18px;";

export const LOG_FUNNY_EXTRABIG =
  "font-family: stormfaze; font-size:230px; font-weight:900;" +
  "color:#00ffff;" +
  "text-shadow: 0 0 5px #01d6d6ff, 0 0 10px #00ffff, 4px 4px 0 #ff00ff;" +
  "background:black; padding:14px 18px;";

export function genName(length) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for(let i = 0;i < length;i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export const meLoader = {
  create: function(text = "RUN RETURN", callback) {
    const loader = document.createElement("div");
    loader.id = "loader";

    Object.assign(loader.style, {
      position: "fixed",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      top: "0",
      left: "0",
      width: "100vw",
      height: "100vh",
      zIndex: 9999,
      background: "#000000ff",
      fontFamily: "Orbitron, sans-serif",
      cursor: 'url(./res/icons/default.png) 0 0, auto',
    });

    loader.innerHTML = `
  <div style="
    font-size: 42px;
    width: 50vw;
    margin-top: -15%;
    font-weight: 900;
    color: #00ffff;
    letter-spacing: 4px;
    text-align: center;
    text-shadow:
      0 0 5px #00ffff,
      0 0 10px #00ffff,
      0 0 20px #00ffff,
      0 0 40px #00ffff;
    animation: glowPulse 1.5s infinite alternate;
  ">
    ${text}
  </div>

  <style>
    @keyframes glowPulse {
      from {
        transform: scale(1);
        text-shadow:
          0 0 5px #00ffff,
          0 0 10px #00ffff,
          0 0 20px #00ffff;
      }
      to {
        transform: scale(1.05);
        text-shadow:
          0 0 10px #00ffff,
          0 0 20px #00ffff,
          0 0 40px #00ffff,
          0 0 80px #00ffff;
      }
    }
  </style>
`;
    if(callback) loader.addEventListener('click', callback);
    document.body.appendChild(loader);
  },
  destroy: function() {
    if(byId('loader')) document.body.removeChild(byId('loader'));
  }
};

export let mb = {
  root: () => byId('msgBox'),
  pContent: () => byId('not-content'),
  copy: function() {
    navigator.clipboard.writeText(mb.root().children[0].innerText);
  },
  c: 0, ic: 0, t: {},
  setContent: function(content, t) {
    var iMsg = document.createElement('div');
    iMsg.innerHTML = content;
    iMsg.id = `msgbox-loc-${mb.c}`;
    mb.root().appendChild(iMsg);
    iMsg.classList.add('animate1')
    if(t == 'ok') {
      iMsg.style = 'font-family: stormfaze;color:white;padding:7px;margin:2px';
    } else if(t == "spacial-case-mob") {
      iMsg.style = 'font-family: stormfaze;color:white;padding:7px;margin-left:-2px';
    } else {
      iMsg.style = 'font-family: stormfaze;color:white;padding:7px;margin:2px';
    }
  },
  kill: function() {
    mb.root().remove();
  },
  show: function(content, t, delay = 1000) {
    mb.setContent(content, t);
    mb.root().style.display = "block";
    var loc2 = mb.c;
    setTimeout(() => {
      byId(`msgbox-loc-${loc2}`).classList.remove("fadeInDown");
      byId(`msgbox-loc-${loc2}`).classList.add("fadeOut");
      setTimeout(function() {
        byId(`msgbox-loc-${loc2}`).style.display = "none";
        byId(`msgbox-loc-${loc2}`).classList.remove("fadeOut");

        byId(`msgbox-loc-${loc2}`).remove();
        mb.ic++;
        if(mb.c == mb.ic) {
          mb.root().style.display = 'none';
        }
      }, delay)
    }, 3 * delay);
    mb.c++;
  },
  error: function(content) {
    if(mb.root() == null) return;
    mb.root().classList.remove("success")
    mb.root().classList.add("error")
    mb.root().classList.add("fadeInDown");
    mb.show(content, 'err');
  },
  success: function(content) {
    if(mb.root() == null) return;
    mb.root().classList.remove("error")
    mb.root().classList.add("success")
    mb.root().classList.add("fadeInDown");
    mb.show(content, 'ok');
  }
}

// Registry to track running animations per element
const typingStates = new Map();

export function typeText(elementId, htmlString, delay = 50) {
  const el = document.getElementById(elementId);
  if(!el) return;

  // If an existing typing is running for this element, cancel it
  if(typingStates.has(elementId)) {
    clearTimeout(typingStates.get(elementId).timeoutId);
    typingStates.delete(elementId);
  }

  el.innerHTML = ''; // Clear previous content

  const tempEl = document.createElement('div');
  tempEl.innerHTML = htmlString;

  const queue = [];

  function flatten(node) {
    if(node.nodeType === Node.TEXT_NODE) {
      queue.push({type: 'text', text: node.textContent});
    } else if(node.nodeType === Node.ELEMENT_NODE) {
      if(node.tagName.toLowerCase() === 'img') {
        queue.push({
          type: 'img',
          src: node.getAttribute('src'),
          alt: node.getAttribute('alt') || ''
        });
      } else {
        queue.push({
          type: 'element',
          tag: node.tagName.toLowerCase(),
          attributes: Object.fromEntries([...node.attributes].map(attr => [attr.name, attr.value]))
        });
        for(const child of node.childNodes) flatten(child);
        queue.push({type: 'end'});
      }
    }
  }

  for(const node of tempEl.childNodes) flatten(node);

  let stack = [];
  let currentElement = el;

  function typeNextChar() {
    if(queue.length === 0) {
      typingStates.delete(elementId); // Cleanup after finish
      return;
    }

    const item = queue[0];

    if(item.type === 'text') {
      if(!item.index) item.index = 0;

      const ch = item.text[item.index];
      if(ch === '\n') {
        currentElement.appendChild(document.createElement('br'));
      } else {
        currentElement.appendChild(document.createTextNode(ch));
      }

      item.index++;
      if(item.index >= item.text.length) queue.shift();

    } else if(item.type === 'element') {
      const newEl = document.createElement(item.tag);
      if(item.attributes) {
        for(let [key, val] of Object.entries(item.attributes)) {
          newEl.setAttribute(key, val);
        }
      }
      currentElement.appendChild(newEl);
      stack.push(currentElement);
      currentElement = newEl;
      queue.shift();

    } else if(item.type === 'end') {
      currentElement = stack.pop();
      queue.shift();

    } else if(item.type === 'img') {
      const img = document.createElement('img');
      img.src = item.src;
      img.alt = item.alt;
      img.style.maxWidth = '100px';
      img.style.verticalAlign = 'middle';
      currentElement.appendChild(img);
      queue.shift();
    }

    // Schedule next step and store timeoutId for control
    const timeoutId = setTimeout(typeNextChar, delay);
    typingStates.set(elementId, {timeoutId});
  }

  typeNextChar();
}

export function setupCanvasFilters(canvasId) {
  let canvas = document.getElementById(canvasId);
  if(canvas == null) {
    canvas = document.getElementsByTagName('canvas')[0];
  }

  const filterState = {
    blur: "0px",
    grayscale: "0%",
    brightness: "100%",
    contrast: "100%",
    saturate: "100%",
    sepia: "0%",
    invert: "0%",
    hueRotate: "0deg"
  };

  function updateFilter() {
    const filterString = `
      blur(${filterState.blur}) 
      grayscale(${filterState.grayscale}) 
      brightness(${filterState.brightness}) 
      contrast(${filterState.contrast}) 
      saturate(${filterState.saturate}) 
      sepia(${filterState.sepia}) 
      invert(${filterState.invert}) 
      hue-rotate(${filterState.hueRotate})
    `.trim();

    canvas.style.filter = filterString;
  }

  const bindings = {
    blurControl: "blur",
    grayscaleControl: "grayscale",
    brightnessControl: "brightness",
    contrastControl: "contrast",
    saturateControl: "saturate",
    sepiaControl: "sepia",
    invertControl: "invert",
    hueControl: "hueRotate"
  };

  Object.entries(bindings).forEach(([selectId, key]) => {
    const el = document.getElementById(selectId);
    el.addEventListener("change", (e) => {
      filterState[key] = e.target.value;
      updateFilter();
    });
  });

  updateFilter(); // Initial
}

/**
 * @description
 * // Save an object
    Storage.set('playerData', { name: 'Slayzer', hp: 120, mana: 80 });

    // Load it back
    const player = Storage.get('playerData');
    console.log(player.name); // "Slayzer"

    // Check if exists
    if (Storage.has('playerData')) console.log('Found!');

    // Remove one
    Storage.remove('playerData');

    // Clear all localStorage
    Storage.clear();
 */
export const LS = {
  set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  },

  get(key, defaultValue = null) {
    const item = localStorage.getItem(key);
    try {
      return item ? JSON.parse(item) : defaultValue;
    } catch(e) {
      console.warn(`Error parsing localStorage key "${key}"`, e);
      return defaultValue;
    }
  },

  has(key) {
    return localStorage.getItem(key) !== null;
  },

  remove(key) {
    localStorage.removeItem(key);
  },

  clear() {
    localStorage.clear();
  }
};

export const SS = {
  set(key, value) {
    sessionStorage.setItem(key, JSON.stringify(value));
  },

  get(key, defaultValue = null) {
    const item = sessionStorage.getItem(key);
    try {
      return item ? JSON.parse(item) : defaultValue;
    } catch(e) {
      console.warn(`Error parsing sessionStorage key "${key}"`, e);
      return defaultValue;
    }
  },

  has(key) {
    return sessionStorage.getItem(key) !== null;
  },

  remove(key) {
    sessionStorage.removeItem(key);
  },

  clear() {
    sessionStorage.clear();
  }
};

export const jsonHeaders = new Headers({
  "Content-Type": "application/json",
  "Accept": "application/json",
});

export const htmlHeader = new Headers({
  "Content-Type": "text/html",
  "Accept": "text/plain",
});

export function isEven(n) {
  return n % 2 === 0;
}

export function isOdd(n) {
  return n % 2 !== 0;
}

export class FullScreenManagerElement {
  constructor(targetElement = document.documentElement) {
    this.target = targetElement;
  }
  isFullscreen() {
    return !!(
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement
    );
  }
  request() {
    const el = this.target;
    return (
      el.requestFullscreen?.() ||
      el.webkitRequestFullscreen?.() ||
      el.mozRequestFullScreen?.() ||
      el.msRequestFullscreen?.()
    );
  }
  exit() {
    return (
      document.exitFullscreen?.() ||
      document.webkitExitFullscreen?.() ||
      document.mozCancelFullScreen?.() ||
      document.msExitFullscreen?.()
    );
  }
  toggle() {
    if(this.isFullscreen()) return this.exit();
    return this.request();
  }
  onChange(callback) {
    [
      "fullscreenchange",
      "webkitfullscreenchange",
      "mozfullscreenchange",
      "MSFullscreenChange"
    ].forEach(evt =>
      document.addEventListener(evt, () => {
        callback(this.isFullscreen(), this.target);
      })
    );
  }
}

export class FullscreenManager {
  constructor() {
    this.target = document.documentElement;
  }

  isFullscreen() {
    return !!(
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement
    );
  }

  request() {
    const el = this.target;
    return (
      el.requestFullscreen?.() || el.webkitRequestFullscreen?.() || el.mozRequestFullScreen?.() || el.msRequestFullscreen?.()
    );
  }

  exit() {
    return (
      document.exitFullscreen?.() || document.webkitExitFullscreen?.() || document.mozCancelFullScreen?.() || document.msExitFullscreen?.()
    );
  }

  toggle() {return this.isFullscreen() ? this.exit() : this.request()}

  onChange(callback) {
    [
      "fullscreenchange",
      "webkitfullscreenchange",
      "mozfullscreenchange",
      "MSFullscreenChange"
    ].forEach(evt =>
      document.addEventListener(evt, () => {
        callback(this.isFullscreen());
      })
    );
  }
}

export function alignTo256(n) {return Math.ceil(n / 256) * 256;}

export const geometryTypes = Object.freeze({
  "quad": "quad",
  "cube": "cube",
  "sphere": "sphere",
  "pyramid": "pyramid",
  "star": "star",
  "circle": "circle",
  "diamond": "diamond",
  "rock": "rock",
  "meteor": "meteor",
  "thunder": "thunder",
  "shard": "shard",
  "circlePlane": "circlePlane",
  "ring": "ring",
  "icosahedron": "icosahedron",
  "torusKnot": "torusKnot",
  "mobius": "mobius",
  "crystal": "crystal",
  "starPrism": "starPrism",
  "crescent": "crescent",
  "pyramidFractal": "pyramidFractal",
});

export const geoTypesForMorph = Object.freeze({
  cube: "cube",
  sphere: "sphere",
  mobius: "mobius",
  cylinder: "cylinder",
  plane: "plane",
  capsule: "capsule",
  cone: "cone",
  torus: "torus",
  wavePlane: "wavePlane",
  supershape: "supershape",
  pyramid: "pyramid",
  diamond: "diamond",
  icosahedron: "icosahedron",
  circlePlane: "circlePlane",
  rock: "rock",
  star: "star",
  star3d: "star3d",
  littleStar: "littleStar",
  flatStar: "flatStar",
  klein: "klein",
  shell: "shell",
  rippleSphere: "rippleSphere",
  twistedTorus: "twistedTorus",
  tornado: "tornado",
  galaxySpiral: "galaxySpiral"
});

export class CameraPath {
  constructor(keyframes, options = {}) {
    this.keyframes = keyframes;
    this.loop = options.loop ?? false;
    this.param = options.parameterization ?? 'uniform';
    this._tension = options.tension ?? 0.5;
    if(this.param === 'arc') this._buildArcTable();
  }

  static _cr(p0, p1, p2, p3, t, tension = 0.5) {
    const t2 = t * t, t3 = t2 * t;
    return tension * (
      (2 * p1) +
      (-p0 + p2) * t +
      (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 +
      (-p0 + 3 * p1 - 3 * p2 + p3) * t3
    );
  }

  _indices(i) {
    const n = this.keyframes.length;
    if(this.loop) {
      return [((i - 1) + n) % n, i % n, (i + 1) % n, (i + 2) % n];
    }
    return [
      Math.max(0, i - 1),
      Math.max(0, Math.min(n - 1, i)),
      Math.max(0, Math.min(n - 1, i + 1)),
      Math.max(0, Math.min(n - 1, i + 2)),
    ];
  }

  _interpVec3(field, i, lt) {
    const [i0, i1, i2, i3] = this._indices(i);
    const k = this.keyframes, T = this._tension, cr = CameraPath._cr;
    return [
      cr(k[i0][field][0], k[i1][field][0], k[i2][field][0], k[i3][field][0], lt, T),
      cr(k[i0][field][1], k[i1][field][1], k[i2][field][1], k[i3][field][1], lt, T),
      cr(k[i0][field][2], k[i1][field][2], k[i2][field][2], k[i3][field][2], lt, T),
    ];
  }

  _interpScalar(field, fallback, i, lt) {
    const [i0, i1, i2, i3] = this._indices(i);
    const k = this.keyframes;
    return CameraPath._cr(
      k[i0][field] ?? fallback, k[i1][field] ?? fallback,
      k[i2][field] ?? fallback, k[i3][field] ?? fallback,
      lt, this._tension
    );
  }

  _buildArcTable(samples = 200) {
    const n = this.keyframes.length - (this.loop ? 0 : 1);
    this._arcTable = [{raw: 0, arc: 0}];
    let totalLen = 0;
    let prev = this._sampleRaw(0);
    for(let s = 1;s <= samples;s++) {
      const raw = s / samples;
      const cur = this._sampleRaw(raw);
      const dx = cur.position[0] - prev.position[0];
      const dy = cur.position[1] - prev.position[1];
      const dz = cur.position[2] - prev.position[2];
      totalLen += Math.sqrt(dx * dx + dy * dy + dz * dz);
      this._arcTable.push({raw, arc: totalLen});
      prev = cur;
    }
    this._totalArcLength = totalLen;
    this._arcTable.forEach(e => e.arc /= totalLen);
  }

  _arcToRaw(t) {
    if(t <= 0) return 0;
    if(t >= 1) return 1;
    const tbl = this._arcTable;
    let lo = 0, hi = tbl.length - 1;
    while(lo < hi - 1) {
      const mid = (lo + hi) >> 1;
      if(tbl[mid].arc < t) lo = mid; else hi = mid;
    }
    const span = tbl[hi].arc - tbl[lo].arc;
    if(span < 1e-9) return tbl[lo].raw;
    const f = (t - tbl[lo].arc) / span;
    return tbl[lo].raw + f * (tbl[hi].raw - tbl[lo].raw);
  }

  _sampleRaw(t) {
    const n = this.keyframes.length;
    const segments = this.loop ? n : n - 1;
    const clamped = Math.max(0, Math.min(1, t));
    const scaled = clamped * segments;
    const i = Math.min(Math.floor(scaled), segments - 1);
    const lt = scaled - i;
    return {
      position: this._interpVec3('position', i, lt),
      target: this._interpVec3('target', i, lt),
      roll: this._interpScalar('roll', 0, i, lt),
      fov: this._interpScalar('fov', (2 * Math.PI) / 5, i, lt),
    };
  }

  sample(t) {
    if(this.param === 'arc') return this._sampleRaw(this._arcToRaw(t));
    if(this.param === 'timed') {
      const times = this.keyframes.map(k => k.time ?? 0);
      const total = times[times.length - 1];
      return this._sampleRaw(total > 0 ? t / total : 0);
    }
    return this._sampleRaw(t);
  }

  get totalTime() {
    if(this.param === 'timed') {
      return this.keyframes[this.keyframes.length - 1].time ?? 0;
    }
    return 1;
  }
}

export function distance3D(a, b) {
  if(!b) return 1000;
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z - b.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}