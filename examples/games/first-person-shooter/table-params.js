
export const mapParams = {
  zombie: {
    startUpPositions: {
      south: [-20, 0.2, 20],
      p1: [-8.35, 0.2, 4.56],
      p2: [8.35, 0.2, 4.56],
      p3: [4.35, 0.2, 4.56],
      north: [20, 0.2, -20]
    },
  },
  collectItems: [
    {id: '1', position: {x: 2.5, y: 0.4, z: 10}, radius: 0.4, type: 'ammo', amount: '100', scale : [0.3,0.3,0.3], tex : './res/textures/metal/metal1.webp'},
    {id: '2', position: {x: -4, y: 0.4, z: -10}, radius: 0.4, type: 'energy', amount: '50', scale : [0.8,0.8,0.8], tex : './res/textures/blankgray2.webp'},
    {id: '3', position: {x: -60.56, y: -1.799, z: -0.045}, radius: 0.4, type: 'energy', amount: '50', scale : [1,1.5,1], tex : './res/textures/blankgray2.webp'},
    {id: '4', position: {x: -44.79292678833008, y: 2.3, z: -0.29}, radius: 1, type: 'armor', amount: '50', scale : [1,1,1], tex : './res/meshes/obj/armor.webp'},
  ]
}