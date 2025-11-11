import {byId} from "../../../src/engine/utils.js";

export class HUD {
  constructor(localHero) {
    this.localHero = localHero;
    this.construct();
    this.setCursor();
  }

  construct() {
    const hud = document.createElement("div");
    hud.id = "hud-menu";
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
      zIndex: "15",
      padding: "10px",
      boxSizing: "border-box"
    });

    const hudLeftBox = document.createElement("div");
    hudLeftBox.id = "hudLeftBox";

    Object.assign(hudLeftBox.style, {
      width: "30%",
      height: "100%",
      background: "rgba(0,0,0,0.5)",
      border: "1px solid #353535",
      alignItems: "center",
      justifyContent: "space-around",
      color: "white",
      fontFamily: "'Orbitron', sans-serif",
      zIndex: "15",
      padding: "10px",
      boxSizing: "border-box",
      overflow: 'hidden'
    });

    hud.appendChild(hudLeftBox);

    // - Stats
    const statsDom = document.createElement("div");
    statsDom.id = "statsDom";

    Object.assign(statsDom.style, {
      display: "flex",
      flexDirection: "column",
      width: "12%",
      height: "100%",
      background: "rgba(0,0,0,0.5)",
      alignItems: "center",
      justifyContent: "space-around",
      color: "white",
      fontFamily: "'Orbitron', sans-serif",
      zIndex: "15",
      padding: "1px",
      margin: '0',
      boxSizing: "border-box",
      overflow: 'hidden',
      fontSize: '10px',
    });

    hud.appendChild(statsDom);

    const statsDomValue = document.createElement("div");
    statsDomValue.id = "statsDomValue";

    Object.assign(statsDomValue.style, {
      display: "flex",
      flexDirection: "column",
      width: "12%",
      height: "100%",
      background: "rgba(0,0,0,0.5)",
      alignItems: "center",
      justifyContent: "space-around",
      color: "white",
      fontFamily: "'Orbitron', sans-serif",
      zIndex: "15",
      padding: "1px",
      margin: '0',
      boxSizing: "border-box",
      overflow: 'hidden',
      fontSize: '10px',
    });

    hud.appendChild(statsDomValue);

    let props = [
      "currentLevel",
      "hp",
      "mana",
      "gold",
      "mpRegen",
      "hpRegen",
      "moveSpeed",
      "attackSpeed",
      "armor",
      "attack"
    ];

    addEventListener('stats-localhero', (e) => {
      
      for(var x = 0;x < props.length;x++) {
        console.log('STATS UPDATE DOM ', e.detail[props[x]].toFixed(2))
        byId('stats-' + props[x]).innerHTML = e.detail[props[x]].toFixed(2);
      }
    })

    for(var x = 0;x < props.length;x++) {
      const statsDomItem = document.createElement("div");
      statsDomItem.id = `statsLabel-${props[x]}`;
      statsDomItem.innerHTML = props[x] + ":";
      Object.assign(statsDomItem.style, {
        background: "rgba(0,0,0,0.5)",
        border: "1px solid #353535",
        alignItems: "center",
        justifyContent: "space-around",
        color: "white",
        fontFamily: "'Orbitron', sans-serif",
        zIndex: "15",
        margin: '0',
        boxSizing: "border-box",
        overflow: 'hidden'
      });
      statsDom.appendChild(statsDomItem);

      const statsDomItemValue = document.createElement("div");
      statsDomItemValue.id = `stats-${props[x]}`;
      statsDomItemValue.innerHTML = "" + app.localHero[props[x]];
      Object.assign(statsDomItemValue.style, {
        background: "rgba(0,0,0,0.5)",
        border: "1px solid #353535",
        alignItems: "center",
        justifyContent: "space-around",
        color: "white",
        fontFamily: "'Orbitron', sans-serif",
        zIndex: "15",
        margin: '0',
        boxSizing: "border-box",
        overflow: 'hidden'
      });
      statsDomValue.appendChild(statsDomItemValue);
    }

    const hudCenter = document.createElement("div");
    hudCenter.id = "hudCenter";
    Object.assign(hudCenter.style, {
      width: "100%",
      height: "100%",
      backgroundColor: "rgba(0,0,0,0.5)",
      display: "flex",
      flexDirection: "column",
      border: "1px solid #353535",
      alignItems: "center",
      justifyContent: "space-around",
      color: "white",
      fontFamily: "'Orbitron', sans-serif",
      zIndex: "15",
      padding: "0",
      boxSizing: "border-box",
    });
    const hudMagicHOlder = document.createElement("div");
    hudMagicHOlder.id = "hudMagicHOlder";

    Object.assign(hudMagicHOlder.style, {
      width: "80%",
      maxWidth: "300px",
      minWidth: "150px",
      aspectRatio: "4 / 1",
      backgroundColor: "rgba(0, 0, 0, 0.4)",
      display: "grid",
      gridTemplateColumns: "repeat(4, 1fr)",
      gap: "12px",
      border: "1px solid #353535",
      borderRadius: "10px",
      padding: "2px",
      boxSizing: "border-box",
      zIndex: "15",
      fontFamily: "'Orbitron', sans-serif",
      backdropFilter: "blur(6px)",
      boxShadow: "0 -2px 10px rgba(0,0,0,0.4)",
      justifyContent: "center",
      alignItems: "center",
    });

    for(let i = 0;i < 4;i++) {
      const slot = document.createElement("div");
      slot.className = "magic-slot-test";
      slot.id = `magic-slot-${i}`;
      Object.assign(slot.style, {
        aspectRatio: "1 / 1",
        width: "100%",
        border: "1px solid #353535",
        borderRadius: "8px",
        background: "linear-gradient(145deg, #444, #222)",
        boxShadow:
          "inset 2px 2px 5px rgba(0,0,0,0.6), inset -2px -2px 5px rgba(255,255,255,0.1)",
        transition: "all 0.2s ease-in-out",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#ccc",
        fontSize: "14px",
        cursor: "url('./res/icons/default.png') 0 0, auto",
        backgroundRepeat: "round"
      });

      slot.addEventListener("mouseenter", () => {
        slot.style.border = "2px solid #0ff";
        slot.style.boxShadow =
          "0 0 10px rgba(0,255,255,0.5), inset 2px 2px 5px rgba(0,0,0,0.6)";
      });

      slot.addEventListener("mouseleave", () => {
        slot.style.border = "2px solid #888";
        slot.style.boxShadow =
          "inset 2px 2px 5px rgba(0,0,0,0.6), inset -2px -2px 5px rgba(255,255,255,0.1)";
      });

      slot.innerHTML = "locked";

      slot.addEventListener("mousedown", (e) => {
        if(e.target.innerHTML == 'locked') {
          console.info('it is locked ...')
          return;
        }
        console.log('------------------MAGIC---------------------')
        slot.style.border = "2px solid #888";
        slot.style.boxShadow =
          "inset 2px 2px 5px rgba(0,0,0,0.6), inset -2px -2px 5px rgba(255,255,255,0.1)";

        dispatchEvent(new CustomEvent(`attack-magic${i}`,
          {detail: {source: 'hero', magicType: i, level: 1}}))
      });
      hudMagicHOlder.appendChild(slot);
    }
    hudCenter.appendChild(hudMagicHOlder);
    // HP 
    const hudHP = document.createElement("div");
    hudHP.id = "hudHP";
    Object.assign(hudHP.style, {
      width: "40%",
      height: "10%",
      backgroundColor: "rgba(0,0,0,0.5)",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-around",
      color: "white",
      fontFamily: "'Orbitron', sans-serif",
      zIndex: "15",
      padding: "10px",
      boxSizing: "border-box"
    });

    // Inner HP bar
    const hpBar = document.createElement("div");
    Object.assign(hpBar.style, {
      height: "100%",
      width: "100%",
      height: "20px",
      background: "linear-gradient(90deg, lime, green)",
      transition: "width 0.3s ease-in-out",
      borderRadius: "7px 7px 7px 7px",
      boxShadow: "inset 0 0 10px #0f0",
    });
    hudHP.appendChild(hpBar);

    // HP text overlay
    const hpText = document.createElement("div");
    Object.assign(hpText.style, {
      position: "absolute",
      width: "100%",
      textAlign: "center",
      color: "white",
      fontWeight: "bold",
      textShadow: "0 0 5px black",
      pointerEvents: "none",
    });
    hpText.textContent = "HP: 100%";
    hudHP.appendChild(hpText);
    hudCenter.appendChild(hudHP);
    window.addEventListener("setHP", (e) => {
      const clamped = Math.max(0, Math.min(100, e.detail.HP));
      hpBar.style.width = clamped + "%";
      hpText.textContent = `HP: ${clamped}%`;
    })

    // MANA
    const hudMANA = document.createElement("div");
    hudMANA.id = "hudMANA";

    Object.assign(hudMANA.style, {
      width: "40%",
      height: "10%",
      backgroundColor: "rgba(0,0,0,0.5)",
      display: "flex",
      // border: "solid 5px blue",
      alignItems: "center",
      justifyContent: "space-around",
      color: "white",
      fontFamily: "'Orbitron', sans-serif",
      zIndex: "15",
      padding: "10px",
      boxSizing: "border-box"
    });
    hudCenter.appendChild(hudMANA);

    // Inner HP bar
    const hudMANABar = document.createElement("div");
    Object.assign(hudMANABar.style, {
      height: "100%",
      width: "100%",
      height: "20px",
      background: "linear-gradient(90deg, rgba(0, 162, 255, 1), blue)",
      transition: "width 0.3s ease-in-out",
      borderRadius: "7px 7px 7px 7px",
      boxShadow: "inset 0 0 10px rgba(0, 162, 255, 1)",
    });
    hudMANA.appendChild(hudMANABar);

    // HP text overlay
    const MANAhpText = document.createElement("div");
    Object.assign(MANAhpText.style, {
      position: "absolute",
      width: "100%",
      textAlign: "center",
      color: "white",
      fontWeight: "bold",
      textShadow: "0 0 5px black",
      pointerEvents: "none",
    });
    MANAhpText.textContent = "HP: 100%";
    hudMANA.appendChild(MANAhpText);

    window.addEventListener("setMANA", (e) => {
      const clamped = Math.max(0, Math.min(100, e.detail.HP));
      hpBar.style.width = clamped + "%";
      hpText.textContent = `MANA: ${clamped}%`;
    })

    hud.appendChild(hudCenter);
    // left box
    const selectedCharacters = document.createElement("span");
    selectedCharacters.textContent = "HERO";
    hudLeftBox.appendChild(selectedCharacters);
    hud.addEventListener("onSelectCharacter", (e) => {
      console.log('onSelectCharacter : ', e)
      let n = '';
      if(e.detail.indexOf('_') != -1) {
        n = e.detail.split('_')[0];
      }
      selectedCharacters.textContent = `${n}`;
    });

    const hudDesription = document.createElement("div");
    hudDesription.id = "hudDesription";
    Object.assign(hudDesription.style, {
      width: "60%",
      height: "100%",
      backgroundColor: "rgba(0,0,0,0.5)",
      border: "1px solid #353535",
      borderLeft: "none",
      alignItems: "center",
      justifyContent: "space-around",
      color: "white",
      fontFamily: "'Orbitron', sans-serif",
      zIndex: "15",
      padding: "10px",
      boxSizing: "border-box"
    });

    const hudDesriptionText = document.createElement("div");
    hudDesriptionText.id = "hudDesriptionText";
    Object.assign(hudDesriptionText.style, {
      width: '90%',
      height: '80%',
      padding: '5% 5% 5% 5%',
      aspectRatio: "1 / 1",
      border: "2px solid #aaa",
      borderRadius: "6px",
      background: "linear-gradient(145deg, #444, #222)",
      boxShadow:
        "inset 2px 2px 5px rgba(0,0,0,0.6), inset -2px -2px 5px rgba(255,255,255,0.1)",
      display: "flex",
      // alignItems: "center",
      justifyContent: "center",
      color: "#ccc",
      fontSize: "12px",
      cursor: "url('./res/icons/default.png') 0 0, auto",
      transition: "all 0.2s ease-in-out",
      backgroundSize: "contain",
      backgroundRepeat: "no-repeat",
      backgroundPosition: "center",
    });

    hudDesription.appendChild(hudDesriptionText);
    hud.appendChild(hudDesription);
    // right
    const hudItems = document.createElement("div");
    hudItems.id = "hudItems";
    Object.assign(hudItems.style, {
      width: "30%",
      height: "100%",
      backgroundColor: "rgba(0,0,0,0.5)",
      backgroundPosition: 'center center',
      backgroundRepeat: 'no-repeat',
      backgroundSize: 'auto',
      display: "flex",
      border: "1px solid #353535",
      alignItems: "center",
      justifyContent: "space-around",
      color: "white",
      fontFamily: "'Orbitron', sans-serif",
      zIndex: "15",
      padding: "1px",
      boxSizing: "border-box"
    });

    const inventoryGrid = document.createElement("div");
    inventoryGrid.id = "inventoryGrid";
    Object.assign(inventoryGrid.style, {
      display: "grid",
      gridTemplateColumns: "repeat(3, 1fr)",
      gridTemplateRows: "repeat(2, 1fr)",
      // gap: "10px",
      width: "100%",
      height: "100%",
      padding: "5px",
      boxSizing: "border-box",
    });

    for(let i = 0;i < 6;i++) {
      const slot = document.createElement("div");
      slot.className = "inventory-slot";
      slot.id = `inventory-slot-${i}`;

      Object.assign(slot.style, {
        aspectRatio: "1 / 1",
        width: "90%",
        border: "2px solid #aaa",
        borderRadius: "6px",
        background: "linear-gradient(145deg, #444, #222)",
        boxShadow: "inset 2px 2px 5px rgba(0,0,0,0.6), inset -2px -2px 5px rgba(255,255,255,0.1)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#ccc",
        fontSize: "12px",
        cursor: "url('./res/icons/default.png') 0 0, auto",
        transition: "all 0.2s ease-in-out",
        backgroundSize: "contain",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
      });
      // Hover effect
      slot.addEventListener("mouseenter", (e) => {
        slot.style.border = "2px solid #ff0";
        slot.style.boxShadow = "0 0 10px rgba(255,255,0,0.5), inset 2px 2px 5px rgba(0,0,0,0.6)";
        if (e.currentTarget.childNodes.length < 3) { return; }
        let getDesc =
          e.currentTarget.childNodes[1].getAttribute('data-name') + " : " +
          e.currentTarget.childNodes[1].getAttribute('data-desc') + " \n Props: " +
          e.currentTarget.childNodes[1].getAttribute('data-effects');
        byId('hudDesriptionText').innerText = getDesc;
      });
      slot.addEventListener("mouseleave", () => {
        slot.style.border = "2px solid #aaa";
        slot.style.boxShadow =
          "inset 2px 2px 5px rgba(0,0,0,0.6), inset -2px -2px 5px rgba(255,255,255,0.1)";
      });
      slot.textContent = "Empty";
      inventoryGrid.appendChild(slot);
    }

    addEventListener('hero-invertory-update', (e) => {
      console.log('hero-invertory-update', e.detail)
      e.detail.items.forEach((item, index) => {
        if(item != null) {
          const effectsString = item.effects
            ? Object.entries(item.effects)
              .map(([key, value]) => `${key}: ${value}`)
              .join(', ')
            : 'None';

          byId(`inventory-slot-${index}`).innerHTML = `
            <img 
               data-name="${item.name}" 
               data-desc="${item.description}" 
               data-effects="${effectsString}" 
               width="50px" style="min-height: 50px;max-height:55px;"
               src="${item.path}" />
          `;
          console.log('hero-invertory-update item', item)
        }
      })
    })

    const loader = document.createElement("div");
    Object.assign(loader.style, {
      position: "fixed",
      display: 'flex',
      bottom: '0',
      left: '0',
      width: "100vw",
      height: "100vh",
      textAlign: "center",
      color: "white",
      zIndex: 21,
      fontWeight: "bold",
      textShadow: "0 0 2px black",
      color: '#ffffffff',
      background: '#000000ff',
      fontSize: '16px',
      cursor: 'url(./res/icons/default.png) 0 0, auto',
      pointerEvents: 'auto'
    });
    // loader.classList.add('buttonMatrix');
    loader.innerHTML = `
      <div class="loader">
        <div class="progress-container">
          <div class="progress-bar" id="progressBar"></div>
          </div>
        <div class="counter" id="counter">0%</div>
      </div>
    `;
    loader.addEventListener('click', (e) => {
      app.matrixSounds.play('music');
    });
    hud.appendChild(loader);

    let progress = 0;
    let bar = null;
    let counter = null;
    function fakeProgress() {
      if(progress < 100) {
        // Random step to look "non-linear"
        progress += Math.random() * 4;
        if(progress > 100) progress = 100;
        bar.style.width = progress + '%';
        counter.textContent = "Prepare gameplay " + Math.floor(progress) + '%';
        let grayEffect = 30 / progress;
        loader.style.filter = `grayscale(${grayEffect})`;
        setTimeout(fakeProgress, 80 + Math.random() * 150);
      } else {
        counter.textContent = "Let the game begin!";
        bar.style.boxShadow = "0 0 30px #00ff99";
        setTimeout(() => {
          loader.remove();
          bar = null;
          counter = null;
        }, 250)
      }
    }

    setTimeout(() => {
      bar = document.getElementById('progressBar');
      counter = document.getElementById('counter');
      fakeProgress()
    }, 300);



    // Add grid to hudItems
    hudItems.appendChild(inventoryGrid);
    hud.appendChild(hudItems);
    document.body.appendChild(hud);
  }

  setCursor() {
    // alert('cur')
    // AnimatedCursor

    document.body.style.cursor = "url('./res/icons/default.png') 0 0, auto";
  }

}