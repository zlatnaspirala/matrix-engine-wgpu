import {byId, isMobile} from "../../../src/engine/utils";

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

  updateFilter();
}

export let settingsBox = `
<div style="">
  <span style="font-size:170%" data-label="settings"></span>
  <div style="justify-items: flex-end;margin:20px;" >
    <div>
      <span data-label="sounds"></span>
      <label class="switch">
        <input id="settingsAudios" type="checkbox">
        <span class="sliderSwitch round"></span>
      </label>
    </div>
    <div>
      <span data-label="lightMove"></span>
      <label class="switch">
        <input id="settingsLight" type="checkbox">
        <span class="sliderSwitch round"></span>
      </label>
    </div>
      <div style="margin-top:20px;margin-bottom:15px;">
        <span style="font-size: larger;margin-bottom:15px" data-label="graphics"></span>
        <p></p>
        <label>Anim speed:</label>
        <select id="physicsSpeed" class="setting-select">
          <option value="1">Slow</option>
          <option value="2">Normal</option>
          <option value="3">Fast</option>
        </select>
      </div>

      <div>
        <label>Blur:</label>
        <select id="blurControl">
          <option value="0px">Blur: 0</option>
          <option value="1px">Blur: 1</option>
          <option value="2px">Blur: 2</option>
          <option value="3px">Blur: 3</option>
        </select>
      </div>

      <div>
      <label>Grayscale:</label>
      <select id="grayscaleControl">
        <option value="0%">Grayscale: 0%</option>
        <option value="25%">Grayscale: 25%</option>
        <option value="50%">Grayscale: 50%</option>
        <option value="75%">Grayscale: 75%</option>
        <option value="100%">Grayscale: 100%</option>
      </select>
      </div>
      
      <div>
       <label>Brightness:</label>
      <select id="brightnessControl">
        <option value="100%">100%</option>
        <option value="150%">150%</option>
        <option value="200%">200%</option>
      </select>
      </div>
      
      <div>
      <label>Contrast:</label>
      <select id="contrastControl">
        <option value="100%">100%</option>
        <option value="150%">150%</option>
        <option value="200%">200%</option>
      </select>
      </div>
      
      <div>
      <label>Saturate:</label>
      <select id="saturateControl">
        <option value="100%">100%</option>
        <option value="150%">150%</option>
        <option value="200%">200%</option>
      </select>
     </div>
      
      <div>
      <label>Sepia:</label>
      <select id="sepiaControl">
        <option value="0%">0%</option>
        <option value="50%">50%</option>
        <option value="100%">100%</option>
      </select>
     </div>
      
      <div>
      <label>Invert:</label>
      <select id="invertControl">
        <option value="0%">0%</option>
        <option value="50%">50%</option>
        <option value="100%">100%</option>
      </select>
     </div>
      
      <div>
      <label>Hue Rotate:</label>
      <select id="hueControl">
        <option value="0deg">0°</option>
        <option value="90deg">90°</option>
        <option value="180deg">180°</option>
        <option value="270deg">270°</option>
      </select>
      </div>
 
    <div style="margin-top:20px;">
      <button class="btn" onclick="document.getElementById('messageBox').style.display = 'none'">
        <span data-label="hide"></span>
      </button>
    </div>

    <img src="res/icons/512.png" style="position:absolute;left:10px;top:5%;width:300px;z-index:-1;"/>
  </div>
</div>`;

export let welcomeBoxHTML =
  `<span class="fancy-title" data-label="welcomeMsg"></span>
     <a href="https://github.com/zlatnaspirala/matrix-engine-wgpu">zlatnaspirala/matrix-engine-wgpu</a><br><br>
     <div style="display:flex;flex-direction:column;align-items: center;margin:20px;padding: 10px;">
       <span style="width:100%" data-label="choosename"></span>
       <input id='nickId' style="text-align: center;height:50px;font-size:100%;width:250px" class="fancy-label" type="text" value="" />
      </div>
     <button id="startFromWelcome" class="btn" ><span style="font-size:30px;margin:15px;padding:10px" data-label="startGame"></span></button> <br>
     <div><span class="fancy-label" data-label="changeLang"></span></div> 
     <button class="btn" onclick="
      app.label.loadMultilang('en').then(r => {
        app.label.get = r;
        app.label.update()
      });
     " ><span data-label="english"></span></button> 
     <button class="btn" onclick="app.label.loadMultilang('sr').then(r => {
        app.label.get = r
        app.label.update() })" ><span data-label="serbian"></span></button>`;

export class hang3dUI {
  constructor() {
    var messageBox = document.createElement('div')
    messageBox.id = 'messageBox';
    messageBox.classList.add('msg-box')
    // messageBox.innerHTML = welcomeBoxHTML;
    messageBox.style.display = 'none';
    messageBox.style.zIndex = 10000;
    messageBox.style.top = isMobile() ? '10%' : '5%';
    messageBox.style.width = isMobile() ? '100%' : '50%';
    messageBox.style.background = 'black';
    messageBox.innerHTML = settingsBox;
    document.body.appendChild(messageBox);
    var settings = document.createElement('div')
    settings.id = 'settings';
    Object.assign(settings.style, {
      position: 'fixed',
      top: `2%`,
      right: `5%`,
      width: '140px',
      // height: `80px`,
      background: `rgba(0,0,0,1)`,
      border: `2px solid rgba(255,255,255,1)`,
      borderRadius: `10px`,
      zIndex: '9999',
      overflow: 'hidden'
    });
    settings.classList.add('btn');
    settings.innerHTML = `<span data-label="settings"></span>`;
    document.body.appendChild(settings);

    byId('settingsAudios').click();
    byId('settingsAudios').addEventListener('change', (e) => {
      if(e.target.checked == true) {
        app.matrixSounds.unmuteAll();
      } else {
        app.matrixSounds.muteAll();
      }
    });
    byId('settingsLight').addEventListener('change', (e) => {
      // if(e.target.checked == true) {
      //   app.makeMyLightMoveByY();
      // } else {
      //   app.disableMyLightMoveByY();
      // }
    });
    setupCanvasFilters();

    settings.addEventListener('click', () => {
      if (messageBox.style.display === 'none') {
      messageBox.style.display = 'block';
      } else {
        messageBox.style.display = 'none';
      }
      dispatchEvent(new CustomEvent('updateLang', {}))

    });
    dispatchEvent(new CustomEvent('updateLang', {}))
  }
}