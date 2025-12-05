import * as XLSX from 'xlsx';
import { StatementType } from '../types';

export interface ParsedLineValue {
  period: string; // YYYY-MM
  amount: number;
}

export interface ParsedLineRow {
  statementType: StatementType;
  lineCode: string;
  lineName: string;
  lineCategory: string | null;
  lineSubcategory: string | null;
  values: ParsedLineValue[];
}

export interface WorkbookParseOptions {
  minimumPeriods?: number;
  requireStatement?: boolean;
}

const MONTH_LABELS = [
  'january',
  'february',
  'march',
  'april',
  'may',
  'june',
  'july',
  'august',
  'september',
  'october',
  'november',
  'december',
];

const STATEMENT_ALIASES: Record<string, StatementType> = {
  income: 'income_statement',
  'income statement': 'income_statement',
  p: 'income_statement',
  p_l: 'income_statement',
  'p&l': 'income_statement',
  is: 'income_statement',
  revenue: 'income_statement',
  'profit and loss': 'income_statement',
  balance: 'balance_sheet',
  'balance sheet': 'balance_sheet',
  bs: 'balance_sheet',
  assets: 'balance_sheet',
  liabilities: 'balance_sheet',
};

export function normalizeStatementType(value: string | undefined | null): StatementType {
  if (!value) return 'income_statement';
  const normalized = value.toString().trim().toLowerCase();
  if (normalized in STATEMENT_ALIASES) {
    return STATEMENT_ALIASES[normalized];
  }
  return normalized.includes('balance') ? 'balance_sheet' : 'income_statement';
}

export function normalizePeriodLabel(label: string): string | null {
  const trimmed = label.trim();

  // Already formatted as YYYY-MM
  const directMatch = trimmed.match(/^(\d{4})[/-](\d{1,2})$/);
  if (directMatch) {
    const [, year, month] = directMatch;
    const paddedMonth = month.padStart(2, '0');
    return `${year}-${paddedMonth}`;
  }

  // Format like "Jan-2024" or "January 2024"
  const words = trimmed.toLowerCase().replace('_', ' ').split(/\s|-/).filter(Boolean);
  if (words.length >= 2) {
    const monthIndex = MONTH_LABELS.findIndex((label) => label.startsWith(words[0]));
    if (monthIndex !== -1) {
      const year = words.find((part) => /^\d{4}$/.test(part));
      if (year) {
        const month = String(monthIndex + 1).padStart(2, '0');
        return `${year}-${month}`;
      }
    }
  }

  // Attempt Date parsing
  const parsed = new Date(trimmed);
  if (!Number.isNaN(parsed.getTime())) {
    const year = parsed.getFullYear();
    const month = String(parsed.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }

  return null;
}

function parseNumericValue(value: unknown): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const cleaned = value.replace(/[$,]/g, '').trim();
    if (!cleaned) return 0;
    const parsed = Number(cleaned);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

export async function parseFinancialWorkbook(
  file: File,
  options: WorkbookParseOptions = {}
): Promise<ParsedLineRow[]> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
    defval: '',
    raw: false,
  });

  if (!rows.length) {
    throw new Error('The uploaded file does not contain any rows.');
  }

  const headers = Object.keys(rows[0]);
  const periodColumns = headers
    .map((header) => ({
      key: header,
      period: normalizePeriodLabel(header),
    }))
    .filter((entry) => entry.period !== null) as { key: string; period: string }[];

  if (!periodColumns.length) {
    throw new Error('Could not detect any month columns. Please ensure headers look like "2023-01" or "Jan 2023".');
  }

  if (options.minimumPeriods && periodColumns.length < options.minimumPeriods) {
    throw new Error(`Expected at least ${options.minimumPeriods} months, but found ${periodColumns.length}.`);
  }

  const parsedRows: ParsedLineRow[] = [];

  rows.forEach((row) => {
    const lineCode = (row['Line Code'] || row['Code'] || row['Account'] || row['line_code'])?.toString().trim();
    const lineName = (row['Line Name'] || row['Name'] || row['Account Name'] || row['line_name'])?.toString().trim();

    if (!lineName) return;

    const statementValue = (row['Statement'] || row['Statement Type'] || row['Type'])?.toString();
    const statementType = normalizeStatementType(statementValue || undefined);

    const category =
      (row['Category'] || row['Line Category'] || row['Group'])?.toString().trim() || null;
    const subcategory =
      (row['Subcategory'] || row['Line Subcategory'] || row['Sub Category'])?.toString().trim() || null;

    const values: ParsedLineValue[] = periodColumns
      .map(({ key, period }) => ({
        period,
        amount: parseNumericValue(row[key]),
      }))
      .filter((entry) => entry.amount !== 0);

    if (!values.length) return;

    parsedRows.push({
      statementType,
      lineCode: lineCode || `${statementType}-${lineName.toLowerCase().replace(/\s+/g, '-')}`,
      lineName,
      lineCategory: category,
      lineSubcategory: subcategory,
      values,
    });
  });

  if (!parsedRows.length) {
    throw new Error('No usable financial rows were found after parsing the file.');
  }

  return parsedRows;
}

export function summarizePeriods(rows: ParsedLineRow[]): { start: string; end: string } {
  const periods = new Set<string>();
  rows.forEach((row) => {
    row.values.forEach((value) => periods.add(value.period));
  });

  const sorted = Array.from(periods).sort();
  return {
    start: sorted[0],
    end: sorted[sorted.length - 1],
  };
}

export function summarizeStatements(rows: ParsedLineRow[]): StatementType | 'both' {
  const set = new Set(rows.map((row) => row.statementType));
  if (set.size === 1) {
    return rows[0].statementType;
  }
  return 'both';
}

