import ForecastVsActualsPage from './components/ForecastVsActualsPage';

/**
 * Forecast vs Actuals Analysis Module
 */
export const BUDGET_MODULE = {
  id: 'budget' as const,
  name: 'Forecast vs Actuals',
  description: 'Build rolling forecasts and compare Income Statement & Balance Sheet variances',
  comingSoon: false,
};

export { ForecastVsActualsPage };
export * from './types';
