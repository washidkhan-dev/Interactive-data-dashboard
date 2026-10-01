import { ColumnDef, ColumnType, AggregationType } from '../types/data';

/**
 * Format numbers with compact or localized formatting
 */
export function formatValue(value: number | string | null | undefined, format?: string): string {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'string') {
    const num = Number(value);
    if (isNaN(num)) return value;
    value = num;
  }

  if (typeof value === 'number') {
    if (isNaN(value)) return '—';
    if (format === 'currency') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: value >= 1000 ? 0 : 2,
      }).format(value);
    }
    if (format === 'percent') {
      return `${(value > 1 && value <= 100 ? value : value * 100).toFixed(1)}%`;
    }
    if (format === 'compact') {
      return new Intl.NumberFormat('en-US', {
        notation: 'compact',
        maximumFractionDigits: 1,
      }).format(value);
    }
    return new Intl.NumberFormat('en-US', {
      maximumFractionDigits: 2,
    }).format(value);
  }

  return String(value);
}

/**
 * Detect column data types from sample rows
 */
export function detectColumnTypes(rows: Record<string, any>[]): ColumnDef[] {
  if (!rows || rows.length === 0) return [];
  const keys = Object.keys(rows[0]);

  return keys.map((key) => {
    let numberCount = 0;
    let dateCount = 0;
    let totalChecked = 0;

    const sample = rows.slice(0, 50);
    for (const row of sample) {
      const val = row[key];
      if (val !== null && val !== undefined && val !== '') {
        totalChecked++;
        if (typeof val === 'number') {
          numberCount++;
        } else if (typeof val === 'string') {
          const trimmed = val.trim();
          // check if numeric
          if (!isNaN(Number(trimmed.replace(/[$,%]/g, '')))) {
            numberCount++;
          } else if (isLikelyDate(trimmed)) {
            dateCount++;
          }
        }
      }
    }

    let type: ColumnType = 'string';
    if (totalChecked > 0 && numberCount / totalChecked >= 0.7) {
      type = 'number';
    } else if (totalChecked > 0 && dateCount / totalChecked >= 0.7) {
      type = 'date';
    }

    // Guess format
    let format: ColumnDef['format'] = 'text';
    const lowerKey = key.toLowerCase();
    if (type === 'number') {
      if (
        lowerKey.includes('revenue') ||
        lowerKey.includes('sales') ||
        lowerKey.includes('cost') ||
        lowerKey.includes('price') ||
        lowerKey.includes('spend') ||
        lowerKey.includes('mrr') ||
        lowerKey.includes('arr') ||
        lowerKey.includes('cac') ||
        lowerKey.includes('profit') ||
        lowerKey.includes('budget')
      ) {
        format = 'currency';
      } else if (
        lowerKey.includes('rate') ||
        lowerKey.includes('percent') ||
        lowerKey.includes('margin') ||
        lowerKey.includes('share') ||
        lowerKey.includes('churn') ||
        lowerKey.includes('growth') ||
        lowerKey.includes('pct')
      ) {
        format = 'percent';
      } else {
        format = 'number';
      }
    } else if (type === 'date') {
      format = 'date';
    }

    // Capitalize key for label
    const label = key
      .replace(/[_-]/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());

    return { key, label, type, format };
  });
}

function isLikelyDate(val: string): boolean {
  if (val.length < 4 || /^\d+$/.test(val)) return false;
  const d = Date.parse(val);
  return !isNaN(d) && (val.includes('-') || val.includes('/') || val.includes(','));
}

/**
 * Parse CSV / TSV text into array of row objects
 */
export function parseCSV(text: string): { rows: Record<string, any>[]; columns: ColumnDef[] } {
  const lines = text.trim().split(/\r\n|\n/);
  if (lines.length === 0) return { rows: [], columns: [] };

  // Detect delimiter: comma, tab, or semicolon
  const firstLine = lines[0];
  let delimiter = ',';
  if ((firstLine.match(/\t/g) || []).length > (firstLine.match(/,/g) || []).length) {
    delimiter = '\t';
  } else if ((firstLine.match(/;/g) || []).length > (firstLine.match(/,/g) || []).length) {
    delimiter = ';';
  }

  // Parse header
  const headers = parseCSVLine(firstLine, delimiter).map((h) => h.trim().replace(/^["']|["']$/g, ''));

  const rows: Record<string, any>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const values = parseCSVLine(line, delimiter);
    const row: Record<string, any> = {};

    headers.forEach((header, idx) => {
      let rawVal = values[idx] !== undefined ? values[idx].trim().replace(/^["']|["']$/g, '') : '';
      
      // Auto convert numeric strings
      const cleaned = rawVal.replace(/[$,]/g, '').trim();
      if (cleaned.endsWith('%')) {
        const pctVal = Number(cleaned.slice(0, -1));
        if (!isNaN(pctVal)) {
          row[header] = pctVal;
          return;
        }
      }
      const numVal = Number(cleaned);
      if (cleaned !== '' && !isNaN(numVal)) {
        row[header] = numVal;
      } else {
        row[header] = rawVal;
      }
    });

    rows.push(row);
  }

  const columns = detectColumnTypes(rows);
  return { rows, columns };
}

function parseCSVLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"' || char === "'") {
      inQuotes = !inQuotes;
    } else if (char === delimiter && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

/**
 * Parse JSON text (object array)
 */
export function parseJSON(text: string): { rows: Record<string, any>[]; columns: ColumnDef[] } {
  try {
    let parsed = JSON.parse(text);
    if (!Array.isArray(parsed)) {
      if (typeof parsed === 'object' && parsed !== null) {
        // Try to find first array property
        const arrayProp = Object.values(parsed).find((val) => Array.isArray(val));
        if (arrayProp) {
          parsed = arrayProp;
        } else {
          parsed = [parsed];
        }
      } else {
        return { rows: [], columns: [] };
      }
    }

    const rows = parsed.map((item: any) => {
      const flat: Record<string, any> = {};
      for (const [k, v] of Object.entries(item)) {
        if (typeof v === 'object' && v !== null) {
          flat[k] = JSON.stringify(v);
        } else {
          flat[k] = v;
        }
      }
      return flat;
    });

    const columns = detectColumnTypes(rows);
    return { rows, columns };
  } catch (e) {
    throw new Error('Invalid JSON format. Expected an array of objects.');
  }
}

/**
 * Aggregate rows by dimension and metric
 */
export function aggregateData(
  rows: Record<string, any>[],
  dimension: string,
  metric: string,
  secondaryMetric?: string,
  aggregation: AggregationType = 'sum',
  sortBy: string = 'value-desc',
  topN: number = 0
): { label: string; value: number; secondaryValue?: number; count: number }[] {
  if (!rows || rows.length === 0 || !dimension) return [];

  const map = new Map<string, { sum: number; sumSec: number; count: number; min: number; max: number; values: number[] }>();

  for (const row of rows) {
    const rawLabel = row[dimension];
    const label = rawLabel !== null && rawLabel !== undefined && rawLabel !== '' ? String(rawLabel) : '(Unknown)';
    const val = typeof row[metric] === 'number' ? row[metric] : Number(row[metric]) || 0;
    const secVal = secondaryMetric
      ? typeof row[secondaryMetric] === 'number'
        ? row[secondaryMetric]
        : Number(row[secondaryMetric]) || 0
      : 0;

    let entry = map.get(label);
    if (!entry) {
      entry = { sum: 0, sumSec: 0, count: 0, min: val, max: val, values: [] };
      map.set(label, entry);
    }

    entry.sum += val;
    if (secondaryMetric) {
      entry.sumSec += secVal;
    }
    entry.count += 1;
    entry.min = Math.min(entry.min, val);
    entry.max = Math.max(entry.max, val);
    entry.values.push(val);
  }

  const results: { label: string; value: number; secondaryValue?: number; count: number }[] = [];

  map.forEach((entry, label) => {
    let finalVal = 0;
    let finalSecVal = 0;

    switch (aggregation) {
      case 'sum':
        finalVal = entry.sum;
        finalSecVal = entry.sumSec;
        break;
      case 'avg':
        finalVal = entry.count > 0 ? entry.sum / entry.count : 0;
        finalSecVal = entry.count > 0 ? entry.sumSec / entry.count : 0;
        break;
      case 'min':
        finalVal = entry.min;
        finalSecVal = entry.sumSec;
        break;
      case 'max':
        finalVal = entry.max;
        finalSecVal = entry.sumSec;
        break;
      case 'count':
        finalVal = entry.count;
        finalSecVal = entry.count;
        break;
    }

    results.push({
      label,
      value: Math.round(finalVal * 100) / 100,
      secondaryValue: secondaryMetric ? Math.round(finalSecVal * 100) / 100 : undefined,
      count: entry.count,
    });
  });

  // Sorting
  results.sort((a, b) => {
    if (sortBy === 'value-desc') return b.value - a.value;
    if (sortBy === 'value-asc') return a.value - b.value;
    if (sortBy === 'label-asc') return a.label.localeCompare(b.label);
    if (sortBy === 'label-desc') return b.label.localeCompare(a.label);
    return 0;
  });

  if (topN > 0 && results.length > topN) {
    const topItems = results.slice(0, topN);
    const remaining = results.slice(topN);
    const otherVal = remaining.reduce((acc, curr) => acc + curr.value, 0);
    const otherCount = remaining.reduce((acc, curr) => acc + curr.count, 0);
    
    topItems.push({
      label: 'Other',
      value: Math.round(otherVal * 100) / 100,
      count: otherCount,
    });
    return topItems;
  }

  return results;
}

/**
 * Generate 2D Heatmap matrix (Dimension X vs Dimension Y)
 */
export function generateHeatmapData(
  rows: Record<string, any>[],
  dimX: string,
  dimY: string,
  metric: string,
  aggregation: AggregationType = 'sum'
): { xLabels: string[]; yLabels: string[]; matrix: { x: string; y: string; value: number }[]; min: number; max: number } {
  const xSet = new Set<string>();
  const ySet = new Set<string>();
  const cellMap = new Map<string, { sum: number; count: number }>();

  for (const row of rows) {
    const xVal = String(row[dimX] || 'Unknown');
    const yVal = String(row[dimY] || 'Unknown');
    const val = Number(row[metric]) || 0;

    xSet.add(xVal);
    ySet.add(yVal);

    const key = `${xVal}:::${yVal}`;
    const entry = cellMap.get(key) || { sum: 0, count: 0 };
    entry.sum += val;
    entry.count += 1;
    cellMap.set(key, entry);
  }

  const xLabels = Array.from(xSet).slice(0, 12);
  const yLabels = Array.from(ySet).slice(0, 10);

  const matrix: { x: string; y: string; value: number }[] = [];
  let min = Infinity;
  let max = -Infinity;

  for (const x of xLabels) {
    for (const y of yLabels) {
      const entry = cellMap.get(`${x}:::${y}`);
      let value = 0;
      if (entry) {
        value = aggregation === 'avg' && entry.count > 0 ? entry.sum / entry.count : entry.sum;
      }
      value = Math.round(value * 100) / 100;
      matrix.push({ x, y, value });
      min = Math.min(min, value);
      max = Math.max(max, value);
    }
  }

  if (min === Infinity) min = 0;
  if (max === -Infinity) max = 1;

  return { xLabels, yLabels, matrix, min, max };
}

/**
 * Generate export data as CSV string
 */
export function exportToCSV(rows: Record<string, any>[]): string {
  if (!rows || rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(',')];

  for (const row of rows) {
    const values = headers.map((header) => {
      const val = row[header];
      if (val === null || val === undefined) return '';
      const str = String(val);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    });
    lines.push(values.join(','));
  }

  return lines.join('\n');
}
