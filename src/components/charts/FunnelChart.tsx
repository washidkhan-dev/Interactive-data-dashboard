import React, { useState } from 'react';
import { ChartTooltip } from './ChartTooltip';
import { formatValue } from '../../utils/dataParser';
import { ColumnDef } from '../../types/data';

interface FunnelChartProps {
  data: { label: string; value: number }[];
  metricCol?: ColumnDef;
  height?: number;
}

const FUNNEL_COLORS = [
  '#6366f1', // Indigo
  '#3b82f6', // Blue
  '#06b6d4', // Cyan
  '#10b981', // Emerald
  '#84cc16', // Lime
  '#eab308', // Yellow
  '#f97316', // Orange
];

export const FunnelChart: React.FC<FunnelChartProps> = ({
  data,
  metricCol,
}) => {
  const [tooltip, setTooltip] = useState<{
    visible: boolean;
    x: number;
    y: number;
    title: string;
    items: { label: string; value: string; color?: string }[];
  }>({ visible: false, x: 0, y: 0, title: '', items: [] });

  if (!data || data.length === 0) {
    return (
      <div className="flex h-72 items-center justify-center text-slate-500 text-sm">
        No data available for funnel visualization
      </div>
    );
  }

  // Ensure items are ordered by value descending for realistic funnel flow
  const sorted = [...data].sort((a, b) => b.value - a.value).slice(0, 8);
  const topValue = Math.max(sorted[0]?.value || 1, 0.0001);

  return (
    <div className="w-full max-w-2xl mx-auto py-4 space-y-3">
      <ChartTooltip {...tooltip} />

      {sorted.map((item, idx) => {
        const pctOfTop = Math.max((item.value / topValue) * 100, 4);
        const prevItem = idx > 0 ? sorted[idx - 1] : null;
        const convFromPrev = prevItem && prevItem.value > 0 ? (item.value / prevItem.value) * 100 : 100;
        const color = FUNNEL_COLORS[idx % FUNNEL_COLORS.length];

        return (
          <div
            key={idx}
            className="group flex flex-col gap-1 cursor-pointer"
            onMouseEnter={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              setTooltip({
                visible: true,
                x: rect.left + rect.width / 2,
                y: rect.top,
                title: `Stage ${idx + 1}: ${item.label}`,
                items: [
                  {
                    label: metricCol?.label || 'Value',
                    value: formatValue(item.value, metricCol?.format),
                    color,
                  },
                  {
                    label: 'Overall Conversion',
                    value: `${((item.value / topValue) * 100).toFixed(1)}%`,
                  },
                  ...(idx > 0
                    ? [
                        {
                          label: 'Step Conversion',
                          value: `${convFromPrev.toFixed(1)}%`,
                        },
                      ]
                    : []),
                ],
              });
            }}
            onMouseLeave={() => setTooltip((prev) => ({ ...prev, visible: false }))}
          >
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span className="font-semibold text-slate-200 flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-slate-800 text-[10px] text-slate-400 flex items-center justify-center font-mono">
                  {idx + 1}
                </span>
                {item.label}
              </span>
              <div className="flex items-center gap-3">
                <span className="font-mono tabular-nums font-medium text-slate-100">
                  {formatValue(item.value, metricCol?.format)}
                </span>
                <span className="font-mono tabular-nums text-slate-400 text-[11px] w-12 text-right">
                  {((item.value / topValue) * 100).toFixed(1)}%
                </span>
              </div>
            </div>

            <div className="w-full flex justify-center py-1">
              <div
                className="h-9 rounded-md transition-all duration-300 group-hover:brightness-125 flex items-center justify-between px-3 text-white text-xs font-medium shadow-sm"
                style={{
                  width: `${pctOfTop}%`,
                  backgroundColor: color,
                }}
              >
                {pctOfTop > 20 && (
                  <span className="truncate">{item.label}</span>
                )}
                {pctOfTop > 35 && idx > 0 && (
                  <span className="text-[10px] font-mono bg-black/20 px-1.5 py-0.5 rounded">
                    ↓ {convFromPrev.toFixed(1)}% step
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
