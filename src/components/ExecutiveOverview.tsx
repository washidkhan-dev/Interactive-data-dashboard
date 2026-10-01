import React from 'react';
import { Dataset } from '../types/data';
import { aggregateData, formatValue } from '../utils/dataParser';
import { BarChart } from './charts/BarChart';
import { LineChart } from './charts/LineChart';
import { DonutChart } from './charts/DonutChart';
import { HeatmapChart } from './charts/HeatmapChart';
import { KPIGrid } from './KPIGrid';
import {
  CreditCard,
  TrendingUp,
  Award,
  CalendarCheck,
  ShoppingBag,
  CircleDollarSign,
} from 'lucide-react';

interface ExecutiveOverviewProps {
  dataset: Dataset;
  filteredRows: Record<string, any>[];
  onNavigateToStudio: () => void;
}

export const ExecutiveOverview: React.FC<ExecutiveOverviewProps> = ({
  dataset,
  filteredRows,
  onNavigateToStudio,
}) => {
  const metricCols = dataset.columns.filter((c) => c.type === 'number');
  const dateCol = dataset.columns.find((c) => c.type === 'date');
  const productCol = dataset.columns.find((c) => c.key === 'Product') || dataset.columns[1];
  const paymentCol = dataset.columns.find((c) => c.key === 'PaymentMethod') || dataset.columns[4];
  const priceCol = dataset.columns.find((c) => c.key === 'Price') || metricCols[0];

  // Aggregated data slices
  const productsByRevenue = aggregateData(
    filteredRows,
    productCol?.key || 'Product',
    priceCol?.key || 'Price',
    undefined,
    'sum',
    'value-desc',
    8
  );

  const paymentShare = aggregateData(
    filteredRows,
    paymentCol?.key || 'PaymentMethod',
    priceCol?.key || 'Price',
    undefined,
    'sum',
    'value-desc'
  );

  const timelineSales = aggregateData(
    filteredRows,
    dateCol?.key || 'Date',
    priceCol?.key || 'Price',
    undefined,
    'sum',
    'label-asc'
  );

  // Compute strategic highlights
  const topProduct = productsByRevenue[0];
  const topPayment = paymentShare[0];
  const totalRevenue = filteredRows.reduce((acc, curr) => acc + (Number(curr[priceCol?.key]) || 0), 0);
  const avgOrderPrice = filteredRows.length > 0 ? totalRevenue / filteredRows.length : 0;
  const highestSingleItem = Math.max(...filteredRows.map((r) => Number(r[priceCol?.key]) || 0), 0);

  return (
    <div className="space-y-6">
      {/* KPI Cards Grid */}
      <KPIGrid
        rows={filteredRows}
        metricColumns={metricCols}
        dateColumn={dateCol}
      />

      {/* Strategic Insight Badges Bar (Anti-Slop: clean unboxed metadata) */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3.5 backdrop-blur-md grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0">
            <Award className="w-4 h-4" />
          </div>
          <div className="truncate">
            <div className="text-[11px] text-slate-400">Top Revenue Product</div>
            <div className="font-semibold text-slate-200 truncate">
              {topProduct?.label || '—'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center shrink-0">
            <CreditCard className="w-4 h-4" />
          </div>
          <div className="truncate">
            <div className="text-[11px] text-slate-400">Dominant Payment Method</div>
            <div className="font-semibold text-slate-200 truncate">
              {topPayment?.label || '—'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
            <CircleDollarSign className="w-4 h-4" />
          </div>
          <div className="truncate">
            <div className="text-[11px] text-slate-400">Peak Single Item</div>
            <div className="font-mono tabular-nums font-semibold text-slate-200">
              {formatValue(highestSingleItem, priceCol?.format)}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
            <ShoppingBag className="w-4 h-4" />
          </div>
          <div className="truncate">
            <div className="text-[11px] text-slate-400">Item Count</div>
            <div className="font-mono tabular-nums font-semibold text-slate-200">
              {filteredRows.length} transactions
            </div>
          </div>
        </div>
      </div>

      {/* 2x2 Interactive Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Product Revenue Leaders */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-md flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-100">
                Top Products by Revenue ($)
              </h3>
              <p className="text-[11px] text-slate-400">
                Aggregated sales volume across product lines.
              </p>
            </div>
            <button
              onClick={onNavigateToStudio}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
            >
              Explore in Studio →
            </button>
          </div>
          <BarChart
            data={productsByRevenue}
            metricCol={priceCol}
            height={300}
          />
        </div>

        {/* Chart 2: Payment Method Share */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-md flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-100">
                Payment Method Share & Distribution
              </h3>
              <p className="text-[11px] text-slate-400">
                Breakdown of customer checkout preferences.
              </p>
            </div>
            <button
              onClick={onNavigateToStudio}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
            >
              Analyze →
            </button>
          </div>
          <DonutChart
            data={paymentShare}
            metricCol={priceCol}
            height={300}
          />
        </div>

        {/* Chart 3: Timeline Sales Velocity */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-md flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-100">
                Daily Sales Velocity & Order Trajectory
              </h3>
              <p className="text-[11px] text-slate-400">
                Daily order revenue from August 2025 through October 2025.
              </p>
            </div>
            <button
              onClick={onNavigateToStudio}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
            >
              View Trend →
            </button>
          </div>
          <LineChart
            data={timelineSales}
            metricCol={priceCol}
            height={300}
            areaFill={true}
          />
        </div>

        {/* Chart 4: Product vs Payment Heatmap */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-md flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-100">
                Cross-Tab Heatmap: Product × Payment Method
              </h3>
              <p className="text-[11px] text-slate-400">
                Channel density and transaction volume intersection.
              </p>
            </div>
            <button
              onClick={onNavigateToStudio}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
            >
              Matrix View →
            </button>
          </div>
          <HeatmapChart
            rows={filteredRows}
            dimXCol={paymentCol}
            dimYCol={productCol}
            metricCol={priceCol}
            aggregation="sum"
          />
        </div>
      </div>
    </div>
  );
};
