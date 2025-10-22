import {GenGeo} from "../../../src/engine/effects/gen.js";
import {downloadMeshes} from "../../../src/engine/loader-obj.js";
import {uploadGLBModel} from "../../../src/engine/loaders/webgpu-gltf.js";
import {LOG_FUNNY_SMALL, randomFloatFromTo, randomIntFromTo} from "../../../src/engine/utils.js";
import NavMesh from "./nav-mesh.js";

/**
 * @description
 * Map Loader controls first light
 */
export class MEMapLoader {

  collectionOfTree1 = [];

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

  constructor(mysticore, navMapPath) {
    this.core = mysticore;
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

    this.core.lightContainer[0].position[1] = 170;
    this.core.lightContainer[0].intesity = 1;
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
      raycast: {enabled: false, radius: 1.5}
    });

    setTimeout(() => {
      app.getSceneObjectByName('tree1-leaf2.001-0').position.y = 50

    }, 200)
  }

  async loadMainMap() {
    downloadMeshes({cube: "./res/meshes/maps-objs/map-1.obj"}, this.onGround.bind(this), {scale: [10, 10, 10]});

    var glbFile01 = await fetch('./res/meshes/maps-objs/tree.glb').then(res => res.arrayBuffer().then(buf => uploadGLBModel(buf, this.core.device)));
    this.core.addGlbObjInctance({
      material: {type: 'standard', useTextureFromGlb: true},
      scale: [randomIntFromTo(10,15), randomIntFromTo(10,15), randomIntFromTo(10,15)],
      position: {x: -500, y: -35, z: -500},
      name: 'tree1',
      texturesPaths: ['./res/meshes/maps-objs/textures/green.png'],
      raycast: {enabled: true, radius: 1.5},
      pointerEffect: {
        enabled: true,
      }
    }, null, glbFile01);

    setTimeout(() => {
      this.collectionOfTree1 = this.core.mainRenderBundle.filter((o => o.name.indexOf('tree') != -1));
      setTimeout(() => {
        this.addInstancing();
      }, 100)
    }, 1000)
  }

  addInstancing() {
  const spacing = 150;
  const clusterOffsets = [
    [0, 0],
    [700, 0],
    [0, 700],
    [700, 700]
  ];

  this.collectionOfTree1.forEach((partOftree) => {
 

    const treesPerCluster = 9;
    const gridSize = Math.ceil(Math.sqrt(treesPerCluster));
    const totalInstances = treesPerCluster * clusterOffsets.length;

    partOftree.updateMaxInstances(totalInstances);
    partOftree.updateInstances(totalInstances);

    let instanceIndex = 0;

    for (const [offsetX, offsetZ] of clusterOffsets) {
      for (let i = 0; i < treesPerCluster; i++) {
        const row = Math.floor(i / gridSize);
        const col = i % gridSize;
        const instance = partOftree.instanceTargets[instanceIndex++];

        instance.position[0] = offsetX + col * spacing + randomIntFromTo(0, 20);
        instance.position[2] = offsetZ + row * spacing + randomIntFromTo(0, 20);
        instance.position[1] = 0;

        instance.color[3] = 1;
        instance.color[0] = randomFloatFromTo(0.5, 2.0);
        instance.color[1] = randomFloatFromTo(0.7, 1.0);
        instance.color[2] = randomFloatFromTo(0.5, 0.9);
      }
    }
  });
  }
}