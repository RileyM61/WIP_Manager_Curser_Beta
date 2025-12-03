import { describe, expect, it } from 'vitest';
import { calculateLineForecast } from '../forecastCalculations';

const buildHistory = () => [
  { period: '2024-01', amount: 10000 },
  { period: '2024-02', amount: 11000 },
  { period: '2024-03', amount: 9000 },
  { period: '2024-04', amount: 12000 },
  { period: '2024-05', amount: 11500 },
  { period: '2024-06', amount: 11800 },
];

describe('calculateLineForecast', () => {
  it('uses straight-line average for stable lines', () => {
    const result = calculateLineForecast({
      method: 'straight_line',
      parameters: { lookbackMonths: 3 },
      history: buildHistory(),
      months: 2,
      startPeriod: '2024-07',
    });

    expect(result.points).toHaveLength(2);
    // Average of Apr-Jun: (12000+11500+11800)/3 = 11766.66
    expect(result.points[0].value).toBeCloseTo(11766.6667, 3);
  });

  it('applies compound growth for growth_rate method', () => {
    const result = calculateLineForecast({
      method: 'growth_rate',
      parameters: { annualRate: 12, compounding: 'monthly' },
      history: buildHistory(),
      months: 1,
      startPeriod: '2024-07',
    });

    const lastActual = 11800;
    const monthlyRate = Math.pow(1 + 0.12, 1 / 12) - 1;
    const expected = lastActual * (1 + monthlyRate);
    expect(result.points[0].value).toBeCloseTo(expected, 3);
  });

  it('derives percent-of-revenue ratio when not provided', () => {
    const revenueHistory = [
      { period: '2024-01', amount: 50000 },
      { period: '2024-02', amount: 52000 },
      { period: '2024-03', amount: 51000 },
      { period: '2024-04', amount: 53000 },
    ];

    const expenseHistory = [
      { period: '2024-01', amount: 5000 },
      { period: '2024-02', amount: 5200 },
      { period: '2024-03', amount: 5100 },
      { period: '2024-04', amount: 5300 },
    ];

    const result = calculateLineForecast({
      method: 'percent_of_revenue',
      parameters: { revenueLineCode: 'REV_TOTAL' },
      history: expenseHistory,
      driverHistory: revenueHistory,
      driverForecast: [54000],
      months: 1,
      startPeriod: '2024-05',
    });

    const ratio = 0.1; // 10%
    expect(result.points[0].value).toBeCloseTo(5400, 0);
  });
});

