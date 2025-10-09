import {uploadGLBModel} from "../../../src/engine/loaders/webgpu-gltf";


export class Character {
  constructor(MYSTICORE, path) {
    this.core = MYSTICORE;
    this.loadLocalHero(path);
  }

  async loadLocalHero(p) {
    try {
      var glbFile01 = await fetch(p).then(res => res.arrayBuffer().then(buf => uploadGLBModel(buf, this.core.device)));
      let test = this.core.addGlbObj({
        material: {type: 'standard', useTextureFromGlb: true},
        scale: [20, 20, 20],
        position: {x: 0, y: -4, z: -170},
        name: 'local-hero',
        texturesPaths: ['./res/meshes/glb/textures/mutant_origin.png'],
        raycast: {enabled: true, radius: 1.5}
      }, null, glbFile01);
      
      // make small async 
      setTimeout(() => {
        const heroe_bodies = app.mainRenderBundle.filter(obj =>
          obj.name && obj.name.includes("local-hero")
        );
        console.log(' heroe_bodies return ', heroe_bodies)
      }, 1200)

    } catch(err) {
      throw err;
    }
  }
}