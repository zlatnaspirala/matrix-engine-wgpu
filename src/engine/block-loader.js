/**
 * BlockLoader — loads block maps exported by The Beast map creator.
 *
 * Export format: blocking-volumes-v1
 * The exported cube has local bounds [-1, 1], therefore `scale` is the
 * world-space half-extents (and is passed unchanged to both rendering and
 * the physics bridge).
 *
 * Modes:
 *   kinematic — render-only cubes + CollisionSystem.registerStatic()
 *   physics   — render cubes + static rigid bodies (mass: 0) in the active
 *               Ammo, Jolt, or Cannon physics backend.
 */
const DEFAULT_TEXTURE = './res/textures/blankgray2.webp';

const vector3 = (value, fallback = [0, 0, 0]) => {
  if(Array.isArray(value) && value.length >= 3) {
    return value.slice(0, 3).map((n, i) => Number.isFinite(Number(n)) ? Number(n) : fallback[i]);
  }
  return fallback.slice();
};

const asPosition = ([x, y, z]) => ({x, y, z});
const asRotation = ([x, y, z]) => ({x, y, z});

function rotatedHalfExtents(half, rotationDeg) {
  // Exported rotation order is XYZ. Compose Rz * Ry * Rx and transform
  // the box's three half-extent axes to get a conservative world AABB.
  const [x, y, z] = rotationDeg.map(v => v * Math.PI / 180);
  const sx = Math.sin(x), cx = Math.cos(x);
  const sy = Math.sin(y), cy = Math.cos(y);
  const sz = Math.sin(z), cz = Math.cos(z);

  const r00 = cz * cy;
  const r01 = cz * sy * sx - sz * cx;
  const r02 = cz * sy * cx + sz * sx;
  const r10 = sz * cy;
  const r11 = sz * sy * sx + cz * cx;
  const r12 = sz * sy * cx - cz * sx;
  const r20 = -sy;
  const r21 = cy * sx;
  const r22 = cy * cx;

  return {
    x: Math.abs(r00) * half[0] + Math.abs(r01) * half[1] + Math.abs(r02) * half[2],
    y: Math.abs(r10) * half[0] + Math.abs(r11) * half[1] + Math.abs(r12) * half[2],
    z: Math.abs(r20) * half[0] + Math.abs(r21) * half[1] + Math.abs(r22) * half[2]
  };
}

export class BlockLoader {
  /**
   * @param {object} engine MatrixEngineWGPU instance
   * @param {object} cubeMesh Loaded cube mesh (usually meshes.cube)
   * @param {object|null} collisionSystem CollisionSystem instance for kinematic mode
   * @param {object} options Defaults: { mode: 'kinematic' }
   */
  constructor(engine, cubeMesh, collisionSystem = null, options = {}) {
    if(!engine || typeof engine.addMeshObj !== 'function') {
      throw new TypeError('BlockLoader requires a MatrixEngineWGPU instance');
    }
    if(!cubeMesh) throw new TypeError('BlockLoader requires a loaded cube mesh');

    this.engine = engine;
    this.cubeMesh = cubeMesh;
    this.collisionSystem = collisionSystem;
    this.options = {
      mode: 'kinematic',
      texture: DEFAULT_TEXTURE,
      material: {type: 'standard', shared: true},
      mass: 0,
      raycast: {enabled: true, radius: 1},
      pointerEffect: {enabled: false},
      ...options
    };
    this.objects = [];
    this.collisionEntries = [];
    this.map = null;
  }

  /**
   * Load an already parsed export object.
   * @param {object} mapData Exported JSON object or an array of volumes
   * @param {object} options Per-load overrides: mode, texture, material, mass
   */
  load(mapData, options = {}) {
    const settings = {...this.options, ...options};
    const mode = settings.mode || 'kinematic';
    if(mode !== 'kinematic' && mode !== 'physics') {
      throw new RangeError(`Unknown BlockLoader mode "${mode}". Use "kinematic" or "physics".`);
    }
    if(mode === 'kinematic' && !this.collisionSystem) {
      throw new Error('Kinematic BlockLoader mode requires a CollisionSystem instance');
    }
    if(mode === 'physics' && !this.engine.matrixPhysics) {
      throw new Error('Physics BlockLoader mode requires an initialized physics backend (Ammo, Jolt, or Cannon)');
    }

    const volumes = Array.isArray(mapData) ? mapData : mapData?.volumes;
    if(!Array.isArray(volumes)) {
      throw new TypeError('Invalid block map: expected an array or an object with a volumes array');
    }

    const created = [];
    const collisionEntries = [];
    for(let i = 0; i < volumes.length; i++) {
      const volume = volumes[i];
      if(!volume || typeof volume !== 'object') continue;
      const positionArray = vector3(volume.position);
      const rotationArray = vector3(volume.rotationDeg ?? volume.rotation);
      const scale = vector3(volume.scale ?? volume.halfExtents, [1, 1, 1]).map(v => Math.abs(v));
      if(scale.some(v => v <= 0)) {
        console.warn('[BlockLoader] Skipping block with invalid scale:', volume.name || volume.id || i);
        continue;
      }

      const name = String(volume.name || volume.id || `block_${i}`);
      const position = asPosition(positionArray);
      const rotation = asRotation(rotationArray);
      const category = volume.category || 'solid';
      const physicsEnabled = mode === 'physics';

      const object = this.engine.addMeshObj({
        name,
        mesh: this.cubeMesh,
        position,
        rotation,
        rotationSpeed: {x: 0, y: 0, z: 0},
        scale,
        material: settings.material,
        texturesPaths: volume.texture ? [volume.texture] : [settings.texture],
        raycast: settings.raycast,
        pointerEffect: settings.pointerEffect,
        physics: {
          enabled: physicsEnabled,
          geometry: 'Cube',
          mass: physicsEnabled ? (settings.mass ?? 0) : 0,
          name,
          position,
          rotation,
          scale
        }
      });

      created.push(object);

      if(mode === 'kinematic' && category !== 'trigger' &&
        (!settings.collisionCategories || settings.collisionCategories.includes(category))) {
        const half = rotatedHalfExtents(scale, rotationArray);
        // CollisionSystem has a dedicated floor resolver. Detect broad horizontal
        // slabs (decks/platforms) and register them as floors; other blocks are walls.
        const isFloor = half.y <= Math.min(half.x, half.z) * (settings.floorAspect ?? 0.15);
        const group = isFloor ? 'floor' : (category === 'hazard' ? 'hazard' : 'walls');
        const entry = this.collisionSystem.registerStatic(name, position, Math.max(half.x, half.y, half.z), group, half);
        collisionEntries.push(entry);
      }
    }

    this.objects.push(...created);
    this.collisionEntries.push(...collisionEntries);
    this.map = mapData;
    return {
      objects: created,
      collisionEntries,
      count: created.length,
      mode,
      map: mapData
    };
  }

  /** Fetch and load a JSON export. */
  async loadFromURL(url, options = {}) {
    if(typeof url !== 'string' || !url) throw new TypeError('loadFromURL requires a URL');
    const response = await fetch(url);
    if(!response.ok) throw new Error(`Unable to load block map (${response.status}): ${url}`);
    return this.load(await response.json(), options);
  }

  /** Remove this loader's kinematic entries and rendered objects. */
  dispose() {
    if(this.collisionSystem && this.collisionEntries.length) {
      const owned = new Set(this.collisionEntries);
      this.collisionSystem.staticEntries = this.collisionSystem.staticEntries.filter(entry => !owned.has(entry));
      this.collisionSystem._staticGrid?.forEach((cell, key, grid) => {
        const remaining = cell.filter(entry => !owned.has(entry));
        if(remaining.length) grid.set(key, remaining);
        else grid.delete(key);
      });
    }

    for(const object of this.objects) {
      if(object?.name) this.engine.removeSceneObjectByName?.(object.name);
    }
    this.objects.length = 0;
    this.collisionEntries.length = 0;
    this.map = null;
  }
}

export default BlockLoader;
