import {uploadGLBModel} from "../../../src/engine/loaders/webgpu-gltf";
import {byId, LOG_MATRIX} from "../../../src/engine/utils";
import {Hero, HERO_PROFILES} from "./hero";

export class Character extends Hero {

  positionThrust = 0.85;

  constructor(MYSTICORE, path, name = 'hero-maria', archetypes = ["Warrior", "Mage"]) {
    super(name, archetypes);
    console.info(`%cLOADING hero name : ${name}`, LOG_MATRIX)
    this.name = name;
    this.core = MYSTICORE;
    this.heroe_bodies = [];
    this.loadLocalHero(path);
    this.setupHUDForHero(name);
  }

  setupHUDForHero(name) {
    console.info(`%cLOADING hero name : ${name}`, LOG_MATRIX)
    if(name == 'hero-maria') {
      byId('magic-slot-0').style.background = 'url("./res/textures/rpg/magics/maria-sword-1.png")';
      byId('magic-slot-0').style.backgroundRepeat = "round";
      byId('magic-slot-1').style.background = 'url("./res/textures/rpg/magics/maria-sword-2.png")';
      byId('magic-slot-1').style.backgroundRepeat = "round";
      byId('magic-slot-2').style.background = 'url("./res/textures/rpg/magics/maria-sword-3.png")';
      byId('magic-slot-2').style.backgroundRepeat = "round";
      byId('magic-slot-3').style.background = 'url("./res/textures/rpg/magics/maria-sword-4.png")';
      byId('magic-slot-3').style.backgroundRepeat = "round";
    }
  }

  async loadLocalHero(p) {
    try {
      var glbFile01 = await fetch(p).then(res => res.arrayBuffer().then(buf => uploadGLBModel(buf, this.core.device)));
      this.core.addGlbObjInctance({
        material: {type: 'standard', useTextureFromGlb: true},
        scale: [20, 20, 20],
        position: {x: 0, y: -4, z: -220},
        name: this.name,
        texturesPaths: ['./res/meshes/glb/textures/mutant_origin.png'],
        raycast: {enabled: true, radius: 1.5},
        pointerEffect: {enabled: true}
      }, null, glbFile01);
      // make small async - cooking glbs files 
      setTimeout(() => {
        this.heroe_bodies = app.mainRenderBundle.filter(obj =>
          obj.name && obj.name.includes(this.name)
        );
        this.core.RPG.heroe_bodies = this.heroe_bodies;
        this.core.RPG.heroe_bodies.forEach(subMesh => {
          subMesh.position.thrust = 1;
        });
      }, 1200)
    } catch(err) {throw err;}
  }
}
