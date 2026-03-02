
/**
 * @description
 * GeometryFactory - can be reused for any level of pipeline integration.
 * It is already integrated with level of 'me effects'.
 */
export class GeometryFactory {
  static create(type, size = 1, segments = 16, options = {}) {
    switch(type) {
      case "quad": return GeometryFactory.quad(size);
      case "cube": return GeometryFactory.cube(size);
      case "sphere": return GeometryFactory.sphere(size, segments);
      case "pyramid": return GeometryFactory.pyramid(size);
      case "star": return GeometryFactory.star(size);
      case "circle": return GeometryFactory.circle(size, segments);
      case "circle2": return GeometryFactory.circle2(size, segments);
      case "diamond": return GeometryFactory.diamond(size);

      case "meteor": return GeometryFactory.meteor(size, options.detail || 6);
      case "rock": return GeometryFactory.rock(size, options.detail || 3);
      case "thunder": return GeometryFactory.thunder(size);
      case "shard": return GeometryFactory.shard(size);
      case "circlePlane": return GeometryFactory.circlePlane(size, segments);
      case "ring": return GeometryFactory.ring(size, options.innerRatio || 0.7, segments, options.height || 0.05);

      case "icosahedron": return GeometryFactory.icosahedron(size);
      case "dodecahedron": return GeometryFactory.dodecahedron(size);
      case "torusKnot": return GeometryFactory.torusKnot(size, options.tube || 0.2, options.p || 2, options.q || 3, segments, options.tubularSeg || 16);
      case "mobius": return GeometryFactory.mobius(size, options.width || 0.3, segments, options.twists || 1);
      case "crystal": return GeometryFactory.crystal(size, options.spikes || 5);
      case "starPrism": return GeometryFactory.starPrism(size, options.height || 1);
      case "crescent": return GeometryFactory.crescent(size, options.innerRatio || 0.5, segments);
      case "pyramidFractal": return GeometryFactory.pyramidFractal(size, options.levels || 2);
      default: throw new Error(`Unknown geometry: ${type}`);
    }
  }

  static torus(R = 1, tubeRadius = 0.3, radialSegments = 32, tubularSegments = 16) {
    const positions = [], uvs = [], indices = [];
    for(let j = 0;j <= radialSegments;j++) {
      const v = (j / radialSegments) * Math.PI * 2;
      const cosV = Math.cos(v), sinV = Math.sin(v);
      for(let i = 0;i <= tubularSegments;i++) {
        const u = (i / tubularSegments) * Math.PI * 2;
        const cosU = Math.cos(u), sinU = Math.sin(u);
        const x = (R + tubeRadius * cosV) * cosU;
        const y = tubeRadius * sinV;
        const z = (R + tubeRadius * cosV) * sinU;
        positions.push(x, y, z);
        uvs.push(i / tubularSegments, j / radialSegments);
      }
    }
    for(let j = 0;j < radialSegments;j++) {
      for(let i = 0;i < tubularSegments;i++) {
        const a = j * (tubularSegments + 1) + i;
        const b = a + tubularSegments + 1;
        indices.push(a, b, a + 1, b, b + 1, a + 1);
      }
    }
    return {positions: new Float32Array(positions), uvs: new Float32Array(uvs), indices: new Uint16Array(indices)};
  }

  static mobius(R = 1, width = 0.3, segments = 64, twists = 1) {
    const positions = [], uvs = [], indices = [];
    for(let i = 0;i <= segments;i++) {
      const t = i / segments * Math.PI * 2;
      for(let j = -1;j <= 1;j += 2) {
        const s = j * width / 2;
        const x = (R + s * Math.cos(t * twists / 2)) * Math.cos(t);
        const y = (R + s * Math.cos(t * twists / 2)) * Math.sin(t);
        const z = s * Math.sin(t * twists / 2);
        positions.push(x, y, z);
        uvs.push(i / segments, (j + 1) / 2);
      }
    }
    for(let i = 0;i < segments;i++) {
      const a = i * 2, b = i * 2 + 1, c = (i + 1) * 2, d = (i + 1) * 2 + 1;
      indices.push(a, b, c, b, d, c);
    }
    return {positions: new Float32Array(positions), uvs: new Float32Array(uvs), indices: new Uint16Array(indices)};
  }

  static crystal(S = 1, spikes = 5) {
    const positions = [0, 0, 0], uvs = [0.5, 0.5], indices = [];
    for(let i = 0;i < spikes;i++) {
      const angle = (i / spikes) * Math.PI * 2;
      const x = Math.cos(angle) * S, y = S, z = Math.sin(angle) * S;
      positions.push(x, 0, z, x, y, z);
      uvs.push(0, 0, 1, 1);
      const idx = 1 + i * 2;
      indices.push(0, idx, idx + 1);
    }
    return {positions: new Float32Array(positions), uvs: new Float32Array(uvs), indices: new Uint16Array(indices)};
  }

  static starPrism(S = 1, H = 1) {
    const top = [], bottom = [], positions = [0, 0, 0], uvs = [0.5, 0.5], indices = [];
    for(let i = 0;i < 10;i++) {
      const angle = (i / 10) * Math.PI * 2;
      const r = i % 2 === 0 ? S : S * 0.4;
      const x = Math.cos(angle) * r, y = Math.sin(angle) * r;
      top.push([x, H / 2, y]);
      bottom.push([x, -H / 2, y]);
      positions.push(x, H / 2, y);
      positions.push(x, -H / 2, y);
      uvs.push((x / S + 1) / 2, (y / S + 1) / 2, (x / S + 1) / 2, (y / S + 1) / 2);
    }
    for(let i = 0;i < 10;i++) {
      const a = i * 2, b = (i * 2 + 2) % 20, c = a + 1, d = (i * 2 + 3) % 20;
      indices.push(a, b, c, b, d, c);
    }
    return {positions: new Float32Array(positions), uvs: new Float32Array(uvs), indices: new Uint16Array(indices)};
  }

  static crescent(R = 1, innerRatio = 0.5, segments = 32) {
    const positions = [0, 0, 0], uvs = [0.5, 0.5], indices = [];
    for(let i = 0;i <= segments;i++) {
      const a = i / segments * Math.PI * 2;
      const x = Math.cos(a) * R, y = Math.sin(a) * R;
      positions.push(x, y, 0);
      uvs.push((x / R + 1) / 2, (y / R + 1) / 2);
      const xi = Math.cos(a) * R * innerRatio, yi = Math.sin(a) * R * innerRatio;
      positions.push(xi, yi, 0);
      uvs.push((xi / (R * innerRatio) + 1) / 2, (yi / (R * innerRatio) + 1) / 2);
      if(i > 0) {
        const o = (i - 1) * 2 + 1;
        indices.push(o - 1, o, o + 1, o, o + 2, o + 1);
      }
    }
    return {positions: new Float32Array(positions), uvs: new Float32Array(uvs), indices: new Uint16Array(indices)};
  }

  static pyramidFractal(S = 1, levels = 2) {
    // ✅ Use arrays that get properly filled, not mutated references
    const positions = [];
    const uvs = [];
    const indices = [];

    let vertexIndex = 0; // Track current vertex count

    const generate = (x = 0, y = 0, z = 0, s = S, level = levels) => {
      if(level <= 0) return;

      const halfS = s / 2;

      // 5 vertices: 4 base corners + 1 apex
      const verts = [
        x - halfS, y, z - halfS,  // 0: bottom-left
        x + halfS, y, z - halfS,  // 1: bottom-right
        x + halfS, y, z + halfS,  // 2: top-right
        x - halfS, y, z + halfS,  // 3: top-left
        x, y + s, z               // 4: apex
      ];

      // ✅ Proper UVs for each vertex (not just one pair!)
      const vertUVs = [
        0, 0,     // 0: bottom-left corner
        1, 0,     // 1: bottom-right corner
        1, 1,     // 2: top-right corner
        0, 1,     // 3: top-left corner
        0.5, 0.5  // 4: apex (center)
      ];

      // Triangle indices (relative to current base)
      const baseIdx = vertexIndex;
      const tris = [
        baseIdx + 0, baseIdx + 1, baseIdx + 4,  // Front face
        baseIdx + 1, baseIdx + 2, baseIdx + 4,  // Right face
        baseIdx + 2, baseIdx + 3, baseIdx + 4,  // Back face
        baseIdx + 3, baseIdx + 0, baseIdx + 4,  // Left face
      ];

      // ✅ Push to arrays (not mutate references)
      positions.push(...verts);
      uvs.push(...vertUVs);
      indices.push(...tris);

      vertexIndex += 5; // 5 vertices added

      // Recurse: smaller pyramid on top
      if(level > 1) {
        generate(x, y + s, z, halfS, level - 1);
      }
    };

    generate();

    return {
      positions: new Float32Array(positions),
      uvs: new Float32Array(uvs),
      indices: new Uint16Array(indices)
    };
  }

  static pyramidSierpinski(S = 1, levels = 2) {
    const positions = [];
    const uvs = [];
    const indices = [];

    let vertexIndex = 0;

    const generate = (x = 0, y = 0, z = 0, s = S, level = levels) => {
      if(level <= 0) {
        // Base case: draw a single pyramid
        const halfS = s / 2;

        const verts = [
          x - halfS, y, z - halfS,
          x + halfS, y, z - halfS,
          x + halfS, y, z + halfS,
          x - halfS, y, z + halfS,
          x, y + s, z
        ];

        const vertUVs = [
          0, 0, 1, 0, 1, 1, 0, 1, 0.5, 0.5
        ];

        const baseIdx = vertexIndex;
        const tris = [
          baseIdx + 0, baseIdx + 1, baseIdx + 4,
          baseIdx + 1, baseIdx + 2, baseIdx + 4,
          baseIdx + 2, baseIdx + 3, baseIdx + 4,
          baseIdx + 3, baseIdx + 0, baseIdx + 4,
          // Base (optional - makes it solid)
          baseIdx + 0, baseIdx + 2, baseIdx + 1,
          baseIdx + 0, baseIdx + 3, baseIdx + 2,
        ];

        positions.push(...verts);
        uvs.push(...vertUVs);
        indices.push(...tris);

        vertexIndex += 5;
        return;
      }

      // Recursive case: 4 smaller pyramids (Sierpiński pattern)
      const halfS = s / 2;
      const quarterS = s / 4;

      // Bottom 4 corners
      generate(x - quarterS, y, z - quarterS, halfS, level - 1); // Front-left
      generate(x + quarterS, y, z - quarterS, halfS, level - 1); // Front-right
      generate(x + quarterS, y, z + quarterS, halfS, level - 1); // Back-right
      generate(x - quarterS, y, z + quarterS, halfS, level - 1); // Back-left

      // Top pyramid
      generate(x, y + halfS, z, halfS, level - 1);
    };

    generate();

    return {
      positions: new Float32Array(positions),
      uvs: new Float32Array(uvs),
      indices: new Uint16Array(indices)
    };
  }

  static cone(radius = 1, height = 2, segments = 32) {
    const positions = [0, height, 0]; // top
    const uvs = [0.5, 1];
    const indices = [];

    for(let i = 0;i <= segments;i++) {
      const angle = (i / segments) * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      positions.push(x, 0, z);
      uvs.push((x / radius + 1) / 2, (z / radius + 1) / 2);
    }

    for(let i = 1;i <= segments;i++) {
      indices.push(0, i, i + 1 <= segments ? i + 1 : 1); // triangles to top
    }

    // Base
    const baseIndex = positions.length / 3;
    positions.push(0, 0, 0); // center
    uvs.push(0.5, 0.5);
    for(let i = 1;i <= segments;i++) {
      const next = i + 1 <= segments ? i + 1 : 1;
      indices.push(baseIndex, next, i);
    }

    return {positions: new Float32Array(positions), uvs: new Float32Array(uvs), indices: new Uint16Array(indices)};
  }

  static cylinder(radius = 1, height = 2, segments = 32) {
    const positions = [], uvs = [], indices = [];
    const halfH = height / 2;

    for(let i = 0;i <= segments;i++) {
      const angle = (i / segments) * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      positions.push(x, -halfH, z, x, halfH, z);
      uvs.push(i / segments, 0, i / segments, 1);
    }

    for(let i = 0;i < segments;i++) {
      const a = i * 2, b = a + 1, c = a + 2, d = a + 3;
      indices.push(a, b, c, b, d, c); // side faces
    }

    // Caps
    const baseIndex = positions.length / 3;
    positions.push(0, -halfH, 0, 0, halfH, 0);
    uvs.push(0.5, 0.5, 0.5, 0.5);
    for(let i = 0;i < segments;i++) {
      const next = (i + 1) % segments;
      indices.push(baseIndex, i * 2, next * 2); // bottom
      indices.push(baseIndex + 1, next * 2 + 1, i * 2 + 1); // top
    }

    return {positions: new Float32Array(positions), uvs: new Float32Array(uvs), indices: new Uint16Array(indices)};
  }

  static capsule(radius = 0.5, height = 2, segments = 16) {
    const positions = [], uvs = [], indices = [];

    // Generate top hemisphere
    for(let y = 0;y <= segments;y++) {
      const theta = (y / segments) * Math.PI / 2;
      for(let x = 0;x <= segments;x++) {
        const phi = (x / segments) * Math.PI * 2;
        const px = Math.cos(phi) * Math.sin(theta) * radius;
        const py = Math.cos(theta) * radius + height / 2;
        const pz = Math.sin(phi) * Math.sin(theta) * radius;
        positions.push(px, py, pz);
        uvs.push(x / segments, y / segments);
      }
    }

    // Bottom hemisphere (mirror top)
    const offset = positions.length / 3;
    for(let y = 0;y <= segments;y++) {
      const theta = (y / segments) * Math.PI / 2;
      for(let x = 0;x <= segments;x++) {
        const phi = (x / segments) * Math.PI * 2;
        const px = Math.cos(phi) * Math.sin(theta) * radius;
        const py = -Math.cos(theta) * radius - height / 2;
        const pz = Math.sin(phi) * Math.sin(theta) * radius;
        positions.push(px, py, pz);
        uvs.push(x / segments, y / segments);
      }
    }

    // TODO: connect indices (complex, but I can provide if needed)
    return {positions: new Float32Array(positions), uvs: new Float32Array(uvs), indices: new Uint16Array(indices)};
  }

  static icosahedron(R = 1) {
    const t = (1 + Math.sqrt(5)) / 2; // Golden ratio

    // 12 vertices of icosahedron
    const verts = [
      -1, t, 0, 1, t, 0, -1, -t, 0, 1, -t, 0,
      0, -1, t, 0, 1, t, 0, -1, -t, 0, 1, -t,
      t, 0, -1, t, 0, 1, -t, 0, -1, -t, 0, 1
    ];

    // Normalize vertices to radius R
    for(let i = 0;i < verts.length;i += 3) {
      const len = Math.sqrt(
        verts[i] * verts[i] +
        verts[i + 1] * verts[i + 1] +
        verts[i + 2] * verts[i + 2]
      );
      verts[i] = (verts[i] / len) * R;
      verts[i + 1] = (verts[i + 1] / len) * R;
      verts[i + 2] = (verts[i + 2] / len) * R;
    }

    const indices = [
      0, 11, 5, 0, 5, 1, 0, 1, 7, 0, 7, 10, 0, 10, 11,
      1, 5, 9, 5, 11, 4, 11, 10, 2, 10, 7, 6, 7, 1, 8,
      3, 9, 4, 3, 4, 2, 3, 2, 6, 3, 6, 8, 3, 8, 9,
      4, 9, 5, 2, 4, 11, 6, 2, 10, 8, 6, 7, 9, 8, 1
    ];

    // Generate spherical UVs based on position
    const uvs = [];
    for(let i = 0;i < verts.length;i += 3) {
      const x = verts[i];
      const y = verts[i + 1];
      const z = verts[i + 2];

      // Spherical UV mapping
      // u = 0.5 + atan2(z, x) / (2π)
      // v = 0.5 - asin(y / R) / π
      const u = 0.5 + Math.atan2(z, x) / (2 * Math.PI);
      const v = 0.5 - Math.asin(y / R) / Math.PI;

      uvs.push(u, v);
    }

    return {
      positions: new Float32Array(verts),
      uvs: new Float32Array(uvs),
      indices: new Uint16Array(indices)
    };
  }

  static dodecahedron(R = 1) {
    const phi = (1 + Math.sqrt(5)) / 2;
    let verts = [];
    const p = [-1, 1];
    for(let i of p) {
      for(let j of p) {
        for(let k of p) {
          verts.push(i, j, k);
        }
      }
    }
    verts.push(0, 1 / phi, phi, 0, 1 / phi, -phi, 0, -1 / phi, phi, 0, -1 / phi, -phi);
    verts.push(1 / phi, phi, 0, 1 / phi, -phi, 0, -1 / phi, phi, 0, -1 / phi, -phi, 0);
    verts.push(phi, 0, 1 / phi, phi, 0, -1 / phi, -phi, 0, 1 / phi, -phi, 0, -1 / phi);
    // normalize to R
    for(let i = 0;i < verts.length;i += 3) {
      const len = Math.sqrt(verts[i] * verts[i] + verts[i + 1] * verts[i + 1] + verts[i + 2] * verts[i + 2]);
      verts[i] = verts[i] / len * R;
      verts[i + 1] = verts[i + 1] / len * R;
      verts[i + 2] = verts[i + 2] / len * R;
    }
    const uvs = new Float32Array(verts.length / 3 * 2).fill(0);
    // indices: manually computed pentagons -> triangles
    // TODO: could generate automatically
    return {positions: new Float32Array(verts), uvs, indices: new Uint16Array([])};
  }

  static torusKnot(R = 1, tube = 0.2, p = 2, q = 3, radialSeg = 128, tubularSeg = 16) {
    const positions = [], uvs = [], indices = [];
    for(let i = 0;i <= radialSeg;i++) {
      const u = i / radialSeg * Math.PI * 2;
      const cu = Math.cos(u), su = Math.sin(u);
      const quOverP = q / p * u;
      const r = 0.5 * (2 + Math.sin(quOverP));
      const x = r * cu * R, y = r * su * R, z = Math.cos(quOverP) * R * 0.5;
      for(let j = 0;j <= tubularSeg;j++) {
        const v = j / tubularSeg * Math.PI * 2;
        const cx = x + tube * Math.cos(v);
        const cy = y + tube * Math.sin(v);
        const cz = z;
        positions.push(cx, cy, cz);
        uvs.push(i / radialSeg, j / tubularSeg);
      }
    }
    for(let i = 0;i < radialSeg;i++) {
      for(let j = 0;j < tubularSeg;j++) {
        const a = i * (tubularSeg + 1) + j;
        const b = (i + 1) * (tubularSeg + 1) + j;
        indices.push(a, b, a + 1, b, b + 1, a + 1);
      }
    }
    return {positions: new Float32Array(positions), uvs: new Float32Array(uvs), indices: new Uint16Array(indices)};
  }

  static heart(S = 1, segments = 32) {
    const positions = [0, 0, 0];
    const uvs = [0.5, 0.5];
    const indices = [];

    for(let i = 0;i <= segments;i++) {
      const t = (i / segments) * Math.PI * 2;
      const x = 16 * Math.pow(Math.sin(t), 3) * S * 0.05;
      const y = (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) * S * 0.05;
      positions.push(x, y, 0);
      uvs.push((x / S + 1) / 2, (y / S + 1) / 2);
      if(i > 1) indices.push(0, i, i + 1);
    }

    return {positions: new Float32Array(positions), uvs: new Float32Array(uvs), indices: new Uint16Array(indices)};
  }
  // --- BASIC SHAPES ---------------------------------------------------------
  static quad(S = 1) {
    const positions = new Float32Array([
      -S, S, 0, S, S, 0, -S, -S, 0, S, -S, 0
    ]);
    const uvs = new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]);
    const indices = new Uint16Array([0, 2, 1, 1, 2, 3]);
    return {positions, uvs, indices};
  }

  static cube(S = 1) {
    const p = S / 2;

    const positions = new Float32Array([
      // Front
      -p, -p, p, p, -p, p, p, p, p, -p, p, p,
      // Back
      -p, -p, -p, -p, p, -p, p, p, -p, p, -p, -p,
      // Top
      -p, p, -p, -p, p, p, p, p, p, p, p, -p,
      // Bottom
      -p, -p, -p, p, -p, -p, p, -p, p, -p, -p, p,
      // Right
      p, -p, -p, p, p, -p, p, p, p, p, -p, p,
      // Left
      -p, -p, -p, -p, -p, p, -p, p, p, -p, p, -p
    ]);

    // Proper UVs (same layout per face)
    const uvs = new Float32Array([
      // Front
      0, 0, 1, 0, 1, 1, 0, 1,
      // Back
      0, 0, 1, 0, 1, 1, 0, 1,
      // Top
      0, 0, 1, 0, 1, 1, 0, 1,
      // Bottom
      0, 0, 1, 0, 1, 1, 0, 1,
      // Right
      0, 0, 1, 0, 1, 1, 0, 1,
      // Left
      0, 0, 1, 0, 1, 1, 0, 1,
    ]);

    const indices = new Uint16Array([
      0, 1, 2, 0, 2, 3,
      4, 5, 6, 4, 6, 7,
      8, 9, 10, 8, 10, 11,
      12, 13, 14, 12, 14, 15,
      16, 17, 18, 16, 18, 19,
      20, 21, 22, 20, 22, 23
    ]);

    return {positions, uvs, indices};
  }

  static sphere(R = 0.1, seg = 16) {
    const p = [], uv = [], ind = [];
    for(let y = 0;y <= seg;y++) {
      const v = y / seg, θ = v * Math.PI;
      for(let x = 0;x <= seg;x++) {
        const u = x / seg, φ = u * Math.PI * 2;
        p.push(R * Math.sin(θ) * Math.cos(φ), R * Math.cos(θ), R * Math.sin(θ) * Math.sin(φ));
        uv.push(u, v);
      }
    }
    for(let y = 0;y < seg;y++) {
      for(let x = 0;x < seg;x++) {
        const i = y * (seg + 1) + x;
        ind.push(i, i + seg + 1, i + 1, i + 1, i + seg + 1, i + seg + 2);
      }
    }
    return {positions: new Float32Array(p), uvs: new Float32Array(uv), indices: new Uint16Array(ind)};
  }

  static pyramid(S = 1) {
    const h = S, p = S / 2;
    const pos = new Float32Array([
      -p, 0, -p, p, 0, -p, p, 0, p, -p, 0, p, 0, h, 0
    ]);
    const uv = new Float32Array([0, 0, 1, 0, 1, 1, 0, 1, 0.5, 0]);
    const idx = new Uint16Array([0, 1, 2, 0, 2, 3, 0, 1, 4, 1, 2, 4, 2, 3, 4, 3, 0, 4]);
    return {positions: pos, uvs: uv, indices: idx};
  }

  static star(S = 1) {
    const outer = S;
    const inner = S * 0.4;
    const positions = [0, 0, 0]; // center vertex
    const uvs = [0.5, 0.5];     // center UV
    const indices = [];

    // Generate 10 points (outer and inner)
    for(let i = 0;i < 10;i++) {
      const angle = (i / 10) * Math.PI * 2;
      const radius = i % 2 === 0 ? outer : inner;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      positions.push(x, y, 0);
      uvs.push((x / outer + 1) / 2, (y / outer + 1) / 2);
    }

    // Triangles from center to each outer/inner vertex
    for(let i = 1;i <= 10;i++) {
      const next = i < 10 ? i + 1 : 1; // wrap last to first
      indices.push(0, i, next);
    }

    return {
      positions: new Float32Array(positions),
      uvs: new Float32Array(uvs),
      indices: new Uint16Array(indices)
    };
  }

  static circle(R = 1, seg = 32) {
    const p = [0, 0, 0], uv = [0.5, 0.5], ind = [];
    for(let i = 0;i <= seg;i++) {
      const a = i / seg * Math.PI * 2;
      p.push(Math.cos(a) * R, Math.sin(a) * R, 0);
      uv.push((Math.cos(a) + 1) / 2, (Math.sin(a) + 1) / 2);
      if(i > 1) ind.push(0, i - 1, i);
    }
    return {positions: new Float32Array(p), uvs: new Float32Array(uv), indices: new Uint16Array(ind)};
  }

  static circle2(radius = 1, segments = 64) {
    const positions = [0, 0, 0]; // center
    const uvs = [0.5, 0.5];      // center UV
    const indices = [];

    // create outer vertices
    for(let i = 0;i <= segments;i++) {
      const angle = (i / segments) * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      positions.push(x, y, 0);
      // map to circular UV range [0,1]
      uvs.push((x / radius + 1) / 2, (y / radius + 1) / 2);

      if(i > 0) {
        // center = 0, connect previous outer vertex with current outer vertex
        indices.push(0, i, i + 1);
      }
    }

    // close the circle (last triangle connects to first outer vertex)
    // we already pushed (segments + 1) outer vertices, so last index = segments + 1
    // but first outer vertex is index 1
    // gpt suggest comment this line !?
    indices.push(0, segments + 1, 1);

    return {
      positions: new Float32Array(positions),
      uvs: new Float32Array(uvs),
      indices: new Uint16Array(indices)
    };
  }

  static diamond(S = 1) {
    const h = S, p = S / 2;
    // 6 Vertices
    const pos = new Float32Array([
      0, h, 0,    // 0: Top
      -p, 0, -p,   // 1: Mid Left-Back
      p, 0, -p,   // 2: Mid Right-Back
      p, 0, p,   // 3: Mid Right-Front
      -p, 0, p,   // 4: Mid Left-Front
      0, -h, 0     // 5: Bottom
    ]);

    // Added simple UVs so the texture actually shows up
    const uv = new Float32Array([
      0.5, 1,   // Top
      0, 0.5,   // Sides...
      1, 0.5,
      0, 0.5,
      1, 0.5,
      0.5, 0    // Bottom
    ]);

    const idx = new Uint16Array([
      0, 1, 2, 0, 2, 3, 0, 3, 4, 0, 4, 1, // Top pyramid
      5, 2, 1, 5, 3, 2, 5, 4, 3, 5, 1, 4  // Bottom pyramid
    ]);

    return {positions: pos, uvs: uv, indices: idx};
  }

  // --- FANTASY & EFFECT GEOMETRIES -----------------------------------------
  static thunder(S = 1) {
    // jagged lightning bolt made of zig-zag quads
    const pts = [0, 0, 0];
    for(let i = 1;i < 8;i++) {
      const x = (Math.random() - 0.5) * 0.2 * S;
      const y = i * (S / 7);
      const z = (Math.random() - 0.5) * 0.1 * S;
      pts.push(x, y, z);
    }
    const p = [], uv = [], ind = [];
    for(let i = 0;i < pts.length / 3 - 1;i++) {
      const x1 = pts[i * 3], y1 = pts[i * 3 + 1], z1 = pts[i * 3 + 2];
      const x2 = pts[(i + 1) * 3], y2 = pts[(i + 1) * 3 + 1], z2 = pts[(i + 1) * 3 + 2];
      const w = 0.03 * S;
      p.push(x1 - w, y1, z1, x1 + w, y1, z1, x2 - w, y2, z2, x2 + w, y2, z2);
      uv.push(0, 0, 1, 0, 0, 1, 1, 1);
      const o = i * 4;
      ind.push(o, o + 1, o + 2, o + 1, o + 3, o + 2);
    }
    return {positions: new Float32Array(p), uvs: new Float32Array(uv), indices: new Uint16Array(ind)};
  }

  static rock(S = 1, detail = 4) {
    // randomly perturbed sphere for organic shape
    const sphere = GeometryFactory.sphere(S, detail);

    // CLONE positions
    const positions = new Float32Array(sphere.positions);

    for(let i = 0;i < positions.length;i += 3) {
      const n = (Math.random() * 0.3 + 0.85);
      positions[i] *= n;
      positions[i + 1] *= n;
      positions[i + 2] *= n;
    }

    return {
      positions,
      uvs: sphere.uvs,
      indices: sphere.indices
    };
  }

  static meteor(S = 1, detail = 6) {
    // 1. Start with a sphere (or icosahedron)
    const sphere = GeometryFactory.sphere(S, detail);

    const positions = new Float32Array(sphere.positions.length);
    const normals = new Float32Array(sphere.positions.length);

    // 2. Compute normals (centered at origin)
    for(let i = 0;i < sphere.positions.length;i += 3) {
      const x = sphere.positions[i];
      const y = sphere.positions[i + 1];
      const z = sphere.positions[i + 2];
      const len = Math.sqrt(x * x + y * y + z * z);
      normals[i] = x / len;
      normals[i + 1] = y / len;
      normals[i + 2] = z / len;
    }

    // 3. Perturb vertices outward along normal
    for(let i = 0;i < positions.length;i += 3) {
      const offset = 0.05 + Math.random() * 0.1; // adjust roughness
      positions[i] = sphere.positions[i] + normals[i] * offset;
      positions[i + 1] = sphere.positions[i + 1] + normals[i + 1] * offset;
      positions[i + 2] = sphere.positions[i + 2] + normals[i + 2] * offset;
    }

    // 4. Stretch Y slightly along normal
    for(let i = 0;i < positions.length;i += 3) {
      positions[i + 1] *= 1.5; // Y-stretch
    }

    return {
      positions,
      uvs: sphere.uvs,
      indices: sphere.indices
    };
  }

  static shard(S = 1) {
    const positions = new Float32Array([
      0, 0, 0,
      S * 0.3, 0, S * 0.2,
      -S * 0.2, 0, S * 0.3,
      0, S * 1.2, 0
    ]);

    const uvs = new Float32Array([
      0.5, 0,
      1, 0.5,
      0, 0.5,
      0.5, 1
    ]);

    const indices = new Uint16Array([
      0, 1, 2,
      1, 2, 3,
      0, 2, 3,
      0, 1, 3
    ]);

    return {positions, uvs, indices};
  }

  static circlePlane(radius = 1, segments = 32) {
    const positions = [];
    const uvs = [];
    const indices = [];

    // Center vertex
    positions.push(0, 0, 0);
    uvs.push(0.5, 0.5);

    // Outer ring vertices
    for(let i = 0;i <= segments;i++) {
      const angle = (i / segments) * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const y = 0;
      const z = Math.sin(angle) * radius;
      positions.push(x, y, z);
      uvs.push((x / radius + 1) / 2, (z / radius + 1) / 2);
    }

    // Triangles (fan)
    for(let i = 1;i <= segments;i++) {
      indices.push(0, i, i + 1);
    }

    return {
      positions: new Float32Array(positions),
      uvs: new Float32Array(uvs),
      indices: new Uint16Array(indices)
    };
  }


  static ring(outerRadius = 4, innerRadiusRatio = 0.7, segments = 48, height = 0.05) {
    const innerRadius = outerRadius * innerRadiusRatio;
    const positions = [];
    const uvs = [];
    const indices = [];

    for(let i = 0;i <= segments;i++) {
      const angle = (i / segments) * Math.PI * 2;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);

      // outer edge
      positions.push(cos * outerRadius, 0, sin * outerRadius);
      uvs.push((cos + 1) / 2, (sin + 1) / 2);

      // inner edge (slightly higher if you want a bit of volume)
      positions.push(cos * innerRadius, height, sin * innerRadius);
      uvs.push((cos * innerRadius / outerRadius + 1) / 2, (sin * innerRadius / outerRadius + 1) / 2);
    }

    // Triangles
    for(let i = 0;i < segments * 2;i += 2) {
      indices.push(i, i + 1, i + 2);
      indices.push(i + 1, i + 3, i + 2);
    }

    return {
      positions: new Float32Array(positions),
      uvs: new Float32Array(uvs),
      indices: new Uint16Array(indices)
    };
  }

  static icosahedronSubdivided(R = 1, subdivisions = 1) {
    // Start with base icosahedron
    let geo = GeometryFactory.icosahedron(R);

    // Subdivide each triangle
    for(let s = 0;s < subdivisions;s++) {
      geo = subdivideTriangles(geo, R);
    }

    return geo;

    // Helper: Subdivide each triangle into 4 smaller triangles
    function subdivideTriangles(geo, radius) {
      const oldPos = [...geo.positions];
      const oldIdx = [...geo.indices];

      const newPos = [];
      const newUvs = [];
      const newIdx = [];
      const midpoints = new Map();

      function getMidpoint(i0, i1) {
        const key = i0 < i1 ? `${i0}_${i1}` : `${i1}_${i0}`;
        if(midpoints.has(key)) return midpoints.get(key);

        const x0 = oldPos[i0 * 3], y0 = oldPos[i0 * 3 + 1], z0 = oldPos[i0 * 3 + 2];
        const x1 = oldPos[i1 * 3], y1 = oldPos[i1 * 3 + 1], z1 = oldPos[i1 * 3 + 2];

        // Midpoint
        let mx = (x0 + x1) / 2;
        let my = (y0 + y1) / 2;
        let mz = (z0 + z1) / 2;

        // Normalize to sphere surface
        const len = Math.sqrt(mx * mx + my * my + mz * mz);
        mx = (mx / len) * radius;
        my = (my / len) * radius;
        mz = (mz / len) * radius;

        const newIdx = newPos.length / 3;
        newPos.push(mx, my, mz);

        // UV for new vertex
        const u = 0.5 + Math.atan2(mz, mx) / (2 * Math.PI);
        const v = 0.5 - Math.asin(my / radius) / Math.PI;
        newUvs.push(u, v);

        midpoints.set(key, newIdx);
        return newIdx;
      }

      // Copy original vertices
      for(let i = 0;i < oldPos.length;i++) {
        newPos.push(oldPos[i]);
      }
      for(let i = 0;i < geo.uvs.length;i++) {
        newUvs.push(geo.uvs[i]);
      }

      // Subdivide each triangle
      for(let i = 0;i < oldIdx.length;i += 3) {
        const v0 = oldIdx[i];
        const v1 = oldIdx[i + 1];
        const v2 = oldIdx[i + 2];

        const m01 = getMidpoint(v0, v1);
        const m12 = getMidpoint(v1, v2);
        const m20 = getMidpoint(v2, v0);

        // 4 new triangles
        newIdx.push(v0, m01, m20);
        newIdx.push(v1, m12, m01);
        newIdx.push(v2, m20, m12);
        newIdx.push(m01, m12, m20);
      }

      return {
        positions: new Float32Array(newPos),
        uvs: new Float32Array(newUvs),
        indices: new Uint16Array(newIdx)
      };
    }
  }
}