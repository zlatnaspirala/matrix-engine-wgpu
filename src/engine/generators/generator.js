import {runtimeCacheObjs} from "../../tools/editor/fluxCodexVertex";
import {downloadMeshes} from "../loader-obj";

// general function for stabilisation 
export function stabilizeTowerBody(body, root) {
  root.matrixPhysics.setDamping(body, 0.8, 0.95);
  root.matrixPhysics.setSleepingThresholds(0.4, 0.4);
  root.matrixPhysics.setAngularFactor(new Ammo.btVector3(0.1, 0.1, 0.1));
  root.matrixPhysics.setFriction(1.0);
  root.matrixPhysics.setRollingFriction(0.8);
  // body.setSpinningFriction(0.8);
}

/**
 * @description Generator can be used also from visual scripting.
 * Work only for physics bodie variant.
 * @param {string} material 
 * @enum "standard", "power", "mirror"
 */
let local = [];
export async function physicsBodiesGenerator(
  material = "standard",
  pos,
  rot,
  texturePath,
  name = "gen1",
  geometry = "Cube",
  raycast = false,
  scale = [1, 1, 1],
  sum = 20,
  delay = 500,
  mesh = null) {

  return new Promise((resolve) => {
    let engine = this;
    const inputCube = {mesh: "./res/meshes/blender/cube.obj"};
    const inputSphere = {mesh: "./res/meshes/blender/sphere.obj"};
    function handler(m) {
      let ALL = [];
      let RAY = {enabled: (raycast == true ? true : false), radius: 1};
      for(var x = 0;x < sum;x++) {
        const cubeName = name + '_' + x;
        setTimeout(() => {

          engine.addMeshObj({
            material: {type: material},
            position: pos,
            rotation: rot,
            rotationSpeed: {x: 0, y: 0, z: 0},
            texturesPaths: [texturePath],
            name: cubeName,
            mesh: m.mesh,
            physics: {
              enabled: true,
              geometry: geometry,
            },
            raycast: RAY
          });
          // cache
          const o = app.getSceneObjectByName(cubeName);
          runtimeCacheObjs.push(o);
          local.push(o.name);
        }, x * delay)
      }

      setTimeout(() => {
        for(let x = 0;x < local.length;x++) {
          const o1 = app.matrixPhysics.getBodyByName(local[x]);
          ALL.push(o1);
          if(x == local.length - 1) {
            resolve(ALL);
          }
        }
      }, delay * sum)

    }

    if(geometry == "Cube") {
      downloadMeshes(inputCube, handler, {scale: scale})
    } else if(geometry == "Sphere") {
      downloadMeshes(inputSphere, handler, {scale: scale})
    }

  })
}

/**
 * @description Generate a wall of physics cubes
 * @param {string} material
 * @param {object} pos        starting position {x,y,z}
 * @param {object} rot
 * @param {string} texturePath
 * @param {string} name       base name
 * @param {string} size       "WIDTHxHEIGHT" → e.g. "10x3"
 * @param {boolean} raycast
 * @param {Array} scale
 * @param {number} spacing    distance between cubes
 */
export function physicsBodiesGeneratorWall(
  material = "standard",
  pos,
  rot,
  texturePath,
  name = "wallCube",
  size = "10x3",
  raycast = false,
  scale = [1, 1, 1],
  spacing = 2,
  delay = 200,
  useMeshPath = "./res/meshes/blender/cube.obj") {
  const engine = this;
  const [width, height] = size
    .toLowerCase()
    .split("x")
    .map(n => parseInt(n, 10));
  const inputCube = {mesh: useMeshPath};

  function handler(m) {
    let index = 0;
    const RAY = {enabled: raycast, radius: 1};
    for(let y = 0;y < height;y++) {
      for(let x = 0;x < width;x++) {
        const cubeName = `${name}_${index}`;
        setTimeout(() => {
          engine.addMeshObj({
            material: {type: material},
            envMapParams: (material == 'mirror' ? {
              baseColorMix: 0.5, // normal mix
              mirrorTint: [0.9, 0.95, 1.0],    // Slight cool tint
              reflectivity: 0.95,               // 25% reflection blend
              illuminateColor: [0.3, 0.7, 1.0], // Soft cyan
              illuminateStrength: 0.4,          // Gentle rim
              illuminatePulse: 0.01,             // No pulse (static)
              fresnelPower: 2.0,                // Medium-sharp edge
              envLodBias: 2.5,
              usePlanarReflection: false,  // ✅ Env map mode
            } : undefined),
            position: {
              x: pos.x + x * spacing,
              y: pos.y + y * spacing - 2.8,
              z: pos.z
            },
            rotation: rot,
            rotationSpeed: {x: 0, y: 0, z: 0},
            texturesPaths: typeof texturePath == "object" ? texturePath : [texturePath],
            name: cubeName,
            mesh: m.mesh,
            physics: {
              scale: scale,
              enabled: true,
              geometry: "Cube"
            },
            raycast: RAY
          });
          const o = app.getSceneObjectByName(cubeName);
          runtimeCacheObjs.push(o);
        }, index * delay)
        index++;
      }
    }
  }
  downloadMeshes(inputCube, handler, {scale});
}

/**
 * @description Generate a pyramid of physics cubes
 * @param {object} pos       base position {x,y,z}
 * @param {object} rot
 * @param {string} texturePath
 * @param {string} name
 * @param {number} levels    number of pyramid levels
 * @param {boolean} raycast
 * @param {Array} scale
 * @param {number} spacing
 */
export function physicsBodiesGeneratorPyramid(
  material = "standard",
  pos,
  rot,
  texturePath,
  name = "pyramidCube",
  levels = 5,
  raycast = false,
  scale = [1, 1, 1],
  spacing = 2,
  delay = 500) {
  const engine = this;
  const inputCube = {mesh: "./res/meshes/blender/cube.obj"};

  function handler(m) {
    let index = 0;
    const RAY = {enabled: !!raycast, radius: 1};

    for(let y = 0;y < levels;y++) {
      const rowCount = levels - y;
      const xOffset = (rowCount - 1) * spacing * 0.5;
      for(let x = 0;x < rowCount;x++) {
        const cubeName = `${name}_${index}`;
        setTimeout(() => {
          engine.addMeshObj({
            material: {type: material},
            position: {
              x: pos.x + x * spacing - xOffset,
              y: pos.y + y * spacing,
              z: pos.z
            },
            rotation: rot,
            rotationSpeed: {x: 0, y: 0, z: 0},
            texturesPaths: [texturePath],
            name: cubeName,
            mesh: m.mesh,
            physics: {
              scale: scale,
              enabled: true,
              geometry: "Cube"
            },
            raycast: RAY
          });
          // cache
          const o = app.getSceneObjectByName(cubeName);
          runtimeCacheObjs.push(o);
        }, delay);
        index++;
      }
    }
  }

  downloadMeshes(inputCube, handler, {scale});
}

/**
 * @description Generate a full 3D pyramid of physics cubes
 * @param {object} pos       base position {x,y,z}
 * @param {object} rot
 * @param {string} texturePath
 * @param {string} name
 * @param {number} levels    number of pyramid levels
 * @param {boolean} raycast
 * @param {Array} scale
 * @param {number} spacing
 */
export function physicsBodiesGeneratorDeepPyramid(
  material = "standard",
  pos,
  rot,
  texturePath,
  name = "pyramidCube",
  levels = 5,
  raycast = false,
  scale = [1, 1, 1],
  spacing = 2,
  delay = 200
) {

  const root = this;

  return new Promise((resolve, reject) => {
    const engine = this;
    const inputCube = {mesh: "./res/meshes/blender/cube.obj"};
    levels = parseFloat(levels);
    function handler(m) {
      let index = 0;
      const totalCubes = (levels * (levels + 1) * (2 * levels + 1)) / 6;
      const lastIndex = totalCubes - 1;
      const RAY = {enabled: !!raycast, radius: 1};
      const objects = [];
      for(let y = 0;y < levels;y++) {
        const sizeX = levels - y;
        const sizeZ = levels - y;
        const xOffset = (sizeX - 1) * spacing * 0.5;
        const zOffset = (sizeZ - 1) * spacing * 0.5;
        for(let x = 0;x < sizeX;x++) {
          for(let z = 0;z < sizeZ;z++) {
            const cubeName = `${name}_${index}`;
            const currentIndex = index;
            setTimeout(() => {
              engine.addMeshObj({
                material: {type: material},
                position: {
                  x: pos.x + x * spacing - xOffset,
                  y: pos.y + y * spacing,
                  z: pos.z + z * spacing - zOffset
                },
                rotation: rot,
                rotationSpeed: {x: 0, y: 0, z: 0},
                texturesPaths: [texturePath],
                name: cubeName,
                mesh: m.mesh,
                physics: {
                  scale: scale,
                  enabled: true,
                  geometry: "Cube"
                },
                raycast: RAY
              });

              // const b = app.matrixPhysics.getBodyByName(cubeName);
              // not resolved for now
              // setTimeout(() => stabilizeTowerBody(b, root) , 1000)

              const o = app.getSceneObjectByName(cubeName);
              runtimeCacheObjs.push(o);
              objects.push(o.name);

              if(currentIndex === lastIndex) {
                // console.log("Last cube added!");
                resolve(objects);
              }
            }, delay * index);
            index++;
          }
        }
      }
    }

    downloadMeshes(inputCube, handler, {scale});
  });
}

export function physicsBodiesGeneratorTower(
  material = "standard",
  pos,
  rot,
  texturePath,
  name = "towerCube",
  height = 10,
  raycast = false,
  scale = [1, 1, 1],
  spacing = 2
) {
  const engine = this;
  const inputCube = {mesh: "./res/meshes/blender/cube.obj"};

  function handler(m) {
    const RAY = {enabled: !!raycast, radius: 1};

    for(let y = 0;y < height;y++) {
      const cubeName = `${name}_${y}`;

      setTimeout(() => {
        engine.addMeshObj({
          material: {type: material},
          position: {
            x: pos.x,
            y: pos.y + y * spacing,
            z: pos.z
          },
          rotation: rot,
          rotationSpeed: {x: 0, y: 0, z: 0},
          texturesPaths: [texturePath],
          name: cubeName,
          mesh: m.mesh,
          physics: {
            scale: scale,
            enabled: true,
            geometry: "Cube"
          },
          raycast: RAY
        });
        // const b = app.matrixPhysics.getBodyByName(cubeName);
        // setTimeout(() => stabilizeTowerBody(b, root) , 1000)
        // cache
        const o = app.getSceneObjectByName(cubeName);
        runtimeCacheObjs.push(o);
      }, delay);
    }
  }

  downloadMeshes(inputCube, handler, {scale});
}

// universal (both physics and non physics objects)
// app.editorAddOBJ(mat, pos, rot, texturePath, name, isPhysicsBody, raycast, scale, isInstancedObj
export function addOBJ(
  path,
  material = "standard",
  pos,
  rot,
  texturePath,
  name,
  isPhysicsBody = false,
  raycast = false,
  scale = [1, 1, 1],
  isInstancedObj = false
) {
  return new Promise((resolve, reject) => {
    const engine = this;
    const inputCube = {mesh: path};
    function handler(m) {
      const RAY = {enabled: !!raycast, radius: 1};
      // console.info('add cube form graph..')
      engine.addMeshObj({
        material: {type: material},
        position: {
          x: pos.x,
          y: pos.y,
          z: pos.z
        },
        rotation: rot,
        rotationSpeed: {x: 0, y: 0, z: 0},
        texturesPaths: [texturePath],
        name: name,
        mesh: m.mesh,
        physics: {
          scale: scale,
          enabled: isPhysicsBody,
          geometry: "Cube"
        },
        raycast: RAY
      });
      // const b = app.matrixPhysics.getBodyByName(name);
      const o = app.getSceneObjectByName(name);
      console.log(o.name);
      runtimeCacheObjs.push(o);
      resolve(o);
    }
    downloadMeshes(inputCube, handler, {scale});
  });
}


export function physicsBodiesChain(
  material = "standard",
  pos = {x: 10, y: 30, z: -6},
  rot = {x: 0, y: 0, z: 0},
  texturePath = ['./res/textures/slot/reel1.webp'],
  name = "chain",
  size = 10,
  raycast = false,
  scale = [1, 1, 1],
  spacing = 1,
  mass = 1
) {
  const engine = this;
  const inputCube = {mesh: "./res/meshes/blender/cube.obj"};

  function handler(m) {
    const RAY = {enabled: !!raycast, radius: 1};

    for(let y = 0;y < size;y++) {
      const cubeName = `${name}_${y}`;

      engine.addMeshObj({
        material: {type: material},
        position: {
          x: pos.x,
          y: pos.y + y * spacing,
          z: pos.z
        },
        rotation: rot,
        rotationSpeed: {x: 0, y: 0, z: 0},
        texturesPaths: [texturePath],
        name: cubeName,
        mesh: m.mesh,
        physics: {
          scale: scale,
          mass: y == 0 ? 0 : mass,
          enabled: true,
          geometry: "Cube",
        },
        raycast: RAY
      });
    }
    const ids = [];
    setTimeout(() => {
      for(let y = 0;y < size;y++) {
        const cubeName = `${name}_${y}`;
        const id = engine.matrixPhysics.getBodyByName(cubeName);
        const o = app.getSceneObjectByName(cubeName);
        runtimeCacheObjs.push(o);
        ids.push(id);
      }
      engine.matrixPhysics.createChain(ids, spacing, 0.5);
    }, 500)
  }

  downloadMeshes(inputCube, handler, {scale});
}
