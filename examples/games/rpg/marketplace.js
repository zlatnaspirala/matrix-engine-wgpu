export class Marketplace {
  constructor() {
    this.items = this._generateItems();
    this.createHud();
  }

  createHud() {
    var box = document.createElement('div')
    box.id = 'marketplace';
    box.style.position = 'fixed';
    box.style.right = '0';
    box.style.display = 'flex';
    box.style.flexDirection = 'row';
    box.style.flexWrap = 'wrap';
    box.style.zIndex = '2';
    box.style.top = '0';
    box.style.width = '50%';
    box.style.height = '80%';
    box.style.fontSize = '50%';
    box.style.paddingLeft = '30px';
    box.style.overflowY = 'scroll';
    box.classList.add('btn');
    box.classList.add('btn3');
    

    var boxRightTitleBar = document.createElement('div')
    boxRightTitleBar.id = 'marketplace-boxRightTitleBar';
    boxRightTitleBar.style.position = 'absolute';
    boxRightTitleBar.style.left = '0';
    boxRightTitleBar.style.width = '50px';
    boxRightTitleBar.style.fontSize = '20px';
    boxRightTitleBar.style.height = '-webkit-fill-available';
    // boxRightTitleBar.style.marginLeft = `-30px`;
    boxRightTitleBar.innerHTML = 'Invertory';
    boxRightTitleBar.classList.add('vertical-text');
    box.classList.add('hide-by-right');
    box.appendChild(boxRightTitleBar);

    box.addEventListener('click', (e) => {

      if (box.classList.contains('show-by-right')) {
        box.classList.remove('show-by-right')
        box.classList.add('hide-by-right')
      } else {
        box.classList.add('show-by-right')
        box.classList.remove('hide-by-right')
      }
      console.log("*********");

    });

    this.items.forEach((i) => {
      var itemDOM = document.createElement('div');
      itemDOM.innerHTML = `
        <div style="" class="itemDOM">
          <img class="invertoryItem" src='${i.path}' /> 


          <div>name: ${i.name} price: ${i.price == 0 ? "Cant be buyed only constructed from basic item." : i.price} ${i.description}</div>

        </div>`;
      itemDOM.addEventListener('click', (e) => {
        console.log("*********");
      });
      box.appendChild(itemDOM);
    })


    document.body.appendChild(box);
  }

  // --- Player buys an item if it’s purchasable
  buy(hero, itemName) {
    const item = this.items.find(i => i.name === itemName);
    if(!item) return console.warn("Item not found in market!");
    if(item.level > 1) return console.warn("Only level 1 items can be bought!");
    if(hero.gold < item.price) return console.warn("Not enough gold!");

    hero.gold -= item.price;
    hero.inventory.addItem(item.name, {effects: item.effects});
    console.log(`💰 ${hero.name} bought ${item.name} for ${item.price} gold.`);
  }

  // --- Sell item for half price
  sell(hero, itemName) {
    const item = this.items.find(i => i.name === itemName);
    if(!item) return console.warn("Item not found in market!");

    hero.gold += Math.floor(item.price / 2);
    hero.inventory.removeItem(itemName);
    console.log(`📦 ${hero.name} sold ${item.name} for ${Math.floor(item.price / 2)} gold.`);
  }

  // --- Print shop table
  showMarket() {
    console.table(
      this.items.map(i => ({
        Name: i.name,
        Level: i.level,
        Price: i.price,
        Description: i.description
      }))
    );
  }

  // --- All items database
  _generateItems() {
    return [
      // LEVEL 1 — BASIC ITEMS (30)
      {name: "Gladius Ignis", level: 1, price: 120, effects: {attack: 1.1}, description: "A forged sword imbued with faint fire energy.", path: "./res/textures/rpg/invertory/aether-fortis.png"},
      {name: "Aqua Orbis", level: 1, price: 110, effects: {mana: 1.15}, description: "A small orb that resonates with water spirits.", path: "./res/textures/rpg/invertory/aether-fortis.png"},
      {name: "Terra Clavis", level: 1, price: 90, effects: {hp: 1.05}, description: "An ancient stone amulet of endurance.", path: "./res/textures/rpg/invertory/aether-fortis.png"},
      {name: "Ventus Pluma", level: 1, price: 100, effects: {speed: 1.1}, description: "A feather of the northern wind.", path: "./res/textures/rpg/invertory/aether-fortis.png"},
      {name: "Ferrum Anulus", level: 1, price: 80, effects: {defense: 1.1}, description: "A simple iron ring engraved with runes.", path: "./res/textures/rpg/invertory/aether-fortis.png"},
      {name: "Luna Gemma", level: 1, price: 130, effects: {mana: 1.2}, description: "A moonlit gem that glows in the dark.", path: "./res/textures/rpg/invertory/aether-fortis.png"},
      {name: "Sol Corona", level: 1, price: 140, effects: {attack: 1.15}, description: "A golden emblem of the solar knights.", path: "./res/textures/rpg/invertory/aether-fortis.png"},
      {name: "Umbra Vellum", level: 1, price: 95, effects: {stealth: 1.2}, description: "A dark fabric that absorbs light.", path: "./res/textures/rpg/invertory/aether-fortis.png"},
      {name: "Vita Flos", level: 1, price: 85, effects: {hp: 1.1}, description: "A rare flower symbolizing life and rebirth.", path: "./res/textures/rpg/invertory/aether-fortis.png"},
      {name: "Glacies Sigil", level: 1, price: 100, effects: {defense: 1.15}, description: "A sigil of frozen power.", path: "./res/textures/rpg/invertory/aether-fortis.png"},
      {name: "Ignis Scutum", level: 1, price: 120, effects: {defense: 1.2}, description: "A small fire-warding shield.", path: "./res/textures/rpg/invertory/aether-fortis.png"},
      {name: "Sanguis Orb", level: 1, price: 130, effects: {hp: 1.15}, description: "A pulsating orb of crimson light.", path: "./res/textures/rpg/invertory/aether-fortis.png"},
      {name: "Arbor Blade", level: 1, price: 90, effects: {attack: 1.08}, description: "A wooden blade carved from the elder tree.", path: "./res/textures/rpg/invertory/aether-fortis.png"},
      {name: "Mare Pearl", level: 1, price: 150, effects: {mana: 1.3}, description: "A rare pearl blessed by sea spirits.", path: "./res/textures/rpg/invertory/mare-pearl.png"},
      {name: "Vox Chime", level: 1, price: 70, effects: {speed: 1.05}, description: "A charm that hums with sound magic.", path: "./res/textures/rpg/invertory/vox-chime.png"},
      {name: "Tenebris Fang", level: 1, price: 110, effects: {attack: 1.12}, description: "A dark fang of unknown beast origin.", path: "./res/textures/rpg/invertory/tenebris-fang.png"},
      {name: "Lux Feather", level: 1, price: 100, effects: {mana: 1.1}, description: "A radiant feather from a holy bird.", path: "./res/textures/rpg/invertory/lux-feather.png"},
      {name: "Fulgur Stone", level: 1, price: 95, effects: {attack: 1.1}, description: "A crackling shard of lightning essence.", path: "./res/textures/rpg/invertory/fulgur-stone.png"},
      {name: "Silva Heart", level: 1, price: 80, effects: {hp: 1.07}, description: "A seed pulsing with natural energy.", path: "./res/textures/rpg/invertory/silva-heart.png"},
      {name: "Noctis Band", level: 1, price: 120, effects: {stealth: 1.3}, description: "A ring that vanishes under moonlight.", path: "./res/textures/rpg/invertory/noctis-band.png"},
      {name: "Rosa Thorn", level: 1, price: 100, effects: {attack: 1.05, hp: 1.05}, description: "A rose stem hardened into a piercing thorn.", path: "./res/textures/rpg/invertory/rosa-thorn.png"},
      {name: "Caelum Dust", level: 1, price: 110, effects: {mana: 1.1, speed: 1.05}, description: "Sky dust collected from high-altitude clouds.", path: "./res/textures/rpg/invertory/caelum-dust.png"},
      {name: "Ignifur Cape", level: 1, price: 125, effects: {defense: 1.1, attack: 1.05}, description: "A cape woven with fire-resistant fur.", path: "./res/textures/rpg/invertory/ignifur-cape.png"},
      {name: "Gelum Pendant", level: 1, price: 95, effects: {defense: 1.1}, description: "Pendant of icy serenity.", path: "./res/textures/rpg/invertory/gelum-fendant.png"},
      {name: "Mortis Bone", level: 1, price: 140, effects: {attack: 1.15, hp: 1.1}, description: "A cursed relic bone from ancient warrior.", path: "./res/textures/rpg/invertory/mortis-bone.png"},
      {name: "Aether Scale", level: 1, price: 115, effects: {mana: 1.2}, description: "Dragon scale imbued with aether magic.", path: "./res/textures/rpg/invertory/aether-scale.png"},
      {name: "Flamma Crystal", level: 1, price: 130, effects: {attack: 1.1}, description: "A molten crystal of flame essence.", path: "./res/textures/rpg/invertory/flamma-crystal.png"},
      {name: "Spirit Charm", level: 1, price: 85, effects: {mana: 1.1, speed: 1.1}, description: "Charm of wandering spirits.", path: "./res/textures/rpg/invertory/spirit-charm.png"},
      {name: "Ardent Vine", level: 1, price: 80, effects: {hp: 1.05, defense: 1.05}, description: "Vine that strengthens when worn.", path: "./res/textures/rpg/invertory/ardent-vine.png"},
      {name: "Oculus Tempus", level: 1, price: 150, effects: {speed: 1.2}, description: "An eye-shaped amulet bending time perception.", path: "./res/textures/rpg/invertory/oculus-tempus.png"},

      // LEVEL 2 — CRAFTED ITEMS (10)
      {name: "Corona Ignifera", level: 2, price: 0, from: ["Sol Corona", "Flamma Crystal"], effects: {attack: 1.25, defense: 1.1}, description: "Crown of blazing flame and golden radiance.", path: "./res/textures/rpg/invertory/corona-ignifera.png"},
      {name: "Aqua Sanctum", level: 2, price: 0, from: ["Mare Pearl", "Luna Gemma"], effects: {mana: 1.35, defense: 1.1}, description: "Holy water relic radiating calm energy.", path: "./res/textures/rpg/invertory/aqua-sanctum.png"},
      {name: "Umbra Silens", level: 2, price: 0, from: ["Umbra Vellum", "Noctis Band"], effects: {stealth: 1.5}, description: "Veil of perfect silence and darkness.", path: "./res/textures/rpg/invertory/umbra-silens.png"},
      {name: "Terra Fortis", level: 2, price: 0, from: ["Terra Clavis", "Ardent Vine", "Silva Heart"], effects: {hp: 1.3, defense: 1.2}, description: "Roots and stone fused into living armor.", path: "./res/textures/rpg/invertory/terra-fortis.png"},
      {name: "Ventus Aegis", level: 2, price: 0, from: ["Ventus Pluma", "Ignifur Cape"], effects: {speed: 1.25, defense: 1.15}, description: "A shield that dances with the wind.", path: "./res/textures/rpg/invertory/ventus-aegis.png"},
      {name: "Ferrum Lux", level: 2, price: 0, from: ["Ferrum Anulus", "Lux Feather"], effects: {defense: 1.25, mana: 1.1}, description: "Iron enchanted by celestial light.", path: "./res/textures/rpg/invertory/ferrum-lux.png"},
      {name: "Sanguis Vita", level: 2, price: 0, from: ["Sanguis Orb", "Vita Flos"], effects: {hp: 1.4}, description: "Blood and life entwined in crimson bloom.", path: "./res/textures/rpg/invertory/sanguis-vita.png"}, //<<<<<<
      {name: "Tenebris Vox", level: 2, price: 0, from: ["Tenebris Fang", "Vox Chime"], effects: {attack: 1.2, stealth: 1.2}, description: "A cursed chime that roars like the abyss.", path: "./res/textures/rpg/invertory/tenebris-vox.png"},
      {name: "Aether Gladius", level: 2, price: 0, from: ["Gladius Ignis", "Aether Scale"], effects: {attack: 1.3, mana: 1.1}, description: "A sword wreathed in spectral energy.", path: "./res/textures/rpg/invertory/aether-gladius.png"},
      {name: "Fulgur Mortis", level: 2, price: 0, from: ["Fulgur Stone", "Mortis Bone"], effects: {attack: 1.25, speed: 1.15}, description: "Lightning fused with death’s essence.", path: "./res/textures/rpg/invertory/fulgur-mortis.png"},

      // LEVEL 3 — ADVANCED ITEMS (5)
      {name: "Corona Umbra", level: 3, price: 0, from: ["Umbra Silens", "Corona Ignifera", "Tenebris Vox"], effects: {attack: 1.4, stealth: 1.3}, description: "Crown of the night sun, radiating power and darkness.", path: "./res/textures/rpg/invertory/corona-umbra.png"},
      {name: "Terra Sanctum", level: 3, price: 0, from: ["Terra Fortis", "Aqua Sanctum"], effects: {hp: 1.5, defense: 1.3}, description: "The sacred earth that sustains all life.", path: "./res/textures/rpg/invertory/terra-sanctum.png"},
      {name: "Aether Fortis", level: 3, price: 0, from: ["Aether Gladius", "Ferrum Lux"], effects: {attack: 1.35, mana: 1.25}, description: "Forged in light and aetheric flame.", path: "./res/textures/rpg/invertory/aether-fortis.png"},
      {name: "Vita Mindza", level: 3, price: 0, from: ["Sanguis Vita", "Ventus Aegis"], effects: {hp: 1.4, speed: 1.2}, description: "The living crown of vitality and wind.", path: "./res/textures/rpg/invertory/vita-mindza.png"},
      {name: "Mortis Ultima", level: 3, price: 0, from: ["Fulgur Mortis", "Corona Umbra", "Aether Fortis"], effects: {attack: 1.6, mana: 1.2, stealth: 1.3}, description: "Legendary artifact combining death, storm, and shadow.", path: "./res/textures/rpg/invertory/mortis-ultima.png"},
    ];
  }
}