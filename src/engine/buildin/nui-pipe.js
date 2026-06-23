// Copyright 2023 The MediaPipe Authors.
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//      http://www.apache.org/licenses/LICENSE-2.0
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @description
 * You can do whatever you want just leave header licence.
 */
export class PipeCommander {

  constructor(videoElementId, canvasElementId) {
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
      this.video.style.transform = "scaleX(-1)";
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
    const {
      HandLandmarker,
      FilesetResolver,
      DrawingUtils
    } = visionModule;
    this.HandLandmarker = HandLandmarker;
    const vision = await FilesetResolver.forVisionTasks("./mediapipe/wasm");
    this.handLandmarker = await HandLandmarker.createFromOptions(
      vision,
      {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
          delegate: "GPU"
        },
        runningMode: this.runningMode,
        numHands: 2
      }
    );
    this.drawingUtils = new DrawingUtils(this.canvasCtx);
    // console.log('its ready');
    this.enableWebcam();
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
    // this.canvasElement.width = this.video.videoWidth;
    // this.canvasElement.height = this.video.videoHeight;
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
          color: "#00FF00",
          lineWidth: 5
        });
        this.drawingUtils.drawLandmarks(landmarks, {color: "#FF0000", lineWidth: 2});
      }
    }
    this.canvasCtx.restore();

    if(this.webcamRunning) {
      window.requestAnimationFrame(() => this.predictWebcam());
    }
  }

  // Override this in your engine to consume landmark data
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