import {downloadMeshes} from "../../../src/engine/loader-obj.js";
import {uploadGLBModel} from "../../../src/engine/loaders/webgpu-gltf.js";
import {LOG_FUNNY_SMALL} from "../../../src/engine/utils.js";
import NavMesh from "./nav-mesh.js";

/**
 * @description
 * Map Loader controls first light
 */
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
      texturesPaths: ['./res/meshes/maps-objs/textures/map-bg.png'],
      name: 'ground',
      mesh: m.cube,
      physics: {
        enabled: false,
        mass: 0,
        geometry: "Cube"
      },
      raycast: {enabled: true, radius: 1.5}
    });

    this.core.lightContainer[0].position[1] = 100;
    this.core.lightContainer[0].intesity = 10;
  }

  onTree(m) {
    this.core.addMeshObj({
      position: {x: 0, y: -5, z: -10},
      rotation: {x: 0, y: 0, z: 0},
      rotationSpeed: {x: 0, y: 0, z: 0},
      texturesPaths: ['./res/meshes/maps-objs/textures/stablo.jpg'],
      name: 'tree11',
      mesh: m.tree11,
      physics: {
        enabled: false,
        mass: 0,
        geometry: "Cube"
      },
      raycast: {enabled: false, radius: 1.5}
    });

    this.core.addMeshObj({
      position: {x: 0, y: -5, z: -10},
      rotation: {x: 0, y: 0, z: 0},
      rotationSpeed: {x: 0, y: 0, z: 0},
      texturesPaths: ['./res/meshes/maps-objs/textures/green.png'],
      name: 'tree12',
      mesh: m.tree12,
      physics: {
        enabled: false,
        mass: 0,
        geometry: "Cube"
      },
      raycast: {enabled: true, radius: 1.5}
    });
    
    setTimeout(()=> { 
      app.getSceneObjectByName('tree1-leaf2.001-0').position.y = 50

     }, 200)
  }

  async loadMainMap() {
    downloadMeshes({cube: "./res/meshes/maps-objs/map-1.obj"}, this.onGround.bind(this), {scale: [10, 10, 10]});

    downloadMeshes({
      tree11: "./res/meshes/maps-objs/tree1.obj",
      tree12: "./res/meshes/maps-objs/tree12.obj"
    }, this.onTree.bind(this), {scale: [12, 12, 12]});

      // var glbFile01 = await fetch('./res/meshes/maps-objs/tree.glb').then(res => res.arrayBuffer().then(buf => uploadGLBModel(buf, this.core.device)));
      //     this.core.addGlbObjInctance({
      //       material: {type: 'standard', useTextureFromGlb: false},
      //       scale: [20, 20, 20],
      //       position: {x: 0, y: -4, z: -220},
      //       name: 'tree1',
      //       texturesPaths: ['./res/meshes/maps-objs/textures/green.png'],
      //       raycast: {enabled: true, radius: 1.5},
      //       pointerEffect: {enabled: false}
      //     }, null, glbFile01);

  }

}