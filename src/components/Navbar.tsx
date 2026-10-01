import React from 'react';
import { Upload, Download, Database, ChevronDown } from 'lucide-react';
import { Dataset } from '../types/data';

interface NavbarProps {
  activeTab: 'overview' | 'studio' | 'table';
  setActiveTab: (tab: 'overview' | 'studio' | 'table') => void;
  datasets: Dataset[];
  currentDataset: Dataset;
  onSelectDataset: (id: string) => void;
  onOpenImport: () => void;
  onOpenExport: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  datasets,
  currentDataset,
  onSelectDataset,
  onOpenImport,
  onOpenExport,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-6">
          <a
            href="/"
            className="text-base font-bold tracking-tight text-white hover:text-indigo-400 transition-colors whitespace-nowrap"
          >
            OmniView Analytics
          </a>

          {/* Dataset Switcher Dropdown */}
          <div className="relative hidden md:flex items-center">
            <Database className="w-3.5 h-3.5 text-slate-500 mr-1.5" />
            <select
              value={currentDataset.id}
              onChange={(e) => onSelectDataset(e.target.value)}
              className="appearance-none rounded-lg border border-slate-800 bg-slate-900/90 py-1 pl-2 pr-7 text-xs font-medium text-slate-200 hover:border-slate-700 focus:border-indigo-500 focus:outline-none cursor-pointer max-w-[210px] truncate"
            >
              {datasets.map((ds) => (
                <option key={ds.id} value={ds.id}>
                  {ds.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 pointer-events-none" />
          </div>
        </div>

        {/* Zone 2: 3-5 clean navigation links / tabs */}
        <nav className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
              activeTab === 'overview'
                ? 'bg-slate-800 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('studio')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
              activeTab === 'studio'
                ? 'bg-slate-800 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Chart Studio
          </button>
          <button
            onClick={() => setActiveTab('table')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
              activeTab === 'table'
                ? 'bg-slate-800 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Data Explorer
          </button>
        </nav>

        {/* Zone 3: 1-2 primary actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenExport}
            className="hidden sm:flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export</span>
          </button>

          <button
            onClick={onOpenImport}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-indigo-500 transition-colors shadow-sm whitespace-nowrap"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import Data</span>
          </button>
        </div>
      </div>
    </header>
  );
};
