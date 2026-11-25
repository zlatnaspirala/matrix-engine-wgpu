import type { DemoMotionId, Landmark3D } from '../types/mocap';

export interface DemoMotionMeta {
  id: DemoMotionId;
  label: string;
  durationHint: number;
}

export const DEMO_MOTIONS: DemoMotionMeta[] = [
  { id: 'walk', label: 'Walk Cycle', durationHint: 1.6 },
  { id: 'wave', label: 'Wave & Turn', durationHint: 2.4 },
  { id: 'kick', label: 'Martial Kick', durationHint: 2.0 },
  { id: 'squat', label: 'Deep Squat', durationHint: 2.2 },
  { id: 'tpose', label: 'T-Pose Calibration', durationHint: 1.0 },
];

/**
 * Generates 33 MediaPipe worldLandmarks (meters: +X subject-left, +Y down, +Z away from camera)
 * and matching 2D normalized landmarks [0..1] for instant offline mocap testing.
 */
export function generateDemoLandmarks(
  motion: DemoMotionId,
  t: number,
): { worldLandmarks: Landmark3D[]; landmarks2D: Landmark3D[] } {
  // Build skeleton in Y-up meters first, then convert to MediaPipe world coordinates (+X, -Y, -Z)
  const pts: Record<number, [number, number, number]> = {};

  // Helper to place limb segments in Y-up space (origin at ground y=0, facing +Z)
  let hipY = 0.96;
  let hipX = 0;
  let hipZ = 0;
  let torsoPitch = 0;
  let torsoYaw = 0;
  let headYaw = 0;
  let headPitch = 0;

  let lArmPitch = 0; // + forward, - back
  let lArmRoll = 0.25; // radians down from T-pose (0 = T-pose horizontal, 1.3 = relaxed down)
  let lElbowFlex = 0.15;

  let rArmPitch = 0;
  let rArmRoll = 0.25;
  let rElbowFlex = 0.15;

  let lHipPitch = 0; // + forward
  let lKneeFlex = 0.06;
  let lAnklePitch = 0;

  let rHipPitch = 0;
  let rKneeFlex = 0.06;
  let rAnklePitch = 0;

  if (motion === 'tpose') {
    lArmRoll = 0;
    rArmRoll = 0;
    lElbowFlex = 0.02;
    rElbowFlex = 0.02;
  } else if (motion === 'walk') {
    const phase = (t / 1.1) * Math.PI * 2;
    const s = Math.sin(phase);
    const c = Math.cos(phase);
    hipY = 0.94 + Math.abs(c) * 0.035;
    hipX = Math.sin(phase) * 0.025;
    torsoYaw = -s * 0.12;
    torsoPitch = 0.06;

    lArmRoll = 1.28;
    rArmRoll = 1.28;
    lArmPitch = -s * 0.55;
    rArmPitch = s * 0.55;
    lElbowFlex = 0.4 + Math.max(0, -s) * 0.35;
    rElbowFlex = 0.4 + Math.max(0, s) * 0.35;

    lHipPitch = s * 0.52;
    rHipPitch = -s * 0.52;
    lKneeFlex = Math.max(0.06, -c * 0.85 + 0.18);
    rKneeFlex = Math.max(0.06, c * 0.85 + 0.18);
    lAnklePitch = -s * 0.2;
    rAnklePitch = s * 0.2;
  } else if (motion === 'wave') {
    const phase = (t / 2.4) * Math.PI * 2;
    hipY = 0.95 + Math.sin(phase * 2) * 0.015;
    torsoYaw = Math.sin(phase) * 0.28;
    headYaw = Math.sin(phase) * 0.35;
    headPitch = Math.sin(phase * 2) * 0.08;

    // Left arm relaxed on hip, Right arm raised high waving
    lArmRoll = 1.22;
    lElbowFlex = 0.35;

    rArmRoll = -0.85; // raised above shoulder
    rArmPitch = 0.35;
    rElbowFlex = 1.1 + Math.sin(phase * 4) * 0.48;
  } else if (motion === 'kick') {
    const cycle = (t % 2.0) / 2.0; // 0..1
    const kickEnv = Math.exp(-Math.pow((cycle - 0.5) / 0.18, 2));
    hipY = 0.94 - kickEnv * 0.04;
    torsoYaw = -kickEnv * 0.35;
    torsoPitch = -kickEnv * 0.22;

    // Martial arts guard arms
    lArmRoll = 0.95;
    lArmPitch = 0.65;
    lElbowFlex = 1.45;
    rArmRoll = 0.95;
    rArmPitch = 0.55 - kickEnv * 0.45;
    rElbowFlex = 1.45 - kickEnv * 0.4;

    // Right leg snap kick forward/up
    rHipPitch = 0.12 + kickEnv * 1.45;
    rKneeFlex = 0.2 + Math.sin(cycle * Math.PI) * 0.55 * (1 - kickEnv * 0.85);
    lHipPitch = -kickEnv * 0.1;
    lKneeFlex = 0.18;
  } else if (motion === 'squat') {
    const phase = (t / 2.2) * Math.PI * 2;
    const depth = (1 - Math.cos(phase)) * 0.5; // 0..1
    hipY = 0.95 - depth * 0.38;
    hipZ = -depth * 0.12;
    torsoPitch = depth * 0.42;

    // Arms reach forward for counterbalance
    lArmRoll = 1.25 - depth * 0.95;
    rArmRoll = 1.25 - depth * 0.95;
    lArmPitch = depth * 1.15;
    rArmPitch = depth * 1.15;
    lElbowFlex = 0.25;
    rElbowFlex = 0.25;

    lHipPitch = depth * 1.25;
    rHipPitch = depth * 1.25;
    lKneeFlex = 0.08 + depth * 1.75;
    rKneeFlex = 0.08 + depth * 1.75;
    lAnklePitch = -depth * 0.4;
    rAnklePitch = -depth * 0.4;
  }

  // Forward kinematics helper in Y-up world space
  const rotateY = (v: [number, number, number], yaw: number): [number, number, number] => {
    const c = Math.cos(yaw);
    const s = Math.sin(yaw);
    return [v[0] * c + v[2] * s, v[1], -v[0] * s + v[2] * c];
  };
  const rotateX = (v: [number, number, number], pitch: number): [number, number, number] => {
    const c = Math.cos(pitch);
    const s = Math.sin(pitch);
    return [v[0], v[1] * c - v[2] * s, v[1] * s + v[2] * c];
  };

  const torsoPt = (local: [number, number, number]): [number, number, number] => {
    let p = rotateX(local, torsoPitch);
    p = rotateY(p, torsoYaw);
    return [hipX + p[0], hipY + p[1], hipZ + p[2]];
  };

  // Hips
  pts[23] = torsoPt([0.1, -0.04, 0]); // L_HIP
  pts[24] = torsoPt([-0.1, -0.04, 0]); // R_HIP

  // Shoulders
  const lSh = torsoPt([0.18, 0.49, 0]);
  const rSh = torsoPt([-0.18, 0.49, 0]);
  pts[11] = lSh;
  pts[12] = rSh;

  // Head & Ears & Nose
  const neckTop = torsoPt([0, 0.62, 0]);
  const headFwdVec = rotateY(rotateX([0, 0, 0.11], headPitch), torsoYaw + headYaw);
  const headSideVec = rotateY([0.075, 0, 0], torsoYaw + headYaw);
  pts[0] = [
    neckTop[0] + headFwdVec[0],
    neckTop[1] + 0.07 + headFwdVec[1],
    neckTop[2] + headFwdVec[2],
  ];
  pts[7] = [
    neckTop[0] + headSideVec[0],
    neckTop[1] + 0.08,
    neckTop[2] + headSideVec[2],
  ];
  pts[8] = [
    neckTop[0] - headSideVec[0],
    neckTop[1] + 0.08,
    neckTop[2] - headSideVec[2],
  ];
  // Eyes / Mouth fillers
  pts[1] = [pts[0][0] + 0.02, pts[0][1] + 0.02, pts[0][2] - 0.01];
  pts[2] = [pts[0][0] + 0.03, pts[0][1] + 0.02, pts[0][2] - 0.01];
  pts[3] = [pts[0][0] + 0.04, pts[0][1] + 0.02, pts[0][2] - 0.02];
  pts[4] = [pts[0][0] - 0.02, pts[0][1] + 0.02, pts[0][2] - 0.01];
  pts[5] = [pts[0][0] - 0.03, pts[0][1] + 0.02, pts[0][2] - 0.01];
  pts[6] = [pts[0][0] - 0.04, pts[0][1] + 0.02, pts[0][2] - 0.02];
  pts[9] = [pts[0][0] + 0.02, pts[0][1] - 0.03, pts[0][2] - 0.01];
  pts[10] = [pts[0][0] - 0.02, pts[0][1] - 0.03, pts[0][2] - 0.01];

  // Arms
  const buildArmPts = (
    sideSign: number,
    sh: [number, number, number],
    roll: number,
    pitch: number,
    elbowFlex: number,
  ) => {
    // T-pose upper arm: [sideSign * 0.27, 0, 0]
    // Rotate around Z by -sideSign * roll (brings arm down when roll > 0)
    const cR = Math.cos(roll);
    const sR = Math.sin(roll);
    const uLocal: [number, number, number] = [
      sideSign * 0.27 * cR,
      -0.27 * sR,
      0,
    ];
    // Rotate around X by -pitch (pitch > 0 swings forward +Z)
    const uPitched = rotateY(rotateX(uLocal, -pitch), torsoYaw);
    const el: [number, number, number] = [
      sh[0] + uPitched[0],
      sh[1] + uPitched[1],
      sh[2] + uPitched[2],
    ];

    // Forearm flexes forward (+Z) / upward relative to upper arm
    const fLocal: [number, number, number] = [
      sideSign * 0.25 * Math.cos(roll + elbowFlex * 0.15) * Math.cos(elbowFlex),
      -0.25 * Math.sin(roll - elbowFlex * 0.75),
      0.25 * Math.sin(elbowFlex),
    ];
    const fPitched = rotateY(rotateX(fLocal, -pitch), torsoYaw);
    const wr: [number, number, number] = [
      el[0] + fPitched[0],
      el[1] + fPitched[1],
      el[2] + fPitched[2],
    ];

    const hDir = [
      (wr[0] - el[0]) * 0.35,
      (wr[1] - el[1]) * 0.35,
      (wr[2] - el[2]) * 0.35,
    ];
    const idx: [number, number, number] = [wr[0] + hDir[0], wr[1] + hDir[1] + 0.015, wr[2] + hDir[2]];
    const pnk: [number, number, number] = [wr[0] + hDir[0], wr[1] + hDir[1] - 0.015, wr[2] + hDir[2]];
    const thm: [number, number, number] = [wr[0] + hDir[0] * 0.6, wr[1] + hDir[1] * 0.6 + 0.025, wr[2] + hDir[2] * 0.6];
    return { el, wr, idx, pnk, thm };
  };

  const lArm = buildArmPts(1, lSh, lArmRoll, lArmPitch, lElbowFlex);
  pts[13] = lArm.el;
  pts[15] = lArm.wr;
  pts[17] = lArm.pnk;
  pts[19] = lArm.idx;
  pts[21] = lArm.thm;

  const rArm = buildArmPts(-1, rSh, rArmRoll, rArmPitch, rElbowFlex);
  pts[14] = rArm.el;
  pts[16] = rArm.wr;
  pts[18] = rArm.pnk;
  pts[20] = rArm.idx;
  pts[22] = rArm.thm;

  // Legs
  const buildLegPts = (
    hip: [number, number, number],
    hipPitch: number,
    kneeFlex: number,
    anklePitch: number,
  ) => {
    const thighAngle = -hipPitch; // pitch > 0 lifts leg forward (+Z)
    const thighVec: [number, number, number] = [
      0,
      -0.43 * Math.cos(thighAngle),
      -0.43 * Math.sin(thighAngle),
    ];
    const knee: [number, number, number] = [
      hip[0] + thighVec[0],
      hip[1] + thighVec[1],
      hip[2] + thighVec[2],
    ];

    const shinAngle = thighAngle + kneeFlex; // kneeFlex > 0 bends shin backward (-Z)
    const shinVec: [number, number, number] = [
      0,
      -0.41 * Math.cos(shinAngle),
      -0.41 * Math.sin(shinAngle),
    ];
    const ankle: [number, number, number] = [
      knee[0] + shinVec[0],
      knee[1] + shinVec[1],
      knee[2] + shinVec[2],
    ];

    const heel: [number, number, number] = [ankle[0], ankle[1] - 0.05, ankle[2] - 0.03];
    const toe: [number, number, number] = [
      ankle[0],
      ankle[1] - 0.05 + Math.sin(anklePitch) * 0.12,
      ankle[2] + 0.14 * Math.cos(anklePitch),
    ];
    return { knee, ankle, heel, toe };
  };

  const lLeg = buildLegPts(pts[23], lHipPitch, lKneeFlex, lAnklePitch);
  pts[25] = lLeg.knee;
  pts[27] = lLeg.ankle;
  pts[29] = lLeg.heel;
  pts[31] = lLeg.toe;

  const rLeg = buildLegPts(pts[24], rHipPitch, rKneeFlex, rAnklePitch);
  pts[26] = rLeg.knee;
  pts[28] = rLeg.ankle;
  pts[30] = rLeg.heel;
  pts[32] = rLeg.toe;

  // Convert Y-up world points into MediaPipe worldLandmarks (origin near hip center, +Y down, +Z away)
  const worldLandmarks: Landmark3D[] = [];
  const landmarks2D: Landmark3D[] = [];

  for (let i = 0; i < 33; i++) {
    const p = pts[i] || [0, 0, 0];
    worldLandmarks.push({
      x: p[0] - hipX,
      y: -(p[1] - hipY),
      z: -(p[2] - hipZ),
      visibility: 0.99,
    });
    // Project nicely into 2D normalized frame [0..1]
    landmarks2D.push({
      x: 0.5 + p[0] * 0.42,
      y: 0.92 - p[1] * 0.44,
      z: -p[2] * 0.25,
      visibility: 0.99,
    });
  }

  return { worldLandmarks, landmarks2D };
}
