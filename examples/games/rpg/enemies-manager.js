import {Enemie} from "./enemy-character";

export class EnemiesManager {
  enemies = [];
  creeps = [];
  constructor(core) {
    this.core = core;
    this.loadBySumOfPlayers();
    console.log('Enemies manager:', core)
  }
  // Make possible to play 3x3 4x4 or 5x5 ...
  loadBySumOfPlayers() {
    // this.enemies.push(new Enemie(
    //   {
    //     core: this.core,
    //     name: 'Slayzer',
    //     archetypes: ["Warrior"],
    //     path: 'res/meshes/glb/monster.glb',
    //     position : {x: 0, y: -23, z: -260}
    //   }
    // ));
    this.creeps.push(
      new Enemie(
        {
          core: this.core,
          name: 'abot',
          archetypes: ["creep"],
          path: 'res/meshes/glb/bot.glb',
          position : {x: 0, y: -23, z: -110}
        }
      )
    )
  }

  isEnemy(name) {
    
    let test = this.enemies.filter(obj =>
      obj.name && name.includes(obj.name)
    );    
    let test2 = this.creeps.filter(obj =>
      obj.name && name.includes(obj.name)
    );
    if(test2.length == 0 && test.length == 0) {
      console.log('<isENMIES - creeps or enemy heros> NO', name);
      return false;
    }
    console.log('<isENMIES - creeps or enemy heros> YES', name);
    return true;
  }
}