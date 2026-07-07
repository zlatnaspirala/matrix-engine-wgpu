
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
    {id: '1', position: {x: 0, y: 0.2, z: 0}, radius: 1, type: 'energy', amount: '50', scale : [1,1,1], tex : './res/textures/blankgray2.webp'},
    {id: '1', position: {x: 10, y: 2.2, z: 0}, radius: 1, type: 'cube', amount: '-10', scale : [1,1,1], tex : './res/textures/shooter/hang3d.png'}
  ]
}