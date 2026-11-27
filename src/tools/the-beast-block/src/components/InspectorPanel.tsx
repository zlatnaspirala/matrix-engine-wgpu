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
  PhysicsMeshType,
  PlacementConfig,
  Vec3,
  VolumeCategory,
  VolumePhysics,
  VolumeTransform,
} from '../types/volume';
import {
  CATEGORY_META,
  clamp01,
  DEFAULT_AMBIENT_COLOR,
  DEFAULT_BLEND_ALPHA,
  DEFAULT_GLB_FILE_PATH,
  DEFAULT_IS_BLEND,
  DEFAULT_OBJ_FILE_PATH,
  DEFAULT_PHYSICS,
  DEFAULT_TEX_PATH,
  isAssetCategory,
  PHYSICS_MESH_TYPES,
  resolveAssetPathsOnCategoryChange,
  roundNum,
  roundVec3,
} from '../utils/snap';

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
  onUpdateSelectedProperties: (
    id: string,
    before: Partial<BlockingVolume>,
    after: Partial<BlockingVolume>,
    label?: string
  ) => void;
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
const AXIS_COLORS = ['text-rose-400', 'text-[#00ff00]', 'text-sky-400'] as const;

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
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium text-[#00ff00]">{label}</span>
      </div>
      <div className="grid grid-cols-3 gap-1">
        {AXIS_LABELS.map((axis, idx) => {
          const i = idx as 0 | 1 | 2;
          return (
            <label
              key={axis}
              className="flex items-center gap-1 rounded border border-[#00ff00]/20 bg-[#0e1015] px-1.5 py-1 sm:py-0.5 focus-within:border-[#00ff00]"
            >
              <span className={`text-[10px] font-semibold ${AXIS_COLORS[i]}`}>{axis}</span>
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
                className="w-full min-w-0 bg-transparent text-right text-[11px] font-mono-tabular text-[#00ff00] outline-none"
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

const RGB_LABELS = ['R', 'G', 'B'] as const;
const RGB_COLORS = ['text-rose-400', 'text-[#00ff00]', 'text-sky-400'] as const;

interface MaterialAndAssetFieldsProps {
  itemKey: string;
  category: VolumeCategory;
  ambientColor: Vec3;
  isBlend: boolean;
  blendAlpha: number;
  filePath?: string;
  texPath?: string;
  physics: VolumePhysics;
  onCommitAmbient: (next: Vec3) => void;
  onToggleBlend: (next: boolean) => void;
  onCommitBlendAlpha: (next: number) => void;
  onCommitPaths: (filePath: string, texPath: string) => void;
  onCommitPhysics: (next: VolumePhysics) => void;
}

const MaterialAndAssetFields: React.FC<MaterialAndAssetFieldsProps> = ({
  itemKey,
  category,
  ambientColor,
  isBlend,
  blendAlpha,
  filePath = '',
  texPath = '',
  physics,
  onCommitAmbient,
  onToggleBlend,
  onCommitBlendAlpha,
  onCommitPaths,
  onCommitPhysics,
}) => {
  const [ambDraft, setAmbDraft] = useState<[string, string, string]>([
    String(ambientColor[0]),
    String(ambientColor[1]),
    String(ambientColor[2]),
  ]);
  const [alphaSliderDraft, setAlphaSliderDraft] = useState<number>(blendAlpha);
  const [alphaInputDraft, setAlphaInputDraft] = useState<string>(String(blendAlpha));
  const [filePathDraft, setFilePathDraft] = useState<string>(filePath);
  const [texPathDraft, setTexPathDraft] = useState<string>(texPath);
  const [massDraft, setMassDraft] = useState<string>(String(physics.mass));
  const [groupDraft, setGroupDraft] = useState<string>(String(physics.group));

  useEffect(() => {
    setAmbDraft([
      String(ambientColor[0]),
      String(ambientColor[1]),
      String(ambientColor[2]),
    ]);
  }, [itemKey, ambientColor[0], ambientColor[1], ambientColor[2]]);

  useEffect(() => {
    setAlphaSliderDraft(blendAlpha);
    setAlphaInputDraft(String(blendAlpha));
  }, [itemKey, blendAlpha]);

  useEffect(() => {
    setFilePathDraft(filePath);
  }, [itemKey, filePath]);

  useEffect(() => {
    setTexPathDraft(texPath);
  }, [itemKey, texPath]);

  useEffect(() => {
    setMassDraft(String(physics.mass));
    setGroupDraft(String(physics.group));
  }, [itemKey, physics.mass, physics.group]);

  const commitMassRaw = (raw: string) => {
    const parsed = parseFloat(raw);
    if (Number.isNaN(parsed)) {
      setMassDraft(String(physics.mass));
      return;
    }
    const nextMass = roundNum(Math.max(0, parsed), 3);
    setMassDraft(String(nextMass));
    if (nextMass !== physics.mass) {
      onCommitPhysics({ ...physics, mass: nextMass });
    }
  };

  const commitGroupRaw = (raw: string) => {
    const parsed = parseInt(raw, 10);
    if (Number.isNaN(parsed)) {
      setGroupDraft(String(physics.group));
      return;
    }
    setGroupDraft(String(parsed));
    if (parsed !== physics.group) {
      onCommitPhysics({ ...physics, group: parsed });
    }
  };

  const commitAmbientIdx = (idx: 0 | 1 | 2, raw: string) => {
    const parsed = parseFloat(raw);
    if (Number.isNaN(parsed)) {
      setAmbDraft([
        String(ambientColor[0]),
        String(ambientColor[1]),
        String(ambientColor[2]),
      ]);
      return;
    }
    const clamped = roundNum(clamp01(parsed), 3);
    const next: Vec3 = [ambientColor[0], ambientColor[1], ambientColor[2]];
    next[idx] = clamped;
    if (next[idx] !== ambientColor[idx]) {
      onCommitAmbient(next);
    } else {
      setAmbDraft([String(next[0]), String(next[1]), String(next[2])]);
    }
  };

  const commitAlphaRaw = (raw: string) => {
    const parsed = parseFloat(raw);
    if (Number.isNaN(parsed)) {
      setAlphaInputDraft(String(blendAlpha));
      setAlphaSliderDraft(blendAlpha);
      return;
    }
    const clamped = roundNum(clamp01(parsed), 3);
    setAlphaSliderDraft(clamped);
    setAlphaInputDraft(String(clamped));
    if (clamped !== blendAlpha) {
      onCommitBlendAlpha(clamped);
    }
  };

  const swatchCss = `rgb(${Math.round(clamp01(ambientColor[0]) * 255)}, ${Math.round(
    clamp01(ambientColor[1]) * 255
  )}, ${Math.round(clamp01(ambientColor[2]) * 255)})`;

  const showAssetFields = isAssetCategory(category);

  return (
    <div className="space-y-2 border-t border-[#00ff00]/20 pt-2">
      {showAssetFields && (
        <div className="space-y-1.5 rounded border border-[#00ff00]/25 bg-[#0e1015]/80 p-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#00ff00]">
              {category.toUpperCase()} Asset
            </span>
            <span className="text-[10px] font-mono-tabular text-[#00ff00]/75">
              Proxy Cube
            </span>
          </div>

          <label className="block space-y-0.5">
            <span className="text-[10px] font-medium text-[#00ff00]/85">filePath</span>
            <input
              type="text"
              value={filePathDraft}
              placeholder={
                category === 'obj'
                  ? DEFAULT_OBJ_FILE_PATH
                  : DEFAULT_GLB_FILE_PATH
              }
              onChange={(e) => setFilePathDraft(e.target.value)}
              onBlur={() => {
                if (filePathDraft !== filePath || texPathDraft !== texPath) {
                  onCommitPaths(filePathDraft, texPathDraft);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  if (filePathDraft !== filePath || texPathDraft !== texPath) {
                    onCommitPaths(filePathDraft, texPathDraft);
                  }
                  (e.target as HTMLInputElement).blur();
                }
              }}
              className="w-full rounded border border-[#00ff00]/20 bg-[#151922] px-2 py-1 text-[11px] font-mono-tabular text-[#00ff00] placeholder:text-[#00ff00]/35 outline-none focus:border-[#00ff00]"
            />
          </label>

          <label className="block space-y-0.5">
            <span className="text-[10px] font-medium text-[#00ff00]/85">texPath</span>
            <input
              type="text"
              value={texPathDraft}
              placeholder={DEFAULT_TEX_PATH}
              onChange={(e) => setTexPathDraft(e.target.value)}
              onBlur={() => {
                if (filePathDraft !== filePath || texPathDraft !== texPath) {
                  onCommitPaths(filePathDraft, texPathDraft);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  if (filePathDraft !== filePath || texPathDraft !== texPath) {
                    onCommitPaths(filePathDraft, texPathDraft);
                  }
                  (e.target as HTMLInputElement).blur();
                }
              }}
              className="w-full rounded border border-[#00ff00]/20 bg-[#151922] px-2 py-1 text-[11px] font-mono-tabular text-[#00ff00] placeholder:text-[#00ff00]/35 outline-none focus:border-[#00ff00]"
            />
          </label>
        </div>
      )}

      {/* Ambient Color RGB (0..1, default 0.5) */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span
              className="h-2.5 w-2.5 rounded-xs border border-[#00ff00]/40"
              style={{ backgroundColor: swatchCss }}
            />
            <span className="text-[11px] font-medium text-[#00ff00]">Ambient</span>
          </div>
          <button
            type="button"
            onClick={() => {
              if (
                ambientColor[0] !== 0.5 ||
                ambientColor[1] !== 0.5 ||
                ambientColor[2] !== 0.5
              ) {
                onCommitAmbient([...DEFAULT_AMBIENT_COLOR]);
              }
            }}
            className="text-[10px] text-[#00ff00]/75 hover:text-[#00ff00] cursor-pointer"
          >
            Reset 0.5
          </button>
        </div>

        <div className="grid grid-cols-3 gap-1">
          {RGB_LABELS.map((ch, idx) => {
            const i = idx as 0 | 1 | 2;
            return (
              <label
                key={ch}
                className="flex items-center gap-1 rounded border border-[#00ff00]/20 bg-[#0e1015] px-1.5 py-1 sm:py-0.5 focus-within:border-[#00ff00]"
              >
                <span className={`text-[10px] font-semibold ${RGB_COLORS[i]}`}>{ch}</span>
                <input
                  type="number"
                  inputMode="decimal"
                  step={0.05}
                  min={0}
                  max={1}
                  value={ambDraft[i]}
                  onChange={(e) => {
                    const nextDraft: [string, string, string] = [...ambDraft];
                    nextDraft[i] = e.target.value;
                    setAmbDraft(nextDraft);
                  }}
                  onBlur={() => commitAmbientIdx(i, ambDraft[i])}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      commitAmbientIdx(i, ambDraft[i]);
                      (e.target as HTMLInputElement).blur();
                    }
                  }}
                  className="w-full min-w-0 bg-transparent text-right text-[11px] font-mono-tabular text-[#00ff00] outline-none"
                />
              </label>
            );
          })}
        </div>
      </div>

      {/* Alpha Blending (isBlend & blendAlpha) */}
      <div className="space-y-1.5 rounded border border-[#00ff00]/20 bg-[#0e1015] p-1.5">
        <div className="flex items-center justify-between gap-1.5">
          <span className="text-[11px] font-medium text-[#00ff00]">Blend</span>
          <button
            type="button"
            onClick={() => onToggleBlend(!isBlend)}
            className={`rounded border px-2 py-0.5 text-[10px] font-bold transition-colors cursor-pointer ${
              isBlend
                ? 'border-[#00ff00] bg-[#00ff00] text-black'
                : 'border-[#00ff00]/25 bg-[#151922] text-[#00ff00] hover:border-[#00ff00]/55'
            }`}
          >
            {isBlend ? 'isBlend: ON' : 'isBlend: OFF'}
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-[#00ff00]/80 shrink-0">Alpha</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={alphaSliderDraft}
            onChange={(e) => {
              const v = roundNum(clamp01(parseFloat(e.target.value)), 3);
              setAlphaSliderDraft(v);
              setAlphaInputDraft(String(v));
            }}
            onMouseUp={() => {
              if (alphaSliderDraft !== blendAlpha) {
                onCommitBlendAlpha(alphaSliderDraft);
              }
            }}
            onTouchEnd={() => {
              if (alphaSliderDraft !== blendAlpha) {
                onCommitBlendAlpha(alphaSliderDraft);
              }
            }}
            onKeyUp={() => {
              if (alphaSliderDraft !== blendAlpha) {
                onCommitBlendAlpha(alphaSliderDraft);
              }
            }}
            className="flex-1 accent-[#00ff00] cursor-pointer"
          />
          <input
            type="number"
            inputMode="decimal"
            min={0}
            max={1}
            step={0.05}
            value={alphaInputDraft}
            onChange={(e) => setAlphaInputDraft(e.target.value)}
            onBlur={() => commitAlphaRaw(alphaInputDraft)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                commitAlphaRaw(alphaInputDraft);
                (e.target as HTMLInputElement).blur();
              }
            }}
            className="w-12 rounded border border-[#00ff00]/20 bg-[#151922] px-1 py-0.5 text-right text-[11px] font-mono-tabular text-[#00ff00] outline-none focus:border-[#00ff00]"
          />
        </div>
      </div>

      {/* Physics Attributes */}
      <div className="space-y-1.5 rounded border border-[#00ff00]/20 bg-[#0e1015] p-1.5">
        <div className="flex items-center justify-between gap-1.5">
          <span className="text-[11px] font-medium text-[#00ff00]">Physics</span>
          <button
            type="button"
            onClick={() => onCommitPhysics({ ...physics, enabled: !physics.enabled })}
            className={`rounded border px-2 py-0.5 text-[10px] font-bold transition-colors cursor-pointer ${
              physics.enabled
                ? 'border-[#00ff00] bg-[#00ff00] text-black'
                : 'border-[#00ff00]/25 bg-[#151922] text-[#00ff00] hover:border-[#00ff00]/55'
            }`}
          >
            {physics.enabled ? 'enabled: true' : 'enabled: false'}
          </button>
        </div>

        <label className="flex items-center gap-1.5">
          <span className="text-[10px] text-[#00ff00]/80 shrink-0">meshType</span>
          <select
            value={physics.meshType}
            onChange={(e) =>
              onCommitPhysics({
                ...physics,
                meshType: e.target.value as PhysicsMeshType,
              })
            }
            className="flex-1 min-w-0 rounded border border-[#00ff00]/20 bg-[#151922] px-1.5 py-1 text-[11px] font-mono-tabular text-[#00ff00] outline-none focus:border-[#00ff00] cursor-pointer"
          >
            {PHYSICS_MESH_TYPES.map((mt) => (
              <option key={mt} value={mt} className="bg-[#151922] text-[#00ff00]">
                {mt}
              </option>
            ))}
          </select>
        </label>

        <div className="grid grid-cols-2 gap-1">
          <label className="flex items-center gap-1 rounded border border-[#00ff00]/20 bg-[#151922] px-1.5 py-0.5 focus-within:border-[#00ff00]">
            <span className="text-[10px] text-[#00ff00]/80">mass</span>
            <input
              type="number"
              inputMode="decimal"
              min={0}
              step={0.5}
              value={massDraft}
              onChange={(e) => setMassDraft(e.target.value)}
              onBlur={() => commitMassRaw(massDraft)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  commitMassRaw(massDraft);
                  (e.target as HTMLInputElement).blur();
                }
              }}
              className="w-full min-w-0 bg-transparent text-right text-[11px] font-mono-tabular text-[#00ff00] outline-none"
            />
          </label>

          <label className="flex items-center gap-1 rounded border border-[#00ff00]/20 bg-[#151922] px-1.5 py-0.5 focus-within:border-[#00ff00]">
            <span className="text-[10px] text-[#00ff00]/80">group</span>
            <input
              type="number"
              inputMode="numeric"
              step={1}
              value={groupDraft}
              onChange={(e) => setGroupDraft(e.target.value)}
              onBlur={() => commitGroupRaw(groupDraft)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  commitGroupRaw(groupDraft);
                  (e.target as HTMLInputElement).blur();
                }
              }}
              className="w-full min-w-0 bg-transparent text-right text-[11px] font-mono-tabular text-[#00ff00] outline-none"
            />
          </label>
        </div>
      </div>
    </div>
  );
};

function formatActionSummary(action: HistoryAction): {
  kind: string;
  detail: string;
  badgeColor: string;
} {
  if (action.type === 'place') {
    return {
      kind: 'Placement',
      detail: action.label,
      badgeColor: 'text-[#00ff00]',
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
  if (action.type === 'properties') {
    return {
      kind: 'Properties',
      detail: action.label,
      badgeColor: 'text-emerald-300',
    };
  }
  return {
    kind: 'Map',
    detail: action.label,
    badgeColor: 'text-[#00ff00]',
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
  onUpdateSelectedProperties,
  onDuplicateSelected,
  onDeleteSelected,
  onUndo,
  onRedo,
  onCloseMobile,
}) => {
  if (!open) return null;

  const categories = Object.keys(CATEGORY_META) as VolumeCategory[];

  return (
    <aside className="pointer-events-auto fixed inset-x-1.5 bottom-13 z-30 flex max-h-[52vh] flex-col rounded-md border border-[#00ff00]/25 bg-[#151922]/96 shadow-2xl sm:inset-x-auto sm:bottom-auto sm:right-2 sm:top-11 sm:z-20 sm:max-h-[calc(100vh-96px)] sm:w-68">
      {/* Tabs + Mobile Close */}
      <div className="flex items-center border-b border-[#00ff00]/20 p-0.5 gap-0.5">
        <div className="grid flex-1 grid-cols-3 gap-0.5">
          <button
            type="button"
            onClick={() => onChangeTab('config')}
            className={`flex min-h-[28px] items-center justify-center gap-1 rounded py-1 text-[11px] font-medium transition-colors cursor-pointer ${
              activeTab === 'config'
                ? 'bg-[#00ff00]/20 text-[#00ff00]'
                : 'text-[#00ff00]/70 hover:text-[#00ff00]'
            }`}
          >
            <Sliders className="h-3 w-3" />
            <span>Brush</span>
          </button>

          <button
            type="button"
            onClick={() => onChangeTab('selected')}
            className={`flex min-h-[28px] items-center justify-center gap-1 rounded py-1 text-[11px] font-medium transition-colors cursor-pointer ${
              activeTab === 'selected'
                ? 'bg-[#00ff00]/20 text-[#00ff00]'
                : 'text-[#00ff00]/70 hover:text-[#00ff00]'
            }`}
          >
            <Box className="h-3 w-3" />
            <span>Selected</span>
          </button>

          <button
            type="button"
            onClick={() => onChangeTab('history')}
            className={`flex min-h-[28px] items-center justify-center gap-1 rounded py-1 text-[11px] font-medium transition-colors cursor-pointer ${
              activeTab === 'history'
                ? 'bg-[#00ff00]/20 text-[#00ff00]'
                : 'text-[#00ff00]/70 hover:text-[#00ff00]'
            }`}
          >
            <History className="h-3 w-3" />
            <span>Log ({undoStack.length})</span>
          </button>
        </div>

        <button
          type="button"
          onClick={onCloseMobile}
          aria-label="Close inspector"
          className="sm:hidden flex h-7 w-7 shrink-0 items-center justify-center rounded text-[#00ff00] hover:bg-[#00ff00]/15 cursor-pointer"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-2 sm:p-2.5 space-y-2">
        {activeTab === 'config' && (
          <>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-[11px] font-semibold text-[#00ff00]">Placement Transform</h2>
                <p className="text-[10px] text-[#00ff00]/70">
                  Per new -1..+1 unit cube
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const resetPaths = resolveAssetPathsOnCategoryChange(
                    placementConfig.category
                  );
                  onChangeConfig({
                    positionOffset: [0, 0, 0],
                    rotation: [0, 0, 0],
                    scale: [1, 1, 1],
                    category: placementConfig.category,
                    ambientColor: [...DEFAULT_AMBIENT_COLOR],
                    isBlend: DEFAULT_IS_BLEND,
                    blendAlpha: DEFAULT_BLEND_ALPHA,
                    filePath: resetPaths.filePath,
                    texPath: resetPaths.texPath,
                    physics: { ...DEFAULT_PHYSICS },
                  });
                }}
                title="Reset brush config"
                className="rounded p-1 text-[#00ff00]/80 hover:bg-[#00ff00]/15 hover:text-[#00ff00] cursor-pointer"
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

            <div className="flex items-center gap-1">
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
                className="flex-1 min-h-[26px] rounded border border-[#00ff00]/20 bg-[#0e1015] py-0.5 text-[10px] font-medium text-[#00ff00] hover:border-[#00ff00]/50 cursor-pointer"
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
                className="flex-1 min-h-[26px] rounded border border-[#00ff00]/20 bg-[#0e1015] py-0.5 text-[10px] font-medium text-[#00ff00] hover:border-[#00ff00]/50 cursor-pointer"
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

            <div className="space-y-1">
              <span className="text-[11px] font-medium text-[#00ff00]">Size Presets</span>
              <div className="grid grid-cols-2 gap-1">
                {QUICK_SIZE_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() =>
                      onChangeConfig({ ...placementConfig, scale: [...preset.scale] })
                    }
                    className="min-h-[26px] rounded border border-[#00ff00]/20 bg-[#0e1015] px-1.5 py-0.5 text-left text-[10px] font-medium text-[#00ff00] transition-colors hover:border-[#00ff00]/55 cursor-pointer"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1 border-t border-[#00ff00]/20 pt-2">
              <span className="text-[11px] font-medium text-[#00ff00]">Item Type</span>
              <div className="grid grid-cols-3 gap-1">
                {categories.map((cat) => {
                  const meta = CATEGORY_META[cat];
                  const active = placementConfig.category === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        const resolved = resolveAssetPathsOnCategoryChange(
                          cat,
                          placementConfig.filePath,
                          placementConfig.texPath
                        );
                        onChangeConfig({
                          ...placementConfig,
                          category: cat,
                          filePath: resolved.filePath,
                          texPath: resolved.texPath,
                        });
                      }}
                      className={`flex min-h-[26px] items-center gap-1 rounded border px-1.5 py-0.5 text-[11px] font-medium transition-colors cursor-pointer ${
                        active
                          ? 'border-[#00ff00] bg-[#00ff00]/20 text-[#00ff00]'
                          : 'border-[#00ff00]/20 bg-[#0e1015] text-[#00ff00]/85 hover:border-[#00ff00]/45'
                      }`}
                    >
                      <span
                        className="h-2 w-2 shrink-0 rounded-xs"
                        style={{ backgroundColor: meta.colorHex }}
                      />
                      <span className="truncate">{meta.shortLabel}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <MaterialAndAssetFields
              itemKey="brush"
              category={placementConfig.category}
              ambientColor={placementConfig.ambientColor}
              isBlend={placementConfig.isBlend}
              blendAlpha={placementConfig.blendAlpha}
              filePath={placementConfig.filePath}
              texPath={placementConfig.texPath}
              physics={placementConfig.physics}
              onCommitAmbient={(ambientColor) =>
                onChangeConfig({ ...placementConfig, ambientColor })
              }
              onToggleBlend={(isBlend) =>
                onChangeConfig({ ...placementConfig, isBlend })
              }
              onCommitBlendAlpha={(blendAlpha) =>
                onChangeConfig({ ...placementConfig, blendAlpha })
              }
              onCommitPaths={(filePath, texPath) =>
                onChangeConfig({ ...placementConfig, filePath, texPath })
              }
              onCommitPhysics={(physics) =>
                onChangeConfig({ ...placementConfig, physics })
              }
            />

            <div className="rounded border border-[#00ff00]/20 bg-[#0e1015] px-2 py-1 text-[10px] text-[#00ff00]/80 font-mono-tabular">
              Size:{' '}
              <span className="text-[#00ff00]">
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
              <div className="flex flex-col items-center justify-center py-6 text-center space-y-1.5">
                <Move className="h-6 w-6 text-[#00ff00]/40" />
                <p className="text-[11px] font-medium text-[#00ff00]">No volume selected</p>
                <p className="text-[10px] text-[#00ff00]/75 max-w-[200px]">
                  Switch to Transform mode in the bottom dock and tap any cube to edit.
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <h2 className="text-[11px] font-semibold text-[#00ff00] truncate">
                      {selectedVolume.name}
                    </h2>
                    <p className="text-[10px] text-[#00ff00]/70 font-mono-tabular truncate">
                      {selectedVolume.id}
                    </p>
                  </div>
                  <div className="flex items-center gap-0.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => onDuplicateSelected(selectedVolume)}
                      title="Duplicate volume"
                      className="rounded p-1 text-[#00ff00] hover:bg-[#00ff00]/15 cursor-pointer"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteSelected(selectedVolume.id)}
                      title="Delete volume (Del)"
                      className="rounded p-1 text-rose-400 hover:bg-rose-500/15 hover:text-rose-200 cursor-pointer"
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

                <div className="space-y-1 border-t border-[#00ff00]/20 pt-2">
                  <span className="text-[11px] font-medium text-[#00ff00]">Item Type</span>
                  <div className="grid grid-cols-3 gap-1">
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
                          className={`flex min-h-[26px] items-center gap-1 rounded border px-1.5 py-0.5 text-[11px] font-medium transition-colors cursor-pointer ${
                            active
                              ? 'border-[#00ff00] bg-[#00ff00]/20 text-[#00ff00]'
                              : 'border-[#00ff00]/20 bg-[#0e1015] text-[#00ff00]/85 hover:border-[#00ff00]/45'
                          }`}
                        >
                          <span
                            className="h-2 w-2 shrink-0 rounded-xs"
                            style={{ backgroundColor: meta.colorHex }}
                          />
                          <span className="truncate">{meta.shortLabel}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <MaterialAndAssetFields
                  itemKey={selectedVolume.id}
                  category={selectedVolume.category}
                  ambientColor={selectedVolume.ambientColor}
                  isBlend={selectedVolume.isBlend}
                  blendAlpha={selectedVolume.blendAlpha}
                  filePath={selectedVolume.filePath}
                  texPath={selectedVolume.texPath}
                  physics={selectedVolume.physics}
                  onCommitAmbient={(ambientColor) =>
                    onUpdateSelectedProperties(
                      selectedVolume.id,
                      { ambientColor: [...selectedVolume.ambientColor] },
                      { ambientColor },
                      `Ambient ${selectedVolume.name}`
                    )
                  }
                  onToggleBlend={(isBlend) =>
                    onUpdateSelectedProperties(
                      selectedVolume.id,
                      { isBlend: selectedVolume.isBlend },
                      { isBlend },
                      `Blend ${isBlend ? 'On' : 'Off'} (${selectedVolume.name})`
                    )
                  }
                  onCommitBlendAlpha={(blendAlpha) =>
                    onUpdateSelectedProperties(
                      selectedVolume.id,
                      { blendAlpha: selectedVolume.blendAlpha },
                      { blendAlpha },
                      `Alpha ${blendAlpha} (${selectedVolume.name})`
                    )
                  }
                  onCommitPaths={(filePath, texPath) =>
                    onUpdateSelectedProperties(
                      selectedVolume.id,
                      {
                        filePath: selectedVolume.filePath ?? '',
                        texPath: selectedVolume.texPath ?? '',
                      },
                      { filePath, texPath },
                      `Asset Paths (${selectedVolume.name})`
                    )
                  }
                  onCommitPhysics={(physics) =>
                    onUpdateSelectedProperties(
                      selectedVolume.id,
                      { physics: { ...selectedVolume.physics } },
                      { physics },
                      `Physics (${selectedVolume.name})`
                    )
                  }
                />
              </>
            )}
          </>
        )}

        {activeTab === 'history' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-1.5">
              <span className="text-[11px] font-semibold text-[#00ff00]">Action Stack</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={onUndo}
                  disabled={undoStack.length === 0}
                  className="inline-flex min-h-[26px] items-center gap-1 rounded border border-[#00ff00]/20 bg-[#0e1015] px-2 py-0.5 text-[10px] font-medium text-[#00ff00] hover:bg-[#00ff00]/15 disabled:opacity-35 disabled:pointer-events-none cursor-pointer"
                >
                  <Undo2 className="h-3 w-3" />
                  <span>Undo</span>
                </button>
                <button
                  type="button"
                  onClick={onRedo}
                  disabled={redoStack.length === 0}
                  className="inline-flex min-h-[26px] items-center gap-1 rounded border border-[#00ff00]/20 bg-[#0e1015] px-2 py-0.5 text-[10px] font-medium text-[#00ff00] hover:bg-[#00ff00]/15 disabled:opacity-35 disabled:pointer-events-none cursor-pointer"
                >
                  <Redo2 className="h-3 w-3" />
                  <span>Redo</span>
                </button>
              </div>
            </div>

            {undoStack.length === 0 && redoStack.length === 0 ? (
              <div className="py-6 text-center">
                <Plus className="mx-auto h-5 w-5 text-[#00ff00]/40 mb-1.5" />
                <p className="text-[11px] text-[#00ff00]/75">
                  Place, transform, or delete cubes to record undoable steps.
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {redoStack.length > 0 && (
                  <div className="space-y-1 pb-1.5 border-b border-[#00ff00]/20">
                    <div className="text-[10px] font-medium text-[#00ff00]/75">
                      Redo Queue ({redoStack.length})
                    </div>
                    {[...redoStack].reverse().map((act) => {
                      const info = formatActionSummary(act);
                      return (
                        <div
                          key={act.id}
                          className="flex items-center justify-between rounded border border-dashed border-[#00ff00]/20 bg-[#0e1015]/60 px-2 py-1 text-[11px] opacity-65"
                        >
                          <span className="truncate text-[#00ff00]">{info.detail}</span>
                          <span className="text-[10px] text-[#00ff00]/70 ml-1.5 shrink-0">
                            {info.kind}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {undoStack.length > 0 && (
                  <div className="space-y-1">
                    <div className="text-[10px] font-medium text-[#00ff00]/75">
                      Undo Stack ({undoStack.length})
                    </div>
                    {[...undoStack].reverse().map((act, idx) => {
                      const info = formatActionSummary(act);
                      return (
                        <div
                          key={act.id}
                          className={`flex items-center justify-between rounded border px-2 py-1 text-[11px] ${
                            idx === 0
                              ? 'border-[#00ff00]/55 bg-[#00ff00]/15'
                              : 'border-[#00ff00]/15 bg-[#0e1015]'
                          }`}
                        >
                          <span className="truncate text-[#00ff00]">{info.detail}</span>
                          <span className={`text-[10px] ml-1.5 shrink-0 ${info.badgeColor}`}>
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
