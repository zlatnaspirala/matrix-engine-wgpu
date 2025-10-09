import {uploadGLBModel} from "../../../src/engine/loaders/webgpu-gltf";

export class Character {

  positionThrust = 0.85;

  constructor(MYSTICORE, path) {
    this.core = MYSTICORE;
    this.heroe_bodies = [];
    this.loadLocalHero(path);
  }

  async loadLocalHero(p) {
    try {
      var glbFile01 = await fetch(p).then(res => res.arrayBuffer().then(buf => uploadGLBModel(buf, this.core.device)));
      this.core.addGlbObj({
        material: {type: 'standard', useTextureFromGlb: true},
        scale: [20, 20, 20],
        position: {x: 0, y: -4, z: -220},
        name: 'local-hero',
        texturesPaths: ['./res/meshes/glb/textures/mutant_origin.png'],
        raycast: {enabled: true, radius: 1.5}
      }, null, glbFile01);
      // make small async
      setTimeout(() => {
        this.heroe_bodies = app.mainRenderBundle.filter(obj =>
          obj.name && obj.name.includes("local-hero")
        );
        this.core.RPG.heroe_bodies = this.heroe_bodies;
        this.core.RPG.heroe_bodies.forEach(subMesh => {
          subMesh.position.thrust = 1;
        });
      }, 1200)
    } catch(err) {throw err;}
  }
}