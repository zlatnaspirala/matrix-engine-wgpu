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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-2 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Engine JSON Export and Import"
    >
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-lg border border-lime-400/20 bg-[#151922] shadow-2xl">
        {/* Modal Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-lime-400/15 px-4 sm:px-5 py-3">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <h2 className="text-sm font-semibold text-lime-200">Engine JSON</h2>
            <div className="flex items-center gap-1 rounded-md bg-[#0e1015] p-0.5">
              <button
                type="button"
                onClick={() => setTab('export')}
                className={`min-h-[34px] rounded px-2.5 py-1 text-xs font-medium cursor-pointer ${
                  tab === 'export'
                    ? 'bg-lime-400/20 text-lime-200'
                    : 'text-lime-400/75 hover:text-lime-200'
                }`}
              >
                Export ({volumes.length})
              </button>
              <button
                type="button"
                onClick={() => setTab('import')}
                className={`min-h-[34px] rounded px-2.5 py-1 text-xs font-medium cursor-pointer ${
                  tab === 'import'
                    ? 'bg-lime-400/20 text-lime-200'
                    : 'text-lime-400/75 hover:text-lime-200'
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
            className="flex h-9 w-9 items-center justify-center rounded text-lime-300 hover:bg-lime-400/10 hover:text-lime-200 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Body */}
        {tab === 'export' ? (
          <>
            <div className="border-b border-lime-400/15 bg-[#11141c] px-4 sm:px-5 py-2.5 text-xs text-lime-400/80">
              Natural cube space <span className="font-mono-tabular text-lime-200">[-1, 1]</span>{' '}
              per axis · World half-extents match <span className="font-mono-tabular text-lime-200">scale</span> · Right-handed Y-up
            </div>
            <div className="flex-1 overflow-auto p-3 sm:p-5">
              <pre className="rounded-md border border-lime-400/15 bg-[#0c0e13] p-3 sm:p-4 text-xs font-mono-tabular text-lime-300 leading-relaxed overflow-x-auto">
                {exportJson}
              </pre>
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-lime-400/15 px-4 sm:px-5 py-3">
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-md border border-lime-400/20 bg-[#0e1015] px-3.5 py-1.5 text-xs font-medium text-lime-200 hover:bg-lime-400/10 cursor-pointer"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-lime-300" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copied ? 'Copied' : 'Copy JSON'}</span>
              </button>
              <button
                type="button"
                onClick={handleDownload}
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-md bg-lime-400 px-4 py-1.5 text-xs font-semibold text-slate-950 hover:bg-lime-300 cursor-pointer"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Download .json</span>
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="flex-1 space-y-3 overflow-auto p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-lime-300">
                  Paste exported blocking-volumes JSON or upload a `.json` file.
                </p>
                <label className="inline-flex min-h-[38px] items-center gap-1.5 rounded border border-lime-400/20 bg-[#0e1015] px-3 py-1.5 text-xs font-medium text-lime-200 hover:bg-lime-400/10 cursor-pointer">
                  <Upload className="h-3.5 w-3.5" />
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
                className="w-full rounded-md border border-lime-400/15 bg-[#0c0e13] p-3 text-xs font-mono-tabular text-lime-200 outline-none focus:border-lime-400/75"
              />
              {importError && (
                <div className="flex items-center gap-2 rounded border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{importError}</span>
                </div>
              )}
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-lime-400/15 px-4 sm:px-5 py-3">
              <button
                type="button"
                onClick={onClose}
                className="min-h-[40px] rounded-md border border-lime-400/20 px-3.5 py-1.5 text-xs font-medium text-lime-300 hover:bg-lime-400/10 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleImportSubmit}
                disabled={!importText.trim()}
                className="min-h-[40px] rounded-md bg-lime-400 px-4 py-1.5 text-xs font-semibold text-slate-950 hover:bg-lime-300 disabled:opacity-40 cursor-pointer"
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
