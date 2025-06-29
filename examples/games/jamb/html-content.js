
export let messageBoxHTML = `
<div>
  <span data-label="settings"></span>
  <div>
    <div>
      <span data-label="sounds"></span>
      <label class="switch">
        <input type="checkbox">
        <span class="sliderSwitch round"></span>
      </label>
    </div>
    <div>
      <button class="btn" onclick="app.myDom.hideSettings()">
        <span data-label="hide"></span>
      </button>
    </div>
  </div>
</div>`;

export let welcomeBoxHTML =
  `<span class="fancy-title" data-label="welcomeMsg"></span>
     <a href="https://github.com/zlatnaspirala/matrix-engine-wgpu">zlatnaspirala/matrix-engine-wgpu</a><br><br>
     <div style="display:flex;flex-direction:column;align-items: center;margin:20px;padding: 10px;">
       <span style="width:100%">Choose nickname:</span>
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