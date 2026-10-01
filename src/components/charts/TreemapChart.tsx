import React, { useState } from 'react';
import { ChartTooltip } from './ChartTooltip';
import { formatValue } from '../../utils/dataParser';
import { ColumnDef } from '../../types/data';

interface TreemapChartProps {
  data: { label: string; value: number; count?: number }[];
  metricCol?: ColumnDef;
  height?: number;
}

const TILE_COLORS = [
  '#4338ca', // Indigo-700
  '#0e7490', // Cyan-700
  '#047857', // Emerald-700
  '#b45309', // Amber-700
  '#be185d', // Pink-700
  '#6d28d9', // Violet-700
  '#1d4ed8', // Blue-700
  '#0f766e', // Teal-700
  '#c2410c', // Orange-700
];

export const TreemapChart: React.FC<TreemapChartProps> = ({
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

  // Filter positive values and sort descending
  const validItems = data
    .filter((d) => d.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 14);

  const total = validItems.reduce((acc, curr) => acc + curr.value, 0) || 1;

  // Squarified/Slice layout algorithm
  const containerWidth = 800;
  const containerHeight = height;

  interface Tile {
    item: { label: string; value: number };
    x: number;
    y: number;
    w: number;
    h: number;
    color: string;
    fraction: number;
    idx: number;
  }

  const computeLayout = (): Tile[] => {
    const tiles: Tile[] = [];
    let remainingX = 0;
    let remainingY = 0;
    let remainingW = containerWidth;
    let remainingH = containerHeight;
    let remainingTotal = total;

    for (let i = 0; i < validItems.length; i++) {
      const item = validItems[i];
      const fraction = item.value / total;
      const color = TILE_COLORS[i % TILE_COLORS.length];

      if (i === validItems.length - 1) {
        // Last tile takes remaining space
        tiles.push({
          item,
          x: remainingX,
          y: remainingY,
          w: remainingW,
          h: remainingH,
          color,
          fraction,
          idx: i,
        });
        break;
      }

      const ratio = item.value / remainingTotal;

      if (remainingW >= remainingH) {
        // Cut vertically
        const w = Math.max(remainingW * ratio, 20);
        tiles.push({
          item,
          x: remainingX,
          y: remainingY,
          w,
          h: remainingH,
          color,
          fraction,
          idx: i,
        });
        remainingX += w;
        remainingW -= w;
      } else {
        // Cut horizontally
        const h = Math.max(remainingH * ratio, 20);
        tiles.push({
          item,
          x: remainingX,
          y: remainingY,
          w: remainingW,
          h,
          color,
          fraction,
          idx: i,
        });
        remainingY += h;
        remainingH -= h;
      }

      remainingTotal -= item.value;
    }

    return tiles;
  };

  const tiles = computeLayout();

  return (
    <div className="relative w-full overflow-hidden rounded-xl border border-slate-800 bg-slate-900/50 p-1">
      <ChartTooltip {...tooltip} />

      <svg
        viewBox={`0 0 ${containerWidth} ${containerHeight}`}
        className="w-full h-auto select-none rounded-lg"
        style={{ minHeight: `${height}px` }}
      >
        {tiles.map((tile) => {
          const isHovered = hoveredIdx === tile.idx;
          return (
            <g
              key={tile.idx}
              className="cursor-pointer transition-all duration-200"
              onMouseEnter={(e) => {
                setHoveredIdx(tile.idx);
                setTooltip({
                  visible: true,
                  x: e.clientX,
                  y: e.clientY,
                  title: tile.item.label,
                  items: [
                    {
                      label: metricCol?.label || 'Value',
                      value: formatValue(tile.item.value, metricCol?.format),
                      color: tile.color,
                    },
                    {
                      label: 'Share of Total',
                      value: `${(tile.fraction * 100).toFixed(1)}%`,
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
            >
              <rect
                x={tile.x + 2}
                y={tile.y + 2}
                width={Math.max(tile.w - 4, 1)}
                height={Math.max(tile.h - 4, 1)}
                rx={6}
                fill={tile.color}
                opacity={isHovered ? 1 : 0.85}
                stroke={isHovered ? '#ffffff' : '#1e293b'}
                strokeWidth={isHovered ? 2 : 1}
                className="transition-all duration-150"
              />

              {/* Title & Values if tile has enough dimensions */}
              {tile.w > 65 && tile.h > 40 && (
                <text
                  x={tile.x + 10}
                  y={tile.y + 22}
                  className="fill-white font-semibold text-[12px] truncate"
                  style={{ pointerEvents: 'none' }}
                >
                  {tile.item.label.length > Math.floor(tile.w / 8)
                    ? `${tile.item.label.slice(0, Math.floor(tile.w / 8) - 1)}…`
                    : tile.item.label}
                </text>
              )}

              {tile.w > 75 && tile.h > 60 && (
                <>
                  <text
                    x={tile.x + 10}
                    y={tile.y + 40}
                    className="fill-slate-200 font-mono tabular-nums text-[11px]"
                    style={{ pointerEvents: 'none' }}
                  >
                    {formatValue(tile.item.value, metricCol?.format)}
                  </text>
                  <text
                    x={tile.x + 10}
                    y={tile.y + 55}
                    className="fill-slate-300/80 font-mono text-[10px]"
                    style={{ pointerEvents: 'none' }}
                  >
                    {(tile.fraction * 100).toFixed(1)}%
                  </text>
                </>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
};
