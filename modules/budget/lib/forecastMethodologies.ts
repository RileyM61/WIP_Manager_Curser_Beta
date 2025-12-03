import { ForecastMethodologyType } from '../types';

export type ParameterType = 'number' | 'percent' | 'select' | 'text';

export interface MethodParameter {
  key: string;
  label: string;
  type: ParameterType;
  defaultValue: number | string;
  helperText?: string;
  options?: { label: string; value: string }[];
  min?: number;
  max?: number;
  step?: number;
}

export interface ForecastMethodDefinition {
  id: ForecastMethodologyType;
  name: string;
  description: string;
  formulaSummary: string;
  bestFor: string[];
  parameters: MethodParameter[];
}

export const FORECAST_METHOD_DEFINITIONS: Record<ForecastMethodologyType, ForecastMethodDefinition> = {
  straight_line: {
    id: 'straight_line',
    name: 'Straight-Line Average',
    description: 'Uses the average of the last N months to project a flat run-rate.',
    formulaSummary: 'forecast = avg(last N months)',
    bestFor: ['Stable expense lines', 'Fixed monthly fees'],
    parameters: [
      {
        key: 'lookbackMonths',
        label: 'Lookback Months',
        type: 'number',
        defaultValue: 12,
        helperText: 'How many historical months to average.',
        min: 3,
        max: 36,
        step: 1,
      },
    ],
  },
  linear_trend: {
    id: 'linear_trend',
    name: 'Linear Trend',
    description: 'Fits a best-fit line through recent history to capture gradual growth or decline.',
    formulaSummary: 'forecast = intercept + slope * month_index',
    bestFor: ['Overhead accounts with gradual change', 'Labor costs'],
    parameters: [
      {
        key: 'lookbackMonths',
        label: 'Lookback Months',
        type: 'number',
        defaultValue: 18,
        helperText: 'More months smooths noise, fewer months react faster.',
        min: 6,
        max: 36,
        step: 1,
      },
    ],
  },
  growth_rate: {
    id: 'growth_rate',
    name: 'Fixed Growth Rate',
    description: 'Applies a compounding monthly or annual growth rate to the latest actual.',
    formulaSummary: 'forecast = last_actual * (1 + rate) ^ periods',
    bestFor: ['Revenue projections', 'Intentional ramp-up/down scenarios'],
    parameters: [
      {
        key: 'annualRate',
        label: 'Annual Growth %',
        type: 'percent',
        defaultValue: 5,
        helperText: 'Positive or negative percentage applied annually.',
        min: -50,
        max: 200,
        step: 0.5,
      },
      {
        key: 'compounding',
        label: 'Compounding',
        type: 'select',
        defaultValue: 'monthly',
        options: [
          { label: 'Monthly', value: 'monthly' },
          { label: 'Annual', value: 'annual' },
        ],
        helperText: 'Monthly splits the annual rate evenly across months.',
      },
    ],
  },
  seasonal: {
    id: 'seasonal',
    name: 'Seasonal Pattern',
    description: 'Uses prior-year seasonality for each calendar month with optional growth overlay.',
    formulaSummary: 'forecast = avg(same month prior years) * (1 + growth)',
    bestFor: ['Revenue tied to seasonality', 'Fuel, utility, or insurance peaks'],
    parameters: [
      {
        key: 'seasonalityYears',
        label: 'Seasons to Average',
        type: 'number',
        defaultValue: 3,
        min: 1,
        max: 5,
        step: 1,
        helperText: 'Number of prior years per month to include.',
      },
      {
        key: 'seasonalGrowth',
        label: 'Seasonal Growth %',
        type: 'percent',
        defaultValue: 0,
        helperText: 'Optional uplift applied to every month.',
        min: -50,
        max: 100,
        step: 0.5,
      },
    ],
  },
  percent_of_revenue: {
    id: 'percent_of_revenue',
    name: 'Percent of Revenue',
    description: 'Keeps the line proportional to forecasted revenue or another driver.',
    formulaSummary: 'forecast = revenue_forecast * pct',
    bestFor: ['Variable SG&A', 'Commissions', 'Job-cost buckets tied to sales'],
    parameters: [
      {
        key: 'percentage',
        label: 'Percentage of Revenue',
        type: 'percent',
        defaultValue: 15,
        helperText: 'Auto-derived from history if left blank.',
        min: 0,
        max: 100,
        step: 0.5,
      },
      {
        key: 'revenueLineCode',
        label: 'Revenue Line Code',
        type: 'text',
        defaultValue: 'REV_TOTAL',
        helperText: 'Used to link the driver line for ratio calculations.',
      },
    ],
  },
  driver_based: {
    id: 'driver_based',
    name: 'Driver-Based',
    description: 'Forecasts units * rate, ideal for headcount or production-driven costs.',
    formulaSummary: 'forecast = (base_units * (1 + growth)^t) * rate',
    bestFor: ['Headcount-driven costs', 'Equipment hours', 'Production-based revenue'],
    parameters: [
      {
        key: 'baseUnits',
        label: 'Current Units',
        type: 'number',
        defaultValue: 10,
        helperText: 'Starting driver units (people, hours, etc.).',
        min: 0,
        step: 1,
      },
      {
        key: 'unitGrowth',
        label: 'Unit Growth % (Monthly)',
        type: 'percent',
        defaultValue: 0,
        helperText: 'Monthly growth/decline in driver units.',
        min: -50,
        max: 100,
        step: 0.5,
      },
      {
        key: 'ratePerUnit',
        label: 'Rate per Unit',
        type: 'number',
        defaultValue: 5000,
        helperText: 'Cost or revenue per driver unit.',
        min: 0,
        step: 100,
      },
    ],
  },
  manual: {
    id: 'manual',
    name: 'Manual / Override',
    description: 'Allows explicit monthly values or a fixed override per period.',
    formulaSummary: 'forecast = user-supplied monthly value',
    bestFor: ['One-off adjustments', 'Known contract schedules'],
    parameters: [
      {
        key: 'monthlyValue',
        label: 'Monthly Value',
        type: 'number',
        defaultValue: 0,
        helperText: 'Applies the same amount every month unless overrides are provided.',
        step: 100,
      },
      {
        key: 'notes',
        label: 'Assumption Notes',
        type: 'text',
        defaultValue: '',
        helperText: 'Document manual rationale.',
      },
    ],
  },
  run_rate: {
    id: 'run_rate',
    name: 'Run-Rate (Last N Months)',
    description: 'Averages the most recent months to capture current run-rate.',
    formulaSummary: 'forecast = avg(last N actuals)',
    bestFor: ['Payroll', 'Subscriptions', 'Recurring expenses'],
    parameters: [
      {
        key: 'lookbackMonths',
        label: 'Recent Months',
        type: 'number',
        defaultValue: 3,
        min: 1,
        max: 12,
        step: 1,
        helperText: 'Focus on the freshest data.',
      },
    ],
  },
  moving_average: {
    id: 'moving_average',
    name: 'Moving Average',
    description: 'Uses a rolling average that updates each forecast month to smooth volatility.',
    formulaSummary: 'forecast(t) = avg(previous window)',
    bestFor: ['Material costs', 'Volatile utilities', 'Fuel'],
    parameters: [
      {
        key: 'window',
        label: 'Window (Months)',
        type: 'number',
        defaultValue: 6,
        min: 3,
        max: 12,
        step: 1,
        helperText: 'Number of months in each moving window.',
      },
    ],
  },
};

export function getMethodDefinition(method: ForecastMethodologyType): ForecastMethodDefinition {
  return FORECAST_METHOD_DEFINITIONS[method];
}

export function getDefaultParameters(method: ForecastMethodologyType) {
  const definition = getMethodDefinition(method);
  return definition.parameters.reduce<Record<string, any>>((acc, param) => {
    acc[param.key] = param.defaultValue;
    return acc;
  }, {});
}

export const METHOD_OPTIONS = Object.values(FORECAST_METHOD_DEFINITIONS).map((method) => ({
  value: method.id,
  label: method.name,
  description: method.description,
}));

