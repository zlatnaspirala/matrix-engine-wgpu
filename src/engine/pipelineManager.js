
export function buildPipelineKey({
  vertexId,
  fragmentId,
  type,
  transparent,
  depthWrite,
  format,
  topology,
  cullMode,
  frontFace,
  mirror,
  normalMap,
}) {
  console.log('debug: ', vertexId,
    fragmentId,
    type,
    transparent,
    depthWrite,
    format,
    topology,
    cullMode,
    frontFace,
    mirror,
    normalMap);
  return JSON.stringify({
    v: vertexId,
    f: fragmentId,
    t: type,
    tr: transparent,
    dw: depthWrite,
    fmt: format,
    topo: topology,
    cull: cullMode,
    face: frontFace,
    mirror: mirror,
    normalMap: normalMap,
  });
}

export class PipelineManager {
  constructor(device) {
    this.device = device;
    this.cache = new Map();
  }

  getPipeline({key, pipeline}) {
    
    if(this.cache.has(key)) {return this.cache.get(key);}
    const p = this.device.createRenderPipeline(pipeline);

    console.log('get pipeline cache system [SET] key: ', key)

    this.cache.set(key, p);
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

  invalidate(key) {
    this.cache.delete(key);
  }

  static invalidateAll() {
    this.instance.cache.clear();
  }
}