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
import {
  FACE_EXPORT_BONES,
  buildRiggedFaceExportModel,
  type FaceExportBoneName,
  type FaceExportRig,
} from './mediapipeFaceMesh3D';
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
        if (si && !(si.array instanceof Uint16Array)) {
          const u16 = new Uint16Array(si.count * 4);
          for (let i = 0; i < si.count; i++) {
            u16[i * 4] = si.getX(i);
            u16[i * 4 + 1] = si.getY(i);
            u16[i * 4 + 2] = si.getZ(i);
            u16[i * 4 + 3] = si.getW(i);
          }
          skinIndexPatches.push({ geo, prev: si });
          geo.setAttribute('skinIndex', new THREE.BufferAttribute(u16, 4));
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

interface FaceFrameMetrics {
  faceH: number;
  lipGapNorm: number;
  mouthWidthNorm: number;
  cornerLiftNorm: number;
  eyeGapNormL: number;
  eyeGapNormR: number;
  browHeightNormL: number;
  browHeightNormR: number;
}

function measureFaceMetrics(
  pos: Float32Array,
  targetQuat: THREE.Quaternion,
): FaceFrameMetrics {
  const v = (idx: number) =>
    new THREE.Vector3(pos[idx * 3], pos[idx * 3 + 1], pos[idx * 3 + 2]);

  const p454 = v(454);
  const p234 = v(234);
  const p10 = v(10);
  const p152 = v(152);
  const p13 = v(13);
  const p14 = v(14);
  const p61 = v(61);
  const p291 = v(291);
  const p386 = v(386);
  const p374 = v(374);
  const p159 = v(159);
  const p145 = v(145);
  const p334 = v(334);
  const p105 = v(105);

  const right = p454.sub(p234);
  if (right.lengthSq() < 1e-8) right.set(1, 0, 0);
  else right.normalize();

  const upVec = p10.sub(p152);
  const faceH = Math.max(0.06, upVec.length());
  if (upVec.lengthSq() < 1e-8) upVec.set(0, 1, 0);
  else upVec.normalize();

  const forward = new THREE.Vector3().crossVectors(right, upVec);
  if (forward.lengthSq() < 1e-8) forward.set(0, 0, 1);
  else forward.normalize();
  if (forward.z < 0) forward.negate();

  const orthoUp = new THREE.Vector3().crossVectors(forward, right).normalize();
  const basis = new THREE.Matrix4().makeBasis(right, orthoUp, forward);
  targetQuat.setFromRotationMatrix(basis).normalize();

  const cornerMid = p61.clone().add(p291).multiplyScalar(0.5);
  return {
    faceH,
    lipGapNorm: Math.max(0, p13.clone().sub(p14).dot(orthoUp)) / faceH,
    mouthWidthNorm: p61.distanceTo(p291) / faceH,
    cornerLiftNorm: cornerMid.sub(p13).dot(orthoUp) / faceH,
    eyeGapNormL: Math.max(0, p386.clone().sub(p374).dot(orthoUp)) / faceH,
    eyeGapNormR: Math.max(0, p159.clone().sub(p145).dot(orthoUp)) / faceH,
    browHeightNormL: p334.sub(p386).dot(orthoUp) / faceH,
    browHeightNormR: p105.sub(p159).dot(orthoUp) / faceH,
  };
}

export function buildFaceAnimationClip(
  rawFrames: PoseFrame[],
  faceRig: FaceExportRig,
  fps: number,
  clipName = 'Beast_Face_Capture',
): THREE.AnimationClip {
  const frames = resamplePoseFrames(rawFrames, fps);
  if (frames.length === 0) {
    return new THREE.AnimationClip(clipName, 0, []);
  }

  const times = new Float32Array(frames.length);
  for (let i = 0; i < frames.length; i++) {
    times[i] = frames[i].time;
  }

  const qCanonicalRest = new THREE.Quaternion();
  const restMetrics = measureFaceMetrics(
    faceRig.restFaceVertices,
    qCanonicalRest,
  );
  const qCanonicalRestInv = qCanonicalRest.clone().invert();

  const posBuffers = {} as Record<FaceExportBoneName, Float32Array>;
  const quatBuffers = {} as Record<FaceExportBoneName, Float32Array>;
  const scaleBuffers = {} as Record<FaceExportBoneName, Float32Array>;

  for (const name of FACE_EXPORT_BONES) {
    posBuffers[name] = new Float32Array(frames.length * 3);
    quatBuffers[name] = new Float32Array(frames.length * 4);
    scaleBuffers[name] = new Float32Array(frames.length * 3);
  }

  const qMeasured = new THREE.Quaternion();
  const qHead = new THREE.Quaternion();
  const qNeck = new THREE.Quaternion();
  const qHeadLocal = new THREE.Quaternion();
  const qBone = new THREE.Quaternion();
  const eulerTmp = new THREE.Euler();

  for (let i = 0; i < frames.length; i++) {
    const frame = frames[i];
    const bs = frame.faceBlendshapes ?? {};

    let fm: FaceFrameMetrics | null = null;
    if (frame.facePositions && frame.facePositions.length >= 468 * 3) {
      fm = measureFaceMetrics(frame.facePositions, qMeasured);
      qHead.copy(qMeasured).multiply(qCanonicalRestInv).normalize();
    } else {
      const nr = frame.rotations.Neck;
      const hr = frame.rotations.Head;
      qNeck.set(nr[0], nr[1], nr[2], nr[3]);
      qHeadLocal.set(hr[0], hr[1], hr[2], hr[3]);
      qHead.copy(qNeck).multiply(qHeadLocal).normalize();
    }

    const geomJaw = fm
      ? THREE.MathUtils.clamp(
          (fm.lipGapNorm - restMetrics.lipGapNorm - 0.005) / 0.125,
          0,
          1,
        )
      : 0;
    const jaw = THREE.MathUtils.clamp(
      Math.max(bs.jawOpen ?? 0, geomJaw),
      0,
      1,
    );

    const geomSmile = fm
      ? THREE.MathUtils.clamp(
          ((fm.cornerLiftNorm - restMetrics.cornerLiftNorm) / 0.04) * 0.65 +
            ((fm.mouthWidthNorm - restMetrics.mouthWidthNorm) / 0.05) * 0.35,
          0,
          1,
        )
      : 0;
    const geomPucker = fm
      ? THREE.MathUtils.clamp(
          (restMetrics.mouthWidthNorm - fm.mouthWidthNorm) / 0.05,
          0,
          1,
        )
      : 0;
    const geomBlinkL =
      fm && restMetrics.eyeGapNormL > 0.005
        ? THREE.MathUtils.clamp(
            1 - fm.eyeGapNormL / restMetrics.eyeGapNormL,
            0,
            1,
          )
        : 0;
    const geomBlinkR =
      fm && restMetrics.eyeGapNormR > 0.005
        ? THREE.MathUtils.clamp(
            1 - fm.eyeGapNormR / restMetrics.eyeGapNormR,
            0,
            1,
          )
        : 0;
    const geomBrowDeltaL = fm
      ? THREE.MathUtils.clamp(
          (fm.browHeightNormL - restMetrics.browHeightNormL) / 0.035,
          -1,
          1,
        )
      : 0;
    const geomBrowDeltaR = fm
      ? THREE.MathUtils.clamp(
          (fm.browHeightNormR - restMetrics.browHeightNormR) / 0.035,
          -1,
          1,
        )
      : 0;

    const funnel = THREE.MathUtils.clamp(bs.mouthFunnel ?? 0, 0, 1);
    const pucker = THREE.MathUtils.clamp(
      Math.max(bs.mouthPucker ?? 0, geomPucker),
      0,
      1,
    );
    const smileL = THREE.MathUtils.clamp(
      Math.max(bs.mouthSmileLeft ?? 0, geomSmile),
      0,
      1,
    );
    const smileR = THREE.MathUtils.clamp(
      Math.max(bs.mouthSmileRight ?? 0, geomSmile),
      0,
      1,
    );
    const frownL = THREE.MathUtils.clamp(bs.mouthFrownLeft ?? 0, 0, 1);
    const frownR = THREE.MathUtils.clamp(bs.mouthFrownRight ?? 0, 0, 1);
    const blinkL = THREE.MathUtils.clamp(
      Math.max(bs.eyeBlinkLeft ?? 0, geomBlinkL),
      0,
      1,
    );
    const blinkR = THREE.MathUtils.clamp(
      Math.max(bs.eyeBlinkRight ?? 0, geomBlinkR),
      0,
      1,
    );
    const wideL = THREE.MathUtils.clamp(bs.eyeWideLeft ?? 0, 0, 1);
    const wideR = THREE.MathUtils.clamp(bs.eyeWideRight ?? 0, 0, 1);
    const browInner = THREE.MathUtils.clamp(bs.browInnerUp ?? 0, 0, 1);
    const browUpL = THREE.MathUtils.clamp(
      Math.max(bs.browOuterUpLeft ?? 0, Math.max(0, geomBrowDeltaL)),
      0,
      1,
    );
    const browUpR = THREE.MathUtils.clamp(
      Math.max(bs.browOuterUpRight ?? 0, Math.max(0, geomBrowDeltaR)),
      0,
      1,
    );
    const browDnL = THREE.MathUtils.clamp(
      Math.max(bs.browDownLeft ?? 0, Math.max(0, -geomBrowDeltaL)),
      0,
      1,
    );
    const browDnR = THREE.MathUtils.clamp(
      Math.max(bs.browDownRight ?? 0, Math.max(0, -geomBrowDeltaR)),
      0,
      1,
    );

    for (const name of FACE_EXPORT_BONES) {
      const rest = faceRig.restPositions[name];
      let px = rest.x;
      let py = rest.y;
      let pz = rest.z;
      let rx = 0;
      let ry = 0;
      let rz = 0;

      if (name === 'Head') {
        // Handled with qHead directly
      } else if (name === 'Jaw') {
        rx = jaw * 0.46;
        py -= jaw * 0.009;
        pz -= jaw * 0.0025;
      } else if (name === 'UpperLip') {
        py += jaw * 0.0035 + funnel * 0.004;
        pz += (pucker + funnel) * 0.005;
      } else if (name === 'MouthCornerL') {
        px += smileL * 0.0065 - pucker * 0.0075;
        py += smileL * 0.0075 - frownL * 0.0065 - jaw * 0.002;
        pz -= smileL * 0.0035 - pucker * 0.006;
        rz = smileL * 0.16 - frownL * 0.16;
      } else if (name === 'MouthCornerR') {
        px -= smileR * 0.0065 - pucker * 0.0075;
        py += smileR * 0.0075 - frownR * 0.0065 - jaw * 0.002;
        pz -= smileR * 0.0035 - pucker * 0.006;
        rz = -smileR * 0.16 + frownR * 0.16;
      } else if (name === 'UpperLidL') {
        py += -blinkL * 0.0085 + wideL * 0.003;
      } else if (name === 'UpperLidR') {
        py += -blinkR * 0.0085 + wideR * 0.003;
      } else if (name === 'LowerLidL') {
        py += blinkL * 0.004;
      } else if (name === 'LowerLidR') {
        py += blinkR * 0.004;
      } else if (name === 'BrowL') {
        py += (browInner * 0.65 + browUpL * 0.6 - browDnL * 0.7) * 0.0085;
        rz = (browInner - browUpL) * 0.11;
      } else if (name === 'BrowR') {
        py += (browInner * 0.65 + browUpR * 0.6 - browDnR * 0.7) * 0.0085;
        rz = -(browInner - browUpR) * 0.11;
      }

      posBuffers[name][i * 3] = px;
      posBuffers[name][i * 3 + 1] = py;
      posBuffers[name][i * 3 + 2] = pz;

      scaleBuffers[name][i * 3] = 1;
      scaleBuffers[name][i * 3 + 1] = 1;
      scaleBuffers[name][i * 3 + 2] = 1;

      if (name === 'Head') {
        quatBuffers[name][i * 4] = qHead.x;
        quatBuffers[name][i * 4 + 1] = qHead.y;
        quatBuffers[name][i * 4 + 2] = qHead.z;
        quatBuffers[name][i * 4 + 3] = qHead.w;
      } else {
        eulerTmp.set(rx, ry, rz, 'YXZ');
        qBone.setFromEuler(eulerTmp);
        quatBuffers[name][i * 4] = qBone.x;
        quatBuffers[name][i * 4 + 1] = qBone.y;
        quatBuffers[name][i * 4 + 2] = qBone.z;
        quatBuffers[name][i * 4 + 3] = qBone.w;
      }
    }
  }

  const tracks: THREE.KeyframeTrack[] = [];
  for (const name of FACE_EXPORT_BONES) {
    const boneTarget = faceRig.bones[name].uuid;
    tracks.push(
      new THREE.VectorKeyframeTrack(
        `${boneTarget}.position`,
        times,
        posBuffers[name],
      ),
    );
    tracks.push(
      new THREE.VectorKeyframeTrack(
        `${boneTarget}.scale`,
        times,
        scaleBuffers[name],
      ),
    );
    tracks.push(
      new THREE.QuaternionKeyframeTrack(
        `${boneTarget}.quaternion`,
        times,
        quatBuffers[name],
      ),
    );
  }

  const duration = times[times.length - 1];
  return new THREE.AnimationClip(clipName, duration, tracks);
}

function selectNeutralReferencePositions(
  clips: Array<{ frames: PoseFrame[] }>,
): Float32Array | undefined {
  let bestPos: Float32Array | undefined;
  let bestScore = Infinity;
  const qTmp = new THREE.Quaternion();

  for (const clip of clips) {
    for (const f of clip.frames) {
      if (!f.facePositions || f.facePositions.length < 468 * 3) continue;
      const m = measureFaceMetrics(f.facePositions, qTmp);
      const score = m.lipGapNorm + (f.faceBlendshapes?.jawOpen ?? 0) * 0.25;
      if (score < bestScore) {
        bestScore = score;
        bestPos = f.facePositions;
      }
    }
  }
  return bestPos;
}

export async function buildFaceMeshMultiGLBBuffer(
  clips: Array<{ name: string; frames: PoseFrame[]; fps?: number }>,
  options: { fps: number },
): Promise<ArrayBuffer> {
  const refPositions = selectNeutralReferencePositions(clips);
  const faceRig = buildRiggedFaceExportModel(refPositions);

  try {
    const usedNames = new Set<string>();
    const builtClips: THREE.AnimationClip[] = [];

    clips.forEach((clipDef, idx) => {
      if (clipDef.frames.length < 2) return;
      const baseName = clipDef.name.trim() || `Face_Clip_${idx + 1}`;
      let uniqueName = baseName;
      let suffix = 2;
      while (usedNames.has(uniqueName)) {
        uniqueName = `${baseName}_${suffix++}`;
      }
      usedNames.add(uniqueName);

      builtClips.push(
        buildFaceAnimationClip(
          clipDef.frames,
          faceRig,
          clipDef.fps ?? options.fps,
          uniqueName,
        ),
      );
    });

    if (builtClips.length === 0) {
      throw new Error('No valid face animation clips with at least 2 frames to export.');
    }

    const exporter = new GLTFExporter();
    const rawGlbBuffer = (await exporter.parseAsync(faceRig.rootObject, {
      binary: true,
      animations: builtClips,
      onlyVisible: false,
    })) as ArrayBuffer;

    return normalizeGlbBufferViews(rawGlbBuffer);
  } finally {
    faceRig.dispose();
  }
}

export async function exportFaceMeshMultiGLB(
  clips: Array<{ name: string; frames: PoseFrame[]; fps?: number }>,
  options: {
    fps: number;
    filename: string;
  },
): Promise<void> {
  const glbBuffer = await buildFaceMeshMultiGLBBuffer(clips, {
    fps: options.fps,
  });
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

export async function exportFaceMeshGLB(
  rawFrames: PoseFrame[],
  options: {
    fps: number;
    filename: string;
  },
): Promise<void> {
  return exportFaceMeshMultiGLB(
    [
      {
        name: options.filename.replace(/\.glb$/i, ''),
        frames: rawFrames,
        fps: options.fps,
      },
    ],
    options,
  );
}

export type { AnimationTakeClip };
