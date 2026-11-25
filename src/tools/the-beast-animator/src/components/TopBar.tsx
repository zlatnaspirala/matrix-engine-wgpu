import type { MotionSourceMode } from '../types/mocap';

interface TopBarProps {
  mode: MotionSourceMode;
  onSelectMode: (mode: MotionSourceMode) => void;
  canExport: boolean;
  exportClipCount: number;
  isExporting: boolean;
  onExportGlb: () => void;
}

const NAV_ITEMS: { id: MotionSourceMode; label: string; shortLabel: string }[] = [
  { id: 'lab', label: 'Motion Lab', shortLabel: 'Lab' },
  { id: 'live', label: 'Live Capture', shortLabel: 'Cam' },
  { id: 'face', label: 'Face Rig', shortLabel: 'Face' },
  { id: 'video', label: 'Video Track', shortLabel: 'Video' },
  { id: 'bvh', label: 'BVH Inspector', shortLabel: 'BVH' },
];

export function TopBar({
  mode,
  onSelectMode,
  canExport,
  exportClipCount,
  isExporting,
  onExportGlb,
}: TopBarProps) {
  return (
    <header className="h-12 sm:h-14 shrink-0 px-3 sm:px-6 bg-[#0E1117] border-b border-[#1E2430] flex items-center justify-between gap-2 sm:gap-8 z-30">
      {/* Zone 1: Brand Wordmark */}
      <a
        href="#top"
        onClick={(e) => {
          e.preventDefault();
          onSelectMode('lab');
        }}
        className="font-display text-xs sm:text-base font-semibold tracking-tight text-[#F3F5F8] whitespace-nowrap shrink-0"
      >
        The Beast animator
      </a>

      {/* Zone 2: Clean single-line text navigation links (scrollbar hidden) */}
      <nav
        aria-label="Workspace modes"
        className="flex items-center gap-3 sm:gap-6 overflow-x-auto scrollbar-none min-w-0"
      >
        {NAV_ITEMS.map((item) => {
          const active = mode === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectMode(item.id)}
              className={`relative py-1.5 text-xs sm:text-sm font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 rounded-sm ${
                active
                  ? 'text-[#F3F5F8]'
                  : 'text-[#8B94A5] hover:text-[#D0D7E2]'
              }`}
            >
              <span className="sm:hidden">{item.shortLabel}</span>
              <span className="hidden sm:inline">{item.label}</span>
              {active && (
                <span className="absolute left-0 right-0 -bottom-[9px] sm:-bottom-[11px] h-[2px] bg-amber-500" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Zone 3: Primary Multi-Clip GLB Export action */}
      <div className="flex items-center shrink-0">
        <button
          type="button"
          onClick={onExportGlb}
          disabled={!canExport || isExporting}
          className={`px-2.5 sm:px-4 py-1.5 sm:py-2 text-[11px] sm:text-xs font-semibold rounded-lg whitespace-nowrap shrink-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
            canExport && !isExporting
              ? 'bg-amber-500 text-[#0B0D11] hover:bg-amber-400 cursor-pointer'
              : 'bg-[#1B202B] text-[#646E80] cursor-not-allowed'
          }`}
        >
          <span className="sm:hidden">
            {isExporting ? '...' : exportClipCount > 1 ? `GLB(${exportClipCount})` : 'GLB'}
          </span>
          <span className="hidden sm:inline">
            {isExporting
              ? 'Exporting GLB...'
              : exportClipCount > 1
                ? `Export GLB (${exportClipCount} Clips)`
                : 'Export GLB'}
          </span>
        </button>
      </div>
    </header>
  );
}
