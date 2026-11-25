import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import {
  MIXAMO_BONES,
  formatMixamoBoneName,
  type BoneNamingScheme,
  type MixamoBoneName,
} from '../types/mocap';

export interface MixamoBoneDef {
  name: MixamoBoneName;
  parent: MixamoBoneName | null;
  offset: [number, number, number]; // meters in T-pose relative to parent
  endSiteOffset?: [number, number, number];
}

export const MIXAMO_HIERARCHY: MixamoBoneDef[] = [
  { name: 'Hips', parent: null, offset: [0, 0.96, 0] },
  { name: 'Spine', parent: 'Hips', offset: [0, 0.11, 0] },
  { name: 'Spine1', parent: 'Spine', offset: [0, 0.13, 0] },
  { name: 'Spine2', parent: 'Spine1', offset: [0, 0.14, 0] },
  { name: 'Neck', parent: 'Spine2', offset: [0, 0.15, 0] },
  {
    name: 'Head',
    parent: 'Neck',
    offset: [0, 0.10, 0],
    endSiteOffset: [0, 0.19, 0],
  },

  { name: 'LeftShoulder', parent: 'Spine2', offset: [0.06, 0.11, 0] },
  { name: 'LeftArm', parent: 'LeftShoulder', offset: [0.12, 0, 0] },
  { name: 'LeftForeArm', parent: 'LeftArm', offset: [0.27, 0, 0] },
  {
    name: 'LeftHand',
    parent: 'LeftForeArm',
    offset: [0.25, 0, 0],
    endSiteOffset: [0.16, 0, 0],
  },

  { name: 'RightShoulder', parent: 'Spine2', offset: [-0.06, 0.11, 0] },
  { name: 'RightArm', parent: 'RightShoulder', offset: [-0.12, 0, 0] },
  { name: 'RightForeArm', parent: 'RightArm', offset: [-0.27, 0, 0] },
  {
    name: 'RightHand',
    parent: 'RightForeArm',
    offset: [-0.25, 0, 0],
    endSiteOffset: [-0.16, 0, 0],
  },

  { name: 'LeftUpLeg', parent: 'Hips', offset: [0.10, -0.05, 0] },
  { name: 'LeftLeg', parent: 'LeftUpLeg', offset: [0, -0.43, 0] },
  { name: 'LeftFoot', parent: 'LeftLeg', offset: [0, -0.41, 0] },
  {
    name: 'LeftToeBase',
    parent: 'LeftFoot',
    offset: [0, -0.05, 0.13],
    endSiteOffset: [0, -0.02, 0.08],
  },

  { name: 'RightUpLeg', parent: 'Hips', offset: [-0.10, -0.05, 0] },
  { name: 'RightLeg', parent: 'RightUpLeg', offset: [0, -0.43, 0] },
  { name: 'RightFoot', parent: 'RightLeg', offset: [0, -0.41, 0] },
  {
    name: 'RightToeBase',
    parent: 'RightFoot',
    offset: [0, -0.05, 0.13],
    endSiteOffset: [0, -0.02, 0.08],
  },
];

export interface ActiveMixamoRig {
  rootObject: THREE.Object3D;
  bones: Record<MixamoBoneName, THREE.Bone | null>;
  restLocalPositions: Record<MixamoBoneName, THREE.Vector3>;
  restLocalQuaternions: Record<MixamoBoneName, THREE.Quaternion>;
  restWorldQuaternions: Record<MixamoBoneName, THREE.Quaternion>;
  hipsRestHeight: number;
  isCustomModel: boolean;
  label: string;
  morphMeshes: THREE.Mesh[];
}

function addSkinnedPart(
  parts: THREE.BufferGeometry[],
  geo: THREE.BufferGeometry,
  boneIndex: number,
  colorHex: number,
  worldOffset: THREE.Vector3,
  rotationEuler?: THREE.Euler,
): void {
  const g = geo.index ? geo.toNonIndexed() : geo.clone();
  if (rotationEuler) {
    g.rotateX(rotationEuler.x);
    g.rotateY(rotationEuler.y);
    g.rotateZ(rotationEuler.z);
  }
  g.translate(worldOffset.x, worldOffset.y, worldOffset.z);
  g.computeVertexNormals();

  // Keep only position and normal before adding color + skin attributes
  for (const key of Object.keys(g.attributes)) {
    if (key !== 'position' && key !== 'normal') {
      g.deleteAttribute(key);
    }
  }

  const count = g.attributes.position.count;
  const col = new THREE.Color(colorHex);
  const colors = new Float32Array(count * 3);
  const skinIndices = new Uint16Array(count * 4);
  const skinWeights = new Float32Array(count * 4);

  for (let i = 0; i < count; i++) {
    colors[i * 3] = col.r;
    colors[i * 3 + 1] = col.g;
    colors[i * 3 + 2] = col.b;

    skinIndices[i * 4] = boneIndex;
    skinWeights[i * 4] = 1.0;
  }

  g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  g.setAttribute('skinIndex', new THREE.BufferAttribute(skinIndices, 4));
  g.setAttribute('skinWeight', new THREE.BufferAttribute(skinWeights, 4));

  parts.push(g);
  geo.dispose();
}

export function buildMixamoMannequinRig(
  namingScheme: BoneNamingScheme = 'mixamo-colon',
): ActiveMixamoRig {
  const rootGroup = new THREE.Group();
  rootGroup.name = 'Mixamo_Rig_Root';

  const boneMap = {} as Record<MixamoBoneName, THREE.Bone>;
  const boneArray: THREE.Bone[] = [];
  const boneIndexMap = {} as Record<MixamoBoneName, number>;

  MIXAMO_HIERARCHY.forEach((def, idx) => {
    const bone = new THREE.Bone();
    bone.name = formatMixamoBoneName(def.name, namingScheme);
    bone.position.set(def.offset[0], def.offset[1], def.offset[2]);
    boneMap[def.name] = bone;
    boneIndexMap[def.name] = idx;
    boneArray.push(bone);

    if (def.parent) {
      boneMap[def.parent].add(bone);
    } else {
      rootGroup.add(bone);
    }
  });

  rootGroup.updateMatrixWorld(true);

  const wp = (name: MixamoBoneName): THREE.Vector3 => {
    const v = new THREE.Vector3();
    boneMap[name].getWorldPosition(v);
    return v;
  };

  // Sculpted biomechanical studio mannequin parts
  const parts: THREE.BufferGeometry[] = [];
  const C_SHELL = 0x262d3a; // Graphite matte chassis
  const C_PLATE = 0x384254; // Slate armor plate
  const C_JOINT = 0x94a3b8; // Brushed titanium joint
  const C_VISOR = 0xf59e0b; // Precision amber sensor band
  const C_BOOT = 0x181d26; // Dark sole/boot

  // Pelvis / Hips
  const hipsPos = wp('Hips');
  addSkinnedPart(
    parts,
    new THREE.CylinderGeometry(0.115, 0.105, 0.14, 14),
    boneIndexMap.Hips,
    C_SHELL,
    hipsPos,
  );
  addSkinnedPart(
    parts,
    new THREE.TorusGeometry(0.112, 0.012, 8, 20),
    boneIndexMap.Hips,
    C_JOINT,
    hipsPos.clone().add(new THREE.Vector3(0, 0.055, 0)),
    new THREE.Euler(Math.PI / 2, 0, 0),
  );

  // Spine, Spine1, Spine2 (tapered torso)
  addSkinnedPart(
    parts,
    new THREE.CylinderGeometry(0.115, 0.105, 0.13, 14),
    boneIndexMap.Spine,
    C_SHELL,
    wp('Spine').add(new THREE.Vector3(0, 0.06, 0)),
  );
  addSkinnedPart(
    parts,
    new THREE.CylinderGeometry(0.135, 0.115, 0.14, 14),
    boneIndexMap.Spine1,
    C_PLATE,
    wp('Spine1').add(new THREE.Vector3(0, 0.065, 0)),
  );
  // Ribcage / Chest
  const chestPos = wp('Spine2').add(new THREE.Vector3(0, 0.065, 0));
  const chestGeo = new THREE.CylinderGeometry(0.155, 0.135, 0.15, 16);
  chestGeo.scale(1.12, 1, 0.78);
  addSkinnedPart(parts, chestGeo, boneIndexMap.Spine2, C_PLATE, chestPos);
  // Chest sternum marker (indicates +Z forward facing clearly)
  addSkinnedPart(
    parts,
    new THREE.BoxGeometry(0.08, 0.04, 0.025),
    boneIndexMap.Spine2,
    C_VISOR,
    chestPos.clone().add(new THREE.Vector3(0, 0.02, 0.118)),
  );

  // Neck & Classic Biomechanical Studio Mannequin Head
  addSkinnedPart(
    parts,
    new THREE.CylinderGeometry(0.042, 0.048, 0.11, 12),
    boneIndexMap.Neck,
    C_JOINT,
    wp('Neck').add(new THREE.Vector3(0, 0.045, 0)),
  );
  const headCenter = wp('Head').add(new THREE.Vector3(0, 0.095, 0.005));
  const headGeo = new THREE.SphereGeometry(0.094, 18, 16);
  headGeo.scale(0.86, 1.14, 0.98);
  addSkinnedPart(parts, headGeo, boneIndexMap.Head, C_PLATE, headCenter);
  // Jaw / chin plate
  addSkinnedPart(
    parts,
    new THREE.BoxGeometry(0.088, 0.046, 0.082),
    boneIndexMap.Head,
    C_SHELL,
    headCenter.clone().add(new THREE.Vector3(0, -0.058, 0.022)),
  );
  // Precision amber visor strip (clear +Z forward indicator)
  addSkinnedPart(
    parts,
    new THREE.BoxGeometry(0.116, 0.024, 0.026),
    boneIndexMap.Head,
    C_VISOR,
    headCenter.clone().add(new THREE.Vector3(0, 0.016, 0.078)),
  );
  // Lateral ear sensor discs
  for (const side of [-1, 1]) {
    addSkinnedPart(
      parts,
      new THREE.CylinderGeometry(0.026, 0.026, 0.018, 14),
      boneIndexMap.Head,
      C_JOINT,
      headCenter.clone().add(new THREE.Vector3(side * 0.082, 0, -0.005)),
      new THREE.Euler(0, 0, Math.PI / 2),
    );
  }

  // Arms helper
  const buildArm = (
    side: 'Left' | 'Right',
    dir: number,
  ) => {
    const shName = `${side}Shoulder` as MixamoBoneName;
    const armName = `${side}Arm` as MixamoBoneName;
    const foreName = `${side}ForeArm` as MixamoBoneName;
    const handName = `${side}Hand` as MixamoBoneName;

    // Clavicle bar
    addSkinnedPart(
      parts,
      new THREE.CylinderGeometry(0.036, 0.042, 0.12, 10),
      boneIndexMap[shName],
      C_SHELL,
      wp(shName).add(new THREE.Vector3(dir * 0.06, 0, 0)),
      new THREE.Euler(0, 0, Math.PI / 2),
    );
    // Shoulder deltoid ball
    addSkinnedPart(
      parts,
      new THREE.SphereGeometry(0.054, 14, 12),
      boneIndexMap[armName],
      C_JOINT,
      wp(armName),
    );
    // Upper arm
    addSkinnedPart(
      parts,
      new THREE.CylinderGeometry(0.046, 0.038, 0.25, 12),
      boneIndexMap[armName],
      C_PLATE,
      wp(armName).add(new THREE.Vector3(dir * 0.135, 0, 0)),
      new THREE.Euler(0, 0, Math.PI / 2),
    );
    // Elbow joint
    addSkinnedPart(
      parts,
      new THREE.SphereGeometry(0.04, 12, 10),
      boneIndexMap[foreName],
      C_JOINT,
      wp(foreName),
    );
    // Forearm
    addSkinnedPart(
      parts,
      new THREE.CylinderGeometry(0.038, 0.029, 0.23, 12),
      boneIndexMap[foreName],
      C_SHELL,
      wp(foreName).add(new THREE.Vector3(dir * 0.125, 0, 0)),
      new THREE.Euler(0, 0, Math.PI / 2),
    );
    // Wrist & Hand blade
    addSkinnedPart(
      parts,
      new THREE.SphereGeometry(0.028, 10, 10),
      boneIndexMap[handName],
      C_JOINT,
      wp(handName),
    );
    addSkinnedPart(
      parts,
      new THREE.BoxGeometry(0.13, 0.024, 0.072),
      boneIndexMap[handName],
      C_PLATE,
      wp(handName).add(new THREE.Vector3(dir * 0.075, 0, 0)),
    );
  };

  buildArm('Left', 1);
  buildArm('Right', -1);

  // Legs helper
  const buildLeg = (side: 'Left' | 'Right') => {
    const upName = `${side}UpLeg` as MixamoBoneName;
    const legName = `${side}Leg` as MixamoBoneName;
    const footName = `${side}Foot` as MixamoBoneName;
    const toeName = `${side}ToeBase` as MixamoBoneName;

    // Hip joint sphere
    addSkinnedPart(
      parts,
      new THREE.SphereGeometry(0.062, 12, 12),
      boneIndexMap[upName],
      C_JOINT,
      wp(upName),
    );
    // Thigh
    addSkinnedPart(
      parts,
      new THREE.CylinderGeometry(0.068, 0.05, 0.40, 14),
      boneIndexMap[upName],
      C_PLATE,
      wp(upName).add(new THREE.Vector3(0, -0.215, 0)),
    );
    // Knee sphere + cap
    addSkinnedPart(
      parts,
      new THREE.SphereGeometry(0.05, 12, 12),
      boneIndexMap[legName],
      C_JOINT,
      wp(legName),
    );
    // Shin
    addSkinnedPart(
      parts,
      new THREE.CylinderGeometry(0.05, 0.036, 0.39, 14),
      boneIndexMap[legName],
      C_SHELL,
      wp(legName).add(new THREE.Vector3(0, -0.205, 0)),
    );
    // Ankle
    addSkinnedPart(
      parts,
      new THREE.SphereGeometry(0.038, 10, 10),
      boneIndexMap[footName],
      C_JOINT,
      wp(footName),
    );
    // Heel / Midfoot
    addSkinnedPart(
      parts,
      new THREE.BoxGeometry(0.082, 0.062, 0.145),
      boneIndexMap[footName],
      C_BOOT,
      wp(footName).add(new THREE.Vector3(0, -0.038, 0.045)),
    );
    // Toe box
    addSkinnedPart(
      parts,
      new THREE.BoxGeometry(0.078, 0.036, 0.085),
      boneIndexMap[toeName],
      C_BOOT,
      wp(toeName).add(new THREE.Vector3(0, -0.002, 0.028)),
    );
  };

  buildLeg('Left');
  buildLeg('Right');

  const mergedGeo = mergeGeometries(parts, false);
  parts.forEach((p) => p.dispose());

  const material = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.42,
    metalness: 0.35,
  });

  const skinnedMesh = new THREE.SkinnedMesh(mergedGeo, material);
  skinnedMesh.name = 'Beast_Mixamo_Mannequin';
  skinnedMesh.castShadow = true;
  skinnedMesh.receiveShadow = true;

  const skeleton = new THREE.Skeleton(boneArray);
  skinnedMesh.bind(skeleton);
  rootGroup.add(skinnedMesh);

  rootGroup.updateMatrixWorld(true);

  const restLocalPositions = {} as Record<MixamoBoneName, THREE.Vector3>;
  const restLocalQuaternions = {} as Record<MixamoBoneName, THREE.Quaternion>;
  const restWorldQuaternions = {} as Record<MixamoBoneName, THREE.Quaternion>;

  for (const name of MIXAMO_BONES) {
    const b = boneMap[name];
    restLocalPositions[name] = b.position.clone();
    restLocalQuaternions[name] = b.quaternion.clone();
    const wq = new THREE.Quaternion();
    b.getWorldQuaternion(wq);
    restWorldQuaternions[name] = wq;
  }

  return {
    rootObject: rootGroup,
    bones: boneMap,
    restLocalPositions,
    restLocalQuaternions,
    restWorldQuaternions,
    hipsRestHeight: 0.96,
    isCustomModel: false,
    label: 'Built-in Mixamo Mannequin',
    morphMeshes: [],
  };
}

function normalizeBoneKey(rawName: string): string {
  return rawName
    .toLowerCase()
    .replace(/^mixamorig\d*[:_]?/, '')
    .replace(/^armature[:_]?/, '')
    .replace(/[^a-z0-9]/g, '');
}

const BONE_ALIAS_LOOKUP: Record<string, MixamoBoneName> = {
  hips: 'Hips',
  pelvis: 'Hips',
  root: 'Hips',
  spine: 'Spine',
  spine1: 'Spine1',
  spine2: 'Spine2',
  chest: 'Spine2',
  neck: 'Neck',
  head: 'Head',
  leftshoulder: 'LeftShoulder',
  lclavicle: 'LeftShoulder',
  leftarm: 'LeftArm',
  leftupperarm: 'LeftArm',
  lupperarm: 'LeftArm',
  leftforearm: 'LeftForeArm',
  leftlowerarm: 'LeftForeArm',
  lforearm: 'LeftForeArm',
  lefthand: 'LeftHand',
  lhand: 'LeftHand',
  rightshoulder: 'RightShoulder',
  rclavicle: 'RightShoulder',
  rightarm: 'RightArm',
  rightupperarm: 'RightArm',
  rupperarm: 'RightArm',
  rightforearm: 'RightForeArm',
  rightlowerarm: 'RightForeArm',
  rforearm: 'RightForeArm',
  righthand: 'RightHand',
  rhand: 'RightHand',
  leftupleg: 'LeftUpLeg',
  leftthigh: 'LeftUpLeg',
  lthigh: 'LeftUpLeg',
  leftleg: 'LeftLeg',
  leftshin: 'LeftLeg',
  leftcalf: 'LeftLeg',
  lcalf: 'LeftLeg',
  leftfoot: 'LeftFoot',
  lfoot: 'LeftFoot',
  lefttoebase: 'LeftToeBase',
  lefttoe: 'LeftToeBase',
  ltoe: 'LeftToeBase',
  rightupleg: 'RightUpLeg',
  rightthigh: 'RightUpLeg',
  rthigh: 'RightUpLeg',
  rightleg: 'RightLeg',
  rightshin: 'RightLeg',
  rightcalf: 'RightLeg',
  rcalf: 'RightLeg',
  rightfoot: 'RightFoot',
  rfoot: 'RightFoot',
  righttoebase: 'RightToeBase',
  righttoe: 'RightToeBase',
  rtoe: 'RightToeBase',
};

export function extractMixamoRigFromGLTF(
  sceneRoot: THREE.Object3D,
  label: string,
): ActiveMixamoRig | null {
  sceneRoot.updateMatrixWorld(true);

  const bones = {} as Record<MixamoBoneName, THREE.Bone | null>;
  for (const b of MIXAMO_BONES) {
    bones[b] = null;
  }

  let matchedCount = 0;
  const morphMeshes: THREE.Mesh[] = [];
  sceneRoot.traverse((obj) => {
    if ((obj as THREE.Mesh).isMesh) {
      const mesh = obj as THREE.Mesh;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      if (mesh.morphTargetDictionary && mesh.morphTargetInfluences) {
        morphMeshes.push(mesh);
      }
    }
    if ((obj as THREE.Bone).isBone) {
      const key = normalizeBoneKey(obj.name);
      const mapped = BONE_ALIAS_LOOKUP[key];
      if (mapped && !bones[mapped]) {
        bones[mapped] = obj as THREE.Bone;
        matchedCount++;
      }
    }
  });

  if (!bones.Hips || matchedCount < 8) {
    return null;
  }

  // Normalize scale if model was exported in centimeters (e.g., ~170 units tall)
  const box = new THREE.Box3().setFromObject(sceneRoot);
  const size = new THREE.Vector3();
  box.getSize(size);
  if (size.y > 10) {
    sceneRoot.scale.multiplyScalar(0.01);
    sceneRoot.updateMatrixWorld(true);
  }

  const restLocalPositions = {} as Record<MixamoBoneName, THREE.Vector3>;
  const restLocalQuaternions = {} as Record<MixamoBoneName, THREE.Quaternion>;
  const restWorldQuaternions = {} as Record<MixamoBoneName, THREE.Quaternion>;

  for (const name of MIXAMO_BONES) {
    const b = bones[name];
    if (b) {
      restLocalPositions[name] = b.position.clone();
      restLocalQuaternions[name] = b.quaternion.clone();
      const wq = new THREE.Quaternion();
      b.getWorldQuaternion(wq);
      restWorldQuaternions[name] = wq;
    } else {
      restLocalPositions[name] = new THREE.Vector3();
      restLocalQuaternions[name] = new THREE.Quaternion();
      restWorldQuaternions[name] = new THREE.Quaternion();
    }
  }

  const hipsWorld = new THREE.Vector3();
  bones.Hips.getWorldPosition(hipsWorld);

  return {
    rootObject: sceneRoot,
    bones,
    restLocalPositions,
    restLocalQuaternions,
    restWorldQuaternions,
    hipsRestHeight: Math.max(hipsWorld.y, 0.5),
    isCustomModel: true,
    label,
    morphMeshes,
  };
}

export function renameMixamoRigBones(
  rig: ActiveMixamoRig,
  scheme: BoneNamingScheme,
): void {
  if (rig.isCustomModel) return;
  for (const name of MIXAMO_BONES) {
    const bone = rig.bones[name];
    if (bone) {
      bone.name = formatMixamoBoneName(name, scheme);
    }
  }
}

export function resetRigToTPose(rig: ActiveMixamoRig): void {
  for (const name of MIXAMO_BONES) {
    const bone = rig.bones[name];
    if (bone) {
      bone.position.copy(rig.restLocalPositions[name]);
      bone.quaternion.copy(rig.restLocalQuaternions[name]);
    }
  }
  for (const mesh of rig.morphMeshes) {
    if (mesh.morphTargetInfluences) {
      mesh.morphTargetInfluences.fill(0);
    }
  }
  rig.rootObject.updateMatrixWorld(true);
}
