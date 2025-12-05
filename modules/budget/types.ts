/**
 * Forecast vs Actuals Module Types
 */

export type StatementType = 'income_statement' | 'balance_sheet';

export type ForecastMethodologyType =
  | 'straight_line'
  | 'linear_trend'
  | 'growth_rate'
  | 'seasonal'
  | 'percent_of_revenue'
  | 'driver_based'
  | 'manual'
  | 'run_rate'
  | 'moving_average';

export interface ForecastLineItem {
  id: string;
  companyId: string;
  statementType: StatementType;
  lineCode: string;
  lineName: string;
  lineCategory: string | null;
  lineSubcategory: string | null;
  displayOrder: number;
  isCalculated: boolean;
  calculationFormula: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ForecastHistoricalEntry {
  id: string;
  companyId: string;
  lineItemId: string;
  periodYear: number;
  periodMonth: number;
  amount: number;
  importBatchId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ForecastActualEntry {
  id: string;
  companyId: string;
  lineItemId: string;
  periodYear: number;
  periodMonth: number;
  actualAmount: number;
  importBatchId: string | null;
  isRestated: boolean;
  priorAmount: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface ForecastMethodologyConfig {
  id: string;
  companyId: string;
  lineItemId: string;
  methodology: ForecastMethodologyType;
  parameters: Record<string, any>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ForecastProjection {
  id: string;
  companyId: string;
  lineItemId: string;
  periodYear: number;
  periodMonth: number;
  forecastAmount: number;
  methodologyUsed: ForecastMethodologyType;
  methodologyParams: Record<string, any> | null;
  forecastVersion: number;
  generatedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface VarianceRecord {
  id: string;
  companyId: string;
  lineItemId: string;
  periodYear: number;
  periodMonth: number;
  isRestated?: boolean;
  forecastAmount: number | null;
  actualAmount: number | null;
  varianceAmount: number | null;
  variancePercent: number | null;
  priorYearActual: number | null;
  priorYearVariance: number | null;
  priorYearVariancePercent: number | null;
  ytdForecast: number | null;
  ytdActual: number | null;
  ytdVariance: number | null;
  ytdVariancePercent: number | null;
  calculatedAt: string;
}

export interface ImportResult {
  processedRows: number;
  createdLineItems: number;
  updatedLineItems: number;
  insertedRecords: number;
  restatedRecords?: number;
  batchId?: string;
  warnings?: string[];
}

export interface ForecastMetricSummary {
  period: string;
  totalForecast: number;
  totalActual: number;
  variance: number;
  variancePercent: number;
  priorYearActual: number;
}

export interface YtdComparison {
  year: number;
  forecast: number;
  actual: number;
  variance: number;
  variancePercent: number;
}

export interface ForecastDashboardState {
  currentMonth: string;
  selectedStatement: StatementType;
  showYtd: boolean;
  showPriorYear: boolean;
}

export interface ForecastScenario {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  methodologyOverrides: Record<string, ForecastMethodologyConfig>;
}

