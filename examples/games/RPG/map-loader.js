import {GenGeoTexture2} from "../../../src/engine/effects/gen-tex2.js";
import {GenGeo} from "../../../src/engine/effects/gen.js";
import {downloadMeshes} from "../../../src/engine/loader-obj.js";
import {uploadGLBModel} from "../../../src/engine/loaders/webgpu-gltf.js";
import {LOG_FUNNY_SMALL, randomFloatFromTo, randomIntFromTo} from "../../../src/engine/utils.js";
import NavMesh from "./nav-mesh.js";
import {startUpPositions} from "./static.js";

/**
 * @description
 * Map Loader controls first light
 */
export class MEMapLoader {

  collectionOfTree1 = [];
  collectionOfRocks = [];

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

  constructor(forestOfHollowBlood, navMapPath) {
    this.core = forestOfHollowBlood;
    this.loadNavMesh(navMapPath).then((e) => {
      console.log(`%cnavMap loaded.${e}`, LOG_FUNNY_SMALL);
      this.core.RPG.nav = e;
      this.loadMainMap(); // <-- FIXED
    });
  }

  async onGround(m) {
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

    //https://sketchfab.com/search?features=downloadable&licenses=7c23a1ba438d4306920229c12afcb5f9&licenses=322a749bcfa841b29dff1e8a1bb74b0b&q=rock&type=models
    var glbFile01 = await fetch('./res/meshes/env/rocks/rock1.glb').then(res => res.arrayBuffer().then(buf => uploadGLBModel(buf, this.core.device)));
    this.core.addGlbObjInctance({
      material: {type: 'standard', useTextureFromGlb: true},
      scale: [14, 13, 14],
      position: {
        x: -780,
        y: -10,
        z: 950
      },
      name: 'rocks1',
      texturesPaths: ['./res/meshes/glb/textures/mutant_origin.png'],
      raycast: {enabled: false, radius: 1.5},
      pointerEffect: {
        enabled: true
      }
    }, null, glbFile01);

    // on engine level must be upgraded "add rotation for instanced objs... on meshObjInstanced class..."
    // FOr now i will use another scene obj but same loaded data - that ok
    this.core.addGlbObjInctance({
      material: {type: 'standard', useTextureFromGlb: true},
      scale: [14, 13, 14],
      rotation: {x: 0, y: 90, z: 0},
      position: {
        x: -1040,
        y: -10,
        z: 850
      },
      name: 'rocks2',
      texturesPaths: ['./res/meshes/glb/textures/mutant_origin.png'],
      raycast: {enabled: false, radius: 1.5},
      pointerEffect: {
        enabled: true,
        flameEffect: false
      }
    }, null, glbFile01);

    // Tron enemy
    var glbFile02 = await fetch('./res/meshes/env/rocks/home.glb').then(res => res.arrayBuffer().then(buf => uploadGLBModel(buf, this.core.device)));

    let getEnemyName__ = '';
    if(this.core.player.data.team == "south") {
      getEnemyName__ = 'north';
    } else {
      getEnemyName__ = 'south';
    }

    this.core.addGlbObjInctance({
      material: {type: 'standard', useTextureFromGlb: true},
      scale: [1, 1, 1],
      rotation: {x: 0, y: 90, z: 0},
      position: {
        x: creepPoints[getEnemyName__].finalPoint[0],
        y: creepPoints[getEnemyName__].finalPoint[1],
        z: creepPoints[getEnemyName__].finalPoint[2]
      },
      name: 'enemytron',
      texturesPaths: ['./res/meshes/glb/textures/mutant_origin.png'],
      raycast: {enabled: false, radius: 1.5},
      pointerEffect: {
        enabled: true,
        flameEffect: false
      }
    }, null, glbFile02);


    var glbFile03 = await fetch('./res/meshes/env/rocks/home.glb').then(res => res.arrayBuffer().then(buf => uploadGLBModel(buf, this.core.device)));
    this.core.addGlbObjInctance({
      material: {type: 'standard', useTextureFromGlb: true},
      scale: [15, 15, 15],
      rotation: {x: 0, y: 90, z: 0},
      position: {
        x: -800,
        y: -20,
        z: 830
      },
      name: 'tron_',
      texturesPaths: ['./res/textures/star1.png'],
      raycast: {enabled: false, radius: 1.5},
      pointerEffect: {
        enabled: true,
        energyBar: true,
      }
    }, null, glbFile03);

    setTimeout(() => {
      this.collectionOfRocks = this.core.mainRenderBundle.filter((item) => item.name.indexOf('rocks1') != -1);
      this.collectionOfRocks.forEach((item) => {
        item.globalAmbient = [10, 10, 10];
        // this.core.collisionSystem.register(`rock1`, item.position, 15.0, 'rock');
      });
      this.collectionOfRocks2 = this.core.mainRenderBundle.filter((item) => item.name.indexOf('rocks2') != -1);
      this.collectionOfRocks2.forEach((item) => {
        item.globalAmbient = [10, 10, 10];
        // this.core.collisionSystem.register(`rock1`, item.position, 15.0, 'rock');
      })
      this.addInstancingRock();

      // remove after
      // app.homebase = this.core.mainRenderBundle.filter((item) => item.name.indexOf('homebase') != -1)[0];
      // app.homebase.globalAmbient = [16, 2, 1];

      app.tron = this.core.mainRenderBundle.filter((item) => item.name.indexOf('tron_') != -1)[0];
      app.tron.globalAmbient = [2, 2, 2];

      // this.pointerEffect.circlePlaneTexPath
      app.tron.effects.circle = new GenGeoTexture2(app.device, app.tron.presentationFormat, 'circle2', './res/textures/star1.png');
      app.tron.effects.circle.rotateEffectSpeed = 0.01;

      this.core.collisionSystem.register(`rock3`, app.tron.position, 25.0, 'rock');

      setTimeout(() => {
        app.tron.effects.circle.instanceTargets[0].position = [0, 6, 0];
        app.tron.effects.circle.instanceTargets[1].position = [0, 6, 0];
        app.tron.effects.circle.instanceTargets[0].color = [2, 0.1, 0, 0.5];
        app.tron.effects.circle.instanceTargets[1].color = [1, 1, 1, 0.11];
      }, 5000)
      // circlePlaneTexPath: './res/textures/star1.png',

    }, 2000);

    this.core.lightContainer[0].position[1] = 175;
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
    downloadMeshes({
      cube: "./res/meshes/maps-objs/map-1.obj",
      tower: "./res/meshes/env/tower.obj"
    }, this.onGround.bind(this), {scale: [10, 10, 10]});

    var glbFile01 = await fetch('./res/meshes/maps-objs/tree.glb').then(res => res.arrayBuffer().then(buf => uploadGLBModel(buf, this.core.device)));
    this.core.addGlbObjInctance({
      material: {type: 'standard', useTextureFromGlb: true},
      scale: [randomIntFromTo(10, 15), randomIntFromTo(10, 15), randomIntFromTo(10, 15)],
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
      this.addInstancing();
    }, 3500);
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

      partOftree.globalAmbient = [randomIntFromTo(5, 15), randomIntFromTo(5, 15), randomIntFromTo(5, 15)];

      const treesPerCluster = 9;
      const gridSize = Math.ceil(Math.sqrt(treesPerCluster));
      const totalInstances = treesPerCluster * clusterOffsets.length;

      partOftree.updateMaxInstances(totalInstances);
      partOftree.updateInstances(totalInstances);

      let instanceIndex = 0;

      for(const [offsetX, offsetZ] of clusterOffsets) {
        for(let i = 0;i < treesPerCluster;i++) {
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

  addInstancingRock() {
    const NUM = 16;
    this.collectionOfRocks.forEach((rock) => {
      rock.updateMaxInstances(NUM);
      rock.updateInstances(NUM);
      for(var x = 0;x < NUM;x++) {
        let instance;
        if(x == 0) {
          instance = rock.instanceTargets[x];
          instance.position[0] = 200;
          instance.position[2] = 0;
          instance.position[1] = 0;
        } else if(x < 8) {
          instance = rock.instanceTargets[x];
          instance.position[0] = x * 250;
          instance.position[2] = 0;
          instance.position[1] = 0;
        } else if(x < 16) {
          instance = rock.instanceTargets[x];
          instance.position[0] = (x - 8) * 250;
          instance.position[2] = -2000;
          instance.position[1] = 0;
        }

        instance.color[3] = 1;
        instance.color[0] = 1;
        instance.color[1] = 1;
        instance.color[2] = randomIntFromTo(1, 1.5);
      }
    });


    const NUM2 = 16;
    this.collectionOfRocks2.forEach((rock) => {
      rock.updateMaxInstances(NUM2);
      rock.updateInstances(NUM2);
      for(var x = 0;x < NUM2;x++) {
        let instance;
        if(x < 8) {
          instance = rock.instanceTargets[x];
          instance.position[0] = -50;
          instance.position[2] = -2000 + x * 250;
          instance.position[1] = 0;
        } else if(x < 16) {
          instance = rock.instanceTargets[x];
          instance.position[0] = 1950;
          instance.position[2] = -1800 + (x - 8) * 250;
          instance.position[1] = 0;
        }

        instance.color[3] = 1;
        instance.color[0] = 1;
        instance.color[1] = 1;
        instance.color[2] = 1;
      }
    });
  }
}