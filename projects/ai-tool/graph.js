export default {
  "nodes": {
    "node_1": {
      "id": "node_1",
      "title": "onLoad",
      "x": 100,
      "y": 100,
      "category": "event",
      "fields": [],
      "inputs": [],
      "outputs": [
        {
          "name": "exec",
          "type": "action"
        }
      ]
    },
    "node_2": {
      "id": "node_2",
      "title": "Generator Pyramid",
      "x": 400,
      "y": 100,
      "category": "action",
      "fields": [
        {
          "key": "material",
          "value": "cube"
        },
        {
          "key": "pos",
          "value": "0,-5,-20"
        },
        {
          "key": "texturePath",
          "value": "res/images/complex_texture_1/diffuse.png"
        },
        {
          "key": "levels",
          "value": "5"
        }
      ],
      "inputs": [
        {
          "name": "exec",
          "type": "action"
        },
        {
          "name": "material",
          "type": "string"
        },
        {
          "name": "pos",
          "type": "object"
        },
        {
          "name": "texturePath",
          "type": "string"
        },
        {
          "name": "levels",
          "type": "number"
        }
      ],
      "outputs": [
        {
          "name": "execOut",
          "type": "action"
        },
        {
          "name": "objectNames",
          "type": "object"
        }
      ]
    }
  },
  "links": [
    {
      "id": "link_1",
      "from": {
        "node": "node_1",
        "pin": "exec",
        "type": "action",
        "out": true
      },
      "to": {
        "node": "node_2",
        "pin": "exec",
        "type": "action"
      },
      "type": "action"
    }
  ],
  "variables": {
    "number": {},
    "boolean": {},
    "string": {},
    "object": {}
  },
  "nodeCounter": 2,
  "linkCounter": 1,
  "pan": [
    0,
    0
  ]
}
