import {downloadMeshes} from "../loader-obj";

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
  mesh = null) {

  let engine = this;
  console.info("THIS", this)
  const inputCube = {mesh: "./res/meshes/blender/cube.obj"};
  const inputSphere = {mesh: "./res/meshes/blender/sphere.obj"};

  function handler(m) {
    console.log("GEN TEST", m.mesh)
    let RAY = {enabled: (raycast == true ? true : false), radius: 1};

    for(var x = 0; x < sum; x++) {
      engine.addMeshObj({
        material: {type: 'standard'},
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
    }
  }
  if(geometry == "Cube") {
    downloadMeshes(inputCube, handler, {scale: scale})
  } else if(geometry == "Sphere") {
    downloadMeshes(inputSphere, handler, {scale: scale})
  }


} 