import React from 'react';
import {
  MousePointerClick,
  Paintbrush,
  Sparkles,
  Move,
  Eraser,
  RotateCw,
  Maximize2,
  Grid3x3,
  ChevronDown,
  ChevronUp,
  Pause,
  Play,
} from 'lucide-react';
import { CameraPreset, DrawMode, GizmoMode, SnapStep } from '../types/volume';

interface ToolDockProps {
  drawMode: DrawMode;
  gizmoMode: GizmoMode;
  snapStep: SnapStep;
  showGrid: boolean;
  collapsed: boolean;
  hoverDrawPaused: boolean;
  onChangeDrawMode: (mode: DrawMode) => void;
  onChangeGizmoMode: (mode: GizmoMode) => void;
  onChangeSnapStep: (step: SnapStep) => void;
  onToggleGrid: () => void;
  onSelectCameraPreset: (preset: CameraPreset) => void;
  onToggleCollapse: () => void;
  onToggleHoverPause: () => void;
}

const DRAW_MODES: Array<{ id: DrawMode; label: string; hint: string; icon: React.ReactNode }> = [
  {
    id: 'click',
    label: 'Click',
    hint: 'Click ground or cube face to place',
    icon: <MousePointerClick className="h-3.5 w-3.5" />,
  },
  {
    id: 'drag',
    label: 'Drag',
    hint: 'Hold & move to paint cubes',
    icon: <Paintbrush className="h-3.5 w-3.5" />,
  },
  {
    id: 'hover',
    label: 'Move',
    hint: 'Move pointer over grid to paint (Space to pause)',
    icon: <Sparkles className="h-3.5 w-3.5" />,
  },
  {
    id: 'select',
    label: 'Transform',
    hint: 'Tap/click cube to select & move/rotate/scale',
    icon: <Move className="h-3.5 w-3.5" />,
  },
  {
    id: 'erase',
    label: 'Erase',
    hint: 'Tap/click cube to remove',
    icon: <Eraser className="h-3.5 w-3.5" />,
  },
];

const SNAP_STEPS: Array<{ value: SnapStep; label: string }> = [
  { value: 0, label: 'Free' },
  { value: 0.25, label: '0.25' },
  { value: 0.5, label: '0.5' },
  { value: 1, label: '1' },
  { value: 2, label: '2' },
];

const CAMERA_PRESETS: Array<{ id: CameraPreset; label: string }> = [
  { id: 'perspective', label: 'Persp' },
  { id: 'top', label: 'Top' },
  { id: 'front', label: 'Front' },
  { id: 'iso', label: 'Iso' },
];

export const ToolDock: React.FC<ToolDockProps> = ({
  drawMode,
  gizmoMode,
  snapStep,
  showGrid,
  collapsed,
  hoverDrawPaused,
  onChangeDrawMode,
  onChangeGizmoMode,
  onChangeSnapStep,
  onToggleGrid,
  onSelectCameraPreset,
  onToggleCollapse,
  onToggleHoverPause,
}) => {
  return (
    <div
      className="pointer-events-none fixed bottom-2 sm:bottom-4 left-1/2 z-20 flex w-[calc(100vw-16px)] sm:w-auto flex-col items-center transition-transform duration-200 ease-out"
      style={{
        transform: collapsed ? 'translate(-50%, calc(100% - 26px))' : 'translate(-50%, 0)',
        maxWidth: 'min(980px, calc(100vw - 16px))',
      }}
    >
      {/* Collapse Handle */}
      <button
        type="button"
        onClick={onToggleCollapse}
        className="pointer-events-auto inline-flex items-center gap-1.5 rounded-t-md border border-b-0 border-lime-400/20 bg-[#151922]/95 px-3 py-1 text-[11px] font-medium text-lime-300 hover:text-lime-200 cursor-pointer whitespace-nowrap"
      >
        {collapsed ? (
          <>
            <ChevronUp className="h-3 w-3" />
            <span>Show Controls</span>
          </>
        ) : (
          <>
            <ChevronDown className="h-3 w-3" />
            <span>Hide Controls</span>
          </>
        )}
      </button>

      {/* Main Unified Dock (horizontally scrollable single row on mobile) */}
      <div className="pointer-events-auto flex w-full sm:w-auto flex-nowrap sm:flex-wrap items-center justify-start sm:justify-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar rounded-lg border border-lime-400/20 bg-[#151922]/95 p-1.5 sm:p-2 shadow-2xl">
        {/* Draw & Tool Mode */}
        <div className="flex items-center gap-1 rounded-md bg-[#0e1015] p-1 shrink-0">
          {DRAW_MODES.map((m) => {
            const active = drawMode === m.id;
            return (
              <button
                key={m.id}
                type="button"
                title={m.hint}
                onClick={() => onChangeDrawMode(m.id)}
                className={`inline-flex min-h-[38px] sm:min-h-[32px] items-center gap-1.5 rounded px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  active
                    ? m.id === 'erase'
                      ? 'bg-rose-500/25 text-rose-200'
                      : 'bg-lime-400 text-slate-950 font-semibold'
                    : 'text-lime-300 hover:bg-lime-400/10 hover:text-lime-200'
                }`}
              >
                {m.icon}
                <span>{m.label}</span>
              </button>
            );
          })}
        </div>

        {/* Pause / Resume toggle when Move Draw is active */}
        {drawMode === 'hover' && (
          <button
            type="button"
            onClick={onToggleHoverPause}
            title="Pause/Resume Move Draw (Space)"
            className={`inline-flex min-h-[38px] sm:min-h-[32px] items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              hoverDrawPaused
                ? 'border-amber-400/40 bg-amber-500/15 text-amber-200'
                : 'border-lime-400/40 bg-lime-400/15 text-lime-200'
            }`}
          >
            {hoverDrawPaused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
            <span>{hoverDrawPaused ? 'Paused' : 'Drawing'}</span>
          </button>
        )}

        {/* Gizmo mode when Transform/Select is active */}
        {drawMode === 'select' && (
          <div className="flex items-center gap-1 rounded-md bg-[#0e1015] p-1 shrink-0">
            <button
              type="button"
              onClick={() => onChangeGizmoMode('translate')}
              title="Move (G)"
              className={`inline-flex min-h-[38px] sm:min-h-[32px] items-center gap-1 rounded px-2.5 py-1.5 text-xs font-medium whitespace-nowrap shrink-0 cursor-pointer ${
                gizmoMode === 'translate'
                  ? 'bg-lime-400/20 text-lime-200'
                  : 'text-lime-400/75 hover:text-lime-200'
              }`}
            >
              <Move className="h-3.5 w-3.5" />
              <span>Move</span>
            </button>
            <button
              type="button"
              onClick={() => onChangeGizmoMode('rotate')}
              title="Rotate (R)"
              className={`inline-flex min-h-[38px] sm:min-h-[32px] items-center gap-1 rounded px-2.5 py-1.5 text-xs font-medium whitespace-nowrap shrink-0 cursor-pointer ${
                gizmoMode === 'rotate'
                  ? 'bg-lime-400/20 text-lime-200'
                  : 'text-lime-400/75 hover:text-lime-200'
              }`}
            >
              <RotateCw className="h-3.5 w-3.5" />
              <span>Rotate</span>
            </button>
            <button
              type="button"
              onClick={() => onChangeGizmoMode('scale')}
              title="Scale (S)"
              className={`inline-flex min-h-[38px] sm:min-h-[32px] items-center gap-1 rounded px-2.5 py-1.5 text-xs font-medium whitespace-nowrap shrink-0 cursor-pointer ${
                gizmoMode === 'scale'
                  ? 'bg-lime-400/20 text-lime-200'
                  : 'text-lime-400/75 hover:text-lime-200'
              }`}
            >
              <Maximize2 className="h-3.5 w-3.5" />
              <span>Scale</span>
            </button>
          </div>
        )}

        {/* Grid & Snap Step */}
        <div className="flex items-center gap-1 rounded-md bg-[#0e1015] p-1 shrink-0">
          <button
            type="button"
            onClick={onToggleGrid}
            title="Toggle Ground Grid"
            className={`inline-flex min-h-[38px] sm:min-h-[32px] items-center gap-1 rounded px-2.5 py-1.5 text-xs font-medium whitespace-nowrap shrink-0 cursor-pointer ${
              showGrid ? 'bg-lime-400/15 text-lime-200' : 'text-lime-400/60 hover:text-lime-200'
            }`}
          >
            <Grid3x3 className="h-3.5 w-3.5" />
            <span>Grid</span>
          </button>
          <span className="px-1 text-[11px] text-lime-400/70 whitespace-nowrap">Snap</span>
          {SNAP_STEPS.map((s) => (
            <button
              key={s.label}
              type="button"
              onClick={() => onChangeSnapStep(s.value)}
              className={`min-h-[38px] sm:min-h-[32px] rounded px-2 py-1.5 text-xs font-mono-tabular transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                snapStep === s.value
                  ? 'bg-lime-400/20 text-lime-200 font-semibold'
                  : 'text-lime-400/70 hover:text-lime-200'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Camera Presets */}
        <div className="flex items-center gap-1 rounded-md bg-[#0e1015] p-1 shrink-0">
          {CAMERA_PRESETS.map((cam) => (
            <button
              key={cam.id}
              type="button"
              onClick={() => onSelectCameraPreset(cam.id)}
              className="min-h-[38px] sm:min-h-[32px] rounded px-2.5 py-1.5 text-xs font-medium text-lime-300 transition-colors hover:bg-lime-400/12 hover:text-lime-200 whitespace-nowrap shrink-0 cursor-pointer"
            >
              {cam.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
