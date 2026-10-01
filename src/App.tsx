/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Dataset, FilterState } from './types/data';
import { USER_ORDERS_DATASET } from './data/userOrdersData';
import { DEFAULT_DATASETS } from './data/defaultDatasets';
import { Navbar } from './components/Navbar';
import { FilterBar } from './components/FilterBar';
import { ExecutiveOverview } from './components/ExecutiveOverview';
import { ChartStudio } from './components/ChartStudio';
import { DataTable } from './components/DataTable';
import { DataImportModal } from './components/DataImportModal';
import { ExportModal } from './components/ExportModal';

export default function App() {
  const [datasets, setDatasets] = useState<Dataset[]>([
    USER_ORDERS_DATASET,
    ...DEFAULT_DATASETS,
  ]);
  const [currentDatasetId, setCurrentDatasetId] = useState<string>(USER_ORDERS_DATASET.id);
  const [activeTab, setActiveTab] = useState<'overview' | 'studio' | 'table'>('overview');

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Active dataset
  const currentDataset = useMemo(() => {
    return datasets.find((d) => d.id === currentDatasetId) || datasets[0];
  }, [datasets, currentDatasetId]);

  // Dynamic filter state
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    dateRange: { start: '', end: '' },
    categoryFilter: {},
    metricThresholds: {},
  });

  const handleResetFilters = () => {
    setFilters({
      search: '',
      dateRange: { start: '', end: '' },
      categoryFilter: {},
      metricThresholds: {},
    });
  };

  const handleSelectDataset = (id: string) => {
    setCurrentDatasetId(id);
    handleResetFilters();
  };

  const handleImportNewDataset = (newDataset: Dataset) => {
    setDatasets((prev) => [newDataset, ...prev]);
    setCurrentDatasetId(newDataset.id);
    handleResetFilters();
  };

  // Add / Delete rows in active dataset
  const handleAddRow = (row: Record<string, any>) => {
    setDatasets((prev) =>
      prev.map((d) => {
        if (d.id === currentDataset.id) {
          return {
            ...d,
            rows: [row, ...d.rows],
          };
        }
        return d;
      })
    );
  };

  const handleDeleteRow = (index: number) => {
    setDatasets((prev) =>
      prev.map((d) => {
        if (d.id === currentDataset.id) {
          const newRows = [...d.rows];
          newRows.splice(index, 1);
          return {
            ...d,
            rows: newRows,
          };
        }
        return d;
      })
    );
  };

  // Filtered rows calculation
  const dateCol = currentDataset.columns.find((c) => c.type === 'date');

  const filteredRows = useMemo(() => {
    return currentDataset.rows.filter((row) => {
      // 1. Text search across all fields
      if (filters.search) {
        const query = filters.search.toLowerCase();
        const matches = Object.values(row).some((val) =>
          String(val).toLowerCase().includes(query)
        );
        if (!matches) return false;
      }

      // 2. Date Range
      if (dateCol) {
        const rowDate = String(row[dateCol.key] || '');
        if (filters.dateRange.start && rowDate < filters.dateRange.start) {
          return false;
        }
        if (filters.dateRange.end && rowDate > filters.dateRange.end) {
          return false;
        }
      }

      return true;
    });
  }, [currentDataset.rows, filters, dateCol]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Bar Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        datasets={datasets}
        currentDataset={currentDataset}
        onSelectDataset={handleSelectDataset}
        onOpenImport={() => setIsImportModalOpen(true)}
        onOpenExport={() => setIsExportModalOpen(true)}
      />

      {/* Main Workspace Body */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 sm:px-6 py-6 space-y-6">
        {/* Dataset Header Banner with Info */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/40 p-4 backdrop-blur-md">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-100 tracking-tight">
                {currentDataset.name}
              </h1>
              <span className="text-xs text-slate-400 font-mono">
                · {currentDataset.rows.length} records · {currentDataset.columns.length} columns
              </span>
            </div>
            <p className="text-xs text-slate-400 max-w-3xl">
              {currentDataset.description}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                activeTab === 'overview'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Executive Board
            </button>
            <button
              onClick={() => setActiveTab('studio')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                activeTab === 'studio'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Chart Studio
            </button>
            <button
              onClick={() => setActiveTab('table')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                activeTab === 'table'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Data Explorer
            </button>
          </div>
        </div>

        {/* Global Filter & Query Bar */}
        <FilterBar
          columns={currentDataset.columns}
          filters={filters}
          onFilterChange={setFilters}
          onReset={handleResetFilters}
          totalCount={currentDataset.rows.length}
          filteredCount={filteredRows.length}
          dateColumn={dateCol}
        />

        {/* Active View Switch */}
        {activeTab === 'overview' && (
          <ExecutiveOverview
            dataset={currentDataset}
            filteredRows={filteredRows}
            onNavigateToStudio={() => setActiveTab('studio')}
          />
        )}

        {activeTab === 'studio' && (
          <ChartStudio
            dataset={currentDataset}
            filteredRows={filteredRows}
          />
        )}

        {activeTab === 'table' && (
          <DataTable
            rows={filteredRows}
            columns={currentDataset.columns}
            onAddRow={handleAddRow}
            onDeleteRow={handleDeleteRow}
          />
        )}
      </main>

      {/* Modals */}
      <DataImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleImportNewDataset}
      />

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        rows={filteredRows}
        datasetName={currentDataset.name}
      />
    </div>
  );
}
