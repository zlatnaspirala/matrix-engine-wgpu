import { useState } from 'react';
import { Check, Copy, Download } from 'lucide-react';
import type { BoneNamingScheme } from '../types/mocap';

interface BvhInspectorOverlayProps {
  bvhText: string;
  frameCount: number;
  fps: number;
  namingScheme: BoneNamingScheme;
  onDownloadBvh: () => void;
  onDownloadGlb: () => void;
}

export function BvhInspectorOverlay({
  bvhText,
  frameCount,
  fps,
  namingScheme,
  onDownloadBvh,
  onDownloadGlb,
}: BvhInspectorOverlayProps) {
  const [copied, setCopied] = useState(false);

  const lines = bvhText ? bvhText.split('\n') : [];
  const previewText =
    lines.length > 140
      ? [...lines.slice(0, 120), `\n... (${lines.length - 120} more motion lines)`].join('\n')
      : bvhText;

  const handleCopy = async () => {
    if (!bvhText) return;
    await navigator.clipboard.writeText(bvhText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <aside
      aria-label="BVH hierarchy inspector"
      className="absolute top-4 right-4 bottom-36 w-[380px] max-w-[calc(100vw-32px)] z-10 bg-[#12161F]/95 border border-[#232A38] rounded-xl shadow-2xl flex flex-col overflow-hidden"
    >
      <div className="px-4 py-3 border-b border-[#1E2430] flex items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-[#F3F5F8]">
            BVH Hierarchy & Motion
          </h2>
          <p className="text-[11px] font-mono tabular-nums text-[#8B94A5] mt-0.5">
            {frameCount} Frames · {fps} FPS · 22 Mixamo Joints · {namingScheme}
          </p>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          disabled={!bvhText}
          className="px-2.5 py-1.5 text-xs font-medium rounded-md bg-[#1A202C] border border-[#2A3244] text-[#D0D7E2] hover:text-amber-300 flex items-center gap-1.5 shrink-0 cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      <div className="flex-1 overflow-auto p-3 bg-[#0A0C10]">
        {bvhText ? (
          <pre className="text-[11px] leading-relaxed font-mono text-[#A6B0C2] whitespace-pre">
            {previewText}
          </pre>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center px-6">
            <p className="text-xs font-medium text-[#D0D7E2]">
              No Motion Take Recorded
            </p>
            <p className="text-[11px] text-[#7D8799] mt-1">
              Record a clip in Motion Lab, Live Capture, or Video Track to inspect and verify the BVH hierarchy here.
            </p>
          </div>
        )}
      </div>

      {bvhText && (
        <div className="px-4 py-2.5 border-t border-[#1E2430] flex items-center justify-between gap-2 bg-[#12161F]">
          <button
            type="button"
            onClick={onDownloadBvh}
            className="flex-1 py-1.5 text-xs font-medium rounded-lg bg-[#1A202C] border border-[#2B3344] text-[#E2E8F0] hover:border-amber-500/60 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download .BVH</span>
          </button>
          <button
            type="button"
            onClick={onDownloadGlb}
            className="flex-1 py-1.5 text-xs font-semibold rounded-lg bg-amber-500 text-[#0B0D11] hover:bg-amber-400 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download .GLB</span>
          </button>
        </div>
      )}
    </aside>
  );
}
