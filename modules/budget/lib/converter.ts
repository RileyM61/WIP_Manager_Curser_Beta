import * as XLSX from 'xlsx';
import { StatementType } from '../types';
import { normalizePeriodLabel, normalizeStatementType } from './importUtils';

export interface RawTableData {
  headers: string[];
  rows: Record<string, string | number>[];
}

export interface ColumnSample {
  key: string;
  label: string;
  samples: string[];
}

export interface MonthColumn {
  header: string;
  period: string;
}

export interface ConverterMapping {
  statementMode: 'single' | 'column';
  singleStatement: StatementType;
  statementColumn?: string;
  lineNameColumn: string;
  lineCodeColumn?: string;
  categoryColumn?: string;
  subcategoryColumn?: string;
  defaultCategory?: string;
  defaultSubcategory?: string;
  monthHeaders: string[];
  skipTotalRows: boolean;
  skipZeroRows: boolean;
}

export interface ConvertedLine {
  statement: StatementType;
  lineCode: string;
  lineName: string;
  category?: string | null;
  subcategory?: string | null;
  values: Record<string, number>;
}

const ACCOUNT_HINTS = ['account', 'name', 'description', 'line', 'label'];
const CODE_HINTS = ['code', 'number', '#', 'id'];
const CATEGORY_HINTS = ['category', 'type', 'class', 'group'];
const SUBCATEGORY_HINTS = ['sub', 'detail'];

export async function parseWorkbookFile(file: File): Promise<RawTableData> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  const table = XLSX.utils.sheet_to_json<(string | number)[]>(worksheet, {
    header: 1,
    blankrows: false,
    defval: '',
    raw: false,
  });

  if (!table.length) {
    throw new Error('The uploaded file is empty.');
  }

  const { headers, dataStartIndex } = detectHeaderRow(table);
  const rows = table.slice(dataStartIndex).map((row) => {
    const record: Record<string, string | number> = {};
    headers.forEach((header, index) => {
      const value = row[index];
      record[header] = typeof value === 'number' ? value : (value ?? '').toString();
    });
    return record;
  });

  return { headers, rows };
}

export function detectHeaderRow(table: (string | number)[][]): { headers: string[]; dataStartIndex: number } {
  let headerIndex = 0;
  let monthOnlyCandidate: number | null = null;

  for (let i = 0; i < table.length; i++) {
    const row = table[i];
    const normalized = row.map((cell) => cell?.toString().trim().toLowerCase());
    const monthCount = row.reduce((count, cell) => (normalizePeriodLabel(cell?.toString() ?? '') ? count + 1 : count), 0);
    const hasAccountHint = normalized.some((value) => value && ACCOUNT_HINTS.some((hint) => value.includes(hint)));
    const firstCellHasText = Boolean(normalized[0]);

    if (hasAccountHint) {
      headerIndex = i;
      break;
    }

    if (monthCount >= 2) {
      if (firstCellHasText) {
        headerIndex = i;
        break;
      }
      if (monthOnlyCandidate === null) {
        monthOnlyCandidate = i;
      }
      const nextRow = table[i + 1];
      if (nextRow) {
        const nextNormalized = nextRow.map((cell) => cell?.toString().trim().toLowerCase());
        const nextHasAccount = nextNormalized.some((value) => value && ACCOUNT_HINTS.some((hint) => value.includes(hint)));
        if (nextHasAccount) {
          headerIndex = i + 1;
          break;
        }
      }
    }
  }

  if (headerIndex === 0 && monthOnlyCandidate !== null) {
    headerIndex = monthOnlyCandidate;
  }

  const headerRow = table[headerIndex] ?? table[0];
  const headers = headerRow.map((cell, index) => {
    const label = cell?.toString().trim();
    return label || `Column ${index + 1}`;
  });

  const dataStartIndex = Math.min(headerIndex + 1, table.length);
  return { headers, dataStartIndex };
}

export function buildColumnSamples(rows: Record<string, string | number>[], headers: string[]): ColumnSample[] {
  return headers.map((key) => {
    const samples = rows
      .map((row) => row[key])
      .filter((value) => value !== undefined && value !== null && value !== '')
      .slice(0, 3)
      .map((value) => value.toString());

    return {
      key,
      label: key,
      samples,
    };
  });
}

export function detectMonthColumns(headers: string[]): MonthColumn[] {
  return headers
    .map((header) => {
      const period = normalizePeriodLabel(header);
      return period ? { header, period } : null;
    })
    .filter((item): item is MonthColumn => Boolean(item));
}

export function guessColumn(headers: string[], hints: string[]): string | undefined {
  return headers.find((header) => {
    const lower = header.toLowerCase();
    return hints.some((hint) => lower.includes(hint));
  });
}

export function defaultMapping(headers: string[], monthHeaders: string[]): ConverterMapping {
  return {
    statementMode: 'single',
    singleStatement: 'income_statement',
    lineNameColumn: guessColumn(headers, ACCOUNT_HINTS) || headers[0],
    lineCodeColumn: guessColumn(headers, CODE_HINTS),
    categoryColumn: guessColumn(headers, CATEGORY_HINTS),
    subcategoryColumn: guessColumn(headers, SUBCATEGORY_HINTS),
    defaultCategory: '',
    defaultSubcategory: '',
    monthHeaders,
    skipTotalRows: true,
    skipZeroRows: true,
  };
}

const TOTAL_ROW_PATTERNS = ['total', 'grand total', 'net income', 'net profit'];

export function convertRows(
  rawRows: Record<string, string | number>[],
  mapping: ConverterMapping,
  availableMonths: MonthColumn[]
): ConvertedLine[] {
  if (!mapping.lineNameColumn) {
    return [];
  }

  const monthMap = availableMonths
    .filter((month) => mapping.monthHeaders.includes(month.header))
    .map((month) => month);

  const result: ConvertedLine[] = [];
  const codeCounts = new Map<string, number>();

  rawRows.forEach((row) => {
    const lineName = (row[mapping.lineNameColumn] ?? '').toString().trim();
    if (!lineName) {
      return;
    }

    const lowerName = lineName.toLowerCase();
    if (mapping.skipTotalRows && TOTAL_ROW_PATTERNS.some((pattern) => lowerName.startsWith(pattern))) {
      return;
    }

    let statement: StatementType = mapping.singleStatement;
    if (mapping.statementMode === 'column' && mapping.statementColumn) {
      const rawStatement = row[mapping.statementColumn]?.toString();
      statement = normalizeStatementType(rawStatement || '');
    }

    let lineCode = mapping.lineCodeColumn ? row[mapping.lineCodeColumn]?.toString().trim() : '';
    if (!lineCode) {
      const slug = lineName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 40);
      const baseCode = slug || 'line';
      const currentCount = codeCounts.get(baseCode) ?? 0;
      codeCounts.set(baseCode, currentCount + 1);
      lineCode = currentCount === 0 ? baseCode : `${baseCode}-${currentCount + 1}`;
    }

    const category =
      (mapping.categoryColumn ? row[mapping.categoryColumn]?.toString() : mapping.defaultCategory?.trim()) || null;
    const subcategory =
      (mapping.subcategoryColumn ? row[mapping.subcategoryColumn]?.toString() : mapping.defaultSubcategory?.trim()) ||
      null;

    const values: Record<string, number> = {};
    monthMap.forEach((month) => {
      const cell = row[month.header];
      const numeric = typeof cell === 'number' ? cell : parseFloat((cell ?? '').toString().replace(/[$,]/g, ''));
      if (!Number.isFinite(numeric)) {
        values[month.period] = 0;
      } else {
        values[month.period] = numeric;
      }
    });

    const total = Object.values(values).reduce((sum, value) => sum + (Number.isFinite(value) ? value : 0), 0);
    if (mapping.skipZeroRows && total === 0) {
      return;
    }

    result.push({
      statement,
      lineCode,
      lineName,
      category,
      subcategory,
      values,
    });
  });

  return result;
}

export function buildTemplateCsv(lines: ConvertedLine[], periods: string[]): string {
  const header = ['Statement', 'Line Code', 'Line Name', 'Category', 'Subcategory', ...periods];
  const rows = lines.map((line) => {
    const statementLabel = line.statement === 'income_statement' ? 'Income Statement' : 'Balance Sheet';
    const base = [statementLabel, line.lineCode, line.lineName, line.category ?? '', line.subcategory ?? ''];
    const monthValues = periods.map((period) => {
      const value = line.values[period] ?? 0;
      return value.toString();
    });
    return [...base, ...monthValues];
  });

  return [header.join(','), ...rows.map((row) => row.map(escapeCsvValue).join(','))].join('\n');
}

function escapeCsvValue(value: string): string {
  if (value.includes(',') || value.includes('"')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function summarizeConvertedLines(lines: ConvertedLine[]): { rowCount: number; periodStart?: string; periodEnd?: string } {
  if (!lines.length) {
    return { rowCount: 0 };
  }

  const periods = new Set<string>();
  lines.forEach((line) => {
    Object.keys(line.values).forEach((period) => {
      periods.add(period);
    });
  });

  const sorted = Array.from(periods).sort();
  return {
    rowCount: lines.length,
    periodStart: sorted[0],
    periodEnd: sorted[sorted.length - 1],
  };
}

