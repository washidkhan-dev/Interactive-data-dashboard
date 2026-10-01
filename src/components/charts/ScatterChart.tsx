import React, { useState } from 'react';
import { ChartTooltip } from './ChartTooltip';
import { formatValue } from '../../utils/dataParser';
import { ColumnDef } from '../../types/data';

interface ScatterChartProps {
  rows: Record<string, any>[];
  dimensionCol?: ColumnDef;
  xMetricCol?: ColumnDef;
  yMetricCol?: ColumnDef;
  sizeMetricCol?: ColumnDef;
  height?: number;
}

const CATEGORY_COLORS = [
  '#6366f1',
  '#06b6d4',
  '#10b981',
  '#f59e0b',
  '#ec4899',
  '#8b5cf6',
  '#3b82f6',
];

export const ScatterChart: React.FC<ScatterChartProps> = ({
  rows,
  dimensionCol,
  xMetricCol,
  yMetricCol,
  sizeMetricCol,
  height = 360,
}) => {
  const [tooltip, setTooltip] = useState<{
    visible: boolean;
    x: number;
    y: number;
    title: string;
    items: { label: string; value: string; color?: string }[];
  }>({ visible: false, x: 0, y: 0, title: '', items: [] });

  if (!rows || rows.length === 0 || !xMetricCol || !yMetricCol) {
    return (
      <div className="flex h-72 items-center justify-center text-slate-500 text-sm">
        Please select valid X and Y numeric metrics to plot scatter distribution.
      </div>
    );
  }

  const svgWidth = 800;
  const svgHeight = height;
  const padding = { top: 25, right: 35, bottom: 50, left: 70 };
  const chartWidth = svgWidth - padding.left - padding.right;
  const chartHeight = svgHeight - padding.top - padding.bottom;

  // Compute extents
  const xValues = rows.map((r) => Number(r[xMetricCol.key]) || 0);
  const yValues = rows.map((r) => Number(r[yMetricCol.key]) || 0);
  const zValues = sizeMetricCol ? rows.map((r) => Number(r[sizeMetricCol.key]) || 0) : [];

  const minX = Math.min(...xValues, 0);
  const maxX = Math.max(...xValues, 1) * 1.08;

  const minY = Math.min(...yValues, 0);
  const maxY = Math.max(...yValues, 1) * 1.08;

  const maxZ = zValues.length > 0 ? Math.max(...zValues, 1) : 1;

  // Color map for categorical dimension
  const categoryMap = new Map<string, string>();
  let catIndex = 0;

  const points = rows.map((row, idx) => {
    const xVal = Number(row[xMetricCol.key]) || 0;
    const yVal = Number(row[yMetricCol.key]) || 0;
    const zVal = sizeMetricCol ? Number(row[sizeMetricCol.key]) || 0 : 0;
    const category = dimensionCol ? String(row[dimensionCol.key] || 'Default') : `Item #${idx + 1}`;

    if (!categoryMap.has(category)) {
      categoryMap.set(category, CATEGORY_COLORS[catIndex % CATEGORY_COLORS.length]);
      catIndex++;
    }
    const color = categoryMap.get(category) || '#6366f1';

    const cx = padding.left + ((xVal - minX) / (maxX - minX || 1)) * chartWidth;
    const cy = padding.top + chartHeight - ((yVal - minY) / (maxY - minY || 1)) * chartHeight;
    const radius = sizeMetricCol ? Math.max((zVal / maxZ) * 16, 4) : 6;

    return { row, category, xVal, yVal, zVal, cx, cy, radius, color, idx };
  });

  const xTicks = 5;
  const xTickValues = Array.from({ length: xTicks + 1 }, (_, i) => minX + ((maxX - minX) / xTicks) * i);

  const yTicks = 5;
  const yTickValues = Array.from({ length: yTicks + 1 }, (_, i) => minY + ((maxY - minY) / yTicks) * i);

  return (
    <div className="relative w-full overflow-x-auto">
      <ChartTooltip {...tooltip} />
      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="w-full h-auto select-none"
        style={{ minHeight: `${height}px` }}
      >
        {/* Horizontal grid lines & Y labels */}
        {yTickValues.map((val, i) => {
          const y = padding.top + chartHeight - ((val - minY) / (maxY - minY || 1)) * chartHeight;
          return (
            <g key={`y-${i}`}>
              <line
                x1={padding.left}
                y1={y}
                x2={padding.left + chartWidth}
                y2={y}
                stroke="#334155"
                strokeWidth="1"
                strokeDasharray="3 3"
                strokeOpacity="0.4"
              />
              <text
                x={padding.left - 10}
                y={y + 4}
                textAnchor="end"
                className="fill-slate-400 font-mono tabular-nums text-[11px]"
              >
                {formatValue(val, yMetricCol.format === 'currency' ? 'compact' : yMetricCol.format)}
              </text>
            </g>
          );
        })}

        {/* Vertical grid lines & X labels */}
        {xTickValues.map((val, i) => {
          const x = padding.left + ((val - minX) / (maxX - minX || 1)) * chartWidth;
          return (
            <g key={`x-${i}`}>
              <line
                x1={x}
                y1={padding.top}
                x2={x}
                y2={padding.top + chartHeight}
                stroke="#334155"
                strokeWidth="1"
                strokeDasharray="3 3"
                strokeOpacity="0.3"
              />
              <text
                x={x}
                y={padding.top + chartHeight + 20}
                textAnchor="middle"
                className="fill-slate-400 font-mono tabular-nums text-[11px]"
              >
                {formatValue(val, xMetricCol.format === 'currency' ? 'compact' : xMetricCol.format)}
              </text>
            </g>
          );
        })}

        {/* Axis Titles */}
        <text
          x={padding.left + chartWidth / 2}
          y={padding.top + chartHeight + 42}
          textAnchor="middle"
          className="fill-slate-300 text-xs font-semibold"
        >
          {xMetricCol.label} →
        </text>

        {/* Data points */}
        {points.map((p) => (
          <circle
            key={p.idx}
            cx={p.cx}
            cy={p.cy}
            r={p.radius}
            fill={p.color}
            fillOpacity={0.7}
            stroke={p.color}
            strokeWidth="1.5"
            className="cursor-pointer transition-transform duration-100 hover:scale-125 hover:fill-opacity-100"
            onMouseEnter={(e) => {
              setTooltip({
                visible: true,
                x: e.clientX,
                y: e.clientY,
                title: p.category,
                items: [
                  {
                    label: xMetricCol.label,
                    value: formatValue(p.xVal, xMetricCol.format),
                    color: p.color,
                  },
                  {
                    label: yMetricCol.label,
                    value: formatValue(p.yVal, yMetricCol.format),
                    color: '#38bdf8',
                  },
                  ...(sizeMetricCol
                    ? [
                        {
                          label: sizeMetricCol.label,
                          value: formatValue(p.zVal, sizeMetricCol.format),
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
          />
        ))}
      </svg>

      {/* Categories Legend */}
      {categoryMap.size > 1 && (
        <div className="flex flex-wrap items-center justify-center gap-4 pt-3 text-xs border-t border-slate-800/60 mt-2">
          {Array.from(categoryMap.entries()).map(([cat, color]) => (
            <div key={cat} className="flex items-center gap-1.5 text-slate-300">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
              <span>{cat}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
