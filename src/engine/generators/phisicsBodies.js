import {runtimeCacheObjs} from "../../tools/editor/fluxCodexVertex";
import {downloadMeshes} from "../loader-obj";

// general function for stabilisation 
export function stabilizeTowerBody(body) {
  body.setDamping(0.8, 0.95);
  body.setSleepingThresholds(0.4, 0.4);
  body.setAngularFactor(new Ammo.btVector3(0.1, 0.1, 0.1));
  body.setFriction(1.0);
  body.setRollingFriction(0.8);
  // body.setSpinningFriction(0.8);
}

/**
 * @description Generator can be used also from visual scripting.
 * Work only for physics bodie variant.
 * @param {string} material 
 * @enum "standard", "power"
 */
export function physicsBodiesGenerator(
  material = "standard",
  pos,
  rot,
  texturePath,
  name = "gen1",
  geometry = "Cube",
  raycast = false,
  scale = [1, 1, 1],
  sum = 100,
  delay = 500,
  mesh = null) {
  let engine = this;
  const inputCube = {mesh: "./res/meshes/blender/cube.obj"};
  const inputSphere = {mesh: "./res/meshes/blender/sphere.obj"};
  function handler(m) {
    let RAY = {enabled: (raycast == true ? true : false), radius: 1};
    for(var x = 0;x < sum;x++) {
      setTimeout(() => {
        engine.addMeshObj({
          material: {type: material},
          position: pos,
          rotation: rot,
          rotationSpeed: {x: 0, y: 0, z: 0},
          texturesPaths: [texturePath],
          name: name + '_' + x,
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
      }, x * delay)
    }
  }
  if(geometry == "Cube") {
    downloadMeshes(inputCube, handler, {scale: scale})
  } else if(geometry == "Sphere") {
    downloadMeshes(inputSphere, handler, {scale: scale})
  }
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
  delay = 200) {
  const engine = this;

  const [width, height] = size
    .toLowerCase()
    .split("x")
    .map(n => parseInt(n, 10));

  const inputCube = {mesh: "./res/meshes/blender/cube.obj"};

  function handler(m) {
    let index = 0;
    const RAY = {enabled: !!raycast, radius: 1};
    for(let y = 0;y < height;y++) {
      for(let x = 0;x < width;x++) {
        const cubeName = `${name}_${index}`;
        setTimeout(() => {
          engine.addMeshObj({
            material: {type: material},
            position: {
              x: pos.x + x * spacing,
              y: pos.y + y * spacing - 2.8,
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
          // const b = app.matrixAmmo.getBodyByName(cubeName);
          // stabilizeTowerBody(b);
          // cache
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
  const engine = this;
  const inputCube = {mesh: "./res/meshes/blender/cube.obj"};
  function handler(m) {
    let index = 0;
    const RAY = {enabled: !!raycast, radius: 1};
    for(let y = 0;y < levels;y++) {
      const sizeX = levels - y; // shrink X
      const sizeZ = levels - y; // shrink Z
      const xOffset = (sizeX - 1) * spacing * 0.5;
      const zOffset = (sizeZ - 1) * spacing * 0.5;
      for(let x = 0;x < sizeX;x++) {
        for(let z = 0;z < sizeZ;z++) {
          const cubeName = `${name}_${index}`;
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
            // Optional: stabilize tower-style
            const b = app.matrixAmmo.getBodyByName(cubeName);
            stabilizeTowerBody(b);
            // cache
            const o = app.getSceneObjectByName(cubeName);
            runtimeCacheObjs.push(o);
          }, delay * index);
          index++;
        }
      }
    }
  }

  downloadMeshes(inputCube, handler, {scale});
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
        const b = app.matrixAmmo.getBodyByName(cubeName);
        stabilizeTowerBody(b);
        // cache
        const o = app.getSceneObjectByName(cubeName);
        runtimeCacheObjs.push(o);
      }, delay);
    }
  }

  downloadMeshes(inputCube, handler, {scale});
}
