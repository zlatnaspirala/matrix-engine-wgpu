import {
  FilesetResolver,
  PoseLandmarker,
  type PoseLandmarkerResult,
} from '@mediapipe/tasks-vision';
import type { Landmark3D } from '../types/mocap';

const POSE_MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/1/pose_landmarker_full.task';

const POSE_MODEL_LITE_URL =
  'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task';

export const POSE_CONNECTIONS: [number, number][] = [
  [11, 12],
  [11, 13],
  [13, 15],
  [12, 14],
  [14, 16],
  [11, 23],
  [12, 24],
  [23, 24],
  [23, 25],
  [25, 27],
  [27, 29],
  [29, 31],
  [27, 31],
  [24, 26],
  [26, 28],
  [28, 30],
  [30, 32],
  [28, 32],
  [15, 17],
  [15, 19],
  [17, 19],
  [16, 18],
  [16, 20],
  [18, 20],
  [0, 7],
  [0, 8],
];

export class MediaPipePoseService {
  private landmarker: PoseLandmarker | null = null;
  private initPromise: Promise<PoseLandmarker> | null = null;
  private lastTimestamp = -1;

  async ensureReady(): Promise<PoseLandmarker> {
    if (this.landmarker) return this.landmarker;
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      const wasmBases = [
        '/mediapipe/wasm',
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.2.3/wasm',
      ];
      const attempts: Array<{ model: string; delegate: 'GPU' | 'CPU' }> = [
        { model: POSE_MODEL_URL, delegate: 'GPU' },
        { model: POSE_MODEL_URL, delegate: 'CPU' },
        { model: POSE_MODEL_LITE_URL, delegate: 'CPU' },
      ];

      let lastErr: unknown = null;
      for (const wasmBase of wasmBases) {
        let vision;
        try {
          vision = await FilesetResolver.forVisionTasks(wasmBase);
        } catch (err) {
          lastErr = err;
          continue;
        }
        for (const attempt of attempts) {
          try {
            const lm = await PoseLandmarker.createFromOptions(vision, {
              baseOptions: {
                modelAssetPath: attempt.model,
                delegate: attempt.delegate,
              },
              runningMode: 'VIDEO',
              numPoses: 1,
              minPoseDetectionConfidence: 0.45,
              minPosePresenceConfidence: 0.45,
              minTrackingConfidence: 0.45,
            });
            this.landmarker = lm;
            return lm;
          } catch (err) {
            lastErr = err;
          }
        }
      }
      this.initPromise = null;
      throw lastErr instanceof Error
        ? lastErr
        : new Error('Failed to initialize MediaPipe PoseLandmarker');
    })();

    return this.initPromise;
  }

  detectForVideo(
    video: HTMLVideoElement,
    timestampMs: number,
  ): PoseLandmarkerResult | null {
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

export function drawPose2DOverlay(
  ctx: CanvasRenderingContext2D,
  landmarks: Landmark3D[],
  width: number,
  height: number,
  mirrorX: boolean,
): void {
  if (!landmarks || landmarks.length < 33) return;

  const px = (i: number) =>
    (mirrorX ? 1 - landmarks[i].x : landmarks[i].x) * width;
  const py = (i: number) => landmarks[i].y * height;

  ctx.save();
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.strokeStyle = 'rgba(245, 158, 11, 0.85)';

  for (const [a, b] of POSE_CONNECTIONS) {
    const visA = landmarks[a]?.visibility ?? 1;
    const visB = landmarks[b]?.visibility ?? 1;
    if (visA < 0.25 || visB < 0.25) continue;
    ctx.beginPath();
    ctx.moveTo(px(a), py(a));
    ctx.lineTo(px(b), py(b));
    ctx.stroke();
  }

  for (let i = 0; i < 33; i++) {
    const vis = landmarks[i]?.visibility ?? 1;
    if (vis < 0.25) continue;
    ctx.beginPath();
    ctx.arc(px(i), py(i), i === 0 ? 3.5 : 2.6, 0, Math.PI * 2);
    ctx.fillStyle = i <= 10 ? '#FBBF24' : '#F8FAFC';
    ctx.fill();
  }
  ctx.restore();
}
