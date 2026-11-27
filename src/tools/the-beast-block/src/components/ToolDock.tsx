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
      className="pointer-events-none fixed bottom-1.5 sm:bottom-2 left-1/2 z-20 flex w-[calc(100vw-12px)] sm:w-auto flex-col items-center transition-transform duration-200 ease-out"
      style={{
        transform: collapsed ? 'translate(-50%, calc(100% - 22px))' : 'translate(-50%, 0)',
        maxWidth: 'min(900px, calc(100vw - 12px))',
      }}
    >
      {/* Collapse Handle */}
      <button
        type="button"
        onClick={onToggleCollapse}
        className="pointer-events-auto inline-flex items-center gap-1 rounded-t border border-b-0 border-[#00ff00]/25 bg-[#151922]/95 px-2.5 py-0.5 text-[10px] font-medium text-[#00ff00] hover:bg-[#00ff00]/10 cursor-pointer whitespace-nowrap"
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
      <div className="pointer-events-auto flex w-full sm:w-auto flex-nowrap sm:flex-wrap items-center justify-start sm:justify-center gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar rounded-md border border-[#00ff00]/25 bg-[#151922]/95 p-1 shadow-2xl">
        {/* Draw & Tool Mode */}
        <div className="flex items-center gap-0.5 rounded bg-[#0e1015] p-0.5 shrink-0">
          {DRAW_MODES.map((m) => {
            const active = drawMode === m.id;
            return (
              <button
                key={m.id}
                type="button"
                title={m.hint}
                onClick={() => onChangeDrawMode(m.id)}
                className={`inline-flex min-h-[30px] sm:min-h-[26px] items-center gap-1 rounded px-2 py-1 text-[11px] font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  active
                    ? m.id === 'erase'
                      ? 'bg-rose-500/25 text-rose-200'
                      : 'bg-[#00ff00] text-black font-bold'
                    : 'text-[#00ff00] hover:bg-[#00ff00]/15'
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
            className={`inline-flex min-h-[30px] sm:min-h-[26px] items-center gap-1 rounded border px-2 py-1 text-[11px] font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              hoverDrawPaused
                ? 'border-amber-400/50 bg-amber-500/15 text-amber-200'
                : 'border-[#00ff00]/50 bg-[#00ff00]/15 text-[#00ff00]'
            }`}
          >
            {hoverDrawPaused ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
            <span>{hoverDrawPaused ? 'Paused' : 'Drawing'}</span>
          </button>
        )}

        {/* Gizmo mode when Transform/Select is active */}
        {drawMode === 'select' && (
          <div className="flex items-center gap-0.5 rounded bg-[#0e1015] p-0.5 shrink-0">
            <button
              type="button"
              onClick={() => onChangeGizmoMode('translate')}
              title="Move (G)"
              className={`inline-flex min-h-[30px] sm:min-h-[26px] items-center gap-1 rounded px-2 py-1 text-[11px] font-medium whitespace-nowrap shrink-0 cursor-pointer ${
                gizmoMode === 'translate'
                  ? 'bg-[#00ff00]/25 text-[#00ff00]'
                  : 'text-[#00ff00]/75 hover:text-[#00ff00]'
              }`}
            >
              <Move className="h-3 w-3" />
              <span>Move</span>
            </button>
            <button
              type="button"
              onClick={() => onChangeGizmoMode('rotate')}
              title="Rotate (R)"
              className={`inline-flex min-h-[30px] sm:min-h-[26px] items-center gap-1 rounded px-2 py-1 text-[11px] font-medium whitespace-nowrap shrink-0 cursor-pointer ${
                gizmoMode === 'rotate'
                  ? 'bg-[#00ff00]/25 text-[#00ff00]'
                  : 'text-[#00ff00]/75 hover:text-[#00ff00]'
              }`}
            >
              <RotateCw className="h-3 w-3" />
              <span>Rotate</span>
            </button>
            <button
              type="button"
              onClick={() => onChangeGizmoMode('scale')}
              title="Scale (S)"
              className={`inline-flex min-h-[30px] sm:min-h-[26px] items-center gap-1 rounded px-2 py-1 text-[11px] font-medium whitespace-nowrap shrink-0 cursor-pointer ${
                gizmoMode === 'scale'
                  ? 'bg-[#00ff00]/25 text-[#00ff00]'
                  : 'text-[#00ff00]/75 hover:text-[#00ff00]'
              }`}
            >
              <Maximize2 className="h-3 w-3" />
              <span>Scale</span>
            </button>
          </div>
        )}

        {/* Grid & Snap Step */}
        <div className="flex items-center gap-0.5 rounded bg-[#0e1015] p-0.5 shrink-0">
          <button
            type="button"
            onClick={onToggleGrid}
            title="Toggle Ground Grid"
            className={`inline-flex min-h-[30px] sm:min-h-[26px] items-center gap-1 rounded px-2 py-1 text-[11px] font-medium whitespace-nowrap shrink-0 cursor-pointer ${
              showGrid ? 'bg-[#00ff00]/20 text-[#00ff00]' : 'text-[#00ff00]/55 hover:text-[#00ff00]'
            }`}
          >
            <Grid3x3 className="h-3 w-3" />
            <span>Grid</span>
          </button>
          <span className="px-1 text-[10px] text-[#00ff00]/70 whitespace-nowrap">Snap</span>
          {SNAP_STEPS.map((s) => (
            <button
              key={s.label}
              type="button"
              onClick={() => onChangeSnapStep(s.value)}
              className={`min-h-[30px] sm:min-h-[26px] rounded px-1.5 py-1 text-[11px] font-mono-tabular transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                snapStep === s.value
                  ? 'bg-[#00ff00]/25 text-[#00ff00] font-semibold'
                  : 'text-[#00ff00]/70 hover:text-[#00ff00]'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Camera Presets */}
        <div className="flex items-center gap-0.5 rounded bg-[#0e1015] p-0.5 shrink-0">
          {CAMERA_PRESETS.map((cam) => (
            <button
              key={cam.id}
              type="button"
              onClick={() => onSelectCameraPreset(cam.id)}
              className="min-h-[30px] sm:min-h-[26px] rounded px-2 py-1 text-[11px] font-medium text-[#00ff00] transition-colors hover:bg-[#00ff00]/15 whitespace-nowrap shrink-0 cursor-pointer"
            >
              {cam.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
