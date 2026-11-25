export interface Landmark3D {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

export const MIXAMO_BONES = [
  'Hips',
  'Spine',
  'Spine1',
  'Spine2',
  'Neck',
  'Head',
  'LeftShoulder',
  'LeftArm',
  'LeftForeArm',
  'LeftHand',
  'RightShoulder',
  'RightArm',
  'RightForeArm',
  'RightHand',
  'LeftUpLeg',
  'LeftLeg',
  'LeftFoot',
  'LeftToeBase',
  'RightUpLeg',
  'RightLeg',
  'RightFoot',
  'RightToeBase',
] as const;

export type MixamoBoneName = (typeof MIXAMO_BONES)[number];

export const FACIAL_BLENDSHAPES = [
  'jawOpen',
  'mouthSmileLeft',
  'mouthSmileRight',
  'mouthPucker',
  'mouthFunnel',
  'mouthFrownLeft',
  'mouthFrownRight',
  'eyeBlinkLeft',
  'eyeBlinkRight',
  'eyeWideLeft',
  'eyeWideRight',
  'eyeLookInLeft',
  'eyeLookOutLeft',
  'eyeLookInRight',
  'eyeLookOutRight',
  'eyeLookUpLeft',
  'eyeLookDownLeft',
  'eyeLookUpRight',
  'eyeLookDownRight',
  'browInnerUp',
  'browOuterUpLeft',
  'browOuterUpRight',
  'browDownLeft',
  'browDownRight',
  'cheekPuff',
] as const;

export type FacialBlendshapeName = (typeof FACIAL_BLENDSHAPES)[number];

export type FacialBlendshapeMap = Partial<Record<FacialBlendshapeName, number>>;

export type BoneNamingScheme = 'mixamo-colon' | 'mixamo-clean' | 'bvh-standard';

export interface PoseFrame {
  time: number;
  hipsPosition: [number, number, number];
  rotations: Record<MixamoBoneName, [number, number, number, number]>;
  faceBlendshapes?: FacialBlendshapeMap;
}

export type MotionSourceMode = 'lab' | 'live' | 'face' | 'video' | 'bvh';

export type DemoMotionId = 'walk' | 'wave' | 'kick' | 'squat' | 'tpose';

export interface RetargetSettings {
  smoothing: number; // 0 (raw) to 0.95 (heavy smoothing)
  rootMotion: boolean;
  footGrounding: boolean;
  mirrorCamera: boolean;
  fps: 24 | 30 | 60;
  namingScheme: BoneNamingScheme;
  includeMeshInGlb: boolean;
  showSkeleton: boolean;
}

export interface RecordOptions {
  startDelaySec: number; // 0 = immediate, 3/5/10s countdown before recording starts
  durationLimitSec: number; // 0 = manual stop, >0 = auto-stop after X seconds
  frameSkip: number; // 1 = keep every frame, 2 = keep every 2nd frame, etc.
}

export interface AnimationTakeClip {
  id: string;
  name: string;
  frames: PoseFrame[];
  fps: 24 | 30 | 60;
  included: boolean;
}

export function formatMixamoBoneName(
  bone: MixamoBoneName,
  scheme: BoneNamingScheme,
): string {
  if (scheme === 'mixamo-colon') return `mixamorig:${bone}`;
  if (scheme === 'mixamo-clean') return `mixamorig${bone}`;
  return bone;
}
