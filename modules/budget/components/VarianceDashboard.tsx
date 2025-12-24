import React, { useMemo, useState } from 'react';
import { ForecastLineItem, StatementType } from '../types';
import type { useForecastVariance } from '../hooks/useForecastVariance';

interface VarianceDashboardProps {
  lineItems: ForecastLineItem[];
  varianceHook: ReturnType<typeof useForecastVariance>;
}

function formatCurrency(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '—';
  }
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
}

function formatPercent(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '—';
  }
  return `${value.toFixed(1)}%`;
}

const VarianceDashboard: React.FC<VarianceDashboardProps> = ({ lineItems, varianceHook }) => {
  const {
    currentPeriod,
    setCurrentPeriod,
    rows,
    summary,
    loading,
    error,
    periodOptions,
    restatedCount,
  } = varianceHook;

  const [statementFilter, setStatementFilter] = useState<'all' | StatementType>('all');
  const lineStatementMap = useMemo(() => {
    const map = new Map<string, StatementType>();
    lineItems.forEach((line) => map.set(line.id, line.statementType));
    return map;
  }, [lineItems]);

  const filteredRows = statementFilter === 'all'
    ? rows
    : rows.filter((row) => lineStatementMap.get(row.lineItemId) === statementFilter);

  const topRows = [...filteredRows]
    .sort((a, b) => Math.abs((b.variance ?? 0)) - Math.abs((a.variance ?? 0)))
    .slice(0, 8);

  const statementSummaries = useMemo(() => {
    const totals: Record<'income_statement' | 'balance_sheet', { forecast: number; actual: number; variance: number }> = {
      income_statement: { forecast: 0, actual: 0, variance: 0 },
      balance_sheet: { forecast: 0, actual: 0, variance: 0 },
    };
    rows.forEach((row) => {
      const statement = lineStatementMap.get(row.lineItemId) ?? 'income_statement';
      totals[statement].forecast += row.forecast;
      totals[statement].actual += row.actual ?? 0;
      totals[statement].variance += row.variance ?? 0;
    });
    return totals;
  }, [rows, lineStatementMap]);

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-orange-600 uppercase tracking-[0.2em] mb-2">
            Forecast vs Actuals
          </p>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Variance Dashboard</h2>
          <p className="text-slate-600 dark:text-slate-400 max-w-3xl mt-2">
            Compare current month, year-to-date, and prior-year performance for every forecasted account.
            Actuals automatically override forecasted values once imports arrive. Restatements are highlighted.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm text-slate-500">Period</label>
          <select
            value={currentPeriod}
            onChange={(event) => setCurrentPeriod(event.target.value)}
            className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2 text-sm text-slate-900 dark:text-white"
          >
            {periodOptions.map((period) => (
              <option key={period} value={period}>
                {period}
              </option>
            ))}
          </select>
        </div>
      </header>

      {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</div>}

      {summary ? (
        <div className="grid gap-4 md:grid-cols-3">
          <SummaryCard
            title="Current Period"
            forecast={summary.totalForecast}
            actual={summary.totalActual}
            variance={summary.totalVariance}
            variancePercent={summary.totalVariancePercent}
          />
          <SummaryCard
            title="Year to Date"
            forecast={summary.ytdForecast}
            actual={summary.ytdActual}
            variance={summary.ytdVariance}
            variancePercent={summary.ytdVariancePercent}
          />
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
            <p className="text-xs uppercase text-slate-500 tracking-wider mb-1">Data Health</p>
            <p className="text-3xl font-bold text-slate-900 dark:text-white">{rows.length}</p>
            <p className="text-sm text-slate-500">Lines synced this month</p>
            <div className="mt-4 flex items-center gap-2 text-sm">
              <span className="inline-flex items-center justify-center w-2 h-2 rounded-full bg-emerald-500" />
              {restatedCount === 0 ? (
                <span className="text-emerald-600">No restatements detected</span>
              ) : (
                <span className="text-amber-600">{restatedCount} restated line(s)</span>
              )}
            </div>
          </div>
        </div>
      ) : loading ? (
        <div className="text-sm text-slate-500">Loading variance...</div>
      ) : (
        <div className="text-sm text-slate-500">No variance data yet. Import historicals and actuals to begin.</div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <StatementCard
          title="Income Statement"
          data={statementSummaries.income_statement}
          active={statementFilter === 'income_statement' || statementFilter === 'all'}
          onFilter={() => setStatementFilter((prev) => (prev === 'income_statement' ? 'all' : 'income_statement'))}
        />
        <StatementCard
          title="Balance Sheet"
          data={statementSummaries.balance_sheet}
          active={statementFilter === 'balance_sheet' || statementFilter === 'all'}
          onFilter={() => setStatementFilter((prev) => (prev === 'balance_sheet' ? 'all' : 'balance_sheet'))}
        />
      </div>

      {topRows.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Largest Variance Drivers</h3>
            <span className="text-sm text-slate-500">
              {topRows.length} of {filteredRows.length} lines ({statementFilter === 'all' ? 'All statements' : statementFilter === 'income_statement' ? 'Income Statement' : 'Balance Sheet'})
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 uppercase text-xs tracking-wider">
                <tr>
                  <th className="px-6 py-3 text-left">Line Item</th>
                  <th className="px-6 py-3 text-right">Forecast</th>
                  <th className="px-6 py-3 text-right">Actual</th>
                  <th className="px-6 py-3 text-right">Variance</th>
                  <th className="px-6 py-3 text-right">Variance %</th>
                  <th className="px-6 py-3 text-right">YTD Var</th>
                  <th className="px-6 py-3 text-right">Prior Year</th>
                </tr>
              </thead>
              <tbody>
                {topRows.map((row) => (
                  <tr
                    key={row.lineItemId}
                    className="border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50/60 dark:hover:bg-slate-800/40"
                  >
                    <td className="px-6 py-3">
                      <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                        {row.lineName}
                        {row.restated && (
                          <span className="text-[10px] uppercase tracking-wide bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                            Restated
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">Code {row.lineCode || '-'}</p>
                    </td>
                    <td className="px-6 py-3 text-right text-slate-500">{formatCurrency(row.forecast)}</td>
                    <td className="px-6 py-3 text-right text-slate-900 dark:text-white">
                      {formatCurrency(row.actual)}
                    </td>
                    <td className={`px-6 py-3 text-right font-semibold ${row.variance && row.variance < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                      {formatCurrency(row.variance)}
                    </td>
                    <td className="px-6 py-3 text-right text-slate-500">{formatPercent(row.variancePercent)}</td>
                    <td className="px-6 py-3 text-right text-slate-500">{formatCurrency(row.ytdVariance)}</td>
                    <td className="px-6 py-3 text-right text-slate-500">{formatCurrency(row.priorYearActual)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
};

const SummaryCard: React.FC<{
  title: string;
  forecast: number;
  actual: number;
  variance: number;
  variancePercent: number | null;
}> = ({ title, forecast, actual, variance, variancePercent }) => {
  const positive = variance <= 0;
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
      <p className="text-xs uppercase text-slate-500 tracking-wider">{title}</p>
      <div className="mt-2 grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-slate-500">Forecast</p>
          <p className="text-lg font-semibold text-slate-900 dark:text-white">{formatCurrency(forecast)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Actual</p>
          <p className="text-lg font-semibold text-slate-900 dark:text-white">{formatCurrency(actual)}</p>
        </div>
      </div>
      <div className={`mt-3 p-3 rounded-xl ${positive ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
        <p className="text-xs uppercase tracking-wider">Variance</p>
        <p className="text-2xl font-bold">
          {formatCurrency(variance)} <span className="text-sm font-medium">{formatPercent(variancePercent)}</span>
        </p>
      </div>
    </div>
  );
};

const StatementCard: React.FC<{
  title: string;
  data: { forecast: number; actual: number; variance: number };
  active: boolean;
  onFilter: () => void;
}> = ({ title, data, active, onFilter }) => {
  const variancePercent = data.forecast !== 0 ? (data.variance / data.forecast) * 100 : null;
  return (
    <button
      type="button"
      onClick={onFilter}
      className={`text-left rounded-2xl border px-5 py-4 transition-all ${
        active
          ? 'border-wip-gold bg-wip-card dark:bg-wip-gold/20 text-slate-900 dark:text-white'
          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200'
      }`}
    >
      <p className="text-xs uppercase tracking-wider text-slate-500">{title}</p>
      <div className="mt-2 flex items-baseline gap-3">
        <p className="text-2xl font-bold">{formatCurrency(data.actual)}</p>
        <span className="text-sm text-slate-500">vs {formatCurrency(data.forecast)}</span>
      </div>
      <p className={`mt-2 text-sm font-semibold ${data.variance < 0 ? 'text-emerald-600' : 'text-red-600'}`}>
        {formatCurrency(data.variance)} · {formatPercent(variancePercent)}
      </p>
      <p className="text-xs text-slate-500 mt-1">Click to filter the table</p>
    </button>
  );
};

export default VarianceDashboard;

