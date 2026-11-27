import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Viewport3D } from './components/Viewport3D';
import { TopBar } from './components/TopBar';
import { ToolDock } from './components/ToolDock';
import { InspectorPanel } from './components/InspectorPanel';
import { JsonModal } from './components/JsonModal';
import { useHistory } from './hooks/useHistory';
import {
  BlockingVolume,
  CameraPreset,
  DrawMode,
  GizmoMode,
  PlacementConfig,
  SnapStep,
  VolumeCategory,
  VolumeTransform,
} from './types/volume';
import {
  clamp01,
  DEFAULT_AMBIENT_COLOR,
  DEFAULT_BLEND_ALPHA,
  DEFAULT_IS_BLEND,
  DEFAULT_PHYSICS,
  isAssetCategory,
  normalizePhysics,
  normalizeVolume,
  resolveAssetPathsOnCategoryChange,
  roundNum,
  roundVec3,
} from './utils/snap';
import {
  ArenaPresetMeta,
  createQuakeIronCitadel,
} from './utils/mapGenerators';

const STORAGE_KEY = 'volumeforge_map_v2';

function loadInitialVolumes(): BlockingVolume[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.map((v, i) => normalizeVolume(v, i));
      }
    }
  } catch {
    // Fallback to Quake Iron Citadel
  }
  return createQuakeIronCitadel();
}

export default function App() {
  const [volumes, setVolumes] = useState<BlockingVolume[]>(loadInitialVolumes);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [drawMode, setDrawMode] = useState<DrawMode>('click');
  const [gizmoMode, setGizmoMode] = useState<GizmoMode>('translate');
  const [snapStep, setSnapStep] = useState<SnapStep>(1);
  const [showGrid, setShowGrid] = useState(true);
  const [hoverDrawPaused, setHoverDrawPaused] = useState(false);

  const [placementConfig, setPlacementConfig] = useState<PlacementConfig>({
    positionOffset: [0, 0, 0],
    rotation: [0, 0, 0],
    scale: [1, 1, 1],
    category: 'solid',
    ambientColor: [...DEFAULT_AMBIENT_COLOR],
    isBlend: DEFAULT_IS_BLEND,
    blendAlpha: DEFAULT_BLEND_ALPHA,
    filePath: '',
    texPath: '',
    physics: { ...DEFAULT_PHYSICS },
  });

  const [hudCollapsed, setHudCollapsed] = useState(false);
  const [inspectorOpen, setInspectorOpen] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 768 : true
  );
  const [inspectorTab, setInspectorTab] = useState<'config' | 'selected' | 'history'>('config');
  const [jsonModalOpen, setJsonModalOpen] = useState(false);
  const [cameraPresetRequest, setCameraPresetRequest] = useState<{
    preset: CameraPreset;
    seq: number;
  } | null>(null);

  const nextIndexRef = useRef(volumes.length + 1);
  const { undoStack, redoStack, canUndo, canRedo, pushAction, undo, redo } = useHistory();

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(volumes));
    } catch {
      // Ignore storage quota errors
    }
  }, [volumes]);

  const selectedVolume = useMemo(
    () => volumes.find((v) => v.id === selectedId) ?? null,
    [volumes, selectedId]
  );

  const handleSelectVolume = useCallback((id: string | null) => {
    setSelectedId(id);
    if (id) {
      setInspectorTab('selected');
    }
  }, []);

  const handlePlaceBatch = useCallback(
    (items: Omit<BlockingVolume, 'id' | 'name'>[], label?: string) => {
      if (items.length === 0) return;
      const stamp = Date.now().toString(36);
      const created: BlockingVolume[] = items.map((item, idx) => {
        const num = nextIndexRef.current++;
        const amb = item.ambientColor ?? DEFAULT_AMBIENT_COLOR;
        const resolvedPaths = resolveAssetPathsOnCategoryChange(
          item.category,
          item.filePath ?? '',
          item.texPath ?? ''
        );
        return {
          id: `vol_${stamp}_${num}_${idx}`,
          name: `Block ${String(num).padStart(2, '0')}`,
          category: item.category,
          position: roundVec3(item.position, 3),
          rotation: roundVec3(item.rotation, 2),
          scale: roundVec3(item.scale, 3),
          ambientColor: [
            roundNum(clamp01(amb[0]), 3),
            roundNum(clamp01(amb[1]), 3),
            roundNum(clamp01(amb[2]), 3),
          ],
          isBlend: Boolean(item.isBlend),
          blendAlpha: roundNum(clamp01(item.blendAlpha ?? DEFAULT_BLEND_ALPHA), 3),
          filePath: resolvedPaths.filePath,
          texPath: resolvedPaths.texPath,
          physics: normalizePhysics(item.physics),
        };
      });

      setVolumes((prev) => [...prev, ...created]);
      pushAction({
        id: `act_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        type: 'place',
        label:
          label && label !== '__LIVE_STROKE_CHUNK__'
            ? label
            : created.length === 1
              ? `Place ${created[0].name}`
              : `Place ${created.length} Blocks`,
        timestamp: Date.now(),
        volumes: created,
      });
    },
    [pushAction]
  );

  const handleDeleteVolume = useCallback(
    (id: string) => {
      const target = volumes.find((v) => v.id === id);
      if (!target) return;
      setVolumes((prev) => prev.filter((v) => v.id !== id));
      if (selectedId === id) {
        setSelectedId(null);
      }
      pushAction({
        id: `act_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        type: 'delete',
        label: `Delete ${target.name}`,
        timestamp: Date.now(),
        volumes: [target],
      });
    },
    [volumes, selectedId, pushAction]
  );

  const handleLiveTransform = useCallback((id: string, transform: VolumeTransform) => {
    setVolumes((prev) =>
      prev.map((v) =>
        v.id === id
          ? {
              ...v,
              position: transform.position,
              rotation: transform.rotation,
              scale: transform.scale,
            }
          : v
      )
    );
  }, []);

  const handleCommitTransform = useCallback(
    (id: string, before: VolumeTransform, after: VolumeTransform) => {
      const target = volumes.find((v) => v.id === id);
      setVolumes((prev) =>
        prev.map((v) =>
          v.id === id
            ? {
                ...v,
                position: after.position,
                rotation: after.rotation,
                scale: after.scale,
              }
            : v
        )
      );
      pushAction({
        id: `act_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        type: 'transform',
        label: `Transform ${target?.name ?? id}`,
        timestamp: Date.now(),
        volumeId: id,
        before,
        after,
      });
    },
    [volumes, pushAction]
  );

  const handleUpdateSelectedCategory = useCallback(
    (id: string, before: VolumeCategory, after: VolumeCategory) => {
      const target = volumes.find((v) => v.id === id);
      if (!target) {
        setVolumes((prev) =>
          prev.map((v) => (v.id === id ? { ...v, category: after } : v))
        );
        pushAction({
          id: `act_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          type: 'category',
          label: `Type ${id} (${after})`,
          timestamp: Date.now(),
          volumeId: id,
          before,
          after,
        });
        return;
      }

      if (isAssetCategory(before) || isAssetCategory(after)) {
        const resolved = resolveAssetPathsOnCategoryChange(
          after,
          target.filePath ?? '',
          target.texPath ?? ''
        );
        const beforePatch: Partial<BlockingVolume> = {
          category: before,
          filePath: target.filePath ?? '',
          texPath: target.texPath ?? '',
        };
        const afterPatch: Partial<BlockingVolume> = {
          category: after,
          filePath: resolved.filePath,
          texPath: resolved.texPath,
        };
        setVolumes((prev) =>
          prev.map((v) => (v.id === id ? { ...v, ...afterPatch } : v))
        );
        pushAction({
          id: `act_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          type: 'properties',
          label: `Type ${target.name} (${after})`,
          timestamp: Date.now(),
          volumeId: id,
          before: beforePatch,
          after: afterPatch,
        });
        return;
      }

      setVolumes((prev) =>
        prev.map((v) => (v.id === id ? { ...v, category: after } : v))
      );
      pushAction({
        id: `act_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        type: 'category',
        label: `Type ${target.name} (${after})`,
        timestamp: Date.now(),
        volumeId: id,
        before,
        after,
      });
    },
    [volumes, pushAction]
  );

  const handleUpdateSelectedProperties = useCallback(
    (
      id: string,
      before: Partial<BlockingVolume>,
      after: Partial<BlockingVolume>,
      label?: string
    ) => {
      const target = volumes.find((v) => v.id === id);
      setVolumes((prev) =>
        prev.map((v) => (v.id === id ? { ...v, ...after } : v))
      );
      pushAction({
        id: `act_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        type: 'properties',
        label: label ?? `Update ${target?.name ?? id}`,
        timestamp: Date.now(),
        volumeId: id,
        before,
        after,
      });
    },
    [volumes, pushAction]
  );

  const handleDuplicateSelected = useCallback(
    (vol: BlockingVolume) => {
      const offset = snapStep > 0 ? snapStep : 1;
      handlePlaceBatch(
        [
          {
            category: vol.category,
            position: [vol.position[0] + offset, vol.position[1], vol.position[2]],
            rotation: [...vol.rotation],
            scale: [...vol.scale],
            ambientColor: [...vol.ambientColor],
            isBlend: vol.isBlend,
            blendAlpha: vol.blendAlpha,
            filePath: vol.filePath ?? '',
            texPath: vol.texPath ?? '',
            physics: { ...vol.physics },
          },
        ],
        `Duplicate ${vol.name}`
      );
    },
    [handlePlaceBatch, snapStep]
  );

  const handleUndo = useCallback(() => {
    const result = undo(volumes);
    if (!result) return;
    setVolumes(result.volumes);
    if (selectedId && !result.volumes.some((v) => v.id === selectedId)) {
      setSelectedId(null);
    }
  }, [undo, volumes, selectedId]);

  const handleRedo = useCallback(() => {
    const result = redo(volumes);
    if (!result) return;
    setVolumes(result.volumes);
    if (selectedId && !result.volumes.some((v) => v.id === selectedId)) {
      setSelectedId(null);
    }
  }, [redo, volumes, selectedId]);

  const handleClearMap = useCallback(() => {
    if (volumes.length === 0) return;
    const snapshot = volumes.map((v) => ({
      ...v,
      position: [...v.position] as [number, number, number],
      rotation: [...v.rotation] as [number, number, number],
      scale: [...v.scale] as [number, number, number],
      ambientColor: [...v.ambientColor] as [number, number, number],
      physics: { ...v.physics },
    }));
    setVolumes([]);
    setSelectedId(null);
    pushAction({
      id: `act_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      type: 'replaceAll',
      label: `Clear ${snapshot.length} Blocks`,
      timestamp: Date.now(),
      before: snapshot,
      after: [],
    });
  }, [volumes, pushAction]);

  const replaceMapWithHistory = useCallback(
    (nextVolumes: BlockingVolume[], label: string) => {
      const snapshot = volumes.map((v) => ({
        ...v,
        position: [...v.position] as [number, number, number],
        rotation: [...v.rotation] as [number, number, number],
        scale: [...v.scale] as [number, number, number],
        ambientColor: [...v.ambientColor] as [number, number, number],
        physics: { ...v.physics },
      }));
      setVolumes(nextVolumes);
      setSelectedId(null);
      pushAction({
        id: `act_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        type: 'replaceAll',
        label,
        timestamp: Date.now(),
        before: snapshot,
        after: nextVolumes,
      });
    },
    [volumes, pushAction]
  );

  const handleLoadPreset = useCallback(
    (preset: ArenaPresetMeta) => {
      replaceMapWithHistory(preset.build(), `Load ${preset.name}`);
    },
    [replaceMapWithHistory]
  );

  const handleImportVolumes = useCallback(
    (imported: BlockingVolume[]) => {
      const snapshot = volumes.map((v) => ({
        ...v,
        position: [...v.position] as [number, number, number],
        rotation: [...v.rotation] as [number, number, number],
        scale: [...v.scale] as [number, number, number],
        ambientColor: [...v.ambientColor] as [number, number, number],
        physics: { ...v.physics },
      }));
      setVolumes(imported);
      setSelectedId(null);
      pushAction({
        id: `act_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        type: 'replaceAll',
        label: `Import ${imported.length} Blocks`,
        timestamp: Date.now(),
        before: snapshot,
        after: imported,
      });
    },
    [volumes, pushAction]
  );

  // Keyboard shortcuts
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInput =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable);

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        if (isInput) return;
        e.preventDefault();
        if (e.shiftKey) handleRedo();
        else handleUndo();
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'y') {
        if (isInput) return;
        e.preventDefault();
        handleRedo();
        return;
      }

      if (isInput) return;

      if (e.key === 'Escape') {
        if (jsonModalOpen) setJsonModalOpen(false);
        else setSelectedId(null);
        return;
      }

      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
        e.preventDefault();
        handleDeleteVolume(selectedId);
        return;
      }

      if (e.code === 'Space' && drawMode === 'hover') {
        e.preventDefault();
        setHoverDrawPaused((p) => !p);
        return;
      }

      const keyLower = e.key.toLowerCase();
      if (keyLower === 'h') {
        setHudCollapsed((c) => !c);
      } else if (keyLower === 'g') {
        setDrawMode('select');
        setGizmoMode('translate');
      } else if (keyLower === 'r') {
        setDrawMode('select');
        setGizmoMode('rotate');
      } else if (keyLower === 's' && !e.ctrlKey && !e.metaKey) {
        setDrawMode('select');
        setGizmoMode('scale');
      } else if (e.key === '1') {
        setDrawMode('click');
      } else if (e.key === '2') {
        setDrawMode('drag');
      } else if (e.key === '3') {
        setDrawMode('hover');
        setHoverDrawPaused(false);
      } else if (e.key === '4') {
        setDrawMode('select');
      } else if (e.key === '5') {
        setDrawMode('erase');
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    handleUndo,
    handleRedo,
    handleDeleteVolume,
    selectedId,
    drawMode,
    jsonModalOpen,
  ]);

  const interactionHint = useMemo(() => {
    if (drawMode === 'click') {
      return 'Left-click: Place cube · Shift+Click: Erase · Drag: Orbit · Right-drag: Pan';
    }
    if (drawMode === 'drag') {
      return 'Left-drag: Paint cubes on move · Right-drag: Orbit · Scroll: Zoom';
    }
    if (drawMode === 'hover') {
      return hoverDrawPaused
        ? 'Move Draw paused · Press Space to resume painting'
        : 'Move cursor: Paint cubes continuously · Space: Pause · Drag: Orbit';
    }
    if (drawMode === 'select') {
      return 'Click cube: Select · G/R/S: Move/Rotate/Scale · Del: Delete cube';
    }
    return 'Click cube: Delete volume · Drag: Orbit · Ctrl+Z: Undo';
  }, [drawMode, hoverDrawPaused]);

  const lastUndoLabel = undoStack[undoStack.length - 1]?.label;
  const lastRedoLabel = redoStack[redoStack.length - 1]?.label;

  return (
    <div className="relative flex h-dvh w-screen flex-col overflow-hidden bg-[#0e1015] text-[#00ff00]">
      <TopBar
        volumeCount={volumes.length}
        canUndo={canUndo}
        canRedo={canRedo}
        lastUndoLabel={lastUndoLabel}
        lastRedoLabel={lastRedoLabel}
        hudCollapsed={hudCollapsed}
        inspectorOpen={inspectorOpen}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onClearMap={handleClearMap}
        onLoadPreset={handleLoadPreset}
        onToggleInspector={() => setInspectorOpen((o) => !o)}
        onToggleHud={() => setHudCollapsed((c) => !c)}
        onOpenJsonModal={() => setJsonModalOpen(true)}
      />

      <main className="relative flex-1 w-full overflow-hidden">
        <Viewport3D
          volumes={volumes}
          selectedId={selectedId}
          placementConfig={placementConfig}
          drawMode={drawMode}
          gizmoMode={gizmoMode}
          snapStep={snapStep}
          showGrid={showGrid}
          cameraPresetRequest={cameraPresetRequest}
          hoverDrawPaused={hoverDrawPaused}
          onSelectVolume={handleSelectVolume}
          onPlaceBatch={handlePlaceBatch}
          onDeleteVolume={handleDeleteVolume}
          onLiveTransform={handleLiveTransform}
          onCommitTransform={handleCommitTransform}
        />

        {/* Subtle 1-line control hint */}
        <div className="pointer-events-none fixed left-2 top-11 z-10 hidden sm:block rounded border border-[#00ff00]/20 bg-[#13161e]/85 px-2 py-0.5 text-[10px] text-[#00ff00]">
          {interactionHint}
        </div>

        <InspectorPanel
          open={inspectorOpen}
          activeTab={inspectorTab}
          placementConfig={placementConfig}
          selectedVolume={selectedVolume}
          undoStack={undoStack}
          redoStack={redoStack}
          onChangeTab={setInspectorTab}
          onChangeConfig={setPlacementConfig}
          onUpdateSelectedTransform={handleCommitTransform}
          onUpdateSelectedCategory={handleUpdateSelectedCategory}
          onUpdateSelectedProperties={handleUpdateSelectedProperties}
          onDuplicateSelected={handleDuplicateSelected}
          onDeleteSelected={handleDeleteVolume}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onCloseMobile={() => setInspectorOpen(false)}
        />

        <ToolDock
          drawMode={drawMode}
          gizmoMode={gizmoMode}
          snapStep={snapStep}
          showGrid={showGrid}
          collapsed={hudCollapsed}
          hoverDrawPaused={hoverDrawPaused}
          onChangeDrawMode={(mode) => {
            setDrawMode(mode);
            if (mode === 'hover') setHoverDrawPaused(false);
            if (mode !== 'select') setSelectedId(null);
          }}
          onChangeGizmoMode={setGizmoMode}
          onChangeSnapStep={setSnapStep}
          onToggleGrid={() => setShowGrid((g) => !g)}
          onSelectCameraPreset={(preset) =>
            setCameraPresetRequest((prev) => ({ preset, seq: (prev?.seq ?? 0) + 1 }))
          }
          onToggleCollapse={() => setHudCollapsed((c) => !c)}
          onToggleHoverPause={() => setHoverDrawPaused((p) => !p)}
        />
      </main>

      <JsonModal
        open={jsonModalOpen}
        volumes={volumes}
        onClose={() => setJsonModalOpen(false)}
        onImportVolumes={handleImportVolumes}
      />
    </div>
  );
}
