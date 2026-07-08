import {byId} from "../../utils";

/**
 * USAGE EXAMPLE:
 *
 *   app.player = new Player({ name: 'Nikola', typeOfController: 'fps' });
 *   app.player.takeDamage(10);      // syncs app.energy HUD automatically if hooked
 *   app.player.addKill();
 *   app.player.useAmmo(1);
 */
export class Player {

  constructor(o = {}) {
    this.name = o.name || 'local_player';
    this.typeOfController = o.typeOfController || 'fps'; // 'fps' | 'rpg' | 'moba' | 'spectator' ...
    this.maxEnergy = o.maxEnergy ?? 100;
    this.energy = o.energy ?? this.maxEnergy;
    this.lives = o.lives ?? 1;
    this.ammo = o.ammo ?? 100;
    this.kills = o.kills ?? 0;
    this.isDead = false;
    // optional hook: called whenever energy changes, so HUD stays in sync
    // without Player needing to know about app.energy directly
    this.onEnergyChange = o.onEnergyChange || null;
    this.attachEvents();
  }

  attachEvents() {
    addEventListener('pickup-collected', (e) => {
      console.log('pickup-collected', e.detail.entry)
      const {type, amount} = e.detail.entry;
      if(type === 'energy') app.player.heal(amount);
      if(type === 'ammo') app.player.addAmmo(amount);
    });

    addEventListener('zombie-die', () => {
      console.log('addKill addKill addKill')
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
    this.setEnergy(this.energy - amount);
  }

  heal(amount) {
    if(this.isDead) return;
    console.log('heal ', amount)
    console.log('heal ', this.energy)
    this.setEnergy(this.energy + amount);
  }

  die() {
    if(this.isDead) return;
    this.isDead = true;
    this.lives = Math.max(0, this.lives - 1);
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

  addAmmo(n) {
    this.ammo += n;
  }
}

export class CollectItem {
  constructor({id, type = 'energy', amount = 10, position, radius = 0.6, core}) {
    this.id = id;
    this.type = type;   // 'energy' | 'ammo' | 'health' | extend freely
    this.amount = amount;
    this.core = core;
    this.entry = core.collisionSystem.registerPickup(id, position, radius, type, amount);
  }
}