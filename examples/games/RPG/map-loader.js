import {downloadMeshes} from "../../../src/engine/loader-obj.js";
import NavMesh from "./nav-mesh.js";

export class MEMapLoader {

  async loadNavMesh(navMapPath) {
    try {
      const response = await fetch(navMapPath);
      const navData = await response.json();
      const nav = new NavMesh(navData, {scale : [10, 1, 10]});
      return nav;
    } catch(err) {
      throw err;
    }
  }

  constructor(MYSTICORE, navMapPath) {
    this.core = MYSTICORE;
    this.loadNavMesh(navMapPath).then((e) => {
      console.log('navMap loaded...');
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
    });
    // this.core.lightContainer[0].position[1] = 25;
  }

  loadMainMap() {
    downloadMeshes({cube: "./res/meshes/maps-objs/map-1.obj"}, this.onGround.bind(this), {scale: [10, 1, 10]});
  }

}