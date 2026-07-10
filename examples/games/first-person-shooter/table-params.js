
export const mapParams = {
  zombie: {
    startUpPositions: {
      south: [-20, 0.2, 20],
      p1: [-8.35, 0.2, 4.56],
      p2: [-8.35, 0.2, 4.56],
      north: [20, 0.2, -20]
    },
  },
  collectItems: [
    {id: '1', position: {x: 2.5, y: 1.3, z: 10}, radius: 0.5, type: 'ammo', amount: '100', scale : [-0.5,-0.5,-0.5], tex : './res/textures/shooter/hang3d.png'},
    {id: '2', position: {x: -4, y: 1.3, z: -10}, radius: 1, type: 'energy', amount: '50', scale : [1,1.5,1], tex : './res/textures/blankgray2.webp'},
    {id: '3', position: {x: -60.56, y: -1.799, z: -0.045}, radius: 1, type: 'energy', amount: '50', scale : [1,1.5,1], tex : './res/textures/blankgray2.webp'},
    {id: '4', position: {x: -44.79292678833008, y: 2.3, z: -0.29}, radius: 1, type: 'armor', amount: '50', scale : [1,1,1], tex : './res/meshes/obj/armor.webp'},
    //-3.297156572341919, 1.2999999523162842, 19.40506362915039
  ]
}