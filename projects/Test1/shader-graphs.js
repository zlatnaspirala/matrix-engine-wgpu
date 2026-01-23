export default [
  {
    "name": "fragShaderGraph",
    "content": "{\"nodes\":[{\"id\":\"N0\",\"type\":\"FragmentOutput\",\"x\":501,\"y\":401,\"inputs\":{\"color\":{\"default\":\"vec4f(1.0)\"}}},{\"id\":\"N1\",\"type\":\"TextureSampler\",\"x\":195,\"y\":259,\"name\":\"tex0\",\"inputs\":{\"uv\":{\"default\":\"input.uv\"}}}],\"connections\":[{\"from\":\"N1\",\"fromPin\":\"out\",\"to\":\"N0\",\"toPin\":\"color\"}]}"
  }
];
