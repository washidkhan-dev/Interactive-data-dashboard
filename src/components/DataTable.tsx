import React, { useState, useMemo } from 'react';
import { ColumnDef } from '../types/data';
import { formatValue } from '../utils/dataParser';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Plus,
  Trash2,
  FileSpreadsheet,
  Columns3,
} from 'lucide-react';

interface DataTableProps {
  rows: Record<string, any>[];
  columns: ColumnDef[];
  onAddRow: (row: Record<string, any>) => void;
  onDeleteRow: (index: number) => void;
}

export const DataTable: React.FC<DataTableProps> = ({
  rows,
  columns,
  onAddRow,
  onDeleteRow,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newRowData, setNewRowData] = useState<Record<string, any>>({});
  const [visibleColKeys, setVisibleColKeys] = useState<string[]>(columns.map((c) => c.key));

  // Sort logic
  const sortedRows = useMemo(() => {
    if (!sortCol) return rows;
    return [...rows].sort((a, b) => {
      const valA = a[sortCol];
      const valB = b[sortCol];
      if (valA === valB) return 0;
      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;

      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortDir === 'asc' ? valA - valB : valB - valA;
      }
      return sortDir === 'asc'
        ? String(valA).localeCompare(String(valB))
        : String(valB).localeCompare(String(valA));
    });
  }, [rows, sortCol, sortDir]);

  // Pagination logic
  const totalPages = Math.max(Math.ceil(sortedRows.length / pageSize), 1);
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedRows.slice(start, start + pageSize);
  }, [sortedRows, currentPage, pageSize]);

  const handleSort = (key: string) => {
    if (sortCol === key) {
      if (sortDir === 'asc') setSortDir('desc');
      else {
        setSortCol(null);
        setSortDir('asc');
      }
    } else {
      setSortCol(key);
      setSortDir('asc');
    }
  };

  const handleSaveNewRow = (e: React.FormEvent) => {
    e.preventDefault();
    const formatted: Record<string, any> = {};
    columns.forEach((col) => {
      const val = newRowData[col.key];
      if (col.type === 'number') {
        formatted[col.key] = Number(val) || 0;
      } else {
        formatted[col.key] = val || '';
      }
    });
    onAddRow(formatted);
    setShowAddModal(false);
    setNewRowData({});
  };

  const activeColumns = columns.filter((c) => visibleColKeys.includes(c.key));

  // Compute footer aggregations
  const totals = useMemo(() => {
    const acc: Record<string, { sum: number; count: number; avg: number }> = {};
    columns.forEach((col) => {
      if (col.type === 'number') {
        let sum = 0;
        let count = 0;
        rows.forEach((r) => {
          const v = Number(r[col.key]);
          if (!isNaN(v)) {
            sum += v;
            count++;
          }
        });
        acc[col.key] = {
          sum: Math.round(sum * 100) / 100,
          count,
          avg: count > 0 ? Math.round((sum / count) * 100) / 100 : 0,
        };
      }
    });
    return acc;
  }, [rows, columns]);

  return (
    <div className="space-y-4">
      {/* Table Action Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="w-4 h-4 text-indigo-400" />
          <h3 className="text-sm font-semibold text-slate-200">
            Tabular Record Explorer
          </h3>
          <span className="text-xs text-slate-500 font-mono tabular-nums">
            ({rows.length} total rows)
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Page size select */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span>Rows:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="rounded border border-slate-800 bg-slate-900 px-2 py-1 text-slate-200 focus:outline-none font-mono"
            >
              <option value={10}>10</option>
              <option value={15}>15</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>

          {/* Add Row Button */}
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500 transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Row</span>
          </button>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 select-none">
                <th className="py-3 px-3.5 w-12 text-center text-slate-500 font-mono">#</th>
                {activeColumns.map((col) => {
                  const isSorted = sortCol === col.key;
                  return (
                    <th
                      key={col.key}
                      onClick={() => handleSort(col.key)}
                      className="py-3 px-3.5 font-semibold cursor-pointer hover:text-slate-100 transition-colors whitespace-nowrap"
                    >
                      <div
                        className={`flex items-center gap-1.5 ${
                          col.type === 'number' ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <span>{col.label}</span>
                        {isSorted ? (
                          sortDir === 'asc' ? (
                            <ArrowUp className="w-3.5 h-3.5 text-indigo-400" />
                          ) : (
                            <ArrowDown className="w-3.5 h-3.5 text-indigo-400" />
                          )
                        ) : (
                          <ArrowUpDown className="w-3 h-3 text-slate-600 hover:text-slate-400" />
                        )}
                      </div>
                    </th>
                  );
                })}
                <th className="py-3 px-3.5 w-16 text-center text-slate-500">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800/60">
              {paginatedRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={activeColumns.length + 2}
                    className="py-12 text-center text-slate-500 text-xs"
                  >
                    No matching records found.
                  </td>
                </tr>
              ) : (
                paginatedRows.map((row, rIdx) => {
                  const globalIdx = (currentPage - 1) * pageSize + rIdx;
                  return (
                    <tr
                      key={rIdx}
                      className="hover:bg-slate-800/40 transition-colors group"
                    >
                      <td className="py-2.5 px-3.5 text-center font-mono tabular-nums text-slate-500 text-[11px]">
                        {globalIdx + 1}
                      </td>

                      {activeColumns.map((col) => {
                        const val = row[col.key];
                        return (
                          <td
                            key={col.key}
                            className={`py-2.5 px-3.5 truncate max-w-[220px] ${
                              col.type === 'number'
                                ? 'text-right font-mono tabular-nums text-slate-200 font-medium'
                                : col.type === 'date'
                                ? 'font-mono text-slate-300'
                                : 'text-slate-300'
                            }`}
                          >
                            {formatValue(val, col.format)}
                          </td>
                        );
                      })}

                      <td className="py-2.5 px-3.5 text-center">
                        <button
                          onClick={() => onDeleteRow(globalIdx)}
                          className="text-slate-500 hover:text-rose-400 p-1 rounded transition-colors opacity-0 group-hover:opacity-100"
                          title="Delete Row"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>

            {/* Aggregated Totals Footer */}
            {rows.length > 0 && (
              <tfoot>
                <tr className="border-t-2 border-slate-800 bg-slate-950/80 font-semibold text-slate-300">
                  <td className="py-3 px-3.5 text-center text-[10px] text-slate-500 uppercase tracking-wider font-mono">
                    Σ
                  </td>
                  {activeColumns.map((col, idx) => {
                    if (idx === 0 && col.type !== 'number') {
                      return (
                        <td key={col.key} className="py-3 px-3.5 text-slate-400 font-medium">
                          Total Summary ({rows.length} rows)
                        </td>
                      );
                    }
                    if (col.type === 'number' && totals[col.key]) {
                      const stat = totals[col.key];
                      return (
                        <td
                          key={col.key}
                          className="py-3 px-3.5 text-right font-mono tabular-nums text-indigo-300"
                        >
                          <div>{formatValue(stat.sum, col.format)}</div>
                          <div className="text-[10px] font-normal text-slate-500">
                            Avg: {formatValue(stat.avg, col.format)}
                          </div>
                        </td>
                      );
                    }
                    return <td key={col.key} className="py-3 px-3.5" />;
                  })}
                  <td className="py-3 px-3.5" />
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* Pagination bar */}
        <div className="flex items-center justify-between border-t border-slate-800 px-4 py-3 text-xs text-slate-400">
          <div className="font-mono tabular-nums text-slate-400">
            Page <span className="text-slate-200 font-medium">{currentPage}</span> of{' '}
            <span className="text-slate-200 font-medium">{totalPages}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="p-1.5 rounded border border-slate-800 bg-slate-950 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronsLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded border border-slate-800 bg-slate-950 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded border border-slate-800 bg-slate-950 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded border border-slate-800 bg-slate-950 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronsRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Add Row Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-semibold text-slate-100">Add New Record</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveNewRow} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto pr-1">
                {columns.map((col) => (
                  <div key={col.key} className="space-y-1">
                    <label className="text-xs font-medium text-slate-300">
                      {col.label}{' '}
                      <span className="text-[10px] text-slate-500">({col.type})</span>
                    </label>
                    <input
                      type={col.type === 'number' ? 'number' : col.type === 'date' ? 'date' : 'text'}
                      step={col.type === 'number' ? 'any' : undefined}
                      value={newRowData[col.key] || ''}
                      onChange={(e) =>
                        setNewRowData({ ...newRowData, [col.key]: e.target.value })
                      }
                      required={col.key === 'Product' || col.key === 'Price'}
                      className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-medium text-white hover:bg-indigo-500 transition-colors shadow"
                >
                  Insert Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
