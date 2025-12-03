import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import {
  ForecastLineItem,
  ForecastMethodologyConfig,
  ForecastMethodologyType,
} from '../types';
import {
  calculateLineForecast,
  ForecastPoint,
  HistoricalPoint,
} from '../lib/forecastCalculations';
import { getDefaultParameters } from '../lib/forecastMethodologies';

interface SeriesMap {
  [lineItemId: string]: HistoricalPoint[];
}

interface ForecastRunSummary {
  version: number;
  linesProcessed: number;
  totalPoints: number;
  persisted: boolean;
  completedAt: string;
}

function chunkArray<T>(items: T[], size = 500): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

function combineSeries(historical: HistoricalPoint[] = [], actuals: HistoricalPoint[] = []) {
  const map = new Map<string, number>();
  historical.forEach((point) => map.set(point.period, point.amount));
  actuals.forEach((point) => map.set(point.period, point.amount));
  return Array.from(map.entries())
    .map(([period, amount]) => ({ period, amount }))
    .sort((a, b) => a.period.localeCompare(b.period));
}

export function useForecastEngine(companyId: string | null) {
  const [historicalSeries, setHistoricalSeries] = useState<SeriesMap>({});
  const [actualSeries, setActualSeries] = useState<SeriesMap>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [lastRunSummary, setLastRunSummary] = useState<ForecastRunSummary | null>(null);

  const fetchSeries = useCallback(async () => {
    if (!companyId) {
      setHistoricalSeries({});
      setActualSeries({});
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [historicalRes, actualRes] = await Promise.all([
        supabase
          .from('forecast_historical_data')
          .select('line_item_id, period_year, period_month, amount')
          .eq('company_id', companyId),
        supabase
          .from('forecast_actuals')
          .select('line_item_id, period_year, period_month, actual_amount')
          .eq('company_id', companyId),
      ]);

      if (historicalRes.error) throw historicalRes.error;
      if (actualRes.error) throw actualRes.error;

      const histMap: SeriesMap = {};
      (historicalRes.data || []).forEach((row) => {
        const period = `${row.period_year}-${String(row.period_month).padStart(2, '0')}`;
        histMap[row.line_item_id] = histMap[row.line_item_id] || [];
        histMap[row.line_item_id].push({ period, amount: Number(row.amount) });
      });

      const actualMap: SeriesMap = {};
      (actualRes.data || []).forEach((row) => {
        const period = `${row.period_year}-${String(row.period_month).padStart(2, '0')}`;
        actualMap[row.line_item_id] = actualMap[row.line_item_id] || [];
        actualMap[row.line_item_id].push({ period, amount: Number(row.actual_amount) });
      });

      setHistoricalSeries(histMap);
      setActualSeries(actualMap);
    } catch (err: any) {
      console.error('[useForecastEngine] fetch series failed', err);
      setError(err.message || 'Failed to load historical data');
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    fetchSeries();
  }, [fetchSeries]);

  const getSeriesForLine = useCallback(
    (lineItemId: string) => {
      return combineSeries(historicalSeries[lineItemId], actualSeries[lineItemId]);
    },
    [historicalSeries, actualSeries]
  );

  const runForecast = useCallback(
    async ({
      lineItems,
      configs,
      months = 12,
      persist = true,
    }: {
      lineItems: ForecastLineItem[];
      configs: Record<string, ForecastMethodologyConfig>;
      months?: number;
      persist?: boolean;
    }) => {
      if (!companyId) throw new Error('Select a company first.');

      setRunning(true);
      setError(null);

      try {
        const lineCodeToId = new Map(lineItems.map((item) => [item.lineCode, item.id]));
        const results: Record<string, ForecastPoint[]> = {};
        const operations: any[] = [];
        const version = Math.floor(Date.now() / 1000);

        for (const line of lineItems) {
          const config = configs[line.id] ?? {
            id: `temp-${line.id}`,
            companyId,
            lineItemId: line.id,
            methodology: 'run_rate' as ForecastMethodologyType,
            parameters: getDefaultParameters('run_rate'),
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          const history = getSeriesForLine(line.id);
          const dependencies: {
            driverHistory?: HistoricalPoint[];
            driverForecast?: number[];
          } = {};

          if (config.methodology === 'percent_of_revenue') {
            const driverCode = config.parameters.revenueLineCode;
            if (driverCode && typeof driverCode === 'string') {
              const driverLineId = lineCodeToId.get(driverCode);
              if (driverLineId) {
                dependencies.driverHistory = getSeriesForLine(driverLineId);
                if (results[driverLineId]) {
                  dependencies.driverForecast = results[driverLineId].map((point) => point.value);
                }
              }
            }
          }

          const computation = calculateLineForecast({
            method: config.methodology,
            parameters: config.parameters,
            history,
            months,
            driverHistory: dependencies.driverHistory,
            driverForecast: dependencies.driverForecast,
          });

          results[line.id] = computation.points;

          if (persist) {
            computation.points.forEach((point) => {
              const [year, month] = point.period.split('-');
              operations.push({
                company_id: companyId,
                line_item_id: line.id,
                period_year: Number(year),
                period_month: Number(month),
                forecast_amount: point.value,
                methodology_used: config.methodology,
                methodology_params: config.parameters,
                forecast_version: version,
                generated_at: new Date().toISOString(),
              });
            });
          }
        }

        if (persist && operations.length) {
          for (const chunk of chunkArray(operations)) {
            const { error: insertError } = await supabase
              .from('forecast_projections')
              .upsert(chunk, {
                onConflict: 'company_id,line_item_id,period_year,period_month,forecast_version',
              });

            if (insertError) throw insertError;
          }
        }

        const summary: ForecastRunSummary = {
          version,
          linesProcessed: lineItems.length,
          totalPoints: Object.values(results).reduce((sum, points) => sum + points.length, 0),
          persisted: persist,
          completedAt: new Date().toISOString(),
        };
        setLastRunSummary(summary);

        return results;
      } catch (err: any) {
        console.error('[useForecastEngine] run forecast failed', err);
        setError(err.message || 'Failed to run forecast');
        throw err;
      } finally {
        setRunning(false);
      }
    },
    [companyId, getSeriesForLine]
  );

  const context = useMemo(
    () => ({
      historicalSeries,
      actualSeries,
    }),
    [historicalSeries, actualSeries]
  );

  return {
    loading,
    error,
    running,
    lastRunSummary,
    refresh: fetchSeries,
    getSeriesForLine,
    runForecast,
    context,
  };
}

