export default class NavMesh {
  constructor(data, options = {}) {
    // expects data.vertices = [[x,y,z],...]
    // and data.polygons = [{ indices: [i0,i1,i2], neighbors: [...] }, ...]
    const scale = options.scale ?? [1, 1, 1]; // default: no scaling
    const sx = scale[0], sy = scale[1], sz = scale[2];

    // Apply scale to each vertex
    this.vertices = data.vertices.map(v => [
      v[0] * sx,
      v[1] * sy,
      v[2] * sz
    ]);

    this.polygons = data.polygons.map(p => ({
      indices: p.indices.slice(),
      neighbors: (p.neighbors || []).slice()
    }));

    // Compute derived info
    this._computeCenters();
    this._buildEdgeMap();
  }

  _computeCenters() {
    this.centers = this.polygons.map(poly => {
      const vs = poly.indices.map(i => this.vertices[i]);
      const cx = (vs[0][0] + vs[1][0] + vs[2][0]) / 3;
      const cy = (vs[0][1] + vs[1][1] + vs[2][1]) / 3;
      const cz = (vs[0][2] + vs[1][2] + vs[2][2]) / 3;
      return [cx, cy, cz];
    });
  }

  _edgeKey(a, b) {
    return a < b ? `${a}_${b}` : `${b}_${a}`;
  }

  _buildEdgeMap() {
    // map edgeKey -> array of {poly, aIndex, bIndex}
    this.edgeMap = new Map();
    this.polygons.forEach((poly, pi) => {
      const indices = poly.indices;
      for(let i = 0;i < indices.length;i++) {
        const a = indices[i];
        const b = indices[(i + 1) % indices.length];
        const key = this._edgeKey(a, b);
        if(!this.edgeMap.has(key)) this.edgeMap.set(key, []);
        this.edgeMap.get(key).push({poly: pi, a, b});
      }
    });
  }

  // Point-in-triangle test in XZ plane using barycentric technique
  _pointInTriXZ(pt, v0, v1, v2) {
    const x = pt[0], z = pt[2];
    const ax = v0[0], az = v0[2];
    const bx = v1[0], bz = v1[2];
    const cx = v2[0], cz = v2[2];
    // vectors
    const v0x = cx - ax, v0z = cz - az;
    const v1x = bx - ax, v1z = bz - az;
    const v2x = x - ax, v2z = z - az;
    const dot00 = v0x * v0x + v0z * v0z;
    const dot01 = v0x * v1x + v0z * v1z;
    const dot02 = v0x * v2x + v0z * v2z;
    const dot11 = v1x * v1x + v1z * v1z;
    const dot12 = v1x * v2x + v1z * v2z;
    const denom = dot00 * dot11 - dot01 * dot01;
    if(Math.abs(denom) < 1e-9) return false;
    const u = (dot11 * dot02 - dot01 * dot12) / denom;
    const v = (dot00 * dot12 - dot01 * dot02) / denom;
    return (u >= -1e-6) && (v >= -1e-6) && (u + v <= 1 + 1e-6);
  }

  findPolygonContainingPoint(point) {
    // first try naive linear scan (ok for medium meshes). point = [x,y,z]
    for(let i = 0;i < this.polygons.length;i++) {
      const poly = this.polygons[i];
      const v0 = this.vertices[poly.indices[0]];
      const v1 = this.vertices[poly.indices[1]];
      const v2 = this.vertices[poly.indices[2]];
      if(this._pointInTriXZ(point, v0, v1, v2)) return i;
    }
    // fallback: return nearest polygon center
    let best = 0;
    let bestD = Infinity;
    for(let i = 0;i < this.centers.length;i++) {
      const c = this.centers[i];
      const dx = c[0] - point[0];
      const dz = c[2] - point[2];
      const d = dx * dx + dz * dz;
      if(d < bestD) {bestD = d; best = i;}
    }
    return best;
  }

  // A* over polygon graph. returns list of polygon indices (inclusive)
  _findPolyPath(startPoly, endPoly) {
    if(startPoly === endPoly) return [startPoly];
    const open = new MinHeap((a, b) => a.f - b.f);
    const nodes = new Array(this.polygons.length);
    for(let i = 0;i < nodes.length;i++) nodes[i] = {g: Infinity, h: 0, f: Infinity, parent: -1, id: i};

    nodes[startPoly].g = 0;
    nodes[startPoly].h = this._heuristic(startPoly, endPoly);
    nodes[startPoly].f = nodes[startPoly].h;
    open.push(nodes[startPoly]);

    const closed = new Set();

    while(!open.empty()) {
      const current = open.pop();
      if(current.id === endPoly) {
        const path = [];
        let cur = current;
        while(cur) {
          path.push(cur.id);
          if(cur.parent === -1) break;
          cur = nodes[cur.parent];
        }
        return path.reverse();
      }
      closed.add(current.id);
      const neighbors = this.polygons[current.id].neighbors || [];
      for(const nId of neighbors) {
        if(closed.has(nId)) continue;
        const tentativeG = current.g + this._edgeCost(current.id, nId);
        const neigh = nodes[nId];
        if(tentativeG < neigh.g) {
          neigh.parent = current.id;
          neigh.g = tentativeG;
          neigh.h = this._heuristic(nId, endPoly);
          neigh.f = neigh.g + neigh.h;
          open.push(neigh);
        }
      }
    }

    return []; // no path
  }

  _heuristic(aIdx, bIdx) {
    const a = this.centers[aIdx];
    const b = this.centers[bIdx];
    const dx = a[0] - b[0];
    const dz = a[2] - b[2];
    return Math.sqrt(dx * dx + dz * dz);
  }

  _edgeCost(aIdx, bIdx) {
    // Euclidean distance between polygon centers
    const a = this.centers[aIdx];
    const b = this.centers[bIdx];
    const dx = a[0] - b[0];
    const dz = a[2] - b[2];
    return Math.sqrt(dx * dx + dz * dz);
  }

  // build portal list (pair of points) between the sequence of polygons
  _buildPortals(polyPath, startPoint, endPoint) {
    // portals: array of {left:[x,y,z], right:[x,y,z]}
    const portals = [];
    for(let i = 0;i < polyPath.length - 1;i++) {
      const aIdx = polyPath[i];
      const bIdx = polyPath[i + 1];
      // find shared edge between aIdx and bIdx
      const pa = this.polygons[aIdx];
      const pb = this.polygons[bIdx];
      let shared = null;
      for(let ia = 0;ia < pa.indices.length;ia++) {
        const a0 = pa.indices[ia], a1 = pa.indices[(ia + 1) % pa.indices.length];
        const key = this._edgeKey(a0, a1);
        const entries = this.edgeMap.get(key) || [];
        for(const e of entries) {
          if(e.poly === bIdx) {
            // shared edge
            shared = [this.vertices[a0], this.vertices[a1]];
            break;
          }
        }
        if(shared) break;
      }
      if(!shared) {
        // fallback: use centers
        const cA = this.centers[aIdx];
        const cB = this.centers[bIdx];
        portals.push({left: cA.slice(), right: cB.slice()});
      } else {
        // ensure consistent ordering (left/right) in XZ relative to path direction
        portals.push({left: shared[0].slice(), right: shared[1].slice()});
      }
    }

    // prepend start and append end as degenerate portals
    portals.unshift({left: startPoint.slice(), right: startPoint.slice()});
    portals.push({left: endPoint.slice(), right: endPoint.slice()});
    return portals;
  }

  // Funnel algorithm (returns array of [x,y,z])
  _stringPull(portals) {
    // classic funnel over XZ plane
    const portalLeft = portals.map(p => [p.left[0], p.left[2]]);
    const portalRight = portals.map(p => [p.right[0], p.right[2]]);
    const points = []; // result XZ
    let apexIndex = 0, leftIndex = 0, rightIndex = 0;
    let apex = portalLeft[0].slice();
    let left = portalLeft[0].slice();
    let right = portalRight[0].slice();
    points.push([apex[0], apex[1]]); // x,z

    function vecCross(a, b) {return a[0] * b[1] - a[1] * b[0];}
    function sub(a, b) {return [a[0] - b[0], a[1] - b[1]];}

    for(let i = 1;i < portalLeft.length;i++) {
      const pLeft = portalLeft[i];
      const pRight = portalRight[i];

      // update right
      const relRight = sub(pRight, apex);
      const relRightCur = sub(right, apex);
      if(vecCross(relRightCur, relRight) >= 0) {
        // new right is more 'right' -> tighten
        if(vecCross(sub(left, apex), relRight) > 0) {
          // right crosses left -> advance apex to left
          points.push([left[0], left[1]]);
          apex = left.slice();
          // reset indices
          apexIndex = leftIndex;
          leftIndex = apexIndex;
          rightIndex = apexIndex;
          left = apex.slice();
          right = apex.slice();
          i = apexIndex; // continue from apexIndex+1 next loop
          continue;
        }
        right = pRight.slice();
        rightIndex = i;
      }

      // update left
      const relLeft = sub(pLeft, apex);
      const relLeftCur = sub(left, apex);
      if(vecCross(relLeftCur, relLeft) <= 0) {
        // new left is more 'left' -> tighten
        if(vecCross(sub(right, apex), relLeft) < 0) {
          // left crosses right -> advance apex to right
          points.push([right[0], right[1]]);
          apex = right.slice();
          apexIndex = rightIndex;
          leftIndex = apexIndex;
          rightIndex = apexIndex;
          left = apex.slice();
          right = apex.slice();
          i = apexIndex;
          continue;
        }
        left = pLeft.slice();
        leftIndex = i;
      }
    }

    // add goal
    const lastPortal = portalLeft[portalLeft.length - 1];
    points.push([lastPortal[0], lastPortal[1]]);

    // convert back to [x,y,z] with Y taken from mesh average Y (or 0)
    const out = points.map(xz => {
      const x = xz[0], z = xz[1];
      // pick Y from nearest vertex on mesh (cheap approximation)
      const y = this._sampleY(x, z);
      return [x, y, z];
    });

    return out;
  }

  _sampleY(x, z) {
    // sample Y using nearest vertex (cheap). If you have heightmap, use that.
    let bestD = Infinity, bestY = 0;
    for(let i = 0;i < this.vertices.length;i++) {
      const v = this.vertices[i];
      const dx = v[0] - x, dz = v[2] - z;
      const d = dx * dx + dz * dz;
      if(d < bestD) {bestD = d; bestY = v[1];}
    }
    return bestY;
  }

  // Public API: returns an array of [x,y,z] waypoints or [] if unreachable
  findPath(startPoint, endPoint) {
    // startPoint and endPoint are [x,y,z]
    const startPoly = this.findPolygonContainingPoint(startPoint);
    const endPoly = this.findPolygonContainingPoint(endPoint);
    if(startPoly === null || endPoly === null) return [];

    const polyPath = this._findPolyPath(startPoly, endPoly);
    if(!polyPath || polyPath.length === 0) return [];

    // If polyPath is single poly, simply return [start,end]
    if(polyPath.length === 1) {
      return [[startPoint[0], this._sampleY(startPoint[0], startPoint[2]), startPoint[2]],
      [endPoint[0], this._sampleY(endPoint[0], endPoint[2]), endPoint[2]]];
    }

    const portals = this._buildPortals(polyPath, startPoint, endPoint);
    const smooth = this._stringPull(portals);
    // ensure first/last are exactly start/end
    if(smooth.length > 0) {
      smooth[0] = [startPoint[0], this._sampleY(startPoint[0], startPoint[2]), startPoint[2]];
      smooth[smooth.length - 1] = [endPoint[0], this._sampleY(endPoint[0], endPoint[2]), endPoint[2]];
    }
    return smooth;
  }

  // Optional: clamp point into mesh (closest point on triangles) - simple nearest vertex fallback
  closestPointOnMesh(point) {
    // naive: return nearest vertex
    let bestD = Infinity, best = null;
    for(const v of this.vertices) {
      const dx = v[0] - point[0], dy = v[1] - point[1], dz = v[2] - point[2];
      const d = dx * dx + dy * dy + dz * dz;
      if(d < bestD) {bestD = d; best = v;}
    }
    return best.slice();
  }
}

/* ----------------- tiny MinHeap for A* ----------------- */
export class MinHeap {
  constructor(cmp) {
    this.cmp = cmp || ((a, b) => a - b);
    this.items = [];
  }
  push(v) {
    this.items.push(v);
    this._siftUp(this.items.length - 1);
  }
  pop() {
    if(this.items.length === 0) return null;
    const top = this.items[0];
    const last = this.items.pop();
    if(this.items.length > 0) {
      this.items[0] = last;
      this._siftDown(0);
    }
    return top;
  }
  empty() {return this.items.length === 0;}
  _siftUp(i) {
    while(i > 0) {
      const p = Math.floor((i - 1) / 2);
      if(this.cmp(this.items[i], this.items[p]) < 0) {
        [this.items[i], this.items[p]] = [this.items[p], this.items[i]];
        i = p;
      } else break;
    }
  }
  _siftDown(i) {
    while(true) {
      const l = 2 * i + 1, r = 2 * i + 2;
      let m = i;
      if(l < this.items.length && this.cmp(this.items[l], this.items[m]) < 0) m = l;
      if(r < this.items.length && this.cmp(this.items[r], this.items[m]) < 0) m = r;
      if(m !== i) {
        [this.items[i], this.items[m]] = [this.items[m], this.items[i]];
        i = m;
      } else break;
    }
  }
}

// helper to walk a path (sequential)
export function followPath(position, path) {
  if(!path || path.length === 0) return;
  let idx = 0;
  position.onTargetPositionReach = () => {
    idx++;
    if(idx < path.length) {
      const p = path[idx];
      position.translateByXZ(p[0], p[2]);
    } else {
      position.onTargetPositionReach = () => {};
    }
  };
  // start
  position.translateByXZ(path[0][0], path[0][2]);
}