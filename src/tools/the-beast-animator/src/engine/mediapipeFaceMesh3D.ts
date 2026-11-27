import * as THREE from 'three';
import { FaceLandmarker } from '@mediapipe/tasks-vision';
import type { Landmark3D } from '../types/mocap';

const FACE_VERTEX_COUNT = 478;

interface FaceTopology {
  triangleIndices: Uint16Array;
  tessEdgeIndices: Uint16Array;
  contourEdgeIndices: Uint16Array;
  canonicalPositions: Float32Array;
  upperLidIndices: Set<number>;
  lowerLidIndices: Set<number>;
  lowerLipFullIndices: Set<number>;
  upperLipFullIndices: Set<number>;
}

const INNER_UPPER_CHAIN = [78, 191, 80, 81, 82, 13, 312, 311, 310, 415, 308] as const;
const INNER_LOWER_CHAIN = [78, 95, 88, 178, 87, 14, 317, 402, 318, 324, 308] as const;

let cachedTopology: FaceTopology | null = null;

function buildCanonicalFacePositions(
  adjacency: Set<number>[],
): Float32Array {
  const pos = new Float32Array(FACE_VERTEX_COUNT * 3);
  const pinned = new Uint8Array(FACE_VERTEX_COUNT);

  const setPin = (idx: number, x: number, y: number, z: number) => {
    pos[idx * 3] = x;
    pos[idx * 3 + 1] = y;
    pos[idx * 3 + 2] = z;
    pinned[idx] = 1;
  };

  // 1. Face oval (36 vertices clockwise from top forehead 10)
  const ovalIds = FaceLandmarker.FACE_LANDMARKS_FACE_OVAL.map((c) => c.start);
  const nOval = ovalIds.length;
  for (let i = 0; i < nOval; i++) {
    const t = (i / nOval) * Math.PI * 2;
    const sinT = Math.sin(t);
    const cosT = Math.cos(t);
    const rx = cosT < 0 ? 0.072 * (1 + 0.14 * cosT) : 0.074;
    const ry = cosT >= 0 ? 0.098 : 0.104;
    const x = sinT * rx;
    const y = cosT * ry;
    const z = 0.025 - Math.abs(sinT) * 0.048 - (cosT < 0 ? (-cosT) * 0.015 : 0);
    setPin(ovalIds[i], x, y, z);
  }

  // 2. Left eye (+X) & Right eye (-X) rings
  const pinEye = (
    conns: Array<{ start: number; end: number }>,
    sign: 1 | -1,
  ) => {
    const cx = sign * 0.0305;
    const cy = 0.019;
    const rx = 0.0145;
    const ry = 0.0055;
    // First 8 connections = lower lid (outer -> inner), next 8 = upper lid (outer -> inner)
    for (let i = 0; i < Math.min(8, conns.length); i++) {
      const f = i / 8;
      const x = cx + sign * rx * (1 - 2 * f);
      const y = cy - Math.sin(f * Math.PI) * ry;
      const z = 0.042 - Math.abs(x) * 0.18;
      setPin(conns[i].start, x, y, z);
    }
    const innerId = conns[7]?.end;
    if (innerId !== undefined) {
      setPin(innerId, cx - sign * rx, cy, 0.040);
    }
    for (let i = 8; i < conns.length; i++) {
      const f = (i - 8) / Math.max(1, conns.length - 8);
      const x = cx + sign * rx * (1 - 2 * f);
      const y = cy + Math.sin(f * Math.PI) * ry * 1.15;
      const z = 0.043 - Math.abs(x) * 0.18;
      setPin(conns[i].start, x, y, z);
    }
  };
  pinEye(FaceLandmarker.FACE_LANDMARKS_LEFT_EYE, 1);
  pinEye(FaceLandmarker.FACE_LANDMARKS_RIGHT_EYE, -1);

  // 3. Eyebrows
  const pinBrow = (
    conns: Array<{ start: number; end: number }>,
    sign: 1 | -1,
  ) => {
    const ids = [...conns.map((c) => c.start), conns[conns.length - 1]?.end].filter(
      (v): v is number => v !== undefined,
    );
    const unique = Array.from(new Set(ids));
    for (let i = 0; i < unique.length; i++) {
      const f = i / Math.max(1, unique.length - 1);
      const x = sign * (0.048 - f * 0.034);
      const y = 0.034 + Math.sin(f * Math.PI * 0.85) * 0.006;
      const z = 0.044 - Math.abs(x) * 0.15;
      setPin(unique[i], x, y, z);
    }
  };
  pinBrow(FaceLandmarker.FACE_LANDMARKS_LEFT_EYEBROW, 1);
  pinBrow(FaceLandmarker.FACE_LANDMARKS_RIGHT_EYEBROW, -1);

  // 4. Nose bridge, tip, and alar wings
  setPin(168, 0, 0.023, 0.046);
  setPin(6, 0, 0.014, 0.049);
  setPin(197, 0, 0.005, 0.053);
  setPin(195, 0, -0.004, 0.057);
  setPin(5, 0, -0.011, 0.061);
  setPin(4, 0, -0.018, 0.066);
  setPin(1, 0, -0.024, 0.064);
  setPin(2, 0, -0.030, 0.052);
  setPin(98, -0.013, -0.023, 0.048);
  setPin(327, 0.013, -0.023, 0.048);

  // 5. Lips (4 segments of 10 edges inside FACE_LANDMARKS_LIPS)
  const lips = FaceLandmarker.FACE_LANDMARKS_LIPS;
  const mouthY = -0.048;
  const pinLipSeg = (
    offset: number,
    len: number,
    width: number,
    yOffset: number,
    arch: number,
    zVal: number,
  ) => {
    for (let i = 0; i <= len; i++) {
      const id = i < len ? lips[offset + i]?.start : lips[offset + len - 1]?.end;
      if (id === undefined) continue;
      const f = i / len;
      const x = -width + 2 * width * f;
      const y = mouthY + yOffset + Math.sin(f * Math.PI) * arch;
      const z = zVal - Math.abs(x) * 0.25;
      setPin(id, x, y, z);
    }
  };
  pinLipSeg(0, 10, 0.025, -0.001, -0.008, 0.048); // Outer lower
  pinLipSeg(10, 10, 0.025, 0.001, 0.007, 0.049); // Outer upper
  pinLipSeg(20, 10, 0.019, -0.0005, -0.0025, 0.047); // Inner lower
  pinLipSeg(30, 10, 0.019, 0.0005, 0.0025, 0.047); // Inner upper

  // 6. Tutte / Laplacian relaxation for unpinned 468 mesh vertices
  const nextPos = new Float32Array(pos.length);
  for (let iter = 0; iter < 160; iter++) {
    nextPos.set(pos);
    for (let i = 0; i < 468; i++) {
      if (pinned[i]) continue;
      const neighbors = adjacency[i];
      if (!neighbors || neighbors.size === 0) continue;
      let sx = 0;
      let sy = 0;
      let sz = 0;
      neighbors.forEach((n) => {
        sx += pos[n * 3];
        sy += pos[n * 3 + 1];
        sz += pos[n * 3 + 2];
      });
      const inv = 1 / neighbors.size;
      nextPos[i * 3] = sx * inv;
      nextPos[i * 3 + 1] = sy * inv;
      // Add slight natural facial dome curvature during relaxation
      const x = nextPos[i * 3];
      const y = sy * inv;
      const dome = Math.max(0, 0.016 - (x * x * 1.4 + y * y * 0.65));
      nextPos[i * 3 + 2] = sz * inv + dome * 0.04;
    }
    pos.set(nextPos);
  }

  // 7. Pin irises (468..477) centered inside eye rings
  const pinIris = (centerIdx: number, ringStart: number, sign: 1 | -1) => {
    const cx = sign * 0.0305;
    const cy = 0.0195;
    const cz = 0.042;
    const r = 0.0046;
    pos[centerIdx * 3] = cx;
    pos[centerIdx * 3 + 1] = cy;
    pos[centerIdx * 3 + 2] = cz;
    const offsets: [number, number][] = [
      [r, 0],
      [0, r],
      [-r, 0],
      [0, -r],
    ];
    for (let k = 0; k < 4; k++) {
      const id = ringStart + k;
      pos[id * 3] = cx + offsets[k][0];
      pos[id * 3 + 1] = cy + offsets[k][1];
      pos[id * 3 + 2] = cz;
    }
  };
  pinIris(468, 469, -1); // Right iris
  pinIris(473, 474, 1); // Left iris

  return pos;
}

function getFaceTopology(): FaceTopology {
  if (cachedTopology) return cachedTopology;

  const adj: Set<number>[] = Array.from(
    { length: FACE_VERTEX_COUNT },
    () => new Set<number>(),
  );

  const tessEdges: number[] = [];
  for (const { start, end } of FaceLandmarker.FACE_LANDMARKS_TESSELATION) {
    if (start < 468 && end < 468) {
      adj[start].add(end);
      adj[end].add(start);
      tessEdges.push(start, end);
    }
  }

  const canonicalPositions = buildCanonicalFacePositions(adj);

  // Extract unique triangles with consistent outward (+Z) winding
  const triIndices: number[] = [];
  const ax = new THREE.Vector3();
  const bx = new THREE.Vector3();
  const cx = new THREE.Vector3();
  const ab = new THREE.Vector3();
  const ac = new THREE.Vector3();
  const normal = new THREE.Vector3();

  for (let a = 0; a < 468; a++) {
    adj[a].forEach((b) => {
      if (b <= a) return;
      adj[b].forEach((c) => {
        if (c <= b || !adj[a].has(c)) return;
        ax.set(
          canonicalPositions[a * 3],
          canonicalPositions[a * 3 + 1],
          canonicalPositions[a * 3 + 2],
        );
        bx.set(
          canonicalPositions[b * 3],
          canonicalPositions[b * 3 + 1],
          canonicalPositions[b * 3 + 2],
        );
        cx.set(
          canonicalPositions[c * 3],
          canonicalPositions[c * 3 + 1],
          canonicalPositions[c * 3 + 2],
        );
        ab.subVectors(bx, ax);
        ac.subVectors(cx, ax);
        normal.crossVectors(ab, ac);
        if (normal.z >= 0) {
          triIndices.push(a, b, c);
        } else {
          triIndices.push(a, c, b);
        }
      });
    });
  }

  const contourEdges: number[] = [];
  const contourSets = [
    FaceLandmarker.FACE_LANDMARKS_FACE_OVAL,
    FaceLandmarker.FACE_LANDMARKS_LIPS,
    FaceLandmarker.FACE_LANDMARKS_LEFT_EYE,
    FaceLandmarker.FACE_LANDMARKS_RIGHT_EYE,
    FaceLandmarker.FACE_LANDMARKS_LEFT_EYEBROW,
    FaceLandmarker.FACE_LANDMARKS_RIGHT_EYEBROW,
    FaceLandmarker.FACE_LANDMARKS_LEFT_IRIS,
    FaceLandmarker.FACE_LANDMARKS_RIGHT_IRIS,
  ];
  for (const list of contourSets) {
    for (const { start, end } of list) {
      if (start < FACE_VERTEX_COUNT && end < FACE_VERTEX_COUNT) {
        contourEdges.push(start, end);
      }
    }
  }

  const upperLidIndices = new Set<number>([
    384, 385, 386, 387, 388, 398, 466, 157, 158, 159, 160, 161, 173, 246,
  ]);
  const lowerLidIndices = new Set<number>([
    373, 374, 380, 381, 382, 390, 249, 144, 145, 153, 154, 155, 163, 7,
  ]);
  const lowerLipFullIndices = new Set<number>([
    14, 87, 317, 178, 402, 88, 318, 95, 324,
    15, 86, 316, 179, 403, 89, 319, 96, 325,
    16, 85, 315, 180, 404, 90, 320,
    17, 84, 314, 181, 405, 91, 321, 146, 375,
  ]);
  const upperLipFullIndices = new Set<number>([
    78, 308, 61, 291, 76, 77, 62, 306, 307, 292,
    13, 82, 312, 81, 311, 80, 310, 191, 415,
    12, 38, 268, 41, 271, 42, 272, 183, 407,
    11, 72, 302, 73, 303, 74, 304, 184, 408,
    0, 37, 267, 39, 269, 40, 270, 185, 409,
  ]);

  cachedTopology = {
    triangleIndices: new Uint16Array(triIndices),
    tessEdgeIndices: new Uint16Array(tessEdges),
    contourEdgeIndices: new Uint16Array(contourEdges),
    canonicalPositions,
    upperLidIndices,
    lowerLidIndices,
    lowerLipFullIndices,
    upperLipFullIndices,
  };
  return cachedTopology;
}

export class MediaPipeFaceMesh3D {
  readonly group: THREE.Group;
  private readonly topology: FaceTopology;
  private readonly posAttr: THREE.BufferAttribute;
  private readonly surfaceGeo: THREE.BufferGeometry;
  private readonly workingPositions: Float32Array;
  private readonly vTmp = new THREE.Vector3();
  private readonly eulerTmp = new THREE.Euler(0, 0, 0, 'YXZ');
  private smoothedOpenGate = 0;

  constructor() {
    this.topology = getFaceTopology();
    this.workingPositions = new Float32Array(this.topology.canonicalPositions);
    this.posAttr = new THREE.BufferAttribute(this.workingPositions, 3);
    this.posAttr.setUsage(THREE.DynamicDrawUsage);

    this.group = new THREE.Group();
    this.group.name = 'MediaPipe_Face_Mesh_3D';

    // 1. Solid Triangulated MediaPipe Face Mask Surface
    this.surfaceGeo = new THREE.BufferGeometry();
    this.surfaceGeo.setAttribute('position', this.posAttr);
    this.surfaceGeo.setIndex(new THREE.BufferAttribute(this.topology.triangleIndices, 1));
    this.surfaceGeo.computeVertexNormals();

    const surfaceMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.45,
      metalness: 0.18,
      side: THREE.DoubleSide,
      polygonOffset: true,
      polygonOffsetFactor: 1,
      polygonOffsetUnits: 1,
    });
    const surfaceMesh = new THREE.Mesh(this.surfaceGeo, surfaceMat);
    surfaceMesh.name = 'MediaPipe_Face_Surface';
    this.group.add(surfaceMesh);

    // 2. MediaPipe 468-pt Tessellation Wireframe
    const tessGeo = new THREE.BufferGeometry();
    tessGeo.setAttribute('position', this.posAttr);
    tessGeo.setIndex(new THREE.BufferAttribute(this.topology.tessEdgeIndices, 1));
    const tessMat = new THREE.LineBasicMaterial({
      color: 0x94a3b8,
      transparent: true,
      opacity: 0.35,
    });
    const tessLines = new THREE.LineSegments(tessGeo, tessMat);
    tessLines.renderOrder = 2;
    this.group.add(tessLines);

    // 3. Highlighted Anatomical Facial Contours (Eyes, Brows, Lips, Oval, Irises)
    const contourGeo = new THREE.BufferGeometry();
    contourGeo.setAttribute('position', this.posAttr);
    contourGeo.setIndex(
      new THREE.BufferAttribute(this.topology.contourEdgeIndices, 1),
    );
    const contourMat = new THREE.LineBasicMaterial({
      color: 0xf59e0b,
      transparent: true,
      opacity: 0.95,
    });
    const contourLines = new THREE.LineSegments(contourGeo, contourMat);
    contourLines.renderOrder = 3;
    this.group.add(contourLines);

    // 4. Landmark Vertices
    const ptsGeo = new THREE.BufferGeometry();
    ptsGeo.setAttribute('position', this.posAttr);
    const ptsMat = new THREE.PointsMaterial({
      color: 0xfbbf24,
      size: 0.0026,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.72,
    });
    const points = new THREE.Points(ptsGeo, ptsMat);
    points.renderOrder = 4;
    this.group.add(points);
  }

  updateFromLandmarks(
    landmarks: Landmark3D[],
    aspectRatio: number,
    mirrorX: boolean,
    rawJawOpenScore?: number,
  ): void {
    if (!landmarks || landmarks.length < 468) return;

    const count = Math.min(landmarks.length, FACE_VERTEX_COUNT);
    const sx = mirrorX ? -1 : 1;

    // Anchor center between temples (234 & 454) + nose bridge (6) + chin/forehead (10/152)
    const lTemple = landmarks[454];
    const rTemple = landmarks[234];
    const topHead = landmarks[10];
    const chin = landmarks[152];

    const cx = (lTemple.x + rTemple.x + topHead.x + chin.x) * 0.25;
    const cy = (lTemple.y + rTemple.y + topHead.y + chin.y) * 0.25;
    const cz = (lTemple.z + rTemple.z + topHead.z + chin.z) * 0.25;

    const dxSpan = (lTemple.x - rTemple.x) * aspectRatio;
    const dySpan = lTemple.y - rTemple.y;
    const dzSpan = (lTemple.z - rTemple.z) * aspectRatio;
    const templeSpan = Math.max(
      Math.hypot(dxSpan, dySpan, dzSpan),
      0.06,
    );
    const scale = 0.155 / templeSpan;

    for (let i = 0; i < count; i++) {
      const lm = landmarks[i];
      this.workingPositions[i * 3] = (lm.x - cx) * sx * aspectRatio * scale;
      this.workingPositions[i * 3 + 1] = -(lm.y - cy) * scale;
      this.workingPositions[i * 3 + 2] = -(lm.z - cz) * aspectRatio * scale;
    }

    // Face-local basis (works cleanly regardless of head tilt/rotation)
    let upX = this.workingPositions[10 * 3] - this.workingPositions[152 * 3];
    let upY = this.workingPositions[10 * 3 + 1] - this.workingPositions[152 * 3 + 1];
    let upZ = this.workingPositions[10 * 3 + 2] - this.workingPositions[152 * 3 + 2];
    const faceH = Math.max(Math.hypot(upX, upY, upZ), 0.10);
    upX /= faceH;
    upY /= faceH;
    upZ /= faceH;

    let mrX = this.workingPositions[308 * 3] - this.workingPositions[78 * 3];
    let mrY = this.workingPositions[308 * 3 + 1] - this.workingPositions[78 * 3 + 1];
    let mrZ = this.workingPositions[308 * 3 + 2] - this.workingPositions[78 * 3 + 2];
    const mouthW = Math.max(Math.hypot(mrX, mrY, mrZ), 0.02);
    mrX /= mouthW;
    mrY /= mouthW;
    mrZ /= mouthW;

    const mcX = (this.workingPositions[78 * 3] + this.workingPositions[308 * 3]) * 0.5;
    const mcY = (this.workingPositions[78 * 3 + 1] + this.workingPositions[308 * 3 + 1]) * 0.5;
    const mcZ = (this.workingPositions[78 * 3 + 2] + this.workingPositions[308 * 3 + 2]) * 0.5;

    // Project inner upper (13) and lower (14) lip centers along faceUp
    const up13 =
      (this.workingPositions[13 * 3] - mcX) * upX +
      (this.workingPositions[13 * 3 + 1] - mcY) * upY +
      (this.workingPositions[13 * 3 + 2] - mcZ) * upZ;
    const lo14 =
      (this.workingPositions[14 * 3] - mcX) * upX +
      (this.workingPositions[14 * 3 + 1] - mcY) * upY +
      (this.workingPositions[14 * 3 + 2] - mcZ) * upZ;
    const innerLipGap = Math.max(0, up13 - lo14);
    const normGap = innerLipGap / faceH;

    // Responsive mouth opening: suppress tiny rest jitter (< ~0.08 jawOpen / 0.022 normGap),
    // then ramp cleanly to 1.0 so real mouth opens follow landmarks effortlessly without fighting.
    let targetGate = 0;
    if (rawJawOpenScore !== undefined) {
      const scoreSignal = THREE.MathUtils.smoothstep(rawJawOpenScore, 0.08, 0.19);
      const geomSignal = THREE.MathUtils.smoothstep(normGap, 0.022, 0.044);
      targetGate = Math.max(scoreSignal, geomSignal * 0.85);
    } else {
      targetGate = THREE.MathUtils.smoothstep(normGap, 0.020, 0.038);
    }

    const blendSpeed = targetGate > this.smoothedOpenGate ? 0.55 : 0.35;
    this.smoothedOpenGate += (targetGate - this.smoothedOpenGate) * blendSpeed;

    const gatedGap = innerLipGap * this.smoothedOpenGate;
    // Allow natural speech & full mouth opening freely; softly limit only extreme yawn
    const softStart = faceH * 0.115;
    const hardCap = faceH * 0.175;
    const targetGap =
      gatedGap <= softStart
        ? gatedGap
        : softStart +
          (hardCap - softStart) *
            Math.tanh((gatedGap - softStart) / (faceH * 0.09));

    if (innerLipGap > 0.0002 && targetGap < innerLipGap - 0.0001) {
      const liftFrac = THREE.MathUtils.clamp(1 - targetGap / innerLipGap, 0, 1);
      const halfSpan = mouthW * 0.5 * 1.65;

      // Upper inner lip profile in mouth-local (uCoord, upCoord) coordinates
      const upperCurve = INNER_UPPER_CHAIN.map((idx) => {
        const dx = this.workingPositions[idx * 3] - mcX;
        const dy = this.workingPositions[idx * 3 + 1] - mcY;
        const dz = this.workingPositions[idx * 3 + 2] - mcZ;
        return {
          u: dx * mrX + dy * mrY + dz * mrZ,
          v: dx * upX + dy * upY + dz * upZ,
        };
      }).sort((a, b) => a.u - b.u);

      const getUpperLimit = (u: number): number => {
        if (u <= upperCurve[0].u) return upperCurve[0].v;
        const last = upperCurve[upperCurve.length - 1];
        if (u >= last.u) return last.v;
        for (let k = 0; k < upperCurve.length - 1; k++) {
          const p0 = upperCurve[k];
          const p1 = upperCurve[k + 1];
          if (u >= p0.u && u <= p1.u) {
            const span = Math.max(1e-6, p1.u - p0.u);
            return p0.v + (p1.v - p0.v) * ((u - p0.u) / span);
          }
        }
        return up13;
      };

      for (let i = 0; i < 468; i++) {
        if (this.topology.upperLipFullIndices.has(i)) continue;

        const dx = this.workingPositions[i * 3] - mcX;
        const dy = this.workingPositions[i * 3 + 1] - mcY;
        const dz = this.workingPositions[i * 3 + 2] - mcZ;

        const uCoord = dx * mrX + dy * mrY + dz * mrZ;
        const absNormU = Math.abs(uCoord) / halfSpan;
        if (absNormU >= 1) continue;

        const vCoord = dx * upX + dy * upY + dz * upZ;
        const maxUpV = getUpperLimit(uCoord);
        if (vCoord >= maxUpV) continue;

        // Smooth C1 cosine taper extending past mouth corners into cheeks (prevents corner pinching)
        const latW = 0.5 * (1 + Math.cos(Math.PI * absNormU));
        const depthBelowLip = Math.max(0, lo14 - vCoord);
        const vertW = Math.exp(-Math.pow(depthBelowLip / (faceH * 0.42), 2));
        const maxSafeShift = Math.max(0, maxUpV - 0.0003 - vCoord);
        const shift = Math.min(liftFrac * innerLipGap * latW * vertW, maxSafeShift);

        if (shift > 0) {
          this.workingPositions[i * 3] += upX * shift;
          this.workingPositions[i * 3 + 1] += upY * shift;
          this.workingPositions[i * 3 + 2] += upZ * shift;
        }
      }
    }

    this.group.rotation.set(0, 0, 0);
    this.posAttr.needsUpdate = true;
    this.surfaceGeo.computeVertexNormals();
  }

  updateSyntheticDemo(t: number): void {
    const base = this.topology.canonicalPositions;
    const blinkPhase = (t % 3.4) / 3.4;
    const blink =
      blinkPhase > 0.92 ? Math.sin(((blinkPhase - 0.92) / 0.08) * Math.PI) : 0;
    const wave = Math.sin(t * 2.1);
    const jawOpen =
      wave > 0.45 ? ((wave - 0.45) / 0.55) * 0.009 : 0;
    const smile = Math.max(0, Math.sin(t * 1.1)) * 0.004;

    this.eulerTmp.set(
      Math.sin(t * 1.1) * 0.10,
      Math.sin(t * 0.75) * 0.22,
      Math.cos(t * 0.65) * 0.06,
      'YXZ',
    );

    for (let i = 0; i < FACE_VERTEX_COUNT; i++) {
      let x = base[i * 3];
      let y = base[i * 3 + 1];
      let z = base[i * 3 + 2];

      if (this.topology.upperLidIndices.has(i)) {
        y -= blink * 0.0055;
      } else if (this.topology.lowerLidIndices.has(i)) {
        y += blink * 0.0025;
      }

      if (jawOpen > 0 && i < 468) {
        if (this.topology.lowerLipFullIndices.has(i)) {
          const lat = Math.cos(
            Math.min(1, Math.abs(x) / 0.026) * Math.PI * 0.5,
          );
          y -= jawOpen * lat;
          z -= jawOpen * lat * 0.16;
        } else if (
          !this.topology.upperLipFullIndices.has(i) &&
          y < -0.048 &&
          Math.abs(x) < 0.065
        ) {
          const lat = Math.pow(
            Math.max(0, 1 - Math.abs(x) / 0.065),
            1.4,
          );
          const vert = Math.exp(-Math.pow(Math.max(0, -0.052 - y) / 0.065, 2));
          y -= jawOpen * lat * vert * 0.85;
          z -= jawOpen * lat * vert * 0.14;
        } else if (
          this.topology.upperLipFullIndices.has(i) &&
          i !== 78 &&
          i !== 308 &&
          i !== 61 &&
          i !== 291
        ) {
          const lat = Math.cos(
            Math.min(1, Math.abs(x) / 0.026) * Math.PI * 0.5,
          );
          y += jawOpen * lat * 0.12;
        }
      }

      if (i === 61 || i === 291 || i === 78 || i === 308) {
        y += smile;
        x += Math.sign(x) * smile * 0.4;
      }

      this.vTmp.set(x, y, z).applyEuler(this.eulerTmp);
      this.workingPositions[i * 3] = this.vTmp.x;
      this.workingPositions[i * 3 + 1] = this.vTmp.y;
      this.workingPositions[i * 3 + 2] = this.vTmp.z;
    }

    this.group.rotation.set(0, 0, 0);
    this.posAttr.needsUpdate = true;
    this.surfaceGeo.computeVertexNormals();
  }

  capturePositions(): Float32Array {
    return new Float32Array(this.workingPositions);
  }

  applyPositions(positions: Float32Array): void {
    const len = Math.min(positions.length, this.workingPositions.length);
    for (let i = 0; i < len; i++) {
      this.workingPositions[i] = positions[i];
    }
    this.group.rotation.set(0, 0, 0);
    this.posAttr.needsUpdate = true;
    this.surfaceGeo.computeVertexNormals();
  }

  interpolateAndApplyPositions(
    a: Float32Array,
    b: Float32Array,
    alpha: number,
  ): void {
    const t = THREE.MathUtils.clamp(alpha, 0, 1);
    const inv = 1 - t;
    const len = Math.min(a.length, b.length, this.workingPositions.length);
    for (let i = 0; i < len; i++) {
      this.workingPositions[i] = a[i] * inv + b[i] * t;
    }
    this.group.rotation.set(0, 0, 0);
    this.posAttr.needsUpdate = true;
    this.surfaceGeo.computeVertexNormals();
  }

  dispose(): void {
    this.group.traverse((obj) => {
      if ((obj as THREE.Mesh).geometry) {
        (obj as THREE.Mesh).geometry.dispose();
      }
      const mat = (obj as THREE.Mesh).material;
      if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
      else if (mat) mat.dispose();
    });
  }
}

export const FACE_EXPORT_BONES = [
  'Head',
  'Jaw',
  'UpperLip',
  'MouthCornerL',
  'MouthCornerR',
  'UpperLidL',
  'UpperLidR',
  'LowerLidL',
  'LowerLidR',
  'BrowL',
  'BrowR',
] as const;

export type FaceExportBoneName = (typeof FACE_EXPORT_BONES)[number];

export interface FaceExportRig {
  rootObject: THREE.Group;
  bones: Record<FaceExportBoneName, THREE.Bone>;
  restPositions: Record<FaceExportBoneName, THREE.Vector3>;
  restFaceVertices: Float32Array;
  skinnedMesh: THREE.SkinnedMesh;
  dispose: () => void;
}

const EYE_RING_RIGHT = [33, 246, 161, 160, 159, 158, 157, 173, 133, 155, 154, 153, 145, 144, 163, 7] as const;
const EYE_RING_LEFT = [362, 398, 384, 385, 386, 387, 388, 466, 263, 249, 390, 373, 374, 380, 381, 382] as const;
const NOSE_RIDGE_IDS = new Set<number>([168, 6, 197, 195, 5, 4, 1, 2, 98, 327]);

function measureUprightFaceBasis(
  pos: Float32Array,
): { center: THREE.Vector3; quat: THREE.Quaternion; faceH: number } {
  const getV = (idx: number) =>
    new THREE.Vector3(pos[idx * 3], pos[idx * 3 + 1], pos[idx * 3 + 2]);
  const p454 = getV(454);
  const p234 = getV(234);
  const p10 = getV(10);
  const p152 = getV(152);

  const center = new THREE.Vector3()
    .add(p454)
    .add(p234)
    .add(p10)
    .add(p152)
    .multiplyScalar(0.25);

  const right = p454.clone().sub(p234);
  if (right.lengthSq() < 1e-8) right.set(1, 0, 0);
  else right.normalize();

  const upVec = p10.clone().sub(p152);
  const faceH = Math.max(0.08, upVec.length());
  if (upVec.lengthSq() < 1e-8) upVec.set(0, 1, 0);
  else upVec.normalize();

  const forward = new THREE.Vector3().crossVectors(right, upVec);
  if (forward.lengthSq() < 1e-8) forward.set(0, 0, 1);
  else forward.normalize();
  if (forward.z < 0) forward.negate();

  const orthoUp = new THREE.Vector3().crossVectors(forward, right).normalize();
  const basis = new THREE.Matrix4().makeBasis(right, orthoUp, forward);
  const quat = new THREE.Quaternion().setFromRotationMatrix(basis).normalize();
  return { center, quat, faceH };
}

function createFaceAtlasTexture(): THREE.DataTexture {
  const size = 256;
  const data = new Uint8Array(size * size * 4);

  const lerpC = (a: number, b: number, t: number) =>
    Math.round(a + (b - a) * THREE.MathUtils.clamp(t, 0, 1));

  const setPixel = (
    px: number,
    py: number,
    r: number,
    g: number,
    b: number,
  ) => {
    const idx = (py * size + px) * 4;
    data[idx] = r;
    data[idx + 1] = g;
    data[idx + 2] = b;
    data[idx + 3] = 255;
  };

  // Triangle corners inside each 128x128 quadrant span normalized [0.06..0.92]
  const minT = 0.06;
  const maxT = 0.92;
  const spanT = maxT - minT;

  const paintWireQuad = (
    qx: number,
    qy: number,
    baseRgb: [number, number, number],
    edgeRgb: [number, number, number],
    dotRgb: [number, number, number],
    edgeAlpha: number,
  ) => {
    const half = size / 2;
    for (let y = 0; y < half; y++) {
      for (let x = 0; x < half; x++) {
        const u = (x / (half - 1) - minT) / spanT;
        const v = (y / (half - 1) - minT) / spanT;
        const w = 1 - u - v;

        const dEdge = Math.min(Math.abs(u), Math.abs(v), Math.abs(w) * 0.7071);
        const inside = u >= -0.04 && v >= -0.04 && w >= -0.04;
        const lineMask = inside
          ? 1 - THREE.MathUtils.smoothstep(dEdge, 0.018, 0.055)
          : 0.75;

        const dCorner = Math.min(
          Math.hypot(u, v),
          Math.hypot(u - 1, v),
          Math.hypot(u, v - 1),
        );
        const dotMask = 1 - THREE.MathUtils.smoothstep(dCorner, 0.04, 0.085);

        let r = lerpC(baseRgb[0], edgeRgb[0], lineMask * edgeAlpha);
        let g = lerpC(baseRgb[1], edgeRgb[1], lineMask * edgeAlpha);
        let b = lerpC(baseRgb[2], edgeRgb[2], lineMask * edgeAlpha);

        r = lerpC(r, dotRgb[0], dotMask * 0.9);
        g = lerpC(g, dotRgb[1], dotMask * 0.9);
        b = lerpC(b, dotRgb[2], dotMask * 0.9);

        setPixel(qx * half + x, qy * half + y, r, g, b);
      }
    }
  };

  // Q(0,0): Slate Face Mask + Crisp MediaPipe Tessellation Wireframe
  paintWireQuad(0, 0, [44, 56, 74], [148, 163, 184], [251, 191, 36], 0.78);
  // Q(1,0): Highlighted Amber Facial Contours (Eyes, Brows, Nose Ridge, Oval)
  paintWireQuad(1, 0, [38, 48, 64], [245, 158, 11], [252, 211, 77], 0.95);
  // Q(0,1): Sculpted Lips + Amber/Slate Lip Border
  paintWireQuad(0, 1, [74, 89, 112], [245, 158, 11], [252, 211, 77], 0.85);

  // Q(1,1): Eye Socket Sclera + Amber Iris + Dark Pupil (radius = u + v from local origin)
  const half = size / 2;
  for (let y = 0; y < half; y++) {
    for (let x = 0; x < half; x++) {
      const u = Math.max(0, (x / (half - 1) - minT) / spanT);
      const v = Math.max(0, (y / (half - 1) - minT) / spanT);
      const rad = THREE.MathUtils.clamp(u + v, 0, 1.2);
      let r = 24;
      let g = 32;
      let b = 46;
      if (rad < 0.24) {
        r = 10;
        g = 14;
        b = 22;
      } else if (rad < 0.44) {
        const ringT = 1 - Math.abs(rad - 0.34) / 0.12;
        r = lerpC(180, 245, ringT);
        g = lerpC(105, 165, ringT);
        b = lerpC(14, 24, ringT);
      } else {
        const outerT = THREE.MathUtils.smoothstep(rad, 0.44, 0.92);
        r = lerpC(30, 42, outerT);
        g = lerpC(41, 54, outerT);
        b = lerpC(59, 72, outerT);
      }
      setPixel(half + x, half + y, r, g, b);
    }
  }

  const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  tex.name = 'Beast_Face_Mesh_Atlas';
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearFilter;
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.generateMipmaps = false;
  tex.flipY = false;
  tex.needsUpdate = true;
  return tex;
}

export function buildRiggedFaceExportModel(
  referencePositions?: Float32Array,
): FaceExportRig {
  const topology = getFaceTopology();
  const rootGroup = new THREE.Group();
  rootGroup.name = 'Beast_Face_Rig_Root';

  const yOffset = 0.12;

  // Extract upright rest face vertices from real captured facePositions when available
  const restFaceVertices = new Float32Array(topology.canonicalPositions);
  if (referencePositions && referencePositions.length >= 468 * 3) {
    const basis = measureUprightFaceBasis(referencePositions);
    const invQuat = basis.quat.clone().invert();
    // Normalize scale to canonical face height (~0.195m) so rig stays clean human scale
    const normScale = 0.195 / Math.max(0.08, basis.faceH);
    const tmp = new THREE.Vector3();
    for (let i = 0; i < 468; i++) {
      tmp
        .set(
          referencePositions[i * 3] - basis.center.x,
          referencePositions[i * 3 + 1] - basis.center.y,
          referencePositions[i * 3 + 2] - basis.center.z,
        )
        .applyQuaternion(invQuat)
        .multiplyScalar(normScale);
      restFaceVertices[i * 3] = tmp.x;
      restFaceVertices[i * 3 + 1] = tmp.y;
      restFaceVertices[i * 3 + 2] = tmp.z;
    }

    // Place irises cleanly at eye centers (slightly recessed behind eyelids)
    const placeEyeIris = (
      irisCenterIdx: number,
      ring: readonly number[],
    ) => {
      let cx = 0;
      let cy = 0;
      let cz = 0;
      for (const id of ring) {
        cx += restFaceVertices[id * 3];
        cy += restFaceVertices[id * 3 + 1];
        cz += restFaceVertices[id * 3 + 2];
      }
      const inv = 1 / ring.length;
      restFaceVertices[irisCenterIdx * 3] = cx * inv;
      restFaceVertices[irisCenterIdx * 3 + 1] = cy * inv;
      restFaceVertices[irisCenterIdx * 3 + 2] = cz * inv - 0.0025;
    };
    placeEyeIris(468, EYE_RING_RIGHT);
    placeEyeIris(473, EYE_RING_LEFT);
  }

  const getRV = (idx: number) =>
    new THREE.Vector3(
      restFaceVertices[idx * 3],
      restFaceVertices[idx * 3 + 1],
      restFaceVertices[idx * 3 + 2],
    );

  // Derive anatomical bone pivot positions directly from the active face geometry
  const pEyeL = getRV(386).add(getRV(374)).multiplyScalar(0.5);
  const pEyeR = getRV(159).add(getRV(145)).multiplyScalar(0.5);
  const pBrowL = getRV(334);
  const pBrowR = getRV(105);
  const pUpperLip = getRV(13);
  const pMouth291 = getRV(291);
  const pMouth61 = getRV(61);
  const pCornerL = pMouth291.x >= pMouth61.x ? pMouth291 : pMouth61;
  const pCornerR = pMouth291.x >= pMouth61.x ? pMouth61 : pMouth291;

  const bones = {} as Record<FaceExportBoneName, THREE.Bone>;
  const boneArray: THREE.Bone[] = [];
  const restPositions = {} as Record<FaceExportBoneName, THREE.Vector3>;

  const offsets: Record<FaceExportBoneName, [number, number, number]> = {
    Head: [0, yOffset, 0],
    Jaw: [0, -0.018, 0.014],
    UpperLip: [pUpperLip.x, pUpperLip.y, pUpperLip.z],
    MouthCornerL: [pCornerL.x, pCornerL.y, pCornerL.z],
    MouthCornerR: [pCornerR.x, pCornerR.y, pCornerR.z],
    UpperLidL: [pEyeL.x, pEyeL.y + 0.0035, pEyeL.z],
    UpperLidR: [pEyeR.x, pEyeR.y + 0.0035, pEyeR.z],
    LowerLidL: [pEyeL.x, pEyeL.y - 0.0035, pEyeL.z],
    LowerLidR: [pEyeR.x, pEyeR.y - 0.0035, pEyeR.z],
    BrowL: [pBrowL.x, pBrowL.y, pBrowL.z],
    BrowR: [pBrowR.x, pBrowR.y, pBrowR.z],
  };

  FACE_EXPORT_BONES.forEach((name) => {
    const b = new THREE.Bone();
    b.name = name;
    const o = offsets[name];
    b.position.set(o[0], o[1], o[2]);
    bones[name] = b;
    restPositions[name] = b.position.clone();
    boneArray.push(b);
    if (name === 'Head') {
      rootGroup.add(b);
    } else {
      bones.Head.add(b);
    }
  });

  rootGroup.updateMatrixWorld(true);

  const BONE_IDX: Record<FaceExportBoneName, number> = {
    Head: 0,
    Jaw: 1,
    UpperLip: 2,
    MouthCornerL: 3,
    MouthCornerR: 4,
    UpperLidL: 5,
    UpperLidR: 6,
    LowerLidL: 7,
    LowerLidR: 8,
    BrowL: 9,
    BrowR: 10,
  };

  // Compute smooth normals on the shared 478-vertex surface first
  const sharedGeo = new THREE.BufferGeometry();
  const sharedPos = new Float32Array(FACE_VERTEX_COUNT * 3);
  for (let i = 0; i < FACE_VERTEX_COUNT; i++) {
    sharedPos[i * 3] = restFaceVertices[i * 3];
    sharedPos[i * 3 + 1] = restFaceVertices[i * 3 + 1] + yOffset;
    sharedPos[i * 3 + 2] = restFaceVertices[i * 3 + 2];
  }
  sharedGeo.setAttribute('position', new THREE.BufferAttribute(sharedPos, 3));
  sharedGeo.setIndex(new THREE.BufferAttribute(topology.triangleIndices, 1));
  sharedGeo.computeVertexNormals();
  sharedGeo.normalizeNormals();
  const sharedNormAttr = sharedGeo.attributes.normal as THREE.BufferAttribute;

  // Build contour landmark classification sets
  const browIndices = new Set<number>();
  for (const c of FaceLandmarker.FACE_LANDMARKS_LEFT_EYEBROW) {
    browIndices.add(c.start);
    browIndices.add(c.end);
  }
  for (const c of FaceLandmarker.FACE_LANDMARKS_RIGHT_EYEBROW) {
    browIndices.add(c.start);
    browIndices.add(c.end);
  }
  const contourHighlightIndices = new Set<number>([
    ...topology.upperLidIndices,
    ...topology.lowerLidIndices,
    ...browIndices,
    ...NOSE_RIDGE_IDS,
  ]);
  for (const c of FaceLandmarker.FACE_LANDMARKS_FACE_OVAL) {
    contourHighlightIndices.add(c.start);
    contourHighlightIndices.add(c.end);
  }

  // Compute per-landmark skin weights (Uint16 indices, normalized Float32 weights)
  const mouthY = (pCornerL.y + pCornerR.y + pUpperLip.y) / 3;
  const mouthHalfW = Math.max(0.02, Math.abs(pCornerL.x - pCornerR.x) * 0.5);
  const chinY = getRV(152).y;
  const jawHeight = Math.max(0.03, mouthY - chinY);

  const lmJoints = new Uint16Array(FACE_VERTEX_COUNT * 4);
  const lmWeights = new Float32Array(FACE_VERTEX_COUNT * 4);

  const cornerLSet = new Set<number>([291, 308, 415, 324, 409, 375]);
  const cornerRSet = new Set<number>([61, 78, 191, 95, 185, 146]);

  for (let i = 0; i < FACE_VERTEX_COUNT; i++) {
    const x = restFaceVertices[i * 3];
    const y = restFaceVertices[i * 3 + 1];

    let secondary: FaceExportBoneName | null = null;
    let w = 0;

    if (topology.upperLidIndices.has(i)) {
      secondary = x >= 0 ? 'UpperLidL' : 'UpperLidR';
      w = 1.0;
    } else if (topology.lowerLidIndices.has(i)) {
      secondary = x >= 0 ? 'LowerLidL' : 'LowerLidR';
      w = 1.0;
    } else if (cornerLSet.has(i)) {
      secondary = x >= 0 ? 'MouthCornerL' : 'MouthCornerR';
      w = 0.85;
    } else if (cornerRSet.has(i)) {
      secondary = x >= 0 ? 'MouthCornerL' : 'MouthCornerR';
      w = 0.85;
    } else if (topology.lowerLipFullIndices.has(i)) {
      secondary = 'Jaw';
      w = Math.max(
        0.35,
        Math.cos(Math.min(1, Math.abs(x) / (mouthHalfW * 1.25)) * Math.PI * 0.45),
      );
    } else if (topology.upperLipFullIndices.has(i)) {
      secondary = 'UpperLip';
      w = Math.max(
        0.28,
        0.82 * Math.cos(Math.min(1, Math.abs(x) / (mouthHalfW * 1.15)) * Math.PI * 0.48),
      );
    } else if (browIndices.has(i)) {
      secondary = x >= 0 ? 'BrowL' : 'BrowR';
      w = 0.92;
    } else if (y < mouthY + 0.004 && Math.abs(x) < mouthHalfW * 2.55) {
      // Lower face / chin / cheek skin follows Jaw smoothly
      secondary = 'Jaw';
      const lat = 0.5 * (1 + Math.cos(Math.PI * Math.min(1, Math.abs(x) / (mouthHalfW * 2.55))));
      const depth = THREE.MathUtils.clamp((mouthY + 0.004 - y) / jawHeight, 0, 1);
      w = 0.90 * lat * Math.pow(depth, 0.55);
    } else if (y > mouthY - 0.01 && y < pEyeL.y - 0.01 && Math.abs(x) > mouthHalfW * 0.85 && Math.abs(x) < mouthHalfW * 2.4) {
      // Mid-cheek lift toward mouth corners on smile
      secondary = x >= 0 ? 'MouthCornerL' : 'MouthCornerR';
      w = 0.35;
    }

    if (secondary && w > 0.01) {
      const cw = THREE.MathUtils.clamp(w, 0, 1);
      lmJoints[i * 4] = BONE_IDX[secondary];
      lmJoints[i * 4 + 1] = 0; // Head
      lmWeights[i * 4] = cw;
      lmWeights[i * 4 + 1] = 1 - cw;
    } else {
      lmJoints[i * 4] = 0;
      lmWeights[i * 4] = 1.0;
    }
  }

  // Gather triangles: face tessellation + sclera/iris fans for left and right eyes
  const faceTriIds = topology.triangleIndices;
  const eyeFanTris: Array<[number, number, number]> = [];
  const addEyeFan = (centerIdx: number, ring: readonly number[]) => {
    for (let k = 0; k < ring.length; k++) {
      const a = ring[k];
      const b = ring[(k + 1) % ring.length];
      // Verify outward +Z winding
      const v0 = getRV(centerIdx);
      const va = getRV(a).sub(v0);
      const vb = getRV(b).sub(v0);
      if (va.cross(vb).z >= 0) {
        eyeFanTris.push([centerIdx, a, b]);
      } else {
        eyeFanTris.push([centerIdx, b, a]);
      }
    }
  };
  addEyeFan(468, EYE_RING_RIGHT);
  addEyeFan(473, EYE_RING_LEFT);

  const faceTriCount = faceTriIds.length / 3;
  const totalTriCount = faceTriCount + eyeFanTris.length;
  const vertCount = totalTriCount * 3;

  const outPositions = new Float32Array(vertCount * 3);
  const outNormals = new Float32Array(vertCount * 3);
  const outUvs = new Float32Array(vertCount * 2);
  // Uint16Array ensures GLTFExporter emits UNSIGNED_SHORT (5123) matching matrix-engine-wgpu
  const outJoints = new Uint16Array(vertCount * 4);
  const outWeights = new Float32Array(vertCount * 4);
  const outIndices = new Uint16Array(vertCount);

  const minT = 0.06;
  const maxT = 0.92;
  const writeQuadUV = (
    dstIdx: number,
    qx: number,
    qy: number,
    localU: number,
    localV: number,
  ) => {
    outUvs[dstIdx * 2] = qx * 0.5 + (minT + (maxT - minT) * localU) * 0.5;
    outUvs[dstIdx * 2 + 1] = qy * 0.5 + (minT + (maxT - minT) * localV) * 0.5;
  };

  const copyVertex = (
    dstIdx: number,
    srcLm: number,
    overrideNormal?: [number, number, number],
  ) => {
    outPositions[dstIdx * 3] = restFaceVertices[srcLm * 3];
    outPositions[dstIdx * 3 + 1] = restFaceVertices[srcLm * 3 + 1] + yOffset;
    outPositions[dstIdx * 3 + 2] = restFaceVertices[srcLm * 3 + 2];

    if (overrideNormal) {
      outNormals[dstIdx * 3] = overrideNormal[0];
      outNormals[dstIdx * 3 + 1] = overrideNormal[1];
      outNormals[dstIdx * 3 + 2] = overrideNormal[2];
    } else {
      const nx = sharedNormAttr.getX(srcLm);
      const ny = sharedNormAttr.getY(srcLm);
      const nz = sharedNormAttr.getZ(srcLm);
      const len = Math.hypot(nx, ny, nz);
      if (!Number.isFinite(len) || len < 1e-6) {
        outNormals[dstIdx * 3] = 0;
        outNormals[dstIdx * 3 + 1] = 0;
        outNormals[dstIdx * 3 + 2] = 1;
      } else {
        outNormals[dstIdx * 3] = nx / len;
        outNormals[dstIdx * 3 + 1] = ny / len;
        outNormals[dstIdx * 3 + 2] = nz / len;
      }
    }

    for (let k = 0; k < 4; k++) {
      outJoints[dstIdx * 4 + k] = lmJoints[srcLm * 4 + k];
      outWeights[dstIdx * 4 + k] = lmWeights[srcLm * 4 + k];
    }
    outIndices[dstIdx] = dstIdx;
  };

  // Emit face surface triangles with tessellation/contour/lip quadrant UVs
  for (let t = 0; t < faceTriCount; t++) {
    const a = faceTriIds[t * 3];
    const b = faceTriIds[t * 3 + 1];
    const c = faceTriIds[t * 3 + 2];

    const lipCount =
      Number(topology.lowerLipFullIndices.has(a) || topology.upperLipFullIndices.has(a)) +
      Number(topology.lowerLipFullIndices.has(b) || topology.upperLipFullIndices.has(b)) +
      Number(topology.lowerLipFullIndices.has(c) || topology.upperLipFullIndices.has(c));
    const contourCount =
      Number(contourHighlightIndices.has(a)) +
      Number(contourHighlightIndices.has(b)) +
      Number(contourHighlightIndices.has(c));

    let qx = 0;
    let qy = 0;
    if (lipCount >= 2) {
      qx = 0;
      qy = 1;
    } else if (contourCount >= 2) {
      qx = 1;
      qy = 0;
    }

    const baseV = t * 3;
    copyVertex(baseV, a);
    copyVertex(baseV + 1, b);
    copyVertex(baseV + 2, c);
    writeQuadUV(baseV, qx, qy, 0, 0);
    writeQuadUV(baseV + 1, qx, qy, 1, 0);
    writeQuadUV(baseV + 2, qx, qy, 0, 1);
  }

  // Emit eye sclera/iris triangles in quadrant (1, 1)
  for (let e = 0; e < eyeFanTris.length; e++) {
    const [centerIdx, ringA, ringB] = eyeFanTris[e];
    const baseV = (faceTriCount + e) * 3;
    copyVertex(baseV, centerIdx, [0, 0, 1]);
    copyVertex(baseV + 1, ringA, [0, 0, 1]);
    copyVertex(baseV + 2, ringB, [0, 0, 1]);
    writeQuadUV(baseV, 1, 1, 0, 0);
    writeQuadUV(baseV + 1, 1, 1, 1, 0);
    writeQuadUV(baseV + 2, 1, 1, 0, 1);
  }

  sharedGeo.dispose();

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(outPositions, 3));
  geo.setAttribute('normal', new THREE.BufferAttribute(outNormals, 3));
  geo.setAttribute('uv', new THREE.BufferAttribute(outUvs, 2));
  geo.setAttribute('skinIndex', new THREE.BufferAttribute(outJoints, 4));
  geo.setAttribute('skinWeight', new THREE.BufferAttribute(outWeights, 4));
  geo.setIndex(new THREE.BufferAttribute(outIndices, 1));

  const atlasTex = createFaceAtlasTexture();
  const mat = new THREE.MeshStandardMaterial({
    map: atlasTex,
    roughness: 0.45,
    metalness: 0.14,
    side: THREE.DoubleSide,
  });

  const skinnedMesh = new THREE.SkinnedMesh(geo, mat);
  skinnedMesh.name = 'Beast_MediaPipe_Face';
  const skeleton = new THREE.Skeleton(boneArray);
  skinnedMesh.bind(skeleton);
  rootGroup.add(skinnedMesh);
  rootGroup.updateMatrixWorld(true);

  return {
    rootObject: rootGroup,
    bones,
    restPositions,
    restFaceVertices,
    skinnedMesh,
    dispose: () => {
      geo.dispose();
      atlasTex.dispose();
      mat.dispose();
    },
  };
}
