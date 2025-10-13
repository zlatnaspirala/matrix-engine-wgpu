import {downloadMeshes} from "../../../src/engine/loader-obj.js";
import {LOG_FUNNY_SMALL} from "../../../src/engine/utils.js";
import NavMesh from "./nav-mesh.js";

export class MEMapLoader {

  async loadNavMesh(navMapPath) {
    return new Promise(async (resolve, reject) => {
      try {
        const response = await fetch(navMapPath);
        const navData = await response.json();
        const nav = new NavMesh(navData, {scale: [10, 1, 10]});
        resolve(nav);
      } catch(err) {
        reject(err);
        throw err;
      }
    })
  }

  constructor(MYSTICORE, navMapPath) {
    this.core = MYSTICORE;
    this.loadNavMesh(navMapPath).then((e) => {
      console.log(`%cnavMap loaded.${e}`, LOG_FUNNY_SMALL);
      this.core.RPG.nav = e;
      this.loadMainMap(); // <-- FIXED
    });
  }

  onGround(m) {
    this.core.addMeshObj({
      position: {x: 0, y: -5, z: -10},
      rotation: {x: 0, y: 0, z: 0},
      rotationSpeed: {x: 0, y: 0, z: 0},
      texturesPaths: ['./res/meshes/blender/cube.png'],
      name: 'ground',
      mesh: m.cube,
      physics: {
        enabled: false,
        mass: 0,
        geometry: "Cube"
      },
      raycast: {enabled: true, radius: 1.5}
    });
    // this.core.lightContainer[0].position[1] = 25;
  }

  loadMainMap() {
    downloadMeshes({cube: "./res/meshes/maps-objs/map-1.obj"}, this.onGround.bind(this), {scale: [10, 1, 10]});
  }

}