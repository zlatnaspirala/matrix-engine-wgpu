// Stone column
export function fountainStructureConfig(MeshMorpher) {
    return { meshA: MeshMorpher.cylinder(0.15, 2.5), meshB: MeshMorpher.cylinder(0.15, 2.5), resolutionU: 32, resolutionV: 1 };
}
// Stone basin floor
export function fountainBasinStoneConfig(MeshMorpher) {
    return { meshA: MeshMorpher.plane(2.5), meshB: MeshMorpher.plane(2.5), resolutionU: 1, resolutionV: 1 };
}
// Water top disk
export function fountainCapConfig(MeshMorpher) {
    return { meshA: MeshMorpher.plane(1.0), meshB: MeshMorpher.plane(1.4), resolutionU: 1, resolutionV: 1 };
}
// Water curtain
export function fountainCurtainConfig(MeshMorpher) {
    return { meshA: MeshMorpher.cylinder(0.5, 2.0), meshB: MeshMorpher.cylinder(0.6, 2.0), resolutionU: 48, resolutionV: 32 };
}
// Basin water surface
export function fountainBasinWaterConfig(MeshMorpher) {
    return { meshA: MeshMorpher.plane(2.0), meshB: MeshMorpher.plane(2.0), resolutionU: 1, resolutionV: 1 };
}

export const FOUNTAIN_COLUMN_TOP = 1.25;  // half of cylinder height 2.5


  // // THIS MUST BE ELIMINATED FROM WORLD.JS
  // addFontana = (o, clearColor = this.options.clearColor) => {
  //   const px = o.position.x;
  //   const py = o.position.y;
  //   const pz = o.position.z;
  //   const TOP = FOUNTAIN_COLUMN_TOP;

  //   const geo1 = fountainStructureConfig(MeshMorpher);
  //   let m1 = this.addProceduralMeshObj({
  //     material: {type: 'free'}, name: 'fontana_column',
  //     position: {x: px, y: py, z: pz}, rotation: {x: 0, y: 0, z: 0}, scale: [o.scale[0], o.scale[1], o.scale[2]], rotationSpeed: {x: 0, y: 0, z: 0},
  //     texturesPaths: ['./res/textures/cube-g1_low.webp'], physics: {enabled: false, geometry: 'Sphere'}, raycast: {enabled: true, radius: 1.5},
  //     meshA: geo1.meshA, meshB: geo1.meshB, resolutionU: geo1.resolutionU, resolutionV: geo1.resolutionV,
  //     fragmentWGSL: fountainCurtainFragmentWGSL(), vertexWGSL: fountainWaterVertexWGSL(),
  //     // pointerEffect: {
  //     //   enabled: true,
  //     //   flameEmitter: true,
  //     // }
  //   });

  //   const geo2 = fountainBasinStoneConfig(MeshMorpher);
  //   let m2 = this.addProceduralMeshObj({
  //     material: {type: 'free'}, name: 'fontana_basin_stone',
  //     position: {x: px, y: py, z: pz}, rotation: {x: 0, y: 0, z: 0}, scale: [o.scale[0], o.scale[1], o.scale[2]], rotationSpeed: {x: 0, y: 0, z: 0},
  //     texturesPaths: ['./res/textures/cube-g1_low.webp'], physics: {enabled: false, geometry: 'Sphere'}, raycast: {enabled: true, radius: 1.5},
  //     meshA: geo2.meshA, meshB: geo2.meshB, resolutionU: geo2.resolutionU, resolutionV: geo2.resolutionV,
  //     fragmentWGSL: fountainCapFragmentWGSL(), vertexWGSL: fountainWaterVertexWGSL(),
  //   });

  //   const geo3 = fountainCapConfig(MeshMorpher);
  //   let m3 = this.addProceduralMeshObj({
  //     material: {type: 'fontana'}, name: 'fontana_cap',
  //     globalAmbient: [0.15, 0.72, 0.96, 1.0],
  //     position: {x: px, y: py + TOP * 0.8, z: pz}, rotation: {x: 0, y: 0, z: 0}, scale: [o.scale[0], o.scale[1], o.scale[2]], rotationSpeed: {x: 0, y: 0, z: 0},
  //     texturesPaths: ['./res/textures/cube-g1_low.webp'], physics: {enabled: false, geometry: 'Sphere'}, raycast: {enabled: true, radius: 1.5},
  //     meshA: geo3.meshA, meshB: geo3.meshB, resolutionU: geo3.resolutionU, resolutionV: geo3.resolutionV,
  //     fragmentWGSL: fountainCapFragmentWGSL(), vertexWGSL: fountainWaterVertexWGSL(),
  //   });

  //   const geo4 = fountainCurtainConfig(MeshMorpher);
  //   let m4 = this.addProceduralMeshObj({
  //     material: {type: 'fontana'}, name: 'fontana_curtain',
  //     globalAmbient: [0.12, 0.68, 0.94, 1.0],
  //     position: {x: px, y: py, z: pz}, rotation: {x: 0, y: 0, z: 0}, scale: [o.scale[0], o.scale[1], o.scale[2]], rotationSpeed: {x: 0, y: 0, z: 0},
  //     texturesPaths: ['./res/textures/cube-g1_low.webp'], physics: {enabled: false, geometry: 'Sphere'}, raycast: {enabled: true, radius: 1.5},
  //     meshA: geo4.meshA, meshB: geo4.meshB, resolutionU: geo4.resolutionU, resolutionV: geo4.resolutionV,
  //     fragmentWGSL: fountainCurtainFragmentWGSL(), vertexWGSL: fountainWaterVertexWGSL()
  //   });

  //   const geo5 = fountainBasinWaterConfig(MeshMorpher);
  //   let m5 = this.addProceduralMeshObj({
  //     material: {type: 'fontana'}, name: 'fontana_basin_water',
  //     globalAmbient: [0.08, 0.55, 0.90, 1.0],
  //     position: {x: px, y: py + 0.01, z: pz}, rotation: {x: 0, y: 0, z: 0}, scale: [o.scale[0], o.scale[1], o.scale[2]], rotationSpeed: {x: 0, y: 0, z: 0},
  //     texturesPaths: ['./res/textures/cube-g1_low.webp'], physics: {enabled: false, geometry: 'Sphere'}, raycast: {enabled: true, radius: 1.5},
  //     meshA: geo5.meshA, meshB: geo5.meshB, resolutionU: geo5.resolutionU, resolutionV: geo5.resolutionV,
  //     fragmentWGSL: fountainBasinFragmentWGSL(), vertexWGSL: fountainWaterVertexWGSL(),
  //   });

  //   m1.rotation.setRotateY(1000);
  //   m4.setBlend(0.1);

  //   setTimeout(() => {
  //     // m4.effects.flameEmitter.instanceTargets.forEach((i) => {
  //     //   i.color = [0, randomIntFromTo(0, 100), randomIntFromTo(50, 200)];
  //     // })
  //   }, 1000)
  // }