export default [
  {
    "name": "fragShaderGraph",
    "content": "{\"nodes\":[{\"id\":\"N0\",\"type\":\"FragmentOutput\",\"x\":534,\"y\":317,\"inputs\":{\"color\":{\"default\":\"vec4f(1.0)\"}}},{\"id\":\"N1\",\"type\":\"LightToColor\",\"x\":282,\"y\":227,\"inputs\":{\"light\":{\"default\":\"vec3f(1.0)\"}}},{\"id\":\"N2\",\"type\":\"LightShadowNode\",\"x\":128,\"y\":119,\"inputs\":{\"intensity\":{\"default\":\"1\"}}}],\"connections\":[{\"from\":\"N2\",\"fromPin\":\"out\",\"to\":\"N1\",\"toPin\":\"light\"},{\"from\":\"N1\",\"fromPin\":\"out\",\"to\":\"N0\",\"toPin\":\"color\"}]}"
  },
  {
    "name": "MyShader1",
    "content": "{\"nodes\":[],\"connections\":[{\"from\":\"N1\",\"fromPin\":\"out\",\"to\":\"N0\",\"toPin\":\"color\"}]}"
  },
  {
    "name": "MyShader12",
    "content": "{\"nodes\":[{\"id\":\"N0\",\"type\":\"FragmentOutput\",\"x\":618,\"y\":414,\"inputs\":{\"color\":{\"default\":\"vec4f(1.0)\"}}},{\"id\":\"N1\",\"type\":\"LightToColor\",\"x\":373,\"y\":280,\"inputs\":{\"light\":{\"default\":\"vec3f(1.0)\"}}},{\"id\":\"N2\",\"type\":\"LightShadowNode\",\"x\":115,\"y\":205,\"inputs\":{\"intensity\":{\"default\":\"1\"}}}],\"connections\":[{\"from\":\"N2\",\"fromPin\":\"out\",\"to\":\"N1\",\"toPin\":\"light\"},{\"from\":\"N1\",\"fromPin\":\"out\",\"to\":\"N0\",\"toPin\":\"color\"}]}"
  },
  {
    "name": "MyShader123",
    "content": "{\"nodes\":[],\"connections\":[]}"
  },
  {
    "name": "MyShader1234",
    "content": "{\"nodes\":[],\"connections\":[]}"
  }
];
