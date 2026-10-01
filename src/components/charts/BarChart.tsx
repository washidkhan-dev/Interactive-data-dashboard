import React, { useState } from 'react';
import { ChartTooltip } from './ChartTooltip';
import { formatValue } from '../../utils/dataParser';
import { ColumnDef } from '../../types/data';

interface BarChartProps {
  data: { label: string; value: number; secondaryValue?: number; count?: number }[];
  metricCol?: ColumnDef;
  secondaryMetricCol?: ColumnDef;
  horizontal?: boolean;
  height?: number;
}

export const BarChart: React.FC<BarChartProps> = ({
  data,
  metricCol,
  secondaryMetricCol,
  horizontal = false,
  height = 360,
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
        No data available for current selection
      </div>
    );
  }

  const primaryColor = '#6366f1'; // Indigo-500
  const secondaryColor = '#06b6d4'; // Cyan-500

  if (horizontal) {
    // Horizontal Bar Chart
    const maxValue = Math.max(...data.map((d) => d.value), 0.0001);

    return (
      <div className="relative w-full space-y-3 py-2">
        <ChartTooltip {...tooltip} />
        {data.map((item, idx) => {
          const pct = Math.max((item.value / maxValue) * 100, 1.5);
          return (
            <div
              key={idx}
              className="group flex flex-col gap-1 text-xs"
              onMouseEnter={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                setTooltip({
                  visible: true,
                  x: rect.left + rect.width / 2,
                  y: rect.top,
                  title: item.label,
                  items: [
                    {
                      label: metricCol?.label || 'Value',
                      value: formatValue(item.value, metricCol?.format),
                      color: primaryColor,
                    },
                    ...(item.secondaryValue !== undefined && secondaryMetricCol
                      ? [
                          {
                            label: secondaryMetricCol.label,
                            value: formatValue(item.secondaryValue, secondaryMetricCol.format),
                            color: secondaryColor,
                          },
                        ]
                      : []),
                  ],
                });
              }}
              onMouseLeave={() => setTooltip((prev) => ({ ...prev, visible: false }))}
            >
              <div className="flex items-center justify-between text-slate-300">
                <span className="font-medium truncate max-w-[200px] text-slate-200">{item.label}</span>
                <span className="font-mono tabular-nums text-slate-400">
                  {formatValue(item.value, metricCol?.format)}
                </span>
              </div>
              <div className="h-6 w-full rounded bg-slate-800/80 p-0.5 flex items-center overflow-hidden">
                <div
                  className="h-full rounded bg-gradient-to-r from-indigo-600 to-indigo-400 transition-all duration-300 group-hover:brightness-125"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Vertical Bar Chart
  const svgWidth = 800;
  const svgHeight = height;
  const padding = { top: 25, right: 30, bottom: 55, left: 65 };
  const chartWidth = svgWidth - padding.left - padding.right;
  const chartHeight = svgHeight - padding.top - padding.bottom;

  const hasSecondary = secondaryMetricCol && data.some((d) => d.secondaryValue !== undefined);

  let maxValue = Math.max(
    ...data.map((d) => Math.max(d.value, hasSecondary && d.secondaryValue ? d.secondaryValue : 0)),
    0.0001
  );
  // Round max value up nicely
  maxValue = maxValue * 1.1;

  const groupWidth = chartWidth / data.length;
  const barWidth = hasSecondary ? Math.min(groupWidth * 0.38, 28) : Math.min(groupWidth * 0.65, 48);

  const yTicks = 5;
  const tickValues = Array.from({ length: yTicks + 1 }, (_, i) => (maxValue / yTicks) * i);

  return (
    <div className="relative w-full overflow-x-auto">
      <ChartTooltip {...tooltip} />
      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="w-full h-auto select-none"
        style={{ minHeight: `${height}px` }}
      >
        <defs>
          <linearGradient id="barGradientPrimary" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#818cf8" />
            <stop offset="100%" stopColor="#4f46e5" />
          </linearGradient>
          <linearGradient id="barGradientSecondary" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="100%" stopColor="#0891b2" />
          </linearGradient>
        </defs>

        {/* Horizontal Grid lines */}
        {tickValues.map((val, i) => {
          const y = padding.top + chartHeight - (val / maxValue) * chartHeight;
          return (
            <g key={i}>
              <line
                x1={padding.left}
                y1={y}
                x2={padding.left + chartWidth}
                y2={y}
                stroke="#334155"
                strokeWidth={val === 0 ? '1.5' : '1'}
                strokeDasharray={val === 0 ? 'none' : '3 3'}
                strokeOpacity={val === 0 ? '0.8' : '0.4'}
              />
              <text
                x={padding.left - 10}
                y={y + 4}
                textAnchor="end"
                className="fill-slate-400 font-mono tabular-nums text-[11px]"
              >
                {formatValue(val, metricCol?.format === 'currency' ? 'compact' : metricCol?.format)}
              </text>
            </g>
          );
        })}

        {/* Bars */}
        {data.map((item, idx) => {
          const groupCenterX = padding.left + idx * groupWidth + groupWidth / 2;
          const pBarHeight = Math.max((item.value / maxValue) * chartHeight, 2);
          const pY = padding.top + chartHeight - pBarHeight;

          const sBarHeight =
            hasSecondary && item.secondaryValue !== undefined
              ? Math.max((item.secondaryValue / maxValue) * chartHeight, 2)
              : 0;
          const sY = padding.top + chartHeight - sBarHeight;

          const pX = hasSecondary ? groupCenterX - barWidth - 2 : groupCenterX - barWidth / 2;
          const sX = groupCenterX + 2;

          return (
            <g
              key={idx}
              className="cursor-pointer group"
              onMouseEnter={(e) => {
                setTooltip({
                  visible: true,
                  x: e.clientX,
                  y: e.clientY,
                  title: item.label,
                  items: [
                    {
                      label: metricCol?.label || 'Value',
                      value: formatValue(item.value, metricCol?.format),
                      color: primaryColor,
                    },
                    ...(hasSecondary && item.secondaryValue !== undefined
                      ? [
                          {
                            label: secondaryMetricCol.label,
                            value: formatValue(item.secondaryValue, secondaryMetricCol.format),
                            color: secondaryColor,
                          },
                        ]
                      : []),
                  ],
                });
              }}
              onMouseMove={(e) => {
                setTooltip((prev) => ({ ...prev, x: e.clientX, y: e.clientY }));
              }}
              onMouseLeave={() => setTooltip((prev) => ({ ...prev, visible: false }))}
            >
              {/* Primary Bar */}
              <rect
                x={pX}
                y={pY}
                width={barWidth}
                height={pBarHeight}
                rx={3}
                fill="url(#barGradientPrimary)"
                className="transition-all duration-150 hover:brightness-125"
              />

              {/* Secondary Bar if present */}
              {hasSecondary && (
                <rect
                  x={sX}
                  y={sY}
                  width={barWidth}
                  height={sBarHeight}
                  rx={3}
                  fill="url(#barGradientSecondary)"
                  className="transition-all duration-150 hover:brightness-125"
                />
              )}

              {/* X Axis Label */}
              <text
                x={groupCenterX}
                y={padding.top + chartHeight + 18}
                textAnchor="middle"
                className="fill-slate-400 text-[11px] font-medium transition-colors group-hover:fill-slate-100"
              >
                {item.label.length > 14 ? `${item.label.slice(0, 12)}…` : item.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};
