import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { BottomDock } from './components/BottomDock';
import { BvhInspectorOverlay } from './components/BvhInspectorOverlay';
import {
  InputMonitor,
  type CameraDeviceInfo,
} from './components/InputMonitor';
import { TopBar } from './components/TopBar';
import { Viewport3D, type CameraPreset } from './components/Viewport3D';
import { downloadTextFile, generateBVHString } from './engine/bvhExporter';
import { generateDemoLandmarks } from './engine/demoMotions';
import {
  exportFaceMeshGLB,
  exportFaceMeshMultiGLB,
  exportMixamoGLB,
  exportMixamoMultiGLB,
} from './engine/glbExporter';
import { MediaPipeFaceMesh3D } from './engine/mediapipeFaceMesh3D';
import {
  MediaPipeFaceService,
  drawFace2DOverlay,
  extractFaceRigOutput,
  generateSyntheticFaceDemo,
} from './engine/mediapipeFaceTracker';
import {
  MediaPipePoseService,
  drawPose2DOverlay,
} from './engine/mediapipeTracker';
import {
  buildMixamoMannequinRig,
  extractMixamoRigFromGLTF,
  renameMixamoRigBones,
  type ActiveMixamoRig,
} from './engine/mixamoSkeleton';
import {
  FaceBlendshapeFilter,
  PoseLandmarkFilter,
  smoothRecordedPoseFrames,
} from './engine/oneEuroFilter';
import {
  applyPoseFrameToRig,
  retargetFaceToPoseFrame,
  retargetLandmarksToPoseFrame,
} from './engine/poseRetargeter';
import type {
  AnimationTakeClip,
  DemoMotionId,
  MotionSourceMode,
  PoseFrame,
  RecordOptions,
  RetargetSettings,
} from './types/mocap';

const DEFAULT_SETTINGS: RetargetSettings = {
  smoothing: 0.35,
  rootMotion: false,
  footGrounding: true,
  mirrorCamera: true,
  fps: 30,
  namingScheme: 'mixamo-colon',
  includeMeshInGlb: true,
  showSkeleton: true,
};

const DEFAULT_RECORD_OPTIONS: RecordOptions = {
  startDelaySec: 0,
  durationLimitSec: 0,
  frameSkip: 1,
};

function createInitialSampleTake(rig: ActiveMixamoRig): PoseFrame[] {
  const frames: PoseFrame[] = [];
  const fps = 30;
  const count = 48; // 1.6s walk cycle
  for (let i = 0; i < count; i++) {
    const t = i / fps;
    const { worldLandmarks } = generateDemoLandmarks('walk', t);
    const frame = retargetLandmarksToPoseFrame(worldLandmarks, rig, t, {
      mirrorX: false,
      rootMotion: false,
      footGrounding: true,
    });
    if (frame) frames.push(frame);
  }
  return frames;
}

export default function App() {
  const defaultRig = useMemo(
    () => buildMixamoMannequinRig(DEFAULT_SETTINGS.namingScheme),
    [],
  );

  const [rig, setRig] = useState<ActiveMixamoRig>(defaultRig);
  const [mode, setMode] = useState<MotionSourceMode>('lab');
  const [demoMotion, setDemoMotion] = useState<DemoMotionId>('walk');
  const [settings, setSettings] = useState<RetargetSettings>(DEFAULT_SETTINGS);

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraDevices, setCameraDevices] = useState<CameraDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoPlaying, setVideoPlaying] = useState(false);

  const [mpStatus, setMpStatus] = useState('Synthetic 33-pt Pose');
  const [landmarkConfidence, setLandmarkConfidence] = useState(0.99);
  const [fpsEstimate, setFpsEstimate] = useState(30);

  const [isRecording, setIsRecording] = useState(false);
  const [countdownSec, setCountdownSec] = useState(0);
  const [recordElapsedSec, setRecordElapsedSec] = useState(0);
  const [recordOptions, setRecordOptions] = useState<RecordOptions>(
    DEFAULT_RECORD_OPTIONS,
  );
  const [recordedFrames, setRecordedFrames] = useState<PoseFrame[]>(() =>
    createInitialSampleTake(defaultRig),
  );
  const [savedClips, setSavedClips] = useState<AnimationTakeClip[]>([]);
  const [isPlayingTake, setIsPlayingTake] = useState(false);
  const [playbackFrameIdx, setPlaybackFrameIdx] = useState(0);
  const [bvhPlaying, setBvhPlaying] = useState(true);

  const [cameraPreset, setCameraPreset] =
    useState<CameraPreset>('three-quarter');
  const [cameraTrigger, setCameraTrigger] = useState(0);
  const [dockCollapsed, setDockCollapsed] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const videoObjectUrlRef = useRef<string | null>(null);

  const poseServiceRef = useRef<MediaPipePoseService | null>(null);
  const faceServiceRef = useRef<MediaPipeFaceService | null>(null);
  const faceMesh3DRef = useRef<MediaPipeFaceMesh3D | null>(null);
  const filterRef = useRef<PoseLandmarkFilter>(new PoseLandmarkFilter(33));
  const faceLandmarkFilterRef = useRef<PoseLandmarkFilter>(
    new PoseLandmarkFilter(478),
  );
  const faceFilterRef = useRef<FaceBlendshapeFilter>(new FaceBlendshapeFilter());
  const faceHeadQuatRef = useRef<THREE.Quaternion>(new THREE.Quaternion());
  const faceHeadQuatInitializedRef = useRef(false);

  // Mutable refs for 60fps animation loop access
  const rigRef = useRef(rig);
  rigRef.current = rig;
  const modeRef = useRef(mode);
  modeRef.current = mode;
  const demoMotionRef = useRef(demoMotion);
  demoMotionRef.current = demoMotion;
  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  const recordOptionsRef = useRef(recordOptions);
  recordOptionsRef.current = recordOptions;
  const cameraActiveRef = useRef(cameraActive);
  cameraActiveRef.current = cameraActive;
  const videoLoadedRef = useRef(videoLoaded);
  videoLoadedRef.current = videoLoaded;
  const isRecordingRef = useRef(isRecording);
  isRecordingRef.current = isRecording;
  const isPlayingTakeRef = useRef(isPlayingTake);
  isPlayingTakeRef.current = isPlayingTake;

  const recordedFramesRef = useRef<PoseFrame[]>(recordedFrames);
  const lastAppliedFrameRef = useRef<PoseFrame | null>(null);
  const labTimeRef = useRef(0);
  const recordStartMsRef = useRef(0);
  const rawFrameTickCounterRef = useRef(0);
  const countdownTimerRef = useRef<number | null>(null);
  const clipCounterRef = useRef(1);
  const playbackTimeRef = useRef(0);
  const lastVideoTimeRef = useRef(-1);
  const lastHudSyncMsRef = useRef(0);
  const fpsCounterRef = useRef({ frames: 0, lastMs: performance.now() });

  const showNotice = useCallback((msg: string) => {
    setNotice(msg);
    setTimeout(() => {
      setNotice((prev) => (prev === msg ? null : prev));
    }, 3400);
  }, []);

  // Sync bone naming on built-in rig when namingScheme changes
  useEffect(() => {
    renameMixamoRigBones(rig, settings.namingScheme);
  }, [rig, settings.namingScheme]);

  // Keyboard shortcut 'H' to hide/show bottom dock
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
      if (e.key.toLowerCase() === 'h') {
        setDockCollapsed((prev) => !prev);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // Cleanup camera, countdown timer & MediaPipe on unmount
  useEffect(() => {
    return () => {
      if (countdownTimerRef.current !== null) {
        window.clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (videoObjectUrlRef.current) {
        URL.revokeObjectURL(videoObjectUrlRef.current);
      }
      poseServiceRef.current?.dispose();
      faceServiceRef.current?.dispose();
    };
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  }, []);

  const ensureMediaPipeLoaded = useCallback(async () => {
    if (!poseServiceRef.current) {
      poseServiceRef.current = new MediaPipePoseService();
    }
    setMpStatus('Loading MediaPipe...');
    try {
      await poseServiceRef.current.ensureReady();
      setMpStatus('MediaPipe Ready');
      return true;
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'MediaPipe Pose failed to load';
      setMpStatus('Model Load Error');
      showNotice(msg);
      return false;
    }
  }, [showNotice]);

  const ensureFaceMediaPipeLoaded = useCallback(async () => {
    if (!faceServiceRef.current) {
      faceServiceRef.current = new MediaPipeFaceService();
    }
    setMpStatus('Loading Face Model...');
    try {
      await faceServiceRef.current.ensureReady();
      setMpStatus('Face Model Ready');
      return true;
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'MediaPipe Face failed to load';
      setMpStatus('Face Model Error');
      showNotice(msg);
      return false;
    }
  }, [showNotice]);

  const startCamera = useCallback(
    async (deviceId?: string, targetMode?: MotionSourceMode) => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        const msg =
          'Webcam API unavailable (requires HTTPS or browser camera permission).';
        setCameraError(msg);
        setMpStatus('Camera Unsupported');
        showNotice(msg);
        return;
      }

      const activeMode = targetMode ?? modeRef.current;
      const isFaceOnly = activeMode === 'face';

      setCameraError(null);
      setMpStatus('Requesting Camera...');

      // Stop any existing stream before opening a new device
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }

      // Kick off only the relevant MediaPipe model (Face-Only vs Body Pose) in parallel
      const mpPromise = isFaceOnly
        ? ensureFaceMediaPipeLoaded()
        : ensureMediaPipeLoaded();

      let stream: MediaStream;
      try {
        const videoConstraints: MediaTrackConstraints = deviceId
          ? { deviceId: { exact: deviceId }, width: { ideal: 1280 }, height: { ideal: 720 } }
          : { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' };

        stream = await navigator.mediaDevices.getUserMedia({
          video: videoConstraints,
          audio: false,
        });
      } catch (firstErr) {
        // Fallback to minimal constraint if ideal resolution or facingMode is unsupported
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: deviceId ? { deviceId } : true,
            audio: false,
          });
        } catch (err) {
          const domErr = err instanceof DOMException ? err : firstErr;
          const errName = domErr instanceof DOMException ? domErr.name : '';
          let msg = 'Camera access denied or unavailable.';
          if (errName === 'NotAllowedError' || errName === 'PermissionDeniedError') {
            msg = 'Camera permission denied. Allow camera access in your browser bar or open in a new tab.';
          } else if (errName === 'NotFoundError' || errName === 'DevicesNotFoundError') {
            msg = 'No webcam found on this device. Use Video Track or Motion Lab.';
          } else if (errName === 'NotReadableError' || errName === 'TrackStartError') {
            msg = 'Camera is busy or locked by another application.';
          }
          setCameraError(msg);
          setCameraActive(false);
          setMpStatus('Camera Unavailable');
          showNotice(msg);
          return;
        }
      }

      streamRef.current = stream;
      const video = videoRef.current;
      if (video) {
        video.srcObject = null;
        video.src = '';
        video.srcObject = stream;
        try {
          await video.play();
        } catch {
          // autoplay fallback if browser delays play promise
        }
      }

      // Populate device list for multi-camera switching
      try {
        const allDevices = await navigator.mediaDevices.enumerateDevices();
        const cams = allDevices
          .filter((d) => d.kind === 'videoinput')
          .map((d, i) => ({
            deviceId: d.deviceId,
            label: d.label || `Camera ${i + 1}`,
          }));
        setCameraDevices(cams);
        const activeTrack = stream.getVideoTracks()[0];
        const activeId = activeTrack?.getSettings()?.deviceId || cams[0]?.deviceId || '';
        if (activeId) setSelectedDeviceId(activeId);
      } catch {
        // enumerateDevices optional
      }

      filterRef.current.reset();
      faceLandmarkFilterRef.current.reset();
      faceFilterRef.current.reset();
      faceHeadQuatInitializedRef.current = false;
      lastVideoTimeRef.current = -1;
      setCameraActive(true);
      setIsPlayingTake(false);
      setMpStatus(isFaceOnly ? 'Loading Face Model...' : 'Loading Pose Model...');

      const mpOk = await mpPromise;
      if (mpOk && streamRef.current === stream) {
        if (isFaceOnly) {
          faceServiceRef.current?.resetTimestamps();
          setMpStatus('Face Tracking');
        } else {
          poseServiceRef.current?.resetTimestamps();
          setMpStatus('Live Tracking');
        }
      }
    },
    [ensureFaceMediaPipeLoaded, ensureMediaPipeLoaded, showNotice],
  );

  const handleToggleCamera = useCallback(async () => {
    if (cameraActive) {
      stopCamera();
      setMpStatus(modeRef.current === 'face' ? 'Face Demo · Enable Cam' : 'Camera Stopped');
      return;
    }
    await startCamera(selectedDeviceId || undefined, modeRef.current);
  }, [cameraActive, selectedDeviceId, startCamera, stopCamera]);

  const handleUploadVideo = useCallback(
    async (file: File) => {
      stopCamera();
      const ok = await ensureMediaPipeLoaded();
      if (!ok) return;

      if (videoObjectUrlRef.current) {
        URL.revokeObjectURL(videoObjectUrlRef.current);
      }
      const url = URL.createObjectURL(file);
      videoObjectUrlRef.current = url;

      const video = videoRef.current;
      if (!video) return;

      video.srcObject = null;
      video.src = url;
      video.loop = true;
      video.muted = true;
      await video.play();

      poseServiceRef.current?.resetTimestamps();
      filterRef.current.reset();
      lastVideoTimeRef.current = -1;
      setVideoLoaded(true);
      setVideoPlaying(true);
      setIsPlayingTake(false);
      setMpStatus('Tracking Video');
    },
    [ensureMediaPipeLoaded, stopCamera],
  );

  const handleToggleVideoPlay = useCallback(() => {
    const video = videoRef.current;
    if (!video || !videoLoaded) return;
    if (video.paused) {
      video.play();
      setVideoPlaying(true);
    } else {
      video.pause();
      setVideoPlaying(false);
    }
  }, [videoLoaded]);

  const handleSelectMode = useCallback(
    (nextMode: MotionSourceMode) => {
      setMode(nextMode);
      const isCamNext = nextMode === 'live' || nextMode === 'face';
      if (!isCamNext && cameraActive) {
        stopCamera();
      }
      if (nextMode === 'video' && videoRef.current && videoLoaded) {
        videoRef.current.play();
        setVideoPlaying(true);
      } else if (nextMode !== 'video' && videoRef.current && videoLoaded) {
        videoRef.current.pause();
        setVideoPlaying(false);
      }

      if (nextMode === 'face') {
        setCameraPreset('face-portrait');
        setCameraTrigger((n) => n + 1);
        faceLandmarkFilterRef.current.reset();
        faceFilterRef.current.reset();
        faceHeadQuatInitializedRef.current = false;
        if (cameraActive) {
          void ensureFaceMediaPipeLoaded().then((ok) => {
            if (ok && modeRef.current === 'face') {
              faceServiceRef.current?.resetTimestamps();
              setMpStatus('Face Tracking');
            }
          });
        } else {
          setMpStatus('Face Demo · Enable Cam');
        }
      } else {
        if (cameraPreset === 'face-portrait') {
          setCameraPreset('three-quarter');
          setCameraTrigger((n) => n + 1);
        }
        if (nextMode === 'lab') {
          setMpStatus('Synthetic 33-pt Pose');
          filterRef.current.reset();
        } else if (nextMode === 'live') {
          if (!cameraActive) {
            void startCamera(selectedDeviceId || undefined, 'live');
          } else {
            void ensureMediaPipeLoaded().then((ok) => {
              if (ok && modeRef.current === 'live') {
                poseServiceRef.current?.resetTimestamps();
                setMpStatus('Live Tracking');
              }
            });
          }
        } else if (nextMode === 'video' && !videoLoaded) {
          setMpStatus('Upload Video');
        } else if (nextMode === 'bvh') {
          setMpStatus('BVH Verification');
        }
      }
    },
    [
      cameraActive,
      cameraPreset,
      ensureFaceMediaPipeLoaded,
      ensureMediaPipeLoaded,
      selectedDeviceId,
      startCamera,
      stopCamera,
      videoLoaded,
    ],
  );

  const clearCountdownTimer = useCallback(() => {
    if (countdownTimerRef.current !== null) {
      window.clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    setCountdownSec(0);
  }, []);

  const beginRecordingImmediate = useCallback(() => {
    clearCountdownTimer();
    recordedFramesRef.current = [];
    rawFrameTickCounterRef.current = 0;
    setRecordedFrames([]);
    setPlaybackFrameIdx(0);
    setIsPlayingTake(false);
    setRecordElapsedSec(0);
    recordStartMsRef.current = performance.now();
    isRecordingRef.current = true;
    setIsRecording(true);
  }, [clearCountdownTimer]);

  const stopRecordingAndFinalize = useCallback(
    (autoStopped = false) => {
      isRecordingRef.current = false;
      setIsRecording(false);
      setRecordElapsedSec(0);
      const frames = [...recordedFramesRef.current];
      setRecordedFrames(frames);
      if (frames.length > 1) {
        showNotice(
          autoStopped
            ? `Interval complete: captured ${frames.length} frames.`
            : `Captured ${frames.length} frames ready for BVH & GLB export.`,
        );
      }
    },
    [showNotice],
  );

  const pushRecordedFrame = useCallback(
    (frame: PoseFrame) => {
      const opts = recordOptionsRef.current;
      const tickIdx = rawFrameTickCounterRef.current++;
      const step = Math.max(1, opts.frameSkip);
      const isAtLimit =
        opts.durationLimitSec > 0 && frame.time >= opts.durationLimitSec;
      if (tickIdx === 0 || tickIdx % step === 0 || isAtLimit) {
        recordedFramesRef.current.push(frame);
      }
      if (isAtLimit) {
        stopRecordingAndFinalize(true);
      }
    },
    [stopRecordingAndFinalize],
  );

  const handleToggleRecord = useCallback(() => {
    if (countdownSec > 0) {
      clearCountdownTimer();
      showNotice('Recording countdown cancelled.');
      return;
    }
    if (isRecording) {
      stopRecordingAndFinalize(false);
      return;
    }

    const delay = recordOptions.startDelaySec;
    if (delay > 0) {
      clearCountdownTimer();
      const endMs = performance.now() + delay * 1000;
      setCountdownSec(delay);
      countdownTimerRef.current = window.setInterval(() => {
        const rem = (endMs - performance.now()) / 1000;
        if (rem <= 0) {
          beginRecordingImmediate();
        } else {
          setCountdownSec(rem);
        }
      }, 100);
    } else {
      beginRecordingImmediate();
    }
  }, [
    beginRecordingImmediate,
    clearCountdownTimer,
    countdownSec,
    isRecording,
    recordOptions.startDelaySec,
    showNotice,
    stopRecordingAndFinalize,
  ]);

  const handleTogglePlayTake = useCallback(() => {
    if (recordedFramesRef.current.length < 2) return;
    setIsPlayingTake((prev) => {
      const next = !prev;
      if (next) {
        playbackTimeRef.current = 0;
        setPlaybackFrameIdx(0);
      }
      return next;
    });
  }, []);

  const handleScrubTake = useCallback((idx: number) => {
    const frames = recordedFramesRef.current;
    if (frames.length === 0) return;
    const clamped = THREE.MathUtils.clamp(idx, 0, frames.length - 1);
    setIsPlayingTake(false);
    setPlaybackFrameIdx(clamped);
    playbackTimeRef.current = frames[clamped].time;
    applyPoseFrameToRig(frames[clamped], rigRef.current);
    if (frames[clamped].facePositions) {
      faceMesh3DRef.current?.applyPositions(frames[clamped].facePositions);
    }
    lastAppliedFrameRef.current = frames[clamped];
  }, []);

  const handleSmoothTake = useCallback(() => {
    const frames = recordedFramesRef.current;
    if (frames.length < 3) {
      showNotice('Record at least 3 frames to smooth a take.');
      return;
    }
    const smoothed = smoothRecordedPoseFrames(frames, 2);
    recordedFramesRef.current = smoothed;
    setRecordedFrames(smoothed);
    const idx = THREE.MathUtils.clamp(playbackFrameIdx, 0, smoothed.length - 1);
    applyPoseFrameToRig(smoothed[idx], rigRef.current);
    if (smoothed[idx].facePositions) {
      faceMesh3DRef.current?.applyPositions(smoothed[idx].facePositions);
    }
    lastAppliedFrameRef.current = smoothed[idx];
    showNotice('Applied zero-phase temporal smoothing to recorded take.');
  }, [playbackFrameIdx, showNotice]);

  const handleClearTake = useCallback(() => {
    clearCountdownTimer();
    isRecordingRef.current = false;
    setIsRecording(false);
    setRecordElapsedSec(0);
    setIsPlayingTake(false);
    recordedFramesRef.current = [];
    rawFrameTickCounterRef.current = 0;
    setRecordedFrames([]);
    setPlaybackFrameIdx(0);
  }, [clearCountdownTimer]);

  const handleSaveCurrentClip = useCallback(() => {
    const frames = recordedFramesRef.current;
    if (frames.length < 2) {
      showNotice('Record at least 2 frames before adding a clip.');
      return;
    }
    const base =
      mode === 'lab'
        ? demoMotion
        : mode === 'face'
          ? 'face_rig'
          : mode === 'video'
            ? 'video_track'
            : 'live_capture';
    const num = String(clipCounterRef.current++).padStart(2, '0');
    const name = `${base}_${num}`;
    const clonedFrames: PoseFrame[] = frames.map((f) => ({
      time: f.time,
      hipsPosition: [...f.hipsPosition] as [number, number, number],
      rotations: { ...f.rotations },
      faceBlendshapes: f.faceBlendshapes ? { ...f.faceBlendshapes } : undefined,
      facePositions: f.facePositions ? new Float32Array(f.facePositions) : undefined,
    }));

    const isFaceTake =
      mode === 'face' ||
      frames.some((f) => Boolean(f.facePositions || f.faceBlendshapes));

    const newClip: AnimationTakeClip = {
      id: `clip_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name,
      frames: clonedFrames,
      fps: settings.fps,
      included: true,
      clipType: isFaceTake ? 'face' : 'pose',
    };
    setSavedClips((prev) => [...prev, newClip]);
    showNotice(`Added "${name}" to GLB Clips.`);
  }, [demoMotion, mode, settings.fps, showNotice]);

  const handleToggleClipIncluded = useCallback((id: string) => {
    setSavedClips((prev) =>
      prev.map((c) => (c.id === id ? { ...c, included: !c.included } : c)),
    );
  }, []);

  const handleRenameClip = useCallback((id: string, name: string) => {
    setSavedClips((prev) =>
      prev.map((c) => (c.id === id ? { ...c, name } : c)),
    );
  }, []);

  const handleLoadClip = useCallback(
    (id: string) => {
      const clip = savedClips.find((c) => c.id === id);
      if (!clip || clip.frames.length < 2) return;
      clearCountdownTimer();
      isRecordingRef.current = false;
      setIsRecording(false);
      const cloned: PoseFrame[] = clip.frames.map((f) => ({
        time: f.time,
        hipsPosition: [...f.hipsPosition] as [number, number, number],
        rotations: { ...f.rotations },
        faceBlendshapes: f.faceBlendshapes ? { ...f.faceBlendshapes } : undefined,
        facePositions: f.facePositions ? new Float32Array(f.facePositions) : undefined,
      }));
      recordedFramesRef.current = cloned;
      setRecordedFrames(cloned);
      playbackTimeRef.current = 0;
      setPlaybackFrameIdx(0);

      const isFaceClip =
        clip.clipType === 'face' ||
        cloned.some((f) => Boolean(f.facePositions || f.faceBlendshapes));
      if (isFaceClip && modeRef.current !== 'face') {
        handleSelectMode('face');
      } else if (!isFaceClip && modeRef.current === 'face') {
        handleSelectMode('lab');
      }

      applyPoseFrameToRig(cloned[0], rigRef.current);
      if (cloned[0].facePositions) {
        faceMesh3DRef.current?.applyPositions(cloned[0].facePositions);
      }
      lastAppliedFrameRef.current = cloned[0];
      setIsPlayingTake(true);
      showNotice(`Loaded "${clip.name}" into timeline.`);
    },
    [clearCountdownTimer, handleSelectMode, savedClips, showNotice],
  );

  const handleDeleteClip = useCallback((id: string) => {
    setSavedClips((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const handleUploadMixamoGlb = useCallback(
    async (file: File) => {
      try {
        const buffer = await file.arrayBuffer();
        const loader = new GLTFLoader();
        const gltf = await loader.parseAsync(buffer, '');
        const customRig = extractMixamoRigFromGLTF(gltf.scene, file.name);
        if (!customRig) {
          showNotice(
            'Could not find Mixamo bones (Hips, Spine, Arms, Legs) in that GLB.',
          );
          return;
        }
        setRig(customRig);
        showNotice(`Loaded Mixamo rig: ${file.name}`);
      } catch {
        showNotice('Failed to parse GLB file.');
      }
    },
    [showNotice],
  );

  const handleResetDefaultRig = useCallback(() => {
    const fresh = buildMixamoMannequinRig(settings.namingScheme);
    setRig(fresh);
    showNotice('Restored built-in Mixamo Mannequin.');
  }, [settings.namingScheme, showNotice]);

  // Generate BVH text whenever recordedFrames, fps, or namingScheme updates
  const bvhText = useMemo(() => {
    if (recordedFrames.length < 2) return '';
    return generateBVHString(
      recordedFrames,
      settings.fps,
      settings.namingScheme,
    );
  }, [recordedFrames, settings.fps, settings.namingScheme]);

  const includedClips = useMemo(
    () => savedClips.filter((c) => c.included && c.frames.length > 1),
    [savedClips],
  );

  const handleExportBvh = useCallback(() => {
    if (!bvhText) {
      showNotice('Record a motion clip first to export BVH.');
      return;
    }
    const stamp = new Date().toISOString().slice(11, 19).replace(/:/g, '-');
    downloadTextFile(bvhText, `beast_animator_${stamp}.bvh`);
    showNotice('Exported Mixamo-compatible .BVH animation.');
  }, [bvhText, showNotice]);

  const handleExportGlb = useCallback(async () => {
    const hasMultiClips = includedClips.length > 0;
    if (!hasMultiClips && recordedFrames.length < 2) {
      showNotice('Record or add a motion clip first to export GLB.');
      return;
    }

    const hasFaceFrames = (frames: PoseFrame[]) =>
      frames.some((f) => Boolean(f.facePositions || f.faceBlendshapes));
    const useFaceRig =
      !rigRef.current.isCustomModel &&
      (hasMultiClips
        ? includedClips.every(
            (c) => c.clipType === 'face' || hasFaceFrames(c.frames),
          )
        : hasFaceFrames(recordedFrames));

    setIsExporting(true);
    try {
      const stamp = new Date().toISOString().slice(11, 19).replace(/:/g, '-');
      const filename = useFaceRig
        ? `beast_face_${stamp}.glb`
        : `beast_animator_${stamp}.glb`;

      if (useFaceRig) {
        if (hasMultiClips) {
          await exportFaceMeshMultiGLB(
            includedClips.map((c) => ({
              name: c.name,
              frames: c.frames,
              fps: c.fps,
            })),
            {
              fps: settings.fps,
              filename,
            },
          );
          showNotice(
            `Exported multi-animation Face .GLB (${includedClips.length} clip${includedClips.length > 1 ? 's' : ''}).`,
          );
        } else {
          await exportFaceMeshGLB(recordedFrames, {
            fps: settings.fps,
            filename,
          });
          showNotice('Exported rigged Face Mesh .GLB animation.');
        }
      } else if (hasMultiClips) {
        await exportMixamoMultiGLB(
          includedClips.map((c) => ({
            name: c.name,
            frames: c.frames,
            fps: c.fps,
          })),
          rigRef.current,
          {
            fps: settings.fps,
            namingScheme: settings.namingScheme,
            includeMesh: settings.includeMeshInGlb,
            filename,
            restoreFrame: lastAppliedFrameRef.current,
          },
        );
        showNotice(
          `Exported multi-animation .GLB (${includedClips.length} clip${includedClips.length > 1 ? 's' : ''}).`,
        );
      } else {
        await exportMixamoGLB(recordedFrames, rigRef.current, {
          fps: settings.fps,
          namingScheme: settings.namingScheme,
          includeMesh: settings.includeMeshInGlb,
          filename,
          restoreFrame: lastAppliedFrameRef.current,
        });
        showNotice('Exported rigged Mixamo .GLB animation.');
      }
    } catch {
      showNotice('GLB export failed. Check console for details.');
    } finally {
      setIsExporting(false);
    }
  }, [
    includedClips,
    recordedFrames,
    settings.fps,
    settings.includeMeshInGlb,
    settings.namingScheme,
    showNotice,
  ]);

  // 60FPS Real-time Capture & Retargeting Tick (invoked from Viewport3D)
  const onTickFrame = useCallback(
    (nowMs: number, deltaSec: number) => {
      const curMode = modeRef.current;
      const curRig = rigRef.current;
      const curSettings = settingsRef.current;
      const canvas = overlayCanvasRef.current;
      const ctx = canvas?.getContext('2d') ?? null;

      // 1. Reviewing recorded take
      if (isPlayingTakeRef.current && recordedFramesRef.current.length > 1) {
        const frames = recordedFramesRef.current;
        const duration = Math.max(frames[frames.length - 1].time, 0.05);
        playbackTimeRef.current = (playbackTimeRef.current + deltaSec) % duration;
        const t = playbackTimeRef.current;

        let idx = 0;
        for (let i = 0; i < frames.length; i++) {
          if (frames[i].time <= t) idx = i;
          else break;
        }
        const nextIdx = Math.min(idx + 1, frames.length - 1);
        const span = frames[nextIdx].time - frames[idx].time;
        const alpha =
          span > 1e-5
            ? THREE.MathUtils.clamp((t - frames[idx].time) / span, 0, 1)
            : 0;

        applyPoseFrameToRig(frames[idx], curRig);
        const facePosA = frames[idx].facePositions;
        if (facePosA) {
          faceMesh3DRef.current?.interpolateAndApplyPositions(
            facePosA,
            frames[nextIdx].facePositions ?? facePosA,
            alpha,
          );
        }
        lastAppliedFrameRef.current = frames[idx];

        if (nowMs - lastHudSyncMsRef.current > 80) {
          lastHudSyncMsRef.current = nowMs;
          setPlaybackFrameIdx(idx);
        }
        return;
      }

      // 2. Motion Lab synthetic 33-landmark pose stream
      if (curMode === 'lab') {
        labTimeRef.current += deltaSec;
        const { worldLandmarks, landmarks2D } = generateDemoLandmarks(
          demoMotionRef.current,
          labTimeRef.current,
        );

        if (ctx && canvas) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          drawPose2DOverlay(
            ctx,
            landmarks2D,
            canvas.width,
            canvas.height,
            false,
          );
        }

        const filtered = filterRef.current.filter(
          worldLandmarks,
          nowMs / 1000,
          curSettings.smoothing,
        );
        const frame = retargetLandmarksToPoseFrame(
          filtered,
          curRig,
          isRecordingRef.current ? (nowMs - recordStartMsRef.current) / 1000 : 0,
          {
            mirrorX: false,
            rootMotion: curSettings.rootMotion,
            footGrounding: curSettings.footGrounding,
          },
        );

        if (frame) {
          applyPoseFrameToRig(frame, curRig);
          lastAppliedFrameRef.current = frame;
          if (isRecordingRef.current) {
            pushRecordedFrame(frame);
          }
        }
      }

      // 3. Dedicated MediaPipe 478-pt Face Mesh Scene (isolated from Pose Scene)
      if (curMode === 'face') {
        if (cameraActiveRef.current) {
          const video = videoRef.current;
          const fm = faceServiceRef.current;
          if (
            video &&
            fm &&
            video.readyState >= 2 &&
            video.videoWidth > 0 &&
            video.videoHeight > 0
          ) {
            if (
              canvas &&
              (canvas.width !== video.videoWidth ||
                canvas.height !== video.videoHeight)
            ) {
              canvas.width = video.videoWidth;
              canvas.height = video.videoHeight;
            }
            const res = fm.detectForVideo(video, nowMs);

            if (ctx && canvas) {
              ctx.clearRect(0, 0, canvas.width, canvas.height);
              if (res?.faceLandmarks?.[0]) {
                drawFace2DOverlay(
                  ctx,
                  res.faceLandmarks[0],
                  canvas.width,
                  canvas.height,
                  curSettings.mirrorCamera,
                );
              }
            }

            if (res?.faceLandmarks?.[0]) {
              const filteredLms = faceLandmarkFilterRef.current.filter(
                res.faceLandmarks[0],
                nowMs / 1000,
                curSettings.smoothing,
              );
              const rawJawOpenScore = res.faceBlendshapes?.[0]?.categories?.find(
                (c) => c.categoryName === 'jawOpen',
              )?.score;
              faceMesh3DRef.current?.updateFromLandmarks(
                filteredLms,
                video.videoWidth / video.videoHeight,
                curSettings.mirrorCamera,
                rawJawOpenScore,
              );

              if (isRecordingRef.current) {
                const extracted = extractFaceRigOutput(
                  res,
                  curSettings.mirrorCamera,
                );
                if (extracted) {
                  const filteredShapes = faceFilterRef.current.filter(
                    extracted.blendshapes,
                    nowMs / 1000,
                    curSettings.smoothing,
                  );
                  if (
                    !faceHeadQuatInitializedRef.current ||
                    curSettings.smoothing <= 0.01
                  ) {
                    faceHeadQuatRef.current.copy(extracted.headQuat);
                    faceHeadQuatInitializedRef.current = true;
                  } else {
                    const slerpRate = 28 - curSettings.smoothing * 22;
                    const alpha = 1 - Math.exp(-deltaSec * slerpRate);
                    faceHeadQuatRef.current.slerp(extracted.headQuat, alpha);
                  }
                  const frame = retargetFaceToPoseFrame(
                    faceHeadQuatRef.current,
                    filteredShapes,
                    curRig,
                    (nowMs - recordStartMsRef.current) / 1000,
                  );
                  frame.facePositions =
                    faceMesh3DRef.current?.capturePositions();
                  lastAppliedFrameRef.current = frame;
                  pushRecordedFrame(frame);
                }
              }

              fpsCounterRef.current.frames++;
              if (nowMs - fpsCounterRef.current.lastMs > 500) {
                const elapsed =
                  (nowMs - fpsCounterRef.current.lastMs) / 1000;
                setFpsEstimate(
                  Math.round(fpsCounterRef.current.frames / elapsed),
                );
                fpsCounterRef.current.frames = 0;
                fpsCounterRef.current.lastMs = nowMs;
                setLandmarkConfidence(0.99);
              }
            }
          }
        } else {
          // Synthetic 478-pt MediaPipe Face Mesh demo when Face Cam is off
          labTimeRef.current += deltaSec;
          if (ctx && canvas) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
          }
          faceMesh3DRef.current?.updateSyntheticDemo(labTimeRef.current);

          if (isRecordingRef.current) {
            const demo = generateSyntheticFaceDemo(labTimeRef.current);
            const filteredShapes = faceFilterRef.current.filter(
              demo.blendshapes,
              nowMs / 1000,
              curSettings.smoothing,
            );
            const frame = retargetFaceToPoseFrame(
              demo.headQuat,
              filteredShapes,
              curRig,
              (nowMs - recordStartMsRef.current) / 1000,
            );
            frame.facePositions = faceMesh3DRef.current?.capturePositions();
            lastAppliedFrameRef.current = frame;
            pushRecordedFrame(frame);
          }
        }
      }

      // 4. Live Webcam or Video Track via MediaPipe PoseLandmarker
      if (
        (curMode === 'live' && cameraActiveRef.current) ||
        (curMode === 'video' && videoLoadedRef.current)
      ) {
        const video = videoRef.current;
        const mp = poseServiceRef.current;
        if (
          video &&
          mp &&
          video.readyState >= 2 &&
          video.videoWidth > 0 &&
          video.videoHeight > 0
        ) {
          const hasNewFrame =
            curMode === 'live' || video.currentTime !== lastVideoTimeRef.current;
          if (hasNewFrame) {
            lastVideoTimeRef.current = video.currentTime;
            if (
              canvas &&
              (canvas.width !== video.videoWidth ||
                canvas.height !== video.videoHeight)
            ) {
              canvas.width = video.videoWidth;
              canvas.height = video.videoHeight;
            }
            const res = mp.detectForVideo(video, nowMs);

            if (ctx && canvas) {
              ctx.clearRect(0, 0, canvas.width, canvas.height);
              if (res?.landmarks?.[0]) {
                drawPose2DOverlay(
                  ctx,
                  res.landmarks[0],
                  canvas.width,
                  canvas.height,
                  curMode === 'live' && curSettings.mirrorCamera,
                );
              }
            }

            if (res?.worldLandmarks?.[0]) {
              const rawWorld = res.worldLandmarks[0];
              const filtered = filterRef.current.filter(
                rawWorld,
                nowMs / 1000,
                curSettings.smoothing,
              );
              const frame = retargetLandmarksToPoseFrame(
                filtered,
                curRig,
                isRecordingRef.current
                  ? (nowMs - recordStartMsRef.current) / 1000
                  : 0,
                {
                  mirrorX: curMode === 'live' && curSettings.mirrorCamera,
                  rootMotion: curSettings.rootMotion,
                  footGrounding: curSettings.footGrounding,
                },
              );
              if (frame) {
                applyPoseFrameToRig(frame, curRig);
                lastAppliedFrameRef.current = frame;
                if (isRecordingRef.current) {
                  pushRecordedFrame(frame);
                }
              }

              // Update FPS & visibility confidence periodically
              fpsCounterRef.current.frames++;
              if (nowMs - fpsCounterRef.current.lastMs > 500) {
                const elapsed =
                  (nowMs - fpsCounterRef.current.lastMs) / 1000;
                setFpsEstimate(
                  Math.round(fpsCounterRef.current.frames / elapsed),
                );
                fpsCounterRef.current.frames = 0;
                fpsCounterRef.current.lastMs = nowMs;

                const visSum = rawWorld.reduce(
                  (acc, lm) => acc + (lm.visibility ?? 0.9),
                  0,
                );
                setLandmarkConfidence(visSum / rawWorld.length);
              }
            }
          }
        }
      }

      // Periodic React HUD sync during recording
      if (
        isRecordingRef.current &&
        nowMs - lastHudSyncMsRef.current > 100
      ) {
        lastHudSyncMsRef.current = nowMs;
        setRecordElapsedSec((nowMs - recordStartMsRef.current) / 1000);
        setRecordedFrames([...recordedFramesRef.current]);
      }
    },
    [pushRecordedFrame],
  );

  const recordedDuration =
    recordedFrames.length > 1
      ? recordedFrames[recordedFrames.length - 1].time
      : 0;

  const exportClipCount =
    includedClips.length > 0
      ? includedClips.length
      : recordedFrames.length > 1
        ? 1
        : 0;

  return (
    <div className="h-[100dvh] w-screen flex flex-col bg-[#0B0D11] text-[#F3F5F8] overflow-hidden select-none">
      <TopBar
        mode={mode}
        onSelectMode={handleSelectMode}
        canExport={exportClipCount > 0}
        exportClipCount={exportClipCount}
        isExporting={isExporting}
        onExportGlb={handleExportGlb}
      />

      <main className="relative flex-1 min-h-0 w-full overflow-hidden">
        <Viewport3D
          rig={rig}
          mode={mode}
          showSkeleton={settings.showSkeleton}
          bvhText={bvhText}
          bvhPlaybackPlaying={bvhPlaying}
          cameraPreset={cameraPreset}
          cameraTrigger={cameraTrigger}
          faceMesh3DRef={faceMesh3DRef}
          onTickFrame={onTickFrame}
        />

        <InputMonitor
          mode={mode}
          videoRef={videoRef}
          overlayCanvasRef={overlayCanvasRef}
          cameraActive={cameraActive}
          cameraError={cameraError}
          cameraDevices={cameraDevices}
          selectedDeviceId={selectedDeviceId}
          onSelectDevice={(deviceId) => {
            setSelectedDeviceId(deviceId);
            if (cameraActive) void startCamera(deviceId, mode);
          }}
          onStartCamera={() =>
            void startCamera(selectedDeviceId || undefined, mode)
          }
          onSwitchToLive={() => handleSelectMode('live')}
          videoLoaded={videoLoaded}
          mpStatus={mpStatus}
          landmarkConfidence={landmarkConfidence}
          fpsEstimate={fpsEstimate}
          mirrorCamera={settings.mirrorCamera}
        />

        {mode === 'bvh' && (
          <BvhInspectorOverlay
            bvhText={bvhText}
            frameCount={Math.max(
              0,
              Math.round(recordedDuration * settings.fps) + 1,
            )}
            fps={settings.fps}
            namingScheme={settings.namingScheme}
            onDownloadBvh={handleExportBvh}
            onDownloadGlb={handleExportGlb}
          />
        )}

        {notice && (
          <div
            role="status"
            className="absolute top-4 left-1/2 -translate-x-1/2 z-30 px-4 py-2 rounded-lg bg-[#161B26] border border-amber-500/40 text-xs font-medium text-[#F3F5F8] shadow-xl pointer-events-none"
          >
            {notice}
          </div>
        )}

        {countdownSec > 0 && (
          <div
            role="status"
            className="absolute top-14 left-1/2 -translate-x-1/2 z-30 px-5 py-2.5 rounded-xl bg-[#141821] border border-amber-500/60 text-sm font-semibold text-amber-400 shadow-2xl pointer-events-none flex items-center gap-2"
          >
            <span>Recording starts in</span>
            <span className="font-mono text-base tabular-nums text-[#F3F5F8]">
              {Math.ceil(countdownSec)}s
            </span>
          </div>
        )}

        <BottomDock
          mode={mode}
          demoMotion={demoMotion}
          onSelectDemoMotion={(id) => {
            setDemoMotion(id);
            setIsPlayingTake(false);
          }}
          cameraActive={cameraActive}
          onToggleCamera={handleToggleCamera}
          videoLoaded={videoLoaded}
          videoPlaying={videoPlaying}
          onUploadVideo={handleUploadVideo}
          onToggleVideoPlay={handleToggleVideoPlay}
          isRecording={isRecording}
          countdownSec={countdownSec}
          recordElapsedSec={recordElapsedSec}
          recordOptions={recordOptions}
          onUpdateRecordOptions={(patch) =>
            setRecordOptions((prev) => ({ ...prev, ...patch }))
          }
          onToggleRecord={handleToggleRecord}
          recordedCount={recordedFrames.length}
          recordedDuration={recordedDuration}
          isPlayingTake={isPlayingTake}
          playbackFrameIdx={playbackFrameIdx}
          onTogglePlayTake={handleTogglePlayTake}
          onScrubTake={handleScrubTake}
          onSmoothTake={handleSmoothTake}
          onClearTake={handleClearTake}
          savedClips={savedClips}
          onSaveCurrentClip={handleSaveCurrentClip}
          onToggleClipIncluded={handleToggleClipIncluded}
          onRenameClip={handleRenameClip}
          onLoadClip={handleLoadClip}
          onDeleteClip={handleDeleteClip}
          bvhPlaying={bvhPlaying}
          onToggleBvhPlay={() => setBvhPlaying((p) => !p)}
          settings={settings}
          onUpdateSettings={(patch) =>
            setSettings((prev) => ({ ...prev, ...patch }))
          }
          customRigLabel={rig.isCustomModel ? rig.label : null}
          onUploadMixamoGlb={handleUploadMixamoGlb}
          onResetDefaultRig={handleResetDefaultRig}
          cameraPreset={cameraPreset}
          onSelectCameraPreset={(preset) => {
            setCameraPreset(preset);
            setCameraTrigger((n) => n + 1);
          }}
          onExportBvh={handleExportBvh}
          onExportGlb={handleExportGlb}
          isExporting={isExporting}
          collapsed={dockCollapsed}
          onToggleCollapsed={() => setDockCollapsed((c) => !c)}
        />
      </main>
    </div>
  );
}
