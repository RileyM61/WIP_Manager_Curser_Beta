/**
 * Value Builder Calculations
 */

import { ValuationInputs, ValuationResults, Valuation } from '../types';

/**
 * Calculate Adjusted EBITDA from inputs
 */
export function calculateAdjustedEbitda(inputs: ValuationInputs): number {
  return (
    inputs.netProfit +
    inputs.ownerCompensation +
    inputs.depreciation +
    inputs.interestExpense +
    inputs.taxes +
    inputs.otherAddbacks
  );
}

/**
 * Calculate business value from EBITDA and multiple
 */
export function calculateBusinessValue(adjustedEbitda: number, multiple: number): number {
  return adjustedEbitda * multiple;
}

/**
 * Calculate all valuation results
 */
export function calculateValuation(inputs: ValuationInputs): ValuationResults {
  const adjustedEbitda = calculateAdjustedEbitda(inputs);
  const businessValue = calculateBusinessValue(adjustedEbitda, inputs.multiple);
  
  const ebitdaMargin = inputs.annualRevenue > 0 
    ? (adjustedEbitda / inputs.annualRevenue) * 100 
    : 0;
  
  const valueToRevenue = inputs.annualRevenue > 0 
    ? (businessValue / inputs.annualRevenue) * 100 
    : 0;

  return {
    adjustedEbitda,
    businessValue,
    ebitdaMargin,
    valueToRevenue,
  };
}

/**
 * Calculate difference between two valuations
 */
export function calculateDelta(current: number, previous: number): { amount: number; percent: number } {
  const amount = current - previous;
  const percent = previous > 0 ? ((current - previous) / previous) * 100 : 0;
  return { amount, percent };
}

/**
 * Format currency for display
 */
export function formatCurrency(value: number, compact = false): string {
  if (compact && Math.abs(value) >= 1_000_000) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value);
  }
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Format number with commas
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Format percentage
 */
export function formatPercent(value: number, decimals = 1): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(decimals)}%`;
}

/**
 * Compare multiple scenarios and generate comparison data
 */
export function compareScenarios(scenarios: Valuation[]): {
  field: string;
  label: string;
  values: number[];
  min: number;
  max: number;
  delta: number;
}[] {
  if (scenarios.length < 2) return [];

  const fields = [
    { key: 'annualRevenue', label: 'Annual Revenue' },
    { key: 'netProfit', label: 'Net Profit' },
    { key: 'ownerCompensation', label: 'Owner Compensation' },
    { key: 'depreciation', label: 'Depreciation' },
    { key: 'interestExpense', label: 'Interest Expense' },
    { key: 'taxes', label: 'Taxes' },
    { key: 'otherAddbacks', label: 'Other Add-backs' },
    { key: 'adjustedEbitda', label: 'Adjusted EBITDA' },
    { key: 'multiple', label: 'Multiple' },
    { key: 'businessValue', label: 'Business Value' },
  ] as const;

  return fields.map(({ key, label }) => {
    const values = scenarios.map(s => s[key] as number);
    const min = Math.min(...values);
    const max = Math.max(...values);
    return {
      field: key,
      label,
      values,
      min,
      max,
      delta: max - min,
    };
  });
}

/**
 * Calculate value growth over time from history records
 */
export function calculateValueGrowth(
  history: { recordedAt: string; businessValue: number }[],
  periodMonths = 12
): { amount: number; percent: number; period: string } | null {
  if (history.length < 2) return null;

  // Sort by date descending
  const sorted = [...history].sort((a, b) => 
    new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime()
  );

  const latest = sorted[0];
  const cutoffDate = new Date(latest.recordedAt);
  cutoffDate.setMonth(cutoffDate.getMonth() - periodMonths);

  // Find the oldest record within the period
  const oldest = sorted.find(r => new Date(r.recordedAt) <= cutoffDate) || sorted[sorted.length - 1];

  if (oldest === latest) return null;

  const delta = calculateDelta(latest.businessValue, oldest.businessValue);
  return {
    ...delta,
    period: `${periodMonths}mo`,
  };
}

