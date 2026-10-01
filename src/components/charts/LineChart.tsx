import React, { useState } from 'react';
import { ChartTooltip } from './ChartTooltip';
import { formatValue } from '../../utils/dataParser';
import { ColumnDef } from '../../types/data';

interface LineChartProps {
  data: { label: string; value: number; secondaryValue?: number; count?: number }[];
  metricCol?: ColumnDef;
  secondaryMetricCol?: ColumnDef;
  height?: number;
  areaFill?: boolean;
}

export const LineChart: React.FC<LineChartProps> = ({
  data,
  metricCol,
  secondaryMetricCol,
  height = 360,
  areaFill = true,
}) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
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

  const svgWidth = 800;
  const svgHeight = height;
  const padding = { top: 30, right: 35, bottom: 50, left: 65 };
  const chartWidth = svgWidth - padding.left - padding.right;
  const chartHeight = svgHeight - padding.top - padding.bottom;

  const hasSecondary = secondaryMetricCol && data.some((d) => d.secondaryValue !== undefined);

  let maxValue = Math.max(
    ...data.map((d) => Math.max(d.value, hasSecondary && d.secondaryValue ? d.secondaryValue : 0)),
    0.0001
  );
  maxValue = maxValue * 1.1;

  const stepX = data.length > 1 ? chartWidth / (data.length - 1) : chartWidth / 2;

  // Build points for primary series
  const primaryPoints = data.map((d, i) => {
    const x = padding.left + (data.length > 1 ? i * stepX : chartWidth / 2);
    const y = padding.top + chartHeight - (d.value / maxValue) * chartHeight;
    return { x, y, data: d };
  });

  // Build points for secondary series
  const secondaryPoints = hasSecondary
    ? data.map((d, i) => {
        const x = padding.left + (data.length > 1 ? i * stepX : chartWidth / 2);
        const secVal = d.secondaryValue || 0;
        const y = padding.top + chartHeight - (secVal / maxValue) * chartHeight;
        return { x, y, data: d };
      })
    : [];

  // Helper for smooth bezier path
  const makeSmoothPath = (pts: { x: number; y: number }[]) => {
    if (pts.length === 0) return '';
    if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;
    let path = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i === 0 ? i : i - 1];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[i + 2 < pts.length ? i + 2 : i + 1];

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
    return path;
  };

  const primaryPath = makeSmoothPath(primaryPoints);
  const secondaryPath = makeSmoothPath(secondaryPoints);

  const primaryAreaPath =
    primaryPoints.length > 0
      ? `${primaryPath} L ${primaryPoints[primaryPoints.length - 1].x} ${padding.top + chartHeight} L ${primaryPoints[0].x} ${padding.top + chartHeight} Z`
      : '';

  const yTicks = 5;
  const tickValues = Array.from({ length: yTicks + 1 }, (_, i) => (maxValue / yTicks) * i);

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const normalizedX = (clientX / rect.width) * svgWidth;

    // Find nearest point
    let closestIdx = 0;
    let minDiff = Infinity;
    primaryPoints.forEach((p, idx) => {
      const diff = Math.abs(p.x - normalizedX);
      if (diff < minDiff) {
        minDiff = diff;
        closestIdx = idx;
      }
    });

    setHoverIndex(closestIdx);
    const item = data[closestIdx];
    setTooltip({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      title: item.label,
      items: [
        {
          label: metricCol?.label || 'Value',
          value: formatValue(item.value, metricCol?.format),
          color: '#6366f1',
        },
        ...(hasSecondary && item.secondaryValue !== undefined
          ? [
              {
                label: secondaryMetricCol?.label || 'Secondary',
                value: formatValue(item.secondaryValue, secondaryMetricCol?.format),
                color: '#06b6d4',
              },
            ]
          : []),
      ],
    });
  };

  return (
    <div className="relative w-full overflow-x-auto">
      <ChartTooltip {...tooltip} />
      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="w-full h-auto cursor-crosshair select-none"
        style={{ minHeight: `${height}px` }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => {
          setHoverIndex(null);
          setTooltip((prev) => ({ ...prev, visible: false }));
        }}
      >
        <defs>
          <linearGradient id="lineAreaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.4" />
            <stop offset="90%" stopColor="#6366f1" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Horizontal grid lines */}
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

        {/* Area fill */}
        {areaFill && (
          <path d={primaryAreaPath} fill="url(#lineAreaGradient)" pointerEvents="none" />
        )}

        {/* Secondary Line */}
        {hasSecondary && (
          <path
            d={secondaryPath}
            fill="none"
            stroke="#06b6d4"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            pointerEvents="none"
          />
        )}

        {/* Primary Line */}
        <path
          d={primaryPath}
          fill="none"
          stroke="#6366f1"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          pointerEvents="none"
        />

        {/* Data points */}
        {primaryPoints.map((p, idx) => (
          <circle
            key={`p-${idx}`}
            cx={p.x}
            cy={p.y}
            r={hoverIndex === idx ? 6 : 3.5}
            fill="#0f172a"
            stroke="#818cf8"
            strokeWidth={hoverIndex === idx ? 3 : 2}
            className="transition-all duration-100"
          />
        ))}

        {hasSecondary &&
          secondaryPoints.map((p, idx) => (
            <circle
              key={`s-${idx}`}
              cx={p.x}
              cy={p.y}
              r={hoverIndex === idx ? 5 : 3}
              fill="#0f172a"
              stroke="#22d3ee"
              strokeWidth={hoverIndex === idx ? 2.5 : 1.5}
              className="transition-all duration-100"
            />
          ))}

        {/* Active crosshair vertical line */}
        {hoverIndex !== null && primaryPoints[hoverIndex] && (
          <line
            x1={primaryPoints[hoverIndex].x}
            y1={padding.top}
            x2={primaryPoints[hoverIndex].x}
            y2={padding.top + chartHeight}
            stroke="#94a3b8"
            strokeWidth="1.5"
            strokeDasharray="4 4"
            pointerEvents="none"
          />
        )}

        {/* X Axis ticks & labels */}
        {data.map((item, idx) => {
          // If many labels, skip some for clarity
          const skipInterval = Math.ceil(data.length / 10);
          if (idx % skipInterval !== 0 && idx !== data.length - 1) return null;
          const x = padding.left + (data.length > 1 ? idx * stepX : chartWidth / 2);
          return (
            <text
              key={idx}
              x={x}
              y={padding.top + chartHeight + 20}
              textAnchor="middle"
              className="fill-slate-400 text-[11px] font-medium"
            >
              {item.label.length > 10 ? `${item.label.slice(0, 8)}…` : item.label}
            </text>
          );
        })}
      </svg>
    </div>
  );
};
