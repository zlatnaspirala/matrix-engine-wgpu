import React, { useEffect, useState } from 'react';
import {
  Sliders,
  Box,
  History,
  Copy,
  Trash2,
  RotateCcw,
  Undo2,
  Redo2,
  Plus,
  Move,
  X,
} from 'lucide-react';
import {
  BlockingVolume,
  HistoryAction,
  PlacementConfig,
  Vec3,
  VolumeCategory,
  VolumeTransform,
} from '../types/volume';
import { CATEGORY_META, roundVec3 } from '../utils/snap';

type InspectorTab = 'config' | 'selected' | 'history';

interface InspectorPanelProps {
  open: boolean;
  activeTab: InspectorTab;
  placementConfig: PlacementConfig;
  selectedVolume: BlockingVolume | null;
  undoStack: HistoryAction[];
  redoStack: HistoryAction[];
  onChangeTab: (tab: InspectorTab) => void;
  onChangeConfig: (next: PlacementConfig) => void;
  onUpdateSelectedTransform: (
    id: string,
    before: VolumeTransform,
    after: VolumeTransform
  ) => void;
  onUpdateSelectedCategory: (id: string, before: VolumeCategory, after: VolumeCategory) => void;
  onDuplicateSelected: (vol: BlockingVolume) => void;
  onDeleteSelected: (id: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  onCloseMobile: () => void;
}

interface Vec3InputsProps {
  label: string;
  value: Vec3;
  step: number;
  min?: number;
  onCommit: (next: Vec3) => void;
}

const AXIS_LABELS = ['X', 'Y', 'Z'] as const;
const AXIS_COLORS = ['text-rose-400', 'text-lime-400', 'text-sky-400'] as const;

const Vec3Inputs: React.FC<Vec3InputsProps> = ({ label, value, step, min, onCommit }) => {
  const [draft, setDraft] = useState<[string, string, string]>([
    String(value[0]),
    String(value[1]),
    String(value[2]),
  ]);

  useEffect(() => {
    setDraft([String(value[0]), String(value[1]), String(value[2])]);
  }, [value[0], value[1], value[2]]);

  const commitIdx = (idx: 0 | 1 | 2, raw: string) => {
    const parsed = parseFloat(raw);
    if (Number.isNaN(parsed)) {
      setDraft([String(value[0]), String(value[1]), String(value[2])]);
      return;
    }
    const clamped = min !== undefined ? Math.max(min, parsed) : parsed;
    const next: Vec3 = [value[0], value[1], value[2]];
    next[idx] = clamped;
    onCommit(roundVec3(next, 3));
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-lime-300">{label}</span>
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        {AXIS_LABELS.map((axis, idx) => {
          const i = idx as 0 | 1 | 2;
          return (
            <label
              key={axis}
              className="flex items-center gap-1 rounded border border-lime-400/15 bg-[#0e1015] px-2 py-2 sm:py-1 focus-within:border-lime-400/75"
            >
              <span className={`text-[11px] font-semibold ${AXIS_COLORS[i]}`}>{axis}</span>
              <input
                type="number"
                inputMode="decimal"
                step={step}
                min={min}
                value={draft[i]}
                onChange={(e) => {
                  const nextDraft: [string, string, string] = [...draft];
                  nextDraft[i] = e.target.value;
                  setDraft(nextDraft);
                }}
                onBlur={() => commitIdx(i, draft[i])}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    commitIdx(i, draft[i]);
                    (e.target as HTMLInputElement).blur();
                  }
                }}
                className="w-full min-w-0 bg-transparent text-right text-xs font-mono-tabular text-lime-200 outline-none"
              />
            </label>
          );
        })}
      </div>
    </div>
  );
};

const QUICK_SIZE_PRESETS: Array<{ label: string; scale: Vec3 }> = [
  { label: 'Unit (-1..1)', scale: [1, 1, 1] },
  { label: 'Half (0.5)', scale: [0.5, 0.5, 0.5] },
  { label: 'Wall', scale: [2, 1.5, 0.35] },
  { label: 'Floor Slab', scale: [3, 0.25, 3] },
  { label: 'Pillar', scale: [0.5, 2, 0.5] },
];

function formatActionSummary(action: HistoryAction): {
  kind: string;
  detail: string;
  badgeColor: string;
} {
  if (action.type === 'place') {
    return {
      kind: 'Placement',
      detail: action.label,
      badgeColor: 'text-lime-300',
    };
  }
  if (action.type === 'transform') {
    return {
      kind: 'Transform',
      detail: action.label,
      badgeColor: 'text-amber-300',
    };
  }
  if (action.type === 'delete') {
    return {
      kind: 'Deletion',
      detail: action.label,
      badgeColor: 'text-rose-300',
    };
  }
  if (action.type === 'category') {
    return {
      kind: 'Category',
      detail: action.label,
      badgeColor: 'text-sky-300',
    };
  }
  return {
    kind: 'Map',
    detail: action.label,
    badgeColor: 'text-lime-200',
  };
}

export const InspectorPanel: React.FC<InspectorPanelProps> = ({
  open,
  activeTab,
  placementConfig,
  selectedVolume,
  undoStack,
  redoStack,
  onChangeTab,
  onChangeConfig,
  onUpdateSelectedTransform,
  onUpdateSelectedCategory,
  onDuplicateSelected,
  onDeleteSelected,
  onUndo,
  onRedo,
  onCloseMobile,
}) => {
  if (!open) return null;

  const categories = Object.keys(CATEGORY_META) as VolumeCategory[];

  return (
    <aside className="pointer-events-auto fixed inset-x-2 bottom-20 z-30 flex max-h-[54vh] flex-col rounded-lg border border-lime-400/20 bg-[#151922]/96 shadow-2xl sm:inset-x-auto sm:bottom-auto sm:right-4 sm:top-16 sm:z-20 sm:max-h-[calc(100vh-140px)] sm:w-80">
      {/* Tabs + Mobile Close */}
      <div className="flex items-center border-b border-lime-400/15 p-1 gap-1">
        <div className="grid flex-1 grid-cols-3 gap-0.5">
          <button
            type="button"
            onClick={() => onChangeTab('config')}
            className={`flex min-h-[36px] sm:min-h-[30px] items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-medium transition-colors cursor-pointer ${
              activeTab === 'config'
                ? 'bg-lime-400/20 text-lime-200'
                : 'text-lime-400/75 hover:text-lime-200'
            }`}
          >
            <Sliders className="h-3.5 w-3.5" />
            <span>Brush</span>
          </button>

          <button
            type="button"
            onClick={() => onChangeTab('selected')}
            className={`flex min-h-[36px] sm:min-h-[30px] items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-medium transition-colors cursor-pointer ${
              activeTab === 'selected'
                ? 'bg-lime-400/20 text-lime-200'
                : 'text-lime-400/75 hover:text-lime-200'
            }`}
          >
            <Box className="h-3.5 w-3.5" />
            <span>Selected</span>
          </button>

          <button
            type="button"
            onClick={() => onChangeTab('history')}
            className={`flex min-h-[36px] sm:min-h-[30px] items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-medium transition-colors cursor-pointer ${
              activeTab === 'history'
                ? 'bg-lime-400/20 text-lime-200'
                : 'text-lime-400/75 hover:text-lime-200'
            }`}
          >
            <History className="h-3.5 w-3.5" />
            <span>History ({undoStack.length})</span>
          </button>
        </div>

        <button
          type="button"
          onClick={onCloseMobile}
          aria-label="Close inspector"
          className="sm:hidden flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-lime-300 hover:bg-lime-400/15 cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-4">
        {activeTab === 'config' && (
          <>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xs font-semibold text-lime-200">Placement Transform</h2>
                <p className="text-[11px] text-lime-400/75">
                  Applied to every new -1..+1 unit cube
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  onChangeConfig({
                    positionOffset: [0, 0, 0],
                    rotation: [0, 0, 0],
                    scale: [1, 1, 1],
                    category: placementConfig.category,
                  })
                }
                title="Reset brush config"
                className="rounded p-2 sm:p-1.5 text-lime-400/80 hover:bg-lime-400/10 hover:text-lime-200 cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            </div>

            <Vec3Inputs
              label="Position Offset"
              value={placementConfig.positionOffset}
              step={0.25}
              onCommit={(positionOffset) =>
                onChangeConfig({ ...placementConfig, positionOffset })
              }
            />

            <Vec3Inputs
              label="Rotation (deg)"
              value={placementConfig.rotation}
              step={15}
              onCommit={(rotation) => onChangeConfig({ ...placementConfig, rotation })}
            />

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() =>
                  onChangeConfig({
                    ...placementConfig,
                    rotation: [
                      placementConfig.rotation[0],
                      (placementConfig.rotation[1] + 45) % 360,
                      placementConfig.rotation[2],
                    ],
                  })
                }
                className="flex-1 min-h-[36px] sm:min-h-[28px] rounded border border-lime-400/15 bg-[#0e1015] py-1 text-[11px] font-medium text-lime-300 hover:border-lime-400/40 hover:text-lime-200 cursor-pointer"
              >
                +45° Yaw
              </button>
              <button
                type="button"
                onClick={() =>
                  onChangeConfig({
                    ...placementConfig,
                    rotation: [
                      placementConfig.rotation[0],
                      (placementConfig.rotation[1] + 90) % 360,
                      placementConfig.rotation[2],
                    ],
                  })
                }
                className="flex-1 min-h-[36px] sm:min-h-[28px] rounded border border-lime-400/15 bg-[#0e1015] py-1 text-[11px] font-medium text-lime-300 hover:border-lime-400/40 hover:text-lime-200 cursor-pointer"
              >
                +90° Yaw
              </button>
            </div>

            <Vec3Inputs
              label="Scale (half-extents)"
              value={placementConfig.scale}
              step={0.25}
              min={0.05}
              onCommit={(scale) => onChangeConfig({ ...placementConfig, scale })}
            />

            <div className="space-y-1.5 pt-1">
              <span className="text-xs font-medium text-lime-300">Size Presets</span>
              <div className="grid grid-cols-2 gap-1.5">
                {QUICK_SIZE_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() =>
                      onChangeConfig({ ...placementConfig, scale: [...preset.scale] })
                    }
                    className="min-h-[36px] sm:min-h-[30px] rounded border border-lime-400/15 bg-[#0e1015] px-2 py-1.5 text-left text-[11px] font-medium text-lime-300 transition-colors hover:border-lime-400/50 hover:text-lime-200 cursor-pointer"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5 border-t border-lime-400/15 pt-3">
              <span className="text-xs font-medium text-lime-300">Volume Type</span>
              <div className="grid grid-cols-2 gap-1.5">
                {categories.map((cat) => {
                  const meta = CATEGORY_META[cat];
                  const active = placementConfig.category === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => onChangeConfig({ ...placementConfig, category: cat })}
                      className={`flex min-h-[36px] sm:min-h-[32px] items-center gap-2 rounded border px-2.5 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                        active
                          ? 'border-lime-400/75 bg-lime-400/15 text-lime-200'
                          : 'border-lime-400/15 bg-[#0e1015] text-lime-300 hover:border-lime-400/35'
                      }`}
                    >
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-xs"
                        style={{ backgroundColor: meta.colorHex }}
                      />
                      <span className="truncate">{meta.label.split(' ')[0]}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded border border-lime-400/15 bg-[#0e1015] p-2.5 text-[11px] text-lime-400/80 font-mono-tabular">
              World size:{' '}
              <span className="text-lime-200">
                {(placementConfig.scale[0] * 2).toFixed(2)} ×{' '}
                {(placementConfig.scale[1] * 2).toFixed(2)} ×{' '}
                {(placementConfig.scale[2] * 2).toFixed(2)}
              </span>
            </div>
          </>
        )}

        {activeTab === 'selected' && (
          <>
            {!selectedVolume ? (
              <div className="flex flex-col items-center justify-center py-8 sm:py-10 text-center space-y-2">
                <Move className="h-7 w-7 text-lime-500/40" />
                <p className="text-xs font-medium text-lime-200">No volume selected</p>
                <p className="text-[11px] text-lime-400/75 max-w-[220px]">
                  Switch to Transform mode in the bottom dock and tap any cube to edit its
                  position, rotation, or scale.
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xs font-semibold text-lime-200">
                      {selectedVolume.name}
                    </h2>
                    <p className="text-[11px] text-lime-400/75 font-mono-tabular">
                      {selectedVolume.id}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onDuplicateSelected(selectedVolume)}
                      title="Duplicate volume"
                      className="rounded p-2 sm:p-1.5 text-lime-300 hover:bg-lime-400/12 hover:text-lime-200 cursor-pointer"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteSelected(selectedVolume.id)}
                      title="Delete volume (Del)"
                      className="rounded p-2 sm:p-1.5 text-rose-400 hover:bg-rose-500/15 hover:text-rose-200 cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <Vec3Inputs
                  label="Position"
                  value={selectedVolume.position}
                  step={0.25}
                  onCommit={(position) =>
                    onUpdateSelectedTransform(
                      selectedVolume.id,
                      {
                        position: [...selectedVolume.position],
                        rotation: [...selectedVolume.rotation],
                        scale: [...selectedVolume.scale],
                      },
                      {
                        position,
                        rotation: [...selectedVolume.rotation],
                        scale: [...selectedVolume.scale],
                      }
                    )
                  }
                />

                <Vec3Inputs
                  label="Rotation (deg)"
                  value={selectedVolume.rotation}
                  step={15}
                  onCommit={(rotation) =>
                    onUpdateSelectedTransform(
                      selectedVolume.id,
                      {
                        position: [...selectedVolume.position],
                        rotation: [...selectedVolume.rotation],
                        scale: [...selectedVolume.scale],
                      },
                      {
                        position: [...selectedVolume.position],
                        rotation,
                        scale: [...selectedVolume.scale],
                      }
                    )
                  }
                />

                <Vec3Inputs
                  label="Scale (half-extents)"
                  value={selectedVolume.scale}
                  step={0.25}
                  min={0.05}
                  onCommit={(scale) =>
                    onUpdateSelectedTransform(
                      selectedVolume.id,
                      {
                        position: [...selectedVolume.position],
                        rotation: [...selectedVolume.rotation],
                        scale: [...selectedVolume.scale],
                      },
                      {
                        position: [...selectedVolume.position],
                        rotation: [...selectedVolume.rotation],
                        scale,
                      }
                    )
                  }
                />

                <div className="space-y-1.5 border-t border-lime-400/15 pt-3">
                  <span className="text-xs font-medium text-lime-300">Volume Type</span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {categories.map((cat) => {
                      const meta = CATEGORY_META[cat];
                      const active = selectedVolume.category === cat;
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() =>
                            cat !== selectedVolume.category &&
                            onUpdateSelectedCategory(
                              selectedVolume.id,
                              selectedVolume.category,
                              cat
                            )
                          }
                          className={`flex min-h-[36px] sm:min-h-[32px] items-center gap-2 rounded border px-2.5 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                            active
                              ? 'border-lime-400/75 bg-lime-400/15 text-lime-200'
                              : 'border-lime-400/15 bg-[#0e1015] text-lime-300 hover:border-lime-400/35'
                          }`}
                        >
                          <span
                            className="h-2.5 w-2.5 shrink-0 rounded-xs"
                            style={{ backgroundColor: meta.colorHex }}
                          />
                          <span className="truncate">{meta.label.split(' ')[0]}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {activeTab === 'history' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-lime-200">Action Stack</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={onUndo}
                  disabled={undoStack.length === 0}
                  className="inline-flex min-h-[32px] items-center gap-1 rounded border border-lime-400/15 bg-[#0e1015] px-2.5 py-1 text-[11px] font-medium text-lime-200 hover:bg-lime-400/10 disabled:opacity-35 disabled:pointer-events-none cursor-pointer"
                >
                  <Undo2 className="h-3 w-3" />
                  <span>Undo</span>
                </button>
                <button
                  type="button"
                  onClick={onRedo}
                  disabled={redoStack.length === 0}
                  className="inline-flex min-h-[32px] items-center gap-1 rounded border border-lime-400/15 bg-[#0e1015] px-2.5 py-1 text-[11px] font-medium text-lime-200 hover:bg-lime-400/10 disabled:opacity-35 disabled:pointer-events-none cursor-pointer"
                >
                  <Redo2 className="h-3 w-3" />
                  <span>Redo</span>
                </button>
              </div>
            </div>

            {undoStack.length === 0 && redoStack.length === 0 ? (
              <div className="py-8 text-center">
                <Plus className="mx-auto h-6 w-6 text-lime-500/40 mb-2" />
                <p className="text-xs text-lime-400/75">
                  Place, transform, or delete cubes to record undoable history steps.
                </p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {redoStack.length > 0 && (
                  <div className="space-y-1 pb-2 border-b border-lime-400/15">
                    <div className="text-[11px] font-medium text-lime-400/75">
                      Redo Queue ({redoStack.length})
                    </div>
                    {[...redoStack].reverse().map((act) => {
                      const info = formatActionSummary(act);
                      return (
                        <div
                          key={act.id}
                          className="flex items-center justify-between rounded border border-dashed border-lime-400/15 bg-[#0e1015]/60 px-2.5 py-1.5 text-xs opacity-65"
                        >
                          <span className="truncate text-lime-300">{info.detail}</span>
                          <span className="text-[11px] text-lime-400/70 ml-2 shrink-0">
                            {info.kind}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {undoStack.length > 0 && (
                  <div className="space-y-1">
                    <div className="text-[11px] font-medium text-lime-400/75">
                      Undo Stack ({undoStack.length})
                    </div>
                    {[...undoStack].reverse().map((act, idx) => {
                      const info = formatActionSummary(act);
                      return (
                        <div
                          key={act.id}
                          className={`flex items-center justify-between rounded border px-2.5 py-1.5 text-xs ${
                            idx === 0
                              ? 'border-lime-400/45 bg-lime-400/12'
                              : 'border-lime-400/12 bg-[#0e1015]'
                          }`}
                        >
                          <span className="truncate text-lime-200">{info.detail}</span>
                          <span className={`text-[11px] ml-2 shrink-0 ${info.badgeColor}`}>
                            {info.kind}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};
