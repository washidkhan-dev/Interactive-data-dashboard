import React from 'react';
import { Search, X, RotateCcw, Calendar, Filter } from 'lucide-react';
import { ColumnDef, FilterState } from '../types/data';

interface FilterBarProps {
  columns: ColumnDef[];
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  onReset: () => void;
  totalCount: number;
  filteredCount: number;
  dateColumn?: ColumnDef;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  columns,
  filters,
  onFilterChange,
  onReset,
  totalCount,
  filteredCount,
  dateColumn,
}) => {
  const hasActiveFilters =
    filters.search !== '' ||
    filters.dateRange.start !== '' ||
    filters.dateRange.end !== '' ||
    Object.values(filters.categoryFilter).some((arr) => arr.length > 0);

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 backdrop-blur-md space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search orders, products, payment methods..."
            value={filters.search}
            onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
            className="w-full rounded-lg border border-slate-800 bg-slate-950/70 pl-9 pr-8 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
          />
          {filters.search && (
            <button
              onClick={() => onFilterChange({ ...filters, search: '' })}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Date Range if present */}
        {dateColumn && (
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="flex items-center gap-1.5 text-slate-400">
              <Calendar className="w-3.5 h-3.5" />
              <span>Date:</span>
            </span>
            <input
              type="date"
              value={filters.dateRange.start}
              onChange={(e) =>
                onFilterChange({
                  ...filters,
                  dateRange: { ...filters.dateRange, start: e.target.value },
                })
              }
              className="rounded-md border border-slate-800 bg-slate-950/80 px-2 py-1 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none font-mono"
            />
            <span>to</span>
            <input
              type="date"
              value={filters.dateRange.end}
              onChange={(e) =>
                onFilterChange({
                  ...filters,
                  dateRange: { ...filters.dateRange, end: e.target.value },
                })
              }
              className="rounded-md border border-slate-800 bg-slate-950/80 px-2 py-1 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none font-mono"
            />
          </div>
        )}

        {/* Filter Stats & Reset */}
        <div className="flex items-center gap-3 ml-auto text-xs">
          <span className="text-slate-400 font-mono tabular-nums">
            Showing <strong className="text-slate-100">{filteredCount}</strong> of{' '}
            <strong className="text-slate-100">{totalCount}</strong> records
          </span>

          {hasActiveFilters && (
            <button
              onClick={onReset}
              className="flex items-center gap-1 rounded-md border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
