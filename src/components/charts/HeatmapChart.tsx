import React, { useState } from 'react';
import { ChartTooltip } from './ChartTooltip';
import { formatValue, generateHeatmapData } from '../../utils/dataParser';
import { ColumnDef, AggregationType } from '../../types/data';

interface HeatmapChartProps {
  rows: Record<string, any>[];
  dimXCol?: ColumnDef;
  dimYCol?: ColumnDef;
  metricCol?: ColumnDef;
  aggregation?: AggregationType;
  height?: number;
}

export const HeatmapChart: React.FC<HeatmapChartProps> = ({
  rows,
  dimXCol,
  dimYCol,
  metricCol,
  aggregation = 'sum',
}) => {
  const [tooltip, setTooltip] = useState<{
    visible: boolean;
    x: number;
    y: number;
    title: string;
    items: { label: string; value: string; color?: string }[];
  }>({ visible: false, x: 0, y: 0, title: '', items: [] });

  if (!rows || rows.length === 0 || !dimXCol || !dimYCol || !metricCol) {
    return (
      <div className="flex h-72 items-center justify-center text-slate-500 text-sm">
        Please select two dimensions and one metric to render the Heatmap matrix.
      </div>
    );
  }

  const { xLabels, yLabels, matrix, min, max } = generateHeatmapData(
    rows,
    dimXCol.key,
    dimYCol.key,
    metricCol.key,
    aggregation
  );

  const getCellColor = (value: number) => {
    if (value === 0 || max === min) return 'bg-slate-900/60 border-slate-800/80';
    const ratio = Math.max(0, Math.min(1, (value - min) / (max - min || 1)));

    if (ratio < 0.2) return 'bg-indigo-950/70 border-indigo-900/50 text-indigo-300';
    if (ratio < 0.4) return 'bg-indigo-900/80 border-indigo-700/60 text-indigo-200';
    if (ratio < 0.6) return 'bg-indigo-700 border-indigo-500 text-white';
    if (ratio < 0.8) return 'bg-indigo-600 border-indigo-400 text-white';
    return 'bg-indigo-500 border-indigo-300 text-white font-bold';
  };

  return (
    <div className="relative w-full overflow-x-auto py-2">
      <ChartTooltip {...tooltip} />

      <div className="min-w-[600px]">
        {/* Header row with X labels */}
        <div className="grid gap-1.5 pb-2" style={{ gridTemplateColumns: `140px repeat(${xLabels.length}, minmax(70px, 1fr))` }}>
          <div className="text-xs font-semibold text-slate-400 flex items-end pb-1 truncate">
            {dimYCol.label} \ {dimXCol.label}
          </div>
          {xLabels.map((x) => (
            <div
              key={x}
              className="text-[11px] font-medium text-slate-300 text-center truncate px-1 py-1"
              title={x}
            >
              {x}
            </div>
          ))}
        </div>

        {/* Matrix rows */}
        <div className="space-y-1.5">
          {yLabels.map((y) => (
            <div
              key={y}
              className="grid gap-1.5 items-center"
              style={{ gridTemplateColumns: `140px repeat(${xLabels.length}, minmax(70px, 1fr))` }}
            >
              <div className="text-xs font-medium text-slate-300 truncate pr-2 text-right">
                {y}
              </div>
              {xLabels.map((x) => {
                const cell = matrix.find((m) => m.x === x && m.y === y);
                const val = cell ? cell.value : 0;
                const colorClass = getCellColor(val);

                return (
                  <div
                    key={`${x}-${y}`}
                    className={`h-11 rounded-md border flex items-center justify-center cursor-pointer transition-all duration-150 hover:scale-105 hover:z-10 shadow-sm ${colorClass}`}
                    onMouseEnter={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      setTooltip({
                        visible: true,
                        x: rect.left + rect.width / 2,
                        y: rect.top,
                        title: `${y} × ${x}`,
                        items: [
                          {
                            label: `${metricCol.label} (${aggregation})`,
                            value: formatValue(val, metricCol.format),
                            color: '#818cf8',
                          },
                        ],
                      });
                    }}
                    onMouseLeave={() => setTooltip((prev) => ({ ...prev, visible: false }))}
                  >
                    <span className="font-mono tabular-nums text-[11px] truncate px-1">
                      {val > 0 ? formatValue(val, 'compact') : '—'}
                    </span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Scale Legend */}
        <div className="flex items-center justify-between text-xs text-slate-400 pt-5 mt-4 border-t border-slate-800">
          <div className="flex items-center gap-2">
            <span>Low Intensity ({formatValue(min, metricCol.format === 'currency' ? 'compact' : metricCol.format)})</span>
            <div className="flex h-3 w-36 rounded overflow-hidden border border-slate-700">
              <span className="h-full w-1/5 bg-slate-900" />
              <span className="h-full w-1/5 bg-indigo-950" />
              <span className="h-full w-1/5 bg-indigo-800" />
              <span className="h-full w-1/5 bg-indigo-600" />
              <span className="h-full w-1/5 bg-indigo-400" />
            </div>
            <span>High Intensity ({formatValue(max, metricCol.format === 'currency' ? 'compact' : metricCol.format)})</span>
          </div>
          <span className="font-mono text-[11px] text-slate-500">
            {matrix.length} grid intersections plotted
          </span>
        </div>
      </div>
    </div>
  );
};
