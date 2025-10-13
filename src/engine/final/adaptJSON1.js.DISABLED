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

export function addVerticesNormalUvs(mesh) {

  var meshAdapted = {
    positions: [],
    cells: [],
    uvs: mesh.textures,
    vertices: mesh.vertices
    // normals: mesh.vertexNormals
  };
  // force syntese 
  for (var x = 0; x < mesh.vertices.length; x=x+3) {
    var sub = [];
    sub.push(mesh.vertices[x])
    sub.push(mesh.vertices[x+1])
    sub.push(mesh.vertices[x+2])
    meshAdapted.positions.push(sub)
    sub = [];
    sub.push(mesh.indices[x])
    sub.push(mesh.indices[x+1])
    sub.push(mesh.indices[x+2])
    meshAdapted.cells.push(sub)
  }

    // Compute surface normals
    meshAdapted.normals = computeSurfaceNormals(meshAdapted.positions, meshAdapted.cells);
    // Compute some easy uvs for testing
    meshAdapted.uvs = computeProjectedPlaneUVs(meshAdapted.positions, 'xy');
     
    meshAdapted.triangles = meshAdapted.cells
  return meshAdapted;
}

 