import * as THREE from 'three';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import {
  FACIAL_BLENDSHAPES,
  MIXAMO_BONES,
  formatMixamoBoneName,
  type AnimationTakeClip,
  type BoneNamingScheme,
  type MixamoBoneName,
  type PoseFrame,
} from '../types/mocap';
import {
  resetRigToTPose,
  renameMixamoRigBones,
  type ActiveMixamoRig,
} from './mixamoSkeleton';
import { applyPoseFrameToRig } from './poseRetargeter';
import { resamplePoseFrames } from './bvhExporter';

export function buildMixamoAnimationClip(
  rawFrames: PoseFrame[],
  rig: ActiveMixamoRig,
  fps: number,
  namingScheme: BoneNamingScheme,
  clipName = 'Beast_Mixamo_Capture',
): THREE.AnimationClip {
  const frames = resamplePoseFrames(rawFrames, fps);
  if (frames.length === 0) {
    return new THREE.AnimationClip(clipName, 0, []);
  }

  const times = new Float32Array(frames.length);
  for (let i = 0; i < frames.length; i++) {
    times[i] = frames[i].time;
  }

  const tracks: THREE.KeyframeTrack[] = [];

  // Hips position track
  const hipsBone = rig.bones.Hips;
  if (hipsBone) {
    const hipsName = rig.isCustomModel
      ? hipsBone.name
      : formatMixamoBoneName('Hips', namingScheme);
    const posValues = new Float32Array(frames.length * 3);
    for (let i = 0; i < frames.length; i++) {
      posValues[i * 3] = frames[i].hipsPosition[0];
      posValues[i * 3 + 1] = frames[i].hipsPosition[1];
      posValues[i * 3 + 2] = frames[i].hipsPosition[2];
    }
    tracks.push(
      new THREE.VectorKeyframeTrack(`${hipsName}.position`, times, posValues),
    );
  }

  // Bone quaternion tracks
  for (const boneKey of MIXAMO_BONES) {
    const bone = rig.bones[boneKey];
    if (!bone) continue;
    const boneName = rig.isCustomModel
      ? bone.name
      : formatMixamoBoneName(boneKey, namingScheme);

    const quatValues = new Float32Array(frames.length * 4);
    for (let i = 0; i < frames.length; i++) {
      const q = frames[i].rotations[boneKey];
      quatValues[i * 4] = q[0];
      quatValues[i * 4 + 1] = q[1];
      quatValues[i * 4 + 2] = q[2];
      quatValues[i * 4 + 3] = q[3];
    }
    tracks.push(
      new THREE.QuaternionKeyframeTrack(`${boneName}.quaternion`, times, quatValues),
    );
  }

  // Facial morph target tracks (when facial blendshapes were captured)
  const hasFaceData = frames.some((f) => f.faceBlendshapes !== undefined);
  if (hasFaceData && rig.morphMeshes.length > 0) {
    for (const mesh of rig.morphMeshes) {
      const dict = mesh.morphTargetDictionary;
      if (!dict || !mesh.name) continue;
      for (const morphKey of FACIAL_BLENDSHAPES) {
        let targetName: string | null = null;
        if (dict[morphKey] !== undefined) {
          targetName = morphKey;
        } else {
          const lower = morphKey.toLowerCase();
          for (const k of Object.keys(dict)) {
            if (k.toLowerCase() === lower) {
              targetName = k;
              break;
            }
          }
        }
        if (!targetName) continue;

        const values = new Float32Array(frames.length);
        let anyNonZero = false;
        for (let i = 0; i < frames.length; i++) {
          const v = frames[i].faceBlendshapes?.[morphKey] ?? 0;
          values[i] = v;
          if (v > 0.002) anyNonZero = true;
        }
        if (anyNonZero) {
          tracks.push(
            new THREE.NumberKeyframeTrack(
              `${mesh.name}.morphTargetInfluences[${targetName}]`,
              times,
              values,
            ),
          );
        }
      }
    }
  }

  const duration = times[times.length - 1];
  return new THREE.AnimationClip(clipName, duration, tracks);
}

/**
 * Clones only the bone hierarchy (stripping SkinnedMesh geometry) for lightweight Armature-only GLB export.
 */
function cloneSkeletonOnly(hipsBone: THREE.Bone): THREE.Group {
  const container = new THREE.Group();
  container.name = 'Mixamo_Armature';
  const cloneBone = (src: THREE.Object3D): THREE.Object3D => {
    const copy = (src as THREE.Bone).isBone
      ? new THREE.Bone()
      : new THREE.Object3D();
    copy.name = src.name;
    copy.position.copy(src.position);
    copy.quaternion.copy(src.quaternion);
    copy.scale.copy(src.scale);
    for (const child of src.children) {
      if ((child as THREE.Bone).isBone) {
        copy.add(cloneBone(child));
      }
    }
    return copy;
  };
  container.add(cloneBone(hipsBone));
  container.updateMatrixWorld(true);
  return container;
}

export async function exportMixamoMultiGLB(
  clips: Array<{ name: string; frames: PoseFrame[]; fps?: number }>,
  rig: ActiveMixamoRig,
  options: {
    fps: number;
    namingScheme: BoneNamingScheme;
    includeMesh: boolean;
    filename: string;
    restoreFrame?: PoseFrame | null;
  },
): Promise<void> {
  renameMixamoRigBones(rig, options.namingScheme);
  resetRigToTPose(rig);

  const usedNames = new Set<string>();
  const builtClips: THREE.AnimationClip[] = [];

  clips.forEach((clipDef, idx) => {
    if (clipDef.frames.length < 2) return;
    let baseName = clipDef.name.trim() || `Clip_${idx + 1}`;
    let uniqueName = baseName;
    let suffix = 2;
    while (usedNames.has(uniqueName)) {
      uniqueName = `${baseName}_${suffix++}`;
    }
    usedNames.add(uniqueName);

    builtClips.push(
      buildMixamoAnimationClip(
        clipDef.frames,
        rig,
        clipDef.fps ?? options.fps,
        options.namingScheme,
        uniqueName,
      ),
    );
  });

  if (builtClips.length === 0) {
    if (options.restoreFrame) {
      applyPoseFrameToRig(options.restoreFrame, rig);
    }
    throw new Error('No valid animation clips with at least 2 frames to export.');
  }

  let exportTarget: THREE.Object3D = rig.rootObject;
  if (!options.includeMesh && rig.bones.Hips) {
    exportTarget = cloneSkeletonOnly(rig.bones.Hips);
  }

  const exporter = new GLTFExporter();
  const glbBuffer = await exporter.parseAsync(exportTarget, {
    binary: true,
    animations: builtClips,
    onlyVisible: false,
  });

  if (options.restoreFrame) {
    applyPoseFrameToRig(options.restoreFrame, rig);
  }

  const blob = new Blob([glbBuffer as ArrayBuffer], {
    type: 'model/gltf-binary',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = options.filename.endsWith('.glb')
    ? options.filename
    : `${options.filename}.glb`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function exportMixamoGLB(
  rawFrames: PoseFrame[],
  rig: ActiveMixamoRig,
  options: {
    fps: number;
    namingScheme: BoneNamingScheme;
    includeMesh: boolean;
    filename: string;
    restoreFrame?: PoseFrame | null;
  },
): Promise<void> {
  return exportMixamoMultiGLB(
    [
      {
        name: options.filename.replace(/\.glb$/i, ''),
        frames: rawFrames,
        fps: options.fps,
      },
    ],
    rig,
    options,
  );
}

export type { AnimationTakeClip };
