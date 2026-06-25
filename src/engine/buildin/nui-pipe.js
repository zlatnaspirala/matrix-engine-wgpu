/**
  *  Copyright 2023 The MediaPipe Authors.
  * Licensed under the Apache License, Version 2.0 (the "License");
  * you may not use this file except in compliance with the License.
  * You may obtain a copy of the License at
  *      http://www.apache.org/licenses/LICENSE-2.0
  * Unless required by applicable law or agreed to in writing, software
  * distributed under the License is distributed on an "AS IS" BASIS,
  * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  * See the License for the specific language governing permissions and
  * limitations under the License.
 **/

/**
 * @description
 * @name PipeCommander
 * You can do whatever you want just leave header licence.
 * For The beast by default used most optimised variant of hand model also 
 * default number of hand is 1.
 * Still this feature is marked like "high price" for CPU usage.
 */
export class PipeCommander {
  constructor(autostart = true, videoElementId, canvasElementId) {
    this.autostart = autostart;
    this.handLandmarker = undefined;
    this.runningMode = "IMAGE";
    this.webcamRunning = false;
    this.lastVideoTime = -1;
    this.results = undefined;
    if(videoElementId) {this.video = document.getElementById(videoElementId);}
    if(!this.video) {
      this.video = document.createElement("video");
      this.video.id = "auto-video";
      Object.assign(this.video.style, {
        position: "absolute",
        bottom: "3vh",
        left: "50%",
        transform: "translateX(-50%)",
        width: "480px",
        zIndex: "-1",
        pointerEvents: "none",
      });
      this.video.autoplay = true;
      this.video.playsInline = true;
      this.video.muted = true;
      // this.video.style.transform = "scaleX(-1)";
      document.body.appendChild(this.video);
    }

    if(canvasElementId) {this.canvasElement = document.getElementById(canvasElementId);}
    if(!this.canvasElement) {
      this.canvasElement = document.createElement("canvas");
      this.canvasElement.id = "auto-canvas";
      Object.assign(this.canvasElement.style, {
        position: "absolute",
        bottom: "2.5%",
        left: "2.5%",
        width: "95%",
        height: "95%",
        zIndex: "10000",
        pointerEvents: "none",
      });
      document.body.appendChild(this.canvasElement);
    }
    this.canvasCtx = this.canvasElement.getContext("2d");
    this.drawingUtils = null;
    this.ready = this.init();
  }

  async init() {
    const visionModule = await import("@mediapipe/tasks-vision");
    const {HandLandmarker, FilesetResolver, DrawingUtils} = visionModule;
    this.HandLandmarker = HandLandmarker;
    const vision = await FilesetResolver.forVisionTasks("./mediapipe/wasm");
    this.handLandmarker = await HandLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath:
          // "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task",
          "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
        delegate: "GPU"
      },
      runningMode: this.runningMode,
      numHands: 1
    });
    this.drawingUtils = new DrawingUtils(this.canvasCtx);
    if(this.autostart === true) this.enableWebcam();
  }

  async enableWebcam() {
    await this.ready;
    const stream = await navigator.mediaDevices.getUserMedia({video: true});
    this.video.srcObject = stream;
    await this.video.play();
    const w = this.video.videoWidth;
    const h = this.video.videoHeight;
    this.canvasElement.width = w;
    this.canvasElement.height = h;
    this.video.width = w;
    this.video.height = h;
    this.video.style.aspectRatio = `${w}/${h}`;
    this.canvasElement.style.aspectRatio = `${w}/${h}`;
    this.webcamRunning = true;
    this.predictWebcam();
  }

  async predictWebcam() {
    if(this.runningMode === "IMAGE") {
      this.runningMode = "VIDEO";
      await this.handLandmarker.setOptions({runningMode: "VIDEO"});
    }
    const startTimeMs = performance.now();
    if(this.lastVideoTime !== this.video.currentTime) {
      this.lastVideoTime = this.video.currentTime;
      this.results = this.handLandmarker.detectForVideo(this.video, startTimeMs);
      this.onResults(this.results);
    }
    this.canvasCtx.save();
    this.canvasCtx.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);
    if(this.results?.landmarks) {
      for(const landmarks of this.results.landmarks) {
        this.drawingUtils.drawConnectors(landmarks, this.HandLandmarker.HAND_CONNECTIONS, {
          color: "#00202e",
          lineWidth: 5
        });
        this.drawingUtils.drawLandmarks(landmarks, {color: "#3d002f", lineWidth: 2});
      }
    }
    this.canvasCtx.restore();
    if(this.webcamRunning) {window.requestAnimationFrame(() => this.predictWebcam())}
  }

  // Override
  onResults(results) {
    if(!results?.landmarks) return;
    for(let i = 0;i < results.landmarks.length;i++) {
      const hand = results.landmarks[i];
      const handedness = results.handednesses[i]?.[0]?.categoryName ?? "Unknown";
      // hand[0] = WRIST
      // hand[4] = THUMB_TIP, hand[8] = INDEX_TIP
      // hand[12] = MIDDLE_TIP, hand[16] = RING_TIP, hand[20] = PINKY_TIP
      console.log(`Hand ${i} (${handedness}) wrist:`, hand[0]);
    }
  }

  disableWebcam() {
    this.webcamRunning = false;
    if(this.video.srcObject) {
      this.video.srcObject.getTracks().forEach(t => t.stop());
      this.video.srcObject = null;
    }
  }
}

/**
 * NUIGestureResolver
 * Consumes raw MediaPipe HandLandmarker results and outputs named gestures + world data.
 * Feed results from PipeCommander.onResults() into resolve().
 */
export class PipeGestureResolver {
  constructor() {
    this.prevPalmCenter = [null, null];
    this.prevTime = performance.now();
  }

  _handLocalFrame(lm) {
    // palm X axis: wrist → index MCP
    const w = lm[0];
    const im = lm[5];
    const pm = lm[17];
    const mm = lm[9]; // middle MCP for up axis

    // right axis (across knuckles)
    let rx = im.x - pm.x, ry = im.y - pm.y, rz = im.z - pm.z;
    let rlen = Math.sqrt(rx * rx + ry * ry + rz * rz) || 1;
    rx /= rlen; ry /= rlen; rz /= rlen;

    // up axis (wrist → middle MCP)
    let ux = mm.x - w.x, uy = mm.y - w.y, uz = mm.z - w.z;
    let ulen = Math.sqrt(ux * ux + uy * uy + uz * uz) || 1;
    ux /= ulen; uy /= ulen; uz /= ulen;

    // forward = cross(right, up)
    const fx = ry * uz - rz * uy;
    const fy = rz * ux - rx * uz;
    const fz = rx * uy - ry * ux;

    return {
      right: {x: rx, y: ry, z: rz},
      up: {x: ux, y: uy, z: uz},
      forward: {x: fx, y: fy, z: fz}
    };
  }

  resolve(results) {
    if(!results?.landmarks) return [];
    const now = performance.now();
    const dt = (now - this.prevTime) / 1000.0;
    this.prevTime = now;
    const hands = [];
    for(let i = 0;i < results.landmarks.length;i++) {
      const lm = results.landmarks[i];
      // const wlm = results.worldLandmarks[i];
      const wlm = results.worldLandmarks[i].map(p => ({
        x: -p.x,
        y: p.y,
        z: p.z
      }));
      const handedness = results.handednesses[i]?.[0]?.categoryName ?? "Unknown";
      const palmCenter = this._palmCenter(lm);
      const palmCenterWorld = this._palmCenter(wlm);
      const palmNormal = this._palmNormal(wlm);
      const velocity = this._velocity(palmCenter, this.prevPalmCenter[i], dt);
      this.prevPalmCenter[i] = palmCenter;
      const fingerStates = this._fingerStates(lm);
      const openCount = fingerStates.filter(Boolean).length;
      const isOK = this._isOK(lm);
      const rotation = this.getRotation(fingerStates[5]);
      const isThumbUp = this._isThumbUp(lm, fingerStates[5]);
      const isOpenHand = openCount > 4;
      const isClosedFist = openCount === 0;
      const [thumb, index, middle, ring, pinky] = fingerStates;
      const isPointing = index && !middle && !ring && !pinky;
      const isPeace = index && middle && !ring && !pinky;
      const isPinch = this._isPinch(lm);
      const isPush = this._isPush(palmNormal, velocity);
      const isCatch = isClosedFist;
      hands.push({
        index: i,
        handedness,           // "Left" | "Right"
        landmarks: lm,        // normalized image coords (x,y,z)
        worldLandmarks: wlm,  // real-world meters, origin = palm center
        palmCenter,           // normalized {x,y,z}
        palmCenterWorld,      // world-space {x,y,z} in meters
        palmNormal,           // vec3 facing direction
        velocity,             // normalized units/sec {x,y,z}
        fingerStates,         // [thumb, index, middle, ring, pinky] true=extended
        openCount,
        isOpenHand,
        isClosedFist,
        isPinch,
        isPush,
        isOK,
        isCatch,
        isPointing,
        isPeace,
        isThumbUp,
        // fingertip
        thumbTip: lm[4],
        indexTip: lm[8],
        middleTip: lm[12],
        ringTip: lm[16],
        pinkyTip: lm[20],
        wrist: lm[0],
      });
    }
    return hands;
  }

  _fingerStatesClassic(lm) {
    const thumbExtended = Math.abs(lm[4].x - lm[2].x) > 0.05;
    const indexExtended = lm[8].y < lm[6].y;
    const middleExtended = lm[12].y < lm[10].y;
    const ringExtended = lm[16].y < lm[14].y;
    const pinkyExtended = lm[20].y < lm[18].y;
    return [thumbExtended, indexExtended, middleExtended, ringExtended, pinkyExtended];
  }

  _fingerStates(lm) {
    const frame = this._handLocalFrame(lm);
    const up = frame.up;

    const _isExtended = (tipIdx, baseIdx) => {
      const dx = lm[tipIdx].x - lm[baseIdx].x;
      const dy = lm[tipIdx].y - lm[baseIdx].y;
      const dz = lm[tipIdx].z - lm[baseIdx].z;
      // dot with palm UP axis — positive means tip is "above" base in hand space
      return (dx * up.x + dy * up.y + dz * up.z) > 0.04;
    };

    // thumb uses RIGHT axis instead
    const right = frame.right;
    const tdx = lm[4].x - lm[2].x;
    const tdy = lm[4].y - lm[2].y;
    const tdz = lm[4].z - lm[2].z;
    const thumbExtended = (tdx * right.x + tdy * right.y + tdz * right.z) > 0.04;

    return [
      thumbExtended,
      _isExtended(8, 6),   // index:  tip vs PIP
      _isExtended(12, 10),  // middle: tip vs PIP
      _isExtended(16, 14),  // ring
      _isExtended(20, 18),  // pinky
      frame
    ];
  }

  _isPinch(lm) {
    const dx = lm[4].x - lm[8].x;
    const dy = lm[4].y - lm[8].y;
    const dz = lm[4].z - lm[8].z;
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
    return dist < 0.06; // threshold in normalized units
  }

  _isPush(palmNormal, velocity) {
    // Palm facing camera (normal.z negative) + moving toward camera (velocity.z negative)
    return palmNormal.z < -0.5 && velocity.z < -0.2;
  }

  _palmCenter(lm) {
    // Average of wrist + 4 knuckles (0, 5, 9, 13, 17)
    const indices = [0, 5, 9, 13, 17];
    let x = 0, y = 0, z = 0;
    for(const i of indices) {
      x += lm[i].x;
      y += lm[i].y;
      z += lm[i].z;
    }
    const n = indices.length;
    return {x: x / n, y: y / n, z: z / n};
  }

  _palmNormal(wlm) {
    // Vectors along palm plane: wrist→index_mcp and wrist→pinky_mcp
    const w = wlm[0];
    const im = wlm[5];
    const pm = wlm[17];
    const ax = im.x - w.x, ay = im.y - w.y, az = im.z - w.z;
    const bx = pm.x - w.x, by = pm.y - w.y, bz = pm.z - w.z;
    // Cross product a × b
    const nx = ay * bz - az * by;
    const ny = az * bx - ax * bz;
    const nz = ax * by - ay * bx;
    const len = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
    return {x: nx / len, y: ny / len, z: nz / len};
  }

  _velocity(current, prev, dt) {
    if(!prev || dt <= 0) return {x: 0, y: 0, z: 0};
    return {
      x: (current.x - prev.x) / dt,
      y: (current.y - prev.y) / dt,
      z: (current.z - prev.z) / dt,
    };
  }

  /**
 * Calculates rotation angles (Euler-like) for the hand.
 * @returns {Object} { roll, pitch, yaw } in radians
 */
  getRotation(frame) {
    // Using the local frame vectors we already calculated
    // Roll: Hand twisting around the Forward axis (Wrist-to-Middle finger)
    const roll = Math.atan2(frame.up.x, frame.up.y);

    // Pitch: Hand tilting forward/backward
    const pitch = Math.atan2(frame.forward.y, frame.forward.z);

    // Yaw: Hand turning left/right
    const yaw = Math.atan2(frame.forward.x, frame.forward.z);

    return {roll, pitch, yaw};
  }

  _isThumbUp(lm, frame) {
    // Check if thumb tip is "above" the index MCP (in world or frame space)
    return lm[4].y < lm[5].y && lm[4].y < lm[17].y;
  }

  _isOK(lm) {
    const dist = this._isPinch(lm); // Thumb-Index proximity
    // Check if others are extended
    const states = this._fingerStates(lm);
    return dist && states[2] && states[3] && states[4];
  }

  // Call this with your camera VP matrix to get real 3D position
  // depth: how far into the scene to place the hand (units)
  unprojected(palmCenter, inversVP, depth = 5.0) {
    const nx = (palmCenter.x * 2.0) - 1.0;
    const ny = -(palmCenter.y * 2.0) + 1.0;
    const clip = [nx, ny, depth, 1.0];
    // multiply by inverse VP (mat4 × vec4)
    const m = inversVP;
    const x = m[0] * clip[0] + m[4] * clip[1] + m[8] * clip[2] + m[12] * clip[3];
    const y = m[1] * clip[0] + m[5] * clip[1] + m[9] * clip[2] + m[13] * clip[3];
    const z = m[2] * clip[0] + m[6] * clip[1] + m[10] * clip[2] + m[14] * clip[3];
    const w = m[3] * clip[0] + m[7] * clip[1] + m[11] * clip[2] + m[15] * clip[3];
    return {x: x / w, y: y / w, z: z / w};
  }
}