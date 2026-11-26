export type Vec3 = [number, number, number];

export type VolumeCategory = 'solid' | 'trigger' | 'clip' | 'hazard';

export interface BlockingVolume {
  id: string;
  name: string;
  category: VolumeCategory;
  /** World center position [x, y, z] */
  position: Vec3;
  /** Euler rotation in degrees [rx, ry, rz] (XYZ order) */
  rotation: Vec3;
  /** Scale multiplier relative to natural -1..+1 unit cube (default [1, 1, 1] -> 2x2x2 world units) */
  scale: Vec3;
}

export interface PlacementConfig {
  /** Additional position offset [dx, dy, dz] applied when placing a new cube */
  positionOffset: Vec3;
  /** Initial Euler rotation in degrees [rx, ry, rz] */
  rotation: Vec3;
  /** Initial scale [sx, sy, sz] relative to -1..1 cube */
  scale: Vec3;
  /** Collision category for newly placed cubes */
  category: VolumeCategory;
}

export type DrawMode = 'click' | 'drag' | 'hover' | 'select' | 'erase';

export type GizmoMode = 'translate' | 'rotate' | 'scale';

export type CameraPreset = 'perspective' | 'top' | 'front' | 'iso';

export type SnapStep = 0 | 0.25 | 0.5 | 1 | 2;

export interface VolumeTransform {
  position: Vec3;
  rotation: Vec3;
  scale: Vec3;
}

export type HistoryAction =
  | {
      id: string;
      type: 'place';
      label: string;
      timestamp: number;
      volumes: BlockingVolume[];
    }
  | {
      id: string;
      type: 'delete';
      label: string;
      timestamp: number;
      volumes: BlockingVolume[];
    }
  | {
      id: string;
      type: 'transform';
      label: string;
      timestamp: number;
      volumeId: string;
      before: VolumeTransform;
      after: VolumeTransform;
    }
  | {
      id: string;
      type: 'category';
      label: string;
      timestamp: number;
      volumeId: string;
      before: VolumeCategory;
      after: VolumeCategory;
    }
  | {
      id: string;
      type: 'replaceAll';
      label: string;
      timestamp: number;
      before: BlockingVolume[];
      after: BlockingVolume[];
    };

export interface EngineExportPayload {
  format: 'blocking-volumes-v1';
  exportedAt: string;
  coordinateSpace: {
    cubeLocalMin: Vec3;
    cubeLocalMax: Vec3;
    cubeUnitSize: Vec3;
    handedness: 'right-handed-y-up';
    rotationOrder: 'XYZ';
  };
  count: number;
  volumes: Array<{
    id: string;
    name: string;
    category: VolumeCategory;
    position: Vec3;
    rotationDeg: Vec3;
    rotationRad: Vec3;
    scale: Vec3;
    halfExtents: Vec3;
    localMin: Vec3;
    localMax: Vec3;
  }>;
}
