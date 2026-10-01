import React, { useState } from 'react';
import { exportToCSV } from '../utils/dataParser';
import { Download, Copy, Check, X, FileSpreadsheet, FileJson } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  rows: Record<string, any>[];
  datasetName: string;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  rows,
  datasetName,
}) => {
  const [copiedType, setCopiedType] = useState<'csv' | 'json' | null>(null);

  if (!isOpen) return null;

  const handleDownloadCSV = () => {
    const csvContent = exportToCSV(rows);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${datasetName.toLowerCase().replace(/\s+/g, '_')}_export.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadJSON = () => {
    const jsonContent = JSON.stringify(rows, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${datasetName.toLowerCase().replace(/\s+/g, '_')}_export.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleCopy = (type: 'csv' | 'json') => {
    const content = type === 'csv' ? exportToCSV(rows) : JSON.stringify(rows, null, 2);
    navigator.clipboard.writeText(content);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
            <Download className="w-4 h-4 text-indigo-400" />
            <span>Export Data Records</span>
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-400">
          Exporting <strong className="text-slate-200">{rows.length}</strong> active records from{' '}
          <em>"{datasetName}"</em>.
        </p>

        <div className="space-y-3">
          {/* CSV Export Option */}
          <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950 p-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-200">CSV Spreadsheet</div>
                <div className="text-[11px] text-slate-500">Comma-separated values (.csv)</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleCopy('csv')}
                className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200"
                title="Copy to clipboard"
              >
                {copiedType === 'csv' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
              <button
                onClick={handleDownloadCSV}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-colors"
              >
                Download
              </button>
            </div>
          </div>

          {/* JSON Export Option */}
          <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950 p-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                <FileJson className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-200">JSON Objects</div>
                <div className="text-[11px] text-slate-500">Raw JSON array of records (.json)</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleCopy('json')}
                className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200"
                title="Copy to clipboard"
              >
                {copiedType === 'json' ? <Check className="w-4 h-4 text-indigo-400" /> : <Copy className="w-4 h-4" />}
              </button>
              <button
                onClick={handleDownloadJSON}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors"
              >
                Download
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-3 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs text-slate-400 hover:text-slate-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
