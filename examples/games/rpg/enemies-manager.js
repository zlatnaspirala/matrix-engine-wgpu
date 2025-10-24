import {Creep} from "./creep-character";
import {Enemie} from "./enemy-character";

export class EnemiesManager {
  enemies = [];
  creeps = [];
  constructor(core) {
    this.core = core;
    this.loadBySumOfPlayers();
  }
  // Make possible to play 3x3 4x4 or 5x5 ...
  loadBySumOfPlayers() {
    this.enemies.push(new Enemie(
      {
        core: this.core,
        name: 'Slayzer',
        archetypes: ["Warrior"],
        path: 'res/meshes/glb/monster.glb',
        position: {x: -653.83, y: -23, z: 0} //, -26.62, -612.95
      }
    ));
    // this.creeps.push(new Creep({
    //   core: this.core,
    //   name: 'enemy-creep0',
    //   archetypes: ["creep"],
    //   path: 'res/meshes/glb/bot.glb',
    //   position: {x: 0, y: -0, z: -1310}
    // }));
    // this.creeps.push(new Creep({
    //   core: this.core,
    //   name: 'enemy-creep1',
    //   archetypes: ["creep"],
    //   path: 'res/meshes/glb/bot.glb',
    //   position: {x: 100, y: -23, z: -1410}
    // }))
    // this.creeps.push(new Creep({
    //   core: this.core,
    //   name: 'enemy-creep2',
    //   archetypes: ["creep"],
    //   path: 'res/meshes/glb/bot.glb',
    //   position: {x: 150, y: -23, z: -1510}
    // }))
  }

  // this func use external isEnemy but for localhero not enemy vs enemy
  isEnemy(name) {
    let test = this.enemies.filter(obj =>
      obj.name && name.includes(obj.name)
    );
    let test2 = this.creeps.filter(obj =>
      obj.name && name.includes(obj.name)
    );
    if(test2.length == 0 && test.length == 0) {
      console.log('<isENMIES-creeps or enemy heros> NO', name);
      return false;
    }
    console.log('<isENMIES-creeps or enemy heros> YES', name);
    return true;
  }



}