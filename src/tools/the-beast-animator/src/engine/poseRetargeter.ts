import * as THREE from 'three';
import {
  FACIAL_BLENDSHAPES,
  MIXAMO_BONES,
  type FacialBlendshapeMap,
  type Landmark3D,
  type MixamoBoneName,
  type PoseFrame,
} from '../types/mocap';
import type { ActiveMixamoRig } from './mixamoSkeleton';

// MediaPipe Pose 33 Landmark indices
const LM = {
  NOSE: 0,
  LEFT_EYE: 2,
  RIGHT_EYE: 5,
  LEFT_EAR: 7,
  RIGHT_EAR: 8,
  MOUTH_LEFT: 9,
  MOUTH_RIGHT: 10,
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_PINKY: 17,
  RIGHT_PINKY: 18,
  LEFT_INDEX: 19,
  RIGHT_INDEX: 20,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
  LEFT_HEEL: 29,
  RIGHT_HEEL: 30,
  LEFT_FOOT_INDEX: 31,
  RIGHT_FOOT_INDEX: 32,
} as const;

const MIRROR_POSE_PAIRS: ReadonlyArray<[number, number]> = [
  [1, 4],
  [2, 5],
  [3, 6],
  [7, 8],
  [9, 10],
  [11, 12],
  [13, 14],
  [15, 16],
  [17, 18],
  [19, 20],
  [21, 22],
  [23, 24],
  [25, 26],
  [27, 28],
  [29, 30],
  [31, 32],
];

// Reusable scratch math objects (zero per-frame allocations)
const _vA = new THREE.Vector3();
const _vB = new THREE.Vector3();
const _vC = new THREE.Vector3();
const _xAxis = new THREE.Vector3();
const _yAxis = new THREE.Vector3();
const _zAxis = new THREE.Vector3();
const _mat4 = new THREE.Matrix4();
const _qSwing = new THREE.Quaternion();
const _qBlend = new THREE.Quaternion();
const _qParentInv = new THREE.Quaternion();
const _qTargetWorld = new THREE.Quaternion();

function toThreeVec(
  lm: Landmark3D,
  mirrorX: boolean,
  out: THREE.Vector3,
): THREE.Vector3 {
  // MediaPipe worldLandmarks: +X image-right, +Y down, +Z away from camera
  // Mixamo T-Pose in Three.js: +X subject-left, +Y up, +Z subject-forward (towards camera)
  const sx = mirrorX ? -lm.x : lm.x;
  return out.set(sx, -lm.y, -lm.z);
}

function safeNormalize(v: THREE.Vector3, fallback: THREE.Vector3): THREE.Vector3 {
  const len = v.length();
  if (len < 1e-5) {
    return v.copy(fallback);
  }
  return v.divideScalar(len);
}

function basisToQuat(
  x: THREE.Vector3,
  y: THREE.Vector3,
  z: THREE.Vector3,
  out: THREE.Quaternion,
): THREE.Quaternion {
  _mat4.makeBasis(x, y, z);
  return out.setFromRotationMatrix(_mat4);
}

export interface RetargetOptions {
  mirrorX: boolean;
  rootMotion: boolean;
  footGrounding: boolean;
}

/**
 * Computes canonical world quaternions (relative to Mixamo T-Pose) for all 22 Mixamo bones,
 * then maps them cleanly onto any ActiveMixamoRig (built-in or custom uploaded GLB).
 */
export function retargetLandmarksToPoseFrame(
  worldLandmarks: Landmark3D[],
  rig: ActiveMixamoRig,
  timeSec: number,
  options: RetargetOptions,
): PoseFrame | null {
  if (!worldLandmarks || worldLandmarks.length < 33) return null;

  const pts: THREE.Vector3[] = new Array(33);
  for (let i = 0; i < 33; i++) {
    pts[i] = toThreeVec(worldLandmarks[i], options.mirrorX, new THREE.Vector3());
  }
  if (options.mirrorX) {
    // Mirroring across X turns anatomical Left into anatomical Right on the mirrored avatar
    for (const [lIdx, rIdx] of MIRROR_POSE_PAIRS) {
      const tmp = pts[lIdx];
      pts[lIdx] = pts[rIdx];
      pts[rIdx] = tmp;
    }
  }

  const lHip = pts[LM.LEFT_HIP];
  const rHip = pts[LM.RIGHT_HIP];
  const lShoulder = pts[LM.LEFT_SHOULDER];
  const rShoulder = pts[LM.RIGHT_SHOULDER];

  const hipCenter = new THREE.Vector3().addVectors(lHip, rHip).multiplyScalar(0.5);
  const shoulderCenter = new THREE.Vector3()
    .addVectors(lShoulder, rShoulder)
    .multiplyScalar(0.5);

  const canonicalWorld: Record<MixamoBoneName, THREE.Quaternion> = {} as Record<
    MixamoBoneName,
    THREE.Quaternion
  >;
  for (const name of MIXAMO_BONES) {
    canonicalWorld[name] = new THREE.Quaternion();
  }

  // 1. HIPS WORLD ORIENTATION
  const hipLeftDir = _vA.subVectors(lHip, rHip);
  safeNormalize(hipLeftDir, _vB.set(1, 0, 0));
  const spineDir = _vC.subVectors(shoulderCenter, hipCenter);
  safeNormalize(spineDir, _vB.set(0, 1, 0));

  _xAxis.copy(hipLeftDir);
  _zAxis.crossVectors(_xAxis, spineDir);
  safeNormalize(_zAxis, _vB.set(0, 0, 1));
  _yAxis.crossVectors(_zAxis, _xAxis).normalize();
  _zAxis.crossVectors(_xAxis, _yAxis).normalize();

  const qHips = basisToQuat(_xAxis, _yAxis, _zAxis, new THREE.Quaternion());
  canonicalWorld.Hips.copy(qHips);

  // 2. CHEST & SPINE CHAIN
  const shLeftDir = _vA.subVectors(lShoulder, rShoulder);
  safeNormalize(shLeftDir, _xAxis);

  _zAxis.crossVectors(shLeftDir, spineDir);
  safeNormalize(_zAxis, _vB.set(0, 0, 1));
  _yAxis.crossVectors(_zAxis, shLeftDir).normalize();
  _xAxis.crossVectors(_yAxis, _zAxis).normalize();

  const qChest = basisToQuat(_xAxis, _yAxis, _zAxis, new THREE.Quaternion());
  canonicalWorld.Spine.copy(qHips).slerp(qChest, 0.33);
  canonicalWorld.Spine1.copy(qHips).slerp(qChest, 0.66);
  canonicalWorld.Spine2.copy(qChest);

  // 3. NECK & HEAD (stabilized with eyes/mouth/ears + chest-relative anatomical clamp)
  const chestRightAxis = new THREE.Vector3(1, 0, 0).applyQuaternion(qChest);
  const chestUpAxis = new THREE.Vector3(0, 1, 0).applyQuaternion(qChest);
  const chestFwdAxis = new THREE.Vector3(0, 0, 1).applyQuaternion(qChest);

  const lEar = pts[LM.LEFT_EAR];
  const rEar = pts[LM.RIGHT_EAR];
  const lEye = pts[LM.LEFT_EYE];
  const rEye = pts[LM.RIGHT_EYE];
  const nose = pts[LM.NOSE];
  const earMid = new THREE.Vector3().addVectors(lEar, rEar).multiplyScalar(0.5);
  const eyeMid = new THREE.Vector3().addVectors(lEye, rEye).multiplyScalar(0.5);
  const mouthMid = new THREE.Vector3()
    .addVectors(pts[LM.MOUTH_LEFT], pts[LM.MOUTH_RIGHT])
    .multiplyScalar(0.5);

  const earSpanVec = new THREE.Vector3().subVectors(lEar, rEar);
  const eyeSpanVec = new THREE.Vector3().subVectors(lEye, rEye);
  const headLeft = new THREE.Vector3();
  if (earSpanVec.lengthSq() > 1e-4) {
    headLeft.addScaledVector(earSpanVec.normalize(), 0.65);
  }
  if (eyeSpanVec.lengthSq() > 1e-4) {
    headLeft.addScaledVector(eyeSpanVec.normalize(), 0.35);
  }
  safeNormalize(headLeft, chestRightAxis);
  // Prevent inverted 180-deg ear flip relative to torso right axis
  if (headLeft.dot(chestRightAxis) < -0.25) {
    headLeft.negate();
  }

  // Face forward vector with slight vertical correction (tragus/ear sits ~1.5cm above nose tip)
  const headFwd = new THREE.Vector3().subVectors(nose, earMid);
  headFwd.y += 0.015;
  if (headFwd.lengthSq() < 1e-5) {
    headFwd.copy(chestFwdAxis);
  } else {
    headFwd.normalize();
  }
  if (headFwd.dot(chestFwdAxis) < -0.3) {
    headFwd.copy(chestFwdAxis);
  }

  const faceUp = new THREE.Vector3().subVectors(eyeMid, mouthMid);
  const upFromFwd = new THREE.Vector3().crossVectors(headFwd, headLeft);
  const headUp = new THREE.Vector3();
  if (faceUp.lengthSq() > 1e-5) {
    faceUp.normalize();
    if (faceUp.dot(chestUpAxis) < 0) faceUp.negate();
    headUp.addScaledVector(faceUp, 0.6);
  }
  if (upFromFwd.lengthSq() > 1e-5) {
    upFromFwd.normalize();
    if (upFromFwd.dot(chestUpAxis) < 0) upFromFwd.negate();
    headUp.addScaledVector(upFromFwd, 0.4);
  }
  safeNormalize(headUp, chestUpAxis);

  _xAxis.copy(headLeft);
  _zAxis.crossVectors(_xAxis, headUp);
  safeNormalize(_zAxis, chestFwdAxis);
  _yAxis.crossVectors(_zAxis, _xAxis).normalize();
  _xAxis.crossVectors(_yAxis, _zAxis).normalize();

  const qHeadRaw = basisToQuat(_xAxis, _yAxis, _zAxis, new THREE.Quaternion());
  // Clamp relative head Euler angles vs chest so webcam depth noise cannot fold head into torso
  const qRelHead = qChest.clone().invert().multiply(qHeadRaw).normalize();
  const relEuler = new THREE.Euler().setFromQuaternion(qRelHead, 'YXZ');
  relEuler.x = THREE.MathUtils.clamp(relEuler.x, -0.70, 0.60);
  relEuler.y = THREE.MathUtils.clamp(relEuler.y, -1.25, 1.25);
  relEuler.z = THREE.MathUtils.clamp(relEuler.z, -0.55, 0.55);
  qRelHead.setFromEuler(relEuler);
  const qHead = qChest.clone().multiply(qRelHead).normalize();

  canonicalWorld.Neck.copy(qChest).slerp(qHead, 0.45);
  canonicalWorld.Head.copy(qHead);

  // 4. ARMS (Left & Right)
  const solveArm = (
    side: 'Left' | 'Right',
    shIdx: number,
    elIdx: number,
    wrIdx: number,
    idxIdx: number,
    pnkIdx: number,
  ) => {
    const restDir = new THREE.Vector3(side === 'Left' ? 1 : -1, 0, 0);
    const sh = pts[shIdx];
    const el = pts[elIdx];
    const wr = pts[wrIdx];

    const uDir = new THREE.Vector3().subVectors(el, sh);
    safeNormalize(uDir, restDir);
    const lDir = new THREE.Vector3().subVectors(wr, el);
    safeNormalize(lDir, uDir);

    // Shoulder gets subtle 20% follow of upper arm elevation
    const shName = `${side}Shoulder` as MixamoBoneName;
    const armName = `${side}Arm` as MixamoBoneName;
    const foreName = `${side}ForeArm` as MixamoBoneName;
    const handName = `${side}Hand` as MixamoBoneName;

    _qSwing.setFromUnitVectors(restDir, uDir);
    // Align upper arm basis with chest orientation for natural rest twist
    const qArmPure = _qSwing.clone().multiply(qChest);
    // Re-orient restDir in chest space
    const chestRestDir = restDir.clone().applyQuaternion(qChest);
    const qArmFromChest = new THREE.Quaternion()
      .setFromUnitVectors(chestRestDir, uDir)
      .multiply(qChest);
    void qArmPure;

    canonicalWorld[shName].copy(qChest).slerp(qArmFromChest, 0.18);

    // Compute elbow bend plane twist if elbow is bent enough
    const bendCross = new THREE.Vector3().crossVectors(uDir, lDir);
    const bendSin = bendCross.length();

    if (bendSin > 0.18) {
      bendCross.divideScalar(bendSin);
      // In Mixamo T-Pose, flexing elbow forward (+Z) yields u x l = (0, -1, 0) for Left, (0, +1, 0) for Right
      if (side === 'Left') {
        _xAxis.copy(uDir);
        _yAxis.copy(bendCross).negate();
        _zAxis.crossVectors(_xAxis, _yAxis).normalize();
        _yAxis.crossVectors(_zAxis, _xAxis).normalize();
      } else {
        _xAxis.copy(uDir).negate();
        _yAxis.copy(bendCross);
        _zAxis.crossVectors(_xAxis, _yAxis).normalize();
        _yAxis.crossVectors(_zAxis, _xAxis).normalize();
      }
      const qArmPlane = basisToQuat(_xAxis, _yAxis, _zAxis, new THREE.Quaternion());
      const blendFactor = THREE.MathUtils.clamp((bendSin - 0.18) / 0.35, 0, 0.85);
      _qBlend.copy(qArmFromChest).slerp(qArmPlane, blendFactor);
      canonicalWorld[armName].copy(_qBlend);
    } else {
      canonicalWorld[armName].copy(qArmFromChest);
    }

    // Forearm: hinge from upper arm direction to forearm direction
    const qForeSwing = new THREE.Quaternion().setFromUnitVectors(uDir, lDir);
    canonicalWorld[foreName].copy(qForeSwing).multiply(canonicalWorld[armName]);

    // Hand orientation from wrist -> midpoint(index, pinky)
    const handMid = new THREE.Vector3()
      .addVectors(pts[idxIdx], pts[pnkIdx])
      .multiplyScalar(0.5);
    const handDir = new THREE.Vector3().subVectors(handMid, wr);
    if (handDir.lengthSq() > 1e-4) {
      handDir.normalize();
      const qHandSwing = new THREE.Quaternion().setFromUnitVectors(lDir, handDir);
      canonicalWorld[handName].copy(qHandSwing).multiply(canonicalWorld[foreName]);
    } else {
      canonicalWorld[handName].copy(canonicalWorld[foreName]);
    }
  };

  solveArm(
    'Left',
    LM.LEFT_SHOULDER,
    LM.LEFT_ELBOW,
    LM.LEFT_WRIST,
    LM.LEFT_INDEX,
    LM.LEFT_PINKY,
  );
  solveArm(
    'Right',
    LM.RIGHT_SHOULDER,
    LM.RIGHT_ELBOW,
    LM.RIGHT_WRIST,
    LM.RIGHT_INDEX,
    LM.RIGHT_PINKY,
  );

  // 5. LEGS (Left & Right)
  const hipsRightAxis = new THREE.Vector3(1, 0, 0).applyQuaternion(qHips);

  const solveLeg = (
    side: 'Left' | 'Right',
    hipIdx: number,
    kneeIdx: number,
    ankleIdx: number,
    heelIdx: number,
    toeIdx: number,
  ) => {
    const upName = `${side}UpLeg` as MixamoBoneName;
    const legName = `${side}Leg` as MixamoBoneName;
    const footName = `${side}Foot` as MixamoBoneName;
    const toeName = `${side}ToeBase` as MixamoBoneName;

    const hip = pts[hipIdx];
    const knee = pts[kneeIdx];
    const ankle = pts[ankleIdx];
    const heel = pts[heelIdx];
    const toe = pts[toeIdx];

    const thighDir = new THREE.Vector3().subVectors(knee, hip);
    safeNormalize(thighDir, new THREE.Vector3(0, -1, 0));
    const shinDir = new THREE.Vector3().subVectors(ankle, knee);
    safeNormalize(shinDir, thighDir);

    // Knee bend plane: thigh x shin points toward character's +X (left) during normal knee flexion
    const kneeCross = new THREE.Vector3().crossVectors(thighDir, shinDir);
    const kneeSin = kneeCross.length();

    const kneeRight = hipsRightAxis.clone();
    if (kneeSin > 0.14) {
      kneeCross.divideScalar(kneeSin);
      // Ensure it agrees with hip orientation hemisphere
      if (kneeCross.dot(hipsRightAxis) < 0) kneeCross.negate();
      const weight = THREE.MathUtils.clamp((kneeSin - 0.14) / 0.35, 0, 0.75);
      kneeRight.lerp(kneeCross, weight).normalize();
    }

    // Thigh world basis (Mixamo UpLeg rest direction is -Y)
    _yAxis.copy(thighDir).negate();
    _zAxis.crossVectors(kneeRight, _yAxis);
    safeNormalize(_zAxis, new THREE.Vector3(0, 0, 1));
    _xAxis.crossVectors(_yAxis, _zAxis).normalize();
    basisToQuat(_xAxis, _yAxis, _zAxis, canonicalWorld[upName]);

    // Shin world basis (Mixamo Leg rest direction is -Y)
    _yAxis.copy(shinDir).negate();
    _zAxis.crossVectors(kneeRight, _yAxis);
    safeNormalize(_zAxis, new THREE.Vector3(0, 0, 1));
    _xAxis.crossVectors(_yAxis, _zAxis).normalize();
    basisToQuat(_xAxis, _yAxis, _zAxis, canonicalWorld[legName]);

    // Foot orientation: Mixamo Foot bone rests along -Y..+Z, ToeBase points +Z
    const footVec = new THREE.Vector3().subVectors(toe, heel);
    if (footVec.lengthSq() > 1e-4) {
      footVec.normalize();
      _zAxis.copy(footVec);
      _yAxis.crossVectors(_zAxis, kneeRight);
      safeNormalize(_yAxis, new THREE.Vector3(0, 1, 0));
      _xAxis.crossVectors(_yAxis, _zAxis).normalize();
      _yAxis.crossVectors(_zAxis, _xAxis).normalize();
      basisToQuat(_xAxis, _yAxis, _zAxis, canonicalWorld[footName]);
    } else {
      canonicalWorld[footName].copy(canonicalWorld[legName]);
    }
    canonicalWorld[toeName].copy(canonicalWorld[footName]);
  };

  solveLeg(
    'Left',
    LM.LEFT_HIP,
    LM.LEFT_KNEE,
    LM.LEFT_ANKLE,
    LM.LEFT_HEEL,
    LM.LEFT_FOOT_INDEX,
  );
  solveLeg(
    'Right',
    LM.RIGHT_HIP,
    LM.RIGHT_KNEE,
    LM.RIGHT_ANKLE,
    LM.RIGHT_HEEL,
    LM.RIGHT_FOOT_INDEX,
  );

  // 6. CONVERT CANONICAL WORLD QUATERNIONS TO LOCAL BONE QUATERNIONS FOR THE ACTIVE RIG
  const targetWorld: Record<MixamoBoneName, THREE.Quaternion> = {} as Record<
    MixamoBoneName,
    THREE.Quaternion
  >;
  const rotations: Record<MixamoBoneName, [number, number, number, number]> = {} as Record<
    MixamoBoneName,
    [number, number, number, number]
  >;

  const parentLookup: Record<MixamoBoneName, MixamoBoneName | null> = {
    Hips: null,
    Spine: 'Hips',
    Spine1: 'Spine',
    Spine2: 'Spine1',
    Neck: 'Spine2',
    Head: 'Neck',
    LeftShoulder: 'Spine2',
    LeftArm: 'LeftShoulder',
    LeftForeArm: 'LeftArm',
    LeftHand: 'LeftForeArm',
    RightShoulder: 'Spine2',
    RightArm: 'RightShoulder',
    RightForeArm: 'RightArm',
    RightHand: 'RightForeArm',
    LeftUpLeg: 'Hips',
    LeftLeg: 'LeftUpLeg',
    LeftFoot: 'LeftLeg',
    LeftToeBase: 'LeftFoot',
    RightUpLeg: 'Hips',
    RightLeg: 'RightUpLeg',
    RightFoot: 'RightLeg',
    RightToeBase: 'RightFoot',
  };

  for (const name of MIXAMO_BONES) {
    // Q_target_world = Q_canonical_world * Q_rest_world
    _qTargetWorld
      .copy(canonicalWorld[name])
      .multiply(rig.restWorldQuaternions[name])
      .normalize();
    targetWorld[name] = _qTargetWorld.clone();

    const parentName = parentLookup[name];
    if (!parentName) {
      // Hips is root under rig.rootObject
      rotations[name] = [
        _qTargetWorld.x,
        _qTargetWorld.y,
        _qTargetWorld.z,
        _qTargetWorld.w,
      ];
    } else {
      _qParentInv.copy(targetWorld[parentName]).invert();
      const qLocal = _qParentInv.multiply(_qTargetWorld).normalize();
      rotations[name] = [qLocal.x, qLocal.y, qLocal.z, qLocal.w];
    }
  }

  // 7. COMPUTE HIPS ROOT POSITION (with optional foot grounding)
  const scaleFactor = rig.hipsRestHeight / 0.96;
  let hipX = 0;
  let hipY = rig.hipsRestHeight;
  let hipZ = 0;

  if (options.rootMotion) {
    // Estimate human scale from MediaPipe hip-to-ankle height
    const lowestFootY = Math.min(
      pts[LM.LEFT_ANKLE].y,
      pts[LM.RIGHT_ANKLE].y,
      pts[LM.LEFT_HEEL].y,
      pts[LM.RIGHT_HEEL].y,
    );
    const mpLegHeight = Math.max(hipCenter.y - lowestFootY, 0.35);
    hipX = hipCenter.x * scaleFactor;
    hipZ = hipCenter.z * scaleFactor;
    hipY = mpLegHeight * scaleFactor + 0.06;
  } else if (options.footGrounding) {
    // Keep feet planted cleanly near y=0 during squats/crouches without XZ drift
    const lowestFootY = Math.min(
      pts[LM.LEFT_ANKLE].y,
      pts[LM.RIGHT_ANKLE].y,
      pts[LM.LEFT_HEEL].y,
      pts[LM.RIGHT_HEEL].y,
    );
    const mpLegHeight = THREE.MathUtils.clamp(hipCenter.y - lowestFootY, 0.35, 1.15);
    hipY = mpLegHeight * scaleFactor + 0.065;
  }

  return {
    time: timeSec,
    hipsPosition: [hipX, hipY, hipZ],
    rotations,
  };
}

/**
 * Builds a Mixamo PoseFrame for Face-Only mode: relaxed portrait stance for shoulders/arms,
 * smooth Neck (40%) + Head (100%) orientation from MediaPipe FaceLandmarker, and 25 facial blendshapes.
 */
export function retargetFaceToPoseFrame(
  headWorldQuat: THREE.Quaternion,
  faceBlendshapes: FacialBlendshapeMap,
  rig: ActiveMixamoRig,
  timeSec: number,
): PoseFrame {
  const rotations = {} as Record<MixamoBoneName, [number, number, number, number]>;
  for (const name of MIXAMO_BONES) {
    const qRest = rig.restLocalQuaternions[name];
    rotations[name] = [qRest.x, qRest.y, qRest.z, qRest.w];
  }

  // Relax arms down naturally (~68 deg) for portrait framing
  const qDropL = new THREE.Quaternion().setFromAxisAngle(
    new THREE.Vector3(0, 0, 1),
    -1.18,
  );
  const qDropR = new THREE.Quaternion().setFromAxisAngle(
    new THREE.Vector3(0, 0, 1),
    1.18,
  );
  const qLeftArm = rig.restLocalQuaternions.LeftArm.clone().multiply(qDropL);
  const qRightArm = rig.restLocalQuaternions.RightArm.clone().multiply(qDropR);
  rotations.LeftArm = [qLeftArm.x, qLeftArm.y, qLeftArm.z, qLeftArm.w];
  rotations.RightArm = [qRightArm.x, qRightArm.y, qRightArm.z, qRightArm.w];

  // Split head rotation cleanly between Neck (38%) and Head (62%)
  const qIdentity = new THREE.Quaternion();
  const qNeckDelta = qIdentity.clone().slerp(headWorldQuat, 0.38);
  const qNeckTargetWorld = qNeckDelta
    .clone()
    .multiply(rig.restWorldQuaternions.Neck);
  const qSpine2Inv = rig.restWorldQuaternions.Spine2.clone().invert();
  const qNeckLocal = qSpine2Inv.multiply(qNeckTargetWorld).normalize();
  rotations.Neck = [qNeckLocal.x, qNeckLocal.y, qNeckLocal.z, qNeckLocal.w];

  const qHeadTargetWorld = headWorldQuat
    .clone()
    .multiply(rig.restWorldQuaternions.Head);
  const qHeadLocal = qNeckTargetWorld
    .clone()
    .invert()
    .multiply(qHeadTargetWorld)
    .normalize();
  rotations.Head = [qHeadLocal.x, qHeadLocal.y, qHeadLocal.z, qHeadLocal.w];

  return {
    time: timeSec,
    hipsPosition: [0, rig.hipsRestHeight, 0],
    rotations,
    faceBlendshapes,
  };
}

export function applyPoseFrameToRig(
  frame: PoseFrame,
  rig: ActiveMixamoRig,
): void {
  const hipsBone = rig.bones.Hips;
  if (hipsBone) {
    hipsBone.position.set(
      frame.hipsPosition[0],
      frame.hipsPosition[1],
      frame.hipsPosition[2],
    );
  }
  for (const name of MIXAMO_BONES) {
    const bone = rig.bones[name];
    const q = frame.rotations[name];
    if (bone && q) {
      bone.quaternion.set(q[0], q[1], q[2], q[3]);
    }
  }

  const shapes = frame.faceBlendshapes ?? {};
  if (rig.morphMeshes.length > 0) {
    for (const mesh of rig.morphMeshes) {
      const dict = mesh.morphTargetDictionary;
      const infl = mesh.morphTargetInfluences;
      if (!dict || !infl) continue;
      infl.fill(0);
      for (const key of FACIAL_BLENDSHAPES) {
        const val = shapes[key];
        if (val === undefined) continue;
        // Try exact ARKit key or case-insensitive match on custom GLB meshes
        if (dict[key] !== undefined) {
          infl[dict[key]] = val;
        } else {
          const lowerKey = key.toLowerCase();
          for (const [k, idx] of Object.entries(dict)) {
            if (k.toLowerCase() === lowerKey) {
              infl[idx] = val;
              break;
            }
          }
        }
      }
    }
  }

  rig.rootObject.updateMatrixWorld(true);
}
