import React, { useEffect, useRef, useState } from 'react';
import {
  Undo2,
  Redo2,
  Code2,
  Trash2,
  Sparkles,
  PanelRight,
  ChevronDown,
} from 'lucide-react';
import { ARENA_PRESETS, ArenaPresetMeta } from '../utils/mapGenerators';

interface TopBarProps {
  volumeCount: number;
  canUndo: boolean;
  canRedo: boolean;
  lastUndoLabel?: string;
  lastRedoLabel?: string;
  hudCollapsed: boolean;
  inspectorOpen: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onClearMap: () => void;
  onLoadPreset: (preset: ArenaPresetMeta) => void;
  onToggleInspector: () => void;
  onToggleHud: () => void;
  onOpenJsonModal: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  volumeCount,
  canUndo,
  canRedo,
  lastUndoLabel,
  lastRedoLabel,
  hudCollapsed,
  inspectorOpen,
  onUndo,
  onRedo,
  onClearMap,
  onLoadPreset,
  onToggleInspector,
  onToggleHud,
  onOpenJsonModal,
}) => {
  const [arenaMenuOpen, setArenaMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!arenaMenuOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setArenaMenuOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setArenaMenuOpen(false);
    };
    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [arenaMenuOpen]);

  return (
    <header className="pointer-events-auto relative z-30 flex h-9 w-full items-center justify-between gap-1.5 sm:gap-3 border-b border-[#00ff00]/20 bg-[#13161e]/95 px-2 sm:px-3">
      {/* Zone 1: Single-element brand wordmark */}
      <div className="flex items-center gap-2 shrink-0 min-w-0">
        <span className="text-xs sm:text-sm font-bold tracking-tight text-[#00ff00] whitespace-nowrap shrink-0">
          The Beast Block
        </span>
        <span className="hidden md:inline text-[11px] text-[#00ff00]/75 font-mono-tabular whitespace-nowrap">
          {volumeCount} {volumeCount === 1 ? 'vol' : 'vols'} · -1..1
        </span>
      </div>

      {/* Zone 2: Concise workspace links & history actions */}
      <nav className="flex items-center gap-0.5 sm:gap-1">
        <button
          type="button"
          onClick={onUndo}
          disabled={!canUndo}
          aria-label="Undo"
          title={canUndo && lastUndoLabel ? `Undo: ${lastUndoLabel} (Ctrl+Z)` : 'Undo (Ctrl+Z)'}
          className="inline-flex h-7 min-w-[28px] items-center justify-center gap-1 rounded px-1.5 sm:px-2 text-[11px] font-medium text-[#00ff00] transition-colors hover:bg-[#00ff00]/15 disabled:opacity-35 disabled:pointer-events-none whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Undo2 className="h-3.5 w-3.5" />
          <span className="hidden md:inline">Undo</span>
        </button>

        <button
          type="button"
          onClick={onRedo}
          disabled={!canRedo}
          aria-label="Redo"
          title={canRedo && lastRedoLabel ? `Redo: ${lastRedoLabel} (Ctrl+Y)` : 'Redo (Ctrl+Y)'}
          className="inline-flex h-7 min-w-[28px] items-center justify-center gap-1 rounded px-1.5 sm:px-2 text-[11px] font-medium text-[#00ff00] transition-colors hover:bg-[#00ff00]/15 disabled:opacity-35 disabled:pointer-events-none whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Redo2 className="h-3.5 w-3.5" />
          <span className="hidden md:inline">Redo</span>
        </button>

        <span className="hidden md:inline-block h-3.5 w-px bg-[#00ff00]/20 mx-0.5" aria-hidden="true" />

        {/* Sample Arenas Dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setArenaMenuOpen((o) => !o)}
            aria-label="Sample Arenas"
            className={`inline-flex h-7 items-center gap-1 rounded px-1.5 sm:px-2 text-[11px] font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              arenaMenuOpen
                ? 'bg-[#00ff00]/20 text-[#00ff00]'
                : 'text-[#00ff00] hover:bg-[#00ff00]/15'
            }`}
          >
            <Sparkles className="h-3 w-3 text-[#00ff00]" />
            <span className="hidden sm:inline">Sample Arenas</span>
            <span className="sm:hidden">Arenas</span>
            <ChevronDown className="h-3 w-3 text-[#00ff00]/80" />
          </button>

          {arenaMenuOpen && (
            <div className="absolute right-0 sm:left-0 sm:right-auto top-full mt-1 w-[min(16.5rem,calc(100vw-0.75rem))] rounded-md border border-[#00ff00]/25 bg-[#161a24] p-1 shadow-2xl z-50">
              {ARENA_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => {
                    onLoadPreset(preset);
                    setArenaMenuOpen(false);
                  }}
                  className="flex w-full flex-col rounded px-2 py-1.5 text-left transition-colors hover:bg-[#00ff00]/15 cursor-pointer"
                >
                  <span className="text-[11px] font-semibold text-[#00ff00]">{preset.name}</span>
                  <span className="text-[10px] text-[#00ff00]/75 leading-tight">
                    {preset.description}
                  </span>
                </button>
              ))}
              <div className="sm:hidden mt-1 border-t border-[#00ff00]/20 pt-1">
                <button
                  type="button"
                  disabled={volumeCount === 0}
                  onClick={() => {
                    onClearMap();
                    setArenaMenuOpen(false);
                  }}
                  className="flex w-full items-center gap-1.5 rounded px-2 py-1.5 text-left text-[11px] font-medium text-rose-300 hover:bg-rose-500/15 disabled:opacity-35 cursor-pointer"
                >
                  <Trash2 className="h-3 w-3" />
                  <span>Clear Map</span>
                </button>
              </div>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={onClearMap}
          disabled={volumeCount === 0}
          aria-label="Clear map"
          title="Clear map"
          className="hidden sm:inline-flex h-7 items-center gap-1 rounded px-2 text-[11px] font-medium text-[#00ff00] transition-colors hover:bg-rose-500/15 hover:text-rose-200 disabled:opacity-35 disabled:pointer-events-none whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Trash2 className="h-3.5 w-3.5" />
          <span className="hidden md:inline">Clear</span>
        </button>

        <button
          type="button"
          onClick={onToggleInspector}
          aria-label="Toggle Inspector"
          title="Toggle Transform & History Panel"
          className={`inline-flex h-7 min-w-[28px] items-center justify-center gap-1 rounded px-1.5 sm:px-2 text-[11px] font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            inspectorOpen
              ? 'bg-[#00ff00]/20 text-[#00ff00]'
              : 'text-[#00ff00] hover:bg-[#00ff00]/15'
          }`}
        >
          <PanelRight className="h-3.5 w-3.5" />
          <span className="hidden lg:inline">Inspector</span>
        </button>

        <button
          type="button"
          onClick={onToggleHud}
          title="Toggle Dock (H)"
          className="hidden xl:inline-flex h-7 items-center rounded px-2 text-[11px] font-medium text-[#00ff00]/80 transition-colors hover:bg-[#00ff00]/15 hover:text-[#00ff00] whitespace-nowrap shrink-0 cursor-pointer"
        >
          {hudCollapsed ? 'Show Dock' : 'Hide Dock'}
        </button>
      </nav>

      {/* Zone 3: Single primary action */}
      <div className="flex items-center shrink-0">
        <button
          type="button"
          onClick={onOpenJsonModal}
          className="inline-flex h-7 items-center gap-1 rounded bg-[#00ff00] px-2 sm:px-2.5 text-[11px] font-bold text-black transition-colors hover:bg-[#00ff00]/85 whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Code2 className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Export JSON</span>
          <span className="sm:hidden">JSON</span>
        </button>
      </div>
    </header>
  );
};
