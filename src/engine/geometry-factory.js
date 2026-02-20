
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
      case "rock": return GeometryFactory.rock(size, options.detail || 3);
      case "meteor": return GeometryFactory.meteor(size, options.detail || 6);
      case "thunder": return GeometryFactory.thunder(size);
      case "shard": return GeometryFactory.shard(size);
      case "circlePlane": return GeometryFactory.circlePlane(size, segments);
      case "ring": return GeometryFactory.ring(size, options.innerRatio || 0.7, segments, options.height || 0.05);
      default: throw new Error(`Unknown geometry: ${type}`);
    }
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

  // static cube(S = 1) {
  //   const p = S / 2;
  //   const positions = new Float32Array([
  //     -p, -p, p, p, -p, p, p, p, p, -p, p, p,
  //     -p, -p, -p, -p, p, -p, p, p, -p, p, -p, -p,
  //     -p, p, -p, -p, p, p, p, p, p, p, p, -p,
  //     -p, -p, -p, p, -p, -p, p, -p, p, -p, -p, p,
  //     p, -p, -p, p, p, -p, p, p, p, p, -p, p,
  //     -p, -p, -p, -p, -p, p, -p, p, p, -p, p, -p
  //   ]);
  //   const uvs = new Float32Array(6 * 8).fill(0);
  //   const indices = [];
  //   for(let i = 0;i < 6;i++) {
  //     const o = i * 4; indices.push(o, o + 1, o + 2, o, o + 2, o + 3);
  //   }
  //   let i = new Uint16Array(i);
  //   return {positions, uvs, i};
  // }
  static cube(S = 1) {
    const p = S / 2;
    const positions = new Float32Array([
      -p, -p, p, p, -p, p, p, p, p, -p, p, p, // Front
      -p, -p, -p, -p, p, -p, p, p, -p, p, -p, -p, // Back
      -p, p, -p, -p, p, p, p, p, p, p, p, -p, // Top
      -p, -p, -p, p, -p, -p, p, -p, p, -p, -p, p, // Bottom
      p, -p, -p, p, p, -p, p, p, p, p, -p, p, // Right
      -p, -p, -p, -p, -p, p, -p, p, p, -p, p, -p  // Left
    ]);
    const uvs = new Float32Array(6 * 8).fill(0); // Add real UVs if needed
    const indices = new Uint16Array([
      0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7, 8, 9, 10, 8, 10, 11,
      12, 13, 14, 12, 14, 15, 16, 17, 18, 16, 18, 19, 20, 21, 22, 20, 22, 23
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
    const R = S, r = S * 0.4, v = [], uv = [], ind = [];
    for(let i = 0;i < 10;i++) {
      const a = i / 10 * Math.PI * 2;
      const rr = i % 2 ? r : R;
      v.push(Math.cos(a) * rr, Math.sin(a) * rr, 0);
      uv.push((Math.cos(a) + 1) / 2, (Math.sin(a) + 1) / 2);
    }
    for(let i = 1;i < 9;i++) ind.push(0, i, i + 1);
    ind.push(0, 9, 1);
    return {positions: new Float32Array(v), uvs: new Float32Array(uv), indices: new Uint16Array(ind)};
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
    const base = GeometryFactory.sphere(S, detail);
    const p = base.positions;
    for(let i = 0;i < p.length;i += 3) {
      const n = (Math.random() * 0.3 + 0.85);
      p[i] *= n; p[i + 1] *= n; p[i + 2] *= n;
    }
    return base;
  }

  static meteor(S = 1, detail = 6) {
    const base = GeometryFactory.rock(S, detail);
    const p = base.positions;
    // stretch and skew
    for(let i = 0;i < p.length;i += 3) {
      p[i + 1] *= (1.4 + Math.random() * 0.5);
      p[i] *= (0.8 + Math.random() * 0.3);
    }
    return base;
  }

  static shard(S = 1) {
    const positions = new Float32Array([
      0, 0, 0, S * 0.3, 0, S * 0.2, -S * 0.2, 0, S * 0.3, 0, S * 1.2, 0
    ]);
    const uvs = new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]);
    const indices = new Uint16Array([0, 1, 2, 1, 2, 3, 0, 2, 3, 0, 1, 3]);
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
}