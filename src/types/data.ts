export type ColumnType = 'string' | 'number' | 'date';

export interface ColumnDef {
  key: string;
  label: string;
  type: ColumnType;
  format?: 'currency' | 'percent' | 'number' | 'date' | 'text';
}

export type AggregationType = 'sum' | 'avg' | 'count' | 'min' | 'max';

export type ChartType = 
  | 'bar' 
  | 'horizontal-bar'
  | 'line' 
  | 'area' 
  | 'donut' 
  | 'scatter' 
  | 'radar' 
  | 'heatmap' 
  | 'treemap' 
  | 'funnel';

export interface Dataset {
  id: string;
  name: string;
  description: string;
  category: string;
  columns: ColumnDef[];
  rows: Record<string, any>[];
  defaultDimension: string;
  defaultMetric: string;
  secondaryMetric?: string;
  defaultDateColumn?: string;
}

export interface ChartConfig {
  type: ChartType;
  dimension: string;
  metric: string;
  secondaryMetric?: string;
  tertiaryMetric?: string; // used for scatter bubble size
  aggregation: AggregationType;
  sortBy: 'value-desc' | 'value-asc' | 'label-asc' | 'label-desc';
  topN: number; // 0 for all
  stacked?: boolean;
  showValues?: boolean;
}

export interface FilterState {
  search: string;
  dateRange: { start: string; end: string };
  categoryFilter: Record<string, string[]>; // columnKey -> array of selected values
  metricThresholds: Record<string, { min: number; max: number }>;
}
