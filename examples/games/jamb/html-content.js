
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
      <button class="btn" onclick="app.myDom.hideSettings()">
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
       <input style="text-align: center;height:50px;font-size:100%;width:250px" class="fancy-label" type="text" value="Guest" />
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
        app.label.update() })" ><span data-label="serbian"></span></button> 
    `;