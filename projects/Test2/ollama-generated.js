export default {
  "nodes": {
    "n1": {
      "id": "n1",
      "title": "event",
      "category": "event",
      "x": 0,
      "y": 0,
      "inputs": [],
      "outputs": [
        {
          "name": "exec",
          "type": "action"
        }
      ]
    },
    "n2": {
      "id": "n2",
      "title": "getNumberLiteral",
      "category": "action",
      "x": 250,
      "y": 0,
      "inputs": [
        {
          "name": "exec",
          "type": "action"
        }
      ],
      "outputs": [
        {
          "name": "execOut",
          "type": "action"
        },
        {
          "name": "value",
          "type": "value"
        }
      ],
      "fields": [
        {
          "key": "value",
          "value": 10
        }
      ],
      "noselfExec": true
    },
    "n3": {
      "id": "n3",
      "title": "Print",
      "category": "actionprint",
      "x": 500,
      "y": 0,
      "inputs": [
        {
          "name": "exec",
          "type": "action"
        },
        {
          "name": "value",
          "type": "any"
        }
      ],
      "outputs": [
        {
          "name": "execOut",
          "type": "action"
        }
      ],
      "fields": [
        {
          "key": "label",
          "value": "Print 10"
        }
      ],
      "noselfExec": true
    }
  },
  "links": [
    {
      "id": "l1",
      "from": {
        "node": "n1",
        "pin": "exec",
        "type": "action",
        "out": true
      },
      "to": {
        "node": "n2",
        "pin": "exec"
      },
      "type": "action"
    },
    {
      "id": "l2",
      "from": {
        "node": "n2",
        "pin": "execOut",
        "type": "action",
        "out": true
      },
      "to": {
        "node": "n3",
        "pin": "exec"
      },
      "type": "action"
    },
    {
      "id": "l3",
      "from": {
        "node": "n2",
        "pin": "value",
        "type": "value",
        "out": true
      },
      "to": {
        "node": "n3",
        "pin": "value"
      },
      "type": "any"
    }
  ],
  "nodeCounter": 4,
  "linkCounter": 4,
  "pan": [0, 0],
  "variables": {}
};
