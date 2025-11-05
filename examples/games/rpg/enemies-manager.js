import {Creep} from "./creep-character";
import {Enemie} from "./enemy-character";

export class EnemiesManager {
  enemies = [];
  creeps = [];
  constructor(core, team) {
    this.core = core;
    this.team = team;
    this.loadCreeps();
  }

  loadEnemyHero(o) {
    this.enemies.push(new Enemie(
      {
        core: this.core,
        name: o.hero,
        archetypes: o.archetypes,
        path: o.path,
        position: {x: 0, y: -23, z: 0}
      }
    ));
  }
  // Make possible to play 3x3 4x4 or 5x5 ...
  loadCreeps() {
    this.creeps.push(new Creep({
      core: this.core,
      name: 'enemy_creep0',
      archetypes: ["creep"],
      path: 'res/meshes/glb/bot.glb',
      position: {x: 0, y: -23, z: -0}
    }, ['creep'], 'enemy', app.player.data.enemyTeam));
    this.creeps.push(new Creep({
      core: this.core,
      name: 'enemy_creep1',
      archetypes: ["creep"],
      path: 'res/meshes/glb/bot.glb',
      position: {x: 100, y: -23, z: -0}
    }, ['creep'], 'enemy', app.player.data.enemyTeam))
    this.creeps.push(new Creep({
      core: this.core,
      name: 'enemy_creep2',
      archetypes: ["creep"],
      path: 'res/meshes/glb/bot.glb',
      position: {x: 150, y: -23, z: -0}
    }, ['creep'], 'enemy', app.player.data.enemyTeam))
  }

  isEnemy(name) {
    let test = this.enemies.filter(obj => obj.name && name.includes(obj.name));
    let test2 = this.creeps.filter(obj => obj.name && name.includes(obj.name));
    if(test2.length == 0 && test.length == 0) {return false;}
    return true;
  }
}