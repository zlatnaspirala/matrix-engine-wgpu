/**
 * @description
 * IMPORTANT this is not javascript browser code.
 * This is NODE.JS script.
 * @usage
 * node gen-nav-mesh.js some.obj
 */
import fs from "fs";

function parseOBJ(text) {
  const vertices = [];
  const faces = [];
  for (const line of text.split("\n")) {
    const parts = line.trim().split(/\s+/);
    if (parts[0] === "v") {
      // Vertex line: v x y z
      vertices.push(parts.slice(1).map(Number));
    } else if (parts[0] === "f") {
      // Face line: f a b c
      // Remove texture/normal indices if present (e.g., 1/2/3)
      const indices = parts
        .slice(1)
        .map(p => parseInt(p.split("/")[0]) - 1);
      faces.push(indices);
    }
  }
  return { vertices, faces };
}

// Compute adjacency between polygons
function computeAdjacency(faces, vertices) {
  const edges = new Map();
  const polys = faces.map((indices) => ({
    indices,
    neighbors: [],
  }));

  // Helper to get normalized edge key
  const edgeKey = (a, b) => (a < b ? `${a}_${b}` : `${b}_${a}`);

  // Build edge → face map
  faces.forEach((indices, faceIndex) => {
    for (let i = 0; i < indices.length; i++) {
      const a = indices[i];
      const b = indices[(i + 1) % indices.length];
      const key = edgeKey(a, b);
      if (!edges.has(key)) edges.set(key, []);
      edges.get(key).push(faceIndex);
    }
  });

  // Connect polygons sharing an edge
  for (const [, facesSharing] of edges) {
    if (facesSharing.length === 2) {
      const [a, b] = facesSharing;
      polys[a].neighbors.push(b);
      polys[b].neighbors.push(a);
    }
  }

  return polys;
}

function convertOBJToNavMesh(inputPath, outputPath) {
  const text = fs.readFileSync(inputPath, "utf8");
  const { vertices, faces } = parseOBJ(text);
  const polygons = computeAdjacency(faces, vertices);
  const data = { vertices, polygons };
  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
  console.log(`✅ NavMesh exported: ${outputPath}`);
}

// Run via CLI
const input = process.argv[2];
const output = process.argv[3] || "navmesh.json";

if (!input) {
  console.log("Usage: node convert-navmesh.js <input.obj> [output.json]");
  process.exit(1);
}

convertOBJToNavMesh(input, output);