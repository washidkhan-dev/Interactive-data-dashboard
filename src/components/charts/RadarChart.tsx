import React, { useState } from 'react';
import { ChartTooltip } from './ChartTooltip';
import { formatValue } from '../../utils/dataParser';
import { ColumnDef } from '../../types/data';

interface RadarChartProps {
  data: { label: string; value: number; secondaryValue?: number }[];
  metricCol?: ColumnDef;
  secondaryMetricCol?: ColumnDef;
  height?: number;
}

export const RadarChart: React.FC<RadarChartProps> = ({
  data,
  metricCol,
  secondaryMetricCol,
  height = 360,
}) => {
  const [tooltip, setTooltip] = useState<{
    visible: boolean;
    x: number;
    y: number;
    title: string;
    items: { label: string; value: string; color?: string }[];
  }>({ visible: false, x: 0, y: 0, title: '', items: [] });

  if (!data || data.length < 3) {
    return (
      <div className="flex h-72 items-center justify-center text-slate-500 text-sm">
        Radar chart requires at least 3 distinct categories/data points
      </div>
    );
  }

  // Limit to top 8 items for clean polygon
  const items = data.slice(0, 8);
  const totalSides = items.length;

  const size = 360;
  const center = size / 2;
  const maxRadius = 125;

  const hasSecondary = secondaryMetricCol && items.some((d) => d.secondaryValue !== undefined);

  const maxValue = Math.max(
    ...items.map((d) => Math.max(d.value, hasSecondary && d.secondaryValue ? d.secondaryValue : 0)),
    0.0001
  ) * 1.05;

  // Concentric polygon levels (20%, 40%, 60%, 80%, 100%)
  const levels = [0.2, 0.4, 0.6, 0.8, 1.0];

  const getCoordinates = (index: number, ratio: number) => {
    const angle = (Math.PI * 2 * index) / totalSides - Math.PI / 2;
    const r = maxRadius * ratio;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
      angle,
    };
  };

  // Primary polygon path
  const primaryPoints = items.map((item, idx) => {
    const ratio = Math.max(item.value / maxValue, 0);
    return getCoordinates(idx, ratio);
  });
  const primaryPath = primaryPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';

  // Secondary polygon path
  const secondaryPoints = hasSecondary
    ? items.map((item, idx) => {
        const ratio = Math.max((item.secondaryValue || 0) / maxValue, 0);
        return getCoordinates(idx, ratio);
      })
    : [];
  const secondaryPath =
    secondaryPoints.length > 0
      ? secondaryPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z'
      : '';

  return (
    <div className="flex flex-col items-center justify-center py-2 relative">
      <ChartTooltip {...tooltip} />
      <svg
        viewBox={`0 0 ${size} ${size}`}
        width={size}
        height={size}
        className="select-none overflow-visible"
      >
        <defs>
          <linearGradient id="radarFillPrimary" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#818cf8" stopOpacity="0.2" />
          </linearGradient>
          <linearGradient id="radarFillSecondary" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.15" />
          </linearGradient>
        </defs>

        {/* Concentric grid rings */}
        {levels.map((level, i) => {
          const levelPts = Array.from({ length: totalSides }, (_, idx) => getCoordinates(idx, level));
          const pathStr = levelPts.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';
          return (
            <path
              key={`ring-${i}`}
              d={pathStr}
              fill="none"
              stroke="#334155"
              strokeWidth="1"
              strokeDasharray="2 2"
              strokeOpacity="0.6"
            />
          );
        })}

        {/* Radial spokes */}
        {items.map((item, idx) => {
          const endPt = getCoordinates(idx, 1.0);
          const labelPt = getCoordinates(idx, 1.22);
          return (
            <g key={`spoke-${idx}`}>
              <line
                x1={center}
                y1={center}
                x2={endPt.x}
                y2={endPt.y}
                stroke="#334155"
                strokeWidth="1"
                strokeOpacity="0.7"
              />
              <text
                x={labelPt.x}
                y={labelPt.y + 4}
                textAnchor="middle"
                className="fill-slate-300 text-[10px] font-medium"
              >
                {item.label.length > 12 ? `${item.label.slice(0, 10)}…` : item.label}
              </text>
            </g>
          );
        })}

        {/* Secondary Polygon */}
        {hasSecondary && (
          <path
            d={secondaryPath}
            fill="url(#radarFillSecondary)"
            stroke="#06b6d4"
            strokeWidth="2"
            className="transition-all duration-300"
          />
        )}

        {/* Primary Polygon */}
        <path
          d={primaryPath}
          fill="url(#radarFillPrimary)"
          stroke="#6366f1"
          strokeWidth="2.5"
          className="transition-all duration-300"
        />

        {/* Primary data vertex dots */}
        {primaryPoints.map((p, idx) => (
          <circle
            key={`dot-${idx}`}
            cx={p.x}
            cy={p.y}
            r={4.5}
            fill="#0f172a"
            stroke="#818cf8"
            strokeWidth="2"
            className="cursor-pointer transition-transform duration-100 hover:scale-150"
            onMouseEnter={(e) => {
              const item = items[idx];
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
            }}
            onMouseLeave={() => setTooltip((prev) => ({ ...prev, visible: false }))}
          />
        ))}
      </svg>

      {/* Legend */}
      <div className="flex items-center gap-5 mt-4 text-xs">
        <div className="flex items-center gap-2 text-slate-300">
          <span className="w-3 h-3 rounded-sm bg-indigo-500" />
          <span>{metricCol?.label || 'Primary Metric'}</span>
        </div>
        {hasSecondary && (
          <div className="flex items-center gap-2 text-slate-300">
            <span className="w-3 h-3 rounded-sm bg-cyan-500" />
            <span>{secondaryMetricCol?.label || 'Secondary Metric'}</span>
          </div>
        )}
      </div>
    </div>
  );
};
