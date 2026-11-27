import * as THREE from 'three';
import {
  BlockingVolume,
  EngineExportPayload,
  PhysicsMeshType,
  PlacementConfig,
  SnapStep,
  Vec3,
  VolumeCategory,
  VolumePhysics,
} from '../types/volume';

export const DEFAULT_AMBIENT_COLOR: Vec3 = [0.5, 0.5, 0.5];
export const DEFAULT_IS_BLEND = false;
export const DEFAULT_BLEND_ALPHA = 0.5;
export const DEFAULT_TEX_PATH = './res/textures/blankgray2.webp';
export const DEFAULT_OBJ_FILE_PATH = './res/meshes/blender/cube.obj';
export const DEFAULT_GLB_FILE_PATH = './res/meshes/glb/ring1.glb';

export const PHYSICS_MESH_TYPES: PhysicsMeshType[] = [
  'SoftBody',
  'Cloth',
  'Heightfield',
  'Sphere',
  'Cube',
  'Capsule',
  'Cylinder',
  'Cone',
  'ConvexHull',
  'BvhMesh',
];

export const DEFAULT_PHYSICS: VolumePhysics = {
  enabled: false,
  mass: 0,
  group: 1,
  meshType: 'Cube',
};

export const CATEGORY_META: Record<
  VolumeCategory,
  { label: string; shortLabel: string; colorHex: string; edgeHex: string; opacity: number }
> = {
  solid: {
    label: 'Solid Blocker',
    shortLabel: 'Solid',
    colorHex: '#64748b',
    edgeHex: '#cbd5e1',
    opacity: 0.94,
  },
  trigger: {
    label: 'Trigger Zone',
    shortLabel: 'Trigger',
    colorHex: '#0891b2',
    edgeHex: '#67e8f9',
    opacity: 0.56,
  },
  clip: {
    label: 'Player Clip',
    shortLabel: 'Clip',
    colorHex: '#d97706',
    edgeHex: '#fcd34d',
    opacity: 0.72,
  },
  hazard: {
    label: 'Hazard Volume',
    shortLabel: 'Hazard',
    colorHex: '#e11d48',
    edgeHex: '#fda4af',
    opacity: 0.78,
  },
  obj: {
    label: 'OBJ Mesh Proxy',
    shortLabel: 'OBJ',
    colorHex: '#8b5cf6',
    edgeHex: '#ddd6fe',
    opacity: 0.9,
  },
  glb: {
    label: 'GLB Mesh Proxy',
    shortLabel: 'GLB',
    colorHex: '#10b981',
    edgeHex: '#a7f3d0',
    opacity: 0.9,
  },
};

export function isAssetCategory(category: VolumeCategory): boolean {
  return category === 'obj' || category === 'glb';
}

export function getDefaultFilePathForCategory(category: VolumeCategory): string {
  if (category === 'obj') return DEFAULT_OBJ_FILE_PATH;
  if (category === 'glb') return DEFAULT_GLB_FILE_PATH;
  return '';
}

export function resolveAssetPathsOnCategoryChange(
  nextCategory: VolumeCategory,
  currentFilePath = '',
  currentTexPath = ''
): { filePath: string; texPath: string } {
  if (!isAssetCategory(nextCategory)) {
    const wasDefaultFile =
      currentFilePath === DEFAULT_OBJ_FILE_PATH ||
      currentFilePath === DEFAULT_GLB_FILE_PATH;
    const wasDefaultTex = currentTexPath === DEFAULT_TEX_PATH;
    return {
      filePath: wasDefaultFile ? '' : currentFilePath,
      texPath: wasDefaultTex ? '' : currentTexPath,
    };
  }
  const nextDefaultFile = getDefaultFilePathForCategory(nextCategory);
  const isEmptyOrOtherDefault =
    !currentFilePath.trim() ||
    currentFilePath === DEFAULT_OBJ_FILE_PATH ||
    currentFilePath === DEFAULT_GLB_FILE_PATH;
  return {
    filePath: isEmptyOrOtherDefault ? nextDefaultFile : currentFilePath,
    texPath: currentTexPath.trim() ? currentTexPath : DEFAULT_TEX_PATH,
  };
}

export function clamp01(val: number): number {
  return Math.min(1, Math.max(0, Number.isFinite(val) ? val : 0));
}

export function normalizePhysics(raw?: unknown): VolumePhysics {
  const obj = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const rawEnabled =
    obj.enabled !== undefined
      ? obj.enabled
      : obj.enbled !== undefined
        ? obj.enbled
        : DEFAULT_PHYSICS.enabled;
  const rawMass = Number(obj.mass);
  const rawGroup = Number(obj.group);
  const rawMeshType = String(obj.meshType ?? DEFAULT_PHYSICS.meshType);
  const meshType: PhysicsMeshType = PHYSICS_MESH_TYPES.includes(rawMeshType as PhysicsMeshType)
    ? (rawMeshType as PhysicsMeshType)
    : DEFAULT_PHYSICS.meshType;

  return {
    enabled: Boolean(rawEnabled),
    mass: Number.isFinite(rawMass) ? roundNum(Math.max(0, rawMass), 3) : DEFAULT_PHYSICS.mass,
    group: Number.isFinite(rawGroup) ? Math.trunc(rawGroup) : DEFAULT_PHYSICS.group,
    meshType,
  };
}

export function roundNum(val: number, decimals = 3): number {
  const factor = Math.pow(10, decimals);
  const rounded = Math.round(val * factor) / factor;
  return Object.is(rounded, -0) ? 0 : rounded;
}

export function roundVec3(v: Vec3, decimals = 3): Vec3 {
  return [
    roundNum(v[0], decimals),
    roundNum(v[1], decimals),
    roundNum(v[2], decimals),
  ];
}

export function normalizeVolume(raw: Partial<BlockingVolume>, idx = 0): BlockingVolume {
  const rawCat = String(raw.category || 'solid');
  const category: VolumeCategory =
    rawCat === 'solid' ||
    rawCat === 'trigger' ||
    rawCat === 'clip' ||
    rawCat === 'hazard' ||
    rawCat === 'obj' ||
    rawCat === 'glb'
      ? rawCat
      : 'solid';

  const ambRaw = raw.ambientColor;
  const ambientColor: Vec3 =
    Array.isArray(ambRaw) && ambRaw.length === 3
      ? [
          roundNum(clamp01(Number(ambRaw[0])), 3),
          roundNum(clamp01(Number(ambRaw[1])), 3),
          roundNum(clamp01(Number(ambRaw[2])), 3),
        ]
      : [...DEFAULT_AMBIENT_COLOR];

  return {
    id: typeof raw.id === 'string' && raw.id.trim() ? raw.id : `vol_${Date.now()}_${idx}`,
    name:
      typeof raw.name === 'string' && raw.name.trim()
        ? raw.name
        : `Block ${String(idx + 1).padStart(2, '0')}`,
    category,
    position:
      Array.isArray(raw.position) && raw.position.length === 3
        ? roundVec3(raw.position.map(Number) as Vec3, 3)
        : [0, 1, 0],
    rotation:
      Array.isArray(raw.rotation) && raw.rotation.length === 3
        ? roundVec3(raw.rotation.map(Number) as Vec3, 2)
        : [0, 0, 0],
    scale:
      Array.isArray(raw.scale) && raw.scale.length === 3
        ? roundVec3(
            raw.scale.map((n) => Math.max(0.05, Number(n) || 1)) as Vec3,
            3
          )
        : [1, 1, 1],
    ambientColor,
    isBlend: Boolean(raw.isBlend),
    blendAlpha:
      typeof raw.blendAlpha === 'number' && Number.isFinite(raw.blendAlpha)
        ? roundNum(clamp01(raw.blendAlpha), 3)
        : DEFAULT_BLEND_ALPHA,
    filePath:
      typeof raw.filePath === 'string' && raw.filePath.trim()
        ? raw.filePath
        : getDefaultFilePathForCategory(category),
    texPath:
      typeof raw.texPath === 'string' && raw.texPath.trim()
        ? raw.texPath
        : isAssetCategory(category)
          ? DEFAULT_TEX_PATH
          : '',
    physics: normalizePhysics(raw.physics),
  };
}

export function snapValue(val: number, step: SnapStep): number {
  if (!step || step <= 0) return roundNum(val, 3);
  return roundNum(Math.round(val / step) * step, 4);
}

const _euler = new THREE.Euler(0, 0, 0, 'XYZ');
const _mat4 = new THREE.Matrix4();

/**
 * Computes the world-space half-extent of a rotated -1..+1 unit cube
 * projected onto a given unit world axis (or the Y-up ground normal).
 */
export function getProjectedHalfExtent(
  rotationDeg: Vec3,
  scale: Vec3,
  axis: THREE.Vector3
): number {
  _euler.set(
    THREE.MathUtils.degToRad(rotationDeg[0]),
    THREE.MathUtils.degToRad(rotationDeg[1]),
    THREE.MathUtils.degToRad(rotationDeg[2]),
    'XYZ'
  );
  _mat4.makeRotationFromEuler(_euler);
  const e = _mat4.elements;
  const ax = new THREE.Vector3(e[0], e[1], e[2]).multiplyScalar(Math.abs(scale[0]));
  const ay = new THREE.Vector3(e[4], e[5], e[6]).multiplyScalar(Math.abs(scale[1]));
  const az = new THREE.Vector3(e[8], e[9], e[10]).multiplyScalar(Math.abs(scale[2]));

  return (
    Math.abs(ax.dot(axis)) +
    Math.abs(ay.dot(axis)) +
    Math.abs(az.dot(axis))
  );
}

const UP_AXIS = new THREE.Vector3(0, 1, 0);

export function computeGroundPlacementPosition(
  hitPoint: THREE.Vector3,
  config: PlacementConfig,
  snapStep: SnapStep
): Vec3 {
  const halfY = getProjectedHalfExtent(config.rotation, config.scale, UP_AXIS);
  const sx = snapStep > 0 ? snapValue(hitPoint.x, snapStep) : roundNum(hitPoint.x, 3);
  const sz = snapStep > 0 ? snapValue(hitPoint.z, snapStep) : roundNum(hitPoint.z, 3);

  return roundVec3([
    sx + config.positionOffset[0],
    halfY + config.positionOffset[1],
    sz + config.positionOffset[2],
  ]);
}

export function computeFacePlacementPosition(
  hitVolume: BlockingVolume,
  worldNormal: THREE.Vector3,
  config: PlacementConfig,
  snapStep: SnapStep
): Vec3 {
  const norm = worldNormal.clone().normalize();
  const hitHalfAlongNormal = getProjectedHalfExtent(
    hitVolume.rotation,
    hitVolume.scale,
    norm
  );
  const newHalfAlongNormal = getProjectedHalfExtent(
    config.rotation,
    config.scale,
    norm
  );

  const offsetDist = hitHalfAlongNormal + newHalfAlongNormal;
  const rawPos = new THREE.Vector3(
    hitVolume.position[0],
    hitVolume.position[1],
    hitVolume.position[2]
  ).addScaledVector(norm, offsetDist);

  const x =
    snapStep > 0 && Math.abs(norm.x) < 0.5
      ? snapValue(rawPos.x, snapStep)
      : roundNum(rawPos.x, 3);
  const y =
    snapStep > 0 && Math.abs(norm.y) < 0.5
      ? snapValue(rawPos.y, snapStep)
      : roundNum(rawPos.y, 3);
  const z =
    snapStep > 0 && Math.abs(norm.z) < 0.5
      ? snapValue(rawPos.z, snapStep)
      : roundNum(rawPos.z, 3);

  return roundVec3([
    x + config.positionOffset[0],
    y + config.positionOffset[1],
    z + config.positionOffset[2],
  ]);
}

export function getPlacementCellKey(pos: Vec3, scale: Vec3, rotation: Vec3): string {
  return `${roundNum(pos[0], 2)},${roundNum(pos[1], 2)},${roundNum(pos[2], 2)}|${roundNum(scale[0], 2)},${roundNum(scale[1], 2)},${roundNum(scale[2], 2)}|${roundNum(rotation[0], 1)},${roundNum(rotation[1], 1)},${roundNum(rotation[2], 1)}`;
}

export function buildEngineExportPayload(volumes: BlockingVolume[]): EngineExportPayload {
  return {
    format: 'blocking-volumes-v1',
    exportedAt: new Date().toISOString(),
    coordinateSpace: {
      cubeLocalMin: [-1, -1, -1],
      cubeLocalMax: [1, 1, 1],
      cubeUnitSize: [2, 2, 2],
      handedness: 'right-handed-y-up',
      rotationOrder: 'XYZ',
    },
    count: volumes.length,
    volumes: volumes.map((v) => {
      const sx = Math.abs(v.scale[0]);
      const sy = Math.abs(v.scale[1]);
      const sz = Math.abs(v.scale[2]);
      const amb = v.ambientColor ?? DEFAULT_AMBIENT_COLOR;
      const phys = normalizePhysics(v.physics);
      const base: EngineExportPayload['volumes'][number] = {
        id: v.id,
        name: v.name,
        category: v.category,
        position: roundVec3(v.position, 4),
        rotationDeg: roundVec3(v.rotation, 3),
        rotationRad: [
          roundNum(THREE.MathUtils.degToRad(v.rotation[0]), 6),
          roundNum(THREE.MathUtils.degToRad(v.rotation[1]), 6),
          roundNum(THREE.MathUtils.degToRad(v.rotation[2]), 6),
        ],
        scale: roundVec3(v.scale, 4),
        halfExtents: roundVec3([sx, sy, sz], 4),
        localMin: [-1, -1, -1],
        localMax: [1, 1, 1],
        ambientColor: {
          r: roundNum(clamp01(amb[0]), 3),
          g: roundNum(clamp01(amb[1]), 3),
          b: roundNum(clamp01(amb[2]), 3),
        },
        isBlend: Boolean(v.isBlend),
        blendAlpha: roundNum(clamp01(v.blendAlpha ?? DEFAULT_BLEND_ALPHA), 3),
        physics: phys,
      };

      if (isAssetCategory(v.category) || v.filePath || v.texPath) {
        base.filePath = v.filePath ?? '';
        base.texPath = v.texPath ?? '';
      }

      return base;
    }),
  };
}

export function parseImportedVolumes(rawJson: string): BlockingVolume[] {
  const parsed = JSON.parse(rawJson);
  const list = Array.isArray(parsed)
    ? parsed
    : Array.isArray(parsed?.volumes)
      ? parsed.volumes
      : null;

  if (!list) {
    throw new Error('JSON must contain a "volumes" array or be an array of volumes.');
  }

  return list.map((item: Record<string, unknown>, idx: number) => {
    const pos = Array.isArray(item.position) && item.position.length === 3
      ? (item.position.map(Number) as Vec3)
      : ([0, 1, 0] as Vec3);

    let rot: Vec3 = [0, 0, 0];
    if (Array.isArray(item.rotationDeg) && item.rotationDeg.length === 3) {
      rot = item.rotationDeg.map(Number) as Vec3;
    } else if (Array.isArray(item.rotation) && item.rotation.length === 3) {
      rot = item.rotation.map(Number) as Vec3;
    } else if (Array.isArray(item.rotationRad) && item.rotationRad.length === 3) {
      rot = [
        THREE.MathUtils.radToDeg(Number(item.rotationRad[0])),
        THREE.MathUtils.radToDeg(Number(item.rotationRad[1])),
        THREE.MathUtils.radToDeg(Number(item.rotationRad[2])),
      ];
    }

    const scale = Array.isArray(item.scale) && item.scale.length === 3
      ? (item.scale.map((n) => Math.max(0.05, Number(n) || 1)) as Vec3)
      : ([1, 1, 1] as Vec3);

    const rawCat = String(item.category || 'solid');
    const category: VolumeCategory =
      rawCat === 'solid' ||
      rawCat === 'trigger' ||
      rawCat === 'clip' ||
      rawCat === 'hazard' ||
      rawCat === 'obj' ||
      rawCat === 'glb'
        ? rawCat
        : 'solid';

    let ambientColor: Vec3 = [...DEFAULT_AMBIENT_COLOR];
    const rawAmb = item.ambientColor as Record<string, unknown> | unknown[] | undefined;
    if (Array.isArray(rawAmb) && rawAmb.length === 3) {
      ambientColor = [
        roundNum(clamp01(Number(rawAmb[0])), 3),
        roundNum(clamp01(Number(rawAmb[1])), 3),
        roundNum(clamp01(Number(rawAmb[2])), 3),
      ];
    } else if (rawAmb && typeof rawAmb === 'object') {
      ambientColor = [
        roundNum(clamp01(Number((rawAmb as Record<string, unknown>).r ?? 0.5)), 3),
        roundNum(clamp01(Number((rawAmb as Record<string, unknown>).g ?? 0.5)), 3),
        roundNum(clamp01(Number((rawAmb as Record<string, unknown>).b ?? 0.5)), 3),
      ];
    }

    const isBlend = Boolean(item.isBlend);
    const blendAlpha =
      typeof item.blendAlpha === 'number' && Number.isFinite(item.blendAlpha)
        ? roundNum(clamp01(item.blendAlpha), 3)
        : DEFAULT_BLEND_ALPHA;

    return {
      id: typeof item.id === 'string' && item.id.trim() ? item.id : `vol_${Date.now()}_${idx}`,
      name:
        typeof item.name === 'string' && item.name.trim()
          ? item.name
          : `Block ${String(idx + 1).padStart(2, '0')}`,
      category,
      position: roundVec3(pos),
      rotation: roundVec3(rot),
      scale: roundVec3(scale),
      ambientColor,
      isBlend,
      blendAlpha,
      filePath:
        typeof item.filePath === 'string' && item.filePath.trim()
          ? item.filePath
          : getDefaultFilePathForCategory(category),
      texPath:
        typeof item.texPath === 'string' && item.texPath.trim()
          ? item.texPath
          : isAssetCategory(category)
            ? DEFAULT_TEX_PATH
            : '',
      physics: normalizePhysics(item.physics),
    };
  });
}

export function createStarterSceneVolumes(): BlockingVolume[] {
  return [
    normalizeVolume({
      id: 'vol_demo_1',
      name: 'Floor Platform',
      category: 'solid',
      position: [0, 0.25, 0],
      rotation: [0, 0, 0],
      scale: [4, 0.25, 4],
    }),
    normalizeVolume({
      id: 'vol_demo_2',
      name: 'West Cover Wall',
      category: 'solid',
      position: [-3, 1.5, 0],
      rotation: [0, 0, 0],
      scale: [0.5, 1, 2.5],
    }),
    normalizeVolume({
      id: 'vol_demo_3',
      name: 'North Pillar',
      category: 'solid',
      position: [2, 2, -2],
      rotation: [0, 45, 0],
      scale: [0.75, 1.5, 0.75],
    }),
    normalizeVolume({
      id: 'vol_demo_4',
      name: 'Spawn Trigger',
      category: 'trigger',
      position: [2, 1.5, 2],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
    }),
  ];
}
