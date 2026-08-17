export const GPU_FEATURES = {
  // Automatically enabled by engine
  GROUP_1: [
    'timestamp-query',
    'indirect-first-instance',
    'texture-compression-bc',
    'depth32float-stencil8',
  ],
  // User can enable these
  GROUP_2: [
    'shader-f16',
    'float32-filterable',
    'float32-blendable',
    'texture-compression-astc',
    'texture-compression-etc2',
    'bgra8unorm-storage',
    'subgroups',
    'clip-distances',
    'dual-source-blending',
  ],
  // Experimental / future
  GROUP_3: [
    'pipeline-statistics-query',
    'depth-clamping',
    'multi-planar-formats',
  ],
};

export class GPUCapabilities {

  constructor(adapter) {
    this.adapter = adapter;
    this.supported = new Set(adapter.features);
    this.group1 = new Set();
    this.group2 = new Set();
    this.group3 = new Set();
    this.enabled = new Set();
    console.log('GPU features:', this.supported)
  }

  supports(feature) {
    return this.supported.has(feature);
  }

  addGroup1(feature) {
    if(this.supports(feature)) {
      this.group1.add(feature);
    }
  }

  addGroup2(feature) {
    if(this.supports(feature)) {
      this.group2.add(feature);
    }
  }

  addGroup3(feature) {
    if(this.supports(feature)) {
      this.group3.add(feature);
    }
  }

  enable(feature) {
    if(!this.supports(feature)) {
      return false;
    }

    this.enabled.add(feature);
    return true;
  }

  isEnabled(feature) {
    return this.enabled.has(feature);
  }
}