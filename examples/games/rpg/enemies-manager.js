import {Creep} from "./creep-character";
import {Enemie} from "./enemy-character";

export class EnemiesManager {
  enemies = [];
  creeps = [];
  constructor(core, team) {
    this.core = core;
    this.team = team;
    this.loadBySumOfPlayers();
  }
  // Make possible to play 3x3 4x4 or 5x5 ...
  loadBySumOfPlayers() {

    this.enemies.push(new Enemie(
      {
        core: this.core,
        name: 'SLZEnemy',
        archetypes: ["Warrior"],
        path: 'res/meshes/glb/monster.glb',
        position: {x: -653.83, y: -23, z: 0} //, -26.62, -612.95
      }
    ));

    this.creeps.push(new Creep({
      core: this.core,
      name: 'enemy-creep0',
      archetypes: ["creep"],
      path: 'res/meshes/glb/bot.glb',
      position: {x: 0, y: -23, z: -0}
    }, ['creep'], 'enemy'));
    this.creeps.push(new Creep({
      core: this.core,
      name: 'enemy-creep1',
      archetypes: ["creep"],
      path: 'res/meshes/glb/bot.glb',
      position: {x: 100, y: -23, z: -0}
    }, ['creep'], 'enemy'))
    this.creeps.push(new Creep({
      core: this.core,
      name: 'enemy-creep2',
      archetypes: ["creep"],
      path: 'res/meshes/glb/bot.glb',
      position: {x: 150, y: -23, z: -0}
    }, ['creep'], 'enemy'))

    setTimeout(() => {
      // this.heroe_bodies = app.mainRenderBundle.filter(obj =>
      //   obj.name && obj.name.includes(o.name)
      // );
      this.creeps.forEach((creep, idx) => {

        console.log('ENEMY CREEP ', creep.heroe_bodies)
        // subMesh.position.thrust = this.moveSpeed;
        // subMesh.glb.animationIndex = 0;
        // // adapt manual if blender is not setup
        // subMesh.glb.glbJsonData.animations.forEach((a, index) => {
        //   console.info(`%c ANimation: ${a.name} index ${index}`, LOG_MATRIX)
        //   if(a.name == 'dead') this.heroAnimationArrange.dead = index;
        //   if(a.name == 'walk') this.heroAnimationArrange.walk = index;
        //   if(a.name == 'salute') this.heroAnimationArrange.salute = index;
        //   if(a.name == 'attack') this.heroAnimationArrange.attack = index;
        //   if(a.name == 'idle') this.heroAnimationArrange.idle = index;
        // });

        // // adapt
        // subMesh.globalAmbient = [1, 1, 1, 1];
        // if(this.name == 'Slayzer') {
        //   subMesh.globalAmbient = [2, 2, 3, 1];
        // } else if(this.name.indexOf('friendly-creeps') != -1) {
        //   subMesh.globalAmbient = [12, 12, 12, 1];
        // }
        // if(idx == 0) this.core.collisionSystem.register((o.name), subMesh.position, 15.0, this.group);
      });
 
    }, 1700)
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