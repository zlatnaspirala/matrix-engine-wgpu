import {MobileDOM} from "../../cameras";
import {byId, isMobile, mb} from "../../utils";

const tiers = [
  {threshold: 500, text: 'GODLIKE'},
  {threshold: 250, text: 'UNSTOPPABLE'},
  {threshold: 100, text: 'RAMPAGE'},
  {threshold: 50, text: 'KILLING SPREE'},
  {threshold: 25, text: 'WARMING UP'},
  {threshold: 10, text: 'FIRST BLOOD'},
  {threshold: 2, text: 'JUNIO ZOMBIE KILLER'},
  {threshold: 0, text: 'WEEKEND WARRIOR'},
];

export class Player {
  constructor(o = {}) {
    this.name = o.name || 'local_player';
    this.respawnItemsInterval = o.respawnItemsInterval || 120000;
    this.typeOfController = o.typeOfController || 'fps';
    this.maxEnergy = o.maxEnergy ?? 100;
    this.energy = o.energy ?? this.maxEnergy;
    this.lives = o.lives ?? 1;
    this.ammo = o.ammo ?? 100;
    this.armor = o.armor ?? false;
    this.kills = o.kills ?? 0;
    this.isDead = false;
    this.onEnergyChange = o.onEnergyChange || null;
    this._killTiersHit = new Set();
    this.attachEvents();
  }

  attachEvents() {
    addEventListener('pickup-collected', (e) => {
      const {type} = e.detail.entry;
      if(type === 'energy') {app.player.heal(e.detail.entry)}
      else if(type === 'ammo') {app.player.gotAmmo(e.detail.entry)}
      else if(type === 'armor') {app.player.gotArmor(e.detail.entry)}
    });
    addEventListener('zombie-die', () => {
      this.addKill(1);
    })
  }

  setEnergy(value) {
    this.energy = Math.max(0, Math.min(this.maxEnergy, value));
    this.onEnergyChange?.(this.energy);
    if(this.energy <= 0) this.die();
  }

  takeDamage(amount) {
    if(this.isDead) return;
    if(this.armor === true) {
      amount = amount * 0.75;
    }
    this.setEnergy(this.energy - amount);
    // app.tts.speakHero('slayzer', 'dead');
  }

  heal(entry) {
    let {amount} = entry;
    amount = parseInt(amount);
    if(this.isDead) return;
    this.setEnergy(this.energy + amount);
    app.matrixSounds.play('feelgood');
    setTimeout(() => {
      app.gameMap.respawnMapItem('energy', entry.id)
    }, this.respawnItemsInterval)
  }

  die() {
    this.energy = 0;
    app.energy.setValue(0);
    if(this.isDead) return;
    console.log('....is dead')

    this.isDead = true;
    this.lives = Math.max(0, this.lives - 1);
    for(const t of tiers) {
      if(this.kills >= t.threshold && !this._killTiersHit.has(t.threshold)) {
        mb.show(`${t.text} — ${this.kills} KILLS.`, undefined, 5000);
        this._killTiersHit.add(t.threshold);
        app.getCamera().removeKeyboard();
        MobileDOM.addButton(`GAME OVER ${t.text} YOUR SCORE ${this.kills} kills.`, () => {
          location.reload()
        }, undefined, {
          size: isMobile() === true ? 200 : 240,
          bottom: 40,
          left: isMobile() === true ? 30 : 45,
          color: 'orangered',
        });
        if(document.pointerLockElement === app.canvas) {
          document.exitPointerLock()
        }
        break;
      }
    }
  }

  respawn(fullEnergy = true) {
    if(this.lives <= 0) return false;
    this.isDead = false;
    if(fullEnergy) this.setEnergy(this.maxEnergy);
    return true;
  }

  addKill(n = 1) {
    this.kills += n;
    byId('player-status').textContent = 'Kills ' + this.kills;
  }

  useAmmo(n = 1) {
    if(this.ammo < n) return false;
    this.ammo -= n;
    byId('player-ammo').textContent = 'Ammo ' + this.ammo;
    return true;
  }

  gotArmor(entry) {
    this.armor = true;
    byId('player-armor').textContent = 'Armor ' + (this.armor === true ? 'YES' : 'NO');
    app.matrixSounds.play('feelgood');
    setTimeout(() => {
      this.armor = false;
      byId('player-armor').textContent = 'Armor NO';
      app.gameMap.respawnMapItem('armor', entry.id)
    }, this.respawnItemsInterval);
  }

  gotAmmo(entry) {
    const {amount} = entry;
    const n = parseInt(amount);
    this.ammo += n;
    byId('player-ammo').textContent = 'Ammo ' + this.ammo;
    app.matrixSounds.play('feelgood');
    setTimeout(() => {
      app.gameMap.respawnMapItem('ammo', entry.id)
    }, this.respawnItemsInterval);
  }
}

export class CollectItem {
  constructor({id, type = 'energy', amount = 10, position, radius = 0.6, core}) {
    this.id = id;
    this.type = type;
    this.amount = amount;
    this.core = core;
    this.entry = core.collisionSystem.registerPickup(id, position, radius, type, amount);
  }
}