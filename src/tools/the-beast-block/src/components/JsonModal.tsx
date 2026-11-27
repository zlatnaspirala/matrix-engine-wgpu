import React, { useMemo, useState } from 'react';
import { X, Copy, Check, Download, Upload, AlertCircle } from 'lucide-react';
import { BlockingVolume } from '../types/volume';
import { buildEngineExportPayload, parseImportedVolumes } from '../utils/snap';

interface JsonModalProps {
  open: boolean;
  volumes: BlockingVolume[];
  onClose: () => void;
  onImportVolumes: (volumes: BlockingVolume[]) => void;
}

export const JsonModal: React.FC<JsonModalProps> = ({
  open,
  volumes,
  onClose,
  onImportVolumes,
}) => {
  const [tab, setTab] = useState<'export' | 'import'>('export');
  const [copied, setCopied] = useState(false);
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState<string | null>(null);

  const exportJson = useMemo(() => {
    const payload = buildEngineExportPayload(volumes);
    return JSON.stringify(payload, null, 2);
  }, [volumes]);

  if (!open) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(exportJson);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Fallback ignored if clipboard blocked
    }
  };

  const handleDownload = () => {
    const blob = new Blob([exportJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `blocking-volumes-${volumes.length}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportSubmit = () => {
    try {
      const parsed = parseImportedVolumes(importText);
      setImportError(null);
      onImportVolumes(parsed);
      onClose();
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Invalid JSON payload');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const content = String(reader.result || '');
      setImportText(content);
      setImportError(null);
    };
    reader.readAsText(file);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-1.5 sm:p-3"
      role="dialog"
      aria-modal="true"
      aria-label="Engine JSON Export and Import"
    >
      <div className="flex max-h-[92vh] w-full max-w-2xl flex-col rounded-md border border-[#00ff00]/25 bg-[#151922] shadow-2xl">
        {/* Modal Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#00ff00]/20 px-3 py-2">
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-semibold text-[#00ff00]">Engine JSON</h2>
            <div className="flex items-center gap-0.5 rounded bg-[#0e1015] p-0.5">
              <button
                type="button"
                onClick={() => setTab('export')}
                className={`min-h-[26px] rounded px-2 py-0.5 text-[11px] font-medium cursor-pointer ${
                  tab === 'export'
                    ? 'bg-[#00ff00]/20 text-[#00ff00]'
                    : 'text-[#00ff00]/70 hover:text-[#00ff00]'
                }`}
              >
                Export ({volumes.length})
              </button>
              <button
                type="button"
                onClick={() => setTab('import')}
                className={`min-h-[26px] rounded px-2 py-0.5 text-[11px] font-medium cursor-pointer ${
                  tab === 'import'
                    ? 'bg-[#00ff00]/20 text-[#00ff00]'
                    : 'text-[#00ff00]/70 hover:text-[#00ff00]'
                }`}
              >
                Import
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="flex h-7 w-7 items-center justify-center rounded text-[#00ff00] hover:bg-[#00ff00]/15 cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Modal Body */}
        {tab === 'export' ? (
          <>
            <div className="border-b border-[#00ff00]/20 bg-[#11141c] px-3 py-1.5 text-[11px] text-[#00ff00]/80">
              Cube space <span className="font-mono-tabular text-[#00ff00]">[-1, 1]</span> ·
              Includes <span className="font-mono-tabular text-[#00ff00]">ambientColor</span>,{' '}
              <span className="font-mono-tabular text-[#00ff00]">isBlend / blendAlpha</span>,{' '}
              <span className="font-mono-tabular text-[#00ff00]">physics</span>, and{' '}
              <span className="font-mono-tabular text-[#00ff00]">filePath / texPath</span>
            </div>
            <div className="flex-1 overflow-auto p-2 sm:p-3">
              <pre className="rounded border border-[#00ff00]/20 bg-[#0c0e13] p-2.5 text-[11px] font-mono-tabular text-[#00ff00] leading-snug overflow-x-auto">
                {exportJson}
              </pre>
            </div>
            <div className="flex items-center justify-end gap-1.5 border-t border-[#00ff00]/20 px-3 py-2">
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex min-h-[30px] items-center gap-1 rounded border border-[#00ff00]/25 bg-[#0e1015] px-2.5 py-1 text-[11px] font-medium text-[#00ff00] hover:bg-[#00ff00]/15 cursor-pointer"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-[#00ff00]" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copied ? 'Copied' : 'Copy JSON'}</span>
              </button>
              <button
                type="button"
                onClick={handleDownload}
                className="inline-flex min-h-[30px] items-center gap-1 rounded bg-[#00ff00] px-3 py-1 text-[11px] font-bold text-black hover:bg-[#00ff00]/85 cursor-pointer"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Download .json</span>
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="flex-1 space-y-2 overflow-auto p-2.5 sm:p-3">
              <div className="flex flex-wrap items-center justify-between gap-1.5">
                <p className="text-[11px] text-[#00ff00]">
                  Paste exported blocking-volumes JSON or upload a `.json` file.
                </p>
                <label className="inline-flex min-h-[28px] items-center gap-1 rounded border border-[#00ff00]/25 bg-[#0e1015] px-2.5 py-1 text-[11px] font-medium text-[#00ff00] hover:bg-[#00ff00]/15 cursor-pointer">
                  <Upload className="h-3 w-3" />
                  <span>Load File</span>
                  <input
                    type="file"
                    accept=".json,application/json"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
              <textarea
                value={importText}
                onChange={(e) => {
                  setImportText(e.target.value);
                  setImportError(null);
                }}
                placeholder='{"format": "blocking-volumes-v1", "volumes": [...]}'
                rows={10}
                className="w-full rounded border border-[#00ff00]/20 bg-[#0c0e13] p-2.5 text-[11px] font-mono-tabular text-[#00ff00] outline-none focus:border-[#00ff00]"
              />
              {importError && (
                <div className="flex items-center gap-1.5 rounded border border-rose-500/40 bg-rose-500/10 px-2.5 py-1.5 text-[11px] text-rose-200">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  <span>{importError}</span>
                </div>
              )}
            </div>
            <div className="flex items-center justify-end gap-1.5 border-t border-[#00ff00]/20 px-3 py-2">
              <button
                type="button"
                onClick={onClose}
                className="min-h-[30px] rounded border border-[#00ff00]/25 px-2.5 py-1 text-[11px] font-medium text-[#00ff00] hover:bg-[#00ff00]/15 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleImportSubmit}
                disabled={!importText.trim()}
                className="min-h-[30px] rounded bg-[#00ff00] px-3 py-1 text-[11px] font-bold text-black hover:bg-[#00ff00]/85 disabled:opacity-40 cursor-pointer"
              >
                Import Map
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
