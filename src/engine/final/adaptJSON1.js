import {computeSurfaceNormals, computeProjectedPlaneUVs} from './utils2.js';

export function adaptJSON1(dragonRawData) {

  let mesh = {
    positions: dragonRawData.positions,
    triangles: dragonRawData.cells,
    normals: [],
    uvs: []
  };

  // Compute surface normals
  mesh.normals = computeSurfaceNormals(mesh.positions, mesh.triangles);

  // Compute some easy uvs for testing
  mesh.uvs = computeProjectedPlaneUVs(mesh.positions, 'xy');

  return mesh;
}
// // Push indices for an additional ground plane
// mesh.triangles.push(
//   [mesh.positions.length, mesh.positions.length + 2, mesh.positions.length + 1],
//   [mesh.positions.length, mesh.positions.length + 1, mesh.positions.length + 3]
// );

// // Push vertex attributes for an additional ground plane
// // prettier-ignore
// mesh.positions.push(
//   [-100, 20, -100], //
//   [ 100, 20,  100], //
//   [-100, 20,  100], //
//   [ 100, 20, -100]
// );
// mesh.normals.push(
//   [0, 1, 0], //
//   [0, 1, 0], //
//   [0, 1, 0], //
//   [0, 1, 0]
// );
// mesh.uvs.push(
//   [0, 0], //
//   [1, 1], //
//   [0, 1], //
//   [1, 0]
// );
