import React, { useState } from 'react';
import { Dataset, ColumnDef } from '../types/data';
import { parseCSV, parseJSON, formatValue } from '../utils/dataParser';
import { Upload, FileText, CheckCircle2, AlertCircle, X, Sparkles } from 'lucide-react';
import { USER_ORDERS_DATASET } from '../data/userOrdersData';

interface DataImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (newDataset: Dataset) => void;
}

export const DataImportModal: React.FC<DataImportModalProps> = ({
  isOpen,
  onClose,
  onImport,
}) => {
  const [activeTab, setActiveTab] = useState<'paste' | 'upload'>('paste');
  const [rawText, setRawText] = useState<string>('');
  const [datasetName, setDatasetName] = useState<string>('Custom Uploaded Dataset');
  const [parsedRows, setParsedRows] = useState<Record<string, any>[] | null>(null);
  const [parsedCols, setParsedCols] = useState<ColumnDef[] | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleParse = (text: string) => {
    setParseError(null);
    if (!text.trim()) {
      setParsedRows(null);
      setParsedCols(null);
      return;
    }

    try {
      const trimmed = text.trim();
      let result: { rows: Record<string, any>[]; columns: ColumnDef[] };

      if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
        result = parseJSON(trimmed);
      } else {
        result = parseCSV(trimmed);
      }

      if (result.rows.length === 0) {
        setParseError('No rows could be extracted. Please check the delimiter or data format.');
        setParsedRows(null);
        setParsedCols(null);
      } else {
        setParsedRows(result.rows);
        setParsedCols(result.columns);
      }
    } catch (err: any) {
      setParseError(err.message || 'Failed to parse text. Please ensure valid CSV or JSON syntax.');
      setParsedRows(null);
      setParsedCols(null);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setDatasetName(file.name.replace(/\.[^/.]+$/, ''));
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setRawText(content);
      handleParse(content);
    };
    reader.readAsText(file);
  };

  const handleApply = () => {
    if (!parsedRows || !parsedCols || parsedRows.length === 0) return;

    const defaultDim = parsedCols.find((c) => c.type === 'string')?.key || parsedCols[0].key;
    const defaultMet = parsedCols.find((c) => c.type === 'number')?.key || parsedCols[0].key;
    const defaultDate = parsedCols.find((c) => c.type === 'date')?.key;

    const newDataset: Dataset = {
      id: `custom_${Date.now()}`,
      name: datasetName || 'Imported Custom Dataset',
      description: `Imported dataset containing ${parsedRows.length} records and ${parsedCols.length} columns.`,
      category: 'User Custom Data',
      columns: parsedCols,
      rows: parsedRows,
      defaultDimension: defaultDim,
      defaultMetric: defaultMet,
      defaultDateColumn: defaultDate,
    };

    onImport(newDataset);
    onClose();
  };

  const handleLoadUserOrdersPreset = () => {
    onImport(USER_ORDERS_DATASET);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-3xl rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl p-6 space-y-5 my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
              <Upload className="w-4 h-4 text-indigo-400" />
              <span>Import & Visualize Your Own Data</span>
            </h2>
            <p className="text-xs text-slate-400">
              Paste or upload CSV, TSV, or JSON. OmniView automatically classifies dimensions, metrics, and dates.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Preset shortcut */}
        <div className="flex items-center justify-between rounded-xl border border-indigo-900/50 bg-indigo-950/30 p-3 text-xs">
          <div className="flex items-center gap-2.5 text-indigo-200">
            <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>
              Reset to the <strong>Apparel Orders Dataset</strong> provided with 105 transactions?
            </span>
          </div>
          <button
            onClick={handleLoadUserOrdersPreset}
            className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500 transition-colors shrink-0"
          >
            Load Apparel Orders
          </button>
        </div>

        {/* Tab selection */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
          <button
            onClick={() => setActiveTab('paste')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              activeTab === 'paste'
                ? 'bg-slate-800 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Paste CSV / TSV / JSON Text
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              activeTab === 'upload'
                ? 'bg-slate-800 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Upload File (.csv, .json)
          </button>
        </div>

        {/* Input Area */}
        {activeTab === 'paste' ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <label>Raw Data (paste table with headers):</label>
              <button
                onClick={() => {
                  const sample = `Category,Product,Units,Revenue,Margin\nElectronics,Smartphone,120,72000,34.5\nElectronics,Noise Cancelling Headphones,95,28500,42.0\nApparel,Merino Wool Sweater,140,16800,55.0\nApparel,Waterproof Jacket,85,18700,48.0\nHome,Espresso Machine,45,22500,38.0`;
                  setRawText(sample);
                  handleParse(sample);
                }}
                className="text-indigo-400 hover:underline text-[11px]"
              >
                Insert Sample Data
              </button>
            </div>
            <textarea
              rows={6}
              value={rawText}
              onChange={(e) => {
                setRawText(e.target.value);
                handleParse(e.target.value);
              }}
              placeholder={`Order Number\tProduct\tPrice\tDate\tPayment Method\nTT-1001\tSlim-Fit Denim Jeans\t$88.00\t2025-08-15\tCredit Card`}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 font-mono text-xs text-slate-200 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        ) : (
          <div className="space-y-3">
            <label className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-700 bg-slate-950/60 p-8 text-center cursor-pointer hover:border-indigo-500 transition-colors">
              <Upload className="w-8 h-8 text-slate-400 mb-2" />
              <span className="text-xs font-medium text-slate-200">
                Click to browse or drop your CSV or JSON file here
              </span>
              <span className="text-[11px] text-slate-500 mt-1">
                Supports Comma, Tab, or Semicolon separated files
              </span>
              <input
                type="file"
                accept=".csv,.tsv,.json,.txt"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
        )}

        {/* Dataset Label Input */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-300">Dataset Title</label>
          <input
            type="text"
            value={datasetName}
            onChange={(e) => setDatasetName(e.target.value)}
            className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
          />
        </div>

        {/* Error message */}
        {parseError && (
          <div className="flex items-center gap-2 rounded-lg bg-rose-950/50 border border-rose-800 p-3 text-xs text-rose-300">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{parseError}</span>
          </div>
        )}

        {/* Parse Preview */}
        {parsedRows && parsedCols && (
          <div className="space-y-2 rounded-xl border border-slate-800 bg-slate-950/80 p-3.5">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                <CheckCircle2 className="w-4 h-4" />
                <span>Successfully parsed {parsedRows.length} rows</span>
              </span>
              <span className="font-mono text-slate-400 text-[11px]">
                {parsedCols.length} columns detected
              </span>
            </div>

            {/* Column Schema tags */}
            <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-800">
              {parsedCols.map((c) => (
                <div
                  key={c.key}
                  className="flex items-center gap-1.5 rounded bg-slate-800/80 px-2 py-1 text-[11px] text-slate-300"
                >
                  <span className="font-medium">{c.label}</span>
                  <span className="font-mono text-[10px] text-indigo-400 uppercase">
                    [{c.type}]
                  </span>
                </div>
              ))}
            </div>

            {/* First 3 sample rows */}
            <div className="overflow-x-auto pt-2">
              <table className="w-full text-left text-[11px]">
                <thead>
                  <tr className="text-slate-500 border-b border-slate-800">
                    {parsedCols.slice(0, 5).map((c) => (
                      <th key={c.key} className="pb-1 pr-3 font-medium">
                        {c.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40 text-slate-300">
                  {parsedRows.slice(0, 3).map((row, i) => (
                    <tr key={i}>
                      {parsedCols.slice(0, 5).map((c) => (
                        <td key={c.key} className="py-1 pr-3 truncate max-w-[150px]">
                          {formatValue(row[c.key], c.format)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            disabled={!parsedRows || parsedRows.length === 0}
            className="rounded-lg bg-indigo-600 px-5 py-2 text-xs font-medium text-white hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            Apply & Launch Visualization
          </button>
        </div>
      </div>
    </div>
  );
};
