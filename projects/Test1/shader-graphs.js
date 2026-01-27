export default [
  {
    "name": "fragShader",
    "content": "{\"nodes\":[{\"id\":\"N0\",\"type\":\"FragmentOutput\",\"x\":777,\"y\":480,\"inputs\":{\"color\":{\"default\":\"vec4f(1.0)\"}}},{\"id\":\"N1\",\"type\":\"GlobalAmbient\",\"x\":237,\"y\":279,\"inputs\":{}},{\"id\":\"N2\",\"type\":\"MultiplyColor\",\"x\":543,\"y\":451,\"inputs\":{\"a\":{\"default\":\"vec4(1.0)\"},\"b\":{\"default\":\"vec4(1.0)\"}}},{\"id\":\"N3\",\"type\":\"Color\",\"x\":208,\"y\":587,\"r\":1,\"g\":1,\"b\":1,\"a\":1,\"inputs\":{}}],\"connections\":[{\"from\":\"N3\",\"fromPin\":\"out\",\"to\":\"N2\",\"toPin\":\"b\"},{\"from\":\"N1\",\"fromPin\":\"out\",\"to\":\"N2\",\"toPin\":\"a\"},{\"from\":\"N2\",\"fromPin\":\"out\",\"to\":\"N0\",\"toPin\":\"color\"}]}"
  },
  {
    "name": "MyShader1",
    "content": "{\"nodes\":[{\"id\":\"N8\",\"type\":\"FragmentOutput\",\"x\":462,\"y\":341,\"inputs\":{\"color\":{\"default\":\"vec4f(1.0)\"}}},{\"id\":\"N6\",\"type\":\"LightShadowNode\",\"x\":68,\"y\":214,\"inputs\":{\"intensity\":{\"default\":\"1\"}}},{\"id\":\"N7\",\"type\":\"LightToColor\",\"x\":262,\"y\":294,\"inputs\":{\"light\":{\"default\":\"vec3f(1.0)\"}}}],\"connections\":[{\"from\":\"N6\",\"fromPin\":\"out\",\"to\":\"N7\",\"toPin\":\"light\"},{\"from\":\"N7\",\"fromPin\":\"out\",\"to\":\"N8\",\"toPin\":\"color\"}]}"
  },
  {
    "name": "nikola",
    "content": "{\"nodes\":[{\"id\":\"N1\",\"type\":\"FragmentOutput\",\"x\":313,\"y\":255,\"inputs\":{\"color\":{\"default\":\"vec4f(1.0)\"}}}],\"connections\":[]}"
  },
  {
    "name": "nidza",
    "content": "{\"nodes\":[{\"id\":\"N5\",\"type\":\"FragmentOutput\",\"x\":440,\"y\":297,\"inputs\":{\"color\":{\"default\":\"vec4f(1.0)\"}}}],\"connections\":[]}"
  }
];
