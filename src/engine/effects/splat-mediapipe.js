// SplatHandEffect.js

export class SplatHandEffect {
  /**
   * Follows FlameEmitter interface:
   * - updateInstanceData(baseModelMatrix) called automatically
   * - render(pass, mesh, viewProjMatrix, dt) called automatically
   * - NO autoUpdate involvement
   *
   * @param {GPUDevice} device
   * @param {string} format
   * @param {GPUBuffer} cameraBuffer
   * @param {GaussianSplatLayer} splatLayer  — the live splat layer to drive
   * @param {object} opts
   * @param {number} opts.scale          world-space scale for hand (default 3.0)
   * @param {number} opts.clusterRadius  spread around each joint (default 0.08)
   * @param {number[]} opts.origin       world offset [x,y,z] (default [0,1.2,0])
   * @param {boolean} opts.mirrorX      flip X (webcam mirror) (default true)
   */
  constructor(device, format, cameraBuffer, splatLayer, opts = {}) {
    this.device = device;
    this.format = format;
    this.cameraBuffer = cameraBuffer;
    this.splatLayer = splatLayer;
    this.enabled = true;
    this.time = 0;

    this.scale = opts.scale ?? 3.0;
    // this.clusterRadius = opts.clusterRadius ?? 0.08;
    this.clusterRadius = opts.clusterRadius ?? 1.0;
    this.origin = opts.origin ?? [0, 1.2, 0];
    this.mirrorX = opts.mirrorX ?? true;

    // Live hand landmarks (set from PipeCommander.onResults)
    this._landmarks = null;

    const n = splatLayer.vertexCount;
    this._posCPU = new Float32Array(n * 3);
    this._colorCPU = new Float32Array(n * 4);

    // Baked per-point cluster assignment + spherical offsets

    this._jointRadius = new Float32Array([
      0.025,  // 0  WRIST       — wider, it's the palm anchor
      0.012,  // 1  THUMB_CMC
      0.010,  // 2  THUMB_MCP
      0.008,  // 3  THUMB_IP
      0.007,  // 4  THUMB_TIP   — tight fingertip
      0.012,  // 5  INDEX_MCP
      0.008,  // 6  INDEX_PIP
      0.007,  // 7  INDEX_DIP
      0.006,  // 8  INDEX_TIP
      0.012,  // 9  MIDDLE_MCP
      0.008,  // 10 MIDDLE_PIP
      0.007,  // 11 MIDDLE_DIP
      0.006,  // 12 MIDDLE_TIP
      0.010,  // 13 RING_MCP
      0.007,  // 14 RING_PIP
      0.006,  // 15 RING_DIP
      0.005,  // 16 RING_TIP
      0.010,  // 17 PINKY_MCP
      0.007,  // 18 PINKY_PIP
      0.006,  // 19 PINKY_DIP
      0.005,  // 20 PINKY_TIP
    ]);

    this._clusterIdx = new Uint8Array(n);
    this._offsetX = new Float32Array(n);
    this._offsetY = new Float32Array(n);
    this._offsetZ = new Float32Array(n);
    this._precompute(n);

    this._jointColors = [
      [1.0, 0.8, 0.2],  // 0  wrist        — gold
      [1.0, 0.5, 0.1],  // 1  thumb CMC
      [1.0, 0.4, 0.1],  // 2  thumb MCP
      [1.0, 0.3, 0.1],  // 3  thumb IP
      [1.0, 0.1, 0.1],  // 4  thumb tip    — red
      [0.4, 1.0, 0.3],  // 5  index MCP
      [0.3, 0.9, 0.3],  // 6  index PIP
      [0.2, 0.8, 0.2],  // 7  index DIP
      [0.1, 1.0, 0.1],  // 8  index tip    — bright green
      [0.3, 0.5, 1.0],  // 9  middle MCP
      [0.2, 0.4, 1.0],  // 10 middle PIP
      [0.2, 0.3, 0.9],  // 11 middle DIP
      [0.1, 0.2, 1.0],  // 12 middle tip   — blue
      [1.0, 0.3, 1.0],  // 13 ring MCP
      [0.9, 0.2, 0.9],  // 14 ring PIP
      [0.8, 0.2, 0.8],  // 15 ring DIP
      [1.0, 0.1, 1.0],  // 16 ring tip     — pink
      [0.2, 1.0, 1.0],  // 17 pinky MCP
      [0.2, 0.9, 0.9],  // 18 pinky PIP
      [0.1, 0.8, 0.8],  // 19 pinky DIP
      [0.0, 1.0, 1.0],  // 20 pinky tip    — cyan
    ];

    // Park all points at origin until hand data arrives
    this._posCPU.fill(0);
    device.queue.writeBuffer(splatLayer.positionAnimator.posBuffer, 0, this._posCPU);
  }

  // ── Cluster setup ──────────────────────────────────────────────────────────

  // _precompute(n) {
  //   // Weight distribution: fingertips heavier, wrist medium
  //   const weights = new Float32Array(21).fill(1.0);
  //   [4, 8, 12, 16, 20].forEach(i => weights[i] = 1.8); // fingertips
  //   weights[0] = 1.5;                                    // wrist

  //   let total = 0;
  //   for (let i = 0; i < 21; i++) total += weights[i];
  //   const cdf = new Float32Array(21);
  //   let run = 0;
  //   for (let i = 0; i < 21; i++) { run += weights[i] / total; cdf[i] = run; }
  //   cdf[20] = 1.0;

  //   for (let p = 0; p < n; p++) {
  //     const r = Math.random();
  //     let ci = 0;
  //     while (ci < 20 && cdf[ci] < r) ci++;
  //     this._clusterIdx[p] = ci;

  //     // Uniform random point inside unit sphere
  //     let ox, oy, oz;
  //     do {
  //       ox = (Math.random() - 0.5) * 2;
  //       oy = (Math.random() - 0.5) * 2;
  //       oz = (Math.random() - 0.5) * 2;
  //     } while (ox * ox + oy * oy + oz * oz > 1.0);
  //     this._offsetX[p] = ox;
  //     this._offsetY[p] = oy;
  //     this._offsetZ[p] = oz;
  //   }
  // }
  _precompute(n) {
    // Full 21-landmark weight map — every bone gets representation
    const weights = new Float32Array([
      2.0,  // 0  WRIST              — anchor, heaviest
      0.6,  // 1  THUMB_CMC
      0.6,  // 2  THUMB_MCP
      0.8,  // 3  THUMB_IP
      1.2,  // 4  THUMB_TIP
      0.8,  // 5  INDEX_MCP          — knuckle
      0.6,  // 6  INDEX_PIP
      0.6,  // 7  INDEX_DIP
      1.2,  // 8  INDEX_TIP
      0.8,  // 9  MIDDLE_MCP
      0.6,  // 10 MIDDLE_PIP
      0.6,  // 11 MIDDLE_DIP
      1.2,  // 12 MIDDLE_TIP
      0.7,  // 13 RING_MCP
      0.5,  // 14 RING_PIP
      0.5,  // 15 RING_DIP
      1.0,  // 16 RING_TIP
      0.7,  // 17 PINKY_MCP
      0.5,  // 18 PINKY_PIP
      0.5,  // 19 PINKY_DIP
      1.0,  // 20 PINKY_TIP
    ]);

    let total = 0;
    for(let i = 0;i < 21;i++) total += weights[i];
    const cdf = new Float32Array(21);
    let run = 0;
    for(let i = 0;i < 21;i++) {run += weights[i] / total; cdf[i] = run;}
    cdf[20] = 1.0;

    for(let p = 0;p < n;p++) {
      const r = Math.random();
      let ci = 0;
      while(ci < 20 && cdf[ci] < r) ci++;
      this._clusterIdx[p] = ci;

      // Uniform random point inside unit sphere
      let ox, oy, oz;
      do {
        ox = (Math.random() - 0.5) * 2;
        oy = (Math.random() - 0.5) * 2;
        oz = (Math.random() - 0.5) * 2;
      } while(ox * ox + oy * oy + oz * oz > 1.0);
      this._offsetX[p] = ox;
      this._offsetY[p] = oy;
      this._offsetZ[p] = oz;
    }
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  /**
   * Feed raw MediaPipe results directly.
   * Call from your PipeCommander.onResults() override.
   */
  setHandData(results) {
    if(!results?.landmarks?.length) {
      this._landmarks = null;
      return;
    }
    // Prefer worldLandmarks (metric 3D), fall back to normalized
    this._landmarks = results.worldLandmarks?.[0] ?? results.landmarks[0];
  }

  /**
   * Feed already-resolved hand from PipeGestureResolver.resolve()
   */
  setHandFromResolver(hands) {
    if(!hands?.length) {this._landmarks = null; return;}
    this._landmarks = hands[0].worldLandmarks;
  }

  setScale(s) {this.scale = s;}
  setClusterRadius(r) {this.clusterRadius = r;}
  setOrigin(x, y, z) {this.origin = [x, y, z];}

  // ── Effect interface (called automatically by main loop) ───────────────────

  updateInstanceData(baseModelMatrix) {
    if(!this.enabled) return;

    this.time += 0.016; // fallback dt — real dt comes from render()

    if(!this._landmarks) {
      // No hand detected — collapse to origin
      this._posCPU.fill(0);
      this.device.queue.writeBuffer(
        this.splatLayer.positionAnimator.posBuffer, 0, this._posCPU
      );
      return;
    }

    const lm = this._landmarks;
    const sc = this.scale;
    const cr = this.clusterRadius;
    const ox = this.origin[0];
    const oy = this.origin[1];
    const oz = this.origin[2];
    const mx = this.mirrorX ? -1 : 1;
    const n = this.splatLayer.vertexCount;
    const p = this._posCPU;

    // Gentle breathing so cloud feels alive even when hand is still
    const breathe = Math.sin(this.time * 2.5) * 0.015;

    for(let i = 0;i < n;i++) {
      const ci = this._clusterIdx[i];
      const joint = lm[ci];

      // MediaPipe world: x right, y down, z toward cam
      // Engine: x right, Y up, -Z forward
      const jx = joint.x * mx * sc + ox;
      const jy = -joint.y * sc + oy;
      const jz = -joint.z * sc + oz;

      // const r = this._jointRadius[ci] * sc + breathe;
      const r = this._jointRadius[ci] * sc * this.clusterRadius + breathe;
      p[i * 3] = jx + this._offsetX[i] * r;
      p[i * 3 + 1] = jy + this._offsetY[i] * r;
      p[i * 3 + 2] = jz + this._offsetZ[i] * r;
    }

    this.device.queue.writeBuffer(
      this.splatLayer.positionAnimator.posBuffer, 0, p
    );

    // Update colors
    this._updateColors();
  }

  render(pass, mesh, viewProjMatrix, dt = 0.016) {
    // SplatHandEffect drives the splatLayer's existing pipeline —
    // it does NOT have its own render pipeline.
    // The splatLayer renders itself via GaussianSplatScene.render().
    // This render() is a no-op hook required by the effect interface.
    this.time += dt;
  }

  _updateColors() {
    const c = this._colorCPU;
    const n = this.splatLayer.vertexCount;
    const pulse = Math.sin(this.time * 3.0) * 0.15 + 0.85;

    for(let i = 0;i < n;i++) {
      const ci = this._clusterIdx[i];
      const [r, g, b] = this._jointColors[ci];  // direct per-landmark color
      const isTip = (ci === 4 || ci === 8 || ci === 12 || ci === 16 || ci === 20);
      const bright = isTip ? pulse * 1.4 : pulse * 0.9;

      c[i * 4] = r * bright;
      c[i * 4 + 1] = g * bright;
      c[i * 4 + 2] = b * bright;
      c[i * 4 + 3] = 1.0;
    }

    this.device.queue.writeBuffer(this.splatLayer.colorBuffer, 0, c);
  }
}