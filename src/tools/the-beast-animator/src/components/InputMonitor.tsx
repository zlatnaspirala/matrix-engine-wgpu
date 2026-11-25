import { useState, type RefObject } from 'react';
import { Camera, ChevronDown, ChevronUp, Video } from 'lucide-react';
import type { MotionSourceMode } from '../types/mocap';

export interface CameraDeviceInfo {
  deviceId: string;
  label: string;
}

interface InputMonitorProps {
  mode: MotionSourceMode;
  videoRef: RefObject<HTMLVideoElement | null>;
  overlayCanvasRef: RefObject<HTMLCanvasElement | null>;
  cameraActive: boolean;
  cameraError: string | null;
  cameraDevices: CameraDeviceInfo[];
  selectedDeviceId: string;
  onSelectDevice: (deviceId: string) => void;
  onStartCamera: () => void;
  onSwitchToLive: () => void;
  videoLoaded: boolean;
  mpStatus: string;
  landmarkConfidence: number;
  fpsEstimate: number;
  mirrorCamera: boolean;
}

export function InputMonitor({
  mode,
  videoRef,
  overlayCanvasRef,
  cameraActive,
  cameraError,
  cameraDevices,
  selectedDeviceId,
  onSelectDevice,
  onStartCamera,
  onSwitchToLive,
  videoLoaded,
  mpStatus,
  landmarkConfidence,
  fpsEstimate,
  mirrorCamera,
}: InputMonitorProps) {
  const [collapsed, setCollapsed] = useState(false);

  const isCameraMode = mode === 'live' || mode === 'face';

  const sourceTitle =
    mode === 'face'
      ? 'Face Mesh Feed'
      : mode === 'live'
        ? 'Webcam Feed'
        : mode === 'video'
          ? 'Video Track'
          : mode === 'bvh'
            ? 'BVH Playback'
            : 'Synthetic Pose';

  return (
    <aside
      aria-label="Pose input monitor"
      className="absolute top-2.5 left-2.5 sm:top-4 sm:left-4 z-20 w-[176px] sm:w-[280px] bg-[#12161F]/95 border border-[#232A38] rounded-xl overflow-hidden shadow-lg"
    >
      <div className="px-2.5 sm:px-3 py-1.5 sm:py-2 flex items-center justify-between gap-1.5 border-b border-[#1D2330]">
        <div className="flex items-center gap-1.5 min-w-0">
          <Video className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <span className="text-[11px] sm:text-xs font-medium text-[#E2E8F0] truncate">
            {sourceTitle}
          </span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {!isCameraMode && (
            <button
              type="button"
              onClick={onSwitchToLive}
              title="Switch to Live Camera"
              className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-amber-500/15 text-amber-400 border border-amber-500/30 hover:bg-amber-500/25 cursor-pointer"
            >
              Cam
            </button>
          )}
          <button
            type="button"
            onClick={() => setCollapsed((prev) => !prev)}
            aria-label={collapsed ? 'Expand monitor' : 'Collapse monitor'}
            className="p-1 text-[#8B94A5] hover:text-[#F3F5F8] rounded transition-colors cursor-pointer"
          >
            {collapsed ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronUp className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Keep video & canvas mounted even when collapsed so MediaPipe tracking never drops frames */}
      <div className={collapsed ? 'hidden' : 'block'}>
        <div className="relative w-full aspect-video bg-[#090B0F]">
          <video
            ref={videoRef}
            playsInline
            autoPlay
            muted
            className={`w-full h-full object-contain ${
              (isCameraMode && cameraActive) || (mode === 'video' && videoLoaded)
                ? 'opacity-100'
                : 'opacity-0 pointer-events-none'
            } ${isCameraMode && mirrorCamera ? '-scale-x-100' : ''}`}
          />
          <canvas
            ref={overlayCanvasRef}
            width={320}
            height={180}
            className="absolute inset-0 w-full h-full object-contain pointer-events-none"
          />

          {isCameraMode && !cameraActive && (
            <div className="absolute inset-0 flex flex-col items-center justify-center px-2.5 sm:px-4 text-center bg-[#090B0F]/85">
              <button
                type="button"
                onClick={onStartCamera}
                className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-[11px] sm:text-xs font-semibold rounded-lg bg-amber-500 text-[#0B0D11] hover:bg-amber-400 flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>{mode === 'face' ? 'Enable Face Cam' : 'Enable Camera'}</span>
              </button>
              <span className="hidden sm:block text-[11px] text-[#8B94A5] mt-2 leading-snug">
                {cameraError ||
                  (mode === 'face'
                    ? 'Demo expressions active · Enable cam for 478-pt face tracking'
                    : 'Allow camera permission to track 33 pose landmarks')}
              </span>
            </div>
          )}

          {mode === 'video' && !videoLoaded && (
            <div className="absolute inset-0 flex flex-col items-center justify-center px-2.5 sm:px-4 text-center">
              <span className="text-[11px] sm:text-xs font-medium text-[#D0D7E2]">
                No Video Loaded
              </span>
              <span className="hidden sm:block text-[11px] text-[#7D8799] mt-1">
                Upload MP4, WebM, or MOV below to extract skeletal animation
              </span>
            </div>
          )}
        </div>

        {isCameraMode && cameraDevices.length > 1 && (
          <div className="px-2 py-1 border-t border-[#1D2330] bg-[#0E1117]">
            <select
              value={selectedDeviceId}
              onChange={(e) => onSelectDevice(e.target.value)}
              aria-label="Select webcam device"
              className="w-full px-1.5 py-1 text-[10px] sm:text-[11px] bg-[#141820] border border-[#232A38] rounded text-[#D0D7E2] focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              {cameraDevices.map((d, idx) => (
                <option key={d.deviceId} value={d.deviceId}>
                  {d.label || `Camera ${idx + 1}`}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="px-2.5 sm:px-3 py-1.5 sm:py-2 flex items-center justify-between text-[10px] sm:text-[11px] text-[#8B94A5] font-mono tabular-nums border-t border-[#1D2330]">
          <span className="truncate">{mpStatus}</span>
          <span className="shrink-0 ml-1.5">
            {fpsEstimate > 0 ? `${fpsEstimate}fps` : '--'}
            {' · '}
            {Math.round(landmarkConfidence * 100)}%
          </span>
        </div>
      </div>
    </aside>
  );
}
