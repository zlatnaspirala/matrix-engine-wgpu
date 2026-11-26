import * as THREE from 'three';
import {
  BlockingVolume,
  EngineExportPayload,
  PlacementConfig,
  SnapStep,
  Vec3,
  VolumeCategory,
} from '../types/volume';

export const CATEGORY_META: Record<
  VolumeCategory,
  { label: string; colorHex: string; edgeHex: string; opacity: number }
> = {
  solid: {
    label: 'Solid Blocker',
    colorHex: '#64748b',
    edgeHex: '#cbd5e1',
    opacity: 0.94,
  },
  trigger: {
    label: 'Trigger Zone',
    colorHex: '#0891b2',
    edgeHex: '#67e8f9',
    opacity: 0.56,
  },
  clip: {
    label: 'Player Clip',
    colorHex: '#d97706',
    edgeHex: '#fcd34d',
    opacity: 0.72,
  },
  hazard: {
    label: 'Hazard Volume',
    colorHex: '#e11d48',
    edgeHex: '#fda4af',
    opacity: 0.78,
  },
};

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
  // Local basis vectors of the rotated cube in world space
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

/**
 * Computes the target placement position when hitting the ground plane (Y=0)
 * using the natural -1..+1 unit cube scale, rotation, snap step, and config offset.
 */
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

/**
 * Computes the target placement position when hovering an existing volume face.
 * Places the new -1..+1 cube flush against the hit face along its world normal.
 */
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

  // Snap perpendicular axes if snap is active and normal is axis-aligned
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

/**
 * Generates a spatial key for deduplicating continuous mouse-move painting.
 */
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
      return {
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
      };
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
      ? item.position.map(Number) as Vec3
      : [0, 1, 0] as Vec3;

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
      ? item.scale.map((n) => Math.max(0.05, Number(n) || 1)) as Vec3
      : [1, 1, 1] as Vec3;

    const rawCat = String(item.category || 'solid');
    const category: VolumeCategory =
      rawCat === 'solid' || rawCat === 'trigger' || rawCat === 'clip' || rawCat === 'hazard'
        ? rawCat
        : 'solid';

    return {
      id: typeof item.id === 'string' && item.id.trim() ? item.id : `vol_${Date.now()}_${idx}`,
      name: typeof item.name === 'string' && item.name.trim() ? item.name : `Block ${String(idx + 1).padStart(2, '0')}`,
      category,
      position: roundVec3(pos),
      rotation: roundVec3(rot),
      scale: roundVec3(scale),
    };
  });
}

export function createStarterSceneVolumes(): BlockingVolume[] {
  return [
    {
      id: 'vol_demo_1',
      name: 'Floor Platform',
      category: 'solid',
      position: [0, 0.25, 0],
      rotation: [0, 0, 0],
      scale: [4, 0.25, 4],
    },
    {
      id: 'vol_demo_2',
      name: 'West Cover Wall',
      category: 'solid',
      position: [-3, 1.5, 0],
      rotation: [0, 0, 0],
      scale: [0.5, 1, 2.5],
    },
    {
      id: 'vol_demo_3',
      name: 'North Pillar',
      category: 'solid',
      position: [2, 2, -2],
      rotation: [0, 45, 0],
      scale: [0.75, 1.5, 0.75],
    },
    {
      id: 'vol_demo_4',
      name: 'Spawn Trigger',
      category: 'trigger',
      position: [2, 1.5, 2],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
    },
  ];
}
