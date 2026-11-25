import * as THREE from 'three';
import {
  FaceLandmarker,
  FilesetResolver,
  type FaceLandmarkerResult,
} from '@mediapipe/tasks-vision';
import {
  FACIAL_BLENDSHAPES,
  type FacialBlendshapeMap,
  type FacialBlendshapeName,
  type Landmark3D,
} from '../types/mocap';

const FACE_MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';

const BLENDSHAPE_SET = new Set<string>(FACIAL_BLENDSHAPES);

function swapLeftRightName(name: string): string {
  if (name.endsWith('Left')) return name.slice(0, -4) + 'Right';
  if (name.endsWith('Right')) return name.slice(0, -5) + 'Left';
  return name;
}

export class MediaPipeFaceService {
  private landmarker: FaceLandmarker | null = null;
  private initPromise: Promise<FaceLandmarker> | null = null;
  private lastTimestamp = -1;

  async ensureReady(): Promise<FaceLandmarker> {
    if (this.landmarker) return this.landmarker;
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      const wasmBases = [
        '/mediapipe/wasm',
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.2.3/wasm',
      ];
      const delegates: Array<'GPU' | 'CPU'> = ['GPU', 'CPU'];

      let lastErr: unknown = null;
      for (const wasmBase of wasmBases) {
        let vision;
        try {
          vision = await FilesetResolver.forVisionTasks(wasmBase);
        } catch (err) {
          lastErr = err;
          continue;
        }
        for (const delegate of delegates) {
          try {
            const fm = await FaceLandmarker.createFromOptions(vision, {
              baseOptions: {
                modelAssetPath: FACE_MODEL_URL,
                delegate,
              },
              runningMode: 'VIDEO',
              numFaces: 1,
              minFaceDetectionConfidence: 0.45,
              minFacePresenceConfidence: 0.45,
              minTrackingConfidence: 0.45,
              outputFaceBlendshapes: true,
              outputFacialTransformationMatrixes: true,
            });
            this.landmarker = fm;
            return fm;
          } catch (err) {
            lastErr = err;
          }
        }
      }
      this.initPromise = null;
      throw lastErr instanceof Error
        ? lastErr
        : new Error('Failed to initialize MediaPipe FaceLandmarker');
    })();

    return this.initPromise;
  }

  detectForVideo(
    video: HTMLVideoElement,
    timestampMs: number,
  ): FaceLandmarkerResult | null {
    if (
      !this.landmarker ||
      video.readyState < 2 ||
      video.videoWidth === 0 ||
      video.videoHeight === 0
    ) {
      return null;
    }
    const ts = Math.floor(timestampMs);
    const safeTs = ts <= this.lastTimestamp ? this.lastTimestamp + 1 : ts;
    this.lastTimestamp = safeTs;
    try {
      return this.landmarker.detectForVideo(video, safeTs);
    } catch {
      return null;
    }
  }

  resetTimestamps(): void {
    this.lastTimestamp = -1;
  }

  dispose(): void {
    this.landmarker?.close();
    this.landmarker = null;
    this.initPromise = null;
  }
}

const _m4 = new THREE.Matrix4();

export function extractFaceRigOutput(
  result: FaceLandmarkerResult,
  mirrorX: boolean,
): { headQuat: THREE.Quaternion; blendshapes: FacialBlendshapeMap } | null {
  if (!result.faceLandmarks || result.faceLandmarks.length === 0) {
    return null;
  }

  const headQuat = new THREE.Quaternion();
  const mat = result.facialTransformationMatrixes?.[0];
  if (mat && mat.data && mat.data.length === 16) {
    _m4.fromArray(mat.data);
    headQuat.setFromRotationMatrix(_m4).normalize();
    if (mirrorX) {
      // Mirror across X axis flips yaw (y) and roll (z) while keeping pitch (x)
      headQuat.set(headQuat.x, -headQuat.y, -headQuat.z, headQuat.w);
    }
  }

  const blendshapes: FacialBlendshapeMap = {};
  const cats = result.faceBlendshapes?.[0]?.categories;
  if (cats) {
    for (const c of cats) {
      const targetName = mirrorX
        ? swapLeftRightName(c.categoryName)
        : c.categoryName;
      if (BLENDSHAPE_SET.has(targetName)) {
        // Boost subtle facial expressions slightly for crisp readability on stylized rig
        const key = targetName as FacialBlendshapeName;
        let score = c.score;
        if (key.startsWith('eyeBlink')) {
          score = THREE.MathUtils.clamp((score - 0.12) / 0.55, 0, 1);
        } else if (key === 'jawOpen') {
          // Deadzone against rest jitter (> 0.14) while allowing full intentional mouth opening
          score = THREE.MathUtils.clamp((score - 0.14) / 0.62, 0, 0.62);
        } else if (key === 'mouthFunnel') {
          score = THREE.MathUtils.clamp((score - 0.16) / 0.65, 0, 0.62);
        }
        blendshapes[key] = THREE.MathUtils.clamp(score, 0, 1);
      }
    }
  }

  return { headQuat, blendshapes };
}

export function drawFace2DOverlay(
  ctx: CanvasRenderingContext2D,
  landmarks: Landmark3D[],
  width: number,
  height: number,
  mirrorX: boolean,
): void {
  if (!landmarks || landmarks.length < 468) return;

  const px = (i: number) =>
    (mirrorX ? 1 - landmarks[i].x : landmarks[i].x) * width;
  const py = (i: number) => landmarks[i].y * height;

  const drawConnections = (
    conns: Array<{ start: number; end: number }>,
    color: string,
    lineWidth: number,
  ) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    for (const { start, end } of conns) {
      if (!landmarks[start] || !landmarks[end]) continue;
      ctx.moveTo(px(start), py(start));
      ctx.lineTo(px(end), py(end));
    }
    ctx.stroke();
  };

  ctx.save();
  ctx.lineCap = 'round';
  drawConnections(
    FaceLandmarker.FACE_LANDMARKS_FACE_OVAL,
    'rgba(148, 163, 184, 0.45)',
    1.2,
  );
  drawConnections(
    FaceLandmarker.FACE_LANDMARKS_LEFT_EYEBROW,
    'rgba(245, 158, 11, 0.85)',
    1.5,
  );
  drawConnections(
    FaceLandmarker.FACE_LANDMARKS_RIGHT_EYEBROW,
    'rgba(245, 158, 11, 0.85)',
    1.5,
  );
  drawConnections(
    FaceLandmarker.FACE_LANDMARKS_LEFT_EYE,
    'rgba(251, 191, 36, 0.9)',
    1.4,
  );
  drawConnections(
    FaceLandmarker.FACE_LANDMARKS_RIGHT_EYE,
    'rgba(251, 191, 36, 0.9)',
    1.4,
  );
  drawConnections(
    FaceLandmarker.FACE_LANDMARKS_LIPS,
    'rgba(248, 250, 252, 0.85)',
    1.5,
  );
  ctx.restore();
}

export function generateSyntheticFaceDemo(t: number): {
  headQuat: THREE.Quaternion;
  blendshapes: FacialBlendshapeMap;
} {
  const yaw = Math.sin(t * 0.9) * 0.24;
  const pitch = Math.sin(t * 1.4) * 0.11;
  const roll = Math.cos(t * 0.7) * 0.08;
  const headQuat = new THREE.Quaternion().setFromEuler(
    new THREE.Euler(pitch, yaw, roll, 'YXZ'),
  );

  // Natural periodic blink every ~3.2s
  const blinkPhase = (t % 3.2) / 3.2;
  const blink =
    blinkPhase > 0.92
      ? Math.sin(((blinkPhase - 0.92) / 0.08) * Math.PI)
      : 0;

  // Speech & expression cadence (mostly closed resting mouth, gentle limited opening)
  const rawTalk = Math.sin(t * 2.6) * 0.6 + Math.sin(t * 1.3) * 0.4;
  const talk = rawTalk > 0.55 ? ((rawTalk - 0.55) / 0.45) * 0.42 : 0;
  const smile = Math.max(0, Math.sin(t * 0.85) * 0.72);
  const brow = Math.max(0, Math.sin(t * 1.3 - 0.5) * 0.65);
  const gaze = Math.sin(t * 1.1);

  return {
    headQuat,
    blendshapes: {
      jawOpen: THREE.MathUtils.clamp(talk, 0, 0.42),
      mouthSmileLeft: smile,
      mouthSmileRight: smile,
      eyeBlinkLeft: blink,
      eyeBlinkRight: blink,
      browInnerUp: brow * 0.8,
      browOuterUpLeft: brow * 0.65,
      browOuterUpRight: brow * 0.65,
      eyeLookInLeft: Math.max(0, gaze * 0.55),
      eyeLookOutRight: Math.max(0, gaze * 0.55),
      eyeLookOutLeft: Math.max(0, -gaze * 0.55),
      eyeLookInRight: Math.max(0, -gaze * 0.55),
    },
  };
}
