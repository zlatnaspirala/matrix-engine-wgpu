// Stone column
export function fountainStructureConfig(MeshMorpher) {
    return { meshA: MeshMorpher.cylinder(0.15, 2.5), meshB: MeshMorpher.cylinder(0.15, 2.5), resolutionU: 32, resolutionV: 1 };
}
// Stone basin floor
export function fountainBasinStoneConfig(MeshMorpher) {
    return { meshA: MeshMorpher.plane(2.5), meshB: MeshMorpher.plane(2.5), resolutionU: 1, resolutionV: 1 };
}
// Water top disk
export function fountainCapConfig(MeshMorpher) {
    return { meshA: MeshMorpher.plane(1.0), meshB: MeshMorpher.plane(1.4), resolutionU: 1, resolutionV: 1 };
}
// Water curtain
export function fountainCurtainConfig(MeshMorpher) {
    return { meshA: MeshMorpher.cylinder(0.5, 2.0), meshB: MeshMorpher.cylinder(0.6, 2.0), resolutionU: 48, resolutionV: 32 };
}
// Basin water surface
export function fountainBasinWaterConfig(MeshMorpher) {
    return { meshA: MeshMorpher.plane(2.0), meshB: MeshMorpher.plane(2.0), resolutionU: 1, resolutionV: 1 };
}

export const FOUNTAIN_COLUMN_TOP = 1.25;  // half of cylinder height 2.5
