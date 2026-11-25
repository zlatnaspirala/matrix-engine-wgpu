import { useRef, useState } from 'react';
import {
  Camera,
  CheckSquare,
  ChevronDown,
  ChevronUp,
  Clock,
  Download,
  Film,
  Layers,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Square,
  Trash2,
  Upload,
} from 'lucide-react';
import { DEMO_MOTIONS } from '../engine/demoMotions';
import type {
  AnimationTakeClip,
  BoneNamingScheme,
  DemoMotionId,
  MotionSourceMode,
  RecordOptions,
  RetargetSettings,
} from '../types/mocap';
import type { CameraPreset } from './Viewport3D';

interface BottomDockProps {
  mode: MotionSourceMode;
  demoMotion: DemoMotionId;
  onSelectDemoMotion: (id: DemoMotionId) => void;
  cameraActive: boolean;
  onToggleCamera: () => void;
  videoLoaded: boolean;
  videoPlaying: boolean;
  onUploadVideo: (file: File) => void;
  onToggleVideoPlay: () => void;
  isRecording: boolean;
  countdownSec: number;
  recordElapsedSec: number;
  recordOptions: RecordOptions;
  onUpdateRecordOptions: (patch: Partial<RecordOptions>) => void;
  onToggleRecord: () => void;
  recordedCount: number;
  recordedDuration: number;
  isPlayingTake: boolean;
  playbackFrameIdx: number;
  onTogglePlayTake: () => void;
  onScrubTake: (idx: number) => void;
  onSmoothTake: () => void;
  onClearTake: () => void;
  savedClips: AnimationTakeClip[];
  onSaveCurrentClip: () => void;
  onToggleClipIncluded: (id: string) => void;
  onRenameClip: (id: string, name: string) => void;
  onLoadClip: (id: string) => void;
  onDeleteClip: (id: string) => void;
  bvhPlaying: boolean;
  onToggleBvhPlay: () => void;
  settings: RetargetSettings;
  onUpdateSettings: (patch: Partial<RetargetSettings>) => void;
  customRigLabel: string | null;
  onUploadMixamoGlb: (file: File) => void;
  onResetDefaultRig: () => void;
  cameraPreset: CameraPreset;
  onSelectCameraPreset: (preset: CameraPreset) => void;
  onExportBvh: () => void;
  onExportGlb: () => void;
  isExporting: boolean;
  collapsed: boolean;
  onToggleCollapsed: () => void;
}

function formatTimecode(sec: number): string {
  const mins = Math.floor(sec / 60);
  const rem = sec % 60;
  return `${String(mins).padStart(2, '0')}:${rem.toFixed(2).padStart(5, '0')}`;
}

export function BottomDock({
  mode,
  demoMotion,
  onSelectDemoMotion,
  cameraActive,
  onToggleCamera,
  videoLoaded,
  videoPlaying,
  onUploadVideo,
  onToggleVideoPlay,
  isRecording,
  countdownSec,
  recordElapsedSec,
  recordOptions,
  onUpdateRecordOptions,
  onToggleRecord,
  recordedCount,
  recordedDuration,
  isPlayingTake,
  playbackFrameIdx,
  onTogglePlayTake,
  onScrubTake,
  onSmoothTake,
  onClearTake,
  savedClips,
  onSaveCurrentClip,
  onToggleClipIncluded,
  onRenameClip,
  onLoadClip,
  onDeleteClip,
  bvhPlaying,
  onToggleBvhPlay,
  settings,
  onUpdateSettings,
  customRigLabel,
  onUploadMixamoGlb,
  onResetDefaultRig,
  cameraPreset,
  onSelectCameraPreset,
  onExportBvh,
  onExportGlb,
  isExporting,
  collapsed,
  onToggleCollapsed,
}: BottomDockProps) {
  const [activeTab, setActiveTab] = useState<'capture' | 'clips' | 'rig'>('capture');
  const videoInputRef = useRef<HTMLInputElement | null>(null);
  const glbInputRef = useRef<HTMLInputElement | null>(null);

  const hasTake = recordedCount > 1;
  const includedClipsCount = savedClips.filter(
    (c) => c.included && c.frames.length > 1,
  ).length;
  const canExportGlb = includedClipsCount > 0 || hasTake;
  const remainingRecordSec =
    isRecording && recordOptions.durationLimitSec > 0
      ? Math.max(0, recordOptions.durationLimitSec - recordElapsedSec)
      : 0;

  return (
    <div
      className={`fixed bottom-2 sm:bottom-4 left-1/2 -translate-x-1/2 w-[min(1000px,calc(100vw-16px))] sm:w-[min(1000px,calc(100vw-32px))] z-20 transition-transform duration-200 ease-out ${
        collapsed ? 'translate-y-[calc(100%-32px)]' : 'translate-y-0'
      }`}
    >
      {/* Collapse / Expand tab attached to top edge of dock */}
      <div className="flex justify-center">
        <button
          type="button"
          onClick={onToggleCollapsed}
          className="px-3.5 py-1 text-[11px] font-medium text-[#A8B1C2] hover:text-[#F3F5F8] bg-[#131720] border border-b-0 border-[#252D3D] rounded-t-lg flex items-center gap-1.5 cursor-pointer transition-colors"
        >
          {collapsed ? (
            <>
              <ChevronUp className="w-3.5 h-3.5" />
              <span>Show Controls</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5" />
              <span>Hide Controls</span>
            </>
          )}
        </button>
      </div>

      {/* Main Dock Container */}
      <div className="bg-[#12161F]/95 border border-[#232A38] rounded-xl shadow-2xl p-2.5 sm:p-3.5 flex flex-col gap-2 sm:gap-2.5">
        {/* Dock Header Row: Sub-tabs + Camera Views + Direct Exports */}
        <div className="flex items-center justify-between gap-2 sm:gap-3 border-b border-[#1E2430] pb-2 sm:pb-2.5 overflow-x-auto scrollbar-none">
          {/* Segmented Tab Switcher */}
          <div className="flex items-center gap-1 p-1 bg-[#0B0D11] rounded-lg border border-[#1E2430] shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('capture')}
              className={`px-2.5 sm:px-3 py-1 text-[11px] sm:text-xs font-medium rounded-md whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                activeTab === 'capture'
                  ? 'bg-[#1F2633] text-[#F3F5F8]'
                  : 'text-[#8B94A5] hover:text-[#D0D7E2]'
              }`}
            >
              <span className="sm:hidden">Capture</span>
              <span className="hidden sm:inline">Capture & Timeline</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('clips')}
              className={`px-2.5 sm:px-3 py-1 text-[11px] sm:text-xs font-medium rounded-md whitespace-nowrap shrink-0 transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'clips'
                  ? 'bg-[#1F2633] text-amber-400'
                  : 'text-[#8B94A5] hover:text-[#D0D7E2]'
              }`}
            >
              <Layers className="w-3 h-3" />
              <span>Clips ({savedClips.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('rig')}
              className={`px-2.5 sm:px-3 py-1 text-[11px] sm:text-xs font-medium rounded-md whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                activeTab === 'rig'
                  ? 'bg-[#1F2633] text-[#F3F5F8]'
                  : 'text-[#8B94A5] hover:text-[#D0D7E2]'
              }`}
            >
              <span className="sm:hidden">Rig</span>
              <span className="hidden sm:inline">Mixamo Rig</span>
            </button>
          </div>

          {/* Camera View Presets */}
          <div className="hidden md:flex items-center gap-1 p-1 bg-[#0B0D11] rounded-lg border border-[#1E2430]">
            {(
              [
                ['three-quarter', '3/4'],
                ['front', 'Front'],
                ['side', 'Side'],
                ['top', 'Top'],
                ['face-portrait', 'Face'],
              ] as [CameraPreset, string][]
            ).map(([presetId, label]) => (
              <button
                key={presetId}
                type="button"
                onClick={() => onSelectCameraPreset(presetId)}
                className={`px-2.5 py-1 text-[11px] font-medium rounded-md whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  cameraPreset === presetId
                    ? 'bg-[#1F2633] text-amber-400'
                    : 'text-[#8B94A5] hover:text-[#D0D7E2]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Direct BVH & Multi-Clip GLB Export Triggers */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              type="button"
              onClick={onExportBvh}
              disabled={!hasTake}
              className={`px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-xs font-medium rounded-lg border flex items-center gap-1 whitespace-nowrap shrink-0 transition-colors ${
                hasTake
                  ? 'bg-[#181D27] border-[#2C3547] text-[#E2E8F0] hover:border-amber-500/60 hover:text-amber-300 cursor-pointer'
                  : 'bg-[#141820] border-[#1D2330] text-[#596273] cursor-not-allowed'
              }`}
            >
              <Download className="w-3.5 h-3.5" />
              <span className="sm:hidden">.BVH</span>
              <span className="hidden sm:inline">Export .BVH</span>
            </button>
            <button
              type="button"
              onClick={onExportGlb}
              disabled={!canExportGlb || isExporting}
              className={`px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-xs font-semibold rounded-lg flex items-center gap-1 whitespace-nowrap shrink-0 transition-colors ${
                canExportGlb && !isExporting
                  ? 'bg-amber-500 text-[#0B0D11] hover:bg-amber-400 cursor-pointer'
                  : 'bg-[#1B202B] text-[#596273] cursor-not-allowed'
              }`}
            >
              <Download className="w-3.5 h-3.5" />
              <span className="sm:hidden">
                {isExporting
                  ? '...'
                  : includedClipsCount > 1
                    ? `.GLB(${includedClipsCount})`
                    : '.GLB'}
              </span>
              <span className="hidden sm:inline">
                {isExporting
                  ? 'Packing GLB...'
                  : includedClipsCount > 1
                    ? `Export .GLB (${includedClipsCount})`
                    : 'Export .GLB'}
              </span>
            </button>
          </div>
        </div>

        {/* Tab 1: Capture & Timeline Controls */}
        {activeTab === 'capture' && (
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3">
              {/* Left: Mode Source Controls */}
              <div className="flex items-center gap-2 max-w-full overflow-x-auto scrollbar-none">
                {mode === 'lab' && (
                  <div className="flex items-center gap-1 p-1 bg-[#0B0D11] rounded-lg border border-[#1E2430] overflow-x-auto scrollbar-none max-w-full">
                    {DEMO_MOTIONS.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => onSelectDemoMotion(m.id)}
                        className={`px-2.5 py-1 text-[11px] sm:text-xs font-medium rounded-md whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                          demoMotion === m.id
                            ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                            : 'text-[#8B94A5] hover:text-[#E2E8F0]'
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                )}

                {(mode === 'live' || mode === 'face') && (
                  <>
                    <button
                      type="button"
                      onClick={onToggleCamera}
                      className={`px-3 sm:px-3.5 py-1.5 sm:py-2 text-[11px] sm:text-xs font-semibold rounded-lg flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                        cameraActive
                          ? 'bg-[#252C3B] text-[#F3F5F8] hover:bg-[#2F384A]'
                          : 'bg-amber-500 text-[#0B0D11] hover:bg-amber-400'
                      }`}
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>
                        {cameraActive
                          ? 'Stop Camera'
                          : mode === 'face'
                            ? 'Start Face Cam'
                            : 'Start Camera'}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateSettings({
                          mirrorCamera: !settings.mirrorCamera,
                        })
                      }
                      className={`px-2.5 sm:px-3 py-1.5 sm:py-2 text-[11px] sm:text-xs font-medium rounded-lg border whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                        settings.mirrorCamera
                          ? 'bg-[#1D2432] border-amber-500/40 text-amber-300'
                          : 'bg-[#141820] border-[#232A38] text-[#8B94A5]'
                      }`}
                    >
                      Mirror {settings.mirrorCamera ? 'On' : 'Off'}
                    </button>
                  </>
                )}

                {mode === 'video' && (
                  <>
                    <input
                      ref={videoInputRef}
                      type="file"
                      accept="video/mp4,video/webm,video/quicktime,video/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) onUploadVideo(file);
                        e.target.value = '';
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => videoInputRef.current?.click()}
                      className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-[#1F2633] text-[#F3F5F8] hover:bg-[#2A3344] border border-[#2C3547] flex items-center gap-2 whitespace-nowrap shrink-0 transition-colors cursor-pointer"
                    >
                      <Film className="w-3.5 h-3.5 text-amber-400" />
                      <span>{videoLoaded ? 'Replace Video' : 'Load Video'}</span>
                    </button>
                    {videoLoaded && (
                      <button
                        type="button"
                        onClick={onToggleVideoPlay}
                        className="px-3 py-2 text-xs font-medium rounded-lg bg-[#181D27] border border-[#283040] text-[#E2E8F0] hover:text-amber-300 flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        {videoPlaying ? (
                          <>
                            <Pause className="w-3.5 h-3.5" />
                            <span>Pause Video</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-3.5 h-3.5" />
                            <span>Play Video</span>
                          </>
                        )}
                      </button>
                    )}
                  </>
                )}

                {mode === 'bvh' && (
                  <button
                    type="button"
                    onClick={onToggleBvhPlay}
                    className="px-3.5 py-2 text-xs font-medium rounded-lg bg-[#181D27] border border-[#283040] text-[#E2E8F0] hover:text-amber-300 flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    {bvhPlaying ? (
                      <>
                        <Pause className="w-3.5 h-3.5" />
                        <span>Pause BVH</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5" />
                        <span>Play BVH</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Right: Live Smoothing Preset + Record Button */}
              {mode !== 'bvh' && (
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2.5 shrink-0 ml-auto">
                  <div
                    aria-label="Live motion smoothing"
                    className="flex items-center gap-0.5 sm:gap-1 p-0.5 sm:p-1 bg-[#0B0D11] rounded-lg border border-[#1E2430]"
                  >
                    <span className="px-1 sm:px-1.5 text-[10px] sm:text-[11px] text-[#8B94A5]">
                      Smooth
                    </span>
                    {(
                      [
                        [0, 'Raw'],
                        [0.3, 'Light'],
                        [0.55, 'Med'],
                        [0.85, 'High'],
                      ] as [number, string][]
                    ).map(([val, label]) => {
                      const active = Math.abs(settings.smoothing - val) < 0.12;
                      return (
                        <button
                          key={label}
                          type="button"
                          onClick={() => onUpdateSettings({ smoothing: val })}
                          className={`px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-[11px] font-medium rounded transition-colors cursor-pointer ${
                            active
                              ? 'bg-[#1F2633] text-amber-400'
                              : 'text-[#8B94A5] hover:text-[#E2E8F0]'
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>

                  <span className="text-[11px] sm:text-xs font-mono tabular-nums text-[#9BA4B5]">
                    {formatTimecode(recordedDuration)}
                    {' · '}
                    {recordedCount}f
                  </span>
                  <button
                    type="button"
                    onClick={onToggleRecord}
                    className={`px-3 sm:px-4 py-1.5 sm:py-2 text-[11px] sm:text-xs font-semibold rounded-lg flex items-center gap-1.5 sm:gap-2 whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                      countdownSec > 0
                        ? 'bg-amber-500 text-[#0B0D11] hover:bg-amber-400'
                        : isRecording
                          ? 'bg-red-600 text-white hover:bg-red-500'
                          : 'bg-[#1D2432] text-[#F3F5F8] border border-[#2E374A] hover:border-red-500/60'
                    }`}
                  >
                    {countdownSec > 0 ? (
                      <>
                        <Clock className="w-3 h-3" />
                        <span>In {Math.ceil(countdownSec)}s (Cancel)</span>
                      </>
                    ) : isRecording ? (
                      <>
                        <Square className="w-3 h-3 fill-current" />
                        <span>
                          Stop
                          {recordOptions.durationLimitSec > 0
                            ? ` (${remainingRecordSec.toFixed(1)}s)`
                            : ''}
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="w-2 h-2 rounded-full bg-red-500" />
                        <span>Record</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Recording Timer & Frame Sampling Strip */}
            {mode !== 'bvh' && (
              <div className="flex items-center gap-2 sm:gap-3 pt-1.5 border-t border-[#1A202B] overflow-x-auto scrollbar-none text-[11px]">
                <span className="text-[#7D8799] flex items-center gap-1 whitespace-nowrap shrink-0">
                  <Clock className="w-3 h-3 text-amber-400/80" />
                  <span>Rec Timing</span>
                </span>

                <label className="flex items-center gap-1.5 whitespace-nowrap shrink-0 text-[#9BA4B5]">
                  <span>Start in</span>
                  <select
                    value={recordOptions.startDelaySec}
                    onChange={(e) =>
                      onUpdateRecordOptions({
                        startDelaySec: Number(e.target.value),
                      })
                    }
                    aria-label="Start recording delay in seconds"
                    className="px-1.5 py-0.5 bg-[#0B0D11] border border-[#232A38] rounded text-[#E2E8F0] focus:outline-none focus:border-amber-500 cursor-pointer"
                  >
                    <option value={0}>Now (0s)</option>
                    <option value={3}>3 sec</option>
                    <option value={5}>5 sec</option>
                    <option value={10}>10 sec</option>
                  </select>
                </label>

                <label className="flex items-center gap-1.5 whitespace-nowrap shrink-0 text-[#9BA4B5]">
                  <span>Interval</span>
                  <select
                    value={recordOptions.durationLimitSec}
                    onChange={(e) =>
                      onUpdateRecordOptions({
                        durationLimitSec: Number(e.target.value),
                      })
                    }
                    aria-label="Recording interval duration"
                    className="px-1.5 py-0.5 bg-[#0B0D11] border border-[#232A38] rounded text-[#E2E8F0] focus:outline-none focus:border-amber-500 cursor-pointer"
                  >
                    <option value={0}>Manual (∞)</option>
                    <option value={3}>3 sec</option>
                    <option value={5}>5 sec</option>
                    <option value={10}>10 sec</option>
                    <option value={15}>15 sec</option>
                    <option value={30}>30 sec</option>
                  </select>
                </label>

                <label className="flex items-center gap-1.5 whitespace-nowrap shrink-0 text-[#9BA4B5]">
                  <span>Frame Step</span>
                  <select
                    value={recordOptions.frameSkip}
                    onChange={(e) =>
                      onUpdateRecordOptions({
                        frameSkip: Number(e.target.value),
                      })
                    }
                    aria-label="Skip frames during recording"
                    className="px-1.5 py-0.5 bg-[#0B0D11] border border-[#232A38] rounded text-[#E2E8F0] focus:outline-none focus:border-amber-500 cursor-pointer"
                  >
                    <option value={1}>Keep All (1x)</option>
                    <option value={2}>Skip 1 (Every 2nd)</option>
                    <option value={3}>Skip 2 (Every 3rd)</option>
                    <option value={4}>Skip 3 (Every 4th)</option>
                    <option value={6}>Skip 5 (Every 6th)</option>
                  </select>
                </label>
              </div>
            )}

            {/* Recorded Take Scrubber Bar */}
            {hasTake && mode !== 'bvh' && (
              <div className="flex items-center gap-2 sm:gap-2.5 pt-1.5 border-t border-[#1C222E]">
                <button
                  type="button"
                  onClick={onTogglePlayTake}
                  className="px-2.5 py-1.5 text-[11px] sm:text-xs font-medium rounded-md bg-[#1B212E] text-[#E2E8F0] hover:text-amber-400 flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {isPlayingTake ? (
                    <>
                      <Pause className="w-3.5 h-3.5" />
                      <span>Live</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5" />
                      <span>Review</span>
                    </>
                  )}
                </button>

                <input
                  type="range"
                  min={0}
                  max={Math.max(0, recordedCount - 1)}
                  value={Math.min(playbackFrameIdx, Math.max(0, recordedCount - 1))}
                  onChange={(e) => onScrubTake(Number(e.target.value))}
                  aria-label="Timeline frame scrubber"
                  className="studio-slider flex-1 min-w-[50px]"
                />

                <span className="hidden sm:inline text-[11px] font-mono tabular-nums text-[#8B94A5] whitespace-nowrap shrink-0">
                  {playbackFrameIdx + 1}/{recordedCount}
                </span>

                <button
                  type="button"
                  onClick={onSmoothTake}
                  title="Apply zero-phase temporal smoothing pass to recorded take"
                  className="px-2 py-1 text-[11px] font-medium rounded-md bg-[#181D27] border border-[#2C3547] text-[#E2E8F0] hover:border-amber-500/60 hover:text-amber-300 whitespace-nowrap shrink-0 cursor-pointer transition-colors"
                >
                  Smooth
                </button>

                <button
                  type="button"
                  onClick={onSaveCurrentClip}
                  title="Add current take to Multi-Animation GLB Clips list"
                  className="px-2 py-1 text-[11px] font-semibold rounded-md bg-amber-500/15 border border-amber-500/40 text-amber-300 hover:bg-amber-500/25 flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Clip</span>
                </button>

                <button
                  type="button"
                  onClick={onClearTake}
                  aria-label="Clear recorded take"
                  className="p-1.5 text-[#8B94A5] hover:text-red-400 rounded-md transition-colors cursor-pointer shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Multi-Animation Clips Bank for GLB Export */}
        {activeTab === 'clips' && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="text-[#9BA4B5]">
                Pack multiple animation clips into one <code className="text-amber-400">.glb</code> file
              </span>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={onSaveCurrentClip}
                  disabled={!hasTake}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded-md border flex items-center gap-1 transition-colors ${
                    hasTake
                      ? 'bg-[#181D27] border-[#2C3547] text-[#E2E8F0] hover:border-amber-500/60 hover:text-amber-300 cursor-pointer'
                      : 'bg-[#141820] border-[#1D2330] text-[#596273] cursor-not-allowed'
                  }`}
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Current Take</span>
                </button>
              </div>
            </div>

            {savedClips.length === 0 ? (
              <div className="py-4 px-3 rounded-lg bg-[#0B0D11] border border-[#1E2430] text-center text-xs text-[#7D8799]">
                No saved clips yet. Record a motion and click <span className="text-amber-400">+ Add Clip</span> to queue multiple animations for GLB export.
              </div>
            ) : (
              <div className="max-h-[128px] overflow-y-auto flex flex-col gap-1.5 pr-1">
                {savedClips.map((clip) => {
                  const dur =
                    clip.frames.length > 1
                      ? clip.frames[clip.frames.length - 1].time - clip.frames[0].time
                      : 0;
                  return (
                    <div
                      key={clip.id}
                      className="px-2.5 py-1.5 rounded-lg bg-[#0B0D11] border border-[#1E2430] flex items-center justify-between gap-2"
                    >
                      <button
                        type="button"
                        onClick={() => onToggleClipIncluded(clip.id)}
                        aria-label={`Include ${clip.name} in GLB export`}
                        className={`p-0.5 rounded cursor-pointer shrink-0 ${
                          clip.included ? 'text-amber-400' : 'text-[#525B6E]'
                        }`}
                      >
                        <CheckSquare className="w-4 h-4" />
                      </button>

                      <input
                        type="text"
                        value={clip.name}
                        onChange={(e) => onRenameClip(clip.id, e.target.value)}
                        aria-label="Animation clip name"
                        className="flex-1 min-w-[90px] px-2 py-0.5 text-xs bg-[#141821] border border-[#232A38] rounded text-[#E2E8F0] focus:outline-none focus:border-amber-500"
                      />

                      <span className="text-[11px] font-mono tabular-nums text-[#8B94A5] whitespace-nowrap shrink-0">
                        {dur.toFixed(2)}s · {clip.frames.length}f
                      </span>

                      <button
                        type="button"
                        onClick={() => onLoadClip(clip.id)}
                        className="px-2 py-1 text-[11px] font-medium rounded bg-[#181D27] border border-[#283040] text-[#D0D7E2] hover:text-amber-300 whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        Load
                      </button>

                      <button
                        type="button"
                        onClick={() => onDeleteClip(clip.id)}
                        aria-label={`Delete ${clip.name}`}
                        className="p-1 text-[#7D8799] hover:text-red-400 cursor-pointer shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Mixamo Rig & Export Configuration */}
        {activeTab === 'rig' && (
          <div className="flex flex-wrap items-center justify-between gap-x-5 gap-y-2.5">
            {/* Smoothing 1-Euro Slider */}
            <div className="flex items-center gap-2.5 min-w-[180px]">
              <label
                htmlFor="smoothing-slider"
                className="text-xs text-[#9BA4B5] whitespace-nowrap"
              >
                Smoothing
              </label>
              <input
                id="smoothing-slider"
                type="range"
                min={0}
                max={0.95}
                step={0.05}
                value={settings.smoothing}
                onChange={(e) =>
                  onUpdateSettings({ smoothing: Number(e.target.value) })
                }
                className="studio-slider w-24"
              />
              <span className="text-[11px] font-mono tabular-nums text-[#D0D7E2] w-8">
                {settings.smoothing.toFixed(2)}
              </span>
            </div>

            {/* FPS Selector */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-[#9BA4B5]">FPS</span>
              <div className="flex items-center p-0.5 bg-[#0B0D11] rounded-md border border-[#1E2430]">
                {([24, 30, 60] as const).map((fps) => (
                  <button
                    key={fps}
                    type="button"
                    onClick={() => onUpdateSettings({ fps })}
                    className={`px-2 py-1 text-[11px] font-mono rounded transition-colors cursor-pointer ${
                      settings.fps === fps
                        ? 'bg-[#1F2633] text-amber-400'
                        : 'text-[#8B94A5] hover:text-[#D0D7E2]'
                    }`}
                  >
                    {fps}
                  </button>
                ))}
              </div>
            </div>

            {/* Mixamo Bone Naming Scheme */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-[#9BA4B5]">Bones</span>
              <select
                value={settings.namingScheme}
                onChange={(e) =>
                  onUpdateSettings({
                    namingScheme: e.target.value as BoneNamingScheme,
                  })
                }
                aria-label="Bone naming convention"
                className="px-2 py-1 text-xs bg-[#0B0D11] border border-[#232A38] rounded-md text-[#E2E8F0] focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                <option value="mixamo-colon">mixamorig:Hips</option>
                <option value="mixamo-clean">mixamorigHips</option>
                <option value="bvh-standard">Hips (Standard)</option>
              </select>
            </div>

            {/* Kinematic & Visual Toggles */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() =>
                  onUpdateSettings({ rootMotion: !settings.rootMotion })
                }
                className={`px-2.5 py-1 text-xs rounded-md border whitespace-nowrap transition-colors cursor-pointer ${
                  settings.rootMotion
                    ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                    : 'bg-[#0B0D11] border-[#232A38] text-[#8B94A5]'
                }`}
              >
                Root XZ
              </button>
              <button
                type="button"
                onClick={() =>
                  onUpdateSettings({ footGrounding: !settings.footGrounding })
                }
                className={`px-2.5 py-1 text-xs rounded-md border whitespace-nowrap transition-colors cursor-pointer ${
                  settings.footGrounding
                    ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                    : 'bg-[#0B0D11] border-[#232A38] text-[#8B94A5]'
                }`}
              >
                Foot Ground
              </button>
              <button
                type="button"
                onClick={() =>
                  onUpdateSettings({ showSkeleton: !settings.showSkeleton })
                }
                className={`px-2.5 py-1 text-xs rounded-md border whitespace-nowrap transition-colors cursor-pointer ${
                  settings.showSkeleton
                    ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                    : 'bg-[#0B0D11] border-[#232A38] text-[#8B94A5]'
                }`}
              >
                Bones Overlay
              </button>
              <button
                type="button"
                onClick={() =>
                  onUpdateSettings({
                    includeMeshInGlb: !settings.includeMeshInGlb,
                  })
                }
                className={`px-2.5 py-1 text-xs rounded-md border whitespace-nowrap transition-colors cursor-pointer ${
                  settings.includeMeshInGlb
                    ? 'bg-[#1F2633] border-[#334056] text-[#E2E8F0]'
                    : 'bg-[#0B0D11] border-[#232A38] text-[#8B94A5]'
                }`}
              >
                GLB: {settings.includeMeshInGlb ? 'Mesh + Anim' : 'Rig Only'}
              </button>
            </div>

            {/* Custom Mixamo GLB Character Loader */}
            <div className="flex items-center gap-1.5">
              <input
                ref={glbInputRef}
                type="file"
                accept=".glb,.gltf"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) onUploadMixamoGlb(file);
                  e.target.value = '';
                }}
              />
              <button
                type="button"
                onClick={() => glbInputRef.current?.click()}
                className="px-2.5 py-1 text-xs font-medium rounded-md bg-[#181D27] border border-[#2C3547] text-[#E2E8F0] hover:border-amber-500/60 flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
              >
                <Upload className="w-3 h-3 text-amber-400" />
                <span>
                  {customRigLabel
                    ? `Rig: ${customRigLabel.slice(0, 14)}`
                    : 'Load Mixamo GLB'}
                </span>
              </button>
              {customRigLabel && (
                <button
                  type="button"
                  onClick={onResetDefaultRig}
                  title="Reset to built-in Mixamo Mannequin"
                  className="p-1.5 rounded-md bg-[#181D27] border border-[#2C3547] text-[#8B94A5] hover:text-[#F3F5F8] cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
