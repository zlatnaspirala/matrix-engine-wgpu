export default {
  "nodes": {
    "node_0": {
      "id": "node_0",
      "title": "onLoad",
      "x": 50,
      "y": 50,
      "category": "event",
      "inputs": [],
      "outputs": [
        {
          "name": "exec",
          "type": "action"
        }
      ]
    },
    "node_1": {
      "id": "node_1",
      "title": "Generator Pyramid",
      "x": 350,
      "y": 50,
      "category": "action",
      "noselfExec": "true",
      "outputs": [
        {
          "name": "execOut",
          "type": "action"
        },
        {
          "name": "complete",
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
      "from": {
        "node": "node_0",
        "out": true,
        "pin": "exec",
        "type": "action"
      },
      "id": "link_0",
      "to": {
        "node": "node_1",
        "pin": "exec"
      },
      "type": "action"
    }
  ],
  "variables": {
    "number": {
      "levels": 5,
      "spacing": 1.5,
      "delay": 50
    },
    "boolean": {
      "raycast": true
    },
    "string": {},
    "object": {
      "pos": {},
      "rot": {},
      "scale": [
        1,
        1,
        1
      ]
    }
  },
  "pan": [
    0,
    0
  ],
  "nodeCounter": 3,
  "linkCounter": 2
};
