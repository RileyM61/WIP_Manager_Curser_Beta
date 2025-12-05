import { ForecastMethodologyType } from '../types';
import { getMethodDefinition } from './forecastMethodologies';

export interface HistoricalPoint {
  period: string; // YYYY-MM
  amount: number;
}

export interface ForecastPoint {
  period: string;
  value: number;
  source: 'forecast';
}

export interface ForecastInput {
  method: ForecastMethodologyType;
  parameters: Record<string, any>;
  history: HistoricalPoint[];
  months?: number;
  startPeriod?: string;
  driverHistory?: HistoricalPoint[];
  driverForecast?: number[];
  manualOverrides?: Record<string, number>;
}

export interface ForecastComputation {
  points: ForecastPoint[];
  notes: string[];
}

function parsePeriod(period: string) {
  const [year, month] = period.split('-').map(Number);
  return { year, month };
}

function formatPeriod(year: number, month: number) {
  const adjusted = ((year * 12 + (month - 1)));
  const finalYear = Math.floor(adjusted / 12);
  const finalMonth = (adjusted % 12) + 1;
  return `${finalYear}-${String(finalMonth).padStart(2, '0')}`;
}

function getNextPeriod(period: string) {
  const { year, month } = parsePeriod(period);
  return formatPeriod(year, month + 1);
}

function generateFuturePeriods(startPeriod: string, months: number) {
  const periods: string[] = [];
  let current = startPeriod;
  for (let i = 0; i < months; i++) {
    periods.push(current);
    current = getNextPeriod(current);
  }
  return periods;
}

function sortHistory(history: HistoricalPoint[]) {
  return [...history].sort((a, b) => a.period.localeCompare(b.period));
}

function average(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function seasonalAverage(history: HistoricalPoint[], targetMonth: number, years: number) {
  const filtered = sortHistory(history)
    .filter((point) => parsePeriod(point.period).month === targetMonth)
    .slice(-years);
  if (!filtered.length) return null;
  return average(filtered.map((point) => point.amount));
}

function linearTrend(history: HistoricalPoint[], lookback: number) {
  const sorted = sortHistory(history).slice(-lookback);
  const n = sorted.length;
  if (n === 0) return { slope: 0, intercept: 0, lastIndex: 0, lastValue: 0 };

  const values = sorted.map((point) => point.amount);
  const xValues = values.map((_, index) => index);
  const sumX = xValues.reduce((sum, x) => sum + x, 0);
  const sumY = values.reduce((sum, y) => sum + y, 0);
  const sumXY = xValues.reduce((sum, x, index) => sum + x * values[index], 0);
  const sumXX = xValues.reduce((sum, x) => sum + x * x, 0);

  const denominator = n * sumXX - sumX * sumX;
  const slope = denominator === 0 ? 0 : (n * sumXY - sumX * sumY) / denominator;
  const intercept = (sumY - slope * sumX) / n;

  return {
    slope,
    intercept,
    lastIndex: xValues[xValues.length - 1],
    lastValue: values[values.length - 1],
  };
}

function deriveRatio(lineHistory: HistoricalPoint[], driverHistory?: HistoricalPoint[]) {
  if (!driverHistory || !driverHistory.length) return null;
  const map = new Map(driverHistory.map((point) => [point.period, point.amount]));

  const ratios = lineHistory
    .filter((point) => map.has(point.period))
    .map((point) => {
      const driverValue = map.get(point.period)!;
      return driverValue === 0 ? null : point.amount / driverValue;
    })
    .filter((ratio): ratio is number => ratio !== null && Number.isFinite(ratio));

  if (!ratios.length) return null;
  return average(ratios) * 100; // convert to %
}

export function calculateLineForecast(input: ForecastInput): ForecastComputation {
  const months = input.months ?? 12;
  const sortedHistory = sortHistory(input.history);
  const lastPeriod = sortedHistory.length ? sortedHistory[sortedHistory.length - 1].period : '2024-12';
  const startPeriod = input.startPeriod ?? getNextPeriod(lastPeriod);
  const periods = generateFuturePeriods(startPeriod, months);
  const notes: string[] = [];

  const manualOverrides = input.manualOverrides ?? {};

  const results = periods.map((period, index) => {
    if (manualOverrides[period] !== undefined) {
      return {
        period,
        value: manualOverrides[period]!,
        source: 'forecast' as const,
      };
    }

    switch (input.method) {
      case 'straight_line': {
        const lookback = Number(input.parameters.lookbackMonths) || 12;
        const values = sortedHistory.slice(-lookback).map((point) => point.amount);
        const value = average(values);
        return { period, value, source: 'forecast' as const };
      }
      case 'run_rate': {
        const lookback = Number(input.parameters.lookbackMonths) || 3;
        const values = sortedHistory.slice(-lookback).map((point) => point.amount);
        const value = average(values);
        return { period, value, source: 'forecast' as const };
      }
      case 'moving_average': {
        const window = Number(input.parameters.window) || 6;
        const combined = [...sortedHistory.map((point) => point.amount)];
        // include previously forecast values for rolling effect
        for (let i = 0; i < index; i++) {
          combined.push(results[i].value);
        }
        const windowValues = combined.slice(-window);
        const value = average(windowValues);
        return { period, value, source: 'forecast' as const };
      }
      case 'linear_trend': {
        const lookback = Number(input.parameters.lookbackMonths) || 18;
        const trend = linearTrend(sortedHistory, lookback);
        const nextIndex = trend.lastIndex + index + 1;
        const value = trend.intercept + trend.slope * nextIndex;
        return { period, value, source: 'forecast' as const };
      }
      case 'growth_rate': {
        const annualRate = Number(input.parameters.annualRate) || 0;
        const compounding = input.parameters.compounding === 'annual' ? 'annual' : 'monthly';
        const lastValue = sortedHistory.length ? sortedHistory[sortedHistory.length - 1].amount : 0;
        const decimal = annualRate / 100;
        const monthlyRate = compounding === 'monthly' ? Math.pow(1 + decimal, 1 / 12) - 1 : decimal / 12;
        const value = lastValue * Math.pow(1 + monthlyRate, index + 1);
        return { period, value, source: 'forecast' as const };
      }
      case 'seasonal': {
        const years = Number(input.parameters.seasonalityYears) || 3;
        const growth = Number(input.parameters.seasonalGrowth) || 0;
        const { month } = parsePeriod(period);
        const seasonalValue = seasonalAverage(sortedHistory, month, years);
        const base = seasonalValue ?? average(sortedHistory.map((point) => point.amount));
        const value = base * (1 + growth / 100);
        return { period, value, source: 'forecast' as const };
      }
      case 'percent_of_revenue': {
        const defaultRatio = deriveRatio(sortedHistory, input.driverHistory);
        const pct = Number(input.parameters.percentage || defaultRatio || 0) / 100;
        const driverValue =
          input.driverForecast?.[index] ??
          input.driverHistory?.[input.driverHistory.length - 1]?.amount ??
          0;
        const value = driverValue * pct;
        if (!input.parameters.percentage && defaultRatio !== null) {
          notes.push(`Auto-derived ratio ${defaultRatio.toFixed(1)}% from history`);
        }
        return { period, value, source: 'forecast' as const };
      }
      case 'driver_based': {
        const baseUnits = Number(input.parameters.baseUnits) || 0;
        const unitGrowth = Number(input.parameters.unitGrowth) || 0;
        const ratePerUnit = Number(input.parameters.ratePerUnit) || 0;
        const units = baseUnits * Math.pow(1 + unitGrowth / 100, index + 1);
        const value = units * ratePerUnit;
        return { period, value, source: 'forecast' as const };
      }
      case 'manual': {
        const manualValue =
          manualOverrides[period] !== undefined
            ? manualOverrides[period]
            : Number(input.parameters.monthlyValue) || 0;
        if (input.parameters.notes) {
          notes.push(String(input.parameters.notes));
        }
        return { period, value: manualValue, source: 'forecast' as const };
      }
      default:
        return { period, value: 0, source: 'forecast' as const };
    }
  });

  const definition = getMethodDefinition(input.method);
  if (definition) {
    notes.push(`${definition.name} using ${definition.parameters.map((param) => `${param.label}: ${input.parameters[param.key] ?? param.defaultValue}`).join(', ')}`);
  }

  return {
    points: results,
    notes,
  };
}

