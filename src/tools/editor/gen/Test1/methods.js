export default [
  {
    "name": "NIK",
    "code": "function NIK (zigzag) {\n   alert('NIK BIND FUNC' + zigzag)\n return zigzag;\n}",
    "type": "return",
    "intervalId": null
  },
  {
    "name": "TEST1",
    "code": "function TEST1() {\n  return { name : 'nik' };\n}",
    "type": "return",
    "intervalId": null
  },
  {
    "name": "downloadObj",
    "code": "function downloadObj (name, path) {\n\n  downloadMeshes({\n        cube: path,\n      }, (m) => {\n\n      app.addMeshObj({\n        position: {x: 0, y: -5, z: -10},\n        rotation: {x: 0, y: 0, z: 0},\n        rotationSpeed: {x: 0, y: 0, z: 0},\n        texturesPaths: ['./res/meshes/blender/cube.png'],\n        name: name,\n        mesh: m.cube,\n        physics: {\n          enabled: false,\n          mass: 0,\n          geometry: \"Cube\"\n        },\n        // raycast: { enabled: true , radius: 2 }\n      })\n    } ,\n        {scale: [20, 20, 20]})\n\n}",
    "type": "void",
    "intervalId": null
  }
];
