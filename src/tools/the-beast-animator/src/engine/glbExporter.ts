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
  boneOverrides?: Partial<Record<MixamoBoneName, THREE.Bone | null>>,
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

  const endTime = times[times.length - 1] > 0 ? times[times.length - 1] : 1 / Math.max(fps, 1);
  const restTimes = new Float32Array([times[0], endTime]);

  // Bind via bone.uuid so THREE.GLTFExporter never drops tracks containing colons (e.g. "mixamorig:Hips")
  const hipsBone = boneOverrides?.Hips ?? rig.bones.Hips;
  if (hipsBone) {
    const hipsTarget = hipsBone.uuid;
    const posValues = new Float32Array(frames.length * 3);
    for (let i = 0; i < frames.length; i++) {
      posValues[i * 3] = frames[i].hipsPosition[0];
      posValues[i * 3 + 1] = frames[i].hipsPosition[1];
      posValues[i * 3 + 2] = frames[i].hipsPosition[2];
    }
    tracks.push(
      new THREE.VectorKeyframeTrack(`${hipsTarget}.position`, times, posValues),
    );
  }

  // Bone quaternion tracks + local translation/scale tracks for every bone
  // (Ensures loaders like matrix-engine-wgpu that overwrite node transforms still restore exact local offsets & scale)
  for (const boneKey of MIXAMO_BONES) {
    const bone = boneOverrides?.[boneKey] ?? rig.bones[boneKey];
    if (!bone) continue;
    const boneTarget = bone.uuid;

    if (boneKey !== 'Hips') {
      const px = bone.position.x;
      const py = bone.position.y;
      const pz = bone.position.z;
      tracks.push(
        new THREE.VectorKeyframeTrack(
          `${boneTarget}.position`,
          restTimes,
          new Float32Array([px, py, pz, px, py, pz]),
        ),
      );
    }

    const sx = bone.scale.x;
    const sy = bone.scale.y;
    const sz = bone.scale.z;
    tracks.push(
      new THREE.VectorKeyframeTrack(
        `${boneTarget}.scale`,
        restTimes,
        new Float32Array([sx, sy, sz, sx, sy, sz]),
      ),
    );

    const quatValues = new Float32Array(frames.length * 4);
    for (let i = 0; i < frames.length; i++) {
      const q = frames[i].rotations[boneKey];
      quatValues[i * 4] = q[0];
      quatValues[i * 4 + 1] = q[1];
      quatValues[i * 4 + 2] = q[2];
      quatValues[i * 4 + 3] = q[3];
    }
    tracks.push(
      new THREE.QuaternionKeyframeTrack(
        `${boneTarget}.quaternion`,
        times,
        quatValues,
      ),
    );
  }

  // Facial morph target tracks (when facial blendshapes were captured)
  const hasFaceData = frames.some((f) => f.faceBlendshapes !== undefined);
  if (hasFaceData && rig.morphMeshes.length > 0 && !boneOverrides) {
    for (const mesh of rig.morphMeshes) {
      const dict = mesh.morphTargetDictionary;
      if (!dict) continue;
      const meshTarget = mesh.uuid || mesh.name;
      if (!meshTarget) continue;
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
              `${meshTarget}.morphTargetInfluences[${targetName}]`,
              times,
              values,
            ),
          );
        }
      }
    }
  }

  // Keep namingScheme referenced so exported rig names stay consistent
  void formatMixamoBoneName;
  void namingScheme;

  const duration = times[times.length - 1];
  return new THREE.AnimationClip(clipName, duration, tracks);
}

/**
 * Clones only the bone hierarchy (stripping SkinnedMesh geometry) for lightweight Armature-only GLB export.
 */
function cloneSkeletonOnly(
  rig: ActiveMixamoRig,
): {
  container: THREE.Group;
  boneMap: Partial<Record<MixamoBoneName, THREE.Bone>>;
} {
  const container = new THREE.Group();
  container.name = 'Mixamo_Armature';
  const boneMap: Partial<Record<MixamoBoneName, THREE.Bone>> = {};

  const srcToKey = new Map<THREE.Object3D, MixamoBoneName>();
  for (const key of MIXAMO_BONES) {
    const b = rig.bones[key];
    if (b) srcToKey.set(b, key);
  }

  const cloneBone = (src: THREE.Object3D): THREE.Object3D => {
    const copy = (src as THREE.Bone).isBone
      ? new THREE.Bone()
      : new THREE.Object3D();
    copy.name = src.name;
    copy.position.copy(src.position);
    copy.quaternion.copy(src.quaternion);
    copy.scale.copy(src.scale);

    const key = srcToKey.get(src);
    if (key && (copy as THREE.Bone).isBone) {
      boneMap[key] = copy as THREE.Bone;
    }

    for (const child of src.children) {
      if ((child as THREE.Bone).isBone) {
        copy.add(cloneBone(child));
      }
    }
    return copy;
  };

  if (rig.bones.Hips) {
    container.add(cloneBone(rig.bones.Hips));
  }
  container.updateMatrixWorld(true);
  return { container, boneMap };
}

/**
 * Normalizes the exported GLB JSON chunk so custom WebGPU/glTF parsers never hit
 * falsy `bufferView === 0` checks or omitted `byteOffset === 0` defaults.
 */
function normalizeGlbBufferViews(glbBuffer: ArrayBuffer): ArrayBuffer {
  if (glbBuffer.byteLength < 20) return glbBuffer;
  const dv = new DataView(glbBuffer);
  const magic = dv.getUint32(0, true);
  if (magic !== 0x46546c67) return glbBuffer; // Not 'glTF'

  const jsonByteLength = dv.getUint32(12, true);
  const jsonType = dv.getUint32(16, true);
  if (jsonType !== 0x4e4f534a) return glbBuffer; // Not 'JSON'

  const jsonStart = 20;
  const jsonEnd = jsonStart + jsonByteLength;
  const rawJson = new TextDecoder().decode(
    new Uint8Array(glbBuffer, jsonStart, jsonByteLength),
  );
  const gltf = JSON.parse(rawJson) as {
    bufferViews?: Array<Record<string, unknown>>;
    accessors?: Array<{
      bufferView?: number;
      byteOffset?: number;
      sparse?: {
        indices?: { bufferView?: number; byteOffset?: number };
        values?: { bufferView?: number; byteOffset?: number };
      };
    }>;
    images?: Array<{ bufferView?: number }>;
  };

  if (!Array.isArray(gltf.bufferViews) || gltf.bufferViews.length === 0) {
    return glbBuffer;
  }

  // Prepend a 4-byte alias bufferView at index 0 so every real accessor uses bufferView >= 1
  const padView = {
    buffer: 0,
    byteOffset: 0,
    byteLength: Math.min(4, Number(gltf.bufferViews[0]?.byteLength ?? 4)),
  };
  gltf.bufferViews = [
    padView,
    ...gltf.bufferViews.map((bv) => ({
      ...bv,
      byteOffset: bv.byteOffset ?? 0,
    })),
  ];

  if (Array.isArray(gltf.accessors)) {
    for (const ac of gltf.accessors) {
      if (typeof ac.bufferView === 'number') {
        ac.bufferView += 1;
      }
      ac.byteOffset = ac.byteOffset ?? 0;
      if (ac.sparse?.indices) {
        if (typeof ac.sparse.indices.bufferView === 'number') {
          ac.sparse.indices.bufferView += 1;
        }
        ac.sparse.indices.byteOffset = ac.sparse.indices.byteOffset ?? 0;
      }
      if (ac.sparse?.values) {
        if (typeof ac.sparse.values.bufferView === 'number') {
          ac.sparse.values.bufferView += 1;
        }
        ac.sparse.values.byteOffset = ac.sparse.values.byteOffset ?? 0;
      }
    }
  }

  if (Array.isArray(gltf.images)) {
    for (const img of gltf.images) {
      if (typeof img.bufferView === 'number') {
        img.bufferView += 1;
      }
    }
  }

  const encodedJson = new TextEncoder().encode(JSON.stringify(gltf));
  const paddedJsonLen = Math.ceil(encodedJson.byteLength / 4) * 4;
  const binSlice = new Uint8Array(glbBuffer, jsonEnd);
  const totalLength = 20 + paddedJsonLen + binSlice.byteLength;

  const out = new ArrayBuffer(totalLength);
  const outDv = new DataView(out);
  const outBytes = new Uint8Array(out);

  outDv.setUint32(0, 0x46546c67, true); // 'glTF'
  outDv.setUint32(4, 2, true); // version 2
  outDv.setUint32(8, totalLength, true);
  outDv.setUint32(12, paddedJsonLen, true);
  outDv.setUint32(16, 0x4e4f534a, true); // 'JSON'

  outBytes.set(encodedJson, 20);
  for (let i = encodedJson.byteLength; i < paddedJsonLen; i++) {
    outBytes[20 + i] = 0x20; // space padding per glTF 2.0 spec
  }
  outBytes.set(binSlice, 20 + paddedJsonLen);

  return out;
}

export async function buildMixamoMultiGLBBuffer(
  clips: Array<{ name: string; frames: PoseFrame[]; fps?: number }>,
  rig: ActiveMixamoRig,
  options: {
    fps: number;
    namingScheme: BoneNamingScheme;
    includeMesh: boolean;
    restoreFrame?: PoseFrame | null;
  },
): Promise<ArrayBuffer> {
  renameMixamoRigBones(rig, options.namingScheme);
  resetRigToTPose(rig);

  let exportTarget: THREE.Object3D = rig.rootObject;
  let boneOverrides: Partial<Record<MixamoBoneName, THREE.Bone | null>> | undefined;

  if (!options.includeMesh && rig.bones.Hips) {
    const cloned = cloneSkeletonOnly(rig);
    exportTarget = cloned.container;
    boneOverrides = cloned.boneMap;
  }

  const usedNames = new Set<string>();
  const builtClips: THREE.AnimationClip[] = [];

  clips.forEach((clipDef, idx) => {
    if (clipDef.frames.length < 2) return;
    const baseName = clipDef.name.trim() || `Clip_${idx + 1}`;
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
        boneOverrides,
      ),
    );
  });

  if (builtClips.length === 0) {
    if (options.restoreFrame) {
      applyPoseFrameToRig(options.restoreFrame, rig);
    }
    throw new Error('No valid animation clips with at least 2 frames to export.');
  }

  const fallbackPatches: Array<{
    mat: THREE.MeshStandardMaterial;
    tex: THREE.DataTexture;
  }> = [];
  const skinIndexPatches: Array<{
    geo: THREE.BufferGeometry;
    prev: THREE.BufferAttribute | THREE.InterleavedBufferAttribute;
  }> = [];
  const uvPatches: Array<{ geo: THREE.BufferGeometry }> = [];

  if (options.includeMesh) {
    exportTarget.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh) return;

      const geo = mesh.geometry;
      if (geo) {
        if (!geo.attributes.uv && geo.attributes.position) {
          const uvData = new Float32Array(geo.attributes.position.count * 2);
          geo.setAttribute('uv', new THREE.BufferAttribute(uvData, 2));
          uvPatches.push({ geo });
        }
        const si = geo.attributes.skinIndex;
        if (si && !(si.array instanceof Uint8Array)) {
          let maxJoint = 0;
          for (let i = 0; i < si.count; i++) {
            maxJoint = Math.max(
              maxJoint,
              si.getX(i),
              si.getY(i),
              si.getZ(i),
              si.getW(i),
            );
          }
          if (maxJoint < 256) {
            const u8 = new Uint8Array(si.count * 4);
            for (let i = 0; i < si.count; i++) {
              u8[i * 4] = si.getX(i);
              u8[i * 4 + 1] = si.getY(i);
              u8[i * 4 + 2] = si.getZ(i);
              u8[i * 4 + 3] = si.getW(i);
            }
            skinIndexPatches.push({ geo, prev: si });
            geo.setAttribute('skinIndex', new THREE.BufferAttribute(u8, 4));
          }
        }
      }

      const mats = Array.isArray(mesh.material)
        ? mesh.material
        : [mesh.material];
      for (const m of mats) {
        const std = m as THREE.MeshStandardMaterial;
        if (std && 'map' in std && !std.map) {
          const c = std.color ? std.color.clone() : new THREE.Color(0xffffff);
          const srgb = c.convertLinearToSRGB();
          const data = new Uint8Array(4 * 4 * 4);
          const r = THREE.MathUtils.clamp(Math.round(srgb.r * 255), 0, 255);
          const g = THREE.MathUtils.clamp(Math.round(srgb.g * 255), 0, 255);
          const b = THREE.MathUtils.clamp(Math.round(srgb.b * 255), 0, 255);
          for (let p = 0; p < 16; p++) {
            data[p * 4] = r;
            data[p * 4 + 1] = g;
            data[p * 4 + 2] = b;
            data[p * 4 + 3] = 255;
          }
          const tex = new THREE.DataTexture(data, 4, 4, THREE.RGBAFormat);
          tex.colorSpace = THREE.SRGBColorSpace;
          tex.magFilter = THREE.LinearFilter;
          tex.minFilter = THREE.LinearFilter;
          tex.generateMipmaps = false;
          tex.flipY = false;
          tex.needsUpdate = true;
          std.map = tex;
          std.needsUpdate = true;
          fallbackPatches.push({ mat: std, tex });
        }
      }
    });
  }

  let rawGlbBuffer: ArrayBuffer;
  try {
    const exporter = new GLTFExporter();
    rawGlbBuffer = (await exporter.parseAsync(exportTarget, {
      binary: true,
      animations: builtClips,
      onlyVisible: false,
    })) as ArrayBuffer;
  } finally {
    for (const patch of skinIndexPatches) {
      patch.geo.setAttribute('skinIndex', patch.prev);
    }
    for (const patch of uvPatches) {
      patch.geo.deleteAttribute('uv');
    }
    for (const patch of fallbackPatches) {
      patch.mat.map = null;
      patch.mat.needsUpdate = true;
      patch.tex.dispose();
    }
    if (options.restoreFrame) {
      applyPoseFrameToRig(options.restoreFrame, rig);
    }
  }

  return normalizeGlbBufferViews(rawGlbBuffer);
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
  const glbBuffer = await buildMixamoMultiGLBBuffer(clips, rig, options);

  const blob = new Blob([glbBuffer], {
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
