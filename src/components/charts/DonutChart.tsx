import React, { useState } from 'react';
import { ChartTooltip } from './ChartTooltip';
import { formatValue } from '../../utils/dataParser';
import { ColumnDef } from '../../types/data';

interface DonutChartProps {
  data: { label: string; value: number; count?: number }[];
  metricCol?: ColumnDef;
  height?: number;
}

const PALETTE = [
  '#6366f1', // Indigo
  '#06b6d4', // Cyan
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#8b5cf6', // Violet
  '#3b82f6', // Blue
  '#14b8a6', // Teal
  '#f97316', // Orange
  '#64748b', // Slate
];

export const DonutChart: React.FC<DonutChartProps> = ({
  data,
  metricCol,
  height = 360,
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
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
        No data available
      </div>
    );
  }

  const total = data.reduce((acc, curr) => acc + (curr.value > 0 ? curr.value : 0), 0) || 1;

  const size = 300;
  const center = size / 2;
  const radius = 115;
  const innerRadius = 72;

  // Calculate slice angles
  let currentAngle = -Math.PI / 2;
  const slices = data.map((item, idx) => {
    const value = Math.max(item.value, 0);
    const fraction = value / total;
    const angle = fraction * 2 * Math.PI;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    currentAngle = endAngle;

    const color = PALETTE[idx % PALETTE.length];
    return { item, fraction, startAngle, endAngle, color, idx };
  });

  const describeArc = (
    cx: number,
    cy: number,
    rInner: number,
    rOuter: number,
    startAngle: number,
    endAngle: number
  ) => {
    // Avoid full 360 glitch
    if (endAngle - startAngle >= 2 * Math.PI - 0.001) {
      endAngle = startAngle + 2 * Math.PI - 0.001;
    }

    const x1Inner = cx + rInner * Math.cos(startAngle);
    const y1Inner = cy + rInner * Math.sin(startAngle);
    const x1Outer = cx + rOuter * Math.cos(startAngle);
    const y1Outer = cy + rOuter * Math.sin(startAngle);

    const x2Inner = cx + rInner * Math.cos(endAngle);
    const y2Inner = cy + rInner * Math.sin(endAngle);
    const x2Outer = cx + rOuter * Math.cos(endAngle);
    const y2Outer = cy + rOuter * Math.sin(endAngle);

    const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;

    return `
      M ${x1Inner} ${y1Inner}
      L ${x1Outer} ${y1Outer}
      A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${x2Outer} ${y2Outer}
      L ${x2Inner} ${y2Inner}
      A ${rInner} ${rInner} 0 ${largeArc} 0 ${x1Inner} ${y1Inner}
      Z
    `;
  };

  const activeSlice = hoveredIdx !== null ? slices[hoveredIdx] : null;

  return (
    <div className="flex flex-col lg:flex-row items-center justify-around gap-6 py-2">
      <ChartTooltip {...tooltip} />

      {/* SVG Donut Circle */}
      <div className="relative shrink-0 flex items-center justify-center">
        <svg
          viewBox={`0 0 ${size} ${size}`}
          width={size}
          height={size}
          className="select-none"
        >
          {slices.map((slice) => {
            const isHovered = hoveredIdx === slice.idx;
            const rOut = isHovered ? radius + 7 : radius;
            const rIn = isHovered ? innerRadius - 2 : innerRadius;
            const d = describeArc(center, center, rIn, rOut, slice.startAngle, slice.endAngle);

            return (
              <path
                key={slice.idx}
                d={d}
                fill={slice.color}
                opacity={hoveredIdx === null || isHovered ? 1 : 0.4}
                className="transition-all duration-200 cursor-pointer"
                stroke="#0f172a"
                strokeWidth="2.5"
                onMouseEnter={(e) => {
                  setHoveredIdx(slice.idx);
                  setTooltip({
                    visible: true,
                    x: e.clientX,
                    y: e.clientY,
                    title: slice.item.label,
                    items: [
                      {
                        label: metricCol?.label || 'Value',
                        value: formatValue(slice.item.value, metricCol?.format),
                        color: slice.color,
                      },
                      {
                        label: 'Share',
                        value: `${(slice.fraction * 100).toFixed(1)}%`,
                      },
                    ],
                  });
                }}
                onMouseMove={(e) => {
                  setTooltip((prev) => ({ ...prev, x: e.clientX, y: e.clientY }));
                }}
                onMouseLeave={() => {
                  setHoveredIdx(null);
                  setTooltip((prev) => ({ ...prev, visible: false }));
                }}
              />
            );
          })}
        </svg>

        {/* Center label */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
            {activeSlice ? activeSlice.item.label : metricCol?.label || 'Total'}
          </span>
          <span className="font-mono tabular-nums text-lg font-bold text-slate-100">
            {activeSlice
              ? formatValue(activeSlice.item.value, metricCol?.format)
              : formatValue(total, metricCol?.format)}
          </span>
          <span className="text-[10px] text-slate-500 font-mono">
            {activeSlice ? `${(activeSlice.fraction * 100).toFixed(1)}%` : '100%'}
          </span>
        </div>
      </div>

      {/* Legend list */}
      <div className="w-full max-w-sm space-y-2 max-h-72 overflow-y-auto pr-2">
        {slices.map((slice) => {
          const isHovered = hoveredIdx === slice.idx;
          return (
            <div
              key={slice.idx}
              className={`flex items-center justify-between text-xs p-2 rounded-lg cursor-pointer transition-all ${
                isHovered
                  ? 'bg-slate-800/90 text-slate-100 ring-1 ring-slate-700'
                  : 'hover:bg-slate-800/40 text-slate-300'
              }`}
              onMouseEnter={() => setHoveredIdx(slice.idx)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              <div className="flex items-center gap-2.5 truncate">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: slice.color }}
                />
                <span className="truncate font-medium">{slice.item.label}</span>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="font-mono tabular-nums text-slate-200">
                  {formatValue(slice.item.value, metricCol?.format)}
                </span>
                <span className="font-mono tabular-nums text-slate-400 w-11 text-right">
                  {(slice.fraction * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
