import {Enemie} from "./enemy-character";

export class EnemiesManager {
  enemies = [];
  constructor(core) {
    this.core = core;
    this.loadBySumOgPlayers();
    console.log('Enemies manager:', core)
  }
  // Make possible to play 3x3 4x4 or 5x5 ...
  loadBySumOgPlayers() {
    this.enemies.push(new Enemie(
      {
        core: this.core,
        name: 'Slayzer',
        archetypes: ["Warrior"],
        path: 'res/meshes/glb/monster.glb'
      }
    ))
  }

  isEnemy(name) {
    console.log('<isENMIES> ', name)
    let test = this.enemies.filter(obj =>
      obj.name && name.includes(obj.name)
    );
    if (test.length == 0) return false;
    return true;
  }
}