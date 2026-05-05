export default [
  {
    "name": "MyFirstFunc",
    "code": "function MyFirstFunc(objName, status) {\n  let delta = 1500;\n  if (objName == \"editorGen1\") {\n   app.getSceneObjectByName(objName).morphTo(status, delta);\n  }\n}",
    "type": "void",
    "intervalId": null
  },
  {
    "name": "test",
    "code": "function test (input) {\n let output = input*2;\n return output;\n}",
    "type": "return",
    "intervalId": null
  }
];
