import React from 'react';
import { ColumnDef } from '../types/data';
import { formatValue } from '../utils/dataParser';
import { TrendingUp, TrendingDown, Layers, Hash } from 'lucide-react';

interface KPIGridProps {
  rows: Record<string, any>[];
  metricColumns: ColumnDef[];
  dateColumn?: ColumnDef;
}

export const KPIGrid: React.FC<KPIGridProps> = ({ rows, metricColumns }) => {
  if (!rows || rows.length === 0 || metricColumns.length === 0) return null;

  // Pick up to 4 key numeric metrics
  const displayMetrics = metricColumns.slice(0, 4);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {displayMetrics.map((col, idx) => {
        const values = rows.map((r) => Number(r[col.key]) || 0);
        const total = values.reduce((a, b) => a + b, 0);
        const avg = values.length > 0 ? total / values.length : 0;
        const max = Math.max(...values, 0);
        const min = Math.min(...values, 0);

        // Calculate trend (comparing first half of items to second half)
        const half = Math.floor(values.length / 2);
        const firstHalfAvg = half > 0 ? values.slice(0, half).reduce((a, b) => a + b, 0) / half : 0;
        const secondHalfAvg =
          values.length - half > 0
            ? values.slice(half).reduce((a, b) => a + b, 0) / (values.length - half)
            : 0;
        const deltaPct =
          firstHalfAvg !== 0 ? ((secondHalfAvg - firstHalfAvg) / Math.abs(firstHalfAvg)) * 100 : 0;

        // Sparkline coordinates
        const sparkWidth = 100;
        const sparkHeight = 28;
        const range = max - min || 1;
        const sparkPoints = values.slice(0, 20).map((v, i, arr) => {
          const x = (i / Math.max(arr.length - 1, 1)) * sparkWidth;
          const y = sparkHeight - ((v - min) / range) * (sparkHeight - 4) - 2;
          return `${x.toFixed(1)},${y.toFixed(1)}`;
        }).join(' ');

        const isPositive = deltaPct >= 0;

        return (
          <div
            key={col.key}
            className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 transition-all duration-150 hover:border-slate-700/80 hover:bg-slate-900/80"
          >
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-medium truncate">{col.label}</span>
              <span className="text-[11px] font-mono text-slate-500">
                {col.format === 'percent' ? 'Avg rate' : 'Total'}
              </span>
            </div>

            <div className="mt-2 flex items-baseline justify-between">
              <div className="font-mono tabular-nums text-2xl font-bold tracking-tight text-slate-100">
                {formatValue(col.format === 'percent' ? avg : total, col.format)}
              </div>

              {/* Sparkline SVG */}
              {values.length > 2 && (
                <div className="w-20 h-7 shrink-0">
                  <svg
                    viewBox={`0 0 ${sparkWidth} ${sparkHeight}`}
                    className="w-full h-full overflow-visible"
                  >
                    <polyline
                      fill="none"
                      stroke={idx === 0 ? '#818cf8' : idx === 1 ? '#22d3ee' : idx === 2 ? '#34d399' : '#fbbf24'}
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={sparkPoints}
                    />
                  </svg>
                </div>
              )}
            </div>

            {/* Unboxed Metadata & Trend Indicator */}
            <div className="mt-3 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/60 pt-2.5">
              <div className="flex items-center gap-1.5 font-medium">
                {isPositive ? (
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
                )}
                <span className={`font-mono tabular-nums ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {isPositive ? '+' : ''}{deltaPct.toFixed(1)}%
                </span>
                <span className="text-slate-500 font-normal">trend</span>
              </div>

              <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-mono">
                <span>Avg: {formatValue(avg, col.format)}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
