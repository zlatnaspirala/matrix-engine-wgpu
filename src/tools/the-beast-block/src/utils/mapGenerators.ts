import { BlockingVolume, Vec3, VolumeCategory } from '../types/volume';
import { roundVec3 } from './snap';

export interface ArenaPresetMeta {
  id: string;
  name: string;
  description: string;
  build: () => BlockingVolume[];
}

function makeVol(
  prefix: string,
  idx: number,
  name: string,
  category: VolumeCategory,
  position: Vec3,
  scale: Vec3,
  rotation: Vec3 = [0, 0, 0]
): BlockingVolume {
  return {
    id: `${prefix}_${idx}`,
    name,
    category,
    position: roundVec3(position, 3),
    rotation: roundVec3(rotation, 2),
    scale: roundVec3(scale, 3),
  };
}

function addMirroredZ(
  list: BlockingVolume[],
  prefix: string,
  name: string,
  category: VolumeCategory,
  pos: Vec3,
  scale: Vec3,
  rot: Vec3 = [0, 0, 0]
) {
  list.push(makeVol(prefix, list.length + 1, `${name} (N)`, category, pos, scale, rot));
  if (Math.abs(pos[2]) > 0.001) {
    list.push(
      makeVol(
        prefix,
        list.length + 1,
        `${name} (S)`,
        category,
        [pos[0], pos[1], -pos[2]],
        scale,
        [-rot[0], -rot[1], rot[2]]
      )
    );
  }
}

function addMirroredX(
  list: BlockingVolume[],
  prefix: string,
  name: string,
  category: VolumeCategory,
  pos: Vec3,
  scale: Vec3,
  rot: Vec3 = [0, 0, 0]
) {
  list.push(makeVol(prefix, list.length + 1, `${name} (E)`, category, pos, scale, rot));
  if (Math.abs(pos[0]) > 0.001) {
    list.push(
      makeVol(
        prefix,
        list.length + 1,
        `${name} (W)`,
        category,
        [-pos[0], pos[1], pos[2]],
        scale,
        [rot[0], -rot[1], -rot[2]]
      )
    );
  }
}

function addMirroredXZ(
  list: BlockingVolume[],
  prefix: string,
  name: string,
  category: VolumeCategory,
  pos: Vec3,
  scale: Vec3,
  rot: Vec3 = [0, 0, 0]
) {
  const xSigns = Math.abs(pos[0]) > 0.001 ? [1, -1] : [1];
  const zSigns = Math.abs(pos[2]) > 0.001 ? [1, -1] : [1];
  let quadrant = 1;
  for (const sx of xSigns) {
    for (const sz of zSigns) {
      const rx = sz < 0 ? -rot[0] : rot[0];
      const ry = sx * sz < 0 ? -rot[1] : rot[1];
      const rz = sx < 0 ? -rot[2] : rot[2];
      list.push(
        makeVol(
          prefix,
          list.length + 1,
          `${name} Q${quadrant++}`,
          category,
          [pos[0] * sx, pos[1], pos[2] * sz],
          scale,
          [rx, ry, rz]
        )
      );
    }
  }
}

/**
 * 1. Quake Arena: Iron Citadel (8x+ scale: 120 x 148 units)
 * Multi-tiered symmetric Quake deathmatch arena with lava chasm, central railgun bridge,
 * side flank corridors, bastion rooms, gothic 45° buttresses, jump pads, and upper galleries.
 */
export function createQuakeIronCitadel(): BlockingVolume[] {
  const vols: BlockingVolume[] = [];
  const p = 'qdm';

  // Ground foundations framing a central sunken lava pit (-22..22 X, -20..20 Z)
  addMirroredZ(vols, p, 'North/South Arena Deck', 'solid', [0, 0.5, 47], [60, 0.5, 27]);
  addMirroredX(vols, p, 'East/West Flank Deck', 'solid', [41, 0.5, 0], [19, 0.5, 20]);

  // Sunken Central Lava Abyss (Y = 0.2, top = 0.4)
  vols.push(makeVol(p, vols.length + 1, 'Central Lava Pit', 'hazard', [0, 0.2, 0], [22, 0.2, 20]));
  // Central Island Railgun Plinth rising out of the lava
  vols.push(makeVol(p, vols.length + 1, 'Center Obelisk Base', 'solid', [0, 3.5, 0], [6, 3.5, 6]));
  vols.push(makeVol(p, vols.length + 1, 'Quad / Rail Pad', 'trigger', [0, 8.2, 0], [3.5, 1.2, 3.5]));

  // Outer Fortress Perimeter Walls (height 16 units)
  addMirroredZ(vols, p, 'Citadel End Wall', 'solid', [0, 9, 73], [60, 8, 1]);
  addMirroredX(vols, p, 'Citadel Side Wall', 'solid', [59, 9, 0], [1, 8, 72]);

  // Gothic Angled Buttress Columns along outer walls
  addMirroredXZ(vols, p, 'Gothic Wall Buttress', 'solid', [56.5, 8.5, 36], [2.4, 7.5, 2.4], [0, 45, 0]);
  addMirroredXZ(vols, p, 'Corner Tower Monolith', 'solid', [52, 10, 66], [4, 9, 4], [0, 45, 0]);

  // Spawn Halls (North & South, Z = +-60) with grand triple archways
  addMirroredXZ(vols, p, 'Spawn Gatehouse Pier', 'solid', [20, 7, 50], [10, 6, 1.5]);
  addMirroredZ(vols, p, 'Spawn Center Arch Block', 'solid', [0, 10, 50], [12, 3, 1.5]);
  addMirroredZ(vols, p, 'Spawn Divider Cover', 'solid', [0, 2.5, 58], [6, 1.5, 1.4]);
  addMirroredZ(vols, p, 'Team Spawn Trigger', 'trigger', [0, 2.5, 66], [10, 1.5, 4]);

  // Flanking Bastion Rooms (East & West at X = +-44, Z = +-34) with corridor doorways
  addMirroredXZ(vols, p, 'Bastion Room Inner Wall', 'solid', [32, 7, 36], [1.4, 6, 11]);
  addMirroredXZ(vols, p, 'Bastion Room Cross Wall', 'solid', [44, 7, 24], [8, 6, 1.4]);
  addMirroredXZ(vols, p, 'Bastion Cover Crate', 'solid', [44, 2.5, 38], [2.4, 1.5, 2.4], [0, 30, 0]);

  // Side Flank Corridors (X = +-48, Z = 0) with upper gantry & jump pads
  addMirroredX(vols, p, 'Flank Corridor Shield', 'solid', [35, 4, 0], [1.4, 3, 7]);
  addMirroredX(vols, p, 'Side Jump Pad', 'trigger', [52, 1.5, 0], [3, 0.5, 3]);
  addMirroredXZ(vols, p, 'Corridor Baffle Wall', 'solid', [49, 4.5, 13], [4.5, 3.5, 1.2]);

  // High Mid-Tier Overpass Bridges spanning East-West & North-South over the Lava Pit
  addMirroredX(vols, p, 'East/West Span Bridge', 'solid', [14, 6.5, 0], [8.5, 0.5, 4.2]);
  addMirroredZ(vols, p, 'North/South Span Bridge', 'solid', [0, 6.5, 13], [4.2, 0.5, 7.5]);
  addMirroredX(vols, p, 'Bridge Side Clip', 'clip', [14, 7.8, 4.0], [8.2, 0.8, 0.25]);
  addMirroredX(vols, p, 'Bridge Side Clip MirrorZ', 'clip', [14, 7.8, -4.0], [8.2, 0.8, 0.25]);

  // Wide Sweeping Quake Ramps leading from Ground (Y=1) to Mid Bridge Decks (Y=7)
  addMirroredX(vols, p, 'Bridge Approach Ramp', 'solid', [30, 4, 0], [8.4, 0.5, 4.2], [0, 0, -22]);
  addMirroredZ(vols, p, 'North/South Bridge Ramp', 'solid', [0, 4, 28], [4.2, 0.5, 8.4], [22, 0, 0]);

  // Upper Sniper Galleries & Catwalks (Y = 13) overlooking the arena
  addMirroredXZ(vols, p, 'Upper Sniper Balcony', 'solid', [46, 12.5, 52], [11, 0.5, 10]);
  addMirroredXZ(vols, p, 'Balcony Support Pillar', 'solid', [37, 6.5, 44], [1.6, 5.5, 1.6]);
  addMirroredXZ(vols, p, 'Upper Gallery Ramp', 'solid', [28, 9.5, 56], [8.4, 0.5, 3.6], [0, 0, 22]);
  addMirroredXZ(vols, p, 'Upper Sky Catwalk', 'solid', [46, 12.5, 22], [3.5, 0.5, 20]);

  // Mid Courtyard Gothic Pillars & Duel Cover
  addMirroredXZ(vols, p, 'Arena Mega Pillar', 'solid', [22, 8.5, 22], [2.4, 7.5, 2.4], [0, 45, 0]);
  addMirroredXZ(vols, p, 'Courtyard Angled Bunker', 'solid', [16, 2.8, 34], [4.2, 1.8, 1.4], [0, 25, 0]);

  return vols;
}

/**
 * 2. Asymmetric Mission Level: Blackout Stronghold (Zero symmetry, ~140 x 156 units)
 * True single-player Quake-style progression:
 * Insertion Dock (SW) -> Guard Courtyard & Watchtower (W/NW) -> Skewed Reactor Chasm Bridge (Center)
 * -> Winding Maintenance Corridors & Armory (E) -> Elevated Extraction Citadel (NE).
 */
export function createAsymmetricMissionLevel(): BlockingVolume[] {
  const vols: BlockingVolume[] = [];
  const p = 'msn';

  // --- ZONE 1: Insertion Dock (South-West, X: -64..-22, Z: 24..68) ---
  vols.push(makeVol(p, vols.length + 1, 'Insertion Dock Floor', 'solid', [-43, 0.5, 46], [21, 0.5, 22]));
  vols.push(makeVol(p, vols.length + 1, 'Player Insertion Trigger', 'trigger', [-54, 2.2, 58], [5, 1.2, 5]));
  vols.push(makeVol(p, vols.length + 1, 'Dock West Sea Wall', 'solid', [-63, 7, 46], [1, 6, 22]));
  vols.push(makeVol(p, vols.length + 1, 'Dock South Bulkhead', 'solid', [-43, 7, 67], [21, 6, 1]));
  vols.push(makeVol(p, vols.length + 1, 'Cargo Crate Alpha', 'solid', [-46, 2.5, 42], [3, 1.5, 2.2], [0, 18, 0]));
  vols.push(makeVol(p, vols.length + 1, 'Cargo Crate Beta', 'solid', [-35, 3, 52], [2.2, 2, 3.4], [0, -28, 0]));
  vols.push(makeVol(p, vols.length + 1, 'Gatehouse Left Pier', 'solid', [-50, 7, 25], [13, 6, 1.2]));
  vols.push(makeVol(p, vols.length + 1, 'Gatehouse Right Pier', 'solid', [-25, 7, 25], [4, 6, 1.2]));
  vols.push(makeVol(p, vols.length + 1, 'Gatehouse Lintel', 'solid', [-33, 11, 25], [6, 2, 1.2]));

  // --- ZONE 2: Outer Courtyard & Asymmetric Watchtower (North-West, X: -64..-12, Z: -64..24) ---
  vols.push(makeVol(p, vols.length + 1, 'West Courtyard Floor', 'solid', [-38, 0.5, -20], [26, 0.5, 44]));
  vols.push(makeVol(p, vols.length + 1, 'Courtyard West Perimeter', 'solid', [-63, 8, -20], [1, 7, 44]));
  vols.push(makeVol(p, vols.length + 1, 'Courtyard North Cliff Wall', 'solid', [-38, 9, -63], [26, 8, 1]));
  // Multi-story Watchtower in far NW corner
  vols.push(makeVol(p, vols.length + 1, 'Watchtower Core', 'solid', [-53, 8.5, -50], [6, 7.5, 6]));
  vols.push(makeVol(p, vols.length + 1, 'Watchtower Overlook Deck', 'solid', [-49, 15.5, -46], [10, 0.5, 10]));
  vols.push(makeVol(p, vols.length + 1, 'Watchtower Parapet', 'solid', [-40, 17, -46], [0.8, 1, 9]));
  vols.push(makeVol(p, vols.length + 1, 'Watchtower Access Ramp 1', 'solid', [-55, 4.5, -24], [3.5, 0.5, 11], [-20, 0, 0]));
  vols.push(makeVol(p, vols.length + 1, 'Watchtower Mid Landing', 'solid', [-55, 8.2, -37], [4.5, 0.5, 4]));
  vols.push(makeVol(p, vols.length + 1, 'Watchtower Upper Ramp', 'solid', [-44, 11.8, -37], [7.5, 0.5, 3.2], [0, 0, 26]));
  // Asymmetric courtyard cover & sunken trench
  vols.push(makeVol(p, vols.length + 1, 'Courtyard Diagonal Monolith', 'solid', [-34, 3.5, 4], [4.5, 2.5, 1.5], [0, 34, 0]));
  vols.push(makeVol(p, vols.length + 1, 'Courtyard Bunker Slab', 'solid', [-26, 2.5, -18], [2.5, 1.5, 5], [0, -16, 0]));
  vols.push(makeVol(p, vols.length + 1, 'Courtyard Hazard Spill', 'hazard', [-42, 1.15, -14], [7, 0.15, 5], [0, 12, 0]));
  vols.push(makeVol(p, vols.length + 1, 'Sniper Ridge Catwalk', 'solid', [-22, 8.5, -52], [11, 0.5, 4.5]));
  vols.push(makeVol(p, vols.length + 1, 'Courtyard Checkpoint Trigger', 'trigger', [-32, 2.2, -32], [3.5, 1.2, 3.5]));

  // --- ZONE 3: Central Reactor Chasm & Skewed Diagonal Bridge (X: -12..18, Z: -64..68) ---
  vols.push(makeVol(p, vols.length + 1, 'Reactor Acid Chasm', 'hazard', [3, 0.2, 2], [15, 0.2, 66]));
  // Skewed main bridge crossing the chasm from NW courtyard to SE maintenance wing
  vols.push(makeVol(p, vols.length + 1, 'Skewed Chasm Bridge', 'solid', [3, 4.2, -6], [19, 0.5, 4.2], [0, -24, 0]));
  vols.push(makeVol(p, vols.length + 1, 'Bridge Guard Rail A', 'clip', [1.4, 5.5, -9.8], [18, 0.8, 0.25], [0, -24, 0]));
  vols.push(makeVol(p, vols.length + 1, 'Bridge Ramp West', 'solid', [-14, 2.6, 2], [6.5, 0.5, 3.8], [0, -24, 18]));
  // Secondary high narrow pipe-bridge in the north
  vols.push(makeVol(p, vols.length + 1, 'Upper North Pipe Bridge', 'solid', [3, 8.5, -50], [16, 0.5, 2.4]));
  // Lower maintenance stepping pillars + jump pad shortcut in the south
  vols.push(makeVol(p, vols.length + 1, 'Chasm South Pylon A', 'solid', [-6, 1.8, 34], [3.5, 1.8, 3.5]));
  vols.push(makeVol(p, vols.length + 1, 'Chasm South Pylon B', 'solid', [5, 2.4, 42], [3.5, 2.4, 3.5]));
  vols.push(makeVol(p, vols.length + 1, 'Emergency Jump Pad', 'trigger', [-22, 1.6, 40], [3, 0.5, 3]));

  // --- ZONE 4: East Winding Maintenance Corridors & Armory (X: 18..66, Z: 2..68) ---
  vols.push(makeVol(p, vols.length + 1, 'East Wing Floor', 'solid', [42, 0.5, 35], [24, 0.5, 33]));
  vols.push(makeVol(p, vols.length + 1, 'East Outer Perimeter', 'solid', [65, 8, 35], [1, 7, 33]));
  vols.push(makeVol(p, vols.length + 1, 'East South Perimeter', 'solid', [42, 8, 67], [24, 7, 1]));
  // Winding Z-shaped interior corridor walls
  vols.push(makeVol(p, vols.length + 1, 'Corridor Partition 1', 'solid', [28, 7, 46], [10, 6, 1.2]));
  vols.push(makeVol(p, vols.length + 1, 'Corridor Partition 2', 'solid', [48, 7, 38], [1.2, 6, 14]));
  vols.push(makeVol(p, vols.length + 1, 'Corridor Partition 3', 'solid', [34, 7, 22], [15, 6, 1.2]));
  vols.push(makeVol(p, vols.length + 1, 'Corridor Choke Baffle', 'solid', [26, 3.5, 34], [1.2, 2.5, 5]));
  vols.push(makeVol(p, vols.length + 1, 'Armory Alcove Trigger', 'trigger', [56, 2.2, 54], [4, 1.2, 4]));
  vols.push(makeVol(p, vols.length + 1, 'Armory Supply Crates', 'solid', [58, 2.5, 28], [2.4, 1.5, 3.2], [0, 14, 0]));
  // Mezzanine balcony above east corridor leading north
  vols.push(makeVol(p, vols.length + 1, 'East Wing Mezzanine', 'solid', [56, 7.5, 16], [8, 0.5, 12]));
  vols.push(makeVol(p, vols.length + 1, 'Mezzanine Stair Ramp', 'solid', [56, 4.2, 36], [3.5, 0.5, 8.8], [-22, 0, 0]));

  // --- ZONE 5: North-East Extraction Citadel / Boss Arena (X: 18..66, Z: -64..2) ---
  vols.push(makeVol(p, vols.length + 1, 'Boss Citadel Floor', 'solid', [42, 0.5, -31], [24, 0.5, 33]));
  vols.push(makeVol(p, vols.length + 1, 'Citadel North Wall', 'solid', [42, 11, -63], [24, 10, 1]));
  vols.push(makeVol(p, vols.length + 1, 'Citadel East Wall', 'solid', [65, 11, -31], [1, 10, 33]));
  // Towering asymmetric monoliths & altar dais
  vols.push(makeVol(p, vols.length + 1, 'Boss Dais Platform', 'solid', [48, 2.5, -46], [10, 1.5, 9]));
  vols.push(makeVol(p, vols.length + 1, 'Boss Dais Ramp', 'solid', [48, 1.75, -33], [4, 0.5, 4.5], [22, 0, 0]));
  vols.push(makeVol(p, vols.length + 1, 'Citadel Pillar NW', 'solid', [30, 10, -48], [2.4, 9, 2.4], [0, 45, 0]));
  vols.push(makeVol(p, vols.length + 1, 'Citadel Pillar SE', 'solid', [54, 10, -20], [2.4, 9, 2.4], [0, 45, 0]));
  vols.push(makeVol(p, vols.length + 1, 'Citadel Pillar SW', 'solid', [32, 10, -18], [2.2, 9, 2.2], [0, 20, 0]));
  vols.push(makeVol(p, vols.length + 1, 'High Sniping Perch NE', 'solid', [58, 11.5, -52], [6, 0.5, 8]));
  vols.push(makeVol(p, vols.length + 1, 'Mission Extraction Trigger', 'trigger', [48, 5.5, -48], [4, 1.5, 4]));
  vols.push(makeVol(p, vols.length + 1, 'Laser Barrier Clip', 'clip', [32, 4.5, -6], [10, 3.5, 0.35], [0, -12, 0]));

  return vols;
}

/**
 * 3. Quake Twin-Spire Abyss (8x+ scale: 136 x 136 units)
 * Multi-tier sky-bridges and 4 corner gothic spires suspended over a giant void pit.
 */
export function createQuakeTwinSpireAbyss(): BlockingVolume[] {
  const vols: BlockingVolume[] = [];
  const p = 'qsa';

  // Abyssal hazard floor spanning entire void
  vols.push(makeVol(p, vols.length + 1, 'Abyssal Void Hazard', 'hazard', [0, 0.25, 0], [68, 0.25, 68]));

  // Central Floating Arena Island (Y = 7)
  vols.push(makeVol(p, vols.length + 1, 'Center Island Deck', 'solid', [0, 6.5, 0], [16, 0.5, 16], [0, 45, 0]));
  vols.push(makeVol(p, vols.length + 1, 'Center Railgun Spire', 'solid', [0, 13, 0], [3.5, 6, 3.5], [0, 45, 0]));
  vols.push(makeVol(p, vols.length + 1, 'Center Powerup Trigger', 'trigger', [0, 8.2, 10], [2.8, 1.2, 2.8]));

  // 4 Towering Corner Spires (2 playable floor tiers each: Y=7 and Y=13)
  addMirroredXZ(vols, p, 'Corner Spire Foundation', 'solid', [44, 3.5, 44], [14, 3.5, 14]);
  addMirroredXZ(vols, p, 'Corner Spire Mid Deck', 'solid', [44, 6.5, 44], [18, 0.5, 18]);
  addMirroredXZ(vols, p, 'Corner Spire Upper Deck', 'solid', [44, 12.5, 44], [14, 0.5, 14]);
  addMirroredXZ(vols, p, 'Corner Spire Tower Core', 'solid', [50, 13, 50], [4, 6, 4], [0, 45, 0]);
  addMirroredXZ(vols, p, 'Corner Spire Ramp', 'solid', [34, 9.5, 48], [8.4, 0.5, 3.5], [0, 0, -22]);

  // Dual-elevation Sky-Bridges connecting spires around the perimeter
  addMirroredX(vols, p, 'East/West Lower Sky Bridge', 'solid', [44, 6.5, 0], [4.5, 0.5, 26]);
  addMirroredZ(vols, p, 'North/South Lower Sky Bridge', 'solid', [0, 6.5, 44], [26, 0.5, 4.5]);
  addMirroredX(vols, p, 'East/West High Catwalk', 'solid', [44, 12.5, 0], [2.8, 0.5, 30]);
  addMirroredZ(vols, p, 'North/South High Catwalk', 'solid', [0, 12.5, 44], [30, 0.5, 2.8]);

  // 4 Diagonal Bridges linking Corner Spires directly to Center Island
  addMirroredXZ(vols, p, 'Diagonal Center Span', 'solid', [22, 6.5, 22], [17, 0.5, 3.6], [0, -45, 0]);
  addMirroredXZ(vols, p, 'Bridge Clip Barrier', 'clip', [44, 7.8, 0], [0.25, 0.8, 25]);
  addMirroredXZ(vols, p, 'Spire Jump Pad', 'trigger', [34, 7.6, 34], [3, 0.6, 3]);

  return vols;
}

/**
 * 4. Quake CQB Refinery (8x+ scale: 124 x 124 units)
 * Massive interconnected industrial rooms, blast corridors, gantry bridges & reactor silos.
 */
export function createQuakeRefinery(): BlockingVolume[] {
  const vols: BlockingVolume[] = [];
  const p = 'qrf';

  vols.push(makeVol(p, vols.length + 1, 'Refinery Floor Slab', 'solid', [0, 0.5, 0], [62, 0.5, 62]));

  // Perimeter Blast Walls
  addMirroredZ(vols, p, 'Refinery Wall N/S', 'solid', [0, 9, 61], [62, 8, 1]);
  addMirroredX(vols, p, 'Refinery Wall E/W', 'solid', [61, 9, 0], [1, 8, 60]);

  // 4 Giant Corner Silo Rooms with multi-doorway bulkheads
  addMirroredXZ(vols, p, 'Silo Room Front Wall', 'solid', [38, 7.5, 24], [14, 6.5, 1.4]);
  addMirroredXZ(vols, p, 'Silo Room Side Wall', 'solid', [24, 7.5, 42], [1.4, 6.5, 12]);
  addMirroredXZ(vols, p, 'Silo Vat Monolith', 'solid', [44, 6, 44], [5.5, 5, 5.5], [0, 45, 0]);
  addMirroredXZ(vols, p, 'Silo Breach Trigger', 'trigger', [36, 2.2, 36], [4, 1.2, 4]);

  // Central Reactor Core & Overhead Cross Gantries (Y = 9)
  vols.push(makeVol(p, vols.length + 1, 'Center Reactor Core', 'solid', [0, 7, 0], [6, 6, 6], [0, 45, 0]));
  vols.push(makeVol(p, vols.length + 1, 'Reactor Hazard Ring', 'hazard', [0, 1.2, 0], [11, 0.2, 11], [0, 45, 0]));
  addMirroredX(vols, p, 'Overhead Gantry E/W', 'solid', [24, 8.5, 0], [14, 0.5, 3.6]);
  addMirroredZ(vols, p, 'Overhead Gantry N/S', 'solid', [0, 8.5, 24], [3.6, 0.5, 14]);
  addMirroredX(vols, p, 'Gantry Access Ramp', 'solid', [46, 4.8, 0], [9.8, 0.5, 3.6], [0, 0, -24]);
  addMirroredZ(vols, p, 'Gantry Access Ramp N/S', 'solid', [0, 4.8, 46], [3.6, 0.5, 9.8], [24, 0, 0]);

  // Corridor Baffles & Cover Containers
  addMirroredXZ(vols, p, 'Corridor Cover Block', 'solid', [16, 3, 16], [3.5, 2, 1.5], [0, -35, 0]);
  addMirroredZ(vols, p, 'Chokepoint Blast Shield', 'solid', [0, 3.5, 34], [7, 2.5, 1.4]);

  return vols;
}

/**
 * 5. Quake Defrag Gauntlet (8x+ scale: 160-unit canyon run)
 */
export function createQuakeDefragGauntlet(): BlockingVolume[] {
  const vols: BlockingVolume[] = [];
  const p = 'qdf';

  vols.push(makeVol(p, vols.length + 1, 'Start Platform', 'solid', [0, 0.5, 66], [16, 0.5, 12]));
  vols.push(makeVol(p, vols.length + 1, 'Start Trigger', 'trigger', [0, 2.2, 68], [8, 1.2, 4]));
  vols.push(makeVol(p, vols.length + 1, 'Canyon Lava Abyss', 'hazard', [0, 0.25, -4], [64, 0.25, 62]));

  // Stepped Strafe Islands
  vols.push(makeVol(p, vols.length + 1, 'Launch Ramp 1', 'solid', [0, 3.2, 46], [7, 0.5, 8], [20, 0, 0]));
  vols.push(makeVol(p, vols.length + 1, 'Split Island Left', 'solid', [-18, 5.5, 24], [8, 0.5, 8]));
  vols.push(makeVol(p, vols.length + 1, 'Split Island Right', 'solid', [18, 5.5, 24], [8, 0.5, 8]));

  // Angled Wall-Run Monoliths
  vols.push(makeVol(p, vols.length + 1, 'Wallrun Slab Left', 'solid', [-26, 10, 4], [1.2, 5.5, 16], [0, 0, -10]));
  vols.push(makeVol(p, vols.length + 1, 'Wallrun Slab Right', 'solid', [26, 10, 4], [1.2, 5.5, 16], [0, 0, 10]));
  vols.push(makeVol(p, vols.length + 1, 'Center Balance Bridge', 'solid', [0, 8.5, 2], [2.2, 0.5, 18]));

  // Mid Checkpoint & High Dual Bridges
  vols.push(makeVol(p, vols.length + 1, 'Mid Sanctuary Deck', 'solid', [0, 8.5, -20], [14, 0.5, 8]));
  vols.push(makeVol(p, vols.length + 1, 'Checkpoint Trigger', 'trigger', [0, 10.5, -20], [5, 1.5, 4]));
  vols.push(makeVol(p, vols.length + 1, 'Twin Bridge Left', 'solid', [-12, 12, -40], [3, 0.5, 16], [14, 0, 0]));
  vols.push(makeVol(p, vols.length + 1, 'Twin Bridge Right', 'solid', [12, 12, -40], [3, 0.5, 16], [14, 0, 0]));

  // Summit Shrine
  vols.push(makeVol(p, vols.length + 1, 'Summit Temple Deck', 'solid', [0, 15.5, -64], [18, 0.5, 12]));
  vols.push(makeVol(p, vols.length + 1, 'Summit Pillar L', 'solid', [-12, 22, -68], [2.4, 6, 2.4], [0, 45, 0]));
  vols.push(makeVol(p, vols.length + 1, 'Summit Pillar R', 'solid', [12, 22, -68], [2.4, 6, 2.4], [0, 45, 0]));
  vols.push(makeVol(p, vols.length + 1, 'Finish Goal Trigger', 'trigger', [0, 17.8, -66], [6, 1.8, 4]));

  return vols;
}

export const ARENA_PRESETS: ArenaPresetMeta[] = [
  {
    id: 'quake-iron-citadel',
    name: 'Quake: Iron Citadel (8x)',
    description: '120×148 symmetric arena with lava chasm, bridges, rooms & ramps',
    build: createQuakeIronCitadel,
  },
  {
    id: 'mission-blackout',
    name: 'Mission: Blackout Stronghold',
    description: 'Asymmetric single-player level: dock, watchtower, skewed bridge & boss vault',
    build: createAsymmetricMissionLevel,
  },
  {
    id: 'quake-twin-spire',
    name: 'Quake: Twin-Spire Abyss (8x)',
    description: '136×136 void arena with 4 multi-tier spires & crisscrossing sky-bridges',
    build: createQuakeTwinSpireAbyss,
  },
  {
    id: 'quake-refinery',
    name: 'Quake: Industrial Refinery (8x)',
    description: '124×124 silo rooms, blast corridors, gantry catwalks & reactor core',
    build: createQuakeRefinery,
  },
  {
    id: 'quake-gauntlet',
    name: 'Quake: Defrag Canyon (8x)',
    description: '160-unit vertical strafe-jump course with wall-runs & twin bridges',
    build: createQuakeDefragGauntlet,
  },
];
