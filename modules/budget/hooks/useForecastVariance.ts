import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { ForecastLineItem, VarianceRecord } from '../types';

interface VarianceRow {
  lineItemId: string;
  lineName: string;
  lineCode: string;
  forecast: number;
  actual: number | null;
  variance: number | null;
  variancePercent: number | null;
  ytdForecast: number;
  ytdActual: number;
  ytdVariance: number;
  ytdVariancePercent: number | null;
  priorYearActual: number | null;
  restated?: boolean;
}

interface VarianceSummary {
  totalForecast: number;
  totalActual: number;
  totalVariance: number;
  totalVariancePercent: number | null;
  ytdForecast: number;
  ytdActual: number;
  ytdVariance: number;
  ytdVariancePercent: number | null;
}

function periodKey(year: number, month: number) {
  return `${year}-${String(month).padStart(2, '0')}`;
}

function sum(values: number[]) {
  return values.reduce((acc, value) => acc + value, 0);
}

export function useForecastVariance(companyId: string | null, lineItems: ForecastLineItem[]) {
  const [currentPeriod, setCurrentPeriod] = useState(() => {
    const now = new Date();
    return periodKey(now.getFullYear(), now.getMonth() + 1);
  });
  const [rows, setRows] = useState<VarianceRow[]>([]);
  const [summary, setSummary] = useState<VarianceSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const restatedCount = useMemo(() => rows.filter((row) => row.restated).length, [rows]);

  const refresh = useCallback(async () => {
    if (!companyId) {
      setRows([]);
      setSummary(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { year, month } = (() => {
        const [y, m] = currentPeriod.split('-').map(Number);
        return { year: y, month: m };
      })();

      const { data: varianceData, error: varianceError } = await supabase
        .from('forecast_variance_cache')
        .select('*')
        .eq('company_id', companyId)
        .eq('period_year', year)
        .eq('period_month', month);

      if (varianceError) throw varianceError;

      // If cache empty, rebuild on the fly for this period
      if (!varianceData || varianceData.length === 0) {
        await rebuildCache(companyId, lineItems, currentPeriod);

        const { data: refreshedData, error: refreshError } = await supabase
          .from('forecast_variance_cache')
          .select('*')
          .eq('company_id', companyId)
          .eq('period_year', year)
          .eq('period_month', month);

        if (refreshError) throw refreshError;
        processVarianceRows(refreshedData || []);
      } else {
        processVarianceRows(varianceData);
      }
    } catch (err: any) {
      console.error('[useForecastVariance] refresh failed', err);
      setError(err.message || 'Failed to load variance data');
      setRows([]);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, [companyId, currentPeriod, lineItems]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const processVarianceRows = (data: any[]) => {
    const lineMap = new Map(lineItems.map((line) => [line.id, line]));

    const processed: VarianceRow[] = data.map((row) => {
      const line = lineMap.get(row.line_item_id);
      const variancePercent =
        row.variance_amount !== null && row.forecast_amount
          ? (row.variance_amount / row.forecast_amount) * 100
          : null;
      const ytdVariancePercent =
        row.ytd_variance !== null && row.ytd_forecast
          ? (row.ytd_variance / row.ytd_forecast) * 100
          : null;

      return {
        lineItemId: row.line_item_id,
        lineName: line?.lineName ?? row.line_item_id,
        lineCode: line?.lineCode ?? '',
        forecast: Number(row.forecast_amount ?? 0),
        actual: row.actual_amount !== null ? Number(row.actual_amount) : null,
        variance: row.variance_amount !== null ? Number(row.variance_amount) : null,
        variancePercent,
        ytdForecast: Number(row.ytd_forecast ?? 0),
        ytdActual: Number(row.ytd_actual ?? 0),
        ytdVariance: Number(row.ytd_variance ?? 0),
        ytdVariancePercent,
        priorYearActual: row.prior_year_actual !== null ? Number(row.prior_year_actual) : null,
        restated: row.is_restated ?? false,
      };
    });

    setRows(processed);

    const summaryRow: VarianceSummary = {
      totalForecast: sum(processed.map((row) => row.forecast)),
      totalActual: sum(processed.map((row) => row.actual ?? 0)),
      totalVariance: sum(processed.map((row) => row.variance ?? 0)),
      totalVariancePercent: null,
      ytdForecast: sum(processed.map((row) => row.ytdForecast)),
      ytdActual: sum(processed.map((row) => row.ytdActual)),
      ytdVariance: sum(processed.map((row) => row.ytdVariance)),
      ytdVariancePercent: null,
    };

    summaryRow.totalVariancePercent =
      summaryRow.totalForecast !== 0 ? (summaryRow.totalVariance / summaryRow.totalForecast) * 100 : null;
    summaryRow.ytdVariancePercent =
      summaryRow.ytdForecast !== 0 ? (summaryRow.ytdVariance / summaryRow.ytdForecast) * 100 : null;

    setSummary(summaryRow);
  };

  const rebuildCache = useCallback(
    async (company: string, lines: ForecastLineItem[], period: string) => {
      const [year, month] = period.split('-').map(Number);

      const { data: versionRow } = await supabase
        .from('forecast_projections')
        .select('forecast_version')
        .eq('company_id', company)
        .order('forecast_version', { ascending: false })
        .limit(1)
        .maybeSingle();

      const version = versionRow?.forecast_version ?? 1;

      const previousYear = year - 1;

      const [forecastRes, actualRes, forecastYtdRes, actualYtdRes, priorYearRes] = await Promise.all([
        supabase
          .from('forecast_projections')
          .select('line_item_id, period_year, period_month, forecast_amount')
          .eq('company_id', company)
          .eq('forecast_version', version)
          .eq('period_year', year)
          .eq('period_month', month),
        supabase
          .from('forecast_actuals')
          .select('line_item_id, period_year, period_month, actual_amount, is_restated')
          .eq('company_id', company)
          .eq('period_year', year)
          .eq('period_month', month),
        supabase
          .from('forecast_projections')
          .select('line_item_id, period_month, forecast_amount')
          .eq('company_id', company)
          .eq('forecast_version', version)
          .eq('period_year', year)
          .lte('period_month', month),
        supabase
          .from('forecast_actuals')
          .select('line_item_id, period_month, actual_amount')
          .eq('company_id', company)
          .eq('period_year', year)
          .lte('period_month', month),
        supabase
          .from('forecast_actuals')
          .select('line_item_id, actual_amount')
          .eq('company_id', company)
          .eq('period_year', previousYear)
          .eq('period_month', month),
      ]);

      if (forecastRes.error) throw forecastRes.error;
      if (actualRes.error) throw actualRes.error;
      if (forecastYtdRes.error) throw forecastYtdRes.error;
      if (actualYtdRes.error) throw actualYtdRes.error;
      if (priorYearRes.error) throw priorYearRes.error;

      const forecastMap = new Map<string, number>();
      const actualMap = new Map<string, { amount: number; restated: boolean }>();
      const forecastYtdMap = new Map<string, number>();
      const actualYtdMap = new Map<string, number>();
      const priorYearMap = new Map<string, number>();

      (forecastRes.data || []).forEach((row) => {
        const key = `${row.line_item_id}:${row.period_year}-${row.period_month}`;
        forecastMap.set(key, Number(row.forecast_amount));
      });

      (actualRes.data || []).forEach((row) => {
        const key = `${row.line_item_id}:${row.period_year}-${row.period_month}`;
        actualMap.set(key, { amount: Number(row.actual_amount), restated: Boolean(row.is_restated) });
      });

      (forecastYtdRes.data || []).forEach((row) => {
        const existing = forecastYtdMap.get(row.line_item_id) ?? 0;
        forecastYtdMap.set(row.line_item_id, existing + Number(row.forecast_amount || 0));
      });

      (actualYtdRes.data || []).forEach((row) => {
        const existing = actualYtdMap.get(row.line_item_id) ?? 0;
        actualYtdMap.set(row.line_item_id, existing + Number(row.actual_amount || 0));
      });

      (priorYearRes.data || []).forEach((row) => {
        priorYearMap.set(row.line_item_id, Number(row.actual_amount || 0));
      });

      const payload: VarianceRecord[] = lines.map((line) => {
        const uuid =
          typeof crypto !== 'undefined' && 'randomUUID' in crypto
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random()}`;
        const key = `${line.id}:${year}-${month}`;
        const forecast = forecastMap.get(key) ?? 0;
        const actualEntry = actualMap.get(key);
        const actual = actualEntry?.amount ?? null;
        const variance = actual !== null ? actual - forecast : null;
        const ytdForecast = forecastYtdMap.get(line.id) ?? forecast;
        const ytdActual = actualYtdMap.get(line.id) ?? (actual ?? 0);
        const ytdVariance = ytdActual - ytdForecast;
        const ytdVariancePercent = ytdForecast !== 0 ? (ytdVariance / ytdForecast) * 100 : null;
        const priorYearValue = priorYearMap.get(line.id) ?? null;
        const priorVariance =
          priorYearValue !== null && actual !== null ? actual - priorYearValue : null;
        const priorVariancePercent =
          priorYearValue && priorVariance !== null && priorYearValue !== 0
            ? (priorVariance / priorYearValue) * 100
            : null;

        return {
          id: uuid,
          companyId: company,
          lineItemId: line.id,
          periodYear: year,
          periodMonth: month,
          isRestated: actualEntry?.restated ?? false,
          forecastAmount: forecast,
          actualAmount: actual,
          varianceAmount: variance,
          variancePercent: variance !== null && forecast ? (variance / forecast) * 100 : null,
          priorYearActual: priorYearValue,
          priorYearVariance: priorVariance,
          priorYearVariancePercent: priorVariancePercent,
          ytdForecast,
          ytdActual,
          ytdVariance,
          ytdVariancePercent,
          calculatedAt: new Date().toISOString(),
        };
      });

      if (payload.length) {
        const insertPayload = payload.map((record) => ({
          company_id: record.companyId,
          line_item_id: record.lineItemId,
          period_year: record.periodYear,
          period_month: record.periodMonth,
          is_restated: actualMap.get(`${record.lineItemId}:${record.periodYear}-${record.periodMonth}`)?.restated ?? false,
          forecast_amount: record.forecastAmount,
          actual_amount: record.actualAmount,
          variance_amount: record.varianceAmount,
          variance_percent: record.variancePercent,
          prior_year_actual: record.priorYearActual,
          prior_year_variance: record.priorYearVariance,
          prior_year_variance_percent: record.priorYearVariancePercent,
          ytd_forecast: record.ytdForecast,
          ytd_actual: record.ytdActual,
          ytd_variance: record.ytdVariance,
          ytd_variance_percent: record.ytdVariancePercent,
          calculated_at: record.calculatedAt,
        }));

        const { error: upsertError } = await supabase
          .from('forecast_variance_cache')
          .upsert(insertPayload, {
            onConflict: 'company_id,line_item_id,period_year,period_month',
          });

        if (upsertError) throw upsertError;
      }
    },
    []
  );

  const periodOptions = useMemo(() => {
    const now = new Date();
    const periods: string[] = [];
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      periods.push(periodKey(date.getFullYear(), date.getMonth() + 1));
    }
    return periods;
  }, []);

  return {
    currentPeriod,
    setCurrentPeriod,
    rows,
    summary,
    loading,
    error,
    refresh,
    periodOptions,
    restatedCount,
  };
}

