
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