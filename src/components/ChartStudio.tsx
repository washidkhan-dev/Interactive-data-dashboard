import React, { useState } from 'react';
import { ColumnDef, ChartType, AggregationType, Dataset } from '../types/data';
import { aggregateData, formatValue } from '../utils/dataParser';
import { BarChart } from './charts/BarChart';
import { LineChart } from './charts/LineChart';
import { DonutChart } from './charts/DonutChart';
import { ScatterChart } from './charts/ScatterChart';
import { RadarChart } from './charts/RadarChart';
import { HeatmapChart } from './charts/HeatmapChart';
import { TreemapChart } from './charts/TreemapChart';
import { FunnelChart } from './charts/FunnelChart';
import {
  BarChart3,
  LineChart as LineChartIcon,
  PieChart as PieChartIcon,
  ScatterChart as ScatterIcon,
  Compass,
  Grid3X3,
  LayoutGrid,
  Filter as FunnelIcon,
  Sparkles,
  Download,
  Check,
} from 'lucide-react';

interface ChartStudioProps {
  dataset: Dataset;
  filteredRows: Record<string, any>[];
}

export const ChartStudio: React.FC<ChartStudioProps> = ({
  dataset,
  filteredRows,
}) => {
  const [chartType, setChartType] = useState<ChartType>('bar');
  const [selectedDimension, setSelectedDimension] = useState<string>(
    dataset.defaultDimension || (dataset.columns.find((c) => c.type === 'string')?.key || dataset.columns[0].key)
  );
  const [selectedMetric, setSelectedMetric] = useState<string>(
    dataset.defaultMetric || (dataset.columns.find((c) => c.type === 'number')?.key || dataset.columns[0].key)
  );
  const [secondaryMetric, setSecondaryMetric] = useState<string>('');
  const [secondaryDimension, setSecondaryDimension] = useState<string>(
    dataset.columns.find((c) => c.type === 'string' && c.key !== selectedDimension)?.key || ''
  );
  const [aggregation, setAggregation] = useState<AggregationType>('sum');
  const [sortBy, setSortBy] = useState<string>('value-desc');
  const [topN, setTopN] = useState<number>(0);
  const [copiedNotification, setCopiedNotification] = useState(false);

  const dimensionCols = dataset.columns.filter((c) => c.type === 'string' || c.type === 'date');
  const metricCols = dataset.columns.filter((c) => c.type === 'number');

  const activeDimCol = dataset.columns.find((c) => c.key === selectedDimension);
  const activeMetricCol = dataset.columns.find((c) => c.key === selectedMetric);
  const activeSecondaryMetricCol = dataset.columns.find((c) => c.key === secondaryMetric);
  const activeSecondaryDimCol = dataset.columns.find((c) => c.key === secondaryDimension);

  // Aggregated series
  const aggregatedData = aggregateData(
    filteredRows,
    selectedDimension,
    selectedMetric,
    secondaryMetric || undefined,
    aggregation,
    sortBy,
    topN
  );

  const chartTypesList: { id: ChartType; label: string; icon: React.ReactNode }[] = [
    { id: 'bar', label: 'Bar Columns', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'horizontal-bar', label: 'Horizontal Bar', icon: <BarChart3 className="w-4 h-4 rotate-90" /> },
    { id: 'line', label: 'Trend Line', icon: <LineChartIcon className="w-4 h-4" /> },
    { id: 'area', label: 'Gradient Area', icon: <LineChartIcon className="w-4 h-4" /> },
    { id: 'donut', label: 'Donut & Share', icon: <PieChartIcon className="w-4 h-4" /> },
    { id: 'scatter', label: 'Scatter Matrix', icon: <ScatterIcon className="w-4 h-4" /> },
    { id: 'radar', label: 'Spider Radar', icon: <Compass className="w-4 h-4" /> },
    { id: 'heatmap', label: '2D Heatmap', icon: <Grid3X3 className="w-4 h-4" /> },
    { id: 'treemap', label: 'Treemap Blocks', icon: <LayoutGrid className="w-4 h-4" /> },
    { id: 'funnel', label: 'Conversion Funnel', icon: <FunnelIcon className="w-4 h-4" /> },
  ];

  // Quick smart presets
  const applyPreset = (preset: 'productRevenue' | 'paymentShare' | 'dailyTrend' | 'productPaymentHeatmap' | 'radarComp') => {
    if (preset === 'productRevenue') {
      setChartType('bar');
      setSelectedDimension('Product');
      setSelectedMetric('Price');
      setSecondaryMetric('');
      setAggregation('sum');
      setSortBy('value-desc');
      setTopN(10);
    } else if (preset === 'paymentShare') {
      setChartType('donut');
      setSelectedDimension('PaymentMethod');
      setSelectedMetric('Price');
      setSecondaryMetric('');
      setAggregation('sum');
      setSortBy('value-desc');
      setTopN(0);
    } else if (preset === 'dailyTrend') {
      setChartType('line');
      setSelectedDimension('Date');
      setSelectedMetric('Price');
      setSecondaryMetric('');
      setAggregation('sum');
      setSortBy('label-asc');
      setTopN(0);
    } else if (preset === 'productPaymentHeatmap') {
      setChartType('heatmap');
      setSelectedDimension('PaymentMethod');
      setSecondaryDimension('Product');
      setSelectedMetric('Price');
      setAggregation('sum');
    } else if (preset === 'radarComp') {
      setChartType('radar');
      setSelectedDimension('Product');
      setSelectedMetric('Price');
      setAggregation('avg');
      setSortBy('value-desc');
      setTopN(6);
    }
  };

  const copyChartDataSummary = () => {
    const summary = aggregatedData.map((d) => `${d.label}: ${formatValue(d.value, activeMetricCol?.format)}`).join('\n');
    navigator.clipboard.writeText(summary);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2000);
  };

  return (
    <div className="space-y-5">
      {/* Studio Header & Smart Preset Toggles */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
            <span>Chart Studio & Visualization Engine</span>
          </h2>
          <p className="text-xs text-slate-400">
            Dynamically configure dimensions, metrics, mathematical aggregations, and layout geometries.
          </p>
        </div>

        {/* Quick Analytical Presets */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] text-slate-500 font-mono flex items-center gap-1 mr-1">
            <Sparkles className="w-3 h-3 text-indigo-400" /> Presets:
          </span>
          <button
            onClick={() => applyPreset('productRevenue')}
            className="px-2.5 py-1 text-xs rounded-md bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
          >
            Product Revenue
          </button>
          <button
            onClick={() => applyPreset('paymentShare')}
            className="px-2.5 py-1 text-xs rounded-md bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
          >
            Payment Share
          </button>
          <button
            onClick={() => applyPreset('dailyTrend')}
            className="px-2.5 py-1 text-xs rounded-md bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
          >
            Daily Velocity
          </button>
          <button
            onClick={() => applyPreset('productPaymentHeatmap')}
            className="px-2.5 py-1 text-xs rounded-md bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
          >
            2D Heatmap
          </button>
          <button
            onClick={() => applyPreset('radarComp')}
            className="px-2.5 py-1 text-xs rounded-md bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
          >
            Spider Radar
          </button>
        </div>
      </div>

      {/* Chart Type Selector Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-thin">
        {chartTypesList.map((type) => (
          <button
            key={type.id}
            onClick={() => setChartType(type.id)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-150 ${
              chartType === type.id
                ? 'bg-indigo-600 text-white shadow-sm ring-1 ring-indigo-400'
                : 'bg-slate-900/80 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-slate-800'
            }`}
          >
            {type.icon}
            <span>{type.label}</span>
          </button>
        ))}
      </div>

      {/* Configuration Controls Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 rounded-xl border border-slate-800 bg-slate-900/50 p-3.5 backdrop-blur-md">
        {/* Dimension 1 (X Axis / Grouping) */}
        <div className="space-y-1">
          <label className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
            {chartType === 'heatmap' ? 'X Dimension (Columns)' : 'Dimension (X Axis)'}
          </label>
          <select
            value={selectedDimension}
            onChange={(e) => setSelectedDimension(e.target.value)}
            className="w-full rounded-md border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none font-medium"
          >
            {dimensionCols.map((c) => (
              <option key={c.key} value={c.key}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        {/* Heatmap Dimension 2 OR Secondary Metric */}
        {chartType === 'heatmap' ? (
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
              Y Dimension (Rows)
            </label>
            <select
              value={secondaryDimension}
              onChange={(e) => setSecondaryDimension(e.target.value)}
              className="w-full rounded-md border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none font-medium"
            >
              {dimensionCols.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
              Primary Metric (Y)
            </label>
            <select
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value)}
              className="w-full rounded-md border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none font-medium"
            >
              {metricCols.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Secondary Metric for Dual Comparison (Bar, Line, Radar) */}
        {chartType !== 'heatmap' && chartType !== 'donut' && chartType !== 'treemap' && (
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
              Secondary Metric (Optional)
            </label>
            <select
              value={secondaryMetric}
              onChange={(e) => setSecondaryMetric(e.target.value)}
              className="w-full rounded-md border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none font-medium"
            >
              <option value="">None (Single Series)</option>
              {metricCols
                .filter((c) => c.key !== selectedMetric)
                .map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.label}
                  </option>
                ))}
            </select>
          </div>
        )}

        {/* Aggregation Function */}
        <div className="space-y-1">
          <label className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
            Aggregation Formula
          </label>
          <select
            value={aggregation}
            onChange={(e) => setAggregation(e.target.value as AggregationType)}
            className="w-full rounded-md border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none font-medium"
          >
            <option value="sum">Sum (Total Σ)</option>
            <option value="avg">Average (Mean μ)</option>
            <option value="count">Count (Frequency #)</option>
            <option value="min">Minimum (Min)</option>
            <option value="max">Maximum (Max)</option>
          </select>
        </div>

        {/* Sort Order & Top N */}
        <div className="space-y-1">
          <label className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
            Sort & Slice
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="rounded-md border border-slate-800 bg-slate-950 px-2 py-1.5 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none font-mono text-[11px]"
            >
              <option value="value-desc">Highest ↓</option>
              <option value="value-asc">Lowest ↑</option>
              <option value="label-asc">A to Z</option>
              <option value="label-desc">Z to A</option>
            </select>

            <select
              value={topN}
              onChange={(e) => setTopN(Number(e.target.value))}
              className="rounded-md border border-slate-800 bg-slate-950 px-2 py-1.5 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none font-mono text-[11px]"
            >
              <option value={0}>All Items</option>
              <option value={5}>Top 5</option>
              <option value={10}>Top 10</option>
              <option value={15}>Top 15</option>
            </select>
          </div>
        </div>
      </div>

      {/* Chart Canvas Card */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md relative min-h-[440px] flex flex-col justify-between">
        {/* Canvas Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800/80 mb-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <span>{activeMetricCol?.label}</span>
              <span className="text-slate-500">by</span>
              <span>{activeDimCol?.label}</span>
              <span className="text-[11px] text-slate-400 font-normal">
                ({aggregation.toUpperCase()})
              </span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Aggregated across {filteredRows.length} active filtered transactions.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={copyChartDataSummary}
              className="flex items-center gap-1.5 rounded-md border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-xs text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
            >
              {copiedNotification ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Copy Values</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Dynamic Chart Render */}
        <div className="w-full flex-1 flex items-center justify-center">
          {chartType === 'bar' && (
            <BarChart
              data={aggregatedData}
              metricCol={activeMetricCol}
              secondaryMetricCol={activeSecondaryMetricCol}
              horizontal={false}
              height={380}
            />
          )}

          {chartType === 'horizontal-bar' && (
            <div className="w-full max-w-3xl">
              <BarChart
                data={aggregatedData}
                metricCol={activeMetricCol}
                secondaryMetricCol={activeSecondaryMetricCol}
                horizontal={true}
              />
            </div>
          )}

          {chartType === 'line' && (
            <LineChart
              data={aggregatedData}
              metricCol={activeMetricCol}
              secondaryMetricCol={activeSecondaryMetricCol}
              height={380}
              areaFill={false}
            />
          )}

          {chartType === 'area' && (
            <LineChart
              data={aggregatedData}
              metricCol={activeMetricCol}
              secondaryMetricCol={activeSecondaryMetricCol}
              height={380}
              areaFill={true}
            />
          )}

          {chartType === 'donut' && (
            <DonutChart
              data={aggregatedData}
              metricCol={activeMetricCol}
              height={380}
            />
          )}

          {chartType === 'scatter' && (
            <ScatterChart
              rows={filteredRows}
              dimensionCol={activeDimCol}
              xMetricCol={activeMetricCol}
              yMetricCol={activeSecondaryMetricCol || activeMetricCol}
              height={380}
            />
          )}

          {chartType === 'radar' && (
            <RadarChart
              data={aggregatedData}
              metricCol={activeMetricCol}
              secondaryMetricCol={activeSecondaryMetricCol}
              height={380}
            />
          )}

          {chartType === 'heatmap' && (
            <HeatmapChart
              rows={filteredRows}
              dimXCol={activeDimCol}
              dimYCol={activeSecondaryDimCol}
              metricCol={activeMetricCol}
              aggregation={aggregation}
            />
          )}

          {chartType === 'treemap' && (
            <TreemapChart
              data={aggregatedData}
              metricCol={activeMetricCol}
              height={380}
            />
          )}

          {chartType === 'funnel' && (
            <FunnelChart
              data={aggregatedData}
              metricCol={activeMetricCol}
            />
          )}
        </div>
      </div>
    </div>
  );
};
