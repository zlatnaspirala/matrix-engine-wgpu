// webGPU enumerators and literal cases.

export const targetBlending = {
  StandardAlphaBlending: {
    color: {srcFactor: "src-alpha", dstFactor: "one-minus-src-alpha", operation: "add"},
    alpha: {srcFactor: "one", dstFactor: "one-minus-src-alpha", operation: "add"}
  },
  PremultipliedAlpha: {
    color: {srcFactor: "one", dstFactor: "one-minus-src-alpha", operation: "add"},
    alpha: {srcFactor: "one", dstFactor: "one-minus-src-alpha", operation: "add"}
  },
  Additive: {
    color: {srcFactor: "one", dstFactor: "one", operation: "add"},
    alpha: {srcFactor: "one", dstFactor: "one", operation: "add"}
  },
  AdditiveSourceAlpha: {
    color: {srcFactor: "src-alpha", dstFactor: "one", operation: "add"},
    alpha: {srcFactor: "one", dstFactor: "one", operation: "add"},
  },
  SoftAdditive: {
    color: {srcFactor: "one", dstFactor: "one-minus-src-color", operation: "add"},
    alpha: {srcFactor: "one", dstFactor: "one-minus-src-alpha", operation: "add"}
  },
  Multiply: {
    color: {srcFactor: "dst-color", dstFactor: "zero", operation: "add"},
    alpha: {srcFactor: "dst-alpha", dstFactor: "zero", operation: "add"}
  },
  Replace: {
    color: {srcFactor: "one", dstFactor: "zero", operation: "add"},
    alpha: {srcFactor: "one", dstFactor: "zero", operation: "add"}
  }
};

//   "never"
//   "less"
//   "equal"
//   "less-equal"
//   "greater"
//   "not-equal"
//   "greater-equal"
//   "always"

export const TOPOLOGY = {
  POINT_LIST: "point-list",
  LINE_LIST: "line-list",
  LINE_STRIPT: "line-strip",
  TRIANGLE_LIST: "triangle-list",
  TRIANGLE_STRIP: "triangle-strip",
};