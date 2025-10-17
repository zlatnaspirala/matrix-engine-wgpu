import {Enemie} from "./enemy-character";

export class EnemiesManager {
  enemies = [];
  constructor(core) {
    this.core = core;
    this.loadBySumOgPlayers()
    console.log('Enemies manager', core)
  }
  // MAke possible to play 3x3 4x4 or 5x5
  loadBySumOgPlayers() {
    this.enemies.push(new Enemie(
      {
        core: this.core,
        name: 'Slayzer',
        path: 'res/meshes/glb/monster.glb'
      }
    ))

  }
}