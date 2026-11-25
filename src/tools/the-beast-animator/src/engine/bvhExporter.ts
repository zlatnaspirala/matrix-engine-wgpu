import * as THREE from 'three';
import {
  FACIAL_BLENDSHAPES,
  formatMixamoBoneName,
  type BoneNamingScheme,
  type FacialBlendshapeMap,
  type MixamoBoneName,
  type PoseFrame,
} from '../types/mocap';
import { MIXAMO_HIERARCHY } from './mixamoSkeleton';

interface BvhNode {
  name: MixamoBoneName;
  offsetCm: [number, number, number];
  endSiteCm?: [number, number, number];
  children: BvhNode[];
}

function buildBvhTree(): BvhNode {
  const nodeMap = new Map<MixamoBoneName, BvhNode>();
  for (const def of MIXAMO_HIERARCHY) {
    nodeMap.set(def.name, {
      name: def.name,
      offsetCm: [
        +(def.offset[0] * 100).toFixed(4),
        +(def.offset[1] * 100).toFixed(4),
        +(def.offset[2] * 100).toFixed(4),
      ],
      endSiteCm: def.endSiteOffset
        ? [
            +(def.endSiteOffset[0] * 100).toFixed(4),
            +(def.endSiteOffset[1] * 100).toFixed(4),
            +(def.endSiteOffset[2] * 100).toFixed(4),
          ]
        : undefined,
      children: [],
    });
  }

  let root: BvhNode | null = null;
  for (const def of MIXAMO_HIERARCHY) {
    const node = nodeMap.get(def.name)!;
    if (def.parent === null) {
      root = node;
    } else {
      nodeMap.get(def.parent)!.children.push(node);
    }
  }
  return root!;
}

/**
 * Resamples irregularly-timed captured PoseFrames onto a uniform fixed-FPS timeline
 * using linear position interpolation and spherical quaternion slerp.
 */
export function resamplePoseFrames(
  frames: PoseFrame[],
  fps: number,
): PoseFrame[] {
  if (frames.length === 0) return [];
  if (frames.length === 1) {
    return [{ ...frames[0], time: 0 }];
  }

  const startTime = frames[0].time;
  const endTime = frames[frames.length - 1].time;
  const duration = Math.max(endTime - startTime, 1 / fps);
  const dt = 1 / fps;
  const count = Math.max(2, Math.floor(duration * fps) + 1);

  const out: PoseFrame[] = [];
  const qA = new THREE.Quaternion();
  const qB = new THREE.Quaternion();

  let cursor = 0;
  for (let i = 0; i < count; i++) {
    const targetTime = startTime + i * dt;
    while (
      cursor < frames.length - 2 &&
      frames[cursor + 1].time < targetTime
    ) {
      cursor++;
    }
    const fA = frames[cursor];
    const fB = frames[Math.min(cursor + 1, frames.length - 1)];
    const span = fB.time - fA.time;
    const alpha =
      span > 1e-5
        ? THREE.MathUtils.clamp((targetTime - fA.time) / span, 0, 1)
        : 0;

    const hipsPosition: [number, number, number] = [
      THREE.MathUtils.lerp(fA.hipsPosition[0], fB.hipsPosition[0], alpha),
      THREE.MathUtils.lerp(fA.hipsPosition[1], fB.hipsPosition[1], alpha),
      THREE.MathUtils.lerp(fA.hipsPosition[2], fB.hipsPosition[2], alpha),
    ];

    const rotations = {} as PoseFrame['rotations'];
    for (const def of MIXAMO_HIERARCHY) {
      const qa = fA.rotations[def.name];
      const qb = fB.rotations[def.name];
      qA.set(qa[0], qa[1], qa[2], qa[3]);
      qB.set(qb[0], qb[1], qb[2], qb[3]);
      qA.slerp(qB, alpha);
      rotations[def.name] = [qA.x, qA.y, qA.z, qA.w];
    }

    let faceBlendshapes: FacialBlendshapeMap | undefined;
    if (fA.faceBlendshapes || fB.faceBlendshapes) {
      faceBlendshapes = {};
      for (const key of FACIAL_BLENDSHAPES) {
        const va = fA.faceBlendshapes?.[key] ?? 0;
        const vb = fB.faceBlendshapes?.[key] ?? 0;
        if (va > 0 || vb > 0) {
          faceBlendshapes[key] = THREE.MathUtils.lerp(va, vb, alpha);
        }
      }
    }

    out.push({
      time: +(i * dt).toFixed(6),
      hipsPosition,
      rotations,
      ...(faceBlendshapes ? { faceBlendshapes } : {}),
    });
  }

  return out;
}

export function generateBVHString(
  rawFrames: PoseFrame[],
  fps: number,
  namingScheme: BoneNamingScheme,
): string {
  const frames = resamplePoseFrames(rawFrames, fps);
  if (frames.length === 0) return '';

  const root = buildBvhTree();
  const jointOrder: MixamoBoneName[] = [];
  const lines: string[] = ['HIERARCHY'];

  const writeNode = (node: BvhNode, depth: number, isRoot: boolean) => {
    const pad = '  '.repeat(depth);
    const label = formatMixamoBoneName(node.name, namingScheme);
    lines.push(`${pad}${isRoot ? 'ROOT' : 'JOINT'} ${label}`);
    lines.push(`${pad}{`);
    lines.push(
      `${pad}  OFFSET ${node.offsetCm[0].toFixed(4)} ${node.offsetCm[1].toFixed(4)} ${node.offsetCm[2].toFixed(4)}`,
    );
    if (isRoot) {
      lines.push(
        `${pad}  CHANNELS 6 Xposition Yposition Zposition Zrotation Xrotation Yrotation`,
      );
    } else {
      lines.push(`${pad}  CHANNELS 3 Zrotation Xrotation Yrotation`);
    }

    jointOrder.push(node.name);

    for (const child of node.children) {
      writeNode(child, depth + 1, false);
    }

    if (node.endSiteCm) {
      lines.push(`${pad}  End Site`);
      lines.push(`${pad}  {`);
      lines.push(
        `${pad}    OFFSET ${node.endSiteCm[0].toFixed(4)} ${node.endSiteCm[1].toFixed(4)} ${node.endSiteCm[2].toFixed(4)}`,
      );
      lines.push(`${pad}  }`);
    }

    lines.push(`${pad}}`);
  };

  writeNode(root, 0, true);

  const frameTime = 1 / fps;
  lines.push('MOTION');
  lines.push(`Frames: ${frames.length}`);
  lines.push(`Frame Time: ${frameTime.toFixed(6)}`);

  const quat = new THREE.Quaternion();
  const euler = new THREE.Euler(0, 0, 0, 'ZXY');
  const radToDeg = THREE.MathUtils.RAD2DEG;

  for (const frame of frames) {
    const vals: string[] = [
      (frame.hipsPosition[0] * 100).toFixed(4),
      (frame.hipsPosition[1] * 100).toFixed(4),
      (frame.hipsPosition[2] * 100).toFixed(4),
    ];

    for (const boneName of jointOrder) {
      const q = frame.rotations[boneName];
      quat.set(q[0], q[1], q[2], q[3]).normalize();
      euler.setFromQuaternion(quat, 'ZXY');
      vals.push(
        (euler.z * radToDeg).toFixed(4),
        (euler.x * radToDeg).toFixed(4),
        (euler.y * radToDeg).toFixed(4),
      );
    }
    lines.push(vals.join(' '));
  }

  return lines.join('\n');
}

export function downloadTextFile(
  content: string,
  filename: string,
  mimeType = 'text/plain;charset=utf-8',
): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
