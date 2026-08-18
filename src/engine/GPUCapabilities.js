
/**
 * @description
 * The Beast 2.0.0
 * Indirect draws feature.
 */
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