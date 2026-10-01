import React from 'react';

interface ChartTooltipProps {
  visible: boolean;
  x: number;
  y: number;
  title: string;
  items: { label: string; value: string; color?: string }[];
}

export const ChartTooltip: React.FC<ChartTooltipProps> = ({ visible, x, y, title, items }) => {
  if (!visible) return null;

  return (
    <div
      className="pointer-events-none fixed z-50 rounded-lg border border-slate-700 bg-slate-900/95 px-3 py-2 shadow-xl backdrop-blur-md transition-all duration-75 text-xs"
      style={{
        left: `${x + 12}px`,
        top: `${y - 10}px`,
        maxWidth: '260px',
      }}
    >
      <div className="font-semibold text-slate-200 border-b border-slate-800 pb-1 mb-1.5 truncate">
        {title}
      </div>
      <div className="space-y-1">
        {items.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between gap-3 text-slate-300">
            <span className="flex items-center gap-1.5 text-slate-400">
              {item.color && (
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: item.color }}
                />
              )}
              <span className="truncate">{item.label}</span>
            </span>
            <span className="font-mono tabular-nums font-medium text-slate-100 shrink-0">
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
