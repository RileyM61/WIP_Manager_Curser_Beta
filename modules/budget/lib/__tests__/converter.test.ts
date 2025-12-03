import { describe, expect, it } from 'vitest';
import {
  buildTemplateCsv,
  convertRows,
  ConverterMapping,
  detectHeaderRow,
  detectMonthColumns,
  summarizeConvertedLines,
} from '../converter';

const sampleHeaders = ['Account', 'Type', 'Jan 2024', 'Feb 2024', 'Mar 2024'];
const sampleRows = [
  { Account: 'Revenue - Commercial', Type: 'Income Statement', 'Jan 2024': 50000, 'Feb 2024': 52000, 'Mar 2024': 54000 },
  { Account: 'Revenue - Residential', Type: 'Income Statement', 'Jan 2024': 30000, 'Feb 2024': 31000, 'Mar 2024': 32000 },
];

const baseMapping: ConverterMapping = {
  statementMode: 'column',
  singleStatement: 'income_statement',
  statementColumn: 'Type',
  lineNameColumn: 'Account',
  lineCodeColumn: undefined,
  categoryColumn: undefined,
  subcategoryColumn: undefined,
  defaultCategory: '',
  defaultSubcategory: '',
  monthHeaders: ['Jan 2024', 'Feb 2024', 'Mar 2024'],
  skipTotalRows: true,
  skipZeroRows: true,
};

describe('converter helpers', () => {
  it('detects header row using month heuristics', () => {
    const table = [
      ['Profit and Loss by Month'],
      ['', 'Jan 2024', 'Feb 2024'],
      ['Account', 'Jan 2024', 'Feb 2024'],
      ['Revenue - A', 100, 200],
    ];

    const { headers, dataStartIndex } = detectHeaderRow(table);
    expect(headers).toEqual(['Account', 'Jan 2024', 'Feb 2024']);
    expect(dataStartIndex).toBe(3);
  });

  it('converts rows using selected months and statement column', () => {
    const months = detectMonthColumns(sampleHeaders);
    const converted = convertRows(sampleRows, baseMapping, months);

    expect(converted).toHaveLength(2);
    expect(converted[0].statement).toBe('income_statement');
    expect(converted[0].values['2024-01']).toBe(50000);
  });

  it('builds CSV in template format', () => {
    const months = detectMonthColumns(sampleHeaders);
    const converted = convertRows(sampleRows, baseMapping, months);
    const csv = buildTemplateCsv(converted, months.map((month) => month.period));
    expect(csv.split('\n')).toHaveLength(3); // header + 2 rows
    expect(csv).toContain('Income Statement');
  });

  it('summarizes converted lines', () => {
    const months = detectMonthColumns(sampleHeaders);
    const converted = convertRows(sampleRows, baseMapping, months);
    const summary = summarizeConvertedLines(converted);
    expect(summary.rowCount).toBe(2);
    expect(summary.periodStart).toBe('2024-01');
    expect(summary.periodEnd).toBe('2024-03');
  });
});

