// ============================================================================
// LABOR CAPACITY MODULE CONSTANTS
// ============================================================================

// Standard working hours
export const HOURS_PER_DAY = 8;
export const DAYS_PER_WEEK = 5;
export const WEEKS_PER_YEAR = 52;
export const HOURS_PER_WEEK = HOURS_PER_DAY * DAYS_PER_WEEK; // 40
export const HOURS_PER_YEAR = HOURS_PER_WEEK * WEEKS_PER_YEAR; // 2080

// Default values
export const DEFAULT_BURDEN_MULTIPLIER = 1.16; // 16% burden (taxes, benefits, insurance)
export const DEFAULT_UTILIZATION_TARGET = 0.85; // 85% utilization
export const DEFAULT_ANNUAL_PTO_HOURS = 80; // 2 weeks PTO
export const DEFAULT_FTE = 1.0;

// Working days per month (average)
export const WORKING_DAYS_PER_MONTH: Record<number, number> = {
  0: 22,  // January
  1: 20,  // February
  2: 23,  // March
  3: 22,  // April
  4: 22,  // May
  5: 21,  // June
  6: 23,  // July
  7: 22,  // August
  8: 21,  // September
  9: 23,  // October
  10: 21, // November
  11: 22, // December
};

// Default departments
export const DEFAULT_DEPARTMENTS = [
  { name: 'Field Operations', isProductive: true, sortOrder: 1 },
  { name: 'Shop', isProductive: true, sortOrder: 2 },
  { name: 'Engineering', isProductive: true, sortOrder: 3 },
  { name: 'Project Management', isProductive: false, sortOrder: 4 },
  { name: 'Administration', isProductive: false, sortOrder: 5 },
  { name: 'Sales', isProductive: false, sortOrder: 6 },
];

// Burden rate breakdown (for reference/tooltips)
export const BURDEN_BREAKDOWN = {
  fica: 0.0765, // Social Security + Medicare
  futa: 0.006,  // Federal unemployment
  suta: 0.027,  // State unemployment (varies)
  workersComp: 0.02, // Workers comp (varies by industry)
  healthInsurance: 0.03, // Health insurance contribution
  retirement: 0.02, // 401k match
  // Total: ~16%
};

// Color palette for departments
export const DEPARTMENT_COLORS = [
  '#f97316', // Orange
  '#3b82f6', // Blue
  '#10b981', // Emerald
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#14b8a6', // Teal
  '#f59e0b', // Amber
  '#6366f1', // Indigo
];

// Utilization thresholds for styling
export const UTILIZATION_THRESHOLDS = {
  low: 0.6,    // Below 60% = red (underutilized)
  target: 0.85, // 85% = target
  high: 0.95,  // Above 95% = orange (overworked)
};

// Formatting options
export const CURRENCY_FORMAT = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export const CURRENCY_FORMAT_DECIMAL = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const HOURS_FORMAT = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export const PERCENT_FORMAT = new Intl.NumberFormat('en-US', {
  style: 'percent',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

