
export function buildPipelineKey({
  vertexId,
  fragmentId,
  type,          // mesh | instanced | procedural
  transparent,
  depthWrite,
  primitive,
  layoutFlags,   // mirror, morph, etc
  format
}) {
  // console.log('debug: ', vertexId,
  //   fragmentId,
  //   type,
  //   transparent,
  //   depthWrite,
  //   primitive,
  //   layoutFlags,
  //   format);
  return JSON.stringify({
    v: vertexId,
    f: fragmentId,
    t: type,
    tr: transparent,
    dw: depthWrite,
    fmt: format,
    prim: {
      topology: primitive.topology,
      cullMode: primitive.cullMode,
      frontFace: primitive.frontFace,
    },
    flags: layoutFlags
  });
}

export class PipelineManager {
  constructor(device) {
    this.device = device;
    this.cache = new Map();
  }

  getPipeline({key, pipeline}) {
    const k = JSON.stringify(key);
    if(this.cache.has(k)) {return this.cache.get(k)}
    const p = this.device.createRenderPipeline(pipeline);
    this.cache.set(k, p);
    return p;
  }

  // static singleton access
  static instance;

  static init(device) {
    this.instance = new PipelineManager(device);
  }

  static get() {
    return this.instance;
  }
}