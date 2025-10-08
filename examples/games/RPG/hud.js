

export class HUD {
  constructor() {
    this.construct();

  }

  construct() {
    // Create HUD container
    const hud = document.createElement("div");
    hud.id = "hud-menu";
    // Style it
    Object.assign(hud.style, {
      position: "absolute",
      bottom: "0",
      left: "0",
      width: "100%",
      height: "20%",
      backgroundColor: "rgba(0,0,0,0.5)",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-around",
      color: "white",
      fontFamily: "'Orbitron', sans-serif",
      zIndex: "100",
      padding: "10px",
      boxSizing: "border-box"
    });

    // Example elements: a button and a score display
    const actionBtn = document.createElement("button");
    actionBtn.textContent = "Action";
    hud.appendChild(actionBtn);

    const selectedCharacters = document.createElement("span");
    selectedCharacters.textContent = "selectedCharacters:[]";
    hud.appendChild(selectedCharacters);

    hud.addEventListener("onSelectCharacter", (e) => {
      console.log('onSelectCharacter : ', e)
       selectedCharacters.textContent = `selectedCharacters:[${e.detail}]`;
    });

    // Append to body (or the canvas container)
    document.body.appendChild(hud);

    // Optional: JS interaction
    actionBtn.addEventListener("click", () => {
      console.log("Action clicked!");
      score.textContent = "Score: " + Math.floor(Math.random() * 100);
    });
  }

}