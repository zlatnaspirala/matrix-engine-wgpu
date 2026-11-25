import * as THREE from 'three';
import {
  FACIAL_BLENDSHAPES,
  MIXAMO_BONES,
  type FacialBlendshapeMap,
  type Landmark3D,
  type PoseFrame,
} from '../types/mocap';

class LowPassFilter {
  private y = 0;
  private s = 0;
  private initialized = false;

  filter(value: number, alpha: number): number {
    if (!this.initialized) {
      this.y = value;
      this.s = value;
      this.initialized = true;
      return value;
    }
    this.s = alpha * value + (1 - alpha) * this.s;
    this.y = value;
    return this.s;
  }

  lastValue(): number {
    return this.y;
  }

  hasLastValue(): boolean {
    return this.initialized;
  }

  reset(): void {
    this.initialized = false;
  }
}

class OneEuroScalar {
  private xFilter = new LowPassFilter();
  private dxFilter = new LowPassFilter();
  private lastTime = -1;

  private alpha(cutoff: number, dt: number): number {
    const te = 1 / (2 * Math.PI * cutoff);
    return 1 / (1 + te / Math.max(dt, 1e-4));
  }

  filter(
    value: number,
    timestampSec: number,
    minCutoff: number,
    beta: number,
    dCutoff = 1.0,
  ): number {
    if (this.lastTime < 0) {
      this.lastTime = timestampSec;
      return this.xFilter.filter(value, 1);
    }
    const dt = Math.max(timestampSec - this.lastTime, 1e-4);
    this.lastTime = timestampSec;

    const dValue = this.xFilter.hasLastValue()
      ? (value - this.xFilter.lastValue()) / dt
      : 0;
    const edValue = this.dxFilter.filter(dValue, this.alpha(dCutoff, dt));
    const cutoff = minCutoff + beta * Math.abs(edValue);
    return this.xFilter.filter(value, this.alpha(cutoff, dt));
  }

  reset(): void {
    this.xFilter.reset();
    this.dxFilter.reset();
    this.lastTime = -1;
  }
}

export class PoseLandmarkFilter {
  private filters: { x: OneEuroScalar; y: OneEuroScalar; z: OneEuroScalar }[] = [];

  constructor(count = 33) {
    for (let i = 0; i < count; i++) {
      this.filters.push({
        x: new OneEuroScalar(),
        y: new OneEuroScalar(),
        z: new OneEuroScalar(),
      });
    }
  }

  filter(
    landmarks: Landmark3D[],
    timestampSec: number,
    smoothing: number,
  ): Landmark3D[] {
    if (smoothing <= 0.01) {
      return landmarks;
    }
    const minCutoff = 4.5 - smoothing * 3.8; // 4.5 down to 0.7 Hz
    const beta = 0.35 - smoothing * 0.28;

    return landmarks.map((lm, i) => {
      const f = this.filters[i];
      if (!f) return lm;
      return {
        x: f.x.filter(lm.x, timestampSec, minCutoff, beta),
        y: f.y.filter(lm.y, timestampSec, minCutoff, beta),
        z: f.z.filter(lm.z, timestampSec, minCutoff, beta),
        visibility: lm.visibility,
      };
    });
  }

  reset(): void {
    for (const f of this.filters) {
      f.x.reset();
      f.y.reset();
      f.z.reset();
    }
  }
}

export class FaceBlendshapeFilter {
  private scalars = new Map<string, OneEuroScalar>();

  filter(
    shapes: FacialBlendshapeMap,
    timestampSec: number,
    smoothing: number,
  ): FacialBlendshapeMap {
    if (smoothing <= 0.01) return shapes;
    // Keep blinks crisp while smoothing subtle jaw/cheek/brow micro-jitter
    const minCutoff = 6.0 - smoothing * 4.5;
    const beta = 0.55 - smoothing * 0.35;
    const out: FacialBlendshapeMap = {};
    for (const key of FACIAL_BLENDSHAPES) {
      const val = shapes[key];
      if (val === undefined) continue;
      let sc = this.scalars.get(key);
      if (!sc) {
        sc = new OneEuroScalar();
        this.scalars.set(key, sc);
      }
      out[key] = THREE.MathUtils.clamp(
        sc.filter(val, timestampSec, minCutoff, beta),
        0,
        1,
      );
    }
    return out;
  }

  reset(): void {
    this.scalars.forEach((s) => s.reset());
  }
}

/**
 * Zero-phase bidirectional spherical SLERP & Gaussian smoothing pass
 * over a recorded PoseFrame sequence. Eliminates jitter without phase lag.
 */
export function smoothRecordedPoseFrames(
  frames: PoseFrame[],
  radius = 2,
): PoseFrame[] {
  if (frames.length < 3) return frames;

  const qCenter = new THREE.Quaternion();
  const qSample = new THREE.Quaternion();
  const weights: number[] = [];
  const sigma = Math.max(radius * 0.75, 0.8);
  let wTotal = 0;
  for (let k = -radius; k <= radius; k++) {
    const w = Math.exp(-(k * k) / (2 * sigma * sigma));
    weights.push(w);
    wTotal += w;
  }
  const normWeights = weights.map((w) => w / wTotal);

  return frames.map((frame, i) => {
    let hx = 0;
    let hy = 0;
    let hz = 0;

    for (let k = -radius; k <= radius; k++) {
      const idx = THREE.MathUtils.clamp(i + k, 0, frames.length - 1);
      const w = normWeights[k + radius];
      hx += frames[idx].hipsPosition[0] * w;
      hy += frames[idx].hipsPosition[1] * w;
      hz += frames[idx].hipsPosition[2] * w;
    }

    const rotations = {} as PoseFrame['rotations'];
    for (const bone of MIXAMO_BONES) {
      // Iterative weighted quaternion average (Markley-style hemisphere-aligned blend)
      const refQ = frame.rotations[bone];
      qCenter.set(refQ[0], refQ[1], refQ[2], refQ[3]).normalize();
      let ax = 0;
      let ay = 0;
      let az = 0;
      let aw = 0;
      for (let k = -radius; k <= radius; k++) {
        const idx = THREE.MathUtils.clamp(i + k, 0, frames.length - 1);
        const w = normWeights[k + radius];
        const sq = frames[idx].rotations[bone];
        qSample.set(sq[0], sq[1], sq[2], sq[3]);
        if (qCenter.dot(qSample) < 0) {
          qSample.set(-sq[0], -sq[1], -sq[2], -sq[3]);
        }
        ax += qSample.x * w;
        ay += qSample.y * w;
        az += qSample.z * w;
        aw += qSample.w * w;
      }
      qSample.set(ax, ay, az, aw).normalize();
      rotations[bone] = [qSample.x, qSample.y, qSample.z, qSample.w];
    }

    let faceBlendshapes: FacialBlendshapeMap | undefined;
    if (frame.faceBlendshapes) {
      faceBlendshapes = {};
      for (const key of FACIAL_BLENDSHAPES) {
        let sum = 0;
        let hasAny = false;
        for (let k = -radius; k <= radius; k++) {
          const idx = THREE.MathUtils.clamp(i + k, 0, frames.length - 1);
          const v = frames[idx].faceBlendshapes?.[key];
          if (v !== undefined) {
            hasAny = true;
            sum += v * normWeights[k + radius];
          }
        }
        if (hasAny) {
          faceBlendshapes[key] = THREE.MathUtils.clamp(sum, 0, 1);
        }
      }
    }

    return {
      time: frame.time,
      hipsPosition: [hx, hy, hz],
      rotations,
      ...(faceBlendshapes ? { faceBlendshapes } : {}),
    };
  });
}
