/**
 * Value Builder Module Constants
 */

import { ValuationFormData } from './types';

// Default values for new valuations
export const DEFAULT_VALUATION: ValuationFormData = {
  name: '',
  annualRevenue: 0,
  netProfit: 0,
  ownerCompensation: 0,
  depreciation: 0,
  interestExpense: 0,
  taxes: 0,
  otherAddbacks: 0,
  multiple: 3.0,
  notes: '',
  isCurrent: false,
};

// Multiple ranges by company size
export const MULTIPLE_RANGES = [
  { minRevenue: 0, maxRevenue: 5_000_000, low: 2.0, mid: 2.5, high: 3.0, label: 'Under $5M revenue' },
  { minRevenue: 5_000_000, maxRevenue: 15_000_000, low: 2.5, mid: 3.25, high: 4.0, label: '$5M - $15M revenue' },
  { minRevenue: 15_000_000, maxRevenue: 50_000_000, low: 3.5, mid: 4.25, high: 5.0, label: '$15M - $50M revenue' },
  { minRevenue: 50_000_000, maxRevenue: Infinity, low: 4.0, mid: 5.0, high: 6.0, label: 'Over $50M revenue' },
];

// Multiple slider configuration
export const MULTIPLE_CONFIG = {
  min: 1.5,
  max: 7.0,
  step: 0.1,
};

// Get suggested multiple range based on revenue
export const getSuggestedMultiple = (revenue: number): { low: number; mid: number; high: number; label: string } => {
  const range = MULTIPLE_RANGES.find(r => revenue >= r.minRevenue && revenue < r.maxRevenue);
  return range || MULTIPLE_RANGES[0];
};

// Multiple descriptions based on value
export const getMultipleDescription = (multiple: number): string => {
  if (multiple < 2.5) return 'Small company, project-based work';
  if (multiple < 3.5) return 'Growing company, good systems';
  if (multiple < 4.5) return 'Established, repeat customers';
  if (multiple < 5.5) return 'Market leader, diversified revenue';
  return 'Premium brand, exceptional growth';
};

// EBITDA add-back categories with descriptions
export const ADDBACK_CATEGORIES = [
  {
    key: 'ownerCompensation',
    label: 'Owner Compensation Adjustments',
    tooltip: 'Excess salary above market rate, personal expenses run through business',
    placeholder: '0',
  },
  {
    key: 'depreciation',
    label: 'Depreciation & Amortization',
    tooltip: 'Non-cash expense from your tax return',
    placeholder: '0',
  },
  {
    key: 'interestExpense',
    label: 'Interest Expense',
    tooltip: 'Interest paid on loans and credit lines',
    placeholder: '0',
  },
  {
    key: 'taxes',
    label: 'Taxes Paid',
    tooltip: 'Income taxes paid by the business',
    placeholder: '0',
  },
  {
    key: 'otherAddbacks',
    label: 'Other One-time/Discretionary',
    tooltip: 'One-time expenses, personal vehicles, family payroll, etc.',
    placeholder: '0',
  },
] as const;

// Value trend chart configuration
export const TREND_CHART_CONFIG = {
  defaultMonths: 12,
  minDataPoints: 2,
  colors: {
    value: '#10b981', // emerald-500
    ebitda: '#6366f1', // indigo-500
    grid: '#334155', // slate-700
  },
};

